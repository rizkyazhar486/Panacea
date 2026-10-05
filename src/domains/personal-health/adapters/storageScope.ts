import { parsePersonalHealthStorageScope, type PersonalHealthStorageScope } from '../../../shared/kernel/personalHealthStorageScope.ts'

/** Browser I/O stays at the adapter; identity validation uses the shared kernel. */
export function readPersonalHealthStorageScope(): PersonalHealthStorageScope {
  try { return parsePersonalHealthStorageScope(localStorage.getItem('panaceamed.session.v1'), Date.now()) }
  catch { return { kind: 'invalid' } }
}
