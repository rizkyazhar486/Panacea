export const TWENTY_CANONICAL_KNOWLEDGE_GRAPH_RELATIONS = [
  "PART_OF", "LOCATED_IN", "SUPPLIED_BY", "INNERVATED_BY", "EXPRESSES",
  "ENCODES", "INTERACTS_WITH", "REGULATES", "INHIBITS", "ACTIVATES",
  "METABOLIZES", "ASSOCIATED_WITH", "CAUSES_UNDER_CONDITIONS", "MEASURED_BY", "TREATED_BY",
  "OBSERVED_IN", "SUPPORTED_BY", "CONTRADICTED_BY", "DERIVED_FROM", "SIMULATED_BY"
] as const;
export type CanonicalKnowledgeGraphRelationType = (typeof TWENTY_CANONICAL_KNOWLEDGE_GRAPH_RELATIONS)[number];

export interface MultiscaleKnowledgeGraphEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly relation: CanonicalKnowledgeGraphRelationType;
  readonly targetNodeId: string;
  readonly biologicalScale: "ORGANISM" | "SYSTEM" | "ORGAN" | "TISSUE" | "CELL" | "ORGANELLE" | "PATHWAY" | "PROTEIN" | "GENE" | "CLINICAL_PHENOTYPE";
  readonly evidenceSourceCitation: string;
  readonly evidenceStatus: "ESTABLISHED_MECHANISM" | "CLINICAL_GUIDELINE" | "EMERGING_HYPOTHESIS";
  readonly uncertainty0to1: number;
}

export const CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES: readonly MultiscaleKnowledgeGraphEdge[] = [
  { edgeId: "KG-01", sourceNodeId: "FMA:7101_LEFT_VENTRICLE", relation: "PART_OF", targetNodeId: "FMA:7088_HEART", biologicalScale: "ORGAN", evidenceSourceCitation: "Terminologia Anatomica 2nd ed.", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.01 },
  { edgeId: "KG-02", sourceNodeId: "FMA:7088_HEART", relation: "LOCATED_IN", targetNodeId: "FMA:9826_MIDDLE_MEDIASTINUM", biologicalScale: "SYSTEM", evidenceSourceCitation: "Gray's Anatomy 42nd ed.", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.01 },
  { edgeId: "KG-03", sourceNodeId: "FMA:7101_LEFT_VENTRICLE", relation: "SUPPLIED_BY", targetNodeId: "FMA:3862_LAD_CORONARY_ARTERY", biologicalScale: "ORGAN", evidenceSourceCitation: "Cerqueira et al., Circulation 2002", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.05 },
  { edgeId: "KG-04", sourceNodeId: "FMA:7088_HEART", relation: "INNERVATED_BY", targetNodeId: "FMA:6219_VAGUS_NERVE_CN_X", biologicalScale: "ORGAN", evidenceSourceCitation: "Guyton & Hall 14th ed.", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.02 },
  { edgeId: "KG-05", sourceNodeId: "CL:0000746_CARDIOMYOCYTE", relation: "EXPRESSES", targetNodeId: "UNIPROT:Q92736_RYR2", biologicalScale: "CELL", evidenceSourceCitation: "Human Protein Atlas v23", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.03 },
  { edgeId: "KG-06", sourceNodeId: "HGNC:10484_RYR2_GENE", relation: "ENCODES", targetNodeId: "UNIPROT:Q92736_RYR2", biologicalScale: "GENE", evidenceSourceCitation: "Ensembl GRCh38", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.01 },
  { edgeId: "KG-07", sourceNodeId: "UNIPROT:Q9BXM7_PINK1", relation: "INTERACTS_WITH", targetNodeId: "UNIPROT:O60260_PARKIN", biologicalScale: "ORGANELLE", evidenceSourceCitation: "Reactome R-HSA-5205647", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.04 },
  { edgeId: "KG-08", sourceNodeId: "PATHWAY:AMPK_KINASE", relation: "REGULATES", targetNodeId: "PATHWAY:ULK1_AUTOPHAGY_INITIATION", biologicalScale: "PATHWAY", evidenceSourceCitation: "Kim et al., Nat Cell Biol 2011", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.05 },
  { edgeId: "KG-09", sourceNodeId: "DRUG:DAPAGLIFLOZIN_SGLT2I", relation: "INHIBITS", targetNodeId: "UNIPROT:P31639_SLC5A2_SGLT2", biologicalScale: "PROTEIN", evidenceSourceCitation: "ESC Heart Failure Guidelines", evidenceStatus: "CLINICAL_GUIDELINE", uncertainty0to1: 0.03 },
  { edgeId: "KG-10", sourceNodeId: "HORMONE:ANGIOTENSIN_II", relation: "ACTIVATES", targetNodeId: "RECEPTOR:AT1R_VASCULAR_SMOOTH_MUSCLE", biologicalScale: "PATHWAY", evidenceSourceCitation: "Boron & Boulpaep 3rd ed.", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.02 },
  { edgeId: "KG-11", sourceNodeId: "ENZYME:CYP2C19_HEPATOCYTE", relation: "METABOLIZES", targetNodeId: "PRODUG:CLOPIDOGREL", biologicalScale: "CELL", evidenceSourceCitation: "CPIC Pharmacogenomics Guideline", evidenceStatus: "CLINICAL_GUIDELINE", uncertainty0to1: 0.04 },
  { edgeId: "KG-12", sourceNodeId: "BIOMARKER:SERUM_LACTATE_ELEVATION", relation: "ASSOCIATED_WITH", targetNodeId: "PHENOTYPE:TISSUE_HYPOPERFUSION_SEPSIS", biologicalScale: "CLINICAL_PHENOTYPE", evidenceSourceCitation: "Surviving Sepsis Campaign 2026", evidenceStatus: "CLINICAL_GUIDELINE", uncertainty0to1: 0.06 },
  { edgeId: "KG-13", sourceNodeId: "OCCLUSION:LAD_PROXIMAL_THROMBUS", relation: "CAUSES_UNDER_CONDITIONS", targetNodeId: "PHENOTYPE:ANTERIOR_WALL_STEMI_SEGMENTS_1_2_7_8_13_14_17", biologicalScale: "ORGAN", evidenceSourceCitation: "AHA/ACC STEMI Guideline", evidenceStatus: "CLINICAL_GUIDELINE", uncertainty0to1: 0.05 },
  { edgeId: "KG-14", sourceNodeId: "PHYSIOLOGY:ARTERIAL_OXYGEN_CONTENT_CAO2", relation: "MEASURED_BY", targetNodeId: "LOINC:2708-6_ARTERIAL_BLOOD_GAS_PANEL", biologicalScale: "SYSTEM", evidenceSourceCitation: "LOINC / UCUM Standard", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.02 },
  { edgeId: "KG-15", sourceNodeId: "PHENOTYPE:SEPTIC_SHOCK_MAP_BELOW_65", relation: "TREATED_BY", targetNodeId: "INTERVENTION:NOREPINEPHRINE_FIRST_LINE_VASOPRESSOR", biologicalScale: "CLINICAL_PHENOTYPE", evidenceSourceCitation: "Surviving Sepsis Campaign", evidenceStatus: "CLINICAL_GUIDELINE", uncertainty0to1: 0.04 },
  { edgeId: "KG-16", sourceNodeId: "SIGN:REFERRED_PAIN_DERMATOME_T1_T5", relation: "OBSERVED_IN", targetNodeId: "PHENOTYPE:MYOCARDIAL_ISCHEMIA", biologicalScale: "CLINICAL_PHENOTYPE", evidenceSourceCitation: "Keegan & Garrett 1948", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.12 },
  { edgeId: "KG-17", sourceNodeId: "CLAIM:HUFNER_OXYGEN_CAPACITY_1_34", relation: "SUPPORTED_BY", targetNodeId: "PREREG:HUFNER_OXYGEN_CONTENT_CAPACITY_SLICE_01", biologicalScale: "SYSTEM", evidenceSourceCitation: "West Respiratory Physiology", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.01 },
  { edgeId: "KG-18", sourceNodeId: "HYPOTHESIS:UNFALSIFIED_STATIC_ELASTANCE", relation: "CONTRADICTED_BY", targetNodeId: "MODEL:SUGA_SAGAWA_TIME_VARYING_ELASTANCE", biologicalScale: "ORGAN", evidenceSourceCitation: "Suga & Sagawa, Circ Res 1974", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.02 },
  { edgeId: "KG-19", sourceNodeId: "ASSET:Z_ANATOMY_GLB_LAYERS", relation: "DERIVED_FROM", targetNodeId: "SOURCE:Z_ANATOMY_CC_BY_SA_4_0", biologicalScale: "ORGANISM", evidenceSourceCitation: "CREDITS.txt", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.0 },
  { edgeId: "KG-20", sourceNodeId: "FMA:7088_HEART", relation: "SIMULATED_BY", targetNodeId: "ENGINE:CARDIOPULMONARY_COUPLING_DECK", biologicalScale: "ORGAN", evidenceSourceCitation: "PanaceaMed Domain Engine", evidenceStatus: "ESTABLISHED_MECHANISM", uncertainty0to1: 0.05 }
];

