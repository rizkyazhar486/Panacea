import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalStore } from '../../lib/store'
import { useOptionalLongitudinalState } from '../../lib/useLongitudinalState'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { sinyalPerSistem } from '../../lib/sinyalPribadiSistem'
import { getWorkouts } from '../../lib/workoutStore'
import { buildCockpitReadout } from '../../domains/personal-health/engine/bodyCockpitReadout'
import {
  buildSystemBoard,
  computeZeroQueueNosocomialRisk,
  evaluateWholeBodyCouplingAndBioWatchpoints,
  pack128ByteFrontierFrame,
} from '../../domains/body-exposure/engine/systemBoard'
import type { BodySystemId } from '../../domains/body-exposure/data/bodySystems'
import { WhenOpened } from '../../shared/ui/WhenOpened'

const GtaCharacterPersonaCard = lazy(() =>
  import('../GtaCharacterPersonaCard').then((m) => ({ default: m.GtaCharacterPersonaCard })),
)
const FasciaKineticTwinCard = lazy(() =>
  import('../FasciaKineticTwinCard').then((m) => ({ default: m.FasciaKineticTwinCard })),
)

interface StudioTrack {
  readonly id: 'multiscale' | 'physiology' | 'surgical' | 'frontier'
  readonly label: string
  readonly items: readonly { readonly to: string; readonly title: string; readonly meta: string }[]
}

const COMBINED_ROUTES = [
  { to: '/scan', label: 'Scan & Twin', code: '01' },
  { to: '/body-exposure', label: '3D Atlas', code: '02' },
  { to: '/sync', label: 'Sync & Export', code: '03' },
  { to: '/med-study', label: 'MedStudy', code: '04' },
  { to: '/clinical-hub', label: 'Clinical', code: '05' },
] as const

const STUDIO_TRACKS: readonly StudioTrack[] = [
  {
    id: 'multiscale',
    label: '3D/4D Anatomy & Multiscale',
    items: [
      { to: '/body-exposure', title: '4D Anatomy & AI-EMR Stage', meta: 'Three.js · Layer Explorer · Z-Anatomy' },
      { to: '/body-exposure/canonical', title: 'Canonical Multiscale Anatomy', meta: 'Whole Body → Organ System' },
      { to: '/body-explorer', title: 'Cellular-to-Exposome Explorer', meta: 'Interactive Anatomical & Biomarker Scope' },
      { to: '/scan', title: 'Body Exposure & Camera Scan Studio', meta: 'Morphometry & Clinical Reference' },
    ],
  },
  {
    id: 'physiology',
    label: 'Network Physiology & Bio-GDB',
    items: [
      { to: '/frontier-health', title: 'Whole-Body OS Kernel', meta: 'Ivanov 4-Bus · Borbely · PID' },
      { to: '/genome-lab', title: 'Genomics & Cellular Pathways', meta: 'Pharmacogenomics & Biochemical Models' },
      { to: '/electrophysiology', title: 'Arrhythmia & Hemodynamic Lab', meta: 'Quantitative ECG & Vascular Models' },
      { to: '/clinical-scores', title: 'Clinical Science & QSP Scores', meta: 'Validated Clinical Scoring Calculators' },
    ],
  },
  {
    id: 'surgical',
    label: 'Surgical Nav, CT & Anesthesia',
    items: [
      { to: '/radiology', title: '3D Radiology, CT & Regional Planning', meta: 'Cross-Sectional Imaging & Navigation' },
      { to: '/doctor-review', title: 'Clinician Safety & Review Gate', meta: 'Primum Non Nocere · STR Sign-Off' },
      { to: '/emr', title: 'Unified Clinical EMR Workbench', meta: 'SOAP · SatuSehat FHIR R4' },
      { to: '/knowledge-bridge', title: 'Evidence & Physiology Knowledge Base', meta: 'First-Principles Clinical References' },
    ],
  },
  {
    id: 'frontier',
    label: 'Frontier Zero-Queue & 2G/Starlink',
    items: [
      { to: '/planning', title: 'Zero-Queue Triage & Episode Planning', meta: 'Pre-Arrival Routing · Care Plan' },
      { to: '/sync', title: 'Digital Self & QR/Wearable Sync', meta: 'Identity · Telemetry Export' },
      { to: '/dive-log', title: 'Omni-Athletic & Dive Decompression', meta: 'Wearables · Bühlmann ZHL-16C' },
      { to: '/semua-fitur', title: 'All Panacea OS Modules', meta: 'Unified Workspace Switcher' },
    ],
  },
]

