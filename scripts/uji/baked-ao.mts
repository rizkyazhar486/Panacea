import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import * as THREE from 'three'
import { matchBakedAo, aoToVertexColors } from '../../src/domains/body-exposure/engine/bakedAo.ts'
import { bakeLayerAo } from '../bake/vertexAo.mjs'
import { LAYERS, loadLayerMeshes, sha256 } from '../bake/anatomyLayers.mjs'

// ── Pencocokan sidecar: positif + satu negatif per aturan (hanya satu kondisi berbeda) ──
const entry = { vertexTotal: 7, meshes: [{ i: 0, name: 'A', vertexCount: 3, offset: 0 }, { i: 1, name: 'B', vertexCount: 4, offset: 3 }] }
const loaded = [{ name: 'A', vertexCount: 3 }, { name: 'B', vertexCount: 4 }]
assert.deepEqual(matchBakedAo(entry, loaded, 7), { ok: true }, 'an exact match is accepted')
assert.deepEqual(matchBakedAo(entry, loaded.slice(0, 1), 7), { ok: false, reason: 'mesh-count' }, 'a missing mesh is refused')
assert.deepEqual(matchBakedAo(entry, [loaded[0], { name: 'C', vertexCount: 4 }], 7), { ok: false, reason: 'mesh-name' }, 'a renamed mesh is refused')
assert.deepEqual(matchBakedAo(entry, [loaded[0], { name: 'B', vertexCount: 5 }], 7), { ok: false, reason: 'vertex-count' }, 'a changed vertex count is refused')
assert.deepEqual(matchBakedAo(entry, loaded, 8), { ok: false, reason: 'bin-size' }, 'a wrong-sized sidecar is refused')
assert.deepEqual(matchBakedAo({ ...entry, meshes: [entry.meshes[0], { ...entry.meshes[1], offset: 4 }] }, loaded, 7), { ok: false, reason: 'offset' }, 'a gap in offsets is refused')
assert.deepEqual(matchBakedAo({ ...entry, meshes: [entry.meshes[0], { ...entry.meshes[1], i: 5 }] }, loaded, 7), { ok: false, reason: 'mesh-index' }, 'a wrong mesh index is refused')
assert.deepEqual(matchBakedAo({ ...entry, vertexTotal: 9 }, loaded, 9), { ok: false, reason: 'total' }, 'a total that disagrees with the meshes is refused')
assert.deepEqual(aoToVertexColors(new Uint8Array([10, 20, 30, 40]), 1, 2), new Uint8Array([20, 20, 20, 30, 30, 30]), 'AO expands to grey RGB for the requested slice')
assert.deepEqual(aoToVertexColors(new Uint8Array([100]), 0, 1, 0), new Uint8Array([255, 255, 255]), 'strength 0 means no occlusion at all')
assert.deepEqual(aoToVertexColors(new Uint8Array([100]), 0, 1, 1), new Uint8Array([100, 100, 100]), 'strength 1 is the baked value')
assert.deepEqual(aoToVertexColors(new Uint8Array([100]), 0, 1, 0.6), new Uint8Array([162, 162, 162]), 'strength 0.6 pulls 100 toward white: 255 - 0.6 × 155')
assert.throws(() => aoToVertexColors(new Uint8Array(1), 0, 1, 1.5), RangeError, 'strength above 1 is rejected')
assert.throws(() => aoToVertexColors(new Uint8Array(1), 0, 1, -0.1), RangeError, 'negative strength is rejected')
assert.throws(() => aoToVertexColors(new Uint8Array(1), 0, 1, Number.NaN), RangeError, 'NaN strength is rejected')
assert.throws(() => aoToVertexColors(new Uint8Array(4), 3, 2), RangeError, 'a slice past the end is rejected')
assert.throws(() => aoToVertexColors(new Uint8Array(4), -1, 2), RangeError, 'a negative offset is rejected')

