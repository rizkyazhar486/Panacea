import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from './ui'
import { IconActivity, IconHeart } from './icons'
import { Fold } from '../shared/ui/Fold'
import { useOptionalStore } from '../lib/store'
import { readUnifiedLocalVitals } from '../domains/identity/bootVitals'
import { mergeVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import {
  VENUE_LENSES,
  buildCompactHumanAnalysis,
  type CompactMetricSlot,
  type PerformanceStyleId,
  type VenueLensId,
} from '../domains/personal-health/engine/compactHumanAnalyzer'

const parseOpt = (raw: string): number | null => {
  if (!raw.trim()) return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function MetricCell({ slot }: { readonly slot: CompactMetricSlot }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.22)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      className="bg-neutral-50/70 dark:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
          {slot.label}
        </span>
        <span
          className="text-[10px] font-bold"
          style={{
            color:
              slot.truthClass === 'recorded'
                ? 'var(--teks-ok)'
                : slot.truthClass === 'heuristic'
                ? 'var(--teks-warn)'
                : 'inherit',
            opacity: slot.truthClass === 'missing' ? 0.55 : 0.9,
          }}
        >
          {slot.truthClass === 'recorded'
            ? 'Recorded'
            : slot.truthClass === 'derived_reference'
            ? 'Ref Calc'
            : slot.truthClass === 'heuristic'
            ? 'Heuristic'
            : 'Missing'}
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-black tabular-nums text-ink dark:text-white">{slot.valueDisplay}</span>
        {slot.unit && <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{slot.unit}</span>}
      </div>
      {slot.tag && (
        <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{slot.tag}</div>
      )}
    </div>
  )
}

