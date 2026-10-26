import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildContextPacket,
  createLongitudinalPatientState,
  ingestLongitudinalEvent,
  projectStateToSurface,
} from '../../src/lib/panaceaLongitudinalState.ts'
import {
  deriveEdenLongitudinalInsight,
  formatEdenInsightDelta,
} from '../../src/domains/clinical-operations/model/edenLongitudinalInsight.ts'

const AT = '2026-10-27T12:00:00.000Z'
const PERSONAL_CONSENT = {
  granted: true,
  purposes: ['personal-visualization'],
  grantedAt: '2026-01-01T00:00:00.000Z',
}
const CLINICAL_CONSENT = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support'],
  grantedAt: '2026-01-01T00:00:00.000Z',
}

function event(overrides = {}) {
  const base = {
    id: 'event-1',
    subjectId: 'patient-1',
    domain: 'vital',
    metric: 'heart-rate',
    value: 60,
    unit: 'bpm',
    recordedAt: '2026-10-01T08:00:00.000Z',
    confidence: 0.9,
    semanticState: 'measured',
    provenance: {
      sourceKind: 'device',
      sourceId: 'fixture:wearable:1',
      capturedAt: '2026-10-01T08:00:00.000Z',
      receivedAt: '2026-10-01T08:01:00.000Z',
      method: 'fixture optical sensor',
    },
    consent: structuredClone(PERSONAL_CONSENT),
    review: { state: 'not-required' },
  }
  return {
    ...base,
    ...overrides,
    provenance: { ...base.provenance, ...(overrides.provenance ?? {}) },
    consent: { ...base.consent, ...(overrides.consent ?? {}) },
    review: { ...base.review, ...(overrides.review ?? {}) },
  }
}

function stateFor(events, subjectId = 'patient-1') {
  return events.reduce(
    (state, candidate) => ingestLongitudinalEvent(state, candidate).state,
    createLongitudinalPatientState(subjectId, '2026-01-01T00:00:00.000Z'),
  )
}

function rawStateFor(events, subjectId = 'patient-1') {
  return {
    subjectId,
    revision: events.length,
    updatedAt: AT,
    eventsById: Object.fromEntries(events.map((candidate) => [candidate.id, candidate])),
    metricEventIds: Object.fromEntries(
      [...new Set(events.map((candidate) => candidate.metric))].map((metric) => [
        metric,
        events.filter((candidate) => candidate.metric === metric).map((candidate) => candidate.id),
      ]),
    ),
  }
}

function sourceFor(state, overrides = {}) {
  return {
    state,
    patientId: 'patient-1',
    viewerRole: 'pasien',
    accountPatientId: 'patient-1',
    labels: {},
    ...overrides,
  }
}

function deriveFor(events, overrides = {}) {
  const state = stateFor(events)
  return deriveEdenLongitudinalInsight({
    source: sourceFor(state, overrides.source),
    at: overrides.at ?? AT,
    depth: overrides.depth ?? 'deep',
  })
}

function twoHeartRateEvents() {
  return [
    event(),
    event({
      id: 'event-2',
      value: 66,
      recordedAt: '2026-10-08T08:00:00.000Z',
      provenance: {
        sourceId: 'fixture:wearable:2',
        capturedAt: '2026-10-08T08:00:00.000Z',
        receivedAt: '2026-10-08T08:01:00.000Z',
      },
    }),
  ]
}

