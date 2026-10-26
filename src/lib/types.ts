// Shared domain types for the Panaceamed.id Longevity Medical-AI platform.

export type Sex = 'L' | 'P'

export type RiskFlag = 'chronic' | 'elderly' | 'immunocompromised'

export interface Patient {
  id: string
  name: string
  sex: Sex
  dob: string // ISO date
  mrn: string // medical record number
  heightCm: number
  weightKg: number
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
  riskFlags: RiskFlag[]
  avatarColor: string
}

export interface VitalSign {
  id: string
  takenAt: string // ISO datetime
  systolic: number
  diastolic: number
  heartRate: number
  respRate: number
  tempC: number
  spo2: number
  glucose?: number // mg/dL
  note?: string
}

export interface SupportiveResult {
  id: string
  takenAt: string
  category: 'Lab' | 'EKG' | 'Radiologi' | 'Lainnya'
  name: string
  value: string
  unit?: string
  reference?: string
  flag?: 'low' | 'normal' | 'high' | 'critical'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: string
}

// Anamnesis captured by the AI chatbot, structured per the master prompt.
export interface Anamnesis {
  keluhanUtama: string
  rps: string // SOCRATES narrative
  rpd: string
  rpk: string
  riwayatKehamilan: string
  riwayatPengobatan: string
  riwayatAlergi: string
  riwayatTumbuhKembang: string
  riwayatNutrisi: string
  riwayatImunisasi: string
  riwayatSosialEkonomi: string
}

// Physical exam — AI may suggest, but the doctor fills/edits and signs.
export interface PhysicalExam {
  general: string
  vitalsNote: string
  perSystem: string
  doctorVerified: boolean
  verifiedBy?: string
  /** Id verifikator — dicap server (server/src/rekamKlinis.ts). */
  verifiedById?: string
  /** Status per sistem yang ditandai klinisi (kunci sistem: mata, tht, kepala, leher, paru, jantung, abdomen, kulit, ekstremitas).
   *  Mengalahkan heuristik teks; dihitung "diverifikasi klinisi" hanya bila server mencap verifiedById. */
  statusSistem?: Record<string, StatusSistemFisik>
}

export type StatusSistemFisik = 'normal' | 'abnormal' | 'not-examined'

export interface PlanSafetyOverride {
  /** Human-readable rationale recorded by the clinician at the moment of override. */
  reason: string
  /** Identified clinician/account responsible for the override. */
  by: string
  /** ISO timestamp for the audit trail. */
  at: string
  /**
   * Exact safety-finding identities acknowledged by this override.
   * If the blocker set changes, the override no longer applies and the gate
   * fails closed until the new findings are reviewed.
   */
  findingIds: string[]
}

export interface PlanItem {
  id: string
  category: 'Suportif' | 'Definitif' | 'Edukasi' | 'Follow-up' | 'Monitoring'
  text: string
  source: 'AI' | 'Dokter'
  status: 'usulan' | 'diverifikasi' | 'ditolak'
  /** Dicap server saat butir diverifikasi klinisi (server/src/rekamKlinis.ts). */
  verifiedById?: string
  verifiedAt?: string
  safetyOverride?: PlanSafetyOverride
}

export interface ProblemEntry {
  id: string
  title: string
  /** Id kunjungan asal bila masalah dibawa dari kunjungan tertutup sebelumnya. */
  carriedFrom?: string
  /** Asal dicap server: 'AI' bila ditulis/diubah non-klinisi, 'Dokter' bila oleh klinisi. */
  source?: 'AI' | 'Dokter'
  basis: string // basis from anamnesis/exam/supporting
  assessment: string // "Dipikirkan ..." comparative reasoning
  probability?: number // 0-100 Bayesian estimate
  differentials?: string[] // diagnosis banding with distinguishing features
}

export interface EMRRecord {
  id: string
  patientId: string
  createdAt: string
  updatedAt: string
  anamnesis: Anamnesis
  physicalExam: PhysicalExam
  /** AI proposals and patient-reported context; never observed examination findings. */
  aiExamDraft?: { vitalsNote: string; perSystem: string }
  problems: ProblemEntry[]
  // Diagnosis utama (ICD-10) — picked by the doctor or accepted from AI.
  primaryDiagnosis?: { code: string; title: string; chapter?: string; source?: 'AI' | 'Dokter' }
  plan: PlanItem[]
  prognosis?: string
  // Penunjang & supportive (Mode-1 clinical workup)
  anthropometry?: string // formula + WHO/CDC/adult BMI interpretation; never fabricated z-score
  labEkgInterpretation?: string // interpretasi temuan Lab & hasil EKG
  supportive?: SupportivePlan
  surgery?: SurgeryPlan
  references: string[]
  signedBy?: string
  /** Id pengguna penanda tangan — dicap server (lihat server/src/rekamKlinis.ts). */
  signedById?: string
  signedAt?: string
  /** Asal per kolom isian ('anamnesis.rps', 'physicalExam.perSystem', …) — dicap server; klien hanya boleh menyatakan 'AI'. */
  asalIsian?: Record<string, { asal: 'AI' | 'Dokter' | 'Pengguna'; olehId?: string; pada?: string }>
  /** Kunjungan tertutup sebelumnya (dicap server saat kunjungan ditutup). */
  previousEncounterId?: string
  // The downstream half of the care journey — everything the clinical plan
  // above triggers in the real world (who, where, how much, when, and
  // whether it's actually happening). Optional: only present once a plan
  // item is actually being carried out.
  careEpisodes?: CareEpisode[]
}

// One stage in a patient's path from problem to prevention. Stage order is
// fixed (see CARE_EPISODE_STAGES); status tracks whether that stage is done,
// or stuck — 'blocked' + blockedReason is what a "care failure detector"
// would surface (missed follow-up, lab not done, payment pending, etc).
export type CareEpisodeStageId =
  | 'problem'
  | 'diagnosis'
  | 'plan'
  | 'provider'
  | 'cost'
  | 'schedule'
  | 'treatment'
  | 'recovery'
  | 'followUp'
  | 'outcome'

export type CareEpisodeStageStatus = 'pending' | 'active' | 'done' | 'blocked'

export interface CareEpisodeStage {
  stage: CareEpisodeStageId
  status: CareEpisodeStageStatus
  note?: string
  blockedReason?: string
  updatedAt?: string
}

// One facility being compared before the patient chooses a provider. Real
// location/distance/rating comes from lib/hospitals.ts; cost is always
// entered by a person (doctor, patient, or admin from a real quote) and
// never fabricated — see the note on CareEpisode's cost fields below.
export interface ProviderCandidate {
  facilityId: string // links to a Hospital.id from lib/hospitals.ts
  estimatedCostLow?: number
  estimatedCostHigh?: number
  costConfidence?: 'estimated' | 'verified'
  costSource?: string
}

// One real cost component of an episode — never just "the doctor's fee".
// Each line has its own confidence/source since a lab quote and a
// transportation guess don't carry the same certainty.
export interface CostItem {
  id: string
  label: string // e.g. "Professional fee", "Laboratory" — free text, not an enum
  low?: number
  high?: number
  confidence?: 'estimated' | 'verified'
  source?: string
}

