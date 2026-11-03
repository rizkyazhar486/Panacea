/**
 * Advanced Educational Surgical Simulation Engine & Laparoscopic Procedural Sandbox
 * Grounded in validated surgical biomechanics, minimally invasive surgery ergonomics,
 * electrosurgical physics, and the Objective Structured Assessment of Technical Skills (OSATS).
 *
 * References:
 * 1. Hanna GB, et al. Surg Endosc. 1997;11(5):483-485. PMID: 9153181.
 * 2. Strasberg SM, et al. J Am Coll Surg. 1995;180(1):101-125. PMID: 8000648.
 * 3. Martin JA, et al. Br J Surg. 1997;84(2):273-278. PMID: 9052454.
 * 4. Neudecker J, et al. Surg Endosc. 2002;16(7):1121-1143. PMID: 12015619.
 * 5. Dodds RD, et al. Br J Surg. 1995;82(12):1661-1663. PMID: 8295844.
 */

export interface Vector3D { x: number; y: number; z: number }

export interface LaparoscopicPortGeometryInput {
  targetMm: Vector3D
  cameraPortMm: Vector3D
  leftPortMm: Vector3D
  rightPortMm: Vector3D
  fulcrumDepthMm?: { left?: number; right?: number }
}

export interface LaparoscopicErgonomicsMetrics {
  triangulationAngleDeg: number
  leftAzimuthAngleDeg: number
  rightAzimuthAngleDeg: number
  cameraAngleDeg: number
  leftWorkingDistanceMm: number
  rightWorkingDistanceMm: number
  cameraWorkingDistanceMm: number
  leftFulcrumRatio: number
  rightFulcrumRatio: number
  ergonomicQuality: 'optimal' | 'acceptable' | 'suboptimal' | 'hazardous-collision'
  collisionRisk: boolean
  feedback: string
}

export interface PneumoperitoneumHemodynamicsInput {
  intraAbdominalPressureMmHg: number
  baselineCardiacOutputLMin: number
  baselineMeanArterialPressureMmHg: number
  durationMinutes: number
  patientTrendelenburgAngleDeg?: number
}

export interface PneumoperitoneumHemodynamicsResult {
  effectiveIapMmHg: number
  adjustedCardiacOutputLMin: number
  cardiacOutputDeltaPercent: number
  estimatedSystemicVascularResistanceDyneS: number
  inferiorVenaCavaCompressionIndex: number
  hypercapniaRiskTier: 'minimal' | 'moderate' | 'high' | 'critical'
  diaphragmSplintingIndex: number
  clinicalWarnings: string[]
}

export interface DiathermyEnergyAssessmentInput {
  powerWatts: number
  mode: 'monopolar-cut' | 'monopolar-coag' | 'bipolar-coag' | 'ultrasonic'
  burstDurationSeconds: number
  distanceToAdjacentVulnerableStructureMm: number
  structureLabel: string
}

export interface DiathermyEnergyAssessmentResult {
  estimatedLateralThermalSpreadMm: number
  collateralThermalHazard: boolean
  safeClearanceMarginMm: number
  excessiveDurationWarning: boolean
  tissueDesiccationScore: number
  safetyRecommendations: string[]
}

export interface StrasbergCriticalViewInput {
  hepatocysticTriangleCleared: boolean
  cysticPlateExposed: boolean
  twoAndOnlyTwoStructuresVisible: boolean
  infundibularTractionApplied: boolean
  commonBileDuctIdentified: boolean
}

export interface StrasbergCriticalViewResult {
  cvsAchieved: boolean
  criteriaMetCount: number
  readyForClippingAndDivision: boolean
  vasculobiliaryInjuryRiskTier: 'low-safe' | 'intermediate' | 'extreme-hazard'
  auditChecklist: Array<{ criterion: string; satisfied: boolean; criticality: 'mandatory' | 'recommended' }>
  clinicalDoctrineNotice: string
}

export interface OsatsDimensionScore {
  dimension: 'respect-for-tissue' | 'time-and-motion' | 'instrument-handling' | 'knowledge-of-instruments' | 'flow-of-operation' | 'use-of-assistants' | 'knowledge-of-procedure'
  score: 1 | 2 | 3 | 4 | 5
  evidenceNotes: string
}

