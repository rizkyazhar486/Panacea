import { trimpSesi, type Sesi, type Konteks } from './trainingPhysiology'
import type { ImportedWorkout } from './workoutImport'
import { kunciHari } from './tanggal'

export { kunciHari }

// ─────────────────────────────────────────────────────────────────────────────
// Analisis Pro — padanan fitur analisis berbayar Strava, dihitung dari data
// latihan yang sudah kita punya.
//
// Yang dibangun di sini hanya yang benar-benar bisa dihitung. Ada bagian dari
// daftar Strava yang TIDAK bisa dan tidak akan dipalsukan:
//
//   * Segmen dan papan peringkat menuntut basis data rute publik beserta jutaan
//     percobaan pengguna lain. Itu bukan soal rumus, melainkan soal platform.
//   * Peta rute, heatmap pribadi, peta luring dan Beacon menuntut jejak GPS.
//     Server ini SENGAJA membuang larik rute sebelum menyimpan, karena itu
//     bagian paling sensitif dari kiriman dan belum ada layar yang memakainya.
//     Menyimpannya "siapa tahu berguna" adalah alasan buruk untuk menyimpan
//     riwayat lokasi seseorang.
//
// Sisanya — kebugaran, kesegaran, upaya relatif, log latihan, usaha terbaik,
// zona, dan target — semuanya dihitung dari sesi nyata.
// ─────────────────────────────────────────────────────────────────────────────

export function sesiDariWorkout(w: ImportedWorkout): Sesi {
  return {
    id: w.id,
    nama: w.nama,
    mulai: w.mulai,
    durasiDetik: w.durasi,
    jarakKm: w.jarakKm,
    avgHr: w.avgHr,
    maxHr: w.maxHr,
    hr: w.hr,
  }
}

// ── 1. Upaya Relatif (Relative Effort) ──────────────────────────────────────

/**
 * Satu angka untuk "seberapa berat sesi ini", berbasis denyut.
 *
 * Dasarnya TRIMP Banister yang sudah dipakai di Training Physiology, diskalakan
 * agar rentangnya terasa wajar dibaca (sesi mudah sejam ≈ 50). Skala tidak akan
 * sama persis dengan angka Strava — perusahaan itu tidak menerbitkan rumusnya —
 * tetapi urutan dan perbandingan antar sesi Anda tetap sahih, dan itulah yang
 * dipakai untuk mengambil keputusan.
 */
const SKALA_UPAYA = 1.0

export interface UpayaRelatif {
  skor: number
  label: string
  warna: string
  /** true bila dihitung dari deret denyut, bukan dari rata-rata sesi. */
  dariDeret: boolean
}

export function upayaRelatif(w: ImportedWorkout, k: Konteks): UpayaRelatif {
  const skor = Math.round(trimpSesi(sesiDariWorkout(w), k) * SKALA_UPAYA)
  const dariDeret = w.hr.length >= 2
  const [label, warna] =
    skor >= 250 ? ['Sangat berat', '#ef4444']
      : skor >= 150 ? ['Berat', '#f59e0b']
        : skor >= 80 ? ['Sedang', '#60a5fa']
          : skor >= 30 ? ['Ringan', '#34d399']
            : ['Sangat ringan', '#94a3b8']
  return { skor, label, warna, dariDeret }
}

// ── 2. Kebugaran & Kesegaran (Fitness & Freshness) ──────────────────────────

export interface TitikKebugaran {
  tanggal: string
  /** Beban kronis 42 hari — "kebugaran". */
  kebugaran: number
  /** Beban akut 7 hari — "kelelahan". */
  kelelahan: number
  /** Kebugaran − kelelahan — "kesegaran"/bentuk. */
  kesegaran: number
  upaya: number
}

const TAU_KEBUGARAN = 42
const TAU_KELELAHAN = 7

/**
 * Model impuls-respons Banister: dua rerata bergerak eksponensial atas upaya
 * harian. Kebugaran naik lambat dan turun lambat; kelelahan naik cepat dan
 * hilang cepat. Selisihnya adalah kesegaran.
 *
 * Kesegaran positif berarti terbawa beban yang sudah mengendap; negatif berarti
 * sedang menumpuk kelelahan. Keduanya normal — yang penting arah dan waktunya.
 */
