// src/domains/quantum-biology/engine/subcellularMitochondrialDynamicsEngine.ts
// Subcellular Energetics, Chemiosmotic Coupling & Autophagic Flux Engine
// Grounded in Mitchell Chemiosmotic Hypothesis (Nobel Prize 1978), Brand/Murphy ROS Kinetics, and AMPK/mTORC1 Switch

import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp.ts'
import { sha256Hex } from '../../clinical-operations/index.ts'
import type {
  SubcellularMitochondrialInput,
  SubcellularMitochondrialEvaluationResult,
  SubcellularViabilityStatus,
  ElectronTransportChainFlux,
  ChemiosmoticBioenergetics,
  ReactiveOxygenSpeciesDynamics,
  MetabolicNutrientRheostat,
  AutophagicFluxMitophagyState,
} from '../model/subcellularMitochondrialTypes.ts'

function checkFinite(val: unknown, name: string, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) {
    throw new TypeError(`Invalid subcellular input: ${name} must be a finite number in range [${min}, ${max}]; got ${String(val)}`)
  }
  return val
}

/**
 * Computes Mitchell Proton Motive Force (PMF):
 * Delta-p = Delta-Psi_m - (2.303 * R * T / F) * Delta-pH
 * At 37 C (310.15 K), 2.303 * R * T / F = 61.54 mV.
 * Delta-pH = matrix_pH - intermembrane_pH.
 */
export function computeMitchellProtonMotiveForce(
  membranePotentialDeltaPsiMv: number,
  matrixPh = 7.8,
  intermembranePh = 7.0
): { deltaPh: number; pmfMv: number } {
  const dPsi = checkFinite(membranePotentialDeltaPsiMv, 'membranePotentialDeltaPsiMv', -250, 0)
  const mPh = checkFinite(matrixPh, 'matrixPh', 6.0, 9.0)
  const imPh = checkFinite(intermembranePh, 'intermembranePh', 6.0, 9.0)

  const deltaPh = Number((mPh - imPh).toFixed(2))
  const nernstFactor = 61.54 // mV per pH unit at 37 C
  const pmfMv = Number((dPsi - nernstFactor * deltaPh).toFixed(2))

  return { deltaPh, pmfMv }
}

/**
 * Evaluates subcellular mitochondrial electron transport, chemiosmotic ATP synthesis,
 * superoxide ROS emission, AMPK/mTOR metabolic orientation, and autophagic flux.
 */
