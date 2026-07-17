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
  { label: 'Squat', cue: 'Chest up · knees track toes · thighs parallel to floor', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023249_bb1e8e4f-d292-4726-a8b3-f62731dcb892.mp4' },
  { label: 'Push-up', cue: 'Straight line head-to-heel · elbows 45° · controlled descent', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023318_072af872-419c-4a8e-ad89-cc8668ffdfae.mp4' },
  { label: 'Running Form', cue: 'Midfoot strike · slight forward lean · relaxed arms at 90°', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023308_424ad8f6-42e7-497a-9976-7182c1b0d367.mp4' },
  { label: 'Deadlift', cue: 'Neutral spine · bar close to shins · drive through the floor', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030244_5bb8852a-7225-47bc-800a-8565d1c145ea.mp4' },
  { label: 'Pull-up', cue: 'Full hang at the bottom · chin over the bar · no swinging', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030300_85444d19-b286-40e6-8f47-203d6957134a.mp4' },
  { label: 'Hip Thrust', cue: 'Upper back on bench · drive through heels · squeeze 1 sec at the top', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030311_c9fa30bd-3f0f-4581-a9a5-a32b7f1de3dc.mp4' },
  { label: 'Swimming (Freestyle)', cue: 'High elbow catch · body rotation · head still, breathe to the side', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030336_6140502e-4fbf-4895-8e40-9f9cff3abca3.mp4' },
  { label: 'Cycling', cue: 'Flat back · relaxed elbows · smooth pedal stroke at ~90 rpm cadence', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_030348_8f39a332-9b8b-4bb3-82b0-2f47a811b0ae.mp4' },
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
    full: { title: 'Full Body Strength', emoji: '🏋️', focus: 'Full-body strength + grip', items: [
      { name: 'Squat / Goblet Squat', sets: s('3×8', '4×6-8', '5×5'), rest: '120 sec', cue: 'Chest up, knees track toes, thighs parallel to floor.' },
      { name: 'Push-up / Bench Press', sets: s('3×8-10', '4×8', '5×5'), rest: '90 sec', cue: 'Scapula retracted, lower for 2 sec, elbows at 45°.' },
      { name: 'Deadlift / Hip Hinge', sets: s('3×6', '4×5', '5×3-5'), rest: '150 sec', cue: 'Neutral spine, drive the floor, bar close to shins.' },
      { name: 'Dead Hang (grip!)', dur: s('3×20 sec', '3×40 sec', '3×60 sec'), rest: '60 sec', cue: 'Passive hang — strong grip predicts longevity.' },
      { name: 'Farmer Carry', dist: s('3×20 m', '3×30 m', '4×40 m'), rest: '90 sec', cue: 'Shoulders down, core braced, short stable steps.' },
    ]},
    upper: { title: 'Upper Body', emoji: '💪', focus: 'Chest, shoulders, back, arms', items: [
      { name: 'Bench / Push-up', sets: s('3×8', '4×8', '5×5'), rest: '120 sec', cue: 'Feet planted firmly, drive explosively.' },
      { name: 'Pull-up / Lat Pulldown', sets: s('3×5-8', '4×6-8', '5×5'), rest: '120 sec', cue: 'Pull elbows to hips, chest to bar.' },
      { name: 'Overhead Press', sets: s('3×8', '4×6', '5×5'), rest: '120 sec', cue: 'Glutes braced, head forward once the bar passes.' },
      { name: 'Row', sets: s('3×10', '4×8', '4×6'), rest: '90 sec', cue: 'Pull with the back, not the arms.' },
    ]},
    lower: { title: 'Lower Body', emoji: '🦵', focus: 'Legs — predictor of mobility & fall prevention', items: [
      { name: 'Back Squat / Leg Press', sets: s('3×8', '4×6-8', '5×5'), rest: '150 sec', cue: 'Controlled 2-3 sec descent, drive up with full force.' },
      { name: 'Romanian Deadlift', sets: s('3×8', '4×8', '4×6'), rest: '120 sec', cue: 'Feel the hamstring lengthen, keep the back straight.' },
      { name: 'Bulgarian Split Squat', sets: s('3×8/leg', '3×10/leg', '4×8/leg'), rest: '90 sec', cue: 'Torso slightly leaning, knee stable.' },
      { name: 'Calf Raise + Fast Sit-to-Stand', sets: s('3×12', '4×12', '4×15'), rest: '60 sec', cue: 'Explosive sit-to-stand trains leg power for healthy aging.' },
    ]},
    glutes: { title: 'Glutes Focus', emoji: '🍑', focus: 'Gluteus max/med for posture & power', items: [
      { name: 'Hip Thrust', sets: s('3×10', '4×8-10', '5×8'), rest: '120 sec', cue: 'Chin tucked, drive through the heels, hold 1 sec at the top.' },
      { name: 'Sumo Deadlift', sets: s('3×8', '4×6', '4×5'), rest: '150 sec', cue: 'Knees out, chest up.' },
      { name: 'Cable Kickback / Glute Bridge', sets: s('3×12', '3×15', '4×12'), rest: '60 sec', cue: 'Full squeeze at the top of the movement.' },
      { name: 'Side-Lying Abduction', sets: s('3×15', '3×20', '4×15'), rest: '45 sec', cue: 'Small controlled movement — gluteus medius.' },
    ]},
    back: { title: 'Back Focus', emoji: '🔙', focus: 'Thick back & healthy posture', items: [
      { name: 'Pull-up / Assisted', sets: s('3×5', '4×6-8', '5×5+'), rest: '120 sec', cue: 'Full hang at the bottom, chest to bar.' },
      { name: 'Barbell / DB Row', sets: s('3×10', '4×8', '4×6'), rest: '120 sec', cue: 'Pull to the navel, pause 1 sec.' },
      { name: 'Lat Pulldown', sets: s('3×10', '3×12', '4×10'), rest: '90 sec', cue: 'Lower to the upper chest, elbows down and back.' },
      { name: 'Face Pull', sets: s('3×15', '3×15', '4×12'), rest: '60 sec', cue: 'Pull to the forehead, external rotation — healthy for the shoulders.' },
    ]},
    arms: { title: 'Arms (Bicep + Tricep)', emoji: '💪', focus: 'Arms', items: [
      { name: 'Barbell / DB Curl', sets: s('3×10', '4×8-10', '4×8'), rest: '75 sec', cue: 'Elbows pinned to the sides, lower for 3 sec.' },
      { name: 'Hammer Curl', sets: s('3×10', '3×12', '4×10'), rest: '60 sec', cue: 'Neutral grip — brachialis & grip strength.' },
      { name: 'Close-Grip Bench / Dips', sets: s('3×8', '4×8', '4×6-8'), rest: '90 sec', cue: 'Elbows close to the body.' },
      { name: 'Overhead Tricep Ext.', sets: s('3×12', '3×12', '4×10'), rest: '60 sec', cue: 'Elbows pointing forward, full stretch.' },
    ]},
    core: { title: 'Core & Waist', emoji: '🎯', focus: 'Waist, abs & stability', items: [
      { name: 'Plank', dur: s('3×30 sec', '3×45 sec', '3×75 sec'), rest: '45 sec', cue: 'Straight line head-to-heel, glutes engaged.' },
      { name: 'Side Plank', dur: s('3×20 sec/side', '3×30 sec/side', '3×45 sec/side'), rest: '45 sec', cue: 'Hips high — obliques for waist definition.' },
      { name: 'Dead Bug', sets: s('3×8/side', '3×10/side', '3×12/side'), rest: '45 sec', cue: 'Lower back pressed to the floor.' },
      { name: 'Pallof Press', sets: s('3×10/side', '3×12/side', '3×12/side'), rest: '45 sec', cue: 'Anti-rotation, steady breathing.' },
    ]},
  }
  return lib[focus]
}

// ── Cardio / runner building blocks ──────────────────────────────────────────
function cardioDay(kind: string, level: Level): DayPlan {
  const s = (b: string, m: string, a: string) => vol(level, b, m, a)
  switch (kind) {
    case 'easy': return { title: 'Easy Run (Zone 2)', emoji: '🏃', focus: 'Aerobic base — the longevity engine', items: [
      { name: 'Conversational easy run', dur: s('25-30 min', '40-50 min', '60-75 min'), pace: 'Zone 2 (60-70% HRmax) — still able to speak in full sentences', cue: 'If you\'re out of breath, SLOW DOWN. 80% of weekly volume should be here.' },
    ]}
    case 'tempo': return { title: 'Tempo Run', emoji: '⏱️', focus: 'Raising the lactate threshold', items: [
      { name: 'Warm-up', dur: '10 min', pace: 'Zone 1-2', cue: 'Progressive, finish with 4×20 sec strides.' },
      { name: 'Tempo', dur: s('2×8 min (3 min rest)', '20 min continuous', '2×15 min (3 min rest)'), pace: '"Comfortably hard" — Zone 3-4, able to speak 3-4 words', cue: 'Keep a steady rhythm, don\'t start too fast.' },
      { name: 'Cool-down', dur: '10 min', pace: 'Zone 1', cue: 'Easy walk/jog.' },
    ]}
    case 'interval': return { title: 'Interval', emoji: '⚡', focus: 'VO₂max & speed', items: [
      { name: 'Warm-up', dur: '12 min + 4 strides', pace: 'Zone 1-2', cue: 'Mandatory — prevents injury.' },
      { name: 'Interval', sets: s('5×2 min hard (2 min jog recovery)', '6×3 min (2 min rest)', '5×4 min (3 min rest)'), pace: 'Zone 4-5 (90-95% HRmax)', cue: 'The last rep should be as fast as the first.' },
      { name: 'Cool-down', dur: '10 min', pace: 'Zone 1', cue: 'Easy jog.' },
    ]}
    case 'long': return { title: 'Long Run', emoji: '🛣️', focus: 'Endurance & fat efficiency', items: [
      { name: 'Long run', dur: s('50-60 min', '75-90 min', '100-150 min'), dist: s('7-9 km', '12-16 km', '18-28 km'), pace: 'Zone 2, 60-75 sec/km slower than 10K pace', cue: 'Bring water; gel/carbs every 40 min if >75 min.' },
    ]}
    case '4x4': return { title: 'Norwegian 4×4', emoji: '🇳🇴', focus: 'Proven VO₂max protocol (~+0.5/month)', items: [
      { name: 'Warm-up', dur: '10 min', pace: 'Zone 2', cue: 'Gradually raise HR.' },
      { name: '4× (4 min hard + 3 min recovery)', sets: '4 reps', pace: 'Interval: 85-95% HRmax · Recovery: jog 60-70%', cue: 'Aim for heavy but controlled breathing; don\'t sprint yourself out in minute 1.' },
      { name: 'Cool-down', dur: '5-10 min', pace: 'Zone 1', cue: 'Total session ±40 min. 1-2×/week is enough.' },
    ]}
    case '8x300': return { title: '8×300m', emoji: '🎯', focus: 'Speed & running economy', items: [
      { name: 'Warm-up', dur: '15 min + drills (A-skip, high knees)', pace: 'Zone 1-2', cue: 'Drills improve technique.' },
      { name: '8×300m', sets: '8 reps', rest: s('walk 3 min', 'jog 200m (90 sec)', 'jog 100m (60 sec)'), pace: '3K-5K pace (fast but even)', cue: 'Relaxed arms, feet landing under the hips.' },
      { name: 'Cool-down', dur: '10 min', pace: 'Zone 1', cue: 'Stretch calves & hamstrings.' },
    ]}
    case 'ladder': return { title: 'VO₂max Ladder', emoji: '🪜', focus: 'Pyramid interval variation', items: [
      { name: 'Warm-up', dur: '12 min', pace: 'Zone 2', cue: '4 strides at the end.' },
      { name: 'Ladder: 1-2-3-4-3-2-1 min', sets: '1 set', rest: 'jog half the rep duration', pace: 'Zone 4-5, shorter reps get faster', cue: 'Manage your effort — stay strong at the top of the ladder.' },
      { name: 'Cool-down', dur: '10 min', pace: 'Zone 1', cue: 'Easy jog.' },
    ]}
    case 'cycle': return { title: 'Cycling (GPS)', emoji: '🚴', focus: 'Speed & pace via GPS tracker', items: [
      { name: 'Endurance ride', dur: s('45 min', '75 min', '2-3 hours'), pace: 'Zone 2 — steady speed (monitor on GPS Tracker)', cue: 'Cadence 85-95 rpm, relaxed position.' },
      { name: 'Interval (optional)', sets: s('4×2 min', '5×3 min', '6×4 min'), rest: 'easy spin 3 min', pace: 'Zone 4', cue: 'Use GPS speed/pace for consistency across reps.' },
    ]}
    case 'swim': return { title: 'Swimming (GPS)', emoji: '🏊', focus: 'Technique + speed/pace (open water via GPS)', items: [
      { name: 'Warm-up', dist: '200-400 m', pace: 'Easy', cue: 'Mixed strokes, focus on breathing.' },
      { name: 'Technique drill', sets: s('4×50 m', '6×50 m', '8×50 m'), rest: '20 sec', cue: 'Catch-up drill, hip rotation, head still.' },
      { name: 'Main set', sets: s('6×100 m', '8×100 m', '10×150 m'), rest: '20-30 sec', pace: 'Controlled pace per 100m (GPS: speed/pace; depth & pressure from dive watch only)', cue: 'Even pace — last rep matches the first.' },
      { name: 'Cool-down', dist: '200 m', pace: 'Easy', cue: 'Relaxed backstroke.' },
    ]}
    case 'hiit': return { title: 'HIIT Full Body', emoji: '🔥', focus: 'Fat burn & anaerobic capacity', items: [
      { name: 'Circuit: burpee, mountain climber, squat jump, push-up', sets: s('4 rounds × 30 sec work/30 sec rest', '5 rounds × 40/20', '6 rounds × 45/15'), rest: '2 min between rounds', cue: 'Movement quality > speed; maintain form when tired.' },
      { name: 'Finisher plank', dur: '2×45 sec', rest: '30 sec', cue: 'Steady breathing.' },
    ]}
    default: return cardioDay('easy', level)
  }
}

function recoveryDay(): DayPlan {
  return { title: 'Active Recovery', emoji: '🧘', focus: 'Adaptation happens during recovery', items: [
    { name: 'Easy walk / light cycling', dur: '20-30 min', pace: 'Zone 1', cue: 'Light movement promotes recovery.' },
    { name: 'Mobility & stretching', dur: '10-15 min', cue: 'Hip flexor, hamstring, thoracic spine.' },
    { name: 'One-leg stand (balance test)', dur: '3×30 sec/leg', cue: 'Eyes open then try closed — a longevity predictor.' },
    { name: 'Breathwork / meditation', dur: '10 min', cue: '4-7-8 breathing lowers stress & improves HRV.' },
  ]}
}

function mentalDay(): DayPlan {
  return { title: 'Mental Strength', emoji: '🧠', focus: 'Champion mentality (Seahawks-style mindfulness)', items: [
    { name: 'Guided meditation', dur: '10-15 min', cue: 'Focus on breath; when the mind wanders, bring it back without judgment.' },
    { name: 'Performance visualization', dur: '5 min', cue: 'Imagine a successful session/race with sensory detail.' },
    { name: 'Journal: 3 gratitudes + 1 challenge', dur: '5 min', cue: 'Write by hand — emotional regulation & motivation.' },
    { name: 'Training in discomfort', dur: 'end of cardio session', cue: 'Hold 2 extra minutes when you want to stop — the mental muscle.' },
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

const DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
  if (v >= adj[2]) return { label: 'Very Good', tone: 'brand' }
  if (v >= adj[1]) return { label: 'Good', tone: 'low' }
  if (v >= adj[0]) return { label: 'Fair', tone: 'low' }
  return { label: 'Building Foundation', tone: 'neutral' }
}

const RED_FLAGS = [
  { id: 'faint', label: '😵 Dizziness / near-fainting during exercise' },
  { id: 'chest', label: '💢 Chest pain/pressure during activity' },
  { id: 'palpitation', label: '💓 Abnormal heart palpitations' },
  { id: 'breathless_rest', label: '🫁 Shortness of breath at rest' },
  { id: 'heart_history', label: '🩺 History of heart disease / high blood pressure' },
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
    ? { l: 'Already achieved 🎉', tone: 'brand' as const, d: 'Your estimate is already above the target — focus on maintaining it & sharpening your test pacing.' }
    : monthsNeeded <= months
    ? { l: 'Realistic', tone: 'brand' as const, d: `Needs ~${monthsNeeded.toFixed(1)} months; you have ${months}. Consistency = very doable.` }
    : monthsNeeded <= months * 1.4
    ? { l: 'Challenging (stretch)', tone: 'low' as const, d: `Needs ~${monthsNeeded.toFixed(1)} months vs ${months} available. Doable, but without compromising consistency & recovery.` }
    : { l: 'Very aggressive', tone: 'critical' as const, d: `Needs ~${monthsNeeded.toFixed(1)} months. Chasing ${targetM}m in ${months} months risks injury. A target of ~${Math.round((vo2max + months * 1.2) * 44.73 + 504.9)}m is safer.` }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Personal Running Coach" subtitle="Enter your last run — get a true VO₂max, personal pace zones & a realistic plan" />

      {/* Safety red-flag screen — a duty-of-care gate before intense running. */}
      <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
        <div className="text-xs font-extrabold text-rose-700">🛡️ Safety Screening (answer honestly before intense running)</div>
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
            <b>Stop for now — see a doctor before high-intensity training or the Cooper Test.</b> The symptoms you flagged (especially dizziness/near-fainting or chest pain during exercise) should be evaluated (ECG + cardiac exam) to confirm it's safe. In the meantime, limit yourself to brisk walking and never train to the point of near-fainting.
            <div className="mt-2"><a href="#/consult" className="font-bold underline">Consult a doctor</a> · <a href="#/hospitals" className="font-bold underline">Nearest facility</a></div>
          </div>
        )}
      </div>

      {/* Honest current ability */}
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">How long can you run CONTINUOUSLY without stopping?</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {([['u1', '<1 min'], ['m1_5', '1-5 min'], ['m5_15', '5-15 min'], ['m15_30', '15-30 min'], ['m30p', '30+ min']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setCont(k)} className={'rounded-xl py-2 text-xs font-bold ' + (cont === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{l}</button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-neutral-400">Answer honestly based on a comfortable easy run, not a sprint. This is what shapes your plan.</p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Distance (km)"><input className={inputClass} type="number" step={0.1} value={km || ''} placeholder="e.g. 3" onChange={(e) => setKm(+e.target.value)} /></Field>
        <Field label="Time (minutes)"><input className={inputClass} type="number" value={min || ''} placeholder="e.g. 25" onChange={(e) => setMin(+e.target.value)} /></Field>
        <Field label="How hard was it?">
          <select className={inputClass} value={effort} onChange={(e) => setEffort(e.target.value as typeof effort)}>
            <option value="easy">Easy (could chat)</option>
            <option value="moderate">Moderate (fairly hard)</option>
            <option value="hard">All-out (maximal)</option>
          </select>
        </Field>
        <Field label="Age / Sex">
          <div className="flex gap-1">
            <input className={inputClass + ' w-14'} type="number" value={age} onChange={(e) => updAge(+e.target.value)} />
            <select className={inputClass} value={g} onChange={(e) => updSex(e.target.value as 'M' | 'F')}><option value="M">M</option><option value="F">F</option></select>
          </div>
        </Field>
      </div>

      {/* Honest VO2max */}
      <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Your Estimated VO₂max</div>
            <div className="text-3xl font-extrabold text-brand">{vo2max > 0 ? vo2max.toFixed(0) : '—'}<span className="ml-1 text-sm text-white/50">ml/kg/min</span></div>
            <div className="text-[10px] text-white/50">this run's pace: {fmtPace(runPaceSec)}/km · O₂ at that pace {vo2atRun.toFixed(0)}</div>
          </div>
          {cat && <Badge tone={cat.tone}>{cat.label}</Badge>}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/80">
          {effort === 'easy'
            ? '⚠️ Because this was an EASY run, your actual VO₂max is FAR higher than simply converting this pace to a Cooper Test. Easy runs are SUPPOSED to feel slow — that\'s the correct principle (80% of training should be easy).'
            : effort === 'moderate'
            ? 'Calculated from moderate effort, adjusted to an estimated VO₂max. For an exact number, do an all-out 12-minute test.'
            : 'Great — this was maximal effort, so the estimate is most accurate. This is equivalent to a true Cooper Test.'}
        </p>
      </div>

      {/* Encouraging reframe */}
      {vo2max > 0 && (
        <div className="mt-3 rounded-xl bg-brand-50 p-3 text-[12px] leading-relaxed text-brand-dark">
          💚 <b>An honest perspective:</b> {km >= 1 ? `being able to run ${km} km continuously already puts you ahead of the majority of people who can't run 1 km. ` : ''}
          VO₂max is the <b>most trainable</b> capacity — beginners commonly gain <b>15-30% in 8-12 weeks</b> of structured training.
          Don't compare your <i>easy</i> run to someone else's <i>race</i> pace; that's apples to oranges.
        </div>
      )}

      {/* Personal pace zones */}
      {pace5kSec > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Your Personal Pace Zones (min/km)</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Recovery', zone(105), 'very easy'],
              ['Easy / Zone 2', zone(85), '80% of training here'],
              ['Long run', zone(70), 'endurance'],
              ['Tempo / Threshold', zone(22), '"comfortably hard"'],
              ['Interval / VO₂max', zone(0), 'raises the ceiling'],
              ['Fast / Strides', zone(-12), '15-20 sec explosive'],
            ].map(([l, p, d]) => (
              <div key={l} className="rounded-xl border border-neutral-100 p-2.5">
                <div className="text-[10px] font-bold text-neutral-400">{l}</div>
                <div className="text-base font-extrabold text-brand-dark">{p}</div>
                <div className="text-[9px] text-neutral-400">{d}</div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-400">Derived from your VO₂max (Jack Daniels method). Run easy runs in the Easy zone — going faster damages your aerobic base.</p>
        </div>
      )}

      {/* Progressive plan for their level */}
      <div className="mt-3">
        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">8-Week Plan — Tailored to Your Level</div>
        <div className="mt-2 space-y-2">
          {(level === 0
            ? [
                { w: 'Week 1-2', d: 'Run-walk: run 1 min / walk 2 min × 8. 3×/week. Goal: get used to moving without injury.' },
                { w: 'Week 3-4', d: 'Run 2 min / walk 1 min × 8. Add 1 brisk 30-min walking session.' },
                { w: 'Week 5-6', d: 'Run 5 min / walk 1 min × 5. Start being able to run 10-15 min continuously.' },
                { w: 'Week 7-8', d: 'Run continuously for 20-25 min easy. You are officially a runner!' },
              ]
            : level === 1
            ? [
                { w: 'Week 1-2', d: `3× easy runs of 20-30 min at ${zone(85)} pace. Focus on consistency, not speed.` },
                { w: 'Week 3-4', d: 'Extend 1 easy run to 35-40 min. Add 4×20 sec strides at the end of 1 session.' },
                { w: 'Week 5-6', d: `Add 1 short tempo session: 2×6 min at ${zone(22)} pace (2 min walk rest).` },
                { w: 'Week 7-8', d: 'Retest: an all-out 12-minute run (true Cooper) — see how much your number jumps.' },
              ]
            : [
                { w: 'Week 1-2', d: `Base: 3× easy ${zone(85)} (30-40 min) + 1 long run ${zone(70)} (45 min). All of it MUST feel easy.` },
                { w: 'Week 3-4', d: `Add quality: 1× tempo 3×8 min @ ${zone(22)}. Keep easy runs easy.` },
                { w: 'Week 5-6', d: `Raise VO₂max: 1× Norwegian 4×4 (4 min hard @ ${zone(0)} + 3 min jog) + 1 tempo. Long run 60 min.` },
                { w: 'Week 7-8', d: 'Deload week 7 (−40%), then Week 8 all-out 12-minute test. Target gain of 1-3 ml/kg/min.' },
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
            ? '🎯 The golden recipe for raising your VO₂max: 80% easy running + 20% hard (Norwegian 4×4 & tempo), strength 2×/week, sleep 7-9 hours. Patience beats intensity.'
            : 'Start with run-walk — this is the PROVEN & safest approach for beginners. Don\'t rush; consistency 3×/week matters far more than speed.'}
        </p>
      </div>

      {/* Symptom troubleshooting — the exact things that go wrong for beginners */}
      <div className="mt-4">
        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Fixing Common Complaints While Running</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            { s: '🦵 Calves sore/tight from the start', d: 'You\'re landing on your toes / running too fast. Fix: 5-min walking warm-up + ankle circles; land MIDFOOT right under the hips; slow down. Strengthen calves: calf raise 3×15, 3×/week. Increase distance by at most +10%/week.' },
            { s: '🫁 Quickly out of breath (300m)', d: 'You started too fast → straight into anaerobic. Fix: start VERY slow — talk test: if you can\'t say a full sentence, SLOW DOWN or walk. Rhythmic breathing (inhale 2-3 steps, exhale 2-3 steps).' },
            { s: '😵 Dizzy/unsteady (500m)', d: '⚠️ Never push to this point. It can come from overbreathing, low blood sugar, dehydration — BUT must be checked by a doctor first (could be heart-related). Meanwhile: only brisk walking, stay hydrated, eat 1-2 hours before.' },
            { s: '🎽 Get tired fast even at short distances', d: 'The aerobic base hasn\'t been built yet — that\'s NORMAL & improves quickly. Run-walk 3×/week for 3-4 weeks will dramatically change your endurance.' },
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
        <div className="text-xs font-extrabold text-brand-dark">🎯 Your Cooper Test Target</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Target distance (m)"><input className={inputClass} type="number" value={targetM} onChange={(e) => setTargetM(+e.target.value)} /></Field>
          <Field label="Time available (months)"><input className={inputClass} type="number" value={months} onChange={(e) => setMonths(+e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={verdict.tone}>{verdict.l}</Badge>
          <span className="text-[11px] text-neutral-500">Target ≈ VO₂max {targetVo2.toFixed(0)} · You currently ≈ {vo2max.toFixed(0)}</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600">{verdict.d}</p>
        <div className="mt-3 space-y-1.5">
          {[
            { m: 'Month 1', d: canRunCont ? 'Aerobic base: run-walk → continuous easy runs of 30 min. No hard sessions. Strengthen calves & core.' : 'Run-walk (run 1-2 min/walk 1-2 min). Goal: run 10 min continuously. See a doctor if there are symptoms.' },
            { m: 'Month 2', d: 'Build volume: 3-4× easy runs, 1 long run gradually increasing. Add 4×20 sec strides. Easy MUST feel easy.' },
            { m: 'Month 3', d: 'Start threshold work: 1× tempo/week. Trial 12-minute test #1 — measure progress without pressure.' },
            { m: 'Month 4', d: 'Raise VO₂max: 1× Norwegian 4×4/week + 1 tempo + 2 easy + 1 long. Strength 2×.' },
            { m: 'Month 5', d: 'Test-specific peak: intervals resembling Cooper pace (e.g. 6×3 min). Practice even pacing — don\'t sprint the start.' },
            { m: 'Month 6 (January)', d: 'Weeks 1-2 taper (−40% volume, maintain intensity). Official Cooper Test. Strategy: 4 even laps, save energy for the final 2 minutes.' },
          ].map((x) => (
            <div key={x.m} className="flex gap-2 rounded-lg bg-white/70 p-2.5">
              <span className="shrink-0 text-[10px] font-extrabold text-brand-dark">{x.m}</span>
              <span className="text-[11px] leading-relaxed text-neutral-600">{x.d}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          Cooper Test-day strategy: <b>don't sprint the start</b> (a fatal mistake). Split 4 even laps; if you still feel strong in the last 2 minutes, then empty the tank. Even pacing beats a fast start by 100-200m.
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
        <SectionTitle icon={<IconActivity size={20} />} title="AI Training Planner" subtitle="A neatly structured program: schedule, reps, duration, rest, pace & technique" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Field label="Goal">
              <select className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Level">
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              <option value="pemula">Beginner</option><option value="menengah">Intermediate</option><option value="lanjut">Advanced</option>
            </select>
          </Field>
          <Field label="Training days/week">
            <select className={inputClass} value={days} onChange={(e) => setDays(+e.target.value)}>
              {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex gap-1.5">
          {(['minggu', 'bulan', 'tahun'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={'flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ' + (view === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {v === 'minggu' ? '📅 Week' : v === 'bulan' ? '🗓️ Month' : '📆 Year'}
            </button>
          ))}
        </div>
      </Card>

      {/* Personal Running Coach — accurate VO₂max + pace zones + plan */}
      <RunnerCoach />

      {/* Movement technique videos (Higgsfield) */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Movement Technique Videos" subtitle="Examples of how to perform movements with correct form" />
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
                  {p ? <Badge tone="brand">{p.emoji} {p.title}</Badge> : <Badge tone="neutral">Rest</Badge>}
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
                              <img src={img} alt={`Technique: ${ex.name}`} loading="lazy"
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
                                {ex.rest && <span>⏸ Rest: {ex.rest}</span>}
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
          <SectionTitle icon={<IconTimer size={20} />} title="4-Week Mesocycle" subtitle="Progressive overload + deload — consistency beats intensity" />
          <div className="mt-3 space-y-2">
            {[
              { w: 'Week 1', pct: '100%', desc: 'Base volume per the weekly schedule. Log all loads/pace (baseline).', tone: 'brand' as const },
              { w: 'Week 2', pct: '+5-10%', desc: 'Progression: add ONE variable — load, reps, OR duration. Not everything at once.', tone: 'brand' as const },
              { w: 'Week 3', pct: '+10-15%', desc: 'The hardest week (peak overload). 7-9 hours of sleep is mandatory; keep protein up.', tone: 'low' as const },
              { w: 'Week 4', pct: '-40%', desc: 'DELOAD: volume cut, low intensity. Adaptation & supercompensation happen here.', tone: 'neutral' as const },
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
          <SectionTitle icon={<IconChartUp size={20} />} title="12-Month Macrocycle" subtitle="Annual periodization toward a peak — the champion team's pattern" />
          <div className="mt-3 space-y-2">
            {[
              { p: 'Month 1-3 · Base', desc: 'Aerobic foundation (Zone 2 dominant) + basic technique & strength. ACWR stable at 0.9-1.1.' },
              { p: 'Month 4-6 · Build', desc: 'Add intensity: Norwegian 4×4, tempo, progressive gym overload. VO₂max starts rising.' },
              { p: 'Month 7-9 · Peak', desc: 'Key sessions specific to the target (race/test). High volume → taper 2 weeks before the key moment.' },
              { p: 'Month 10 · Race / Test', desc: 'Peak performance: repeat the Cooper Test / race. Compare against baseline.' },
              { p: 'Month 11-12 · Transition', desc: 'Active recovery, other enjoyable sports, evaluation & next year\'s plan.' },
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
        <SectionTitle icon={<IconHeart size={20} />} title="Your Longevity Panel" subtitle="VO₂max, strength, muscle mass, glucose — Panaceamed's core competency" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label={<>VO₂max (from watch/test)<PrefillBadge show={hasHealth('vo2max')} /></>}><input className={inputClass} type="number" min={0} value={vo2Now || ''} placeholder="e.g. 40" onChange={(e) => setVo2Now(+e.target.value)} onBlur={() => pushBiometrics({ vo2max: vo2Now })} /></Field>
          <Field label="Cooper 12-min ALL-OUT (m)"><input className={inputClass} type="number" value={cooper || ''} placeholder="e.g. 2200" onChange={(e) => setCooper(+e.target.value)} /></Field>
          <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightKg || ''} placeholder="e.g. 70" onChange={(e) => { setWeightKg(+e.target.value); setDemo({ weightKg: +e.target.value }) }} /></Field>
        </div>
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[10px] leading-relaxed text-amber-800">
          ⚠️ Cooper Test = run <b>as hard as possible for 12 minutes</b> (not an easy-run pace). Don't fill the Cooper field with an easy-run pace — the result will be falsely low. For analysis from a regular run, use the <b>Personal Running Coach</b> above.
        </div>

        <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">VO₂max Cooper (all-out)</div>
              <div className="text-2xl font-extrabold text-brand">{cooper > 600 ? vo2FromCooper.toFixed(1) : '—'}</div>
              <div className="text-[10px] text-white/50">{cooper > 600 && cooper < 1600 && vo2Now - vo2FromCooper > 8 ? '↯ far below your watch VO₂max — the test was likely not all-out' : '(distance − 504.9) ÷ 44.73'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Realistic target</div>
              <div className="text-2xl font-extrabold text-amber-300">{vo2Now > 0 ? vo2Target : '—'}</div>
              <div className="text-[10px] text-white/50">{vo2Now > 0 ? `±${monthsToTarget} months with regular 4×4 (≈+0.5/month)` : 'fill in your VO₂max'}</div>
            </div>
          </div>
          <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${Math.min(100, (vo2Now / vo2Target) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/80">
            VO₂max is highly trainable — beginners gain 15-30% in 8-12 weeks.
            Recipe: <b>2× Norwegian 4×4</b> + <b>3× Zone 2</b> (45-60 min) + <b>2× strength</b> per week.
            A 1 MET increase (±3.5 ml/kg/min) lowers mortality risk by ~12-17%.
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { t: '💪 Grip Strength (mortality predictor)', d: 'Dead hang 3×max + farmer carry 2×/week. Target 60+ sec hang. Every −5 kg of grip ≈ +16% mortality risk (PURE study).' },
            { t: '🦵 Leg Strength (mobility & fall prevention)', d: 'Squat/sit-to-stand: target 30 sec ≥ 25× (20s-age level). Strong legs = the best predictor of independence in old age.' },
            { t: '🥩 Muscle Mass (metabolic & immune)', d: `Protein ${protein} g/day (1.6 g/kg), progressive resistance training 3×/week. Muscle = an anti-inflammatory endocrine organ.`},
            { t: '🩸 Glucose & Insulin Sensitivity', d: 'Walk 10-15 min after meals, regular Zone 2, adequate sleep. Trained muscle = a "glucose sponge".' },
            { t: '⚖️ Balance & Function Tests', d: 'One-leg stand target 30+ sec (failing at 10 sec = red flag); sitting-rising test target score of 8+; gait speed ≥1.0 m/sec.' },
            { t: '🧠 Mental & Stress', d: 'Meditate 10 min/day + gratitude journal. Chronic stress raises cortisol → blunts every adaptation above.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-xs font-extrabold">{x.t}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-neutral-400">
          References: Mandsager 2018 (JAMA — fitness & mortality), Helgerud 2007 (4×4), PURE study (grip),
          Rikli & Jones (functional tests), Northwestern Mutual Lifespan Calculator & Longevity Illustrator (lifespan projection).
        </p>
      </Card>

      {/* Music */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold">🎧 Workout Music</div>
          <div className="flex gap-2">
            <a href="https://open.spotify.com/genre/workout" target="_blank" rel="noreferrer" className="rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-white active:scale-95">Spotify</a>
            <a href="https://music.apple.com/us/room/6451822724" target="_blank" rel="noreferrer" className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white active:scale-95"> Apple Music</a>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs text-brand-dark">
        🖼️ Movement technique illustrations now show automatically for Squat, Push-up/Bench Press, Deadlift, Pull-up, Hip Thrust, Overhead Press & running sessions — more movements will keep being added.
        Quick gym load logging is in <a href="#/fitness-test" className="font-bold underline">Physical Test</a>, RPE journal in <a href="#/logs" className="font-bold underline">Logs & Stats</a>.
      </div>
    </div>
  )
}

export default TrainingPlan
