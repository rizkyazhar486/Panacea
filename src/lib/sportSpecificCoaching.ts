/**
 * Sport-specific coaching playbooks for Panacea Universal Sport OS.
 * These are evidence-bounded training procedures, not operational mission,
 * weapon-use, unsafe vehicle, or high-risk dive instructions.
 */

export interface SportCoachingPlaybook {
  sportId: string
  title: string
  priorities: readonly string[]
  procedures: readonly string[]
  progression: readonly string[]
  track: readonly string[]
  reassess: readonly string[]
  safetyBoundary: string
}

export const SPORT_COACHING_PLAYBOOKS = Object.freeze([
  {
    sportId: 'tennis',
    title: 'Tennis performance development',
    priorities: [
      'Repeatable first-serve mechanics and second-serve reliability',
      'Efficient split-step, braking and re-acceleration',
      'Rally tolerance with tactical shot selection',
      'Recovery between points and between matches',
    ],
    procedures: [
      'Film serve and groundstroke patterns from repeatable angles and compare contact consistency rather than aesthetics alone.',
      'Use planned footwork patterns first, then reactive feeds that require directional choice.',
      'Train serve + first-ball and return + first-ball sequences because match performance depends on linked actions, not isolated strokes.',
      'Alternate high-quality rally blocks with realistic recovery intervals while tracking error rate and heart rate.',
      'Separate technical practice from fatigue-heavy conditioning when mechanics are the learning target.',
    ],
    progression: [
      'Stable technique -> variable placement -> reactive decision -> pressure/fatigue.',
      'Increase rally intensity only while unforced-error rate and movement quality remain controlled.',
      'Move from predictable feeds to opponent/video-driven anticipation tasks.',
    ],
    track: ['serve-speed', 'serve-in-rate', 'unforced-error-rate', 'rally-duration', 'direction-change-count', 'heart-rate', 'RPE'],
    reassess: ['Serve placement test every 2–4 weeks.', 'Matched rally/footwork test after a training block.', 'Match review by point-pattern rather than only win/loss.'],
    safetyBoundary: 'Sport coaching only; do not train through acute joint pain or neurologic symptoms.',
  },
  {
    sportId: 'baseball',
    title: 'Baseball performance development',
    priorities: [
      'Pitch/hit mechanics that remain repeatable under game-speed effort',
      'Bat speed and batted-ball quality',
      'Sprint/first-step performance',
      'Throwing-load and recovery management',
    ],
    procedures: [
      'Use radar/camera metrics only from validated sources and preserve pitch/hit definition.',
      'For hitters, pair bat-speed work with exit-velocity and launch-angle context rather than chasing one metric.',
      'For pitchers, compare velocity/spin/release trends at similar effort and workload conditions.',
      'Train acceleration and base-running mechanics separately from hitting volume.',
      'Track throwing exposure and recovery instead of using velocity alone as readiness.',
    ],
    progression: [
      'Technique consistency -> intent/speed -> game-like variability.',
      'Increase throwing/hitting volume gradually and avoid simultaneous large jumps in intensity and volume.',
      'Re-test batted-ball/pitch metrics under the same device/setup.',
    ],
    track: ['pitch-velocity', 'spin-rate', 'exit-velocity', 'launch-angle', 'bat-speed', 'sprint-speed', 'throwing-volume', 'RPE'],
    reassess: ['Weekly workload trend.', 'Formal radar/camera block every 2–4 weeks.', 'Re-check mechanics after meaningful velocity or fatigue change.'],
    safetyBoundary: 'No medical diagnosis from throwing metrics; pain or loss of control requires appropriate clinical evaluation.',
  },
  {
    sportId: 'f1',
    title: 'Formula racing human performance',
    priorities: [
      'Stint consistency under heat and g-load',
      'Neck/trunk/grip endurance',
      'Reaction and precision retention',
      'Hydration, cooling and recovery',
    ],
    procedures: [
      'Synchronize authorized vehicle telemetry with heart rate, temperature, RPE and reaction testing.',
      'Analyze lap-to-lap consistency and control-input drift instead of only fastest lap.',
      'Use simulator/closed-course blocks for repeatable braking, throttle and steering consistency.',
      'Train neck/trunk isometrics and grip endurance with progressive loading appropriate to motorsport.',
      'Perform post-stint benign reaction/precision testing to quantify residual fatigue.',
    ],
    progression: [
      'Short repeatable stints -> longer duration -> heat/environment complexity.',
      'Increase human workload only while control consistency remains stable.',
      'Separate vehicle setup changes from human-performance testing when possible.',
    ],
    track: ['lap-time-variance', 'heart-rate', 'core-or-skin-temperature', 'g-load', 'brake-consistency', 'throttle-consistency', 'reaction-time', 'RPE'],
    reassess: ['Matched simulator/circuit block each training cycle.', 'Heat/cooling strategy review after representative long stints.', 'Reaction retention pre/post stint.'],
    safetyBoundary: 'No vehicle-control automation or unsafe driving instruction; qualified race/medical safety decisions override coaching.',
  },
  {
    sportId: 'motogp',
    title: 'Motorcycle racing human performance',
    priorities: [
      'Repeatable braking and throttle control',
      'Lean/body-position consistency',
      'Neck/trunk/forearm endurance',
      'Heat and cognitive fatigue management',
    ],
    procedures: [
      'Align bike IMU/lean, brake, throttle and suspension telemetry with rider physiology where authorized.',
      'Use closed-course/simulator analysis to identify consistency loss late in sessions.',
      'Train trunk, hip and forearm endurance without compromising fine control.',
      'Review left/right asymmetry only when it changes repeatable performance or symptoms.',
    ],
    progression: [
      'Stable technique at submaximal pace -> longer consistent sessions -> higher competitive demand.',
      'Progress heat exposure and stint duration separately when possible.',
      'Re-test control consistency after strength/endurance blocks.',
    ],
    track: ['lean-angle', 'brake-input', 'throttle-input', 'g-load', 'heart-rate', 'temperature', 'lap-time-variance', 'RPE'],
    reassess: ['Session telemetry review.', 'Matched sector consistency across blocks.', 'Post-session reaction/precision retention.'],
    safetyBoundary: 'No road-risk escalation; track/simulator context and qualified safety authority remain primary.',
  },
  {
    sportId: 'running-road',
    title: 'Running performance development',
    priorities: ['Aerobic durability', 'Threshold/critical-speed development', 'Running economy', 'Load-tolerant tissue capacity'],
    procedures: [
      'Keep easy volume genuinely easy and reserve hard sessions for specific quality targets.',
      'Use pace/HR/power relationships in matched terrain/weather rather than one universal pace.',
      'Include strength and gradual speed exposure for tissue capacity.',
      'Track trend in recovery and pain rather than forcing mileage targets.',
    ],
    progression: ['Build frequency/volume first.', 'Add threshold work next.', 'Add race-specific intervals after durable base and recovery are stable.'],
    track: ['pace', 'heart-rate', 'running-power', 'cadence', 'RPE', 'weekly-volume', 'sleep'],
    reassess: ['Matched field test every 3–6 weeks.', 'Weekly load/recovery review.', 'Technique review when pace or pain pattern changes.'],
    safetyBoundary: 'Persistent pain, exertional red flags or illness override training targets.',
  },
  {
    sportId: 'road-cycling',
    title: 'Road cycling performance development',
    priorities: ['Sustainable power', 'Durability', 'Climbing power-to-mass context', 'Pacing/fueling/environment strategy'],
    procedures: [
      'Use calibrated power when available and preserve meter identity.',
      'Separate endurance, threshold and high-intensity sessions by purpose.',
      'Compare HR-to-power drift in steady conditions.',
      'Practice fueling/hydration during representative long rides.',
      'Review bike fit when pain or efficiency changes persist.',
    ],
    progression: ['Increase endurance duration.', 'Then threshold density.', 'Then event-specific climbs/surges and fatigue resistance.'],
    track: ['power', 'FTP-or-threshold', 'W/kg', 'cadence', 'HR', 'decoupling', 'fuel-intake', 'wind', 'gradient'],
    reassess: ['Power/threshold block every 4–8 weeks.', 'Long-ride durability review.', 'Fit review after equipment/body changes.'],
    safetyBoundary: 'Traffic/road/weather safety overrides training plan; no unsafe speed coaching.',
  },
  {
    sportId: 'swimming-pool',
    title: 'Swimming performance development',
    priorities: ['Technique efficiency', 'Critical-speed/aerobic capacity', 'Stroke consistency', 'Turn/start quality'],
    procedures: [
      'Track pace and stroke metrics at a known pool length.',
      'Use technique blocks while fresh before high-fatigue sets.',
      'Compare stroke rate with distance per stroke rather than maximizing either alone.',
      'Build CSS/threshold sets only from valid time trials.',
    ],
    progression: ['Stable technique -> longer aerobic repeats -> threshold sets -> race-specific speed.'],
    track: ['pace-100m', 'stroke-rate', 'distance-per-stroke', 'SWOLF', 'CSS', 'RPE'],
    reassess: ['Technique video every block.', 'CSS-type test every 4–8 weeks.', 'Review pace fade within repeat sets.'],
    safetyBoundary: 'Aquatic supervision and facility rules remain primary; unexplained symptoms override training.',
  },
  {
    sportId: 'triathlon',
    title: 'Triathlon / Ironman performance development',
    priorities: ['Discipline-specific thresholds', 'Bike-to-run durability', 'Open-water efficiency', 'Fueling/hydration', 'Pacing'],
    procedures: [
      'Keep swim, bike and run thresholds separate rather than transferring zones blindly.',
      'Use brick sessions selectively to quantify compromised running.',
      'Practice race fueling during long sessions.',
      'Include open-water current/wind/navigation context when safe and supervised.',
      'Track transition cost independently from physiological performance.',
    ],
    progression: ['Base each discipline.', 'Add race-specific bricks.', 'Extend duration and fueling practice.', 'Taper only after sufficient race-specific exposure.'],
    track: ['swim-pace', 'bike-power', 'run-pace', 'HR', 'transition-time', 'fuel-rate', 'hydration', 'current', 'wind'],
    reassess: ['Discipline threshold tests every training block.', 'Brick degradation trend.', 'Race rehearsal before taper.'],
    safetyBoundary: 'Open-water and environmental safety gates override pace goals.',
  },
  {
    sportId: 'hyrox',
    title: 'HYROX performance development',
    priorities: ['Compromised running', 'Station economy', 'Roxzone transitions', 'Strength-endurance'],
    procedures: [
      'Time every run and station separately.',
      'Compare fresh run pace with post-station pace degradation.',
      'Practice technically demanding stations while fresh before fatigue circuits.',
      'Train transitions and pacing instead of treating the event as one continuous maximal effort.',
    ],
    progression: ['Technique/strength base -> station repeatability -> run-station bricks -> full simulation.'],
    track: ['run-splits', 'station-splits', 'Roxzone', 'HR', 'RPE', 'compromised-running-delta'],
    reassess: ['Partial simulation every 2–4 weeks.', 'Full simulation sparingly.', 'Review biggest time-loss station first.'],
    safetyBoundary: 'Movement quality and heat/venue safety override time targets.',
  },
  {
    sportId: 'scuba-diving',
    title: 'Scuba diving technique development',
    priorities: ['Neutral buoyancy', 'Trim', 'Propulsion efficiency', 'Task loading', 'Environmental awareness'],
    procedures: [
      'Use actual dive-computer depth and IMU data when available.',
      'Practice hovering and trim in controlled conditions with qualified buddy/instructor support.',
      'Separate current-induced movement from diver-control error.',
      'Add navigation/equipment task loading only after depth/trim control is repeatable.',
      'Review gas consumption only as context, not as a competition metric.',
    ],
    progression: ['Stable hover -> propulsion -> navigation -> controlled task loading -> progressively more complex environments within certification.'],
    track: ['depth-SD', 'vertical-speed-RMS', 'trim', 'current', 'water-temperature', 'gas-context', 'communication-quality'],
    reassess: ['Compare similar depth/current dives.', 'Review loss-of-depth-control events.', 'Reassess after equipment configuration changes.'],
    safetyBoundary: 'No decompression, gas-strategy or weighting prescription from Panacea; dive computer/instructor/certification limits remain authoritative.',
  },
  {
    sportId: 'freediving',
    title: 'Freediving performance development',
    priorities: ['Relaxation/efficiency', 'Streamlining', 'Surface recovery discipline', 'Conservative progression'],
    procedures: [
      'Practice only with appropriate buddy/safety coverage.',
      'Track depth/time/surface interval and technique consistency rather than chasing records each session.',
      'Use relaxation and efficient movement work in controlled conditions.',
      'Increase one demand variable at a time and keep recovery quality visible.',
    ],
    progression: ['Technique and safety consistency -> modest depth/time progression -> event-specific refinement under qualified supervision.'],
    track: ['depth', 'dive-time', 'surface-interval', 'HR', 'source-valid-SpO2', 'current', 'water-temperature'],
    reassess: ['Review multiple comparable dives.', 'Reassess after any loss-of-motor-control or abnormal recovery event.'],
    safetyBoundary: 'No blackout prediction or solo breath-hold practice; recognized freediving safety procedures are primary.',
  },
  {
    sportId: 'tactical-fitness',
    title: 'Tactical athlete human-performance development',
    priorities: ['Loaded mobility', 'Strength/power reserve', 'Aerobic/anaerobic capacity', 'Cognitive retention', 'Heat/sleep resilience'],
    procedures: [
      'Benchmark matched fresh vs loaded/fatigued performance.',
      'Progress one external stressor at a time: load, distance, terrain, speed, heat or task complexity.',
      'Pair load carriage with trunk/hip/foot strength and movement-quality work.',
      'Use benign reaction/attention/precision tasks pre/post exertion.',
      'Protect sleep and environmental recovery before adding training density.',
    ],
    progression: ['Base physical capacity -> loaded retention -> reactive/precision under fatigue -> integrated sport-specific challenge.'],
    track: ['relative-load', 'loaded-pace', 'agility-retention', 'power-retention', 'reaction-retention', 'sleep', 'WBGT', 'RPE'],
    reassess: ['Standardized loaded route every 2–4 weeks.', 'Fresh-vs-fatigued cognitive task battery.', 'Weekly recovery/environment review.'],
    safetyBoundary: 'Human-performance training only; excludes weapons, targeting, covert surveillance, pursuit/evasion operations and mission planning.',
  },
] satisfies readonly SportCoachingPlaybook[])

export function getSportCoachingPlaybook(sportId: string) {
  return SPORT_COACHING_PLAYBOOKS.find((playbook) => playbook.sportId === sportId) ?? null
}
