// airwayNav + airwayIslands: scope route through the tree and atlas subsegmental pieces, on synthetic tubes with known
// geometry (positive, negative, boundary, paired cases). Deterministic, no DOM.
import assert from 'node:assert/strict'
import { buildAirwayTree, type AirwayBranchDef } from '../../src/domains/body-exposure/engine/endoscopy/airwayTree.ts'
import { airwayRoute, indexPath, nextAirwayPath, routeBranchAt } from '../../src/domains/body-exposure/engine/endoscopy/airwayNav.ts'
import { islandTree, meshIslands, withSubsegments } from '../../src/domains/body-exposure/engine/endoscopy/airwayIslands.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

function tabung(a: number[], b: number[], r: number): Float32Array {
  const out: number[] = []
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const L = Math.hypot(d[0], d[1], d[2]); const u = d.map((v) => v / L)
  const t = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]
  const p1 = [u[1] * t[2] - u[2] * t[1], u[2] * t[0] - u[0] * t[2], u[0] * t[1] - u[1] * t[0]]
  const n1 = Math.hypot(p1[0], p1[1], p1[2]); for (let i = 0; i < 3; i++) p1[i] /= n1
  const p2 = [u[1] * p1[2] - u[2] * p1[1], u[2] * p1[0] - u[0] * p1[2], u[0] * p1[1] - u[1] * p1[0]]
  for (let i = 0; i < 30; i++) for (let k = 0; k < 16; k++) {
    const s = i / 29, g = (k / 16) * Math.PI * 2
    for (let c = 0; c < 3; c++) out.push(a[c] + d[c] * s + r * (Math.cos(g) * p1[c] + Math.sin(g) * p2[c]))
  }
  return new Float32Array(out)
}

const geom: Record<string, Float32Array> = {
  t: tabung([0, 0.2, 0], [0, 0.05, 0], 0.009),
  r: tabung([-0.06, -0.01, 0], [-0.005, 0.045, 0], 0.006),
  l: tabung([0.07, -0.02, 0], [0.005, 0.045, 0], 0.006),
}
const defs: AirwayBranchDef[] = [
  { id: 't', parent: null, code: 'T', name: 'Trachea' },
  { id: 'r', parent: 't', code: 'R', name: 'Right' },
  { id: 'l', parent: 't', code: 'L', name: 'Left' },
]
const res = buildAirwayTree(defs, (id) => geom[id], { x: 0, y: 0.25, z: 0 })
if (!res.ok) throw new Error('synthetic tree failed to build')
const B = res.branches

gagal('rute_rantai_dari_akar_dan_batas_cabang', () => {
  assert.deepEqual(indexPath(B, 2), [0, 2])
  assert.deepEqual(indexPath(B, 9), [])
  const r = airwayRoute(B, [0, 1])!
  assert.ok(r)
  assert.equal(r.starts[0], 0)
  assert.ok(r.ends[0] < r.starts[1] + 1e-12 && r.starts[1] < r.ends[1])
  assert.equal(r.profile.length, r.ends[1])
  assert.equal(r.slices.length, B[0].slices.length + B[1].slices.length)
  assert.equal(routeBranchAt(r, 0.01), 0)
  assert.equal(routeBranchAt(r, r.ends[1] - 0.001), 1)
  assert.equal(routeBranchAt(r, Number.NaN), 0)
})

gagal('rute_menolak_jalur_bukan_rantai', () => {
  assert.equal(airwayRoute(B, []), null)
  assert.equal(airwayRoute(B, [1]), null, 'must start at the root')
  assert.equal(airwayRoute(B, [0, 1, 2]), null, 'left is not a child of right')
  assert.equal(airwayRoute(B, [0, 7]), null)
})

gagal('memilih_cabang_dengan_bidikan_hanya_di_zona', () => {
  const r = airwayRoute(B, [0, 1])!
  const end = r.ends[0]
  // Far from the carina, aiming left changes nothing; near it, the aimed child becomes the next branch.
  assert.equal(nextAirwayPath(B, r, 0.02, 2, -1), null)
  assert.deepEqual(nextAirwayPath(B, r, end - 0.005, 2, -1), [0, 2])
  // A child picked by name wins over aim, anywhere in the parent.
  assert.deepEqual(nextAirwayPath(B, r, 0.02, 1, 2), [0, 2])
  // Paired: once the tip is past the parent's end it is entering the next branch; neither aim nor name switches it.
  assert.equal(nextAirwayPath(B, r, r.starts[1] + 0.002, 2, 2), null)
})

gagal('mundur_memotong_jalur_dan_daun_tanpa_lanjutan', () => {
  const r = airwayRoute(B, [0, 1])!
  // In a terminal branch the route is the chain to it, nothing beyond.
  assert.equal(nextAirwayPath(B, r, r.ends[1] - 0.001, -1, -1), null)
  // A route that ends at the trachea gains its default next child.
  const t = airwayRoute(B, [0])!
  assert.deepEqual(nextAirwayPath(B, t, 0.01, -1, -1), [0, 1])
})

