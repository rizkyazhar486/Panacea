import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { claimsFromJson, classifyClaims, inventory, compareInventory, glbJson } from './body-public-asset-inventory.mjs'

function fixture(run) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'panacea-d8-'))
  try { return run(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

test('collects source/license claims from GLB parent extras without requiring duplicated child metadata', () => {
  assert.deepEqual(claimsFromJson({ nodes: [{ extras: { panacea_source: 'Atlas', panacea_license: 'CC BY 4.0' }, children: [1] }, { mesh: 0 }] }), { sources: ['Atlas'], licenses: ['CC BY 4.0'] })
})
test('reports absent attribution and unrecognized licenses; never declares known licenses cleared', () => {
  assert.deepEqual(classifyClaims({ sources: [], licenses: [] }), ['license-claim-missing', 'source-claim-missing'])
  assert.deepEqual(classifyClaims({ sources: ['Atlas'], licenses: ['invented proprietary grant'] }), ['unrecognized-license-claim:invented proprietary grant'])
  assert.deepEqual(classifyClaims({ sources: ['Atlas'], licenses: ['CC BY 4.0'] }), [])
})
test('records unresolved ICRP and Oxford permissions even when metadata asserts owner clearance', () => {
  assert.deepEqual(classifyClaims({ sources: ['ICRP Publication 145'], licenses: ['ICRP Publication 145; project owner cleared'] }), ['ICRP-redistribution-permission-unresolved', 'unrecognized-license-claim:ICRP Publication 145; project owner cleared'])
  assert.deepEqual(classifyClaims({ sources: ['INTERGROWTH University of Oxford'], licenses: ['CC BY 4.0'] }), ['Oxford-table-reuse-permission-unresolved'])
})
test('recurses non-GLB assets, inherits MRI manifest claims, hashes bytes deterministically', () => fixture((dir) => {
  mkdirSync(path.join(dir, 'mri'))
  writeFileSync(path.join(dir, 'mri/manifest.json'), JSON.stringify({ source: 'Atlas MRI', license: 'CC0-1.0' }))
  writeFileSync(path.join(dir, 'mri/slice.png'), 'synthetic fixture bytes')
  writeFileSync(path.join(dir, 'unattributed.txt'), 'no claim')
  const actual = inventory(dir)
  assert.deepEqual(actual, inventory(dir))
  assert.equal(actual.entries.length, 3)
  const png = actual.entries.find((entry) => entry.path.endsWith('.png'))
  assert.deepEqual(png.sources, ['Atlas MRI'])
  assert.equal(png.evidencePath, 'mri/manifest.json')
  assert.equal(png.sha256.length, 64)
  assert.equal(png.permissionStatus, 'not-independently-cleared')
  assert.deepEqual(png.findings, [])
  assert.deepEqual(actual.entries[2].findings, ['license-claim-missing', 'source-claim-missing'])
}))
test('replay detects deletion, addition, modified content and modified attribution', () => fixture((dir) => {
  writeFileSync(path.join(dir, 'a.json'), '{"source":"Atlas","license":"CC0-1.0"}')
  const expected = inventory(dir)
  assert.deepEqual(compareInventory(expected, inventory(dir)), [])
  writeFileSync(path.join(dir, 'a.json'), '{"source":"Atlas"}')
  assert.deepEqual(compareInventory(expected, inventory(dir)), ['changed-resource:a.json'])
  rmSync(path.join(dir, 'a.json'))
  writeFileSync(path.join(dir, 'b.txt'), 'unexpected')
  assert.deepEqual(compareInventory(expected, inventory(dir)), ['missing-file:a.json', 'unrecorded-file:b.txt'])
}))
test('replay rejects changed schema, inventory scope and clearance disclaimer even with identical resources', () => fixture((dir) => {
  writeFileSync(path.join(dir, 'a.json'), '{"source":"Atlas","license":"CC0-1.0"}')
  const expected = inventory(dir), same = inventory(dir)
  assert.deepEqual(compareInventory(expected, same), [])
  for (const field of ['schema', 'scope', 'permissionDisclaimer']) {
    const changed = { ...same, [field]: field === 'schema' ? 2 : 'tampered release claim' }
    assert.deepEqual(compareInventory(expected, changed), [`changed-report-header:${field}`])
    const removed = { ...same }
    delete removed[field]
    assert.deepEqual(compareInventory(expected, removed), [`changed-report-header:${field}`])
  }
}))
test('reads a valid GLB JSON chunk and rejects overrun/wrong chunk boundaries', () => {
  const json = Buffer.from('{"nodes":[]}')
  const bytes = Buffer.alloc(20 + json.length)
  bytes.writeUInt32LE(0x46546c67, 0); bytes.writeUInt32LE(2, 4)
  bytes.writeUInt32LE(bytes.length, 8); bytes.writeUInt32LE(json.length, 12)
  bytes.writeUInt32LE(0x4e4f534a, 16); json.copy(bytes, 20)
  assert.deepEqual(glbJson(bytes, 'valid.glb'), { nodes: [] })
  const overrun = Buffer.from(bytes); overrun.writeUInt32LE(json.length + 1, 12)
  assert.throws(() => glbJson(overrun, 'overrun.glb'), /invalid JSON chunk/)
  const wrong = Buffer.from(bytes); wrong.writeUInt32LE(0, 16)
  assert.throws(() => glbJson(wrong, 'wrong.glb'), /invalid JSON chunk/)
})
test('rejects malformed GLBs and invalid JSON rather than silently skipping', () => fixture((dir) => {
  assert.throws(() => glbJson(Buffer.alloc(20), 'bad.glb'), /invalid GLB header/)
  writeFileSync(path.join(dir, 'bad.json'), '{')
  assert.throws(() => inventory(dir), SyntaxError)
}))
test('rejects symlinks instead of following unpublished external data', () => fixture((dir) => {
  symlinkSync(os.tmpdir(), path.join(dir, 'external'))
  assert.throws(() => inventory(dir), /symlink not permitted/)
}))

test('rejects a symlink selected as the root and a regular file root', () => fixture((dir) => {
  const actual = path.join(dir, 'actual'), linked = path.join(dir, 'linked')
  mkdirSync(actual)
  writeFileSync(path.join(actual, 'resource.txt'), 'fixture')
  symlinkSync(actual, linked, 'dir')
  assert.throws(() => inventory(linked), /symlink not permitted/)
  assert.throws(() => inventory(path.join(actual, 'resource.txt')), /root must be a directory/)
}))
test('committed complete published-resource snapshot replays without omissions or drift', () => {
  const root = new URL('../../public/bodyexposure/', import.meta.url)
  const report = new URL('../../bodyexposure/qa_reports/public_resource_inventory.json', import.meta.url)
  const expected = JSON.parse(readFileSync(report, 'utf8'))
  assert.deepEqual(compareInventory(expected, inventory(fileURLToPath(root))), [])
  assert.ok(expected.entries.some((entry) => entry.path.endsWith('.png')))
  assert.ok(expected.entries.some((entry) => entry.path.endsWith('.rig_rom.glb')))
  assert.equal(expected.entries.every((entry) => entry.permissionStatus === 'not-independently-cleared'), true)
})


test('restrictive or negated familiar licence substrings are never recognized as unrestricted claims', () => {
  for (const license of ['not licensed under CC0', 'CC-BY-NC-4.0', 'CC BY 4.0 unless commercially redistributed', 'CC BY 4.0; all rights reserved']) {
    assert.deepEqual(classifyClaims({ sources: ['Atlas'], licenses: [license] }), [`unrecognized-license-claim:${license}`])
  }
  for (const license of ['CC0-1.0', 'CC BY 4.0', 'CC BY-SA 4.0', 'Apache-2.0']) {
    assert.deepEqual(classifyClaims({ sources: ['Atlas'], licenses: [license] }), [])
  }
})
test('PNG cannot follow a manifest symlink before walker reaches the manifest', () => fixture((dir) => {
  writeFileSync(path.join(dir, 'a.png'), 'synthetic fixture')
  // Invalid target makes an accidental pre-check read observably fail with SyntaxError.
  writeFileSync(path.join(dir, 'z-source.json'), '{')
  symlinkSync(path.join(dir, 'z-source.json'), path.join(dir, 'manifest.json'))
  assert.throws(() => inventory(dir), /manifest.json: symlink not permitted/)
}))

test('PNG rejects a manifest directory instead of treating it as a metadata file', () => fixture((dir) => {
  writeFileSync(path.join(dir, 'a.png'), 'synthetic fixture')
  mkdirSync(path.join(dir, 'manifest.json'))
  assert.throws(() => inventory(dir), /manifest must be a regular file/)
}))
