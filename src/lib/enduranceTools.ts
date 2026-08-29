// ─────────────────────────────────────────────────────────────────────────────
// Alat endurance yang berdiri sendiri: bahan bakar, panduan daya, FTP, dan
// aklimatisasi panas/ketinggian.
//
// Kenapa berkas ini ada terpisah dari trainingPhysiology: modul itu MEMBACA
// data yang sudah terekam. Yang di sini MERENCANAKAN sesuatu yang belum
// terjadi, dan karena itu tidak boleh bergantung pada ekspor jam tangan sama
// sekali. Semua masukannya berasal dari pengguna — jarak lomba, profil
// tanjakan, hasil tes FTP, suhu tempat berlatih — sehingga fiturnya tetap
// bekerja pada orang yang bersepeda maupun berenang, memakai power meter apa
// pun, atau belum menyinkronkan apa pun.
//
// Seluruh angka rujukan di sini berasal dari literatur gizi dan fisiologi
// olahraga yang sudah mapan, dan setiap fungsi menyebutkan dasarnya.
// ─────────────────────────────────────────────────────────────────────────────

// ═══ 1. RENCANA BAHAN BAKAR ═════════════════════════════════════════════════

export interface UjiKeringat {
  beratSebelumKg: number
  beratSesudahKg: number
  durasiMenit: number
  minumMl: number
  /** Urin selama sesi, bila sempat ditimbang. */
  urinMl?: number
}

export interface LajuKeringat {
  mlPerJam: number
  /** Persen berat badan yang hilang — di atas 2% mulai menurunkan performa. */
  pctKehilangan: number
  catatan: string
}

/**
 * Laju keringat dari selisih berat badan.
 *
 *   keringat = (berat sebelum − berat sesudah) + minum − urin
 *
 * Ini satu-satunya cara yang masuk akal untuk mengetahui kebutuhan cairan
 * seseorang, karena laju keringat berbeda sampai tiga kali lipat antarorang
 * pada suhu yang sama. Anjuran umum "minum 500 mL per jam" karena itu bisa
 * jauh terlalu sedikit bagi satu orang dan berlebihan bagi yang lain.
 */
export function lajuKeringat(u: UjiKeringat): LajuKeringat | null {
  if (!(u.durasiMenit > 0) || !(u.beratSebelumKg > 0) || !(u.beratSesudahKg > 0)) return null
  const hilangGram = (u.beratSebelumKg - u.beratSesudahKg) * 1000
  const keringatMl = hilangGram + (u.minumMl || 0) - (u.urinMl || 0)
  const mlPerJam = Math.round((keringatMl / u.durasiMenit) * 60)
  const pctKehilangan = +(((u.beratSebelumKg - u.beratSesudahKg) / u.beratSebelumKg) * 100).toFixed(2)

  const catatan = pctKehilangan >= 2
    ? `You lost ${pctKehilangan}% of your body weight. Above 2%, endurance performance starts to fall and fatigue arrives sooner — you under-drank on this session.`
    : pctKehilangan <= -1
      ? 'Your body weight WENT UP during the session. That is a sign of over-drinking; on long sessions it risks lowering blood sodium (hyponatraemia), which is more dangerous than mild dehydration.'
      : `Lost ${pctKehilangan}% of body weight — within a sensible range.`

  return { mlPerJam: Math.max(0, mlPerJam), pctKehilangan, catatan }
}

export interface RencanaBahanBakar {
  durasiMenit: number
  karboPerJamGram: number
  totalKarboGram: number
  cairanPerJamMl: number
  totalCairanMl: number
  natriumPerJamMg: number
  jadwal: { menit: number; isi: string }[]
  dasar: string[]
  peringatan: string[]
}

/**
 * Rencana karbohidrat, cairan, dan natrium untuk satu sesi.
 *
 * Anjuran karbohidrat mengikuti kerangka yang lazim dipakai:
 *   < 45 menit  : tidak perlu apa-apa
 *   45-75 menit : berkumur karbohidrat saja sudah membantu
 *   1-2,5 jam   : 30-60 g/jam
 *   > 2,5 jam   : 60-90 g/jam, dan di atas 60 g/jam HARUS memakai campuran
 *                 glukosa dan fruktosa karena penyerapan glukosa sendiri
 *                 jenuh di sekitar 60 g/jam.
 *
 * Bagian glukosa-fruktosa itu yang paling sering dilewatkan, dan justru itu
 * yang menyebabkan mual serta gangguan perut pada lomba panjang.
 */
