import type { AnatomyLaterality, AnatomyRelation, AnatomyStructure, AnatomySystemId } from './types'

type Options = {
  system?: AnatomySystemId
  regions?: AnatomyStructure['regions']
  laterality?: AnatomyLaterality
  synonyms?: readonly string[]
  tags?: readonly string[]
  assetGroupId?: string
}

const c = (id: string, label: string, parentId: string, options: Options = {}): AnatomyStructure => ({
  id,
  label,
  parentId,
  system: options.system ?? 'cardiovascular',
  regions: options.regions ?? ['thorax'],
  laterality: options.laterality ?? 'midline',
  synonyms: options.synonyms ?? [],
  tags: options.tags ?? [],
  assetGroupId: options.assetGroupId ?? 'cardiovascular-core',
  reviewStatus: 'reference',
})

const artery = (id: string, label: string, parentId: string, options: Options = {}) => c(id, label, parentId, {
  ...options,
  system: 'arterial',
  assetGroupId: options.assetGroupId ?? 'vascular-core',
  tags: ['artery', ...(options.tags ?? [])],
})

const vein = (id: string, label: string, parentId: string, options: Options = {}) => c(id, label, parentId, {
  ...options,
  system: 'venous',
  assetGroupId: options.assetGroupId ?? 'vascular-core',
  tags: ['vein', ...(options.tags ?? [])],
})

const bilateral = (
  stem: string,
  label: string,
  parentId: string,
  factory: typeof artery | typeof vein,
  options: Omit<Options, 'laterality'> = {},
): readonly AnatomyStructure[] => [
  factory(`right-${stem}`, `Right ${label}`, parentId, { ...options, laterality: 'right' }),
  factory(`left-${stem}`, `Left ${label}`, parentId, { ...options, laterality: 'left' }),
]

