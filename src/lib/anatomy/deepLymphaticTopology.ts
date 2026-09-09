import type { AtlasNode, AtlasProvenance } from './atlasKernel'
import type { AtlasRelationPatch } from './highEndTopology'

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-deep-lymphatic-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/deepLymphaticTopology.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational lymphatic drainage topology only; nodal drainage variation and oncologic staging require qualified review.',
}

function lymphNode(id: string, label: string, parentId: string, regions: AtlasNode['regions'], laterality: AtlasNode['laterality'] = 'midline'): AtlasNode {
  return {
    id,
    label,
    system: 'lymphatic',
    regions,
    laterality,
    scale: 'suborgan',
    parentId,
    source: { mode: 'specific-fallback', nodeHints: [label] },
    provenance: REFERENCE_ONLY,
    geometryStatus: 'reference-only',
    educationalPriority: 0.78,
    physiologyCapable: true,
    surgicalLandmark: false,
  }
}

export const DEEP_LYMPHATIC_TOPOLOGY_NODES: readonly AtlasNode[] = [
  lymphNode('lymph:right-jugular-trunk', 'Right jugular lymphatic trunk', 'system:lymphatic', ['neck'], 'right'),
  lymphNode('lymph:left-jugular-trunk', 'Left jugular lymphatic trunk', 'system:lymphatic', ['neck'], 'left'),
  lymphNode('lymph:right-subclavian-trunk', 'Right subclavian lymphatic trunk', 'system:lymphatic', ['neck', 'thorax'], 'right'),
  lymphNode('lymph:left-subclavian-trunk', 'Left subclavian lymphatic trunk', 'system:lymphatic', ['neck', 'thorax'], 'left'),
  lymphNode('lymph:right-bronchomediastinal-trunk', 'Right bronchomediastinal lymphatic trunk', 'system:lymphatic', ['thorax'], 'right'),
  lymphNode('lymph:left-bronchomediastinal-trunk', 'Left bronchomediastinal lymphatic trunk', 'system:lymphatic', ['thorax'], 'left'),
  lymphNode('lymph:intestinal-trunk', 'Intestinal lymphatic trunk', 'system:lymphatic', ['abdomen']),
  lymphNode('lymph:right-lumbar-trunk', 'Right lumbar lymphatic trunk', 'system:lymphatic', ['abdomen', 'pelvis'], 'right'),
  lymphNode('lymph:left-lumbar-trunk', 'Left lumbar lymphatic trunk', 'system:lymphatic', ['abdomen', 'pelvis'], 'left'),

  lymphNode('lymph:right-cervical-nodes', 'Right cervical lymph node groups', 'lymph:cervical-nodes', ['head', 'neck'], 'right'),
  lymphNode('lymph:left-cervical-nodes', 'Left cervical lymph node groups', 'lymph:cervical-nodes', ['head', 'neck'], 'left'),
  lymphNode('lymph:right-axillary-nodes', 'Right axillary lymph node groups', 'lymph:axillary-nodes', ['thorax', 'upper-limb'], 'right'),
  lymphNode('lymph:left-axillary-nodes', 'Left axillary lymph node groups', 'lymph:axillary-nodes', ['thorax', 'upper-limb'], 'left'),
  lymphNode('lymph:right-mediastinal-nodes', 'Right mediastinal lymph node groups', 'lymph:mediastinal-nodes', ['thorax'], 'right'),
  lymphNode('lymph:left-mediastinal-nodes', 'Left mediastinal lymph node groups', 'lymph:mediastinal-nodes', ['thorax'], 'left'),
  lymphNode('lymph:right-inguinal-nodes', 'Right inguinal lymph node groups', 'lymph:inguinal-nodes', ['pelvis', 'lower-limb'], 'right'),
  lymphNode('lymph:left-inguinal-nodes', 'Left inguinal lymph node groups', 'lymph:inguinal-nodes', ['pelvis', 'lower-limb'], 'left'),
]

const drains = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'drains', note })

export const DEEP_LYMPHATIC_RELATION_PATCHES: readonly AtlasRelationPatch[] = [
  drains('lymph:right-cervical-nodes', 'lymph:right-jugular-trunk'),
  drains('lymph:left-cervical-nodes', 'lymph:left-jugular-trunk'),
  drains('lymph:right-axillary-nodes', 'lymph:right-subclavian-trunk'),
  drains('lymph:left-axillary-nodes', 'lymph:left-subclavian-trunk'),
  drains('lymph:right-mediastinal-nodes', 'lymph:right-bronchomediastinal-trunk'),
  drains('lymph:left-mediastinal-nodes', 'lymph:left-bronchomediastinal-trunk'),

  drains('lymph:mesenteric-nodes', 'lymph:intestinal-trunk', 'Educational central lymph drainage path; detailed nodal station variability is not inferred.'),
  drains('lymph:right-inguinal-nodes', 'lymph:right-lumbar-trunk', 'Simplified central drainage bridge; intervening iliac nodal chains are not represented as patient-specific anatomy.'),
  drains('lymph:left-inguinal-nodes', 'lymph:left-lumbar-trunk', 'Simplified central drainage bridge; intervening iliac nodal chains are not represented as patient-specific anatomy.'),
  drains('lymph:para-aortic-nodes', 'lymph:right-lumbar-trunk', 'Reference grouping only.'),
  drains('lymph:para-aortic-nodes', 'lymph:left-lumbar-trunk', 'Reference grouping only.'),

  drains('lymph:intestinal-trunk', 'lymph:cisterna-chyli'),
  drains('lymph:right-lumbar-trunk', 'lymph:cisterna-chyli'),
  drains('lymph:left-lumbar-trunk', 'lymph:cisterna-chyli'),
  drains('lymph:cisterna-chyli', 'lymph:thoracic-duct'),

  drains('lymph:left-jugular-trunk', 'lymph:thoracic-duct'),
  drains('lymph:left-subclavian-trunk', 'lymph:thoracic-duct'),
  drains('lymph:left-bronchomediastinal-trunk', 'lymph:thoracic-duct'),
  drains('lymph:thoracic-duct', 'cv:left-venous-angle'),

  drains('lymph:right-jugular-trunk', 'lymph:right-lymphatic-duct'),
  drains('lymph:right-subclavian-trunk', 'lymph:right-lymphatic-duct'),
  drains('lymph:right-bronchomediastinal-trunk', 'lymph:right-lymphatic-duct'),
  drains('lymph:right-lymphatic-duct', 'cv:right-venous-angle'),
]
