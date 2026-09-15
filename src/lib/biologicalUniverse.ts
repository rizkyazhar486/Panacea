import type { CausalDomain, CausalScale } from './causalTimeMachine'

export interface BiologicalUniverseInput {
  closure: number
  reserve: number
  demand: number
  time: number
}

export interface BiologicalStagePulse {
  id: string
  label: string
  activation: number
}

export interface BiologicalWorld {
  id: 'baseline' | 'primary' | 'alternate'
  label: string
  closure: number
  geometry: number
  resistance: number
  transport: number
  stress: number
  propagation: number
  stages: BiologicalStagePulse[]
}

export interface BiologicalUniverseTrio {
  baseline: BiologicalWorld
  primary: BiologicalWorld
  alternate: BiologicalWorld
}

export const BIOLOGICAL_SCALE_ORDER: CausalScale[] = ['person', 'organ', 'tissue', 'cell', 'molecule']

export const BIOLOGICAL_FORMULA_LEDGER = [
  {
    id: 'direct-manipulation',
    formula: 'p = clamp((d_open − d_pointer) / (d_open − d_closed), 0, 1)',
    boundary: 'Pointer geometry is an interface mapping only. p is not measured stenosis, obstruction, compression, severity, or anatomy.',
  },
  {
    id: 'geometry-map',
    formula: 'r_norm = 1 − 0.62p',
    boundary: 'Panacea-authored normalized geometry mapping used to make direct manipulation visible. It is not a patient radius measurement.',
  },
  {
    id: 'poiseuille',
    formula: 'R_rel ∝ 1 / r_norm⁴',
    boundary: 'Idealized rigid-tube teaching relationship for coronary/airway worlds only; blood vessels and airways are compliant, branching biological systems.',
  },
  {
    id: 'neural',
    formula: 'C_index = (1 − 0.72p)² × reserve_modifier',
    boundary: 'Panacea-authored visualization heuristic. It is not a nerve-conduction equation or electrodiagnostic measurement.',
  },
  {
    id: 'temporal',
    formula: 'α = s²(3 − 2s); y(t) = (1 − α)y₀ + αy*',
    boundary: 'Smoothstep is used only to animate a causal teaching transition; it is not biological kinetics or a time-to-event model.',
  },
] as const

const DOMAIN_STAGES: Record<CausalDomain, string[]> = {
  coronary: ['calibre', 'resistance', 'transport', 'supply–demand', 'synthetic mismatch'],
  airway: ['calibre', 'resistance', 'airflow', 'work context', 'synthetic mismatch'],
  neural: ['compression', 'conduction index', 'signal transport', 'task context', 'synthetic mismatch'],
}

const SCALE_CONCEPTS: Record<CausalDomain, Record<CausalScale, string>> = {
  coronary: {
    person: 'A whole-body teaching world links demand context to a synthetic coronary transport chain.',
    organ: 'The heart becomes the active spatial anchor while coronary transport is manipulated.',
    tissue: 'Myocardial territory is represented as a supply–demand field, not patient perfusion imaging.',
    cell: 'A cardiomyocyte-scale view represents downstream energetic context without inventing cellular measurements.',
    molecule: 'The causal tunnel ends at abstract oxygen/energy-use concepts rather than fabricated molecular concentrations.',
  },
  airway: {
    person: 'A whole-body respiratory teaching world links breathing demand to an authored airway transport chain.',
    organ: 'The airway tree becomes the active anchor while normalized calibre is manipulated.',
    tissue: 'Distal lung tissue is shown as a transport destination, not measured ventilation or V/Q.',
    cell: 'An epithelial/alveolar cell view represents downstream context without patient-specific biology.',
    molecule: 'The tunnel terminates in abstract gas-transfer concepts; no blood-gas values are inferred.',
  },
  neural: {
    person: 'A whole-body motor-sensory teaching world links task demand to an authored conduction chain.',
    organ: 'The nervous system becomes the anchor while a synthetic compression control is manipulated.',
    tissue: 'A nerve/fascicle-scale view shows signal continuity rather than measured conduction velocity.',
    cell: 'An axon-scale teaching view represents continuity and reserve without electrophysiologic inference.',
    molecule: 'The tunnel terminates at abstract membrane/signaling concepts, not ion concentrations or channel kinetics.',
  },
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function smoothstep(value: number) {
  const s = clamp01(value)
  return s * s * (3 - 2 * s)
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t)
}

