import assert from 'node:assert/strict'
import { admitOrganRelationship, type OrganEvidenceRelationship } from '../../src/lib/anatomy/organEvidenceRelationshipGate.ts'

const base: OrganEvidenceRelationship = {
  id: 'respiratory-alveolus-gas-exchange',
  systemId: 'respiratory',
  organId: 'lung',
  from: { kind: 'anatomy', ref: 'alveolus' },
  to: { kind: 'physiology', ref: 'gas-exchange' },
  claim: 'Educational relationship under review.',
  provenance: {
    sourceId: 'fixture-source',
    sourceRevision: '2026-09-01',
    sourceLocator: 'fixture:1',
    license: 'fixture-license',
    evidenceLevel: 'secondary',
    reviewStatus: 'academic-review-required',
  },
  boundary: 'reference-educational',
}

assert.equal(admitOrganRelationship(base).admitted, true)
assert.equal(admitOrganRelationship({ ...base, provenance: { ...base.provenance, sourceRevision: 'latest' } }).admitted, false)
assert.equal(admitOrganRelationship({ ...base, provenance: { ...base.provenance, sourceLocator: '' } }).admitted, false)
assert.equal(admitOrganRelationship({ ...base, claim: '' }).admitted, false)
assert.equal(admitOrganRelationship({ ...base, boundary: 'patient-specific' as never }).admitted, false)
assert.equal(admitOrganRelationship({ ...base, provenance: { ...base.provenance, reviewStatus: 'academic-reviewed' } }).publicationReady, true)
assert.equal(admitOrganRelationship(base).publicationReady, false)

const crossOrgan = { ...base, organId: 'lung', targetOrganId: 'kidney' }
const crossResult = admitOrganRelationship(crossOrgan)
assert.equal(crossResult.admitted, false)
assert.ok(crossResult.blockers.includes('cross-organ-edge-not-declared'))

const declaredCross = { ...crossOrgan, crossOrganEvidence: { sourceLocator: 'fixture:2', relation: 'system-interaction' as const } }
assert.equal(admitOrganRelationship(declaredCross).admitted, true)

console.log('organ-evidence-relationships: fail-closed provenance, review, boundary, and cross-organ edge gates pass')
