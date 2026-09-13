export type TrainingMode = 'calisthenics' | 'gymnastics' | 'amrap' | 'hyrox'
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced'

export interface TrainingBlock {
  id: string
  label: string
  prescription: string
  cue: string
  category: 'skill' | 'strength' | 'conditioning' | 'mobility' | 'station' | 'run' | 'recovery'
}

export interface DailyTrainingSession {
  mode: TrainingMode
  level: TrainingLevel
  title: string
  subtitle: string
  durationMin: number
  targetRpe: string
  focus: string[]
  blocks: TrainingBlock[]
  finisher?: string
  safety: string[]
}

export interface DailyTrainingReminderSettings {
  enabled: boolean
  time: string
  lastDeliveredDate: string | null
}

export const DAILY_TRAINING_REMINDER_KEY = 'pm_daily_training_reminder_v1'
export const DAILY_TRAINING_COMPLETION_KEY = 'pm_daily_training_completion_v1'

const CALISTHENICS: Record<TrainingLevel, DailyTrainingSession[]> = {
  beginner: [
    {
      mode: 'calisthenics', level: 'beginner', title: 'Push + Core Foundation', subtitle: 'Controlled bodyweight strength', durationMin: 30, targetRpe: 'RPE 5–6', focus: ['push', 'core', 'scapular control'],
      blocks: [
        { id: 'incline-push', label: 'Incline push-up', prescription: '3 × 8–12', cue: 'Body straight, elbows about 30–45° from torso.', category: 'strength' },
        { id: 'scap-push', label: 'Scapular push-up', prescription: '3 × 8–10', cue: 'Keep elbows straight; move only through the shoulder blades.', category: 'skill' },
        { id: 'split-squat', label: 'Split squat', prescription: '3 × 8/side', cue: 'Front foot planted; knee follows the toes.', category: 'strength' },
        { id: 'dead-bug', label: 'Dead bug', prescription: '3 × 6–8/side', cue: 'Keep lower back gently pressed down.', category: 'strength' },
      ],
      safety: ['Stop for sharp pain, dizziness or loss of control.', 'Use an easier angle before adding repetitions.'],
    },
    {
      mode: 'calisthenics', level: 'beginner', title: 'Pull + Legs Foundation', subtitle: 'Grip, posture and lower-body control', durationMin: 32, targetRpe: 'RPE 5–6', focus: ['pull', 'legs', 'grip'],
      blocks: [
        { id: 'row', label: 'Supported/inverted row', prescription: '3 × 6–10', cue: 'Pull chest toward support; do not shrug.', category: 'strength' },
        { id: 'box-squat', label: 'Box squat', prescription: '3 × 10', cue: 'Sit back under control and stand tall.', category: 'strength' },
        { id: 'hang', label: 'Assisted dead hang', prescription: '3 × 15–30 sec', cue: 'Use feet as needed; shoulders stay comfortable.', category: 'skill' },
        { id: 'side-plank', label: 'Side plank', prescription: '3 × 20 sec/side', cue: 'Ribs stacked over pelvis.', category: 'strength' },
      ],
      safety: ['Use a stable bar/support.', 'Do not train through shoulder instability or numbness.'],
    },
  ],
  intermediate: [
    {
      mode: 'calisthenics', level: 'intermediate', title: 'Upper Push/Pull', subtitle: 'Strength + clean reps', durationMin: 40, targetRpe: 'RPE 6–8', focus: ['pull-up', 'dip/push', 'core'],
      blocks: [
        { id: 'pullup', label: 'Pull-up / chin-up', prescription: '4 × 4–8', cue: 'Full controlled hang; avoid kipping unless specifically trained.', category: 'strength' },
        { id: 'pushup', label: 'Push-up progression', prescription: '4 × 8–15', cue: 'Chest and hips rise together.', category: 'strength' },
        { id: 'dip', label: 'Parallel-bar dip or regression', prescription: '3 × 5–10', cue: 'Keep shoulders depressed and pain-free.', category: 'strength' },
        { id: 'hollow', label: 'Hollow body hold', prescription: '4 × 20–35 sec', cue: 'Posterior pelvic tilt; regress if low back lifts.', category: 'skill' },
      ],
      safety: ['Regression is preferred over forced range.', 'Avoid deep dips with anterior shoulder pain.'],
    },
    {
      mode: 'calisthenics', level: 'intermediate', title: 'Legs + Trunk', subtitle: 'Single-leg capacity and anti-extension control', durationMin: 38, targetRpe: 'RPE 6–7', focus: ['single-leg', 'posterior chain', 'trunk'],
      blocks: [
        { id: 'pistol-reg', label: 'Pistol-squat progression', prescription: '4 × 4–6/side', cue: 'Use box/counterbalance to keep alignment.', category: 'skill' },
        { id: 'nordic-reg', label: 'Nordic hamstring regression', prescription: '3 × 4–6', cue: 'Slow eccentric; use assistance.', category: 'strength' },
        { id: 'calf', label: 'Single-leg calf raise', prescription: '3 × 12–15/side', cue: 'Full controlled range.', category: 'strength' },
        { id: 'body-saw', label: 'Plank body saw', prescription: '3 × 8–12', cue: 'Brace and move as one unit.', category: 'strength' },
      ],
      safety: ['Keep knee tracking stable.', 'Use assisted Nordic range to avoid sudden hamstring overload.'],
    },
  ],
  advanced: [
    {
      mode: 'calisthenics', level: 'advanced', title: 'Strength Skill Density', subtitle: 'High-tension basics before skill work', durationMin: 50, targetRpe: 'RPE 7–8', focus: ['weighted basics', 'lever prep', 'strict strength'],
      blocks: [
        { id: 'weighted-pull', label: 'Weighted pull-up', prescription: '5 × 3–5', cue: 'Strict reps; stop before grinding.', category: 'strength' },
        { id: 'weighted-dip', label: 'Weighted dip', prescription: '5 × 3–5', cue: 'Stable shoulder depression and controlled depth.', category: 'strength' },
        { id: 'front-lever-reg', label: 'Front-lever progression', prescription: '5 × 8–15 sec', cue: 'Choose a shape you can hold without lumbar extension.', category: 'skill' },
        { id: 'l-sit', label: 'L-sit', prescription: '5 × 10–20 sec', cue: 'Press tall through shoulders.', category: 'skill' },
      ],
      safety: ['Advanced means technical proficiency, not maximal risk.', 'No ballistic skill attempts when fatigued.'],
    },
  ],
}

