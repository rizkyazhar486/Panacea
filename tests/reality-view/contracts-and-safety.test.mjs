import assert from 'node:assert/strict'
import test from 'node:test'
import { isOrganTelemetryNode, isProvenanceRef, isTrajectoryChevron, isValidRealityTimestamp } from '../../src/types/realityView.ts'
import { OverrideMemoryStore } from '../../src/engines/reality-view/overrideMemoryStore.ts'
import { selectQuietModeSummary } from '../../src/engines/reality-view/quietModeSelector.ts'

const recordedAt = '2026-11-22T10:30:00+07:00'
const provenance = { id: 'synthetic-observation', fhirResourceType: 'Observation', sourceLabel: 'Synthetic fixture', recordedAt, verified: true }
const organ = {
  meshId: 'fixture-heart', canonicalOntologyId: 'FMA:7088', indonesianLabel: 'Jantung', englishLabel: 'Heart',
  systemId: 'cardiovascular', evidenceClass: 'observed_fhir', statusScore: 0.8,
  shaderUniforms: { perfusionIntensity: 0, highlightHue: '#286777' },
  provenance: [provenance], activeChevrons: [], hardSafetyLock: false,
}
const state = node => ({ nodes: node ? { [node.meshId]: node } : {} })

test('requires a real calendar timestamp, a time zone, and traceable observed evidence', () => {
  for (const invalid of ['2026-02-29T03:00:00Z', '2026-11-31T03:00:00Z', '2026-11-22T03:00:00', 'yesterday']) {
    assert.equal(isValidRealityTimestamp(invalid), false)
  }
  assert.ok(isValidRealityTimestamp(recordedAt))
  assert.ok(isValidRealityTimestamp('2024-02-29T03:00:00Z'))
  assert.equal(isProvenanceRef({ ...provenance, sourceLabel: ' ' }), false)
  assert.ok(isOrganTelemetryNode(organ))
  assert.equal(isOrganTelemetryNode({ ...organ, provenance: [] }), false)
  assert.equal(isOrganTelemetryNode({ ...organ, statusScore: -0.1 }), false)
  assert.equal(isOrganTelemetryNode({ ...organ, statusScore: Number.NaN }), false)
  assert.equal(isOrganTelemetryNode({ ...organ, evidenceClass: 'ocr_verified', provenance: [{ ...provenance, verified: false }] }), false)
})

test('projection intervals must be ordered and finite', () => {
  const chevron = {
    id: 'synthetic-projection', targetMeshId: organ.meshId, direction: 'drifting', horizonDays: 30,
    deltaSummary: 'Model change', clinicalMetricDelta: 'Synthetic metric +1', confidenceInterval: [0, 2],
    confidenceLabel: 'low', counterfactualId: 'synthetic', ddiSafetyVerified: false,
  }
  assert.ok(isTrajectoryChevron(chevron))
  assert.equal(isTrajectoryChevron({ ...chevron, confidenceInterval: [2, 0] }), false)
  assert.equal(isTrajectoryChevron({ ...chevron, confidenceInterval: [0, Infinity] }), false)
})

test('ten dismissals cannot suppress a critical lock, and audit entries cannot be altered', () => {
  const store = new OverrideMemoryStore()
  for (const rule of ['blocked-interaction', 'critical-oxygen', 'critical-pressure']) {
    for (let i = 0; i < 10; i++) store.recordOverride(rule, 'clinical_red_flag', true)
    assert.deepEqual(store.shouldSuppressAlert(rule, true), { suppressed: false, overrideCount: 10, lockEnforced: true })
    assert.equal(store.shouldSuppressAlert(rule, false).lockEnforced, true)
  }
  store.recordOverride('red-flag-without-lock-flag', 'clinical_red_flag', false)
  assert.equal(store.shouldSuppressAlert('red-flag-without-lock-flag', false).suppressed, false)
  assert.ok(store.toJSON().audit.every(entry => Object.isFrozen(entry) && entry.mutable === false))
  assert.equal(JSON.parse(JSON.stringify(store)).audit.length, 31)
})

test('preference history lowers only repeated benign nudges', () => {
  const store = new OverrideMemoryStore()
  store.recordOverride('lifestyle-fixture', 'lifestyle', false)
  assert.equal(store.shouldSuppressAlert('lifestyle-fixture', false).suppressed, false)
  store.recordOverride('lifestyle-fixture', 'lifestyle', false)
  assert.deepEqual(store.shouldSuppressAlert('lifestyle-fixture', false), { suppressed: true, overrideCount: 2, lockEnforced: false })
  assert.deepEqual(store.shouldSuppressAlert('lifestyle-fixture', true), { suppressed: false, overrideCount: 2, lockEnforced: true })
})

test('quiet headlines are short, prioritize verified flags, and distinguish missing or simulated evidence', () => {
  const cases = [
    [organ, false, false, 'daily_checkin'],
    [{ ...organ, statusScore: 0.5 }, false, false, 'check_vitals'],
    [{ ...organ, statusScore: 0.2 }, true, true, 'contact_clinician'],
    [{ ...organ, hardSafetyLock: true }, true, true, 'contact_clinician'],
    [{ ...organ, hardSafetyLock: true, evidenceClass: 'simulated_projection' }, false, false, 'daily_checkin'],
    [{ ...organ, hardSafetyLock: true, provenance: [{ ...provenance, verified: false }] }, false, false, 'daily_checkin'],
    [undefined, false, false, 'daily_checkin'],
  ]
  for (const [node, escalated, urgent, actionType] of cases) {
    const res = selectQuietModeSummary(state(node))
    assert.ok(res.headline.length <= 90)
    assert.doesNotMatch(res.headline, /\b(?:SBP|DBP|HRV|FHIR|ICD|DDI|LVH|HbA1c)\b/i)
    assert.equal(res.escalated, escalated)
    assert.equal(res.primaryAction.urgent, urgent)
    assert.equal(res.primaryAction.actionType, actionType)
  }
  assert.match(selectQuietModeSummary(state()).headline, /More readings/)
})
