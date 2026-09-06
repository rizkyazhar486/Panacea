/**
 * Deterministic microphysiology helpers used by the visual physiology explorer.
 * Values are educational calculations from user-entered reference inputs;
 * they are not patient measurements unless the caller supplies validated data.
 */

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, finite(value, min)))
}

/**
 * Arterial/venous oxygen content in mL O2/dL.
 * C_O2 = 1.34 * Hb * S_O2 + 0.003 * P_O2
 * Hb: g/dL, saturation: %, partial pressure: mmHg.
 */
export function oxygenContent(hb: number, saturationPct: number, partialPressureMmHg: number) {
  const safeHb = Math.max(0, finite(hb))
  const saturation = clamp(saturationPct, 0, 100) / 100
  const partialPressure = Math.max(0, finite(partialPressureMmHg))
  return 1.34 * safeHb * saturation + 0.003 * partialPressure
}

/**
 * Fick oxygen consumption in mL O2/min.
 * VO2 = Q * (CaO2 - CvO2), with conversion 10 dL/L.
 */
export function fickOxygenConsumption(cardiacOutputLMin: number, caO2MlDl: number, cvO2MlDl: number) {
  const q = Math.max(0, finite(cardiacOutputLMin))
  const extraction = Math.max(0, finite(caO2MlDl) - finite(cvO2MlDl))
  return q * 10 * extraction
}

/**
 * Nernst equilibrium potential in mV.
 * E = (R*T)/(z*F) * ln([out]/[in])
 */
export function nernstPotentialMv(
  extracellular: number,
  intracellular: number,
  valence = 1,
  temperatureC = 37,
) {
  const out = Math.max(1e-9, finite(extracellular, 1e-9))
  const inside = Math.max(1e-9, finite(intracellular, 1e-9))
  const z = finite(valence, 1) || 1
  const kelvin = Math.max(1, finite(temperatureC, 37) + 273.15)
  const R = 8.314462618
  const F = 96485.33212
  return ((R * kelvin) / (z * F)) * Math.log(out / inside) * 1000
}

/** Henderson-Hasselbalch estimate for the bicarbonate buffer system. */
export function bicarbonatePH(hco3MmolL: number, paCO2MmHg: number) {
  const hco3 = Math.max(1e-9, finite(hco3MmolL, 24))
  const paCO2 = Math.max(1e-9, finite(paCO2MmHg, 40))
  return 6.1 + Math.log10(hco3 / (0.03 * paCO2))
}

/** Cardiac-cycle duration in seconds. */
export function cardiacCycleSeconds(heartRateBpm: number) {
  const hr = Math.max(1e-9, finite(heartRateBpm, 60))
  return 60 / hr
}

/** Ejection fraction as percentage. */
export function ejectionFraction(edvMl: number, esvMl: number) {
  const edv = Math.max(1e-9, finite(edvMl))
  const esv = clamp(esvMl, 0, edv)
  return ((edv - esv) / edv) * 100
}

export type PhysiologyInputs = {
  hb: number
  saO2: number
  paO2: number
  svO2: number
  pvO2: number
  cardiacOutput: number
  potassiumOutside: number
  potassiumInside: number
  temperatureC: number
  bicarbonate: number
  paCO2: number
}

export function physiologySnapshot(input: PhysiologyInputs) {
  const caO2 = oxygenContent(input.hb, input.saO2, input.paO2)
  const cvO2 = oxygenContent(input.hb, input.svO2, input.pvO2)
  return {
    caO2,
    cvO2,
    extraction: Math.max(0, caO2 - cvO2),
    vo2: fickOxygenConsumption(input.cardiacOutput, caO2, cvO2),
    kNernst: nernstPotentialMv(input.potassiumOutside, input.potassiumInside, 1, input.temperatureC),
    pH: bicarbonatePH(input.bicarbonate, input.paCO2),
  }
}
