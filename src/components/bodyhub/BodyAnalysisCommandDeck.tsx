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
  readonly items: readonly { readonly href: string; readonly title: string; readonly meta: string }[]
}

const COMBINED_ROUTES = [
  { to: '/body-exposure', label: '3D Body Exposure', code: '01' },
  { to: '/med-study', label: 'MedStudyHub', code: '02' },
  { to: '/fitness-hub?view=body', label: 'Body Comp & Fitness', code: '03' },
  { to: '/for-you', label: 'For You', code: '04' },
  { to: '/clinical-hub', label: 'Clinical & Visit OS', code: '05' },
] as const

const STUDIO_TRACKS: readonly StudioTrack[] = [
  {
    id: 'multiscale',
    label: '3D/4D Anatomy & Multiscale',
    items: [
      { href: '/medscihub-4d-anatomy-emr.html', title: 'MedSciHub 4D Anatomy & AI-EMR', meta: 'Three.js · XYZ Explode · 1-Projectile' },
      { href: '/deep-human-lab/medscihub-3d-multiscale-simulation.html', title: 'Deep Human Lab 3D Multiscale', meta: 'Whole Body → Organelle' },
      { href: '/multiscale-quantum-exposome-os.html', title: '6-Tier Cellular-to-Exposome Lab', meta: 'Educational Biophysical Layers' },
      { href: '/omega-invictus-body-exposure-os.html', title: '8-in-1 Body Exposure Studio', meta: 'Unified Anatomical & Lab Scope' },
    ],
  },
  {
    id: 'physiology',
    label: 'Network Physiology & Bio-GDB',
    items: [
      { href: '/whole-body-exposure-os.html', title: 'Whole-Body OS Kernel', meta: 'Ivanov 4-Bus · Borbely · PID' },
      { href: '/cellular-spacetime-debugger-os.html', title: '4D Cellular Spacetime & Bio-GDB', meta: 'Watchpoints · Reaction-Diffusion' },
      { href: '/numerical-body-exposure-clinical.html', title: 'Numerical Biophysics Lab', meta: 'Quantitative Hemodynamic Models' },
      { href: '/panaceamed-legit-clinical-science-os.html', title: 'Clinical Science & QSP Core', meta: 'Stewart · Guyton · PK/PD' },
    ],
  },
  {
    id: 'surgical',
    label: 'Surgical Nav, CT & Anesthesia',
    items: [
      { href: '/panaceamed-robotaxi-surgical-hospital-os.html', title: 'Surgical Nav, 3D CT & Nerve Block', meta: 'Haptic Arm Sim · Regional Block' },
      { href: '/hippocratic-clinical-os.html', title: 'Hippocratic Clinical Safety OS', meta: 'Primum Non Nocere · Human Review' },
      { href: '/panaceamed-unified-superos.html', title: 'Unified Hospital Command Center', meta: 'P4 Systems Medicine Workbench' },
      { href: '/nobel-invictus-axioms-os.html', title: 'Physics & Physiology Axioms', meta: 'First-Principles Education' },
    ],
  },
  {
    id: 'frontier',
    label: 'Frontier Zero-Queue & 2G/Starlink',
    items: [
      { href: '/panaceamed-frontier-civilization-superos.html', title: 'Frontier Zero-Queue & 2G/Starlink', meta: 'Pre-Arrival Triage · Doctor Co-Pilot' },
      { href: '/personal-digital-self-1to1.html', title: 'Digital Self & QR/Barcode Pass', meta: 'Identity · Telemetry Scope' },
      { href: '/panaceamed-omni-athletic-geomed-os.html', title: 'Omni-Athletic & Geo-Dive Lab', meta: 'Wearables · ZHL-16C Model' },
      { href: '/panaceamed-1tap-hypervisor-os.html', title: '1-Tap Cross-OS Hypervisor', meta: 'Rapid Workspace Switcher' },
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
            <a
              key={item.href}
              href={item.href}
              className="astro-chip flex min-h-[56px] flex-col justify-center rounded-xl px-3 py-2 no-underline"
            >
              <span className="text-[12px] font-bold text-white">{item.title} ↗</span>
              <span className="font-astro-mono mt-0.5 text-[10px] text-cyan-200/80">{item.meta}</span>
            </a>
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
            PANACEAMED OS · BODY ANALYSIS SYSTEM
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-white">
            Combined 3D Body Exposure · MedStudyHub · Your Body · For You · Clinical
            {focusSystem && <span className="font-astro-mono ml-2 text-[11px] text-emerald-300">[{focusSystem}]</span>}
          </div>
        </div>
        <Link
          to="/tubuh?tab=pulih"
          className="astro-chip inline-flex min-h-[44px] items-center rounded-xl px-3 text-[11px] font-bold no-underline"
        >
          5-Modality Recovery →
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
