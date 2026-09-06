import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type ShellProps = {
  eyebrow: string
  title: string
  emoji: string
  children: React.ReactNode
  className?: string
}

function WidgetShell({ eyebrow, title, emoji, children, className = '' }: ShellProps) {
  return (
    <article className={`flex min-h-[188px] flex-col rounded-[26px] border border-neutral-200 bg-white/95 p-4 shadow-[0_12px_32px_rgba(20,35,45,.06)] dark:border-white/10 dark:bg-[#111315] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">{eyebrow}</div>
          <h3 className="mt-1 text-[15px] font-black leading-tight tracking-[-.02em] text-neutral-950 dark:text-white">{title}</h3>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-xl dark:bg-white/10" aria-hidden>{emoji}</span>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
    </article>
  )
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function shiftDate(key: string, delta: number) {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + delta, 12, 0, 0))
}

function readStringArray(key: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

const MISSION_KEY = 'pmd_daily_mission_done_v1'
const MISSIONS = [
  { emoji: '💰', area: 'Money', title: 'Review one recurring expense you no longer value.', time: '5 min', to: '/keuangan' },
  { emoji: '🏆', area: 'Career', title: 'Spend 20 focused minutes on one skill that compounds.', time: '20 min', to: '/planning' },
  { emoji: '🏡', area: 'Family', title: 'Give one person ten minutes of undivided attention.', time: '10 min', to: '/my-story' },
  { emoji: '⏳', area: 'Time', title: 'Remove or shorten one low-value task from today.', time: '5 min', to: '/life-compass' },
  { emoji: '❤️', area: 'Health', title: 'Take a short walk or mobility break that fits your day.', time: '10 min', to: '/latihan' },
  { emoji: '🤝', area: 'Social', title: 'Send one genuine check-in without asking for anything.', time: '3 min', to: '/community' },
  { emoji: '📚', area: 'Knowledge', title: 'Read one useful idea and write the sentence you want to keep.', time: '10 min', to: '/learn' },
  { emoji: '🌙', area: 'Recovery', title: 'Decide tonight’s wind-down time before the evening gets busy.', time: '2 min', to: '/recovery' },
  { emoji: '🧭', area: 'Direction', title: 'Write the single outcome that would make today feel worthwhile.', time: '2 min', to: '/planning' },
  { emoji: '🫶', area: 'Contribution', title: 'Do one useful thing for someone with no need for credit.', time: '5 min', to: '/community' },
  { emoji: '📝', area: 'Reflection', title: 'Record one small win before you forget it.', time: '2 min', to: '/my-story' },
  { emoji: '🧹', area: 'Friction', title: 'Make one good habit easier by removing a single obstacle.', time: '5 min', to: '/change' },
] as const

function missionForToday() {
  const key = localDateKey()
  const seed = key.replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0)
  return MISSIONS[seed % MISSIONS.length]
}

function streakFrom(history: string[]) {
  const set = new Set(history)
  let cursor = localDateKey()
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

export function UbinDailyMission({ compact = false }: { compact?: boolean }) {
  const today = localDateKey()
  const mission = useMemo(missionForToday, [])
  const [history, setHistory] = useState<string[]>(() => readStringArray(MISSION_KEY))
  const done = history.includes(today)
  const streak = streakFrom(history)

  const toggle = () => {
    const next = done ? history.filter((d) => d !== today) : [...new Set([...history, today])]
    setHistory(next)
    try { localStorage.setItem(MISSION_KEY, JSON.stringify(next.slice(-365))) } catch { /* local habit state only */ }
  }

  return (
    <WidgetShell eyebrow="Panacea Daily" title="One useful move, not twenty tasks" emoji={mission.emoji} className={compact ? 'h-full' : ''}>
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        <span>{mission.area}</span><span>•</span><span>{mission.time}</span>{streak > 0 && <><span>•</span><span>{streak} day streak</span></>}
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-relaxed text-neutral-750 dark:text-neutral-200">{mission.title}</p>
      <div className="mt-auto flex items-center gap-2 pt-3">
        <button onClick={toggle} className={`rounded-full px-3.5 py-2 text-[10px] font-black transition active:scale-95 ${done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200' : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'}`}>
          {done ? '✓ Done today' : 'Mark done'}
        </button>
        <Link to={mission.to} className="rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Open tool ›</Link>
      </div>
    </WidgetShell>
  )
}

const LIFE_KEY = 'pmd_life_wealth_compass_v1'
const LIFE = [
  { id: 'money', emoji: '💰', label: 'Money', bar: 'bg-lime-500' },
  { id: 'career', emoji: '🏆', label: 'Career', bar: 'bg-amber-500' },
  { id: 'family', emoji: '🏡', label: 'Family', bar: 'bg-rose-500' },
  { id: 'time', emoji: '⏳', label: 'Time', bar: 'bg-sky-500' },
  { id: 'health', emoji: '❤️', label: 'Health', bar: 'bg-emerald-500' },
  { id: 'social', emoji: '🤝', label: 'Social', bar: 'bg-violet-500' },
] as const

type LifeScores = Record<string, number>

function loadLifeScores(): LifeScores | null {
  try {
    const raw = localStorage.getItem(LIFE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LifeScores
    const out: LifeScores = {}
    for (const item of LIFE) {
      const value = Number(parsed[item.id])
      if (!Number.isFinite(value)) return null
      out[item.id] = Math.min(10, Math.max(0, value))
    }
    return out
  } catch {
    return null
  }
}

export function UbinLifeWealthPulse({ compact = false }: { compact?: boolean }) {
  const [scores, setScores] = useState<LifeScores | null>(() => loadLifeScores())
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const sync = () => setScores(loadLifeScores())
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const stats = useMemo(() => {
    if (!scores) return null
    const values = LIFE.map((item) => scores[item.id] ?? 0)
    const min = Math.min(...values)
    const weakest = LIFE.find((item) => (scores[item.id] ?? 0) === min) ?? LIFE[0]
    return {
      average: values.reduce((sum, value) => sum + value, 0) / LIFE.length,
      gap: Math.max(...values) - min,
      weakest,
    }
  }, [scores])

  const begin = () => {
    if (!scores) setScores(Object.fromEntries(LIFE.map((item) => [item.id, 5])))
    setEditing(true)
  }

  const update = (id: string, value: number) => {
    setScores((old) => {
      const next = { ...(old ?? Object.fromEntries(LIFE.map((item) => [item.id, 5]))), [id]: value }
      try { localStorage.setItem(LIFE_KEY, JSON.stringify(next)) } catch { /* local self-rating only */ }
      return next
    })
  }

  return (
    <WidgetShell eyebrow="Life Wealth" title="Keep success from bankrupting another part of life" emoji="🧭" className={compact ? 'h-full' : ''}>
      {!scores ? (
        <>
          <p className="text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">Rate money, career, family, time, health and social connection from 0–10. It is a private self-rating, not a medical or financial score.</p>
          <button onClick={begin} className="mt-auto w-fit rounded-full bg-fuchsia-100 px-3.5 py-2 text-[10px] font-black text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-100">Set my six ratings</button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-1.5">
            {LIFE.map((item) => {
              const value = scores[item.id] ?? 0
              return (
                <div key={item.id} className="min-w-0 text-center">
                  <div className="text-[13px]" aria-hidden>{item.emoji}</div>
                  <div className="mt-1 h-12 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                    <div className={`w-full rounded-full ${item.bar}`} style={{ height: `${Math.max(5, value * 10)}%`, marginTop: `${100 - Math.max(5, value * 10)}%` }} />
                  </div>
                  <div className="mt-1 text-[9px] font-black tabular-nums text-neutral-700 dark:text-neutral-200">{value}</div>
                  {editing && <input aria-label={`${item.label} self-rating`} type="range" min="0" max="10" step="1" value={value} onChange={(e) => update(item.id, Number(e.target.value))} className="mt-1 h-1 w-full" />}
                </div>
              )
            })}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Average · gap</div>
              <div className="mt-0.5 text-[17px] font-black tabular-nums text-neutral-950 dark:text-white">{stats?.average.toFixed(1)}/10 <span className="text-[11px] text-neutral-400">· {stats?.gap.toFixed(0)} pts</span></div>
              <div className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">Attention: {stats?.weakest.emoji} {stats?.weakest.label}</div>
            </div>
            <button onClick={() => setEditing((x) => !x)} className="rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">{editing ? 'Done' : 'Tune'}</button>
          </div>
        </>
      )}
    </WidgetShell>
  )
}

type Win = { id: string; text: string; date: string }
const WINS_KEY = 'pmd_life_wins_v1'

function loadWins(): Win[] {
  try {
    const raw = JSON.parse(localStorage.getItem(WINS_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((x): x is Win => !!x && typeof x.id === 'string' && typeof x.text === 'string' && typeof x.date === 'string').slice(-30)
  } catch {
    return []
  }
}

export function UbinWeeklyWins() {
  const [wins, setWins] = useState<Win[]>(() => loadWins())
  const [text, setText] = useState('')
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const week = wins.filter((win) => new Date(`${win.date}T12:00:00`).getTime() >= cutoff)

  const add = () => {
    const cleaned = text.trim().slice(0, 120)
    if (!cleaned) return
    const next = [...wins, { id: `${Date.now()}`, text: cleaned, date: localDateKey() }].slice(-30)
    setWins(next)
    setText('')
    try { localStorage.setItem(WINS_KEY, JSON.stringify(next)) } catch { /* local journal only */ }
  }

  return (
    <WidgetShell eyebrow="Life Wins" title="Keep evidence that your week moved" emoji="🏅">
      <div className="flex items-end gap-2">
        <div className="text-[32px] font-black leading-none tabular-nums text-neutral-950 dark:text-white">{week.length}</div>
        <div className="pb-1 text-[10px] font-bold text-neutral-500 dark:text-neutral-400">wins in the last 7 days</div>
      </div>
      {week.length > 0 && <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-relaxed text-neutral-650 dark:text-neutral-300">Latest: “{week[week.length - 1].text}”</p>}
      <div className="mt-auto flex gap-2 pt-3">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }} placeholder="One small win…" maxLength={120} className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[10px] font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-white/10 dark:bg-white/[.06] dark:text-white" />
        <button onClick={add} className="rounded-full bg-neutral-950 px-3 py-2 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Add</button>
      </div>
    </WidgetShell>
  )
}

const SHARE_KEY = 'pmd_panacea_share_count_v1'

function readShareCount() {
  try { return Math.max(0, Number(localStorage.getItem(SHARE_KEY) || 0) || 0) } catch { return 0 }
}

export function UbinSharePanacea({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState(readShareCount)
  const [status, setStatus] = useState('')

  const share = async () => {
    const url = `${window.location.origin}/?utm_source=home&utm_medium=share&utm_campaign=medicine_for_life`
    const text = 'Panacea is a Life OS for health, time, money, learning, relationships and the rest of real life.'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Panacea — medicine for life', text, url })
        setStatus('Shared')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setStatus('Link copied')
      } else {
        window.prompt('Copy this Panacea link', url)
        setStatus('Ready to copy')
      }
      const next = count + 1
      setCount(next)
      try { localStorage.setItem(SHARE_KEY, String(next)) } catch { /* local counter only */ }
    } catch {
      setStatus('Share cancelled')
    }
  }

  return (
    <WidgetShell eyebrow="Share Panacea" title="A product people understand in one sentence" emoji="🚀" className={compact ? 'h-full' : ''}>
      <p className="text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">“Medicine for life” means health plus time, money, learning, relationships and daily decisions. Share the product without sharing any of your personal data.</p>
      <div className="mt-auto flex items-center gap-2 pt-3">
        <button onClick={share} className="rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition active:scale-95">Share Panacea</button>
        <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">{status || (count > 0 ? `${count} shares on this device` : 'Privacy-safe')}</span>
      </div>
    </WidgetShell>
  )
}

const SPOTLIGHTS = [
  { emoji: '🫀', title: 'Reference Anatomy', line: 'Explore a stable 3D body instead of a decorative model.', to: '/body-explorer', tag: '3D' },
  { emoji: '🪪', title: 'Human Passport', line: 'Turn longitudinal records into one coherent health identity.', to: '/health-data', tag: 'Identity' },
  { emoji: '🧬', title: 'Genomics Lab', line: 'Move from sequence and variants toward interpretable molecular context.', to: '/genomics-lab', tag: 'DNA' },
  { emoji: '🔬', title: 'Biomedical Engine', line: 'Connect disease mechanisms, targets and therapeutic thinking.', to: '/biomedical-engine-lab', tag: 'Research' },
  { emoji: '🏃', title: 'Workout 4D', line: 'See exercise as movement plus physiology, not a flat workout log.', to: '/workout-4d-lab', tag: 'Motion' },
  { emoji: '🧠', title: 'Knowledge Bridge', line: 'Move from simple explanation to technical depth without losing the thread.', to: '/knowledge-bridge', tag: 'Explain' },
  { emoji: '🩻', title: 'Radiology', line: 'Imaging tools and education connected to the rest of Panacea.', to: '/radiology', tag: 'Imaging' },
  { emoji: '✨', title: 'Frontier Health OS', line: 'See the experimental edge of Panacea in one place.', to: '/frontier-health', tag: 'Frontier' },
] as const

export function UbinFeatureSpotlight({ compact = false }: { compact?: boolean }) {
  const item = useMemo(() => {
    const seed = Number(localDateKey().replace(/-/g, ''))
    return SPOTLIGHTS[seed % SPOTLIGHTS.length]
  }, [])

  return (
    <WidgetShell eyebrow="Feature Spotlight" title={item.title} emoji={item.emoji} className={compact ? 'h-full' : ''}>
      <span className="w-fit rounded-full bg-cyan-100 px-2 py-1 text-[9px] font-black uppercase text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200">{item.tag}</span>
      <p className="mt-2 text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{item.line}</p>
      <Link to={item.to} className="mt-auto w-fit pt-3 text-[10px] font-black text-emerald-700 dark:text-emerald-300">Try today’s feature →</Link>
    </WidgetShell>
  )
}

const CAPTURES = [
  { emoji: '📝', label: 'Day', to: '/harian' },
  { emoji: '🏃', label: 'Workout', to: '/latihan' },
  { emoji: '💰', label: 'Money', to: '/keuangan' },
  { emoji: '📖', label: 'Story', to: '/my-story' },
  { emoji: '🤝', label: 'People', to: '/community' },
  { emoji: '💡', label: 'Learn', to: '/learn' },
] as const

export function UbinQuickCapture() {
  return (
    <WidgetShell eyebrow="Quick Capture" title="Put life in Panacea before it disappears" emoji="＋">
      <div className="grid grid-cols-3 gap-2">
        {CAPTURES.map((item) => (
          <Link key={item.label} to={item.to} className="rounded-2xl bg-neutral-100 px-2 py-2.5 text-center transition active:scale-95 dark:bg-white/[.07]">
            <div className="text-lg" aria-hidden>{item.emoji}</div>
            <div className="mt-1 text-[9px] font-black text-neutral-700 dark:text-neutral-200">{item.label}</div>
          </Link>
        ))}
      </div>
      <p className="mt-auto pt-2 text-[9px] font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">One tap to the right place; no giant form on Home.</p>
    </WidgetShell>
  )
}

export function PanaceaGrowthRail() {
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">Panacea now</div>
          <h2 className="mt-0.5 text-[15px] font-black tracking-tight text-neutral-950 dark:text-white">Useful today. Shareable tomorrow.</h2>
        </div>
        <Link to="/atur-fitur" className="shrink-0 text-[10px] font-black text-neutral-600 dark:text-neutral-300">More widgets ›</Link>
      </div>
      <div className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        <div className="w-[286px] shrink-0 snap-start"><UbinDailyMission compact /></div>
        <div className="w-[286px] shrink-0 snap-start"><UbinLifeWealthPulse compact /></div>
        <div className="w-[286px] shrink-0 snap-start"><UbinFeatureSpotlight compact /></div>
        <div className="w-[286px] shrink-0 snap-start"><UbinSharePanacea compact /></div>
      </div>
    </section>
  )
}

export default PanaceaGrowthRail
