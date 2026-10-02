import assert from 'node:assert/strict'
import { classifyTissue, tissueShading } from '../../src/domains/body-exposure/engine/tissueShading.ts'
import { readFileSync, readdirSync } from 'node:fs'

// Positif: nama material nyata dari aset terkirim.
const cases: [string, string][] = [
  ['Flat_Trapezius', 'muscle'], ['Flat_Flexion', 'muscle'], ['Flat_Tendon', 'tendon'], ['Flat_Ligament', 'tendon'],
  ['Flat_Bone-3', 'bone'], ['Flat_Cartilage', 'cartilage'], ['Flat_Pulmonary artery', 'vessel'], ['Flat_Vein', 'vessel'],
  ['Flat_Nerve', 'nerve'], ['Flat_White matter', 'brain'], ['Flat_Frontal lobe', 'brain'], ['Flat_LCR', 'fluid'],
  ['Flat_Mucosa', 'mucosa'], ['Flat_Intestine', 'mucosa'], ['Flat_Lymph-1', 'gland'], ['Flat_Skin-7', 'skin'], ['Flat_Organ-6', 'viscera'],
]
for (const [name, tissue] of cases) assert.equal(classifyTissue(name), tissue, `${name} must classify as ${tissue}`)

// Negatif: fail closed, tanpa tebakan.
for (const bad of [undefined, null, 42, '', '   ', 'Flat_', 'Text', 'Flat_Zzz']) {
  assert.equal(classifyTissue(bad), 'unknown', `unclassifiable material ${String(bad)} must be unknown`)
}
const unk = tissueShading('Flat_Zzz')
assert.equal(unk.clearcoat, 0, 'unknown tissue must get no gloss effect')
assert.equal(unk.sheen, 0, 'unknown tissue must get no sheen effect')

// Berpasangan: hanya jenis yang berbeda yang mengubah kilap.
assert.ok(tissueShading('Flat_Mucosa').clearcoat > tissueShading('Flat_Bone-3').clearcoat, 'wet mucosa must be glossier than bone')
assert.ok(tissueShading('Flat_Flexion').sheen > 0 && tissueShading('Flat_Bone-3').sheen === 0, 'fibrous muscle has sheen, bone does not')

// Invarian: biologis = dielektrik; nilai dalam rentang fisik.
const all = new Set([...cases.map((c) => c[1]), 'unknown'])
for (const t of all) {
  const s = tissueShading(cases.find((c) => c[1] === t)?.[0] ?? 'Flat_Zzz')
  assert.equal(s.metalness, 0, `${t} must be dielectric (metalness 0)`)
  for (const k of ['roughness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'sheenRoughness'] as const) {
    assert.ok(Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 1, `${t}.${k} must be within [0,1]`)
  }
}
assert.deepEqual(tissueShading('Flat_Tendon'), tissueShading('Flat_Tendon'), 'deterministic')

// Data nyata: setiap material berwarna di aset terkirim harus terklasifikasi atau tercatat unknown, bukan crash.
let named = 0
let unknown = 0
for (const f of readdirSync('public/anatomy').filter((x) => x.endsWith('.glb'))) {
  const b = readFileSync(`public/anatomy/${f}`)
  const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
  for (const m of j.materials as { name?: string }[]) { named += 1; if (classifyTissue(m.name) === 'unknown') unknown += 1 }
}
assert.ok(named > 100, 'shipped materials must be scanned')
assert.ok(unknown / named < 0.35, `too many shipped materials unclassified (${unknown}/${named}); extend rules`)
console.log(`Tissue shading verified: ${cases.length} classes, dielectric invariant, ${named - unknown}/${named} shipped materials classified.`)
