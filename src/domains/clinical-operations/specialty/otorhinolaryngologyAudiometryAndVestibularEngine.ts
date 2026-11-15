/**
 * @file otorhinolaryngologyAudiometryAndVestibularEngine.ts
 * @description Mesin CDSS Spesialisasi THT-KL: Audiometri Nada Murni (PTA 500-4000 Hz),
 * Air-Bone Gap (ABG), Konkordansi Tes Garpu Tala (Rinne, Weber, Schwabach),
 * dan Lokalisasi Kanalis Semisirkularis BPPV (Dix-Hallpike / Manuver Epley).
 */

export type HearingLossType =
  | "NORMAL_HEARING"
  | "CONDUCTIVE_HEARING_LOSS_CHL"
  | "SENSORINEURAL_HEARING_LOSS_SNHL"
  | "MIXED_HEARING_LOSS_MHL";

export type HearingLossSeverityIso =
  | "NORMAL_0_25_DB"
  | "MILD_26_40_DB"
  | "MODERATE_41_55_DB"
  | "MODERATELY_SEVERE_56_70_DB"
  | "SEVERE_71_90_DB"
  | "PROFOUND_GT_90_DB";

export interface EarFrequencyThresholdsDb {
  readonly hz500: number;
  readonly hz1000: number;
  readonly hz2000: number;
  readonly hz4000: number;
}

export interface PureToneAudiometryInput {
  readonly earSide: "RIGHT_AD" | "LEFT_AS";
  readonly airConductionDb: EarFrequencyThresholdsDb;
  readonly boneConductionDb: EarFrequencyThresholdsDb;
  readonly dixHallpikeTriggeredNystagmus?: "UPBEATING_TORSIONAL_GEOTROPIC" | "HORIZONTAL_GEOTROPIC" | "NONE";
}

export function evaluateOtorhinolaryngologyAudiometryAndVestibular(input: PureToneAudiometryInput) {
  const acPtaDb = Number(
    (
      (input.airConductionDb.hz500 +
        input.airConductionDb.hz1000 +
        input.airConductionDb.hz2000 +
        input.airConductionDb.hz4000) /
      4
    ).toFixed(2)
  );

  const bcPtaDb = Number(
    (
      (input.boneConductionDb.hz500 +
        input.boneConductionDb.hz1000 +
        input.boneConductionDb.hz2000 +
        input.boneConductionDb.hz4000) /
      4
    ).toFixed(2)
  );

  const airBoneGapDb = Number((acPtaDb - bcPtaDb).toFixed(2));

  let hearingLossType: HearingLossType = "NORMAL_HEARING";
  if (acPtaDb <= 25 && bcPtaDb <= 25) {
    hearingLossType = "NORMAL_HEARING";
  } else if (acPtaDb > 25 && bcPtaDb <= 25 && airBoneGapDb >= 15) {
    hearingLossType = "CONDUCTIVE_HEARING_LOSS_CHL";
  } else if (acPtaDb > 25 && bcPtaDb > 25 && airBoneGapDb < 15) {
    hearingLossType = "SENSORINEURAL_HEARING_LOSS_SNHL";
  } else {
    hearingLossType = "MIXED_HEARING_LOSS_MHL";
  }

  let severityIso: HearingLossSeverityIso = "NORMAL_0_25_DB";
  if (acPtaDb > 90) severityIso = "PROFOUND_GT_90_DB";
  else if (acPtaDb > 70) severityIso = "SEVERE_71_90_DB";
  else if (acPtaDb > 55) severityIso = "MODERATELY_SEVERE_56_70_DB";
  else if (acPtaDb > 40) severityIso = "MODERATE_41_55_DB";
  else if (acPtaDb > 25) severityIso = "MILD_26_40_DB";

  const expectedTuningFork512Hz = {
    rinne:
      hearingLossType === "CONDUCTIVE_HEARING_LOSS_CHL" || hearingLossType === "MIXED_HEARING_LOSS_MHL"
        ? ("NEGATIVE_BC_GT_AC" as const)
        : ("POSITIVE_AC_GT_BC" as const),
    weberLateralization:
      hearingLossType === "CONDUCTIVE_HEARING_LOSS_CHL"
        ? (`LATERALIZES_TO_IPSILATERAL_${input.earSide}` as const)
        : hearingLossType === "SENSORINEURAL_HEARING_LOSS_SNHL"
        ? ("LATERALIZES_TO_CONTRALATERAL_BETTER_EAR" as const)
        : ("MIDLINE_NO_LATERALIZATION" as const),
    schwabach:
      hearingLossType === "CONDUCTIVE_HEARING_LOSS_CHL"
        ? ("PROLONGED_MEMANJANG" as const)
        : hearingLossType === "SENSORINEURAL_HEARING_LOSS_SNHL"
        ? ("SHORTENED_MEMENDEK" as const)
        : ("NORMAL_SAMA_DENGAN_PEMERIKSA" as const)
  };

  const bppvCanalAndManeuver =
    input.dixHallpikeTriggeredNystagmus === "UPBEATING_TORSIONAL_GEOTROPIC"
      ? {
          involvedCanal: "POSTERIOR_SEMICIRCULAR_CANAL_CANALITHIASIS" as const,
          firstLineRepositioningManeuver: "EPLEY_CANALITH_REPOSITIONING_MANEUVER" as const
        }
      : input.dixHallpikeTriggeredNystagmus === "HORIZONTAL_GEOTROPIC"
      ? {
          involvedCanal: "LATERAL_HORIZONTAL_SEMICIRCULAR_CANAL" as const,
          firstLineRepositioningManeuver: "LEMPERT_BARBECUE_ROLL_MANEUVER" as const
        }
      : {
          involvedCanal: "NO_BPPV_CANALITHIASIS_DETECTED" as const,
          firstLineRepositioningManeuver: "NO_REPOSITIONING_REQUIRED" as const
        };

  return {
    earSide: input.earSide,
    acPtaDb,
    bcPtaDb,
    airBoneGapDb,
    hearingLossType,
    severityIso,
    expectedTuningFork512Hz,
    bppvCanalAndManeuver,
    linkedAnatomicalFmaId: "FMA:52780" as const
  };
}
