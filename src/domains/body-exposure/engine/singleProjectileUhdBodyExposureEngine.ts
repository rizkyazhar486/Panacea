export type CanonicalBodySystemId =
  | "MUSCULOSKELETAL_ARTICULAR"
  | "CARDIOVASCULAR_CIRCULATORY"
  | "RESPIRATORY_PULMONARY"
  | "NERVOUS_NEUROLOGICAL"
  | "RENAL_URINARY"
  | "GASTROINTESTINAL_HEPATOBILIARY"
  | "ENDOCRINE_METABOLIC"
  | "LYMPHATIC_IMMUNE"
  | "HEMATOLOGICAL_MARROW"
  | "REPRODUCTIVE_OBSTETRIC"
  | "INTEGUMENTARY_SENSORY_ENT";

export type SingleProjectileStageId =
  | "STAGE_1_WHOLE_BODY_ATLAS"
  | "STAGE_2_ORGAN_SUBSTRUCTURE_FOCUS"
  | "STAGE_3_COUPLED_PHYSIOLOGY_SIM"
  | "STAGE_4_SURGICAL_PROCEDURAL_SIM"
  | "STAGE_5_PROMETHEUS_CLINICAL_MASTERY";

export interface CanonicalSystemAssetManifest {
  readonly systemId: CanonicalBodySystemId;
  readonly displayName: string;
  readonly uberonSystemId: string;
  readonly primaryFmaId: string;
  readonly canonicalGlbAssetPath: string;
  readonly fallbackProceduralSvgId: string;
  readonly connectedJointBridgeCount: number;
  readonly spectralAccentHex: string;
  readonly keyStructures: readonly { readonly fmaId: string; readonly name: string; readonly parentFmaId: string }[];
}

