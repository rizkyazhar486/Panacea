export type CausalDomain = 'coronary' | 'airway' | 'neural'
export type CausalScale = 'person' | 'organ' | 'tissue' | 'cell' | 'molecule'

export interface CausalWorldInput {
  perturbation: number
  reserve: number
  demand: number
  time: number
}

export interface CausalWorldState {
  domain: CausalDomain
  effectivePerturbation: number
  transport: number
  resistance: number
  stress: number
  reserveSignal: number
}

export interface CounterfactualPair {
  primary: CausalWorldState
  relief: CausalWorldState
}

export const CAUSAL_DOMAINS: Array<{
  id: CausalDomain
  label: string
  subtitle: string
  transportLabel: string
  perturbationLabel: string
}> = [
  {
    id: 'coronary',
    label: 'Coronary worldline',
    subtitle: 'Radius → resistance → relative transport → demand mismatch',
    transportLabel: 'Relative coronary transport',
    perturbationLabel: 'Synthetic calibre loss',
  },
  {
    id: 'airway',
    label: 'Airway worldline',
    subtitle: 'Airway radius → resistance → relative ventilation transport → work signal',
    transportLabel: 'Relative airflow transport',
    perturbationLabel: 'Synthetic airway narrowing',
  },
  {
    id: 'neural',
    label: 'Neural worldline',
    subtitle: 'Compression → synthetic conduction reserve → demand mismatch',
    transportLabel: 'Synthetic conduction transport',
    perturbationLabel: 'Synthetic compression',
  },
]

export const SCALE_ORDER: CausalScale[] = ['person', 'organ', 'tissue', 'cell', 'molecule']

export const SCALE_LABELS: Record<CausalScale, string> = {
  person: 'Person',
  organ: 'Organ',
  tissue: 'Tissue',
  cell: 'Cell',
  molecule: 'Molecule',
}

export const CAUSAL_FORMULA_LEDGER = [
  {
    id: 'poiseuille-teaching',
    appliesTo: ['coronary', 'airway'] as CausalDomain[],
    formula: 'R ∝ 1 / r⁴; therefore relative transport ∝ r⁴ when other terms are held constant',
    boundary: 'Idealized laminar-tube teaching relationship only; real coronary and airway flow are not rigid-tube systems.',
  },
  {
    id: 'synthetic-neural-conduction',
    appliesTo: ['neural'] as CausalDomain[],
    formula: 'conduction_index = (1 − 0.72 × perturbation)² × reserve_modifier',
    boundary: 'Panacea-authored visualization heuristic, not a validated axonal conduction equation or electrophysiology model.',
  },
  {
    id: 'mismatch',
    appliesTo: ['coronary', 'airway', 'neural'] as CausalDomain[],
    formula: 'stress_index = clamp(demand / (transport + safety_offset), 0, 1)',
    boundary: 'Normalized interface signal only; not ischemia, respiratory failure, neurologic deficit, severity, risk, or prognosis.',
  },
]

const SCALE_CONCEPTS: Record<CausalDomain, Record<CausalScale, string>> = {
  coronary: {
    person: 'Whole-body demand and reserve context',
    organ: 'Heart and coronary circulation',
    tissue: 'Myocardial supply-demand territory',
    cell: 'Cardiomyocyte energetic context',
    molecule: 'Transport and metabolic signalling concepts',
  },
  airway: {
    person: 'Whole-body ventilatory demand context',
    organ: 'Lung and conducting airway tree',
    tissue: 'Airway wall and alveolar interface context',
    cell: 'Epithelial and smooth-muscle context',
    molecule: 'Transport, tone and inflammatory signalling concepts',
  },
  neural: {
    person: 'Motor-sensory task demand context',
    organ: 'Peripheral nerve / root pathway',
    tissue: 'Fascicle and myelin context',
    cell: 'Axon / Schwann-cell context',
    molecule: 'Membrane and ion-channel concepts',
  },
}

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function smoothstep(value: number) {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}

function domainState(domain: CausalDomain, input: CausalWorldInput): CausalWorldState {
  const perturbation = clamp01(input.perturbation)
  const reserve = clamp01(input.reserve)
  const demand = clamp01(input.demand)
  const time = clamp01(input.time / 100)
  const effectivePerturbation = perturbation * smoothstep(time)
  const reserveModifier = 0.52 + reserve * 0.48

  if (domain === 'neural') {
    const conduction = Math.pow(Math.max(0.18, 1 - 0.72 * effectivePerturbation), 2)
    const transport = clamp01(conduction * reserveModifier)
    const resistance = 1 / Math.max(0.08, conduction)
    const stress = clamp01((0.2 + demand * 0.95) / (transport + 0.22) - 0.32)
    const reserveSignal = clamp01(reserve * (1 - effectivePerturbation * 0.68))
    return { domain, effectivePerturbation, transport, resistance, stress, reserveSignal }
  }

  const radiusLoss = domain === 'coronary' ? 0.65 : 0.6
  const radiusRatio = Math.max(0.22, 1 - radiusLoss * effectivePerturbation)
  const fourthPower = Math.pow(radiusRatio, 4)
  const transport = clamp01(fourthPower * reserveModifier)
  const resistance = 1 / Math.max(0.02, fourthPower)
  const safetyOffset = domain === 'coronary' ? 0.16 : 0.14
  const stress = clamp01((0.18 + demand * 0.92) / (transport + safetyOffset) - 0.3)
  const reserveSignal = clamp01(reserve * (1 - effectivePerturbation * 0.62))
  return { domain, effectivePerturbation, transport, resistance, stress, reserveSignal }
}

export function deriveCausalWorld(domain: CausalDomain, input: CausalWorldInput): CausalWorldState {
  return domainState(domain, input)
}

export function deriveCounterfactualPair(domain: CausalDomain, input: CausalWorldInput): CounterfactualPair {
  const primary = domainState(domain, input)
  const relief = domainState(domain, {
    ...input,
    perturbation: clamp01(input.perturbation * 0.45),
    reserve: clamp01(input.reserve + 0.12),
  })
  return { primary, relief }
}

export function causalTimeline(domain: CausalDomain, input: Omit<CausalWorldInput, 'time'>) {
  return [0, 20, 40, 60, 80, 100].map((time) => ({
    time,
    ...deriveCounterfactualPair(domain, { ...input, time }),
  }))
}

export function scaleConcept(domain: CausalDomain, scale: CausalScale) {
  return SCALE_CONCEPTS[domain][scale]
}

export function domainLabel(domain: CausalDomain) {
  return CAUSAL_DOMAINS.find((item) => item.id === domain)?.label ?? domain
}