export const CARDIOVASCULAR_DEEP_STRUCTURES: readonly AnatomyStructure[] = [
  c('right-atrium', 'Right atrium', 'heart', { laterality: 'right', tags: ['cardiac-chamber'] }),
  c('left-atrium', 'Left atrium', 'heart', { laterality: 'left', tags: ['cardiac-chamber'] }),
  c('right-ventricle', 'Right ventricle', 'heart', { laterality: 'right', tags: ['cardiac-chamber'] }),
  c('left-ventricle', 'Left ventricle', 'heart', { laterality: 'left', tags: ['cardiac-chamber'] }),
  c('interatrial-septum', 'Interatrial septum', 'heart', { tags: ['cardiac-septum'] }),
  c('interventricular-septum', 'Interventricular septum', 'heart', { tags: ['cardiac-septum'] }),
  c('tricuspid-valve', 'Tricuspid valve', 'heart', { tags: ['cardiac-valve'], synonyms: ['right atrioventricular valve'] }),
  c('pulmonary-valve', 'Pulmonary valve', 'heart', { tags: ['cardiac-valve'], synonyms: ['pulmonic valve'] }),
  c('mitral-valve', 'Mitral valve', 'heart', { tags: ['cardiac-valve'], synonyms: ['bicuspid valve', 'left atrioventricular valve'] }),
  c('aortic-valve', 'Aortic valve', 'heart', { tags: ['cardiac-valve'] }),
  c('left-ventricular-outflow-tract', 'Left ventricular outflow tract', 'left-ventricle', { tags: ['cardiac-outflow'], synonyms: ['LVOT'] }),
  c('right-ventricular-outflow-tract', 'Right ventricular outflow tract', 'right-ventricle', { tags: ['cardiac-outflow'], synonyms: ['RVOT'] }),

  artery('left-main-coronary-artery', 'Left main coronary artery', 'heart', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core', synonyms: ['left main coronary', 'LMCA'] }),
  artery('left-anterior-descending-artery', 'Left anterior descending artery', 'left-main-coronary-artery', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core', synonyms: ['anterior interventricular artery', 'LAD'] }),
  artery('left-circumflex-artery', 'Left circumflex artery', 'left-main-coronary-artery', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core', synonyms: ['circumflex coronary artery', 'LCx'] }),
  artery('right-coronary-artery', 'Right coronary artery', 'heart', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core', synonyms: ['RCA'] }),
  artery('posterior-descending-artery', 'Posterior descending artery', 'right-coronary-artery', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core', synonyms: ['posterior interventricular artery', 'PDA'] }),
  artery('acute-marginal-artery', 'Acute marginal artery', 'right-coronary-artery', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core' }),
  artery('obtuse-marginal-artery', 'Obtuse marginal artery', 'left-circumflex-artery', { regions: ['thorax'], tags: ['coronary'], assetGroupId: 'cardiovascular-core' }),

  artery('brachiocephalic-trunk', 'Brachiocephalic trunk', 'aortic-arch', { regions: ['thorax','neck'], synonyms: ['innominate artery'] }),
  ...bilateral('internal-carotid-artery', 'internal carotid artery', 'aortic-arch', artery, { regions: ['neck','head'], tags: ['cerebral-circulation'] }),
  ...bilateral('external-carotid-artery', 'external carotid artery', 'aortic-arch', artery, { regions: ['neck','head'] }),
  ...bilateral('vertebral-artery', 'vertebral artery', 'aortic-arch', artery, { regions: ['neck','head'], tags: ['cerebral-circulation'] }),
  artery('basilar-artery', 'Basilar artery', 'brain', { regions: ['head'], tags: ['cerebral-circulation', 'circle-of-willis'], synonyms: ['basilar trunk'] }),
  ...bilateral('anterior-cerebral-artery', 'anterior cerebral artery', 'brain', artery, { regions: ['head'], tags: ['cerebral-circulation', 'circle-of-willis'], synonyms: ['ACA'] }),
  ...bilateral('middle-cerebral-artery', 'middle cerebral artery', 'brain', artery, { regions: ['head'], tags: ['cerebral-circulation'], synonyms: ['MCA'] }),
  ...bilateral('posterior-cerebral-artery', 'posterior cerebral artery', 'brain', artery, { regions: ['head'], tags: ['cerebral-circulation', 'circle-of-willis'], synonyms: ['PCA'] }),
  artery('anterior-communicating-artery', 'Anterior communicating artery', 'brain', { regions: ['head'], tags: ['cerebral-circulation', 'circle-of-willis'], synonyms: ['ACom'] }),
  ...bilateral('posterior-communicating-artery', 'posterior communicating artery', 'brain', artery, { regions: ['head'], tags: ['cerebral-circulation', 'circle-of-willis'], synonyms: ['PCom'] }),

  ...bilateral('popliteal-artery', 'popliteal artery', 'body', artery, { regions: ['lower-limb'], tags: ['lower-limb-arterial'] }),
  ...bilateral('anterior-tibial-artery', 'anterior tibial artery', 'body', artery, { regions: ['lower-limb'], tags: ['lower-limb-arterial'] }),
  ...bilateral('posterior-tibial-artery', 'posterior tibial artery', 'body', artery, { regions: ['lower-limb'], tags: ['lower-limb-arterial'] }),
  ...bilateral('fibular-artery', 'fibular artery', 'body', artery, { regions: ['lower-limb'], tags: ['lower-limb-arterial'], synonyms: ['peroneal artery'] }),
  ...bilateral('dorsalis-pedis-artery', 'dorsalis pedis artery', 'body', artery, { regions: ['lower-limb'], tags: ['lower-limb-arterial'] }),

  ...bilateral('common-femoral-vein', 'common femoral vein', 'inferior-vena-cava', vein, { regions: ['pelvis-perineum','lower-limb'], tags: ['deep-vein', 'dvt-relevant'] }),
  ...bilateral('deep-femoral-vein', 'deep femoral vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['deep-vein', 'dvt-relevant'], synonyms: ['profunda femoris vein'] }),
  ...bilateral('popliteal-vein', 'popliteal vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['deep-vein', 'dvt-relevant'] }),
  ...bilateral('anterior-tibial-vein', 'anterior tibial vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['deep-vein', 'dvt-relevant'] }),
  ...bilateral('posterior-tibial-vein', 'posterior tibial vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['deep-vein', 'dvt-relevant'] }),
  ...bilateral('fibular-vein', 'fibular vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['deep-vein', 'dvt-relevant'], synonyms: ['peroneal vein'] }),
  ...bilateral('great-saphenous-vein', 'great saphenous vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['superficial-vein'] }),
  ...bilateral('small-saphenous-vein', 'small saphenous vein', 'inferior-vena-cava', vein, { regions: ['lower-limb'], tags: ['superficial-vein'] }),
]

const branch = (from: string, to: string): AnatomyRelation => ({ from, to, type: 'branches-to' })
const drains = (from: string, to: string): AnatomyRelation => ({ from, to, type: 'drains-to' })

export const CARDIOVASCULAR_DEEP_RELATIONS: readonly AnatomyRelation[] = [
  { from: 'right-atrium', to: 'tricuspid-valve', type: 'communicates-with' },
  { from: 'tricuspid-valve', to: 'right-ventricle', type: 'communicates-with' },
  { from: 'right-ventricle', to: 'pulmonary-valve', type: 'communicates-with' },
  { from: 'pulmonary-valve', to: 'pulmonary-artery', type: 'communicates-with' },
  { from: 'pulmonary-veins', to: 'left-atrium', type: 'drains-to' },
  { from: 'left-atrium', to: 'mitral-valve', type: 'communicates-with' },
  { from: 'mitral-valve', to: 'left-ventricle', type: 'communicates-with' },
  { from: 'left-ventricle', to: 'aortic-valve', type: 'communicates-with' },
  { from: 'aortic-valve', to: 'ascending-aorta', type: 'communicates-with' },

  branch('ascending-aorta', 'left-main-coronary-artery'),
  branch('ascending-aorta', 'right-coronary-artery'),
  branch('left-main-coronary-artery', 'left-anterior-descending-artery'),
  branch('left-main-coronary-artery', 'left-circumflex-artery'),
  branch('left-circumflex-artery', 'obtuse-marginal-artery'),
  branch('right-coronary-artery', 'acute-marginal-artery'),
  branch('right-coronary-artery', 'posterior-descending-artery'),

  branch('aortic-arch', 'brachiocephalic-trunk'),
  branch('aortic-arch', 'left-common-carotid'),
  branch('aortic-arch', 'left-subclavian-artery'),
  branch('right-common-carotid', 'right-internal-carotid-artery'),
  branch('left-common-carotid', 'left-internal-carotid-artery'),
  branch('right-common-carotid', 'right-external-carotid-artery'),
  branch('left-common-carotid', 'left-external-carotid-artery'),
  branch('right-subclavian-artery', 'right-vertebral-artery'),
  branch('left-subclavian-artery', 'left-vertebral-artery'),
  branch('right-vertebral-artery', 'basilar-artery'),
  branch('left-vertebral-artery', 'basilar-artery'),
  branch('right-internal-carotid-artery', 'right-anterior-cerebral-artery'),
  branch('left-internal-carotid-artery', 'left-anterior-cerebral-artery'),
  branch('right-internal-carotid-artery', 'right-middle-cerebral-artery'),
  branch('left-internal-carotid-artery', 'left-middle-cerebral-artery'),
  branch('basilar-artery', 'right-posterior-cerebral-artery'),
  branch('basilar-artery', 'left-posterior-cerebral-artery'),
  { from: 'right-anterior-cerebral-artery', to: 'anterior-communicating-artery', type: 'communicates-with' },
  { from: 'left-anterior-cerebral-artery', to: 'anterior-communicating-artery', type: 'communicates-with' },
  { from: 'right-internal-carotid-artery', to: 'right-posterior-communicating-artery', type: 'branches-to' },
  { from: 'left-internal-carotid-artery', to: 'left-posterior-communicating-artery', type: 'branches-to' },
  { from: 'right-posterior-communicating-artery', to: 'right-posterior-cerebral-artery', type: 'communicates-with' },
  { from: 'left-posterior-communicating-artery', to: 'left-posterior-cerebral-artery', type: 'communicates-with' },

  branch('right-femoral-artery', 'right-popliteal-artery'),
  branch('left-femoral-artery', 'left-popliteal-artery'),
  branch('right-popliteal-artery', 'right-anterior-tibial-artery'),
  branch('right-popliteal-artery', 'right-posterior-tibial-artery'),
  branch('left-popliteal-artery', 'left-anterior-tibial-artery'),
  branch('left-popliteal-artery', 'left-posterior-tibial-artery'),
  branch('right-posterior-tibial-artery', 'right-fibular-artery'),
  branch('left-posterior-tibial-artery', 'left-fibular-artery'),
  branch('right-anterior-tibial-artery', 'right-dorsalis-pedis-artery'),
  branch('left-anterior-tibial-artery', 'left-dorsalis-pedis-artery'),

  drains('right-anterior-tibial-vein', 'right-popliteal-vein'),
  drains('right-posterior-tibial-vein', 'right-popliteal-vein'),
  drains('right-fibular-vein', 'right-popliteal-vein'),
  drains('left-anterior-tibial-vein', 'left-popliteal-vein'),
  drains('left-posterior-tibial-vein', 'left-popliteal-vein'),
  drains('left-fibular-vein', 'left-popliteal-vein'),
  drains('right-popliteal-vein', 'right-common-femoral-vein'),
  drains('left-popliteal-vein', 'left-common-femoral-vein'),
  drains('right-deep-femoral-vein', 'right-common-femoral-vein'),
  drains('left-deep-femoral-vein', 'left-common-femoral-vein'),
  drains('right-great-saphenous-vein', 'right-common-femoral-vein'),
  drains('left-great-saphenous-vein', 'left-common-femoral-vein'),
  drains('right-small-saphenous-vein', 'right-popliteal-vein'),
  drains('left-small-saphenous-vein', 'left-popliteal-vein'),
  drains('right-common-femoral-vein', 'inferior-vena-cava'),
  drains('left-common-femoral-vein', 'inferior-vena-cava'),
]
