// src/lib/discovery/rnaEpitranscriptomicsEngine.ts
// PanaceaMed T-CLIN-78: RNA Epitranscriptomics & m6A Methylation Dynamic Regulation Engine

export interface M6aMachineryState {
  mettl3_mettl14_writerActivity: number // 0.0 - 1.0 (SAM-dependent methyltransferase)
  wtap_adaptorLevel: number // 0.0 - 1.0
  alkbh5_eraserActivity: number // 0.0 - 1.0 (Fe(II)/alpha-KG dependent demethylase)
  fto_eraserActivity: number // 0.0 - 1.0
  ythdf1_translationReader: number // 0.0 - 1.0 (enhances ribosome loading)
  ythdf2_decayReader: number // 0.0 - 1.0 (promotes deadenylation and decay)
  ythdc1_nuclearReader: number // 0.0 - 1.0 (splicing & nuclear export)
}

export interface RnaTranscriptInput {
  transcriptId: string
  sequence5to3: string // RNA sequence (AUCG)
  baselineHalfLifeHours?: number // Default ~8 hours
  machinery?: Partial<M6aMachineryState>
}

export interface M6aSitePrediction {
  position: number // 1-based index
  motifSequence: string // 5 nt motif e.g. "GGACU"
  fitsDrachConsensus: boolean
  predictedMethylationOccupancy: number // 0.0 - 1.0
}

export interface RnaEpitranscriptomicProfile {
  transcriptId: string
  lengthNt: number
  identifiedM6aCount: number
  m6aSites: M6aSitePrediction[]
  effectiveMethylationBurden: number // sum of occupancies
  predictedHalfLifeHours: number
  predictedTranslationEfficiencyFoldChange: number // relative to unmethylated
  nuclearExportAccelerationRatio: number
  truthClass: 'mechanistic_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
}

/**
 * Checks if 5 nt motif matches DRACH consensus:
 * D = [A, G, U]
 * R = [A, G]
 * A = target A (middle position index 2)
 * C = C
 * H = [A, C, U]
 */
export function matchesDrachConsensus(fiveNt: string): boolean {
  if (fiveNt.length !== 5) return false
  const seq = fiveNt.toUpperCase().replace(/T/g, 'U')
  const d = ['A', 'G', 'U'].includes(seq[0])
  const r = ['A', 'G'].includes(seq[1])
  const a = seq[2] === 'A'
  const c = seq[3] === 'C'
  const h = ['A', 'C', 'U'].includes(seq[4])
  return d && r && a && c && h
}

/**
 * Scans RNA sequence for DRACH consensus motifs and predicts m6A occupancy.
 */
export function scanM6aSites(
  sequence: string,
  writerActivity = 0.75,
  eraserActivity = 0.35
): M6aSitePrediction[] {
  const sites: M6aSitePrediction[] = []
  const seq = sequence.toUpperCase().replace(/T/g, 'U')

  for (let i = 0; i <= seq.length - 5; i++) {
    const kmer = seq.slice(i, i + 5)
    if (matchesDrachConsensus(kmer)) {
      // Net occupancy governed by writer vs eraser balance
      const baseProb = 0.7
      const net = baseProb * (writerActivity / (writerActivity + eraserActivity + 0.1))
      sites.push({
        position: i + 3, // 1-based index of the target adenosine
        motifSequence: kmer,
        fitsDrachConsensus: true,
        predictedMethylationOccupancy: Number(Math.min(1.0, Math.max(0.05, net)).toFixed(3)),
      })
    }
  }

  return sites
}

/**
 * Evaluates the epitranscriptomic fate of a transcript under specific reader/writer/eraser states.
 */
export function evaluateRnaEpitranscriptomics(input: RnaTranscriptInput): RnaEpitranscriptomicProfile {
  const machinery: M6aMachineryState = {
    mettl3_mettl14_writerActivity: input.machinery?.mettl3_mettl14_writerActivity ?? 0.75,
    wtap_adaptorLevel: input.machinery?.wtap_adaptorLevel ?? 0.8,
    alkbh5_eraserActivity: input.machinery?.alkbh5_eraserActivity ?? 0.3,
    fto_eraserActivity: input.machinery?.fto_eraserActivity ?? 0.25,
    ythdf1_translationReader: input.machinery?.ythdf1_translationReader ?? 0.7,
    ythdf2_decayReader: input.machinery?.ythdf2_decayReader ?? 0.65,
    ythdc1_nuclearReader: input.machinery?.ythdc1_nuclearReader ?? 0.6,
  }

  const baselineT12 = input.baselineHalfLifeHours ?? 8.0
  const sites = scanM6aSites(input.sequence5to3, machinery.mettl3_mettl14_writerActivity, machinery.alkbh5_eraserActivity)
  const burden = sites.reduce((sum, s) => sum + s.predictedMethylationOccupancy, 0)

  // 1. YTHDF2-mediated mRNA destabilization
  // Half-life decreases exponentially with m6A burden when YTHDF2 is active
  const decayConstant = 0.15 * machinery.ythdf2_decayReader * burden
  const adjustedT12 = Number(Math.max(1.0, baselineT12 * Math.exp(-decayConstant)).toFixed(2))

  // 2. YTHDF1-mediated translation enhancement
  // Increases translation initiation efficiency
  const translationBoost = Number((1.0 + 0.22 * machinery.ythdf1_translationReader * Math.min(5.0, burden)).toFixed(2))

  // 3. YTHDC1-mediated nuclear export
  const exportRatio = Number((1.0 + 0.18 * machinery.ythdc1_nuclearReader * Math.min(4.0, burden)).toFixed(2))

  return {
    transcriptId: input.transcriptId,
    lengthNt: input.sequence5to3.length,
    identifiedM6aCount: sites.length,
    m6aSites: sites,
    effectiveMethylationBurden: Number(burden.toFixed(3)),
    predictedHalfLifeHours: adjustedT12,
    predictedTranslationEfficiencyFoldChange: translationBoost,
    nuclearExportAccelerationRatio: exportRatio,
    truthClass: 'mechanistic_simulation_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
  }
}
