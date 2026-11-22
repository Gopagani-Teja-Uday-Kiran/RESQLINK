import { createServer } from 'node:http';
import { createHash, randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, stat, unlink } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import olc from 'open-location-code';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try { loadEnvFile(resolve(root, '.env')); } catch {}
const publicAppUrl = process.env.PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
const dataDir = resolve(root, process.env.DATA_DIR || '.');
await mkdir(dataDir, { recursive: true });
const dbPath = resolve(dataDir, 'resqlink.sqlite');
const db = new DatabaseSync(dbPath);
const openLocationCode = new olc.OpenLocationCode();
const SESSION_COOKIE = 'resqlink_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const STATUS_FLOW = ['pending', 'assigned', 'enroute', 'arrived', 'transporting', 'delivered', 'completed'];
const PENDING_EMERGENCY_WINDOW_MS = 2 * 60 * 60 * 1000;
const PATIENT_ARRIVAL_RADIUS_KM = 0.1;
const MIN_HOSPITAL_DEPARTURE_PROGRESS_KM = 0.025;
const limits = new Map();

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, metadata TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS emergencies (id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, emergency_id TEXT NOT NULL REFERENCES emergencies(id), data TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL, emergency_id TEXT, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS ambulance_trip_history (id TEXT PRIMARY KEY, emergency_id TEXT NOT NULL UNIQUE, ambulance_id TEXT NOT NULL, ambulance_number TEXT NOT NULL, driver_name TEXT NOT NULL, hospital_id TEXT, hospital_name TEXT NOT NULL, hospital_address TEXT NOT NULL, emergency_type TEXT NOT NULL, reached_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS password_reset_requests (id TEXT PRIMARY KEY, user_id TEXT, email TEXT NOT NULL, token_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, expires_at TEXT NOT NULL, reviewed_at TEXT);
  CREATE INDEX IF NOT EXISTS idx_emergencies_patient_created ON emergencies(patient_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_emergency_created ON messages(emergency_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_ambulance_trip_history_driver ON ambulance_trip_history(ambulance_id, reached_at DESC);
  CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status, created_at DESC);
`);

// Older local sessions used bearer tokens in localStorage. Invalidate them as part of moving to HttpOnly cookies.
const sessionColumns = db.prepare('PRAGMA table_info(sessions)').all().map((column) => column.name);
if (sessionColumns.length && !sessionColumns.includes('token_hash')) db.exec('DROP TABLE sessions');
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);
// Legacy databases may have profiles without the users FK. Remove profile rows
// left behind by accounts deleted before the FK was added.
db.prepare('DELETE FROM profiles WHERE user_id NOT IN (SELECT id FROM users)').run();

const parse = (value) => JSON.parse(value);
const hash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const checkPassword = (password, stored) => {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return expected.length === derived.length && timingSafeEqual(derived, expected);
};
const readCookies = (req) => Object.fromEntries(String(req.headers.cookie || '').split(';').map((entry) => entry.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined).map(([key, value]) => [key, decodeURIComponent(value)]));
const cookieHeader = (req, token, maxAge) => {
  const secure = process.env.COOKIE_SECURE === 'true' || Boolean(req.socket.encrypted);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
};
const currentUser = (req) => {
  const token = readCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const now = new Date().toISOString();
  const row = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?').get(hashToken(token), now);
  return row || null;
};
const profileFor = (userId) => {
  const row = db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(userId);
  return row ? parse(row.data) : null;
};
const saveProfile = (userId, profile) => db.prepare('INSERT INTO profiles(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(userId, JSON.stringify(profile));
const getEmergency = (id) => {
  const row = db.prepare('SELECT data FROM emergencies WHERE id = ?').get(id);
  return row ? parse(row.data) : null;
};
const persistEmergency = (emergency) => db.prepare('INSERT INTO emergencies(id,patient_id,data,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(emergency.emergencyId, emergency.patientId, JSON.stringify(emergency), emergency.createdAt);
const addNotification = (userId, title, message, type, emergencyId = null) => {
  if (!userId) return;
  // Ignore stale profile references from older databases instead of allowing a
  // notification FK failure to roll back the emergency itself.
  db.prepare(`INSERT INTO notifications(id,user_id,title,message,type,emergency_id,is_read,created_at)
    SELECT ?,id,?,?,?, ?,0,? FROM users WHERE id = ?`)
    .run(randomUUID(), title, message, type, emergencyId, new Date().toISOString(), userId);
};
const canAccessEmergency = (user, emergency) => {
  const role = parse(user.metadata).role;
  if (role === 'patient') return emergency.patientId === user.id;
  if (role === 'ambulance') return emergency.ambulanceId === user.id;
  if (role === 'hospital') return emergency.hospitalId === user.id;
  return false;
};
const withCurrentHospitalLocation = (emergency) => {
  if (!emergency.hospitalId) return emergency;
  const hospital = profileFor(emergency.hospitalId);
  const existingLocation = emergency.hospitalLocation && validCoordinates(emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude);
  const profileLocation = validHospitalCoordinates(hospital)
    ? { latitude: Number(hospital.latitude), longitude: Number(hospital.longitude) }
    : null;
  const hospitalLocation = emergency.status !== 'completed' && profileLocation
    ? profileLocation
    : existingLocation ? emergency.hospitalLocation : profileLocation;
  return {
    ...emergency,
    hospitalName: hospital?.hospitalName || emergency.hospitalName || null,
    hospitalAddress: hospital?.hospitalAddress || emergency.hospitalAddress || null,
    hospitalLocation
  };
};
function assignAmbulanceHospital(emergency, ambulanceProfile) {
  const ambulanceHospitalId = ambulanceProfile?.hospitalId;
  const ambulanceHospital = ambulanceHospitalId ? profileFor(ambulanceHospitalId) : null;
  if (!ambulanceHospital || ambulanceHospital.role !== 'hospital') return false;

  // Preserve the hospital originally assigned during emergency creation.
  // Do NOT overwrite emergency.hospitalId with the ambulance's affiliated hospital.
  const hospitalId = emergency.hospitalId || ambulanceHospitalId;
  const hospital = hospitalId ? profileFor(hospitalId) : null;
  if (!hospital || hospital.role !== 'hospital') return false;

  const previousHospitalId = emergency.hospitalId;
  if (previousHospitalId && previousHospitalId !== hospitalId) {
    const previousHospital = profileFor(previousHospitalId);
    if (previousHospital?.role === 'hospital') {
      const capacity = Number(previousHospital.capacity) || 0;
      previousHospital.availableBeds = Math.min(capacity, (Number(previousHospital.availableBeds) || 0) + 1);
      saveProfile(previousHospitalId, previousHospital);
    }
    if (hospitalId) {
      hospital.availableBeds = Math.max(0, (Number(hospital.availableBeds) || 0) - 1);
      saveProfile(hospitalId, hospital);
    }
  }
  const location = validHospitalCoordinates(hospital) ? { latitude: Number(hospital.latitude), longitude: Number(hospital.longitude) } : null;
  const changed = emergency.hospitalId !== hospitalId || emergency.hospitalName !== (hospital.hospitalName || null) || emergency.hospitalAddress !== (hospital.hospitalAddress || null) || JSON.stringify(emergency.hospitalLocation || null) !== JSON.stringify(location);
  emergency.hospitalId = hospitalId;
  emergency.hospitalName = hospital.hospitalName || null;
  emergency.hospitalAddress = hospital.hospitalAddress || null;
  emergency.hospitalLocation = location;
  return changed;
}
function releaseHospitalBed(emergency) {
  if (!emergency?.hospitalId || emergency.bedReleased) return;
  const hospital = profileFor(emergency.hospitalId);
  if (hospital?.role === 'hospital') {
    const capacity = Number(hospital.capacity) || 0;
    hospital.availableBeds = Math.min(capacity, (Number(hospital.availableBeds) || 0) + 1);
    saveProfile(emergency.hospitalId, hospital);
  }
  emergency.bedReleased = true;
}
const withCurrentAmbulanceLocation = (emergency) => {
  if (!emergency.ambulanceId) return emergency;
  const ambulance = profileFor(emergency.ambulanceId);
  return {
    ...emergency,
    ambulanceNumber: ambulance?.ambulanceNumber || null,
    ambulanceDriverName: ambulance?.driverName || null,
    ambulanceHomeHospitalName: ambulance?.hospitalName || null,
    ambulanceLocation: validCoordinates(ambulance?.latitude, ambulance?.longitude) ? { latitude: Number(ambulance.latitude), longitude: Number(ambulance.longitude), timestamp: ambulance.locationUpdatedAt || emergency.ambulanceLocation?.timestamp || null } : emergency.ambulanceLocation || null,
  };
};
function recordAmbulanceTrip(emergency, ambulanceProfile, reachedAt) {
  if (!emergency.ambulanceId) return;
  const hospital = emergency.hospitalId ? profileFor(emergency.hospitalId) : null;
  db.prepare(`INSERT OR IGNORE INTO ambulance_trip_history
    (id, emergency_id, ambulance_id, ambulance_number, driver_name, hospital_id, hospital_name, hospital_address, emergency_type, reached_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(
    randomUUID(), emergency.emergencyId, emergency.ambulanceId,
    String(ambulanceProfile?.ambulanceNumber || ''), String(ambulanceProfile?.driverName || ambulanceProfile?.name || ''),
    emergency.hospitalId || null, String(hospital?.hospitalName || emergency.hospitalName || 'Hospital'),
    String(hospital?.hospitalAddress || emergency.hospitalAddress || ''), String(emergency.emergencyType || ''), reachedAt || new Date().toISOString()
  );
}
function recordEmergencyStatus(emergency, status, timestamp = new Date().toISOString()) {
  emergency.status = status;
  emergency.timeline.push({ status, timestamp });
  addNotification(emergency.patientId, 'Emergency status updated', `Your emergency is now ${status}.`, 'status', emergency.emergencyId);
  if (emergency.hospitalId) addNotification(emergency.hospitalId, 'Emergency status updated', `An assigned emergency is now ${status}.`, 'status', emergency.emergencyId);
  return timestamp;
}
function cleanupDeletedAccountReferences() {
  const rows = db.prepare('SELECT data FROM emergencies').all();
  for (const row of rows) {
    const emergency = parse(row.data);
    let changed = false;
    const hospital = emergency.hospitalId ? profileFor(emergency.hospitalId) : null;
    if (!hospital || hospital.role !== 'hospital') {
      if (emergency.hospitalId || emergency.hospitalName || emergency.hospitalAddress || emergency.hospitalLocation) changed = true;
      emergency.hospitalId = null;
      emergency.hospitalName = null;
      emergency.hospitalAddress = null;
      emergency.hospitalLocation = null;
    }
    if (emergency.ambulanceId) {
      const ambulance = profileFor(emergency.ambulanceId);
      if (!ambulance || ambulance.role !== 'ambulance') {
        emergency.ambulanceId = null;
        emergency.ambulanceLocation = null;
        if (['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(emergency.status)) {
          emergency.status = 'pending';
          emergency.timeline = [...(emergency.timeline || []), { status: 'pending', timestamp: new Date().toISOString() }];
        }
        changed = true;
      }
    }
    if (changed) persistEmergency(emergency);
  }
}
cleanupDeletedAccountReferences();
for (const row of db.prepare('SELECT data FROM emergencies').all()) {
  const emergency = parse(row.data);
  if (!['delivered', 'completed'].includes(emergency.status) || !emergency.ambulanceId) continue;
  const deliveredEvent = (emergency.timeline || []).find((item) => item.status === 'delivered');
  const ambulance = profileFor(emergency.ambulanceId);
  if (deliveredEvent && ambulance?.role === 'ambulance') recordAmbulanceTrip(emergency, ambulance, deliveredEvent.timestamp);
}
function validCoordinates(latitude, longitude) {
  if (latitude === null || latitude === undefined || latitude === '' || longitude === null || longitude === undefined || longitude === '') return false;
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Number(latitude) >= -90 && Number(latitude) <= 90 && Number(longitude) >= -180 && Number(longitude) <= 180;
}
function validHospitalCoordinates(profile) {
  return Boolean(profile && validCoordinates(profile.latitude, profile.longitude) && !(Number(profile.latitude) === 0 && Number(profile.longitude) === 0));
}
function distanceKmBetween(latitude1, longitude1, latitude2, longitude2) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLatitude = radians(Number(latitude2) - Number(latitude1));
  const deltaLongitude = radians(Number(longitude2) - Number(longitude1));
  const latitude1Radians = radians(Number(latitude1));
  const latitude2Radians = radians(Number(latitude2));
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1Radians) * Math.cos(latitude2Radians) * Math.sin(deltaLongitude / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));
  return 6371 * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}
function automaticAmbulanceStatus(emergency, location, previousLocation) {
  const patientDistance = distanceKmBetween(location.latitude, location.longitude, emergency.latitude, emergency.longitude);
  if (emergency.status === 'enroute' && patientDistance <= PATIENT_ARRIVAL_RADIUS_KM) {
    emergency.pickupDepartureAnchor = { latitude: location.latitude, longitude: location.longitude };
    return 'arrived';
  }
  if (emergency.status !== 'arrived') return null;
  if (patientDistance <= PATIENT_ARRIVAL_RADIUS_KM) {
    emergency.pickupDepartureAnchor = { latitude: location.latitude, longitude: location.longitude };
    return null;
  }

  const anchor = emergency.pickupDepartureAnchor || previousLocation;
  if (!validCoordinates(anchor?.latitude, anchor?.longitude)
    || distanceKmBetween(anchor.latitude, anchor.longitude, emergency.latitude, emergency.longitude) > PATIENT_ARRIVAL_RADIUS_KM
    || !validHospitalCoordinates(emergency.hospitalLocation)) return null;

  const anchorHospitalDistance = distanceKmBetween(anchor.latitude, anchor.longitude, emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude);
  const currentHospitalDistance = distanceKmBetween(location.latitude, location.longitude, emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude);
  if (anchorHospitalDistance - currentHospitalDistance < MIN_HOSPITAL_DEPARTURE_PROGRESS_KM) return null;
  delete emergency.pickupDepartureAnchor;
  return 'transporting';
}
function isVisiblePendingEmergency(emergency, now = Date.now()) {
  if (emergency?.status !== 'pending' || emergency.ambulanceId) return false;
  const createdAt = Date.parse(emergency.createdAt || '');
  return Number.isFinite(createdAt) && createdAt <= now && now - createdAt <= PENDING_EMERGENCY_WINDOW_MS;
}
function publicEmergency(emergency) {
  const firstName = String(emergency.patientName || 'Patient').trim().split(/\s+/)[0] || 'Patient';
  const trimLocation = (location) => location && validCoordinates(location.latitude, location.longitude) ? { latitude: Number(Number(location.latitude).toFixed(3)), longitude: Number(Number(location.longitude).toFixed(3)), timestamp: location.timestamp } : null;
  return {
    emergencyId: emergency.emergencyId,
    patientName: firstName,
    emergencyType: emergency.emergencyType,
    severity: emergency.severity,
    latitude: Number(Number(emergency.latitude).toFixed(3)),
    longitude: Number(Number(emergency.longitude).toFixed(3)),
    ambulanceLocation: trimLocation(emergency.ambulanceLocation),
    hospitalLocation: trimLocation(emergency.hospitalLocation),
    hospitalName: emergency.hospitalName || null,
    status: emergency.status,
    timeline: (emergency.timeline || []).map(({ status, timestamp }) => ({ status, timestamp })),
    createdAt: emergency.createdAt,
  };
}
function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
async function serveStatic(req, res, pathName) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const distDir = resolve(root, 'dist');
  let relativePath = pathName === '/' ? 'index.html' : decodeURIComponent(pathName).replace(/^\/+/, '');
  let filePath = resolve(distDir, relativePath);
  if (filePath !== distDir && !filePath.startsWith(`${distDir}${sep}`)) return false;
  try {
    await stat(filePath);
  } catch {
    filePath = resolve(distDir, 'index.html');
  }
  try {
    const content = await readFile(filePath);
    const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
    return true;
  } catch {
    return false;
  }
}
function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) { reject(new Error('Request too large.')); req.destroy(); }
    });
    req.on('end', () => { try { resolveBody(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON.')); } });
    req.on('error', reject);
  });
}
function rateLimit(req, res, key, max, windowMs) {
  const ip = req.socket.remoteAddress || 'unknown';
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  let bucket = limits.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  limits.set(bucketKey, bucket);
  if (limits.size > 5000) for (const [entry, value] of limits) if (value.resetAt <= now) limits.delete(entry);
  if (bucket.count <= max) return false;
  json(res, 429, { error: 'Too many attempts. Please wait before trying again.' }, { 'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)) });
  return true;
}
function transaction(action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
async function deliverEmergencyAlerts(contacts, emergency) {
  const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  const emailConfigured = Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY);
  const text = `EMERGENCY: ${emergency.patientName} needs help. Type: ${emergency.emergencyType}. Location: https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}. Track: ${publicAppUrl}/public-tracking/${emergency.emergencyId}`;
  const results = await Promise.all((contacts || []).flatMap((contact) => {
    const jobs = [];
    if (smsConfigured && contact.phone) jobs.push((async () => {
      const account = process.env.TWILIO_ACCOUNT_SID;
      const form = new URLSearchParams({ To: contact.phone, From: process.env.TWILIO_FROM_NUMBER, Body: text });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${account}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
      if (!response.ok) throw new Error(`Twilio returned ${response.status}`);
      return 'sms';
    })().catch((error) => { console.error('SMS delivery failed:', error.message); return null; }));
    if (emailConfigured && contact.email) jobs.push((async () => {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: process.env.EMAILJS_SERVICE_ID, template_id: process.env.EMAILJS_TEMPLATE_ID, user_id: process.env.EMAILJS_PUBLIC_KEY, accessToken: process.env.EMAILJS_PRIVATE_KEY, template_params: { to_email: contact.email, to_name: contact.name || 'Emergency contact', patient_name: emergency.patientName, emergency_type: emergency.emergencyType, patient_phone: emergency.patientPhone || '', timestamp: emergency.createdAt, google_maps_url: `https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`, tracking_url: `${publicAppUrl}/public-tracking/${emergency.emergencyId}`, message: emergency.notes || 'Please contact the patient and emergency services.' } }) });
      if (!response.ok) throw new Error(`EmailJS returned ${response.status}`);
      return 'email';
    })().catch((error) => { console.error('Email delivery failed:', error.message); return null; }));
    return jobs;
  }));
  return { notified: results.filter(Boolean).length, smsConfigured, emailConfigured };
}
function validProfileUpdates(role, current, updates) {
  const keys = {
    patient: ['name', 'phone', 'bloodGroup', 'allergies', 'medicalConditions', 'emergencyContacts'],
    ambulance: ['name', 'driverName', 'phone', 'ambulanceNumber', 'hospitalId', 'hospitalName', 'available', 'latitude', 'longitude'],
    hospital: ['name', 'phone', 'hospitalName', 'hospitalAddress', 'capacity', 'icuBeds', 'availableBeds', 'availableIcu', 'latitude', 'longitude'],
  }[role] || [];
  const safe = Object.fromEntries(Object.entries(updates).filter(([key]) => keys.includes(key)));
  for (const key of ['allergies', 'medicalConditions', 'emergencyContacts']) {
    if (key in safe && (!Array.isArray(safe[key]) || safe[key].length > 50)) throw new Error(`${key} must be a list of 50 items or fewer.`);
  }
  if ('available' in safe && typeof safe.available !== 'boolean') throw new Error('Availability must be true or false.');
  for (const key of ['capacity', 'icuBeds', 'availableBeds', 'availableIcu']) {
    if (key in safe && (!Number.isInteger(Number(safe[key])) || Number(safe[key]) < 0 || Number(safe[key]) > 100000)) throw new Error(`${key} must be a non-negative whole number.`);
    if (key in safe) safe[key] = Number(safe[key]);
  }
  for (const key of ['latitude', 'longitude']) {
    if (key in safe && safe[key] !== '' && !Number.isFinite(Number(safe[key]))) throw new Error(`${key} must be a number.`);
    if (key in safe && safe[key] !== '') safe[key] = Number(safe[key]);
  }
  const profile = { ...current, ...safe };
  if (profile.availableBeds > profile.capacity) throw new Error('Available beds cannot exceed total capacity.');
  if (profile.availableIcu > profile.icuBeds) throw new Error('Available ICU beds cannot exceed total ICU beds.');
  if ((profile.latitude == null) !== (profile.longitude == null)) throw new Error('Enter both latitude and longitude for the location.');
  if (profile.latitude != null && profile.longitude != null && !validCoordinates(profile.latitude, profile.longitude)) throw new Error('Enter valid latitude and longitude values.');
  return profile;
}