export interface OsatsEvaluationInput {
  candidateId: string
  procedureId: string
  scores: OsatsDimensionScore[]
  penaltyPoints?: number
}

export interface OsatsEvaluationResult {
  totalScore: number
  maxPossibleScore: 35
  percentageScore: number
  competencyTier: 'novice' | 'intermediate' | 'proficient' | 'master'
  weakestDimension: string
  strongestDimension: string
  actionableFeedback: string[]
  educationalTruthClass: 'reference'
}

function vectorSubtract(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}
function vectorMagnitude(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}
function vectorDotProduct(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}
function angleBetweenVectorsDeg(a: Vector3D, b: Vector3D): number {
  const magA = vectorMagnitude(a); const magB = vectorMagnitude(b)
  if (magA === 0 || magB === 0) return 0
  const cosTheta = Math.max(-1, Math.min(1, vectorDotProduct(a, b) / (magA * magB)))
  return (Math.acos(cosTheta) * 180) / Math.PI
}

export function calculateLaparoscopicErgonomics(input: LaparoscopicPortGeometryInput): LaparoscopicErgonomicsMetrics {
  const vLeft = vectorSubtract(input.targetMm, input.leftPortMm)
  const vRight = vectorSubtract(input.targetMm, input.rightPortMm)
  const vCam = vectorSubtract(input.targetMm, input.cameraPortMm)
  const distLeft = vectorMagnitude(vLeft); const distRight = vectorMagnitude(vRight); const distCam = vectorMagnitude(vCam)
  const triangulationDeg = angleBetweenVectorsDeg(vLeft, vRight)
  const leftAzimuthDeg = angleBetweenVectorsDeg(vLeft, vCam)
  const rightAzimuthDeg = angleBetweenVectorsDeg(vRight, vCam)
  const handleDefault = 150
  const leftRatio = (input.fulcrumDepthMm?.left ?? distLeft * 0.7) / handleDefault
  const rightRatio = (input.fulcrumDepthMm?.right ?? distRight * 0.7) / handleDefault

  let ergonomicQuality: LaparoscopicErgonomicsMetrics['ergonomicQuality'] = 'optimal'
  let collisionRisk = false
  let feedback = 'Optimal triangulation angle and port alignment.'

  if (triangulationDeg < 30) {
    ergonomicQuality = 'hazardous-collision'; collisionRisk = true
    feedback = 'Extreme sword-fighting collision risk: triangulation angle is acute (<30°).'
  } else if (triangulationDeg < 45) {
    ergonomicQuality = 'suboptimal'; collisionRisk = true
    feedback = 'Suboptimal acute triangulation: risk of instrument collision and poor depth perception.'
  } else if (triangulationDeg > 85) {
    ergonomicQuality = 'suboptimal'; collisionRisk = false
    feedback = 'Wide triangulation angle (>85°): excessive surgeon shoulder abduction and reduced manipulation dexterity.'
  } else if (triangulationDeg >= 45 && triangulationDeg <= 75) {
    ergonomicQuality = 'optimal'; collisionRisk = false
    feedback = 'Ideal ergonomic triangulation angle (45°-75°) supporting bimanual dexterity.'
  } else {
    ergonomicQuality = 'acceptable'; collisionRisk = false
    feedback = 'Acceptable port triangulation geometry.'
  }

  return {
    triangulationAngleDeg: Math.round(triangulationDeg * 10) / 10,
    leftAzimuthAngleDeg: Math.round(leftAzimuthDeg * 10) / 10,
    rightAzimuthAngleDeg: Math.round(rightAzimuthDeg * 10) / 10,
    cameraAngleDeg: Math.round(angleBetweenVectorsDeg(vCam, { x: 0, y: 0, z: 1 }) * 10) / 10,
    leftWorkingDistanceMm: Math.round(distLeft * 10) / 10,
    rightWorkingDistanceMm: Math.round(distRight * 10) / 10,
    cameraWorkingDistanceMm: Math.round(distCam * 10) / 10,
    leftFulcrumRatio: Math.round(leftRatio * 100) / 100,
    rightFulcrumRatio: Math.round(rightRatio * 100) / 100,
    ergonomicQuality, collisionRisk, feedback,
  }
}

