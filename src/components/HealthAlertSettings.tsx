import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from './ui'
import { IconHeart, IconBell, IconTimer } from './icons'
import { api, backendEnabled } from '../lib/api'
import { pushSupported, pushStatus, type PushStatus } from '../lib/push'

// ─────────────────────────────────────────────────────────────────────────────
// Pengaturan tiga pengingat yang terhubung ke perangkat.
//
// Kenapa dibuat terpisah dari daftar sakelar di Settings: sakelar di sana
// mengatur KATEGORI kiriman (surel, SMS, transaksi), sedangkan tiga ini punya
// nilai yang harus diatur — zona berapa, jam berapa, berapa menit sebelumnya.
// Sakelar tanpa nilai itu tidak berarti apa-apa.
//
// Satu hal yang dinyatakan terbuka di sini: peringatan zona TIDAK seketika. Ia
// menumpang pada sinkronisasi Health Auto Export yang berjalan tiap beberapa
// menit, jadi datangnya beberapa menit setelah zonanya terlewati. Berguna untuk
// "ternyata lari mudah tadi tidak mudah", tidak berguna sebagai peringatan saat
// sedang berlari.
// ─────────────────────────────────────────────────────────────────────────────

interface Prefs {
  notifHrZone?: boolean
  hrZoneThreshold?: number
  notifMedReminders?: boolean
  notifSleepTime?: boolean
  sleepTargetHHMM?: string
  sleepLeadMin?: number
  tzOffsetMin?: number
}

const ZONA = [
  { z: 2, nama: 'Z2 — Aerobik dasar', ket: 'Noisiest. Almost any moderate activity will set it off.' },
  { z: 3, nama: 'Z3 — Tempo', ket: 'Tells you when you rise above easy intensity.' },
  { z: 4, nama: 'Z4 — Ambang laktat', ket: 'A sensible default for most people: tells you when a session turns genuinely hard.' },
  { z: 5, nama: 'Z5 — Maksimal', ket: 'Rarest. Only when effort approaches maximal.' },
]

