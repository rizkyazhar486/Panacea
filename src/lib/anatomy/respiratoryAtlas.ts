import type { AnatomyLaterality, AnatomyRelation, AnatomyStructure } from './types'

type RespiratoryOptions = Partial<Pick<AnatomyStructure, 'synonyms' | 'laterality' | 'tags' | 'regions'>>
const r = (id: string, label: string, parentId: string, options: RespiratoryOptions = {}): AnatomyStructure => ({
  id, label, parentId, system: 'respiratory', regions: options.regions ?? ['thorax'], synonyms: options.synonyms ?? [],
  laterality: options.laterality ?? 'midline', tags: options.tags ?? [], assetGroupId: 'respiratory-deep-atlas', reviewStatus: 'reference',
})

const segmentSpecs: readonly {
  code: string
  label: string
  side: Exclude<AnatomyLaterality, 'midline' | 'bilateral' | 'none'>
  bronchusParent: string
  segmentParent: string
  bronchusAlias: string
}[] = [
  { code: 'rul-apical', label: 'Right upper lobe apical', side: 'right', bronchusParent: 'right-upper-lobar-bronchus', segmentParent: 'right-upper-lobe', bronchusAlias: 'right B1 bronchus' },
  { code: 'rul-posterior', label: 'Right upper lobe posterior', side: 'right', bronchusParent: 'right-upper-lobar-bronchus', segmentParent: 'right-upper-lobe', bronchusAlias: 'right B2 bronchus' },
  { code: 'rul-anterior', label: 'Right upper lobe anterior', side: 'right', bronchusParent: 'right-upper-lobar-bronchus', segmentParent: 'right-upper-lobe', bronchusAlias: 'right B3 bronchus' },
  { code: 'rml-lateral', label: 'Right middle lobe lateral', side: 'right', bronchusParent: 'right-middle-lobar-bronchus', segmentParent: 'right-middle-lobe', bronchusAlias: 'right B4 bronchus' },
  { code: 'rml-medial', label: 'Right middle lobe medial', side: 'right', bronchusParent: 'right-middle-lobar-bronchus', segmentParent: 'right-middle-lobe', bronchusAlias: 'right B5 bronchus' },
  { code: 'rll-superior', label: 'Right lower lobe superior', side: 'right', bronchusParent: 'right-lower-lobar-bronchus', segmentParent: 'right-lower-lobe', bronchusAlias: 'right B6 bronchus' },
  { code: 'rll-medial-basal', label: 'Right lower lobe medial basal', side: 'right', bronchusParent: 'right-lower-lobar-bronchus', segmentParent: 'right-lower-lobe', bronchusAlias: 'right B7 bronchus' },
  { code: 'rll-anterior-basal', label: 'Right lower lobe anterior basal', side: 'right', bronchusParent: 'right-lower-lobar-bronchus', segmentParent: 'right-lower-lobe', bronchusAlias: 'right B8 bronchus' },
  { code: 'rll-lateral-basal', label: 'Right lower lobe lateral basal', side: 'right', bronchusParent: 'right-lower-lobar-bronchus', segmentParent: 'right-lower-lobe', bronchusAlias: 'right B9 bronchus' },
  { code: 'rll-posterior-basal', label: 'Right lower lobe posterior basal', side: 'right', bronchusParent: 'right-lower-lobar-bronchus', segmentParent: 'right-lower-lobe', bronchusAlias: 'right B10 bronchus' },
  { code: 'lul-apicoposterior', label: 'Left upper lobe apicoposterior', side: 'left', bronchusParent: 'left-upper-lobar-bronchus', segmentParent: 'left-upper-lobe', bronchusAlias: 'left B1+2 bronchus' },
  { code: 'lul-anterior', label: 'Left upper lobe anterior', side: 'left', bronchusParent: 'left-upper-lobar-bronchus', segmentParent: 'left-upper-lobe', bronchusAlias: 'left B3 bronchus' },
  { code: 'lul-superior-lingular', label: 'Left upper lobe superior lingular', side: 'left', bronchusParent: 'left-upper-lobar-bronchus', segmentParent: 'left-upper-lobe', bronchusAlias: 'left B4 bronchus' },
  { code: 'lul-inferior-lingular', label: 'Left upper lobe inferior lingular', side: 'left', bronchusParent: 'left-upper-lobar-bronchus', segmentParent: 'left-upper-lobe', bronchusAlias: 'left B5 bronchus' },
  { code: 'lll-superior', label: 'Left lower lobe superior', side: 'left', bronchusParent: 'left-lower-lobar-bronchus', segmentParent: 'left-lower-lobe', bronchusAlias: 'left B6 bronchus' },
  { code: 'lll-anteromedial-basal', label: 'Left lower lobe anteromedial basal', side: 'left', bronchusParent: 'left-lower-lobar-bronchus', segmentParent: 'left-lower-lobe', bronchusAlias: 'left B7+8 bronchus' },
  { code: 'lll-lateral-basal', label: 'Left lower lobe lateral basal', side: 'left', bronchusParent: 'left-lower-lobar-bronchus', segmentParent: 'left-lower-lobe', bronchusAlias: 'left B9 bronchus' },
  { code: 'lll-posterior-basal', label: 'Left lower lobe posterior basal', side: 'left', bronchusParent: 'left-lower-lobar-bronchus', segmentParent: 'left-lower-lobe', bronchusAlias: 'left B10 bronchus' },
]

