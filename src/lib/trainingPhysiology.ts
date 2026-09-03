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

export interface Sesi {
  id: string
  nama: string
  mulai: string
  durasiDetik: number
  jarakKm?: number
  avgHr?: number
  maxHr?: number
  /** Deret detak jantung; makin rapat makin baik. */
  hr: { t: number; bpm: number }[]
  /**
   * Berat yang dirasakan (Borg CR10), hanya pada sesi yang dicatat tangan.
   * Dipakai sebagai jalan terakhir ketika tidak ada denyut sama sekali.
   */
  rpe?: number
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
export function trimpSesi(sesi: Sesi, k: Konteks): number {
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

  /**
   * Jalan terakhir: berat yang DIRASAKAN, untuk sesi yang dicatat tangan.
   *
   * MENGAPA INI HARUS ADA. Tanpa cabang ini fungsi mengembalikan 0, dan sesi
   * tanpa denyut menyumbang beban NOL ke model Banister. Akibatnya persis
   * terlihat di peramban: satu sesi lari 45 menit tersimpan dengan benar,
   * namun kartu kebugaran tetap menunjukkan 0 — pemakainya mencatat dengan
   * rajin ke dalam angka yang tidak pernah bergerak. Fitur yang datanya
   * diabaikan diam-diam oleh model lebih buruk daripada fitur yang tidak ada.
   *
   * MENGAPA MEMAKAI RUMUS YANG SAMA, BUKAN SKALA KEDUA. Cara yang lazim
   * (sRPE Foster: RPE x menit) menghasilkan satuan yang berbeda dari TRIMP,
   * dan mencampur dua satuan dalam satu deret membuat kurva kebugaran melompat
   * setiap kali sumber datanya berganti. Di sini RPE diterjemahkan lebih dahulu
   * menjadi perkiraan cadangan denyut — RPE 10 setara kerja maksimal — lalu
   * dimasukkan ke bobot() yang sama. Hasilnya berada pada skala yang sama
   * dengan sesi terukur secara konstruksi, bukan karena disetel.
   *
   * INI TETAP TAKSIRAN. upayaRelatif() menandainya lewat dariDeret=false, dan
   * layar yang menampilkannya menyebutkan bahwa bebannya ditaksir dari lama dan
   * berat yang dirasakan — bukan diukur.
   */
  if (sesi.rpe && sesi.durasiDetik > 0) {
    const hrrTaksiran = Math.min(1, Math.max(0, sesi.rpe / 10))
    const bpmTaksiran = k.hrRest + hrrTaksiran * span
    return +((sesi.durasiDetik / 60) * bobot(bpmTaksiran)).toFixed(1)
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

export interface SesiTerhitung extends Sesi {
  trimp: number
  zona: { z: 1 | 2 | 3 | 4 | 5; menit: number }[]
}

export function hitungSesi(sesi: Sesi[], k: Konteks): SesiTerhitung[] {
  return sesi.map((s) => ({ ...s, trimp: trimpSesi(s, k), zona: zonaMenit(s, k) }))
}

function zonaMenit(sesi: Sesi, k: Konteks): { z: 1 | 2 | 3 | 4 | 5; menit: number }[] {
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

export function ringkasBeban(sesi: SesiTerhitung[], sekarang = Date.now()): BebanRingkas {
  const hari = (n: number) => sekarang - n * 86_400_000
  const dalam = (n: number) => sesi.filter((s) => Date.parse(s.mulai) >= hari(n))

  const s7 = dalam(7)
  const s28 = dalam(28)
  const total7 = s7.reduce((a, s) => a + s.trimp, 0)
  const total28 = s28.reduce((a, s) => a + s.trimp, 0)
  const akut = total7 / 7
  const kronis = total28 / 28

  const menitZ = (list: SesiTerhitung[], zs: number[]) =>
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
    return { key: 'tidakAdequateData', label: 'Not enough data yet', warna: W.abu,
      penjelasan: 'No sessions with heart-rate data in the past 28 days.',
      saran: 'Switch on Include Workouts in Health Auto Export, then record a few sessions.' }
  }
  const r = b.acwrDapatDipercaya ? b.acwr : null
  if (!b.acwrDapatDipercaya && b.hariAktif7 > 0) {
    return { key: 'pemeliharaan', label: 'Building a base', warna: W.biru,
      penjelasan: `Your history covers only ${b.rentangHariData} days so far. The 7:28-day load ratio means little until there are about four weeks behind it — early on it always looks like a spike, simply because the comparison window is nearly empty, not because you are overdoing it.`,
      saran: 'Carry on, adding at most 10% volume per week. Load assessment starts to mean something after four weeks.' }
  }
  if (b.hariAktif7 === 0) {
    return { key: 'istirahat', label: 'Resting', warna: W.abu,
      penjelasan: 'No sessions in the past seven days. Fitness you have already built lasts several weeks, so a short break does not erase it.',
      saran: 'If this was deliberate, nothing needs fixing. If it was not, start again with one easy session.' }
  }
  if (r != null && r < 0.8) {
    return { key: 'menurun', label: 'Declining', warna: W.biru,
      penjelasan: `This week's load (${b.akut.toFixed(0)}/day) is well below your usual (${b.kronis.toFixed(0)}/day). Fitness starts to decay if that continues for weeks.`,
      saran: 'If this is a deliberate recovery week, leave it. If not, bring the volume back gradually.' }
  }
  if (r != null && r > 1.5) {
    return { key: 'berlebih', label: 'Load spiking', warna: W.merah,
      penjelasan: `The last seven days sit at ${r.toFixed(2)}× your usual load. A jump this size is associated with raised injury risk across several studies, although the exact threshold is still debated.`,
      saran: 'Reduce volume next week rather than adding. Connective tissue adapts far more slowly than the heart and lungs.' }
  }
  if (vo2Tren != null && vo2Tren < -0.3 && r != null && r > 1.1) {
    return { key: 'tidakProduktif', label: 'Not productive', warna: W.kuning,
      penjelasan: 'Load is rising but VO2max is falling. That pattern means the load is not being paid for — usually too little sleep, too little food, or too few easy sessions.',
      saran: 'Check sleep and intake before adding any training. Increase the share of easy sessions.' }
  }
  if (vo2Tren != null && vo2Tren > 0.3) {
    return { key: r != null && r > 1.3 ? 'puncak' : 'produktif', warna: W.hijau,
      label: r != null && r > 1.3 ? 'Peaking' : 'Productive',
      penjelasan: `Your VO2max rose by ${vo2Tren.toFixed(1)} over this period on a controlled load. This is exactly the state to aim for.`,
      saran: 'Keep it as it is. Big changes are not needed while something is working.' }
  }
  return { key: 'pemeliharaan', label: 'Maintaining', warna: W.biru,
    penjelasan: `Your load matches your usual (${(r ?? 1).toFixed(2)}×) and fitness is flat. This maintains rather than builds.`,
    saran: 'To progress, add at most 10% volume per week — or one quality session, but not both at once.' }
}

// ── 4. Training effect 0-5 ──────────────────────────────────────────────────

export interface TrainingEffect {
  aerobik: number
  anaerobik: number
  labelAerobik: string
  labelAnaerobik: string
}

const TE_LABEL = ['None', 'Minor', 'Maintaining', 'Improving', 'Highly improving', 'Overreaching']

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
export function trainingEffect(sesi: SesiTerhitung, kronisHarian: number): TrainingEffect {
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
  sesiTerakhir: SesiTerhitung | null,
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
    if (opsi.tidurJam < 6) { jam *= 1.3; dasar.push(`Slept ${opsi.tidurJam.toFixed(1)} hours — short sleep slows recovery`) }
    else if (opsi.tidurJam >= 7.5) { jam *= 0.9; dasar.push(`Sleeping ${opsi.tidurJam.toFixed(1)} hours speeds recovery up`) }
  }
  if (opsi.hrvMs != null && opsi.hrvBaseline != null && opsi.hrvBaseline > 0) {
    const dev = (opsi.hrvMs - opsi.hrvBaseline) / opsi.hrvBaseline
    if (dev < -0.15) { jam *= 1.25; dasar.push('Heart-rate variability below your own baseline') }
    else if (dev > 0.15) { jam *= 0.9; dasar.push('Heart-rate variability above your own baseline') }
  }
  if (opsi.acwr != null && opsi.acwr > 1.4) { jam *= 1.2; dasar.push('The last seven days are spiking') }

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
export function perkiraanLTHR(sesi: SesiTerhitung[], hrMax: number): Ambang {
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
      metode: 'No continuous 20-minute session with a heart-rate series yet. A rough estimate: around 88–90% of HRmax.' }
  }
  return {
    lthr: Math.round(terbaik),
    pctHrMax: hrMax > 0 ? Math.round((terbaik / hrMax) * 100) : null,
    metode: 'The highest 20-minute average you have sustained in a session. This is an estimate from everyday data rather than a dedicated threshold test, and it tends to sit slightly below a true test value.',
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
export function kondisiPerforma(sesi: SesiTerhitung[], sekarang = Date.now()): KondisiPerforma {
  const ef = (s: SesiTerhitung) => {
    if (!s.jarakKm || !s.avgHr || s.durasiDetik <= 0 || s.avgHr <= 0) return null
    const mPerMenit = (s.jarakKm * 1000) / (s.durasiDetik / 60)
    return mPerMenit / s.avgHr
  }
  const beri = (list: SesiTerhitung[]) => list.map(ef).filter((v): v is number => v != null && Number.isFinite(v))

  const urut = [...sesi].sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
  const terbaru = urut[0]
  const efTerbaru = terbaru ? ef(terbaru) : null

  // Baseline: sesi 28 hari terakhir SELAIN yang terbaru, supaya sesi itu tidak
  // dibandingkan dengan dirinya sendiri.
  const baselineList = beri(urut.slice(1).filter((s) => Date.parse(s.mulai) >= sekarang - 28 * 86_400_000))
  if (efTerbaru == null || baselineList.length < 2) {
    return { nilai: null, ef: efTerbaru, efBaseline: null,
      arti: 'At least three spaced sessions within 28 days are needed to form a baseline.' }
  }
  const median = [...baselineList].sort((a, b) => a - b)[Math.floor(baselineList.length / 2)]
  const dev = (efTerbaru - median) / median
  // Skala −10..+10, sekitar 1 poin tiap 2% penyimpangan.
  const nilai = Math.max(-10, Math.min(10, Math.round(dev * 500) / 10))

  const arti = nilai >= 3 ? 'Well above your baseline — at the same heart rate you are moving faster.'
    : nilai >= 1 ? 'Slightly above your baseline.'
      : nilai > -1 ? 'In line with your baseline.'
        : nilai > -3 ? 'Slightly below baseline — common when tired, hot, or short of sleep.'
          : 'Well below your baseline. If it persists over several sessions, consider accumulated fatigue or illness.'

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
    faktor.push({ nama: 'Last night’s sleep', nilai: `${opsi.tidurJam.toFixed(1)} h`, bobot: d > 0 ? `+${d}` : `${d}`,
      arah: d > 4 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.hrvMs != null && opsi.hrvBaseline != null && opsi.hrvBaseline > 0) {
    const dev = (opsi.hrvMs - opsi.hrvBaseline) / opsi.hrvBaseline
    const d = dev > 0.1 ? 10 : dev > -0.1 ? 3 : dev > -0.25 ? -8 : -15
    skor += d
    faktor.push({ nama: 'Heart-rate variability', nilai: `${Math.round(opsi.hrvMs)} ms (biasanya ${Math.round(opsi.hrvBaseline)})`,
      bobot: d > 0 ? `+${d}` : `${d}`, arah: d > 5 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.restingHr != null && opsi.restingBaseline != null && opsi.restingBaseline > 0) {
    const naik = opsi.restingHr - opsi.restingBaseline
    const d = naik <= -2 ? 6 : naik < 3 ? 2 : naik < 6 ? -7 : -14
    skor += d
    faktor.push({ nama: 'Resting heart rate', nilai: `${Math.round(opsi.restingHr)} bpm (biasanya ${Math.round(opsi.restingBaseline)})`,
      bobot: d > 0 ? `+${d}` : `${d}`, arah: d > 3 ? 'baik' : d >= 0 ? 'netral' : 'kurang' })
  }
  if (opsi.pemulihanSisaJam != null && opsi.pemulihanSisaJam > 0) {
    const d = opsi.pemulihanSisaJam > 24 ? -18 : opsi.pemulihanSisaJam > 12 ? -10 : -4
    skor += d
    faktor.push({ nama: 'Recovery time remaining', nilai: `${Math.round(opsi.pemulihanSisaJam)} h`, bobot: `${d}`, arah: 'kurang' })
  }
  if (opsi.acwr != null) {
    const d = opsi.acwr > 1.5 ? -12 : opsi.acwr > 1.3 ? -5 : opsi.acwr < 0.8 ? 3 : 2
    skor += d
    faktor.push({ nama: '7:28-day load ratio', nilai: opsi.acwr.toFixed(2), bobot: d > 0 ? `+${d}` : `${d}`,
      arah: d > 0 ? 'netral' : 'kurang' })
  }

  skor = Math.max(1, Math.min(100, Math.round(skor)))
  const label = skor >= 80 ? 'Ready' : skor >= 65 ? 'Fairly ready' : skor >= 45 ? 'Moderate' : skor >= 25 ? 'Low' : 'Very low'
  const warna = skor >= 80 ? '#34d399' : skor >= 65 ? '#a3e635' : skor >= 45 ? '#fbbf24' : '#f87171'
  const saran = skor >= 80 ? 'A good day for a quality session if one is scheduled.'
    : skor >= 65 ? 'The scheduled session can go ahead; reassess after the warm-up.'
      : skor >= 45 ? 'Lean toward an easy session. If it feels good after 10 minutes of warm-up, you can lift it.'
        : 'Choose an easy session or rest. Forcing a hard session in this state adds fatigue without adding fitness.'

  return { skor, label, warna, faktor, saran }
}

// ── 8. Saran sesi harian ────────────────────────────────────────────────────

export interface SaranSesi {
  judul: string
  rincian: string
  alasan: string
}

export function saranSesiHarian(k: Kesiapan, b: BebanRingkas, pemulihanSisaJam: number): SaranSesi {
  if (pemulihanSisaJam > 20 || k.skor < 35) {
    return { judul: 'Rest, or a gentle 20–30 minute walk',
      rincian: 'Keep the heart rate below 60% of HRmax. There is no need to run.',
      alasan: k.skor < 35 ? 'Readiness is low — a hard session today adds fatigue without adding fitness.' : 'Recovery from the last session is not complete.' }
  }
  if (k.skor >= 80 && (b.acwr == null || b.acwr < 1.3)) {
    if ((b.pctAerobikRendah ?? 0) < 60) {
      return { judul: 'Easy run, 40–50 minutes in zone 2',
        rincian: 'Hold the heart rate at 60–70% of HRmax. If you have to slow until it feels too slow, that is the sign you are doing it right.',
        alasan: `Your readiness is good, but only ${b.pctAerobikRendah ?? 0}% of your training time is in the easy zones. Adding hard sessions now is not what would help most.` }
    }
    return { judul: 'Quality session: 20–25 minute tempo',
      rincian: 'After a 15-minute warm-up, run at roughly threshold heart rate, then cool down for 10 minutes.',
      alasan: 'Readiness is good and load is under control — the right day for a demanding session.' }
  }
  if (k.skor >= 55) {
    return { judul: 'Easy run, 30–40 minutes',
      rincian: 'Zone 2. Reassess after 10 minutes; if it feels hard, cut it short.',
      alasan: 'Readiness is moderate — easy volume still builds the aerobic base without adding meaningful fatigue.' }
  }
  return { judul: 'Easy session 20–30 minutes, or rest',
    rincian: 'Zones 1-2 only.',
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
export function skorKetahanan(sesi: SesiTerhitung[], sekarang = Date.now()): Ketahanan {
  const s90 = sesi.filter((s) => Date.parse(s.mulai) >= sekarang - 90 * 86_400_000)
  if (s90.length < 3) {
    return { skor: null, label: 'Not enough data yet', terpanjangKm: null, terpanjangMenit: null,
      penjelasan: 'At least three sessions within 90 days are needed.' }
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

  const label = skor >= 75 ? 'Very good' : skor >= 55 ? 'Good' : skor >= 35 ? 'Moderate' : 'Developing'
  return {
    skor, label,
    terpanjangKm: terpanjangKm > 0 ? +terpanjangKm.toFixed(2) : null,
    terpanjangMenit: Math.round(terpanjangMenit),
    penjelasan: `Computed from your longest session (${Math.round(terpanjangMenit)} minutes), the number of active weeks (${mingguAktif} of 13), and total 90-day volume. Endurance builds fastest through ONE long session a week, not by adding speed.`,
  }
}

// ── 10. Yang sengaja tidak dibuat ───────────────────────────────────────────

/**
 * Ditulis di dalam kode DAN ditampilkan di layar.
 *
 * Daftar ini pernah keliru: sebelumnya ia menyatakan sembilan hal "tidak bisa
 * dibuat", when the correct value is "tidak bisa dihitung dari ekspor jam
 * tangan". Keduanya tidak sama — sebagian besar hanya memerlukan masukannya
 * sendiri, dan kini memang sudah dibuat. `adaDi` menunjuk ke tempatnya.
 */
export const UNAVAILABLE: { fitur: string; kenapa: string; syarat: string; adaDi?: string }[] = [
  {
    fitur: 'Smart fuelling — a drinking and carbohydrate plan',
    kenapa: 'This cannot be computed from a watch export, because it plans something that has NOT yet happened. It is therefore built as its own tool driven by your inputs: duration, intensity, temperature, and your own sweat rate.',
    syarat: 'Manual input — no sync required.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Race power guide',
    kenapa: 'Your export carries no route, so the gradient profile cannot be read automatically. You enter the segments yourself, and target watts per segment are computed from the cycling power equation along with an estimated time.',
    syarat: 'Segment profile entered by you, plus your FTP.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Cycling FTP in watts and watts/kg',
    kenapa: 'Your Apple Health data carries no cycling power, so FTP cannot be read automatically. What is provided is a calculator built on the test protocols — 20 minutes, 2 × 8 minutes, or a ramp — together with the seven power zones.',
    syarat: 'The result of one power test, from any power meter or trainer.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Heat and altitude acclimatisation',
    kenapa: 'Route and weather are not synced, so exposure is not detected on its own. You log the exposure yourself (temperature and duration, or altitude and time spent), and the acclimatisation status is computed along with how it decays.',
    syarat: 'Log the exposure yourself.',
    adaDi: '/alat-endurance',
  },
  {
    fitur: 'Oxygen saturation log',
    kenapa: 'CONTINUOUS monitoring is not possible — an Apple Watch measures only occasionally. What is provided is a log and a trend of readings, together with an altitude adjustment and a list of causes of falsely low readings.',
    syarat: 'Readings from any device, logged by you.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'ECG result notes',
    kenapa: 'Interpreting an ECG trace belongs to licensed medical devices and to clinicians, and is not imitated here. What is provided is a log of the LABEL a licensed device already produced, together with the symptoms that accompanied it, so the pattern can be taken to an appointment.',
    syarat: 'Record it in the watch’s own app, then copy the result across.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Jet lag adviser',
    kenapa: 'Location data is not synced, so travel is not detected on its own. You enter the time zones, and a daily light and sleep plan is drawn up for before, during, and after the flight.',
    syarat: 'Your origin and destination time zones.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Pregnancy and activity',
    kenapa: 'Not related to watch data at all. Gestational age is calculated from the first day of the last period, and the activity guidance uses the talk test — not heart-rate zones, which are misleading in pregnancy.',
    syarat: 'First day of the last menstrual period.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Wheelchair physiology',
    kenapa: 'This needs its own reference rather than an estimate from running data. Zones are computed from peak heart rate while pushing, alongside shoulder-care guidance and a warning about autonomic dysreflexia.',
    syarat: 'The peak heart rate you observe while pushing.',
    adaDi: '/pelacak-klinis',
  },
  {
    fitur: 'Body Battery and all-day stress monitoring',
    kenapa: 'Garmin builds this from continuously measured heart-rate variability, and an Apple Watch does not record it that way. The answer is not to invent a curve, but to use heart rate relative to heart-rate reserve — data that genuinely exists — and to refuse to bridge gaps longer than 30 minutes. The result is an honest curve that breaks where the data is genuinely absent, with its coverage stated.',
    syarat: 'The heart-rate trace. The denser the sampling, the more complete the curve.',
    adaDi: '/body-battery',
  },
]
