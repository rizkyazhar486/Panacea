// Shared demographic profile — a single source of truth for age/sex/weight/
// height used across the fitness calculators so users enter it ONCE and pages
// stop shipping any one person's numbers as defaults. Stored locally per device.

export interface Demo { age: number; sex: 'M' | 'F'; weightKg: number; heightCm: number }

// Neutral, generic defaults — NOT any specific user's numbers.
export const DEMO_DEFAULT: Demo = { age: 30, sex: 'M', weightKg: 70, heightCm: 170 }
const KEY = 'pmd_profile'

export function getDemo(): Demo {
  try { return { ...DEMO_DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEMO_DEFAULT }
}
export function setDemo(patch: Partial<Demo>): Demo {
  const next = { ...getDemo(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}