export function HealthAlertSettings() {
  const [prefs, setPrefs] = useState<Prefs>({})
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)
  const [simpan, setSimpan] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [saranJam, setSaranJam] = useState<string | null>(null)
  const [push, setPush] = useState<PushStatus>('disabled')

  const load = useCallback(() => {
    setMemuat(true)
    Promise.all([
      api.getSettings().catch(() => ({} as Record<string, unknown>)),
      api.healthAlertContext().catch(() => null),
    ])
      .then(([s, ctx]) => {
        setPrefs(s as Prefs)
        setSaranJam(ctx?.suggestedBedtime ?? null)
        setGagal(false)
      })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
    if (!pushSupported()) setPush('unsupported')
    else pushStatus().then(setPush).catch(() => setPush('unavailable'))
  }, [load])

  const save = useCallback((patch: Prefs) => {
    const next = { ...prefs, ...patch }
    // The server schedules bedtime in the user's own local time and has no way
    // to know where they are, so the offset travels with every save.
    next.tzOffsetMin = -new Date().getTimezoneOffset()
    setPrefs(next)
    setSimpan('saving')
    api.saveSettings(next as Record<string, unknown>)
      .then(() => { setSimpan('saved'); setTimeout(() => setSimpan('idle'), 1500) })
      .catch(() => setSimpan('idle'))
  }, [prefs])

  if (!backendEnabled) {
    return (
      <Card>
        <SectionTitle icon={<IconBell />} title="Pengingat terhubung perangkat" />
        <p className="mt-2 text-sm text-neutral-500">
          Pengingat ini dikirim oleh server, dan aplikasi sedang berjalan tanpa server.
        </p>
      </Card>
    )
  }

  const zoneOn = prefs.notifHrZone === true
  const sleepOn = prefs.notifSleepTime === true
  const medOn = prefs.notifMedReminders !== false

  return (
    <Card>
      <SectionTitle
        icon={<IconBell />}
        title="Pengingat terhubung perangkat"
        subtitle="Switch on what you need — each has its own settings"
        right={simpan === 'saving' ? <span className="text-[11px] text-neutral-500">menyimpan…</span>
          : simpan === 'saved' ? <span className="text-[11px] font-bold text-brand-dark">tersimpan ✓</span> : undefined}
      />

      {push !== 'enabled' && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="text-[12px] font-black text-amber-800 dark:text-amber-300">
            {push === 'unsupported' ? 'This device cannot receive notifications yet'
              : push === 'denied' ? 'Izin pemberitahuan ditolak'
                : push === 'unavailable' ? 'Notification service is unavailable'
                  : 'Notifications are not switched on for this device'}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-900 dark:text-amber-100/90">
            {push === 'denied'
              // On iPhone the usual cause is not a revoked permission but the
              // app being opened in a Safari tab, where iOS refuses push
              // outright. Sending someone to iOS Settings first would waste
              // their time, so both causes are named, likeliest first.
              ? 'On iPhone the usual cause is not a revoked permission but that Panaceamed was opened from a Safari tab — iOS allows no notifications there at all. Add it to your Home Screen (Share → Add to Home Screen) and open it from that icon. If you already have and it is still blocked, go to iPhone Settings → Notifications → Panaceamed and allow it again. While blocked, the switches below still save but nothing reaches your screen.'
              : 'On iPhone, notifications only work if Panaceamed has been ADDED TO THE HOME SCREEN (Share → Add to Home Screen) and opened from that icon, not from a Safari tab. This is an iOS limitation, not a setting you missed.'}
          </p>
          <Link to="/settings" className="mt-2 inline-block text-[12px] font-bold text-amber-900 underline dark:text-amber-200">
            Buka pengaturan pemberitahuan →
          </Link>
        </div>
      )}

      {gagal && (
        <p className="mt-3 text-sm text-rose-600">Could not load settings. <button onClick={load} className="underline">Coba lagi</button></p>
      )}
      {memuat && <p className="mt-3 text-sm text-neutral-500">Loading…</p>}

      {!memuat && (
        <div className="mt-3 space-y-3">
          {/* ── Zona detak jantung ── */}
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <Row
              icon={<IconHeart size={18} />}
              title="Heart-rate zone alerts"
              sub="Tells you when your heart rate reaches a given zone"
              on={zoneOn}
              onToggle={(v) => save({ notifHrZone: v })}
            />
            {zoneOn && (
              <div className="mt-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Alert from zone</div>
                <div className="mt-1.5 space-y-1.5">
                  {ZONA.map((z) => {
                    const dipilih = (prefs.hrZoneThreshold ?? 4) === z.z
                    return (
                      <button
                        key={z.z}
                        onClick={() => save({ hrZoneThreshold: z.z })}
                        className={`w-full rounded-lg border p-2.5 text-left transition ${
                          dipilih ? 'border-brand bg-brand-50 dark:bg-brand/10' : 'border-neutral-200 dark:border-white/10'
                        }`}
                      >
                        <div className={`text-[13px] font-bold ${dipilih ? 'text-brand-dark' : 'text-ink dark:text-white'}`}>{z.nama}</div>
                        <div className="text-[11px] leading-relaxed text-neutral-500">{z.ket}</div>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                  <b>Bukan seketika.</b> Peringatan ini menumpang sinkronisasi Health Auto Export yang berjalan
                  tiap beberapa menit, jadi datangnya beberapa menit setelah zonanya terlewati — berguna untuk
                  menyadari &quot;ternyata lari mudah tadi tidak mudah&quot;, bukan sebagai peringatan saat sedang berlari.
                  Paling banyak satu peringatan tiap 20 menit.
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  Batas zona dihitung dari denyut maksimal Anda — dipakai denyut tertinggi yang pernah tercatat
                  bila itu lebih tinggi daripada rumus 220−usia. Lihat angkanya di{' '}
                  <Link to="/riwayat-latihan" className="font-bold text-brand-dark underline">Training History</Link>.
                </p>
              </div>
            )}
          </div>

          {/* ── Obat ── */}
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <Row
              icon={<span className="text-base">💊</span>}
              title="Medication reminders"
              sub="Sent at the time you set for each medicine"
              on={medOn}
              onToggle={(v) => save({ notifMedReminders: v })}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              Sakelar ini hanya mengizinkan pengirimannya. Yang menentukan kapan berbunyi adalah obat yang
              Anda daftarkan beserta jamnya — <b>if the list is empty, nothing will fire</b>.
              Inilah sebab tersering pengingat obat terasa &quot;tidak jalan&quot;.
            </p>
            <Link to="/med-reminders" className="mt-2 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
              Atur daftar obat →
            </Link>
          </div>

          {/* ── Tidur ── */}
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <Row
              icon={<IconTimer size={18} />}
              title="Bedtime reminder"
              sub="Once a night, before your target time"
              on={sleepOn}
              onToggle={(v) => save({ notifSleepTime: v, sleepTargetHHMM: prefs.sleepTargetHHMM ?? saranJam ?? '22:30' })}
            />
            {sleepOn && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Target bedtime</label>
                  <input
                    type="time"
                    value={prefs.sleepTargetHHMM ?? saranJam ?? '22:30'}
                    onChange={(e) => save({ sleepTargetHHMM: e.target.value })}
                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm font-bold tabular-nums dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                {saranJam && (
                  <button
                    onClick={() => save({ sleepTargetHHMM: saranJam })}
                    className="text-[11px] font-bold text-brand-dark underline"
                  >
                    Pakai {saranJam} — jam tidur tengah Anda dari data jam tangan
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Diingatkan berapa menit sebelumnya</label>
                  <select
                    value={String(prefs.sleepLeadMin ?? 30)}
                    onChange={(e) => save({ sleepLeadMin: Number(e.target.value) })}
                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm font-bold dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {[0, 15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m === 0 ? 'on time' : `${m} menit`}</option>)}
                  </select>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  Yang paling menentukan kualitas tidur bukan lamanya, melainkan <b>jam yang tetap sama tiap
                  malam</b>. Bila jadwal jaga membuat jam tidur mustahil disamakan, tetapkan jam ini sesuai
                  malam-malam yang Anda kendalikan, dan abaikan pada malam jaga.
                </p>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  Dikirim menurut jam setempat Anda. History malam Anda ada di{' '}
                  <Link to="/pola-tidur" className="font-bold text-brand-dark underline">Sleep Pattern</Link>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function Row({ icon, title, sub, on, onToggle }: {
  icon: React.ReactNode; title: string; sub: string; on: boolean; onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark dark:bg-brand/10">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink dark:text-white">{title}</span>
        <span className="block text-[11px] leading-snug text-neutral-500">{sub}</span>
      </span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => onToggle(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-neutral-300 dark:bg-white/20'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

export default HealthAlertSettings
