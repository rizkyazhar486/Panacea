# Panaceamed MCP Orchestration Architecture

Date: 2026-09-17  
Status: design approved in chat; written-spec review required before implementation  
Base: `main@2aa72e35592d9616f8d84997c064c571b1bd1304`

## 1. Purpose

Build one project-owned Model Context Protocol (MCP) layer that lets ChatGPT and Claude Code use Panaceamed capabilities through stable, typed, auditable tools without creating a second clinical source of truth.

The MCP layer covers five domains:

1. FHIR R4 / HL7 v2 interoperability previews;
2. medical terminology resolution;
3. evidence retrieval and ingestion metadata;
4. autonomous repository QA under a strict command allowlist;
5. structured ChatGPT <-> Claude Code orchestration and handoff.

The MCP is an orchestration and adaptation layer. Existing Panaceamed modules remain authoritative for the clinical and repository behavior they already implement.

## 2. Existing capabilities to reuse

The repository already contains foundations that must be wrapped rather than reimplemented:

- `src/lib/fhir.ts`: FHIR R4 export with verified LOINC/UCUM mappings and explicit local coding for derived values;
- `server/src/satusehat.ts`: conservative SATUSEHAT FHIR R4 preview/submission boundary;
- `server/src/icd11.ts`: version-pinned WHO ICD-11 search with explicit ICD-10-CM fallback provenance;
- `server/src/rxnorm.ts`, `rxclass.ts`, `atcDdd.ts`, `openfda.ts`, `drugInfo.ts`: medication terminology/evidence adapters;
- `server/src/pubmed.ts`: bounded live PubMed retrieval;
- repository source-registry, academic-review, deterministic QA, and stabilization gates;
- `CLAUDE.md` and `AGENTS.md`: mandatory multi-agent Git/CI policy.

MCP code must never silently fork these rules.

## 3. Architecture decision

Use a shared MCP domain registry under `server/src/mcp/` with two transports over the same tool definitions:

- **stdio** for local Claude Code and other local MCP hosts;
- **Streamable HTTP** for explicitly configured remote clients such as ChatGPT/custom connectors.

Implementation uses the current stable MCP TypeScript SDK v2 package split (`@modelcontextprotocol/server` plus the Node transport package) and the 2026-07-28 protocol line. Before dependency installation, Context7 and the official SDK documentation are rechecked for the current package/API names so code follows the installed SDK rather than model memory.

Transport code contains no clinical mapping logic. Tool handlers call domain services, and domain services call existing Panaceamed modules.

```text
ChatGPT / remote MCP host ---- Streamable HTTP ----\
                                                > Tool registry -> domain services -> existing Panacea modules
Claude Code / local host -------- stdio ----------/
```

## 4. Trust zones and safety boundary

### 4.1 Remote MCP

Remote MCP is disabled by default.

Phase A private/single-user HTTP configuration is explicit:

- `PANACEA_MCP_HTTP_ENABLED=false` by default;
- when enabled, `PANACEA_MCP_HTTP_TOKEN` is mandatory and must contain at least 32 characters;
- requests without `Authorization: Bearer <token>` are rejected before tool dispatch;
- `PANACEA_MCP_HTTP_HOST` defaults to `127.0.0.1`; a non-loopback bind must be explicitly configured and placed behind TLS/reverse-proxy protection;
- the MCP route receives its own request-size bound and rate limit;
- the token is read only from the server environment and is never returned by any tool or audit event.

This private bearer gate is not claimed to implement the full MCP OAuth authorization profile. Public or multi-user Internet exposure is prohibited until a separate standards-conformant OAuth/authorization design is implemented and reviewed.

Initial HTTP tool exposure is limited to low-side-effect operations: capability discovery, terminology lookup, PubMed metadata search, evidence metadata normalization, caller-supplied FHIR/HL7 preview, and orchestration packet generation.

Remote MCP must not expose:

- arbitrary shell execution;
- filesystem traversal;
- Git push/merge/force-push;
- SATUSEHAT submission;
- autonomous EMR signing, medication commit, order commit, diagnosis, or treatment;
- unrestricted retrieval of patient records from the Panaceamed datastore.

Patient-specific datastore access through MCP requires a later dedicated authorization/consent design and is out of scope.

### 4.2 Local stdio MCP

Local stdio may expose repository QA tools because it runs on a user-controlled development machine. It still uses an explicit allowlist and never accepts arbitrary command strings.

### 4.3 Audit

