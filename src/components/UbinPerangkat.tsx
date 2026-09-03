import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'
import { deretMetrik } from '../lib/riwayatVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Widget yang menunggu data dari PERANGKAT — HRV, tahap tidur, saturasi, laju
// napas, dan suhu. Semuanya sudah punya jalur masuk (impor Apple Health dan
// webhook kesehatan) dan sudah punya tempat di penyimpanan; yang belum ada
// hanyalah cara membacanya di beranda.
//
// SATU ATURAN YANG BERLAKU DI SELURUH BERKAS INI: tiap widget menggambar diri
// hanya bila datanya benar-benar ada. Tidak ada nilai contoh, tidak ada nol
// pengganti, dan tidak ada satu pun skor gabungan seperti "kesiapan 72%" —
// angka gabungan menyembunyikan bagian mana yang sebenarnya berubah, dan pada
// hari HRV turun karena flu ia terbaca sama dengan hari kurang tidur.
//
// PEMBANDINGNYA SELALU DIRI SENDIRI (median 14 hari), bukan patokan populasi.
// HRV sehat berkisar dari belasan sampai ratusan milidetik antar-orang; satu
// ambang untuk semua orang hanya akan menakut-nakuti separuh pemakainya.
// ─────────────────────────────────────────────────────────────────────────────

function median(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const t = Math.floor(s.length / 2)
  return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2
}

function Kepala({ judul, ke, kanan }: { judul: string; ke: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link>}
    </div>
  )
}

/** Garis + titik terakhir, dengan garis putus-putus pada kebiasaan sendiri. */
function GarisKebiasaan({ deret, biasa, kelas }: { deret: number[]; biasa: number; kelas: string }) {
  if (deret.length < 3) return null
  const semua = [...deret, biasa]
  const min = Math.min(...semua)
  const maks = Math.max(...semua)
  const rentang = maks - min || 1
  const y = (v: number) => 34 - ((v - min) / rentang) * 30
  const titik = deret.map((v, i) => `${(i / (deret.length - 1)) * 100},${y(v).toFixed(2)}`).join(' ')
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-2 h-10 w-full" role="img" aria-label={`last ${deret.length} readings`}>
      <line x1="0" y1={y(biasa)} x2="100" y2={y(biasa)} stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" className="text-neutral-400" />
      <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className={kelas} />
    </svg>
  )
}

