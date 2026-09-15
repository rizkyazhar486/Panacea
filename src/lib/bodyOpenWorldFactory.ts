export const BODY_WORLD_AXES = {
  system: ['cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive', 'immune', 'musculoskeletal', 'sensory-ent', 'integumentary'],
  zone: ['whole-body-hub', 'cranial-district', 'orbit-district', 'airway-tower', 'thoracic-city', 'cardiac-core', 'vascular-highway', 'abdominal-basin', 'hepatic-port', 'renal-station', 'pelvic-district', 'spinal-corridor', 'shoulder-yard', 'upper-limb-lab', 'hand-microcity', 'hip-complex', 'knee-arena', 'lower-limb-track', 'foot-groundlab', 'cellular-underworld'],
  mission: ['discover', 'trace', 'rescue', 'stabilize', 'localize', 'reconstruct', 'compare', 'diagnose-synthetic', 'simulate', 'navigate', 'assemble', 'decode', 'escort-signal', 'restore-flow', 'repair-model', 'scan', 'interrogate-pathway', 'boss-case'],
  objective: ['find-structure', 'follow-flow', 'match-layer', 'identify-territory', 'restore-balance', 'reach-target', 'collect-clues', 'sequence-events', 'rank-options', 'avoid-hazard', 'map-network', 'complete-procedure-concept', 'explain-mechanism', 'predict-synthetic-output'],
  encounter: ['quiet-exploration', 'timed-challenge', 'branching-case', 'moving-target', 'multi-system-event', 'signal-chase', 'imaging-puzzle', 'layer-maze', 'mechanism-puzzle', 'biomechanics-course', 'surgery-sandbox', 'micro-world-event'],
  difficulty: ['foundation', 'basic', 'intermediate', 'advanced', 'expert', 'research'],
  presentation: ['cinematic', 'minimal', 'spectral', 'glass', 'clinical', 'microscopic', 'night-mode', 'holographic'],
  progression: ['orientation', 'bronze', 'silver', 'gold', 'platinum', 'mastery', 'legend', 'sandbox'],
  reward: ['knowledge-node', 'camera-mode', 'visual-layer', 'case-fragment', 'anatomy-skin', 'simulation-control', 'badge', 'world-shortcut'],
  timeState: ['baseline', 'heartbeat', 'breathing', 'exercise', 'acute-event', 'recovery', 'progression', 'healing', 'development', 'night-cycle'],
} as const

export type BodyWorldAxis = keyof typeof BODY_WORLD_AXES
export type BodyWorldSelection = { [K in BodyWorldAxis]: (typeof BODY_WORLD_AXES)[K][number] }

export interface BodyWorldMission {
  index: bigint
  id: string
  title: string
  selection: BodyWorldSelection
  briefing: string
  objectiveText: string
  experimental: true
}

const AXES = Object.entries(BODY_WORLD_AXES) as [BodyWorldAxis, readonly string[]][]
export const BODY_WORLD_MISSION_COUNT = AXES.reduce((total, [, values]) => total * BigInt(values.length), 1n)

function wrap(index: bigint) {
  const value = index % BODY_WORLD_MISSION_COUNT
  return value < 0n ? value + BODY_WORLD_MISSION_COUNT : value
}

function humanize(value: string) {
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ')
}

export function bodyWorldMissionAt(rawIndex: bigint): BodyWorldMission {
  const canonical = wrap(rawIndex)
  let cursor = canonical
  const decoded: Partial<Record<BodyWorldAxis, string>> = {}

  for (let axisIndex = AXES.length - 1; axisIndex >= 0; axisIndex -= 1) {
    const [key, values] = AXES[axisIndex]
    const radix = BigInt(values.length)
    decoded[key] = values[Number(cursor % radix)]
    cursor /= radix
  }

  const selection = decoded as BodyWorldSelection
  const id = `WORLD-${canonical.toString(36).toUpperCase().padStart(9, '0')}`
  const title = `${humanize(selection.mission)} · ${humanize(selection.zone)}`
  const briefing = `${humanize(selection.presentation)} ${humanize(selection.encounter)} in the ${humanize(selection.system)} world during ${humanize(selection.timeState)}. Difficulty: ${humanize(selection.difficulty)}. Progression tier: ${humanize(selection.progression)}.`
  const objectiveText = `${humanize(selection.objective)} and earn ${humanize(selection.reward)}.`
  return { index: canonical, id, title, selection, briefing, objectiveText, experimental: true }
}

function hashSeed(seed: string) {
  let hash = 0x9e3779b97f4a7c15n
  const mask = 0xffffffffffffffffn
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= BigInt(seed.charCodeAt(index) + index * 131)
    hash = ((hash << 7n) | (hash >> 57n)) & mask
    hash = (hash * 0xbf58476d1ce4e5b9n) & mask
  }
  return hash
}

export function bodyWorldMissionFromSeed(seed: string) {
  return bodyWorldMissionAt(hashSeed(seed))
}

export function bodyWorldMissionSet(seed: string, count = 16) {
  const size = Math.max(1, Math.min(100, Math.floor(count)))
  let state = hashSeed(seed) || 1n
  const result: BodyWorldMission[] = []
  const seen = new Set<string>()
  const mask = 0xffffffffffffffffn

  while (result.length < size) {
    state ^= (state << 13n) & mask
    state ^= state >> 7n
    state ^= (state << 17n) & mask
    state &= mask
    const index = state % BODY_WORLD_MISSION_COUNT
    const key = index.toString()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(bodyWorldMissionAt(index))
  }

  return result
}

export function bodyWorldAxisStats() {
  return AXES.map(([axis, values]) => ({ axis, count: values.length }))
}

export function bodyWorldHumanCount() {
  const count = Number(BODY_WORLD_MISSION_COUNT)
  if (count >= 1e12) return `${(count / 1e12).toFixed(2)} trillion mission coordinates`
  if (count >= 1e9) return `${(count / 1e9).toFixed(2)} billion mission coordinates`
  if (count >= 1e6) return `${(count / 1e6).toFixed(2)} million mission coordinates`
  return new Intl.NumberFormat('en-US').format(count)
}

export const BODY_WORLD_RULES = {
  patientSpecific: false,
  diagnosticAuthority: false,
  treatmentAuthority: false,
  surgicalAutonomy: false,
  educationalSyntheticWorld: true,
  designGoal: 'high-agency open-world medical learning without pretending to be a validated clinical simulator',
} as const
