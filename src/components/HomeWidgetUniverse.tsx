import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WIDGETS } from '../lib/homeWidgets'

const UNIVERSE = WIDGETS.slice(0, 200)
const CATEGORIES = ['All', ...Array.from(new Set(UNIVERSE.map((widget) => widget.kategori)))] as const

export function HomeWidgetUniverse() {
  const [category, setCategory] = useState<string>('All')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return UNIVERSE.filter((widget) => {
      if (category !== 'All' && widget.kategori !== category) return false
      if (!needle) return true
      return `${widget.label} ${widget.ringkas} ${widget.kategori}`.toLowerCase().includes(needle)
    })
  }, [category, query])

  return (
    <section
      className="relative mt-3 overflow-hidden rounded-[26px] border border-emerald-300/15 bg-[#030806] p-3.5 shadow-[0_24px_70px_rgba(0,0,0,.34)] sm:p-5"
      aria-labelledby="home-widget-universe-title"
    >
      <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-emerald-400/[.08] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-cyan-300/[.035] blur-3xl" aria-hidden />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.22em] text-emerald-300">Widget Universe · 200 real Panacea instruments</div>
          <h2 id="home-widget-universe-title" className="mt-1 text-[19px] font-black tracking-[-.025em] text-white sm:text-[22px]">
            Two rows. One swipeable universe.
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] font-semibold leading-relaxed text-white/55">
            These cards are generated from Panacea’s existing widget registry, so every tile points to a real workspace instead of a placeholder.
          </p>
        </div>
        <div className="rounded-[14px] border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-2 text-right">
          <div className="text-[8px] font-black uppercase tracking-[.18em] text-emerald-300">Visible</div>
          <div className="text-xl font-black tabular-nums text-white">{visible.length}<span className="text-[10px] text-white/40"> / 200</span></div>
        </div>
      </div>

      <label className="relative mt-3 flex min-h-[44px] items-center gap-2 rounded-[15px] border border-white/10 bg-white/[.035] px-3 focus-within:border-emerald-300/30 focus-within:bg-emerald-300/[.045]">
        <span className="text-emerald-300/70" aria-hidden>⌕</span>
        <span className="sr-only">Search 200 Panacea widgets</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search 200 widgets…"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-bold text-white outline-none placeholder:text-white/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/10 bg-black/30 text-white/60 active:scale-95"
            aria-label="Clear widget search"
          >
            ×
          </button>
        )}
      </label>

      <div className="no-scrollbar relative mt-2.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1" aria-label="Widget categories">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`min-h-[38px] shrink-0 snap-start rounded-[13px] border px-3 text-[9.5px] font-black transition active:scale-[.98] ${
              category === item
                ? 'border-emerald-300/50 bg-emerald-400 text-black'
                : 'border-white/10 bg-white/[.03] text-white/65 hover:border-emerald-300/20 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="no-scrollbar relative mt-3 grid grid-flow-col grid-rows-2 auto-cols-[210px] gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:auto-cols-[235px]" aria-live="polite">
          {visible.map((widget, index) => (
            <Link
              key={widget.id}
              to={widget.ke}
              className="group min-h-[106px] rounded-[18px] border border-white/[.085] bg-[#07100d] p-3 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-emerald-300/[.055] active:scale-[.985]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-white/10 bg-black/30 text-[16px]" aria-hidden>{widget.emoji}</span>
                <span className="text-[8px] font-black tabular-nums text-emerald-300/55">{String(index + 1).padStart(3, '0')}</span>
              </div>
              <div className="mt-2 line-clamp-1 text-[11.5px] font-black leading-tight text-white">{widget.label}</div>
              <div className="mt-1 line-clamp-2 text-[9.5px] font-medium leading-snug text-white/45">{widget.ringkas}</div>
              <div className="mt-1.5 text-[8.5px] font-black uppercase tracking-[.12em] text-emerald-300/70">{widget.kategori}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="relative mt-3 rounded-[18px] border border-dashed border-white/10 bg-black/20 p-6 text-center text-[11px] font-bold text-white/45">
          No matching widget. Clear the search or choose another category.
        </div>
      )}
    </section>
  )
}

export default HomeWidgetUniverse
