import React, { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { getDemoTersimpan } from '../../lib/profile'
import { getVitals, type Vitals } from '../../lib/healthVitals'
import { useOptionalStore } from '../../lib/store'
import { useOptionalLongitudinalState } from '../../lib/useLongitudinalState'

export interface PersonalBodyGlassTelemetryProps {
  readonly userName?: string
  readonly recoveryScore?: number
  readonly strainScore?: number
  readonly sleepScore?: number
  readonly restingHeartRate?: number
  readonly rmssdMs?: number
  readonly hrr60Bpm?: number
  readonly bodyWeightKg?: number
  readonly bodyFatPercent?: number
  readonly leanMassKg?: number
  readonly biologicalAgeDeltaYears?: number
  readonly longitudinalId?: string
}

const cardBase: CSSProperties = {
  backgroundColor: 'rgba(6, 9, 13, 0.94)',
  border: '1px solid rgba(0, 191, 99, 0.22)',
  borderRadius: '24px',
  color: '#FFFFFF',
  padding: '20px',
}

const tileBase: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '14px',
}

function posNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

function latestLongMetric(
  eventsById: Record<string, { value?: unknown }> | undefined,
  metricEventIds: Record<string, readonly string[]> | undefined,
  metric: string,
): number | null {
  if (!eventsById || !metricEventIds) return null
  const ids = metricEventIds[metric]
  if (!ids || ids.length === 0) return null
  return posNum(eventsById[ids[ids.length - 1]]?.value)
}