test('canonical observations produce a sourced inferred pattern without mutating patient state', () => {
  const state = stateFor(twoHeartRateEvents())
  const before = structuredClone(state)
  const input = { source: sourceFor(state), at: AT, depth: 'deep' }
  const first = deriveEdenLongitudinalInsight(input)
  const second = deriveEdenLongitudinalInsight(input)

  assert.deepEqual(first, second)
  assert.deepEqual(state, before)
  assert.equal(first.access, 'ready')
  assert.equal(first.changes.length, 1)
  const change = first.changes[0]
  assert.equal(change.latestValue, 66)
  assert.equal(change.observationLabel, 'Measured record')
  assert.equal(change.trend.direction, 'rising')
  assert.equal(change.trend.sampleCount, 2)
  assert.equal(change.trend.absoluteDelta, 6)
  assert.equal(change.trend.relativeDelta, 0.1)
  assert.equal(change.provenance.sourceId, 'fixture:wearable:2')
  assert.equal(change.reference.id, 'medlineplus-vital-signs')
  assert.match(first.headline, /inferred pattern/)
  assert.equal(first.governance.autonomousClinicalCommitAllowed, false)
  assert.deepEqual(first.boundaries, {
    canonicalStateReused: true,
    independentPatientStoreCreated: false,
    consentBroadened: false,
    simulationsUsedAsObservations: false,
    diagnosesGenerated: false,
    treatmentChangesRecommended: false,
  })
  assert.equal(formatEdenInsightDelta(change.trend), '+6 bpm · +10%')
})

test('Simple, Explore, and Evidence reuse the cognitive kernel without exposing simulations as observations', () => {
  const state = stateFor(twoHeartRateEvents())
  const simple = deriveEdenLongitudinalInsight({ source: sourceFor(state), at: AT, depth: 'simple' })
  const explore = deriveEdenLongitudinalInsight({ source: sourceFor(state), at: AT, depth: 'explore' })
  const deep = deriveEdenLongitudinalInsight({ source: sourceFor(state), at: AT, depth: 'deep' })

  assert.equal(simple.cognitivePlan.visibleDepth, 'orientation')
  assert.equal(explore.cognitivePlan.visibleDepth, 'mechanism')
  assert.equal(deep.cognitivePlan.visibleDepth, 'quantitative')
  assert.deepEqual(deep.cognitivePlan.visibleTruthLanes, ['observed', 'estimated'])
  assert.ok(!deep.cognitivePlan.visibleTruthLanes.includes('simulated'))
  for (const result of [simple, explore, deep]) {
    assert.equal(result.cognitivePlan.requirements.preserveTruthLaneLabels, true)
    assert.equal(result.cognitivePlan.requirements.provenanceRecoverable, true)
    assert.equal(result.cognitivePlan.requirements.counterfactualIsolation, true)
    assert.equal(result.cognitivePlan.requirements.surfaceMayOwnIndependentHumanState, false)
  }
})

test('viewer, account, active-patient, and canonical-subject mismatches fail closed', () => {
  const state = stateFor(twoHeartRateEvents())
  const cases = [
    [{ viewerRole: 'dokter' }, 'patient-view-required'],
    [{ viewerRole: undefined }, 'patient-view-required'],
    [{ accountPatientId: 'patient-2' }, 'identity-mismatch'],
    [{ accountPatientId: undefined }, 'identity-mismatch'],
    [{ patientId: 'patient-2' }, 'identity-mismatch'],
    [{ state: null }, 'no-state'],
  ]
  for (const [patch, access] of cases) {
    const result = deriveEdenLongitudinalInsight({ source: sourceFor(state, patch), at: AT, depth: 'deep' })
    assert.equal(result.access, access)
    assert.equal(result.changes.length, 0)
    assert.equal(result.clinicianReviewedRecordCount, 0)
    assert.ok(!JSON.stringify(result).includes('fixture:wearable'))
  }
})

test('revoked, expired, purpose-missing, and future observations never enter the insight', () => {
  const invalidConsentCases = [
    { revokedAt: AT },
    { expiresAt: AT },
    { purposes: ['clinical-support'] },
    { granted: false },
  ]
  for (const consent of invalidConsentCases) {
    const result = deriveFor([event({ consent })])
    assert.equal(result.changes.length, 0)
    assert.equal(result.governance.blockedByConsent, 1)
    assert.ok(result.unknowns.some((item) => item.includes('consent')))
  }

  const future = deriveFor([event({
    recordedAt: '2026-11-01T08:00:00.000Z',
    provenance: { capturedAt: '2026-11-01T08:00:00.000Z', receivedAt: '2026-11-01T08:01:00.000Z' },
  })])
  assert.equal(future.changes.length, 0)
  assert.match(future.headline, /No authorized numeric observations/)
})