export function kebugaranKesegaran(
  workouts: ImportedWorkout[],
  k: Konteks,
  hariKeBelakang = 120,
  sekarang = Date.now(),
): TitikKebugaran[] {
  if (!workouts.length) return []

  // Upaya per hari KALENDER SETEMPAT. Sebelumnya hari diambil dari
  // toISOString(), yang selalu UTC: di WIB (UTC+7) setiap sesi sebelum pukul
  // 07.00 tercatat pada hari sebelumnya, dan label tanggal pada grafik ikut
  // bergeser satu hari. Itu sebabnya tanggal dan log tidak cocok.
  const perHari = new Map<string, number>()
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t)) continue
    perHari.set(kunciHari(new Date(t)), (perHari.get(kunciHari(new Date(t))) ?? 0) + upayaRelatif(w, k).skor)
  }

  const mulai = new Date(sekarang - hariKeBelakang * 86400_000)
  mulai.setHours(0, 0, 0, 0)

  const out: TitikKebugaran[] = []
  let kebugaran = 0
  let kelelahan = 0
  const aKeb = 1 - Math.exp(-1 / TAU_KEBUGARAN)
  const aKel = 1 - Math.exp(-1 / TAU_KELELAHAN)

  for (let i = 0; i <= hariKeBelakang; i++) {
    const hari = new Date(mulai.getTime() + i * 86400_000)
    const key = kunciHari(hari)
    const upaya = perHari.get(key) ?? 0
    // Hari tanpa latihan tetap dihitung: justru hari itulah kelelahan meluruh.
    kebugaran += aKeb * (upaya - kebugaran)
    kelelahan += aKel * (upaya - kelelahan)
    out.push({
      tanggal: key,
      kebugaran: Math.round(kebugaran * 10) / 10,
      kesegaran: Math.round((kebugaran - kelelahan) * 10) / 10,
      kelelahan: Math.round(kelelahan * 10) / 10,
      upaya,
    })
  }

  // Titik terakhir dihitung ulang secara BERKELANJUTAN terhadap jam, bukan
  // dipatok ke tengah malam. Dengan ember harian, angka hari ini terkunci sejak
  // sesi selesai sampai lewat tengah malam — istirahat lima jam tidak
  // menggerakkannya sedikit pun, dan itulah "angkanya stuck" yang terlihat.
  //
  // Bentuk berkelanjutan ini identik dengan rekursi harian di atas pada jam 00
  // (rekursi x_n = a·Σ L_k·e^^-(n-k)/τ), hanya saja Δ-nya pecahan hari, jadi
  // skalanya tidak berubah — hanya resolusinya yang bertambah.
  const kini = out[out.length - 1]
  if (kini) {
    const luruh = (tau: number, a: number) => {
      let total = 0
      for (const w of workouts) {
        const t = Date.parse(w.mulai)
        if (Number.isNaN(t) || t > sekarang) continue
        const hari = (sekarang - t) / 86400_000
        if (hari > tau * 6) continue // sumbangannya sudah <0,3%
        total += upayaRelatif(w, k).skor * Math.exp(-hari / tau)
      }
      return a * total
    }
    const keb = luruh(TAU_KEBUGARAN, aKeb)
    const kel = luruh(TAU_KELELAHAN, aKel)
    kini.kebugaran = Math.round(keb * 10) / 10
    kini.kelelahan = Math.round(kel * 10) / 10
    kini.kesegaran = Math.round((keb - kel) * 10) / 10
  }

  return out
}

