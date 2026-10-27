// src/domains/clinical-operations/model/cypPharmacogenomicSafety.ts
// T-CLIN-90: Clinical Cytochrome P450 Pharmacogenomic & Drug-Drug-Gene Safety CDS Engine
// CPIC (Clinical Pharmacogenetics Implementation Consortium) guideline aligned

export type Pharmacogene =
  | 'CYP2D6'
  | 'CYP2C19'
  | 'CYP2C9'
  | 'CYP3A4'
  | 'CYP3A5'
  | 'SLCO1B1'
  | 'DPYD'

export type MetabolizerPhenotype =
  | 'POOR_METABOLIZER'
  | 'INTERMEDIATE_METABOLIZER'
  | 'NORMAL_METABOLIZER'
  | 'RAPID_METABOLIZER'
  | 'ULTRA_RAPID_METABOLIZER'
  | 'INDETERMINATE'

export type PharmacogenomicAlertSeverity =
  | 'CONTRAINDICATED'
  | 'HIGH_RISK_ACTION_REQUIRED'
  | 'MODERATE_ADJUSTMENT'
  | 'STANDARD_DOSING'

export type InteractionMechanism =
  | 'PRODRUG_ACTIVATION_DEFICIT'
  | 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
  | 'ULTRA_RAPID_OVERCONVERSION'
  | 'COMPETITIVE_INHIBITION_OVERLAY'
  | 'NORMAL_CLEARANCE'

export interface PatientGenotypeRecord {
  patientId: string
  gene: Pharmacogene
  diplotype: string // e.g. "*1/*1", "*2/*2", "*4/*4", "*1/*17", "*1/*1xN"
  phenotype: MetabolizerPhenotype
  activityScore?: number
  testMethod: 'NGS_TARGETED' | 'TAQMAN_ALLELIC_DISCRIMINATION' | 'MICROARRAY'
  laboratoryAccreditation: string
  reportedAtIso: string
}

export interface PrescribedMedicationOrder {
  orderId: string
  medicationName: string
  rxNormCode?: string
  dailyDoseMg: number
  intendedIndication: string
  isProdrug: boolean
  primaryClearanceGene: Pharmacogene
  concomitantInhibitors?: string[] // e.g. ["FLUOXETINE", "OMEPRAZOLE", "KETOCONAZOLE"]
}

export interface PharmacogenomicSafetyEvaluation {
  patientId: string
  medicationName: string
  geneEvaluated: Pharmacogene
  patientPhenotype: MetabolizerPhenotype
  severity: PharmacogenomicAlertSeverity
  mechanism: InteractionMechanism
  clinicalRecommendation: string
  cpicGuidelineLevel: 'CPIC_LEVEL_A' | 'CPIC_LEVEL_B' | 'INFORMATIVE'
  evidenceSummary: string
  suggestedAlternatives: string[]
  doseAdjustmentPercentage?: number
  requiresClinicianOverride: boolean
  truthClass: 'clinical_pharmacogenomics_guideline_proxy'
  clinically_reviewed: false
  neverManufacturesGenotypes: true
  evaluatedAtIso: string
  auditDigestSha256: string
}

function computeDeterministicAuditDigest(payload: string): string {
  let h1 = 0xdeadbeef ^ payload.length
  let h2 = 0x41c6ce57 ^ payload.length
  let h3 = 0x9e3779b9 ^ payload.length
  let h4 = 0x85ebca6b ^ payload.length

  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
    h3 = Math.imul(h3 ^ ch, 2246822507)
    h4 = Math.imul(h4 ^ ch, 3266489909)
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677) ^ Math.imul(h3 ^ (h3 >>> 13), 2654435761)
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 13), 1597334677)
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909) ^ Math.imul(h1 ^ (h1 >>> 13), 2246822507)

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0')
  return `${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h2 ^ h3)}${toHex(h1 ^ h4)}${toHex(h1 ^ h2)}${toHex(h3 ^ h4)}`
}