test('invalid or missing provenance is visibly blocked rather than repaired or displayed', () => {
  for (const provenance of [
    { sourceId: '' },
    { capturedAt: 'not-a-date' },
    null,
  ]) {
    const candidate = provenance === null ? { ...event(), provenance: null } : event({ provenance })
    const result = deriveEdenLongitudinalInsight({
      source: sourceFor(rawStateFor([candidate])),
      at: AT,
      depth: 'deep',
    })
    assert.equal(result.changes.length, 0)
    assert.equal(result.governance.blockedByTruthClass, 1)
    assert.ok(result.unknowns.some((item) => item.includes('provenance')))
  }
})

test('simulations, counterfactuals, drafts, estimates, stale, unknown, and unsupported events stay outside observation trends', () => {
  const nonObservations = [
    event({ id: 'simulated', metric: 'simulated-heart-rate', semanticState: 'simulated', value: 500 }),
    event({ id: 'counterfactual', metric: 'counterfactual-heart-rate', semanticState: 'counterfactual', value: 400 }),
    event({ id: 'draft', metric: 'draft-heart-rate', semanticState: 'ai-draft', value: 300, review: { state: 'pending' } }),
    event({ id: 'estimate', metric: 'estimated-heart-rate', semanticState: 'model-estimated', value: 200 }),
    event({ id: 'derived', metric: 'derived-heart-rate', semanticState: 'derived', value: 100 }),
    event({ id: 'rule', metric: 'rule-heart-rate', semanticState: 'rule-output', value: 95 }),
    event({ id: 'hypothesis', metric: 'hypothesis-heart-rate', semanticState: 'hypothesis', value: 92 }),
    event({ id: 'reference', metric: 'reference-heart-rate', semanticState: 'reference', value: 88 }),
    event({ id: 'stale', metric: 'stale-heart-rate', semanticState: 'stale', value: 90 }),
    event({ id: 'unknown', metric: 'unknown-heart-rate', semanticState: 'unknown', value: 80 }),
    event({ id: 'unsupported', metric: 'unsupported-heart-rate', semanticState: 'unsupported', value: 70 }),
    event({ id: 'unavailable', metric: 'unavailable-heart-rate', semanticState: 'unavailable', value: 75 }),
  ]
  const result = deriveFor([...twoHeartRateEvents(), ...nonObservations])

  assert.equal(result.changes.length, 1)
  assert.equal(result.changes[0].latestValue, 66)
  assert.equal(result.changes[0].trend.sampleCount, 2)
  for (const semanticState of ['simulated', 'counterfactual', 'ai-draft', 'model-estimated', 'derived', 'rule-output', 'hypothesis', 'reference', 'stale', 'unknown', 'unsupported', 'unavailable']) {
    assert.equal(result.separated.find((item) => item.semanticState === semanticState)?.eventCount, 1, semanticState)
  }
  assert.equal(result.governance.nonObservationTrendInputs, 0)
  assert.equal(result.boundaries.simulationsUsedAsObservations, false)

  const outsideBodyScope = deriveFor([event({
    id: 'simulated-lab',
    domain: 'lab',
    metric: 'lab.simulated',
    semanticState: 'simulated',
    consent: CLINICAL_CONSENT,
  })])
  assert.equal(outsideBodyScope.changes.length, 0)
  assert.equal(outsideBodyScope.separated.length, 0)
})

