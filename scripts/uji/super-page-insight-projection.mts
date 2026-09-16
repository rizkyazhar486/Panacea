import assert from 'node:assert/strict'
import {
  projectHabitualCareToWidgets,
  validateVisualInsightWidget,
} from '../../src/lib/superPageInsightProjection.ts'
import type { HabitualCareEvaluation } from '../../src/lib/habitualCareEngine.ts'

const evaluation: HabitualCareEvaluation = {
  subjectId: 'opaque-subject',
  evaluatedAt: '2026-09-17T00:00:00.000Z',
  stateRevision: 8,
  signals: [
    {
      metric: 'sleep-duration',
      domain: 'sleep',
      unit: 'h',
      baselineMedian: 8,
      recentMedian: 6.5,
      absoluteChange: -1.5,
      relativeChange: -0.1875,
      direction: 'falling',
      threshold: 0.1,
      thresholdMultiple: 1.875,
      recentSampleCount: 3,
      baselineSampleCount: 3,
      alignedRecentFraction: 1,
      meanConfidence: 0.9,
      firstRecentAt: '2026-09-12T00:00:00.000Z',
      lastRecentAt: '2026-09-16T00:00:00.000Z',
      eventIds: ['s1', 's2', 's3'],
      provenanceSourceIds: ['oura:ring'],
      clinicianReviewRequired: false,
      aiContextEligible: true,
      autonomousClinicalActionAllowed: false,
    },
    {
      metric: 'demo-lab-marker',
      domain: 'lab',
      unit: 'mg/dL',
      baselineMedian: 100,
      recentMedian: 125,
      absoluteChange: 25,
      relativeChange: 0.25,
      direction: 'rising',
      threshold: 0.15,
      thresholdMultiple: 1.666,
      recentSampleCount: 2,
      baselineSampleCount: 2,
      alignedRecentFraction: 1,
      meanConfidence: 0.95,
      firstRecentAt: '2026-09-13T00:00:00.000Z',
      lastRecentAt: '2026-09-16T00:00:00.000Z',
      eventIds: ['l1', 'l2'],
      provenanceSourceIds: ['clinical-system:lab'],
      clinicianReviewRequired: true,
      aiContextEligible: true,
      autonomousClinicalActionAllowed: false,
    },
  ],
  actions: [],
  skipped: [],
  governance: {
    autonomousClinicalActionAllowed: false,
    thresholdsArePresentationRulesNotClinicalCutoffs: true,
  },
}

const widgets = projectHabitualCareToWidgets(evaluation, {
  yourBody: '/fitness-hub',
  clinical: '/clinical',
  forYou: '/for-you',
})

assert.equal(widgets.length, 3)
assert.ok(widgets.every(validateVisualInsightWidget))
assert.ok(widgets.every((widget) => widget.mainTextLines === 1))
assert.ok(widgets.every((widget) => widget.maxInteractionsFromHome <= 2))
assert.ok(widgets.every((widget) => widget.interpretationVisibility === 'on-demand'))
assert.ok(widgets.every((widget) => widget.autonomousClinicalActionAllowed === false))

const body = widgets.find((widget) => widget.surface === 'your-body')
assert.ok(body)
assert.equal(body.metric, 'sleep-duration')
assert.equal(body.visual, 'trend-band')
assert.deepEqual(body.companionSurfaces, ['ai-chatbot'])
assert.ok(body.presentationCoherence <= 1)

const forYou = widgets.find((widget) => widget.surface === 'for-you')
assert.ok(forYou)
assert.equal(forYou.metric, 'sleep-duration')

const clinical = widgets.find((widget) => widget.surface === 'clinical')
assert.ok(clinical)
assert.equal(clinical.metric, 'demo-lab-marker')
assert.equal(clinical.visual, 'timeline')
assert.equal(clinical.requiresClinicianReview, true)
assert.deepEqual(clinical.companionSurfaces, ['ai-chatbot', 'ai-emr'])

assert.throws(() => projectHabitualCareToWidgets(evaluation, {
  yourBody: 'https://example.com',
  clinical: '/clinical',
  forYou: '/for-you',
}), /absolute app route/)

console.log('Super-page insight projection verified: visual-first one-line widgets, on-demand interpretation, <=2-step access, longitudinal provenance, and clinician/AI handoff boundaries.')
