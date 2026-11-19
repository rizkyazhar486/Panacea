import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  COMMAND_MODES,
  getRadialCommandDeck,
  type CommandOperatingMode,
  type RadialArcId,
} from '../../domains/spatial-os/index.ts'
import type { Vitals } from '../../lib/healthVitals'
import '../../styles/panaceaSpatialHud.css'

export interface PanaceaRadialCommandDeckProps {
  readonly mode: CommandOperatingMode
  readonly onModeChange: (next: CommandOperatingMode) => void
  readonly onOpenSpotlight: () => void
  readonly identityName: string
  readonly identityHandle: string
  readonly outboxCount: number
  readonly readinessScore: number | null
  readonly readinessTruthClass: 'measured' | 'estimated' | 'simulated' | 'curated_physiology'
  readonly vitals: Vitals
}

const ARC_COORDS: Readonly<Record<RadialArcId, { readonly x: number; readonly y: number }>> = {
  SYSTEM: { x: 46, y: 120 },
  MY_BODY: { x: 84, y: 52 },
  MASTER: { x: 160, y: 26 },
  CLINICAL: { x: 236, y: 52 },
  LAB_3D: { x: 274, y: 120 },
}

export function PanaceaRadialCommandDeck({
  mode,
  onModeChange,
  onOpenSpotlight,
  identityName,
  identityHandle,
  outboxCount,
  readinessScore,
  readinessTruthClass,
  vitals,
}: PanaceaRadialCommandDeckProps) {
  const navigate = useNavigate()
  const [activeArc, setActiveArc] = useState<RadialArcId | undefined>(undefined)
  const [askOpen, setAskOpen] = useState(false)
  const [askQuery, setAskQuery] = useState('')
  const [askReply, setAskReply] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)

  const deck = useMemo(() => getRadialCommandDeck(mode, activeArc), [mode, activeArc])
  const rhr = vitals.restingHr ?? vitals.heartRate ?? null
  const hrv = vitals.hrvMs ?? null
  const spo2 = vitals.spo2Pct ?? null

  const submitAsk = (rawPrompt: string) => {
    const q = rawPrompt.trim()
    if (!q) return
    const lower = q.toLowerCase()
    if (lower.includes('twin') || lower.includes('3d') || lower.includes('atlas')) {
      setAskReply('Routing command recognized: open Holographic Digital Twin Stage or Z-Anatomy 3D Atlas. (Educational navigation only; not clinician-reviewed.)')
      return
    }
    if (lower.includes('fascia') || lower.includes('posture') || lower.includes('gait')) {
      setAskReply('Feet-to-Face Myofascial Kinetic Chain available in slot 03 FASCIA or Twin Stage layer 02. Simulated biomechanical model; not clinician-reviewed.')
      return
    }
    if (lower.includes('visit') || lower.includes('emr') || lower.includes('skdi') || lower.includes('lab')) {
      setAskReply('Clinical tools ready in slots 04 VISIT OS and 05 LABS, or press Cmd/Alt+Space for full SKDI & calculator search. Educational/operational assistant only.')
      return
    }
    setAskReply(
      `Oculus Command parsed "${q}" under ${deck.modeProfile.label} (${deck.modeProfile.modeIndex}). Active vitals: RHR ${rhr ?? 'Unobserved'} bpm, HRV ${hrv ?? 'Unobserved'} ms, SpO2 ${spo2 ?? 'Unobserved'}%. Educational overview only — not clinician-reviewed.`,
    )
  }

  const triggerVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => { lang: string; onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void }; webkitSpeechRecognition?: new () => { lang: string; onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void } })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void } })
        .webkitSpeechRecognition

    if (!SpeechRec) {
      setAskOpen(true)
      setAskReply('Browser speech recognition unavailable in this environment — type your command below.')
      return
    }

    try {
      const rec = new SpeechRec()
      rec.lang = 'en-US'
      setVoiceActive(true)
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript ?? ''
        if (transcript) {
          setAskQuery(transcript)
          submitAsk(transcript)
        }
      }
      rec.onend = () => setVoiceActive(false)
      rec.onerror = () => setVoiceActive(false)
      rec.start()
    } catch {
      setVoiceActive(false)
    }
  }

  return (
    <section
      aria-label="Panacea Tactile Radial Command Deck"
      className="panacea-spatial-hud p-3.5 sm:p-5"
    >
      {/* Top Status Strip */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="hud-pill border-rose-500/50 bg-rose-500/15 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d46]" aria-hidden="true" />
            MODE {deck.modeProfile.modeIndex} · {deck.mode}
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">{identityName}</div>
            <div className="hud-micro-header truncate text-cyan-300/90">{identityHandle}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-pill border-emerald-400/35 text-emerald-200">
            LOCAL-FIRST · NEON {outboxCount > 0 ? `QUEUED (${outboxCount})` : 'SYNCED'}
          </span>
          <button
            type="button"
            onClick={onOpenSpotlight}
            className="hud-btn hud-btn-cyan px-3 text-[10px]"
            aria-label="Open Spatial Command Palette (Cmd+K or Alt+Space)"
          >
            <span>⌘K / ALT+SPACE</span>
          </button>
        </div>
      </header>

      {/* Central Interactive Radial Dial + Flanking Readouts */}
      <div className="mt-4 grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_320px_1fr]">
        {/* Left Flanking Telemetry */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          <div className="hud-frame p-3">
            <div className="hud-micro-header">LOCAL CACHE / NEON SYNC</div>
            <div className="hud-kpi-value mt-1 text-lg font-black text-emerald-300">
              {outboxCount > 0 ? `${outboxCount} QUEUED` : 'STANDBY'}
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              Outbox: <span className="font-mono text-cyan-200">pmd_neon_sync_outbox_v1</span>
            </div>
          </div>

          <div className="hud-frame hud-frame-crimson p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="hud-micro-header">READINESS / CORES</span>
              <span className="font-mono text-[9px] uppercase text-amber-300">{readinessTruthClass}</span>
            </div>
            <div className="hud-kpi-value mt-1 text-lg font-black text-white">
              {readinessScore !== null ? `${readinessScore} / 100` : 'Unobserved'}
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              {readinessScore !== null
                ? 'Derived from local unified vitals; not clinician-reviewed.'
                : 'Record baseline vitals in Health Data (never coerced to zero).'}
            </div>
          </div>
        </div>

        {/* Center Radial AUGMA Dial */}
        <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center">
          <div className="relative h-[284px] w-full max-w-[320px]">
            <svg
              viewBox="0 0 320 284"
              className="h-full w-full"
              role="img"
              aria-label="Panacea Oculus radial orbital ring"
            >
              <defs>
                <radialGradient id="hudOculusGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.34" />
                  <stop offset="55%" stopColor="#ff2d46" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#050608" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="160" cy="154" r="118" fill="url(#hudOculusGlow)" />

              {/* Outer Tactical Calibration Arc */}
              <circle
                cx="160"
                cy="154"
                r="108"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
                strokeDasharray="4 6"
                className="hud-orbit-slow"
              />
              <circle
                cx="160"
                cy="154"
                r="86"
                fill="none"
                stroke={deck.modeProfile.accent.primaryHex}
                strokeOpacity="0.65"
                strokeWidth="1.5"
                strokeDasharray="36 14 8 14"
                className="hud-orbit-reverse"
              />
              <circle
                cx="160"
                cy="154"
                r="62"
                fill="none"
                stroke="rgba(56,189,248,0.4)"
                strokeWidth="1"
              />

              {/* Radial guide spokes to top arc nodes */}
              {deck.arcNodes.map((node) => {
                const pos = ARC_COORDS[node.id]
                return (
                  <line
                    key={node.id}
                    x1="160"
                    y1="154"
                    x2={pos.x}
                    y2={pos.y}
                    stroke={node.active ? '#ff2d46' : 'rgba(56,189,248,0.22)'}
                    strokeWidth={node.active ? 1.5 : 1}
                    strokeDasharray={node.active ? undefined : '2 4'}
                  />
                )
              })}
            </svg>

            {/* Outer Segmented Arc Buttons */}
            {deck.arcNodes.map((node) => {
              const pos = ARC_COORDS[node.id]
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    setActiveArc(node.id)
                    navigate(node.route)
                  }}
                  aria-pressed={node.active}
                  style={{
                    left: `${(pos.x / 320) * 100}%`,
                    top: `${(pos.y / 284) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute flex min-h-[44px] min-w-[66px] items-center justify-center rounded-full border px-2.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition ${
                    node.active
                      ? 'border-[#ff2d46] bg-[#ff2d46]/25 text-white'
                      : 'border-white/20 bg-[#0a0c10]/90 text-slate-200 hover:border-cyan-400/70 hover:text-cyan-200'
                  }`}
                >
                  {node.label}
                </button>
              )
            })}

            {/* Central Reactive Panacea Oculus Core Orb */}
            <button
              type="button"
              onClick={() => setAskOpen((v) => !v)}
              aria-expanded={askOpen}
              aria-label="Activate Ask Panacea Oculus Core"
              style={{
                left: '50%',
                top: '54.2%',
                transform: 'translate(-50%, -50%)',
              }}
              className="hud-oculus-core absolute flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full text-center"
            >
              <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-cyan-200 uppercase">
                OCULUS CORE
              </span>
              <span className="mt-0.5 text-xs font-black tracking-wide text-white">
                ASK PANACEA
              </span>
              <span className="mt-1 font-mono text-[9px] text-rose-200">
                {deck.modeProfile.accent.badgeLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Right Flanking Vitals Stream */}
        <div className="hud-frame hud-frame-emerald p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="hud-micro-header">VITALS STREAM</span>
            <span className="font-mono text-[9px] uppercase text-emerald-300">
              {rhr !== null || hrv !== null || spo2 !== null ? 'measured' : 'unobserved'}
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
              <div className="hud-micro-header text-[9px]">RHR</div>
              <div className="hud-kpi-value mt-0.5 text-sm font-black">
                {rhr !== null ? `${rhr}` : '—'}
              </div>
              <div className="font-mono text-[9px] text-slate-400">bpm</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
              <div className="hud-micro-header text-[9px]">HRV</div>
              <div className="hud-kpi-value mt-0.5 text-sm font-black text-cyan-300">
                {hrv !== null ? `${hrv}` : '—'}
              </div>
              <div className="font-mono text-[9px] text-slate-400">ms</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
              <div className="hud-micro-header text-[9px]">SpO2</div>
              <div className="hud-kpi-value mt-0.5 text-sm font-black text-emerald-300">
                {spo2 !== null ? `${spo2}%` : '—'}
              </div>
              <div className="font-mono text-[9px] text-slate-400">sat</div>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-slate-300">
            {deck.modeProfile.directive}
          </p>
        </div>
      </div>

      {/* Inline Ask Panacea Voice/Text Drawer */}
      {askOpen && (
        <div className="hud-frame mt-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="hud-micro-header text-cyan-300">
              ASK PANACEA · VOICE / TEXT COMMAND (EDUCATIONAL · NOT CLINICIAN-REVIEWED)
            </span>
            <button
              type="button"
              onClick={triggerVoiceInput}
              className={`hud-btn px-3 text-[10px] ${voiceActive ? 'hud-btn-active' : 'hud-btn-cyan'}`}
            >
              {voiceActive ? 'LISTENING…' : '🎙 VOICE'}
            </button>
          </div>
          <form
            className="mt-2 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              submitAsk(askQuery)
            }}
          >
            <input
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="Ask about Digital Twin, Fascia Chain, HRV, SKDI, or Neon Sync..."
              className="min-h-[44px] flex-1 rounded-lg border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
            />
            <button type="submit" className="hud-btn hud-btn-active px-4">
              EXECUTE
            </button>
          </form>
          {askReply && (
            <p className="mt-2 rounded-lg border border-cyan-400/25 bg-cyan-950/30 p-2.5 text-xs leading-relaxed text-slate-200">
              {askReply}
            </p>
          )}
        </div>
      )}

      {/* Mode Selector Bar */}
      <div
        role="tablist"
        aria-label="Command Operating Modes"
        className="mt-4 grid grid-cols-5 gap-1.5"
      >
        {COMMAND_MODES.map((m) => {
          const active = m === mode
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onModeChange(m)}
              className={`hud-btn px-1 text-[10px] ${active ? 'hud-btn-active' : ''}`}
            >
              <span className="truncate">{m}</span>
            </button>
          )
        })}
      </div>

      {/* Indexed 01–08 Tactical Grid */}
      <nav aria-label="Indexed 01 to 08 Tactical Launchers" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {deck.launcherSlots.map((slot) => (
          <Link
            key={slot.index}
            to={slot.route}
            className={`hud-frame flex min-h-[54px] flex-col justify-between p-2.5 no-underline transition hover:border-cyan-400/60 ${
              slot.emphasized ? 'hud-frame-crimson border-rose-500/45' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[10px] font-black text-cyan-300">{slot.index}</span>
              <span className="font-mono text-[9px] tracking-[0.12em] text-slate-400 uppercase">{slot.domain}</span>
            </div>
            <div className="mt-1 font-mono text-xs font-bold tracking-[0.08em] text-white">
              {slot.label}
            </div>
          </Link>
        ))}
      </nav>
    </section>
  )
}