function hospitalAmbulancePrefix(name) {
  const firstWord = String(name || '').toUpperCase().match(/[A-Z0-9]+/)?.[0] || 'AM';
  const consonants = firstWord.replace(/[AEIOU]/g, '');
  return (consonants.length >= 2 ? consonants.slice(0, 2) : firstWord.slice(0, 2)).padEnd(2, 'X');
}

function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || !password) return;
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing && parse(existing.metadata).role !== 'admin') {
    const metadata = { ...parse(existing.metadata), name: 'Administrator', role: 'admin' };
    db.prepare('UPDATE users SET password_hash=?,metadata=? WHERE id=?').run(hash(password), JSON.stringify(metadata), existing.id);
    saveProfile(existing.id, { ...(profileFor(existing.id) || {}), userId: existing.id, email, name: 'Administrator', role: 'admin' });
    return;
  }
  if (!existing) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, email, hash(password), JSON.stringify({ name: 'Administrator', role: 'admin' }), createdAt);
    saveProfile(id, { userId: id, email, name: 'Administrator', role: 'admin', createdAt });
  } else if (!profileFor(existing.id)) {
    saveProfile(existing.id, { userId: existing.id, email, name: 'Administrator', role: 'admin', createdAt: existing.created_at });
  }
}
ensureAdminAccount();

