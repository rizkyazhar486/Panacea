/**
 * Life–Body–Environment Convergence & Multiorgan VV-ECMO Coupler.
 *
 * Pure, deterministic mechanistic model (zero network calls, zero React, zero
 * impure globals). Reuses canonical PanaceaMed alveolar gas (`gasAlveolar`),
 * Severinghaus/ELSO oxygen transport (`ecmo/oksigen`), and steady-state VV-ECMO
 * (`ecmo/mesin`) equations so altitude, barometric pressure, heat/humidity
 * wet-bulb thermoregulation, PM2.5 airway load, and UV photobiology all run on
 * ONE consistent physiological truth base.
 *
 * Epistemic boundary: MECHANISTIC_EDUCATIONAL_SIMULATION (not clinical advice
 * or certified medical/navigation instrumentation).
 */

import { tekananAlveolar, tekananBarometrik, tekananInspirasi, TETAPAN_GAS } from '../../../lib/gasAlveolar'
import { simulasiVV, type KeadaanVV } from '../../../lib/ecmo/mesin'
import { hantaranO2, kandunganO2, saturasiDariPO2 } from '../../../lib/ecmo/oksigen'

export interface EnvironmentPhysiologyInput {
  /** Ambient dry-bulb temperature in Celsius (-20..55). */
  readonly ambientTempC: number
  /** Ambient relative humidity in percent (5..100). */
  readonly relativeHumidityPct: number
  /** Ambient fine particulate matter PM2.5 in ug/m3 (0..500). */
  readonly pm25UgM3: number
  /** Solar UV index (0..15). */
  readonly uvIndex: number
  /** Elevation above mean sea level in meters (0..6000). */
  readonly altitudeM: number
  /** Hemoglobin concentration in g/dL (6..20, default 14.2). */
  readonly hbGdl?: number
  /** Resting/active cardiac output in L/min (2.5..25, default 5.2). */
  readonly cardiacOutputLMin?: number
  /** Arterial PaCO2 in mmHg (20..80, default 40). */
  readonly paco2MmHg?: number
  /** Inspired oxygen fraction (0.21..1.0, default 0.21). */
  readonly fio2?: number
  /** Alveolar-arterial oxygen gradient assumption in mmHg (4..60, default 10). */
  readonly aaGradientMmHg?: number
  /** Metabolic activity intensity in METs (1..16, default 1.5). */
  readonly exertionMet?: number
  /** Resting heart rate baseline in bpm (35..130, default 68). */
  readonly restingHrBpm?: number
  /** Optional VV-ECMO circuit parameters for educational multiorgan coupling. */
  readonly ecmoFlowLMin?: number
  readonly ecmoSweepLMin?: number
  readonly ecmoShuntFraction?: number
}

export type HeatStrainTier = 'OPTIMAL' | 'CAUTION' | 'HIGH_STRAIN' | 'CRITICAL_HYPERTHERMIA'
export type AirQualityTier = 'GOOD' | 'MODERATE' | 'UNHEALTHY_SENSITIVE' | 'UNHEALTHY' | 'HAZARDOUS'
export type AltitudeHypoxiaTier = 'NORMOBARIC' | 'MILD_HYPOBARIA' | 'MODERATE_HYPOXIA' | 'HIGH_ALTITUDE_HYPOXIA'
export type UvRiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME'

export interface EnvironmentEcmoCouplingSummary {
  readonly status: KeadaanVV['status']
  readonly barometricMmHg: number
  readonly sao2Pct: number
  readonly svo2Pct: number
  readonly do2MlMin: number
  readonly vo2EcmoMlMin: number
  readonly recirculationPct: number
  readonly paco2MmHg: number
  readonly ph: number
}

