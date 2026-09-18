import type { AtlasNode, AtlasRelationKind } from './atlasKernel'

export interface AtlasRelationPatch {
  from: string
  to: string
  kind: AtlasRelationKind
  note?: string
}

const flow = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'continuous-with', note })
const supplies = (from: string, to: string, note: string): AtlasRelationPatch => ({ from, to, kind: 'supplies', note })
const drains = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'drains', note })

const cardiacFlow: readonly AtlasRelationPatch[] = [
  flow('cv:right-atrium', 'cv:tricuspid-valve'),
  flow('cv:tricuspid-valve', 'cv:right-ventricle'),
  flow('cv:right-ventricle', 'cv:pulmonary-valve'),
  flow('cv:pulmonary-valve', 'cv:pulmonary-trunk'),
  flow('cv:pulmonary-trunk', 'cv:right-pulmonary-artery'),
  flow('cv:pulmonary-trunk', 'cv:left-pulmonary-artery'),
  drains('cv:right-superior-pulmonary-vein', 'cv:pulmonary-veins'),
  drains('cv:right-inferior-pulmonary-vein', 'cv:pulmonary-veins'),
  drains('cv:left-superior-pulmonary-vein', 'cv:pulmonary-veins'),
  drains('cv:left-inferior-pulmonary-vein', 'cv:pulmonary-veins'),
  drains('cv:pulmonary-veins', 'cv:left-atrium'),
  flow('cv:left-atrium', 'cv:mitral-valve'),
  flow('cv:mitral-valve', 'cv:left-ventricle'),
  flow('cv:left-ventricle', 'cv:aortic-valve'),
  flow('cv:aortic-valve', 'cv:ascending-aorta'),
  flow('cv:ascending-aorta', 'cv:aortic-arch'),
  flow('cv:aortic-arch', 'cv:descending-thoracic-aorta'),
  flow('cv:descending-thoracic-aorta', 'cv:abdominal-aorta'),
]

const coronaryFlow: readonly AtlasRelationPatch[] = [
  flow('cv:ascending-aorta', 'cv:left-main-coronary'),
  flow('cv:ascending-aorta', 'cv:rca'),
  flow('cv:left-main-coronary', 'cv:lad'),
  flow('cv:left-main-coronary', 'cv:lcx'),
  flow('cv:lcx', 'cv:obtuse-marginal'),
  flow('cv:rca', 'cv:acute-marginal'),
  flow('cv:rca', 'cv:pda'),
]

const cerebralFlow: readonly AtlasRelationPatch[] = [
  flow('cv:aortic-arch', 'cv:brachiocephalic-trunk'),
  flow('cv:aortic-arch', 'cv:left-common-carotid'),
  flow('cv:aortic-arch', 'cv:left-subclavian'),
  flow('cv:brachiocephalic-trunk', 'cv:right-common-carotid'),
  flow('cv:brachiocephalic-trunk', 'cv:right-subclavian'),
  flow('cv:right-common-carotid', 'cv:right-internal-carotid'),
  flow('cv:right-common-carotid', 'cv:right-external-carotid'),
  flow('cv:left-common-carotid', 'cv:left-internal-carotid'),
  flow('cv:left-common-carotid', 'cv:left-external-carotid'),
  flow('cv:right-subclavian', 'cv:right-vertebral-artery'),
  flow('cv:left-subclavian', 'cv:left-vertebral-artery'),
  flow('cv:right-vertebral-artery', 'cv:basilar-artery'),
  flow('cv:left-vertebral-artery', 'cv:basilar-artery'),
  flow('cv:right-internal-carotid', 'cv:right-anterior-cerebral-artery'),
  flow('cv:right-internal-carotid', 'cv:right-middle-cerebral-artery'),
  flow('cv:left-internal-carotid', 'cv:left-anterior-cerebral-artery'),
  flow('cv:left-internal-carotid', 'cv:left-middle-cerebral-artery'),
  flow('cv:basilar-artery', 'cv:right-posterior-cerebral-artery'),
  flow('cv:basilar-artery', 'cv:left-posterior-cerebral-artery'),
  flow('cv:right-anterior-cerebral-artery', 'cv:anterior-communicating-artery'),
  flow('cv:left-anterior-cerebral-artery', 'cv:anterior-communicating-artery'),
  flow('cv:right-internal-carotid', 'cv:right-posterior-communicating-artery'),
  flow('cv:right-posterior-communicating-artery', 'cv:right-posterior-cerebral-artery'),
  flow('cv:left-internal-carotid', 'cv:left-posterior-communicating-artery'),
  flow('cv:left-posterior-communicating-artery', 'cv:left-posterior-cerebral-artery'),
]

