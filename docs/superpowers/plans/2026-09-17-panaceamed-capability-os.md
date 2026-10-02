# Panaceamed Capability OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repository-defined, machine-readable Capability OS that deterministically routes Panaceamed work to the narrowest safe skill/tool/provider, with explicit fallbacks, executor compatibility, evidence requirements, and anti-duplication rules.

**Architecture:** Store routing policy in `config/capability-os.json`, validate it with a dependency-free Node ESM validator, and exercise routing behavior through deterministic scenario tests. Add one Claude Code skill that consumes the manifest and delegates scheduling to the existing `panacea-orchestrator`; do not change production application runtime behavior. Runtime plugin connection state remains dynamic and is never committed as truth.

**Tech Stack:** JSON / JSON Schema-like validation, Node.js ESM, `node:test`, existing `.claude/skills` conventions, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-panaceamed-capability-os-design.md`

## Global Constraints

- `CLAUDE.md` and `AGENTS.md` remain authoritative.
- Never push directly to `main`; work only on `chore/panacea-skill-library-20260917` / PR #1753.
- No credentials, OAuth tokens, account-specific connection state, PHI, or financial data may appear in the manifest.
- No new npm dependency is required for the first implementation slice.
- The implementation slice may change config, scripts/tests, skills, CI and package scripts, but must not change production application runtime behavior.
- Runtime availability/authorization checks remain external to the manifest.
- Fallbacks may never bypass policy, authorization, clinical, privacy, security, or repository ownership boundaries.
- One provider is used per independent information need by default; duplicate providers require an explicit reason.
- Exact-head repository gates and latest-main overlap audit still govern merge readiness.

---

## File Structure

- `config/capability-os.schema.json` — structural contract for the manifest.
- `config/capability-os.json` — canonical logical capability catalog and routing metadata.
- `config/capability-os.scenarios.json` — deterministic pressure scenarios covering routing and fallback cases.
- `scripts/lib/capability-os.mjs` — dependency-free loader, structural/semantic validator, and pure route-selection helper used only by tooling/tests.
- `scripts/validate-capability-os.mjs` — CLI validator for CI and maintainers.
- `scripts/qa/capability-os-validator.test.mjs` — schema/semantic failure-mode tests.
- `scripts/qa/capability-os-routing.test.mjs` — deterministic pressure-scenario tests.
- `.claude/skills/panacea-capability-router/SKILL.md` — judgment workflow for selecting skills/plugins/providers.
- `.claude/skills/panacea-orchestrator/SKILL.md` — minimal cross-reference: router selects capabilities; orchestrator schedules ownership/parallelism.
- `package.json` — targeted validation/test scripts and build-gate integration.
- `.github/workflows/capability-os.yml` — narrow exact-head CI lane independent of unrelated frontend gate failures.

---

### Task 1: Manifest Contract and Validator

**Files:**
- Create: `config/capability-os.schema.json`
- Create: `config/capability-os.json`
- Create: `scripts/lib/capability-os.mjs`
- Create: `scripts/qa/capability-os-validator.test.mjs`
- Create: `scripts/validate-capability-os.mjs`

**Interfaces:**
- Produces `loadCapabilityOs({ manifestPath?, schemaPath? }) -> Promise<{ manifest, schema }>`.
- Produces `validateCapabilityOs(manifest, schema) -> string[]` where an empty array means valid.
- Produces manifest entries with fields: `id`, `lane`, `domains`, `executors`, `primary`, `fallbacks`, `skill`, `risk`, `sideEffects`, `parallelizable`, `writeAuthority`, `requiredEvidence`, `stopCondition`.
- `executors` shape is `{ preferred: string, supported: string[] }`; allowed executor IDs for slice 1 are `chatgpt`, `claude-code`, `either` is forbidden as an executor value because it hides runtime differences.

- [ ] **Step 1: Write failing validator tests**

Create `scripts/qa/capability-os-validator.test.mjs` using `node:test`. Include fixtures that assert:

```js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateCapabilityOs } from '../lib/capability-os.mjs'

const validEntry = {
  id: 'research.biomedical.pubmed',
  lane: 'biomedical-evidence',
  domains: ['medicine', 'evidence'],
  executors: { preferred: 'chatgpt', supported: ['chatgpt'] },
  primary: 'pubmed',
  fallbacks: ['consensus', 'elicit'],
  skill: 'panacea-medical-evidence-validator',
  risk: 'clinical-reference',
  sideEffects: 'read-only',
  parallelizable: true,
  writeAuthority: 'none',
  requiredEvidence: ['source-identity', 'retrieval-date', 'citation'],
  stopCondition: 'sufficient-authoritative-evidence',
}

