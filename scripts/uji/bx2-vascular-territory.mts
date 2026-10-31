import assert from 'node:assert/strict'
import {
  territoryForArtery, branchForSegment, AHA17_SOURCES, AHA17_LIMITATIONS, AHA17_SEGMENT_COUNT, AHA17_SEGMENT_NAMES, AHA17_RINGS, DOMINANCE_PREVALENCE,
} from '../../src/domains/body-exposure/engine/vascularTerritoryEngine.ts'

const nums = (r: ReturnType<typeof territoryForArtery>) => { assert.ok(r.ok); return r.segments.map((s) => s.segment) }

// golden: penetapan AHA per cabang persis seperti tercetak pada PMC6932424 (3,4,9,10,15 RCA; 5,6,11,12,16 LCx; 1,2,7,8,13,14,17 LAD)
assert.deepEqual(nums(territoryForArtery('RCA', 'right')), [3, 4, 9, 10, 15])
assert.deepEqual(nums(territoryForArtery('LCx', 'right')), [5, 6, 11, 12, 16])
assert.deepEqual(nums(territoryForArtery('LAD', 'right')), [1, 2, 7, 8, 13, 14, 17])
// LCA = LAD + LCx
assert.deepEqual(nums(territoryForArtery('LCA')), [1, 2, 5, 6, 7, 8, 11, 12, 13, 14, 16, 17])

// silang-uji dengan sumber kedua (PMC7416454): dua daftar tercetak itu (LCA tanpa segmen 16, dan RCA) tidak boleh bertentangan dengan tabel
const crossLca = [1, 2, 5, 6, 7, 8, 11, 12, 13, 14, 17], crossRca = [3, 4, 9, 10, 15]
const lcaTable = nums(territoryForArtery('LCA')); for (const s of crossLca) assert.ok(lcaTable.includes(s), `LCA segment ${s}`)
assert.deepEqual(nums(territoryForArtery('RCA')), crossRca)
assert.deepEqual(lcaTable.filter((s) => !crossLca.includes(s)), [16]) // satu-satunya selisih: segmen 16, yang tidak tercantum pada daftar sumber kedua

// partisi: 17 segmen, tiap segmen tepat satu cabang, nama dan cincin lengkap
const all = [...nums(territoryForArtery('LAD')), ...nums(territoryForArtery('LCx')), ...nums(territoryForArtery('RCA'))].sort((a, b) => a - b)
assert.deepEqual(all, Array.from({ length: AHA17_SEGMENT_COUNT }, (_, i) => i + 1))
assert.equal(AHA17_SEGMENT_NAMES.length, 17); assert.equal(new Set(AHA17_SEGMENT_NAMES).size, 17)
assert.deepEqual(AHA17_RINGS.flatMap((r) => [...r.segments]), all); assert.deepEqual(AHA17_RINGS.map((r) => r.segments.length), [6, 6, 4, 1])
assert.equal(AHA17_SEGMENT_NAMES[0], 'basal anterior'); assert.equal(AHA17_SEGMENT_NAMES[15], 'apical lateral'); assert.equal(AHA17_SEGMENT_NAMES[16], 'apex')

// dominansi: tabel TIDAK berubah dan hasil mengatakan itu; semua nilai dominansi sah memberi segmen identik
for (const d of ['right', 'left', 'codominant', 'unknown'] as const) {
  const r = territoryForArtery('LCx', d); assert.ok(r.ok)
  assert.deepEqual(r.segments.map((s) => s.segment), [5, 6, 11, 12, 16]); assert.equal(r.dominance, d); assert.equal(r.dominanceAdjusted, false); assert.equal(r.variantTablesAvailable, false)
}
const defaultDominance = territoryForArtery('RCA'); assert.ok(defaultDominance.ok); assert.equal(defaultDominance.dominance, 'unknown')
assert.equal(DOMINANCE_PREVALENCE.right, 'approximately 85%'); assert.equal(DOMINANCE_PREVALENCE.left, '7–8%'); assert.equal(DOMINANCE_PREVALENCE.codominant, '7–8%')