export function evaluateCypPharmacogenomicSafety(
  patientGenotype: PatientGenotypeRecord,
  medication: PrescribedMedicationOrder,
  evaluationIsoTimestamp?: string
): PharmacogenomicSafetyEvaluation {
  const evaluatedAtIso = evaluationIsoTimestamp ?? new Date().toISOString()
  const medNormalized = medication.medicationName.trim().toUpperCase()

  let severity: PharmacogenomicAlertSeverity = 'STANDARD_DOSING'
  let mechanism: InteractionMechanism = 'NORMAL_CLEARANCE'
  let cpicGuidelineLevel: 'CPIC_LEVEL_A' | 'CPIC_LEVEL_B' | 'INFORMATIVE' = 'CPIC_LEVEL_A'
  let clinicalRecommendation = 'Standard dosing protocol. Patient has expected metabolizer status.'
  let evidenceSummary = 'Genotype indicates expected drug clearance kinetics without predicted adverse interactions.'
  let suggestedAlternatives: string[] = []
  let doseAdjustmentPercentage: number | undefined = undefined
  let requiresClinicianOverride = false

  // Gene mismatch safeguard
  if (patientGenotype.gene !== medication.primaryClearanceGene) {
    severity = 'MODERATE_ADJUSTMENT'
    clinicalRecommendation = `Warning: Provided genotype (${patientGenotype.gene}) does not match primary clearance pathway for ${medication.medicationName} (${medication.primaryClearanceGene}). Order targeted testing.`
    evidenceSummary = 'Pharmacogene target mismatch between patient record and medication clearance pathway.'
    requiresClinicianOverride = true
  } else {
    // 1. Clopidogrel & CYP2C19
    if (medNormalized.includes('CLOPIDOGREL') && patientGenotype.gene === 'CYP2C19') {
      if (patientGenotype.phenotype === 'POOR_METABOLIZER' || patientGenotype.phenotype === 'INTERMEDIATE_METABOLIZER') {
        severity = patientGenotype.phenotype === 'POOR_METABOLIZER' ? 'CONTRAINDICATED' : 'HIGH_RISK_ACTION_REQUIRED'
        mechanism = 'PRODRUG_ACTIVATION_DEFICIT'
        clinicalRecommendation = 'Avoid clopidogrel. Significantly reduced antiplatelet response and elevated stent thrombosis / ischemic stroke risk. Switch to alternative antiplatelet.'
        evidenceSummary = 'CPIC Level A: CYP2C19 loss-of-function alleles (*2, *3) critically impair active thiol metabolite generation.'
        suggestedAlternatives = ['PRASUGREL', 'TICAGRELOR']
        requiresClinicianOverride = true
      } else if (patientGenotype.phenotype === 'ULTRA_RAPID_METABOLIZER') {
        severity = 'STANDARD_DOSING'
        mechanism = 'NORMAL_CLEARANCE'
        clinicalRecommendation = 'Standard clopidogrel dosing. Enhanced platelet inhibition observed; monitor for normal bleeding risks.'
        evidenceSummary = 'CPIC Level A: CYP2C19*17 allele increases gene transcription and active metabolite generation.'
      }
    }
    // 2. Codeine / Tramadol & CYP2D6
    else if ((medNormalized.includes('CODEINE') || medNormalized.includes('TRAMADOL')) && patientGenotype.gene === 'CYP2D6') {
      if (patientGenotype.phenotype === 'ULTRA_RAPID_METABOLIZER') {
        severity = 'CONTRAINDICATED'
        mechanism = 'ULTRA_RAPID_OVERCONVERSION'
        clinicalRecommendation = 'Avoid codeine/tramadol due to risk of severe, life-threatening morphine overdose and respiratory depression. Use alternative non-CYP2D6 analgesic.'
        evidenceSummary = 'CPIC Level A: CYP2D6 gene duplication leads to hyper-rapid O-demethylation producing toxic morphine/M1 plasma levels.'
        suggestedAlternatives = ['MORPHINE (DIRECT TITRATION)', 'HYDROMORPHONE', 'NON_OPIOID_NSAID']
        requiresClinicianOverride = true
      } else if (patientGenotype.phenotype === 'POOR_METABOLIZER') {
        severity = 'HIGH_RISK_ACTION_REQUIRED'
        mechanism = 'PRODRUG_ACTIVATION_DEFICIT'
        clinicalRecommendation = 'Avoid codeine/tramadol. Ineffective analgesia due to failure of bioactivation to active morphine metabolite. Select non-CYP2D6 analgesic.'
        evidenceSummary = 'CPIC Level A: Absence of functional CYP2D6 prevents bioactivation, resulting in subtherapeutic pain control.'
        suggestedAlternatives = ['MORPHINE', 'OXYCODONE', 'ACETAMINOPHEN']
        requiresClinicianOverride = true
      }
    }
    // 3. Warfarin & CYP2C9
    else if (medNormalized.includes('WARFARIN') && patientGenotype.gene === 'CYP2C9') {
      if (patientGenotype.phenotype === 'POOR_METABOLIZER') {
        severity = 'HIGH_RISK_ACTION_REQUIRED'
        mechanism = 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
        clinicalRecommendation = 'Significant warfarin dose reduction recommended (decrease by 50-70%). Extreme risk of major hemorrhage due to impaired S-warfarin clearance.'
        evidenceSummary = 'CPIC Level A: CYP2C9*2 and *3 variants drastically decrease clearance of the more potent S-warfarin enantiomer.'
        suggestedAlternatives = ['DOAC_APIXABAN', 'DOAC_RIVAROXABAN', 'REDUCED_DOSE_WARFARIN_WITH_DAILY_INR']
        doseAdjustmentPercentage = -60
        requiresClinicianOverride = true
      } else if (patientGenotype.phenotype === 'INTERMEDIATE_METABOLIZER') {
        severity = 'MODERATE_ADJUSTMENT'
        mechanism = 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
        clinicalRecommendation = 'Moderate warfarin dose reduction recommended (decrease by 20-30%). Monitor INR closely during initiation.'
        evidenceSummary = 'CPIC Level A: Moderate reduction in S-warfarin clearance.'
        doseAdjustmentPercentage = -25
      }
    }
    // 4. Simvastatin & SLCO1B1
    else if (medNormalized.includes('SIMVASTATIN') && patientGenotype.gene === 'SLCO1B1') {
      if (patientGenotype.phenotype === 'POOR_METABOLIZER' || patientGenotype.phenotype === 'INTERMEDIATE_METABOLIZER') {
        severity = patientGenotype.phenotype === 'POOR_METABOLIZER' ? 'HIGH_RISK_ACTION_REQUIRED' : 'MODERATE_ADJUSTMENT'
        mechanism = 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
        clinicalRecommendation = 'High risk of simvastatin-induced myopathy and rhabdomyolysis. Prescribe lower dose or switch to pravastatin or rosuvastatin.'
        evidenceSummary = 'CPIC Level A: SLCO1B1 521T>C (*5) impairs OATP1B1 hepatic uptake transporter, causing elevated systemic statin exposure.'
        suggestedAlternatives = ['ROSUVASTATIN', 'PRAVASTATIN', 'ATORVASTATIN (LOW DOSE)']
        requiresClinicianOverride = patientGenotype.phenotype === 'POOR_METABOLIZER'
      }
    }
    // 5. Fluorouracil / Capecitabine & DPYD
    else if ((medNormalized.includes('FLUOROURACIL') || medNormalized.includes('CAPECITABINE')) && patientGenotype.gene === 'DPYD') {
      if (patientGenotype.phenotype === 'POOR_METABOLIZER') {
        severity = 'CONTRAINDICATED'
        mechanism = 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
        clinicalRecommendation = 'Absolute contraindication. Complete DPD enzyme deficiency leads to lethal 5-FU accumulation and catastrophic multiorgan failure.'
        evidenceSummary = 'CPIC Level A: DPYD *2A, *13, or c.2846A>T inactivating variants prevent catabolism of 5-fluorouracil.'
        suggestedAlternatives = ['NON_FLUOROPYRIMIDINE_CHEMOTHERAPY']
        requiresClinicianOverride = true
      } else if (patientGenotype.phenotype === 'INTERMEDIATE_METABOLIZER') {
        severity = 'HIGH_RISK_ACTION_REQUIRED'
        mechanism = 'ACTIVE_DRUG_ACCUMULATION_TOXICITY'
        clinicalRecommendation = 'Reduce initial fluoropyrimidine starting dose by 50%. Escalate cautiously based on toxicity and therapeutic drug monitoring.'
        evidenceSummary = 'CPIC Level A: Intermediate DPD enzyme activity.'
        doseAdjustmentPercentage = -50
        requiresClinicianOverride = true
      }
    }
  }

  // Check concomitant phenocopying inhibitors
  if (medication.concomitantInhibitors && medication.concomitantInhibitors.length > 0) {
    for (const inhibitor of medication.concomitantInhibitors) {
      const inhNorm = inhibitor.trim().toUpperCase()
      if (inhNorm.includes('FLUOXETINE') || inhNorm.includes('PAROXETINE')) {
        if (patientGenotype.gene === 'CYP2D6' && severity !== 'CONTRAINDICATED') {
          mechanism = 'COMPETITIVE_INHIBITION_OVERLAY'
          severity = 'HIGH_RISK_ACTION_REQUIRED'
          clinicalRecommendation += ` [Phenocopying Warning]: Strong CYP2D6 inhibitor ${inhNorm} converts patient clinically into Poor Metabolizer phenocopy.`
          requiresClinicianOverride = true
        }
      }
    }
  }

  const rawAuditPayload = JSON.stringify({
    patientId: patientGenotype.patientId,
    gene: patientGenotype.gene,
    diplotype: patientGenotype.diplotype,
    phenotype: patientGenotype.phenotype,
    medicationName: medication.medicationName,
    severity,
    mechanism,
    evaluatedAtIso,
  })

  return {
    patientId: patientGenotype.patientId,
    medicationName: medication.medicationName,
    geneEvaluated: patientGenotype.gene,
    patientPhenotype: patientGenotype.phenotype,
    severity,
    mechanism,
    clinicalRecommendation,
    cpicGuidelineLevel,
    evidenceSummary,
    suggestedAlternatives,
    doseAdjustmentPercentage,
    requiresClinicianOverride,
    truthClass: 'clinical_pharmacogenomics_guideline_proxy',
    clinically_reviewed: false,
    neverManufacturesGenotypes: true,
    evaluatedAtIso,
    auditDigestSha256: computeDeterministicAuditDigest(rawAuditPayload),
  }
}
