import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  buildDailyProtocolTimeline,
  buildEnsembleTelemetrySeries,
  COMMAND_MODES,
  getCommandModeProfile,
  type CommandOperatingMode,
  type RawTelemetrySample,
} from '../../domains/spatial-os/index.ts'
import type { Vitals } from '../../lib/healthVitals'
import { readSpatialNotes, saveSpatialNotes } from './spatialStorage'
import '../../styles/panaceaSpatialHud.css'

export interface PanaceaAugmaDesktopDeckProps {
  readonly mode: CommandOperatingMode
  readonly onModeChange: (next: CommandOperatingMode) => void
  readonly spotlightOpen: boolean
  readonly onSpotlightOpenChange: (open: boolean) => void
  readonly identityName: string
  readonly identityHandle: string
  readonly outboxCount: number
  readonly readinessScore: number | null
  readonly readinessTruthClass: 'measured' | 'estimated' | 'simulated' | 'curated_physiology'
  readonly telemetrySamples: readonly RawTelemetrySample[]
  readonly vitals: Vitals
  readonly onSelectView: (view: 'deck' | 'twin' | 'holotable' | 'constellation') => void
}

interface PaletteItem {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly category: 'ROUTE' | 'SKDI' | 'CALCULATOR' | '3D ANATOMY' | 'TWIN PRESET'
  readonly route?: string
  readonly mode?: CommandOperatingMode
  readonly view?: 'deck' | 'twin' | 'holotable' | 'constellation'
}

const BASE_PALETTE_ITEMS: readonly PaletteItem[] = [
  { id: 'r-twin', title: 'Holographic 3D Digital Twin Stage', subtitle: 'Z-Anatomy projection ring + AI Guide', category: 'ROUTE', view: 'twin' },
  { id: 'r-holo', title: 'Counterfactual Trajectory Holotable', subtitle: 'Now vs Optimized simulated longevity curves', category: 'ROUTE', view: 'holotable' },
  { id: 'r-const', title: '3D Biomedical Knowledge Constellation', subtitle: 'Vitals · Organs · Fascia · SKDI · Pharmacology', category: 'ROUTE', view: 'constellation' },
  { id: 'r-profile', title: 'Commander Profile & One-Scan Pass', subtitle: '/profile · dr. Rizky Muhammad Azrissal', category: 'ROUTE', route: '/profile' },
  { id: 'r-body', title: 'Your Body & Unified Telemetry', subtitle: '/tubuh · Organ board & multi-compartment analysis', category: 'ROUTE', route: '/tubuh' },
  { id: 'r-atlas', title: 'Body Exposure 3D Atlas', subtitle: '/body-exposure · Full Z-Anatomy CC BY-SA 4.0', category: 'ROUTE', route: '/body-exposure' },
  { id: 'r-visit', title: 'Clinical Visit OS & AI-EMR', subtitle: '/visit-os · Outpatient episode continuity', category: 'ROUTE', route: '/visit-os' },
  { id: 'r-labs', title: 'Health Data & Biomarker Labs', subtitle: '/health-data · Longitudinal lab & wearable logs', category: 'ROUTE', route: '/health-data' },
  { id: 'r-fascia', title: 'Feet-to-Face Fascia Kinetic Chain', subtitle: '/aesthetic · Superficial Front Line biomechanics', category: 'ROUTE', route: '/aesthetic' },
  { id: 'r-med', title: 'MedStudyHub · SKDI & OSCE Library', subtitle: '/med-study · Clinical reference curriculum', category: 'ROUTE', route: '/med-study' },
  { id: 'c-news2', title: 'NEWS2 Clinical Deterioration Score', subtitle: 'Acute vital-sign escalation calculator', category: 'CALCULATOR', route: '/news2-score' },
  { id: 'c-sofa', title: 'SOFA Organ Failure Score', subtitle: 'Sequential Organ Failure Assessment', category: 'CALCULATOR', route: '/clinical-scores?s=sofa' },
  { id: 'c-qtc', title: 'Corrected QT Interval (QTc)', subtitle: 'Bazett / Fridericia electrophysiology calculator', category: 'CALCULATOR', route: '/clinical-scores?s=qtc' },
  { id: 'c-crcl', title: 'Cockcroft-Gault Creatinine Clearance', subtitle: 'Renal dosing clearance reference', category: 'CALCULATOR', route: '/clinical-scores?s=creatinine-clearance' },
  { id: 'c-findrisc', title: 'FINDRISC Type 2 Diabetes Risk', subtitle: '10-year metabolic risk stratification', category: 'CALCULATOR', route: '/clinical-scores?s=findrisc' },
  { id: 'a-heart', title: 'Cardiopulmonary Core & Coronary Tree', subtitle: '3D Z-Anatomy Layer 05 · Heart & Lungs', category: '3D ANATOMY', route: '/body-exposure' },
  { id: 'a-scm', title: 'Sternocleidomastoid & Cervical Fascia', subtitle: 'Superficial Front Line · Layer 02/03', category: '3D ANATOMY', view: 'twin' },
  { id: 'a-cns', title: 'Autonomic Nervous System & SCN Hub', subtitle: '3D Z-Anatomy Layer 06 · Neuro', category: '3D ANATOMY', route: '/body-exposure' },
  ...COMMAND_MODES.map((m) => ({
    id: `m-${m}`,
    title: `Switch Command Mode → ${m}`,
    subtitle: getCommandModeProfile(m).directive,
    category: 'TWIN PRESET' as const,
    mode: m,
  })),
]

