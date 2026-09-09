import type {
  HighEndAtlasEvidenceRef,
  HighEndAtlasStructure,
} from './highEndAtlasOntology'

export type RespiratorySide = 'right' | 'left'
export type RespiratorySegmentVariant = 'canonical' | 'combined-common-description' | 'optional-split-variant'

export interface BronchopulmonarySegmentDefinition {
  id: string
  side: RespiratorySide
  lobeId: string
  code: string
  bronchusCode: string
  label: string
  variant: RespiratorySegmentVariant
  sourceNodeHints: readonly string[]
  note?: string
}

export const RESPIRATORY_ANATOMY_EVIDENCE: readonly HighEndAtlasEvidenceRef[] = [
  {
    id: 'ncbi-statpearls-bronchial-anatomy-2026',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537353/',
    role: 'anatomy-reference',
    versionOrAccessDate: '2026-09-09',
  },
  {
    id: 'ncbi-statpearls-lobectomy-segments-2026',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK553123/',
    role: 'anatomy-reference',
    versionOrAccessDate: '2026-09-09',
  },
]

const respiratoryNode = (
  node: Omit<HighEndAtlasStructure, 'system' | 'region' | 'reviewStatus' | 'evidenceRefs' | 'renderClass' | 'clinicalImportance'>
  & Partial<Pick<HighEndAtlasStructure, 'clinicalImportance' | 'evidenceRefs'>>,
): HighEndAtlasStructure => ({
  ...node,
  system: 'respiratory',
  region: node.id.includes('upper-airway') ? 'head-neck' : 'thorax',
  reviewStatus: 'pending',
  renderClass: node.level === 'microstructure' || node.level === 'cellular' ? 'microstructure' : 'viscus',
  clinicalImportance: node.clinicalImportance ?? 0.9,
  evidenceRefs: node.evidenceRefs ?? RESPIRATORY_ANATOMY_EVIDENCE,
})

