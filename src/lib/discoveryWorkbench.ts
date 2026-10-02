export type DiscoveryMode = 'discovery' | 'innovation' | 'invention'
export type EvidenceState = 'established' | 'preclinical' | 'experimental' | 'hypothesis' | 'speculative' | 'unsolved'

export interface DiscoveryHypothesis {
  id: string
  label: string
  state: EvidenceState
  claim: string
  mechanism: string[]
  assumptions: string[]
  falsificationCriteria: string[]
  requiredEvidence: string[]
}

export interface CausalNode {
  id: string
  label: string
  scale: 'molecular' | 'cellular' | 'circuit' | 'organ' | 'behavior' | 'clinical'
  x: number
  y: number
}

export interface CausalEdge {
  from: string
  to: string
  relation: 'candidate-cause' | 'modifier' | 'feedback' | 'measurement'
  certainty: 'known-link' | 'candidate-link' | 'unknown-direction'
}

export interface DiscoveryChallenge {
  id: string
  label: string
  question: string
  boundary: string
  hypotheses: DiscoveryHypothesis[]
  causalNodes: CausalNode[]
  causalEdges: CausalEdge[]
  innovationCandidates: string[]
  inventionCandidates: string[]
}

export interface EvidenceGateInput {
  provenanceCompleteness: number
  identifiability: number
  transportability: number
  confoundingRisk: number
  independentSources: number
}

