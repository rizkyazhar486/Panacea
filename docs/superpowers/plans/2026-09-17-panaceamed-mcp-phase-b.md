# Panaceamed MCP Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Phase A Panaceamed MCP kernel with read-only FHIR R4 previews, bounded HL7 v2 parsing/conversion, and provenance-preserving medical terminology tools without exposing patient-datastore retrieval or clinical write actions.

**Architecture:** Phase B is a stacked delivery on top of Phase A PR #1754. Pure interoperability logic lives in small domain modules under `server/src/mcp/`; verified FHIR mappings have one canonical dependency-free source; terminology tools wrap existing Panaceamed ICD/RxNorm/RxClass/ATC modules instead of inventing a second vocabulary layer. The existing registry/policy/transport/audit kernel remains authoritative. All Phase B remote tools are `sideEffect: 'none'`; SATUSEHAT submission, EMR signing, medication/order commits, arbitrary patient retrieval, and heuristic clinical coding remain unexposed.

**Tech Stack:** Node.js >=20, TypeScript 5.6, `tsx`, Zod 4, official MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express`), existing Panaceamed FHIR/SATUSEHAT/ICD/RxNorm/RxClass/ATC modules.

**Spec:** `docs/superpowers/specs/2026-09-17-panaceamed-mcp-orchestration-design.md`

**Plan baseline:** Phase A PR #1754 actual head `fb58d33f578466da9de74c76d8778cbc3cbdaec7` at plan creation time. The PR body may contain older test-head text; always use GitHub's current PR head as authoritative.

## Global Constraints

- GitHub `main` remains the source of truth; never push directly to `main` and never force-update a branch.
- Phase B must not duplicate the Phase A kernel. It extends `registry.ts`, `tools.ts`, `serverFactory.ts`, and their tests only through the existing contracts.
- While Phase A is open, Phase B is a stacked branch/PR whose base is `feat/panacea-mcp-core-20260917`. After Phase A merges, refresh Phase B onto latest `main`, retarget to `main`, and rerun all exact-head gates.
- Before implementation, re-resolve PR #1754. If its head differs from the plan baseline, incorporate the latest Phase A branch non-destructively before writing Phase B code.
- Remote MCP stays disabled by default and remains protected by the existing bearer boundary when explicitly enabled.
- No Phase B MCP tool may fetch arbitrary patient records from Panaceamed application storage.
- No Phase B MCP tool may call `postResource`, `submitEmr`, SATUSEHAT OAuth, EMR signing, medication/order commit, diagnosis, or treatment paths.
- FHIR inspection is structural preview only; never label it as a complete standards validator.
- Unknown/unsupported terminology is `unmapped`; no tool guesses a LOINC, ICD, SNOMED CT, RxNorm, or ATC code from plausibility alone.
- SNOMED CT remains unsupported until a licensed/authorized terminology service is configured and reviewed.
- Preserve provider identity, terminology version when known, retrieval time, match mode, warnings, and provenance in normalized terminology results.
- Fuzzy/string similarity is search ranking only; it is not clinical confidence.
- HL7 parsing is bounded by bytes, segment count, field count, and text length. Malformed/oversized messages fail closed.
- Audit records remain metadata-only and must not retain raw patient/clinical payload values.
- Existing academic/source-registry/clinical safety gates are not weakened to make Phase B green.

### Safety invariant

`Remote clinical writes = 0`

`Phase B capability = FHIR preview + HL7 parse/preview conversion + terminology reference`

---

### Task 1: Make the existing FHIR R4 builder a single shared source of truth

**Files:**
- Create: `server/src/shared/fhirR4.ts`
- Modify: `src/lib/fhir.ts`
- Create: `server/uji/mcpFhirShared.uji.ts`
- Existing regression: `server/uji/fhir.uji.ts`

**Purpose:** The current verified FHIR builder lives under frontend `src/lib/fhir.ts`, while `server/tsconfig.json` compiles only `server/src`. Do not copy the LOINC/UCUM mapping into MCP. Move the dependency-free FHIR implementation into a server-compilable shared module and preserve the existing frontend import path as a re-export shim.

**Interfaces preserved exactly:**
- `Kuantitas`, `Koding`, `Observasi`, `Pasien`, `Bundel`, `Ukuran`, `MasukanEkspor`
- `UKURAN`, `TURUNAN`, `SISTEM_LOKAL`
- `waktuFhir`, `bangunBundel`, `ringkasBundel`, `keJson`

- [ ] **Step 1: Write the failing shared-source test**

Create `server/uji/mcpFhirShared.uji.ts` before the shared module exists:

```ts
import * as shared from '../src/shared/fhirR4.js'
import * as frontend from '../../src/lib/fhir.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean) {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama) }
}

ok('frontend memakai daftar ukuran baku yang sama',
  JSON.stringify(frontend.UKURAN) === JSON.stringify(shared.UKURAN))
