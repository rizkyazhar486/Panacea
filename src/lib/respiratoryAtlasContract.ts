import type { AnatomySpatialEdge, AnatomySpatialGraph, AnatomySpatialNode } from './anatomySpatialGraph'

export type RespiratoryNomenclatureVariant = 'standard-grouped' | 'variant-sensitive'

export interface RespiratoryAtlasMetadata {
  atlasId: string
  version: string
  nomenclatureVariant: RespiratoryNomenclatureVariant
  clinicalReview: 'pending' | 'recorded'
  educationalOnly: true
}

export const RESPIRATORY_ATLAS_METADATA: RespiratoryAtlasMetadata = {
  atlasId: 'panacea-respiratory-whole-body-core',
  version: '2026-09-09.1',
  nomenclatureVariant: 'variant-sensitive',
  clinicalReview: 'pending',
  educationalOnly: true,
}

const MB = 1024 * 1024

function respiratoryNode(
  id: string,
  label: string,
  parentId: string | undefined,
  region: AnatomySpatialNode['region'],
  laterality: AnatomySpatialNode['laterality'],
  aliases: readonly string[],
  sourceNodeAliases: readonly string[] = [],
  clinicalWeight = 1,
): AnatomySpatialNode {
  return {
    id,
    label,
    aliases,
    sourceNodeAliases,
    system: 'respiratory',
    region,
    laterality,
    parentId,
    lod: {
      minLevel: parentId ? 1 : 0,
      maxLevel: 4,
      clinicalWeight,
      estimatedGpuBytes: Math.round((2 + clinicalWeight * 3) * MB),
      geometricError: Math.max(0.5, 8 / Math.max(0.5, clinicalWeight)),
    },
    reviewStatus: 'pending',
  }
}