export function rencanaBahanBakar(opsi: {
  durasiMenit: number
  intensitas: 'mudah' | 'sedang' | 'berat'
  beratKg: number
  lajuKeringatMlPerJam?: number
  suhuC?: number
  perutSensitif?: boolean
}): RencanaBahanBakar {
  const { durasiMenit, intensitas, beratKg } = opsi
  const jam = durasiMenit / 60
  const dasar: string[] = []
  const peringatan: string[] = []

  let karboPerJamGram = 0
  if (durasiMenit < 45) {
    dasar.push('Under 45 minutes, your stored glycogen is enough — no carbohydrate needed during the session.')
  } else if (durasiMenit < 75) {
    karboPerJamGram = intensitas === 'berat' ? 30 : 0
    dasar.push(karboPerJamGram > 0
      ? '45-75 menit pada intensitas berat: 30 g/jam, atau cukup berkumur minuman karbohidrat — efeknya lewat rangsangan di mulut, bukan lewat penyerapan.'
      : '45-75 menit intensitas ringan-sedang: belum perlu karbohidrat.')
  } else if (durasiMenit <= 150) {
    karboPerJamGram = intensitas === 'berat' ? 60 : 45
    dasar.push('1–2.5 hours: 30–60 g/h is the usual range; the upper end is taken for hard intensity.')
  } else {
    karboPerJamGram = intensitas === 'berat' ? 90 : 70
    dasar.push('Beyond 2.5 hours: 60–90 g/h. Glucose absorption saturates around 60 g/h, so above that you MUST use a glucose-fructose mix (roughly 2:1) — fructose takes a different absorption route and does not saturate with it.')
    peringatan.push('Above 60 g/h, use a glucose-fructose product. Forcing glucose alone at this dose is the most common cause of nausea and gut trouble on race day.')
  }

  if (opsi.perutSensitif && karboPerJamGram > 60) {
    karboPerJamGram = 60
    peringatan.push('The dose is reduced to 60 g/h because you flagged a sensitive stomach. Gut tolerance can be TRAINED: add 10 g/h every two weeks on long training sessions, never on race day.')
  }

  // Cairan: pakai laju keringat sendiri bila ada; kalau tidak, perkiraan kasar
  // yang dinaikkan bila panas.
  let cairanPerJamMl = opsi.lajuKeringatMlPerJam ?? 0
  if (cairanPerJamMl > 0) {
    dasar.push(`Fluid follows your own measured sweat rate (${cairanPerJamMl} mL/h) — far more accurate than any generic advice.`)
  } else {
    cairanPerJamMl = 500
    if ((opsi.suhuC ?? 25) >= 28) cairanPerJamMl = 750
    if ((opsi.suhuC ?? 25) >= 32) cairanPerJamMl = 900
    dasar.push('No sweat test on file, so a temperature-adjusted general estimate is used. Run a sweat test to get a number that is actually yours.')
    peringatan.push('This fluid figure is an ESTIMATE. Sweat rate varies by up to three times between people at the same temperature.')
  }
  // Minum melebihi laju keringat berisiko; batasi anjurannya.
  cairanPerJamMl = Math.min(cairanPerJamMl, 1000)

  // Natrium: makin panas dan makin lama, makin penting.
  let natriumPerJamMg = durasiMenit > 90 ? 500 : 300
  if ((opsi.suhuC ?? 25) >= 30) natriumPerJamMg += 200
  if (durasiMenit > 240) natriumPerJamMg = Math.max(natriumPerJamMg, 800)
  if (durasiMenit > 90) {
    dasar.push('Sodium is added because the session passes 90 minutes: on long efforts, drinking large volumes of plain water without salt can lower blood sodium.')
  }

  const jadwal: { menit: number; isi: string }[] = []
  if (durasiMenit >= 45) {
    const langkah = karboPerJamGram >= 60 ? 20 : 30
    for (let m = langkah; m < durasiMenit; m += langkah) {
      const gram = Math.round((karboPerJamGram * langkah) / 60)
      const ml = Math.round((cairanPerJamMl * langkah) / 60)
      jadwal.push({ menit: m, isi: `${gram > 0 ? `${gram} g carbohydrate + ` : ''}${ml} mL fluid` })
    }
  }
  if (durasiMenit >= 90) {
    peringatan.push('Rehearse this plan on long training sessions BEFORE using it in a race. The gut needs habituating, and race day is not the place to try something new.')
  }

  return {
    durasiMenit,
    karboPerJamGram,
    totalKarboGram: Math.round(karboPerJamGram * jam),
    cairanPerJamMl,
    totalCairanMl: Math.round(cairanPerJamMl * jam),
    natriumPerJamMg,
    jadwal,
    dasar,
    peringatan,
  }
}