ok('frontend memakai daftar turunan yang sama',
  JSON.stringify(frontend.TURUNAN) === JSON.stringify(shared.TURUNAN))
ok('sistem lokal identik', frontend.SISTEM_LOKAL === shared.SISTEM_LOKAL)
ok('LOINC tidak berulang', new Set(shared.UKURAN.map((x) => x.loinc)).size === shared.UKURAN.length)
ok('turunan tidak memiliki LOINC', shared.TURUNAN.every((x) => !x.loinc))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
```

- [ ] **Step 2: Verify RED**

From `server/` run:

```bash
npx tsx uji/mcpFhirShared.uji.ts
```

Expected: module-not-found for `src/shared/fhirR4`.

- [ ] **Step 3: Move the current pure FHIR implementation without changing behavior**

Copy the complete current contents of `src/lib/fhir.ts` to `server/src/shared/fhirR4.ts`. Do not alter any code, LOINC code, UCUM code, note, category, derived-value rule, or bundle behavior in this step.

Replace `src/lib/fhir.ts` with this compatibility shim:

```ts
// Canonical dependency-free FHIR R4 implementation is shared with the server MCP.
// Keep this public import path stable for the frontend and existing tests.
export * from '../../server/src/shared/fhirR4'
```

The shared module must remain browser-safe: no `node:*`, filesystem, environment, fetch, Express, or MCP imports.

- [ ] **Step 4: Verify GREEN and behavior preservation**

Run:

```bash
cd server
npx tsx uji/mcpFhirShared.uji.ts
npx tsx uji/fhir.uji.ts
npm run typecheck
cd ..
npx tsc -b
npm run build
```

The existing FHIR test must pass unchanged, including the invariant that derived values use the Panaceamed local code system and missing/NaN values never become clinical zeros.

- [ ] **Step 5: Commit**

Commit message: `refactor(fhir): share verified R4 preview core`.

---

### Task 2: Add FHIR R4 MCP preview and SATUSEHAT preview tools

**Files:**
- Create: `server/src/mcp/domainError.ts`
- Create: `server/src/mcp/interoperability/fhir.ts`
- Create: `server/uji/mcpFhir.uji.ts`
- Modify: `server/src/mcp/tools.ts` only to recognize the shared domain error in `errorFrom`; tool registration is Task 6.
- Reuse: `server/src/shared/fhirR4.ts`
- Reuse: `server/src/satusehat.ts` — `buildEmrBundle` only

**Interfaces:**

```ts
export class McpDomainError extends Error {
  constructor(
    readonly code: 'invalid_input' | 'unsupported_message_type' |
      'unsupported_code_system' | 'unmapped_terminology' |
      'upstream_timeout' | 'upstream_unavailable' |
      'clinical_action_not_exposed',
    message: string,
    readonly retryable = false,
  ) { super(message) }
}
```

```ts
export interface ObservationBundlePreviewInput {
  values: Record<string, number | null>
  patient?: { name?: string; sex?: 'M' | 'F'; birthDate?: string }
  effectiveAt?: string
}

export function fhirCapabilities(): {
  fhirVersion: 'R4'
  standardObservationMappings: number
  derivedObservationMappings: number
  fullValidator: false
  patientDatastoreRetrieval: false
  satusehatSubmissionExposed: false
}

