import { computeHemodynamics } from "./omnicausalis-multiscale-bridge.ts";
import { scheduleFsrsRetrievalReview } from "../prometheus/argon-edu-complete-suite.ts";

// Poiseuille idealized laminar flow: Q = (pi * deltaP * r^4) / (8 * mu * L)
export function computePoiseuilleLaminarFlowMlPerSec(p: {
  readonly deltaPressureMmHg: number;
  readonly radiusCm: number;
  readonly viscosityPaSec?: number;
  readonly lengthCm: number;
}): number {
  if (!Number.isFinite(p.deltaPressureMmHg) || !Number.isFinite(p.radiusCm) || p.radiusCm <= 0 || !Number.isFinite(p.lengthCm) || p.lengthCm <= 0) {
    throw new RangeError("INVALID_POISEUILLE_INPUT");
  }
  const mu = p.viscosityPaSec ?? 0.0035;
  if (!Number.isFinite(mu) || mu <= 0) throw new RangeError("INVALID_VISCOSITY");
  const q = (Math.PI * (p.deltaPressureMmHg * 133.322) * Math.pow(p.radiusCm * 0.01, 4)) / (8 * mu * (p.lengthCm * 0.01));
  return Number((q * 1e6).toFixed(4));
}

// Saltatory conduction: distance = velocity * time
export function computeSaltatoryConductionKinematics(p: {
  readonly internodeDistanceMm: number;
  readonly conductionVelocityMetersPerSec: number;
  readonly elapsedTimeMs: number;
}) {
  if (!Number.isFinite(p.internodeDistanceMm) || p.internodeDistanceMm <= 0 || !Number.isFinite(p.conductionVelocityMetersPerSec) || p.conductionVelocityMetersPerSec <= 0 || !Number.isFinite(p.elapsedTimeMs) || p.elapsedTimeMs < 0) {
    throw new RangeError("INVALID_SALTATORY_INPUT");
  }
  const distanceTraveledMm = Number((p.conductionVelocityMetersPerSec * p.elapsedTimeMs).toFixed(3));
  return {
    distanceTraveledMm,
    nodesOfRanvierActivated: Math.floor(distanceTraveledMm / p.internodeDistanceMm),
    assumptions: "Idealized myelinated axon saltatory conduction (distance = velocity * time)."
  };
}

// Krogh-Erlang cylinder oxygen diffusion
export function computeKroghCylinderTissuePO2MmHg(p: {
  readonly capillaryPO2MmHg: number;
  readonly capillaryRadiusUm: number;
  readonly tissueCylinderRadiusUm: number;
  readonly radialDistanceRUm: number;
}): number {
  if (p.capillaryRadiusUm <= 0 || p.tissueCylinderRadiusUm <= p.capillaryRadiusUm || p.radialDistanceRUm < p.capillaryRadiusUm || p.radialDistanceRUm > p.tissueCylinderRadiusUm || p.capillaryPO2MmHg <= 0) {
    throw new RangeError("INVALID_KROGH_GEOMETRY");
  }
  const mOverK = 0.0085;
  const drop = (mOverK / 2) * Math.pow(p.tissueCylinderRadiusUm, 2) * Math.log(p.radialDistanceRUm / p.capillaryRadiusUm) - (mOverK / 4) * (Math.pow(p.radialDistanceRUm, 2) - Math.pow(p.capillaryRadiusUm, 2));
  return Number(Math.max(0, p.capillaryPO2MmHg - drop).toFixed(2));
}

