/**
 * Panacea Tactical Performance Coach
 *
 * Converts objective performance data into actionable, evidence-bounded coaching.
 * This is a sport/human-performance system, not an operational tactics system.
 */

export type CoachingDomain =
  | 'aerobic'
  | 'anaerobic'
  | 'strength'
  | 'power'
  | 'loaded-mobility'
  | 'agility'
  | 'movement-quality'
  | 'sleep-recovery'
  | 'heat'
  | 'cognition'
  | 'precision'
  | 'diving'
  | 'freediving'
  | 'motorsport'
  | 'team-performance'

export type CoachingPriority = 'maintain' | 'develop' | 'high-priority' | 'recover'

export interface CoachingSignal {
  id: string
  domain: CoachingDomain
  metricId: string
  normalizedValue: number
  confidence: number
  trend?: 'improving' | 'stable' | 'declining'
  source: string
}

export interface CoachingAction {
  id: string
  domain: CoachingDomain
  priority: CoachingPriority
  title: string
  why: string
  procedure: readonly string[]
  progression: readonly string[]
  reassess: string
  stopOrModifyWhen: readonly string[]
  evidenceNote: string
}

export interface CoachingPlan {
  sportId?: string
  actions: readonly CoachingAction[]
  dataCoverage: number
  confidence: number
  summary: string
  boundary: string
}

const safe = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))

function priorityFrom(value: number, trend?: CoachingSignal['trend']): CoachingPriority {
  if (trend === 'declining' && value < 0.7) return 'high-priority'
  if (value < 0.55) return 'high-priority'
  if (value < 0.75) return 'develop'
  if (trend === 'declining') return 'develop'
  return 'maintain'
}

