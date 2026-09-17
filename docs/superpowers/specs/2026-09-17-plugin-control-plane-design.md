# Panaceamed Plugin Control Plane Design

## Status
Approved architecture, formalized for implementation.

## Purpose
Panaceamed already has a mature GitHub-centered CI surface and a live Render backend deployment path. The next step is not to add more disconnected tools. It is to make the existing GitHub, Render, PostHog, Vercel workflow, MCP orchestration, and future Supabase integration operate as one controlled delivery and observability system.

This design defines the control-plane boundaries, privacy rules, deployment evidence model, rollout order, and failure semantics for that integration.

## Repository authority
The existing `CLAUDE.md` and `AGENTS.md` rules remain authoritative.

- GitHub `main` is the source of truth.
- No agent writes directly to `main`.
- Every production change uses a short-lived branch and one coherent PR.
- Exact current PR head must pass Validate pull requests and complete Stabilization Acceptance before merge.
- Specialized gates such as Body/WebGL acceptance and security workflows remain mandatory when relevant.
- Immediately before merge, re-resolve latest `main`, mergeability, changed-file overlap, and tested head identity.
- Never force merge and never trust stale green CI.
- After merge, verify the merge is present on `main` and inspect available deployment/smoke evidence.

This control plane extends those rules; it does not replace or weaken them.

## Current state captured on 2026-09-17

### GitHub
- Repository: `rizkyazhar486/Panacea`.
- Default branch: `main`.
- Baseline observed at design time: `2aa72e35592d9616f8d84997c064c571b1bd1304`.
- Existing workflows include Validate, Stabilization Acceptance, Body 3D Render Acceptance, security inventory/enforcement, server CI, Render live smoke, scheduled server wake-up, and Vercel production deployment.
- Integrated stabilization PR `#1756` is the current highest-leverage baseline repair. At design time its Validate, Stabilization Acceptance, Security Baseline Inventory, and Security Baseline Enforcement runs were green; Body 3D Render Acceptance was still in progress.

### Render
- Connected service: `panaceamed-backend`.
- Repository: `https://github.com/rizkyazhar486/Panacea`.
- Branch: `main`.
- Root directory: `server`.
- Auto-deploy: enabled on commit.
- Health path: `/api/health`.
- Render therefore acts as a production backend executor after a GitHub merge; it is not a competing source of truth.

### PostHog
- A PostHog project exists and is connected.
- It had not ingested events at design time.
- No PostHog SDK integration was found in the default-branch application code during the initial audit.
- PostHog will be introduced as privacy-safe product telemetry and, where appropriate, error observability.

### Vercel
- The repository already contains a `vercel-prebuilt-production.yml` workflow.
- The connected Vercel workspace exposed no team/project during the design audit.
- Existing Vercel repository behavior must remain intact, but Vercel is not promoted to deployment authority until a live project can be positively resolved and verified.

### Supabase
- The connector is available but no Supabase project was present at design time.
- No new Supabase project should be created merely to increase tool count.
- Supabase remains an optional future data/backend capability, introduced only for a bounded use case with explicit access-control and RLS design.

### Sentry
- Sentry was not exposed as an actionable connector in this session despite earlier installation context.
- The design therefore does not depend on Sentry availability. PostHog error tracking and existing platform logs are the immediate observability path.

## Goals

1. Make GitHub the explicit canonical control plane for branch state, CI evidence, PR merge authority, and release identity.
2. Treat Render as a deterministic post-merge backend deployment executor with health evidence.
3. Add product telemetry without leaking clinical or identifying health data.
4. Connect release identity across GitHub, deployed runtime, and telemetry so incidents can be traced to exact code.
5. Preserve existing Vercel workflow behavior without creating duplicate deployment authority.
6. Keep Supabase out of the critical path until a concrete data use case justifies it.
7. Allow the project-owned MCP layer to orchestrate safe repository work without bypassing GitHub gates or clinical safety rules.
8. Reduce duplicated human/agent checking by codifying evidence contracts rather than creating more automation that can disagree.