export const PersonalBodyGlassTelemetry: React.FC<PersonalBodyGlassTelemetryProps> = ({
  userName,
  recoveryScore,
  strainScore,
  sleepScore,
  restingHeartRate,
  rmssdMs,
  hrr60Bpm,
  bodyWeightKg,
  bodyFatPercent,
  leanMassKg,
  biologicalAgeDeltaYears,
  longitudinalId,
}) => {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const [activePillar, setActivePillar] = useState<'CARDIO' | 'METABOLIC' | 'NEURO' | 'ORTHO' | 'ENDOCRINE'>('CARDIO')
  const [showDoctrine, setShowDoctrine] = useState(false)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('panacea:body-character-updated', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('panacea:health-updated', bump)
      window.removeEventListener('panacea:body-character-updated', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  const account = store?.account ?? null
  const activePatient = useMemo(
    () => store?.state.patients.find((p) => p.id === store.state.activePatientId) ?? null,
    [store],
  )

  const vitals = useMemo<Partial<Vitals>>(() => {
    void rev
    try {
      return getVitals(account)
    } catch {
      return {}
    }
  }, [account, rev])

  const demo = useMemo(() => {
    void rev
    try {
      return getDemoTersimpan()
    } catch {
      return {}
    }
  }, [rev])

  const eventsById = longitudinal?.state?.eventsById
  const metricIds = longitudinal?.state?.metricEventIds
  const totalEvents = eventsById ? Object.keys(eventsById).length : 0

  const rhr = restingHeartRate ?? posNum(vitals.restingHr) ?? posNum(vitals.heartRate) ?? latestLongMetric(eventsById, metricIds, 'restingHr')
  const rmssd = rmssdMs ?? posNum(vitals.hrvMs) ?? latestLongMetric(eventsById, metricIds, 'hrvMs')
  const spo2 = posNum(vitals.spo2Pct) ?? latestLongMetric(eventsById, metricIds, 'spo2Pct')
  const respRate = posNum(vitals.respRate) ?? latestLongMetric(eventsById, metricIds, 'respRate')
  const tempC = posNum(vitals.bodyTempC) ?? latestLongMetric(eventsById, metricIds, 'bodyTempC')
  const sleepH = posNum(vitals.sleepH) ?? latestLongMetric(eventsById, metricIds, 'sleepH')
  const steps = posNum(vitals.steps) ?? latestLongMetric(eventsById, metricIds, 'steps')
  const systolic = posNum(vitals.systolic)
  const diastolic = posNum(vitals.diastolic)
  const weightKg = bodyWeightKg ?? posNum(vitals.weightKg) ?? posNum(demo.weightKg)
  const fatPct = bodyFatPercent ?? posNum(vitals.bodyFatPct)
  const muscleKg =
    leanMassKg ??
    posNum(vitals.skeletalMuscleKg) ??
    (weightKg != null && fatPct != null ? Number((weightKg * (1 - fatPct / 100)).toFixed(1)) : null)

  const derivedRecovery =
    recoveryScore ??
    posNum(vitals.recoveryPct) ??
    (rmssd != null ? Math.min(100, Math.max(15, Math.round((rmssd / 80) * 100))) : null)

  const derivedStrain =
    strainScore ??
    posNum(vitals.strain) ??
    (steps != null ? Number(Math.min(21, (steps / 12000) * 15).toFixed(1)) : null)

  const derivedSleepScore =
    sleepScore ??
    (sleepH != null ? Math.min(100, Math.round((sleepH / 8) * 100)) : null)

  const C = 226.2
  const recoveryOffset = derivedRecovery != null ? C - (derivedRecovery / 100) * C : C
  const strainOffset = derivedStrain != null ? C - (Math.min(21, derivedStrain) / 21) * C : C
  const sleepOffset = derivedSleepScore != null ? C - (derivedSleepScore / 100) * C : C

  const bpText = systolic != null && diastolic != null ? `${Math.round(systolic)}/${Math.round(diastolic)} mmHg` : null

  const healthspanPillars = [
    {
      id: 'CARDIO' as const,
      label: 'Cardiovascular',
      jewel: '#0A84FF',
      score: derivedRecovery != null ? `${derivedRecovery}%` : '—',
      metric: `RHR ${rhr != null ? `${Math.round(rhr)} bpm` : '—'} · BP ${bpText ?? '—'} · SpO2 ${spo2 != null ? `${spo2.toFixed(1)}%` : '—'}`,
      desc:
        rhr != null || bpText != null || spo2 != null
          ? 'Reflects recorded resting pulse, brachial pressure, and peripheral oxygenation from your profile or connected Bluetooth wearable.'
          : 'No resting HR, BP, or SpO2 recorded yet. Pair a monitor in 25 Wearable Hub or enter measurements in Health Data.',
    },
    {
      id: 'METABOLIC' as const,
      label: 'Metabolism',
      jewel: '#00BF63',
      score: fatPct != null ? `${(100 - fatPct).toFixed(0)}%` : '—',
      metric: `Weight ${weightKg != null ? `${weightKg.toFixed(1)} kg` : '—'} · Steps ${steps != null ? Math.round(steps).toLocaleString('en-US') : '—'}`,
      desc:
        weightKg != null || steps != null
          ? 'Derived strictly from recorded body weight, body-fat percentage, and measured daily ambulation.'
          : 'No weight or step exposure recorded yet. Enter quick baseline values in Your Body -> Body.',
    },
    {
      id: 'NEURO' as const,
      label: 'Autonomic',
      jewel: '#AF52DE',
      score: derivedSleepScore != null ? `${derivedSleepScore}%` : '—',
      metric: `HRV ${rmssd != null ? `${Math.round(rmssd)} ms` : '—'} · Sleep ${sleepH != null ? `${sleepH.toFixed(1)} h` : '—'}`,
      desc:
        rmssd != null || sleepH != null
          ? 'Reflects recorded RMSSD heart-rate variability and overnight sleep duration without synthetic interpolation.'
          : 'No overnight HRV or sleep duration recorded yet. Capture a 5-min Bluetooth R-R interval session or import wearable sleep.',
    },
    {
      id: 'ORTHO' as const,
      label: 'Musculoskeletal',
      jewel: '#FF9F0A',
      score: muscleKg != null ? `${muscleKg.toFixed(1)} kg` : '—',
      metric: `Lean ${muscleKg != null ? `${muscleKg.toFixed(1)} kg` : '—'} · Body fat ${fatPct != null ? `${fatPct.toFixed(1)}%` : '—'}`,
      desc:
        muscleKg != null
          ? 'Estimated lean mass from recorded skeletal muscle reading or body weight and body fat %.'
          : 'Enter body fat % or BIA scale sync in Your Body -> Body to populate lean mass.',
    },
    {
      id: 'ENDOCRINE' as const,
      label: 'Thermoregulation',
      jewel: '#FF453A',
      score: tempC != null ? `${tempC.toFixed(1)}°C` : '—',
      metric: `Temp ${tempC != null ? `${tempC.toFixed(1)}°C` : '—'} · Resp ${respRate != null ? `${Math.round(respRate)}/min` : '—'}`,
      desc:
        tempC != null || respRate != null
          ? 'Tracks recorded skin/core thermometer and respiratory cadence events in canonical longitudinal storage.'
          : 'No thermometer or respiratory rate reading logged yet.',
    },
  ]

  const currentPillar = healthspanPillars.find((p) => p.id === activePillar) ?? healthspanPillars[0]
  const displayName = userName ?? activePatient?.name ?? account?.name ?? 'Personal Record'
  const effectiveLid =
    longitudinalId ??
    (account ? `LID-${(account.id ?? account.email).slice(-8).toUpperCase()}` : 'UNAUTHENTICATED-DRAFT')

  return (
    <section aria-label="Cathedral Healthspan & Longitudinal Identity Matrix" style={cardBase}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#00BF63' }} />
            <span style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>
              Longitudinal Telemetry · Recorded Signals Only
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {effectiveLid}
            </span>
          </div>
          <h3 style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: 700, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <span>{displayName}</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '9999px',
                background: 'rgba(0, 191, 99, 0.14)',
                color: '#6EE7B7',
                border: '1px solid rgba(0, 191, 99, 0.3)',
              }}
            >
              {biologicalAgeDeltaYears != null
                ? `${biologicalAgeDeltaYears > 0 ? '+' : ''}${biologicalAgeDeltaYears} yrs`
                : `${totalEvents} canonical events · Draft (clinically_reviewed=false)`}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowDoctrine((v) => !v)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontFamily: 'monospace',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: '#D1D5DB',
            cursor: 'pointer',
          }}
        >
          {showDoctrine ? 'Close Truth Charter' : 'Truth & Safety Charter'}
        </button>
      </div>

      {showDoctrine && (
        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: '#D1D5DB' }}>
            Canonical patient truth fails closed: unrecorded measurements render as &ldquo;—&rdquo; and never fabricate surrogate biometrics or diagnosis. Computed indices remain unverified drafts (clinically_reviewed=false) until signed by an authorized STR clinician.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
        <div style={{ ...tileBase, border: '1px solid rgba(0, 191, 99, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '68px', height: '68px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#00BF63" strokeWidth="7" strokeDasharray={C} strokeDashoffset={recoveryOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#00BF63' }}>
              {derivedRecovery != null ? `${derivedRecovery}%` : '—'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Autonomic Readiness</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Vagal Recovery</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              HRV {rmssd != null ? `${Math.round(rmssd)} ms` : '—'} · HRR60 {hrr60Bpm != null ? `${hrr60Bpm} bpm` : '—'}
            </div>
          </div>
        </div>

        <div style={{ ...tileBase, border: '1px solid rgba(255, 159, 10, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '68px', height: '68px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#FF9F0A" strokeWidth="7" strokeDasharray={C} strokeDashoffset={strainOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#FF9F0A' }}>
              {derivedStrain != null ? derivedStrain : '—'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Daily Exposure</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Physical Load</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              Steps {steps != null ? Math.round(steps).toLocaleString('en-US') : '—'}
            </div>
          </div>
        </div>

        <div style={{ ...tileBase, border: '1px solid rgba(175, 82, 222, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '68px', height: '68px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#AF52DE" strokeWidth="7" strokeDasharray={C} strokeDashoffset={sleepOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#AF52DE' }}>
              {derivedSleepScore != null ? `${derivedSleepScore}%` : '—'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Restorative Sleep</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Sleep &amp; RHR</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              RHR {rhr != null ? `${Math.round(rhr)} bpm` : '—'} · Sleep {sleepH != null ? `${sleepH.toFixed(1)}h` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>
            5 Recorded System Pillars
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#6EE7B7' }}>
            Sync wearables or enter Health Data
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
          {healthspanPillars.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePillar(p.id)}
              style={{
                backgroundColor: activePillar === p.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: activePillar === p.id ? `1px solid ${p.jewel}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: p.jewel }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{p.score}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#FFFFFF' }}>{p.label}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '10px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${currentPillar.jewel}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{currentPillar.label} Summary</h4>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#D1D5DB' }}>{currentPillar.metric}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>{currentPillar.desc}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Weight</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF' }}>
            {weightKg != null ? weightKg.toFixed(1) : '—'} <span style={{ fontSize: '11px', color: '#9CA3AF' }}>kg</span>
          </div>
          <div style={{ fontSize: '10px', color: '#6EE7B7', fontFamily: 'monospace' }}>{weightKg != null ? 'Recorded' : 'Not recorded'}</div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Lean Mass</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF' }}>
            {muscleKg != null ? muscleKg.toFixed(1) : '—'} <span style={{ fontSize: '11px', color: '#9CA3AF' }}>kg</span>
          </div>
          <div style={{ fontSize: '10px', color: '#93C5FD', fontFamily: 'monospace' }}>
            Body fat: {fatPct != null ? `${fatPct.toFixed(1)}%` : '—'}
          </div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Blood Pressure</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF' }}>{bpText ?? '—'}</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{bpText ? 'Oscillometric / log' : 'Not recorded'}</div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>SpO2 &amp; Temp</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF' }}>
            {spo2 != null ? `${spo2.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>
            Temp: {tempC != null ? `${tempC.toFixed(1)}°C` : '—'}
          </div>
        </div>
      </div>
    </section>
  )
}