Every MCP tool declares:

- tool name and version;
- domain;
- transport eligibility;
- side-effect class (`none`, `local-read`, `local-test`);
- clinical-risk class;
- input-size limit;
- timeout;
- provenance requirements.

Audit logs exclude secrets and raw patient payloads. For caller-supplied clinical payloads, audit only safe metadata such as resource/message type, byte size, outcome, and stable request identifier.

## 5. MCP kernel

Create small, isolated units:

- `types.ts`: shared envelopes, provenance, risk metadata, result/error shapes;
- `registry.ts`: canonical tool registry;
- `policy.ts`: transport/risk/side-effect authorization;
- `serverFactory.ts`: build an MCP server from the registry;
- `stdio.ts`: stdio entrypoint;
- `http.ts`: Streamable HTTP integration entrypoint/middleware;
- `audit.ts`: safe execution audit records;
- domain directories for interoperability, terminology, evidence, repo QA, and orchestration.

Tools return a common envelope containing `ok`, `data` or structured error, provenance, warnings, and execution metadata. Expected upstream failures are data, not uncaught process crashes.

No MCP tool may have an undocumented side effect.

## 6. FHIR R4 and HL7 v2 domain

### 6.1 FHIR principles

The MCP reuses existing verified Panaceamed mappings. It does not invent new LOINC, UCUM, ICD, SNOMED CT, or SATUSEHAT identifiers.

Derived Panaceamed scores remain locally coded unless a mapping is explicitly verified and added through the existing evidence/review process.

Initial FHIR tools operate on caller-supplied data or safe preview builders. They do not fetch arbitrary patient records.

Required tools:

- `panacea_fhir_capabilities`;
- `panacea_fhir_build_observation_bundle_preview`;
- `panacea_fhir_inspect_resource`;
- `panacea_fhir_satusehat_preview`.

`panacea_fhir_satusehat_preview` calls the existing `buildEmrBundle` preview builder only. It must never call `postResource`, `submitEmr`, or any network submission path.

`inspect` is deliberately not called a full standards validator. A future official/full FHIR validator integration requires a separate implementation decision.

### 6.2 HL7 v2 principles

Add a bounded structural parser for common inbound message segments. The first implementation supports `MSH`, `PID`, `PV1`, `OBR`, and `OBX`, with conversion focused on demographics and observation previews.

The parser must:

- honor separators declared in `MSH`;
- bound message bytes, segment count, field count, and text length;
- preserve the original code system when present;
- never convert an unknown code system to LOINC by guess;
- distinguish `mapped`, `unmapped`, and `rejected` fields;
- preserve source message metadata and warnings;
- perform no clinical action.

Required tools:

- `panacea_hl7v2_parse_preview`;
- `panacea_hl7v2_to_fhir_preview`.

Conversion output contains the FHIR preview plus an `unmapped` collection so information loss is visible.

## 7. Medical terminology domain

Expose one normalized contract while keeping provider identity visible.

Required tools:

- `panacea_terminology_search`;
- `panacea_terminology_resolve`;
- `panacea_terminology_crosswalk_preview`.

Initial providers:

- WHO ICD-11 MMS through the existing version-pinned module;
- NLM ICD-10-CM fallback with explicit source identity;
- RxNorm / RxClass through existing modules;
- ATC/DDD through existing modules;
- verified Panaceamed LOINC/UCUM registry entries already used by FHIR export.

Normalized results carry `system`, `code`, `display`, provider/source, version when known, retrieval timestamp, and match mode. A fuzzy text match is not clinical confidence.

Crosswalk behavior is fail-closed. If Panaceamed has no verified relationship, return `unmapped`; do not generate a plausible-looking code.

Full SNOMED CT terminology service is explicitly unsupported until an authorized/licensed provider is configured.

## 8. Evidence domain and plugin boundary

MCP must not pretend that an LLM is an evidence source.

The evidence domain has two roles:

1. directly reuse Panaceamed server retrieval where already implemented, beginning with PubMed;
2. accept normalized metadata from specialist ChatGPT plugins/connectors without coupling the MCP server to the ChatGPT plugin runtime.

Consensus, Elicit, Scite, Sider Scholar, PubMed connectors, Scholar Gateway, and other ChatGPT tools are invoked by ChatGPT outside the Panaceamed server. Their results can be converted to a common evidence envelope and passed into MCP normalization/review tools.

Required tools:

