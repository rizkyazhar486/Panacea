import assert from 'node:assert/strict'
import {
  comparePredictionToObservation,
  createRealityErrorLedger,
  markPredictionExpiredUnobserved,
  matchPredictionToObservations,
  recordRealityPrediction,
  type RealityPredictionRecord,
  type ObservationSigmaEvidence,
} from '../../src/lib/physiology/realityErrorLedger.ts'

const prediction = (overrides: Partial<RealityPredictionRecord> = {}): RealityPredictionRecord => ({
  id: 'pred-1',
  subjectId: 'subject-1',
  field: 'cardio.heart_rate',
  unit: 'bpm',
  predictedValue: 112,
  predictedSigma: 6,
  createdAt: '2026-09-27T10:00:00.000Z',
  targetAt: '2026-09-27T10:30:00.000Z',
  predictionClass: 'prospective',
  provenance: {
    provenanceId: 'prov-1',
    engineId: 'cardio.engine',
    modelId: 'cardio-model',
    modelVersion: '1.0.0',
    parameterSetId: 'population-v1',
    validationClass: 'synthetic',
    fidelity: 'infrastructure-fixture',
    parentProvenanceIds: ['parent-1'],
  },
  ...overrides,
})

const empty = createRealityErrorLedger('subject-1')
assert.equal(empty.subjectId, 'subject-1')
assert.equal(empty.revision, 0)
assert.deepEqual(empty.predictionsById, {})
assert.deepEqual(empty.statusByPredictionId, {})
assert.deepEqual(empty.comparisonsById, {})
assert.deepEqual(empty.comparisonIdByPredictionId, {})

const inserted = recordRealityPrediction(empty, prediction())
assert.equal(inserted.status, 'inserted')
assert.equal(inserted.ledger.revision, 1)
assert.equal(inserted.ledger.statusByPredictionId['pred-1'], 'pending')
assert.equal(inserted.ledger.predictionsById['pred-1'].predictedValue, 112)

const duplicate = recordRealityPrediction(inserted.ledger, prediction())
assert.equal(duplicate.status, 'duplicate')
assert.equal(duplicate.ledger.revision, 1)
assert.deepEqual(duplicate.ledger, inserted.ledger)

assert.throws(() => recordRealityPrediction(inserted.ledger, prediction({ predictedValue: 113 })), /conflicting prediction id/)
assert.throws(() => createRealityErrorLedger('   '), /subjectId/)
assert.throws(() => recordRealityPrediction(empty, prediction({ id: ' ' })), /id/)
assert.throws(() => recordRealityPrediction(empty, prediction({ field: ' ' })), /field/)
assert.throws(() => recordRealityPrediction(empty, prediction({ unit: ' ' })), /unit/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedValue: Number.NaN })), /predictedValue/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedSigma: -1 })), /predictedSigma/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedSigma: Number.POSITIVE_INFINITY })), /predictedSigma/)
assert.throws(() => recordRealityPrediction(empty, prediction({ createdAt: 'not-a-date' })), /createdAt/)
assert.throws(() => recordRealityPrediction(empty, prediction({ targetAt: '2026-09-27T09:59:59.000Z' })), /targetAt/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictionClass: 'counterfactual' as never })), /prospective/)
assert.throws(() => recordRealityPrediction(empty, prediction({ subjectId: 'subject-2' })), /subjectId.*ledger/)
assert.throws(() => recordRealityPrediction(empty, prediction({ provenance: { ...prediction().provenance, modelId: ' ' } })), /modelId/)

assert.throws(() => markPredictionExpiredUnobserved(inserted.ledger, 'missing', '2026-09-27T10:31:00.000Z'), /unknown prediction id/)
assert.throws(() => markPredictionExpiredUnobserved(inserted.ledger, 'pred-1', '2026-09-27T10:29:59.000Z'), /before target/)
const beforeExpiry = structuredClone(inserted.ledger.predictionsById['pred-1'])
const expired = markPredictionExpiredUnobserved(inserted.ledger, 'pred-1', '2026-09-27T10:31:00.000Z')
assert.equal(expired.revision, 2)
assert.equal(expired.statusByPredictionId['pred-1'], 'expired-unobserved')
assert.deepEqual(expired.comparisonsById, {})
assert.deepEqual(expired.predictionsById['pred-1'], beforeExpiry)
const expiredAgain = markPredictionExpiredUnobserved(expired, 'pred-1', '2026-09-27T10:32:00.000Z')
assert.deepEqual(expiredAgain, expired)

console.log('reality-error-ledger task1: prediction lifecycle')


