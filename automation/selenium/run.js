import { Builder, Browser, By, Key, until, Select } from 'selenium-webdriver';
import { Options as EdgeOptions, ServiceBuilder as EdgeServiceBuilder } from 'selenium-webdriver/edge.js';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { distanceKm } from '../../src/app/utils/geo.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const apiUrl = process.env.E2E_API_URL || 'http://127.0.0.1:3001';
const dbPath = resolve(projectRoot, 'resqlink.sqlite');
const resultsDir = resolve(projectRoot, 'automation/selenium/results');
try { loadEnvFile(resolve(projectRoot, '.env')); } catch {}
const admin = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const results = [];
let driver;
const startedProcesses = [];
let emergencyId;
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const accounts = {
  patient: { email: `e2e.patient.${suffix}@example.test`, password: 'TestPass123!', name: 'E2E Patient', phone: '5550101001' },
  hospital: { email: `e2e.hospital.${suffix}@example.test`, password: 'TestPass123!', name: 'E2E Hospital User', hospitalName: `Sai Deepa Hospital ${suffix}`, hospitalAddress: 'PLOT NO.387, State Bank of India Rd, MIG Colony, HUDA Colony, Chanda Nagar, Hyderabad, Telangana 500050' },
  ambulance: { email: `e2e.ambulance.${suffix}@example.test`, password: 'TestPass123!', name: 'E2E Driver', phone: '5550101002', ambulanceNumber: `VR-${suffix.slice(-6)}` },
};
accounts.ambulance.hospitalName = accounts.hospital.hospitalName;

