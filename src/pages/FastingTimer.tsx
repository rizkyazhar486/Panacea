import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconTimer, IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Fasting & Autophagy Timer — maps to several longevity-list features (autophagy
// fasting engine, fasting-window metabolic-state tracker, intermittent-fasting
// tracker). Tracks a live fast and shows which metabolic phase the body is
// likely in, based on hours elapsed. Educational estimates from the general
// physiology of fasting — individual timing varies with the last meal, activity,
// and metabolism. Start time persists locally so the timer survives reloads.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'pmd_fast_start_v1'
const PLAN_KEY = 'pmd_fast_plan_v1'

const PLANS = [
  { id: '16:8', label: '16:8', fastH: 16 },
  { id: '18:6', label: '18:6', fastH: 18 },
  { id: '20:4', label: '20:4', fastH: 20 },
  { id: 'omad', label: 'OMAD (23:1)', fastH: 23 },
]

// Metabolic phases across a fast (approximate, well-cited physiology).
const PHASES = [
  { from: 0, to: 4, name: 'Fed / anabolic', emoji: '🍽️', note: 'Digesting & storing — insulin high, blood glucose rising then normalising.' },
  { from: 4, to: 12, name: 'Post-absorptive', emoji: '🔄', note: 'Glycogen becomes the main fuel; insulin falling.' },
  { from: 12, to: 16, name: 'Fat-burning / early ketosis', emoji: '🔥', note: 'Glycogen low, the body shifts to fat and starts producing ketones.' },
  { from: 16, to: 24, name: 'Autophagy rising', emoji: '♻️', note: 'Cellular "clean-up" (autophagy) increases as ketones climb.' },
  { from: 24, to: 72, name: 'Deep autophagy', emoji: '🧬', note: 'Autophagy & fat oxidation elevated. Longer fasts should be done with medical guidance.' },
]

function phaseAt(h: number) { return PHASES.find((p) => h >= p.from && h < p.to) ?? PHASES[PHASES.length - 1] }
function fmt(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60), m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function FastingTimer() {
  const [start, setStart] = useState<number | null>(() => { try { const v = Number(localStorage.getItem(KEY)); return v > 0 ? v : null } catch { return null } })
  const [plan, setPlan] = useState<string>(() => { try { return localStorage.getItem(PLAN_KEY) || '16:8' } catch { return '16:8' } })
  const [now, setNow] = useState(Date.now())

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  function toggle() {
    if (start) { setStart(null); try { localStorage.removeItem(KEY) } catch { /* ignore */ } }
    else { const t = Date.now(); setStart(t); try { localStorage.setItem(KEY, String(t)) } catch { /* ignore */ } }
  }
  function choosePlan(id: string) { setPlan(id); try { localStorage.setItem(PLAN_KEY, id) } catch { /* ignore */ } }

  const planObj = PLANS.find((p) => p.id === plan) ?? PLANS[0]
  const elapsedMs = start ? now - start : 0
  const elapsedH = elapsedMs / 3_600_000
  const phase = phaseAt(elapsedH)
  const pct = start ? Math.min(100, (elapsedH / planObj.fastH) * 100) : 0
  const reached = start && elapsedH >= planObj.fastH
  const remainingMs = start ? Math.max(0, planObj.fastH * 3_600_000 - elapsedMs) : 0

  const color = !start ? '#a3a3a3' : reached ? '#00BF63' : elapsedH >= 12 ? '#f59e0b' : '#3b82f6'

  const nextPhase = useMemo(() => PHASES.find((p) => p.from > elapsedH), [elapsedH])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Fasting & Autophagy Timer" subtitle="Track a fast and see which metabolic phase your body is likely in" />

        {/* Plan picker */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => choosePlan(p.id)}
              className={'rounded-full px-3 py-1.5 text-xs font-bold transition ' + (plan === p.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-300')}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="mt-5 flex flex-col items-center">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <svg width="180" height="180" className="-rotate-90">
              <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
              <circle cx="90" cy="90" r="78" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 78} strokeDashoffset={2 * Math.PI * 78 * (1 - pct / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 8px ${color}55)` }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-3xl font-black" style={{ color }}>{start ? fmt(elapsedMs) : '—'}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{start ? `of ${planObj.fastH}h` : 'not fasting'}</div>
              </div>
            </div>
          </div>

          {start && (
            <div className="mt-3 text-center">
              <div className="text-2xl">{phase.emoji}</div>
              <div className="text-sm font-black text-ink dark:text-white">{phase.name}</div>
              <Badge tone={reached ? 'brand' : 'low'}>{reached ? 'Goal reached 🎉' : `${fmt(remainingMs)} to goal`}</Badge>
            </div>
          )}

          <button onClick={toggle} className={'mt-5 w-full max-w-xs rounded-2xl py-3.5 text-base font-bold text-white transition active:scale-95 ' + (start ? 'bg-rose-500' : 'bg-brand')}>
            {start ? 'End fast' : 'Start fasting'}
          </button>
        </div>
      </Card>

      {/* Current phase detail + next */}
      {start && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="What's happening now" />
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{phase.emoji} <b>{phase.name}.</b> {phase.note}</p>
          {nextPhase && (
            <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-[12px] text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
              Next: <b>{nextPhase.emoji} {nextPhase.name}</b> at ~{nextPhase.from}h ({fmt(nextPhase.from * 3_600_000 - elapsedMs)} away).
            </p>
          )}
        </Card>
      )}

      {/* Phase reference */}
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Metabolic phases of a fast" />
        <div className="mt-3 space-y-2">
          {PHASES.map((p) => (
            <div key={p.name} className={'rounded-xl border p-3 ' + (start && elapsedH >= p.from && elapsedH < p.to ? 'border-brand bg-brand-50 dark:bg-white/5' : 'border-neutral-100 dark:border-white/10')}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink dark:text-white">{p.emoji} {p.name}</span>
                <span className="text-[11px] font-bold text-neutral-400">{p.from}–{p.to === 72 ? '24+' : p.to}h</span>
              </div>
              <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">{p.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimates from general fasting physiology — the exact timing of ketosis and autophagy varies per person. Intermittent fasting isn't suitable for everyone (pregnancy, diabetes on medication, eating-disorder history, children). Fasts beyond ~24h and any use with a medical condition should be supervised by a clinician.
      </div>
    </div>
  )
}

export default FastingTimer
