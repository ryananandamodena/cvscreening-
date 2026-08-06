import * as faceapi from 'face-api.js';
import { apiService } from './api.service';

// Publicly hosted face-api.js model weights (no local model files needed).
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();
  return loadingPromise;
}

/**
 * Extracts a 128-d face descriptor from an HTML image/video/canvas element.
 * Returns null if no face was detected in the frame.
 */
export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> {
  await loadFaceModels();
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

export const faceRecognitionService = {
  getEnrollmentStatus: async (): Promise<{ enrolled: boolean }> => {
    return apiService.get('/attendance/face-enrollment/status');
  },
  enroll: async (descriptor: number[]): Promise<any> => {
    return apiService.post('/attendance/face-enrollment', { descriptor });
  },
};

export default faceRecognitionService;
