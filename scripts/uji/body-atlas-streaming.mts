import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import {
  BODY_ATLAS_ASSET_MANIFEST,
  BODY_ATLAS_LAYER_COSTS,
  BODY_ATLAS_RUNTIME_PROFILES,
  planBodyAtlasStreaming,
  validateBodyAtlasAssetManifest,
} from '../../src/lib/bodyAtlasStreaming.ts'

const validation = validateBodyAtlasAssetManifest()
assert.equal(validation.valid, true, validation.reasons.join('\n'))
assert.equal(BODY_ATLAS_ASSET_MANIFEST.length, 7)
assert.equal(BODY_ATLAS_LAYER_COSTS.length, 7)
assert.equal(new Set(BODY_ATLAS_ASSET_MANIFEST.map((asset) => asset.layer)).size, 7)
assert.equal(BODY_ATLAS_ASSET_MANIFEST.every((asset) => asset.path.startsWith('public/anatomy/')), true)
assert.equal(BODY_ATLAS_ASSET_MANIFEST.some((asset) => asset.path.includes('thebuggeddev')), false)
assert.equal(BODY_ATLAS_ASSET_MANIFEST.some((asset) => asset.path.includes('breath-atlas')), false)

function gitBlobSha(path: string) {
  const bytes = readFileSync(path)
  const hash = createHash('sha1')
  hash.update(`blob ${bytes.length}\0`)
  hash.update(bytes)
  return hash.digest('hex')
}

for (const asset of BODY_ATLAS_ASSET_MANIFEST) {
  const stat = statSync(asset.path)
  assert.equal(stat.isFile(), true)
  assert.equal(stat.size, asset.bytes, `${asset.layer}: checked-in byte size changed; update provenance intentionally.`)
  assert.equal(gitBlobSha(asset.path), asset.gitBlobSha, `${asset.layer}: checked-in Git blob hash changed; update provenance intentionally.`)
}

for (const profile of Object.values(BODY_ATLAS_RUNTIME_PROFILES)) {
  assert.ok(profile.maxResidentBytes > 0)
  assert.ok(profile.triangleBudget > 0)
  assert.ok(profile.maxResidentLayers >= 1 && profile.maxResidentLayers <= 7)
  assert.ok(profile.devicePixelRatioCap >= 1 && profile.devicePixelRatioCap <= 2)
}

const request = {
  profile: 'constrained-mobile' as const,
  focusLayers: ['lymphoid'] as const,
  visibleLayers: ['visceral', 'skeletal', 'muscular'] as const,
  warmLayers: ['cardiovascular'] as const,
}
const planA = planBodyAtlasStreaming(request)
const planB = planBodyAtlasStreaming(request)
assert.deepEqual(planA.resident.map((layer) => layer.layer), planB.resident.map((layer) => layer.layer))
assert.equal(planA.deterministicKey, planB.deterministicKey)
assert.equal(planA.resident.some((layer) => layer.layer === 'lymphoid'), true)
assert.ok(planA.resident.length <= BODY_ATLAS_RUNTIME_PROFILES['constrained-mobile'].maxResidentLayers)
if (!planA.mandatoryBudgetExceeded) {
  assert.ok(planA.residentBytes <= BODY_ATLAS_RUNTIME_PROFILES['constrained-mobile'].maxResidentBytes)
  assert.ok(planA.residentTriangles <= BODY_ATLAS_RUNTIME_PROFILES['constrained-mobile'].triangleBudget)
}

const mandatoryHuge = planBodyAtlasStreaming({
  profile: 'constrained-mobile',
  focusLayers: ['cardiovascular', 'nervous', 'muscular'],
})
assert.equal(mandatoryHuge.resident.some((layer) => layer.layer === 'cardiovascular'), true)
assert.equal(mandatoryHuge.resident.some((layer) => layer.layer === 'nervous'), true)
assert.equal(mandatoryHuge.resident.some((layer) => layer.layer === 'muscular'), true)
assert.equal(mandatoryHuge.mandatoryBudgetExceeded, true)

const referenceCapture = planBodyAtlasStreaming({
  profile: '5k-reference-capture',
  visibleLayers: ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid'],
})
assert.ok(referenceCapture.resident.length >= planA.resident.length)
assert.equal(BODY_ATLAS_RUNTIME_PROFILES['5k-reference-capture'].devicePixelRatioCap, 2)

console.log(`Body atlas streaming: ${BODY_ATLAS_ASSET_MANIFEST.length} local GLBs cryptographically pinned; deterministic mobile/balanced/workstation/5K-reference residency planning verified.`)
