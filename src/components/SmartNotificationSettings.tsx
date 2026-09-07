import { useEffect, useMemo, useState } from 'react'
import {
  SMART_NOTIFICATION_RULES,
  defaultEnabledRuleIds,
  matchesRule,
  type NotificationDomain,
  type NotificationSettings,
} from '../lib/notificationEngineExtended'
import {
  collectNotificationSnapshot,
  loadNotificationHistory,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../lib/notificationSignals'

const DOMAIN_LABELS: Record<NotificationDomain, string> = {
  medication: 'Medication', study: 'Study', recovery: 'Recovery', sleep: 'Sleep', nutrition: 'Nutrition',
  appointment: 'Appointments', family: 'Family', evidence: 'Evidence', body: 'Body & data', life: 'Life',
  privacy: 'Privacy', finance: 'Finance', social: 'Social', career: 'Career',
}

function nativePermissionLabel() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function SmartNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings)
  const [domain, setDomain] = useState<NotificationDomain | 'all'>('all')
  const [permission, setPermission] = useState(nativePermissionLabel)
  const [testState, setTestState] = useState('')
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    const onHistory = () => setHistoryVersion((v) => v + 1)
    window.addEventListener('panacea:notification-history', onHistory)
    return () => window.removeEventListener('panacea:notification-history', onHistory)
  }, [])

  function persist(next: NotificationSettings) {
    setSettings(next)
    saveNotificationSettings(next)
  }

  const enabled = useMemo(() => new Set(settings.enabledRuleIds.length ? settings.enabledRuleIds : defaultEnabledRuleIds()), [settings.enabledRuleIds])
  const domains = useMemo(() => [...new Set(SMART_NOTIFICATION_RULES.flatMap((r) => r.domains))], [])
  const visible = useMemo(() => domain === 'all' ? SMART_NOTIFICATION_RULES : SMART_NOTIFICATION_RULES.filter((r) => r.domains.includes(domain)), [domain])
  const snapshot = collectNotificationSnapshot()
  const matching = SMART_NOTIFICATION_RULES.filter((rule) => enabled.has(rule.id) && matchesRule(snapshot, rule))
  const history = loadNotificationHistory().slice(0, 5)
  void historyVersion

  function toggleRule(id: string) {
    const next = new Set(enabled)
    next.has(id) ? next.delete(id) : next.add(id)
    persist({ ...settings, enabledRuleIds: [...next] })
  }

  async function sendTest() {
    setPermission(nativePermissionLabel())
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) {
      setTestState('Turn on device notifications in Settings first. This button never asks for permission unexpectedly.')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification('Panacea smart notification test', {
        body: 'Native notifications, service worker routing, and this device are working.',
        icon: `${import.meta.env.BASE_URL}logo-mark.png`,
        badge: `${import.meta.env.BASE_URL}logo-mark.png`,
        tag: 'panacea-smart-test',
        data: { url: './#/notifikasi', source: 'smart-combination-test' },
      })
      setTestState('Test sent. Tap it to verify routing back to Notifications.')
    } catch {
      setTestState('The service worker could not show the test notification on this device.')
    }
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,.06)] dark:border-white/10 dark:bg-[#0d1117] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Smart combinations · local-first</div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Notify when signals matter together, not whenever one number moves.</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{SMART_NOTIFICATION_RULES.length} deterministic combinations across health, study, family, evidence, privacy and life. Rules only use signals already supplied by Panacea; they do not diagnose or prescribe. Foreground combinations run while the app is active; server push remains responsible for background reminders.</p>
        </div>
        <button type="button" role="switch" aria-checked={settings.enabled} onClick={() => persist({ ...settings, enabled: !settings.enabled })} className={`relative h-8 w-14 shrink-0 rounded-full transition ${settings.enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-white/20'}`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${settings.enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Metric label="Enabled" value={`${enabled.size}/${SMART_NOTIFICATION_RULES.length}`} />
        <Metric label="Matching now" value={String(matching.length)} />
        <Metric label="Native permission" value={permission} />
        <Metric label="Recent smart alerts" value={String(history.length)} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]"><span className="block text-[8px] font-black uppercase tracking-wide text-neutral-400">Quiet hours</span><div className="mt-2 flex items-center gap-2"><input type="time" value={settings.quietStart} onChange={(e) => persist({ ...settings, quietStart: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs font-bold dark:border-white/10 dark:bg-neutral-950 dark:text-white" /><span className="text-[9px] text-neutral-400">to</span><input type="time" value={settings.quietEnd} onChange={(e) => persist({ ...settings, quietEnd: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs font-bold dark:border-white/10 dark:bg-neutral-950 dark:text-white" /></div></label>
        <label className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]"><span className="block text-[8px] font-black uppercase tracking-wide text-neutral-400">Interruption budget / day</span><select value={settings.maxPerDay} onChange={(e) => persist({ ...settings, maxPerDay: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs font-bold dark:border-white/10 dark:bg-neutral-950 dark:text-white">{[2, 4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n} alerts maximum</option>)}</select></label>
        <button type="button" onClick={sendTest} className="min-h-12 rounded-2xl bg-neutral-950 px-4 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Test device</button>
      </div>
      {testState && <p className="mt-2 rounded-xl bg-neutral-50 px-3 py-2 text-[9px] leading-relaxed text-neutral-500 dark:bg-white/[.04]">{testState}</p>}

      <div className="no-scrollbar -mx-1 mt-4 flex snap-x gap-1.5 overflow-x-auto px-1 pb-2">
        <button type="button" onClick={() => setDomain('all')} className={`shrink-0 snap-start rounded-full px-3 py-2 text-[9px] font-black ${domain === 'all' ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'}`}>All</button>
        {domains.map((d) => <button key={d} type="button" onClick={() => setDomain(d)} className={`shrink-0 snap-start rounded-full px-3 py-2 text-[9px] font-black ${domain === d ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'}`}>{DOMAIN_LABELS[d]}</button>)}
      </div>

      <div className="mt-1 grid gap-2 lg:grid-cols-2">
        {visible.map((rule) => {
          const on = enabled.has(rule.id)
          const active = on && matchesRule(snapshot, rule)
          return (
            <article key={rule.id} className={`rounded-[20px] border p-3 ${active ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-400/20 dark:bg-emerald-400/[.07]' : 'border-neutral-200 dark:border-white/10'}`}>
              <div className="flex items-start gap-3">
                <button type="button" role="switch" aria-checked={on} aria-label={rule.title} onClick={() => toggleRule(rule.id)} className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-white/20'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-1'}`} /></button>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h3 className="text-[11px] font-black text-neutral-950 dark:text-white">{rule.title}</h3>{active && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-white">matching now</span>}<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-neutral-500 dark:bg-white/10">{rule.priority}</span></div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{rule.explanation}</p><div className="mt-2 flex flex-wrap gap-1">{rule.domains.map((d) => <span key={d} className="rounded-full bg-neutral-100 px-2 py-1 text-[7px] font-black text-neutral-500 dark:bg-white/10">{DOMAIN_LABELS[d]}</span>)}<span className="rounded-full bg-neutral-100 px-2 py-1 text-[7px] font-black text-neutral-500 dark:bg-white/10">cooldown {Math.round(rule.cooldownMinutes / 60)}h</span></div></div>
              </div>
            </article>
          )
        })}
      </div>

      {history.length > 0 && <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-white/10"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Recent smart combinations</div><div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1">{history.map((item) => <div key={`${item.ruleId}-${item.at}`} className="min-w-[230px] snap-start rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]"><div className="text-[10px] font-black text-neutral-900 dark:text-white">{item.title}</div><div className="mt-1 text-[8px] leading-relaxed text-neutral-500">{item.explanation}</div><div className="mt-1 text-[7px] font-black uppercase tracking-wide text-neutral-400">{new Date(item.at).toLocaleString()}</div></div>)}</div></div>}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{label}</div><div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">{value}</div></div>
}

export default SmartNotificationSettings
