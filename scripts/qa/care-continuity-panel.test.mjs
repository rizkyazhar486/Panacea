import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateResultClosure } from '../../src/domains/clinical-operations/model/resultClosure.ts'
import { evaluateCareAccessOrchestration } from '../../src/domains/clinical-operations/model/careAccessOrchestrator.ts'
import { evaluateClinicalEpisodeResilience } from '../../src/domains/clinical-operations/model/clinicalEpisodeResilience.ts'
import {
  deriveCareContinuityState,
  evaluateCareJourneyContinuity,
  deriveCareJourneyTimelineEvents,
  derivePatientLongitudinalTimeline,
  exportCareJourneySummary,
  deriveCareJourneyCostSummary,
  evaluateEpisodeReadmissionRisk,
  evaluateReferralHandshakeContinuity,
  deriveEdenCareCompanion,
  deriveEdenLifeBalanceSynthesis,
  deriveEdenLifeStoryBridge,
  deriveEdenPhysiologyAppreciation,
  deriveEdenPreventionLongevityRhythm,
  deriveEdenSupportCircleBridge,
  deriveEdenVisitPreparationCompanion,
  deriveEdenReflectionSanctuaryBridge,
  deriveEdenUniversalAcceptanceBridge,
  deriveEdenRestorativeEnvironmentBridge,
  deriveEdenMultiModelRegenerationBridge,
  deriveEdenQuantumBioPhotonicBridge,
  deriveEdenMultidimensionalConsciousnessBridge,
  deriveEdenBioCosmicSymphonyBridge,
  deriveEdenMultiAgentHealingCouncilBridge,
  deriveEdenBioHarmonicWaveformBridge,
  deriveEdenCircadianMitochondrialHarmonizerBridge,
  deriveEdenProteostasisAutophagicFluxBridge,
  deriveEdenTelomericGenomicIntegrityBridge,
  deriveEdenSenescentInflammagingBridge,
  deriveEdenRegenerativePlasticityBridge,
  deriveEdenEpigeneticAgeReversalBridge,
  deriveEdenMitochondrialHeteroplasmyBridge,
  deriveEdenCircadianAutophagyPulseBridge,
  deriveEdenRetrotransposonSilencingBridge,
  deriveEdenSirtuinNadParp1Bridge,
  deriveEdenShelterinCapProtectionBridge,
  deriveEdenMitophagicPrimingBridge,
  deriveEdenMicrovascularResilienceBridge,
  deriveEdenRibosomalQuiescenceBridge,
  translateClinicalTermToEden,
  EDEN_PLAIN_LANGUAGE_GLOSSARY,
} from '../../src/domains/clinical-operations/model/careContinuityProjection.ts'
import {
  ensureEpisodeFromVerifiedPlan,
  syncEpisodeWithPlanItems,
  planCategoryToStage,
  fulfillMilestonesWithSupportiveResults,
  recordClinicalOutcome,
  appendTimelineEvent,
  linkEpisodeComorbidity,
  isComplete,
} from '../../src/lib/careEpisode.ts'

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8')

