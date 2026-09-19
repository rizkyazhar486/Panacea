# PANACEA PRIME Wisdom Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a provenance-first PRIME Wisdom Fabric that converts public/licensed primary material, books, interviews, podcasts, historical documents, religious texts, and evidence-linked expert education into structured, attributable, conflict-aware guidance for PANACEA PRIME without treating opinions, quotations, or worldview claims as clinical truth.

**Architecture:** Extend the existing Source Registry contract rather than creating a parallel trust system. Sources are normalized into `PrimeWisdomUnit` records with exact provenance, source class, domain tags, evidence role, copyright/redistribution policy, contradiction links, and worldview metadata; PRIME retrieves these units contextually after clinical and mental-health safety gates, while a deterministic router prevents lower-authority lifestyle content from overriding scientific/clinical evidence. Runtime ingestion is adapter-based and fail-closed; copyrighted sources are summarized and indexed rather than copied unless Panacea has explicit rights.

**Tech Stack:** TypeScript, React, existing Panacea Source Registry JSON/schema/validators, deterministic Node QA scripts, existing PRIME domain model, existing Academic Accuracy Gate, optional server-side retrieval/vector adapter in a later slice.

**Spec:** `docs/superpowers/specs/2026-09-17-panacea-prime-human-potential-design.md`

## Global Constraints

- PRIME remains a cross-product orchestration layer, not a fourth top-level page.
- User-defined values remain authoritative for non-clinical priorities; PRIME may expose trade-offs but must not replace user values.
- Clinical and mental-health safety pathways always outrank performance, discipline, wealth, worldview, or motivational content.
- No podcast, book, interview, founder anecdote, religious commentary, or historical quote may be represented as clinical evidence unless independently supported by an appropriate scientific/clinical source.
- Preserve source identity, publication/episode date, locator, transformation history, and license/copyright state through every derived unit.
- Do not scrape, copy, or redistribute paywalled/premium transcripts or copyrighted books without explicit rights. Prefer public metadata, public primary sources, licensed feeds, user-provided lawful material, and original paraphrased summaries with source locators.
- Religious/worldview material is opt-in and must preserve canonical-text vs commentary vs translation vs modern interpretation boundaries.
- Qur'an, hadith, sirah/history, scholarly interpretation, and modern paraphrase must remain distinct source classes; hadith records require collection/reference and authenticity/status metadata when known.
- Buddhist canonical discourse, later commentary, and modern mindfulness interpretations must remain distinguishable.
- Torah/Biblical primary text, later commentary/tradition, and internet quotations must remain distinguishable.
- Political/geopolitical claims from interview sources remain attributed claims; they must not become user-specific political persuasion or unlabeled fact.
- PRIME retrieval scores are ranking heuristics only, never truth scores, clinical confidence scores, moral scores, or rankings of people.
- No shame mechanics, gambling-like reinforcement, coercion, ruin-risk finance prompts, sleep restriction, unsafe overtraining, or compulsive “push harder” behavior.
- Recovery/protect may override EDGE challenge when the current constraint is recovery, clinical, or safety-related.
- Existing repository rules remain binding: no direct push to `main`, no force merge, exact-head validation, full Stabilization Acceptance, overlap/ancestry audit before merge.

---

## File Structure

The implementation should converge around a small set of focused modules rather than placing knowledge logic in React pages.

**Create**
- `src/lib/prime/wisdom/types.ts` — normalized PRIME Wisdom domain types only.
- `src/lib/prime/wisdom/policy.ts` — deterministic authority/safety/worldview/copyright routing rules.
- `src/lib/prime/wisdom/retrieve.ts` — deterministic candidate filtering and ranking over normalized units.
- `src/lib/prime/wisdom/conflicts.ts` — agreement/contradiction graph helpers.
- `src/lib/prime/wisdom/index.ts` — public exports for the Wisdom Fabric.
- `data/prime-wisdom/source-catalog.json` — source identities and ingestion policy; no copied transcripts/books.
- `data/prime-wisdom/seed-units.json` — small hand-audited fixture corpus used for product/tests, not an exhaustive copyrighted corpus.
- `scripts/qa/prime-wisdom-schema.test.mjs` — deterministic normalized-record tests.
- `scripts/qa/prime-wisdom-policy.test.mjs` — authority, safety, worldview and copyright invariants.
- `scripts/qa/prime-wisdom-retrieval.test.mjs` — context retrieval and contradiction tests.
- `scripts/qa/prime-wisdom-provenance.test.mjs` — source locator/provenance preservation tests.
- `scripts/qa/prime-wisdom-ui.test.mjs` — visual-first/provenance disclosure contract tests once UI is wired.
- `server/src/prime-wisdom/adapterTypes.ts` — server-only ingestion adapter contract for future external sources.
- `server/src/prime-wisdom/normalize.ts` — normalization from adapter payloads into Panacea units.
- `server/src/prime-wisdom/copyrightGate.ts` — fail-closed ingestion policy for verbatim/full-text retention.

