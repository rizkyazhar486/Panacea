export interface FiveAxisHealthspanInput {
  readonly citizenId: string;
  readonly chronologicalAgeYears: number;
  readonly vo2MaxMlKgMin: number;
  readonly hrvRmssdMs: number;
  readonly hrvBaseline60dMs: number;
  readonly restingHeartRateBpm: number;
  readonly restorativeSleepRatio0to1: number;
  readonly acuteLoad7dTrimp: number;
  readonly chronicLoad28dTrimp: number;
  readonly fastingGlucoseMgDl: number;
  readonly zone2MinutesWeekly: number;
}

export interface ClubOrClassSessionDescriptor {
  readonly sessionId: string;
  readonly title: string;
  readonly organizerClub: string;
  readonly venueName: string;
  readonly distanceFromHomeKm: number;
  readonly durationHours: number;
  readonly feeIdr: number;
  readonly category: "FOOTBALL_FUN_GAME" | "PADEL_COMPETITIVE" | "CALISTHENICS_STRENGTH" | "CONTRAST_SAUNA_RECOVERY";
  readonly estimatedStrain0to21: number;
}

export function computeYourBodyHealthspanPortfolio(input: FiveAxisHealthspanInput) {
  const hrvRatio = input.hrvBaseline60dMs > 0 ? input.hrvRmssdMs / input.hrvBaseline60dMs : 1.0;
  const recoveryPercent = Math.min(99, Math.max(12, Math.round(hrvRatio * 58 + input.restorativeSleepRatio0to1 * 72 - Math.max(0, input.restingHeartRateBpm - 54) * 1.4)));
  const acwr = input.chronicLoad28dTrimp > 0 ? Number((input.acuteLoad7dTrimp / input.chronicLoad28dTrimp).toFixed(2)) : 1.0;
  const dayStrain0to21 = Number(Math.min(21.0, Math.max(2.0, Math.log1p(input.acuteLoad7dTrimp / 35) * 7.8)).toFixed(1));

  const cardiovascularAxis = Math.min(100, Math.max(40, Math.round((input.vo2MaxMlKgMin / 58) * 92)));
  const metabolismAxis = Math.min(100, Math.max(40, Math.round(100 - Math.max(0, input.fastingGlucoseMgDl - 84) * 1.3 + Math.min(15, input.zone2MinutesWeekly / 15))));
  const neuroplasticityAxis = Math.min(100, Math.max(40, Math.round(input.restorativeSleepRatio0to1 * 105 + Math.min(20, input.hrvRmssdMs / 5))));
  const orthopedicAxis = acwr >= 0.8 && acwr <= 1.3 ? 95 : acwr > 1.5 ? 58 : 82;
  const hormonalVitalityAxis = Math.min(100, Math.max(40, Math.round((recoveryPercent + metabolismAxis) / 2)));

  const compositeHealthspanScore = Math.round((cardiovascularAxis + metabolismAxis + neuroplasticityAxis + orthopedicAxis + hormonalVitalityAxis) / 5);
  const biologicalAgeDeltaYears = Number(((compositeHealthspanScore - 78) * -0.22).toFixed(1));
  const projectedBiologicalAgeYears = Number((input.chronologicalAgeYears + biologicalAgeDeltaYears).toFixed(1));

  return {
    longitudinalHealthId: "PANACEA-LHID-" + input.citizenId.toUpperCase(),
    chronologicalAgeYears: input.chronologicalAgeYears,
    projectedBiologicalAgeYears,
    biologicalAgeDeltaYears,
    compositeHealthspanScore,
    athlyticWhoopMetrics: {
      recoveryPercent,
      recoveryTier: recoveryPercent >= 67 ? ("OPTIMAL_GREEN" as const) : recoveryPercent >= 34 ? ("MODERATE_AMBER" as const) : ("RESTORATIVE_RED" as const),
      dayStrain0to21,
      targetStrainRange: recoveryPercent >= 67 ? ([14.0, 17.5] as const) : recoveryPercent >= 34 ? ([10.0, 13.5] as const) : ([4.0, 8.5] as const),
      acuteChronicWorkloadRatio: acwr,
      orthopedicLoadStatus: acwr > 1.5 ? ("HIGH_INJURY_RISK_DELOAD" as const) : ("SWEET_SPOT_SAFE" as const)
    },
    fiveVitalityAxes: {
      cardiovascular: { score: cardiovascularAxis, headline: "VO2 Max " + input.vo2MaxMlKgMin + " mL/kg/min" },
      metabolism: { score: metabolismAxis, headline: "Zone 2: " + input.zone2MinutesWeekly + "m · Glu " + input.fastingGlucoseMgDl + " mg/dL" },
      neuroplasticity: { score: neuroplasticityAxis, headline: "HRV " + input.hrvRmssdMs + " ms · REM/Deep " + Math.round(input.restorativeSleepRatio0to1 * 100) + "%" },
      orthopedic: { score: orthopedicAxis, headline: "ACWR " + acwr + "x Joint Symmetry" },
      hormonalVitality: { score: hormonalVitalityAxis, headline: "Anabolic Readiness " + hormonalVitalityAxis + "%" }
    },
    truthClass: "DERIVED_CLINICAL" as const,
    clinicallyReviewed: false as const
  };
}

