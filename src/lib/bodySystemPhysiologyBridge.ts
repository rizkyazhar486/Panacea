import type { BodySystemId } from './bodySystemSourceWave'
import type { WholeBodySystemId } from './wholeBodyPhysiologyOS'

export type BodyPhysiologyBridgeFidelity = 'direct' | 'compound' | 'contextual'

export interface BodySystemPhysiologyBridge {
  atlasSystemId: BodySystemId
  physiologySystemIds: readonly WholeBodySystemId[]
  fidelity: BodyPhysiologyBridgeFidelity
  rationale: string
}

export const BODY_SYSTEM_PHYSIOLOGY_BRIDGE: readonly BodySystemPhysiologyBridge[] = [
  {
    atlasSystemId: 'cardiovascular',
    physiologySystemIds: ['cardiovascular'],
    fidelity: 'direct',
    rationale: 'The source-backed cardiovascular atlas maps directly to the circulation physiology domain.',
  },
  {
    atlasSystemId: 'nervous',
    physiologySystemIds: ['nervous'],
    fidelity: 'direct',
    rationale: 'Central, peripheral and autonomic anatomy maps directly to neural control physiology.',
  },
  {
    atlasSystemId: 'respiratory',
    physiologySystemIds: ['respiratory'],
    fidelity: 'direct',
    rationale: 'Airway, lung, diaphragm and pulmonary context map directly to respiratory gas-exchange physiology.',
  },
  {
    atlasSystemId: 'digestive',
    physiologySystemIds: ['digestive', 'hepatic-metabolic'],
    fidelity: 'compound',
    rationale: 'Digestive anatomy spans luminal absorption plus hepatobiliary and pancreatic metabolic handling, so the bridge keeps both physiology domains visible.',
  },
  {
    atlasSystemId: 'urinary',
    physiologySystemIds: ['renal'],
    fidelity: 'direct',
    rationale: 'Urinary source anatomy is linked to renal fluid, electrolyte and acid-base regulation without renaming the source atlas system.',
  },
  {
    atlasSystemId: 'endocrine',
    physiologySystemIds: ['endocrine'],
    fidelity: 'direct',
    rationale: 'Endocrine source structures link directly to feedback-network physiology.',
  },
  {
    atlasSystemId: 'reproductive',
    physiologySystemIds: ['reproductive', 'endocrine'],
    fidelity: 'compound',
    rationale: 'Reproductive organs are coupled to hypothalamic-pituitary-gonadal endocrine control, so both domains remain explicit.',
  },
  {
    atlasSystemId: 'lymphatic-immune',
    physiologySystemIds: ['immune-lymphatic'],
    fidelity: 'direct',
    rationale: 'Lymphoid anatomy maps directly to immune surveillance, trafficking and lymphatic-return physiology.',
  },
  {
    atlasSystemId: 'musculoskeletal',
    physiologySystemIds: ['musculoskeletal'],
    fidelity: 'direct',
    rationale: 'Bone, muscle and joint anatomy maps directly to force, movement and mechanical-work physiology.',
  },
  {
    atlasSystemId: 'sensory-ent',
    physiologySystemIds: ['nervous'],
    fidelity: 'contextual',
    rationale: 'Sensory and ENT structures do not have a one-to-one whole-body physiology domain; neural control is shown only as the closest systems-level context.',
  },
  {
    atlasSystemId: 'integumentary-surface',
    physiologySystemIds: ['integumentary'],
    fidelity: 'direct',
    rationale: 'Whole-body surface anatomy maps directly to barrier, sensory and heat-exchange physiology.',
  },
] as const

export const BODY_SYSTEM_PHYSIOLOGY_BRIDGE_BOUNDARY =
  'Atlas-to-physiology links are educational navigation relationships, not claims that an anatomical source bundle is physiologically complete or that a source structure maps one-to-one to a clinical function.'

export function getBodySystemPhysiologyBridge(atlasSystemId: BodySystemId): BodySystemPhysiologyBridge {
  const bridge = BODY_SYSTEM_PHYSIOLOGY_BRIDGE.find((item) => item.atlasSystemId === atlasSystemId)
  if (!bridge) throw new Error(`Missing atlas-to-physiology bridge for ${atlasSystemId}`)
  return bridge
}
