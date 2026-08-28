import { hitungSesi, ringkasBeban, type Konteks, type SesiTerhitung } from './trainingPhysiology'
import { sesiDariWorkout } from './analisisPro'
import type { ImportedWorkout } from './workoutImport'
import { kunciHari } from './tanggal'
import { deretMetrik, CUKUP_HARI } from './riwayatVitals'
import { kesiapan } from './trainingPhysiology'

// ─────────────────────────────────────────────────────────────────────────────
// Panel-panel bergaya papan atlet: beban, rasio, fokus, kapan berlatih, dan
// hubungan antara upaya dan pemulihan.
//
// SEMUANYA DIHITUNG DARI SESI YANG SUDAH ADA. Tidak ada satu pun angka di sini
// yang datang dari sumber baru — yang ditambahkan hanyalah cara membacanya:
// mengelompokkan per pekan, per bulan, per jam dalam sehari, dan memasangkan
// upaya hari ini dengan pemulihan besok paginya.
//
// TIGA HAL YANG SENGAJA TIDAK DIBUAT, meski ada di aplikasi yang ditiru:
//
//   1. SATU SKOR GABUNGAN yang mencampur beban, tidur, dan HRV menjadi satu
//      angka "kesiapan sempurna". Sudah ada skor kesiapan yang MENAMPILKAN
//      tiap faktornya; menambah satu angka lagi yang menyembunyikan asalnya
//      justru mundur.
//   2. RENTANG "OPTIMAL" YANG DIPATOK ANGKA TETAP. Rentang di sini diturunkan
//      dari beban kronis ORANG ITU SENDIRI, sebab beban yang optimal bagi
//      pelari maraton adalah beban yang mencederai orang yang baru mulai.
//   3. ANALISIS DAMPAK ("tidur larut menurunkan pemulihan 12%") tanpa cukup
//      hari. Ia hanya muncul setelah ada pasangan hari yang cukup, dan
//      jumlah pasangannya selalu disebut.
// ─────────────────────────────────────────────────────────────────────────────

export interface TitikHarian {
  tanggal: string
  /** TRIMP hari itu; 0 bila tidak berlatih. */
  beban: number
  sesi: number
  menit: number
}

/** Beban per hari kalender setempat untuk n hari terakhir, termasuk hari kosong. */
export function bebanHarian(sesi: SesiTerhitung[], hari = 30, sekarang = Date.now()): TitikHarian[] {
  const peta = new Map<string, TitikHarian>()
  for (const s of sesi) {
    const t = Date.parse(s.mulai)
    if (!Number.isFinite(t)) continue
    const k = kunciHari(new Date(t))
    const p = peta.get(k) ?? { tanggal: k, beban: 0, sesi: 0, menit: 0 }
    p.beban += s.trimp
    p.sesi += 1
    p.menit += s.durasiDetik / 60
    peta.set(k, p)
  }
  const out: TitikHarian[] = []
  for (let i = hari - 1; i >= 0; i--) {
    const d = new Date(sekarang - i * 86400_000)
    const k = kunciHari(d)
    const p = peta.get(k)
    out.push(p ? { ...p, beban: Math.round(p.beban), menit: Math.round(p.menit) } : { tanggal: k, beban: 0, sesi: 0, menit: 0 })
  }
  return out
}

export interface RentangBeban {
  /** Beban 7 hari sekarang. */
  akut: number
  /** Rata-rata beban 28 hari, dikalikan tujuh agar sebanding dengan akut. */
  kronisPekan: number
  bawah: number
  atas: number
  posisi: 'di bawah' | 'di dalam' | 'di atas'
  /** false bila riwayatnya belum cukup panjang untuk menyebut rentang apa pun. */
  dapatDipercaya: boolean
  hariData: number
}

/**
 * Rentang beban pekan yang wajar, DITURUNKAN DARI BEBAN ORANG ITU SENDIRI.
 *
 * Batasnya 0,8 dan 1,3 kali beban kronis — sama dengan rentang nisbah yang
 * lazim dipakai, hanya dinyatakan sebagai beban pekanan supaya dapat digambar
 * sebagai pita di belakang batang, bukan sebagai angka yang harus ditafsirkan.
 */
export function rentangBeban(sesi: SesiTerhitung[], sekarang = Date.now()): RentangBeban {
  const b = ringkasBeban(sesi, sekarang)
  const kronisPekan = Math.round(b.kronis * 7)
  const akut = Math.round(b.total7)
  const bawah = Math.round(kronisPekan * 0.8)
  const atas = Math.round(kronisPekan * 1.3)
  return {
    akut,
    kronisPekan,
    bawah,
    atas,
    posisi: akut < bawah ? 'di bawah' : akut > atas ? 'di atas' : 'di dalam',
    dapatDipercaya: b.acwrDapatDipercaya,
    hariData: b.rentangHariData,
  }
}

