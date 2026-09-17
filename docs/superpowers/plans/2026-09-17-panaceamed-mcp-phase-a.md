# Panaceamed MCP Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dependency-light Panaceamed MCP kernel, orchestration packets, local repository QA allowlist, and verified MCP tool registry before wiring the official MCP transports.

**Architecture:** Phase A is split into A1 and A2 because the server uses `npm ci` and the official MCP SDK is not present in `server/package-lock.json`. A1 builds and tests the domain/tool kernel with no new dependency; A2 installs the official MCP TypeScript SDK with a generated lockfile and wires stdio plus disabled-by-default authenticated Streamable HTTP over the same registry.

**Tech Stack:** Node.js >=20, TypeScript 5.6, `tsx`, Express 4, Node `child_process.spawn`, official MCP TypeScript SDK v2 package split for A2.

**Spec:** `docs/superpowers/specs/2026-09-17-panaceamed-mcp-orchestration-design.md`

## Global Constraints

- GitHub `main` is the source of truth; never push directly to `main`.
- Use a short-lived branch and one coherent PR per delivery slice.
- Base language for user-facing text is English; code comments remain Indonesian by repository convention.
- Remote MCP is disabled by default and must never expose arbitrary shell, patient-record retrieval, SATUSEHAT submission, EMR signing, medication/order commit, direct merge, or force push.
- Local repo QA accepts named profiles only; no caller-provided command string is ever interpolated.
- Tool metadata always declares domain, transport eligibility, side-effect class, clinical-risk class, timeout, and payload limit.
- Audit records never retain secrets or raw clinical payloads.
- Completion state distinguishes `implemented`, `tested`, `pr-open`, `merged`, and `deployed`.
- Existing FHIR/SATUSEHAT/ICD/RxNorm/PubMed modules remain authoritative; Phase A does not duplicate them.

---

### Task 1: MCP kernel contracts, policy, and audit redaction

**Files:**
- Create: `server/src/mcp/types.ts`
- Create: `server/src/mcp/policy.ts`
- Create: `server/src/mcp/audit.ts`
- Test: `server/uji/mcpCore.uji.ts`
- Create: `.github/workflows/mcp-phase-a.yml`

**Interfaces:**
- Produces `McpTransportKind = 'stdio' | 'http'`, `McpSideEffect = 'none' | 'local-read' | 'local-test'`, `McpClinicalRisk = 'none' | 'reference' | 'clinical-preview'`.
- Produces `PanaceaToolDefinition`, `PanaceaToolContext`, `PanaceaToolResult`, `PanaceaMcpError`.
- Produces `authorizeTool(definition, transport): PolicyDecision`.
- Produces `buildAuditRecord(input): McpAuditRecord` with metadata-only payload summaries.

- [ ] **Step 1: Write the failing kernel test**

Create `server/uji/mcpCore.uji.ts` importing the above functions. Assert that a local-test tool is allowed on stdio, denied on HTTP, unknown/oversized payload metadata never appears in audit content, and bearer/secret/raw clinical values are absent from the serialized audit record.

- [ ] **Step 2: Add a targeted PR workflow and verify RED**

Create `.github/workflows/mcp-phase-a.yml` with `pull_request` trigger scoped to the MCP files. Run `npm ci` in `server`, then `npx tsx uji/mcpCore.uji.ts`. Open a draft PR and confirm the job fails because `../src/mcp/...` modules do not exist.

- [ ] **Step 3: Implement minimal contracts/policy/audit**

`policy.ts` must implement this exact rule:

```ts
export function authorizeTool(def: PanaceaToolDefinition, transport: McpTransportKind): PolicyDecision {
  if (!def.transports.includes(transport)) return { allowed: false, code: 'policy_denied' }
  if (transport === 'http' && def.sideEffect !== 'none') return { allowed: false, code: 'policy_denied' }
  return { allowed: true }
}
```

`audit.ts` must summarize payloads using keys/counts/byte length only; it must never stringify input values into the audit record.

- [ ] **Step 4: Verify GREEN**

Target: `npx tsx uji/mcpCore.uji.ts` exits 0 in the dedicated PR workflow.

- [ ] **Step 5: Commit**

Commit message: `feat(mcp): add policy and audit kernel`.

---

### Task 2: Deterministic ChatGPT ↔ Claude Code orchestration packets

**Files:**
- Create: `server/src/mcp/orchestration.ts`
- Test: `server/uji/mcpOrchestration.uji.ts`

**Interfaces:**
- Produces `createTaskPacket(input): TaskPacket`.
- Produces `createHandoffPacket(input): HandoffPacket`.
- Produces `verifyCompletionEvidence(input): CompletionVerification`.
- `TaskPacket` requires `taskId`, `objective`, `owner`, `baseMainSha`, `branch`, non-empty `scopedPaths`, non-empty `acceptanceCriteria`, `requiredChecks`, and ISO timestamps.