export interface CareEpisode {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  problemId?: string // links back to a ProblemEntry.id when known
  diagnosisCode?: string // links back to EMRRecord.primaryDiagnosis.code, when auto-created from one
  candidates?: ProviderCandidate[] // facilities being compared before one is chosen
  providerName?: string
  facilityId?: string // links to a Hospital.id from lib/hospitals.ts, when picked from the real directory
  facilityName?: string
  estimatedCostLow?: number // in the patient's local currency, whole units
  estimatedCostHigh?: number
  currency?: string // e.g. 'IDR'
  // Never fabricate a specific price — every cost figure must say where it
  // came from and whether it's a rough estimate or a confirmed quote. See
  // CLAUDE.md / the price-intelligence principle: source, date, confidence.
  costConfidence?: 'estimated' | 'verified'
  costSource?: string
  // Total Cost of Care: when present, estimatedCostLow/High/Confidence are
  // DERIVED as the sum of these items — the single number is a rollup of
  // real components, not a separate guess. Optional: a simple total (above)
  // is still valid for episodes that never itemize.
  costItems?: CostItem[]
  // Care failure detection compares real elapsed time against an expected
  // duration per stage — but one flat table (see STAGE_EXPECTED_DAYS in
  // careEpisode.ts) can't fit every diagnosis: 21 days for "treatment" is
  // reasonable for a course of antibiotics and absurd for a transplant.
  // Rather than fabricate a diagnosis-severity dataset that doesn't exist,
  // this lets a clinician override specific stages for a specific episode
  // when the default is known to be wrong for this case.
  expectedDaysOverride?: Partial<Record<CareEpisodeStageId, number>>
  stages: CareEpisodeStage[]
  // Longitudinal care plan milestones synced from verified encounter plan items (T-CLIN-10)
  milestones?: CarePlanMilestone[]
  // Clinical encounter outcome closure and resolution record (T-CLIN-13)
  outcomeRecord?: ClinicalOutcomeRecord
  // Care journey longitudinal event timeline and provenance audit trail (T-CLIN-14)
  timelineEvents?: CareJourneyTimelineEvent[]
  // Comorbid diagnoses linked across concurrent care journeys (T-CLIN-15)
  linkedComorbidities?: string[]
  // Inter-facility referral handshake & diagnostic continuity record (T-CLIN-20)
  referralRecord?: CareJourneyReferralRecord
  // Eden three-depth progressive disclosure preference (T-CLIN-21 / EDEN-01)
  edenDepthPreference?: EdenDisclosureDepth
  // Eden universal language preference (T-CLIN-29 / EDEN-09)
  edenLanguagePreference?: EdenLanguageCode
  // Eden real-world wellness exposures & restorative environment (T-CLIN-30 / EDEN-10)
  wellnessExposures?: Record<string, WellnessDay>
}

export type CareJourneyTimelineEventKind =
  | 'episode_seeded'
  | 'stage_transition'
  | 'provider_selected'
  | 'milestone_verified'
  | 'milestone_fulfilled'
  | 'outcome_verified'

export interface CareJourneyTimelineEvent {
  id: string
  episodeId: string
  episodeTitle?: string
  kind: CareJourneyTimelineEventKind
  timestamp: string
  title: string
  description?: string
  stage?: CareEpisodeStageId
  actorId?: string
  badge?: string
  severity?: 'info' | 'success' | 'warning' | 'stalled'
}

export type ClinicalOutcomeStatus =
  | 'resolved'
  | 'improved'
  | 'stable'
  | 'chronic_managed'
  | 'referred'

export interface ClinicalOutcomeRecord {
  status: ClinicalOutcomeStatus
  summary: string
  verifiedById?: string
  verifiedAt?: string
  followUpPlan?: string
  signedAt?: string
  updatedAt?: string
}

export type ReferralHandshakeStatus =
  | 'draft'
  | 'dispatched'
  | 'acknowledged'
  | 'completed'
  | 'cancelled'

export interface CareJourneyReferralRecord {
  referralId: string
  sourceFacilityId: string
  sourceFacilityName: string
  destinationFacilityId?: string
  destinationFacilityName?: string
  specialty: string
  urgency: 'routine' | 'urgent' | 'emergency'
  clinicalIndication: string
  status: ReferralHandshakeStatus
  dispatchedAt?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  completedAt?: string
  auditDigest: string
}

export type EdenDisclosureDepth = 'simple' | 'explore' | 'deep'

export interface EdenPlainLanguageTerm {
  technicalTerm: string
  humanTranslation: string
}

export interface EdenCareCompanionSummary {
  episodeId: string
  episodeTitle: string
  depth: EdenDisclosureDepth
  depthLabel: 'Simple · Just Live' | 'Explore · Understand More' | 'Deep · Scientific & Clinical'
  wonderReflection: string
  whatIsHappening: string
  whyItMatters: string
  whatYouCanDo: string
  whatRemainsUncertain: string
  nextBeautifulStep: {
    stage: CareEpisodeStageId
    stageLabel: string
    invitation: string
    urgencyTone: 'calm' | 'attentive' | 'urgent_care'
  }
  plainLanguageGlossary: EdenPlainLanguageTerm[]
  clinicalSafetyPreserved: true
}

export type EdenCalmState =
  | 'serene'
  | 'balanced_progress'
  | 'gentle_attention'
  | 'timely_clinical_care'

export interface EdenLifeDimensionStatus {
  dimension: 'clinical_continuity' | 'diagnostic_clarity' | 'recovery_rhythm' | 'financial_peace'
  label: string
  plainSummary: string
  tone: 'serene' | 'attentive' | 'urgent'
}

export interface EdenLifeBalanceSynthesis {
  calmState: EdenCalmState
  calmStateLabel: string
  harmonyHeadline: string
  biologicalAppreciation: string
  oneUnifiedFocus: string
  activeJourneysCount: number
  completedJourneysCount: number
  dimensions: EdenLifeDimensionStatus[]
  clinicalSafetyGuarantee: 'never-deny-care'
}

export interface EdenLifeStoryAnchor {
  id: string
  at: string
  title: string
  kind: 'started' | 'blocked' | 'completed'
  note?: string
}

export interface EdenLifeStoryBridge {
  episodeId: string
  episodeTitle: string
  lifeChapterName: string
  lifeChapterAgeRange: string
  healthStoryAnchors: EdenLifeStoryAnchor[]
  selfAuthoredTurningPoints: {
    id: string
    at: string
    title: string
    impact: LifeEvent['impact']
    domains: LifeDomain[]
  }[]
  activeQuests: {
    id: string
    title: string
    domain: LifeDomain
    progressCurrent: number
    progressTarget: number
    unit: string
    targetNote: string
  }[]
  activeLifeDomains: {
    domain: LifeDomain
    label: string
    count: number
  }[]
  storyContinuityNarrative: string
  gentleReflectionPrompt: string
  selfAuthoredNeverInferred: true
}

export type EdenOrganSystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'metabolic_endocrine'
  | 'musculoskeletal'
  | 'neurological'
  | 'digestive_hepatobiliary'
  | 'renal_urinary'
  | 'immune_lymphatic'
  | 'whole_body_homeostasis'

export interface EdenPhysiologyAppreciation {
  episodeId: string
  episodeTitle: string
  primarySystem: {
    id: EdenOrganSystemId
    label: string
    bodyTwinRoute: string
  }
  coupledSystems: {
    id: EdenOrganSystemId
    label: string
    couplingExplanation: string
  }[]
  livingWonderHeadline: string
  homeostaticMechanismSummary: string
  truthClass: 'educational_physiology_reference'
  neverFabricatesMeasuredVitals: true
}

export type EdenLongevityPillarId =
  | 'sleep_circadian'
  | 'movement_vitality'
  | 'nourishment_hydration'
  | 'autonomic_calm'

export interface EdenLongevityPillarRecommendation {
  pillar: EdenLongevityPillarId
  label: string
  gentlePractice: string
  physiologicalRationale: string
  workspaceRoute: string
}

export interface TrajectoryPoint {
  yearsAhead: number
  projectedChronologicalAge: number
  projectedBiologicalAge: number
  accumulatedResilienceBuffer: number
  survivalProbability10Year: number
}

export interface TranscendentTrajectoryResult {
  status: 'valid' | 'fail-closed'
  trajectory: TrajectoryPoint[]
  dominantVelocityFactor: string
  recommendationProvenance: string
}

export interface EdenPreventionLongevityRhythm {
  episodeId: string
  episodeTitle: string
  primaryOrganSystem: EdenOrganSystemId
  rhythmPhase: 'acute_restoration' | 'active_rebuilding' | 'longevity_maintenance'
  rhythmPhaseLabel: string
  compassionateHeadline: string
  oneGentleDailyHabit: string
  pillars: EdenLongevityPillarRecommendation[]
  clinicianVerifiedPlanCount: number
  nonPrescriptiveEducationalBoundary: true
  projectedTrajectory?: TranscendentTrajectoryResult
}

export interface EdenSupportCircleBridge {
  episodeId: string
  episodeTitle: string
  healthBuddyName?: string
  trustedCircles: {
    id: string
    name: string
    memberCount: number
    memberNames: string[]
  }[]
  recentEncouragements: {
    id: string
    fromName: string
    toName: string
    text: string
    at: string
  }[]
  shareablePlainUpdate: string
  connectionHeadline: string
  optInPrivacyPreserved: true
  noFabricatedSocialAccounts: true
}

export interface EdenVisitPreparationQuestion {
  id: string
  category: 'understanding' | 'options_next_step' | 'daily_life_recovery'
  categoryLabel: string
  question: string
  whyAskThis: string
}

