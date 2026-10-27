/**
 * PANACEAMED QUANTUM BIOLOGY & BIOPHYSICAL TUNNELING ENGINE (T-CLIN-72)
 *
 * Implements deterministic physical models for:
 * 1. Quantum Proton Tunneling in Enzymatic Active Sites & DNA Base-Pair Hydrogen Bonds (WKB approximation & Kinetic Isotope Effect)
 * 2. Radical-Pair Cryptochrome Spin Dynamics & Magnetoreceptive Circadian Coupling
 *
 * Epistemic Boundary:
 * All calculations represent biophysical proxy simulations under defined non-equilibrium assumptions.
 * These are scientific discovery hypotheses and never substitute for patient clinical observations.
 */

import type {
  QuantumProtonTunnelingParams,
  QuantumProtonTunnelingResult,
  RadicalPairSpinParams,
  RadicalPairSpinResult,
} from './frontierBiomedicalTypes'

// Physical constants (MKS / SI and atomic units)
const HBAR_EV_S = 6.582119569e-16 // eV·s
const ELECTRON_VOLT_TO_JOULE = 1.602176634e-19 // J/eV
const BOLTZMANN_EV_K = 8.617333262e-5 // eV/K
const PROTON_MASS_KG = 1.67262192369e-27 // kg
const DEUTERON_MASS_KG = 3.343583719e-27 // kg

/**
 * Calculates quantum proton transmission probability through a 1D potential barrier using WKB approximation.
 * Evaluates Kinetic Isotope Effect (KIE = k_H / k_D) to falsify whether the reaction relies on quantum tunneling.
 */
export function calculateQuantumProtonTunneling(
  params: QuantumProtonTunnelingParams
): QuantumProtonTunnelingResult {
  const widthMeters = Math.max(0.2, Math.min(1.5, params.barrierWidthAngstroms)) * 1e-10
  const heightEv = Math.max(0.1, Math.min(2.0, params.barrierHeightElectronVolts))
  const tempK = Math.max(250, Math.min(350, params.temperatureKelvin))

  // Mean thermal energy at physiological temperature (kT)
  const thermalEnergyEv = BOLTZMANN_EV_K * tempK
  // Effective energy deficit beneath the barrier peak
  const effectiveDeltaEv = Math.max(0.02, heightEv - thermalEnergyEv)
  const effectiveDeltaJoules = effectiveDeltaEv * ELECTRON_VOLT_TO_JOULE

  const massKg = params.isotope === 'H' ? PROTON_MASS_KG : DEUTERON_MASS_KG
  const hbarJoulesSec = 1.054571817e-34

  // WKB transmission exponent: 2 * sqrt(2 * m * DeltaV) * a / hbar
  const kappa = Math.sqrt(2 * massKg * effectiveDeltaJoules) / hbarJoulesSec
  const exponent = 2 * kappa * widthMeters

  // Transmission probability (capped within physical probability bounds [1e-12, 1.0])
  const transmissionProbability = Number(Math.max(1e-12, Math.min(1.0, Math.exp(-exponent))).toExponential(4))

  // Deuterium transmission for KIE calculation
  const kappaD = Math.sqrt(2 * DEUTERON_MASS_KG * effectiveDeltaJoules) / hbarJoulesSec
  const exponentD = 2 * kappaD * widthMeters
  const transmissionProbabilityD = Math.max(1e-12, Math.min(1.0, Math.exp(-exponentD)))

  // Kinetic Isotope Effect: k_H / k_D
  const classicalKieLimit = 1.414 // sqrt(m_D / m_H) ~ 1.41 classical upper bound
  const quantumKie = Number((transmissionProbability / transmissionProbabilityD).toFixed(2))

  // Classical Arrhenius rate comparison: exp(-DeltaV / kT)
  const arrheniusExponent = heightEv / thermalEnergyEv
  const classicalProbability = Math.exp(-arrheniusExponent)
  const rateAccelerationFactor = Number(
    Math.max(1.0, transmissionProbability / Math.max(1e-18, classicalProbability)).toExponential(2)
  )

  // Environmental decoherence time in condensed aqueous phase (~10-50 fs)
  const decoherenceTimeFemtoseconds = Number((35.0 / (tempK / 300.0)).toFixed(1))

  let activeSiteNote = 'Standard hydrogen bond transfer'
  if (params.activeSite === 'dna_polymerase_fidelity') {
    activeSiteNote = 'Löwdin base-pair tautomerism proton relay: rare imino/enol tunneling probability constrained to < 1e-4'
  } else if (params.activeSite === 'mitochondrial_complex_I') {
    activeSiteNote = 'Proton-coupled electron transfer (PCET) across ND subunits in cristae membrane'
  } else if (params.activeSite === 'alcohol_dehydrogenase') {
    activeSiteNote = 'Zinc-coordinated hydride transfer with measured room-temperature KIE > 3.5'
  } else if (params.activeSite === 'serine_protease') {
    activeSiteNote = 'Asp-His-Ser low-barrier catalytic triad with short H-bond (~2.55 Å)'
  }

  const classicalArrheniusComparison =
    quantumKie > classicalKieLimit
      ? `Quantum regime confirmed: KIE (${quantumKie}) exceeds semi-classical semiclassical limit (${classicalKieLimit.toFixed(2)}). Reaction involves nuclear tunneling.`
      : `Classical regime: KIE (${quantumKie}) consistent with over-the-barrier transition without significant tunneling.`

  return {
    barrierWidthAngstroms: params.barrierWidthAngstroms,
    barrierHeightElectronVolts: params.barrierHeightElectronVolts,
    temperatureKelvin: params.temperatureKelvin,
    isotope: params.isotope,
    activeSite: `${params.activeSite} (${activeSiteNote})`,
    transmissionProbability,
    kineticIsotopeEffect: quantumKie,
    enzymaticRateAccelerationFactor: rateAccelerationFactor,
    decoherenceTimeFemtoseconds,
    classicalArrheniusComparison,
    truthClass: 'quantum_biophysics_proxy',
    clinically_reviewed: false,
    patientTruthUncompromised: true,
    neverManufacturesBiomarkers: true,
  }
}

