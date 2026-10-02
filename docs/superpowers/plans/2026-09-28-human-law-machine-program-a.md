# Human Law Machine Program A — Law Registry & Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build the first executable Human Law Machine slice: an immutable, provenance-complete registry for generated scientific laws with evidence-gated lifecycle transitions and reconstructable supersession/deprecation history.

**Architecture:** Add one isolated registry under \`src/lib/humanLaw/\` that follows Panacea's existing immutable-registry patterns in \`physiology/runtime.ts\`, \`realityErrorLedger.ts\`, and \`realityGapRegistry.ts\`. It stores model-generated scientific candidates only; it does not modify Canonical Patient State, execute equations, infer diagnoses, or promote candidate laws into clinical truth.

**Tech Stack:** TypeScript 5.5+, Node 24 native TypeScript test runner used by \`scripts/uji/jalankan.mjs\`, existing immutable object/record patterns, no new dependencies.

**Spec:** \`docs/superpowers/specs/2026-09-28-panacea-human-law-machine-design.md\`

## Global Constraints

- Preserve: **"Hallucinate hypotheses aggressively. Hallucinate reality never."**
- Candidate scientific concepts must remain explicitly distinct from accepted biomedical concepts.
- A candidate law with missing provenance cannot be promoted.
- Individual-specific laws cannot become universal laws through this registry; cross-person promotion belongs to later Program G.
- No registry transition may write to Canonical Patient State or physiological runtime state.
- Failed, deprecated, rejected, and superseded laws remain reconstructable.
- All registry updates are immutable and deterministic.
- No new runtime dependency.
- TDD is mandatory: every behavior is first observed failing, then implemented minimally.
- \`npm run uji\` and \`npm run build\` must pass before completion.

## File Structure

- Create: \`src/lib/humanLaw/lawRegistry.ts\`
  - Owns Program A types, validation, immutable registry insertion, lifecycle transitions, deprecation, supersession graph, and lineage queries.
  - Does **not** execute equations or score candidate laws.
- Create: \`scripts/uji/human-law-registry.mts\`
  - Runtime acceptance coverage for registration, provenance fail-closed behavior, lifecycle legality, terminal states, supersession, cycle prevention, deterministic replay, and immutability.
- No change required to \`scripts/uji/jalankan.mjs\`; it auto-discovers every \`.mts\` file in \`scripts/uji/\`.

## Review Focus

1. **Conflicting duplicate law ID** — identical replay must be idempotent, but the same ID with changed content must fail closed. Covered in Task 1.
2. **Missing/blank provenance or ontology references** — registration must reject incomplete scientific identity instead of creating an untraceable law. Covered in Task 1.
3. **Illegal lifecycle jumps / evidence-free promotion** — a generated law cannot jump directly to accepted, and promotion beyond candidate requires explicit evidence refs. Covered in Task 2.
4. **Terminal-state mutation** — rejected, deprecated, unresolved, context-specific, superseded, or scope-restricted records cannot silently re-enter the promotion chain. Covered in Task 2.
5. **Supersession corruption** — self-supersession, missing replacement, non-accepted replacement, or lineage cycles must fail closed. Covered in Task 3.

---

### Task 1: Immutable Candidate-Law Registry and Provenance Contract

**Files:**
- Create: \`src/lib/humanLaw/lawRegistry.ts\`
- Create: \`scripts/uji/human-law-registry.mts\`

**Interfaces:**
- Consumes: no new Program A interfaces.
- Produces:
  - \`HumanLawStatus\`
  - \`HumanLawScope\`
  - \`HumanLawOntologyRef\`
  - \`HumanLawEvidenceBundle\`
  - \`HumanLawProvenance\`
  - \`HumanLawRecord\`
  - \`HumanLawRegistry\`
  - \`createHumanLawRegistry() -> HumanLawRegistry\`
  - \`registerHumanLaw(registry: HumanLawRegistry, law: HumanLawRecord) -> { registry: HumanLawRegistry; status: 'inserted' | 'duplicate' }\`

- [ ] **Step 1: Write the failing registration tests**

In \`scripts/uji/human-law-registry.mts\`, define a fixture whose required shape is:

~~~ts
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
~~~

Assert:

~~~ts
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

assert.throws(
  () => registerHumanLaw(inserted.registry, law({ title: 'changed' })),
  /conflicting law id/,
)
~~~

Add fail-closed assertions for:
- blank \`id\`, \`version\`, \`title\`, \`expression\`, \`population\`;
- initial \`status !== 'generated'\`;
- \`scope: 'individual'\` without \`subjectId\`;
- \`scope !== 'individual'\` with a \`subjectId\`;
- empty \`ontologyRefs\`;
- blank ontology namespace/version/concept ID;
- blank provenance creator ID;
- invalid \`createdAt\`;
- \`codeCommitSha\` not exactly 40 hexadecimal characters;
- duplicate or blank IDs inside every reference array;
- non-finite/non-string unit map values must be impossible by type or rejected if coerced through \`as never\`.

- [ ] **Step 2: Run the test and verify RED**

Run:

~~~bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/human-law-registry.mts
~~~

Expected: FAIL because \`src/lib/humanLaw/lawRegistry.ts\` does not exist.

- [ ] **Step 3: Implement the Program A data contract and registration path**

In \`src/lib/humanLaw/lawRegistry.ts\`, define exactly these status and scope unions:

~~~ts
export type HumanLawStatus =
  | 'generated'
  | 'candidate'
  | 'reproduced'
  | 'mechanistically-supported'
  | 'externally-validated'
  | 'accepted'
  | 'rejected'
  | 'deprecated'
  | 'unresolved'
  | 'context-specific'
  | 'superseded'
  | 'scope-restricted'

export type HumanLawScope = 'individual' | 'subpopulation' | 'universal'
~~~

Define the fixture-compatible interfaces from Step 1 plus:

~~~ts
export interface HumanLawStatusEvent {
  from: HumanLawStatus | null
  to: HumanLawStatus
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}

export interface HumanLawRegistry {
  revision: number
  lawsById: Readonly<Record<string, HumanLawRecord>>
  statusHistoryByLawId: Readonly<Record<string, readonly HumanLawStatusEvent[]>>
  supersededByLawId: Readonly<Record<string, string>>
}
~~~

Implementation requirements:

- normalize/trim scalar identifiers without mutating the input object;
- preserve reference-array order after de-duplication only if first occurrence wins; reject blank entries;
- registration only accepts \`status: 'generated'\`;
- the initial status-history event is:
  - \`from: null\`
  - \`to: 'generated'\`
  - \`changedAt: law.provenance.createdAt\`
  - \`changedBy: law.provenance.createdBy.id\`
  - \`reason: 'registered'\`
  - \`evidenceRefs: []\`
- identical replay returns \`duplicate\` without incrementing revision;
- conflicting same-ID content throws \`conflicting law id <id>\`.

- [ ] **Step 4: Run the registration test and verify GREEN**

Run the same direct Node command.

Expected: Task 1 assertions PASS and console reaches \`human-law-registry task1: immutable registration and provenance contract\`.

- [ ] **Step 5: Commit**

~~~bash
git add src/lib/humanLaw/lawRegistry.ts scripts/uji/human-law-registry.mts
git commit -m "feat(human-law): add provenance-complete law registry"
~~~

---

### Task 2: Evidence-Gated Scientific Lifecycle

**Files:**
- Modify: \`src/lib/humanLaw/lawRegistry.ts\`
- Modify: \`scripts/uji/human-law-registry.mts\`

**Interfaces:**
- Consumes:
  - \`HumanLawRegistry\`
  - \`HumanLawStatus\`
  - \`HumanLawStatusEvent\`
- Produces:
  - \`HumanLawTransitionInput\`
  - \`transitionHumanLaw(registry: HumanLawRegistry, lawId: string, input: HumanLawTransitionInput) -> HumanLawRegistry\`

Define:

~~~ts
export interface HumanLawTransitionInput {
  to: HumanLawStatus
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}
~~~

- [ ] **Step 1: Add failing lifecycle tests**

Add a helper that registers one generated law, then assert the only forward scientific promotion chain is:

~~~text
generated
-> candidate
-> reproduced
-> mechanistically-supported
-> externally-validated
-> accepted
~~~

Test:

~~~ts
let lifecycle = registerHumanLaw(createHumanLawRegistry(), law()).registry

lifecycle = transitionHumanLaw(lifecycle, law().id, {
  to: 'candidate',
  changedAt: '2026-09-28T01:01:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'candidate selected for evaluation',
  evidenceRefs: [],
})

lifecycle = transitionHumanLaw(lifecycle, law().id, {
  to: 'reproduced',
  changedAt: '2026-09-28T01:02:00.000Z',
  changedBy: 'workflow:replication',
  reason: 'independent replay reproduced the effect',
  evidenceRefs: ['replication:1'],
})

assert.equal(lifecycle.lawsById[law().id].status, 'reproduced')
assert.equal(lifecycle.statusHistoryByLawId[law().id].length, 3)
~~~

Continue through \`accepted\`, using at least one nonblank \`evidenceRefs\` entry for every transition from \`candidate -> reproduced\` onward.

Assert failures for:
- unknown law ID;
- blank \`changedBy\` or \`reason\`;
- invalid or backward \`changedAt\`;
- skipping \`generated -> accepted\`;
- skipping any intermediate promotion state;
- promotion beyond \`candidate\` with empty \`evidenceRefs\`;
- duplicate/blank evidence refs;
- same-state transition;
- any transition out of \`rejected\`, \`deprecated\`, \`unresolved\`, \`context-specific\`, \`superseded\`, or \`scope-restricted\`;
- \`accepted -> candidate\`.

For alternate terminal states, explicitly test that:
- any non-terminal pre-accepted status may move to \`rejected\`, \`unresolved\`, \`context-specific\`, or \`scope-restricted\`;
- \`accepted\` may move only to \`deprecated\`, \`superseded\`, or \`scope-restricted\`.

- [ ] **Step 2: Run the test and verify RED**

Run the direct Node command.

Expected: FAIL because \`transitionHumanLaw\` is missing.

- [ ] **Step 3: Implement the lifecycle state machine**

Implement \`transitionHumanLaw\` with an explicit allowed-transition map, not ordinal comparisons.

Rules:

- \`candidate\` may be reached from \`generated\` without evidence refs;
- \`reproduced\`, \`mechanistically-supported\`, \`externally-validated\`, and \`accepted\` require at least one evidence ref;
- terminal states are immutable in Program A;
- a transition timestamp must be >= the latest status-history timestamp;
- every transition returns a new registry and new law record; original registry and record remain byte-for-byte unchanged;
- revision increments exactly once per successful transition.

- [ ] **Step 4: Run lifecycle tests and verify GREEN**

Expected: Task 1 and Task 2 assertions PASS.

- [ ] **Step 5: Commit**

~~~bash
git add src/lib/humanLaw/lawRegistry.ts scripts/uji/human-law-registry.mts
git commit -m "feat(human-law): enforce evidence-gated law lifecycle"
~~~

---

### Task 3: Supersession, Deprecation, and Reconstructable Law Lineage

**Files:**
- Modify: \`src/lib/humanLaw/lawRegistry.ts\`
- Modify: \`scripts/uji/human-law-registry.mts\`

**Interfaces:**
- Consumes:
  - \`HumanLawRegistry\`
  - \`transitionHumanLaw(...)\`
- Produces:
  - \`HumanLawSupersessionInput\`
  - \`supersedeHumanLaw(registry: HumanLawRegistry, input: HumanLawSupersessionInput) -> HumanLawRegistry\`
  - \`getHumanLawLineage(registry: HumanLawRegistry, lawId: string) -> readonly string[]\`

Define:

~~~ts
export interface HumanLawSupersessionInput {
  lawId: string
  replacementLawId: string
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}
~~~

- [ ] **Step 1: Add failing supersession tests**

Create two law records with different IDs and progress both through the legal lifecycle to \`accepted\`.

Assert:

~~~ts
const before = structuredClone(registry)

const superseded = supersedeHumanLaw(registry, {
  lawId: 'law:recovery-latent-v1',
  replacementLawId: 'law:recovery-latent-v2',
  changedAt: '2026-09-28T02:00:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'v2 reproduces externally and supersedes v1',
  evidenceRefs: ['external-validation:v2'],
})

assert.equal(superseded.lawsById['law:recovery-latent-v1'].status, 'superseded')
assert.equal(
  superseded.supersededByLawId['law:recovery-latent-v1'],
  'law:recovery-latent-v2',
)
assert.deepEqual(
  getHumanLawLineage(superseded, 'law:recovery-latent-v1'),
  ['law:recovery-latent-v1', 'law:recovery-latent-v2'],
)
assert.equal(before.supersededByLawId['law:recovery-latent-v1'], undefined)
~~~

Add a three-version chain and assert deterministic lineage:

~~~ts
assert.deepEqual(
  getHumanLawLineage(registryV3, 'law:recovery-latent-v1'),
  [
    'law:recovery-latent-v1',
    'law:recovery-latent-v2',
    'law:recovery-latent-v3',
  ],
)
~~~

Assert failures for:
- unknown source/replacement;
- source === replacement;
- source not \`accepted\`;
- replacement not \`accepted\`;
- blank reason/actor/evidence refs;
- empty evidence refs;
- duplicate supersession of an already superseded law;
- any operation that would create a lineage cycle;
- lineage query for unknown law;
- manually corrupted \`supersededByLawId\` cycle detected by \`getHumanLawLineage\`.

Also assert that ordinary deprecation uses the Task 2 transition:

~~~ts
const deprecated = transitionHumanLaw(acceptedRegistry, acceptedId, {
  to: 'deprecated',
  changedAt: '2026-09-28T02:10:00.000Z',
  changedBy: 'reviewer:1',
  reason: 'prospective evidence no longer supports use',
  evidenceRefs: ['counterexample:42'],
})
assert.equal(deprecated.lawsById[acceptedId].status, 'deprecated')
assert.equal(deprecated.supersededByLawId[acceptedId], undefined)
~~~

- [ ] **Step 2: Run the test and verify RED**

Expected: FAIL because supersession interfaces are missing.

- [ ] **Step 3: Implement supersession and lineage**

Requirements:

- supersession is allowed only from one \`accepted\` record to another \`accepted\` record;
- call the same lifecycle validation semantics used by \`transitionHumanLaw\` to produce the source law's \`superseded\` status event;
- add one \`supersededByLawId[source] = replacement\` edge;
- before writing the edge, walk from replacement through existing supersession edges; if source appears, throw \`supersession cycle\`;
- \`getHumanLawLineage\` returns \`[lawId, ...successors]\`;
- if existing graph data contains a cycle, lineage query throws instead of hanging;
- no replacement record is mutated;
- revision increments exactly once for the supersession operation.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the direct Node command.

Expected: all Program A assertions PASS and final console line:
\`human-law-registry: provenance-complete lifecycle and reconstructable supersession verified\`.

- [ ] **Step 5: Run the complete repository test suite**

Run:

~~~bash
npm run uji
~~~

Expected: every \`scripts/uji/*.mts\` test file passes, including \`human-law-registry.mts\`.

- [ ] **Step 6: Run the production build**

Run:

~~~bash
npm run build
~~~

Expected: exit code 0 with TypeScript and Vite build successful.

- [ ] **Step 7: Commit**

~~~bash
git add src/lib/humanLaw/lawRegistry.ts scripts/uji/human-law-registry.mts
git commit -m "feat(human-law): preserve law mortality and supersession lineage"
~~~

---

## Program A Completion Evidence

Before claiming Program A complete, report:

- exact final commit SHA;
- \`npm run uji\` result and test-file count;
- \`npm run build\` exit status;
- the exact public interfaces created;
- confirmation that no Canonical Patient State or physiological runtime mutation path was added;
- confirmation that accepted-law promotion requires the sequential evidence-gated lifecycle;
- confirmation that superseded/deprecated/rejected laws remain reconstructable.

Program B — Residual Intelligence — must not begin until Program A is verified on the current main head or a concrete blocker is recorded.
