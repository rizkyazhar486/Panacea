import test from 'node:test'
import assert from 'node:assert/strict'
import { isConsentActive, validateLongitudinalEvent, createLongitudinalPatientState,
  ingestLongitudinalEvent, canEnterAiContext, canEnterClinicalRecord, projectStateToSurface,
} from '../../src/lib/panaceaLongitudinalState.ts'

const at = '2026-10-04T11:00:00.000Z'
const ms = Date.parse(at)
const consent = { granted: true, purposes: ['ai-context', 'clinical-support', 'personal-visualization'], grantedAt: '2026-01-01T00:00:00.000Z' }
function event(overrides = {}) {
  return { id: 'e', subjectId: 'p', domain: 'vital', metric: 'heart-rate', value: 70, unit: 'bpm',
    confidence: 1, semanticState: 'measured', recordedAt: '2026-10-04T10:00:00.000Z',
    provenance: { sourceKind: 'manual', sourceId: 's', capturedAt: '2026-10-04T10:00:00.000Z', receivedAt: '2026-10-04T10:00:00.000Z' },
    review: { state: 'not-required' }, consent: structuredClone(consent), ...overrides }
}

test('consent grants require literal booleans at ingestion and every access boundary', () => {
  for (const granted of ['false', 'true', 0, 1, {}, null, undefined, false, true]) {
    const e = event({ consent: { ...consent, granted } })
    const before = structuredClone(e)
    if (typeof granted !== 'boolean') assert.throws(() => validateLongitudinalEvent(e), /consent/)
    else assert.equal(validateLongitudinalEvent(e), true)
    assert.equal(isConsentActive(e.consent, 'ai-context', ms), granted === true)
    assert.equal(canEnterAiContext(e, ms), granted === true)
    assert.equal(canEnterClinicalRecord(e, ms), granted === true)
    assert.deepEqual(e, before)
  }
})

test('unsupported consent purpose shapes never authorize clinical or AI use', () => {
  for (const purposes of ['ai-context clinical-support', ['ai-context', 'unsupported'], null, {}, [true], undefined]) {
    const e = event({ consent: { ...consent, purposes } })
    assert.throws(() => ingestLongitudinalEvent(createLongitudinalPatientState('p', at), e), /consent/)
    assert.equal(isConsentActive(e.consent, 'ai-context', ms), false)
    assert.equal(canEnterAiContext(e, ms), false)
    assert.equal(canEnterClinicalRecord(e, ms), false)
  }
})

test('malformed consent timestamps and evaluation clocks deny access without throwing', () => {
  for (const key of ['grantedAt', 'expiresAt', 'revokedAt']) {
    for (const value of ['', 'invalid', null, 0, {}]) {
      const e = event({ consent: { ...consent, [key]: value } })
      assert.equal(isConsentActive(e.consent, 'ai-context', ms), false, key)
      assert.equal(canEnterAiContext(e, ms), false, key)
      assert.equal(canEnterClinicalRecord(e, ms), false, key)
    }
  }
  for (const clock of [NaN, Infinity, -Infinity]) assert.equal(isConsentActive(consent, 'ai-context', clock), false)
})

test('unsupported domains, source kinds and review states are rejected instead of bypassing governance', () => {
  const invalid = [event({ domain: 'unsupported' }), event({ review: { state: 'unsupported' } }),
    event({ provenance: { ...event().provenance, sourceKind: 'unsupported' } })]
  for (const e of invalid) {
    assert.throws(() => validateLongitudinalEvent(e), /known/)
    assert.equal(canEnterAiContext(e, ms), false)
    assert.equal(canEnterClinicalRecord(e, ms), false)
  }
})

test('valid revoked, expired and purpose-restricted consent remains enforced', () => {
  for (const patch of [{ revokedAt: at }, { expiresAt: at }, { purposes: ['personal-visualization'] }, { grantedAt: '2026-10-04T12:00:00.000Z' }]) {
    const e = event({ consent: { ...consent, ...patch } })
    assert.equal(canEnterAiContext(e, ms), false)
    assert.equal(canEnterClinicalRecord(e, ms), false)
  }
  const valid = event()
  const state = ingestLongitudinalEvent(createLongitudinalPatientState('p', at), valid).state
  assert.equal(projectStateToSurface(state, 'ai-chatbot', at).metrics.length, 1)
  assert.equal(canEnterClinicalRecord(valid, ms), true)
})

test('surface projection and direct access share the same fail-closed boundary', () => {
  const e = event({ consent: { ...consent, granted: 'false' } })
  const state = { ...createLongitudinalPatientState('p', at), eventsById: { e }, metricEventIds: { 'heart-rate': ['e'] } }
  for (const surface of ['your-body', 'body-exposure', 'clinical', 'ai-emr', 'ai-chatbot']) {
    assert.equal(projectStateToSurface(state, surface, at).metrics.length, 0, surface)
  }
  const future = event({ recordedAt: '2026-10-04T10:01:00.000Z' })
  assert.equal(validateLongitudinalEvent(future), true, 'ingestion preserves its existing five-minute clock tolerance')
  assert.equal(canEnterAiContext(future, Date.parse('2026-10-04T10:00:00.000Z')), false)
  assert.equal(canEnterClinicalRecord(future, Date.parse('2026-10-04T10:00:00.000Z')), false)
})
