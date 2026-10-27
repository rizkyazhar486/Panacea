// src/lib/discovery/precisionGenomeEditingEngine.ts
// PanaceaMed T-CLIN-77: Precision CRISPR-Cas9, Base Editing & Prime Editing Repair Kinetics Engine

export type GenomeEditingModality =
  | 'CRISPR_CAS9_NUCLEASE'
  | 'CYTIDINE_BASE_EDITOR_CBE'
  | 'ADENINE_BASE_EDITOR_ABE'
  | 'PRIME_EDITOR_PE2'
  | 'PRIME_EDITOR_PE3'

export type DnaRepairPathway =
  | 'NON_HOMOLOGOUS_END_JOINING_NHEJ'
  | 'MICROHOMOLOGY_MEDIATED_END_JOINING_MMEJ'
  | 'HOMOLOGY_DIRECTED_REPAIR_HDR'
  | 'BASE_EXCISION_DIRECT_RESOLVE'
  | 'MISMATCH_REPAIR_EVASION'

export interface GuideRnaEvaluationInput {
  spacerSequence: string // 20 nt spacer
  pamSequence: string // e.g. "NGG", "TGG", "CGG", "AGG"
  targetSequence: string // 20 nt genomic target
  modality: GenomeEditingModality
  donorTemplateSupplied?: boolean
  donorTemplateConcentrationUm?: number // in micromolar
  cellCyclePhase?: 'G1' | 'S' | 'G2' | 'M'
  pegRnaRttLength?: number // Reverse transcription template length (for PE)
  pegRnaPbsLength?: number // Primer binding site length (for PE)
}

