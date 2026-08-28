// ─────────────────────────────────────────────────────────────────────────────
// Kalistenik: pemula sampai mahir.
//
// BENTUKNYA TANGGA, BUKAN DAFTAR. Daftar gerakan tidak menolong siapa pun:
// "push-up 3×10" tidak berarti apa-apa bagi yang belum sanggup satu repetisi,
// dan tidak menantang bagi yang sudah sanggup tiga puluh. Yang diperlukan
// adalah tangga — mulai dari anak tangga yang dapat dikerjakan HARI INI, naik
// ketika syaratnya benar-benar terpenuhi.
//
// SYARAT NAIK DITULIS SEBAGAI ANGKA, BUKAN PERASAAN. Tiap anak tangga memuat
// `buka`: apa yang harus dapat dikerjakan sebelum berhak naik. Tanpa itu orang
// naik terlalu cepat, gagal, lalu menyimpulkan dirinya tidak berbakat — padahal
// yang keliru hanya urutannya.
//
// EMPAT FASE ADALAH PENANDA WAKTU, BUKAN PENJARA. Seseorang bisa berada di fase
// 3 untuk tarikan dan fase 1 untuk kaki, dan itu wajar. Fase dipakai untuk
// menjawab "sekarang saya harus fokus ke apa", bukan untuk mengunci gerakan.
//
// LEHER DAN BAHU ATAS DIMASUKKAN dengan sengaja. Hampir semua program
// kalistenik melewatkan sternokleidomastoideus dan trapezius, padahal keduanya
// diminta secara khusus dan keduanya menentukan postur — dan postur menentukan
// apakah bahu bertahan sampai gerakan tingkat lanjut.
//
// YANG TIDAK ADA DI SINI: janji waktu. Tidak ada "front lever dalam 8 pekan".
// Kecepatan orang berbeda-beda menurut berat badan, panjang tungkai, umur
// latihan, tidur, dan makanan. Yang dijanjikan hanya URUTANNYA.
// ─────────────────────────────────────────────────────────────────────────────

export type FaseId = 1 | 2 | 3 | 4

export interface Fase {
  id: FaseId
  nama: string
  lama: string
  fokus: string
  /** Apa yang menandakan fase ini selesai — bukan lama waktunya. */
  lulus: string[]
  /** Susunan latihan sepekan pada fase ini. */
  pekan: string
}

export const FASE: Fase[] = [
  {
    id: 1,
    nama: 'Foundation',
    lama: 'Roughly the first 3 months',
    fokus:
      'Teach the movement patterns and build the connective tissue that carries everything later. Tendons and ligaments adapt far more slowly than muscle — most calisthenics injuries happen to people whose muscles got strong faster than their elbows and shoulders did.',
    lulus: [
      'Full push-up 3 x 8 with the chest close to the floor',
      'Inverted row 3 x 10 with the body near horizontal',
      'Bodyweight squat 3 x 20 to full depth',
      'Plank 60 seconds and dead hang 30 seconds',
    ],
    pekan: '3 full-body sessions a week, every set stopped 2-3 reps short of failure.',
  },
  {
    id: 2,
    nama: 'Strength',
    lama: 'Roughly months 3 to 9',
    fokus:
      'Turn the pattern into real force. This is where the first pull-up, the first dip, and the first pistol squat appear. Volume rises, and rest between sets rises with it.',
    lulus: [
      'Pull-up 3 x 5 strict, no swing',
      'Dip 3 x 8 to full depth',
      'Pistol squat 3 per side, or Bulgarian split squat 3 x 10 per side',
      'Hanging leg raise 3 x 8 and hollow hold 45 seconds',
    ],
    pekan: '4 sessions a week: two push-focused, two pull-focused, legs in both.',
  },
  {
    id: 3,
    nama: 'Skill',
    lama: 'Roughly months 9 to 18',
    fokus:
      'Straight-arm strength and body position. Levers and handstands are not built by more repetitions — they are built by holding progressively harder positions, and by scapular strength that ordinary pushing and pulling never touches.',
    lulus: [
      'Handstand against the wall, 60 seconds',
      'Tuck front lever 15 seconds and tuck back lever 20 seconds',
      'L-sit 20 seconds on parallettes',
      'Muscle-up, or 3 x 3 explosive high pull-ups to sternum',
    ],
    pekan: '4-5 sessions: skill work FIRST while fresh, strength work after.',
  },
  {
    id: 4,
    nama: 'Mastery',
    lama: 'From about 18 months onward',
    fokus:
      'Full levers, planche work, one-arm progressions, and freestanding handstand. Progress here is measured in months per step, and joint health becomes the limiting factor rather than strength.',
    lulus: [
      'Full front lever 5 seconds',
      'Straddle planche 5 seconds',
      'Freestanding handstand 30 seconds',
      'One-arm pull-up progression, or weighted pull-up at +40% bodyweight',
    ],
    pekan: '5 sessions with deliberate deload every 4th week — at this level the deload is part of the programme, not a break from it.',
  },
]

