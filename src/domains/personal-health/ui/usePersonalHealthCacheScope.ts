import { useEffect, useState } from 'react'
import { useStore } from '../../../lib/store'
import { readPersonalHealthStorageScope } from '../adapters/storageScope'
import { matchesPersonalHealthAccount, type PersonalHealthStorageScope } from '../../../shared/kernel/personalHealthStorageScope'

const identityOf = (scope: PersonalHealthStorageScope) => scope.kind === 'account' ? scope.token : scope.kind

/** UI context must agree with remembered identity, including another tab's changes. */
export function usePersonalHealthCacheScope() {
  const { state: { account } } = useStore()
  const [scope, setScope] = useState(readPersonalHealthStorageScope)
  useEffect(() => {
    const refresh = () => setScope(previous => {
      const next = readPersonalHealthStorageScope()
      return identityOf(previous) === identityOf(next) ? previous : next
    })
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 1000)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.clearInterval(timer) }
  }, [account?.id, account?.patientId])
  return { scope, identity: identityOf(scope), allowed: scope.kind === 'anonymous' ? account === null : matchesPersonalHealthAccount(scope, account) }
}
