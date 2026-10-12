export const SKINCARE_STEPS = ['Cleanser', 'Vitamin C serum', 'Retinol/Retinoid', 'Moisturizer', 'Sunscreen (SPF)', 'Niacinamide', 'Eye cream', 'Exfoliant (AHA/BHA)']
export const BODY_REGIONS = ['Head/Neck', 'Chest', 'Abdomen', 'Left Arm', 'Right Arm', 'Lower Back', 'Left Leg', 'Right Leg']
export interface SymptomLog { t: number; region: string; severity: number; note: string }
export function sanitizeRoutine(value: unknown): { morning: string[]; night: string[] } {
  const data = value as Record<string, unknown> | null
  const steps = (list: unknown): string[] => Array.isArray(list) ? [...new Set(list.filter((s): s is string => typeof s === 'string' && SKINCARE_STEPS.includes(s)))] : []
  return { morning: steps(data?.morning), night: steps(data?.night) }
}
export function sanitizeSymptoms(value: unknown): SymptomLog[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is SymptomLog => v !== null && typeof v === 'object'
    && typeof v.t === 'number' && Number.isFinite(v.t) && v.t >= 0 && v.t <= 8640000000000000
    && BODY_REGIONS.includes(v.region) && typeof v.severity === 'number' && Number.isFinite(v.severity)
    && v.severity >= 0 && v.severity <= 10 && typeof v.note === 'string').slice(0, 30)
}
export function sanitizeMinutes(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([date, minutes]) => /^\d{4}-\d{2}-\d{2}$/.test(date)
    && typeof minutes === 'number' && Number.isFinite(minutes) && minutes >= 0 && minutes <= 1440))
}
