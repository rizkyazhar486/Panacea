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

test('exportCareJourneySummary & CareEpisode: FHIR-aligned continuity handoff packet & digest verification (T-CLIN-16)', () => {
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
    costMinIdr: 18_000_000,
    costMaxIdr: 25_000_000,
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