const GYMNASTICS: Record<TrainingLevel, DailyTrainingSession[]> = {
  beginner: [
    {
      mode: 'gymnastics', level: 'beginner', title: 'Shapes + Handstand Basics', subtitle: 'Foundational positions before inversion volume', durationMin: 30, targetRpe: 'RPE 4–6', focus: ['hollow', 'arch', 'wrist prep', 'handstand line'],
      blocks: [
        { id: 'wrist', label: 'Wrist + shoulder preparation', prescription: '6–8 min', cue: 'Gradual loading through multiple wrist angles.', category: 'mobility' },
        { id: 'shapes', label: 'Hollow / arch shapes', prescription: '4 × 20 sec each', cue: 'Own the shape before increasing duration.', category: 'skill' },
        { id: 'wall-handstand', label: 'Wall handstand', prescription: '5 × 20–30 sec', cue: 'Use a clear wall and controlled exit.', category: 'skill' },
        { id: 'support', label: 'Parallel-bar support hold', prescription: '4 × 15–25 sec', cue: 'Shoulders down, elbows straight.', category: 'strength' },
      ],
      safety: ['Use a mat and clear fall zone.', 'No unsupported inversion if you cannot exit safely.'],
    },
  ],
  intermediate: [
    {
      mode: 'gymnastics', level: 'intermediate', title: 'Handstand + Rings Control', subtitle: 'Straight-arm control and positional strength', durationMin: 42, targetRpe: 'RPE 5–7', focus: ['handstand', 'rings', 'compression'],
      blocks: [
        { id: 'line-drill', label: 'Wall handstand line drill', prescription: '5 × 30–45 sec', cue: 'Ribs in, glutes tight, push tall.', category: 'skill' },
        { id: 'ring-support', label: 'Ring support', prescription: '5 × 10–20 sec', cue: 'Rings close; progress turnout only when stable.', category: 'skill' },
        { id: 'ring-row', label: 'Ring row', prescription: '4 × 6–10', cue: 'Maintain body line.', category: 'strength' },
        { id: 'compression', label: 'Pike compression lifts', prescription: '4 × 8–12', cue: 'Lift from hip flexion without bouncing.', category: 'strength' },
      ],
      safety: ['Use rings only from a verified anchor.', 'Avoid fatigue-driven inversion attempts.'],
    },
  ],
  advanced: [
    {
      mode: 'gymnastics', level: 'advanced', title: 'Strict Skill Strength', subtitle: 'Advanced control without acrobatic release skills', durationMin: 50, targetRpe: 'RPE 6–8', focus: ['press strength', 'rings', 'handstand endurance'],
      blocks: [
        { id: 'handstand', label: 'Freestanding handstand practice', prescription: '10–15 min quality attempts', cue: 'Stop sets before line quality collapses.', category: 'skill' },
        { id: 'press-drill', label: 'Press-handstand progression', prescription: '5 × 3–5 drills', cue: 'Use blocks/box progression rather than forced range.', category: 'skill' },
        { id: 'strict-ring-dip', label: 'Strict ring dip', prescription: '4 × 4–8', cue: 'Stable ring path; controlled bottom.', category: 'strength' },
        { id: 'toes-bar', label: 'Strict toes-to-bar / compression', prescription: '4 × 5–10', cue: 'No uncontrolled swing.', category: 'strength' },
      ],
      safety: ['This mode excludes flips, release moves and high-risk tumbling.', 'Use a coach/spotter for skills beyond proven independent control.'],
    },
  ],
}

