import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalStore } from '../lib/store'
import { readUnifiedLocalVitals } from '../domains/identity/localRecovery'
import {
  buildNeonOutboxEvent,
  evaluateGtaCharacterPersonification,
  evaluateLongeviumCounterfactual,
  type LongeviumInterventionId,
  type TurntablePreset,
  type ZAnatomyLayerKey,
} from '../domains/character/index.ts'

const NEON_OUTBOX_KEY = 'pmd_neon_sync_outbox_v1'

const TURNTABLE_PRESETS: readonly { id: TurntablePreset; label: string }[] = [
  { id: 'anterior', label: '0° Front' },
  { id: 'lateral_left', label: '90° Left' },
  { id: 'posterior', label: '180° Back' },
  { id: 'lateral_right', label: '270° Right' },
  { id: 'superior', label: 'Top' },
]

const LAYER_OPTIONS: readonly { id: ZAnatomyLayerKey; label: string }[] = [
  { id: 'integument', label: 'Skin' },
  { id: 'muscular', label: 'Muscle' },
  { id: 'skeletal', label: 'Skeleton' },
  { id: 'vascular', label: 'Vessels' },
  { id: 'nervous', label: 'Nerves' },
  { id: 'visceral', label: 'Organs' },
  { id: 'lymphatic', label: 'Lymph' },
]

const INTERVENTIONS: readonly { id: LongeviumInterventionId; label: string }[] = [
  { id: 'weight_recomp', label: '-10 kg Body Recomposition' },
  { id: 'sleep_lock', label: '8h Circadian Sleep Lock' },
  { id: 'zone2_resistance', label: 'Zone-2 + Resistance Protocol' },
  { id: 'anti_inflammatory', label: 'Anti-Inflammatory Nutrition' },
]

function CoreRing({ label, value, color }: { readonly label: string; readonly value: number; readonly color: string }) {
  const r = 24
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/10 bg-black/35 p-2.5">
      <svg viewBox="0 0 64 64" className="h-14 w-14" role="img" aria-label={`${label} core ${value} of 100`}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="36" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="monospace">{value}</text>
      </svg>
      <span className="font-astro mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">{label}</span>
    </div>
  )
}

