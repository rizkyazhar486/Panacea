# Panacea VisSim-OS — multi-scale visualization & simulation OS

Owner direction (2026-09-26): position PanaceaMed as a multi-scale, GPU-native
Visualization & Simulation Operating System: patient-specific digital twins,
device–tissue physics, biomolecular design, immersive education and closed-loop
discovery in one coherent platform, rather than another viewer or simulator.

This document maps that vision onto the repository **as it really is**, and
defines the first implemented layer: the Multi-Scale Coupling Kernel.

## 1. Honest capability matrix

| Layer (owner spec) | State in this repo | Notes |
|---|---|---|
| Hardware/GPU acceleration (CUDA-X, BioNeMo, Isaac, MONAI) | **not integrated** | Browser + Node only. WebGL (Three.js) rendering. No GPU compute backend, no NVIDIA SDK access. |
| Data & knowledge fabric, provenance | partial | Canonical longitudinal state (`panaceaLongitudinalState.ts`), server-stamped EMR, FHIR R4 export, provenance on every coupling message. |
| Physics & simulation kernel | **first slices** | Coupling kernel (§2); geometric multigrid + smoothed-aggregation AMG (§5). CPU, deterministic. No FE/FSI/MD solver. |
| Generative & predictive AI (structure prediction, design) | not integrated | No protein-structure or molecule generator runs here. Must not be implied in UI. |
| Neural operators (FNO, DeepONet, GNO, HMgNO) | **not trained, slot only** | No training backend. `KorektorResidual` slot (§5) fails closed until a trained artefact with weight hash, training-data provenance and validation metrics is registered. |
| Brain OS layer | **not implemented** | Guardrails in §6. Only a synthetic modular graph is used, for algorithm testing. |
| Visualization & interaction | partial | Body Exposure: source-backed GLB atlas, exact-structure selection and camera framing, semantic depth rail, DICOM volume/MPR. No OpenXR. |
| Application layer (procedure planning, design studio, education) | partial | Surgical simulation scaffold, education, AI-EMR ↔ Body Exposure bridge. No patient-specific procedure planning. |
| Plugin system | partial | Coupling modules follow a Capability Contract (§2); no sandboxing/marketplace. |

Nothing in this table may be presented to users as more mature than stated.

## 2. Multi-Scale Coupling Kernel (implemented)

Files: `src/lib/multiskala/kernelKopling.ts`, `src/lib/multiskala/contohKatupJaringan.ts`,
`src/components/PanelKoplingMultiSkala.tsx` (Body Exposure), gate
`scripts/uji/kernel-kopling-multiskala.mts`.

- **Capability Contract.** Every scale module declares `produces` / `consumes`
  fields with units, its own `dt`, a pure `step()`, and optionally
  `mintaPerhalus()` (cells requesting higher resolution).
- **Hub-and-spoke.** Modules never call each other; the kernel delivers the latest
  published field. Solvers are therefore swappable.
- **Fail-closed composition.** Missing producer, duplicate producer, unit
  mismatch, undeclared output, non-finite value or negative σ → error, not a guess.
- **Multi-rate scheduling.** Each module steps when due (verified: 601/121/61
  steps for dt 1/5/10 s over 600 s).
- **Uncertainty.** Every field carries a per-cell 1-SD σ; the example propagates
  it with first-order (delta-method) derivatives. Spatial correlation is ignored.
- **Provenance.** Every message has a deterministic id, module, version, step,
  time and parent ids; chains are traceable to the initial conditions.
- **Adaptive resolution (signal only).** Cells whose binding uncertainty exceeds
  a threshold are flagged and recorded; no finer solver exists yet to switch to.

### Worked example (SIMULATED, illustrative parameters)

molecule → cell → tissue → back:

- θ = L / (L + Kd0·e^(−αε)) — Langmuir occupancy with a mechanosensitive Kd;
- da/dt = k_on(θ + βε)(1 − a) − k_off·a — first-order activation;
- E = E0(1 + γa); ε = load / E, smoothed with neighbours — linear elasticity.

Turning the downward (strain → molecule/cell) coupling off changes mean
occupancy by ≈0.076, which the gate asserts. The equations are standard forms;
the **numbers are illustrative**, not measured aortic-valve or VIC parameters, and
the output is not a patient or clinical prediction.

