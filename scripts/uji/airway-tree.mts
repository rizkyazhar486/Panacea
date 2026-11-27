// airwayTree: branching bronchoscopy navigation on synthetic tubes with known geometry (positive, negative, boundary,
// paired), plus the textbook tree definition checked for structure (one root, parents first, 19 segmental bronchi).
import assert from 'node:assert/strict'
import {
  buildAirwayTree, chooseChild, airwayPath, airwayCapsules, nearestCapsules, branchDirection,
  type AirwayBranchDef,
} from '../../src/domains/body-exposure/engine/endoscopy/airwayTree.ts'
import { BRONCHIAL_TREE } from '../../src/domains/body-exposure/data/bronchialTree.ts'

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

// Trachea straight down along -y, splitting into a right (x<0) and a left (x>0) bronchus. Children are defined
// distal-to-proximal on purpose: the builder must orient them from the parent's end.
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
const top = { x: 0, y: 0.25, z: 0 }
const res = buildAirwayTree(defs, (id) => geom[id], top)

gagal('membangun_pohon_y_dan_arah_cabang_dari_induk', () => {
  assert.equal(res.ok, true)
  if (!res.ok) return
  const [t, r, l] = res.branches
  assert.deepEqual(t.children, [1, 2])
  assert.equal(r.parent, 0)
  assert.ok(t.slices[0].y > t.slices[t.slices.length - 1].y, 'trachea runs downward from the top')
  assert.ok(r.slices[0].x > r.slices[r.slices.length - 1].x, 'right bronchus flipped to start at the carina')
  assert.ok(l.slices[0].x < l.slices[l.slices.length - 1].x, 'left bronchus starts at the carina')
  assert.ok(branchDirection(r)!.x < 0 && branchDirection(l)!.x > 0)
})

gagal('memilih_cabang_yang_dibidik', () => {
  if (!res.ok) throw new Error('tree')
  const tip = res.branches[0].slices[res.branches[0].slices.length - 1]
  assert.equal(chooseChild(res.branches, 0, tip, { x: -1, y: -1, z: 0 }), 1, 'aim right-down → right bronchus')
  assert.equal(chooseChild(res.branches, 0, tip, { x: 1, y: -1, z: 0 }), 2, 'aim left-down → left bronchus')
  // Paired negative: aiming back up the trachea selects nothing (both openings are behind the tip).
  assert.equal(chooseChild(res.branches, 0, tip, { x: 0, y: 1, z: 0 }), -1)
})

gagal('pilih_cabang_menolak_masukan_tidak_sah', () => {
  if (!res.ok) throw new Error('tree')
  const tip = res.branches[0].slices[0]
  assert.equal(chooseChild(res.branches, 0, tip, { x: 0, y: 0, z: 0 }), -1, 'zero look vector')
  assert.equal(chooseChild(res.branches, 0, { x: Number.NaN, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }), -1)
  assert.equal(chooseChild(res.branches, 1, tip, { x: -1, y: 0, z: 0 }), -1, 'a terminal branch has no child')
  assert.equal(chooseChild(res.branches, 99, tip, { x: 0, y: -1, z: 0 }), -1, 'unknown branch')
})

gagal('jalur_breadcrumb', () => {
  if (!res.ok) throw new Error('tree')
  assert.deepEqual(airwayPath(res.branches, 2), ['T', 'L'])
  assert.deepEqual(airwayPath(res.branches, 0), ['T'])
  assert.deepEqual(airwayPath(res.branches, -1), [])
})

gagal('menolak_definisi_pohon_tidak_sah', () => {
  const g = (id: string) => geom[id] ?? geom.t
  assert.deepEqual(buildAirwayTree([], g, top), { ok: false, reason: 'no-root' })
  assert.deepEqual(buildAirwayTree([{ id: 'r', parent: 't', code: 'R', name: 'R' }], g, top), { ok: false, reason: 'unknown-parent', id: 'r' })
  assert.deepEqual(buildAirwayTree([defs[0], { ...defs[0] }], g, top), { ok: false, reason: 'duplicate-id', id: 't' })
  assert.deepEqual(buildAirwayTree([defs[0], { id: 'x', parent: null, code: 'X', name: 'X' }], g, top), { ok: false, reason: 'multiple-roots', id: 'x' })
  assert.deepEqual(buildAirwayTree([defs[0], defs[1]], (id) => (id === 'r' ? new Float32Array(9) : geom[id]), top), { ok: false, reason: 'geometry', id: 'r' })
})

gagal('kapsul_menutup_percabangan_dan_terdekat_terurut', () => {
  if (!res.ok) throw new Error('tree')
  const caps = airwayCapsules(res.branches)
  const conn = caps.filter((c) => c.branch > 0 && c.s0 === 0 && c.a === res.branches[0].slices[res.branches[0].slices.length - 1])
  assert.equal(conn.length, 2, 'one connector from the carina into each child')
  const tip = res.branches[0].slices[res.branches[0].slices.length - 1]
  const near = nearestCapsules(caps, tip, 4)
  assert.equal(near.length, 4)
  assert.deepEqual(near, nearestCapsules(caps, tip, 4), 'deterministic')
  assert.deepEqual(nearestCapsules(caps, tip, 0), [])
})

gagal('pohon_bronkus_buku_teks_terstruktur', () => {
  const ids = new Set<string>()
  let roots = 0
  for (const d of BRONCHIAL_TREE) {
    assert.ok(!ids.has(d.id), `duplicate ${d.id}`)
    if (d.parent === null) roots++
    else assert.ok(ids.has(d.parent), `${d.id} listed before its parent`)
    ids.add(d.id)
  }
  assert.equal(roots, 1)
  const leaves = BRONCHIAL_TREE.filter((d) => !BRONCHIAL_TREE.some((c) => c.parent === d.id))
  assert.equal(leaves.length, 19, '10 right + 9 left segmental bronchi (LB1+2 combined)')
  assert.ok(leaves.every((d) => /^[RL]B\d/.test(d.code)))
})

console.log('airway-tree: Y tree oriented from the carina, aimed child chosen (none behind the tip), breadcrumb, invalid trees rejected by reason, carina closed by connectors, textbook tree has 1 root and 19 segmental bronchi')
