import assert from 'node:assert/strict'
import { canProjectIntent, type IntentConsent, type IntentPurpose } from '../../src/lib/neuralIntent'
import {
  createDecodedBciIntentEvent,
  createExplicitIntentEvent,
  createObservedMotionEvent,
  createSimulatedIntentEvent,
} from '../../src/lib/neuralIntentAdapters'

const capturedAt = '2026-09-17T10:00:00.000Z'
const receivedAt = '2026-09-17T10:00:00.100Z'
const purposes: IntentPurpose[] = ['personal-visualization']
const mutableTags = ['user-issued']
const consent: IntentConsent = {
  granted: true,
  purposes,
  grantedAt: '2026-09-17T09:00:00.000Z',
}

const explicit = createExplicitIntentEvent({
  id: 'explicit-1',
  subjectId: 'subject-1',
  action: 'reach',
  effector: 'right-upper-limb',
  sourceKind: 'explicit-touch',
  sourceId: 'touch-ui',
  method: 'direct-selection',
  capturedAt,
  receivedAt,
  consent,
  tags: mutableTags,
})

assert.equal(explicit.source.kind, 'explicit-touch')
assert.equal(explicit.evidenceClass, 'explicit')
assert.equal(explicit.status, 'confirmed')
assert.equal(canProjectIntent(explicit, 'personal-visualization'), true)

mutableTags.push('mutated-after-construction')
purposes.push('ai-context')
assert.deepEqual(explicit.tags, ['user-issued'])
assert.deepEqual(explicit.consent.purposes, ['personal-visualization'])
assert.equal(Object.isFrozen(explicit), true)
assert.equal(Object.isFrozen(explicit.source), true)
assert.equal(Object.isFrozen(explicit.consent), true)
assert.equal(Object.isFrozen(explicit.tags), true)
assert.equal(Object.isFrozen(explicit.consent.purposes), true)

const observed = createObservedMotionEvent({
  id: 'observed-1',
  subjectId: 'subject-1',
  action: 'reach',
  effector: 'right-upper-limb',
  sourceKind: 'motion-observation',
  sourceId: 'pose-pipeline',
  version: 'pose-v1',
  method: 'camera-pose-observation',
  capturedAt,
  receivedAt,
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'rehab-tracking'],
    grantedAt: '2026-09-17T09:00:00.000Z',
  },
  tags: ['observed-only'],
})
assert.equal(observed.source.kind, 'motion-observation')
assert.equal(observed.evidenceClass, 'observed')
assert.equal(observed.status, 'candidate')

assert.throws(
  () => createDecodedBciIntentEvent({
    id: 'bci-bad-version',
    subjectId: 'subject-1',
    action: 'gesture',
    effector: 'right-upper-limb',
    sourceId: 'ecog-array',
    sourceVersion: 'array-v1',
    decoderId: 'gesture-decoder',
    decoderVersion: ' ',
    decoderConfidence: 0.82,
    signalQuality: 0.91,
    method: 'parallel-gesture-decoder',
    capturedAt,
    receivedAt,
    consent: {
      granted: true,
      purposes: ['personal-visualization'],
      grantedAt: '2026-09-17T09:00:00.000Z',
    },
  }),
  /decoderVersion/i,
)

const bci = createDecodedBciIntentEvent({
  id: 'bci-1',
  subjectId: 'subject-1',
  action: 'gesture',
  effector: 'right-upper-limb',
  sourceId: 'ecog-array',
  sourceVersion: 'array-v1',
  decoderId: 'gesture-decoder',
  decoderVersion: 'decoder-v1',
  decoderConfidence: 0.82,
  signalQuality: 0.91,
  method: 'parallel-gesture-decoder',
  capturedAt,
  receivedAt,
  consent: {
    granted: true,
    purposes: ['personal-visualization'],
    grantedAt: '2026-09-17T09:00:00.000Z',
  },
  tags: ['bci-hypothesis'],
})
assert.equal(bci.source.kind, 'bci-decoder')
assert.equal(bci.source.version, 'array-v1')
assert.equal(bci.source.decoderId, 'gesture-decoder')
assert.equal(bci.source.decoderVersion, 'decoder-v1')
assert.equal(bci.evidenceClass, 'decoded')
assert.equal(bci.status, 'candidate')
assert.equal(bci.decoderConfidence, 0.82)
assert.equal(bci.signalQuality, 0.91)

const simulated = createSimulatedIntentEvent({
  id: 'sim-1',
  subjectId: 'subject-1',
  action: 'nod',
  effector: 'head-neck',
  sourceId: 'intent-demo',
  method: 'interactive-demo',
  capturedAt,
  receivedAt,
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
    grantedAt: '2026-09-17T09:00:00.000Z',
  },
})
assert.equal(simulated.source.kind, 'simulation')
assert.equal(simulated.evidenceClass, 'simulated')
assert.equal(simulated.status, 'candidate')
assert.equal(canProjectIntent(simulated, 'personal-visualization'), true)
assert.equal(canProjectIntent(simulated, 'clinical-support'), false)
assert.equal(canProjectIntent(simulated, 'ai-context'), false)

assert.throws(
  () => createExplicitIntentEvent({
    id: 'bad-explicit-source',
    subjectId: 'subject-1',
    action: 'reach',
    effector: 'right-upper-limb',
    // A motion source can never be smuggled through the explicit constructor.
    sourceKind: 'motion-observation' as never,
    sourceId: 'pose-pipeline',
    capturedAt,
    receivedAt,
    consent: {
      granted: true,
      purposes: ['personal-visualization'],
      grantedAt: '2026-09-17T09:00:00.000Z',
    },
  }),
  /sourceKind/i,
)

console.log('Neural intent adapters contract verified: constructors own evidence semantics, BCI requires declared decoder provenance, and returned events are immutable snapshots.')