/** Satu angka + selisih terhadap kebiasaan; dipakai empat widget di bawah. */
function PanelAngka({
  nilai, satuan, biasa, satuanBiasa, arahTerbalik = false, anak,
}: {
  nilai: number; satuan: string; biasa: number; satuanBiasa?: string; arahTerbalik?: boolean; anak?: React.ReactNode
}) {
  const selisih = biasa > 0 ? nilai - biasa : null
  // Warna hanya dipakai untuk MENANDAI SELISIH BESAR, bukan menyatakan sehat
  // atau sakit: satu malam di luar kebiasaan adalah satu malam, bukan penyakit.
  const jauh = selisih != null && biasa > 0 && Math.abs(selisih) / biasa > 0.12
  const buruk = jauh && (arahTerbalik ? selisih! > 0 : selisih! < 0)
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-[26px] font-black leading-none tabular-nums nyala ${buruk ? 'text-amber-500' : 'text-ink dark:text-white'}`}>
        {nilai.toFixed(nilai >= 100 ? 0 : 1)}
      </span>
      <span className="t-mikro font-bold text-neutral-400">{satuan}</span>
      {anak}
      {selisih != null && (
        <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
          {selisih >= 0 ? '+' : '−'}{Math.abs(selisih).toFixed(1)} dari biasanya {biasa.toFixed(1)}{satuanBiasa ?? ''}
        </span>
      )}
    </div>
  )
}

// ── HRV semalam ────────────────────────────────────────────────────────────
export function UbinHrv() {
  const { kini, deret, biasa } = useMemo(() => {
    const riwayat = deretMetrik('hrvMs').map((t) => t.nilai)
    const v = getVitals()
    const kini = typeof v.hrvMs === 'number' && v.hrvMs > 0 ? v.hrvMs : riwayat[riwayat.length - 1] ?? 0
    return { kini, deret: riwayat.slice(-14), biasa: median(riwayat.slice(-14)) }
  }, [])

  if (!(kini > 0)) return null

  return (
    <section>
      <Kepala judul="Overnight HRV" ke="/tubuh?t=jantung" />
      <div className="kaca rounded-3xl p-3">
        <PanelAngka nilai={kini} satuan="ms" biasa={biasa} satuanBiasa=" ms" />
        <GarisKebiasaan deret={deret} biasa={biasa} kelas="text-emerald-400" />
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          The dashed line is your own 14-day baseline. HRV varies enormously between people, so no single threshold applies to everyone.
        </p>
      </div>
    </section>
  )
}

// ── Arsitektur tidur ───────────────────────────────────────────────────────
//
// Tahap tidur dibaca APA ADANYA dari perangkat. Yang tidak dilakukan: menilai
// "deep sleep Anda kurang" terhadap persentase baku. Perkiraan tahap tidur dari
// jam tangan berbasis gerak dan denyut, dan ketepatannya terhadap polisomnografi
// masih sedang — cukup untuk melihat ARAH dari hari ke hari, tidak cukup untuk
// menyatakan kekurangan pada satu malam.
export function UbinTahapTidur() {
  const v = getVitals()
  const deep = typeof v.sleepDeepH === 'number' ? v.sleepDeepH : 0
  const rem = typeof v.sleepRemH === 'number' ? v.sleepRemH : 0
  const core = typeof v.sleepCoreH === 'number' ? v.sleepCoreH : 0
  const bangun = typeof v.sleepAwakeH === 'number' ? v.sleepAwakeH : 0
  const total = deep + rem + core

  const rerata = useMemo(() => ({
    deep: median(deretMetrik('sleepDeepH').slice(-14).map((t) => t.nilai)),
    rem: median(deretMetrik('sleepRemH').slice(-14).map((t) => t.nilai)),
  }), [])

  if (!(total > 0)) return null
  const jam = (x: number) => `${Math.floor(x)}j ${String(Math.round((x % 1) * 60)).padStart(2, '0')}m`

  return (
    <section>
      <Kepala judul="Sleep stages" ke="/pola-tidur" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{jam(total)}</span>
          <span className="t-mikro font-bold text-neutral-400">tidur</span>
          {bangun > 0 && <span className="t-mikro ml-auto shrink-0 text-neutral-400">terjaga {jam(bangun)}</span>}
        </div>

        <span className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span className="h-full bg-indigo-600" style={{ width: `${(deep / total) * 100}%` }} />
          <span className="h-full bg-violet-400" style={{ width: `${(rem / total) * 100}%` }} />
          <span className="h-full bg-sky-300" style={{ width: `${(core / total) * 100}%` }} />
        </span>

        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          {[
            { l: 'Deep', v: deep, n: 'bg-indigo-600', b: rerata.deep },
            { l: 'REM', v: rem, n: 'bg-violet-400', b: rerata.rem },
            { l: 'Core', v: core, n: 'bg-sky-300', b: 0 },
          ].map((x) => (
            <span key={x.l} className="flex min-w-0 items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${x.n}`} />
              <span className="t-mikro truncate text-neutral-500">{x.l}</span>
              <span className="t-mikro shrink-0 font-black tabular-nums text-ink dark:text-white">{jam(x.v)}</span>
            </span>
          ))}
        </div>

        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          {rerata.deep > 0
            ? `14-day average: deep ${jam(rerata.deep)}, REM ${jam(rerata.rem)}.`
            : 'Sleep stages estimated by the watch from movement and heart rate — enough to see a direction, not to judge a single night.'}
        </p>
      </div>
    </section>
  )
}

// ── Efisiensi tidur ────────────────────────────────────────────────────────
export function UbinEfisiensiTidur() {
  const v = getVitals()
  const tidur = typeof v.sleepH === 'number' ? v.sleepH : 0
  const bangun = typeof v.sleepAwakeH === 'number' ? v.sleepAwakeH : 0
  const diRanjang = tidur + bangun
  if (!(tidur > 0) || !(bangun > 0)) return null
  const efisiensi = (tidur / diRanjang) * 100

  return (
    <section>
      <Kepala judul="Sleep efficiency" ke="/pola-tidur" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(efisiensi)}%</span>
          <span className="t-mikro font-bold text-neutral-400">asleep ÷ time in bed</span>
        </div>
        <span className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span className="h-full bg-brand" style={{ width: `${efisiensi}%` }} />
          <span className="h-full bg-amber-400" style={{ width: `${100 - efisiensi}%` }} />
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Terjaga {Math.round(bangun * 60)} menit dari {diRanjang.toFixed(1)} jam di ranjang. Angka ini dipakai dalam terapi perilaku insomnia; satu malam rendah adalah hal biasa, yang dibaca polanya.
        </p>
      </div>
    </section>
  )
}

