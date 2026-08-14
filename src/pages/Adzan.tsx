import { useCallback, useEffect, useRef, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Button, Field, inputClass } from '../components/ui'
import { Ringkas, Poin } from '../components/Ringkas'
import { IconShield } from '../components/icons'
import { useJam } from '../lib/useJam'
import {
  SALAT, METODE, PENYEDIA_WAKTU, jadwalHariIni, berikutnya, bunyikanNada,
  saatnyaMengingatkan, menitSekarang, fmtMenit, muatSetelan, simpanSetelan,
  type JadwalHari, type SetelanAdzan, type Salat,
} from '../lib/adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Pengingat waktu salat.
//
// Dua batas dinyatakan terus terang di layar, karena keduanya menyangkut ibadah
// dan pengguna berhak tahu sebelum ia bergantung pada halaman ini:
//
//   1. WAKTUNYA DIHITUNG LAYANAN LUAR, dengan metode yang dipilih pengguna
//      sendiri. Metode yang sedang dipakai selalu tampil di sebelah jamnya,
//      karena Kemenag, MWL, dan Umm al-Qura memang menghasilkan waktu Subuh
//      yang berbeda beberapa menit untuk kota yang sama.
//   2. PENGINGATNYA HIDUP SELAMA HALAMAN TERBUKA. Ini bukan pengganti jadwal
//      masjid setempat, dan tidak boleh terlihat seperti pengganti.
//
// Rekaman adzan tidak disertakan; alasannya ada di lib/adzan.ts dan diulang
// pada bagian suara di halaman ini.
// ─────────────────────────────────────────────────────────────────────────────

