import { allowsPersonalHealthStorageScope, type PersonalHealthStorageScope } from '../../../shared/kernel/personalHealthStorageScope.ts'
import { readPersonalHealthStorageScope } from './storageScope.ts'

type AccountScope = Extract<PersonalHealthStorageScope, { kind: 'account' }>
/** Legacy keys have no attributable owner. Retain their bytes, but never adopt them. */
export function toolkitStorageKey(key: string, scope: AccountScope): string {
  return `${key}:scope_v1:${scope.token}`
}
export function readToolkitStorage<T>(key: string, scope: AccountScope | null, sanitize: (value: unknown) => T): T {
  try {
    const current = readPersonalHealthStorageScope()
    if (!scope || current.kind !== 'account' || current.token !== scope.token) return sanitize(null)
    return sanitize(JSON.parse(localStorage.getItem(toolkitStorageKey(key, scope)) || 'null'))
  } catch { return sanitize(null) }
}
export function writeToolkitStorage(key: string, scope: AccountScope | null, value: unknown): boolean {
  try {
    const current = readPersonalHealthStorageScope()
    if (!scope || current.kind !== 'account' || current.token !== scope.token || !allowsPersonalHealthStorageScope(current)) return false
    localStorage.setItem(toolkitStorageKey(key, scope), JSON.stringify(value))
    return true
  } catch { return false }
}
