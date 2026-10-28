import { ScientificEntity, CausalEdge } from './OmnicausalContracts';

export const OMNICAUSAL_ENTITIES: ScientificEntity[] = [
  { id: 'ent-o2', label: 'Molecular Oxygen (O2)', scale: 'molecular', compartment: 'Vascular', unit: 'mmHg PaO2', baselineValue: 95, minValue: 10, maxValue: 100, evidenceStatus: 'ESTABLISHED_MECHANISM', provenanceSource: 'Guyton Physiology' },
  { id: 'ent-atp', label: 'Mitochondrial ATP', scale: 'cellular', compartment: 'Mitochondria', unit: 'mmol/min/g', baselineValue: 100, minValue: 5, maxValue: 100, evidenceStatus: 'ESTABLISHED_MECHANISM', provenanceSource: 'Lehninger Biochemistry' }
];

export const OMNICAUSAL_EDGES: CausalEdge[] = [
  { id: 'edge-1', sourceId: 'ent-o2', targetId: 'ent-atp', relationshipType: 'CHEMICAL_REACTION', effectSign: '+', confidence: 0.99, evidenceStatus: 'ESTABLISHED_MECHANISM', sourceReference: 'Oxidative Phosphorylation', mechanisticDescription: 'Oxygen acts as final electron acceptor at Complex IV.' }
];
