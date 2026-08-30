// ─────────────────────────────────────────────────────────────────────────────
// Analisis cara berjalan dan bentuk lari, dari data yang sudah ada namun tidak
// pernah dibaca.
//
// Apple Watch dan iPhone diam-diam mencatat kualitas GERAK, bukan hanya jumlah
// langkah: seberapa simetris kedua tungkai, berapa lama kedua kaki menapak
// bersamaan, sepanjang apa langkahnya, seberapa cepat menaiki tangga, dan pada
// lari — waktu kontak tanah, pantulan vertikal, serta panjang langkah. Semua
// angka ini sudah ikut terkirim pada setiap ekspor namun tidak dipetakan ke
// mana pun, sehingga tidak pernah muncul di layar.
//
// Kenapa itu sayang: jumlah langkah hanya mengatakan SEBERAPA BANYAK seseorang
// bergerak. Angka-angka di sini mengatakan SEBAIK APA ia bergerak — dan
// ketimpangan langkah maupun fase tumpuan ganda yang memanjang justru
// merupakan petunjuk paling awal adanya kompensasi akibat nyeri, kelemahan
// sesisi, maupun postur yang sudah lama menyimpang.
//
// PERINGATAN YANG MELEKAT PADA SELURUH HALAMAN INI: angka-angka ini berasal
// dari perkiraan sensor pada jam tangan dan telepon di saku, bukan dari
// pemeriksaan gait laboratorium. Ia berguna untuk melihat ARAH PERUBAHAN pada
// diri sendiri dari waktu ke waktu, bukan untuk menegakkan diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

import type { Vitals } from './healthVitals'

export type Band = 'baik' | 'sedang' | 'perhatian' | 'takTersedia'

export interface Reading {
  key: string
  label: string
  /** Nilai apa adanya beserta satuannya, siap tampil. */
  tampil: string
  nilai?: number
  band: Band
  /** Rentang rujukan yang dipakai, disebut terang-terangan. */
  rujukan: string
  /** Apa arti angka ini — fisiologi, bukan sekadar label. */
  arti: string
  /** Apa yang bisa dilakukan bila angkanya kurang baik. */
  langkah?: string
}

export interface Section {
  key: string
  judul: string
  ikon: string
  pengantar: string
  readings: Reading[]
}

const BAND_ORDER: Record<Band, number> = { perhatian: 0, sedang: 1, baik: 2, takTersedia: 3 }

/** Membentuk satu pembacaan; bila nilainya tidak ada, statusnya jujur "belum ada data". */
function baca(
  key: string,
  label: string,
  nilai: number | undefined,
  satuan: string,
  klasifikasi: (n: number) => Band,
  rujukan: string,
  arti: string,
  langkah?: string,
  desimal = 1,
): Reading {
  if (nilai == null || !Number.isFinite(nilai)) {
    return { key, label, tampil: '—', band: 'takTersedia', rujukan, arti, langkah }
  }
  const tampil = `${desimal === 0 ? Math.round(nilai) : +nilai.toFixed(desimal)}${satuan ? ' ' + satuan : ''}`
  return { key, label, tampil, nilai, band: klasifikasi(nilai), rujukan, arti, langkah }
}

/**
 * Irama langkah lari, dihitung dari kecepatan dibagi panjang langkah.
 * Apple tidak melaporkannya langsung padahal kedua bahannya ada — dan justru
 * irama inilah satu-satunya unsur bentuk lari yang dapat diubah secara sadar
 * dalam hitungan menit.
 */
export function cadenceFrom(speedKmh?: number, strideM?: number): number | null {
  if (!(speedKmh! > 0) || !(strideM! > 0)) return null
  const mps = speedKmh! / 3.6
  return Math.round((mps / strideM!) * 60)
}

/** Pace lari dalam detik per kilometer, dari kecepatan km/jam. */
export function paceFromSpeed(speedKmh?: number): number | null {
  if (!(speedKmh! > 0)) return null
  return Math.round(3600 / speedKmh!)
}