- [ ] **Step 1: Write failing orchestration tests**

Tests must reject missing/invalid SHA, empty scope, empty acceptance criteria, and completion claims where `merged=true` lacks merge evidence or `deployed=true` lacks deployment evidence. They must prove `implemented` does not imply `tested`.

- [ ] **Step 2: Verify RED**

Add `npx tsx uji/mcpOrchestration.uji.ts` to the targeted workflow and confirm failure because the module is missing.

- [ ] **Step 3: Implement minimal packet builders**

Use explicit validation functions; do not add persistence. IDs and timestamps are caller-supplied or generated with Node primitives only. Return structured error codes rather than booleans for invalid completion claims.

- [ ] **Step 4: Verify GREEN**

Both MCP targeted test files exit 0.

- [ ] **Step 5: Commit**

Commit message: `feat(mcp): add agent orchestration packets`.

---

### Task 3: Local repository QA allowlist

**Files:**
- Create: `server/src/mcp/repoQa.ts`
- Test: `server/uji/mcpRepoQa.uji.ts`

**Interfaces:**
- Produces `QaProfileName = 'server_typecheck' | 'mcp_targeted_tests' | 'root_validators' | 'root_build' | 'server_full_tests'`.
- Produces `buildQaInvocation(profile, repoRoot): QaInvocation`.
- Produces `runQaProfile(profile, options): Promise<QaRunResult>`.
- `QaInvocation` contains exact executable, args array, cwd, timeout; it never contains a shell string.

Exact profile mapping:

```ts
server_typecheck -> cwd=server, command=npm, args=['run','typecheck']
mcp_targeted_tests -> cwd=server, command=npm, args=['run','uji:mcp']
root_validators -> cwd=root, command=npm, args=['run','validate:source-registry'] then approved validator sequence handled internally
root_build -> cwd=root, command=npm, args=['run','build']
server_full_tests -> cwd=server, command=npm, args=['run','uji']
```

- [ ] **Step 1: Write failing allowlist tests**

Tests assert unknown names are rejected, `'; rm -rf /'` cannot become a profile, invocations use `shell:false`, cwd cannot escape the supplied repository root, and output is capped.

- [ ] **Step 2: Verify RED**

Add test to targeted workflow and confirm missing-module failure.

- [ ] **Step 3: Implement allowlisted runner**

Use `spawn(executable, args, { cwd, shell: false, env: sanitizedEnv })`; cap stdout/stderr and kill on timeout. Never expose an API accepting executable or args from the MCP caller.

- [ ] **Step 4: Verify GREEN**

Run all three MCP targeted tests in CI.

- [ ] **Step 5: Commit**

Commit message: `feat(mcp): add allowlisted repository QA`.

---

### Task 4: Shared Panaceamed tool registry and handlers

**Files:**
- Create: `server/src/mcp/registry.ts`
- Create: `server/src/mcp/tools.ts`
- Test: `server/uji/mcpRegistry.uji.ts`
- Modify: `server/package.json`

**Interfaces:**
- Produces `createPanaceaToolRegistry(): readonly PanaceaToolDefinition[]`.
- Produces `executePanaceaTool(name, input, context): Promise<PanaceaToolResult>`.
- Initial tools: `panacea_capabilities`, `panacea_orchestration_create_task`, `panacea_orchestration_create_handoff`, `panacea_orchestration_verify_completion`, `panacea_repo_qa_plan`, `panacea_repo_qa_run`.
- `panacea_repo_qa_run` is stdio-only and `local-test`.

- [ ] **Step 1: Write failing registry tests**

Assert tool names are unique, every tool has complete metadata, HTTP cannot execute `panacea_repo_qa_run`, unknown tools fail closed, and `panacea_capabilities` returns only tools authorized for the calling transport.

- [ ] **Step 2: Verify RED**

Add registry test to the targeted workflow and confirm missing-module failure.

- [ ] **Step 3: Implement registry/dispatcher**

Dispatcher authorizes before invoking a handler, checks serialized input byte length against `maxInputBytes`, applies timeout with `AbortController`, and returns a structured envelope.

- [ ] **Step 4: Add one package script**

Add `"uji:mcp": "tsx uji/mcpCore.uji.ts && tsx uji/mcpOrchestration.uji.ts && tsx uji/mcpRepoQa.uji.ts && tsx uji/mcpRegistry.uji.ts"` to `server/package.json`. Do not modify dependencies in A1.

- [ ] **Step 5: Verify GREEN**

Run `npm run uji:mcp` and `npm run typecheck` in the dedicated workflow.

