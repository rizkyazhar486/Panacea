// src/lib/discovery/ctDnaLiquidBiopsyMrdEngine.ts
// T-CLIN-118: Circulating Tumor DNA (ctDNA) Liquid Biopsy Minimal Residual Disease (MRD) Detection Engine

export interface CtDnaMrdAssayInput {
  patientPrimaryTumorTissueAvailable: boolean // tumor-informed vs tumor-agnostic assay
  totalCellFreeDnaConcentrationNgPerMl: number // cfDNA yield (normal 5 - 20 ng/mL plasma)
  detectedMutantAlleleFrequencyPercentage: number // VAF (0.00% to 5.00%)
  sequencingDepthX: number // e.g. 10,000x to 100,000x with duplex UMIs
  matchedPbmcSequencingPerformed: boolean // distinguishes CHIP from true tumor shed
  knownDriverGenesTrackedCount: number // e.g. 1 to 16 clonal tracking markers (KRAS, TP53, BRAF, PIK3CA)
  postOperativeBloodDrawWeek: number // e.g. week 4 post-op landmark draw
}

export interface CtDnaMrdEvaluation {
  ctDnaDetectionStatus: 'MRD_NEGATIVE_UNDETECTABLE' | 'MRD_LOW_VAF_INDETERMINATE' | 'MRD_POSITIVE_CLONAL_SHED'
  estimatedTumorFractionPartsPerMillion: number // PPM (0 to 50,000)
  chipVariantFilteringConcordance: 'CHIP_FILTERED_CONFIRMED_TUMOR' | 'CHIP_CONTAMINATION_SUSPECTED' | 'NO_PBMC_CONTROL_UNFILTERED'
  radiologicalRecurrenceLeadTimeMonthsEstimate: number // median 6 to 9 months lead time
  prospectiveRecurrenceHazardRatio: number // HR ~ 5.0 to 12.0 for landmark ctDNA+
  adjuvantChemotherapyStratification: 'CLEARANCE_SURVEILLANCE_APPROPRIATE' | 'DEFINITIVE_ADJUVANT_ESCALATION_CANDIDATE' | 'CONFIRMATORY_LONGITUDINAL_REDRAW_URGENT'
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Tie et al. 2022 NEJM (DYNAMIC); Newman et al. 2014 Nat Med (CAPP-Seq)'
  }
}

/**
 * Simulates ultrasensitive ctDNA minimal residual disease detection, error-corrected UMI sequencing limits, CHIP exclusion, and recurrence lead time.
 */
export function evaluateCtDnaMrdDynamics(input: CtDnaMrdAssayInput): CtDnaMrdEvaluation {
  const vaf = Math.min(10.0, Math.max(0.0, input.detectedMutantAlleleFrequencyPercentage))
  const depth = Math.min(100000, Math.max(1000, input.sequencingDepthX))
  const cfDna = Math.min(200, Math.max(1, input.totalCellFreeDnaConcentrationNgPerMl))
  const markers = Math.min(24, Math.max(1, input.knownDriverGenesTrackedCount))

  // Analytical Limit of Detection (LOD): depth-dependent Poisson sampling limit
  // With duplex UMIs at 30,000x depth and multi-gene tracking, LOD is ~ 0.01% (100 PPM)
  const baseLodVaf = Math.max(0.005, (300.0 / depth) * (1.0 / Math.sqrt(markers)))

  // CHIP concordance
  let chipStatus: 'CHIP_FILTERED_CONFIRMED_TUMOR' | 'CHIP_CONTAMINATION_SUSPECTED' | 'NO_PBMC_CONTROL_UNFILTERED' = 'NO_PBMC_CONTROL_UNFILTERED'
  if (input.matchedPbmcSequencingPerformed) {
    chipStatus = 'CHIP_FILTERED_CONFIRMED_TUMOR'
  } else if (vaf > 0.0 && vaf < 0.20 && markers <= 2) {
    // Low VAF single-gene mutation without PBMC control has high risk of being clonal hematopoiesis (DNMT3A/TET2)
    chipStatus = 'CHIP_CONTAMINATION_SUSPECTED'
  } else {
    chipStatus = 'NO_PBMC_CONTROL_UNFILTERED'
  }

  // Detection status
  let detection: 'MRD_NEGATIVE_UNDETECTABLE' | 'MRD_LOW_VAF_INDETERMINATE' | 'MRD_POSITIVE_CLONAL_SHED' = 'MRD_NEGATIVE_UNDETECTABLE'
  if (vaf >= baseLodVaf * 1.5) {
    if (chipStatus === 'CHIP_CONTAMINATION_SUSPECTED') {
      detection = 'MRD_LOW_VAF_INDETERMINATE'
    } else {
      detection = 'MRD_POSITIVE_CLONAL_SHED'
    }
  } else if (vaf > 0.0) {
    detection = 'MRD_LOW_VAF_INDETERMINATE'
  } else {
    detection = 'MRD_NEGATIVE_UNDETECTABLE'
  }

  // Tumor fraction in parts per million (1% VAF = 10,000 PPM)
  const ppm = Number((vaf * 10000.0).toFixed(0))

  // Lead time estimate: landmark ctDNA positivity precedes CT/MRI by 5 - 9 months
  let leadTimeMonths = 0.0
  let hr = 1.0
  let adjuvant: 'CLEARANCE_SURVEILLANCE_APPROPRIATE' | 'DEFINITIVE_ADJUVANT_ESCALATION_CANDIDATE' | 'CONFIRMATORY_LONGITUDINAL_REDRAW_URGENT' = 'CLEARANCE_SURVEILLANCE_APPROPRIATE'

  if (detection === 'MRD_POSITIVE_CLONAL_SHED') {
    leadTimeMonths = Number((Math.min(9.5, Math.max(4.0, 7.5 - Math.log10(Math.max(1, vaf)) * 1.2))).toFixed(1))
    hr = Number((Math.min(18.0, Math.max(4.5, 6.5 + Math.min(8.0, vaf * 3.5)))).toFixed(2))
    adjuvant = 'DEFINITIVE_ADJUVANT_ESCALATION_CANDIDATE'
  } else if (detection === 'MRD_LOW_VAF_INDETERMINATE') {
    leadTimeMonths = 0.0
    hr = 2.2
    adjuvant = 'CONFIRMATORY_LONGITUDINAL_REDRAW_URGENT'
  } else {
    leadTimeMonths = 0.0
    hr = 0.35
    adjuvant = 'CLEARANCE_SURVEILLANCE_APPROPRIATE'
  }

  return {
    ctDnaDetectionStatus: detection,
    estimatedTumorFractionPartsPerMillion: ppm,
    chipVariantFilteringConcordance: chipStatus,
    radiologicalRecurrenceLeadTimeMonthsEstimate: leadTimeMonths,
    prospectiveRecurrenceHazardRatio: hr,
    adjuvantChemotherapyStratification: adjuvant,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Tie et al. 2022 NEJM (DYNAMIC); Newman et al. 2014 Nat Med (CAPP-Seq)',
    },
  }
}
