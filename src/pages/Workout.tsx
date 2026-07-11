import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Badge, inputClass } from '../components/ui'
import { IconActivity, IconFlame, IconRun, IconCheck, IconPlus } from '../components/icons'
import { VideoGallery } from '../components/VideoGallery'

type Muscle = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Glutes' | 'Core' | 'Full Body'
type Modality =
  | 'Strength' | 'Muscle Gain' | 'Tone & Shape' | 'Cardio' | 'Endurance' | 'HIIT' | 'Fat Loss'
  | 'Mobility' | 'Agility' | 'Balance & Coordination' | 'Core' | 'Kettlebell' | 'Muay Thai / Martial Arts'
  | 'Battling Ropes' | 'Post Natal Shaping' | 'Focus & Movement' | 'Muscle Memory'

interface Exercise {
  id: string
  name: string
  muscle: Muscle
  type: 'Calisthenic' | 'Equipment'
  mode: 'Static' | 'Dynamic'
  modalities: Modality[]
  description: string
  cue: string // clinical/orthopedic cue — load, joint position, common compensation
  nutrition: string
}

const EX: Exercise[] = [
  { id: 'pushup', name: 'Push-Up', muscle: 'Chest', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape', 'Core'],
    description: 'Plank position, hands slightly wider than shoulder-width. Lower your body with elbows at roughly a ~45° angle to the torso (not flared to 90°) until the chest nears the floor, then press back up until the elbows are almost straight without hyperextending.',
    cue: 'Maintain scapular control (controlled retraction-protraction) to prevent subacromial impingement; engage the core so the lumbar spine does not hyperextend (avoid "sagging hips"). Relative load = body mass × % supported by the arms (~64% in a standard plank).',
    nutrition: 'Protein 1.6-2.2 g/kg body weight/day for muscle protein synthesis (MPS); leucine from eggs/chicken breast/whey helps trigger the mTOR pathway.' },
  { id: 'benchpress', name: 'Bench Press (Barbell)', muscle: 'Chest', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain'],
    description: 'Lie on the bench, grip slightly wider than shoulder-width. Lower the barbell under control to the nipple line/lower sternum, elbows ~45-75° from the torso, then press vertically until the arms are straight.',
    cue: 'Avoid 90° elbow flare (risk of impingement and anterior labral strain); keep the scapula retracted and depressed throughout the movement for glenohumeral stability. Progressive overload 2.5-5%/week if RPE <8.',
    nutrition: 'A slight caloric surplus (+250-500 kcal) if the goal is hypertrophy; complex carbohydrates pre-workout for maximal lifting performance.' },
  { id: 'pullup', name: 'Pull-Up', muscle: 'Back', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Hang from the bar, overhand grip at shoulder-width. Pull your body up until the chin clears the bar by driving the elbows down and back (lat-driven), then lower under control to a full dead hang.',
    cue: 'Begin with scapular depression before elbow flexion (a "scap pull-up" pattern) to train the lower trapezius and prevent biceps/neck dominance. Avoid excessive kipping for beginners (shoulder injury risk).',
    nutrition: 'Creatine monohydrate 3-5 g/day can support strength output on higher-rep sets; keep hydration at 35 ml/kg body weight.' },
  { id: 'row', name: 'Bent-Over Row (Dumbbell/Barbell)', muscle: 'Back', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Hip hinge with a neutral back, torso leaning ~45° forward. Pull the weight toward the lower abdomen/waist by squeezing the scapulae together, then lower under control.',
    cue: 'Maintain a neutral spine (avoid lumbar flexion under load — high risk of disc shear force); brace the core before pulling.',
    nutrition: 'Adequate magnesium and potassium (leafy greens, bananas) for optimal muscle contraction and cramp prevention.' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Core'],
    description: 'Stand with the weight at the front of the shoulders. Press straight up until the arms are locked out overhead, tucking the head slightly forward as the weight passes the face, then lower under control.',
    cue: 'Requires adequate thoracic extension mobility and scapular upward rotation; avoid compensatory lumbar hyperextension (brace the core, don\'t arch the lower back).',
    nutrition: 'Vitamin D and calcium for the bone and joint health of the shoulder (10-15 min sun exposure/day or supplementation as advised by a physician).' },
  { id: 'lateralraise', name: 'Lateral Raise', muscle: 'Shoulders', type: 'Equipment', mode: 'Dynamic', modalities: ['Tone & Shape', 'Muscle Gain'],
    description: 'Stand with a dumbbell at each side. Raise the arms out to the side up to shoulder height (no higher), elbows slightly bent, then lower under control.',
    cue: 'Limit elevation above 90° to avoid subacromial impingement; use moderate-to-light loads with higher reps since the long lever arm increases joint torque.',
    nutrition: 'Omega-3 (oily fish) helps control rotator cuff tendon inflammation after repetitive training.' },
  { id: 'dip', name: 'Dips', muscle: 'Arms', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Tone & Shape'],
    description: 'Hands on parallel bars, torso upright (for triceps) or leaning forward (for chest). Lower until the elbows reach ~90°, then press back up.',
    cue: 'Limit depth if there is a history of shoulder instability (depth beyond 90° increases stress on the anterior capsule); keep the shoulders depressed.',
    nutrition: 'Fast-digesting protein (whey/eggs) post-workout within a 1-2 hour window to maximize recovery.' },
  { id: 'curl', name: 'Bicep Curl', muscle: 'Arms', type: 'Equipment', mode: 'Dynamic', modalities: ['Muscle Gain', 'Tone & Shape'],
    description: 'Stand with a dumbbell in each hand, elbows tucked to the sides. Flex the elbows to raise the weight toward the shoulders, full contraction, then lower under control (2-3 second eccentric).',
    cue: 'Avoid momentum/swing (it reduces tension on the target muscle and loads the lumbar spine); focus on a slow eccentric tempo for optimal hypertrophy (time under tension).',
    nutrition: 'Moderate carbohydrate plus protein post-workout to replenish glycogen and support MPS.' },
  { id: 'squat', name: 'Squat (Bodyweight/Barbell)', muscle: 'Legs', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Fat Loss', 'Mobility'],
    description: 'Feet shoulder-width apart, lower the hips down and back as if sitting until the thighs are parallel to the floor (or deeper if mobility allows), chest upright, then drive through the heels to stand.',
    cue: 'Knees tracking over the toes (avoid valgus collapse — an ACL/PFPS risk factor); keep the lumbar spine neutral and avoid excessive "butt wink" at the bottom.',
    nutrition: 'Complex carbohydrates pre-workout (oatmeal/brown rice) for energy on large compound movements; adequate potassium for leg-muscle function.' },
  { id: 'lunge', name: 'Lunge', muscle: 'Legs', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Balance & Coordination', 'Tone & Shape', 'Mobility'],
    description: 'Step one foot forward, lower the hips until both knees reach ~90°, the back knee nearly touching the floor, then push back to the starting position.',
    cue: 'The front knee should not travel excessively past the toes if there is a history of patellofemoral pain; train unilaterally to correct left-right strength asymmetry.',
    nutrition: 'Optimal hydration supports neuromuscular control and balance during unilateral movements.' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Glutes', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Muscle Gain', 'Core'],
    description: 'Feet hip-width apart, barbell close to the shins. Hip hinge, neutral back, lift by driving the feet into the floor and extending the hips and knees together.',
    cue: 'A neutral spine is mandatory throughout the movement (flexed-spine lifting = the highest disc-herniation risk among compound lifts); keep a vertical bar path close to the body.',
    nutrition: 'High protein and adequate sodium/electrolytes; this is the most systemically demanding movement — 7-9 hours of recovery sleep is important.' },
  { id: 'hipthrust', name: 'Hip Thrust', muscle: 'Glutes', type: 'Equipment', mode: 'Dynamic', modalities: ['Strength', 'Tone & Shape', 'Post Natal Shaping'],
    description: 'Upper back on the bench, feet planted on the floor. Drive the hips up through the heels until the body is straight (full hip extension), squeeze the glutes at the top, then lower under control.',
    cue: 'Avoid lumbar hyperextension at the top — focus on a posterior pelvic tilt plus glute contraction, not lumbar extension. Safe and recommended for post-natal diastasis recti rehabilitation with low progressive loading.',
    nutrition: 'Adequate protein for regeneration of the pelvic connective tissue, especially in post-natal shaping programs.' },
  { id: 'plank', name: 'Plank', muscle: 'Core', type: 'Calisthenic', mode: 'Static', modalities: ['Core', 'Strength', 'Post Natal Shaping'],
    description: 'Support on the forearms and toes, body forming a straight line from head to heels. Hold the position with the core, glutes, and thighs actively contracting isometrically.',
    cue: 'Avoid the hips dropping (lumbar sagging) or rising too high (hip hiking); this is a safe post-natal isometric exercise to restore intra-abdominal pressure and address diastasis recti before progressing to dynamic movements.',
    nutrition: 'No specific high-calorie requirement; focus on glycemic stability for optimal focus and motor control during static holds.' },
  { id: 'hollow', name: 'Hollow Body Hold', muscle: 'Core', type: 'Calisthenic', mode: 'Static', modalities: ['Core', 'Focus & Movement', 'Muscle Memory'],
    description: 'Lie supine, lift the shoulders and legs slightly off the floor, lower back pressed to the floor (posterior pelvic tilt), and hold the position with controlled breathing.',
    cue: 'An indicator of correct technique = the lumbar spine stays pressed to the floor (no gap); if the lower back lifts, the load exceeds your current core capacity — regress by bending the knees.',
    nutrition: 'Motor-control and muscle-memory training benefits from adequate sleep (motor-learning consolidation occurs during deep/REM sleep).' },
  { id: 'burpee', name: 'Burpee', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dynamic', modalities: ['HIIT', 'Cardio', 'Fat Loss', 'Endurance'],
    description: 'From standing, squat and place the hands on the floor, jump the feet back to a plank, push-up (optional), jump the feet back to the squat, then jump vertically with the hands overhead.',
    cue: 'A high-intensity compound exercise — watch the landing technique (bend the knees, don\'t land stiff) to reduce impact force on the knee/ankle joints; avoid with acute joint conditions.',
    nutrition: 'A moderate caloric deficit (300-500 kcal) is effective combined with HIIT for fat loss; ensure adequate carbohydrates to sustain intensity across intervals.' },
  { id: 'kettlebellswing', name: 'Kettlebell Swing', muscle: 'Full Body', type: 'Equipment', mode: 'Dynamic', modalities: ['Kettlebell', 'Cardio', 'Endurance', 'Fat Loss', 'Strength'],
    description: 'Feet shoulder-width apart, kettlebell in front. Hip hinge to swing the kettlebell back between the thighs, then explosively drive the hips forward (hip drive) until the kettlebell rises to chest height — not lifted with the shoulders/arms.',
    cue: 'Power comes from ballistic hip extension, not repeated lumbar flexion; keep the spine neutral throughout to avoid lumbar injury from high repetitions.',
    nutrition: 'A high metabolic-conditioning workout — ensure adequate muscle glycogen (pre-workout carbohydrates) and electrolytes for sessions over 15 minutes.' },
  { id: 'kettlebellgoblet', name: 'Kettlebell Goblet Squat', muscle: 'Legs', type: 'Equipment', mode: 'Dynamic', modalities: ['Kettlebell', 'Mobility', 'Strength'],
    description: 'Hold the kettlebell in front of the chest (goblet position), squat deep with the elbows between the knees, then drive back up to standing.',
    cue: 'The goblet position helps keep the torso upright and improves squat depth safely — good for training hip/ankle mobility before progressing to the barbell squat.',
    nutrition: 'Same as the squat — complex carbohydrates pre-workout.' },
  { id: 'battlerope', name: 'Battling Ropes (Alternating Waves)', muscle: 'Full Body', type: 'Equipment', mode: 'Dynamic', modalities: ['Battling Ropes', 'HIIT', 'Cardio', 'Fat Loss', 'Endurance'],
    description: 'Stand in an athletic stance (knees slightly bent, core engaged), hold an end of the rope in each hand, and whip the ropes alternately up and down quickly and rhythmically for a timed interval (e.g. 20-30 seconds of work).',
    cue: 'Core stability and knee position are important to transfer force from the arms to the ground without loading the lumbar spine; this movement is high-intensity metabolic and low-impact on the joints (suitable for obesity/mild knee injury).',
    nutrition: 'HIIT metabolic conditioning — effective for a high EPOC (excess post-exercise oxygen consumption), supporting fat loss; ensure adequate protein after the session.' },
  { id: 'muaythaikick', name: 'Kicking Technique (Muay Thai — Roundhouse Kick)', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Muay Thai / Martial Arts', 'Balance & Coordination', 'Agility', 'Cardio'],
    description: 'Pivot the support foot 90° toward the kick, rotate the hips fully while lifting the kicking-leg knee to the side, extend the lower leg through contact using the shin, keeping the arms in guard at the face.',
    cue: 'Power comes from hip rotation, not just the leg muscles — reduce the risk of hip flexor/adductor strain with a dynamic hip-rotation warm-up before the session.',
    nutrition: 'A high technique-and-coordination workout — stable blood sugar is important for focus and reaction (avoid a heavy meal within 1 hour before sparring).' },
  { id: 'shadowbox', name: 'Shadow Boxing / Pad Work', muscle: 'Full Body', type: 'Calisthenic', mode: 'Dynamic', modalities: ['Muay Thai / Martial Arts', 'Cardio', 'Endurance', 'Balance & Coordination', 'Agility', 'Focus & Movement'],
    description: 'Light footwork to keep distance, throw punch combinations (jab-cross-hook) with hip and shoulder rotation, returning to guard after each punch.',
    cue: 'Trains neuromuscular coordination and reaction time; good trunk rotation reduces excessive load on the dominant shoulder during high repetitions.',
    nutrition: 'Cardio-dominant — adequate carbohydrates for sessions over 20 minutes; active hydration each interval.' },
  { id: 'jumprope', name: 'Jump Rope', muscle: 'Full Body', type: 'Equipment', mode: 'Dynamic', modalities: ['Cardio', 'Agility', 'Balance & Coordination', 'Endurance', 'Fat Loss'],
    description: 'Light jumps from the ankles (not high knees), the rope turned from the wrists, at a consistent rhythm.',
    cue: 'Low-amplitude jumping reduces knee impact compared to high jumps; good for light plyometrics and foot agility.',
    nutrition: 'Continuous cardio — make sure you are not in a prolonged fasted state to maintain performance and avoid mild hypoglycemia.' },
  { id: 'mobilitydrill', name: 'Hip & Thoracic Mobility Flow', muscle: 'Full Body', type: 'Calisthenic', mode: 'Static', modalities: ['Mobility', 'Focus & Movement', 'Balance & Coordination'],
    description: 'A sequence of movements: cat-cow, 90/90 hip circles, thoracic rotation, world\'s greatest stretch — each position held/repeated slowly with deep breathing.',
    cue: 'Adequate mobility in the hips and thoracic spine reduces excessive compensation at the lumbar spine during squats/deadlifts/overhead presses — perform as a dynamic warm-up before a lifting session.',
    nutrition: 'Not directly calorie-related; stay hydrated so fascia/muscle tissue is more elastic.' },
  { id: 'postnatalbreath', name: 'Diaphragmatic Breathing + Pelvic Floor Activation', muscle: 'Core', type: 'Calisthenic', mode: 'Static', modalities: ['Post Natal Shaping', 'Core', 'Mobility'],
    description: 'Lie down, hands on the abdomen, inhale deeply to expand the belly and lower ribs (not the chest), and as you exhale contract the pelvic floor (as if holding urine) together with the transversus abdominis.',
    cue: 'A mandatory phase before progressing to planks/hip thrusts post-partum — especially if there is diastasis recti or pelvic floor dysfunction; consult an obstetric physiotherapist if there is coning/bulging along the midline of the abdomen during exercise.',
    nutrition: 'Adequate protein and iron for post-partum tissue recovery; avoid aggressive caloric deficits while breastfeeding.' },
]

