async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(path, { ...options, headers, credentials: 'same-origin' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}

export const auth = {
  async signIn(email, password) {
    try { return { data: await request('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }), error: null }; }
    catch (error) { return { data: null, error: { message: error.message } }; }
  },
  async signUp(email, password, metadata = {}) {
    try { return { data: await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, metadata }) }), error: null }; }
    catch (error) { return { data: null, error: { message: error.message } }; }
  },
  async signOut() {
    try { await request('/api/auth/signout', { method: 'POST' }); } catch {}
    return { error: null };
  },
  async getSession() {
    try {
      const result = await request('/api/auth/session');
      return { data: { session: result.session }, error: null };
    } catch (error) { return { data: { session: null }, error: { message: error.message } }; }
  },
  async getUser() {
    try {
      const result = await request('/api/auth/session');
      return { data: { user: result.user }, error: null };
    } catch (error) { return { data: { user: null }, error: { message: error.message } }; }
  },
  async getCurrentUser() { return this.getUser(); },
};