// ═══ 2. FTP & ZONA DAYA ═════════════════════════════════════════════════════

export type TesFtp = 'tes20menit' | 'tes8menit' | 'ramp' | 'manual'

export interface HasilFtp {
  ftp: number
  wattPerKg: number | null
  metode: string
  kategori: string | null
  zona: { z: number; nama: string; dari: number; sampai: number | null; tujuan: string }[]
}

/**
 * FTP dari beberapa protokol tes yang lazim.
 *
 * Faktor pengalinya berbeda karena panjang tesnya berbeda: makin pendek tes,
 * makin besar sumbangan sistem anaerobik, sehingga makin besar pula angka yang
 * harus dipotong untuk sampai ke daya yang benar-benar bisa dipertahankan.
 */
export function hitungFtp(opsi: { metode: TesFtp; nilaiWatt: number; beratKg?: number; sex?: 'M' | 'F' }): HasilFtp | null {
  const { metode, nilaiWatt, beratKg } = opsi
  if (!(nilaiWatt > 0)) return null

  const faktor: Record<TesFtp, number> = {
    tes20menit: 0.95,
    tes8menit: 0.90,
    ramp: 0.75, // dari daya 1 menit terakhir
    manual: 1,
  }
  const nama: Record<TesFtp, string> = {
    tes20menit: '20-minute test — average power × 0.95',
    tes8menit: '2 × 8-minute test — best average × 0.90',
    ramp: 'Ramp test — final 1-minute power × 0.75',
    manual: 'Entered manually',
  }
  const ftp = Math.round(nilaiWatt * faktor[metode])
  const wattPerKg = beratKg && beratKg > 0 ? +(ftp / beratKg).toFixed(2) : null

  // Zona Coggan, dinyatakan sebagai persentase FTP.
  const zona = [
    { z: 1, nama: 'Active recovery', lo: 0, hi: 0.55, tujuan: 'Recover without adding load.' },
    { z: 2, nama: 'Endurance', lo: 0.56, hi: 0.75, tujuan: 'The aerobic base. This is where most riding hours should go.' },
    { z: 3, nama: 'Tempo', lo: 0.76, hi: 0.90, tujuan: 'The middle ground — useful, but if EVERY session lives here, progress stalls.' },
    { z: 4, nama: 'Threshold', lo: 0.91, hi: 1.05, tujuan: 'Raises FTP itself. Intervals of 8–20 minutes.' },
    { z: 5, nama: 'VO2max', lo: 1.06, hi: 1.20, tujuan: 'Raises maximal aerobic capacity. Intervals of 3–5 minutes.' },
    { z: 6, nama: 'Anaerobic capacity', lo: 1.21, hi: 1.50, tujuan: 'Short attacks of 30 seconds to 3 minutes.' },
    { z: 7, nama: 'Neuromuscular power', lo: 1.51, hi: null as number | null, tujuan: 'Sprints under 30 seconds.' },
  ].map((z) => ({
    z: z.z, nama: z.nama, tujuan: z.tujuan,
    dari: Math.round(ftp * z.lo),
    sampai: z.hi != null ? Math.round(ftp * z.hi) : null,
  }))

  return { ftp, wattPerKg, metode: nama[metode], kategori: wattPerKg != null ? kategoriWkg(wattPerKg, opsi.sex ?? 'M') : null, zona }
}