const pause = (ms = 500) => new Promise((resolvePause) => setTimeout(resolvePause, ms));
const pass = (name, detail = '') => {
  results.push({ name, status: 'passed', detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
};
const fail = (name, error) => {
  results.push({ name, status: 'failed', detail: error.message });
  console.error(`FAIL  ${name} — ${error.message}`);
};
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function scenario(name, fn) {
  try { await fn(); pass(name); }
  catch (error) { fail(name, error); throw error; }
}
async function ensureRunning() {
  const [healthResult, pageResult] = await Promise.allSettled([fetch(`${apiUrl}/api/health`), fetch(baseUrl)]);
  const healthReady = healthResult.status === 'fulfilled' && healthResult.value.ok;
  const pageReady = pageResult.status === 'fulfilled' && pageResult.value.ok;
  if (healthReady && pageReady) return;
  if (!healthReady) startedProcesses.push(spawn(process.execPath, ['server/index.js', '--api-only'], { cwd: projectRoot, stdio: 'inherit', windowsHide: true }));
  if (!pageReady) startedProcesses.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { cwd: projectRoot, stdio: 'inherit', windowsHide: true }));

  if (startedProcesses.length) console.log('Starting the local ResQLink app for this run...');
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const [health, page] = await Promise.all([fetch(`${apiUrl}/api/health`), fetch(baseUrl)]);
      if (health.ok && page.ok) return;
    } catch {}
    await pause(500);
  }
  throw new Error(`App did not become ready at ${baseUrl} and ${apiUrl}.`);
}
async function clickText(text, selector = 'button') {
  const element = await driver.wait(until.elementLocated(By.xpath(`//${selector}[normalize-space(.)=${JSON.stringify(text)}]`)), 10_000);
  await driver.wait(until.elementIsVisible(element), 5_000);
  await element.click();
}
async function waitForText(text, timeout = 10_000) {
  await driver.wait(async () => (await driver.findElement(By.tagName('body')).getText()).includes(text), timeout, `Expected page to show: ${text}`);
}
async function enter(id, value) {
  const input = await driver.wait(until.elementLocated(By.id(id)), 8_000, `Missing input #${id}`);
  await input.clear();
  await input.sendKeys(value);
}
async function signup(role, account) {
  await driver.get(`${baseUrl}/signup`);
  if (role !== 'patient') {
    await driver.wait(until.elementLocated(By.xpath(`//*[@role='tab' and normalize-space(.)=${JSON.stringify(role[0].toUpperCase() + role.slice(1))}]`)), 8_000).click();
  }
  await enter('name', account.name);
  await enter('email', account.email);
  await enter('password', account.password);
  if (role === 'patient') await enter('phone', account.phone);
  if (role === 'hospital') {
    await enter('hospitalName', account.hospitalName);
    await enter('hospitalAddress', account.hospitalAddress);
    await driver.wait(until.elementLocated(By.css('#hospital-location-map')), 8_000);
    await driver.wait(until.elementLocated(By.xpath("//*[contains(., 'Address location found:')]")), 15_000, 'Hospital address should be geocoded and shown as a map pin.');
  }
  if (role === 'ambulance') {
    await driver.wait(until.elementLocated(By.id('ambulanceHospital')), 8_000);
    await driver.wait(async () => (await driver.findElements(By.css('#ambulanceHospital option:not([value=""])'))).length > 0, 8_000, 'Ambulance signup should have at least one registered hospital.');
    const hospitalSelect = await driver.findElement(By.id('ambulanceHospital'));
    const hospitalOptions = await hospitalSelect.findElements(By.css('option:not([value=""])'));
    let selectedHospital = false;
    for (const option of hospitalOptions) {
      if ((await option.getText()).includes(account.hospitalName)) {
        await option.click();
        selectedHospital = true;
        break;
      }
    }
    assert(selectedHospital, 'Ambulance signup should select the hospital created for this test run.');
    await enter('ambulanceNumber', account.ambulanceNumber);
    await enter('phone', account.phone);
  }
  const form = await driver.findElement(By.css('form'));
  assert(await driver.executeScript('return arguments[0].checkValidity()', form), `${role} signup form should be valid after filling required fields.`);
  await clickText('Create Account');
  await driver.wait(until.urlIs(`${baseUrl}/`), 10_000, 'Successful signup did not return to the landing page.');
  await pause(400);
}
async function login(account, path) {
  await driver.get(`${baseUrl}/login`);
  await driver.manage().deleteCookie('resqlink_session');
  await enter('email', account.email);
  await enter('password', account.password);
  await clickText('Sign In');
  await driver.wait(until.urlContains(`${baseUrl}${path}`), 10_000, `Login did not navigate to ${path}`);
}
function latestEmergency() {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const row = db.prepare('SELECT data FROM emergencies ORDER BY created_at DESC LIMIT 1').get();
    return row ? JSON.parse(row.data) : null;
  } finally { db.close(); }
}
function profileByEmail(email) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email); const row = user && db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(user.id); return row ? JSON.parse(row.data) : null; } finally { db.close(); }
}
function profileById(userId) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { const row = db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(userId); return row ? JSON.parse(row.data) : null; } finally { db.close(); }
}
function makeHospitalAvailable(email) {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('BEGIN IMMEDIATE');
    const account = db.prepare('SELECT u.id, p.data FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.email = ?').get(email);
    assert(account, 'Test hospital profile should exist before enabling emergency dispatch.');
    const profile = JSON.parse(account.data);
    assert(profile.role === 'hospital' && Number.isFinite(Number(profile.latitude)) && Number.isFinite(Number(profile.longitude)), 'Test hospital should have valid coordinates.');
    profile.capacity = 1;
    profile.availableBeds = 1;
    db.prepare('UPDATE profiles SET data = ? WHERE user_id = ?').run(JSON.stringify(profile), account.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally { db.close(); }
}
function availableHospitals() {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return db.prepare('SELECT user_id AS userId, data FROM profiles').all()
      .map((row) => ({ userId: row.userId, profile: JSON.parse(row.data) }))
      .filter(({ profile }) => profile.role === 'hospital' && Number(profile.availableBeds) > 0
        && Number.isFinite(Number(profile.latitude)) && Number.isFinite(Number(profile.longitude))
        && !(Number(profile.latitude) === 0 && Number(profile.longitude) === 0));
  } finally { db.close(); }
}
function userByEmail(email) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { return db.prepare('SELECT id, email, password_hash, metadata FROM users WHERE email = ?').get(email) || null; }
  finally { db.close(); }
}
function unreadEmergencyAlerts(emergencyId) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { return db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE emergency_id = ? AND type = 'emergency' AND is_read = 0").get(emergencyId).count; }
  finally { db.close(); }
}
async function apiStatus(path, token) {
  const response = await fetch(`${apiUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return response.status;
}
async function shareAmbulanceLocation(location) {
  return driver.executeAsyncScript(`const location=arguments[0],done=arguments[1]; fetch('/api/profile/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(location)}).then(async response=>done({status:response.status,body:await response.json()})).catch(error=>done({status:0,error:error.message}));`, location);
}
async function waitForEmergencyStatus(status, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  let emergency;
  while (Date.now() < deadline) {
    emergency = latestEmergency();
    if (emergency?.emergencyId === emergencyId && emergency.status === status) return emergency;
    await pause(100);
  }
  throw new Error(`Emergency did not automatically reach ${status}; current status is ${emergency?.status || 'unknown'}.`);
}
function pointAlongRoute(origin, destination, meters) {
  const latitudeRadians = Number(origin.latitude) * Math.PI / 180;
  const northMeters = (Number(destination.latitude) - Number(origin.latitude)) * 111320;
  const eastMeters = (Number(destination.longitude) - Number(origin.longitude)) * 111320 * Math.cos(latitudeRadians);
  const routeLength = Math.hypot(northMeters, eastMeters);
  assert(routeLength > 0, 'Test hospital and patient must have different coordinates.');
  return {
    latitude: Number(origin.latitude) + northMeters / routeLength * meters / 111320,
    longitude: Number(origin.longitude) + eastMeters / routeLength * meters / (111320 * Math.cos(latitudeRadians)),
  };
}
async function findCachedEdgeDriver() {
  const matches = [];
  async function walk(directory) {
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.name.toLowerCase() === 'msedgedriver.exe') matches.push(path);
    }
  } catch {}
  }
  await walk(resolve(dirname(fileURLToPath(import.meta.url)), '.cache/msedgedriver'));
  return matches.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] || null;
}

