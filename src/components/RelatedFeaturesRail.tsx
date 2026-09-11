import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WIDGETS } from '../lib/homeWidgets'
import { rupa } from '../lib/kategoriRupa'
import { tr } from '../lib/i18n'

function pathOnly(to: string) {
  return to.split('?')[0].split('#')[0] || '/'
}

function currentWidget(pathname: string, search: string) {
  const exact = `${pathname}${search}`
  const exactMatch = WIDGETS.find((widget) => widget.ke === exact)
  if (exactMatch) return exactMatch

  return [...WIDGETS]
    .filter((widget) => {
      const path = pathOnly(widget.ke)
      return pathname === path || pathname.startsWith(`${path}/`)
    })
    .sort((a, b) => pathOnly(b.ke).length - pathOnly(a.ke).length)[0]
}

export function RelatedFeaturesRail() {
  const location = useLocation()

  const data = useMemo(() => {
    const current = currentWidget(location.pathname, location.search)
    if (!current) return null

    const seen = new Set<string>()
    const related = WIDGETS.filter((widget) => {
      if (widget.id === current.id || widget.kategori !== current.kategori) return false
      if (seen.has(widget.ke)) return false
      seen.add(widget.ke)
      return true
    }).slice(0, 10)

    if (!related.length) return null
    return { current, related }
  }, [location.pathname, location.search])

  if (!data || location.pathname === '/') return null
  const visual = rupa(data.current.kategori)

  return (
    <section aria-label={`More in ${data.current.kategori}`} className="mt-10 border-t border-black/[.055] pt-6 dark:border-white/10">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className={`text-[10px] font-black uppercase tracking-[.18em] ${visual.teks}`}>
            {visual.emoji} {tr(visual.label)}
          </div>
          <h2 className="mt-1 text-xl font-black tracking-[-.025em] text-ink dark:text-white">Keep exploring</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Useful tools related to the page you are using now.</p>
        </div>
        <Link to="/semua-fitur" className="shrink-0 rounded-full border border-black/[.06] bg-white/70 px-3 py-2 text-[10px] font-black text-brand-dark shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[.05] dark:text-emerald-300">
          All features →
        </Link>
      </div>

      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-1">
        {data.related.map((widget) => {
          const itemVisual = rupa(widget.kategori)
          return (
            <Link
              key={widget.id}
              to={widget.ke}
              className="group relative min-h-[154px] w-[78vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[28px] border border-black/[.055] bg-white/75 p-4 shadow-[0_16px_46px_rgba(20,35,45,.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(20,55,50,.12)] dark:border-white/10 dark:bg-white/[.045]"
            >
              <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-45 blur-2xl ${itemVisual.bg}`} aria-hidden />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl shadow-[inset_0_1px_rgba(255,255,255,.7)] ${itemVisual.bg}`} aria-hidden>{widget.emoji}</span>
                  <span className="text-lg text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-brand dark:text-white/25">→</span>
                </div>
                <div className="mt-4 text-[15px] font-black leading-tight tracking-[-.015em] text-ink dark:text-white">{tr(widget.label)}</div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{tr(widget.ringkas)}</p>
                <div className={`mt-auto pt-3 text-[9px] font-black uppercase tracking-[.13em] ${itemVisual.teks}`}>Open tool</div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