export const RESPIRATORY_CORE_NODES: readonly HighEndAtlasStructure[] = [
  respiratoryNode({
    id: 'respiratory-upper-airway', label: 'Upper airway', aliases: ['upper respiratory tract'], laterality: 'midline', level: 'region',
    parentId: 'system-respiratory', sourceNodeHints: ['nasal cavity', 'pharynx', 'larynx'], geometryProvenance: 'adjacent-geometry', tags: ['airway', 'conducting-zone'],
  }),
  respiratoryNode({
    id: 'respiratory-trachea', label: 'Trachea', aliases: ['windpipe'], laterality: 'midline', level: 'organ',
    parentId: 'system-respiratory', sourceNodeHints: ['trachea'], geometryProvenance: 'native-geometry', tags: ['airway', 'conducting-zone'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'respiratory-carina', label: 'Carina', aliases: ['tracheal bifurcation'], laterality: 'midline', level: 'structure',
    parentId: 'respiratory-trachea', sourceNodeHints: ['carina', 'tracheal bifurcation'], geometryProvenance: 'adjacent-geometry', tags: ['airway', 'landmark'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'bronchus-right-main', label: 'Right main bronchus', aliases: ['right mainstem bronchus'], laterality: 'right', level: 'structure',
    parentId: 'respiratory-carina', sourceNodeHints: ['right main bronchus', 'main bronchus.r', 'bronchus.r'], geometryProvenance: 'adjacent-geometry', tags: ['airway', 'bronchial-tree'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'bronchus-left-main', label: 'Left main bronchus', aliases: ['left mainstem bronchus'], laterality: 'left', level: 'structure',
    parentId: 'respiratory-carina', sourceNodeHints: ['left main bronchus', 'main bronchus.l', 'bronchus.l'], geometryProvenance: 'adjacent-geometry', tags: ['airway', 'bronchial-tree'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'lung-right', label: 'Right lung', aliases: ['right pulmonary lung'], laterality: 'right', level: 'organ',
    parentId: 'system-respiratory', sourceNodeHints: ['right lung', 'lung.r'], geometryProvenance: 'native-geometry', tags: ['lung', 'parenchyma'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'lung-left', label: 'Left lung', aliases: ['left pulmonary lung'], laterality: 'left', level: 'organ',
    parentId: 'system-respiratory', sourceNodeHints: ['left lung', 'lung.l'], geometryProvenance: 'native-geometry', tags: ['lung', 'parenchyma'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'lung-right-upper-lobe', label: 'Right upper lobe', aliases: ['RUL'], laterality: 'right', level: 'lobe',
    parentId: 'lung-right', sourceNodeHints: ['right upper lobe', 'upper lobe.r'], geometryProvenance: 'adjacent-geometry', tags: ['lung', 'lobe'],
  }),
  respiratoryNode({
    id: 'lung-right-middle-lobe', label: 'Right middle lobe', aliases: ['RML'], laterality: 'right', level: 'lobe',
    parentId: 'lung-right', sourceNodeHints: ['right middle lobe', 'middle lobe.r'], geometryProvenance: 'adjacent-geometry', tags: ['lung', 'lobe'],
  }),
  respiratoryNode({
    id: 'lung-right-lower-lobe', label: 'Right lower lobe', aliases: ['RLL'], laterality: 'right', level: 'lobe',
    parentId: 'lung-right', sourceNodeHints: ['right lower lobe', 'lower lobe.r'], geometryProvenance: 'adjacent-geometry', tags: ['lung', 'lobe'],
  }),
  respiratoryNode({
    id: 'lung-left-upper-lobe', label: 'Left upper lobe', aliases: ['LUL'], laterality: 'left', level: 'lobe',
    parentId: 'lung-left', sourceNodeHints: ['left upper lobe', 'upper lobe.l'], geometryProvenance: 'adjacent-geometry', tags: ['lung', 'lobe'],
  }),
  respiratoryNode({
    id: 'lung-left-lower-lobe', label: 'Left lower lobe', aliases: ['LLL'], laterality: 'left', level: 'lobe',
    parentId: 'lung-left', sourceNodeHints: ['left lower lobe', 'lower lobe.l'], geometryProvenance: 'adjacent-geometry', tags: ['lung', 'lobe'],
  }),
  respiratoryNode({
    id: 'bronchus-right-upper-lobar', label: 'Right upper lobar bronchus', aliases: [], laterality: 'right', level: 'structure',
    parentId: 'bronchus-right-main', sourceNodeHints: ['right upper lobar bronchus'], geometryProvenance: 'not-represented', tags: ['airway', 'lobar-bronchus'],
  }),
  respiratoryNode({
    id: 'bronchus-right-middle-lobar', label: 'Right middle lobar bronchus', aliases: [], laterality: 'right', level: 'structure',
    parentId: 'bronchus-right-main', sourceNodeHints: ['right middle lobar bronchus'], geometryProvenance: 'not-represented', tags: ['airway', 'lobar-bronchus'],
  }),
  respiratoryNode({
    id: 'bronchus-right-lower-lobar', label: 'Right lower lobar bronchus', aliases: [], laterality: 'right', level: 'structure',
    parentId: 'bronchus-right-main', sourceNodeHints: ['right lower lobar bronchus'], geometryProvenance: 'not-represented', tags: ['airway', 'lobar-bronchus'],
  }),
  respiratoryNode({
    id: 'bronchus-left-upper-lobar', label: 'Left upper lobar bronchus', aliases: [], laterality: 'left', level: 'structure',
    parentId: 'bronchus-left-main', sourceNodeHints: ['left upper lobar bronchus'], geometryProvenance: 'not-represented', tags: ['airway', 'lobar-bronchus'],
  }),
  respiratoryNode({
    id: 'bronchus-left-lower-lobar', label: 'Left lower lobar bronchus', aliases: [], laterality: 'left', level: 'structure',
    parentId: 'bronchus-left-main', sourceNodeHints: ['left lower lobar bronchus'], geometryProvenance: 'not-represented', tags: ['airway', 'lobar-bronchus'],
  }),
  respiratoryNode({
    id: 'pleura-right', label: 'Right pleura', aliases: ['right visceral and parietal pleura'], laterality: 'right', level: 'tissue',
    parentId: 'system-respiratory', sourceNodeHints: ['pleura.r', 'right pleura'], geometryProvenance: 'not-represented', tags: ['pleura', 'thoracic-boundary'],
  }),
  respiratoryNode({
    id: 'pleura-left', label: 'Left pleura', aliases: ['left visceral and parietal pleura'], laterality: 'left', level: 'tissue',
    parentId: 'system-respiratory', sourceNodeHints: ['pleura.l', 'left pleura'], geometryProvenance: 'not-represented', tags: ['pleura', 'thoracic-boundary'],
  }),
  respiratoryNode({
    id: 'respiratory-diaphragm', label: 'Diaphragm', aliases: ['thoracic diaphragm'], laterality: 'bilateral', level: 'structure',
    parentId: 'system-respiratory', sourceNodeHints: ['diaphragm'], geometryProvenance: 'adjacent-geometry', tags: ['respiratory-mechanics', 'muscle-interface'], clinicalImportance: 1,
  }),
  respiratoryNode({
    id: 'respiratory-bronchioles', label: 'Bronchiolar conducting tree', aliases: ['bronchioles'], laterality: 'bilateral', level: 'microstructure',
    parentId: 'system-respiratory', sourceNodeHints: ['bronchiole'], geometryProvenance: 'not-represented', tags: ['airway', 'conducting-zone', 'microstructure'],
  }),
  respiratoryNode({
    id: 'respiratory-respiratory-bronchioles', label: 'Respiratory bronchioles', aliases: [], laterality: 'bilateral', level: 'microstructure',
    parentId: 'respiratory-bronchioles', sourceNodeHints: ['respiratory bronchiole'], geometryProvenance: 'not-represented', tags: ['respiratory-zone', 'microstructure'],
  }),
  respiratoryNode({
    id: 'respiratory-alveolar-ducts', label: 'Alveolar ducts', aliases: [], laterality: 'bilateral', level: 'microstructure',
    parentId: 'respiratory-respiratory-bronchioles', sourceNodeHints: ['alveolar duct'], geometryProvenance: 'not-represented', tags: ['respiratory-zone', 'microstructure'],
  }),
  respiratoryNode({
    id: 'respiratory-alveoli', label: 'Alveoli', aliases: ['pulmonary alveoli'], laterality: 'bilateral', level: 'microstructure',
    parentId: 'respiratory-alveolar-ducts', sourceNodeHints: ['alveolus', 'alveoli'], geometryProvenance: 'not-represented', tags: ['gas-exchange', 'respiratory-zone', 'microstructure'], clinicalImportance: 1,
  }),
]

export const BRONCHOPULMONARY_SEGMENTS: readonly BronchopulmonarySegmentDefinition[] = [
  { id: 'segment-r-s1', side: 'right', lobeId: 'lung-right-upper-lobe', code: 'S1', bronchusCode: 'B1', label: 'Apical', variant: 'canonical', sourceNodeHints: ['right apical segment', 'S1.r'] },
  { id: 'segment-r-s2', side: 'right', lobeId: 'lung-right-upper-lobe', code: 'S2', bronchusCode: 'B2', label: 'Posterior', variant: 'canonical', sourceNodeHints: ['right posterior segment', 'S2.r'] },
  { id: 'segment-r-s3', side: 'right', lobeId: 'lung-right-upper-lobe', code: 'S3', bronchusCode: 'B3', label: 'Anterior', variant: 'canonical', sourceNodeHints: ['right anterior segment', 'S3.r'] },
  { id: 'segment-r-s4', side: 'right', lobeId: 'lung-right-middle-lobe', code: 'S4', bronchusCode: 'B4', label: 'Lateral', variant: 'canonical', sourceNodeHints: ['right lateral middle lobe segment', 'S4.r'] },
  { id: 'segment-r-s5', side: 'right', lobeId: 'lung-right-middle-lobe', code: 'S5', bronchusCode: 'B5', label: 'Medial', variant: 'canonical', sourceNodeHints: ['right medial middle lobe segment', 'S5.r'] },
  { id: 'segment-r-s6', side: 'right', lobeId: 'lung-right-lower-lobe', code: 'S6', bronchusCode: 'B6', label: 'Superior', variant: 'canonical', sourceNodeHints: ['right superior lower lobe segment', 'S6.r'] },
  { id: 'segment-r-s7', side: 'right', lobeId: 'lung-right-lower-lobe', code: 'S7', bronchusCode: 'B7', label: 'Medial basal', variant: 'canonical', sourceNodeHints: ['right medial basal segment', 'S7.r'] },
  { id: 'segment-r-s8', side: 'right', lobeId: 'lung-right-lower-lobe', code: 'S8', bronchusCode: 'B8', label: 'Anterior basal', variant: 'canonical', sourceNodeHints: ['right anterior basal segment', 'S8.r'] },
  { id: 'segment-r-s9', side: 'right', lobeId: 'lung-right-lower-lobe', code: 'S9', bronchusCode: 'B9', label: 'Lateral basal', variant: 'canonical', sourceNodeHints: ['right lateral basal segment', 'S9.r'] },
  { id: 'segment-r-s10', side: 'right', lobeId: 'lung-right-lower-lobe', code: 'S10', bronchusCode: 'B10', label: 'Posterior basal', variant: 'canonical', sourceNodeHints: ['right posterior basal segment', 'S10.r'] },
  { id: 'segment-l-s1-2', side: 'left', lobeId: 'lung-left-upper-lobe', code: 'S1+2', bronchusCode: 'B1+2', label: 'Apicoposterior', variant: 'combined-common-description', sourceNodeHints: ['left apicoposterior segment', 'S1+2.l'], note: 'Common combined left-lung description; segment combinations vary by nomenclature and anatomy.' },
  { id: 'segment-l-s3', side: 'left', lobeId: 'lung-left-upper-lobe', code: 'S3', bronchusCode: 'B3', label: 'Anterior', variant: 'canonical', sourceNodeHints: ['left anterior upper lobe segment', 'S3.l'] },
  { id: 'segment-l-s4', side: 'left', lobeId: 'lung-left-upper-lobe', code: 'S4', bronchusCode: 'B4', label: 'Superior lingular', variant: 'canonical', sourceNodeHints: ['left superior lingular segment', 'S4.l'] },
  { id: 'segment-l-s5', side: 'left', lobeId: 'lung-left-upper-lobe', code: 'S5', bronchusCode: 'B5', label: 'Inferior lingular', variant: 'canonical', sourceNodeHints: ['left inferior lingular segment', 'S5.l'] },
  { id: 'segment-l-s6', side: 'left', lobeId: 'lung-left-lower-lobe', code: 'S6', bronchusCode: 'B6', label: 'Superior', variant: 'canonical', sourceNodeHints: ['left superior lower lobe segment', 'S6.l'] },
  { id: 'segment-l-s7-8', side: 'left', lobeId: 'lung-left-lower-lobe', code: 'S7+8', bronchusCode: 'B7+8', label: 'Anteromedial basal', variant: 'combined-common-description', sourceNodeHints: ['left anteromedial basal segment', 'S7+8.l'], note: 'Common combined left-lung description; separate medial/anterior basal branching can occur.' },
  { id: 'segment-l-s9', side: 'left', lobeId: 'lung-left-lower-lobe', code: 'S9', bronchusCode: 'B9', label: 'Lateral basal', variant: 'canonical', sourceNodeHints: ['left lateral basal segment', 'S9.l'] },
  { id: 'segment-l-s10', side: 'left', lobeId: 'lung-left-lower-lobe', code: 'S10', bronchusCode: 'B10', label: 'Posterior basal', variant: 'canonical', sourceNodeHints: ['left posterior basal segment', 'S10.l'] },
]

export const RESPIRATORY_SEGMENT_NODES: readonly HighEndAtlasStructure[] = BRONCHOPULMONARY_SEGMENTS.map((segment) =>
  respiratoryNode({
    id: segment.id,
    label: `${segment.side === 'right' ? 'Right' : 'Left'} ${segment.label} (${segment.code})`,
    aliases: [segment.code, segment.bronchusCode, segment.label],
    laterality: segment.side,
    level: 'segment',
    parentId: segment.lobeId,
    sourceNodeHints: segment.sourceNodeHints,
    geometryProvenance: 'not-represented',
    tags: ['lung', 'bronchopulmonary-segment', segment.code, segment.variant],
    clinicalImportance: 1,
  }),
)

export const HIGH_END_RESPIRATORY_ATLAS_NODES: readonly HighEndAtlasStructure[] = [
  ...RESPIRATORY_CORE_NODES,
  ...RESPIRATORY_SEGMENT_NODES,
]

export function respiratorySegmentsForSide(side: RespiratorySide) {
  return BRONCHOPULMONARY_SEGMENTS.filter((segment) => segment.side === side)
}

export function respiratorySegmentsForLobe(lobeId: string) {
  return BRONCHOPULMONARY_SEGMENTS.filter((segment) => segment.lobeId === lobeId)
}
