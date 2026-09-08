import type { AnatomyAssetRecord, AtlasLoadContext, AtlasLoadPlanItem, AtlasValidationIssue, AtlasValidationReport } from './types'

const coordinateFrame: AnatomyAssetRecord['coordinateFrame'] = {
  handedness: 'right-handed', upAxis: 'y', unit: 'meter',
  anatomicalAxes: {
    leftRight: 'x: negative=left, positive=right',
    inferiorSuperior: 'y: negative=inferior, positive=superior',
    posteriorAnterior: 'z: negative=posterior, positive=anterior',
  },
}

const lods = (triangles: number): AnatomyAssetRecord['lods'] => [
  { level: 0, triangleBudget: triangles, textureBudgetMB: 32, maxScreenErrorPx: 0.75 },
  { level: 1, triangleBudget: Math.round(triangles * 0.42), textureBudgetMB: 16, maxScreenErrorPx: 1.5 },
  { level: 2, triangleBudget: Math.round(triangles * 0.16), textureBudgetMB: 8, maxScreenErrorPx: 3 },
  { level: 3, triangleBudget: Math.round(triangles * 0.05), textureBudgetMB: 4, maxScreenErrorPx: 6 },
]

const asset = (id: string, structureIds: readonly string[], triangles: number, loadClass: AnatomyAssetRecord['loadClass']): AnatomyAssetRecord => ({
  id,
  structureIds,
  logicalUri: `atlas://${id}`,
  format: 'glb',
  compression: 'meshopt',
  coordinateFrame,
  lods: lods(triangles),
  provenance: { status: 'unresolved' },
  loadClass,
})

export const WHOLE_BODY_ASSET_MANIFEST: readonly AnatomyAssetRecord[] = [
  asset('skeletal-whole-body', ['skeleton'], 900_000, 'interactive'),
  asset('muscular-whole-body', ['skeletal-muscle-system'], 1_100_000, 'interactive'),
  asset('cardiovascular-core', ['heart'], 360_000, 'critical'),
  asset('vascular-core', ['ascending-aorta', 'aortic-arch', 'descending-aorta', 'abdominal-aorta', 'superior-vena-cava', 'inferior-vena-cava'], 520_000, 'interactive'),
  asset('cardiopulmonary-vessels', ['pulmonary-artery', 'pulmonary-veins'], 260_000, 'critical'),
  asset('nervous-cns', ['brain', 'spinal-cord'], 720_000, 'interactive'),
  asset('digestive-core', ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum'], 620_000, 'interactive'),
  asset('hepatobiliary-core', ['liver', 'gallbladder', 'pancreas'], 420_000, 'interactive'),
  asset('urinary-core', ['right-kidney', 'left-kidney', 'right-ureter', 'left-ureter', 'urinary-bladder'], 360_000, 'interactive'),
  asset('lymphatic-core', ['spleen', 'thoracic-duct'], 240_000, 'deferred'),
  asset('reproductive-pelvis', ['uterus', 'right-ovary', 'left-ovary', 'prostate', 'right-testis', 'left-testis'], 420_000, 'deferred'),
  asset('integumentary-whole-body', ['skin'], 300_000, 'deferred'),
  asset('fascial-core', ['thoracolumbar-fascia', 'deep-cervical-fascia', 'right-plantar-fascia', 'left-plantar-fascia'], 340_000, 'deferred'),
  asset('sensory-head', ['right-eye', 'left-eye', 'right-inner-ear', 'left-inner-ear'], 420_000, 'deferred'),
  asset('articular-core', ['right-glenohumeral-joint', 'left-glenohumeral-joint', 'right-hip-joint', 'left-hip-joint', 'right-knee-joint', 'left-knee-joint'], 460_000, 'deferred'),
  asset('respiratory-deep-atlas', ['respiratory-system', 'trachea', 'right-lung', 'left-lung'], 1_250_000, 'critical'),
]

export function validateAssetManifest(assets: readonly AnatomyAssetRecord[]): AtlasValidationReport {
  const issues: AtlasValidationIssue[] = []
  const ids = new Set<string>()
  for (const record of assets) {
    if (ids.has(record.id)) issues.push({ code: 'duplicate-asset-id', message: `Duplicate asset id ${record.id}`, assetId: record.id })
    ids.add(record.id)
    if (!record.logicalUri.startsWith('atlas://')) issues.push({ code: 'non-logical-uri', message: 'Atlas assets must use logical atlas:// URIs.', assetId: record.id })
    if (record.lods.length < 2) issues.push({ code: 'insufficient-lod', message: 'At least two LODs are required.', assetId: record.id })
    const sorted = [...record.lods].sort((a, b) => a.level - b.level)
    for (let index = 1; index < sorted.length; index++) {
      if (sorted[index].triangleBudget >= sorted[index - 1].triangleBudget) issues.push({ code: 'non-monotonic-lod-triangles', message: 'Triangle budgets must decrease as LOD level increases.', assetId: record.id })
      if (sorted[index].textureBudgetMB > sorted[index - 1].textureBudgetMB) issues.push({ code: 'non-monotonic-lod-textures', message: 'Texture budgets must not increase as LOD level increases.', assetId: record.id })
    }
    if (record.provenance.status === 'recorded' && (!record.provenance.sourceUrl || !record.provenance.license)) {
      issues.push({ code: 'incomplete-provenance', message: 'Recorded asset provenance requires source URL and license.', assetId: record.id })
    }
  }
  return { valid: issues.length === 0, issues }
}

export function buildAtlasLoadPlan(assets: readonly AnatomyAssetRecord[], context: AtlasLoadContext): readonly AtlasLoadPlanItem[] {
  const visible = new Set(context.visibleStructureIds)
  const clinical = new Set(context.clinicalFocusStructureIds ?? [])
  const interaction = new Set(context.interactionStructureIds ?? [])
  const pinned = new Set(context.pinnedStructureIds ?? [])
  const budget = context.transferBudgetMB ?? Number.POSITIVE_INFINITY
  const plan = assets.map((record): AtlasLoadPlanItem | null => {
    const requested = record.structureIds.filter((id) => visible.has(id) || clinical.has(id) || interaction.has(id) || pinned.has(id))
    if (!requested.length) return null
    let importance = record.loadClass === 'critical' ? 3 : record.loadClass === 'interactive' ? 2 : 1
    const reasons: string[] = [`load-class:${record.loadClass}`]
    for (const id of record.structureIds) {
      if (visible.has(id)) { importance += 3; reasons.push(`visible:${id}`) }
      if (clinical.has(id)) { importance += 4; reasons.push(`clinical:${id}`) }
      if (interaction.has(id)) { importance += 2; reasons.push(`interaction:${id}`) }
      if (pinned.has(id)) { importance += 5; reasons.push(`pinned:${id}`) }
    }
    const lod0 = record.lods.find((entry) => entry.level === 0) ?? record.lods[0]
    const cost = Math.max(1, lod0.textureBudgetMB + lod0.triangleBudget / 100_000)
    return { asset: record, score: importance / cost, reasons, requestedStructureIds: requested }
  }).filter((item): item is AtlasLoadPlanItem => Boolean(item))
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id))
  if (!Number.isFinite(budget)) return plan
  const selected: AtlasLoadPlanItem[] = []
  let estimatedMB = 0
  for (const item of plan) {
    const estimate = item.asset.lods.find((entry) => entry.level === 2)?.textureBudgetMB ?? item.asset.lods[0].textureBudgetMB
    if (estimatedMB + estimate > budget && selected.length) continue
    selected.push(item)
    estimatedMB += estimate
  }
  return selected
}
