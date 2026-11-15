/**
 * @file hyperbaricDivePhysiologyAndBarotraumaEngine.ts
 * @description Mesin Fisiologi Hiperbarik & Penyelaman Scuba: Hukum Boyle & Dalton,
 * Tekanan Parsial Gas (ppO2, ppN2), Maximum Operating Depth (MOD) Nitrox,
 * serta Klasifikasi Derajat Barotrauma Telinga Tengah (Skala Teed 0-5).
 */

export interface ScubaHyperbaricDiveInput {
  readonly depthMetersSeawater: number;
  readonly fractionOxygenFo2: number; // mis. 0.21 (Udara) atau 0.32 (EANx32 Nitrox)
  readonly maxSafePpO2Ata?: number;   // Standar rekreasi = 1.4 ATA, kontingensi = 1.6 ATA
  readonly otoscopyFindingOnAscent:
    | "NORMAL_TYMPANIC_MEMBRANE"
    | "EPITYMPANIC_AND_HANDLE_OF_MALLEUS_ERYTHEMA"
    | "DIFFUSE_TYMPANIC_MEMBRANE_ERYTHEMA"
    | "HEMOTYMPANUM_OR_SEROUS_EFFUSION"
    | "TYMPANIC_MEMBRANE_PERFORATION";
}

export function evaluateHyperbaricDiveAndEarBarotrauma(input: ScubaHyperbaricDiveInput) {
  if (input.depthMetersSeawater < 0) {
    throw new RangeError("Kedalaman air laut (depthMetersSeawater) tidak boleh negatif.");
  }
  if (input.fractionOxygenFo2 < 0.18 || input.fractionOxygenFo2 > 1.0) {
    throw new RangeError("Fraksi oksigen (FO2) harus berada pada rentang [0.18, 1.0].");
  }

  const maxSafePpO2 = input.maxSafePpO2Ata ?? 1.4;
  const ambientPressureAta = Number((1 + input.depthMetersSeawater / 10).toFixed(2));
  const fractionNitrogenFn2 = Number((1 - input.fractionOxygenFo2).toFixed(4));

  const partialPressureO2Ata = Number((ambientPressureAta * input.fractionOxygenFo2).toFixed(3));
  const partialPressureN2Ata = Number((ambientPressureAta * fractionNitrogenFn2).toFixed(3));

  const maximumOperatingDepthMeters = Number(
    (((maxSafePpO2 / input.fractionOxygenFo2) - 1) * 10).toFixed(1)
  );

  const cnsOxygenToxicityRisk = partialPressureO2Ata > maxSafePpO2;
  const nitrogenNarcosisRisk = partialPressureN2Ata > 3.16; // > ~30 meter pada udara biasa

  let teedBarotraumaGrade: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  if (input.otoscopyFindingOnAscent === "EPITYMPANIC_AND_HANDLE_OF_MALLEUS_ERYTHEMA") teedBarotraumaGrade = 1;
  else if (input.otoscopyFindingOnAscent === "DIFFUSE_TYMPANIC_MEMBRANE_ERYTHEMA") teedBarotraumaGrade = 2;
  else if (input.otoscopyFindingOnAscent === "HEMOTYMPANUM_OR_SEROUS_EFFUSION") teedBarotraumaGrade = 4;
  else if (input.otoscopyFindingOnAscent === "TYMPANIC_MEMBRANE_PERFORATION") teedBarotraumaGrade = 5;

  return {
    ambientPressureAta,
    partialPressureO2Ata,
    partialPressureN2Ata,
    maximumOperatingDepthMeters,
    safetyFlags: {
      cnsOxygenToxicityRisk,
      nitrogenNarcosisRisk,
      withinRecreationalModLimit: input.depthMetersSeawater <= maximumOperatingDepthMeters
    },
    entMiddleEarBarotrauma: {
      teedBarotraumaGrade,
      otoscopyFinding: input.otoscopyFindingOnAscent,
      divingFitnessClearance:
        teedBarotraumaGrade === 0
          ? ("CLEARED_FOR_EQUALIZATION_AND_DESCENT" as const)
          : ("TEMPORARILY_SUSPEND_DIVING_UNTIL_TUBA_EUSTACHIUS_AND_TM_RECOVERED" as const)
    }
  };
}
