# Vertical Biological Graph Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first executable No-Hollow-Gap substrate and bind the current cardiovascular physiology runtime to an evidence-linked whole-person→DNA vertical lineage.

**Architecture:** Add a small canonical biological graph layer beside the existing physiology runtime, not inside UI pages. It represents ordered multiscale lineages, explicit vertical gaps/not-applicable steps, source-backed visualization metadata, and mechanism edges. A cardiovascular seed then maps existing physiology fields onto concrete biological nodes so Body Exposure/Clinical/Simulation can project the same state without inventing patient-specific biology.

**Tech Stack:** TypeScript, existing `scripts/uji` deterministic test harness, existing physiological runtime and provenance contracts.

**Spec:** `PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`

## Global Constraints

- Vertical depth before horizontal breadth.
- Superficial, artificial/fabricated, and subjective/unsupported representations are prohibited.
- Missing scientifically relevant layers must be explicit `VERTICAL GAP — NOT YET MODELED`.
- Observed, derived, estimated-latent, simulated, population-reference and unknown state must not be conflated.
- 3D/3DCG representation must preserve biological identity, evidence and truth class; animation is not simulation.
- Existing physiology/runtime contracts remain canonical; do not create page-local physiology.
- No patient-specific molecular, omics or anatomical claim is inferred from reference data.
- Unknown uncertainty remains unknown.

## Review Focus

1. A lineage skips tissue→cell directly: validator must reject unless the intermediate required step is explicitly represented as gap/not-applicable.
2. A 3D/molecular representation has no evidence/source id: validator must fail closed.
3. A reference gene/DNA node is accidentally marked patient-specific: validator must reject it.
4. A physiology field binds to a biological node at the wrong scale/domain: binding validator must reject it.
5. Duplicate node ids or dangling relation endpoints: graph validation must reject composition.

---

### Task 1: Canonical vertical biological graph and No-Hollow-Gap validator

**Files:**
- Create: `src/lib/biology/verticalBiologyGraph.ts`
- Create: `scripts/uji/vertical-biological-graph.mts`

**Interfaces:**
- Consumes: none.
- Produces:
  - `BIOLOGICAL_SCALE_ORDER: readonly BiologicalScale[]`
  - `BiologicalScale`
  - `VerticalTruthScope`
  - `VerticalNodeStatus`
  - `VerticalBiologicalNode`
  - `VerticalBiologicalRelation`
  - `VerticalLineageStep`
  - `VerticalLineage`
  - `VerticalBiologicalGraph`
  - `validateVerticalBiologicalGraph(graph): string[]`
  - `createVerticalBiologicalGraph(graph): VerticalBiologicalGraph`
  - `assessVerticalLineage(lineage): { implemented: number; gaps: number; notApplicable: number; total: number; completeness: number }`

- [ ] **Step 1: Write the failing graph-contract test**

Test must assert:
- adjacent implemented scale chain is accepted;
- duplicate ids fail;
- dangling relations fail;
- an implemented reference/3D node without evidence fails;
- patient-specific truth is forbidden on reference molecular/genomic nodes;
- skipped required scale fails unless represented by `gap` or `not-applicable`;
- completeness counts explicit gaps rather than hiding them.

- [ ] **Step 2: Run test to verify RED**

Run: `npm run uji`  
Expected: FAIL because `src/lib/biology/verticalBiologyGraph.ts` does not exist.

- [ ] **Step 3: Implement the minimal graph contract and fail-closed validator**

Keep representation metadata semantic; do not add renderer code.

- [ ] **Step 4: Run test to verify GREEN**

