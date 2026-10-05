import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { barisBelumAda, gpsTampil, makananTampil, ringkasGpsUntukAkun, tampilkanWellness, tidurTampil, wellnessBelumAda } from './homeCrossTabDailyState'
import { useStore } from './store'
import { getVitals } from './healthVitals'
import { ambilLab, type ButirLab } from './lab'
import { api, backendEnabled } from './api'
import { PERISTIWA_SINKRON } from './antreanKlinis'
import { subscribeDataUpdates } from './dataSync'
import {
  createLongitudinalSnapshotCache,
  emptyLongitudinalServer,
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
  const { state: app, account, lupakanCatatanDihapus } = useStore()
  const [local, setLocal] = useState<LongitudinalSources['local']>(() => ({ owner: account, labs: ambilLab(account), vitals: getVitals(account) }))
  const [clinicalRevision, setClinicalRevision] = useState(0)
  const [server, setServer] = useState(emptyLongitudinalServer)
  const [labServer, setLabServer] = useState<LabServer | null>(null)
  const [deviceCurrent, setDeviceCurrent] = useState<Record<string, number> | null>(null)
  const [deviceSeries, setDeviceSeries] = useState<DeviceSeries | null>(null)
  const [diaryServer, setDiaryServer] = useState<{
    sleep: { id: string; date: string; hours: number; bedtimeConsistent: boolean }[]
    foods: { id: string; date: string; name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[]
    wellness: { date: string; sleepHr?: number; waterMl?: number }[]
    training: { id: string; date: string; rpe: number; type: string; note?: string }[]
    gps: { id: string; name: string; sport: string; sportType: string; emoji?: string; distKm: number; durSec: number; avgSpeedKmh: number; kcal: number; at: string; avgHr?: number; maxHr?: number }[]
    removed: { foods: string[]; sleep: string[]; training: string[]; gps: string[] }
  } | null>(null)
  const [serverReady, setServerReady] = useState(false)
  const migrasiSeries = useRef('')
  const unggahDiary = useRef('')
  const akunId = account ? `${account.id}|${account.email}|${account.patientId ?? ''}` : ''
  const cache = useRef<ReturnType<typeof createLongitudinalSnapshotCache> | null>(null)
  if (!cache.current) cache.current = createLongitudinalSnapshotCache()

  useEffect(() => {
    migrasiSeries.current = ''
    unggahDiary.current = ''
  }, [akunId])

  useEffect(() => {
    // Persistent ownership is required; a new UI session cannot adopt legacy data.
    setLocal({ owner: account, labs: ambilLab(account), vitals: getVitals(account) })
  }, [account])

  useEffect(() => {
    // Legacy local keys carry no patient id. Notifications cannot authorize
    // transferring their contents to another account; server sources are scoped.
    const lab = () => setLocal(previous => ({ ...previous, owner: account, labs: ambilLab(account) }))
    const health = () => {
      setLocal(previous => ({ ...previous, owner: account, vitals: getVitals(account) }))
      setClinicalRevision(v => v + 1)
    }
    const clinical = () => setClinicalRevision(v => v + 1)
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'pmd_lab_v1' || event.key.startsWith('pmd_lab_scope_v1:')) lab()
      if (event.key === null || event.key === 'pmd_vitals_v1' || event.key.startsWith('pmd_vitals_scope_v1:')) health()
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
    Promise.all([api.getKeadaanLongitudinal(), api.clinical().catch(() => null)]).then(([keadaan, acceptedClinical]) => {
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
        records: acceptedClinical?.records ?? clinical?.records ?? {},
        vitals: (acceptedClinical?.vitals ?? clinical?.vitals ?? {}) as LongitudinalServerSources['vitals'],
        encounters: acceptedClinical?.recordEncounters ?? clinical?.encounters ?? {},
      })
      setServerReady(true)
      if (keadaan.diary?.truthClass === 'patient-recorded' && keadaan.diary.source === 'health-profile') {
        setDiaryServer({
          sleep: keadaan.diary.sleep,
          foods: keadaan.diary.foods,
          wellness: keadaan.diary.wellness,
          training: keadaan.diary.training ?? [],
          gps: keadaan.diary.gps ?? [],
          removed: {
            foods: keadaan.diary.removed?.foods ?? [],
            sleep: keadaan.diary.removed?.sleep ?? [],
            training: keadaan.diary.removed?.training ?? [],
            gps: keadaan.diary.removed?.gps ?? [],
          },
        })
      }
    }).catch(() => {
      // Offline: browser copies remain the fallback; care/EMR stay empty.
      if (active) setServerReady(false)
    })
    return () => { active = false }
  }, [account, akunId, local.labs, clinicalRevision])

  useEffect(() => {
    if (!diaryServer) return
    const foods = app.foods.filter((row) => diaryServer.removed.foods.includes(row.id)).map((row) => row.id)
    const sleep = app.sleepLogs.filter((row) => diaryServer.removed.sleep.includes(row.id)).map((row) => row.id)
    const training = app.trainingLogs.filter((row) => (diaryServer.removed.training ?? []).includes(row.id)).map((row) => row.id)
    const gps = app.gpsActivities.filter((row) => (diaryServer.removed.gps ?? []).includes(row.id)).map((row) => row.id)
    if (foods.length || sleep.length || training.length || gps.length) lupakanCatatanDihapus(foods, sleep, training, gps)
  }, [diaryServer, app.foods, app.sleepLogs, app.trainingLogs, app.gpsActivities, lupakanCatatanDihapus])

  useEffect(() => {
    if (!backendEnabled || !account || !diaryServer) return
    const dihapusTidur = [...diaryServer.removed.sleep, ...(app.diaryHiddenSleepIds ?? [])]
    const dihapusMakan = [...diaryServer.removed.foods, ...(app.diaryHiddenFoodIds ?? [])]
    const dihapusLatihan = [...(diaryServer.removed.training ?? []), ...(app.diaryHiddenTrainingIds ?? [])]
    const dihapusGps = [...(diaryServer.removed.gps ?? []), ...(app.diaryHiddenGpsIds ?? [])]
    const sleepLogs = barisBelumAda(diaryServer.sleep, app.sleepLogs, dihapusTidur)
    const foods = barisBelumAda(diaryServer.foods, app.foods, dihapusMakan)
    const wellness = wellnessBelumAda(diaryServer.wellness, app.wellness ?? {})
    const trainingLogs = barisBelumAda(diaryServer.training, app.trainingLogs, dihapusLatihan)
    const gpsActivities = barisBelumAda(diaryServer.gps, ringkasGpsUntukAkun(app.gpsActivities, account.email), dihapusGps)
    const removeFoodIds = (app.diaryHiddenFoodIds ?? []).filter((id) => !diaryServer.removed.foods.includes(id))
    const removeSleepIds = (app.diaryHiddenSleepIds ?? []).filter((id) => !diaryServer.removed.sleep.includes(id))
    const removeTrainingIds = (app.diaryHiddenTrainingIds ?? []).filter((id) => !(diaryServer.removed.training ?? []).includes(id))
    const removeGpsIds = (app.diaryHiddenGpsIds ?? []).filter((id) => !(diaryServer.removed.gps ?? []).includes(id))
    if (!sleepLogs.length && !foods.length && !wellness.length && !trainingLogs.length && !gpsActivities.length && !removeFoodIds.length && !removeSleepIds.length && !removeTrainingIds.length && !removeGpsIds.length) return
    const tanda = JSON.stringify({ sleepLogs, foods, wellness, trainingLogs, gpsActivities, removeFoodIds, removeSleepIds, removeTrainingIds, removeGpsIds })
    if (unggahDiary.current === tanda) return
    unggahDiary.current = tanda
    let active = true
    api.putDiary({
      ...(sleepLogs.length ? { sleepLogs } : {}),
      ...(foods.length ? { foods } : {}),
      ...(wellness.length ? { wellness } : {}),
      ...(trainingLogs.length ? { trainingLogs } : {}),
      ...(gpsActivities.length ? { gpsActivities } : {}),
      ...(removeFoodIds.length ? { removeFoodIds } : {}),
      ...(removeSleepIds.length ? { removeSleepIds } : {}),
      ...(removeTrainingIds.length ? { removeTrainingIds } : {}),
      ...(removeGpsIds.length ? { removeGpsIds } : {}),
    }).then(() => { if (active) setClinicalRevision(v => v + 1) }).catch(() => { unggahDiary.current = '' })
    return () => { active = false }
  }, [account, diaryServer, app.sleepLogs, app.foods, app.wellness, app.trainingLogs, app.gpsActivities, app.diaryHiddenFoodIds, app.diaryHiddenSleepIds, app.diaryHiddenTrainingIds, app.diaryHiddenGpsIds])

  const sumberLab = sumberLabLongitudinal(labServer && labServer.subjectId === account?.id ? labServer.log : null, local.labs)
  const sumberVitals = sumberVitalsLongitudinal(serverReady && account ? deviceCurrent : null, local.vitals as Record<string, unknown>)
  const sumberSelf = sumberDeretLongitudinal(serverReady ? deviceSeries?.selfVitals ?? null : null, app.selfVitals)
  const sumberVo2 = sumberDeretLongitudinal(serverReady ? deviceSeries?.vo2maxLog ?? null : null, app.vo2maxLog)
  const sourceApp = useMemo(
    () => {
      const dihapusTidur = [...(diaryServer?.removed.sleep ?? []), ...(app.diaryHiddenSleepIds ?? [])]
      const dihapusMakan = [...(diaryServer?.removed.foods ?? []), ...(app.diaryHiddenFoodIds ?? [])]
      const dihapusLatihan = [...(diaryServer?.removed.training ?? []), ...(app.diaryHiddenTrainingIds ?? [])]
      const dihapusGps = [...(diaryServer?.removed.gps ?? []), ...(app.diaryHiddenGpsIds ?? [])]
      const tidur = tidurTampil(diaryServer ? diaryServer.sleep : null, app.sleepLogs, dihapusTidur)
      const makanan = makananTampil(diaryServer ? diaryServer.foods : null, app.foods, dihapusMakan)
      const wellness = diaryServer ? tampilkanWellness(diaryServer.wellness, app.wellness ?? {}) : app.wellness
      const latihan = makananTampil(diaryServer ? diaryServer.training : null, app.trainingLogs, dihapusLatihan)
      const gps = gpsTampil(diaryServer ? diaryServer.gps : null, app.gpsActivities, account?.email ?? '', dihapusGps)
      return {
        account,
        vitals: app.vitals,
        selfVitals: [...sumberSelf.rows],
        vo2maxLog: [...sumberVo2.rows],
        foods: makanan,
        sleepLogs: tidur,
        wellness,
        trainingLogs: latihan,
        gpsActivities: gps,
      }
    },
    [account, app.vitals, app.foods, app.sleepLogs, app.wellness, app.trainingLogs, app.gpsActivities, app.diaryHiddenFoodIds, app.diaryHiddenSleepIds, app.diaryHiddenTrainingIds, app.diaryHiddenGpsIds, diaryServer, sumberSelf.rows, sumberVo2.rows],
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
