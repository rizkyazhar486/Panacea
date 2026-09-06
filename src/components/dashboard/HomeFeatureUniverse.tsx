import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WIDGETS } from '../../lib/homeWidgets'
import { rupa } from '../../lib/kategoriRupa'
import { getVitals } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import { getUsageCounts } from '../../lib/usage'
import { buildHumanPassport } from '../../lib/humanPassport'
import { LifeWealthCompass } from './LifeWealthCompass'

const LIFE_WEALTH = [
  { to: '/life-compass', emoji: '⏳', title: 'Time', hint: 'Attention, autonomy, direction', tone: 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-100' },
  { to: '/tubuh', emoji: '❤️', title: 'Health', hint: 'Capacity, recovery, independence', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100' },
  { to: '/keuangan', emoji: '💰', title: 'Money', hint: 'Cashflow, saving, resilience', tone: 'bg-lime-100 text-lime-900 dark:bg-lime-400/15 dark:text-lime-100' },
  { to: '/learn', emoji: '📚', title: 'Knowledge', hint: 'Ideas, skills, medicine, stories', tone: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-100' },
  { to: '/community', emoji: '🤝', title: 'Social', hint: 'Friends, belonging, reciprocity', tone: 'bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-100' },
  { to: '/my-story', emoji: '🏡', title: 'Family', hint: 'Presence, care, legacy', tone: 'bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100' },
  { to: '/planning', emoji: '🏆', title: 'Career', hint: 'Role, skill, contribution', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100' },
] as const

const ADVANCED = [
  { to: '/body-explorer?mode=realistic-atlas', emoji: '🫀', title: 'Reference Anatomy', hint: 'Real 3D anatomy atlas' },
  { to: '/body-explorer?mode=digital-twin', emoji: '🔬', title: 'Body → Cell', hint: 'Organ, tissue, cell and pathway' },
  { to: '/knowledge-bridge', emoji: '🧠', title: 'Explanation Depth', hint: 'Simple → technical understanding' },
  { to: '/health-data', emoji: '🪪', title: 'Human Passport', hint: 'Longitudinal identity from real data' },
  { to: '/frontier-health', emoji: '✨', title: 'Frontier Seven', hint: 'Experimental Life OS concepts' },
  { to: '/health-simulator', emoji: '🔮', title: 'What-if', hint: 'Explore alternative health trajectories' },
  { to: '/radiology', emoji: '🩻', title: 'Radiology', hint: 'Imaging viewer and education' },
] as const

const PIN_KEY = 'pmd-feature-dock-v1'
const DEFAULT_PINS = ['latihan', 'nutrisi', 'tidur', 'mentalHealth', 'lifeStory', 'keuangan', 'edukasiAwam', 'bodyExplorer']
const PAGE_SIZE = 18

function readPins(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PIN_KEY) || '[]')
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_PINS
    return raw.filter((id): id is string => typeof id === 'string' && WIDGETS.some((widget) => widget.id === id)).slice(0, 12)
  } catch {
    return DEFAULT_PINS
  }
}

export function HomeFeatureUniverse() {
  const [category, setCategory] = useState('All')
  const [version, setVersion] = useState(0)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [pins, setPins] = useState<string[]>(readPins)

  useEffect(() => {
    const update = () => setVersion((v) => v + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  const passport = useMemo(
    () => buildHumanPassport(getVitals(), getWorkouts(), getUsageCounts()),
    [version],
  )

  const categories = useMemo(() => {
    const count = new Map<string, number>()
    for (const widget of WIDGETS) count.set(widget.kategori, (count.get(widget.kategori) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const filtered = useMemo(
    () => category === 'All' ? WIDGETS : WIDGETS.filter((widget) => widget.kategori === category),
    [category],
  )
  const visible = filtered.slice(0, limit)
  const pinned = pins.map((id) => WIDGETS.find((widget) => widget.id === id)).filter((widget): widget is (typeof WIDGETS)[number] => Boolean(widget))

  function chooseCategory(next: string) {
    setCategory(next)
    setLimit(PAGE_SIZE)
  }

  function togglePin(id: string) {
    setPins((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-12)
      try { localStorage.setItem(PIN_KEY, JSON.stringify(next)) } catch { /* local preference only */ }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">Panacea for life</div>
            <h2 className="mt-0.5 text-[17px] font-black tracking-tight text-neutral-950 dark:text-white">Seven kinds of wealth</h2>
          </div>
          <Link to="/learn" className="text-[10px] font-black text-fuchsia-700 dark:text-fuchsia-300">Life library ›</Link>
        </div>
        <div className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {LIFE_WEALTH.map((item) => (
            <Link key={item.title} to={item.to} className="w-[154px] shrink-0 snap-start active:scale-[.98]">
              <article className={`min-h-[128px] rounded-[24px] p-3.5 shadow-sm ${item.tone}`}>
                <div className="text-2xl" aria-hidden>{item.emoji}</div>
                <div className="mt-4 text-[14px] font-black leading-none">{item.title}</div>
                <p className="mt-2 text-[10px] font-semibold leading-snug opacity-70">{item.hint}</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <LifeWealthCompass />

      <section>
        <div className="mb-2 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">Advanced Panacea</div>
            <h2 className="mt-0.5 text-[17px] font-black tracking-tight text-neutral-950 dark:text-white">Go deeper only when you want to</h2>
          </div>
          <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
            Passport {passport.unlockedCount}/6
          </div>
        </div>
        <div className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {ADVANCED.map((item) => (
            <Link key={item.title} to={item.to} className="w-[188px] shrink-0 snap-start rounded-[24px] border border-neutral-200 bg-white/95 p-3.5 shadow-[0_8px_24px_rgba(20,35,45,.06)] active:scale-[.98] dark:border-white/10 dark:bg-[#111315]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl" aria-hidden>{item.emoji}</span>
                <span className="text-neutral-400" aria-hidden>→</span>
              </div>
              <div className="mt-4 text-[13px] font-black leading-tight text-neutral-950 dark:text-white">{item.title}</div>
              <p className="mt-1.5 text-[10px] font-medium leading-snug text-neutral-600 dark:text-neutral-300">{item.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-[0_12px_35px_rgba(25,45,55,.05)] dark:border-white/10 dark:bg-white/[.035] sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">Feature dock</div>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">Your whole Panacea, from Home</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">Every catalog feature has a compact Home widget. Pin up to 12 without turning the dashboard into a wall of cards.</p>
          </div>
          <Link to="/semua-fitur" className="shrink-0 rounded-full bg-neutral-950 px-3 py-2 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Browse all</Link>
        </div>

        {pinned.length > 0 && (
          <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2" aria-label="Pinned Panacea features">
            {pinned.map((widget) => {
              const visual = rupa(widget.kategori)
              return (
                <article key={widget.id} className="relative w-[166px] shrink-0 snap-start rounded-[22px] border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#111315]">
                  <button onClick={() => togglePin(widget.id)} className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-[12px] font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-300" aria-label={`Unpin ${widget.label}`}>×</button>
                  <Link to={widget.ke} className="block active:scale-[.99]">
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl text-lg ${visual.bg}`} aria-hidden>{widget.emoji}</span>
                    <div className="mt-3 line-clamp-2 pr-4 text-[12px] font-black leading-tight text-neutral-950 dark:text-white">{widget.label}</div>
                    <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-snug text-neutral-600 dark:text-neutral-300">{widget.ringkas}</p>
                    <div className="mt-3 text-[9px] font-black text-neutral-400">OPEN →</div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button onClick={() => chooseCategory('All')} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${category === 'All' ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200'}`}>
            All {WIDGETS.length}
          </button>
          {categories.map(([name, count]) => {
            const visual = rupa(name)
            return (
              <button key={name} onClick={() => chooseCategory(name)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${category === name ? `${visual.bg} ${visual.teks}` : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200'}`}>
                {visual.emoji} {visual.label} {count}
              </button>
            )
          })}
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {visible.map((widget) => {
            const visual = rupa(widget.kategori)
            const isPinned = pins.includes(widget.id)
            return (
              <article key={widget.id} className="relative w-[176px] shrink-0 snap-start rounded-[22px] border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#111315]">
                <button
                  onClick={() => togglePin(widget.id)}
                  className={`absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full text-[12px] font-black transition ${isPinned ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}
                  aria-label={isPinned ? `Unpin ${widget.label}` : `Pin ${widget.label} to Home`}
                >
                  {isPinned ? '✓' : '+'}
                </button>
                <Link to={widget.ke} className="group block active:scale-[.99]">
                  <span className={`grid h-10 w-10 place-items-center rounded-2xl text-lg ${visual.bg}`} aria-hidden>{widget.emoji}</span>
                  <div className="mt-3 line-clamp-2 pr-4 text-[12px] font-black leading-tight text-neutral-950 dark:text-white">{widget.label}</div>
                  <p className="mt-1.5 line-clamp-3 text-[10px] font-medium leading-snug text-neutral-600 dark:text-neutral-300">{widget.ringkas}</p>
                  <div className="mt-3 text-[9px] font-black text-neutral-400 transition group-hover:text-neutral-700 dark:group-hover:text-white">OPEN →</div>
                </Link>
              </article>
            )
          })}
        </div>

        {limit < filtered.length && (
          <button onClick={() => setLimit((value) => Math.min(filtered.length, value + PAGE_SIZE))} className="mt-1 rounded-full bg-neutral-100 px-3.5 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
            Show {Math.min(PAGE_SIZE, filtered.length - limit)} more
          </button>
        )}
      </section>
    </div>
  )
}

export default HomeFeatureUniverse
