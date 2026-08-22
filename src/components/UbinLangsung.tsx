// Ubin yang MENUNJUKKAN, bukan sekadar mengantar.
//
// Sebelum ini setiap pintasan beranda berisi hal yang sama: lambang, nama, dan
// satu baris keterangan. Untuk sebagian fitur itu memang cukup — sebuah pintu
// tidak perlu berisi apa-apa. Tetapi untuk fitur yang punya angka, pintu yang
// menyembunyikan angkanya membuat orang harus mengetuk hanya untuk mengetahui
// bahwa tidak ada yang berubah.
//
// Aturan yang dipegang di berkas ini:
//  1. Hanya angka yang benar-benar tercatat. Tidak ada nilai contoh.
//  2. Bila datanya belum ada, ubin ini menyerah dan halaman memakai pintu biasa
//     — bukan menampilkan "0" yang tidak dapat dibedakan dari hasil ukur.
//  3. Pembanding adalah KEBIASAAN SENDIRI (median 7 hari), bukan target bulat
//     seperti 10.000 langkah, yang tidak berasal dari penelitian mana pun.

import { Link } from 'react-router-dom'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { deretMetrik } from '../lib/riwayatVitals'
import { GrafikMini } from './GrafikMini'
import { titikTengahVo2, ML_PER_MET } from '../lib/bugarIlmiah'
import { kebugaranKesegaran } from '../lib/analisisPro'
import { saranBerikutnya } from '../lib/pelatih'
import { hrMaxFromAge } from '../lib/workoutImport'
import { getDemo } from '../lib/profile'

const HARI = 864e5

function median(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const t = Math.floor(s.length / 2)
  return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2
}

function Bingkai({ ke, judul, children }: { ke: string; judul: string; children: React.ReactNode }) {
  return (
    <Link to={ke} className="kaca flex min-h-[76px] flex-col gap-1 rounded-3xl p-3 transition active:scale-[0.98]">
      <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{judul}</span>
      {children}
    </Link>
  )
}

function Angka({ nilai, satuan, nada = 'text-ink dark:text-white' }: { nilai: string; satuan?: string; nada?: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={`text-[22px] font-black leading-none tabular-nums ${nada}`}>{nilai}</span>
      {satuan && <span className="t-mikro font-bold text-neutral-400">{satuan}</span>}
    </span>
  )
}

/** Cincin kemajuan terhadap kebiasaan sendiri. 100% = sama dengan biasanya. */
function Cincin({ rasio, isi }: { rasio: number; isi: string }) {
  const r = 15
  const keliling = 2 * Math.PI * r
  const terpakai = Math.max(0, Math.min(1.4, rasio)) / 1.4
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-200 dark:text-white/10" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          className="text-brand" strokeDasharray={`${(terpakai * keliling).toFixed(1)} ${keliling}`}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="absolute t-mikro font-black tabular-nums text-neutral-500">{isi}</span>
    </span>
  )
}

// ── Langkah ────────────────────────────────────────────────────────────────
function UbinLangkah() {
  const v = getVitals()
  const kini = typeof v.steps === 'number' ? v.steps : 0
  if (!(kini > 0)) return null
  const deret = deretMetrik('steps').map((t) => t.nilai)
  const biasa = median(deret.slice(-7))
  return (
    <Bingkai ke="/tubuh" judul="Langkah hari ini">
      <div className="flex items-center gap-2">
        {biasa > 0 && <Cincin rasio={kini / biasa} isi={`${Math.round((kini / biasa) * 100)}%`} />}
        <div className="min-w-0">
          <Angka nilai={kini.toLocaleString('id-ID')} />
          {biasa > 0 && <span className="t-mikro block truncate text-neutral-400">biasanya {Math.round(biasa).toLocaleString('id-ID')}</span>}
        </div>
      </div>
    </Bingkai>
  )
}

// ── Latihan 7 hari ─────────────────────────────────────────────────────────
function UbinLatihan() {
  const sesi = getWorkouts().filter((w) => Date.now() - Date.parse(w.mulai) < 7 * HARI)
  if (!sesi.length) return null
  const km = sesi.reduce((a, w) => a + (w.jarakKm ?? 0), 0)
  const menit = Math.round(sesi.reduce((a, w) => a + (w.durasi ?? 0), 0) / 60)
  const detikPerKm = km > 0 ? (menit * 60) / km : 0
  const pace = detikPerKm > 0 ? `${Math.floor(detikPerKm / 60)}:${String(Math.round(detikPerKm % 60)).padStart(2, '0')}` : null
  return (
    <Bingkai ke="/riwayat-latihan" judul="Latihan 7 hari">
      <Angka nilai={String(sesi.length)} satuan={`sesi · ${menit} mnt`} />
      <span className="t-mikro truncate text-neutral-400">
        {km > 0 ? `${km.toFixed(1)} km${pace ? ` · ${pace}/km` : ''}` : 'jarak tidak terekam'}
      </span>
    </Bingkai>
  )
}

// ── Tidur ──────────────────────────────────────────────────────────────────
function UbinTidur() {
  const deret = deretMetrik('sleepH').map((t) => t.nilai)
  const v = getVitals()
  const kini = typeof v.sleepH === 'number' && v.sleepH > 0 ? v.sleepH : deret[deret.length - 1]
  if (!(kini > 0)) return null
  return (
    <Bingkai ke="/pola-tidur" judul="Tidur semalam">
      <div className="flex items-center justify-between gap-2">
        <Angka nilai={kini.toFixed(1)} satuan="jam" />
        <GrafikMini deret={deret.slice(-14)} />
      </div>
    </Bingkai>
  )
}

