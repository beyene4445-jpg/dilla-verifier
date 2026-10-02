// ============================================================
// QR Scanner
// ============================================================
export class QRScanner {
  constructor(elementId, onScan) {
    this.elementId = elementId;
    this.onScan = onScan;
    this.scanner = null;
    this.running = false;
    this.lastScan = '';
    this.lastScanTime = 0;
    this.cooldownMs = 3000;
  }

  async start() {
    if (this.running) return;
    if (!window.Html5Qrcode) throw new Error('Html5Qrcode not loaded');

    this.scanner = new window.Html5Qrcode(this.elementId, { verbose: false });

    const config = {
      fps: 12,
      qrbox: (w, h) => {
        const size = Math.min(w, h) * 0.75;
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
    };

    await this.scanner.start(
      { facingMode: 'environment' },
      config,
      (text) => this._handle(text),
      () => {}
    );
    this.running = true;
  }

  _handle(text) {
    const now = Date.now();
    if (text === this.lastScan && now - this.lastScanTime < this.cooldownMs) return;
    this.lastScan = text;
    this.lastScanTime = now;
    this.onScan(text);
  }

  async stop() {
    if (!this.scanner || !this.running) return;
    try {
      await this.scanner.stop();
    } catch {}
    this.running = false;
  }

  async pause() {
    if (this.scanner && this.running) {
      try { this.scanner.pause(true); } catch {}
    }
  }

  async resume() {
    if (this.scanner && this.running) {
      try { this.scanner.resume(); } catch {}
    }
  }
}