// ── Laju penambahan beban ────────────────────────────────────────────────────
//
// Kesegaran (TSB) baru berarti setelah kebugaran sempat terisi, kira-kira enam
// pekan. Sebelum itu ia diam saja — padahal justru pekan-pekan awal yang paling
// rawan. Yang bisa diukur sejak hari pertama bukan seberapa lelah seseorang,
// melainkan SEBERAPA CEPAT bebannya bertambah.
//
// Dua ukuran dipakai bersama karena keduanya menangkap hal berbeda:
//
//   * ACWR — beban 7 hari dibagi rata-rata beban 28 hari. Menangkap lonjakan
//     mendadak: pekan ini jauh lebih berat daripada kebiasaan sebulan terakhir.
//   * Penambahan jarak antarpekan. Menangkap tanjakan yang stabil tapi terlalu
//     curam, yang tidak terlihat oleh ACWR karena naiknya mulus.
//
// TENTANG ANGKANYA. Rentang "aman" 0,8–1,3 berasal dari penelitian Gabbett dkk.
// pada atlet tim, dan sejak itu dikritik cukup keras — pembaginya ikut naik
// bersama pembilangnya, sehingga rasio bisa terlihat jinak justru saat beban
// melonjak, dan bukti kausalnya lemah. Karena itu di sini ACWR TIDAK dipakai
// sebagai vonis cedera. Ia dipakai sebagai satu-satunya hal jujur yang bisa
// dikatakan pada riwayat pendek: "kenaikannya secepat ini, dan itu lebih cepat
// daripada yang biasanya disarankan". Ambangnya disebut sebagai rambu, bukan
// batas keselamatan, dan kalimatnya menyatakan ketidakpastian itu.
//
// Pada riwayat kurang dari 28 hari, pembaginya belum penuh. Itu tidak
// disembunyikan: hasilnya ditandai `cukupData: false` dan dibacakan lebih
// hati-hati, bukan dibulatkan menjadi kepastian palsu.

export interface LajuBeban {
  /** Total beban tujuh hari terakhir. */
  akut: number
  /** Rata-rata beban tujuh harian selama 28 hari terakhir. */
  kronis: number
  /** akut / kronis. null bila kronis nol (belum ada dasar sama sekali). */
  rasio: number | null
  /** Jarak pekan ini dibanding pekan sebelumnya, dalam persen. null bila nol. */
  naikJarakPct: number | null
  kmPekanIni: number
  kmPekanLalu: number
  /** History sudah mencapai 28 hari sehingga pembagi kronis penuh. */
  cukupData: boolean
  judul: string
  arti: string
  warna: string
}

export function lajuBeban(
  workouts: ImportedWorkout[],
  k: Konteks,
  sekarang = Date.now(),
): LajuBeban | null {
  if (!workouts.length) return null

  const hariSejak = (w: ImportedWorkout) => (sekarang - Date.parse(w.mulai)) / 86400_000
  let akut = 0, beban28 = 0, kmIni = 0, kmLalu = 0
  for (const w of workouts) {
    const d = hariSejak(w)
    if (Number.isNaN(d) || d < 0) continue
    const skor = upayaRelatif(w, k).skor
    if (d < 7) { akut += skor; kmIni += w.jarakKm ?? 0 }
    if (d >= 7 && d < 14) kmLalu += w.jarakKm ?? 0
    if (d < 28) beban28 += skor
  }

  const umur = hariRiwayatLatihan(workouts, sekarang)
  const cukupData = umur >= 28
  // Pembagi kronis: rata-rata per tujuh hari. Pada riwayat pendek, membagi
  // dengan 28 hari penuh akan mengecilkan pembagi secara palsu dan membuat
  // rasio meledak, jadi dibagi dengan lama riwayat yang sebenarnya.
  const hariDasar = Math.max(7, Math.min(28, umur))
  const kronis = beban28 / (hariDasar / 7)
  const rasio = kronis > 0 ? Math.round((akut / kronis) * 100) / 100 : null
  const naikJarakPct = kmLalu > 0 ? Math.round(((kmIni - kmLalu) / kmLalu) * 100) : null

  const ragu = cukupData ? '' : ` Your history is only ${Math.round(umur)} days long, so the comparison is not yet complete and this figure is still rough.`

  let judul: string, arti: string, warna: string
  if (rasio === null) {
    judul = 'Belum ada pembanding'
    arti = 'Belum ada beban sebelumnya untuk dibandingkan. Setelah dua pekan berjalan, laju penambahan Anda bisa dihitung.'
    warna = '#94a3b8'
    // Lonjakan jarak SAJA tidak cukup untuk memicu peringatan merah. Jadwal
    // selang-sehari menaruh empat sesi di satu pekan dan tiga di pekan lain —
    // selisih 33% yang murni akibat penggalan kalender, bukan penambahan beban.
    // Karena itu jarak hanya menaikkan derajat peringatan bila rasio ikut naik.
  } else if (rasio > 1.5 || (naikJarakPct !== null && naikJarakPct > 30 && rasio > 1.3)) {
    judul = 'Naik terlalu cepat'
    arti = `Beban tujuh hari terakhir ${rasio}× kebiasaan Anda${naikJarakPct !== null ? `, jarak naik ${naikJarakPct}% dari pekan lalu` : ''}. Yang paling sering mendahului cedera bukan latihan berat, melainkan penambahan yang cepat. Menahan laju sekarang jauh lebih murah daripada berhenti enam pekan nanti.${ragu}`
    warna = '#ef4444'
  } else if (rasio > 1.3) {
    judul = 'Agak cepat'
    arti = `Beban pekan ini ${rasio}× kebiasaan Anda. Masih wajar untuk satu pekan berat, asalkan pekan berikutnya lebih ringan.${ragu}`
    warna = '#f59e0b'
  } else if (rasio < 0.8) {
    judul = 'Sedang menurun'
    arti = `Beban pekan ini ${rasio}× kebiasaan Anda — lebih ringan. Bagus sebagai pekan pemulihan; bila berlanjut beberapa pekan, kebugaran yang sudah dibangun akan ikut turun.${ragu}`
    warna = '#60a5fa'
  } else {
    judul = 'Laju sehat'
    arti = `Beban pekan ini ${rasio}× kebiasaan Anda — penambahannya bertahap. Ini pola yang paling bisa dipertahankan.${ragu}`
    warna = '#22c55e'
  }

  return {
    akut: Math.round(akut), kronis: Math.round(kronis), rasio, naikJarakPct,
    kmPekanIni: Math.round(kmIni * 10) / 10, kmPekanLalu: Math.round(kmLalu * 10) / 10,
    cukupData, judul, arti, warna,
  }
}