const segmentalBronchi = segmentSpecs.map((spec) => r(`${spec.code}-segmental-bronchus`, `${spec.label} segmental bronchus`, spec.bronchusParent, {
  laterality: spec.side, synonyms: [spec.bronchusAlias], tags: ['airway', 'segmental-bronchus'],
}))
const bronchopulmonarySegments = segmentSpecs.map((spec) => r(`${spec.code}-segment`, `${spec.label} segment`, spec.segmentParent, {
  laterality: spec.side, synonyms: [`${spec.code.toUpperCase()} segment`], tags: ['bronchopulmonary-segment'],
}))

export const RESPIRATORY_STRUCTURES: readonly AnatomyStructure[] = [
  r('respiratory-system', 'Respiratory system', 'body', { regions: ['head','neck','thorax'], synonyms: ['respiratory tract'], tags: ['system-root'] }),
  r('nasal-cavity', 'Nasal cavity', 'respiratory-system', { regions: ['head'], synonyms: ['nasal passages'], tags: ['upper-airway'] }),
  r('nasopharynx', 'Nasopharynx', 'respiratory-system', { regions: ['head'], tags: ['upper-airway'] }),
  r('oropharynx', 'Oropharynx', 'respiratory-system', { regions: ['head','neck'], tags: ['upper-airway'] }),
  r('laryngopharynx', 'Laryngopharynx', 'respiratory-system', { regions: ['neck'], synonyms: ['hypopharynx'], tags: ['upper-airway'] }),
  r('larynx', 'Larynx', 'respiratory-system', { regions: ['neck'], synonyms: ['voice box'], tags: ['upper-airway'] }),
  r('epiglottis', 'Epiglottis', 'larynx', { regions: ['neck'], tags: ['upper-airway'] }),
  r('trachea', 'Trachea', 'larynx', { regions: ['neck','thorax'], synonyms: ['windpipe'], tags: ['airway'] }),
  r('carina', 'Carina of trachea', 'trachea', { synonyms: ['tracheal carina'], tags: ['airway','bifurcation'] }),
  r('right-main-bronchus', 'Right main bronchus', 'carina', { laterality: 'right', synonyms: ['right mainstem bronchus'], tags: ['airway'] }),
  r('left-main-bronchus', 'Left main bronchus', 'carina', { laterality: 'left', synonyms: ['left mainstem bronchus'], tags: ['airway'] }),
  r('right-lung', 'Right lung', 'respiratory-system', { laterality: 'right', synonyms: ['lung'], tags: ['lung'] }),
  r('left-lung', 'Left lung', 'respiratory-system', { laterality: 'left', synonyms: ['lung'], tags: ['lung'] }),
  r('right-upper-lobe', 'Right upper lobe', 'right-lung', { laterality: 'right', synonyms: ['right superior lobe'], tags: ['lobe'] }),
  r('right-middle-lobe', 'Right middle lobe', 'right-lung', { laterality: 'right', tags: ['lobe'] }),
  r('right-lower-lobe', 'Right lower lobe', 'right-lung', { laterality: 'right', synonyms: ['right inferior lobe'], tags: ['lobe'] }),
  r('left-upper-lobe', 'Left upper lobe', 'left-lung', { laterality: 'left', synonyms: ['left superior lobe'], tags: ['lobe'] }),
  r('left-lower-lobe', 'Left lower lobe', 'left-lung', { laterality: 'left', synonyms: ['left inferior lobe'], tags: ['lobe'] }),
  r('right-upper-lobar-bronchus', 'Right upper lobar bronchus', 'right-main-bronchus', { laterality: 'right', tags: ['airway','lobar-bronchus'] }),
  r('right-middle-lobar-bronchus', 'Right middle lobar bronchus', 'right-main-bronchus', { laterality: 'right', tags: ['airway','lobar-bronchus'] }),
  r('right-lower-lobar-bronchus', 'Right lower lobar bronchus', 'right-main-bronchus', { laterality: 'right', tags: ['airway','lobar-bronchus'] }),
  r('left-upper-lobar-bronchus', 'Left upper lobar bronchus', 'left-main-bronchus', { laterality: 'left', tags: ['airway','lobar-bronchus'] }),
  r('left-lower-lobar-bronchus', 'Left lower lobar bronchus', 'left-main-bronchus', { laterality: 'left', tags: ['airway','lobar-bronchus'] }),
  ...segmentalBronchi,
  ...bronchopulmonarySegments,
  r('terminal-bronchiole', 'Terminal bronchiole', 'respiratory-system', { tags: ['distal-airway','microanatomy'] }),
  r('respiratory-bronchiole', 'Respiratory bronchiole', 'terminal-bronchiole', { tags: ['distal-airway','microanatomy'] }),
  r('alveolar-duct', 'Alveolar duct', 'respiratory-bronchiole', { tags: ['gas-exchange-zone','microanatomy'] }),
  r('alveolar-sac', 'Alveolar sac', 'alveolar-duct', { tags: ['gas-exchange-zone','microanatomy'] }),
  r('alveolus', 'Pulmonary alveolus', 'alveolar-sac', { synonyms: ['alveolus'], tags: ['gas-exchange-zone','microanatomy'] }),
  r('right-horizontal-fissure', 'Right horizontal fissure', 'right-lung', { laterality: 'right', tags: ['fissure'] }),
  r('right-oblique-fissure', 'Right oblique fissure', 'right-lung', { laterality: 'right', tags: ['fissure'] }),
  r('left-oblique-fissure', 'Left oblique fissure', 'left-lung', { laterality: 'left', tags: ['fissure'] }),
  r('pleura', 'Pleura', 'respiratory-system', { tags: ['pleura'] }),
  r('visceral-pleura', 'Visceral pleura', 'pleura', { synonyms: ['pulmonary pleura'], tags: ['pleura'] }),
  r('parietal-pleura', 'Parietal pleura', 'pleura', { tags: ['pleura'] }),
  r('pleural-cavity', 'Pleural cavity', 'pleura', { tags: ['pleura','space'] }),
  r('diaphragm', 'Diaphragm', 'respiratory-system', { synonyms: ['thoracic diaphragm'], tags: ['respiratory-muscle'] }),
]

