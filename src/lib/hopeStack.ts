export type HopeDomainKey =
  | 'mental-health'
  | 'geroscience-pharma'
  | 'regenerative-medicine'
  | 'early-detection'
  | 'longevity-care'
  | 'predictive-ai'
  | 'longevity-finance'
  | 'aging-technology'
  | 'longevity-infrastructure'

export type HopeStatus = 'usable-now' | 'integration-ready' | 'research-only' | 'policy-scenario'
export type HopeGate = 'self-directed' | 'clinician-review' | 'research-governance' | 'policy-review'

export interface HopeReference {
  label: string
  url: string
  kind: 'peer-reviewed' | 'registry' | 'public-health' | 'policy'
}

export interface HopeFormula {
  label: string
  expression: string
  meaning: string
}

export interface HopeDomain {
  key: HopeDomainKey
  label: string
  emoji: string
  status: HopeStatus
  gate: HopeGate
  mission: string
  whyItMatters: string
  evidenceStage: string
  inputs: string[]
  outputs: string[]
  modules: string[]
  integrations: string[]
  formulas: HopeFormula[]
  references: HopeReference[]
  safetyBoundary: string
  milestones: string[]
}

/**
 * Panacea Hope Stack
 *
 * A product map for extending healthy, functional life without collapsing
 * research hypotheses, measured health data, clinical care, and policy scenarios
 * into one misleading score. The first domain is mental health because a product
 * about preserving life must support safety, meaning, function and connection as
 * seriously as biomarkers or anatomy.
 */
