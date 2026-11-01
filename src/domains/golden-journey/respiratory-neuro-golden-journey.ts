import { computeAlveolarGasAndAaGradient } from "../body-exposure/omnicausalis-multiscale-bridge.ts";
import {
  localizeNeurologicalPathwayLesion,
  type NeuroTractType,
  type NeuroLesionLevel
} from "./multisystem-golden-journey.ts";

export function executeRespiratoryBx4Journey(fiO2: number, paCO2: number, measuredPaO2: number, age: number) {
  const ag = computeAlveolarGasAndAaGradient({
    fiO2Fraction: fiO2,
    paCO2MmHg: paCO2,
    measuredPaO2MmHg: measuredPaO2,
    patientAgeYears: age
  });
  return {
    domain: "RESPIRATORY_BX4" as const,
    alveolarGas: ag.value,
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    status: "COMPLETED_JOURNEY_STEP" as const
  };
}

export function executeNeurologicalBx1Journey(
  tract: NeuroTractType,
  level: NeuroLesionLevel,
  side: "LEFT" | "RIGHT"
) {
  const localization = localizeNeurologicalPathwayLesion(tract, level, side);
  return {
    domain: "NEUROLOGICAL_BX1" as const,
    localization,
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    status: "COMPLETED_JOURNEY_STEP" as const
  };
}