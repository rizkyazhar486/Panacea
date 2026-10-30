import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveEncounterOutcomeJob } from '../../src/domains/clinical-operations/model/encounterOutcomeJob.ts'

const visitSource = readFileSync(new URL('../../src/pages/clinical/VisitOS.tsx', import.meta.url), 'utf8')

test('VisitOS shows its patient-specific next action before secondary evidence panels', () => {
  const patientSelection = visitSource.indexOf('<PoliPatientFlowBoard')
  const nextAction = visitSource.indexOf('data-encounter-outcome-job="v1"')
  const careContinuity = visitSource.indexOf('<CareContinuityPanel')
  const anatomyContext = visitSource.indexOf('<ClinicalPatientContext')
  const commandCenter = visitSource.indexOf('<VisitCommandCenter')

  assert.ok(patientSelection >= 0 && patientSelection < nextAction, 'select a patient before presenting a next action')
  assert.ok(nextAction < careContinuity && careContinuity < anatomyContext && anatomyContext < commandCenter,
    'next action must appear before detailed care, body context, and secondary command panels')
  assert.match(visitSource, /to=\{outcomeJob\.nextAction\.href\} aria-describedby="visit-next-action-reason"/)
  assert.match(visitSource, /\{outcomeJob\.nextAction\.title\}<span aria-hidden="true"/)
  assert.doesNotMatch(visitSource, />\s*Open next step\s*→/, 'generic CTA label hides the actual destination')
})

test('VisitOS preserves accessible evidence disclosure and touch targets', () => {
  assert.match(visitSource, /aria-labelledby="visit-next-action-title"/)
  assert.match(visitSource, /id="visit-next-action-title"/)
  assert.match(visitSource, /id="visit-next-action-reason"/)
  assert.match(visitSource, /<summary className="[^"]*min-h-11[^"]*focus-visible:outline[^"]*">Workflow evidence/)
  assert.match(visitSource, /<Link to=\{step\.href\} className="[^"]*min-h-11[^"]*focus-visible:outline[^"]*">Review \{step\.title\}<\/Link>/)
  assert.match(visitSource, /<nav aria-label="Visit OS related clinical tools"/)
})

test('the next-action link targets existing clinical destinations, never synthetic signoff', () => {
  const base = { patientId: 'synthetic-patient', evaluatedAt: '2026-10-19T01:00:00.000Z', vitalTimestamps: [], historyItemCount: 0 }
  const missing = deriveEncounterOutcomeJob(base)
  const urgent = deriveEncounterOutcomeJob({ ...base, criticalFlag: true })
  assert.equal(missing.nextAction.href, '/emr')
  assert.equal(urgent.nextAction.href, '/emr')
  assert.equal(urgent.nextAction.title, 'Review critical flag now')
  assert.equal(urgent.operationalOutcomeVerified, false)
  const stepDestinations = new Set(['/emr', '/care-episode'])
  assert.ok(missing.steps.every((step) => stepDestinations.has(step.href)))
})
