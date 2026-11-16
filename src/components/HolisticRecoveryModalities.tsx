import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from './ui'
import { IconActivity, IconHeart } from './icons'
import {
  HOLISTIC_RECOVERY_MODALITIES,
  analyzePrePostRecovery,
  createRecoveryLedgerTransaction,
  type RecoveryLedgerTransaction,
  type RecoveryModalityId,
  type RecoveryPerspective,
} from '../domains/personal-health/engine/holisticRecoveryProtocol'
import { appendRecoveryLedgerEntry, readRecoveryLedger } from '../domains/personal-health/adapters/recoveryLedgerStorage'
import { readUnifiedLocalVitals } from '../domains/identity/localRecovery'
import { useOptionalStore } from '../lib/store'
import { mergeVitals } from '../lib/healthVitals'
import { mergeHealthCache } from '../lib/profile'
import { getWorkouts } from '../lib/workoutStore'
import { BatasKlaimKesehatan } from './BatasKlaimKesehatan'

const PRESET_PRIMARY: Record<RecoveryModalityId, number> = {
  hbot: 1.8,
  whole_body_cryo: -120,
  red_light_pbm: 80,
  x_tone: 35,
  x_cryo: -25,
}
const PRESET_SECONDARY: Record<RecoveryModalityId, number> = {
  hbot: 100,
  whole_body_cryo: 0,
  red_light_pbm: 850,
  x_tone: 1.5,
  x_cryo: 0,
}
const PRESET_DUR: Record<RecoveryModalityId, number> = {
  hbot: 60,
  whole_body_cryo: 3,
  red_light_pbm: 12,
  x_tone: 20,
  x_cryo: 4,
}

