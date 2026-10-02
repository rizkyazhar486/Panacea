// Mesin tuas sendi — kelas tiga, dihitung bukan dinarasikan.
//
// KENAPA ADA BERKAS INI. `bodyPhysiology.ts` memuat baris "Joint torque:
// τ = r × F" sebagai TEKS. Rumus yang hanya dicetak tidak pernah salah dan
// tidak pernah mengajar apa pun. Yang mengajar adalah angkanya: pada sendi
// kelas tiga, insersi otot duduk dekat sumbu sendi, sehingga gaya otot adalah
// KELIPATAN besar dari beban, dan gaya reaksi sendi lebih besar lagi. Itu
// bagian yang tidak intuitif, dan hanya muncul kalau dihitung.
//
// Model: satu segmen kaku, satu otot, tanpa ko-kontraksi, tanpa jaringan
// lunak, tanpa massa segmen. Lengan momen adalah nilai rujukan generik.

/** Di bawah ambang ini lengan momen diperlakukan nol (cm). */
export const MOMENT_ARM_EPSILON_CM = 1e-9

/** Percepatan gravitasi baku (m/s²). */
export const G = 9.80665

/** Geometri tuas kelas tiga: otot menyisip DI ANTARA sumbu sendi dan beban. */
export interface JointLeverInput {
  /** Jarak sumbu sendi ke insersi otot (cm) — lengan momen anatomis, r. */
  muscleInsertionCm: number
  /** Jarak sumbu sendi ke titik beban (cm) — lengan beban, d. */
  loadDistanceCm: number
  /** Sudut sendi (derajat, 0–180). Menyetir rotasi segmen dan r_eff. */
  jointAngleDeg: number
  /** Massa beban luar (kg). */
  loadMassKg: number
}

export interface JointLeverSolution {
  /** r_eff = r · sin θ (cm). Nol pada 0° dan 180°, maksimum pada 90°. */
  effectiveMomentArmCm: number
  /** Lengan momen beban (cm). Beban dimodelkan tegak lurus segmen. */
  loadMomentArmCm: number
  /** Berat beban (N). */
  loadForceN: number
  /** Momen beban terhadap sendi (N·m). */
  loadMomentNm: number
  /** Gaya otot yang dibutuhkan untuk kesetimbangan statis (N). */
  requiredMuscleForceN: number
  /** Torsi otot pada gaya terpecahkan itu (N·m) — sama dengan momen beban. */
  muscleTorqueNm: number
  /** Kelipatan gaya otot terhadap beban: F_otot / berat beban. */
  forceMultiple: number
  /** Keuntungan mekanis r_eff / d — selalu < 1 pada tuas kelas tiga. */
  mechanicalAdvantage: number
  /** Besar gaya reaksi sendi (N) — jumlah vektor yang ditanggung sendi. */
  jointReactionN: number
  /** Kelipatan reaksi sendi terhadap beban. */
  jointReactionMultiple: number
  /** Momen netto terhadap sendi (N·m) — harus nol dalam toleransi float. */
  netMomentNm: number
  /** Benar bila penyelesaiannya berhingga dan bermakna. */
  feasible: boolean
  /** Alasan penolakan bila tidak feasible; UI wajib menampilkannya. */
  refusal: string | null
}

/** Lengan momen efektif r_eff = r · sin θ. Satu-satunya sumber untuk angka
 *  maupun kurva; memisahkannya membuat gambar bisa berbohong sementara uji
 *  tetap lulus. */
export function effectiveMomentArmCm(muscleInsertionCm: number, jointAngleDeg: number): number {
  const raw = muscleInsertionCm * Math.sin((jointAngleDeg * Math.PI) / 180)
  // sin(180°) dalam floating point bukan nol melainkan ~1,2e-16. Tanpa
  // pembulatan ini, ekstensi penuh akan "punya pengungkit" dan mencetak gaya
  // otot sebesar 1e18 N alih-alih ditolak.
  return Math.abs(raw) < MOMENT_ARM_EPSILON_CM ? 0 : raw
}

/** Torsi otot τ = F · r_eff (N·m; r_eff dalam cm). */
export function muscleTorqueNm(forceN: number, muscleInsertionCm: number, jointAngleDeg: number): number {
  return (forceN * effectiveMomentArmCm(muscleInsertionCm, jointAngleDeg)) / 100
}

