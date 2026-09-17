# Panaceamed Capability OS — Design Specification

**Date:** 2026-09-17  
**Status:** Approved architecture; implementation requires a separate plan and TDD cycle  
**Repository policy:** `CLAUDE.md` and `AGENTS.md` remain authoritative

## 1. Purpose

Panaceamed is developed by a solo founder using multiple AI agents, project skills, plugins/connectors, repository automation, browser tools, and external evidence systems. The problem is no longer lack of tools; it is choosing the correct tool, preventing duplicated work, preserving safety boundaries, and producing verifiable handoffs.

The Capability OS is a project-scoped orchestration layer that converts a task into a deterministic execution route:

`task → domain → risk → lane → executor → primary skill → primary capability → fallback → verification → handoff`

It does not replace ChatGPT, Claude Code, MCP, GitHub, or plugins. It defines how they cooperate.

## 2. Non-goals

The Capability OS does not:

- bypass `CLAUDE.md` / `AGENTS.md` Git, CI, biomedical, or security rules;
- push directly to `main`, force merge, or treat stale CI as valid evidence;
- create a second source of truth for repository state;
- store plugin OAuth tokens or secrets in the repository;
- claim a plugin is connected merely because it exists in the manifest;
- assume ChatGPT and Claude Code have identical tools or plugin runtimes;
- make autonomous clinical decisions, sign EMRs, submit orders, prescribe treatment, or submit SATUSEHAT records;
- duplicate provider-specific APIs already implemented by Panaceamed;
- run every available tool for every task;
- make prototype platforms such as Floot or Replit production authorities.

## 3. Architectural choice

### Chosen: repository-defined Capability OS with runtime availability resolution

The repository contains a machine-readable capability manifest plus project skills that interpret it. ChatGPT and Claude Code read the same routing contract. MCP Phase B may expose the same manifest later, but MCP is a consumer of the Capability OS rather than its owner.

This keeps policy reviewable in Git while allowing plugin connectivity, permissions, and runtime availability to remain dynamic.

### Rejected: instructions only

Adding more prose to every skill is simple but creates duplicated routing rules, inconsistent fallbacks, and drift between agents.

### Rejected: MCP-only routing

Putting all orchestration directly inside MCP would over-couple tool selection, clinical adapters, repository automation, and transport logic. It would also enlarge the scope of the current MCP Phase A PR.

## 4. Source-of-truth hierarchy

The Capability OS uses explicit ownership boundaries:

1. `CLAUDE.md` + `AGENTS.md` — repository policy and safety authority.
2. GitHub `main` — repository source of truth.
3. Capability manifest — routing and tool ownership contract.
4. Project skills — reusable judgment/workflow instructions.
5. Runtime connector discovery — current plugin/tool availability and permissions.
6. Execution evidence — CI, browser artifacts, deployment records, scientific sources, or provider responses.

A lower layer cannot override a higher layer.

## 5. Capability manifest

Canonical files:

- `config/capability-os.json`
- `config/capability-os.schema.json`

The manifest contains logical capabilities, not account-specific connection state. It begins with `schemaVersion: 1` and a `capabilities` array.

Each capability entry has this shape:

```json
{
  "id": "research.biomedical.pubmed",
  "lane": "biomedical-evidence",
  "domains": ["medicine", "evidence"],
  "preferredExecutor": "chatgpt",
  "supportedExecutors": ["chatgpt"],
  "primary": "pubmed",
  "fallbacks": ["consensus", "elicit", "scite", "sider-scholar"],
  "skill": "panacea-medical-evidence-validator",
  "risk": "clinical-reference",
  "sideEffects": "read-only",
  "parallelizable": true,
  "writeAuthority": "none",
  "requiredEvidence": ["source-identity", "retrieval-date", "citation"],
  "stopCondition": "sufficient-authoritative-evidence"
}
```

Required fields:

- `id`: stable logical identifier.
- `lane`: exactly one execution lane.
- `domains`: one or more routing domains.
- `preferredExecutor`: `chatgpt`, `claude-code`, or `either`.
- `supportedExecutors`: non-empty subset of `chatgpt`, `claude-code`.
- `primary`: preferred provider/tool class.
- `fallbacks`: ordered provider/tool classes.
- `skill`: project skill that supplies judgment rules; `null` only for purely mechanical capabilities.
- `risk`: one of `routine`, `security`, `privacy`, `clinical-reference`, `clinical-high-risk`, `deployment`, `financial`.
- `sideEffects`: `read-only`, `local-change`, `remote-change`, or `production-change`.
- `parallelizable`: whether independent instances can run in parallel when ownership checks pass.
- `writeAuthority`: `none`, `branch-only`, `external-draft`, or `approved-production`.
- `requiredEvidence`: explicit proof required before completion claims.
- `stopCondition`: deterministic condition that prevents unnecessary additional tool calls.