/** Age riwayat dalam hari: dari sesi paling awal sampai sekarang. */
export function hariRiwayatLatihan(workouts: ImportedWorkout[], sekarang = Date.now()): number {
  let paling = Infinity
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (!Number.isNaN(t) && t < paling) paling = t
  }
  return Number.isFinite(paling) ? Math.max(0, (sekarang - paling) / 86400_000) : 0
}

export interface BacaKesegaran {
  judul: string
  arti: string
  warna: string
}

/**
 * Membaca angka kesegaran menjadi kalimat.
 *
 * `hariRiwayat` bukan hiasan. Kebugaran memakai τ 42 hari, kelelahan τ 7 hari,
 * jadi pada awal riwayat kelelahan naik kira-kira enam kali lebih cepat daripada
 * kebugaran. Siapa pun yang baru dua atau tiga pekan berlatih akan menunjukkan
 * kesegaran yang sangat negatif — bukan karena tubuhnya kelelahan, melainkan
 * karena penyebut kebugarannya belum sempat terisi. Membacakan "Sangat lelah,
 * risiko cedera" pada keadaan itu bukan sekadar tidak berguna; ia menyuruh orang
 * beristirahat justru ketika ia sedang membangun dasar.
 *
 * Karena itu selama riwayat lebih pendek dari satu tetapan waktu kebugaran
 * (42 hari), angkanya tetap ditampilkan tetapi tidak dibacakan sebagai vonis.
 */
export function bacaKesegaran(kesegaran: number, hariRiwayat?: number): BacaKesegaran {
  if (hariRiwayat !== undefined && hariRiwayat < TAU_KEBUGARAN && kesegaran < -10) {
    return {
      judul: 'Belum bisa dibaca',
      arti: `Your history is only ${Math.round(hariRiwayat)} days long. Fitness is computed with a 42-day time constant, so the number is still filling in and will sit well below fatigue for a while — that is what the start of every history looks like, not a sign that you are worn out. Freshness only becomes trustworthy after roughly six weeks of consistently logged sessions.`,
      warna: '#94a3b8',
    }
  }
  if (kesegaran >= 15) return { judul: 'Sangat segar', arti: 'Beban sudah mengendap sepenuhnya. Bagus untuk lomba atau tes, tetapi bila bertahan lama biasanya berarti latihan sedang terlalu sedikit untuk menambah kebugaran.', warna: '#22c55e' }
  if (kesegaran >= 5) return { judul: 'Segar', arti: 'Siap untuk sesi kualitas atau lomba.', warna: '#84cc16' }
  if (kesegaran >= -10) return { judul: 'Seimbang', arti: 'Beban dan pemulihan sedang sepadan. Ini keadaan yang paling produktif untuk membangun kebugaran.', warna: '#60a5fa' }
  if (kesegaran >= -30) return { judul: 'Menumpuk lelah', arti: 'Sedang dalam blok berat. Wajar dan memang perlu, asalkan diikuti minggu yang lebih ringan.', warna: '#f59e0b' }
  return { judul: 'Sangat lelah', arti: 'Kelelahan jauh di atas kebugaran. Bila dipaksakan lebih lama, risikonya cedera dan kemunduran, bukan kemajuan.', warna: '#ef4444' }
}