export function GtaCharacterPersonaCard() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null

  const vitals = useMemo(
    () => readUnifiedLocalVitals(account, { patient }),
    [account, patient],
  )

  const [twinMode, setTwinMode] = useState<'health' | 'research'>('health')
  const [heightCm, setHeightCm] = useState<number>(() => vitals.heightCm ?? 173)
  const [weightKg, setWeightKg] = useState<number>(() => vitals.weightKg ?? 68)
  const [bodyFatPct, setBodyFatPct] = useState<number>(() => vitals.bodyFatPct ?? 16)
  const [posture01, setPosture01] = useState<number>(0.78)
  const [turntable, setTurntable] = useState<TurntablePreset>('anterior')
  const [layers, setLayers] = useState<ZAnatomyLayerKey[]>(['integument', 'muscular', 'skeletal', 'vascular'])
  const [selectedInterventions, setSelectedInterventions] = useState<LongeviumInterventionId[]>(['sleep_lock', 'zone2_resistance'])
  const [queuedNotice, setQueuedNotice] = useState('')

  const profileKey = account?.email ? account.email.split('@')[0] : 'rizkyazhar486'
  const mrn = patient?.mrn || 'PMD-000486'

  const persona = useMemo(
    () =>
      evaluateGtaCharacterPersonification({
        profileKey,
        mrn,
        heightCm,
        weightKg,
        bodyFatPct,
        restingHrBpm: vitals.restingHr ?? vitals.heartRate,
        hrvMs: vitals.hrvMs,
        vo2max: vitals.vo2max,
        sleepHours: vitals.sleepH,
        posturalAlignment01: posture01,
        turntablePreset: turntable,
        activeLayers: layers,
      }),
    [profileKey, mrn, heightCm, weightKg, bodyFatPct, vitals, posture01, turntable, layers],
  )

  const counterfactual = useMemo(
    () =>
      evaluateLongeviumCounterfactual({
        chronologicalAgeYears: 32,
        biologicalAgeYears: 33.4,
        cardiovascularRiskPct: 6.2,
        metabolicRiskPct: 9.8,
        hsCrpMgL: 1.45,
        interventions: selectedInterventions,
      }),
    [selectedInterventions],
  )

  const toggleLayer = (id: ZAnatomyLayerKey) => {
    setLayers((cur) => (cur.includes(id) ? (cur.length > 1 ? cur.filter((x) => x !== id) : cur) : [...cur, id]))
  }

  const toggleIntervention = (id: LongeviumInterventionId) => {
    setSelectedInterventions((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const queueSnapshotToNeon = () => {
    if (!persona.ok) return
    try {
      const ev = buildNeonOutboxEvent({
        profileKey,
        entityType: 'panacea_gta_character_state',
        payload: {
          codename: persona.codename,
          cores: persona.cores,
          morph: persona.morph,
          twinMode,
          truthClass: persona.truthClass,
        },
        createdAtIso: new Date().toISOString(),
      })
      const existing = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
      const next = Array.isArray(existing) ? [ev, ...existing].slice(0, 40) : [ev]
      localStorage.setItem(NEON_OUTBOX_KEY, JSON.stringify(next))
      setQueuedNotice(`Queued ${ev.eventId} in Local-First Neon Outbox (${next.length} pending).`)
    } catch {
      setQueuedNotice('Snapshot prepared (local storage unavailable in this context).')
    }
  }

  if (!persona.ok) return null

  return (
    <section
      aria-label="GTA 6 Character Personification & Longevium Digital Twin"
      className="astro-surface astro-horizon-grid space-y-4 rounded-2xl p-4 text-white sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            1:1 CHARACTER HUD · LONGEVIUM DIGITAL TWIN
          </div>
          <h3 className="font-astro mt-0.5 text-base font-extrabold text-white">
            {persona.codename} · Readiness {persona.cores.readinessScore}/100
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-astro-mono rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-200">
            {persona.truthClass} · clinically_reviewed=false
          </span>
          <Link
            to="/body-exposure"
            className="astro-chip inline-flex min-h-[44px] items-center rounded-xl px-3 text-[11px] font-bold no-underline"
          >
            Open 3D →
          </Link>
        </div>
      </div>

      {/* GTA 6 Core Rings + Needs */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        <CoreRing label="Health" value={persona.cores.healthCore} color="#10b981" />
        <CoreRing label="Stamina" value={persona.cores.staminaCore} color="#22d3ee" />
        <CoreRing label="Focus" value={persona.cores.focusCore} color="#c6ff34" />
        <div className="col-span-3 flex flex-col justify-between rounded-xl border border-white/10 bg-black/35 p-3 text-[11px] sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Recovery Reserve</span>
            <span className="font-astro-mono font-bold text-emerald-300">{persona.cores.recoveryReserve}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${persona.cores.recoveryReserve}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-300">
            <span>Overdrive: <b className="font-astro-mono text-amber-300">{persona.cores.overdriveRisk}%</b></span>
            <span>Sleep Debt: <b className="font-astro-mono">{persona.needs.sleepDebtHours}h</b></span>
            <span>Hydration: <b className="font-astro-mono">{persona.needs.hydrationStatus}</b></span>
          </div>
        </div>
      </div>

      {/* Longevium 2-Mode Digital Twin Segmented Switcher */}
      <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5" role="tablist" aria-label="Digital Twin Mode">
            {([
              { id: 'health', label: '1. Health Twin' },
              { id: 'research', label: '2. Research Twin' },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={twinMode === m.id}
                onClick={() => setTwinMode(m.id)}
                className={`min-h-[44px] rounded-xl border px-3 text-[11px] font-bold transition ${
                  twinMode === m.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                    : 'border-white/15 bg-white/[0.03] text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <span className="font-astro-mono text-[10px] text-cyan-200">
            Baseline → Repeat Check-Up → Clinician Plan
          </span>
        </div>

        {twinMode === 'health' ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[11px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">BIOLOGICAL AGE</div>
              <div className="font-astro-mono mt-1 text-base font-bold text-white">Simulated Model</div>
              <div className="text-slate-300">Enter lab panel for Levine PhenoAge</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">WEARABLE VITALS</div>
              <div className="font-astro-mono mt-1 text-sm font-bold text-emerald-300">
                HR {vitals.restingHr ?? vitals.heartRate ?? '—'} · HRV {vitals.hrvMs ?? '—'} · VO₂ {vitals.vo2max ?? '—'}
              </div>
              <div className="text-slate-300">Live from synced device / log</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">PARAMETRIC MORPH</div>
              <div className="font-astro-mono mt-1 text-sm font-bold text-white">
                {persona.morph.heightCm}cm · {persona.morph.weightKg}kg · Lean {persona.morph.leanMassPct}%
              </div>
              <div className="text-slate-300">Ratio {persona.morph.shoulderToWaistRatio} · View {persona.morph.turntablePreset}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">PHYSICIAN PLAN (DRAFT)</div>
              <div className="mt-1 text-slate-200">1) 7.5–8.5h sleep lock · 2) Zone-2 + strength · 3) Annual clinician lab review</div>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-[11px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">CPIC PHARMACOGENOMICS</div>
              <p className="mt-1 text-slate-300">Gene-drug safety lookup &amp; metabolizer education via Genome Lab (never autonomous prescribing).</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">MITOCHONDRIAL BIOENERGETICS</div>
              <p className="mt-1 text-slate-300">Coupled OXPHOS ATP flux &amp; Krogh capillary O₂ diffusion scaffold (`truthClass: simulated`).</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="font-astro text-[10px] text-cyan-300">SIMULATED ORGAN-ON-CHIP</div>
              <p className="mt-1 text-slate-300">Counterfactual tissue response explorer — research &amp; educational reference only.</p>
            </div>
          </div>
        )}
      </div>

      {/* Can We Predict Your Future Health? Counterfactual Table */}
      {counterfactual.ok && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="font-astro text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
            Can We Predict Your Future Health? (Now vs. After Changes [Simulated])
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INTERVENTIONS.map((item) => {
              const active = selectedInterventions.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleIntervention(item.id)}
                  className={`min-h-[44px] rounded-xl border px-2.5 text-[11px] font-bold transition ${
                    active ? 'border-emerald-400 bg-emerald-500/20 text-white' : 'border-white/15 bg-white/[0.03] text-slate-300'
                  }`}
                >
                  {active ? '✓ ' : '+ '}{item.label}
                </button>
              )
            })}
          </div>
          <div className="mt-2.5 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-white/15 text-[10px] uppercase text-slate-300">
                <tr>
                  <th className="py-1.5 pr-2">Marker</th>
                  <th className="py-1.5 px-2">Now</th>
                  <th className="py-1.5 pl-2 text-emerald-300">After Changes [Simulated]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {counterfactual.rows.map((row) => (
                  <tr key={row.marker}>
                    <td className="py-1.5 pr-2 text-slate-200">{row.marker}</td>
                    <td className="font-astro-mono py-1.5 px-2 text-slate-300">{row.nowValue} {row.unit}</td>
                    <td className="font-astro-mono py-1.5 pl-2 font-bold text-emerald-300">
                      {row.afterValue} {row.unit} ({row.delta >= 0 ? `+${row.delta}` : row.delta})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1:1 Parametric Morph Sliders + 360° Turntable + Z-Anatomy Layer Mask */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px]">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">1:1 Body Morph Calibration</div>
          <label className="block text-slate-200">
            Height: <span className="font-astro-mono text-emerald-300">{heightCm} cm</span>
            <input type="range" min={140} max={210} step={1} value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="mt-1 h-9 w-full accent-emerald-400" />
          </label>
          <label className="block text-slate-200">
            Weight: <span className="font-astro-mono text-emerald-300">{weightKg} kg</span>
            <input type="range" min={40} max={140} step={1} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="mt-1 h-9 w-full accent-emerald-400" />
          </label>
          <label className="block text-slate-200">
            Body Fat: <span className="font-astro-mono text-emerald-300">{bodyFatPct}%</span> · Posture: <span className="font-astro-mono text-cyan-300">{Math.round(posture01 * 100)}%</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input type="range" min={6} max={45} step={1} value={bodyFatPct} onChange={(e) => setBodyFatPct(Number(e.target.value))} aria-label="Body fat percent" className="h-9 w-full accent-emerald-400" />
              <input type="range" min={0} max={100} step={2} value={Math.round(posture01 * 100)} onChange={(e) => setPosture01(Number(e.target.value) / 100)} aria-label="Posture alignment percent" className="h-9 w-full accent-cyan-400" />
            </div>
          </label>
        </div>

        <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px]">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">360° Turntable &amp; Z-Anatomy Layers</div>
          <div className="flex flex-wrap gap-1.5">
            {TURNTABLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={turntable === p.id}
                onClick={() => setTurntable(p.id)}
                className={`min-h-[44px] rounded-xl border px-2.5 text-[10px] font-bold ${
                  turntable === p.id ? 'border-cyan-400 bg-cyan-500/20 text-white' : 'border-white/15 bg-white/[0.03] text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LAYER_OPTIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={layers.includes(l.id)}
                onClick={() => toggleLayer(l.id)}
                className={`min-h-[44px] rounded-xl border px-2.5 text-[10px] font-bold ${
                  layers.includes(l.id) ? 'border-emerald-400 bg-emerald-500/20 text-white' : 'border-white/15 bg-white/[0.03] text-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* One-Scan QR & Barcode Health Pass + Neon Outbox Queue */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-black/40 p-3">
        <div className="min-w-0">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            One-Scan Pass Token · Non-PHI Check-In
          </div>
          <div className="font-astro-mono mt-0.5 truncate text-[11px] text-white">{persona.qrPassPayload}</div>
          <div className="font-astro-mono text-[10px] text-slate-300">Barcode: {persona.barcodePayload}</div>
        </div>
        <button
          type="button"
          onClick={queueSnapshotToNeon}
          className="astro-chip inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-3 text-[11px] font-bold"
        >
          Queue Neon Snapshot →
        </button>
      </div>
      {queuedNotice && <p className="font-astro-mono text-[11px] text-emerald-300">{queuedNotice}</p>}
      <p className="text-[10px] leading-snug text-slate-300">{persona.epistemicNotice}</p>
    </section>
  )
}