try {
  await ensureRunning();
  const options = new EdgeOptions();
  options.addArguments('--headless=new', '--disable-gpu', '--window-size=1440,1000', '--disable-notifications', '--disable-extensions');
  const cachedDriver = await findCachedEdgeDriver();
  const builder = new Builder().forBrowser(Browser.EDGE).setEdgeOptions(options);
  if (cachedDriver) builder.setEdgeService(new EdgeServiceBuilder(cachedDriver));
  driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 30_000, script: 15_000 });

  await scenario('Landing page and initial app render', async () => {
    await driver.get(baseUrl);
    await waitForText('ResQLink');
    assert((await driver.getCurrentUrl()).startsWith(baseUrl), 'Landing page redirected unexpectedly.');
  });

  await scenario('Unauthenticated API access is rejected', async () => {
    assert(await apiStatus('/api/profile') === 401, 'Profile API should return HTTP 401 without a session.');
    assert(await apiStatus('/api/emergencies') === 401, 'Emergency API should return HTTP 401 without a session.');
    assert(await apiStatus('/api/emergencies/not-real') === 401, 'Emergency detail API should return HTTP 401 without a session.');
  });

  await scenario('Hospital location accepts Plus Codes and full addresses', async () => {
    const lookup = (address) => driver.executeAsyncScript(`const address=arguments[0],done=arguments[1]; fetch('/api/geocode/hospital',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,hospitalName:'Sai Deepa Hospital'})}).then(async response=>done({status:response.status,body:await response.json()})).catch(error=>done({status:0,error:error.message}));`, address);
    const plusCode = await lookup('F8VH+45 Hyderabad, Telangana');
    assert(plusCode.status === 200, `Plus Code lookup failed: ${plusCode.body?.error || plusCode.error || plusCode.status}`);
    assert(Math.abs(plusCode.body.location.latitude - 17.4928125) < 0.0001 && Math.abs(plusCode.body.location.longitude - 78.3279375) < 0.0001, 'Plus Code should resolve to its Chanda Nagar coordinates.');
    const fullAddress = await lookup('PLOT NO.387, State Bank of India Rd, MIG Colony, HUDA Colony, Chanda Nagar, Hyderabad, Telangana 500050');
    assert(fullAddress.status === 200, `Full address lookup failed: ${fullAddress.body?.error || fullAddress.error || fullAddress.status}`);
    assert(fullAddress.body.location.latitude >= 17.48 && fullAddress.body.location.latitude <= 17.51 && fullAddress.body.location.longitude >= 78.30 && fullAddress.body.location.longitude <= 78.35, 'Full address should resolve within the Chanda Nagar postal area.');
  });

  await scenario('Invalid login remains on the login page', async () => {
    await driver.get(`${baseUrl}/login`);
    await enter('email', `missing.${suffix}@example.test`);
    await enter('password', 'WrongPass123!');
    await clickText('Sign In');
    await pause(700);
    assert((await driver.getCurrentUrl()).endsWith('/login'), 'Invalid credentials should not navigate away.');
    assert(await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/auth/session").then(r=>r.json()).then(x=>done(!x.session)).catch(()=>done(false));'), 'Invalid credentials must not create a session.');
  });

  await scenario('Signup blocks required fields and accepts each role', async () => {
    await driver.get(`${baseUrl}/signup`);
    assert(await driver.executeScript('return document.querySelector("form").checkValidity()') === false, 'Empty signup form should fail required-field validation.');
    assert(await driver.findElement(By.id('password')).getAttribute('minlength') === '10', 'Signup should enforce the server password minimum in the browser.');
    await signup('patient', accounts.patient);
    assert(userByEmail(accounts.patient.email), 'Patient account was not saved to SQLite.');
    assert(userByEmail(accounts.patient.email).password_hash !== accounts.patient.password, 'Password should be stored as a hash.');
    await signup('hospital', accounts.hospital);
    assert(userByEmail(accounts.hospital.email), 'Hospital account was not saved to SQLite.');
    makeHospitalAvailable(accounts.hospital.email);
    await signup('ambulance', accounts.ambulance);
    assert(userByEmail(accounts.ambulance.email), 'Ambulance account was not saved to SQLite.');
  });

  await scenario('Admin panel separates and edits account categories', async () => {
    assert(admin.email && admin.password, 'Admin credentials must be configured in .env.');
    await login(admin, '/admin');
    await waitForText('Admin Panel');
    await waitForText(accounts.hospital.hospitalName);
    const hospitalList = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/admin/accounts?role=hospital").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(hospitalList.accounts?.some((account) => account.email === accounts.hospital.email), 'Admin API should list hospital accounts.');
    await clickText('Patients');
    await waitForText(accounts.patient.name);
    await clickText('Ambulances');
    const ambulanceList = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/admin/accounts?role=ambulance").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(ambulanceList.accounts?.some((account) => account.email === accounts.ambulance.email), 'Admin API should list ambulance accounts.');
  });

  await scenario('Duplicate signup shows a validation error', async () => {
    await driver.get(`${baseUrl}/signup`);
    await enter('name', accounts.patient.name);
    await enter('email', accounts.patient.email);
    await enter('password', accounts.patient.password);
    await enter('phone', accounts.patient.phone);
    await clickText('Create Account');
    await waitForText('already registered', 8_000);
    assert((await driver.getCurrentUrl()).endsWith('/signup'), 'Duplicate signup should stay on signup.');
    await driver.get(`${baseUrl}/login`);
    await enter('email', accounts.patient.email);
    await enter('password', 'IncorrectPass123!');
    await clickText('Sign In');
    await waitForText('Invalid email or password', 8_000);
    assert((await driver.getCurrentUrl()).endsWith('/login'), 'Incorrect password should not log in.');
  });

  await scenario('Patient login and SOS emergency creation', async () => {
    await login(accounts.patient, '/patient');
    await waitForText('Emergency SOS');
    await driver.get(`${baseUrl}/ambulance`);
    await driver.wait(until.urlContains('/patient'), 8_000, 'A patient account should be redirected away from the ambulance dashboard.');
    await waitForText('Emergency SOS');
    await clickText('Add First Contact');
    await enter('name', 'E2E Emergency Contact');
    await enter('phone', '5550101999');
    await enter('email', `contact.${suffix}@example.test`);
    await clickText('Add Contact');
    await waitForText('E2E Emergency Contact');
    assert(profileByEmail(accounts.patient.email)?.emergencyContacts?.length === 1, 'Emergency contact should be saved in SQLite.');
    await driver.executeScript(`navigator.geolocation.getCurrentPosition = (cb) => cb({coords:{latitude:17.4689,longitude:78.3489}});`);
    const invalidEmergency = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/emergencies",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({emergencyType:"test",severity:"critical"})}).then(r=>done(r.status)).catch(()=>done(0));');
    assert(invalidEmergency === 400, 'Emergency creation must reject missing coordinates.');
    const adminForbidden = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/admin/accounts?role=hospital").then(r=>done(r.status)).catch(()=>done(0));');
    assert(adminForbidden === 403, 'Non-admin accounts must not access the admin API.');
    const patientQueue = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/emergencies").then(r=>done(r.status)).catch(()=>done(0));');
    assert(patientQueue === 403, 'Patients must not access the responder emergency queue.');
    const patientStatusForbidden = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/emergencies/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({emergencyId:"unknown",status:"completed"})}).then(r=>done(r.status)).catch(()=>done(0));');
    assert(patientStatusForbidden === 403, 'Patients must not update emergency status.');
    const sosButton = await driver.findElement(By.xpath("//h2[normalize-space(.)='Emergency SOS']/following::button[1]"));
    const hospitalCandidates = availableHospitals();
    await sosButton.click();
    await waitForText('Emergency Active', 12_000);
    const emergency = latestEmergency();
    assert(emergency?.patientName === accounts.patient.name, 'SQLite emergency record has an unexpected patient.');
    assert(emergency?.status === 'pending', `New emergency should be pending, got ${emergency?.status}.`);
    if (hospitalCandidates.length) {
      const nearestHospital = hospitalCandidates
        .sort((a, b) => distanceKm([emergency.latitude, emergency.longitude], [a.profile.latitude, a.profile.longitude])
          - distanceKm([emergency.latitude, emergency.longitude], [b.profile.latitude, b.profile.longitude]))[0];
      assert(emergency.hospitalId === nearestHospital.userId, 'Emergency creation should assign the nearest hospital with an available bed.');
    } else {
      assert(!emergency.hospitalId, 'Emergency creation should not assign an unavailable hospital.');
    }
    emergencyId = emergency.emergencyId;
  });

  await scenario('Public emergency tracking opens without login', async () => {
    await driver.manage().deleteCookie('resqlink_session');
    await driver.get(`${baseUrl}/public-tracking/${emergencyId}`);
    await waitForText('Patient Information');
    await waitForText(accounts.patient.name.split(' ')[0]);
    const publicData = await driver.executeAsyncScript(`const done=arguments[0]; fetch('/api/public/emergencies/${emergencyId}').then(r=>r.json()).then(x=>done(x.emergency)).catch(()=>done(null));`);
    assert(publicData && !('patientPhone' in publicData) && !('allergies' in publicData) && !('medicalConditions' in publicData) && !('patientId' in publicData), 'Public tracking must not expose private or medical fields.');
  });

  await scenario('Patient can send and retrieve emergency chat messages', async () => {
    await login(accounts.patient, '/patient');
    await clickText('Chat');
    await waitForText('Emergency Chat');
    const callButton = await driver.findElement(By.css('button[aria-label="Call patient"]'));
    const videoButton = await driver.findElement(By.css('button[aria-label="Video calling unavailable"]'));
    assert(await callButton.isEnabled() === false, 'Patients should not be offered a call button that calls their own phone number.');
    assert(await videoButton.isEnabled() === false, 'Unavailable video calling should be visibly disabled.');
    const messageInput = await driver.findElement(By.css('input[placeholder="Type a message..."]'));
    await messageInput.sendKeys(`Selenium test message ${suffix}`);
    await messageInput.sendKeys(Key.ENTER);
    await waitForText(`Selenium test message ${suffix}`);
  });

  await scenario('Ambulance accepts and completes the status workflow', async () => {
    await login(accounts.ambulance, '/ambulance');
    await waitForText('Available Emergency Requests');
    await waitForText('Distance from ambulance');
    const pendingDetail = await driver.executeAsyncScript(`const done=arguments[0]; fetch('/api/emergencies/${emergencyId}').then(async r=>done({status:r.status,body:await r.json()})).catch(error=>done({status:0,error:error.message}));`);
    assert(pendingDetail.status === 200, `An ambulance should be able to view the location for a pending queue request (HTTP ${pendingDetail.status}: ${pendingDetail.body?.error || pendingDetail.error || 'unknown'}).`);
    const selectedRequest = await driver.findElement(By.css(`[data-emergency-id="${emergencyId}"]`));
    const viewLocationButton = await selectedRequest.findElement(By.xpath(".//button[normalize-space(.)='View Location']"));
    await viewLocationButton.click();
    await waitForText('Live Location Tracking');
    await waitForText(accounts.patient.name);
    await driver.get(`${baseUrl}/ambulance`);
    await waitForText('Accept');
    await driver.executeScript(`navigator.geolocation.getCurrentPosition=(callback)=>callback({coords:{latitude:17.4689,longitude:78.3489}});`);
    await clickText('Accept');
    await waitForText('Enroute to Patient');
    await waitForText(accounts.patient.name);
    await driver.findElement(By.css('button[aria-label="Notifications"]')).click();
    const messageNotification = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'New emergency message')]")),
      8_000,
      'A new-message notification should be available to the assigned ambulance.'
    );
    await messageNotification.click();
    await waitForText('Emergency Chat');
    assert((await driver.getCurrentUrl()).includes(`/chat/${emergencyId}`), 'Message notifications should open the matching emergency chat.');
    await driver.get(`${baseUrl}/ambulance`);
    await waitForText('Enroute to Patient');
    await driver.executeScript(`navigator.geolocation.getCurrentPosition=(callback)=>callback({coords:{latitude:17.4689,longitude:78.3489}});`);
    await waitForText('You have reached the patient location');
    assert((await driver.findElements(By.css('[data-emergency-id]'))).length === 0, 'Other pending requests should be hidden while this ambulance is assigned.');
    assert(unreadEmergencyAlerts(emergencyId) === 0, 'Accepting the request should clear its unread responder notification.');
    await waitForText('Route directions to patient');
    const arrivalButton = await driver.findElement(By.xpath("//button[normalize-space(.)='Reached patient location']"));
    assert(await arrivalButton.isEnabled() === false, 'The driver should not request a route after reaching the patient.');
    const missingGpsStatus = await driver.executeAsyncScript(`const done=arguments[0]; fetch('/api/directions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emergencyId:'${emergencyId}',target:'patient',origin:null})}).then(r=>done(r.status)).catch(()=>done(0));`);
    assert(missingGpsStatus === 400, 'Route directions must reject requests without current GPS coordinates.');
    await login(accounts.patient, '/patient');
    await driver.findElement(By.css('button[aria-label="Notifications"]')).click();
    await waitForText('Ambulance assigned', 8_000);
    await login(accounts.ambulance, '/ambulance');
    await waitForText('Enroute to Patient');
    const driverCookie = await driver.manage().getCookie('resqlink_session');
    assert(driverCookie?.httpOnly, 'Ambulance session should use an HttpOnly cookie.');
    await driver.get(`${baseUrl}/ambulance/profile`);
    await waitForText('Driver profile');
    const ambulanceNumberInput = await driver.findElement(By.xpath("//label[contains(.,'Ambulance number')]//input"));
    await driver.wait(async () => ((await ambulanceNumberInput.getAttribute('value')) || '').length > 0, 8_000, 'Driver profile ambulance number should load.');
    const savedProfile = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/profile").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert((await ambulanceNumberInput.getAttribute('value')) === savedProfile.profile?.ambulanceNumber, 'Driver profile should show the saved ambulance number.');
    await driver.get(`${baseUrl}/ambulance`);
    await waitForText('Enroute to Patient');
    await clickText('Enroute to Patient');
    await waitForText('Arrived status updates automatically when GPS is within 100 m of the patient location.');
    const emergencyForRoute = latestEmergency();
    const patientLocation = { latitude: emergencyForRoute.latitude, longitude: emergencyForRoute.longitude };
    const hospitalLocation = emergencyForRoute.hospitalLocation;
    assert(hospitalLocation && distanceKm([patientLocation.latitude, patientLocation.longitude], [hospitalLocation.latitude, hospitalLocation.longitude]) > 0.5, 'The test emergency should have a distinct assigned hospital destination.');
    const arrivalUpdate = await shareAmbulanceLocation(patientLocation);
    assert(arrivalUpdate.status === 200, `Ambulance GPS update should be accepted (HTTP ${arrivalUpdate.status}).`);
    await waitForEmergencyStatus('arrived');
    await waitForText('Transporting status updates automatically when GPS detects departure');
    assert((await driver.findElements(By.xpath("//button[normalize-space(.)='Arrived at Scene']"))).length === 0, 'Arrival should not require a manual button.');
    assert((await driver.findElements(By.xpath("//button[normalize-space(.)='Transporting to Hospital']"))).length === 0, 'Transport should not require a manual button.');
    const awayFromHospital = pointAlongRoute(patientLocation, hospitalLocation, -200);
    const awayUpdate = await shareAmbulanceLocation(awayFromHospital);
    assert(awayUpdate.status === 200 && latestEmergency()?.status === 'arrived', 'Leaving the patient area away from the hospital must not start transport.');
    await shareAmbulanceLocation(patientLocation);
    const towardHospital = pointAlongRoute(patientLocation, hospitalLocation, 200);
    const departureUpdate = await shareAmbulanceLocation(towardHospital);
    assert(departureUpdate.status === 200, `Hospital-bound GPS update should be accepted (HTTP ${departureUpdate.status}).`);
    await waitForEmergencyStatus('transporting');
    await driver.wait(async () => await driver.findElement(By.css('[data-route-target]')).getAttribute('data-route-target') === 'hospital', 8_000, 'After patient pickup, the live map should route to the assigned hospital.');
    await clickText('Arrived at Hospital');
    await waitForText('Complete Handover', 10_000);
    await clickText('Complete Handover');
    const deadline = Date.now() + 10_000;
    let emergency;
    while (Date.now() < deadline) {
      emergency = latestEmergency();
      if (emergency?.status === 'completed') break;
      await pause(250);
    }
    assert(emergency?.status === 'completed', 'Emergency did not reach completed status in SQLite.');
    const currentNotifications = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/notifications").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(!currentNotifications.notifications?.some((item) => item.emergencyId === emergencyId), 'Completed emergency notifications should not remain in the ambulance notification list.');
    const tripHistory = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/ambulance/history").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(tripHistory.total >= 1 && tripHistory.trips?.some((trip) => trip.emergencyId === emergencyId), 'Ambulance history should record the successful hospital arrival.');
  });

  await scenario('Hospital dashboard, capacity edit, and analytics', async () => {
    await login(accounts.hospital, '/hospital');
    await waitForText('Bed Capacity Management');
    await waitForText('Total Cases');
    await waitForText('Live ambulance tracking');
    const hospitalForbidden = await driver.executeAsyncScript(`const done=arguments[0]; fetch('/api/emergencies/${emergencyId}').then(r=>done(r.status)).catch(()=>done(0));`);
    const expectedHospitalStatus = latestEmergency()?.hospitalId === profileByEmail(accounts.hospital.email)?.userId ? 200 : 404;
    assert(hospitalForbidden === expectedHospitalStatus, 'Hospital can only read emergencies assigned to its account.');
    await clickText('Edit Capacity');
    const capacityInput = await driver.findElement(By.xpath("//label[normalize-space(.)='Total Capacity']/following-sibling::div//input"));
    await capacityInput.clear();
    await capacityInput.sendKeys('123');
    await clickText('Save Changes');
    await waitForText('Bed capacity updated successfully');
    const profileResult = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/profile").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(profileResult.profile?.capacity === 123, `Hospital capacity should persist as 123, got ${profileResult.profile?.capacity}.`);
    assert(Number.isFinite(profileResult.profile?.latitude) && Number.isFinite(profileResult.profile?.longitude), 'Hospital signup map pin should be saved as exact coordinates.');
    const assignedEmergency = latestEmergency();
    const assignedHospitalProfile = profileById(assignedEmergency?.hospitalId);
    assert(assignedHospitalProfile && assignedEmergency?.hospitalLocation?.latitude === assignedHospitalProfile.latitude && assignedEmergency?.hospitalLocation?.longitude === assignedHospitalProfile.longitude, 'Assigned emergency should use its assigned hospital profile as the map destination.');
    await driver.get(`${baseUrl}/analytics`);
    await waitForText('Analytics');
    const result = latestEmergency();
    assert(result?.status === 'completed', 'Hospital workflow did not retain the completed emergency.');
  });

  await scenario('Sign out invalidates the session', async () => {
    await driver.get(`${baseUrl}/hospital`);
    await login(accounts.hospital, '/hospital');
    const cookie = await driver.manage().getCookie('resqlink_session');
    assert(cookie?.httpOnly, 'Session cookie must be HttpOnly.');
    const session = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/auth/session").then(r=>r.json()).then(done).catch(()=>done({}));');
    assert(session.session?.expires_at && Date.parse(session.session.expires_at) > Date.now(), 'Session must have an expiry time.');
    const hospital = userByEmail(accounts.hospital.email);
    const db = new DatabaseSync(dbPath);
    try { db.prepare('UPDATE sessions SET expires_at = ? WHERE user_id = ?').run(new Date(Date.now() - 1000).toISOString(), hospital.id); } finally { db.close(); }
    const expiredStatus = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/profile").then(r=>done(r.status)).catch(()=>done(0));');
    assert(expiredStatus === 401, 'Expired sessions must be rejected by the API.');
    const signout = await driver.executeAsyncScript('const done=arguments[0]; fetch("/api/auth/signout",{method:"POST"}).then(r=>done(r.ok)).catch(()=>done(false));');
    assert(signout, 'Signout should remain safe for an expired session.');
  });

  await scenario('Login and signup rate limits return HTTP 429', async () => {
    const loginStatuses = await Promise.all(Array.from({ length: 12 }, async (_, index) => (await fetch(`${apiUrl}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `limit.${suffix}.${index}@example.test`, password: 'wrong-password' }) })).status));
    assert(loginStatuses.includes(429), 'Repeated login attempts should be rate limited.');
    const signupStatuses = await Promise.all(Array.from({ length: 16 }, async () => (await fetch(`${apiUrl}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })).status));
    assert(signupStatuses.includes(429), 'Repeated signup attempts should be rate limited.');
  });
} catch (error) {
  console.error(`\nAutomation stopped: ${error.stack || error.message}`);
  if (results.length === 0) fail('Selenium setup', error);
  if (driver) {
    try { await mkdir(resultsDir, { recursive: true }); await driver.takeScreenshot().then((image) => writeFile(resolve(resultsDir, 'failure.png'), image, 'base64')); }
    catch {}
  }
} finally {
  if (driver) await driver.quit().catch(() => {});
  for (const processHandle of startedProcesses) processHandle.kill('SIGTERM');
  await mkdir(resultsDir, { recursive: true });
  const summary = { startedAt: new Date().toISOString(), baseUrl, total: results.length, passed: results.filter((r) => r.status === 'passed').length, failed: results.filter((r) => r.status === 'failed').length, results };
  await writeFile(resolve(resultsDir, 'latest.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const rows = results.map((item) => `<tr><td>${item.status === 'passed' ? 'PASS' : 'FAIL'}</td><td>${item.name}</td><td>${item.detail || ''}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>ResQLink Selenium Report</title><style>body{font:15px system-ui;max-width:1000px;margin:32px auto;padding:0 20px;color:#172033}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #ddd;padding:10px}td:first-child{font-weight:700}</style></head><body><h1>ResQLink Selenium report</h1><p>${summary.passed}/${summary.total} scenarios passed · ${summary.startedAt}</p><table><thead><tr><th>Result</th><th>Scenario</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  await writeFile(resolve(resultsDir, 'latest.html'), html);
  console.log(`\nSelenium results: ${summary.passed}/${summary.total} passed; report: automation/selenium/results/latest.html`);
  if (summary.failed) process.exitCode = 1;
}
