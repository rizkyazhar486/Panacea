import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { promoteObservationToClinicalRecord, type VisitOperatingState } from '../../src/lib/visitOperatingSystem.ts'

const root = process.cwd()
const types = readFileSync(join(root, 'src/lib/types.ts'), 'utf8')
const lens = readFileSync(join(root, 'src/components/EmrTimelineLens.tsx'), 'utf8')
const emr = readFileSync(join(root, 'src/pages/EMR.tsx'), 'utf8')

// EMRRecord must hold promoted observations as the exact shared provenance
// shape the Visit OS kernel already produces, not a parallel/simplified copy
// that could drift from the real sourceKind/review/consent contract.
assert.ok(types.includes("import type { LongitudinalEvent } from './panaceaLongitudinalState.ts'"))
assert.ok(types.includes('promotedObservations?: LongitudinalEvent<number>[]'))

// EMR.tsx must persist a promotion immediately (like sign()), not merely mark
// the draft dirty and hope the clinician remembers to click Save.
assert.ok(emr.includes('function promoteVisitObservation(event: LongitudinalEvent<number>)'))
assert.ok(emr.includes('saveRecord(promoted)'))

// EmrTimelineLens must surface promoted observations as their own
// per-event provenance (device/method/reviewer), not collapse them into the
// existing record-level signed/verified/draft state, and must call out that
// they are clinician-reviewed device data — distinct from unreviewed
// AI-drafted content.
for (const token of [
  'const promoted = record.promotedObservations ?? []',
  'Device reading promoted',
  'latestPromoted.provenance.sourceId',
  'latestPromoted.review.reviewerId',
  'Clinician-reviewed device reading, distinct from unreviewed AI-drafted content.',
]) {
  assert.ok(lens.includes(token), 'missing EMR timeline provenance token: ' + token)
}

// Behavioural check on the real kernel + lens data shape: build a state with
// one adapter-quality-rated observation, promote it, and confirm the fields
// the lens actually reads are present and well-formed.
const now = '2026-09-19T04:10:00.000Z'
const state: VisitOperatingState = {
  visitId: 'visit-emr-test',
  subjectId: 'patient-emr-test',
  clinicianId: 'dr-emr-test',
  phase: 'live',
  consent: {
    clinicalData: { granted: true, purposes: ['clinical-support', 'ai-context'], grantedAt: now },
    media: { camera: true, microphone: true, ambientAi: true, acknowledgedAt: now },
  },
  media: { transport: 'webrtc', camera: 'live', microphone: 'live', peerCount: 1, rawMediaPersisted: false, recording: 'disabled', ambientAi: 'consented' },
  devices: {
    'clinical-pulse-ox': {
      id: 'clinical-pulse-ox',
      label: 'Ward pulse oximeter',
      deviceClass: 'pulse-oximeter',
      evidenceClass: 'clinical',
      transport: 'fhir',
      firmwareVersion: '3.1',
      supports: ['spo2'],
      status: 'live',
      registeredAt: now,
      lastSeenAt: now,
    },
  },
  latestByMetric: {
    spo2: {
      id: 'spo2-sample-1',
      visitId: 'visit-emr-test',
      subjectId: 'patient-emr-test',
      deviceId: 'clinical-pulse-ox',
      metric: 'spo2',
      value: 97,
      unit: '%',
      capturedAt: now,
      receivedAt: now,
      signalQuality: 0.94,
    },
  },
  sampleCountByMetric: { spo2: 1 },
  seenSampleIds: { 'spo2-sample-1': true },
  quarantinedSampleCount: 0,
}

const event = promoteObservationToClinicalRecord(state, 'spo2', 'dr-emr-test', now)
assert.equal(event.metric, 'spo2')
assert.equal(event.value, 97)
assert.equal(event.review.state, 'accepted')
assert.equal(event.review.reviewerId, 'dr-emr-test')
assert.ok(event.provenance.sourceId.includes('clinical-pulse-ox'))
assert.ok(typeof event.provenance.method === 'string' && event.provenance.method.length > 0)

console.log('EMR observation promotion verified: shared provenance type on EMRRecord, immediate persistence, per-event timeline/provenance display distinct from draft AI content, and a real promoted-event shape the lens can render.')