/** Selesaikan kesetimbangan statis: F_otot · r_eff = W · d. */
export function solveJointLever(input: JointLeverInput): JointLeverSolution {
  const rEff = effectiveMomentArmCm(input.muscleInsertionCm, input.jointAngleDeg)
  const d = input.loadDistanceCm
  const loadForceN = input.loadMassKg * G
  const loadMomentNm = (loadForceN * d) / 100

  // Kontrol negatif: lengan momen nol berarti otot tidak punya pengungkit sama
  // sekali. Jawaban jujurnya tak-hingga, bukan angka besar yang dibulatkan.
  const requiredMuscleForceN = rEff === 0 ? Infinity : (loadForceN * d) / rEff
  const feasible = Number.isFinite(requiredMuscleForceN) && rEff > 0

  const theta = (input.jointAngleDeg * Math.PI) / 180
  // Reaksi sendi: jumlah vektor gaya otot dan beban yang ditanggung sendi.
  // Otot menarik pada sudut θ terhadap segmen; beban bekerja tegak lurus segmen.
  const jointReactionN = feasible
    ? Math.hypot(
        requiredMuscleForceN * Math.cos(theta),
        requiredMuscleForceN * Math.sin(theta) - loadForceN,
      )
    : Infinity

  const torque = feasible
    ? muscleTorqueNm(requiredMuscleForceN, input.muscleInsertionCm, input.jointAngleDeg)
    : Infinity

  return {
    effectiveMomentArmCm: rEff,
    loadMomentArmCm: d,
    loadForceN,
    loadMomentNm,
    requiredMuscleForceN,
    muscleTorqueNm: torque,
    forceMultiple: loadForceN > 0 ? requiredMuscleForceN / loadForceN : Infinity,
    mechanicalAdvantage: d > 0 ? rEff / d : Infinity,
    jointReactionN,
    jointReactionMultiple: loadForceN > 0 ? jointReactionN / loadForceN : Infinity,
    netMomentNm: feasible ? torque - loadMomentNm : NaN,
    feasible,
    refusal: feasible
      ? null
      : 'Effective moment arm is zero at this angle: the muscle line of action passes through the joint axis and has no leverage at all. No finite muscle force can hold the load here, so no number is printed.',
  }
}

export interface TorqueCurvePoint {
  angleDeg: number
  effectiveMomentArmCm: number
  /** Torsi per 100 N gaya otot (N·m) — bentuk kurva τ terhadap sudut. */
  torquePer100NNm: number
  /** Gaya otot yang dibutuhkan pada sudut itu (N); Infinity di ujung. */
  requiredMuscleForceN: number
}

/** Kurva torsi terhadap sudut, dibangun oleh fungsi yang sama dengan yang
 *  mencetak angka di panel. */
export function torqueCurve(input: JointLeverInput, samples = 91): TorqueCurvePoint[] {
  const points: TorqueCurvePoint[] = []
  for (let i = 0; i < samples; i += 1) {
    const angleDeg = (180 * i) / (samples - 1)
    const solution = solveJointLever({ ...input, jointAngleDeg: angleDeg })
    points.push({
      angleDeg,
      effectiveMomentArmCm: solution.effectiveMomentArmCm,
      torquePer100NNm: muscleTorqueNm(100, input.muscleInsertionCm, angleDeg),
      requiredMuscleForceN: solution.requiredMuscleForceN,
    })
  }
  return points
}

/** Geometri rujukan generik. Nilai lengan momen berbeda antar orang dan antar
 *  metode pengukuran; ini bahan ajar, bukan pengukuran siapa pun. */
export interface JointLeverPreset extends JointLeverInput {
  id: string
  label: string
  note: string
}

export const JOINT_LEVER_PRESETS: JointLeverPreset[] = [
  {
    id: 'elbow-biceps',
    label: 'Elbow — biceps brachii',
    muscleInsertionCm: 5,
    loadDistanceCm: 32,
    jointAngleDeg: 90,
    loadMassKg: 5,
    note: 'The biceps insertion on the radial tuberosity sits a few centimetres from the elbow axis, while a hand-held load sits near the far end of the forearm.',
  },
  {
    id: 'knee-quadriceps',
    label: 'Knee — quadriceps via patellar tendon',
    muscleInsertionCm: 4.5,
    loadDistanceCm: 40,
    jointAngleDeg: 90,
    loadMassKg: 6,
    note: 'The patella increases the extensor moment arm, yet it stays far smaller than the distance to a load held at the ankle.',
  },
  {
    id: 'ankle-tibialis',
    label: 'Ankle — tibialis anterior',
    muscleInsertionCm: 3,
    loadDistanceCm: 18,
    jointAngleDeg: 90,
    loadMassKg: 2,
    note: 'A short dorsiflexor moment arm working against the length of the foot.',
  },
]

/** Batas penggeser — satu sumber untuk panel dan untuk ujinya. */
export const JOINT_LEVER_RANGES = {
  jointAngleDeg: { min: 0, max: 180 },
  muscleInsertionCm: { min: 0, max: 12 },
  loadDistanceCm: { min: 5, max: 50 },
  loadMassKg: { min: 0, max: 30 },
} as const

export const JOINT_LEVER_DISCLOSURE = {
  model: 'Third-class lever, static equilibrium, single muscle',
  assumptions: [
    'Rigid, weightless segment: the segment’s own mass and moment are ignored.',
    'One muscle only — no co-contraction, no synergists, no antagonist load sharing.',
    'Straight-line muscle pull whose angle of pull equals the joint angle, so the effective moment arm is r · sin θ and peaks at 90°.',
    'The external load is modelled as acting perpendicular to the segment.',
    'No soft tissue, no joint translation, no articular surface geometry.',
  ],
  provenance:
    'Generic reference biomechanics. Moment arms vary between people and between measurement methods; none of these numbers describe an individual.',
  boundary:
    'Mechanism only. No training prescription, no load recommendation, no injury-risk claim, no rehabilitation advice.',
} as const