const lowerLimbArterialFlow: readonly AtlasRelationPatch[] = [
  flow('cv:abdominal-aorta', 'cv:right-common-iliac-artery'),
  flow('cv:abdominal-aorta', 'cv:left-common-iliac-artery'),
  flow('cv:right-common-iliac-artery', 'cv:right-external-iliac-artery'),
  flow('cv:left-common-iliac-artery', 'cv:left-external-iliac-artery'),
  flow('cv:right-external-iliac-artery', 'cv:right-femoral-artery'),
  flow('cv:left-external-iliac-artery', 'cv:left-femoral-artery'),
  flow('cv:right-femoral-artery', 'cv:right-popliteal-artery'),
  flow('cv:left-femoral-artery', 'cv:left-popliteal-artery'),
  flow('cv:right-popliteal-artery', 'cv:right-anterior-tibial-artery'),
  flow('cv:right-popliteal-artery', 'cv:right-posterior-tibial-artery'),
  flow('cv:left-popliteal-artery', 'cv:left-anterior-tibial-artery'),
  flow('cv:left-popliteal-artery', 'cv:left-posterior-tibial-artery'),
  flow('cv:right-posterior-tibial-artery', 'cv:right-fibular-artery'),
  flow('cv:left-posterior-tibial-artery', 'cv:left-fibular-artery'),
  flow('cv:right-anterior-tibial-artery', 'cv:right-dorsalis-pedis-artery'),
  flow('cv:left-anterior-tibial-artery', 'cv:left-dorsalis-pedis-artery'),
]

const lowerLimbVenousReturn: readonly AtlasRelationPatch[] = [
  drains('cv:right-anterior-tibial-vein', 'cv:right-popliteal-vein'),
  drains('cv:right-posterior-tibial-vein', 'cv:right-popliteal-vein'),
  drains('cv:right-fibular-vein', 'cv:right-popliteal-vein'),
  drains('cv:left-anterior-tibial-vein', 'cv:left-popliteal-vein'),
  drains('cv:left-posterior-tibial-vein', 'cv:left-popliteal-vein'),
  drains('cv:left-fibular-vein', 'cv:left-popliteal-vein'),
  drains('cv:right-popliteal-vein', 'cv:right-common-femoral-vein'),
  drains('cv:left-popliteal-vein', 'cv:left-common-femoral-vein'),
  drains('cv:right-deep-femoral-vein', 'cv:right-common-femoral-vein'),
  drains('cv:left-deep-femoral-vein', 'cv:left-common-femoral-vein'),
  drains('cv:right-great-saphenous-vein', 'cv:right-common-femoral-vein'),
  drains('cv:left-great-saphenous-vein', 'cv:left-common-femoral-vein'),
  drains('cv:right-small-saphenous-vein', 'cv:right-popliteal-vein'),
  drains('cv:left-small-saphenous-vein', 'cv:left-popliteal-vein'),
  drains('cv:right-common-femoral-vein', 'cv:inferior-vena-cava'),
  drains('cv:left-common-femoral-vein', 'cv:inferior-vena-cava'),
  drains('cv:inferior-vena-cava', 'cv:right-atrium'),
  drains('cv:superior-vena-cava', 'cv:right-atrium'),
]

