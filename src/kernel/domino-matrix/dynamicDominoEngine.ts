import crypto from 'node:crypto';

export interface DominoNodeInput {
  nodeId: string;
  layerLevel: 'SUB_ATOMIC' | 'MOLECULAR' | 'CELLULAR' | 'ORGAN_SYSTEMIC';
  initialPerturbationValue: number;
  cascadeDepth: number;
  atpReserveMmol?: number;
  bufferCapacityMmolPerL?: number;
}

export interface DominoPropagationResult {
  simulationId: string;
  originNodeId: string;
  totalCascadingStatesSimulated: number;
  dominoStabilityIndex: number;
  cascadeTrajectory: {
    depth: number;
    impactedLayer: 'SUB_ATOMIC' | 'MOLECULAR' | 'CELLULAR' | 'ORGAN_SYSTEMIC';
    propagatedEnergy: number;
    homeostaticDampingApplied: number;
    consequentialOrganTargets: string[];
  }[];
  systemicOutcome: 'HOMEOSTASIS_PRESERVED' | 'CASCADING_COLLAPSE_PREVENTED' | 'QUANTUM_DOMINO_SURGE';
  provenanceHash: string;
  isClinicallyAuthoritative: false;
}

const LAYER_ORDER: DominoNodeInput['layerLevel'][] = [
  'SUB_ATOMIC',
  'MOLECULAR',
  'CELLULAR',
  'ORGAN_SYSTEMIC'
];

const LAYER_ORGAN_TARGETS: Record<DominoNodeInput['layerLevel'], string[]> = {
  SUB_ATOMIC: ['ELECTRON_TRANSPORT_COMPLEX_I', 'RADICAL_OXYGEN_SPECIES_POOL'],
  MOLECULAR: ['CYTOCHROME_C_OXIDASE', 'HEMOGLOBIN_ALLOSTERIC_CORE', 'CARBONIC_ANHYDRASE'],
  CELLULAR: ['CARDIOMYOCYTE_SARCOLEMMA', 'ALVEOLAR_TYPE_II_EPITHELIUM', 'NEURONAL_AXON_HILLOCK'],
  ORGAN_SYSTEMIC: ['CARDIOVASCULAR_MYOCARDIUM', 'PULMONARY_GAS_EXCHANGE', 'RENAL_GLOMERULAR_FILTRATION', 'CEREBRAL_PERFUSION']
};

export function evaluateDynamicDominoCascade(input: DominoNodeInput): DominoPropagationResult {
  if (!input.nodeId || !Number.isFinite(input.initialPerturbationValue) || input.cascadeDepth <= 0) {
    throw new Error('Invalid DominoNodeInput: nodeId, finite initialPerturbationValue, and positive cascadeDepth required.');
  }

  const startIdx = Math.max(0, LAYER_ORDER.indexOf(input.layerLevel));
  const boundedDepth = Math.min(Math.max(1, Math.floor(input.cascadeDepth)), 16);
  const atpReserve = input.atpReserveMmol ?? 5.0;
  const bufferCap = input.bufferCapacityMmolPerL ?? 24.0;

  const trajectory: DominoPropagationResult['cascadeTrajectory'] = [];
  let currentEnergy = Math.abs(input.initialPerturbationValue);
  let evaluatedBranchStates = 1;

  for (let d = 1; d <= boundedDepth; d++) {
    const layer = LAYER_ORDER[(startIdx + d - 1) % LAYER_ORDER.length];
    const damping = Number(((atpReserve * 0.35 + bufferCap * 0.12) / (1 + d * 0.25)).toFixed(4));
    const rawCoupledEnergy = currentEnergy * (1 + 0.38 / Math.sqrt(d));
    currentEnergy = Number(Math.max(0, rawCoupledEnergy - damping).toFixed(4));

    const targets = LAYER_ORGAN_TARGETS[layer];
    evaluatedBranchStates *= targets.length;

    trajectory.push({
      depth: d,
      impactedLayer: layer,
      propagatedEnergy: currentEnergy,
      homeostaticDampingApplied: damping,
      consequentialOrganTargets: targets
    });
  }

  let outcome: DominoPropagationResult['systemicOutcome'] = 'HOMEOSTASIS_PRESERVED';
  if (currentEnergy > 500) {
    outcome = 'QUANTUM_DOMINO_SURGE';
  } else if (currentEnergy > 120) {
    outcome = 'CASCADING_COLLAPSE_PREVENTED';
  }

  const stabilityIndex = Number((1 / (1 + currentEnergy * 0.008)).toFixed(4));
  const canonicalPayload = JSON.stringify({
    originNodeId: input.nodeId,
    layerLevel: input.layerLevel,
    initialPerturbationValue: input.initialPerturbationValue,
    boundedDepth,
    trajectory,
    outcome
  });
  const provenanceHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

  return {
    simulationId: `DOMINO-${provenanceHash.slice(0, 12).toUpperCase()}`,
    originNodeId: input.nodeId,
    totalCascadingStatesSimulated: evaluatedBranchStates,
    dominoStabilityIndex: stabilityIndex,
    cascadeTrajectory: trajectory,
    systemicOutcome: outcome,
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