export function fmtPaceSec(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function buildGaitSections(v: Vitals): Section[] {
  const kmhToMs = (k?: number) => (k! > 0 ? k! / 3.6 : undefined)

  const jalan: Section = {
    key: 'jalan',
    judul: 'Walking Quality',
    ikon: '🚶',
    pengantar:
      'Measured from the phone in your pocket across the whole day, not from a single test. That means the numbers mix slow indoor walking with real walking outside — what matters is the CHANGE from week to week, not one number on one day.',
    readings: [
      baca(
        'asimetri', 'Walking asymmetry', v.walkingAsymmetryPct, '%',
        (n) => (n < 3 ? 'baik' : n < 6 ? 'sedang' : 'perhatian'),
        'Usually under 3%; above that is considered raised',
        'The percentage of walking time in which one leg moves differently from the other. The body does this to AVOID something — pain, weakness, a stiff joint, or unequal leg length. A persistent asymmetry loads one side more heavily for years.',
        'If it stays high: check whether there is one-sided pain you have been ignoring, test glute and leg strength left and right separately, and consider an in-person assessment. Single-sided work such as split squats and single-leg bridges evens out strength faster than two-legged exercises.',
      ),
      baca(
        'doubleSupport', 'Double support phase', v.walkingDoubleSupportPct, '%',
        (n) => (n <= 26 ? 'baik' : n <= 32 ? 'sedang' : 'perhatian'),
        'Usually around 20–30% in healthy adults',
        'The part of the walking cycle in which BOTH feet touch the ground at once. The higher the number, the longer the body holds itself in its most stable position — a pattern that appears when balance is not trusted, when there is a sense of unsteadiness, or when the hip stabilisers are weak.',
        'Improved by single-leg balance work, strengthening the gluteus medius, and regular brisk walking on level ground.',
      ),
      baca(
        'kecepatanJalan', 'Walking speed', kmhToMs(v.walkingSpeedKmh), 'm/detik',
        (n) => (n >= 1.2 ? 'baik' : n >= 1.0 ? 'sedang' : 'perhatian'),
        'Real walking in healthy adults is usually 1.2–1.4 m/s',
        'Walking speed is one of the simplest and strongest markers of overall health. Bear in mind this figure averages ALL daily steps including slow indoor walking, so it will sensibly read lower than your real walking speed.',
        'To compare against reference figures, measure it yourself: walk 10 metres as fast as is comfortable and divide the distance by the time taken.',
        2,
      ),
      baca(
        'panjangLangkah', 'Step length', v.walkingStepLengthCm, 'cm',
        (n) => (n >= 68 ? 'baik' : n >= 58 ? 'sedang' : 'perhatian'),
        'Adults are usually around 70–80 cm, and it depends on height',
        'A shortening step is one of the earliest changes in movement disorders, muscle weakness, or a loss of confidence when walking. Because it depends on height, this value is most useful compared against your own earlier readings.',
        'Stretching the hip flexors and strengthening the glutes usually adds more step length than consciously trying to stride wider.',
        0,
      ),
      baca(
        'tanggaNaik', 'Stair ascent speed', v.stairSpeedUpMs, 'm/detik',
        (n) => (n >= 0.35 ? 'baik' : n >= 0.22 ? 'sedang' : 'perhatian'),
        'Higher values reflect greater leg muscle power',
        'Climbing stairs demands POWER — strength delivered quickly — and power declines earlier than ordinary strength. That is why stair speed often changes before walking speed does.',
        'Exercises that raise it: step-ups onto a bench, squats, and stair climbing as training in its own right rather than merely as a journey.',
        2,
      ),
      baca(
        'tanggaTurun', 'Stair descent speed', v.stairSpeedDownMs, 'm/detik',
        (n) => (n >= 0.4 ? 'baik' : n >= 0.25 ? 'sedang' : 'perhatian'),
        'Usually slightly faster than the ascent',
        'Descending stairs requires control while muscles lengthen, and depends more on balance and confidence than on strength.',
        undefined,
        2,
      ),
      baca(
        'enamMenit', 'Estimated 6-minute walk distance', v.sixMinWalkM, 'meter',
        (n) => (n >= 550 ? 'baik' : n >= 400 ? 'sedang' : 'perhatian'),
        'Healthy adults usually cover 400–700 metres in the real test',
        'This is an ESTIMATE the phone computes from daily walking patterns, not the result of an actual six-minute test. Useful for tracking a trend; it cannot replace a supervised test.',
        undefined,
        0,
      ),
    ],
  }

  const cadence = cadenceFrom(v.runningSpeedKmh, v.runningStrideLengthM)
  const pace = paceFromSpeed(v.runningSpeedKmh)

  const lari: Section = {
    key: 'lari',
    judul: 'Running Form',
    ikon: '🏃',
    pengantar:
      'Recorded only on days you actually run outdoors. Running form decides speed less than people assume — but it strongly decides how much impact load the joints take on every stride, and that is what relates to injury.',
    readings: [
      baca(
        'irama', 'Cadence', cadence ?? undefined, 'langkah/menit',
        (n) => (n >= 168 ? 'baik' : n >= 155 ? 'sedang' : 'perhatian'),
        'Usually 170–180 in trained runners; 180 is a rough guide, not a rule',
        'Computed from speed divided by stride length — Apple does not report it directly even though both ingredients are available. A slow cadence means long strides landing far ahead of the body, so you brake on every step and the impact travels into the knees and hips. This is the one element of running form you can consciously change within minutes.',
        'Raise it by 5% first, not straight to 180. The easiest way: run to a metronome or a track at the right tempo, once a week for 10 minutes. The stride shortens by itself and lands closer beneath the body.',
        0,
      ),
      baca(
        'kontakTanah', 'Ground contact time', v.runningGroundContactMs, 'milidetik',
        (n) => (n <= 240 ? 'baik' : n <= 290 ? 'sedang' : 'perhatian'),
        'Recreational runners are usually 250–300 ms; elite runners under 200 ms',
        'How long the foot stays on the ground each stride. Long contact means more time supporting load and less time airborne, so more energy is lost. It is closely tied to cadence — improving cadence usually shortens it by itself.',
        'Not something trained directly. It improves as cadence rises, as the calves and glutes get stronger, and with light plyometric work such as skipping.',
        0,
      ),
      baca(
        'pantulan', 'Vertical oscillation', v.runningVerticalOscCm, 'cm',
        (n) => (n <= 9 ? 'baik' : n <= 11 ? 'sedang' : 'perhatian'),
        'Usually 6–13 cm; lower is generally more economical',
        'How far the body moves up and down each stride. Energy spent rising moves you forward not at all — it is wasted, and returns as impact on landing.',
        'Improves by raising cadence and by bounding forward less. Running then feels flatter and quieter.',
      ),
      baca(
        'daya', 'Running power', v.runningPowerW, 'watt',
        (n) => (n > 0 ? 'baik' : 'takTersedia'),
        'No standard value — meaningful compared against your own body weight over time',
        'An estimate of mechanical work per unit time while running. Values cannot be compared between people or between watch brands because each computes it differently, but they are useful for tracking your own progress.',
        undefined,
        0,
      ),
      baca(
        'panjangLangkahLari', 'Running stride length', v.runningStrideLengthM, 'meter',
        (n) => (n > 0 ? 'baik' : 'takTersedia'),
        'Adjusts with speed — judge it alongside cadence, not on its own',
        'A long stride is not a goal in itself. A long stride with a slow cadence means landing far ahead of the body, and that works against you.',
        undefined,
        2,
      ),
    ],
  }

  const pemulihan: Section = {
    key: 'pemulihan',
    judul: 'Recovery & Load',
    ikon: '❤️‍🩹',
    pengantar:
      'How quickly the heart settles after a hard effort is a direct reflection of fitness and autonomic balance — and it changes before VO2max does when fatigue accumulates.',
    readings: [
      baca(
        'hrr', '1-minute heart-rate recovery', v.cardioRecoveryBpm, 'bpm',
        (n) => (n >= 25 ? 'baik' : n >= 13 ? 'sedang' : 'perhatian'),
        'A drop of more than 12 bpm in one minute is considered normal; larger is better',
        'The difference in heart rate between the end of exercise and one minute later. A fast drop indicates the parasympathetic system is working well. A drop of 12 bpm or less is associated with higher long-term health risk across many studies, and is one of the most valuable numbers a watch gives away for free.',
        'It rises with regular low-intensity aerobic training, and falls with short sleep, illness, or overreaching — so a sudden drop is worth reading as a signal to reduce load.',
        0,
      ),
      baca(
        'vo2', 'VO2max', v.vo2max, 'ml/kg/menit',
        (n) => (n >= 45 ? 'baik' : n >= 35 ? 'sedang' : 'perhatian'),
        'Depends on age and sex; higher values are associated with lower mortality risk',
        "An estimate of the body's ability to use oxygen at maximal effort, computed by the watch from the relationship between heart rate and speed while walking or running outdoors.",
        'What raises it most is a large volume of easy running combined with a small amount of high-intensity work — not running every session hard.',
      ),
      baca(
        'istirahat', 'Resting heart rate', v.restingHr, 'bpm',
        (n) => (n <= 60 ? 'baik' : n <= 75 ? 'sedang' : 'perhatian'),
        'Healthy adults are usually 50–70 bpm; trained runners are often lower',
        'Falls slowly as fitness improves. A sudden rise of a few bpm above your own norm often precedes illness or overreaching before any symptom is felt.',
      ),
      baca(
        'hrv', 'Heart-rate variability', v.hrvMs, 'ms',
        (n) => (n >= 50 ? 'baik' : n >= 30 ? 'sedang' : 'perhatian'),
        'Varies enormously between people — only meaningful against your own average',
        'The fine differences between heartbeats. Values cannot be compared between people at all; what matters is your own trend. A drop sustained over several days usually signals unpaid load, whether from training, short sleep, or mental pressure.',
      ),
    ],
  }

  const lingkungan: Section = {
    key: 'lingkungan',
    judul: 'Daily Exposure',
    ikon: '🌤️',
    pengantar:
      'Two things the phone records and almost nobody ever looks at, even though both relate to something that cannot be restored: hearing, and the body clock.',
    readings: [
      baca(
        'headphone', 'Headphone audio exposure', v.headphoneAudioDb, 'dB',
        (n) => (n <= 70 ? 'baik' : n <= 80 ? 'sedang' : 'perhatian'),
        'Sustained exposure above roughly 80 dB is considered risky over long periods',
        'Damage to the hair cells of the ear is PERMANENT and produces no symptoms until the damage is already substantial. Risk is set by loudness and duration combined, so a moderate volume for hours can be as damaging as a high volume briefly.',
        'A simple rule: 60% volume for no more than 60 minutes at a stretch. Noise cancelling actually lowers exposure, because it removes the need to turn the volume up to cover background noise.',
        0,
      ),
      baca(
        'lingkunganSuara', 'Environmental sound exposure', v.audioExposureDb, 'dB',
        (n) => (n <= 70 ? 'baik' : n <= 80 ? 'sedang' : 'perhatian'),
        'Ordinary conversation is around 60 dB; heavy traffic around 80 dB',
        'Environmental noise exposure across the day, outside headphones.',
        undefined,
        0,
      ),
      baca(
        'cahaya', 'Time in daylight', v.daylightMin, 'menit',
        (n) => (n >= 60 ? 'baik' : n >= 30 ? 'sedang' : 'perhatian'),
        'Around 60 minutes a day, especially in the morning',
        'Bright morning light is the strongest time cue for the body clock. For anyone on irregular hours or frequent night shifts, this is the cheapest tool for keeping the sleep schedule from drifting further — and indoor light is far weaker than it feels to the eye.',
        'Move part of the morning outdoors: breakfast, a walk, or the commute. Ten minutes outside is worth more than an hour in a brightly lit room.',
        0,
      ),
    ],
  }

  return [jalan, lari, pemulihan, lingkungan]
}

/** Temuan yang layak disorot lebih dahulu: yang berstatus perhatian, terparah di atas. */
export function highlights(sections: Section[]): Reading[] {
  return sections
    .flatMap((s) => s.readings)
    .filter((r) => r.band === 'perhatian')
    .sort((a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band])
}

/** Berapa banyak metrik yang benar-benar terisi — untuk memberi tahu bila data masih kosong. */
export function coverage(sections: Section[]): { terisi: number; total: number } {
  const all = sections.flatMap((s) => s.readings)
  return { terisi: all.filter((r) => r.band !== 'takTersedia').length, total: all.length }
}

export const DISCLAIMER =
  'Every number on this page is an estimate from watch and phone sensors, not a laboratory gait analysis or a graded exercise test. They are most useful for seeing change in yourself over time. One number on one day neither establishes nor rules out anything, and real symptoms still need assessing in person.'