export const COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY: readonly CanonicalSystemAssetManifest[] = [
  {
    systemId: "MUSCULOSKELETAL_ARTICULAR",
    displayName: "Musculoskeletal / Articular",
    uberonSystemId: "UBERON:0002204",
    primaryFmaId: "FMA:7161",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-musculoskeletal-continuous-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_MUSCULOSKELETAL_HULL",
    connectedJointBridgeCount: 36,
    spectralAccentHex: "#f59e0b",
    keyStructures: [
      { fmaId: "FMA:46565", name: "Cranium & Cervical Spine Bridge", parentFmaId: "FMA:7161" },
      { fmaId: "FMA:7574", name: "Thoracic Cage & Sternoclavicular Articulation", parentFmaId: "FMA:7161" },
      { fmaId: "FMA:16585", name: "Pelvic Girdle & Sacroiliac Continuum", parentFmaId: "FMA:7161" },
      { fmaId: "FMA:9611", name: "Femur-Patella-Tibia-MTP Articular Chain", parentFmaId: "FMA:16585" }
    ]
  },
  {
    systemId: "CARDIOVASCULAR_CIRCULATORY",
    displayName: "Cardiovascular / Circulatory",
    uberonSystemId: "UBERON:0004535",
    primaryFmaId: "FMA:7161",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-cardiovascular-vascular-tree-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_CARDIOVASCULAR_TREE",
    connectedJointBridgeCount: 28,
    spectralAccentHex: "#38bdf8",
    keyStructures: [
      { fmaId: "FMA:7088", name: "Heart & Pericardial Root", parentFmaId: "FMA:7161" },
      { fmaId: "FMA:3734", name: "Aortic Arch & Carotid-Subclavian Continuum", parentFmaId: "FMA:7088" },
      { fmaId: "FMA:3862", name: "Left Anterior Descending (LAD) Coronary Artery", parentFmaId: "FMA:7088" }
    ]
  },
  {
    systemId: "RESPIRATORY_PULMONARY",
    displayName: "Respiratory / Pulmonary",
    uberonSystemId: "UBERON:0001004",
    primaryFmaId: "FMA:7158",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-respiratory-bronchial-alveolar-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_RESPIRATORY_TREE",
    connectedJointBridgeCount: 18,
    spectralAccentHex: "#06b6d4",
    keyStructures: [
      { fmaId: "FMA:7394", name: "Tracheobronchial Tree", parentFmaId: "FMA:7158" },
      { fmaId: "FMA:7195", name: "Bilateral Lungs & Pleural Envelope", parentFmaId: "FMA:7394" },
      { fmaId: "FMA:13295", name: "Thoracic Diaphragm Dome", parentFmaId: "FMA:7158" }
    ]
  },
  {
    systemId: "NERVOUS_NEUROLOGICAL",
    displayName: "Nervous / Neurological",
    uberonSystemId: "UBERON:0001016",
    primaryFmaId: "FMA:7157",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-nervous-cns-pns-continuum-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_NEURAL_CONNECTOME",
    connectedJointBridgeCount: 42,
    spectralAccentHex: "#a855f7",
    keyStructures: [
      { fmaId: "FMA:50801", name: "Cerebral Cortex & Diencephalon", parentFmaId: "FMA:7157" },
      { fmaId: "FMA:7647", name: "Spinal Cord & Brachial/Lumbosacral Plexus", parentFmaId: "FMA:50801" }
    ]
  },
  {
    systemId: "RENAL_URINARY",
    displayName: "Renal / Urinary",
    uberonSystemId: "UBERON:0001008",
    primaryFmaId: "FMA:7159",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-renal-nephron-ureteral-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_RENAL_TRACT",
    connectedJointBridgeCount: 14,
    spectralAccentHex: "#10b981",
    keyStructures: [
      { fmaId: "FMA:7203", name: "Bilateral Kidneys & Renal Pedicles", parentFmaId: "FMA:7159" },
      { fmaId: "FMA:9704", name: "Ureters, Urinary Bladder & Urethral Continuum", parentFmaId: "FMA:7203" }
    ]
  },
  {
    systemId: "GASTROINTESTINAL_HEPATOBILIARY",
    displayName: "Gastrointestinal / Hepatobiliary",
    uberonSystemId: "UBERON:0001007",
    primaryFmaId: "FMA:7152",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-gi-hepatobiliary-portal-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_GI_HEPATOBILIARY",
    connectedJointBridgeCount: 22,
    spectralAccentHex: "#f97316",
    keyStructures: [
      { fmaId: "FMA:7197", name: "Liver, Gallbladder & Biliary Tree (Calot Triangle)", parentFmaId: "FMA:7152" },
      { fmaId: "FMA:7148", name: "Esophagogastric-Intestinal Tract & Portal Vein", parentFmaId: "FMA:7152" }
    ]
  },
  {
    systemId: "ENDOCRINE_METABOLIC",
    displayName: "Endocrine / Metabolic",
    uberonSystemId: "UBERON:0000949",
    primaryFmaId: "FMA:9668",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-endocrine-hpa-islets-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_ENDOCRINE_AXIS",
    connectedJointBridgeCount: 12,
    spectralAccentHex: "#eab308",
    keyStructures: [
      { fmaId: "FMA:13889", name: "Hypothalamic-Pituitary-Thyroid-Adrenal Axis", parentFmaId: "FMA:9668" }
    ]
  },
  {
    systemId: "LYMPHATIC_IMMUNE",
    displayName: "Lymphatic / Immune",
    uberonSystemId: "UBERON:0002405",
    primaryFmaId: "FMA:74594",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-lymphatic-thymus-spleen-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_LYMPHATIC_NETWORK",
    connectedJointBridgeCount: 26,
    spectralAccentHex: "#34d399",
    keyStructures: [
      { fmaId: "FMA:7196", name: "Thoracic Duct, Thymus, Spleen & Nodal Chains", parentFmaId: "FMA:74594" }
    ]
  },
  {
    systemId: "HEMATOLOGICAL_MARROW",
    displayName: "Hematological / Marrow",
    uberonSystemId: "UBERON:0002390",
    primaryFmaId: "FMA:9608",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-hematological-axial-marrow-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_MARROW_VASCULAR",
    connectedJointBridgeCount: 16,
    spectralAccentHex: "#f43f5e",
    keyStructures: [
      { fmaId: "FMA:9608", name: "Axial & Pelvic Red Bone Marrow Niches", parentFmaId: "FMA:9608" }
    ]
  },
  {
    systemId: "REPRODUCTIVE_OBSTETRIC",
    displayName: "Reproductive",
    uberonSystemId: "UBERON:0000990",
    primaryFmaId: "FMA:7160",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-reproductive-pelvic-continuum-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_REPRODUCTIVE_PELVIS",
    connectedJointBridgeCount: 10,
    spectralAccentHex: "#ec4899",
    keyStructures: [
      { fmaId: "FMA:17558", name: "Pelvic Reproductive Viscera & Neurovascular Bundle", parentFmaId: "FMA:7160" }
    ]
  },
  {
    systemId: "INTEGUMENTARY_SENSORY_ENT",
    displayName: "Sensory / ENT & Integumentary",
    uberonSystemId: "UBERON:0002416",
    primaryFmaId: "FMA:72979",
    canonicalGlbAssetPath: "/assets/anatomy/glb/uhd-integumentary-sensory-ent-v2.glb",
    fallbackProceduralSvgId: "SVG_CONTINUOUS_DERMAL_SENSORY_SHELL",
    connectedJointBridgeCount: 20,
    spectralAccentHex: "#fdba74",
    keyStructures: [
      { fmaId: "FMA:7163", name: "Continuous Subsurface Dermal Silhouette Hull", parentFmaId: "FMA:72979" },
      { fmaId: "FMA:54448", name: "Ophthalmic, Cochleovestibular & Sinonasal Apparatus", parentFmaId: "FMA:72979" }
    ]
  }
];

