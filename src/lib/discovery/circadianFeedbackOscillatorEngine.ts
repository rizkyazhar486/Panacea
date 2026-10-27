// src/lib/discovery/circadianFeedbackOscillatorEngine.ts
// T-CLIN-103: Circadian Molecular Clock TTFL Feedback Loop & Chronopharmacology Window Engine

export interface CircadianClockInput {
  zeitgeberTimeHours: number // ZT 0 = lights on / subjective dawn; ZT 12 = lights off / subjective dusk (0.0 to 24.0)
  bmal1ClockPromoterActivationRatio?: number // 0.2 - 2.0 (E-box transcriptional driver)
  ck1PhosphorylationEfficiencyRatio?: number // Casein Kinase 1 activity (regulates PER degradation rate)
  revErbNuclearRepressionRatio?: number // auxiliary RORE repressor loop (0.1 - 2.0)
  intendedMedicationAdministrationZtHours?: number // planned drug dosing time
  pharmacologicTargetClass?: 'HMG_COA_REDUCTASE_STATIN' | 'ANTIHYPERTENSIVE_RAAS' | 'CORTICOSTEROID_ANTI_INFLAMMATORY' | 'CHEMOTHERAPY_CELL_CYCLE'
}

export interface CircadianOscillationEvaluation {
  zeitgeberTimeHours: number
  circadianCyclePhase: 'ZT00_06_EARLY_DAY_WAKEFUL' | 'ZT06_12_LATE_DAY_METABOLIC_PEAK' | 'ZT12_18_EARLY_NIGHT_RECOVERY' | 'ZT18_24_LATE_NIGHT_ORGAN_RESTORATION'
  endogenousPeriodHours: number // tau (~24.2 h baseline)
  molecularAbundances: {
    bmal1ClockHeterodimerActivity: number // E-box binding proxy (0.0 - 1.0)
    perCryRepressorComplexAbundance: number // negative arm accumulation (0.0 - 1.0)
    revErbRepressionIntensity: number // RORE suppression (0.0 - 1.0)
  }
  chronopharmacologyGuidance: {
    targetClass: string
    optimalAdministrationWindowZt: string
    circadianEfficacyMultiplier: number // 0.5 to 1.8 (amplified benefit when dosed in window)
    adverseToxicityAttenuationFactor: number // 0.0 - 1.0 (reduction in off-target toxicity)
    timingRecommendationNote: string
  }
  metadata: {
    truthClass: 'mechanistic_simulation_proxy'
    clinically_reviewed: false
    neverManufacturesBiomarkers: true
    referenceBasis: 'Takahashi 2017 Nat Rev Genet; Cederroth et al. 2019 Nat Med'
  }
}

/**
 * Simulates mammalian core TTFL circadian rhythm dynamics, E-box/RORE oscillatory kinetics, and optimal chronopharmacology dosing windows.
 */
