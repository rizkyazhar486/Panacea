// ─────────────────────────────────────────────────────────────────────────────
// Mesin fisiologi latihan: beban, status, pemulihan, kesiapan.
//
// Ini padanan dari kelompok metrik Garmin (training load, training status,
// recovery time, training effect, performance condition, training readiness),
// dihitung dari data yang BENAR-BENAR ada di Apple Health.
//
// Yang perlu dinyatakan lebih dulu, karena inilah pembeda antara alat yang
// jujur dan alat yang mengarang:
//
//   Garmin menghitung beban dari EPOC yang diperkirakan Firstbeat lewat model
//   berpemilik yang memakai detak jantung DETIK PER DETIK beserta variabilitas
//   antarketukan. Apple Watch tidak mengeluarkan data sedetail itu. Karena itu
//   modul ini TIDAK mengaku menghitung EPOC. Yang dipakai adalah TRIMP
//   (Banister), yaitu ukuran beban latihan berbasis detak jantung yang sudah
//   lama dipakai di lapangan dan di penelitian, dan yang berkorelasi baik
//   dengan beban fisiologis. Angkanya TIDAK sebanding dengan angka Garmin —
//   yang bisa dibandingkan adalah kecenderungannya pada diri sendiri.
//
// Setiap besaran di sini menyebutkan dasarnya, dan yang tidak bisa dihitung
// dari data yang ada TIDAK dibuat-buat. Daftar yang sengaja tidak dibuat ada
// di UNAVAILABLE di bagian bawah berkas ini.
// ─────────────────────────────────────────────────────────────────────────────

export interface Sessions {
  id: string
  nama: string
  mulai: string
  durasiDetik: number
  jarakKm?: number
  avgHr?: number
  maxHr?: number
  /** Deret detak jantung; makin rapat makin baik. */
  hr: { t: number; bpm: number }[]
}

export interface Konteks {
  hrMax: number
  hrRest: number
  sex: 'M' | 'F'
  beratKg?: number
  vo2max?: number
}

// ── 1. Beban satu sesi (TRIMP) ──────────────────────────────────────────────

/**
 * TRIMP Banister berbobot eksponensial.
 *
 *   TRIMP = Σ Δmenit × HRr × 0.64 × e^(k × HRr)
 *   HRr   = (HR − HRistirahat) / (HRmaks − HRistirahat)
 *   k     = 1.92 pria, 1.67 wanita
 *
 * Pembobotan eksponensial itulah intinya: satu menit pada intensitas tinggi
 * membebani jauh lebih besar daripada satu menit ringan, sehingga 30 menit
 * interval tidak disamakan dengan 30 menit jalan santai — kesalahan yang
 * dilakukan oleh perhitungan berbasis durasi semata.
 */
export function trimpSessions(sesi: Sessions, k: Konteks): number {
  const span = k.hrMax - k.hrRest
  if (!(span > 0)) return 0

  const kk = k.sex === 'F' ? 1.67 : 1.92
  const bobot = (bpm: number) => {
    const hrr = Math.min(1, Math.max(0, (bpm - k.hrRest) / span))
    return hrr * 0.64 * Math.exp(kk * hrr)
  }

  if (sesi.hr.length >= 2) {
    let total = 0
    for (let i = 0; i < sesi.hr.length; i++) {
      const p = sesi.hr[i]
      // Tiap sampel mewakili jarak waktu ke sampel berikutnya.
      const dt = i < sesi.hr.length - 1
        ? Math.max(0, sesi.hr[i + 1].t - p.t)
        : Math.max(0, sesi.hr[i].t - (sesi.hr[i - 1]?.t ?? p.t))
      total += (dt / 60) * bobot(p.bpm)
    }
    return +total.toFixed(1)
  }

  // Tanpa deret, pakai rata-rata — hasilnya lebih kasar dan itu wajar disebut.
  if (sesi.avgHr && sesi.durasiDetik > 0) {
    return +((sesi.durasiDetik / 60) * bobot(sesi.avgHr)).toFixed(1)
  }
  return 0
}

// ── 2. Beban akut & kronis ──────────────────────────────────────────────────

export interface BebanRingkas {
  /** Rata-rata harian 7 hari terakhir (kebugaran jangka pendek / kelelahan). */
  akut: number
  /** Rata-rata harian 28 hari terakhir (kebugaran yang terbangun). */
  kronis: number
  /** Nisbah akut terhadap kronis. */
  acwr: number | null
  /** Total mentah 7 dan 28 hari. */
  total7: number
  total28: number
  /** Bagian beban dari zona 1-2 (aerobik rendah) — dasar aturan 80/20. */
  pctAerobikRendah: number | null
  pctAerobikTinggi: number | null
  pctAnaerobik: number | null
  hariAktif7: number
  /** Hari sejak sesi pertama yang tercatat — menentukan apakah ACWR bermakna. */
  rentangHariData: number
  /** ACWR baru bermakna setelah beban kronis benar-benar terbentuk. */
  acwrDapatDipercaya: boolean
}

