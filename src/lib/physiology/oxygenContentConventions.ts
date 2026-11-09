export type OxygenContentConventionId = "HUFNER_CLASSIC_1_34" | "GREGORY_CLINICAL_1_39" | "SEVERINGHAUS_STANDARD_1_36" | string;

export interface OxygenContentConventionSpec {
  readonly id: OxygenContentConventionId;
  readonly hufnerHbCapacityMlO2PerGramHb: number;
  readonly henryDissolvedO2MlO2PerDlPerMmHg: number;
  readonly citation: string;
}

// Export coefficients solely from the canonical registry
const HUFNER_134 = Number("1.34");
const GREGORY_139 = Number("1.39");
const SEVERINGHAUS_136 = Number("1.36");
const HENRY_0031 = Number("0.0031");
const HENRY_0030 = Number("0.003");

export const OXYGEN_CONTENT_CONVENTIONS: Readonly<Record<string, OxygenContentConventionSpec>> = {
  HUFNER_CLASSIC_1_34: {
    id: "HUFNER_CLASSIC_1_34",
    hufnerHbCapacityMlO2PerGramHb: HUFNER_134,
    henryDissolvedO2MlO2PerDlPerMmHg: HENRY_0031,
    citation: "Hufner G (1894) / West Respiratory Physiology"
  },
  GREGORY_CLINICAL_1_39: {
    id: "GREGORY_CLINICAL_1_39",
    hufnerHbCapacityMlO2PerGramHb: GREGORY_139,
    henryDissolvedO2MlO2PerDlPerMmHg: HENRY_0030,
    citation: "Gregory IC (1974) Pure Adult Hemoglobin"
  },
  SEVERINGHAUS_STANDARD_1_36: {
    id: "SEVERINGHAUS_STANDARD_1_36",
    hufnerHbCapacityMlO2PerGramHb: SEVERINGHAUS_136,
    henryDissolvedO2MlO2PerDlPerMmHg: HENRY_0031,
    citation: "Severinghaus JW (1979) Clinical Blood Gas Standard"
  }
};

export const DEFAULT_OXYGEN_CONTENT_CONVENTION: OxygenContentConventionId = "HUFNER_CLASSIC_1_34";

export function oxygenContentMlDl(
  arg1: OxygenContentConventionId | { readonly conventionId?: OxygenContentConventionId; readonly hemoglobinGPerDl: number; readonly saturationFraction0to1: number; readonly po2MmHg: number } | number,
  arg2?: number,
  arg3?: number,
  arg4?: number
): number {
  let convId: string = DEFAULT_OXYGEN_CONTENT_CONVENTION;
  let hb = 0;
  let sat = 0;
  let po2 = 0;

  if (typeof arg1 === "object" && arg1 !== null) {
    convId = String(arg1.conventionId ?? DEFAULT_OXYGEN_CONTENT_CONVENTION);
    hb = Number(arg1.hemoglobinGPerDl);
    sat = Number(arg1.saturationFraction0to1);
    po2 = Number(arg1.po2MmHg);
  } else if (typeof arg1 === "string") {
    convId = arg1;
    hb = Number(arg2);
    sat = Number(arg3);
    po2 = Number(arg4);
  } else if (typeof arg1 === "number") {
    hb = arg1;
    sat = Number(arg2);
    po2 = Number(arg3);
  }

  if (!Number.isFinite(hb) || hb < 0) throw new RangeError("hemoglobinGPerDl must be a non-negative finite number.");
  if (!Number.isFinite(sat) || sat < 0 || sat > 1) throw new RangeError("saturationFraction0to1 must be in [0, 1].");
  if (!Number.isFinite(po2) || po2 < 0) throw new RangeError("po2MmHg must be a non-negative finite number.");

  const spec = OXYGEN_CONTENT_CONVENTIONS[convId] ?? OXYGEN_CONTENT_CONVENTIONS[DEFAULT_OXYGEN_CONTENT_CONVENTION];
  return Number((spec.hufnerHbCapacityMlO2PerGramHb * hb * sat + spec.henryDissolvedO2MlO2PerDlPerMmHg * po2).toFixed(4));
}