export interface EnvironmentPhysiologyReport {
  readonly epistemicClass: 'MECHANISTIC_EDUCATIONAL_SIMULATION'
  readonly notClinicalAdvice: true
  readonly sanitizedInput: {
    readonly ambientTempC: number
    readonly relativeHumidityPct: number
    readonly pm25UgM3: number
    readonly uvIndex: number
    readonly altitudeM: number
    readonly hbGdl: number
    readonly cardiacOutputLMin: number
    readonly paco2MmHg: number
    readonly fio2: number
    readonly aaGradientMmHg: number
    readonly exertionMet: number
    readonly restingHrBpm: number
  }
  readonly atmosphere: {
    readonly barometricMmHg: number
    readonly pio2MmHg: number
    readonly pao2AlveolarMmHg: number
    readonly pao2ArterialEstMmHg: number
    readonly sao2EstPct: number
    readonly cao2MlDl: number
    readonly do2MlMin: number
    readonly hypoxiaTier: AltitudeHypoxiaTier
  }
  readonly thermoregulation: {
    readonly wetBulbTempC: number
    readonly apparentHeatIndexC: number
    readonly sweatRateLPerHr: number
    readonly fluidReplacementMlPerHr: number
    readonly cardiovascularThermalDriftBpm: number
    readonly estimatedHrBpm: number
    readonly heatStrainTier: HeatStrainTier
  }
  readonly airway: {
    readonly pm25UgM3: number
    readonly estimatedUsAqi: number
    readonly airQualityTier: AirQualityTier
    readonly airwayResistanceMultiplier: number
    readonly outdoorExertionFactor: number
    readonly respiratorGuidance: 'NONE' | 'SENSITIVE_GROUPS' | 'N95_OUTDOOR' | 'INDOOR_HEPA'
  }
  readonly photobiology: {
    readonly uvIndex: number
    readonly uvRiskTier: UvRiskTier
    readonly vitaminDSynthesisWindowMin: number
    readonly photoprotectionRequired: boolean
  }
  readonly ecmoBridge: EnvironmentEcmoCouplingSummary
  readonly compositeEnvironmentalLoadPct: number
  readonly modelAssumptions: readonly string[]
}

function clampFinite(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, value))
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Stull (2011) empirical wet-bulb temperature approximation (valid -20..50 C, 5..99% RH).
 */
export function computeWetBulbTempC(tempC: number, rhPct: number): number {
  const t = clampFinite(tempC, 24, -20, 55)
  const rh = clampFinite(rhPct, 50, 5, 100)
  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  )
}

/**
 * Rothfusz / NWS apparent heat index in Celsius when T >= 27 C & RH >= 40%, else dry-bulb T.
 */
export function computeHeatIndexC(tempC: number, rhPct: number): number {
  const t = clampFinite(tempC, 24, -20, 55)
  const rh = clampFinite(rhPct, 50, 5, 100)
  if (t < 27 || rh < 40) return t
  const tf = (t * 9) / 5 + 32
  const hiF =
    -42.379 +
    2.04901523 * tf +
    10.14333127 * rh -
    0.22475541 * tf * rh -
    0.00683783 * tf * tf -
    0.05481717 * rh * rh +
    0.00122874 * tf * tf * rh +
    0.00085282 * tf * rh * rh -
    0.00000199 * tf * tf * rh * rh
  return ((hiF - 32) * 5) / 9
}

/**
 * Piecewise linear US-EPA PM2.5 -> AQI breakpoint conversion (2024 revision).
 */
export function pm25ToUsAqi(pm25UgM3: number): number {
  const pm = clampFinite(pm25UgM3, 12, 0, 500)
  const bands: ReadonlyArray<readonly [number, number, number, number]> = [
    [0.0, 9.0, 0, 50],
    [9.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 125.4, 151, 200],
    [125.5, 225.4, 201, 300],
    [225.5, 500.0, 301, 500],
  ]
  for (const [cLo, cHi, iLo, iHi] of bands) {
    if (pm <= cHi) {
      const span = Math.max(0.1, cHi - cLo)
      return Math.round(((iHi - iLo) / span) * Math.max(0, pm - cLo) + iLo)
    }
  }
  return 500
}