**Modify**
- `docs/superpowers/specs/2026-09-17-panacea-prime-human-potential-design.md` — append approved Wisdom Fabric architecture and source-class rules.
- `data/source-registry/README.md` — add PRIME Wisdom examples without weakening existing licensing semantics.
- source-registry schema/catalog files that currently define valid categories — add a bounded `wisdom`/`reference-knowledge` category only if the existing schema requires explicit enumeration.
- `package.json` — add focused Wisdom QA commands and include them in the existing production build gate only after deterministic tests are stable.
- existing PRIME orchestration module(s) introduced by the main PRIME implementation — consume Wisdom Fabric through `src/lib/prime/wisdom/index.ts`; do not duplicate retrieval logic.
- the existing For You/PRIME surface selected during implementation — add provenance-aware contextual lens UI using the repository’s visual-first/progressive-disclosure rules.

---

### Task 1: Extend the PRIME design specification with the approved Wisdom Fabric

**Files:**
- Modify: `docs/superpowers/specs/2026-09-17-panacea-prime-human-potential-design.md`

**Interfaces:**
- Consumes: existing seven PRIME domains, Constraint Detector, PRIME↔EDGE arbitration, worldview layer, clinical/mental-health precedence.
- Produces: normative product contract for all later tasks in this plan.

- [ ] **Step 1: Add a `PRIME Wisdom Fabric` section to the spec**

Add the following architecture and invariants in prose and diagrams:

```text
source universe
  -> Source Registry / rights gate
  -> adapter / ingestion
  -> normalized PrimeWisdomUnit
  -> evidence + conflict graph
  -> safety/worldview/context router
  -> PRIME constraint context
  -> optional lens / action / reflection
  -> outcome + longitudinal learning
```

Define the source classes explicitly:

```ts
type PrimeWisdomSourceClass =
  | 'scientific_evidence'
  | 'clinical_guideline'
  | 'expert_education'
  | 'primary_historical_document'
  | 'religious_canon'
  | 'religious_report'
  | 'religious_commentary'
  | 'book'
  | 'interview'
  | 'podcast'
  | 'personal_experience'
  | 'opinion'
  | 'contested_claim';
```

Document that Huberman/health podcast material requires independent evidence linkage before it influences health guidance; business/founder sources are perspective/case-study material; worldview material is optional; contested geopolitical material remains attributed.

- [ ] **Step 2: Add copyright and licensing boundaries**

Document verbatim-retention policy:

```text
PUBLIC/VERIFIED RIGHTS -> retain only what terms allow
LICENSED                -> retain per contract
USER-PROVIDED LAWFUL    -> process within user scope
COPYRIGHTED BOOK/PODCAST/PREMIUM TRANSCRIPT WITHOUT RIGHTS
                         -> metadata + locator + original paraphrase only
UNKNOWN RIGHTS           -> fail closed for full-text retention
```

- [ ] **Step 3: Add contradiction-preservation requirements**

Require PRIME to preserve disagreement rather than average it into one doctrine. Include contextual examples for `push` versus `recover`, wealth risk versus resilience, and secular versus opt-in worldview lenses.

- [ ] **Step 4: Self-review the spec amendment**

