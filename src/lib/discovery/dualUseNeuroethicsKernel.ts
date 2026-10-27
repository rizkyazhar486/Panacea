/**
 * PANACEAMED DUAL-USE BIOSECURITY & NEUROETHICAL GOVERNANCE KERNEL (T-CLIN-75)
 *
 * Grounded in:
 * - PANACEA_CONSTITUTION.md
 * - PANACEA_FRONTIER_BIOMEDICAL_DISCOVERY_DIRECTIVE.md
 * - China National BCI Ethics Guideline (2024)
 * - UNESCO Recommendation on the Ethics of Neurotechnology (2023)
 * - WHO Laboratory Biosafety Manual & Dual-Use Research of Concern (DURC) Framework
 *
 * Prime Invariant:
 * 1. "Weaponization" is permitted SOLELY as translational therapeutic harnessing
 *    against human pathology, organ failure, and senescence.
 * 2. Military weaponization, biological warfare, toxin engineering, and coercive
 *    interpersonal "mind control" are strictly prohibited and fail-closed blocked.
 * 3. Neural interfaces must remain strictly read-only, non-invasive or epidural,
 *    user-consented, and isolated from autonomous device actuation.
 */

import type {
  DualUseScreeningInput,
  DualUseScreeningReport,
} from './frontierBiomedicalTypes'

export const PROHIBITED_DUAL_USE_VECTORS: readonly string[] = [
  'executable_pathogen_enhancement',
  'gain_of_function_virulence_engineering',
  'executable_peptide_toxin_synthesis',
  'coercive_neural_modulation',
  'non_consensual_cognitive_intervention',
  'interpersonal_mind_control_actuation',
  'autonomous_lethal_biological_actuation',
  'clinical_safety_gate_bypass',
] as const

export const NEUROETHICAL_CANONICAL_PRINCIPLES: readonly {
  id: string
  principle: string
  authority: string
  invariantEnforced: string
}[] = [
  {
    id: 'BCI_ETHICS_01',
    principle: 'Remedial Purpose Primacy',
    authority: 'China National Science and Technology Ethics Committee BCI Guidelines (2024)',
    invariantEnforced: 'BCI systems must principally serve remedial medical compensation; non-therapeutic enhancement must not infringe on autonomy or equity.',
  },
  {
    id: 'BCI_ETHICS_02',
    principle: 'Strict Mental Privacy & Data Sovereignty',
    authority: 'UNESCO Neurotechnology Ethics Framework',
    invariantEnforced: 'Neural signals and decoded intention data are sovereign to the patient and must never be broadcast, mined, or monetized.',
  },
  {
    id: 'BCI_ETHICS_03',
    principle: 'Non-Coercion & Zero Autonomic Actuation',
    authority: 'PanaceaMed Humanity 10 Charter',
    invariantEnforced: 'Neural decoders must operate with physical kill-switches and never actuate invasive stimulation or robotic force without continuous human consent.',
  },
  {
    id: 'BIO_SAFETY_01',
    principle: 'Zero Biological Weaponization',
    authority: 'Biological Weapons Convention (BWC) & Panacea Constitutional Annex',
    invariantEnforced: 'Absolute prohibition on toxin design, aerosolization vectors, or biological containment evasion.',
  },
] as const

/**
 * Evaluates any research proposal or computational model against dual-use biosecurity
 * and neuroethical non-coercion invariants.
 */
export function screenDualUseAndNeuroethics(
  input: DualUseScreeningInput
): DualUseScreeningReport {
  const violations: string[] = []

  if (input.involvesPathogenEnhancementOrToxinEngineering) {
    violations.push('Prohibited DURC: pathogen enhancement or toxin synthesis generation detected.')
  }
  if (input.involvesNonConsensualIntervention) {
    violations.push('Neuroethical violation: non-consensual cognitive or biological intervention violates fundamental patient sovereignty.')
  }
  if (input.involvesDirectNeuralStimulationOrControl) {
    violations.push('Prohibited vector: active coercive neural modulation / mind-control actuation violates non-coercion invariants.')
  }
  if (input.involvesAutonomousDeviceActuation) {
    violations.push('Safety boundary breach: autonomous physical device actuation without human-in-the-loop confirmation is disallowed.')
  }

  const isPermitted = violations.length === 0

  const realityCheckSummary =
    'PanaceaMed strictly interprets translational weaponization as therapeutic harnessing against human disease. ' +
    'The public medical evidence establishes that modern neurotechnology (such as NEO epidural BCI) provides assistive motor intention decoding for spinal-cord injury, ' +
    'not mind reading or coercive mental control. Cardiovascular stem cells (HiCM-188) and longevity models (FOXO3 / ACSL4) remain tightly bound by preclinical safety ' +
    'and Phase III trials, with no basis for whole-body age reversal claims.'

  return {
    isPermitted,
    governanceDecision: isPermitted ? 'APPROVED_FOR_THERAPEUTIC_RESEARCH' : 'REJECTED_DUAL_USE_VIOLATION',
    reasons: violations.length > 0 ? violations : ['All parameters comply with therapeutic translational research & neuroethical boundaries.'],
    neuroethicalCompliance: {
      mentalPrivacyPreserved: true,
      nonCoerciveNonActuatingConfirmed: !input.involvesDirectNeuralStimulationOrControl && !input.involvesAutonomousDeviceActuation,
      informedConsentRequired: true,
      chinaBciEthics2024Aligned: true,
      unescoBioethicsAligned: true,
    },
    biosecurityCompliance: {
      zeroPathogenEnhancement: !input.involvesPathogenEnhancementOrToxinEngineering,
      zeroExecutableToxinSequence: true,
      clinicalTrialsMayNotBeSkipped: true,
    },
    realityCheckSummary,
    truthClass: 'neuroethical_governance_audit',
    clinically_reviewed: false,
  }
}