export function HolisticRecoveryModalities() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null
  const initialVitals = useMemo(
    () =>
      readUnifiedLocalVitals(account, {
        patient,
        patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
        sleepLogs: store?.state.sleepLogs,
      }),
    [account, patient, store?.state.vitals, store?.state.sleepLogs],
  )
  const latestWorkout = useMemo(() => {
    const all = getWorkouts()
    return all.length ? all[0] : null
  }, [])

  const [modalityId, setModalityId] = useState<RecoveryModalityId>('hbot')
  const [perspective, setPerspective] = useState<RecoveryPerspective>('athlete')
  const [durationMin, setDurationMin] = useState<number>(PRESET_DUR.hbot)
  const [primaryVal, setPrimaryVal] = useState<number>(PRESET_PRIMARY.hbot)
  const [secondaryVal, setSecondaryVal] = useState<number>(PRESET_SECONDARY.hbot)
  const [site, setSite] = useState('Knee / Patellar Tendon')
  const [postHrv, setPostHrv] = useState<string>('')
  const [postRhr, setPostRhr] = useState<string>('')
  const [postSpo2, setPostSpo2] = useState<string>('')
  const [preLactate, setPreLactate] = useState<string>('')
  const [postLactate, setPostLactate] = useState<string>('')
  const [ledger, setLedger] = useState<RecoveryLedgerTransaction[]>(() => readRecoveryLedger())
  const [savedNotice, setSavedNotice] = useState('')

  const spec = useMemo(
    () => HOLISTIC_RECOVERY_MODALITIES.find((m) => m.id === modalityId) ?? HOLISTIC_RECOVERY_MODALITIES[0],
    [modalityId],
  )

  const selectModality = (id: RecoveryModalityId) => {
    setModalityId(id)
    setDurationMin(PRESET_DUR[id])
    setPrimaryVal(PRESET_PRIMARY[id])
    setSecondaryVal(PRESET_SECONDARY[id])
    setSavedNotice('')
  }

  const parseOpt = (raw: string) => {
    const n = Number(raw)
    return raw.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null
  }

  const preBiometrics = useMemo(
    () => ({
      hrvMs: typeof initialVitals.hrvMs === 'number' ? initialVitals.hrvMs : null,
      restingHr: typeof initialVitals.restingHr === 'number' ? initialVitals.restingHr : null,
      spo2Pct: typeof initialVitals.spo2Pct === 'number' ? initialVitals.spo2Pct : null,
      vo2max: typeof initialVitals.vo2max === 'number' ? initialVitals.vo2max : null,
      sleepH: typeof initialVitals.sleepH === 'number' ? initialVitals.sleepH : null,
      lactateMmolL: parseOpt(preLactate),
    }),
    [initialVitals, preLactate],
  )

  const postBiometrics = useMemo(
    () => ({
      hrvMs: parseOpt(postHrv),
      restingHr: parseOpt(postRhr),
      spo2Pct: parseOpt(postSpo2),
      lactateMmolL: parseOpt(postLactate),
    }),
    [postHrv, postRhr, postSpo2, postLactate],
  )

  const correlationInput = useMemo(
    () => ({
      modalityId,
      durationMin,
      primaryValue: primaryVal,
      secondaryValue: spec.referenceBounds.secondaryLabel ? secondaryVal : undefined,
      anatomicalSite: modalityId === 'x_cryo' ? site : undefined,
      pre: preBiometrics,
      post: postBiometrics,
      linkedWorkoutLabel: latestWorkout ? `${latestWorkout.nama} (${latestWorkout.mulai.slice(0, 10)})` : undefined,
    }),
    [modalityId, durationMin, primaryVal, secondaryVal, spec.referenceBounds.secondaryLabel, site, preBiometrics, postBiometrics, latestWorkout],
  )

  const analysis = useMemo(() => analyzePrePostRecovery(correlationInput), [correlationInput])

  const handleLogSession = () => {
    const nowIso = new Date().toISOString()
    const tx = createRecoveryLedgerTransaction(
      account?.id ?? 'local-session',
      correlationInput,
      analysis,
      nowIso,
      typeof initialVitals.source === 'string' ? initialVitals.source : 'Recovery Studio',
    )
    const nextLedger = appendRecoveryLedgerEntry(tx)
    setLedger(nextLedger)

    const patch: Record<string, number | string> = {
      source: `${spec.shortName} Recovery`,
      measuredAt: nowIso,
    }
    if (postBiometrics.hrvMs != null) patch.hrvMs = postBiometrics.hrvMs
    if (postBiometrics.restingHr != null) patch.restingHr = postBiometrics.restingHr
    if (postBiometrics.spo2Pct != null) patch.spo2Pct = postBiometrics.spo2Pct
    if (Object.keys(patch).length > 2) {
      mergeVitals(patch)
      mergeHealthCache(patch)
    }
    setSavedNotice(`Verified ${tx.id} (${tx.emvReceiptToken}) recorded to Biometric Recovery Ledger.`)
  }

  return (
    <Card className="!p-5" data-testid="holistic-recovery-modalities">
      <SectionTitle
        icon={<IconActivity size={20} />}
        title="Precision Recovery Studio (5 Modalities)"
        subtitle="HBOT · Whole-Body Cryo · Red Light / PBM · X-Tone MMS · X-Cryo Local — synced with wearables & running logs"
      />
      <BatasKlaimKesehatan permukaan="wellness.recovery" />

      {/* Daily Readiness & Activity Rings backed strictly by recorded wearable telemetry */}
      <div
        className="mt-3 rounded-2xl border border-black/10 p-3 dark:border-white/15"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}
        data-testid="daily-readiness-rings"
      >
        <svg width="58" height="58" viewBox="0 0 64 64" aria-label="Daily readiness activity rings">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#00BF63"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(1, typeof initialVitals.steps === 'number' ? initialVitals.steps / 10000 : 0) * 163.36} 163.36`}
            transform="rotate(-90 32 32)"
          />
          <circle cx="32" cy="32" r="19" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r="19"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(1, typeof initialVitals.sleepH === 'number' ? initialVitals.sleepH / 8 : 0) * 119.38} 119.38`}
            transform="rotate(-90 32 32)"
          />
          <circle cx="32" cy="32" r="12" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r="12"
            fill="none"
            stroke="#A855F7"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(1, typeof initialVitals.hrvMs === 'number' ? initialVitals.hrvMs / 80 : 0) * 75.4} 75.4`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#00BF63', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Readiness &amp; Activity Rings
          </div>
          <div style={{ marginTop: 2, fontSize: 15, fontWeight: 800 }}>
            {typeof initialVitals.recoveryPct === 'number'
              ? `Readiness ${Math.round(initialVitals.recoveryPct)}%`
              : preBiometrics.hrvMs != null && preBiometrics.restingHr != null
              ? `Readiness ${Math.min(100, Math.max(20, Math.round((preBiometrics.hrvMs / 75) * 65 + Math.max(0, 80 - preBiometrics.restingHr))))}%`
              : 'Readiness — (Sync wearable / sleep to compute)'}
          </div>
          <div style={{ marginTop: 2, fontSize: 11, opacity: 0.78 }}>
            Steps: {typeof initialVitals.steps === 'number' ? initialVitals.steps.toLocaleString() : '—'} · Sleep: {preBiometrics.sleepH ?? '—'} h · HRV: {preBiometrics.hrvMs ?? '—'} ms · VO₂max: {preBiometrics.vo2max ?? '—'}
          </div>
        </div>
      </div>

      {/* Modality Selector */}
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Select recovery modality">
        {HOLISTIC_RECOVERY_MODALITIES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => selectModality(m.id)}
            style={{
              minHeight: 40,
              padding: '0 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              border: modalityId === m.id ? '1px solid #00BF63' : '1px solid rgba(148,163,184,0.28)',
              background: modalityId === m.id ? 'rgba(0, 191, 99, 0.14)' : 'transparent',
              color: modalityId === m.id ? '#00BF63' : 'inherit',
              cursor: 'pointer',
            }}
          >
            {m.shortName}
          </button>
        ))}
      </div>

      {/* Active Modality Spec & AI Physiology Perspectives */}
      <div className="mt-4 rounded-2xl border border-black/10 p-4 dark:border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00BF63', letterSpacing: '0.06em' }}>{spec.badge}</div>
            <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800 }}>{spec.title}</h3>
          </div>
          <Badge tone={analysis.doseCheckStatus === 'within_reference_range' ? 'normal' : 'low'}>
            {spec.defaultDoseSummary}
          </Badge>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          {spec.physiologyMechanism}
        </p>

        {/* Role Perspective Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Physiology perspective">
          {(['athlete', 'coach', 'doctor', 'scientist'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={perspective === p}
              onClick={() => setPerspective(p)}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'capitalize',
                border: perspective === p ? '1px solid #00BF63' : '1px solid rgba(148,163,184,0.25)',
                background: perspective === p ? '#00BF63' : 'transparent',
                color: perspective === p ? '#04130b' : 'inherit',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {spec.perspectives[perspective]}
        </div>

        {/* Dose Parameters */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label={`${spec.referenceBounds.primaryLabel} (${spec.referenceBounds.primaryUnit})`}>
            <input
              type="number"
              step={modalityId === 'hbot' || modalityId === 'x_tone' ? '0.1' : '1'}
              className={inputClass}
              value={primaryVal}
              onChange={(e) => setPrimaryVal(Number(e.target.value))}
            />
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </Field>
          {spec.referenceBounds.secondaryLabel ? (
            <Field label={`${spec.referenceBounds.secondaryLabel} (${spec.referenceBounds.secondaryUnit})`}>
              <input
                type="number"
                step={modalityId === 'x_tone' ? '0.1' : '1'}
                className={inputClass}
                value={secondaryVal}
                onChange={(e) => setSecondaryVal(Number(e.target.value))}
              />
            </Field>
          ) : modalityId === 'x_cryo' ? (
            <Field label="Target Anatomical Site">
              <input className={inputClass} value={site} onChange={(e) => setSite(e.target.value)} />
            </Field>
          ) : null}
        </div>

        <div className="mt-2 text-xs font-bold" style={{ color: '#00BF63' }}>
          Computed Dose: {analysis.computedDoseLabel}
        </div>
        {analysis.warnings.map((w, i) => (
          <div key={i} className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            ⚠️ {w}
          </div>
        ))}

        {/* Pre / Post Biomarker Correlation */}
        <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span>Pre/Post Wearable &amp; Biomarker Correlation</span>
            <span className="text-[11px] font-normal text-neutral-500">
              Baseline: HRV {preBiometrics.hrvMs ?? '—'} ms · RHR {preBiometrics.restingHr ?? '—'} bpm · SpO₂ {preBiometrics.spo2Pct ?? '—'}%
              {latestWorkout ? ` · Run: ${latestWorkout.nama}` : ''}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <Field label="Pre Lactate (mmol/L)">
              <input className={inputClass} type="number" step="0.1" placeholder="opt." value={preLactate} onChange={(e) => setPreLactate(e.target.value)} />
            </Field>
            <Field label="Post HRV (ms)">
              <input className={inputClass} type="number" placeholder="opt." value={postHrv} onChange={(e) => setPostHrv(e.target.value)} />
            </Field>
            <Field label="Post RHR (bpm)">
              <input className={inputClass} type="number" placeholder="opt." value={postRhr} onChange={(e) => setPostRhr(e.target.value)} />
            </Field>
            <Field label="Post SpO₂ (%)">
              <input className={inputClass} type="number" placeholder="opt." value={postSpo2} onChange={(e) => setPostSpo2(e.target.value)} />
            </Field>
            <Field label="Post Lactate (mmol/L)">
              <input className={inputClass} type="number" step="0.1" placeholder="opt." value={postLactate} onChange={(e) => setPostLactate(e.target.value)} />
            </Field>
          </div>

          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{analysis.summary}</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Contraindications (clinician review required): {spec.contraindications.join(' · ')} · clinicians_reviewed=false
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={handleLogSession} data-testid="log-recovery-ledger-btn">
              <IconHeart size={15} /> Log Session to Biometric Ledger
            </Button>
            {savedNotice && <span className="text-xs font-bold text-brand-dark dark:text-brand">{savedNotice}</span>}
          </div>
        </div>
      </div>

      {/* Verified Visa/EMV Style Biometric Recovery Ledger */}
      {ledger.length > 0 && (
        <div className="mt-4 space-y-2" data-testid="recovery-biometric-ledger">
          <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
            Verified Biometric Recovery Ledger ({ledger.length})
          </div>
          {ledger.slice(0, 6).map((tx) => (
            <div key={tx.id} className="rounded-xl border border-black/10 p-3 text-xs dark:border-white/15">
              <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                <span>{tx.modalityName} · {tx.doseLabel}</span>
                <span style={{ fontFamily: 'monospace', color: '#00BF63' }}>
                  {tx.emvReceiptToken} {tx.luhnCheckValid ? '✓ LUHN' : ''}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">{tx.deltaSummary}</div>
              <div className="mt-1 text-[10px] text-neutral-400">
                {tx.at.slice(0, 16).replace('T', ' ')} · Draft/Unreviewed (`clinicallyReviewed: false`)
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