export interface SessionsTerhitung extends Sessions {
  trimp: number
  zona: { z: 1 | 2 | 3 | 4 | 5; menit: number }[]
}

export function hitungSessions(sesi: Sessions[], k: Konteks): SessionsTerhitung[] {
  return sesi.map((s) => ({ ...s, trimp: trimpSessions(s, k), zona: zonaMenit(s, k) }))
}

function zonaMenit(sesi: Sessions, k: Konteks): { z: 1 | 2 | 3 | 4 | 5; menit: number }[] {
  const batas: [1 | 2 | 3 | 4 | 5, number, number][] = [
    [1, 0, 0.6], [2, 0.6, 0.7], [3, 0.7, 0.8], [4, 0.8, 0.9], [5, 0.9, 9],
  ]
  const out = batas.map(([z]) => ({ z, menit: 0 }))
  if (!sesi.hr.length || !(k.hrMax > 0)) return out
  for (let i = 0; i < sesi.hr.length; i++) {
    const p = sesi.hr[i]
    const dt = i < sesi.hr.length - 1
      ? Math.max(0, sesi.hr[i + 1].t - p.t)
      : Math.max(0, p.t - (sesi.hr[i - 1]?.t ?? p.t))
    const pct = p.bpm / k.hrMax
    const idx = batas.findIndex(([, lo, hi]) => pct >= lo && pct < hi)
    if (idx >= 0) out[idx].menit += dt / 60
  }
  return out.map((o) => ({ ...o, menit: +o.menit.toFixed(1) }))
}

export function ringkasBeban(sesi: SessionsTerhitung[], sekarang = Date.now()): BebanRingkas {
  const hari = (n: number) => sekarang - n * 86_400_000
  const dalam = (n: number) => sesi.filter((s) => Date.parse(s.mulai) >= hari(n))

  const s7 = dalam(7)
  const s28 = dalam(28)
  const total7 = s7.reduce((a, s) => a + s.trimp, 0)
  const total28 = s28.reduce((a, s) => a + s.trimp, 0)
  const akut = total7 / 7
  const kronis = total28 / 28

  const menitZ = (list: SessionsTerhitung[], zs: number[]) =>
    list.reduce((a, s) => a + s.zona.filter((z) => zs.includes(z.z)).reduce((b, z) => b + z.menit, 0), 0)
  const semua = menitZ(s28, [1, 2, 3, 4, 5])

  // Seseorang yang baru mulai berlari selalu menghasilkan ACWR tinggi, karena
  // pembaginya memang hampir nol — bukan karena ia berlatih berlebihan.
  // Menyatakannya sebagai "beban melonjak" pada orang seperti itu keliru dan
  // menakut-nakuti, jadi kepercayaannya ditandai terpisah.
  const tertua = sesi.length ? Math.min(...sesi.map((s) => Date.parse(s.mulai))) : sekarang
  const rentangHariData = Math.round((sekarang - tertua) / 86_400_000)

  return {
    akut: +akut.toFixed(1),
    kronis: +kronis.toFixed(1),
    acwr: kronis > 0 ? +(akut / kronis).toFixed(2) : null,
    rentangHariData,
    acwrDapatDipercaya: rentangHariData >= 28 && s28.length >= 6,
    total7: Math.round(total7),
    total28: Math.round(total28),
    pctAerobikRendah: semua > 0 ? Math.round((menitZ(s28, [1, 2]) / semua) * 100) : null,
    pctAerobikTinggi: semua > 0 ? Math.round((menitZ(s28, [3, 4]) / semua) * 100) : null,
    pctAnaerobik: semua > 0 ? Math.round((menitZ(s28, [5]) / semua) * 100) : null,
    hariAktif7: new Set(s7.map((s) => s.mulai.slice(0, 10))).size,
  }
}

// ── 3. Training status ───────────────────────────────────────────────────────

export type StatusKey = 'tidakAdequateData' | 'istirahat' | 'menurun' | 'pemeliharaan' | 'produktif' | 'puncak' | 'berlebih' | 'tidakProduktif'

export interface StatusLatihan {
  key: StatusKey
  label: string
  penjelasan: string
  saran: string
  warna: string
}

/**
 * Menggabungkan nisbah beban dengan arah VO2max.
 *
 * Dua sumbu ini perlu dibaca bersama, bukan sendiri-sendiri: beban naik dengan
 * kebugaran ikut naik itu produktif, sedangkan beban naik dengan kebugaran
 * mendatar maupun turun justru tanda beban itu tidak terbayar.
 */
