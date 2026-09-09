import type { AnatomyRelation, AnatomyStructure } from './types'

const n = (
  id: string,
  label: string,
  parentId: string,
  options: Partial<Pick<AnatomyStructure, 'laterality' | 'synonyms' | 'tags'>> = {},
): AnatomyStructure => ({
  id,
  label,
  parentId,
  system: 'nervous-cns',
  regions: ['head'],
  laterality: options.laterality ?? 'midline',
  synonyms: options.synonyms ?? [],
  tags: options.tags ?? [],
  reviewStatus: 'reference',
})

const a = (
  id: string,
  label: string,
  parentId: string,
  side: 'left' | 'right' | 'midline',
  synonyms: readonly string[] = [],
): AnatomyStructure => ({
  id,
  label,
  parentId,
  system: 'arterial',
  regions: ['head'],
  laterality: side,
  synonyms,
  tags: ['cerebral-circulation', 'neurovascular-segment'],
  assetGroupId: 'vascular-core',
  reviewStatus: 'reference',
})

const bilateralNeural = (stem: string, label: string, parentId: string, tags: readonly string[] = []): readonly AnatomyStructure[] => [
  n(`right-${stem}`, `Right ${label}`, parentId, { laterality: 'right', tags }),
  n(`left-${stem}`, `Left ${label}`, parentId, { laterality: 'left', tags }),
]

const bilateralArtery = (stem: string, label: string, rightParent: string, leftParent: string, aliases: readonly string[] = []): readonly AnatomyStructure[] => [
  a(`right-${stem}`, `Right ${label}`, rightParent, 'right', aliases.map((alias) => `right ${alias}`)),
  a(`left-${stem}`, `Left ${label}`, leftParent, 'left', aliases.map((alias) => `left ${alias}`)),
]

