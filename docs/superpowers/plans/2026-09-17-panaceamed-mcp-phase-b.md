# Panaceamed MCP Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe FHIR R4 / HL7 v2 preview tools and fail-closed medical terminology tools to the Panaceamed MCP kernel without exposing patient-store retrieval or clinical submission actions.

**Architecture:** Extend the existing Phase A MCP registry/dispatcher with two focused pure-domain modules: `interoperability.ts` and `terminology.ts`. Interoperability performs structural FHIR inspection, SATUSEHAT bundle preview via the existing pure `buildEmrBundle`, bounded HL7 v2 parsing, and preview-only HL7→FHIR conversion. Terminology wraps existing ICD-11/ICD-10-CM, RxNorm and ATC/DDD boundaries while preserving provider/version provenance and refusing guessed crosswalks.

**Tech Stack:** TypeScript 5.6, Node.js >=20, existing Panaceamed server modules, MCP Phase A kernel, deterministic `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-09-17-panaceamed-mcp-orchestration-design.md`

## Global Constraints

- Dependency base is exact Phase A head `5dd989e5b6fedc7673ae7bce050a80785c42f370` until Phase A merges.
- Do not push directly to `main`; this Phase B branch is stacked on the reviewed Phase A dependency branch.
- Remote tools are preview/reference only; no SATUSEHAT submission, EMR signing, medication/order commit, arbitrary datastore retrieval, or patient-specific diagnosis/treatment.
- HL7 parsing is bounded and supports only `MSH`, `PID`, `PV1`, `OBR`, and `OBX` for preview conversion.
- Unknown HL7 coding systems remain explicit and unmapped; never guess LOINC/SNOMED/ICD mappings.
- Terminology results always preserve source/provider/version identity; ICD-10-CM fallback must never be labeled ICD-11.
- SNOMED CT remains unsupported until an authorized/licensed terminology service is configured.
- Crosswalks fail closed: no verified relationship means `unmapped`.
- Code comments follow the repository convention: Indonesian. User-facing MCP titles/descriptions remain English.

---

### Task 1: RED gates for Phase B contracts

**Files:**
- Create: `server/uji/mcpInteroperability.uji.ts`
- Create: `server/uji/mcpTerminology.uji.ts`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: Phase A `createPanaceaToolRegistry()` and `executePanaceaTool()`.
- Produces: executable RED tests that require all Phase B tool names and domain behavior before any production implementation exists.

- [ ] **Step 1: Write failing interoperability tests**

Test the required registry names, FHIR structural inspection, `buildEmrBundle` preview-only behavior, non-finite observation omission, custom MSH separators, bounded malformed-message rejection, unknown-code-system preservation, and HL7→FHIR unmapped reporting.

- [ ] **Step 2: Write failing terminology tests**

Test normalized provider/source identity, ICD fallback identity preservation, ATC plausibility-only resolution, verified LOINC/UCUM lookup, and fail-closed unknown crosswalks without requiring live upstream network access.

- [ ] **Step 3: Add both tests to `npm run uji:mcp`**

Append `tsx uji/mcpInteroperability.uji.ts && tsx uji/mcpTerminology.uji.ts` after the existing Phase A MCP suite.

- [ ] **Step 4: Run exact-head MCP CI and record RED evidence**

Expected failure: missing Phase B modules/tool definitions/handlers. Do not implement production code until this RED state is observed.

### Task 2: Interoperability domain

**Files:**
- Create: `server/src/mcp/interoperability.ts`
- Modify: `server/src/mcp/registry.ts`
- Modify: `server/src/mcp/tools.ts`

**Interfaces:**
- Produces: `inspectFhirResource(input)`, `buildSatusehatPreview(input)`, `parseHl7v2Preview(message)`, `hl7v2ToFhirPreview(message)`, and a bounded observation-bundle preview builder.
- Reuses: `buildEmrBundle()` from `server/src/satusehat.ts`; no import of `submitEmr()` or `postResource()`.

- [ ] **Step 1: Implement the minimal structural FHIR inspector**

Accept only object resources with a syntactically valid `resourceType`; report resource type, Bundle type/count when present, warnings, and an explicit `fullValidator: false` boundary.

- [ ] **Step 2: Implement SATUSEHAT preview wrapper**

Call only `buildEmrBundle(patient, record, practitionerName, deterministic options when supplied)` and return the bundle plus summary. No network dependency is accepted by this API.

- [ ] **Step 3: Implement bounded HL7 v2 parser**

Limits: 128 KiB message bytes, 256 segments, 256 fields per segment, 4096 characters per field. Require `MSH` first, honor `MSH-1` field separator and `MSH-2` encoding characters, normalize CR/LF segment endings, retain only supported segment structures, and record unsupported segments as warnings rather than silently reinterpreting them.

