export type FrontierCategory =
  | 'clinical-intelligence'
  | 'precision-medicine'
  | 'patient-sovereignty'
  | 'care-automation'
  | 'privacy-infrastructure'
  | 'population-health'

export type FrontierStatus = 'scaffold' | 'integration-ready' | 'external-adapter' | 'research-only'
export type HumanGate = 'none' | 'clinician-review' | 'patient-consent' | 'research-governance'

export interface FrontierFeature {
  id: string
  label: string
  category: FrontierCategory
  status: FrontierStatus
  mission: string
  inputs: string[]
  outputs: string[]
  visualTarget: string
  integrations: string[]
  humanGate: HumanGate
  safetyBoundary: string
}

/**
 * Frontier systems intentionally describe architecture, contracts and UI targets.
 * They do not claim that an external clinical model, hospital interface or certified
 * medical device exists until an adapter has actually been connected and validated.
 */
export const FRONTIER_FEATURES: FrontierFeature[] = [
  {
    id: 'ambient-multimodal-visit',
    label: 'Ambient Multimodal Visit Intelligence',
    category: 'clinical-intelligence',
    status: 'external-adapter',
    mission: 'Turn a clinician-patient encounter into a reviewed draft timeline, medication reconciliation, findings, questions and follow-up plan using audio plus optional visual context.',
    inputs: ['consented audio', 'optional video/image context', 'EHR context', 'medication list'],
    outputs: ['draft note', 'structured findings', 'medication reconciliation candidates', 'patient-facing recap', 'uncertainty flags'],
    visualTarget: 'Live encounter timeline with source-linked transcript spans, detected entities and a mandatory review queue.',
    integrations: ['EMR', 'Translator', 'Knowledge Bridge', 'Medication Reminders'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Never silently write diagnoses, medications or orders into the permanent record. Every generated clinical fact must be source-linked and reviewable.',
  },
  {
    id: 'living-health-twin',
    label: 'Living Health State Twin',
    category: 'precision-medicine',
    status: 'scaffold',
    mission: 'Maintain a time-aware representation of measured patient state across organ, physiology, behavior, biomarkers and treatment history.',
    inputs: ['FHIR observations', 'wearables', 'labs', 'imaging summaries', 'medications', 'symptoms', 'genomics'],
    outputs: ['state timeline', 'data freshness', 'uncertainty map', 'organ/system state layers'],
    visualTarget: 'A whole-body 3D timeline whose layers change only when measured or explicitly modeled data support the change.',
    integrations: ['Body Explorer', 'Biomedical Engine', 'Health Profile', 'Longevity', 'PusatJiwa'],
    humanGate: 'none',
    safetyBoundary: 'A digital representation of available data is not a complete simulation of the human body and must not be presented as one.',
  },
  {
    id: 'causal-counterfactual-lab',
    label: 'Causal Counterfactual Lab',
    category: 'clinical-intelligence',
    status: 'research-only',
    mission: 'Separate prediction from causal questions and show what evidence would be required to estimate how outcomes might differ under alternative interventions.',
    inputs: ['explicit causal graph', 'treatment/exposure history', 'outcomes', 'confounders', 'study evidence'],
    outputs: ['estimand', 'assumption checklist', 'counterfactual scenarios', 'uncertainty interval', 'unsupported-assumption warnings'],
    visualTarget: 'Interactive DAG plus side-by-side observed versus hypothetical trajectories with assumptions always visible.',
    integrations: ['Evidence', 'Knowledge Bridge', 'Longevity', 'Clinical Trials'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Do not calculate or present individualized treatment effects unless the causal model, data provenance and validation are explicitly available.',
  },
  {
    id: 'clinical-trial-match',
    label: 'Explainable Clinical Trial Match',
    category: 'precision-medicine',
    status: 'external-adapter',
    mission: 'Match a patient profile to recruiting studies and explain eligibility criterion by criterion.',
    inputs: ['diagnoses', 'stage/severity', 'biomarkers', 'prior therapies', 'labs', 'age', 'location', 'trial registry feed'],
    outputs: ['ranked trials', 'criterion-level match', 'missing-data checklist', 'distance/contact details', 'clinician packet'],
    visualTarget: 'Eligibility matrix where every green/red/unknown cell links to the patient datum and trial criterion that produced it.',
    integrations: ['ClinicalTrials.gov adapter', 'Biomedical Engine', 'Genomics Lab', 'Second Opinion'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Matching is screening support, not enrollment approval; site investigators determine eligibility.',
  },
  {
    id: 'federated-health-network',
    label: 'Federated Health Learning Network',
    category: 'privacy-infrastructure',
    status: 'research-only',
    mission: 'Enable institutions to collaborate on model improvement without centralizing raw patient data.',
    inputs: ['local model updates', 'data-quality metadata', 'site performance metrics', 'privacy policy'],
    outputs: ['aggregated model version', 'site drift report', 'audit trail', 'privacy/accountability metadata'],
    visualTarget: 'Network map showing hospitals as local nodes, model versions, drift and governance status without exposing raw records.',
    integrations: ['Data Lab', 'Owner Analytics', 'Verification'],
    humanGate: 'research-governance',
    safetyBoundary: 'Federated learning does not itself guarantee privacy, fairness or immunity to poisoning; governance, secure aggregation and validation remain mandatory.',
  },
  {
    id: 'verifiable-health-wallet',
    label: 'Patient-Controlled Verifiable Health Wallet',
    category: 'patient-sovereignty',
    status: 'external-adapter',
    mission: 'Let people carry cryptographically verifiable health claims and selectively present only what a verifier needs.',
    inputs: ['signed health credential', 'issuer metadata', 'status/revocation information', 'patient consent'],
    outputs: ['selective presentation', 'verification result', 'provenance', 'sharing receipt'],
    visualTarget: 'Wallet of vaccination, allergy, medication, imaging-summary and emergency credentials with selective disclosure controls.',
    integrations: ['FHIR', 'Emergency Card', 'Health Profile', 'Verification'],
    humanGate: 'patient-consent',
    safetyBoundary: 'The wallet verifies issuer/authenticity and integrity, not the clinical truth of every claim.',
  },
  {
    id: 'hospital-at-home-command',
    label: 'Hospital-at-Home Command Center',
    category: 'care-automation',
    status: 'external-adapter',
    mission: 'Coordinate remote monitoring, home visits, diagnostics and escalation while explicitly tracking device reliability and missing data.',
    inputs: ['wearables/IoMT', 'scheduled observations', 'home-care tasks', 'device connectivity', 'clinical thresholds'],
    outputs: ['patient state board', 'task queue', 'device-health warnings', 'escalation recommendation', 'handoff packet'],
    visualTarget: 'Command-center board with patient cards, sensor confidence, trends, task ownership and escalation ladder.',
    integrations: ['Connect', 'Notifications', 'Consult', 'Hospitals', 'Marketplace'],
    humanGate: 'clinician-review',
    safetyBoundary: 'No emergency disposition or treatment change should be executed solely because a consumer sensor crossed a threshold.',
  },
  {
    id: 'spatial-omics-pathology',
    label: 'Spatial Omics + Digital Pathology Atlas',
    category: 'precision-medicine',
    status: 'external-adapter',
    mission: 'Link whole-slide pathology, tissue regions, cell phenotypes and spatial molecular measurements into one inspectable map.',
    inputs: ['WSI', 'segmentation', 'spatial transcriptomics/proteomics', 'pathology annotations', 'molecular results'],
    outputs: ['region/cell map', 'spatial biomarker layers', 'pathway overlays', 'provenance', 'exportable research features'],
    visualTarget: 'Zoom WSI → tissue architecture → cell neighborhood → pathway/gene overlay, synchronized with organ and body context.',
    integrations: ['Radiology', 'Cell Lab', 'Biomedical Engine', 'Body Explorer'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Foundation-model features are decision support/research outputs unless clinically validated for the exact task and population.',
  },
  {
    id: 'care-agent-orchestrator',
    label: 'Human-Gated Care Agent Orchestrator',
    category: 'care-automation',
    status: 'scaffold',
    mission: 'Turn an agreed care plan into coordinated tasks across booking, labs, imaging, pharmacy, reminders and follow-up.',
    inputs: ['clinician-approved plan', 'patient preferences', 'availability', 'insurance/cost rules', 'care constraints'],
    outputs: ['task graph', 'booking candidates', 'reminders', 'dependency alerts', 'completion timeline'],
    visualTarget: 'Executable care graph where each node has owner, prerequisite, consent state, status and rollback/cancel controls.',
    integrations: ['Planning', 'Orders', 'Hospitals', 'Pharmacy', 'Marketplace', 'Notifications'],
    humanGate: 'patient-consent',
    safetyBoundary: 'Automation coordinates approved actions; it does not invent a new diagnosis, prescription or procedure.',
  },
  {
    id: 'medication-closed-loop',
    label: 'Closed-Loop Medication Journey',
    category: 'care-automation',
    status: 'scaffold',
    mission: 'Connect prescribed → dispensed → taken → response → adverse effect → review as one longitudinal medication object.',
    inputs: ['prescription', 'dispensing data', 'patient confirmation', 'wearable/lab response', 'adverse-effect report'],
    outputs: ['adherence evidence', 'response timeline', 'side-effect timeline', 'reconciliation flags', 'review prompts'],
    visualTarget: 'One medication ribbon spanning prescription, pharmacy, actual use, biomarker response and outcomes.',
    integrations: ['Pharmacy', 'Orders', 'Medication Reminders', 'Health Profile', 'Knowledge Bridge'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Adherence inference must distinguish directly observed, patient-reported and algorithmically inferred events.',
  },
  {
    id: 'personal-medical-graph',
    label: 'Personal Medical Knowledge Graph',
    category: 'clinical-intelligence',
    status: 'scaffold',
    mission: 'Create a patient-specific graph linking symptoms, findings, diagnoses, anatomy, pathways, genes, drugs, evidence, clinicians, facilities and costs.',
    inputs: ['FHIR/EMR', 'knowledge sources', 'patient-entered data', 'Panacea modules'],
    outputs: ['typed graph', 'source provenance', 'relationship explanations', 'missing-link alerts'],
    visualTarget: 'Zoomable graph that can collapse from clinical overview to molecular mechanism or care logistics.',
    integrations: ['Knowledge Bridge', 'Body Explorer', 'Biomedical Engine', 'Marketplace'],
    humanGate: 'none',
    safetyBoundary: 'Graph edges must distinguish observed facts, documented clinician assertions, guideline knowledge and model-generated hypotheses.',
  },
  {
    id: 'diagnostic-journey-replay',
    label: 'Diagnostic Journey Replay',
    category: 'clinical-intelligence',
    status: 'scaffold',
    mission: 'Reconstruct how the differential diagnosis changed as new evidence arrived.',
    inputs: ['timestamped symptoms', 'exam', 'labs', 'imaging', 'notes', 'final diagnosis'],
    outputs: ['timeline', 'evidence pivots', 'remaining uncertainty', 'alternative branches'],
    visualTarget: 'Replayable branching timeline that explains why possibilities rose or fell without pretending to know undocumented clinician reasoning.',
    integrations: ['EMR', 'Radiology', 'Clinical Scores', 'Knowledge Bridge'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Never attribute a rationale to a clinician unless it is documented; reconstructed reasoning must be labeled as reconstruction.',
  },
  {
    id: 'decision-time-machine',
    label: 'Decision Time Machine',
    category: 'clinical-intelligence',
    status: 'scaffold',
    mission: 'Preserve what was known, which options existed and why a decision was made at a specific moment, then compare later outcomes.',
    inputs: ['decision timestamp', 'available evidence', 'options', 'preferences', 'decision', 'later outcomes'],
    outputs: ['decision snapshot', 'counterfactual questions', 'outcome review', 'learning log'],
    visualTarget: 'Before/decision/after storyboard with versioned evidence and explicit uncertainty.',
    integrations: ['Knowledge Bridge', 'Second Opinion', 'Care Episode'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Outcome review must avoid hindsight bias and should not imply that a bad outcome proves a past decision was wrong.',
  },
  {
    id: 'family-health-graph',
    label: 'Family Health Graph',
    category: 'precision-medicine',
    status: 'scaffold',
    mission: 'Unify pedigree, shared environment, caregiving and preventive-care gaps without collapsing genetics and environment into one risk score.',
    inputs: ['family relationships', 'consented histories', 'genetic findings', 'shared exposures', 'screening history'],
    outputs: ['pedigree', 'shared-exposure map', 'screening prompts', 'inheritance visualization'],
    visualTarget: 'Pedigree + household network with separate genetic, environmental and care layers.',
    integrations: ['Family Health', 'Genomics Lab', 'Preventive/Longevity'],
    humanGate: 'patient-consent',
    safetyBoundary: 'Never expose one family member’s private health information to another without explicit authorization.',
  },
  {
    id: 'evidence-conflict-map',
    label: 'Evidence Conflict Visualizer',
    category: 'clinical-intelligence',
    status: 'scaffold',
    mission: 'Show where guidelines, randomized trials, observational evidence and patient-specific data agree, disagree or do not apply.',
    inputs: ['guidelines', 'trials', 'systematic reviews', 'observational studies', 'patient context'],
    outputs: ['agreement map', 'applicability warnings', 'effect estimates', 'uncertainty'],
    visualTarget: 'Evidence constellation with direction, effect size, certainty, population similarity and update date.',
    integrations: ['PusatRujukan', 'Knowledge Bridge', 'Second Opinion'],
    humanGate: 'clinician-review',
    safetyBoundary: 'Do not average incompatible studies into a single score merely to remove disagreement.',
  },
  {
    id: 'consent-3d-preview',
    label: '3D Consent + Procedure Preview',
    category: 'patient-sovereignty',
    status: 'integration-ready',
    mission: 'Connect diagnosis to patient-specific or teaching anatomy, procedure steps, alternatives, benefits, risks and recovery using understandable visual explanations.',
    inputs: ['procedure', 'diagnosis', 'available patient imaging/segmentation', 'teaching anatomy', 'consent content'],
    outputs: ['3D preview', 'risk structures', 'alternatives', 'teach-back prompts', 'consent comprehension record'],
    visualTarget: 'Normal anatomy → pathology → procedure corridor → structures at risk → recovery timeline.',
    integrations: ['Body Explorer', 'Surgical Lab', 'Radiology', 'Knowledge Bridge'],
    humanGate: 'patient-consent',
    safetyBoundary: 'Teaching anatomy must never be shown as if it were the patient’s anatomy when no patient-specific segmentation exists.',
  },
  {
    id: 'privacy-synthetic-sandbox',
    label: 'Privacy-Preserving Synthetic Cohort Sandbox',
    category: 'privacy-infrastructure',
    status: 'research-only',
    mission: 'Create and evaluate synthetic research cohorts with explicit utility, privacy leakage and subgroup-fidelity checks.',
    inputs: ['approved source schema/data', 'privacy policy', 'generation method', 'validation plan'],
    outputs: ['synthetic dataset', 'utility report', 'privacy-risk report', 'subgroup fidelity report', 'provenance'],
    visualTarget: 'Privacy–utility dashboard showing distributional similarity, rare-subgroup performance and attack-risk tests.',
    integrations: ['Data Lab', 'Owner Analytics', 'Research workspace'],
    humanGate: 'research-governance',
    safetyBoundary: 'Synthetic does not automatically mean anonymous or safe; release requires empirical privacy evaluation and governance.',
  },
  {
    id: 'digital-phenotype-stream',
    label: 'Consent-Based Digital Phenotype Stream',
    category: 'precision-medicine',
    status: 'external-adapter',
    mission: 'Combine voice, gait, sleep, activity and other passive signals as longitudinal measurements while preserving explicit consent and provenance.',
    inputs: ['voice features', 'gait/motion', 'sleep', 'activity', 'device metadata'],
    outputs: ['feature timeline', 'device-confidence labels', 'change detection', 'research correlations'],
    visualTarget: 'Human timeline with synchronized signal ribbons and confidence bands rather than opaque disease scores.',
    integrations: ['Vocal Biomarkers', 'Movement', 'Sleep', 'Readiness', 'PusatJiwa'],
    humanGate: 'patient-consent',
    safetyBoundary: 'Digital biomarkers are not diagnoses unless a specific validated clinical use has been established.',
  },
  {
    id: 'care-capacity-exchange',
    label: 'Real-Time Care Capacity Exchange',
    category: 'care-automation',
    status: 'external-adapter',
    mission: 'Coordinate available doctors, home visits, labs, imaging slots, beds, operating rooms, rehabilitation and pharmacy fulfillment around a care plan.',
    inputs: ['provider availability', 'facility capacity', 'location', 'patient constraints', 'care requirements', 'price/coverage'],
    outputs: ['feasible care routes', 'time-to-care', 'cost estimate', 'booking candidates', 'bottleneck alerts'],
    visualTarget: 'Map + timeline showing multiple medically appropriate routes and their time/cost/friction trade-offs.',
    integrations: ['Marketplace', 'Hospitals', 'Consult', 'Orders', 'Planning'],
    humanGate: 'patient-consent',
    safetyBoundary: 'Optimization may rank logistics only after medical appropriateness constraints are satisfied.',
  },
  {
    id: 'population-signal-radar',
    label: 'Population Health Signal Radar',
    category: 'population-health',
    status: 'research-only',
    mission: 'Detect aggregate shifts in symptoms, syndromes, air quality, wearables and service demand while protecting individual privacy.',
    inputs: ['de-identified/aggregated events', 'environmental data', 'service demand', 'public health feeds'],
    outputs: ['trend anomalies', 'geographic clusters', 'confidence', 'data-quality caveats'],
    visualTarget: 'Privacy-preserving regional heatmap with time slider, syndrome layers and data-source confidence.',
    integrations: ['Air Quality', 'Notifications', 'Owner Analytics', 'Public-health adapters'],
    humanGate: 'research-governance',
    safetyBoundary: 'Signals are not outbreak declarations; public-health interpretation requires appropriate authorities and validation.',
  },
]

export const FRONTIER_CATEGORIES: Array<{ key: FrontierCategory; label: string }> = [
  { key: 'clinical-intelligence', label: 'Clinical intelligence' },
  { key: 'precision-medicine', label: 'Precision medicine' },
  { key: 'patient-sovereignty', label: 'Patient sovereignty' },
  { key: 'care-automation', label: 'Care automation' },
  { key: 'privacy-infrastructure', label: 'Privacy infrastructure' },
  { key: 'population-health', label: 'Population health' },
]

export function frontierFeature(id: string): FrontierFeature | undefined {
  return FRONTIER_FEATURES.find((feature) => feature.id === id)
}

export function frontierByCategory(category: FrontierCategory): FrontierFeature[] {
  return FRONTIER_FEATURES.filter((feature) => feature.category === category)
}

export function readinessPercent(feature: FrontierFeature): number {
  switch (feature.status) {
    case 'integration-ready': return 75
    case 'scaffold': return 45
    case 'external-adapter': return 30
    case 'research-only': return 15
  }
}