test('CareContinuityPanel: enforces clean architecture boundary and domain exports', () => {
  const panelSrc = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  const indexSrc = read('src/domains/clinical-operations/index.ts')
  const visitSrc = read('src/pages/clinical/VisitOS.tsx')

  // Rule lib-tidak-impor-ui: domain UI must never import components from src/components/
  assert.doesNotMatch(
    panelSrc,
    /from\s+['"](?:\.\.\/)+components\//,
    'CareContinuityPanel must not import from src/components/'
  )

  // Domain index must export CareContinuityPanel and deriveCareContinuityState
  assert.match(indexSrc, /export\s+\{[^}]*CareContinuityPanel[^}]*\}\s+from\s+['"]\.\/ui\/CareContinuityPanel['"]/)
  assert.match(indexSrc, /export\s+\{[^}]*deriveCareContinuityState[^}]*\}\s+from\s+['"]\.\/model\/careContinuityProjection['"]/)

  // VisitOS must wire CareContinuityPanel with live projection props
  assert.match(visitSrc, /import\s+\{[^}]*CareContinuityPanel[^}]*\}\s+from\s+['"]\.\.\/\.\.\/domains\/clinical-operations['"]/)
  assert.match(visitSrc, /<CareContinuityPanel/)
  assert.match(visitSrc, /closure=\{careContinuity\?\.closure\}/)
  assert.match(visitSrc, /careAccess=\{careContinuity\?\.careAccess\}/)
  assert.match(visitSrc, /episodeResilience=\{careContinuity\?\.episodeResilience\}/)
  assert.match(visitSrc, /oneOsProof=\{careContinuity\?\.oneOsProof\}/)
  assert.match(visitSrc, /careJourneys=\{careContinuity\?\.careJourneys\}/)
  assert.match(visitSrc, /vitals:\s*state\.vitals\[activePatient\.id\]/)
})

test('CareContinuityPanel: enforces PRD §8.5 result closure and clinical safety boundary surface', () => {
  const panelSrc = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')

  // Data attribute and accessible region
  assert.match(panelSrc, /data-care-continuity-panel="v1"/)
  assert.match(panelSrc, /aria-label=\{`Care continuity and result closure for \$\{patientName\}`\}/)

  // Dark mode ratchet
  assert.match(panelSrc, /className=\{`dark rounded-2xl border border-white\/10 bg-\[#06101e\]/)

  // Clinical Safety Boundary
  assert.match(panelSrc, /Clinical Safety Boundary/)
  assert.match(panelSrc, /Financial or administrative workflow state may never deny emergency or vital clinical care/)

  // PRD §8.5 Result Closure Section
  assert.match(panelSrc, /Care Continuity &amp; Result Closure/)
  assert.match(panelSrc, /PRD §8\.5 Result Closure/)
  assert.match(panelSrc, /Human accountability: automated system notes cannot close result follow-up tasks/)
  assert.match(panelSrc, /Results up to date/)
  assert.match(panelSrc, /Overdue results/)

  // Diagnostic Routing & Prior Auth Section
  assert.match(panelSrc, /Diagnostic Continuity/)
  assert.match(panelSrc, /Administrative status:/)

  // Episode Transport Durability Section
  assert.match(panelSrc, /Offline Transport/)
  assert.match(panelSrc, /Offline ready/)
  assert.match(panelSrc, /tamper-evident digests/)

  // One OS Evidence & Completeness Proof Section
  assert.match(panelSrc, /data-one-os-proof="v1"/)
  assert.match(panelSrc, /One OS Care Proof/)
  assert.match(panelSrc, /Trust coverage:/)
  assert.match(panelSrc, /Auditable proof: structural measures verify data provenance and completeness without fabricated claims/)

  // Care Journey Continuity Section (T-CLIN-07)
  assert.match(panelSrc, /data-care-journey-continuity="v1"/)
  assert.match(panelSrc, /Care Journey/)
  assert.match(panelSrc, /href="#\/care-episode"/)
  assert.match(panelSrc, /Open Care Journey &rarr;/)
})

test('deriveCareContinuityState: positive control - clinician-signed encounter closes supportive result review', () => {
  const now = '2026-10-25T12:00:00.000Z'
  const projection = deriveCareContinuityState({
    patientId: 'patient-signed-1',
    evaluatedAt: now,
    vitals: [
      {
        takenAt: '2026-10-25T08:00:00.000Z',
        verifiedById: 'nurse-1',
        source: 'vital-signs-monitor',
      },
    ],
    supportiveResults: [
      {
        id: 'lab-hb-1',
        takenAt: '2026-10-25T08:00:00.000Z',
        category: 'Lab',
        name: 'Hemoglobin',
        value: '14.2',
        unit: 'g/dL',
        flag: 'normal',
      },
    ],
    record: {
      id: 'emr-001',
      patientId: 'patient-signed-1',
      createdAt: '2026-10-25T08:30:00.000Z',
      updatedAt: '2026-10-25T09:00:00.000Z',
      signedById: 'dr-jane-doe',
      signedAt: '2026-10-25T09:00:00.000Z',
      anamnesis: {
        keluhanUtama: 'Patient reports feeling well.',
        rps: 'No active complaints.',
        rpd: 'None',
        rpk: 'None',
        riwayatKehamilan: '',
        riwayatPengobatan: '',
      },
      physicalExam: { verifiedById: 'dr-jane-doe' },
      problems: [],
      primaryDiagnosis: { code: 'Z00.0', title: 'General exam' },
      plan: [{ id: 'plan-1', text: 'Routine follow-up in 1 year', status: 'diverifikasi' }],
      references: [],
    },
  })

  assert.ok(projection.closure, 'closure result is present')
  assert.equal(projection.closure.closedCount, 1)
  assert.equal(projection.closure.closureRate, 1.0)
  assert.equal(projection.closure.overdueIds.length, 0)
  assert.equal(projection.careAccess.clinicalCare.financialStateMayDenyCare, false)
  assert.equal(projection.careAccess.financialWorkflow.claimSubmissionReady, true)
  assert.equal(projection.episodeResilience.safeToContinueOffline, true)

  // One OS Care Proof assertions
  assert.ok(projection.oneOsProof, 'oneOsProof is derived')
  assert.equal(projection.oneOsProof.completenessCoverage, 1.0)
  assert.equal(projection.oneOsProof.trustCoverage, 1.0)
  assert.equal(projection.oneOsProof.missingRequiredDataClasses.length, 0)
  assert.equal(projection.oneOsProof.unresolvedFragmentCount, 0)
})

test('deriveCareContinuityState: negative control - unsigned record cannot close result follow-up task', () => {
  const now = '2026-10-25T12:00:00.000Z'
  const projection = deriveCareContinuityState({
    patientId: 'patient-unsigned-2',
    evaluatedAt: now,
    supportiveResults: [
      {
        id: 'lab-critical-k',
        takenAt: '2026-10-23T08:00:00.000Z',
        category: 'Lab',
        name: 'Potassium',
        value: '6.8',
        unit: 'mEq/L',
        flag: 'critical',
      },
    ],
    record: {
      id: 'emr-002',
      patientId: 'patient-unsigned-2',
      createdAt: '2026-10-23T08:30:00.000Z',
      updatedAt: '2026-10-23T09:00:00.000Z',
      anamnesis: {
        keluhanUtama: 'Unsigned draft note by triage assistant',
        rps: 'Hyperkalemia suspicion',
        rpd: 'None',
        rpk: 'None',
        riwayatKehamilan: '',
        riwayatPengobatan: '',
      },
      physicalExam: {}, // Not verified by clinician
      problems: [],
      plan: [],
      references: [],
    },
  })

  assert.ok(projection.closure, 'closure result is present')
  assert.equal(projection.closure.closedCount, 0)
  assert.equal(projection.closure.closureRate, 0.0)
  assert.deepEqual(projection.closure.overdueIds, ['lab-critical-k'])
  assert.ok(
    projection.careAccess.financialWorkflow.missingClaimEvidence.includes('signed clinical record') ||
    projection.careAccess.financialWorkflow.missingClaimEvidence.includes('clinicalRecordSigned'),
    'missing claim evidence captures unsigned record'
  )
  // Invariant: financial/administrative state never denies emergency care
  assert.equal(projection.careAccess.clinicalCare.financialStateMayDenyCare, false)

  // One OS Care Proof assertions on unsigned incomplete record
  assert.ok(projection.oneOsProof, 'oneOsProof is derived')
  assert.ok(projection.oneOsProof.completenessCoverage < 1.0, 'completeness is incomplete')
  assert.ok(projection.oneOsProof.missingRequiredDataClasses.includes('physical-exam'), 'missing physical-exam')
  assert.ok(projection.oneOsProof.missingRequiredDataClasses.includes('plan'), 'missing plan')
  assert.ok(projection.oneOsProof.unresolvedFragmentCount > 0, 'unresolved fragments require review')
})

test('deriveCareContinuityState: empty supportive results returns graceful null closure without throwing', () => {
  const now = '2026-10-25T12:00:00.000Z'
  const projection = deriveCareContinuityState({
    patientId: 'patient-empty-3',
    evaluatedAt: now,
    supportiveResults: [],
  })

  assert.equal(projection.closure, null)
  assert.ok(
    projection.careAccess.financialWorkflow.missingClaimEvidence.includes('supporting evidence') ||
    projection.careAccess.financialWorkflow.missingClaimEvidence.includes('supportingEvidenceLinked'),
    'missing evidence reflects absence of supportive results'
  )
  assert.equal(projection.episodeResilience.safeToContinueOffline, true)
  assert.equal(projection.oneOsProof.completenessCoverage, 0.0)
  assert.equal(projection.oneOsProof.trustCoverage, null)
  assert.equal(projection.oneOsProof.missingRequiredDataClasses.length, 5)
})

test('VisitOS: wires ClinicalPatientContext and clinical anatomical twin container', () => {
  const visitSrc = read('src/pages/clinical/VisitOS.tsx')
  assert.match(
    visitSrc,
    /import\s+\{[^}]*ClinicalPatientContext[^}]*\}\s+from\s+['"]\.\.\/\.\.\/components\/ClinicalPatientContext['"]/,
    'VisitOS must import ClinicalPatientContext'
  )
  assert.match(
    visitSrc,
    /<div data-visit-patient-body-context="v1">\s*<ClinicalPatientContext \/>\s*<\/div>/,
    'VisitOS must render ClinicalPatientContext in designated body-context container'
  )
})

test('VisitOS & CareEpisode: establishes bi-directional navigation for longitudinal care journeys', () => {
  const visitSrc = read('src/pages/clinical/VisitOS.tsx')
  const episodeSrc = read('src/pages/clinical/CareEpisode.tsx')

  // VisitOS links to /care-episode
  assert.match(
    visitSrc,
    /\['\/care-episode',\s*'Care journey'\]/,
    'VisitOS related clinical tools must link to /care-episode'
  )

  // CareEpisode imports PanaceaZoneNav and links to /visit
  assert.match(
    episodeSrc,
    /import\s+\{[^}]*PanaceaZoneNav[^}]*\}\s+from\s+['"]\.\.\/\.\.\/components\/PanaceaZoneNav['"]/,
    'CareEpisode must import PanaceaZoneNav'
  )
  assert.match(
    episodeSrc,
    /<Link[^>]*to="\/visit"/,
    'CareEpisode must link back to /visit'
  )
  assert.match(
    episodeSrc,
    /<Link[^>]*to="\/planning"/,
    'CareEpisode must link to /planning'
  )
})

test('CareEpisode: seeds care journeys from verified encounter diagnosis and links ICD-10 provenance', () => {
  const episodeSrc = read('src/pages/clinical/CareEpisode.tsx')

  // UI contract: ensures import and wiring of ensureEpisodeFromVerifiedPlan
  assert.match(
    episodeSrc,
    /ensureEpisodeFromVerifiedPlan/,
    'CareEpisode must import ensureEpisodeFromVerifiedPlan'
  )
  assert.match(
    episodeSrc,
    /data-seed-journey="primary-diagnosis"/,
    'CareEpisode must provide a seed journey button for encounter diagnosis'
  )
  assert.match(
    episodeSrc,
    /data-care-episode-id=\{episode\.id\}/,
    'CareEpisode card must expose data-care-episode-id'
  )
  assert.match(
    episodeSrc,
    /data-diagnosis-code=\{episode\.diagnosisCode\s*\|\|\s*'none'\}/,
    'CareEpisode card must expose data-diagnosis-code'
  )
  assert.match(
    episodeSrc,
    /ICD-10:\s*\{episode\.diagnosisCode\}/,
    'CareEpisode card must render ICD-10 code badge when diagnosisCode is present'
  )

  // Pure logic contract: ensureEpisodeFromVerifiedPlan
  const mockRecord = {
    patientId: 'patient-42',
    primaryDiagnosis: { code: 'K80.0', title: 'Calculus of gallbladder with acute cholecystitis' },
    problems: [{ id: 'prob-gallstone', title: 'Right upper quadrant pain' }],
    plan: [{ id: 'plan-1', text: 'Surgical consult', status: 'diverifikasi' }],
    careEpisodes: [],
  }

  // Positive: seeds new episode with verified problem and diagnosis, cascades plan to active
  const seeded = ensureEpisodeFromVerifiedPlan(mockRecord)
  assert.equal(seeded.careEpisodes.length, 1)
  const ep = seeded.careEpisodes[0]
  assert.equal(ep.title, 'Calculus of gallbladder with acute cholecystitis')
  assert.equal(ep.diagnosisCode, 'K80.0')
  assert.equal(ep.problemId, 'prob-gallstone')

  const problemStage = ep.stages.find((s) => s.stage === 'problem')
  const dxStage = ep.stages.find((s) => s.stage === 'diagnosis')
  const planStage = ep.stages.find((s) => s.stage === 'plan')
  assert.equal(problemStage.status, 'done')
  assert.equal(dxStage.status, 'done')
  assert.equal(planStage.status, 'active')

  // Idempotent: repeated calls do not create duplicate journeys for same diagnosis
  const reseeded = ensureEpisodeFromVerifiedPlan(seeded)
  assert.equal(reseeded.careEpisodes.length, 1)

  // Negative: records without primary diagnosis remain untouched
  const noDxRecord = { patientId: 'patient-43', careEpisodes: [] }
  assert.equal(ensureEpisodeFromVerifiedPlan(noDxRecord), noDxRecord)
})

test('deriveCareContinuityState & evaluateCareJourneyContinuity: projects active, blocked, and completed care journeys', () => {
  const now = '2026-10-25T12:00:00.000Z'
  const recordWithJourneys = {
    id: 'emr-journey-1',
    patientId: 'patient-journey-1',
    createdAt: '2026-10-25T08:30:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z',
    primaryDiagnosis: { code: 'E11.9', title: 'Type 2 diabetes mellitus' },
    careEpisodes: [
      {
        id: 'ce_active_1',
        title: 'Type 2 diabetes mellitus',
        diagnosisCode: 'E11.9',
        createdAt: '2026-10-25T08:30:00.000Z',
        updatedAt: '2026-10-25T09:00:00.000Z',
        stages: [
          { stage: 'problem', status: 'done' },
          { stage: 'diagnosis', status: 'done' },
          { stage: 'plan', status: 'active' },
          { stage: 'provider', status: 'pending' },
          { stage: 'cost', status: 'pending' },
          { stage: 'schedule', status: 'pending' },
          { stage: 'treatment', status: 'pending' },
          { stage: 'recovery', status: 'pending' },
          { stage: 'followUp', status: 'pending' },
          { stage: 'outcome', status: 'pending' },
        ],
      },
      {
        id: 'ce_blocked_2',
        title: 'Diabetic Retinopathy Screening',
        createdAt: '2026-10-25T08:35:00.000Z',
        updatedAt: '2026-10-25T09:00:00.000Z',
        stages: [
          { stage: 'problem', status: 'done' },
          { stage: 'diagnosis', status: 'done' },
          { stage: 'plan', status: 'done' },
          { stage: 'provider', status: 'blocked', blockedReason: 'Specialist referral awaiting authorization' },
          { stage: 'cost', status: 'pending' },
          { stage: 'schedule', status: 'pending' },
          { stage: 'treatment', status: 'pending' },
          { stage: 'recovery', status: 'pending' },
          { stage: 'followUp', status: 'pending' },
          { stage: 'outcome', status: 'pending' },
        ],
      },
    ],
  }

  const projection = deriveCareContinuityState({
    patientId: 'patient-journey-1',
    evaluatedAt: now,
    record: recordWithJourneys,
  })

  assert.ok(projection.careJourneys, 'careJourneys is projected')
  assert.equal(projection.careJourneys.totalJourneys, 2)
  assert.equal(projection.careJourneys.activeJourneys, 1)
  assert.equal(projection.careJourneys.blockedJourneys, 1)
  assert.equal(projection.careJourneys.completedJourneys, 0)
  assert.equal(projection.careJourneys.hasBlockedStages, true)
  assert.equal(projection.careJourneys.stalledCount, 1)
  assert.equal(projection.careJourneys.episodes.length, 2)

  // Episode 1 details
  const ep1 = projection.careJourneys.episodes[0]
  assert.equal(ep1.id, 'ce_active_1')
  assert.equal(ep1.activeStage, 'plan')
  assert.equal(ep1.stageStatus, 'active')
  assert.equal(ep1.completedStagesCount, 2)
  assert.equal(ep1.totalStagesCount, 10)

  // Episode 2 details (blocked)
  const ep2 = projection.careJourneys.episodes[1]
  assert.equal(ep2.id, 'ce_blocked_2')
  assert.equal(ep2.activeStage, 'provider')
  assert.equal(ep2.stageStatus, 'blocked')
  assert.equal(ep2.blockedReason, 'Specialist referral awaiting authorization')
  assert.equal(ep2.completedStagesCount, 3)

  // Control: completed episode
  const completedEpisode = {
    id: 'ce_done_3',
    title: 'Acute Bronchitis Resolution',
    stages: [
      'problem', 'diagnosis', 'plan', 'provider', 'cost',
      'schedule', 'treatment', 'recovery', 'followUp', 'outcome',
    ].map((stage) => ({ stage, status: 'done' })),
  }

  const completedResult = evaluateCareJourneyContinuity([completedEpisode])
  assert.equal(completedResult.totalJourneys, 1)
  assert.equal(completedResult.completedJourneys, 1)
  assert.equal(completedResult.activeJourneys, 0)
  assert.equal(completedResult.blockedJourneys, 0)
  assert.equal(completedResult.hasBlockedStages, false)
  assert.equal(completedResult.episodes[0].completedStagesCount, 10)

  // Negative control: record without care episodes yields null careJourneys
  const projectionNoJourneys = deriveCareContinuityState({
    patientId: 'patient-no-journeys',
    evaluatedAt: now,
    record: { id: 'emr-no-ep', patientId: 'patient-no-journeys', careEpisodes: [] },
  })
  assert.equal(projectionNoJourneys.careJourneys, null)
})

test('Planning & CareEpisode: establishes bi-directional care journey linkage with PanaceaZoneNav and trajectory card', () => {
  const planSrc = read('src/pages/clinical/Planning.tsx')
  const episodeSrc = read('src/pages/clinical/CareEpisode.tsx')

  // Planning imports and renders PanaceaZoneNav
  assert.match(
    planSrc,
    /import\s+\{[^}]*PanaceaZoneNav[^}]*\}\s+from\s+['"]\.\.\/\.\.\/components\/PanaceaZoneNav['"]/,
    'Planning must import PanaceaZoneNav'
  )
  assert.match(
    planSrc,
    /<PanaceaZoneNav \/>/,
    'Planning must render PanaceaZoneNav'
  )

  // Planning renders Care Journey Active card and links to /care-episode
  assert.match(
    planSrc,
    /data-planning-care-journey="v1"/,
    'Planning must expose data-planning-care-journey="v1"'
  )
  assert.match(
    planSrc,
    /<Link[^>]*to="\/care-episode"/,
    'Planning must link directly to /care-episode'
  )

  // CareEpisode exposes planning navigation container
  assert.match(
    episodeSrc,
    /data-planning-nav="v1"/,
    'CareEpisode must expose data-planning-nav="v1"'
  )
  assert.match(
    episodeSrc,
    /Clinical Plan (?:→|&rarr;)/,
    'CareEpisode must display Clinical Plan link'
  )
})

test('deriveCareContinuityState & evaluateCareJourneyContinuity: real-time stall detection and health classification (T-CLIN-09)', async () => {
  const { evaluateCareJourneyContinuity, deriveCareContinuityState } = await import(
    '../../src/domains/clinical-operations/model/careContinuityProjection.ts'
  )

  const evaluatedAt = '2026-10-25T12:00:00Z'
  const evaluatedAtMs = Date.parse(evaluatedAt)

  // 1. Episode exceeding expected timeframe -> 'stalled'
  // Stage 'provider' has expected 5 days. Updated 8 days ago.
  const eightDaysAgo = new Date(evaluatedAtMs - 8 * 86_400_000).toISOString()
  const stalledEpisode = {
    id: 'ep-stalled',
    title: 'Post-op Cardiac Rehabilitation',
    createdAt: eightDaysAgo,
    updatedAt: eightDaysAgo,
    stages: [
      { id: 's1', stage: 'problem', status: 'done', updatedAt: eightDaysAgo },
      { id: 's2', stage: 'diagnosis', status: 'done', updatedAt: eightDaysAgo },
      { id: 's3', stage: 'provider', status: 'active', updatedAt: eightDaysAgo },
    ],
  }

  // 2. Episode approaching expected timeframe -> 'at_risk' (>= 70% of 5 days = 3.5 days -> 4 days)
  const fourDaysAgo = new Date(evaluatedAtMs - 4 * 86_400_000).toISOString()
  const atRiskEpisode = {
    id: 'ep-at-risk',
    title: 'Endocrine Specialist Consultation',
    createdAt: fourDaysAgo,
    updatedAt: fourDaysAgo,
    stages: [
      { id: 's1', stage: 'problem', status: 'done', updatedAt: fourDaysAgo },
      { id: 's2', stage: 'provider', status: 'active', updatedAt: fourDaysAgo },
    ],
  }

  // 3. Episode on track -> 'on_track' (1 day in provider stage)
  const oneDayAgo = new Date(evaluatedAtMs - 1 * 86_400_000).toISOString()
  const onTrackEpisode = {
    id: 'ep-on-track',
    title: 'Routine Health Checkup Follow-up',
    createdAt: oneDayAgo,
    updatedAt: oneDayAgo,
    stages: [
      { id: 's1', stage: 'problem', status: 'done', updatedAt: oneDayAgo },
      { id: 's2', stage: 'provider', status: 'active', updatedAt: oneDayAgo },
    ],
  }

  // 4. Episode with clinician override: expectedDaysOverride: { provider: 10 }
  // 8 days elapsed is < 10 days expected, but >= 7 days (70%) -> 'at_risk' instead of 'stalled'
  const overriddenEpisode = {
    ...stalledEpisode,
    id: 'ep-override',
    expectedDaysOverride: { provider: 10 },
  }

  const result = evaluateCareJourneyContinuity(
    [stalledEpisode, atRiskEpisode, onTrackEpisode, overriddenEpisode],
    evaluatedAt
  )

  assert.equal(result.totalJourneys, 4)
  assert.equal(result.stalledCount, 1)
  assert.equal(result.atRiskCount, 2)
  assert.equal(result.hasBlockedStages, true)

  const ep0 = result.episodes[0]
  assert.equal(ep0.health, 'stalled')
  assert.equal(ep0.elapsedDaysInCurrentStage, 8)
  assert.match(ep0.stalledReason, /Stage exceeded expected timeframe \(8d vs 5d\)/)

  const ep1 = result.episodes[1]
  assert.equal(ep1.health, 'at_risk')
  assert.equal(ep1.elapsedDaysInCurrentStage, 4)
  assert.match(ep1.stalledReason, /Stage approaching expected timeframe \(4d vs 5d\)/)

  const ep2 = result.episodes[2]
  assert.equal(ep2.health, 'on_track')
  assert.equal(ep2.elapsedDaysInCurrentStage, 1)

  const ep3 = result.episodes[3]
  assert.equal(ep3.health, 'at_risk')
  assert.equal(ep3.elapsedDaysInCurrentStage, 8)
  assert.match(ep3.stalledReason, /Stage approaching expected timeframe \(8d vs 10d\)/)

  // Verify pure integration via deriveCareContinuityState
  const projection = deriveCareContinuityState({
    patientId: 'patient-stall-test',
    evaluatedAt,
    record: {
      id: 'enc-1',
      patientId: 'patient-stall-test',
      careEpisodes: [stalledEpisode, atRiskEpisode],
    },
  })
  assert.ok(projection.careJourneys)
  assert.equal(projection.careJourneys.stalledCount, 1)
  assert.equal(projection.careJourneys.atRiskCount, 1)
})

test('deriveCareContinuityState & CareEpisode: longitudinal care plan milestones and action item sync (T-CLIN-10)', async () => {
  const evaluatedAt = '2026-10-25T14:00:00.000Z'

  // 1. Plan category to stage mapping contract
  assert.equal(planCategoryToStage('Definitif'), 'treatment')
  assert.equal(planCategoryToStage('Suportif'), 'treatment')
  assert.equal(planCategoryToStage('Follow-up'), 'followUp')
  assert.equal(planCategoryToStage('Monitoring'), 'recovery')
  assert.equal(planCategoryToStage('Edukasi'), 'plan')

  // 2. Plan items from clinical encounter
  const planItems = [
    {
      id: 'plan-1',
      category: 'Definitif',
      text: 'Laparoscopic cholecystectomy elective scheduling',
      source: 'Dokter',
      status: 'diverifikasi',
      verifiedById: 'dr-anita',
      verifiedAt: '2026-10-25T10:00:00.000Z',
    },
    {
      id: 'plan-2',
      category: 'Suportif',
      text: 'IV Ceftriaxone 1g pre-op antibiotic prophylaxis',
      source: 'Dokter',
      status: 'diverifikasi',
      verifiedById: 'dr-anita',
      verifiedAt: '2026-10-25T10:05:00.000Z',
    },
    {
      id: 'plan-3',
      category: 'Follow-up',
      text: 'Post-op surgical wound check in 7 days',
      source: 'Dokter',
      status: 'diverifikasi',
      verifiedById: 'dr-anita',
      verifiedAt: '2026-10-25T10:10:00.000Z',
    },
  ]

  // Episode in active 'plan' stage
  const baseEpisode = {
    id: 'ce-milestone-test',
    title: 'Kolelitiasis Simtomatik',
    diagnosisCode: 'K80.2',
    createdAt: '2026-10-24T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-10-24T08:00:00.000Z' },
      { stage: 'diagnosis', status: 'done', updatedAt: '2026-10-24T08:00:00.000Z' },
      { stage: 'plan', status: 'active', updatedAt: '2026-10-24T08:00:00.000Z' },
      { stage: 'provider', status: 'pending' },
      { stage: 'cost', status: 'pending' },
      { stage: 'schedule', status: 'pending' },
      { stage: 'treatment', status: 'pending' },
      { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' },
      { stage: 'outcome', status: 'pending' },
    ],
  }

  // Pure projection in evaluateCareJourneyContinuity
  const projected = evaluateCareJourneyContinuity([baseEpisode], evaluatedAt, planItems)
  assert.equal(projected.totalJourneys, 1)
  assert.equal(projected.totalActionItemsCount, 3)
  assert.equal(projected.totalVerifiedActionItemsCount, 3)
  assert.equal(projected.totalPendingActionItemsCount, 0)

  const epSummary = projected.episodes[0]
  assert.equal(epSummary.actionItemsCount, 3)
  assert.equal(epSummary.verifiedActionItemsCount, 3)
  assert.equal(epSummary.pendingActionItemsCount, 0)
  assert.equal(epSummary.milestones.length, 3)
  assert.equal(epSummary.milestones[0].targetStage, 'treatment')
  assert.equal(epSummary.milestones[0].verified, true)
  assert.equal(epSummary.milestones[2].targetStage, 'followUp')

  // Negative control: unverified proposal (status: 'usulan') must not advance stage
  const mixedPlanItems = [
    ...planItems.slice(0, 2),
    {
      id: 'plan-unverified',
      category: 'Monitoring',
      text: 'Daily abdominal drain output logging',
      source: 'AI',
      status: 'usulan',
    },
  ]

  const syncedWithProposals = syncEpisodeWithPlanItems(baseEpisode, mixedPlanItems, {
    nowIso: evaluatedAt,
    autoAdvancePlanStage: true,
  })
  const planStageUnverified = syncedWithProposals.stages.find((s) => s.stage === 'plan')
  assert.equal(planStageUnverified.status, 'active', 'Unverified plan item must keep plan stage active (clinical safety invariant)')
  assert.equal(syncedWithProposals.milestones.length, 3)
  assert.equal(syncedWithProposals.milestones[2].status, 'pending')

  // Positive control: 100% verified plan items promotes plan stage to 'done' and cascades provider to 'active'
  const syncedAllVerified = syncEpisodeWithPlanItems(baseEpisode, planItems, {
    nowIso: evaluatedAt,
    autoAdvancePlanStage: true,
  })
  const planStageDone = syncedAllVerified.stages.find((s) => s.stage === 'plan')
  const providerStageActive = syncedAllVerified.stages.find((s) => s.stage === 'provider')
  assert.equal(planStageDone.status, 'done', 'All verified plan items must mark plan stage done')
  assert.equal(providerStageActive.status, 'active', 'Marking plan done cascades provider stage to active')

  // Integration with deriveCareContinuityState
  const continuity = deriveCareContinuityState({
    patientId: 'patient-ms-test',
    evaluatedAt,
    record: {
      id: 'enc-ms',
      patientId: 'patient-ms-test',
      plan: planItems,
      careEpisodes: [syncedAllVerified],
    },
  })
  assert.ok(continuity.careJourneys)
  assert.equal(continuity.careJourneys.totalActionItemsCount, 3)
  assert.equal(continuity.careJourneys.totalVerifiedActionItemsCount, 3)
})

test('deriveCareContinuityState & CareEpisode: clinical order fulfillment and result ingestion into care milestones (T-CLIN-11)', async () => {
  const evaluatedAt = '2026-10-25T14:30:00.000Z'

  const supportiveResults = [
    {
      id: 'res-lab-1',
      takenAt: '2026-10-25T11:00:00.000Z',
      category: 'Lab',
      name: 'Total Bilirubin',
      value: '1.2',
      unit: 'mg/dL',
      flag: 'normal',
    },
    {
      id: 'res-usg-1',
      takenAt: '2026-10-25T11:30:00.000Z',
      category: 'Radiologi',
      name: 'USG Abdomen',
      value: 'Cholelithiasis with acoustic shadow, wall thickness 2.5 mm',
      flag: 'normal',
    },
  ]

  const baseEpisode = {
    id: 'ce-fulfill-test',
    title: 'Kolelitiasis',
    diagnosisCode: 'K80.2',
    createdAt: '2026-10-24T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' },
      { stage: 'cost', status: 'done' },
      { stage: 'schedule', status: 'done' },
      { stage: 'treatment', status: 'active', updatedAt: '2026-10-25T08:00:00.000Z' },
      { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' },
      { stage: 'outcome', status: 'pending' },
    ],
    milestones: [
      {
        id: 'ms-lab',
        planItemId: 'p-lab',
        title: 'Bilirubin and liver function test',
        category: 'Suportif',
        targetStage: 'treatment',
        status: 'verified',
        verifiedById: 'dr-anita',
        verifiedAt: '2026-10-24T09:00:00.000Z',
      },
      {
        id: 'ms-usg',
        planItemId: 'p-usg',
        title: 'USG Abdomen hepatobiliary evaluation',
        category: 'Suportif',
        targetStage: 'treatment',
        status: 'verified',
        verifiedById: 'dr-anita',
        verifiedAt: '2026-10-24T09:00:00.000Z',
      },
      {
        id: 'ms-followup',
        planItemId: 'p-follow',
        title: 'Follow-up clinical assessment',
        category: 'Follow-up',
        targetStage: 'followUp',
        status: 'verified',
        verifiedById: 'dr-anita',
        verifiedAt: '2026-10-24T09:00:00.000Z',
      },
    ],
  }

  // 1. Pure fulfillment via fulfillMilestonesWithSupportiveResults
  const fulfilledEp = fulfillMilestonesWithSupportiveResults(baseEpisode, supportiveResults, evaluatedAt)
  assert.equal(fulfilledEp.milestones.length, 3)

  const fulfilledLab = fulfilledEp.milestones.find((m) => m.id === 'ms-lab')
  assert.equal(fulfilledLab.status, 'completed')
  assert.equal(fulfilledLab.resultId, 'res-lab-1')
  assert.equal(fulfilledLab.resultValue, '1.2 mg/dL')

  const fulfilledUsg = fulfilledEp.milestones.find((m) => m.id === 'ms-usg')
  assert.equal(fulfilledUsg.status, 'completed')
  assert.equal(fulfilledUsg.resultId, 'res-usg-1')

  const untouchedFollowup = fulfilledEp.milestones.find((m) => m.id === 'ms-followup')
  assert.equal(untouchedFollowup.status, 'verified', 'Follow-up category milestone should remain untouched by lab/radiology results')

  // 2. Pure projection in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([fulfilledEp], evaluatedAt, undefined, supportiveResults)
  assert.equal(projection.totalActionItemsCount, 3)
  assert.equal(projection.totalVerifiedActionItemsCount, 3)
  assert.equal(projection.totalCompletedMilestonesCount, 2)

  const epSummary = projection.episodes[0]
  assert.equal(epSummary.completedMilestonesCount, 2)
  assert.equal(epSummary.milestones.find((m) => m.id === 'ms-lab').completed, true)
  assert.equal(epSummary.milestones.find((m) => m.id === 'ms-lab').resultValue, '1.2 mg/dL')

  // 3. Negative control: Empty supportive results must not fulfill any milestones
  const unfulfilledEp = fulfillMilestonesWithSupportiveResults(baseEpisode, [], evaluatedAt)
  assert.equal(unfulfilledEp.milestones.every((m) => m.status === 'verified'), true)

  // 4. End-to-end integration via deriveCareContinuityState
  const stateResult = deriveCareContinuityState({
    patientId: 'patient-fulfill-test',
    evaluatedAt,
    supportiveResults,
    record: {
      id: 'enc-fulfill',
      patientId: 'patient-fulfill-test',
      careEpisodes: [baseEpisode],
    },
  })
  assert.ok(stateResult.careJourneys)
  assert.equal(stateResult.careJourneys.totalCompletedMilestonesCount, 2)
})

test('deriveCareContinuityState & CareEpisode: stalled stage escalation and auto-routing to clinician in-tray / care coordinator (T-CLIN-12)', () => {
  const evaluatedAt = '2026-10-25T12:00:00.000Z'

  // Stalled plan stage (elapsed 5 days > expected 3 days)
  const stalledPlanEpisode = {
    id: 'ce_stalled_plan',
    title: 'Hypertension Management',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'active', updatedAt: '2026-10-20T12:00:00.000Z' },
      { stage: 'provider', status: 'pending' },
      { stage: 'cost', status: 'pending' },
      { stage: 'schedule', status: 'pending' },
      { stage: 'treatment', status: 'pending' },
      { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' },
      { stage: 'outcome', status: 'pending' },
    ],
  }

  // Blocked provider stage
  const blockedProviderEpisode = {
    id: 'ce_blocked_prov',
    title: 'Cataract Surgery Pathway',
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'blocked', blockedReason: 'Insurance pre-authorization hold', updatedAt: '2026-10-22T12:00:00.000Z' },
      { stage: 'cost', status: 'pending' },
      { stage: 'schedule', status: 'pending' },
      { stage: 'treatment', status: 'pending' },
      { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' },
      { stage: 'outcome', status: 'pending' },
    ],
  }

  // At-risk treatment stage (elapsed 15 days >= 70% of 21 days = 14.7 days -> 14 days)
  const atRiskTreatmentEpisode = {
    id: 'ce_at_risk_tx',
    title: 'Physical Therapy Rehabilitation',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' },
      { stage: 'cost', status: 'done' },
      { stage: 'schedule', status: 'done' },
      { stage: 'treatment', status: 'active', updatedAt: '2026-10-10T12:00:00.000Z' },
      { stage: 'recovery', status: 'pending' },
      { stage: 'followUp', status: 'pending' },
      { stage: 'outcome', status: 'pending' },
    ],
  }

  // Completed episode (negative control)
  const completedEpisode = {
    id: 'ce_completed',
    title: 'Acute Bronchitis',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' },
      { stage: 'cost', status: 'done' },
      { stage: 'schedule', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'done' },
      { stage: 'followUp', status: 'done' },
      { stage: 'outcome', status: 'done' },
    ],
  }

  // 1. Evaluate pure care journey continuity
  const result = evaluateCareJourneyContinuity(
    [stalledPlanEpisode, blockedProviderEpisode, atRiskTreatmentEpisode, completedEpisode],
    evaluatedAt
  )

  assert.equal(result.totalJourneys, 4)
  assert.equal(result.stalledCount, 2)
  assert.equal(result.atRiskCount, 1)
  assert.equal(result.totalEscalationsCount, 3)
  assert.equal(result.clinicianInTrayCount, 2, 'Stalled plan and at-risk treatment route to Clinician In-Tray')
  assert.equal(result.careCoordinatorCount, 1, 'Blocked provider routes to Care Coordinator')

  // Check stalled plan escalation
  const planSummary = result.episodes.find((e) => e.id === 'ce_stalled_plan')
  assert.ok(planSummary.escalation)
  assert.equal(planSummary.escalation.target, 'Clinician In-Tray')
  assert.equal(planSummary.escalation.action, 'clinician_review')
  assert.equal(planSummary.escalation.actionLabel, 'Clinician Review Required')
  assert.equal(planSummary.escalation.severity, 'stalled')
  assert.equal(planSummary.escalation.daysOverdue, 2, '5 days elapsed minus 3 expected days = 2 days overdue')

  // Check blocked provider escalation
  const provSummary = result.episodes.find((e) => e.id === 'ce_blocked_prov')
  assert.ok(provSummary.escalation)
  assert.equal(provSummary.escalation.target, 'Care Coordinator')
  assert.equal(provSummary.escalation.action, 'coordinator_outreach')
  assert.equal(provSummary.escalation.severity, 'stalled')

  // Check at-risk treatment escalation
  const txSummary = result.episodes.find((e) => e.id === 'ce_at_risk_tx')
  assert.ok(txSummary.escalation)
  assert.equal(txSummary.escalation.target, 'Clinician In-Tray')
  assert.equal(txSummary.escalation.severity, 'at_risk')
  assert.equal(txSummary.escalation.daysOverdue, 0, 'At risk stages have 0 days overdue')

  // Check completed episode (negative control: no escalation)
  const completedSummary = result.episodes.find((e) => e.id === 'ce_completed')
  assert.equal(completedSummary.escalation, undefined)

  // 2. Integration via deriveCareContinuityState
  const projection = deriveCareContinuityState({
    patientId: 'patient-esc-test',
    evaluatedAt,
    record: {
      id: 'enc-esc-test',
      patientId: 'patient-esc-test',
      careEpisodes: [stalledPlanEpisode, blockedProviderEpisode, atRiskTreatmentEpisode, completedEpisode],
    },
  })
  assert.ok(projection.careJourneys)
  assert.equal(projection.careJourneys.totalEscalationsCount, 3)
  assert.equal(projection.careJourneys.clinicianInTrayCount, 2)
  assert.equal(projection.careJourneys.careCoordinatorCount, 1)

  // 3. UI component contract verification
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-escalations-badge="v1"'), 'CareContinuityPanel must include escalations badge')
  assert.ok(panelSource.includes('data-care-escalation-metrics="v1"'), 'CareContinuityPanel must include escalation metrics')
  assert.ok(panelSource.includes('data-escalation-routing="v1"'), 'CareContinuityPanel must include escalation routing tags')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-escalation-routing="v1"'), 'CareEpisode must include escalation routing tags')
  assert.ok(episodeSource.includes('data-blocked-routing="v1"'), 'CareEpisode must include blocked routing tags')
})

test('deriveCareContinuityState & CareEpisode: clinical encounter outcome closure and episode completion bridge (T-CLIN-13)', () => {
  const evaluatedAt = '2026-10-25T12:00:00.000Z'

  const activeEpisode = {
    id: 'ce_outcome_test',
    title: 'Type 2 Diabetes Mellitus with Neuropathy',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'provider', status: 'done' },
      { stage: 'cost', status: 'done' },
      { stage: 'schedule', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'done' },
      { stage: 'followUp', status: 'done' },
      { stage: 'outcome', status: 'active', updatedAt: '2026-10-20T10:00:00.000Z' },
    ],
  }

  assert.equal(isComplete(activeEpisode), false, 'Active episode before outcome is not yet complete')

  // 1. Pure recordClinicalOutcome
  const outcomeData = {
    status: 'resolved',
    summary: 'Glycemic control achieved with HbA1c 6.4%, neuropathic pain fully remitted.',
    followUpPlan: 'Routine annual check-up in 12 months',
    verifiedById: 'dr-anita',
    verifiedAt: evaluatedAt,
  }

  const completedEp = recordClinicalOutcome(activeEpisode, outcomeData, evaluatedAt)
  assert.ok(completedEp.outcomeRecord)
  assert.equal(completedEp.outcomeRecord.status, 'resolved')
  assert.equal(completedEp.outcomeRecord.verifiedById, 'dr-anita')
  assert.equal(completedEp.outcomeRecord.summary, outcomeData.summary)

  const outcomeStage = completedEp.stages.find((s) => s.stage === 'outcome')
  assert.equal(outcomeStage.status, 'done', 'Outcome stage must be set to done')
  assert.equal(isComplete(completedEp), true, 'Episode with all stages done is complete')

  // 2. Pure projection in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([completedEp], evaluatedAt)
  assert.equal(projection.totalJourneys, 1)
  assert.equal(projection.completedJourneys, 1)
  assert.equal(projection.completedWithVerifiedOutcomeCount, 1)
  assert.equal(projection.totalEscalationsCount, 0, 'Completed episode has zero escalations')

  const summary = projection.episodes[0]
  assert.ok(summary.outcomeRecord)
  assert.equal(summary.outcomeRecord.status, 'resolved')
  assert.equal(summary.health, 'on_track')

  // 3. Integration via deriveCareContinuityState
  const continuityState = deriveCareContinuityState({
    patientId: 'patient-outcome-test',
    evaluatedAt,
    record: {
      id: 'enc-outcome-test',
      patientId: 'patient-outcome-test',
      careEpisodes: [completedEp],
    },
  })
  assert.ok(continuityState.careJourneys)
  assert.equal(continuityState.careJourneys.completedJourneys, 1)
  assert.equal(continuityState.careJourneys.completedWithVerifiedOutcomeCount, 1)

  // 4. UI component surface contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-outcomes-badge="v1"'), 'CareContinuityPanel must include outcomes badge')
  assert.ok(panelSource.includes('data-outcome-record="v1"'), 'CareContinuityPanel must include outcome record card')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-outcome-card="v1"'), 'CareEpisode must include outcome card')
  assert.ok(episodeSource.includes('Sign & Complete Care Journey'), 'CareEpisode must include sign and complete action')
})

test('deriveCareJourneyTimelineEvents & CareContinuityPanel: longitudinal timeline & event provenance audit trail (T-CLIN-14)', () => {
  const evaluatedAt = '2026-10-25T12:00:00.000Z'
  const evaluatedAtMs = Date.parse(evaluatedAt)

  const episode = {
    id: 'ce_timeline_test',
    title: 'Hypertensive Heart Disease',
    diagnosisCode: 'I11.9',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    facilityName: 'RS Jantung Harapan Kita',
    facilityId: 'hosp_harapan_kita',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-09-01T08:30:00.000Z' },
      { stage: 'diagnosis', status: 'done', updatedAt: '2026-09-01T09:00:00.000Z' },
      { stage: 'plan', status: 'done', updatedAt: '2026-09-02T10:00:00.000Z' },
      { stage: 'provider', status: 'done', updatedAt: '2026-09-05T11:00:00.000Z' },
      { stage: 'cost', status: 'done', updatedAt: '2026-09-06T14:00:00.000Z' },
      { stage: 'schedule', status: 'done', updatedAt: '2026-09-10T09:00:00.000Z' },
      { stage: 'treatment', status: 'done', updatedAt: '2026-09-25T16:00:00.000Z' },
      { stage: 'recovery', status: 'done', updatedAt: '2026-10-05T10:00:00.000Z' },
      { stage: 'followUp', status: 'done', updatedAt: '2026-10-15T11:30:00.000Z' },
      { stage: 'outcome', status: 'done', updatedAt: '2026-10-20T10:00:00.000Z' },
    ],
    milestones: [
      {
        id: 'ms_ekg',
        title: 'EKG 12-lead baseline',
        category: 'Suportif',
        targetStage: 'diagnosis',
        status: 'completed',
        verifiedById: 'dr-spjp',
        verifiedAt: '2026-09-01T08:45:00.000Z',
        completedAt: '2026-09-01T08:50:00.000Z',
        resultValue: 'Sinus rhythm, LVH by Sokolow-Lyon',
      },
    ],
    outcomeRecord: {
      status: 'stable',
      summary: 'Blood pressure controlled at 124/78 mmHg, target organ damage stable.',
      verifiedById: 'dr-spjp',
      verifiedAt: '2026-10-20T10:00:00.000Z',
      signedAt: '2026-10-20T10:00:00.000Z',
    },
  }

  // 1. Pure deriveCareJourneyTimelineEvents extraction & chronological ordering
  const events = deriveCareJourneyTimelineEvents(episode, evaluatedAtMs)
  assert.ok(events.length > 0, 'Timeline events must be derived')

  // Chronological descending assertion
  for (let i = 0; i < events.length - 1; i++) {
    const currMs = Date.parse(events[i].timestamp)
    const nextMs = Date.parse(events[i + 1].timestamp)
    assert.ok(currMs >= nextMs, `Events must be sorted descending: ${events[i].title} (${events[i].timestamp}) >= ${events[i + 1].title} (${events[i + 1].timestamp})`)
  }

  // Kind coverage
  const kinds = new Set(events.map((e) => e.kind))
  assert.ok(kinds.has('episode_seeded'), 'Must contain episode_seeded')
  assert.ok(kinds.has('stage_transition'), 'Must contain stage_transition')
  assert.ok(kinds.has('provider_selected'), 'Must contain provider_selected')
  assert.ok(kinds.has('milestone_verified'), 'Must contain milestone_verified')
  assert.ok(kinds.has('milestone_fulfilled'), 'Must contain milestone_fulfilled')
  assert.ok(kinds.has('outcome_verified'), 'Must contain outcome_verified')

  // 2. Negative controls: invalid timestamps and future timestamps dropped
  const episodeWithBadEvents = {
    ...episode,
    id: 'ce_bad_ts',
    createdAt: 'invalid-date-string',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2099-01-01T00:00:00.000Z' }, // future
      { stage: 'diagnosis', status: 'done', updatedAt: 'not-a-timestamp' }, // invalid
      { stage: 'plan', status: 'done', updatedAt: '2026-09-01T10:00:00.000Z' }, // valid
    ],
    milestones: [],
    outcomeRecord: undefined,
  }
  const cleanEvents = deriveCareJourneyTimelineEvents(episodeWithBadEvents, evaluatedAtMs)
  assert.equal(cleanEvents.length, 1, 'Only the valid past event must be preserved')
  assert.equal(cleanEvents[0].stage, 'plan')

  // 3. appendTimelineEvent helper
  const customEvt = {
    id: 'evt_custom_memo',
    kind: 'stage_transition',
    timestamp: '2026-10-21T09:00:00.000Z',
    title: 'Consultation Note Added',
    description: 'Patient adherent to DASH diet',
  }
  const epWithAppended = appendTimelineEvent(episode, customEvt)
  assert.ok(epWithAppended.timelineEvents?.some((e) => e.id === 'evt_custom_memo'))

  // 4. Pure projection in evaluateCareJourneyContinuity & deriveCareContinuityState
  const projection = evaluateCareJourneyContinuity([episode], evaluatedAt)
  assert.ok(projection.totalTimelineEventsCount > 0)
  assert.equal(projection.episodes[0].timelineEvents?.length, events.length)

  const continuityState = deriveCareContinuityState({
    patientId: 'pat_timeline_test',
    evaluatedAt,
    record: {
      id: 'enc_timeline_test',
      patientId: 'pat_timeline_test',
      careEpisodes: [episode],
    },
  })
  assert.ok(continuityState.careJourneys)
  assert.ok(continuityState.careJourneys.totalTimelineEventsCount > 0)

  // 5. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-timeline-badge="v1"'), 'CareContinuityPanel must include timeline badge')
  assert.ok(panelSource.includes('data-care-timeline-metrics="v1"'), 'CareContinuityPanel must include timeline metrics')
  assert.ok(panelSource.includes('data-care-timeline-audit="v1"'), 'CareContinuityPanel must include timeline audit element')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-journey-timeline="v1"'), 'CareEpisode must include care journey timeline component')
})

test('derivePatientLongitudinalTimeline & CareEpisode: multi-episode longitudinal timeline & comorbidity projection (T-CLIN-15)', () => {
  const evaluatedAt = '2026-10-25T12:00:00.000Z'
  const evaluatedAtMs = Date.parse(evaluatedAt)

  // Episode 1: Type 2 Diabetes
  const ep1 = {
    id: 'ce_dm2',
    title: 'Type 2 Diabetes Mellitus',
    diagnosisCode: 'E11.9',
    createdAt: '2026-08-01T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-08-01T08:30:00.000Z' },
      { stage: 'diagnosis', status: 'done', updatedAt: '2026-08-01T09:00:00.000Z' },
      { stage: 'plan', status: 'done', updatedAt: '2026-08-05T10:00:00.000Z' },
    ],
    milestones: [
      {
        id: 'ms_hba1c',
        title: 'HbA1c target test',
        category: 'Monitoring',
        targetStage: 'recovery',
        status: 'completed',
        completedAt: '2026-08-15T09:00:00.000Z',
        resultValue: '6.5%',
      },
    ],
  }

  // Episode 2: Essential Hypertension
  const ep2 = {
    id: 'ce_htn',
    title: 'Essential Hypertension',
    diagnosisCode: 'I10',
    createdAt: '2026-08-10T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-08-10T10:15:00.000Z' },
      { stage: 'diagnosis', status: 'done', updatedAt: '2026-08-10T10:30:00.000Z' },
    ],
    milestones: [
      {
        id: 'ms_bp',
        title: '24-hour ambulatory BP monitoring',
        category: 'Monitoring',
        targetStage: 'treatment',
        status: 'completed',
        completedAt: '2026-08-20T11:00:00.000Z',
        resultValue: '128/82 mmHg',
      },
    ],
  }

  // 1. linkEpisodeComorbidity helper
  const ep1Linked = linkEpisodeComorbidity(ep1, 'I10', evaluatedAt)
  assert.deepEqual(ep1Linked.linkedComorbidities, ['I10'])

  // 2. Pure derivePatientLongitudinalTimeline aggregation & interleaved ordering
  const timeline = derivePatientLongitudinalTimeline([ep1Linked, ep2], evaluatedAtMs)
  assert.ok(timeline.length >= 6, 'Must aggregate events from both episodes')

  // Chronological descending assertion across multiple episodes
  for (let i = 0; i < timeline.length - 1; i++) {
    const currMs = Date.parse(timeline[i].timestamp)
    const nextMs = Date.parse(timeline[i + 1].timestamp)
    assert.ok(currMs >= nextMs, `Interleaved timeline must be sorted descending: ${timeline[i].title} >= ${timeline[i + 1].title}`)
  }

  // Verify events contain both episode titles
  const episodeTitles = new Set(timeline.map((e) => e.episodeTitle).filter(Boolean))
  assert.ok(episodeTitles.has('Type 2 Diabetes Mellitus'))
  assert.ok(episodeTitles.has('Essential Hypertension'))

  // 3. evaluateCareJourneyContinuity multi-journey cohort projection
  const projection = evaluateCareJourneyContinuity([ep1Linked, ep2], evaluatedAt)
  assert.equal(projection.totalJourneys, 2)
  assert.equal(projection.activeComorbiditiesCount, 2) // E11.9 and I10
  assert.equal(projection.totalPatientTimelineEventsCount, timeline.length)
  assert.equal(projection.patientTimelineEvents.length, timeline.length)

  // 4. deriveCareContinuityState integration
  const continuityState = deriveCareContinuityState({
    patientId: 'patient-multi-test',
    evaluatedAt,
    record: {
      id: 'enc-multi-test',
      patientId: 'patient-multi-test',
      careEpisodes: [ep1Linked, ep2],
    },
  })
  assert.ok(continuityState.careJourneys)
  assert.equal(continuityState.careJourneys.activeComorbiditiesCount, 2)
  assert.equal(continuityState.careJourneys.totalPatientTimelineEventsCount, timeline.length)

  // 5. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-patient-timeline="v1"'), 'CareContinuityPanel must include patient timeline attribute')
  assert.ok(panelSource.includes('data-patient-comorbidities="v1"'), 'CareContinuityPanel must include patient comorbidities attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-comorbidities="v1"'), 'CareEpisode must include care comorbidities attribute')
})

test('exportCareJourneySummary & CareEpisode: FHIR-aligned continuity handoff packet & digest verification (T-CLIN-17)', () => {
  const evaluatedAt = '2026-10-25T15:00:00.000Z'
  const episode = {
    id: 'ce_export_1',
    title: 'Acute Cholecystitis Surgical Pathway',
    diagnosisCode: 'K81.0',
    linkedComorbidities: ['I10', 'E11.9'],
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
    facilityId: 'fac_rscm',
    facilityName: 'RSCM Kencana',
    estimatedCostLow: 18_000_000,
    estimatedCostHigh: 25_000_000,
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-10-20T08:30:00.000Z' },
      { stage: 'diagnosis', status: 'done', updatedAt: '2026-10-20T09:00:00.000Z' },
      { stage: 'plan', status: 'done', updatedAt: '2026-10-20T10:00:00.000Z' },
      { stage: 'provider', status: 'done', updatedAt: '2026-10-21T10:00:00.000Z' },
      { stage: 'cost', status: 'done', updatedAt: '2026-10-21T11:00:00.000Z' },
      { stage: 'schedule', status: 'done', updatedAt: '2026-10-22T09:00:00.000Z' },
      { stage: 'treatment', status: 'done', updatedAt: '2026-10-23T14:00:00.000Z' },
      { stage: 'recovery', status: 'done', updatedAt: '2026-10-24T09:00:00.000Z' },
      { stage: 'followUp', status: 'done', updatedAt: '2026-10-24T11:00:00.000Z' },
      { stage: 'outcome', status: 'done', updatedAt: '2026-10-24T12:00:00.000Z' },
    ],
    milestones: [
      {
        id: 'ms_lap',
        title: 'Laparoscopic cholecystectomy',
        category: 'Definitif',
        targetStage: 'treatment',
        status: 'completed',
        completedAt: '2026-10-23T14:00:00.000Z',
      },
    ],
    outcomeRecord: {
      status: 'resolved',
      summary: 'Complete post-operative recovery without complications',
      verifiedById: 'dr-surgeon-1',
      verifiedAt: '2026-10-24T12:00:00.000Z',
    },
  }

  // 1. Pure exportCareJourneySummary verification
  const packet = exportCareJourneySummary(episode, evaluatedAt)
  assert.equal(packet.standard, 'PANACEA-CAREPLAN-FHIR-R4-V1')
  assert.equal(packet.episodeId, 'ce_export_1')
  assert.equal(packet.diagnosisCode, 'K81.0')
  assert.deepEqual(packet.linkedComorbidities, ['I10', 'E11.9'])
  assert.equal(packet.status, 'completed')
  assert.equal(packet.generatedAt, evaluatedAt)
  assert.equal(packet.stages.length, 10)
  assert.equal(packet.milestones.length, 1)
  assert.equal(packet.provider?.facilityName, 'RSCM Kencana')
  assert.deepEqual(packet.provider?.costRangeIdr, { min: 18_000_000, max: 25_000_000 })
  assert.equal(packet.outcome?.status, 'resolved')
  assert.ok(packet.timelineEventCount >= 10)
  assert.equal(
    packet.auditDigest,
    'sha256:ce_export_1:2026-10-24T12:00:00.000Z:10:1:completed'
  )

  // 2. Blocked episode maps to on_hold status
  const blockedEp = {
    ...episode,
    id: 'ce_blocked_export',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'provider', status: 'blocked', blockedReason: 'Awaiting referral letter' },
    ],
  }
  const blockedPacket = exportCareJourneySummary(blockedEp, evaluatedAt)
  assert.equal(blockedPacket.status, 'on_hold')

  // 3. evaluateCareJourneyContinuity exportableJourneysCount
  const projection = evaluateCareJourneyContinuity([episode, blockedEp], evaluatedAt)
  assert.equal(projection.exportableJourneysCount, 2)
  assert.equal(projection.episodes[0].exportSummary?.standard, 'PANACEA-CAREPLAN-FHIR-R4-V1')

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-export-ready="v1"'), 'CareContinuityPanel must include export readiness attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-export-summary="v1"'), 'CareEpisode must include export summary card attribute')
})

test('deriveCareJourneyCostSummary & CareContinuityPanel: Total Cost of Care financial transparency rollup & never-deny-care boundary (T-CLIN-18)', () => {
  const evaluatedAt = '2026-10-25T16:00:00.000Z'

  // Episode 1: Itemized verified cost items
  const epItemized = {
    id: 'ce_cost_itemized',
    title: 'Laparoscopic Cholecystectomy',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
    facilityId: 'fac_rscm',
    facilityName: 'RSCM Kencana',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'cost', status: 'done' },
    ],
    costItems: [
      { id: 'ci_1', label: 'Surgical fee', low: 12_000_000, high: 15_000_000, confidence: 'verified', source: 'RSCM quote' },
      { id: 'ci_2', label: 'Hospital stay', low: 6_000_000, high: 8_000_000, confidence: 'verified', source: 'RSCM quote' },
    ],
  }

  // Episode 2: Top-level estimated cost range
  const epEstimated = {
    id: 'ce_cost_est',
    title: 'Post-op Physical Therapy',
    createdAt: '2026-10-22T08:00:00.000Z',
    updatedAt: '2026-10-24T11:00:00.000Z',
    estimatedCostLow: 2_000_000,
    estimatedCostHigh: 3_500_000,
    costConfidence: 'estimated',
    costSource: 'Outpatient tariff reference',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // Episode 3: No cost data (negative control — must never fabricate prices)
  const epUnpriced = {
    id: 'ce_cost_none',
    title: 'Hypertension Follow-up',
    createdAt: '2026-10-23T08:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
    ],
  }

  // 1. Pure deriveCareJourneyCostSummary rollup
  const summary = deriveCareJourneyCostSummary([epItemized, epEstimated, epUnpriced])
  assert.equal(summary.totalEstimatedCostLow, 20_000_000)
  assert.equal(summary.totalEstimatedCostHigh, 26_500_000)
  assert.equal(summary.costVerifiedJourneysCount, 1)
  assert.equal(summary.costEstimatedJourneysCount, 1)
  assert.equal(summary.pricedJourneysCount, 2)
  assert.equal(summary.clinicalCareBoundary, 'never-deny-care')

  // 2. Negative control: unpriced episodes must produce 0 cost and 0 priced journeys
  const emptyCost = deriveCareJourneyCostSummary([epUnpriced])
  assert.equal(emptyCost.totalEstimatedCostLow, 0)
  assert.equal(emptyCost.totalEstimatedCostHigh, 0)
  assert.equal(emptyCost.pricedJourneysCount, 0)

  // 3. evaluateCareJourneyContinuity projection
  const projection = evaluateCareJourneyContinuity([epItemized, epEstimated, epUnpriced], evaluatedAt)
  assert.equal(projection.totalEstimatedCostLow, 20_000_000)
  assert.equal(projection.totalEstimatedCostHigh, 26_500_000)
  assert.equal(projection.costVerifiedJourneysCount, 1)
  assert.equal(projection.costEstimatedJourneysCount, 1)
  assert.equal(projection.episodes[0].costConfidence, 'verified')
  assert.equal(projection.episodes[0].costItemsCount, 2)
  assert.equal(projection.episodes[2].estimatedCostLow, undefined)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-cost-rollup="v1"'), 'CareContinuityPanel must include cost rollup attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-cost-transparency="v1"'), 'CareEpisode must include cost transparency attribute')
})

test('evaluateEpisodeReadmissionRisk & CareContinuityPanel: post-discharge follow-up & readmission risk surveillance (T-CLIN-19)', () => {
  const evaluatedAt = '2026-10-25T16:00:00.000Z'
  const evaluatedAtMs = Date.parse(evaluatedAt)

  // 1. High-risk episode: blocked followUp stage + multi-comorbidity burden
  const highRiskEpisode = {
    id: 'ce_readm_high',
    title: 'Heart Failure Post-Discharge Transition',
    linkedComorbidities: ['I10', 'E11.9', 'N18.3'],
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'done' },
      { stage: 'followUp', status: 'blocked', blockedReason: 'Patient missed 7-day cardiology clinic visit' },
      { stage: 'outcome', status: 'pending' },
    ],
    milestones: [
      {
        id: 'ms_ntprobnp',
        title: 'NT-proBNP & renal panel check',
        category: 'Monitoring',
        targetStage: 'followUp',
        status: 'verified',
      },
    ],
  }

  const highRisk = evaluateEpisodeReadmissionRisk(highRiskEpisode, [], evaluatedAtMs)
  assert.equal(highRisk.riskLevel, 'high')
  assert.equal(highRisk.followUpWindowClosed, false)
  assert.ok(highRisk.riskFactors.length >= 2)

  // 2. Moderate-risk episode: active recovery with 1 unfulfilled monitoring milestone
  const moderateRiskEpisode = {
    id: 'ce_readm_mod',
    title: 'Community-Acquired Pneumonia Recovery',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active', updatedAt: '2026-10-23T08:00:00.000Z' },
      { stage: 'followUp', status: 'pending' },
    ],
    milestones: [
      {
        id: 'ms_cxr',
        title: 'Follow-up chest radiograph',
        category: 'Follow-up',
        targetStage: 'followUp',
        status: 'verified',
      },
    ],
  }

  const modRisk = evaluateEpisodeReadmissionRisk(moderateRiskEpisode, [], evaluatedAtMs)
  assert.equal(modRisk.riskLevel, 'moderate')
  assert.equal(modRisk.riskFactors.length, 1)

  // 3. Low-risk / closed follow-up window (negative control)
  const closedEpisode = {
    id: 'ce_readm_low',
    title: 'Resolved Appendectomy',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-20T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'done' },
      { stage: 'followUp', status: 'done' },
      { stage: 'outcome', status: 'done' },
    ],
    outcomeRecord: {
      status: 'resolved',
      summary: 'Full surgical recovery confirmed at follow-up',
      verifiedById: 'dr-surg',
      verifiedAt: '2026-10-20T08:00:00.000Z',
    },
  }

  const lowRisk = evaluateEpisodeReadmissionRisk(closedEpisode, [], evaluatedAtMs)
  assert.equal(lowRisk.riskLevel, 'low')
  assert.equal(lowRisk.followUpWindowClosed, true)
  assert.equal(lowRisk.riskFactors.length, 0)

  // 4. evaluateCareJourneyContinuity rollup
  const projection = evaluateCareJourneyContinuity(
    [highRiskEpisode, moderateRiskEpisode, closedEpisode],
    evaluatedAt
  )
  assert.equal(projection.highReadmissionRiskCount, 1)
  assert.equal(projection.moderateReadmissionRiskCount, 1)
  assert.equal(projection.followUpWindowClosedCount, 1)

  // 5. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-readmission-surveillance="v1"'), 'CareContinuityPanel must include readmission surveillance attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-followup-surveillance="v1"'), 'CareEpisode must include follow-up surveillance attribute')
})

test('evaluateReferralHandshakeContinuity & CareContinuityPanel: inter-facility referral handshake & diagnostic continuity bridge (T-CLIN-20)', () => {
  const evaluatedAt = '2026-10-25T17:00:00.000Z'

  // 1. Episode with active emergency referral
  const emergencyReferralEpisode = {
    id: 'ce_ref_emerg',
    title: 'Acute Coronary Syndrome Transfer',
    createdAt: '2026-10-25T15:00:00.000Z',
    updatedAt: '2026-10-25T15:30:00.000Z',
    facilityName: 'Puskesmas Tebet',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
    referralRecord: {
      referralId: 'ref_acst_01',
      sourceFacilityId: 'fac_pkms_tebet',
      sourceFacilityName: 'Puskesmas Tebet',
      destinationFacilityId: 'fac_harapan_kita',
      destinationFacilityName: 'RS Jantung Harapan Kita',
      specialty: 'Interventional Cardiology',
      urgency: 'emergency',
      clinicalIndication: 'STEMI anterior extensive requiring primary PCI',
      status: 'dispatched',
      dispatchedAt: '2026-10-25T15:30:00.000Z',
      auditDigest: '',
    },
  }

  // 2. Episode with acknowledged routine referral
  const routineReferralEpisode = {
    id: 'ce_ref_routine',
    title: 'Refractive Surgery Specialist Evaluation',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'provider', status: 'done' },
    ],
    referralRecord: {
      referralId: 'ref_eye_02',
      sourceFacilityId: 'fac_klinik_mata',
      sourceFacilityName: 'Klinik Mata Nusantara',
      destinationFacilityId: 'fac_rscm_kirana',
      destinationFacilityName: 'RSCM Kirana',
      specialty: 'Cornea & Refractive',
      urgency: 'routine',
      clinicalIndication: 'Severe keratoconus evaluation',
      status: 'acknowledged',
      dispatchedAt: '2026-10-22T09:00:00.000Z',
      acknowledgedAt: '2026-10-23T11:00:00.000Z',
      acknowledgedBy: 'dr-spm-kirana',
      auditDigest: '',
    },
  }

  // 3. Episode without referral (negative control)
  const unreferredEpisode = {
    id: 'ce_no_ref',
    title: 'Routine Health Check',
    createdAt: '2026-10-21T08:00:00.000Z',
    updatedAt: '2026-10-21T09:00:00.000Z',
    stages: [{ stage: 'problem', status: 'done' }],
  }

  // 1. Pure evaluateReferralHandshakeContinuity verification
  const refProj = evaluateReferralHandshakeContinuity(emergencyReferralEpisode)
  assert.ok(refProj)
  assert.equal(refProj.referralId, 'ref_acst_01')
  assert.equal(refProj.urgency, 'emergency')
  assert.equal(refProj.auditDigest, 'sha256:ref_acst_01:dispatched:emergency:vital-priority')

  const noRefProj = evaluateReferralHandshakeContinuity(unreferredEpisode)
  assert.equal(noRefProj, undefined)

  // 2. evaluateCareJourneyContinuity metrics rollup
  const projection = evaluateCareJourneyContinuity(
    [emergencyReferralEpisode, routineReferralEpisode, unreferredEpisode],
    evaluatedAt
  )
  assert.equal(projection.activeReferralsCount, 2)
  assert.equal(projection.acknowledgedReferralsCount, 1)
  assert.equal(projection.emergencyReferralsCount, 1)

  // 3. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-care-referral-handshake="v1"'), 'CareContinuityPanel must include referral handshake attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-care-referral-section="v1"'), 'CareEpisode must include referral handshake section')
})

test('deriveEdenCareCompanion & CareEpisode: Eden 3-depth progressive disclosure & plain-language clinical companion (T-CLIN-21 / EDEN-01)', () => {
  const evaluatedAt = '2026-10-26T04:00:00.000Z'

  // 1. Five-Second Understanding Rule: Plain-language glossary translations
  assert.equal(EDEN_PLAIN_LANGUAGE_GLOSSARY.length, 6)
  assert.equal(translateClinicalTermToEden('Provenance'), 'Where this information came from')
  assert.equal(translateClinicalTermToEden('Interoperability'), 'Connecting your health information safely')
  assert.equal(translateClinicalTermToEden('Homeostasis'), 'How your body maintains its balance')
  assert.equal(translateClinicalTermToEden('Evidence confidence'), 'How well this information is supported')
  assert.equal(translateClinicalTermToEden('Physiological system'), 'How this part of your body works')
  assert.equal(translateClinicalTermToEden('Trajectory'), 'How things are changing over time')

  const episode = {
    id: 'ce_eden_1',
    title: 'Essential Hypertension Balance Plan',
    diagnosisCode: 'I10',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    estimatedCostLow: 1_500_000,
    estimatedCostHigh: 2_500_000,
    costConfidence: 'estimated',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'active' },
      { stage: 'recovery', status: 'pending' },
    ],
    milestones: [
      {
        id: 'ms_bp_home',
        title: 'Morning blood pressure check',
        category: 'Monitoring',
        targetStage: 'treatment',
        status: 'completed',
      },
    ],
  }

  // 2. Depth 1: Simple · Just Live
  const simpleCompanion = deriveEdenCareCompanion(episode, 'simple')
  assert.equal(simpleCompanion.depth, 'simple')
  assert.equal(simpleCompanion.depthLabel, 'Simple · Just Live')
  assert.equal(simpleCompanion.clinicalSafetyPreserved, true)
  assert.equal(simpleCompanion.nextBeautifulStep.stage, 'treatment')
  assert.equal(simpleCompanion.nextBeautifulStep.urgencyTone, 'calm')
  assert.ok(simpleCompanion.wonderReflection.includes('natural balance'))
  assert.ok(simpleCompanion.whatIsHappening.includes('Essential Hypertension Balance Plan'))

  // 3. Depth 2: Explore · Understand More
  const exploreCompanion = deriveEdenCareCompanion(episode, 'explore')
  assert.equal(exploreCompanion.depth, 'explore')
  assert.equal(exploreCompanion.depthLabel, 'Explore · Understand More')
  assert.ok(exploreCompanion.wonderReflection.includes('homeostasis'))
  assert.ok(exploreCompanion.whatYouCanDo.includes('1/1 care plan items fulfilled'))

  // 4. Depth 3: Deep · Scientific & Clinical
  const deepCompanion = deriveEdenCareCompanion(episode, 'deep')
  assert.equal(deepCompanion.depth, 'deep')
  assert.equal(deepCompanion.depthLabel, 'Deep · Scientific & Clinical')
  assert.ok(deepCompanion.whatIsHappening.includes('ICD-10: I10'))
  assert.ok(deepCompanion.whyItMatters.includes('never-deny-care'))

  // 5. evaluateCareJourneyContinuity rollup
  const projection = evaluateCareJourneyContinuity([episode], evaluatedAt)
  assert.equal(projection.edenReadyJourneysCount, 1)
  assert.equal(projection.episodes[0].edenCompanion?.depthLabel, 'Simple · Just Live')

  // 6. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-calm-companion="v1"'), 'CareContinuityPanel must include Eden calm companion attribute')
  assert.ok(panelSource.includes('data-eden-next-step="v1"'), 'CareContinuityPanel must include Eden next step attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-companion-card="v1"'), 'CareEpisode must include Eden companion card')
  assert.ok(episodeSource.includes('data-eden-depth-selector="v1"'), 'CareEpisode must include Eden 3-depth selector')
  assert.ok(episodeSource.includes('data-eden-beautiful-next-step="v1"'), 'CareEpisode must include One Beautiful Next Step card')
})

test('deriveEdenLifeBalanceSynthesis & CareEpisode: Eden One Control whole-person life & care balance synthesis (T-CLIN-22 / EDEN-02)', () => {
  const evaluatedAt = '2026-10-26T04:30:00.000Z'

  // 1. Serene state: completed journey with no pending hurdles
  const completedEp = {
    id: 'ce_life_done',
    title: 'Post-Viral Recovery Rhythm',
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-20T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'outcome', status: 'done' },
    ],
    outcomeRecord: {
      status: 'resolved',
      summary: 'Full physiological recovery',
    },
  }
  const sereneSynth = deriveEdenLifeBalanceSynthesis([completedEp], [])
  assert.equal(sereneSynth.calmState, 'serene')
  assert.equal(sereneSynth.completedJourneysCount, 1)
  assert.equal(sereneSynth.activeJourneysCount, 0)
  assert.equal(sereneSynth.clinicalSafetyGuarantee, 'never-deny-care')
  assert.equal(sereneSynth.dimensions.length, 4)

  // 2. Balanced progress state: active journey without blocks
  const activeEp = {
    id: 'ce_life_active',
    title: 'Cardiometabolic Longevity Pathway',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
  }
  const balancedSynth = deriveEdenLifeBalanceSynthesis([activeEp], [])
  assert.equal(balancedSynth.calmState, 'balanced_progress')
  assert.equal(balancedSynth.activeJourneysCount, 1)
  assert.ok(balancedSynth.oneUnifiedFocus.includes('Treatment'))

  // 3. Gentle attention state: blocked stage
  const blockedEp = {
    id: 'ce_life_blocked',
    title: 'Diagnostic Imaging Coordination',
    createdAt: '2026-10-21T08:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'schedule', status: 'blocked', blockedReason: 'Awaiting preferred morning slot' },
    ],
  }
  const gentleSynth = deriveEdenLifeBalanceSynthesis([blockedEp], [])
  assert.equal(gentleSynth.calmState, 'gentle_attention')

  // 4. Timely clinical care state: critical diagnostic flag
  const urgentSynth = deriveEdenLifeBalanceSynthesis(
    [activeEp],
    [{ id: 'sr_crit', name: 'Troponin I', category: 'Lab', value: '1.8', unit: 'ng/mL', flag: 'critical', takenAt: evaluatedAt }]
  )
  assert.equal(urgentSynth.calmState, 'timely_clinical_care')

  // 5. evaluateCareJourneyContinuity rollup
  const projection = evaluateCareJourneyContinuity([activeEp, completedEp], evaluatedAt)
  assert.equal(projection.edenLifeBalance.calmState, 'balanced_progress')
  assert.equal(projection.edenLifeBalance.activeJourneysCount, 1)
  assert.equal(projection.edenLifeBalance.completedJourneysCount, 1)

  // 6. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-life-balance="v1"'), 'CareContinuityPanel must include Eden life balance attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-one-control="v1"'), 'CareEpisode must include Eden One Control header')
  assert.ok(episodeSource.includes('data-eden-unified-focus="v1"'), 'CareEpisode must include One Unified Focus card')
})

test('deriveEdenLifeStoryBridge & CareEpisode: Eden Personal Life Story & Turning-Point Continuity Bridge (T-CLIN-23 / EDEN-03)', () => {
  const evaluatedAt = '2026-10-26T05:00:00.000Z'

  const sampleEpisode = {
    id: 'ce_story_1',
    title: 'Knee Meniscus Rehabilitation',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done', updatedAt: '2026-10-18T10:00:00.000Z' },
      { stage: 'treatment', status: 'active', updatedAt: '2026-10-21T10:00:00.000Z' },
      { stage: 'schedule', status: 'blocked', updatedAt: '2026-10-22T10:00:00.000Z', blockedReason: 'Awaiting evening physio slot' },
    ],
  }

  const sampleLifeEvents = [
    {
      id: 'le_1',
      at: '2026-08-10',
      title: 'Welcomed second child into our family',
      domains: ['family', 'purpose', 'relationships'],
      impact: 'positive',
      isTurningPoint: true,
    },
    {
      id: 'le_2',
      at: '2026-09-15',
      title: 'Weekend hiking trip with friends',
      domains: ['recreation', 'social'],
      impact: 'positive',
      isTurningPoint: false,
    },
  ]

  const sampleQuests = [
    {
      id: 'q_1',
      title: 'Walk pain-free with family in the park',
      domain: 'family',
      createdAt: '2026-10-19',
      targetNote: '30-minute walk without knee brace',
      progressCurrent: 2,
      progressTarget: 5,
      unit: 'walks',
      status: 'active',
    },
    {
      id: 'q_2',
      title: 'Read 10 books this year',
      domain: 'study',
      createdAt: '2026-01-01',
      targetNote: 'Finish 10 books',
      progressCurrent: 10,
      progressTarget: 10,
      unit: 'books',
      status: 'done',
    },
  ]

  const bridge = deriveEdenLifeStoryBridge(
    sampleEpisode,
    sampleLifeEvents,
    sampleQuests,
    '1988-06-15'
  )

  // Age 38 in Oct 2026 -> Family & Career (36-50)
  assert.equal(bridge.lifeChapterName, 'Family & Career')
  assert.equal(bridge.lifeChapterAgeRange, '36–50')
  assert.equal(bridge.selfAuthoredNeverInferred, true)

  // Health story anchors: started + blocked
  assert.equal(bridge.healthStoryAnchors.length, 2)
  assert.equal(bridge.healthStoryAnchors[0].kind, 'started')
  assert.equal(bridge.healthStoryAnchors[1].kind, 'blocked')
  assert.equal(bridge.healthStoryAnchors[1].note, 'Awaiting evening physio slot')

  // Self-authored turning points: only le_1 (isTurningPoint === true), preserving exact self-rated impact
  assert.equal(bridge.selfAuthoredTurningPoints.length, 1)
  assert.equal(bridge.selfAuthoredTurningPoints[0].id, 'le_1')
  assert.equal(bridge.selfAuthoredTurningPoints[0].impact, 'positive')

  // Active quests: only q_1 (status === 'active'), preserving exact progressCurrent/progressTarget
  assert.equal(bridge.activeQuests.length, 1)
  assert.equal(bridge.activeQuests[0].id, 'q_1')
  assert.equal(bridge.activeQuests[0].progressCurrent, 2)
  assert.equal(bridge.activeQuests[0].progressTarget, 5)
  assert.ok(bridge.gentleReflectionPrompt.includes('Walk pain-free with family in the park'))

  // Domain counts: family (2: le_1 + q_1), physical (1: episode), etc.
  assert.equal(bridge.activeLifeDomains[0].domain, 'family')
  assert.equal(bridge.activeLifeDomains[0].count, 2)

  // Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode], evaluatedAt)
  assert.equal(projection.edenLifeStoryAlignedCount, 1)
  assert.ok(projection.episodes[0].edenLifeStoryBridge)
  assert.equal(projection.episodes[0].edenLifeStoryBridge.selfAuthoredNeverInferred, true)

  // UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-life-story-bridge="v1"'), 'CareContinuityPanel must include Eden life story bridge attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-life-story-card="v1"'), 'CareEpisode must include Eden life story card')
})

test('deriveEdenPhysiologyAppreciation & CareEpisode: Eden Living Physiology Appreciation & Organ System Connection Bridge (T-CLIN-24 / EDEN-04)', () => {
  const evaluatedAt = '2026-10-26T05:30:00.000Z'

  // 1. ICD-10 I-prefix -> cardiovascular with respiratory & renal coupling
  const cardioEpisode = {
    id: 'ce_phys_cardio',
    title: 'Essential Hypertension Control',
    diagnosisCode: 'I10',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [{ stage: 'problem', status: 'done' }, { stage: 'treatment', status: 'active' }],
  }
  const cardioApp = deriveEdenPhysiologyAppreciation(cardioEpisode)
  assert.equal(cardioApp.primarySystem.id, 'cardiovascular')
  assert.equal(cardioApp.primarySystem.bodyTwinRoute, '/body')
  assert.equal(cardioApp.coupledSystems.length, 2)
  assert.equal(cardioApp.coupledSystems[0].id, 'respiratory')
  assert.equal(cardioApp.coupledSystems[1].id, 'renal_urinary')
  assert.equal(cardioApp.truthClass, 'educational_physiology_reference')
  assert.equal(cardioApp.neverFabricatesMeasuredVitals, true)

  // 2. Title keyword -> digestive_hepatobiliary
  const hepatoEpisode = {
    id: 'ce_phys_hepato',
    title: 'Gallstone Cholecystectomy Recovery',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [{ stage: 'problem', status: 'done' }],
  }
  const hepatoApp = deriveEdenPhysiologyAppreciation(hepatoEpisode)
  assert.equal(hepatoApp.primarySystem.id, 'digestive_hepatobiliary')
  assert.equal(hepatoApp.coupledSystems[0].id, 'metabolic_endocrine')

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([cardioEpisode, hepatoEpisode], evaluatedAt)
  assert.equal(projection.edenPhysiologyLinkedCount, 2)
  assert.ok(projection.episodes[0].edenPhysiologyAppreciation)
  assert.equal(projection.episodes[0].edenPhysiologyAppreciation.primarySystem.id, 'cardiovascular')

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-physiology-bridge="v1"'), 'CareContinuityPanel must include Eden physiology bridge attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-physiology-card="v1"'), 'CareEpisode must include Eden physiology card')
  assert.ok(episodeSource.includes('data-eden-coupled-systems="v1"'), 'CareEpisode must include coupled systems grid')
})

test('deriveEdenPreventionLongevityRhythm & CareEpisode: Eden Daily Prevention, Longevity Rhythm & Restorative Habit Continuity Bridge (T-CLIN-25 / EDEN-05)', () => {
  const evaluatedAt = '2026-10-26T05:55:00.000Z'

  // 1. Active rebuilding phase with clinician-verified Edukasi plan item
  const metabolicEpisode = {
    id: 'ce_long_metab',
    title: 'Type 2 Diabetes Glycemic Longevity',
    diagnosisCode: 'E11',
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
  }
  const verifiedPlans = [
    {
      id: 'pl_edu_1',
      category: 'Edukasi',
      text: '15-minute post-dinner walk and consistent 22:30 sleep window',
      source: 'Dokter',
      status: 'diverifikasi',
      verifiedById: 'dr-andi',
      verifiedAt: '2026-10-16T09:00:00.000Z',
    },
  ]

  const rhythm = deriveEdenPreventionLongevityRhythm(metabolicEpisode, verifiedPlans)
  assert.equal(rhythm.primaryOrganSystem, 'metabolic_endocrine')
  assert.equal(rhythm.rhythmPhase, 'active_rebuilding')
  assert.equal(rhythm.clinicianVerifiedPlanCount, 1)
  assert.equal(rhythm.nonPrescriptiveEducationalBoundary, true)
  assert.ok(rhythm.oneGentleDailyHabit.includes('15-minute post-dinner walk'))
  assert.equal(rhythm.pillars.length, 4)
  assert.ok(rhythm.projectedTrajectory)
  assert.equal(rhythm.projectedTrajectory.status, 'valid')
  assert.equal(rhythm.projectedTrajectory.trajectory.length, 7)
  assert.ok(rhythm.projectedTrajectory.trajectory[0].projectedBiologicalAge > 0)

  // 2. Completed episode -> longevity_maintenance phase
  const completedEpisode = {
    id: 'ce_long_done',
    title: 'Post-Sprain Ankle Rehabilitation',
    diagnosisCode: 'S93',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-20T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'outcome', status: 'done' },
    ],
  }
  const maintRhythm = deriveEdenPreventionLongevityRhythm(completedEpisode, [])
  assert.equal(maintRhythm.primaryOrganSystem, 'musculoskeletal')
  assert.equal(maintRhythm.rhythmPhase, 'longevity_maintenance')

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([metabolicEpisode, completedEpisode], evaluatedAt, verifiedPlans)
  assert.equal(projection.edenLongevityReadyCount, 2)
  assert.ok(projection.episodes[0].edenLongevityRhythm)
  assert.equal(projection.episodes[0].edenLongevityRhythm.rhythmPhase, 'active_rebuilding')

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-longevity-rhythm="v1"'), 'CareContinuityPanel must include Eden longevity rhythm attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-longevity-card="v1"'), 'CareEpisode must include Eden longevity card')
  assert.ok(episodeSource.includes('data-eden-longevity-pillars="v1"'), 'CareEpisode must include Eden 4-pillar longevity grid')
  assert.ok(episodeSource.includes('data-eden-trajectory-preview="v1"'), 'CareEpisode must include Eden trajectory preview card')
})

test('deriveEdenSupportCircleBridge & CareEpisode: Eden Trusted Support Circle & Family/Caregiver Encouragement Bridge (T-CLIN-26 / EDEN-06)', () => {
  const evaluatedAt = '2026-10-26T06:15:00.000Z'

  const sampleEpisode = {
    id: 'ce_circle_1',
    title: 'Post-Appendectomy Recovery',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  const supportBridge = deriveEdenSupportCircleBridge(sampleEpisode, {
    buddyName: 'Siti Rahma',
    circles: [
      { id: 'c_1', name: 'Keluarga Inti', memberNames: ['Ibu', 'Ayah', 'Adik'] },
    ],
    supportMessages: [
      {
        id: 'sm_1',
        fromEmail: 'ibu@example.com',
        fromName: 'Ibu',
        toName: 'Kamu',
        text: 'Semangat pemulihannya, kami selalu mendoakan.',
        at: '2026-10-25T09:00:00.000Z',
      },
    ],
    gratitudes: [
      {
        id: 'gr_1',
        fromName: 'Kamu',
        toName: 'Tim Perawat',
        text: 'Terima kasih atas pendampingan yang sabar.',
        at: '2026-10-25T10:00:00.000Z',
      },
    ],
  })

  assert.equal(supportBridge.healthBuddyName, 'Siti Rahma')
  assert.equal(supportBridge.trustedCircles.length, 1)
  assert.equal(supportBridge.trustedCircles[0].memberCount, 3)
  assert.equal(supportBridge.recentEncouragements.length, 2)
  assert.equal(supportBridge.optInPrivacyPreserved, true)
  assert.equal(supportBridge.noFabricatedSocialAccounts, true)
  assert.ok(supportBridge.shareablePlainUpdate.includes('Post-Appendectomy Recovery'))
  assert.ok(supportBridge.connectionHeadline.includes('Siti Rahma'))

  // Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode], evaluatedAt)
  assert.equal(projection.edenSupportCircleReadyCount, 1)
  assert.ok(projection.episodes[0].edenSupportCircle)
  assert.equal(projection.episodes[0].edenSupportCircle.optInPrivacyPreserved, true)

  // UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-support-circle="v1"'), 'CareContinuityPanel must include Eden support circle attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-support-circle-card="v1"'), 'CareEpisode must include Eden support circle card')
  assert.ok(episodeSource.includes('data-eden-shareable-update="v1"'), 'CareEpisode must include shareable plain update box')
})

test('deriveEdenVisitPreparationCompanion & CareEpisode: Eden Clinician Visit Preparation & Empowering Questions Companion (T-CLIN-27 / EDEN-07)', () => {
  const evaluatedAt = '2026-10-26T06:40:00.000Z'

  // 1. Episode with active stage and flagged supportive lab result
  const activeEpisode = {
    id: 'ce_prep_1',
    title: 'Type 2 Diabetes Cardiometabolic Control',
    diagnosisCode: 'E11',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'active' },
      { stage: 'followUp', status: 'pending' },
    ],
  }
  const flaggedLabs = [
    {
      id: 'sr_hba1c',
      name: 'HbA1c',
      category: 'Lab',
      value: '7.9',
      unit: '%',
      flag: 'high',
      takenAt: '2026-10-24T09:00:00.000Z',
    },
  ]

  const prep = deriveEdenVisitPreparationCompanion(activeEpisode, flaggedLabs)
  assert.equal(prep.currentFocusStage, 'treatment')
  assert.equal(prep.currentFocusStageLabel, 'Treatment')
  assert.equal(prep.flaggedResultSummary, 'HbA1c: 7.9 % (high)')
  assert.equal(prep.questionsToBring.length, 3)
  assert.equal(prep.questionsToBring[0].category, 'understanding')
  assert.ok(prep.questionsToBring[0].question.includes('HbA1c: 7.9 % (high)'))
  assert.equal(prep.questionsToBring[1].category, 'options_next_step')
  assert.equal(prep.questionsToBring[2].category, 'daily_life_recovery')
  assert.equal(prep.whatToShareWithClinician.length, 3)
  assert.equal(prep.empoweringAgencyPreserved, true)
  assert.equal(prep.neverReplacesClinicianConsultation, true)

  // 2. Blocked episode tailors options question and context to the blocker
  const blockedEpisode = {
    id: 'ce_prep_blocked',
    title: 'Knee Arthroscopy Scheduling',
    createdAt: '2026-10-21T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'schedule', status: 'blocked', blockedReason: 'Awaiting insurance referral letter' },
    ],
  }
  const blockedPrep = deriveEdenVisitPreparationCompanion(blockedEpisode, [])
  assert.equal(blockedPrep.currentFocusStage, 'schedule')
  assert.ok(blockedPrep.questionsToBring[1].question.includes('Awaiting insurance referral letter'))
  assert.ok(blockedPrep.whatToShareWithClinician[1].includes('Awaiting insurance referral letter'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([activeEpisode, blockedEpisode], evaluatedAt, [], flaggedLabs)
  assert.equal(projection.edenVisitPrepReadyCount, 2)
  assert.ok(projection.episodes[0].edenVisitPreparation)
  assert.equal(projection.episodes[0].edenVisitPreparation.empoweringAgencyPreserved, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-visit-prep="v1"'), 'CareContinuityPanel must include Eden visit prep attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-visit-prep-card="v1"'), 'CareEpisode must include Eden visit prep card')
  assert.ok(episodeSource.includes('data-eden-visit-questions="v1"'), 'CareEpisode must include Eden visit questions grid')
})

test('deriveEdenReflectionSanctuaryBridge & CareEpisode: Eden Multi-Perspective Reflection, Epistemic Humility & Peace Sanctuary Bridge (T-CLIN-28 / EDEN-08)', () => {
  const evaluatedAt = '2026-10-26T07:05:00.000Z'

  const sampleEpisode = {
    id: 'ce_sanctuary_1',
    title: 'Cardiac Arrhythmia Recovery Rhythm',
    diagnosisCode: 'I48',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
  }

  const sampleMoods = [
    {
      id: 'm_1',
      email: 'patient@example.com',
      name: 'Pasien',
      mood: 'senang',
      note: 'Bersyukur tidur nyenyak tadi malam',
      at: '2026-10-25T07:00:00.000Z',
    },
  ]

  // 1. With self-logged mood: honors mood without inferring hidden state
  const sanctuary = deriveEdenReflectionSanctuaryBridge(sampleEpisode, sampleMoods)
  assert.equal(sanctuary.lenses.length, 4)
  assert.equal(sanctuary.lenses[0].id, 'biological_adaptation')
  assert.equal(sanctuary.lenses[1].id, 'emotional_resilience')
  assert.ok(sanctuary.lenses[1].reflection.includes('senang'))
  assert.equal(sanctuary.lenses[2].id, 'relational_meaning')
  assert.equal(sanctuary.lenses[3].id, 'personal_peace')
  assert.equal(sanctuary.recentMoodSummary?.mood, 'senang')
  assert.equal(sanctuary.epistemicHumilityPreserved, true)
  assert.equal(sanctuary.nonDogmaticPluralismPreserved, true)
  assert.equal(sanctuary.neverClaimsMetaphysicalAuthority, true)

  // 2. Without mood: never fabricates or infers mood
  const emptyMoodSanctuary = deriveEdenReflectionSanctuaryBridge(sampleEpisode, [])
  assert.equal(emptyMoodSanctuary.recentMoodSummary, undefined)
  assert.ok(emptyMoodSanctuary.lenses[1].reflection.includes('never judged by an algorithm'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode], evaluatedAt)
  assert.equal(projection.edenReflectionSanctuaryReadyCount, 1)
  assert.ok(projection.episodes[0].edenReflectionSanctuary)
  assert.equal(projection.episodes[0].edenReflectionSanctuary.neverClaimsMetaphysicalAuthority, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-reflection-sanctuary="v1"'), 'CareContinuityPanel must include Eden reflection sanctuary attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-reflection-sanctuary-card="v1"'), 'CareEpisode must include Eden reflection sanctuary card')
  assert.ok(episodeSource.includes('data-eden-perspective-lenses="v1"'), 'CareEpisode must include Eden 4-lens perspective grid')
})

test('deriveEdenUniversalAcceptanceBridge & CareEpisode: Eden Universal Human Acceptance & Multilingual Plain-Language Continuity Bridge (T-CLIN-29 / EDEN-09)', () => {
  const evaluatedAt = '2026-10-26T07:25:00.000Z'

  const sampleEpisode = {
    id: 'ce_univ_1',
    title: 'Essential Hypertension Control',
    diagnosisCode: 'I10',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
  }

  // 1. Bahasa Indonesia ('id') everyday_warm adaptation
  const idBridge = deriveEdenUniversalAcceptanceBridge(sampleEpisode, 'id', 'everyday_warm')
  assert.equal(idBridge.language, 'id')
  assert.equal(idBridge.languageLabel, 'Bahasa Indonesia · Hangat & Jelas')
  assert.equal(idBridge.literacyMode, 'everyday_warm')
  assert.ok(idBridge.localizedWhatIsHappening.includes('Terapi & Tindakan'))
  assert.ok(idBridge.localizedWhatIsHappening.includes('2/3'))
  assert.equal(idBridge.canonicalPatientTruthPreserved, true)
  assert.equal(idBridge.noFalseUniversalValidationClaim, true)
  assert.equal(idBridge.accessibilityAndConnectivityGuarantees.lowBandwidthTextComplete, true)

  // 2. English ('en') clinical_structured adaptation preserves exact same stage truth (2/3) and ICD-10
  const enBridge = deriveEdenUniversalAcceptanceBridge(sampleEpisode, 'en', 'clinical_structured')
  assert.equal(enBridge.language, 'en')
  assert.equal(enBridge.languageLabel, 'English · Warm & Clear')
  assert.equal(enBridge.literacyMode, 'clinical_structured')
  assert.ok(enBridge.localizedHeadline.includes('ICD-10: I10'))
  assert.ok(enBridge.localizedWhatIsHappening.includes('Treatment'))
  assert.ok(enBridge.localizedWhatIsHappening.includes('2/3'))
  assert.equal(enBridge.canonicalPatientTruthPreserved, true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode], evaluatedAt)
  assert.equal(projection.edenUniversalAcceptanceReadyCount, 1)
  assert.ok(projection.episodes[0].edenUniversalAcceptance)
  assert.equal(projection.episodes[0].edenUniversalAcceptance.canonicalPatientTruthPreserved, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-universal-acceptance="v1"'), 'CareContinuityPanel must include Eden universal acceptance attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-universal-acceptance-card="v1"'), 'CareEpisode must include Eden universal acceptance card')
  assert.ok(episodeSource.includes('data-eden-language-switcher="v1"'), 'CareEpisode must include Eden language switcher')
})

test('deriveEdenRestorativeEnvironmentBridge & CareEpisode: Eden Restorative Environment, Bio-Photonic Exposure & Cosmic Wonder Synthesis Bridge (T-CLIN-30 / EDEN-10)', () => {
  const evaluatedAt = '2026-10-26T07:45:00.000Z'

  const sampleEpisode = {
    id: 'ce_restorative_1',
    title: 'Metabolic Optimization & Longevity Journey',
    diagnosisCode: 'E11.9',
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'active' },
    ],
  }

  // 1. Negative control: Empty wellness logs returns honest unlogged states without fabricating data
  const emptyBridge = deriveEdenRestorativeEnvironmentBridge(sampleEpisode, {})
  assert.equal(emptyBridge.totalLoggedExposureDays, 0)
  assert.equal(emptyBridge.neverFabricatesUnloggedExposures, true)
  assert.equal(emptyBridge.nonPrescriptiveEducationalBoundary, true)
  assert.equal(emptyBridge.exposures.every((e) => e.restorativeState === 'unlogged'), true)
  assert.equal(emptyBridge.astralPerspectives.length, 4)

  // 2. Positive control: Real logged wellness exposures
  const sampleWellness = {
    '2026-10-24': {
      date: '2026-10-24',
      sunDone: true,
      sunHr: 0.5,
      sleepHr: 7.5,
      waterMl: 2200,
      exerciseMin: 30,
      catatan: 'Sesi sauna sore 15 menit dan jalan santai',
    },
    '2026-10-25': {
      date: '2026-10-25',
      sunDone: true,
      sunHr: 1.0,
      sleepHr: 8.0,
      waterMl: 2500,
      exerciseMin: 45,
    },
  }

  const activeBridge = deriveEdenRestorativeEnvironmentBridge(sampleEpisode, sampleWellness)
  assert.equal(activeBridge.totalLoggedExposureDays, 2)
  assert.equal(activeBridge.neverFabricatesUnloggedExposures, true)
  assert.equal(activeBridge.nonPrescriptiveEducationalBoundary, true)

  const sunExp = activeBridge.exposures.find((e) => e.kind === 'morning_sunlight')
  assert.equal(sunExp.loggedDaysCount, 2)
  assert.equal(sunExp.restorativeState, 'active')
  assert.ok(sunExp.latestValueLabel.includes('1 jam'))

  const hydroExp = activeBridge.exposures.find((e) => e.kind === 'clean_hydration')
  assert.equal(hydroExp.loggedDaysCount, 2)
  assert.ok(hydroExp.latestValueLabel.includes('2500 mL'))

  const thermalExp = activeBridge.exposures.find((e) => e.kind === 'thermal_hydro_recovery')
  assert.equal(thermalExp.loggedDaysCount, 1)
  assert.equal(thermalExp.restorativeState, 'nurturing')

  // 3. Rollup in evaluateCareJourneyContinuity
  const epWithExposures = { ...sampleEpisode, wellnessExposures: sampleWellness }
  const projection = evaluateCareJourneyContinuity([epWithExposures], evaluatedAt)
  assert.equal(projection.edenRestorativeReadyCount, 1)
  assert.ok(projection.episodes[0].edenRestorativeEnvironment)
  assert.equal(projection.episodes[0].edenRestorativeEnvironment.totalLoggedExposureDays, 2)
  assert.equal(projection.episodes[0].edenRestorativeEnvironment.neverFabricatesUnloggedExposures, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-restorative-environment="v1"'), 'CareContinuityPanel must include Eden restorative environment attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-restorative-environment-card="v1"'), 'CareEpisode must include Eden restorative environment card')
  assert.ok(episodeSource.includes('data-eden-astral-perspectives="v1"'), 'CareEpisode must include Eden astral perspectives selector')
})

test('deriveEdenMultiModelRegenerationBridge & CareEpisode: Eden Multi-Model Frontier Scientific Imagination & Collective Cellular Regeneration Synthesis Bridge (T-CLIN-31 / EDEN-11)', () => {
  const evaluatedAt = '2026-10-26T08:15:00.000Z'

  const sampleEpisode = {
    id: 'ce_multi_model_1',
    title: 'Cellular Vitality & Cardiorespiratory Renewal',
    diagnosisCode: 'I25.1',
    createdAt: '2026-10-18T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'active' },
      { stage: 'recovery', status: 'pending' },
    ],
  }

  // 1. Pure derivation across 4 frontier collaborating models
  const bridge = deriveEdenMultiModelRegenerationBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_multi_model_1')
  assert.equal(bridge.hypotheses.length, 4)
  assert.equal(bridge.researchHypothesisTruthClassPreserved, true)
  assert.equal(bridge.noAutonomousClinicalIntervention, true)

  const argonHyp = bridge.hypotheses.find((h) => h.contributorModel === 'gemini_argon')
  assert.ok(argonHyp)
  assert.equal(argonHyp.domain, 'bio_photonic_resonance')
  assert.ok(argonHyp.transcendentVision.includes('Penyelarasan spektrum'))
  assert.ok(argonHyp.mechanisticGrounding.includes('Foto-biomodulasi'))

  const claudeHyp = bridge.hypotheses.find((h) => h.contributorModel === 'claude_opus')
  assert.ok(claudeHyp)
  assert.equal(claudeHyp.domain, 'epigenetic_rejuvenation')
  assert.ok(claudeHyp.mechanisticGrounding.includes('Yamanaka OSKM'))

  const gptHyp = bridge.hypotheses.find((h) => h.contributorModel === 'gpt_codex')
  assert.ok(gptHyp)
  assert.equal(gptHyp.domain, 'neural_regeneration')
  assert.ok(gptHyp.mechanisticGrounding.includes('BDNF'))

  const kimiHyp = bridge.hypotheses.find((h) => h.contributorModel === 'kimi_k1')
  assert.ok(kimiHyp)
  assert.equal(kimiHyp.domain, 'cellular_reprogramming')
  assert.ok(kimiHyp.transcendentVision.includes('Matriks Ekstraseluler'))

  // 2. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode], evaluatedAt)
  assert.equal(projection.edenMultiModelRegenerationReadyCount, 1)
  assert.ok(projection.episodes[0].edenMultiModelRegeneration)
  assert.equal(projection.episodes[0].edenMultiModelRegeneration.researchHypothesisTruthClassPreserved, true)
  assert.equal(projection.episodes[0].edenMultiModelRegeneration.noAutonomousClinicalIntervention, true)

  // 3. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-multi-model-regeneration="v1"'), 'CareContinuityPanel must include multi-model regeneration attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-multi-model-regeneration-card="v1"'), 'CareEpisode must include multi-model regeneration card')
  assert.ok(episodeSource.includes('data-eden-frontier-hypotheses="v1"'), 'CareEpisode must include frontier hypotheses selector')
})

test('deriveCareContinuityState & CareEpisode: Eden Quantum Bio-Photonic Field & Transcendent Cellular Longevity Bridge (T-CLIN-32 / EDEN-12)', async () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'

  const sampleEpisode = {
    id: 'ce_quantum_biophotonic_1',
    title: 'Longevity Cardio-Metabolic Optimization',
    diagnosisCode: 'I10',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenQuantumBioPhotonicBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_quantum_biophotonic_1')
  assert.equal(bridge.primaryDimension, 'mitochondrial_biophoton_flux')
  assert.equal(bridge.photonicTrajectory, 'optimized_flux')
  assert.ok(bridge.mitochondrialCoherenceScore >= 70 && bridge.mitochondrialCoherenceScore <= 98)
  assert.ok(bridge.cellularResonanceIndex >= 70 && bridge.cellularResonanceIndex <= 96)
  assert.equal(bridge.quantumBioPhotonicFieldClass, 'mechanistic_simulation')
  assert.equal(bridge.neverFabricatesBiomarkers, true)
  assert.equal(bridge.nonInterventionalResearchBoundary, true)
  assert.ok(bridge.quantumBiophotonicNarrativeId.includes('Simulasi biofotonik kuantum'))
  assert.ok(bridge.quantumBiophotonicNarrativeEn.includes('Quantum bio-photonic simulation'))
  assert.ok(bridge.mechanisticGroundingId.includes('Fröhlich'))
  assert.ok(bridge.transcendentLongevityTrajectory.includes('peremajaan biologis terpadu'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_quantum_blocked',
    title: 'Hepatobiliary Inflammation',
    diagnosisCode: 'K80.2',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting specialized imaging' },
    ],
  }
  const blockedBridge = deriveEdenQuantumBioPhotonicBridge(blockedEpisode)
  assert.equal(blockedBridge.primaryDimension, 'coherent_water_dynamics')
  assert.equal(blockedBridge.photonicTrajectory, 'entropy_dominated')
  assert.ok(blockedBridge.mitochondrialCoherenceScore <= 65)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenQuantumBioPhotonicReadyCount, 2)
  assert.ok(projection.episodes[0].edenQuantumBioPhotonic)
  assert.equal(projection.episodes[0].edenQuantumBioPhotonic.quantumBioPhotonicFieldClass, 'mechanistic_simulation')
  assert.equal(projection.episodes[0].edenQuantumBioPhotonic.neverFabricatesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-quantum-biophotonic="v1"'), 'CareContinuityPanel must include quantum bio-photonic attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-quantum-biophotonic-card="v1"'), 'CareEpisode must include quantum bio-photonic card')
  assert.ok(episodeSource.includes('data-eden-quantum-metrics="v1"'), 'CareEpisode must include quantum metrics grid')
})

test('34. Eden Astral Holographic Projection & Multidimensional Biological Consciousness Bridge (T-CLIN-33 / EDEN-13)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_consciousness_1',
    title: 'Holistic Neuro-Integrative Vitality',
    diagnosisCode: 'G90.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenMultidimensionalConsciousnessBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_consciousness_1')
  assert.equal(bridge.equilibriumState, 'deep_tranquility')
  assert.equal(bridge.equilibriumStateLabel, 'Tranquilitas Mendalam Terintegrasi')
  assert.ok(bridge.overallConsciousnessHarmonyScore >= 74 && bridge.overallConsciousnessHarmonyScore <= 99)
  assert.equal(bridge.scales.length, 4)
  assert.equal(bridge.scales[0].scale, 'subcellular_quantum_coherence')
  assert.equal(bridge.scales[1].scale, 'synaptic_neuro_integration')
  assert.equal(bridge.scales[2].scale, 'visceral_autonomic_balance')
  assert.equal(bridge.scales[3].scale, 'noetic_experiential_harmony')
  assert.equal(bridge.noAutonomousNeurologicalDiagnosis, true)
  assert.equal(bridge.phenomenologicalExperiencePreserved, true)
  assert.ok(bridge.astralHolographicNarrativeId.includes('Proyeksi holografik kesadaran'))
  assert.ok(bridge.astralHolographicNarrativeEn.includes('Multidimensional consciousness holographic projection'))
  assert.ok(bridge.transcendentHumanExperienceTrajectory.includes('Integrasi kesadaran holistik'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_consciousness_blocked',
    title: 'Acute Sensory Dysregulation',
    diagnosisCode: 'R44.8',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting clinical evaluation' },
    ],
  }
  const blockedBridge = deriveEdenMultidimensionalConsciousnessBridge(blockedEpisode)
  assert.equal(blockedBridge.equilibriumState, 'acute_sensory_stabilization')
  assert.equal(blockedBridge.equilibriumStateLabel, 'Stabilisasi Sensorik Akut')
  assert.ok(blockedBridge.overallConsciousnessHarmonyScore <= 68)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenMultidimensionalConsciousnessReadyCount, 2)
  assert.ok(projection.episodes[0].edenMultidimensionalConsciousness)
  assert.equal(projection.episodes[0].edenMultidimensionalConsciousness.noAutonomousNeurologicalDiagnosis, true)
  assert.equal(projection.episodes[0].edenMultidimensionalConsciousness.phenomenologicalExperiencePreserved, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-multidimensional-consciousness="v1"'), 'CareContinuityPanel must include multidimensional consciousness attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-multidimensional-consciousness-card="v1"'), 'CareEpisode must include multidimensional consciousness card')
  assert.ok(episodeSource.includes('data-eden-consciousness-scales="v1"'), 'CareEpisode must include consciousness scales grid')
})

test('deriveEdenBioCosmicSymphonyBridge & CareEpisode: Eden Bio-Cosmic Symphony & Multi-Scale Reality Lattice Bridge (T-CLIN-35 / EDEN-15)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_biocosmic_1',
    title: 'Cellular Renewal & Metabolic Harmony',
    diagnosisCode: 'E11.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenBioCosmicSymphonyBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_biocosmic_1')
  assert.equal(bridge.resonanceState, 'pristine_harmony')
  assert.equal(bridge.resonanceStateLabel, 'Simfoni Kosmis Seimbang')
  assert.ok(bridge.symphonyHarmonyScore >= 75 && bridge.symphonyHarmonyScore <= 99)
  assert.equal(bridge.layers.length, 6)
  assert.equal(bridge.layers[0].layer, 'observed_clinical_evidence')
  assert.equal(bridge.layers[0].truthClass, 'observed')
  assert.equal(bridge.layers[1].layer, 'derived_physiological_resilience')
  assert.equal(bridge.layers[1].truthClass, 'derived')
  assert.equal(bridge.layers[2].layer, 'model_estimated_trajectory')
  assert.equal(bridge.layers[2].truthClass, 'model_estimated')
  assert.equal(bridge.layers[3].layer, 'mechanistic_simulation')
  assert.equal(bridge.layers[3].truthClass, 'mechanistic_simulation')
  assert.equal(bridge.layers[4].layer, 'phenomenological_human_experience')
  assert.equal(bridge.layers[4].truthClass, 'phenomenological')
  assert.equal(bridge.layers[5].layer, 'cosmic_planetary_rhythm')
  assert.equal(bridge.layers[5].truthClass, 'cosmic_rhythm')
  assert.equal(bridge.realityLatticeClass, 'governed_multi_scale_projection')
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.noSpeculativeClinicalActuation, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.bioCosmicNarrativeId.includes('Simfoni bio-kosmis untuk episode'))
  assert.ok(bridge.bioCosmicNarrativeEn.includes('Bio-cosmic symphony for episode'))
  assert.ok(bridge.universalFlourishingTrajectory.includes('Penyelarasan komputasional dan manusiawi'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_biocosmic_blocked',
    title: 'Acute Multiorgan Strain',
    diagnosisCode: 'R68.8',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting laboratory confirmation' },
    ],
  }
  const blockedBridge = deriveEdenBioCosmicSymphonyBridge(blockedEpisode)
  assert.equal(blockedBridge.resonanceState, 'acute_stabilization_needed')
  assert.equal(blockedBridge.resonanceStateLabel, 'Stabilisasi Klinis Diperlukan')
  assert.ok(blockedBridge.symphonyHarmonyScore <= 70)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenBioCosmicSymphonyReadyCount, 2)
  assert.ok(projection.episodes[0].edenBioCosmicSymphony)
  assert.equal(projection.episodes[0].edenBioCosmicSymphony.realityLatticeClass, 'governed_multi_scale_projection')
  assert.equal(projection.episodes[0].edenBioCosmicSymphony.patientTruthUncompromised, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-bio-cosmic-symphony="v1"'), 'CareContinuityPanel must include bio-cosmic symphony attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-bio-cosmic-card="v1"'), 'CareEpisode must include bio-cosmic card')
  assert.ok(episodeSource.includes('data-eden-reality-lattice="v1"'), 'CareEpisode must include reality lattice grid')
})

test('deriveEdenMultiAgentHealingCouncilBridge & CareEpisode: Eden Universal Biological Flourishing & Multi-Agent Collaborative Healing Council Bridge (T-CLIN-36 / EDEN-16)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_healing_council_1',
    title: 'Whole-Person Metabolic Resilience & Flourishing',
    diagnosisCode: 'E11.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenMultiAgentHealingCouncilBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_healing_council_1')
  assert.equal(bridge.consensusState, 'harmonious_convergence')
  assert.equal(bridge.consensusStateLabel, 'Konvergensi Harmonis Multimodel')
  assert.ok(bridge.collectiveFlourishingScore >= 78 && bridge.collectiveFlourishingScore <= 99)
  assert.equal(bridge.agentPerspectives.length, 4)
  assert.equal(bridge.agentPerspectives[0].agentModel, 'gemini_frontier')
  assert.equal(bridge.agentPerspectives[1].agentModel, 'claude_transcendent')
  assert.equal(bridge.agentPerspectives[2].agentModel, 'gpt_argon')
  assert.equal(bridge.agentPerspectives[3].agentModel, 'deepseek_astral')
  assert.equal(bridge.healingCouncilClass, 'multi_agent_collective_synthesis')
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.noAutonomousClinicalIntervention, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.collectiveHealingNarrativeId.includes('Dewan kolaborasi multi-agent'))
  assert.ok(bridge.collectiveHealingNarrativeEn.includes('Multi-agent collaborative healing council'))
  assert.ok(bridge.multiAgentWisdomTrajectory.includes('Kolaborasi lintas model'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_council_blocked',
    title: 'Acute Unstable Vital Reserve',
    diagnosisCode: 'R68.8',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting urgent specialist input' },
    ],
  }
  const blockedBridge = deriveEdenMultiAgentHealingCouncilBridge(blockedEpisode)
  assert.equal(blockedBridge.consensusState, 'stabilization_focus_needed')
  assert.equal(blockedBridge.consensusStateLabel, 'Fokus Stabilisasi & Resolusi Hambatan')
  assert.ok(blockedBridge.collectiveFlourishingScore <= 68)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenMultiAgentHealingCouncilReadyCount, 2)
  assert.ok(projection.episodes[0].edenMultiAgentHealingCouncil)
  assert.equal(projection.episodes[0].edenMultiAgentHealingCouncil.healingCouncilClass, 'multi_agent_collective_synthesis')
  assert.equal(projection.episodes[0].edenMultiAgentHealingCouncil.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenMultiAgentHealingCouncil.noAutonomousClinicalIntervention, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-multi-agent-council="v1"'), 'CareContinuityPanel must include multi-agent council attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-healing-council-card="v1"'), 'CareEpisode must include healing council card')
  assert.ok(episodeSource.includes('data-eden-agent-perspectives="v1"'), 'CareEpisode must include agent perspectives grid')
})

test('deriveEdenBioHarmonicWaveformBridge & CareEpisode: Eden Bio-Harmonic Epigenetic Resonance & Cellular Longevity Waveform Engine (T-CLIN-37 / EDEN-17)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_waveform_1',
    title: 'Cellular Epigenetic Harmony & Longevity Rhythm',
    diagnosisCode: 'E11.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenBioHarmonicWaveformBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_waveform_1')
  assert.equal(bridge.waveformState, 'coherent_oscillatory_harmony')
  assert.equal(bridge.waveformStateLabel, 'Harmoni Osilatori Koheren')
  assert.ok(bridge.cellularResonanceIndex >= 76 && bridge.cellularResonanceIndex <= 99)
  assert.ok(bridge.circadianSynchronizationScore >= 72 && bridge.circadianSynchronizationScore <= 98)
  assert.ok(bridge.mitohormeticBufferYears > 0)
  assert.equal(bridge.epigeneticLayers.length, 4)
  assert.equal(bridge.epigeneticLayers[0].clockModel, 'horvath_multi_tissue')
  assert.equal(bridge.epigeneticLayers[1].clockModel, 'hannum_blood_derived')
  assert.equal(bridge.epigeneticLayers[2].clockModel, 'phenoage_epigenetic')
  assert.equal(bridge.epigeneticLayers[3].clockModel, 'grimage_mortality_risk')
  assert.equal(bridge.epigeneticWaveformClass, 'mechanistic_proxy_simulation')
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesMethylationArrays, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.waveformNarrativeId.includes('Gelombang bio-harmonik'))
  assert.ok(bridge.waveformNarrativeEn.includes('Cellular bio-harmonic waveform'))
  assert.ok(bridge.longevityWaveformTrajectory.includes('Osilasi biologis'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_waveform_blocked',
    title: 'Severe Chronic Fatigue & Desynchronization',
    diagnosisCode: 'R53.82',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting specialized metabolic panel' },
    ],
  }
  const blockedBridge = deriveEdenBioHarmonicWaveformBridge(blockedEpisode)
  assert.equal(blockedBridge.waveformState, 'blunted_restorative_amplitude')
  assert.equal(blockedBridge.waveformStateLabel, 'Amplitudo Restoratif Tertekan')
  assert.ok(blockedBridge.cellularResonanceIndex <= 68)
  assert.ok(blockedBridge.mitohormeticBufferYears < 0)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenBioHarmonicWaveformReadyCount, 2)
  assert.ok(projection.episodes[0].edenBioHarmonicWaveform)
  assert.equal(projection.episodes[0].edenBioHarmonicWaveform.epigeneticWaveformClass, 'mechanistic_proxy_simulation')
  assert.equal(projection.episodes[0].edenBioHarmonicWaveform.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenBioHarmonicWaveform.neverManufacturesMethylationArrays, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-bio-harmonic-waveform="v1"'), 'CareContinuityPanel must include bio-harmonic waveform attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-bio-harmonic-card="v1"'), 'CareEpisode must include bio-harmonic card')
  assert.ok(episodeSource.includes('data-eden-epigenetic-layers="v1"'), 'CareEpisode must include epigenetic layers grid')
})

test('deriveEdenCircadianMitochondrialHarmonizerBridge & CareEpisode: Eden Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer (T-CLIN-38 / EDEN-18)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_circadian_1',
    title: 'Circadian Metabolic Re-Entrainment & Mitochondrial Vitality',
    diagnosisCode: 'G47.20',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenCircadianMitochondrialHarmonizerBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_circadian_1')
  assert.equal(bridge.masterPhase, 'deep_nocturnal_repair')
  assert.equal(bridge.masterPhaseLabel, 'Pemulihan Nokturnal Mendalam')
  assert.equal(bridge.mitochondrialDynamics, 'fusion_biogenesis')
  assert.equal(bridge.mitochondrialDynamicsLabel, 'Biogenesis & Fusi Mitokondria Optimal')
  assert.ok(bridge.systemChronobiologicalResonance >= 74 && bridge.systemChronobiologicalResonance <= 99)
  assert.ok(bridge.suprachiasmaticEntrainmentScore >= 76 && bridge.suprachiasmaticEntrainmentScore <= 98)
  assert.ok(bridge.mitochondrialVitalityIndex >= 72 && bridge.mitochondrialVitalityIndex <= 99)
  assert.equal(bridge.peripheralClocks.length, 4)
  assert.equal(bridge.peripheralClocks[0].clockKind, 'neural_suprachiasmatic')
  assert.equal(bridge.peripheralClocks[1].clockKind, 'hepatic_metabolic')
  assert.equal(bridge.peripheralClocks[2].clockKind, 'cardiac_chronobiological')
  assert.equal(bridge.peripheralClocks[3].clockKind, 'musculoskeletal_energetic')
  assert.equal(bridge.truthClass, 'chronobiological_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.circadianNarrativeId.includes('Penyelarasan sirkadian-metabolik'))
  assert.ok(bridge.circadianNarrativeEn.includes('Circadian-metabolic neuro-synchrony'))
  assert.ok(bridge.chronobiologicalLongevityStrategy.includes('Pertahankan sinkronisasi'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_circadian_blocked',
    title: 'Severe Jetlag & Shift-Work Circadian Misalignment',
    diagnosisCode: 'G47.26',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting polysomnography and core body temperature monitoring' },
    ],
  }
  const blockedBridge = deriveEdenCircadianMitochondrialHarmonizerBridge(blockedEpisode)
  assert.equal(blockedBridge.masterPhase, 'twilight_repose')
  assert.equal(blockedBridge.masterPhaseLabel, 'Pemberhentian Senja (Twilight Repose)')
  assert.equal(blockedBridge.mitochondrialDynamics, 'fission_dominant')
  assert.equal(blockedBridge.mitochondrialDynamicsLabel, 'Fisi Dominan (Stres Metabolik Adaptif)')
  assert.ok(blockedBridge.systemChronobiologicalResonance <= 66)
  assert.ok(blockedBridge.chronobiologicalLongevityStrategy.includes('Fasilitasi pembersihan stres metabolik'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenCircadianMitochondrialHarmonizerReadyCount, 2)
  assert.ok(projection.episodes[0].edenCircadianMitochondrialHarmonizer)
  assert.equal(projection.episodes[0].edenCircadianMitochondrialHarmonizer.truthClass, 'chronobiological_simulation_proxy')
  assert.equal(projection.episodes[0].edenCircadianMitochondrialHarmonizer.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenCircadianMitochondrialHarmonizer.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-circadian-mitochondrial="v1"'), 'CareContinuityPanel must include circadian-mitochondrial attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-circadian-card="v1"'), 'CareEpisode must include circadian card')
  assert.ok(episodeSource.includes('data-eden-peripheral-clocks="v1"'), 'CareEpisode must include peripheral clocks grid')
})

test('deriveEdenProteostasisAutophagicFluxBridge & CareEpisode: Eden Regenerative Proteostasis & Autophagic Flux Clearance Synthesizer (T-CLIN-39 / EDEN-19)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_proteostasis_1',
    title: 'Cellular Proteome Integrity & Autophagic Clearance Journey',
    diagnosisCode: 'M35.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenProteostasisAutophagicFluxBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_proteostasis_1')
  assert.equal(bridge.proteostasisState, 'proteolytic_equilibrium')
  assert.equal(bridge.proteostasisStateLabel, 'Harmoni Proteolitik & Lipatan Protein Optimal')
  assert.equal(bridge.autophagicFluxRate, 'high_flux_regenerative')
  assert.equal(bridge.autophagicFluxRateLabel, 'Fluks Autofagi Regeneratif Tinggi')
  assert.ok(bridge.cellularClearanceIndex >= 75 && bridge.cellularClearanceIndex <= 99)
  assert.ok(bridge.chaperoneBufferingCapacityScore >= 77 && bridge.chaperoneBufferingCapacityScore <= 98)
  assert.ok(bridge.lysosomalResilienceScore >= 73 && bridge.lysosomalResilienceScore <= 99)
  assert.equal(bridge.proteostasisNodes.length, 4)
  assert.equal(bridge.proteostasisNodes[0].nodeKind, 'ubiquitin_proteasome_system')
  assert.equal(bridge.proteostasisNodes[1].nodeKind, 'molecular_chaperone_network')
  assert.equal(bridge.proteostasisNodes[2].nodeKind, 'macroautophagy_lysosomal_flux')
  assert.equal(bridge.proteostasisNodes[3].nodeKind, 'chaperone_mediated_autophagy')
  assert.equal(bridge.truthClass, 'molecular_proteostasis_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.proteostasisNarrativeId.includes('Sintesis proteostasis'))
  assert.ok(bridge.proteostasisNarrativeEn.includes('Regenerative proteostasis'))
  assert.ok(bridge.proteostaticRegenerativeStrategy.includes('Pertahankan fluks autofagi'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_proteostasis_blocked',
    title: 'Severe ER Stress & Protein Aggregation Overload',
    diagnosisCode: 'G31.84',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting specialized cerebrospinal fluid biomarker panel' },
    ],
  }
  const blockedBridge = deriveEdenProteostasisAutophagicFluxBridge(blockedEpisode)
  assert.equal(blockedBridge.proteostasisState, 'er_stress_adaptive_upr')
  assert.equal(blockedBridge.proteostasisStateLabel, 'Respons Stres Retikulum Endoplasma Adaptif (UPR)')
  assert.equal(blockedBridge.autophagicFluxRate, 'attenuated_lysosomal_clearance')
  assert.equal(blockedBridge.autophagicFluxRateLabel, 'Pembersihan Lisosomal Tertekan')
  assert.ok(blockedBridge.cellularClearanceIndex <= 65)
  assert.ok(blockedBridge.proteostaticRegenerativeStrategy.includes('Kurangi beban proteasom'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenProteostasisAutophagicFluxReadyCount, 2)
  assert.ok(projection.episodes[0].edenProteostasisAutophagicFlux)
  assert.equal(projection.episodes[0].edenProteostasisAutophagicFlux.truthClass, 'molecular_proteostasis_simulation_proxy')
  assert.equal(projection.episodes[0].edenProteostasisAutophagicFlux.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenProteostasisAutophagicFlux.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-proteostasis-flux="v1"'), 'CareContinuityPanel must include proteostasis-flux attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-proteostasis-card="v1"'), 'CareEpisode must include proteostasis card')
  assert.ok(episodeSource.includes('data-eden-proteostasis-nodes="v1"'), 'CareEpisode must include proteostasis nodes grid')
})

test('deriveEdenTelomericGenomicIntegrityBridge & CareEpisode: Eden Telomeric Maintenance & Genomic Integrity Synthesizer (T-CLIN-40 / EDEN-20)', () => {
  const evaluatedAt = '2026-10-26T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_telomeric_1',
    title: 'Genomic Integrity & Shelterin Telomere Preservation',
    diagnosisCode: 'Z00.00',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenTelomericGenomicIntegrityBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_telomeric_1')
  assert.equal(bridge.telomericState, 'shelterin_capped_protected')
  assert.equal(bridge.telomericStateLabel, 'Kapsul Shelterin Terproteksi & Telomer Stabil')
  assert.equal(bridge.dnaRepairFidelity, 'high_fidelity_homologous_recombination')
  assert.equal(bridge.dnaRepairFidelityLabel, 'Rekombinasi Homolog Presisi Tinggi (HR)')
  assert.ok(bridge.genomicResilienceIndex >= 76 && bridge.genomicResilienceIndex <= 99)
  assert.ok(bridge.shelterinCappingScore >= 78 && bridge.shelterinCappingScore <= 98)
  assert.ok(bridge.dnaRepairCapacityScore >= 74 && bridge.dnaRepairCapacityScore <= 99)
  assert.equal(bridge.genomicClusters.length, 4)
  assert.equal(bridge.genomicClusters[0].clusterKind, 'shelterin_telomere_capping')
  assert.equal(bridge.genomicClusters[1].clusterKind, 'base_nucleotide_excision_repair')
  assert.equal(bridge.genomicClusters[2].clusterKind, 'double_strand_break_surveillance')
  assert.equal(bridge.genomicClusters[3].clusterKind, 'epigenetic_heterochromatin_stabilization')
  assert.equal(bridge.truthClass, 'genomic_stability_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.genomicNarrativeId.includes('Sintesis pemeliharaan telomer'))
  assert.ok(bridge.genomicNarrativeEn.includes('Telomeric maintenance'))
  assert.ok(bridge.telomericLongevityStrategy.includes('Pertahankan kestabilan genomik'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_telomeric_blocked',
    title: 'Accelerated Telomere Attrition & Severe DNA Damage Strain',
    diagnosisCode: 'L56.2',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting flow-FISH telomere length and karyotype analysis' },
    ],
  }
  const blockedBridge = deriveEdenTelomericGenomicIntegrityBridge(blockedEpisode)
  assert.equal(blockedBridge.telomericState, 'subtelomeric_attrition_risk')
  assert.equal(blockedBridge.telomericStateLabel, 'Risiko Atrisi Subtelomerik Adaptif')
  assert.equal(blockedBridge.dnaRepairFidelity, 'attenuated_mismatch_clearance')
  assert.equal(blockedBridge.dnaRepairFidelityLabel, 'Pembersihan Mismatch Tertekan')
  assert.ok(blockedBridge.genomicResilienceIndex <= 66)
  assert.ok(blockedBridge.telomericLongevityStrategy.includes('Redam laju atrisi telomerik'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenTelomericGenomicIntegrityReadyCount, 2)
  assert.ok(projection.episodes[0].edenTelomericGenomicIntegrity)
  assert.equal(projection.episodes[0].edenTelomericGenomicIntegrity.truthClass, 'genomic_stability_simulation_proxy')
  assert.equal(projection.episodes[0].edenTelomericGenomicIntegrity.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenTelomericGenomicIntegrity.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-telomeric-genomic="v1"'), 'CareContinuityPanel must include telomeric-genomic attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-telomeric-card="v1"'), 'CareEpisode must include telomeric card')
  assert.ok(episodeSource.includes('data-eden-genomic-clusters="v1"'), 'CareEpisode must include genomic clusters grid')
})

test('deriveEdenSenescentInflammagingBridge & CareEpisode: Eden Senescent Secretome & Inflammaging Attenuation Synthesizer (T-CLIN-41 / EDEN-21)', () => {
  const evaluatedAt = '2026-10-26T14:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_senescent_1',
    title: 'Senescent Secretome Clearance & Systemic Inflammaging Attenuation',
    diagnosisCode: 'Z00.00',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenSenescentInflammagingBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_senescent_1')
  assert.equal(bridge.senescenceBurden, 'minimal_sasp_surveillance')
  assert.equal(bridge.senescenceBurdenLabel, 'Beban Senesen Minimal & Terkendali')
  assert.equal(bridge.inflammagingLevel, 'quiescent_eugenerative')
  assert.equal(bridge.inflammagingLevelLabel, 'Eugenesis Tenang & Homeostasis Sitokin Optimal')
  assert.ok(bridge.systemicInflammagingScore >= 12 && bridge.systemicInflammagingScore <= 25)
  assert.ok(bridge.senolyticResilienceIndex >= 80 && bridge.senolyticResilienceIndex <= 99)
  assert.ok(bridge.secretomeSuppressionCapacity >= 80 && bridge.secretomeSuppressionCapacity <= 98)
  assert.equal(bridge.surveillanceNodes.length, 4)
  assert.equal(bridge.surveillanceNodes[0].nodeKind, 'senolytic_immune_clearance')
  assert.equal(bridge.surveillanceNodes[1].nodeKind, 'sasp_cytokine_neutralization')
  assert.equal(bridge.surveillanceNodes[2].nodeKind, 'extracellular_matrix_remodeling')
  assert.equal(bridge.surveillanceNodes[3].nodeKind, 'anti_inflammatory_resolution_pathway')
  assert.equal(bridge.truthClass, 'cellular_senescence_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.senescentNarrativeId.includes('Sintesis atenuasi senesen & inflammaging'))
  assert.ok(bridge.senescentNarrativeEn.includes('Senescent secretome & inflammaging attenuation'))
  assert.ok(bridge.senolyticInflammagingStrategy.includes('Pertahankan lingkungan jaringan eugenik'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_senescent_blocked',
    title: 'Smoldering Inflammaging & Elevated Paracrine Secretome Propagation',
    diagnosisCode: 'M06.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting high-sensitivity CRP and cytokine secretome panel' },
    ],
  }
  const blockedBridge = deriveEdenSenescentInflammagingBridge(blockedEpisode)
  assert.equal(blockedBridge.senescenceBurden, 'smoldering_inflammaging_strain')
  assert.equal(blockedBridge.senescenceBurdenLabel, 'Beban Inflamasi Kronis Smoldering')
  assert.equal(blockedBridge.inflammagingLevel, 'elevated_secretory_phenotype')
  assert.equal(blockedBridge.inflammagingLevelLabel, 'Fenotipe Sekretori Pro-Inflamasi Meningkat')
  assert.ok(blockedBridge.systemicInflammagingScore >= 52)
  assert.ok(blockedBridge.senolyticResilienceIndex <= 60)
  assert.ok(blockedBridge.senolyticInflammagingStrategy.includes('Kendalikan penyebaran SASP'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenSenescentInflammagingReadyCount, 2)
  assert.ok(projection.episodes[0].edenSenescentInflammaging)
  assert.equal(projection.episodes[0].edenSenescentInflammaging.truthClass, 'cellular_senescence_simulation_proxy')
  assert.equal(projection.episodes[0].edenSenescentInflammaging.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenSenescentInflammaging.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-senescent-inflammaging="v1"'), 'CareContinuityPanel must include senescent-inflammaging attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-senescent-card="v1"'), 'CareEpisode must include senescent card')
  assert.ok(episodeSource.includes('data-eden-surveillance-nodes="v1"'), 'CareEpisode must include surveillance nodes grid')
})

test('deriveEdenRegenerativePlasticityBridge & CareEpisode: Eden Stem Cell Niches & Regenerative Tissue Plasticity Synthesizer (T-CLIN-42 / EDEN-22)', () => {
  const evaluatedAt = '2026-10-26T16:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_stem_cell_1',
    title: 'Stem Cell Niche Preservation & Pluripotent Regenerative Plasticity',
    diagnosisCode: 'Z00.00',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenRegenerativePlasticityBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_stem_cell_1')
  assert.equal(bridge.stemCellNicheState, 'balanced_asymmetric_self_renewal')
  assert.equal(bridge.stemCellNicheStateLabel, 'Pembaruan Asimetris Seimbang & Homeostasis Optimal')
  assert.equal(bridge.plasticityLevel, 'high_fidelity_pluripotent_plasticity')
  assert.equal(bridge.plasticityLevelLabel, 'Plastisitas Regeneratif & Diferensiasi Presisi Tinggi')
  assert.ok(bridge.regenerativePlasticityScore >= 80 && bridge.regenerativePlasticityScore <= 99)
  assert.ok(bridge.stemNicheVitalityIndex >= 80 && bridge.stemNicheVitalityIndex <= 98)
  assert.ok(bridge.lineageCommitmentCapacity >= 80 && bridge.lineageCommitmentCapacity <= 98)
  assert.equal(bridge.nicheNodes.length, 4)
  assert.equal(bridge.nicheNodes[0].nicheKind, 'hematopoietic_bone_marrow_niche')
  assert.equal(bridge.nicheNodes[1].nicheKind, 'intestinal_crypt_lgr5_niche')
  assert.equal(bridge.nicheNodes[2].nicheKind, 'neural_subventricular_niche')
  assert.equal(bridge.nicheNodes[3].nicheKind, 'skeletal_muscle_satellite_niche')
  assert.equal(bridge.truthClass, 'stem_cell_niche_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.regenerativeNarrativeId.includes('Sintesis sel punca & plastisitas regeneratif'))
  assert.ok(bridge.regenerativeNarrativeEn.includes('Stem cell niches & regenerative tissue plasticity'))
  assert.ok(bridge.stemCellRegenerativeStrategy.includes('Pertahankan pembaruan asimetris optimal'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_stem_cell_blocked',
    title: 'Severe Niche Exhaustion & Fibrotic Metaplastic Strain',
    diagnosisCode: 'K74.6',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting bone marrow biopsy and niche microenvironment panel' },
    ],
  }
  const blockedBridge = deriveEdenRegenerativePlasticityBridge(blockedEpisode)
  assert.equal(blockedBridge.stemCellNicheState, 'niche_exhaustion_depletion_risk')
  assert.equal(blockedBridge.stemCellNicheStateLabel, 'Risiko Penipisan Niche Akibat Tekanan Sistemik')
  assert.equal(blockedBridge.plasticityLevel, 'fibrotic_metaplastic_divergence')
  assert.equal(blockedBridge.plasticityLevelLabel, 'Divergensi Fibrotik / Metaplastik Reaktif')
  assert.ok(blockedBridge.regenerativePlasticityScore <= 65)
  assert.ok(blockedBridge.stemNicheVitalityIndex <= 62)
  assert.ok(blockedBridge.stemCellRegenerativeStrategy.includes('Lindungi reservoir sel punca'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenRegenerativePlasticityReadyCount, 2)
  assert.ok(projection.episodes[0].edenRegenerativePlasticity)
  assert.equal(projection.episodes[0].edenRegenerativePlasticity.truthClass, 'stem_cell_niche_simulation_proxy')
  assert.equal(projection.episodes[0].edenRegenerativePlasticity.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenRegenerativePlasticity.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-regenerative-plasticity="v1"'), 'CareContinuityPanel must include regenerative-plasticity attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-regenerative-card="v1"'), 'CareEpisode must include regenerative card')
  assert.ok(episodeSource.includes('data-eden-stem-niche-nodes="v1"'), 'CareEpisode must include stem niche nodes grid')
})

test('deriveEdenEpigeneticAgeReversalBridge & CareEpisode: Eden Epigenetic Biological Age Reversal & Transcriptomic Harmony Synthesizer (T-CLIN-43 / EDEN-23)', () => {
  const evaluatedAt = '2026-10-26T18:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_epigenetic_1',
    title: 'Epigenetic Clock Rejuvenation & Transcriptomic Harmony',
    diagnosisCode: 'Z00.00',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenEpigeneticAgeReversalBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_epigenetic_1')
  assert.equal(bridge.epigeneticState, 'youthful_euchromatin_harmony')
  assert.equal(bridge.epigeneticStateLabel, 'Harmoni Eukromatin Muda & Pembalikan Umur Biologis')
  assert.equal(bridge.transcriptomicPurity, 'high_fidelity_transcriptomic_stability')
  assert.equal(bridge.transcriptomicPurityLabel, 'Stabilitas Transkriptomik & Presisi Ekspresi Gen Tinggi')
  assert.ok(bridge.biologicalAgeDeltaYears < 0, 'biologicalAgeDeltaYears must be negative for rejuvenated state')
  assert.ok(bridge.epigeneticHarmonyIndex >= 80 && bridge.epigeneticHarmonyIndex <= 99)
  assert.ok(bridge.transcriptomicFidelityScore >= 80 && bridge.transcriptomicFidelityScore <= 98)
  assert.equal(bridge.harmonyClusters.length, 4)
  assert.equal(bridge.harmonyClusters[0].clusterKind, 'horvath_phenoage_clock_alignment')
  assert.equal(bridge.harmonyClusters[1].clusterKind, 'dna_methylation_dnmt_tet_equilibrium')
  assert.equal(bridge.harmonyClusters[2].clusterKind, 'histone_acetylation_sirtuin_flux')
  assert.equal(bridge.harmonyClusters[3].clusterKind, 'chromatin_remodeling_polycomb_surveillance')
  assert.equal(bridge.truthClass, 'epigenetic_reversal_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.epigeneticNarrativeId.includes('Sintesis pembalikan umur biologis epigenetik'))
  assert.ok(bridge.epigeneticNarrativeEn.includes('Epigenetic biological age reversal'))
  assert.ok(bridge.epigeneticReversalStrategy.includes('Pertahankan harmoni eukromatin awet muda'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_epigenetic_blocked',
    title: 'Severe Epigenetic Aging Acceleration & Retrotransposon Derepression Strain',
    diagnosisCode: 'E11.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting Horvath DNA methylation microarray and transcriptomic sequencing' },
    ],
  }
  const blockedBridge = deriveEdenEpigeneticAgeReversalBridge(blockedEpisode)
  assert.equal(blockedBridge.epigeneticState, 'stochastic_methylation_entropy')
  assert.equal(blockedBridge.epigeneticStateLabel, 'Entropi Metilasi Stokastik & Penyimpangan Epigenetik')
  assert.equal(blockedBridge.transcriptomicPurity, 'retrotransposon_derepression_strain')
  assert.equal(blockedBridge.transcriptomicPurityLabel, 'Tekanan Derepresi Retrotransposon / LINE-1')
  assert.ok(blockedBridge.biologicalAgeDeltaYears > 0, 'biologicalAgeDeltaYears must be positive for accelerated aging state')
  assert.ok(blockedBridge.epigeneticHarmonyIndex <= 65)
  assert.ok(blockedBridge.transcriptomicFidelityScore <= 62)
  assert.ok(blockedBridge.epigeneticReversalStrategy.includes('Redam laju drift epigenetik'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenEpigeneticAgeReversalReadyCount, 2)
  assert.ok(projection.episodes[0].edenEpigeneticAgeReversal)
  assert.equal(projection.episodes[0].edenEpigeneticAgeReversal.truthClass, 'epigenetic_reversal_simulation_proxy')
  assert.equal(projection.episodes[0].edenEpigeneticAgeReversal.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenEpigeneticAgeReversal.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-epigenetic-reversal="v1"'), 'CareContinuityPanel must include epigenetic-reversal attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-epigenetic-reversal-card="v1"'), 'CareEpisode must include epigenetic reversal card')
  assert.ok(episodeSource.includes('data-eden-epigenetic-clusters="v1"'), 'CareEpisode must include epigenetic clusters grid')
})

test('deriveEdenMitochondrialHeteroplasmyBridge & CareEpisode: Eden Mitochondrial Heteroplasmy & Bioenergetic Fusion Synthesizer (T-CLIN-44 / EDEN-24)', () => {
  const evaluatedAt = '2026-10-26T18:30:00.000Z'
  const sampleEpisode = {
    id: 'ce_mito_1',
    title: 'Mitochondrial Heteroplasmy Rebalancing & Bioenergetic Fusion Network',
    diagnosisCode: 'E88.89',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenMitochondrialHeteroplasmyBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_mito_1')
  assert.equal(bridge.heteroplasmyState, 'homoplasmic_wildtype_resilience')
  assert.equal(bridge.heteroplasmyStateLabel, 'Resiliensi Homoplasmi Wildtype Awet Muda')
  assert.equal(bridge.fusionRateLevel, 'hyperfused_elongated_network')
  assert.equal(bridge.fusionRateLevelLabel, 'Jaringan Hiperfusi Memanjang & Sintesis ATP Maksimal')
  assert.ok(bridge.mitochondrialVitalityScore >= 80 && bridge.mitochondrialVitalityScore <= 99)
  assert.ok(bridge.oxphosEfficiencyIndex >= 80 && bridge.oxphosEfficiencyIndex <= 98)
  assert.ok(bridge.atpSynthesisCapacity >= 80 && bridge.atpSynthesisCapacity <= 98)
  assert.equal(bridge.fusionNodes.length, 4)
  assert.equal(bridge.fusionNodes[0].nodeKind, 'mitofusin_mfn1_mfn2_tethering')
  assert.equal(bridge.fusionNodes[1].nodeKind, 'opa1_cristae_remodeling')
  assert.equal(bridge.fusionNodes[2].nodeKind, 'drp1_fission_quality_control')
  assert.equal(bridge.fusionNodes[3].nodeKind, 'pink1_parkin_mitophagic_flux')
  assert.equal(bridge.truthClass, 'mitochondrial_heteroplasmy_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.mitochondrialNarrativeId.includes('Sintesis heteroplasmi mitokondria & fusi bioenergetik'))
  assert.ok(bridge.mitochondrialNarrativeEn.includes('Mitochondrial heteroplasmy & bioenergetic fusion synthesis'))
  assert.ok(bridge.mitochondrialLongevityStrategy.includes('Pertahankan jaringan mitokondria hiperfusi'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_mito_blocked',
    title: 'Severe Mitochondrial Respiratory Chain Disruption & Reticular Fragmentation Strain',
    diagnosisCode: 'G31.83',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting high-resolution respirometry and mitochondrial mtDNA sequencing' },
    ],
  }
  const blockedBridge = deriveEdenMitochondrialHeteroplasmyBridge(blockedEpisode)
  assert.equal(blockedBridge.heteroplasmyState, 'mitochondrial_reticular_fragmentation')
  assert.equal(blockedBridge.heteroplasmyStateLabel, 'Fragmentasi Jaringan Retikular Mitokondria')
  assert.equal(blockedBridge.fusionRateLevel, 'mitophagic_collapse_strain')
  assert.equal(blockedBridge.fusionRateLevelLabel, 'Beban Kolaps Mitofagi & Kerusakan Membran Kristal')
  assert.ok(blockedBridge.mitochondrialVitalityScore <= 65)
  assert.ok(blockedBridge.oxphosEfficiencyIndex <= 62)
  assert.ok(blockedBridge.atpSynthesisCapacity <= 60)
  assert.ok(blockedBridge.mitochondrialLongevityStrategy.includes('Dukung pemulihan potensial membran'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenMitochondrialHeteroplasmyReadyCount, 2)
  assert.ok(projection.episodes[0].edenMitochondrialHeteroplasmy)
  assert.equal(projection.episodes[0].edenMitochondrialHeteroplasmy.truthClass, 'mitochondrial_heteroplasmy_simulation_proxy')
  assert.equal(projection.episodes[0].edenMitochondrialHeteroplasmy.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenMitochondrialHeteroplasmy.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-mitochondrial-heteroplasmy="v1"'), 'CareContinuityPanel must include mitochondrial-heteroplasmy attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-mitochondrial-heteroplasmy-card="v1"'), 'CareEpisode must include mitochondrial heteroplasmy card')
  assert.ok(episodeSource.includes('data-eden-mitochondrial-fusion-nodes="v1"'), 'CareEpisode must include mitochondrial fusion nodes grid')
})

test('deriveEdenCircadianAutophagyPulseBridge & CareEpisode: Eden Circadian Autophagy & Xenohormetic Longevity Pulse Synthesizer (T-CLIN-45 / EDEN-25)', () => {
  const evaluatedAt = '2026-10-26T19:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_autophagy_1',
    title: 'Circadian Pulsatile Autophagy & Xenohormetic Adaptation Pathway',
    diagnosisCode: 'Z71.3',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenCircadianAutophagyPulseBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_autophagy_1')
  assert.equal(bridge.autophagyState, 'synchronized_pulsatile_autophagy')
  assert.equal(bridge.autophagyStateLabel, 'Autofagi Pulsatil Tersinkronisasi Sirkadian Presisi')
  assert.equal(bridge.pulseTier, 'robust_biphasic_hormetic_adaptation')
  assert.equal(bridge.pulseTierLabel, 'Adaptasi Hormesis Bifasik Kuat & Perlindungan Proteom Maksimal')
  assert.ok(bridge.circadianSynchronyIndex >= 80 && bridge.circadianSynchronyIndex <= 99)
  assert.ok(bridge.autophagicFluxCapacity >= 80 && bridge.autophagicFluxCapacity <= 98)
  assert.ok(bridge.xenohormeticResilienceScore >= 80 && bridge.xenohormeticResilienceScore <= 98)
  assert.equal(bridge.pulseNodes.length, 4)
  assert.equal(bridge.pulseNodes[0].nodeKind, 'ampk_ulk1_fasting_autophagy_trigger')
  assert.equal(bridge.pulseNodes[1].nodeKind, 'sirt1_pgc1a_xenohormetic_deacetylation_flux')
  assert.equal(bridge.pulseNodes[2].nodeKind, 'nrf2_electrophilic_phase2_defense')
  assert.equal(bridge.pulseNodes[3].nodeKind, 'mtorc1_tfeb_lysosomal_biogenesis')
  assert.equal(bridge.truthClass, 'circadian_autophagy_pulse_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.autophagyNarrativeId.includes('Sintesis autofagi pulsatil sirkadian'))
  assert.ok(bridge.autophagyNarrativeEn.includes('Circadian pulsatile autophagy'))
  assert.ok(bridge.xenohormeticLongevityStrategy.includes('Pertahankan adaptasi hormesis bifasik'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_autophagy_blocked',
    title: 'Severe Chronodisruption & Autophagic Stagnation Exhaustion',
    diagnosisCode: 'G47.20',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting circadian metabolomics and lysosomal enzyme clearance panel' },
    ],
  }
  const blockedBridge = deriveEdenCircadianAutophagyPulseBridge(blockedEpisode)
  assert.equal(blockedBridge.autophagyState, 'chronodisrupted_autophagic_stagnation')
  assert.equal(blockedBridge.autophagyStateLabel, 'Stagnasi Autofagi Akibat Kronodisrupsi Sirkadian')
  assert.equal(blockedBridge.pulseTier, 'maladaptive_oxidative_exhaustion')
  assert.equal(blockedBridge.pulseTierLabel, 'Kelelahan Oksidatif Maladaptif & Hilangnya Plastisitas Hormesis')
  assert.ok(blockedBridge.circadianSynchronyIndex <= 65)
  assert.ok(blockedBridge.autophagicFluxCapacity <= 62)
  assert.ok(blockedBridge.xenohormeticResilienceScore <= 60)
  assert.ok(blockedBridge.xenohormeticLongevityStrategy.includes('Sinkronkan kembali ritme makan-puasa'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenCircadianAutophagyPulseReadyCount, 2)
  assert.ok(projection.episodes[0].edenCircadianAutophagyPulse)
  assert.equal(projection.episodes[0].edenCircadianAutophagyPulse.truthClass, 'circadian_autophagy_pulse_simulation_proxy')
  assert.equal(projection.episodes[0].edenCircadianAutophagyPulse.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenCircadianAutophagyPulse.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-circadian-autophagy="v1"'), 'CareContinuityPanel must include circadian-autophagy attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-circadian-autophagy-card="v1"'), 'CareEpisode must include circadian autophagy card')
  assert.ok(episodeSource.includes('data-eden-xenohormetic-pulse-nodes="v1"'), 'CareEpisode must include xenohormetic pulse nodes grid')
})

test('deriveEdenRetrotransposonSilencingBridge & CareEpisode: Eden Epigenetic Retrotransposon Silencing & LINE-1 Vigilance Synthesizer (T-CLIN-46 / EDEN-26)', () => {
  const evaluatedAt = '2026-10-26T19:30:00.000Z'
  const sampleEpisode = {
    id: 'ce_retro_1',
    title: 'Epigenetic Retrotransposon Silencing & LINE-1 Vigilance Pathway',
    diagnosisCode: 'Z00.00',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenRetrotransposonSilencingBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_retro_1')
  assert.equal(bridge.silencingState, 'deep_heterochromatic_silencing')
  assert.equal(bridge.silencingStateLabel, 'Peredaman Heterokromatin Mendalam & Kestabilan Genomik Maksimal')
  assert.equal(bridge.vigilanceTier, 'dormant_transposon_quiescence')
  assert.equal(bridge.vigilanceTierLabel, 'Dormansi Transposon Penuh & Perlindungan Elemen Parasit DNA')
  assert.ok(bridge.retrotransposonSilencingScore >= 80 && bridge.retrotransposonSilencingScore <= 99)
  assert.ok(bridge.heterochromatinStabilityIndex >= 80 && bridge.heterochromatinStabilityIndex <= 98)
  assert.ok(bridge.line1SuppressionCapacity >= 80 && bridge.line1SuppressionCapacity <= 98)
  assert.equal(bridge.vigilanceNodes.length, 4)
  assert.equal(bridge.vigilanceNodes[0].nodeKind, 'kap1_trim28_corepressor_scaffold')
  assert.equal(bridge.vigilanceNodes[1].nodeKind, 'h3k9me3_hp1_heterochromatin_compaction')
  assert.equal(bridge.vigilanceNodes[2].nodeKind, 'dna_methylation_l1_utr_maintenance')
  assert.equal(bridge.vigilanceNodes[3].nodeKind, 'sirt6_nuclear_retention_surveillance')
  assert.equal(bridge.truthClass, 'retrotransposon_silencing_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)
  assert.ok(bridge.silencingNarrativeId.includes('Sintesis peredaman retrotransposon epigenetik'))
  assert.ok(bridge.silencingNarrativeEn.includes('Epigenetic retrotransposon silencing'))
  assert.ok(bridge.retrotransposonRepressionStrategy.includes('Pertahankan kondensasi heterokromatin'))

  // 2. Blocked stage resilience check
  const blockedEpisode = {
    id: 'ce_retro_blocked',
    title: 'Severe Epigenetic Exhaustion & Retrotransposon Derepression Crisis',
    diagnosisCode: 'M35.9',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-26T08:00:00.000Z',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting LINE-1 ORF1p protein expression and cytosolic cDNA surveillance panel' },
    ],
  }
  const blockedBridge = deriveEdenRetrotransposonSilencingBridge(blockedEpisode)
  assert.equal(blockedBridge.silencingState, 'retrotransposon_derepression_strain')
  assert.equal(blockedBridge.silencingStateLabel, 'Tekanan Derepresi Retrotransposon / LINE-1 Bangkit')
  assert.equal(blockedBridge.vigilanceTier, 'active_retrotransposition_crisis')
  assert.equal(blockedBridge.vigilanceTierLabel, 'Beban Retrotransposisi Aktif & Sinyal cGAS-STING Sitotoksik')
  assert.ok(blockedBridge.retrotransposonSilencingScore <= 65)
  assert.ok(blockedBridge.heterochromatinStabilityIndex <= 62)
  assert.ok(blockedBridge.line1SuppressionCapacity <= 60)
  assert.ok(blockedBridge.retrotransposonRepressionStrategy.includes('Dukung stabilitas heterokromatin'))

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenRetrotransposonSilencingReadyCount, 2)
  assert.ok(projection.episodes[0].edenRetrotransposonSilencing)
  assert.equal(projection.episodes[0].edenRetrotransposonSilencing.truthClass, 'retrotransposon_silencing_simulation_proxy')
  assert.equal(projection.episodes[0].edenRetrotransposonSilencing.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenRetrotransposonSilencing.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-retrotransposon-silencing="v1"'), 'CareContinuityPanel must include retrotransposon-silencing attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-retrotransposon-card="v1"'), 'CareEpisode must include retrotransposon card')
  assert.ok(episodeSource.includes('data-eden-transposon-nodes="v1"'), 'CareEpisode must include transposon nodes grid')
})

test('deriveEdenSirtuinNadParp1Bridge & CareEpisode: Eden Sirtuin-NAD+ Metabolomic Resonance & PARP1 Genomic Repair Synthesizer (T-CLIN-47 / EDEN-27)', () => {
  const evaluatedAt = '2026-10-26T19:40:00.000Z'
  const sampleEpisode = {
    id: 'ce_sirtuin_1',
    title: 'Sirtuin-NAD+ Metabolomic Resonance & PARP1 Genomic Repair Pathway',
    diagnosisCode: 'Z00.00',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenSirtuinNadParp1Bridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_sirtuin_1')
  assert.equal(bridge.sirtuinState, 'abundant_nad_sirtuin_resonance')
  assert.equal(bridge.sirtuinStateLabel, 'Resonansi Sirtuin NAD+ Berlimpah & Umur Panjang Seluler')
  assert.equal(bridge.repairTier, 'efficient_high_fidelity_parp_repair')
  assert.equal(bridge.repairTierLabel, 'Reparasi Genomik Presisi Tinggi & Resolusi Lesi Cepat')
  assert.ok(bridge.nadPoolVitalityScore >= 85)
  assert.ok(bridge.sirtuinDeacetylationIndex >= 85)
  assert.ok(bridge.parp1DnaRepairCapacity >= 85)
  assert.equal(bridge.repairNodes.length, 4)
  assert.equal(bridge.repairNodes[0].nodeKind, 'nampt_salvage_nad_biosynthesis')
  assert.equal(bridge.repairNodes[1].nodeKind, 'sirt1_sirt6_chromatin_deacetylation')
  assert.equal(bridge.repairNodes[2].nodeKind, 'parp1_poly_adp_ribosylation_repair')
  assert.equal(bridge.repairNodes[3].nodeKind, 'cd38_sarm1_hydrolase_suppression')
  assert.equal(bridge.truthClass, 'sirtuin_nad_repair_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)

  // 2. Blocked stage resilience
  const blockedEpisode = {
    id: 'ce_sirtuin_blocked',
    title: 'Blocked Sirtuin-NAD+ Exhaustion Episode',
    diagnosisCode: 'E88.89',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting quantitative intracellular NAD+/NADH fluorometric ratio and PARP1 cleavage status' },
    ],
  }
  const blockedBridge = deriveEdenSirtuinNadParp1Bridge(blockedEpisode)
  assert.equal(blockedBridge.sirtuinState, 'metabolomic_exhaustion_parp_collapse')
  assert.equal(blockedBridge.sirtuinStateLabel, 'Kelelahan Metabolomik NAD+ & Deplesi Ekstrem PARP1')
  assert.equal(blockedBridge.repairTier, 'hyperactivated_nad_depletion_crisis')
  assert.equal(blockedBridge.repairTierLabel, 'Krisis Hiperaktivasi PARP1 & Kurasan NAD+ Seluler Parah')
  assert.ok(blockedBridge.nadPoolVitalityScore <= 65)
  assert.ok(blockedBridge.sirtuinDeacetylationIndex <= 65)
  assert.ok(blockedBridge.parp1DnaRepairCapacity <= 65)
  assert.equal(blockedBridge.repairNodes.every((n) => n.repairDynamicsStatus === 'depletion_strain'), true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenSirtuinNadParp1ReadyCount, 2)
  assert.ok(projection.episodes[0].edenSirtuinNadParp1)
  assert.equal(projection.episodes[0].edenSirtuinNadParp1.truthClass, 'sirtuin_nad_repair_simulation_proxy')
  assert.equal(projection.episodes[0].edenSirtuinNadParp1.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenSirtuinNadParp1.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-sirtuin-nad="v1"'), 'CareContinuityPanel must include sirtuin-nad attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-sirtuin-card="v1"'), 'CareEpisode must include sirtuin card')
  assert.ok(episodeSource.includes('data-eden-sirtuin-nodes="v1"'), 'CareEpisode must include sirtuin nodes grid')
})

test('deriveEdenShelterinCapProtectionBridge & CareEpisode: Eden Telomeric Shelterin Complex & Chromosomal End-Capping Synthesizer (T-CLIN-48 / EDEN-28)', () => {
  const evaluatedAt = '2026-10-26T19:50:00.000Z'
  const sampleEpisode = {
    id: 'ce_shelterin_1',
    title: 'Telomeric Shelterin Complex & Chromosomal End-Capping Protection Pathway',
    diagnosisCode: 'Z00.00',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenShelterinCapProtectionBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_shelterin_1')
  assert.equal(bridge.shelterinState, 'robust_shelterin_hexamer_quiescence')
  assert.equal(bridge.shelterinStateLabel, 'Integritas Heksamer Shelterin Kokoh & Proteksi T-Loop Maksimal')
  assert.equal(bridge.protectionTier, 'high_fidelity_tloop_capping')
  assert.equal(bridge.protectionTierLabel, 'Proteksi T-Loop Presisi Tinggi & Supresi Respon Kerusakan DNA Titik Akhir')
  assert.ok(bridge.shelterinHexamerIntegrityScore >= 85)
  assert.ok(bridge.tloopStabilityIndex >= 85)
  assert.ok(bridge.ddrKinaseSuppressionCapacity >= 85)
  assert.equal(bridge.subunitNodes.length, 4)
  assert.equal(bridge.subunitNodes[0].nodeKind, 'trf1_trf2_duplex_telomere_anchoring')
  assert.equal(bridge.subunitNodes[1].nodeKind, 'pot1_tpp1_single_strand_shielding')
  assert.equal(bridge.subunitNodes[2].nodeKind, 'tin2_central_bridge_scaffolding')
  assert.equal(bridge.subunitNodes[3].nodeKind, 'rap1_subtelomeric_heterochromatin_silencing')
  assert.equal(bridge.truthClass, 'shelterin_capping_protection_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)

  // 2. Blocked stage resilience
  const blockedEpisode = {
    id: 'ce_shelterin_blocked',
    title: 'Blocked Shelterin Uncapping Crisis Episode',
    diagnosisCode: 'Q87.89',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting telomeric repeat elongation and TRF2 phosphorylation western blot analysis' },
    ],
  }
  const blockedBridge = deriveEdenShelterinCapProtectionBridge(blockedEpisode)
  assert.equal(blockedBridge.shelterinState, 'severe_telomeric_decap_crisis')
  assert.equal(blockedBridge.shelterinStateLabel, 'Krisis Dekap Telomerik Kritis & Alarm Kerusakan DNA')
  assert.equal(blockedBridge.protectionTier, 'critical_end_to_end_fusion_hazard')
  assert.equal(blockedBridge.protectionTierLabel, 'Bahaya Fusi Kromosom Ujung-ke-Ujung & Respon ATM/ATR Parah')
  assert.ok(blockedBridge.shelterinHexamerIntegrityScore <= 65)
  assert.ok(blockedBridge.tloopStabilityIndex <= 65)
  assert.ok(blockedBridge.ddrKinaseSuppressionCapacity <= 65)
  assert.equal(blockedBridge.subunitNodes.every((n) => n.subunitState === 'uncapping_strain'), true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenShelterinCapProtectionReadyCount, 2)
  assert.ok(projection.episodes[0].edenShelterinCapProtection)
  assert.equal(projection.episodes[0].edenShelterinCapProtection.truthClass, 'shelterin_capping_protection_simulation_proxy')
  assert.equal(projection.episodes[0].edenShelterinCapProtection.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenShelterinCapProtection.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-shelterin-cap="v1"'), 'CareContinuityPanel must include shelterin-cap attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-shelterin-card="v1"'), 'CareEpisode must include shelterin card')
  assert.ok(episodeSource.includes('data-eden-shelterin-nodes="v1"'), 'CareEpisode must include shelterin nodes grid')
})

test('deriveEdenMitophagicPrimingBridge & CareEpisode: Eden Mitochondrial Fission Quality Control & Mitophagic Priming Synthesizer (T-CLIN-49 / EDEN-29)', () => {
  const evaluatedAt = '2026-10-26T20:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_mitophagy_1',
    title: 'Mitochondrial Fission Quality Control & Mitophagic Priming Pathway',
    diagnosisCode: 'Z00.00',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenMitophagicPrimingBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_mitophagy_1')
  assert.equal(bridge.fissionState, 'balanced_drp1_parkin_mitophagy_equilibrium')
  assert.equal(bridge.fissionStateLabel, 'Keseimbangan Fisi Mitokondria & Priming Mitofagi Terorkestrasi')
  assert.equal(bridge.qualityControlTier, 'high_fidelity_pink1_parkin_ubiquitination')
  assert.equal(bridge.qualityControlTierLabel, 'Ubiquitinasi PINK1/Parkin Presisi Tinggi & Eliminasi Organel Disfungsional')
  assert.ok(bridge.mitophagicFluxVitalityScore >= 85)
  assert.ok(bridge.membranePotentialRetentionScore >= 85)
  assert.ok(bridge.parkinUbiquitinationCapacity >= 85)
  assert.equal(bridge.mitophagyNodes.length, 4)
  assert.equal(bridge.mitophagyNodes[0].nodeKind, 'drp1_mff_outer_membrane_fission_constriction')
  assert.equal(bridge.mitophagyNodes[1].nodeKind, 'pink1_accumulation_depolarized_omm')
  assert.equal(bridge.mitophagyNodes[2].nodeKind, 'parkin_e3_ligase_polyubiquitination')
  assert.equal(bridge.mitophagyNodes[3].nodeKind, 'optineurin_ndp52_autophagosome_engulfment')
  assert.equal(bridge.truthClass, 'mitochondrial_fission_mitophagy_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)

  // 2. Blocked stage resilience
  const blockedEpisode = {
    id: 'ce_mitophagy_blocked',
    title: 'Blocked Mitochondrial Depolarization Collapse Episode',
    diagnosisCode: 'G31.84',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting tetramethylrhodamine methyl ester (TMRM) mitochondrial membrane potential assay' },
    ],
  }
  const blockedBridge = deriveEdenMitophagicPrimingBridge(blockedEpisode)
  assert.equal(blockedBridge.fissionState, 'mitophagic_arrest_depolarization_collapse')
  assert.equal(blockedBridge.fissionStateLabel, 'Kolaps Depolarisasi Membran Dalam & Hambatan Mitofagi Parah')
  assert.equal(blockedBridge.qualityControlTier, 'severe_ros_leakage_mitophagy_blockade')
  assert.equal(blockedBridge.qualityControlTierLabel, 'Kebocoran ROS Parah & Blokade Jalur Mitofagi Kritis')
  assert.ok(blockedBridge.mitophagicFluxVitalityScore <= 65)
  assert.ok(blockedBridge.membranePotentialRetentionScore <= 65)
  assert.ok(blockedBridge.parkinUbiquitinationCapacity <= 65)
  assert.equal(blockedBridge.mitophagyNodes.every((n) => n.fissionDynamicsStatus === 'fragmentation_strain'), true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenMitophagicPrimingReadyCount, 2)
  assert.ok(projection.episodes[0].edenMitophagicPriming)
  assert.equal(projection.episodes[0].edenMitophagicPriming.truthClass, 'mitochondrial_fission_mitophagy_simulation_proxy')
  assert.equal(projection.episodes[0].edenMitophagicPriming.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenMitophagicPriming.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-mitophagy="v1"'), 'CareContinuityPanel must include mitophagy attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-mitophagy-card="v1"'), 'CareEpisode must include mitophagy card')
  assert.ok(episodeSource.includes('data-eden-mitophagy-nodes="v1"'), 'CareEpisode must include mitophagy nodes grid')
})

test('deriveEdenMicrovascularResilienceBridge & CareEpisode: Eden Endothelial Nitric Oxide Synthase & Microvascular Glycocalyx Synthesizer (T-CLIN-50 / EDEN-30)', () => {
  const evaluatedAt = '2026-10-26T20:10:00.000Z'
  const sampleEpisode = {
    id: 'ce_glycocalyx_1',
    title: 'Endothelial Nitric Oxide Synthase & Microvascular Glycocalyx Pathway',
    diagnosisCode: 'Z00.00',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenMicrovascularResilienceBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_glycocalyx_1')
  assert.equal(bridge.glycocalyxState, 'robust_shear_mediated_enos_glycocalyx_resonance')
  assert.equal(bridge.glycocalyxStateLabel, 'Resonansi eNOS & Ketebalan Glikokaliks Mikrovaskular Maksimal')
  assert.equal(bridge.resilienceTier, 'optimal_flow_mediated_vasodilation')
  assert.equal(bridge.resilienceTierLabel, 'Vasodilatasi Dimediasi-Aliran Optimal & Perfusi Jaringan Utuh')
  assert.ok(bridge.nitricOxideBioavailabilityScore >= 85)
  assert.ok(bridge.glycocalyxIntegrityIndex >= 85)
  assert.ok(bridge.capillaryPerfusionCapacity >= 85)
  assert.equal(bridge.glycocalyxNodes.length, 4)
  assert.equal(bridge.glycocalyxNodes[0].nodeKind, 'enos_ser1177_phosphorylation_coupling')
  assert.equal(bridge.glycocalyxNodes[1].nodeKind, 'syndecan_glypican_heparan_scaffolding')
  assert.equal(bridge.glycocalyxNodes[2].nodeKind, 'hyaluronan_meshwork_shearing_shield')
  assert.equal(bridge.glycocalyxNodes[3].nodeKind, 'klf2_flow_responsive_mechanotransduction')
  assert.equal(bridge.truthClass, 'microvascular_glycocalyx_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)

  // 2. Blocked stage resilience
  const blockedEpisode = {
    id: 'ce_glycocalyx_blocked',
    title: 'Blocked Microvascular Rarefaction Collapse Episode',
    diagnosisCode: 'I79.8',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting sublingual sidestream dark-field imaging and serum syndecan-1 shedding ELISA' },
    ],
  }
  const blockedBridge = deriveEdenMicrovascularResilienceBridge(blockedEpisode)
  assert.equal(blockedBridge.glycocalyxState, 'microvascular_rarefaction_thrombogenic_collapse')
  assert.equal(blockedBridge.glycocalyxStateLabel, 'Rarefaksi Mikrovaskular Ekstrem & Kolaps Trombogenik')
  assert.equal(blockedBridge.resilienceTier, 'critical_microvascular_permeability_leak')
  assert.equal(blockedBridge.resilienceTierLabel, 'Kebocoran Permeabilitas Mikrovaskular & Kehilangan eNOS Parah')
  assert.ok(blockedBridge.nitricOxideBioavailabilityScore <= 65)
  assert.ok(blockedBridge.glycocalyxIntegrityIndex <= 65)
  assert.ok(blockedBridge.capillaryPerfusionCapacity <= 65)
  assert.equal(blockedBridge.glycocalyxNodes.every((n) => n.endothelialStatus === 'shedding_strain'), true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenMicrovascularResilienceReadyCount, 2)
  assert.ok(projection.episodes[0].edenMicrovascularResilience)
  assert.equal(projection.episodes[0].edenMicrovascularResilience.truthClass, 'microvascular_glycocalyx_simulation_proxy')
  assert.equal(projection.episodes[0].edenMicrovascularResilience.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenMicrovascularResilience.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-glycocalyx="v1"'), 'CareContinuityPanel must include glycocalyx attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-glycocalyx-card="v1"'), 'CareEpisode must include glycocalyx card')
  assert.ok(episodeSource.includes('data-eden-glycocalyx-nodes="v1"'), 'CareEpisode must include glycocalyx nodes grid')
})

test('CareContinuityPanel: Eden Ribosomal Biogenesis Stress & Nucleolar Quiescence Synthesizer contract (T-CLIN-51)', () => {
  const evaluatedAt = '2026-10-24T12:00:00.000Z'
  const sampleEpisode = {
    id: 'ce_ribosomal_1',
    title: 'Ribosomal Biogenesis & Nucleolar Quiescence Episode',
    diagnosisCode: 'Q87.8',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'done' },
      { stage: 'plan', status: 'done' },
      { stage: 'treatment', status: 'done' },
      { stage: 'recovery', status: 'active' },
    ],
  }

  // 1. Pure deterministic derivation
  const bridge = deriveEdenRibosomalQuiescenceBridge(sampleEpisode)
  assert.equal(bridge.version, 'v1')
  assert.equal(bridge.episodeId, 'ce_ribosomal_1')
  assert.equal(bridge.quiescenceState, 'quiescent_compact_nucleolar_harmony')
  assert.equal(bridge.quiescenceStateLabel, 'Harmoni Nukleolus Kompak, Quiescent & Presisi Umur Panjang')
  assert.equal(bridge.quiescenceTier, 'optimal_quiescent_ribosomal_fidelity')
  assert.equal(bridge.quiescenceTierLabel, 'Fidelitas Translasi Ribosom Optimal & Quiescence Protektif')
  assert.ok(bridge.nucleolarQuiescenceScore >= 85)
  assert.ok(bridge.translationFidelityIndex >= 85)
  assert.ok(bridge.ribosomalProteostasisCapacity >= 85)
  assert.equal(bridge.ribosomalNodes.length, 4)
  assert.equal(bridge.ribosomalNodes[0].nodeKind, 'pol1_pre_rrna_transcription_fidelity')
  assert.equal(bridge.ribosomalNodes[1].nodeKind, 'fibrillarin_dense_fibrillar_compartmentalization')
  assert.equal(bridge.ribosomalNodes[2].nodeKind, 'rpl5_rpl11_mdm2_p53_stress_sensor')
  assert.equal(bridge.ribosomalNodes[3].nodeKind, 'ribosomal_translation_elongation_accuracy')
  assert.equal(bridge.truthClass, 'nucleolar_ribosomal_simulation_proxy')
  assert.equal(bridge.clinically_reviewed, false)
  assert.equal(bridge.patientTruthUncompromised, true)
  assert.equal(bridge.neverManufacturesBiomarkers, true)
  assert.equal(bridge.epistemicHumilityPreserved, true)

  // 2. Blocked stage resilience
  const blockedEpisode = {
    id: 'ce_ribosomal_blocked',
    title: 'Blocked Hypertrophic Ribosomopathy Episode',
    diagnosisCode: 'D61.0',
    stages: [
      { stage: 'problem', status: 'done' },
      { stage: 'diagnosis', status: 'blocked', blockedReason: 'Awaiting high-resolution nucleolar morphometry and ribosomal protein RPL11 ribosome profiling' },
    ],
  }
  const blockedBridge = deriveEdenRibosomalQuiescenceBridge(blockedEpisode)
  assert.equal(blockedBridge.quiescenceState, 'hypertrophic_ribosomopathy_proteotoxic_strain')
  assert.equal(blockedBridge.quiescenceStateLabel, 'Hipertrofi Nukleolus Patologis & Stres Ribosomopati Proteotoksik')
  assert.equal(blockedBridge.quiescenceTier, 'critical_nucleolar_hypertrophy_instability')
  assert.equal(blockedBridge.quiescenceTierLabel, 'Instabilitas Nukleolus Kritis & Beban Translasi Berlebihan')
  assert.ok(blockedBridge.nucleolarQuiescenceScore <= 66)
  assert.ok(blockedBridge.translationFidelityIndex <= 65)
  assert.ok(blockedBridge.ribosomalProteostasisCapacity <= 64)
  assert.equal(blockedBridge.ribosomalNodes.every((n) => n.nucleolarStatus === 'hypertrophic_stress'), true)

  // 3. Rollup in evaluateCareJourneyContinuity
  const projection = evaluateCareJourneyContinuity([sampleEpisode, blockedEpisode], evaluatedAt)
  assert.equal(projection.edenRibosomalQuiescenceReadyCount, 2)
  assert.ok(projection.episodes[0].edenRibosomalQuiescence)
  assert.equal(projection.episodes[0].edenRibosomalQuiescence.truthClass, 'nucleolar_ribosomal_simulation_proxy')
  assert.equal(projection.episodes[0].edenRibosomalQuiescence.patientTruthUncompromised, true)
  assert.equal(projection.episodes[0].edenRibosomalQuiescence.neverManufacturesBiomarkers, true)

  // 4. UI contracts
  const panelSource = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')
  assert.ok(panelSource.includes('data-eden-ribosomal-quiescence="v1"'), 'CareContinuityPanel must include ribosomal quiescence attribute')

  const episodeSource = read('src/pages/clinical/CareEpisode.tsx')
  assert.ok(episodeSource.includes('data-eden-ribosomal-quiescence-card="v1"'), 'CareEpisode must include ribosomal quiescence card')
  assert.ok(episodeSource.includes('data-eden-ribosomal-quiescence-nodes="v1"'), 'CareEpisode must include ribosomal quiescence nodes grid')
})