test('one-sample, mixed-unit, non-numeric, and near-zero histories preserve explicit unknowns', () => {
  const one = deriveFor([event()])
  assert.equal(one.changes[0].trend, null)
  assert.ok(one.changes[0].limitations.some((item) => item.includes('Only one authorized observation')))

  const mixed = deriveFor([
    event({ unit: 'mg/dL', metric: 'glucose' }),
    event({ id: 'event-2', metric: 'glucose', unit: 'mmol/L', value: 5.5, recordedAt: '2026-10-08T08:00:00.000Z', provenance: { capturedAt: '2026-10-08T08:00:00.000Z', receivedAt: '2026-10-08T08:01:00.000Z' } }),
  ])
  assert.equal(mixed.changes[0].eventCount, 2)
  assert.equal(mixed.changes[0].trend, null)
  assert.ok(mixed.changes[0].limitations.some((item) => item.includes('mixed units')))

  const nonNumeric = deriveFor([event({ value: 'not-a-number' })])
  assert.equal(nonNumeric.changes.length, 0)

  const nearZero = deriveFor([
    event({ value: 0, metric: 'glucose', unit: 'mg/dL' }),
    event({ id: 'event-2', value: 2, metric: 'glucose', unit: 'mg/dL', recordedAt: '2026-10-08T08:00:00.000Z', provenance: { capturedAt: '2026-10-08T08:00:00.000Z', receivedAt: '2026-10-08T08:01:00.000Z' } }),
  ])
  assert.equal(nearZero.changes[0].trend.relativeDelta, null)
  assert.equal(nearZero.changes[0].trend.absoluteDelta, 2)
  assert.match(formatEdenInsightDelta(nearZero.changes[0].trend), /relative change unknown/)
  assert.equal(nearZero.changes[0].reference.id, 'niddk-glucose-insulin')
})

test('undeclared legacy values remain usable but are never relabelled as measured facts', () => {
  const result = deriveFor([event({ semanticState: undefined })])
  assert.equal(result.changes[0].observationLabel, 'Recorded value · truth class undeclared')
  assert.equal(result.changes[0].semanticState, undefined)
  assert.equal(result.separated.find((item) => item.semanticState === 'undeclared')?.eventCount, 1)
  assert.ok(result.changes[0].limitations.some((item) => item.includes('not relabelled as measured')))
  assert.ok(result.unknowns.some((item) => item.includes('not called measured')))
})

test('curated physiology is bounded; unknown metrics do not receive invented explanations', () => {
  const known = deriveFor([event({ metric: 'spo2', unit: '%', value: 96 })])
  assert.equal(known.changes[0].reference.id, 'fda-pulse-oximeter-basics')
  assert.match(known.changes[0].whyItMatters, /estimates blood oxygen saturation/)
  assert.match(known.changes[0].limitations[1], /Accuracy can be affected/)

  const unknown = deriveFor([event({ metric: 'new-unreviewed-biomarker', value: 1 })])
  assert.equal(unknown.changes[0].reference, null)
  assert.match(unknown.changes[0].whyItMatters, /does not explain the cause/)
  assert.ok(unknown.changes[0].limitations.includes('No curated physiological explanation is available for this metric; its clinical meaning remains unknown here.'))
})

test('accepted clinician-reviewed records are identified without manufacturing a conclusion', () => {
  const reviewed = event({
    semanticState: 'clinician-reviewed',
    review: { state: 'accepted', reviewerId: 'clinician-fixture', reviewedAt: '2026-10-02T09:00:00.000Z' },
  })
  const result = deriveFor([reviewed])
  assert.equal(result.changes[0].observationLabel, 'Clinician-reviewed record')
  assert.equal(result.changes[0].review.reviewerId, 'clinician-fixture')
  assert.equal(result.clinicianReviewedRecordCount, 1)
  assert.equal(result.governance.autonomousClinicalCommitAllowed, false)

  const unreviewed = deriveFor([event()])
  assert.equal(unreviewed.clinicianReviewedRecordCount, 0)
  assert.ok(unreviewed.unknowns.includes('No clinician-reviewed conclusion is inferred from this view.'))
})

