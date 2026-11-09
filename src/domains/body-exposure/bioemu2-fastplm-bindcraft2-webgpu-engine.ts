// ============================================================================
// A. MICROSOFT BIOEMU-2 EQUILIBRIUM CONFORMATIONAL ENSEMBLE SAMPLER
// ============================================================================
export interface BioEmu2ConformationalState {
  readonly stateId: "CLOSED_RESTING" | "PRE_OPEN_INTERMEDIATE" | "OPEN_CONDUCTING" | "INACTIVATED_REFRACTORY";
  readonly equilibriumProbability: number;
  readonly freeEnergyDeltaGKcalMol: number;
  readonly meanRmsfAngstrom: number;
  readonly poreRadiusAngstrom: number;
}

export function sampleBioEmu2EquilibriumEnsemble(params: {
  readonly targetProteinId: "RYR2_CALCIUM_CHANNEL" | "CAV1_2_LTCC" | "BETA1_ADRENERGIC_GPCR" | "SERCA2A_ATPASE";
  readonly temperatureKelvin?: number;
  readonly ligandBound?: boolean;
}) {
  const T = params.temperatureKelvin ?? 310.15;
  if (T < 270 || T > 330) throw new RangeError("Physiological temperatureKelvin must be in [270, 330] K.");
  const rtKcalMol = 0.0019872 * T;
  const ligandBoost = params.ligandBound ? 0.38 : 0.0;

  const pOpen = Number((0.18 + ligandBoost).toFixed(3));
  const pClosed = Number((0.52 - ligandBoost * 0.75).toFixed(3));
  const pInter = Number((0.20 - ligandBoost * 0.25).toFixed(3));
  const pInact = Number((1.0 - (pOpen + pClosed + pInter)).toFixed(3));

  const calcDg = (p: number) => Number((-rtKcalMol * Math.log(Math.max(1e-4, p / pClosed))).toFixed(3));

  const states: readonly BioEmu2ConformationalState[] = [
    { stateId: "CLOSED_RESTING", equilibriumProbability: pClosed, freeEnergyDeltaGKcalMol: 0.0, meanRmsfAngstrom: 1.15, poreRadiusAngstrom: 1.1 },
    { stateId: "PRE_OPEN_INTERMEDIATE", equilibriumProbability: pInter, freeEnergyDeltaGKcalMol: calcDg(pInter), meanRmsfAngstrom: 1.65, poreRadiusAngstrom: 2.3 },
    { stateId: "OPEN_CONDUCTING", equilibriumProbability: pOpen, freeEnergyDeltaGKcalMol: calcDg(pOpen), meanRmsfAngstrom: 2.10, poreRadiusAngstrom: 4.8 },
    { stateId: "INACTIVATED_REFRACTORY", equilibriumProbability: pInact, freeEnergyDeltaGKcalMol: calcDg(pInact), meanRmsfAngstrom: 1.35, poreRadiusAngstrom: 1.4 }
  ];

  return {
    engine: "MICROSOFT_BIOEMU2_EQUILIBRIUM_SAMPLER" as const,
    targetProteinId: params.targetProteinId,
    temperatureKelvin: T,
    ligandBound: Boolean(params.ligandBound),
    states,
    openToClosedFreeEnergyKcalMol: calcDg(pOpen),
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// ============================================================================
// B. SYNTHYRA FASTPLMS (ESMFOLD2-300 / ESMFOLD2-600) + ALPHAFOLD2-WEBGPU + LOCALFOLD
//    + EPIGENOMICSCODE OOD (OUT-OF-DISTRIBUTION) EPISTEMIC UNCERTAINTY GUARD
// ============================================================================
export type FastPlmModelTier = "SYNTHYRA_ESMFOLD2_300M" | "SYNTHYRA_ESMFOLD2_600M" | "ALPHAFOLD2_WEBGPU_LOCALFOLD" | "MOLENCE_MOL1_MULTIMODAL";

export function predictStructureWithFastPlmAndWebGpu(params: {
  readonly sequence: string;
  readonly modelTier?: FastPlmModelTier;
  readonly checkOodDomainShift?: boolean;
}) {
  const cleanSeq = params.sequence.trim().toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, "");
  if (cleanSeq.length < 8) {
    throw new RangeError("Protein sequence must contain at least 8 valid canonical amino acids.");
  }
  const modelTier = params.modelTier ?? "SYNTHYRA_ESMFOLD2_600M";
  const hydrophobicCount = (cleanSeq.match(/[AILMFWV]/g) || []).length;
  const hydrophobicRatio = hydrophobicCount / cleanSeq.length;

  // EpiGenomicsCode ProteinStructure-OOD & ProteinDesign-OOD epistemic shift detector
  const oodMahalanobisDistance = Number((Math.abs(hydrophobicRatio - 0.38) * 12.5).toFixed(2));
  const isOutOfDistribution = oodMahalanobisDistance > 3.2;

  const basePlddt = modelTier === "SYNTHYRA_ESMFOLD2_600M" ? 88.4 : modelTier === "ALPHAFOLD2_WEBGPU_LOCALFOLD" ? 89.2 : 84.6;
  const meanPlddt0to100 = Number(Math.max(42.0, Math.min(96.5, basePlddt - oodMahalanobisDistance * 4.5)).toFixed(1));
  const pTm0to1 = Number(Math.max(0.35, Math.min(0.95, meanPlddt0to100 / 100 - 0.04)).toFixed(3));
  const meanPaeAngstrom = Number(Math.max(1.8, (100 - meanPlddt0to100) * 0.28).toFixed(2));
  const inferenceLatencyMs = modelTier === "SYNTHYRA_ESMFOLD2_300M" ? 140 : modelTier === "SYNTHYRA_ESMFOLD2_600M" ? 260 : 490;

  return {
    modelTier,
    sequenceLength: cleanSeq.length,
    meanPlddt0to100,
    pTm0to1,
    meanPaeAngstrom,
    inferenceLatencyMs,
    clientSideWebGpuExecuted: true as const,
    oodSafetyReport: {
      oodDetector: "EPIGENOMICSCODE_PROTEIN_STRUCTURE_DESIGN_OOD" as const,
      mahalanobisDistance: oodMahalanobisDistance,
      isOutOfDistribution,
      confidenceClassification: isOutOfDistribution ? "LOW_CONFIDENCE_OOD_FLAGGED" : meanPlddt0to100 >= 80 ? "HIGH_CONFIDENCE_FOLD" : "MODERATE_CONFIDENCE_FOLD"
    },
    kosinskiMacromolecularComplex: {
      integrativeAssembler: "KOSINSKILAB_ASSEMBLINE_MULTISCALE" as const,
      subcomplexDocked: "CAV1_2_RYR2_DYADIC_JUNCTION"
    },
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// ============================================================================
// C. PACESALAB BINDCRAFT2 + MOLENCE MOL-1 DE NOVO BINDER DESIGN & PROTEINFIGHTER
// ============================================================================
export function designDeNovoBinderAndRunProteinFighter(params: {
  readonly targetEpitopeName: string;
  readonly binderSequence: string;
  readonly rivalBotId?: "DR_SENKU_KUN" | "DR_MAKIMA_SENPAI" | "DR_SATORU_SENSEI";
}) {
  const fold = predictStructureWithFastPlmAndWebGpu({
    sequence: params.binderSequence,
    modelTier: "SYNTHYRA_ESMFOLD2_600M"
  });
  const chargedCount = (params.binderSequence.toUpperCase().match(/[DEKRH]/g) || []).length;
  const interfacePtmIpTm = Number(Math.min(0.94, Math.max(0.45, fold.pTm0to1 - 0.03 + (chargedCount % 5) * 0.015)).toFixed(3));
  const buriedSurfaceAreaA2 = Math.round(1150 + params.binderSequence.length * 14.5);
  const shapeComplementaritySc = Number(Math.min(0.84, 0.62 + interfacePtmIpTm * 0.18).toFixed(3));
  const bindingFreeEnergyKcalMol = Number((-7.2 - interfacePtmIpTm * 6.4).toFixed(2));
  const stericClashCount = fold.oodSafetyReport.isOutOfDistribution ? 4 : 0;

  // ProteinFighter (proteinfighter.solab.org) Competitive Score vs Anime Bots
  const learnerFighterScore = Math.round(
    fold.meanPlddt0to100 * 6 + interfacePtmIpTm * 500 + shapeComplementaritySc * 300 - stericClashCount * 80
  );
  const rivalBotId = params.rivalBotId ?? "DR_SENKU_KUN";
  const rivalTargetScore = rivalBotId === "DR_SATORU_SENSEI" ? 1140 : rivalBotId === "DR_MAKIMA_SENPAI" ? 1090 : 1060;
  const victory = learnerFighterScore >= rivalTargetScore;

  return {
    designEngine: "PACESALAB_BINDCRAFT2_X_MOLENCE_MOL1" as const,
    targetEpitopeName: params.targetEpitopeName,
    binderLength: fold.sequenceLength,
    binderPlddt: fold.meanPlddt0to100,
    interfacePtmIpTm,
    buriedSurfaceAreaA2,
    shapeComplementaritySc,
    bindingFreeEnergyKcalMol,
    stericClashCount,
    oodFlagged: fold.oodSafetyReport.isOutOfDistribution,
    proteinFighterArenaMatch: {
      arenaEngine: "PROTEINFIGHTER_SOLAB_COMPETITIVE_DUEL" as const,
      rivalBotId,
      learnerFighterScore,
      rivalTargetScore,
      victory,
      verdictBanner: victory
        ? "VICTORY! Your BindCraft2 de novo binder out-stabilized " + rivalBotId + " with ipTM=" + interfacePtmIpTm + " and 0 steric clashes!"
        : "COUNTERED! " + rivalBotId + " achieved higher interface shape complementarity. Optimize hotspot residues!"
    },
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}