// Equipment education: how each machine is actually used, which muscles do the
// work, and an honest comparison against the bodyweight (calisthenic)
// equivalent.
//
// The comparison is the part most gym content gets wrong, in both directions.
// "Machines are useless, only free weights count" and "machines are safer and
// better" are both marketing rather than physiology. What genuinely differs is
// measurable: how much stabiliser work the movement demands, how easily load
// can be added in small steps, how much skill is needed before the exercise is
// productive, and how well it transfers to moving your own body. Each entry
// below states where the machine wins, where the bodyweight version wins, and —
// where it is true — that the difference is small enough not to matter.

// Group ids stay as they are. They are stored in saved filters and compared
// against elsewhere in the app, so translating them would silently break every
// existing preference while still typechecking. Only the labels below are read
// by anyone.
export type Group = 'kardio' | 'kekuatan' | 'hyrox' | 'fungsional'

export const GROUP_LABEL: Record<Group, string> = {
  kardio: 'Cardio',
  kekuatan: 'Strength (machines & weights)',
  hyrox: 'Hyrox stations',
  fungsional: 'Functional & loaded carries',
}

export interface Equipment {
  id: string
  name: string
  group: Group
  /** One line on what the machine is for. */
  purpose: string
  /** Step-by-step setup and execution. */
  howTo: string[]
  /** Mistakes that either cause injury or quietly waste the set. */
  mistakes: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
  /** Where this genuinely beats the bodyweight alternative. */
  machineWins: string
  /** Where the bodyweight version genuinely beats it. */
  calisthenicWins: string
  /** The nearest bodyweight substitute, for people without equipment. */
  calisthenicAlternative: string
  /** Honest bottom line, including "the difference is small". */
  verdict: string
  hyroxNote?: string
}

