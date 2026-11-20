// Which of the stage's simulation decks shows part of a body system's physiology. Pure data and one lookup.
//
// Every one of the 11 canonical atlas body systems maps to its dedicated interactive mechanistic model inside
// the Whole-Body 11-System Lab ('whole_body'), alongside specialized organ decks where present (heart-lung PV,
// diaphragm excursion, peristalsis, brainstem reflex loops). Unknown ids return [].

import type { BodySystemId } from '../../data/bodySystems.ts'
import type { PhysiologySystem, StructureCouplingContext } from '../atlasStageDecks.ts'

export type SoftTissueTab = NonNullable<StructureCouplingContext['softTissueTab']>

export interface StageSimulation {
  id: string
  /** Short English label for the button that opens the deck. */
  label: string
  deck: PhysiologySystem
  softTissueTab?: SoftTissueTab
  wholeBodySystem?: BodySystemId
}

const HEART_LUNG: StageSimulation = { id: 'heart-lung', label: 'Heart–lung pressure–volume', deck: 'cardiopulmonary' }
const DIAPHRAGM: StageSimulation = { id: 'diaphragm', label: 'Diaphragm excursion', deck: 'soft_tissue', softTissueTab: 'diaphragm_excursion' }
const PERISTALSIS: StageSimulation = { id: 'peristalsis', label: 'Peristalsis', deck: 'soft_tissue', softTissueTab: 'peristalsis' }
const REFLEX_LOOPS: StageSimulation = { id: 'reflex-loops', label: 'Brainstem reflex loops', deck: 'neuro' }
const wholeBody = (id: BodySystemId, label: string): StageSimulation => ({
  id: `wb-${id}`,
  label,
  deck: 'whole_body',
  wholeBodySystem: id,
})

export const SYSTEM_SIMULATIONS: Readonly<Record<BodySystemId, readonly StageSimulation[]>> = {
  cardiovascular: [HEART_LUNG, wholeBody('cardiovascular', 'Systemic PV loop and baroreflex')],
  nervous: [REFLEX_LOOPS, wholeBody('nervous', 'Action potential and cerebral perfusion')],
  respiratory: [HEART_LUNG, DIAPHRAGM, wholeBody('respiratory', 'Alveolar gas and V/Q shunt lab')],
  digestive: [PERISTALSIS, wholeBody('digestive', 'Gastric acid and portal flux lab')],
  urinary: [wholeBody('urinary', 'Glomerular Starling and TGF autoregulation')],
  endocrine: [wholeBody('endocrine', 'HPT and HPA negative-feedback axis')],
  reproductive: [wholeBody('reproductive', 'HPG axis and 28-day cycle dynamics')],
  'lymphatic-immune': [wholeBody('lymphatic-immune', 'Starling filtration and lymphatic clearance')],
  musculoskeletal: [wholeBody('musculoskeletal', 'Sarcomere length–tension and Hill curve')],
  'sensory-ent': [REFLEX_LOOPS, wholeBody('sensory-ent', 'Cochlear tonotopy and retinal adaptation')],
  'integumentary-surface': [wholeBody('integumentary-surface', 'Stratum corneum TEWL and thermoregulation')],
}

/** The decks for a system; an unknown id gets none rather than a guess. */
export function simulationsFor(id: unknown): readonly StageSimulation[] {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SYSTEM_SIMULATIONS, id) ? SYSTEM_SIMULATIONS[id as BodySystemId] : []
}