const observation = (overrides: Record<string, unknown> = {}) => ({
  id: 'obs-1', subjectId: 'subject-1', domain: 'vital', metric: 'cardio.heart_rate', value: 126, unit: 'bpm',
  recordedAt: '2026-09-27T10:30:00.000Z', confidence: 0.42,
  provenance: { sourceKind: 'wearable', sourceId: 'device:watch', capturedAt: '2026-09-27T10:30:00.000Z', receivedAt: '2026-09-27T10:30:01.000Z' },
  consent: { granted: true, purposes: ['personal-visualization'], grantedAt: '2026-09-27T09:00:00.000Z' },
  review: { state: 'not-required' }, semanticState: 'measured', ...overrides,
}) as any
const opts = { matchToleranceMs: 60_000, comparisonCreatedAt: '2026-09-27T10:30:02.000Z' }
const fresh = recordRealityPrediction(createRealityErrorLedger('subject-1'), prediction()).ledger
const predBeforeCompare = structuredClone(fresh.predictionsById['pred-1'])
const compared = comparePredictionToObservation(fresh, 'pred-1', observation(), opts)
assert.equal(compared.ledger.revision, 2)
assert.equal(compared.ledger.statusByPredictionId['pred-1'], 'matched')
assert.deepEqual(compared.ledger.predictionsById['pred-1'], predBeforeCompare)
assert.equal(compared.comparison.signedError, 14)
assert.equal(compared.comparison.absoluteError, 14)
assert.equal(compared.comparison.predictedSigma, 6)
assert.equal(compared.comparison.observedSigma, null)
assert.equal(compared.comparison.combinedSigma, null)
assert.equal(compared.comparison.standardizedResidual, null)
assert.equal(compared.comparison.predictionProvenanceId, 'prov-1')
assert.equal(compared.comparison.observationEventId, 'obs-1')
assert.equal(compared.comparison.observationSourceId, 'device:watch')
assert.equal(compared.comparison.observationSigmaProvenanceId, null)

const sigma: ObservationSigmaEvidence = { sigma: 2, provenanceId: 'sigma:watch-v1' }
const withSigma = comparePredictionToObservation(fresh, 'pred-1', observation(), { ...opts, observationSigma: sigma })
assert.equal(withSigma.comparison.combinedSigma, Math.hypot(6, 2))
assert.ok(Math.abs((withSigma.comparison.standardizedResidual ?? NaN) - 14 / Math.hypot(6,2)) < 1e-12)
assert.equal(withSigma.comparison.observationSigmaProvenanceId, 'sigma:watch-v1')

const zeroPred = recordRealityPrediction(createRealityErrorLedger('subject-1'), prediction({ id:'pred-zero', predictedSigma:0 })).ledger
const zeroBoth = comparePredictionToObservation(zeroPred, 'pred-zero', observation({ id:'obs-zero' }), { ...opts, observationSigma:{ sigma:0, provenanceId:'sigma:zero' } })
assert.equal(zeroBoth.comparison.combinedSigma, 0)
assert.equal(zeroBoth.comparison.standardizedResidual, null)

for (const badSigma of [
  { sigma:-1, provenanceId:'sigma:bad' },
  { sigma:Number.NaN, provenanceId:'sigma:bad' },
  { sigma:1, provenanceId:' ' },
] as any[]) assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation(),{...opts,observationSigma:badSigma}), /observationSigma/)

for (const semanticState of ['measured','imported','clinician-entered'] as const) {
  const led=recordRealityPrediction(createRealityErrorLedger('subject-1'),prediction({id:`pred-${semanticState}`})).ledger
  const got=comparePredictionToObservation(led,`pred-${semanticState}`,observation({id:`obs-${semanticState}`,semanticState}),opts)
  assert.equal(got.comparison.observedValue,126)
}
for (const semanticState of [undefined,'patient-reported','derived','rule-output','ai-draft','simulated','reference','clinician-reviewed','unavailable'] as const) {
  const led=recordRealityPrediction(createRealityErrorLedger('subject-1'),prediction({id:`pred-bad-${String(semanticState)}`})).ledger
  const obs=observation({id:`obs-bad-${String(semanticState)}`,semanticState, ...(semanticState==='clinician-reviewed'?{review:{state:'accepted',reviewerId:'dr-1',reviewedAt:'2026-09-27T10:30:01.000Z'}}:{})})
  assert.throws(() => comparePredictionToObservation(led,`pred-bad-${String(semanticState)}`,obs,opts), /admissible reality observation/)
}
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({subjectId:'subject-2'}),opts), /subject/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({metric:'pulse'}),opts), /field/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({unit:'1'}),opts), /unit/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({value:'126'}),opts), /numeric/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({value:Number.NaN}),opts), /finite/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation(),{...opts,matchToleranceMs:-1}), /matchToleranceMs/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation(),{...opts,matchToleranceMs:Number.NaN}), /matchToleranceMs/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation({recordedAt:'2026-09-27T10:32:00.000Z',provenance:{...observation().provenance,capturedAt:'2026-09-27T10:32:00.000Z',receivedAt:'2026-09-27T10:32:01.000Z'}}),opts), /outside match tolerance/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation(),{...opts,comparisonCreatedAt:'bad'}), /comparisonCreatedAt/)
assert.throws(() => comparePredictionToObservation(fresh,'pred-1',observation(),{...opts,comparisonCreatedAt:'2026-09-27T10:29:59.000Z'}), /before observation/)
assert.throws(() => comparePredictionToObservation(compared.ledger,'pred-1',observation({id:'obs-2'}),opts), /already matched/)
assert.throws(() => comparePredictionToObservation(expired,'pred-1',observation(),opts), /expired-unobserved/)
assert.equal(compared.comparison.observedSigma, null, 'confidence must not be converted to sigma')

