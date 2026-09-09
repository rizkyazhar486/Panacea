import {
  resolveAllAnatomySourceNodes,
  type AnatomySourceNodeBundle,
  type AnatomySourceNodeMatch,
} from '../anatomySourceNodeRegistry'
import { RESPIRATORY_ATLAS_STRUCTURES } from './respiratoryAtlasContract'

export type RespiratorySourceCoverage = 'source-node-present' | 'source-node-missing' | 'reference-only'

interface RespiratoryLookupContract {
  structureId: string
  file: string
  hints: readonly string[]
}

/**
 * Reviewed lookup hints for gross respiratory structures in the shipped whole-body
 * source-node catalogue. These hints are only resolvers; they are never substitute
 * geometry and must not be displayed as if a missing source node existed.
 */
export const RESPIRATORY_SOURCE_LOOKUPS: readonly RespiratoryLookupContract[] = [
  { structureId: 'trachea', file: 'visceral.glb', hints: ['trachea'] },
  { structureId: 'right-main-bronchus', file: 'visceral.glb', hints: ['right main bronch', 'right bronchus', 'bronch'] },
  { structureId: 'left-main-bronchus', file: 'visceral.glb', hints: ['left main bronch', 'left bronchus', 'bronch'] },
  { structureId: 'right-upper-lobe', file: 'visceral.glb', hints: ['right upper lobe', 'upper lobe'] },
  { structureId: 'right-middle-lobe', file: 'visceral.glb', hints: ['right middle lobe', 'middle lobe'] },
  { structureId: 'right-lower-lobe', file: 'visceral.glb', hints: ['right lower lobe', 'lower lobe'] },
  { structureId: 'left-upper-lobe', file: 'visceral.glb', hints: ['left upper lobe', 'upper lobe'] },
  { structureId: 'left-lower-lobe', file: 'visceral.glb', hints: ['left lower lobe', 'lower lobe'] },
  { structureId: 'right-horizontal-fissure', file: 'visceral.glb', hints: ['right horizontal fissure', 'horizontal fissure'] },
  { structureId: 'right-oblique-fissure', file: 'visceral.glb', hints: ['right oblique fissure', 'oblique fissure'] },
  { structureId: 'left-oblique-fissure', file: 'visceral.glb', hints: ['left oblique fissure', 'oblique fissure'] },
  { structureId: 'visceral-pleura', file: 'visceral.glb', hints: ['visceral pleura', 'pleura'] },
  { structureId: 'parietal-pleura', file: 'visceral.glb', hints: ['parietal pleura', 'pleura'] },
  { structureId: 'diaphragm', file: 'muscular.glb', hints: ['diaphragm'] },
  { structureId: 'thoracic-wall', file: 'skeletal.glb', hints: ['rib', 'sternum', 'thoracic vertebra'] },
] as const

export interface RespiratorySourceGapEntry {
  structureId: string
  label: string
  coverage: RespiratorySourceCoverage
  expectedFile: string | null
  hints: readonly string[]
  matches: AnatomySourceNodeMatch[]
  exactSourceNames: string[]
  reason: string
}

export interface RespiratorySourceGapReport {
  entries: RespiratorySourceGapEntry[]
  present: number
  missing: number
  referenceOnly: number
  total: number
}

function uniqueSourceNames(matches: readonly AnatomySourceNodeMatch[]) {
  return [...new Set(matches.flatMap((match) => match.names))].sort((a, b) => a.localeCompare(b))
}

/**
 * Compare the mandatory Breath Atlas contract against an actual source-node snapshot.
 * Missing anatomy stays explicitly missing; the report never turns a label/hint into
 * geometry. This is the gap list that acquisition/segmentation work should consume.
 */
export function assessRespiratorySourceCoverage(
  sourceBundles: readonly AnatomySourceNodeBundle[],
): RespiratorySourceGapReport {
  const lookupById = new Map(RESPIRATORY_SOURCE_LOOKUPS.map((lookup) => [lookup.structureId, lookup] as const))

  const entries = RESPIRATORY_ATLAS_STRUCTURES.map<RespiratorySourceGapEntry>((structure) => {
    if (structure.geometryStatus === 'reference-only') {
      return {
        structureId: structure.id,
        label: structure.label,
        coverage: 'reference-only',
        expectedFile: null,
        hints: [],
        matches: [],
        exactSourceNames: [],
        reason: structure.note ?? 'Structure is intentionally conceptual/reference-only at whole-body mesh scale.',
      }
    }

    const lookup = lookupById.get(structure.id)
    if (!lookup) {
      return {
        structureId: structure.id,
        label: structure.label,
        coverage: 'source-node-missing',
        expectedFile: null,
        hints: [],
        matches: [],
        exactSourceNames: [],
        reason: 'No reviewed source-node lookup contract exists yet.',
      }
    }

    const eligibleBundles = sourceBundles.filter((bundle) => bundle.file === lookup.file)
    const matches = resolveAllAnatomySourceNodes(lookup.hints, eligibleBundles, 12)
    const exactSourceNames = uniqueSourceNames(matches)
    const present = exactSourceNames.length > 0

    return {
      structureId: structure.id,
      label: structure.label,
      coverage: present ? 'source-node-present' : 'source-node-missing',
      expectedFile: lookup.file,
      hints: lookup.hints,
      matches,
      exactSourceNames,
      reason: present
        ? 'One or more exact source-node names matched reviewed lookup hints.'
        : 'No matching source node is present in the supplied source snapshot; acquire/verify geometry instead of fabricating it.',
    }
  })

  return {
    entries,
    present: entries.filter((entry) => entry.coverage === 'source-node-present').length,
    missing: entries.filter((entry) => entry.coverage === 'source-node-missing').length,
    referenceOnly: entries.filter((entry) => entry.coverage === 'reference-only').length,
    total: entries.length,
  }
}

export function respiratoryMissingStructureIds(report: RespiratorySourceGapReport) {
  return report.entries
    .filter((entry) => entry.coverage === 'source-node-missing')
    .map((entry) => entry.structureId)
}
