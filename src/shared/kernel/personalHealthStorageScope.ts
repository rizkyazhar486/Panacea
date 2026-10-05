export type PersonalHealthStorageScope =
  | { kind: 'anonymous' }
  | { kind: 'invalid' }
  | { kind: 'account'; accountId: string; subjectId: string; token: string }

// Bound by the mounted application store. A different tab may replace the
// remembered session without changing this tab's UI or in-flight callbacks.
let mountedAccount: { id?: string; patientId?: string } | null | undefined
export function bindPersonalHealthAccount(account: { id?: string; patientId?: string } | null | undefined): void {
  mountedAccount = account === undefined || account === null ? account : { id: account.id, patientId: account.patientId }
}
export function allowsPersonalHealthStorageScope(scope: PersonalHealthStorageScope): boolean {
  if (scope.kind === 'invalid') return false
  if (mountedAccount === undefined) return true
  if (mountedAccount === null) return scope.kind === 'anonymous'
  return matchesPersonalHealthAccount(scope, mountedAccount)
}

export function matchesPersonalHealthAccount(
  scope: PersonalHealthStorageScope,
  expected: { id?: string; patientId?: string } | null,
): boolean {
  return scope.kind === 'account' && scope.accountId === expected?.id && scope.subjectId === expected?.patientId
}

/** A remembered self identity can scope a cache; a selected clinic patient cannot. */
export function parsePersonalHealthStorageScope(raw: string | null, now: number): PersonalHealthStorageScope {
  try {
    if (!Number.isFinite(now)) return { kind: 'invalid' }
    if (raw === null) return { kind: 'anonymous' }
    const session = JSON.parse(raw)
    const accountId = session?.account?.id
    const subjectId = session?.account?.patientId
    if (typeof accountId !== 'string' || !accountId.trim() || accountId !== accountId.trim()
      || typeof subjectId !== 'string' || !subjectId.trim() || subjectId !== subjectId.trim()
      || typeof session.loginAt !== 'number' || !Number.isFinite(session.loginAt)
      || session.loginAt > now || now - session.loginAt > 7 * 86400000) return { kind: 'invalid' }
    return { kind: 'account', accountId, subjectId, token: encodeURIComponent(JSON.stringify([accountId, subjectId])) }
  } catch { return { kind: 'invalid' } }
}