const AMRAP: Record<TrainingLevel, DailyTrainingSession[]> = {
  beginner: [
    {
      mode: 'amrap', level: 'beginner', title: '12-minute Sustainable AMRAP', subtitle: 'Quality rounds, not maximal chaos', durationMin: 24, targetRpe: 'RPE 6', focus: ['work capacity', 'movement quality'],
      blocks: [
        { id: 'amrap-12', label: 'AMRAP 12 min', prescription: '6 air squats · 6 incline push-ups · 8 alternating reverse lunges · 20 sec plank', cue: 'Move continuously but keep 2–3 reps in reserve.', category: 'conditioning' },
      ],
      finisher: '5–8 min easy walk + breathing downshift.',
      safety: ['Scale movement before increasing pace.', 'Stop if technique deteriorates or symptoms appear.'],
    },
  ],
  intermediate: [
    {
      mode: 'amrap', level: 'intermediate', title: '18-minute Mixed AMRAP', subtitle: 'Strength-endurance with controlled pacing', durationMin: 32, targetRpe: 'RPE 7', focus: ['strength endurance', 'aerobic power'],
      blocks: [
        { id: 'amrap-18', label: 'AMRAP 18 min', prescription: '8 goblet squats · 6 pull-ups/rows · 10 push-ups · 12 kettlebell swings or hip hinges · 150 m run/row', cue: 'Aim for even round times; avoid sprinting round 1.', category: 'conditioning' },
      ],
      safety: ['Choose a load that preserves technique.', 'Keep ballistic hinge work submaximal when fatigued.'],
    },
  ],
  advanced: [
    {
      mode: 'amrap', level: 'advanced', title: '24-minute Engine AMRAP', subtitle: 'High-density conditioning with repeatable output', durationMin: 40, targetRpe: 'RPE 7–8', focus: ['density', 'repeatability', 'engine'],
      blocks: [
        { id: 'amrap-24', label: 'AMRAP 24 min', prescription: '10 pull-ups · 12 front/goblet squats · 10 burpees · 250 m row/run · 12 alternating DB/KB snatches', cue: 'Target sustainable power; cap local muscular failure.', category: 'conditioning' },
      ],
      safety: ['No technical Olympic lifting under fatigue unless already proficient.', 'Reduce complexity before increasing density.'],
    },
  ],
}

