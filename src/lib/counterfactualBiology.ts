import type { AnatomyLayer, MotionState } from '../components/Body3D'

export type BiologyScale = 'molecule' | 'organelle' | 'cell' | 'tissue' | 'organ' | 'phenotype'
export type EvidenceTier = 'mechanistic' | 'preclinical' | 'clinical-observational' | 'clinical-computational'

export interface CausalNode {
  id: string
  label: string
  scale: BiologyScale
  baseline: number
  uncertainty: number
  description: string
}

export interface CausalEdge {
  from: string
  to: string
  sign: 1 | -1
  weight: number
  delay?: number
  mechanism: string
}

export interface PerturbationPreset {
  id: string
  label: string
  target: string
  direction: 1 | -1
  defaultMagnitude: number
  rationale: string
}

export interface CounterfactualScenario {
  id: string
  label: string
  subtitle: string
  description: string
  focusKeywords: string[]
  layers: AnatomyLayer['key'][]
  motion: MotionState
  nodes: CausalNode[]
  edges: CausalEdge[]
  perturbations: PerturbationPreset[]
  objectiveNode: string
  falsificationMeasurements: string[]
  patientSpecificInputs: string[]
  references: Array<{ label: string; url: string; evidence: EvidenceTier }>
}

export interface NodeState {
  value: number
  low: number
  high: number
  delta: number
}

