// Which of the stage's simulation decks shows part of a body system's physiology. Pure data and one lookup.
//
// A system appears here only when a deck actually models it: the heart–lung pressure–volume deck (circulation and
// its coupling with ventilation), the soft-tissue deck's diaphragm excursion and peristalsis tabs, and the neuro
// deck's brainstem reflex loops (pupillary light, corneal blink, gag, vestibulo-ocular: neural arcs whose receptors
// are the eye, cornea, pharynx and inner ear). A system with no deck gets an empty list — the card says so instead
// of pointing at an unrelated simulation. The deck ids are the routing ids of engine/atlasStageDecks.ts.

import type { BodySystemId } from '../../data/bodySystems.ts'
import type { PhysiologySystem, StructureCouplingContext } from '../atlasStageDecks.ts'

export type SoftTissueTab = NonNullable<StructureCouplingContext['softTissueTab']>

export interface StageSimulation {
  id: string
  /** Short English label for the button that opens the deck. */
  label: string
  deck: PhysiologySystem
  softTissueTab?: SoftTissueTab
}

const HEART_LUNG: StageSimulation = { id: 'heart-lung', label: 'Heart–lung pressure–volume', deck: 'cardiopulmonary' }
const DIAPHRAGM: StageSimulation = { id: 'diaphragm', label: 'Diaphragm excursion', deck: 'soft_tissue', softTissueTab: 'diaphragm_excursion' }
const PERISTALSIS: StageSimulation = { id: 'peristalsis', label: 'Peristalsis', deck: 'soft_tissue', softTissueTab: 'peristalsis' }
const REFLEX_LOOPS: StageSimulation = { id: 'reflex-loops', label: 'Brainstem reflex loops', deck: 'neuro' }

export const SYSTEM_SIMULATIONS: Readonly<Record<BodySystemId, readonly StageSimulation[]>> = {
  cardiovascular: [HEART_LUNG],
  nervous: [REFLEX_LOOPS],
  respiratory: [HEART_LUNG, DIAPHRAGM],
  digestive: [PERISTALSIS],
  urinary: [],
  endocrine: [],
  reproductive: [],
  'lymphatic-immune': [],
  musculoskeletal: [],
  'sensory-ent': [REFLEX_LOOPS],
  'integumentary-surface': [],
}

/** The decks for a system; an unknown id gets none rather than a guess. */
export function simulationsFor(id: unknown): readonly StageSimulation[] {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SYSTEM_SIMULATIONS, id) ? SYSTEM_SIMULATIONS[id as BodySystemId] : []
}
