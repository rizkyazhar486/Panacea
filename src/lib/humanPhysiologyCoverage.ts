import { PHYSIOLOGY_DEEP_DIVES } from './physiologyDeepDives'
import { WHOLE_BODY_PHYSIOLOGY_SYSTEMS } from './wholeBodyPhysiologyOS'

export type HumanPhysiologyCoverageKind = 'system-network' | 'mechanism-deep-dive'

export interface HumanPhysiologyCoverageRequirement {
  id: string
  label: string
  kind: HumanPhysiologyCoverageKind
  implementationId: string
  rationale: string
}

/**
 * Canonical minimum coverage contract for the primary Body Exposure physiology surface.
 *
 * This is intentionally broader than organ-system taxonomy: balance, proprioception,
 * thermoregulation, allergy and autonomic control are integrative functions and must
 * remain first-class even though they are not separate organs.
 */
export const HUMAN_PHYSIOLOGY_CORE_REQUIREMENTS: readonly HumanPhysiologyCoverageRequirement[] = [
  { id: 'circulation', label: 'Cardiovascular circulation', kind: 'system-network', implementationId: 'cardiovascular', rationale: 'Heart, vascular resistance, venous return and tissue perfusion.' },
  { id: 'respiration', label: 'Respiration & gas exchange', kind: 'system-network', implementationId: 'respiratory', rationale: 'Ventilation, diffusion and V/Q coupling.' },
  { id: 'neural', label: 'Central/peripheral neural control', kind: 'system-network', implementationId: 'nervous', rationale: 'Central, peripheral and rapid integrative control.' },
  { id: 'renal', label: 'Renal physiology', kind: 'system-network', implementationId: 'renal', rationale: 'Filtration, transport, water/electrolyte and acid-base regulation.' },
  { id: 'endocrine', label: 'Endocrine feedback', kind: 'system-network', implementationId: 'endocrine', rationale: 'Hormonal feedback across metabolism, stress, volume and reproduction.' },
  { id: 'digestive', label: 'Digestive physiology', kind: 'system-network', implementationId: 'digestive', rationale: 'Motility, secretion, digestion and absorption.' },
  { id: 'hepatic-metabolic', label: 'Hepatic & metabolic physiology', kind: 'system-network', implementationId: 'hepatic-metabolic', rationale: 'Fuel buffering, substrate transformation and whole-body energy handling.' },
  { id: 'immune-lymphatic', label: 'Immune & lymphatic physiology', kind: 'system-network', implementationId: 'immune-lymphatic', rationale: 'Barrier defense, immune surveillance, trafficking and lymphatic return.' },
  { id: 'musculoskeletal', label: 'Musculoskeletal force & movement', kind: 'system-network', implementationId: 'musculoskeletal', rationale: 'Force, posture, movement and mechanical work.' },
  { id: 'integumentary', label: 'Skin barrier & heat exchange', kind: 'system-network', implementationId: 'integumentary', rationale: 'Barrier, cutaneous circulation, sweating and surface heat exchange.' },
  { id: 'reproductive', label: 'Reproductive physiology', kind: 'system-network', implementationId: 'reproductive', rationale: 'HPG-linked reproductive and developmental physiology.' },

  { id: 'vision', label: 'Vision', kind: 'mechanism-deep-dive', implementationId: 'vision', rationale: 'Optics, retinal transduction and central visual pathway.' },
  { id: 'hearing', label: 'Hearing', kind: 'mechanism-deep-dive', implementationId: 'hearing', rationale: 'Sound mechanics, cochlear transduction and auditory pathway.' },
  { id: 'vestibular', label: 'Vestibular balance', kind: 'mechanism-deep-dive', implementationId: 'vestibular-balance', rationale: 'Canals, otoliths, VOR and postural integration.' },
  { id: 'proprioception', label: 'Proprioception', kind: 'mechanism-deep-dive', implementationId: 'proprioception', rationale: 'Muscle spindle, tendon organ and body-position feedback.' },
  { id: 'autonomic', label: 'Autonomic control', kind: 'mechanism-deep-dive', implementationId: 'autonomic-control', rationale: 'Sympathetic, parasympathetic and enteric integration.' },
  { id: 'nociception', label: 'Nociception & pain', kind: 'mechanism-deep-dive', implementationId: 'nociception-pain', rationale: 'Peripheral nociception, spinal transmission and central modulation.' },
  { id: 'olfaction', label: 'Olfaction', kind: 'mechanism-deep-dive', implementationId: 'olfaction', rationale: 'Nasal sampling, receptor transduction and olfactory processing.' },
  { id: 'gustation', label: 'Gustation', kind: 'mechanism-deep-dive', implementationId: 'gustation', rationale: 'Taste receptors and VII/IX/X gustatory pathway.' },
  { id: 'thermoregulation', label: 'Thermoregulation & fever', kind: 'mechanism-deep-dive', implementationId: 'temperature-fever', rationale: 'Heat balance, hypothalamic control, sweating, vasomotor response and fever.' },
  { id: 'allergy', label: 'Allergy / immediate hypersensitivity', kind: 'mechanism-deep-dive', implementationId: 'allergy', rationale: 'Sensitization, IgE/FcεRI mast-cell activation and mediator effects.' },
  { id: 'immune-response', label: 'Innate → adaptive immunity', kind: 'mechanism-deep-dive', implementationId: 'immune-response', rationale: 'Barrier/innate sensing, antigen presentation, clonal response and memory.' },
  { id: 'hemostasis', label: 'Hemostasis', kind: 'mechanism-deep-dive', implementationId: 'hemostasis', rationale: 'Vessel response, platelet plug, fibrin formation and fibrinolysis.' },
  { id: 'osmoregulation', label: 'Osmoregulation', kind: 'mechanism-deep-dive', implementationId: 'adh-osmoregulation', rationale: 'ADH, thirst and water-balance control.' },
  { id: 'acid-base', label: 'Electrolyte & acid-base physiology', kind: 'mechanism-deep-dive', implementationId: 'electrolytes-acid-base', rationale: 'Renal, respiratory and extracellular chemistry coupling.' },
  { id: 'glucose', label: 'Insulin & glucose physiology', kind: 'mechanism-deep-dive', implementationId: 'insulin', rationale: 'Insulin-linked glucose uptake, storage and production balance.' },
] as const

export interface HumanPhysiologyCoverageSnapshot {
  represented: number
  total: number
  missing: readonly HumanPhysiologyCoverageRequirement[]
}

export function humanPhysiologyCoverageSnapshot(): HumanPhysiologyCoverageSnapshot {
  const systems = new Set<string>(WHOLE_BODY_PHYSIOLOGY_SYSTEMS.map((item) => item.id))
  const deepDives = new Set<string>(PHYSIOLOGY_DEEP_DIVES.map((item) => item.id))
  const missing = HUMAN_PHYSIOLOGY_CORE_REQUIREMENTS.filter((item) =>
    item.kind === 'system-network'
      ? !systems.has(item.implementationId)
      : !deepDives.has(item.implementationId),
  )
  return {
    represented: HUMAN_PHYSIOLOGY_CORE_REQUIREMENTS.length - missing.length,
    total: HUMAN_PHYSIOLOGY_CORE_REQUIREMENTS.length,
    missing,
  }
}

export const HUMAN_PHYSIOLOGY_COVERAGE_BOUNDARY =
  'Coverage means that an educational system network or mechanism pathway is represented in the product. It does not mean every subcellular mechanism, disease state, patient phenotype, measurement method or clinical decision has been validated or implemented.'