## Non-goals

- No autonomous diagnosis, prescription, order commit, procedure targeting, or EMR signing.
- No direct production mutation from PostHog, Vercel, Render metrics, or MCP tools.
- No database migration or Supabase project creation in the first implementation wave.
- No removal of existing GitHub gates.
- No replacement of repository medical provenance or Academic Accuracy Gate.
- No direct writes to `main`.
- No force push or force merge.
- No second backend deploy path that races Render auto-deploy.

## Architecture

```text
Agent / Developer
      |
      v
short-lived branch
      |
      v
GitHub PR
      |
      +--> targeted checks
      +--> Validate exact head
      +--> Stabilization Acceptance exact head
      +--> specialized security / Body / server gates when relevant
      |
      v
final latest-main + overlap + head identity audit
      |
      v
expected-head PR merge
      |
      +---------------------------+
      |                           |
      v                           v
Render auto-deploy            Existing Vercel workflow
(server/main)                 (preserved, non-authoritative)
      |
      v
/api/health + deploy evidence
      |
      v
release identity propagated to runtime telemetry
      |
      v
PostHog privacy-safe events / error evidence
```

GitHub remains the only authority that decides whether code is eligible to merge. Deployment systems execute already-approved repository state and return evidence.

## Control-plane contracts

### 1. Release identity contract
Every production-observable event should be attributable to a code revision without collecting patient data.

Preferred release fields:
- `release_sha`: Git commit SHA when available.
- `release_branch`: expected to be `main` in production.
- `runtime_env`: `production`, `preview`, or local equivalent.
- `service`: stable product component identifier such as `web` or `backend`.

The application must not fabricate these values. If a platform does not expose a release SHA, telemetry may omit it rather than infer one from timestamps.

### 2. Deployment evidence contract
A production backend release is considered verified only when all applicable evidence exists:

1. Merge is present on GitHub `main`.
2. Render deploy corresponds to the merged commit or a newer non-conflicting `main` revision.
3. Render deploy status is successful.
4. `/api/health` responds successfully.
5. Existing repository live-smoke checks remain green when applicable.

`deployed = true` must never be inferred solely from `merged = true`.

### 3. Telemetry privacy contract
PostHog is for product and operational telemetry, not a clinical data warehouse.

Allowed by default:
- route/surface identifiers;
- stable feature identifiers;
- anonymous interaction success/failure categories;
- latency/duration buckets or numeric technical timings;
- UI rendering/runtime errors;
- browser/device/platform technical context already appropriate for product analytics;
- release SHA and environment;
- consent-safe coarse capability usage counts.

Forbidden by default:
- patient name, email, phone, MRN, NIK, account identifiers that expose identity;
- raw symptom text;
- diagnosis or differential diagnosis;
- lab values or imaging findings;
- medications, prescriptions, orders, procedure plans;
- EMR notes or free text from clinical records;
- genetic sequence or genomic findings;
- wearable raw health measurements linked to a person;
- clinician free text;
- prompt or model output containing clinical payloads;
- exact dates/times that become identifying in combination with health content.

Telemetry payloads must be allowlisted, not generated by spreading arbitrary application objects.

### 4. Error observability contract
Errors may include:
- normalized exception class/name;
- sanitized message category where safe;
- stack/source location;
- route identifier;
- release SHA;
- environment;
- non-clinical feature identifier.

Errors must exclude user-entered clinical text and serialized application state. Error capture code must provide a sanitization boundary before transport.

### 5. Feature flag contract
PostHog feature flags may later control non-clinical rollout and presentation behavior. They must not independently authorize:
- diagnosis/treatment behavior;
- medication/order execution;
- patient-data access;
- bypass of consent;
- bypass of clinician review;
- bypass of CI or repository gates.

Clinical safety remains code- and policy-enforced even if a flag is misconfigured.

## Plugin responsibilities

