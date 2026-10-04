import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import * as publicApi from '../../src/domains/physiology/index.ts'
import {
  evaluatePersonalization,
  type ParameterDeclaration,
  type PersonalizationBlockerCode,
  type PersonalizationProposal,
} from '../../src/domains/physiology/index.ts'

// Semua fixture SINTETIK untuk menguji struktur gerbang; bukan parameter fisiologis dan bukan nilai klinis.
const decl: ParameterDeclaration = {
  parameterId: 'synthetic-test-parameter', version: 'synthetic-v1',
  meaningSourceIds: ['synthetic-source-1'], identifiableFrom: ['synthetic-obs-a', 'synthetic-obs-b'],
  minObservations: 3, maxRelativeStep: 0.25, requiresHeldOutValidation: true,
}
const good: PersonalizationProposal = {
  parameterId: 'synthetic-test-parameter', populationValue: 100, proposedValue: 110,
  uncertainty: { lower: 105, upper: 118 }, provenanceId: 'prov-1', priorVersionId: 'v0',
  observations: [{ id: 'o1', kind: 'synthetic-obs-a' }, { id: 'o2', kind: 'synthetic-obs-a' }, { id: 'o3', kind: 'synthetic-obs-b' }],
  heldOutValidation: { performed: true, passed: true },
}
const decide = (d: Partial<ParameterDeclaration> = {}, p: Partial<PersonalizationProposal> = {}) =>
  evaluatePersonalization({ ...decl, ...d }, { ...good, ...p })
const codes = (r: ReturnType<typeof decide>): PersonalizationBlockerCode[] => (r.eligible ? [] : r.blockers.map((b) => b.code))

// ── Positivo ──
const ok = decide()
assert.deepEqual(ok, { eligible: true, personalValue: 110, truthClass: 'estimated-latent', parameterId: 'synthetic-test-parameter', declarationVersion: 'synthetic-v1' })
assert.deepEqual(decide(), decide(), 'deterministik')
assert.equal(decide({ requiresHeldOutValidation: false }, { heldOutValidation: null }).eligible, true, 'validasi held-out hanya diwajibkan bila dideklarasikan')

// ── Negatif berpasangan: satu syarat dilanggar, semua yang lain dipertahankan; hanya blocker itu yang muncul ──
const only = (code: PersonalizationBlockerCode, r: ReturnType<typeof decide>) => {
  assert.equal(r.eligible, false, code)
  assert.deepEqual(codes(r), [code], code)
  assert.equal(r.personalValue, null, `${code}: nilai usulan tidak boleh bocor`)
  if (!r.eligible) assert.equal(r.use, 'population-reference')
}
only('meaning-unsupported', decide({ meaningSourceIds: [] }))
// Tanpa jenis observasi yang membuat parameter teridentifikasi, tidak ada observasi yang bisa dihitung: kedua blocker muncul bersama.
assert.deepEqual(codes(decide({ identifiableFrom: [] })), ['not-identifiable', 'insufficient-observations'])
assert.equal(decide({ identifiableFrom: [] }).personalValue, null)
only('insufficient-observations', decide({}, { observations: good.observations.slice(0, 2) }))
only('uncertainty-missing', decide({}, { uncertainty: null }))
only('uncertainty-inconsistent', decide({}, { uncertainty: { lower: 111, upper: 118 } })) // tidak memuat 110
only('provenance-missing', decide({}, { provenanceId: null }))
only('update-unbounded', decide({}, { proposedValue: 126, uncertainty: { lower: 120, upper: 130 } })) // langkah 0.26 > 0.25
only('rollback-unavailable', decide({}, { priorVersionId: null }))
only('held-out-validation-missing', decide({}, { heldOutValidation: null }))
only('held-out-validation-missing', decide({}, { heldOutValidation: { performed: false, passed: true } }))
only('held-out-validation-failed', decide({}, { heldOutValidation: { performed: true, passed: false } }))
only('parameter-mismatch', decide({}, { parameterId: 'another-parameter' }))

// ── Batas: tepat di batas diterima, selangkah di luar ditolak ──
assert.equal(decide({}, { observations: good.observations }).eligible, true) // tepat 3 = minimum
assert.deepEqual(codes(decide({}, { observations: good.observations.slice(0, 2) })), ['insufficient-observations']) // minimum − 1
assert.equal(decide({}, { proposedValue: 125, uncertainty: { lower: 120, upper: 130 } }).eligible, true) // langkah tepat 0.25
assert.equal(decide({}, { proposedValue: 75, uncertainty: { lower: 70, upper: 80 } }).eligible, true) // langkah turun tepat 0.25
assert.deepEqual(codes(decide({}, { proposedValue: 74.9, uncertainty: { lower: 70, upper: 80 } })), ['update-unbounded']) // turun melewati batas
assert.equal(decide({}, { uncertainty: { lower: 110, upper: 110 } }).eligible, true, 'interval yang menyentuh nilai usulan sah')

// ── Observasi: id ganda dihitung sekali; jenis di luar identifiableFrom tidak dihitung ──
assert.deepEqual(codes(decide({}, { observations: [{ id: 'o1', kind: 'synthetic-obs-a' }, { id: 'o1', kind: 'synthetic-obs-a' }, { id: 'o1', kind: 'synthetic-obs-b' }, { id: 'o2', kind: 'synthetic-obs-b' }] })), ['insufficient-observations'], 'o1 tiga kali = satu pengamatan')
assert.deepEqual(codes(decide({}, { observations: [...good.observations.slice(0, 2), { id: 'o3', kind: 'unrelated-kind' }] })), ['insufficient-observations'], 'jenis tak terkait tidak dihitung')
assert.deepEqual(codes(decide({}, { observations: [{ id: 'o1', kind: 'unrelated-1' }, { id: 'o2', kind: 'unrelated-2' }, { id: 'o3', kind: 'unrelated-3' }] })).sort(), ['insufficient-observations', 'not-identifiable'].sort(), 'banyak observasi tak terkait bukan identifikasi')

