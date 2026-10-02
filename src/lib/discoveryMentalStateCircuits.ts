export type EvidenceState = 'established' | 'supported' | 'emerging' | 'hypothesis' | 'unknown';

export interface CircuitNode {
  id: string;
  label: string;
  kind: 'molecule' | 'cell' | 'region' | 'network' | 'behavior' | 'mental-state';
}

export interface CircuitEdge {
  from: string;
  to: string;
  relation: string;
  evidence: EvidenceState;
  uncertainty: string;
}

export interface MentalStateCircuitModel {
  id: string;
  label: string;
  domain: 'neurodegeneration' | 'psychomotor' | 'mood-affect' | 'perception' | 'thought' | 'anxiety-obsession';
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  guardrail: string;
  evidenceAnchors: { pmid: string; label: string }[];
}

const guardrail = 'Educational network model only. No single neurotransmitter, receptor or region is sufficient to explain a diagnosis, identity, belief, personality or individual symptom. Relationships are many-to-many and evidence-labelled.';

export const DISCOVERY_MENTAL_STATE_CIRCUITS: MentalStateCircuitModel[] = [
  {
    id: 'alzheimer-network',
    label: "Alzheimer disease: synapse-to-network failure",
    domain: 'neurodegeneration',
    guardrail,
    evidenceAnchors: [
      { pmid: '42148604', label: 'Circuit–transmitter dysfunction and neuromodulation in Alzheimer disease' },
      { pmid: '42604981', label: 'Astrocytes, synapses and neurodegenerative disease' },
    ],
    nodes: [
      { id: 'amyloid-tau', label: 'Protein-homeostasis stress', kind: 'molecule' },
      { id: 'astrocyte-ad', label: 'Astrocyte / homeostatic dysfunction', kind: 'cell' },
      { id: 'synapse-ad', label: 'Synaptic plasticity failure', kind: 'network' },
      { id: 'hippocampal-ad', label: 'Hippocampal–entorhinal memory circuits', kind: 'region' },
      { id: 'network-ad', label: 'Distributed cognitive networks', kind: 'network' },
      { id: 'memory-ad', label: 'Encoding / retrieval impairment', kind: 'mental-state' },
    ],
    edges: [
      { from: 'amyloid-tau', to: 'synapse-ad', relation: 'may contribute to synaptic dysfunction', evidence: 'supported', uncertainty: 'mechanisms are heterogeneous and not reducible to one protein species' },
      { from: 'astrocyte-ad', to: 'synapse-ad', relation: 'modulates transmitter turnover, excitability and metabolic support', evidence: 'supported', uncertainty: 'cell-state effects vary by region and disease stage' },
      { from: 'synapse-ad', to: 'hippocampal-ad', relation: 'degrades local circuit plasticity', evidence: 'supported', uncertainty: 'network progression varies between individuals' },
      { from: 'hippocampal-ad', to: 'network-ad', relation: 'alters distributed cognitive-network coordination', evidence: 'supported', uncertainty: 'not a deterministic one-region explanation of dementia' },
      { from: 'network-ad', to: 'memory-ad', relation: 'can impair memory performance', evidence: 'supported', uncertainty: 'memory impairment also depends on attention, language, sleep and systemic state' },
    ],
  },
  {
    id: 'parkinson-network',
    label: "Parkinson disease: basal-ganglia and multisystem circuit failure",
    domain: 'neurodegeneration',
    guardrail,
    evidenceAnchors: [
      { pmid: '42614481', label: 'Parkinson disease as neural, vascular, peripheral and immunometabolic dysfunction' },
      { pmid: '42061779', label: 'Basal-ganglia, prefrontal and cerebellar mechanisms in Parkinson cognition' },
      { pmid: '42349894', label: 'Multitransmitter circuitry in freezing of gait' },
    ],
    nodes: [
      { id: 'snpc', label: 'Nigrostriatal dopaminergic degeneration', kind: 'region' },
      { id: 'striatal', label: 'Striatal direct / indirect pathway imbalance', kind: 'network' },
      { id: 'bg', label: 'Basal-ganglia network dynamics', kind: 'network' },
      { id: 'nondopamine', label: 'Cholinergic / noradrenergic / serotonergic / GABA–glutamate systems', kind: 'network' },
      { id: 'motor', label: 'Bradykinesia / freezing / posture–gait effects', kind: 'behavior' },
      { id: 'cognitive-pd', label: 'Attention / timing / working-memory effects', kind: 'mental-state' },
    ],
    edges: [
      { from: 'snpc', to: 'striatal', relation: 'changes dopaminergic modulation of striatal circuitry', evidence: 'established', uncertainty: 'motor and non-motor effects are not dopamine-only' },
      { from: 'striatal', to: 'bg', relation: 'changes action-selection and movement-network dynamics', evidence: 'established', uncertainty: 'canonical direct/indirect diagrams are simplified' },
      { from: 'nondopamine', to: 'bg', relation: 'modulates locomotor, cognitive and arousal networks', evidence: 'supported', uncertainty: 'relative contribution varies by phenotype' },
      { from: 'bg', to: 'motor', relation: 'can produce impaired initiation and gait control', evidence: 'established', uncertainty: 'symptom expression depends on distributed circuitry' },
      { from: 'bg', to: 'cognitive-pd', relation: 'interacts with prefrontal and cerebellar timing/cognitive systems', evidence: 'supported', uncertainty: 'cognition is not reducible to basal ganglia alone' },
    ],
  },
  {
    id: 'psychomotor-self-presentation',
    label: 'Grooming, posture and psychomotor state',
    domain: 'psychomotor',
    guardrail,
    evidenceAnchors: [],
    nodes: [
      { id: 'motor-control', label: 'Motor-control networks', kind: 'network' },
      { id: 'motivation', label: 'Motivation / effort valuation', kind: 'network' },
      { id: 'executive', label: 'Executive organization', kind: 'network' },
      { id: 'arousal', label: 'Arousal / sleep–wake state', kind: 'network' },
      { id: 'grooming', label: 'Grooming / personal hygiene behavior', kind: 'behavior' },
      { id: 'posture', label: 'Slumped or expansive posture / movements', kind: 'behavior' },
      { id: 'agitation', label: 'Agitation or psychomotor retardation', kind: 'behavior' },
    ],
    edges: [
      { from: 'motivation', to: 'grooming', relation: 'can influence self-care initiation', evidence: 'supported', uncertainty: 'social context, physical illness, resources and personal preference also matter' },
      { from: 'executive', to: 'grooming', relation: 'can influence sequencing and completion of self-care', evidence: 'supported', uncertainty: 'not a diagnostic marker by itself' },
      { from: 'motor-control', to: 'posture', relation: 'constrains movement amplitude and posture', evidence: 'supported', uncertainty: 'posture is not specific to mood or diagnosis' },
      { from: 'arousal', to: 'agitation', relation: 'can alter psychomotor activation', evidence: 'supported', uncertainty: 'agitation has many medical, neurologic, psychiatric and situational causes' },
    ],
  },
  {
    id: 'mood-affect',
    label: 'Mood, emotion and affect',
    domain: 'mood-affect',
    guardrail,
    evidenceAnchors: [],
    nodes: [
      { id: 'salience', label: 'Salience / interoceptive networks', kind: 'network' },
      { id: 'reward', label: 'Reward / valuation networks', kind: 'network' },
      { id: 'threat', label: 'Threat-learning networks', kind: 'network' },
      { id: 'control', label: 'Cognitive-control networks', kind: 'network' },
      { id: 'affect', label: 'Observed affect', kind: 'mental-state' },
      { id: 'mood', label: 'Sustained mood', kind: 'mental-state' },
      { id: 'crying', label: 'Crying / expressive behavior', kind: 'behavior' },
      { id: 'irritability', label: 'Irritability / anger / expansive activation', kind: 'mental-state' },
    ],
    edges: [
      { from: 'reward', to: 'mood', relation: 'contributes to valuation and motivational tone', evidence: 'supported', uncertainty: 'mood emerges from distributed neurobiological and contextual factors' },
      { from: 'threat', to: 'irritability', relation: 'can increase defensive/reactive responding', evidence: 'supported', uncertainty: 'irritability is transdiagnostic and context dependent' },
      { from: 'salience', to: 'affect', relation: 'supports interoceptive and emotionally salient processing', evidence: 'supported', uncertainty: 'observed affect cannot reveal a unique neural cause' },
      { from: 'control', to: 'crying', relation: 'can influence regulation of emotional expression', evidence: 'supported', uncertainty: 'crying may reflect many normal and pathological states' },
    ],
  },
  {
    id: 'perception-belief',
    label: 'Illusions, hallucinations and delusion-like belief formation',
    domain: 'perception',
    guardrail,
    evidenceAnchors: [],
    nodes: [
      { id: 'sensory', label: 'Sensory evidence', kind: 'network' },
      { id: 'prediction', label: 'Prior expectations / predictive processing', kind: 'network' },
      { id: 'salience-belief', label: 'Salience assignment', kind: 'network' },
      { id: 'belief-update', label: 'Belief updating / cognitive control', kind: 'network' },
      { id: 'illusion', label: 'Illusion', kind: 'mental-state' },
      { id: 'hallucination', label: 'Hallucination', kind: 'mental-state' },
      { id: 'delusion', label: 'Delusion-like fixed belief', kind: 'mental-state' },
    ],
    edges: [
      { from: 'sensory', to: 'illusion', relation: 'ambiguous external input may be misinterpreted', evidence: 'established', uncertainty: 'illusions can occur in healthy perception' },
      { from: 'prediction', to: 'hallucination', relation: 'abnormally weighted priors are one candidate mechanism', evidence: 'hypothesis', uncertainty: 'hallucinations are heterogeneous across conditions and modalities' },
      { from: 'salience-belief', to: 'delusion', relation: 'aberrant salience is one candidate contributor', evidence: 'hypothesis', uncertainty: 'delusions cannot be explained by salience alone' },
      { from: 'belief-update', to: 'delusion', relation: 'impaired evidence updating may contribute to persistence', evidence: 'supported', uncertainty: 'social, developmental and contextual factors also shape belief formation' },
    ],
  },
  {
    id: 'anxiety-obsession',
    label: 'Anxiety, phobia, obsession and compulsion',
    domain: 'anxiety-obsession',
    guardrail,
    evidenceAnchors: [],
    nodes: [
      { id: 'threat-learning', label: 'Threat learning / fear conditioning', kind: 'network' },
      { id: 'avoidance', label: 'Avoidance learning', kind: 'network' },
      { id: 'habit-loop', label: 'Cortico-striatal habit / action loops', kind: 'network' },
      { id: 'error-monitor', label: 'Error / uncertainty monitoring', kind: 'network' },
      { id: 'anxiety', label: 'Anxiety state', kind: 'mental-state' },
      { id: 'phobia', label: 'Phobic fear / avoidance', kind: 'mental-state' },
      { id: 'obsession', label: 'Obsessive thought', kind: 'mental-state' },
      { id: 'compulsion', label: 'Compulsive behavior', kind: 'behavior' },
    ],
    edges: [
      { from: 'threat-learning', to: 'phobia', relation: 'can strengthen cue-linked defensive responses', evidence: 'supported', uncertainty: 'phobias also depend on learning history and context' },
      { from: 'avoidance', to: 'phobia', relation: 'negative reinforcement can maintain avoidance', evidence: 'supported', uncertainty: 'not sufficient to explain all anxiety disorders' },
      { from: 'error-monitor', to: 'obsession', relation: 'may contribute to persistent uncertainty or intrusive concern', evidence: 'hypothesis', uncertainty: 'obsessions are heterogeneous in content and mechanism' },
      { from: 'habit-loop', to: 'compulsion', relation: 'can contribute to repeated action patterns', evidence: 'supported', uncertainty: 'compulsion is not reducible to habit alone' },
    ],
  },
];

export const DISCOVERY_MENTAL_STATE_BOUNDARY = guardrail;
