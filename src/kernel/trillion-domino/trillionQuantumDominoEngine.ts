import crypto from 'node:crypto';
import { evaluateDynamicDominoCascade } from '../domino-matrix/dynamicDominoEngine.ts';

export type BiologicalScaleLayer =
  | 'SUB_ATOMIC_QUANTUM'
  | 'CHEMICAL_MOLECULAR'
  | 'CELLULAR_METABOLIC'
  | 'TISSUE_ORGAN'
  | 'MACROSCOPIC_CLINICAL_14_STASE';

export interface DominoMatrixInput {
  seedEntityId: string;
  initiatingLayer: BiologicalScaleLayer;
  quantumTunnelingIndex: number;
  chemicalGibbsFreeEnergy: number;
  cellularAtpFlux: number;
  organSystemStressFactor: number;
}

export interface DominoPropagationOutput {
  simulationRunId: string;
  seedEntityId: string;
  evaluatedCombinatorialPathways: number;
  propagatedCascadePath: {
    layer: BiologicalScaleLayer;
    cascadingEnergyState: number;
    entropyDelta: number;
    impactedClinicalClerkships: string[];
    clinicalManifestationRisk: 'STABLE' | 'MODERATE_ADAPTATION' | 'CRITICAL_DOMINO_COLLAPSE';
  }[];
  systemicEquilibriumVerdict: 'HOMEOSTASIS_MAINTAINED' | 'RECURSIVE_CASCADE_CONTAINED' | 'SYSTEMIC_CRITICAL_FAILURE';
  provenanceAuditHash: string;
  isClinicallyAuthoritative: false;
}

const CLERKSHIP_DOMAINS_BY_STRESS: readonly string[] = [
  'INTERNAL_MEDICINE',
  'CARDIOLOGY',
  'PULMONOLOGY_ANESTHESIOLOGY',
  'NEUROLOGY',
  'SURGERY',
  'THT_KL',
  'PEDIATRICS',
  'OBGYN',
  'OPHTHALMOLOGY',
  'DERMATOLOGY',
  'PSYCHIATRY',
  'RADIOLOGY',
  'FORENSIC_MEDICINE',
  'PUBLIC_HEALTH'
];

export function evaluateTrillionQuantumDominoMatrix(input: DominoMatrixInput): DominoPropagationOutput {
  if (!input.seedEntityId || input.quantumTunnelingIndex < 0 || input.quantumTunnelingIndex > 1) {
    throw new Error('Invalid DominoMatrixInput: seedEntityId required and quantumTunnelingIndex must be in [0, 1].');
  }

  const layers: BiologicalScaleLayer[] = [
    'SUB_ATOMIC_QUANTUM',
    'CHEMICAL_MOLECULAR',
    'CELLULAR_METABOLIC',
    'TISSUE_ORGAN',
    'MACROSCOPIC_CLINICAL_14_STASE'
  ];

  const baseCascade = evaluateDynamicDominoCascade({
    nodeId: input.seedEntityId,
    layerLevel: 'SUB_ATOMIC',
    initialPerturbationValue: Math.abs(input.chemicalGibbsFreeEnergy) * (1 + input.quantumTunnelingIndex),
    cascadeDepth: layers.length,
    atpReserveMmol: input.cellularAtpFlux
  });

  let currentEnergy =
    Math.abs(input.chemicalGibbsFreeEnergy) *
    Math.max(1, input.organSystemStressFactor) *
    (1 + input.quantumTunnelingIndex);

  const cascadePath: DominoPropagationOutput['propagatedCascadePath'] = [];

  for (let i = 0; i < layers.length; i++) {
    const metabolicBuffering = input.cellularAtpFlux * 4.2;
    currentEnergy = Number(Math.max(0, currentEnergy * 1.28 - metabolicBuffering).toFixed(3));

    let risk: 'STABLE' | 'MODERATE_ADAPTATION' | 'CRITICAL_DOMINO_COLLAPSE' = 'STABLE';
    if (currentEnergy > 450) {
      risk = 'CRITICAL_DOMINO_COLLAPSE';
    } else if (currentEnergy > 160) {
      risk = 'MODERATE_ADAPTATION';
    }

    const activeClerkshipCount =
      risk === 'CRITICAL_DOMINO_COLLAPSE' ? 14 : risk === 'MODERATE_ADAPTATION' ? 6 : 2;

    cascadePath.push({
      layer: layers[i],
      cascadingEnergyState: currentEnergy,
      entropyDelta: Number((currentEnergy / 310.15).toFixed(4)), // dS = dQ / T (at 37°C = 310.15K)
      impactedClinicalClerkships: CLERKSHIP_DOMAINS_BY_STRESS.slice(0, activeClerkshipCount),
      clinicalManifestationRisk: risk
    });
  }

  const hasCriticalCollapse = cascadePath.some((p) => p.clinicalManifestationRisk === 'CRITICAL_DOMINO_COLLAPSE');
  const hasModerate = cascadePath.some((p) => p.clinicalManifestationRisk === 'MODERATE_ADAPTATION');

  let verdict: DominoPropagationOutput['systemicEquilibriumVerdict'] = 'HOMEOSTASIS_MAINTAINED';
  if (hasCriticalCollapse) {
    verdict = 'SYSTEMIC_CRITICAL_FAILURE';
  } else if (hasModerate) {
    verdict = 'RECURSIVE_CASCADE_CONTAINED';
  }

  const provenanceAuditHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ input, cascadePath, verdict, baseHash: baseCascade.provenanceHash }))
    .digest('hex');

  return {
    simulationRunId: `DOMINO-MATRIX-${provenanceAuditHash.slice(0, 12).toUpperCase()}`,
    seedEntityId: input.seedEntityId,
    evaluatedCombinatorialPathways: baseCascade.totalCascadingStatesSimulated * CLERKSHIP_DOMAINS_BY_STRESS.length,
    propagatedCascadePath: cascadePath,
    systemicEquilibriumVerdict: verdict,
    provenanceAuditHash,
    isClinicallyAuthoritative: false
  };
}
