export type AnimeBotId = "DR_SATORU_SENSEI" | "DR_MAKIMA_SENPAI" | "DR_SENKU_KUN";

export interface CompetitiveAnimeBotProfile {
  readonly botId: AnimeBotId;
  readonly displayName: string;
  readonly archetype: string;
  readonly animeArchetypeTitle: string;
  readonly baseIrtTheta: number;
  readonly adaptiveRubberBandOffset: number | null;
  readonly vrmModelPath: string;
  readonly primaryColorHex: string;
  readonly signatureLine: string;
  readonly avatar3D: {
    readonly vrmAssetPath: string;
    readonly primaryRimLightHex: string;
    readonly defaultExpression: string;
  };
}

export const PANACEA_COMPETITIVE_ANIME_BOTS: Record<AnimeBotId, CompetitiveAnimeBotProfile> = {
  DR_SATORU_SENSEI: {
    botId: "DR_SATORU_SENSEI",
    displayName: "Dr. Satoru-Sensei",
    archetype: "Limitless Neuro-Vascular & Bayesian Apex (BX-1 / BX-2 / EDU-4)",
    animeArchetypeTitle: "Limitless Neuro-Vascular & Bayesian Apex",
    baseIrtTheta: 2.40,
    adaptiveRubberBandOffset: null,
    vrmModelPath: "/assets/vrm/prometheus/dr_satoru_sensei_lod0.vrm",
    primaryColorHex: "#38BDF8",
    signatureLine: "Blindfold off. Let us see if your anatomical localization pierces my Bayesian prior.",
    avatar3D: {
      vrmAssetPath: "/assets/vrm/prometheus/dr_satoru_sensei_lod0.vrm",
      primaryRimLightHex: "#38BDF8",
      defaultExpression: "confident_smile"
    }
  },
  DR_MAKIMA_SENPAI: {
    botId: "DR_MAKIMA_SENPAI",
    displayName: "Dr. Makima-Senpai",
    archetype: "Chief Resident of Hemodynamic & BX-8 Control (BX-4 / BX-8 / BX-9 / EDU-5)",
    animeArchetypeTitle: "Chief Resident of Hemodynamic & BX-8 Control",
    baseIrtTheta: 1.85,
    adaptiveRubberBandOffset: 0.35,
    vrmModelPath: "/assets/vrm/prometheus/dr_makima_senpai_lod0.vrm",
    primaryColorHex: "#F43F5E",
    signatureLine: "Missing clinical observations are NULL, never zero. Control every hemodynamic variable.",
    avatar3D: {
      vrmAssetPath: "/assets/vrm/prometheus/dr_makima_senpai_lod0.vrm",
      primaryRimLightHex: "#F43F5E",
      defaultExpression: "tactical_glare"
    }
  },
  DR_SENKU_KUN: {
    botId: "DR_SENKU_KUN",
    displayName: "Dr. Senku-Kun",
    archetype: "10-Billion-Percent Molecular & Multiscale Speedrunner (EDU-3 / EDU-6)",
    animeArchetypeTitle: "10-Billion-Percent Molecular & Multiscale Speedrunner",
    baseIrtTheta: 1.65,
    adaptiveRubberBandOffset: null,
    vrmModelPath: "/assets/vrm/prometheus/dr_senku_kun_lod0.vrm",
    primaryColorHex: "#10B981",
    signatureLine: "Get excited! Ten billion percent zoom from Left Ventricle down to RyR2 calcium release!",
    avatar3D: {
      vrmAssetPath: "/assets/vrm/prometheus/dr_senku_kun_lod0.vrm",
      primaryRimLightHex: "#10B981",
      defaultExpression: "focused_narrow"
    }
  }
};

export function computeIrt3PLProbability(theta: number, a: number, b: number, c: number): number {
  if (a <= 0 || c < 0 || c >= 1) throw new RangeError("Invalid 3PL IRT parameters");
  return Number((c + (1 - c) / (1 + Math.exp(-a * (theta - b)))).toFixed(6));
}

export function updateBayesianPosterior(prior: number | null, lr: number | null): number {
  if (prior === null || lr === null || prior <= 0 || prior >= 1 || lr <= 0) {
    throw new RangeError("EDU-4 Guard: Unspecified prior or likelihood ratio");
  }
  const odds = (prior / (1 - prior)) * lr;
  return Number((odds / (1 + odds)).toFixed(4));
}

export function evaluateBotSparringRound(learnerTheta: number, learnerCorrect: boolean, itemDifficultyB: number) {
  const bots: AnimeBotId[] = ["DR_SATORU_SENSEI", "DR_MAKIMA_SENPAI", "DR_SENKU_KUN"];
  return bots.map((botId) => {
    const profile = PANACEA_COMPETITIVE_ANIME_BOTS[botId];
    const effectiveTheta = profile.adaptiveRubberBandOffset !== null
      ? Number((learnerTheta + profile.adaptiveRubberBandOffset).toFixed(2))
      : profile.baseIrtTheta;
    const winProb = computeIrt3PLProbability(effectiveTheta, 1.8, itemDifficultyB, 0.2);
    return {
      botId,
      displayName: profile.displayName,
      effectiveTheta,
      winProb,
      learnerOutperformedBot: learnerCorrect && learnerTheta >= effectiveTheta
    };
  });
}