export const RESPIRATORY_ATLAS_NODES: readonly AnatomySpatialNode[] = [
  respiratoryNode('respiratory-system', 'Respiratory system', undefined, 'whole-body', 'not-applicable', ['respiratory tract', 'airway']),
  respiratoryNode('upper-airway', 'Upper airway', 'respiratory-system', 'head-neck', 'midline', ['upper respiratory tract']),
  respiratoryNode('nasal-cavity', 'Nasal cavity', 'upper-airway', 'head-neck', 'midline', ['nasal passages']),
  respiratoryNode('nasopharynx', 'Nasopharynx', 'upper-airway', 'head-neck', 'midline', []),
  respiratoryNode('oropharynx', 'Oropharynx', 'upper-airway', 'head-neck', 'midline', []),
  respiratoryNode('laryngopharynx', 'Laryngopharynx', 'upper-airway', 'head-neck', 'midline', ['hypopharynx']),
  respiratoryNode('larynx', 'Larynx', 'upper-airway', 'head-neck', 'midline', ['voice box']),
  respiratoryNode('lower-airway', 'Lower airway', 'respiratory-system', 'thorax', 'midline', ['lower respiratory tract']),
  respiratoryNode('trachea', 'Trachea', 'lower-airway', 'thorax', 'midline', ['windpipe'], ['Trachea'], 2),
  respiratoryNode('carina', 'Tracheal carina', 'trachea', 'thorax', 'midline', ['carina'], ['Carina'], 2),
  respiratoryNode('right-main-bronchus', 'Right main bronchus', 'carina', 'thorax', 'right', ['right mainstem bronchus'], ['Right_Main_Bronchus'], 2),
  respiratoryNode('left-main-bronchus', 'Left main bronchus', 'carina', 'thorax', 'left', ['left mainstem bronchus'], ['Left_Main_Bronchus'], 2),

  respiratoryNode('right-lung', 'Right lung', 'respiratory-system', 'thorax', 'right', [], ['Right_Lung'], 2),
  respiratoryNode('right-upper-lobe', 'Right upper lobe', 'right-lung', 'thorax', 'right', ['RUL'], ['Right_Upper_Lobe'], 2),
  respiratoryNode('right-middle-lobe', 'Right middle lobe', 'right-lung', 'thorax', 'right', ['RML'], ['Right_Middle_Lobe'], 2),
  respiratoryNode('right-lower-lobe', 'Right lower lobe', 'right-lung', 'thorax', 'right', ['RLL'], ['Right_Lower_Lobe'], 2),
  respiratoryNode('right-upper-lobar-bronchus', 'Right upper lobar bronchus', 'right-main-bronchus', 'thorax', 'right', ['right upper lobe bronchus']),
  respiratoryNode('right-middle-lobar-bronchus', 'Right middle lobar bronchus', 'right-main-bronchus', 'thorax', 'right', ['right middle lobe bronchus']),
  respiratoryNode('right-lower-lobar-bronchus', 'Right lower lobar bronchus', 'right-main-bronchus', 'thorax', 'right', ['right lower lobe bronchus']),
  respiratoryNode('r-s1-apical', 'Right S1 apical segment', 'right-upper-lobe', 'thorax', 'right', ['RUL S1', 'right apical segment']),
  respiratoryNode('r-s2-posterior', 'Right S2 posterior segment', 'right-upper-lobe', 'thorax', 'right', ['RUL S2', 'right posterior segment']),
  respiratoryNode('r-s3-anterior', 'Right S3 anterior segment', 'right-upper-lobe', 'thorax', 'right', ['RUL S3', 'right anterior segment']),
  respiratoryNode('r-s4-lateral', 'Right S4 lateral segment', 'right-middle-lobe', 'thorax', 'right', ['RML S4', 'right lateral segment']),
  respiratoryNode('r-s5-medial', 'Right S5 medial segment', 'right-middle-lobe', 'thorax', 'right', ['RML S5', 'right medial segment']),
  respiratoryNode('r-s6-superior', 'Right S6 superior segment', 'right-lower-lobe', 'thorax', 'right', ['RLL S6', 'right superior lower-lobe segment']),
  respiratoryNode('r-s7-medial-basal', 'Right S7 medial basal segment', 'right-lower-lobe', 'thorax', 'right', ['RLL S7', 'right medial basal segment']),
  respiratoryNode('r-s8-anterior-basal', 'Right S8 anterior basal segment', 'right-lower-lobe', 'thorax', 'right', ['RLL S8', 'right anterior basal segment']),
  respiratoryNode('r-s9-lateral-basal', 'Right S9 lateral basal segment', 'right-lower-lobe', 'thorax', 'right', ['RLL S9', 'right lateral basal segment']),
  respiratoryNode('r-s10-posterior-basal', 'Right S10 posterior basal segment', 'right-lower-lobe', 'thorax', 'right', ['RLL S10', 'right posterior basal segment']),

  respiratoryNode('left-lung', 'Left lung', 'respiratory-system', 'thorax', 'left', [], ['Left_Lung'], 2),
  respiratoryNode('left-upper-lobe', 'Left upper lobe', 'left-lung', 'thorax', 'left', ['LUL'], ['Left_Upper_Lobe'], 2),
  respiratoryNode('lingula', 'Lingula', 'left-upper-lobe', 'thorax', 'left', ['left lingula']),
  respiratoryNode('left-lower-lobe', 'Left lower lobe', 'left-lung', 'thorax', 'left', ['LLL'], ['Left_Lower_Lobe'], 2),
  respiratoryNode('left-upper-lobar-bronchus', 'Left upper lobar bronchus', 'left-main-bronchus', 'thorax', 'left', ['left upper lobe bronchus']),
  respiratoryNode('left-lower-lobar-bronchus', 'Left lower lobar bronchus', 'left-main-bronchus', 'thorax', 'left', ['left lower lobe bronchus']),
  respiratoryNode('l-s1-2-apicoposterior', 'Left S1+2 apicoposterior segment', 'left-upper-lobe', 'thorax', 'left', ['LUL S1+2', 'left apicoposterior segment']),
  respiratoryNode('l-s3-anterior', 'Left S3 anterior segment', 'left-upper-lobe', 'thorax', 'left', ['LUL S3', 'left anterior segment']),
  respiratoryNode('l-s4-superior-lingular', 'Left S4 superior lingular segment', 'lingula', 'thorax', 'left', ['lingular S4', 'superior lingular segment']),
  respiratoryNode('l-s5-inferior-lingular', 'Left S5 inferior lingular segment', 'lingula', 'thorax', 'left', ['lingular S5', 'inferior lingular segment']),
  respiratoryNode('l-s6-superior', 'Left S6 superior segment', 'left-lower-lobe', 'thorax', 'left', ['LLL S6', 'left superior lower-lobe segment']),
  respiratoryNode('l-s7-8-anteromedial-basal', 'Left S7+8 anteromedial basal segment', 'left-lower-lobe', 'thorax', 'left', ['LLL S7+8', 'left anteromedial basal segment']),
  respiratoryNode('l-s9-lateral-basal', 'Left S9 lateral basal segment', 'left-lower-lobe', 'thorax', 'left', ['LLL S9', 'left lateral basal segment']),
  respiratoryNode('l-s10-posterior-basal', 'Left S10 posterior basal segment', 'left-lower-lobe', 'thorax', 'left', ['LLL S10', 'left posterior basal segment']),

  respiratoryNode('pleura', 'Pleura', 'respiratory-system', 'thorax', 'bilateral', ['pleural membranes']),
  respiratoryNode('right-pleura', 'Right pleura', 'pleura', 'thorax', 'right', []),
  respiratoryNode('left-pleura', 'Left pleura', 'pleura', 'thorax', 'left', []),
  respiratoryNode('diaphragm', 'Diaphragm', 'respiratory-system', 'thorax', 'midline', ['respiratory diaphragm'], ['Diaphragm'], 2),
  respiratoryNode('alveolar-zone', 'Alveolar gas-exchange zone', 'respiratory-system', 'thorax', 'bilateral', ['alveolar zone', 'gas exchange zone'], [], 1.5),
] as const

