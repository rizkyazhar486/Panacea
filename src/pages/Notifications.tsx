import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconBell } from '../components/icons'
import { api, backendEnabled, type Notif } from '../lib/api'
import { HealthAlertSettings } from '../components/HealthAlertSettings'

// ─────────────────────────────────────────────────────────────────────────────
// Halaman penuh untuk seluruh pemberitahuan.
//
// Panel di lonceng dibatasi tinggi dan menutup begitu berpindah halaman, jadi
// ia bukan tempat yang tepat untuk mencari kembali sesuatu yang pernah muncul —
// misalnya "kapan tepatnya pengingat obat itu dikirim". Di sini isinya utuh,
// bisa disaring, dan tiap butir menampilkan waktu lengkapnya.
// ─────────────────────────────────────────────────────────────────────────────

type Saring = 'semua' | 'belum' | 'sudah'

function fullTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const kemarin = new Date(now); kemarin.setDate(now.getDate() - 1)
  if (same(d, now)) return 'Today'
  if (same(d, kemarin)) return 'Kemarin'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

export function Notifications() {
  const [items, setItems] = useState<Notif[]>([])
  const [saring, setSaring] = useState<Saring>('semua')
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)
  const nav = useNavigate()

  const load = useCallback(() => {
    setMemuat(true)
    api.notifications()
      .then((r) => { setItems(r); setGagal(false) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
  }, [load])

  const tersaring = useMemo(() => {
    const urut = [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    if (saring === 'belum') return urut.filter((n) => !n.read)
    if (saring === 'sudah') return urut.filter((n) => n.read)
    return urut
  }, [items, saring])

  const grup = useMemo(() => {
    const out: { hari: string; list: Notif[] }[] = []
    for (const n of tersaring) {
      const h = dayLabel(n.at)
      const last = out[out.length - 1]
      if (last && last.hari === h) last.list.push(n)
      else out.push({ hari: h, list: [n] })
    }
    return out
  }, [tersaring])

  const belum = items.filter((n) => !n.read).length

  function tandaiSemua() {
    api.markNotificationsRead()
      .then(() => setItems((p) => p.map((n) => ({ ...n, read: true }))))
      .catch(() => {})
  }

  if (!backendEnabled) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconBell />} title="Pemberitahuan" />
        <Card>
          <p className="text-sm text-neutral-500">
            Pemberitahuan memerlukan sambungan ke server, dan saat ini aplikasi berjalan dalam mode
            tanpa server. Data kesehatan Anda tetap tersimpan di perangkat ini seperti biasa.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconBell />}
        title="Pemberitahuan"
        subtitle={belum > 0 ? `${belum} belum dibaca dari ${items.length}` : `${items.length} pemberitahuan`}
      />

      <HealthAlertSettings />

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {([['semua', 'Semua'], ['belum', 'Belum dibaca'], ['sudah', 'Sudah dibaca']] as [Saring, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSaring(k)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                saring === k
                  ? 'border-brand bg-brand-50 text-brand-dark'
                  : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'
              }`}
            >
              {l}
              {k === 'belum' && belum > 0 && <span className="ml-1.5 text-[10px]">({belum})</span>}
            </button>
          ))}
          <span className="flex-1" />
          {belum > 0 && (
            <button onClick={tandaiSemua} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
              Tandai semua dibaca
            </button>
          )}
          <button onClick={load} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
            Muat ulang
          </button>
        </div>
      </Card>

      {gagal ? (
        <Card>
          <p className="text-sm text-neutral-500">Tidak bisa memuat pemberitahuan. Periksa sambungan internet Anda.</p>
          <button onClick={load} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Coba lagi</button>
        </Card>
      ) : memuat ? (
        <Card><p className="text-sm text-neutral-400">Loading…</p></Card>
      ) : tersaring.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-500">
            {saring === 'belum' ? 'Tidak ada pemberitahuan yang belum dibaca.'
              : saring === 'sudah' ? 'Belum ada pemberitahuan yang sudah dibaca.'
                : 'Belum ada pemberitahuan.'}
          </p>
          {saring === 'semua' && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-400">
              Pengingat obat, jadwal konsultasi, pembaruan pembayaran, dan pesan baru akan muncul di sini.
            </p>
          )}
        </Card>
      ) : (
        grup.map((g) => (
          <Card key={g.hari}>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{g.hari}</div>
            <div className="space-y-2">
              {g.list.map((n) => {
                const kat = kategori(n)
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-3 ${n.read ? 'border-neutral-100 dark:border-white/10' : 'border-brand/30 bg-brand-50/40 dark:bg-brand/10'}`}
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 text-base leading-none shrink-0">{kat.ikon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink dark:text-white">{n.title}</span>
                          {!n.read && <Badge tone="brand">Baru</Badge>}
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{n.body}</p>
                        <p className="mt-1.5 text-[11px] text-neutral-400">{kat.label} · {fullTime(n.at)}</p>
                        {n.url && (
                          <button
                            onClick={() => {
                              const i = n.url!.indexOf('#/')
                              if (i >= 0) nav(n.url!.slice(i + 1))
                            }}
                            className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Buka halamannya →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
