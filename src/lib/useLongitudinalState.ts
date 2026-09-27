import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from './store'
import { getVitals } from './healthVitals'
import { ambilLab } from './lab'
import { api, backendEnabled } from './api'
import { PERISTIWA_SINKRON } from './antreanKlinis'
import { subscribeDataUpdates } from './dataSync'
import { createLongitudinalSnapshotCache, emptyLongitudinalServer, sameLongitudinalPatient, type LongitudinalSnapshot, type LongitudinalSources, type LongitudinalServerSources } from './longitudinalSnapshot'

const Context = createContext<LongitudinalSnapshot | null>(null)

export function LongitudinalStateProvider({ children }: { children: ReactNode }) {
  const { state: app, account } = useStore()
  const [local, setLocal] = useState<LongitudinalSources['local']>(() => ({ owner: account, labs: ambilLab(), vitals: getVitals() }))
  const [clinicalRevision, setClinicalRevision] = useState(0)
  const [server, setServer] = useState(emptyLongitudinalServer)
  const adoptedLocal = useRef(Boolean(account))
  const cache = useRef<ReturnType<typeof createLongitudinalSnapshotCache> | null>(null)
  if (!cache.current) cache.current = createLongitudinalSnapshotCache()

  useEffect(() => {
    // Preserve first-login local data, never adopt it again for another session.
    if (account && !adoptedLocal.current) {
      adoptedLocal.current = true
      setLocal({ owner: account, labs: ambilLab(), vitals: getVitals() })
    }
  }, [account])

  useEffect(() => {
    // Legacy local keys carry no patient id. Notifications cannot authorize
    // transferring their contents to another account; server sources are scoped.
    const lab = () => setLocal(previous => previous.owner && !sameLongitudinalPatient(previous.owner, account)
      ? previous : { ...previous, owner: account, labs: ambilLab() })
    const health = () => setLocal(previous => previous.owner && !sameLongitudinalPatient(previous.owner, account)
      ? previous : { ...previous, owner: account, vitals: getVitals() })
    const clinical = () => setClinicalRevision(v => v + 1)
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'pmd_lab_v1') lab()
      if (event.key === null || event.key === 'pmd_vitals_v1') health()
    }
    window.addEventListener('panacea:lab', lab)
    window.addEventListener(PERISTIWA_SINKRON, clinical)
    window.addEventListener('storage', storage)
    const unsubscribe = subscribeDataUpdates(detail => {
      if (detail.domains.includes('health')) health()
    })
    return () => {
      window.removeEventListener('panacea:lab', lab)
      window.removeEventListener(PERISTIWA_SINKRON, clinical)
      window.removeEventListener('storage', storage)
      unsubscribe()
    }
  }, [account])

  useEffect(() => {
    if (!backendEnabled || !account) return
    let active = true
    const empty = emptyLongitudinalServer()
    Promise.all([
      api.carePlans().catch(() => ({ plans: empty.plans })),
      api.getLabShares().catch(() => ({ reviews: empty.reviews })),
      account.role === 'pasien' ? api.clinical().catch(() => empty) : Promise.resolve(empty),
    ]).then(([care, lab, clinical]) => {
      const accepted = clinical as Partial<LongitudinalServerSources>
      if (active) setServer({ owner: account, plans: care.plans, reviews: lab.reviews ?? [], records: accepted.records ?? {}, vitals: accepted.vitals ?? {}, encounters: accepted.encounters ?? {} })
    })
    return () => { active = false }
  }, [account, local.labs, clinicalRevision])

  // Selecting stable source slices avoids rebuilding for unrelated UI/settings.
  const sourceApp = useMemo(() => ({ account, vitals: app.vitals, selfVitals: app.selfVitals, vo2maxLog: app.vo2maxLog }), [account, app.vitals, app.selfVitals, app.vo2maxLog])
  const snapshot = cache.current.read({ app: sourceApp, local, server })
  return createElement(Context.Provider, { value: snapshot }, children)
}

export function useLongitudinalState(): LongitudinalSnapshot {
  const snapshot = useContext(Context)
  if (!snapshot) throw new Error('useLongitudinalState must be used within LongitudinalStateProvider')
  return snapshot
}
