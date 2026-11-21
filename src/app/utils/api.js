async function call(path, { method = 'GET', body } = {}) {
  try {
    const response = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('resqlink:session-expired'));
    return response.ok ? result : { error: result.error || `Request failed (${response.status})`, status: response.status };
  } catch (error) { return { error: error.message || 'Unable to connect to the local API.' }; }
}

export const api = {
  geocodeHospital: (address, hospitalName) => call('/api/geocode/hospital', { method: 'POST', body: { address, hospitalName } }),
  getSignupHospitals: () => call('/api/signup/hospitals'),
  getAdminAccounts: (role) => call(`/api/admin/accounts?role=${encodeURIComponent(role)}`),
  updateAdminAccount: (data) => call('/api/admin/accounts', { method: 'POST', body: data }),
  removeAdminAccount: (userId) => call(`/api/admin/accounts?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  getPasswordResetRequests: () => call('/api/admin/password-reset-requests'),
  reviewPasswordResetRequest: (requestId, action) => call('/api/admin/password-reset-requests', { method: 'POST', body: { requestId, action } }),
  requestPasswordReset: (email) => call('/api/auth/password-reset/request', { method: 'POST', body: { email } }),
  getPasswordResetStatus: (id, key) => call(`/api/auth/password-reset/status?id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`),
  completePasswordReset: (id, key, password) => call('/api/auth/password-reset/complete', { method: 'POST', body: { id, key, password } }),
  getAdminEmergencies: () => call('/api/admin/emergencies'),
  getHospitalAmbulances: () => call('/api/hospital/ambulances'),
  signup: (data) => call('/api/auth/signup', { method: 'POST', body: data }),
  createEmergency: (data) => call('/api/emergencies', { method: 'POST', body: data }),
  getUserEmergencies: () => call('/api/emergencies/mine'),
  getAllEmergencies: () => call('/api/emergencies'),
  getEmergencyById: (id) => call(`/api/emergencies/${encodeURIComponent(id)}`),
  getEmergency: async (id) => { const result = await call(`/api/public/emergencies/${encodeURIComponent(id)}`); return result.emergency || null; },
  updateEmergencyStatus: (data) => call('/api/emergencies/status', { method: 'POST', body: data }),
  acceptEmergency: (emergencyId) => call('/api/emergencies/accept', { method: 'POST', body: { emergencyId } }),
  getProfile: () => call('/api/profile'),
  updateProfile: (...args) => call('/api/profile', { method: 'POST', body: args.length > 1 ? args[1] : args[0] }),
  updateLocation: (data) => call('/api/profile/location', { method: 'POST', body: data }),
  getRouteDirections: (data) => call('/api/directions', { method: 'POST', body: data }),
  getAnalytics: () => call('/api/analytics'),
  sendMessage: (...args) => call('/api/messages', { method: 'POST', body: args.length > 1 ? args[1] : args[0] }),
  getMessages: (...args) => call(`/api/messages/${encodeURIComponent(args.length > 1 ? args[1] : args[0])}`),
  getNotifications: () => call('/api/notifications'),
  getAmbulanceTripHistory: () => call('/api/ambulance/history'),
  markNotificationRead: (notificationId) => call('/api/notifications/read', { method: 'POST', body: { notificationId } }),
  notifyEmergencyContacts: (emergencyId) => call('/api/emergencies/notify', { method: 'POST', body: { emergencyId } }),
};