const ACTION_LIBRARY: Record<CoachingDomain, Omit<CoachingAction, 'id' | 'priority'>[]> = {
  aerobic: [{
    domain: 'aerobic',
    title: 'Build durable aerobic capacity',
    why: 'A stronger aerobic base improves sustainable output and reduces the relative cost of repeated efforts.',
    procedure: [
      'Use mostly easy conversational-intensity aerobic work with one or two quality sessions per week.',
      'Keep sport-specific intensity anchors separate: pace for running, power for cycling, pace/100 m for swimming.',
      'Compare HR-to-output drift on matched terrain and environmental conditions.',
      'Retain at least one low-load recovery day after the hardest endurance session.',
    ],
    progression: [
      'Increase total weekly volume gradually before increasing both volume and intensity together.',
      'Add longer steady efforts only after recovery and technique remain stable.',
      'Re-test threshold/critical-speed type metrics after a meaningful training block rather than every few days.',
    ],
    reassess: 'Reassess after 3–6 weeks of consistent training using matched-condition field tests.',
    stopOrModifyWhen: [
      'Persistent performance decline across multiple sessions.',
      'Unusual exertional symptoms, illness, or significant pain.',
      'Sleep/recovery deterioration continues despite reduced load.',
    ],
    evidenceNote: 'Uses standard endurance principles: specificity, progressive overload, recovery, and sport-specific threshold/economy assessment.',
  }],
  anaerobic: [{
    domain: 'anaerobic',
    title: 'Improve repeat high-intensity capacity',
    why: 'Short repeated efforts require both anaerobic output and fast between-effort recovery.',
    procedure: [
      'Use short high-quality intervals with full enough recovery to preserve technique.',
      'Track the drop from first to last repetition instead of only the best effort.',
      'End the set when speed/power quality meaningfully collapses rather than accumulating junk volume.',
    ],
    progression: [
      'First increase repeat count while preserving output.',
      'Then shorten recovery modestly or increase task complexity.',
      'Avoid adding high-intensity density on top of unresolved fatigue.',
    ],
    reassess: 'Repeat the same interval protocol every 2–4 weeks.',
    stopOrModifyWhen: ['Technique deteriorates materially.', 'Output drops sharply across repetitions.', 'Recovery markers remain suppressed.'],
    evidenceNote: 'Quality-preserving interval progression is favored over indiscriminate fatigue accumulation.',
  }],
  strength: [{
    domain: 'strength',
    title: 'Build usable strength before chasing fatigue',
    why: 'Strength raises reserve capacity for sprinting, jumping, load carriage, contact, lifting and injury tolerance.',
    procedure: [
      'Prioritize a small number of compound movement patterns with consistent technique.',
      'Use submaximal working sets most of the time and reserve failure training for selected low-risk accessories.',
      'Track reps-in-reserve or velocity loss so effort is explicit.',
    ],
    progression: [
      'Add load only when target reps and technique remain stable.',
      'Deload or reduce volume after sustained performance decline.',
      'Periodically re-test with a standardized submaximal or estimated-1RM protocol.',
    ],
    reassess: 'Review trend every 2–4 weeks; formal test after 6–12 weeks.',
    stopOrModifyWhen: ['Pain alters movement.', 'Technique breaks before target effort.', 'Recovery is inadequate for repeated quality sessions.'],
    evidenceNote: 'Applies progressive overload, technique standardization, and fatigue management rather than maximal testing every session.',
  }],
  power: [{
    domain: 'power',
    title: 'Train explosive output while fresh',
    why: 'Power depends on producing force quickly; excessive fatigue reduces the quality of the stimulus.',
    procedure: [
      'Place jumps, throws, sprints, or velocity-focused lifts early in the session.',
      'Use low-to-moderate repetition counts with generous recovery.',
      'Track jump distance/height or movement velocity when valid measurement is available.',
    ],
    progression: [
      'Increase complexity only after landing/control quality is stable.',
      'Progress load cautiously while preserving speed.',
      'Use performance-retention comparisons after endurance/load-carriage blocks.',
    ],
    reassess: 'Re-test the same explosive task every 2–4 weeks.',
    stopOrModifyWhen: ['Output falls markedly within the session.', 'Landing/control degrades.', 'Pain or instability appears.'],
    evidenceNote: 'Power work is quality-sensitive; fatigue obscures true neuromuscular output.',
  }],
  'loaded-mobility': [{
    domain: 'loaded-mobility',
    title: 'Progress load carriage systematically',
    why: 'External load changes energy cost, gait and movement quality; adding too much too quickly raises injury risk.',
    procedure: [
      'Document body mass, carried load, route, grade, surface, footwear and temperature.',
      'Compare loaded pace and HR against a matched unloaded baseline.',
      'Train posture, trunk/hip strength and foot/ankle capacity alongside loaded walking/running.',
      'Use the same pack configuration during comparison sessions.',
    ],
    progression: [
      'Progress one variable at a time: duration, distance, load, terrain difficulty, or speed.',
      'Prefer more distance at stable mechanics before combining heavy load with high speed.',
      'Use retention metrics to detect when load is degrading movement disproportionately.',
    ],
    reassess: 'Repeat a standardized loaded route every 2–4 weeks.',
    stopOrModifyWhen: ['Gait changes substantially.', 'Pain develops in feet, knees, hips, back, or shoulders.', 'Heat strain or recovery cost becomes excessive.'],
    evidenceNote: 'Public military load-carriage literature supports explicit load, terrain and biomechanics monitoring.',
  }],
  agility: [{
    domain: 'agility',
    title: 'Train deceleration before faster direction change',
    why: 'Efficient agility depends on braking control, body position, re-acceleration and decision speed.',
    procedure: [
      'Start with planned cuts and braking drills before reactive direction-change tasks.',
      'Measure course time and error rate, not time alone.',
      'Practice both dominant and non-dominant directions.',
    ],
    progression: [
      'Progress from planned to reactive.',
      'Then add mild fatigue or external load only if movement remains controlled.',
      'Compare retention under load/fatigue against a fresh baseline.',
    ],
    reassess: 'Use the same course and timing setup every 2–4 weeks.',
    stopOrModifyWhen: ['Knee/ankle control deteriorates.', 'Error rate rises despite faster time.', 'Pain appears during braking or cutting.'],
    evidenceNote: 'Agility quality combines mechanics and perception-action performance.',
  }],
  'movement-quality': [{
    domain: 'movement-quality',
    title: 'Fix the movement limiter that actually changes performance',
    why: 'Movement screening is useful only when linked to a repeatable performance or symptom constraint.',
    procedure: [
      'Identify the specific movement/task that fails under speed, load, fatigue, or range.',
      'Film or measure the same task from repeatable angles.',
      'Train mobility only where range is truly limiting; train strength/control where capacity is limiting.',
    ],
    progression: [
      'Re-test the exact task, not a different surrogate.',
      'Increase speed/load after control is stable.',
      'Avoid chasing symmetry for its own sake when function is unaffected.',
    ],
    reassess: 'Re-test weekly for simple movement constraints; less often for structural adaptations.',
    stopOrModifyWhen: ['Symptoms worsen.', 'Compensation increases.', 'The intervention does not change the target task after a reasonable block.'],
    evidenceNote: 'Functional improvement is prioritized over arbitrary visual perfection.',
  }],
  'sleep-recovery': [{
    domain: 'sleep-recovery',
    title: 'Protect sleep before adding training complexity',
    why: 'Sleep supports recovery, reaction, judgment and adaptation; poor sleep can make every other training signal look worse.',
    procedure: [
      'Track sleep duration/continuity as trends rather than reacting to one night.',
      'Stabilize wake time and protect a consistent sleep opportunity.',
      'Place the hardest sessions after better-recovered periods when possible.',
      'Reduce late stimulants/alcohol and heavy late-night training when they disrupt sleep.',
    ],
    progression: [
      'First improve consistency, then total duration.',
      'Compare next-day reaction/RPE/performance after better vs worse sleep.',
      'Use deloads when sleep and performance both deteriorate.',
    ],
    reassess: 'Review rolling 7–14 day trends.',
    stopOrModifyWhen: ['Persistent insomnia, excessive sleepiness, or suspected sleep disorder.', 'Performance continues to decline despite adequate training reduction.'],
    evidenceNote: 'Army H2F publicly treats sleep as a core readiness domain and emphasizes adequate sleep opportunity.',
  }],
  heat: [{
    domain: 'heat',
    title: 'Manage heat as a performance load',
    why: 'Heat and humidity increase cardiovascular strain and can impair pace/output at the same effort.',
    procedure: [
      'Track temperature, humidity/WBGT, exposure duration, HR and RPE together.',
      'Adjust pace/output expectations to environment instead of forcing cool-weather numbers.',
      'Use progressive heat exposure before important hot-environment events when appropriate.',
      'Plan hydration from measured sweat-loss patterns rather than generic intake targets.',
    ],
    progression: [
      'Increase heat exposure gradually.',
      'Do not simultaneously increase heat, load, distance and intensity aggressively.',
      'Use matched-environment comparisons to judge adaptation.',
    ],
    reassess: 'Compare HR/RPE/output across similar heat conditions over 1–2 weeks.',
    stopOrModifyWhen: ['Confusion, collapse, severe weakness, or other heat-illness warning signs.', 'Physiological strain rises disproportionately.'],
    evidenceNote: 'Heat is treated as an independent external load; wearable data alone cannot diagnose heat illness.',
  }],
  cognition: [{
    domain: 'cognition',
    title: 'Train decision quality under fatigue, not just reaction speed',
    why: 'Fast responses are not useful if accuracy collapses; fatigue-resilient performance requires both speed and correct decisions.',
    procedure: [
      'Use standardized benign reaction, attention, working-memory, or choice tasks before and after exercise.',
      'Track median reaction time plus error/false-positive rate.',
      'Use repeated trials to reduce noise from one lucky response.',
    ],
    progression: [
      'First establish a stable fresh baseline.',
      'Then add controlled physical fatigue.',
      'Add complexity only if accuracy remains acceptable.',
    ],
    reassess: 'Use the same task battery after representative hard sessions.',
    stopOrModifyWhen: ['Accuracy falls sharply.', 'Sleep deprivation or illness makes results non-comparable.', 'The task is not repeatable enough to establish a baseline.'],
    evidenceNote: 'Objective task retention is kept separate from psychometric resilience/mental-toughness constructs.',
  }],
  precision: [{
    domain: 'precision',
    title: 'Build benign precision under physiological stress',
    why: 'Fine motor and visual-motor control can deteriorate when HR, fatigue, or time pressure rises.',
    procedure: [
      'Use safe sport tasks such as target tapping, ball placement, throwing accuracy, racquet placement, or simulator control.',
      'Record accuracy, dispersion, completion time and HR/RPE.',
      'Compare fresh and fatigued conditions using the identical task.',
    ],
    progression: [
      'Increase speed constraints before increasing task complexity.',
      'Then add fatigue or environmental stress gradually.',
      'Keep accuracy threshold visible so speed cannot hide poorer execution.',
    ],
    reassess: 'Repeat matched fresh-vs-fatigued testing every 2–4 weeks.',
    stopOrModifyWhen: ['Accuracy declines without recovery across sessions.', 'Pain/tremor/neurologic symptoms appear.'],
    evidenceNote: 'This domain intentionally excludes weapon-use optimization.',
  }],
  diving: [{
    domain: 'diving',
    title: 'Improve neutral buoyancy, trim and task economy',
    why: 'Stable depth/trim reduces unnecessary movement and can improve control and gas-efficiency context.',
    procedure: [
      'Use actual depth/IMU/dive-computer data when available.',
      'Practice hovering in controlled water with a qualified buddy/instructor.',
      'Track depth variation, vertical speed, trim and task-induced disturbance.',
      'Keep environmental current/visibility separate from technique errors.',
    ],
    progression: [
      'Master stable hover before adding complex task loading.',
      'Then add propulsion changes, equipment handling, current, or navigation progressively.',
      'Compare similar depth/current conditions.',
    ],
    reassess: 'Review depth/trim stability after comparable dives.',
    stopOrModifyWhen: ['Uncontrolled ascent/descent occurs.', 'Gas management or decompression safety becomes a concern.', 'Conditions exceed training/qualification.'],
    evidenceNote: 'Technique coaching only; dive computer/instructor remains authority for decompression, weighting and dive safety.',
  }],
  freediving: [{
    domain: 'freediving',
    title: 'Prioritize efficient technique and conservative safety margins',
    why: 'Freediving performance is limited by physiology and safety constraints that cannot be reduced to a wearable score.',
    procedure: [
      'Track actual dive time, depth, surface interval and technique consistency.',
      'Practice relaxation, streamlined movement and efficient turns with trained supervision.',
      'Use a qualified buddy/safety diver for in-water breath-hold practice.',
      'Keep depth progression conservative and separate from ego/competition pressure.',
    ],
    progression: [
      'Improve technique and recovery consistency before increasing depth/time.',
      'Change one progression variable at a time.',
      'Use repeated comparable dives rather than chasing personal bests every session.',
    ],
    reassess: 'Review technique, recovery and safety quality across multiple sessions.',
    stopOrModifyWhen: ['Any loss of motor control, blackout, confusion, chest symptoms, or concerning recovery pattern.', 'Buddy/safety coverage is inadequate.'],
    evidenceNote: 'No blackout prediction; breath-hold safety procedures remain primary.',
  }],
  motorsport: [{
    domain: 'motorsport',
    title: 'Train human consistency under vehicle load',
    why: 'Driving/riding performance depends on sustaining decision quality, posture, heat tolerance and control consistency over repeated laps/stints.',
    procedure: [
      'Synchronize HR/temperature/reaction data with authorized vehicle telemetry.',
      'Compare lap/stint consistency, not only fastest lap.',
      'Track where control inputs become less repeatable as fatigue rises.',
      'Use simulator or closed-course sport practice for technique analysis.',
    ],
    progression: [
      'Increase stint duration before increasing complexity.',
      'Train neck/trunk/grip endurance and heat tolerance appropriate to the discipline.',
      'Use post-stint reaction/precision tasks to quantify residual fatigue.',
    ],
    reassess: 'Compare matched circuit/simulator blocks across training cycles.',
    stopOrModifyWhen: ['Heat strain, dizziness, pain, or cognitive impairment appears.', 'Vehicle control consistency deteriorates materially.'],
    evidenceNote: 'Human-performance coaching only; no autonomous vehicle control or unsafe driving instruction.',
  }],
  'team-performance': [{
    domain: 'team-performance',
    title: 'Improve team readiness without individual surveillance',
    why: 'Team performance depends on availability, recovery, role demand and coordination, not one aggregate score.',
    procedure: [
      'Use consented aggregate workload, availability and recovery trends.',
      'Protect minimum group sizes and suppress sensitive individual data in team views.',
      'Track role-specific physical demands rather than comparing everyone to one template.',
    ],
    progression: [
      'Adjust training by role and recent exposure.',
      'Use group trends to change session design, then review individual data privately where authorized.',
      'Reassess after schedule congestion, travel or environmental stress blocks.',
    ],
    reassess: 'Review weekly with rolling load and availability trends.',
    stopOrModifyWhen: ['Privacy thresholds cannot be met.', 'Data quality is too sparse for role-specific conclusions.'],
    evidenceNote: 'Team analytics are aggregate and consent-based; not surveillance.',
  }],
}