/** Rentang kasar yang lazim dipakai untuk menempatkan diri; bukan patokan medis. */
export function kategoriWkg(wkg: number, sex: 'M' | 'F'): string {
  const batas = sex === 'F'
    ? [[1.4, 'Beginner'], [2.2, 'Recreational'], [3.1, 'Moderately trained'], [4.0, 'Trained'], [4.8, 'Well trained'], [99, 'Elite level']] as const
    : [[1.8, 'Beginner'], [2.6, 'Recreational'], [3.5, 'Moderately trained'], [4.5, 'Trained'], [5.3, 'Well trained'], [99, 'Elite level']] as const
  for (const [b, l] of batas) if (wkg < b) return l
  return 'Elite level'
}

// ═══ 3. PANDUAN DAYA UNTUK RUTE ═════════════════════════════════════════════

export interface Segmen {
  nama: string
  jarakKm: number
  /** Kemiringan rata-rata dalam persen; negatif berarti menurun. */
  gradienPct: number
}

export interface TargetSegmen extends Segmen {
  targetWatt: number
  pctFtp: number
  perkiraanMenit: number
  perkiraanKmh: number
  catatan: string
}

export interface PanduanDaya {
  segmen: TargetSegmen[]
  totalMenit: number
  totalKm: number
  ifPerkiraan: number
  peringatan: string[]
}

/**
 * Kecepatan dari daya lewat persamaan tenaga bersepeda.
 *
 *   P = (gravitasi + gelinding + udara) / efisiensi transmisi
 *   gravitasi = m·g·sin(θ)·v
 *   gelinding = m·g·Crr·cos(θ)·v
 *   udara     = ½·ρ·CdA·v³
 *
 * Diselesaikan secara numerik karena suku udara membuatnya kubik.
 */
export function kecepatanDariDaya(opsi: {
  watt: number
  massaTotalKg: number
  gradienPct: number
  cda?: number
  crr?: number
  rho?: number
}): number {
  const { watt, massaTotalKg, gradienPct } = opsi
  const CdA = opsi.cda ?? 0.32
  const Crr = opsi.crr ?? 0.005
  const rho = opsi.rho ?? 1.225
  const g = 9.81
  const eff = 0.976
  const theta = Math.atan(gradienPct / 100)

  const dayaUntuk = (v: number) =>
    (massaTotalKg * g * Math.sin(theta) * v + massaTotalKg * g * Crr * Math.cos(theta) * v + 0.5 * rho * CdA * v * v * v) / eff

  // Bagi dua sampai konvergen; rentang 0,5-25 m/detik cukup untuk semua kasus nyata.
  let lo = 0.5, hi = 25
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (dayaUntuk(mid) > watt) hi = mid
    else lo = mid
  }
  return +(((lo + hi) / 2) * 3.6).toFixed(2)
}

/**
 * Menetapkan target daya per segmen.
 *
 * Aturan intinya: naik tanjakan pakai daya LEBIH TINGGI, turun dan datar pakai
 * LEBIH RENDAH. Ini berlawanan dengan naluri kebanyakan orang yang menjaga daya
 * tetap sama, padahal pada tanjakan setiap watt tambahan menghemat lebih banyak
 * waktu karena kecepatannya rendah dan hambatan udara kecil — sedangkan saat
 * menurun, watt tambahan hampir seluruhnya terbuang melawan udara.
 */
