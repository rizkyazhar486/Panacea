export function computeWiggersCardiacCyclePressure(timeMs: number, heartRateBpm = 75) {
  const cycleDurationMs = (60 / heartRateBpm) * 1000;
  const t = timeMs % cycleDurationMs;
  const phaseFraction = t / cycleDurationMs;

  // Mathematical phase approximation for Left Ventricular Pressure (mmHg)
  let lvPressureMmHg = 10;
  let phaseName = "DIASTOLIC_FILLING";

  if (phaseFraction < 0.15) {
    phaseName = "ATRIAL_SYSTOLE";
    lvPressureMmHg = 10 + Math.sin(phaseFraction * Math.PI * 6.66) * 15;
  } else if (phaseFraction < 0.22) {
    phaseName = "ISOVOLUMETRIC_CONTRACTION";
    lvPressureMmHg = 15 + (phaseFraction - 0.15) * 1200;
  } else if (phaseFraction < 0.45) {
    phaseName = "RAPID_EJECTION";
    lvPressureMmHg = 100 + Math.sin((phaseFraction - 0.22) * Math.PI * 4.34) * 25;
  } else if (phaseFraction < 0.55) {
    phaseName = "ISOVOLUMETRIC_RELAXATION";
    lvPressureMmHg = 120 - (phaseFraction - 0.45) * 1050;
  } else {
    phaseName = "DIASOLE_RELAXATION";
    lvPressureMmHg = 15 + Math.exp(-(phaseFraction - 0.55) * 8) * 15;
  }

  return {
    timeMs,
    phaseName,
    leftVentricularPressureMmHg: Math.max(5, Math.round(lvPressureMmHg)),
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

export function computeKroghCylinderOxygenDiffusion(params: {
  readonly capillaryPo2MmHg: number;
  readonly tissueRadiusMicrons: number;
  readonly KroghDiffusionCoefficientK: number;
  readonly oxygenConsumptionRateMmolSec: number;
}) {
  const r = Math.max(1, params.tissueRadiusMicrons);
  const p0 = Math.max(10, params.capillaryPo2MmHg);
  const m = params.oxygenConsumptionRateMmolSec;
  const k = params.KroghDiffusionCoefficientK;

  // Krogh cylinder steady-state radial PO2 distribution model
  const tissuePo2MmHg = Number(Math.max(0, p0 - (m / (4 * k)) * (r * r * Math.log(r / 5)) ).toFixed(2));

  return {
    model: "KROGH_CYLINDER_OXYGEN_DIFFUSION" as const,
    tissuePo2MmHg,
    hypoxiaDetected: tissuePo2MmHg < 15,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}