export function buildObservationBundlePreview(input: ObservationBundlePreviewInput): unknown
export function inspectFhirResource(resource: unknown): unknown
export function buildSatusehatPreview(input: {
  patient: unknown
  record: unknown
  practitionerName: string
  effectiveAt?: string
}): unknown
```

- [ ] **Step 1: Write failing FHIR MCP tests**

`server/uji/mcpFhir.uji.ts` must cover all of these cases before implementation:

1. capabilities report `R4`, `fullValidator:false`, datastore retrieval false, SATUSEHAT submission false;
2. standard weight produces LOINC `29463-7` and UCUM `kg`;
3. `phenoAge` uses `SISTEM_LOKAL`, never LOINC;
4. `null`, unknown keys, and direct-call `NaN` do not become zero observations;
5. an explicitly supplied numeric zero remains a valid numeric zero;
6. `inspectFhirResource` rejects arrays/null, reports resource type/id/field count for object resources, and calls itself a structural inspection rather than validation;
7. SATUSEHAT preview produces a Bundle by calling the pure builder;
8. SATUSEHAT preview performs zero fetch calls even when SATUSEHAT credentials are present in the environment.

Use a network tripwire around the last test:

```ts
const fetchAsli = globalThis.fetch
let fetchCalls = 0
globalThis.fetch = async () => {
  fetchCalls++
  throw new Error('MCP SATUSEHAT preview must not use network')
}
try {
  process.env.SATUSEHAT_CLIENT_ID = 'test-client'
  process.env.SATUSEHAT_CLIENT_SECRET = 'test-secret'
  const preview = buildSatusehatPreview({
    patient: { name: 'Synthetic Patient', sex: 'M' },
    record: { vitals: [{ label: 'Heart rate', value: 72, unit: '/min' }] },
    practitionerName: 'Synthetic Clinician',
    effectiveAt: '2026-09-17T00:00:00.000Z',
  })
  ok('preview membangun Bundle', (preview as any).resourceType === 'Bundle')
  ok('preview tidak menyentuh network', fetchCalls === 0)
} finally {
  globalThis.fetch = fetchAsli
}
```

- [ ] **Step 2: Verify RED**

```bash
cd server
npx tsx uji/mcpFhir.uji.ts
```

Expected: missing Phase B interoperability modules.

- [ ] **Step 3: Implement the domain error and pure FHIR adapter**

`interoperability/fhir.ts` must import only pure/shared builders for FHIR and only `buildEmrBundle` from SATUSEHAT:

```ts
import {
  bangunBundel, ringkasBundel, UKURAN, TURUNAN,
} from '../../shared/fhirR4.js'
import { buildEmrBundle } from '../../satusehat.js'
import { McpDomainError } from '../domainError.js'
```

Normalize `null` to missing and never coerce arbitrary strings to numbers:

```ts
const values: Record<string, number | undefined> = {}
for (const [key, value] of Object.entries(input.values ?? {})) {
  if (value === null) values[key] = undefined
  else if (typeof value === 'number' && Number.isFinite(value)) values[key] = value
  else values[key] = undefined
}
```

If `effectiveAt` is present but not a valid timestamp, throw `McpDomainError('invalid_input', ...)` rather than silently substituting now.

`inspectFhirResource` performs only bounded structural checks: object shape, `resourceType` syntax, optional string `id`, top-level field names/count, and warnings. It must return `validationLevel: 'structural-preview-only'`.

`buildSatusehatPreview` calls `buildEmrBundle(...)` directly and never calls `submitEmr`, `postResource`, or `getAccessToken`.

- [ ] **Step 4: Map domain errors into the existing MCP error envelope**

In `server/src/mcp/tools.ts`, add before the generic fallback:

```ts
if (error instanceof McpDomainError) {
  return { code: error.code, message: error.message, retryable: error.retryable }
}
```

Do not otherwise change the Phase A dispatcher in this task.

- [ ] **Step 5: Verify GREEN**

```bash
cd server
npx tsx uji/mcpFhir.uji.ts
npx tsx uji/fhir.uji.ts
npx tsx uji/satusehat.uji.ts
npm run typecheck
```

- [ ] **Step 6: Commit**

Commit message: `feat(mcp): add safe FHIR preview services`.

---

### Task 3: Add a bounded HL7 v2 structural parser

**Files:**
- Create: `server/src/mcp/interoperability/hl7v2.ts`
- Create: `server/uji/mcpHl7v2.uji.ts`
- Reuse: `server/src/mcp/domainError.ts`

**Supported segment scope:** `MSH`, `PID`, `PV1`, `OBR`, `OBX`. Other segment names remain visible in summary metadata but are not interpreted clinically.

**Hard bounds:**

```ts
export const HL7_LIMITS = {
  maxBytes: 128 * 1024,
  maxSegments: 512,
  maxFieldsPerSegment: 256,
  maxTextLength: 4096,
} as const
```

**Output contract:**

```ts
export interface Hl7V2Preview {
  separators: {
    field: string
    component: string
    repetition: string
    escape: string
    subcomponent: string
  }
  messageType?: string
  controlId?: string
  version?: string
  segmentCounts: Record<string, number>
  patient?: {
    identifiers: Array<{ value: string; assigningAuthority?: string }>
    name?: string
    birthDate?: string
    sex?: string
  }
  visit?: { patientClass?: string; visitNumber?: string }
  orders: Array<{ identifier?: string; universalService?: Hl7CodedValue }>
  observations: Array<{
    valueType?: string
    identifier?: Hl7CodedValue
    value?: string
    units?: Hl7CodedValue
    status?: string
  }>
  warnings: string[]
}