test('accepts a complete logical capability', () => {
  assert.deepEqual(validateCapabilityOs({ version: 1, capabilities: [validEntry] }, schema), [])
})

test('rejects duplicate ids', () => {
  const errors = validateCapabilityOs({ version: 1, capabilities: [validEntry, validEntry] }, schema)
  assert.match(errors.join('\n'), /duplicate capability id/)
})

test('rejects secret-like manifest fields', () => {
  const unsafe = { ...validEntry, token: 'secret' }
  const errors = validateCapabilityOs({ version: 1, capabilities: [unsafe] }, schema)
  assert.match(errors.join('\n'), /additional property|secret|token/i)
})

test('rejects unsupported executor preference', () => {
  const unsafe = { ...validEntry, executors: { preferred: 'claude-code', supported: ['chatgpt'] } }
  const errors = validateCapabilityOs({ version: 1, capabilities: [unsafe] }, schema)
  assert.match(errors.join('\n'), /preferred executor.*supported/i)
})

test('rejects production write authority on read-only capability', () => {
  const unsafe = { ...validEntry, writeAuthority: 'approved-production' }
  const errors = validateCapabilityOs({ version: 1, capabilities: [unsafe] }, schema)
  assert.match(errors.join('\n'), /read-only.*write authority/i)
})
```

Also cover: empty domains/evidence, duplicate fallback providers, primary repeated in fallbacks, invalid lane/risk/sideEffects/writeAuthority enums, connection-state keys (`installed`, `connected`, `oauth`, `apiKey`, `accessToken`), and `policy-denied` fallback bypass attempts encoded as an invalid `fallbackPolicy: "bypass"` additional property.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test scripts/qa/capability-os-validator.test.mjs
```

Expected: FAIL because `scripts/lib/capability-os.mjs` and/or schema do not exist.

- [ ] **Step 3: Implement schema and minimal validator**

Create `config/capability-os.schema.json` with strict `additionalProperties: false` at manifest, entry, and executor levels. Enums:

```json
{
  "lane": ["engineering", "biomedical-evidence", "ux-visual", "browser-qa", "release-infrastructure", "growth-operations"],
  "risk": ["routine", "security", "privacy", "clinical-reference", "clinical-high-risk", "deployment", "financial"],
  "sideEffects": ["read-only", "local-change", "remote-change", "production-change"],
  "writeAuthority": ["none", "branch-only", "external-draft", "approved-production"],
  "executor": ["chatgpt", "claude-code"]
}
```

Implement `scripts/lib/capability-os.mjs` with a small recursive validator following the repository's existing `validate-source-registry.mjs` approach. Add semantic rules:

```js
if (seenIds.has(entry.id)) errors.push(`duplicate capability id ${entry.id}`)
if (!entry.executors.supported.includes(entry.executors.preferred)) {
  errors.push(`${entry.id}: preferred executor must be included in supported executors`)
}
if (entry.fallbacks.includes(entry.primary)) {
  errors.push(`${entry.id}: primary provider must not be repeated in fallbacks`)
}
if (new Set(entry.fallbacks).size !== entry.fallbacks.length) {
  errors.push(`${entry.id}: fallback providers must be unique`)
}
if (entry.sideEffects === 'read-only' && entry.writeAuthority !== 'none') {
  errors.push(`${entry.id}: read-only capability requires write authority none`)
}
```

Create `scripts/validate-capability-os.mjs`:

