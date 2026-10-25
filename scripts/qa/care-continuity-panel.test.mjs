import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateResultClosure } from '../../src/domains/clinical-operations/model/resultClosure.ts'
import { evaluateCareAccessOrchestration } from '../../src/domains/clinical-operations/model/careAccessOrchestrator.ts'
import { evaluateClinicalEpisodeResilience } from '../../src/domains/clinical-operations/model/clinicalEpisodeResilience.ts'

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

  // Domain index must export CareContinuityPanel
  assert.match(indexSrc, /export\s+\{[^}]*CareContinuityPanel[^}]*\}\s+from\s+['"]\.\/ui\/CareContinuityPanel['"]/)

  // VisitOS must wire CareContinuityPanel
  assert.match(visitSrc, /import\s+\{[^}]*CareContinuityPanel[^}]*\}\s+from\s+['"]\.\.\/\.\.\/domains\/clinical-operations['"]/)
  assert.match(visitSrc, /<CareContinuityPanel/)
})

test('CareContinuityPanel: enforces PRD §8.5 result closure and clinical safety boundary surface', () => {
  const panelSrc = read('src/domains/clinical-operations/ui/CareContinuityPanel.tsx')

  // Data attribute and accessible region
  assert.match(panelSrc, /data-care-continuity-panel="v1"/)
  assert.match(panelSrc, /aria-label=\{`Care continuity and result closure for \$\{patientName\}`\}/)

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
})

test('CareContinuityPanel backing model: result closure enforces human clinician attribution (negative control)', () => {
  const now = '2026-10-10T12:00:00.000Z'
  const sysResult = evaluateResultClosure({
    targetPatientId: 'p-synthetic-1',
    evaluatedAt: now,
    windowStart: '2026-10-01T00:00:00.000Z',
    windowEnd: '2026-10-10T23:59:59.000Z',
    validNotApplicableReasons: ['patient-deceased'],
    results: [
      {
        resultId: 'res-ai-only',
        patientId: 'p-synthetic-1',
        resultedAt: '2026-10-08T08:00:00.000Z',
        dueBy: '2026-10-09T08:00:00.000Z',
        required: { review: true, explanation: true, 'follow-up': true },
        review: { at: '2026-10-08T09:00:00.000Z', actorId: 'ai-sys', recordedBy: 'system', authorizedClinician: false },
        explanation: { at: '2026-10-08T10:00:00.000Z', actorId: 'ai-sys', recordedBy: 'system' },
        followUp: { evidence: { at: '2026-10-08T11:00:00.000Z', actorId: 'ai-sys', recordedBy: 'system' } },
      },
    ],
  })

  // System/AI cannot close required human review steps
  assert.equal(sysResult.closedCount, 0)
  assert.equal(sysResult.closureRate, 0)
  assert.deepEqual(sysResult.overdueIds, ['res-ai-only'])

  // Positive control: authenticated clinician review closes step
  const humanResult = evaluateResultClosure({
    targetPatientId: 'p-synthetic-1',
    evaluatedAt: now,
    windowStart: '2026-10-01T00:00:00.000Z',
    windowEnd: '2026-10-10T23:59:59.000Z',
    validNotApplicableReasons: ['patient-deceased'],
    results: [
      {
        resultId: 'res-human-signed',
        patientId: 'p-synthetic-1',
        resultedAt: '2026-10-08T08:00:00.000Z',
        dueBy: '2026-10-09T08:00:00.000Z',
        required: { review: true, explanation: true, 'follow-up': true },
        review: { at: '2026-10-08T09:00:00.000Z', actorId: 'dr-jane', recordedBy: 'person', authorizedClinician: true },
        explanation: { at: '2026-10-08T10:00:00.000Z', actorId: 'nurse-bob', recordedBy: 'person' },
        followUp: { evidence: { at: '2026-10-08T11:00:00.000Z', actorId: 'dr-jane', recordedBy: 'person' } },
      },
    ],
  })

  assert.equal(humanResult.closedCount, 1)
  assert.equal(humanResult.closureRate, 1.0)
  assert.equal(humanResult.overdueIds.length, 0)
})

test('CareContinuityPanel backing model: care access orchestrator enforces emergency non-denial invariant', () => {
  const result = evaluateCareAccessOrchestration({
    payer: {
      coverage: 'active',
      payerAdapterConfigured: false,
      preauthorization: 'required',
      payment: 'not-submitted',
      evidence: {
        patientIdentityResolved: true,
        coverageIdentityResolved: true,
        encounterLinked: true,
        clinicalRecordSigned: true,
        diagnosisCoded: true,
        serviceItemsCoded: true,
        supportingEvidenceLinked: true,
        provenanceComplete: true,
      },
    },
    diagnostics: [],
  })

  // Clinical safety boundary must ALWAYS hold regardless of payer coverage state
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
  assert.equal(result.clinicalCare.diagnosticStateMayAuthorizeTreatment, false)
  assert.equal(result.clinicalCare.authority, 'outside-orchestrator')
})

test('CareContinuityPanel backing model: episode transport resilience verifies replay integrity', () => {
  const resilience = evaluateClinicalEpisodeResilience({
    patientId: 'patient-synth',
    episodeId: 'enc-synth-1',
    connectivity: 'online',
    secureLocalStorageAvailable: true,
    evaluatedAt: '2026-10-25T10:00:00.000Z',
    maxRetryCount: 3,
    events: [
      {
        eventId: 'evt-101',
        patientId: 'patient-synth',
        episodeId: 'enc-synth-1',
        kind: 'observation',
        authoredAt: '2026-10-25T01:00:00.000Z',
        sourceId: 'clinic-device-1',
        sequence: 1,
        payloadDigest: 'sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        delivery: 'acknowledged',
        durableLocalCopy: true,
        encryptedAtRest: true,
        retryCount: 0,
      },
    ],
  })

  assert.equal(resilience.safeToContinueOffline, true)
  assert.equal(resilience.acknowledgedCount, 1)
  assert.equal(resilience.pendingCount, 0)
})
