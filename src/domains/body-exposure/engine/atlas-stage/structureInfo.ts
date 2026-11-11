// What the stage says about one atlas structure, derived from its node name alone. Pure.
//
// Nothing here is a finding about a person: the kind is read from the words of the name (the same reader the
// rest of Body Exposure uses), and the side is the file's own label unless that label is under review.

import { jenisDariNamaStruktur } from '../jenisStruktur.ts'
import { readAtlasSide, type AtlasSide } from './sideLabel.ts'
import type { AtlasLayerId } from './stageLayers.ts'
import type { SideLabelReviewKind } from '../../data/atlasSideLabelReview.ts'

export interface SelectedStructureInfo {
  /** Exact node name in the atlas file. */
  meshName: string
  layerId: AtlasLayerId | null
  /** Name without the side suffix. */
  cleanName: string
  /** What kind of structure the name describes; empty when the name says nothing. */
  kind: string
  /** Side stated by the file, withheld when under review. */
  side: AtlasSide | null
  sideReview: SideLabelReviewKind | null
}

export function describeStructure(rawName: string, layer: AtlasLayerId | null): SelectedStructureInfo {
  const name = typeof rawName === 'string' ? rawName : ''
  const side = readAtlasSide(name)
  return {
    meshName: name,
    layerId: layer,
    cleanName: side.base || name,
    kind: jenisDariNamaStruktur(name),
    side: side.side,
    sideReview: side.review,
  }
}