Run: `npm run uji`  
Expected: PASS including `vertical-biological-graph`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/biology/verticalBiologyGraph.ts scripts/uji/vertical-biological-graph.mts
git commit -m "feat(biology): add no-hollow-gap vertical graph"
```

### Task 2: Cardiovascular whole-person→DNA reference lineages

**Files:**
- Create: `src/lib/biology/cardiovascularVerticalLineage.ts`
- Create: `scripts/uji/cardiovascular-vertical-lineage.mts`

**Interfaces:**
- Consumes: Task 1 graph interfaces.
- Produces:
  - `CARDIOVASCULAR_VERTICAL_EVIDENCE`
  - `CARDIOVASCULAR_VERTICAL_GRAPH`
  - `cardiovascularVerticalGraph()`

The seed graph must include at least:
- person → cardiovascular system → heart → left ventricle → LV myocardium → cardiac dyad → ventricular cardiomyocyte;
- sarcoplasmic reticulum / RyR2 complex / RYR2 protein / calcium-induced calcium-release pathway / Ca²⁺ / RYR2 transcript / RYR2 gene-locus / chromatin / DNA reference;
- sarcomere / cardiac troponin complex / TNNC1 reference branch;
- explicit gaps wherever the repo does not yet have a defensible modeled layer;
- source ids anchored to the repository evidence objects plus PMIDs 28956314, 32661902, 34745372, 39211905 and NCBI Gene RYR2 6262 / TNNC1 7134.

- [ ] **Step 1: Write the failing cardiovascular lineage test**

Assert the graph:
- validates with zero structural errors;
- contains both RyR2 calcium-handling and troponin/sarcomere lineages;
- reaches DNA through explicit intermediate layers rather than a gross-anatomy→gene jump;
- marks all molecular/genomic values reference-only, never patient-specific;
- reports remaining explicit gaps.

- [ ] **Step 2: Run test to verify RED**

Run: `npm run uji`  
Expected: FAIL because cardiovascular vertical seed does not exist.

- [ ] **Step 3: Implement the source-backed reference graph**

Do not invent patient-specific expression, activity, geometry or pathway state.

- [ ] **Step 4: Run test to verify GREEN**

Run: `npm run uji`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/biology/cardiovascularVerticalLineage.ts scripts/uji/cardiovascular-vertical-lineage.mts
git commit -m "feat(cardio): seed whole-person-to-DNA vertical lineage"
```

### Task 3: Bind physiological runtime outputs to vertical biological nodes

**Files:**
- Create: `src/lib/biology/physiologyVerticalProjection.ts`
- Create: `scripts/uji/physiology-vertical-projection.mts`
- Modify: `DOCS/PHYSIOLOGICAL-RUNTIME.md`

**Interfaces:**
- Consumes:
  - Task 1 graph interfaces;
  - Task 2 cardiovascular graph;
  - `PhysiologicalSimulationResult` from `src/lib/physiology/runtime.ts`.
- Produces:
  - `VerticalPhysiologyBinding`
  - `CARDIOVASCULAR_PHYSIOLOGY_BINDINGS`
  - `validateVerticalPhysiologyBindings(graph, bindings): string[]`
  - `projectPhysiologicalStateToVerticalGraph(graph, result, bindings)`

Initial bindings:
- `cardio.lv.stroke_volume` → left ventricle;
- `cardio.lv.ejection_fraction` → left ventricle;
- `cardio.cardiac_output` → heart/cardiovascular-system projection;
- `arterial.oxygen_content` → systemic arterial blood/circulatory projection;
- `systemic.oxygen_delivery` → whole-body/circulatory projection.

- [ ] **Step 1: Write the failing projection test**

Assert:
- real runtime outputs map to declared graph nodes;
- provenance/truth class/sigma remain unchanged;
- unknown fields are not synthesized;
- wrong node id, scale or domain fails closed;
- population/reference nodes cannot silently receive measured patient truth when a binding is declared reference-only.

- [ ] **Step 2: Run test to verify RED**

Run: `npm run uji`  
Expected: FAIL because projection module does not exist.

- [ ] **Step 3: Implement minimal projection adapter**

Projection must be read-only; never write model-derived state into Canonical Patient State.

- [ ] **Step 4: Run test to verify GREEN**

Run: `npm run uji`  
Expected: PASS.

- [ ] **Step 5: Run whole relevant suite and build**

Run: `npm run uji && npm run build`  
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/biology/physiologyVerticalProjection.ts scripts/uji/physiology-vertical-projection.mts DOCS/PHYSIOLOGICAL-RUNTIME.md
git commit -m "feat(physiology): project state through vertical biology graph"
```

## Completion

After all tasks:
- exact-head Validate must pass;
- Stabilization Acceptance must pass;
- Body 3D Render Acceptance must pass;
- Clinical Evidence and Security gates must remain green;
- perform whole-branch review before integration;
- do not claim a new whole-body completion percentage until a trustworthy vertical denominator exists.
