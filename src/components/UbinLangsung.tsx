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
import { useJam } from '../lib/useJam'
import { getWorkouts } from '../lib/workoutStore'
import { deretMetrik } from '../lib/riwayatVitals'
import { GrafikMini } from './GrafikMini'
import { titikTengahVo2, ML_PER_MET } from '../lib/bugarIlmiah'
import { kebugaranKesegaran } from '../lib/analisisPro'
import { saranBerikutnya } from '../lib/pelatih'
import { hrMaxFromAge } from '../lib/workoutImport'
import { getDemo } from '../lib/profile'
import { UbinSalat } from './UbinSalat'

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
      <span className={`text-[22px] font-black leading-none tabular-nums nyala ${nada}`}>{nilai}</span>
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
          className="text-brand cahaya-hijau" strokeDasharray={`${(terpakai * keliling).toFixed(1)} ${keliling}`}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="absolute t-mikro font-black tabular-nums text-neutral-500">{isi}</span>
    </span>
  )
}

/**
 * Batang tujuh hari di dalam ubin.
 *
 * Sumbu dasarnya NOL, bukan nilai terkecil: batang mengaku mewakili banyaknya
 * sesuatu, dan batang yang dipotong di tengah membesar-besarkan selisih kecil
 * menjadi selisih yang tampak berlipat. Hari kosong tetap digambar sebagai
 * garis tipis — hari tanpa latihan adalah keterangan, bukan ketiadaan data.
 */