function KernelTelemetryDrawer() {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const [activeTrack, setActiveTrack] = useState<StudioTrack['id']>('multiscale')

  const snapshot = useMemo(() => {
    const now = new Date()
    const vitals = readUnifiedLocalVitals(store?.account ?? null, { patient: store?.activePatient ?? null })
    let weeklyMinutes: number | undefined
    try {
      const cutoff = now.getTime() - 7 * 86_400_000
      const mins = getWorkouts()
        .filter((w) => Date.parse(w.mulai) >= cutoff && Number.isFinite(w.durasi) && w.durasi > 0)
        .reduce((acc, w) => acc + w.durasi / 60, 0)
      if (mins > 0) weeklyMinutes = Math.round(mins)
    } catch { /* unreadable workout cache stays undefined */ }

    const cockpit = buildCockpitReadout({
      weightKg: vitals.weightKg,
      heightCm: vitals.heightCm,
      bodyFatPct: vitals.bodyFatPct,
      systolic: vitals.systolic,
      diastolic: vitals.diastolic,
      restingHr: vitals.restingHr ?? vitals.heartRate,
      hrvMs: vitals.hrvMs,
      spo2Pct: vitals.spo2Pct,
      vo2max: vitals.vo2max,
      sleepH: vitals.sleepH,
      weeklyWorkoutMinutes: weeklyMinutes,
      localHour0to23: now.getHours() + now.getMinutes() / 60,
    })

    const rows = longitudinal?.state ? buildSystemBoard(sinyalPerSistem(longitudinal.state), now) : buildSystemBoard(new Map(), now)
    const bioKernel = evaluateWholeBodyCouplingAndBioWatchpoints(rows, {
      spo2Pct: vitals.spo2Pct ?? null,
      restingHr: (vitals.restingHr ?? vitals.heartRate) ?? null,
      hrvMs: vitals.hrvMs ?? null,
    })
    const wellsRiley = computeZeroQueueNosocomialRisk({
      infectorsI: 1,
      quantaRateQPerHr: 48,
      pulmonaryVentM3PerHr: 0.54,
      waitingRoomHours: 1.5,
      jitDirectHours: 0.02,
      roomVentilationM3PerHr: 120,
    })
    const packet = pack128ByteFrontierFrame({
      hrBpm: (vitals.restingHr ?? vitals.heartRate) ?? null,
      hrvMs: vitals.hrvMs ?? null,
      spo2Pct: vitals.spo2Pct ?? null,
      systolicMmHg: vitals.systolic ?? null,
      diastolicMmHg: vitals.diastolic ?? null,
      epochSec: Math.floor(now.getTime() / 1000),
    })
    return { cockpit, bioKernel, wellsRiley, packet }
  }, [store?.account, store?.activePatient, longitudinal?.state])

  const track = STUDIO_TRACKS.find((t) => t.id === activeTrack) ?? STUDIO_TRACKS[0]!
  const { cockpit, bioKernel, wellsRiley, packet } = snapshot

  return (
    <div className="mt-3 space-y-4 border-t border-cyan-400/20 pt-3.5 text-white">
      {/* Whole-Body OS Kernel: Ivanov 4-Bus, Borbely Circadian, Allostatic PID & Bio-GDB */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-3">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Ivanov 4-Bus Network</div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-200">
            {bioKernel.buses.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-300">{b.label.replace(' Bus', '')}</span>
                <span className="font-astro-mono shrink-0 text-emerald-300">{b.observedSystems}/{b.totalSystems}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-3">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Borbely SCN Clock</div>
          {cockpit.circadianBorbely ? (
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="font-astro-mono text-sm font-bold text-white">
                T_core ~{cockpit.circadianBorbely.estimatedCoreTempC.toFixed(2)} °C · S {cockpit.circadianBorbely.processS}
              </div>
              <div className="text-emerald-300">{cockpit.circadianBorbely.phaseWindow}</div>
              <p className="leading-snug text-slate-300">{cockpit.circadianBorbely.optimalFocus}</p>
            </div>
          ) : (
            <p className="mt-2 text-[11px] leading-snug text-slate-300">
              Record sleep hours to derive Process C / Process S circadian phase (zero fabricated defaults).
            </p>
          )}
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-3">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Bio-GDB Watchpoints</div>
          <ul className="mt-2 space-y-1 text-[11px]">
            {bioKernel.watchpoints.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-300">{w.label.replace(' Proxy', '')}</span>
                <span className={`font-astro-mono shrink-0 font-bold ${w.status === 'WATCHPOINT_TRIGGERED' ? 'text-amber-300' : w.status === 'WITHIN_MODEL_BOUNDS' ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {w.value !== null ? `${w.value} ${w.unit}` : 'unobserved'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-3">
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Allostatic PID &amp; 2G Mesh</div>
          <div className="mt-2 space-y-1.5 text-[11px] text-slate-200">
            <div>
              PID Load:{' '}
              <span className="font-astro-mono font-bold text-emerald-300">
                {cockpit.allostaticPid ? `${cockpit.allostaticPid.loadIndex0to100}/100` : 'needs >=2 signals'}
              </span>
            </div>
            {wellsRiley.ok && (
              <div className="text-slate-300">
                JIT Zero-Queue Model: <span className="font-astro-mono text-cyan-300">-{wellsRiley.relativeRiskReductionPct}%</span> airborne HAI exposure
              </div>
            )}
            {packet.ok && (
              <div className="text-slate-300">
                2G/Starlink Frame: <span className="font-astro-mono text-emerald-300">{packet.byteLength}B · {packet.txMsAt9600bps}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fail-closed Preventive Surveillance, Outpatient Cost Model & Assurance Readiness */}
      <div className="rounded-xl border border-emerald-400/20 bg-white/[0.03] px-3 py-2.5 text-[11px] text-slate-200">
        {cockpit.preventiveAssurance ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Preventive Surveillance &amp; Assurance Readiness · {cockpit.preventiveAssurance.triageStage}
              </div>
              <div className="text-slate-200">{cockpit.preventiveAssurance.dailyPreventionActions[0]}</div>
            </div>
            <div className="font-astro-mono flex flex-wrap items-center gap-3 text-[11px]">
              <span className="text-cyan-300">
                Coverage {cockpit.preventiveAssurance.coveragePct}% ({cockpit.preventiveAssurance.recordedSignalCount}/10)
              </span>
              <span className="text-emerald-300">
                Est. acute burden offset ~{cockpit.preventiveAssurance.preventableAcuteBurdenReductionEstPct}% (model)
              </span>
              <span className="text-amber-300">{cockpit.preventiveAssurance.assuranceClaimReadiness}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-astro text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
              Preventive Surveillance &amp; Assurance Readiness
            </span>
            <span className="text-slate-300">Record at least 2 baseline signals (weight, height, BP, RHR, HRV, SpO2, or sleep) to compute readiness (no fabricated defaults).</span>
          </div>
        )}
      </div>

      {/* Curated 4-Track Next-Gen Studios (replaces 24 chaotic rainbow pills) */}
      <div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Next-Gen Simulation & Hospital Tracks">
          {STUDIO_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTrack === t.id}
              onClick={() => setActiveTrack(t.id)}
              className={`min-h-[44px] rounded-xl border px-3 text-[11px] font-bold transition ${
                activeTrack === t.id
                  ? 'border-emerald-400 bg-emerald-500/20 text-white'
                  : 'border-white/15 bg-white/[0.03] text-slate-300 hover:border-cyan-400/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {track.items.map((item) => (
            <Link
              key={`${item.to}-${item.title}`}
              to={item.to}
              className="astro-chip flex min-h-[56px] flex-col justify-center rounded-xl px-3 py-2 no-underline"
            >
              <span className="text-[12px] font-bold text-white">{item.title} →</span>
              <span className="font-astro-mono mt-0.5 text-[10px] text-cyan-200/80">{item.meta}</span>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-snug text-slate-300">
        Educational biophysics, simulation &amp; draft telemetry (<code className="text-cyan-300">clinically_reviewed=false</code>). Clinical diagnosis, prescribing, anesthesia, and surgical actuation remain strictly under licensed human clinicians.
      </p>
    </div>
  )
}

export function BodyAnalysisCommandDeck({ focusSystem }: { readonly focusSystem: BodySystemId | null }) {
  return (
    <section
      aria-label="PanaceaMed Body Analysis Command System"
      className="dark astro-surface astro-horizon-grid rounded-2xl p-3.5 text-white sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-astro text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            BODY ANALYSIS OS
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-white">
            Digital Twin · CAD/CAE · Organ Board
            {focusSystem && <span className="font-astro-mono ml-2 text-[11px] text-emerald-300">[{focusSystem}]</span>}
          </div>
        </div>
        <Link
          to="/scan"
          className="astro-chip inline-flex min-h-[44px] items-center rounded-xl px-3 text-[11px] font-bold no-underline"
        >
          Scan &amp; Build →
        </Link>
      </div>

      <nav aria-label="Combined Body Analysis Workspaces" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {COMBINED_ROUTES.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="astro-chip inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-bold no-underline"
          >
            <span className="font-astro-mono text-[10px] text-emerald-300">{r.code}</span>
            <span>{r.label}</span>
          </Link>
        ))}
      </nav>

      <details className="mt-3 rounded-xl border border-cyan-400/20 bg-black/30 px-3 py-1.5">
        <summary className="font-astro flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-200">
          <span>Whole-Body OS Kernel · Bio-GDB · Next-Gen 3D/4D &amp; Surgical Studios</span>
          <span className="font-astro-mono text-[10px] text-emerald-300">EXPAND ▾</span>
        </summary>
        <WhenOpened>
          <KernelTelemetryDrawer />
        </WhenOpened>
      </details>

      <details className="mt-2 rounded-xl border border-emerald-400/20 bg-black/30 px-3 py-1.5">
        <summary className="font-astro flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200">
          <span>1:1 GTA Character HUD · Longevium Digital Twin · Feet-to-Face Fascia Chain</span>
          <span className="font-astro-mono text-[10px] text-cyan-300">OPEN TWIN ▾</span>
        </summary>
        <WhenOpened>
          <div className="mt-3 space-y-4 pb-2">
            <Suspense fallback={<p role="status" className="py-2 text-xs text-slate-300">Loading Parametric Digital Twin…</p>}>
              <GtaCharacterPersonaCard />
              <FasciaKineticTwinCard />
            </Suspense>
          </div>
        </WhenOpened>
      </details>
    </section>
  )
}
