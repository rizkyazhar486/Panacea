// ─────────────────────────────────────────────────────────────────────────────
// Lari, sepeda, dan renang — zona intensitas, kerja kecepatan, dan postur.
//
// Kenapa ketiganya diletakkan dalam satu modul: intensitas latihan pada ketiga
// cabang ini diatur oleh satu prinsip yang sama — ambang laktat — namun
// SATUANNYA BERBEDA, dan itulah sumber kebingungan yang paling sering.
// Lari diukur dengan pace, sepeda dengan daya (watt), renang dengan waktu per
// 100 meter. Menyamakan "zona 3" antar cabang tanpa mengukur ulang ambangnya
// masing-masing menghasilkan latihan yang salah intensitas.
//
// Sisi postur ketiganya juga berlawanan, dan ini jarang dijelaskan:
//   • RENANG adalah satu-satunya yang secara langsung MEMPERBAIKI postur —
//     gerakannya menarik lengan ke belakang, membuka dada, dan menguatkan
//     punggung atas.
//   • SEPEDA adalah yang paling MERUSAK postur bila tanpa penyesuaian —
//     berjam-jam dalam posisi punggung membungkuk dengan leher mendongak
//     memperkuat persis pola yang ingin diperbaiki.
//   • LARI bersifat netral; pengaruhnya bergantung pada posisi badan dan
//     kecepatan langkah.
//
// Seluruh perhitungan berjalan offline.
// ─────────────────────────────────────────────────────────────────────────────

export type Sport = 'lari' | 'sepeda' | 'renang'

export interface SportProfile {
  key: Sport
  nama: string
  emoji: string
  /** Satuan yang dipakai untuk mengatur intensitas pada cabang ini. */
  satuan: string
  /** Cara mengukur ambang pada cabang ini. */
  tesAmbang: string
  bebanSendi: string
  /** Pengaruhnya terhadap postur — inilah yang paling berbeda antar cabang. */
  postur: string
  posturArah: 'memperbaiki' | 'merusak' | 'netral'
  cederaKhas: string
}

export const SPORTS: SportProfile[] = [
  {
    key: 'lari',
    nama: 'Lari',
    emoji: '🏃',
    satuan: 'Pace (minutes per km)',
    tesAmbang: 'Run 5 km or 10 km as hard as you can; the average pace becomes your reference',
    bebanSendi:
      'The highest of the three — each stride puts an impact load of roughly 2–3 times bodyweight through the knee and ankle. This is why distance must be built gradually even when your heart feels ready for more.',
    postur:
      'Neutral. The effect depends on how you run: a slight lean forward from the ankles (not bending at the waist), eyes ahead rather than down, shoulders relaxed and not creeping toward the ears, and a cadence around 170–180 per minute. Running with your head down watching a watch face actively reinforces forward-head posture.',
    posturArah: 'netral',
    cederaKhas: 'Anterior knee pain (patellofemoral), iliotibial band syndrome, plantar fasciitis, and bone stress injuries from overload',
  },
  {
    key: 'sepeda',
    nama: 'Sepeda',
    emoji: '🚴',
    satuan: 'Power (watts) or heart rate',
    tesAmbang:
      'A 20-minute all-out test; FTP is estimated as 95% of the average power over those 20 minutes',
    bebanSendi:
      'The lowest, because there is no impact — a good option when the knee or ankle is troublesome, and it allows far greater training volume without damaging joints.',
    postur:
      'THE MOST LIKELY TO DAMAGE POSTURE if the bike is not set up properly. Cycling holds the upper back rounded while the neck extends to look ahead, for hours — exactly the pattern someone who works hunched over already has, so it reinforces rather than corrects it. Cycling therefore MUST be paired with pulling work, chest stretching, and a correct bike fit.',
    posturArah: 'merusak',
    cederaKhas: 'Neck and upper-back pain, anterior knee pain from a saddle set too low, and numbness in the hands and groin from pressure',
  },
  {
    key: 'renang',
    nama: 'Renang',
    emoji: '🏊',
    satuan: 'Time per 100 metres',
    tesAmbang:
      'All-out 400 m and 200 m tests; the difference in times gives Critical Swim Speed as an estimate of threshold',
    bebanSendi:
      'Almost none, because the water supports the body — the only one of the three you can do nearly every day without loading joints, and the first choice with a leg injury or excess weight.',
    postur:
      'THE ONLY ONE THAT DIRECTLY IMPROVES POSTURE. Freestyle and backstroke pull the arm backwards against water resistance, strengthening the latissimus dorsi, rhomboids and lower trapezius — the very muscles weakened by sitting and standing hunched. The stroke also stretches the chest and trains rotation through a thoracic spine that is usually stiff.',
    posturArah: 'memperbaiki',
    cederaKhas: 'Shoulder pain (swimmer’s shoulder) from excess volume and poor technique, especially when the hand crosses the body’s midline on entry',
  },
]

