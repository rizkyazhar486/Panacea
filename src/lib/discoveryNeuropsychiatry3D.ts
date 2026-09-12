export type NeurochemicalId =
  | 'sodium'
  | 'potassium'
  | 'calcium'
  | 'chloride'
  | 'glutamate'
  | 'gaba'
  | 'dopamine'
  | 'serotonin'
  | 'norepinephrine'
  | 'acetylcholine'

export interface NeurochemicalMechanism {
  id: NeurochemicalId
  label: string
  category: 'ion' | 'neurotransmitter'
  primaryRole: string
  visualRole: string
  evidenceState: 'established' | 'context-dependent'
}

export const NEUROCHEMICALS: readonly NeurochemicalMechanism[] = [
  { id: 'sodium', label: 'Na⁺', category: 'ion', primaryRole: 'Depolarizing inward current through voltage-gated sodium channels supports action-potential upstroke.', visualRole: 'Membrane-crossing charge carrier during spike propagation.', evidenceState: 'established' },
  { id: 'potassium', label: 'K⁺', category: 'ion', primaryRole: 'Outward potassium currents contribute to repolarization and restoration of membrane excitability.', visualRole: 'Repolarizing membrane flux after depolarization.', evidenceState: 'established' },
  { id: 'calcium', label: 'Ca²⁺', category: 'ion', primaryRole: 'Presynaptic calcium entry couples action potentials to vesicle fusion and transmitter release.', visualRole: 'Trigger at the presynaptic terminal before vesicle release.', evidenceState: 'established' },
  { id: 'chloride', label: 'Cl⁻', category: 'ion', primaryRole: 'Chloride gradients shape inhibitory signaling through ligand-gated channels such as GABA-A receptors.', visualRole: 'Postsynaptic inhibitory ionic flux.', evidenceState: 'established' },
  { id: 'glutamate', label: 'Glutamate', category: 'neurotransmitter', primaryRole: 'Major excitatory neurotransmitter with ionotropic and metabotropic receptor families.', visualRole: 'Excitatory transmitter packet crossing the synaptic cleft.', evidenceState: 'established' },
  { id: 'gaba', label: 'GABA', category: 'neurotransmitter', primaryRole: 'Major inhibitory neurotransmitter in the mature central nervous system, with context depending on chloride gradients and receptor subtype.', visualRole: 'Inhibitory transmitter packet and chloride-linked postsynaptic response.', evidenceState: 'established' },
  { id: 'dopamine', label: 'Dopamine', category: 'neurotransmitter', primaryRole: 'Neuromodulator involved in reinforcement learning, motivation, movement and multiple cognitive processes across distinct pathways.', visualRole: 'Diffuse/modulatory signal rather than a single behavior molecule.', evidenceState: 'context-dependent' },
  { id: 'serotonin', label: 'Serotonin', category: 'neurotransmitter', primaryRole: 'Neuromodulator with diverse receptor subtypes involved in distributed regulation of mood, perception, sleep, appetite and cognition.', visualRole: 'Distributed modulatory signal with receptor-dependent effects.', evidenceState: 'context-dependent' },
  { id: 'norepinephrine', label: 'Norepinephrine', category: 'neurotransmitter', primaryRole: 'Neuromodulator associated with arousal, vigilance, adaptive gain and stress-response signaling across distributed networks.', visualRole: 'Arousal-related modulatory projection signal.', evidenceState: 'context-dependent' },
  { id: 'acetylcholine', label: 'Acetylcholine', category: 'neurotransmitter', primaryRole: 'Transmitter and neuromodulator involved in attention, learning, memory, autonomic signaling and neuromuscular transmission depending on circuit and receptor.', visualRole: 'Receptor-dependent modulatory or fast synaptic signal.', evidenceState: 'context-dependent' },
]

export const DISCOVERY_NEURO_3D_BOUNDARY =
  'Educational mechanistic reconstruction. Geometry is schematic, not microscopy-derived neuronal anatomy, connectomics, receptor-density imaging, patient-specific physiology, or proof that a psychiatric construct maps to one transmitter, receptor, neuron or brain region.'

export const PSYCHIATRY_NEUROSCIENCE_DOMAINS = [
  'attention', 'working-memory', 'long-term-memory', 'visuospatial-processing', 'language',
  'abstract-thinking', 'thought-process', 'thought-content', 'coherence', 'decision-making',
  'reward', 'motivation', 'habit', 'impulsivity', 'emotion', 'mood', 'affect', 'arousal',
  'orientation', 'consciousness', 'social-cognition', 'eye-contact', 'agency', 'self-knowledge',
] as const
