import { WORKOUT_MUSCLE_GROUPS } from './workoutMuscles'

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATOR LATIHAN 3D — otot mana yang bekerja, dan KAPAN dalam gerakannya.
//
// Menyorot "otot dada" saat seseorang memilih bench press hampir tidak
// mengajarkan apa pun: yang menentukan hasil latihan justru PERAN tiap otot
// dan FASE tempat ia bekerja paling keras.
//
//   PENGGERAK UTAMA  otot yang menghasilkan gerakannya. Ini yang tumbuh.
//   SINERGIS         ikut membantu; sering ia yang lebih dulu lelah dan
//                    menghentikan set, bukan penggerak utamanya.
//   STABILISATOR     tidak menggerakkan apa pun. Ia menahan sendi tetap di
//                    tempatnya, dan justru kegagalannya yang mencederai.
//
// FASE. Tiap gerakan punya fase konsentrik (otot memendek, mengangkat) dan
// eksentrik (otot memanjang di bawah beban, menurunkan). Fase eksentrik
// menghasilkan gaya lebih besar, menyebabkan lebih banyak nyeri otot tertunda,
// dan pada beberapa cedera justru di situlah ototnya robek — hamstring pada
// sprint adalah contoh yang paling dikenal. Karena itu simulator ini
// menganimasikan kedua fase dengan tempo berbeda, bukan sekadar berkedip.
//
// Nama simpul otot TIDAK ditulis ulang di sini. Semuanya diambil dari
// WORKOUT_MUSCLE_GROUPS, yang namanya sudah diverifikasi cocok dengan berkas
// .glb — menyalinnya berarti membuat sumber kedua yang akan bercabang diam-diam.
// ─────────────────────────────────────────────────────────────────────────────

export type Peran = 'utama' | 'sinergis' | 'stabilisator'

export interface OtotLatihan {
  /** key di WORKOUT_MUSCLE_GROUPS. */
  grup: string
  peran: Peran
}

export interface Latihan {
  id: string
  nama: string
  /** Pola gerak dasarnya — dua latihan dengan pola sama melatih hal yang sama. */
  pola: 'dorong horizontal' | 'dorong vertikal' | 'tarik horizontal' | 'tarik vertikal'
       | 'jongkok' | 'engsel pinggul' | 'satu kaki' | 'inti' | 'bawa beban'
  otot: OtotLatihan[]
  /** Apa yang terjadi saat mengangkat (konsentrik). */
  konsentrik: string
  /** Apa yang terjadi saat menurunkan (eksentrik) — dan kenapa itu penting. */
  eksentrik: string
  /** Kesalahan yang paling sering dan akibatnya. */
  kesalahan: string
  /** Detik per fase: [konsentrik, eksentrik]. Eksentrik sengaja lebih lambat. */
  tempo: [number, number]
}