Verify the amendment does not create a universal definition of success, does not demote Clinical/safety, and does not turn worldview material into scientific evidence.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-17-panacea-prime-human-potential-design.md
git commit -m "docs(prime): specify provenance-first wisdom fabric"
```

---

### Task 2: Define normalized PRIME Wisdom types

**Files:**
- Create: `src/lib/prime/wisdom/types.ts`
- Create: `src/lib/prime/wisdom/index.ts`
- Test: `scripts/qa/prime-wisdom-schema.test.mjs`

**Interfaces:**
- Consumes: existing `PrimeDomain` type from the PRIME implementation once introduced; until then, define/import from the canonical PRIME type module selected by the implementation branch.
- Produces: `PrimeWisdomSource`, `PrimeWisdomLocator`, `PrimeWisdomUnit`, `PrimeWisdomEvidenceRole`, `PrimeWisdomWorldview`, `PrimeWisdomRights`.

- [ ] **Step 1: Write failing schema-contract tests**

Create deterministic tests that require these exact concepts:

```ts
interface PrimeWisdomLocator {
  url?: string;
  title?: string;
  publicationDate?: string;
  episode?: string;
  timestampSeconds?: number;
  chapter?: string;
  page?: string;
  verse?: string;
  hadithCollection?: string;
  hadithNumber?: string;
  edition?: string;
  translation?: string;
}

interface PrimeWisdomRights {
  status: 'verified' | 'licensed' | 'user_provided' | 'check_required' | 'unknown';
  fullTextRetention: 'allowed' | 'forbidden' | 'conditional';
  redistribution: 'allowed' | 'forbidden' | 'conditional';
  verificationUrl?: string;
  verifiedAt?: string;
  notes?: string;
}

interface PrimeWisdomWorldview {
  tradition?: 'islam' | 'buddhism' | 'judaism' | 'christianity' | 'secular' | 'other';
  layer?: 'canonical_text' | 'report' | 'commentary' | 'translation' | 'modern_interpretation';
  authenticityStatus?: string;
}
```

The tests must reject a Wisdom unit missing source identity, source class, locator/provenance, rights state, domains, principle, evidence role, or transformation metadata.

- [ ] **Step 2: Run the schema test and verify RED**

```bash
node scripts/qa/prime-wisdom-schema.test.mjs
```

Expected: FAIL because the Wisdom types/data do not exist yet.

- [ ] **Step 3: Implement the minimal type module**

Define:

```ts
type PrimeWisdomEvidenceRole =
  | 'clinical_authority'
  | 'scientific_support'
  | 'mechanistic_hypothesis'
  | 'historical_primary'
  | 'ethical_worldview'
  | 'expert_interpretation'
  | 'case_study'
  | 'personal_experience'
  | 'opinion'
  | 'contested_claim';

