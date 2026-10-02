# Vertical Computational Human Platform Canonicalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the owner-approved Computational Human Platform / vertical-depth doctrine a canonical, model-agnostic repository authority that future agents automatically inherit and use for task selection.

**Architecture:** Add one root canonical doctrine file that defines the computational-human hierarchy, physiological-vs-record state boundary, domain-engine contract, cross-system coupling and future-model selection law. Existing root charters and architecture documents will point to and operationalize that doctrine rather than duplicating it. The existing Universal Human Gold Standard, safety, provenance and clinical-validation gates remain unchanged and higher-priority constraints where applicable.

**Tech Stack:** Markdown repository governance; GitHub main as source of truth; existing Panacea architecture/governance files.

**Spec:** `docs/superpowers/specs/2026-09-27-vertical-computational-human-platform-design.md`

## Global Constraints

- Preserve existing capabilities and safety/evidence/clinical-validation boundaries.
- Do not create a second canonical patient-record authority.
- Measured/clinician-authored patient truth remains distinct from simulated/model-derived physiological state.
- Whole-body Universal Human Gold Standard remains uniform; no organ receives a permanently privileged quality standard.
- Prefer vertical computational depth and cross-system integration over feature-count expansion.
- Do not require premature microservices or GPU/HPC infrastructure before a validated workload justifies them.
- Direct-main changes must not overwrite a newer main; use current blob SHAs and verify exact head after each coherent batch.

## Review Focus

- Existing longevity-first sequencing must remain a product-priority directive, not conflict with the deeper computational architecture.
- Existing Body Exposure whole-body gold-standard rules must remain intact while Body Exposure becomes a projection of shared state.
- Existing `panaceaLongitudinalState`/canonical patient state must not be redefined as simulated physiology.
- Existing model/simulation outputs must retain truth-class, provenance, uncertainty and validation boundaries.
- Future autonomous agents must have a deterministic rule that chooses deepening/integration work over disconnected feature proliferation.

---

### Task 1: Establish the canonical doctrine

**Files:**
- Create: `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`

**Interfaces:**
- Consumes: the approved architecture spec and existing Constitution/Humanity/Product Maturity authorities.
- Produces: one stable doctrine path for every future model and architecture document to reference.

- [ ] Create the doctrine with mission, state equation, depth function, patient-state boundary, domain-engine contract, coupling fabric, infrastructure primitives, Body Exposure projection role, future-model task-selection rule, migration/validation rules and anti-goals.
- [ ] Verify the file contains the required canonical terms and references the existing whole-body/safety authorities.
- [ ] Commit as a coherent documentation batch.

### Task 2: Wire root-level agent authorities

**Files:**
- Modify: `AGENTS.md`
- Modify: `PANACEA_CONSTITUTION.md`
- Modify: `PANACEA_PRODUCT_MATURITY_OS.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`.
- Produces: automatic inheritance of the doctrine by current/future models and maturity prioritization.

- [ ] Add the doctrine to the authority chain without weakening Constitution/Humanity/safety precedence.
- [ ] Add the execution law: `STABILIZE -> DEEPEN SHARED INFRASTRUCTURE -> DEEPEN DOMAIN ENGINE -> COUPLE -> VALIDATE -> PROJECT -> OPTIMIZE`.
- [ ] Define vertical depth as domain × model × infrastructure × integration × validation.
- [ ] Explicitly reject route/widget/commit-count optimization as the default objective.
- [ ] Verify every root authority points to the canonical doctrine and preserves existing gates.
- [ ] Commit.

### Task 3: Make architecture documents computational-state aware

**Files:**
- Modify: `docs/architecture/PRODUCT_SYSTEM.md`
- Modify: `docs/architecture/PATIENT_STATE.md`
- Modify: `docs/architecture/INTEGRATION_MAP.md`
- Modify: `docs/architecture/MATURITY_MODEL.md`

**Interfaces:**
- Consumes: canonical doctrine and current architecture primitives.
- Produces: explicit physiological-state engine, domain-engine/coupling contracts and depth-oriented maturity semantics.

- [ ] Revise Product System so domain engines and physiological state sit between canonical patient state and projections.
- [ ] Revise Patient State so measured/recorded truth remains canonical while model-derived physiological state is a separate derived layer.
- [ ] Revise Integration Map so cross-system coupling contracts are first-class.
- [ ] Revise Maturity Model so computational depth, model validity, coupling and projection reuse are part of maturity.
- [ ] Verify no document creates a second patient-record authority or upgrades simulation claims.
- [ ] Commit.

### Task 4: Apply the doctrine to autonomous future work

**Files:**
- Modify: `automation/AUTONOMOUS_RND_LOOP.md`

**Interfaces:**
- Consumes: doctrine + maturity model.
- Produces: deterministic autonomous selection behavior for future agents.

- [ ] Insert a depth-first selection gate before net-new feature creation.
- [ ] Require agents to ask whether a task deepens a shared primitive, domain engine, cross-system coupling, validation or projection convergence.
- [ ] Prefer the highest validated vertical-depth gain subject to safety/security/clinical constraints.
- [ ] Preserve research discovery, but block promotion to production breadth without system-fit/reuse/validation gates.
- [ ] Verify autonomous loop references the doctrine and remains compatible with existing registries.
- [ ] Commit.

### Task 5: Whole-change verification

**Files:**
- Read/verify all files above.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: evidence that the canonical doctrine is discoverable and internally consistent.

- [ ] Verify all required files exist on current `main`.
- [ ] Verify root authority references, physiological-state separation, domain-engine contract, coupling language, Body Exposure projection semantics and whole-body gold-standard preservation.
- [ ] Inspect exact-head commit and CI/status evidence available for the documentation commits.
- [ ] Report any unresolved conflicts explicitly rather than inventing green status.