export function buildCoachingPlan(
  signals: readonly CoachingSignal[],
  sportId?: string,
): CoachingPlan {
  const valid = signals.filter((signal) =>
    signal.id.trim() &&
    signal.source.trim() &&
    Number.isFinite(signal.normalizedValue) &&
    signal.normalizedValue >= 0 &&
    signal.normalizedValue <= 1 &&
    Number.isFinite(signal.confidence) &&
    signal.confidence > 0 &&
    signal.confidence <= 1,
  )

  const byDomain = new Map<CoachingDomain, CoachingSignal[]>()
  for (const signal of valid) {
    const group = byDomain.get(signal.domain) ?? []
    group.push(signal)
    byDomain.set(signal.domain, group)
  }

  const actions: CoachingAction[] = []
  for (const [domain, group] of byDomain) {
    const totalWeight = group.reduce((sum, signal) => sum + signal.confidence, 0)
    const weighted = group.reduce((sum, signal) => sum + signal.normalizedValue * signal.confidence, 0) / totalWeight
    const declining = group.some((signal) => signal.trend === 'declining')
    const priority = priorityFrom(weighted, declining ? 'declining' : undefined)

    for (const template of ACTION_LIBRARY[domain] ?? []) {
      actions.push(Object.freeze({
        id: `${domain}-${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        priority,
        ...template,
      }))
    }
  }

  const confidence = valid.length
    ? valid.reduce((sum, signal) => sum + signal.confidence, 0) / valid.length
    : 0
  const dataCoverage = byDomain.size / Object.keys(ACTION_LIBRARY).length

  actions.sort((a, b) => {
    const rank: Record<CoachingPriority, number> = { 'high-priority': 0, recover: 1, develop: 2, maintain: 3 }
    return rank[a.priority] - rank[b.priority]
  })

  return Object.freeze({
    sportId,
    actions: Object.freeze(actions),
    dataCoverage,
    confidence,
    summary: actions.length
      ? `Prioritize ${actions.filter((a) => a.priority === 'high-priority').length} high-priority domain(s), then develop weaker domains while maintaining strengths.`
      : 'Not enough valid data to generate a coaching plan.',
    boundary:
      'Coaching applies to sport and human performance only. It excludes weapon-use optimization, human targeting, covert surveillance, pursuit/evasion operations and operational mission planning.',
  })
}

export const COACHING_SOURCE_NOTES = Object.freeze([
  'Army H2F: integrated physical, sleep, nutrition and cognitive readiness concepts.',
  'Marine Force Fitness: progressive functional conditioning and injury reduction.',
  'FBI public PFT: mixed strength, sprint, muscular-endurance and aerobic benchmarks.',
  'Load-carriage research: external load alters physiological and biomechanical cost.',
  'Sport-science principle: recommendations should be specific, progressive, measurable, and re-tested under comparable conditions.',
])