export function panduanDaya(opsi: {
  segmen: Segmen[]
  ftp: number
  targetIf: number
  massaTotalKg: number
  cda?: number
  crr?: number
}): PanduanDaya {
  const { segmen, ftp, targetIf, massaTotalKg } = opsi
  const peringatan: string[] = []

  const out: TargetSegmen[] = segmen.map((s) => {
    // Penyesuaian menurut kemiringan, dibatasi agar tetap masuk akal.
    let pengali = 1
    let catatan = 'Flat — hold power right on target, and resist the urge to push.'
    if (s.gradienPct >= 8) { pengali = 1.12; catatan = 'Steep climb — going above target is fine; at low speed every watt counts most.' }
    else if (s.gradienPct >= 4) { pengali = 1.07; catatan = 'Moderate climb — slightly above target.' }
    else if (s.gradienPct >= 1.5) { pengali = 1.03; catatan = 'Gentle climb — slightly above target.' }
    else if (s.gradienPct <= -4) { pengali = 0.7; catatan = 'Descent — ease off; almost all of it would be wasted against the air. Recover here.' }
    else if (s.gradienPct <= -1.5) { pengali = 0.85; catatan = 'Gentle descent — ease the power slightly.' }

    const targetWatt = Math.round(ftp * targetIf * pengali)
    const kmh = kecepatanDariDaya({ watt: targetWatt, massaTotalKg, gradienPct: s.gradienPct, cda: opsi.cda, crr: opsi.crr })
    const menit = kmh > 0 ? (s.jarakKm / kmh) * 60 : 0

    return { ...s, targetWatt, pctFtp: Math.round((targetWatt / ftp) * 100), perkiraanKmh: kmh, perkiraanMenit: +menit.toFixed(1), catatan }
  })

  const totalMenit = out.reduce((a, s) => a + s.perkiraanMenit, 0)
  const totalKm = out.reduce((a, s) => a + s.jarakKm, 0)

  if (targetIf > 0.85 && totalMenit > 120) {
    peringatan.push('An intensity above 0.85 FTP for a race longer than two hours is almost always too high. Most riders who blow up do it in the first hour.')
  }
  if (targetIf > 1) peringatan.push('A target above FTP cannot be held beyond about an hour, by the definition of FTP itself.')
  peringatan.push('Time estimates use default CdA and rolling-resistance values and do NOT account for wind. A headwind changes the result substantially.')

  return { segmen: out, totalMenit: +totalMenit.toFixed(1), totalKm: +totalKm.toFixed(2), ifPerkiraan: targetIf, peringatan }
}

/** Anjuran intensitas menurut lama lomba. */
export function saranIf(durasiJam: number): { if: number; ket: string } {
  if (durasiJam <= 0.5) return { if: 1.0, ket: 'Sekitar 30 menit: mendekati FTP.' }
  if (durasiJam <= 1) return { if: 0.95, ket: 'Sekitar 1 jam: 0,93-0,97 FTP.' }
  if (durasiJam <= 2) return { if: 0.85, ket: '1-2 jam: 0,83-0,87 FTP.' }
  if (durasiJam <= 3) return { if: 0.80, ket: '2-3 jam: 0,78-0,82 FTP.' }
  if (durasiJam <= 5) return { if: 0.73, ket: '3-5 jam: 0,70-0,75 FTP.' }
  return { if: 0.65, ket: 'Di atas 5 jam: 0,60-0,68 FTP. Menahan diri di awal jauh lebih menentukan daripada tenaga di akhir.' }
}

// ═══ 4. AKLIMATISASI PANAS & KETINGGIAN ═════════════════════════════════════

export interface PaparanPanas { tanggal: string; suhuC: number; menit: number }
export interface PaparanKetinggian { tanggal: string; meter: number; jam: number }

export interface StatusAklimatisasi {
  persen: number
  label: string
  hariEfektif: number
  penjelasan: string
  saran: string
}

/**
 * Aklimatisasi panas.
 *
 * Adaptasi utamanya — volume plasma bertambah, keringat muncul lebih awal dan
 * lebih encer, denyut jantung pada beban yang sama turun — berkembang dalam
 * sekitar 10-14 hari paparan berulang, dengan sebagian besar kemajuan pada
 * lima hari pertama. Ia juga LURUH cepat: sekitar seperempat hilang tiap
 * pekan tanpa paparan, jadi mempertahankannya butuh paparan berkala.
 */
