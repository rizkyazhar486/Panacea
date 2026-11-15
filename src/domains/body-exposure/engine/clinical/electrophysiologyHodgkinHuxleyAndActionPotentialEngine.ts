export type VaughanWilliamsClass = "NONE" | "CLASS_I_NA_BLOCKER" | "CLASS_II_BETA_BLOCKER" | "CLASS_III_K_BLOCKER" | "CLASS_IV_CA_BLOCKER";

export interface GhkAndActionPotentialInput {
  readonly permeabilityPK: number;
  readonly permeabilityPNa: number;
  readonly permeabilityPCl: number;
  readonly extracellularKMmolL: number;
  readonly intracellularKMmolL: number;
  readonly extracellularNaMmolL: number;
  readonly intracellularNaMmolL: number;
  readonly extracellularClMmolL: number;
  readonly intracellularClMmolL: number;
  readonly antiarrhythmicAgentClass?: VaughanWilliamsClass;
}

// Goldman-Hodgkin-Katz Voltage Equation at 37°C (RT/F = 26.71 mV)
export function simulateGoldmanHodgkinKatzAndCardiacActionPotential(input: GhkAndActionPotentialInput) {
  if (input.extracellularKMmolL <= 0 || input.intracellularKMmolL <= 0) {
    throw new RangeError("Ion concentrations must be positive finite numbers.");
  }
  const numerator =
    input.permeabilityPK * input.extracellularKMmolL +
    input.permeabilityPNa * input.extracellularNaMmolL +
    input.permeabilityPCl * input.intracellularClMmolL;
  const denominator =
    input.permeabilityPK * input.intracellularKMmolL +
    input.permeabilityPNa * input.intracellularNaMmolL +
    input.permeabilityPCl * input.extracellularClMmolL;

  const restingMembranePotentialVmMv = Number((26.71 * Math.log(numerator / Math.max(1e-6, denominator))).toFixed(2));
  const drugClass = input.antiarrhythmicAgentClass ?? "NONE";

  const baseUpstrokeDvDtMaxVPerSec = drugClass === "CLASS_I_NA_BLOCKER" ? 145 : 240;
  const baseApd90Ms = drugClass === "CLASS_III_K_BLOCKER" ? 365 : drugClass === "CLASS_IV_CA_BLOCKER" ? 255 : 290;
  const effectiveRefractoryPeriodErpMs = Math.round(baseApd90Ms * (drugClass === "CLASS_III_K_BLOCKER" ? 0.92 : 0.85));
  const saNodePacemakerSlopeMvPerSec = drugClass === "CLASS_II_BETA_BLOCKER" || drugClass === "CLASS_IV_CA_BLOCKER" ? 28 : 42;

  return {
    restingMembranePotentialVmMv,
    phase0UpstrokeVelocityDvDtMaxVPerSec: baseUpstrokeDvDtMaxVPerSec,
    actionPotentialDurationApd90Ms: baseApd90Ms,
    effectiveRefractoryPeriodErpMs,
    saNodePhase4PacemakerSlopeMvPerSec: saNodePacemakerSlopeMvPerSec,
    reentryProtectionIndexErpOverApd: Number((effectiveRefractoryPeriodErpMs / baseApd90Ms).toFixed(3)),
    citation: "Hodgkin AL & Katz B, J Physiol (1949); Vaughan Williams EM (1970)" as const,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}