```js
import process from 'node:process'
import { loadCapabilityOs, validateCapabilityOs } from './lib/capability-os.mjs'

const { manifest, schema } = await loadCapabilityOs({})
const errors = validateCapabilityOs(manifest, schema)
if (errors.length) {
  console.error(`Capability OS validation failed (${errors.length} issues):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log(`Capability OS validation passed (${manifest.capabilities.length} capabilities).`)
}
```

Populate `config/capability-os.json` with a focused initial catalog, not every plugin. Required initial IDs:

```text
engineering.repo.github
engineering.docs.context7
engineering.local.remote-desktop
research.biomedical.pubmed
research.biomedical.regulatory
research.biomedical.synthesis
research.web.firecrawl
ux.product-design
ux.scientific-biorender
qa.browser.remote
release.frontend.vercel
release.backend.render
release.release-qa.appdeploy
observability.product.posthog
communications.transactional.resend
payments.stripe
growth.search-console
growth.social.metricool
knowledge.structured.notion
knowledge.unstructured.mem
```

Each entry must encode only logical ownership and provider classes; connection status stays absent.

- [ ] **Step 4: Run validator tests and CLI**

Run:

```bash
node --test scripts/qa/capability-os-validator.test.mjs
node scripts/validate-capability-os.mjs
```

Expected: PASS; CLI reports the capability count.

- [ ] **Step 5: Commit**

```bash
git add config/capability-os.schema.json config/capability-os.json scripts/lib/capability-os.mjs scripts/qa/capability-os-validator.test.mjs scripts/validate-capability-os.mjs
git commit -m "feat(capability-os): add manifest contract and validator"
```

---

### Task 2: Deterministic Routing and Pressure Scenarios

**Files:**
- Modify: `scripts/lib/capability-os.mjs`
- Create: `config/capability-os.scenarios.json`
- Create: `scripts/qa/capability-os-routing.test.mjs`

**Interfaces:**
- Produces `selectCapability(manifest, request) -> { capabilityId, provider, executor, fallbackUsed, reason }`.
- Request shape:

```ts
{
  capabilityId: string,
  executor: 'chatgpt' | 'claude-code',
  availableProviders: string[],
  policyAllowed: boolean,
  authorizationAvailable: boolean,
  duplicateReason?: 'conflict' | 'high-risk-corroboration' | 'distinct-evidence-class' | 'explicit-comparison'
}
```

- Function is pure tooling logic: it never installs/connects plugins and never performs provider calls.

- [ ] **Step 1: Write failing routing tests**

Create scenarios covering all approved pressure cases:

```json
[
  {
    "name": "ordinary authoritative provider",
    "request": {
      "capabilityId": "research.biomedical.pubmed",
      "executor": "chatgpt",
      "availableProviders": ["pubmed", "consensus"],
      "policyAllowed": true,
      "authorizationAvailable": true
    },
    "expected": { "provider": "pubmed", "fallbackUsed": false }
  },
  {
    "name": "primary unavailable uses ordered fallback",
    "request": {
      "capabilityId": "research.biomedical.pubmed",
      "executor": "chatgpt",
      "availableProviders": ["consensus"],
      "policyAllowed": true,
      "authorizationAvailable": true
    },
    "expected": { "provider": "consensus", "fallbackUsed": true }
  },
  {
    "name": "unsupported executor fails closed",
    "request": {
      "capabilityId": "research.biomedical.pubmed",
      "executor": "claude-code",
      "availableProviders": ["pubmed"],
      "policyAllowed": true,
      "authorizationAvailable": true
    },
    "expectedError": "executor"
  },
  {
    "name": "policy denial never falls back",
    "request": {
      "capabilityId": "release.frontend.vercel",
      "executor": "chatgpt",
      "availableProviders": ["vercel", "appdeploy"],
      "policyAllowed": false,
      "authorizationAvailable": true
    },
    "expectedError": "policy"
  },
  {
    "name": "authorization requirement stops instead of bypassing",
    "request": {
      "capabilityId": "growth.social.metricool",
      "executor": "chatgpt",
      "availableProviders": ["metricool"],
      "policyAllowed": true,
      "authorizationAvailable": false
    },
    "expectedError": "authorization"
  }
]
```

Add tests for deployment ownership, repo-overlap represented as `policyAllowed:false`, clinical-high-risk corroboration reason, and ordinary task with no duplicate provider reason.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test scripts/qa/capability-os-routing.test.mjs
```

Expected: FAIL because `selectCapability` is not exported.

- [ ] **Step 3: Implement the minimal pure router**

Add to `scripts/lib/capability-os.mjs`:

