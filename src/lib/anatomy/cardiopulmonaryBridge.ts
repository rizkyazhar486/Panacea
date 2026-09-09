import type { AtlasNode, AtlasProvenance } from './atlasKernel'
import type { AtlasRelationPatch } from './highEndTopology'

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-cardiopulmonary-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/cardiopulmonaryBridge.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational pulmonary microcirculation bridge only; no patient-specific capillary reconstruction or hemodynamic inference.',
}

export const CARDIOPULMONARY_BRIDGE_NODES: readonly AtlasNode[] = [
  {
    id: 'cv:pulmonary-capillary-bed',
    label: 'Pulmonary capillary bed',
    system: 'cardiovascular',
    regions: ['thorax'],
    laterality: 'bilateral',
    scale: 'microstructure',
    parentId: 'system:cardiovascular',
    source: { mode: 'specific-fallback', nodeHints: ['pulmonary capillary'] },
    provenance: REFERENCE_ONLY,
    geometryStatus: 'reference-only',
    educationalPriority: 0.98,
    physiologyCapable: true,
    surgicalLandmark: false,
    relations: [{
      kind: 'adjacent-to',
      targetId: 'resp:alveolar-capillary-unit',
      note: 'Cross-system gas-exchange interface reference; not patient microvascular geometry.',
    }],
  },
]

export const CARDIOPULMONARY_RELATION_PATCHES: readonly AtlasRelationPatch[] = [
  { from: 'cv:right-pulmonary-artery', to: 'cv:pulmonary-capillary-bed', kind: 'continuous-with', note: 'Educational pulmonary arterial-to-capillary continuity.' },
  { from: 'cv:left-pulmonary-artery', to: 'cv:pulmonary-capillary-bed', kind: 'continuous-with', note: 'Educational pulmonary arterial-to-capillary continuity.' },
  { from: 'cv:pulmonary-capillary-bed', to: 'cv:right-superior-pulmonary-vein', kind: 'continuous-with', note: 'Educational pulmonary capillary-to-venous continuity.' },
  { from: 'cv:pulmonary-capillary-bed', to: 'cv:right-inferior-pulmonary-vein', kind: 'continuous-with', note: 'Educational pulmonary capillary-to-venous continuity.' },
  { from: 'cv:pulmonary-capillary-bed', to: 'cv:left-superior-pulmonary-vein', kind: 'continuous-with', note: 'Educational pulmonary capillary-to-venous continuity.' },
  { from: 'cv:pulmonary-capillary-bed', to: 'cv:left-inferior-pulmonary-vein', kind: 'continuous-with', note: 'Educational pulmonary capillary-to-venous continuity.' },
]
