import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { buildCockpitReadout, type CockpitInput, type Reading } from '../../domains/personal-health/engine/bodyCockpitReadout'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

const BODY_KEY = 'pm_bodycomp_v1'
const PROFILE_KEY = 'pmd_health_profile'

/** Positive numbers only; anything else stays undefined so the readout reports it as missing. */
const pos = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined)

/** The numbers the person typed into the body and profile forms, with no defaults filled in. */
function readEntered(): CockpitInput {
  const out: CockpitInput = {}
  try {
    const b = JSON.parse(localStorage.getItem(BODY_KEY) || 'null')
    if (b && typeof b === 'object') {
      Object.assign(out, { weightKg: pos(b.w), heightCm: pos(b.h), age: pos(b.age), waistCm: pos(b.waist), hipCm: pos(b.hip), neckCm: pos(b.neck) })
      if (b.g === 'M' || b.g === 'F') out.sex = b.g
      const w = pos(b.w), fat = pos(b.bfm)
      if (w && fat) out.bodyFatPct = (fat / w) * 100
    }
  } catch { /* unreadable storage is the same as nothing entered */ }
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
    if (p && typeof p === 'object') {
      for (const [k, v] of Object.entries({ weightKg: pos(p.weightKg), heightCm: pos(p.heightCm), age: pos(p.age), bodyFatPct: pos(p.bodyFatPct) })) if (v !== undefined) (out as Record<string, number>)[k] = v
      if (p.sex === 'M' || p.sex === 'F') out.sex = p.sex
    }
  } catch { /* same */ }
  return out
}

function Tile({ label, reading, unit, digits = 0, hint }: { label: string; reading: Reading | null; unit?: string; digits?: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-3.5" data-tile={label} data-state={reading ? reading.basis : 'missing'}>
      <span className="text-[10px] font-black uppercase tracking-wider text-white/45">{label}</span>
      {reading ? (
        <>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tabular-nums">{reading.value.toFixed(digits)}</span>
            {unit && <span className="text-xs font-bold text-white/50">{unit}</span>}
          </div>
          <span className="mt-1 block text-[11px] text-white/55">{reading.basis === 'derived' ? `Calculated: ${reading.source}` : 'Recorded'}</span>
        </>
      ) : (
        <>
          <div className="mt-1 text-2xl font-black text-white/30"><span aria-hidden="true">—</span><span className="sr-only">not recorded</span></div>
          <span className="mt-1 block text-[11px] text-white/55">{hint}</span>
        </>
      )}
    </div>
  )
}

// One compact summary of the person's own body numbers. It shows only what was recorded or can be calculated from
// recorded inputs; everything else is "—" with what would unlock it. No defaults, no scores without a validated source.
export function UniversalCompactBodyCockpit() {
  const { account, activePatient } = useStore()
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => setRev((c) => c + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('storage', bump)
    return () => { window.removeEventListener('panacea:health-updated', bump); window.removeEventListener('storage', bump) }
  }, [])

  const readout = useMemo(() => {
    void rev
    const vitals = readUnifiedLocalVitals(account, { patient: activePatient })
    const entered = readEntered()
    return buildCockpitReadout({
      ...entered,
      weightKg: vitals.weightKg ?? entered.weightKg, heightCm: vitals.heightCm ?? entered.heightCm,
      bodyFatPct: vitals.bodyFatPct ?? entered.bodyFatPct,
      systolic: vitals.systolic, diastolic: vitals.diastolic, restingHr: vitals.restingHr ?? vitals.heartRate,
      hrvMs: vitals.hrvMs, spo2Pct: vitals.spo2Pct, vo2max: vitals.vo2max, sleepH: vitals.sleepH,
    })
  }, [account, activePatient, rev])

  const r = readout
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

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile label="Weight" reading={r.weight} unit="kg" digits={1} hint="Add weight" />
        <Tile label="BMI" reading={r.bmi} digits={1} hint="Needs weight and height" />
        <Tile label="Body fat" reading={r.bodyFatPct} unit="%" digits={1} hint="Enter it, or add waist and neck" />
        <Tile label="Resting energy" reading={r.bmr} unit="kcal" hint="Needs age and sex" />
        <Tile label="Resting heart rate" reading={r.restingHr} unit="bpm" hint="Record a pulse" />
        <Tile label="HRV" reading={r.hrvMs} unit="ms" hint="From a wearable" />
        <Tile label="Blood oxygen" reading={r.spo2Pct} unit="%" hint="Record SpO₂" />
        <Tile label="Sleep" reading={r.sleepH} unit="h" digits={1} hint="Log a night" />
        <Tile label="Waist ÷ height" reading={r.waistToHeight} digits={2} hint="Needs waist and height" />
        <Tile label="Waist ÷ hip" reading={r.waistToHip} digits={2} hint="Needs waist and hip" />
        <Tile label="Mean arterial pressure" reading={r.meanArterialPressure} unit="mmHg" hint="Needs both pressures" />
        <Tile label="VO₂max" reading={r.vo2max} digits={1} hint="From a wearable or test" />
      </div>

      {r.bloodPressure && (
        <p className="mt-2 text-[12px] text-white/70">Blood pressure recorded: <b className="tabular-nums">{r.bloodPressure.systolic}/{r.bloodPressure.diastolic}</b> mmHg</p>
      )}
      {r.missing.length > 0 && (
        <p className="mt-3 text-[12px] leading-snug text-white/60">
          To fill the gaps: {r.missing.join('; ')}.{' '}
          <Link to="/fitness-hub?view=body" className="font-bold text-emerald-300 hover:text-white">Enter measurements →</Link>
        </p>
      )}

      <details className="mt-3 rounded-xl border border-white/10 px-3 py-2">
        <summary className="min-h-[36px] cursor-pointer text-[12px] font-bold text-white/75">Hand off to care (draft, not reviewed by a clinician)</summary>
        <div className="mt-2 flex flex-wrap gap-x-5">
          <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center text-xs font-bold text-emerald-300 hover:text-white">Clinical Hub →</Link>
          <Link to="/visit-os" className="inline-flex min-h-[44px] items-center text-xs font-bold text-cyan-300 hover:text-white">Visit OS →</Link>
          <Link to="/health-data" className="inline-flex min-h-[44px] items-center text-xs font-bold text-amber-300 hover:text-white">Health data &amp; sync →</Link>
        </div>
      </details>

      <div className="mt-3 border-t border-white/10 pt-3 text-[11px] text-white/45">
        <BatasKlaimKesehatan permukaan="longevity.body-composition" />
      </div>
    </details>
  )
}
