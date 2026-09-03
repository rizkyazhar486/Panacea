// ─────────────────────────────────────────────────────────────────────────────
// Latihan dasar: lari, push-up, pull-up, sit-up, dan koreksi postur.
//
// Kenapa file ini ada terpisah dari TrainingPlan: TrainingPlan menyusun program
// gym mingguan. Yang tidak ada di mana pun sebelumnya adalah dua hal yang
// justru paling sering ditanyakan orang yang berlatih tanpa alat:
//
//   1. PACE LARI. Kesalahan tersering pemula adalah menjalankan SEMUA sesi
//      lari sekencang mungkin. Akibatnya aerobic base tidak pernah terbangun,
//      kelelahan menumpuk, dan risiko cedera naik — sementara VO2max justru
//      stagnan. Empat jenis lari punya empat tujuan fisiologis berbeda, dan
//      masing-masing hanya tercapai bila dijalankan pada intensitas yang tepat.
//
//   2. PROGRESI KALISTENIK. "Push-up 3×10" tidak berarti apa-apa bila orangnya
//      belum bisa satu repetisi penuh, dan tidak menantang bila sudah bisa 30.
//      Yang diperlukan adalah tangga regresi-progresi: mulai dari varian yang
//      bisa dikerjakan hari ini, naik ketika syaratnya terpenuhi.
//
// Angka pace di bawah mengikuti kerangka VDOT (Jack Daniels' Running Formula).
// Nilainya diinterpolasi linier di antara titik-titik tabel supaya pengguna
// dengan pace race di antara baris tabel tetap mendapat angka yang masuk akal.
// ─────────────────────────────────────────────────────────────────────────────

export type RunType = 'easy' | 'long' | 'tempo' | 'interval'

export interface RunZone {
  key: RunType
  name: string
  tujuan: string
  /** Fisiologi — kenapa intensitasnya harus segini, bukan lebih cepat. */
  kenapa: string
  /** Porsi dari total kilometer mingguan. */
  porsi: string
  durasi: string
  rasa: string
  /** Tanda bahwa sesi dijalankan TERLALU cepat — kesalahan tersering. */
  salahnya: string
}

export const RUN_ZONES: RunZone[] = [
  {
    key: 'easy',
    name: 'Easy Run',
    tujuan: 'Builds the aerobic base',
    kenapa:
      'Low intensity sustained for a long time stimulates capillary growth in muscle, increases the number and size of mitochondria, and enlarges the heart’s stroke volume. These adaptations only occur if the intensity is low enough to hold for a long time — go too fast and the session becomes a fatigue cost with no gain in aerobic base.',
    porsi: '70–80% of weekly kilometres',
    durasi: '30–60 minutes',
    rasa: 'You can still speak in full sentences without gasping',
    salahnya:
      'Running the easy run too fast is the most common and most costly mistake: too hard to count as recovery, too easy to trigger speed adaptation — expensive in fatigue and cheap in benefit.',
  },
  {
    key: 'long',
    name: 'Long Run',
    tujuan: 'Builds endurance',
    kenapa:
      'Long duration depletes glycogen stores so the body learns to use fat as fuel, strengthens connective tissue, and trains mental endurance. What produces the adaptation here is TIME ON FEET, not speed.',
    porsi: '20–30% of weekly kilometres, once a week',
    durasi: '60–120 minutes',
    rasa: 'Slightly easier than an easy run, and it must stay controlled to the final kilometre',
    salahnya:
      'Starting too fast and falling apart in the second half. A long run done properly feels boring for the first 30 minutes.',
  },
  {
    key: 'tempo',
    name: 'Tempo Run',
    tujuan: 'Raises the lactate threshold',
    kenapa:
      'The lactate threshold is the highest speed you can hold without lactate accumulating faster than it is cleared. Running right around that threshold trains the body to clear lactate more efficiently, so a pace that once felt hard starts to feel comfortable. It is the single largest determinant of middle- and long-distance performance.',
    porsi: '10–15% of weekly kilometres',
    durasi: '20–40 minutes continuous, or 2 × 15 minute blocks',
    rasa: 'Comfortably hard — you can manage only 3–5 words at a time',
    salahnya:
      'Running it like a race. Once you are gasping it is no longer a tempo but an interval, and the threshold benefit is exactly what you lose.',
  },
  {
    key: 'interval',
    name: 'Interval',
    tujuan: 'Trains speed and VO₂max',
    kenapa:
      'Short blocks at very high intensity force the heart to work at maximal output — the strongest stimulus for raising VO₂max, the fitness marker most closely tied to life expectancy. Because it is so fatiguing, the dose must stay small.',
    porsi: '5–10% of weekly kilometres, at most 1–2 sessions a week',
    durasi: 'Blocks of 400 m to 1,200 m with jogging recovery between',
    rasa: 'Hard — one or two words at most; breathing has not fully recovered when the next block starts',
    salahnya:
      'Adding interval sessions because they feel like the "most useful" ones. Intervals without an adequate aerobic base are the fastest route to injury and chronic fatigue.',
  },
]

