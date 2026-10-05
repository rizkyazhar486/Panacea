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

// Numeric glyphs and signs must never disappear from the critical-token audit.
for (const [candidate, reference] of [
  ['WBC 12 ×10³/L', 'WBC 12 ×10⁹/L'],
  ['value 1', 'value −1'],
  ['value 1', 'value ⁻1'],
  ['value ١', 'value ٢'],
]) {
  const report = calculateOcrPhotoAccuracy(candidate, reference)
  assert.equal(report.numericToken?.errors, 1)
  assert.ok((report.numericToken?.accuracy ?? 1) < 1)
  assert.equal(calculateOcrPhotoAccuracy(reference, reference).numericToken?.errors, 0)
}

assert.throws(() => calculateOcrPhotoAccuracy('a'.repeat(1001), 'b'.repeat(1000)), /budget/)
assert.equal(calculateOcrPhotoAccuracy('a'.repeat(1000), 'b'.repeat(1000)).character.errors, 1000)
assert.throws(() => calculateOcrPhotoAccuracy('x'.repeat(16385), 'x'), /length/)
assert.equal(calculateOcrPhotoAccuracy('x'.repeat(16384), 'x').character.errors, 16383)
assert.throws(() => calculateOcrPhotoAccuracy('Hb 12', ' \n '), /reference/)
assert.equal(calculateOcrPhotoAccuracy('', 'Hb 12').character.errorRate, 1)
assert.equal(calculateOcrPhotoAccuracy('invented 999', 'negative').numericToken, null)

console.log('ocr-photo-accuracy: ok')