// ── Fisika: kasus emas yang bisa dihitung tangan ─────────────────────────────────────
const mk = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); m.updateMatrixWorld(true); return m }
const plane = () => { const g = new THREE.PlaneGeometry(1, 1, 8, 8); g.rotateX(-Math.PI / 2); return g }
const flat = bakeLayerAo([mk(plane())], { radiusFraction: 0.1 })
assert.ok(flat.perMesh[0].every((v: number) => v === 255), 'an open flat surface is fully unoccluded (255)')
const sphere = bakeLayerAo([mk(new THREE.SphereGeometry(0.5, 24, 16))], { radiusFraction: 0.1 })
assert.ok(Math.min(...sphere.perMesh[0]) >= 250, 'the outside of a convex sphere is (almost) unoccluded')
const wall = new THREE.PlaneGeometry(1, 1, 8, 8); wall.rotateY(Math.PI / 2); wall.translate(-0.5, 0.5, 0)
const floor = mk(plane())
const groove = bakeLayerAo([floor, mk(wall)], { radiusFraction: 0.1 })
const pos = floor.geometry.attributes.position
let near = 255, far = 0
for (let i = 0; i < pos.count; i += 1) {
  if (Math.abs(pos.getX(i) + 0.5) < 1e-6) near = Math.min(near, groove.perMesh[0][i])
  if (Math.abs(pos.getX(i) - 0.5) < 1e-6) far = Math.max(far, groove.perMesh[0][i])
}
assert.ok(near < 140, `a floor point at the foot of a wall is clearly occluded (got ${near})`)
assert.equal(far, 255, 'the same floor far from the wall is unoccluded (paired case: only the distance differs)')
assert.ok(near >= 102, 'occlusion never goes below the configured floor (0.4 × 255)')
const again = bakeLayerAo([floor, mk(wall)], { radiusFraction: 0.1 })
assert.deepEqual(Buffer.from(again.perMesh[0]), Buffer.from(groove.perMesh[0]), 'two bakes are byte-identical (deterministic)')
// Radius dihormati: titik lantai 0.125 dari dinding (tinggi model = 1) hanya tertutup bila radius > 0.125.
const midAt = (r: { perMesh: Uint8Array[] }) => { let m = 255; for (let i = 0; i < pos.count; i += 1) if (Math.abs(pos.getX(i) + 0.375) < 1e-6) m = Math.min(m, r.perMesh[0][i]); return m }
assert.ok(midAt(bakeLayerAo([floor, mk(wall)], { radiusFraction: 0.2 })) < 255, 'a radius reaching the wall (0.2 > 0.125) occludes the point')
assert.equal(midAt(bakeLayerAo([floor, mk(wall)], { radiusFraction: 0.1 })), 255, 'a radius short of the wall (0.1 < 0.125) leaves the same point unoccluded')

// ── Penolakan masukan ────────────────────────────────────────────────────────────────
const one = [mk(plane())]
assert.throws(() => bakeLayerAo(one, { samples: 3 }), RangeError, 'too few samples')
assert.throws(() => bakeLayerAo(one, { samples: 2.5 }), RangeError, 'non-integer samples')
assert.throws(() => bakeLayerAo(one, { radiusFraction: 0 }), RangeError, 'zero radius')
assert.throws(() => bakeLayerAo(one, { floor: 1 }), RangeError, 'floor of 1 would disable the effect silently')
assert.throws(() => bakeLayerAo([]), RangeError, 'no meshes')
const noNormal = plane(); noNormal.deleteAttribute('normal')
assert.throws(() => bakeLayerAo([mk(noNormal)]), /refusing to guess/, 'a mesh without normals is refused, not guessed')

// ── Sidecar terkirim: terikat ke GLB sumbernya dan bukan data kosong ─────────────────
const dir = 'public/anatomy/ao'
assert.ok(existsSync(`${dir}/manifest.json`), 'the shipped AO manifest exists')
const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'))
for (const layer of LAYERS) {
  const e = manifest.layers[layer]
  assert.ok(e, `layer ${layer} has an AO entry`)
  const glb = readFileSync(`public/anatomy/${layer}.glb`)
  assert.equal(sha256(glb), e.sourceSha256, `${layer}: the AO was baked from the GLB that ships now (re-bake if the GLB changed)`)
  const bin = readFileSync(`${dir}/${e.binFile}`)
  assert.equal(sha256(bin), e.binSha256, `${layer}: the AO file matches its recorded hash`)
  const { meshes } = await loadLayerMeshes(`public/anatomy/${layer}.glb`)
  const m = matchBakedAo(e, meshes.map((x: THREE.Mesh) => ({ name: x.name, vertexCount: x.geometry.attributes.position.count })), bin.length)
  assert.deepEqual(m, { ok: true }, `${layer}: every mesh of the shipped GLB matches the sidecar`)
  let min = 255, sum = 0
  for (const v of bin) { if (v < min) min = v; sum += v }
  const mean = sum / bin.length
  let varSum = 0
  for (const v of bin) varSum += (v - mean) ** 2
  const sd = Math.sqrt(varSum / bin.length)
  assert.ok(min >= Math.round(manifest.algorithm.floor * 255), `${layer}: no value below the floor`)
  assert.ok(mean > 150 && mean < 255, `${layer}: mean AO ${mean.toFixed(1)} is plausible (not all-white, not all-dark)`)
  assert.ok(sd > 4, `${layer}: AO varies across the surface (sd ${sd.toFixed(1)}); a constant sidecar is not occlusion`)
}
const credits = readFileSync('public/anatomy/CREDITS.txt', 'utf8')
assert.match(credits, /files in ao\/[\s\S]{0,400}derivative works[\s\S]{0,120}CC BY-SA 4\.0/, 'CREDITS names the AO sidecar as a CC BY-SA 4.0 derivative (files are not licensed by proximity)')
console.log(`Baked AO verified: matching rules, physical golden cases, determinism, and ${LAYERS.length} shipped layers bound to their GLBs.`)