/** Titik acuan tabel VDOT: race pace → rentang pace tiap jenis lari (detik/km). */
interface PaceRow {
  race: number
  easy: [number, number]
  long: [number, number]
  tempo: [number, number]
  interval: [number, number]
}

const mmss = (m: number, s: number) => m * 60 + s

const TABLE: PaceRow[] = [
  { race: mmss(3, 0), easy: [mmss(3, 55), mmss(4, 25)], long: [mmss(4, 5), mmss(4, 30)], tempo: [mmss(3, 15), mmss(3, 20)], interval: [mmss(2, 55), mmss(3, 5)] },
  { race: mmss(3, 30), easy: [mmss(4, 25), mmss(4, 55)], long: [mmss(4, 35), mmss(5, 0)], tempo: [mmss(3, 45), mmss(3, 50)], interval: [mmss(3, 25), mmss(3, 35)] },
  { race: mmss(4, 0), easy: [mmss(5, 0), mmss(5, 35)], long: [mmss(5, 10), mmss(5, 45)], tempo: [mmss(4, 15), mmss(4, 20)], interval: [mmss(3, 55), mmss(4, 5)] },
  { race: mmss(4, 30), easy: [mmss(5, 35), mmss(6, 10)], long: [mmss(5, 45), mmss(6, 20)], tempo: [mmss(4, 45), mmss(4, 50)], interval: [mmss(4, 25), mmss(4, 35)] },
  { race: mmss(5, 0), easy: [mmss(6, 10), mmss(6, 45)], long: [mmss(6, 20), mmss(6, 55)], tempo: [mmss(5, 15), mmss(5, 20)], interval: [mmss(4, 55), mmss(5, 5)] },
  { race: mmss(5, 30), easy: [mmss(6, 45), mmss(7, 20)], long: [mmss(6, 55), mmss(7, 30)], tempo: [mmss(5, 45), mmss(5, 50)], interval: [mmss(5, 25), mmss(5, 35)] },
  { race: mmss(6, 0), easy: [mmss(7, 20), mmss(8, 0)], long: [mmss(7, 30), mmss(8, 10)], tempo: [mmss(6, 15), mmss(6, 20)], interval: [mmss(5, 55), mmss(6, 5)] },
]

export const PACE_TABLE = TABLE

/** Format detik/km menjadi "m:ss". */
export function fmtPace(sec: number): string {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Ubah "5:30" atau "5.30" menjadi detik. Mengembalikan null bila tidak sah. */
export function parsePace(text: string): number | null {
  const t = text.trim().replace('.', ':')
  const m = /^(\d{1,2}):([0-5]?\d)$/.exec(t)
  if (!m) return null
  const sec = Number(m[1]) * 60 + Number(m[2])
  return Number.isFinite(sec) && sec > 0 ? sec : null
}

export interface PaceResult {
  race: number
  zones: Record<RunType, [number, number]>
  /** Diluar rentang tabel — angka diambil dari baris terdekat, bukan interpolasi. */
  clamped: boolean
}

/**
 * Pace latihan untuk satu race pace. Diinterpolasi linier di antara baris tabel
 * sehingga pace di antara nilai tabel tetap menghasilkan angka yang wajar,
 * alih-alih dibulatkan ke baris terdekat.
 */
export function trainingPaces(racePaceSec: number): PaceResult {
  const first = TABLE[0]
  const last = TABLE[TABLE.length - 1]
  const pick = (r: PaceRow): Record<RunType, [number, number]> => ({
    easy: r.easy, long: r.long, tempo: r.tempo, interval: r.interval,
  })

  if (racePaceSec <= first.race) return { race: racePaceSec, zones: pick(first), clamped: true }
  if (racePaceSec >= last.race) return { race: racePaceSec, zones: pick(last), clamped: true }

  let lo = TABLE[0]
  let hi = TABLE[1]
  for (let i = 0; i < TABLE.length - 1; i++) {
    if (racePaceSec >= TABLE[i].race && racePaceSec <= TABLE[i + 1].race) {
      lo = TABLE[i]
      hi = TABLE[i + 1]
      break
    }
  }
  const span = hi.race - lo.race
  const t = span === 0 ? 0 : (racePaceSec - lo.race) / span
  const mix = (a: [number, number], b: [number, number]): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ]
  return {
    race: racePaceSec,
    clamped: false,
    zones: {
      easy: mix(lo.easy, hi.easy),
      long: mix(lo.long, hi.long),
      tempo: mix(lo.tempo, hi.tempo),
      interval: mix(lo.interval, hi.interval),
    },
  }
}

