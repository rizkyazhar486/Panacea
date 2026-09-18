import assert from 'node:assert/strict'
import {
  CLINICAL_EVALUATION_BOUNDARY,
  CLINICAL_EVALUATION_FORMULAS,
  proportionMetric,
  summarizeClinicalEvaluation,
  wilsonInterval,
} from '../../src/lib/evaluation/clinicalEvaluationMetrics'

const summary = summarizeClinicalEvaluation({
  diagnoses: [
    { caseId: 'case-001', goldDiagnosisIds: ['dx-a'], predictedDiagnosisIds: ['dx-a', 'dx-b', 'dx-c'] },
    { caseId: 'case-002', goldDiagnosisIds: ['dx-d'], predictedDiagnosisIds: ['dx-x', 'dx-y', 'dx-d'] },
    { caseId: 'case-003', goldDiagnosisIds: ['dx-e'], predictedDiagnosisIds: ['dx-x', 'dx-y', 'dx-z', 'dx-q', 'dx-e'] },
    { caseId: 'case-004', goldDiagnosisIds: ['dx-f'], predictedDiagnosisIds: ['dx-x'] },
    { caseId: 'case-005', goldDiagnosisIds: ['dx-g'], predictedDiagnosisIds: [] },
    { caseId: 'case-006', goldDiagnosisIds: [], predictedDiagnosisIds: ['dx-z'] },
  ],
  recommendations: [
    { recommendationId: 'rec-1', unsafe: false },
    { recommendationId: 'rec-2', unsafe: false },
    { recommendationId: 'rec-3', unsafe: true },
    { recommendationId: 'rec-4', unsafe: false },
  ],
  citations: [
    { citationId: 'cit-1', supportsClaim: true },
    { citationId: 'cit-2', supportsClaim: true },
    { citationId: 'cit-3', supportsClaim: false },
  ],
  clinicianReviews: [
    { itemId: 'item-1', accepted: true },
    { itemId: 'item-2', accepted: false },
    { itemId: 'item-3', accepted: true },
    { itemId: 'item-4', accepted: true },
  ],
})

assert.equal(summary.caseCount, 6)
assert.equal(summary.top1Accuracy.denominator, 5)
assert.equal(summary.top3Recall.denominator, 5)
assert.equal(summary.top5Recall.denominator, 5)
assert.equal(summary.top1Accuracy.value, 1 / 5)
assert.equal(summary.top3Recall.value, 2 / 5)
assert.equal(summary.top5Recall.value, 3 / 5)
assert.equal(summary.unsafeRecommendationRate.value, 0.25)
assert.equal(summary.citationSupportPrecision.value, 2 / 3)
assert.equal(summary.clinicianAcceptanceRate.value, 0.75)

for (const metric of [
  summary.top1Accuracy,
  summary.top3Recall,
  summary.top5Recall,
  summary.unsafeRecommendationRate,
  summary.citationSupportPrecision,
  summary.clinicianAcceptanceRate,
]) {
  assert.ok(metric.wilson95)
  assert.ok(metric.wilson95!.low >= 0)
  assert.ok(metric.wilson95!.high <= 1)
  assert.ok(metric.wilson95!.low <= metric.value!)
  assert.ok(metric.wilson95!.high >= metric.value!)
}

const empty = summarizeClinicalEvaluation({})
assert.equal(empty.top1Accuracy.value, null)
assert.equal(empty.top1Accuracy.wilson95, null)
assert.equal(empty.unsafeRecommendationRate.value, null)
assert.equal(empty.citationSupportPrecision.value, null)
assert.equal(empty.clinicianAcceptanceRate.value, null)

const abstentionOnly = summarizeClinicalEvaluation({
  diagnoses: [{ caseId: 'abstain-001', goldDiagnosisIds: ['dx-a'], predictedDiagnosisIds: [] }],
})
assert.equal(abstentionOnly.top1Accuracy.denominator, 1)
assert.equal(abstentionOnly.top1Accuracy.value, 0)
assert.equal(abstentionOnly.top5Recall.value, 0)

assert.deepEqual(proportionMetric(0, 0), {
  numerator: 0,
  denominator: 0,
  value: null,
  wilson95: null,
})
assert.throws(() => proportionMetric(2, 1), /invalid proportion counts/)
assert.equal(wilsonInterval(1, 0), null)
assert.equal(wilsonInterval(3, 2), null)
assert.equal(wilsonInterval(0.5, 1), null)
assert.equal(wilsonInterval(1, 2, 0), null)
assert.equal(wilsonInterval(1, 2, Number.NaN), null)

const interval = wilsonInterval(50, 100)
assert.ok(interval)
assert.ok(interval!.low < 0.5)
assert.ok(interval!.high > 0.5)

assert.ok(CLINICAL_EVALUATION_FORMULAS.topKRecall.includes('empty prediction lists count as misses'))
assert.ok(CLINICAL_EVALUATION_BOUNDARY.includes('do not by themselves establish clinical validity'))
assert.ok(CLINICAL_EVALUATION_BOUNDARY.includes('de-identified'))

console.log('clinical-evaluation-metrics: ok')
