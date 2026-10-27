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

const load = (path) => JSON.parse(readFileSync(path, 'utf8'))
const meaningful = (value) => typeof value === 'string' && value.trim().length >= 12

function validateGate(gate, audit) {
  const errors = []
  if (gate.schemaVersion !== '1.0.0') errors.push('unsupported impact gate schema')
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

  for (const item of entries) {
    if (!item || typeof item !== 'object') {
      errors.push('malformed impact entry')
      continue
    }
    if (seen.has(item.id)) errors.push('duplicate T-CLIN impact entry: ' + item.id)
    seen.add(item.id)
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
    if (original && original.category !== 'A_DIRECT_CLINICAL_WORKFLOW') {
      errors.push('priority clinical gate cannot relabel nonclinical research as workflow: ' + item.id)
    }
    if (item.clinicallyValidatedBenefit !== false || item.independentlyValidatedBenefit !== false) {
      errors.push('unverified human benefit must not claim clinical validation: ' + item.id)
    }
    if (item.humanAuthority !== 'AUTHORISED_CLINICIAN') {
      errors.push('clinician authority boundary missing: ' + item.id)
    }
    if (item.sourceRegistry !== 'governance/CLINICAL_UTILITY_AUDIT.json') {
      errors.push('provenance pointer missing: ' + item.id)
    }
  }
  for (const id of requiredIds) if (!seen.has(id)) errors.push('priority candidate missing impact contract: ' + id)
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
})