export interface EvidenceGateResult {
  score: number | null
  state: 'insufficient-evidence' | 'research-ready'
  formula: 'R = P × I × T × (1 − C)'
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

/**
 * Research triage gate only. This is NOT an effect size, probability of truth,
 * clinical confidence or treatment recommendation.
 */
export function evidenceReadiness(input: EvidenceGateInput): EvidenceGateResult {
  if (input.independentSources < 2) {
    return { score: null, state: 'insufficient-evidence', formula: 'R = P × I × T × (1 − C)' }
  }
  const p = clamp01(input.provenanceCompleteness)
  const i = clamp01(input.identifiability)
  const t = clamp01(input.transportability)
  const c = clamp01(input.confoundingRisk)
  return {
    score: Number((p * i * t * (1 - c)).toFixed(3)),
    state: 'research-ready',
    formula: 'R = P × I × T × (1 − C)',
  }
}

export const DISCOVERY_CHALLENGES: DiscoveryChallenge[] = [
  {
    id: 'cross-scale-neurodegeneration',
    label: 'Cross-scale neurodegeneration',
    question: 'Which multiscale mechanisms are necessary, insufficient or compensable before distributed neural function fails?',
    boundary: 'This challenge is a hypothesis workspace, not a disease model validated for a person. No single protein, transmitter, cell type or region is treated as the cause of Alzheimer disease, Parkinson disease, cognition, mood or identity.',
    hypotheses: [
      {
        id: 'synaptic-homeostasis',
        label: 'Synaptic homeostasis failure',
        state: 'hypothesis',
        claim: 'Loss of synaptic homeostatic capacity may be an early bottleneck that interacts with upstream molecular and cellular stress before network-level failure becomes visible.',
        mechanism: ['protein-homeostasis stress', 'vesicle/receptor turnover', 'plasticity reserve', 'network compensation'],
        assumptions: ['temporal ordering is measurable', 'markers are not merely downstream correlates', 'cross-scale states can be aligned without inventing patient-specific parameters'],
        falsificationCriteria: ['prospective evidence shows preserved synaptic homeostasis despite later network failure', 'interventions restoring the proposed bottleneck repeatedly fail to alter downstream signatures in appropriate models'],
        requiredEvidence: ['longitudinal multiscale measurements', 'independent perturbation studies', 'replication across model systems', 'human transportability evidence'],
      },
      {
        id: 'glial-immune-amplification',
        label: 'Glial / immune amplification',
        state: 'hypothesis',
        claim: 'Glial and immune-state changes may amplify or buffer neural injury depending on time, location and disease context rather than acting as a single directional driver.',
        mechanism: ['microglial state', 'astrocytic homeostasis', 'cytokine signaling', 'clearance / repair'],
        assumptions: ['cell-state labels are comparable across datasets', 'sampling captures relevant time windows', 'protective and harmful states are not collapsed into one axis'],
        falsificationCriteria: ['state-resolved perturbations show no reproducible effect on downstream neural injury', 'apparent associations disappear after temporal and disease-stage adjustment'],
        requiredEvidence: ['state-resolved spatial data', 'time-series perturbation evidence', 'cross-cohort replication', 'negative-control analyses'],
      },
      {
        id: 'vascular-metabolic-resilience',
        label: 'Vascular / metabolic resilience',
        state: 'hypothesis',
        claim: 'Vascular, mitochondrial and metabolic reserve may modify how molecular injury propagates into circuit dysfunction without being reducible to one biomarker.',
        mechanism: ['perfusion reserve', 'mitochondrial stress', 'energy demand', 'BBB / neurovascular coupling'],
        assumptions: ['reserve can be measured independently from disease severity', 'confounding by age and comorbidity is controlled', 'organ-level measures can be aligned with circuit outcomes'],
        falsificationCriteria: ['well-controlled longitudinal data show no association with transition timing', 'perturbation models fail to modify network resilience despite changing reserve markers'],
        requiredEvidence: ['longitudinal perfusion/metabolic data', 'causal or quasi-causal perturbation', 'confounder-sensitive analysis', 'cross-population transportability'],
      },
    ],
    causalNodes: [
      { id: 'molecular-stress', label: 'Molecular stress', scale: 'molecular', x: 70, y: 78 },
      { id: 'glia', label: 'Glia / immune state', scale: 'cellular', x: 210, y: 44 },
      { id: 'synapse', label: 'Synaptic reserve', scale: 'cellular', x: 210, y: 126 },
      { id: 'vascular', label: 'Vascular / metabolic reserve', scale: 'organ', x: 360, y: 44 },
      { id: 'network', label: 'Circuit compensation', scale: 'circuit', x: 360, y: 126 },
      { id: 'function', label: 'Cognition / behavior', scale: 'behavior', x: 520, y: 86 },
    ],
    causalEdges: [
      { from: 'molecular-stress', to: 'glia', relation: 'candidate-cause', certainty: 'candidate-link' },
      { from: 'molecular-stress', to: 'synapse', relation: 'candidate-cause', certainty: 'candidate-link' },
      { from: 'glia', to: 'synapse', relation: 'modifier', certainty: 'unknown-direction' },
      { from: 'vascular', to: 'synapse', relation: 'modifier', certainty: 'candidate-link' },
      { from: 'synapse', to: 'network', relation: 'candidate-cause', certainty: 'candidate-link' },
      { from: 'network', to: 'function', relation: 'measurement', certainty: 'candidate-link' },
      { from: 'network', to: 'synapse', relation: 'feedback', certainty: 'unknown-direction' },
    ],
    innovationCandidates: ['multiscale longitudinal phenotype panel', 'compensation-aware digital-twin research model', 'counterexample-first biomarker evaluation'],
    inventionCandidates: ['provenance-aware causal graph engine', 'uncertainty-field 3D neural atlas bridge', 'falsification queue for autonomous research agents'],
  },
  {
    id: 'human-failure-boundary',
    label: 'Human failure boundary',
    question: 'Can transitions from compensated physiology to decompensation be represented without turning population models into patient-specific predictions?',
    boundary: 'The phase-transition language is a research abstraction. It must not be used to predict an individual deterioration event without validated disease-specific models and appropriately governed patient data.',
    hypotheses: [
      {
        id: 'compensation-budget',
        label: 'Compensation budget',
        state: 'unsolved',
        claim: 'Organ systems may expose measurable reserve dimensions whose joint loss precedes decompensation, but the relevant state variables and thresholds are not assumed known.',
        mechanism: ['reserve', 'feedback control', 'cross-organ coupling', 'stress load'],
        assumptions: ['reserve dimensions can be operationalized', 'measurement error is explicit', 'thresholds are not universal constants'],
        falsificationCriteria: ['candidate reserve variables fail prospective discrimination across cohorts', 'apparent transitions are explained by measurement artifacts or treatment changes'],
        requiredEvidence: ['prospective cohorts', 'external validation', 'measurement-error model', 'intervention-aware analysis'],
      },
    ],
    causalNodes: [
      { id: 'stress', label: 'Stress load', scale: 'clinical', x: 70, y: 86 },
      { id: 'reserve', label: 'System reserve', scale: 'organ', x: 230, y: 86 },
      { id: 'feedback', label: 'Compensation feedback', scale: 'organ', x: 390, y: 50 },
      { id: 'state', label: 'Observed state transition', scale: 'clinical', x: 540, y: 86 },
    ],
    causalEdges: [
      { from: 'stress', to: 'reserve', relation: 'modifier', certainty: 'candidate-link' },
      { from: 'reserve', to: 'feedback', relation: 'candidate-cause', certainty: 'candidate-link' },
      { from: 'feedback', to: 'reserve', relation: 'feedback', certainty: 'unknown-direction' },
      { from: 'reserve', to: 'state', relation: 'measurement', certainty: 'candidate-link' },
    ],
    innovationCandidates: ['reserve-aware monitoring research protocol', 'disease-specific transition challenge sets'],
    inventionCandidates: ['state-space simulator with uncertainty envelopes', 'cross-organ compensation graph compiler'],
  },
]

export function challengeById(id: string): DiscoveryChallenge {
  return DISCOVERY_CHALLENGES.find((challenge) => challenge.id === id) ?? DISCOVERY_CHALLENGES[0]
}
