// Presentation only: never changes anatomy, source identity or clinical review.
export type LightingMode = 'standard' | 'studio'
export interface PresentationLighting { mode: LightingMode; exposureEV: number }

/** Fail closed at the UI/renderer boundary; exposure is stops, not light power. */
export function lightingSettings(mode: unknown, exposureEV: unknown):
  | { ok: true; settings: PresentationLighting; multiplier: number; environmentIntensity: number }
  | { ok: false; reason: 'invalid-mode' | 'invalid-exposure' } {
  if (mode !== 'standard' && mode !== 'studio') return { ok: false, reason: 'invalid-mode' }
  if (typeof exposureEV !== 'number' || !Number.isFinite(exposureEV) || exposureEV < -2 || exposureEV > 2) {
    return { ok: false, reason: 'invalid-exposure' }
  }
  return { ok: true, settings: { mode, exposureEV }, multiplier: 2 ** exposureEV,
    environmentIntensity: mode === 'standard' ? 0.55 : 0.25 }
}