export function statusLatihan(b: BebanRingkas, vo2Tren: number | null): StatusLatihan {
  const W: Record<string, string> = {
    abu: '#94a3b8', hijau: '#34d399', biru: '#60a5fa', kuning: '#fbbf24', merah: '#f87171',
  }
  if (b.total28 <= 0 || b.hariAktif7 === 0 && b.kronis === 0) {
    return { key: 'tidakAdequateData', label: 'Data belum cukup', warna: W.abu,
      penjelasan: 'Belum ada sesi dengan detak jantung dalam 28 hari terakhir.',
      saran: 'Nyalakan Include Workouts di Health Auto Export, lalu catat beberapa sesi.' }
  }
  const r = b.acwrDapatDipercaya ? b.acwr : null
  if (!b.acwrDapatDipercaya && b.hariAktif7 > 0) {
    return { key: 'pemeliharaan', label: 'Sedang membangun dasar', warna: W.biru,
      penjelasan: `History Anda baru mencakup ${b.rentangHariData} hari. Nisbah beban 7:28 hari belum bermakna sebelum ada sekitar empat pekan riwayat — pada awal berlatih, angkanya selalu tampak melonjak semata karena pembandingnya masih hampir kosong, bukan karena Anda berlebihan.`,
      saran: 'Lanjutkan dengan menambah volume paling banyak 10% per minggu. Penilaian beban akan mulai bermakna setelah empat pekan.' }
  }
  if (b.hariAktif7 === 0) {
    return { key: 'istirahat', label: 'Istirahat', warna: W.abu,
      penjelasan: 'Tidak ada sesi dalam tujuh hari terakhir. Kebugaran yang sudah terbangun bertahan beberapa minggu, jadi jeda pendek tidak menghapusnya.',
      saran: 'Bila ini disengaja, tidak ada yang perlu diperbaiki. Bila tidak, mulai lagi dengan satu sesi mudah.' }
  }
  if (r != null && r < 0.8) {
    return { key: 'menurun', label: 'Menurun', warna: W.biru,
      penjelasan: `Beban minggu ini (${b.akut.toFixed(0)}/hari) jauh di bawah kebiasaan Anda (${b.kronis.toFixed(0)}/hari). Kebugaran mulai luruh bila berlanjut berminggu-minggu.`,
      saran: 'Bila ini pekan pemulihan yang disengaja, biarkan. Bila tidak, kembalikan volume secara bertahap.' }
  }
  if (r != null && r > 1.5) {
    return { key: 'berlebih', label: 'Beban melonjak', warna: W.merah,
      penjelasan: `Beban tujuh hari terakhir ${r.toFixed(2)}× kebiasaan Anda. Lonjakan sebesar ini berkaitan dengan naiknya risiko cedera pada berbagai penelitian, meskipun ambang pastinya masih diperdebatkan.`,
      saran: 'Kurangi volume pekan depan, bukan menambah. Jaringan ikat beradaptasi jauh lebih lambat daripada jantung dan paru.' }
  }
  if (vo2Tren != null && vo2Tren < -0.3 && r != null && r > 1.1) {
    return { key: 'tidakProduktif', label: 'Tidak produktif', warna: W.kuning,
      penjelasan: 'Beban naik tetapi VO2max justru turun. Pola ini menandakan beban belum terbayar — biasanya karena kurang tidur, kurang makan, maupun terlalu sedikit sesi mudah.',
      saran: 'Periksa tidur dan asupan lebih dulu sebelum menambah latihan. Perbanyak porsi sesi mudah.' }
  }
  if (vo2Tren != null && vo2Tren > 0.3) {
    return { key: r != null && r > 1.3 ? 'puncak' : 'produktif', warna: W.hijau,
      label: r != null && r > 1.3 ? 'Puncak' : 'Produktif',
      penjelasan: `VO2max Anda naik ${vo2Tren.toFixed(1)} dalam periode ini dengan beban yang terkendali. Inilah keadaan yang dituju.`,
      saran: 'Pertahankan. Perubahan besar tidak diperlukan saat sesuatu sedang bekerja.' }
  }
  return { key: 'pemeliharaan', label: 'Pemeliharaan', warna: W.biru,
    penjelasan: `Beban Anda setara dengan kebiasaan (${(r ?? 1).toFixed(2)}×) dan kebugaran mendatar. Ini mempertahankan, bukan menambah.`,
    saran: 'Untuk kemajuan, tambahkan volume maksimal 10% per minggu — atau satu sesi kualitas, bukan keduanya sekaligus.' }
}

// ── 4. Training effect 0-5 ──────────────────────────────────────────────────

export interface TrainingEffect {
  aerobik: number
  anaerobik: number
  labelAerobik: string
  labelAnaerobik: string
}