## 3. Novelty policy

Per `docs/PIONEER_PUBLICATION_DISCOVERY_SESSION.md`, no novelty is claimed from
model memory. Generic multiscale coupling frameworks already exist (e.g. MUSCLE3,
preCICE; agent-based cell simulators such as PhysiCell). The kernel here is
infrastructure, not an invention. Any future novelty claim — e.g. clinically
provenanced, uncertainty-first coupling tied to a patient's longitudinal record —
requires a recorded prior-art search, a falsifiable hypothesis and external
validation before it is stated anywhere user-facing.

## 4. Next steps, ordered by feasibility here

1. Replace the illustrative constants of one module with literature-sourced,
   cited parameter ranges (with units and citations), keeping the "simulated" label.
2. Couple the kernel to the canonical longitudinal state as a *boundary
   condition source* (e.g. a patient's measured blood pressure as load), never
   writing simulated values back as measurements.
3. Add a real finer-resolution molecular path (stochastic site sampling) that the
   refinement flags actually switch on.
4. Spatially bind a coupling grid to an exact Body Exposure source structure
   (reference geometry, labelled non-patient-specific).
5. GPU compute (WebGPU) only after 1–4 are validated and profiled.
6. External GPU/NVIDIA-class services (structure prediction, device physics) only
   through an authorized, provenanced adapter; never simulated as if present.

## 5. Multigrid backbone (implemented) and neural-operator slot

Owner direction (2026-09-26): neural-operator coupling (FNO / DeepONet / GNO,
multigrid neural operators, HMgNO-style hybrid residual correction, AMG on graphs).
A trained neural corrector sits **on top of** a correct multigrid hierarchy, so
the classical backbone is built and proven first.

- `src/lib/multiskala/multigrid.ts` — geometric V-cycle for −∇·(k∇u) = f with
  variable coefficients (weighted Jacobi smoother, full-weighting restriction,
  bilinear prolongation, re-discretised coarse operators). Measured: manufactured
  solution error ratio 4.00 per halving of h (second order); 11/12/12/12 cycles on
  17²…129² grids (grid-independent); mean convergence factor ≈ 0.14.
- `src/lib/multiskala/amgAgregasi.ts` — smoothed-aggregation AMG from matrix
  entries only (strength of connection, greedy aggregation, smoothed tentative
  prolongation, Galerkin RᵀAP). On a **synthetic** 480-node modular graph
  (`grafSintetis.ts`): 10 cycles vs 46,465 plain-Jacobi iterations, hierarchy
  480→143→12, first-level aggregates 92% within one community.
- `src/lib/multiskala/jaringanMultigrid.ts` — tissue module solving mechanical
  equilibrium on a 33×33 node grid coupled to the 24×16 cell grid by bilinear
  interpolation (a real cross-resolution exchange). Selectable in the Body
  Exposure panel.
- `KorektorResidual` — the HMgNO slot. Registering requires a 64-hex weight
  hash, training-data provenance and validation metrics; asking for a corrector
  that is not registered throws. No identity/no-op corrector may pose as trained.

Not implemented (needs a Python/GPU training service, authorised data and a
validation protocol): FNO/MG-FNO/DeepONet/GNO training, bidirectional
consistency losses, differentiable end-to-end design. When built, trained
artefacts enter only through `daftarkanKorektor` and keep the "simulated" label.

## 6. Brain OS guardrails (owner direction, not implemented)

- Research/education only. No clinical or implant pathway without separate
  ethics, regulatory and safety review.
- High-level states (endurance, will, emotion, faith, love, greed, hope) are
  emergent, multi-determined observables. Panacea never claims to measure or
  control subjective experience, and never presents a latent as such a state.
- No human synaptic connectome exists; any human brain model is a multi-scale
  scaffold (imaging-derived networks + population statistics) with explicit
  uncertainty. Synthetic graphs are labelled synthetic.
- Every simulated intervention logs provenance, uncertainty and counterfactuals.
- Starting point when this lane is prioritised: a published neural-mass model on a
  published parcellation, reproduced exactly, before any coupling or design.
