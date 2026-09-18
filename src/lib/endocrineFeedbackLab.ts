export interface EndocrineFeedbackInputs {
  hypothalamicDrive: number
  pituitaryGain: number
  glandCapacity: number
  receptorSensitivity: number
  hormoneClearance: number
  feedbackGain: number
}

export interface EndocrineFeedbackOutputs {
  pituitarySignal: number
  hormoneSignal: number
  receptorEffectSignal: number
  feedbackSuppressionSignal: number
  controllerResidualSignal: number
  clearancePressureSignal: number
  axisReserveSignal: number
  dominantConstraint: 'controller' | 'pituitary' | 'gland-output' | 'receptor-response' | 'clearance' | 'feedback' | 'balanced'
}

export interface EndocrineTeachingEquation { expression: string; label: string; note: string }
export interface EndocrineEvidenceRef { pmid: string; title: string; year: number; url: string; role: string }

export const ENDOCRINE_FEEDBACK_DEFAULTS: EndocrineFeedbackInputs = { hypothalamicDrive: 0.56, pituitaryGain: 0.66, glandCapacity: 0.72, receptorSensitivity: 0.70, hormoneClearance: 0.52, feedbackGain: 0.62 }

export const ENDOCRINE_FEEDBACK_BOUNDARY = 'Normalized endocrine-systems teaching only. All controls and outputs are synthetic dimensionless signals; this lab does not calculate serum hormone concentrations, stimulation/suppression-test results, circadian reference ranges, receptor occupancy in a person, endocrine diagnosis, hormone deficiency/excess, fertility, stress response, medication dose, replacement need, or patient-specific treatment.'

export const ENDOCRINE_TEACHING_EQUATIONS: readonly EndocrineTeachingEquation[] = [
  { expression: 'axis output = controller drive × downstream gain', label: 'Hierarchical endocrine control', note: 'Conceptual systems relationship only; real axes contain pulsatility, delays, multiple feedback loops and non-linear receptor signaling.' },
  { expression: 'dH/dt = secretion − clearance', label: 'Hormone mass-balance concept', note: 'Teaching balance only. H is not assigned a physical concentration and no patient pharmacokinetic or endocrine value is calculated.' },
  { expression: 'θ = C / (C + Kd)', label: 'Simple receptor-occupancy relationship', note: 'Idealized equilibrium occupancy concept; receptor abundance, cooperativity, signaling bias and downstream amplification are not captured.' },
  { expression: 'negative feedback: target signal ↑ → upstream drive ↓', label: 'Feedback direction', note: 'Directional endocrine-control rule only. Feedback strength and timing vary substantially by axis and physiologic state.' },
  { expression: 'target effect ∝ receptor engagement × response sensitivity', label: 'Signal-to-effect concept', note: 'Qualitative relationship only; it is not a dose-response or clinical-effect model.' },
] as const

export const ENDOCRINE_EVIDENCE: readonly EndocrineEvidenceRef[] = [
  { pmid: '29764284', title: 'Role of glucocorticoid negative feedback in the regulation of HPA axis pulsatility.', year: 2018, url: 'https://pubmed.ncbi.nlm.nih.gov/29764284/', role: 'Review anchor for neuroendocrine negative feedback, glucocorticoid receptor signaling and the importance of pulsatile/circadian HPA-axis dynamics.' },
  { pmid: '8701079', title: 'IGF-I receptor signalling: lessons from the somatotroph.', year: 1996, url: 'https://pubmed.ncbi.nlm.nih.gov/8701079/', role: 'Mechanistic anchor for receptor-mediated signaling and IGF-I negative feedback across hypothalamic and pituitary control of the growth-hormone axis.' },
  { pmid: '16595713', title: 'Regulation of the neuroendocrine reproductive axis by kisspeptin-GPR54 signaling.', year: 2006, url: 'https://pubmed.ncbi.nlm.nih.gov/16595713/', role: 'Review anchor demonstrating receptor signaling and sex-steroid feedback within the hypothalamic-pituitary-gonadal neuroendocrine axis.' },
] as const

function clamp01(value: number): number { if (!Number.isFinite(value)) return 0; return Math.min(1, Math.max(0, value)) }