export function CompactHumanAnalyzer() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const activePatient = store?.activePatient ?? null

  const [lens, setLens] = useState<VenueLensId>('daily')
  const [perfStyle, setPerfStyle] = useState<PerformanceStyleId>('endurance_z2')
  const [rev, setRev] = useState(0)
  const [bleStatus, setBleStatus] = useState('')
  const [bleBusy, setBleBusy] = useState(false)
  const [exportNotice, setExportNotice] = useState('')

  // Optional spot-check overrides (empty string preserves missing = "—")
  const [ageIn, setAgeIn] = useState('')
  const [sexIn, setSexIn] = useState<'M' | 'F'>('M')
  const [weightIn, setWeightIn] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [waistIn, setWaistIn] = useState('')
  const [hipIn, setHipIn] = useState('')
  const [sbpIn, setSbpIn] = useState('')
  const [dbpIn, setDbpIn] = useState('')
  const [spo2In, setSpo2In] = useState('')
  const [rhrIn, setRhrIn] = useState('')
  const [hrvIn, setHrvIn] = useState('')
  const [sleepIn, setSleepIn] = useState('')
  const [fvcIn, setFvcIn] = useState('')
  const [fev1In, setFev1In] = useState('')
  const [postureIn, setPostureIn] = useState('')
  const [activityIn, setActivityIn] = useState<'ringan' | 'sedang' | 'berat'>('sedang')

  useEffect(() => {
    const refresh = () => setRev((v) => v + 1)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('panacea:body-character-updated', refresh)
    return () => {
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('panacea:body-character-updated', refresh)
    }
  }, [])

  const unified = useMemo(() => {
    void rev
    return readUnifiedLocalVitals(account, {
      patient: activePatient,
      patientVitals: activePatient?.id ? store?.state.vitals[activePatient.id] : undefined,
      sleepLogs: store?.state.sleepLogs,
    })
  }, [rev, account, activePatient, store?.state.vitals, store?.state.sleepLogs])

  const latestWorkout = useMemo(() => {
    void rev
    const all = getWorkouts()
    return all.length ? all[0] : null
  }, [rev])

  const safeRecordedAge =
    typeof unified.age === 'number'
      ? unified.age
      : typeof unified.age === 'string' && unified.age.trim() !== '' && Number.isFinite(Number(unified.age))
      ? Number(unified.age)
      : null

  const recordedWorkoutMinutes =
    latestWorkout && latestWorkout.durationSource !== 'unknown' && Number.isFinite(latestWorkout.durasi) && latestWorkout.durasi > 0
      ? Math.round(latestWorkout.durasi / 60)
      : null

  const analysis = useMemo(
    () =>
      buildCompactHumanAnalysis({
        age: parseOpt(ageIn) ?? safeRecordedAge,
        sex: sexIn,
        weightKg: parseOpt(weightIn) ?? unified.weightKg ?? null,
        heightCm: parseOpt(heightIn) ?? unified.heightCm ?? null,
        bodyFatPct: unified.bodyFatPct ?? null,
        skeletalMuscleKg: unified.skeletalMuscleKg ?? null,
        waistCm: parseOpt(waistIn) ?? null,
        hipCm: parseOpt(hipIn) ?? null,
        forwardHeadDeg: parseOpt(postureIn),
        systolic: parseOpt(sbpIn) ?? unified.systolic ?? null,
        diastolic: parseOpt(dbpIn) ?? unified.diastolic ?? null,
        spo2Pct: parseOpt(spo2In) ?? unified.spo2Pct ?? null,
        restingHr: parseOpt(rhrIn) ?? unified.restingHr ?? null,
        hrvMs: parseOpt(hrvIn) ?? unified.hrvMs ?? null,
        respRate: unified.respRate ?? null,
        bodyTempC: unified.bodyTempC ?? null,
        fvcL: parseOpt(fvcIn),
        fev1L: parseOpt(fev1In),
        vo2maxRecorded: unified.vo2max ?? null,
        sleepH: parseOpt(sleepIn) ?? unified.sleepH ?? null,
        steps: unified.steps ?? null,
        activityLevel: activityIn,
        latestWorkoutName: latestWorkout?.nama ?? null,
        latestWorkoutMinutes: recordedWorkoutMinutes,
      }),
    [
      ageIn,
      sexIn,
      weightIn,
      heightIn,
      waistIn,
      hipIn,
      sbpIn,
      dbpIn,
      spo2In,
      rhrIn,
      hrvIn,
      sleepIn,
      fvcIn,
      fev1In,
      postureIn,
      activityIn,
      unified,
      latestWorkout,
    ],
  )

  const lensSpec = useMemo(() => VENUE_LENSES.find((l) => l.id === lens) ?? VENUE_LENSES[0], [lens])
  const activePerf = useMemo(
    () => analysis.performanceStyles.find((p) => p.id === perfStyle) ?? analysis.performanceStyles[0],
    [analysis.performanceStyles, perfStyle],
  )

  const handleQuickBle = async () => {
    setBleBusy(true)
    try {
      const mod = await import('../domains/devices/adapters/quickConnectSession')
      await mod.triggerQuickWearableConnect((s) => {
        setBleStatus(s.message)
        if (s.status === 'connected') setRev((v) => v + 1)
      })
    } finally {
      setBleBusy(false)
    }
  }

  const handleClinicExport = async (kind: 'fhir' | 'soap') => {
    const mod = await import('../domains/clinical-operations')
    if (kind === 'fhir') {
      mod.downloadClinicalFhirBundle({ vitals: unified, patient: activePatient, account })
      setExportNotice('Exported HL7 FHIR R4 SATUSEHAT bundle (draft unverified).')
    } else {
      mod.downloadSoapSbarReport({ vitals: unified, patient: activePatient, account })
      setExportNotice('Exported SOAP/SBAR intake summary (clinically_reviewed=false).')
    }
  }

  const handleSaveSpotInputs = () => {
    const patch: Record<string, number | string> = { source: 'Compact Analyzer' }
    const w = parseOpt(weightIn); if (w) patch.weightKg = w
    const h = parseOpt(heightIn); if (h) patch.heightCm = h
    const sbp = parseOpt(sbpIn); if (sbp) patch.systolic = sbp
    const dbp = parseOpt(dbpIn); if (dbp) patch.diastolic = dbp
    const spo2 = parseOpt(spo2In); if (spo2) patch.spo2Pct = spo2
    const rhr = parseOpt(rhrIn); if (rhr) patch.restingHr = rhr
    const hrv = parseOpt(hrvIn); if (hrv) patch.hrvMs = hrv
    const sleep = parseOpt(sleepIn); if (sleep) patch.sleepH = sleep
    if (Object.keys(patch).length <= 1) {
      setExportNotice('Enter at least one positive measurement above before saving.')
      return
    }
    mergeVitals(patch)
    try {
      window.dispatchEvent(new Event('panacea:health-updated'))
      window.dispatchEvent(new Event('panacea:body-character-updated'))
    } catch { /* ignore */ }
    setExportNotice('Saved recorded inputs to shared canonical vitals.')
    setRev((v) => v + 1)
  }

  return (
    <div className="space-y-4" data-testid="compact-human-analyzer">
      <Card className="!p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle
              icon={<IconActivity size={20} />}
              title="Compact Whole-Human Intelligence Hub"
              subtitle="Body comp · Circumferences · Posture · BP/SpO₂/VC · Calories/Sleep/Energy · Longevity · Max Performance"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              Signals: {analysis.signalCoverage.populated}/{analysis.signalCoverage.total}
            </Badge>
            <Badge tone="low">clinically_reviewed=false</Badge>
          </div>
        </div>

        {/* Venue & Use-Case Lens Switcher */}
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Context use lens">
          {VENUE_LENSES.map((item) => {
            const active = lens === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLens(item.id)}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  padding: '0 14px',
                  borderRadius: 12,
                  border: active ? '1px solid #047857' : '1px solid rgba(148,163,184,0.28)',
                  background: active ? '#047857' : 'transparent',
                  color: active ? '#ffffff' : 'inherit',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          <strong className="text-ink dark:text-white">{lensSpec.audience}:</strong> {lensSpec.guidanceNote} Missing values display as &quot;—&quot; and are never fabricated.
        </p>

        {/* Action Strip: IoT BLE & Lazy Clinical Export */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={bleBusy}
            onClick={() => void handleQuickBle()}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: '0 14px',
              borderRadius: 12,
              border: '1px solid rgba(0, 191, 99, 0.45)',
              background: 'rgba(0, 191, 99, 0.12)',
              color: 'var(--teks-ok)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {bleBusy ? 'Connecting IoT BLE…' : '⚡ 1-Click IoT Wearable Sync'}
          </button>

          {lens === 'clinic_hospital' && (
            <>
              <button
                type="button"
                onClick={() => void handleClinicExport('fhir')}
                style={{ minHeight: 44, padding: '0 14px' }}
                className="rounded-xl border border-neutral-300 text-xs font-bold text-ink dark:border-white/20 dark:text-white"
              >
                Export FHIR R4
              </button>
              <button
                type="button"
                onClick={() => void handleClinicExport('soap')}
                style={{ minHeight: 44, padding: '0 14px' }}
                className="rounded-xl border border-neutral-300 text-xs font-bold text-ink dark:border-white/20 dark:text-white"
              >
                Export SOAP/SBAR
              </button>
            </>
          )}
        </div>
        {(bleStatus || exportNotice) && (
          <div className="mt-2 text-xs font-bold" style={{ color: 'var(--teks-ok)' }}>
            {exportNotice || bleStatus}
          </div>
        )}
      </Card>

      {/* 1. Body Composition, Circumferences & Posture */}
      <Card className="!p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">Body Composition, Circumferences &amp; Posture</h3>
          <span className="text-[11px] font-semibold text-neutral-500">Broca · WHtR · Alignment</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {analysis.bodyDomain.slots.map((slot) => (
            <MetricCell key={slot.id} slot={slot} />
          ))}
        </div>
      </Card>

      {/* 2. Cardiopulmonary, BP, SpO2 & Vital Capacity */}
      <Card className="!p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">Blood Pressure, SpO₂, Vitals &amp; Vital Capacity</h3>
          <span className="text-[11px] font-semibold text-neutral-500">MAP · FEV₁/FVC · NEWS2</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {analysis.cardioPulmDomain.slots.map((slot) => (
            <MetricCell key={slot.id} slot={slot} />
          ))}
        </div>
      </Card>

      {/* 3. Calories, Hydration, Sleep & Longevity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="!p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-ink dark:text-white">Calories, Hydration, Sleep &amp; Energy</h3>
            <span className="text-[11px] font-semibold text-neutral-500">TDEE · 33 mL/kg</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {analysis.energySleepDomain.slots.map((slot) => (
              <MetricCell key={slot.id} slot={slot} />
            ))}
          </div>
        </Card>

        <Card className="!p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-ink dark:text-white">Longevity &amp; Healthy Aging Context</h3>
            <span className="text-[11px] font-semibold text-neutral-500">Tanaka · Uth · IDF SE Asia</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {analysis.longevityDomain.slots.map((slot) => (
              <MetricCell key={slot.id} slot={slot} />
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Multiple Styles of Maximum Performance */}
      <Card className="!p-4">
        <SectionTitle
          icon={<IconHeart size={18} />}
          title="Maximum Performance Styles"
          subtitle="Karvonen HR Reserve & Tanaka 2001 training zones from your recorded biometrics"
        />
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Performance style">
          {analysis.performanceStyles.map((st) => {
            const active = st.id === perfStyle
            return (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPerfStyle(st.id)}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  padding: '0 12px',
                  borderRadius: 12,
                  border: active ? '1px solid #047857' : '1px solid rgba(148,163,184,0.28)',
                  background: active ? 'rgba(0, 191, 99, 0.14)' : 'transparent',
                  color: active ? 'var(--teks-ok)' : 'inherit',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {st.title}
              </button>
            )
          })}
        </div>
        <div className="mt-3 rounded-xl border border-black/10 p-3 dark:border-white/15">
          <div className="text-sm font-black text-ink dark:text-white">{activePerf.hrRangeDisplay}</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{activePerf.focusSummary}</p>
          <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--teks-ok)' }}>
            {activePerf.readinessHint}
          </p>
        </div>
      </Card>

      {/* Progressive Disclosures: Optional Spot Check Inputs & Verified Source Registry */}
      <Fold label="Inputs" subtitle="Spot measurements (empty remains missing)">
        <Card className="!p-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Field label="Age (yrs)"><input className={inputClass} type="number" placeholder="opt." value={ageIn} onChange={(e) => setAgeIn(e.target.value)} /></Field>
            <Field label="Sex">
              <select className={inputClass} value={sexIn} onChange={(e) => setSexIn(e.target.value as 'M' | 'F')} aria-label="Sex">
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </Field>
            <Field label="Weight (kg)"><input className={inputClass} type="number" step="0.1" placeholder="opt." value={weightIn} onChange={(e) => setWeightIn(e.target.value)} /></Field>
            <Field label="Height (cm)"><input className={inputClass} type="number" placeholder="opt." value={heightIn} onChange={(e) => setHeightIn(e.target.value)} /></Field>
            <Field label="Waist (cm)"><input className={inputClass} type="number" step="0.1" placeholder="opt." value={waistIn} onChange={(e) => setWaistIn(e.target.value)} /></Field>
            <Field label="Hip (cm)"><input className={inputClass} type="number" step="0.1" placeholder="opt." value={hipIn} onChange={(e) => setHipIn(e.target.value)} /></Field>
            <Field label="SBP (mmHg)"><input className={inputClass} type="number" placeholder="opt." value={sbpIn} onChange={(e) => setSbpIn(e.target.value)} /></Field>
            <Field label="DBP (mmHg)"><input className={inputClass} type="number" placeholder="opt." value={dbpIn} onChange={(e) => setDbpIn(e.target.value)} /></Field>
            <Field label="SpO₂ (%)"><input className={inputClass} type="number" placeholder="opt." value={spo2In} onChange={(e) => setSpo2In(e.target.value)} /></Field>
            <Field label="Resting HR (bpm)"><input className={inputClass} type="number" placeholder="opt." value={rhrIn} onChange={(e) => setRhrIn(e.target.value)} /></Field>
            <Field label="HRV (ms)"><input className={inputClass} type="number" placeholder="opt." value={hrvIn} onChange={(e) => setHrvIn(e.target.value)} /></Field>
            <Field label="Sleep (h)"><input className={inputClass} type="number" step="0.5" placeholder="opt." value={sleepIn} onChange={(e) => setSleepIn(e.target.value)} /></Field>
            <Field label="FVC (L)"><input className={inputClass} type="number" step="0.05" placeholder="opt." value={fvcIn} onChange={(e) => setFvcIn(e.target.value)} /></Field>
            <Field label="FEV₁ (L)"><input className={inputClass} type="number" step="0.05" placeholder="opt." value={fev1In} onChange={(e) => setFev1In(e.target.value)} /></Field>
            <Field label="Posture Tilt (°)"><input className={inputClass} type="number" step="1" placeholder="opt." value={postureIn} onChange={(e) => setPostureIn(e.target.value)} /></Field>
            <Field label="Activity Level">
              <select className={inputClass} value={activityIn} onChange={(e) => setActivityIn(e.target.value as 'ringan' | 'sedang' | 'berat')} aria-label="Activity Level">
                <option value="ringan">Light</option>
                <option value="sedang">Moderate</option>
                <option value="berat">High / Sport</option>
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <Button onClick={handleSaveSpotInputs}>Save Spot Inputs to Profile</Button>
          </div>
        </Card>
      </Fold>

      <Fold label="Sources" subtitle="Published references (clinically_reviewed=false)">
        <Card className="!p-4 space-y-2.5">
          {analysis.citations.map((src) => (
            <div key={src.id} className="rounded-xl border border-black/10 p-2.5 text-xs dark:border-white/15">
              <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-ink dark:text-white">
                <span>{src.label}</span>
                <span style={{ color: 'var(--teks-warn)' }}>PENDING_CLINICAL_REVIEW</span>
              </div>
              <div className="mt-1 text-neutral-600 dark:text-neutral-300">{src.citation}</div>
              <div className="mt-0.5 font-mono text-[11px] text-neutral-500">{src.formula}</div>
            </div>
          ))}
        </Card>
      </Fold>
    </div>
  )
}

export default CompactHumanAnalyzer
