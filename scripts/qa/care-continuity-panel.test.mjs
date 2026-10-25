import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateResultClosure } from '../../src/domains/clinical-operations/model/resultClosure.ts'
import { evaluateCareAccessOrchestration } from '../../src/domains/clinical-operations/model/careAccessOrchestrator.ts'
import { evaluateClinicalEpisodeResilience } from '../../src/domains/clinical-operations/model/clinicalEpisodeResilience.ts'
import { deriveCareContinuityState } from '../../src/domains/clinical-operations/model/careContinuityProjection.ts'

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
})