test('clinician-rejected values never headline or alter observation trends', () => {
  const rejected = event({
    id: 'rejected-vital',
    value: 500,
    recordedAt: '2026-10-09T08:00:00.000Z',
    provenance: {
      sourceId: 'fixture:wearable:rejected',
      capturedAt: '2026-10-09T08:00:00.000Z',
      receivedAt: '2026-10-09T08:01:00.000Z',
    },
    review: {
      state: 'rejected',
      reviewerId: 'clinician-fixture',
      reviewedAt: '2026-10-09T09:00:00.000Z',
    },
  })
  const result = deriveFor([...twoHeartRateEvents(), rejected])
  assert.equal(result.changes.length, 1)
  assert.equal(result.changes[0].latestValue, 66)
  assert.equal(result.changes[0].trend.sampleCount, 2)
  assert.equal(result.changes[0].trend.absoluteDelta, 6)
  assert.equal(result.separated.find((item) => item.semanticState === 'clinician-rejected')?.eventCount, 1)
  assert.equal(result.governance.nonObservationTrendInputs, 0)
  assert.ok(result.unknowns.some((item) => item.includes('clinician-rejected')))

  const rejectedOnly = deriveFor([rejected])
  assert.equal(rejectedOnly.changes.length, 0)
  assert.equal(rejectedOnly.headline, 'No authorized numeric observations are available for this personal view.')
  assert.equal(rejectedOnly.separated.find((item) => item.semanticState === 'clinician-rejected')?.eventCount, 1)
})

test('clinical surface independently enforces purpose, truth class, and point-in-time review', () => {
  const pending = event({
    id: 'pending-lab',
    domain: 'lab',
    metric: 'lab.gdp',
    value: 100,
    unit: 'mg/dL',
    semanticState: 'imported',
    consent: CLINICAL_CONSENT,
    review: { state: 'pending' },
  })
  const acceptedOne = event({
    id: 'accepted-lab-1',
    domain: 'lab',
    metric: 'lab.gdp',
    value: 105,
    unit: 'mg/dL',
    semanticState: 'clinician-reviewed',
    recordedAt: '2026-10-08T08:00:00.000Z',
    provenance: { capturedAt: '2026-10-08T08:00:00.000Z', receivedAt: '2026-10-08T08:01:00.000Z' },
    consent: CLINICAL_CONSENT,
    review: { state: 'accepted', reviewerId: 'clinician-fixture', reviewedAt: '2026-10-08T09:00:00.000Z' },
  })
  const acceptedTwo = event({
    id: 'accepted-lab-2',
    domain: 'lab',
    metric: 'lab.gdp',
    value: 110,
    unit: 'mg/dL',
    semanticState: 'imported',
    recordedAt: '2026-10-15T08:00:00.000Z',
    provenance: { capturedAt: '2026-10-15T08:00:00.000Z', receivedAt: '2026-10-15T08:01:00.000Z' },
    consent: CLINICAL_CONSENT,
    review: { state: 'accepted', reviewerId: 'clinician-fixture', reviewedAt: '2026-10-15T09:00:00.000Z' },
  })
  const state = stateFor([pending, acceptedOne, acceptedTwo])
  const clinical = projectStateToSurface(state, 'clinical', AT)
  assert.equal(clinical.metrics.length, 1)
  assert.equal(clinical.metrics[0].eventCount, 2)
  assert.equal(buildContextPacket(state, 'clinical', AT).signals[0].trend.sampleCount, 2)

  const pendingOnly = projectStateToSurface(stateFor([pending]), 'clinical', AT)
  assert.equal(pendingOnly.metrics.length, 0)
  assert.equal(pendingOnly.pendingClinicalReview, 1)

  const personalOnly = projectStateToSurface(stateFor([event({ consent: PERSONAL_CONSENT })]), 'clinical', AT)
  assert.equal(personalOnly.metrics.length, 0)
  assert.equal(personalOnly.blockedByConsent, 1)

  const beforeReview = projectStateToSurface(stateFor([acceptedTwo]), 'clinical', '2026-10-15T08:30:00.000Z')
  assert.equal(beforeReview.metrics.length, 0)
  assert.equal(beforeReview.pendingClinicalReview, 1)
})

