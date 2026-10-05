import assert from 'node:assert/strict'
import {
  calculateOcrPhotoAccuracy,
  normalizeOcrBenchmarkText,
  ocrMetricPercent,
} from '../../src/lib/evaluation/ocrPhotoAccuracy.ts'

const exact = calculateOcrPhotoAccuracy(
  'Hemoglobin 14.2 g/dL\nLDL 110 mg/dL',
  'Hemoglobin 14.2 g/dL\nLDL 110 mg/dL',
)
assert.equal(exact.character.errorRate, 0)
assert.equal(exact.word.errorRate, 0)
assert.equal(exact.numericToken?.errorRate, 0)
assert.equal(ocrMetricPercent(exact.character.accuracy), 100)

const oneDigitWrong = calculateOcrPhotoAccuracy(
  'Hemoglobin 14.8 g/dL',
  'Hemoglobin 14.2 g/dL',
)
assert.equal(oneDigitWrong.character.errors, 1)
assert.equal(oneDigitWrong.numericToken?.errors, 1)
assert.equal(oneDigitWrong.numericToken?.accuracy, 0)

const whitespaceOnly = calculateOcrPhotoAccuracy(
  'Hb   14.2\t g/dL\r\nLDL 110 mg/dL',
  'Hb 14.2 g/dL\nLDL 110 mg/dL',
)
assert.equal(whitespaceOnly.character.errorRate, 0)
assert.equal(whitespaceOnly.word.errorRate, 0)

const insertedLine = calculateOcrPhotoAccuracy(
  'Hb 14.2 g/dL\nNoise 999\nLDL 110 mg/dL',
  'Hb 14.2 g/dL\nLDL 110 mg/dL',
)
assert.ok(insertedLine.character.errorRate > 0)
assert.ok(insertedLine.word.errorRate > 0)
assert.ok((insertedLine.numericToken?.errorRate ?? 0) > 0)

assert.equal(
  normalizeOcrBenchmarkText('  Hb   14.2  \r\n\r\n LDL 110 '),
  'Hb 14.2\nLDL 110',
)

const noNumbers = calculateOcrPhotoAccuracy('negative', 'negative')
assert.equal(noNumbers.numericToken, null)

console.log('ocr-photo-accuracy: ok')
