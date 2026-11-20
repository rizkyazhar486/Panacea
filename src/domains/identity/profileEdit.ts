/** Instagram-style profile field rules, kept pure so the same checks run in the UI and in tests. */
export const NAME_MIN = 2
export const NAME_MAX = 60
export const USERNAME_MIN = 3
export const USERNAME_MAX = 30

export type FieldResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly reason: string }

const len = (s: string): number => [...s].length

/** Display name: any script, control characters removed, whitespace collapsed, 2-60 characters. */
export function sanitizeDisplayName(raw: unknown): FieldResult {
  if (typeof raw !== 'string') return { ok: false, reason: 'Enter your name.' }
  const value = raw.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim()
  if (len(value) < NAME_MIN) return { ok: false, reason: `Name must be at least ${NAME_MIN} characters.` }
  if (len(value) > NAME_MAX) return { ok: false, reason: `Name can be at most ${NAME_MAX} characters.` }
  return { ok: true, value }
}

/** Username: optional leading @, lowercased; letters, digits, "." and "_"; 3-30; no leading/trailing/double ".". */
export function sanitizeUsername(raw: unknown): FieldResult {
  if (typeof raw !== 'string') return { ok: false, reason: 'Enter a username.' }
  const value = raw.trim().replace(/^@+/, '').toLowerCase()
  if (value.length < USERNAME_MIN) return { ok: false, reason: `Username must be at least ${USERNAME_MIN} characters.` }
  if (value.length > USERNAME_MAX) return { ok: false, reason: `Username can be at most ${USERNAME_MAX} characters.` }
  if (!/^[a-z0-9._]+$/.test(value)) return { ok: false, reason: 'Use only letters, numbers, "." and "_".' }
  if (value.startsWith('.') || value.endsWith('.') || value.includes('..')) return { ok: false, reason: 'A "." cannot start, end or repeat in a username.' }
  return { ok: true, value }
}

/** Up to two initials from a display name; "?" when there is nothing to show (never a guessed identity). */
export function initialsOf(name: string): string {
  const parts = (typeof name === 'string' ? name : '').trim().split(/\s+/).filter(Boolean)
  const out = parts.slice(0, 2).map((p) => [...p][0]).join('').toUpperCase()
  return out || '?'
}