// ─── Sepeda: zona daya berbasis FTP ─────────────────────────────────────────

export interface PowerZone {
  n: number
  nama: string
  pctLo: number
  pctHi: number | null
  tujuan: string
  durasi: string
  rasa: string
}

/** Zona daya klasik (kerangka Coggan), dinyatakan sebagai persen dari FTP. */
export const POWER_ZONES: PowerZone[] = [
  { n: 1, nama: 'Pemulihan aktif', pctLo: 0, pctHi: 55, tujuan: 'Speeds recovery without adding fatigue', durasi: '30–60 minutes', rasa: 'Very easy — you can hold a conversation throughout' },
  { n: 2, nama: 'Endurance', pctLo: 56, pctHi: 75, tujuan: 'Builds the aerobic base and fat-burning capacity', durasi: '1-5 jam', rasa: 'Easy — you can still speak in full sentences' },
  { n: 3, nama: 'Tempo', pctLo: 76, pctHi: 90, tujuan: 'Menaikkan efisiensi aerobik', durasi: '20–60 minutes', rasa: 'Moderate — speech starts breaking up' },
  { n: 4, nama: 'Ambang laktat', pctLo: 91, pctHi: 105, tujuan: 'Menaikkan ambang laktat — penentu terbesar performa', durasi: '8–30 minute blocks', rasa: 'Hard but controlled — 3–5 words at a time' },
  { n: 5, nama: 'VO₂max', pctLo: 106, pctHi: 120, tujuan: 'Menaikkan kapasitas aerobik maksimal', durasi: '3–8 minute blocks', rasa: 'Very hard — one or two words only' },
  { n: 6, nama: 'Anaerobik', pctLo: 121, pctHi: 150, tujuan: 'Anaerobic capacity and lactate tolerance', durasi: 'Blocks of 30 seconds to 3 minutes', rasa: 'Very hard — you cannot speak' },
  { n: 7, nama: 'Neuromuskular', pctLo: 151, pctHi: null, tujuan: 'Peak speed and fast-twitch fibre recruitment', durasi: '5–15 second sprints', rasa: 'Maksimal' },
]

/** FTP diperkirakan sebesar 95% dari daya rata-rata pada tes 20 menit. */
export function ftpFrom20Min(avgWatt: number): number | null {
  if (!(avgWatt > 0)) return null
  return Math.round(avgWatt * 0.95)
}

export function powerRange(ftp: number, z: PowerZone): [number, number | null] {
  return [Math.round((ftp * z.pctLo) / 100), z.pctHi == null ? null : Math.round((ftp * z.pctHi) / 100)]
}

/** Rasio daya terhadap berat badan — penentu utama performa saat menanjak. */
export function wattPerKg(ftp: number, beratKg: number): number | null {
  if (!(ftp > 0) || !(beratKg > 0)) return null
  return +(ftp / beratKg).toFixed(2)
}

export const WKG_BANDS: { min: number; label: string }[] = [
  { min: 5.0, label: 'Equivalent to a high-level competitive cyclist' },
  { min: 4.0, label: 'Very good — equivalent to a strong amateur racer' },
  { min: 3.0, label: 'Good — above the average regular recreational cyclist' },
  { min: 2.0, label: 'Intermediate — the aerobic base is in place' },
  { min: 0, label: 'Beginner — build zone 2 volume first' },
]

export function wkgBand(v: number): string {
  return (WKG_BANDS.find((b) => v >= b.min) ?? WKG_BANDS[WKG_BANDS.length - 1]).label
}