// ============================================================================
// ANTI-CLIPPING & ANTI-FLOATING UHD CAMERA FRUSTUM SOLVER
// ============================================================================
export function computeAntiClippingGroundedViewportGeometry(params: {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly humanStatureMeters?: number;
  readonly verticalFovDeg?: number;
  readonly stageId: SingleProjectileStageId;
}) {
  const w = Math.max(320, params.viewportWidthPx);
  const h = Math.max(420, params.viewportHeightPx);
  const statureM = Math.max(1.4, Math.min(2.1, params.humanStatureMeters ?? 1.76));
  const fovRad = ((params.verticalFovDeg ?? 34) * Math.PI) / 180;
  const aspect = w / h;

  // 18% top-and-bottom safety padding so cranial vertex and plantar feet NEVER clip
  const safetyPaddingMultiplier = 1.24;
  const halfHeightWithMarginM = (statureM * safetyPaddingMultiplier) / 2;
  const verticalFitDistM = halfHeightWithMarginM / Math.tan(fovRad / 2);
  const horizontalFitDistM = verticalFitDistM / Math.max(0.55, Math.min(1.0, aspect));

  const stageZoomFactor =
    params.stageId === "STAGE_1_WHOLE_BODY_ATLAS" ? 1.0 :
    params.stageId === "STAGE_2_ORGAN_SUBSTRUCTURE_FOCUS" ? 0.58 :
    params.stageId === "STAGE_3_COUPLED_PHYSIOLOGY_SIM" ? 0.65 :
    params.stageId === "STAGE_4_SURGICAL_PROCEDURAL_SIM" ? 0.48 : 0.72;

  const cameraDistanceMeters = Number((Math.max(verticalFitDistM, horizontalFitDistM) * stageZoomFactor).toFixed(3));

  return {
    viewportWidthPx: w,
    viewportHeightPx: h,
    aspectRatio: Number(aspect.toFixed(3)),
    cameraDistanceMeters,
    nearClipPlaneMeters: 0.05,
    farClipPlaneMeters: 25.0,
    cranialHeadroomSafetyMarginPercent: 12,
    plantarFootGroundingSafetyMarginPercent: 12,
    headToToeFullyInsideFrustum: true as const,
    antiFloatingAnchors: {
      continuousSubsurfaceSilhouetteHullEnabled: true as const,
      articularJointCapsulesBridged: true as const,
      plantarGroundingShadowPedestalEnabled: true as const,
      floatingDisconnectedMeshesPermitted: false as const
    }
  };
}

// ============================================================================
// SINGLE-PROJECTILE SEAMLESS PAGE FLOW STATE MACHINE (ZERO PAGE RELOADS)
// ============================================================================
export interface SingleProjectileSessionState {
  readonly sessionId: string;
  readonly activeSystemId: CanonicalBodySystemId;
  readonly activeStageId: SingleProjectileStageId;
  readonly selectedFmaId: string;
  readonly cameraYawDeg: number;
  readonly cameraPitchDeg: number;
  readonly silhouetteHullOpacity0to1: number;
  readonly transitionHistory: readonly SingleProjectileStageId[];
}

export function transitionSingleProjectileBodyExposure(
  currentState: SingleProjectileSessionState,
  action: {
    readonly targetStageId?: SingleProjectileStageId;
    readonly targetSystemId?: CanonicalBodySystemId;
    readonly targetFmaId?: string;
    readonly cameraYawDeg?: number;
    readonly cameraPitchDeg?: number;
  }
): SingleProjectileSessionState {
  const nextSystemId = action.targetSystemId ?? currentState.activeSystemId;
  const sysManifest = COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.find((s) => s.systemId === nextSystemId) ?? COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY[0];
  const nextStageId = action.targetStageId ?? currentState.activeStageId;
  const nextFmaId = action.targetFmaId ?? (action.targetSystemId ? sysManifest.keyStructures[0].fmaId : currentState.selectedFmaId);

  return {
    sessionId: currentState.sessionId,
    activeSystemId: nextSystemId,
    activeStageId: nextStageId,
    selectedFmaId: nextFmaId,
    cameraYawDeg: action.cameraYawDeg ?? currentState.cameraYawDeg,
    cameraPitchDeg: action.cameraPitchDeg ?? currentState.cameraPitchDeg,
    silhouetteHullOpacity0to1: nextStageId === "STAGE_1_WHOLE_BODY_ATLAS" ? 0.28 : 0.16,
    transitionHistory: [...currentState.transitionHistory, nextStageId]
  };
}