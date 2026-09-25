import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { susunRencana } from '../../server/src/carePlan.ts'
import { validateContinuousCarePlan } from '../../src/lib/continuousCareOperatingSystem.ts'
import { statusPasienUntukDokter } from '../../src/lib/statusPasienDokter.ts'
import { evaluasiAturanLab } from '../../src/lib/aturanLabDokter.ts'

const kini = new Date('2026-09-25T06:00:00Z')
const dasar = {
  diagnosisRefs: [{ code: 'E11', display: 'Type 2 diabetes' }],
  questions: [{ id: 'a', prompt: 'Any hypoglycaemia?', kind: 'boolean' }],
}
const aturan = { metric: 'lab.hba1c', operator: 'gte', threshold: 9, unit: '%', maxAgeDays: 180, label: 'HbA1c ≥ 9%', rationale: 'Clinician wants to review poor control', evidenceRef: 'ADA Standards of Care 2026, section 6', verifiedBy: 'PALSU', verifiedAt: '2000-01-01T00:00:00Z' }

// Server: bukti wajib; verifikator & waktu dari server, bukan payload.
assert.throws(() => susunRencana({ ...dasar, measurementReviewRules: [{ ...aturan, evidenceRef: '' }] }, 'p', 'dokter-D', kini), /evidence/, 'aturan tanpa rujukan bukti diterima')
assert.throws(() => susunRencana({ ...dasar, measurementReviewRules: [{ ...aturan, metric: 'vital.sbp' }] }, 'p', 'dokter-D', kini), /lab test/)
assert.throws(() => susunRencana({ ...dasar, measurementReviewRules: [{ ...aturan, maxAgeDays: 0 }] }, 'p', 'dokter-D', kini), /age/)
const r = susunRencana({ ...dasar, measurementReviewRules: [aturan] }, 'p', 'dokter-D', kini)
assert.equal(r.measurementReviewRules[0].verifiedBy, 'dokter-D', 'verifiedBy diambil dari payload')
assert.equal(r.measurementReviewRules[0].verifiedAt, kini.toISOString())
assert.equal(r.measurementReviewRules[0].maxAgeMinutes, 180 * 1440)
assert.deepEqual(r.monitoredMetrics, ['lab.hba1c'])
assert.equal(validateContinuousCarePlan(r as never), true, 'kernel menolak rencana berisi aturan lab dari server')

// Klien dokter: dievaluasi atas status bersama dari bundel FHIR.
const obs = (id: string, tanggal: string, nilai: number) => ({ resource: { resourceType: 'Observation', identifier: [{ system: 'https://panaceamed.id/fhir/NamingSystem/lab-entry', value: `hba1c/${id}` }], effectiveDateTime: tanggal, valueQuantity: { value: nilai } } })
const izin = { dibuat: '2026-01-01T00:00:00Z', berakhir: '2026-12-31T00:00:00Z' }
const nilai = (entries: ReturnType<typeof obs>[]) => {
  const { state } = statusPasienUntukDokter(entries, { plan: null, reports: [] }, [], izin, kini.toISOString())
  return evaluasiAturanLab(r as never, state, kini.toISOString())[0]
}
assert.equal(nilai([obs('1', '2026-09-01', 9.4)]).state, 'triggered')
assert.equal(nilai([obs('1', '2026-09-01', 7.1)]).state, 'not-triggered')
// Hasil lama yang baru dibagikan bukan data segar: umur dari tanggal ambil darah.
const lama = nilai([obs('1', '2024-06-01', 9.4)])
assert.equal(lama.state, 'stale', 'HbA1c 2024 dianggap segar — umur dihitung dari waktu diterima, bukan waktu diukur')
assert.equal(nilai([]).state, 'missing')

const ui = readFileSync('src/components/RencanaHarianDokter.tsx', 'utf8')
assert.match(ui, /evidenceRef/, 'formulir aturan lab tidak meminta rujukan bukti')
assert.match(ui, /evaluasiAturanLab\(/, 'tampilan dokter tidak mengevaluasi aturan lab')
console.log('aturan-lab-dokter: bukti wajib, verifikator dari server, umur dari waktu ukur, dievaluasi kernel di peramban dokter')
