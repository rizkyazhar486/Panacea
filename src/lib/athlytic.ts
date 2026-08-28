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

// ─────────────────────────────────────────────────────────────────────────────
// Panel lanjutan: kebugaran kardio, pemulihan denyut, adaptasi, rekor, dan
// ringkasan bulanan serta tahunan.
// ─────────────────────────────────────────────────────────────────────────────

export interface TitikTren {
  tanggal: string
  nilai: number
}

export interface KebugaranKardio {
  kini: number
  /** Perubahan terhadap nilai 90 hari lalu, bila ada. */
  delta: number | null
  deret: TitikTren[]
  /** Rentang usia-jenis kelamin: titik tengah dan posisi orang ini. */
  titikTengah: number
  pita: string
  selisihMet: number
  /** Rasio bahaya kematian terhadap orang seusia di titik tengah (Kodama 2009). */
  hr: number
  perkiraan: boolean
}

/**
 * VO2max terhadap orang seusianya.
 *
 * MEMAKAI TITIK TENGAH SEUSIA, BUKAN PITA "poor-superior" TETAP. VO2max 42
 * pada usia 25 dan pada usia 60 adalah dua hal yang sama sekali berbeda, dan
 * pita tetap yang tidak memandang usia membuat yang muda merasa aman dan yang
 * tua merasa gagal tanpa dasar.
 */
export function kebugaranKardio<J>(
  deretVo2: TitikTren[],
  usia: number,
  jk: J,
  nilaiKebugaranFn: (vo2: number, usia: number, jk: J) => {
    titikTengah: number; pita: string; selisihMet: number; hrTerhadapTitikTengah: number
  } | null,
  perkiraan = false,
): KebugaranKardio | null {
  if (!deretVo2.length) return null
  const kini = deretVo2[deretVo2.length - 1].nilai
  const nilai = nilaiKebugaranFn(kini, usia, jk)
  if (!nilai) return null
  const lama = deretVo2.find((d) => Date.parse(`${d.tanggal}T00:00:00`) <= Date.now() - 90 * 86400_000)
  return {
    kini: Math.round(kini * 10) / 10,
    delta: lama ? Math.round((kini - lama.nilai) * 10) / 10 : null,
    deret: deretVo2,
    titikTengah: Math.round(nilai.titikTengah * 10) / 10,
    pita: nilai.pita,
    selisihMet: Math.round(nilai.selisihMet * 10) / 10,
    hr: Math.round(nilai.hrTerhadapTitikTengah * 100) / 100,
    perkiraan,
  }
}

export interface PemulihanDenyut {
  rata: number
  terbaik: number
  jumlah: number
  deret: { tanggal: string; nilai: number }[]
  baca: string
}

/**
 * Penurunan denyut pada menit pertama sesudah sesi berakhir.
 *
 * Ia salah satu ukuran kebugaran otonom yang paling langsung: yang bugar
 * mengembalikan tonus parasimpatis lebih cepat. Penurunan di bawah 12 denyut
 * pada menit pertama berhubungan dengan risiko kematian yang lebih tinggi pada
 * penelitian aslinya — tetapi itu berlaku bagi KELOMPOK, dan pada satu orang
 * yang menentukan adalah ARAHNYA dari waktu ke waktu.
 */
export function pemulihanDenyut(workouts: { mulai: string; hrr1?: number }[]): PemulihanDenyut | null {
  const ada = workouts
    .filter((w) => typeof w.hrr1 === 'number' && Number.isFinite(w.hrr1) && (w.hrr1 as number) > 0)
    .map((w) => ({ tanggal: kunciHari(new Date(w.mulai)), nilai: w.hrr1 as number }))
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
  if (ada.length < 3) return null
  const rata = ada.reduce((a, d) => a + d.nilai, 0) / ada.length
  const terbaik = Math.max(...ada.map((d) => d.nilai))
  const baca =
    rata >= 25 ? 'A fast return — this is what a well-trained autonomic system looks like.'
      : rata >= 18 ? 'A healthy return.'
        : rata >= 12 ? 'Within the ordinary range. It tends to rise as aerobic fitness rises.'
          : 'Slower than 12 beats in the first minute. In the original studies this pattern was associated with higher risk at the level of GROUPS — for one person what matters is the direction over months, and it is worth mentioning to a doctor rather than acting on alone.'
  return { rata: Math.round(rata), terbaik, jumlah: ada.length, deret: ada.slice(-30), baca }
}

export interface Adaptasi {
  hrvRata: number | null
  /** Koefisien variasi HRV dalam persen — makin kecil makin mantap. */
  hrvCov: number | null
  hrvArah: number | null
  rhrRata: number | null
  rhrArah: number | null
  hari: number
  baca: string
}

/**
 * Kemantapan dan arah dua penanda adaptasi: variabilitas denyut dan denyut
 * istirahat.
 *
 * KOEFISIEN VARIASI DIPAKAI, BUKAN SIMPANGAN BAKU MENTAH. HRV seseorang yang
 * rata-ratanya 90 ms wajar bergoyang lebih lebar daripada yang rata-ratanya
 * 30 ms; simpangan baku mentah akan menyebut yang pertama "tidak stabil"
 * semata karena angkanya lebih besar.
 */
