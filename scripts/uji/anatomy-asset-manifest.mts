import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { buildManifest, ACCURACY_STATUSES, provenanceFor } from '../bake/auditAnatomyAssets.mjs'
import { LAYERS } from '../bake/anatomyLayers.mjs'

const path = 'data/anatomy-assets/manifest.json'
assert.ok(existsSync(path), 'the anatomy asset manifest exists (node scripts/bake/audit-anatomy-assets.mjs --write)')
const committed = JSON.parse(readFileSync(path, 'utf8'))
const fresh = await buildManifest()

// Terikat ke GLB yang terkirim: ukuran, hash, jumlah mesh/vertex/segitiga, bounds — semuanya dihitung ulang.
assert.deepEqual(committed, JSON.parse(JSON.stringify(fresh)), 'the manifest matches the shipped GLBs exactly (re-run audit-anatomy-assets.mjs --write after changing a GLB)')
assert.deepEqual(Object.keys(committed.layers), [...LAYERS], 'every shipped layer is audited, in canonical order')

// Totals konsisten dengan lapisan.
for (const k of ['sizeBytes', 'meshCount', 'vertexCount', 'triangleCount', 'materialCount'] as const) {
  assert.equal(Object.values(committed.layers as Record<string, Record<string, number>>).reduce((n, l) => n + l[k], 0), committed.totals[k], `totals.${k} equals the sum over layers`)
}

// Skala: 1 unit = 1 meter, tubuh dewasa tegak. Menangkap GLB yang diekspor dengan skala salah.
for (const [name, l] of Object.entries(committed.layers) as [string, any][]) {
  const [w, h, d] = l.boundsMeters.size
  assert.ok(h > 1.4 && h < 2.0, `${name}: height ${h} m is a plausible adult (units are metres)`)
  assert.ok(w > 0.25 && w < 0.9, `${name}: width ${w} m is plausible`)
  assert.ok(d > 0.1 && d < 0.5, `${name}: depth ${d} m is plausible`)
  // Pernyataan jujur: tidak ada klaim validasi/revisi-dipin tanpa bukti.
  assert.equal(l.validated, false, `${name}: no layer is claimed validated without review evidence`)
  assert.ok(ACCURACY_STATUSES.includes(l.accuracyStatus), `${name}: accuracyStatus is from the allowed vocabulary`)
  assert.notEqual(l.accuracyStatus, 'source-backed-reviewed', `${name}: "reviewed" needs recorded human review, which does not exist`)
  assert.equal(l.educationalOnly, true, `${name}: educational use only`)
  assert.match(l.licenseNote, /pengecualian/, `${name}: the upstream asset-level licence exceptions are stated, not hidden`)
}

// Registri sumber ada dan cocok.
const reg = JSON.parse(readFileSync(provenanceFor().sourceRegistryFile, 'utf8'))
assert.equal(reg.id, provenanceFor().sourceRegistryId, 'the manifest points at a real source-registry entry')

// Tripwire: revisi tak-dipin harus tetap benar. Bila CREDITS memuat hash 40-heks, manifest harus diperbarui.
const credits = readFileSync('public/anatomy/CREDITS.txt', 'utf8')
assert.equal(/\b[0-9a-f]{40}\b/.test(credits), false, 'CREDITS now pins a 40-hex revision: set revisionPinned/provenance in auditAnatomyAssets.mjs and re-bake')
assert.ok(Object.values(committed.layers).every((l: any) => l.revisionPinned === false), 'revisionPinned stays false until a revision is actually recorded')

console.log(`Anatomy asset manifest verified: ${LAYERS.length} layers, ${committed.totals.triangleCount.toLocaleString()} triangles, ${(committed.totals.sizeBytes / 1048576).toFixed(1)} MB, bound to the shipped GLBs.`)
