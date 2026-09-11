import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, backendEnabled, type Notif } from '../lib/api'
import { loadNotificationHistory } from '../lib/notificationSignals'
import {
  notificationDayLabel,
  notificationFullTime,
  notificationPresentation,
  notificationTimeAgo,
  serverNotification,
  smartNotification,
  sortNotifications,
  type UnifiedNotification,
} from '../lib/notificationPresentation'
import { IconBell } from './icons'
import { NotificationUtilityProducer } from './NotificationUtilityProducer'
import { SaklarNotifikasi } from './SaklarNotifikasi'

/**
 * Header inbox for both durable server notifications and local-first smart
 * combinations. Server unread state remains authoritative for the red badge;
 * smart items are already surfaced when fired and therefore do not create a
 * second artificial unread count.
 */
export function NotificationBell() {
  const [serverItems, setServerItems] = useState<Notif[]>([])
  const [smartItems, setSmartItems] = useState(loadNotificationHistory)
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const loc = useLocation()

  const items = useMemo(
    () => sortNotifications([
      ...serverItems.map(serverNotification),
      ...smartItems.map(smartNotification),
    ]),
    [serverItems, smartItems],
  )
  const unread = serverItems.filter((n) => !n.read).length

  const load = useCallback(() => {
    setSmartItems(loadNotificationHistory())
    if (!backendEnabled) {
      setServerError(false)
      setLoading(false)
      return
    }
    setLoading(true)
    api.notifications()
      .then((result) => { setServerItems(result); setServerError(false) })
      .catch(() => setServerError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = backendEnabled ? window.setInterval(load, 45_000) : null
    const onHistory = () => setSmartItems(loadNotificationHistory())
    window.addEventListener('panacea:notification-history', onHistory)
    return () => {
      if (interval != null) window.clearInterval(interval)
      window.removeEventListener('panacea:notification-history', onHistory)
    }
  }, [load])

  // A route change must never leave a full-screen mobile backdrop blocking the
  // destination page.
  useEffect(() => { setOpen(false) }, [loc.pathname, loc.search])

  const place = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const viewport = window.innerWidth
    const width = Math.min(352, viewport - 16)
    const wantedRight = viewport - rect.right
    const right = Math.min(Math.max(8, wantedRight), Math.max(8, viewport - width - 8))
    setPos({ top: rect.bottom + 8, right })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    setExpanded(null)
    if (!next) return
    load()
    if (backendEnabled && unread > 0) {
      api.markNotificationsRead().catch(() => {})
      // Keep the badge long enough for the user to perceive which entries were
      // new, then mirror the successful optimistic read locally.
      window.setTimeout(() => setServerItems((prev) => prev.map((n) => ({ ...n, read: true }))), 800)
    }
  }

  function openRoute(item: UnifiedNotification) {
    if (!item.route) return
    setOpen(false)
    nav(item.route)
  }

  const groups = useMemo(() => {
    const result: { day: string; list: UnifiedNotification[] }[] = []
    for (const item of items) {
      const day = notificationDayLabel(item.at)
      const last = result[result.length - 1]
      if (last?.day === day) last.list.push(item)
      else result.push({ day, list: [item] })
    }
    return result
  }, [items])

  const panel = open && pos ? (
    <>
      <div className="fixed inset-0 z-[70] bg-black/25 sm:bg-transparent" aria-hidden onPointerDown={() => setOpen(false)} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className="fixed z-[71] flex max-h-[min(72dvh,42rem)] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white/98 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl dark:border-white/12 dark:bg-[#111315]/98 dark:ring-white/5"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 py-3 dark:border-white/10">
          <div className="min-w-0">
            <div className="text-sm font-black text-ink dark:text-white">Notifications</div>
            <div className="mt-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
              {unread > 0 ? `${unread} unread · ` : ''}{items.length} total
            </div>
          </div>
          {loading && <span className="shrink-0 text-[10px] font-bold text-neutral-500 dark:text-neutral-300">Syncing…</span>}
        </div>

        {backendEnabled && (
          <div className="shrink-0 px-3 pt-3">
            <SaklarNotifikasi ringkas onSelesai={load} />
          </div>
        )}

        {serverError && (
          <div className="mx-3 mt-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-medium leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            Server history could not refresh. Local smart and achievement history below is still available.
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-2xl" aria-hidden>🔔</div>
              <p className="mt-2 text-sm font-bold text-ink dark:text-white">Nothing needs your attention.</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                Achievements, recovery signals, reminders, owner milestones and account updates will collect here when real source data triggers them.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.day}>
                <div className="sticky top-0 z-10 bg-neutral-50/95 px-4 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-neutral-600 backdrop-blur dark:bg-[#111315]/95 dark:text-neutral-300">
                  {group.day}
                </div>
                {group.list.map((item) => {
                  const presentation = notificationPresentation(item)
                  const isExpanded = expanded === item.id
                  return (
                    <article key={item.id} className={`border-b border-neutral-100 dark:border-white/[.07] ${item.source === 'server' && !item.read ? 'bg-brand-50/55 dark:bg-brand/10' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full gap-3 px-4 py-3.5 text-left hover:bg-neutral-50/80 dark:hover:bg-white/[.035]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-base dark:bg-white/[.07]" aria-hidden>{presentation.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            {item.source === 'server' && !item.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                            <span className="min-w-0 break-words text-[13px] font-black leading-snug text-ink dark:text-white">{item.title}</span>
                          </span>
                          <span className={`mt-1 block break-words text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300 ${isExpanded ? '' : 'line-clamp-2'}`}>{item.body}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                            <span>{presentation.label}</span>
                            <span>·</span>
                            <span>{notificationTimeAgo(item.at)}</span>
                            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item.source}</span>
                            {item.priority === 'high' && <span className="rounded-full bg-red-100 px-1.5 py-0.5 uppercase tracking-wide text-red-800 dark:bg-red-400/15 dark:text-red-200">high</span>}
                          </span>
                        </span>
                        <span className="mt-1 shrink-0 text-[10px] text-neutral-500 dark:text-neutral-400" aria-hidden>{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pl-16">
                          <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{notificationFullTime(item.at)}</p>
                          {item.explanation && (
                            <p className="mt-1.5 break-words text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Why: {item.explanation}</p>
                          )}
                          {item.route ? (
                            <button type="button" onClick={() => openRoute(item)} className="mt-2.5 min-h-9 rounded-xl bg-brand px-3 py-2 text-[11px] font-black text-white">
                              Open its page →
                            </button>
                          ) : (
                            <p className="mt-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">No safe internal destination is attached to this item.</p>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </section>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => { setOpen(false); nav('/notifikasi') }}
          className="shrink-0 border-t border-neutral-200/80 bg-white/95 py-3 text-center text-xs font-black text-brand-dark dark:border-white/10 dark:bg-[#111315]/95 dark:text-emerald-300"
        >
          Open Notification Center →
        </button>
      </div>
    </>
  ) : null

  return (
    <>
      <NotificationUtilityProducer />
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-neutral-700 shadow-sm transition hover:text-brand-dark dark:border-white/12 dark:bg-[#17191c] dark:text-neutral-200 dark:hover:text-emerald-300"
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
