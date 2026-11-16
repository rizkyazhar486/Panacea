import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FOR_YOU_WIDGET_CATALOG, type ForYouWidgetDefinition } from '../../lib/forYouWidgetCatalog'
import { getVitals, type Vitals } from '../../lib/healthVitals'
import { useOptionalStore } from '../../lib/store'

function sourceLabel(widget: ForYouWidgetDefinition) {
  if (widget.sourcePolicy === 'adapter-required') return 'connection required'
  if (widget.sourcePolicy === 'live-source') return 'live source'
  if (widget.sourcePolicy === 'local') return 'local'
  return 'Panacea'
}

function widgetMetric(widget: ForYouWidgetDefinition, vitals: Partial<Vitals>) {
  if (widget.kind === 'music') return 'Spotify · Apple Music'
  if (widget.kind === 'sports') {
    if (typeof vitals.steps === 'number' && vitals.steps > 0) return `${Math.round(vitals.steps).toLocaleString('en-US')} steps`
    return 'Live'
  }
  if (widget.kind === 'faith') return 'Today'
  if (widget.kind === 'mental-wellbeing') {
    if (typeof vitals.hrvMs === 'number' && vitals.hrvMs > 0) return `HRV ${Math.round(vitals.hrvMs)} ms`
    return 'Private'
  }
  if (widget.kind === 'motivation') {
    if (typeof vitals.sleepH === 'number' && vitals.sleepH > 0) return `Sleep ${vitals.sleepH.toFixed(1)}h`
    return '1 next action'
  }
  if (widget.kind === 'library') return 'Continue'
  if (widget.kind === 'stories') return 'Read'
  return 'Activity'
}

export function ForYouDailyStack() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const [infoId, setInfoId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('panacea:health-updated', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  const vitals = useMemo<Partial<Vitals>>(() => {
    void rev
    try {
      return getVitals(account)
    } catch {
      return {}
    }
  }, [account, rev])

  const visibleWidgets = useMemo(
    () => expanded ? FOR_YOU_WIDGET_CATALOG : FOR_YOU_WIDGET_CATALOG.slice(0, 4),
    [expanded],
  )

  return (
    <section aria-label="For You daily stack" className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/34">Daily stack</div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="min-h-[36px] rounded-full border border-white/[.08] px-3 text-[9px] font-black text-white/40 transition hover:border-white/15 hover:text-white/72"
        >
          {expanded ? 'Compact' : `All ${FOR_YOU_WIDGET_CATALOG.length}`}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/[.07] bg-white/[.022] px-3 py-2 text-[11px] text-white/75">
        <span>
          {vitals.restingHr || vitals.heartRate || vitals.hrvMs || vitals.sleepH || vitals.steps
            ? `Live signals — HR ${vitals.restingHr ?? vitals.heartRate ?? '—'} · HRV ${vitals.hrvMs ?? '—'} ms · Sleep ${vitals.sleepH != null ? `${vitals.sleepH.toFixed(1)}h` : '—'}`
            : 'No wearable readings recorded yet — connect a monitor in Body or enter Health Data.'}
        </span>
        <div className="flex items-center gap-3">
          <Link to="/fitness?t=body-exposure" style={{ color: '#6ee7b7' }} className="font-bold transition hover:text-white">
            Wearables →
          </Link>
          <Link to="/emergency" style={{ color: '#fda4af' }} className="font-bold transition hover:text-white">
            Emergency 118/119 →
          </Link>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {visibleWidgets.map((widget) => {
          const body = (
            <div className="flex h-full min-h-[112px] flex-col justify-between rounded-[18px] border border-white/[.07] bg-white/[.022] p-3 transition hover:border-white/14 hover:bg-white/[.035]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[8px] font-black uppercase tracking-[.12em] text-white/28">{widget.primaryVisual}</span>
                <span className="truncate text-[8px] font-black uppercase tracking-[.1em] text-white/18">{sourceLabel(widget)}</span>
              </div>

              <div className="min-w-0">
                <div className="truncate text-[9px] font-black uppercase tracking-[.12em] text-white/36">{widget.title}</div>
                <div className="mt-1 truncate text-xl font-black tracking-[-.04em] text-white">{widgetMetric(widget, vitals)}</div>
              </div>
            </div>
          )

          const needsAdapter = widget.sourcePolicy === 'adapter-required'

          return (
            <article key={widget.id} className="relative min-w-0">
              {widget.route ? (
                <Link to={widget.route} aria-label={`Open ${widget.title}`}>{body}</Link>
              ) : needsAdapter ? (
                <button
                  type="button"
                  className="block w-full text-left"
                  aria-label={`${widget.title} adapter status`}
                  aria-expanded={infoId === widget.id}
                  onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
                >
                  {body}
                </button>
              ) : body}
              <button
                type="button"
                className="absolute bottom-2.5 right-2.5 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/[.08] bg-black/25 text-[9px] font-black text-white/35 hover:text-white/70"
                onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
                aria-expanded={infoId === widget.id}
                aria-label={`About ${widget.title}`}
              >
                i
              </button>
              {infoId === widget.id && (
                <div className="mt-1 rounded-[14px] border border-white/[.06] bg-white/[.02] px-3 py-2 text-[10px] leading-relaxed text-white/42">
                  {widget.kind === 'music' && widget.adapters ? (
                    <ul className="space-y-1">
                      {widget.adapters.map((adapter) => (
                        <li key={adapter} className="flex items-center justify-between gap-2">
                          <span>{adapter === 'spotify' ? 'Spotify' : 'Apple Music'}</span>
                          <span className="font-black uppercase tracking-[.08em] text-white/30">Not connected — sign-in not configured</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{widget.oneSentence}</p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ForYouDailyStack