interface PrimeWisdomUnit {
  id: string;
  sourceId: string;
  sourceClass: PrimeWisdomSourceClass;
  locator: PrimeWisdomLocator;
  domains: PrimeDomain[];
  principle: string;
  mechanism?: string;
  mentalModel?: string;
  practicalApplication?: string;
  evidenceRole: PrimeWisdomEvidenceRole;
  supportingEvidenceIds: string[];
  contradictingUnitIds: string[];
  agreementUnitIds: string[];
  risks: string[];
  limitations: string[];
  worldview?: PrimeWisdomWorldview;
  rights: PrimeWisdomRights;
  transformation: {
    mode: 'verbatim_allowed' | 'original_paraphrase' | 'metadata_only';
    transformedAt: string;
    transformer: 'human' | 'model' | 'hybrid';
  };
}
```

Export from `index.ts`.

- [ ] **Step 4: Run schema test and verify GREEN**

```bash
node scripts/qa/prime-wisdom-schema.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prime/wisdom scripts/qa/prime-wisdom-schema.test.mjs
git commit -m "feat(prime): define normalized wisdom contracts"
```

---

### Task 3: Add a source catalog with explicit ingestion policy

**Files:**
- Create: `data/prime-wisdom/source-catalog.json`
- Create: `data/prime-wisdom/seed-units.json`
- Test: `scripts/qa/prime-wisdom-provenance.test.mjs`
- Modify: `data/source-registry/README.md`
- Modify: source-registry schema/category files only if needed for validation.

**Interfaces:**
- Consumes: Task 2 contracts.
- Produces: auditable source records and a small legal/provenance-safe seed corpus.

- [ ] **Step 1: Write failing provenance tests**

Require every catalog entry to include:

```json
{
  "id": "string",
  "name": "string",
  "creator": "string",
  "sourceClass": "podcast|book|...",
  "canonicalUrl": "string-or-null",
  "rights": {
    "status": "verified|licensed|user_provided|check_required|unknown",
    "fullTextRetention": "allowed|forbidden|conditional",
    "redistribution": "allowed|forbidden|conditional"
  },
  "ingestion": {
    "mode": "public_primary|public_metadata|licensed_feed|user_provided|manual_reference",
    "allowVerbatimLongForm": false
  }
}
```

Add invariants:

```text
rights unknown/check_required => allowVerbatimLongForm must be false
book/podcast/interview without explicit verified/licensed rights => full text cannot be retained
premium/paywalled source => public metadata or licensed feed only
seed unit => must point to exact sourceId + locator
```

- [ ] **Step 2: Verify RED**

```bash
node scripts/qa/prime-wisdom-provenance.test.mjs
```

Expected: FAIL because catalog is absent.

- [ ] **Step 3: Add bounded source identities**

Seed the catalog with the approved source universe as identities/policies, not copied content:

```text
Huberman Lab / Andrew Huberman
On Purpose / Jay Shetty
Raj Shamani / Figuring Out
Modern Wisdom / Chris Williamson
Mark Cuban public interviews/writings
Jiang Xueqin public interviews/writings
PBD Podcast / Patrick Bet-David
The Diary of a CEO
Warren Buffett / Berkshire Hathaway shareholder letters and public materials
Larry Ellison public interviews/oral-history/company material where lawful
Robert Kiyosaki books/interviews
Dana White public interviews
Shi Heng Yi public talks/interviews
Qur'an primary text/translation sources selected by product governance
Hadith collections selected by product governance with authenticity metadata
Buddhist canonical sources selected by product governance
Torah/Biblical primary text sources selected by product governance
John D. Rockefeller primary/historical sources
David Goggins books/interviews
Robert Greene books/interviews
Tim Grover books/interviews
```

For sources whose exact rights are not yet verified, use `check_required` or `unknown`; never infer commercial redistribution rights.

- [ ] **Step 4: Add a small seed unit corpus**

Create only enough hand-audited original paraphrases to exercise routing. Each unit must be short, attributable, locator-linked, and explicitly non-exhaustive. Do not paste book chapters or podcast transcripts.

- [ ] **Step 5: Update Source Registry documentation**

Add PRIME Wisdom as an example of the existing `source -> rights/provenance gate -> adapter -> normalized schema -> engine -> UI` flow. Reiterate that registry presence is not permission to ingest copyrighted text.

- [ ] **Step 6: Run validators**

```bash
node scripts/qa/prime-wisdom-provenance.test.mjs
npm run validate:source-registry
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add data/prime-wisdom data/source-registry scripts/qa/prime-wisdom-provenance.test.mjs
git commit -m "feat(prime): add wisdom source and provenance catalog"
```

---

### Task 4: Implement fail-closed rights and authority policy

**Files:**
- Create: `src/lib/prime/wisdom/policy.ts`
- Create: `server/src/prime-wisdom/copyrightGate.ts`
- Test: `scripts/qa/prime-wisdom-policy.test.mjs`

**Interfaces:**
- Consumes: `PrimeWisdomUnit`, `PrimeWisdomRights`, source catalog.
- Produces: `canRetainContent`, `canUseForHealthGuidance`, `canSurfaceWorldview`, `classifyAuthorityBand`.

- [ ] **Step 1: Write failing policy tests**

Required cases:

```text
1. premium transcript + no license -> full-text retention DENY
2. copyrighted book + unknown rights -> full-text retention DENY
3. verified public-domain/authorized primary text -> retention per catalog policy
4. podcast health claim without scientific support -> may surface as attributed perspective, not health guidance
5. clinical guideline -> authority band CLINICAL
6. peer-reviewed evidence -> authority band SCIENTIFIC
7. founder anecdote -> authority band PERSPECTIVE
8. contested political/geopolitical claim -> attributed only
9. worldview unit + user worldview disabled -> hidden from recommendation path
10. hard clinical/mental-health safety context -> motivational/worldview action route blocked
```

- [ ] **Step 2: Verify RED**

```bash
node scripts/qa/prime-wisdom-policy.test.mjs
```

- [ ] **Step 3: Implement deterministic policy functions**

```ts
type AuthorityBand = 'clinical' | 'scientific' | 'primary' | 'perspective' | 'worldview' | 'contested';

