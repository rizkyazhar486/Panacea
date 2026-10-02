export type NeuroVisualKind = 'molecule' | 'cell' | 'nucleus' | 'tract' | 'circuit' | 'behavior';

export interface NeuroVisualNode {
  id: string;
  label: string;
  kind: NeuroVisualKind;
  position: [number, number, number];
  scale?: number;
}

export interface NeuroVisualEdge {
  from: string;
  to: string;
  evidence: 'established' | 'supported' | 'hypothesis';
  speed: number;
  weight: number;
  label: string;
}

export interface NeuroVisualPreset {
  id: 'healthy' | 'alzheimer' | 'parkinson' | 'perception-belief';
  label: string;
  description: string;
  nodes: NeuroVisualNode[];
  edges: NeuroVisualEdge[];
  boundary: string;
}

const boundary = 'Educational schematic. Spatial placement is explanatory rather than connectomic; signal speed, node size and glow are visual encodings, not measured patient physiology.';

export const NEUROPSYCHIATRY_VISUAL_PRESETS: NeuroVisualPreset[] = [
  {
    id: 'healthy',
    label: 'Integrated cognition',
    description: 'Reference network for sensory evidence, salience, memory, valuation and cognitive control.',
    boundary,
    nodes: [
      { id: 'sensory', label: 'Sensory evidence', kind: 'circuit', position: [-4.2, 0.7, -0.8], scale: 1.05 },
      { id: 'thalamus', label: 'Thalamic relay', kind: 'nucleus', position: [-2.0, 0.2, 0.5] },
      { id: 'hippocampus', label: 'Hippocampal memory', kind: 'circuit', position: [-0.4, -1.3, 0.8] },
      { id: 'salience', label: 'Salience network', kind: 'circuit', position: [0.2, 1.45, 0.1] },
      { id: 'striatal', label: 'Striatal valuation', kind: 'nucleus', position: [1.8, -0.3, 0.6] },
      { id: 'prefrontal', label: 'Cognitive control', kind: 'circuit', position: [4.0, 0.8, -0.4], scale: 1.15 },
      { id: 'behavior', label: 'Adaptive response', kind: 'behavior', position: [4.5, -1.7, 0.5] },
    ],
    edges: [
      { from: 'sensory', to: 'thalamus', evidence: 'established', speed: 0.20, weight: 1, label: 'ascending sensory flow' },
      { from: 'thalamus', to: 'salience', evidence: 'supported', speed: 0.16, weight: 0.9, label: 'relevance gating' },
      { from: 'thalamus', to: 'hippocampus', evidence: 'supported', speed: 0.13, weight: 0.75, label: 'context encoding' },
      { from: 'hippocampus', to: 'prefrontal', evidence: 'supported', speed: 0.11, weight: 0.75, label: 'memory-context integration' },
      { from: 'salience', to: 'prefrontal', evidence: 'supported', speed: 0.15, weight: 0.9, label: 'salience-control coupling' },
      { from: 'striatal', to: 'prefrontal', evidence: 'supported', speed: 0.14, weight: 0.85, label: 'valuation-action selection' },
      { from: 'prefrontal', to: 'behavior', evidence: 'supported', speed: 0.18, weight: 1, label: 'goal-directed output' },
    ],
  },
  {
    id: 'alzheimer',
    label: 'Alzheimer network failure',
    description: 'Protein-homeostasis stress and glial/synaptic dysfunction propagate into memory and distributed-network failure.',
    boundary,
    nodes: [
      { id: 'protein', label: 'Protein-homeostasis stress', kind: 'molecule', position: [-4.3, 1.5, -0.4] },
      { id: 'astrocyte', label: 'Astrocyte homeostasis', kind: 'cell', position: [-2.7, -0.4, 0.8], scale: 1.15 },
      { id: 'synapse', label: 'Synaptic plasticity', kind: 'tract', position: [-0.8, 0.2, 0.2], scale: 1.1 },
      { id: 'entorhinal', label: 'Entorhinal circuit', kind: 'circuit', position: [1.0, -1.4, 0.6] },
      { id: 'hippocampus', label: 'Hippocampal circuit', kind: 'circuit', position: [1.4, 1.2, 0.2], scale: 1.2 },
      { id: 'distributed', label: 'Distributed cognition', kind: 'circuit', position: [3.6, 0.3, -0.5], scale: 1.25 },
      { id: 'memory', label: 'Encoding / retrieval', kind: 'behavior', position: [4.5, -1.7, 0.4] },
    ],
    edges: [
      { from: 'protein', to: 'synapse', evidence: 'supported', speed: 0.08, weight: 0.65, label: 'synaptic stress' },
      { from: 'astrocyte', to: 'synapse', evidence: 'supported', speed: 0.10, weight: 0.7, label: 'homeostatic support failure' },
      { from: 'synapse', to: 'entorhinal', evidence: 'supported', speed: 0.08, weight: 0.6, label: 'local plasticity loss' },
      { from: 'synapse', to: 'hippocampus', evidence: 'supported', speed: 0.07, weight: 0.65, label: 'memory-circuit instability' },
      { from: 'entorhinal', to: 'distributed', evidence: 'supported', speed: 0.06, weight: 0.55, label: 'network disconnection' },
      { from: 'hippocampus', to: 'distributed', evidence: 'supported', speed: 0.06, weight: 0.55, label: 'distributed coordination loss' },
      { from: 'distributed', to: 'memory', evidence: 'supported', speed: 0.05, weight: 0.5, label: 'cognitive impairment' },
    ],
  },
  {
    id: 'parkinson',
    label: 'Parkinson multisystem circuit',
    description: 'Nigrostriatal degeneration alters basal-ganglia dynamics while non-dopaminergic and distributed systems shape motor and cognitive manifestations.',
    boundary,
    nodes: [
      { id: 'snpc', label: 'Substantia nigra pars compacta', kind: 'nucleus', position: [-4.1, -0.8, 0.4], scale: 1.05 },
      { id: 'striatum', label: 'Striatum', kind: 'nucleus', position: [-2.0, 0.9, 0.2], scale: 1.2 },
      { id: 'gpe', label: 'GPe / indirect pathway', kind: 'nucleus', position: [-0.2, -1.1, 0.6] },
      { id: 'stn', label: 'Subthalamic nucleus', kind: 'nucleus', position: [0.7, 1.2, 0.3] },
      { id: 'gpi', label: 'GPi output', kind: 'nucleus', position: [2.0, 0.0, 0.4] },
      { id: 'thal', label: 'Thalamocortical relay', kind: 'circuit', position: [3.4, 1.1, -0.2] },
      { id: 'nondopamine', label: 'Cholinergic / monoaminergic context', kind: 'circuit', position: [0.3, 2.5, -0.7], scale: 1.15 },
      { id: 'motor', label: 'Motor / gait output', kind: 'behavior', position: [4.5, -0.6, 0.2] },
    ],
    edges: [
      { from: 'snpc', to: 'striatum', evidence: 'established', speed: 0.10, weight: 0.7, label: 'dopaminergic modulation' },
      { from: 'striatum', to: 'gpe', evidence: 'established', speed: 0.12, weight: 0.85, label: 'indirect pathway' },
      { from: 'gpe', to: 'stn', evidence: 'established', speed: 0.11, weight: 0.8, label: 'pallido-subthalamic coupling' },
      { from: 'stn', to: 'gpi', evidence: 'established', speed: 0.11, weight: 0.9, label: 'subthalamic drive' },
      { from: 'gpi', to: 'thal', evidence: 'established', speed: 0.09, weight: 0.9, label: 'basal-ganglia output' },
      { from: 'nondopamine', to: 'thal', evidence: 'supported', speed: 0.08, weight: 0.55, label: 'distributed modulation' },
      { from: 'thal', to: 'motor', evidence: 'supported', speed: 0.10, weight: 0.75, label: 'motor-network output' },
    ],
  },
  {
    id: 'perception-belief',
    label: 'Perception & belief updating',
    description: 'A hypothesis-oriented network showing sensory evidence, priors, salience and belief updating without equating any node with psychosis.',
    boundary,
    nodes: [
      { id: 'input', label: 'External sensory input', kind: 'circuit', position: [-4.3, 0.0, 0.4] },
      { id: 'sensory', label: 'Sensory representation', kind: 'circuit', position: [-2.5, 1.1, 0.1] },
      { id: 'prior', label: 'Prior expectations', kind: 'circuit', position: [-2.3, -1.3, 0.5] },
      { id: 'salience', label: 'Salience assignment', kind: 'circuit', position: [0.0, 0.2, 0.1], scale: 1.2 },
      { id: 'control', label: 'Evidence / belief updating', kind: 'circuit', position: [2.2, 1.2, -0.3] },
      { id: 'context', label: 'Memory & social context', kind: 'circuit', position: [2.0, -1.5, 0.5] },
      { id: 'percept', label: 'Conscious percept / belief', kind: 'behavior', position: [4.5, 0.0, 0.2], scale: 1.1 },
    ],
    edges: [
      { from: 'input', to: 'sensory', evidence: 'established', speed: 0.17, weight: 1, label: 'sensory evidence' },
      { from: 'prior', to: 'sensory', evidence: 'hypothesis', speed: 0.12, weight: 0.65, label: 'top-down prediction' },
      { from: 'sensory', to: 'salience', evidence: 'supported', speed: 0.14, weight: 0.8, label: 'relevance weighting' },
      { from: 'prior', to: 'salience', evidence: 'hypothesis', speed: 0.09, weight: 0.55, label: 'prior weighting' },
      { from: 'salience', to: 'control', evidence: 'supported', speed: 0.12, weight: 0.75, label: 'evidence selection' },
      { from: 'context', to: 'control', evidence: 'supported', speed: 0.10, weight: 0.7, label: 'contextual updating' },
      { from: 'control', to: 'percept', evidence: 'supported', speed: 0.13, weight: 0.8, label: 'belief/percept formation' },
    ],
  },
];
