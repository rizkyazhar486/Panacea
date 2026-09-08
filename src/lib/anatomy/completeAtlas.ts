import type { AtlasManifest } from './atlasKernel'
import { RESPIRATORY_ATLAS_NODES } from './respiratoryAtlas'
import { WHOLE_BODY_ATLAS_BASE_NODES, withChildrenDerived } from './wholeBodyAtlas'

/**
 * Canonical high-complexity atlas manifest used by advanced viewers.
 *
 * The base whole-body scaffold and the respiratory deep-dive are composed only
 * here so each source file remains independently reviewable. Hierarchy children
 * are derived after composition, which makes cross-module parents (for example
 * respiratory microstructure under the lung) deterministic and reciprocal.
 */
export const COMPLETE_WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-complete-whole-body-atlas',
  revision: '2026-09-09-r1',
  nodes: withChildrenDerived([
    ...WHOLE_BODY_ATLAS_BASE_NODES,
    ...RESPIRATORY_ATLAS_NODES,
  ]),
}