function classifyAuthorityBand(unit: PrimeWisdomUnit): AuthorityBand;
function canRetainContent(rights: PrimeWisdomRights, requestedMode: 'metadata' | 'summary' | 'verbatim_long_form'): boolean;
function canUseForHealthGuidance(unit: PrimeWisdomUnit): boolean;
function canSurfaceWorldview(unit: PrimeWisdomUnit, worldviewEnabled: boolean, selectedTraditions: string[]): boolean;
```

`canUseForHealthGuidance()` returns true only for appropriate clinical/scientific evidence roles; expert education may contribute only when linked to supporting evidence that independently satisfies the evidence gate.

- [ ] **Step 4: Verify GREEN**

```bash
node scripts/qa/prime-wisdom-policy.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prime/wisdom/policy.ts server/src/prime-wisdom/copyrightGate.ts scripts/qa/prime-wisdom-policy.test.mjs
git commit -m "feat(prime): enforce wisdom rights and authority policy"
```

---

### Task 5: Build the conflict and agreement graph

**Files:**
- Create: `src/lib/prime/wisdom/conflicts.ts`
- Test: `scripts/qa/prime-wisdom-retrieval.test.mjs`

**Interfaces:**
- Consumes: normalized `PrimeWisdomUnit[]`.
- Produces: `buildWisdomNeighborhood`, `validateWisdomGraph`, `getCounterpoints`.

- [ ] **Step 1: Write RED graph tests**

Test:

```text
- every contradiction link references an existing unit
- no unit contradicts itself
- duplicate IDs fail
- agreement/contradiction links preserve source identities
- a “push through discomfort” unit can coexist with a “protect recovery” unit without one deleting the other
- query can request counterpoints and receives both perspectives
```

- [ ] **Step 2: Verify RED**

```bash
node scripts/qa/prime-wisdom-retrieval.test.mjs
```

- [ ] **Step 3: Implement graph helpers**

```ts
interface WisdomNeighborhood {
  focal: PrimeWisdomUnit;
  agreements: PrimeWisdomUnit[];
  counterpoints: PrimeWisdomUnit[];
}

function validateWisdomGraph(units: PrimeWisdomUnit[]): { valid: boolean; errors: string[] };
function buildWisdomNeighborhood(id: string, units: PrimeWisdomUnit[]): WisdomNeighborhood | null;
function getCounterpoints(id: string, units: PrimeWisdomUnit[]): PrimeWisdomUnit[];
```

- [ ] **Step 4: Verify GREEN**

```bash
node scripts/qa/prime-wisdom-retrieval.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prime/wisdom/conflicts.ts scripts/qa/prime-wisdom-retrieval.test.mjs
git commit -m "feat(prime): preserve wisdom agreements and counterpoints"
```

---

### Task 6: Implement context-aware retrieval without a truth score

**Files:**
- Create: `src/lib/prime/wisdom/retrieve.ts`
- Modify: `scripts/qa/prime-wisdom-retrieval.test.mjs`

**Interfaces:**
- Consumes: PRIME domain/context, safety state, normalized units, policy helpers.
- Produces: `retrievePrimeWisdom(context, units)` returning ranked attributed candidates plus explanations.

- [ ] **Step 1: Extend RED retrieval tests**

Define:

```ts
interface PrimeWisdomContext {
  domains: PrimeDomain[];
  query?: string;
  currentConstraint?: 'capacity' | 'recovery' | 'knowledge' | 'execution' | 'avoidance' | 'environment' | 'resource' | 'relationship' | 'clinical' | 'uncertain';
  safetyState: 'normal' | 'clinical_override' | 'mental_health_override';
  worldviewEnabled: boolean;
  selectedTraditions: string[];
  requireCounterpoint: boolean;
}
```

Required cases:

```text
recovery constraint -> recovery lens ranks above “push harder” lens
avoidance constraint + normal safety -> action/agency lens may rank
clinical override -> lifestyle wisdom returns no autonomous action
worldview disabled -> religious units excluded from recommendation route
worldview enabled islam -> canonical/reported material may surface with layer metadata
health query -> unsupported podcast perspective cannot outrank scientific evidence
counterpoint requested -> at least one linked disagreement returned when available
```

- [ ] **Step 2: Verify RED**

```bash
node scripts/qa/prime-wisdom-retrieval.test.mjs
```

- [ ] **Step 3: Implement retrieval score components**

Use a transparent retrieval heuristic, not a truth score:

```text
retrieval_rank =
  0.30 * semantic_relevance
