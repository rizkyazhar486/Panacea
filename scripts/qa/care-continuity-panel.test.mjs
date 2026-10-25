import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CareContinuityPanel } from '../../src/domains/clinical-operations/ui/CareContinuityPanel.tsx'

test('CareContinuityPanel: renders clean baseline with patient name and boundary notice', () => {
  const html = renderToStaticMarkup(
    React.createElement(CareContinuityPanel, {
      patientName: 'Jane Synthetic Doe',
    })
  )
  assert.ok(html.includes('Jane Synthetic Doe'), 'patient name rendered')
  assert.ok(html.includes('Care Continuity &amp; Result Closure') || html.includes('Care Continuity & Result Closure'), 'header present')
  assert.ok(html.includes('data-care-continuity-panel="v1"'), 'data hook present')
  assert.ok(html.includes('Clinical Safety Boundary'), 'clinical boundary notice present')
  assert.ok(html.includes('Financial or administrative workflow state may never deny emergency'), 'vital care protection present')
})

test('CareContinuityPanel: positive control - all results closed by clinician displays 100% and up-to-date badge', () => {
  const closure = {
    items: [
      {
        resultId: 'res-001',
        state: 'closed',
        unmetSteps: [],
        closedLate: false,
        invalidReasons: [],
      },
    ],
    dueCount: 1,
    closedCount: 1,
    overdueIds: [],
    invalidIds: [],
    closureRate: 1.0,
    unmeasuredReason: null,
  }

  const html = renderToStaticMarkup(
    React.createElement(CareContinuityPanel, {
      patientName: 'Jane Synthetic Doe',
      closure,
    })
  )

  assert.ok(html.includes('100%'), '100% closure rate rendered')
  assert.ok(html.includes('Results up to date'), 'up to date badge rendered')
  assert.ok(!html.includes('Overdue results'), 'no overdue warning')
  assert.ok(html.includes('res-001'), 'record item rendered')
})

test('CareContinuityPanel: negative control - overdue results display overdue badge and warning', () => {
  const closure = {
    items: [
      {
        resultId: 'res-overdue-999',
        state: 'overdue',
        unmetSteps: ['explanation', 'follow-up'],
        closedLate: false,
        invalidReasons: [],
      },
    ],
    dueCount: 1,
    closedCount: 0,
    overdueIds: ['res-overdue-999'],
    invalidIds: [],
    closureRate: 0.0,
    unmeasuredReason: null,
  }

  const html = renderToStaticMarkup(
    React.createElement(CareContinuityPanel, {
      patientName: 'John Synthetic Doe',
      closure,
    })
  )

  assert.ok(html.includes('Overdue results'), 'overdue badge rendered')
  assert.ok(html.includes('res-overdue-999'), 'overdue record ID rendered')
  assert.ok(html.includes('overdue'), 'item overdue state rendered')
})

test('CareContinuityPanel: diagnostic referral gap and payer packet attention', () => {
  const careAccess = {
    payer: {
      coverage: 'active',
      payerAdapterConfigured: true,
      preauthorization: 'required',
      payment: 'not-submitted',
      evidence: {
        patientIdentityResolved: true,
        coverageIdentityResolved: true,
        encounterLinked: true,
        clinicalRecordSigned: false,
        diagnosisCoded: true,
        serviceItemsCoded: true,
        supportingEvidenceLinked: true,
        provenanceComplete: true,
      },
    },
    diagnostics: [],
    clinicalCare: {
      authority: 'outside-orchestrator',
      financialStateMayDenyCare: false,
      diagnosticStateMayAuthorizeTreatment: false,
    },
    diagnosticContinuity: {
      state: 'gap',
      blockedDiagnosticIds: ['diag-remote-404'],
    },
    financialWorkflow: {
      state: 'attention',
      nextAdministrativeAction: 'Obtain required preauthorization from payer adapter',
      claimEvidenceReady: false,
      claimSubmissionReady: false,
      preauthorizationReady: true,
      missingClaimEvidence: ['clinicalRecordSigned'],
    },
  }

  const html = renderToStaticMarkup(
    React.createElement(CareContinuityPanel, {
      patientName: 'Alex Synthetic Doe',
      careAccess,
    })
  )

  assert.ok(html.includes('GAP'), 'diagnostic continuity gap rendered')
  assert.ok(html.includes('attention'), 'financial workflow attention rendered')
  assert.ok(html.includes('clinicalRecordSigned'), 'missing claim evidence list rendered')
})

test('CareContinuityPanel: offline episode transport resilience reflects durability and replay protection', () => {
  const episodeResilience = {
    state: 'ready',
    safeToContinueOffline: true,
    pendingCount: 2,
    acknowledgedCount: 5,
    idempotentReplayIds: ['evt-dup-1'],
    integrityConflictIds: [],
    sequenceConflictIds: [],
    foreignContextIds: [],
    invalidTimestampIds: [],
    unprotectedPendingIds: [],
    retryExhaustedIds: [],
    rejectedIds: [],
    nextOperationalAction: 'All pending items are stored encrypted with local tamper-evident digests',
    warnings: [],
  }

  const html = renderToStaticMarkup(
    React.createElement(CareContinuityPanel, {
      patientName: 'Taylor Synthetic Patient',
      episodeResilience,
    })
  )

  assert.ok(html.includes('Offline ready'), 'offline ready badge rendered')
  assert.ok(html.includes('Pending events:'), 'pending events count rendered')
  assert.ok(html.includes('Acknowledged events:'), 'acknowledged events count rendered')
})
