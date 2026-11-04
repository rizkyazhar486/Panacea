export interface GoldenPhysiologyReferenceValue {
  readonly parameterId: string;
  readonly canonicalNameEn: string;
  readonly canonicalNameTa: string;
  readonly value: number;
  readonly normalRangeMin: number;
  readonly normalRangeMax: number;
  readonly ucumUnit: string;
  readonly citationAuthorEditionYearChapter: string;
}

export const GOLDEN_PHYSIOLOGY_VALUES_REGISTRY: Readonly<Record<string, GoldenPhysiologyReferenceValue>> = {
  RESTING_CARDIAC_OUTPUT: {
    parameterId: "RESTING_CARDIAC_OUTPUT",
    canonicalNameEn: "Resting Cardiac Output",
    canonicalNameTa: "Cor — Volumen minutum cordis",
    value: 5.0,
    normalRangeMin: 4.0,
    normalRangeMax: 6.5,
    ucumUnit: "L/min",
    citationAuthorEditionYearChapter: "Guyton & Hall Textbook of Medical Physiology, 14th ed. (2021), Ch. 20"
  },
  NORMAL_GLOMERULAR_FILTRATION_RATE: {
    parameterId: "NORMAL_GLOMERULAR_FILTRATION_RATE",
    canonicalNameEn: "Glomerular Filtration Rate (GFR)",
    canonicalNameTa: "Ren — Corpusculum renale (FMA:7203)",
    value: 125,
    normalRangeMin: 90,
    normalRangeMax: 130,
    ucumUnit: "mL/min/{1.73_m2}",
    citationAuthorEditionYearChapter: "Boron & Boulpaep Medical Physiology, 3rd ed. (2017), Ch. 33"
  },
  ALVEOLAR_VENTILATION_RESTING: {
    parameterId: "ALVEOLAR_VENTILATION_RESTING",
    canonicalNameEn: "Resting Alveolar Ventilation",
    canonicalNameTa: "Pulmo — Alveolus pulmonis (FMA:7195)",
    value: 4.2,
    normalRangeMin: 3.5,
    normalRangeMax: 5.5,
    ucumUnit: "L/min",
    citationAuthorEditionYearChapter: "West's Respiratory Physiology: The Essentials, 11th ed. (2021), Ch. 2"
  },
  NORMATIVE_GAIT_CADENCE: {
    parameterId: "NORMATIVE_GAIT_CADENCE",
    canonicalNameEn: "Adult Normative Walking Cadence",
    canonicalNameTa: "Membrum inferius — Articulatio genus/talocruralis",
    value: 112,
    normalRangeMin: 100,
    normalRangeMax: 125,
    ucumUnit: "{steps}/min",
    citationAuthorEditionYearChapter: "Winter DA, Biomechanics and Motor Control of Human Movement, 4th ed. (2009), Ch. 3"
  },
  DERMATOME_MAP_STANDARD: {
    parameterId: "DERMATOME_MAP_STANDARD",
    canonicalNameEn: "Spinal Segmental Dermatome Map (31 Segments)",
    canonicalNameTa: "Medulla spinalis — Nervi spinales C1-Co1",
    value: 31,
    normalRangeMin: 31,
    normalRangeMax: 31,
    ucumUnit: "{segments}",
    citationAuthorEditionYearChapter: "Keegan JJ & Garrett FD, Anat Rec (1948) + ASIA ISNCSCI Official Chart (2019)"
  },
  FETAL_BIOMETRY_CROWN_RUMP_20W: {
    parameterId: "FETAL_BIOMETRY_CROWN_RUMP_20W",
    canonicalNameEn: "Fetal Biparietal Diameter (20 Weeks Gestation)",
    canonicalNameTa: "Fetus — Cranium",
    value: 46.4,
    normalRangeMin: 43.0,
    normalRangeMax: 50.0,
    ucumUnit: "mm",
    citationAuthorEditionYearChapter: "WHO Fetal Growth Charts (2017) & INTERGROWTH-21st International Standard (2014)"
  }
};

// Two-Way SI / UCUM Unit Conversion with Fail-Closed Validation
export function convertUcumClinicalUnit(
  value: number,
  fromUnit: "mm[Hg]" | "kPa" | "mL/min" | "L/min" | "mg/dL_glucose" | "mmol/L_glucose",
  toUnit: "mm[Hg]" | "kPa" | "mL/min" | "L/min" | "mg/dL_glucose" | "mmol/L_glucose"
): { readonly value: number; readonly unit: string; readonly conversionFactor: number } {
  if (!Number.isFinite(value)) throw new RangeError("Fail-closed: value must be a finite number.");
  if (fromUnit === toUnit) return { value: Number(value.toFixed(4)), unit: toUnit, conversionFactor: 1 };
  if (fromUnit === "kPa" && toUnit === "mm[Hg]") {
    return { value: Number((value * 7.50062).toFixed(4)), unit: toUnit, conversionFactor: 7.50062 };
  }
  if (fromUnit === "mm[Hg]" && toUnit === "kPa") {
    return { value: Number((value / 7.50062).toFixed(4)), unit: toUnit, conversionFactor: Number((1 / 7.50062).toFixed(6)) };
  }
  if (fromUnit === "L/min" && toUnit === "mL/min") {
    return { value: Number((value * 1000).toFixed(4)), unit: toUnit, conversionFactor: 1000 };
  }
  if (fromUnit === "mL/min" && toUnit === "L/min") {
    return { value: Number((value / 1000).toFixed(4)), unit: toUnit, conversionFactor: 0.001 };
  }
  if (fromUnit === "mmol/L_glucose" && toUnit === "mg/dL_glucose") {
    return { value: Number((value * 18.0182).toFixed(4)), unit: toUnit, conversionFactor: 18.0182 };
  }
  if (fromUnit === "mg/dL_glucose" && toUnit === "mmol/L_glucose") {
    return { value: Number((value / 18.0182).toFixed(4)), unit: toUnit, conversionFactor: Number((1 / 18.0182).toFixed(6)) };
  }
  throw new RangeError("Fail-closed: Incompatible UCUM unit conversion from " + fromUnit + " to " + toUnit);
}