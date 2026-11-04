import { computeWiggersCardiacCyclePressure } from "./wiggersAndKroghPhysiologyEngine.ts";

export type SurgicalOperationMode = "OPEN_SURGERY" | "LAPAROSCOPIC_SURGERY" | "MICROSURGERY" | "ENDOVASCULAR_CATHETER" | "ENDOSCOPY" | "IMAGE_GUIDED" | "ORTHOPEDIC_ROBOTIC_CONCEPT";
export type SurgicalInstrumentClass = "SCALPEL_15" | "STERNAL_RETRACTOR" | "INTERNAL_THORACIC_DISSECTOR" | "ATRAUMATIC_VASCULAR_CLAMP" | "CASTROVIEJO_NEEDLE_HOLDER_8_0" | "TRANSIT_TIME_DOPPLER_PROBE" | "SUCTION_IRRIGATOR";
export type CabgProcedurePhase = "PREOP_CORONARY_ANGIO_MAPPING" | "MEDIAN_STERNOTOMY_AND_PERICARDIOTOMY" | "LIMA_PEDICLE_HARVEST" | "LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS" | "CLAMP_RELEASE_AND_DOPPLER_FLOW_VERIFICATION" | "HEMOSTASIS_AND_CLOSURE";
export type SurgicalComplicationCode = "NONE" | "ANASTOMOTIC_STENOSIS_GRAFT_KINK" | " SUTURE_LINE_OOZING" | "PHRENIC_NERVE_PROXIMITY_WARNING";

export interface CabgEducationalSimulationInput {
  readonly sessionId: string;
  readonly currentPhase: CabgProcedurePhase;
  readonly selectedInstrument: SurgicalInstrumentClass;
  readonly nativeLadStenosisPercent: number;
  readonly limaGraftRadiusMm: number;
  readonly limaGraftLengthMm: number;
  readonly meanAorticRootPressureMmHg: number;
  readonly distalCoronaryBedPressureMmHg: number;
  readonly bloodViscosityPaSec?: number;
  readonly anastomosisPatencyQuality0to1?: number;
  readonly distanceToLeftPhrenicNerveMm?: number;
}

export function evaluateCabgEducationalSurgicalSimulation(input: CabgEducationalSimulationInput) {
  if (input.limaGraftRadiusMm <= 0 || input.limaGraftLengthMm <= 0) {
    throw new RangeError("Graft radius and length must be positive numbers.");
  }
  const patency = Math.max(0.1, Math.min(1.0, input.anastomosisPatencyQuality0to1 ?? 0.95));
  const effectiveRadiusMeters = (input.limaGraftRadiusMm * patency) / 1000;
  const lengthMeters = input.limaGraftLengthMm / 1000;
  const viscosity = input.bloodViscosityPaSec ?? 0.0035;
  const deltaPMmHg = Math.max(0, input.meanAorticRootPressureMmHg - input.distalCoronaryBedPressureMmHg);
  const deltaPPascals = deltaPMmHg * 133.322;

  // Poiseuille Idealized Laminar Flow: Q = (pi * dP * r^4) / (8 * mu * L) [m^3/s -> mL/min]
  const flowM3PerSec = (Math.PI * deltaPPascals * Math.pow(effectiveRadiusMeters, 4)) / (8 * viscosity * lengthMeters);
  const limaGraftFlowMlMin = Number(Math.min(220, Math.max(0, flowM3PerSec * 6e7 * 0.08)).toFixed(1));
  const pulsatilityIndexPi = Number((1.4 + (1 - patency) * 3.8).toFixed(2));

  const phrenicDist = input.distanceToLeftPhrenicNerveMm ?? 12;
  const structuresAtRiskAlert = phrenicDist < 5.0
    ? ("PHRENIC_NERVE_PROXIMITY_WARNING: Dissection within <5mm of Left Phrenic Nerve (FMA:65239); protect diaphragmatic innervation." as const)
    : ("SAFE_DISSECTION_CORRIDOR" as const);

  const graftAdequate = limaGraftFlowMlMin >= 20 && pulsatilityIndexPi <= 3.0;
  const wiggers = computeWiggersCardiacCyclePressure(280, 72);

  return {
    sessionId: input.sessionId,
    procedureCode: "EDUCATIONAL_CABG_LIMA_TO_LAD" as const,
    operationMode: "OPEN_SURGERY" as SurgicalOperationMode,
    currentPhase: input.currentPhase,
    selectedInstrument: input.selectedInstrument,
    anatomicalContext: {
      targetVesselFmaId: "FMA:3862",
      targetVesselName: "Left Anterior Descending (LAD) Coronary Artery",
      conduitFmaId: "FMA:3960",
      conduitName: "Left Internal Mammary Artery (LIMA)",
      myocardialTerritory: "AHA_17_ANTEROAPICAL_SEGMENTS_1_2_7_8_13_14_17"
    },
    poiseuilleGraftHemodynamics: {
      deltaPressureMmHg: deltaPMmHg,
      effectiveGraftRadiusMm: Number((input.limaGraftRadiusMm * patency).toFixed(2)),
      limaGraftFlowMlMin,
      transitTimePulsatilityIndex: pulsatilityIndexPi,
      graftFlowClinicallyAdequateInModel: graftAdequate,
      synchronizedLvPressureMmHg: wiggers.leftVentricularPressureMmHg
    },
    structuresAtRiskAlert,
    educationalBoundaryNotice: "EDUCATIONAL_SIMULATION_ONLY: Idealized Poiseuille laminar approximation. Never use for operative planning, cutting trajectories, or real-patient graft sizing." as const,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}