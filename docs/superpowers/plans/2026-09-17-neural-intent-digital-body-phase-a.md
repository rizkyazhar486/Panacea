# Neural Intent → Digital Body Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a device-independent, fail-closed IntentEvent kernel that distinguishes explicit intent, observed movement, decoded candidate intent and simulation before any UI or longitudinal wiring is added.

**Architecture:** Keep the domain model and validation pure in `src/lib/neuralIntent.ts`. Put source-specific constructors/adapters in `src/lib/neuralIntentAdapters.ts` so future voice, motion, rehab and BCI integrations can change without changing the event contract. Repository tests under `scripts/uji/` prove semantic/safety invariants and are auto-discovered by `npm run uji`.

**Tech Stack:** TypeScript 5.5+, Node 24 native TypeScript test harness, Vite/React repository build. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-09-17-neural-intent-digital-body-design.md`

## Global Constraints

- Do not edit `BodyExposureOS.tsx`, `panaceaLongitudinalState.ts`, or active Body/longitudinal files in Phase A.
- Do not create a new top-level page or route.
- Do not edit `CLAUDE.md`; PR #1747 owns that continuation queue.
- User-facing strings are English-first; this phase introduces no new user-facing UI.
- Simulation must never qualify for clinical or AI patient context.
- Observed movement must never be promoted to intended movement.
- BCI events require an explicit decoder source ID and decoder version.
- Confidence is a display-quality indicator only, never a clinical probability.
- No new npm dependency.
- No direct `main` write; short-lived branch + PR + exact-head gates only.

---

### Task 1: Define the source-independent IntentEvent contract

**Files:**
- Create: `src/lib/neuralIntent.ts`
- Create: `scripts/uji/neural-intent-kernel.mts`

**Interfaces:**
- Produces: `IntentSourceKind`, `IntentEvidenceClass`, `IntentAction`, `IntentEffector`, `IntentPurpose`, `IntentSource`, `IntentConsent`, `IntentEvent`, `DigitalBodyIntentProjection`.
- Produces: `validateIntentEvent(event: IntentEvent): true`.
- Produces: `isIntentConsentActive(consent: IntentConsent, purpose: IntentPurpose, atMs?: number): boolean`.
- Produces: `canProjectIntent(event: IntentEvent, purpose: IntentPurpose, atMs?: number): boolean`.
- Consumes: no app/runtime state.

- [ ] **Step 1: Write the failing contract test**

Create `scripts/uji/neural-intent-kernel.mts` with explicit RED assertions that import the not-yet-existing module and require:

```ts
import assert from 'node:assert/strict'
import {
  canProjectIntent,
  validateIntentEvent,
  type IntentEvent,
} from '../../src/lib/neuralIntent'

const base: IntentEvent = {
  id: 'intent-1',
  subjectId: 'subject-1',
  action: 'reach',
  effector: 'right-upper-limb',
  evidenceClass: 'explicit',
  source: {
    kind: 'explicit-touch',
    sourceId: 'touch-ui',
    method: 'direct-selection',
  },
  capturedAt: '2026-09-17T10:00:00.000Z',
  receivedAt: '2026-09-17T10:00:00.100Z',
  consent: {
    granted: true,
    purposes: ['personal-visualization'],
    grantedAt: '2026-09-17T09:00:00.000Z',
  },
  status: 'confirmed',
  tags: [],
}

assert.equal(validateIntentEvent(base), true)
assert.equal(canProjectIntent(base, 'personal-visualization'), true)
assert.throws(
  () => validateIntentEvent({ ...base, evidenceClass: 'decoded' }),
  /source.*evidence/i,
)
```

Also require blank IDs/source IDs, invalid timestamps, `capturedAt > receivedAt`, invalid consent dates, and `custom` without `customLabel` to throw.

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/neural-intent-kernel.mts
```

Expected: FAIL because `src/lib/neuralIntent.ts` does not exist.

- [ ] **Step 3: Implement minimal domain types and fail-closed validation**

Create `src/lib/neuralIntent.ts` with:

```ts
export type IntentSourceKind =
  | 'explicit-touch'
  | 'voice-aac'
  | 'motion-observation'
  | 'rehab-task'
  | 'bci-decoder'
  | 'simulation'

export type IntentEvidenceClass = 'explicit' | 'observed' | 'decoded' | 'simulated'

export type IntentAction =
  | 'communicate'
  | 'speak'
  | 'gesture'
  | 'reach'
  | 'grasp'
  | 'release'
  | 'point'
  | 'nod'
  | 'turn-head'
  | 'move-upper-limb'
  | 'move-lower-limb'
  | 'custom'

export type IntentEffector =
  | 'speech-orofacial'
  | 'head-neck'
  | 'left-upper-limb'
  | 'right-upper-limb'
  | 'bilateral-upper-limb'
  | 'left-lower-limb'
  | 'right-lower-limb'
  | 'bilateral-lower-limb'
  | 'whole-body'
  | 'other'

export type IntentPurpose =
  | 'personal-visualization'
  | 'rehab-tracking'
  | 'clinical-support'
  | 'ai-context'
```