`preferredExecutor` must be compatible with `supportedExecutors`; `either` requires both executors to be supported.

The manifest must not include credentials, tokens, private health data, private financial data, plugin permission state, or plugin connection state.

## 6. Six execution lanes

### 6.1 Engineering

Purpose: implementation, debugging, code review, repository operations, dependency/API documentation.

Primary components:

- Claude Code — implementation worker when local/project tooling is available.
- ChatGPT + Superpowers — planning, TDD, debugging, verification, review orchestration.
- GitHub — repository state, PR, CI, branch and evidence authority.
- Context7 — current library/API documentation.
- Remote Desktop Commander — authorized local terminal/filesystem when available.

Fallback rules:

- No local shell available → use branch-safe GitHub/CI workflows where possible.
- API uncertainty → Context7 before guessing.
- Runtime/browser uncertainty → Browser/QA lane rather than static inference.

### 6.2 Biomedical Evidence

Purpose: authoritative biomedical retrieval, synthesis, provenance and claim verification.

Primary hierarchy by task:

- PubMed / official life-science or regulatory connector for authoritative source retrieval.
- DailyMed / openFDA / RxNorm / ClinicalTrials.gov and other official connectors when their domain matches the claim.
- Consensus / Elicit / Scite / Sider Scholar / Scholar Gateway for discovery, synthesis, citation context, or cross-checking.
- Firecrawl only for public sources not better served by an authoritative biomedical connector.

Rules:

- An LLM is never the evidence source.
- High-risk clinical content cannot be promoted to qualified-human-reviewed state by this lane.
- Multiple scholar tools are not called by default; corroboration is triggered by ambiguity, conflict, novelty, or high clinical risk.
- If an evidence connector exists only in ChatGPT, ChatGPT retrieves and packages evidence; Claude Code consumes the evidence handoff rather than pretending the connector exists locally.

### 6.3 UX / Visual

Purpose: product design, interaction patterns, scientific visuals and media assets.

Primary components:

- Product Design / Mobbin — UX research and product pattern references.
- Figma — editable product design artifacts.
- BioRender — scientific figures.
- Canva — general branded assets.
- Runway / invideo / Remotion templates — video/media when explicitly useful.

Rules:

- Product UI implementation remains in the codebase; design tools do not become source of truth for application behavior.
- Body Exposure biomedical visuals retain repository provenance and anatomical accuracy gates.

### 6.4 Browser / QA

Purpose: validate what users actually see and interact with.

Primary components:

- TinyFish — remote browser workflows when suitable.
- Opera Browser Connector — user-authorized current-tab inspection/navigation.
- Remote Desktop Commander — local browser/dev-server execution when available.
- Repository Playwright/browser smoke workflows — merge evidence authority.

Rules:

- User-visible changes use 390x844 verification when repository tooling supports it.
- Body/3D changes preserve WebGL/render artifact checks.
- Browser QA cannot replace deterministic unit/type/build checks.

### 6.5 Release / Infrastructure

Purpose: deployment, runtime health, data/backend infrastructure and release evidence.

Canonical ownership:

- Supabase — database/auth/storage/backend services already owned by Supabase.
- Vercel — frontend/edge deployment when the project uses Vercel.
- Render — backend/runtime deployment when the project uses Render.
- AppDeploy — release QA, deployment snapshots, secrets/domain workflow when its capability is specifically needed.
- PostHog — product analytics, errors, flags and experiments; not deployment authority.
- Resend — transactional email delivery.
- Stripe — payments.

Prototype-only:

- Replit and Floot may be used for isolated prototypes or experiments, never as an implicit replacement production stack.

Rules:

- One provider owns one production responsibility at a time.
- Deployment tools must not create competing copies of production without an explicit migration task.

### 6.6 Growth / Operations

Purpose: organic discovery, content operations, founder knowledge, customer workflow and lightweight business operations.

Primary components:

