# Reality Engine Doctrine Canonicalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved Reality Engine / Compounding Human Model doctrine mandatory and discoverable to every future Panacea model/agent before any runtime implementation begins.

**Architecture:** Propagate the approved child-spec into the canonical product doctrine, agent entry points, maturity/task-selection system, and architecture maps without changing production runtime behavior. The new doctrine extends vertical depth from biological scale alone into longitudinal personalization, temporal replay, causal reasoning, epistemic gaps, falsification, and prediction-vs-reality feedback.

**Tech Stack:** Markdown repository governance, GitHub main-first workflow, deterministic structural read-back/grep verification.

**Spec:** `docs/superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md`

## Global Constraints

- Preserve `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, privacy/security, scientific provenance, clinical validation, and no-fake-data boundaries.
- The approved Reality Engine spec extends, not replaces, `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`, or the Continuous Human State Runtime spec.
- Future-model deepening must include personalization, temporal continuity, causal explanation, epistemic uncertainty, falsification, replayability, and feedback—not only more organ/tissue/cell/molecular detail.
- Real observed history remains canonical; counterfactual branches never overwrite it.
- Personalization may not overfit, invent unidentifiable latent state, or convert calibration fit into validation.
- Unknown/unsupported states must remain explicit.
- Security/privacy/consent and AI-EMR publication boundaries remain mandatory.
- This plan changes doctrine/governance only; it does not claim the Reality Engine runtime is implemented.

## Review Focus

- Ensure future agents cannot interpret “deepen” as only biological-scale depth.
- Ensure canonical docs distinguish approved architecture from implemented capability.
- Ensure Reality Engine doctrine does not weaken existing sequencing/safety rules.
- Ensure AGENTS/CLAUDE/GEMINI entry points all inherit the same child-spec.
- Ensure autonomous prioritization prefers falsifiable depth over new surface breadth.

---

### Task 1: Canonical Computational Human Doctrine Inheritance

**Files:**
- Modify: `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`

**Interfaces:**
- Consumes: approved Reality Engine spec.
- Produces: canonical doctrine pointer plus `S_compound` deepening law inherited by all downstream architecture.

- [ ] Add a section naming `docs/superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md` as the canonical child-spec for longitudinal compounding depth.
- [ ] Add the architectural heuristic:
  `S_compound = S_vertical × D_personalization × D_temporal × D_causal × D_epistemic × D_feedback`.
- [ ] State explicitly that future models should use greater capability to reduce reality gaps, improve identifiability, falsify/calibrate models, strengthen causal/temporal depth, and improve replay/counterfactual validity before adding shallow breadth.
- [ ] State explicitly that the spec is architectural direction, not evidence that the Reality Engine runtime already exists.
- [ ] Verify read-back contains the child-spec path, `S_compound`, falsification, Reality Gap, and “not implemented” boundary.
- [ ] Commit as one coherent documentation change.

### Task 2: Multi-Agent Entry-Point Inheritance

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `GEMINI.md`

**Interfaces:**
- Consumes: Task 1 canonical doctrine.
- Produces: mandatory startup guidance for current/future agents.

- [ ] In `AGENTS.md`, require every future agent doing computational-human, clinical, AI-EMR, Body Exposure, simulation, device, or longitudinal work to read the Reality Engine child-spec.
- [ ] In `CLAUDE.md`, add a compact “Reality Engine / compounding depth” working rule using the same canonical path and sequencing.
- [ ] In `GEMINI.md`, add equivalent inheritance without creating model-specific scientific rules that diverge from AGENTS/CLAUDE.
- [ ] Include the explicit prohibition against overfitting personalization, inventing hidden state, hiding uncertainty, rewriting history, or treating counterfactuals as real outcomes.
- [ ] Verify all three files contain the exact spec path and the concepts `Reality Gap`, `prediction-vs-reality`, and `counterfactual`.
- [ ] Commit atomically.

### Task 3: Product Maturity and Autonomous Task-Selection Integration

**Files:**
- Modify: `PANACEA_PRODUCT_MATURITY_OS.md`
- Modify: `automation/AUTONOMOUS_RND_LOOP.md`

**Interfaces:**
- Consumes: canonical `S_compound` doctrine.
- Produces: operational prioritization that future autonomous agents apply.

- [ ] Extend maturity logic so an integrated feature can still be immature if personalization, temporal continuity, epistemic coverage, causal explanation, or outcome-feedback depth is shallow.
- [ ] Add Reality Engine gap classes: prediction-error ledger missing, parameter identifiability missing, Reality Gap hidden, replay/version history missing, counterfactual isolation missing, outcome-feedback loop missing.
- [ ] Extend the autonomous depth gate so new breadth is blocked when a materially more important compounding-depth gap exists.
- [ ] Preserve safety/security/data/clinical blockers above all Reality Engine work.
- [ ] Verify task ordering still keeps stabilization/safety first and does not make experimental personalization outrank clinical/data integrity.
- [ ] Commit atomically.

### Task 4: Architecture Map Propagation

**Files:**
- Modify: `docs/architecture/PRODUCT_SYSTEM.md`
- Modify: `docs/architecture/PATIENT_STATE.md`
- Modify: `docs/architecture/INTEGRATION_MAP.md`
- Modify: `docs/architecture/MATURITY_MODEL.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: architecture-level visibility of Reality Engine relationships without creating a second patient-state authority.

