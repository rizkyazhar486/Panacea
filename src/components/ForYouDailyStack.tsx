import { useState } from 'react'
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

  return (
    <section aria-label="For You daily stack" className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/34">Daily stack</div>
        <span className="text-[9px] font-black uppercase tracking-[.12em] text-white/22">visual first</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FOR_YOU_WIDGET_CATALOG.map((widget) => {
          const body = (
            <div className="flex h-full min-h-[148px] flex-col justify-between rounded-[24px] border border-white/[.08] bg-white/[.025] p-4 transition hover:border-white/15 hover:bg-white/[.04]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/30">{widget.primaryVisual}</span>
                <span className="text-[8px] font-black uppercase tracking-[.12em] text-white/20">{sourceLabel(widget)}</span>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-[.13em] text-white/38">{widget.title}</div>
                <div className="mt-1 truncate text-2xl font-black tracking-[-.045em] text-white">{widgetMetric(widget)}</div>
              </div>

              <p className="line-clamp-2 text-[11px] font-semibold leading-relaxed text-white/48">{widget.oneSentence}</p>
            </div>
          )

          return (
            <article key={widget.id} className="min-w-0">
              {widget.route ? <Link to={widget.route} aria-label={`Open ${widget.title}`}>{body}</Link> : body}
              <button
                type="button"
                className="mt-1 min-h-[38px] text-[9px] font-black uppercase tracking-[.12em] text-white/30 hover:text-white/62"
                onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
              >
                {infoId === widget.id ? 'Hide info' : 'Info'}
              </button>
              {infoId === widget.id && (
                <p className="pb-2 text-[10px] leading-relaxed text-white/40">
                  {widget.kind === 'music'
                    ? 'Spotify and Apple Music remain explicitly unconnected until a real provider authorization flow and credentials are configured; Panacea does not simulate playback or account state.'
                    : widget.oneSentence}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ForYouDailyStack
