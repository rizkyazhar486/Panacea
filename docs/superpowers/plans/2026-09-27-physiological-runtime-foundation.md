# Physiological Runtime Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first production-grade runtime substrate for Panaceamed's Computational Human Platform: a typed Physiological State Engine contract, domain-engine registry, boundary-condition adapter, deterministic scheduler/coupling exchange, and explicit separation from Canonical Patient State.

**Architecture:** Reuse the existing multiscale kernel principles (typed fields, units, deterministic scheduling, provenance, fail-closed composition) without replacing it. Add a higher-level whole-body runtime under `src/lib/physiology/` that is scalar/time-series friendly and suitable for organ/system engines. The runtime consumes explicit boundary conditions projected from canonical longitudinal events, produces only model-derived state, and never writes simulated values into `panaceaLongitudinalState.ts`.

**Tech Stack:** TypeScript 5.5, Node built-in test runner via TypeScript scripts, existing repository QA conventions.

**Spec:** `docs/superpowers/specs/2026-09-27-vertical-computational-human-platform-design.md`

## Global Constraints

- Canonical Patient State remains authoritative for measured/recorded patient truth.
- Runtime output truth class is always `model-derived` or `simulated`, never `measured`.
- Every domain engine declares model/version, parameter-set id, dt, inputs/outputs, units, validation class, and supported fidelity.
- Composition fails closed on duplicate engines, duplicate producers, missing producers, self-coupling, unit mismatch, invalid dt, non-finite values, or negative uncertainty.
- Deterministic execution: same inputs + registry + time horizon produce identical state/provenance ids.
- No clinical claim, diagnosis, or patient-specific internal anatomy is generated.
- Reuse existing multiscale infrastructure conceptually; do not rewrite or delete `src/lib/multiskala/kernelKopling.ts`.
- No GPU, external solver, microservice, database migration or UI work in this slice.

## Review Focus

- A canonical measured event must remain unchanged after it is used as a boundary condition.
- A model engine must not be able to declare its output as measured clinical truth.
- Missing/mismatched cross-system fields must fail before execution.
- Multi-rate scheduling must be deterministic and not depend on wall-clock time.
- Provenance must identify model, model version, parameter set and parent boundary/coupling values.

---

### Task 1: Runtime contracts and fail-closed registry

**Files:**
- Create: `src/lib/physiology/runtime.ts`
- Create: `scripts/uji/physiological-runtime.mts`

**Interfaces:**
- Produces: `PhysiologicalFieldDeclaration`, `PhysiologicalValue`, `BoundaryCondition`, `DomainEngineContract<S>`, `createDomainEngineRegistry()`, `validateDomainEngineComposition()`.

- [ ] Write failing QA assertions for duplicate engine ids, duplicate field producers, unit mismatch, invalid dt, unsupported measured output truth class, and valid composition.
- [ ] Run QA and confirm RED because runtime module does not exist.
- [ ] Implement minimal contracts + registry + validation.
- [ ] Run QA and confirm GREEN.
- [ ] Run TypeScript build/typecheck relevant to repository.
- [ ] Commit.

### Task 2: Deterministic whole-body scheduler and provenance

**Files:**
- Modify: `src/lib/physiology/runtime.ts`
- Modify: `scripts/uji/physiological-runtime.mts`

**Interfaces:**
- Produces: `runPhysiologicalSimulation()`, `PhysiologicalSimulationResult`, deterministic provenance records.

- [ ] Add failing tests for multi-rate scheduling, deterministic output, missing initial boundary condition, non-finite outputs, negative sigma, undeclared outputs, and parent provenance.
- [ ] Run QA and confirm RED.
- [ ] Implement minimal deterministic scheduler/coupling.
- [ ] Run QA and confirm GREEN.
- [ ] Run TypeScript build/typecheck.
- [ ] Commit.

### Task 3: Canonical patient-state boundary adapter

**Files:**
- Create: `src/lib/physiology/longitudinalBoundary.ts`
- Modify: `scripts/uji/physiological-runtime.mts`

**Interfaces:**
- Consumes: `LongitudinalEvent` from `panaceaLongitudinalState.ts`.
- Produces: `boundaryConditionFromLongitudinalEvent()`.

- [ ] Add failing tests proving numeric measured/imported/clinician-entered events can become boundary conditions with preserved source id/time/unit and that simulated/AI-draft/unavailable/non-numeric events fail closed.
- [ ] Verify the source event object is unchanged.
- [ ] Implement the minimal adapter.
- [ ] Run QA and typecheck.
- [ ] Commit.

### Task 4: First neutral cross-system fixture, not a clinical model

**Files:**
- Create: `src/lib/physiology/exampleEngines.ts`
- Modify: `scripts/uji/physiological-runtime.mts`
- Create: `DOCS/PHYSIOLOGICAL-RUNTIME.md`

**Interfaces:**
- Produces: tiny dimensionless deterministic engine fixtures for proving registry/scheduler/coupling behavior only.

- [ ] Add failing test for two engines coupled through one typed field and one measured boundary condition.
- [ ] Implement explicitly synthetic fixtures; no physiological constants or clinical prediction.
- [ ] Document status: infrastructure scaffold, not validated human physiology.
- [ ] Run targeted QA, TypeScript build, and repository build if feasible.
- [ ] Commit.

### Task 5: Source-of-truth wiring

**Files:**
- Modify: `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`
- Modify: `DOCS/VISSIM-OS.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: verified runtime foundation.
- Produces: future-agent knowledge of exact implemented substrate and its scientific boundary.

- [ ] Record actual implemented paths and status only after tests pass.
- [ ] Preserve no-fake-data and clinical-validation boundaries.
- [ ] Verify exact-head status/CI and report any red/unknown gates.
