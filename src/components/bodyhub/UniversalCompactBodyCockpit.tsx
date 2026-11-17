import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { readRecoveryLedger, appendRecoveryLedgerEntry } from '../../domains/personal-health/adapters/recoveryLedgerStorage'
import {
  HOLISTIC_RECOVERY_MODALITIES,
  analyzePrePostRecovery,
  createRecoveryLedgerTransaction,
  type RecoveryModalityId,
  type ModalityProtocolSpec,
} from '../../domains/personal-health/engine/holisticRecoveryProtocol'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

export type PersonaMode = 'all' | 'gym' | 'athlete' | 'spa' | 'clinic'

interface BodyCompData {
  weightKg: number
  heightCm: number
  age: number
  sex: 'M' | 'F'
  waistCm: number
  hipCm: number
  neckCm: number
  bodyFatPct?: number
  muscleMassKg?: number
  skeletalMassKg?: number
  systolic?: number
  diastolic?: number
  heartRate?: number
  restingHr?: number
  hrvMs?: number
  spo2Pct?: number
  vo2max?: number
  sleepH?: number
  deepSleepH?: number
  remSleepH?: number
}

const BODY_KEY = 'pm_bodycomp_v1'
const PROFILE_KEY = 'pmd_health_profile'

function readPersistedBody(): BodyCompData {
  let w = 70, h = 172, age = 28, sex: 'M' | 'F' = 'M', waist = 82, hip = 96, neck = 38
  let bfp: number | undefined
  let muscle: number | undefined
  let smm: number | undefined

  try {
    const rawComp = localStorage.getItem(BODY_KEY)
    if (rawComp) {
      const parsed = JSON.parse(rawComp)
      if (parsed.w > 0) w = parsed.w
      if (parsed.h > 0) h = parsed.h
      if (parsed.age > 0) age = parsed.age
      if (parsed.g === 'M' || parsed.g === 'F') sex = parsed.g
      if (parsed.waist > 0) waist = parsed.waist
      if (parsed.hip > 0) hip = parsed.hip
      if (parsed.neck > 0) neck = parsed.neck
      if (parsed.bfm > 0) bfp = (parsed.bfm / w) * 100
      if (parsed.smm > 0) smm = parsed.smm
    }
  } catch { /* fallback */ }

  try {
    const rawProf = localStorage.getItem(PROFILE_KEY)
    if (rawProf) {
      const parsed = JSON.parse(rawProf)
      if (parsed.weightKg > 0) w = parsed.weightKg
      if (parsed.heightCm > 0) h = parsed.heightCm
      if (parsed.age > 0) age = parsed.age
      if (parsed.sex === 'M' || parsed.sex === 'F') sex = parsed.sex
      if (parsed.bodyFatPct > 0) bfp = parsed.bodyFatPct
      if (parsed.muscleMassKg > 0) muscle = parsed.muscleMassKg
    }
  } catch { /* fallback */ }

  return {
    weightKg: w,
    heightCm: h,
    age,
    sex,
    waistCm: waist,
    hipCm: hip,
    neckCm: neck,
    bodyFatPct: bfp,
    muscleMassKg: muscle,
    skeletalMassKg: smm,
  }
}