export const EQUIPMENT: Equipment[] = [
  // ── Cardio ────────────────────────────────────────────────────────────────
  {
    id: 'treadmill',
    name: 'Treadmill (motorized)',
    group: 'kardio',
    purpose: 'Run or walk at a speed and incline you can set exactly.',
    howTo: [
      'Clip the safety key to your clothing before switching on — it is the only thing that stops the belt if you fall.',
      'Stand on the side rails, not on the belt, while the machine starts up.',
      'Walk at 3–5 km/h for 3–5 minutes as a warm-up before raising the speed.',
      'For easy cardio: set the speed so you can still speak in full sentences.',
      'For intervals: raise the speed for 1–3 minutes, then drop it until your breathing recovers, and repeat.',
      'A 1–2% incline makes the effort closer to running outdoors, since there is no air resistance indoors.',
      'Slow down gradually at the end rather than stepping off while the belt is still moving.',
    ],
    mistakes: [
      'Holding the handrails throughout — this shifts part of your bodyweight into your arms, so the actual work is far lighter than the display claims and the calorie figure becomes meaningless.',
      'A very steep incline while leaning on the rails — your posture changes completely and the load moves into your lower back.',
      'Overstriding, so the heel lands well ahead of the hips; this increases the impact force through the knee.',
      'Staring down at the console, which leaves the neck and upper back tight.',
    ],
    primaryMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves (gastrocnemius & soleus)'],
    secondaryMuscles: ['Core', 'Hip flexors', 'Tibialis anterior'],
    machineWins: 'Speed and incline can be locked to exact numbers, so next week’s session can repeat this one precisely and progress is genuinely measurable. The surface also absorbs a little impact, and neither weather nor traffic can cancel the session.',
    calisthenicWins: 'Running outdoors trains changing surfaces, corners and wind — variation a belt never provides. A belt that moves on its own also slightly reduces the hamstring work of pulling the leg back, so the stride is not identical to road running.',
    calisthenicAlternative: 'Running or brisk walking outdoors; stair climbing; skipping; jumping jacks where space is tight.',
    verdict: 'For heart health the difference between a treadmill and running outdoors is small — duration and intensity decide the outcome, not the equipment. Choose whichever you will actually do regularly.',
  },
  {
    id: 'curve-treadmill',
    name: 'Curve treadmill (non-motorized)',
    group: 'kardio',
    purpose: 'A curved treadmill with no motor — the belt moves only because your feet drive it.',
    howTo: [
      'Hold the side rails as you step on, placing your feet on the steepest rear part of the curve.',
      'Start walking; the belt moves from the friction of your feet, not from a motor.',
      'The further FORWARD you stand on the curve, the faster the belt runs. Speed is controlled by body position, not by a button.',
      'To slow down, step back toward the rear of the curve.',
      'For sprint intervals: 10–20 seconds fast at the front, then step back and walk until you recover.',
    ],
    mistakes: [
      'Gripping the rails hard throughout — the effect is larger here than on a normal treadmill, because it changes your position on the curve as well as reducing the load.',
      'Attempting long sessions as you would on a motorised treadmill; this machine is far harder, so sessions are usually shorter.',
      'Comparing the speed reading with a motorised treadmill — at the same effort, the number on a curve treadmill will feel much harder.',
    ],
    primaryMuscles: ['Glutes', 'Hamstrings', 'Quadriceps', 'Calves'],
    secondaryMuscles: ['Core', 'Hip flexors'],
    machineWins: 'Because you drive the belt, energy cost runs roughly 20–30% higher than a motorised treadmill at the same speed, and the posterior chain (glutes and hamstrings) works harder. There is no motor to "catch up" with, so intervals start and stop instantly.',
    calisthenicWins: 'It does not train running on real surfaces, and the price keeps it rare. Field sprints give a similar stimulus for nothing.',
    calisthenicAlternative: 'Sprints on grass or a hill; 10–20 second hill sprints; bear crawls for a comparable load with no equipment.',
    verdict: 'Genuinely harder per minute than a normal treadmill, and good for short intervals. Hill sprints outdoors deliver most of the same benefit at no cost.',
    hyroxNote: 'Not a Hyrox station, but useful for training the 1 km running legs that repeat between stations.',
  },
  {
    id: 'assault-bike',
    name: 'Air bike / assault bike',
    group: 'kardio',
    purpose: 'A stationary bike with a fan — resistance rises in proportion to how hard you push.',
    howTo: [
      'Set saddle height so that at the bottom of the pedal stroke the knee is slightly bent (around 25–30 degrees), not locked straight.',
      'Hold the moving handles and push and pull with the arms while the legs drive the pedals.',
      'For intervals: 20–40 seconds all out, then 60–90 seconds easy. Repeat 6–10 rounds.',
      'Watch the units on the display — most of these machines count "calories", and calories climb very fast on an air bike.',
    ],
    mistakes: [
      'Using only the legs and letting the arms ride along, which gives up most of what makes this machine useful.',
      'A saddle set too low, which adds pressure through the knee.',
      'Starting with long sessions; this machine is punishing and suits intervals far better.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Latissimus dorsi', 'Deltoids'],
    secondaryMuscles: ['Core', 'Triceps', 'Biceps', 'Calves'],
    machineWins: 'It loads the upper and lower body at once, so the cardiovascular demand per minute is very high. Resistance is self-regulating: however hard you push, the machine matches you — so it suits every level without changing a setting. Joint impact is close to zero, which helps when knees or ankles are a problem.',
    calisthenicWins: 'Burpees train a similar pattern (whole body, heavy breathing) while also training getting down to and up from the floor, a useful skill a bike never touches.',
    calisthenicAlternative: 'Burpees; mountain climbers; squat thrusts; shadow boxing with jumps.',
    verdict: 'One of the most efficient cardio machines per minute and one of the kindest to the joints. Without one, burpees give a comparable cardiovascular stimulus, though they ask more of the wrists and shoulders.',
  },
  {
    id: 'rower',
    name: 'Rowing machine (ergometer)',
    group: 'kardio',
    purpose: 'Rowing — whole-body cardio weighted toward the posterior chain.',
    howTo: [
      'Strap the feet to the footplate with the strap across the widest part of the foot.',
      'Drive in this order: legs → body → arms. Around 60% of the power comes from the LEGS, not the arms.',
      'Pull the handle to just below the ribs, elbows sweeping close to the body.',
      'Recover in the reverse order: arms → body → legs.',
      'Aim for a stroke rate of 20–26 per minute for base work; a higher rate is not necessarily faster.',
      'Set the damper to 3–5 for most people — the damper is not a "difficulty level", it controls how much air enters the flywheel.',
    ],
    mistakes: [
      'Pulling with the arms before the legs drive — the most common error, which tires the back quickly and loses power.',
      'Rounding the back on the recovery, which loads the lumbar discs.',
      'Setting the damper to 10 on the assumption that heavier is better; this slows the rate and raises the risk to the back.',
      'Pulling the handle too high into the chest or too low into the stomach.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Latissimus dorsi', 'Rhomboids', 'Trapezius'],
    secondaryMuscles: ['Biceps', 'Posterior deltoids', 'Core', 'Erector spinae'],
    machineWins: 'It trains the pulling muscles of the back alongside cardio, a combination that is hard to get from bodyweight movement. Joint impact is low, and every stroke is measured in watts, so progress is objective.',
    calisthenicWins: 'Pull-ups and inverted rows build maximal pulling strength far better; rowing trains pulling endurance, not peak strength.',
    calisthenicAlternative: 'Inverted rows under a sturdy table; pull-ups; superman holds for the posterior chain.',
    verdict: 'One of the few cardio machines that genuinely trains the pulling muscles. If the goal is pulling strength you still need pull-ups or weighted rows — rowing does not replace them.',
    hyroxNote: 'Official Hyrox station: 1000 m row. Train pacing, not sprinting — rowing too hard early costs you the stations that follow.',
  },

  // ── Hyrox ────────────────────────────────────────────────────────────────
  {
    id: 'skierg',
    name: 'SkiErg',
    group: 'hyrox',
    purpose: 'Mimics the double-poling motion of cross-country skiing — dominated by the upper body and core.',
    howTo: [
      'Stand slightly further from the machine than feels natural, feet hip-width apart.',
      'Reach the handles to head height or a little above, arms almost straight.',
      'Pull down by HINGING AT THE HIPS and bracing the core — not by pulling with the arms alone.',
      'Finish the pull around thigh height, then let the handles rise as you stand back up.',
      'Use a little knee bend to help the rhythm, but keep the power coming from the trunk.',
    ],
    mistakes: [
      'Pulling purely with triceps and shoulders, so the arms empty out and the pace collapses in the last 200 m.',
      'Standing too close, leaving no room to hinge.',
      'Bending through the lower back instead of hinging at the hips.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Triceps', 'Core (rectus abdominis & obliques)', 'Posterior deltoids'],
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Erector spinae', 'Pectorals'],
    machineWins: 'One of the very few cardio machines dominated by the upper body, and it teaches you to transmit force through the core — a pattern that is rarely trained.',
    calisthenicWins: 'There is no true bodyweight equivalent. Push-ups and dips build pressing strength better, but give no long-duration cardio component.',
    calisthenicAlternative: 'A mix of burpees, push-ups and plank-to-pike; battle ropes where available.',
    verdict: 'Hard to substitute with bodyweight work. If you are preparing for Hyrox, train on the machine itself — technique decides the outcome here.',
    hyroxNote: 'First Hyrox station: 1000 m SkiErg. Because it opens the race, many competitors start too hard and pay for it on the sled that follows.',
  },
  {
    id: 'sled-push',
    name: 'Sled push',
    group: 'hyrox',
    purpose: 'Pushing a loaded sled — leg strength and cardio with no eccentric phase.',
    howTo: [
      'Hold the uprights with arms almost straight, body leaning forward in a straight line from head to heels.',
      'A low hand position gives a more powerful push; a high position is more upright and easier on the back.',
      'Take short, fast steps, driving through the toes rather than standing tall mid-push.',
      'Keep the hips from bobbing up and down; the power comes from the legs stabbing at the ground, not from the back.',
      'Breathe rhythmically — holding your breath the whole length is the main cause of dizziness.',
    ],
    mistakes: [
      'Standing too upright, which wastes force and puts the load into the lower back.',
      'Steps that are too long, so momentum dies with each one.',
      'A load so heavy the sled stops and starts; a sled should keep moving.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Calves'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Anterior deltoids', 'Triceps'],
    machineWins: 'There is almost no eccentric phase (muscle lengthening under load), so it leaves far less soreness than heavy squats and can be trained more often. It is also very safe to learn, since no load sits on top of you waiting to fall.',
    calisthenicWins: 'It does not train lowering a load under control, which matters for strength and for avoiding injury. Squats and lunges are still needed.',
    calisthenicAlternative: 'Walking lunges; wall sits; bear crawls; pushing a car in a safe place with supervision.',
    verdict: 'Excellent as a supplement, not as a replacement for squatting. Its real value is a heavy leg stimulus you recover from quickly.',
    hyroxNote: 'Hyrox station: 50 m sled push. One of the stations that most often wrecks a competitor’s time — train it near race weight, not just light.',
  },
  {
    id: 'sled-pull',
    name: 'Sled pull',
    group: 'hyrox',
    purpose: 'Dragging a loaded sled by a rope — posterior chain and grip.',
    howTo: [
      'Stand with feet shoulder-width apart, knees slightly bent, hips a little low.',
      'Pull the rope hand over hand, leaning back slightly against the load.',
      'Keep the back neutral; the legs hold the floor while the back holds the position.',
      'Gather the rope beside you rather than letting it pile up in front of your feet where it can trip you.',
    ],
    mistakes: [
      'Pulling with the arms alone while standing tall — grip fails before the distance is covered.',
      'Rounding the back when the load is heavy.',
      'Standing too close, leaving no distance to pull through.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Trapezius', 'Rhomboids', 'Biceps', 'Forearm grip muscles'],
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core', 'Erector spinae'],
    machineWins: 'It trains grip and the pulling muscles under cardiovascular fatigue — a combination bodyweight work can barely reproduce.',
    calisthenicWins: 'Pull-ups build far more maximal vertical pulling strength; the sled pull is horizontal pulling endurance.',
    calisthenicAlternative: 'Inverted rows; towel rows around a post; dead hangs for grip.',
    verdict: 'A good supplement for pulling endurance and grip. For pure pulling strength, pull-ups remain more effective.',
    hyroxNote: 'Hyrox station: 50 m sled pull. Grip is usually the failure point — train dead hangs and farmer’s carries separately.',
  },
  {
    id: 'wall-ball',
    name: 'Wall ball',
    group: 'hyrox',
    purpose: 'Squat and throw a ball to a target on the wall — a repeated whole-body movement.',
    howTo: [
      'Hold the ball at chest height with elbows under it, feet shoulder-width apart.',
      'Drop into a full squat — thighs at least parallel to the floor.',
      'Stand up explosively and use the momentum from the legs to throw the ball at the target.',
      'Catch the ball with the arms absorbing it straight down into the next squat, without pausing upright.',
      'Breathe out on the throw, in on the way down.',
    ],
    mistakes: [
      'Throwing with the arms alone instead of using leg drive — the arms will be gone within 15 reps.',
      'Not squatting deep enough, which makes the rep invalid in competition.',
      'Catching the ball with stiff arms, which loads the shoulders and wrists.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Deltoids', 'Triceps'],
    secondaryMuscles: ['Core', 'Calves', 'Upper pectorals', 'Upper back'],
    machineWins: 'It combines leg strength, explosive power and cardio in one movement, with the load adjustable by the weight of the ball.',
    calisthenicWins: 'Squat jumps give a similar explosive component with no equipment at all, and need no high wall.',
    calisthenicAlternative: 'Squat jumps; thrusters with a water bottle or backpack; squat-to-press.',
    verdict: 'Very efficient, but squat jumps and backpack thrusters get you close when there is no ball and no wall.',
    hyroxNote: 'Final Hyrox station: 75–100 wall balls. The most feared station, because it comes when you are already empty — train it tired, not fresh.',
  },
  {
    id: 'farmers-carry',
    name: 'Farmer’s carry',
    group: 'hyrox',
    purpose: 'Walking while carrying a heavy load in each hand.',
    howTo: [
      'Pick the load up by bending the knees and hips with a neutral back — not by stooping.',
      'Stand tall, shoulders pulled back and down, core braced.',
      'Walk at a normal, brisk pace rather than shuffling.',
      'Keep the load from swinging and from banging against the thighs.',
      'Put the load down by bending the knees, not by dropping it while bent over.',
    ],
    mistakes: [
      'Stooping to lift and to set down — back injuries in this movement almost always happen in those two moments, not during the walk.',
      'Shoulders creeping up toward the ears, which leaves the neck tight.',
      'A load so heavy that posture collapses within a few steps.',
    ],
    primaryMuscles: ['Forearm grip muscles', 'Trapezius', 'Core', 'Glutes'],
    secondaryMuscles: ['Erector spinae', 'Quadriceps', 'Calves', 'Deltoids'],
    machineWins: 'It trains grip, trunk stability and posture under load at the same time — very close to the demands of ordinary life, like carrying shopping or a suitcase.',
    calisthenicWins: 'There is no bodyweight equivalent for external load; planks and dead hangs train two of its components separately.',
    calisthenicAlternative: 'Carrying water jugs or a backpack full of books; dead hangs for grip; single-sided suitcase carries.',
    verdict: 'One of the exercises that transfers most directly to real life, and one of the easiest to reproduce at home with a jug or a backpack.',
    hyroxNote: 'Hyrox station: 200 m farmer’s carry. Grip is the limiter — every drop costs you the time it takes to pick the load back up.',
  },
  {
    id: 'burpee-broad-jump',
    name: 'Burpee broad jump',
    group: 'hyrox',
    purpose: 'A burpee followed by a forward broad jump — a station with no equipment at all.',
    howTo: [
      'From standing, drop to a push-up position with the chest touching the floor.',
      'Push back up and pull the feet forward into a squat.',
      'From the squat, jump forward as far as you can with both feet, landing softly with the knees bent.',
      'Drop straight into the next burpee from where you landed.',
      'Pace your breathing — this is the most oxygen-hungry station of them all.',
    ],
    mistakes: [
      'Jumping too far early on, so you run out of breath quickly.',
      'Landing with straight knees, which raises the impact through the knees and back.',
      'The chest not reaching the floor, which makes the rep invalid.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Pectorals', 'Triceps'],
    secondaryMuscles: ['Core', 'Deltoids', 'Hamstrings', 'Calves'],
    machineWins: 'It requires no equipment whatsoever — this is a purely calisthenic movement used in a paid competition.',
    calisthenicWins: 'This is a calisthenic movement; no machine replaces it.',
    calisthenicAlternative: 'It is already bodyweight. Easier versions: a burpee without the broad jump, or a step-back burpee.',
    verdict: 'Proof that equipment-free training can be extremely demanding. Worth training whether or not you have access to a gym.',
    hyroxNote: 'Hyrox station: 80 m burpee broad jump. Widely considered the hardest — the best strategy is consistent medium jumps, not long ones that empty you out.',
  },
  {
    id: 'sandbag-lunge',
    name: 'Sandbag lunges',
    group: 'hyrox',
    purpose: 'Walking lunges while carrying a sandbag across the shoulders or upper back.',
    howTo: [
      'Set the bag across the upper back or shoulders and hold it firmly with both hands.',
      'Step forward and lower the back knee until it almost touches the floor.',
      'Keep the front knee tracking in line with the foot rather than collapsing inward.',
      'Drive through the front heel to stand, then step through with the other leg.',
      'Stay upright — leaning forward means the bag is too heavy or badly positioned.',
    ],
    mistakes: [
      'Letting the back knee hit the floor hard.',
      'Leaning forward, which shifts the load into the lower back.',
      'Steps so short that the front knee travels well past the toes.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Core', 'Erector spinae', 'Calves', 'Trapezius'],
    machineWins: 'The load is unstable, so the core and the hip stabilisers work far harder than they do in a dumbbell lunge.',
    calisthenicWins: 'Unloaded walking lunges train the same pattern and are demanding enough for a beginner, with no load on the back.',
    calisthenicAlternative: 'Walking lunges; Bulgarian split squats; lunges with a backpack full of books.',
    verdict: 'A loaded version of an already good movement. Beginners should own the unloaded walking lunge first.',
    hyroxNote: 'Hyrox station: 100 m sandbag lunges. The limiter is not leg strength but keeping the bag stable — a slipping bag wastes a lot of time.',
  },

  // ── Strength ─────────────────────────────────────────────────────────────
  {
    id: 'lat-pulldown',
    name: 'Lat pulldown',
    group: 'kekuatan',
    purpose: 'Pulling a load from overhead down — the vertical pulling pattern with adjustable weight.',
    howTo: [
      'Set the thigh pad tight enough that your body cannot lift off the seat.',
      'Take a grip slightly wider than shoulder-width.',
      'Pull the elbows down and back — imagine driving them toward your back pockets rather than pulling with the hands.',
      'Bring the bar to about chin or collarbone height, never behind the neck.',
      'Return slowly until the arms are almost straight, feeling the stretch across the back.',
    ],
    mistakes: [
      'Pulling the bar behind the neck — it forces the shoulder into extreme rotation with no added benefit.',
      'Swinging the torso backward to help, which turns the exercise into a row.',
      'A load so heavy that the range of motion halves.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Teres major'],
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Lower trapezius', 'Posterior deltoids'],
    machineWins: 'The load can be set LIGHTER than bodyweight, so someone who cannot yet do a pull-up can still train the vertical pull through a full range. That is a real advantage, not merely convenience.',
    calisthenicWins: 'Pull-ups demand whole-body stabilisation and train the core and grip far more. For someone already capable, the pull-up is the more complete stimulus.',
    calisthenicAlternative: 'Pull-ups; chin-ups; inverted rows; band-assisted pull-ups.',
    verdict: 'Not a "lesser" pull-up — it is the way in for those not yet strong enough, and a progression tool for those who are. Ideally you use both.',
  },
  {
    id: 'leg-press',
    name: 'Leg press',
    group: 'kekuatan',
    purpose: 'Pressing a load with the legs along a guided track.',
    howTo: [
      'Sit right back so the lower back and hips stay flat against the pad.',
      'Feet shoulder-width in the middle of the platform; higher emphasises glutes and hamstrings, lower emphasises quadriceps.',
      'Release the safety catch and lower until the knees reach about 90 degrees.',
      'Press through the whole foot, and do NOT lock the knees out.',
      'Keep the hips down — if they lift off the pad, you are lowering too far.',
    ],
    mistakes: [
      'Lowering so deep that the hips lift and the lower back rounds — the most common cause of injury on this machine.',
      'Locking the knees at the top.',
      'Putting the hands on the knees to help press.',
    ],
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Adductors'],
    machineWins: 'It allows very heavy leg loading without loading the spine, and without needing squat technique. Useful for anyone with back trouble or coming back from injury.',
    calisthenicWins: 'It trains no balance, core or hip stability, because the machine supports the back. Squats and lunges transfer far better to real movement like standing up from a chair or climbing stairs.',
    calisthenicAlternative: 'Bodyweight squats; Bulgarian split squats; a pistol squat progression; step-ups onto a bench.',
    verdict: 'Good for loading the quadriceps safely, but no substitute for squats and lunges, which train balance and the stabilisers. If you can only pick one, pick the squat or the lunge.',
  },
  {
    id: 'cable-machine',
    name: 'Cable machine (crossover)',
    group: 'kekuatan',
    purpose: 'Load through a pulley — resistance stays constant across the whole range of motion.',
    howTo: [
      'Set the pulley height for the movement: high for pulldowns, chest height for horizontal pushes and pulls, low for lifting movements.',
      'Stand with one foot slightly forward for stability on single-arm work.',
      'Move only the joint you intend to; keep everything else still.',
      'Return under control — never let the stack crash down.',
    ],
    mistakes: [
      'Using body momentum, so the target muscle never does the work.',
      'Dropping the weight on the return, which throws away half the benefit of the set.',
      'Standing too close to the pulley, so there is no tension at the start of the movement.',
    ],
    primaryMuscles: ['Depends on the setup — pectorals, lats, deltoids or arms'],
    secondaryMuscles: ['Core (especially on single-arm work)', 'Shoulder stabilisers'],
    machineWins: 'Tension stays constant through the movement, unlike a dumbbell whose tension changes with gravity. Excellent for rotation and anti-rotation work that is hard to load any other way.',
    calisthenicWins: 'Push-ups and dips train whole-body stabilisation that cables never ask for.',
    calisthenicAlternative: 'Resistance bands — the closest match to a cable’s tension curve, at a tiny fraction of the price.',
    verdict: 'The most versatile piece of equipment in a gym. Without one, resistance bands are the nearest substitute and adequate for most purposes.',
  },
  {
    id: 'smith-machine',
    name: 'Smith machine',
    group: 'kekuatan',
    purpose: 'A barbell locked to a vertical rail.',
    howTo: [
      'Set the safety stops just below the lowest point of your range.',
      'Place the feet slightly further forward than in a free squat, because the bar can only travel straight.',
      'Rotate the bar to unhook it before you start.',
      'Perform the movement as normal, then rotate the bar to re-hook it at the end of the set.',
    ],
    mistakes: [
      'Treating it as identical to a free barbell squat — the bar path is forced straight, so the joints must accommodate it, and for some people that causes pain.',
      'Not setting the safety stops.',
      'Lifting far more here than in a free squat and concluding you are stronger — the two numbers are not comparable.',
    ],
    primaryMuscles: ['Depends on the movement — quadriceps and glutes on squats, pectorals on bench'],
    secondaryMuscles: ['Fewer stabilisers than the free-weight version'],
    machineWins: 'Safe to train alone without a spotter, and useful for focusing on one muscle without balance as the limiter.',
    calisthenicWins: 'Precisely because the machine does the stabilising, the stabilisers and core work far less — and that is the part that matters most in real life.',
    calisthenicAlternative: 'Bodyweight squats; push-ups for the pressing pattern; goblet squats with a single dumbbell.',
    verdict: 'The most misunderstood machine in the gym. Not bad, but do not make it your only source of strength work — free or bodyweight movement is still needed for the stabilisers.',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell (swing)',
    group: 'fungsional',
    purpose: 'A swung bell that trains hip power (the hinge) and the posterior chain.',
    howTo: [
      'Place the kettlebell about 30 cm in front of your feet, feet shoulder-width apart.',
      'Hinge the HIPS back (rather than bending the knees as in a squat) and take the handle.',
      'Swing it back between the thighs, then DRIVE THE HIPS FORWARD hard.',
      'The bell is lifted by hip power, not by the arms. The arms are only a rope.',
      'The swing peaks around chest height; squeeze the glutes and brace the core at the top.',
    ],
    mistakes: [
      'Lifting with the shoulders instead of driving with the hips — the most common error, and the usual source of shoulder pain.',
      'Squatting instead of hinging, which changes the movement entirely.',
      'Rounding the back on the backswing.',
      'Swinging overhead without a solid technical base.',
    ],
    primaryMuscles: ['Gluteus maximus', 'Hamstrings', 'Erector spinae'],
    secondaryMuscles: ['Core', 'Trapezius', 'Deltoids', 'Grip muscles'],
    machineWins: 'It trains explosive hip power alongside cardio with one cheap tool, and the hinge pattern it teaches protects the back when lifting things in daily life.',
    calisthenicWins: 'Glute bridges and hip thrusts train the same muscles with no technical risk, and are safer to learn alone.',
    calisthenicAlternative: 'Glute bridges; unloaded single-leg deadlifts; broad jumps for the explosive component.',
    verdict: 'Very efficient when the technique is right, but among the most commonly performed badly without coaching. Learn the hinge unloaded first.',
  },
  {
    id: 'stair-climber',
    name: 'Stair climber / stepmill',
    group: 'kardio',
    purpose: 'Climbing a continuously revolving staircase.',
    howTo: [
      'Stand tall, using the handrails only for balance, never to carry your bodyweight.',
      'Step with the whole foot rather than just the toes.',
      'Start at a low speed for 3–5 minutes, then build.',
      'Keep the torso upright; leaning forward reduces the glute work.',
    ],
    mistakes: [
      'Leaning heavily on the rails — this cuts the actual work sharply while the display keeps counting as if you carried your full weight.',
      'Stepping on the toes only, which tires the calves fast and underuses the glutes.',
      'Taking two steps at a time without the strength for it.',
    ],
    primaryMuscles: ['Glutes', 'Quadriceps', 'Hamstrings'],
    secondaryMuscles: ['Calves', 'Core'],
    machineWins: 'The glute load is far higher than a flat treadmill while joint impact stays low, and the intensity is consistent because the stairs move on their own.',
    calisthenicWins: 'Climbing the stairs in a building gives almost the same stimulus for free, and also trains descending, which this machine never does.',
    calisthenicAlternative: 'Building stairs; step-ups onto a solid bench; lunges up an incline.',
    verdict: 'Effective, but one of the easiest machines to replace — a stairwell delivers an equivalent benefit at no cost.',
  },
]

export function equipmentByGroup(group: Group | null, query: string): Equipment[] {
  const q = query.toLowerCase().trim()
  return EQUIPMENT.filter((e) => {
    if (group && e.group !== group) return false
    if (!q) return true
    return `${e.name} ${e.purpose} ${e.primaryMuscles.join(' ')} ${e.group}`.toLowerCase().includes(q)
  })
}