export interface Hl7CodedValue {
  code?: string
  display?: string
  system?: string
}
```

- [ ] **Step 1: Write failing parser tests**

Use a synthetic message with non-default field/component separators so the parser proves it reads separators from `MSH`, rather than hard-coding `|^~\\&`:

```ts
const message = [
  'MSH*$%!?*SENDER*FAC*PANACEA*FAC*20260917070000**ORU$R01*MSG-1*P*2.5.1',
  'PID*1**SYNTHETIC-001$$$PANACEA**Doe$Synthetic**19900101*M',
  'PV1*1*O',
  'OBR*1***8867-4$Heart rate$LN',
  'OBX*1*NM*8867-4$Heart rate$LN**72*/min$beats per minute$UCUM*****F',
].join('\r')
```

Tests must also prove:
- missing/invalid first `MSH` is rejected;
- bytes over 128 KiB are rejected before parsing;
- over 512 segments are rejected;
- a segment with over 256 fields is rejected;
- text is capped/rejected according to the declared limit rather than growing unbounded;
- malformed short MSH encoding characters are rejected;
- unknown segments do not become interpreted clinical objects;
- PID/OBR/OBX source code-system tokens are preserved exactly.

- [ ] **Step 2: Verify RED**

```bash
cd server
npx tsx uji/mcpHl7v2.uji.ts
```

- [ ] **Step 3: Implement MSH-derived delimiters first**

The parser must derive the field separator from character 4 of the MSH segment and the four encoding characters from MSH-2:

```ts
function readSeparators(firstSegment: string) {
  if (!firstSegment.startsWith('MSH') || firstSegment.length < 8) {
    throw new McpDomainError('unsupported_message_type', 'HL7 v2 message must begin with a valid MSH segment')
  }
  const field = firstSegment[3]
  const next = firstSegment.indexOf(field, 4)
  const encoding = next > 4 ? firstSegment.slice(4, next) : ''
  if (encoding.length < 4) {
    throw new McpDomainError('invalid_input', 'MSH-2 must declare four encoding characters')
  }
  return {
    field,
    component: encoding[0],
    repetition: encoding[1],
    escape: encoding[2],
    subcomponent: encoding[3],
  }
}
```

Do not use a regex that assumes `|` or `^`.

- [ ] **Step 4: Implement bounded segment parsing**

Normalize CRLF/LF to CR only after the byte-size check. Enforce segment and field limits before extracting any PID/PV1/OBR/OBX values. Store no more than `maxTextLength` per extracted text field.

HL7 component parsing preserves source-declared code systems:

```ts
function coded(raw: string, component: string): Hl7CodedValue {
  const [code, display, system] = raw.split(component, 3)
  return {
    code: code?.trim() || undefined,
    display: display?.trim() || undefined,
    system: system?.trim() || undefined,
  }
}
```

Do not convert `LN`, free text, or unknown systems to another vocabulary in the parser.

- [ ] **Step 5: Verify GREEN**

```bash
cd server
npx tsx uji/mcpHl7v2.uji.ts
npm run typecheck
```

- [ ] **Step 6: Commit**

Commit message: `feat(mcp): add bounded HL7 v2 parser`.

---

### Task 4: Convert bounded HL7 v2 previews to FHIR without guessing codes

**Files:**
- Create: `server/src/mcp/interoperability/hl7v2ToFhir.ts`
- Create: `server/uji/mcpHl7ToFhir.uji.ts`
- Reuse: `server/src/mcp/interoperability/hl7v2.ts`
- Reuse: `server/src/shared/fhirR4.ts`

**Output contract:**

```ts
export interface Hl7ToFhirPreview {
  bundle: Record<string, unknown>
  mapped: Array<{
    segment: string
    sourceCode?: string
    sourceSystem?: string
    targetResourceType: string
    mappingBasis: 'source-declared' | 'panacea-verified-registry'
  }>
  unmapped: Array<{
    segment: string
    code?: string
    system?: string
    reason: string
  }>
  rejected: Array<{ segment: string; reason: string }>
  warnings: string[]
}
```

- [ ] **Step 1: Write failing conversion tests**

Tests must prove:
- PID synthetic demographics create at most one FHIR `Patient` preview;
- an OBX carrying explicit `8867-4^Heart rate^LN` becomes an Observation whose coding system is `http://loinc.org` only because the message explicitly declared the LOINC alias and the code exists in Panacea's verified registry;
- `heart rate` free text with no code system never gets guessed to `8867-4`;
- an unknown code system `ZZZ` is reported in `unmapped` and never relabeled LOINC;
- a source-declared LOINC code not in the verified local registry remains visible as source-declared/unverified or unmapped; it is never claimed as Panacea-verified;
- numeric OBX values require finite numeric parsing before `valueQuantity` is emitted;
- invalid numeric values are `rejected`, not converted to zero;
- source units are preserved; UCUM system/code are emitted only when the verified mapping makes the exact unit representation safe;
- every ignored/unconvertible OBX appears in `unmapped` or `rejected` so information loss is explicit.

- [ ] **Step 2: Verify RED**

```bash
cd server
npx tsx uji/mcpHl7ToFhir.uji.ts
```

- [ ] **Step 3: Implement explicit code-system normalization only**

Use a small declared alias table, not semantic guessing:

```ts
const CODE_SYSTEM_ALIAS: Record<string, string> = {
  LN: 'http://loinc.org',
  LOINC: 'http://loinc.org',
  RXNORM: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  'RXNORM-RXCUI': 'http://www.nlm.nih.gov/research/umls/rxnorm',
}
```

