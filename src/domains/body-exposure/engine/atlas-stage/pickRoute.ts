// Where a picked structure takes the Physiology and Clinical stages. Pure and deterministic.
//
// A structure opens the simulation deck and clinical tool that model it (decksFor). When none does, the stages
// do not borrow an unrelated organ: Physiology opens the structure's body-system card, and the clinical tools are
// left untargeted, so their own reference examples are never presented as being about the picked structure.

import { decksFor, type ClinicalTool, type PhysiologySystem, type StructureCouplingContext } from '../atlasStageDecks.ts'
import { systemsForStructure } from '../system-physiology/structureSystem.ts'
import type { BodySystemId } from '../../data/bodySystems.ts'
import type { SelectedStructureInfo } from './structureInfo.ts'

/** What a pick is coupled through: a deck that models it, only its body system, or nothing yet. */
export type PickBasis = 'deck' | 'system' | 'unmapped'

export interface PickRoute {
  basis: PickBasis
  /** Parameters for the decks; null when no deck models the structure. */
  couplingContext: StructureCouplingContext | null
  physiologyView: PhysiologySystem | 'systems'
  /** Every body system the structure belongs to (two for the pancreas, none when the atlas does not map it). */
  systems: readonly BodySystemId[]
  /** The system card to open: the first of `systems`. */
  systemFocus: BodySystemId | null
  /** The clinical tool to switch to; null keeps the current tool, with no target. */
  clinicalTool: ClinicalTool | null
}

export function routePick(info: SelectedStructureInfo): PickRoute {
  const mapped = systemsForStructure(info.cleanName, info.layerId)
  const systems = mapped.ok ? mapped.systems : []
  const systemFocus = systems[0] ?? null
  const context = decksFor(info)
  if (context) return { basis: 'deck', couplingContext: context, physiologyView: context.physiology, systems, systemFocus, clinicalTool: context.clinical }
  return { basis: systems.length > 0 ? 'system' : 'unmapped', couplingContext: null, physiologyView: 'systems', systems, systemFocus, clinicalTool: null }
}
