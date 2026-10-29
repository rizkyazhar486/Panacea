import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { renderCanonicalAnatomySlice } from '../../src/domains/body-exposure-canonical/canonicalBodyExposureEngine.ts'

const id = 'CANONICAL-MALE-HEART-ROOT'
const source = 'Synthetic geometry fixture; no anatomical or clinical validation'
const license = 'LicenseRef-Synthetic-Test-Only'

// Segitiga sintetis berisi posisi dan indeks nyata; bukan geometri anatomi.
function fixture(t, { matrix = true, nodes, entry = {}, extras = { sourceAttribution: source, license } } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'panacea-body-identity-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const dir = path.join(root, 'public', 'bodyexposure')
  mkdirSync(dir, { recursive: true })
  const bin = Buffer.alloc(44)
  for (const [i, value] of [0, 0, 0, 1, 0, 0, 0, 1, 0].entries()) bin.writeFloatLE(value, i * 4)
  for (const [i, value] of [0, 1, 2].entries()) bin.writeUInt16LE(value, 36 + i * 2)
  const json = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: nodes ?? [{ name: id, mesh: 0, extras: { panacea_structure_id: id } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 6 }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR', min: [0], max: [2] },
    ], extras,
  }
  const rawJson = Buffer.from(JSON.stringify(json))
  const jsonChunk = Buffer.concat([rawJson, Buffer.alloc((4 - rawJson.length % 4) % 4, 0x20)])
  const glb = Buffer.alloc(28 + jsonChunk.length + bin.length)
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8)
  glb.writeUInt32LE(jsonChunk.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); jsonChunk.copy(glb, 20)
  glb.writeUInt32LE(bin.length, 20 + jsonChunk.length); glb.writeUInt32LE(0x004e4942, 24 + jsonChunk.length)
  bin.copy(glb, 28 + jsonChunk.length)
  writeFileSync(path.join(dir, 'synthetic.glb'), glb)
  if (matrix) writeFileSync(path.join(dir, 'body_matrix.json'), JSON.stringify({ structures: [{
    structureId: id, panacea_structure_id: id, glbPath: 'bodyexposure/synthetic.glb',
    sourceAttribution: source, license, sha256: createHash('sha256').update(glb).digest('hex'), ...entry,
  }] }))
  return structureId => renderCanonicalAnatomySlice({ structureId, requestedLodLevel: 'LOD_0_FULL', allowPersonalizationContract: false, repositoryRootPath: root })
}

function rejected(result, verdict) {
  assert.equal(result.verificationVerdict, verdict)
  assert.equal(result.geometryMeasured.hasValidMesh, false)
  assert.equal(result.geometryMeasured.indicesValidated, false)
  assert.equal(result.provenanceHash, null)
  assert.equal(result.clinicalGovernanceStatus.isClinicallyAuthoritative, false)
}

test('exact registered identity preserves the declared source and license', t => {
  const result = fixture(t, { entry: { laterality: 'LEFT' } })(id)
  assert.equal(result.verificationVerdict, 'VERIFIED_EMPIRICAL_ASSET')
  assert.equal(result.geometryMeasured.vertexCount, 3)
  assert.equal(result.geometryMeasured.triangleCount, 1)
  assert.equal(result.structureMetadata.panaceaStructureId, id)
  assert.equal(result.structureMetadata.sourceAttribution, source)
  assert.equal(result.structureMetadata.license, license)
  assert.equal(result.structureMetadata.laterality, 'LEFT')
  assert.equal(result.clinicalGovernanceStatus.isClinicallyAuthoritative, false)
})

test('unknown canonical IDs and partial names cannot borrow the first mesh', t => {
  const inspect = fixture(t)
  for (const unknown of ['CANONICAL-MALE-LIVER-ROOT', 'CANONICAL-MALE-HEART', 'CANONICAL-MALE-HEAR-ROOT']) {
    rejected(inspect(unknown), 'REJECTED_NONEXISTENT_STRUCTURE')
  }
})

test('a registered identity must still exist in the selected asset', t => {
  rejected(fixture(t, { nodes: [{ name: 'different-structure', mesh: 0 }] })(id), 'REJECTED_NONEXISTENT_STRUCTURE')
})

test('a missing registered file cannot borrow another discovered GLB', t => {
  rejected(fixture(t, { entry: { glbPath: 'bodyexposure/missing-source.glb' } })(id), 'UNVERIFIED_MISSING_SOURCE_ASSET')
})

test('a display name cannot override a conflicting stable identifier', t => {
  rejected(fixture(t, { nodes: [{ name: id, mesh: 0, extras: { panacea_structure_id: 'different-stable-id' } }] })(id), 'REJECTED_NONEXISTENT_STRUCTURE')
})

test('an exact node without a valid mesh cannot borrow all other geometry', t => {
  for (const mesh of [undefined, -1, 0.5, 99]) {
    rejected(fixture(t, { nodes: [{ name: id, mesh }, { name: 'other', mesh: 0 }] })(id), 'REJECTED_INVALID_INDICES')
  }
})

test('registered aliases resolve only through their explicit stable identifier', t => {
  const result = fixture(t, { entry: { structureId: 'explicit-heart-alias' } })('explicit-heart-alias')
  assert.equal(result.verificationVerdict, 'VERIFIED_EMPIRICAL_ASSET')
  assert.equal(result.structureMetadata.panaceaStructureId, id)
  assert.equal(result.geometryMeasured.vertexCount, 3)
})

test('duplicate stable identifiers are ambiguous rather than first-match wins', t => {
  rejected(fixture(t, { nodes: [{ mesh: 0, extras: { panacea_structure_id: id } }, { mesh: 0, extras: { panacea_structure_id: id } }] })(id), 'REJECTED_AMBIGUOUS_STRUCTURE')
})

test('an exact embedded identity can retain explicit provenance without a matrix', t => {
  const result = fixture(t, { matrix: false })(id)
  assert.equal(result.verificationVerdict, 'VERIFIED_EMPIRICAL_ASSET')
  assert.equal(result.structureMetadata.sourceAttribution, source)
  assert.equal(result.structureMetadata.license, license)
  assert.equal(result.structureMetadata.laterality, 'UNSPECIFIED')
  assert.equal(result.materialEvidence.manifestHashMatched, null)
})

test('missing or blank source and license are never manufactured from defaults', t => {
  for (const field of ['sourceAttribution', 'license']) for (const missing of [undefined, '', '  ']) {
    rejected(fixture(t, { entry: { [field]: missing }, extras: {} })(id), 'REJECTED_MISSING_PROVENANCE')
    rejected(fixture(t, { matrix: false, extras: { sourceAttribution: source, license, [field]: missing } })(id), 'REJECTED_MISSING_PROVENANCE')
  }
})