+ 0.25 * provenance_fit
+ 0.20 * evidence_fit_for_query
+ 0.15 * context_fit
+ 0.10 * actionability
- safety_or_conflict_penalty
```

Implementation requirements:

```ts
interface RankedWisdomUnit {
  unit: PrimeWisdomUnit;
  retrievalScore: number; // internal ranking only
  reasons: string[];
  counterpoints: PrimeWisdomUnit[];
}

function retrievePrimeWisdom(context: PrimeWisdomContext, units: PrimeWisdomUnit[]): RankedWisdomUnit[];
```

Never expose `retrievalScore` to users as truth, morality, authority, or human quality.

- [ ] **Step 4: Verify GREEN**

```bash
node scripts/qa/prime-wisdom-retrieval.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prime/wisdom/retrieve.ts scripts/qa/prime-wisdom-retrieval.test.mjs
git commit -m "feat(prime): add context-aware wisdom retrieval"
```

---

### Task 7: Create server-side adapter and normalization contracts

**Files:**
- Create: `server/src/prime-wisdom/adapterTypes.ts`
- Create: `server/src/prime-wisdom/normalize.ts`
- Test: `server/src/prime-wisdom/normalize.test.ts` or the repository’s established server test location.

**Interfaces:**
- Consumes: approved catalog source, lawful/public/licensed adapter payload.
- Produces: normalized `PrimeWisdomUnit` candidates; never writes directly to user clinical state.

- [ ] **Step 1: Write failing normalization tests**

Define adapter result:

```ts
interface PrimeWisdomAdapterRecord {
  sourceId: string;
  externalId: string;
  title: string;
  publishedAt?: string;
  locator: PrimeWisdomLocator;
  rawText?: string;
  metadata: Record<string, unknown>;
}
```

Required invariants:

```text
unknown sourceId -> reject
rights gate denies raw retention -> discard rawText before persistence
locator is preserved
normalizer must not invent publication dates/authenticity/licensing
normalizer output carries transformation mode
adapter errors fail closed and do not create partial “trusted” units
```

- [ ] **Step 2: Verify RED using the repository’s server test runner**

Run the focused server test command already used by `server-ci.yml`; do not invent a second test framework.

- [ ] **Step 3: Implement adapter/normalizer**

`normalize.ts` must accept catalog policy as input and return an explicit result:

```ts
type NormalizeWisdomResult =
  | { ok: true; unit: PrimeWisdomUnit }
  | { ok: false; reason: string };
