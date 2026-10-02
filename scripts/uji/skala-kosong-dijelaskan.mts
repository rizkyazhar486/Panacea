import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  auditEmptyScales,
  type BiologicalScale,
  type MultiscaleBridge,
  type MultiscaleNode,
  type WithheldScale,
} from '../../src/lib/bodyMultiscaleBridge.ts'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
} from '../../src/lib/bodyPulmonaryMolecularVertical.ts'

// Rel skala menampilkan skala tanpa simpul sebagai tombol mati. Tombol mati tanpa
// alasan terbaca "belum dikerjakan", dan sebuah halaman bisa mengaku semua celah
// sudah dijelaskan padahal tidak. Gerbang ini menjaga: tiap skala punya simpul ATAU
// alasan tercatat, tidak keduanya, tidak ganda, tidak kosong.

const ALL: BiologicalScale[] = ['whole-body', 'system', 'organ', 'tissue', 'cell', 'organelle', 'molecule', 'protein', 'pathway', 'gene']

const node = (scale: BiologicalScale): MultiscaleNode => ({
  id: `fx-${scale}`, label: scale, scale, representation: 'not-represented', evidence: [],
  academicReview: { status: 'pending' }, patientSpecific: false, inferredFromFreeText: false,
})
const bridgeOf = (...scales: BiologicalScale[]): MultiscaleBridge => ({ nodes: scales.map(node), edges: [] })
const gap = (scale: BiologicalScale, reason = 'a recorded reason'): WithheldScale => ({
  scale, label: scale, kind: 'not-yet-modeled', reason, evidence: null,
})
const gapsFor = (scales: BiologicalScale[]) => scales.map((s) => gap(s))

// ── Positif: simpul di tissue/cell, semua skala lain dijelaskan ──────────────
const dasar = bridgeOf('tissue', 'cell')
const lainnya = ALL.filter((s) => s !== 'tissue' && s !== 'cell')
assert.deepEqual(auditEmptyScales(dasar, gapsFor(lainnya)), {
  unexplained: [], contradicted: [], blankReason: [], duplicated: [], ok: true,
}, 'fully explained bridge must pass with no findings')

// ── Negatif berpasangan: hanya SATU kondisi yang berbeda dari kasus positif ───
// (a) satu alasan dibuang → tepat skala itu tidak dijelaskan
{
  const a = auditEmptyScales(dasar, gapsFor(lainnya.filter((s) => s !== 'organ')))
  assert.deepEqual(a.unexplained, ['organ'], 'an empty scale with no recorded reason must be reported as unexplained')
  assert.equal(a.ok, false, 'an unexplained scale must fail the audit')
  assert.deepEqual([a.contradicted, a.blankReason, a.duplicated], [[], [], []], 'only the removed reason may change the result')
}
// (b) simpul ada di skala yang juga mengaku ditahan → catatan usang
{
  const a = auditEmptyScales(bridgeOf('tissue', 'cell', 'organ'), gapsFor(lainnya))
  assert.deepEqual(a.contradicted, ['organ'], 'a scale that has a node and is also declared withheld must be reported as contradicted')
  assert.equal(a.ok, false, 'a contradicted scale must fail the audit')
  assert.deepEqual(a.unexplained, [], 'only the added node may change the result')
}
// (c) alasan hanya spasi → bukan alasan
{
  const a = auditEmptyScales(dasar, [...gapsFor(lainnya.filter((s) => s !== 'gene')), gap('gene', '   \n\t ')])
  assert.deepEqual(a.blankReason, ['gene'], 'a whitespace-only reason must be reported as blank')
  assert.equal(a.ok, false, 'a blank reason must fail the audit')
  assert.deepEqual(a.unexplained, [], 'only the blanked reason may change the result')
}
// (d) catatan ganda untuk satu skala
{
  const a = auditEmptyScales(dasar, [...gapsFor(lainnya), gap('system', 'second entry')])
  assert.deepEqual(a.duplicated, ['system'], 'two entries for one scale must be reported as duplicated')
  assert.equal(a.ok, false, 'a duplicated scale must fail the audit')
}

// ── Batas ────────────────────────────────────────────────────────────────────
// tanpa simpul dan tanpa catatan: kesepuluh skala tak dijelaskan, urutan rel
assert.deepEqual(auditEmptyScales(bridgeOf(), []).unexplained, ALL, 'an empty bridge with no reasons must flag all ten scales in rail order')
// semua skala bersimpul dan tanpa catatan: lulus
assert.equal(auditEmptyScales(bridgeOf(...ALL), []).ok, true, 'a bridge with a node on every scale needs no reasons')
// deterministik: dua kali jalan identik
assert.deepEqual(auditEmptyScales(dasar, gapsFor(lainnya)), auditEmptyScales(dasar, gapsFor(lainnya)), 'audit must be deterministic')

// ── Data nyata: vertikal paru ────────────────────────────────────────────────
const audit = auditEmptyScales(PULMONARY_SFTPC_MOLECULAR_VERTICAL, PULMONARY_SFTPC_WITHHELD_GAPS)
assert.deepEqual(audit, { unexplained: [], contradicted: [], blankReason: [], duplicated: [], ok: true }, 'the shipped pulmonary vertical must have every empty scale explained')

const adaNode = new Set(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.map((n) => n.scale))
const ditahan = PULMONARY_SFTPC_WITHHELD_GAPS.map((g) => g.scale)
assert.deepEqual(
  [...ditahan].sort(),
  ALL.filter((s) => !adaNode.has(s)).sort(),
  'withheld list must equal exactly the scales that have no node',
)
for (const g of PULMONARY_SFTPC_WITHHELD_GAPS) {
  assert.ok(g.reason.length > 40, `${g.scale}: a recorded reason must be a sentence, not a label`)
}
for (const g of PULMONARY_SFTPC_WITHHELD_GAPS.filter((x) => x.kind === 'not-yet-modeled')) {
  assert.match(g.reason, /^VERTICAL GAP — NOT YET MODELED:/, `${g.scale}: not-yet-modeled gaps use the doctrine marker`)
}

// ── Premis tiga skala teratas: aset ada, revisi sumber TIDAK dipin ────────────
// Alasannya menyebut aset di disk. Bila asetnya dipindah, alasannya basi.
for (const [skala, jalur] of [['whole-body', 'public/anatomy/skeletal.glb'], ['system', 'public/atlas/respirasi.glb'], ['organ', 'public/atlas/paru.glb']] as const) {
  assert.ok(existsSync(jalur), `${skala}: the asset named in the gap (${jalur}) must exist`)
}
// Bila revisi sumber (hash 40 heksa) kelak dipin di kredit, premis "tidak dipin" salah:
// gerbang ini harus gagal supaya catatan ini diganti simpul sungguhan, bukan dibiarkan.
for (const kredit of ['public/atlas/CREDITS.txt', 'public/anatomy/CREDITS.txt']) {
  assert.doesNotMatch(
    readFileSync(kredit, 'utf8'),
    /\b[0-9a-f]{40}\b/i,
    `${kredit} now pins a source revision: replace the NOT YET MODELED gaps in bodyPulmonaryMolecularVertical.ts with real nodes`,
  )
}

console.log(`empty scales explained: ${ditahan.length} withheld (${ditahan.join(', ')}), 0 unexplained, 0 contradicted`)
