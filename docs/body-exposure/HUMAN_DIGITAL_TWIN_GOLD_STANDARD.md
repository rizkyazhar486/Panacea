# Human Digital Twin — Universal Human Gold Standard

Status: canonical source of truth for Body Exposure (owner directive, 2026-09-26).
Every agent must read this before modifying Body Exposure.

## 1. The rule

There is one standard: **the entire human body is gold standard.** No organ (eye, heart, brain, lung or any other)
is a privileged "gold standard" module. Implementation depth may differ temporarily because software is built
incrementally; the **target standard may never differ**.

The gate `scripts/uji/standar-emas-universal.mts` fails if organ-specific "gold standard" naming reappears in
Body Exposure code or docs. (Diagnostic "gold standard" — the reference test for a disease — is a different,
legitimate clinical term and is not affected.)

## 2. What Body Exposure is

A multiscale whole-human digital twin, not an anatomy viewer, not a set of organ pages, not a set of
disconnected simulations. Scale ladder: whole human → region → system → organ → structure → tissue →
histological layer → cell → organelle → pathway → protein/receptor → gene → DNA/RNA.

System model: `dx/dt = F(x, u, d, e, p)`: physiological state `x`, interventions `u`, disease `d`,
environment `e`, patient parameters `p`.

Interaction order is mandatory:

```
user action → intervention state → local physiology → systemic propagation → diagnostics → visualization → explanation
```

Never `user action → animation → numbers`.

## 3. Five layers every organ must eventually carry

1. Anatomy — source-backed geometry, relations, supply, drainage, innervation, layers, landmarks.
2. Physiology — executable state where scientifically feasible.
3. Pathophysiology — disease changes parameters of the physiology (resistance, compliance, conduction…), never only text or a red highlight.
4. Intervention — drugs, fluids, devices, procedures change state.
5. Diagnostics — vital signs, labs, ECG/EEG, ultrasound, imaging observe the **same** state and may not contradict it.

## 4. Honest gap audit (2026-09-26)

Largest whole-body gaps, in priority order (whole-body correctness → clinical importance → dependency → evidence availability → safety → education):

| # | Gap | Evidence in repo |
|---|-----|------------------|
| 1 | **No shared HumanState.** Organ engines compute independently; nothing prevents two modules from holding contradictory versions of one patient. | `hemodinamik.ts`, `gasAlveolar.ts`, `asamBasa.ts`, `nefron.ts`, `dialisis.ts`, `termoregulasi.ts`, `farmakodinamik.ts` each own their inputs. |
| 2 | **Inconsistent shared primitives.** O₂ content uses Hüfner 1.34 and solubility 0.003 in `hemodinamik.ts`; the ELSO VV guideline uses 1.39 and 0.0034. Both are published conventions; the twin needs one registered choice, not two silent ones. | `hemodinamik.ts:22-25`, `src/lib/ecmo/oksigen.ts` |
| 3 | No formula registry: equations live inside modules, with provenance in comments. | — |
| 4 | Diagnostics (imaging, labs) are mostly galleries/explanations, not observations of a state. | `digitalTwin.ts` is a scale/provenance map, not a physiological state. |
| 5 | Interventions/devices (ECMO, CRRT, ventilation) are not coupled to organ state. | ECMO engine begins in `src/lib/ecmo/` (this directive's first increment). |

Pre-existing honest pieces worth building on: `hemodinamik.ts` (P-V loop, Fick), `gasAlveolar.ts`,
`asamBasa.ts`, `nefron.ts`, `isncsci.ts` (lesion → deficit), `multiskala/kernelKopling.ts` (coupling kernel with
units and provenance), `universalAtlasStandard.ts` (scale ladder), `lokalisasiLesi.ts`.

## 5. Maturity waves (apply across the whole body)

A. whole-body architecture and shared primitives (HumanState, formula registry, units) ·
B. major organ systems connected · C. disease/pathophysiology · D. diagnostics/imaging as views of state ·
E. therapeutics/pharmacology (PK→PD→organ) · F. procedures/devices (ECMO, CRRT, ventilation, surgery) ·
G. cellular/molecular coupling · H. personalization.

## 6. Formula / scientific-model registry

Every implemented equation is a `ScientificModel` with: id, name, system, equation, variables with units,
assumptions, valid range, population, `EvidenceReference` ids, validation level. UI code never carries citations
directly; it points to evidence ids. First registry: `src/lib/ecmo/bukti.ts` (to be generalized into a
body-wide registry under Wave A; do not create a second parallel registry).

## 7. Validation pyramid

1 software (types, tests, determinism) · 2 mathematics (units, bounds, stability) · 3 physiology (golden
directional tests) · 4 pathophysiology · 5 cross-system · 6 clinical expert review (real, recorded) ·
7 educational validation. Levels 6–7 are never claimed without real reviewers/participants.

## 8. No-fake-data policy

Forbidden: random monitor numbers, looped animations presented as physiology, organ colours unrelated to state,
fabricated labs or AI interpretation, hard-coded normalization after treatment, duplicated patient states.
If a subsystem is not simulated, the UI says so ("not yet simulated").

## 9. Definition of done for any Body Exposure feature

Anatomy, physiology, pathophysiology coupling, systemic coupling, manipulability, diagnostic consistency,
provenance, numerical stability, tests, performance, UI clarity, accessibility, clinical review status, and
(when applicable) connection to HumanState. "It renders" is not done.

## 10. Safety boundary

Educational/research software. Simulation output is never patient-specific management advice. "Evidence-informed
and aligned with published guidance" — never "endorsed/certified" by a body that has not formally done so.