- GSC Wizard — Search Console/SEO performance.
- Metricool — social scheduling and social analytics.
- HubSpot — CRM/support when needed.
- Airtable — structured operational records when needed.
- Notion — durable structured product/research documentation.
- Mem — unstructured founder knowledge and recall.
- Circleback — meeting/transcript context when meetings exist.

Rules:

- Solo-founder workflow should not introduce team collaboration software without a concrete need.
- Operational systems do not become the code or clinical source of truth.

## 7. Capability selection algorithm

The router evaluates candidates in this order:

1. **Policy eligibility** — reject any candidate conflicting with `CLAUDE.md`, `AGENTS.md`, privacy, clinical, or security boundaries.
2. **Domain fit** — prefer the narrowest capability that directly owns the task.
3. **Executor fit** — choose a supported executor; prefer `preferredExecutor` when available.
4. **Authority** — authoritative provider beats general-purpose search or synthesis where applicable.
5. **Availability** — executor runtime must verify the plugin/tool is currently available and connected before execution.
6. **Side-effect fit** — prefer read-only over write tools unless a write is required.
7. **Cost/context fit** — use the smallest sufficient set of tools.
8. **Evidence fit** — candidate must be capable of producing the required completion evidence.
9. **Fallback** — use the next manifest fallback only if the primary is unavailable, fails, or is insufficient by the stop condition.

If the current executor is unsupported but another executor is supported, the router creates a typed handoff instead of simulating unavailable capability access.

The router never interprets `primary` or `writeAuthority` as permission to bypass runtime authorization, plugin permission settings, user confirmation requirements, or repository policy.

## 8. Tool budget and anti-duplication policy

Default tool budget is one primary capability per independent information need.

A second provider is justified only when one of these is true:

- primary unavailable or fails;
- result is incomplete;
- sources conflict;
- high-risk clinical/security task requires corroboration;
- the second provider supplies a distinct evidence class;
- the user explicitly requests comparison.

Examples:

- Do not run Firecrawl + Tavily + Parallel Search for an ordinary web retrieval task.
- Do not run PostHog + Amplitude for the same analytics question when PostHog is canonical.
- Do not deploy the same change through Vercel + Render + AppDeploy unless each has a distinct predeclared responsibility.
- Do not query every scholarly synthesis tool when PubMed or an official connector already answers the question.

## 9. Permission posture

The Capability OS optimizes autonomy without granting blanket authority.

- Read-only discovery/analysis should be preferred and may run without repeated confirmation when the connected runtime permits it.
- Persistent external writes, production mutations, payments, secrets changes, clinical publication actions, and destructive operations retain the confirmation/permission rules of their provider and ChatGPT runtime.
- The Capability OS must never recommend global `full_access` merely for convenience.
- A provider permission denial is an authorization failure, not a reason to route around the permission with another write-capable provider.

## 10. Parallelism rules

Parallel execution is allowed only when all are true:

- tasks have no shared mutable repository paths;
- no unresolved schema/API dependency exists between them;
- they do not mutate the same external system/resource;
- each track has independent acceptance evidence;
- the manifest marks the capability parallelizable;
- `panacea-orchestrator` ownership checks pass.

Biomedical corroboration may run in parallel because providers are read-only, but synthesis waits until all required source results return.

Repository writes, migrations, shared configuration, release changes and clinical publication gates are sequential unless a specific isolation boundary proves otherwise.

## 11. Handoff contract

Every cross-agent handoff must include:

- `taskId`;
- objective;
- current owner and next owner;
- base `main` SHA;
- branch / PR when applicable;
- owned paths or external resource scope;
- capability IDs and actual providers used;
- completed checks;
- unresolved blockers;
- required next checks;
- evidence references;
- explicit state among `planned`, `implemented`, `tested`, `pr-open`, `merged`, `deployed`.

A later agent must not infer a stronger state from weaker evidence.

## 12. Project skills

The existing 12 Panaceamed project skills remain valid. The Capability OS adds one new routing skill:

`panacea-capability-router`

Trigger: tasks where selecting among multiple tools, plugins, agents, evidence providers, or execution lanes materially affects correctness, efficiency, or safety.

It reads the manifest, applies selection and fallback rules, and delegates judgment to existing specialist skills rather than duplicating their instructions.

Existing `panacea-orchestrator` remains responsible for dependency graphs, ownership, parallelization and integration boundaries. The router selects capabilities and executor; the orchestrator schedules work.

