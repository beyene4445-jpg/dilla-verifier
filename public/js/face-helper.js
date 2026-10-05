// ============================================================
// Fast Face API Helper
// ============================================================
export const faceHelper = {
  modelsLoaded: false,
  MODEL_URL: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  video: null,

  async loadModels() {
    if (this.modelsLoaded) return;
    if (!window.faceapi) throw new Error('face-api.js not loaded');

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL),
    ]);

    this.modelsLoaded = true;
    console.log('✅ Face models loaded');
  },

  // ============ Fast descriptor (1-2 sec) ============
  async captureDescriptor(videoElement) {
    // Higher input size = faster + more accurate
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,      // Was 416 default — higher = faster on modern phones
      scoreThreshold: 0.3, // Lower = faster detection
    });

    const detection = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return Array.from(detection.descriptor);
  },

  // ============ Continuous detection (for live) ============
  async quickDetect(videoElement) {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,      // Small = very fast
      scoreThreshold: 0.4,
    });

    const detection = await faceapi.detectSingleFace(videoElement, options);
    return detection;
  },
};
