import type { AtlasNode, AtlasProvenance } from './atlasKernel'

const SOURCE_CANDIDATE: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/nervous.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering source-node candidate mapping only; qualified neuroanatomy review remains required.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-neurovascular-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/deepNeurovascularAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational vascular-territory and deep-neuroanatomy scaffold; never patient lesion localization.',
}

type Laterality = AtlasNode['laterality']

type NeuroOptions = {
  laterality?: Laterality
  parentId?: string
  hints?: readonly string[]
  geometryStatus?: AtlasNode['geometryStatus']
  provenance?: AtlasProvenance
  priority?: number
  surgicalLandmark?: boolean
  physiologyCapable?: boolean
  synonyms?: readonly string[]
}

function neuro(id: string, label: string, options: NeuroOptions = {}): AtlasNode {
  const geometryStatus = options.geometryStatus ?? 'partial'
  return {
    id,
    label,
    system: 'nervous',
    regions: ['head'],
    laterality: options.laterality ?? 'midline',
    scale: geometryStatus === 'reference-only' && id.includes('territory:') ? 'tissue' : 'suborgan',
    parentId: options.parentId ?? 'neuro:brain',
    synonyms: options.synonyms,
    source: {
      mode: 'specific-fallback',
      files: geometryStatus === 'reference-only' ? undefined : ['nervous.glb'],
      nodeHints: options.hints ?? [label],
    },
    provenance: options.provenance ?? (geometryStatus === 'reference-only' ? REFERENCE_ONLY : SOURCE_CANDIDATE),
    geometryStatus,
    educationalPriority: options.priority ?? 0.88,
    physiologyCapable: options.physiologyCapable ?? true,
    surgicalLandmark: options.surgicalLandmark ?? false,
  }
}

function bilateral(
  stem: string,
  label: string,
  parentId = 'neuro:brain',
  options: Omit<NeuroOptions, 'laterality' | 'parentId' | 'hints'> & { rightHints?: readonly string[]; leftHints?: readonly string[] } = {},
): readonly AtlasNode[] {
  return [
    neuro(`neuro:right-${stem}`, `Right ${label}`, {
      ...options,
      laterality: 'right',
      parentId,
      hints: options.rightHints ?? [`right ${label}`, label],
    }),
    neuro(`neuro:left-${stem}`, `Left ${label}`, {
      ...options,
      laterality: 'left',
      parentId,
      hints: options.leftHints ?? [`left ${label}`, label],
    }),
  ]
}

const corticalAndDeepGray: readonly AtlasNode[] = [
  ...bilateral('frontal-lobe', 'frontal lobe', 'neuro:brain', { geometryStatus: 'partial', priority: 0.94 }),
  ...bilateral('parietal-lobe', 'parietal lobe', 'neuro:brain', { geometryStatus: 'partial', priority: 0.92 }),
  ...bilateral('temporal-lobe', 'temporal lobe', 'neuro:brain', { geometryStatus: 'partial', priority: 0.92 }),
  ...bilateral('occipital-lobe', 'occipital lobe', 'neuro:brain', { geometryStatus: 'partial', priority: 0.9 }),
  ...bilateral('insula', 'insula', 'neuro:brain', { geometryStatus: 'reference-only', priority: 0.88 }),
  ...bilateral('thalamus', 'thalamus', 'neuro:brain', { geometryStatus: 'partial', priority: 0.93 }),
  ...bilateral('caudate-nucleus', 'caudate nucleus', 'neuro:brain', { geometryStatus: 'partial', priority: 0.88 }),
  ...bilateral('putamen', 'putamen', 'neuro:brain', { geometryStatus: 'partial', priority: 0.88 }),
  ...bilateral('globus-pallidus', 'globus pallidus', 'neuro:brain', { geometryStatus: 'partial', priority: 0.86 }),
  ...bilateral('internal-capsule', 'internal capsule', 'neuro:brain', { geometryStatus: 'reference-only', priority: 0.92, surgicalLandmark: true }),
  neuro('neuro:corpus-callosum', 'Corpus callosum', { hints: ['corpus callosum'], geometryStatus: 'partial', priority: 0.88 }),
]

