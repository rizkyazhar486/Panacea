import { allowsPersonalHealthStorageScope } from '../../../shared/kernel/personalHealthStorageScope.ts'
import { readPersonalHealthStorageScope } from './storageScope.ts'

/** Keep an async operation bound to its originating session, including renewals. */
export async function runPersonalHealthOperation<T>(
  load: () => Promise<T>,
  apply: (value: T, current: () => boolean) => void,
): Promise<void> {
  let session: string | null
  let token: string | null
  try {
    session = localStorage.getItem('panaceamed.session.v1')
    token = localStorage.getItem('pmd-token')
  } catch { return }
  const current = () => {
    try {
      return localStorage.getItem('panaceamed.session.v1') === session
        && localStorage.getItem('pmd-token') === token
        && allowsPersonalHealthStorageScope(readPersonalHealthStorageScope())
    } catch { return false }
  }
  if (!current()) return
  const value = await load()
  if (current()) apply(value, current)
}