// ─── Renang: Critical Swim Speed ────────────────────────────────────────────

export interface SwimZone {
  nama: string
  offset: [number, number]
  tujuan: string
  contoh: string
}

/**
 * Zona renang dinyatakan sebagai selisih detik per 100 m terhadap CSS.
 * Nilai positif berarti LEBIH LAMBAT daripada CSS.
 */
export const SWIM_ZONES: SwimZone[] = [
  { nama: 'Aerobik ringan', offset: [6, 10], tujuan: 'Aerobic base and technique work', contoh: '8–10 × 100 m, 20 seconds rest' },
  { nama: 'Aerobik', offset: [3, 6], tujuan: 'Daya tahan aerobik', contoh: '5–6 × 200 m, 20 seconds rest' },
  { nama: 'Ambang', offset: [-1, 2], tujuan: 'Menaikkan ambang laktat', contoh: '10–16 × 100 m, 15 seconds rest' },
  { nama: 'VO₂max', offset: [-5, -2], tujuan: 'Kapasitas aerobik maksimal', contoh: '8–12 × 50 m, 20 seconds rest' },
  { nama: 'Kecepatan', offset: [-12, -6], tujuan: 'Peak speed and technique at speed', contoh: '10-16 × 25 m, jeda penuh' },
]

export interface CssResult {
  /** Meter per detik. */
  css: number
  /** Detik per 100 m. */
  cssPer100: number
}

/** CSS = (400 - 200) / (waktu400 - waktu200), dalam meter per detik. */
export function criticalSwimSpeed(t400sec: number, t200sec: number): CssResult | null {
  const d = t400sec - t200sec
  if (!(d > 0) || !(t400sec > 0) || !(t200sec > 0)) return null
  const css = 200 / d
  if (!Number.isFinite(css) || css <= 0) return null
  return { css: +css.toFixed(3), cssPer100: 100 / css }
}

// ─── Kerja kecepatan lintas cabang ──────────────────────────────────────────

export interface SpeedWork {
  sport: Sport
  nama: string
  isi: string
  kapan: string
  kenapa: string
}

export const SPEED_WORK: SpeedWork[] = [
  {
    sport: 'lari',
    nama: 'Strides',
    isi: '6–8 × 20 seconds at near-maximum speed, walking until fully recovered',
    kapan: 'Twice a week, at the end of an easy run',
    kenapa:
      'Trains fast-twitch recruitment and improves stride coordination without adding meaningful fatigue. Because recovery is complete between efforts, this trains SPEED rather than endurance — which is exactly why the rest must not be shortened.',
  },
  {
    sport: 'lari',
    nama: 'Hill sprints',
    isi: '6–10 × 8–12 seconds up a steep hill, walking down to recover',
    kapan: 'Once a week',
    kenapa:
      'The gradient caps your speed so impact load drops, while muscle recruitment stays maximal. It is the safest way to add running strength without the injury risk of flat-ground sprinting.',
  },
  {
    sport: 'sepeda',
    nama: 'Sprint neuromuskular',
    isi: '6–10 × 10–15 seconds all-out from low speed, 3–5 minutes rest',
    kapan: 'Once a week',
    kenapa:
      'Trains peak power and fast-twitch recruitment. The long rest is mandatory — shortening it turns the session into anaerobic work and removes its purpose entirely.',
  },
  {
    sport: 'sepeda',
    nama: 'Cadence drill',
    isi: '5 × 1 minute at 110–120 rpm in an easy gear, 2 minutes rest',
    kapan: 'One to two times a week, between easy sessions',
    kenapa:
      'An efficient cadence reduces load on the knee and improves coordination. Many new cyclists push too big a gear too slowly, which loads the joint without adding fitness.',
  },
  {
    sport: 'renang',
    nama: 'Sprint 25 m',
    isi: '10–16 × 25 m all-out, full rest until breathing recovers',
    kapan: 'One to two times a week',
    kenapa:
      'In swimming, speed is decided more by technique than by strength. Short sprints with full recovery let technique hold at high speed — the moment technique breaks from fatigue, the session stops training speed.',
  },
  {
    sport: 'renang',
    nama: 'Technique drills',
    isi: 'Catch-up, single-arm, fingertip drag, and sculling — 4 × 50 m of each',
    kapan: 'Every session, during the warm-up',
    kenapa:
      'For a beginner swimmer, improving technique adds far more speed than improving fitness does, because most of the effort is lost to drag rather than to a lack of power.',
  },
]

