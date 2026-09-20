export type PhageCampaignInput = {
  designed: number
  assembled: number
  viable: number
  offTargetHostsTested: number
  offTargetHostsWithGrowth: number
}

export type PhageCampaignAnalysis = {
  assemblyRate: number
  viabilityRate: number
  overallYield: number
  offTargetGrowthRate: number
  offTargetNoGrowthRate: number
  viabilityWilson95: readonly [number, number]
}

export type VirtualPhageInput = {
  targetSelectivity: number
  evidenceCoverage: number
  environmentalRobustness: number
  noveltyPressure: number
}

export type VirtualPhageResult = {
  specificityProxy: number
  evidenceAdjustedConfidence: number
  modelUncertainty: number
  tradeoffPressure: number
  executable: false
}

export const PHAGE_RESEARCH_BOUNDARY = {
  allowed: [
    'published-campaign metrics',
    'aggregate phenotype comparison',
    'abstract non-genetic simulation',
    'uncertainty analysis',
    'provenance and biosafety review',
  ],
  blocked: [
    'viral genome generation',
    'synthesis-ready sequence export',
    'wet-lab construction protocol',
    'host-range expansion',
    'pathogenicity optimization',
    'clinically important resistance-trait engineering',
  ],
} as const

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function nonNegativeInteger(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`${name} must be a non-negative integer`)
  }
  return value
}

export function wilsonInterval95(successes: number, total: number): readonly [number, number] {
  nonNegativeInteger('successes', successes)
  nonNegativeInteger('total', total)
  if (successes > total) throw new RangeError('successes cannot exceed total')
  if (total === 0) return [0, 0]

  const z = 1.959963984540054
  const p = successes / total
  const z2 = z * z
  const denominator = 1 + z2 / total
  const center = (p + z2 / (2 * total)) / denominator
  const margin =
    (z / denominator) *
    Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)

  return [clamp01(center - margin), clamp01(center + margin)]
}

export function analyzePhageCampaign(input: PhageCampaignInput): PhageCampaignAnalysis {
  const designed = nonNegativeInteger('designed', input.designed)
  const assembled = nonNegativeInteger('assembled', input.assembled)
  const viable = nonNegativeInteger('viable', input.viable)
  const offTargetHostsTested = nonNegativeInteger('offTargetHostsTested', input.offTargetHostsTested)
  const offTargetHostsWithGrowth = nonNegativeInteger('offTargetHostsWithGrowth', input.offTargetHostsWithGrowth)

  if (assembled > designed) throw new RangeError('assembled cannot exceed designed')
  if (viable > assembled) throw new RangeError('viable cannot exceed assembled')
  if (offTargetHostsWithGrowth > offTargetHostsTested) {
    throw new RangeError('offTargetHostsWithGrowth cannot exceed offTargetHostsTested')
  }

  const assemblyRate = designed === 0 ? 0 : assembled / designed
  const viabilityRate = assembled === 0 ? 0 : viable / assembled
  const overallYield = designed === 0 ? 0 : viable / designed
  const offTargetGrowthRate = offTargetHostsTested === 0 ? 0 : offTargetHostsWithGrowth / offTargetHostsTested

  return {
    assemblyRate,
    viabilityRate,
    overallYield,
    offTargetGrowthRate,
    offTargetNoGrowthRate: offTargetHostsTested === 0 ? 0 : 1 - offTargetGrowthRate,
    viabilityWilson95: wilsonInterval95(viable, assembled),
  }
}

export function simulateVirtualPhage(input: VirtualPhageInput): VirtualPhageResult {
  const targetSelectivity = clamp01(input.targetSelectivity)
  const evidenceCoverage = clamp01(input.evidenceCoverage)
  const environmentalRobustness = clamp01(input.environmentalRobustness)
  const noveltyPressure = clamp01(input.noveltyPressure)

  const specificityProxy = clamp01(
    0.70 * targetSelectivity +
    0.20 * evidenceCoverage +
    0.10 * (1 - noveltyPressure),
  )

  const evidenceAdjustedConfidence = clamp01(
    evidenceCoverage * (0.55 + 0.30 * targetSelectivity + 0.15 * environmentalRobustness),
  )

  const modelUncertainty = clamp01(
    0.65 * (1 - evidenceCoverage) +
    0.20 * noveltyPressure +
    0.15 * Math.abs(environmentalRobustness - targetSelectivity),
  )

  const tradeoffPressure = clamp01(
    0.45 * noveltyPressure +
    0.35 * environmentalRobustness +
    0.20 * (1 - targetSelectivity),
  )

  return {
    specificityProxy,
    evidenceAdjustedConfidence,
    modelUncertainty,
    tradeoffPressure,
    executable: false,
  }
}

export function isBlockedPhageCapability(capability: string) {
  const normalized = capability.trim().toLowerCase()
  return PHAGE_RESEARCH_BOUNDARY.blocked.some((item) => normalized.includes(item))
}
