import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from './store'
import { getVitals } from './healthVitals'
import { ambilLab, type ButirLab } from './lab'
import { api, backendEnabled } from './api'
import { PERISTIWA_SINKRON } from './antreanKlinis'
import { subscribeDataUpdates } from './dataSync'
import {
  createLongitudinalSnapshotCache,
  emptyLongitudinalServer,
  sameLongitudinalPatient,
  sumberLabLongitudinal,
  sumberVitalsLongitudinal,
  sumberDeretLongitudinal,
  type LongitudinalSnapshot,
  type LongitudinalSources,
  type LongitudinalServerSources,
} from './longitudinalSnapshot'
import type { SelfVital, Vo2MaxEntry } from './types'

const Context = createContext<LongitudinalSnapshot | null>(null)

type LabServer = { subjectId: string; revision: string; log: Record<string, ButirLab[]> }
type DeviceSeries = { selfVitals: SelfVital[]; vo2maxLog: Vo2MaxEntry[] }

export function LongitudinalStateProvider({ children }: { children: ReactNode }) {
  const { state: app, account } = useStore()
  const [local, setLocal] = useState<LongitudinalSources['local']>(() => ({ owner: account, labs: ambilLab(), vitals: getVitals() }))
  const [clinicalRevision, setClinicalRevision] = useState(0)
  const [server, setServer] = useState(emptyLongitudinalServer)
  const [labServer, setLabServer] = useState<LabServer | null>(null)
  const [deviceCurrent, setDeviceCurrent] = useState<Record<string, number> | null>(null)
  const [deviceSeries, setDeviceSeries] = useState<DeviceSeries | null>(null)
  const [diaryServer, setDiaryServer] = useState<{
    sleep: { id: string; date: string; hours: number; bedtimeConsistent: boolean }[]
    foods: { id: string; date: string; name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[]
    wellness: { date: string; sleepHr?: number; waterMl?: number }[]
  } | null>(null)
  const [serverReady, setServerReady] = useState(false)
  const adoptedLocal = useRef(Boolean(account))
  const migrasiSeries = useRef('')
  const akunId = account ? `${account.id}|${account.email}|${account.patientId ?? ''}` : ''
  const cache = useRef<ReturnType<typeof createLongitudinalSnapshotCache> | null>(null)
  if (!cache.current) cache.current = createLongitudinalSnapshotCache()

  useEffect(() => {
    migrasiSeries.current = ''
  }, [akunId])

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
    const health = () => {
      setLocal(previous => previous.owner && !sameLongitudinalPatient(previous.owner, account)
        ? previous : { ...previous, owner: account, vitals: getVitals() })
      setClinicalRevision(v => v + 1)
    }
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
    setLabServer(null)
    setDeviceCurrent(null)
    setDeviceSeries(null)
    setDiaryServer(null)
    setServer(emptyLongitudinalServer())
    setServerReady(false)
  }, [akunId])

  useEffect(() => {
    if (!backendEnabled || !account) return
    let active = true
    api.getKeadaanLongitudinal().then(keadaan => {
      if (!active || keadaan.subjectId !== account.id) return
      if (keadaan.lab.truthClass !== 'patient-recorded' || keadaan.lab.source !== 'lab-log') return
      if (keadaan.care.truthClass !== 'server-stored' || keadaan.care.source !== 'care-plans') return
      if (keadaan.device.truthClass !== 'patient-recorded' || keadaan.device.source !== 'health-profile') return
      setLabServer(prev => prev && prev.revision === keadaan.revision && prev.subjectId === keadaan.subjectId
        ? prev
        : { subjectId: keadaan.subjectId, revision: keadaan.revision, log: keadaan.lab.log })
      setDeviceCurrent(keadaan.device.current)
      setDeviceSeries({
        selfVitals: keadaan.device.selfVitals,
        vo2maxLog: keadaan.device.vo2maxLog,
      })
      // One-shot: AppState rows that never reached the server are uploaded once.
      if (migrasiSeries.current !== akunId) {
        migrasiSeries.current = akunId
        const jobs: Promise<unknown>[] = []
        if (keadaan.device.selfVitals.length === 0 && app.selfVitals.length > 0) {
          jobs.push(api.putSelfVitalsLog(app.selfVitals))
        }
        if (keadaan.device.vo2maxLog.length === 0 && app.vo2maxLog.length > 0) {
          jobs.push(api.putVo2maxLog(app.vo2maxLog))
        }
        const diary = keadaan.diary
        if (diary?.truthClass === 'patient-recorded' && diary.source === 'health-profile') {
          const unggah: Parameters<typeof api.putDiary>[0] = {}
          if (diary.sleep.length === 0 && app.sleepLogs.length > 0) unggah.sleepLogs = app.sleepLogs
          if (diary.foods.length === 0 && app.foods.length > 0) unggah.foods = app.foods
          if (diary.wellness.length === 0 && Object.keys(app.wellness ?? {}).length > 0) {
            unggah.wellness = Object.values(app.wellness).map((row) => ({
              date: row.date,
              ...(row.sleepHr != null ? { sleepHr: row.sleepHr } : {}),
              ...(row.waterMl != null ? { waterMl: row.waterMl } : {}),
            }))
          }
          if (unggah.sleepLogs || unggah.foods || unggah.wellness) jobs.push(api.putDiary(unggah))
        }
        if (jobs.length) {
          Promise.all(jobs).then(() => { if (active) setClinicalRevision(v => v + 1) }).catch(() => { /* keep browser copy */ })
        }
      }
      const clinical = keadaan.clinical
        && keadaan.clinical.truthClass === 'server-stored'
        && keadaan.clinical.source === 'clinical'
        ? keadaan.clinical
        : null
      setServer({
        owner: account,
        plans: keadaan.care.plans,
        reviews: keadaan.care.reviews,
        records: clinical?.records ?? {},
        vitals: (clinical?.vitals ?? {}) as LongitudinalServerSources['vitals'],
        encounters: clinical?.encounters ?? {},
      })
      setServerReady(true)
      if (keadaan.diary?.truthClass === 'patient-recorded' && keadaan.diary.source === 'health-profile') {
        setDiaryServer({ sleep: keadaan.diary.sleep, foods: keadaan.diary.foods, wellness: keadaan.diary.wellness })
      }
    }).catch(() => {
      // Offline: browser copies remain the fallback; care/EMR stay empty.
      if (active) setServerReady(false)
    })
    return () => { active = false }
  }, [account, akunId, local.labs, clinicalRevision])

  const sumberLab = sumberLabLongitudinal(labServer && labServer.subjectId === account?.id ? labServer.log : null, local.labs)
  const sumberVitals = sumberVitalsLongitudinal(serverReady && account ? deviceCurrent : null, local.vitals as Record<string, unknown>)
  const sumberSelf = sumberDeretLongitudinal(serverReady ? deviceSeries?.selfVitals ?? null : null, app.selfVitals)
  const sumberVo2 = sumberDeretLongitudinal(serverReady ? deviceSeries?.vo2maxLog ?? null : null, app.vo2maxLog)
  const sourceApp = useMemo(
    () => {
      const tidur = diaryServer && diaryServer.sleep.length > 0 ? diaryServer.sleep : app.sleepLogs
      const makanan = diaryServer && diaryServer.foods.length > 0 ? diaryServer.foods : app.foods
      const wellness = diaryServer && diaryServer.wellness.length > 0
        ? Object.fromEntries(diaryServer.wellness.map((row) => [row.date, row]))
        : app.wellness
      return {
        account,
        vitals: app.vitals,
        selfVitals: [...sumberSelf.rows],
        vo2maxLog: [...sumberVo2.rows],
        foods: makanan,
        sleepLogs: tidur,
        wellness,
        trainingLogs: app.trainingLogs,
        gpsActivities: app.gpsActivities,
      }
    },
    [account, app.vitals, app.foods, app.sleepLogs, app.wellness, app.trainingLogs, app.gpsActivities, diaryServer, sumberSelf.rows, sumberVo2.rows],
  )
  const sourceLocal = useMemo(
    () => ({ ...local, labs: sumberLab.labs, vitals: sumberVitals.vitals as typeof local.vitals }),
    [local, sumberLab.labs, sumberVitals.vitals],
  )
  const projected = cache.current.read({ app: sourceApp, local: sourceLocal, server })
  const serverSource: 'server' | 'browser' = serverReady && sumberLab.source === 'server' ? 'server' : 'browser'
  const snapshot = useMemo((): LongitudinalSnapshot => ({
    ...projected,
    labSource: sumberLab.source,
    serverSource,
    deviceSource: sumberVitals.source,
    selfSource: sumberSelf.source,
    vo2Source: sumberVo2.source,
  }), [projected, sumberLab.source, serverSource, sumberVitals.source, sumberSelf.source, sumberVo2.source])
  return createElement(Context.Provider, { value: snapshot }, children)
}

export function useLongitudinalState(): LongitudinalSnapshot {
  const snapshot = useContext(Context)
  if (!snapshot) throw new Error('useLongitudinalState must be used within LongitudinalStateProvider')
  return snapshot
}