// ── 3. Grade Adjusted Pace ──────────────────────────────────────────────────

/**
 * Pace setara di jalan datar.
 *
 * Faktor biaya energi mendaki/menurun (Minetti dkk., 2002), didekati dengan
 * polinomial atas gradien. Karena larik rute tidak disimpan, gradien hanya bisa
 * dihitung sebagai RATA-RATA seluruh sesi — cukup untuk membandingkan rute
 * berbukit dengan rute datar, tetapi tidak bisa menggantikan analisis per
 * kilometer. Itu dinyatakan lewat `kasar`.
 */
export function faktorGradien(gradien: number): number {
  const g = Math.max(-0.3, Math.min(0.3, gradien))
  return 1 + 4.7 * g + 22 * g * g * (g > 0 ? 1 : 0.35)
}

export interface Gap {
  paceSec: number
  gapSec: number
  gradienRerata: number
  kasar: true
}

export function gradeAdjustedPace(w: ImportedWorkout, naikM?: number): Gap | null {
  if (!w.jarakKm || w.jarakKm <= 0 || !w.durasi) return null
  if (naikM == null || !Number.isFinite(naikM)) return null
  const paceSec = w.durasi / w.jarakKm
  const gradien = naikM / (w.jarakKm * 1000)
  const f = faktorGradien(gradien)
  return {
    paceSec: Math.round(paceSec),
    gapSec: Math.round(paceSec / (f > 0 ? f : 1)),
    gradienRerata: Math.round(gradien * 1000) / 10,
    kasar: true,
  }
}

// ── 4. Usaha Terbaik (Best Efforts) ─────────────────────────────────────────

export const JARAK_PR = [1, 2, 3, 5, 10, 21.0975, 42.195] as const

export interface UsahaTerbaik {
  jarakKm: number
  label: string
  detik: number
  paceSec: number
  tanggal: string
  nama: string
  /** true bila jarak sesi tidak persis, sehingga waktunya diskalakan. */
  diskalakan: boolean
}

/**
 * Rekor per jarak.
 *
 * Batas jujur: tanpa split per kilometer, "5 km tercepat DI DALAM" sebuah lari
 * 10 km tidak bisa diambil. Yang dipakai adalah sesi yang jaraknya mendekati
 * jarak target (±10%), lalu waktunya diskalakan seperlunya — dan sesi yang
 * diskalakan ditandai, bukan disamarkan sebagai rekor murni.
 */
export function usahaTerbaik(workouts: ImportedWorkout[]): UsahaTerbaik[] {
  const out: UsahaTerbaik[] = []
  for (const jarak of JARAK_PR) {
    let terbaik: UsahaTerbaik | null = null
    for (const w of workouts) {
      if (!w.jarakKm || !w.durasi) continue
      const rasio = w.jarakKm / jarak
      if (rasio < 0.9 || rasio > 1.1) continue
      const detik = Math.round(w.durasi / rasio)
      if (terbaik && detik >= terbaik.detik) continue
      terbaik = {
        jarakKm: jarak,
        label: jarak === 21.0975 ? 'Half Marathon' : jarak === 42.195 ? 'Marathon' : `${jarak} km`,
        detik,
        paceSec: Math.round(detik / jarak),
        tanggal: w.mulai,
        nama: w.nama,
        diskalakan: Math.abs(rasio - 1) > 0.02,
      }
    }
    if (terbaik) out.push(terbaik)
  }
  return out
}

// ── 5. Training Log (Training Log) ───────────────────────────────────────────

export interface BarisPeriode {
  kunci: string
  label: string
  sesi: number
  menit: number
  km: number
  kcal: number
  upaya: number
}