const territoryRelations: readonly AtlasRelationPatch[] = [
  supplies('cv:right-anterior-cerebral-artery', 'neuro:territory:right-aca-medial-frontal', 'Educational ACA territory reference only; not patient lesion localization.'),
  supplies('cv:left-anterior-cerebral-artery', 'neuro:territory:left-aca-medial-frontal', 'Educational ACA territory reference only; not patient lesion localization.'),
  supplies('cv:right-anterior-cerebral-artery', 'neuro:territory:right-aca-medial-parietal', 'Educational ACA territory reference only; not patient lesion localization.'),
  supplies('cv:left-anterior-cerebral-artery', 'neuro:territory:left-aca-medial-parietal', 'Educational ACA territory reference only; not patient lesion localization.'),
  supplies('cv:right-middle-cerebral-artery', 'neuro:territory:right-mca-lateral-frontal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:left-middle-cerebral-artery', 'neuro:territory:left-mca-lateral-frontal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:right-middle-cerebral-artery', 'neuro:territory:right-mca-lateral-parietal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:left-middle-cerebral-artery', 'neuro:territory:left-mca-lateral-parietal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:right-middle-cerebral-artery', 'neuro:territory:right-mca-lateral-temporal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:left-middle-cerebral-artery', 'neuro:territory:left-mca-lateral-temporal', 'Educational MCA territory reference only; not patient lesion localization.'),
  supplies('cv:right-posterior-cerebral-artery', 'neuro:territory:right-pca-occipital', 'Educational PCA territory reference only; not patient lesion localization.'),
  supplies('cv:left-posterior-cerebral-artery', 'neuro:territory:left-pca-occipital', 'Educational PCA territory reference only; not patient lesion localization.'),
  supplies('cv:right-posterior-cerebral-artery', 'neuro:territory:right-pca-medial-temporal', 'Educational PCA territory reference only; not patient lesion localization.'),
  supplies('cv:left-posterior-cerebral-artery', 'neuro:territory:left-pca-medial-temporal', 'Educational PCA territory reference only; not patient lesion localization.'),
  supplies('cv:basilar-artery', 'neuro:pons', 'Educational vertebrobasilar brainstem supply anchor; perforator-level anatomy is not inferred.'),
]

export const HIGH_END_ATLAS_RELATION_PATCHES: readonly AtlasRelationPatch[] = [
  ...cardiacFlow,
  ...coronaryFlow,
  ...cerebralFlow,
  ...lowerLimbArterialFlow,
  ...lowerLimbVenousReturn,
  ...territoryRelations,
]

/**
 * Applies cross-module relations only after every atlas module has been composed.
 * Missing `from` or `to` ids are fatal because silently dropping an edge would
 * create a plausible-looking but anatomically broken navigation graph.
 */
export function applyAtlasRelationPatches(
  nodes: readonly AtlasNode[],
  patches: readonly AtlasRelationPatch[] = HIGH_END_ATLAS_RELATION_PATCHES,
): readonly AtlasNode[] {
  const ids = new Set(nodes.map((node) => node.id))
  for (const patch of patches) {
    if (!ids.has(patch.from)) throw new Error(`High-end atlas relation source is missing: ${patch.from}`)
    if (!ids.has(patch.to)) throw new Error(`High-end atlas relation target is missing: ${patch.to}`)
  }

  const byFrom = new Map<string, AtlasRelationPatch[]>()
  for (const patch of patches) {
    const list = byFrom.get(patch.from) ?? []
    list.push(patch)
    byFrom.set(patch.from, list)
  }

  return nodes.map((node) => {
    const additions = byFrom.get(node.id) ?? []
    if (!additions.length) return node
    const relations = [...(node.relations ?? [])]
    const seen = new Set(relations.map((relation) => `${relation.kind}|${relation.targetId}|${relation.note ?? ''}`))
    for (const patch of additions) {
      const key = `${patch.kind}|${patch.to}|${patch.note ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      relations.push({ kind: patch.kind, targetId: patch.to, note: patch.note })
    }
    return { ...node, relations }
  })
}
