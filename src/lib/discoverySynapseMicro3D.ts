export type SynapsePhase = 'resting' | 'depolarization' | 'calcium-entry' | 'vesicle-docking' | 'release' | 'receptor-binding' | 'clearance';

export interface SynapseTransmitterModel {
  id: 'glutamate' | 'gaba' | 'dopamine' | 'serotonin' | 'norepinephrine' | 'acetylcholine';
  label: string;
  receptorExamples: string[];
  clearanceExamples: string[];
  boundary: string;
}

export const SYNAPSE_TRANSMITTERS: SynapseTransmitterModel[] = [
  { id: 'glutamate', label: 'Glutamate', receptorExamples: ['AMPA', 'NMDA', 'mGluR'], clearanceExamples: ['EAAT uptake into astrocytes/neurons'], boundary: 'Educational receptor-family examples only; no receptor density, kinetics or patient concentration is inferred.' },
  { id: 'gaba', label: 'GABA', receptorExamples: ['GABA-A', 'GABA-B'], clearanceExamples: ['GAT transporters', 'metabolism after uptake'], boundary: 'Educational receptor-family examples only; inhibitory effect depends on ionic gradients and circuit context.' },
  { id: 'dopamine', label: 'Dopamine', receptorExamples: ['D1-like', 'D2-like'], clearanceExamples: ['DAT reuptake', 'enzymatic metabolism'], boundary: 'Dopamine is modulatory and cannot be mapped one-to-one to reward, psychosis, motivation or Parkinson disease.' },
  { id: 'serotonin', label: 'Serotonin', receptorExamples: ['5-HT1', '5-HT2', '5-HT3 family'], clearanceExamples: ['SERT reuptake', 'enzymatic metabolism'], boundary: 'Serotonin is not a single-variable explanation for mood or depression.' },
  { id: 'norepinephrine', label: 'Norepinephrine', receptorExamples: ['alpha-adrenergic', 'beta-adrenergic'], clearanceExamples: ['NET reuptake', 'enzymatic metabolism'], boundary: 'Arousal and attention emerge from distributed systems, not a single transmitter level.' },
  { id: 'acetylcholine', label: 'Acetylcholine', receptorExamples: ['nicotinic', 'muscarinic'], clearanceExamples: ['acetylcholinesterase hydrolysis', 'choline reuptake'], boundary: 'Cholinergic signaling participates in multiple circuits and is not a stand-alone explanation for memory or neurodegeneration.' },
];

export const SYNAPSE_PHASES: { id: SynapsePhase; label: string; explanation: string }[] = [
  { id: 'resting', label: 'Resting terminal', explanation: 'Vesicles are available near the active zone while membrane gradients are maintained.' },
  { id: 'depolarization', label: 'Action potential arrives', explanation: 'Membrane depolarization reaches the presynaptic terminal.' },
  { id: 'calcium-entry', label: 'Ca²⁺ entry', explanation: 'Voltage-gated calcium-channel opening is represented as a cue that raises local presynaptic calcium.' },
  { id: 'vesicle-docking', label: 'Docking / priming', explanation: 'Release-ready vesicles move toward the active-zone membrane.' },
  { id: 'release', label: 'Exocytotic release', explanation: 'Transmitter particles enter the synaptic cleft as an educational animation.' },
  { id: 'receptor-binding', label: 'Receptor interaction', explanation: 'Postsynaptic receptor/channel families are highlighted without assigning fabricated affinities or current amplitudes.' },
  { id: 'clearance', label: 'Clearance / recycling', explanation: 'Reuptake, enzymatic degradation and diffusion pathways are represented qualitatively.' },
];

export const SYNAPSE_MICRO_BOUNDARY = 'Interactive educational synapse model. Geometry, particle count, timing and spacing are schematic encodings, not microscopy, molecular dynamics, receptor-density imaging, measured neurotransmitter concentration or patient physiology.';
