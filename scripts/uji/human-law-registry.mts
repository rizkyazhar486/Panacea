import assert from 'node:assert/strict'
import {
  createHumanLawRegistry,
  registerHumanLaw,
  type HumanLawRecord,
} from '../../src/lib/humanLaw/lawRegistry.ts'

const law = (overrides: Partial<HumanLawRecord> = {}): HumanLawRecord => ({
  id: 'law:recovery-latent-v1',
  version: '1.0.0',
  title: 'Candidate latent recovery constraint',
  expression: 'dpsi/dt = f(training,sleep,inflammation,nutrition)',
  scope: 'individual',
  subjectId: 'subject-1',
  population: 'single-subject research candidate',
  ontologyRefs: [{
    namespace: 'panacea-human',
    version: '2026-09-28',
    conceptIds: ['recovery', 'training-load'],
  }],
  assumptions: ['research-only candidate'],
  units: { psi: '1' },
  parameterIds: ['theta:recovery-v1'],
  status: 'generated',
  evidence: {
    sourceEventIds: ['event-1'],
    predictionIds: [],
    comparisonIds: [],
    externalEvidenceRefs: [],
    counterexampleRefs: [],
  },
  provenance: {
    createdAt: '2026-09-28T01:00:00.000Z',
    createdBy: { kind: 'model', id: 'astra:human-law' },
    modelId: 'human-law-generator',
    modelVersion: '1.0.0',
    codeCommitSha: '0123456789abcdef0123456789abcdef01234567',
    datasetRefs: ['dataset:subject-1-window-1'],
    transformationRefs: ['transform:renorm-v1'],
  },
  ...overrides,
})

const empty = createHumanLawRegistry()
assert.equal(empty.revision, 0)
assert.deepEqual(empty.lawsById, {})
assert.deepEqual(empty.statusHistoryByLawId, {})
assert.deepEqual(empty.supersededByLawId, {})

const inserted = registerHumanLaw(empty, law())
assert.equal(inserted.status, 'inserted')
assert.equal(inserted.registry.revision, 1)
assert.equal(inserted.registry.lawsById['law:recovery-latent-v1'].status, 'generated')
assert.equal(inserted.registry.statusHistoryByLawId['law:recovery-latent-v1'].length, 1)

const duplicate = registerHumanLaw(inserted.registry, law())
assert.equal(duplicate.status, 'duplicate')
assert.deepEqual(duplicate.registry, inserted.registry)

assert.throws(() => registerHumanLaw(inserted.registry, law({ title: 'changed' })), /conflicting law id/)
assert.throws(() => registerHumanLaw(empty, law({ id: ' ' })), /id/)
assert.throws(() => registerHumanLaw(empty, law({ version: ' ' })), /version/)
assert.throws(() => registerHumanLaw(empty, law({ title: ' ' })), /title/)
assert.throws(() => registerHumanLaw(empty, law({ expression: ' ' })), /expression/)
assert.throws(() => registerHumanLaw(empty, law({ population: ' ' })), /population/)
assert.throws(() => registerHumanLaw(empty, law({ status: 'candidate' as never })), /initial status/)
assert.throws(() => registerHumanLaw(empty, law({ subjectId: undefined })), /subjectId/)
assert.throws(() => registerHumanLaw(empty, law({ scope: 'universal', subjectId: 'subject-1' })), /subjectId/)
assert.throws(() => registerHumanLaw(empty, law({ ontologyRefs: [] })), /ontologyRefs/)
assert.throws(() => registerHumanLaw(empty, law({ ontologyRefs: [{ namespace: ' ', version: '2026', conceptIds: ['x'] }] })), /namespace/)
assert.throws(() => registerHumanLaw(empty, law({ ontologyRefs: [{ namespace: 'panacea', version: ' ', conceptIds: ['x'] }] })), /version/)
assert.throws(() => registerHumanLaw(empty, law({ ontologyRefs: [{ namespace: 'panacea', version: '2026', conceptIds: [' '] }] })), /conceptIds/)
assert.throws(() => registerHumanLaw(empty, law({ provenance: { ...law().provenance, createdBy: { kind: 'model', id: ' ' } } })), /createdBy/)
assert.throws(() => registerHumanLaw(empty, law({ provenance: { ...law().provenance, createdAt: 'bad-date' } })), /createdAt/)
assert.throws(() => registerHumanLaw(empty, law({ provenance: { ...law().provenance, codeCommitSha: 'abc' } })), /codeCommitSha/)
assert.throws(() => registerHumanLaw(empty, law({ evidence: { ...law().evidence, sourceEventIds: ['event-1', 'event-1'] } })), /duplicate/)
assert.throws(() => registerHumanLaw(empty, law({ evidence: { ...law().evidence, sourceEventIds: [' '] } })), /sourceEventIds/)
assert.throws(() => registerHumanLaw(empty, law({ parameterIds: ['theta:1', 'theta:1'] })), /duplicate/)
assert.throws(() => registerHumanLaw(empty, law({ parameterIds: [' '] })), /parameterIds/)
assert.throws(() => registerHumanLaw(empty, law({ provenance: { ...law().provenance, datasetRefs: ['dataset:1', 'dataset:1'] } })), /duplicate/)
assert.throws(() => registerHumanLaw(empty, law({ provenance: { ...law().provenance, transformationRefs: [' '] } })), /transformationRefs/)
assert.throws(() => registerHumanLaw(empty, law({ units: { psi: '' } })), /units/)

console.log('human-law-registry task1: immutable registration and provenance contract')
