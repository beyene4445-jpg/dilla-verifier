export const faceHelper = {
  modelsLoaded: false,
  MODEL_URL: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',

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

  async captureDescriptor(videoElement) {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return Array.from(detection.descriptor);
  },
};