function pekanKe(d: Date): string {
  // ISO-8601: pekan dimulai Senin, dan pekan 1 memuat Kamis pertama.
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const hari = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - hari + 3)
  const kamisPertama = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  const hariKamis = (kamisPertama.getUTCDay() + 6) % 7
  kamisPertama.setUTCDate(kamisPertama.getUTCDate() - hariKamis + 3)
  const pekan = 1 + Math.round((t.getTime() - kamisPertama.getTime()) / (7 * 86400_000))
  return `${t.getUTCFullYear()}-P${String(pekan).padStart(2, '0')}`
}

export function logLatihan(
  workouts: ImportedWorkout[],
  k: Konteks,
  satuan: 'pekan' | 'bulan' = 'pekan',
): BarisPeriode[] {
  const peta = new Map<string, BarisPeriode>()
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t)) continue
    const d = new Date(t)
    const kunci = satuan === 'pekan' ? pekanKe(d) : d.toISOString().slice(0, 7)
    const label = satuan === 'pekan'
      ? `Pekan ${kunci.split('-P')[1]} ${kunci.slice(0, 4)}`
      : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const b = peta.get(kunci) ?? { kunci, label, sesi: 0, menit: 0, km: 0, kcal: 0, upaya: 0 }
    b.sesi += 1
    b.menit += w.durasi / 60
    b.km += w.jarakKm ?? 0
    b.kcal += w.kcal ?? 0
    b.upaya += upayaRelatif(w, k).skor
    peta.set(kunci, b)
  }
  return [...peta.values()]
    .map((b) => ({ ...b, menit: Math.round(b.menit), km: +b.km.toFixed(1), kcal: Math.round(b.kcal) }))
    .sort((a, b) => (a.kunci < b.kunci ? 1 : -1))
}

// ── 6. Target (Custom Goals) ────────────────────────────────────────────────

export type JenisTarget = 'jarak' | 'waktu' | 'sesi'
export type PeriodeTarget = 'pekan' | 'bulan' | 'tahun'

export interface Target {
  jenis: JenisTarget
  periode: PeriodeTarget
  nilai: number
}

export interface KemajuanTarget {
  tercapai: number
  sasaran: number
  pct: number
  satuan: string
  sisaHari: number
  /** Laju yang perlu dipertahankan agar target tercapai tepat waktu. */
  perluPerHari: number
  diJalur: boolean
}

function awalPeriode(p: PeriodeTarget, sekarang: number): { dari: number; hingga: number } {
  const d = new Date(sekarang)
  if (p === 'pekan') {
    const hari = (d.getDay() + 6) % 7
    const dari = new Date(d); dari.setDate(d.getDate() - hari); dari.setHours(0, 0, 0, 0)
    return { dari: dari.getTime(), hingga: dari.getTime() + 7 * 86400_000 }
  }
  if (p === 'bulan') {
    const dari = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    return { dari, hingga: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() }
  }
  return { dari: new Date(d.getFullYear(), 0, 1).getTime(), hingga: new Date(d.getFullYear() + 1, 0, 1).getTime() }
}

export function kemajuanTarget(
  workouts: ImportedWorkout[],
  target: Target,
  sekarang = Date.now(),
): KemajuanTarget {
  const { dari, hingga } = awalPeriode(target.periode, sekarang)
  const dalam = workouts.filter((w) => {
    const t = Date.parse(w.mulai)
    return !Number.isNaN(t) && t >= dari && t < hingga
  })
  const tercapai =
    target.jenis === 'jarak' ? +dalam.reduce((a, w) => a + (w.jarakKm ?? 0), 0).toFixed(1)
      : target.jenis === 'waktu' ? Math.round(dalam.reduce((a, w) => a + w.durasi, 0) / 60)
        : dalam.length
  const satuan = target.jenis === 'jarak' ? 'km' : target.jenis === 'waktu' ? 'menit' : 'sesi'
  const sisaMs = Math.max(0, hingga - sekarang)
  const sisaHari = Math.ceil(sisaMs / 86400_000)
  const kurang = Math.max(0, target.nilai - tercapai)
  const totalHari = Math.max(1, Math.round((hingga - dari) / 86400_000))
  const berlalu = Math.max(0, Math.min(totalHari, (sekarang - dari) / 86400_000))
  // Di jalur bila capaian saat ini minimal sebanding dengan porsi waktu terpakai.
  const diJalur = target.nilai <= 0 ? true : tercapai >= (target.nilai * berlalu) / totalHari
  return {
    tercapai,
    sasaran: target.nilai,
    pct: target.nilai > 0 ? Math.min(100, Math.round((tercapai / target.nilai) * 100)) : 0,
    satuan,
    sisaHari,
    perluPerHari: sisaHari > 0 ? +(kurang / sisaHari).toFixed(1) : kurang,
    diJalur,
  }
}