export interface EdenVisitPreparationCompanion {
  episodeId: string
  episodeTitle: string
  currentFocusStage: CareEpisodeStageId
  currentFocusStageLabel: string
  reassuringHeadline: string
  flaggedResultSummary?: string
  questionsToBring: EdenVisitPreparationQuestion[]
  whatToShareWithClinician: string[]
  empoweringAgencyPreserved: true
  neverReplacesClinicianConsultation: true
}

export type EdenReflectionLensId =
  | 'biological_adaptation'
  | 'emotional_resilience'
  | 'relational_meaning'
  | 'personal_peace'

export interface EdenPerspectiveLens {
  id: EdenReflectionLensId
  label: string
  reflection: string
  humilityBoundary: string
}

export interface EdenReflectionSanctuaryBridge {
  episodeId: string
  episodeTitle: string
  peaceHeadline: string
  lenses: EdenPerspectiveLens[]
  openReflectionInvitation: string
  recentMoodSummary?: {
    mood: MoodEntry['mood']
    at: string
    note?: string
  }
  epistemicHumilityPreserved: true
  nonDogmaticPluralismPreserved: true
  neverClaimsMetaphysicalAuthority: true
}

export type EdenLanguageCode = 'id' | 'en'
export type EdenLiteracyAdaptationMode = 'everyday_warm' | 'clinical_structured'

export interface EdenUniversalAcceptanceBridge {
  episodeId: string
  episodeTitle: string
  language: EdenLanguageCode
  languageLabel: string
  literacyMode: EdenLiteracyAdaptationMode
  localizedHeadline: string
  localizedWhatIsHappening: string
  localizedNextStep: string
  localizedSafetyAssurance: string
  accessibilityAndConnectivityGuarantees: {
    lowBandwidthTextComplete: true
    screenReaderSemanticLandmarks: true
    noUnnecessaryExclusion: true
  }
  canonicalPatientTruthPreserved: true
  noFalseUniversalValidationClaim: true
}

export type EdenRestorativeExposureKind =
  | 'morning_sunlight'
  | 'circadian_serenity'
  | 'nature_immersion'
  | 'thermal_hydro_recovery'
  | 'clean_hydration'

export interface EdenRestorativeExposureSummary {
  kind: EdenRestorativeExposureKind
  label: string
  loggedDaysCount: number
  latestValueLabel: string
  restorativeState: 'active' | 'nurturing' | 'unlogged'
}

export type EdenAstralResonanceDimension =
  | 'cellular_light'
  | 'circadian_cycles'
  | 'earth_grounding'
  | 'cosmic_peace'

export interface EdenAstralWonderPerspective {
  dimension: EdenAstralResonanceDimension
  title: string
  wonderDescription: string
  scientificGrounding: string
}

export interface EdenRestorativeEnvironmentBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  totalLoggedExposureDays: number
  exposures: EdenRestorativeExposureSummary[]
  circadianAlignmentStage: 'morning_rhythm' | 'daylight_active' | 'evening_calm' | 'deep_rest_unknown'
  astralPerspectives: EdenAstralWonderPerspective[]
  cosmicBioHarmonyNarrative: string
  neverFabricatesUnloggedExposures: true
  nonPrescriptiveEducationalBoundary: true
}

export type EdenAiModelContributorKind =
  | 'gemini_argon'
  | 'claude_opus'
  | 'gpt_codex'
  | 'kimi_k1'
  | 'collective_synthesis'

export type EdenFrontierDomainKind =
  | 'cellular_reprogramming'
  | 'bio_photonic_resonance'
  | 'neural_regeneration'
  | 'quantum_metabolic_flux'
  | 'epigenetic_rejuvenation'

export interface EdenFrontierScientificHypothesis {
  id: string
  contributorModel: EdenAiModelContributorKind
  contributorName: string
  domain: EdenFrontierDomainKind
  domainLabel: string
  transcendentVision: string
  mechanisticGrounding: string
  clinicalSafetyBoundary: string
}

export interface EdenMultiModelRegenerationBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  hypotheses: EdenFrontierScientificHypothesis[]
  collectiveSynthesisNarrative: string
  transcendentFutureTrajectory: string
  researchHypothesisTruthClassPreserved: true
  noAutonomousClinicalIntervention: true
}

export type EdenQuantumBioPhotonicDimension =
  | 'mitochondrial_biophoton_flux'
  | 'coherent_water_dynamics'
  | 'chromatin_resonance_field'
  | 'systemic_photonic_vitality'

export type EdenQuantumPhotonicTrajectory =
  | 'balanced_resonance'
  | 'entropy_dominated'
  | 'emerging_coherence'
  | 'optimized_flux'

export interface EdenQuantumBioPhotonicBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  primaryDimension: EdenQuantumBioPhotonicDimension
  dimensionLabel: string
  photonicTrajectory: EdenQuantumPhotonicTrajectory
  photonicTrajectoryLabel: string
  mitochondrialCoherenceScore: number
  cellularResonanceIndex: number
  quantumBiophotonicNarrativeId: string
  quantumBiophotonicNarrativeEn: string
  mechanisticGroundingId: string
  mechanisticGroundingEn: string
  transcendentLongevityTrajectory: string
  quantumBioPhotonicFieldClass: 'mechanistic_simulation'
  neverFabricatesBiomarkers: true
  nonInterventionalResearchBoundary: true
}

export type EdenConsciousnessScaleKind =
  | 'subcellular_quantum_coherence'
  | 'synaptic_neuro_integration'
  | 'visceral_autonomic_balance'
  | 'noetic_experiential_harmony'

export type EdenBiopsychosocialEquilibriumState =
  | 'deep_tranquility'
  | 'coherent_adaptation'
  | 'restorative_rebalancing'
  | 'acute_sensory_stabilization'

export interface EdenAstralScalePerspective {
  scale: EdenConsciousnessScaleKind
  scaleLabel: string
  biopsychosocialIndex: number
  holographicInsightId: string
  holographicInsightEn: string
  mechanisticGrounding: string
}

export interface EdenMultidimensionalConsciousnessBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  equilibriumState: EdenBiopsychosocialEquilibriumState
  equilibriumStateLabel: string
  overallConsciousnessHarmonyScore: number
  scales: EdenAstralScalePerspective[]
  astralHolographicNarrativeId: string
  astralHolographicNarrativeEn: string
  transcendentHumanExperienceTrajectory: string
  noAutonomousNeurologicalDiagnosis: true
  phenomenologicalExperiencePreserved: true
}

export type EdenRealityLatticeLayerKind =
  | 'observed_clinical_evidence'
  | 'derived_physiological_resilience'
  | 'model_estimated_trajectory'
  | 'mechanistic_simulation'
  | 'phenomenological_human_experience'
  | 'cosmic_planetary_rhythm'

export type EdenBioCosmicResonanceState =
  | 'pristine_harmony'
  | 'dynamic_homeokinesis'
  | 'restorative_recalibration'
  | 'acute_stabilization_needed'

export interface EdenRealityLatticeLayer {
  layer: EdenRealityLatticeLayerKind
  layerLabel: string
  truthClass: 'observed' | 'derived' | 'model_estimated' | 'mechanistic_simulation' | 'phenomenological' | 'cosmic_rhythm'
  coherenceIndex: number
  groundingSummaryId: string
  groundingSummaryEn: string
  scientificOrExperientialSource: string
}

export interface EdenBioCosmicSymphonyBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  resonanceState: EdenBioCosmicResonanceState
  resonanceStateLabel: string
  symphonyHarmonyScore: number
  layers: EdenRealityLatticeLayer[]
  bioCosmicNarrativeId: string
  bioCosmicNarrativeEn: string
  universalFlourishingTrajectory: string
  realityLatticeClass: 'governed_multi_scale_projection'
  patientTruthUncompromised: true
  noSpeculativeClinicalActuation: true
  epistemicHumilityPreserved: true
}

export type EdenCouncilAgentModel =
  | 'gemini_frontier'
  | 'claude_transcendent'
  | 'gpt_argon'
  | 'deepseek_astral'

export type EdenCouncilConsensusState =
  | 'harmonious_convergence'
  | 'exploratory_equilibrium'
  | 'stabilization_focus_needed'

export interface EdenCouncilAgentPerspective {
  agentModel: EdenCouncilAgentModel
  agentName: string
  councilRole: string
  philosophicalPerspective: string
  bioEnergeticResilienceScore: number
  creativeWonderSynthesisId: string
  creativeWonderSynthesisEn: string
  suggestedExploratoryHypothesis: string
}

export interface EdenUniversalBiologicalFlourishingBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  consensusState: EdenCouncilConsensusState
  consensusStateLabel: string
  collectiveFlourishingScore: number
  agentPerspectives: EdenCouncilAgentPerspective[]
  collectiveHealingNarrativeId: string
  collectiveHealingNarrativeEn: string
  multiAgentWisdomTrajectory: string
  healingCouncilClass: 'multi_agent_collective_synthesis'
  patientTruthUncompromised: true
  noAutonomousClinicalIntervention: true
  epistemicHumilityPreserved: true
}

export type EdenEpigeneticClockModel =
  | 'horvath_multi_tissue'
  | 'hannum_blood_derived'
  | 'phenoage_epigenetic'
  | 'grimage_mortality_risk'

export type EdenCellularWaveformState =
  | 'coherent_oscillatory_harmony'
  | 'adaptive_mitohormetic_surge'
  | 'circadian_desynchronization_risk'
  | 'blunted_restorative_amplitude'

export interface EdenEpigeneticResonanceLayer {
  clockModel: EdenEpigeneticClockModel
  clockLabel: string
  biologicalAgeEstimateYears: number
  chronologicalAgeYears: number
  epigeneticAgeAccelerationYears: number
  confidenceLevel: 'model_estimate_proxy' | 'statistically_calibrated'
  calibrationSource: string
}

export interface EdenBioHarmonicWaveformBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  waveformState: EdenCellularWaveformState
  waveformStateLabel: string
  cellularResonanceIndex: number
  circadianSynchronizationScore: number
  mitohormeticBufferYears: number
  epigeneticLayers: EdenEpigeneticResonanceLayer[]
  waveformNarrativeId: string
  waveformNarrativeEn: string
  longevityWaveformTrajectory: string
  epigeneticWaveformClass: 'mechanistic_proxy_simulation'
  patientTruthUncompromised: true
  neverManufacturesMethylationArrays: true
  epistemicHumilityPreserved: true
}

// Eden Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer (T-CLIN-38 / EDEN-18)
export type EdenCircadianPhase =
  | 'dawn_activation'
  | 'solar_peak'
  | 'twilight_repose'
  | 'deep_nocturnal_repair'

export type EdenMitochondrialDynamicState =
  | 'fission_dominant'
  | 'fusion_biogenesis'
  | 'balanced_homeostasis'
  | 'mitophagy_primed'

export type EdenPeripheralClockKind =
  | 'neural_suprachiasmatic'
  | 'hepatic_metabolic'
  | 'cardiac_chronobiological'
  | 'musculoskeletal_energetic'

export interface EdenPeripheralClockHarmonizer {
  clockKind: EdenPeripheralClockKind
  clockLabel: string
  phaseAlignment: number
  peakEfficiencyWindow: string
  synchronyStatus: 'optimal_resonance' | 'phase_delayed' | 'phase_advanced' | 'subharmonic_drift'
  mitochondrialCouplingIndex: number
  mechanisticNote: string
}

export interface EdenCircadianMitochondrialHarmonizerBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  masterPhase: EdenCircadianPhase
  masterPhaseLabel: string
  mitochondrialDynamics: EdenMitochondrialDynamicState
  mitochondrialDynamicsLabel: string
  systemChronobiologicalResonance: number
  peripheralClocks: EdenPeripheralClockHarmonizer[]
  suprachiasmaticEntrainmentScore: number
  mitochondrialVitalityIndex: number
  circadianNarrativeId: string
  circadianNarrativeEn: string
  chronobiologicalLongevityStrategy: string
  truthClass: 'chronobiological_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

// Eden Regenerative Proteostasis & Autophagic Flux Clearance Synthesizer (T-CLIN-39 / EDEN-19)
export type EdenProteostasisState =
  | 'proteolytic_equilibrium'
  | 'chaperone_assisted_refolding'
  | 'er_stress_adaptive_upr'
  | 'proteasomal_overload_risk'

export type EdenAutophagicFluxRate =
  | 'high_flux_regenerative'
  | 'basal_physiological_turnover'
  | 'attenuated_lysosomal_clearance'
  | 'blocked_autophagosome_degradation'

export type EdenProteostasisNodeKind =
  | 'ubiquitin_proteasome_system'
  | 'molecular_chaperone_network'
  | 'macroautophagy_lysosomal_flux'
  | 'chaperone_mediated_autophagy'

export interface EdenProteostasisNode {
  nodeKind: EdenProteostasisNodeKind
  nodeLabel: string
  efficiencyScore: number
  clearanceLatencyHours: number
  capacityStatus: 'optimal_throughput' | 'compensated_strain' | 'impaired_clearance'
  mechanisticNote: string
}

export interface EdenProteostasisAutophagicFluxBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  proteostasisState: EdenProteostasisState
  proteostasisStateLabel: string
  autophagicFluxRate: EdenAutophagicFluxRate
  autophagicFluxRateLabel: string
  cellularClearanceIndex: number
  chaperoneBufferingCapacityScore: number
  lysosomalResilienceScore: number
  proteostasisNodes: EdenProteostasisNode[]
  proteostasisNarrativeId: string
  proteostasisNarrativeEn: string
  proteostaticRegenerativeStrategy: string
  truthClass: 'molecular_proteostasis_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

// Eden Telomeric Maintenance & Genomic Integrity Synthesizer (T-CLIN-40 / EDEN-20)
export type EdenTelomericState =
  | 'shelterin_capped_protected'
  | 'compensated_telomere_maintenance'
  | 'subtelomeric_attrition_risk'
  | 'critical_shortening_checkpoint_primed'

export type EdenDnaRepairFidelity =
  | 'high_fidelity_homologous_recombination'
  | 'active_base_excision_repair'
  | 'attenuated_mismatch_clearance'
  | 'error_prone_end_joining_predominant'

export type EdenGenomicMaintenanceClusterKind =
  | 'shelterin_telomere_capping'
  | 'base_nucleotide_excision_repair'
  | 'double_strand_break_surveillance'
  | 'epigenetic_heterochromatin_stabilization'

export interface EdenGenomicMaintenanceCluster {
  clusterKind: EdenGenomicMaintenanceClusterKind
  clusterLabel: string
  integrityScore: number
  repairCapacityIndex: number
  maintenanceStatus: 'resilient_capping' | 'active_repair_strain' | 'checkpoint_surveillance'
  mechanisticNote: string
}

export interface EdenTelomericGenomicIntegrityBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  telomericState: EdenTelomericState
  telomericStateLabel: string
  dnaRepairFidelity: EdenDnaRepairFidelity
  dnaRepairFidelityLabel: string
  genomicResilienceIndex: number
  shelterinCappingScore: number
  dnaRepairCapacityScore: number
  genomicClusters: EdenGenomicMaintenanceCluster[]
  genomicNarrativeId: string
  genomicNarrativeEn: string
  telomericLongevityStrategy: string
  truthClass: 'genomic_stability_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

// Eden Senescent Secretome & Inflammaging Attenuation Synthesizer (T-CLIN-41 / EDEN-21)
export type EdenSenescenceBurdenState =
  | 'minimal_sasp_surveillance'
  | 'adaptive_senolytic_priming'
  | 'smoldering_inflammaging_strain'
  | 'elevated_paracrine_secretome_risk'

export type EdenInflammagingIndexLevel =
  | 'quiescent_eugenerative'
  | 'compensated_low_grade_surveillance'
  | 'elevated_secretory_phenotype'
  | 'systemic_proteolytic_cascade'

export type EdenSenescentSurveillanceNodeKind =
  | 'senolytic_immune_clearance'
  | 'sasp_cytokine_neutralization'
  | 'extracellular_matrix_remodeling'
  | 'anti_inflammatory_resolution_pathway'

export interface EdenSenescentSurveillanceNode {
  nodeKind: EdenSenescentSurveillanceNodeKind
  nodeLabel: string
  clearanceCapacityScore: number
  secretomeSuppressionIndex: number
  surveillanceStatus: 'optimal_resolution' | 'compensated_clearance' | 'sasp_propagation'
  mechanisticNote: string
}

export interface EdenSenescentInflammagingBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  senescenceBurden: EdenSenescenceBurdenState
  senescenceBurdenLabel: string
  inflammagingLevel: EdenInflammagingIndexLevel
  inflammagingLevelLabel: string
  systemicInflammagingScore: number
  senolyticResilienceIndex: number
  secretomeSuppressionCapacity: number
  surveillanceNodes: EdenSenescentSurveillanceNode[]
  senescentNarrativeId: string
  senescentNarrativeEn: string
  senolyticInflammagingStrategy: string
  truthClass: 'cellular_senescence_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenStemCellNicheState =
  | 'quiescent_reserve_primed'
  | 'balanced_asymmetric_self_renewal'
  | 'niche_exhaustion_depletion_risk'
  | 'stress_induced_hyperactivation'

export type EdenTissuePlasticityIndexLevel =
  | 'high_fidelity_pluripotent_plasticity'
  | 'physiological_lineage_commitment'
  | 'attenuated_lineage_fidelity'
  | 'fibrotic_metaplastic_divergence'

export type EdenStemCellNicheKind =
  | 'hematopoietic_bone_marrow_niche'
  | 'intestinal_crypt_lgr5_niche'
  | 'neural_subventricular_niche'
  | 'skeletal_muscle_satellite_niche'

export interface EdenStemCellNicheNode {
  nicheKind: EdenStemCellNicheKind
  nicheLabel: string
  renewalCapacityScore: number
  lineageFidelityIndex: number
  nicheHomeostasisStatus: 'optimal_asymmetric_balance' | 'quiescent_pool_preserved' | 'stress_accelerated_differentiation'
  mechanisticNote: string
}

export interface EdenRegenerativePlasticityBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  stemCellNicheState: EdenStemCellNicheState
  stemCellNicheStateLabel: string
  plasticityLevel: EdenTissuePlasticityIndexLevel
  plasticityLevelLabel: string
  regenerativePlasticityScore: number
  stemNicheVitalityIndex: number
  lineageCommitmentCapacity: number
  nicheNodes: EdenStemCellNicheNode[]
  regenerativeNarrativeId: string
  regenerativeNarrativeEn: string
  stemCellRegenerativeStrategy: string
  truthClass: 'stem_cell_niche_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenEpigeneticClockState =
  | 'youthful_euchromatin_harmony'
  | 'compensated_epigenetic_adaptation'
  | 'accelerated_epigenetic_drift_risk'
  | 'stochastic_methylation_entropy'

export type EdenTranscriptomicPurityLevel =
  | 'high_fidelity_transcriptomic_stability'
  | 'physiological_splicing_fidelity'
  | 'aberrant_transcript_drift'
  | 'retrotransposon_derepression_strain'

export type EdenEpigeneticHarmonyClusterKind =
  | 'horvath_phenoage_clock_alignment'
  | 'dna_methylation_dnmt_tet_equilibrium'
  | 'histone_acetylation_sirtuin_flux'
  | 'chromatin_remodeling_polycomb_surveillance'

export interface EdenEpigeneticHarmonyCluster {
  clusterKind: EdenEpigeneticHarmonyClusterKind
  clusterLabel: string
  harmonyScore: number
  reversalPotentialIndex: number
  clusterStatus: 'optimal_epigenetic_youth' | 'compensated_remodeling' | 'drift_attenuation_required'
  mechanisticNote: string
}

export interface EdenEpigeneticAgeReversalBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  epigeneticState: EdenEpigeneticClockState
  epigeneticStateLabel: string
  transcriptomicPurity: EdenTranscriptomicPurityLevel
  transcriptomicPurityLabel: string
  biologicalAgeDeltaYears: number
  epigeneticHarmonyIndex: number
  transcriptomicFidelityScore: number
  harmonyClusters: EdenEpigeneticHarmonyCluster[]
  epigeneticNarrativeId: string
  epigeneticNarrativeEn: string
  epigeneticReversalStrategy: string
  truthClass: 'epigenetic_reversal_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenMitochondrialHeteroplasmyState =
  | 'homoplasmic_wildtype_resilience'
  | 'compensated_heteroplasmic_balance'
  | 'pathogenic_heteroplasmy_shift_risk'
  | 'mitochondrial_reticular_fragmentation'

export type EdenBioenergeticFusionRateLevel =
  | 'hyperfused_elongated_network'
  | 'balanced_fusion_fission_dynamics'
  | 'fission_predominant_fragmentation'
  | 'mitophagic_collapse_strain'

export type EdenMitochondrialFusionNodeKind =
  | 'mitofusin_mfn1_mfn2_tethering'
  | 'opa1_cristae_remodeling'
  | 'drp1_fission_quality_control'
  | 'pink1_parkin_mitophagic_flux'

export interface EdenMitochondrialFusionNode {
  nodeKind: EdenMitochondrialFusionNodeKind
  nodeLabel: string
  fusionEfficiencyScore: number
  reticularIntegrityIndex: number
  networkDynamicsStatus: 'optimal_reticular_network' | 'compensated_fission_clearance' | 'fragmentation_strain'
  mechanisticNote: string
}

export interface EdenMitochondrialHeteroplasmyBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  heteroplasmyState: EdenMitochondrialHeteroplasmyState
  heteroplasmyStateLabel: string
  fusionRateLevel: EdenBioenergeticFusionRateLevel
  fusionRateLevelLabel: string
  mitochondrialVitalityScore: number
  oxphosEfficiencyIndex: number
  atpSynthesisCapacity: number
  fusionNodes: EdenMitochondrialFusionNode[]
  mitochondrialNarrativeId: string
  mitochondrialNarrativeEn: string
  mitochondrialLongevityStrategy: string
  truthClass: 'mitochondrial_heteroplasmy_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenCircadianAutophagyState =
  | 'synchronized_pulsatile_autophagy'
  | 'intermittent_metabolic_switching_balance'
  | 'attenuated_circadian_amplitude_lag'
  | 'chronodisrupted_autophagic_stagnation'

export type EdenXenohormeticPulseTier =
  | 'robust_biphasic_hormetic_adaptation'
  | 'compensated_xenoprotective_equilibrium'
  | 'blunted_hormetic_plasticity'
  | 'maladaptive_oxidative_exhaustion'

export type EdenXenohormeticPulseNodeKind =
  | 'ampk_ulk1_fasting_autophagy_trigger'
  | 'sirt1_pgc1a_xenohormetic_deacetylation_flux'
  | 'nrf2_electrophilic_phase2_defense'
  | 'mtorc1_tfeb_lysosomal_biogenesis'

export interface EdenXenohormeticPulseNode {
  nodeKind: EdenXenohormeticPulseNodeKind
  nodeLabel: string
  activationIndex: number
  circadianSynchronyScore: number
  pulseDynamicsStatus: 'optimal_pulsatile_flux' | 'compensated_adaptive_signal' | 'blunted_stagnation'
  mechanisticNote: string
}

export interface EdenCircadianAutophagyPulseBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  autophagyState: EdenCircadianAutophagyState
  autophagyStateLabel: string
  pulseTier: EdenXenohormeticPulseTier
  pulseTierLabel: string
  circadianSynchronyIndex: number
  autophagicFluxCapacity: number
  xenohormeticResilienceScore: number
  pulseNodes: EdenXenohormeticPulseNode[]
  autophagyNarrativeId: string
  autophagyNarrativeEn: string
  xenohormeticLongevityStrategy: string
  truthClass: 'circadian_autophagy_pulse_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenRetrotransposonSilencingState =
  | 'deep_heterochromatic_silencing'
  | 'compensated_repressive_equilibrium'
  | 'focal_heterochromatin_erosion_risk'
  | 'retrotransposon_derepression_strain'

export type EdenLine1VigilanceTier =
  | 'dormant_transposon_quiescence'
  | 'surveilled_basal_transcription'
  | 'elevated_cytosolic_cdna_surveillance'
  | 'active_retrotransposition_crisis'

export type EdenTransposonVigilanceNodeKind =
  | 'kap1_trim28_corepressor_scaffold'
  | 'h3k9me3_hp1_heterochromatin_compaction'
  | 'dna_methylation_l1_utr_maintenance'
  | 'sirt6_nuclear_retention_surveillance'

export interface EdenTransposonVigilanceNode {
  nodeKind: EdenTransposonVigilanceNodeKind
  nodeLabel: string
  silencingEfficiencyScore: number
  chromatinDensityIndex: number
  vigilanceStatus: 'optimal_deep_silencing' | 'compensated_surveillance' | 'derepression_vulnerability'
  mechanisticNote: string
}

export interface EdenRetrotransposonSilencingBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  silencingState: EdenRetrotransposonSilencingState
  silencingStateLabel: string
  vigilanceTier: EdenLine1VigilanceTier
  vigilanceTierLabel: string
  retrotransposonSilencingScore: number
  heterochromatinStabilityIndex: number
  line1SuppressionCapacity: number
  vigilanceNodes: EdenTransposonVigilanceNode[]
  silencingNarrativeId: string
  silencingNarrativeEn: string
  retrotransposonRepressionStrategy: string
  truthClass: 'retrotransposon_silencing_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenSirtuinMetabolomicState =
  | 'abundant_nad_sirtuin_resonance'
  | 'compensated_salvage_equilibrium'
  | 'depleted_nad_enzymatic_competition'
  | 'metabolomic_exhaustion_parp_collapse'

export type EdenParp1RepairTier =
  | 'efficient_high_fidelity_parp_repair'
  | 'adequate_single_strand_clearance'
  | 'delayed_genomic_lesion_resolution'
  | 'hyperactivated_nad_depletion_crisis'

export type EdenSirtuinRepairNodeKind =
  | 'nampt_salvage_nad_biosynthesis'
  | 'sirt1_sirt6_chromatin_deacetylation'
  | 'parp1_poly_adp_ribosylation_repair'
  | 'cd38_sarm1_hydrolase_suppression'

export interface EdenSirtuinRepairNode {
  nodeKind: EdenSirtuinRepairNodeKind
  nodeLabel: string
  fluxEfficiencyScore: number
  metabolomicIntegrityIndex: number
  repairDynamicsStatus: 'optimal_resonance_flux' | 'compensated_adaptive_state' | 'depletion_strain'
  mechanisticNote: string
}

export interface EdenSirtuinNadParp1Bridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  sirtuinState: EdenSirtuinMetabolomicState
  sirtuinStateLabel: string
  repairTier: EdenParp1RepairTier
  repairTierLabel: string
  nadPoolVitalityScore: number
  sirtuinDeacetylationIndex: number
  parp1DnaRepairCapacity: number
  repairNodes: EdenSirtuinRepairNode[]
  metabolomicNarrativeId: string
  metabolomicNarrativeEn: string
  sirtuinNadOptimizationStrategy: string
  truthClass: 'sirtuin_nad_repair_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export type EdenShelterinCappingState =
  | 'robust_shelterin_hexamer_quiescence'
  | 'compensated_tloop_protection'
  | 'shelterin_uncapping_ddr_alarm'
  | 'severe_telomeric_decap_crisis'

export type EdenChromosomalEndProtectionTier =
  | 'high_fidelity_tloop_capping'
  | 'adequate_g_quadruplex_shielding'
  | 'fragile_telomeric_instability'
  | 'critical_end_to_end_fusion_hazard'

export type EdenShelterinSubunitNodeKind =
  | 'trf1_trf2_duplex_telomere_anchoring'
  | 'pot1_tpp1_single_strand_shielding'
  | 'tin2_central_bridge_scaffolding'
  | 'rap1_subtelomeric_heterochromatin_silencing'

export interface EdenShelterinSubunitNode {
  nodeKind: EdenShelterinSubunitNodeKind
  nodeLabel: string
  protectionEfficiencyScore: number
  cappingIntegrityIndex: number
  subunitState: 'optimal_capping_shield' | 'adaptive_protective_flux' | 'uncapping_strain'
  mechanisticNote: string
}

export interface EdenShelterinCapProtectionBridge {
  version: 'v1'
  episodeId: string
  episodeTitle: string
  shelterinState: EdenShelterinCappingState
  shelterinStateLabel: string
  protectionTier: EdenChromosomalEndProtectionTier
  protectionTierLabel: string
  shelterinHexamerIntegrityScore: number
  tloopStabilityIndex: number
  ddrKinaseSuppressionCapacity: number
  subunitNodes: EdenShelterinSubunitNode[]
  cappingNarrativeId: string
  cappingNarrativeEn: string
  telomericEndProtectionStrategy: string
  truthClass: 'shelterin_capping_protection_simulation_proxy'
  clinically_reviewed: false
  patientTruthUncompromised: true
  neverManufacturesBiomarkers: true
  epistemicHumilityPreserved: true
}

export interface CareJourneyExportSummary {
  standard: 'PANACEA-CAREPLAN-FHIR-R4-V1'
  generatedAt: string
  episodeId: string
  title: string
  diagnosisCode?: string
  linkedComorbidities: string[]
  status: 'active' | 'completed' | 'on_hold'
  provider?: {
    facilityId?: string
    facilityName?: string
    providerName?: string
    costRangeIdr?: {
      min: number
      max: number
    }
  }
  stages: {
    stage: CareEpisodeStageId
    label: string
    status: CareEpisodeStageStatus
    updatedAt?: string
    blockedReason?: string
  }[]
  milestones: {
    id: string
    title: string
    category: string
    targetStage: CareEpisodeStageId
    status: string
    resultValue?: string
    completedAt?: string
  }[]
  outcome?: ClinicalOutcomeRecord
  timelineEventCount: number
  auditDigest: string
}

export interface CarePlanMilestone {
  id: string
  planItemId?: string
  title: string
  category: 'Suportif' | 'Definitif' | 'Edukasi' | 'Follow-up' | 'Monitoring'
  targetStage: CareEpisodeStageId
  status: 'pending' | 'verified' | 'completed' | 'cancelled'
  verifiedById?: string
  verifiedAt?: string
  completedAt?: string
  resultId?: string
  resultValue?: string
  updatedAt?: string
}

// Supportive therapy numbers: resuscitation, fluid balance, calories, urine output.
export interface SupportivePlan {
  resusitasi: string
  balansCairan: string
  kebutuhanKalori: string
  urineOutput: string
}

// Surgery recommendation with multi-stage informed consent.
export interface SurgeryPlan {
  recommended: boolean
  procedure: string
  indication: string
  pre: string
  intra: string
  post: string
  risks: string
  consent: ConsentStage[]
}
export interface ConsentStage {
  stage: 'Chatbot-AI' | 'Rekomendasi Operasi' | 'Pemberian Obat' | 'Tindakan/Operasi'
  agreed: boolean
  at?: string
}

// -------- Accounts & roles -------------------------------------------------
export type Role = 'pasien' | 'dokter' | 'kontributor' | 'verifikator' | 'perawat' | 'lab' | 'admin' | 'owner'
export interface Account {
  /** Stable server user id; used for identity-bound longitudinal records. */
  id?: string
  email: string
  name: string
  role: Role
  isSubscriber: boolean
  patientId?: string // for pasien/dokter linkage
  loggedAt: string
  // Registration background (collected at sign-up)
  sex?: Sex // jenis kelamin (L/P)
  age?: number
  dob?: string // ISO date of birth (from datepicker)
  occupation?: string
  background?: string // latar belakang singkat
  str?: string // doctor's Surat Tanda Registrasi / practice certificate no.
  gelar?: string // academic/professional title (penulis)
  keahlian?: string // area of expertise
  universitas?: string // alma mater
  tahunLulus?: string // graduation year
  spesialis?: string // specialty (penulis)
  subspesialis?: string // subspecialty (verifikator)
  strStatus?: 'none' | 'pending' | 'verified' // STR verification gate for AI-EMR
  consentAt?: string // ISO timestamp of T&C + privacy + informed consent
  isOwner?: boolean // true for the platform owner account (mode-switch enabled)
}

// -------- Social feed — "Panacea Hidup Sehat" (Strava + IG + RedNote) -------
// A social network for healthy living. A post is one of three kinds:
//  • aktivitas  — physical activity with Strava-style metrics
//  • kebiasaan  — daily healthy-habit log (water, vegetables, sleep, dll.)
//  • artikel    — a longevity / healthy-lifestyle article snippet
export type PostType = 'aktivitas' | 'kebiasaan' | 'artikel'

export interface PostComment {
  id: string
  authorName: string
  text: string
  at: string
}