export function evaluatePneumoperitoneumHemodynamics(input: PneumoperitoneumHemodynamicsInput): PneumoperitoneumHemodynamicsResult {
  const iap = Math.max(0, input.intraAbdominalPressureMmHg)
  const co0 = Math.max(0.1, input.baselineCardiacOutputLMin)
  const map0 = Math.max(30, input.baselineMeanArterialPressureMmHg)
  const duration = Math.max(0, input.durationMinutes)
  const trendelenburg = input.patientTrendelenburgAngleDeg ?? 0
  const warnings: string[] = []

  let coFactor = 1.0
  if (iap > 10) coFactor = Math.max(0.45, 1.0 - (iap - 10) * 0.035)
  if (trendelenburg > 15) {
    coFactor -= 0.05
    warnings.push('Steep Trendelenburg increases cephalad visceral weight on diaphragm and central venous pressures.')
  }

  const adjustedCo = co0 * coFactor
  const coDeltaPercent = ((adjustedCo - co0) / co0) * 100
  const svr = ((map0 + iap * 0.5) * 80) / adjustedCo
  const ivcCompression = Math.min(1.0, Math.max(0.0, (iap - 8) / 14))

  let hypercapniaRiskTier: PneumoperitoneumHemodynamicsResult['hypercapniaRiskTier'] = 'minimal'
  if (duration > 180 || (iap > 15 && duration > 90)) {
    hypercapniaRiskTier = 'critical'
    warnings.push('Critical hypercapnia & respiratory acidosis risk from prolonged CO2 insufflation (>3h).')
  } else if (duration > 120 || iap > 14) {
    hypercapniaRiskTier = 'high'
    warnings.push('High CO2 systemic absorption: monitor end-tidal CO2 and minute ventilation closely.')
  } else if (duration > 60 || iap > 12) {
    hypercapniaRiskTier = 'moderate'
  }
  if (iap > 15) {
    warnings.push('IAP exceeds clinical safety recommendation (>15 mmHg): risk of abdominal compartment syndrome and renal hypoperfusion.')
  }
  const diaphragmSplinting = Math.min(1.0, (iap / 20) * (1 + Math.abs(trendelenburg) / 30))

  return {
    effectiveIapMmHg: iap,
    adjustedCardiacOutputLMin: Math.round(adjustedCo * 100) / 100,
    cardiacOutputDeltaPercent: Math.round(coDeltaPercent * 10) / 10,
    estimatedSystemicVascularResistanceDyneS: Math.round(svr),
    inferiorVenaCavaCompressionIndex: Math.round(ivcCompression * 100) / 100,
    hypercapniaRiskTier,
    diaphragmSplintingIndex: Math.round(diaphragmSplinting * 100) / 100,
    clinicalWarnings: warnings,
  }
}

export function evaluateDiathermyEnergyDelivery(input: DiathermyEnergyAssessmentInput): DiathermyEnergyAssessmentResult {
  const power = Math.max(1, input.powerWatts)
  const duration = Math.max(0.1, input.burstDurationSeconds)
  const dist = Math.max(0, input.distanceToAdjacentVulnerableStructureMm)

  let kTissue = 0.65
  if (input.mode === 'monopolar-coag') kTissue = 0.95
  else if (input.mode === 'monopolar-cut') kTissue = 0.55
  else if (input.mode === 'bipolar-coag') kTissue = 0.40
  else if (input.mode === 'ultrasonic') kTissue = 0.35

  const lateralSpreadMm = kTissue * Math.sqrt(duration) * Math.pow(power / 30, 0.4)
  const excessiveDuration = duration > 3.5
  const clearanceMm = dist - lateralSpreadMm
  const collateralHazard = clearanceMm < 1.0

  const recommendations: string[] = []
  if (collateralHazard) {
    recommendations.push(`CRITICAL HAZARD: Thermal spread (${lateralSpreadMm.toFixed(1)} mm) encroaches within safe margin of ${input.structureLabel} (distance: ${dist.toFixed(1)} mm).`)
  }
  if (excessiveDuration) {
    recommendations.push('Warning: Continuous activation duration >3.5s increases deep thermal necrosis and capacitive coupling risk.')
  }
  if (input.mode === 'monopolar-coag' && dist < 5.0) {
    recommendations.push('Consider switching to bipolar or ultrasonic dissection when working within 5 mm of critical neurovascular or hollow visceral structures.')
  }
  const tissueDesiccationScore = Math.min(100, Math.round(power * duration * (kTissue / 0.5)))

  return {
    estimatedLateralThermalSpreadMm: Math.round(lateralSpreadMm * 10) / 10,
    collateralThermalHazard: collateralHazard,
    safeClearanceMarginMm: Math.round(clearanceMm * 10) / 10,
    excessiveDurationWarning: excessiveDuration,
    tissueDesiccationScore,
    safetyRecommendations: recommendations,
  }
}

