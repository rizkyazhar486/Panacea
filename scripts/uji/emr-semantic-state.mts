import assert from 'node:assert/strict'
import { deriveEmrFieldStates } from '../../src/lib/emrSemanticState.ts'
import type { EMRRecord } from '../../src/lib/types.ts'

const base: EMRRecord & { signedById?: string; physicalExam: EMRRecord['physicalExam'] & { verifiedById?: string } } = {
  id: 'enc-1',
  patientId: 'p1',
  createdAt: '2026-09-26T01:00:00Z',
  updatedAt: '2026-09-26T01:05:00Z',
  anamnesis: { keluhanUtama: 'Nyeri dada', rps: '', rpd: '', riwayatPengobatan: '', alergi: '', riwayatKeluarga: '', riwayatSosial: '' },
  physicalExam: { general: 'Alert', vitalsNote: '', perSystem: '', doctorVerified: true, verifiedBy: 'Dr A', verifiedById: 'd1' },
  problems: [{ id: 'p', title: 'Chest pain', basis: '', assessment: '' }],
  primaryDiagnosis: { code: 'R07.9', title: 'Chest pain', source: 'AI' },
  plan: [
    { id: 'ai-ok', category: 'Follow-up', text: 'ECG', source: 'AI', status: 'diverifikasi' },
    { id: 'doc', category: 'Follow-up', text: 'Troponin', source: 'Dokter', status: 'diusulkan' },
  ],
  references: [],
  signedBy: 'Dr A',
  signedById: 'd1',
  signedAt: '2026-09-26T01:06:00Z',
}

const signed = deriveEmrFieldStates(base)
assert.equal(signed['assessment.primaryDiagnosis'].origin, 'ai-generated', 'asal AI hilang setelah dokter menandatangani')
assert.equal(signed['assessment.primaryDiagnosis'].review, 'clinician-reviewed')
assert.equal(signed['objective.physicalExam'].review, 'clinician-verified')
assert.equal(signed['plan.ai-ok'].origin, 'ai-generated')
assert.equal(signed['plan.ai-ok'].review, 'clinician-verified')
assert.equal(signed['plan.doc'].origin, 'clinician-entered')
assert.equal(signed['plan.doc'].review, 'clinician-reviewed')
assert.equal(signed['subjective.history'].origin, 'unknown', 'asal anamnesis tidak boleh ditebak sebagai pasien/AI tanpa metadata')
assert.equal(signed['subjective.history'].review, 'clinician-reviewed')
assert.equal(signed['assessment.primaryDiagnosis'].reviewerId, 'd1')

// Local optimistic/client-forged signature is not enough: no server identity => unreviewed.
const forged = { ...base, signedById: undefined, physicalExam: { ...base.physicalExam, verifiedById: undefined } }
const unsigned = deriveEmrFieldStates(forged)
assert.ok(Object.values(unsigned).every((s) => s.review === 'unreviewed'), 'client-only signature promoted field to clinician-reviewed')

// Explicit rejection remains visible rather than being collapsed into "verified".
const rejectedRecord = { ...base, plan: [{ id: 'no', category: 'Follow-up' as const, text: 'No', source: 'AI' as const, status: 'ditolak' as const }] }
assert.equal(deriveEmrFieldStates(rejectedRecord)['plan.no'].review, 'clinician-rejected')

console.log('emr-semantic-state: origin preserved, review per field, server identity required, rejection explicit')