export function evaluateCircadianMolecularDynamics(input: CircadianClockInput): CircadianOscillationEvaluation {
  const zt = ((input.zeitgeberTimeHours % 24.0) + 24.0) % 24.0
  const bmalBase = Math.max(0.1, input.bmal1ClockPromoterActivationRatio ?? 1.0)
  const ck1 = Math.max(0.2, input.ck1PhosphorylationEfficiencyRatio ?? 1.0)
  const revErb = Math.max(0.1, input.revErbNuclearRepressionRatio ?? 1.0)
  const doseZt = input.intendedMedicationAdministrationZtHours !== undefined
    ? ((input.intendedMedicationAdministrationZtHours % 24.0) + 24.0) % 24.0
    : zt
  const target = input.pharmacologicTargetClass ?? 'HMG_COA_REDUCTASE_STATIN'

  // Mathematical limit-cycle approximation of the primary negative feedback loop
  // BMAL1:CLOCK peaks around ZT 0-4; PER:CRY peaks in nucleus around ZT 12-16
  const theta = (zt / 24.0) * 2.0 * Math.PI
  const bmalAct = Number((Math.min(1.0, Math.max(0.05, 0.5 + 0.45 * Math.cos(theta) * bmalBase))).toFixed(3))
  const perCry = Number((Math.min(1.0, Math.max(0.05, 0.5 - 0.42 * Math.cos(theta - 0.5) * (1.2 / ck1)))).toFixed(3))
  const revErbAct = Number((Math.min(1.0, Math.max(0.05, 0.5 + 0.40 * Math.sin(theta) * revErb))).toFixed(3))

  // Endogenous period tau: altered by CK1 activity (loss of CK1 prolongs tau; hyperactive CK1 shortens tau)
  const tauHours = Number((24.2 + (1.0 - ck1) * 2.5).toFixed(2))

  // Phase classification
  let phase: 'ZT00_06_EARLY_DAY_WAKEFUL' | 'ZT06_12_LATE_DAY_METABOLIC_PEAK' | 'ZT12_18_EARLY_NIGHT_RECOVERY' | 'ZT18_24_LATE_NIGHT_ORGAN_RESTORATION' = 'ZT00_06_EARLY_DAY_WAKEFUL'
  if (zt < 6.0) {
    phase = 'ZT00_06_EARLY_DAY_WAKEFUL'
  } else if (zt < 12.0) {
    phase = 'ZT06_12_LATE_DAY_METABOLIC_PEAK'
  } else if (zt < 18.0) {
    phase = 'ZT12_18_EARLY_NIGHT_RECOVERY'
  } else {
    phase = 'ZT18_24_LATE_NIGHT_ORGAN_RESTORATION'
  }

  // Chronopharmacology profiles
  let optWindow = 'ZT 12 - ZT 14 (Evening)'
  let optCenter = 13.0
  let note = 'Hepatic cholesterol synthesis peaks nocturnally; evening administration maximizes efficacy.'

  switch (target) {
    case 'HMG_COA_REDUCTASE_STATIN':
      optWindow = 'ZT 12 - ZT 14 (Evening / Bedtime)'
      optCenter = 13.0
      note = 'Hepatic HMG-CoA reductase expression peaks during subjective night; evening dosing maximizes LDL reduction.'
      break

    case 'ANTIHYPERTENSIVE_RAAS':
      optWindow = 'ZT 22 - ZT 02 (Early Morning / Pre-Awakening)'
      optCenter = 23.5
      note = 'Blunts the morning blood pressure surge and sympathetic activation, reducing morning stroke and MI risk.'
      break

    case 'CORTICOSTEROID_ANTI_INFLAMMATORY':
      optWindow = 'ZT 00 - ZT 02 (Immediate Morning Awakening)'
      optCenter = 1.0
      note = 'Synchronizes with physiological cortisol acrophase, minimizing hypothalamic-pituitary-adrenal (HPA) axis suppression.'
      break

    case 'CHEMOTHERAPY_CELL_CYCLE':
      optWindow = 'ZT 08 - ZT 11 (Late Afternoon)'
      optCenter = 9.5
      note = 'Targets tumor mitotic peak while normal bone marrow and mucosal cells reside in protected G0/G1 resting state.'
      break
  }

  // Calculate efficacy multiplier based on angular distance between dose time and optimal window center
  const diffHours = Math.min(Math.abs(doseZt - optCenter), 24.0 - Math.abs(doseZt - optCenter))
  const multiplier = Number((Math.max(0.65, 1.65 - (diffHours / 12.0) * 0.9)).toFixed(2))
  const toxicityAttenuation = Number((Math.max(0.15, 0.85 - (diffHours / 12.0) * 0.65)).toFixed(2))

  return {
    zeitgeberTimeHours: zt,
    circadianCyclePhase: phase,
    endogenousPeriodHours: tauHours,
    molecularAbundances: {
      bmal1ClockHeterodimerActivity: bmalAct,
      perCryRepressorComplexAbundance: perCry,
      revErbRepressionIntensity: revErbAct,
    },
    chronopharmacologyGuidance: {
      targetClass: target,
      optimalAdministrationWindowZt: optWindow,
      circadianEfficacyMultiplier: multiplier,
      adverseToxicityAttenuationFactor: toxicityAttenuation,
      timingRecommendationNote: note,
    },
    metadata: {
      truthClass: 'mechanistic_simulation_proxy',
      clinically_reviewed: false,
      neverManufacturesBiomarkers: true,
      referenceBasis: 'Takahashi 2017 Nat Rev Genet; Cederroth et al. 2019 Nat Med',
    },
  }
}
