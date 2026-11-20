/**
 * Browser-safe runtime telemetry and provenance contract for CanonicalBody.tsx.
 * ZERO Node.js imports (no node:fs, node:crypto, node:path).
 * Evaluates frame times using: FPS = 1000 / frame_time_ms (reporting p50 and p95).
 */

export interface BrowserFrameTelemetrySummary {
  sampleCount: number;
  p50FrameTimeMs: number | null;
  p95FrameTimeMs: number | null;
  p50Fps: number | null;
  p95Fps: number | null;
  detectedBackend: 'WEBGPU' | 'WEBGL2' | 'WEBGL1' | 'UNAVAILABLE';
  rendererString: string | null;
  vendorString: string | null;
  maxTextureSizePx: number | null;
}

export function computeFrameTimePercentiles(frameTimesMs: number[]): {
  sampleCount: number;
  p50FrameTimeMs: number | null;
  p95FrameTimeMs: number | null;
  p50Fps: number | null;
  p95Fps: number | null;
} {
  const valid = frameTimesMs.filter((t) => Number.isFinite(t) && t > 0).sort((a, b) => a - b);
  if (valid.length === 0) {
    return {
      sampleCount: 0,
      p50FrameTimeMs: null,
      p95FrameTimeMs: null,
      p50Fps: null,
      p95Fps: null
    };
  }

  const p50Idx = Math.min(valid.length - 1, Math.floor(valid.length * 0.5));
  const p95Idx = Math.min(valid.length - 1, Math.floor(valid.length * 0.95));

  const p50FrameTimeMs = Number(valid[p50Idx].toFixed(3));
  const p95FrameTimeMs = Number(valid[p95Idx].toFixed(3));

  // Formula: FPS = 1000 / frame_time_ms
  const p50Fps = Number((1000 / p50FrameTimeMs).toFixed(2));
  const p95Fps = Number((1000 / p95FrameTimeMs).toFixed(2));

  return {
    sampleCount: valid.length,
    p50FrameTimeMs,
    p95FrameTimeMs,
    p50Fps,
    p95Fps
  };
}