export function coupleEnvironmentToPhysiology(input: EnvironmentPhysiologyInput): EnvironmentPhysiologyReport {
  const ambientTempC = clampFinite(input.ambientTempC, 26, -20, 55)
  const relativeHumidityPct = clampFinite(input.relativeHumidityPct, 55, 5, 100)
  const pm25UgM3 = clampFinite(input.pm25UgM3, 18, 0, 500)
  const uvIndex = clampFinite(input.uvIndex, 5, 0, 15)
  const altitudeM = clampFinite(input.altitudeM, 0, 0, 6000)
  const hbGdl = clampFinite(input.hbGdl, 14.2, 6, 20)
  const cardiacOutputLMin = clampFinite(input.cardiacOutputLMin, 5.2, 2.5, 25)
  const paco2MmHg = clampFinite(input.paco2MmHg, 40, 20, 80)
  const fio2 = clampFinite(input.fio2, 0.21, 0.21, 1.0)
  const aaGradientMmHg = clampFinite(input.aaGradientMmHg, 10, 4, 60)
  const exertionMet = clampFinite(input.exertionMet, 1.5, 1, 16)
  const restingHrBpm = clampFinite(input.restingHrBpm, 68, 35, 130)
  const ecmoFlowLMin = clampFinite(input.ecmoFlowLMin, 4.0, 0.5, 7.0)
  const ecmoSweepLMin = clampFinite(input.ecmoSweepLMin, 3.0, 0.5, 10.0)
  const ecmoShuntFraction = clampFinite(input.ecmoShuntFraction, 0.65, 0.1, 0.98)

  // 1. Atmosphere & Oxygen Transport (reusing canonical gasAlveolar + ecmo/oksigen)
  const barometricMmHg = tekananBarometrik(altitudeM)
  const pio2MmHg = tekananInspirasi(fio2, barometricMmHg)
  const pao2AlveolarMmHg = tekananAlveolar({
    fio2,
    paco2: paco2MmHg,
    patm: barometricMmHg,
    r: TETAPAN_GAS.R_LAZIM,
  })
  const pao2ArterialEstMmHg = Math.max(20, pao2AlveolarMmHg - aaGradientMmHg)
  const sao2Fraction = saturasiDariPO2(pao2ArterialEstMmHg)
  const cao2MlDl = kandunganO2(hbGdl, sao2Fraction, pao2ArterialEstMmHg)
  const do2MlMin = hantaranO2(cardiacOutputLMin, cao2MlDl)
  const sao2EstPct = sao2Fraction * 100

  let hypoxiaTier: AltitudeHypoxiaTier = 'NORMOBARIC'
  if (sao2EstPct < 82 || altitudeM >= 3500) hypoxiaTier = 'HIGH_ALTITUDE_HYPOXIA'
  else if (sao2EstPct < 90 || altitudeM >= 2200) hypoxiaTier = 'MODERATE_HYPOXIA'
  else if (sao2EstPct < 95 || altitudeM >= 1200) hypoxiaTier = 'MILD_HYPOBARIA'

  // 2. Thermoregulation & Wet-Bulb Fluid Balance
  const wetBulbTempC = computeWetBulbTempC(ambientTempC, relativeHumidityPct)
  const apparentHeatIndexC = computeHeatIndexC(ambientTempC, relativeHumidityPct)
  const thermalDrive = Math.max(0, apparentHeatIndexC - 21)
  const humidityInhibition = relativeHumidityPct > 75 ? 1 + (relativeHumidityPct - 75) * 0.008 : 1
  const sweatRateLPerHr = Math.min(2.6, Math.max(0.08, (0.08 + thermalDrive * 0.042 + (exertionMet - 1) * 0.11) * humidityInhibition))
  const fluidReplacementMlPerHr = Math.round(sweatRateLPerHr * 1000 * 0.85)
  const cardiovascularThermalDriftBpm = Math.round(
    Math.max(0, (wetBulbTempC - 20) * 1.45) + Math.max(0, (exertionMet - 1) * 7.5),
  )
  const estimatedHrBpm = Math.min(200, Math.round(restingHrBpm + cardiovascularThermalDriftBpm))

  let heatStrainTier: HeatStrainTier = 'OPTIMAL'
  if (wetBulbTempC >= 31 || apparentHeatIndexC >= 41) heatStrainTier = 'CRITICAL_HYPERTHERMIA'
  else if (wetBulbTempC >= 27.5 || apparentHeatIndexC >= 35) heatStrainTier = 'HIGH_STRAIN'
  else if (wetBulbTempC >= 24 || apparentHeatIndexC >= 29) heatStrainTier = 'CAUTION'

  // 3. Airway PM2.5 Particulate Load
  const estimatedUsAqi = pm25ToUsAqi(pm25UgM3)
  let airQualityTier: AirQualityTier = 'GOOD'
  let respiratorGuidance: EnvironmentPhysiologyReport['airway']['respiratorGuidance'] = 'NONE'
  if (pm25UgM3 > 150) {
    airQualityTier = 'HAZARDOUS'
    respiratorGuidance = 'INDOOR_HEPA'
  } else if (pm25UgM3 > 55.4) {
    airQualityTier = 'UNHEALTHY'
    respiratorGuidance = 'N95_OUTDOOR'
  } else if (pm25UgM3 > 35.4) {
    airQualityTier = 'UNHEALTHY_SENSITIVE'
    respiratorGuidance = 'SENSITIVE_GROUPS'
  } else if (pm25UgM3 > 9.0) {
    airQualityTier = 'MODERATE'
  }
  const airwayResistanceMultiplier = round(1 + Math.min(0.65, (pm25UgM3 / 250) * 0.45), 2)
  const outdoorExertionFactor = round(Math.max(0.25, 1 - Math.max(0, pm25UgM3 - 12) / 220), 2)

  // 4. UV Photobiology
  let uvRiskTier: UvRiskTier = 'LOW'
  if (uvIndex >= 11) uvRiskTier = 'EXTREME'
  else if (uvIndex >= 8) uvRiskTier = 'VERY_HIGH'
  else if (uvIndex >= 6) uvRiskTier = 'HIGH'
  else if (uvIndex >= 3) uvRiskTier = 'MODERATE'
  const vitaminDSynthesisWindowMin = uvIndex < 1 ? 0 : Math.max(6, Math.min(45, Math.round(75 / Math.max(1.5, uvIndex))))
  const photoprotectionRequired = uvIndex >= 3

  // 5. Multiorgan VV-ECMO Altitude & Hypoxia Bridge (reusing canonical simulasiVV)
  const ecmoState = simulasiVV(
    {
      co: Math.max(3.5, Math.min(9.0, cardiacOutputLMin)),
      qEcmo: ecmoFlowLMin,
      jarakKanulaCm: 15,
      hb: hbGdl,
      vo2: Math.round(250 * Math.min(2.0, 0.7 + exertionMet * 0.2)),
      shunt: ecmoShuntFraction,
      fio2: Math.max(0.3, fio2),
      va: 1.5,
      hco3: 24,
      fdo2: 1.0,
      sweep: ecmoSweepLMin,
      fungsiMembran: 0.95,
    },
    barometricMmHg,
  )

  const ecmoBridge: EnvironmentEcmoCouplingSummary = {
    status: ecmoState.status,
    barometricMmHg: round(barometricMmHg, 1),
    sao2Pct: Number.isFinite(ecmoState.sao2) ? round(ecmoState.sao2 * 100, 1) : 0,
    svo2Pct: Number.isFinite(ecmoState.svo2) ? round(ecmoState.svo2 * 100, 1) : 0,
    do2MlMin: Number.isFinite(ecmoState.do2) ? Math.round(ecmoState.do2) : 0,
    vo2EcmoMlMin: Number.isFinite(ecmoState.vo2Ecmo) ? Math.round(ecmoState.vo2Ecmo) : 0,
    recirculationPct: Number.isFinite(ecmoState.resirkulasi) ? round(ecmoState.resirkulasi * 100, 1) : 0,
    paco2MmHg: Number.isFinite(ecmoState.co2.paco2) ? round(ecmoState.co2.paco2, 1) : 40,
    ph: Number.isFinite(ecmoState.co2.ph) ? round(ecmoState.co2.ph, 2) : 7.4,
  }

  // Composite planetary stress index (0..100)
  const heatLoad = Math.min(100, Math.max(0, (wetBulbTempC - 18) * 6.5))
  const airLoad = Math.min(100, (estimatedUsAqi / 300) * 100)
  const hypoxiaLoad = Math.min(100, Math.max(0, (98 - sao2EstPct) * 5.2))
  const uvLoad = Math.min(100, (uvIndex / 12) * 100)
  const compositeEnvironmentalLoadPct = Math.round(heatLoad * 0.35 + airLoad * 0.3 + hypoxiaLoad * 0.2 + uvLoad * 0.15)

  return {
    epistemicClass: 'MECHANISTIC_EDUCATIONAL_SIMULATION',
    notClinicalAdvice: true,
    sanitizedInput: {
      ambientTempC,
      relativeHumidityPct,
      pm25UgM3,
      uvIndex,
      altitudeM,
      hbGdl,
      cardiacOutputLMin,
      paco2MmHg,
      fio2,
      aaGradientMmHg,
      exertionMet,
      restingHrBpm,
    },
    atmosphere: {
      barometricMmHg: round(barometricMmHg, 1),
      pio2MmHg: round(pio2MmHg, 1),
      pao2AlveolarMmHg: round(pao2AlveolarMmHg, 1),
      pao2ArterialEstMmHg: round(pao2ArterialEstMmHg, 1),
      sao2EstPct: round(sao2EstPct, 1),
      cao2MlDl: round(cao2MlDl, 2),
      do2MlMin: Math.round(do2MlMin),
      hypoxiaTier,
    },
    thermoregulation: {
      wetBulbTempC: round(wetBulbTempC, 1),
      apparentHeatIndexC: round(apparentHeatIndexC, 1),
      sweatRateLPerHr: round(sweatRateLPerHr, 2),
      fluidReplacementMlPerHr,
      cardiovascularThermalDriftBpm,
      estimatedHrBpm,
      heatStrainTier,
    },
    airway: {
      pm25UgM3: round(pm25UgM3, 1),
      estimatedUsAqi,
      airQualityTier,
      airwayResistanceMultiplier,
      outdoorExertionFactor,
      respiratorGuidance,
    },
    photobiology: {
      uvIndex: round(uvIndex, 1),
      uvRiskTier,
      vitaminDSynthesisWindowMin,
      photoprotectionRequired,
    },
    ecmoBridge,
    compositeEnvironmentalLoadPct,
    modelAssumptions: [
      'Standard atmosphere barometric pressure + alveolar gas equation (RQ=0.8, PH2O=47 mmHg) + Severinghaus O2 dissociation curve.',
      'Stull (2011) wet-bulb and NWS Rothfusz apparent heat index approximations; individual acclimatization varies.',
      'VV-ECMO mass-balance bridge uses steady-state ELSO equations for educational simulation only — never clinical titration.',
    ],
  }
}