const MUSCLES: Muscle[] = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full Body']
const MODALITIES: Modality[] = ['Strength', 'Muscle Gain', 'Tone & Shape', 'Cardio', 'Endurance', 'HIIT', 'Fat Loss', 'Mobility', 'Agility', 'Balance & Coordination', 'Core', 'Kettlebell', 'Muay Thai / Martial Arts', 'Battling Ropes', 'Post Natal Shaping', 'Focus & Movement', 'Muscle Memory']

interface LogEntry { id: string; exId: string; date: string; sets: number; reps: number; weight: number }
const LOG_KEY = 'pm_workout_log'
function loadLog(): LogEntry[] { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') } catch { return [] } }
function saveLog(l: LogEntry[]) { try { localStorage.setItem(LOG_KEY, JSON.stringify(l)) } catch { /* ignore */ } }

export function Workout() {
  const [muscle, setMuscle] = useState<Muscle | 'All'>('All')
  const [modality, setModality] = useState<Modality | 'All'>('All')
  const [type, setType] = useState<'All' | 'Calisthenic' | 'Equipment'>('All')
  const [open, setOpen] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>(loadLog)
  const [sets, setSets] = useState(3); const [reps, setReps] = useState(12); const [weight, setWeight] = useState(0)

  const filtered = useMemo(() => EX.filter((e) =>
    (muscle === 'All' || e.muscle === muscle) &&
    (modality === 'All' || e.modalities.includes(modality)) &&
    (type === 'All' || e.type === type),
  ), [muscle, modality, type])

  function logExercise(exId: string) {
    const entry: LogEntry = { id: `${Date.now()}`, exId, date: new Date().toISOString().slice(0, 10), sets, reps, weight }
    const next = [entry, ...log]
    setLog(next); saveLog(next)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayLog = log.filter((l) => l.date === todayStr)
  const weekLog = log.filter((l) => Date.now() - new Date(l.date).getTime() <= 7 * 86400000)
  const weeklyVolume = weekLog.reduce((a, l) => a + l.sets * l.reps * (l.weight || 1), 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <VideoGallery
        icon={<IconFlame size={20} />}
        title="Movement Demo Videos"
        subtitle="Correct-form demonstrations — warm-up, HIIT & legs"
        videos={[
          { label: 'Dynamic Warm-Up', cue: 'Leg swings · arm circles · high knees — mandatory before a session', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_073037_fc3668ff-bc44-4938-8e63-69f2ba59c7f9.mp4' },
          { label: 'Burpee', cue: 'Squat → plank → push-up → explosive jump, keep form as you fatigue', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072933_8c31ec59-1c8a-46a2-8e05-03b56cd36e5f.mp4' },
          { label: 'Lunge', cue: 'Torso upright · front knee 90° tracking over the toes', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072947_e56eb38e-4fea-4d36-aed8-0baf8e10b1f5.mp4' },
        ]}
      />

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="AI Program — Workout Tracker" subtitle="Static and dynamic, equipment or calisthenics, by muscle group — grounded in sports science and orthopedics" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className={inputClass} value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | 'All')}>
            <option value="All">All Muscles</option>
            {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={inputClass} value={modality} onChange={(e) => setModality(e.target.value as Modality | 'All')}>
            <option value="All">All Goals</option>
            {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="All">Calisthenics & Equipment</option>
            <option value="Calisthenic">Calisthenics</option>
            <option value="Equipment">With Equipment</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-extrabold text-ink">{todayLog.length}</div>
            <div className="text-[10px] text-neutral-400">Sets today</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-extrabold text-ink">{weekLog.length}</div>
            <div className="text-[10px] text-neutral-400">Sessions this week</div>
          </div>
          <div className="rounded-xl bg-brand-50 p-3 text-center">
            <div className="text-lg font-extrabold text-brand-dark">{weeklyVolume.toLocaleString('en-US')}</div>
            <div className="text-[10px] text-neutral-400">Weekly volume</div>
          </div>
        </div>
      </Card>

      <div className="space-y-2.5">
        {filtered.map((e) => (
          <Card key={e.id} className="!p-4">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === e.id ? null : e.id)}>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  {e.name}
                  <Badge tone={e.type === 'Calisthenic' ? 'brand' : 'neutral'}>{e.type}</Badge>
                  <Badge tone="neutral">{e.mode}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{e.muscle}</span>
                  {e.modalities.slice(0, 3).map((m) => <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">{m}</span>)}
                </div>
              </div>
              <IconActivity size={16} className={open === e.id ? 'text-brand' : 'text-neutral-300'} />
            </button>

            {open === e.id && (
              <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">How To Perform</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{e.description}</p>
                </div>
                <div className="rounded-xl bg-amber-50/60 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Clinical & Orthopedic Notes</div>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">{e.cue}</p>
                </div>
                <div className="rounded-xl bg-brand-50/60 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">Nutrition Adjustments</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{e.nutrition}</p>
                </div>

                <div className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-100 p-3">
                  <label className="text-xs">Sets<input className={inputClass + ' mt-1 w-16'} type="number" value={sets} onChange={(ev) => setSets(+ev.target.value)} /></label>
                  <label className="text-xs">Reps<input className={inputClass + ' mt-1 w-16'} type="number" value={reps} onChange={(ev) => setReps(+ev.target.value)} /></label>
                  <label className="text-xs">Load (kg)<input className={inputClass + ' mt-1 w-20'} type="number" value={weight} onChange={(ev) => setWeight(+ev.target.value)} /></label>
                  <Button onClick={() => logExercise(e.id)} className="h-9"><IconPlus size={14} /> Log</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {todayLog.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconFlame size={18} />} title="Today's Log" subtitle="Sets you have already recorded" />
          <div className="mt-2 space-y-1.5">
            {todayLog.map((l) => {
              const ex = EX.find((x) => x.id === l.exId)
              return (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-semibold">{ex?.name}</span>
                  <span className="text-xs text-neutral-400">{l.sets}×{l.reps} {l.weight > 0 ? `@ ${l.weight}kg` : ''}</span>
                  <IconCheck size={14} className="text-brand" />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={18} />} title="Programming Principles" subtitle="Sports-science fundamentals for building progression" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• <b>Progressive overload</b>: increase load/reps/volume 2.5-10%/week while RPE &lt;8-9.</li>
          <li>• <b>Periodization</b>: alternate high-volume/low-intensity phases with high-intensity/low-volume phases; deload every 4-6 weeks.</li>
          <li>• <b>Specificity</b>: static movements (planks, isometric holds) build joint stability and motor control; dynamic movements build strength and explosive power.</li>
          <li>• <b>Joint/connective-tissue recovery</b>: allow 48-72 hours between sessions for the same muscle group for tendon collagen resynthesis and muscle remodeling.</li>
          <li>• <b>HIIT/Battling Ropes/Muay Thai</b> are highly effective for EPOC and fat loss but tax the nervous system — limit to 2-3×/week and combine with mobility/recovery days.</li>
          <li>• <b>Post-natal</b>: start with diaphragmatic breathing and pelvic floor activation, then progress to isometrics (light planks), then to light dynamic work after a diastasis recti screening by a healthcare professional.</li>
        </ul>
      </Card>
    </div>
  )
}

export default Workout
