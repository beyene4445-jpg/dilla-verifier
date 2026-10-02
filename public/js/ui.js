// ============================================================
// UI Helpers
// ============================================================
export const ui = {
  showStatus(type, icon, title, subtitle, extra = '') {
    const el = document.getElementById('status');
    if (!el) return;
    el.className = `status ${type}`;
    el.innerHTML = `
      <div class="icon">${icon}</div>
      <div class="title">${title}</div>
      <div class="subtitle">${subtitle}</div>
      ${extra ? `<div class="name">${extra}</div>` : ''}
    `;
  },

  hideStatus() {
    const el = document.getElementById('status');
    if (el) el.className = 'status hidden';
  },

  speak(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      speechSynthesis.speak(u);
    } catch {}
  },

  beep(ok = true) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = ok ? 880 : 220;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, ok ? 120 : 400);
    } catch {}
  },

  toast(msg, ms = 2200) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  },
};
