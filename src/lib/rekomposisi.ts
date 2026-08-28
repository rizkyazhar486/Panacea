import { hitungTdee, type TingkatAktivitas } from './tdee'

// ─────────────────────────────────────────────────────────────────────────────
// Program rekomposisi: kalistenik dan dumbel, dengan sasaran yang dinyatakan
// apa adanya.
//
// PERMINTAANNYA JELAS DAN SAYA KERJAKAN SEPENUHNYA: lemak tubuh 5%, massa otot
// rangka dari 25 kg ke 50 kg, lewat kalistenik dan dumbel, menitikberatkan
// tungkai, perut, inti, dada, sternokleidomastoideus, dan trapezius.
//
// TETAPI DUA DARI ANGKA ITU HARUS DIKATAKAN APA ADANYA, sebab program yang
// disusun untuk mengejar angka yang tidak dapat dicapai akan dianggap gagal
// justru ketika ia sedang berhasil:
//
//   * LEMAK 5% adalah tingkat panggung binaraga. Ia dapat dicapai sebentar,
//     dan pada tingkat itu testosteron menurun, tidur memburuk, suasana hati
//     terganggu, dan latihan justru melemah. Ia bukan keadaan yang dapat
//     dipertahankan setahun penuh, dan tidak ada penelitian yang menyebutnya
//     lebih sehat daripada 10-15%.
//   * MENGGANDAKAN MASSA OTOT RANGKA dari 25 kg ke 50 kg tidak terjadi pada
//     manusia tanpa obat. Pertambahan otot seumur hidup pada laki-laki terlatih
//     alami berkisar 15-20 kg di atas titik awalnya, terkumpul dalam
//     bertahun-tahun dan makin melambat. Angka 25 kg pada timbangan BIA juga
//     patut diragukan lebih dahulu — lihat catatan pengukuran di bawah.
//
// Yang dilakukan berkas ini: menyusun program yang benar-benar mengejar arah
// itu sejauh tubuh manusia mengizinkan, dan menuliskan di layar apa yang wajar
// diharapkan pada 6, 12, dan 24 bulan. Menyembunyikan batas itu bukan
// dukungan; ia menyiapkan kekecewaan.
// ─────────────────────────────────────────────────────────────────────────────

export interface SasaranNyata {
  judul: string
  diminta: string
  wajar: string
  kenapa: string
}

export const SASARAN: SasaranNyata[] = [
  {
    judul: 'Body fat',
    diminta: '5%',
    wajar: '10-12% year-round, and 6-8% for a few weeks if you ever want to peak',
    kenapa:
      'Five percent is stage-lean. It can be reached briefly, but at that level testosterone falls, sleep worsens, mood suffers and training quality drops — and there is no evidence it is healthier than 10-15%. Holding 10-12% keeps every visible marker you are after (abdominal definition, vascularity) while leaving your training and hormones intact.',
  },
  {
    judul: 'Skeletal muscle mass',
    diminta: '25 kg → 50 kg',
    wajar: '+8-12 kg of real muscle over 2-4 years of hard, consistent training',
    kenapa:
      'Doubling skeletal muscle mass does not happen in humans without drugs. A natural trained man adds roughly 15-20 kg above his untrained starting point across a lifetime, and the rate halves roughly every year of training. The first year is where most of it happens — which is exactly why the first year deserves your best effort, not a target that cannot be met.',
  },
  {
    judul: 'The number on the scale itself',
    diminta: 'Track SMM on a body-composition scale',
    wajar: 'Track tape measurements, strength numbers, and photos in the same light',
    kenapa:
      'Bioimpedance scales do not measure muscle. They measure how easily a current passes through you, then estimate the rest from an equation — and hydration, a meal, a workout, or time of day can move the reading by kilograms. Use the same scale at the same time for direction, but let tape, strength and photographs decide whether the programme is working.',
  },
]

export type FaseRekomp = 'bangun' | 'kikis' | 'rawat'

