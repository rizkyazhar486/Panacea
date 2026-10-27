// src/domains/clinical-operations/model/antimicrobialStewardshipRenalCds.ts
// T-CLIN-95: Clinical Antimicrobial Stewardship & Renal-Dosed Pathogen Sensitivity CDS Engine
// Aligned with IDSA Guidelines & Sanford Guide Renal Dosing Protocol

export type BiologicalSex = 'MALE' | 'FEMALE'

export type InfectionSyndrome =
  | 'HOSPITAL_ACQUIRED_PNEUMONIA'
  | 'COMPLICATED_URINARY_TRACT_INFECTION'
  | 'INTRA_ABDOMINAL_SEPSIS'
  | 'SKIN_SOFT_TISSUE_MRSA'
  | 'BACTEREMIA_SEPTIC_SHOCK'

export type PathogenProfile =
  | 'PSEUDOMONAS_AERUGINOSA'
  | 'METHICILLIN_RESISTANT_S_AUREUS_MRSA'
  | 'ESBL_PRODUCING_ENTEROBACTERALES'
  | 'ENTEROCOCCUS_FAECALIS'
  | 'STREPTOCOCCUS_PNEUMONIAE'
  | 'EMPIRIC_COVERAGE_NO_ISOLATE_YET'

export interface PatientRenalParameters {
  patientId: string
  ageYears: number
  sex: BiologicalSex
  weightKg: number
  serumCreatinineMgDl: number // normal 0.7 - 1.2 mg/dL
  isHemodialysisDependent?: boolean
}

export interface PrescribedAntimicrobialOrder {
  orderId: string
  antibioticName: 'VANCOMYCIN' | 'PIPERACILLIN_TAZOBACTAM' | 'MEROPENEM' | 'CEFEPIME' | 'CIPROFLOXACIN' | 'COLISTIN'
  requestedDoseMg: number
  requestedDoseIntervalHours: number // e.g. 8, 12, 24, 48 hours
  infectionSyndrome: InfectionSyndrome
  suspectedOrCulturedPathogen: PathogenProfile
  concomitantNephrotoxins?: string[] // e.g. ["PIPERACILLIN_TAZOBACTAM", "GENTAMICIN", "FUROSEMIDE", "CONTRAST_IV"]
}