export interface SocialPost {
  id: string
  authorEmail: string
  authorName: string
  role: Role
  kind: 'image' | 'video' | 'text'
  postType?: PostType // defaults to 'aktivitas' for legacy posts
  activity: string // lari, berenang, padel, makan sehat ...
  caption: string
  mediaColor: string
  durationSec?: number // for video (<=15)
  // Strava-style activity metrics (optional)
  distanceKm?: number
  durationMin?: number
  steps?: number
  calories?: number
  // Healthy-habit metrics (optional)
  waterMl?: number
  veggieServ?: number
  sleepHr?: number
  sugaryDrinks?: number
  // Longevity article snippet (optional)
  articleTitle?: string
  articleSource?: string
  // TikTok-style media & social state
  photos?: string[] // real uploaded images (data URLs) or gradient color placeholders
  videoUrl?: string // uploaded short video (object URL)
  videoSec?: number // video length in seconds (<=180s / 3 min)
  audio?: string // selected background song title
  location?: string // tagged location
  archived?: boolean // hidden/archived by the owner
  locked?: boolean // private/locked post (only owner sees in "Terkunci")
  exclusive?: boolean // subscriber-only content (monetized via creator subscription)
  pinned?: boolean // pinned to the top of the owner's grid
  hideLikes?: boolean // hide the like count from viewers
  commentsOff?: boolean // commenting disabled by the owner
  reuseOff?: boolean // remix/reuse disabled by the owner
  likes: number
  comments?: number
  commentList?: PostComment[] // inline comment thread
  reposts?: number
  reactions?: Record<string, string[]> // emoji -> emails who reacted (peduli/semangat/doa/bangga)
  likedByMe?: boolean
  repostedByMe?: boolean
  bookmarkedByMe?: boolean
  at: string
}

// -------- Stories (Instagram-style, 24h ephemeral) -------------------------
export interface Story {
  id: string
  authorEmail: string
  authorName: string
  mediaColor: string
  image?: string // data URL / object URL photo
  video?: string // data URL / object URL short video
  caption?: string
  at: string
  comments?: PostComment[] // live/direct replies shown over the story
  reactions?: Record<string, number> // emoji -> live tally (story reaction, item 8)
}

// -------- Komunitas Sehat — interpersonal-relationship health features -----
// All features below run on the locally-shared store (no backend mocking of
// other people) so they work for real accounts/data as soon as they exist.

// 1. Health Buddy — paired accountability partner with a daily check-in streak.
export interface CheckIn {
  email: string
  date: string // yyyy-mm-dd, one per day
}

// Life Story: health reframed as one thread in a person's whole life, not a
// sequence of clinical events. Every field here is self-reported by the
// user — "impact" is how THEY rate the moment, never a computed score —
// because meaning, relationships, and purpose aren't things an algorithm
// can measure the way it measures a lab value, and pretending otherwise
// would be the same kind of fabrication the rest of this app refuses to do
// with prices or health outcomes. The "chapter" a moment falls into is
// real, computed math (age at the time, from the patient's actual date of
// birth), not an invented narrative label.
export type LifeDomain =
  | 'physical'
  | 'mental'
  | 'social'
  | 'relationships'
  | 'sex'
  | 'money'
  | 'career'
  | 'study'
  | 'recreation'
  | 'family'
  | 'purpose'
  | 'creativity'

export interface LifeEvent {
  id: string
  at: string // ISO date the moment happened (or was logged)
  title: string
  note?: string
  domains: LifeDomain[] // one moment can touch more than one area of life
  impact: 'positive' | 'neutral' | 'negative' // self-rated, never inferred
  // The user's own call, not an algorithm's — real lives have a handful of
  // moments that reorganize everything versus the ordinary ones, and only
  // the person living it can say which is which.
  isTurningPoint?: boolean
}

// A self-set goal, not an algorithm-assigned task. Progress is a number the
// USER updates ("I'm 3 of 5 sessions in") — never inferred from other data,
// for the same reason LifeEvent.impact is self-rated: only the person living
// it can say how far along a relationship, a skill, or a habit really is.
export interface Quest {
  id: string
  title: string
  domain: LifeDomain
  createdAt: string
  targetNote: string // what "done" looks like, in the user's own words
  progressCurrent: number
  progressTarget: number // e.g. 5 (sessions), 1 (binary "done"), 30 (days)
  unit: string // e.g. "sessions", "days", "chapters" — free text
  status: 'active' | 'done' | 'abandoned'
  completedAt?: string
}

// 4. Daily mood log + 6. private "send support" one-tap messages.
export interface MoodEntry {
  id: string
  email: string
  name: string
  mood: 'senang' | 'biasa' | 'lelah' | 'sedih' | 'stres'
  note?: string
  at: string
}
export interface SupportMessage {
  id: string
  fromEmail: string
  fromName: string
  toName: string // free-text recipient (buddy/teman/keluarga) — no fake accounts
  text: string
  at: string
}

// 5. Group health challenge with a live leaderboard.
export interface ChallengeParticipant {
  email: string
  name: string
  progress: number
}
export interface Challenge {
  id: string
  title: string
  unit: string
  goal: number
  endsAt: string
  participants: ChallengeParticipant[]
}

// 9. Circle of Care — small trusted group sharing a mood/activity snapshot.
export interface Circle {
  id: string
  name: string
  memberNames: string[] // free-text member names (family/friends), opt-in
}

// 10. Gratitude wall — short public thank-you notes between users.
export interface GratitudeNote {
  id: string
  fromName: string
  toName: string
  text: string
  at: string
}

// 11. Sport communities — small groups discoverable by shared sport interest;
// also the basis for an "affinity score" between members (item 1).
export interface SportCommunity {
  id: string
  name: string
  sportTag: string // e.g. "Lari", "Yoga", "Gym", "Sepeda"
  memberNames: string[]
  createdBy: string // account email
  createdAt: string
}

// -------- Pusat Kesehatan Realtime: edukasi, news, kalkulasi, monitoring ---
// Self-tracked manual vitals log (separate from the clinical multi-patient `vitals` map).
export interface SelfVital {
  id: string
  at: string // ISO datetime
  systolic: number
  diastolic: number
  heartRate: number
  spo2: number
  tempC: number
}

export interface SleepLog {
  id: string
  date: string // yyyy-mm-dd
  hours: number
  bedtimeConsistent: boolean // went to bed within ~1h of usual time
}

export interface Vo2MaxEntry {
  id: string
  at: string // ISO datetime
  value: number // mL/kg/min
  method: string // "Tes Cooper", "GPS Aktivitas", "Estimasi HR"
}

export interface HealthGoal {
  id: string
  metric: 'water' | 'sleep' | 'steps' | 'checkin' | 'custom'
  label: string
  target: number
  unit: string
}

// Training Intensity journal — Rate of Perceived Exertion (RPE 1-10) per session.
export interface TrainingLog {
  id: string
  date: string // yyyy-mm-dd
  rpe: number // 1 (sangat ringan) – 10 (maksimal)
  type: string // mis. Lari, Gym, HIIT, Renang
  note?: string
}

// Auto-recorded GPS sport activity (route-based) — values are COMPUTED from GPS
// tracking, never entered manually. Powers competitive charts & leaderboards.
export interface GpsActivity {
  id: string
  email: string
  name: string
  sport: string // display name, e.g. "Lari", "Renang", "Triathlon"
  sportType: string // 'run' | 'cycle' | 'swim' | 'marathon' | 'half_marathon' | 'triathlon' | 'walk'
  emoji: string
  distKm: number
  durSec: number
  avgSpeedKmh: number
  kcal: number
  at: string // ISO datetime
  // Heart-rate capture (optional — present when the user entered/synced HR
  // during the session). Samples are downsampled to ≤120 points to keep
  // localStorage small; `s` is seconds from session start.
  avgHr?: number
  maxHr?: number
  hrSamples?: { s: number; bpm: number }[]
}

// -------- Nutrition / calorie diary ----------------------------------------
export interface FoodEntry {
  id: string
  date: string // yyyy-mm-dd
  name: string
  grams: number
  kcal: number
  carbs: number
  protein: number
  fat: number
}

// -------- Daily wellness log (sleep / water / exercise) for trend chart -----
export interface WellnessDay {
  date: string // yyyy-mm-dd
  sleepHr?: number // hours of sleep
  waterMl?: number // water intake in mL
  exerciseKcal?: number // calories burned via exercise
  exerciseMin?: number // total exercise minutes
  sunDone?: boolean // got sunlight exposure today
  sunHr?: number // hours of sun exposure
  metHours?: number // MET-hours of activity
  /**
   * Tenaga yang dirasakan, 1-5, dilaporkan sendiri oleh pemakainya.
   *
   * SENGAJA TIDAK PERNAH MENJADI MASUKAN MODEL. Nilai yang dilaporkan sendiri
   * tidak dapat disamakan dengan nilai terukur, dan mencampurkan keduanya
   * membuat angka model tampak lebih pasti daripada yang sebenarnya. Ia ada
   * untuk dibaca manusia, dan untuk dibandingkan dengan angka terukur ketika
   * keduanya berselisih -- justru perselisihannya yang memberi keterangan.
   */
  tenaga?: number
  /** Catatan bebas, maksimal 280 aksara. */
  catatan?: string
}

