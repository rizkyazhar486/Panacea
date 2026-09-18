import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FOR_YOU_ADAPTER_META, FOR_YOU_WIDGET_CATALOG, type ForYouWidgetDefinition } from '../lib/forYouWidgetCatalog'
import {
  beginSpotifyAuthorization,
  completePendingSpotifyAuthorization,
  disconnectMusicAdapter,
  isMusicAdapterConfigured,
  readMusicAdapterStatus,
  type MusicAdapterStatus,
} from '../lib/musicAdapterAuth'

function sourceLabel(widget: ForYouWidgetDefinition) {
  if (widget.sourcePolicy === 'adapter-required') return 'connection required'
  if (widget.sourcePolicy === 'live-source') return 'live source'
  if (widget.sourcePolicy === 'local') return 'local'
  return 'Panacea'
}

function musicMetric(statuses: Record<string, MusicAdapterStatus>) {
  const connected = Object.values(statuses).filter((status) => status.state === 'connected').length
  if (connected > 0) return `${connected} connected`
  if (Object.values(statuses).some((status) => status.state === 'error')) return 'Auth error'
  if (Object.values(statuses).some((status) => status.state === 'disconnected')) return 'Not connected'
  return 'Setup needed'
}

function widgetMetric(widget: ForYouWidgetDefinition, musicStatuses: Record<string, MusicAdapterStatus>) {
  if (widget.kind === 'music') return musicMetric(musicStatuses)
  if (widget.kind === 'sports') return 'Live'
  if (widget.kind === 'faith') return 'Today'
  if (widget.kind === 'mental-wellbeing') return 'Private'
  if (widget.kind === 'motivation') return '1 next action'
  if (widget.kind === 'library') return 'Continue'
  if (widget.kind === 'stories') return 'Read'
  return 'Activity'
}

const MUSIC_ADAPTERS = FOR_YOU_WIDGET_CATALOG.find((widget) => widget.kind === 'music')?.adapters ?? []

function refreshMusicStatuses(): Record<string, MusicAdapterStatus> {
  return Object.fromEntries(MUSIC_ADAPTERS.map((adapter) => [adapter, readMusicAdapterStatus(adapter)]))
}

export function ForYouDailyStack() {
  const [infoId, setInfoId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [musicStatuses, setMusicStatuses] = useState<Record<string, MusicAdapterStatus>>(() => refreshMusicStatuses())
  const [connectingAdapter, setConnectingAdapter] = useState<string | null>(null)
  const visibleWidgets = useMemo(
    () => expanded ? FOR_YOU_WIDGET_CATALOG : FOR_YOU_WIDGET_CATALOG.slice(0, 4),
    [expanded],
  )

  useEffect(() => {
    let cancelled = false
    completePendingSpotifyAuthorization(window.location.search).then((outcome) => {
      if (outcome === 'handled' && !cancelled) {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        url.searchParams.delete('error')
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
      }
      if (!cancelled) setMusicStatuses(refreshMusicStatuses())
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAdapterAction = async (adapter: string) => {
    const status = musicStatuses[adapter]
    if (status?.state === 'connected' || status?.state === 'error') {
      disconnectMusicAdapter(adapter as (typeof MUSIC_ADAPTERS)[number])
      setMusicStatuses(refreshMusicStatuses())
      return
    }
    if (adapter === 'spotify' && isMusicAdapterConfigured('spotify')) {
      setConnectingAdapter(adapter)
      try {
        await beginSpotifyAuthorization()
      } finally {
        setConnectingAdapter(null)
      }
    }
  }

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
                <div className="mt-1 truncate text-xl font-black tracking-[-.04em] text-white">{widgetMetric(widget, musicStatuses)}</div>
              </div>
            </div>
          )

          return (
            <article key={widget.id} className="relative min-w-0">
              {widget.route ? <Link to={widget.route} aria-label={`Open ${widget.title}`}>{body}</Link> : body}
              <button
                type="button"
                className="absolute bottom-2.5 right-2.5 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/[.08] bg-black/25 text-[9px] font-black text-white/35 hover:text-white/70"
                onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
                aria-expanded={infoId === widget.id}
                aria-label={`About ${widget.title}`}
              >
                i
              </button>
              {infoId === widget.id && widget.kind === 'music' && (
                <div className="mt-1 space-y-1.5 rounded-[14px] border border-white/[.06] bg-white/[.02] px-3 py-2">
                  <p className="text-[10px] leading-relaxed text-white/42">
                    Panacea never simulates playback or account state — each provider below shows its real
                    authorization status.
                  </p>
                  {MUSIC_ADAPTERS.map((adapter) => {
                    const status = musicStatuses[adapter] ?? { state: 'not-configured' as const }
                    const label = FOR_YOU_ADAPTER_META[adapter].label
                    const isConnecting = connectingAdapter === adapter
                    const actionLabel =
                      status.state === 'connected' ? 'Disconnect'
                      : status.state === 'error' ? 'Clear error'
                      : status.state === 'not-configured' ? 'Not configured'
                      : isConnecting ? 'Connecting…'
                      : 'Connect'
                    return (
                      <div key={adapter} className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-white/60">{label}</span>
                        <span
                          className={
                            status.state === 'connected' ? 'text-emerald-300/80'
                            : status.state === 'error' ? 'text-rose-300/80'
                            : 'text-white/32'
                          }
                        >
                          {status.state === 'error' && status.errorMessage ? status.errorMessage : status.state.replace('-', ' ')}
                        </span>
                        <button
                          type="button"
                          disabled={status.state === 'not-configured' || isConnecting}
                          onClick={(event) => {
                            event.preventDefault()
                            void handleAdapterAction(adapter)
                          }}
                          className="rounded-full border border-white/[.1] px-2 py-1 font-black uppercase tracking-[.08em] text-white/50 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actionLabel}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {infoId === widget.id && widget.kind !== 'music' && (
                <p className="mt-1 rounded-[14px] border border-white/[.06] bg-white/[.02] px-3 py-2 text-[10px] leading-relaxed text-white/42">
                  {widget.oneSentence}
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
