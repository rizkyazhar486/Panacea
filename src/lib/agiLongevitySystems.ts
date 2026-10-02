export type AgiLongevityDomainId =
  | 'whole-cell-digital-twin'
  | 'generative-macromolecules'
  | 'autonomous-wet-lab'
  | 'adaptive-biomarker-control'

export type FrontierEvidenceState = 'established-component' | 'emerging' | 'experimental' | 'hypothesis' | 'unsolved'

export interface EvidenceAnchor {
  pmid: string
  label: string
  relevance: string
}

export interface AgiLongevityDomain {
  id: AgiLongevityDomainId
  title: string
  evidence: FrontierEvidenceState
  problem: string
  agiRole: string
  visualModel: string
  candidateCapabilities: readonly string[]
  hardBottlenecks: readonly string[]
  falsificationChecks: readonly string[]
  evidenceAnchors: readonly EvidenceAnchor[]
}

export const AGI_LONGEVITY_DOMAINS: readonly AgiLongevityDomain[] = [
  {
    id: 'whole-cell-digital-twin',
    title: 'Autonomous whole-cell / multi-organ digital twin',
    evidence: 'emerging',
    problem: 'Integrating longitudinal multi-omics, cellular state, organ physiology and cross-system feedback into a calibrated causal model remains unsolved; current digital twins are bounded approximations rather than atomistic replicas of a person.',
    agiRole: 'Coordinate heterogeneous models, update uncertainty as new data arrive, search counterfactual intervention spaces and expose compensation rather than assuming one pathway can be optimized in isolation.',
    visualModel: 'Multiscale causal graph with organ nodes, molecular subgraphs, uncertainty bands and intervention propagation rather than fabricated atom-by-atom anatomy.',
    candidateCapabilities: ['systemic compensation mapping', 'counterfactual cohort simulation', 'organ-age coupling hypotheses', 'multi-omics state assimilation'],
    hardBottlenecks: ['causal identifiability', 'cross-scale parameterization', 'transportability', 'missing longitudinal data', 'model drift', 'clinical end-use validation'],
    falsificationChecks: ['predictions fail prospectively', 'effects do not transport across cohorts', 'counterfactuals disagree with intervention data', 'uncertainty is systematically miscalibrated'],
    evidenceAnchors: [
      { pmid: '42409290', label: 'Precision geromedicine and organ-age frameworks', relevance: 'Supports multi-omic organ-age modeling while explicitly warning that cross-organ coupling and future digital twins require staged validation.' },
    ],
  },
  {
    id: 'generative-macromolecules',
    title: 'Generative macromolecules & synthetic organelles',
    evidence: 'experimental',
    problem: 'Generative models can propose proteins and biologics, but system-level function, folding context, immunogenicity, membrane environment, manufacturability and in-vivo efficacy remain major gaps.',
    agiRole: 'Search sequence/structure/function spaces jointly with developability and system-level constraints, then route candidates into experimentally grounded lab-in-the-loop validation.',
    visualModel: 'Design-space explorer linking structure confidence, biochemical function, developability, immunogenicity and in-vivo uncertainty; verified PDB/mmCIF coordinates only when actually available.',
    candidateCapabilities: ['de-novo repair-complex hypotheses', 'aggregate-clearing binder concepts', 'synthetic metabolic modules', 'bioenergetic subsystem hypotheses'],
    hardBottlenecks: ['binding-function discordance', 'structural hallucination', 'post-translational context', 'immunogenicity', 'cellular delivery', 'systemic toxicity'],
    falsificationChecks: ['designed structure fails experimental structure', 'binding does not produce intended function', 'candidate loses function in cellular context', 'developability or safety fails'],
    evidenceAnchors: [
      { pmid: '42453397', label: 'AI in biologic drug discovery', relevance: 'Reviews de-novo biologic design and the remaining molecular-to-systemic complexity gap.' },
      { pmid: '42438781', label: 'Generative AI antibody engineering', relevance: 'Highlights structural hallucination, missing biological context and the need for lab-in-the-loop validation.' },
    ],
  },
  {
    id: 'autonomous-wet-lab',
    title: 'Closed-loop autonomous wet-lab discovery',
    evidence: 'emerging',
    problem: 'Self-driving laboratories can automate substantial parts of scientific iteration, but biological safety, assay validity, cybersecurity, reproducibility, governance and human accountability limit autonomous biomedical deployment.',
    agiRole: 'Prioritize hypotheses, choose information-rich experiments, update models from measured results and stop when safety, reproducibility or authorization gates fail.',
    visualModel: 'Closed-loop state machine: hypothesis → approved experiment → measured data → model update → replication gate → next hypothesis, with human authorization nodes that cannot be bypassed.',
    candidateCapabilities: ['adaptive experiment selection', 'multi-objective senescence-screen planning', 'reprogramming hypothesis ranking', 'replication-aware experimental scheduling'],
    hardBottlenecks: ['biosafety', 'assay validity', 'robotic error', 'cybersecurity', 'reproducibility', 'human accountability', 'regulatory oversight'],
    falsificationChecks: ['replication fails', 'automated assay drifts', 'model-selected experiments do not improve information gain', 'safety gate is triggered'],
    evidenceAnchors: [
      { pmid: '40852582', label: 'Autonomous self-driving laboratories review', relevance: 'Documents increasingly complete automated scientific loops while emphasizing human accountability, safety and cybersecurity.' },
    ],
  },
  {
    id: 'adaptive-biomarker-control',
    title: 'Real-time adaptive biomarker regulation',
    evidence: 'hypothesis',
    problem: 'Continuous sensing and predictive control may support earlier detection and adaptive research, but reliable molecular sensing, causal targets, safe actuators, latency, calibration and prospective outcome validation are unresolved.',
    agiRole: 'Fuse longitudinal signals, estimate latent state and compare bounded control policies in simulation while refusing autonomous treatment execution without validated sensing, actuation and clinical governance.',
    visualModel: 'Homeostatic control diagram with sensor confidence, latent-state estimate, intervention sandbox, delay/noise, safety envelope and explicit no-actuation mode.',
    candidateCapabilities: ['pre-pathology signal detection', 'adaptive monitoring hypotheses', 'homeostatic control simulations', 'biomarker drift detection'],
    hardBottlenecks: ['sensor validity', 'causal biomarker meaning', 'false positives', 'actuator safety', 'latency', 'feedback instability', 'clinical outcome validation'],
    falsificationChecks: ['signal does not predict future state prospectively', 'control policy destabilizes simulated system', 'benefit disappears under sensor noise', 'biomarker change fails to map to meaningful outcome'],
    evidenceAnchors: [
      { pmid: '42409290', label: 'Precision geromedicine and organ-age frameworks', relevance: 'Supports cautious multi-modal aging measurement while warning against over-interpreting static or weakly validated biomarkers.' },
    ],
  },
] as const

export interface AgiReadinessInputs {
  modelFidelity: number
  experimentalGrounding: number
  actuationControl: number
  prospectiveValidation: number
}

export function evaluateAgiResearchReadiness(input: AgiReadinessInputs) {
  const values = [input.modelFidelity, input.experimentalGrounding, input.actuationControl, input.prospectiveValidation]
    .map((value) => Math.max(0, Math.min(100, value)))
  const weakestLink = Math.min(...values)
  const geometric = Math.round(Math.pow(values.reduce((product, value) => product * Math.max(value, 1), 1), 1 / values.length))
  return {
    weakestLink,
    composite: geometric,
    researchGate: weakestLink >= 75 && input.prospectiveValidation >= 85,
  }
}

export const AGI_LONGEVITY_BOUNDARY =
  'Research orchestration sandbox only. Panacea does not claim AGI, a whole-person atomistic digital twin, valid in-silico replacement of human clinical trials, autonomous wet-lab authority, autonomous dosing, biological immortality, or clinically validated rejuvenation. All intervention outputs are conceptual and require real experimental and prospective validation.'