export function adaptasi(
  hrv: TitikTren[],
  rhr: TitikTren[],
  hari = 28,
): Adaptasi | null {
  const batas = Date.now() - hari * 86400_000
  const dalam = (l: TitikTren[]) => l.filter((d) => Date.parse(`${d.tanggal}T00:00:00`) >= batas)
  const h = dalam(hrv)
  const r = dalam(rhr)
  if (h.length < 7 && r.length < 7) return null

  const rata = (l: TitikTren[]) => (l.length ? l.reduce((a, d) => a + d.nilai, 0) / l.length : null)
  const arah = (l: TitikTren[]) => {
    if (l.length < 8) return null
    const tengah = Math.floor(l.length / 2)
    const a = rata(l.slice(0, tengah))
    const b = rata(l.slice(tengah))
    return a != null && b != null ? Math.round((b - a) * 10) / 10 : null
  }
  const hrvRata = rata(h)
  let cov: number | null = null
  if (h.length >= 7 && hrvRata && hrvRata > 0) {
    const varians = h.reduce((a, d) => a + (d.nilai - hrvRata) ** 2, 0) / h.length
    cov = Math.round((Math.sqrt(varians) / hrvRata) * 1000) / 10
  }
  const rhrRata = rata(r)
  const hrvArah = arah(h)
  const rhrArah = arah(r)

  const baca =
    cov != null && cov > 15
      ? `HRV is swinging widely (${cov}% of its own average). Wide swings usually mean the load, sleep or stress is changing faster than the body is settling.`
      : hrvArah != null && rhrArah != null && hrvArah > 0 && rhrArah < 0
        ? 'HRV rising and resting heart rate falling together — the clearest signal that training is being absorbed.'
        : hrvArah != null && rhrArah != null && hrvArah < 0 && rhrArah > 0
          ? 'HRV falling and resting heart rate rising together. Two or three weeks of this is the pattern that precedes overreaching.'
          : 'Both markers are steady. Steady is the normal state; it is the sustained drift in one direction that carries information.'

  return {
    hrvRata: hrvRata != null ? Math.round(hrvRata) : null,
    hrvCov: cov,
    hrvArah,
    rhrRata: rhrRata != null ? Math.round(rhrRata) : null,
    rhrArah,
    hari: Math.max(h.length, r.length),
    baca,
  }
}

export interface Rekor {
  label: string
  nilai: string
  tanggal: string
}

/** Rekor pribadi dari sesi yang benar-benar tercatat. */
export function rekorPribadi(sesi: SesiTerhitung[]): Rekor[] {
  const out: Rekor[] = []
  const fmtTgl = (s: string) => kunciHari(new Date(s))

  const terjauh = sesi.reduce<SesiTerhitung | null>((a, s) => (!a || (s.jarakKm ?? 0) > (a.jarakKm ?? 0) ? s : a), null)
  if (terjauh?.jarakKm) out.push({ label: 'Longest distance', nilai: `${terjauh.jarakKm.toFixed(1)} km`, tanggal: fmtTgl(terjauh.mulai) })

  const terlama = sesi.reduce<SesiTerhitung | null>((a, s) => (!a || s.durasiDetik > a.durasiDetik ? s : a), null)
  if (terlama && terlama.durasiDetik > 0) {
    out.push({ label: 'Longest session', nilai: `${Math.round(terlama.durasiDetik / 60)} min`, tanggal: fmtTgl(terlama.mulai) })
  }

  const terberat = sesi.reduce<SesiTerhitung | null>((a, s) => (!a || s.trimp > a.trimp ? s : a), null)
  if (terberat && terberat.trimp > 0) out.push({ label: 'Hardest session', nilai: `${Math.round(terberat.trimp)} load`, tanggal: fmtTgl(terberat.mulai) })

  // Pace terbaik hanya dari sesi yang jaraknya cukup untuk berarti.
  const cepat = sesi
    .filter((s) => (s.jarakKm ?? 0) >= 3 && s.durasiDetik > 0)
    .reduce<SesiTerhitung | null>((a, s) => {
      const p = s.durasiDetik / (s.jarakKm as number)
      const pa = a ? a.durasiDetik / (a.jarakKm as number) : Infinity
      return p < pa ? s : a
    }, null)
  if (cepat?.jarakKm) {
    const sec = cepat.durasiDetik / cepat.jarakKm
    out.push({
      label: 'Fastest pace (3 km+)',
      nilai: `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} /km`,
      tanggal: fmtTgl(cepat.mulai),
    })
  }

  return out
}

export interface Bulanan {
  bulan: string
  sesi: number
  menit: number
  km: number
  beban: number
}

/** Ringkasan per bulan kalender untuk n bulan terakhir. */
export function rekapBulanan(sesi: SesiTerhitung[], bulan = 6, sekarang = Date.now()): Bulanan[] {
  const peta = new Map<string, Bulanan>()
  for (const s of sesi) {
    const t = new Date(s.mulai)
    if (Number.isNaN(t.getTime())) continue
    const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
    const p = peta.get(k) ?? { bulan: k, sesi: 0, menit: 0, km: 0, beban: 0 }
    p.sesi += 1
    p.menit += s.durasiDetik / 60
    p.km += s.jarakKm ?? 0
    p.beban += s.trimp
    peta.set(k, p)
  }
  const out: Bulanan[] = []
  const d = new Date(sekarang)
  for (let i = bulan - 1; i >= 0; i--) {
    const b = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const k = `${b.getFullYear()}-${String(b.getMonth() + 1).padStart(2, '0')}`
    const p = peta.get(k)
    out.push(p
      ? { ...p, menit: Math.round(p.menit), km: Math.round(p.km * 10) / 10, beban: Math.round(p.beban) }
      : { bulan: k, sesi: 0, menit: 0, km: 0, beban: 0 })
  }
  return out
}

/** Satu petak per hari selama 364 hari terakhir, untuk kisi setahun. */
export function petakTahun(sesi: SesiTerhitung[], sekarang = Date.now()): TitikHarian[] {
  return bebanHarian(sesi, 364, sekarang)
}