// -------- Doctor consultations --------------------------------------------
export interface ConsultSession {
  id: string
  doctorName: string
  specialty: string
  patientEmail: string
  at: string
  feeIdr: number
  status: 'terjadwal' | 'selesai'
}

// -------- Pharmacy products (editable by admin / registered pharmacy) -------
export type PharmacyCategory = 'Demam & Nyeri' | 'Batuk & Pilek' | 'Lambung' | 'Vitamin' | 'Topikal'
export interface PharmacyProduct {
  id: string
  name: string
  desc: string
  category: PharmacyCategory
  priceIdr: number
  rx: boolean // requires prescription
  emoji: string
  color: string
  image?: string // optional uploaded product photo (data URL)
}

// -------- Editable user profile (name, status/bio, avatar) -----------------
export interface ProfileEdit {
  name?: string
  bio?: string
  avatar?: string // data URL / uploaded photo
  sex?: 'L' | 'P' | '-' // jenis kelamin (L=laki-laki, P=perempuan, -=tidak disebut)
  location?: string // kota/domisili
  profession?: string // pekerjaan/keahlian
  link?: string // tautan/sitasi URL (mis. profil profesional, publikasi)
}

// -------- Unified transactions / order history ----------------------------
export type OrderCategory = 'Obat' | 'Konsultasi' | 'Langganan' | 'Lab' | 'Lainnya'
export interface Order {
  id: string
  category: OrderCategory
  title: string
  detail?: string
  amountIdr: number
  status: 'Diproses' | 'Diterima' | 'Selesai'
  at: string
}

// -------- Simulated email outbox ------------------------------------------
export interface EmailMsg {
  id: string
  to: string
  subject: string
  body: string
  at: string
}

// AI-generated patient-facing disease education (brief + deep).
export interface EducationSheet {
  diagnosis: string
  ringkas: string // brief plain-language summary
  mendalam: string // deeper explanation
  caraMenjaga: string[] // how to maintain health
  tandaBahaya: string[] // red flags / when to seek care
  generatedAt: string
}

// -- Marketplace / tokenized medical notes & materials -----------------------

export type MaterialCategory = 'Catatan' | 'Materi' | 'Jurnal' | 'Artikel'
export type ExamTrack = 'USMLE' | 'UKMPPD' | 'Umum'
export type FileType = 'Word' | 'PDF' | 'PowerPoint'
export type MaterialStatus =
  | 'pending-ai' // awaiting Claude AI verification
  | 'pending-verifier' // awaiting specialist verifier
  | 'verified' // approved & listed
  | 'rejected'

export interface AIReview {
  verdict: 'approved' | 'revise'
  score: number // 0-100 quality/accuracy
  notes: string
  at: string
}

export interface VerifierReview {
  verifierName: string
  verifierRole: 'Spesialis' | 'Subspesialis'
  approved: boolean
  notes: string
  at: string
}

export interface Material {
  id: string
  title: string
  description: string
  category: MaterialCategory
  exam: ExamTrack
  specialty: string
  authorId: string
  authorName: string
  fileType: FileType
  fileName: string
  priceTokens: number
  status: MaterialStatus
  aiReview?: AIReview
  verifierReview?: VerifierReview
  createdAt: string
  downloads: number
  rating: number
}

export interface Contributor {
  id: string
  name: string
  role: 'Dokter' | 'Spesialis' | 'Subspesialis'
  specialty: string
  verified: boolean // verified as a contributor by a verifier
  canVerify: boolean // is a verifier (specialist/subspecialist)
}

export type TxType = 'deposit' | 'purchase' | 'payout' | 'subscription' | 'withdraw' | 'consult'
// Sole payment path: manual transfer to the owner's Mandiri account (see lib/payment).
export type PaymentMethod = 'Transfer Bank'
export interface WalletTx {
  id: string
  type: TxType
  amount: number // tokens (+in / -out)
  note: string
  at: string
}
export interface Wallet {
  balance: number // PanaceaToken (PNC)
  transactions: WalletTx[]
}

export type SubscriptionPlan = 'none' | 'individu' | 'rumah-sakit'
export interface Subscription {
  plan: SubscriptionPlan
  since?: string
  seats?: number // for hospital plan
}

export interface AppState {
  patients: Patient[]
  activePatientId: string
  vitals: Record<string, VitalSign[]>
  supportive: Record<string, SupportiveResult[]>
  chats: Record<string, ChatMessage[]>
  records: Record<string, EMRRecord>
  education: Record<string, EducationSheet> // by patientId
  materials: Material[]
  ownedMaterialIds: string[]
  contributors: Contributor[]
  wallet: Wallet
  subscription: Subscription
  currentUserId: string // the logged-in contributor (demo "act as")
  account: Account | null // logged-in account (role-based)
  adminEmails: string[] // emails allowed to sign in as Admin (managed by owner)
  longevitySubExpires?: string // ISO date — AI Longevity score subscription expiry
  chronicSubExpires?: string // ISO date — chronic-care monitoring subscription expiry
  chronicLifetime?: boolean // lifetime chronic-care monitoring access
  authorSubPrices: Record<string, number> // authorEmail -> monthly PNC price
  authorSubs: Record<string, string> // authorEmail -> subscription expiry ISO
  posts: SocialPost[]
  stories: Story[]
  follows: string[] // emails the current account follows
  presence: Record<string, string> // email -> ISO last-active timestamp (online indicator)
  buddyName?: string // accountability Health Buddy (free-text name, item 1)
  checkIns: CheckIn[] // daily accountability check-ins (item 1)
  moods: MoodEntry[] // mood log (item 4)
  supportMessages: SupportMessage[] // private one-tap support notes (items 4 & 6)
  challenges: Challenge[] // group health challenges (item 5)
  circles: Circle[] // Circle of Care groups (item 9)
  gratitudes: GratitudeNote[] // gratitude wall (item 10)
  communities: SportCommunity[] // sport-interest communities (item 10b / affinity basis for item 1)
  selfVitals: SelfVital[] // manual vitals monitoring log (Pusat Kesehatan Realtime)
  sleepLogs: SleepLog[] // sleep quality monitoring
  eduBookmarks: string[] // bookmarked education article ids
  quizScore: { correct: number; total: number } // myth-vs-fact quiz running score
  vo2maxLog: Vo2MaxEntry[] // VO2Max measurements over time (Cooper test, GPS, HR estimate)
  goals: HealthGoal[] // personal health targets (item 4)
  gpsActivities: GpsActivity[] // auto-recorded GPS sport activities (competitive charts)
  trainingLogs: TrainingLog[] // Training Intensity (RPE) journal
  activeProgram?: string // training program the user is currently following
  lifeEvents: Record<string, LifeEvent[]> // patientId -> the user's own life story (see LifeEvent below)
  quests: Record<string, Quest[]> // patientId -> self-set goals tied to life domains (see Quest below)
  foods: FoodEntry[]
  /** Food, sleep, training and GPS ids removed on this device. The account remembers them so another phone cannot restore the row. */
  diaryHiddenFoodIds: string[]
  diaryHiddenSleepIds: string[]
  diaryHiddenTrainingIds: string[]
  diaryHiddenGpsIds: string[]
  wellness: Record<string, WellnessDay> // daily sleep/water/exercise by date
  consults: ConsultSession[]
  orders: Order[]
  products: PharmacyProduct[]
  profiles: Record<string, ProfileEdit> // by email
  emails: EmailMsg[]
  settings: {
    apiKey: string
    model: string
    doctorName: string
    // Notification preferences
    notifVitals?: boolean
    notifEmail?: boolean
    notifSms?: boolean
    notifAiInsights?: boolean
    notifBroadcasts?: boolean
    notifTransactions?: boolean
    // Security
    twoFactor?: boolean
    biometricLock?: boolean
  }
}

// A daily medication reminder. nextFireAt is a UTC ISO instant computed
// client-side from the user's chosen local time — see MedicationReminders.tsx.
export interface MedReminder {
  id: string
  medName: string
  dose: string
  timeOfDay: string // "HH:MM", display only
  nextFireAt: string
  active: boolean
  createdAt: string
}
