/**
 * @file rheumatologyLupusSledai2kAndBiologicsEngine.ts
 * @description Mesin Evaluasi Systemic Lupus Erythematosus (SLE): Skor Aktivitas SLEDAI-2K,
 * Biomarker Komplemen C3/C4 & Anti-dsDNA, serta Evaluasi Terapi Biologis Anifrolumab
 * (Monoclonal Antibody Antagonis Reseptor Interferon Tipe I / IFNAR1) & Steroid Tapering.
 */

export interface Sledai2kAndAnifrolumabInput {
  readonly patientId: string;
  readonly activeDomains: {
    readonly seizureOrPsychosis?: boolean; // Weight 8 each
    readonly vasculitis?: boolean;         // Weight 8
    readonly arthritisGe2Joints?: boolean; // Weight 4
    readonly proteinuriaGt05gDay?: boolean;// Weight 4
    readonly malarOrInflammatoryRash?: boolean; // Weight 2
    readonly alopecia?: boolean;           // Weight 2
    readonly mucosalUlcers?: boolean;      // Weight 2
    readonly lowComplementC3OrC4?: boolean;// Weight 2
    readonly increasedAntiDsDna?: boolean; // Weight 2
  };
  readonly currentPrednisoneEquivalentMgDay: number;
  readonly hydroxychloroquineAdherent: boolean;
  readonly typeIInterferonGeneSignatureHigh: boolean;
  readonly activeSevereLupusNephritisOrCnsLupus: boolean;
}

export function evaluateSleSledai2kAndAnifrolumabEligibility(input: Sledai2kAndAnifrolumabInput) {
  let sledai2kTotalScore = 0;
  if (input.activeDomains.seizureOrPsychosis) sledai2kTotalScore += 8;
  if (input.activeDomains.vasculitis) sledai2kTotalScore += 8;
  if (input.activeDomains.arthritisGe2Joints) sledai2kTotalScore += 4;
  if (input.activeDomains.proteinuriaGt05gDay) sledai2kTotalScore += 4;
  if (input.activeDomains.malarOrInflammatoryRash) sledai2kTotalScore += 2;
  if (input.activeDomains.alopecia) sledai2kTotalScore += 2;
  if (input.activeDomains.mucosalUlcers) sledai2kTotalScore += 2;
  if (input.activeDomains.lowComplementC3OrC4) sledai2kTotalScore += 2;
  if (input.activeDomains.increasedAntiDsDna) sledai2kTotalScore += 2;

  const diseaseActivityCategory =
    sledai2kTotalScore === 0
      ? ("REMISSION_INACTIVE" as const)
      : sledai2kTotalScore <= 5
      ? ("MILD_ACTIVITY" as const)
      : sledai2kTotalScore <= 10
      ? ("MODERATE_ACTIVITY" as const)
      : ("SEVERE_HIGH_ACTIVITY" as const);

  // Indikasi berbasis bukti (TULIP-1 / TULIP-2): SLE sedang-berat (SLEDAI-2K >= 6) pada terapi standar,
  // tanpa nefritis lupus aktif berat atau lupus neuropsikiatrik berat yang belum terkontrol
  const eligibleForAnifrolumab300MgQ4W =
    sledai2kTotalScore >= 6 &&
    input.hydroxychloroquineAdherent &&
    !input.activeSevereLupusNephritisOrCnsLupus;

  const steroidSparingTargetMgDay = 7.5;
  const requiresGlucocorticoidTaperingProtocol =
    input.currentPrednisoneEquivalentMgDay > steroidSparingTargetMgDay;

  return {
    patientId: input.patientId,
    sledai2kTotalScore,
    diseaseActivityCategory,
    anifrolumabBiologicDecision: {
      eligibleForAnifrolumab300MgQ4W,
      mechanismOfAction: "HUMAN_IGG1K_MONOCLONAL_ANTIBODY_BLOCKING_IFNAR1_SUBUNIT" as const,
      recommendedDosingRegimen: eligibleForAnifrolumab300MgQ4W
        ? "Anifrolumab 300 mg IV infusion over 30 minutes every 4 weeks"
        : "Optimize foundational hydroxychloroquine & organ-specific immunosuppressants first",
      predictedBiclaResponseAdvantage: input.typeIInterferonGeneSignatureHigh ? "HIGH_IFNGS_ENRICHED" : "STANDARD"
    },
    glucocorticoidStewardship: {
      currentPrednisoneEquivalentMgDay: input.currentPrednisoneEquivalentMgDay,
      steroidSparingTargetMgDay,
      requiresGlucocorticoidTaperingProtocol
    },
    safetyPrecautions: [
      "Screen for latent TB and viral hepatitis before biologic initiation",
      "Monitor for Herpes Zoster reactivation (increased incidence with Type-I IFN blockade)",
      "Avoid live-attenuated vaccines during Anifrolumab therapy"
    ] as const
  };
}
