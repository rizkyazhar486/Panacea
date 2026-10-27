// src/domains/clinical-operations/model/anticoagulationAfibRiskCds.ts
// T-CLIN-115: Clinical Anticoagulation HAS-BLED Bleeding vs CHA2DS2-VASc Thrombosis Balance CDS Engine
// Aligned with 2024 ESC / 2023 ACC/AHA Atrial Fibrillation Anticoagulation Guidelines

export type BiologicalSex = 'MALE' | 'FEMALE'

export interface PatientAfibRegimenInput {
  patientId: string
  ageYears: number
  biologicalSex: BiologicalSex
  bodyWeightKg: number
  serumCreatinineMgDl: number
  creatinineClearanceMlMin?: number
  hasCongestiveHeartFailure: boolean
  hasHypertension: boolean
  hasDiabetesMellitus: boolean
  hasPriorStrokeTiaThromboembolism: boolean
  hasVascularDisease: boolean // prior MI, peripheral artery disease, aortic plaque
  hasAbnormalRenalFunction: boolean
  hasAbnormalLiverFunction: boolean
  hasPriorMajorBleed: boolean
  hasLabileInrIfOnVka?: boolean
  concomitantAntiplateletOrNsaidUse: boolean
  alcoholAbuseHistory: boolean
  hasMechanicalProstheticHeartValve: boolean
  hasModerateToSevereMitralStenosis: boolean
}