// Wiggers cardiac cycle & phase-locked valvular kinematics
export function evaluateWiggersCardiacPhaseAndValves(p: {
  readonly cycleFraction0to1: number;
  readonly endDiastolicVolumeMl?: number;
  readonly endSystolicVolumeMl?: number;
  readonly peakSystolicPressureMmHg?: number;
}) {
  if (!Number.isFinite(p.cycleFraction0to1) || p.cycleFraction0to1 < 0 || p.cycleFraction0to1 > 1) {
    throw new RangeError("INVALID_WIGGERS_PHASE");
  }
  const phi = p.cycleFraction0to1 === 1 ? 0 : p.cycleFraction0to1;
  const mitralValveOpen = phi >= 0.43;
  const aorticValveOpen = phi >= 0.08 && phi < 0.35;
  const phaseName = phi < 0.08 ? ("ISOVOLUMETRIC_CONTRACTION" as const) : phi < 0.35 ? ("VENTRICULAR_EJECTION" as const) : phi < 0.43 ? ("ISOVOLUMETRIC_RELAXATION" as const) : ("VENTRICULAR_FILLING" as const);
  return {
    cycleFraction0to1: phi,
    phaseName,
    mitralValveOpen,
    aorticValveOpen,
    bothValvesSimultaneouslyOpenOnLeft: mitralValveOpen && aorticValveOpen,
    schematicGeometryNotice: "Educational reference Wiggers cycle; not patient-specific geometry."
  };
}

// P3 Deepening: Renal Nephron Starling Glomerular Filtration Rate + UBERON/CL
export function computeRenalNephronStarlingGfr(p: {
  readonly glomerularCapillaryHydrostaticMmHg: number;
  readonly bowmanSpaceHydrostaticMmHg: number;
  readonly glomerularCapillaryOncoticMmHg: number;
}) {
  const netFiltrationPressureMmHg = Number((p.glomerularCapillaryHydrostaticMmHg - p.bowmanSpaceHydrostaticMmHg - p.glomerularCapillaryOncoticMmHg).toFixed(2));
  return {
    uberonKidneyId: "UBERON:0002113" as const,
    uberonNephronId: "UBERON:0001285" as const,
    cellOntologyPodocyteId: "CL:0000653" as const,
    netFiltrationPressureMmHg,
    gfrMlMin: Number(Math.max(0, 12.5 * netFiltrationPressureMmHg).toFixed(2)),
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// P2.8: Complete Connected Body Exposure x Prometheus Journey
export function executeCompleteCardiovascularBodyExposurePrometheusJourney(p: {
  readonly learnerId: string;
  readonly cycleFraction0to1: number;
  readonly heartRateBpm: number;
  readonly edvMl: number;
  readonly esvMl: number;
  readonly sbpMmHg: number;
  readonly dbpMmHg: number;
  readonly assessmentGrade1to4: 1 | 2 | 3 | 4;
}) {
  const wiggers = evaluateWiggersCardiacPhaseAndValves({ cycleFraction0to1: p.cycleFraction0to1 });
  const hemodynamics = computeHemodynamics(p.heartRateBpm, p.edvMl, p.esvMl, p.sbpMmHg, p.dbpMmHg, 6);
  const fsrs = scheduleFsrsRetrievalReview(4.0, 5.0, p.assessmentGrade1to4);
  return {
    learnerId: p.learnerId,
    journeyStagesCompleted: [
      "BODY_EXPOSURE",
      "CARDIOVASCULAR_SYSTEM",
      "HEART",
      "LEFT_VENTRICLE",
      "WIGGERS_CYCLE",
      "HEMODYNAMICS",
      "PROMETHEUS_LESSON",
      "SYNTHETIC_CLINICAL_CASE",
      "ASSESSMENT_AND_FEEDBACK",
      "SAVED_LEARNING_STATE",
      "RETURN_TO_ANATOMY"
    ] as const,
    wiggers,
    hemodynamics,
    persistedLearningState: { saved: true as const, nextIntervalDays: fsrs.nextIntervalDays, nextStabilityDays: fsrs.nextStabilityDays },
    returnedAnatomyContext: {
      systemUberonId: "UBERON:0004535" as const,
      organUberonId: "UBERON:0000948" as const,
      substructureUberonId: "UBERON:0002084" as const,
      fmaId: "FMA:7101" as const,
      cellOntologyCardiomyocyteId: "CL:0000746" as const,
      reactomePathwayId: "R-HSA-5576891" as const
    }
  };
}