export interface CounterfactualFrame {
  step: number
  states: Record<string, NodeState>
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export const SCALE_ORDER: BiologyScale[] = ['molecule', 'organelle', 'cell', 'tissue', 'organ', 'phenotype']

export const COUNTERFACTUAL_SCENARIOS: CounterfactualScenario[] = [
  {
    id: 'neurovascular-ischemia',
    label: 'Neurovascular ischemic stress',
    subtitle: 'Perfusion → ATP → excitotoxicity → BBB → edema → neural function',
    description: 'A mechanistic educational model of how reduced cerebral perfusion can propagate from energy failure to tissue-level dysfunction. It is not a stroke predictor or treatment calculator.',
    focusKeywords: ['brain', 'cerebr', 'carotid', 'vertebral', 'basilar'],
    layers: ['nervous', 'cardiovascular'],
    motion: { heartRate: 82, respRate: 18, contractionRate: 0, peristalsisRate: 4 },
    nodes: [
      { id: 'perfusion', label: 'Cerebral perfusion', scale: 'organ', baseline: 0.78, uncertainty: 0.08, description: 'Normalized delivery of blood flow to brain tissue.' },
      { id: 'oxygen', label: 'Oxygen delivery', scale: 'tissue', baseline: 0.8, uncertainty: 0.08, description: 'Effective oxygen availability at tissue level.' },
      { id: 'atp', label: 'ATP availability', scale: 'organelle', baseline: 0.82, uncertainty: 0.1, description: 'Mitochondrial energy availability supporting ion gradients.' },
      { id: 'ion', label: 'Ion homeostasis', scale: 'cell', baseline: 0.84, uncertainty: 0.1, description: 'Ability to maintain transmembrane ion gradients.' },
      { id: 'glutamate', label: 'Excitotoxic stress', scale: 'molecule', baseline: 0.18, uncertainty: 0.12, description: 'Normalized glutamatergic excitotoxic burden.' },
      { id: 'bbb', label: 'BBB integrity', scale: 'tissue', baseline: 0.86, uncertainty: 0.1, description: 'Functional integrity of the neurovascular barrier.' },
      { id: 'edema', label: 'Edema burden', scale: 'tissue', baseline: 0.12, uncertainty: 0.12, description: 'Normalized tissue water accumulation burden.' },
      { id: 'function', label: 'Network function', scale: 'phenotype', baseline: 0.9, uncertainty: 0.11, description: 'Schematic neural network functional reserve.' },
    ],
    edges: [
      { from: 'perfusion', to: 'oxygen', sign: 1, weight: 0.82, mechanism: 'Flow supports oxygen delivery.' },
      { from: 'oxygen', to: 'atp', sign: 1, weight: 0.78, mechanism: 'Oxidative phosphorylation depends on oxygen supply.' },
      { from: 'atp', to: 'ion', sign: 1, weight: 0.74, mechanism: 'ATP-dependent pumps maintain electrochemical gradients.' },
      { from: 'ion', to: 'glutamate', sign: -1, weight: 0.66, mechanism: 'Loss of ionic control promotes depolarization and excitotoxic signaling.' },
      { from: 'glutamate', to: 'bbb', sign: -1, weight: 0.48, delay: 1, mechanism: 'Excitotoxic/inflammatory signaling can contribute to barrier dysfunction.' },
      { from: 'bbb', to: 'edema', sign: -1, weight: 0.62, mechanism: 'Barrier loss increases edema tendency.' },
      { from: 'edema', to: 'function', sign: -1, weight: 0.58, delay: 1, mechanism: 'Tissue swelling and injury reduce network function.' },
      { from: 'ion', to: 'function', sign: 1, weight: 0.5, mechanism: 'Cellular electrophysiologic stability supports function.' },
    ],
    perturbations: [
      { id: 'reduce-perfusion', label: 'Reduce cerebral perfusion', target: 'perfusion', direction: -1, defaultMagnitude: 0.42, rationale: 'Explore how a perfusion deficit may propagate through energy and barrier states.' },
      { id: 'support-atp', label: 'Improve ATP resilience', target: 'atp', direction: 1, defaultMagnitude: 0.28, rationale: 'A virtual resilience hypothesis, not a treatment recommendation.' },
      { id: 'reduce-excitotoxicity', label: 'Reduce excitotoxic signaling', target: 'glutamate', direction: -1, defaultMagnitude: 0.32, rationale: 'Tests how dampening one downstream mechanism changes the cascade.' },
    ],
    objectiveNode: 'function',
    falsificationMeasurements: ['Perfusion imaging or flow surrogate does not move with the modeled perturbation', 'ATP/metabolic readout changes without the predicted ion-homeostasis effect', 'Barrier or edema markers move in the opposite direction', 'Functional outcome changes while upstream modeled states remain unchanged'],
    patientSpecificInputs: ['DICOM perfusion/vascular imaging', 'Neurologic phenotype and timing', 'Laboratory oxygenation/metabolic context', 'Optional EEG/MEG/network data'],
    references: [
      { label: 'Virtual Brain Twin / multiscale network modeling example (EBioMedicine 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42580034/', evidence: 'clinical-computational' },
      { label: 'CURE principles for computational biological models (NPJ Syst Biol Appl 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41888157/', evidence: 'mechanistic' },
    ],
  },
  {
    id: 'retinal-metabolic-stress',
    label: 'Retinal metabolic stress',
    subtitle: 'Oxygen → mitochondria → ROS → VEGF → permeability → retinal function',
    description: 'A multi-scale retina model for exploring how metabolic and vascular stress can couple to retinal tissue function. It is intentionally schematic and non-diagnostic.',
    focusKeywords: ['eye', 'optic', 'retina', 'ophthalmic'],
    layers: ['nervous', 'cardiovascular', 'visceral'],
    motion: { heartRate: 72, respRate: 14, contractionRate: 0, peristalsisRate: 4 },
    nodes: [
      { id: 'retinal-oxygen', label: 'Retinal oxygen supply', scale: 'tissue', baseline: 0.82, uncertainty: 0.1, description: 'Normalized tissue oxygen availability.' },
      { id: 'mito', label: 'Mitochondrial efficiency', scale: 'organelle', baseline: 0.8, uncertainty: 0.12, description: 'Schematic mitochondrial energy efficiency.' },
      { id: 'ros', label: 'Oxidative stress', scale: 'molecule', baseline: 0.2, uncertainty: 0.13, description: 'Normalized reactive oxidative burden.' },
      { id: 'vegf', label: 'VEGF drive', scale: 'molecule', baseline: 0.18, uncertainty: 0.15, description: 'Schematic pro-angiogenic/permeability signaling.' },
      { id: 'vascular', label: 'Vascular integrity', scale: 'tissue', baseline: 0.86, uncertainty: 0.11, description: 'Retinal vascular barrier integrity.' },
      { id: 'edema-retina', label: 'Retinal edema burden', scale: 'tissue', baseline: 0.1, uncertainty: 0.14, description: 'Normalized edema tendency.' },
      { id: 'photoreceptor', label: 'Photoreceptor resilience', scale: 'cell', baseline: 0.85, uncertainty: 0.12, description: 'Schematic photoreceptor cellular reserve.' },
      { id: 'vision', label: 'Visual function reserve', scale: 'phenotype', baseline: 0.9, uncertainty: 0.12, description: 'Educational functional reserve, not acuity prediction.' },
    ],
    edges: [
      { from: 'retinal-oxygen', to: 'mito', sign: 1, weight: 0.7, mechanism: 'Oxygen availability supports oxidative metabolism.' },
      { from: 'mito', to: 'ros', sign: -1, weight: 0.62, mechanism: 'Mitochondrial dysfunction can increase oxidative stress.' },
      { from: 'ros', to: 'vegf', sign: 1, weight: 0.45, delay: 1, mechanism: 'Hypoxic/oxidative stress can promote pro-angiogenic signaling.' },
      { from: 'vegf', to: 'vascular', sign: -1, weight: 0.6, mechanism: 'Permeability signaling can reduce barrier integrity.' },
      { from: 'vascular', to: 'edema-retina', sign: -1, weight: 0.64, mechanism: 'Barrier compromise increases edema tendency.' },
      { from: 'ros', to: 'photoreceptor', sign: -1, weight: 0.5, mechanism: 'Oxidative stress can impair retinal cells.' },
      { from: 'photoreceptor', to: 'vision', sign: 1, weight: 0.6, mechanism: 'Cellular integrity supports visual function.' },
      { from: 'edema-retina', to: 'vision', sign: -1, weight: 0.46, mechanism: 'Edema can disrupt retinal architecture and function.' },
    ],
    perturbations: [
      { id: 'retinal-hypoxia', label: 'Reduce retinal oxygen', target: 'retinal-oxygen', direction: -1, defaultMagnitude: 0.38, rationale: 'Explore a hypoxic stress cascade.' },
      { id: 'mito-support', label: 'Improve mitochondrial efficiency', target: 'mito', direction: 1, defaultMagnitude: 0.25, rationale: 'Research-only mitochondrial resilience perturbation.' },
      { id: 'vegf-down', label: 'Reduce VEGF drive', target: 'vegf', direction: -1, defaultMagnitude: 0.3, rationale: 'Explore a pathway-level permeability perturbation without recommending therapy.' },
    ],
    objectiveNode: 'vision',
    falsificationMeasurements: ['OCT/vascular imaging changes do not track the modeled vascular/edema states', 'Oxidative markers change without corresponding cellular-state effects', 'Visual function changes independently of the modeled retinal compartments'],
    patientSpecificInputs: ['OCT/OCT-A or retinal imaging', 'Visual acuity/field/functional data', 'Metabolic and vascular context', 'Optional genomic/retinal disease annotation'],
    references: [
      { label: 'CURE principles for model credibility (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41888157/', evidence: 'mechanistic' },
      { label: 'Multiscale predictive cellular modeling review (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42213163/', evidence: 'mechanistic' },
    ],
  },
  {
    id: 'cardiac-fibrosis',
    label: 'Cardiac remodeling & fibrosis',
    subtitle: 'Load → TGF-β signaling → fibroblasts → ECM → stiffness → pump reserve',
    description: 'A mechanistic remodeling sandbox linking upstream load and signaling to tissue fibrosis and organ-level function.',
    focusKeywords: ['heart', 'atrium', 'ventricle', 'coronary', 'aorta'],
    layers: ['cardiovascular', 'visceral'],
    motion: { heartRate: 88, respRate: 16, contractionRate: 0, peristalsisRate: 4 },
    nodes: [
      { id: 'load', label: 'Mechanical load', scale: 'organ', baseline: 0.35, uncertainty: 0.1, description: 'Normalized hemodynamic/mechanical load.' },
      { id: 'tgfb', label: 'TGF-β signaling', scale: 'molecule', baseline: 0.25, uncertainty: 0.14, description: 'Canonical profibrotic signaling burden.' },
      { id: 'fibroblast', label: 'Fibroblast activation', scale: 'cell', baseline: 0.24, uncertainty: 0.13, description: 'Normalized activated fibroblast/myofibroblast state.' },
      { id: 'ecm', label: 'ECM deposition', scale: 'tissue', baseline: 0.22, uncertainty: 0.14, description: 'Normalized extracellular matrix deposition.' },
      { id: 'stiffness', label: 'Tissue stiffness', scale: 'tissue', baseline: 0.28, uncertainty: 0.12, description: 'Relative myocardial stiffness burden.' },
      { id: 'calcium', label: 'Cellular Ca²⁺ reserve', scale: 'cell', baseline: 0.8, uncertainty: 0.1, description: 'Schematic excitation-contraction reserve.' },
      { id: 'pump', label: 'Pump reserve', scale: 'phenotype', baseline: 0.84, uncertainty: 0.11, description: 'Normalized organ functional reserve, not ejection fraction.' },
    ],
    edges: [
      { from: 'load', to: 'tgfb', sign: 1, weight: 0.58, mechanism: 'Mechanical stress can promote profibrotic signaling.' },
      { from: 'tgfb', to: 'fibroblast', sign: 1, weight: 0.72, mechanism: 'TGF-β signaling promotes fibroblast activation.' },
      { from: 'fibroblast', to: 'ecm', sign: 1, weight: 0.76, mechanism: 'Activated fibroblasts synthesize/remodel extracellular matrix.' },
      { from: 'ecm', to: 'stiffness', sign: 1, weight: 0.72, delay: 1, mechanism: 'Fibrotic matrix accumulation increases tissue stiffness.' },
      { from: 'stiffness', to: 'pump', sign: -1, weight: 0.52, mechanism: 'Excess stiffness can impair filling/mechanical performance.' },
      { from: 'calcium', to: 'pump', sign: 1, weight: 0.58, mechanism: 'Excitation-contraction coupling supports cardiac function.' },
      { from: 'load', to: 'pump', sign: -1, weight: 0.25, mechanism: 'Sustained load can reduce reserve directly and indirectly.' },
    ],
    perturbations: [
      { id: 'increase-load', label: 'Increase mechanical load', target: 'load', direction: 1, defaultMagnitude: 0.4, rationale: 'Explore chronic remodeling pressure.' },
      { id: 'tgfb-down', label: 'Reduce profibrotic signaling', target: 'tgfb', direction: -1, defaultMagnitude: 0.28, rationale: 'Research-only pathway perturbation.' },
      { id: 'calcium-support', label: 'Improve Ca²⁺ reserve', target: 'calcium', direction: 1, defaultMagnitude: 0.18, rationale: 'Tests a cellular function perturbation separately from fibrosis.' },
    ],
    objectiveNode: 'pump',
    falsificationMeasurements: ['Imaging-derived fibrosis/stiffness does not track ECM state', 'Biomarker/signaling change fails to precede fibroblast response', 'Organ function changes despite stable structural and cellular modeled states'],
    patientSpecificInputs: ['Echocardiography or CMR', 'Pressure/load measurements or surrogates', 'ECG/electrophysiology context', 'Fibrosis biomarkers or tissue data when available'],
    references: [
      { label: 'T-World virtual human cardiomyocyte to organ-scale simulations (Circulation Research 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41948815/', evidence: 'clinical-computational' },
      { label: 'GPU cardiac digital twin solver (Scientific Reports 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41708641/', evidence: 'clinical-computational' },
    ],
  },
  {
    id: 'egfr-mapk-tumor',
    label: 'EGFR–MAPK tumor signaling',
    subtitle: 'Receptor drive → ERK output → proliferation → apoptosis resistance → tumor fitness',
    description: 'A pathway-centered oncology hypothesis sandbox. It demonstrates how a molecular perturbation can propagate to a cellular and tissue phenotype without pretending to predict clinical response.',
    focusKeywords: ['lung', 'bronch', 'lymph'],
    layers: ['visceral', 'lymphoid', 'cardiovascular'],
    motion: { heartRate: 76, respRate: 17, contractionRate: 0, peristalsisRate: 4 },
    nodes: [
      { id: 'egfr', label: 'EGFR pathway drive', scale: 'molecule', baseline: 0.55, uncertainty: 0.15, description: 'Normalized receptor/pathway activation.' },
      { id: 'erk', label: 'ERK output', scale: 'molecule', baseline: 0.52, uncertainty: 0.14, description: 'Downstream MAPK pathway output.' },
      { id: 'prolif', label: 'Proliferation', scale: 'cell', baseline: 0.58, uncertainty: 0.16, description: 'Relative proliferative state.' },
      { id: 'apoptosis', label: 'Apoptosis competence', scale: 'cell', baseline: 0.42, uncertainty: 0.16, description: 'Relative ability to execute cell death programs.' },
      { id: 'angiogenesis', label: 'Angiogenic support', scale: 'tissue', baseline: 0.48, uncertainty: 0.15, description: 'Schematic microenvironment vascular support.' },
      { id: 'immune', label: 'Immune pressure', scale: 'tissue', baseline: 0.44, uncertainty: 0.18, description: 'Relative immune-mediated pressure on tumor cells.' },
      { id: 'fitness', label: 'Tumor fitness', scale: 'phenotype', baseline: 0.56, uncertainty: 0.2, description: 'Composite educational state, not tumor-size prediction.' },
    ],
    edges: [
      { from: 'egfr', to: 'erk', sign: 1, weight: 0.8, mechanism: 'EGFR can activate RAS–RAF–MEK–ERK signaling.' },
      { from: 'erk', to: 'prolif', sign: 1, weight: 0.7, mechanism: 'MAPK output can promote proliferation programs.' },
      { from: 'erk', to: 'apoptosis', sign: -1, weight: 0.42, mechanism: 'Pro-survival signaling can reduce apoptosis competence.' },
      { from: 'prolif', to: 'fitness', sign: 1, weight: 0.58, mechanism: 'Higher proliferative activity increases tumor fitness in this schematic.' },
      { from: 'apoptosis', to: 'fitness', sign: -1, weight: 0.52, mechanism: 'Apoptosis competence restrains fitness.' },
      { from: 'angiogenesis', to: 'fitness', sign: 1, weight: 0.36, mechanism: 'Microenvironmental vascular support can sustain growth.' },
      { from: 'immune', to: 'fitness', sign: -1, weight: 0.38, mechanism: 'Immune pressure can constrain tumor fitness.' },
    ],
    perturbations: [
      { id: 'egfr-up', label: 'Increase EGFR drive', target: 'egfr', direction: 1, defaultMagnitude: 0.35, rationale: 'Explore pathway dependence.' },
      { id: 'egfr-down', label: 'Reduce EGFR drive', target: 'egfr', direction: -1, defaultMagnitude: 0.4, rationale: 'Virtual target perturbation only; not a treatment predictor.' },
      { id: 'immune-up', label: 'Increase immune pressure', target: 'immune', direction: 1, defaultMagnitude: 0.25, rationale: 'Explore microenvironment interaction separately from tumor-intrinsic signaling.' },
    ],
    objectiveNode: 'fitness',
    falsificationMeasurements: ['Phosphoproteomic ERK output does not change with EGFR perturbation', 'Proliferation/apoptosis markers move opposite to the modeled direction', 'Tumor-state change is dominated by an unmodeled pathway or microenvironment mechanism'],
    patientSpecificInputs: ['Normalized variant identifier and molecular annotation', 'Tumor histology and spatial context', 'Expression/phosphoproteomic data when available', 'Longitudinal imaging and treatment timeline'],
    references: [
      { label: 'Multiscale predictive cellular modeling, digital twins and multi-omics (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42213163/', evidence: 'mechanistic' },
      { label: 'CURE principles for verification, validation and uncertainty (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41888157/', evidence: 'mechanistic' },
    ],
  },
  {
    id: 'glomerular-injury',
    label: 'Glomerular injury cascade',
    subtitle: 'Pressure → podocyte stress → albumin leak → inflammation → fibrosis → filtration reserve',
    description: 'A kidney micro-to-organ bridge showing how a glomerular perturbation can propagate toward chronic tissue remodeling.',
    focusKeywords: ['kidney', 'renal', 'ureter'],
    layers: ['visceral', 'cardiovascular'],
    motion: { heartRate: 74, respRate: 14, contractionRate: 0, peristalsisRate: 5 },
    nodes: [
      { id: 'glomerular-pressure', label: 'Glomerular pressure', scale: 'tissue', baseline: 0.38, uncertainty: 0.12, description: 'Normalized intraglomerular mechanical load.' },
      { id: 'podocyte', label: 'Podocyte integrity', scale: 'cell', baseline: 0.84, uncertainty: 0.12, description: 'Schematic podocyte barrier integrity.' },
      { id: 'albumin', label: 'Albumin leak', scale: 'phenotype', baseline: 0.14, uncertainty: 0.14, description: 'Normalized glomerular permeability burden.' },
      { id: 'inflammation', label: 'Inflammatory signaling', scale: 'molecule', baseline: 0.2, uncertainty: 0.16, description: 'Relative inflammatory drive.' },
      { id: 'fibrosis-kidney', label: 'Interstitial fibrosis', scale: 'tissue', baseline: 0.18, uncertainty: 0.16, description: 'Normalized fibrosis burden.' },
      { id: 'nephron-reserve', label: 'Nephron reserve', scale: 'organ', baseline: 0.82, uncertainty: 0.13, description: 'Schematic remaining functional reserve.' },
      { id: 'filtration', label: 'Filtration reserve', scale: 'phenotype', baseline: 0.84, uncertainty: 0.14, description: 'Normalized functional reserve, not eGFR.' },
    ],
    edges: [
      { from: 'glomerular-pressure', to: 'podocyte', sign: -1, weight: 0.62, mechanism: 'Mechanical stress can injure the filtration barrier.' },
      { from: 'podocyte', to: 'albumin', sign: -1, weight: 0.72, mechanism: 'Barrier integrity restrains albumin leakage.' },
      { from: 'albumin', to: 'inflammation', sign: 1, weight: 0.46, mechanism: 'Protein exposure can promote tubular/interstitial inflammatory signaling.' },
      { from: 'inflammation', to: 'fibrosis-kidney', sign: 1, weight: 0.58, delay: 1, mechanism: 'Chronic inflammation can promote fibrotic remodeling.' },
      { from: 'fibrosis-kidney', to: 'nephron-reserve', sign: -1, weight: 0.6, mechanism: 'Fibrosis reduces functional tissue reserve.' },
      { from: 'nephron-reserve', to: 'filtration', sign: 1, weight: 0.68, mechanism: 'Nephron reserve supports filtration capacity.' },
    ],
    perturbations: [
      { id: 'pressure-up', label: 'Increase glomerular pressure', target: 'glomerular-pressure', direction: 1, defaultMagnitude: 0.35, rationale: 'Explore mechanical injury propagation.' },
      { id: 'podocyte-support', label: 'Improve podocyte integrity', target: 'podocyte', direction: 1, defaultMagnitude: 0.22, rationale: 'Research-only barrier-resilience perturbation.' },
      { id: 'inflammation-down', label: 'Reduce inflammatory drive', target: 'inflammation', direction: -1, defaultMagnitude: 0.28, rationale: 'Explore downstream remodeling sensitivity.' },
    ],
    objectiveNode: 'filtration',
    falsificationMeasurements: ['Albuminuria changes without the modeled barrier-state change', 'Fibrosis evolves independently of inflammatory or injury markers', 'Functional filtration changes are driven by acute hemodynamics rather than structural reserve'],
    patientSpecificInputs: ['Urine albumin/protein data', 'Serum creatinine/cystatin context', 'Renal imaging and blood pressure', 'Biopsy or genomic data only when clinically obtained'],
    references: [
      { label: 'CURE computational model principles (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/41888157/', evidence: 'mechanistic' },
      { label: 'Multiscale predictive cellular modeling review (2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42213163/', evidence: 'mechanistic' },
    ],
  },
]

function seededNoise(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

function incomingFor(scenario: CounterfactualScenario, nodeId: string) {
  return scenario.edges.filter((edge) => edge.to === nodeId)
}

export function simulateCounterfactual(
  scenario: CounterfactualScenario,
  targetId: string,
  signedMagnitude: number,
  steps = 8,
): CounterfactualFrame[] {
  const frames: CounterfactualFrame[] = []
  const initial: Record<string, NodeState> = {}
  for (const node of scenario.nodes) {
    initial[node.id] = {
      value: node.baseline,
      low: clamp01(node.baseline - node.uncertainty),
      high: clamp01(node.baseline + node.uncertainty),
      delta: 0,
    }
  }
  frames.push({ step: 0, states: initial })

  for (let step = 1; step <= steps; step += 1) {
    const previous = frames[step - 1].states
    const next: Record<string, NodeState> = {}
    for (let nodeIndex = 0; nodeIndex < scenario.nodes.length; nodeIndex += 1) {
      const node = scenario.nodes[nodeIndex]
      let drive = 0
      for (const edge of incomingFor(scenario, node.id)) {
        const sourceStep = Math.max(0, step - 1 - (edge.delay ?? 0))
        const source = frames[sourceStep].states[edge.from]
        const sourceNode = scenario.nodes.find((item) => item.id === edge.from)
        if (!source || !sourceNode) continue
        drive += (source.value - sourceNode.baseline) * edge.weight * edge.sign
      }
      const perturbation = node.id === targetId ? signedMagnitude * Math.exp(-(step - 1) * 0.06) : 0
      const inertia = 0.72
      const modeled = clamp01(previous[node.id].value * inertia + node.baseline * (1 - inertia) + drive * 0.34 + perturbation * 0.26)
      const spread = clamp01(node.uncertainty + Math.abs(drive) * 0.12 + Math.abs(perturbation) * 0.08)
      const jitter = seededNoise(step * 100 + nodeIndex * 17) * spread * 0.05
      const value = clamp01(modeled + jitter)
      next[node.id] = {
        value,
        low: clamp01(value - spread),
        high: clamp01(value + spread),
        delta: value - node.baseline,
      }
    }
    frames.push({ step, states: next })
  }
  return frames
}

export function rankLeverage(scenario: CounterfactualScenario, objectiveId = scenario.objectiveNode) {
  const nodeMap = new Map(scenario.nodes.map((node) => [node.id, node]))
  const memo = new Map<string, number>()

  function score(id: string, visited = new Set<string>()): number {
    if (id === objectiveId) return 1
    if (memo.has(id)) return memo.get(id) ?? 0
    if (visited.has(id)) return 0
    const nextVisited = new Set(visited)
    nextVisited.add(id)
    let total = 0
    for (const edge of scenario.edges.filter((item) => item.from === id)) {
      total += Math.abs(edge.weight) * score(edge.to, nextVisited) * 0.82
    }
    memo.set(id, total)
    return total
  }

  return scenario.nodes
    .filter((node) => node.id !== objectiveId)
    .map((node) => ({ node, score: Math.min(1, score(node.id)) }))
    .filter((item) => item.score > 0.03 && nodeMap.has(item.node.id))
    .sort((a, b) => b.score - a.score)
}

export function changedNodes(scenario: CounterfactualScenario, frame: CounterfactualFrame) {
  return scenario.nodes
    .map((node) => ({ node, state: frame.states[node.id] }))
    .filter((item) => item.state)
    .sort((a, b) => Math.abs(b.state.delta) - Math.abs(a.state.delta))
}

export function scaleLabel(scale: BiologyScale) {
  return ({
    molecule: 'Molecule / pathway',
    organelle: 'Organelle',
    cell: 'Cell',
    tissue: 'Tissue / microenvironment',
    organ: 'Organ / system',
    phenotype: 'Observable phenotype',
  } as const)[scale]
}
