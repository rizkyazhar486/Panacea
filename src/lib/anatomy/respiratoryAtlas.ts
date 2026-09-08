import type { AnatomyAtlasNode, AnatomyRegion, AnatomyScale } from './atlasTypes.ts'

const RESPIRATORY_VERSION = 'panacea-respiratory-structural-draft-2026-09-09'

function respiratoryNode(
  id: string,
  canonicalName: string,
  parentId: string,
  regions: readonly AnatomyRegion[],
  sourceNodeHints: readonly string[],
  options: {
    synonyms?: readonly string[]
    scale?: AnatomyScale
    laterality?: 'midline' | 'left' | 'right' | 'bilateral' | 'not-applicable'
    conceptual?: boolean
    notes?: readonly string[]
  } = {},
): AnatomyAtlasNode {
  const conceptual = options.conceptual ?? false
  return {
    id,
    canonicalName,
    synonyms: options.synonyms ?? [],
    system: 'respiratory',
    regions,
    laterality: options.laterality ?? 'not-applicable',
    scale: options.scale ?? 'substructure',
    parentId,
    sourceBindings: sourceNodeHints.length ? [{
      file: 'visceral.glb',
      sourceNodeHints,
      status: 'candidate',
      meshMode: conceptual ? 'conceptual-overlay' : 'metadata-only',
    }] : [],
    provenance: [{
      sourceId: 'panacea-respiratory-structural-manifest',
      sourceVersion: RESPIRATORY_VERSION,
      sourceLocator: `src/lib/anatomy/respiratoryAtlas.ts#${id}`,
      evidenceKind: 'internal-structural',
      academicReview: 'pending',
      modelAssetReview: 'pending',
      note: conceptual
        ? 'Cross-scale educational target. No gross mesh may be presented as verified microanatomy without a dedicated reviewed source asset.'
        : 'Candidate hierarchy/source-node target only. Requires source-level and qualified anatomy review before verified display.',
    }],
    reviewStatus: 'structural-draft',
    educationalOnly: true,
    notes: options.notes,
  }
}

/**
 * Respiratory deep-zoom hierarchy.
 *
 * Gross structures can bind to candidate source-node names. Micro-scale nodes
 * deliberately remain conceptual/metadata-first so a whole-body GLB can never
 * masquerade as histology or patient-specific airway geometry.
 */
