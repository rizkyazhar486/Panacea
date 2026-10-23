# Panaceamed Gemini working entry point

> **Governance v2 (read first):** work selection, acceptance, verification, stabilization and roles are defined in
> [`docs/governance/README.md`](docs/governance/README.md) and machine-checked by `node scripts/qa/acceptance-v2.mjs`.
> Where process text below conflicts with it, `docs/governance/` wins. Product doctrine and safety rules below are unchanged.


> **Owner directive 2026-10-17 (clinical review phase boundary, see `governance/doctrine/PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md`):** C6 formal clinical review is outside the active Alpha engineering scope. Do not count it as unfinished Alpha work, do not let it block Alpha engineering completion, and do not reintroduce it into the active denominator without an explicit Product Owner decision. Deferral is not validation or authorisation for clinical use; `clinically_reviewed` stays false until genuinely reviewed.

> **Standar proyek terbaru (arsitektur, git flow branch+PR, unit test ketat):** ikuti [`CLAUDE.md`](CLAUDE.md). Jika bertentangan dengan dokumen ini, `CLAUDE.md` menang.

Gemini-class agents must follow the model-agnostic repository authorities in `AGENTS.md`, `PANACEA_CONSTITUTION.md`, `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `PANACEA_PRODUCT_MATURITY_OS.md`, and `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`.

For broad continuation, treat Panaceamed as a **Computational Human Platform**: preserve one canonical measured/recorded patient state, keep model-derived physiological state separate, deepen specialized domain engines, make cross-system coupling explicit, validate before stronger claims, and project shared state into Clinical, AI-EMR, Body Exposure and simulation. Prefer validated vertical depth over adding disconnected routes/widgets.

# Gemini entry point

Read `AGENTS.md` before material repository work.

Then follow the canonical operating layer referenced there, including `PANACEA_PRODUCT_MATURITY_OS.md`, the architecture documents, governance registries, and `automation/AUTONOMOUS_RND_LOOP.md`.

Do not create feature breadth merely to demonstrate activity. Preserve existing work, improve maturity and integration, and keep the source of truth evidence-backed.

If this adapter conflicts with `AGENTS.md` or the Panacea Constitution, the higher authority governs.


## Reality Engine / compounding human depth

Gemini must inherit the model-agnostic doctrine in [docs/superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md](docs/superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md) for computational-human, Clinical, AI-EMR, Body Exposure, simulation, device, and longitudinal-health work.

Future depth is both biological and longitudinal: deepen scientific scale continuity while also deepening personal calibration **only after parameter identifiability is established**, temporal replay, causal explanation, Reality Gap/uncertainty, prediction-vs-reality falsification, outcome feedback, and counterfactual validity.

Never overfit personalization, invent hidden state, hide uncertainty, rewrite real history with newer models, convert correlation into causation, or present counterfactual branches as real outcomes. Real observed history remains canonical; simulated branches remain isolated.

This is an architecture requirement, not a claim that the Reality Engine runtime is implemented.