```js
export function selectCapability(manifest, request) {
  const capability = manifest.capabilities.find((entry) => entry.id === request.capabilityId)
  if (!capability) throw new Error(`unknown capability: ${request.capabilityId}`)
  if (!request.policyAllowed) throw new Error('policy denied: fallback is forbidden')
  if (!request.authorizationAvailable) throw new Error('authorization required')
  if (!capability.executors.supported.includes(request.executor)) {
    throw new Error(`executor ${request.executor} is not supported by ${capability.id}`)
  }

  const ordered = [capability.primary, ...capability.fallbacks]
  const provider = ordered.find((candidate) => request.availableProviders.includes(candidate))
  if (!provider) throw new Error(`no available provider for ${capability.id}`)

  return {
    capabilityId: capability.id,
    provider,
    executor: request.executor,
    fallbackUsed: provider !== capability.primary,
    reason: provider === capability.primary ? 'primary-authoritative-provider' : 'ordered-fallback',
  }
}
```

Do not add network calls, installation logic, or permission mutation.

- [ ] **Step 4: Run pressure scenarios**

Run:

```bash
node --test scripts/qa/capability-os-routing.test.mjs
```

Expected: PASS for ordinary, unavailable-primary, unsupported-executor, policy-denied, authorization, clinical-risk, deployment, and overlap scenarios.

- [ ] **Step 5: Commit**

```bash
git add config/capability-os.scenarios.json scripts/lib/capability-os.mjs scripts/qa/capability-os-routing.test.mjs
git commit -m "test(capability-os): encode routing pressure scenarios"
```

---

### Task 3: Capability Router Skill and Orchestrator Boundary

**Files:**
- Create: `.claude/skills/panacea-capability-router/SKILL.md`
- Modify: `.claude/skills/panacea-orchestrator/SKILL.md`
- Create: `scripts/qa/capability-os-skill-contract.test.mjs`

**Interfaces:**
- `panacea-capability-router` selects the logical capability/provider/executor and required evidence.
- `panacea-orchestrator` remains responsible for dependency graphs, path ownership, sequencing/parallelism, and integration boundaries.
- Neither skill may override `CLAUDE.md` / `AGENTS.md`.

- [ ] **Step 1: Write failing skill-contract test**

Create `scripts/qa/capability-os-skill-contract.test.mjs` and assert the future skill contains the non-negotiable boundaries:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routerPath = '.claude/skills/panacea-capability-router/SKILL.md'
const orchestratorPath = '.claude/skills/panacea-orchestrator/SKILL.md'

test('capability router declares manifest and runtime availability boundaries', async () => {
  const text = await readFile(routerPath, 'utf8')
  assert.match(text, /config\/capability-os\.json/)
  assert.match(text, /runtime availability/i)
  assert.match(text, /never.*connection state/i)
  assert.match(text, /fallback.*policy/i)
  assert.match(text, /required evidence/i)
  assert.match(text, /stop condition/i)
})

test('orchestrator delegates provider selection to capability router', async () => {
  const text = await readFile(orchestratorPath, 'utf8')
  assert.match(text, /panacea-capability-router/)
  assert.match(text, /select/i)
  assert.match(text, /schedule|ownership|parallel/i)
})
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --test scripts/qa/capability-os-skill-contract.test.mjs
```

Expected: FAIL with missing `panacea-capability-router/SKILL.md`.

- [ ] **Step 3: Write minimal router skill**

Create frontmatter:

```yaml
---
name: panacea-capability-router
description: Use when a Panaceamed task can be served by multiple tools, plugins, agents, evidence providers, or execution environments and choosing among them affects correctness, safety, cost, or verification.
---
```

Skill body must stay concise and reference, not duplicate, canonical policy. Required workflow:

```text
1. Read CLAUDE.md and AGENTS.md.
2. Read config/capability-os.json.
3. Identify one logical capability per independent need.
4. Check executor compatibility.
5. Check runtime availability/authorization; never infer connection state from the manifest.
6. Use the primary when available; otherwise walk fallbacks in order.
7. Stop immediately on policy denial or required authorization.
8. Call a second provider only for an allowed duplicate reason.
9. Capture requiredEvidence and stopCondition in the handoff.
10. Delegate scheduling/ownership/parallelism to panacea-orchestrator.
```

Explicitly state: the skill never installs a plugin, never changes permissions, never bypasses authorization, and never treats an LLM as biomedical evidence.

- [ ] **Step 4: Cross-reference router from orchestrator**

Add a short section to `panacea-orchestrator`:

```markdown
## Capability selection boundary
When a task has multiple possible tools/providers/executors, use `panacea-capability-router` first. The router chooses the capability/provider and evidence contract; this orchestrator owns dependency ordering, repository-path ownership, parallelism and integration.
```

Do not copy the manifest algorithm into the orchestrator.

- [ ] **Step 5: Run skill-contract and existing static checks**

Run:

```bash
node --test scripts/qa/capability-os-skill-contract.test.mjs
node scripts/validate-capability-os.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/panacea-capability-router/SKILL.md .claude/skills/panacea-orchestrator/SKILL.md scripts/qa/capability-os-skill-contract.test.mjs
git commit -m "feat(skills): add Panaceamed capability router"
```

---

### Task 4: Package Scripts and Targeted Exact-Head CI

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/capability-os.yml`