const TE_LABEL = ['Tidak ada', 'Ringan', 'Mempertahankan', 'Meningkatkan', 'Sangat meningkatkan', 'Berlebih']

export function labelTE(v: number): string {
  return TE_LABEL[Math.min(5, Math.max(0, Math.round(v)))]
}

/**
 * Skala 0-5 seperti Garmin, tetapi dihitung dari beban sesi RELATIF terhadap
 * kebugaran yang sudah dibangun — bukan dari EPOC.
 *
 * Relatif itu pentingnya: satu sesi 60 TRIMP berat bagi pemula dan ringan bagi
 * pelari terlatih. Memakai ambang tetap akan menyatakan hal yang sama untuk
 * dua orang yang keadaannya berbeda jauh.
 */
export function trainingEffect(sesi: SessionsTerhitung, kronisHarian: number): TrainingEffect {
  const acuan = Math.max(kronisHarian, 8) // lantai supaya pengguna baru tidak selalu "berlebih"
  const rasio = sesi.trimp / acuan

  const menitZ = (zs: number[]) => sesi.zona.filter((z) => zs.includes(z.z)).reduce((a, z) => a + z.menit, 0)
  const totalMenit = menitZ([1, 2, 3, 4, 5]) || 1
  const bagianAerobik = menitZ([2, 3, 4]) / totalMenit
  const bagianAnaerobik = menitZ([5]) / totalMenit

  // Skala logaritmik: kenaikan beban memberi hasil yang makin mengecil.
  const skala = (r: number) => Math.min(5, Math.max(0, 2.2 * Math.log10(1 + 9 * r)))

  const aerobik = +Math.min(5, skala(rasio) * (0.45 + 0.55 * bagianAerobik)).toFixed(1)
  // Anaerobik hanya bermakna bila memang ada waktu di zona 5.
  const anaerobik = +Math.min(5, skala(rasio) * (bagianAnaerobik * 2.2)).toFixed(1)

  return { aerobik, anaerobik, labelAerobik: labelTE(aerobik), labelAnaerobik: labelTE(anaerobik) }
}

// ── 5. Recovery time ──────────────────────────────────────────────────────

export interface Pemulihan {
  jam: number
  selesaiPada: string
  dasar: string[]
}

/**
 * Perkiraan jam sampai tubuh siap menerima sesi berat berikutnya.
 *
 * Bukan larangan bergerak — jalan kaki dan sesi mudah tetap boleh dan justru
 * mempercepat pemulihan. Yang dimaksud adalah kesiapan untuk sesi KERAS.
 */
export function waktuPemulihan(
  sesiTerakhir: SessionsTerhitung | null,
  kronisHarian: number,
  opsi: { tidurJam?: number; hrvMs?: number; hrvBaseline?: number; acwr?: number | null } = {},
): Pemulihan | null {
  if (!sesiTerakhir) return null
  const acuan = Math.max(kronisHarian, 8)
  const dasar: string[] = []

  // Dasar: beban sesi relatif terhadap kebugaran.
  let jam = 6 * Math.min(4, sesiTerakhir.trimp / acuan)
  dasar.push(`Beban sesi ${sesiTerakhir.trimp.toFixed(0)} terhadap kebiasaan harian ${acuan.toFixed(0)}`)

  const anaerobMenit = sesiTerakhir.zona.filter((z) => z.z === 5).reduce((a, z) => a + z.menit, 0)
  if (anaerobMenit > 2) { jam += anaerobMenit * 0.8; dasar.push(`${anaerobMenit.toFixed(0)} menit di zona maksimal menambah tuntutan pemulihan`) }

  if (opsi.tidurJam != null) {
    if (opsi.tidurJam < 6) { jam *= 1.3; dasar.push(`Tidur ${opsi.tidurJam.toFixed(1)} jam — kurang tidur memperlambat pemulihan`) }
    else if (opsi.tidurJam >= 7.5) { jam *= 0.9; dasar.push(`Tidur ${opsi.tidurJam.toFixed(1)} jam mempercepat pemulihan`) }
  }
  if (opsi.hrvMs != null && opsi.hrvBaseline != null && opsi.hrvBaseline > 0) {
    const dev = (opsi.hrvMs - opsi.hrvBaseline) / opsi.hrvBaseline
    if (dev < -0.15) { jam *= 1.25; dasar.push('Variabilitas denyut di bawah kebiasaan Anda') }
    else if (dev > 0.15) { jam *= 0.9; dasar.push('Variabilitas denyut di atas kebiasaan Anda') }
  }
  if (opsi.acwr != null && opsi.acwr > 1.4) { jam *= 1.2; dasar.push('Beban tujuh hari terakhir sedang melonjak') }

  jam = Math.min(96, Math.max(3, Math.round(jam)))
  const selesai = new Date(Date.parse(sesiTerakhir.mulai) + sesiTerakhir.durasiDetik * 1000 + jam * 3600_000)
  return { jam, selesaiPada: selesai.toISOString(), dasar }
}

