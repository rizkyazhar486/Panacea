// src/lib/discovery/crisprDiagnosticsCollateralEngine.ts
// T-CLIN-82: Collateral Cleavage CRISPR Diagnostics & Viral Surveillance Engine (Cas12a / Cas13 / SHERLOCK)

export type CrisprDiagnosticsModality = 'CAS12A_DETECTR_DNA' | 'CAS13A_SHERLOCK_RNA' | 'CAS14_MINIATURE_SSDNA'

export interface CrisprDiagnosticsInput {
  modality: CrisprDiagnosticsModality
  sampleTargetCopiesPerMicroliter: number // 0 to 1e8 copies/uL
  crRnaTargetSequence: string // 20-28 nt
  sampleComplementarySequence: string // actual sequence present in sample
  preAmplificationMethod: 'NONE_DIRECT' | 'ISOTHERMAL_RPA' | 'RT_RPA' | 'LAMP'
  reactionTimeMinutes?: number // typically 10 to 60 mins (default 30)
  reporterProbeConcentrationNm?: number // e.g. 250 nM F-Q reporter
}

export interface CrisprDiagnosticsResult {
  modality: CrisprDiagnosticsModality
  preAmplificationFold: number
  targetSequenceMatchScore: number // 0.0 - 1.0 (seed and guide match)
  onTargetActivatedEnzymeFraction: number
  transCleavageRatePerMinute: number // k_cat trans turnover
  fluorescenceRfu: {
    backgroundRfu: number
    measuredSignalRfu: number
    signalToNoiseRatio: number
  }
  analyticalLodCopiesPerMicroliter: number
  diagnosticCall: 'POSITIVE_TARGET_DETECTED' | 'NEGATIVE_BELOW_LOD' | 'INVALID_SEQUENCE_MISMATCH'
  timeToPositiveMinutes: number | null
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    diagnosticReference: 'Gootenberg et al. 2017 Science (SHERLOCK); Chen et al. 2018 Science (DETECTR)'
  }
}

/**
 * Computes CRISPR diagnostic trans-cleavage kinetics and analytical sensitivity.
 */
export function evaluateCrisprDiagnosticAssay(input: CrisprDiagnosticsInput): CrisprDiagnosticsResult {
  const time = Math.max(1, input.reactionTimeMinutes ?? 30)
  const copies = Math.max(0, input.sampleTargetCopiesPerMicroliter)
  const probeNm = input.reporterProbeConcentrationNm ?? 250.0

  // 1. Amplification amplification gain
  let ampFold = 1.0
  let lodCopiesPerUl = 1000.0 // Direct assay LOD without pre-amplification

  switch (input.preAmplificationMethod) {
    case 'NONE_DIRECT':
      ampFold = 1.0
      lodCopiesPerUl = 500.0
      break
    case 'ISOTHERMAL_RPA':
      ampFold = 1e6
      lodCopiesPerUl = 5.0
      break
    case 'RT_RPA':
      ampFold = 1e6
      lodCopiesPerUl = 2.0
      break
    case 'LAMP':
      ampFold = 1e7
      lodCopiesPerUl = 1.0
      break
  }

  // 2. Sequence complementarity evaluation
  const guide = input.crRnaTargetSequence.trim().toUpperCase()
  const sample = input.sampleComplementarySequence.trim().toUpperCase()

  let matches = 0
  const compLen = Math.min(guide.length, sample.length)
  for (let i = 0; i < compLen; i++) {
    const g = guide[i]
    const s = sample[i]
    // DNA/RNA match (A-T/U, G-C, etc.)
    if (g === s || (g === 'T' && s === 'U') || (g === 'U' && s === 'T')) {
      matches++
    }
  }
  const matchRatio = compLen > 0 ? matches / compLen : 0.0

  // Seed region (first 8 nt adjacent to PAM / PFS) is critical
  let seedMatches = 0
  const seedLen = Math.min(8, compLen)
  for (let i = 0; i < seedLen; i++) {
    const g = guide[i]
    const s = sample[i]
    if (g === s || (g === 'T' && s === 'U') || (g === 'U' && s === 'T')) {
      seedMatches++
    }
  }
  const seedRatio = seedLen > 0 ? seedMatches / seedLen : 0.0

  const sequenceMatchScore = Number(((matchRatio * 0.4) + (seedRatio * 0.6)).toFixed(3))

  // 3. Activated enzyme fraction
  const effectiveCopies = copies * ampFold
  // Hill equation for target-dependent binary complex activation
  const kHalf = 5e4 // half-maximal activation threshold
  let activatedFraction = 0.0
  if (sequenceMatchScore >= 0.75 && effectiveCopies > 0) {
    activatedFraction = effectiveCopies / (kHalf + effectiveCopies)
    activatedFraction *= Math.pow(sequenceMatchScore, 2)
  }
  activatedFraction = Number(Math.min(1.0, activatedFraction).toFixed(4))

  // 4. Collateral Trans-cleavage rate (turnover per enzyme per min)
  let baseKcat = 1200.0 // min^-1
  if (input.modality === 'CAS13A_SHERLOCK_RNA') baseKcat = 1800.0
  else if (input.modality === 'CAS14_MINIATURE_SSDNA') baseKcat = 850.0

  const transRate = Number((baseKcat * activatedFraction).toFixed(1))

  // 5. Fluorescence signal kinetics
  const bgRfu = 45.0
  const maxGain = 2500.0
  // Michaelis-Menten integrated cleavage over reaction time
  const fractionProbesCleaved = 1.0 - Math.exp(-0.00008 * transRate * time)
  const signalGain = fractionProbesCleaved * maxGain * (probeNm / 250.0)
  const measuredRfu = Number((bgRfu + signalGain).toFixed(1))
  const snr = Number((measuredRfu / bgRfu).toFixed(2))

  // 6. Diagnostic Call
  let call: 'POSITIVE_TARGET_DETECTED' | 'NEGATIVE_BELOW_LOD' | 'INVALID_SEQUENCE_MISMATCH' = 'NEGATIVE_BELOW_LOD'
  let timeToPos: number | null = null

  if (sequenceMatchScore < 0.70 && copies > 0) {
    call = 'INVALID_SEQUENCE_MISMATCH'
  } else if (copies >= lodCopiesPerUl && snr >= 3.0) {
    call = 'POSITIVE_TARGET_DETECTED'
    // Time required to cross 3x background threshold
    const requiredGain = bgRfu * 2.0
    const reqFraction = requiredGain / Math.max(1, maxGain * (probeNm / 250.0))
    if (transRate > 0 && reqFraction < 1.0) {
      const tPos = -Math.log(1.0 - reqFraction) / (0.00008 * transRate)
      timeToPos = Number(Math.max(2.0, tPos).toFixed(1))
    }
  }

  return {
    modality: input.modality,
    preAmplificationFold: ampFold,
    targetSequenceMatchScore: sequenceMatchScore,
    onTargetActivatedEnzymeFraction: activatedFraction,
    transCleavageRatePerMinute: transRate,
    fluorescenceRfu: {
      backgroundRfu: bgRfu,
      measuredSignalRfu: measuredRfu,
      signalToNoiseRatio: snr,
    },
    analyticalLodCopiesPerMicroliter: lodCopiesPerUl,
    diagnosticCall: call,
    timeToPositiveMinutes: timeToPos,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      diagnosticReference: 'Gootenberg et al. 2017 Science (SHERLOCK); Chen et al. 2018 Science (DETECTR)',
    },
  }
}