- [ ] **Step 4: Implement preview-only HL7→FHIR conversion**

Map PID demographics only when structurally present. Convert OBX into Observation previews. Treat `LN`/`LOINC` as LOINC only when the source explicitly declares it; preserve any other coding system in `unmapped` with its original code/system/text. Numeric OBX values become quantities only when finite; otherwise keep text. Return `mapped`, `unmapped`, and `warnings` collections.

- [ ] **Step 5: Register and dispatch required tools**

Add:
- `panacea_fhir_capabilities`
- `panacea_fhir_build_observation_bundle_preview`
- `panacea_fhir_inspect_resource`
- `panacea_fhir_satusehat_preview`
- `panacea_hl7v2_parse_preview`
- `panacea_hl7v2_to_fhir_preview`

All are `sideEffect: none`, remote-eligible, and `clinicalRisk: clinical-preview` except capabilities (`reference`).

- [ ] **Step 6: Run interoperability test and Phase A regression suite**

Expected: `mcpInteroperability.uji.ts` green and all pre-existing `uji:mcp` tests remain green.

### Task 3: Terminology domain

**Files:**
- Create: `server/src/mcp/terminology.ts`
- Modify: `server/src/rxnorm.ts`
- Modify: `server/src/mcp/registry.ts`
- Modify: `server/src/mcp/tools.ts`

**Interfaces:**
- Produces normalized `TerminologyResult` records with `system`, `code`, `display`, `provider`, `version`, `source`, and `matchMode`.
- Reuses: `cariDiagnosis`, `rincianIcd11`, `icd11Release`; RxNorm REST boundary; `ATC_DDD_SOURCE`, `isPlausibleAtcCode`; the existing verified LOINC/UCUM registry values.

- [ ] **Step 1: Add a reusable RxNorm concept resolver under TDD**

Expose canonical RxCUI + RxNorm name from the same bounded NLM requests already used by `normalizeDrugName`. Keep drug interaction/therapeutic equivalence explicitly out of scope.

- [ ] **Step 2: Implement normalized terminology search**

Provider modes: `icd`, `rxnorm`, `atc`, `loinc`. ICD uses the existing fallback path and maps `sumber` truthfully. RxNorm returns RxCUI. ATC accepts only syntactically plausible explicit ATC codes because no licensed bulk catalog is bundled. LOINC searches only the verified local registry.

- [ ] **Step 3: Implement terminology resolve**

Resolve explicit ICD-11 entity IDs where available, RxCUI through the new RxNorm resolver, ATC codes only as structurally recognized/source-attributed codes, and verified LOINC entries. Return `unmapped` instead of inventing missing terminology.

- [ ] **Step 4: Implement fail-closed crosswalk preview**

Only relationships explicitly encoded in Panaceamed may return `verified`; every other request returns `unmapped` with the original source/target systems intact.

- [ ] **Step 5: Register and dispatch required tools**

Add:
- `panacea_terminology_search`
- `panacea_terminology_resolve`
- `panacea_terminology_crosswalk_preview`

All are remote-eligible, side-effect free, and `clinicalRisk: reference`.

- [ ] **Step 6: Run terminology test and existing ICD/RxNorm/ATC regression tests**

Run the Phase B deterministic test plus `uji:icd`, `uji:rxnorm`, and `uji:atc-ddd` where CI exposes them.

### Task 4: Documentation, exact-head verification, and stacked PR

**Files:**
- Modify: `server/src/mcp/README.md`

**Interfaces:**
- Consumes: complete Phase B implementation.
- Produces: operator-visible capability/safety documentation and a reviewable stacked PR.

- [ ] **Step 1: Document Phase B tools and safety boundaries**

State explicitly: structural FHIR inspection is not full FHIR validation; SATUSEHAT MCP is preview-only; HL7 conversion is partial/bounded and reports unmapped data; terminology crosswalks never guess; SNOMED remains unsupported without an authorized service.

- [ ] **Step 2: Run exact-head checks**

Required minimum checks on the final Phase B head: `npm --prefix server run uji:mcp`, `npm --prefix server run typecheck`, `npm --prefix server run build`, plus existing focused FHIR/ICD/RxNorm/ATC/SATUSEHAT tests. Repository-wide Validate + Stabilization Acceptance remain required before any eventual merge after the Phase A dependency is integrated.

- [ ] **Step 3: Open/update one draft stacked PR**

Base the PR on `feat/panacea-mcp-core-20260917` while Phase A is unmerged. Do not retarget to `main` until Phase A lands and the branch is refreshed/revalidated.

- [ ] **Step 4: Final safety audit**

Search the Phase B diff to confirm no calls to `submitEmr`, `postResource`, patient datastore reads, arbitrary shell execution, SNOMED guessing, or direct-main Git mutations were introduced.