test('Care Episode integration keeps one depth owner, canonical provider, safe references, and mobile disclosure contracts', () => {
  const page = readFileSync(new URL('../../src/pages/clinical/CareEpisode.tsx', import.meta.url), 'utf8')
  const model = readFileSync(new URL('../../src/domains/clinical-operations/model/edenLongitudinalInsight.ts', import.meta.url), 'utf8')
  const ui = readFileSync(new URL('../../src/domains/clinical-operations/ui/EdenLongitudinalInsightSection.tsx', import.meta.url), 'utf8')
  const provider = readFileSync(new URL('../../src/lib/longitudinalSnapshot.ts', import.meta.url), 'utf8')
  const board = readFileSync(new URL('../../docs/governance/TASK_BOARD.md', import.meta.url), 'utf8')

  assert.equal((page.match(/data-eden-depth-selector=/g) ?? []).length, 1)
  assert.ok(page.includes('useLongitudinalState()'))
  assert.ok(page.includes('viewerRole: state.account?.role'))
  assert.ok(page.includes('accountPatientId: state.account?.patientId'))
  assert.ok(page.includes('EdenLongitudinalInsightSection'))
  assert.ok(page.indexOf('const [duplicateWarning') < page.indexOf('if (!record)'))
  assert.ok(page.includes('03 · What Comes Next'))
  assert.ok(page.includes("'Evidence'"))
  assert.ok(!page.includes('LongitudinalStateProvider'))
  assert.ok(provider.includes("purposes: ['personal-visualization']"))

  for (const contract of ['01 · What Changed', '02 · Why It Matters', 'data-eden-inferred-pattern', 'data-eden-change-disclosure', 'data-eden-evidence-detail', 'data-eden-separated-truth-classes', 'min-h-[44px]', '<details', '<summary', 'insight.governance.nonObservationTrendInputs', 'Scope: authorized personal body view only', 'group-open:rotate-45']) {
    assert.ok(ui.includes(contract), contract)
  }
  assert.ok(!model.includes('localStorage'))
  assert.ok(!model.includes('fetch('))
  assert.ok(!model.includes('Date.now('))
  assert.ok(!model.includes('Math.random('))
  assert.ok(!model.includes('createLongitudinalPatientState'))
  assert.equal((board.match(/T-CLIN-53/g) ?? []).length, 1)
  assert.ok(board.includes('T-CLIN-52'))
})

test('structural workflow proof reduces two separate answers surfaces to one without claiming user or clinical benefit', () => {
  const page = readFileSync(new URL('../../src/pages/clinical/CareEpisode.tsx', import.meta.url), 'utf8')
  const ui = readFileSync(new URL('../../src/domains/clinical-operations/ui/EdenLongitudinalInsightSection.tsx', import.meta.url), 'utf8')
  const priorBodySurface = readFileSync(new URL('../../src/components/growth/ApaYangBerubah.tsx', import.meta.url), 'utf8')
  assert.ok(priorBodySurface.includes('useLongitudinalState()'))

  // Structural fixture derived from the actual pre-existing two surfaces and
  // this integrated Care Episode surface. No seconds or human outcomes inferred.
  const baselineSurfaceCount = 2
  const integratedSurfaceCount = page.includes('EdenLongitudinalInsightSection') && page.includes('03 · What Comes Next') ? 1 : 2
  const surfaceReductionPct = ((baselineSurfaceCount - integratedSurfaceCount) / baselineSurfaceCount) * 100
  const evidenceAccessInteractions = page.includes("'Evidence'") && ui.includes('data-eden-change-disclosure') ? 2 : null

  assert.equal(surfaceReductionPct, 50)
  assert.equal(evidenceAccessInteractions, 2)
  assert.ok(ui.includes('01 · What Changed'))
  assert.ok(ui.includes('02 · Why It Matters'))
  assert.ok(ui.includes('Observation provenance'))
  assert.deepEqual({
    claimState: 'structural-measure',
    baselineSurfaceCount,
    integratedSurfaceCount,
    surfaceReductionPct,
    representativeUserEvaluation: false,
    measuredTimeSavings: false,
    clinicalValidation: false,
  }, {
    claimState: 'structural-measure',
    baselineSurfaceCount: 2,
    integratedSurfaceCount: 1,
    surfaceReductionPct: 50,
    representativeUserEvaluation: false,
    measuredTimeSavings: false,
    clinicalValidation: false,
  })
})
