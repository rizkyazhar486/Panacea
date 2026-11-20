import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MOTION_GROUP_NODES, motionGroupFor, type MotionGroup } from '../../src/domains/body-exposure/engine/body-motion/motionGroups.ts'

// Membaca berkas GLB yang benar-benar dikirim ke pengguna (fixture di dalam repo, tanpa jaringan).
type Node = { name?: string; mesh?: number; children?: number[] }
function glbNodes(layer: string): Node[] {
  const b = readFileSync(new URL(`../../public/anatomy/${layer}.glb`, import.meta.url))
  const len = b.readUInt32LE(12)
  return JSON.parse(b.subarray(20, 20 + len).toString('utf8')).nodes as Node[]
}
/** Untuk setiap mesh: rantai nama dari mesh itu sendiri ke leluhurnya (terdekat dulu), persis seperti viewer menelusuri. */
function meshChains(layer: string): string[][] {
  const nodes = glbNodes(layer)
  const parent = new Map<number, number>()
  nodes.forEach((n, i) => (n.children ?? []).forEach((c) => parent.set(c, i)))
  const chains: string[][] = []
  nodes.forEach((n, i) => {
    if (n.mesh === undefined) return
    const chain = [n.name ?? '']
    let k = i
    while (parent.has(k)) { k = parent.get(k)!; chain.push(nodes[k].name ?? '') }
    chains.push(chain)
  })
  return chains
}

// ── Positif: setiap nama yang dikurasi ada di aset, dan setiap kelompok menggerakkan mesh sungguhan ────────
const counts: Record<MotionGroup, number> = { heart: 0, lungs: 0, kidneys: 0, greatVessels: 0 }
for (const [group, { layer, names }] of Object.entries(MOTION_GROUP_NODES) as [MotionGroup, { layer: string; names: readonly string[] }][]) {
  const all = new Set(glbNodes(layer).map((n) => n.name ?? ''))
  for (const name of names) assert.ok(all.has(name), `${group}: node "${name}" tidak ada di ${layer}.glb (aset berubah?)`)
}
for (const layer of ['cardiovascular', 'visceral'] as const) {
  for (const chain of meshChains(layer)) {
    const g = motionGroupFor(layer, chain)
    if (g) counts[g]++
  }
}
for (const [g, n] of Object.entries(counts)) assert.ok(n > 0, `kelompok ${g} tidak menggerakkan satu mesh pun`)
// Paru di aset ini adalah mesh tanpa nama di bawah node lobus: harus terjangkau lewat leluhur.
assert.equal(counts.lungs, 5, 'lima lobus paru, satu mesh per lobus')
assert.equal(counts.kidneys, 2, 'ginjal kiri dan kanan')
assert.equal(motionGroupFor('visceral', ['', 'Middle lobe of right lung']), 'lungs')
assert.equal(motionGroupFor('cardiovascular', ['Left ventricle']), 'heart')
assert.equal(motionGroupFor('cardiovascular', ['', 'Abdominal aorta']), 'greatVessels')

// ── Negatif: tidak menebak dari kata kunci, lapisan harus cocok ─────────────────────────────────────────
// Bronkus dan pleura memuat kata "lung"/dekat paru, tetapi bukan parenkim yang mengembang.
assert.equal(motionGroupFor('visceral', ['Anterior basal segmental bronchus of left lung (BVIII)']), null)
assert.equal(motionGroupFor('visceral', ['Pleura']), null)
assert.equal(motionGroupFor('cardiovascular', ['Anterior vein of left lung']), null)
assert.equal(motionGroupFor('cardiovascular', ['Circumflex artery of heart']), null, 'arteri koroner bukan ruang jantung')
// Nama benar di lapisan salah → null (berpasangan dengan kasus positif di atas).
assert.equal(motionGroupFor('visceral', ['Left ventricle']), null)
assert.equal(motionGroupFor('cardiovascular', ['Kidney.l']), null)
assert.equal(motionGroupFor('skeletal', ['Middle lobe of right lung']), null)
// Huruf/spasi berbeda bukan nama yang sama.
assert.equal(motionGroupFor('cardiovascular', ['left ventricle']), null)
assert.equal(motionGroupFor('cardiovascular', ['Left ventricle ']), null)
// Masukan tak sah.
assert.equal(motionGroupFor(null, ['Left ventricle']), null)
assert.equal(motionGroupFor('cardiovascular', []), null)
assert.equal(motionGroupFor('cardiovascular', null as unknown as string[]), null)
assert.equal(motionGroupFor('cardiovascular', [42, undefined, 'Left ventricle']), 'heart', 'entri bukan string dilewati')

// Mesh tak bernama yang leluhurnya tidak dikurasi tetap diam.
const unmapped = meshChains('visceral').filter((c) => motionGroupFor('visceral', c) === null)
assert.ok(unmapped.some((c) => c.includes('Liver')), 'hati tidak dikurasi untuk bergerak di irisan ini')

// Determinisme.
assert.deepEqual(meshChains('visceral').map((c) => motionGroupFor('visceral', c)), meshChains('visceral').map((c) => motionGroupFor('visceral', c)))

console.log(`body-motion-groups: OK ${JSON.stringify(counts)}`)
