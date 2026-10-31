import assert from 'node:assert/strict'
import { territoryForArtery, trunkForSegment, AHA17_SOURCE, AHA17_LIMITATIONS, AHA17_SEGMENT_COUNT } from '../../src/domains/body-exposure/engine/vascularTerritoryEngine.ts'

// golden: tabel persis seperti tercetak pada teks penuh yang dibaca (PMC7416454, Methods)
const lca = territoryForArtery('LCA', 'right'); assert.ok(lca.ok)
assert.deepEqual([...lca.segments], [1, 2, 5, 6, 7, 8, 11, 12, 13, 14, 17])
const rca = territoryForArtery('RCA', 'right'); assert.ok(rca.ok)
assert.deepEqual([...rca.segments], [3, 4, 9, 10, 15])
assert.equal(lca.truthClass, 'reference'); assert.match(lca.label, /not patient-specific/)

// partisi: tidak ada segmen ganda; segmen 16 tidak ditetapkan oleh sumber (16 dari 17 segmen terpetakan)
const all = [...lca.segments, ...rca.segments]
assert.equal(new Set(all).size, all.length); assert.equal(all.length, 16)
const missing = Array.from({ length: AHA17_SEGMENT_COUNT }, (_, i) => i + 1).filter((s) => !all.includes(s)); assert.deepEqual(missing, [16])

// dominansi: tabel TIDAK berubah dan hasil mengatakan itu (tidak ada tebakan varian); semua nilai dominansi sah memberi hasil identik
for (const d of ['right', 'left', 'codominant', 'unknown'] as const) {
  const r = territoryForArtery('LCA', d); assert.ok(r.ok)
  assert.deepEqual([...r.segments], [...lca.segments]); assert.equal(r.dominance, d); assert.equal(r.dominanceAdjusted, false); assert.equal(r.variantTablesAvailable, false)
}
const defaultDominance = territoryForArtery('RCA'); assert.ok(defaultDominance.ok); assert.equal(defaultDominance.dominance, 'unknown')

// batas cabang: LAD/LCx ditolak dengan alasan bernama, bukan diisi dari ingatan
for (const b of ['LAD', 'LCx'] as const) {
  const r = territoryForArtery(b, 'right'); assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.reason, 'branch-level-not-verified'); assert.equal('segments' in r, false)
}

// negatif berpasangan: hanya satu kondisi yang berbeda dari kasus golden
const reasonOf = (r: { ok: boolean; reason?: string }) => (r.ok ? 'ok' : r.reason)
for (const bad of ['lca', 'LCA ', '', null, undefined, 7, {}, 'RCx']) assert.equal(reasonOf(territoryForArtery(bad)), 'invalid-artery', String(bad))
for (const bad of ['Right', 'both', '', null, 3]) assert.equal(reasonOf(territoryForArtery('LCA', bad)), 'invalid-dominance', String(bad))
assert.equal(reasonOf(territoryForArtery('LAD', 'nope')), 'invalid-dominance') // dominansi diperiksa lebih dulu

// kebalikan: setiap segmen 1..17, batas, bukan bilangan bulat
const t1 = trunkForSegment(1), t3 = trunkForSegment(3), t17 = trunkForSegment(17)
assert.ok(t1.ok && t3.ok && t17.ok); assert.equal(t1.trunk, 'LCA'); assert.equal(t3.trunk, 'RCA'); assert.equal(t17.trunk, 'LCA')
const s16 = trunkForSegment(16); assert.ok(s16.ok); assert.equal(s16.trunk, null); assert.equal(s16.assignedBySource, false)
for (let s = 1; s <= 17; s++) { const r = trunkForSegment(s); assert.ok(r.ok); assert.equal(r.trunk === null, s === 16) }
for (const bad of [0, 18, -1, 1.5, NaN, Infinity, '3', null, undefined]) assert.equal(reasonOf(trunkForSegment(bad)), 'invalid-segment', String(bad))
// konsistensi dua arah
for (const t of ['LCA', 'RCA'] as const) { const r = territoryForArtery(t); assert.ok(r.ok); for (const s of r.segments) { const b = trunkForSegment(s); assert.ok(b.ok); assert.equal(b.trunk, t) } }

// kejujuran sumber dan batasan
assert.equal(AHA17_SOURCE.originalVerified, false); assert.equal(AHA17_SOURCE.verifiedFrom, 'full-text-secondary-source'); assert.equal(AHA17_SOURCE.referenceStandardSpecies, 'swine')
assert.ok(AHA17_LIMITATIONS.some((l) => /ramus intermedius/.test(l)) && AHA17_LIMITATIONS.some((l) => /swine/.test(l)) && AHA17_LIMITATIONS.some((l) => /LAD vs LCx/.test(l)))
assert.throws(() => { (lca.segments as number[]).push(16) }, TypeError)
console.log('bx2-vascular-territory: tabel LCA/RCA sesuai sumber, segmen 16 tak ditebak, LAD/LCx ditolak, dominansi tidak dipalsukan')
