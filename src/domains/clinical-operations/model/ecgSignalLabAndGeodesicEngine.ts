// Directive 029: ECG Interval & QTc (Bazett / Fridericia) Conduction Analyzer
export function analyzeEcgWaveformIntervalsAndConduction(params: {
  readonly rrIntervalMs: number;
  readonly prIntervalMs: number;
  readonly qrsDurationMs: number;
  readonly qtIntervalMs: number;
  readonly stElevationMmLeadV2V4: number;
}) {
  if (params.rrIntervalMs <= 200 || params.rrIntervalMs > 3000) {
    throw new RangeError("rrIntervalMs must be within physiological bounds (200..3000 ms).");
  }
  const rrSeconds = params.rrIntervalMs / 1000;
  const heartRateBpm = Number((60 / rrSeconds).toFixed(1));
  const qtcBazettMs = Number((params.qtIntervalMs / Math.sqrt(rrSeconds)).toFixed(1));
  const qtcFridericiaMs = Number((params.qtIntervalMs / Math.cbrt(rrSeconds)).toFixed(1));

  const rhythmClassification =
    heartRateBpm > 100 ? "SINUS_TACHYCARDIA" :
    heartRateBpm < 60 ? "SINUS_BRADYCARDIA" : "NORMAL_SINUS_RHYTHM";

  return {
    heartRateBpm,
    qtcBazettMs,
    qtcFridericiaMs,
    rhythmClassification,
    firstDegreeAvBlock: params.prIntervalMs > 200,
    bundleBranchBlockSuspected: params.qrsDurationMs >= 120,
    prolongedQtcWarning: qtcBazettMs >= 470,
    anteriorStElevationAlert: params.stElevationMmLeadV2V4 >= 2.0,
    correlatedConductionFmaId: "FMA:7088" as const,
    truthClass: "DERIVED_CLINICAL" as const
  };
}

// Directive 031: Laboratory Reference Interval & Critical Panic Value Evaluator
export function evaluateClinicalLabCriticality(params: {
  readonly analyte: "SERUM_POTASSIUM" | "SERUM_LACTATE" | "ARTERIAL_PH" | "HEMOGLOBIN";
  readonly value: number;
  readonly ucumUnit: string;
}) {
  if (!Number.isFinite(params.value)) throw new RangeError("Lab value must be finite.");
  const specs = {
    SERUM_POTASSIUM: { loinc: "2823-3", unit: "mmol/L", normalMin: 3.5, normalMax: 5.1, panicLow: 2.8, panicHigh: 6.2, targetOrganFma: "FMA:7088" },
    SERUM_LACTATE: { loinc: "2524-7", unit: "mmol/L", normalMin: 0.5, normalMax: 2.0, panicLow: 0.0, panicHigh: 4.0, targetOrganFma: "FMA:7197" },
    ARTERIAL_PH: { loinc: "2744-1", unit: "[pH]", normalMin: 7.35, normalMax: 7.45, panicLow: 7.20, panicHigh: 7.60, targetOrganFma: "FMA:7195" },
    HEMOGLOBIN: { loinc: "718-7", unit: "g/dL", normalMin: 13.0, normalMax: 17.5, panicLow: 7.0, panicHigh: 20.0, targetOrganFma: "FMA:9608" }
  };
  const spec = specs[params.analyte];
  if (params.ucumUnit !== spec.unit) {
    throw new RangeError("Fail-closed: expected UCUM unit " + spec.unit + " for " + params.analyte);
  }
  const isCriticalPanic = params.value <= spec.panicLow || params.value >= spec.panicHigh;
  const isAbnormal = params.value < spec.normalMin || params.value > spec.normalMax;
  return {
    analyte: params.analyte,
    loincCode: spec.loinc,
    value: params.value,
    ucumUnit: spec.unit,
    flagStatus: isCriticalPanic ? ("CRITICAL_PANIC_VALUE" as const) : isAbnormal ? ("ABNORMAL_OUT_OF_RANGE" as const) : ("NORMAL_REFERENCE" as const),
    requiresImmediateClinicianNotification: isCriticalPanic,
    linkedOrganFmaId: spec.targetOrganFma
  };
}

// Directive 035: Geodesic Haversine GPS Distance & Running Pace Calculator
export function computeGeodesicHaversineRunningSession(params: {
  readonly waypointsLatLon: readonly (readonly [number, number])[];
  readonly durationMinutes: number;
}) {
  if (params.waypointsLatLon.length < 2 || params.durationMinutes <= 0) {
    throw new RangeError("Requires >= 2 GPS waypoints and positive durationMinutes.");
  }
  const R_EARTH_KM = 6371.0088;
  let totalDistanceKm = 0;
  for (let i = 1; i < params.waypointsLatLon.length; i++) {
    const [lat1, lon1] = params.waypointsLatLon[i - 1];
    const [lat2, lon2] = params.waypointsLatLon[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistanceKm += R_EARTH_KM * c;
  }
  const distanceKm = Number(totalDistanceKm.toFixed(3));
  const paceMinPerKm = Number((params.durationMinutes / Math.max(0.001, distanceKm)).toFixed(2));
  return { distanceKm, durationMinutes: params.durationMinutes, paceMinPerKm };
}