export interface Fokus {
  rendah: number
  tinggi: number
  anaerobik: number
  totalMenit: number
  /** Kalimat yang menyebut ketimpangannya, bila ada. */
  baca: string
}

/** Sebaran menit 28 hari ke tiga pita intensitas. */
export function fokusBeban(sesi: SesiTerhitung[], sekarang = Date.now()): Fokus | null {
  const b = ringkasBeban(sesi, sekarang)
  if (b.pctAerobikRendah == null) return null
  const menit = sesi
    .filter((s) => Date.parse(s.mulai) >= sekarang - 28 * 86400_000)
    .reduce((a, s) => a + s.zona.reduce((x, z) => x + z.menit, 0), 0)
  const rendah = b.pctAerobikRendah
  const tinggi = b.pctAerobikTinggi ?? 0
  const anaerobik = b.pctAnaerobik ?? 0
  const baca =
    rendah < 60
      ? `Only ${rendah}% of your minutes are easy. The pattern that raises fitness with the least fatigue puts roughly 80% there — most people who feel permanently tired are somewhere near this number.`
      : anaerobik < 2
        ? `${rendah}% easy, and almost nothing anaerobic. Good base, but without any hard minutes the top end stops improving.`
        : `${rendah}% low aerobic, ${tinggi}% high aerobic, ${anaerobik}% anaerobic — a workable spread.`
  return { rendah, tinggi, anaerobik, totalMenit: Math.round(menit), baca }
}

export interface SelPetak {
  hari: number
  jam: number
  jumlah: number
}

/** Kapan Anda benar-benar berlatih: hari dalam pekan x jam dalam sehari. */
export function kapanBerlatih(sesi: SesiTerhitung[]): { sel: SelPetak[]; puncak: SelPetak | null } {
  const peta = new Map<string, SelPetak>()
  for (const s of sesi) {
    const t = new Date(s.mulai)
    if (Number.isNaN(t.getTime())) continue
    const k = `${t.getDay()}-${t.getHours()}`
    const p = peta.get(k) ?? { hari: t.getDay(), jam: t.getHours(), jumlah: 0 }
    p.jumlah += 1
    peta.set(k, p)
  }
  const sel = Array.from(peta.values())
  const puncak = sel.reduce<SelPetak | null>((a, s) => (!a || s.jumlah > a.jumlah ? s : a), null)
  return { sel, puncak }
}

export interface Pekanan {
  label: string
  mulai: string
  beban: number
  menit: number
  sesi: number
}

/** Beban per pekan untuk n pekan terakhir. */
export function bebanPekanan(sesi: SesiTerhitung[], pekan = 12, sekarang = Date.now()): Pekanan[] {
  const out: Pekanan[] = []
  for (let i = pekan - 1; i >= 0; i--) {
    const akhir = sekarang - i * 7 * 86400_000
    const mulai = akhir - 7 * 86400_000
    const dalam = sesi.filter((s) => {
      const t = Date.parse(s.mulai)
      return t > mulai && t <= akhir
    })
    out.push({
      label: i === 0 ? 'This week' : `${i}w ago`,
      mulai: kunciHari(new Date(mulai)),
      beban: Math.round(dalam.reduce((a, s) => a + s.trimp, 0)),
      menit: Math.round(dalam.reduce((a, s) => a + s.durasiDetik / 60, 0)),
      sesi: dalam.length,
    })
  }
  return out
}

export interface Pasangan {
  tanggal: string
  beban: number
  pemulihan: number
}

/**
 * Upaya hari ini dipasangkan dengan pemulihan BESOK PAGINYA.
 *
 * Arah waktunya menentukan seluruh maknanya. Memasangkan upaya hari ini dengan
 * pemulihan pagi ini menjawab pertanyaan yang keliru — pemulihan pagi ini
 * dibentuk oleh malam sebelumnya, bukan oleh sesi yang belum terjadi.
 */