// bukti empiris tertulis: segmen 12 dan 16 kontroversial; 2,7,8,13 spesifik-LAD; tidak ada segmen RCA yang spesifik
const lcx = territoryForArtery('LCx'); assert.ok(lcx.ok)
assert.deepEqual(lcx.segments.filter((s) => s.contested).map((s) => s.segment), [12, 16])
const lad = territoryForArtery('LAD'); assert.ok(lad.ok)
assert.deepEqual(lad.segments.filter((s) => s.evidence.some((e) => e.kind === 'lad-specific')).map((s) => s.segment), [2, 7, 8, 13])
const rca = territoryForArtery('RCA'); assert.ok(rca.ok); assert.equal(rca.segments.some((s) => s.evidence.some((e) => e.kind === 'lad-specific' || e.kind === 'contested')), false)
for (const s of [12, 16]) { const b = branchForSegment(s); assert.ok(b.ok); assert.equal(b.info.branch, 'LCx'); assert.equal(b.info.contested, true) } // ditetapkan LCx oleh AHA, tetap ditandai kontroversial
const b1 = branchForSegment(1); assert.ok(b1.ok); assert.equal(b1.info.contested, false); assert.deepEqual(b1.info.evidence, [])

// negatif berpasangan: hanya satu kondisi yang berbeda dari kasus golden
const reasonOf = (r: { ok: boolean; reason?: string }) => (r.ok ? 'ok' : r.reason)
for (const bad of ['lca', 'LCA ', '', 'LM', null, undefined, 7, {}, 'RCx', 'lad']) assert.equal(reasonOf(territoryForArtery(bad)), 'invalid-artery', String(bad))
for (const bad of ['Right', 'both', '', null, 3]) assert.equal(reasonOf(territoryForArtery('LAD', bad)), 'invalid-dominance', String(bad))
assert.equal(reasonOf(territoryForArtery('nope', 'nope')), 'invalid-dominance') // dominansi diperiksa lebih dulu
for (const bad of [0, 18, -1, 1.5, NaN, Infinity, '3', null, undefined]) assert.equal(reasonOf(branchForSegment(bad)), 'invalid-segment', String(bad))
// konsistensi dua arah
for (const a of ['LAD', 'LCx', 'RCA'] as const) { const r = territoryForArtery(a); assert.ok(r.ok); for (const s of r.segments) { const b = branchForSegment(s.segment); assert.ok(b.ok); assert.equal(b.info.branch, a) } }

// kejujuran sumber dan batasan
assert.equal(AHA17_SOURCES.originalVerified, false); assert.equal(AHA17_SOURCES.verifiedFrom, 'full-text-secondary-sources')
assert.equal(AHA17_SOURCES.assignment.pmid, '25201553'); assert.equal(AHA17_SOURCES.crossCheck.pmid, '32072257')
assert.ok(AHA17_LIMITATIONS.some((l) => /23%/.test(l)) && AHA17_LIMITATIONS.some((l) => /swine/.test(l)) && AHA17_LIMITATIONS.some((l) => /ramus intermedius/.test(l)) && AHA17_LIMITATIONS.some((l) => /Dominance does not change/.test(l)))
assert.ok(lad.ok && lad.limitations === AHA17_LIMITATIONS)
// konstanta bersama beku: tidak ada pemanggil yang bisa mengubah tabel/nama/batasan
for (const shared of [AHA17_SEGMENT_NAMES, AHA17_LIMITATIONS, AHA17_RINGS]) assert.throws(() => { (shared as unknown[]).push('x') }, TypeError)
assert.throws(() => { (AHA17_SOURCES as { verifiedFrom: string }).verifiedFrom = 'x' }, TypeError)
console.log('bx2-vascular-territory: penetapan AHA per cabang sesuai dua sumber, segmen 12/16 ditandai kontroversial, dominansi tidak dipalsukan')
