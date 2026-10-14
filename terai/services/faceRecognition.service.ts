import { apiService } from './api.service';

// Publicly hosted face-api.js model weights (no local model files needed).
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function getFaceApi() {
  return import('face-api.js');
}

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    } catch (err) {
      // Without this, a failed download would permanently cache the rejected promise —
      // "Ambil Ulang" (retake/retry) would just keep re-throwing the same stale failure forever
      // instead of actually retrying the download (Module 14 fix).
      loadingPromise = null;
      throw err;
    }
  })();
  return loadingPromise;
}

/**
 * Extracts a 128-d face descriptor from an HTML image/video/canvas element.
 * Returns null if no face was detected in the frame.
 */
// Thrown specifically when the face-detection model weights fail to download (e.g. no network,
// the CDN is blocked) — distinguished from "no face found in this frame" so the UI can show a
// real error state with a retry action instead of silently behaving as if verification passed
// (Module 14 audit, S8/S9).
export class FaceModelLoadError extends Error {
  constructor(cause: unknown) {
    super('Failed to load face detection models');
    this.name = 'FaceModelLoadError';
    this.cause = cause as Error;
  }
}

export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> {
  try {
    await loadFaceModels();
  } catch (err) {
    throw new FaceModelLoadError(err);
  }
  const faceapi = await getFaceApi();

  // TinyFaceDetector's defaults (inputSize 416, scoreThreshold 0.5) are tuned for speed over
  // recall — on a real webcam frame (mixed indoor lighting, mild compression, an off-center
  // face) it frequently reports "no face" on a photo a person can plainly see is a clear,
  // front-facing shot, which reads to the user as a broken feature rather than "retake it".
  // Try progressively larger input sizes / lower score thresholds before giving up, instead of
  // failing on the very first (strictest) attempt.
  const attempts = [
    { inputSize: 416, scoreThreshold: 0.5 },
    { inputSize: 512, scoreThreshold: 0.3 },
    { inputSize: 608, scoreThreshold: 0.2 },
  ];

  for (const opts of attempts) {
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions(opts))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detection) return Array.from(detection.descriptor);
  }
  return null;
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