export function Adzan() {
  const sekarang = useJam(1)
  const [setelan, setSetelan] = useState<SetelanAdzan>(muatSetelan)
  const [jadwal, setJadwal] = useState<JadwalHari | null>(null)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)
  const [kotaKetik, setKotaKetik] = useState(setelan.kota)
  const sudahBunyi = useRef<Record<string, boolean>>({})

  const ubah = useCallback((patch: Partial<SetelanAdzan>) => {
    setSetelan((s) => { const baru = { ...s, ...patch }; simpanSetelan(baru); return baru })
  }, [])

  const ambil = useCallback((kota: string, negara: string, metode: number) => {
    setMuat(true); setGalat('')
    jadwalHariIni(kota, negara, metode)
      .then(setJadwal)
      .catch((e: Error) => {
        setJadwal(null)
        setGalat(/nothing is shown/i.test(e?.message ?? '')
          ? e.message
          : `Could not fetch prayer times for ${kota}. Check the city spelling and your connection — no times are shown rather than guessed ones.`)
      })
      .finally(() => setMuat(false))
  }, [])

  useEffect(() => { ambil(setelan.kota, setelan.negara, setelan.metode) },
    [ambil, setelan.kota, setelan.negara, setelan.metode])

  const menitKini = menitSekarang(new Date(sekarang))

  // Pengingat. Ditandai per salat per hari supaya tidak berbunyi berulang
  // sepanjang jendela toleransinya.
  useEffect(() => {
    if (!setelan.aktif || !jadwal) return
    const hariIni = new Date(sekarang).toDateString()
    for (const w of jadwal.waktu) {
      if (!setelan.pilih[w.salat]) continue
      const kunci = `${hariIni}|${w.salat}`
      if (sudahBunyi.current[kunci]) continue
      if (!saatnyaMengingatkan(w.menit, menitKini, setelan.awalanMenit)) continue
      sudahBunyi.current[kunci] = true

      const nama = SALAT.find((s) => s.id === w.salat)?.nama ?? w.salat
      const badan = setelan.awalanMenit > 0
        ? `${nama} is in ${setelan.awalanMenit} minutes (${w.jam}) in ${jadwal.kota}.`
        : `It is ${nama} — ${w.jam} in ${jadwal.kota}.`

      if (setelan.suaraUrl) {
        const a = new Audio(setelan.suaraUrl)
        a.play().catch(() => bunyikanNada())
      } else {
        bunyikanNada()
      }
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🕌 ${nama}`, { body: badan, tag: `adzan-${w.salat}` })
        }
      } catch { /* peramban menolak notifikasi — bunyi dan layar tetap jalan */ }
    }
  }, [sekarang, menitKini, jadwal, setelan])

  const lanjut = jadwal ? berikutnya(jadwal, menitKini) : null

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconShield />} title="Prayer times"
        subtitle="Times from a named service, with the method you choose" />

      {galat && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[12px] leading-relaxed text-rose-700">{galat}</p>
        </Card>
      )}
      {muat && !jadwal && <Card><p className="text-[13px] text-neutral-500">Loading…</p></Card>}

      {jadwal && lanjut && (
        <Card className="!border-brand/30 !bg-brand-50/60">
          <div className="text-[10px] font-black uppercase tracking-wide text-brand-dark">Next</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] leading-none" aria-hidden="true">
              {SALAT.find((s) => s.id === lanjut.salat.salat)?.ikon}
            </span>
            <span className="text-[26px] font-black leading-none text-ink">
              {SALAT.find((s) => s.id === lanjut.salat.salat)?.nama}
            </span>
            <span className="text-[20px] font-black leading-none text-brand-dark">{lanjut.salat.jam}</span>
          </div>
          <p className="mt-1.5 text-[12px] font-semibold text-neutral-600">
            in {jamMenit(lanjut.menitLagi)} · now {fmtMenit(menitKini)}
          </p>
        </Card>
      )}

      {jadwal && (
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Today</div>
              <p className="text-[12px] font-bold text-ink">{jadwal.kota} · {jadwal.tanggal}</p>
            </div>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-600">
              {jadwal.metode}
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            {jadwal.waktu.map((w) => {
              const s = SALAT.find((x) => x.id === w.salat)
              const lewat = w.menit <= menitKini
              const kini = lanjut?.salat.salat === w.salat
              return (
                <div key={w.salat}
                  className={`flex items-center gap-3 rounded-xl p-2.5 ${
                    kini ? 'bg-brand-50' : lewat ? 'bg-white/40' : 'bg-white/60'}`}>
                  <span className="text-[18px]" aria-hidden="true">{s?.ikon}</span>
                  <span className={`flex-1 text-[13px] font-bold ${lewat && !kini ? 'text-neutral-500' : 'text-ink'}`}>
                    {s?.nama}
                  </span>
                  <span className={`text-[15px] font-black tabular-nums ${
                    kini ? 'text-brand-dark' : lewat ? 'text-neutral-500' : 'text-ink'}`}>{w.jam}</span>
                </div>
              )
            })}
          </div>
          <Prosa kelas="mt-2 text-[10px] leading-relaxed text-neutral-500">Methods differ by a few minutes for the same city, and that difference is a scholarly choice rather than an error. Your local mosque&rsquo;s timetable is the authority here — this page is a reminder, not a replacement.</Prosa>
        </Card>
      )}

      {/* ── Pengingat ────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-black text-ink">Reminders</div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Runs while this page is open in your browser.
            </p>
          </div>
          <button onClick={() => {
            const nyala = !setelan.aktif
            ubah({ aktif: nyala })
            if (nyala) {
              // Izin diminta pada saat pengguna menekan, bukan saat halaman
              // dibuka — dialog izin yang muncul tanpa diminta hampir selalu
              // ditolak, dan sekali ditolak ia sulit dikembalikan.
              try { void Notification?.requestPermission?.() } catch { /* tidak didukung */ }
              bunyikanNada()
            }
          }} aria-pressed={setelan.aktif}
            className={`shrink-0 rounded-xl px-3 py-2 text-[12px] font-black ${
              setelan.aktif ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {setelan.aktif ? 'On' : 'Off'}
          </button>
        </div>

        {setelan.aktif && (
          <div className="mt-3 space-y-3 border-t border-black/5 pt-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Remind me for</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SALAT.map((s) => (
                  <button key={s.id} onClick={() => ubah({ pilih: { ...setelan.pilih, [s.id]: !setelan.pilih[s.id] } })}
                    aria-pressed={setelan.pilih[s.id]}
                    className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                      setelan.pilih[s.id] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {s.ikon} {s.nama}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Lead time</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[0, 5, 10, 15, 30].map((m) => (
                  <button key={m} onClick={() => ubah({ awalanMenit: m })} aria-pressed={setelan.awalanMenit === m}
                    className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                      setelan.awalanMenit === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {m === 0 ? 'On time' : `${m} min before`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Sound</div>
              <Prosa kelas="mt-1 text-[11px] leading-relaxed text-neutral-600">No adhan recording ships with this app. Nearly every adhan recording in circulation is a particular muezzin&rsquo;s work with unclear rights, and quietly redistributing that is not something to do with an act of worship. A soft generated chime is used instead — and if you hold your own copy, point to it here.</Prosa>
              <div className="mt-2 flex gap-2">
                <Button onClick={() => bunyikanNada()}>Preview chime</Button>
                {setelan.suaraUrl && (
                  <Button onClick={() => { const a = new Audio(setelan.suaraUrl); a.play().catch(() => bunyikanNada()) }}>
                    Preview yours
                  </Button>
                )}
              </div>
              <div className="mt-2">
                <Field label="Your own adhan audio URL (optional)">
                  <input className={inputClass} value={setelan.suaraUrl} inputMode="url"
                    aria-label="Adhan audio URL" placeholder="https://…"
                    onChange={(e) => ubah({ suaraUrl: e.target.value.trim() })} />
                </Field>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Lokasi dan metode ────────────────────────────────────────────── */}
      <Card>
        <div className="text-[13px] font-black text-ink">Location &amp; method</div>
        <div className="mt-2">
          <Field label="City">
            <input className={inputClass} value={kotaKetik} aria-label="City"
              onChange={(e) => setKotaKetik(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && kotaKetik.trim()) ubah({ kota: kotaKetik.trim() }) }} />
          </Field>
        </div>
        <div className="mt-2">
          <Button onClick={() => { if (kotaKetik.trim()) ubah({ kota: kotaKetik.trim() }) }}>
            Use this city
          </Button>
        </div>
        <Prosa kelas="mt-1.5 text-[10px] leading-relaxed text-neutral-500">A city name is used rather than your GPS location. Precise coordinates are not needed to compute prayer times to the minute, and not collecting them is the safer default.</Prosa>

        <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">Calculation method</div>
        <div className="mt-1.5 space-y-1">
          {METODE.map((m) => (
            <button key={m.kode} onClick={() => ubah({ metode: m.kode })} aria-pressed={setelan.metode === m.kode}
              className={`block w-full rounded-xl p-2.5 text-left ${
                setelan.metode === m.kode ? 'bg-brand-50 ring-1 ring-brand/30' : 'bg-white/60 hover:bg-white/80'}`}>
              <span className="block text-[12px] font-bold text-ink">{m.nama}</span>
              {/* neutral-600, bukan 500. Diukur di peramban: pada kartu yang
                  terpilih latarnya bg-brand-50, dan di atas latar itu
                  neutral-500 hanya mencapai 4,39:1 — di bawah ambang WCAG AA,
                  meskipun di atas putih ia lolos dengan 4,74:1. */}
              <span className="block text-[10px] text-neutral-600">{m.catatan}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Serving these times</div>
        <p className="mt-1 text-[13px] font-bold text-ink">{PENYEDIA_WAKTU.nama}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{PENYEDIA_WAKTU.catatan}</p>
        <a href={PENYEDIA_WAKTU.situs} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] font-bold text-brand underline">{PENYEDIA_WAKTU.situs} →</a>
        <div className="mt-2">
          <Ringkas ikon="🛡️" judul="What is checked before times are shown"
            anak={
              <div className="space-y-1.5">
                <Poin ikon="1️⃣">All five prayers must be present — a partial schedule is not shown at all.</Poin>
                <Poin ikon="2️⃣">Each time must fall later in the day than the one before it. A schedule
                  that jumps backwards cannot be right, and showing it would lead someone to pray
                  outside the time.</Poin>
                <Poin ikon="3️⃣">Times are cached only for the current day, and only after they pass
                  those checks.</Poin>
              </div>
            } />
        </div>
      </Card>
    </div>
  )
}

function jamMenit(m: number): string {
  const j = Math.floor(m / 60), n = m % 60
  if (j <= 0) return `${n} min`
  return n === 0 ? `${j} h` : `${j} h ${n} min`
}

export default Adzan