export function normalizeEndocrineFeedbackInputs(inputs: Partial<EndocrineFeedbackInputs> = {}): EndocrineFeedbackInputs {
  return {
    hypothalamicDrive: clamp01(inputs.hypothalamicDrive ?? ENDOCRINE_FEEDBACK_DEFAULTS.hypothalamicDrive),
    pituitaryGain: clamp01(inputs.pituitaryGain ?? ENDOCRINE_FEEDBACK_DEFAULTS.pituitaryGain),
    glandCapacity: clamp01(inputs.glandCapacity ?? ENDOCRINE_FEEDBACK_DEFAULTS.glandCapacity),
    receptorSensitivity: clamp01(inputs.receptorSensitivity ?? ENDOCRINE_FEEDBACK_DEFAULTS.receptorSensitivity),
    hormoneClearance: clamp01(inputs.hormoneClearance ?? ENDOCRINE_FEEDBACK_DEFAULTS.hormoneClearance),
    feedbackGain: clamp01(inputs.feedbackGain ?? ENDOCRINE_FEEDBACK_DEFAULTS.feedbackGain),
  }
}

function classifyConstraint(inputs: EndocrineFeedbackInputs, pituitarySignal: number, hormoneSignal: number, receptorEffect: number): EndocrineFeedbackOutputs['dominantConstraint'] {
  const constraints = [['controller', 1 - inputs.hypothalamicDrive], ['pituitary', 1 - inputs.pituitaryGain], ['gland-output', 1 - inputs.glandCapacity], ['receptor-response', 1 - inputs.receptorSensitivity], ['clearance', Math.max(0, inputs.hormoneClearance - hormoneSignal)], ['feedback', Math.abs(inputs.feedbackGain - 0.58) * 1.15]] as const
  const [name, severity] = constraints.reduce((highest, current) => current[1] > highest[1] ? current : highest)
  if (severity < 0.34 && pituitarySignal > 0.35 && hormoneSignal > 0.35 && receptorEffect > 0.35) return 'balanced'
  return name
}

export function deriveEndocrineFeedback(inputsLike: Partial<EndocrineFeedbackInputs> = {}): EndocrineFeedbackOutputs {
  const inputs = normalizeEndocrineFeedbackInputs(inputsLike)
  const preliminaryPituitary = clamp01(0.08 + inputs.hypothalamicDrive * (0.32 + 0.60 * inputs.pituitaryGain))
  const preliminaryHormone = clamp01(preliminaryPituitary * (0.30 + 0.70 * inputs.glandCapacity) * (1.08 - 0.46 * inputs.hormoneClearance))
  const receptorEffectSignal = clamp01(preliminaryHormone * (0.30 + 0.70 * inputs.receptorSensitivity))
  const feedbackSuppressionSignal = clamp01(receptorEffectSignal * inputs.feedbackGain)
  const controllerResidualSignal = clamp01(inputs.hypothalamicDrive * (1 - 0.55 * feedbackSuppressionSignal))
  const pituitarySignal = clamp01(0.08 + controllerResidualSignal * (0.32 + 0.60 * inputs.pituitaryGain))
  const hormoneSignal = clamp01(pituitarySignal * (0.30 + 0.70 * inputs.glandCapacity) * (1.08 - 0.46 * inputs.hormoneClearance))
  const clearancePressureSignal = clamp01(hormoneSignal * inputs.hormoneClearance)
  const axisReserveSignal = clamp01(pituitarySignal * 0.22 + hormoneSignal * 0.26 + receptorEffectSignal * 0.24 + (1 - Math.abs(feedbackSuppressionSignal - 0.38)) * 0.18 + (1 - Math.abs(inputs.hormoneClearance - 0.52)) * 0.10)
  return { pituitarySignal, hormoneSignal, receptorEffectSignal, feedbackSuppressionSignal, controllerResidualSignal, clearancePressureSignal, axisReserveSignal, dominantConstraint: classifyConstraint(inputs, pituitarySignal, hormoneSignal, receptorEffectSignal) }
}

export function endocrinePercent(value: number): number { return Math.round(clamp01(value) * 100) }
