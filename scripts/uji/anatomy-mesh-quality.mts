import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { LAYERS } from '../bake/anatomyLayers.mjs'

// Hasil audit Blender (bpy) disimpan di repositori karena Blender tidak ada di CI. Gate ini memastikan
// hasilnya (1) masih milik GLB yang terkirim, (2) cocok dengan audit Three.js (dua alat independen),
// dan (3) tetap jujur: deskriptif, tanpa klaim bahwa anatomi benar.
const qPath = 'data/anatomy-assets/mesh-quality.json'
assert.ok(existsSync(qPath), 'the Blender mesh-quality report exists (scripts/blender/run_mesh_audit.sh)')
const q = JSON.parse(readFileSync(qPath, 'utf8'))
const manifest = JSON.parse(readFileSync('data/anatomy-assets/manifest.json', 'utf8'))

assert.match(q.blenderVersion, /^\d+\.\d+/, 'the report records the Blender version that produced it')
assert.match(q.purpose, /Deskriptif/, 'the report states that it is descriptive, not an anatomy verdict')
assert.deepEqual(Object.keys(q.layers), [...LAYERS], 'every shipped layer is audited, in canonical order')

for (const layer of LAYERS) {
  const b = q.layers[layer]
  const m = manifest.layers[layer]
  assert.equal(b.sourceSha256, m.sha256, `${layer}: the Blender audit was run on the GLB that ships now (re-run scripts/blender/run_mesh_audit.sh after changing it)`)
  // Dua alat independen: jumlah vertex harus persis sama; segitiga boleh beda sangat kecil (Blender membuang muka degenerat saat impor).
  assert.equal(b.vertices, m.vertexCount, `${layer}: Blender and Three.js agree on the vertex count`)
  const tol = Math.max(16, Math.ceil(m.triangleCount * 0.0001))
  assert.ok(Math.abs(b.faces - m.triangleCount) <= tol, `${layer}: Blender faces ${b.faces} vs Three.js triangles ${m.triangleCount} differ by more than ${tol}`)
  for (const k of ['nonManifoldEdges', 'boundaryEdges', 'looseVertices', 'zeroAreaFaces', 'meshesWithoutFaces', 'duplicateObjectNames'] as const) {
    assert.ok(Number.isInteger(b[k]) && b[k] >= 0, `${layer}.${k} is a non-negative count`)
  }
  assert.equal(b.looseVertices, 0, `${layer}: no loose vertices`)
  assert.equal(b.meshesWithoutFaces, 0, `${layer}: no mesh without faces`)
  assert.equal(b.duplicateObjectNames, 0, `${layer}: object names are unique after import`)
  assert.ok(b.nonManifoldEdges <= b.edges * 0.001, `${layer}: non-manifold edges stay a negligible fraction of all edges`)
  assert.ok(b.meshesWithNonManifold <= b.meshes, `${layer}: counts are internally consistent`)
}
const total = (k: string) => LAYERS.reduce((n, l) => n + q.layers[l][k], 0)
console.log(`Blender mesh quality verified (Blender ${q.blenderVersion}): ${total('faces').toLocaleString()} faces, ${total('nonManifoldEdges')} non-manifold edges, ${total('zeroAreaFaces').toLocaleString()} zero-area faces, vertex counts identical to the Three.js audit.`)
