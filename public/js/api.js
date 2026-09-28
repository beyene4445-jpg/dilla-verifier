// የAPI ደንበኛ
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
  };
  
  export const uiHelpers = {};