Absence from this table means unsupported; it does not trigger similarity matching.

Build a lookup from the canonical shared FHIR registry:

```ts
const verifiedLoinc = new Map(
  UKURAN.filter((item) => item.loinc).map((item) => [item.loinc as string, item]),
)
```

Only an exact code match can use `mappingBasis: 'panacea-verified-registry'`.

- [ ] **Step 4: Implement a collection Bundle preview**

Use `resourceType:'Bundle'` and `type:'collection'`. This is a preview and must not include FHIR transaction `request` instructions that imply a write operation.

- [ ] **Step 5: Verify GREEN**

```bash
cd server
npx tsx uji/mcpHl7v2.uji.ts
npx tsx uji/mcpHl7ToFhir.uji.ts
npm run typecheck
```

- [ ] **Step 6: Commit**

Commit message: `feat(mcp): add fail-closed HL7 to FHIR preview`.

---

### Task 5: Add normalized medical terminology services with explicit provenance

**Files:**
- Create: `server/src/mcp/terminology/service.ts`
- Create: `server/uji/mcpTerminology.uji.ts`
- Modify: `server/src/rxnorm.ts`
- Modify: `server/uji/rxnorm.uji.ts`
- Reuse: `server/src/icd11.ts`
- Reuse: `server/src/rxclass.ts`
- Reuse: `server/src/atcDdd.ts`
- Reuse: `server/src/shared/fhirR4.ts`

**Normalized result:**

```ts
export type TerminologyMatchMode = 'exact' | 'prefix' | 'contains' | 'provider-search' | 'source-declared'

export interface NormalizedTerminologyResult {
  system: string
  code: string
  display: string
  provider: string
  source: string
  version?: string
  retrievedAt: string
  matchMode: TerminologyMatchMode
  uri?: string
  provenance: string
}
```

**Supported systems/operations in Phase B:**

- ICD search: existing `cariDiagnosis`; each result remains explicitly `icd11` or `icd10cm`.
- ICD-11 resolve: existing `rincianIcd11` for official WHO entity ID/URI when WHO credentials are configured.
- LOINC search/resolve: exact local verified registry from shared FHIR core; no external LOINC API in Phase B.
- RxNorm search: existing `cariZatAktif` for RxCUI/name identity.
- RxNorm resolve: add one exact numeric-RxCUI lookup to `rxnorm.ts` using the existing RxNav property endpoint pattern.
- ATC: expose source/version metadata, syntax validation, and caller-supplied verified-crosswalk validation only. Do not pretend the repository contains the full licensed 2026 ATC catalogue.
- SNOMED CT: explicit unsupported response in Phase B.

- [ ] **Step 1: Extend RxNorm with an exact RxCUI resolver using TDD**

First add failing tests to `server/uji/rxnorm.uji.ts` for:

```ts
resolveRxNormConcept('860975')
```

The implementation contract is:

```ts
export interface RxNormConcept {
  rxcui: string
  name: string
}

export async function resolveRxNormConcept(
  rxcui: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RxNormConcept | null>
```

Reject non-numeric RxCUI without network. For numeric identifiers, call:

```text
GET https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/property.json?propName=RxNorm%20Name
```

Use the same query cleaning, timeout style, response bounds, and error transparency as the existing RxNorm module. A 503 must surface as `rxnorm_property_503`, not an empty concept.

Run RED, implement, then GREEN:

```bash
cd server
npx tsx uji/rxnorm.uji.ts
```

- [ ] **Step 2: Write failing MCP terminology tests**

`server/uji/mcpTerminology.uji.ts` must prove:

1. local LOINC exact resolve returns source `panaceamed-verified-fhir-registry` and the correct code/display/UCUM-linked provenance;
2. LOINC search ranks exact code before display-prefix before display-contains;
3. ICD fallback from NLM remains system/source `icd10cm`, never `icd11`, when WHO is unavailable;
4. ICD-11 results carry version `2026-01` when returned by WHO;
5. RxNorm exact numeric resolve retains RxCUI identity and NLM/RxNav provenance;
6. ATC response reports `ATC_DDD_VERSION === '2026'` but does not claim a full local catalogue;
7. `verifiedAtcProductCrosswalk` is accepted only when caller supplies a plausible ATC code plus non-empty provenance; otherwise result is `unmapped`;
8. an unsupported crosswalk returns `unmapped`, not a plausible code;
9. SNOMED CT request returns `unsupported_code_system` with a clear licensing/provider boundary;
10. mocked NLM/WHO/RxNav upstream 5xx failures are normalized to `upstream_unavailable` rather than `tool_failed` or empty success.

- [ ] **Step 3: Implement terminology search**

Use explicit system names:

```ts
export type TerminologySystem = 'icd' | 'icd11' | 'icd10cm' | 'loinc' | 'rxnorm' | 'atc' | 'snomed-ct'
```