**Interfaces:**
- Adds `npm run validate:capability-os`.
- Adds `npm run test:capability-os`.
- Root `build` runs the Capability OS validator/test before TypeScript/Vite, without changing production runtime.
- Targeted workflow gives exact-head evidence even while unrelated frontend baseline gates remain red.

- [ ] **Step 1: Add package commands**

Add:

```json
"validate:capability-os": "node scripts/validate-capability-os.mjs",
"test:capability-os": "node --test scripts/qa/capability-os-validator.test.mjs scripts/qa/capability-os-routing.test.mjs scripts/qa/capability-os-skill-contract.test.mjs"
```

Update `build` so the beginning becomes:

```text
node scripts/gen-note-index.mjs --check &&
node scripts/validate-source-registry.mjs &&
node scripts/validate-feature-factory.mjs &&
node scripts/validate-academic-review.mjs &&
node scripts/validate-capability-os.mjs &&
node --test ... scripts/qa/capability-os-validator.test.mjs scripts/qa/capability-os-routing.test.mjs scripts/qa/capability-os-skill-contract.test.mjs &&
...
```

Do not remove any existing validator/test.

- [ ] **Step 2: Add targeted workflow**

Create `.github/workflows/capability-os.yml`:

```yaml
name: Capability OS

on:
  pull_request:
    paths:
      - 'config/capability-os*.json'
      - 'scripts/lib/capability-os.mjs'
      - 'scripts/validate-capability-os.mjs'
      - 'scripts/qa/capability-os-*.test.mjs'
      - '.claude/skills/panacea-capability-router/**'
      - '.claude/skills/panacea-orchestrator/**'
      - 'package.json'
      - '.github/workflows/capability-os.yml'

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run validate:capability-os
      - run: npm run test:capability-os
```

- [ ] **Step 3: Run complete targeted verification**

Run:

```bash
npm run validate:capability-os
npm run test:capability-os
```

Expected: both exit 0.

Then allow the `Capability OS` workflow to run on exact head and verify it is green before making any targeted-completion claim.

- [ ] **Step 4: Check broader repository gates without weakening them**

Observe `Validate pull requests` and `Stabilization Acceptance` on exact head. If they fail in the known stale Home v45→v48 baseline or unreachable-surface baseline, record the dependency on existing PRs #1749/#1752 rather than modifying those unrelated paths in #1753.

- [ ] **Step 5: Update PR #1753 body**

Document:

```text
- 13 project skills total, including panacea-capability-router
- machine-readable capability manifest + schema
- deterministic route/pressure scenarios
- no production runtime behavior changed
- targeted Capability OS CI result and exact head SHA
- full-gate status, including any baseline blocker from #1749/#1752
```

Do not claim merged/deployed.

- [ ] **Step 6: Commit**

```bash
git add package.json .github/workflows/capability-os.yml
git commit -m "ci(capability-os): gate routing contract"
```

---

## Final Verification Checklist

- [ ] `node scripts/validate-capability-os.mjs` exits 0.
- [ ] `npm run test:capability-os` exits 0 with validator, routing and skill-contract tests passing.
- [ ] Manifest contains no credential or connection-state fields.
- [ ] All capability IDs are unique.
- [ ] Executor preference is always included in supported executors.
- [ ] Read-only capabilities have `writeAuthority: "none"`.
- [ ] Ordinary scenario selects only one primary provider.
- [ ] Unavailable primary uses only the first available ordered fallback.
- [ ] Unsupported executor, policy denial and missing authorization fail closed.
- [ ] Router skill does not duplicate orchestration scheduling logic.
- [ ] Orchestrator does not duplicate provider-selection logic.
- [ ] Targeted `Capability OS` GitHub workflow is green on exact current head.
- [ ] Full repository gate failures, if any, are diagnosed and attributed; no validator is weakened.
- [ ] PR #1753 remains unmerged until exact-head required gates and latest-main race/overlap checks satisfy repository policy.