export function upayaLawanPemulihan(
  sesi: SesiTerhitung[],
  pemulihanHarian: { tanggal: string; nilai: number }[],
  hari = 60,
  sekarang = Date.now(),
): Pasangan[] {
  const beban = new Map(bebanHarian(sesi, hari, sekarang).map((d) => [d.tanggal, d.beban]))
  const out: Pasangan[] = []
  for (const p of pemulihanHarian) {
    const t = Date.parse(`${p.tanggal}T00:00:00`)
    if (!Number.isFinite(t)) continue
    const kemarin = kunciHari(new Date(t - 86400_000))
    const b = beban.get(kemarin)
    if (b == null) continue
    out.push({ tanggal: p.tanggal, beban: b, pemulihan: p.nilai })
  }
  return out
}

export interface Dampak {
  judul: string
  hariBeban: number
  hariSantai: number
  selisih: number
  pasangan: number
}

/**
 * Apakah hari berat benar-benar menurunkan pemulihan esok paginya.
 *
 * Dibandingkan RATA-RATA pemulihan sesudah hari dengan beban di atas median
 * terhadap sesudah hari di bawahnya. Ia perbandingan sederhana dan disebut
 * begitu — bukan sebab-akibat, dan jumlah pasangannya selalu ditampilkan.
 */
export function dampakBeban(pasangan: Pasangan[]): Dampak | null {
  const berlatih = pasangan.filter((p) => p.beban > 0)
  if (berlatih.length < 8) return null
  const urut = [...berlatih].map((p) => p.beban).sort((a, b) => a - b)
  const median = urut[Math.floor(urut.length / 2)]
  const berat = berlatih.filter((p) => p.beban >= median)
  const ringan = pasangan.filter((p) => p.beban < median)
  if (berat.length < 4 || ringan.length < 4) return null
  const rata = (l: Pasangan[]) => l.reduce((a, p) => a + p.pemulihan, 0) / l.length
  const a = rata(berat)
  const b = rata(ringan)
  return {
    judul: 'Recovery the morning after',
    hariBeban: Math.round(a),
    hariSantai: Math.round(b),
    selisih: Math.round(a - b),
    pasangan: pasangan.length,
  }
}

/** Membangun sesi terhitung dari workout mentah — satu pintu untuk semua panel. */
export function siapkan(workouts: ImportedWorkout[], k: Konteks): SesiTerhitung[] {
  return hitungSesi(workouts.map(sesiDariWorkout), k)
}


/**
 * Nilai pemulihan harian, dari apa pun yang benar-benar tersedia.
 *
 * URUTANNYA MENENTUKAN. Bila alatnya sendiri melaporkan persentase pemulihan
 * (recoveryPct), itulah yang dipakai — angka dari alat mengalahkan angka
 * turunan. Bila tidak ada, ia DIHITUNG dari variabilitas denyut, denyut
 * istirahat, dan lama tidur terhadap kebiasaan orang itu sendiri, memakai
 * mesin kesiapan yang sudah ada.
 *
 * Kalau tidak ada satu pun dari itu, hasilnya larik kosong — dan panel yang
 * memakainya tidak digambar. Tidak ada nilai bawaan: pemulihan 50 yang
 * dikarang akan dibaca sebagai hasil pengukuran.
 */
export function pemulihanHarian(hari = 90): { tanggal: string; nilai: number }[] {
  const dariAlat = deretMetrik('recoveryPct', hari)
  if (dariAlat.length >= 8) return dariAlat

  const hrv = new Map(deretMetrik('hrvMs', hari).map((d) => [d.tanggal, d.nilai]))
  const rhr = new Map(deretMetrik('restingHr', hari).map((d) => [d.tanggal, d.nilai]))
  const tidur = new Map(deretMetrik('sleepH', hari).map((d) => [d.tanggal, d.nilai]))
  if (hrv.size < CUKUP_HARI && rhr.size < CUKUP_HARI) return []

  const rata = (m: Map<string, number>) =>
    m.size ? Array.from(m.values()).reduce((a, b) => a + b, 0) / m.size : undefined
  const hrvDasar = rata(hrv)
  const rhrDasar = rata(rhr)

  const tanggal = Array.from(new Set([...hrv.keys(), ...rhr.keys(), ...tidur.keys()])).sort()
  const out: { tanggal: string; nilai: number }[] = []
  for (const t of tanggal) {
    const k = kesiapan({
      tidurJam: tidur.get(t),
      hrvMs: hrv.get(t),
      hrvBaseline: hrvDasar,
      restingHr: rhr.get(t),
      restingBaseline: rhrDasar,
    })
    // Hanya hari yang punya sedikitnya satu faktor nyata yang dicatat; tanpa
    // itu kesiapan mengembalikan nilai awalnya dan itu bukan pengukuran.
    if (k.faktor.length > 0) out.push({ tanggal: t, nilai: k.skor })
  }
  return out
}