const airway = (from: string, to: string): AnatomySpatialEdge => ({ from, to, relation: 'airwayTo' })
const adjacent = (from: string, to: string): AnatomySpatialEdge => ({ from, to, relation: 'adjacentTo' })

export const RESPIRATORY_ATLAS_EDGES: readonly AnatomySpatialEdge[] = [
  airway('nasal-cavity', 'nasopharynx'),
  airway('nasopharynx', 'oropharynx'),
  airway('oropharynx', 'laryngopharynx'),
  airway('laryngopharynx', 'larynx'),
  airway('larynx', 'trachea'),
  airway('trachea', 'carina'),
  airway('carina', 'right-main-bronchus'),
  airway('carina', 'left-main-bronchus'),
  airway('right-main-bronchus', 'right-upper-lobar-bronchus'),
  airway('right-main-bronchus', 'right-middle-lobar-bronchus'),
  airway('right-main-bronchus', 'right-lower-lobar-bronchus'),
  airway('right-upper-lobar-bronchus', 'r-s1-apical'),
  airway('right-upper-lobar-bronchus', 'r-s2-posterior'),
  airway('right-upper-lobar-bronchus', 'r-s3-anterior'),
  airway('right-middle-lobar-bronchus', 'r-s4-lateral'),
  airway('right-middle-lobar-bronchus', 'r-s5-medial'),
  airway('right-lower-lobar-bronchus', 'r-s6-superior'),
  airway('right-lower-lobar-bronchus', 'r-s7-medial-basal'),
  airway('right-lower-lobar-bronchus', 'r-s8-anterior-basal'),
  airway('right-lower-lobar-bronchus', 'r-s9-lateral-basal'),
  airway('right-lower-lobar-bronchus', 'r-s10-posterior-basal'),
  airway('left-main-bronchus', 'left-upper-lobar-bronchus'),
  airway('left-main-bronchus', 'left-lower-lobar-bronchus'),
  airway('left-upper-lobar-bronchus', 'l-s1-2-apicoposterior'),
  airway('left-upper-lobar-bronchus', 'l-s3-anterior'),
  airway('left-upper-lobar-bronchus', 'l-s4-superior-lingular'),
  airway('left-upper-lobar-bronchus', 'l-s5-inferior-lingular'),
  airway('left-lower-lobar-bronchus', 'l-s6-superior'),
  airway('left-lower-lobar-bronchus', 'l-s7-8-anteromedial-basal'),
  airway('left-lower-lobar-bronchus', 'l-s9-lateral-basal'),
  airway('left-lower-lobar-bronchus', 'l-s10-posterior-basal'),
  adjacent('right-lung', 'right-pleura'),
  adjacent('left-lung', 'left-pleura'),
  adjacent('right-lung', 'diaphragm'),
  adjacent('left-lung', 'diaphragm'),
] as const

export const RESPIRATORY_ATLAS_GRAPH: AnatomySpatialGraph = {
  nodes: RESPIRATORY_ATLAS_NODES,
  edges: RESPIRATORY_ATLAS_EDGES,
}

export interface RespiratoryVariantRecord {
  structureId: string
  canonicalGroupedId: string
  note: string
  reviewStatus: 'pending'
}

export const RESPIRATORY_VARIANTS: readonly RespiratoryVariantRecord[] = [
  {
    structureId: 'left-s1-and-s2-separable',
    canonicalGroupedId: 'l-s1-2-apicoposterior',
    note: 'The atlas keeps the common grouped S1+2 representation while allowing future source-specific separation into distinct S1 and S2 nodes.',
    reviewStatus: 'pending',
  },
  {
    structureId: 'left-s7-and-s8-separable',
    canonicalGroupedId: 'l-s7-8-anteromedial-basal',
    note: 'The atlas keeps a grouped S7+8 representation while allowing future source-specific separation when a reviewed model encodes the segments independently.',
    reviewStatus: 'pending',
  },
] as const

export function respiratoryTerminalSegmentIds(): string[] {
  const outbound = new Set(RESPIRATORY_ATLAS_EDGES.filter((edge) => edge.relation === 'airwayTo').map((edge) => edge.from))
  return RESPIRATORY_ATLAS_NODES
    .filter((node) => /^r-s\d|^l-s\d/.test(node.id) && !outbound.has(node.id))
    .map((node) => node.id)
    .sort()
}