export type Pola =
  | 'Horizontal push' | 'Vertical push' | 'Horizontal pull' | 'Vertical pull'
  | 'Squat' | 'Hinge & single leg' | 'Core anti-extension' | 'Core compression'
  | 'Neck & upper back' | 'Skill — handstand' | 'Skill — lever' | 'Skill — planche'

export interface Anak {
  /** Nomor anak tangga di dalam tangganya. */
  level: number
  nama: string
  fase: FaseId
  /** Sasaran yang dikerjakan pada anak tangga ini. */
  target: string
  /** Syarat yang membuka anak tangga BERIKUTNYA. Angka, bukan perasaan. */
  buka: string
  /** Satu petunjuk teknik yang paling menentukan. */
  cue: string
  /** Kekeliruan yang paling sering pada gerakan ini. */
  keliru?: string
}

export interface Tangga {
  id: string
  pola: Pola
  nama: string
  /** Otot yang benar-benar bekerja — bukan daftar anatomi lengkap. */
  otot: string
  anak: Anak[]
}

export const TANGGA: Tangga[] = [
  {
    id: 'push-horizontal',
    pola: 'Horizontal push',
    nama: 'Push-up line',
    otot: 'Pectoralis major, anterior deltoid, triceps, serratus anterior',
    anak: [
      { level: 1, nama: 'Wall push-up', fase: 1, target: '3 x 15', buka: '3 x 15 with a full, controlled range', cue: 'One straight line from ear to heel; do not pike at the hips' },
      { level: 2, nama: 'Incline push-up (table or bench)', fase: 1, target: '3 x 12', buka: '3 x 12 without the hips sagging', cue: 'The lower the surface, the harder it gets — drop the height gradually' },
      { level: 3, nama: 'Knee push-up', fase: 1, target: '3 x 12', buka: '3 x 12 with the chest close to the floor', cue: 'Knees, hips and shoulders in one line — do not bend at the hip' },
      { level: 4, nama: 'Full push-up', fase: 1, target: '3 x 8', buka: '3 x 8 with the chest almost touching the floor', cue: 'Elbows about 45 degrees from the body, not flared to 90', keliru: 'Flared elbows load the shoulder joint instead of the chest and are the commonest source of push-up shoulder pain' },
      { level: 5, nama: 'Full push-up, volume', fase: 2, target: '3 x 20', buka: '3 x 20 with a 1-second pause at the bottom', cue: 'Pause at the bottom; quality beats the count' },
      { level: 6, nama: 'Diamond push-up', fase: 2, target: '3 x 10', buka: '3 x 12', cue: 'Hands under the sternum; this shifts load onto the triceps' },
      { level: 7, nama: 'Feet-elevated push-up', fase: 2, target: '3 x 12', buka: '3 x 12 with feet at bench height', cue: 'Raising the feet loads the upper chest and shoulders' },
      { level: 8, nama: 'Archer push-up', fase: 3, target: '3 x 6 each side', buka: '3 x 8 each side', cue: 'The working arm bends, the other stays straight — this is the bridge to one-arm work' },
      { level: 9, nama: 'Pseudo planche push-up', fase: 3, target: '3 x 8', buka: '3 x 10 with the hands at hip level', cue: 'Lean the shoulders forward past the hands; this is planche strength, not chest strength' },
      { level: 10, nama: 'One-arm push-up', fase: 4, target: '3 x 3 each side', buka: '3 x 5 each side', cue: 'Feet wide for balance, hips square — do not let the hip rotate open' },
    ],
  },
  {
    id: 'push-vertical',
    pola: 'Vertical push',
    nama: 'Dip and handstand push-up line',
    otot: 'Lower pectoralis, anterior deltoid, triceps, serratus anterior',
    anak: [
      { level: 1, nama: 'Bench dip, feet on floor', fase: 1, target: '3 x 10', buka: '3 x 12 with the elbows to 90 degrees', cue: 'Keep the shoulders down and the chest open; do not shrug' },
      { level: 2, nama: 'Pike push-up', fase: 1, target: '3 x 8', buka: '3 x 10', cue: 'Hips high, head travels toward the floor between the hands' },
      { level: 3, nama: 'Band-assisted or jump-negative dip', fase: 2, target: '3 x 5 with a 5-second lowering', buka: 'Control a 5-second lowering for 3 x 5', cue: 'The lowering phase builds the strength — do not drop' },
      { level: 4, nama: 'Full dip', fase: 2, target: '3 x 8', buka: '3 x 10 to full depth', cue: 'Shoulders no lower than the elbows; slight forward lean for the chest, upright for the triceps', keliru: 'Going deeper than shoulder-below-elbow is where dip shoulder injuries come from — depth is not a virtue here' },
      { level: 5, nama: 'Feet-elevated pike push-up', fase: 2, target: '3 x 8', buka: '3 x 10 with feet at bench height', cue: 'The higher the feet, the closer this gets to a handstand push-up' },
      { level: 6, nama: 'Wall handstand hold', fase: 3, target: '3 x 30 seconds', buka: '60 seconds unbroken', cue: 'Chest to wall is the better version — it teaches a straight line, back to wall teaches a banana' },
      { level: 7, nama: 'Wall handstand push-up, partial', fase: 3, target: '3 x 5', buka: '3 x 8 to head-touch', cue: 'Lower until the head touches a folded towel, then press' },
      { level: 8, nama: 'Wall handstand push-up, full', fase: 3, target: '3 x 5', buka: '3 x 8', cue: 'Full lockout at the top; do not let the ribs flare' },
      { level: 9, nama: 'Deficit handstand push-up on parallettes', fase: 4, target: '3 x 5', buka: '3 x 8', cue: 'The extra range is what makes this harder, not the height' },
      { level: 10, nama: 'Freestanding handstand push-up', fase: 4, target: '3 x 3', buka: '—', cue: 'Balance fails before strength does; own the freestanding hold first' },
    ],
  },
  {
    id: 'pull-horizontal',
    pola: 'Horizontal pull',
    nama: 'Row line',
    otot: 'Middle trapezius, rhomboids, latissimus dorsi, posterior deltoid, biceps',
    anak: [
      { level: 1, nama: 'Scapular retraction, standing with band', fase: 1, target: '3 x 15', buka: '3 x 15 with a 2-second squeeze', cue: 'Only the shoulder blades move; elbows stay straight' },
      { level: 2, nama: 'Inverted row, bar high', fase: 1, target: '3 x 10', buka: '3 x 12', cue: 'Body straight as a plank; pull until the chest meets the bar' },
      { level: 3, nama: 'Inverted row, bar low', fase: 1, target: '3 x 10', buka: '3 x 12 with the body near horizontal', cue: 'The more horizontal the body, the harder it gets' },
      { level: 4, nama: 'Feet-elevated inverted row', fase: 2, target: '3 x 8', buka: '3 x 12', cue: 'Feet on a bench puts the body past horizontal' },
      { level: 5, nama: 'Wide-grip inverted row', fase: 2, target: '3 x 10', buka: '3 x 12', cue: 'A wider grip shifts the work to the rear delts and mid-traps' },
      { level: 6, nama: 'Archer row', fase: 3, target: '3 x 6 each side', buka: '3 x 8 each side', cue: 'One arm pulls, the other stays straight as a guide' },
      { level: 7, nama: 'One-arm inverted row', fase: 3, target: '3 x 5 each side', buka: '3 x 8 each side', cue: 'Resist the rotation — the anti-rotation demand is half the exercise' },
      { level: 8, nama: 'Front lever row, tuck', fase: 4, target: '3 x 5', buka: '3 x 8', cue: 'Row while holding a tuck front lever; this is where levers become strength rather than a hold' },
    ],
  },
  {
    id: 'pull-vertical',
    pola: 'Vertical pull',
    nama: 'Pull-up line',
    otot: 'Latissimus dorsi, lower trapezius, biceps, forearm flexors',
    anak: [
      { level: 1, nama: 'Dead hang', fase: 1, target: '3 x 20 seconds', buka: '30 seconds unbroken', cue: 'Shoulders actively pulled down away from the ears, not hanging passively' },
      { level: 2, nama: 'Scapular pull-up', fase: 1, target: '3 x 8', buka: '3 x 10 under control', cue: 'Only the shoulder blades move down; elbows stay straight. This is the most direct lower-trapezius exercise there is' },
      { level: 3, nama: 'Band-assisted pull-up', fase: 2, target: '3 x 8', buka: '3 x 8 with the lightest band you own', cue: 'Reduce the assistance before adding reps' },
      { level: 4, nama: 'Negative pull-up', fase: 2, target: '3 x 5 with a 5-second lowering', buka: 'Control a 5-second lowering for 3 x 5', cue: 'Jump to the top, lower as slowly as you can' },
      { level: 5, nama: 'Full pull-up', fase: 2, target: '3 x 3', buka: '3 x 5 strict', cue: 'Chin over the bar, lower until the elbows are almost straight; no swinging', keliru: 'Kipping to get more reps trains a different skill and hides the strength you were trying to build' },
      { level: 6, nama: 'Pull-up, volume', fase: 3, target: '3 x 10', buka: '3 x 10, then add load instead of reps', cue: 'Past 3 x 10, add weight rather than repetitions' },
      { level: 7, nama: 'Weighted pull-up', fase: 3, target: '3 x 5 at +10 kg', buka: '3 x 5 at 20% bodyweight', cue: 'Add weight in small steps; the elbows adapt slower than the back' },
      { level: 8, nama: 'Archer pull-up', fase: 3, target: '3 x 4 each side', buka: '3 x 6 each side', cue: 'One arm pulls, the other slides out straight' },
      { level: 9, nama: 'Explosive pull-up to sternum', fase: 3, target: '3 x 3', buka: 'Pull to sternum height consistently', cue: 'This is the missing piece of the muscle-up; height, not effort' },
      { level: 10, nama: 'Muscle-up', fase: 4, target: '3 x 2', buka: '3 x 5 strict, no kip', cue: 'False grip and a fast transition; practise the transition on low rings first' },
      { level: 11, nama: 'One-arm pull-up progression', fase: 4, target: '3 x 3 each side with band or towel assist', buka: '—', cue: 'Years, not months — and elbow health decides the pace' },
    ],
  },
  {
    id: 'squat',
    pola: 'Squat',
    nama: 'Squat line',
    otot: 'Quadriceps, gluteus maximus, adductors, spinal erectors',
    anak: [
      { level: 1, nama: 'Box squat / sit-to-stand', fase: 1, target: '3 x 12', buka: '3 x 15 without using the hands', cue: 'Sit back to a chair and stand without pushing off with the arms' },
      { level: 2, nama: 'Bodyweight squat', fase: 1, target: '3 x 15', buka: '3 x 20 to full depth', cue: 'Hips below knees if your ankles allow; heels stay down' },
      { level: 3, nama: 'Tempo squat, 3 seconds down', fase: 1, target: '3 x 12', buka: '3 x 15 at a 3-second descent', cue: 'Slowing the descent multiplies the work without adding load' },
      { level: 4, nama: 'Split squat', fase: 2, target: '3 x 10 each side', buka: '3 x 12 each side', cue: 'Front shin close to vertical; the rear knee travels straight down' },
      { level: 5, nama: 'Bulgarian split squat', fase: 2, target: '3 x 8 each side', buka: '3 x 12 each side', cue: 'Rear foot elevated; this loads one leg with almost bodyweight and is the fastest leg builder here' },
      { level: 6, nama: 'Assisted pistol squat', fase: 2, target: '3 x 5 each side', buka: '3 x 8 each side with one finger of support', cue: 'Hold a doorframe and reduce the help each week' },
      { level: 7, nama: 'Box pistol squat', fase: 3, target: '3 x 5 each side', buka: 'Lower the box height progressively', cue: 'Sit to a box, stand on one leg; drop the box height over weeks' },
      { level: 8, nama: 'Full pistol squat', fase: 3, target: '3 per side', buka: '3 x 5 each side', cue: 'Free leg straight ahead; ankle mobility usually limits this before strength does' },
      { level: 9, nama: 'Weighted pistol squat', fase: 4, target: '3 x 5 each side holding a dumbbell', buka: '—', cue: 'Holding a weight in front acts as a counterbalance and often makes it easier at first' },
      { level: 10, nama: 'Shrimp squat', fase: 4, target: '3 x 5 each side', buka: '—', cue: 'A different demand from the pistol: more quadriceps, less ankle mobility' },
    ],
  },
  {
    id: 'hinge',
    pola: 'Hinge & single leg',
    nama: 'Posterior chain line',
    otot: 'Hamstrings, gluteus maximus and medius, spinal erectors, calves',
    anak: [
      { level: 1, nama: 'Glute bridge', fase: 1, target: '3 x 15', buka: '3 x 20 with a 2-second squeeze at the top', cue: 'Drive through the heels; ribs stay down so the back does not arch' },
      { level: 2, nama: 'Single-leg glute bridge', fase: 1, target: '3 x 10 each side', buka: '3 x 12 each side', cue: 'Hips stay level — the side that drops is the side that is weak' },
      { level: 3, nama: 'Romanian deadlift, dumbbells', fase: 2, target: '3 x 12', buka: '3 x 12 with a clear hamstring stretch', cue: 'Push the hips back, do not bend the back; the bar path stays close to the legs' },
      { level: 4, nama: 'Single-leg Romanian deadlift', fase: 2, target: '3 x 10 each side', buka: '3 x 12 each side', cue: 'Hips square to the floor; this is a balance exercise as much as a strength one' },
      { level: 5, nama: 'Hip thrust, shoulders on bench', fase: 2, target: '3 x 12', buka: '3 x 12 with added load', cue: 'Chin tucked, ribs down, full lockout at the top' },
      { level: 6, nama: 'Nordic curl, assisted', fase: 3, target: '3 x 5 with a 4-second lowering', buka: 'Control a 4-second lowering for 3 x 6', cue: 'The single best hamstring-injury preventer there is — and brutally hard at first' },
      { level: 7, nama: 'Nordic curl, full', fase: 4, target: '3 x 5', buka: '—', cue: 'Lower under control the whole way, push back up with the hands only if needed' },
      { level: 8, nama: 'Standing calf raise, single leg', fase: 1, target: '3 x 15 each side', buka: '3 x 20 each side', cue: 'Full range: all the way down, all the way up, one second at the top' },
      { level: 9, nama: 'Seated calf raise', fase: 2, target: '3 x 15', buka: '3 x 20 with load', cue: 'Bent knee shifts the work to the soleus, which the standing version misses' },
    ],
  },
  {
    id: 'core-anti',
    pola: 'Core anti-extension',
    nama: 'Bracing line',
    otot: 'Rectus abdominis, transversus abdominis, obliques',
    anak: [
      { level: 1, nama: 'Dead bug', fase: 1, target: '3 x 8 each side', buka: 'The lower back stays on the floor throughout', cue: 'The lower back must NOT lift off the floor — that is a requirement, not a suggestion' },
      { level: 2, nama: 'Plank', fase: 1, target: '3 x 30 seconds', buka: '3 x 45 seconds without the hips dropping', cue: 'Hips level with the shoulders; squeeze the glutes so the pelvis does not tip' },
      { level: 3, nama: 'Side plank', fase: 1, target: '3 x 20 seconds each side', buka: '3 x 40 seconds each side', cue: 'Push the bottom shoulder away from the ear; hips stacked' },
      { level: 4, nama: 'Hollow body hold', fase: 2, target: '3 x 20 seconds', buka: '45 seconds unbroken', cue: 'Lower back pressed flat; if it lifts, bend the knees until it does not', keliru: 'An arched lower back turns this into a hip-flexor hold and trains the opposite of what you want' },
      { level: 5, nama: 'Hollow body rock', fase: 2, target: '3 x 20 seconds', buka: '3 x 30 seconds', cue: 'Rock from the whole body, not from the shoulders' },
      { level: 6, nama: 'Ab wheel from knees', fase: 3, target: '3 x 8', buka: '3 x 12 to full extension', cue: 'Ribs down and glutes squeezed; the moment the back arches, you have gone too far' },
      { level: 7, nama: 'Ab wheel from standing', fase: 4, target: '3 x 5', buka: '—', cue: 'A long build from the kneeling version; do not rush it' },
      { level: 8, nama: 'Dragon flag, tuck', fase: 3, target: '3 x 6', buka: '3 x 8 with legs straighter', cue: 'Only the shoulders stay on the bench; the whole body moves as one plank' },
      { level: 9, nama: 'Dragon flag, full', fase: 4, target: '3 x 5', buka: '—', cue: 'Lower slowly; the negative is where the strength comes from' },
    ],
  },
  {
    id: 'core-compress',
    pola: 'Core compression',
    nama: 'Compression and hip flexor line',
    otot: 'Hip flexors, lower rectus abdominis, obliques',
    anak: [
      { level: 1, nama: 'Lying knee raise', fase: 1, target: '3 x 12', buka: '3 x 15 with the back flat', cue: 'Curl the pelvis, do not just fold at the hip' },
      { level: 2, nama: 'Lying leg raise', fase: 1, target: '3 x 10', buka: '3 x 15', cue: 'Hands under the hips at first if the back lifts' },
      { level: 3, nama: 'Hanging knee raise', fase: 2, target: '3 x 10', buka: '3 x 12 without swinging', cue: 'Lift by curling the pelvis upward, not by flexing the hip alone' },
      { level: 4, nama: 'Hanging leg raise', fase: 2, target: '3 x 8', buka: '3 x 12 to horizontal', cue: 'Stop the swing completely between reps' },
      { level: 5, nama: 'Toes to bar', fase: 3, target: '3 x 6', buka: '3 x 10', cue: 'Actively pull down on the bar as the legs come up' },
      { level: 6, nama: 'Tuck L-sit on parallettes', fase: 2, target: '3 x 15 seconds', buka: '3 x 25 seconds', cue: 'Push the floor away — depress the shoulders, do not sink into them' },
      { level: 7, nama: 'One-leg L-sit', fase: 3, target: '3 x 15 seconds each side', buka: '3 x 20 seconds each side', cue: 'The extended leg stays locked and level with the hip' },
      { level: 8, nama: 'Full L-sit', fase: 3, target: '3 x 10 seconds', buka: '20 seconds unbroken', cue: 'Hamstring flexibility limits this at least as much as strength' },
      { level: 9, nama: 'V-sit', fase: 4, target: '3 x 5 seconds', buka: '—', cue: 'Legs above horizontal; requires both compression strength and hamstring length' },
    ],
  },
  {
    id: 'leher',
    pola: 'Neck & upper back',
    nama: 'Neck, trapezius and posture line',
    otot: 'Sternocleidomastoid, upper and lower trapezius, deep neck flexors, rhomboids',
    anak: [
      { level: 1, nama: 'Chin tuck', fase: 1, target: '3 x 10 with a 5-second hold', buka: '3 x 10 x 10 seconds', cue: 'Draw the chin straight back, not down; this trains the deep neck flexors that hold the head over the shoulders' },
      { level: 2, nama: 'Isometric neck press, four directions', fase: 1, target: '3 x 10 seconds each direction', buka: '3 x 20 seconds each direction', cue: 'Press the head into your own palm — front, back, and each side. No movement at all, only tension' },
      { level: 3, nama: 'Band pull-apart', fase: 1, target: '3 x 15', buka: '3 x 20 with a stronger band', cue: 'Squeeze the shoulder blades together at the end; this is the direct counter to a rounded desk posture' },
      { level: 4, nama: 'Prone Y-T-W raise', fase: 1, target: '3 x 8 of each letter', buka: '3 x 12 of each', cue: 'The Y position is the lower trapezius, and it is the muscle almost everyone is missing' },
      { level: 5, nama: 'Neck flexion with light plate', fase: 2, target: '3 x 12', buka: '3 x 15', cue: 'Lie face up off a bench, curl the chin to the chest. Start with NO weight — the neck is not a place to be brave', keliru: 'Loading the neck too fast is one of the few calisthenics mistakes that can cause lasting damage. Add weight in the smallest increments you can find' },
      { level: 6, nama: 'Neck extension with light plate', fase: 2, target: '3 x 12', buka: '3 x 15', cue: 'Face down, controlled through a comfortable range only' },
      { level: 7, nama: 'Lateral neck raise', fase: 2, target: '3 x 12 each side', buka: '3 x 15 each side', cue: 'This is where the sternocleidomastoid is trained directly, and it is what visibly changes the look of the neck' },
      { level: 8, nama: 'Shrug, dumbbell', fase: 2, target: '3 x 12', buka: '3 x 15 with heavier load', cue: 'Straight up and down with a pause at the top; no rolling' },
      { level: 9, nama: 'Wrestler bridge, assisted', fase: 4, target: '3 x 20 seconds with hands supporting', buka: '—', cue: 'Advanced and genuinely risky — only after months of the loaded work above, and never as a starting point' },
    ],
  },
  {
    id: 'handstand',
    pola: 'Skill — handstand',
    nama: 'Handstand line',
    otot: 'Shoulders, serratus anterior, whole-body tension, wrists',
    anak: [
      { level: 1, nama: 'Wrist preparation', fase: 1, target: '2-3 minutes before every session', buka: 'Comfortable in a full wrist extension', cue: 'Wrists carry everything here and adapt slowest; this is not optional' },
      { level: 2, nama: 'Plank to downward dog', fase: 1, target: '3 x 10', buka: '3 x 12', cue: 'Push the floor away hard at the top' },
      { level: 3, nama: 'Wall walk (back to wall)', fase: 2, target: '3 x 5 walks', buka: 'Walk in until the chest touches the wall', cue: 'Walk the feet up and the hands in; stop where you can still come down safely' },
      { level: 4, nama: 'Chest-to-wall handstand', fase: 2, target: '3 x 30 seconds', buka: '60 seconds unbroken', cue: 'Chest to wall teaches a straight line; back to wall teaches an arch you will have to unlearn' },
      { level: 5, nama: 'Heel pulls from the wall', fase: 3, target: '3 x 8', buka: 'Hold 3 seconds off the wall', cue: 'Pull one heel off, then the other; find the balance point with the fingers' },
      { level: 6, nama: 'Freestanding handstand', fase: 3, target: '3 x 10 seconds', buka: '30 seconds', cue: 'Balance is corrected by the FINGERS pressing into the floor, not by the hips' },
      { level: 7, nama: 'Handstand, 60 seconds', fase: 4, target: '60 seconds', buka: '—', cue: 'At this point it becomes a rest position rather than a feat' },
      { level: 8, nama: 'Press to handstand', fase: 4, target: '3 x 3', buka: '—', cue: 'Compression strength from the L-sit line is the prerequisite, not shoulder strength' },
    ],
  },
  {
    id: 'lever',
    pola: 'Skill — lever',
    nama: 'Front and back lever line',
    otot: 'Latissimus dorsi, lower trapezius, straight-arm scapular strength, whole core',
    anak: [
      { level: 1, nama: 'Straight-arm scapular pull, hanging', fase: 2, target: '3 x 10', buka: '3 x 12 with a 2-second hold', cue: 'Straight-arm strength is a separate quality from bent-arm strength and has to be built on its own' },
      { level: 2, nama: 'Skin the cat', fase: 3, target: '3 x 5', buka: '3 x 8 under control', cue: 'Go only as far as you can come back from; this builds shoulder tolerance for every lever' },
      { level: 3, nama: 'German hang', fase: 3, target: '3 x 20 seconds', buka: '3 x 30 seconds', cue: 'The bottom position of skin the cat, held — this is the back lever prerequisite' },
      { level: 4, nama: 'Tuck back lever', fase: 3, target: '3 x 15 seconds', buka: '3 x 20 seconds', cue: 'Arms locked straight throughout; bent arms make it a different exercise' },
      { level: 5, nama: 'Advanced tuck back lever', fase: 3, target: '3 x 15 seconds', buka: '3 x 20 seconds', cue: 'Open the hips to 90 degrees; the back stays flat' },
      { level: 6, nama: 'Straddle back lever', fase: 4, target: '3 x 10 seconds', buka: '3 x 15 seconds', cue: 'The wider the straddle, the easier — narrow it over months' },
      { level: 7, nama: 'Tuck front lever', fase: 3, target: '3 x 10 seconds', buka: '3 x 15 seconds', cue: 'Pull the bar toward the hips with straight arms; the lats do the work, not the abs alone' },
      { level: 8, nama: 'Advanced tuck front lever', fase: 4, target: '3 x 10 seconds', buka: '3 x 15 seconds', cue: 'Hips open to 90 degrees, back flat, shoulders depressed' },
      { level: 9, nama: 'Straddle front lever', fase: 4, target: '3 x 8 seconds', buka: '3 x 12 seconds', cue: 'Legs wide reduces the lever arm; narrow them as it becomes easy' },
      { level: 10, nama: 'Full front lever', fase: 4, target: '5 seconds', buka: '—', cue: 'Body in one horizontal line, arms straight; among the hardest static holds in calisthenics' },
    ],
  },
  {
    id: 'planche',
    pola: 'Skill — planche',
    nama: 'Planche line',
    otot: 'Anterior deltoid, biceps tendon, serratus anterior, wrists, whole core',
    anak: [
      { level: 1, nama: 'Plank lean', fase: 2, target: '3 x 20 seconds', buka: '3 x 30 seconds with shoulders past the hands', cue: 'From a plank, lean the shoulders forward past the hands. This alone builds most early planche strength' },
      { level: 2, nama: 'Frog stand', fase: 2, target: '3 x 20 seconds', buka: '3 x 30 seconds', cue: 'Knees resting on the elbows; a balance drill more than a strength one' },
      { level: 3, nama: 'Tuck planche', fase: 3, target: '3 x 10 seconds', buka: '3 x 15 seconds', cue: 'Knees off the elbows, shoulders protracted and pushed forward — this is the real first step' },
      { level: 4, nama: 'Advanced tuck planche', fase: 4, target: '3 x 10 seconds', buka: '3 x 15 seconds', cue: 'Back flat and hips open to 90 degrees; a rounded back makes it look easier than it is' },
      { level: 5, nama: 'Straddle planche', fase: 4, target: '3 x 5 seconds', buka: '3 x 10 seconds', cue: 'Elbows must stay locked; bent elbows are the commonest way this is faked' },
      { level: 6, nama: 'Full planche', fase: 4, target: '5 seconds', buka: '—', cue: 'Years of straight-arm work. The wrists and biceps tendons decide the pace, not the shoulders' },
    ],
  },
]