export function evaluateStrasbergCriticalViewOfSafety(input: StrasbergCriticalViewInput): StrasbergCriticalViewResult {
  const c1 = input.hepatocysticTriangleCleared; const c2 = input.cysticPlateExposed; const c3 = input.twoAndOnlyTwoStructuresVisible
  const criteriaMet = (c1 ? 1 : 0) + (c2 ? 1 : 0) + (c3 ? 1 : 0)
  const cvsAchieved = c1 && c2 && c3
  const injuryRiskTier = cvsAchieved ? 'low-safe' : (criteriaMet === 0 ? 'extreme-hazard' : 'intermediate')

  const checklist: StrasbergCriticalViewResult['auditChecklist'] = [
    { criterion: 'Hepatocystic triangle cleared of fat and fibrous tissue', satisfied: c1, criticality: 'mandatory' },
    { criterion: 'Lower one-third of gallbladder separated from liver bed (cystic plate exposed)', satisfied: c2, criticality: 'mandatory' },
    { criterion: 'Two and only two structures seen entering the gallbladder (cystic duct & cystic artery)', satisfied: c3, criticality: 'mandatory' },
    { criterion: 'Lateral and cephalic infundibular traction applied for exposure', satisfied: input.infundibularTractionApplied, criticality: 'recommended' },
    { criterion: 'Common bile duct and sulcus of Rouvière identified as safety landmarks', satisfied: input.commonBileDuctIdentified, criticality: 'recommended' },
  ]

  return {
    cvsAchieved, criteriaMetCount: criteriaMet, readyForClippingAndDivision: cvsAchieved,
    vasculobiliaryInjuryRiskTier: injuryRiskTier, auditChecklist: checklist,
    clinicalDoctrineNotice: 'Strasberg Critical View of Safety (CVS, 1995): Under SAGES clinical consensus, clipping or dividing the cystic duct and artery before establishing all 3 mandatory criteria constitutes a critical departure from safe surgical practice.',
  }
}

export function evaluateOsatsCompetency(input: OsatsEvaluationInput): OsatsEvaluationResult {
  const scores = input.scores
  const totalRaw = scores.reduce((acc, curr) => acc + curr.score, 0)
  const finalTotal = Math.max(0, Math.min(35, totalRaw - (input.penaltyPoints ?? 0)))
  const percentage = Math.round((finalTotal / 35) * 100)
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const weakest = sorted[0]?.dimension ?? 'none'
  const strongest = sorted[sorted.length - 1]?.dimension ?? 'none'

  const competencyTier = finalTotal >= 30 ? 'master' : finalTotal >= 24 ? 'proficient' : finalTotal >= 16 ? 'intermediate' : 'novice'
  const feedback: string[] = []
  if (finalTotal < 20) feedback.push('Focus on tissue handling economy and pre-procedural instrument familiarity.')
  if (sorted.some((s) => s.score <= 2)) feedback.push(`Remediation recommended for sub-score in dimension: ${weakest}.`)
  else feedback.push('Demonstrates consistent technique across technical competency domains.')

  return {
    totalScore: finalTotal, maxPossibleScore: 35, percentageScore: percentage, competencyTier,
    weakestDimension: weakest, strongestDimension: strongest, actionableFeedback: feedback,
    educationalTruthClass: 'reference',
  }
}