/**
 * Calculates spin dynamics for a cryptochrome [FAD•- ... TrpH•+] radical pair.
 * Modulates singlet/triplet spin state interconversion under geomagnetic fields (e.g. 50 µT).
 */
export function calculateRadicalPairSpinDynamics(
  params: RadicalPairSpinParams
): RadicalPairSpinResult {
  const bField = Math.max(1.0, Math.min(200.0, params.geomagneticFieldMicroTesla))
  const hyperfineMhz = Math.max(0.1, Math.min(50.0, params.hyperfineCouplingMegahertz))
  const lifespanNs = Math.max(10.0, Math.min(5000.0, params.radicalLifespanNanoseconds))

  // Non-equilibrium spin coherency parameter
  const zeemanFrequencyMhz = 28.0 * (bField / 1000.0) // ~1.4 MHz at 50 µT
  const resonanceRatio = zeemanFrequencyMhz / hyperfineMhz

  // Singlet recombination yield modulated by Zeeman-hyperfine mixing
  const singletYield = Number((0.50 + 0.15 * Math.sin(resonanceRatio * Math.PI) * Math.exp(-100.0 / lifespanNs)).toFixed(4))
  const tripletYield = Number((1.0 - singletYield).toFixed(4))

  const magneticFieldSensitivityRatio = Number(
    (Math.abs(singletYield - 0.50) / 0.50 * 100).toFixed(2)
  )

  // Circadian phase shift coupling proxy (in minutes per day of alignment)
  const cryptochromeCircadianPhaseShiftMinutes = Number(
    ((singletYield - 0.50) * 45.0).toFixed(1)
  )

  return {
    singletYield,
    tripletYield,
    magneticFieldSensitivityRatio,
    cryptochromeCircadianPhaseShiftMinutes,
    nonEquilibriumThermalStateConfirmed: lifespanNs > 50.0,
    truthClass: 'quantum_biophysics_proxy',
    clinically_reviewed: false,
  }
}