/** Semua gerakan dalam satu larik datar — dipakai pencarian dan penghitungan. */
export const SEMUA_GERAKAN = TANGGA.flatMap((t) =>
  t.anak.map((a) => ({ ...a, tanggaId: t.id, tangga: t.nama, pola: t.pola })),
)

export const JUMLAH_GERAKAN = SEMUA_GERAKAN.length

/**
 * Aturan yang berlaku di seluruh fase, dan yang paling sering dilanggar.
 */
export const ATURAN: { judul: string; isi: string }[] = [
  {
    judul: 'Add one thing at a time',
    isi: 'Reps, sets, range, tempo, and load are five separate knobs. Turning two at once means that when something hurts you will not know which one caused it.',
  },
  {
    judul: 'Stop two or three reps short',
    isi: 'Training to failure on every set costs far more recovery than it adds in progress. On skill work, stop the moment form breaks — a repetition with broken form teaches broken form.',
  },
  {
    judul: 'Tendons lag behind muscle',
    isi: 'Muscle adapts in weeks, tendon and ligament in months. Almost every calisthenics elbow and shoulder injury is a person whose strength outran their connective tissue. This is the single reason the ladder has so many steps.',
  },
  {
    judul: 'Skill work goes first, while you are fresh',
    isi: 'Handstands, levers, and planche work are nervous-system work. Doing them after your strength sets means practising them tired, which teaches the wrong pattern.',
  },
  {
    judul: 'Deload every fourth week',
    isi: 'Cut volume roughly in half, keep the intensity. From phase 3 onward this is part of the programme rather than a break from it — and it is usually when the next step suddenly becomes possible.',
  },
  {
    judul: 'Protein and sleep decide the result',
    isi: 'Around 1.6-2.2 g of protein per kilogram of bodyweight, and seven to nine hours of sleep. Training is the stimulus; neither of these is optional if you expect the stimulus to turn into muscle.',
  },
]