export function closureFromPinchY(pointerY: number, height = 260) {
  if (!Number.isFinite(pointerY) || !Number.isFinite(height) || height <= 0) return 0
  const center = height / 2
  const openHalfGap = height * 0.208
  const closedHalfGap = height * 0.069
  const distance = Math.abs(pointerY - center)
  return clamp01((openHalfGap - distance) / Math.max(openHalfGap - closedHalfGap, 0.001))
}

export function normalizedGeometry(domain: CausalDomain, closure: number) {
  const p = clamp01(closure)
  return domain === 'neural' ? clamp01(1 - 0.72 * p) : Math.max(0.38, 1 - 0.62 * p)
}

function targetTransport(domain: CausalDomain, closure: number, reserve: number) {
  const p = clamp01(closure)
  const reserveModifier = 0.55 + 0.45 * clamp01(reserve)
  if (domain === 'neural') return clamp01(((1 - 0.72 * p) ** 2) * reserveModifier)
  const radius = normalizedGeometry(domain, p)
  return clamp01((radius ** 4) * reserveModifier)
}

export function deriveBiologicalWorld(
  domain: CausalDomain,
  input: BiologicalUniverseInput,
  id: BiologicalWorld['id'] = 'primary',
): BiologicalWorld {
  const closure = clamp01(input.closure)
  const reserve = clamp01(input.reserve)
  const demand = clamp01(input.demand)
  const time = clamp01(input.time / 100)
  const propagation = smoothstep(time)
  const geometry = normalizedGeometry(domain, closure)
  const resistance = domain === 'neural' ? 1 / Math.max(geometry ** 2, 0.04) : 1 / Math.max(geometry ** 4, 0.02)
  const target = targetTransport(domain, closure, reserve)
  const transport = clamp01(mix(1, target, propagation))
  const stressTarget = clamp01((demand / Math.max(target + 0.22, 0.22)) * 0.58)
  const stress = clamp01(mix(0.08 + demand * 0.08, stressTarget, propagation))
  const stages = DOMAIN_STAGES[domain].map((label, index) => {
    const stageStart = index * 0.18
    const stageActivation = smoothstep((time - stageStart) / 0.22) * closure
    return { id: `${domain}-${index}`, label, activation: clamp01(stageActivation) }
  })

  const labels: Record<BiologicalWorld['id'], string> = {
    baseline: 'Baseline authored world',
    primary: 'Manipulated world',
    alternate: 'Alternate authored world',
  }

  return {
    id,
    label: labels[id],
    closure,
    geometry,
    resistance,
    transport,
    stress,
    propagation,
    stages,
  }
}

export function deriveBiologicalUniverseTrio(domain: CausalDomain, input: BiologicalUniverseInput): BiologicalUniverseTrio {
  return {
    baseline: deriveBiologicalWorld(domain, { ...input, closure: 0 }, 'baseline'),
    primary: deriveBiologicalWorld(domain, input, 'primary'),
    alternate: deriveBiologicalWorld(domain, { ...input, closure: clamp01(input.closure * 0.35) }, 'alternate'),
  }
}

export function biologicalScaleConcept(domain: CausalDomain, scale: CausalScale) {
  return SCALE_CONCEPTS[domain][scale]
}

export function biologicalDomainLabel(domain: CausalDomain) {
  if (domain === 'coronary') return 'Coronary transport world'
  if (domain === 'airway') return 'Airway transport world'
  return 'Neural conduction world'
}
