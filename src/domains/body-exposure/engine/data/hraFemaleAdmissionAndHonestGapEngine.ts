export type ReferenceBodySexMode = "MALE_Z_ANATOMY_SHIPPED" | "FEMALE_HRA_V1_5_REGIONAL";

export interface HraFemaleAdmissionGateInput {
  readonly sha256VerifiedAgainstMetadataJson: boolean;
  readonly blenderMeshAuditNonManifoldZero: boolean;
  readonly metricBoundsInMetersVerified: boolean;
  readonly externalGenitalSurfaceNodesVerified: boolean;
  readonly ccBy4AttributionPresentInCredits: boolean;
  readonly attemptedMergeIntoMaleCoordinateSpace?: boolean;
}

export function evaluateHraFemaleV15AdmissionGate(input: HraFemaleAdmissionGateInput) {
  if (input.attemptedMergeIntoMaleCoordinateSpace) {
    throw new Error("COORDINATE_SPACE_VIOLATION: Female HRA v1.5 assets must never be visually fitted or merged into the Male Z-Anatomy coordinate space.");
  }
  const failedGates: string[] = [];
  if (!input.sha256VerifiedAgainstMetadataJson) failedGates.push("SHA256_MISMATCH");
  if (!input.blenderMeshAuditNonManifoldZero) failedGates.push("MESH_QUALITY_AUDIT_INCOMPLETE");
  if (!input.metricBoundsInMetersVerified) failedGates.push("METRIC_BOUNDS_UNVERIFIED");
  if (!input.externalGenitalSurfaceNodesVerified) failedGates.push("EXTERNAL_GENITAL_SURFACE_COVERAGE_GAP");
  if (!input.ccBy4AttributionPresentInCredits) failedGates.push("MISSING_CC_BY_4_ATTRIBUTION");

  const admissibleForWholeBodyDefault = failedGates.length === 0;
  return {
    sourceId: "HUBMAP_HRA_FEMALE_UNITED_V1_5" as const,
    license: "CC-BY-4.0" as const,
    admissibleForWholeBodyDefault,
    currentModeStatus: admissibleForWholeBodyDefault ? ("ADMITTED_WHOLE_BODY" as const) : ("GATED_REGIONAL_OBGIN_ONLY" as const),
    failedGates
  };
}

export interface P0CoverageGapDescriptor {
  readonly gapId: string;
  readonly affectedRegionOrSystem: string;
  readonly badgeLabel: "Not yet source-backed";
  readonly honestExplanation: string;
  readonly rendersPlaceholderGeometry: false;
}

export const P0_HONEST_COVERAGE_GAPS: readonly P0CoverageGapDescriptor[] = [
  {
    gapId: "GAP_FASCIA_CONTINUUM",
    affectedRegionOrSystem: "fascia",
    badgeLabel: "Not yet source-backed",
    honestExplanation: "Deep fascial planes and aponeurotic sheets are not yet segmented as independent manifolds.",
    rendersPlaceholderGeometry: false
  },
  {
    gapId: "GAP_SKIN_MICROANATOMY",
    affectedRegionOrSystem: "skin_microanatomy",
    badgeLabel: "Not yet source-backed",
    honestExplanation: "Epidermal-dermal histological layers and adnexal structures require stage handoff rather than gross mesh zoom.",
    rendersPlaceholderGeometry: false
  },
  {
    gapId: "GAP_FEMALE_WHOLE_BODY_HRA_V1_5",
    affectedRegionOrSystem: "female_whole_body",
    badgeLabel: "Not yet source-backed",
    honestExplanation: "Whole-body HRA v1.5 female skeleton/muscle coverage is partial; regional pelvic/obgin reference is active while full admission gates complete.",
    rendersPlaceholderGeometry: false
  },
  {
    gapId: "GAP_DISTAL_NEUROVASCULAR_BRANCHING",
    affectedRegionOrSystem: "distal_neurovascular",
    badgeLabel: "Not yet source-backed",
    honestExplanation: "Sub-millimeter digital and cutaneous terminal arborizations are omitted to prevent unverified procedural trajectory inference.",
    rendersPlaceholderGeometry: false
  }
];

export function getHonestGapBadgeForContext(contextKey: string): P0CoverageGapDescriptor | null {
  const k = (contextKey || "").toLowerCase();
  return P0_HONEST_COVERAGE_GAPS.find((g) => k.includes(g.affectedRegionOrSystem)) ?? null;
}