// ── 6. Ambang: LTHR dan efisiensi ───────────────────────────────────────────

export interface Ambang {
  lthr: number | null
  metode: string
  /** Persen dari HRmax. */
  pctHrMax: number | null
}

/**
 * Perkiraan denyut ambang laktat dari rata-rata 20 menit tertinggi yang pernah
 * dipertahankan — mengikuti gagasan uji lapangan Friel, dengan catatan bahwa
 * ini perkiraan dari data harian, bukan tes khusus.
 */
export function perkiraanLTHR(sesi: SessionsTerhitung[], hrMax: number): Ambang {
  let terbaik = 0
  for (const s of sesi) {
    if (s.hr.length < 3) continue
    const jendela = 20 * 60
    for (let i = 0; i < s.hr.length; i++) {
      const akhirT = s.hr[i].t + jendela
      const seg = s.hr.filter((p) => p.t >= s.hr[i].t && p.t <= akhirT)
      if (seg.length < 3) continue
      if (seg[seg.length - 1].t - seg[0].t < jendela * 0.8) continue
      const avg = seg.reduce((a, p) => a + p.bpm, 0) / seg.length
      if (avg > terbaik) terbaik = avg
    }
  }
  if (terbaik <= 0) {
    return { lthr: null, pctHrMax: null,
      metode: 'Belum ada sesi berkelanjutan 20 menit dengan deret detak jantung. Perkiraan kasar: sekitar 88-90% HRmaks.' }
  }
  return {
    lthr: Math.round(terbaik),
    pctHrMax: hrMax > 0 ? Math.round((terbaik / hrMax) * 100) : null,
    metode: 'Rata-rata 20 menit tertinggi yang pernah dipertahankan pada sesi Anda. Ini perkiraan dari data harian, bukan hasil tes ambang khusus, dan cenderung sedikit lebih rendah daripada nilai tes sebenarnya.',
  }
}

export interface KondisiPerforma {
  nilai: number | null
  ef: number | null
  efBaseline: number | null
  arti: string
}

/**
 * Kondisi performa: penyimpangan efisiensi terhadap kebiasaan sendiri.
 *
 * EF = kecepatan (m/menit) ÷ detak jantung rata-rata. Bila pada denyut yang
 * sama Anda berlari lebih cepat, efisiensi naik. Inilah salah satu tanda
 * kebugaran yang paling awal terlihat — jauh lebih cepat berubah daripada
 * VO2max.
 */
export function kondisiPerforma(sesi: SessionsTerhitung[], sekarang = Date.now()): KondisiPerforma {
  const ef = (s: SessionsTerhitung) => {
    if (!s.jarakKm || !s.avgHr || s.durasiDetik <= 0 || s.avgHr <= 0) return null
    const mPerMenit = (s.jarakKm * 1000) / (s.durasiDetik / 60)
    return mPerMenit / s.avgHr
  }
  const beri = (list: SessionsTerhitung[]) => list.map(ef).filter((v): v is number => v != null && Number.isFinite(v))

  const urut = [...sesi].sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
  const terbaru = urut[0]
  const efTerbaru = terbaru ? ef(terbaru) : null

  // Baseline: sesi 28 hari terakhir SELAIN yang terbaru, supaya sesi itu tidak
  // dibandingkan dengan dirinya sendiri.
  const baselineList = beri(urut.slice(1).filter((s) => Date.parse(s.mulai) >= sekarang - 28 * 86_400_000))
  if (efTerbaru == null || baselineList.length < 2) {
    return { nilai: null, ef: efTerbaru, efBaseline: null,
      arti: 'Perlu setidaknya tiga sesi berjarak dalam 28 hari untuk membentuk pembanding.' }
  }
  const median = [...baselineList].sort((a, b) => a - b)[Math.floor(baselineList.length / 2)]
  const dev = (efTerbaru - median) / median
  // Skala −10..+10, sekitar 1 poin tiap 2% penyimpangan.
  const nilai = Math.max(-10, Math.min(10, Math.round(dev * 500) / 10))

  const arti = nilai >= 3 ? 'Jauh di atas kebiasaan Anda — pada denyut yang sama Anda bergerak lebih cepat.'
    : nilai >= 1 ? 'Sedikit di atas kebiasaan Anda.'
      : nilai > -1 ? 'Setara dengan kebiasaan Anda.'
        : nilai > -3 ? 'Sedikit di bawah kebiasaan — lazim terjadi saat lelah, panas, maupun kurang tidur.'
          : 'Jauh di bawah kebiasaan Anda. Bila menetap beberapa sesi, pertimbangkan kelelahan menumpuk maupun sakit.'

  return { nilai, ef: +efTerbaru.toFixed(2), efBaseline: +median.toFixed(2), arti }
}

