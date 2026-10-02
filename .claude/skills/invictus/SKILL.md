---
name: invictus
description: Use when the Panacea owner explicitly invokes @invictus, says "activate Invictus", or asks for Invictus-mode repository execution. Converts the canonical PANACEA_INVICTUS_PRINCIPLE into an execution procedure without bypassing clinical, privacy, security, provenance, testing, or PR gates.
---

# Panacea Invictus — execution mode

`@invictus` is an explicit owner command to apply the canonical Invictus execution law to the current Panacea task. It is **not** permission to bypass safety, evidence, tests, consent, provenance, review, or Git flow.

## Canonical authority

Read and obey, in order:

1. `CLAUDE.md`
2. `AGENTS.md`
3. `PANACEA_INVICTUS_PRINCIPLE.md`
4. `PANACEA_PRODUCT_MATURITY_OS.md`
5. `automation/AUTONOMOUS_RND_LOOP.md`
6. task-specific architecture, biomedical, security, privacy, and provenance documents

If they conflict, the authority order in `CLAUDE.md` wins.

## Activation semantics

When the owner writes `@invictus`:

- apply Invictus to the **current requested scope**; do not invent a parallel product or state model;
- preserve existing useful capabilities and canonical patient/human state;
- prefer **REUSE > CREATE, CONNECT > DUPLICATE, MATURE > EXPAND, DEPTH > DISPERSION**;
- treat measured/recorded, derived, estimated, simulated, reference, counterfactual, and unknown states as distinct truth classes;
- represent missing evidence or unmodeled depth as a reality gap, never as persuasive certainty;
- use the strongest justified implementation path, but no model/tool is exempt from repository gates.

## Invictus objective

Use the canonical architecture heuristic:

```text
I_invictus =
  D_vertical
  * C_cross_system
  * L_longitudinal
  * R_reality
  * G_governance
  * U_reuse
```

A near-zero critical dimension constrains the whole capability. Feature count, visual polish, model power, or commit count cannot compensate for weak validation, governance, reality grounding, integration, or mechanistic depth.

## Execution loop

### 1. VERIFY STATE
- Read exact latest `main` SHA.
- Inspect active PRs/checks and overlapping changed paths.
- Read the relevant canonical registries and current implementation before writing.
- Never trust stale green CI or an old local state.

### 2. FIND THE MEANINGFUL GAP
Select the smallest coherent gap that materially improves one or more of:
- canonical human state;
- mechanistic/domain depth;
- cross-system or cross-scale coupling;
- longitudinal continuity;
- reality validation/falsification;
- reusable infrastructure;
- safe projection into existing product surfaces.

Hard safety/security/data/clinical blockers remain first constraints.

### 3. DEEPEN BEFORE EXPANDING
Follow:

```text
OBSERVE
-> REPRESENT
-> EXPLAIN
-> MODEL
-> COUPLE
-> SIMULATE
-> FALSIFY
-> VALIDATE
-> PROJECT
-> LEARN
-> DEEPEN
-> JUSTIFIED EXPANSION
```

Do not add another page, engine, registry, state store, or abstraction if the existing one can be extended safely.

### 4. IMPLEMENT THROUGH CANONICAL CONTRACTS
- Search before creating.
- Use `panacea-architecture` for placement and dependency boundaries.
- Keep Canonical Patient State authoritative for measured/recorded truth.
- Keep model-derived physiology, simulations, hypotheses, references, and counterfactuals separate.
- Preserve provenance, uncertainty, consent, access lineage, and human agency.
- Do not fabricate citations, patient specificity, model validation, or clinical review.

### 5. PROVE THE CHANGE
Use `panacea-testing` for changed logic:
- positive case;
- negative/fail-closed case;
- boundary case where relevant;
- security/privacy/authorization case where relevant;
- regression case for a bug.

Run the narrow test first, then the required repo gates. Never weaken a test or biomedical/security gate to get green.

### 6. INTEGRATE, DO NOT SELF-MERGE
Use `panacea-git-flow`:
- branch from exact latest main;
- one logical change per branch/PR;
- rebase your own branch if main moves;
- open a PR with concrete validation evidence;
- inspect exact-head CI;
- do not merge your own PR unless the owner explicitly instructs it.

### 7. REPORT VERIFIABLE DELTAS
Report only evidence-backed state:
- base/main SHA;
- branch + PR;
- concrete capability changed;
- tests/checks actually run;
- CI status on exact head;
- blockers/reality gaps that remain.

Do not report invented completion percentages.

## Invictus stop conditions

Stop, fail closed, or escalate instead of improvising when:
- the requested behavior would weaken clinical safety, privacy, security, consent, provenance, or human review;
- required evidence or patient-specific measurement does not exist;
- a conflicting active PR owns the same mutable surface and safe reconciliation is not established;
- exact-head validation is red;
- the proposed expansion does not compound the canonical human model.

The correct Invictus response to an unknown is **make the unknown explicit, preserve the boundary, and deepen the evidence path**.
