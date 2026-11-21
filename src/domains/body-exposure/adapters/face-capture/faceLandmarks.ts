// Boundary for face-from-photo: reads face landmark points from the aligned photo with MediaPipe Face Landmarker,
// entirely on this device. The photo pixels go to WebAssembly in this tab and nowhere else; the only network requests
// are two static downloads — the runtime (bundled with the app) and the model file — and neither carries the photo.
//
// Loaded lazily: nothing here is fetched until the person presses "Make 3D".

import type { FacePoint } from '../../engine/face-capture/faceMesh.ts'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'

// Google's published Face Landmarker model (Apache-2.0), pinned to version 1 of the float16 build.
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

type Landmarker = { detect(image: HTMLCanvasElement): { faceLandmarks: { x: number; y: number; z: number }[][] } }
let landmarker: Promise<Landmarker> | null = null

function load(): Promise<Landmarker> {
  landmarker ??= import('@mediapipe/tasks-vision').then(({ FaceLandmarker }) =>
    FaceLandmarker.createFromOptions({ wasmLoaderPath, wasmBinaryPath }, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
      runningMode: 'IMAGE',
      numFaces: 1,
    }),
  ).catch((e: unknown) => { landmarker = null; throw e })
  return landmarker
}

export type LandmarkRead =
  | { ok: true; points: FacePoint[] }
  | { ok: false; reason: 'no-face' | 'unavailable' }

/** Reads the one face in `canvas`. No face → 'no-face'; the model cannot load → 'unavailable'. */
export async function readFaceLandmarks(canvas: HTMLCanvasElement): Promise<LandmarkRead> {
  let model: Landmarker
  try { model = await load() } catch { return { ok: false, reason: 'unavailable' } }
  const face = model.detect(canvas).faceLandmarks[0]
  if (!face || face.length === 0) return { ok: false, reason: 'no-face' }
  return { ok: true, points: face.map(({ x, y, z }) => ({ x, y, z })) }
}