// ─── Penyetelan sepeda dan postur ───────────────────────────────────────────

export interface FitPoint {
  bagian: string
  patokan: string
  bilaSalah: string
}

export const BIKE_FIT: FitPoint[] = [
  {
    bagian: 'Tinggi sadel',
    patokan: 'A slight knee bend of about 25–35 degrees at the bottom of the stroke; hips should not rock as you pedal',
    bilaSalah: 'Too low causes pain at the FRONT of the knee; too high causes pain BEHIND the knee and rocking hips',
  },
  {
    bagian: 'Maju-mundur sadel',
    patokan: 'With the cranks level, the kneecap sits directly over the pedal axle',
    bilaSalah: 'Too far forward loads the knee; too far back loads the back and the hamstring tendons',
  },
  {
    bagian: 'Jangkauan setang',
    patokan: 'A slight elbow bend, relaxed shoulders, and a back that is not overstretched',
    bilaSalah: 'Too far forward forces excessive neck extension, and is the most common cause of neck pain in cyclists',
  },
  {
    bagian: 'Saddle-to-bar height difference',
    patokan: 'Beginners should start with the bars higher and lower them gradually as flexibility improves',
    bilaSalah: 'Bars set too low from the start force excessive rounding of the back and worsen an already poor posture pattern',
  },
  {
    bagian: 'Kecepatan mengayuh',
    patokan: '80–95 rpm on an ordinary ride',
    bilaSalah: 'Pushing too big a gear too slowly loads the knee and holds back aerobic development',
  },
]

/** Latihan penyeimbang wajib bagi orang yang banyak bersepeda. */
export const CYCLING_COUNTER: { nama: string; dosis: string; kenapa: string }[] = [
  { nama: 'Doorway chest stretch', dosis: '3 × 30 seconds after riding', kenapa: 'Counters the chest shortening caused by hours in a rounded position' },
  { nama: 'Face pulls or band rows', dosis: '3 × 15, three times a week', kenapa: 'Strengthens the lower trapezius and rhomboids, which are passively stretched but never trained while cycling' },
  { nama: 'Hip flexor stretch', dosis: '3 × 30 seconds each side', kenapa: 'A continuously flexed hip shortens this muscle and tips the pelvis forward when you stand' },
  { nama: 'Thoracic spine rotation', dosis: '2 × 10 each side', kenapa: 'Restores upper-back movement lost to a fixed rounded position' },
  { nama: 'Chin tuck', dosis: '3 × 10, holding 5 seconds', kenapa: 'Counters the extended neck and forward head that the riding position forces' },
]

// ─── Susunan mingguan gabungan ──────────────────────────────────────────────

export interface Session {
  hari: string
  sport: Sport | 'kekuatan' | 'pulih'
  isi: string
  fokus: string
}

export type Goal = 'kecepatan' | 'kebugaran' | 'postur'

/**
 * Susunan mingguan berbeda menurut tujuan. Perbedaannya bukan pada jenis
 * olahraganya melainkan pada PORSI dan INTENSITASNYA — dan pada tujuan postur,
 * porsi renang serta latihan tarik sengaja diperbesar sementara sepeda dibatasi.
 */
