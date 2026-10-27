// scripts/qa/t-clin-six-pillar-impact.test.mjs
// Human-benefit intake gate: coverage and negative controls, NOT clinical validation.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const IMPACT_PATH = resolve('governance/T_CLIN_SIX_PILLAR_IMPACT_GATE.json')
const AUDIT_PATH = resolve('governance/CLINICAL_UTILITY_AUDIT.json')
const EXPECTED_PILLARS = new Set([
  'CLINICAL_ONE_OS',
  'EDUCATION_WORKFLOW',
  'BODY_EXPOSURE',
  'DEVICE_MONITORING',
  'TRUST_SAFETY_VALIDATION',
  'ADOPTION_REAL_WORLD_IMPACT',
])

const REQUIRED_ANCHORS = new Map([
  ['T-CLIN-06', 'CLINICAL_ONE_OS'],
  ['T-CLIN-11', 'CLINICAL_ONE_OS'],
  ['T-CLIN-13', 'CLINICAL_ONE_OS'],
  ['T-CLIN-16', 'TRUST_SAFETY_VALIDATION'],
  ['T-CLIN-17', 'CLINICAL_ONE_OS'],
  ['T-CLIN-19', 'ADOPTION_REAL_WORLD_IMPACT'],
  ['T-CLIN-21', 'EDUCATION_WORKFLOW'],
  ['T-CLIN-71', 'BODY_EXPOSURE'],
  ['T-CLIN-110', 'DEVICE_MONITORING'],
])

const load = (path) => JSON.parse(readFileSync(path, 'utf8'))
const meaningful = (value) => typeof value === 'string' && value.trim().length >= 12

function validateGate(gate, audit) {
  const errors = []
  if (gate.schemaVersion !== '1.1.0') errors.push('unsupported impact gate schema')
  if (gate.policy !== 'SIX_PILLAR_HUMAN_BENEFIT_GATE_V1') errors.push('wrong policy')
  if (!Array.isArray(gate.pillars) || gate.pillars.length !== EXPECTED_PILLARS.size ||
    new Set(gate.pillars.map((pillar) => pillar.id)).size !== EXPECTED_PILLARS.size ||
    gate.pillars.some((pillar) => !EXPECTED_PILLARS.has(pillar.id) || !meaningful(pillar.title))) {
    errors.push('six-pillar taxonomy must be complete and unique')
  }

  const audited = new Map((audit.modules ?? []).map((item) => [item.id, item]))
  const requiredIds = new Set((audit.summary?.top5ClinicalCandidates ?? []).map((item) => item.id))
  if (requiredIds.size !== 5) errors.push('exactly five auditable priority candidates are required')
  const entries = Array.isArray(gate.entries) ? gate.entries : []
  const seen = new Set()
  const coveredPrimary = new Set()
  if (entries.length !== REQUIRED_ANCHORS.size) {
    errors.push('pilot anchor count differs from registered nine-module scope')
  }

  for (const item of entries) {
    if (!item || typeof item !== 'object') {
      errors.push('malformed impact entry')
      continue
    }
    if (seen.has(item.id)) errors.push('duplicate T-CLIN impact entry: ' + item.id)
    seen.add(item.id)
    if (!REQUIRED_ANCHORS.has(item.id)) errors.push('unregistered pilot anchor: ' + item.id)
    if (REQUIRED_ANCHORS.get(item.id) !== item.primaryPillar) {
      errors.push('pilot anchor primary pillar mismatch: ' + item.id)
    }
    coveredPrimary.add(item.primaryPillar)
    const original = audited.get(item.id)
    if (!original) errors.push('impact entry not present in audit registry: ' + item.id)
    if (!EXPECTED_PILLARS.has(item.primaryPillar)) errors.push('invalid primary pillar: ' + item.id)
    if (!Array.isArray(item.supportingPillars) || item.supportingPillars.length < 1 ||
      new Set(item.supportingPillars).size !== item.supportingPillars.length ||
      item.supportingPillars.some((id) => !EXPECTED_PILLARS.has(id) || id === item.primaryPillar)) {
      errors.push('invalid supporting pillars: ' + item.id)
    }
    for (const field of ['userRole', 'humanProblem', 'observableWorkflowOutcome', 'safetyBoundary']) {
      if (!meaningful(item[field])) errors.push('missing measurable human context ' + field + ': ' + item.id)
    }
    const metric = item.outcomeMetric ?? {}
    for (const field of ['name', 'numerator', 'denominator', 'measurementPlan']) {
      if (!meaningful(metric[field])) errors.push('missing metric ' + field + ': ' + item.id)
    }
    if (metric.unit !== 'ratio') errors.push('unsupported metric unit: ' + item.id)
    if (metric.measurementStatus !== 'NOT_MEASURED' ||
      metric.observedValue !== null || metric.baselineValue !== null) {
      errors.push('unverified field results must remain null: ' + item.id)
    }
    if (original && item.evidenceTier !== original.evidenceTier) {
      errors.push('evidence tier differs from canonical audit: ' + item.id)
    }
    if (original && item.category !== original.category) {
      errors.push('canonical clinical utility category mismatch: ' + item.id)
    }
    if (original && item.clinicalValidationStatus !== original.clinicalValidationStatus) {
      errors.push('canonical validation status mismatch: ' + item.id)
    }
    if (item.clinicallyValidatedBenefit !== false || item.independentlyValidatedBenefit !== false) {
      errors.push('unverified human benefit must not claim clinical validation: ' + item.id)
    }
    const researchOnly = original && original.category === 'C_CLINICAL_RESEARCH_INFRASTRUCTURE'
    const expectedAuthority = researchOnly ? 'RESEARCH_ONLY_QUALIFIED_REVIEWER' : 'AUTHORISED_CLINICIAN'
    if (item.humanAuthority !== expectedAuthority) {
      errors.push('human authority does not match canonical use boundary: ' + item.id)
    }
    if (item.sourceRegistry !== 'governance/CLINICAL_UTILITY_AUDIT.json') {
      errors.push('provenance pointer missing: ' + item.id)
    }
  }
  for (const id of requiredIds) if (!seen.has(id)) errors.push('priority candidate missing impact contract: ' + id)
  for (const id of REQUIRED_ANCHORS.keys()) {
    if (!seen.has(id)) errors.push('six-pillar pilot anchor missing impact contract: ' + id)
  }
  for (const pillar of EXPECTED_PILLARS) {
    if (!coveredPrimary.has(pillar)) errors.push('product pillar has no primary T-CLIN anchor: ' + pillar)
  }
  return errors
}