// ── Semua pelanggaran dilaporkan sekaligus, bukan hanya yang pertama; urutan deterministik ──
const parah = decide({ meaningSourceIds: [] }, { uncertainty: null, provenanceId: null, priorVersionId: null, heldOutValidation: null, observations: [], proposedValue: 500 })
assert.deepEqual(codes(parah), ['meaning-unsupported', 'insufficient-observations', 'uncertainty-missing', 'provenance-missing', 'update-unbounded', 'rollback-unavailable', 'held-out-validation-missing'])

// ── Masukan tidak sah ditolak dengan alasan eksplisit, tanpa efek samping ──
for (const [name, bad] of [
  ['minObservations 0', { minObservations: 0 }], ['minObservations pecahan', { minObservations: 2.5 }], ['minObservations NaN', { minObservations: NaN }],
  ['maxRelativeStep 0', { maxRelativeStep: 0 }], ['maxRelativeStep negatif', { maxRelativeStep: -1 }], ['maxRelativeStep Infinity', { maxRelativeStep: Infinity }],
  ['parameterId kosong', { parameterId: '  ' }], ['version kosong', { version: '' }],
  ['requiresHeldOutValidation bukan boolean', { requiresHeldOutValidation: 'ya' as unknown as boolean }],
  ['meaningSourceIds berisi string kosong', { meaningSourceIds: [''] }], ['identifiableFrom bukan daftar', { identifiableFrom: 'a' as unknown as string[] }],
] as const) {
  assert.deepEqual(codes(decide(bad as Partial<ParameterDeclaration>)).includes('declaration-invalid'), true, `deklarasi: ${name}`)
  assert.equal(decide(bad as Partial<ParameterDeclaration>).eligible, false)
}
for (const [name, bad] of [
  ['populationValue 0', { populationValue: 0 }], ['populationValue NaN', { populationValue: NaN }], ['proposedValue Infinity', { proposedValue: Infinity }],
  ['proposedValue string', { proposedValue: '110' as unknown as number }], ['observations bukan daftar', { observations: null as unknown as [] }],
  ['observasi tanpa id', { observations: [{ id: '', kind: 'synthetic-obs-a' }] }],
] as const) {
  assert.deepEqual(codes(decide({}, bad as Partial<PersonalizationProposal>)), ['proposal-invalid'], `usulan: ${name}`)
}
assert.equal(evaluatePersonalization(undefined as unknown as ParameterDeclaration, good).eligible, false)
assert.equal(evaluatePersonalization(decl, null as unknown as PersonalizationProposal).eligible, false)
// Tidak memutasi masukan.
const beku = JSON.stringify([decl, good]); evaluatePersonalization(decl, good); evaluatePersonalization(decl, { ...good, uncertainty: null })
assert.equal(JSON.stringify([decl, good]), beku)

// ── Batas arsitektur dan kejujuran: tidak ada deklarasi parameter fisiologis nyata, tidak ada I/O atau waktu ──
assert.deepEqual(Object.keys(publicApi).sort(), [
  'ALVEOLAR_GAS_BOUNDARY', 'ALVEOLAR_GAS_CONTROLS', 'ALVEOLAR_GAS_DEFAULTS', 'ALVEOLAR_GAS_MODELS',
  'alveolarFrequencySweep', 'evaluateAlveolarGasBudget', 'evaluatePersonalization',
], 'domain exports reviewed teaching gas models and the gate, never personalization parameter declarations or UI')
const sumber = ['model/personalization.ts', 'engine/personalizationGate.ts'].map((f) => readFileSync(new URL(`../../src/domains/physiology/${f}`, import.meta.url), 'utf8')).join('\n')
for (const terlarang of ['Date.now(', 'Math.random(', 'fetch(', 'document.', 'window.', 'localStorage']) assert.ok(!sumber.includes(terlarang), `modul murni tidak boleh memuat ${terlarang}`)
assert.ok(!/\b(?:1\.34|0\.003|0\.0034|142\b)/.test(sumber), 'tidak ada konstanta klinis di gerbang')
// Deklarasi parameter nyata (literal objek berisi daftar sumber/observasi) tidak boleh ada di domain ini, diekspor atau tidak.
assert.ok(!/(?:meaningSourceIds|identifiableFrom)\s*:\s*\[/.test(sumber), 'tidak ada literal deklarasi parameter di model/engine')
assert.ok(!/\bDECLARATIONS?\b/.test(sumber), 'tidak ada registry deklarasi di gerbang')
const berkas = readdirSync(new URL('../../src/domains/physiology', import.meta.url), { recursive: true }) as string[]
assert.deepEqual(berkas.filter((f) => f.endsWith('.ts')).sort(), ['engine/alveolarGasBudget.ts', 'engine/personalizationGate.ts', 'index.ts', 'model/personalization.ts', 'ui/index.ts'])
console.log('personalization-gate: eligibility needs meaning, identifiability, enough distinct observations, uncertainty, provenance, bounded step, rollback and held-out validation; blocked values never leak')