- [ ] In `PRODUCT_SYSTEM.md`, extend the diagram from Continuous Human State into Reality Engine → prediction error / personal parameter state / replay / counterfactual branches / projection layer.
- [ ] In `PATIENT_STATE.md`, clarify that personal model parameters and prediction-error history are derived/model metadata, not measured clinical truth.
- [ ] In `INTEGRATION_MAP.md`, define the preferred path:
  `observation -> canonical patient state -> continuous runtime -> prediction -> later observation -> Reality Engine -> calibration/gap evidence -> projections`.
- [ ] In `MATURITY_MODEL.md`, add maturity requirements for auditable prediction errors, replay/versioning, explicit unknowns, and counterfactual isolation.
- [ ] Verify no architecture document introduces a second canonical patient state.
- [ ] Commit atomically.

### Task 5: Canonical Structural Verification

**Files:**
- Read-only verification across all files changed in Tasks 1–4.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: evidence that future agents inherit one consistent doctrine.

- [ ] Read back exact `main` versions of all changed files.
- [ ] Verify every required agent entry point references the same Reality Engine child-spec path.
- [ ] Verify `S_compound` exists only as an architectural heuristic and is not described as a clinical score.
- [ ] Verify “real timeline vs counterfactual branch” separation is explicit.
- [ ] Verify personalization/parameter updates retain identifiability, uncertainty, provenance, validation, and overfitting safeguards.
- [ ] Verify the repository never claims Reality Engine implementation simply because doctrine propagation is complete.
- [ ] Inspect exact-head commit status/workflow evidence; report unknown/absent CI as unknown, not green.
- [ ] Record completion evidence in this plan file and commit the execution record.

## Follow-on Plans

After this canonicalization plan is reviewed and executed, do **not** implement the entire Reality Engine in one batch. Create separate implementation plans, in this order:

1. Reality Error Ledger.
2. Personal Parameter Registry + Identifiability Contract.
3. Biological Git / Checkpoint Graph.
4. Reality Gap Registry.
5. Counterfactual Branch Runtime.
6. Calibration Engine.
7. Active Sensing Planner.
8. Causal Graph Runtime.
9. Human Model SDK/Registry.
10. User-facing projection convergence.
11. Privacy-preserving population learning only after governance is separately specified.

Each follow-on plan must use TDD, preserve real-vs-simulated truth boundaries, and produce independently testable software.