gagal('pulau_mesh_dipisah_dan_las_jahitan', () => {
  const a = tabung([0, 0, 0], [0, 0.03, 0], 0.003), b = tabung([0.05, 0, 0], [0.05, 0.03, 0], 0.003)
  const both = new Float32Array([...a, ...b])
  // Non-indexed "triangles" that never cross the two tubes: each tube's own vertices joined in runs of 3.
  const idx: number[] = []
  for (const off of [0, a.length / 3]) for (let i = 0; i + 2 < a.length / 3; i++) idx.push(off + i, off + i + 1, off + i + 2)
  assert.equal(meshIslands(both, idx).length, 2)
  // Same tube duplicated at the same place: welded into one piece.
  assert.equal(meshIslands(new Float32Array([...a, ...a]), [...idx.slice(0, idx.length / 2), ...idx.slice(0, idx.length / 2).map((v) => v + a.length / 3)]).length, 1)
  assert.deepEqual(meshIslands(new Float32Array(), null), [])
})

// A segmental tube going up from the origin, a side branch leaving it half-way, and a tiny one off its end.
const origin = { x: 0, y: 0, z: 0 }
const trunk = tabung([0, 0.002, 0], [0, 0.04, 0], 0.003)
const side = tabung([0.002, 0.02, 0], [0.025, 0.035, 0], 0.002) // starts on the trunk's wall at mid-shaft
const tip = tabung([0, 0.042, 0], [0, 0.055, 0.008], 0.0015)

gagal('pohon_pulau_memotong_induk_di_titik_cabang', () => {
  const pieces = islandTree(origin, [side, tip, trunk])!
  assert.ok(pieces)
  // Trunk proximal piece, then its continuation and the side branch, then the tip off the continuation.
  assert.equal(pieces[0].parent, -1)
  assert.ok(pieces[0].slices[0].y < 0.01, 'first piece starts at the origin')
  assert.ok(Math.abs(pieces[0].slices[pieces[0].slices.length - 1].y - 0.02) < 0.006, 'trunk is cut where the side branch leaves')
  const kids0 = pieces.filter((p) => p.parent === 0)
  assert.equal(kids0.length, 2, 'continuation + side branch')
  assert.ok(kids0.some((p) => p.slices[p.slices.length - 1].x > 0.015), 'one child is the side branch')
  const cont = pieces.findIndex((p, i) => p.parent === 0 && p.slices[p.slices.length - 1].x < 0.01 && i > 0)
  assert.equal(pieces.filter((p) => p.parent === cont).length, 1, 'tip hangs off the continuation')
  assert.deepEqual(islandTree(origin, [side, tip, trunk]), pieces, 'deterministic')
})

gagal('pohon_pulau_menolak_masukan_tidak_sah', () => {
  assert.equal(islandTree(origin, []), null)
  assert.equal(islandTree({ x: Number.NaN, y: 0, z: 0 }, [trunk]), null)
  assert.equal(islandTree(origin, [new Float32Array(9)]), null, 'too few vertices for a centre line')
  assert.equal(islandTree(origin, [trunk], 0), null)
})

gagal('subsegmen_menggantikan_daun_dan_kode_urut_atlas', () => {
  // The pieces replace the whole right bronchus, so they start where it leaves the trachea.
  const end = B[0].slices[B[0].slices.length - 1]
  const move = (p: Float32Array) => p.map((v, i) => v + [end.x, end.y, end.z][i % 3])
  const out = withSubsegments(B, (b) => (b.id === 'r' ? [move(trunk), move(side), move(tip)] : null))
  assert.equal(out.length, B.length + 3)
  assert.equal(B[1].children.length, 0, 'input not mutated')
  assert.deepEqual(out[1].children.length, 2)
  assert.deepEqual(out.slice(3).map((b) => b.code), ['R-1', 'R-2', 'R-3'])
  assert.ok(out.slice(3).every((b) => b.parent < out.indexOf(b) && b.slices.every((s) => s.r <= Math.min(...out[b.parent].slices.map((q) => q.r)) + 1e-12)))
  assert.ok(/atlas no\. 1/.test(out[3].name) && !/[abc]\)/.test(out[3].name), 'no Boyden letter claimed')
  // Paired negative: a single island or none leaves the leaf unchanged.
  assert.equal(withSubsegments(B, () => [trunk]).length, B.length)
  assert.equal(withSubsegments(B, () => null).length, B.length)
  // Route reaches a subsegment.
  const leaf = out.findIndex((b) => b.code === 'R-3')
  assert.ok(airwayRoute(out, indexPath(out, leaf)))
})

console.log('airway-nav: chained route with branch bounds, non-chains rejected, aim only near the end / name always / never mid-entry, leaf and default child, mesh islands split and welded, island tree cut at branch points, invalid islands rejected, subsegments appended in atlas order without Boyden letters')