export const NEUROVASCULAR_STRUCTURES: readonly AnatomyStructure[] = [
  ...bilateralNeural('frontal-lobe', 'frontal lobe', 'cerebrum', ['cortex']),
  ...bilateralNeural('parietal-lobe', 'parietal lobe', 'cerebrum', ['cortex']),
  ...bilateralNeural('temporal-lobe', 'temporal lobe', 'cerebrum', ['cortex']),
  ...bilateralNeural('occipital-lobe', 'occipital lobe', 'cerebrum', ['cortex']),
  ...bilateralNeural('insula', 'insula', 'cerebrum', ['cortex', 'insular-cortex']),
  ...bilateralNeural('medial-frontal-cortex', 'medial frontal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('medial-parietal-cortex', 'medial parietal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('lateral-frontal-cortex', 'lateral frontal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('lateral-parietal-cortex', 'lateral parietal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('lateral-temporal-cortex', 'lateral temporal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('medial-temporal-cortex', 'medial temporal cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor']),
  ...bilateralNeural('visual-occipital-cortex', 'occipital visual cortex', 'cerebrum', ['cortex', 'vascular-territory-anchor', 'visual']),

  ...bilateralNeural('caudate-nucleus', 'caudate nucleus', 'cerebrum', ['basal-ganglia', 'deep-gray']),
  ...bilateralNeural('putamen', 'putamen', 'cerebrum', ['basal-ganglia', 'deep-gray']),
  ...bilateralNeural('globus-pallidus', 'globus pallidus', 'cerebrum', ['basal-ganglia', 'deep-gray']),
  ...bilateralNeural('thalamus', 'thalamus', 'cerebrum', ['deep-gray', 'vascular-territory-anchor']),
  ...bilateralNeural('internal-capsule', 'internal capsule', 'cerebrum', ['white-matter', 'motor-pathway', 'vascular-territory-anchor']),
  n('corpus-callosum', 'Corpus callosum', 'cerebrum', { tags: ['white-matter', 'commissural'] }),

  n('midbrain', 'Midbrain', 'brainstem', { tags: ['brainstem', 'vascular-territory-anchor'] }),
  n('pons', 'Pons', 'brainstem', { tags: ['brainstem', 'vascular-territory-anchor'] }),
  n('medulla-oblongata', 'Medulla oblongata', 'brainstem', { synonyms: ['medulla'], tags: ['brainstem', 'vascular-territory-anchor'] }),
  ...bilateralNeural('cerebellar-hemisphere', 'cerebellar hemisphere', 'cerebellum', ['cerebellum']),
  ...bilateralNeural('superior-cerebellar-surface', 'superior cerebellar surface', 'cerebellum', ['cerebellum', 'vascular-territory-anchor']),
  ...bilateralNeural('anteroinferior-cerebellar-surface', 'anteroinferior cerebellar surface', 'cerebellum', ['cerebellum', 'vascular-territory-anchor']),
  ...bilateralNeural('posteroinferior-cerebellar-surface', 'posteroinferior cerebellar surface', 'cerebellum', ['cerebellum', 'vascular-territory-anchor']),

  ...bilateralNeural('lateral-ventricle', 'lateral ventricle', 'cerebrum', ['ventricular-system']),
  n('third-ventricle', 'Third ventricle', 'brain', { tags: ['ventricular-system'] }),
  n('cerebral-aqueduct', 'Cerebral aqueduct', 'midbrain', { synonyms: ['aqueduct of Sylvius'], tags: ['ventricular-system'] }),
  n('fourth-ventricle', 'Fourth ventricle', 'brainstem', { tags: ['ventricular-system'] }),

  ...bilateralArtery('aca-a1', 'ACA A1 segment', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', ['A1', 'precommunicating ACA']),
  ...bilateralArtery('aca-a2', 'ACA A2 segment', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', ['A2', 'postcommunicating ACA']),
  ...bilateralArtery('aca-a3', 'ACA A3 segment', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', ['A3', 'precallosal artery']),
  ...bilateralArtery('aca-a4', 'ACA A4 segment', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', ['A4', 'supracallosal artery']),
  ...bilateralArtery('aca-a5', 'ACA A5 segment', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', ['A5', 'postcallosal artery']),

  ...bilateralArtery('mca-m1', 'MCA M1 segment', 'right-middle-cerebral-artery', 'left-middle-cerebral-artery', ['M1', 'sphenoidal MCA']),
  ...bilateralArtery('mca-m2', 'MCA M2 segment', 'right-middle-cerebral-artery', 'left-middle-cerebral-artery', ['M2', 'insular MCA']),
  ...bilateralArtery('mca-m3', 'MCA M3 segment', 'right-middle-cerebral-artery', 'left-middle-cerebral-artery', ['M3', 'opercular MCA']),
  ...bilateralArtery('mca-m4', 'MCA M4 segment', 'right-middle-cerebral-artery', 'left-middle-cerebral-artery', ['M4', 'cortical MCA']),

  ...bilateralArtery('pca-p1', 'PCA P1 segment', 'right-posterior-cerebral-artery', 'left-posterior-cerebral-artery', ['P1', 'precommunicating PCA']),
  ...bilateralArtery('pca-p2', 'PCA P2 segment', 'right-posterior-cerebral-artery', 'left-posterior-cerebral-artery', ['P2', 'postcommunicating PCA']),
  ...bilateralArtery('pca-p3', 'PCA P3 segment', 'right-posterior-cerebral-artery', 'left-posterior-cerebral-artery', ['P3', 'quadrigeminal PCA']),
  ...bilateralArtery('pca-p4', 'PCA P4 segment', 'right-posterior-cerebral-artery', 'left-posterior-cerebral-artery', ['P4', 'calcarine PCA']),

  ...bilateralArtery('superior-cerebellar-artery', 'superior cerebellar artery', 'basilar-artery', 'basilar-artery', ['SCA']),
  ...bilateralArtery('aica', 'anterior inferior cerebellar artery', 'basilar-artery', 'basilar-artery', ['AICA']),
  ...bilateralArtery('pica', 'posterior inferior cerebellar artery', 'right-vertebral-artery', 'left-vertebral-artery', ['PICA']),
]

const branch = (from: string, to: string): AnatomyRelation => ({ from, to, type: 'branches-to' })
const supplies = (from: string, to: string, note: string): AnatomyRelation => ({ from, to, type: 'supplies', note })

const pairedSegmentChains: readonly [string, readonly string[]][] = [
  ['aca', ['a1','a2','a3','a4','a5']],
  ['mca', ['m1','m2','m3','m4']],
  ['pca', ['p1','p2','p3','p4']],
]

const arterialSegmentRelations: AnatomyRelation[] = []
for (const side of ['right','left'] as const) {
  for (const [artery, segments] of pairedSegmentChains) {
    const root = `${side}-${artery === 'aca' ? 'anterior-cerebral-artery' : artery === 'mca' ? 'middle-cerebral-artery' : 'posterior-cerebral-artery'}`
    let previous = root
    for (const segment of segments) {
      const current = `${side}-${artery}-${segment}`
      arterialSegmentRelations.push(branch(previous, current))
      previous = current
    }
  }
}

export const NEUROVASCULAR_RELATIONS: readonly AnatomyRelation[] = [
  ...arterialSegmentRelations,
  branch('basilar-artery', 'right-superior-cerebellar-artery'),
  branch('basilar-artery', 'left-superior-cerebellar-artery'),
  branch('basilar-artery', 'right-aica'),
  branch('basilar-artery', 'left-aica'),
  branch('right-vertebral-artery', 'right-pica'),
  branch('left-vertebral-artery', 'left-pica'),

  supplies('right-anterior-cerebral-artery', 'right-medial-frontal-cortex', 'Educational ACA cortical territory anchor; not patient lesion localization.'),
  supplies('left-anterior-cerebral-artery', 'left-medial-frontal-cortex', 'Educational ACA cortical territory anchor; not patient lesion localization.'),
  supplies('right-anterior-cerebral-artery', 'right-medial-parietal-cortex', 'Educational ACA cortical territory anchor; not patient lesion localization.'),
  supplies('left-anterior-cerebral-artery', 'left-medial-parietal-cortex', 'Educational ACA cortical territory anchor; not patient lesion localization.'),

  supplies('right-middle-cerebral-artery', 'right-lateral-frontal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('left-middle-cerebral-artery', 'left-lateral-frontal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('right-middle-cerebral-artery', 'right-lateral-parietal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('left-middle-cerebral-artery', 'left-lateral-parietal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('right-middle-cerebral-artery', 'right-lateral-temporal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('left-middle-cerebral-artery', 'left-lateral-temporal-cortex', 'Educational MCA cortical territory anchor; not patient lesion localization.'),
  supplies('right-middle-cerebral-artery', 'right-insula', 'Educational MCA/insular territory anchor; not patient lesion localization.'),
  supplies('left-middle-cerebral-artery', 'left-insula', 'Educational MCA/insular territory anchor; not patient lesion localization.'),

  supplies('right-posterior-cerebral-artery', 'right-visual-occipital-cortex', 'Educational PCA cortical territory anchor; not patient lesion localization.'),
  supplies('left-posterior-cerebral-artery', 'left-visual-occipital-cortex', 'Educational PCA cortical territory anchor; not patient lesion localization.'),
  supplies('right-posterior-cerebral-artery', 'right-medial-temporal-cortex', 'Educational PCA territory anchor; not patient lesion localization.'),
  supplies('left-posterior-cerebral-artery', 'left-medial-temporal-cortex', 'Educational PCA territory anchor; not patient lesion localization.'),
  supplies('right-posterior-cerebral-artery', 'right-thalamus', 'Educational posterior-circulation deep territory anchor; perforator detail requires dedicated review.'),
  supplies('left-posterior-cerebral-artery', 'left-thalamus', 'Educational posterior-circulation deep territory anchor; perforator detail requires dedicated review.'),

  supplies('basilar-artery', 'pons', 'Educational vertebrobasilar brainstem supply anchor; branch-level perforator anatomy is not inferred.'),
  supplies('right-pica', 'right-posteroinferior-cerebellar-surface', 'Educational PICA territory anchor.'),
  supplies('left-pica', 'left-posteroinferior-cerebellar-surface', 'Educational PICA territory anchor.'),
  supplies('right-aica', 'right-anteroinferior-cerebellar-surface', 'Educational AICA territory anchor.'),
  supplies('left-aica', 'left-anteroinferior-cerebellar-surface', 'Educational AICA territory anchor.'),
  supplies('right-superior-cerebellar-artery', 'right-superior-cerebellar-surface', 'Educational SCA territory anchor.'),
  supplies('left-superior-cerebellar-artery', 'left-superior-cerebellar-surface', 'Educational SCA territory anchor.'),
]