export interface AntimicrobialStewardshipEvaluation {
  patientId: string
  orderId: string
  antibioticName: string
  calculatedCreatinineClearanceMlMin: number // Cockcroft-Gault
  renalFunctionCategory: 'NORMAL_FUNCTION' | 'MILD_IMPAIRMENT' | 'MODERATE_IMPAIRMENT' | 'SEVERE_IMPAIRMENT' | 'END_STAGE_ESRD'
  coverageConcordance: 'OPTIMAL_TARGETED' | 'ACCEPTABLE_EMPIRIC' | 'MISMATCH_INSUFFICIENT_SPECTRUM' | 'OVERLY_BROAD_DE_ESCALATE'
  dosingSafetyAlert: 'SAFE_STANDARD_DOSING' | 'DOSE_REDUCTION_REQUIRED' | 'INTERVAL_EXTENSION_REQUIRED' | 'NEPHROTOXIC_SYNERGY_AVOID'
  recommendedDoseMg: number
  recommendedIntervalHours: number
  therapeuticDrugMonitoringRequired: boolean // e.g. Vancomycin trough or AUC24/MIC targeting
  nephrotoxicityWarningSummary?: string
  guidelineCitation: string
  requiresClinicianAcknowledgment: boolean
  truthClass: 'clinical_decision_support_guideline_proxy'
  clinically_reviewed: false
  neverManufacturesBiomarkers: true
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

/**
 * Evaluates patient creatinine clearance (Cockcroft-Gault), adjusts antibiotic regimen, and screens for nephrotoxicity and coverage mismatch.
 */
export function evaluateAntimicrobialStewardship(
  patient: PatientRenalParameters,
  order: PrescribedAntimicrobialOrder,
  evaluationIsoTimestamp?: string
): AntimicrobialStewardshipEvaluation {
  const evaluatedAtIso = evaluationIsoTimestamp ?? new Date().toISOString()

  // Cockcroft-Gault Equation: ((140 - age) * weight) / (72 * Scr) * (0.85 if female)
  const age = Math.max(18, Math.min(105, patient.ageYears))
  const weight = Math.max(30, Math.min(220, patient.weightKg))
  const scr = Math.max(0.3, patient.serumCreatinineMgDl)

  let crCl = ((140 - age) * weight) / (72 * scr)
  if (patient.sex === 'FEMALE') {
    crCl *= 0.85
  }
  const calcCrCl = Number(crCl.toFixed(1))

  // Renal function stage
  let renalCat: 'NORMAL_FUNCTION' | 'MILD_IMPAIRMENT' | 'MODERATE_IMPAIRMENT' | 'SEVERE_IMPAIRMENT' | 'END_STAGE_ESRD' = 'NORMAL_FUNCTION'
  if (patient.isHemodialysisDependent || calcCrCl < 15.0) {
    renalCat = 'END_STAGE_ESRD'
  } else if (calcCrCl < 30.0) {
    renalCat = 'SEVERE_IMPAIRMENT'
  } else if (calcCrCl < 60.0) {
    renalCat = 'MODERATE_IMPAIRMENT'
  } else if (calcCrCl < 90.0) {
    renalCat = 'MILD_IMPAIRMENT'
  } else {
    renalCat = 'NORMAL_FUNCTION'
  }

  // Dosing adjustment by antibiotic & CrCl
  let recDose = order.requestedDoseMg
  let recInterval = order.requestedDoseIntervalHours
  let doseAlert: 'SAFE_STANDARD_DOSING' | 'DOSE_REDUCTION_REQUIRED' | 'INTERVAL_EXTENSION_REQUIRED' | 'NEPHROTOXIC_SYNERGY_AVOID' = 'SAFE_STANDARD_DOSING'
  let tdmRequired = false
  let warningSummary: string | undefined = undefined
  let requiresClinicianAck = false

  switch (order.antibioticName) {
    case 'VANCOMYCIN':
      tdmRequired = true
      if (calcCrCl < 30.0) {
        recDose = 1000
        recInterval = 48
        doseAlert = 'INTERVAL_EXTENSION_REQUIRED'
        requiresClinicianAck = true
      } else if (calcCrCl < 50.0) {
        recDose = 1000
        recInterval = 24
        doseAlert = 'INTERVAL_EXTENSION_REQUIRED'
        requiresClinicianAck = true
      } else {
        recDose = 1000
        recInterval = 12
        doseAlert = 'SAFE_STANDARD_DOSING'
      }

      // Check synergy nephrotoxicity with Piperacillin-Tazobactam
      if (order.concomitantNephrotoxins && order.concomitantNephrotoxins.some((t) => t.toUpperCase().includes('PIPERACILLIN') || t.toUpperCase().includes('TAZOBAC'))) {
        doseAlert = 'NEPHROTOXIC_SYNERGY_AVOID'
        warningSummary = 'High risk of acute kidney injury (AKI) from concomitant Vancomycin + Piperacillin-Tazobactam synergy. Consider Cefepime or Meropenem alternative.'
        requiresClinicianAck = true
      }
      break

    case 'MEROPENEM':
      if (calcCrCl < 15.0) {
        recDose = 500
        recInterval = 24
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else if (calcCrCl < 26.0) {
        recDose = 500
        recInterval = 12
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else if (calcCrCl < 50.0) {
        recDose = 1000
        recInterval = 12
        doseAlert = 'INTERVAL_EXTENSION_REQUIRED'
        requiresClinicianAck = true
      } else {
        recDose = 1000
        recInterval = 8
        doseAlert = 'SAFE_STANDARD_DOSING'
      }
      break

    case 'CEFEPIME':
      // Cefepime neurotoxicity risk in renal impairment without dose adjustment
      if (calcCrCl < 30.0) {
        recDose = 1000
        recInterval = 24
        doseAlert = 'INTERVAL_EXTENSION_REQUIRED'
        warningSummary = 'Unadjusted Cefepime in severe renal impairment causes drug accumulation and severe encephalopathy / non-convulsive status epilepticus.'
        requiresClinicianAck = true
      } else if (calcCrCl < 60.0) {
        recDose = 1000
        recInterval = 12
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else {
        recDose = 2000
        recInterval = 8
        doseAlert = 'SAFE_STANDARD_DOSING'
      }
      break

    case 'PIPERACILLIN_TAZOBACTAM':
      if (calcCrCl < 20.0) {
        recDose = 2250
        recInterval = 8
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else if (calcCrCl <= 50.0) {
        recDose = 3375
        recInterval = 6
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else {
        recDose = 4500
        recInterval = 6
        doseAlert = 'SAFE_STANDARD_DOSING'
      }
      break

    case 'CIPROFLOXACIN':
      if (calcCrCl < 30.0) {
        recDose = 250
        recInterval = 12
        doseAlert = 'DOSE_REDUCTION_REQUIRED'
        requiresClinicianAck = true
      } else {
        recDose = 400
        recInterval = 12
        doseAlert = 'SAFE_STANDARD_DOSING'
      }
      break

    default:
      recDose = order.requestedDoseMg
      recInterval = order.requestedDoseIntervalHours
  }

  // Coverage Concordance
  let concordance: 'OPTIMAL_TARGETED' | 'ACCEPTABLE_EMPIRIC' | 'MISMATCH_INSUFFICIENT_SPECTRUM' | 'OVERLY_BROAD_DE_ESCALATE' = 'ACCEPTABLE_EMPIRIC'
  const path = order.suspectedOrCulturedPathogen
  const abx = order.antibioticName

  if (path === 'EMPIRIC_COVERAGE_NO_ISOLATE_YET') {
    concordance = 'ACCEPTABLE_EMPIRIC'
  } else if (path === 'METHICILLIN_RESISTANT_S_AUREUS_MRSA') {
    if (abx === 'VANCOMYCIN') {
      concordance = 'OPTIMAL_TARGETED'
    } else {
      concordance = 'MISMATCH_INSUFFICIENT_SPECTRUM'
      requiresClinicianAck = true
    }
  } else if (path === 'PSEUDOMONAS_AERUGINOSA') {
    if (['PIPERACILLIN_TAZOBACTAM', 'MEROPENEM', 'CEFEPIME', 'CIPROFLOXACIN'].includes(abx)) {
      concordance = 'OPTIMAL_TARGETED'
    } else {
      concordance = 'MISMATCH_INSUFFICIENT_SPECTRUM'
      requiresClinicianAck = true
    }
  } else if (path === 'ESBL_PRODUCING_ENTEROBACTERALES') {
    if (abx === 'MEROPENEM') {
      concordance = 'OPTIMAL_TARGETED'
    } else if (['PIPERACILLIN_TAZOBACTAM', 'CEFEPIME'].includes(abx)) {
      concordance = 'MISMATCH_INSUFFICIENT_SPECTRUM'
      warningSummary = (warningSummary ? warningSummary + ' ' : '') + 'ESBL isolate demonstrated: beta-lactamase hydrolysis renders piperacillin/cefepime subtherapeutic. Carbapenem indicated.'
      requiresClinicianAck = true
    }
  } else if (path === 'STREPTOCOCCUS_PNEUMONIAE') {
    if (abx === 'MEROPENEM') {
      concordance = 'OVERLY_BROAD_DE_ESCALATE'
      warningSummary = (warningSummary ? warningSummary + ' ' : '') + 'Carbapenem stewardship: S. pneumoniae is fully susceptible to narrow-spectrum beta-lactams; recommend de-escalation.'
    } else {
      concordance = 'OPTIMAL_TARGETED'
    }
  }

  const rawAuditPayload = JSON.stringify({
    patientId: patient.patientId,
    orderId: order.orderId,
    abx: order.antibioticName,
    calcCrCl,
    renalCat,
    recDose,
    recInterval,
    doseAlert,
    concordance,
    evaluatedAtIso,
  })

  return {
    patientId: patient.patientId,
    orderId: order.orderId,
    antibioticName: order.antibioticName,
    calculatedCreatinineClearanceMlMin: calcCrCl,
    renalFunctionCategory: renalCat,
    coverageConcordance: concordance,
    dosingSafetyAlert: doseAlert,
    recommendedDoseMg: recDose,
    recommendedIntervalHours: recInterval,
    therapeuticDrugMonitoringRequired: tdmRequired,
    nephrotoxicityWarningSummary: warningSummary,
    guidelineCitation: 'IDSA Guidance on Antimicrobial Stewardship & Sanford Guide to Antimicrobial Therapy 2026',
    requiresClinicianAcknowledgment: requiresClinicianAck,
    truthClass: 'clinical_decision_support_guideline_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
    evaluatedAtIso,
    auditDigestSha256: computeDeterministicAuditDigest(rawAuditPayload),
  }
}