const HYROX: Record<TrainingLevel, DailyTrainingSession[]> = {
  beginner: [
    {
      mode: 'hyrox', level: 'beginner', title: 'HYROX-style Technique Circuit', subtitle: 'Running + stations with reduced volume', durationMin: 38, targetRpe: 'RPE 5–6', focus: ['run-station transitions', 'station technique'],
      blocks: [
        { id: 'run-1', label: 'Easy run', prescription: '600 m', cue: 'Conversational start; do not race the first segment.', category: 'run' },
        { id: 'ski', label: 'SkiErg or band pulldown substitute', prescription: '500 m / 2–3 min', cue: 'Drive through trunk and hips.', category: 'station' },
        { id: 'sled-push', label: 'Sled push or heavy incline walk', prescription: '4 × 12.5 m / 3 min', cue: 'Short steps, braced trunk.', category: 'station' },
        { id: 'row', label: 'Row', prescription: '500 m', cue: 'Legs → body → arms; smooth return.', category: 'station' },
        { id: 'carry', label: 'Farmer carry', prescription: '4 × 25 m', cue: 'Tall posture, controlled turns.', category: 'station' },
      ],
      safety: ['Use substitute stations when equipment is unavailable.', 'Do not copy competition loads before developing station technique.'],
    },
  ],
  intermediate: [
    {
      mode: 'hyrox', level: 'intermediate', title: 'HYROX-style Half Simulation', subtitle: 'Four run-station transitions at sustainable race effort', durationMin: 55, targetRpe: 'RPE 6–7', focus: ['compromised running', 'station pacing'],
      blocks: [
        { id: 'run-ski', label: 'Run → SkiErg', prescription: '1 km run + 750 m SkiErg', cue: 'Settle breathing before pulling harder.', category: 'station' },
        { id: 'run-sled', label: 'Run → Sled push/pull', prescription: '1 km run + 25 m push + 25 m pull', cue: 'Conservative sled load; uninterrupted technique.', category: 'station' },
        { id: 'run-row', label: 'Run → Row', prescription: '1 km run + 750 m row', cue: 'Keep stroke rate repeatable.', category: 'station' },
        { id: 'run-carry', label: 'Run → Farmer carry', prescription: '1 km run + 100 m carry', cue: 'Relax grip between turns if needed.', category: 'station' },
      ],
      safety: ['This is training, not an official race prescription.', 'Adjust station load to preserve gait and spinal control.'],
    },
  ],
  advanced: [
    {
      mode: 'hyrox', level: 'advanced', title: 'HYROX-style Full Sequence Practice', subtitle: 'Eight run-station transitions; submaximal rehearsal', durationMin: 75, targetRpe: 'RPE 7–8', focus: ['race-specific endurance', 'transition discipline'],
      blocks: [
        { id: 'h1', label: '1 km run → SkiErg', prescription: '1 km + 1000 m', cue: 'Controlled opening pace.', category: 'station' },
        { id: 'h2', label: '1 km run → Sled push', prescription: '1 km + 50 m', cue: 'Select training load from proven capacity.', category: 'station' },
        { id: 'h3', label: '1 km run → Sled pull', prescription: '1 km + 50 m', cue: 'Keep rope path clear and trunk braced.', category: 'station' },
        { id: 'h4', label: '1 km run → Burpee broad jump', prescription: '1 km + 80 m', cue: 'Use steady cadence; protect landing quality.', category: 'station' },
        { id: 'h5', label: '1 km run → Row', prescription: '1 km + 1000 m', cue: 'Avoid early sprinting.', category: 'station' },
        { id: 'h6', label: '1 km run → Farmer carry', prescription: '1 km + 200 m', cue: 'Short efficient steps and controlled turns.', category: 'station' },
        { id: 'h7', label: '1 km run → Sandbag lunges', prescription: '1 km + 100 m', cue: 'Knee tracks toes; stable trunk.', category: 'station' },
        { id: 'h8', label: '1 km run → Wall balls', prescription: '1 km + scalable set', cue: 'Choose a repeatable set size; maintain squat depth and target control.', category: 'station' },
      ],
      safety: ['Treat the sequence as rehearsal, not a maximal weekly requirement.', 'Competition-specific loads and standards should be checked against the current event rules before race preparation.'],
    },
  ],
}

const LIBRARY: Record<TrainingMode, Record<TrainingLevel, DailyTrainingSession[]>> = {
  calisthenics: CALISTHENICS,
  gymnastics: GYMNASTICS,
  amrap: AMRAP,
  hyrox: HYROX,
}

export const TRAINING_MODE_META: Record<TrainingMode, { label: string; emoji: string; description: string }> = {
  calisthenics: { label: 'Calisthenics', emoji: '🤸', description: 'Bodyweight strength, control and progressive skills.' },
  gymnastics: { label: 'Gymnastics', emoji: '🟦', description: 'Shapes, handstand, rings and strict control; no acrobatic release skills.' },
  amrap: { label: 'AMRAP', emoji: '⏱️', description: 'As many quality rounds as possible inside a fixed time cap.' },
  hyrox: { label: 'HYROX', emoji: '🏃', description: 'Running plus functional stations with scalable training loads.' },
}

function dayIndex(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000
  return Math.floor(diff / 86_400_000)
}

export function getDailyTrainingSession(mode: TrainingMode, level: TrainingLevel, date = new Date()): DailyTrainingSession {
  const sessions = LIBRARY[mode][level]
  return sessions[Math.abs(dayIndex(date)) % sessions.length]
}

export function dateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isValidReminderTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function reminderDue(settings: DailyTrainingReminderSettings, now = new Date()): boolean {
  if (!settings.enabled || !isValidReminderTime(settings.time)) return false
  const today = dateKey(now)
  if (settings.lastDeliveredDate === today) return false
  const [hour, minute] = settings.time.split(':').map(Number)
  return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)
}

export function trainingLoadModifier(profile: { recoveryHrs?: number; sleepScore?: number; acuteLoad?: number; chronicLoad?: number }): { label: string; factor: number; note: string } {
  const ratio = profile.chronicLoad && profile.chronicLoad > 0 && profile.acuteLoad != null ? profile.acuteLoad / profile.chronicLoad : 0
  if ((profile.recoveryHrs ?? 0) >= 24 || (profile.sleepScore ?? 100) < 60 || ratio > 1.5) {
    return { label: 'Recovery-priority', factor: 0.6, note: 'Reduce volume/intensity today; prioritize technique, mobility and easy aerobic work.' }
  }
  if ((profile.recoveryHrs ?? 0) >= 12 || (profile.sleepScore ?? 100) < 75 || ratio > 1.3) {
    return { label: 'Conservative', factor: 0.8, note: 'Keep the planned session submaximal and stop well before failure.' }
  }
  return { label: 'Normal load', factor: 1, note: 'Proceed with the planned session while preserving movement quality.' }
}
