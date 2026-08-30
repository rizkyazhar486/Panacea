import { BANISTER, type AngkaKlinis } from './angkaKlinis'

// ─────────────────────────────────────────────────────────────────────────────
// Penjabaran angka kebugaran, kelelahan, dan kesegaran.
//
// Ditulis sebagai jawaban langsung atas pertanyaan yang sah dan selama ini
// tidak terjawab: "kebugaran saya 26 selama seminggu, atas dasar apa angka itu,
// dan mengapa tidur sepuluh jam tidak mengubahnya."
//
// Jawabannya ada tiga lapis, dan ketiganya adalah sifat MODEL, bukan sifat
// tubuh orang yang bertanya:
//
//   1. Angka itu TIDAK BERSATUAN dan TIDAK BERSKALA POPULASI. Ia adalah rerata
//      bergerak eksponensial atas beban latihan harian orang itu sendiri. "26"
//      tidak rendah dibanding siapa pun — tidak ada siapa pun di dalam
//      perhitungannya. Menyandingkannya dengan angka lain yang berskala 0-100
//      membuat orang membacanya sebagai nilai ujian, dan itu kekeliruan yang
//      diciptakan oleh tampilannya, bukan oleh pemakainya.
//
//   2. TIDUR BUKAN MASUKAN. Model Banister hanya menerima satu masukan, yaitu
//      beban latihan harian. Tidur, HRV, denyut istirahat, suasana hati, dan
//      makan tidak muncul sama sekali di dalam persamaannya. Tidur sepuluh jam
//      TIDAK MUNGKIN mengubahnya, dan itu bukan kegagalan tubuh.
//
//   3. "TIDAK PERNAH SEGAR" ADALAH KELUARAN YANG DIHARAPKAN dari latihan yang
//      teratur. Kesegaran adalah kebugaran dikurangi kelelahan. Bila beban
//      latihan kira-kira tetap, rerata 7 hari akan mendekati rerata 42 hari,
//      sehingga selisihnya bergerak di sekitar nol maupun sedikit negatif —
//      SELAMANYA. Kesegaran hanya menjadi positif bila beban SENGAJA
//      DITURUNKAN selama satu sampai dua pekan. Orang yang berlatih tekun dan
//      teratur akan selalu terbaca "tidak segar", dan itu bukan tanda ada yang
//      salah pada dirinya.
//
// Poin ketiga inilah yang tidak pernah dikatakan aplikasi kebugaran mana pun,
// karena mengatakannya berarti mengakui bahwa angka andalannya sebagian besar
// mencerminkan bentuk grafik latihan, bukan keadaan tubuh.
// ─────────────────────────────────────────────────────────────────────────────

/** Bobot hari ini pada rerata bergerak eksponensial dengan tetapan waktu τ. */
function bobotHarian(tau: number): number {
  return 1 - Math.exp(-1 / tau)
}

function persen(x: number): string {
  return `${(x * 100).toFixed(1)}%`
}

export interface BahanAudit {
  kebugaran: number
  kelelahan: number
  kesegaran: number
  /** Jumlah sesi yang benar-benar terpakai dalam perhitungan. */
  jumlahSesi: number
  /** Rentang tanggal data yang dipakai. */
  rentangHari: number
  /** Denyut maksimum yang dipakai dalam perhitungan TRIMP. */
  hrMax: number
  /** Denyut istirahat yang dipakai. */
  hrIstirahat: number
  /** Beban latihan hari ini, bila ada. */
  upayaHariIni: number
}

/**
 * Batasan yang berlaku bagi ketiga angka sekaligus.
 *
 * Ditulis satu kali dan dipakai bersama, supaya tidak ada satu angka pun yang
 * ditampilkan tanpa batasannya sementara yang lain membawanya.
 */
