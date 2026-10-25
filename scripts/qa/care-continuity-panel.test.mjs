import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateResultClosure } from '../../src/domains/clinical-operations/model/resultClosure.ts'
import { evaluateCareAccessOrchestration } from '../../src/domains/clinical-operations/model/careAccessOrchestrator.ts'
import { evaluateClinicalEpisodeResilience } from '../../src/domains/clinical-operations/model/clinicalEpisodeResilience.ts'
import { deriveCareContinuityState, evaluateCareJourneyContinuity } from '../../src/domains/clinical-operations/model/careContinuityProjection.ts'
import { ensureEpisodeFromVerifiedPlan } from '../../src/lib/careEpisode.ts'

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