Add strict source/evidence compatibility table:

```ts
const EVIDENCE_BY_SOURCE: Readonly<Record<IntentSourceKind, readonly IntentEvidenceClass[]>> = {
  'explicit-touch': ['explicit'],
  'voice-aac': ['explicit'],
  'motion-observation': ['observed'],
  'rehab-task': ['explicit', 'observed'],
  'bci-decoder': ['decoded'],
  simulation: ['simulated'],
}
```

Validation must reject any mismatched pair rather than normalizing it.

`canProjectIntent` rules:

```ts
if (event.status === 'rejected') return false
if (!isIntentConsentActive(event.consent, purpose, atMs)) return false
if (event.evidenceClass === 'simulated' && (purpose === 'clinical-support' || purpose === 'ai-context')) return false
return true
```

Do not convert `candidate` to `confirmed` here.

- [ ] **Step 4: Run the targeted test and verify GREEN**

Run the same targeted command. Expected: PASS with a deterministic success message.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/neuralIntent.ts scripts/uji/neural-intent-kernel.mts
git commit -m "feat(neural-intent): add fail-closed event contract"
```

---

### Task 2: Add confidence/freshness calculation and Digital Body projection

**Files:**
- Modify: `src/lib/neuralIntent.ts`
- Modify: `scripts/uji/neural-intent-kernel.mts`

**Interfaces:**
- Consumes: `IntentEvent` from Task 1.
- Produces: `computeIntentDisplayConfidence(input): number`.
- Produces: `projectIntentToDigitalBody(event: IntentEvent, purpose?: IntentPurpose, atMs?: number): DigitalBodyIntentProjection | null`.

- [ ] **Step 1: Add failing formula tests**

Require:

```ts
assert.equal(
  computeIntentDisplayConfidence({
    sourceConfidence: 0.8,
    signalQuality: 0.5,
    capturedAtMs: 0,
    evaluatedAtMs: 1_000,
    freshnessTauMs: 1_000,
  }),
  0.8 * 0.5 * Math.exp(-1),
)
```

Use an epsilon comparison (`Math.abs(actual - expected) < 1e-12`). Add rejection cases for non-finite/out-of-range source confidence, non-finite/out-of-range signal quality, negative age, and `freshnessTauMs <= 0`.

Add projection assertions:

- explicit → `state: 'intended'`;
- observed → `state: 'observed'`;
- decoded → `state: 'decoded-candidate'` even if caller labels it confirmed;
- simulation → `state: 'simulated'`;
- rejected or consent-blocked → `null`;
- no fabricated confidence for explicit input when the event has none.

- [ ] **Step 2: Run targeted test and verify RED**

Expected: FAIL because the new functions are not exported.

- [ ] **Step 3: Implement formula exactly**

Implement:

```ts
export function computeIntentDisplayConfidence(input: {
  sourceConfidence: number
  signalQuality: number
  capturedAtMs: number
  evaluatedAtMs: number
  freshnessTauMs: number
}) {
  // validate each input before multiplication
  const freshness = Math.exp(-(input.evaluatedAtMs - input.capturedAtMs) / input.freshnessTauMs)
  return Math.min(1, Math.max(0, input.sourceConfidence * input.signalQuality * freshness))
}
```

Do not clamp invalid input into apparently valid data.

- [ ] **Step 4: Implement projection mapping**

Use evidence class as the state authority:

```ts
const stateByEvidence = {
  explicit: 'intended',
  observed: 'observed',
  decoded: 'decoded-candidate',
  simulated: 'simulated',
} as const
```

`projectIntentToDigitalBody` must call `canProjectIntent` first and return only source-independent fields required by the body renderer.

- [ ] **Step 5: Run targeted test and verify GREEN**

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/lib/neuralIntent.ts scripts/uji/neural-intent-kernel.mts
git commit -m "feat(neural-intent): add confidence and body projection"
```

---

### Task 3: Add source adapters without inventing neural data

**Files:**
- Create: `src/lib/neuralIntentAdapters.ts`
- Create: `scripts/uji/neural-intent-adapters.mts`

**Interfaces:**
- Consumes: Task 1/2 domain types and `validateIntentEvent`.
- Produces: `createExplicitIntentEvent(input): IntentEvent`.
- Produces: `createObservedMotionEvent(input): IntentEvent`.
- Produces: `createDecodedBciIntentEvent(input): IntentEvent`.
- Produces: `createSimulatedIntentEvent(input): IntentEvent`.

- [ ] **Step 1: Write the failing adapter test**

