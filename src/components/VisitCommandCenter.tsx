import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CardiacCycle3D } from './CardiacCycle3D'
import { ConsultChat } from './ConsultChat'
import { useStore } from '../lib/store'
import { useLiveHeartRate } from '../lib/useLiveHeartRate'
import { useVitals } from '../lib/useVitals'
import {
  createVisitOperatingSession,
  endVisit,
  pauseVisit,
  registerMedicalDevice,
  resumeVisit,
  setMedicalDeviceConnection,
  startVisit,
  type VisitOperatingState,
} from '../lib/visitOperatingSystem'

interface VisitCommandCenterProps {
  recordId?: string
  embedded?: boolean
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function safeToken(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, '').slice(0, 72) || 'visit'
}

function createSession(
  visitId: string,
  subjectId: string,
  clinicianId: string,
  granted: boolean,
  at: string,
): VisitOperatingState {
  return createVisitOperatingSession({
    visitId,
    subjectId,
    clinicianId,
    createdAt: at,
    consent: {
      clinicalData: {
        granted,
        purposes: ['clinical-support', 'ai-context'],
        grantedAt: at,
      },
      media: {
        camera: granted,
        microphone: granted,
        ambientAi: granted,
        acknowledgedAt: at,
      },
    },
  })
}

function metricText(value: number | undefined, digits = 0) {
  if (!finite(value)) return '—'
  return digits ? value.toFixed(digits) : String(Math.round(value))
}

function tracePath(values: readonly number[]) {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = 38 - ((value - min) / span) * 28
    return (index ? 'L ' : 'M ') + x.toFixed(2) + ' ' + y.toFixed(2)
  }).join(' ')
}

