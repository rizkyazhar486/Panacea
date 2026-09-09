import type { AtlasNode, AtlasProvenance } from './atlasKernel'

const SOURCE_CANDIDATE: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/cardiovascular.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering source-node candidate mapping only; qualified cardiovascular anatomy review remains required.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-deep-cardiovascular-reference',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/deepCardiovascularAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Topology scaffold for educational navigation only; not patient-specific vascular anatomy.',
}

type Laterality = AtlasNode['laterality']
type Region = AtlasNode['regions'][number]

type CvOptions = {
  laterality?: Laterality
  regions?: readonly Region[]
  hints?: readonly string[]
  geometryStatus?: AtlasNode['geometryStatus']
  provenance?: AtlasProvenance
  priority?: number
  physiologyCapable?: boolean
  surgicalLandmark?: boolean
  synonyms?: readonly string[]
}

function cv(id: string, label: string, parentId: string, options: CvOptions = {}): AtlasNode {
  const geometryStatus = options.geometryStatus ?? 'partial'
  return {
    id,
    label,
    system: 'cardiovascular',
    regions: options.regions ?? ['thorax'],
    laterality: options.laterality ?? 'midline',
    scale: 'suborgan',
    parentId,
    synonyms: options.synonyms,
    source: {
      mode: 'specific-fallback',
      files: geometryStatus === 'reference-only' ? undefined : ['cardiovascular.glb'],
      nodeHints: options.hints ?? [label],
    },
    provenance: options.provenance ?? (geometryStatus === 'reference-only' ? REFERENCE_ONLY : SOURCE_CANDIDATE),
    geometryStatus,
    educationalPriority: options.priority ?? 0.9,
    physiologyCapable: options.physiologyCapable ?? true,
    surgicalLandmark: options.surgicalLandmark ?? false,
  }
}

function bilateral(
  stem: string,
  label: string,
  parentId: string,
  regions: readonly Region[],
  options: Omit<CvOptions, 'laterality' | 'regions' | 'hints'> & { rightHints?: readonly string[]; leftHints?: readonly string[] } = {},
): readonly AtlasNode[] {
  return [
    cv(`cv:right-${stem}`, `Right ${label}`, parentId, {
      ...options,
      laterality: 'right',
      regions,
      hints: options.rightHints ?? [`right ${label}`],
    }),
    cv(`cv:left-${stem}`, `Left ${label}`, parentId, {
      ...options,
      laterality: 'left',
      regions,
      hints: options.leftHints ?? [`left ${label}`],
    }),
  ]
}