// ── Laju napas semalam ─────────────────────────────────────────────────────
export function UbinLajuNapas() {
  const { kini, deret, biasa } = useMemo(() => {
    const riwayat = deretMetrik('respRate').map((t) => t.nilai)
    const v = getVitals()
    const kini = typeof v.respRate === 'number' && v.respRate > 0 ? v.respRate : riwayat[riwayat.length - 1] ?? 0
    return { kini, deret: riwayat.slice(-14), biasa: median(riwayat.slice(-14)) }
  }, [])

  if (!(kini > 0)) return null

  return (
    <section>
      <Kepala judul="Overnight breathing rate" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        {/* Arah terbalik: naiknya laju napas yang perlu diperhatikan, bukan
            turunnya — itulah tanda yang menyertai demam dan sesi berat. */}
        <PanelAngka nilai={kini} satuan="breaths/min" biasa={biasa} arahTerbalik />
        <GarisKebiasaan deret={deret} biasa={biasa} kelas="text-cyan-400" />
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          A rise of a few breaths per minute above your baseline often accompanies fever, short sleep, or a hard session — not a diagnosis, only a pointer.
        </p>
      </div>
    </section>
  )
}

// ── Saturasi oksigen semalam ───────────────────────────────────────────────
export function UbinSaturasi() {
  const { kini, deret, biasa } = useMemo(() => {
    const riwayat = deretMetrik('spo2Pct').map((t) => t.nilai)
    const v = getVitals()
    const kini = typeof v.spo2Pct === 'number' && v.spo2Pct > 0 ? v.spo2Pct : riwayat[riwayat.length - 1] ?? 0
    return { kini, deret: riwayat.slice(-14), biasa: median(riwayat.slice(-14)) }
  }, [])

  if (!(kini > 0)) return null

  return (
    <section>
      <Kepala judul="Oxygen saturation" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <PanelAngka nilai={kini} satuan="%" biasa={biasa} satuanBiasa="%" />
        <GarisKebiasaan deret={deret} biasa={biasa} kelas="text-sky-400" />
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          A wrist sensor is not a diagnostic device, and being off by a few per cent is normal — particularly on darker skin and cold hands. Repeated low readings are worth checking with a fingertip oximeter.
        </p>
      </div>
    </section>
  )
}

// ── Suhu tubuh ─────────────────────────────────────────────────────────────
export function UbinSuhu() {
  const { kini, deret, biasa } = useMemo(() => {
    const riwayat = deretMetrik('bodyTempC').map((t) => t.nilai)
    const v = getVitals()
    const kini = typeof v.bodyTempC === 'number' && v.bodyTempC > 0 ? v.bodyTempC : riwayat[riwayat.length - 1] ?? 0
    return { kini, deret: riwayat.slice(-14), biasa: median(riwayat.slice(-14)) }
  }, [])

  if (!(kini > 0)) return null
  const simpang = biasa > 0 ? kini - biasa : 0

  return (
    <section>
      <Kepala judul="Body temperature" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[26px] font-black leading-none tabular-nums ${Math.abs(simpang) >= 0.5 ? 'text-amber-500' : 'text-ink dark:text-white'}`}>
            {kini.toFixed(1)}
          </span>
          <span className="t-mikro font-bold text-neutral-400">°C</span>
          {biasa > 0 && (
            <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
              {simpang >= 0 ? '+' : '−'}{Math.abs(simpang).toFixed(2)} °C from baseline
            </span>
          )}
        </div>
        <GarisKebiasaan deret={deret} biasa={biasa} kelas="text-orange-400" />
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          What is read is the DEVIATION from your own baseline, not the absolute figure: a wrist sensor measures skin temperature, not core temperature.
        </p>
      </div>
    </section>
  )
}