/** Perkiraan race pace 5 K dari waktu tempuh suatu jarak. */
export function paceFromRun(distanceKm: number, minutes: number): number | null {
  if (!(distanceKm > 0) || !(minutes > 0)) return null
  return (minutes * 60) / distanceKm
}

// ─── Kalistenik: tangga progresi ────────────────────────────────────────────

export interface Step {
  level: number
  name: string
  target: string
  /** Syarat naik ke tingkat berikutnya. */
  naik: string
  cue: string
}

export interface Ladder {
  key: 'pushup' | 'pullup' | 'situp'
  title: string
  otot: string
  /** Kenapa gerakan ini penting untuk postur, bukan sekadar untuk kekuatan. */
  postur: string
  frekuensi: string
  steps: Step[]
}

export const LADDERS: Ladder[] = [
  {
    key: 'pushup',
    title: 'Push-Up',
    otot: 'Chest, triceps, anterior deltoid, and serratus anterior',
    postur:
      'Serratus anterior is the muscle that holds the shoulder blade against the rib cage. When it is weak the blade wings out and the shoulder drops forward. A push-up finished with a full protraction at the top — rather than stopping when the elbows lock — trains it directly.',
    frekuensi: '3–4 times a week, with at least one day between sessions',
    steps: [
      { level: 1, name: 'Wall push-up', target: '3×15', naik: '3 × 15 with full, controlled range', cue: 'Body in one straight line from ear to heel; do not pike at the hips' },
      { level: 2, name: 'Table / bench push-up', target: '3×12', naik: '3 × 12 without the hips sagging', cue: 'The lower the support, the harder it gets; lower the height gradually' },
      { level: 3, name: 'Knee push-up', target: '3×12', naik: '3 × 12 with the chest close to the floor', cue: 'Knees, hips and shoulders in one line — do not bend at the hip' },
      { level: 4, name: 'Push-up penuh', target: '3×8', naik: '3 × 8 with the chest almost touching the floor', cue: 'Elbows about 45° from the body, not flared to 90° — flared elbows load the shoulder joint' },
      { level: 5, name: 'Full push-up, volume', target: '3×20', naik: '3 × 20', cue: 'Pause 1 second at the bottom; quality of movement matters more than the count' },
      { level: 6, name: 'Feet-elevated / archer push-up', target: '3×10', naik: 'Progress to one-arm variants if you want to', cue: 'Raise the feet to load the shoulders and upper chest more' },
    ],
  },
  {
    key: 'pullup',
    title: 'Pull-Up',
    otot: 'Latissimus dorsi, rhomboids, lower trapezius, biceps, and grip',
    postur:
      'THIS IS THE MOST IMPORTANT MOVEMENT FOR POSTURE. The rhomboids and lower trapezius draw the shoulder blade back and down. Hours of slumped sitting weaken both while shortening the chest, so the shoulders pull forward and the head drifts ahead — the pattern known as upper cross syndrome. Every pulling exercise corrects it; no amount of pushing can substitute.',
    frekuensi: '2–3 times a week, with at least one day between sessions',
    steps: [
      { level: 1, name: 'Dead hang', target: '3 × 20 seconds', naik: 'Hang for 30 seconds', cue: 'Shoulders actively pulled down away from the ears, not hanging passively' },
      { level: 2, name: 'Scapular pull', target: '3×8', naik: '3 × 10 under control', cue: 'Only the shoulder blades move downward; the elbows stay straight. This is the most direct way to train the lower trapezius' },
      { level: 3, name: 'Australian row / inverted row', target: '3×10', naik: '3 × 12 with the body progressively more horizontal', cue: 'Pull until the chest meets the bar; hold the body straight as a plank' },
      { level: 4, name: 'Negative pull-up', target: '3 × 5 with a 5-second lowering', naik: 'Control a 5-second lowering for 3 × 5', cue: 'Jump to the top, then lower as slowly as you can — the lowering phase is what builds the strength' },
      { level: 5, name: 'Pull-up penuh', target: '3×3', naik: '3 × 5', cue: 'Chin over the bar, lower until the elbows are almost straight; no swinging' },
      { level: 6, name: 'Pull-up, volume / weighted', target: '3 × 10, or add load', naik: '—', cue: 'Once you reach 3×10, add load rather than more repetitions' },
    ],
  },
  {
    key: 'situp',
    title: 'Sit-Up & Core',
    otot: 'Rectus abdominis, obliques, and the deep abdominal wall (transversus abdominis)',
    postur:
      'For posture, the part of the core that matters most is not the front of the abdomen but transversus abdominis and the deep muscles that stabilise the pelvis. Very high-volume sit-ups load the spinal discs, while holding exercises such as planks and dead bugs train the stabilising function you actually need to stand tall without pain.',
    frekuensi: '3–4 times a week; daily is fine for the lighter holds',
    steps: [
      { level: 1, name: 'Dead bug', target: '3 × 8 each side', naik: 'The lower back stays in contact with the floor throughout', cue: 'The lower back must NOT lift off the floor — that is a requirement, not a suggestion' },
      { level: 2, name: 'Plank', target: '3 × 30 seconds', naik: '3 × 45 seconds without the hips dropping', cue: 'Hips level with the shoulders; squeeze the glutes so the pelvis does not tip' },
      { level: 3, name: 'Controlled crunch', target: '3×15', naik: '3 × 20', cue: 'Lift only until the shoulder blades clear the floor; keep the neck relaxed and do not pull on it' },
      { level: 4, name: 'Sit-up penuh', target: '3×15', naik: '3 × 20', cue: 'Slow and controlled; stop if the lower back hurts' },
      { level: 5, name: 'Hanging knee raise', target: '3×10', naik: '3 × 12', cue: 'Lift by curling the pelvis upward, not by simply flexing the hip' },
      { level: 6, name: 'Hanging leg raise / ab wheel', target: '3×8', naik: '—', cue: 'No swinging; control the lowering phase' },
    ],
  },
]

