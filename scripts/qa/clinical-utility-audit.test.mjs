// scripts/qa/clinical-utility-audit.test.mjs
// Machine-checked governance test for CLINICAL_UTILITY_AUDIT.json

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const AUDIT_PATH = path.resolve('governance/CLINICAL_UTILITY_AUDIT.json')

test('CLINICAL_UTILITY_AUDIT.json: schema validity and completeness', () => {
  assert.ok(fs.existsSync(AUDIT_PATH), 'governance/CLINICAL_UTILITY_AUDIT.json must exist')
  const raw = fs.readFileSync(AUDIT_PATH, 'utf-8')
  const payload = JSON.parse(raw)

  assert.equal(payload.schemaVersion, '1.0.0')
  assert.equal(payload.governanceStandard, 'PANACEAMED_CLINICAL_REALITY_V1')
  assert.equal(payload.summary.totalModulesAudited, 85)
  assert.equal(payload.modules.length, 85)

  const allowedCategories = new Set([
    'A_DIRECT_CLINICAL_WORKFLOW',
    'B_PATIENT_UNDERSTANDING_PREVENTION',
    'C_CLINICAL_RESEARCH_INFRASTRUCTURE',
    'D_EDUCATIONAL_MECHANISTIC_SIMULATION',
    'E_SPECULATIVE_UNSUPPORTED',
  ])

  const allowedEvidenceTiers = new Set([
    'E0_HYPOTHESIS',
    'E1_HEURISTIC',
    'E2_WORKFLOW',
    'E3_FIELD',
    'E4_EXTERNAL',
  ])

  const allowedStatuses = new Set([
    'VALIDATED',
    'PARTIALLY_VALIDATED',
    'NOT_VALIDATED',
  ])

  for (let i = 1; i <= 75; i++) {
    const expectedId = `T-CLIN-${String(i).padStart(2, '0')}`
    const mod = payload.modules.find((m) => m.id === expectedId)
    assert.ok(mod, `Module ${expectedId} must be audited in registry`)

    assert.ok(allowedCategories.has(mod.category), `${expectedId} category invalid: ${mod.category}`)
    assert.ok(allowedEvidenceTiers.has(mod.evidenceTier), `${expectedId} evidenceTier invalid: ${mod.evidenceTier}`)
    assert.ok(allowedStatuses.has(mod.clinicalValidationStatus), `${expectedId} status invalid: ${mod.clinicalValidationStatus}`)

    // Scorecard integrity
    const sc = mod.scorecard
    assert.ok(sc, `${expectedId} missing scorecard`)
    for (const key of [
      'problemRelevance',
      'userClarity',
      'workflowIntegration',
      'scientificEvidence',
      'actionability',
      'independentTestability',
      'safetyExplainability',
      'resourceFeasibility',
    ]) {
      const val = sc[key]
      assert.ok(
        typeof val === 'number' && val >= 0 && val <= 5,
        `${expectedId} scorecard.${key} must be a number between 0 and 5`
      )
    }

    assert.ok(typeof mod.priorityScore === 'number' && mod.priorityScore >= 0)
    assert.ok(mod.safetyRisks && mod.safetyRisks.length > 5)
    assert.ok(mod.blockersToClinicalDeployment && mod.blockersToClinicalDeployment.length > 5)
    assert.ok(mod.nextExperiment && mod.nextExperiment.length > 5)
  }
})

test('CLINICAL_UTILITY_AUDIT.json: T-CLIN-19 post-discharge reality boundaries', () => {
  const raw = fs.readFileSync(AUDIT_PATH, 'utf-8')
  const payload = JSON.parse(raw)
  const t19 = payload.modules.find((m) => m.id === 'T-CLIN-19')

  assert.ok(t19)
  assert.equal(t19.category, 'A_DIRECT_CLINICAL_WORKFLOW')
  assert.equal(t19.evidenceTier, 'E1_HEURISTIC')
  assert.ok(t19.observableResultProduced.includes('CareContinuityConcern'))
  assert.ok(t19.observableResultProduced.includes('ClinicalReadmissionRisk'))
  assert.ok(t19.safetyRisks.includes('Conflating administrative flags with calibrated clinical readmission probabilities'))
})

test('CLINICAL_UTILITY_AUDIT.json: negative control - no unvalidated modules masquerading as E3/E4 or VALIDATED', () => {
  const raw = fs.readFileSync(AUDIT_PATH, 'utf-8')
  const payload = JSON.parse(raw)

  for (const mod of payload.modules) {
    if (mod.category === 'D_EDUCATIONAL_MECHANISTIC_SIMULATION' || mod.category === 'E_SPECULATIVE_UNSUPPORTED') {
      assert.equal(
        mod.clinicalValidationStatus,
        'NOT_VALIDATED',
        `${mod.id} simulation or speculative module must NEVER claim clinical validation`
      )
      assert.notEqual(mod.evidenceTier, 'E3_FIELD', `${mod.id} cannot claim E3`)
      assert.notEqual(mod.evidenceTier, 'E4_EXTERNAL', `${mod.id} cannot claim E4`)
    }
  }
})
