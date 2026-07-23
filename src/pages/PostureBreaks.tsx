import { useEffect, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconTimer } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Posture & Desk-Break Reminder — a simple interval timer that nudges you to
// stand, stretch, or rest your eyes (20-20-20 rule) while working. Runs
// entirely client-side (setInterval + optional browser Notification), no
// external API. Break count persists locally per day.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_posture_breaks_v1'
const INTERVALS = [20, 30, 45, 60]

const TIPS = [
  { emoji: '🧍', title: 'Stand & reset your posture', text: 'Stand up, roll your shoulders back, and gently tuck your chin — screen posture drifts forward without you noticing.' },
  { emoji: '👀', title: '20-20-20 for your eyes', text: 'Look at something 20 feet (6m) away for 20 seconds. Reduces digital eye strain from sustained close focus.' },
  { emoji: '🙆', title: 'Stretch your neck & wrists', text: 'Slow neck tilts side to side, and wrist circles — counters the static load of typing/scrolling posture.' },
  { emoji: '🚶', title: 'Walk for a minute', text: 'A short walk resets circulation and is enough to measurably improve alertness after sitting.' },
]

interface Saved { intervalMin: number; breaksToday: number; day: string }
function load(): Saved {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      return s.day === today ? s : { intervalMin: s.intervalMin || 30, breaksToday: 0, day: today }
    }
  } catch { /* ignore */ }
  return { intervalMin: 30, breaksToday: 0, day: today }
}
function persist(s: Saved) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 660
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* ignore — audio not critical */ }
}

export function PostureBreaks() {
  const [saved, setSaved] = useState(load)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(saved.intervalMin * 60)
  const [tipIndex, setTipIndex] = useState<number | null>(null)
  const [notifOk, setNotifOk] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { persist(saved) }, [saved])

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const idx = Math.floor(Math.random() * TIPS.length)
          setTipIndex(idx)
          beep()
          if (notifOk) {
            try { new Notification('Break time', { body: TIPS[idx].title }) } catch { /* ignore */ }
          }
          setSaved((sv) => ({ ...sv, breaksToday: sv.breaksToday + 1 }))
          return saved.intervalMin * 60
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, saved.intervalMin, notifOk])

  const setInterval_ = (min: number) => {
    setSaved((s) => ({ ...s, intervalMin: min }))
    setSecondsLeft(min * 60)
  }

  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifOk(perm === 'granted')
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Posture & Desk-Break Reminder" subtitle="A gentle nudge to stand, stretch, or rest your eyes" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Sustained sitting and screen focus are two of the easiest-to-fix daily habits. Pick an
          interval, keep this tab open (or allow notifications), and get a reminder with a specific
          micro-break to do.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERVALS.map((m) => (
            <button key={m} onClick={() => setInterval_(m)} disabled={running} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition disabled:opacity-50 ${saved.intervalMin === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
              Every {m} min
            </button>
          ))}
        </div>
        {!notifOk && (
          <button onClick={requestNotif} className="mt-3 w-full rounded-xl bg-neutral-100 py-2 text-[12px] font-bold text-neutral-500 dark:bg-white/10">
            Enable browser notifications (optional — works without it if this tab stays open)
          </button>
        )}
      </Card>

      <Card className="!p-6 text-center">
        <div className="text-5xl font-black tabular-nums text-brand-dark">{mm}:{ss}</div>
        <div className="mt-1 text-[12px] font-bold uppercase tracking-wide text-neutral-400">Until next break</div>
        <button
          onClick={() => setRunning((r) => !r)}
          className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition ${running ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-brand text-white'}`}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-neutral-500">
          Breaks today: <Badge tone="brand">{saved.breaksToday}</Badge>
        </div>
      </Card>

      {tipIndex !== null && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your break</div>
          <div className="mt-2 flex items-start gap-3">
            <span className="text-3xl">{TIPS[tipIndex].emoji}</span>
            <div>
              <div className="text-[15px] font-black text-ink dark:text-white">{TIPS[tipIndex].title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{TIPS[tipIndex].text}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        The timer only runs while this page/tab is open (or via browser notification if enabled) —
        it's a nudge, not a guaranteed background service. Break count resets daily.
      </div>
    </div>
  )
}

export default PostureBreaks