// ─── Program koreksi postur ─────────────────────────────────────────────────

export interface PostureItem {
  nama: string
  jenis: 'regangkan' | 'kuatkan' | 'sadari'
  dosis: string
  cue: string
}

/**
 * Postur bungkuk pada orang yang bekerja lama berdiri membungkuk maupun duduk
 * (koas, dokter jaga, pekerja meja) mengikuti pola yang dapat diprediksi:
 * OTOT DEPAN MEMENDEK, OTOT BELAKANG MELEMAH. Karena itu programnya bukan
 * "latihan punggung" semata, melainkan pasangan: regangkan yang memendek,
 * kuatkan yang melemah. Melakukan salah satunya saja jarang berhasil.
 */
export const POSTURE_PROGRAM: PostureItem[] = [
  { nama: 'Doorway chest stretch', jenis: 'regangkan', dosis: '3 × 30 seconds, twice a day', cue: 'Upper arm at shoulder height, step forward until you feel the stretch across the front of the chest — not in the shoulder joint' },
  { nama: 'Front-of-neck stretch (chin tuck)', jenis: 'kuatkan', dosis: '3 × 10 holding 5 seconds, several times a day', cue: 'Draw the chin straight back, making a double chin; the head does not nod down' },
  { nama: 'Front-of-hip stretch (hip flexor)', jenis: 'regangkan', dosis: '3 × 30 seconds each side', cue: 'Half-kneeling; squeeze the glute on the back side, then push the hips forward' },
  { nama: 'Scapular pull / band pull-apart', jenis: 'kuatkan', dosis: '3 × 15, three times a week', cue: 'Draw the shoulder blades down and back; do not let the shoulders rise toward the ears' },
  { nama: 'Face pulls or band rows', jenis: 'kuatkan', dosis: '3 × 15, three times a week', cue: 'Pull toward the forehead with high elbows — this trains the lower trapezius and the external rotators' },
  { nama: 'Prone Y-T-W', jenis: 'kuatkan', dosis: '3 × 8 of each letter', cue: 'Lie face down and lift the arms into a Y, T, and W with the thumbs pointing up' },
  { nama: 'Glute bridge', jenis: 'kuatkan', dosis: '3×12', cue: 'Glutes weakened by long sitting tip the pelvis forward and leave the lower back carrying too much' },
  { nama: 'Stand up every 30–45 minutes', jenis: 'sadari', dosis: 'Throughout the working day', cue: 'Posture suffers from HOW LONG you hold one position, not from one wrong position. Changing position matters more than finding a perfect one' },
  { nama: 'Set your screen and desk height', jenis: 'sadari', dosis: 'Once, permanently', cue: 'The top of the screen slightly below eye level; elbows around 90°. Holding good posture at a badly set desk will not last' },
]