// ── 7. Zona pace ────────────────────────────────────────────────────────────

export interface ZonaPace {
  nama: string
  dariSec: number
  hinggaSec: number
  sesi: number
  km: number
  warna: string
}

/**
 * Zona pace lari dari pace ambang (threshold), pendekatan yang sama dengan
 * VDOT: zona dinyatakan sebagai persentase pace ambang, bukan angka mutlak,
 * sehingga ikut bergeser saat kebugaran berubah.
 */
export function zonaPace(workouts: ImportedWorkout[], paceAmbangSec: number): ZonaPace[] {
  const def: { nama: string; lo: number; hi: number; warna: string }[] = [
    { nama: 'Pemulihan', lo: 1.29, hi: 99, warna: '#94a3b8' },
    { nama: 'Mudah', lo: 1.15, hi: 1.29, warna: '#34d399' },
    { nama: 'Maraton', lo: 1.06, hi: 1.15, warna: '#60a5fa' },
    { nama: 'Ambang', lo: 0.97, hi: 1.06, warna: '#fbbf24' },
    { nama: 'Interval', lo: 0, hi: 0.97, warna: '#f87171' },
  ]
  return def.map((z) => {
    const dariSec = Math.round(paceAmbangSec * z.lo)
    const hinggaSec = z.hi === 99 ? Infinity : Math.round(paceAmbangSec * z.hi)
    let sesi = 0
    let km = 0
    for (const w of workouts) {
      if (!w.paceSec || !w.jarakKm) continue
      if (w.paceSec >= dariSec && w.paceSec < hinggaSec) { sesi++; km += w.jarakKm }
    }
    return { nama: z.nama, dariSec, hinggaSec, sesi, km: +km.toFixed(1), warna: z.warna }
  })
}

/** Pace ambang diperkirakan dari sesi tercepat berdurasi ≥20 menit. */
export function perkiraanPaceAmbang(workouts: ImportedWorkout[]): number | null {
  const calon = workouts.filter((w) => w.paceSec && w.durasi >= 1200 && (w.jarakKm ?? 0) >= 3)
  if (!calon.length) return null
  return Math.min(...calon.map((w) => w.paceSec!))
}

// ── 8. Yang tidak dibangun, dan alasannya ───────────────────────────────────

export const TIDAK_DIBANGUN: { fitur: string; kenapa: string }[] = [
  {
    fitur: 'Segmen, papan peringkat, dan Live Segments',
    kenapa: 'Menuntut basis data rute publik beserta jutaan percobaan pengguna lain untuk dijadikan pembanding. Ini persoalan platform dan komunitas, bukan rumus — angka apa pun yang dibuat sendiri di sini akan menyesatkan karena tidak ada yang diperbandingkan.',
  },
  {
    fitur: 'Peta rute, heatmap pribadi, peta luring, dan Beacon',
    kenapa: 'Semuanya menuntut jejak GPS. Server ini SENGAJA membuang larik rute sebelum menyimpan: itu bagian paling sensitif dari kiriman, dan menyimpan riwayat lokasi seseorang "siapa tahu berguna nanti" bukan alasan yang cukup. Bila kelak fitur peta benar-benar dibuat, penyimpanannya akan diminta izinnya secara terpisah.',
  },
  {
    fitur: 'Split dan usaha terbaik di dalam satu sesi',
    kenapa: 'Ekspor yang masuk membawa deret detak jantung, bukan jarak per titik waktu. Tanpa jarak kumulatif, "5 km tercepat di dalam lari 10 km" tidak bisa dihitung — hanya sesi utuh yang bisa dibandingkan.',
  },
  {
    fitur: 'Cuaca pada aktivitas',
    kenapa: 'Butuh riwayat cuaca per koordinat dan waktu, yang berarti menyimpan lokasi tiap sesi. Ditahan atas alasan yang sama dengan peta rute.',
  },
]