export interface GenomeEditingOutcomeProfile {
  modality: GenomeEditingModality
  spacerLength: number
  pamConforming: boolean
  mismatchCount: number
  seedMismatchCount: number // mismatches in seed region (positions 1-8 proximal to PAM)
  estimatedOnTargetCleavageEfficiency: number // 0.0 - 1.0
  predictedOffTargetRiskScore: number // 0.0 - 1.0 (lower is safer)
  primaryRepairPathway: DnaRepairPathway
  predictedPrecisionEditingYield: number // 0.0 - 1.0 (fraction of intended edits)
  predictedIndelBystanderRate: number // 0.0 - 1.0 (unintended insertions/deletions)
  dnaDoubleStrandBreakFormed: boolean
  regulatoryClassification: 'INVESTIGATIONAL_PRECLINICAL'
  truthClass: 'mechanistic_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

/**
 * Checks canonical SpCas9 PAM conformity: 5'-NGG-3'
 */
export function isSpCas9Pam(pam: string): boolean {
  if (pam.length < 3) return false
  const upper = pam.toUpperCase()
  return upper.endsWith('GG')
}

/**
 * Calculates position-weighted mismatch penalty for Cas9 guide RNA.
 * Seed region (1-8 nt upstream of PAM, positions 13-20 in 5'-3' spacer) heavily penalizes cleavage.
 */
export function calculateMismatchPenalty(spacer: string, target: string): { totalMismatches: number; seedMismatches: number; penaltyScore: number } {
  const len = Math.min(spacer.length, target.length)
  let totalMismatches = 0
  let seedMismatches = 0
  let penaltyScore = 0

  for (let i = 0; i < len; i++) {
    const isSeed = i >= 12 // Last 8 nucleotides adjacent to PAM (positions 13-20)
    if (spacer[i].toUpperCase() !== target[i].toUpperCase()) {
      totalMismatches++
      if (isSeed) {
        seedMismatches++
        penaltyScore += 2.5 // Heavy seed penalty
      } else {
        penaltyScore += 0.8 // Distal PAM penalty
      }
    }
  }

  return { totalMismatches, seedMismatches, penaltyScore }
}

/**
 * Simulates editing precision and repair pathway kinetics for Cas9, CBE, ABE, and Prime Editing.
 */
export function simulatePrecisionGenomeEditing(input: GuideRnaEvaluationInput): GenomeEditingOutcomeProfile {
  const pamOk = isSpCas9Pam(input.pamSequence)
  const { totalMismatches, seedMismatches, penaltyScore } = calculateMismatchPenalty(input.spacerSequence, input.targetSequence)

  // On-target cleavage efficiency
  let baseCleavage = pamOk ? 0.95 : 0.05
  const cleavageEfficiency = Number(Math.max(0.0, baseCleavage * Math.exp(-0.45 * penaltyScore)).toFixed(4))

  // Off-target risk is inversely proportional to seed mismatch penalty
  const offTargetRisk = Number(Math.min(1.0, Math.max(0.01, 0.4 / (1.0 + seedMismatches * 2.0))).toFixed(4))

  let primaryPathway: DnaRepairPathway = 'NON_HOMOLOGOUS_END_JOINING_NHEJ'
  let precisionYield = 0.0
  let indelRate = 0.0
  let dsbFormed = true

  const isSandG2 = input.cellCyclePhase === 'S' || input.cellCyclePhase === 'G2'
  const hasDonor = Boolean(input.donorTemplateSupplied) && (input.donorTemplateConcentrationUm ?? 0) > 0.5

  switch (input.modality) {
    case 'CRISPR_CAS9_NUCLEASE':
      dsbFormed = true
      if (isSandG2 && hasDonor) {
        primaryPathway = 'HOMOLOGY_DIRECTED_REPAIR_HDR'
        precisionYield = Number((cleavageEfficiency * 0.42).toFixed(4)) // HDR yield max ~40-50%
        indelRate = Number((cleavageEfficiency * 0.58).toFixed(4)) // Competing NHEJ indels
      } else {
        primaryPathway = 'NON_HOMOLOGOUS_END_JOINING_NHEJ'
        precisionYield = 0.05 // Precise ligation without indels is rare
        indelRate = Number((cleavageEfficiency * 0.92).toFixed(4))
      }
      break

    case 'CYTIDINE_BASE_EDITOR_CBE':
      dsbFormed = false // Nickase does not make DSBs
      primaryPathway = 'BASE_EXCISION_DIRECT_RESOLVE'
      precisionYield = Number((cleavageEfficiency * 0.78).toFixed(4)) // C-to-T transition
      indelRate = Number((cleavageEfficiency * 0.035).toFixed(4)) // CBE has very low indels (<5%)
      break

    case 'ADENINE_BASE_EDITOR_ABE':
      dsbFormed = false
      primaryPathway = 'BASE_EXCISION_DIRECT_RESOLVE'
      precisionYield = Number((cleavageEfficiency * 0.88).toFixed(4)) // ABE has highest purity
      indelRate = Number((cleavageEfficiency * 0.015).toFixed(4)) // ABE indels typically <2%
      break

    case 'PRIME_EDITOR_PE2':
    case 'PRIME_EDITOR_PE3':
      dsbFormed = false
      primaryPathway = 'MISMATCH_REPAIR_EVASION'
      const pbs = input.pegRnaPbsLength ?? 13
      const rtt = input.pegRnaRttLength ?? 14
      // Optimal PBS is 13 nt, optimal RTT is 10-16 nt
      const pbsPenalty = Math.abs(pbs - 13) * 0.04
      const rttPenalty = Math.max(0, rtt - 16) * 0.03
      const peEfficiency = Math.max(0.1, 0.65 - pbsPenalty - rttPenalty)
      precisionYield = Number((cleavageEfficiency * peEfficiency).toFixed(4))
      indelRate = input.modality === 'PRIME_EDITOR_PE3' ? 0.04 : 0.015
      break
  }

  return {
    modality: input.modality,
    spacerLength: input.spacerSequence.length,
    pamConforming: pamOk,
    mismatchCount: totalMismatches,
    seedMismatchCount: seedMismatches,
    estimatedOnTargetCleavageEfficiency: cleavageEfficiency,
    predictedOffTargetRiskScore: offTargetRisk,
    primaryRepairPathway: primaryPathway,
    predictedPrecisionEditingYield: precisionYield,
    predictedIndelBystanderRate: indelRate,
    dnaDoubleStrandBreakFormed: dsbFormed,
    regulatoryClassification: 'INVESTIGATIONAL_PRECLINICAL',
    truthClass: 'mechanistic_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
  }
}