test('all current highest-priority T-CLINs have six-pillar evidence-bounded outcome contracts', () => {
  const gate = load(IMPACT_PATH)
  const audit = load(AUDIT_PATH)
  assert.deepEqual(validateGate(gate, audit), [])
})

test('negative controls reject invented outcomes, missing mappings, unjustified validation and altered evidence', () => {
  const gate = load(IMPACT_PATH)
  const audit = load(AUDIT_PATH)
  const change = (mutate) => {
    const candidate = structuredClone(gate)
    mutate(candidate)
    return validateGate(candidate, audit).join(' | ')
  }

  assert.match(change((g) => { g.entries.pop() }), /priority candidate missing impact contract/)
  assert.match(change((g) => { g.entries[0].primaryPillar = 'INVENTED' }), /invalid primary pillar/)
  assert.match(change((g) => { g.entries[0].outcomeMetric.observedValue = 0.98 }), /unverified field results/)
  assert.match(change((g) => { g.entries[0].clinicallyValidatedBenefit = true }), /must not claim clinical validation/)
  assert.match(change((g) => { g.entries[0].evidenceTier = 'E4_EXTERNAL' }), /evidence tier differs/)
  assert.match(change((g) => { g.entries[0].outcomeMetric.denominator = '' }), /missing metric denominator/)
  assert.match(change((g) => { g.entries.push(structuredClone(g.entries[0])) }), /duplicate T-CLIN/)
  assert.match(change((g) => { g.pillars.pop() }), /six-pillar taxonomy/)
  assert.match(change((g) => { g.entries[5].category = 'A_DIRECT_CLINICAL_WORKFLOW' }), /canonical clinical utility category mismatch/)
  assert.match(change((g) => { g.entries[6].clinicalValidationStatus = 'VALIDATED' }), /canonical validation status mismatch/)
  assert.match(change((g) => { g.entries[6].humanAuthority = 'AUTHORISED_CLINICIAN' }), /human authority does not match/)
  assert.match(change((g) => { g.entries[8].primaryPillar = 'CLINICAL_ONE_OS' }), /pilot anchor primary pillar mismatch|product pillar has no primary/)
  assert.match(change((g) => { g.entries[5].id = 'T-CLIN-999' }), /unregistered pilot anchor/)
})