### GitHub
Owns:
- branch/revision identity;
- PR state;
- CI and acceptance evidence;
- exact-head merge gating;
- source-of-truth repository state;
- closure of stale/superseded PRs.

Must not be bypassed by:
- direct Render deploys for ordinary code changes;
- manual Vercel deployment treated as canonical;
- MCP repository write commands to `main`.

### Render
Owns:
- backend deployment execution from `main`;
- backend health and runtime metrics;
- deployment evidence after merge.

Render auto-deploy is already enabled. New automation must not manually trigger a second deploy after each merge unless auto-deploy is disabled or a deliberate redeploy is required.

### PostHog
Owns:
- privacy-safe product event capture;
- feature usage analytics;
- release-correlated error evidence;
- later non-clinical feature rollout experimentation where appropriate.

Initial implementation should be deliberately small: one typed/sanitized telemetry boundary, a minimal event vocabulary, release context, error capture, and deterministic tests that prove forbidden payload shapes are rejected or stripped.

### Vercel
Owns only what the existing repository workflow already requires until a live connected project is positively resolved.

No new Vercel-specific product dependency should be introduced in the first wave.

### Supabase
Deferred. A future Supabase subproject must define:
- bounded use case;
- schema ownership;
- authentication model;
- RLS for every exposed table;
- migration strategy;
- security advisor verification;
- secret/public key boundary;
- rollback.

### MCP orchestration
The project-owned MCP layer may coordinate:
- safe repository QA profiles;
- deterministic ChatGPT/Claude handoff packets;
- read-only or explicitly authorized operational discovery;
- structured completion evidence.

It must remain fail-closed and must not gain:
- arbitrary shell execution through remote transport;
- direct production clinical mutation;
- direct `main` writes;
- authority to reinterpret stale CI as fresh evidence;
- authority to merge without exact-head gates and latest-main audit.

GitHub remains authoritative for PR, CI, merge, and repository release state.

## Implementation decomposition

This umbrella design is intentionally decomposed into independently testable subprojects. Each receives its own implementation plan and PR where needed.

### Subproject A — Stabilization baseline
Purpose: finish the already-open integrated stabilization candidate before adding new cross-cutting runtime code.

Acceptance:
- exact-head Validate succeeds;
- exact-head complete Stabilization Acceptance succeeds;
- specialized Body 3D acceptance succeeds when required;
- security gates succeed;
- latest-main audit shows no unsafe overlap;
- merge is performed with expected head SHA and no force;
- superseded baseline PRs are closed only after the integrated repair is verified on `main`.

No new telemetry code belongs in this PR.

### Subproject B — Deployment evidence
Purpose: make post-merge backend deployment status verifiable and release-correlated without duplicating Render auto-deploy.

Expected deliverables:
- explicit release identity exposed by backend health/build metadata when platform env provides it;
- deterministic health contract tests;
- documented post-merge Render verification sequence;
- existing Render live-smoke workflow aligned with the release evidence contract if gaps exist.

### Subproject C — Privacy-safe telemetry
Purpose: introduce PostHog through one narrow typed/sanitized boundary.

Expected deliverables:
- dedicated telemetry module;
- explicit event-name/type schema;
- allowlisted payload fields;
- clinical/PII denylist guard;
- production initialization only when configured;
- no-op behavior when PostHog is unavailable;
- release/environment context;
- sanitized global/runtime error capture;
- deterministic tests proving privacy and no-op behavior;
- a small first event set such as `surface_viewed`, `feature_opened`, `interaction_completed`, `interaction_failed`, and sanitized application exception events.

The first PR must not instrument dozens of screens. Prove the boundary first, then add instrumentation incrementally.

### Subproject D — MCP integration with operational evidence
Purpose: connect the already-developed MCP orchestration boundary to the control-plane contracts once baseline stabilization permits it.

Expected deliverables:
- GitHub remains authoritative;
- MCP completion packets can record tested head, workflow evidence references, merge state, deployment state, and release SHA without claiming states that have not been verified;
- no secret or patient payload retention;
- no remote repo-QA escalation beyond existing policy.

