export type BiologicalScale = 'quantum' | 'atomic' | 'molecular' | 'genomic' | 'cellular' | 'tissue' | 'organ' | 'clinical';
export type EvidenceStatus = 'ESTABLISHED_MECHANISM' | 'OBSERVED_ASSOCIATION' | 'CAUSAL_HYPOTHESIS' | 'SIMULATED_RELATIONSHIP' | 'UNSUPPORTED_UNKNOWN';

export interface ScientificEntity {
  id: string;
  label: string;
  scale: BiologicalScale;
  compartment: string;
  unit: string;
  baselineValue: number;
  minValue: number;
  maxValue: number;
  evidenceStatus: EvidenceStatus;
  provenanceSource: string;
}

export interface CausalEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: 'REGULATORY' | 'CHEMICAL_REACTION' | 'PHYSIOLOGICAL_FEEDBACK' | 'PATHOPHYSIOLOGICAL_CASCADE';
  effectSign: '+' | '-' | 'bimodal';
  confidence: number;
  evidenceStatus: EvidenceStatus;
  sourceReference: string;
  mechanisticDescription: string;
}

export interface SimulationScenarioState {
  scenarioId: string;
  name: string;
  oxygenSupplyPercent: number;
  atpProductionRate: number;
  rosProductionRate: number;
  inflammatoryCytokines: number;
  tissuePerfusionIndex: number;
  organFailureRiskScore: number;
  modelAssumptions: string[];
  knownLimitations: string[];
}