function batasanBersama(b: BahanAudit): string[] {
  const out = [
    'Counts only RECORDED training. Physical work, daily walking, and sessions you forgot to record do not enter at all, so the figure sits below the load your body actually carried.',
    'Load is computed from heart rate. Resistance training and strength work raise heart rate far less than they load muscle and joints, so this model always scores them too lightly.',
    `Uses a maximum heart rate of ${b.hrMax} bpm and a resting heart rate of ${b.hrIstirahat} bpm. Both shift every number if they are wrong; a maximum estimated from age can be 10–12 bpm out for an individual.`,
  ]
  if (b.rentangHari < 42) {
    out.unshift(
      `The data covers only ${b.rentangHari} days, while the fitness time constant is ${BANISTER.tauKebugaran} days. The fitness figure HAS NOT REACHED ITS STEADY VALUE and will keep rising even if your training does not change at all.`,
    )
  }
  if (b.jumlahSesi < 10) {
    out.push(`Only ${b.jumlahSesi} sessions have been read so far. Below about ten sessions, a single session still moves the figure noticeably.`)
  }
  return out
}

export function auditKebugaran(b: BahanAudit): AngkaKlinis {
  const a = bobotHarian(BANISTER.tauKebugaran)
  return {
    label: 'Fitness',
    nilai: String(Math.round(b.kebugaran)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: `Your average daily training load over roughly the last ${BANISTER.tauKebugaran} days, with more recent days weighted more heavily.`,
    skala: 'UNITLESS, and not scaled to any population. This number is comparable only with your own history — nobody else’s data enters the calculation, so "high" and "low" mean nothing except against your own earlier months.',
    rumus: `fitness today = fitness yesterday + ${persen(a)} × (load today − fitness yesterday)`,
    masukan: [
      { nama: 'Training load today', nilai: String(Math.round(b.upayaHariIni)), sumber: 'computed from the session heart-rate series' },
      { nama: 'Fitness yesterday', nilai: String(Math.round(b.kebugaran)), sumber: 'computed' },
      { nama: 'Time constant τ', nilai: `${BANISTER.tauKebugaran} days`, sumber: 'a constant of the Banister model' },
      { nama: 'Sessions used', nilai: `${b.jumlahSesi} sessions across ${b.rentangHari} days`, sumber: 'imported history' },
    ],
    ketidakpastian: {
      sdc: 'A change under roughly 3 units in a week is not worth interpreting.',
      dasar: `With a daily weight of only ${persen(a)}, an ordinary session moves this figure by less than one unit. Day-to-day movement of that size is arithmetic, not a change in the body.`,
    },
    tidakDipengaruhi: [
      'SLEEP — whatever its length or quality. Sleep is not an input to this model at all.',
      'Morning resting heart rate, HRV, and body temperature.',
      'Food, body weight, and hydration.',
      'How tired or fresh you feel that day.',
      'A day or two of rest — fitness decays very slowly.',
    ],
    yangMenggerakkan: [
      'Only recorded training load. Raising it needs an increase sustained over weeks, not one hard session.',
      `Because τ = ${BANISTER.tauKebugaran} days, about two thirds of the effect of a load change only appears after ${BANISTER.tauKebugaran} days, and almost all of it after three times τ.`,
      'Stopping training entirely halves it in about 29 days.',
    ],
    batasan: batasanBersama(b),
  }
}

export function auditKelelahan(b: BahanAudit): AngkaKlinis {
  const a = bobotHarian(BANISTER.tauKelelahan)
  return {
    label: 'Fatigue',
    nilai: String(Math.round(b.kelelahan)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: `Your average daily training load over roughly the last ${BANISTER.tauKelelahan} days. It rises fast after hard training and falls fast during rest.`,
    skala: 'UNITLESS, and expressed on exactly the same scale as fitness — which is why the two can be subtracted.',
    rumus: `fatigue today = fatigue yesterday + ${persen(a)} × (load today − fatigue yesterday)`,
    masukan: [
      { nama: 'Training load today', nilai: String(Math.round(b.upayaHariIni)), sumber: 'computed from the session heart-rate series' },
      { nama: 'Fatigue yesterday', nilai: String(Math.round(b.kelelahan)), sumber: 'computed' },
      { nama: 'Time constant τ', nilai: `${BANISTER.tauKelelahan} days`, sumber: 'a constant of the Banister model' },
    ],
    ketidakpastian: {
      sdc: 'A change under roughly 5 units in a day is not worth interpreting.',
      dasar: `Its daily weight is ${persen(a)}, far larger than fitness, so this figure genuinely swings widely from day to day even on regular training.`,
    },
    tidakDipengaruhi: [
      'SLEEP, HRV, and resting heart rate — not one of them is an input.',
      'Soreness and muscle pain.',
      'Mental load, work, and life pressure.',
      'Illness, fever, or anaemia.',
    ],
    yangMenggerakkan: [
      'Training load over the last few days. One hard session raises it immediately.',
      `Because τ = ${BANISTER.tauKelelahan} days, about half of it is gone after 5 days without training.`,
    ],
    batasan: [
      ...batasanBersama(b),
      'What is measured is TRAINING fatigue only. Tiredness from short sleep, illness, or mental load will never appear here, even though your body feels it the same way.',
    ],
  }
}

export function auditKesegaran(b: BahanAudit): AngkaKlinis {
  const beda = b.kebugaran - b.kelelahan
  return {
    label: 'Freshness',
    nilai: String(Math.round(b.kesegaran)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: 'The difference between the 42-day average load and the 7-day average load. Positive means recent load is lighter than your norm; negative means heavier.',
    skala: 'UNITLESS. It hovers around zero by its own construction, not because of the state of your body.',
    rumus: `freshness = fitness − fatigue = ${Math.round(b.kebugaran)} − ${Math.round(b.kelelahan)} = ${Math.round(beda)}`,
    masukan: [
      { nama: 'Fitness (42-day average)', nilai: String(Math.round(b.kebugaran)), sumber: 'computed' },
      { nama: 'Fatigue (7-day average)', nilai: String(Math.round(b.kelelahan)), sumber: 'computed' },
    ],
    ketidakpastian: {
      sdc: 'A change under roughly 5 units is not worth interpreting, because the error of both components carries through.',
      dasar: 'The difference between two uncertain numbers is always more uncertain than either of them.',
    },
    tidakDipengaruhi: [
      'SLEEP — including a ten-hour night. Not an input to this model.',
      'HRV, morning resting heart rate, and how you feel that day.',
      'Food, caffeine, and hydration.',
    ],
    yangMenggerakkan: [
      'ONLY the difference between this week’s load and your norm over the last two months.',
      'Turning positive requires a deliberate drop in load over 7–14 days. This is what athletes do before competing, and it is called a taper.',
      'It turns negative every time load is increased — and that is exactly what should happen while building.',
    ],
    batasan: [
      ...batasanBersama(b),
      'A VALUE THAT SITS AROUND ZERO OR NEGATIVE IS THE EXPECTED OUTPUT, not a sign something is wrong. If training load is roughly constant, the 7-day average approaches the 42-day average, so the difference never turns positive. Training diligently and regularly will always read as "not fresh" for as long as load is not reduced.',
      'This number does NOT MEASURE readiness. It measures the shape of your training graph. For actual readiness, morning resting heart rate, HRV, sleep quality and how the body feels matter far more — and not one of them enters here.',
    ],
  }
}

/**
 * Ringkasan satu paragraf untuk dibaca lebih dahulu, sebelum ketiga angkanya.
 *
 * Ditulis khusus untuk keadaan yang paling sering menimbulkan kebingungan:
 * kesegaran yang tidak pernah positif meskipun tidur cukup.
 */
export function bacaanJujur(b: BahanAudit): string | null {
  if (b.rentangHari < 42) {
    return `Your data covers only ${b.rentangHari} days, while fitness is computed with a time constant of ${BANISTER.tauKebugaran} days. The figure will keep rising on its own even if your training does not change — so it is not yet worth reading as a settled state.`
  }
  if (b.kesegaran <= 0 && b.kelelahan >= b.kebugaran * 0.9) {
    return `Your freshness sits around zero or negative because this week’s load is roughly the same as your norm over the last two months — that is the expected output of regular training, not a sign anything is wrong. This number only turns positive if load is deliberately reduced for 7–14 days. It is also worth stating plainly that sleep does not enter this calculation at all; if you feel tired despite sleeping enough, the cause has to be looked for in resting heart rate, HRV, nutrition or blood tests — not in this number.`
  }
  return null
}