export const LATIHAN: Latihan[] = [
  {
    id: 'pushup', nama: 'Push-Up', pola: 'dorong horizontal',
    otot: [
      { grup: 'chest', peran: 'utama' },
      { grup: 'triceps', peran: 'sinergis' },
      { grup: 'shoulders', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
    ],
    konsentrik: 'Pectoralis major draws the arms toward the midline while triceps straighten the elbows. Roughly 64% of body weight is on the hands in a standard plank position.',
    eksentrik: 'Lowering under control lengthens pectoralis major while it still holds the load. This is where most of the strength gain and most of the next-day soreness come from — dropping fast wastes the best half of the repetition.',
    kesalahan: 'Hips sagging means the abdominal wall stopped stabilising, and the lumbar spine takes the extension. Elbows flared to 90° squeezes the supraspinatus tendon under the acromion.',
    tempo: [1, 2],
  },
  {
    id: 'benchpress', nama: 'Bench Press', pola: 'dorong horizontal',
    otot: [
      { grup: 'chest', peran: 'utama' },
      { grup: 'triceps', peran: 'sinergis' },
      { grup: 'shoulders', peran: 'sinergis' },
      { grup: 'back', peran: 'stabilisator' },
    ],
    konsentrik: 'The bar is driven up as pectoralis major adducts the arm horizontally and triceps extend the elbow.',
    eksentrik: 'The bar is lowered to the lower sternum with the shoulder blades pinned back and down. That retraction is what gives the shoulder a stable base — without it the humeral head drifts forward.',
    kesalahan: 'Letting the shoulder blades roll forward at the bottom puts the load onto the anterior capsule instead of the chest. Bouncing the bar off the ribs removes the eccentric entirely.',
    tempo: [1, 2],
  },
  {
    id: 'pullup', nama: 'Pull-Up', pola: 'tarik vertikal',
    otot: [
      { grup: 'back', peran: 'utama' },
      { grup: 'biceps', peran: 'sinergis' },
      { grup: 'forearms', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
    ],
    konsentrik: 'Latissimus dorsi pulls the arm down and back against a fixed bar, so the body rises instead. Starting with scapular depression recruits lower trapezius before the elbows bend.',
    eksentrik: 'Lowering to a full dead hang under control. People who cannot yet do a pull-up build it fastest here — the eccentric is trainable long before the concentric is.',
    kesalahan: 'Starting by bending the elbows hands the work to biceps and neck. Heavy kipping loads the shoulder in its least stable position.',
    tempo: [1, 3],
  },
  {
    id: 'row', nama: 'Bent-Over Row', pola: 'tarik horizontal',
    otot: [
      { grup: 'back', peran: 'utama' },
      { grup: 'biceps', peran: 'sinergis' },
      { grup: 'hamstrings', peran: 'stabilisator' },
      { grup: 'abs', peran: 'stabilisator' },
    ],
    konsentrik: 'The weight is pulled to the lower abdomen as the shoulder blades squeeze together — rhomboids and mid-trapezius, with latissimus extending the shoulder.',
    eksentrik: 'Lowering with the torso angle unchanged. The hamstrings and spinal erectors are holding an isometric hinge the whole time; the row is as much a back-position exercise as a pulling one.',
    kesalahan: 'Rounding the lower back under load puts shear force through the discs. Standing up as the weight rises means the legs are lifting it, not the back.',
    tempo: [1, 2],
  },
  {
    id: 'ohp', nama: 'Overhead Press', pola: 'dorong vertikal',
    otot: [
      { grup: 'shoulders', peran: 'utama' },
      { grup: 'triceps', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
      { grup: 'glutes', peran: 'stabilisator' },
    ],
    konsentrik: 'Anterior and lateral deltoid lift the arm overhead while triceps lock out the elbow. The scapula must rotate upward or the humerus jams against the acromion.',
    eksentrik: 'Lowering to the front of the shoulders under control, keeping the ribcage down.',
    kesalahan: 'Arching the lower back to finish the lift converts a shoulder exercise into a lumbar one — it means the shoulder lacks the overhead range, and the spine is paying for it.',
    tempo: [1, 2],
  },
  {
    id: 'squat', nama: 'Back Squat', pola: 'jongkok',
    otot: [
      { grup: 'quads', peran: 'utama' },
      { grup: 'glutes', peran: 'utama' },
      { grup: 'hamstrings', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
      { grup: 'back', peran: 'stabilisator' },
    ],
    konsentrik: 'Quadriceps extend the knee and gluteus maximus extends the hip together. Depth shifts the balance: deeper means more glute.',
    eksentrik: 'Descending under control with the knees tracking over the toes. Knees travelling forward is normal and safe; knees collapsing inward is not.',
    kesalahan: 'Knees caving in usually means weak gluteus medius, and it is the same pattern behind much patellofemoral pain and non-contact ACL injury. The lower back rounding at the bottom is a mobility limit, not a strength one.',
    tempo: [1, 2],
  },
  {
    id: 'deadlift', nama: 'Deadlift', pola: 'engsel pinggul',
    otot: [
      { grup: 'glutes', peran: 'utama' },
      { grup: 'hamstrings', peran: 'utama' },
      { grup: 'back', peran: 'sinergis' },
      { grup: 'forearms', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
    ],
    konsentrik: 'The hips extend and the bar rises close to the legs. This is a hip hinge, not a squat — the knees unlock but do not drive the movement.',
    eksentrik: 'Lowering by pushing the hips back first. Hamstrings lengthen under load throughout, which is exactly the quality that protects them in sprinting.',
    kesalahan: 'Letting the bar drift forward multiplies the moment arm on the lower back. Rounding under a heavy bar is the classic mechanism of disc injury.',
    tempo: [1, 2],
  },
  {
    id: 'rdl', nama: 'Romanian Deadlift', pola: 'engsel pinggul',
    otot: [
      { grup: 'hamstrings', peran: 'utama' },
      { grup: 'glutes', peran: 'sinergis' },
      { grup: 'back', peran: 'stabilisator' },
    ],
    konsentrik: 'The hips drive forward to stand up, with the knees only slightly bent throughout.',
    eksentrik: 'The whole point of the exercise. Hamstrings lengthen under load as the hips travel back — the same lengthening-under-tension that fails in a sprint strain, trained deliberately.',
    kesalahan: 'Bending the knees turns it into a deadlift and removes the hamstring stretch. Going below the point where the back rounds trains the spine, not the hamstrings.',
    tempo: [1, 3],
  },
  {
    id: 'lunge', nama: 'Lunge', pola: 'satu kaki',
    otot: [
      { grup: 'quads', peran: 'utama' },
      { grup: 'glutes', peran: 'utama' },
      { grup: 'hamstrings', peran: 'sinergis' },
      { grup: 'abs', peran: 'stabilisator' },
    ],
    konsentrik: 'The front leg extends the knee and hip to drive back up.',
    eksentrik: 'Descending on one leg. Single-leg work exposes side-to-side differences that a barbell squat hides, because the stronger side stops compensating.',
    kesalahan: 'The front knee falling inward, again a gluteus medius problem. Leaning the torso forward shifts load off the quadriceps onto the lower back.',
    tempo: [1, 2],
  },
  {
    id: 'plank', nama: 'Plank', pola: 'inti',
    otot: [
      { grup: 'abs', peran: 'utama' },
      { grup: 'shoulders', peran: 'stabilisator' },
      { grup: 'glutes', peran: 'stabilisator' },
    ],
    konsentrik: 'Nothing shortens. This is an ANTI-EXTENSION hold: the abdominal wall resists the lumbar spine sagging, which is what the trunk actually does during walking, lifting and carrying.',
    eksentrik: 'Also nothing. Length stays constant — an isometric contraction, the only category of the three that produces no movement at all.',
    kesalahan: 'Hips rising turns it into a rest. Hips sagging means the abdominal wall has already failed and the joints are taking the load — stop the set there, not at a target time.',
    tempo: [2, 2],
  },
  {
    id: 'curl', nama: 'Biceps Curl', pola: 'tarik horizontal',
    otot: [
      { grup: 'biceps', peran: 'utama' },
      { grup: 'forearms', peran: 'sinergis' },
    ],
    konsentrik: 'The elbow flexes and, with a supinated grip, biceps brachii also supinates — its strongest action.',
    eksentrik: 'Lowering over 2–3 seconds. Biceps handle far more load lengthening than shortening, so the slow negative is where the size comes from.',
    kesalahan: 'Swinging the torso hands the work to the lower back and removes tension from the muscle being trained.',
    tempo: [1, 3],
  },
  {
    id: 'calfraise', nama: 'Calf Raise', pola: 'satu kaki',
    otot: [
      { grup: 'calves', peran: 'utama' },
    ],
    konsentrik: 'Plantarflexion. With the knee STRAIGHT this loads gastrocnemius; with the knee BENT, gastrocnemius slackens and soleus takes over — training only one leaves half the calf untrained.',
    eksentrik: 'Lowering below the step under control. Eccentric calf work is the best-evidenced treatment for Achilles tendinopathy there is.',
    kesalahan: 'Bouncing uses the tendon as a spring and bypasses the muscle entirely.',
    tempo: [1, 3],
  },
]

/** Nama simpul 3D untuk satu latihan, dipisah menurut peran. */
export function nodesForExercise(ex: Latihan): Record<Peran, string[]> {
  const keluar: Record<Peran, string[]> = { utama: [], sinergis: [], stabilisator: [] }
  for (const o of ex.otot) {
    const g = WORKOUT_MUSCLE_GROUPS.find((x) => x.key === o.grup)
    if (!g) continue
    keluar[o.peran].push(...g.nodeNames)
  }
  return keluar
}

/** Label kelompok otot per peran — untuk ditampilkan sebagai daftar. */
export function groupsForExercise(ex: Latihan): Record<Peran, string[]> {
  const keluar: Record<Peran, string[]> = { utama: [], sinergis: [], stabilisator: [] }
  for (const o of ex.otot) {
    const g = WORKOUT_MUSCLE_GROUPS.find((x) => x.key === o.grup)
    if (g) keluar[o.peran].push(g.label)
  }
  return keluar
}

export const PERAN_LABEL: Record<Peran, { label: string; jelas: string }> = {
  utama: { label: 'Prime mover', jelas: 'Produces the movement. This is what grows.' },
  sinergis: { label: 'Synergist', jelas: 'Assists. Often the first to fatigue and end the set.' },
  stabilisator: { label: 'Stabiliser', jelas: 'Moves nothing. Holds the joint in place — and its failure is what injures.' },
}