const airwayBranches: readonly [string,string][] = [
  ['trachea','carina'], ['carina','right-main-bronchus'], ['carina','left-main-bronchus'],
  ['right-main-bronchus','right-upper-lobar-bronchus'], ['right-main-bronchus','right-middle-lobar-bronchus'], ['right-main-bronchus','right-lower-lobar-bronchus'],
  ['left-main-bronchus','left-upper-lobar-bronchus'], ['left-main-bronchus','left-lower-lobar-bronchus'],
]

export const RESPIRATORY_RELATIONS: readonly AnatomyRelation[] = [
  { from: 'nasal-cavity', to: 'nasopharynx', type: 'communicates-with' },
  { from: 'nasopharynx', to: 'oropharynx', type: 'communicates-with' },
  { from: 'oropharynx', to: 'laryngopharynx', type: 'communicates-with' },
  { from: 'laryngopharynx', to: 'larynx', type: 'communicates-with' },
  ...airwayBranches.map(([from,to]) => ({ from, to, type: 'branches-to' as const })),
  ...segmentSpecs.map((spec) => ({ from: `${spec.code}-segmental-bronchus`, to: `${spec.code}-segment`, type: 'courses-through' as const })),
  { from: 'right-upper-lobar-bronchus', to: 'right-upper-lobe', type: 'courses-through' },
  { from: 'right-middle-lobar-bronchus', to: 'right-middle-lobe', type: 'courses-through' },
  { from: 'right-lower-lobar-bronchus', to: 'right-lower-lobe', type: 'courses-through' },
  { from: 'left-upper-lobar-bronchus', to: 'left-upper-lobe', type: 'courses-through' },
  { from: 'left-lower-lobar-bronchus', to: 'left-lower-lobe', type: 'courses-through' },
  { from: 'visceral-pleura', to: 'right-lung', type: 'attached-to' },
  { from: 'visceral-pleura', to: 'left-lung', type: 'attached-to' },
  { from: 'parietal-pleura', to: 'pleural-cavity', type: 'adjacent-to', bidirectional: true },
  { from: 'visceral-pleura', to: 'pleural-cavity', type: 'adjacent-to', bidirectional: true },
  { from: 'diaphragm', to: 'right-lung', type: 'adjacent-to', bidirectional: true },
  { from: 'diaphragm', to: 'left-lung', type: 'adjacent-to', bidirectional: true },
]
