import type { AnatomyRelation } from './types'

/**
 * Cross-module circulation edges whose endpoints are split between the base
 * whole-body catalogue and the deep cardiovascular extension. Keeping these
 * edges explicit avoids encoding blood-flow topology indirectly through the
 * semantic parent hierarchy.
 */
export const CIRCULATION_TOPOLOGY_RELATIONS: readonly AnatomyRelation[] = [
  { from: 'brachiocephalic-trunk', to: 'right-common-carotid', type: 'branches-to' },
  { from: 'brachiocephalic-trunk', to: 'right-subclavian-artery', type: 'branches-to' },
  { from: 'abdominal-aorta', to: 'right-common-iliac-artery', type: 'branches-to' },
  { from: 'abdominal-aorta', to: 'left-common-iliac-artery', type: 'branches-to' },
  { from: 'right-common-iliac-artery', to: 'right-femoral-artery', type: 'branches-to' },
  { from: 'left-common-iliac-artery', to: 'left-femoral-artery', type: 'branches-to' },
  { from: 'right-femoral-vein', to: 'inferior-vena-cava', type: 'drains-to' },
  { from: 'left-femoral-vein', to: 'inferior-vena-cava', type: 'drains-to' },
]