For ICD results:

```ts
const provider = item.sumber === 'icd11' ? 'WHO ICD-11 MMS' : 'NLM Clinical Tables ICD-10-CM'
const version = item.sumber === 'icd11' ? icd11Release : undefined
```

Never label fallback results as WHO/ICD-11.

For LOINC, search only `UKURAN`; derived Panaceamed codes are a different local code system and must not appear as LOINC.

For ATC free-text search, return an explicit incomplete capability result such as:

```ts
{
  complete: false,
  results: [],
  reason: 'full_atc_catalog_not_installed',
  source: ATC_DDD_SOURCE,
}
```

Do not scrape the public ATC HTML search page.

- [ ] **Step 4: Implement terminology resolve and crosswalk preview**

Crosswalk is exact/fail-closed. The only automatic Phase B crosswalks are relationships already verified in the canonical FHIR registry, such as Panaceamed measurement key ↔ exact LOINC code.

For RxNorm → ATC, the MCP may validate a caller-supplied candidate with `verifiedAtcProductCrosswalk`, but it must never discover/infer the ATC code from a drug name.

Unknown relationships return:

```ts
{
  status: 'unmapped',
  from: { system: input.fromSystem, code: input.fromCode },
  toSystem: input.toSystem,
  reason: 'no_verified_crosswalk',
}
```

- [ ] **Step 5: Normalize upstream failures**

Map known upstream error prefixes conservatively:

```ts
function upstreamError(error: unknown): McpDomainError {
  const message = error instanceof Error ? error.message : String(error)
  if (/^(who_|clinicaltables_|rxnorm_)/.test(message)) {
    return new McpDomainError('upstream_unavailable', message, true)
  }
  return new McpDomainError('upstream_unavailable', 'Terminology provider unavailable', true)
}
```

Do not include credentials or raw upstream response bodies in errors.

- [ ] **Step 6: Verify GREEN**

```bash
cd server
npx tsx uji/icd.uji.ts
npx tsx uji/rxnorm.uji.ts
npx tsx uji/rxclass.uji.ts
npx tsx uji/atcDdd.uji.ts
npx tsx uji/mcpTerminology.uji.ts
npm run typecheck
```

- [ ] **Step 7: Commit**

Commit message: `feat(mcp): add provenance-first terminology services`.

---

### Task 6: Register Phase B tools and schemas through the existing MCP kernel

**Files:**
- Create: `server/src/mcp/toolSchemas.ts`
- Modify: `server/src/mcp/serverFactory.ts`
- Modify: `server/src/mcp/registry.ts`
- Modify: `server/src/mcp/tools.ts`
- Create: `server/uji/mcpPhaseBRegistry.uji.ts`
- Modify: `server/package.json`

**Registered Phase B tools:**

```text
panacea_fhir_capabilities
panacea_fhir_build_observation_bundle_preview
panacea_fhir_inspect_resource
panacea_fhir_satusehat_preview
panacea_hl7v2_parse_preview
panacea_hl7v2_to_fhir_preview
panacea_terminology_search
panacea_terminology_resolve
panacea_terminology_crosswalk_preview
```

- [ ] **Step 1: Write the failing registry integration test**

`mcpPhaseBRegistry.uji.ts` must verify all nine names exist exactly once and that every Phase B definition declares:

- transports `stdio` and `http`;
- `sideEffect: 'none'`;
- FHIR/HL7 previews use `clinicalRisk:'clinical-preview'`;
- terminology uses `clinicalRisk:'reference'`;
- positive payload limit and timeout;
- HTTP capability discovery includes Phase B tools but still excludes local repo QA;
- no tool named or described as submit/write/sign/commit/prescribe exists.

Also execute representative tools through `executePanaceaTool` so direct dispatch and MCP transport cannot diverge.

- [ ] **Step 2: Verify RED**

```bash
cd server
npx tsx uji/mcpPhaseBRegistry.uji.ts
```

- [ ] **Step 3: Extract Zod schemas from `serverFactory.ts`**

Create `server/src/mcp/toolSchemas.ts` and move the Phase A schemas unchanged into it before adding Phase B schemas.

The public function is:

```ts
import * as z from 'zod/v4'

export type PanaceaToolInputSchema = z.ZodType

export function schemaForPanaceaTool(name: string): PanaceaToolInputSchema {
  const schema = schemaByTool[name as keyof typeof schemaByTool]
  if (!schema) throw new Error(`Missing MCP input schema for ${name}`)
  return schema
}
```

Then `serverFactory.ts` imports `schemaForPanaceaTool` rather than growing a second large schema registry.

- [ ] **Step 4: Add bounded Phase B schemas**

Use strict/object schemas and explicit caps. Examples:

```ts
const fhirObservationPreviewSchema = z.object({
  values: z.record(z.string().max(80), z.number().finite().nullable()),
  patient: z.object({
    name: z.string().max(200).optional(),
    sex: z.enum(['M', 'F']).optional(),
    birthDate: z.string().max(10).optional(),
  }).optional(),
  effectiveAt: z.string().max(64).optional(),
}).strict()

const hl7PreviewSchema = z.object({
  message: z.string().max(128 * 1024),
}).strict()

const terminologySearchSchema = z.object({
  system: z.enum(['icd', 'icd11', 'icd10cm', 'loinc', 'rxnorm', 'atc', 'snomed-ct']),
  query: z.string().max(160),
  limit: z.number().int().min(1).max(50).default(20),
}).strict()
```

The dispatcher still performs byte-limit policy checks before domain handlers. Zod is an additional shape boundary, not a replacement for domain validation.

- [ ] **Step 5: Add Phase B tool metadata to `registry.ts`**

Use these risk/timeout principles:

- pure FHIR capability/inspection: 2–3 s;
- FHIR/HL7 preview: 3–5 s;
- local LOINC/ATC reference: 2 s;
- network terminology search/resolve: 12 s;
- all Phase B tools: `sideEffect:'none'`, both transports;
- payload caps no larger than 128 KiB unless a concrete test proves a larger bound is required.

- [ ] **Step 6: Delegate from `tools.ts` to domain modules**

Do not put parsing/mapping logic into the switch. Cases only validate/route:

```ts
case 'panacea_fhir_capabilities':
  return fhirCapabilities()
case 'panacea_fhir_build_observation_bundle_preview':
  return buildObservationBundlePreview(fhirPreviewInput(input))
case 'panacea_fhir_inspect_resource':
  return inspectFhirResource(objectInput(input).resource)
case 'panacea_fhir_satusehat_preview':
  return buildSatusehatPreview(satusehatPreviewInput(input))
case 'panacea_hl7v2_parse_preview':
  return parseHl7v2Preview(requiredString(objectInput(input).message, 'message'))
case 'panacea_hl7v2_to_fhir_preview':
  return hl7v2ToFhirPreview(requiredString(objectInput(input).message, 'message'))
case 'panacea_terminology_search':
  return terminologySearch(terminologySearchInput(input))
case 'panacea_terminology_resolve':
  return terminologyResolve(terminologyResolveInput(input))
case 'panacea_terminology_crosswalk_preview':
  return terminologyCrosswalkPreview(terminologyCrosswalkInput(input))
```

If validation helpers make `tools.ts` unwieldy, create `server/src/mcp/toolInputs.ts`; do not duplicate validation inside each switch case.

- [ ] **Step 7: Extend the consolidated MCP test script**

Append the Phase B tests to `server/package.json` `uji:mcp` after the Phase A tests:

```text
mcpFhirShared.uji.ts
mcpFhir.uji.ts
mcpHl7v2.uji.ts
mcpHl7ToFhir.uji.ts
mcpTerminology.uji.ts
mcpPhaseBRegistry.uji.ts
```

- [ ] **Step 8: Verify GREEN**

```bash
cd server
npm run uji:mcp
npm run typecheck
```

Also rerun `mcpTransport.uji.ts` and `mcpMount.uji.ts` through the consolidated script to prove Phase B did not weaken HTTP default-off/auth/remote QA isolation.

- [ ] **Step 9: Commit**

Commit message: `feat(mcp): register Phase B clinical reference tools`.

---

### Task 7: Documentation, targeted CI, full regression, and stacked-PR readiness

**Files:**
- Modify: `server/src/mcp/README.md`
- Modify: `.github/workflows/mcp-phase-a.yml`
- Create: `docs/superpowers/plans/2026-09-17-panaceamed-mcp-phase-b.md` already supplied by this plan branch; keep it in the implementation branch.
- Modify only other files if verification exposes a concrete defect.

- [ ] **Step 1: Add failing documentation-boundary assertions**

Extend `server/uji/mcpPhaseBRegistry.uji.ts` to read `server/src/mcp/README.md` and require these exact concepts:

```text
Phase B
FHIR R4 preview
HL7 v2 preview
terminology provenance
No SATUSEHAT submission
No patient-record retrieval
SNOMED CT is not enabled
```

Run the test and confirm RED until README is updated.

- [ ] **Step 2: Update MCP operator documentation**

Add a Phase B table documenting all nine tools, transport exposure, clinical-risk class, upstream provider, and limitations. State explicitly:

- FHIR inspection is not a complete FHIR validator;
- HL7 conversion is a preview and reports `mapped`, `unmapped`, `rejected`;
- ICD fallback remains ICD-10-CM, never mislabeled ICD-11;
- ATC full catalogue is not bundled;
- SNOMED CT requires a separately authorized/licensed provider;
- SATUSEHAT MCP surface is preview-only;
- remote HTTP remains disabled by default.

