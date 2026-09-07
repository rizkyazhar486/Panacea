import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluateNotificationRules, type FiredNotification } from '../lib/notificationEngineExtended'
import {
  appendNotificationHistory,
  collectNotificationSnapshot,
  lastFiredByRule,
  loadNotificationHistory,
  loadNotificationSettings,
  notificationsToday,
} from '../lib/notificationSignals'

let evaluationInFlight = false

async function showNativeNotification(item: FiredNotification) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(item.title, {
      body: item.body,
      icon: `${import.meta.env.BASE_URL}logo-mark.png`,
      badge: `${import.meta.env.BASE_URL}logo-mark.png`,
      tag: `panacea-smart:${item.ruleId}`,
      data: { url: `./#${item.route}`, ruleId: item.ruleId, source: 'smart-combination' },
    })
  } catch { /* in-app notification still exists */ }
}

function openRoute(route: string) {
  if (!route.startsWith('/')) return
  window.location.hash = `#${route}`
}

// Ambient foreground evaluator. It never asks for browser permission on its own:
// permission remains a deliberate user action in Settings. Existing backend push
// remains responsible for true background/server reminders such as medication
// schedules; this layer combines signals while Panacea is active.
export function SmartNotificationOrchestrator() {
  const [latest, setLatest] = useState<FiredNotification | null>(null)
  const dismissTimer = useRef<number | null>(null)

  const evaluate = useCallback(async () => {
    if (evaluationInFlight || document.visibilityState === 'hidden') return
    evaluationInFlight = true
    try {
      const settings = loadNotificationSettings()
      const history = loadNotificationHistory()
      const rules = evaluateNotificationRules(
        collectNotificationSnapshot(),
        settings,
        lastFiredByRule(history),
        notificationsToday(history),
        new Date(),
      )
      // One interruption per evaluation even if several conditions become true at once.
      const rule = rules[0]
      if (!rule) return
      const item: FiredNotification = {
        ruleId: rule.id,
        title: rule.title,
        body: rule.body,
        route: rule.route,
        priority: rule.priority,
        domains: rule.domains,
        explanation: rule.explanation,
        at: new Date().toISOString(),
      }
      appendNotificationHistory(item)
      setLatest(item)
      void showNativeNotification(item)
      if (dismissTimer.current != null) window.clearTimeout(dismissTimer.current)
      dismissTimer.current = window.setTimeout(() => setLatest(null), 12_000)
    } finally {
      evaluationInFlight = false
    }
  }, [])

  useEffect(() => {
    void evaluate()
    const interval = window.setInterval(() => void evaluate(), 90_000)
    const onSignal = () => void evaluate()
    const onVisibility = () => { if (document.visibilityState === 'visible') void evaluate() }
    const onOnline = () => void evaluate()
    window.addEventListener('panacea:notification-signal', onSignal)
    window.addEventListener('panacea:notification-settings', onSignal)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      if (dismissTimer.current != null) window.clearTimeout(dismissTimer.current)
      window.removeEventListener('panacea:notification-signal', onSignal)
      window.removeEventListener('panacea:notification-settings', onSignal)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [evaluate])

  if (!latest) return null
  return (
    <div className="fixed bottom-20 left-1/2 z-[70] w-[min(92vw,560px)] -translate-x-1/2 rounded-[22px] border border-white/10 bg-[#10130f]/95 p-3.5 text-white shadow-2xl backdrop-blur-xl" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-lg">🔔</div>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openRoute(latest.route)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-black">{latest.title}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white/60">{latest.priority}</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/70">{latest.body}</p>
          <span className="mt-1.5 inline-block text-[9px] font-black text-emerald-300">Open →</span>
        </button>
        <button type="button" onClick={() => setLatest(null)} aria-label="Dismiss notification" className="shrink-0 text-white/40 hover:text-white">✕</button>
      </div>
    </div>
  )
}

export default SmartNotificationOrchestrator