function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PanaceaAugmaDesktopDeck({
  mode,
  onModeChange,
  spotlightOpen,
  onSpotlightOpenChange,
  identityName,
  identityHandle,
  outboxCount,
  readinessScore,
  readinessTruthClass,
  telemetrySamples,
  vitals,
  onSelectView,
}: PanaceaAugmaDesktopDeckProps) {
  const navigate = useNavigate()
  const profile = useMemo(() => getCommandModeProfile(mode), [mode])
  const ensemble = useMemo(() => buildEnsembleTelemetrySeries(telemetrySamples), [telemetrySamples])
  const timeline = useMemo(() => buildDailyProtocolTimeline(mode), [mode])

  // 3D Perspective Floating Module Wall toggle
  const [perspective3d, setPerspective3d] = useState(false)
  const [notes, setNotes] = useState<string>(() => readSpatialNotes())
  const [notesSaved, setNotesSaved] = useState(false)

  // Live tactical clock (updated every 1s)
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Focus / Break session timer ring
  const [timerPhase, setTimerPhase] = useState<'focus' | 'break'>('focus')
  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number>(() => profile.focusMinutes * 60)

  useEffect(() => {
    setTimerRunning(false)
    setSecondsLeft((timerPhase === 'focus' ? profile.focusMinutes : profile.breakMinutes) * 60)
  }, [profile.focusMinutes, profile.breakMinutes, timerPhase])

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  // Command Palette state + lazy SKDI corpus loader
  const [query, setQuery] = useState('')
  const [skdiItems, setSkdiItems] = useState<PaletteItem[]>([])

  useEffect(() => {
    if (!spotlightOpen || skdiItems.length > 0) return
    let cancelled = false
    import('../../lib/skdiDiseaseList')
      .then((mod) => {
        if (cancelled) return
        const mapped: PaletteItem[] = mod.SKDI_DISEASE_LIST.map((entry, idx) => ({
          id: `skdi-${idx}`,
          title: entry.disease,
          subtitle: `${entry.system} · SKDI Level ${entry.level}`,
          category: 'SKDI',
          route: '/med-study',
        }))
        setSkdiItems(mapped)
      })
      .catch(() => { /* fallback gracefully to base palette items */ })
    return () => { cancelled = true }
  }, [spotlightOpen, skdiItems.length])

  // Keyboard shortcuts: Alt+Space and Cmd/Ctrl+K (when mounted on Command OS)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        onSpotlightOpenChange(!spotlightOpen)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()
        onSpotlightOpenChange(true)
      } else if (e.key === 'Escape' && spotlightOpen) {
        onSpotlightOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [spotlightOpen, onSpotlightOpenChange])

  const filteredPalette = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = [...BASE_PALETTE_ITEMS, ...skdiItems]
    if (!q) return pool.slice(0, 14)
    return pool
      .filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      .slice(0, 18)
  }, [query, skdiItems])

  const runPaletteItem = (item: PaletteItem) => {
    onSpotlightOpenChange(false)
    setQuery('')
    if (item.mode) {
      onModeChange(item.mode)
      return
    }
    if (item.view) {
      onSelectView(item.view)
      return
    }
    if (item.route) navigate(item.route)
  }

  const totalPhaseSec = (timerPhase === 'focus' ? profile.focusMinutes : profile.breakMinutes) * 60
  const ringRadius = 38
  const ringCirc = 2 * Math.PI * ringRadius
  const ringProgress = totalPhaseSec > 0 ? secondsLeft / totalPhaseSec : 0
  const ringOffset = ringCirc * (1 - ringProgress)

  const currentHourFrac = now.getHours() + now.getMinutes() / 60
  const clockHours = now.getHours() % 12
  const hourAngle = (clockHours + now.getMinutes() / 60) * 30
  const minAngle = now.getMinutes() * 6
  const secAngle = now.getSeconds() * 6

  // Build SVG path for Ensemble History strictly skipping null gaps
  const chartWidth = 420
  const chartHeight = 128
  const observedCoords = ensemble.points
    .map((pt, idx) => {
      if (pt.ensembleScore === null) return null
      const x = ensemble.points.length > 1 ? (idx / (ensemble.points.length - 1)) * (chartWidth - 28) + 14 : chartWidth / 2
      const y = chartHeight - 16 - (pt.ensembleScore / 100) * (chartHeight - 32)
      return { x, y, pt }
    })
    .filter((v): v is { x: number; y: number; pt: (typeof ensemble.points)[number] } => v !== null)

  const linePath = observedCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaPath =
    observedCoords.length >= 2
      ? `${linePath} L ${observedCoords[observedCoords.length - 1].x.toFixed(1)} ${(chartHeight - 14).toFixed(1)} L ${observedCoords[0].x.toFixed(1)} ${(chartHeight - 14).toFixed(1)} Z`
      : ''

  const appVersion = String(import.meta.env.VITE_APP_VERSION ?? 'panacea-spatial-os')

  return (
    <section aria-label="Panacea AUGMA Desktop Tactical Command Center" className="panacea-spatial-hud p-4 sm:p-5">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="hud-micro-header text-cyan-300">
            WELCOME TO PANACEA OS · AUGMA SPATIAL COMMAND [{profile.modeIndex}/{profile.mode}]
          </div>
          <h2 className="mt-0.5 text-base font-black tracking-tight text-white sm:text-lg">
            {identityName} <span className="font-mono text-xs font-semibold text-cyan-300">{identityHandle}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPerspective3d((v) => !v)}
            aria-pressed={perspective3d}
            className={`hud-btn text-[10px] ${perspective3d ? 'hud-btn-cyan' : ''}`}
          >
            {perspective3d ? '3D WALL: ON' : '3D WALL: FLAT'}
          </button>
          <button
            type="button"
            onClick={() => onSpotlightOpenChange(true)}
            className="hud-btn hud-btn-active text-[10px]"
          >
            COMMAND PALETTE (⌘K / ALT+SPACE)
          </button>
        </div>
      </header>

      {/* Primary Modular Bento HUD */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Welcome & Quick Shortcuts Panel */}
        <div className="hud-frame hud-frame-crimson p-4 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <span className="hud-micro-header text-rose-300">WELCOME TO PANACEA OS</span>
            <span className="hud-pill border-rose-500/40 text-rose-200">{profile.accent.badgeLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-200">{profile.directive}</p>

          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Desktop Operating Modes">
            {COMMAND_MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={m === mode}
                onClick={() => onModeChange(m)}
                className={`hud-btn min-h-[44px] px-2.5 text-[10px] ${m === mode ? 'hud-btn-active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onSelectView('twin')} className="hud-btn hud-btn-cyan justify-between text-[10px]">
              <span>02 HOLO TWIN</span>
              <span>→</span>
            </button>
            <button type="button" onClick={() => onSelectView('holotable')} className="hud-btn hud-btn-amber justify-between text-[10px]">
              <span>08 HOLOTABLE</span>
              <span>→</span>
            </button>
            <button type="button" onClick={() => onSelectView('constellation')} className="hud-btn justify-between text-[10px]">
              <span>CONSTELLATION</span>
              <span>→</span>
            </button>
            <Link to="/visit-os" className="hud-btn hud-btn-emerald justify-between text-[10px]">
              <span>04 VISIT OS</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Live Tactical Analog/Digital Clock + Session Focus Timer */}
        <div className="hud-frame p-4 lg:col-span-3">
          <div className="hud-micro-header">TACTICAL CLOCK &amp; FOCUS CADENCE</div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            {/* Analog Dial */}
            <svg viewBox="0 0 92 92" className="h-[88px] w-[88px] shrink-0" role="img" aria-label="Tactical analog clock">
              <circle cx="46" cy="46" r="42" fill="rgba(5,6,8,0.85)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx="46" cy="46" r="36" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="2 6" />
              <line x1="46" y1="46" x2="46" y2="24" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${hourAngle} 46 46)`} />
              <line x1="46" y1="46" x2="46" y2="16" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${minAngle} 46 46)`} />
              <line x1="46" y1="46" x2="46" y2="14" stroke="#ff2d46" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secAngle} 46 46)`} />
              <circle cx="46" cy="46" r="2.5" fill="#ff2d46" />
            </svg>

            {/* Session Focus Timer Ring */}
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 92 92" className="h-[88px] w-[88px]" role="img" aria-label={`Session timer ${formatSeconds(secondsLeft)}`}>
                <circle cx="46" cy="46" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                <circle
                  cx="46"
                  cy="46"
                  r={ringRadius}
                  fill="none"
                  stroke={timerPhase === 'focus' ? '#ff2d46' : '#10b981'}
                  strokeWidth="4"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 46 46)"
                />
                <text x="46" y="49" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="800" fontFamily="monospace">
                  {formatSeconds(secondsLeft)}
                </text>
              </svg>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="hud-kpi-value text-xs font-bold text-cyan-200">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-300">
              {timerPhase === 'focus' ? `${profile.focusMinutes}M FOCUS` : `${profile.breakMinutes}M BREAK`}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => setTimerRunning((v) => !v)} className={`hud-btn px-2 text-[10px] ${timerRunning ? 'hud-btn-active' : 'hud-btn-cyan'}`}>
              {timerRunning ? 'PAUSE' : 'START'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false)
                setSecondsLeft(totalPhaseSec)
              }}
              className="hud-btn px-2 text-[10px]"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={() => setTimerPhase((p) => (p === 'focus' ? 'break' : 'focus'))}
              className="hud-btn px-2 text-[10px]"
            >
              {timerPhase === 'focus' ? 'BREAK' : 'FOCUS'}
            </button>
          </div>
        </div>

        {/* Ensemble History Panel */}
        <div className="hud-frame p-4 lg:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <span className="hud-micro-header">ENSEMBLE HISTORY STREAM</span>
            <span className="font-mono text-[9px] uppercase text-amber-300">
              {ensemble.truthClass} · {ensemble.coveragePct}% COV
            </span>
          </div>

          <div className="mt-2 rounded-lg border border-white/10 bg-black/50 p-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[124px] w-full" role="img" aria-label="Ensemble vital readiness trend chart">
              <defs>
                <linearGradient id="hudEnsembleFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff2d46" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.38" />
                </linearGradient>
                <linearGradient id="hudEnsembleStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff2d46" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>

              {[25, 50, 75].map((pct) => {
                const y = chartHeight - 16 - (pct / 100) * (chartHeight - 32)
                return <line key={pct} x1="12" y1={y} x2={chartWidth - 12} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" />
              })}

              {areaPath && <path d={areaPath} fill="url(#hudEnsembleFill)" />}
              {linePath && <path d={linePath} fill="none" stroke="url(#hudEnsembleStroke)" strokeWidth="2.2" strokeLinecap="round" />}

              {observedCoords.map((c) => (
                <circle key={c.pt.label} cx={c.x} cy={c.y} r="3.5" fill="#22d3ee" stroke="#050608" strokeWidth="1.5" />
              ))}

              {ensemble.points.map((pt, idx) => {
                const x = ensemble.points.length > 1 ? (idx / (ensemble.points.length - 1)) * (chartWidth - 28) + 14 : chartWidth / 2
                return (
                  <text key={pt.label} x={x} y={chartHeight - 2} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {pt.label}
                  </text>
                )
              })}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
            <span>
              Latest Ensemble:{' '}
              <strong className="hud-kpi-value text-cyan-200">
                {ensemble.latestEnsembleScore !== null ? `${ensemble.latestEnsembleScore}/100` : 'Unobserved'}
              </strong>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {ensemble.observedPointCount}/{ensemble.totalPointCount} days
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">{ensemble.epistemicNotice}</p>
        </div>
      </div>

      {/* Daily Protocol Timeline Strip */}
      <div className="hud-frame mt-3.5 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="hud-micro-header">DAILY PROTOCOL TIMELINE (00:00 – 24:00)</span>
          <span className="font-mono text-[10px] text-cyan-300">
            CURRENT MARKER {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </span>
        </div>

        <div className="relative mt-2.5 h-16 w-full overflow-hidden rounded-lg border border-white/10 bg-black/55">
          {/* Hour guide ticks */}
          {[0, 6, 12, 18, 24].map((hr) => (
            <div
              key={hr}
              style={{ left: `${(hr / 24) * 100}%` }}
              className="pointer-events-none absolute top-0 bottom-0 border-l border-white/10"
            >
              <span className="ml-1 font-mono text-[9px] text-slate-400">{String(hr).padStart(2, '0')}h</span>
            </div>
          ))}

          {/* Protocol bars */}
          {timeline.map((slot, idx) => {
            const leftPct = (slot.startHour / 24) * 100
            const widthPct = ((slot.endHour - slot.startHour) / 24) * 100
            const emphasized = slot.emphasizedInModes.includes(mode)
            return (
              <Link
                key={slot.id}
                to={slot.route}
                title={`${slot.label} (${slot.startHour}:00–${slot.endHour}:00)`}
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 4)}%`,
                  top: idx % 2 === 0 ? '20px' : '40px',
                }}
                className={`absolute flex h-4 items-center overflow-hidden rounded px-1.5 font-mono text-[9px] font-bold no-underline transition ${
                  emphasized
                    ? 'border border-[#ff2d46]/70 bg-[#ff2d46]/30 text-white'
                    : 'border border-cyan-400/35 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/30'
                }`}
              >
                <span className="truncate">{slot.label}</span>
              </Link>
            )
          })}

          {/* Live current-time beam */}
          <div
            style={{ left: `${(currentHourFrac / 24) * 100}%` }}
            className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-[#ff2d46]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Optional 3D Perspective Floating Module Wall */}
      <div className="hud-perspective-stage mt-3.5">
        <div className={`hud-perspective-wall grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 ${perspective3d ? 'hud-perspective-wall-tilted' : ''}`}>
          {/* 1. GITHUB / BUILD REV */}
          <div className="hud-frame p-3">
            <div className="hud-micro-header">GITHUB / BUILD REV</div>
            <div className="hud-kpi-value mt-1.5 truncate text-xs font-bold text-cyan-200">{appVersion}</div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">rizkyazhar486/Panacea</div>
            <div className="mt-2 font-mono text-[10px] text-emerald-300">EDGE · CLOUDFLARE SPA</div>
          </div>

          {/* 2. CLINICAL & DAILY NOTES */}
          <div className="hud-frame p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="hud-micro-header">CLINICAL &amp; DAILY NOTES</span>
              {notesSaved && <span className="font-mono text-[9px] text-emerald-300">SAVED</span>}
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                saveSpatialNotes(e.target.value)
                setNotesSaved(true)
              }}
              rows={2}
              aria-label="Clinical and daily operational notes"
              placeholder="Local-only shift scratchpad..."
              className="mt-1.5 w-full resize-none rounded border border-white/10 bg-black/50 p-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* 3. DIGITAL TWIN STATUS */}
          <div className="hud-frame hud-frame-amber p-3">
            <div className="hud-micro-header">DIGITAL TWIN STATUS</div>
            <div className="hud-kpi-value mt-1.5 text-sm font-black text-amber-300">
              {readinessScore !== null ? `CORE ${readinessScore}/100` : 'UNOBSERVED'}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase text-slate-300">
              TRUTH: {readinessTruthClass}
            </div>
            <button type="button" onClick={() => onSelectView('twin')} className="mt-2 font-mono text-[10px] font-bold text-cyan-300 underline">
              Open 3D Twin Stage →
            </button>
          </div>

          {/* 4. NEON SYNC OUTBOX */}
          <div className="hud-frame hud-frame-emerald p-3">
            <div className="hud-micro-header">NEON SYNC OUTBOX</div>
            <div className="hud-kpi-value mt-1.5 text-sm font-black text-emerald-300">
              {outboxCount} EVENTS
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">12-table PG schema ready</div>
            <button type="button" onClick={() => onSelectView('holotable')} className="mt-2 font-mono text-[10px] font-bold text-amber-300 underline">
              Record Snapshot →
            </button>
          </div>

          {/* 5. WEARABLES TELEMETRY */}
          <div className="hud-frame p-3">
            <div className="hud-micro-header">WEARABLES TELEMETRY</div>
            <div className="hud-kpi-value mt-1.5 text-xs font-bold text-white">
              HR {vitals.restingHr ?? vitals.heartRate ?? '—'} · HRV {vitals.hrvMs ?? '—'}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-300">
              Sleep {vitals.sleepH ?? '—'}h · Steps {vitals.steps ?? '—'}
            </div>
            <Link to="/health-data" className="mt-2 inline-block font-mono text-[10px] font-bold text-cyan-300 underline">
              Sync Vitals →
            </Link>
          </div>
        </div>
      </div>

      {/* Command Palette Modal (Cmd+K / Alt+Space) */}
      {spotlightOpen && (
        <div
          className="hud-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Panacea AUGMA Spatial Command Palette"
          onClick={() => onSpotlightOpenChange(false)}
        >
          <div
            className="hud-frame hud-frame-crimson w-full max-w-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="hud-micro-header text-cyan-300">
                AUGMA COMMAND PALETTE · ROUTES · SKDI ({skdiItems.length || '…'}) · CALCULATORS · 3D ATLAS
              </span>
              <button
                type="button"
                onClick={() => onSpotlightOpenChange(false)}
                className="hud-btn min-h-[36px] px-2.5 text-[10px]"
              >
                ESC
              </button>
            </div>
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search routes, SKDI diseases (e.g. Hipertensi, Meningitis), calculators, 3D structures..."
              className="mt-2.5 min-h-[44px] w-full rounded-lg border border-cyan-400/40 bg-black/75 px-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
            />
            <ul className="mt-3 max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
              {filteredPalette.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => runPaletteItem(item)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{item.title}</div>
                      <div className="truncate font-mono text-[10px] text-slate-400">{item.subtitle}</div>
                    </div>
                    <span className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-200">
                      {item.category}
                    </span>
                  </button>
                </li>
              ))}
              {filteredPalette.length === 0 && (
                <li className="py-4 text-center font-mono text-xs text-slate-400">
                  No matching route, SKDI condition, or calculator.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
