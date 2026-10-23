/** Bounds retain the existing whole-hour selector; they are not clinical adaptation limits. */
export function parseJetLagHours(value: unknown): number | null {
  if (typeof value === 'string') {
    if (!/^[+-]?\d{1,2}$/.test(value.trim())) return null
    value = Number(value.trim())
  }
  return typeof value === 'number' && Number.isInteger(value) && value >= -12 && value <= 12 ? value : null
}
export function validDepartureDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const d = new Date(`${value}T00:00:00`)
  if (!Number.isFinite(d.getTime())) return ''
  const [y,m,day] = value.split('-').map(Number)
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day ? value : ''
}
export function sanitizeJetLagPlan(value: unknown): { selisih: string; tanggal: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { selisih: '', tanggal: '' }
  const v = value as Record<string, unknown>
  const hours = parseJetLagHours(v.selisih)
  return { selisih: hours === null ? '' : String(hours), tanggal: validDepartureDate(v.tanggal) }
}