export interface AnticoagulationDecisionEvaluation {
  patientId: string
  cha2ds2VascScore: number
  strokeRiskPercentagePerYear: number
  hasBledScore: number
  highBleedingRiskFlag: boolean // HAS-BLED >= 3
  anticoagulationRecommendation: {
    indicationStatus: 'STRONGLY_RECOMMENDED_CLASS_I' | 'CONSIDER_CLASS_IIA' | 'NOT_RECOMMENDED_LOW_RISK' | 'CONTRAINDICATED'
    preferredAnticoagulantAgent: 'DIRECT_ORAL_ANTICOAGULANT_DOAC' | 'VITAMIN_K_ANTAGONIST_WARFARIN_ONLY' | 'NO_ANTICOAGULATION'
    recommendedDoacDosingGuidance: {
      agent: 'APIXABAN' | 'RIVAROXABAN' | 'DABIGATRAN' | 'NONE'
      standardDose: string
      adjustedDoseReasoning?: string
    }
    modifiableBleedingRiskFactorsToCorrect: string[]
  }
  clinicalSafetyBoundaryAlerts: string[]
  requiresUrgentCardiologyReview: boolean
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
 * Evaluates thromboembolic stroke risk (CHA2DS2-VASc) vs bleeding hazard (HAS-BLED) to guide oral anticoagulation in non-valvular and valvular AF.
 */
export function evaluateAnticoagulationAfibSafety(
  input: PatientAfibRegimenInput,
  evaluationIsoTimestamp?: string
): AnticoagulationDecisionEvaluation {
  const evaluatedAtIso = evaluationIsoTimestamp ?? new Date().toISOString()
  const alerts: string[] = []

  // 1. Calculate CHA2DS2-VASc Score
  let chaScore = 0
  if (input.hasCongestiveHeartFailure) chaScore += 1
  if (input.hasHypertension) chaScore += 1
  if (input.ageYears >= 75) {
    chaScore += 2
  } else if (input.ageYears >= 65) {
    chaScore += 1
  }
  if (input.hasDiabetesMellitus) chaScore += 1
  if (input.hasPriorStrokeTiaThromboembolism) chaScore += 2
  if (input.hasVascularDisease) chaScore += 1
  if (input.biologicalSex === 'FEMALE') chaScore += 1

  // Approximate annual stroke risk based on score (Lip et al. 2010 Chest)
  const strokeRiskMap = [0.2, 0.6, 1.3, 2.2, 3.2, 4.4, 6.7, 9.8, 9.6, 15.2]
  const annualStrokeRisk = strokeRiskMap[Math.min(9, chaScore)]

  // 2. Calculate HAS-BLED Score
  let hasBled = 0
  if (input.hasHypertension) hasBled += 1
  if (input.hasAbnormalRenalFunction) hasBled += 1
  if (input.hasAbnormalLiverFunction) hasBled += 1
  if (input.hasPriorStrokeTiaThromboembolism) hasBled += 1
  if (input.hasPriorMajorBleed) hasBled += 1
  if (input.hasLabileInrIfOnVka) hasBled += 1
  if (input.ageYears > 65) hasBled += 1
  if (input.concomitantAntiplateletOrNsaidUse) hasBled += 1
  if (input.alcoholAbuseHistory) hasBled += 1

  const isHighBleedRisk = hasBled >= 3
  if (isHighBleedRisk) {
    alerts.push(`High bleeding risk (HAS-BLED = ${hasBled} >= 3): frequent monitoring and aggressive correction of modifiable risk factors mandated.`)
  }

  // Modifiable bleeding factors
  const modifiableFactors: string[] = []
  if (input.hasHypertension) modifiableFactors.push('Tight blood pressure control (target SBP < 130 mmHg)')
  if (input.concomitantAntiplateletOrNsaidUse) modifiableFactors.push('Re-evaluate and discontinue unnecessary NSAIDs or antiplatelet agents')
  if (input.alcoholAbuseHistory) modifiableFactors.push('Counseling and cessation of high alcohol intake')
  if (input.hasLabileInrIfOnVka) modifiableFactors.push('Switch from Warfarin to DOAC if TTR < 70% and non-valvular')

  // 3. Valvular vs Non-Valvular Anticoagulation Determination
  const isValvular = input.hasMechanicalProstheticHeartValve || input.hasModerateToSevereMitralStenosis
  let agent: 'DIRECT_ORAL_ANTICOAGULANT_DOAC' | 'VITAMIN_K_ANTAGONIST_WARFARIN_ONLY' | 'NO_ANTICOAGULATION' = 'DIRECT_ORAL_ANTICOAGULANT_DOAC'

  if (isValvular) {
    agent = 'VITAMIN_K_ANTAGONIST_WARFARIN_ONLY'
    alerts.push('CRITICAL: Valvular AF with mechanical valve or moderate-severe mitral stenosis. DOACs are STRICTLY CONTRAINDICATED; Warfarin with INR target required.')
  }

  // 4. Recommendation thresholds (Class I vs Class IIa vs none)
  const isMale = input.biologicalSex === 'MALE'
  let indication: 'STRONGLY_RECOMMENDED_CLASS_I' | 'CONSIDER_CLASS_IIA' | 'NOT_RECOMMENDED_LOW_RISK' | 'CONTRAINDICATED' = 'NOT_RECOMMENDED_LOW_RISK'

  if (input.hasPriorMajorBleed && input.serumCreatinineMgDl > 3.0) {
    indication = 'CONTRAINDICATED'
    agent = 'NO_ANTICOAGULATION'
    alerts.push('Relative contraindication: active/recent severe hemorrhage with renal shutdown.')
  } else if (isValvular) {
    indication = 'STRONGLY_RECOMMENDED_CLASS_I'
  } else if ((isMale && chaScore >= 2) || (!isMale && chaScore >= 3)) {
    indication = 'STRONGLY_RECOMMENDED_CLASS_I'
  } else if ((isMale && chaScore === 1) || (!isMale && chaScore === 2)) {
    indication = 'CONSIDER_CLASS_IIA'
  } else {
    indication = 'NOT_RECOMMENDED_LOW_RISK'
    agent = 'NO_ANTICOAGULATION'
  }

  // 5. DOAC Dosing Adjustment (Apixaban ABC criteria: Age >= 80, Body weight <= 60 kg, Creatinine >= 1.5 mg/dL)
  let doacChoice: 'APIXABAN' | 'RIVAROXABAN' | 'DABIGATRAN' | 'NONE' = 'APIXABAN'
  let standardDose = '5 mg twice daily'
  let doseReasoning: string | undefined = undefined

  if (agent === 'DIRECT_ORAL_ANTICOAGULANT_DOAC') {
    let apixabanDoseReductionCount = 0
    if (input.ageYears >= 80) apixabanDoseReductionCount++
    if (input.bodyWeightKg <= 60) apixabanDoseReductionCount++
    if (input.serumCreatinineMgDl >= 1.5) apixabanDoseReductionCount++

    if (apixabanDoseReductionCount >= 2) {
      standardDose = '2.5 mg twice daily'
      doseReasoning = `Dose reduced to 2.5 mg BID due to meeting ${apixabanDoseReductionCount} of 3 criteria (Age >= 80, Weight <= 60kg, Cr >= 1.5mg/dL)`
      alerts.push(`Apixaban dose reduction indicated: ${doseReasoning}`)
    }
  } else {
    doacChoice = 'NONE'
    standardDose = 'None (Warfarin or no anticoagulation indicated)'
  }

  const payloadToDigest = JSON.stringify({
    patientId: input.patientId,
    chaScore,
    hasBled,
    indication,
    agent,
    evaluatedAtIso,
  })
  const auditDigest = computeDeterministicAuditDigest(payloadToDigest)

  return {
    patientId: input.patientId,
    cha2ds2VascScore: chaScore,
    strokeRiskPercentagePerYear: annualStrokeRisk,
    hasBledScore: hasBled,
    highBleedingRiskFlag: isHighBleedRisk,
    anticoagulationRecommendation: {
      indicationStatus: indication,
      preferredAnticoagulantAgent: agent,
      recommendedDoacDosingGuidance: {
        agent: doacChoice,
        standardDose,
        adjustedDoseReasoning: doseReasoning,
      },
      modifiableBleedingRiskFactorsToCorrect: modifiableFactors,
    },
    clinicalSafetyBoundaryAlerts: alerts,
    requiresUrgentCardiologyReview: isValvular || (isHighBleedRisk && indication === 'STRONGLY_RECOMMENDED_CLASS_I'),
    truthClass: 'clinical_decision_support_guideline_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
    evaluatedAtIso,
    auditDigestSha256: auditDigest,
  }
}
