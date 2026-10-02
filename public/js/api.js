export const api = {
  async verify(raw, mode, options = {}) {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw, mode, ...options }),
    });
    if (!res.ok) throw new Error('Network error');
    return res.json();
  },

  async verifyFace(descriptor, mode, options = {}) {
    const res = await fetch('/api/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descriptor, mode, ...options }),
    });
    if (!res.ok) throw new Error('Network error');
    return res.json();
  },

  async parseFayda(raw) {
    const res = await fetch('/api/parse-fayda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) throw new Error('Network error');
    return res.json();
  },

  async register(payload) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Network error');
    return res.json();
  },

  async updateFace(fan, fin, descriptor) {
    const res = await fetch('/api/update-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fan, fin, descriptor }),
    });
    if (!res.ok) throw new Error('Network error');
    return res.json();
  },
};