- [ ] **Step 3: Expand the targeted MCP workflow paths and regression steps**

Modify `.github/workflows/mcp-phase-a.yml` rather than creating a second overlapping MCP workflow. Add path triggers for:

```yaml
      - 'server/src/shared/fhirR4.ts'
      - 'src/lib/fhir.ts'
      - 'server/src/icd11.ts'
      - 'server/src/rxnorm.ts'
      - 'server/src/rxclass.ts'
      - 'server/src/atcDdd.ts'
```

After `npm run uji:mcp` and `npm run typecheck`, run the existing adapter regressions:

```yaml
      - name: Interoperability and terminology regressions
        run: |
          npx tsx uji/fhir.uji.ts
          npx tsx uji/satusehat.uji.ts
          npx tsx uji/icd.uji.ts
          npx tsx uji/rxnorm.uji.ts
          npx tsx uji/rxclass.uji.ts
          npx tsx uji/atcDdd.uji.ts
```

Keep `permissions: contents: read`.

- [ ] **Step 4: Run local/branch targeted verification**

From `server/`:

```bash
npm ci
npm run uji:mcp
npm run typecheck
npx tsx uji/fhir.uji.ts
npx tsx uji/satusehat.uji.ts
npx tsx uji/icd.uji.ts
npx tsx uji/rxnorm.uji.ts
npx tsx uji/rxclass.uji.ts
npx tsx uji/atcDdd.uji.ts
npm run uji
```

From repository root:

```bash
npm run validate:source-registry
npm run validate:feature-factory
npm run validate:academic-review
npm run build
```

Do not edit a failing unrelated gate merely to obtain green. Diagnose whether it is candidate-caused, baseline, runner, or dependency-related.

- [ ] **Step 5: Open Phase B as a stacked draft PR while Phase A is open**

Implementation branch name: `feat/panacea-mcp-phase-b-20260917`.

While #1754 is still open, target:

```text
base: feat/panacea-mcp-core-20260917
head: feat/panacea-mcp-phase-b-20260917
```

PR title:

```text
feat(mcp): add FHIR HL7 and terminology Phase B
```

PR body must state that it is stacked on #1754 and must not be merged before Phase A.

- [ ] **Step 6: After Phase A merges, refresh Phase B without force**

Resolve latest `main`, verify Phase A ancestry, incorporate current `main` non-destructively, then retarget Phase B to `main`. If changed-file overlap appeared, reconcile it before rerunning CI.

Do not rely on green checks from the stacked head after the base changes.

- [ ] **Step 7: Require fresh exact-head evidence**

On the final Phase B head require:

- targeted MCP workflow green;
- server typecheck/build/tests green;
- existing FHIR/SATUSEHAT/ICD/RxNorm/RxClass/ATC tests green;
- repository **Validate pull requests** green for the exact head;
- full **Stabilization Acceptance** green for the exact head;
- Security Baseline gates green when triggered;
- latest-main overlap/ancestry audit immediately before merge.

If the PR head changes, previous green evidence is stale.

- [ ] **Step 8: Completion claim discipline**

Only report:

- `implemented=true` after all Phase B code exists;
- `tested=true` with the exact tested SHA and named checks;
- `prOpen=true` with the GitHub PR URL;
- `merged=true` only with merge evidence on the expected head;
- `deployed=true` only with runtime/deployment evidence.

Do not collapse those states into one `done` flag.

- [ ] **Step 9: Commit documentation/CI changes**

Commit message: `docs(mcp): document and gate Phase B interoperability`.

---

## Plan Self-Review Checklist

Before execution begins, verify all items below against the current repository and approved design:

- [ ] No `TBD`, `TODO`, placeholder dependency, or undefined provider remains in this plan.
- [ ] All nine Phase B tool names match the approved architecture spec.
- [ ] FHIR uses one canonical verified mapping source; no manual MCP LOINC/UCUM copy is introduced.
- [ ] SATUSEHAT MCP calls only the pure preview builder and has a network-tripwire test.
- [ ] HL7 parser reads separators from MSH and has explicit byte/segment/field/text limits.
- [ ] HL7-to-FHIR conversion never guesses a coding system and exposes all unmapped/rejected content.
- [ ] ICD-10-CM fallback cannot be labeled ICD-11.
- [ ] RxNorm remains terminology identity/reference, not interaction checking or therapeutic equivalence.
- [ ] ATC full catalogue is not fabricated or scraped; crosswalk validation requires caller-supplied authoritative provenance.
- [ ] SNOMED CT remains disabled without an authorized/licensed provider.
- [ ] All Phase B remote tools are side-effect free and patient-datastore retrieval remains absent.
- [ ] Phase A transport/auth/QA-isolation tests remain in the consolidated test run.
- [ ] Phase B stays stacked until #1754 merges, then gets fresh latest-main/exact-head validation.
