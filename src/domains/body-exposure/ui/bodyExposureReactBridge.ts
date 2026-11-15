import {
  createInitialAtlasHomeState,
  pickStructureInCanonicalScene,
  transitionAtlasStage,
  resolveLegacyStudioRouteRedirect,
  PRIMARY_VIEWPORT_CONTROLS,
  type AtlasStageId,
  type BodyExposureAtlasHomeState
} from "./BodyExposureAtlasHome.ts";
import {
  organFactIndex,
  firstSentence,
  verifyAndAdmitHraFemaleV15FromRepoArtifacts,
  executeSourceBackedMultiscaleGapHandoff,
  executeTrack3AutophagyMitophagyAndDeNovoTherapeutics,
  executeTrack4WearablesSensoriumAnd3DBiomechanics
} from "../engine/structureAtlas.ts";
import { tBodyExposure, type SupportedLocale } from "../../../locales/bodyExposureLocales.ts";

export interface UnifiedBodyNavigationTarget {
  readonly entrypointAliasUsed: "your-body" | "bodyhub" | "body-exposure" | "legacy-studio";
  readonly resolvedCanonicalPath: "/body-exposure";
  readonly initialAtlasState: BodyExposureAtlasHomeState;
  readonly activeStructureCard: {
    readonly sourceMeshName: string;
    readonly fmaId: string;
    readonly uberonId: string;
    readonly title: string;
    readonly oneSentenceFunction: string;
    readonly detailedMechanism: string;
    readonly vascularAndNeuralSummary: string;
    readonly clinicalCorrelationSummary: string;
    readonly provenanceBadge: string;
  };
}

export function resolveUnifiedBodyNavigation(params: {
  readonly incomingPathOrAlias: string;
  readonly meshOrOrganQuery?: string | null;
  readonly requestedStage?: AtlasStageId;
  readonly locale?: SupportedLocale;
}): UnifiedBodyNavigationTarget {
  const locale = params.locale ?? "en";
  const dict = tBodyExposure(locale);
  const rawPath = (params.incomingPathOrAlias || "/body-exposure").toLowerCase();

  const entrypointAliasUsed: UnifiedBodyNavigationTarget["entrypointAliasUsed"] =
    rawPath.includes("your-body") ? "your-body" :
    rawPath.includes("bodyhub") ? "bodyhub" :
    rawPath.includes("studio") || rawPath.includes("kalolumen") || rawPath.includes("deck") ? "legacy-studio" :
    "body-exposure";

  let state = createInitialAtlasHomeState(locale);

  if (entrypointAliasUsed === "legacy-studio") {
    const redir = resolveLegacyStudioRouteRedirect(rawPath);
    state = pickStructureInCanonicalScene(state, redir.selectedMeshName);
    state = transitionAtlasStage(state, redir.targetStage).nextState;
    state = { ...state, activeDepthStudioPanel: redir.openedDepthPanel };
  } else if (params.meshOrOrganQuery) {
    const q = params.meshOrOrganQuery.toLowerCase();
    const mappedMesh =
      q.includes("oblique") ? "External_abdominal_oblique_left.g" :
      q.includes("lung") || q.includes("paru") ? "Lung_Parenchyma_Bilateral.g" :
      q.includes("kidney") || q.includes("ginjal") ? "Kidney_Nephron_Bilateral.g" :
      q.includes("brain") || q.includes("otak") ? "Brain_Cerebral_Cortex.g" :
      "Heart_Myocardium.g";
    state = pickStructureInCanonicalScene(state, mappedMesh);
  }

  if (params.requestedStage) {
    state = transitionAtlasStage(state, params.requestedStage).nextState;
  }

  const sel = state.selectedStructure ?? organFactIndex("Heart_Myocardium.g")!;
  const locStruct = dict.structures[sel.sourceMeshName] ?? dict.structures["Heart_Myocardium.g"];

  return {
    entrypointAliasUsed,
    resolvedCanonicalPath: "/body-exposure",
    initialAtlasState: state,
    activeStructureCard: {
      sourceMeshName: sel.sourceMeshName,
      fmaId: sel.fmaId,
      uberonId: sel.uberonId,
      title: locStruct.localizedName,
      oneSentenceFunction: firstSentence(locStruct.oneSentenceFunction),
      detailedMechanism: locStruct.detailedMechanism,
      vascularAndNeuralSummary: locStruct.vascularAndNeuralSummary,
      clinicalCorrelationSummary: locStruct.clinicalCorrelationSummary,
      provenanceBadge: dict.provenanceAtlasReferenceLabel
    }
  };
}