export interface Fase {
  id: FaseRekomp
  nama: string
  lama: string
  kalori: string
  protein: string
  latihan: string
  tanda: string[]
  /** Kapan berpindah ke fase berikutnya. */
  pindah: string
}

export const FASE_REKOMP: Fase[] = [
  {
    id: 'bangun',
    nama: 'Build',
    lama: '12-16 weeks at a time',
    kalori: 'Maintenance + 10% (roughly +250-350 kcal). No more — a bigger surplus adds fat, not muscle.',
    protein: '1.6-2.2 g per kg bodyweight',
    latihan: 'Four to five sessions a week, most sets taken to within 1-3 repetitions of failure, load or reps rising week on week.',
    tanda: [
      'Bodyweight rising 0.25-0.5% a week — faster than that is mostly fat',
      'Waist measurement roughly stable while lifts climb',
      'Strength on the main patterns rising every 1-2 weeks',
    ],
    pindah: 'Move to Cut when waist has grown more than about 3 cm from where you started, or when the surplus stops turning into strength.',
  },
  {
    id: 'kikis',
    nama: 'Cut',
    lama: '8-12 weeks at a time',
    kalori: 'Maintenance − 20% (roughly −400-500 kcal). A deeper cut costs muscle and training quality.',
    protein: '2.0-2.4 g per kg — HIGHER than in the build phase, because protein is what protects muscle while calories are low',
    latihan: 'Same sessions, same loads. Cut the volume if recovery suffers, but never the intensity — dropping the weight is what tells the body the muscle is no longer needed.',
    tanda: [
      'Bodyweight falling 0.5-0.75% a week',
      'Strength on the main lifts holding, not collapsing',
      'Waist falling faster than bodyweight',
    ],
    pindah: 'Move to Maintain after 8-12 weeks regardless of where you are, or sooner if strength drops for two weeks running.',
  },
  {
    id: 'rawat',
    nama: 'Maintain',
    lama: '4-6 weeks between phases',
    kalori: 'Maintenance. This phase is not a pause — it is what makes the next one work.',
    protein: '1.6-2.0 g per kg',
    latihan: 'Full training. Use this window to push strength while food is no longer limiting.',
    tanda: ['Weight stable within about 1 kg', 'Hunger, sleep and mood returning to normal', 'Strength climbing again'],
    pindah: 'Return to Build once appetite, sleep and training drive have settled — usually 4-6 weeks.',
  },
]

export interface Latihan {
  gerak: string
  set: string
  catatan: string
}

export interface Hari {
  nama: string
  fokus: string
  /** Otot yang benar-benar disasar hari itu. */
  sasaran: string
  latihan: Latihan[]
}

/**
 * Pekan latihan — kalistenik dan dumbel saja, dan otot yang diminta secara
 * khusus mendapat tempatnya sendiri.
 *
 * LEHER DAN TRAPEZIUS DILATIH DUA KALI SEPEKAN dengan beban yang sangat
 * ringan dan kenaikan yang sangat kecil. Ia satu-satunya bagian program ini
 * yang kekeliruannya dapat meninggalkan kerusakan menetap, dan karena itu
 * kenaikannya sengaja dibuat paling lambat.
 */
