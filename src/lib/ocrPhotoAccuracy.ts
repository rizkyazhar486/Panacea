/**
 * Deterministic OCR benchmark metrics for photo-derived text.
 *
 * CER = (S + D + I) / N_char
 * WER = (S + D + I) / N_word
 *
 * "Accuracy" is reported as max(0, 1 - errorRate) for UI readability.
 * Because edit-distance error rates can exceed 1.0 when insertions are large,
 * the raw CER/WER values remain available and are the benchmark primitives.
 *
 * Reference: V. I. Levenshtein, Binary codes capable of correcting deletions,
 * insertions, and reversals, Soviet Physics Doklady 10(8), 1966.
 */

export interface OcrAccuracyMetric {
  errors: number
  referenceCount: number
  candidateCount: number
  errorRate: number
  accuracy: number
}

export interface OcrPhotoAccuracyReport {
  character: OcrAccuracyMetric
  word: OcrAccuracyMetric
  numericToken: OcrAccuracyMetric | null
}

export function normalizeOcrBenchmarkText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/[\t ]+/g, ' '))
    .filter(Boolean)
    .join('\n')
}

function levenshtein<T>(reference: readonly T[], candidate: readonly T[]): number {
  if (!reference.length) return candidate.length
  if (!candidate.length) return reference.length

  let previous = new Array<number>(candidate.length + 1)
  let current = new Array<number>(candidate.length + 1)

  for (let j = 0; j <= candidate.length; j += 1) previous[j] = j

  for (let i = 1; i <= reference.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= candidate.length; j += 1) {
      const substitutionCost = reference[i - 1] === candidate[j - 1] ? 0 : 1
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      )
    }
    ;[previous, current] = [current, previous]
  }

  return previous[candidate.length]
}

function metric(errors: number, referenceCount: number, candidateCount: number): OcrAccuracyMetric {
  const errorRate = referenceCount === 0
    ? (candidateCount === 0 ? 0 : 1)
    : errors / referenceCount

  return {
    errors,
    referenceCount,
    candidateCount,
    errorRate,
    accuracy: Math.max(0, 1 - errorRate),
  }
}

function wordTokens(value: string): string[] {
  return value ? value.split(/\s+/).filter(Boolean) : []
}

function numericTokens(value: string): string[] {
  return Array.from(
    value.matchAll(/(?:<=|>=|<|>|≤|≥)?\s*[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)/g),
    (match) => match[0].replace(/\s+/g, ''),
  )
}

/**
 * Compare OCR output against a human-verified transcription of the same source
 * photo. This is benchmark accuracy, not model/provider confidence.
 */
export function calculateOcrPhotoAccuracy(
  candidateText: string,
  groundTruthText: string,
): OcrPhotoAccuracyReport {
  const candidate = normalizeOcrBenchmarkText(candidateText)
  const reference = normalizeOcrBenchmarkText(groundTruthText)

  const referenceChars = Array.from(reference)
  const candidateChars = Array.from(candidate)
  const referenceWords = wordTokens(reference)
  const candidateWords = wordTokens(candidate)
  const referenceNumbers = numericTokens(reference)
  const candidateNumbers = numericTokens(candidate)

  const characterErrors = levenshtein(referenceChars, candidateChars)
  const wordErrors = levenshtein(referenceWords, candidateWords)

  return {
    character: metric(characterErrors, referenceChars.length, candidateChars.length),
    word: metric(wordErrors, referenceWords.length, candidateWords.length),
    numericToken: referenceNumbers.length || candidateNumbers.length
      ? metric(
          levenshtein(referenceNumbers, candidateNumbers),
          referenceNumbers.length,
          candidateNumbers.length,
        )
      : null,
  }
}

export function ocrMetricPercent(value: number): number {
  return Math.round(value * 1000) / 10
}