```

- [ ] **Step 4: Verify focused server tests GREEN**

- [ ] **Step 5: Commit**

```bash
git add server/src/prime-wisdom
git commit -m "feat(prime): add wisdom ingestion adapter boundary"
```

---

### Task 8: Integrate Wisdom Fabric into PRIME constraint/action orchestration

**Files:**
- Modify: canonical PRIME orchestration module selected/created by the main PRIME implementation.
- Test: focused PRIME orchestration test file.

**Interfaces:**
- Consumes: `retrievePrimeWisdom`, `PrimeConstraint`, safety state, user-selected worldview preferences.
- Produces: optional `wisdomLenses` attached to an already-safe PRIME recommendation; Wisdom Fabric never creates clinical dispositions.

- [ ] **Step 1: Write RED orchestration tests**

Require:

```text
constraint=avoidance + safety=normal -> contextual action lens allowed
constraint=recovery -> recovery/protect lens, EDGE not auto-invoked by wisdom content
constraint=clinical -> no motivational lens can override Clinical
mental_health_override -> optimization/wisdom action generation pauses
resources domain -> speculative/ruin-risk wealth prompt excluded
relationships domain -> no scoring/ranking of people
```

- [ ] **Step 2: Verify RED**

Run the focused PRIME orchestration tests.

- [ ] **Step 3: Add a bounded orchestration field**

```ts
interface PrimeRecommendation {
  // existing fields...
  wisdomLenses?: Array<{
    unitId: string;
    title: string;
    perspective: string;
    sourceLabel: string;
    evidenceRole: PrimeWisdomEvidenceRole;
    hasCounterpoint: boolean;
  }>;
}
```

The action decision remains owned by PRIME/Clinical/EDGE arbitration; Wisdom Fabric supplies contextual lenses only.

- [ ] **Step 4: Verify GREEN**

Run focused tests plus relevant mental-health safety tests.

- [ ] **Step 5: Commit**

```bash
git add <canonical-prime-files> <prime-tests>
git commit -m "feat(prime): integrate contextual wisdom lenses"
```

---

### Task 9: Add visual-first provenance and counterpoint UI

**Files:**
- Modify: the existing PRIME/For You surface selected by the implementation.
- Create only if needed: `src/components/prime/PrimeWisdomLens.tsx`.
- Test: `scripts/qa/prime-wisdom-ui.test.mjs` plus existing mobile/browser smoke path.

**Interfaces:**
- Consumes: `PrimeRecommendation.wisdomLenses`.
- Produces: one-line visual-first lens with progressive disclosure for source, evidence role, counterpoint, and limitations.

- [ ] **Step 1: Write RED UI contract tests**

Require:

```text
main scrolling surface -> no long quotation blocks
primary lens -> one-line principle/title only
“Why / Source / Counterpoint” -> progressive disclosure
source creator/title/date/locator -> reachable within <=2 interactions
worldview material -> tradition/layer visible in disclosure
contested claim -> “attributed perspective” label visible
no raw retrieval score displayed
no “truth score”, “guru score”, or ranking of people
```

- [ ] **Step 2: Verify RED**

```bash
node scripts/qa/prime-wisdom-ui.test.mjs
```

- [ ] **Step 3: Implement the smallest reusable component**

Use the existing Motion UI system, wide spacing, visual-first rule, and progressive disclosure. Do not create a new top-level page.

- [ ] **Step 4: Verify mobile browser behavior**

Run existing mobile acceptance at `390x844` and confirm:

```text
no horizontal overflow
source/provenance reachable
counterpoint reachable
reduced-motion path functional
screen-reader labels expose source/evidence role
```

- [ ] **Step 5: Commit**

```bash
git add src/components/prime <selected-prime-surface> scripts/qa/prime-wisdom-ui.test.mjs
git commit -m "feat(prime): surface wisdom with provenance and counterpoints"
```

---

### Task 10: Wire focused QA into the repository gates

**Files:**
- Modify: `package.json`
- Modify only if appropriate: relevant workflow(s) that call existing repository QA commands.

**Interfaces:**
- Consumes: all deterministic Wisdom tests.
- Produces: repeatable local/CI commands without weakening existing coverage.

- [ ] **Step 1: Add focused scripts**

Add commands equivalent to:

```json
{
  "test:prime-wisdom": "node scripts/qa/prime-wisdom-schema.test.mjs && node scripts/qa/prime-wisdom-provenance.test.mjs && node scripts/qa/prime-wisdom-policy.test.mjs && node scripts/qa/prime-wisdom-retrieval.test.mjs && node scripts/qa/prime-wisdom-ui.test.mjs"
}
```

Use repository naming conventions if Indonesian command aliases are preferred; do not remove existing scripts.

- [ ] **Step 2: Run focused suite**

```bash
npm run test:prime-wisdom
```

Expected: PASS.

- [ ] **Step 3: Run full required gates**

```bash
npm run validate:source-registry
npm run build
```

Then require the repository’s exact-head `Validate pull requests`, complete `Stabilization Acceptance`, and any relevant browser/Body acceptance jobs if shared code paths were touched.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows
git commit -m "test(prime): gate wisdom fabric invariants"
```

---

### Task 11: Evaluate the system with adversarial PRIME scenarios

**Files:**
- Create: `scripts/qa/prime-wisdom-scenarios.test.mjs`
- Modify: `package.json` to include it in `test:prime-wisdom` after it is stable.

**Interfaces:**
- Consumes: full Wisdom Fabric and PRIME orchestration.
- Produces: deterministic regression protection for the hardest product failures.

- [ ] **Step 1: Write scenario cases before integration is considered complete**

Include at least:

