// src/lib/discovery/cardiomyocyteRyr2Serca2aCalciumEngine.ts
// T-CLIN-129: Cardiomyocyte Excitation-Contraction (EC) Coupling, Ryanodine Receptor (RyR2) & SERCA2a Calcium Engine

export interface CardiomyocyteCalciumInput {
  ryr2ReceptorClusterDensityRatio: number // normal 1.0; oxidized/hyperphosphorylated leaky > 1.3
  ryr2DiastolicLeakPresent?: boolean // CPVT mutation or heart failure leak
  serca2aPumpActivityRatio: number // normal 1.0; heart failure downregulated < 0.50
  phospholambanSer16PhosphorylationRatio: number // normal basal 0.35; beta-adrenergic stimulated > 0.80
  sarcoplasmicReticulumCaContentRatio?: number // normal 1.0 (SR load)
  betaBlockerTherapyPresent?: boolean // dampens PKA hyperphosphorylation
}

export interface CardiomyocyteCalciumEvaluation {
  peakSystolicCalciumMicromolar: number // normal 0.85 - 1.40 uM
  diastolicRestingCalciumNanomolar: number // normal 80 - 120 nM; elevated in diastolic dysfunction > 150 nM
  calciumTransientDecayTauMilliseconds: number // tau: speed of relaxation (normal 150 - 250 ms)
  fractionalSercaReuptakePercentage: number // normal 65 - 75%
  delayedAfterdepolarizationArrhythmiaRiskTier: 'LOW_HOMOGENEOUS_COUPLING' | 'MODERATE_AFTERDEPOLARIZATION_VULNERABILITY' | 'CRITICAL_CPVT_VENTRICULAR_TACHYCARDIA_TRIGGER'
  sarcomericContractileForcePercentage: number // % of maximum Frank-Starling isometric force
  betaAdrenergicLusitropicReserveScore: number // 0.0 - 1.0
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Bers 2002 Nature; Marks 2013 Physiol Rev; MacLennan & Kranias 2003 Nat Rev Mol Cell Biol'
  }
}

/**
 * Simulates cardiomyocyte CICR dyadic cleft release, RyR2 diastolic leak, SERCA2a-PLN Ca2+ reuptake, and DAD arrhythmogenesis.
 */
export function evaluateCardiomyocyteCalciumDynamics(input: CardiomyocyteCalciumInput): CardiomyocyteCalciumEvaluation {
  const ryr2 = Math.min(2.0, Math.max(0.1, input.ryr2ReceptorClusterDensityRatio))
  const serca = Math.min(2.0, Math.max(0.05, input.serca2aPumpActivityRatio))
  const plnP = Math.min(1.0, Math.max(0.05, input.phospholambanSer16PhosphorylationRatio))
  const srLoad = Math.min(1.5, Math.max(0.2, input.sarcoplasmicReticulumCaContentRatio ?? 1.0))
  const hasLeak = input.ryr2DiastolicLeakPresent ?? false
  const hasBb = input.betaBlockerTherapyPresent ?? false

  // Phospholamban relief of SERCA2a: unphosphorylated PLN inhibits SERCA; phosphorylation at Ser16 accelerates SERCA Vmax
  const plnReliefFactor = 0.55 + plnP * 0.65
  const effectiveSerca = serca * plnReliefFactor

  // Peak systolic Ca2+ transient (uM): depends on SR content and RyR2 cluster release
  const basePeakCa = 1.10 // uM
  const effectiveRyr2 = hasLeak && !hasBb ? ryr2 * 0.75 : ryr2 // leak depletes SR store
  const peakCa = Number((Math.min(2.5, Math.max(0.25, basePeakCa * effectiveRyr2 * srLoad))).toFixed(2))

  // Diastolic resting Ca2+ (nM): normal ~95 nM. If RyR2 leaks or SERCA fails, diastolic Ca2+ rises
  const baseDiastolic = 95.0 // nM
  let diastolicElevation = (1.0 - effectiveSerca) * 45.0
  if (hasLeak) diastolicElevation += (hasBb ? 25.0 : 65.0)
  const diastolicCa = Number((Math.min(350.0, Math.max(60.0, baseDiastolic + diastolicElevation))).toFixed(1))

  // Calcium transient decay time constant (tau in ms): inversely proportional to effective SERCA
  // Faster decay = faster relaxation (positive lusitropy)
  const baseTau = 200.0 // ms
  const tau = Number((Math.min(650.0, Math.max(90.0, baseTau / effectiveSerca))).toFixed(1))

  // Fractional SERCA reuptake % (typically 70% in human ventricle, balance extruded by NCX1)
  const sercaFractionPct = Number((Math.min(85.0, Math.max(30.0, 70.0 * (effectiveSerca / 1.0)))).toFixed(1))

  // Arrhythmia risk tier: DADs (delayed afterdepolarizations) caused by spontaneous diastolic Ca2+ waves triggering NCX transient inward current (Iti)
  let arrhythmiaTier: 'LOW_HOMOGENEOUS_COUPLING' | 'MODERATE_AFTERDEPOLARIZATION_VULNERABILITY' | 'CRITICAL_CPVT_VENTRICULAR_TACHYCARDIA_TRIGGER' = 'LOW_HOMOGENEOUS_COUPLING'
  if (hasLeak && !hasBb && diastolicCa > 140.0) {
    arrhythmiaTier = 'CRITICAL_CPVT_VENTRICULAR_TACHYCARDIA_TRIGGER'
  } else if (hasLeak || diastolicCa > 130.0 || tau > 350.0) {
    arrhythmiaTier = 'MODERATE_AFTERDEPOLARIZATION_VULNERABILITY'
  } else {
    arrhythmiaTier = 'LOW_HOMOGENEOUS_COUPLING'
  }

  // Contractile force %: Hill equation of peak Ca2+ binding to Troponin C
  const forcePct = Number((Math.min(100.0, Math.max(10.0, (Math.pow(peakCa, 3) / (Math.pow(1.0, 3) + Math.pow(peakCa, 3))) * 100.0))).toFixed(1))

  // Lusitropic reserve score (0.0 - 1.0)
  const reserveScore = Number((Math.min(1.0, plnP * serca)).toFixed(3))

  return {
    peakSystolicCalciumMicromolar: peakCa,
    diastolicRestingCalciumNanomolar: diastolicCa,
    calciumTransientDecayTauMilliseconds: tau,
    fractionalSercaReuptakePercentage: sercaFractionPct,
    delayedAfterdepolarizationArrhythmiaRiskTier: arrhythmiaTier,
    sarcomericContractileForcePercentage: forcePct,
    betaAdrenergicLusitropicReserveScore: reserveScore,
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Bers 2002 Nature; Marks 2013 Physiol Rev; MacLennan & Kranias 2003 Nat Rev Mol Cell Biol',
    },
  }
}
