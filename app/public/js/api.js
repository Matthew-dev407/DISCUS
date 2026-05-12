// ── API Communication Layer ──
const API = {
  base: '/api',
  token: localStorage.getItem('discus_token'),

  setToken(t) { this.token = t; localStorage.setItem('discus_token', t); },
  clearToken() { this.token = null; localStorage.removeItem('discus_token'); },

  async request(method, path, body, isFormData) {
    const opts = { method, headers: {} };
    if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
    if (body && !isFormData) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    if (body && isFormData) { opts.body = body; }
    const res = await fetch(this.base + path, opts);
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      if (!res.ok) throw new Error(`Erro na requisição ${res.status}`);
      throw new Error('Erro ao processar a resposta do servidor');
    }
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },

  get(p) { return this.request('GET', p); },
  post(p, b, f) { return this.request('POST', p, b, f); },
  put(p, b) { return this.request('PUT', p, b); },
};
