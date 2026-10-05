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

// Engineering work limits, not OCR quality or clinical acceptance thresholds.
// Reject the whole comparison rather than score a silently truncated report.
const MAX_INPUT_LENGTH = 16_384
const MAX_EDIT_CELLS = 1_000_000

export class OcrPhotoAccuracyError extends Error {}

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
    // Preserve numeric glyphs (including superscripts/non-ASCII digits),
    // signs and separators exactly. This compares text, never converts units
    // or interprets an ambiguous decimal as a measured clinical value.
    value.matchAll(/(?:<=|>=|<|>|≤|≥)?\s*[+\-−﹣－⁺⁻]?(?:\p{N}+(?:[.,٫٬]\p{N}+)*|[.,٫]\p{N}+)/gu),
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
  if (candidateText.length > MAX_INPUT_LENGTH || groundTruthText.length > MAX_INPUT_LENGTH) {
    throw new OcrPhotoAccuracyError('Audit unavailable: input length exceeds the local comparison limit. No score calculated.')
  }
  const candidate = normalizeOcrBenchmarkText(candidateText)
  const reference = normalizeOcrBenchmarkText(groundTruthText)
  if (!reference) throw new OcrPhotoAccuracyError('Audit unavailable: a nonempty human reference is required.')

  const referenceChars = Array.from(reference)
  const candidateChars = Array.from(candidate)
  const referenceWords = wordTokens(reference)
  const candidateWords = wordTokens(candidate)
  const referenceNumbers = numericTokens(reference)
  const candidateNumbers = numericTokens(candidate)

  if (referenceChars.length * candidateChars.length > MAX_EDIT_CELLS) {
    throw new OcrPhotoAccuracyError('Audit unavailable: comparison exceeds the local work budget. No score calculated.')
  }

  const characterErrors = levenshtein(referenceChars, candidateChars)
  const wordErrors = levenshtein(referenceWords, candidateWords)

  return {
    character: metric(characterErrors, referenceChars.length, candidateChars.length),
    word: metric(wordErrors, referenceWords.length, candidateWords.length),
    // Without reference numeric tokens there is no numeric denominator.
    // Invented numbers are still measured by CER/WER, never scored as 0/0.
    numericToken: referenceNumbers.length
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
