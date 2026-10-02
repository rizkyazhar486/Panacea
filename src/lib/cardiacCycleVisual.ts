export interface CardiacCycleVisualState {
  hr: number
  periodSec: number
  systoleSec: number
  phaseSec: number
  phase01: number
  systolicPulse: number
  diastolicPulse: number
  atrialKick: number
  avValvesOpen: boolean
  semilunarValvesOpen: boolean
}

function clampHr(hr: number): number {
  if (!Number.isFinite(hr)) return 72
  return Math.min(220, Math.max(30, hr))
}

function pulse01(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return Math.sin(Math.PI * t)
}

/**
 * Deterministic educational timing envelope for the 3D heart render.
 *
 * This deliberately drives only visual state. It is not an ECG model, pressure
 * trace, patient monitor, valve-area model, or haemodynamic estimator.
 * Systolic duration uses the same bounded approximation already used by the
 * Body Exposure pulsatile-flow engine so blood particles and valve/chamber
 * emphasis remain synchronized rather than becoming two unrelated animations.
 */
export function cardiacCycleVisualState(timeSec: number, hrInput: number): CardiacCycleVisualState {
  const hr = clampHr(hrInput)
  const periodSec = 60 / hr
  const systoleSec = Math.min(periodSec * 0.8, 0.35 * Math.sqrt(periodSec))
  const raw = Number.isFinite(timeSec) ? timeSec : 0
  const phaseSec = ((raw % periodSec) + periodSec) % periodSec
  const phase01 = phaseSec / periodSec

  const systolicPulse = phaseSec <= systoleSec
    ? pulse01(phaseSec / Math.max(systoleSec, 1e-6))
    : 0

  const diastoleSec = Math.max(periodSec - systoleSec, 1e-6)
  const diastolicPhase = phaseSec > systoleSec ? (phaseSec - systoleSec) / diastoleSec : 0
  const diastolicPulse = phaseSec > systoleSec ? pulse01(diastolicPhase) : 0

  // Atrial contraction is shown only at the end of diastole. The envelope is
  // intentionally approximate and visual: it must never be interpreted as an
  // atrial pressure or volume trace.
  const atrialKickStart = systoleSec + diastoleSec * 0.78
  const atrialKick = phaseSec >= atrialKickStart
    ? pulse01((phaseSec - atrialKickStart) / Math.max(periodSec - atrialKickStart, 1e-6))
    : 0

  return {
    hr,
    periodSec,
    systoleSec,
    phaseSec,
    phase01,
    systolicPulse,
    diastolicPulse,
    atrialKick,
    avValvesOpen: phaseSec > systoleSec,
    semilunarValvesOpen: phaseSec <= systoleSec,
  }
}
