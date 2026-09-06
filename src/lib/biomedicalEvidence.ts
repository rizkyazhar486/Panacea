export interface EvidenceContribution {
  label: string
  likelihoodRatio: number
}

function clampProbability(p: number): number {
  if (!Number.isFinite(p)) throw new Error('Probability must be finite')
  return Math.min(1 - Number.EPSILON, Math.max(Number.EPSILON, p))
}

/** Standard Phred relation: p(error) = 10^(-Q/10). */
export function phredErrorProbability(q: number): number {
  if (!Number.isFinite(q) || q < 0) throw new Error('Phred Q score must be a finite value >= 0')
  return 10 ** (-q / 10)
}

/** Variant allele fraction (VAF) = alternate reads / total supporting reads. */
export function variantAlleleFraction(referenceReads: number, alternateReads: number): number {
  if (![referenceReads, alternateReads].every((x) => Number.isFinite(x) && x >= 0)) {
    throw new Error('Read counts must be finite and non-negative')
  }
  const total = referenceReads + alternateReads
  return total === 0 ? 0 : alternateReads / total
}

/**
 * Generic Bayesian evidence aggregation for transparent teaching/research use.
 * posterior odds = prior odds × product(LR_i)
 *
 * The caller is responsible for supplying validated likelihood ratios.
 * This function is not itself a disease classifier.
 */
export function posteriorProbabilityFromLikelihoodRatios(
  priorProbability: number,
  contributions: EvidenceContribution[],
): number {
  const prior = clampProbability(priorProbability)
  let logOdds = Math.log(prior / (1 - prior))
  for (const contribution of contributions) {
    if (!Number.isFinite(contribution.likelihoodRatio) || contribution.likelihoodRatio <= 0) {
      throw new Error(`Likelihood ratio for ${contribution.label} must be finite and > 0`)
    }
    logOdds += Math.log(contribution.likelihoodRatio)
  }
  const odds = Math.exp(logOdds)
  return odds / (1 + odds)
}

/** Population z score; intended for visualization, not as a standalone clinical threshold. */
export function zScore(value: number, mean: number, standardDeviation: number): number {
  if (![value, mean, standardDeviation].every(Number.isFinite) || standardDeviation <= 0) {
    throw new Error('zScore requires finite values and SD > 0')
  }
  return (value - mean) / standardDeviation
}

export interface WeightedSignal {
  label: string
  normalizedValue: number
  weight: number
}

/**
 * Exploratory multi-omics index = weighted mean of already-normalized signals.
 * It deliberately has no diagnostic label or threshold.
 */
export function exploratoryWeightedSignalIndex(signals: WeightedSignal[]): number {
  if (!signals.length) return 0
  let weighted = 0
  let totalWeight = 0
  for (const signal of signals) {
    if (![signal.normalizedValue, signal.weight].every(Number.isFinite) || signal.weight < 0) {
      throw new Error(`Invalid weighted signal: ${signal.label}`)
    }
    weighted += signal.normalizedValue * signal.weight
    totalWeight += signal.weight
  }
  return totalWeight === 0 ? 0 : weighted / totalWeight
}

/** N50 from a collection of read/contig lengths. */
export function n50(lengths: number[]): number {
  const clean = lengths.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => b - a)
  if (!clean.length) return 0
  const total = clean.reduce((sum, value) => sum + value, 0)
  let cumulative = 0
  for (const value of clean) {
    cumulative += value
    if (cumulative >= total / 2) return value
  }
  return 0
}
