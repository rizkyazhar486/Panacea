// Real calendar timestamps with explicit timezone; shared device/visit boundary.
const ISO_8601_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/

export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = ISO_8601_TIMESTAMP.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[7] === undefined ? 0 : Number(match[7])
  const offsetMinute = match[8] === undefined ? 0 : Number(match[8])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (month < 1 || month > 12) return false
  if (day < 1 || day > daysInMonth[month - 1]) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false

  return Number.isFinite(Date.parse(value))
}