// ── Denyut istirahat ───────────────────────────────────────────────────────
function UbinDenyut() {
  const v = getVitals()
  const kini = typeof v.restingHr === 'number' ? v.restingHr : 0
  if (!(kini > 0)) return null
  return (
    <Bingkai ke="/log-detak-jantung" judul="Denyut istirahat">
      <div className="flex items-center justify-between gap-2">
        <Angka nilai={String(Math.round(kini))} satuan="bpm" nada="text-rose-600 dark:text-rose-400" />
        <GrafikMini deret={deretMetrik('restingHr').map((t) => t.nilai).slice(-14)} />
      </div>
    </Bingkai>
  )
}

// ── Kapasitas aerobik ──────────────────────────────────────────────────────
function UbinLongevity() {
  const v = getVitals()
  const vo2 = typeof v.vo2max === 'number' ? v.vo2max : 0
  const usia = typeof v.age === 'number' ? v.age : 0
  if (!(vo2 > 0)) return null
  const jk = v.sex === 'F' ? 'P' : 'L'
  const titik = usia > 0 ? titikTengahVo2(usia, jk) : null
  const selisihMet = titik ? (vo2 - titik) / ML_PER_MET : null
  return (
    <Bingkai ke="/longevity" judul="Kapasitas aerobik">
      <Angka nilai={vo2.toFixed(1)} satuan="mL/kg/mnt" />
      <span className="t-mikro truncate text-neutral-400">
        {selisihMet == null
          ? `${(vo2 / ML_PER_MET).toFixed(1)} MET`
          : `${selisihMet >= 0 ? '+' : ''}${selisihMet.toFixed(1)} MET dari titik tengah usia`}
      </span>
    </Bingkai>
  )
}

// ── Pelatih: latihan hari ini ──────────────────────────────────────────────
//
// Tiga angka model beban latihan (Banister 1975; bentuk CTL/ATL/TSB yang
// dipakai perangkat lunak balap sepeda) beserta satu keputusan untuk hari ini.
//
// Ketiganya adalah MODEL, bukan hasil ukur: ia menduga kelelahan dari denyut
// dan lama sesi, tidak dari darah maupun otot. Karena itu angkanya tidak punya
// satuan yang berarti di luar dirinya sendiri, dan yang dibaca adalah ARAH dan
// SELISIHNYA. Dasar keputusannya ikut ditulis supaya dapat dibantah.
function UbinPelatih() {
  const sesi = getWorkouts()
  if (sesi.length < 3) return null
  const demo = getDemo()
  const usia = demo.age > 0 ? demo.age : 30
  const jk: 'M' | 'F' = demo.sex === 'F' ? 'F' : 'M'
  const v = getVitals()
  const k = {
    hrMax: sesi.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0) || hrMaxFromAge(usia, jk),
    hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
    sex: jk,
  }
  const ff = kebugaranKesegaran(sesi, k, 90)
  const kini = ff.length ? ff[ff.length - 1] : null
  if (!kini) return null
  const saran = saranBerikutnya(sesi, k)

  return (
    <Link to="/analisis-pro" className="kaca col-span-2 flex flex-col gap-2 rounded-3xl p-3 transition active:scale-[0.98]">
      <div className="flex items-center justify-between gap-2">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">Latihan hari ini</span>
        <span className="t-mikro rounded-full px-2 py-0.5 font-black text-white" style={{ background: saran.warna }}>
          {saran.kapan}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Bugar', v: kini.kebugaran, n: 'text-sky-600 dark:text-sky-400', s: 'beban 42 hari' },
          { l: 'Lelah', v: kini.kelelahan, n: 'text-rose-600 dark:text-rose-400', s: 'beban 7 hari' },
          { l: 'Segar', v: kini.kesegaran, n: 'text-ink dark:text-white', s: 'bugar − lelah' },
        ].map((x) => (
          <span key={x.l} className="min-w-0">
            <span className="t-mikro block truncate font-bold uppercase tracking-wide text-neutral-500">{x.l}</span>
            <span className={`block text-[20px] font-black leading-none tabular-nums ${x.n}`}>
              {x.v > 0 && x.l === 'Segar' ? '+' : ''}{Math.round(x.v)}
            </span>
            <span className="t-mikro block truncate text-neutral-400">{x.s}</span>
          </span>
        ))}
      </div>

      <div>
        <span className="t-kecil block font-black text-ink dark:text-white">{saran.judul}</span>
        <span className="t-mikro block leading-snug text-neutral-500">{saran.dasar}</span>
      </div>
    </Link>
  )
}

/**
 * Ubin hidup menurut id widget. Yang tidak terdaftar di sini tetap memakai
 * pintu biasa — dan itu keadaan yang benar bagi kebanyakan fitur.
 */
export const UBIN_LANGSUNG: Record<string, () => JSX.Element | null> = {
  tubuh: UbinLangkah,
  pelatih: UbinLatihan,
  tidur: UbinTidur,
  detakJantung: UbinDenyut,
  longevity: UbinLongevity,
  kebugaran: UbinPelatih,
}