## 13. Runtime plugin discovery

Plugin availability is dynamic and must never be committed as truth.

At runtime:

1. identify logical capability from the manifest;
2. confirm the current executor is supported;
3. discover/check the preferred provider in that executor runtime;
4. use it when connected and authorized;
5. otherwise walk ordered fallbacks available to that executor;
6. if no provider is available but another executor is supported, issue a handoff;
7. stop when the manifest stop condition is satisfied;
8. record the capability/provider/evidence in the handoff packet.

The router does not automatically install plugins. Installation always requires user action.

## 14. Prompt optimization

Prompt Perfect is treated as a prompt-development utility, not a production authority.

Use it for reusable complex prompts when prompt quality materially affects autonomous execution, for example:

- Claude Code implementation handoffs;
- structured biomedical research prompts;
- QA/release runbooks;
- complex multi-stage agent instructions.

Do not route trivial questions or mechanical commands through prompt optimization.

## 15. Failure handling

Failures are classified before fallback:

- `unavailable`: provider/tool not connected or runtime inaccessible;
- `unsupported-executor`: current agent runtime does not expose the capability; hand off if another executor is supported;
- `authorization`: missing permission; stop if user approval is required;
- `provider-error`: retry only according to provider-safe behavior, otherwise fallback;
- `insufficient-evidence`: invoke an evidence-distinct fallback;
- `policy-denied`: no fallback may bypass the policy;
- `conflict`: preserve both results and escalate to a stronger verification path;
- `repository-overlap`: do not write; select another safe task or coordinate ownership.

Failures must not silently downgrade clinical evidence quality or repository safety.

## 16. Verification model

Completion evidence is capability-specific.

Engineering requires relevant tests/typecheck/build plus exact-head repository gates at merge boundaries.

Browser/UX requires deterministic checks plus browser evidence for affected user-visible surfaces.

Biomedical evidence requires source identity, date/version where relevant, citation/provenance and uncertainty handling.

Release requires provider deployment state plus post-deploy evidence; a merge alone is not deployment evidence.

Growth/operations writes require confirmation from the target system when a persistent change was requested.

## 17. MCP integration boundary

MCP Phase A remains independent and should not be enlarged by this design.

After the Capability OS is merged and stable, MCP Phase B may expose read-oriented orchestration tools such as:

- `panacea_capability_plan`;
- `panacea_capability_catalog`;
- `panacea_evidence_route`;
- `panacea_handoff_validate`;
- `panacea_release_plan`.

MCP tools consume the same manifest. They must preserve Phase A transport policy, audit redaction, local-only repo QA, and no arbitrary shell.

## 18. First implementation slice

The first implementation slice is deliberately non-runtime and reversible:

1. add `config/capability-os.json`;
2. add `config/capability-os.schema.json`;
3. add `scripts/qa/capability-os.test.mjs` for schema and semantic validation;
4. add `.claude/skills/panacea-capability-router/SKILL.md`;
5. minimally cross-reference the router from `.claude/skills/panacea-orchestrator/SKILL.md` without duplicating policy;
6. add pressure-test fixtures under `.claude/skills/panacea-capability-router/pressure-scenarios.md` covering selection and anti-duplication behavior;
7. update PR #1753 documentation and verification.

No production application runtime behavior changes in this slice.

MCP integration, plugin-specific automation, permission changes, and production orchestration are later slices after this contract is verified.

## 19. Acceptance criteria

The Capability OS design is implemented correctly when:

- the manifest and schema use `schemaVersion: 1`;
- every manifest entry passes JSON schema and semantic validation;
- no manifest entry contains secrets, account permission state, or account connection state;
- every capability has one lane, executor contract, one primary, ordered fallbacks, risk, side-effect class, evidence requirement and stop condition;
- preferred/supported executor combinations are internally valid;
- project skills reference canonical repository policy instead of copying it;
- the router chooses the narrowest authoritative available provider for a supported executor;
- unsupported executors produce a handoff rather than simulated access;
- fallback never bypasses policy or authorization;
- duplicate provider calls require a documented reason;
- parallelization obeys ownership/isolation rules;
- pressure scenarios cover unavailable-provider, unsupported-executor, clinical-risk, deployment, repository-overlap and ordinary-task routing;
- the implementation slice changes only configuration, QA/process tests, skills and documentation, not production application runtime behavior;
- merge still requires exact-head repository gates and latest-main overlap audit.