async function createDailyBackup() {
  const backupDir = resolve(dataDir, 'backups');
  await mkdir(backupDir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const destination = resolve(backupDir, `resqlink-${day}.sqlite`);
  try { await stat(destination); }
  catch { await backup(db, destination); console.log(`SQLite backup created: ${destination}`); }
  const files = (await readdir(backupDir)).filter((name) => /^resqlink-\d{4}-\d{2}-\d{2}\.sqlite$/.test(name)).sort().reverse();
  await Promise.all(files.slice(7).map((name) => unlink(resolve(backupDir, name))));
}
createDailyBackup().catch((error) => console.error('Could not create SQLite backup:', error.message));
const backupTimer = setInterval(() => createDailyBackup().catch((error) => console.error('Could not create SQLite backup:', error.message)), 24 * 60 * 60 * 1000);
backupTimer.unref();
const sessionCleanupTimer = setInterval(() => db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString()), 60 * 60 * 1000);
sessionCleanupTimer.unref();

const apiServer = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    publicAppUrl,
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
  ]);
  if (origin && !allowedOrigins.has(origin)) return json(res, 403, { error: 'Origin not allowed.' });
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }); return res.end(); }
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const body = req.method === 'POST' ? await readBody(req) : {};
    const user = currentUser(req);

    if (path === '/api/health') return json(res, 200, { ok: true, database: 'sqlite' });
    if (path === '/api/geocode/hospital' && req.method === 'POST') {
      if (rateLimit(req, res, 'hospital-geocode', 20, 10 * 60 * 1000)) return;
      const address = String(body.address || '').trim().slice(0, 300);
      const hospitalName = String(body.hospitalName || '').trim().slice(0, 120);
      if (address.length < 5) return json(res, 400, { error: 'Enter a complete hospital address.' });
      try {
        const coordinateMatch = address.match(/(?:latitude\s*[:=]?\s*)?(-?\d+\.\d+)\s*[,;]\s*(?:longitude\s*[:=]?\s*)?(-?\d+\.\d+)/i);
        if (coordinateMatch) {
          const latitude = Number(coordinateMatch[1]);
          const longitude = Number(coordinateMatch[2]);
          if (validCoordinates(latitude, longitude)) {
            return json(res, 200, { location: { latitude, longitude, label: address }, attribution: 'Coordinates supplied by user' });
          }
        }
        const searchPhoton = async (query) => {
          const geocoder = new URL(process.env.PHOTON_API_URL || 'https://photon.komoot.io/api/');
          geocoder.searchParams.set('q', query);
          geocoder.searchParams.set('limit', '5');
          const response = await fetch(geocoder, { headers: { 'User-Agent': 'ResQLink hospital signup geocoder' }, signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error(`Photon returned HTTP ${response.status}`);
          return response.json();
        };
        const searchNominatim = async (query) => {
          const geocoder = new URL('https://nominatim.openstreetmap.org/search');
          geocoder.searchParams.set('format', 'jsonv2');
          geocoder.searchParams.set('addressdetails', '1');
          geocoder.searchParams.set('limit', '5');
          geocoder.searchParams.set('q', query);
          const response = await fetch(geocoder, { headers: { 'User-Agent': 'ResQLink hospital signup geocoder', 'Accept-Language': 'en' }, signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status}`);
          return response.json();
        };
        const postcode = address.match(/\b\d{6}\b/)?.[0] || '';
        const nameTerms = (hospitalName) => String(hospitalName || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !['hospital', 'hospitals', 'clinic', 'medical'].includes(word)) || [];
        const matchesHospitalName = (resultName, expectedName) => {
          const terms = nameTerms(expectedName);
          if (!terms.length) return true;
          const normalizedResultName = String(resultName || '').toLowerCase();
          return terms.every((term) => normalizedResultName.includes(term));
        };
        const firstPhotonMatch = async (query, expectedName = '', requirePostcode = false) => {
          const result = await searchPhoton(query);
          const feature = result.features?.find((item) => {
            if (requirePostcode && postcode && String(item.properties?.postcode || '') !== postcode) return false;
            return matchesHospitalName(item.properties?.name, expectedName);
          });
          const [longitude, latitude] = feature?.geometry?.coordinates || [];
          return validCoordinates(latitude, longitude)
            ? { latitude: Number(latitude), longitude: Number(longitude), label: feature.properties?.name || query, attribution: 'Geocoding by Photon, data © OpenStreetMap contributors' }
            : null;
        };
        const firstNominatimMatch = async (query, expectedName = '', requirePostcode = false) => {
          const features = await searchNominatim(query);
          const feature = features?.find((item) => {
            if (requirePostcode && postcode && String(item.address?.postcode || '') !== postcode) return false;
            return matchesHospitalName(item.name || item.display_name, expectedName);
          });
          if (!feature) return null;
          const latitude = Number(feature.lat);
          const longitude = Number(feature.lon);
          return validCoordinates(latitude, longitude)
            ? { latitude, longitude, label: feature.display_name || query, attribution: 'Geocoding by OpenStreetMap Nominatim' }
            : null;
        };
        const shortCodeMatch = address.match(/\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})\b/i);
        if (shortCodeMatch && openLocationCode.isFull(shortCodeMatch[1])) {
          const area = openLocationCode.decode(shortCodeMatch[1]);
          return json(res, 200, { location: { latitude: area.latitudeCenter, longitude: area.longitudeCenter, label: shortCodeMatch[1].toUpperCase() }, attribution: 'Plus Code by Open Location Code' });
        }
        if (shortCodeMatch && openLocationCode.isShort(shortCodeMatch[1])) {
          const locality = address.replace(shortCodeMatch[1], '').replace(/^[\s,]+|[\s,]+$/g, '');
          const plusCodeHospitalName = String(body.hospitalName || '').trim();
          const referenceQueries = [locality, plusCodeHospitalName].filter((query, index, list) => query.length >= 3 && list.indexOf(query) === index);
          for (const query of referenceQueries) {
            try {
            const reference = (await searchPhoton(query)).features?.find((item) => !postcode || !item.properties?.postcode || String(item.properties.postcode) === postcode);
            const [referenceLongitude, referenceLatitude] = reference?.geometry?.coordinates || [];
            if (validCoordinates(referenceLatitude, referenceLongitude)) {
              const fullCode = openLocationCode.recoverNearest(shortCodeMatch[1], Number(referenceLatitude), Number(referenceLongitude));
              const area = openLocationCode.decode(fullCode);
              return json(res, 200, { location: { latitude: area.latitudeCenter, longitude: area.longitudeCenter, label: shortCodeMatch[1].toUpperCase() }, attribution: 'Plus Code by Open Location Code' });
            }
            } catch (error) {
              console.warn(`Plus Code reference lookup failed for "${query}":`, error.message);
            }
          }
        }
        const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
        const streetAndArea = parts.filter((part) => !/^PLOT\b/i.test(part) && !/^PIN\b/i.test(part)).join(', ');
        const localityAndPostalCode = parts.filter((part) => !/^PLOT\b/i.test(part) && !/state bank of india/i.test(part)).join(', ');
        // Address without postcode for more lenient matching
        const addressWithoutPostcode = address.replace(/\b\d{6}\b/g, '').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
        const localityCandidates = parts.length > 4
          ? [parts.slice(-5).join(', '), parts.slice(-4).join(', ')]
          : [];
        const candidates = [
          addressWithoutPostcode || address,
          address,
          ...localityCandidates,
          streetAndArea,
          localityAndPostalCode,
          hospitalName,
        ].filter((candidate, index, list) => candidate && candidate.length >= 3 && list.indexOf(candidate) === index);
        const respondWithMatch = (location, candidate) => {
          const approximate = localityCandidates.includes(candidate)
            || Boolean(hospitalName && !matchesHospitalName(location.label, hospitalName));
          return json(res, 200, {
            location: { ...location, approximate },
            approximate,
            attribution: location.attribution,
          });
        };

        for (const candidate of candidates) {
          const expectedName = candidate === hospitalName ? hospitalName : '';
          const postcodeChecks = postcode ? [true] : [false];
          for (const requirePostcode of postcodeChecks) {
            try {
              const photonMatch = await firstPhotonMatch(candidate, expectedName, requirePostcode);
              if (photonMatch) return respondWithMatch(photonMatch, candidate);
            } catch (error) {
              console.warn(`Photon lookup failed for "${candidate}" (postcode=${requirePostcode}):`, error.message);
            }
            try {
              const nominatimMatch = await firstNominatimMatch(candidate, expectedName, requirePostcode);
              if (nominatimMatch) return respondWithMatch(nominatimMatch, candidate);
            } catch (error) {
              console.warn(`Nominatim lookup failed for "${candidate}" (postcode=${requirePostcode}):`, error.message);
            }
          }
        }
        return json(res, 404, { error: 'No map match was found. Enter valid coordinates (latitude, longitude), a hospital name, or a shorter address including the city.' });
      } catch (error) {
        console.warn('Hospital address lookup failed:', error.message);
        return json(res, 502, { error: 'Address lookup is temporarily unavailable. Try again shortly.' });
      }
    }
    if (path === '/api/signup/hospitals' && req.method === 'GET') {
      const hospitals = db.prepare("SELECT profiles.user_id,profiles.data FROM profiles JOIN users ON users.id=profiles.user_id WHERE json_extract(users.metadata,'$.role')='hospital' AND json_extract(profiles.data,'$.role')='hospital' ORDER BY json_extract(profiles.data,'$.hospitalName') COLLATE NOCASE").all().map((row) => {
        const profile = parse(row.data);
        return { id: row.user_id, hospitalName: profile.hospitalName || 'Hospital', hospitalAddress: profile.hospitalAddress || '' };
      });
      return json(res, 200, { hospitals });
    }
    if (path === '/api/auth/signup' && req.method === 'POST') {
      if (rateLimit(req, res, 'signup', 10, 60 * 60 * 1000)) return;
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {};
      const role = metadata.role || 'patient';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) return json(res, 400, { error: 'Enter a valid email and a password between 10 and 128 characters.' });
      if (!['patient', 'hospital', 'ambulance'].includes(role)) return json(res, 400, { error: 'Choose a valid account role.' });
      if (role === 'hospital' && (!String(metadata.hospitalName || '').trim() || !String(metadata.hospitalAddress || '').trim())) return json(res, 400, { error: 'Enter the hospital name and location.' });
      if (role === 'hospital' && !validCoordinates(metadata.latitude, metadata.longitude)) return json(res, 400, { error: 'We could not locate this hospital address. Check the address and try again.' });
      let ambulanceHospital = null;
      let ambulanceNumber = String(metadata.ambulanceNumber || '').trim().toUpperCase();
      if (role === 'ambulance') {
        const hospitalRow = db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(String(metadata.hospitalId || ''));
        ambulanceHospital = hospitalRow ? parse(hospitalRow.data) : null;
        if (!ambulanceHospital || ambulanceHospital.role !== 'hospital') return json(res, 400, { error: 'Choose a registered hospital for this ambulance.' });
        const prefix = hospitalAmbulancePrefix(ambulanceHospital.hospitalName);
        if (!ambulanceNumber.startsWith(`${prefix}-`) || !/^[A-Z0-9-]{1,30}$/.test(ambulanceNumber.slice(prefix.length + 1))) return json(res, 400, { error: `Enter an ambulance number after the ${prefix}- prefix.` });
        ambulanceNumber = `${prefix}-${ambulanceNumber.slice(prefix.length + 1)}`;
      }
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return json(res, 409, { error: 'This email is already registered.' });
      const id = randomUUID(); const now = new Date(); const createdAt = now.toISOString(); const token = randomBytes(32).toString('base64url'); const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
      try {
        transaction(() => {
          db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id, email, hash(password), JSON.stringify({ name: String(metadata.name || '').slice(0, 100), role }), createdAt);
          const profile = { userId: id, email, name: String(metadata.name || '').slice(0, 100), role, createdAt };
          if (role === 'patient') Object.assign(profile, { phone: String(metadata.phone || '').slice(0, 30), bloodGroup: '', allergies: [], medicalConditions: [], emergencyContacts: [] });
          if (role === 'hospital') Object.assign(profile, { hospitalName: String(metadata.hospitalName || '').trim().slice(0, 120), hospitalAddress: String(metadata.hospitalAddress || '').trim().slice(0, 500), phone: '', capacity: 0, icuBeds: 0, availableBeds: 0, availableIcu: 0, latitude: Number(metadata.latitude), longitude: Number(metadata.longitude) });
          if (role === 'ambulance') Object.assign(profile, { ambulanceNumber: ambulanceNumber.slice(0, 40), hospitalId: String(metadata.hospitalId), hospitalName: ambulanceHospital.hospitalName, driverName: String(metadata.name || '').slice(0, 100), phone: String(metadata.phone || '').slice(0, 30), available: true, latitude: null, longitude: null, locationUpdatedAt: null });
          saveProfile(id, profile);
          db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(hashToken(token), id, createdAt, expiresAt);
        });
      } catch (error) { if (String(error.message).includes('UNIQUE')) return json(res, 409, { error: 'This email is already registered.' }); throw error; }
      const safeUser = { id, email, user_metadata: { name: metadata.name || '', role }, created_at: createdAt };
      return json(res, 201, { user: safeUser, session: { expires_at: expiresAt } }, { 'Set-Cookie': cookieHeader(req, token, SESSION_TTL_MS / 1000) });
    }
    if (path === '/api/auth/signin' && req.method === 'POST') {
      if (rateLimit(req, res, 'signin', 10, 15 * 60 * 1000)) return;
      const email = String(body.email || '').trim().toLowerCase();
      const account = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      const ok = account ? checkPassword(String(body.password || ''), account.password_hash) : false;
      if (!ok) return json(res, 401, { error: 'Invalid email or password.' });
      const now = new Date(); const createdAt = now.toISOString(); const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString(); const token = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(hashToken(token), account.id, createdAt, expiresAt);
      const safeUser = { id: account.id, email: account.email, user_metadata: parse(account.metadata) };
      return json(res, 200, { user: safeUser, session: { expires_at: expiresAt } }, { 'Set-Cookie': cookieHeader(req, token, SESSION_TTL_MS / 1000) });
    }
    if (path === '/api/auth/password-reset/request' && req.method === 'POST') {
      if (rateLimit(req, res, 'password-reset', 5, 60 * 60 * 1000)) return;
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'Enter a valid email address.' });
      const account = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      const id = randomUUID(); const key = randomBytes(32).toString('base64url'); const now = new Date();
      const createdAt = now.toISOString(); const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO password_reset_requests(id,user_id,email,token_hash,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').run(id, account?.id || null, email, hashToken(key), 'pending', createdAt, expiresAt);
      return json(res, 201, { success: true, request: { id, key }, message: 'If an account uses this email, an administrator can review your password reset request.' });
    }
    if (path === '/api/auth/password-reset/status' && req.method === 'GET') {
      const request = db.prepare('SELECT status,expires_at FROM password_reset_requests WHERE id = ? AND token_hash = ?').get(String(url.searchParams.get('id') || ''), hashToken(String(url.searchParams.get('key') || '')));
      if (!request) return json(res, 404, { error: 'Password reset request not found.' });
      if (request.expires_at <= new Date().toISOString() && request.status === 'pending') return json(res, 200, { status: 'expired' });
      return json(res, 200, { status: request.status });
    }
    if (path === '/api/auth/password-reset/complete' && req.method === 'POST') {
      const password = String(body.password || '');
      if (password.length < 10 || password.length > 128) return json(res, 400, { error: 'Use a password between 10 and 128 characters.' });
      const request = db.prepare('SELECT * FROM password_reset_requests WHERE id = ? AND token_hash = ?').get(String(body.id || ''), hashToken(String(body.key || '')));
      if (!request || request.status !== 'approved' || request.expires_at <= new Date().toISOString()) return json(res, 403, { error: 'This request is not approved or has expired.' });
      if (!request.user_id) return json(res, 404, { error: 'No account was found for this request.' });
      transaction(() => {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash(password), request.user_id);
        db.prepare("UPDATE password_reset_requests SET status='completed',reviewed_at=? WHERE id=?").run(new Date().toISOString(), request.id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(request.user_id);
      });
      return json(res, 200, { success: true, message: 'Password updated. Sign in with your new password.' });
    }
    if (path === '/api/auth/session') return json(res, 200, { session: user ? { expires_at: db.prepare('SELECT expires_at FROM sessions WHERE token_hash = ?').get(hashToken(readCookies(req)[SESSION_COOKIE])).expires_at } : null, user: user ? { id: user.id, email: user.email, user_metadata: parse(user.metadata) } : null });
    if (path === '/api/auth/signout' && req.method === 'POST') {
      const token = readCookies(req)[SESSION_COOKIE];
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      return json(res, 200, { success: true }, { 'Set-Cookie': cookieHeader(req, '', 0) });
    }
    if (path.startsWith('/api/public/emergencies/')) {
      const id = decodeURIComponent(path.split('/').pop()); const emergency = getEmergency(id);
      return json(res, emergency ? 200 : 404, { emergency: emergency ? publicEmergency(withCurrentHospitalLocation(emergency)) : null });
    }
    if (!path.startsWith('/api/') && await serveStatic(req, res, path)) return;
    if (!user) return json(res, 401, { error: 'Please sign in to continue.' });
    const role = parse(user.metadata).role;

    if (path === '/api/admin/accounts' && req.method === 'GET') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      const targetRole = String(url.searchParams.get('role') || '');
      if (!['hospital', 'patient', 'ambulance'].includes(targetRole)) return json(res, 400, { error: 'Choose a valid account category.' });
      const accounts = db.prepare("SELECT users.id,users.email,profiles.data FROM users JOIN profiles ON profiles.user_id=users.id WHERE json_extract(users.metadata,'$.role')=? ORDER BY users.created_at DESC").all(targetRole).map((row) => ({ userId: row.id, email: row.email, profile: parse(row.data) }));
      return json(res, 200, { accounts });
    }
    if (path === '/api/admin/password-reset-requests' && req.method === 'GET') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      const requests = db.prepare("SELECT id,email,CASE WHEN status='pending' AND expires_at<=? THEN 'expired' ELSE status END AS status,created_at AS createdAt,expires_at AS expiresAt,reviewed_at AS reviewedAt,CASE WHEN user_id IS NULL THEN 0 ELSE 1 END AS accountExists FROM password_reset_requests ORDER BY created_at DESC LIMIT 100").all(new Date().toISOString()).map((item) => ({ ...item, accountExists: Boolean(item.accountExists) }));
      return json(res, 200, { requests });
    }
    if (path === '/api/admin/password-reset-requests' && req.method === 'POST') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      if (!['approve', 'reject'].includes(body.action)) return json(res, 400, { error: 'Choose approve or reject.' });
      const request = db.prepare('SELECT * FROM password_reset_requests WHERE id = ? AND status = ?').get(String(body.requestId || ''), 'pending');
      if (!request || request.expires_at <= new Date().toISOString()) return json(res, 404, { error: 'This password reset request is missing or expired.' });
      if (body.action === 'approve' && !request.user_id) return json(res, 404, { error: 'No user account was found for this email.' });
      db.prepare('UPDATE password_reset_requests SET status=?,reviewed_at=? WHERE id=?').run(body.action === 'approve' ? 'approved' : 'rejected', new Date().toISOString(), request.id);
      return json(res, 200, { success: true });
    }
    if (path === '/api/admin/accounts' && req.method === 'DELETE') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      const target = db.prepare('SELECT id,metadata FROM users WHERE id = ?').get(String(url.searchParams.get('userId') || ''));
      if (!target) return json(res, 404, { error: 'Account not found.' });
      const targetRole = parse(target.metadata).role;
      if (!['hospital', 'patient', 'ambulance'].includes(targetRole)) return json(res, 400, { error: 'This account cannot be removed here.' });
      transaction(() => {
        if (targetRole === 'patient') {
          for (const row of db.prepare('SELECT data FROM emergencies WHERE patient_id = ?').all(target.id)) {
            releaseHospitalBed(parse(row.data));
          }
          db.prepare('DELETE FROM messages WHERE emergency_id IN (SELECT id FROM emergencies WHERE patient_id = ?)').run(target.id);
          db.prepare('DELETE FROM notifications WHERE emergency_id IN (SELECT id FROM emergencies WHERE patient_id = ?)').run(target.id);
          db.prepare('DELETE FROM emergencies WHERE patient_id = ?').run(target.id);
        } else {
          if (targetRole === 'hospital') {
            const ambulances = db.prepare("SELECT user_id,data FROM profiles WHERE json_extract(data,'$.role')='ambulance'").all();
            for (const row of ambulances) {
              const ambulance = parse(row.data);
              if (ambulance.hospitalId === target.id) {
                ambulance.hospitalId = null;
                ambulance.hospitalName = '';
                saveProfile(row.user_id, ambulance);
              }
            }
          }
          const rows = db.prepare('SELECT data FROM emergencies').all();
          for (const row of rows) {
            const emergency = parse(row.data);
            if (targetRole === 'hospital' && emergency.hospitalId === target.id) {
              if (!emergency.bedReleased) emergency.bedReleased = true;
              emergency.hospitalId = null;
              emergency.hospitalName = null;
              emergency.hospitalAddress = null;
              emergency.hospitalLocation = null;
            }
            if (targetRole === 'ambulance' && emergency.ambulanceId === target.id) {
              emergency.ambulanceId = null;
              emergency.ambulanceLocation = null;
              if (emergency.status !== 'completed') {
                emergency.status = 'pending';
                emergency.timeline.push({ status: 'pending', timestamp: new Date().toISOString() });
              }
            }
            persistEmergency(emergency);
          }
        }
        db.prepare('DELETE FROM notifications WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM password_reset_requests WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM profiles WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
      });
      return json(res, 200, { success: true });
    }
    if (path === '/api/admin/accounts' && req.method === 'POST') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      const target = db.prepare('SELECT id,email,metadata FROM users WHERE id = ?').get(String(body.userId || ''));
      if (!target) return json(res, 404, { error: 'Account not found.' });
      const targetRole = parse(target.metadata).role;
      if (!['hospital', 'patient', 'ambulance'].includes(targetRole)) return json(res, 400, { error: 'This account cannot be edited here.' });
      const updates = body.profile && typeof body.profile === 'object' && !Array.isArray(body.profile) ? body.profile : {};
      const email = String(body.email || target.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'Enter a valid email address.' });
      const duplicate = db.prepare('SELECT id FROM users WHERE email = ? AND id <> ?').get(email, target.id);
      if (duplicate) return json(res, 409, { error: 'That email address is already in use.' });
      const current = profileFor(target.id) || {};
      let profile;
      try { profile = validProfileUpdates(targetRole, current, updates); }
      catch (error) { return json(res, 400, { error: error.message }); }
      if (targetRole === 'ambulance' && profile.hospitalId) {
        const hospital = profileFor(profile.hospitalId);
        if (!hospital || hospital.role !== 'hospital') return json(res, 400, { error: 'Choose a registered hospital.' });
        profile.hospitalName = hospital.hospitalName;
      } else if (targetRole === 'ambulance') {
        profile.hospitalId = null;
        profile.hospitalName = '';
      }
      profile.email = email;
      const metadata = { ...parse(target.metadata), name: profile.name || '', role: targetRole };
      transaction(() => {
        db.prepare('UPDATE users SET email=?,metadata=? WHERE id=?').run(email, JSON.stringify(metadata), target.id);
        saveProfile(target.id, profile);
      });
      return json(res, 200, { success: true, account: { userId: target.id, email, profile } });
    }
    if (path === '/api/admin/emergencies' && req.method === 'GET') {
      if (role !== 'admin') return json(res, 403, { error: 'Admin access required.' });
      const emergencies = db.prepare('SELECT data FROM emergencies ORDER BY created_at DESC').all().map((row) => parse(row.data));
      return json(res, 200, { emergencies });
    }
    if (path === '/api/hospital/ambulances' && req.method === 'GET') {
      if (role !== 'hospital') return json(res, 403, { error: 'Hospital access required.' });
      const activeEmergencies = db.prepare('SELECT data FROM emergencies ORDER BY created_at DESC').all().map((row) => parse(row.data)).filter((item) => item.ambulanceId && ['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(item.status));
      const activeHere = activeEmergencies.filter((item) => item.hospitalId === user.id);
      const activeAmbulanceIds = new Set(activeHere.map((item) => item.ambulanceId));
      const ambulances = db.prepare("SELECT p.user_id,p.data FROM profiles p JOIN users u ON u.id=p.user_id WHERE json_extract(p.data,'$.role')='ambulance' ORDER BY json_extract(p.data,'$.ambulanceNumber') COLLATE NOCASE").all().map((row) => ({ userId: row.user_id, profile: parse(row.data) })).filter((item) => item.profile.hospitalId === user.id || activeAmbulanceIds.has(item.userId));
      const fleet = ambulances.map(({ userId: ambulanceId, profile }) => {
        const emergency = activeEmergencies.find((item) => item.ambulanceId === ambulanceId) || null;
        const isAssignedHere = emergency?.hospitalId === user.id;
        const currentEmergency = emergency ? withCurrentHospitalLocation(withCurrentAmbulanceLocation(emergency)) : null;
        return {
          ambulanceId,
          ambulanceNumber: profile.ambulanceNumber || 'Ambulance',
          driverName: profile.driverName || profile.name || 'Driver',
          hospitalName: profile.hospitalName || profileFor(user.id)?.hospitalName || 'Hospital',
          available: profile.available !== false,
          location: validCoordinates(profile.latitude, profile.longitude) ? { latitude: Number(profile.latitude), longitude: Number(profile.longitude) } : null,
          locationUpdatedAt: profile.locationUpdatedAt || null,
          emergencyStatus: emergency?.status || null,
          hasPatient: emergency?.status === 'transporting',
          emergencyId: isAssignedHere ? emergency.emergencyId : null,
          patientName: isAssignedHere ? emergency.patientName || 'Patient' : null,
          patientLocation: isAssignedHere ? { latitude: emergency.latitude, longitude: emergency.longitude } : null,
          routeTarget: isAssignedHere && ['arrived', 'transporting', 'delivered'].includes(emergency.status) ? 'hospital' : 'patient',
          hospitalLocation: isAssignedHere ? currentEmergency.hospitalLocation : null,
          routeEmergency: isAssignedHere ? {
            emergencyId: emergency.emergencyId,
            status: emergency.status,
            latitude: emergency.latitude,
            longitude: emergency.longitude,
            ambulanceLocation: currentEmergency.ambulanceLocation,
            hospitalName: currentEmergency.hospitalName,
            hospitalLocation: currentEmergency.hospitalLocation,
          } : null,
        };
      });
      return json(res, 200, { ambulances: fleet });
    }

    if (path === '/api/profile' && req.method === 'GET') return json(res, 200, { profile: profileFor(user.id) });
    if (path === '/api/directions' && req.method === 'POST') {
      if (role !== 'ambulance') return json(res, 403, { error: 'Only ambulance drivers can request turn-by-turn directions.' });
      if (rateLimit(req, res, `directions:${user.id}:${String(body.emergencyId || '')}`, 12, 60 * 1000)) return;
      if (!['patient', 'hospital'].includes(body.target)) return json(res, 400, { error: 'Choose a valid route destination.' });
      const emergency = getEmergency(String(body.emergencyId || ''));
      const authorized = emergency && emergency.ambulanceId === user.id;
      if (!authorized || !['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(emergency.status)) return json(res, 404, { error: 'No active assignment was found.' });
      const hospitalBound = ['arrived', 'transporting', 'delivered'].includes(emergency.status);
      if ((body.target === 'hospital') !== hospitalBound) return json(res, 409, { error: 'The route destination does not match the current emergency status.' });
      const currentEmergency = withCurrentHospitalLocation(emergency);
      const destination = hospitalBound ? currentEmergency.hospitalLocation : { latitude: emergency.latitude, longitude: emergency.longitude };
      if (!destination || !validCoordinates(destination.latitude, destination.longitude)) return json(res, 409, { error: 'The receiving hospital location is not configured.' });
      const origin = body.origin;
      if (!origin || !validCoordinates(origin.latitude, origin.longitude)) return json(res, 400, { error: 'A valid live ambulance GPS location is required.' });
      let routeResponse;
      let routeResult;
      try {
        routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${Number(origin.longitude)},${Number(origin.latitude)};${Number(destination.longitude)},${Number(destination.latitude)}?overview=false&steps=true`);
        routeResult = await routeResponse.json().catch(() => ({}));
      } catch (error) {
        console.error('Road routing service request failed:', error.message);
        return json(res, 502, { error: 'Could not reach the road routing service. Check connectivity and retry.' });
      }
      if (!routeResponse.ok || (routeResult.code && routeResult.code !== 'Ok')) {
        if (routeResponse.status === 400 || ['NoRoute', 'NoSegment'].includes(routeResult.code)) {
          return json(res, 422, { error: 'No drivable route connects these coordinates. Verify the assigned hospital map pin.' });
        }
        return json(res, 502, { error: 'The road routing service is temporarily unavailable. Retry directions later.' });
      }
      const route = routeResult.routes?.[0];
      if (!route) return json(res, 422, { error: 'No drivable route connects these coordinates. Verify the assigned hospital map pin.' });
      const steps = (route.legs || []).flatMap((leg) => leg.steps || []).map((step) => {
        const maneuver = step.maneuver || {};
        const action = [maneuver.type, maneuver.modifier].filter(Boolean).join(' ');
        return { instruction: `${action ? `${action[0].toUpperCase()}${action.slice(1)}` : 'Continue'}${step.name ? ` onto ${step.name}` : ''}`, distanceMeters: Math.round(step.distance || 0), durationSeconds: Math.round(step.duration || 0) };
      }).filter((step) => step.distanceMeters > 0 || !['Continue'].includes(step.instruction));
      let aiSummary = null;
      if (process.env.GROQ_API_KEY) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b', temperature: 0.2, max_tokens: 220, messages: [{ role: 'system', content: 'Summarize these supplied driving instructions for an ambulance driver in at most three short sentences. Use only the supplied route steps; do not invent roads, turns, traffic, or medical advice. If the list is incomplete, say to follow the turn-by-turn steps.' }, { role: 'user', content: JSON.stringify(steps.map((step) => ({ instruction: step.instruction, distanceMeters: step.distanceMeters }))) }] }) });
          if (!response.ok) throw new Error(`Groq returned ${response.status}`);
          const result = await response.json();
          aiSummary = result.choices?.[0]?.message?.content?.trim() || null;
        } catch (error) { console.error('Groq directions summary unavailable:', error.message); }
      }
      return json(res, 200, { target: body.target, distanceMeters: Math.round(route.distance || 0), durationSeconds: Math.round(route.duration || 0), steps, aiSummary });
    }
    if (path === '/api/profile' && req.method === 'POST') {
      const current = profileFor(user.id) || {};
      let profile;
      try { profile = validProfileUpdates(role, current, body); }
      catch (error) { return json(res, 400, { error: error.message }); }
      saveProfile(user.id, profile);
      return json(res, 200, { success: true, profile });
    }
    if (path === '/api/profile/location' && req.method === 'POST') {
      if (role !== 'ambulance') return json(res, 403, { error: 'Only ambulance accounts can update driver location.' });
      if (!validCoordinates(body.latitude, body.longitude)) return json(res, 400, { error: 'Enter valid latitude and longitude values.' });
      const now = new Date().toISOString(); const profile = { ...(profileFor(user.id) || {}), latitude: Number(body.latitude), longitude: Number(body.longitude), locationUpdatedAt: now };
      transaction(() => {
        saveProfile(user.id, profile);
        const active = db.prepare('SELECT data FROM emergencies').all().map((row) => parse(row.data)).filter((entry) => entry.ambulanceId === user.id && !['completed'].includes(entry.status));
        for (const emergency of active) {
          assignAmbulanceHospital(emergency, profile);
          const previousLocation = emergency.ambulanceLocation;
          const location = { latitude: profile.latitude, longitude: profile.longitude };
          const automaticStatus = automaticAmbulanceStatus(emergency, location, previousLocation);
          emergency.ambulanceLocation = { ...location, timestamp: now };
          if (automaticStatus) recordEmergencyStatus(emergency, automaticStatus, now);
          persistEmergency(emergency);
        }
      });
      return json(res, 200, { success: true, profile });
    }
    if (path === '/api/emergencies' && req.method === 'POST') {
      if (role !== 'patient') return json(res, 403, { error: 'Only patient accounts can create an emergency.' });
      if (!validCoordinates(body.latitude, body.longitude)) return json(res, 400, { error: 'A valid patient location is required.' });
      const severity = ['low', 'medium', 'high', 'critical'].includes(body.severity) ? body.severity : null;
      if (!severity || !String(body.emergencyType || '').trim() || String(body.emergencyType).length > 80) return json(res, 400, { error: 'Enter a valid emergency type and severity.' });
      const patient = profileFor(user.id) || {}; const now = new Date().toISOString(); const emergencyId = `emg_${randomUUID()}`;
      let hospital; let emergency;
      try {
        transaction(() => {
          const options = db.prepare("SELECT p.user_id,p.data FROM profiles p JOIN users u ON u.id=p.user_id WHERE json_extract(p.data,'$.role')='hospital'").all()
            .map((row) => ({ id: row.user_id, profile: parse(row.data) }))
            .filter((item) => item.profile.availableBeds > 0 && validHospitalCoordinates(item.profile))
            .sort((a, b) => distanceKmBetween(body.latitude, body.longitude, a.profile.latitude, a.profile.longitude)
              - distanceKmBetween(body.latitude, body.longitude, b.profile.latitude, b.profile.longitude));
          hospital = options[0] || null;
          if (hospital) { hospital.profile.availableBeds = Math.max(0, hospital.profile.availableBeds - 1); saveProfile(hospital.id, hospital.profile); }
          emergency = { emergencyId, patientId: user.id, patientName: patient.name || parse(user.metadata).name || 'Patient', patientPhone: patient.phone || '', bloodGroup: patient.bloodGroup || '', allergies: patient.allergies || [], medicalConditions: patient.medicalConditions || [], latitude: Number(body.latitude), longitude: Number(body.longitude), emergencyType: String(body.emergencyType).trim(), severity, notes: String(body.notes || '').slice(0, 1000), status: 'pending', ambulanceId: null, hospitalId: hospital?.id || null, hospitalName: hospital?.profile.hospitalName || null, hospitalAddress: hospital?.profile.hospitalAddress || null, hospitalLocation: hospital && validHospitalCoordinates(hospital.profile) ? { latitude: Number(hospital.profile.latitude), longitude: Number(hospital.profile.longitude) } : null, bedReleased: false, createdAt: now, timeline: [{ status: 'pending', timestamp: now }] };
          persistEmergency(emergency);
          if (hospital) addNotification(hospital.id, 'New emergency request', `${emergency.patientName} needs assistance.`, 'emergency', emergencyId);
          const ambulances = db.prepare("SELECT p.user_id,p.data FROM profiles p JOIN users u ON u.id=p.user_id WHERE json_extract(p.data,'$.role')='ambulance' AND json_extract(p.data,'$.available')=1").all();
          for (const ambulance of ambulances) addNotification(ambulance.user_id, 'New emergency request', 'A patient emergency is available to accept.', 'emergency', emergencyId);
        });
      } catch (error) { return json(res, 400, { error: error.message }); }
      return json(res, 201, { success: true, emergency });
    }
    if (path === '/api/emergencies/mine' && req.method === 'GET') {
      if (role !== 'patient') return json(res, 403, { error: 'Only patients can view their own emergency history.' });
      const emergencies = db.prepare('SELECT data FROM emergencies WHERE patient_id = ? ORDER BY created_at DESC').all(user.id).map((row) => withCurrentHospitalLocation(parse(row.data)));
      return json(res, 200, { emergencies });
    }
    const emergencyMatch = path.match(/^\/api\/emergencies\/([^/]+)$/);
    if (emergencyMatch && req.method === 'GET') {
      const emergency = getEmergency(decodeURIComponent(emergencyMatch[1]));
      const ambulanceQueueItem = role === 'ambulance' && isVisiblePendingEmergency(emergency);
      if (!emergency || (!canAccessEmergency(user, emergency) && !ambulanceQueueItem)) return json(res, 404, { error: 'Emergency not found.' });
      if (role === 'ambulance' && emergency.ambulanceId === user.id && ['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(emergency.status)) transaction(() => {
        if (assignAmbulanceHospital(emergency, profileFor(user.id))) persistEmergency(emergency);
      });
      return json(res, 200, { emergency: withCurrentHospitalLocation(emergency) });
    }
    if (path === '/api/emergencies' && req.method === 'GET') {
      if (!['ambulance', 'hospital'].includes(role)) return json(res, 403, { error: 'This account cannot view the response queue.' });
      const emergencies = db.prepare('SELECT data FROM emergencies ORDER BY created_at DESC').all().map((row) => parse(row.data)).filter((emergency) => role === 'hospital' ? emergency.hospitalId === user.id : (isVisiblePendingEmergency(emergency) || emergency.ambulanceId === user.id));
      if (role === 'ambulance') transaction(() => {
        for (const emergency of emergencies) {
          if (emergency.ambulanceId === user.id && ['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(emergency.status) && assignAmbulanceHospital(emergency, profileFor(user.id))) persistEmergency(emergency);
        }
      });
      return json(res, 200, { emergencies: emergencies.map(withCurrentHospitalLocation).map((emergency) => role === 'hospital' ? withCurrentAmbulanceLocation(emergency) : emergency) });
    }
    if (path === '/api/emergencies/accept' && req.method === 'POST') {
      if (role !== 'ambulance') return json(res, 403, { error: 'Only ambulance accounts can accept emergencies.' });
      const emergency = getEmergency(body.emergencyId); const profile = profileFor(user.id);
      if (!emergency) return json(res, 404, { error: 'Emergency not found.' });
      if (emergency.status === 'pending' && !isVisiblePendingEmergency(emergency)) return json(res, 409, { error: 'This request is older than 2 hours and is no longer available in the ambulance queue. It remains available for admin review.' });
      if (!profile?.available) return json(res, 409, { error: 'This ambulance is already assigned to an emergency.' });
      if (emergency.status !== 'pending' || emergency.ambulanceId) return json(res, 409, { error: 'This emergency has already been accepted.' });
      transaction(() => {
        emergency.status = 'assigned'; emergency.ambulanceId = user.id; emergency.timeline.push({ status: 'assigned', timestamp: new Date().toISOString() });
        assignAmbulanceHospital(emergency, profile);
        if (validCoordinates(profile.latitude, profile.longitude)) emergency.ambulanceLocation = { latitude: profile.latitude, longitude: profile.longitude, timestamp: profile.locationUpdatedAt || new Date().toISOString() };
        persistEmergency(emergency); profile.available = false; saveProfile(user.id, profile);
        db.prepare("UPDATE notifications SET is_read = 1 WHERE emergency_id = ? AND type = 'emergency' AND is_read = 0").run(emergency.emergencyId);
        db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'emergency' AND is_read = 0").run(user.id);
        addNotification(emergency.patientId, 'Ambulance assigned', `${profile.ambulanceNumber || profile.driverName || 'An ambulance'} accepted your request.`, 'status', emergency.emergencyId);
        if (emergency.hospitalId) addNotification(emergency.hospitalId, 'Ambulance assigned', 'An ambulance accepted an emergency assigned to your hospital.', 'status', emergency.emergencyId);
        const latestMessageRow = db.prepare('SELECT data FROM messages WHERE emergency_id = ? ORDER BY created_at DESC LIMIT 1').get(emergency.emergencyId);
        if (latestMessageRow && parse(latestMessageRow.data).senderId !== user.id) {
          addNotification(user.id, 'New emergency message', 'There are messages waiting in this emergency chat.', 'message', emergency.emergencyId);
        }
      });
      return json(res, 200, { success: true, emergency: withCurrentHospitalLocation(emergency) });
    }
    if (path === '/api/emergencies/status' && req.method === 'POST') {
      if (role !== 'ambulance') return json(res, 403, { error: 'Only ambulance accounts can update response status.' });
      const emergency = getEmergency(body.emergencyId);
      if (!emergency) return json(res, 404, { error: 'Emergency not found.' });
      if (emergency.ambulanceId !== user.id) return json(res, 403, { error: 'This emergency is assigned to a different ambulance.' });
      const from = STATUS_FLOW.indexOf(emergency.status); const to = STATUS_FLOW.indexOf(body.status);
      if (to < 0 || to !== from + 1) return json(res, 400, { error: 'Emergency status must follow the response workflow.' });
      if (body.ambulanceLocation && !validCoordinates(body.ambulanceLocation.latitude, body.ambulanceLocation.longitude)) return json(res, 400, { error: 'Enter a valid ambulance location.' });
      transaction(() => {
        assignAmbulanceHospital(emergency, profileFor(user.id));
        if (body.ambulanceLocation) emergency.ambulanceLocation = { latitude: Number(body.ambulanceLocation.latitude), longitude: Number(body.ambulanceLocation.longitude), timestamp: new Date().toISOString() };
        if (body.status === 'arrived' && validCoordinates(emergency.ambulanceLocation?.latitude, emergency.ambulanceLocation?.longitude)) {
          emergency.pickupDepartureAnchor = { latitude: Number(emergency.ambulanceLocation.latitude), longitude: Number(emergency.ambulanceLocation.longitude) };
        } else if (body.status !== 'arrived') {
          delete emergency.pickupDepartureAnchor;
        }
        const statusTimestamp = recordEmergencyStatus(emergency, body.status);
        if (body.status === 'completed') releaseHospitalBed(emergency);
        persistEmergency(emergency);
        if (body.status === 'delivered') recordAmbulanceTrip(emergency, profileFor(user.id), statusTimestamp);
        if (body.status === 'completed') {
          const profile = profileFor(user.id); profile.available = true; saveProfile(user.id, profile);
          db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND emergency_id = ?').run(user.id, emergency.emergencyId);
        }
      });
      return json(res, 200, { success: true, emergency: withCurrentHospitalLocation(emergency) });
    }
    if (path === '/api/analytics' && req.method === 'GET') {
      if (role !== 'hospital') return json(res, 403, { error: 'Analytics are available to hospital accounts.' });
      const emergencies = db.prepare('SELECT data FROM emergencies ORDER BY created_at DESC').all().map((row) => parse(row.data)).filter((emergency) => emergency.hospitalId === user.id);
      const typeDistribution = {}; const dailyEmergencies = {};
      for (const emergency of emergencies) { typeDistribution[emergency.emergencyType] = (typeDistribution[emergency.emergencyType] || 0) + 1; const date = new Date(emergency.createdAt).toLocaleDateString(); dailyEmergencies[date] = (dailyEmergencies[date] || 0) + 1; }
      return json(res, 200, { totalEmergencies: emergencies.length, completedEmergencies: emergencies.filter((entry) => entry.status === 'completed').length, pendingEmergencies: emergencies.filter((entry) => entry.status === 'pending').length, activeEmergencies: emergencies.filter((entry) => ['assigned', 'enroute', 'arrived', 'transporting', 'delivered'].includes(entry.status)).length, typeDistribution, dailyEmergencies });
    }
    if (path === '/api/messages' && req.method === 'POST') {
      const emergency = getEmergency(body.emergencyId);
      if (!emergency || !canAccessEmergency(user, emergency)) return json(res, 404, { error: 'Emergency not found.' });
      const messageText = String(body.message || '').trim();
      if (!messageText || messageText.length > 2000) return json(res, 400, { error: 'Messages must contain 1 to 2000 characters.' });
      const profile = profileFor(user.id) || {}; const createdAt = new Date().toISOString(); const message = { messageId: randomUUID(), emergencyId: body.emergencyId, senderId: user.id, senderName: profile.name || user.email, message: messageText, type: body.type === 'image' ? 'image' : 'text', timestamp: createdAt };
      db.prepare('INSERT INTO messages VALUES(?,?,?,?)').run(message.messageId, message.emergencyId, JSON.stringify(message), createdAt);
      const recipientIds = [emergency.patientId, emergency.ambulanceId, emergency.hospitalId].filter((id) => id && id !== user.id);
      for (const recipientId of recipientIds) addNotification(recipientId, 'New emergency message', `New message from ${message.senderName}.`, 'message', emergency.emergencyId);
      return json(res, 201, { success: true, message });
    }
    if (path.startsWith('/api/messages/') && req.method === 'GET') {
      const emergency = getEmergency(decodeURIComponent(path.split('/').pop()));
      if (!emergency || !canAccessEmergency(user, emergency)) return json(res, 404, { error: 'Emergency not found.' });
      const messages = db.prepare('SELECT data FROM messages WHERE emergency_id = ? ORDER BY created_at').all(emergency.emergencyId).map((row) => parse(row.data));
      return json(res, 200, { messages });
    }
    if (path === '/api/notifications' && req.method === 'GET') {
      const activeStatuses = ['assigned', 'enroute', 'arrived', 'transporting', 'delivered'];
      const notifications = db.prepare('SELECT id, title, message, type, emergency_id AS emergencyId, is_read AS isRead, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 200').all(user.id).filter((row) => {
        if (role !== 'ambulance' || !row.emergencyId) return true;
        const emergency = getEmergency(row.emergencyId);
        if (!emergency) return false;
        if (row.type === 'emergency') return isVisiblePendingEmergency(emergency);
        return emergency.ambulanceId === user.id && activeStatuses.includes(emergency.status);
      }).slice(0, 50).map((row) => ({ ...row, isRead: Boolean(row.isRead) }));
      return json(res, 200, { notifications });
    }
    if (path === '/api/ambulance/history' && req.method === 'GET') {
      if (role !== 'ambulance') return json(res, 403, { error: 'Ambulance trip history is only available to ambulance accounts.' });
      const trips = db.prepare('SELECT emergency_id AS emergencyId, ambulance_number AS ambulanceNumber, driver_name AS driverName, hospital_name AS hospitalName, hospital_address AS hospitalAddress, emergency_type AS emergencyType, reached_at AS reachedAt FROM ambulance_trip_history WHERE ambulance_id = ? ORDER BY reached_at DESC LIMIT 100').all(user.id);
      const total = db.prepare('SELECT COUNT(*) AS count FROM ambulance_trip_history WHERE ambulance_id = ?').get(user.id).count;
      return json(res, 200, { total, trips });
    }
    if (path === '/api/notifications/read' && req.method === 'POST') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(String(body.notificationId || ''), user.id);
      return json(res, 200, { success: true });
    }
    if (path === '/api/emergencies/notify' && req.method === 'POST') {
      const emergency = getEmergency(body.emergencyId);
      if (!emergency || emergency.patientId !== user.id) return json(res, 404, { error: 'Emergency not found.' });
      const patientProfile = profileFor(user.id) || {};
      const delivery = await deliverEmergencyAlerts(patientProfile.emergencyContacts, emergency);
      return json(res, 200, { success: true, ...delivery, message: delivery.notified ? 'Configured emergency contact alerts were delivered.' : 'In-app team notifications are active. Configure SMS/email credentials to contact emergency contacts.' });
    }
    if (!path.startsWith('/api/') && await serveStatic(req, res, path)) return;
    return json(res, 404, { error: 'Route not found.' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Internal server error.' });
  }
});

const apiPort = Number(process.env.PORT || process.env.API_PORT) || 3001;
const apiHost = process.env.API_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
apiServer.listen(apiPort, apiHost, () => console.log(`SQLite API ready at http://${apiHost}:${apiPort} (resqlink.sqlite)`));
if (!process.argv.includes('--api-only')) {
  const vite = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], { cwd: root, stdio: 'inherit', windowsHide: true });
  vite.on('exit', (code) => { backupTimer.close(); sessionCleanupTimer.close(); apiServer.close(); process.exit(code ?? 0); });
  process.on('SIGINT', () => { vite.kill('SIGINT'); apiServer.close(); });
  process.on('SIGTERM', () => { vite.kill('SIGTERM'); apiServer.close(); });
}
