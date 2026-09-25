import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CardiacCycle3D } from './CardiacCycle3D'
import { ConsultChat, type ConsultChatMediaState } from './ConsultChat'
import { useStore } from '../lib/store'
import { backendEnabled } from '../lib/api'
import { useLiveHeartRate } from '../lib/useLiveHeartRate'
import { useVitals } from '../lib/useVitals'
import { resolveVisitRuntimeIdentity } from '../lib/visitRuntimeIdentity'
import {
  buildAiEmrVisitContext,
  createVisitOperatingSession,
  endVisit,
  ingestVisitDeviceObservation,
  pauseVisit,
  registerMedicalDevice,
  resumeVisit,
  setMedicalDeviceConnection,
  startVisit,
  updateVisitMedia,
  type VisitDeviceMetric,
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

function AuthenticatedVisitCommandCenter({
  recordId,
  embedded = false,
  clinicianId,
  subjectId,
}: VisitCommandCenterProps & { clinicianId: string; subjectId: string }) {
  const { state, activePatient, account } = useStore()
  const reduceMotion = useReducedMotion()
  const synced = useVitals()
  const liveHeart = useLiveHeartRate()
  const visitId = 'visit-' + safeToken((recordId || activePatient.id) + '-' + new Date().toISOString().slice(0, 10))
  const cameraRoom = 'visit-' + safeToken(recordId || activePatient.id)

  const [visit, setVisit] = useState<VisitOperatingState>(() =>
    createSession(visitId, subjectId, clinicianId, false, new Date().toISOString()),
  )
  const [liveTrace, setLiveTrace] = useState<number[]>([])
  const [clock, setClock] = useState(() => new Date().toISOString())

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date().toISOString()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setVisit(createSession(visitId, subjectId, clinicianId, false, new Date().toISOString()))
    setLiveTrace([])
  }, [clinicianId, subjectId, visitId])

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
    if (!liveHeart.isLive || !liveHeart.lastSampleAt || !finite(liveHeart.bpm) || liveHeart.bpm <= 0) return
    setLiveTrace((current) => [...current, liveHeart.bpm].slice(-32))
  }, [liveHeart.bpm, liveHeart.isLive, liveHeart.lastSampleAt, liveHeart.sampleSequence])

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
    if (!liveHeart.isLive || !liveHeart.lastSampleAt || liveHeart.bpm <= 0) return
    setVisit((current) => {
      if (current.phase !== 'live' && current.phase !== 'paused') return current
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
          }, liveHeart.lastSampleAt!)
        }
        next = setMedicalDeviceConnection(next, 'ble-heart-rate', 'live', liveHeart.lastSampleAt!)
        return ingestVisitDeviceObservation(next, {
          id: 'ble-heart-rate-' + liveHeart.sampleSequence + '-' + Date.parse(liveHeart.lastSampleAt!),
          visitId: next.visitId,
          subjectId: next.subjectId,
          deviceId: 'ble-heart-rate',
          metric: 'heart-rate',
          value: liveHeart.bpm,
          unit: 'bpm',
          capturedAt: liveHeart.lastSampleAt!,
          receivedAt: new Date().toISOString(),
          signalQuality: null,
          standardCode: { system: 'loinc', code: '8867-4' },
        }).state
      } catch {
        return current
      }
    })
  }, [liveHeart.bpm, liveHeart.isLive, liveHeart.lastSampleAt, liveHeart.sampleSequence])

  useEffect(() => {
    const source = synced.source?.trim()
    const measuredAt = synced.measuredAt || synced.syncedAt
    if (!source || source === 'Manual' || !measuredAt || !Number.isFinite(Date.parse(measuredAt))) return
    setVisit((current) => {
      if (current.phase === 'ended') return current
      try {
        const supports: VisitDeviceMetric[] = []
        if (finite(synced.heartRate)) supports.push('heart-rate')
        if (finite(synced.spo2Pct)) supports.push('spo2')
        if (finite(synced.respRate)) supports.push('respiratory-rate')
        if (finite(synced.systolic)) supports.push('blood-pressure-systolic')
        if (finite(synced.diastolic)) supports.push('blood-pressure-diastolic')
        if (finite(synced.bodyTempC)) supports.push('temperature')
        if (finite(synced.weightKg)) supports.push('weight')
        if (!supports.length) return current
        const now = new Date().toISOString()
        let next = registerMedicalDevice(current, {
          id: 'health-sync',
          label: source,
          deviceClass: 'vital-signs-monitor',
          evidenceClass: 'unknown',
          transport: 'manual-bridge',
          supports,
        }, now)
        const capturedMs = Date.parse(measuredAt)
        const age = Math.max(0, Date.parse(now) - capturedMs)
        next = setMedicalDeviceConnection(next, 'health-sync', age <= 120000 ? 'live' : 'degraded', now)
        if ((next.phase !== 'live' && next.phase !== 'paused') || age > 5 * 60_000) return next

        const receivedAt = synced.syncedAt && Number.isFinite(Date.parse(synced.syncedAt)) && Date.parse(synced.syncedAt) >= capturedMs
          ? synced.syncedAt
          : now
        const readings: Array<[VisitDeviceMetric, number | undefined, string, string | undefined]> = [
          ['heart-rate', finite(synced.heartRate) ? synced.heartRate : undefined, 'bpm', '8867-4'],
          ['spo2', finite(synced.spo2Pct) ? synced.spo2Pct : undefined, '%', undefined],
          ['respiratory-rate', finite(synced.respRate) ? synced.respRate : undefined, '/min', undefined],
          ['blood-pressure-systolic', finite(synced.systolic) ? synced.systolic : undefined, 'mmHg', '8480-6'],
          ['blood-pressure-diastolic', finite(synced.diastolic) ? synced.diastolic : undefined, 'mmHg', '8462-4'],
          ['temperature', finite(synced.bodyTempC) ? synced.bodyTempC : undefined, '°C', undefined],
          ['weight', finite(synced.weightKg) ? synced.weightKg : undefined, 'kg', '29463-7'],
        ]
        for (const [metric, value, unit, loinc] of readings) {
          if (!finite(value)) continue
          next = ingestVisitDeviceObservation(next, {
            id: 'health-sync-' + metric + '-' + capturedMs,
            visitId: next.visitId,
            subjectId: next.subjectId,
            deviceId: 'health-sync',
            metric,
            value,
            unit,
            capturedAt: measuredAt,
            receivedAt,
            signalQuality: null,
            standardCode: loinc ? { system: 'loinc', code: loinc } : undefined,
          }).state
        }
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

  const visitContext = useMemo(() => buildAiEmrVisitContext(visit, clock), [clock, visit])
  const liveByMetric = useMemo(
    () => new Map(visitContext.observations.map((observation) => [observation.metric, observation])),
    [visitContext.observations],
  )

  const heartRate = finite(liveByMetric.get('heart-rate')?.value)
    ? liveByMetric.get('heart-rate')!.value
    : liveHeart.isLive && liveHeart.bpm > 0
    ? liveHeart.bpm
    : finite(latestClinical?.heartRate)
      ? latestClinical.heartRate
      : finite(synced.heartRate)
        ? synced.heartRate
        : undefined
  const spo2 = finite(liveByMetric.get('spo2')?.value)
    ? liveByMetric.get('spo2')!.value
    : finite(latestClinical?.spo2)
    ? latestClinical.spo2
    : finite(synced.spo2Pct)
      ? synced.spo2Pct
      : undefined
  const respiratoryRate = finite(liveByMetric.get('respiratory-rate')?.value)
    ? liveByMetric.get('respiratory-rate')!.value
    : finite(latestClinical?.respRate)
    ? latestClinical.respRate
    : finite(synced.respRate)
      ? synced.respRate
      : undefined
  const temperature = finite(liveByMetric.get('temperature')?.value)
    ? liveByMetric.get('temperature')!.value
    : finite(latestClinical?.tempC)
    ? latestClinical.tempC
    : finite(synced.bodyTempC)
      ? synced.bodyTempC
      : undefined
  const systolic = finite(liveByMetric.get('blood-pressure-systolic')?.value)
    ? liveByMetric.get('blood-pressure-systolic')!.value
    : finite(latestClinical?.systolic)
    ? latestClinical.systolic
    : finite(synced.systolic)
      ? synced.systolic
      : undefined
  const diastolic = finite(liveByMetric.get('blood-pressure-diastolic')?.value)
    ? liveByMetric.get('blood-pressure-diastolic')!.value
    : finite(latestClinical?.diastolic)
    ? latestClinical.diastolic
    : finite(synced.diastolic)
      ? synced.diastolic
      : undefined

  const trace = [...clinicalTrace, ...liveTrace].slice(-32)
  const path = tracePath(trace)
  const deviceCount = visitContext.connectedDevices.filter((device) => device.status === 'live' || device.status === 'degraded').length
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
    setVisit(createSession(visitId, subjectId, clinicianId, true, new Date().toISOString()))
  }

  function toggleVisit() {
    setVisit((current) => {
      const at = new Date().toISOString()
      if (current.phase === 'ready') return startVisit(current, at)
      if (current.phase === 'live') {
        const mediaOff = updateVisitMedia(current, { camera: 'off', microphone: 'off', peerCount: 0 })
        return pauseVisit(mediaOff)
      }
      if (current.phase === 'paused') return resumeVisit(current, at)
      if (current.phase === 'ended') return createSession(visitId, subjectId, clinicianId, false, at)
      return current
    })
  }

  function stopVisit() {
    setVisit((current) => endVisit(current, new Date().toISOString()))
  }

  const onMediaStateChange = useCallback((media: ConsultChatMediaState) => {
    setVisit((current) => {
      if (current.phase !== 'live' && current.phase !== 'paused') return current
      try {
        return updateVisitMedia(current, {
          camera: media.camera,
          microphone: media.microphone,
          peerCount: media.peerCount,
        })
      } catch {
        return current
      }
    })
  }, [])

  if (activePatient.id === 'none') {
    return (
      <section className="dark rounded-[30px] border border-white/10 bg-[#05070a] p-6 text-white">
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

          {cameraOpen && backendEnabled ? (
            <ConsultChat
              room={cameraRoom}
              name={account?.name || state.settings.doctorName || 'Clinician'}
              title="Doctor camera"
              compact
              onMediaStateChange={onMediaStateChange}
            />
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-white/10 bg-black/35 p-5 text-center">
              <div className="truncate text-sm font-black text-white/65">
                {!backendEnabled ? 'Realtime backend unavailable' : visit.phase === 'paused' ? 'Visit paused' : 'Camera ready after visit starts'}
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
            {visitContext.observations.length + ' live observations · ' + (synced.source ? synced.source : 'no sync source')}
          </span>
        </div>
      </footer>
    </section>
  )
}

export function VisitCommandCenter(props: VisitCommandCenterProps) {
  const { account, activePatient } = useStore()
  const identity = resolveVisitRuntimeIdentity(account, activePatient.id)

  if (!identity.ok) {
    const message = identity.reason === 'patient-required'
      ? 'Select or add a patient first'
      : identity.reason === 'clinician-role-required'
        ? 'Switch to doctor mode to start a clinical visit'
        : 'Sign in as a doctor to start a clinical visit'

    return (
      <section
        data-visit-identity-blocked={identity.reason}
        aria-label="Panacea doctor visit operating system"
        className="dark rounded-[30px] border border-white/10 bg-[#05070a] p-6 text-white"
      >
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/35">Visit OS</div>
        <div className="mt-2 text-lg font-black">{message}</div>
      </section>
    )
  }

  return (
    <AuthenticatedVisitCommandCenter
      {...props}
      clinicianId={identity.clinicianId}
      subjectId={identity.subjectId}
    />
  )
}

export default VisitCommandCenter