export const PEKAN: Hari[] = [
  {
    nama: 'Day 1',
    fokus: 'Lower body — the largest driver of total muscle',
    sasaran: 'Quadriceps, glutes, hamstrings, calves',
    latihan: [
      { gerak: 'Bulgarian split squat (dumbbells)', set: '4 × 8-10 per leg', catatan: 'The single best leg builder available without a barbell. Add load before adding reps past 12.' },
      { gerak: 'Dumbbell Romanian deadlift', set: '4 × 10-12', catatan: 'Push the hips back; stop when the hamstrings stop lengthening, not when the dumbbells reach the floor.' },
      { gerak: 'Goblet squat', set: '3 × 12-15', catatan: 'Hold the weight at the chest; this lets you go deeper than a back-loaded squat.' },
      { gerak: 'Nordic curl (assisted) or dumbbell leg curl', set: '3 × 5-8', catatan: 'Lower over 4 seconds. The single most protective hamstring exercise there is.' },
      { gerak: 'Single-leg calf raise', set: '4 × 12-15 per leg', catatan: 'Full range, one second at the top. Calves need range more than load.' },
    ],
  },
  {
    nama: 'Day 2',
    fokus: 'Push — chest, shoulders, triceps',
    sasaran: 'Pectoralis major, anterior deltoid, triceps, serratus',
    latihan: [
      { gerak: 'Dumbbell floor or bench press', set: '4 × 6-10', catatan: 'The heaviest chest work you have. Elbows about 45° from the body.' },
      { gerak: 'Weighted or feet-elevated push-up', set: '3 × 10-15', catatan: 'Elevating the feet shifts the work upward onto the upper chest.' },
      { gerak: 'Dumbbell incline press (feet on floor, torso propped)', set: '3 × 8-12', catatan: 'Upper chest is what makes a chest look full from the front.' },
      { gerak: 'Dip or bench dip', set: '3 × 8-12', catatan: 'Shoulders never lower than the elbows — depth is not a virtue here.' },
      { gerak: 'Dumbbell lateral raise', set: '3 × 12-20', catatan: 'Light, slow, and high repetitions. Width comes from the side delt, not the front.' },
    ],
  },
  {
    nama: 'Day 3',
    fokus: 'Pull — back, trapezius, neck',
    sasaran: 'Latissimus dorsi, rhomboids, upper and lower trapezius, sternocleidomastoid, biceps',
    latihan: [
      { gerak: 'Pull-up or inverted row', set: '4 × 6-10', catatan: 'Whichever you can do with strict form; add load once you pass 3 × 10.' },
      { gerak: 'Single-arm dumbbell row', set: '4 × 8-12 per side', catatan: 'Pull to the hip, not the armpit; resist the rotation on the way down.' },
      { gerak: 'Dumbbell shrug', set: '4 × 10-15', catatan: 'Straight up and down with a one-second pause. No rolling — rolling shears the joint without adding work.' },
      { gerak: 'Prone Y-T-W raise', set: '3 × 10 of each letter', catatan: 'The Y is lower trapezius, and it is the muscle almost everyone is missing.' },
      { gerak: 'Neck: lateral raise and flexion', set: '2 × 12-15 each direction', catatan: 'START WITH NO WEIGHT. The sternocleidomastoid is what visibly changes the neck, and it is also the one place where adding load too fast can do lasting damage. Add the smallest increment you can find, never weekly.' },
    ],
  },
  {
    nama: 'Day 4',
    fokus: 'Lower body — posterior emphasis',
    sasaran: 'Hamstrings, glutes, adductors, spinal erectors',
    latihan: [
      { gerak: 'Dumbbell hip thrust', set: '4 × 10-15', catatan: 'Chin tucked, ribs down, full lockout at the top.' },
      { gerak: 'Walking lunge (dumbbells)', set: '3 × 10-12 per leg', catatan: 'Long steps load the glutes; short steps load the quadriceps.' },
      { gerak: 'Single-leg Romanian deadlift', set: '3 × 10 per side', catatan: 'Hips square. This is balance work as much as strength work.' },
      { gerak: 'Step-up to a bench', set: '3 × 10 per leg', catatan: 'Drive through the heel of the top foot; do not push off the bottom foot.' },
      { gerak: 'Seated calf raise (dumbbell on knee)', set: '3 × 15-20', catatan: 'Bent knee shifts the work to the soleus, which the standing version misses.' },
    ],
  },
  {
    nama: 'Day 5',
    fokus: 'Abdomen and core, plus whatever is lagging',
    sasaran: 'Rectus abdominis, obliques, transversus, hip flexors',
    latihan: [
      { gerak: 'Hanging leg raise', set: '4 × 8-12', catatan: 'Curl the pelvis up; if the legs swing, you are using momentum instead of muscle.' },
      { gerak: 'Ab wheel from knees', set: '3 × 8-12', catatan: 'Ribs down, glutes squeezed. The moment the lower back arches you have gone too far.' },
      { gerak: 'Weighted side plank or suitcase carry', set: '3 × 30-45 s per side', catatan: 'Anti-lateral-flexion work is what builds the obliques without thickening the waist.' },
      { gerak: 'Dragon flag (tuck to full)', set: '3 × 5-8', catatan: 'Only the shoulders stay on the bench; the whole body moves as one plank.' },
      { gerak: 'Dead bug with dumbbell', set: '3 × 8 per side', catatan: 'The lower back must not lift off the floor. That is the exercise.' },
    ],
  },
]

