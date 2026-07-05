import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity, IconRun, IconHeart, IconChartUp, IconTimer } from '../components/icons'
import { getDemo, setDemo, hasHealth, pushBiometrics } from '../lib/profile'
import { PrefillBadge } from '../components/HealthSnapshot'

// ─────────────────────────────────────────────────────────────────────────────
// AI Training Planner — rule-based sports-science generator (runs offline).
// Produces a clear WEEKLY schedule (sets × reps, rest, pace, technique cues),
// a MONTHLY mesocycle (progressive 3 weeks + deload) and a YEARLY macrocycle,
// individualized by level & days/week. Longevity metrics are first-class:
// VO₂max (Zone 2 + Norwegian 4x4), strength (grip → mortality, legs →
// mobility/falls), muscle mass (protein), glucose control, balance tests.
// ─────────────────────────────────────────────────────────────────────────────

type Level = 'pemula' | 'menengah' | 'lanjut'

interface Exercise {
  name: string
  sets?: string      // "4×8-10"
  rest?: string      // "90 dtk"
  pace?: string      // running pace/HR zone
  dur?: string       // duration
  dist?: string      // distance
  cue: string        // technique cue
}
interface DayPlan { title: string; emoji: string; focus: string; items: Exercise[] }

// Technique illustrations (Higgsfield-generated, minimalist instructional
// style) — matched by keyword against the exercise name so every block that
// reuses a movement (e.g. Push-up appears in Full Body & Upper Body) gets its
// thumbnail automatically, no per-entry wiring needed.
const TECHNIQUE_IMAGES: { match: RegExp; url: string }[] = [
  { match: /squat/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012752_fc31ed96-35bf-40ce-aad2-27310e0d6ee8.png' },
  { match: /push-up|bench/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012802_01eb1d11-a6ab-4b55-8eb8-b086cb5d1220.png' },
  { match: /deadlift/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012812_09d7e171-15bd-4bb1-83fe-7086d40f324d.png' },
  { match: /pull-up/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012821_16047742-2bfc-42cb-a111-f80e13026240.png' },
  { match: /hip thrust/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012828_c764c942-79a0-4a12-b77f-7993ba7389a4.png' },
  { match: /overhead press/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012843_1ad9fcbb-a3d8-4b52-a0b4-5e81be2626d0.png' },
  { match: /easy run|tempo|long run|interval|4×4|8×300|ladder/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_012852_10ed0602-40b4-40b1-8155-585b5fae2cb1.png' },
  { match: /plank/i, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023548_f3908098-532a-4057-a74c-0c1ff0c6ecec.png' },
]
function techniqueImage(name: string): string | null {
  return TECHNIQUE_IMAGES.find((t) => t.match.test(name))?.url ?? null
}

// Looping demonstration videos (Higgsfield kling3_0_turbo) — how to actually
// perform the key movements with correct form.
const TECHNIQUE_VIDEOS: { label: string; cue: string; url: string }[] = [
  { label: 'Squat', cue: 'Dada tegak · lutut searah jari kaki · paha sejajar lantai', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023249_bb1e8e4f-d292-4726-a8b3-f62731dcb892.mp4' },
  { label: 'Push-up', cue: 'Garis lurus kepala–tumit · siku 45° · turun terkontrol', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023318_072af872-419c-4a8e-ad89-cc8668ffdfae.mp4' },
  { label: 'Form Lari', cue: 'Midfoot strike · condong ringan ke depan · lengan rileks 90°', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023308_424ad8f6-42e7-497a-9976-7182c1b0d367.mp4' },
  { label: 'Deadlift', cue: 'Punggung netral · bar menempel tulang kering · dorong lantai', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030244_5bb8852a-7225-47bc-800a-8565d1c145ea.mp4' },
  { label: 'Pull-up', cue: 'Full hang di bawah · tarik dagu lewat bar · tanpa ayunan', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030300_85444d19-b286-40e6-8f47-203d6957134a.mp4' },
  { label: 'Hip Thrust', cue: 'Punggung atas di bench · dorong dari tumit · squeeze 1 dtk di atas', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030311_c9fa30bd-3f0f-4581-a9a5-a32b7f1de3dc.mp4' },
  { label: 'Renang (Freestyle)', cue: 'High elbow catch · rotasi tubuh · kepala diam, napas ke samping', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030336_6140502e-4fbf-4895-8e40-9f9cff3abca3.mp4' },
  { label: 'Sepeda', cue: 'Punggung datar · siku rileks · kayuhan bulat kadens ±90 rpm', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030348_8f39a332-9b8b-4bb3-82b0-2f47a811b0ae.mp4' },
]

const GOALS = [
  'Longevity (VO₂max + Strength)', 'Hybrid Training', 'Cardio', 'Muscle Gain', 'Full Body Workout',
  'Fat Loss / Burn Fat', 'Strength Boost', 'Glutes', 'Back', 'Bicep', 'Tricep', 'Upper Body',
  'Lower Body', 'Waist & Hip Reducer', 'Weight Loss', '3-Day Split', 'Stamina Maintenance',
  'Endurance', 'Runner — Easy Run', 'Runner — Tempo Run', 'Runner — Intervals', 'Runner — Long Run',
  'Runner — Norwegian 4x4', 'Runner — 8×300m', 'Runner — VO₂max Ladder', 'Cycling (GPS)',
  'Swimming (GPS)', 'Mental Strength',
] as const
type Goal = typeof GOALS[number]

// Scale sets/reps by level.
function vol(level: Level, base: string, mid: string, adv: string) {
  return level === 'pemula' ? base : level === 'menengah' ? mid : adv
}

// ── Strength building blocks ─────────────────────────────────────────────────
function strengthDay(level: Level, focus: 'full' | 'upper' | 'lower' | 'glutes' | 'back' | 'arms' | 'core'): DayPlan {
  const s = (b: string, m: string, a: string) => vol(level, b, m, a)
  const lib: Record<typeof focus, DayPlan> = {
    full: { title: 'Full Body Strength', emoji: '🏋️', focus: 'Kekuatan seluruh tubuh + grip', items: [
      { name: 'Squat / Goblet Squat', sets: s('3×8', '4×6-8', '5×5'), rest: '120 dtk', cue: 'Dada tegak, lutut searah jari kaki, paha sejajar lantai.' },
      { name: 'Push-up / Bench Press', sets: s('3×8-10', '4×8', '5×5'), rest: '90 dtk', cue: 'Skapula ditarik, turunkan 2 dtk, siku 45°.' },
      { name: 'Deadlift / Hip Hinge', sets: s('3×6', '4×5', '5×3-5'), rest: '150 dtk', cue: 'Punggung netral, dorong lantai, bar menempel tulang kering.' },
      { name: 'Dead Hang (grip!)', dur: s('3×20 dtk', '3×40 dtk', '3×60 dtk'), rest: '60 dtk', cue: 'Gantung pasif — genggaman kuat memprediksi umur panjang.' },
      { name: 'Farmer Carry', dist: s('3×20 m', '3×30 m', '4×40 m'), rest: '90 dtk', cue: 'Bahu turun, core kencang, langkah pendek stabil.' },
    ]},
    upper: { title: 'Upper Body', emoji: '💪', focus: 'Dada, bahu, punggung, lengan', items: [
      { name: 'Bench / Push-up', sets: s('3×8', '4×8', '5×5'), rest: '120 dtk', cue: 'Kaki menapak kuat, dorong eksplosif.' },
      { name: 'Pull-up / Lat Pulldown', sets: s('3×5-8', '4×6-8', '5×5'), rest: '120 dtk', cue: 'Tarik siku ke pinggang, dada ke bar.' },
      { name: 'Overhead Press', sets: s('3×8', '4×6', '5×5'), rest: '120 dtk', cue: 'Glutes kencang, kepala maju setelah bar lewat.' },
      { name: 'Row', sets: s('3×10', '4×8', '4×6'), rest: '90 dtk', cue: 'Tarik dengan punggung, bukan lengan.' },
    ]},
    lower: { title: 'Lower Body', emoji: '🦵', focus: 'Kaki — prediktor mobilitas & anti-jatuh', items: [
      { name: 'Back Squat / Leg Press', sets: s('3×8', '4×6-8', '5×5'), rest: '150 dtk', cue: 'Turun terkontrol 2-3 dtk, dorong sekuatnya.' },
      { name: 'Romanian Deadlift', sets: s('3×8', '4×8', '4×6'), rest: '120 dtk', cue: 'Rasakan hamstring memanjang, punggung lurus.' },
      { name: 'Bulgarian Split Squat', sets: s('3×8/kaki', '3×10/kaki', '4×8/kaki'), rest: '90 dtk', cue: 'Torso sedikit condong, lutut stabil.' },
      { name: 'Calf Raise + Sit-to-Stand cepat', sets: s('3×12', '4×12', '4×15'), rest: '60 dtk', cue: 'Sit-to-stand eksplosif melatih power kaki lansia-muda.' },
    ]},
    glutes: { title: 'Glutes Focus', emoji: '🍑', focus: 'Gluteus max/med untuk postur & power', items: [
      { name: 'Hip Thrust', sets: s('3×10', '4×8-10', '5×8'), rest: '120 dtk', cue: 'Dagu ditekuk, dorong dari tumit, tahan 1 dtk di atas.' },
      { name: 'Sumo Deadlift', sets: s('3×8', '4×6', '4×5'), rest: '150 dtk', cue: 'Lutut keluar, dada tegak.' },
      { name: 'Cable Kickback / Glute Bridge', sets: s('3×12', '3×15', '4×12'), rest: '60 dtk', cue: 'Squeeze penuh di puncak gerakan.' },
      { name: 'Side-Lying Abduction', sets: s('3×15', '3×20', '4×15'), rest: '45 dtk', cue: 'Gerakan kecil terkontrol — gluteus medius.' },
    ]},
    back: { title: 'Back Focus', emoji: '🔙', focus: 'Punggung tebal & postur sehat', items: [
      { name: 'Pull-up / Assisted', sets: s('3×5', '4×6-8', '5×5+'), rest: '120 dtk', cue: 'Full hang di bawah, dada ke bar.' },
      { name: 'Barbell / DB Row', sets: s('3×10', '4×8', '4×6'), rest: '120 dtk', cue: 'Tarik ke pusar, jeda 1 dtk.' },
      { name: 'Lat Pulldown', sets: s('3×10', '3×12', '4×10'), rest: '90 dtk', cue: 'Turunkan ke dada atas, siku ke bawah-belakang.' },
      { name: 'Face Pull', sets: s('3×15', '3×15', '4×12'), rest: '60 dtk', cue: 'Tarik ke dahi, rotasi eksternal — sehat untuk bahu.' },
    ]},
    arms: { title: 'Arms (Bicep + Tricep)', emoji: '💪', focus: 'Lengan', items: [
      { name: 'Barbell / DB Curl', sets: s('3×10', '4×8-10', '4×8'), rest: '75 dtk', cue: 'Siku menempel badan, turunkan 3 dtk.' },
      { name: 'Hammer Curl', sets: s('3×10', '3×12', '4×10'), rest: '60 dtk', cue: 'Genggaman netral — brachialis & grip.' },
      { name: 'Close-Grip Bench / Dips', sets: s('3×8', '4×8', '4×6-8'), rest: '90 dtk', cue: 'Siku dekat badan.' },
      { name: 'Overhead Tricep Ext.', sets: s('3×12', '3×12', '4×10'), rest: '60 dtk', cue: 'Siku mengarah ke depan, regangan penuh.' },
    ]},
    core: { title: 'Core & Waist', emoji: '🎯', focus: 'Pinggang, perut & stabilitas', items: [
      { name: 'Plank', dur: s('3×30 dtk', '3×45 dtk', '3×75 dtk'), rest: '45 dtk', cue: 'Garis lurus kepala-tumit, glutes aktif.' },
      { name: 'Side Plank', dur: s('3×20 dtk/sisi', '3×30 dtk/sisi', '3×45 dtk/sisi'), rest: '45 dtk', cue: 'Pinggul tinggi — obliques untuk lingkar pinggang.' },
      { name: 'Dead Bug', sets: s('3×8/sisi', '3×10/sisi', '3×12/sisi'), rest: '45 dtk', cue: 'Punggung bawah menempel lantai.' },
      { name: 'Pallof Press', sets: s('3×10/sisi', '3×12/sisi', '3×12/sisi'), rest: '45 dtk', cue: 'Anti-rotasi, napas teratur.' },
    ]},
  }
  return lib[focus]
}

// ── Cardio / runner building blocks ──────────────────────────────────────────
function cardioDay(kind: string, level: Level): DayPlan {
  const s = (b: string, m: string, a: string) => vol(level, b, m, a)
  switch (kind) {
    case 'easy': return { title: 'Easy Run (Zone 2)', emoji: '🏃', focus: 'Basis aerobik — mesin longevity', items: [
      { name: 'Easy run percakapan', dur: s('25-30 mnt', '40-50 mnt', '60-75 mnt'), pace: 'Zone 2 (60-70% HRmax) — masih bisa bicara kalimat penuh', cue: 'Kalau ngos-ngosan, PELANKAN. 80% volume mingguan di sini.' },
    ]}
    case 'tempo': return { title: 'Tempo Run', emoji: '⏱️', focus: 'Ambang laktat naik', items: [
      { name: 'Pemanasan', dur: '10 mnt', pace: 'Zone 1-2', cue: 'Progresif, akhiri dengan 4×20 dtk strides.' },
      { name: 'Tempo', dur: s('2×8 mnt (jeda 3 mnt)', '20 mnt kontinu', '2×15 mnt (jeda 3 mnt)'), pace: '"Comfortably hard" — Zone 3-4, bisa bicara 3-4 kata', cue: 'Ritme stabil, jangan mulai terlalu cepat.' },
      { name: 'Pendinginan', dur: '10 mnt', pace: 'Zone 1', cue: 'Jalan/jog santai.' },
    ]}
    case 'interval': return { title: 'Interval', emoji: '⚡', focus: 'VO₂max & kecepatan', items: [
      { name: 'Pemanasan', dur: '12 mnt + 4 strides', pace: 'Zone 1-2', cue: 'Wajib — cegah cedera.' },
      { name: 'Interval', sets: s('5×2 mnt keras (jeda jog 2 mnt)', '6×3 mnt (jeda 2 mnt)', '5×4 mnt (jeda 3 mnt)'), pace: 'Zone 4-5 (90-95% HRmax)', cue: 'Repetisi terakhir harus sama cepat dengan pertama.' },
      { name: 'Pendinginan', dur: '10 mnt', pace: 'Zone 1', cue: 'Jog ringan.' },
    ]}
    case 'long': return { title: 'Long Run', emoji: '🛣️', focus: 'Daya tahan & efisiensi lemak', items: [
      { name: 'Long run', dur: s('50-60 mnt', '75-90 mnt', '100-150 mnt'), dist: s('7-9 km', '12-16 km', '18-28 km'), pace: 'Zone 2, 60-75 dtk/km lebih lambat dari pace 10K', cue: 'Bawa minum; gel/karbo tiap 40 mnt bila >75 mnt.' },
    ]}
    case '4x4': return { title: 'Norwegian 4×4', emoji: '🇳🇴', focus: 'Protokol VO₂max terbukti (naik ~0.5/bln)', items: [
      { name: 'Pemanasan', dur: '10 mnt', pace: 'Zone 2', cue: 'Naikkan HR bertahap.' },
      { name: '4× (4 mnt keras + 3 mnt recovery)', sets: '4 repetisi', pace: 'Interval: 85-95% HRmax · Recovery: jog 60-70%', cue: 'Target napas berat tapi terkontrol; jangan sprint mati di menit 1.' },
      { name: 'Pendinginan', dur: '5-10 mnt', pace: 'Zone 1', cue: 'Total sesi ±40 mnt. 1-2×/minggu cukup.' },
    ]}
    case '8x300': return { title: '8×300m', emoji: '🎯', focus: 'Kecepatan & ekonomi lari', items: [
      { name: 'Pemanasan', dur: '15 mnt + drills (A-skip, high knees)', pace: 'Zone 1-2', cue: 'Drills memperbaiki teknik.' },
      { name: '8×300m', sets: '8 repetisi', rest: s('jalan 3 mnt', 'jog 200m (90 dtk)', 'jog 100m (60 dtk)'), pace: 'Pace 3K-5K (cepat tapi rata)', cue: 'Lengan rileks, kaki mendarat di bawah pinggul.' },
      { name: 'Pendinginan', dur: '10 mnt', pace: 'Zone 1', cue: 'Regangkan betis & hamstring.' },
    ]}
    case 'ladder': return { title: 'VO₂max Ladder', emoji: '🪜', focus: 'Variasi interval piramida', items: [
      { name: 'Pemanasan', dur: '12 mnt', pace: 'Zone 2', cue: '4 strides di akhir.' },
      { name: 'Ladder: 1-2-3-4-3-2-1 mnt', sets: '1 rangkaian', rest: 'jog separuh durasi repetisi', pace: 'Zone 4-5, makin pendek makin cepat', cue: 'Atur tenaga — puncak tangga tetap kuat.' },
      { name: 'Pendinginan', dur: '10 mnt', pace: 'Zone 1', cue: 'Jog ringan.' },
    ]}
    case 'cycle': return { title: 'Cycling (GPS)', emoji: '🚴', focus: 'Kecepatan & pace via GPS tracker', items: [
      { name: 'Endurance ride', dur: s('45 mnt', '75 mnt', '2-3 jam'), pace: 'Zone 2 — kecepatan stabil (pantau di GPS Tracker)', cue: 'Kadens 85-95 rpm, posisi rileks.' },
      { name: 'Interval (opsional)', sets: s('4×2 mnt', '5×3 mnt', '6×4 mnt'), rest: 'spin ringan 3 mnt', pace: 'Zone 4', cue: 'Gunakan speed/pace GPS untuk konsistensi tiap repetisi.' },
    ]}
    case 'swim': return { title: 'Swimming (GPS)', emoji: '🏊', focus: 'Teknik + speed/pace (open water via GPS)', items: [
      { name: 'Pemanasan', dist: '200-400 m', pace: 'Santai', cue: 'Campuran gaya, fokus napas.' },
      { name: 'Drill teknik', sets: s('4×50 m', '6×50 m', '8×50 m'), rest: '20 dtk', cue: 'Catch-up drill, rotasi pinggul, kepala diam.' },
      { name: 'Main set', sets: s('6×100 m', '8×100 m', '10×150 m'), rest: '20-30 dtk', pace: 'Pace terkontrol per 100m (GPS: speed/pace; depth & pressure hanya dari dive watch)', cue: 'Pace rata — repetisi terakhir = pertama.' },
      { name: 'Pendinginan', dist: '200 m', pace: 'Santai', cue: 'Gaya punggung rileks.' },
    ]}
    case 'hiit': return { title: 'HIIT Full Body', emoji: '🔥', focus: 'Bakar lemak & kapasitas anaerobik', items: [
      { name: 'Sirkuit: burpee, mountain climber, squat jump, push-up', sets: s('4 ronde × 30 dtk kerja/30 dtk istirahat', '5 ronde × 40/20', '6 ronde × 45/15'), rest: '2 mnt antar-ronde', cue: 'Kualitas gerakan > kecepatan; jaga form saat lelah.' },
      { name: 'Finisher plank', dur: '2×45 dtk', rest: '30 dtk', cue: 'Napas stabil.' },
    ]}
    default: return cardioDay('easy', level)
  }
}

function recoveryDay(): DayPlan {
  return { title: 'Recovery Aktif', emoji: '🧘', focus: 'Adaptasi terjadi saat pulih', items: [
    { name: 'Jalan santai / sepeda ringan', dur: '20-30 mnt', pace: 'Zone 1', cue: 'Gerak ringan melancarkan pemulihan.' },
    { name: 'Mobilitas & stretching', dur: '10-15 mnt', cue: 'Hip flexor, hamstring, thoracic spine.' },
    { name: 'One-leg stand (tes keseimbangan)', dur: '3×30 dtk/kaki', cue: 'Mata terbuka lalu coba tertutup — prediktor longevity.' },
    { name: 'Breathwork / meditasi', dur: '10 mnt', cue: 'Napas 4-7-8 menurunkan stres & memperbaiki HRV.' },
  ]}
}

function mentalDay(): DayPlan {
  return { title: 'Mental Strength', emoji: '🧠', focus: 'Mentalitas juara (Seahawks-style mindfulness)', items: [
    { name: 'Meditasi terpandu', dur: '10-15 mnt', cue: 'Fokus napas; saat pikiran lari, kembalikan tanpa menghakimi.' },
    { name: 'Visualisasi performa', dur: '5 mnt', cue: 'Bayangkan sesi/lomba sukses dengan detail sensorik.' },
    { name: 'Jurnal: 3 syukur + 1 tantangan', dur: '5 mnt', cue: 'Tulis tangan — regulasi emosi & motivasi.' },
    { name: 'Latihan di ketidaknyamanan', dur: 'akhir sesi kardio', cue: 'Tahan 2 mnt ekstra saat ingin berhenti — otot mental.' },
  ]}
}

// ── Weekly plan generator ────────────────────────────────────────────────────
function buildWeek(goal: Goal, level: Level, days: number): (DayPlan | null)[] {
  const week: (DayPlan | null)[] = [null, null, null, null, null, null, null] // Mon..Sun
  const put = (idx: number[], plans: DayPlan[]) => idx.forEach((d, i) => { week[d] = plans[i % plans.length] })
  const slots = days === 3 ? [0, 2, 4] : days === 4 ? [0, 1, 3, 5] : days === 5 ? [0, 1, 2, 4, 5] : days >= 6 ? [0, 1, 2, 3, 4, 5] : [0, 3]

  const runnerMap: Record<string, string> = {
    'Runner — Easy Run': 'easy', 'Runner — Tempo Run': 'tempo', 'Runner — Intervals': 'interval',
    'Runner — Long Run': 'long', 'Runner — Norwegian 4x4': '4x4', 'Runner — 8×300m': '8x300',
    'Runner — VO₂max Ladder': 'ladder',
  }

  if (goal in runnerMap) {
    // Key session + easy volume around it (polarized 80/20).
    const key = cardioDay(runnerMap[goal], level)
    const plans = [key, cardioDay('easy', level), cardioDay('easy', level), cardioDay('long', level), recoveryDay(), strengthDay(level, 'lower')]
    put(slots, plans)
  } else if (goal === 'Longevity (VO₂max + Strength)') {
    put(slots, [cardioDay('4x4', level), strengthDay(level, 'full'), cardioDay('easy', level), strengthDay(level, 'lower'), cardioDay('long', level), recoveryDay()])
  } else if (goal === 'Hybrid Training') {
    put(slots, [strengthDay(level, 'full'), cardioDay('interval', level), strengthDay(level, 'upper'), cardioDay('easy', level), strengthDay(level, 'lower'), cardioDay('long', level)])
  } else if (goal === 'Cardio' || goal === 'Endurance' || goal === 'Stamina Maintenance') {
    put(slots, [cardioDay('easy', level), cardioDay('tempo', level), cardioDay('easy', level), cardioDay('long', level), recoveryDay(), cardioDay('interval', level)])
  } else if (goal === 'Muscle Gain') {
    put(slots, [strengthDay(level, 'upper'), strengthDay(level, 'lower'), recoveryDay(), strengthDay(level, 'full'), strengthDay(level, 'arms'), cardioDay('easy', level)])
  } else if (goal === 'Full Body Workout') {
    put(slots, [strengthDay(level, 'full'), cardioDay('easy', level), strengthDay(level, 'full'), recoveryDay(), strengthDay(level, 'full'), cardioDay('hiit', level)])
  } else if (goal === 'Fat Loss / Burn Fat' || goal === 'Weight Loss') {
    put(slots, [cardioDay('hiit', level), strengthDay(level, 'full'), cardioDay('easy', level), strengthDay(level, 'lower'), cardioDay('long', level), recoveryDay()])
  } else if (goal === 'Strength Boost') {
    put(slots, [strengthDay(level, 'lower'), strengthDay(level, 'upper'), recoveryDay(), strengthDay(level, 'full'), strengthDay(level, 'back'), cardioDay('easy', level)])
  } else if (goal === 'Glutes') {
    put(slots, [strengthDay(level, 'glutes'), strengthDay(level, 'lower'), recoveryDay(), strengthDay(level, 'glutes'), strengthDay(level, 'core'), cardioDay('easy', level)])
  } else if (goal === 'Back') {
    put(slots, [strengthDay(level, 'back'), strengthDay(level, 'full'), recoveryDay(), strengthDay(level, 'back'), strengthDay(level, 'core'), cardioDay('easy', level)])
  } else if (goal === 'Bicep' || goal === 'Tricep') {
    put(slots, [strengthDay(level, 'arms'), strengthDay(level, 'upper'), recoveryDay(), strengthDay(level, 'arms'), strengthDay(level, 'back'), cardioDay('easy', level)])
  } else if (goal === 'Upper Body') {
    put(slots, [strengthDay(level, 'upper'), strengthDay(level, 'arms'), recoveryDay(), strengthDay(level, 'upper'), strengthDay(level, 'back'), cardioDay('easy', level)])
  } else if (goal === 'Lower Body') {
    put(slots, [strengthDay(level, 'lower'), strengthDay(level, 'glutes'), recoveryDay(), strengthDay(level, 'lower'), strengthDay(level, 'core'), cardioDay('easy', level)])
  } else if (goal === 'Waist & Hip Reducer') {
    put(slots, [strengthDay(level, 'core'), cardioDay('hiit', level), cardioDay('easy', level), strengthDay(level, 'core'), cardioDay('long', level), recoveryDay()])
  } else if (goal === '3-Day Split') {
    put(days >= 3 ? [0, 2, 4] : slots, [strengthDay(level, 'upper'), strengthDay(level, 'lower'), strengthDay(level, 'full')])
  } else if (goal === 'Cycling (GPS)') {
    put(slots, [cardioDay('cycle', level), recoveryDay(), cardioDay('cycle', level), strengthDay(level, 'lower'), cardioDay('cycle', level), strengthDay(level, 'core')])
  } else if (goal === 'Swimming (GPS)') {
    put(slots, [cardioDay('swim', level), recoveryDay(), cardioDay('swim', level), strengthDay(level, 'upper'), cardioDay('swim', level), strengthDay(level, 'core')])
  } else if (goal === 'Mental Strength') {
    put(slots, [mentalDay(), cardioDay('easy', level), mentalDay(), strengthDay(level, 'full'), mentalDay(), recoveryDay()])
  } else {
    put(slots, [strengthDay(level, 'full'), cardioDay('easy', level), recoveryDay()])
  }
  return week
}

const DOW = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// Cooper test → VO₂max (Cooper 1968): (jarak_m − 504.9) / 44.73
function cooperVo2(m: number) { return (m - 504.9) / 44.73 }

// ── Personalized Runner Coach ────────────────────────────────────────────────
// Fixes the core mistake: a Cooper test is an ALL-OUT 12-minute effort, NOT an
// easy run. We estimate VO₂max fairly from a submaximal run using the ACSM
// running equation, adjusted for perceived effort — so an easy 4km/35min no
// longer produces a demoralizing (and wrong) number. Then it builds personal
// pace zones (Daniels-style) and a realistic progressive plan.
function fmtPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '—'
  const m = Math.floor(secPerKm / 60), s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
// ACSM: VO₂ (ml/kg/min) at running speed = speed(m/min)×0.2 + 3.5.
function vo2AtPace(speedMperMin: number) { return speedMperMin * 0.2 + 3.5 }
// Effort fraction of VO₂max for the entered run.
const EFFORT_FRAC: Record<string, number> = { easy: 0.68, moderate: 0.78, hard: 0.9 }
function vo2Category(v: number, age: number, g: 'M' | 'F'): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral' } {
  // Cooper/ACSM norms, age & sex adjusted (approx).
  const base = g === 'M' ? [32, 38, 44, 51] : [27, 33, 39, 45]
  const adj = base.map((b) => b - Math.max(0, age - 30) * 0.3)
  if (v >= adj[3]) return { label: 'Superior', tone: 'brand' }
  if (v >= adj[2]) return { label: 'Sangat Baik', tone: 'brand' }
  if (v >= adj[1]) return { label: 'Baik', tone: 'low' }
  if (v >= adj[0]) return { label: 'Cukup', tone: 'low' }
  return { label: 'Membangun Fondasi', tone: 'neutral' }
}

const RED_FLAGS = [
  { id: 'faint', label: '😵 Pusing / hampir pingsan saat olahraga' },
  { id: 'chest', label: '💢 Nyeri/tekanan dada saat aktivitas' },
  { id: 'palpitation', label: '💓 Jantung berdebar tak wajar' },
  { id: 'breathless_rest', label: '🫁 Sesak napas saat istirahat' },
  { id: 'heart_history', label: '🩺 Riwayat jantung / tekanan darah tinggi' },
]

function RunnerCoach() {
  const demo = getDemo()
  const [km, setKm] = useState(0)
  const [min, setMin] = useState(0)
  const [effort, setEffort] = useState<'easy' | 'moderate' | 'hard'>('easy')
  const [age, setAge] = useState(demo.age)
  const [g, setG] = useState<'M' | 'F'>(demo.sex)
  // Honest current ability drives the plan far better than one run's distance.
  const [cont, setCont] = useState<'u1' | 'm1_5' | 'm5_15' | 'm15_30' | 'm30p'>('m5_15')
  const [flags, setFlags] = useState<string[]>([])
  // Cooper goal countdown (generic default — the standard "good" adult mark).
  const [targetM, setTargetM] = useState(2400)
  const [months, setMonths] = useState(6)
  function updAge(v: number) { setAge(v); setDemo({ age: v }) }
  function updSex(v: 'M' | 'F') { setG(v); setDemo({ sex: v }) }

  const speedMperMin = km > 0 && min > 0 ? (km * 1000) / min : 0
  const runPaceSec = km > 0 ? (min * 60) / km : 0
  const vo2atRun = vo2AtPace(speedMperMin)
  const vo2max = effort ? vo2atRun / EFFORT_FRAC[effort] : 0
  const cat = vo2max > 0 ? vo2Category(vo2max, age, g) : null

  // Velocity at VO₂max → 5K-equivalent pace → Daniels-style zones.
  const vVo2 = (vo2max - 3.5) / 0.2 // m/min
  const pace5kSec = vVo2 > 0 ? (1000 / vVo2) * 60 * 1.04 : 0
  const zone = (deltaSec: number) => fmtPace(pace5kSec + deltaSec)

  // Level from honest continuous-run ability.
  const level: 0 | 1 | 2 = cont === 'u1' || cont === 'm1_5' ? 0 : cont === 'm5_15' ? 1 : 2
  const canRunCont = level >= 1

  // Cooper goal realism.
  const targetVo2 = cooperVo2(targetM)
  const gainNeeded = targetVo2 - vo2max
  const monthsNeeded = gainNeeded > 0 ? gainNeeded / 1.2 : 0 // ~1.2 ml/kg/mo aggressive-beginner
  const verdict = gainNeeded <= 0
    ? { l: 'Sudah tercapai 🎉', tone: 'brand' as const, d: 'Estimasi Anda sudah di atas target — fokus pertahankan & pertajam pacing tes.' }
    : monthsNeeded <= months
    ? { l: 'Realistis', tone: 'brand' as const, d: `Butuh ~${monthsNeeded.toFixed(1)} bulan; Anda punya ${months}. Konsisten = sangat bisa.` }
    : monthsNeeded <= months * 1.4
    ? { l: 'Menantang (stretch)', tone: 'low' as const, d: `Butuh ~${monthsNeeded.toFixed(1)} bulan vs ${months} tersedia. Bisa, tapi tanpa kompromi konsistensi & pemulihan.` }
    : { l: 'Sangat agresif', tone: 'critical' as const, d: `Butuh ~${monthsNeeded.toFixed(1)} bulan. Mengejar ${targetM}m dalam ${months} bulan berisiko cedera. Target ~${Math.round((vo2max + months * 1.2) * 44.73 + 504.9)}m lebih aman.` }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Pelatih Lari Personal" subtitle="Masukkan lari terakhir Anda — dapatkan VO₂max yang benar, zona pace personal & rencana realistis" />

      {/* Safety red-flag screen — a duty-of-care gate before intense running. */}
      <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
        <div className="text-xs font-extrabold text-rose-700">🛡️ Skrining Keamanan (isi jujur sebelum lari intens)</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RED_FLAGS.map((f) => (
            <button key={f.id} onClick={() => setFlags((x) => x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id])}
              className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (flags.includes(f.id) ? 'bg-rose-500 text-white' : 'bg-white text-neutral-500 border border-neutral-200')}>
              {f.label}
            </button>
          ))}
        </div>
        {flags.length > 0 && (
          <div className="mt-2 rounded-xl bg-white p-3 text-[11px] leading-relaxed text-rose-700">
            <b>Berhenti dulu — periksa ke dokter sebelum latihan intensitas tinggi atau Cooper Test.</b> Gejala yang Anda tandai (khususnya pusing/hampir pingsan atau nyeri dada saat olahraga) harus dievaluasi (EKG + pemeriksaan jantung) untuk memastikan aman. Sementara itu, batasi ke jalan cepat & jangan pernah berlatih sampai hampir pingsan.
            <div className="mt-2"><a href="#/consult" className="font-bold underline">Konsultasi dokter</a> · <a href="#/hospitals" className="font-bold underline">Faskes terdekat</a></div>
          </div>
        )}
      </div>

      {/* Honest current ability */}
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Berapa lama bisa lari TERUS tanpa berhenti?</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {([['u1', '<1 mnt'], ['m1_5', '1-5 mnt'], ['m5_15', '5-15 mnt'], ['m15_30', '15-30 mnt'], ['m30p', '30+ mnt']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setCont(k)} className={'rounded-xl py-2 text-xs font-bold ' + (cont === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{l}</button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-neutral-400">Jawab jujur dari lari pelan-nyaman, bukan sprint. Ini yang menentukan rencana Anda.</p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Jarak (km)"><input className={inputClass} type="number" step={0.1} value={km || ''} placeholder="mis. 3" onChange={(e) => setKm(+e.target.value)} /></Field>
        <Field label="Waktu (menit)"><input className={inputClass} type="number" value={min || ''} placeholder="mis. 25" onChange={(e) => setMin(+e.target.value)} /></Field>
        <Field label="Seberapa berat?">
          <select className={inputClass} value={effort} onChange={(e) => setEffort(e.target.value as typeof effort)}>
            <option value="easy">Santai (bisa ngobrol)</option>
            <option value="moderate">Sedang (agak berat)</option>
            <option value="hard">All-out (maksimal)</option>
          </select>
        </Field>
        <Field label="Usia / Kelamin">
          <div className="flex gap-1">
            <input className={inputClass + ' w-14'} type="number" value={age} onChange={(e) => updAge(+e.target.value)} />
            <select className={inputClass} value={g} onChange={(e) => updSex(e.target.value as 'M' | 'F')}><option value="M">L</option><option value="F">P</option></select>
          </div>
        </Field>
      </div>

      {/* Honest VO2max */}
      <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Estimasi VO₂max Anda</div>
            <div className="text-3xl font-extrabold text-brand">{vo2max > 0 ? vo2max.toFixed(0) : '—'}<span className="ml-1 text-sm text-white/50">ml/kg/mnt</span></div>
            <div className="text-[10px] text-white/50">pace lari ini: {fmtPace(runPaceSec)}/km · O₂ saat itu {vo2atRun.toFixed(0)}</div>
          </div>
          {cat && <Badge tone={cat.tone}>{cat.label}</Badge>}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/80">
          {effort === 'easy'
            ? '⚠️ Karena ini lari SANTAI, VO₂max sebenarnya JAUH lebih tinggi dari sekadar mengubah pace ini ke Cooper Test. Lari santai memang HARUS terasa lambat — itu prinsip yang benar (80% latihan harus mudah).'
            : effort === 'moderate'
            ? 'Dihitung dari usaha sedang, disesuaikan ke perkiraan VO₂max. Untuk angka pasti, lakukan tes all-out 12 menit.'
            : 'Bagus — ini usaha maksimal, jadi estimasi paling akurat. Ini setara Cooper Test yang benar.'}
        </p>
      </div>

      {/* Encouraging reframe */}
      {vo2max > 0 && (
        <div className="mt-3 rounded-xl bg-brand-50 p-3 text-[12px] leading-relaxed text-brand-dark">
          💚 <b>Perspektif jujur:</b> {km >= 1 ? `mampu lari ${km} km terus-menerus sudah menempatkan Anda di atas mayoritas orang yang tak sanggup lari 1 km. ` : ''}
          VO₂max adalah kapasitas yang <b>paling bisa dilatih</b> — pemula lazim naik <b>15-30% dalam 8-12 minggu</b> latihan terstruktur.
          Jangan bandingkan lari <i>santai</i> Anda dengan pace <i>lomba</i> orang lain; itu apel vs jeruk.
        </div>
      )}

      {/* Personal pace zones */}
      {pace5kSec > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Zona Pace Personal Anda (menit/km)</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Pemulihan', zone(105), 'sangat santai'],
              ['Easy / Zona 2', zone(85), '80% latihan di sini'],
              ['Long run', zone(70), 'daya tahan'],
              ['Tempo / Ambang', zone(22), '"nyaman-berat"'],
              ['Interval / VO₂max', zone(0), 'naikkan plafon'],
              ['Cepat / Strides', zone(-12), '15-20 dtk eksplosif'],
            ].map(([l, p, d]) => (
              <div key={l} className="rounded-xl border border-neutral-100 p-2.5">
                <div className="text-[10px] font-bold text-neutral-400">{l}</div>
                <div className="text-base font-extrabold text-brand-dark">{p}</div>
                <div className="text-[9px] text-neutral-400">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-400">Diturunkan dari VO₂max Anda (metode Jack Daniels). Jalankan easy run di zona Easy — kalau lebih cepat, Anda merusak basis aerobik.</p>
        </div>
      )}

      {/* Progressive plan for their level */}
      <div className="mt-3">
        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Rencana 8 Minggu — Disesuaikan Level Anda</div>
        <div className="mt-2 space-y-2">
          {(level === 0
            ? [
                { w: 'Minggu 1-2', d: 'Run-walk: lari 1 mnt / jalan 2 mnt × 8. 3×/minggu. Tujuan: terbiasa bergerak tanpa cedera.' },
                { w: 'Minggu 3-4', d: 'Lari 2 mnt / jalan 1 mnt × 8. Tambah 1 sesi jalan cepat 30 mnt.' },
                { w: 'Minggu 5-6', d: 'Lari 5 mnt / jalan 1 mnt × 5. Mulai bisa lari 10-15 mnt kontinu.' },
                { w: 'Minggu 7-8', d: 'Lari kontinu 20-25 mnt easy. Anda resmi jadi pelari!' },
              ]
            : level === 1
            ? [
                { w: 'Minggu 1-2', d: `3× lari easy 20-30 mnt di pace ${zone(85)}. Fokus konsistensi, bukan kecepatan.` },
                { w: 'Minggu 3-4', d: 'Naikkan 1 easy run ke 35-40 mnt. Tambah 4×20 dtk strides di akhir 1 sesi.' },
                { w: 'Minggu 5-6', d: `Tambah 1 sesi tempo pendek: 2×6 mnt di pace ${zone(22)} (jeda jalan 2 mnt).` },
                { w: 'Minggu 7-8', d: 'Tes ulang: lari all-out 12 menit (Cooper benar) — lihat lompatan angka Anda.' },
              ]
            : [
                { w: 'Minggu 1-2', d: `Basis: 3× easy ${zone(85)} (30-40 mnt) + 1 long run ${zone(70)} (45 mnt). Semua HARUS terasa mudah.` },
                { w: 'Minggu 3-4', d: `Tambah kualitas: 1× tempo 3×8 mnt @ ${zone(22)}. Pertahankan easy tetap easy.` },
                { w: 'Minggu 5-6', d: `Naikkan VO₂max: 1× Norwegian 4×4 (4 mnt keras @ ${zone(0)} + 3 mnt jog) + 1 tempo. Long run 60 mnt.` },
                { w: 'Minggu 7-8', d: 'Deload minggu 7 (−40%), lalu Minggu 8 tes 12 menit all-out. Target naik 1-3 ml/kg/mnt.' },
              ])
            .map((p) => (
              <div key={p.w} className="flex gap-3 rounded-xl border border-neutral-100 p-3">
                <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-extrabold text-brand-dark">{p.w}</span>
                <p className="text-[12px] leading-relaxed text-neutral-600">{p.d}</p>
              </div>
            ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          {canRunCont
            ? '🎯 Resep emas untuk menaikkan VO₂max Anda: 80% lari mudah + 20% keras (Norwegian 4×4 & tempo), kekuatan 2×/minggu, tidur 7-9 jam. Kesabaran mengalahkan intensitas.'
            : 'Mulai dari run-walk — ini cara TERBUKTI & teraman untuk pemula. Jangan buru-buru; konsistensi 3×/minggu jauh lebih penting dari kecepatan.'}
        </p>
      </div>

      {/* Symptom troubleshooting — the exact things that go wrong for beginners */}
      <div className="mt-4">
        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Atasi Keluhan Umum Saat Lari</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            { s: '🦵 Betis pegal/kaku sejak awal', d: 'Anda mendarat di ujung kaki / lari terlalu cepat. Perbaikan: pemanasan 5 mnt jalan + ankle circles; mendarat MIDFOOT tepat di bawah pinggul; perlambat. Kuatkan betis: calf raise 3×15, 3×/minggu. Naikkan jarak maks +10%/minggu.' },
            { s: '🫁 Napas ngos-ngosan cepat (300m)', d: 'Anda start terlalu ngebut → langsung anaerobik. Perbaikan: mulai SANGAT pelan — tes bicara: jika tak bisa bicara satu kalimat, PELANKAN atau jalan. Napas ritmis (tarik 2-3 langkah, buang 2-3 langkah).' },
            { s: '😵 Pusing/limbung (500m)', d: '⚠️ Jangan pernah dorong sampai titik ini. Bisa dari napas berlebih, gula darah rendah, dehidrasi — TAPI wajib diperiksa dokter dulu (bisa terkait jantung). Sementara: hanya jalan cepat, minum cukup, makan 1-2 jam sebelum.' },
            { s: '🎽 Cepat lelah walau jarak pendek', d: 'Basis aerobik belum terbangun — itu WAJAR & cepat membaik. Run-walk 3×/minggu selama 3-4 minggu akan mengubah drastis daya tahan Anda.' },
          ].map((x) => (
            <div key={x.s} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-xs font-extrabold">{x.s}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{x.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cooper goal countdown */}
      <div className="mt-4 rounded-2xl border border-brand/20 bg-brand-50 p-4">
        <div className="text-xs font-extrabold text-brand-dark">🎯 Target Cooper Test Anda</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Target jarak (m)"><input className={inputClass} type="number" value={targetM} onChange={(e) => setTargetM(+e.target.value)} /></Field>
          <Field label="Waktu tersedia (bulan)"><input className={inputClass} type="number" value={months} onChange={(e) => setMonths(+e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={verdict.tone}>{verdict.l}</Badge>
          <span className="text-[11px] text-neutral-500">Target ≈ VO₂max {targetVo2.toFixed(0)} · Anda sekarang ≈ {vo2max.toFixed(0)}</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600">{verdict.d}</p>
        <div className="mt-3 space-y-1.5">
          {[
            { m: 'Bulan 1', d: canRunCont ? 'Basis aerobik: run-walk → lari kontinu easy 30 mnt. Tanpa sesi keras. Kuatkan betis & core.' : 'Run-walk (lari 1-2 mnt/jalan 1-2 mnt). Tujuan: lari 10 mnt kontinu. Skrining dokter bila ada gejala.' },
            { m: 'Bulan 2', d: 'Bangun volume: 3-4× easy run, 1 long run naik bertahap. Tambah 4×20 dtk strides. Easy HARUS terasa mudah.' },
            { m: 'Bulan 3', d: 'Mulai ambang: 1× tempo/minggu. Tes 12 menit percobaan #1 — ukur kemajuan tanpa tekanan.' },
            { m: 'Bulan 4', d: 'Naikkan VO₂max: 1× Norwegian 4×4/minggu + 1 tempo + 2 easy + 1 long. Kekuatan 2×.' },
            { m: 'Bulan 5', d: 'Puncak spesifik tes: interval mirip pace Cooper (mis. 6×3 mnt). Latih pacing merata — jangan start ngebut.' },
            { m: 'Bulan 6 (Januari)', d: 'Minggu 1-2 taper (−40% volume, jaga intensitas). Cooper Test resmi. Strategi: 4 lap merata, sisakan tenaga 2 menit terakhir.' },
          ].map((x) => (
            <div key={x.m} className="flex gap-2 rounded-lg bg-white/70 p-2.5">
              <span className="shrink-0 text-[10px] font-extrabold text-brand-dark">{x.m}</span>
              <span className="text-[11px] leading-relaxed text-neutral-600">{x.d}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          Strategi hari-H Cooper: <b>jangan start sprint</b> (kesalahan fatal). Bagi rata 4 putaran; kalau masih kuat di 2 menit terakhir, baru habiskan. Pacing merata mengalahkan start ngebut sejauh 100-200m.
        </p>
      </div>
    </Card>
  )
}

export function TrainingPlan() {
  const [goal, setGoal] = useState<Goal>('Longevity (VO₂max + Strength)')
  const [level, setLevel] = useState<Level>('pemula')
  const [days, setDays] = useState(4)
  const [view, setView] = useState<'minggu' | 'bulan' | 'tahun'>('minggu')
  const [vo2Now, setVo2Now] = useState(getDemo().vo2max ?? 0)
  const [cooper, setCooper] = useState(0)
  const [weightKg, setWeightKg] = useState(getDemo().weightKg)

  const week = useMemo(() => buildWeek(goal, level, days), [goal, level, days])
  const vo2FromCooper = cooperVo2(cooper)
  const vo2Target = Math.max(vo2Now + 5, 50)
  const monthsToTarget = Math.max(1, Math.ceil((vo2Target - vo2Now) / 0.5)) // Norwegian 4x4 ≈ +0.5/bln
  const protein = Math.round(weightKg * 1.6)

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {/* Generator */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="AI Training Planner" subtitle="Program tersusun rapi: jadwal, repetisi, durasi, istirahat, pace & teknik" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Field label="Tujuan / Goal">
              <select className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Level">
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              <option value="pemula">Pemula</option><option value="menengah">Menengah</option><option value="lanjut">Lanjut</option>
            </select>
          </Field>
          <Field label="Hari latihan/minggu">
            <select className={inputClass} value={days} onChange={(e) => setDays(+e.target.value)}>
              {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} hari</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex gap-1.5">
          {(['minggu', 'bulan', 'tahun'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={'flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ' + (view === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {v === 'minggu' ? '📅 Minggu' : v === 'bulan' ? '🗓️ Bulan' : '📆 Tahun'}
            </button>
          ))}
        </div>
      </Card>

      {/* Pelatih Lari Personal — VO₂max yang benar + zona pace + rencana */}
      <RunnerCoach />

      {/* Video teknik gerakan (Higgsfield) */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Video Teknik Gerakan" subtitle="Contoh cara melakukan gerakan dengan form yang benar" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TECHNIQUE_VIDEOS.map((v) => (
            <div key={v.label} className="overflow-hidden rounded-2xl border border-neutral-100">
              <video src={v.url} autoPlay muted loop playsInline preload="metadata" className="aspect-square w-full object-cover" />
              <div className="p-2.5">
                <div className="text-xs font-extrabold">{v.label}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">{v.cue}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly calendar */}
      {view === 'minggu' && (
        <div className="space-y-3">
          {DOW.map((d, i) => {
            const p = week[i]
            return (
              <Card key={d} className={'!p-4 ' + (p ? '' : 'opacity-60')}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{d}</div>
                  {p ? <Badge tone="brand">{p.emoji} {p.title}</Badge> : <Badge tone="neutral">Istirahat</Badge>}
                </div>
                {p && (
                  <>
                    <div className="mt-1 text-[11px] font-semibold text-brand-dark">{p.focus}</div>
                    <div className="mt-2 space-y-2">
                      {p.items.map((ex) => {
                        const img = techniqueImage(ex.name)
                        return (
                          <div key={ex.name} className="flex gap-2.5 rounded-xl bg-neutral-50 p-2.5">
                            {img && (
                              <img src={img} alt={`Teknik ${ex.name}`} loading="lazy"
                                className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200 bg-white object-cover" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className="text-xs font-bold">{ex.name}</span>
                                <span className="text-[11px] font-extrabold text-brand-dark">
                                  {[ex.sets, ex.dur, ex.dist].filter(Boolean).join(' · ')}
                                </span>
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-neutral-500">
                                {ex.rest && <span>⏸ Istirahat: {ex.rest}</span>}
                                {ex.pace && <span>🎯 {ex.pace}</span>}
                              </div>
                              <div className="mt-0.5 text-[10px] italic text-neutral-400">💡 {ex.cue}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Month mesocycle */}
      {view === 'bulan' && (
        <Card className="!p-5">
          <SectionTitle icon={<IconTimer size={20} />} title="Mesosiklus 4 Minggu" subtitle="Progressive overload + deload — konsistensi mengalahkan intensitas" />
          <div className="mt-3 space-y-2">
            {[
              { w: 'Minggu 1', pct: '100%', desc: 'Volume dasar sesuai jadwal mingguan. Catat semua beban/pace (baseline).', tone: 'brand' as const },
              { w: 'Minggu 2', pct: '+5-10%', desc: 'Progression: tambah SATU variabel — beban, repetisi, ATAU durasi. Bukan semuanya.', tone: 'brand' as const },
              { w: 'Minggu 3', pct: '+10-15%', desc: 'Minggu terberat (overload puncak). Tidur 7-9 jam wajib; protein terjaga.', tone: 'low' as const },
              { w: 'Minggu 4', pct: '-40%', desc: 'DELOAD: volume dipotong, intensitas ringan. Adaptasi & superkompensasi terjadi di sini.', tone: 'neutral' as const },
            ].map((m) => (
              <div key={m.w} className="flex items-start gap-3 rounded-xl border border-neutral-100 p-3">
                <Badge tone={m.tone}>{m.w}</Badge>
                <div>
                  <div className="text-sm font-extrabold">{m.pct} volume</div>
                  <p className="text-[11px] leading-relaxed text-neutral-500">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Year macrocycle */}
      {view === 'tahun' && (
        <Card className="!p-5">
          <SectionTitle icon={<IconChartUp size={20} />} title="Makrosiklus 12 Bulan" subtitle="Periodisasi tahunan menuju puncak — pola tim juara" />
          <div className="mt-3 space-y-2">
            {[
              { p: 'Bulan 1-3 · Base', desc: 'Fondasi aerobik (Zone 2 dominan) + teknik & kekuatan dasar. ACWR stabil 0.9-1.1.' },
              { p: 'Bulan 4-6 · Build', desc: 'Tambah intensitas: Norwegian 4×4, tempo, progressive overload gym. VO₂max mulai naik.' },
              { p: 'Bulan 7-9 · Peak', desc: 'Sesi kunci spesifik target (lomba/tes). Volume tinggi → taper 2 minggu sebelum momen penting.' },
              { p: 'Bulan 10 · Race / Test', desc: 'Puncak performa: ulangi Cooper Test / lomba. Bandingkan dengan baseline.' },
              { p: 'Bulan 11-12 · Transisi', desc: 'Recovery aktif, olahraga lain yang menyenangkan, evaluasi & rencana tahun berikutnya.' },
            ].map((m) => (
              <div key={m.p} className="rounded-xl border border-neutral-100 p-3">
                <div className="text-sm font-extrabold text-brand-dark">{m.p}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Longevity panel — user's own numbers */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Panel Longevity Anda" subtitle="VO₂max, kekuatan, massa otot, glukosa — kompetensi inti Panaceamed" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label={<>VO₂max (dari jam/tes)<PrefillBadge show={hasHealth('vo2max')} /></>}><input className={inputClass} type="number" min={0} value={vo2Now || ''} placeholder="mis. 40" onChange={(e) => setVo2Now(+e.target.value)} onBlur={() => pushBiometrics({ vo2max: vo2Now })} /></Field>
          <Field label="Cooper 12 mnt ALL-OUT (m)"><input className={inputClass} type="number" value={cooper || ''} placeholder="mis. 2200" onChange={(e) => setCooper(+e.target.value)} /></Field>
          <Field label="Berat (kg)"><input className={inputClass} type="number" value={weightKg || ''} placeholder="mis. 70" onChange={(e) => { setWeightKg(+e.target.value); setDemo({ weightKg: +e.target.value }) }} /></Field>
        </div>
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[10px] leading-relaxed text-amber-800">
          ⚠️ Cooper Test = lari <b>sekuat mungkin selama 12 menit</b> (bukan pace lari santai). Jangan isi kolom Cooper dengan pace easy run — hasilnya akan salah-rendah. Untuk analisis dari lari biasa, pakai <b>Pelatih Lari Personal</b> di atas.
        </div>

        <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">VO₂max Cooper (all-out)</div>
              <div className="text-2xl font-extrabold text-brand">{cooper > 600 ? vo2FromCooper.toFixed(1) : '—'}</div>
              <div className="text-[10px] text-white/50">{cooper > 600 && cooper < 1600 && vo2Now - vo2FromCooper > 8 ? '↯ jauh di bawah VO₂max jam Anda — kemungkinan tes tidak all-out' : '(jarak − 504.9) ÷ 44.73'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Target realistis</div>
              <div className="text-2xl font-extrabold text-amber-300">{vo2Now > 0 ? vo2Target : '—'}</div>
              <div className="text-[10px] text-white/50">{vo2Now > 0 ? `±${monthsToTarget} bulan dgn 4×4 rutin (≈+0.5/bln)` : 'isi VO₂max Anda'}</div>
            </div>
          </div>
          <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${Math.min(100, (vo2Now / vo2Target) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/80">
            VO₂max sangat bisa dilatih — pemula naik 15-30% dalam 8-12 minggu.
            Resep: <b>2× Norwegian 4×4</b> + <b>3× Zone 2</b> (45-60 mnt) + <b>2× strength</b> per minggu.
            Naik 1 MET (±3.5 ml/kg/mnt) menurunkan risiko kematian ~12-17%.
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { t: '💪 Grip Strength (prediksi mortalitas)', d: 'Dead hang 3×maks + farmer carry 2×/mgg. Target hang 60+ dtk. Tiap −5 kg grip ≈ +16% risiko kematian (PURE study).' },
            { t: '🦵 Leg Strength (mobilitas & anti-jatuh)', d: 'Squat/sit-to-stand: target 30 dtk ≥ 25× (usia 20-an). Kaki kuat = prediktor terbaik kemandirian di usia tua.' },
            { t: '🥩 Massa Otot (metabolik & imun)', d: `Protein ${protein} g/hari (1.6 g/kg), resistance training 3×/mgg progresif. Otot = organ endokrin anti-inflamasi.`},
            { t: '🩸 Glukosa & Sensitivitas Insulin', d: 'Jalan 10-15 mnt setelah makan, Zone 2 rutin, tidur cukup. Otot yang terlatih = "spons glukosa".' },
            { t: '⚖️ Tes Keseimbangan & Fungsi', d: 'One-leg stand target 30+ dtk (10 dtk gagal = red flag); sitting-rising test target skor 8+; gait speed ≥1.0 m/dtk.' },
            { t: '🧠 Mental & Stres', d: 'Meditasi 10 mnt/hari + jurnal syukur. Stres kronis menaikkan kortisol → menghambat semua adaptasi di atas.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-xs font-extrabold">{x.t}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-neutral-400">
          Referensi: Mandsager 2018 (JAMA — kebugaran & mortalitas), Helgerud 2007 (4×4), PURE study (grip),
          Rikli & Jones (tes fungsional), Northwestern Mutual Lifespan Calculator & Longevity Illustrator (proyeksi umur).
        </p>
      </Card>

      {/* Music */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold">🎧 Musik latihan</div>
          <div className="flex gap-2">
            <a href="https://open.spotify.com/genre/workout" target="_blank" rel="noreferrer" className="rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-white active:scale-95">Spotify</a>
            <a href="https://music.apple.com/us/room/6451822724" target="_blank" rel="noreferrer" className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white active:scale-95"> Apple Music</a>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs text-brand-dark">
        🖼️ Ilustrasi teknik gerakan kini tampil otomatis pada Squat, Push-up/Bench Press, Deadlift, Pull-up, Hip Thrust, Overhead Press & sesi lari — akan terus ditambah untuk gerakan lainnya.
        Log beban gym cepat ada di <a href="#/fitness-test" className="font-bold underline">Tes Fisik</a>, jurnal RPE di <a href="#/logs" className="font-bold underline">Log & Statistik</a>.
      </div>
    </div>
  )
}

export default TrainingPlan
