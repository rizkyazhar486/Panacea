import { allowsPersonalHealthStorageScope, matchesPersonalHealthAccount } from '../../../shared/kernel/personalHealthStorageScope.ts'
import { readPersonalHealthStorageScope } from './storageScope.ts'

/** Bind callbacks to their mounted form and originating session. */
export function capturePersonalHealthOperation(
  expectedAccount?: { id?: string; patientId?: string } | null,
  active: () => boolean = () => true,
): () => boolean {
  let session: string | null
  let token: string | null
  try {
    session = localStorage.getItem('panaceamed.session.v1')
    token = localStorage.getItem('pmd-token')
  } catch { return () => false }
  return () => {
    try {
      const scope = readPersonalHealthStorageScope()
      const expected = expectedAccount === undefined || (expectedAccount === null
        ? scope.kind === 'anonymous' : matchesPersonalHealthAccount(scope, expectedAccount))
      return active() && expected && allowsPersonalHealthStorageScope(scope)
        && localStorage.getItem('panaceamed.session.v1') === session
        && localStorage.getItem('pmd-token') === token
    } catch { return false }
  }
}

/** Keep an async operation bound to its originating session, including renewals. */
export async function runPersonalHealthOperation<T>(
  load: () => Promise<T>,
  apply: (value: T, current: () => boolean) => void,
): Promise<void> {
  const current = capturePersonalHealthOperation()
  if (!current()) return
  const value = await load()
  if (current()) apply(value, current)
}