export const CANONICAL_RECLUB_CLASSPASS_SESSIONS: readonly ClubOrClassSessionDescriptor[] = [
  {
    sessionId: "CLUB_BINTARO_FOOTBALL_01",
    title: "Football Training & Fun Game",
    organizerClub: "Indonesian Association of British Alumni (IABA)",
    venueName: "The Forum Sports Hub Bintaro, Jakarta Selatan",
    distanceFromHomeKm: 7.3,
    durationHours: 2.5,
    feeIdr: 125000,
    category: "FOOTBALL_FUN_GAME",
    estimatedStrain0to21: 15.4
  },
  {
    sessionId: "CLUB_SENOPATI_PADEL_02",
    title: "Zone-2 & Reflex Padel Social Rally",
    organizerClub: "Panacea Longevity Athletics Club",
    venueName: "Senopati Padel Sanctuary",
    distanceFromHomeKm: 4.8,
    durationHours: 1.5,
    feeIdr: 150000,
    category: "PADEL_COMPETITIVE",
    estimatedStrain0to21: 12.1
  },
  {
    sessionId: "STUDIO_CONTRAST_RECOVERY_03",
    title: "Nordic Sauna (85C) + Cold Plunge (8C) Vagal Reset",
    organizerClub: "Panacea Autonomic Sanctuary",
    venueName: "Lippo Village Longevity Lab",
    distanceFromHomeKm: 3.2,
    durationHours: 1.0,
    feeIdr: 110000,
    category: "CONTRAST_SAUNA_RECOVERY",
    estimatedStrain0to21: 5.2
  }
];

export function matchReclubAndClassPassSessionsToBiology(
  portfolio: ReturnType<typeof computeYourBodyHealthspanPortfolio>,
  sessions: readonly ClubOrClassSessionDescriptor[] = CANONICAL_RECLUB_CLASSPASS_SESSIONS
) {
  const rec = portfolio.athlyticWhoopMetrics.recoveryPercent;
  const acwr = portfolio.athlyticWhoopMetrics.acuteChronicWorkloadRatio;
  return sessions.map((s) => {
    const orthopedicSafe = !(acwr > 1.45 && s.estimatedStrain0to21 > 13.0);
    const strainAligned = rec >= 67 ? s.estimatedStrain0to21 >= 11.0 : s.estimatedStrain0to21 <= 12.5;
    const matchStatus = !orthopedicSafe
      ? ("PROTECT_JOINTS_CAP_MINUTES" as const)
      : strainAligned ? ("BIOLOGICALLY_OPTIMAL_MATCH" as const) : ("MODERATE_PACE_ADVISORY" as const);
    return {
      ...s,
      orthopedicSafe,
      matchStatus,
      conciseMedicalAdvice: !orthopedicSafe
        ? "ACWR is high (" + acwr + "x). Cap match play at 45 mins to protect ACL/Achilles."
        : matchStatus === "BIOLOGICALLY_OPTIMAL_MATCH"
          ? "Recovery " + rec + "% matches " + s.estimatedStrain0to21 + " Strain target. Ready to join."
          : "Hydrate +500mL electrolytes; maintain Zone 2-3 heart rate ceiling."
    };
  });
}