export function weeklyMultiSport(goal: Goal): Session[] {
  if (goal === 'kecepatan') {
    return [
      { hari: 'Senin', sport: 'renang', isi: 'Technique + threshold: 10 × 100 m at CSS pace', fokus: 'Ambang laktat' },
      { hari: 'Selasa', sport: 'lari', isi: 'Intervals: 5 × 1000 m at interval pace', fokus: 'VO₂max' },
      { hari: 'Rabu', sport: 'sepeda', isi: 'Zone 2 for 60–90 minutes + 5 neuromuscular sprints', fokus: 'Basis + kecepatan' },
      { hari: 'Kamis', sport: 'kekuatan', isi: 'Lifting and pulling work + the posture programme', fokus: 'Kekuatan' },
      { hari: 'Jumat', sport: 'lari', isi: '25-minute tempo + 6 strides', fokus: 'Ambang laktat' },
      { hari: 'Sabtu', sport: 'sepeda', isi: 'Threshold blocks: 3 × 12 minutes in zone 4', fokus: 'FTP' },
      { hari: 'Minggu', sport: 'pulih', isi: 'Easy swim or a gentle walk', fokus: 'Pemulihan' },
    ]
  }
  if (goal === 'postur') {
    return [
      { hari: 'Senin', sport: 'renang', isi: 'Freestyle and backstroke, 1,500–2,000 m, plenty of drills', fokus: 'Opens the chest, strengthens the upper back' },
      { hari: 'Selasa', sport: 'kekuatan', isi: 'Pull-up progresi, row, face pull, prone Y-T-W', fokus: 'The scapular retractors' },
      { hari: 'Rabu', sport: 'lari', isi: 'Easy run 30–40 minutes, eyes ahead, cadence 170–180', fokus: 'Aerobik' },
      { hari: 'Kamis', sport: 'renang', isi: 'Extra backstroke, 1,500 m', fokus: 'Thoracic rotation, external shoulder rotators' },
      { hari: 'Jumat', sport: 'kekuatan', isi: 'Pulling work + chest and hip flexor stretching', fokus: 'Pasangan regang-kuat' },
      { hari: 'Sabtu', sport: 'sepeda', isi: 'Zone 2, 60 minutes maximum, and MUST be followed by chest stretching and face pulls', fokus: 'Aerobic work with its counterweight' },
      { hari: 'Minggu', sport: 'pulih', isi: 'A gentle walk and mobility work', fokus: 'Pemulihan' },
    ]
  }
  return [
    { hari: 'Senin', sport: 'renang', isi: 'Aerobik 1500 m campuran gaya', fokus: 'Aerobic work with no joint load' },
    { hari: 'Selasa', sport: 'lari', isi: 'Easy run, 30–40 minutes', fokus: 'Basis aerobik' },
    { hari: 'Rabu', sport: 'kekuatan', isi: 'Full-body training + the posture programme', fokus: 'Strength and muscle mass' },
    { hari: 'Kamis', sport: 'sepeda', isi: 'Zone 2 for 60 minutes', fokus: 'Basis aerobik' },
    { hari: 'Jumat', sport: 'pulih', isi: 'A gentle walk or an easy swim', fokus: 'Pemulihan' },
    { hari: 'Sabtu', sport: 'lari', isi: 'Long run, 60–75 minutes', fokus: 'Daya tahan' },
    { hari: 'Minggu', sport: 'pulih', isi: 'Istirahat', fokus: 'Pemulihan' },
  ]
}

export const CROSS_RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Threshold has to be measured separately for each sport',
    isi: 'Threshold heart rate in swimming usually runs 10–15 beats lower than in running, because the horizontal position and cool water change how the heart works. Using running zones for swimming produces the wrong intensity in nearly every session.',
  },
  {
    judul: 'Aerobic fitness transfers between sports; tissue tolerance does not',
    isi: 'A heart and lungs trained by cycling still help when you run, but the muscles and tendons of the leg are not thereby ready for impact. This is why a fit cyclist still gets injured going straight into a long run.',
  },
  {
    judul: 'Swimming and cycling allow volume that running cannot',
    isi: 'Because both are almost impact-free, they can add aerobic volume once running has reached the limit your joints tolerate — the single most useful way to raise fitness without raising injury risk.',
  },
  {
    judul: 'Cycling needs a counterweight; swimming does not',
    isi: 'Swimming strengthens the back muscles that a hunched posture weakens, while cycling reinforces the hunch itself. Every long ride is therefore best followed by chest stretching and pulling work; swimming needs neither.',
  },
  {
    judul: 'Strength training is not optional',
    isi: 'Lifting twice a week lowers injury risk in all three sports and improves movement efficiency. For anyone correcting their posture, pulling work is the part that matters most, and no amount of aerobic exercise replaces it.',
  },
]