export function evaluateSubcellularMitochondrialDynamics(
  input: SubcellularMitochondrialInput
): SubcellularMitochondrialEvaluationResult {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Subcellular mitochondrial input object is required')
  }
  if (!isValidIsoTimestamp(input.evaluationIsoTimestamp)) {
    throw new TypeError(`Invalid evaluation ISO timestamp: ${input.evaluationIsoTimestamp}`)
  }

  // Input sanitization & boundary enforcement
  const deltaPsi = checkFinite(input.membranePotentialDeltaPsiMv, 'membranePotentialDeltaPsiMv', -220, -30)
  const nadhNadRatio = checkFinite(input.nadhToNadRatio, 'nadhToNadRatio', 0.0, 5.0)
  const succinate = checkFinite(input.succinateConcentrationMm ?? 0.5, 'succinateConcentrationMm', 0.0, 10.0)
  const ucpFraction = checkFinite(input.uncouplingProteinActivityFraction ?? 0.05, 'uncouplingProteinActivityFraction', 0.0, 1.0)
  const atp = checkFinite(input.atpConcentrationMm ?? 4.5, 'atpConcentrationMm', 0.1, 15.0)
  const adp = checkFinite(input.adpConcentrationMm ?? 1.0, 'adpConcentrationMm', 0.05, 10.0)
  const amp = checkFinite(input.ampConcentrationMm ?? 0.1, 'ampConcentrationMm', 0.01, 5.0)
  const aminoAcidScore = checkFinite(input.aminoAcidAvailabilityScore ?? 0.7, 'aminoAcidAvailabilityScore', 0.0, 1.0)
  const lysoPh = checkFinite(input.lysosomalAcidityPh ?? 4.8, 'lysosomalAcidityPh', 3.5, 8.0)
  const fio2 = checkFinite(input.hypoxiaFractionFiO2 ?? 0.21, 'hypoxiaFractionFiO2', 0.0, 1.0)

  // 1. Chemiosmotic Proton Motive Force (PMF)
  const { deltaPh, pmfMv } = computeMitchellProtonMotiveForce(deltaPsi, 7.8, 7.0)
  const absPmf = Math.abs(pmfMv)

  // 2. Electron Transport Chain Activity & Proton Pumping Flux
  const o2AvailabilityFactor = Math.min(1.0, fio2 / 0.18)
  const vCI = Number((Math.min(1.0, (nadhNadRatio / (0.15 + nadhNadRatio)) * o2AvailabilityFactor)).toFixed(3))
  const vCII = Number((Math.min(1.0, (succinate / (0.35 + succinate)) * o2AvailabilityFactor)).toFixed(3))
  const vCIII = Number((Math.min(1.0, (0.65 * vCI + 0.35 * vCII) * o2AvailabilityFactor)).toFixed(3))
  const vCIV = Number((Math.min(1.0, vCIII * Math.min(1.0, fio2 / 0.14))).toFixed(3))

  // Rotary ATP Synthase (Complex V): driven by PMF exceeding ~120 mV threshold
  const pmfThreshold = 120.0
  const vCV = absPmf > pmfThreshold
    ? Number((Math.min(1.0, ((absPmf - pmfThreshold) / 90.0) * (adp / (0.3 + adp)))).toFixed(3))
    : 0.05

  // Stoichiometry: 10 H+ per 2e- (NADH), 6 H+ per 2e- (FADH2)
  const totalProtonPumpingRate = Math.round((10 * vCI * vCIV + 6 * vCII * vCIV) * 50)

  const etcFlux: ElectronTransportChainFlux = {
    complexIActivityRate: vCI,
    complexIIActivityRate: vCII,
    complexIIIActivityRate: vCIII,
    complexIVActivityRate: vCIV,
    complexVAtpSynthaseRate: vCV,
    totalProtonPumpingRate_H_per_sec: totalProtonPumpingRate,
  }

  // 3. Chemiosmotic Bioenergetics (ATP flux, Basal & UCP Leak, Thermogenesis)
  // Human mitochondria state 3: ~150-180 nmol ATP / (mg protein * min)
  const atpSynthesisFlux = Number((vCV * 180.0 * (1.0 - ucpFraction * 0.75)).toFixed(1))

  // Non-ohmic proton leak increases exponentially at high Delta-Psi (|Delta-Psi| > 150 mV)
  const hyperpolarizationExcess = Math.max(0, Math.abs(deltaPsi) - 150)
  const basalLeak = Number((1.5 * Math.exp(hyperpolarizationExcess / 22.0)).toFixed(2))
  const ucpLeak = Number((ucpFraction * 48.0 * (absPmf / 180.0)).toFixed(2))

  // Thermogenesis: dissipated proton leak power
  const heatGenPower = Number(((basalLeak + ucpLeak) * absPmf * 0.045).toFixed(2))

  const bioenergetics: ChemiosmoticBioenergetics = {
    membranePotentialDeltaPsiMv: deltaPsi,
    matrixPh: 7.8,
    intermembranePh: 7.0,
    deltaPh,
    protonMotiveForce_pmf_mV: pmfMv,
    atpSynthesisFlux_nmol_mg_min: atpSynthesisFlux,
    basalProtonLeakFlux: basalLeak,
    ucpRegulatedProtonLeakFlux: ucpLeak,
    heatGenerationRate_uW: heatGenPower,
  }

  // 4. Reactive Oxygen Species (Superoxide Kinetics Murphy/Brand)
  // Two distinct modes of mitochondrial ROS production (Murphy MP, 2009; Brand MD, 2010):
  // a) Forward/Reverse electron transfer ROS at high membrane potential (|Delta-Psi| > 150 mV)
  // b) Cytopathic electron stall ROS at Complex I/III under hypoxia or sepsis inhibition (elevated NADH/NAD+ and low O2)
  const deltaPsiNormalized = Math.abs(deltaPsi) / 140.0
  const voltageRosFactor = Math.pow(deltaPsiNormalized, 4)
  const uncouplingProtection = Math.max(0.2, 1.0 - ucpFraction * 0.65)

  const hyperpolarizationRos = 3.5 * voltageRosFactor * (1.0 + nadhNadRatio)
  const cytopathicStallRos = (nadhNadRatio > 0.35 || o2AvailabilityFactor < 0.70)
    ? 28.0 * (nadhNadRatio / (0.2 + nadhNadRatio)) * (1.0 - o2AvailabilityFactor * 0.6) * (1.0 + (1.0 - o2AvailabilityFactor) * 2.0)
    : 0.0

  const rawSuperoxideRate = Number(
    ((hyperpolarizationRos + cytopathicStallRos) * uncouplingProtection).toFixed(1)
  )

  const mnsodCapacity = 0.85
  const gpxCapacity = 0.80
  const antioxidantDepletion = Math.max(0.2, 1.0 - (nadhNadRatio > 0.4 ? 0.35 : 0.0) - (1.0 - o2AvailabilityFactor) * 0.45)
  const effectiveScavenging = (mnsodCapacity + gpxCapacity) * 0.5 * antioxidantDepletion
  const netOxidativeStress = Number(
    (Math.min(1.0, Math.max(0.0, (rawSuperoxideRate - 8.0 * effectiveScavenging) / 28.0))).toFixed(3)
  )
  const oxidativeWarning = netOxidativeStress > 0.50 || rawSuperoxideRate > 30.0 || (deltaPsi > -90 && nadhNadRatio > 0.5)

  const rosDynamics: ReactiveOxygenSpeciesDynamics = {
    superoxideGenerationRate_pmol_min: rawSuperoxideRate,
    mnsodDismutationCapacity: mnsodCapacity,
    gpxGlutathionePeroxidaseCapacity: gpxCapacity,
    netOxidativeStressIndex: netOxidativeStress,
    oxidativeStressWarning: oxidativeWarning,
  }

  // 5. Atkinson Energy Charge & AMPK / mTORC1 Rheostat Switch
  const totalAdenylates = atp + adp + amp
  const atkinsonEnergyCharge = Number(((atp + 0.5 * adp) / totalAdenylates).toFixed(3))
  const ampAtpRatio = Number((amp / atp).toFixed(3))

  // AMPK Thr172 phosphorylation: activated by high AMP/ATP and depleted energy charge
  const ampkStressScore = Math.min(1.0, Math.max(0.0, ampAtpRatio / 0.08))
  const energyDepletionFactor = Math.max(0.0, 1.0 - (atkinsonEnergyCharge - 0.5) / 0.45)
  const ampkPhosphorylation = Number((Math.min(1.0, 0.15 + 0.85 * (ampkStressScore * 0.6 + energyDepletionFactor * 0.4))).toFixed(3))

  // mTORC1 Ser2448: activated by amino acids and ATP, allosterically repressed by p-AMPK
  const rawMtorc1 = aminoAcidScore * 0.6 + (atkinsonEnergyCharge > 0.85 ? 0.4 : 0.1)
  const mtorc1Activity = Number((Math.min(1.0, Math.max(0.05, rawMtorc1 * (1.0 - ampkPhosphorylation * 0.85)))).toFixed(3))

  let metabolicOrientation: MetabolicNutrientRheostat['metabolicOrientation'] = 'BALANCED_HOMEOSTASIS'
  if (ampkPhosphorylation > 0.58) {
    metabolicOrientation = 'CATABOLIC_AUTOPHAGIC_REPAIR'
  } else if (mtorc1Activity > 0.62) {
    metabolicOrientation = 'ANABOLIC_GROWTH_STORAGE'
  }

  const metabolicRheostat: MetabolicNutrientRheostat = {
    atkinsonEnergyCharge,
    ampToAtpRatio: ampAtpRatio,
    ampkAlphaThr172Phosphorylation: ampkPhosphorylation,
    mtorc1Ser2448Activity: mtorc1Activity,
    metabolicOrientation,
  }

  // 6. Autophagic Flux & Mitophagy State Machine
  // ULK1 initiation promoted by AMPK, repressed by mTORC1 Ser757 phosphorylation
  const ulk1Initiation = Number((Math.min(1.0, Math.max(0.05, ampkPhosphorylation * 0.85 + (1.0 - mtorc1Activity) * 0.15))).toFixed(3))
  const lc3IILipidation = Number((Math.min(1.0, Math.max(0.1, ulk1Initiation * 0.88 + 0.12))).toFixed(3))

  // Lysosomal degradation depends heavily on acidic pH (< 5.2)
  let lysoStatus: AutophagicFluxMitophagyState['lysosomalFusionStatus'] = 'PERFECT_ACIDIC_DEGRADATION'
  let lysoPhEfficiency = 1.0
  if (lysoPh <= 5.0) {
    lysoStatus = 'PERFECT_ACIDIC_DEGRADATION'
    lysoPhEfficiency = 1.0
  } else if (lysoPh <= 5.6) {
    lysoStatus = 'PARTIAL_ACIDIC_IMPAIRMENT'
    lysoPhEfficiency = Math.max(0.2, 1.0 - (lysoPh - 5.0) * 1.3)
  } else {
    lysoStatus = 'ARRESTED_ALKALINIZATION'
    lysoPhEfficiency = Math.max(0.05, 0.25 - (lysoPh - 5.6) * 0.5)
  }

  const autophagosomeClearanceRate = Number((lc3IILipidation * lysoPhEfficiency * 95.0).toFixed(1))
  const p62Efficiency = Number((Math.min(1.0, Math.max(0.05, lysoPhEfficiency * (lc3IILipidation > 0.25 ? 0.95 : 0.45)))).toFixed(3))

  // Depolarization > -110 mV triggers PINK1 stabilization and Parkin recruitment
  const mitophagyCommitment = deltaPsi > -115.0
    ? Number((Math.min(1.0, Math.max(0.1, (deltaPsi - (-115.0)) / 65.0))).toFixed(3))
    : 0.05

  const autophagicFlux: AutophagicFluxMitophagyState = {
    ulk1ComplexInitiationScore: ulk1Initiation,
    lc3IILipidationRatio: lc3IILipidation,
    p62Sqstm1TurnoverEfficiency: p62Efficiency,
    autophagosomeClearanceRate_pct_hr: autophagosomeClearanceRate,
    mitophagyCommitmentIndex: mitophagyCommitment,
    lysosomalFusionStatus: lysoStatus,
  }

  // 7. Overall Subcellular Viability Status
  let viability: SubcellularViabilityStatus = 'HEALTHY_COUPLED_HOMEOSTASIS'
  if (deltaPsi > -85.0 && lysoPhEfficiency < 0.35) {
    viability = 'CYTOTOXIC_AUTOPHAGIC_ARREST'
  } else if (deltaPsi > -95.0 || vCIV < 0.20 || netOxidativeStress > 0.75) {
    viability = 'CYTOPATHIC_SEPSIS_FAILURE'
  } else if (ucpLeak > 18.0) {
    viability = 'THERMOGENIC_UNCOUPLED'
  } else if (ampkPhosphorylation > 0.55) {
    viability = 'FASTING_AUTOPHAGIC_PROTECTION'
  } else {
    viability = 'HEALTHY_COUPLED_HOMEOSTASIS'
  }

  // 8. Summary Narrative
  const summaryNarrative = `Mitochondrial PMF ${pmfMv} mV (Delta-Psi ${deltaPsi} mV, Delta-pH ${deltaPh}). ATP synthesis ${atpSynthesisFlux} nmol/(mg*min). ROS generation ${rawSuperoxideRate} pmol/min (stress index ${netOxidativeStress}). AEC ${atkinsonEnergyCharge}, AMPK ${ampkPhosphorylation} vs mTORC1 ${mtorc1Activity} (${metabolicOrientation}). Autophagic clearance ${autophagosomeClearanceRate}%/hr with ${lysoStatus}. Viability classification: ${viability}.`

  // 9. Deterministic Cryptographic SHA-256 Digest
  const auditString = `SUBCELLULAR_MITOCHONDRIA_V1|${input.evaluationIsoTimestamp}|${deltaPsi}|${pmfMv}|${atpSynthesisFlux}|${rawSuperoxideRate}|${ampkPhosphorylation}|${mtorc1Activity}|${viability}`
  const digestSha256 = sha256Hex(auditString)

  return {
    evaluationTimestampIso: input.evaluationIsoTimestamp,
    viabilityStatus: viability,
    etcFlux,
    bioenergetics,
    rosDynamics,
    metabolicRheostat,
    autophagicFlux,
    summaryNarrative,
    cryptographicSha256Digest: digestSha256,
    truthClass: 'mechanistic_simulation_proxy',
    clinically_reviewed: false,
    requiresHumanPhysicianSignoff: false,
  }
}