export interface WeekPlan {
  hari: string
  isi: string
  jenis: 'lari' | 'kekuatan' | 'pulih'
}

/** Contoh susunan seminggu yang menggabungkan lari dan kalistenik. */
export function weeklyTemplate(hariLari: 3 | 4 | 5): WeekPlan[] {
  const base: WeekPlan[] = [
    { hari: 'Monday', isi: 'Easy run 30–40 minutes + the posture programme', jenis: 'lari' },
    { hari: 'Tuesday', isi: 'Push-up + pull-up + core (progression ladder)', jenis: 'kekuatan' },
    { hari: 'Wednesday', isi: 'Tempo run 20–30 minutes (after warming up)', jenis: 'lari' },
    { hari: 'Thursday', isi: 'A gentle walk, stretching, enough sleep', jenis: 'pulih' },
    { hari: 'Friday', isi: 'Push-up + pull-up + core (progression ladder)', jenis: 'kekuatan' },
    { hari: 'Saturday', isi: 'Long run 60–90 minutes at long-run pace', jenis: 'lari' },
    { hari: 'Sunday', isi: 'Complete rest or a light walk', jenis: 'pulih' },
  ]
  if (hariLari === 4) base[3] = { hari: 'Thursday', isi: 'Easy run, 30 minutes', jenis: 'lari' }
  if (hariLari === 5) {
    base[3] = { hari: 'Thursday', isi: 'Easy run, 30 minutes', jenis: 'lari' }
    base[6] = { hari: 'Sunday', isi: 'Intervals 6 × 400 m (only once the aerobic base is solid)', jenis: 'lari' }
  }
  return base
}

/** The rule broken most often dan paling sering menyebabkan cedera. */
export const RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Increase distance by at most 10% a week',
    isi: 'Running injuries in beginners almost always come from adding distance too fast, not from technique. Bone, tendon and ligament adapt far more slowly than the heart and lungs — the feeling of "still having more" arrives before the tissue is ready.',
  },
  {
    judul: 'Most of your running should feel easy',
    isi: 'If every session feels hard, the programme is wrong. The 80/20 rule — roughly 80% of kilometres at low intensity — is used by almost every distance runner, including the elite ones.',
  },
  {
    judul: 'Rest days are part of the programme',
    isi: 'Adaptation happens during recovery, not during training. Training without recovery only accumulates fatigue, and for anyone whose sleep is already disrupted by shift work, that is a real risk.',
  },
  {
    judul: 'Sleep is the training you cannot see',
    isi: 'Short sleep lowers muscle protein synthesis, raises stress hormones, and slows recovery. Adding training sessions while cutting sleep almost always produces a worse result than training less and sleeping enough.',
  },
  {
    judul: 'Joint pain is not muscle pain',
    isi: 'Muscle soreness appearing 1–2 days after training is normal. Pain that is sharp, localised to a joint, worsens during training, or lasts more than a few days is not something to push through — reduce the load, and get it looked at if it persists.',
  },
]
