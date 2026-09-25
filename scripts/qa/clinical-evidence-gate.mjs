import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = 'governance/clinical-evidence-registry.json'
const registry = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(registry.schemaVersion, 1, 'unsupported clinical evidence schema')
assert.ok(Array.isArray(registry.workflows) && registry.workflows.length > 0, 'clinical evidence registry must contain workflows')

const allowedStages = new Set(['planned', 'instrumented', 'prospective-study', 'validated', 'retired'])
const ids = new Set()

for (const w of registry.workflows) {
  assert.match(w.id, /^[a-z0-9][a-z0-9-]{2,80}$/, `invalid workflow id: ${w.id}`)
  assert.ok(!ids.has(w.id), `duplicate workflow id: ${w.id}`)
  ids.add(w.id)

  assert.ok(allowedStages.has(w.stage), `${w.id}: invalid stage ${w.stage}`)
  assert.ok(typeof w.clinicalOwner === 'string' && w.clinicalOwner.length > 0, `${w.id}: missing clinical owner`)

  const pm = w.primaryMetric
  assert.ok(pm && typeof pm.name === 'string', `${w.id}: missing primary metric`)
  assert.ok(['increase', 'decrease'].includes(pm.direction), `${w.id}: invalid primary metric direction`)
  assert.ok(Number.isFinite(pm.target), `${w.id}: primary metric target must be numeric`)

  assert.ok(Array.isArray(w.safetyMetrics) && w.safetyMetrics.length > 0, `${w.id}: at least one safety metric is required`)
  for (const sm of w.safetyMetrics) {
    assert.ok(typeof sm.name === 'string' && sm.name.length > 0, `${w.id}: safety metric missing name`)
    assert.ok(['increase', 'decrease'].includes(sm.direction), `${w.id}: invalid safety metric direction`)
    assert.ok(Number.isFinite(sm.target), `${w.id}: safety metric target must be numeric`)
  }

  const req = w.requiredEvidence
  assert.equal(req?.prospective, true, `${w.id}: prospective evaluation is mandatory`)
  assert.equal(req?.clinicianReview, true, `${w.id}: clinician review is mandatory`)
  assert.ok(Number.isInteger(req.minimumCohortN) && req.minimumCohortN > 0, `${w.id}: minimum cohort N must be > 0`)
  assert.ok(Number.isInteger(req.minimumClinicianN) && req.minimumClinicianN > 0, `${w.id}: minimum clinician N must be > 0`)

  const dc = w.dataContract
  assert.equal(dc?.provenanceRequired, true, `${w.id}: provenance must be required`)
  assert.ok(Array.isArray(dc.fhirResources) && dc.fhirResources.includes('Provenance'), `${w.id}: FHIR Provenance must be declared`)

  const proof = w.proof
  assert.ok(Number.isInteger(proof?.cohortN) && proof.cohortN >= 0, `${w.id}: invalid cohort N`)
  assert.ok(Number.isInteger(proof?.clinicianN) && proof.clinicianN >= 0, `${w.id}: invalid clinician N`)

  if (w.stage === 'validated') {
    assert.ok(proof.cohortN >= req.minimumCohortN, `${w.id}: cannot claim validated below minimum cohort N`)
    assert.ok(proof.clinicianN >= req.minimumClinicianN, `${w.id}: cannot claim validated below minimum clinician N`)
    assert.match(proof.analysisDate ?? '', /^\d{4}-\d{2}-\d{2}$/, `${w.id}: validated workflow requires analysis date`)
    assert.ok(typeof proof.artifact === 'string' && proof.artifact.length > 3, `${w.id}: validated workflow requires inspectable evidence artifact`)
  }

  if (['prospective-study', 'validated'].includes(w.stage)) {
    assert.ok(proof.cohortN > 0, `${w.id}: prospective study stage requires enrolled/evaluated participants`)
    assert.ok(proof.clinicianN > 0, `${w.id}: prospective study stage requires participating clinicians`)
  }
}

console.log(`clinical-evidence-gate: ${registry.workflows.length} workflows checked; no unsupported validation claims`)
