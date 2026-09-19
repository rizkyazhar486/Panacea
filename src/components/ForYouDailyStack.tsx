import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FOR_YOU_WIDGET_CATALOG, type ForYouWidgetDefinition } from '../lib/forYouWidgetCatalog'

function sourceLabel(widget: ForYouWidgetDefinition) {
  if (widget.sourcePolicy === 'adapter-required') return 'connection required'
  if (widget.sourcePolicy === 'live-source') return 'live source'
  if (widget.sourcePolicy === 'local') return 'local'
  return 'Panacea'
}

function widgetMetric(widget: ForYouWidgetDefinition) {
  if (widget.kind === 'music') return 'Spotify · Apple Music'
  if (widget.kind === 'sports') return 'Live'
  if (widget.kind === 'faith') return 'Today'
  if (widget.kind === 'mental-wellbeing') return 'Private'
  if (widget.kind === 'motivation') return '1 next action'
  if (widget.kind === 'library') return 'Continue'
  if (widget.kind === 'stories') return 'Read'
  return 'Activity'
}

export function ForYouDailyStack() {
  const [infoId, setInfoId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
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
                <div className="mt-1 truncate text-xl font-black tracking-[-.04em] text-white">{widgetMetric(widget)}</div>
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
