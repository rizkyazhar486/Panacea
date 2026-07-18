import { useEffect, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Breathwork Pacer — an animated breathing coach. Slow, paced breathing
// (~5-6 breaths/min) raises heart-rate variability and shifts the autonomic
// balance toward the parasympathetic ("rest & digest") state; the
// physiological sigh is the fastest known way to offload CO₂ and calm acutely
// (Balban et al., Cell Reports Medicine 2023). Pure client-side animation +
// localStorage streak. No external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Phase { label: string; sec: number }
interface Protocol { id: string; name: string; desc: string; phases: Phase[] }

const PROTOCOLS: Protocol[] = [
  { id: 'box', name: 'Box breathing', desc: 'Equal 4-4-4-4 — steady focus, used by clinicians and Navy SEALs.', phases: [
    { label: 'Breathe in', sec: 4 }, { label: 'Hold', sec: 4 }, { label: 'Breathe out', sec: 4 }, { label: 'Hold', sec: 4 },
  ] },
  { id: '478', name: '4-7-8 relaxing breath', desc: 'Long exhale to wind down before sleep (Weil).', phases: [
    { label: 'Breathe in', sec: 4 }, { label: 'Hold', sec: 7 }, { label: 'Breathe out', sec: 8 },
  ] },
  { id: 'coherence', name: 'Coherence 5.5', desc: '~5.5 breaths/min — the resonance frequency that maximizes HRV.', phases: [
    { label: 'Breathe in', sec: 5.5 }, { label: 'Breathe out', sec: 5.5 },
  ] },
  { id: 'sigh', name: 'Physiological sigh', desc: 'Double inhale + long exhale — fastest acute calm (Balban 2023).', phases: [
    { label: 'Inhale', sec: 3 }, { label: 'Second short inhale', sec: 1 }, { label: 'Long exhale', sec: 6 },
  ] },
]

const LS_KEY = 'pmd_breathwork_v1'
function loadStreak(): { last: string; days: number } {
  try { return { last: '', days: 0, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') } } catch { return { last: '', days: 0 } }
}

export function Breathwork() {
  const [proto, setProto] = useState<Protocol>(PROTOCOLS[0])
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0) // seconds within phase
  const [totalSec, setTotalSec] = useState(0)
  const [streak, setStreak] = useState(loadStreak)
  const raf = useRef<number | null>(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now() - elapsed * 1000
    const tick = () => {
      const now = performance.now()
      const e = (now - startRef.current) / 1000
      const phase = proto.phases[phaseIdx]
      if (e >= phase.sec) {
        const next = (phaseIdx + 1) % proto.phases.length
        setPhaseIdx(next)
        startRef.current = now
        setElapsed(0)
      } else {
        setElapsed(e)
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx, proto])

  // separate 1s total timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTotalSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  const phase = proto.phases[phaseIdx]
  const progress = Math.min(elapsed / phase.sec, 1)
  const isIn = /in|inhale/i.test(phase.label)
  const isOut = /out|exhale/i.test(phase.label)
  // Circle scales up on inhale, down on exhale, holds steady on hold.
  const scale = isIn ? 0.55 + 0.45 * progress : isOut ? 1 - 0.45 * progress : (phaseIdx > 0 && /in/i.test(proto.phases[phaseIdx - 1].label) ? 1 : 0.55)

  const start = () => {
    setPhaseIdx(0); setElapsed(0); setTotalSec(0); setRunning(true)
  }
  const finish = () => {
    setRunning(false)
    const today = new Date().toISOString().slice(0, 10)
    if (streak.last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const days = streak.last === yesterday ? streak.days + 1 : 1
      const next = { last: today, days }
      setStreak(next)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    }
  }

  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Breathwork Pacer" subtitle="Paced breathing to calm your nervous system in minutes" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Slow breathing at ~5-6 breaths/min raises heart-rate variability and activates the
          parasympathetic "rest &amp; digest" response. Follow the circle — expand as you breathe in,
          shrink as you breathe out.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PROTOCOLS.map((p) => (
            <button key={p.id} onClick={() => { setProto(p); setRunning(false) }} className={`rounded-xl px-3 py-2 text-left text-[12px] font-bold transition ${proto.id === p.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">{proto.desc}</p>
      </Card>

      <Card className="!p-5">
        <div className="flex flex-col items-center py-4">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <div
              className="absolute rounded-full bg-brand/20"
              style={{ width: 220, height: 220, transform: `scale(${scale})`, transition: 'transform 120ms linear' }}
            />
            <div
              className="absolute rounded-full border-4 border-brand/40"
              style={{ width: 220, height: 220, transform: `scale(${scale})`, transition: 'transform 120ms linear' }}
            />
            <div className="z-10 text-center">
              <div className="text-lg font-black text-brand-dark">{running ? phase.label : 'Ready'}</div>
              <div className="text-[12px] text-neutral-400">{running ? `${Math.ceil(phase.sec - elapsed)}s` : proto.name}</div>
            </div>
          </div>
          <div className="mt-3 text-sm font-black tabular-nums text-neutral-500">{mm}:{ss}</div>
          <div className="mt-3 flex gap-3">
            {!running ? (
              <button onClick={start} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white">Start</button>
            ) : (
              <button onClick={finish} className="rounded-xl border-2 border-brand px-6 py-2.5 text-sm font-bold text-brand-dark">Finish session</button>
            )}
          </div>
        </div>
      </Card>

      <Card className="!p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-ink dark:text-white">🔥 Daily streak</div>
          <p className="text-[11px] text-neutral-500">Finish one session a day to keep it alive.</p>
        </div>
        <Badge tone={streak.days > 0 ? 'brand' : 'low'}>{streak.days} day{streak.days === 1 ? '' : 's'}</Badge>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Balban, M.Y., et al. (2023). Brief structured respiration practices enhance mood and reduce
        physiological arousal. <i>Cell Reports Medicine</i>, 4(1), 100895. Wellness tool — not a
        treatment for panic disorder or respiratory disease.
      </div>
    </div>
  )
}

export default Breathwork