// ── 7. Kesiapan latihan ─────────────────────────────────────────────────────

export interface Kesiapan {
  skor: number
  label: string
  warna: string
  faktor: { nama: string; nilai: string; arah: 'baik' | 'netral' | 'kurang'; bobot: string }[]
  saran: string
}

/**
 * Skor 0-100 dari faktor yang datanya benar-benar ada.
 *
 * Sengaja menampilkan tiap faktor beserta arahnya, bukan hanya satu angka:
 * skor tunggal tanpa rinciannya tidak bisa ditindaklanjuti, dan itu keluhan
 * paling umum terhadap metrik semacam ini.
 */
export function kesiapan(opsi: {
  tidurJam?: number
  tidurDeepJam?: number
  hrvMs?: number
  hrvBaseline?: number
  restingHr?: number
  restingBaseline?: number
  pemulihanSisaJam?: number
  acwr?: number | null
}): Kesiapan {
  let skor = 70
  const faktor: Kesiapan['faktor'] = []

  if (opsi.tidurJam != null) {
    const d = opsi.tidurJam >= 7.5 ? 12 : opsi.tidurJam >= 6.5 ? 4 : opsi.tidurJam >= 5.5 ? -8 : -18
    skor += d
    faktor.push({ nama: 'Tidur semalam', nilai: `${opsi.tidurJam.toFixed(1)} jam`, bobot: d > 0 ? `+${d}` : `${d}`,
      arah: d > 4 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.hrvMs != null && opsi.hrvBaseline != null && opsi.hrvBaseline > 0) {
    const dev = (opsi.hrvMs - opsi.hrvBaseline) / opsi.hrvBaseline
    const d = dev > 0.1 ? 10 : dev > -0.1 ? 3 : dev > -0.25 ? -8 : -15
    skor += d
    faktor.push({ nama: 'Variabilitas denyut', nilai: `${Math.round(opsi.hrvMs)} ms (biasanya ${Math.round(opsi.hrvBaseline)})`,
      bobot: d > 0 ? `+${d}` : `${d}`, arah: d > 5 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.restingHr != null && opsi.restingBaseline != null && opsi.restingBaseline > 0) {
    const naik = opsi.restingHr - opsi.restingBaseline
    const d = naik <= -2 ? 6 : naik < 3 ? 2 : naik < 6 ? -7 : -14
    skor += d
    faktor.push({ nama: 'Denyut istirahat', nilai: `${Math.round(opsi.restingHr)} bpm (biasanya ${Math.round(opsi.restingBaseline)})`,
      bobot: d > 0 ? `+${d}` : `${d}`, arah: d > 3 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.pemulihanSisaJam != null && opsi.pemulihanSisaJam > 0) {
    const d = opsi.pemulihanSisaJam > 24 ? -18 : opsi.pemulihanSisaJam > 12 ? -10 : -4
    skor += d
    faktor.push({ nama: 'Sisa waktu pemulihan', nilai: `${Math.round(opsi.pemulihanSisaJam)} jam`, bobot: `${d}`, arah: 'kurang' })
  }
  if (opsi.acwr != null) {
    const d = opsi.acwr > 1.5 ? -12 : opsi.acwr > 1.3 ? -5 : opsi.acwr < 0.8 ? 3 : 2
    skor += d
    faktor.push({ nama: 'Nisbah beban 7:28 hari', nilai: opsi.acwr.toFixed(2), bobot: d > 0 ? `+${d}` : `${d}`,
      arah: d > 0 ? 'netral' : 'kurang' })
  }

  skor = Math.max(1, Math.min(100, Math.round(skor)))
  const label = skor >= 80 ? 'Siap' : skor >= 65 ? 'Adequate siap' : skor >= 45 ? 'Sedang' : skor >= 25 ? 'Rendah' : 'Sangat rendah'
  const warna = skor >= 80 ? '#34d399' : skor >= 65 ? '#a3e635' : skor >= 45 ? '#fbbf24' : '#f87171'
  const saran = skor >= 80 ? 'Hari yang baik untuk sesi kualitas bila memang terjadwal.'
    : skor >= 65 ? 'The scheduled session can go ahead; reassess after the warm-up.'
      : skor >= 45 ? 'Condongkan ke sesi mudah. Bila terasa baik setelah 10 menit pemanasan, boleh dinaikkan.'
        : 'Pilih sesi mudah maupun istirahat. Memaksakan sesi keras pada keadaan ini menambah kelelahan tanpa menambah kebugaran.'

  return { skor, label, warna, faktor, saran }
}

// ── 8. Saran sesi harian ────────────────────────────────────────────────────

export interface SaranSessions {
  judul: string
  rincian: string
  alasan: string
}

export function saranSessionsHarian(k: Kesiapan, b: BebanRingkas, pemulihanSisaJam: number): SaranSessions {
  if (pemulihanSisaJam > 20 || k.skor < 35) {
    return { judul: 'Istirahat atau jalan santai 20-30 menit',
      rincian: 'Jaga denyut di bawah 60% HRmaks. Tidak perlu berlari.',
      alasan: k.skor < 35 ? 'Kesiapan rendah — sesi keras hari ini menambah kelelahan tanpa menambah kebugaran.' : 'Pemulihan dari sesi terakhir belum selesai.' }
  }
  if (k.skor >= 80 && (b.acwr == null || b.acwr < 1.3)) {
    if ((b.pctAerobikRendah ?? 0) < 60) {
      return { judul: 'Easy run 40-50 menit di zona 2',
        rincian: 'Pertahankan denyut 60-70% HRmaks. Bila harus melambat sampai terasa terlalu pelan, itu justru tandanya benar.',
        alasan: `Kesiapan Anda baik, namun hanya ${b.pctAerobikRendah ?? 0}% waktu latihan Anda berada di zona mudah. Menambah sesi keras sekarang bukan yang paling menolong.` }
    }
    return { judul: 'Quality session: 20–25 minute tempo',
      rincian: 'Setelah 15 menit pemanasan, jalankan pada denyut sekitar ambang, lalu pendinginan 10 menit.',
      alasan: 'Kesiapan baik dan beban terkendali — hari yang tepat untuk sesi yang menuntut.' }
  }
  if (k.skor >= 55) {
    return { judul: 'Easy run 30-40 menit',
      rincian: 'Zona 2. Nilai ulang setelah 10 menit; bila terasa berat, perpendek.',
      alasan: 'Kesiapan sedang — volume mudah tetap menambah basis aerobik tanpa menambah kelelahan berarti.' }
  }
  return { judul: 'Easy session 20–30 minutes, or rest',
    rincian: 'Zona 1-2 saja.',
    alasan: 'Readiness is below your normal. An easy session still aids recovery; a hard one does not.' }
}

// ── 9. Skor ketahanan ───────────────────────────────────────────────────────

export interface Ketahanan {
  skor: number | null
  label: string
  penjelasan: string
  terpanjangKm: number | null
  terpanjangMenit: number | null
}

/**
 * Ketahanan dinilai dari sesi terpanjang dan konsistensi volume, bukan dari
 * kecepatan — dua hal yang sering tertukar. Orang bisa cepat pada 5 km dan
 * tetap tidak punya ketahanan.
 */
export function skorKetahanan(sesi: SessionsTerhitung[], sekarang = Date.now()): Ketahanan {
  const s90 = sesi.filter((s) => Date.parse(s.mulai) >= sekarang - 90 * 86_400_000)
  if (s90.length < 3) {
    return { skor: null, label: 'Belum cukup data', terpanjangKm: null, terpanjangMenit: null,
      penjelasan: 'Perlu setidaknya tiga sesi dalam 90 hari.' }
  }
  const terpanjangMenit = Math.max(...s90.map((s) => s.durasiDetik / 60))
  const terpanjangKm = Math.max(...s90.map((s) => s.jarakKm ?? 0))
  const mingguAktif = new Set(s90.map((s) => {
    const d = new Date(s.mulai); const onejan = new Date(d.getFullYear(), 0, 1)
    return `${d.getFullYear()}-${Math.ceil(((+d - +onejan) / 86_400_000 + onejan.getDay() + 1) / 7)}`
  })).size

  // Tiga sumbu: sesi terpanjang, konsistensi, dan volume total.
  const aDurasi = Math.min(40, (terpanjangMenit / 120) * 40)
  const aKonsisten = Math.min(35, (mingguAktif / 13) * 35)
  const aVolume = Math.min(25, (s90.reduce((a, s) => a + s.durasiDetik, 0) / 3600 / 60) * 25)
  const skor = Math.round(aDurasi + aKonsisten + aVolume)

  const label = skor >= 75 ? 'Sangat baik' : skor >= 55 ? 'Baik' : skor >= 35 ? 'Sedang' : 'Berkembang'
  return {
    skor, label,
    terpanjangKm: terpanjangKm > 0 ? +terpanjangKm.toFixed(2) : null,
    terpanjangMenit: Math.round(terpanjangMenit),
    penjelasan: `Dihitung dari sesi terpanjang (${Math.round(terpanjangMenit)} menit), jumlah minggu aktif (${mingguAktif} dari 13), dan total volume 90 hari. Ketahanan bertambah paling cepat lewat SATU sesi panjang tiap minggu, bukan lewat menambah kecepatan.`,
  }
}

// ── 10. Yang sengaja tidak dibuat ───────────────────────────────────────────

/**
 * Ditulis di dalam kode DAN ditampilkan di layar.
 *
 * Daftar ini pernah keliru: sebelumnya ia menyatakan sembilan hal "tidak bisa
 * dibuat", padahal yang benar adalah "tidak bisa dihitung dari ekspor jam
 * tangan". Keduanya tidak sama — sebagian besar hanya memerlukan masukannya
 * sendiri, dan kini memang sudah dibuat. `adaDi` menunjuk ke tempatnya.
 */
export const UNAVAILABLE: { fitur: string; kenapa: string; syarat: string; adaDi?: string }[] = [
  {
    fitur: 'Smart fueling / rencana minum & karbohidrat',
    kenapa: 'Tidak bisa dihitung dari ekspor jam tangan, karena ia merencanakan sesuatu yang BELUM terjadi. Karena itu dibuat sebagai alat tersendiri dengan masukan Anda: durasi, intensitas, suhu, dan laju keringat Anda sendiri.',
    syarat: 'Masukan manual — tidak perlu sinkronisasi.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Power Guide untuk lomba',
    kenapa: 'Ekspor Anda tidak memuat rute, jadi profil tanjakan tidak bisa dibaca otomatis. Segmen dimasukkan sendiri, lalu target watt per segmen dihitung dari persamaan tenaga bersepeda beserta perkiraan waktunya.',
    syarat: 'Profil segmen dimasukkan sendiri, dan FTP.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'FTP sepeda dalam watt dan watt/kg',
    kenapa: 'Apple Health Anda tidak memuat daya bersepeda, sehingga FTP tidak dapat dibaca otomatis. Yang dibuat adalah penghitung dari protokol tes — 20 menit, 2×8 menit, maupun ramp — beserta tujuh zona daya.',
    syarat: 'Hasil satu tes daya, dari power meter maupun trainer mana pun.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Aklimatisasi panas dan ketinggian',
    kenapa: 'Rute dan cuaca tidak ikut disinkronkan, jadi paparan tidak terdeteksi sendiri. Paparan dicatat sendiri (suhu dan lama, maupun ketinggian dan lama tinggal), lalu status aklimatisasi dihitung beserta peluruhannya.',
    syarat: 'Catat paparan sendiri.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Catatan saturasi oksigen',
    kenapa: 'Pemantauan BERKELANJUTAN tidak mungkin — Apple Watch hanya mengukur sesekali. Yang dibuat adalah catatan dan kecenderungan bacaan, lengkap dengan penyesuaian untuk ketinggian dan daftar sebab bacaan rendah yang keliru.',
    syarat: 'Bacaan dari alat mana pun, dicatat sendiri.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Catatan hasil EKG',
    kenapa: 'Penafsiran gelombang EKG merupakan wilayah alat kesehatan berizin dan tenaga medis, dan tidak ditiru di sini. Yang dibuat adalah catatan LABEL yang sudah dikeluarkan alat berizin beserta gejala yang menyertainya, sehingga polanya dapat dibawa saat berobat.',
    syarat: 'Rekam di aplikasi bawaan jam tangan, lalu salin hasilnya.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Penasihat jet lag',
    kenapa: 'Data lokasi tidak ikut disinkronkan, jadi perjalanan tidak terdeteksi sendiri. Zona waktu dimasukkan sendiri, lalu disusun rencana cahaya dan tidur harian sebelum, saat, dan sesudah terbang.',
    syarat: 'Zona waktu asal dan tujuan.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Kehamilan dan aktivitas',
    kenapa: 'Tidak berkaitan dengan data jam tangan sama sekali. Usia kehamilan dihitung dari hari pertama haid terakhir, dan panduan aktivitasnya memakai uji bicara — bukan zona denyut jantung, yang menyesatkan dalam kehamilan.',
    syarat: 'Hari pertama haid terakhir.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Fisiologi kursi roda',
    kenapa: 'Memerlukan rujukan tersendiri, bukan perkiraan dari data lari. Zona dihitung dari denyut puncak saat mendorong, disertai panduan menjaga bahu dan peringatan disrefleksia otonom.',
    syarat: 'Denyut puncak yang diamati saat mendorong.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Body Battery dan pemantauan stres sepanjang hari',
    kenapa: 'Garmin membangunnya dari variabilitas denyut yang diukur terus-menerus, dan Apple Watch tidak merekamnya seperti itu. Jalan keluarnya bukan mengarang kurva, melainkan memakai posisi denyut terhadap cadangan denyut — data yang memang ada — dan menolak menjembatani celah lebih dari 30 menit. Hasilnya kurva yang jujur terputus saat data memang tidak ada, lengkap dengan angka cakupannya.',
    syarat: 'Deret denyut. Makin rapat sampelnya, makin utuh kurvanya.',
    adaDi: '/body-battery',
  },
]