export function traverseMultiscaleKnowledgeGraph(startNodeQuery: string) {
  const q = (startNodeQuery || "").trim().toUpperCase();
  const connectedEdges = CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES.filter(
    (e) => e.sourceNodeId.includes(q) || e.targetNodeId.includes(q)
  );
  return {
    query: startNodeQuery,
    totalCanonicalRelationTypesSupported: TWENTY_CANONICAL_KNOWLEDGE_GRAPH_RELATIONS.length,
    matchedEdgesCount: connectedEdges.length,
    edges: connectedEdges
  };
}

// Directive 019 / 059: Transparent Engineering Priority Calculator
// Priority = (UserValue * ScientificValue * IntegrationLeverage * Feasibility * RiskReduction) / (EstimatedEffort * DependencyBurden)
export function computeOmnicausalisEngineeringPriority(params: {
  readonly opportunityId: string;
  readonly userValue1to10: number;
  readonly scientificValue1to10: number;
  readonly integrationLeverage1to10: number;
  readonly feasibility1to10: number;
  readonly riskReduction1to10: number;
  readonly estimatedEffort1to10: number;
  readonly dependencyBurden1to10: number;
}) {
  const denom = Math.max(0.1, params.estimatedEffort1to10) * Math.max(0.1, params.dependencyBurden1to10);
  const numerator =
    params.userValue1to10 *
    params.scientificValue1to10 *
    params.integrationLeverage1to10 *
    params.feasibility1to10 *
    params.riskReduction1to10;
  const priorityScore = Number((numerator / denom).toFixed(2));
  return {
    opportunityId: params.opportunityId,
    priorityScore,
    executionTier: priorityScore >= 500 ? ("P0_IMMEDIATE_EXECUTION" as const) : priorityScore >= 100 ? ("P1_HIGH_LEVERAGE" as const) : ("P2_BACKLOG" as const)
  };
}