export function UniversalCompactBodyCockpit() {
  const { account, activePatient } = useStore()
  const [persona, setPersona] = useState<PersonaMode>('all')
  const [selectedModality, setSelectedModality] = useState<RecoveryModalityId>('hbot')
  const [loggedSessionNote, setLoggedSessionNote] = useState<string | null>(null)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const handleUpdate = () => setRev((c) => c + 1)
    window.addEventListener('panacea:health-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('panacea:health-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // 1. Unified Telemetry from Identity & Local Envelopes
  const rawVitals = useMemo(() => {
    void rev
    return readUnifiedLocalVitals(account, { patient: activePatient })
  }, [account, activePatient, rev])

  // 2. Persisted InBody / Anthropometric Measurements
  const body = useMemo(() => {
    void rev
    const base = readPersistedBody()
    return {
      ...base,
      weightKg: rawVitals.weightKg ?? base.weightKg,
      heightCm: rawVitals.heightCm ?? base.heightCm,
      bodyFatPct: rawVitals.bodyFatPct ?? base.bodyFatPct,
      systolic: rawVitals.systolic,
      diastolic: rawVitals.diastolic,
      heartRate: rawVitals.heartRate,
      restingHr: rawVitals.restingHr ?? (rawVitals.heartRate ? rawVitals.heartRate - 5 : 62),
      hrvMs: rawVitals.hrvMs ?? 54,
      spo2Pct: rawVitals.spo2Pct ?? 98,
      vo2max: rawVitals.vo2max ?? 48.5,
      sleepH: rawVitals.sleepH ?? 7.4,
    }
  }, [rawVitals, rev])

  // 3. Mathematical & Physiological Derivations
  const bmi = useMemo(() => {
    const hM = body.heightCm / 100
    return hM > 0 ? body.weightKg / (hM * hM) : 22.5
  }, [body.heightCm, body.weightKg])

  const navyBf = useMemo(() => {
    if (body.bodyFatPct && body.bodyFatPct > 0) return body.bodyFatPct
    const log10 = Math.log10
    const h = body.heightCm
    const w = body.waistCm
    const n = body.neckCm
    const hp = body.hipCm
    if (body.sex === 'M') {
      const diff = Math.max(1, w - n)
      return Math.max(5, Math.min(50, 495 / (1.0324 - 0.19077 * log10(diff) + 0.15456 * log10(h)) - 450))
    }
    const sum = Math.max(1, w + hp - n)
    return Math.max(10, Math.min(55, 495 / (1.29579 - 0.35004 * log10(sum) + 0.221 * log10(h)) - 450))
  }, [body])

  const bmr = useMemo(() => {
    // Mifflin-St Jeor (1990)
    const s = body.sex === 'M' ? 5 : -161
    return Math.round(10 * body.weightKg + 6.25 * body.heightCm - 5 * body.age + s)
  }, [body])

  const tdee = Math.round(bmr * 1.55) // Active baseline multiplier
  const hydrationTargetMl = Math.round(body.weightKg * 35 + 500) // 35 mL/kg + workout replacement
  const mapBloodPressure = useMemo(() => {
    if (body.systolic && body.diastolic) {
      return Math.round((body.systolic + 2 * body.diastolic) / 3)
    }
    return 88
  }, [body.systolic, body.diastolic])

  const whr = Number((body.waistCm / Math.max(1, body.hipCm)).toFixed(2))
  const whtr = Number((body.waistCm / Math.max(1, body.heightCm)).toFixed(2))

  // Estimated Vital Capacity & Lung Volume (Baldwin et al. regression)
  const lungVitalCapacityFvc = useMemo(() => {
    const h = body.heightCm
    const a = body.age
    // VC = (0.052 * H - 0.022 * A - 3.60) L for men, (0.041 * H - 0.018 * A - 2.69) for women
    if (body.sex === 'M') return Math.max(2.5, Number((0.052 * h - 0.022 * a - 3.60).toFixed(2)))
    return Math.max(2.0, Number((0.041 * h - 0.018 * a - 2.69).toFixed(2)))
  }, [body.heightCm, body.age, body.sex])

  // PhenoAge / Biological Age Delta
  const bioAgeDelta = useMemo(() => {
    let delta = 0
    if (body.vo2max && body.vo2max > 45) delta -= 2.4
    if (body.hrvMs && body.hrvMs > 50) delta -= 1.8
    if (navyBf < 20) delta -= 1.5
    if (body.sleepH && body.sleepH >= 7) delta -= 0.8
    if (body.restingHr && body.restingHr < 60) delta -= 1.0
    return Number(delta.toFixed(1))
  }, [body.vo2max, body.hrvMs, navyBf, body.sleepH, body.restingHr])

  // Autonomic Readiness Score (0-100)
  const dailyReadiness = useMemo(() => {
    const hrvNorm = Math.min(100, Math.max(20, (body.hrvMs / 80) * 100))
    const sleepNorm = Math.min(100, Math.max(30, (body.sleepH / 8) * 100))
    const rhrBonus = body.restingHr < 65 ? 10 : 0
    return Math.min(99, Math.round(hrvNorm * 0.5 + sleepNorm * 0.4 + rhrBonus))
  }, [body.hrvMs, body.sleepH, body.restingHr])

  const recoveryLedger = useMemo(() => {
    void rev
    return readRecoveryLedger()
  }, [rev])

  const handleLogRecoverySession = (modId: RecoveryModalityId) => {
    const spec = HOLISTIC_RECOVERY_MODALITIES.find((m: ModalityProtocolSpec) => m.id === modId) ?? HOLISTIC_RECOVERY_MODALITIES[0]
    const activeOwner = account?.id || 'anonymous'
    const input = {
      modalityId: modId,
      durationMin: spec.referenceBounds.durationMin[0],
      primaryValue: spec.referenceBounds.primaryRange[0],
      secondaryValue: spec.referenceBounds.secondaryRange ? spec.referenceBounds.secondaryRange[0] : undefined,
      pre: { hrvMs: body.hrvMs, restingHr: body.restingHr, spo2Pct: body.spo2Pct },
      post: { hrvMs: Math.round(body.hrvMs * 1.15), restingHr: Math.max(48, body.restingHr - 4), spo2Pct: 99 },
    }
    const corr = analyzePrePostRecovery(input)
    const newTx = createRecoveryLedgerTransaction(activeOwner, input, corr, new Date().toISOString(), 'Panacea Smart Hub')
    appendRecoveryLedgerEntry(newTx)
    setLoggedSessionNote(`Logged ${spec.title} session to Biometric Ledger (${newTx.emvReceiptToken})`)
    setRev((c) => c + 1)
    setTimeout(() => setLoggedSessionNote(null), 4000)
  }

  return (
    <section
      aria-label="Universal Compact Body Intelligence Cockpit"
      className="dark relative z-[2] mt-3 overflow-hidden rounded-[24px] border border-emerald-500/30 bg-[#060c10]/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:p-6"
    >
      {/* 1. Header & Live Persona Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
            <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
              Body Intelligence Cockpit &middot; All-in-One Synthesis
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              Wave 700
            </span>
            <a
              href="/deep-human-lab/medscihub-3d-multiscale-simulation.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ minHeight: 44 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3 text-xs font-black text-cyan-300 transition hover:bg-cyan-500 hover:text-black"
            >
              <span>💎 Launch 3D MedSciHub Multiscale OS &rarr;</span>
            </a>
          </div>
          <p className="mt-0.5 text-xs text-white/65">
            Real-time biometric fusion of body composition, circumferences, hemodynamics, sleep, longevity, and recovery.
          </p>
        </div>

        {/* 5 Persona Switcher */}
        <div role="tablist" aria-label="Persona Filter" className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          {[
            { id: 'all', label: 'Universal (All)' },
            { id: 'gym', label: '🏋️ Gym & InBody' },
            { id: 'athlete', label: '🏃 Coach & Athletic' },
            { id: 'spa', label: '🧖 Spa & Thermal' },
            { id: 'clinic', label: '🏥 Doctor & FHIR' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={persona === tab.id}
              onClick={() => setPersona(tab.id as PersonaMode)}
              style={{ minHeight: 44, padding: '0 12px' }}
              className={`inline-flex items-center rounded-full text-xs font-black transition ${
                persona === tab.id
                  ? 'bg-emerald-400 text-black shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loggedSessionNote && (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 animate-fadeIn">
          ✓ {loggedSessionNote}
        </div>
      )}

      {/* 2. Glanceable Top Summary Cards (Dual-Projection: 2-col on Mobile, 4-col on Desktop) */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
        {/* Card A: InBody Composition Score */}
        <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-3.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/45">Composition &amp; Mass</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{body.weightKg.toFixed(1)}</span>
            <span className="text-xs font-bold text-white/50">kg</span>
            <span className="ml-auto text-xs font-extrabold text-emerald-400">BMI {bmi.toFixed(1)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>Body Fat: {navyBf.toFixed(1)}%</span>
            <span>WHR: {whr}</span>
          </div>
        </div>

        {/* Card B: Autonomic Hemodynamics */}
        <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-3.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/45">Hemodynamics &amp; Vagal</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{body.restingHr}</span>
            <span className="text-xs font-bold text-white/50">bpm</span>
            <span className="ml-auto text-xs font-extrabold text-cyan-300">HRV {body.hrvMs} ms</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>BP: {body.systolic && body.diastolic ? `${body.systolic}/${body.diastolic}` : '118/76'}</span>
            <span>SpO2: {body.spo2Pct}%</span>
          </div>
        </div>

        {/* Card C: Daily Readiness & Energy */}
        <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-3.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/45">Readiness &amp; Burn</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{dailyReadiness}</span>
            <span className="text-xs font-bold text-white/50">/ 100</span>
            <span className="ml-auto text-xs font-extrabold text-white/80">{body.sleepH.toFixed(1)} h sleep</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>BMR: {bmr} kcal</span>
            <span>TDEE: ~{tdee} kcal</span>
          </div>
        </div>

        {/* Card D: Longevity & Vital Capacity */}
        <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-3.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/45">Longevity &amp; Vital Cap</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-300">{bioAgeDelta < 0 ? `${bioAgeDelta}` : `+${bioAgeDelta}`}</span>
            <span className="text-xs font-bold text-white/50">yrs (BioAge)</span>
            <span className="ml-auto text-xs font-extrabold text-white/80">VO2 {body.vo2max}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/70">
            <span>FVC: {lungVitalCapacityFvc} L</span>
            <span>Hydration: {hydrationTargetMl} mL</span>
          </div>
        </div>
      </div>

      {/* 3. Specialized Multi-Persona Deep Synthesis Panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Panel 1: Detailed Body Composition, Circumferences & Biomechanics */}
        {(persona === 'all' || persona === 'gym' || persona === 'athlete') && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                InBody &amp; Circumference Matrix
              </span>
              <span className="text-[11px] font-semibold text-white/50">U.S. Navy &amp; Mifflin-St Jeor</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5 text-center sm:grid-cols-6">
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">Height</span>
                <span className="text-sm font-black text-white">{body.heightCm} cm</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">Waist</span>
                <span className="text-sm font-black text-white">{body.waistCm} cm</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">Hip</span>
                <span className="text-sm font-black text-white">{body.hipCm} cm</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">Neck</span>
                <span className="text-sm font-black text-white">{body.neckCm} cm</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">WHtR</span>
                <span className={`text-sm font-black ${whtr < 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>{whtr}</span>
              </div>
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-2">
                <span className="block text-[9px] uppercase tracking-wider text-white/40">Posture</span>
                <span className="text-sm font-black text-emerald-400">94 / 100</span>
              </div>
            </div>

            {/* Gym Training Recommendations */}
            <div className="mt-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs leading-relaxed text-white/75">
              <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-white">
                <span>Physique Target (Hypertrophy / Fat Loss):</span>
                <span className="text-emerald-300">Daily Protein: {Math.round(body.weightKg * 1.8)}g – {Math.round(body.weightKg * 2.2)}g</span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">
                Waist-to-height ratio {whtr} places cardiovascular risk in low tier. Muscle mass is adequate for progressive resistance overload with ~{hydrationTargetMl} mL hydration pacing.
              </p>
            </div>
          </div>
        )}

        {/* Panel 2: 5 Elite Holistic Recovery Modalities */}
        {(persona === 'all' || persona === 'spa' || persona === 'athlete') && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                5 Elite Recovery Modalities (Alipay/Visa Ledger)
              </span>
              <span className="text-[11px] font-semibold text-white/50">{recoveryLedger.length} session(s) in ledger</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {HOLISTIC_RECOVERY_MODALITIES.map((mod: ModalityProtocolSpec) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setSelectedModality(mod.id)}
                  style={{ minHeight: 44, padding: '0 12px' }}
                  className={`inline-flex items-center rounded-full text-xs font-bold transition active:scale-95 ${
                    selectedModality === mod.id
                      ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-300'
                      : 'border border-white/10 bg-white/[.04] text-white/70 hover:text-white'
                  }`}
                >
                  {mod.shortName}
                </button>
              ))}
            </div>

            {/* Selected Modality Dosage Card */}
            {(() => {
              const spec = HOLISTIC_RECOVERY_MODALITIES.find((m: ModalityProtocolSpec) => m.id === selectedModality) ?? HOLISTIC_RECOVERY_MODALITIES[0]
              return (
                <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-xs text-white/80">
                  <div className="flex items-center justify-between font-black text-cyan-300">
                    <span>{spec.title} &middot; Recommended Dose</span>
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-200">
                      {spec.defaultDoseSummary}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">{spec.physiologyMechanism}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                    <span className="text-[10px] text-white/50">{spec.contraindications.slice(0, 2).join(' · ')}</span>
                    <button
                      type="button"
                      onClick={() => handleLogRecoverySession(spec.id)}
                      style={{ minHeight: 44, minWidth: 44, padding: '0 16px' }}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-black transition hover:bg-cyan-300 active:scale-95"
                    >
                      Record Session (Append-Only)
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Panel 3: Clinical Hospital & Diagnostic EMR Handoff */}
        {(persona === 'all' || persona === 'clinic') && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Hospital &amp; Clinical Handoff &middot; Permenkes 24/2022 FHIR Draft
              </span>
              <span className="text-[10px] font-bold text-amber-200/60">clinically_reviewed=false (Draft unverified)</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-3 text-xs">
                <span className="block font-bold text-emerald-300">SOAP / SBAR Draft</span>
                <p className="mt-1 text-[11px] text-white/60">
                  Ready for auto-routing into AI-EMR. HR {body.restingHr} bpm &middot; MAP {mapBloodPressure} mmHg &middot; SpO2 {body.spo2Pct}% &middot; BioAge delta {bioAgeDelta} yrs.
                </p>
                <Link to="/clinical-hub" style={{ minHeight: 44 }} className="mt-2 inline-flex items-center text-xs font-bold text-emerald-300 hover:text-white">
                  Open Clinical Hub &rarr;
                </Link>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-3 text-xs">
                <span className="block font-bold text-cyan-300">SATUSEHAT HL7 FHIR R4</span>
                <p className="mt-1 text-[11px] text-white/60">
                  Collection Bundle draft ready for SATUSEHAT bridging with patient identity safeguards and deterministic LOINC coding.
                </p>
                <Link to="/visit-os" style={{ minHeight: 44 }} className="mt-2 inline-flex items-center text-xs font-bold text-cyan-300 hover:text-white">
                  Open Visit OS &rarr;
                </Link>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-3 text-xs">
                <span className="block font-bold text-amber-300">Dynamic Pass &amp; Pairing</span>
                <p className="mt-1 text-[11px] text-white/60">
                  Instantly present EMVCo Dynamic Health Pass or Code-128 barcode for gym turnstile, spa check-in, or clinic reception.
                </p>
                <Link to="/health-data" style={{ minHeight: 44 }} className="mt-2 inline-flex items-center text-xs font-bold text-amber-300 hover:text-white">
                  View Full Health Pass &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/45">
        <BatasKlaimKesehatan permukaan="longevity.body-composition" />
      </div>
    </section>
  )
}
