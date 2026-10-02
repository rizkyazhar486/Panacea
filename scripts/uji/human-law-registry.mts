import assert from 'node:assert/strict'
import {
  createHumanLawRegistry,
  registerHumanLaw,
  transitionHumanLaw,
  supersedeHumanLaw,
  getHumanLawLineage,
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


console.log('human-law-registry task2 RED: lifecycle API contract loaded')

const transition = (
  registry: ReturnType<typeof createHumanLawRegistry>,
  to: Parameters<typeof transitionHumanLaw>[2]['to'],
  changedAt: string,
  evidenceRefs: readonly string[] = [],
) => transitionHumanLaw(registry, law().id, {
  to,
  changedAt,
  changedBy: 'reviewer:1',
  reason: `transition to ${to}`,
  evidenceRefs,
})

let lifecycle = registerHumanLaw(createHumanLawRegistry(), law()).registry
const task2Initial = structuredClone(lifecycle)
lifecycle = transition(lifecycle, 'candidate', '2026-09-28T01:01:00.000Z')
assert.equal(lifecycle.lawsById[law().id].status, 'candidate')
assert.equal(task2Initial.lawsById[law().id].status, 'generated')

lifecycle = transition(lifecycle, 'reproduced', '2026-09-28T01:02:00.000Z', ['replication:1'])
lifecycle = transition(lifecycle, 'mechanistically-supported', '2026-09-28T01:03:00.000Z', ['mechanism:1'])
lifecycle = transition(lifecycle, 'externally-validated', '2026-09-28T01:04:00.000Z', ['external:1'])
lifecycle = transition(lifecycle, 'accepted', '2026-09-28T01:05:00.000Z', ['review:1'])
assert.equal(lifecycle.lawsById[law().id].status, 'accepted')
assert.equal(lifecycle.statusHistoryByLawId[law().id].length, 6)

const generated = registerHumanLaw(createHumanLawRegistry(), law()).registry
assert.throws(() => transitionHumanLaw(generated, 'missing', {
  to: 'candidate',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'x',
  evidenceRefs: [],
}), /unknown law id/)
assert.throws(() => transitionHumanLaw(generated, law().id, {
  to: 'candidate',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: ' ',
  reason: 'x',
  evidenceRefs: [],
}), /changedBy/)
assert.throws(() => transitionHumanLaw(generated, law().id, {
  to: 'candidate',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: 'reviewer:1',
  reason: ' ',
  evidenceRefs: [],
}), /reason/)
assert.throws(() => transitionHumanLaw(generated, law().id, {
  to: 'candidate',
  changedAt: 'bad-date',
  changedBy: 'reviewer:1',
  reason: 'x',
  evidenceRefs: [],
}), /changedAt/)
assert.throws(() => transitionHumanLaw(generated, law().id, {
  to: 'accepted',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'skip',
  evidenceRefs: ['review:1'],
}), /transition/)
assert.throws(() => transitionHumanLaw(generated, law().id, {
  to: 'generated',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'same',
  evidenceRefs: [],
}), /transition/)
const candidate = transition(generated, 'candidate', '2026-09-28T01:01:00.000Z')
assert.throws(() => transition(candidate, 'reproduced', '2026-09-28T01:02:00.000Z'), /evidence/)
assert.throws(() => transitionHumanLaw(candidate, law().id, {
  to: 'reproduced',
  changedAt: '2026-09-28T01:02:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'dup refs',
  evidenceRefs: ['replication:1', 'replication:1'],
}), /duplicate/)
assert.throws(() => transitionHumanLaw(candidate, law().id, {
  to: 'reproduced',
  changedAt: '2026-09-28T01:00:59.000Z',
  changedBy: 'reviewer:1',
  reason: 'backward time',
  evidenceRefs: ['replication:1'],
}), /changedAt/)

for (const terminal of ['rejected', 'unresolved', 'context-specific', 'scope-restricted'] as const) {
  const terminalRegistry = transition(generated, terminal, '2026-09-28T01:01:00.000Z')
  assert.equal(terminalRegistry.lawsById[law().id].status, terminal)
  assert.throws(() => transition(terminalRegistry, 'candidate', '2026-09-28T01:02:00.000Z'), /terminal/)
}

for (const sourceStatus of ['generated', 'candidate', 'reproduced', 'mechanistically-supported', 'externally-validated'] as const) {
  let registry = registerHumanLaw(createHumanLawRegistry(), law()).registry
  const promotionOrder = ['candidate', 'reproduced', 'mechanistically-supported', 'externally-validated'] as const
  if (sourceStatus !== 'generated') {
    for (const status of promotionOrder) {
      const i = promotionOrder.indexOf(status)
      const target = promotionOrder.indexOf(sourceStatus as any)
      registry = transition(registry, status, `2026-09-28T01:0${i + 1}:00.000Z`, status === 'candidate' ? [] : [`evidence:${status}`])
      if (status === sourceStatus || i >= target) break
    }
  }
  const rejected = transition(registry, 'rejected', '2026-09-28T01:10:00.000Z')
  assert.equal(rejected.lawsById[law().id].status, 'rejected')
}

for (const terminal of ['deprecated', 'scope-restricted'] as const) {
  const got = transition(lifecycle, terminal, '2026-09-28T01:06:00.000Z', ['counterexample:1'])
  assert.equal(got.lawsById[law().id].status, terminal)
  assert.throws(() => transition(got, 'candidate', '2026-09-28T01:07:00.000Z'), /terminal/)
}
assert.throws(() => transition(lifecycle, 'candidate', '2026-09-28T01:06:00.000Z'), /transition/)

console.log('human-law-registry task2: evidence-gated lifecycle contract')


const promoteAccepted = (
  registry: ReturnType<typeof createHumanLawRegistry>,
  record: HumanLawRecord,
  suffix: string,
) => {
  let next = registerHumanLaw(registry, record).registry
  const steps = [
    ['candidate', []],
    ['reproduced', [`replication:${suffix}`]],
    ['mechanistically-supported', [`mechanism:${suffix}`]],
    ['externally-validated', [`external:${suffix}`]],
    ['accepted', [`review:${suffix}`]],
  ] as const
  for (let i = 0; i < steps.length; i++) {
    const [to, evidenceRefs] = steps[i]
    next = transitionHumanLaw(next, record.id, {
      to,
      changedAt: `2026-09-28T02:0${i}:00.000Z`,
      changedBy: 'reviewer:program-a',
      reason: `promote ${record.id} to ${to}`,
      evidenceRefs,
    })
  }
  return next
}

const lawV1 = law()
const lawV2 = law({
  id: 'law:recovery-latent-v2',
  version: '2.0.0',
  title: 'Candidate latent recovery constraint v2',
  provenance: {
    ...law().provenance,
    codeCommitSha: '1123456789abcdef0123456789abcdef01234567',
  },
})
const lawV3 = law({
  id: 'law:recovery-latent-v3',
  version: '3.0.0',
  title: 'Candidate latent recovery constraint v3',
  provenance: {
    ...law().provenance,
    codeCommitSha: '2123456789abcdef0123456789abcdef01234567',
  },
})

let supersession = createHumanLawRegistry()
supersession = promoteAccepted(supersession, lawV1, 'v1')
supersession = promoteAccepted(supersession, lawV2, 'v2')
const beforeSupersession = structuredClone(supersession)
supersession = supersedeHumanLaw(supersession, {
  lawId: lawV1.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'v2 reproduces externally and supersedes v1',
  evidenceRefs: ['external-validation:v2'],
})
assert.equal(supersession.lawsById[lawV1.id].status, 'superseded')
assert.equal(supersession.lawsById[lawV2.id].status, 'accepted')
assert.equal(supersession.supersededByLawId[lawV1.id], lawV2.id)
assert.deepEqual(getHumanLawLineage(supersession, lawV1.id), [lawV1.id, lawV2.id])
assert.equal(beforeSupersession.supersededByLawId[lawV1.id], undefined)

supersession = promoteAccepted(supersession, lawV3, 'v3')
supersession = supersedeHumanLaw(supersession, {
  lawId: lawV2.id,
  replacementLawId: lawV3.id,
  changedAt: '2026-09-28T02:11:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'v3 supersedes v2',
  evidenceRefs: ['external-validation:v3'],
})
assert.deepEqual(getHumanLawLineage(supersession, lawV1.id), [lawV1.id, lawV2.id, lawV3.id])

const acceptedPair = (() => {
  let registry = createHumanLawRegistry()
  registry = promoteAccepted(registry, lawV1, 'pair-v1')
  registry = promoteAccepted(registry, lawV2, 'pair-v2')
  return registry
})()

assert.throws(() => supersedeHumanLaw(acceptedPair, {
  lawId: 'missing',
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'x',
  evidenceRefs: ['e:1'],
}), /unknown law id/)
assert.throws(() => supersedeHumanLaw(acceptedPair, {
  lawId: lawV1.id,
  replacementLawId: 'missing',
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'x',
  evidenceRefs: ['e:1'],
}), /replacement/)
assert.throws(() => supersedeHumanLaw(acceptedPair, {
  lawId: lawV1.id,
  replacementLawId: lawV1.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'self',
  evidenceRefs: ['e:1'],
}), /itself/)

const generatedV2 = registerHumanLaw(createHumanLawRegistry(), lawV2).registry
const acceptedV1GeneratedV2 = promoteAccepted(generatedV2, lawV1, 'accepted-source')
assert.throws(() => supersedeHumanLaw(acceptedV1GeneratedV2, {
  lawId: lawV1.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'replacement not accepted',
  evidenceRefs: ['e:1'],
}), /replacement.*accepted/)
assert.throws(() => supersedeHumanLaw(generatedV2, {
  lawId: lawV2.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'source not accepted',
  evidenceRefs: ['e:1'],
}), /accepted|itself/)

for (const bad of [
  { changedBy: ' ', reason: 'x', evidenceRefs: ['e:1'] },
  { changedBy: 'reviewer:1', reason: ' ', evidenceRefs: ['e:1'] },
  { changedBy: 'reviewer:1', reason: 'x', evidenceRefs: [] },
  { changedBy: 'reviewer:1', reason: 'x', evidenceRefs: ['e:1', 'e:1'] },
] as const) {
  assert.throws(() => supersedeHumanLaw(acceptedPair, {
    lawId: lawV1.id,
    replacementLawId: lawV2.id,
    changedAt: '2026-09-28T02:10:00.000Z',
    ...bad,
  }), /changedBy|reason|evidence|duplicate/)
}

const onceSuperseded = supersedeHumanLaw(acceptedPair, {
  lawId: lawV1.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'first',
  evidenceRefs: ['e:1'],
})
assert.throws(() => supersedeHumanLaw(onceSuperseded, {
  lawId: lawV1.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:11:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'duplicate',
  evidenceRefs: ['e:2'],
}), /accepted|superseded|terminal/)

const cyclicGraph = {
  ...acceptedPair,
  supersededByLawId: {
    ...acceptedPair.supersededByLawId,
    [lawV2.id]: lawV1.id,
  },
}
assert.throws(() => supersedeHumanLaw(cyclicGraph, {
  lawId: lawV1.id,
  replacementLawId: lawV2.id,
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'would cycle',
  evidenceRefs: ['e:1'],
}), /cycle/)
assert.throws(() => getHumanLawLineage(acceptedPair, 'missing'), /unknown law id/)
const lineageCycle = {
  ...acceptedPair,
  supersededByLawId: {
    [lawV1.id]: lawV2.id,
    [lawV2.id]: lawV1.id,
  },
}
assert.throws(() => getHumanLawLineage(lineageCycle, lawV1.id), /cycle/)

const deprecated = transitionHumanLaw(acceptedPair, lawV1.id, {
  to: 'deprecated',
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'prospective evidence no longer supports use',
  evidenceRefs: ['counterexample:42'],
})
assert.equal(deprecated.lawsById[lawV1.id].status, 'deprecated')
assert.equal(deprecated.supersededByLawId[lawV1.id], undefined)

console.log('human-law-registry: provenance-complete lifecycle and reconstructable supersession verified')


/* Final review regression tests: supersession must always be reconstructable,
 * and ontology identity cannot be structurally empty. */
assert.throws(() => registerHumanLaw(createHumanLawRegistry(), law({
  id: 'law:empty-ontology-concepts',
  ontologyRefs: [{ namespace: 'panacea-human', version: '2026-09-28', conceptIds: [] }],
})), /conceptIds.*empty/)

assert.throws(() => transitionHumanLaw(acceptedPair, lawV1.id, {
  to: 'superseded',
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'must use dedicated supersession API',
  evidenceRefs: ['external-validation:v2'],
}), /supersedeHumanLaw/)

const orphanSuperseded = {
  ...acceptedPair,
  lawsById: {
    ...acceptedPair.lawsById,
    [lawV1.id]: { ...acceptedPair.lawsById[lawV1.id], status: 'superseded' as const },
  },
}
assert.throws(() => getHumanLawLineage(orphanSuperseded, lawV1.id), /missing supersession edge/)

console.log('human-law-registry final review: ontology identity and supersession integrity')