export function VisitCommandCenter({ recordId, embedded = false }: VisitCommandCenterProps) {
  const { state, activePatient, account } = useStore()
  const reduceMotion = useReducedMotion()
  const synced = useVitals()
  const liveHeart = useLiveHeartRate()
  const clinicianId = account?.email?.trim() || state.settings.doctorName.trim() || 'local-clinician'
  const visitId = 'visit-' + safeToken((recordId || activePatient.id) + '-' + new Date().toISOString().slice(0, 10))
  const cameraRoom = 'visit-' + safeToken(recordId || activePatient.id)

  const [visit, setVisit] = useState<VisitOperatingState>(() =>
    createSession(visitId, activePatient.id, clinicianId, false, new Date().toISOString()),
  )
  const [liveTrace, setLiveTrace] = useState<number[]>([])

  useEffect(() => {
    setVisit(createSession(visitId, activePatient.id, clinicianId, false, new Date().toISOString()))
    setLiveTrace([])
  }, [activePatient.id, clinicianId, visitId])

  const latestClinical = useMemo(() => {
    const rows = (state.vitals[activePatient.id] ?? [])
      .filter((item) => Number.isFinite(Date.parse(item.takenAt)))
      .slice()
      .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt))
    return rows[rows.length - 1]
  }, [activePatient.id, state.vitals])

  const clinicalTrace = useMemo(
    () => (state.vitals[activePatient.id] ?? [])
      .filter((item) => finite(item.heartRate) && Number.isFinite(Date.parse(item.takenAt)))
      .slice(-16)
      .map((item) => item.heartRate),
    [activePatient.id, state.vitals],
  )

  useEffect(() => {
    if (!liveHeart.isLive || !finite(liveHeart.bpm) || liveHeart.bpm <= 0) return
    setLiveTrace((current) => [...current, liveHeart.bpm].slice(-32))
  }, [liveHeart.bpm, liveHeart.isLive])

  useEffect(() => {
    if (visit.phase === 'ended') return
    setVisit((current) => {
      try {
        let next = current
        if (!next.devices['ble-heart-rate']) {
          next = registerMedicalDevice(next, {
            id: 'ble-heart-rate',
            label: 'BLE Heart Rate Service',
            deviceClass: 'vital-signs-monitor',
            evidenceClass: 'consumer',
            transport: 'bluetooth-le',
            supports: ['heart-rate'],
          }, new Date().toISOString())
        }
        const status = liveHeart.bleStatus === 'connected'
          ? 'live'
          : liveHeart.bleStatus === 'connecting'
            ? 'connecting'
            : liveHeart.bleStatus === 'error'
              ? 'degraded'
              : 'offline'
        return setMedicalDeviceConnection(next, 'ble-heart-rate', status, new Date().toISOString())
      } catch {
        return current
      }
    })
  }, [liveHeart.bleStatus, visit.phase])

  useEffect(() => {
    const source = synced.source?.trim()
    const measuredAt = synced.measuredAt || synced.syncedAt
    if (!source || source === 'Manual' || !measuredAt || !Number.isFinite(Date.parse(measuredAt))) return
    setVisit((current) => {
      if (current.phase === 'ended') return current
      try {
        const supports = [
          finite(synced.heartRate) ? 'heart-rate' : null,
          finite(synced.spo2Pct) ? 'spo2' : null,
          finite(synced.respRate) ? 'respiratory-rate' : null,
          finite(synced.systolic) ? 'blood-pressure-systolic' : null,
          finite(synced.diastolic) ? 'blood-pressure-diastolic' : null,
          finite(synced.bodyTempC) ? 'temperature' : null,
          finite(synced.weightKg) ? 'weight' : null,
        ].filter((item): item is NonNullable<typeof item> => Boolean(item))
        if (!supports.length) return current
        let next = registerMedicalDevice(current, {
          id: 'health-sync',
          label: source,
          deviceClass: 'vital-signs-monitor',
          evidenceClass: 'unknown',
          transport: 'manual-bridge',
          supports,
        }, new Date().toISOString())
        const age = Date.now() - Date.parse(measuredAt)
        next = setMedicalDeviceConnection(next, 'health-sync', age <= 120000 ? 'live' : 'degraded', new Date().toISOString())
        return next
      } catch {
        return current
      }
    })
  }, [
    synced.bodyTempC,
    synced.diastolic,
    synced.heartRate,
    synced.measuredAt,
    synced.respRate,
    synced.source,
    synced.spo2Pct,
    synced.systolic,
    synced.syncedAt,
    synced.weightKg,
    visit.phase,
  ])

  const heartRate = liveHeart.isLive && liveHeart.bpm > 0
    ? liveHeart.bpm
    : finite(latestClinical?.heartRate)
      ? latestClinical.heartRate
      : finite(synced.heartRate)
        ? synced.heartRate
        : undefined
  const spo2 = finite(latestClinical?.spo2)
    ? latestClinical.spo2
    : finite(synced.spo2Pct)
      ? synced.spo2Pct
      : undefined
  const respiratoryRate = finite(latestClinical?.respRate)
    ? latestClinical.respRate
    : finite(synced.respRate)
      ? synced.respRate
      : undefined
  const temperature = finite(latestClinical?.tempC)
    ? latestClinical.tempC
    : finite(synced.bodyTempC)
      ? synced.bodyTempC
      : undefined
  const systolic = finite(latestClinical?.systolic)
    ? latestClinical.systolic
    : finite(synced.systolic)
      ? synced.systolic
      : undefined
  const diastolic = finite(latestClinical?.diastolic)
    ? latestClinical.diastolic
    : finite(synced.diastolic)
      ? synced.diastolic
      : undefined

  const trace = [...clinicalTrace, ...liveTrace].slice(-32)
  const path = tracePath(trace)
  const deviceCount = Object.values(visit.devices).filter((device) => device.status === 'live' || device.status === 'degraded').length
  const running = visit.phase === 'live' || visit.phase === 'paused'
  const cameraOpen = visit.phase === 'live'
  const confirmed = visit.consent.clinicalData.granted

  const patientVisit = useMemo(() => {
    const email = account?.email?.trim().toLowerCase()
    if (!email) return undefined
    return state.consults
      .filter((item) => item.status === 'terjadwal' && item.patientEmail.trim().toLowerCase() === email)
      .slice()
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0]
  }, [account?.email, state.consults])

  function confirmConsent() {
    setVisit(createSession(visitId, activePatient.id, clinicianId, true, new Date().toISOString()))
  }

  function toggleVisit() {
    setVisit((current) => {
      const at = new Date().toISOString()
      if (current.phase === 'ready') return startVisit(current, at)
      if (current.phase === 'live') return pauseVisit(current)
      if (current.phase === 'paused') return resumeVisit(current, at)
      if (current.phase === 'ended') return createSession(visitId, activePatient.id, clinicianId, false, at)
      return current
    })
  }

  function stopVisit() {
    setVisit((current) => endVisit(current, new Date().toISOString()))
  }

  if (activePatient.id === 'none') {
    return (
      <section className="rounded-[30px] border border-white/10 bg-[#05070a] p-6 text-white">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/35">Visit OS</div>
        <div className="mt-2 text-lg font-black">Select or add a patient first</div>
      </section>
    )
  }

  return (
    <section
      data-visit-command-center="v1"
      aria-label="Panacea doctor visit operating system"
      className={[
        'relative overflow-hidden rounded-[34px] border border-white/10 bg-[#05070a] text-white shadow-[0_30px_110px_rgba(0,0,0,.34)]',
        embedded ? 'mb-6' : '',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-[18%] top-[8%] h-[58%] rounded-full bg-emerald-300/[.035] blur-3xl" aria-hidden />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.2em] text-emerald-200/70">Panacea Visit OS · AI-EMR live workspace</div>
          <div className="mt-1 truncate text-base font-black tracking-[-.03em]">{activePatient.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/45">{visit.phase}</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-black text-white/55">{deviceCount} devices</span>
          {!confirmed ? (
            <button type="button" onClick={confirmConsent} className="min-h-9 rounded-full bg-white px-3.5 text-[10px] font-black text-black transition active:scale-[.98]">Confirm consent</button>
          ) : (
            <button type="button" onClick={toggleVisit} className="min-h-9 rounded-full bg-white px-3.5 text-[10px] font-black text-black transition active:scale-[.98]">
              {visit.phase === 'ready' ? 'Start visit' : visit.phase === 'live' ? 'Pause' : visit.phase === 'paused' ? 'Resume' : 'New visit'}
            </button>
          )}
          {running ? <button type="button" onClick={stopVisit} className="min-h-9 rounded-full border border-red-300/20 px-3 text-[10px] font-black text-red-100/75">End</button> : null}
        </div>
      </header>

      <div className="relative grid gap-4 p-4 sm:p-5 xl:grid-cols-[220px_minmax(0,1fr)_310px] xl:items-stretch">
        <aside className="order-2 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 xl:order-1 xl:grid-cols-1 xl:content-start" aria-label="Visit vitals">
          {[
            ['Heart rate', metricText(heartRate), 'bpm'],
            ['SpO₂', metricText(spo2), '%'],
            ['Blood pressure', finite(systolic) && finite(diastolic) ? String(Math.round(systolic)) + '/' + String(Math.round(diastolic)) : '—', 'mmHg'],
            ['Respiratory rate', metricText(respiratoryRate), '/min'],
            ['Temperature', metricText(temperature, 1), '°C'],
          ].map(([label, value, unit]) => (
            <motion.div
              key={label}
              initial={false}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="min-w-0 border-b border-white/10 pb-2"
            >
              <div className="truncate text-[8px] font-black uppercase tracking-[.13em] text-white/32">{label}</div>
              <div className="mt-1 truncate text-2xl font-black tracking-[-.05em]">{value}<span className="ml-1 text-[9px] font-bold tracking-normal text-white/32">{unit}</span></div>
            </motion.div>
          ))}
          <details className="col-span-full border-t border-white/10 pt-3 text-[10px] text-white/42">
            <summary className="cursor-pointer font-black text-white/60">Interpret context</summary>
            <p className="mt-2 leading-relaxed">Live and synced device values stay visibly source-bound. The heart render is reference physiology, not patient-specific anatomy. Clinical commitment still occurs through the existing reviewed AI-EMR workflow.</p>
          </details>
        </aside>

        <div className="order-1 relative min-h-[430px] overflow-hidden rounded-[28px] border border-white/[.07] bg-black/35 xl:order-2">
          <div className="absolute left-4 top-4 z-10">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/38">Clinical physiology</div>
            <div className="mt-1 text-3xl font-black tracking-[-.06em]">Live visit</div>
          </div>
          <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-black backdrop-blur-xl">
            SpO₂ <span className="text-base">{metricText(spo2)}</span><span className="text-white/35">%</span>
          </div>

          <div className="absolute inset-x-[6%] bottom-[66px] top-[58px]">
            <CardiacCycle3D hr={finite(heartRate) ? heartRate : 72} tinggi={320} />
          </div>

          <div className="absolute inset-x-4 bottom-4 z-10 rounded-[18px] border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/35">
                {liveHeart.isLive ? 'BLE heart rate · live' : trace.length > 1 ? 'Recorded heart-rate history' : 'Waiting for heart-rate samples'}
              </span>
              <span className="shrink-0 text-[9px] font-black text-white/50">{trace.length} samples</span>
            </div>
            <svg viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label="Recorded heart-rate trace" className="mt-1 h-10 w-full">
              <line x1="0" y1="38" x2="100" y2="38" stroke="rgba(255,255,255,.08)" />
              {path ? <path d={path} fill="none" stroke="rgba(255,255,255,.82)" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /> : null}
            </svg>
          </div>
        </div>

        <aside className="order-3 space-y-3" aria-label="Visit camera">
          <div className="rounded-[22px] border border-white/10 bg-white/[.035] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[8px] font-black uppercase tracking-[.14em] text-white/35">Scheduled visit</div>
                <div className="mt-1 truncate text-sm font-black">{patientVisit ? patientVisit.doctorName : 'Patient-linked schedule'}</div>
              </div>
              <Link to="/consult" className="shrink-0 rounded-full border border-white/10 px-2.5 py-1.5 text-[9px] font-black text-white/55">Open</Link>
            </div>
            <div className="mt-2 truncate text-[10px] text-white/42">
              {patientVisit ? new Date(patientVisit.at).toLocaleString() + ' · ' + patientVisit.specialty : 'No safely linked appointment for this patient context'}
            </div>
          </div>

          {cameraOpen ? (
            <ConsultChat room={cameraRoom} name={account?.name || state.settings.doctorName || 'Clinician'} title="Doctor camera" compact />
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-white/10 bg-black/35 p-5 text-center">
              <div>
                <div className="text-sm font-black">{visit.phase === 'paused' ? 'Visit paused' : 'Camera ready after visit starts'}</div>
                <div className="mt-1 text-[10px] text-white/35">Camera and microphone are requested only inside an active visit.</div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="relative border-t border-white/10 px-4 py-3 sm:px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => void liveHeart.connectStrap()}
            disabled={!liveHeart.bleSupported || liveHeart.bleStatus === 'connecting'}
            className="min-h-10 shrink-0 rounded-full border border-white/10 px-3 text-[9px] font-black text-white/60 disabled:opacity-35"
          >
            {liveHeart.bleStatus === 'connected' ? 'BLE HR · ' + liveHeart.bpm + ' bpm' : liveHeart.bleStatus === 'connecting' ? 'Connecting BLE…' : liveHeart.bleSupported ? 'Connect BLE HR' : 'BLE unavailable'}
          </button>
          <Link to="/health-data/tutorial" className="grid min-h-10 shrink-0 place-items-center rounded-full border border-white/10 px-3 text-[9px] font-black text-white/60">Health Sync</Link>
          <Link to="/emr" className="grid min-h-10 shrink-0 place-items-center rounded-full border border-white/10 px-3 text-[9px] font-black text-white/60">AI-EMR</Link>
          <Link to="/body-explorer" className="grid min-h-10 shrink-0 place-items-center rounded-full border border-white/10 px-3 text-[9px] font-black text-white/60">Body Exposure</Link>
          <span className="grid min-h-10 shrink-0 place-items-center rounded-full border border-white/10 px-3 text-[9px] font-black text-white/35">
            {synced.source ? 'Sync · ' + synced.source : 'No synced device source'}
          </span>
        </div>
      </footer>
    </section>
  )
}

export default VisitCommandCenter