### Subproject E — Optional platform integrations
Supabase, broader Vercel integration, Sentry, external data warehouse, or additional deployment tooling are separate future decisions. They are not prerequisites for the control plane to become useful.

## Failure handling

### CI fails
Classify the failure before modifying code:
1. candidate defect;
2. current-main baseline defect;
3. runner/infrastructure failure;
4. hidden dependency/race.

Do not weaken the validator that found the defect.

### Main moves during validation
If latest `main` changes:
- inspect ancestry and changed-file overlap;
- if material overlap, workflow change, or uncertain ancestry exists, refresh/rebuild from latest main and rerun gates;
- if clearly independent, preserve exact-head evidence but still perform final mergeability/head audit.

### Render deploy fails
- Do not mark release as deployed.
- Inspect deploy/build/runtime evidence.
- Fix through a new short-lived branch and PR if code/config committed to the repo is responsible.
- Do not repeatedly trigger deploy while auto-deploy is already processing the same commit.

### Telemetry configuration missing
Telemetry must fail open for product functionality but fail closed for data transport:
- application continues functioning;
- telemetry becomes a no-op;
- no retry loop floods logs;
- no fallback sends payloads to another destination.

### Telemetry payload violates privacy schema
- event is rejected or sanitized locally;
- product workflow continues unless the telemetry call itself is the feature under test;
- development/test logs may identify the rejected field name, not its value.

## Security requirements

- Never commit PostHog secret/private tokens. Browser telemetry may use only the publishable project key intended for client use.
- Do not copy connected-plugin credentials into repository files.
- Service secrets remain in deployment environment configuration.
- Telemetry initialization must distinguish public client configuration from server secrets.
- Health endpoints must not expose secrets, database credentials, tokens, or patient state.
- Any future Supabase client must never expose service-role/secret keys.
- Existing security baseline workflows remain mandatory.

## Testing strategy

Each subproject uses TDD where code changes are introduced.

Minimum telemetry tests:
- unknown event names rejected at type/runtime boundary;
- arbitrary object spreading is impossible or rejected;
- forbidden clinical/PII keys are removed or fail validation;
- no configuration produces no network client initialization;
- release context is included only when present;
- exception serialization removes request/user/clinical payloads;
- normal application behavior is unchanged if telemetry throws internally.

Minimum deployment-evidence tests:
- health/release metadata response contains only safe operational fields;
- absent platform release SHA returns an explicit null/omitted state instead of fabricated value;
- health status remains independent of telemetry availability.

All ordinary repository exact-head gates remain required before merge.

## Rollout order

1. Finish and verify stabilization baseline.
2. Add release/deployment evidence.
3. Add PostHog telemetry boundary and a very small instrumentation slice.
4. Observe real event/error ingestion before expanding instrumentation.
5. Integrate MCP completion evidence with the same release/deploy state model.
6. Add optional platform integrations only when a concrete bounded requirement exists.

## Prioritization formula
For competing integration work, use:

`Priority = (Impact × Readiness × Reusability) / IntegrationRisk`

The formula is a product-engineering ordering aid, not a clinical score. Current ordering favors stabilization, deployment evidence, privacy-safe telemetry, then MCP integration because those layers benefit every later feature while minimizing new state and operational risk.

## Definition of done for the umbrella initiative
The initiative is mature enough to call integrated when:

- GitHub merge eligibility and exact-head evidence are unambiguous;
- backend deployment can be traced to repository release identity and health evidence;
- PostHog receives only allowlisted privacy-safe product/operational events;
- errors can be correlated to release/environment without leaking clinical payloads;
- missing telemetry never breaks product behavior;
- MCP completion evidence cannot claim merged/deployed states without corresponding verification;
- optional platforms do not create competing sources of truth;
- existing clinical, security, Body/WebGL, and stabilization gates remain intact.
