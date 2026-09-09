import type { AtlasNode, AtlasProvenance } from './atlasKernel'

const SOURCE_CANDIDATE: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/cardiovascular.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering candidate source mapping only; qualified vascular anatomy review remains required.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-visceral-vascular-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/visceralVascularAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational splanchnic/portal/renal topology only; not patient-specific vascular reconstruction.',
}

type Options = {
  regions?: AtlasNode['regions']
  laterality?: AtlasNode['laterality']
  geometryStatus?: AtlasNode['geometryStatus']
  hints?: readonly string[]
  priority?: number
  surgicalLandmark?: boolean
  synonyms?: readonly string[]
}

function vessel(id: string, label: string, parentId = 'system:cardiovascular', options: Options = {}): AtlasNode {
  const geometryStatus = options.geometryStatus ?? 'reference-only'
  return {
    id,
    label,
    system: 'cardiovascular',
    regions: options.regions ?? ['abdomen'],
    laterality: options.laterality ?? 'midline',
    scale: 'suborgan',
    parentId,
    synonyms: options.synonyms,
    source: {
      mode: 'specific-fallback',
      files: geometryStatus === 'reference-only' ? undefined : ['cardiovascular.glb'],
      nodeHints: options.hints ?? [label],
    },
    provenance: geometryStatus === 'reference-only' ? REFERENCE_ONLY : SOURCE_CANDIDATE,
    geometryStatus,
    educationalPriority: options.priority ?? 0.86,
    physiologyCapable: true,
    surgicalLandmark: options.surgicalLandmark ?? false,
  }
}

export const VISCERAL_VASCULAR_ATLAS_NODES: readonly AtlasNode[] = [
  vessel('cv:celiac-trunk', 'Celiac trunk', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['celiac trunk', 'coeliac trunk'], priority: 0.96, surgicalLandmark: true }),
  vessel('cv:left-gastric-artery', 'Left gastric artery', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.82 }),
  vessel('cv:splenic-artery', 'Splenic artery', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'partial', hints: ['splenic artery'], priority: 0.9, surgicalLandmark: true }),
  vessel('cv:common-hepatic-artery', 'Common hepatic artery', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'partial', hints: ['common hepatic artery'], priority: 0.92, surgicalLandmark: true }),
  vessel('cv:proper-hepatic-artery', 'Proper hepatic artery', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.92, surgicalLandmark: true }),
  vessel('cv:right-hepatic-artery', 'Right hepatic artery', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  vessel('cv:left-hepatic-artery', 'Left hepatic artery', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  vessel('cv:gastroduodenal-artery', 'Gastroduodenal artery', 'system:cardiovascular', { geometryStatus: 'reference-only', priority: 0.88, surgicalLandmark: true }),

  vessel('cv:superior-mesenteric-artery', 'Superior mesenteric artery', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['superior mesenteric artery'], priority: 0.98, surgicalLandmark: true, synonyms: ['SMA'] }),
  vessel('cv:inferior-mesenteric-artery', 'Inferior mesenteric artery', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['inferior mesenteric artery'], priority: 0.94, surgicalLandmark: true, synonyms: ['IMA'] }),

  vessel('cv:portal-vein', 'Hepatic portal vein', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['hepatic portal vein', 'portal vein'], priority: 1, surgicalLandmark: true }),
  vessel('cv:superior-mesenteric-vein', 'Superior mesenteric vein', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['superior mesenteric vein'], priority: 0.92, surgicalLandmark: true, synonyms: ['SMV'] }),
  vessel('cv:inferior-mesenteric-vein', 'Inferior mesenteric vein', 'system:cardiovascular', { geometryStatus: 'reference-only', priority: 0.84, synonyms: ['IMV'] }),
  vessel('cv:splenic-vein', 'Splenic vein', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'partial', hints: ['splenic vein'], priority: 0.9, surgicalLandmark: true }),
  vessel('cv:right-hepatic-vein', 'Right hepatic vein', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'partial', hints: ['right hepatic vein'], priority: 0.9, surgicalLandmark: true }),
  vessel('cv:middle-hepatic-vein', 'Middle hepatic vein', 'system:cardiovascular', { geometryStatus: 'partial', hints: ['middle hepatic vein'], priority: 0.9, surgicalLandmark: true }),
  vessel('cv:left-hepatic-vein', 'Left hepatic vein', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'partial', hints: ['left hepatic vein'], priority: 0.9, surgicalLandmark: true }),

  vessel('cv:right-renal-artery', 'Right renal artery', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'partial', hints: ['right renal artery'], priority: 0.94, surgicalLandmark: true }),
  vessel('cv:left-renal-artery', 'Left renal artery', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'partial', hints: ['left renal artery'], priority: 0.94, surgicalLandmark: true }),
  vessel('cv:right-renal-vein', 'Right renal vein', 'system:cardiovascular', { laterality: 'right', geometryStatus: 'partial', hints: ['right renal vein'], priority: 0.94, surgicalLandmark: true }),
  vessel('cv:left-renal-vein', 'Left renal vein', 'system:cardiovascular', { laterality: 'left', geometryStatus: 'partial', hints: ['left renal vein'], priority: 0.94, surgicalLandmark: true }),

  vessel('cv:right-gonadal-artery', 'Right gonadal artery reference', 'system:cardiovascular', { laterality: 'right', regions: ['abdomen', 'pelvis'], geometryStatus: 'reference-only', priority: 0.74 }),
  vessel('cv:left-gonadal-artery', 'Left gonadal artery reference', 'system:cardiovascular', { laterality: 'left', regions: ['abdomen', 'pelvis'], geometryStatus: 'reference-only', priority: 0.74 }),
  vessel('cv:right-gonadal-vein', 'Right gonadal vein reference', 'system:cardiovascular', { laterality: 'right', regions: ['abdomen', 'pelvis'], geometryStatus: 'reference-only', priority: 0.74 }),
  vessel('cv:left-gonadal-vein', 'Left gonadal vein reference', 'system:cardiovascular', { laterality: 'left', regions: ['abdomen', 'pelvis'], geometryStatus: 'reference-only', priority: 0.74 }),

  vessel('cv:right-venous-angle', 'Right venous angle reference', 'system:cardiovascular', { laterality: 'right', regions: ['neck', 'thorax'], geometryStatus: 'reference-only', priority: 0.8 }),
  vessel('cv:left-venous-angle', 'Left venous angle reference', 'system:cardiovascular', { laterality: 'left', regions: ['neck', 'thorax'], geometryStatus: 'reference-only', priority: 0.82 }),
]