- `panacea_evidence_search_pubmed`;
- `panacea_evidence_normalize`;
- `panacea_evidence_dedupe`;
- `panacea_evidence_build_review_packet`.

Evidence records contain source provider, PMID/DOI when available, title, authors, journal/source, publication year/date, URL, retrieval time, evidence role, and provenance. Missing identifiers are never fabricated.

Deduplication priority:

1. normalized DOI;
2. PMID;
3. conservative normalized title + year fallback.

Conflicting records are preserved and reported, not silently merged.

Full-text copyrighted papers are not copied into the repository by this layer. The evidence path stores/returns metadata, short user-supplied notes, and source links/identifiers needed for the existing Academic Accuracy Gate.

## 9. Repository QA domain

Repository QA is local-stdio-only in the initial implementation.

Required tools:

- `panacea_repo_snapshot`;
- `panacea_repo_qa_plan`;
- `panacea_repo_qa_run`;
- `panacea_repo_handoff_summary`.

`panacea_repo_qa_run` accepts one of these exact named profiles and never accepts a shell command:

- `server_typecheck` -> `npm --prefix server run typecheck`;
- `mcp_targeted` -> `npm --prefix server run uji:mcp`;
- `root_validators` -> sequentially run `npm run validate:source-registry`, `npm run validate:feature-factory`, and `npm run validate:academic-review`;
- `root_build` -> `npm run build`;
- `server_full_tests` -> `npm --prefix server run uji`.

Implementation resolves the repository root once, spawns executables without `shell: true`, uses fixed argument arrays, applies per-profile timeouts, caps captured output, and rejects unknown profiles. No user-provided command or argument interpolation is permitted.

The MCP must not expose `push_main`, `force_push`, direct merge, validator bypass, or test-disabling operations.

GitHub remains the source of truth for branch/PR/CI state. ChatGPT continues using the GitHub connector for authoritative remote repo actions and CI evidence rather than embedding GitHub credentials in this MCP server.

## 10. ChatGPT <-> Claude Code orchestration

The orchestration layer produces deterministic coordination packets. It does not claim agents are communicating unless a packet is actually persisted/transferred by an available connector or local bridge.

### Task packet

Required fields:

- `taskId`;
- objective;
- owner (`chatgpt`, `claude-code`, or explicit other agent);
- base main SHA;
- branch;
- scoped paths;
- acceptance criteria;
- required tests/gates;
- clinical/evidence review requirements;
- blockers/dependencies;
- creation/update timestamps.

### Handoff packet

Required fields:

- task packet reference;
- work completed;
- changed paths;
- commands/tests actually run;
- observed failures;
- unresolved risks;
- evidence/provenance notes;
- next permitted action.

### Completion packet

Required fields:

- tested head SHA when applicable;
- exact checks observed;
- merge/deployment evidence when supplied;
- explicit state flags for `implemented`, `tested`, `prOpen`, `merged`, and `deployed`.

Required tools:

- `panacea_orchestration_create_task`;
- `panacea_orchestration_create_handoff`;
- `panacea_orchestration_check_claim`;
- `panacea_orchestration_verify_completion_evidence`.

Persistence remains outside the pure packet builder in phase one. ChatGPT may persist coordination through GitHub issues/PR comments using the GitHub connector. Claude Code may consume the packet through its MCP connection, a local file handoff, or GitHub context. No new orchestration database is introduced.

## 11. Optimal plugin/connector usage

The MCP is one member of the toolchain, not a replacement for specialist connectors.

Responsibility split:

- **GitHub**: authoritative branches, PRs, changed-file overlap, CI, merge evidence;
- **Remote Desktop Commander**: explicitly authorized local filesystem/terminal operations when its device is online;
- **Context7**: current SDK/library documentation during implementation;
- **PubMed / Consensus / Elicit / Scite / Sider Scholar / Scholar Gateway**: literature discovery and citation context;
- **Supabase**: only when Panaceamed application data legitimately lives there; MCP does not create a parallel patient store;
- **Render / Vercel / AppDeploy**: deployment and runtime evidence;
- **PostHog**: product/runtime analytics and error insight;
- **Prompt Perfect**: reusable prompt/workflow quality, not clinical truth;
- **Resend**: transactional email infrastructure, unrelated to evidence validity;
- **Metricool**: growth/social operations, outside MCP clinical core.

ChatGPT is the cross-tool orchestrator. Claude Code is the repository implementation worker. Neither receives permission to bypass repository policy.

## 12. Error model

Domain errors use stable codes:

- `invalid_input`;
- `payload_too_large`;
- `unsupported_message_type`;
- `unsupported_code_system`;
- `unmapped_terminology`;
- `upstream_timeout`;
- `upstream_unavailable`;
- `policy_denied`;
- `qa_profile_not_allowed`;
- `clinical_action_not_exposed`.

Responses distinguish errors, warnings, and partial results. A partial terminology or HL7 mapping must never be presented as complete.

## 13. Testing strategy

Implementation follows test-driven development.

Required deterministic coverage:

### MCP kernel

- every registered tool declares risk/transport metadata;
- HTTP policy rejects local-only tools;
- HTTP startup refuses to enable without a valid private token;
- unknown tools/profiles fail closed;
- audit redaction does not retain raw clinical payloads or secrets.

### FHIR/HL7

- existing FHIR derived-value/local-code invariants remain intact;
- empty/NaN values never become clinical zeros;
- SATUSEHAT MCP preview cannot reach a network submission function;
- HL7 separators are parsed from MSH;
- unknown coding systems remain explicit/unmapped;
- oversized/malformed messages are rejected deterministically;
- HL7-to-FHIR conversion reports all unmapped segments/fields.

### Terminology

- provider/version identity is preserved;
- ICD fallback is never mislabeled as ICD-11;
- crosswalk does not guess unknown mappings;
- mocked upstream failures produce structured errors.

### Evidence

- DOI/PMID normalization and dedupe are deterministic;
- missing DOI/PMID is not fabricated;
- conflicting metadata remains visible;
- review packets retain source provenance.

### Repo QA

- arbitrary commands are impossible through the tool schema;
- only exact named profiles execute;
- fixed executable/argument arrays are used;
- timeout/output limits work;
- HTTP transport cannot invoke QA execution.

### Orchestration

- packets require base SHA, scope, acceptance criteria, and evidence state;
- completion verification rejects claims not supported by supplied evidence;
- `implemented`, `tested`, `prOpen`, `merged`, and `deployed` cannot collapse into one boolean.

Full repository gates remain required at PR merge boundaries according to `CLAUDE.md` and `AGENTS.md`.

## 14. Delivery decomposition

The system is delivered as multiple coherent PRs to reduce blast radius and overlap with concurrent work.

### Phase A — MCP foundation + orchestration + repo QA

Deliver shared registry/policy/audit, stdio transport, private disabled-by-default Streamable HTTP transport, orchestration packet builders, local QA allowlist, tests, package scripts, and operator documentation.

This is the first implementation plan after this written spec is approved.

### Phase B — FHIR/HL7 + terminology adapters

Reuse FHIR/SATUSEHAT/ICD/RxNorm/ATC modules, add bounded HL7 parser/preview conversion, normalized terminology tools, and safety tests.

### Phase C — evidence bridge

Wrap PubMed, add normalized evidence records/dedupe/review packets, and document the external plugin-to-MCP ingestion boundary.

Each phase starts from a fresh/latest safe `main` or an explicitly reviewed dependency base, checks active PR overlap, and ships through its own exact-head gates.

## 15. Definition of done

The overall MCP initiative is complete only when:

- Claude Code can connect through stdio to the shared Panaceamed tool registry;
- the private authenticated Streamable HTTP transport exposes only HTTP-safe tools when explicitly enabled;
- FHIR/HL7 previews never fabricate clinical coding;
- terminology results preserve provider/version/provenance and fail closed on unverified crosswalks;
- evidence packets preserve identifiers and source provenance without invented citations;
- repository QA cannot execute arbitrary shell commands and cannot mutate `main`;
- ChatGPT/Claude handoffs distinguish planning, implementation, testing, PR, merge, and deployment evidence;
- new MCP tests pass;
- existing repository validators and required exact-head merge gates remain intact;
- documentation states patient-data, public-exposure, and clinical-action boundaries explicitly.

## 16. Explicit non-goals

This design does not authorize:

- autonomous diagnosis or treatment;
- autonomous EMR signing/order/medication commits;
- full SNOMED CT service without licensed/authorized terminology infrastructure;
- full HL7 v2 conformance certification;
- claiming a lightweight resource inspector is an official FHIR validator;
- storing patient records in a new MCP database;
- arbitrary remote shell/filesystem access;
- public/multi-user MCP exposure under the private bearer-token phase;
- direct writes or force pushes to `main`;
- weakening CI, academic review, security, or biomedical gates.
