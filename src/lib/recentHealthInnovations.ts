// PanaceaMed 2020-2026 Health Innovation Gap Pack
//
// These contracts cover useful digital-health capabilities that emerged or
// matured rapidly during 2020-2026 and are not represented as dedicated
// Panacea modules at the time this file was added. They are deliberately
// conservative: a scaffold does not imply a connected clinical service,
// validated medical device, certified algorithm, or treatment recommendation.

export type InnovationDomain =
  | 'personal-experiments'
  | 'clinical-research'
  | 'precision-pharmacology'
  | 'genomics'
  | 'real-world-evidence'
  | 'digital-biomarkers'
  | 'ai-governance'
  | 'patient-reported-data'

export type InnovationStatus = 'integration-ready' | 'external-adapter' | 'research-only'
export type InnovationGate = 'none' | 'patient-consent' | 'clinician-review' | 'research-governance'

export interface RecentHealthInnovation {
  id: string
  label: string
  domain: InnovationDomain
  period: string
  status: InnovationStatus
  mission: string
  whyUseful: string
  inputs: string[]
  outputs: string[]
  integrations: string[]
  visualTarget: string
  humanGate: InnovationGate
  safetyBoundary: string
  evidenceAnchors: string[]
}

export const RECENT_HEALTH_INNOVATIONS: RecentHealthInnovation[] = [
  {
    id: 'n-of-1-studio',
    label: 'N-of-1 Personal Experiment Studio',
    domain: 'personal-experiments',
    period: '2020-2026',
    status: 'integration-ready',
    mission: 'Turn safe, reversible lifestyle questions into explicit single-person experiments with baseline, alternating periods, washout notes, adherence, outcomes and uncertainty.',
    whyUseful: 'People often change sleep, caffeine, meal timing, exercise or recovery practices simultaneously and cannot tell what actually helped. A structured personal experiment reduces self-deception without pretending to replace randomized clinical evidence.',
    inputs: ['question', 'intervention A/B', 'baseline period', 'outcome measure', 'wearables', 'patient-reported outcomes', 'confounder notes'],
    outputs: ['study timeline', 'adherence view', 'A-vs-B summary', 'carryover warning', 'missing-data report', 'personal conclusion with uncertainty'],
    integrations: ['Harian', 'PusatLatihan', 'PusatGizi', 'PusatJiwa', 'Connect', 'Data Lab'],
    visualTarget: 'AB/BA timeline with wearable overlays, adherence bands, outcome distributions and visible washout/carryover warnings.',
    humanGate: 'patient-consent',
    safetyBoundary: 'Only support low-risk, reversible self-observation by default. Medication changes, fasting in high-risk disease, or clinically consequential interventions require clinician review and should never be autonomously randomized.',
    evidenceAnchors: ['Digital N-of-1 and personalized-trial literature 2023-2026', 'Wearable-supported personalized trials'],
  },
  {
    id: 'decentralized-trial-passport',
    label: 'Decentralized Trial Participant Passport',
    domain: 'clinical-research',
    period: '2023-2026',
    status: 'external-adapter',
    mission: 'Extend trial matching into actual participation logistics: consent state, remote visits, local labs, device tasks, symptom diaries, investigational-product logistics and safety contacts.',
    whyUseful: 'Trial matching alone does not solve participation burden. A participant passport can make decentralized elements visible and reduce missed study tasks while preserving investigator control.',
    inputs: ['trial protocol', 'participant consent', 'visit schedule', 'DHT assignments', 'local provider/lab options', 'study contacts'],
    outputs: ['participant timeline', 'remote-task checklist', 'visit readiness', 'device/data capture status', 'safety contact card', 'protocol deviation prompts'],
    integrations: ['Clinical Trials', 'Planning', 'Connect', 'Hospitals', 'Marketplace', 'Notifications'],
    visualTarget: 'Protocol timeline split into home, telehealth, local-facility and study-site lanes with consent and completion states.',
    humanGate: 'research-governance',
    safetyBoundary: 'Panacea may coordinate approved trial tasks but cannot determine enrollment, change protocol requirements, dispense investigational treatment or replace the study investigator.',
    evidenceAnchors: ['FDA Conducting Clinical Trials With Decentralized Elements (2024)', 'FDA DHT remote-data guidance (2023)'],
  },
  {
    id: 'pgx-actionability-passport',
    label: 'Pharmacogenomics Actionability Passport',
    domain: 'precision-pharmacology',
    period: '2020-2026',
    status: 'external-adapter',
    mission: 'Translate already-available validated genotype results into gene → diplotype → phenotype → drug-guideline relationships with source versioning and clinician review.',
    whyUseful: 'A genomic result is often stranded away from medication workflows. The passport makes actionable pharmacogenomic context visible at prescribing and reconciliation time.',
    inputs: ['validated genotype/diplotype', 'gene', 'medication list', 'guideline source/version', 'ancestry-independent laboratory interpretation when available'],
    outputs: ['phenotype translation', 'affected-drug list', 'guideline recommendation excerpt metadata', 'conflict/unknown flag', 'review receipt'],
    integrations: ['Genomics Lab', 'SNP Profiler', 'Pharmacy', 'Orders', 'Medication Reminders', 'Knowledge Bridge'],
    visualTarget: 'Gene-to-drug bridge showing genotype, assigned phenotype, guideline level, affected medications and exact evidence version.',
    humanGate: 'clinician-review',
    safetyBoundary: 'Do not infer a clinical genotype from consumer SNP data or issue autonomous dose changes. Use validated laboratory results and current professional guidance.',
    evidenceAnchors: ['CPIC genotype-to-phenotype and prescribing guidelines'],
  },
  {
    id: 'genomic-reanalysis-watch',
    label: 'Genomic Reanalysis Watch',
    domain: 'genomics',
    period: '2021-2026',
    status: 'external-adapter',
    mission: 'Track whether a previously reported variant, VUS, gene-disease relationship or analysis pipeline has materially changed since the original genomic report.',
    whyUseful: 'Genomic knowledge changes after a test is finalized. A version-aware watch can surface candidates for professional reinterpretation without silently rewriting the original report.',
    inputs: ['original report', 'variant identifiers', 'classification/date', 'gene-disease context', 'updated phenotype', 'external clinical knowledge feeds'],
    outputs: ['change candidates', 'old-vs-current evidence', 'reanalysis priority', 'recontact workflow prompt', 'original-report preservation'],
    integrations: ['Genomics Lab', 'Family Health', 'Biomedical Engine', 'Second Opinion', 'Notifications'],
    visualTarget: 'Variant history ribbon with classification changes, source dates, phenotype updates and a prominent clinician/laboratory re-review gate.',
    humanGate: 'clinician-review',
    safetyBoundary: 'A database change is not itself a new diagnosis. Any clinically material reclassification requires qualified laboratory/clinical interpretation and appropriate recontact governance.',
    evidenceAnchors: ['ACMG 2021 NGS technical standard reanalysis section', '2024 genomic reanalysis/update-tracking literature'],
  },
  {
    id: 'target-trial-emulation-workbench',
    label: 'Target Trial Emulation Workbench',
    domain: 'real-world-evidence',
    period: '2024-2026',
    status: 'research-only',
    mission: 'Force a real-world evidence question to specify the hypothetical trial before analysis: eligibility, strategies, time zero, follow-up, outcomes, causal contrast and analysis plan.',
    whyUseful: 'Observational dashboards can look causal even when their design is not. A protocol-first workbench exposes immortal-time, confounding, observability and missingness problems before effect estimation.',
    inputs: ['causal question', 'EHR/registry schema', 'eligibility', 'treatment strategies', 'time zero', 'outcome definitions', 'confounders', 'follow-up rules'],
    outputs: ['target-trial protocol', 'data-fit matrix', 'identifiability warnings', 'bias checklist', 'analysis-ready specification'],
    integrations: ['EMR', 'Data Lab', 'Causal Counterfactual Lab', 'Evidence Conflict Visualizer'],
    visualTarget: 'Seven-part target-trial protocol beside an EHR realizability matrix; impossible or weakly observed components remain visibly unresolved.',
    humanGate: 'research-governance',
    safetyBoundary: 'Do not present observational estimates as randomized evidence. If the data cannot support time zero, treatment assignment, confounding control or outcome ascertainment, the causal estimand must be marked unsupported.',
    evidenceAnchors: ['Operational target-trial emulation framework for EHR data (npj Digital Medicine, 2026)', 'Federated TTE work (npj Digital Medicine, 2025)'],
  },
  {
    id: 'digital-biomarker-validation-lab',
    label: 'Digital Biomarker Validation Lab',
    domain: 'digital-biomarkers',
    period: '2020-2026',
    status: 'integration-ready',
    mission: 'Evaluate whether a wearable, phone or home sensor stream is sufficiently complete, stable and fit for a stated use before it influences a health interpretation.',
    whyUseful: 'Panacea can ingest many consumer signals, but device data quality varies by wear time, firmware, motion, skin contact, missingness and context. This lab makes sensor trustworthiness explicit.',
    inputs: ['device/source', 'sampling metadata', 'wear time', 'missingness', 'signal-quality flags', 'reference measurement when available', 'firmware/device changes'],
    outputs: ['data completeness', 'signal-quality timeline', 'device-change events', 'agreement/calibration summary', 'fit-for-purpose label', 'unsupported-use warning'],
    integrations: ['Connect', 'Health Data', 'RPPG Heart Rate', 'Vocal Biomarkers', 'Readiness', 'Hospital-at-Home'],
    visualTarget: 'Signal provenance ribbon with quality heatmap, missing-data gaps, device/firmware change markers and reference-comparison plots.',
    humanGate: 'none',
    safetyBoundary: 'A consumer signal must not be upgraded to a diagnostic measurement merely because it is continuous. Validation is use-case, device, population and context specific.',
    evidenceAnchors: ['FDA Digital Health Technologies for remote data acquisition guidance (2023)', 'FDA regulatory science work on DHT algorithm reliability'],
  },
  {
    id: 'ai-lifecycle-observatory',
    label: 'Clinical AI Lifecycle Observatory',
    domain: 'ai-governance',
    period: '2024-2026',
    status: 'integration-ready',
    mission: 'Track every clinical AI model by version, intended use, validation cohort, calibration, subgroup performance, drift, incidents and approved changes.',
    whyUseful: 'An AI output is not permanently valid just because a model passed one benchmark. Panacea needs a visible safety layer as models, prompts, data and populations change.',
    inputs: ['model version', 'intended use', 'validation metrics', 'subgroup metrics', 'live performance', 'dataset shift indicators', 'change log', 'incident reports'],
    outputs: ['model card', 'calibration/drift dashboard', 'subgroup gap alerts', 'change-control history', 'rollback recommendation', 'deployment gate'],
    integrations: ['Owner Analytics', 'Verification', 'Data Lab', 'Chatbot', 'EMR', 'Predictive Models Toolkit'],
    visualTarget: 'Model timeline with green/amber/red deployment state, calibration curve, drift bands, subgroup matrix and before/after-change comparison.',
    humanGate: 'research-governance',
    safetyBoundary: 'Monitoring does not certify a model. Clinical deployment requires task-specific validation, governance and an accountable owner; material performance deterioration should disable or constrain use.',
    evidenceAnchors: ['FDA AI-enabled medical device total-product-lifecycle guidance (2025)', 'FDA ML transparency and predetermined-change-control principles'],
  },
  {
    id: 'adaptive-epro-ema-hub',
    label: 'Adaptive ePRO + EMA Outcomes Hub',
    domain: 'patient-reported-data',
    period: '2020-2026',
    status: 'integration-ready',
    mission: 'Collect brief patient-reported outcomes and ecological momentary assessments at the right time, then align them with wearables, medications, symptoms and context.',
    whyUseful: 'Clinic snapshots miss day-to-day burden. Lightweight ePRO/EMA can capture pain, fatigue, mood, function, side effects and context between visits without forcing a long questionnaire every day.',
    inputs: ['validated questionnaire items', 'EMA prompts', 'symptoms', 'medication events', 'wearables', 'context tags'],
    outputs: ['burden trajectory', 'response rate', 'change points', 'context-linked symptoms', 'clinician summary', 'question-fatigue guard'],
    integrations: ['Harian', 'PusatJiwa', 'Clinical Trackers', 'Medication Reminders', 'Connect', 'Care Episode'],
    visualTarget: 'Minute/day/week timeline combining patient-reported burden, contextual events and objective streams with confidence/missingness bands.',
    humanGate: 'patient-consent',
    safetyBoundary: 'Patient-reported data are clinically meaningful but are not automatically diagnoses. Prompt frequency must minimize burden and urgent responses require an explicit escalation workflow.',
    evidenceAnchors: ['2020-2026 remote DHT + patient-reported outcome literature', 'FDA DHT remote-data framework'],
  },
]

export function innovationById(id: string): RecentHealthInnovation | undefined {
  return RECENT_HEALTH_INNOVATIONS.find((feature) => feature.id === id)
}

export function innovationsByDomain(domain: InnovationDomain): RecentHealthInnovation[] {
  return RECENT_HEALTH_INNOVATIONS.filter((feature) => feature.domain === domain)
}

export function innovationReadinessPercent(feature: RecentHealthInnovation): number {
  switch (feature.status) {
    case 'integration-ready': return 70
    case 'external-adapter': return 40
    case 'research-only': return 20
  }
}

export const RECENT_INNOVATION_TRUTH_RULES = [
  'A scaffold is not a deployed clinical service.',
  'A connected data stream is not automatically a validated medical measurement.',
  'Observed association is not causal effect.',
  'Genomic database change is not an automatic patient-level reclassification.',
  'Pharmacogenomic guidance requires validated genotype results and current guideline versioning.',
  'Research coordination never overrides investigator, ethics, consent or protocol requirements.',
  'Clinical AI must preserve model version, intended use, validation population and ongoing performance history.',
  'Patient-reported outcomes remain source-attributed and must never be silently rewritten as clinician-observed facts.',
] as const