```text
A. “I slept 3 hours; motivate me to grind harder.”
   -> protect/recovery; no Goggins/Grover override.

B. “I keep postponing a safe application even though it is ready.”
   -> agency/avoidance lens can include action-oriented perspectives.

C. “Huberman said X supplement fixes Y.”
   -> expert statement remains attributed; health guidance requires independent appropriate evidence.

D. “Kiyosaki says debt makes you rich; should I leverage everything?”
   -> no ruin-risk prompt; resilience/downside context required.

E. “What would Islam say about my goal?” with worldview disabled.
   -> do not inject religious content.

F. Same query with Islam explicitly enabled.
   -> canonical/report/commentary layers distinguished; source locator shown.

G. “Jiang Xueqin predicts a geopolitical event.”
   -> attributed contested perspective, not factual prediction or personalized political influence.

H. Two sources disagree about relentless work versus recovery.
   -> both lenses preserved; PRIME chooses based on current user state/safety, not celebrity authority.

I. User expresses explicit suicidal intent.
   -> PRIME Wisdom optimization pauses; mental-health safety kernel takes precedence.
```

- [ ] **Step 2: Verify RED where current orchestration is incomplete**

```bash
node scripts/qa/prime-wisdom-scenarios.test.mjs
```

- [ ] **Step 3: Make only the minimal policy/orchestration repairs needed for GREEN**

Do not weaken scenario expectations to accommodate implementation shortcuts.

- [ ] **Step 4: Run focused and full gates**

```bash
npm run test:prime-wisdom
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add scripts/qa/prime-wisdom-scenarios.test.mjs package.json src/lib/prime server/src/prime-wisdom
git commit -m "test(prime): add adversarial wisdom scenarios"
```

---

### Task 12: Merge-readiness and source expansion protocol

**Files:**
- Modify: `data/prime-wisdom/source-catalog.json` only for sources whose metadata/rights have actually been checked.
- Modify: PR description/checklist as needed.

**Interfaces:**
- Consumes: exact-head CI, latest `main`, open PR overlap state.
- Produces: merge-ready bounded PRIME Wisdom foundation and a repeatable process for adding more episodes/books/sources later.

- [ ] **Step 1: Re-resolve latest `main` and open PR overlap**

Confirm that no newer PRIME implementation branch owns the same files. If `main` moved materially, sync/rebase/merge according to repository policy and rerun all exact-head gates.

- [ ] **Step 2: Verify source expansion rules**

For each new source or episode, require:

```text
source identity -> rights status -> locator -> source class -> original paraphrase -> evidence role -> domains -> limitations -> counterpoints/support -> validation
```

No bulk ingestion job may bypass this chain.

- [ ] **Step 3: Run final exact-head validation**

Require:

```text
focused PRIME Wisdom suite = green
source-registry validator = green
production build = green
Validate pull requests = green on exact head
Stabilization Acceptance = green on exact head
latest-main overlap/ancestry audit = clean
```

- [ ] **Step 4: Merge only through the protected PR path**

Never direct-push or force-merge. After merge, verify `main` contains the expected commit and available deployment/smoke evidence.

---

## Self-Review

### Spec coverage

- Seven PRIME domains: covered by normalized domain tags and retrieval context.
- Constraint Detector integration: Task 8.
- PRIME↔EDGE recovery/challenge arbitration: Tasks 6, 8, 11.
- Clinical/mental-health precedence: Tasks 4, 8, 11.
- Optional worldview: Tasks 2, 4, 6, 9, 11.
- Provenance/licensing: Tasks 1, 3, 4, 7.
- Contradictions/counterpoints: Tasks 1, 5, 6, 9.
- Copyright-safe exhaustive coverage strategy: Tasks 1, 3, 7, 12.
- Visual-first/two-step UI: Task 9.
- Evidence separation and no truth score: Tasks 2, 4, 6.
- Exact-head repository governance: Tasks 10, 12.

### Placeholder scan

No implementation step depends on `TBD`, `TODO`, unspecified error handling, or undefined future behavior. Task 8 intentionally references the canonical PRIME orchestration module because PR #1768 is currently design-only and production paths do not yet exist; the executor must bind to the canonical PRIME module created by the PRIME implementation rather than invent a duplicate subsystem.

### Type consistency

All later tasks consume the normalized contracts introduced in Task 2. `PrimeWisdomUnit`, `PrimeWisdomRights`, `PrimeWisdomContext`, `RankedWisdomUnit`, and `PrimeRecommendation.wisdomLenses` are named consistently across the plan.
