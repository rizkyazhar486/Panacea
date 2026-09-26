import assert from 'node:assert/strict'
import {
  averagePrecision,
  csvHeaders,
  inferFraudColumns,
  metricsAtThreshold,
  parseFraudCsv,
  summarizeFraudRows,
} from '../../src/lib/finance/fraudThresholdLab'

const csv = [
  'Time,Amount,Class,fraud_probability',
  '1,20,0,0.02',
  '2,999,1,0.97',
  '3,50,0,0.70',
  '4,510,1,0.62',
  '5,15,0,0.11',
  '6,40,1,0.40',
  '7,12,0,not-a-score',
].join('\n')

const headers = csvHeaders(csv)
assert.deepEqual(headers, ['Time', 'Amount', 'Class', 'fraud_probability'])
assert.deepEqual(inferFraudColumns(headers), { label: 'Class', score: 'fraud_probability' })

const parsed = parseFraudCsv(csv, 'Class', 'fraud_probability')
assert.equal(parsed.rows.length, 6)
assert.equal(parsed.rejectedRows, 1, 'invalid rows must be rejected, never converted into negatives')

const at50 = metricsAtThreshold(parsed.rows, 0.5)
assert.deepEqual({ tp: at50.tp, fp: at50.fp, fn: at50.fn, tn: at50.tn }, { tp: 2, fp: 1, fn: 1, tn: 2 })
assert.equal(at50.precision, 2 / 3)
assert.equal(at50.recall, 2 / 3)

const at80 = metricsAtThreshold(parsed.rows, 0.8)
assert.equal(at80.tp, 1)
assert.equal(at80.fp, 0)
assert.equal(at80.fn, 2)
assert.equal(at80.precision, 1)
assert.equal(at80.recall, 1 / 3)

const summary = summarizeFraudRows(parsed.rows)
assert.equal(summary.positives, 3)
assert.equal(summary.negatives, 3)
assert.equal(summary.prevalence, 0.5)
assert.ok((summary.averagePrecision ?? 0) > summary.prevalence, 'ranked example should beat prevalence baseline')
assert.equal(averagePrecision([]), null)
assert.equal(averagePrecision([{ label: 0, score: 0.9 }]), null)

const invalid = parseFraudCsv('Class,score\n2,0.5\n1,1.2\n0,-0.1', 'Class', 'score')
assert.equal(invalid.rows.length, 0)
assert.equal(invalid.rejectedRows, 3)

console.log('finance-fraud-threshold-lab: ok')