Require these invariants:

```ts
const explicit = createExplicitIntentEvent({ ... })
assert.equal(explicit.evidenceClass, 'explicit')
assert.equal(explicit.status, 'confirmed')

const observed = createObservedMotionEvent({ ... })
assert.equal(observed.evidenceClass, 'observed')
assert.equal(observed.status, 'candidate')

assert.throws(
  () => createDecodedBciIntentEvent({
    ...validBciInput,
    decoderVersion: '',
  }),
  /decoderVersion/i,
)

const bci = createDecodedBciIntentEvent(validBciInput)
assert.equal(bci.evidenceClass, 'decoded')
assert.equal(bci.status, 'candidate')

const demo = createSimulatedIntentEvent({ ... })
assert.equal(canProjectIntent(demo, 'clinical-support'), false)
assert.equal(canProjectIntent(demo, 'ai-context'), false)
```

Also mutate the original input arrays/objects after construction and verify the returned event does not change.

- [ ] **Step 2: Run targeted adapter test and verify RED**

Run:

```bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/neural-intent-adapters.mts
```

Expected: FAIL because the adapter module does not exist.

- [ ] **Step 3: Implement explicit and observed adapters**

Explicit adapter must create only `explicit-touch`, `voice-aac` or explicit `rehab-task` events. Observed adapter must create only `motion-observation` or observed `rehab-task` events. Both call `validateIntentEvent` before returning.

- [ ] **Step 4: Implement strict BCI adapter**

`createDecodedBciIntentEvent` requires all of:

```ts
sourceId: string
sourceVersion: string
decoderId: string
decoderVersion: string
decoderConfidence: number
signalQuality: number
```

The adapter sets `source.kind = 'bci-decoder'`, `evidenceClass = 'decoded'`, `status = 'candidate'` and never accepts caller overrides for those fields.

- [ ] **Step 5: Implement simulation adapter and immutable snapshots**

Simulation always emits `source.kind = 'simulation'`, `evidenceClass = 'simulated'`, `status = 'candidate'`.

Clone nested source/consent/tags and freeze the final event plus nested objects/arrays:

```ts
Object.freeze(event.tags)
Object.freeze(event.source)
Object.freeze(event.consent.purposes)
Object.freeze(event.consent)
return Object.freeze(event)
```

- [ ] **Step 6: Run both targeted tests and verify GREEN**

Run both kernel and adapter test files directly. Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/lib/neuralIntentAdapters.ts scripts/uji/neural-intent-adapters.mts
git commit -m "feat(neural-intent): add safe source adapters"
```

---

### Task 4: Phase A repository verification

**Files:**
- No new production files unless verification exposes a concrete defect.

**Interfaces:**
- Consumes all Phase A outputs.
- Produces merge-readiness evidence only; does not add Phase B wiring.

- [ ] **Step 1: Run both targeted tests**

```bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/neural-intent-kernel.mts
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/neural-intent-adapters.mts
```

Expected: both PASS.

- [ ] **Step 2: Run the repository deterministic suite**

```bash
npm run uji
```

Expected: all discovered `.mts` test files pass. If a pre-existing baseline failure appears, prove it exists on latest `main` before attributing it to this branch; do not weaken the test.

- [ ] **Step 3: Run TypeScript and production build**

```bash
npx tsc -b
npm run build
```

Expected: clean TypeScript build and Vite production build.

- [ ] **Step 4: Open one PR from the short-lived branch**

PR body must state:

- Phase A only;
- no Body/UI/longitudinal changes;
- scientific reference DOI and proof-of-concept limitation;
- exact head SHA;
- targeted and repository test evidence;
- explicit dependency on the settled longitudinal/Body lanes for Phase B/C.

- [ ] **Step 5: Require exact-head CI**

Before merge require:

- Validate pull requests — success on exact head;
- complete Stabilization Acceptance — success on exact head;
- any other required repository checks triggered for the PR.

- [ ] **Step 6: Final race/overlap audit**

Immediately before merge:

1. resolve latest `main`;
2. confirm the PR head is unchanged from tested head;
3. confirm mergeability;
4. compare changed files against active PRs/newly merged work;
5. if overlap or ancestry is uncertain, refresh from latest `main` and rerun gates;
6. never force merge.

---

## Deferred work — separate follow-on plans

Do not silently expand Phase A to include these.

### Phase B: Intent → canonical longitudinal state

Start only after the longitudinal foundation is authoritative on `main`. Reuse its event, provenance, consent, clinician-review and AI-context policy rather than adding another store.

### Phase C: Neural/Intent workspace inside Your Body

Start only after Body stabilization is authoritative on `main`. Mount into the existing shared body, not a new top-level route. Verify persistent text labels for intended/observed/decoded/simulated states, reduced motion, 390×844 layout, and existing Body/WebGL render gates.