const cardiacCore: readonly AtlasNode[] = [
  cv('cv:right-atrium', 'Right atrium', 'cv:heart', { laterality: 'right', hints: ['right atrium'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:right-ventricle', 'Right ventricle', 'cv:heart', { laterality: 'right', hints: ['right ventricle'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:left-atrium', 'Left atrium', 'cv:heart', { laterality: 'left', hints: ['left atrium'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:left-ventricle', 'Left ventricle', 'cv:heart', { laterality: 'left', hints: ['left ventricle'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:tricuspid-valve', 'Tricuspid valve', 'cv:heart', { hints: ['tricuspid valve', 'right atrioventricular valve'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:pulmonary-valve', 'Pulmonary valve', 'cv:heart', { hints: ['pulmonary valve', 'pulmonic valve'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:mitral-valve', 'Mitral valve', 'cv:heart', { hints: ['mitral valve', 'bicuspid valve'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:aortic-valve', 'Aortic valve', 'cv:heart', { hints: ['aortic valve'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:interatrial-septum', 'Interatrial septum', 'cv:heart', { hints: ['interatrial septum'], geometryStatus: 'reference-only', priority: 0.84 }),
  cv('cv:interventricular-septum', 'Interventricular septum', 'cv:heart', { hints: ['interventricular septum'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.9 }),
]

const aorticTree: readonly AtlasNode[] = [
  cv('cv:ascending-aorta', 'Ascending aorta', 'cv:aorta', { hints: ['ascending aorta'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:aortic-arch', 'Aortic arch', 'cv:aorta', { hints: ['aortic arch', 'arch of aorta'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:descending-thoracic-aorta', 'Descending thoracic aorta', 'cv:aorta', { regions: ['thorax'], hints: ['descending thoracic aorta', 'thoracic aorta'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:abdominal-aorta', 'Abdominal aorta', 'cv:aorta', { regions: ['abdomen', 'pelvis'], hints: ['abdominal aorta'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  cv('cv:brachiocephalic-trunk', 'Brachiocephalic trunk', 'cv:aortic-arch', { regions: ['thorax', 'neck'], hints: ['brachiocephalic trunk', 'brachiocephalic artery'], geometryStatus: 'partial', priority: 0.95 }),
  cv('cv:left-common-carotid', 'Left common carotid artery', 'cv:aortic-arch', { laterality: 'left', regions: ['thorax', 'neck'], hints: ['left common carotid artery'], geometryStatus: 'partial', priority: 0.95 }),
  cv('cv:left-subclavian', 'Left subclavian artery', 'cv:aortic-arch', { laterality: 'left', regions: ['thorax', 'neck', 'upper-limb'], hints: ['left subclavian artery'], geometryStatus: 'partial', priority: 0.93 }),
  cv('cv:right-common-carotid', 'Right common carotid artery', 'cv:brachiocephalic-trunk', { laterality: 'right', regions: ['neck'], hints: ['right common carotid artery'], geometryStatus: 'partial', priority: 0.95 }),
  cv('cv:right-subclavian', 'Right subclavian artery', 'cv:brachiocephalic-trunk', { laterality: 'right', regions: ['neck', 'upper-limb'], hints: ['right subclavian artery'], geometryStatus: 'partial', priority: 0.93 }),
]

const coronaryTree: readonly AtlasNode[] = [
  cv('cv:left-main-coronary', 'Left main coronary artery', 'cv:coronary', { laterality: 'left', hints: ['left coronary artery', 'left main coronary artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1, synonyms: ['LMCA'] }),
  cv('cv:lad', 'Left anterior descending artery', 'cv:left-main-coronary', { laterality: 'left', hints: ['anterior interventricular artery', 'left anterior descending artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1, synonyms: ['LAD'] }),
  cv('cv:lcx', 'Left circumflex artery', 'cv:left-main-coronary', { laterality: 'left', hints: ['circumflex branch of left coronary artery', 'left circumflex artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1, synonyms: ['LCx'] }),
  cv('cv:rca', 'Right coronary artery', 'cv:coronary', { laterality: 'right', hints: ['right coronary artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1, synonyms: ['RCA'] }),
  cv('cv:pda', 'Posterior descending artery', 'cv:coronary', { hints: ['posterior interventricular artery', 'posterior descending artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.95, synonyms: ['PDA'] }),
  cv('cv:obtuse-marginal', 'Obtuse marginal artery', 'cv:lcx', { laterality: 'left', hints: ['obtuse marginal artery', 'left marginal artery'], geometryStatus: 'reference-only', priority: 0.86 }),
  cv('cv:acute-marginal', 'Acute marginal artery', 'cv:rca', { laterality: 'right', hints: ['acute marginal artery', 'right marginal artery'], geometryStatus: 'reference-only', priority: 0.86 }),
]

const pulmonaryCirculation: readonly AtlasNode[] = [
  ...bilateral('pulmonary-artery', 'pulmonary artery', 'cv:pulmonary-trunk', ['thorax'], { geometryStatus: 'partial', priority: 0.98, surgicalLandmark: true }),
  cv('cv:pulmonary-veins', 'Pulmonary veins', 'system:cardiovascular', { laterality: 'paired', regions: ['thorax'], hints: ['pulmonary vein'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.96 }),
  ...bilateral('superior-pulmonary-vein', 'superior pulmonary vein', 'cv:pulmonary-veins', ['thorax'], { geometryStatus: 'partial', priority: 0.92 }),
  ...bilateral('inferior-pulmonary-vein', 'inferior pulmonary vein', 'cv:pulmonary-veins', ['thorax'], { geometryStatus: 'partial', priority: 0.92 }),
]

const cerebralInflows: readonly AtlasNode[] = [
  ...bilateral('internal-carotid', 'internal carotid artery', 'system:cardiovascular', ['neck', 'head'], { geometryStatus: 'partial', priority: 0.98, surgicalLandmark: true }),
  ...bilateral('external-carotid', 'external carotid artery', 'system:cardiovascular', ['neck', 'head'], { geometryStatus: 'partial', priority: 0.88 }),
  ...bilateral('vertebral-artery', 'vertebral artery', 'system:cardiovascular', ['neck', 'head'], { geometryStatus: 'partial', priority: 0.98, surgicalLandmark: true }),
  cv('cv:basilar-artery', 'Basilar artery', 'system:cardiovascular', { regions: ['head'], hints: ['basilar artery'], geometryStatus: 'partial', surgicalLandmark: true, priority: 1 }),
  ...bilateral('anterior-cerebral-artery', 'anterior cerebral artery', 'system:cardiovascular', ['head'], { geometryStatus: 'partial', priority: 1, surgicalLandmark: true }),
  ...bilateral('middle-cerebral-artery', 'middle cerebral artery', 'system:cardiovascular', ['head'], { geometryStatus: 'partial', priority: 1, surgicalLandmark: true }),
  ...bilateral('posterior-cerebral-artery', 'posterior cerebral artery', 'system:cardiovascular', ['head'], { geometryStatus: 'partial', priority: 1, surgicalLandmark: true }),
  cv('cv:anterior-communicating-artery', 'Anterior communicating artery', 'system:cardiovascular', { regions: ['head'], hints: ['anterior communicating artery'], geometryStatus: 'reference-only', surgicalLandmark: true, priority: 0.96, synonyms: ['ACom'] }),
  ...bilateral('posterior-communicating-artery', 'posterior communicating artery', 'system:cardiovascular', ['head'], { geometryStatus: 'reference-only', priority: 0.96, surgicalLandmark: true }),
]

const lowerLimbArteries: readonly AtlasNode[] = [
  ...bilateral('common-iliac-artery', 'common iliac artery', 'cv:abdominal-aorta', ['pelvis'], { geometryStatus: 'partial', priority: 0.94 }),
  ...bilateral('external-iliac-artery', 'external iliac artery', 'system:cardiovascular', ['pelvis', 'lower-limb'], { geometryStatus: 'partial', priority: 0.93 }),
  ...bilateral('femoral-artery', 'femoral artery', 'system:cardiovascular', ['lower-limb'], { geometryStatus: 'partial', priority: 0.96, surgicalLandmark: true }),
  ...bilateral('popliteal-artery', 'popliteal artery', 'system:cardiovascular', ['lower-limb'], { geometryStatus: 'partial', priority: 0.93 }),
  ...bilateral('anterior-tibial-artery', 'anterior tibial artery', 'system:cardiovascular', ['lower-limb'], { geometryStatus: 'partial', priority: 0.9 }),
  ...bilateral('posterior-tibial-artery', 'posterior tibial artery', 'system:cardiovascular', ['lower-limb'], { geometryStatus: 'partial', priority: 0.9, surgicalLandmark: true }),
  ...bilateral('fibular-artery', 'fibular artery', 'system:cardiovascular', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.82 }),
  ...bilateral('dorsalis-pedis-artery', 'dorsalis pedis artery', 'system:cardiovascular', ['foot'], { geometryStatus: 'reference-only', priority: 0.88, surgicalLandmark: true }),
]

const systemicVeins: readonly AtlasNode[] = [
  cv('cv:superior-vena-cava', 'Superior vena cava', 'system:cardiovascular', { regions: ['thorax'], hints: ['superior vena cava'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  cv('cv:inferior-vena-cava', 'Inferior vena cava', 'system:cardiovascular', { regions: ['thorax', 'abdomen', 'pelvis'], hints: ['inferior vena cava'], geometryStatus: 'partial', surgicalLandmark: true, priority: 0.98 }),
  ...bilateral('common-femoral-vein', 'common femoral vein', 'cv:inferior-vena-cava', ['pelvis', 'lower-limb'], { geometryStatus: 'partial', priority: 0.95 }),
  ...bilateral('deep-femoral-vein', 'deep femoral vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.86 }),
  ...bilateral('popliteal-vein', 'popliteal vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'partial', priority: 0.93 }),
  ...bilateral('anterior-tibial-vein', 'anterior tibial vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.82 }),
  ...bilateral('posterior-tibial-vein', 'posterior tibial vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.82 }),
  ...bilateral('fibular-vein', 'fibular vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.8 }),
  ...bilateral('great-saphenous-vein', 'great saphenous vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'partial', priority: 0.88 }),
  ...bilateral('small-saphenous-vein', 'small saphenous vein', 'cv:inferior-vena-cava', ['lower-limb'], { geometryStatus: 'reference-only', priority: 0.8 }),
]

export const DEEP_CARDIOVASCULAR_ATLAS_NODES: readonly AtlasNode[] = [
  ...cardiacCore,
  ...aorticTree,
  ...coronaryTree,
  ...pulmonaryCirculation,
  ...cerebralInflows,
  ...lowerLimbArteries,
  ...systemicVeins,
]

export const DEEP_CARDIOVASCULAR_NODE_IDS = DEEP_CARDIOVASCULAR_ATLAS_NODES.map((node) => node.id)