export const HOPE_DOMAINS: HopeDomain[] = [
  {
    key: 'mental-health',
    label: 'Mental Health & Life Safety',
    emoji: '🫶',
    status: 'usable-now',
    gate: 'self-directed',
    mission: 'Treat psychological safety, distress, connection, recovery and meaning as core health infrastructure rather than a secondary wellness feature.',
    whyItMatters: 'Mental disorders create a major global disability burden. Panacea should make help-seeking, validated screening, coping tools and a private safety plan easier to reach while keeping diagnosis and emergency response with qualified humans and local services.',
    evidenceStage: 'Validated screening and safety-planning components can be productized now; diagnosis, crisis disposition and treatment selection remain clinician-led.',
    inputs: ['self-reported mood/anxiety screens', 'warning signs', 'coping strategies', 'trusted supports', 'care contacts', 'sleep/stress context'],
    outputs: ['screening context', 'private safety plan', 'coping toolkit', 'support map', 'follow-up prompts', 'clear escalation path'],
    modules: ['Validated screening', 'Safety plan', 'Coping & grounding', 'Substance-use screening', 'Meaning & values', 'Recovery stories'],
    integrations: ['Pusat Jiwa', 'Notifications', 'Consult', 'Hospitals', 'Sleep Pattern', 'Life Compass'],
    formulas: [
      { label: 'Safety-plan completeness', expression: 'completeness = completed sections / core sections × 100%', meaning: 'A usability indicator only; never a suicide-risk score.' },
    ],
    references: [
      { label: 'GBD 2023 mental-disorder burden (Lancet 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42167272/', kind: 'peer-reviewed' },
      { label: 'Safety Planning Intervention systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/41424118/', kind: 'peer-reviewed' },
    ],
    safetyBoundary: 'Panacea must never claim to predict suicide, replace emergency care, or silently notify others. Immediate danger requires local emergency services or the nearest emergency department; safety-plan data stays user-controlled unless the user explicitly shares it.',
    milestones: ['Private local-first safety plan', 'Optional clinician-share export', 'Region-aware crisis-resource adapter', 'Outcome-safe follow-up without surveillance claims'],
  },
  {
    key: 'geroscience-pharma',
    label: 'Geroscience Pharmaceutical Pipeline',
    emoji: '🧬',
    status: 'research-only',
    gate: 'research-governance',
    mission: 'Map candidate interventions that target cellular senescence, chronic inflammation, nutrient sensing, proteostasis, autophagy/mitophagy and other aging mechanisms from hypothesis through commercial translation.',
    whyItMatters: 'Aging biology contains multiple interacting mechanisms rather than one switch. A useful platform should show targets, biomarkers, evidence maturity, trial status and uncertainty without turning early research into consumer treatment advice.',
    evidenceStage: 'Mechanistic and preclinical evidence is broad; human efficacy and long-term safety vary sharply by target and intervention. Many senotherapeutic strategies remain early-stage.',
    inputs: ['target/pathway', 'compound identity', 'preclinical evidence', 'human safety data', 'trial registry metadata', 'biomarkers', 'regulatory status'],
    outputs: ['mechanism map', 'evidence-stage card', 'trial timeline', 'biomarker rationale', 'known safety questions', 'research gaps'],
    modules: ['Senolytics', 'Senomorphics/SASP modulation', 'mTOR/AMPK & nutrient sensing', 'Autophagy/mitophagy', 'Inflammaging', 'Proteostasis', 'Drug repurposing'],
    integrations: ['Longevity Science', 'Biomedical Engine', 'Molecular Lab', 'ClinicalTrials.gov adapter', 'Knowledge Bridge'],
    formulas: [],
    references: [
      { label: 'Senescence-linked circulating biomarker study', url: 'https://pubmed.ncbi.nlm.nih.gov/39658621/', kind: 'peer-reviewed' },
      { label: 'Senomorphic strategies review', url: 'https://pubmed.ncbi.nlm.nih.gov/42498087/', kind: 'peer-reviewed' },
      { label: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov/', kind: 'registry' },
    ],
    safetyBoundary: 'Research/education only. Do not generate synthesis instructions, dosing, self-experimentation protocols or individualized anti-aging prescriptions. Registry presence is not evidence that a therapy is effective or safe.',
    milestones: ['Target-to-evidence knowledge graph', 'Trial-registry adapter', 'FDA/label/regulatory provenance', 'Biomarker-response research workspace', 'Commercial pipeline watchlist'],
  },
  {
    key: 'regenerative-medicine',
    label: 'Regenerative Medicine & Organ Repair',
    emoji: '🫀',
    status: 'research-only',
    gate: 'research-governance',
    mission: 'Connect stem-cell biology, tissue engineering, biomaterials, organoids, organ-on-chip systems and transplantation science into an organ-by-organ repair atlas.',
    whyItMatters: 'Regeneration could eventually restore function rather than merely manage decline, while near-term organoids and tissue models already support disease modeling and drug screening.',
    evidenceStage: 'Maturity is modality- and organ-specific. Organoids and organ-on-chip platforms are useful research systems; fully lab-grown replacement organs are not a general clinical reality.',
    inputs: ['cell source', 'tissue/organ target', 'scaffold/biomaterial', 'vascularization strategy', 'functional assays', 'immune compatibility', 'preclinical/clinical stage'],
    outputs: ['repair pathway map', 'maturity matrix', 'cell/tissue provenance', 'functional endpoints', 'translation barriers', 'trial links'],
    modules: ['Stem cells', 'Organoids', 'Tissue engineering', 'Biomaterials', 'Bioprinting', 'Organ-on-chip', 'Cell therapy', 'Transplant bridge'],
    integrations: ['Body Explorer', 'Cell Lab', 'Genomics Lab', 'Biomedical Engine', 'Clinical Trials'],
    formulas: [],
    references: [
      { label: 'Regenerative approaches in end-stage renal disease scoping review', url: 'https://pubmed.ncbi.nlm.nih.gov/40756517/', kind: 'peer-reviewed' },
    ],
    safetyBoundary: 'Never present a research organoid, engineered tissue, stem-cell product or animal/preclinical result as an available replacement organ or proven treatment. Human use requires regulated products, clinical protocols and qualified teams.',
    milestones: ['Organ-by-organ regeneration atlas', 'Cell lineage/provenance viewer', 'Research maturity ladder', 'Clinical trial linkage', 'Biomaterial and functional-assay evidence layer'],
  },
  {
    key: 'early-detection',
    label: 'AI Early Disease Detection',
    emoji: '🔎',
    status: 'integration-ready',
    gate: 'clinician-review',
    mission: 'Combine validated screening, longitudinal biomarkers, imaging, genetics and emerging liquid-biopsy signals to surface earlier, explainable reasons for follow-up.',
    whyItMatters: 'Earlier detection can widen treatment windows, but screening only helps when test performance, disease prevalence, downstream confirmation, overdiagnosis and false-positive harms are considered together.',
    evidenceStage: 'Established screening pathways can be operationalized; many multi-cancer liquid-biopsy and AI approaches remain investigational or require prospective clinical-utility validation.',
    inputs: ['age/risk factors', 'family history', 'validated screening history', 'longitudinal labs', 'imaging', 'genetic findings', 'cfDNA/methylation/fragmentomics when available'],
    outputs: ['screening-gap map', 'risk-context explanation', 'abnormal-trend flag', 'confirmatory-workup pathway', 'uncertainty/calibration', 'source provenance'],
    modules: ['Guideline screening', 'Cardiometabolic detection', 'Cancer liquid biopsy research', 'Genetic risk context', 'Biomarker trajectories', 'Imaging follow-up'],
    integrations: ['Health Profile', 'Clinical Trackers', 'Radiology', 'Gene Info', 'Orders', 'Knowledge Bridge'],
    formulas: [
      { label: 'Positive predictive value', expression: 'PPV = sensitivity × prevalence / [sensitivity × prevalence + (1 − specificity) × (1 − prevalence)]', meaning: 'Shows why a highly specific test can still produce many false positives when disease prevalence is low.' },
    ],
    references: [
      { label: 'MCED + liquid biopsy + AI review', url: 'https://pubmed.ncbi.nlm.nih.gov/42382778/', kind: 'peer-reviewed' },
      { label: 'Non-invasive multi-cancer detection review', url: 'https://pubmed.ncbi.nlm.nih.gov/39885052/', kind: 'peer-reviewed' },
    ],
    safetyBoundary: 'A model flag is not a diagnosis. Positive findings require an appropriate confirmatory pathway; negative emerging tests must not replace guideline-recommended screening unless validated for that use.',
    milestones: ['Screening-gap engine', 'Bayesian result explainer', 'Longitudinal anomaly view', 'Confirmatory-care routing', 'Prospective calibration and subgroup validation'],
  },
  {
    key: 'longevity-care',
    label: 'Longevity-Focused Preventive Care',
    emoji: '🩺',
    status: 'integration-ready',
    gate: 'clinician-review',
    mission: 'Turn Panacea into a longitudinal preventive-care operating layer centered on function, risk-factor control, evidence-based screening, medication review, mental health and sustainable behavior.',
    whyItMatters: 'Healthy aging is about maintaining functional ability, not merely collecting favorable biomarkers. Continuous monitoring is useful when it leads to appropriate review and action rather than perpetual testing.',
    evidenceStage: 'Preventive medicine and chronic-risk management are established; consumer longevity practices vary widely in evidence and should be separated from standard care.',
    inputs: ['medical history', 'medications', 'vaccination/screening status', 'vitals/labs', 'sleep/activity', 'mental health', 'functional capacity', 'goals/preferences'],
    outputs: ['preventive-care timeline', 'care gaps', 'risk-factor trends', 'medication-review prompts', 'function dashboard', 'clinician discussion agenda'],
    modules: ['Prevention calendar', 'Metabolic control', 'Cardiovascular risk', 'Sleep/activity', 'Mental health', 'Medication review', 'Functional capacity', 'Endocrine evaluation when clinically indicated'],
    integrations: ['Longevity', 'Health Profile', 'Pusat Jiwa', 'Workout', 'Sleep Pattern', 'Medication Reminders', 'Consult'],
    formulas: [],
    references: [
      { label: 'WHO Healthy Ageing', url: 'https://www.who.int/news-room/questions-and-answers/item/healthy-ageing-and-functional-ability', kind: 'public-health' },
    ],
    safetyBoundary: 'Do not market non-indicated hormone treatment, supplements or off-label drugs as routine “optimization.” Monitoring should support evidence-based care and shared decision-making, not create disease from normal variation.',
    milestones: ['Unified prevention timeline', 'Functional-capacity dashboard', 'Care-gap reminders', 'Clinician review queue', 'Longitudinal outcomes tracking'],
  },
  {
    key: 'predictive-ai',
    label: 'AI Health Prediction & Aging Models',
    emoji: '🧠',
    status: 'research-only',
    gate: 'clinician-review',
    mission: 'Build transparent multimodal models that combine clinical, lifestyle, genomic and biological data to estimate defined future outcomes and aging-related phenotypes with calibration and uncertainty.',
    whyItMatters: 'Prediction can prioritize prevention at scale, but biological-age clocks and risk models are model-specific measurements—not a literal countdown of remaining life or proof that aging has been reversed.',
    evidenceStage: 'Aging clocks and multimodal models are active translational research. Generalizability, causal interpretation and clinical actionability remain important limitations.',
    inputs: ['validated clinical variables', 'longitudinal biomarkers', 'wearables', 'genomics/omics when consented', 'lifestyle', 'model version and training-population metadata'],
    outputs: ['defined risk horizon', 'biological-age estimate when supported', 'feature attribution', 'calibration', 'confidence/uncertainty', 'drift and missing-data warnings'],
    modules: ['Risk prediction', 'Biological-age clocks', 'Pace-of-aging research', 'Explainable AI', 'Calibration', 'Fairness/subgroup validation', 'Model drift'],
    integrations: ['Predictive Models Toolkit', 'Data Lab Advanced', 'Longevity', 'Health Profile', 'Verification'],
    formulas: [
      { label: 'Age acceleration', expression: 'age acceleration = predicted biological age − chronological age', meaning: 'Model-specific residual/offset; not a diagnosis and not interchangeable across clocks.' },
      { label: 'Brier score', expression: 'BS = (1/N) Σ(pᵢ − yᵢ)²', meaning: 'Measures probabilistic prediction error; lower is better for the same defined outcome and population.' },
    ],
    references: [
      { label: 'Biological aging clocks review', url: 'https://pubmed.ncbi.nlm.nih.gov/42673736/', kind: 'peer-reviewed' },
      { label: 'Multi-omics aging measurement review', url: 'https://pubmed.ncbi.nlm.nih.gov/41371352/', kind: 'peer-reviewed' },
    ],
    safetyBoundary: 'No model should autonomously prescribe treatment or claim to predict an individual lifespan. Every output must name the outcome, time horizon, model version, data freshness, uncertainty and validation population.',
    milestones: ['Model card registry', 'Calibration dashboard', 'Longitudinal drift detection', 'External validation framework', 'Causal-vs-predictive separation'],
  },
  {
    key: 'longevity-finance',
    label: 'Longevity Finance, Insurance & Retirement',
    emoji: '🏦',
    status: 'policy-scenario',
    gate: 'policy-review',
    mission: 'Model how longer lives change retirement duration, pension liabilities, insurance longevity risk, healthcare spending and household planning without turning health predictions into discriminatory underwriting.',
    whyItMatters: 'Longer survival can be a social achievement while also increasing the years that pensions, savings, care systems and insurers must finance.',
    evidenceStage: 'Demographic and actuarial scenario analysis is established; individual health-data underwriting and algorithmic pricing raise legal, ethical and fairness issues and are outside this product layer.',
    inputs: ['population survival scenarios', 'retirement age', 'benefit/cost streams', 'discount-rate scenarios', 'healthy-working-year scenarios', 'policy assumptions'],
    outputs: ['retirement-duration scenarios', 'present-value scenarios', 'longevity gap', 'sensitivity analysis', 'population dependency ratios'],
    modules: ['Retirement runway', 'Pension scenarios', 'Longevity risk', 'Care-cost planning', 'Healthy working years', 'Policy sensitivity'],
    integrations: ['Money Hub', 'Planning', 'Owner Analytics', 'Population Health'],
    formulas: [
      { label: 'Longevity financing gap', expression: 'gap years = scenario lifespan − financed-through age', meaning: 'Scenario difference, not an individual lifespan prediction.' },
      { label: 'Present value', expression: 'PV = Σ Cₜ / (1 + r)ᵗ', meaning: 'Illustrates how future cost or benefit streams change with duration and discount assumptions.' },
      { label: 'Old-age dependency ratio', expression: 'OADR = population age 65+ / population age 20–64 × 100', meaning: 'Population-level pressure indicator using the OECD age-band convention.' },
    ],
    references: [
      { label: 'OECD Pensions at a Glance 2025', url: 'https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e4023f1e-en.html', kind: 'policy' },
    ],
    safetyBoundary: 'Educational/policy scenario planning only—not insurance eligibility, pricing, investment advice or pension entitlement calculation. Personal health data must not be used for discriminatory underwriting.',
    milestones: ['Longevity-scenario calculator', 'Population dependency dashboard', 'Retirement sensitivity explorer', 'Policy assumption ledger', 'Equity/fairness review'],
  },
  {
    key: 'aging-technology',
    label: 'Technology for an Aging Population',
    emoji: '🤖',
    status: 'integration-ready',
    gate: 'self-directed',
    mission: 'Support independence with accessible monitoring, medication support, fall-risk context, telecare, rehabilitation tools, cognitive support and carefully scoped assistive robotics.',
    whyItMatters: 'Technology can extend independence and reduce caregiver friction, but evidence differs by device and task; older adults must remain in control rather than becoming passive subjects of surveillance.',
    evidenceStage: 'Digital reminders/home monitoring have growing evidence; rehabilitation and social robots remain heterogeneous and often preliminary or task-specific.',
    inputs: ['user goals', 'ADL/IADL needs', 'consented home/device signals', 'medications', 'mobility/cognition measures', 'caregiver preferences'],
    outputs: ['assistive plan', 'device confidence', 'reminders', 'task support', 'telecare handoff', 'caregiver-sharing controls'],
    modules: ['Accessible UI', 'Medication support', 'Home monitoring', 'Telecare', 'Mobility/rehab', 'Cognitive support', 'Assistive robotics', 'Caregiver coordination'],
    integrations: ['Medication Reminders', 'Connect', 'Family Health', 'Notifications', 'Hospital-at-Home'],
    formulas: [],
    references: [
      { label: 'Assistive technology and caregiver burden systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/41805433/', kind: 'peer-reviewed' },
      { label: 'Rehabilitation robots in older adults scoping review', url: 'https://pubmed.ncbi.nlm.nih.gov/42643471/', kind: 'peer-reviewed' },
    ],
    safetyBoundary: 'No consumer sensor or robot should independently diagnose, restrain, medicate, or make emergency disposition decisions. Monitoring must be consented, minimally intrusive and explicit about device reliability.',
    milestones: ['Accessibility mode', 'Device-confidence layer', 'Caregiver consent controls', 'Assistive-tech directory', 'Rehabilitation outcome tracking'],
  },
  {
    key: 'longevity-infrastructure',
    label: 'Longevity Infrastructure & Healthy Economies',
    emoji: '🌍',
    status: 'policy-scenario',
    gate: 'policy-review',
    mission: 'Help health systems, employers and governments model how functional ability, prevention, workforce participation, long-term care, education and technology interact under population aging.',
    whyItMatters: 'The goal is not simply to add years, but to increase years of function while keeping care, work, learning and social systems sustainable and equitable.',
    evidenceStage: 'Population aging and pension/care pressures are measurable now. The effect of any specific longevity technology on national productivity must be modeled as scenarios until supported by real-world evidence.',
    inputs: ['age structure', 'functional-capacity indicators', 'healthcare utilization', 'workforce participation', 'care capacity', 'education/reskilling access', 'policy assumptions'],
    outputs: ['dependency scenarios', 'care-capacity gaps', 'healthy-working-year scenarios', 'education/reskilling needs', 'equity map', 'policy sensitivity'],
    modules: ['Healthy cities', 'Integrated care', 'Long-term care capacity', 'Healthy workforce', 'Lifelong learning', 'Caregiver economy', 'Digital inclusion', 'National resilience'],
    integrations: ['Owner Analytics', 'Hospitals', 'Marketplace', 'Planning', 'Data Lab', 'Population Health'],
    formulas: [
      { label: 'Old-age dependency ratio', expression: 'OADR = population age 65+ / population age 20–64 × 100', meaning: 'Population structure indicator; it does not measure disability or productivity by itself.' },
    ],
    references: [
      { label: 'WHO Decade of Healthy Ageing', url: 'https://www.who.int/initiatives/decade-of-healthy-ageing', kind: 'public-health' },
      { label: 'OECD Pensions at a Glance 2025', url: 'https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e4023f1e-en.html', kind: 'policy' },
    ],
    safetyBoundary: 'Population models are policy scenarios, not promises that a technology will reduce national healthcare spending or extend working life. Always expose assumptions, uncertainty, distributional effects and equity trade-offs.',
    milestones: ['Population age-structure explorer', 'Functional-ability dashboard', 'Care-capacity simulation', 'Healthy-workforce scenario lab', 'Equity and digital-inclusion audit'],
  },
]

export const HOPE_STATUS_LABEL: Record<HopeStatus, string> = {
  'usable-now': 'Usable now',
  'integration-ready': 'Integration ready',
  'research-only': 'Research only',
  'policy-scenario': 'Policy scenario',
}

export const HOPE_GATE_LABEL: Record<HopeGate, string> = {
  'self-directed': 'User controlled',
  'clinician-review': 'Clinician review',
  'research-governance': 'Research governance',
  'policy-review': 'Policy / ethics review',
}