export interface Ukuran {
  apa: string
  seberapaSering: string
  kenapa: string
}

export const PENGUKURAN: Ukuran[] = [
  {
    apa: 'Bodyweight, first thing in the morning after the toilet',
    seberapaSering: 'Daily, but read the 7-day average — never a single day',
    kenapa: 'Day-to-day weight is mostly water, food in transit, and salt. The weekly average is the signal; the daily number is noise that makes people abandon working plans.',
  },
  {
    apa: 'Waist at the navel, relaxed, tape not pulled tight',
    seberapaSering: 'Weekly, same day, same time',
    kenapa: 'This is the single most useful measurement in a recomposition. Weight rising with a stable waist is muscle; weight rising with a growing waist is not.',
  },
  {
    apa: 'Neck, chest, arm, thigh and calf',
    seberapaSering: 'Every 4 weeks',
    kenapa: 'These tell you WHERE the change is going. On a programme aimed at legs, chest, traps and neck, they are the direct check that the emphasis is actually landing.',
  },
  {
    apa: 'Photographs — front, side, back, same spot, same light, same time of day',
    seberapaSering: 'Every 4 weeks',
    kenapa: 'The mirror lies daily because you see it daily. Photographs a month apart do not.',
  },
  {
    apa: 'Strength on the five main movements',
    seberapaSering: 'Every session, written down',
    kenapa: 'Muscle is built by load that keeps rising. If the numbers stop moving for three weeks, nothing else in the programme matters until that is fixed.',
  },
]

export interface RingkasGizi {
  target: number
  protein: number
  proteinLo: number
  proteinHi: number
  lemak: number
  karbo: number
  fase: FaseRekomp
}

/**
 * Sasaran gizi untuk fase yang dipilih, memakai mesin TDEE yang sama dengan
 * halaman Macro Lab — bukan rumus kedua yang akan menyimpang diam-diam.
 */
export function giziFase(
  fase: FaseRekomp,
  beratKg: number,
  tinggiCm: number,
  umur: number,
  sex: string | undefined,
  aktivitas: TingkatAktivitas = 'berat',
): RingkasGizi | null {
  if (!(beratKg > 0) || !(tinggiCm > 0) || !(umur > 0)) return null
  const dasar = hitungTdee({ beratKg, tinggiCm, umur, sex, tujuan: 'rawat', aktivitas })
  const faktor = fase === 'bangun' ? 1.1 : fase === 'kikis' ? 0.8 : 1
  const target = Math.round(dasar.tdee * faktor)

  const [pLo, pHi] = fase === 'kikis' ? [2.0, 2.4] : fase === 'bangun' ? [1.6, 2.2] : [1.6, 2.0]
  const protein = Math.round(beratKg * ((pLo + pHi) / 2))
  const lemak = Math.max(Math.round(beratKg * 0.8), Math.round((target * 0.25) / 9))
  const karbo = Math.max(0, Math.round((target - protein * 4 - lemak * 9) / 4))

  return { target, protein, proteinLo: Math.round(beratKg * pLo), proteinHi: Math.round(beratKg * pHi), lemak, karbo, fase }
}