export const RESPIRATORY_ATLAS_NODES: readonly AnatomyAtlasNode[] = [
  respiratoryNode('resp-upper-airway', 'Upper airway', 'system-respiratory', ['head-neck'], ['nasal cavity', 'pharynx', 'larynx'], {
    scale: 'regional',
    notes: ['Navigation grouping only; anatomical boundaries and included structures require review before academic publication.'],
  }),
  respiratoryNode('resp-nasal-cavity', 'Nasal cavity', 'resp-upper-airway', ['head-neck'], ['nasal cavity'], { scale: 'organ' }),
  respiratoryNode('resp-pharyngeal-airway', 'Pharyngeal airway', 'resp-upper-airway', ['head-neck'], ['pharynx'], { scale: 'organ' }),
  respiratoryNode('resp-larynx', 'Larynx', 'resp-upper-airway', ['head-neck'], ['larynx'], { scale: 'organ' }),

  respiratoryNode('resp-conducting-airway', 'Conducting airway hierarchy', 'system-respiratory', ['head-neck', 'thorax'], ['trachea', 'bronch'], {
    scale: 'regional',
  }),
  respiratoryNode('resp-trachea', 'Trachea', 'resp-conducting-airway', ['head-neck', 'thorax'], ['trachea'], {
    scale: 'organ',
    laterality: 'midline',
  }),
  respiratoryNode('resp-right-main-bronchus', 'Right main bronchus', 'resp-trachea', ['thorax'], ['right main bronchus', 'right bronchus'], {
    scale: 'substructure',
    laterality: 'right',
  }),
  respiratoryNode('resp-left-main-bronchus', 'Left main bronchus', 'resp-trachea', ['thorax'], ['left main bronchus', 'left bronchus'], {
    scale: 'substructure',
    laterality: 'left',
  }),
  respiratoryNode('resp-lobar-airways', 'Lobar airway layer', 'resp-conducting-airway', ['thorax'], ['lobar bronchus', 'bronch'], {
    scale: 'substructure',
    laterality: 'bilateral',
    notes: ['Exact source-node-to-lobe assignments must be verified against the loaded source bundle before display.'],
  }),
  respiratoryNode('resp-segmental-airways', 'Segmental airway layer', 'resp-lobar-airways', ['thorax'], [], {
    scale: 'substructure',
    laterality: 'bilateral',
    conceptual: true,
    notes: ['Bronchopulmonary segment geometry is intentionally not inferred from a generic bronchial tree.'],
  }),

  respiratoryNode('resp-right-lung', 'Right lung', 'system-respiratory', ['thorax'], ['right lung', 'lung right'], {
    scale: 'organ',
    laterality: 'right',
  }),
  respiratoryNode('resp-right-upper-lobe', 'Right upper lobe', 'resp-right-lung', ['thorax'], ['right upper lobe', 'superior lobe right'], {
    laterality: 'right',
  }),
  respiratoryNode('resp-right-middle-lobe', 'Right middle lobe', 'resp-right-lung', ['thorax'], ['right middle lobe', 'middle lobe right'], {
    laterality: 'right',
  }),
  respiratoryNode('resp-right-lower-lobe', 'Right lower lobe', 'resp-right-lung', ['thorax'], ['right lower lobe', 'inferior lobe right'], {
    laterality: 'right',
  }),
  respiratoryNode('resp-right-segment-layer', 'Right bronchopulmonary segment layer', 'resp-right-lung', ['thorax'], [], {
    laterality: 'right',
    conceptual: true,
    notes: ['Segment labels/geometry are a future reviewed specialty-atlas layer; no generated partition is accepted as anatomy truth.'],
  }),

  respiratoryNode('resp-left-lung', 'Left lung', 'system-respiratory', ['thorax'], ['left lung', 'lung left'], {
    scale: 'organ',
    laterality: 'left',
  }),
  respiratoryNode('resp-left-upper-lobe', 'Left upper lobe', 'resp-left-lung', ['thorax'], ['left upper lobe', 'superior lobe left'], {
    laterality: 'left',
  }),
  respiratoryNode('resp-left-lower-lobe', 'Left lower lobe', 'resp-left-lung', ['thorax'], ['left lower lobe', 'inferior lobe left'], {
    laterality: 'left',
  }),
  respiratoryNode('resp-left-segment-layer', 'Left bronchopulmonary segment layer', 'resp-left-lung', ['thorax'], [], {
    laterality: 'left',
    conceptual: true,
    notes: ['Variant/fused segment naming and geometry require dedicated reviewed source data; no automatic partition is published.'],
  }),

  respiratoryNode('resp-pleural-layer', 'Pleural layer', 'system-respiratory', ['thorax'], ['pleura'], {
    scale: 'regional',
    laterality: 'bilateral',
  }),
  respiratoryNode('resp-right-pleura', 'Right pleural reference', 'resp-pleural-layer', ['thorax'], ['right pleura', 'pleura right'], {
    laterality: 'right',
  }),
  respiratoryNode('resp-left-pleura', 'Left pleural reference', 'resp-pleural-layer', ['thorax'], ['left pleura', 'pleura left'], {
    laterality: 'left',
  }),
  respiratoryNode('resp-diaphragm-reference', 'Diaphragm respiratory reference', 'system-respiratory', ['thorax', 'abdomen'], ['diaphragm'], {
    scale: 'organ',
    laterality: 'midline',
    notes: ['Cross-system navigation reference; muscle-specific modeling belongs to the muscular system source contract.'],
  }),

  respiratoryNode('resp-gas-exchange-zone', 'Gas-exchange microanatomy layer', 'system-respiratory', ['thorax'], [], {
    scale: 'micro',
    laterality: 'bilateral',
    conceptual: true,
    notes: ['This node is a deep-zoom gateway, not a localization claim inside the whole-body mesh.'],
  }),
  respiratoryNode('resp-respiratory-bronchiole-layer', 'Respiratory bronchiole layer', 'resp-gas-exchange-zone', ['thorax'], [], {
    scale: 'micro',
    laterality: 'bilateral',
    conceptual: true,
  }),
  respiratoryNode('resp-alveolar-duct-layer', 'Alveolar duct layer', 'resp-gas-exchange-zone', ['thorax'], [], {
    scale: 'micro',
    laterality: 'bilateral',
    conceptual: true,
  }),
  respiratoryNode('resp-alveolar-layer', 'Alveolar layer', 'resp-gas-exchange-zone', ['thorax'], [], {
    synonyms: ['alveoli'],
    scale: 'micro',
    laterality: 'bilateral',
    conceptual: true,
    notes: ['Requires dedicated microanatomy/histology assets and review before realistic rendering.'],
  }),
  respiratoryNode('resp-alveolar-capillary-interface', 'Alveolar-capillary interface', 'resp-alveolar-layer', ['thorax'], [], {
    scale: 'micro',
    laterality: 'bilateral',
    conceptual: true,
    notes: ['Physiology/histology bridge only; not represented by a gross-organ mesh.'],
  }),
]