console.log('reality-error-ledger task2: direct prediction-vs-observation comparison')


const matchingBase = () => recordRealityPrediction(createRealityErrorLedger('subject-1'), prediction({ id:'pred-match' })).ledger
const candidates = [
  observation({ id:'obs-far', value:120, recordedAt:'2026-09-27T10:29:40.000Z', provenance:{...observation().provenance,capturedAt:'2026-09-27T10:29:40.000Z',receivedAt:'2026-09-27T10:29:41.000Z'} }),
  observation({ id:'obs-near', value:121, recordedAt:'2026-09-27T10:29:55.000Z', provenance:{...observation().provenance,capturedAt:'2026-09-27T10:29:55.000Z',receivedAt:'2026-09-27T10:29:56.000Z'} }),
]
const nearest = matchPredictionToObservations(matchingBase(),'pred-match',candidates,opts)
assert.equal(nearest.comparison.observationEventId,'obs-near')

const tieEarlier = matchPredictionToObservations(matchingBase(),'pred-match',[
  observation({id:'obs-later',recordedAt:'2026-09-27T10:30:10.000Z',provenance:{...observation().provenance,capturedAt:'2026-09-27T10:30:10.000Z',receivedAt:'2026-09-27T10:30:11.000Z'}}),
  observation({id:'obs-earlier',recordedAt:'2026-09-27T10:29:50.000Z',provenance:{...observation().provenance,capturedAt:'2026-09-27T10:29:50.000Z',receivedAt:'2026-09-27T10:29:51.000Z'}}),
],opts)
assert.equal(tieEarlier.comparison.observationEventId,'obs-earlier')

const tieLexical = matchPredictionToObservations(matchingBase(),'pred-match',[
  observation({id:'obs-z'}), observation({id:'obs-a'}),
],opts)
assert.equal(tieLexical.comparison.observationEventId,'obs-a')

const invalidCloser = matchPredictionToObservations(matchingBase(),'pred-match',[
  observation({id:'bad-field',metric:'pulse'}),
  observation({id:'bad-unit',unit:'1'}),
  observation({id:'bad-subject',subjectId:'subject-2'}),
  observation({id:'bad-sim',semanticState:'simulated'}),
  observation({id:'good-far',recordedAt:'2026-09-27T10:29:30.000Z',provenance:{...observation().provenance,capturedAt:'2026-09-27T10:29:30.000Z',receivedAt:'2026-09-27T10:29:31.000Z'}}),
],opts)
assert.equal(invalidCloser.comparison.observationEventId,'good-far')

assert.throws(() => matchPredictionToObservations(matchingBase(),'pred-match',[],opts), /no admissible observation within tolerance/)
assert.throws(() => matchPredictionToObservations(matchingBase(),'pred-match',[observation({metric:'pulse'})],opts), /no admissible observation within tolerance/)
const exact = matchPredictionToObservations(matchingBase(),'pred-match',[observation()],{...opts,matchToleranceMs:0})
assert.equal(exact.comparison.observationEventId,'obs-1')
assert.throws(() => matchPredictionToObservations(matchingBase(),'pred-match',[
  observation({recordedAt:'2026-09-27T10:30:00.001Z',provenance:{...observation().provenance,capturedAt:'2026-09-27T10:30:00.001Z',receivedAt:'2026-09-27T10:30:01.001Z'}}),
],{...opts,matchToleranceMs:0}), /no admissible observation within tolerance/)

const sigmaChoice = matchPredictionToObservations(matchingBase(),'pred-match',candidates,{
  ...opts,
  observationSigmaByEventId:{
    'obs-far':{sigma:9,provenanceId:'sigma:far'},
    'obs-near':{sigma:3,provenanceId:'sigma:near'},
  },
})
assert.equal(sigmaChoice.comparison.observedSigma,3)
assert.equal(sigmaChoice.comparison.observationSigmaProvenanceId,'sigma:near')

const replayA = matchPredictionToObservations(matchingBase(),'pred-match',candidates,opts)
const replayB = matchPredictionToObservations(matchingBase(),'pred-match',candidates,opts)
assert.deepEqual(replayA.comparison,replayB.comparison)
assert.deepEqual(replayA.ledger.statusByPredictionId,replayB.ledger.statusByPredictionId)
assert.equal(replayA.ledger.revision,replayB.ledger.revision)

console.log('reality-error-ledger task3: deterministic candidate matching and replay')
