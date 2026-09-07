import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HealthAlertSettings } from '../components/HealthAlertSettings'
import { IconBell } from '../components/icons'
import { Prosa } from '../components/Prosa'
import { SmartNotificationSettings } from '../components/SmartNotificationSettings'
import { UtilityNotificationSettings } from '../components/UtilityNotificationSettings'
import { Badge, Card, SectionTitle } from '../components/ui'
import { api, backendEnabled, type Notif } from '../lib/api'
import {
  notificationDayLabel,
  notificationFullTime,
  notificationPresentation,
  serverNotification,
  smartNotification,
  sortNotifications,
  type UnifiedNotification,
} from '../lib/notificationPresentation'
import { loadNotificationHistory } from '../lib/notificationSignals'

type Filter = 'all' | 'unread' | 'server' | 'smart'

export function Notifications() {
  const [serverItems, setServerItems] = useState<Notif[]>([])
  const [smartItems, setSmartItems] = useState(loadNotificationHistory)
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(backendEnabled)
  const [serverError, setServerError] = useState(false)
  const nav = useNavigate()

  const load = useCallback(() => {
    setSmartItems(loadNotificationHistory())
    if (!backendEnabled) {
      setLoading(false)
      setServerError(false)
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
    const onHistory = () => setSmartItems(loadNotificationHistory())
    window.addEventListener('panacea:notification-history', onHistory)
    return () => window.removeEventListener('panacea:notification-history', onHistory)
  }, [load])

  const combined = useMemo(
    () => sortNotifications([
      ...serverItems.map(serverNotification),
      ...smartItems.map(smartNotification),
    ]),
    [serverItems, smartItems],
  )

  const unread = serverItems.filter((item) => !item.read).length

  const visible = useMemo(() => {
    if (filter === 'unread') return combined.filter((item) => item.source === 'server' && !item.read)
    if (filter === 'server') return combined.filter((item) => item.source === 'server')
    if (filter === 'smart') return combined.filter((item) => item.source === 'smart')
    return combined
  }, [combined, filter])

  const groups = useMemo(() => {
    const result: { day: string; list: UnifiedNotification[] }[] = []
    for (const item of visible) {
      const day = notificationDayLabel(item.at)
      const last = result[result.length - 1]
      if (last?.day === day) last.list.push(item)
      else result.push({ day, list: [item] })
    }
    return result
  }, [visible])

  function markAllRead() {
    if (!backendEnabled || unread === 0) return
    api.markNotificationsRead()
      .then(() => setServerItems((prev) => prev.map((item) => ({ ...item, read: true }))))
      .catch(() => setServerError(true))
  }

  function openRoute(item: UnifiedNotification) {
    if (item.route) nav(item.route)
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: combined.length },
    { id: 'unread', label: 'Unread', count: unread },
    { id: 'server', label: 'Server', count: serverItems.length },
    { id: 'smart', label: 'Smart', count: smartItems.length },
  ]

  return (
    <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
      <SectionTitle
        icon={<IconBell />}
        title="Notification Center"
        subtitle={`${unread} unread · ${serverItems.length} server · ${smartItems.length} smart / achievement history`}
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-white/10">
          <div className="px-3 py-1 sm:px-4">
            <div className="text-[9px] font-medium uppercase tracking-[.12em] text-neutral-400">Inbox</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-ink dark:text-white">{serverItems.length}</div>
          </div>
          <div className="px-3 py-1 sm:px-4">
            <div className="text-[9px] font-medium uppercase tracking-[.12em] text-neutral-400">Smart</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-ink dark:text-white">{smartItems.length}</div>
          </div>
          <div className="px-3 py-1 sm:px-4">
            <div className="text-[9px] font-medium uppercase tracking-[.12em] text-neutral-400">Unread</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-ink dark:text-white">{unread}</div>
          </div>
        </div>
      </Card>

      <details className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div>
            <div className="text-sm font-semibold text-ink dark:text-white">Notification controls</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Smart rules, utility preferences and health-alert settings remain available without filling the timeline.</div>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-base text-neutral-600 transition group-open:rotate-45 dark:bg-white/10 dark:text-neutral-200">＋</span>
        </summary>
        <div className="space-y-4 border-t border-neutral-100 p-4 dark:border-white/10 sm:p-5">
          <UtilityNotificationSettings />
          <SmartNotificationSettings />
          <HealthAlertSettings />
        </div>
      </details>

      {!backendEnabled && (
        <Card className="border-amber-200 bg-amber-50/95 dark:border-amber-400/20 dark:bg-amber-400/10">
          <Prosa kelas="text-sm text-amber-900 dark:text-amber-100">
            The backend is unavailable, so server history cannot refresh. Local smart combinations and achievement history remain available on this device.
          </Prosa>
        </Card>
      )}

      {serverError && (
        <Card className="border-amber-200 bg-amber-50/95 dark:border-amber-400/20 dark:bg-amber-400/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Server history could not refresh. Local smart history is still available.</p>
            <button type="button" onClick={load} className="min-h-10 shrink-0 rounded-xl bg-amber-900 px-3 py-2 text-xs font-semibold text-white dark:bg-amber-200 dark:text-amber-950">Try again</button>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${filter === item.id
                  ? 'border-brand bg-brand-50 text-brand-dark dark:bg-brand/15 dark:text-emerald-300'
                  : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}
              >
                {item.label} <span className="ml-1 font-medium opacity-65">{item.count}</span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {backendEnabled && unread > 0 && (
              <button type="button" onClick={markAllRead} className="min-h-10 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Mark server read</button>
            )}
            <button type="button" onClick={load} className="min-h-10 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Refresh</button>
          </div>
        </div>
      </Card>

      {loading && combined.length === 0 ? (
        <Card><p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Loading server history…</p></Card>
      ) : visible.length === 0 ? (
        <Card>
          <div className="py-5 text-center">
            <div className="text-3xl" aria-hidden>✓</div>
            <p className="mt-2 text-sm font-semibold text-ink dark:text-white">
              {filter === 'unread' ? 'No unread server notifications.' : `No ${filter === 'all' ? '' : `${filter} `}notifications yet.`}
            </p>
            <p className="mx-auto mt-1 max-w-xl text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Real achievements, recovery/training signals, medication and account events can appear here when their source conditions are met.
            </p>
          </div>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.day}>
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">{group.day}</div>
            <div className="space-y-2.5">
              {group.list.map((item) => {
                const presentation = notificationPresentation(item)
                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-2xl border p-3.5 sm:p-4 ${item.source === 'server' && !item.read
                      ? 'border-brand/35 bg-brand-50/55 dark:border-brand/30 dark:bg-brand/10'
                      : 'border-neutral-200 bg-white/80 dark:border-white/10 dark:bg-white/[.025]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-lg dark:bg-white/[.07]" aria-hidden>{presentation.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="min-w-0 break-words text-sm font-semibold leading-snug text-ink dark:text-white">{item.title}</h3>
                          {item.source === 'server' && !item.read && <Badge tone="brand">New</Badge>}
                          <span className="rounded-full bg-neutral-100 px-2 py-1 text-[8px] font-medium uppercase tracking-wide text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item.source}</span>
                          {item.priority === 'high' && <span className="rounded-full bg-red-100 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-red-800 dark:bg-red-400/15 dark:text-red-200">high</span>}
                        </div>
                        <p className="mt-1.5 break-words text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{item.body}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                          <span>{presentation.label}</span><span>·</span><span>{notificationFullTime(item.at)}</span>
                        </div>
                        {item.explanation && (
                          <details className="mt-2 rounded-xl bg-neutral-50 px-3 py-2 text-[10px] text-neutral-600 dark:bg-white/[.04] dark:text-neutral-300">
                            <summary className="cursor-pointer font-medium">Why this appeared</summary>
                            <p className="mt-1 leading-relaxed">{item.explanation}</p>
                          </details>
                        )}
                        {item.route && (
                          <button type="button" onClick={() => openRoute(item)} className="mt-3 min-h-10 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white">Open its page →</button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

export default Notifications
