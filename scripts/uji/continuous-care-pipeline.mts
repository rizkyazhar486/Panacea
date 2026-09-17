import assert from 'node:assert/strict'
import { runContinuousCareSync } from '../../src/lib/continuousCarePipeline.ts'
import { createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'
import type { WearableSample } from '../../src/lib/wearableSignalAdapters.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-08-01T00:00:00.000Z',
}

function sleep(id: string, value: number, recordedAt: string): WearableSample {
  return {
    provider: 'oura',
    externalId: id,
    subjectId: 'pipeline-subject',
    metric: 'sleep-duration',
    value,
    unit: 'h',
    recordedAt,
    receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
    confidence: 0.94,
    sourceDevice: 'ring',
  }
}

const initial = createLongitudinalPatientState('pipeline-subject', '2026-08-01T00:00:00.000Z')
const samples = [
  sleep('s1', 8.0, '2026-09-01T00:00:00.000Z'),
  sleep('s2', 8.1, '2026-09-03T00:00:00.000Z'),
  sleep('s3', 7.9, '2026-09-05T00:00:00.000Z'),
  sleep('s4', 6.5, '2026-09-12T00:00:00.000Z'),
  sleep('s5', 6.4, '2026-09-14T00:00:00.000Z'),
  sleep('s6', 6.6, '2026-09-16T00:00:00.000Z'),
]

const request = {
  state: initial,
  wearableSamples: samples,
  consent,
  habitualRules: [{
    metric: 'sleep-duration',
    recentWindowDays: 7,
    baselineLookbackDays: 21,
    relativeChangeThreshold: 0.1,
    minRecentSamples: 3,
    minBaselineSamples: 3,
  }],
  routes: {
    yourBody: '/fitness-hub',
    clinical: '/clinical',
    forYou: '/for-you',
  },
  evaluatedAt: '2026-09-17T00:00:00.000Z',
} as const

const first = runContinuousCareSync(request)
assert.equal(first.normalizedEventCount, 6)
assert.equal(first.insertedEventCount, 6)
assert.equal(first.duplicateEventCount, 0)
assert.equal(first.state.revision, 6)
assert.equal(first.habitualCare.signals.length, 1)
assert.equal(first.habitualCare.signals[0].direction, 'falling')
assert.ok(first.widgets.some((widget) => widget.surface === 'your-body'))
assert.ok(first.widgets.some((widget) => widget.surface === 'for-you'))
assert.ok(first.aiChatbotContext.signals.some((signal) => signal.metric === 'sleep-duration'))
assert.equal(first.aiEmrContext.governance.autonomousClinicalCommitAllowed, false)
assert.equal(first.orchestration.eventDriven, true)
assert.equal(first.orchestration.durableTransportImplementedHere, false)

const second = runContinuousCareSync({ ...request, state: first.state })
assert.equal(second.insertedEventCount, 0)
assert.equal(second.duplicateEventCount, 6)
assert.equal(second.state.revision, 6)

console.log('Continuous care pipeline verified: wearable normalization → idempotent longitudinal state → change detection → visual-first widgets → AI Chatbot/AI-EMR context.')