const brainstemAndCerebellum: readonly AtlasNode[] = [
  neuro('neuro:midbrain', 'Midbrain', { parentId: 'neuro:brainstem', hints: ['midbrain'], geometryStatus: 'partial', priority: 0.94, surgicalLandmark: true }),
  neuro('neuro:pons', 'Pons', { parentId: 'neuro:brainstem', hints: ['pons'], geometryStatus: 'partial', priority: 0.96, surgicalLandmark: true }),
  neuro('neuro:medulla-oblongata', 'Medulla oblongata', { parentId: 'neuro:brainstem', hints: ['medulla oblongata', 'medulla'], geometryStatus: 'partial', priority: 0.96, surgicalLandmark: true }),
  ...bilateral('cerebellar-hemisphere', 'cerebellar hemisphere', 'neuro:cerebellum', { geometryStatus: 'partial', priority: 0.9 }),
]

const ventricularSystem: readonly AtlasNode[] = [
  ...bilateral('lateral-ventricle', 'lateral ventricle', 'neuro:brain', { geometryStatus: 'partial', priority: 0.86, surgicalLandmark: true }),
  neuro('neuro:third-ventricle', 'Third ventricle', { hints: ['third ventricle'], geometryStatus: 'partial', priority: 0.84, surgicalLandmark: true }),
  neuro('neuro:cerebral-aqueduct', 'Cerebral aqueduct', { parentId: 'neuro:midbrain', hints: ['cerebral aqueduct', 'aqueduct of sylvius'], geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  neuro('neuro:fourth-ventricle', 'Fourth ventricle', { parentId: 'neuro:brainstem', hints: ['fourth ventricle'], geometryStatus: 'partial', priority: 0.84, surgicalLandmark: true }),
]

function territory(id: string, label: string, laterality: 'left' | 'right', parentId: string): AtlasNode {
  return neuro(`neuro:territory:${laterality}-${id}`, `${laterality === 'right' ? 'Right' : 'Left'} ${label}`, {
    laterality,
    parentId,
    hints: [label],
    geometryStatus: 'reference-only',
    priority: 0.84,
    physiologyCapable: false,
  })
}

const vascularTerritoryOverlays: readonly AtlasNode[] = [
  territory('aca-medial-frontal', 'ACA medial frontal territory', 'right', 'neuro:right-frontal-lobe'),
  territory('aca-medial-frontal', 'ACA medial frontal territory', 'left', 'neuro:left-frontal-lobe'),
  territory('aca-medial-parietal', 'ACA medial parietal territory', 'right', 'neuro:right-parietal-lobe'),
  territory('aca-medial-parietal', 'ACA medial parietal territory', 'left', 'neuro:left-parietal-lobe'),
  territory('mca-lateral-frontal', 'MCA lateral frontal territory', 'right', 'neuro:right-frontal-lobe'),
  territory('mca-lateral-frontal', 'MCA lateral frontal territory', 'left', 'neuro:left-frontal-lobe'),
  territory('mca-lateral-parietal', 'MCA lateral parietal territory', 'right', 'neuro:right-parietal-lobe'),
  territory('mca-lateral-parietal', 'MCA lateral parietal territory', 'left', 'neuro:left-parietal-lobe'),
  territory('mca-lateral-temporal', 'MCA lateral temporal territory', 'right', 'neuro:right-temporal-lobe'),
  territory('mca-lateral-temporal', 'MCA lateral temporal territory', 'left', 'neuro:left-temporal-lobe'),
  territory('pca-occipital', 'PCA occipital territory', 'right', 'neuro:right-occipital-lobe'),
  territory('pca-occipital', 'PCA occipital territory', 'left', 'neuro:left-occipital-lobe'),
  territory('pca-medial-temporal', 'PCA medial temporal territory', 'right', 'neuro:right-temporal-lobe'),
  territory('pca-medial-temporal', 'PCA medial temporal territory', 'left', 'neuro:left-temporal-lobe'),
]

export const DEEP_NEUROVASCULAR_ATLAS_NODES: readonly AtlasNode[] = [
  ...corticalAndDeepGray,
  ...brainstemAndCerebellum,
  ...ventricularSystem,
  ...vascularTerritoryOverlays,
]

export const DEEP_NEUROVASCULAR_NODE_IDS = DEEP_NEUROVASCULAR_ATLAS_NODES.map((node) => node.id)
