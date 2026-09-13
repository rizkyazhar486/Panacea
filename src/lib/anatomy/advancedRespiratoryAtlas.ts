import type { AtlasNode, AtlasProvenance } from './atlasKernel'

const SOURCE_CANDIDATE: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/visceral.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering source-node candidate mapping only; qualified respiratory anatomy review remains required.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-advanced-respiratory-reference',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/advancedRespiratoryAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational airway/microstructure topology only; not a patient-specific airway reconstruction.',
}

type RespOptions = {
  laterality?: AtlasNode['laterality']
  regions?: AtlasNode['regions']
  scale?: AtlasNode['scale']
  hints?: readonly string[]
  geometryStatus?: AtlasNode['geometryStatus']
  priority?: number
  physiologyCapable?: boolean
  surgicalLandmark?: boolean
  relations?: AtlasNode['relations']
  synonyms?: readonly string[]
}

function resp(id: string, label: string, parentId: string, options: RespOptions = {}): AtlasNode {
  const geometryStatus = options.geometryStatus ?? 'partial'
  return {
    id,
    label,
    system: 'respiratory',
    regions: options.regions ?? ['thorax'],
    laterality: options.laterality ?? 'midline',
    scale: options.scale ?? 'suborgan',
    parentId,
    synonyms: options.synonyms,
    source: {
      mode: 'specific-fallback',
      files: geometryStatus === 'reference-only' ? undefined : ['visceral.glb'],
      nodeHints: options.hints ?? [label],
    },
    provenance: geometryStatus === 'reference-only' ? REFERENCE_ONLY : SOURCE_CANDIDATE,
    geometryStatus,
    educationalPriority: options.priority ?? 0.9,
    physiologyCapable: options.physiologyCapable ?? true,
    surgicalLandmark: options.surgicalLandmark ?? false,
    relations: options.relations,
  }
}

