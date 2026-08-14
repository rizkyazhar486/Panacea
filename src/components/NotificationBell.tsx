import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { IconBell } from './icons'
import { api, backendEnabled, type Notif } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Header bell: unread badge + inbox, backed by /api/notifications.
//
// The panel is rendered through a PORTAL, and that is not a stylistic choice.
// The bell lives inside the header's action row, which is `overflow-x-auto` so
// the row can scroll on narrow screens. An absolutely-positioned child of a
// scroll container is clipped to that container — about 40 px tall here — so
// the panel opened correctly and was then cut down to nothing. The badge
// counted fine, which is exactly why it looked like "the bell works but shows
// no detail". Portalling to <body> takes the panel out of that clip entirely.
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} hari lalu` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fullTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Kelompokkan menurut hari supaya daftar panjang tetap terbaca. */
function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const kemarin = new Date(now); kemarin.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, kemarin)) return 'Kemarin'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Menebak jenis pemberitahuan dari judulnya, semata untuk memberi ikon dan
 * label. Server belum mengirimkan kategori; menebak di sini lebih baik daripada
 * menampilkan sederet baris yang seluruhnya tampak sama.
 */
function kategori(n: Notif): { ikon: string; label: string } {
  const t = `${n.title} ${n.body}`.toLowerCase()
  if (/obat|medic|reminder|minum/.test(t)) return { ikon: '💊', label: 'Pengingat obat' }
  if (/janji|appointment|konsul|consult|jadwal/.test(t)) return { ikon: '🩺', label: 'Konsultasi' }
  if (/bayar|invoice|billing|tagihan|pembayaran/.test(t)) return { ikon: '💳', label: 'Pembayaran' }
  if (/pesan|message|chat|balas/.test(t)) return { ikon: '💬', label: 'Pesan' }
  if (/hasil|lab|result|rujuk/.test(t)) return { ikon: '🧪', label: 'Hasil pemeriksaan' }
  if (/latihan|workout|langkah|target|sehat/.test(t)) return { ikon: '🏃', label: 'Aktivitas' }
  return { ikon: '🔔', label: 'Pemberitahuan' }
}

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const [gagal, setGagal] = useState(false)
  const [memuat, setMemuat] = useState(false)
  const [terbuka, setTerbuka] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const unread = items.filter((n) => !n.read).length

  const load = useCallback(() => {
    setMemuat(true)
    api.notifications()
      .then((r) => { setItems(r); setGagal(false) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [])

  useEffect(() => {
    if (!backendEnabled) return
    load()
    const id = setInterval(load, 45_000)
    return () => clearInterval(id)
  }, [load])

  // Anchor the portalled panel to the button, clamped inside the viewport.
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const vw = window.innerWidth
    // Mirrors the panel's own width rule below.
    const lebar = Math.min(352, vw - 16)
    // Anchor to the button, but never let the panel run off either edge — the
    // bell sits in a horizontally scrollable row, so it is often nowhere near
    // the right margin and a naive right-align pushes the panel off-screen.
    const inginRight = vw - r.right
    const right = Math.min(Math.max(8, inginRight), Math.max(8, vw - lebar - 8))
    setPos({ top: r.bottom + 8, right })
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
    // pointerdown rather than mousedown: on touch devices mousedown is
    // synthesised late, so a tap outside could close the panel only after it
    // had already handled the tap.
    function onDoc(e: PointerEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    setTerbuka(null)
    if (next) {
      load()
      if (unread > 0) {
        api.markNotificationsRead().catch(() => {})
        setTimeout(() => setItems((prev) => prev.map((n) => ({ ...n, read: true }))), 800)
      }
    }
  }

  function bukaTautan(n: Notif) {
    const i = n.url ? n.url.indexOf('#/') : -1
    if (i >= 0) { setOpen(false); nav(n.url!.slice(i + 1)) }
  }

  if (!backendEnabled) return null

  // Group by day, newest first.
  const grup: { hari: string; list: Notif[] }[] = []
  for (const n of [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    const h = dayLabel(n.at)
    const last = grup[grup.length - 1]
    if (last && last.hari === h) last.list.push(n)
    else grup.push({ hari: h, list: [n] })
  }

  const panel = open && pos && (
    <>
      {/* Backdrop: on a phone a tap-anywhere-to-close target is far more
          reliable than hit-testing outside a floating panel. */}
      <div className="fixed inset-0 z-[70] bg-black/20 sm:bg-transparent" aria-hidden onPointerDown={() => setOpen(false)} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Pemberitahuan"
        className="fixed z-[71] flex max-h-[70vh] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-neutral-900"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-2.5 dark:border-white/10">
          <span className="text-sm font-bold text-ink dark:text-white">Pemberitahuan</span>
          <span className="text-[11px] text-neutral-500">
            {memuat ? 'memuat…' : `${items.length} item`}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {gagal ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-neutral-500">Could not load notifications.</p>
              <p className="mt-1 text-[11px] text-neutral-500">Check your internet connection.</p>
              <button onClick={load} className="mt-3 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                Coba lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-neutral-500">No notifications yet.</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                Pengingat obat, jadwal konsultasi, dan pembaruan akun akan muncul di sini.
              </p>
            </div>
          ) : (
            grup.map((g) => (
              <div key={g.hari}>
                <div className="sticky top-0 z-10 bg-neutral-50/95 px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500 backdrop-blur dark:bg-neutral-900/95">
                  {g.hari}
                </div>
                {g.list.map((n) => {
                  const kat = kategori(n)
                  const buka = terbuka === n.id
                  return (
                    <div key={n.id} className={`border-b border-neutral-50 dark:border-white/5 ${n.read ? '' : 'bg-brand-50/40 dark:bg-brand/10'}`}>
                      <button
                        onClick={() => setTerbuka(buka ? null : n.id)}
                        aria-expanded={buka}
                        className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 dark:hover:bg-white/5"
                      >
                        <span className="mt-0.5 text-base leading-none shrink-0">{kat.ikon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                            <span className="block text-sm font-bold leading-snug text-ink dark:text-white">{n.title}</span>
                          </span>
                          <span className={`mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-500 ${buka ? '' : 'line-clamp-2'}`}>
                            {n.body}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                            <span>{kat.label}</span>
                            <span>·</span>
                            <span>{timeAgo(n.at)}</span>
                          </span>
                        </span>
                        <span className="mt-1 shrink-0 text-[10px] text-neutral-500">{buka ? '▲' : '▼'}</span>
                      </button>

                      {buka && (
                        <div className="px-4 pb-3 pl-11">
                          <p className="text-[11px] text-neutral-500">{fullTime(n.at)}</p>
                          {n.url ? (
                            <button
                              onClick={() => bukaTautan(n)}
                              className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
                            >
                              Buka halamannya →
                            </button>
                          ) : (
                            <p className="mt-1.5 text-[11px] text-neutral-500">
                              Pemberitahuan ini tidak menautkan ke halaman mana pun.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <button
            onClick={() => { setOpen(false); nav('/notifikasi') }}
            className="shrink-0 border-t border-neutral-100 py-2.5 text-center text-xs font-bold text-brand-dark dark:border-white/10"
          >
            Lihat semua pemberitahuan
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition hover:text-brand-dark"
        title="Pemberitahuan"
        aria-label={unread > 0 ? `Pemberitahuan, ${unread} belum dibaca` : 'Pemberitahuan'}
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
