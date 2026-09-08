import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const federation = JSON.parse(await readFile('data/body-reference-federation.json', 'utf8'))

const sourceFiles: Record<string, string> = {
  thebuggeddev_anatomy: 'data/source-registry/anatomy/thebuggeddev-anatomy.json',
  thebuggeddev_breath_atlas: 'data/source-registry/physiology/thebuggeddev-breath-atlas.json',
  hubmap_hra: 'data/source-registry/anatomy/hubmap-hra.json',
  nih_3d: 'data/source-registry/anatomy/nih-3d.json',
  z_anatomy: 'data/source-registry/anatomy/z-anatomy.json',
  cellml: 'data/source-registry/physiology/cellml.json',
  physiome_model_repository: 'data/source-registry/physiology/physiome-model-repository.json',
}

async function loadSource(id: string) {
  const path = sourceFiles[id]
  assert.ok(path, `Federation source ${id} must map to an explicit registry file.`)
  const entry = JSON.parse(await readFile(path, 'utf8'))
  assert.equal(entry.id, id)
  assert.equal(entry.provenance.sourceIdentityRequired, true)
  assert.equal(entry.provenance.versionPinRequired, true)
  return entry
}

assert.deepEqual(
  federation.mandatoryReferences.map((item: any) => item.id),
  ['thebuggeddev_anatomy', 'thebuggeddev_breath_atlas'],
  'The two user-required references must remain explicit and mandatory.',
)

for (const ref of federation.mandatoryReferences) {
  const source = await loadSource(ref.id)
  assert.equal(ref.evidenceAuthority, false, `${ref.id} must never become medical evidence by declaration.`)
  assert.equal(ref.assetReuseAllowed, false, `${ref.id} assets must remain blocked while reuse rights are unverified.`)
  assert.equal(source.usage.runtime, false)
  assert.equal(source.usage.buildTime, false)
  assert.equal(source.validation.clinicalDecisionUse, 'NO')
  assert.equal(source.license.commercialUse, 'UNKNOWN')
}

const authoritativeIds = federation.authoritativeBackbone.map((item: any) => item.id)
assert.deepEqual(authoritativeIds, [
  'hubmap_hra',
  'nih_3d',
  'z_anatomy',
  'cellml',
  'physiome_model_repository',
])

for (const id of authoritativeIds) await loadSource(id)

assert.ok(federation.resolutionHierarchy.includes('whole-body'))
assert.ok(federation.resolutionHierarchy.includes('cell'))
assert.ok(federation.resolutionHierarchy.includes('molecular-model'))
assert.ok(federation.respiratoryCoverage.includes('alveolar-capillary-interface'))
assert.ok(federation.respiratoryCoverage.includes('gas-exchange-models'))
assert.ok(federation.respiratoryCoverage.includes('diaphragm-and-respiratory-muscles'))

const rules = federation.publicationRules
for (const [rule, value] of Object.entries(rules)) {
  assert.equal(value, true, `Publication safety rule ${rule} must remain enabled.`)
}

assert.equal(federation.crossCheckPolicy['single-source-production-promotion'], false)
assert.equal(federation.crossCheckPolicy['require-independent-source-corroboration-when-available'], true)
assert.equal(federation.crossCheckPolicy['preserve-disagreement'], true)
assert.equal(federation.crossCheckPolicy['do-not-average-conflicting-anatomy-or-physiology'], true)
assert.equal(federation.performancePolicy['no-bulk-global-dataset-in-primary-web-bundle'], true)
assert.equal(federation.performancePolicy['offline-fallback-must-not-fabricate-data'], true)

console.log('Body reference federation verified: mandatory Anatomy + Breath Atlas references, global authoritative backbone, multiscale coverage, fail-closed publication and bounded-performance rules.')