const upperAirwayDetail: readonly AtlasNode[] = [
  resp('resp:nasopharynx', 'Nasopharynx', 'resp:pharynx', { regions: ['head', 'neck'], hints: ['nasopharynx'], geometryStatus: 'partial', priority: 0.82 }),
  resp('resp:oropharynx', 'Oropharynx', 'resp:pharynx', { regions: ['head', 'neck'], hints: ['oropharynx'], geometryStatus: 'partial', priority: 0.82 }),
  resp('resp:laryngopharynx', 'Laryngopharynx', 'resp:pharynx', { regions: ['neck'], hints: ['laryngopharynx', 'hypopharynx'], geometryStatus: 'partial', priority: 0.84, synonyms: ['Hypopharynx'] }),
  resp('resp:epiglottis', 'Epiglottis', 'resp:larynx', { regions: ['neck'], hints: ['epiglottis'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.9 }),
  resp('resp:vocal-folds', 'Vocal folds', 'resp:larynx', { regions: ['neck'], hints: ['vocal fold', 'vocal cord'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.92 }),
]

interface SegmentalBronchusDefinition {
  id: string
  label: string
  side: 'left' | 'right'
  lobarBronchusId: string
  parenchymalSegmentId: string
  hints: readonly string[]
}

const SEGMENTAL_BRONCHI: readonly SegmentalBronchusDefinition[] = [
  { id: 'r-b1', label: 'Right B1 apical segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s1', hints: ['apical segmental bronchus of right upper lobe'] },
  { id: 'r-b2', label: 'Right B2 posterior segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s2', hints: ['posterior segmental bronchus of right upper lobe'] },
  { id: 'r-b3', label: 'Right B3 anterior segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s3', hints: ['anterior segmental bronchus of right upper lobe'] },
  { id: 'r-b4', label: 'Right B4 lateral segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-middle-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s4', hints: ['lateral segmental bronchus of right middle lobe'] },
  { id: 'r-b5', label: 'Right B5 medial segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-middle-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s5', hints: ['medial segmental bronchus of right middle lobe'] },
  { id: 'r-b6', label: 'Right B6 superior segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s6', hints: ['superior segmental bronchus of right lower lobe'] },
  { id: 'r-b7', label: 'Right B7 medial basal segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s7', hints: ['medial basal segmental bronchus of right lung'] },
  { id: 'r-b8', label: 'Right B8 anterior basal segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s8', hints: ['anterior basal segmental bronchus of right lung'] },
  { id: 'r-b9', label: 'Right B9 lateral basal segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s9', hints: ['lateral basal segmental bronchus of right lung'] },
  { id: 'r-b10', label: 'Right B10 posterior basal segmental bronchus', side: 'right', lobarBronchusId: 'resp:right-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:r-s10', hints: ['posterior basal segmental bronchus of right lung'] },
  { id: 'l-b1-2', label: 'Left B1+2 apicoposterior segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s1-2', hints: ['apicoposterior segmental bronchus of left upper lobe', 'apical segmental bronchus of left upper lobe', 'posterior segmental bronchus of left upper lobe'] },
  { id: 'l-b3', label: 'Left B3 anterior segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s3', hints: ['anterior segmental bronchus of left upper lobe'] },
  { id: 'l-b4', label: 'Left B4 superior lingular segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s4', hints: ['superior lingular segmental bronchus'] },
  { id: 'l-b5', label: 'Left B5 inferior lingular segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-upper-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s5', hints: ['inferior lingular segmental bronchus'] },
  { id: 'l-b6', label: 'Left B6 superior segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s6', hints: ['superior segmental bronchus of left lower lobe'] },
  { id: 'l-b7-8', label: 'Left B7+8 anteromedial basal segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s7-8', hints: ['anteromedial basal segmental bronchus of left lung', 'anterior basal segmental bronchus of left lung'] },
  { id: 'l-b9', label: 'Left B9 lateral basal segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s9', hints: ['lateral basal segmental bronchus of left lung'] },
  { id: 'l-b10', label: 'Left B10 posterior basal segmental bronchus', side: 'left', lobarBronchusId: 'resp:left-lower-lobar-bronchus', parenchymalSegmentId: 'resp:segment:l-s10', hints: ['posterior basal segmental bronchus of left lung'] },
]

const lobarBronchi: readonly AtlasNode[] = [
  resp('resp:right-upper-lobar-bronchus', 'Right upper lobar bronchus', 'resp:right-main-bronchus', { laterality: 'right', hints: ['right upper lobar bronchus', 'superior lobar bronchus of right lung'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98, relations: [{ kind: 'supplies', targetId: 'resp:right-upper-lobe' }] }),
  resp('resp:right-middle-lobar-bronchus', 'Right middle lobar bronchus', 'resp:right-main-bronchus', { laterality: 'right', hints: ['right middle lobar bronchus', 'middle lobar bronchus of right lung'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.96, relations: [{ kind: 'supplies', targetId: 'resp:right-middle-lobe' }] }),
  resp('resp:right-lower-lobar-bronchus', 'Right lower lobar bronchus', 'resp:right-main-bronchus', { laterality: 'right', hints: ['right lower lobar bronchus', 'inferior lobar bronchus of right lung'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98, relations: [{ kind: 'supplies', targetId: 'resp:right-lower-lobe' }] }),
  resp('resp:left-upper-lobar-bronchus', 'Left upper lobar bronchus', 'resp:left-main-bronchus', { laterality: 'left', hints: ['left upper lobar bronchus', 'superior lobar bronchus of left lung'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98, relations: [{ kind: 'supplies', targetId: 'resp:left-upper-lobe' }] }),
  resp('resp:left-lower-lobar-bronchus', 'Left lower lobar bronchus', 'resp:left-main-bronchus', { laterality: 'left', hints: ['left lower lobar bronchus', 'inferior lobar bronchus of left lung'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98, relations: [{ kind: 'supplies', targetId: 'resp:left-lower-lobe' }] }),
]

const segmentalBronchusNodes: readonly AtlasNode[] = SEGMENTAL_BRONCHI.map((segment) => resp(
  `resp:segmental-bronchus:${segment.id}`,
  segment.label,
  segment.lobarBronchusId,
  {
    laterality: segment.side,
    hints: segment.hints,
    geometryStatus: 'partial',
    surgicalLandmark: true,
    priority: 0.95,
    relations: [{
      kind: 'supplies',
      targetId: segment.parenchymalSegmentId,
      note: 'Airway-to-parenchymal-segment educational mapping; not patient-specific bronchoscopy localization.',
    }],
  },
))

const distalAirwayReference: readonly AtlasNode[] = [
  resp('resp:distal-airway-reference', 'Distal airway reference layer', 'system:respiratory', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['distal airway'], priority: 0.86 }),
  resp('resp:terminal-bronchiole', 'Terminal bronchiole', 'resp:distal-airway-reference', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['terminal bronchiole'], priority: 0.9 }),
  resp('resp:respiratory-bronchiole', 'Respiratory bronchiole', 'resp:terminal-bronchiole', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['respiratory bronchiole'], priority: 0.92 }),
  resp('resp:alveolar-duct', 'Alveolar duct', 'resp:respiratory-bronchiole', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['alveolar duct'], priority: 0.92 }),
  resp('resp:alveolar-sac', 'Alveolar sac', 'resp:alveolar-duct', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['alveolar sac'], priority: 0.94 }),
  resp('resp:alveolus', 'Pulmonary alveolus', 'resp:alveolar-sac', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['alveolus'], priority: 1, relations: [{ kind: 'adjacent-to', targetId: 'resp:alveolar-capillary-unit' }] }),
  resp('resp:type-i-pneumocyte', 'Type I pneumocyte', 'resp:alveolus', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['type I pneumocyte'], priority: 0.9 }),
  resp('resp:type-ii-pneumocyte', 'Type II pneumocyte', 'resp:alveolus', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['type II pneumocyte'], priority: 0.9 }),
  resp('resp:alveolar-macrophage', 'Alveolar macrophage', 'resp:alveolus', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['alveolar macrophage'], priority: 0.78, physiologyCapable: false }),
  resp('resp:surfactant-layer', 'Pulmonary surfactant layer', 'resp:alveolus', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['pulmonary surfactant'], priority: 0.88 }),
  resp('resp:capillary-endothelium', 'Pulmonary capillary endothelium', 'resp:alveolar-capillary-unit', { scale: 'microstructure', geometryStatus: 'reference-only', hints: ['pulmonary capillary endothelium'], priority: 0.9 }),
]

