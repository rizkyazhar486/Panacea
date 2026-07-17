import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBell } from './icons'
import { api, backendEnabled, type Notif } from '../lib/api'

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Header bell: unread badge + dropdown inbox, backed by /api/notifications.
// Polls every 45s and refetches when opened. Hidden if no backend.
export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const unread = items.filter((n) => !n.read).length

  function load() {
    api.notifications().then(setItems).catch(() => {})
  }

  useEffect(() => {
    if (!backendEnabled) return
    load()
    const id = setInterval(load, 45_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      load()
      if (unread > 0) {
        api.markNotificationsRead().catch(() => {})
        // optimistically clear the badge
        setTimeout(() => setItems((prev) => prev.map((n) => ({ ...n, read: true }))), 600)
      }
    }
  }

  if (!backendEnabled) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition hover:text-brand-dark"
        title="Notifications"
        aria-label="Notifications"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <span className="text-sm font-bold">Notifications</span>
            <span className="text-[11px] text-neutral-400">{items.length} messages</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-neutral-400">No notifications yet.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false)
                    const i = n.url ? n.url.indexOf('#/') : -1
                    if (i >= 0) nav(n.url!.slice(i + 1)) // e.g. './#/billing' -> '/billing'
                  }}
                  className={`flex w-full gap-3 border-b border-neutral-50 px-4 py-3 text-left transition hover:bg-neutral-50 ${n.read ? '' : 'bg-brand-50/40'}`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug">{n.title}</span>
                    <span className="block text-[12px] leading-snug text-neutral-500">{n.body}</span>
                    <span className="mt-0.5 block text-[10px] text-neutral-400">{timeAgo(n.at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