function Batang({ deret, nada = 'bg-brand' }: { deret: number[]; nada?: string }) {
  const maks = Math.max(...deret, 1)
  return (
    <span className="flex h-7 items-end gap-[3px]" aria-hidden>
      {deret.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm ${v > 0 ? nada : 'bg-neutral-300 dark:bg-white/15'}`}
          style={{ height: v > 0 ? `${Math.max(12, (v / maks) * 100)}%` : '3px' }}
        />
      ))}
    </span>
  )
}

/** Menit latihan per hari untuk tujuh hari terakhir, hari ini paling kanan. */
function menitTujuhHari(): number[] {
  const per = new Map<string, number>()
  for (const w of getWorkouts()) {
    const d = new Date(Date.parse(w.mulai))
    if (Number.isNaN(d.getTime())) continue
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    per.set(k, (per.get(k) ?? 0) + Math.round((w.durasi ?? 0) / 60))
  }
  const out: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * HARI)
    out.push(per.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? 0)
  }
  return out
}

// ── Langkah ────────────────────────────────────────────────────────────────
function UbinLangkah() {
  const v = getVitals()
  const kini = typeof v.steps === 'number' ? v.steps : 0
  if (!(kini > 0)) return null
  const deret = deretMetrik('steps').map((t) => t.nilai)
  const biasa = median(deret.slice(-7))
  return (
    <Bingkai ke="/tubuh" judul="Steps today">
      <div className="flex items-center gap-2">
        {biasa > 0 && <Cincin rasio={kini / biasa} isi={`${Math.round((kini / biasa) * 100)}%`} />}
        <div className="min-w-0">
          <Angka nilai={kini.toLocaleString('en-GB')} />
          {biasa > 0 && <span className="t-mikro block truncate text-neutral-400">usually {Math.round(biasa).toLocaleString('en-GB')}</span>}
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
    <Bingkai ke="/riwayat-latihan" judul="Training, 7 days">
      <Angka nilai={String(sesi.length)} satuan={`sessions · ${menit} min`} />
      {/* Keterangan jarak dan pace DIGANTI GRAFIK, bukan ditambah di bawahnya.
          Dua baris kalimat di dalam ubin sekecil ini membuat ubinnya terbaca
          sebagai paragraf; sebaran latihan sepekan justru tidak terbaca sama
          sekali dari angka totalnya. Jarak dan pace tetap ada, satu ketukan
          jauhnya, di halaman yang memang untuk itu. */}
      <Batang deret={menitTujuhHari()} />
      {km > 0 && <span className="t-mikro truncate text-neutral-400">{km.toFixed(1)} km{pace ? ` · ${pace}/km` : ''}</span>}
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
    <Bingkai ke="/pola-tidur" judul="Sleep last night">
      <div className="flex items-center justify-between gap-2">
        <Angka nilai={kini.toFixed(1)} satuan="h" />
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
    <Bingkai ke="/log-detak-jantung" judul="Resting heart rate">
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
    <Bingkai ke="/longevity" judul="Aerobic capacity">
      <Angka nilai={vo2.toFixed(1)} satuan="mL/kg/mnt" />
      {titik == null ? (
        <span className="t-mikro truncate text-neutral-400">{(vo2 / ML_PER_MET).toFixed(1)} MET</span>
      ) : (
        <>
          {/* Letak terhadap TITIK TENGAH USIA, digambar pada sumbu ±2 MET.
              Angka "+1,3 MET" tidak memberi tahu apakah itu jauh atau dekat;
              jaraknya terhadap penanda titik tengah memberitahukannya sekali
              lihat. Sumbunya dipotong pada ±2 MET dan penandanya tetap di
              tengah, jadi yang di luar rentang menempel di ujung — melebarkan
              sumbu mengikuti data akan membuat jarak yang sama tampak berbeda
              pada hari yang berbeda. */}
          <span className="relative block h-2 w-full rounded-full bg-neutral-200 dark:bg-white/12" aria-hidden>
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-400 dark:bg-white/40" />
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand cahaya-hijau"
              style={{ left: `${Math.min(96, Math.max(4, 50 + (Math.max(-2, Math.min(2, selisihMet ?? 0)) / 2) * 46))}%` }}
            />
          </span>
          <span className="t-mikro truncate text-neutral-400">
            {`${(selisihMet ?? 0) >= 0 ? '+' : ''}${(selisihMet ?? 0).toFixed(1)} MET · titik tengah usia`}
          </span>
        </>
      )}
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
/**
 * Hitungan ubin pelatih, DIPISAH DARI KOMPONENNYA.
 *
 * Papan widget perlu tahu lebih dahulu apakah ubin ini akan berisi, sebab
 * halaman tumpukan yang dapat digeser ke sana lalu kosong adalah cacat yang
 * paling membingungkan dari tumpukan. Memanggil komponennya untuk memeriksa
 * itu bukan pilihan — komponen React yang dipanggil sebagai fungsi biasa
 * menjalankan hook-nya di luar pohon render dan menjatuhkan seluruh halaman.
 * Maka pemeriksaannya dilakukan di sini, tanpa hook sama sekali.
 */
/** Garis kesegaran dengan nol sebagai sumbu tetap. */
function GarisKesegaran({ deret }: { deret: number[] }) {
  if (deret.length < 3) return null
  const batas = Math.max(5, ...deret.map((v) => Math.abs(v)))
  const T = 34
  const y = (v: number) => T / 2 - (v / batas) * (T / 2 - 2)
  const x = (i: number) => (i / (deret.length - 1)) * 100
  const titik = deret.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')
  return (
    <svg viewBox={`0 0 100 ${T}`} preserveAspectRatio="none" className="h-[34px] w-full" role="img" aria-label={`Freshness, last ${deret.length} days`}>
      <line x1="0" y1={T / 2} x2="100" y2={T / 2} stroke="currentColor" strokeWidth="0.5" className="text-neutral-300 dark:text-white/25" />
      <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="text-brand" />
    </svg>
  )
}

// `sekarang` DIWAJIBKAN mengalir dari luar, bukan diambil diam-diam dari
// Date.now() di dalam sini.
//
// Kebugaran dan kelelahan meluruh terhadap waktu, jadi angkanya berubah walau
// tidak ada latihan baru. Tetapi React hanya menghitung ulang saat ada yang
// berubah — dan bila waktu tidak pernah menjadi salah satu masukannya, tidak
// ada yang berubah. Ubin yang dibiarkan terbuka melewati tengah malam lalu
// menampilkan angka KEMARIN, dan yang membacanya menyimpulkan angkanya macet.
export function hitungPelatih(sekarang = Date.now()) {
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
  const ff = kebugaranKesegaran(sesi, k, 90, sekarang)
  const kini = ff.length ? ff[ff.length - 1] : null
  if (!kini) return null
  // Bila modelnya tidak dapat dihitung, ubin ini TIDAK ADA — lebih baik
  // daripada tiga angka "NaN" yang terbaca sebagai aplikasi yang rusak.
  if (![kini.kebugaran, kini.kelelahan, kini.kesegaran].every(Number.isFinite)) return null
  return { sesi, k, kini, ff }
}

export function UbinPelatihLebar() {
  const sekarang = useJam()
  const hasil = hitungPelatih(sekarang)
  if (!hasil) return null
  const { sesi, k, kini, ff } = hasil
  const saran = saranBerikutnya(sesi, k)

  return (
    <Link to="/analisis-pro" className="kaca col-span-2 flex flex-col gap-2 rounded-3xl p-3 transition active:scale-[0.98]">
      <div className="flex items-center justify-between gap-2">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">Training today</span>
        <span className="t-mikro rounded-full px-2 py-0.5 font-black text-white" style={{ background: saran.warna }}>
          {saran.kapan}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Fitness', v: kini.kebugaran, n: 'text-sky-600 dark:text-sky-400', s: '42-day load' },
          { l: 'Fatigue', v: kini.kelelahan, n: 'text-rose-600 dark:text-rose-400', s: '7-day load' },
          { l: 'Fresh', v: kini.kesegaran, n: 'text-ink dark:text-white', s: 'fitness − fatigue' },
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

      {/* KESEGARAN 30 HARI, bukan kalimat penjelas.
          Tiga angka di atas menyatakan keadaan hari ini saja, dan keadaan hari
          ini tidak dapat dibedakan antara "sedang menumpuk beban" dan "baru
          selesai memulihkan diri" tanpa melihat dari mana ia datang. Garis nol
          digambar tegas karena tanda garis inilah artinya: di atas nol terbawa
          beban yang sudah mengendap, di bawahnya sedang menumpuk kelelahan.
          Alasan lengkap keputusannya ada di halaman yang ditunjuk ubin ini. */}
      <GarisKesegaran deret={ff.slice(-30).map((t) => t.kesegaran)} />
      <span className="t-kecil block truncate font-black text-ink dark:text-white">{saran.judul}</span>
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
  kebugaran: UbinPelatihLebar,
  salat: UbinSalat,
}