const fissures: readonly AtlasNode[] = [
  resp('resp:right-oblique-fissure', 'Right oblique fissure', 'resp:right-lung', { laterality: 'right', scale: 'tissue', hints: ['oblique fissure of right lung'], geometryStatus: 'reference-only', surgicalLandmark: true, priority: 0.82 }),
  resp('resp:right-horizontal-fissure', 'Right horizontal fissure', 'resp:right-lung', { laterality: 'right', scale: 'tissue', hints: ['horizontal fissure of right lung'], geometryStatus: 'reference-only', surgicalLandmark: true, priority: 0.82 }),
  resp('resp:left-oblique-fissure', 'Left oblique fissure', 'resp:left-lung', { laterality: 'left', scale: 'tissue', hints: ['oblique fissure of left lung'], geometryStatus: 'reference-only', surgicalLandmark: true, priority: 0.82 }),
]

export const ADVANCED_RESPIRATORY_ATLAS_NODES: readonly AtlasNode[] = [
  ...upperAirwayDetail,
  ...lobarBronchi,
  ...segmentalBronchusNodes,
  ...distalAirwayReference,
  ...fissures,
]

export const ADVANCED_RESPIRATORY_SEGMENTAL_BRONCHUS_IDS = SEGMENTAL_BRONCHI.map((segment) => `resp:segmental-bronchus:${segment.id}`)
