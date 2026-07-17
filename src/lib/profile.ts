// Shared demographic profile — a single source of truth for age/sex/weight/
// height used across the fitness calculators so users enter it ONCE and pages
// stop shipping any one person's numbers as defaults. Stored locally per device.

export interface Demo {
  age: number; sex: 'M' | 'F'; weightKg: number; heightCm: number
  // Optional biometrics mirrored from the Health Profile so calculators prefill.
  vo2max?: number; restingHr?: number; hrvMs?: number; sleepH?: number
}

// Neutral, generic defaults — NOT any specific user's numbers.
export const DEMO_DEFAULT: Demo = { age: 30, sex: 'M', weightKg: 70, heightCm: 170 }
const KEY = 'pmd_profile'

export function getDemo(): Demo {
  try { return { ...DEMO_DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEMO_DEFAULT }
}
// Broadcast that health/demographic data changed so any mounted page can
// re-sync immediately (not just on window focus). Pages listen for
// 'panacea:health-updated' alongside their focus handler.
export function broadcastHealthUpdate(): void {
  try { window.dispatchEvent(new Event('panacea:health-updated')) } catch { /* ignore */ }
}

export function setDemo(patch: Partial<Demo>): Demo {
  const next = { ...getDemo(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  broadcastHealthUpdate()
  return next
}

// ── Health Profile bridge ────────────────────────────────────────────────────
// The central Health Profile (/health-data) is the source of truth for
// biometrics. These helpers let calculators know when a value was prefilled
// from it, and push edits back so the whole app stays consistent.
const HP_KEY = 'pmd_health_profile'

export function getHealthCache(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(HP_KEY) || '{}') } catch { return {} }
}

// True when the Health Profile has a positive value for the given field —
// used to show a "from Health Profile" badge next to a prefilled input.
export function hasHealth(field: 'vo2max' | 'restingHr' | 'hrvMs' | 'sleepH' | 'weightKg'): boolean {
  const v = getHealthCache()[field]
  return typeof v === 'number' && v > 0
}

// Merge biometric edits made in a calculator back into the local Health
// Profile cache (and the shared demo) so other pages see them too. Server sync
// still happens when the user opens /health-data and saves.
export function pushBiometrics(patch: { vo2max?: number; restingHr?: number; hrvMs?: number; sleepH?: number; weightKg?: number }): void {
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => typeof v === 'number' && v > 0))
  if (!Object.keys(clean).length) return
  try { localStorage.setItem(HP_KEY, JSON.stringify({ ...getHealthCache(), ...clean })) } catch { /* ignore */ }
  setDemo(clean as Partial<Demo>)
}
