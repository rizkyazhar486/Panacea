import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type Pillar = {
  id: string
  emoji: string
  label: string
  to: string
  tone: string
}

const PILLARS: Pillar[] = [
  { id: 'money', emoji: '💰', label: 'Money', to: '/keuangan', tone: 'accent-lime-600' },
  { id: 'career', emoji: '🏆', label: 'Career', to: '/planning', tone: 'accent-amber-600' },
  { id: 'family', emoji: '🏡', label: 'Family', to: '/my-story', tone: 'accent-rose-600' },
  { id: 'time', emoji: '⏳', label: 'Time', to: '/life-compass', tone: 'accent-sky-600' },
  { id: 'health', emoji: '❤️', label: 'Health', to: '/tubuh', tone: 'accent-emerald-600' },
  { id: 'social', emoji: '🤝', label: 'Social', to: '/community', tone: 'accent-violet-600' },
]

const KEY = 'pmd_life_wealth_compass_v1'

type Scores = Record<string, number>

function loadScores(): Scores {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}') as Scores
    return Object.fromEntries(PILLARS.map((p) => [p.id, Number.isFinite(parsed[p.id]) ? Math.min(10, Math.max(0, parsed[p.id])) : 5]))
  } catch {
    return Object.fromEntries(PILLARS.map((p) => [p.id, 5]))
  }
}

export function LifeWealthCompass() {
  const [scores, setScores] = useState<Scores>(() => loadScores())
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(scores)) } catch { /* local-only preference; ignore storage failures */ }
  }, [scores])

  const stats = useMemo(() => {
    const values = PILLARS.map((p) => scores[p.id] ?? 0)
    const average = values.reduce((sum, value) => sum + value, 0) / PILLARS.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const weakest = PILLARS.find((p) => (scores[p.id] ?? 0) === min) ?? PILLARS[0]
    return { average, gap: max - min, weakest }
  }, [scores])

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white/95 p-4 shadow-[0_12px_34px_rgba(20,35,45,.06)] dark:border-white/10 dark:bg-[#111315] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.15em] text-fuchsia-700 dark:text-fuchsia-300">Life Wealth Compass</div>
          <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">How rich does life feel right now?</h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">A private self-rating—not a diagnosis and not a financial recommendation. Rate each area from 0 to 10 and use the weakest area as a prompt for your next action.</p>
        </div>
        <button onClick={() => setEditing((x) => !x)} className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-800 dark:bg-white/10 dark:text-white">
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PILLARS.map((pillar) => {
          const value = scores[pillar.id] ?? 0
          return (
            <div key={pillar.id} className="rounded-[20px] bg-neutral-50 p-2.5 text-center dark:bg-white/[.045]">
              <div className="text-xl" aria-hidden>{pillar.emoji}</div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-neutral-600 dark:text-neutral-300">{pillar.label}</div>
              <div className="mt-1 text-[22px] font-black leading-none tabular-nums text-neutral-950 dark:text-white">{value}</div>
              {editing && (
                <input
                  aria-label={`${pillar.label} self-rating`}
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={value}
                  onChange={(e) => setScores((old) => ({ ...old, [pillar.id]: Number(e.target.value) }))}
                  className={`mt-2 h-1.5 w-full ${pillar.tone}`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_1fr_1.5fr]">
        <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-white dark:text-neutral-950">
          <div className="text-[8px] font-black uppercase tracking-[.12em] opacity-60">Self-rating average</div>
          <div className="mt-1 text-2xl font-black tabular-nums">{stats.average.toFixed(1)}<span className="text-xs opacity-50">/10</span></div>
          <div className="mt-1 text-[9px] font-semibold opacity-65">Σ six ratings ÷ 6</div>
        </div>
        <div className="rounded-2xl bg-neutral-100 p-3 dark:bg-white/10">
          <div className="text-[8px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">Balance gap</div>
          <div className="mt-1 text-2xl font-black tabular-nums text-neutral-950 dark:text-white">{stats.gap.toFixed(0)}<span className="text-xs text-neutral-500"> pts</span></div>
          <div className="mt-1 text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">highest − lowest</div>
        </div>
        <Link to={stats.weakest.to} className="flex items-center justify-between gap-3 rounded-2xl bg-fuchsia-50 p-3 text-fuchsia-950 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
          <div><div className="text-[8px] font-black uppercase tracking-[.12em] opacity-60">Next place to invest attention</div><div className="mt-1 text-[13px] font-black">{stats.weakest.emoji} {stats.weakest.label}</div><div className="mt-1 text-[9px] font-semibold opacity-70">Open the related Panacea tool</div></div>
          <span className="text-lg" aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

export default LifeWealthCompass