export function aklimatisasiPanas(paparan: PaparanPanas[], sekarang = Date.now()): StatusAklimatisasi {
  let poin = 0
  for (const p of paparan) {
    const t = Date.parse(p.tanggal)
    if (Number.isNaN(t) || t > sekarang) continue
    const umurHari = (sekarang - t) / 86_400_000
    if (umurHari > 42) continue
    if (p.suhuC < 27 || p.menit < 30) continue // di bawah ini rangsangannya terlalu lemah

    const kuat = Math.min(1.5, (p.suhuC - 27) / 8 + 0.5) * Math.min(1.5, p.menit / 60)
    // Peluruhan: sekitar 2,5% per hari, mendekati seperempat per pekan.
    poin += kuat * Math.pow(0.975, umurHari)
  }
  // Pembagi 14 supaya "penuh" jatuh di ujung rentang 10-14 hari yang disebut
  // pada penjelasannya sendiri, bukan lebih cepat daripada yang dijanjikan teks.
  const persen = Math.min(100, Math.round((poin / 14) * 100))
  const hariEfektif = +(poin).toFixed(1)

  const label = persen >= 80 ? 'Acclimatised' : persen >= 50 ? 'Partly' : persen >= 20 ? 'Early' : 'Not yet'
  return {
    persen, label, hariEfektif,
    penjelasan: 'Heat acclimatisation develops over roughly 10–14 days of repeated exposure above 27 °C for at least 30 minutes, and most of the gain happens in the first five days. What adapts: plasma volume rises, sweating starts earlier and is more dilute, and heart rate at the same workload falls.',
    saran: persen >= 80
      ? 'Maintain it with heat exposure 2–3 times a week. Without exposure, about a quarter of it decays each week.'
      : persen >= 50
        ? 'Keep up daily exposure. Easy sessions in the heat are enough — hard sessions are not needed, and hard sessions in heat add risk.'
        : 'Start with easy 30–60 minute sessions in the heat and build the duration gradually. Do not begin with hard sessions.',
  }
}

/**
 * Aklimatisasi ketinggian.
 *
 * Rangsangannya baru bermakna di atas sekitar 1500 m. Adaptasi awal (napas
 * lebih dalam, cairan tubuh menyesuaikan) berlangsung beberapa hari, sedangkan
 * pertambahan sel darah merah memerlukan sekitar 3-4 pekan. Waktu tinggal per
 * hari sangat menentukan — inilah dasar pendekatan "tinggal tinggi, berlatih
 * rendah".
 */
export function aklimatisasiKetinggian(paparan: PaparanKetinggian[], sekarang = Date.now()): StatusAklimatisasi {
  let poin = 0
  for (const p of paparan) {
    const t = Date.parse(p.tanggal)
    if (Number.isNaN(t) || t > sekarang) continue
    const umurHari = (sekarang - t) / 86_400_000
    if (umurHari > 60) continue
    if (p.meter < 1500) continue

    const kuat = Math.min(2, (p.meter - 1500) / 1200 + 0.4) * Math.min(1.2, p.jam / 12)
    poin += kuat * Math.pow(0.985, umurHari) // luruh lebih lambat daripada panas
  }
  // Pembagi 32: adaptasi sel darah merah butuh 3-4 pekan, jadi 20 hari tidak
  // boleh sudah terbaca penuh.
  const persen = Math.min(100, Math.round((poin / 32) * 100))
  return {
    persen, hariEfektif: +poin.toFixed(1),
    label: persen >= 80 ? 'Acclimatised' : persen >= 50 ? 'Partly' : persen >= 20 ? 'Early' : 'Not yet',
    penjelasan: 'The altitude stimulus only becomes meaningful above about 1500 m. Breathing and fluid adjustments take a few days, while the increase in red blood cells needs roughly 3–4 weeks of spending enough hours up there each day.',
    saran: persen >= 80
      ? 'Adapted. Remember that performance at altitude remains below sea level even once acclimatised.'
      : 'In the early days, drop the intensity and do not judge fitness by speed — at altitude the same heart rate produces a lower speed. Watch for altitude sickness: headache, nausea, poor sleep, and breathlessness beyond what is normal.',
  }
}

/** Penurunan performa daya tahan menurut ketinggian, sebagai gambaran kasar. */
export function penaltiKetinggian(meter: number): { pctVo2Turun: number; ket: string } {
  if (meter < 1000) return { pctVo2Turun: 0, ket: 'Below 1000 m the effect is negligible for most people.' }
  // Sekitar 6% penurunan VO2max tiap 1000 m di atas 1000 m.
  const pct = +(((meter - 1000) / 1000) * 6).toFixed(1)
  return {
    pctVo2Turun: pct,
    ket: `At ${meter} m, maximal aerobic capacity is about ${pct}% lower than at sea level. Adjust your pace targets, not your heart-rate targets — your heart rate will read higher at a slower pace, and that is normal.`,
  }
}