- [ ] **Step 6: Commit**

Commit message: `feat(mcp): register safe Panaceamed tools`.

---

### Task 5: A1 operator documentation and boundary verification

**Files:**
- Create: `server/src/mcp/README.md`
- Test: extend `server/uji/mcpRegistry.uji.ts`

**Interfaces:**
- Documents transport matrix, tool risk classes, local-only QA profiles, no-patient-data boundary, and exact A2 dependency command.

- [ ] **Step 1: Add failing documentation boundary assertion**

The registry test reads the README and requires explicit strings `Remote MCP is disabled by default`, `No patient-record retrieval`, `No arbitrary shell`, and `No direct push to main`.

- [ ] **Step 2: Verify RED**

Confirm test fails because README is absent.

- [ ] **Step 3: Write README**

Document current A1 as a transport-neutral kernel and state that A2 must install SDK dependencies through npm so `server/package-lock.json` is generated rather than hand-edited.

- [ ] **Step 4: Verify GREEN**

`npm run uji:mcp` and server typecheck pass.

- [ ] **Step 5: Commit**

Commit message: `docs(mcp): document kernel safety boundary`.

---

### Task 6: A2 official SDK transport wiring

**Files:**
- Modify: `server/package.json`
- Modify: `server/package-lock.json` using npm only
- Create: `server/src/mcp/serverFactory.ts`
- Create: `server/src/mcp/stdio.ts`
- Create: `server/src/mcp/http.ts`
- Test: `server/uji/mcpTransport.uji.ts`
- Modify: `server/src/index.ts` only to mount the HTTP router when explicitly enabled

**Interfaces:**
- `createMcpServer(transportKind): McpServer` registers only tools authorized for that transport.
- `startStdioMcp(): Promise<void>` connects `StdioServerTransport`.
- `createHttpMcpRouter(config): Router` returns 404/disabled unless enabled and 401 for missing/invalid bearer token.

- [ ] **Step 1: Establish an executable local workspace**

Use Remote Desktop Commander or another authorized shell/worktree. Verify branch isolation and baseline `npm ci` in `server` before modifying dependencies.

- [ ] **Step 2: Install official dependencies with npm**

Run from `server`:

```bash
npm install @modelcontextprotocol/server@2.0.0-alpha.2 @modelcontextprotocol/node@2.0.0-alpha.2 @modelcontextprotocol/express@2.0.0-alpha.2 zod
```

Do not hand-edit `package-lock.json`. If npm reports a different compatible published v2 package name/version, stop and re-check Context7/npm metadata before proceeding.

- [ ] **Step 3: Write failing transport tests**

Tests require stdio server construction, HTTP disabled-by-default behavior, bearer-token rejection, and remote registry exclusion of local QA execution.

- [ ] **Step 4: Verify RED**

Run `npx tsx uji/mcpTransport.uji.ts`; expected failure is missing transport implementation, not dependency resolution.

- [ ] **Step 5: Implement minimal SDK wiring**

Use `McpServer` + `StdioServerTransport` from `@modelcontextprotocol/server`, `NodeStreamableHTTPServerTransport` from `@modelcontextprotocol/node`, and Express middleware/router integration. Tool handlers delegate to the A1 registry; no clinical logic lives in transport files.

- [ ] **Step 6: Verify GREEN**

Run `npm run uji:mcp`, `npm run typecheck`, then the transport test. Confirm remote HTTP does not expose or invoke `panacea_repo_qa_run`.

- [ ] **Step 7: Commit**

Commit message: `feat(mcp): wire stdio and private HTTP transports`.

---

### Task 7: Phase A verification and PR readiness

**Files:**
- Modify only if verification exposes a concrete defect.

- [ ] **Step 1: Run targeted checks**

```bash
cd server
npm run uji:mcp
npm run typecheck
```

- [ ] **Step 2: Run existing server regression suite when A2 is present**

```bash
cd server
npm run uji
```

- [ ] **Step 3: Run repository-required checks**

From repository root run the existing validators/build appropriate to the exact head. Do not weaken any failing validator.

- [ ] **Step 4: Inspect exact PR head CI**

Require fresh exact-head Validate pull requests and Stabilization Acceptance according to `CLAUDE.md` / `AGENTS.md`; treat stale green as invalid evidence.

- [ ] **Step 5: Final latest-main overlap audit**

Resolve current `main`, compare changed files, and refresh/revalidate if overlapping main/CI changes make ancestry uncertain.

- [ ] **Step 6: Completion claim**

Only call Phase A `implemented` after files exist, `tested` after targeted checks pass, `PR-open` after GitHub confirms it, `merged` after expected-head merge evidence, and `deployed` only after runtime/deployment evidence.