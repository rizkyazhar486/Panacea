# T-CLIN Infinity — Scientific Simulation and Multi-Agent Execution Guidance

**Status:** Proposed owner-directed simulation guidance; effective on merge, subordinate to the Panacea Constitution, AGENTS.md safety rules, docs/governance/README.md, the existing TASK_BOARD, acceptance gates, and active owner directives.

**Audience:** Kimi (simulation and biomedical knowledge), Claude Sonnet (visual/interactivity and simulation QA), Astra (architecture, safety and independent integration review), Argon/Gemini (research, evidentiary synthesis and non-overlapping frontier discovery). Names denote preferred workstreams, not guaranteed permissions or capability tiers.

**Problem addressed:** A T-CLIN task can declare a "simulation truth class" while implementing only a deterministic explanatory projection. Without a shared taxonomy, teams can incorrectly claim dynamic, 3D, quantitative, or clinically validated simulation. This guidance prevents that misrepresentation and cross-agent file collisions.

## 0. Operational precedence and non-negotiable reality

Before working, read AGENTS.md, CLAUDE.md, docs/governance/AGENT_ENTRYPOINT.md, docs/governance/README.md, docs/governance/TASK_BOARD.md, docs/governance/PROJECT_REALITY_MAP.md, docs/architecture/PATIENT_STATE.md, and governance/doctrine/PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md.

Do not interpret this document as authorization to bypass red-main stabilization, the current Clinical Encounter Orchestrator wedge, branch protections, reviewer independence, permissions, data licenses, or clinical validation requirements.

At the repository snapshot observed on 2026-10-27, T-CLIN-32–55 describe mechanisms as simulation/proxy truth classes in clinical continuity projections; T-CLIN-34 describes a longevity-trajectory model; src/lib/surgicalSimulation.ts is explicitly an educational phase/state scaffold; and src/lib/anatomy/imagingAcquisitionSimulation.ts defines synthetic acquisition contracts. Those examples are NOT proof of patient-specific, high-fidelity, calibrated or clinically validated simulation. Check current code and TASK_BOARD on every subsequent run; task and status numbers are not permanent facts.

The canonical patient record answers what was actually measured/reported/recorded. Physiological State Engine and simulation branches answer what an explicitly versioned computational model represents. These must never silently merge. Reference anatomy is not patient anatomy. Simulated outcomes do not sign notes, prescribe medicines, order tests, initiate interventions or acquire patient-truth status.

## 1. What counts as a simulator? The S0–S5 maturity contract

Maturity is assessed PER MODEL and PER INTENDED USE, not per task ID, branding, UI animation, or test count. Record level, evidence and unresolved limitations explicitly.

| Level | Label | Required behavior | Acceptable claim | Not acceptable |
|---|---|---|---|---|
| S0 | Explanatory mechanism projection | Source-backed concept, terms and directional relations; labels and truth class | Mechanism explainer | Dynamic simulation |
| S1 | Interactive conceptual visualization | Actual interactive states, timeline or diagrams; deterministic scenario behavior; visibly synthetic | Educational interactive model | Predictive physiology, measured molecular state |
| S2 | Quantitative computational simulation | Explicit state variables, physical units, sourced parameters, time evolution, solver, initial/boundary conditions, reproducible output, numerical tests | Mathematical simulation under stated assumptions | Calibrated clinical model without external evidence |
| S3 | Coupled multiscale simulation | Typed coupling between validated or independently tested submodels, time/space scale reconciliation, numerical stability and error budgets | Coupled simulation within tested domain | Whole-human predictive digital twin by assertion |
| S4 | Externally validated research simulation | Independent benchmark datasets, pre-specified metrics and tolerance, external replication, out-of-domain/missingness performance | Validated for specified research questions/datasets | Clinical authorization |
| S5 | Intended-use clinically validated model | Qualified human review, appropriate clinical studies, regulatory/ethical assessments where applicable, real-world performance and post-deployment monitoring | Clinical-use claim bounded by its actual authorization | Universal validity, autonomous patient intervention |

The labels above are a proposed governance convention, not an existing engineering fact. An S1 diagram can be excellent education while remaining uncalibrated. A model must not advance S0→S2 because a React panel draws curves. A physics-based animation is not automatically a correct physiology model. S4/S5 are deferred when evidence or human authority is absent.

## 2. Evidence classes, hypotheses and truth semantics

Every simulation, plot, card, export and graph node must distinguish source-backed observed data, reference atlas, calculated value, model-derived, simulated, counterfactual, experimental, speculative and unknown. Preserve the repository's existing truth-class terminology and adapters; do not introduce a rival patient-state authority.

Store at minimum modelId, modelVersion, modelFamily, source references/versions, literature DOI/PMID/URL where available, algorithmId, solver and solver version, parameterSetId, parameter units and provenance, initial conditions, boundary conditions, simulation time range, spatial reference when relevant, seed for stochastic calculations, uncertainty policy, benchmark/validation class, limitations and timestamp.

If a numerical constant or relationship is borrowed from literature, cite the actual primary source and applicable species, temperature, pH, tissue, and assay context; a model with no appropriate parameters must render an explicit illustrative or unavailable state.

Scientific interpretation classes: established finding, replicated observation, supported association, calibrated research model, preclinical hypothesis, investigational clinical hypothesis, exploratory speculation. Do not collapse experimental/mathematical and clinical truth.

For genome editing, stem cells, RNA interference, mutation engineering and related interventions: permit conceptual educational and mechanistic modeling, comparative evidence and non-operational risk visualization; do not supply harmful experimental protocols, genomic edit designs for misuse, patient-specific unauthorized intervention, or unsupervised treatment algorithms.

## 3. Core architecture: reusable simulation infrastructure before infinite features

Use existing domain architecture, rather than automatically creating a new app or parallel database. Investigate existing simulation engines, src/domains/clinical-operations, src/domains/body-exposure, shared primitives, canonical patient state, molecular references and the existing test layout before naming new paths. Only create new folders when a vertical slice demonstrates genuine reuse; no speculative abstractions without a consumer.

Proposed logical layers (adapters may map to existing repo code):

A. **Knowledge & references:** typed model registry, provenance, ontology IDs, human-readable mechanisms, source/licence, experimental vs predicted structures. Support future Chinese (SinoMed, NGDC, ChiCTR) and Russian (eLIBRARY, CyberLeninka, clinical guideline) sources only through lawful/permissioned access and translated terminology with original-language provenance. Avoid unlicensed bulk scraping, controlled-access genetic data and automatic authority promotion.

B. **Model contract:** typed state and parameter schema, units, time scale, boundary conditions, causality constraints, version and evidence level. A model must include declared inputs, outputs, solver, error model, and domain limits.

C. **Execution kernel:** deterministic integrators for simple models, optional stochastic kernel with explicit seeds, timeout/budget/cancellation hooks, reproducibility and numerical diagnostic results. Use a Web Worker or server only when actually needed and available; never assume one exists.

D. **Typed coupling:** declare molecule→organelle→cell→tissue→organ→system connectors with dimensional conversions, transfer rates, bounded error, no cross-scale double counting and separation of synthetic/reference/patient state.

E. **Presenters:** simple explanatory card (Wonder), interactive time/space visualizer (Explore), equations, sources, parameter controls, sensitivity plot and scientific uncertainty (Deep Dive). Visualization reads data; it never silently invents biological parameters. Allow a fallback 2D/table state if WebGL or computing is unavailable.

F. **Research provenance and reproducibility:** portable run manifest, versioned model parameters, fixture replay, optional standards exports (SBML/CellML for suitable mathematical models, SED-ML for experiment definition, COMBINE/OMEX packaging where justified). Do not claim standard compatibility without parser/export conformance tests.

G. **Care integration:** expose explanatory/reference and explicitly simulated results to CareEpisode/VisitOS only through typed, provenance-aware read-only projections. Source-backed patient records must not be mutated by simulation effects or scenario actions.

Example conceptual run contract (adapt to actual repository types):

~~~ts
type SimulationMaturity = 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'
type SimulationTruth = 'reference' | 'simulated' | 'model_derived' | 'experimental' | 'unknown'
type SimulationRequest = {
  modelId: string
  version: string
  maturity: SimulationMaturity
  truthClass: SimulationTruth
  parameterSetId: string
  initialState: Record<string, { value: number; unit: string }>
  boundaryConditions: Record<string, { value: number; unit: string }>
  startTime: number
  endTime: number
  stepSize: number
  solver: string
  seed?: number
  sources: string[]
}
type SimulationOutput = {
  modelId: string
  version: string
  truthClass: 'simulated' | 'model_derived'
  traces: Array<{ variable: string; unit: string; points: Array<{ time: number; value: number }> }>
  warnings: string[]
  validationLevel: SimulationMaturity
  provenance: string[]
}
~~~

This is documentation of a candidate contract, NOT an assertion that these interfaces already exist. Validate actual types before coding.

## 4. Scope of the scientific simulation frontier

- **Genetics and molecular information:** nucleotide chemistry, transcription and splicing, translation, allele variation, epigenetic states, replication and repair, chromosome dynamics, structural-variant concepts.
- **Protein and molecular machinery:** conformational states, ligand binding, enzyme kinetics, receptor signaling, post-translational processing, misfolding, ER stress/UPR, proteasome, chaperones and autophagy.
- **Organelles:** mitochondria, peroxisomes, nucleus, endoplasmic reticulum, Golgi, lysosomes, vesicle transport, cytoskeletal interactions.
- **Cell cycle:** G0, G1, S, G2, mitotic phases, checkpoints, proliferation, quiescence, senescence and death with lineage/cell-type dependence.
- **Cell populations:** stem cell niche, differentiation, tissue repair and organoids with cell-type-specific assumptions and oncogenic trade-offs.
- **Pharmacology:** receptor occupancy, PK/PD teaching models, interaction networks, treatment evidence and adverse-effect mechanisms; not autonomous prescriptions.
- **Systems physiology:** cardiovascular dynamics, respiratory exchange, electrophysiology, renal clearance, endocrine feedback, immunity, musculoskeletal biomechanics, neuronal propagation; preserve organ couplings and scales.
- **Procedures and imaging:** educational geometric acquisition, anatomy-linked simulation, safe scenario rehearsal, synthetic images clearly differentiated from clinical imaging; no unsupervised operative manual or diagnostic inference.
- **Longevity & regeneration:** aging pathways, cellular adaptation, stem-cell regeneration and candidate therapies as sourced mechanisms or bounded hypotheses, not proof of rejuvenation.
- **Frontier:** quantum chemistry concepts, molecular stochasticity, spatial omics and counterfactuals only where a falsifiable model or source justifies them; fantasy is an interface to curiosity, never empirical truth.

A T-CLIN task may improve any of these; new IDs are proposed only after confirming a distinct unclaimed gap in TASK_BOARD. The mission is infinite research potential, not infinite shallow widgets.

## 5. Numerical method standards and explicit formulas

Implement equations only in a suitable domain and with correct assumptions, units and source provenance.

- Well-mixed mass-balance prototype: dx/dt = S * v(x, theta, u, t). State the stoichiometric matrix, units, conservation law, rate assumptions and boundary fluxes; constrain unphysical negative concentrations appropriately.
- Michaelis–Menten: v = Vmax * [S] / (Km + [S]); valid for its mechanistic assumptions and context, not every allosteric enzyme.
- Hill occupancy approximation: theta = [L]^n / (Kd^n + [L]^n); coefficient is an empirical descriptor, not necessarily site count.
- First-order clearance illustrative model: dC/dt = -(CL/V) * C, provided volume, clearance, concentration and units are defined; do not fit patients without authorized data.
- A cell-population schematic: dN/dt = (k_proliferation - k_death) * N; does not establish individual cell-cycle timings or tumor growth.
- Hazard or survival models and Gompertz-type aging are population/statistical constructs, never personal biological death predictions by default.

Require a reference case with expected numeric output; dimensional/unit tests; analytic limiting cases if available; perturbation tests; invariant checks (conservation, non-negativity where applicable); deterministic repeat runs; stochastic seed reproducibility; solver convergence under timestep refinement; parameter sensitivity; extreme/NaN/Infinity/missing input failures; performance budget and stable output order.

Separate "time of display animation" from "physical simulation time." A slowed animation does not change biologic kinetics.

Independent model comparison and dataset validation are mandatory before claiming S4. Patient use is blocked without the appropriate S5 path.

## 6. Multi-agent work allocation with collision control

These are preferred lanes subject to docs/governance/JOB_DESCRIPTIONS.md and current task ownership. Agents MUST NOT silently commandeer another lane's branch or files.

| Agent | Primary scope | Expected artifact | Explicit exclusions |
|---|---|---|---|
| **Kimi K3.1 Pro Max Ultra Ultimate** | Mechanistic model and numerical kernel, model registry, scientific sources and global knowledge graph, reproducibility and numeric validation | Source-backed simulation contract, equations, pure domain engine, golden tests, typed outputs, run manifest | UI redesign without lane agreement; patient-state writes; independent approval of own output |
| **Claude Sonnet** | 2D/3D visual implementation, timeline interaction, Body Exposure integration, accessible UI, browser/visual/performance proof, non-owner PR conflict resolution when authorized | Scientific renderer driven by Kimi's agreed schema, fallback views, screenshot/interaction tests, asset licence records | Inventing molecular measurements, unsourced constants, claiming clinical accuracy, changing Kimi-owned engine simultaneously |
| **Astra / GPT Work-Codex** | Architecture, integrity, privacy/security, CI/stabilization, independent red-team review and integration disposition on own scope | Review dossier, risk assessment, exact-head checks, first failing assertion, architecture/clinical-truth negative tests | Taking over other-agent PRs, self-approval, bypassing main-red stop |
| **Argon / Gemini** | Orthogonal biomedical evidence research, Chinese/Russian multilingual source triage, frontier hypotheses, model benchmark literature, knowledge-graph design/research on independent files | Evidence tables, source identity/licence, benchmark candidates, falsifiable hypotheses, research adapters if authorized | Independent clinical validation claim, speculative physiology promotion, editing another agent's shared file |

Handoff: Kimi provides typed data schema and scientific truth limitations; Sonnet consumes it without changing physics. Argon supplies sources and differential evidence; Astra challenges model correctness and verifies safety/CI. Claude-only cross-agent code/branch takeover rule in JOB_DESCRIPTIONS remains controlling. Author and reviewer cannot be the same lane. No two open PRs change the same file. Per-lane WIP and one integrator remain in force.

Do not serialize unrelated file-safe tasks needlessly, but treat all shared Clinical types / CareEpisode / main as integration-critical and request an ownership lease before touch.

## 7. Kimi ↔ Sonnet model–view handshake

The handshake is a reviewed interface contract, not a prompt agreement.

Kimi's model contract MUST declare:
- Model identifier, biological scope, maturity and truth class.
- State vector with human-readable variable names, units, valid ranges and meaning.
- Parameter defaults from sourced evidence, unknowns and uncertainty bands.
- Input changes permitted to explore (non-clinical education); no biological execution protocol.
- Time step, physical timescale, integration solver and numerical failure conditions.
- Semantically typed events for cell-cycle/organelles/signaling and optional 3D coordinates with provenance.
- Synthetic reference example and golden trace fixtures.
- Version, scenario ID, deterministic replay manifest, citations and known failure modes.

Sonnet's renderer MUST:
- Consume those exact fields, never hardcode biology into rendering or infer missing kinetics.
- Synchronize timeline and user actions to model simulation time.
- Preserve qualitative vs quantitative differences and visible "Simulated / Educational" warnings.
- Show state changes, pause/play, reset, step, speed and parameter controls only if the model supports them.
- Provide 2D/table fallback, keyboard and touch input, accessible labels, motion-reduction compliance, mobile 390x844 and desktop 1440x900 with no overflow.
- Render "Unknown/Not available" rather than interpolate missing patient data.
- Use biological diagrams, structural models and assets with recorded source, resolution, licensing and uncertainty.
- Capture assertions and screenshots for deterministic fixtures; prove zero unexpected errors and bounded resource usage.
- Keep patient/clinical commands disabled in simulation context.

Any schema change requires coordinated interface evolution through separate non-overlapping PRs or a single owner under review. Never co-edit a shared file blindly.

## 8. Vertical-slice reference: T-CLIN-55 ER stress and unfolded-protein response

This is an illustrative candidate, not permission to take a task owned by Gemini or claim it has not since merged. First recheck status and file leases.

**Question:** How does the endoplasmic reticulum respond to unfolded proteins?

**Established explanatory scope:** BiP/GRP78 chaperone interactions, IRE1 and ATF6 signaling, PERK as relevant within UPR, adaptive recovery, and possible prolonged stress responses. Avoid asserting a single molecular mechanism universally across all cell types.

**S0:** Source-linked pathway explainer with unknowns and species context.

**S1:** Animated conceptual pathways controlled by a preset ("baseline / increased folding burden / adaptive response / prolonged stress"), clearly synthetic. Events reflect mechanism, not assumed quantitative intracellular concentrations.

**S2:** Only if a reproducible published kinetics model with appropriate parameters is available and reuse is allowed; define states such as U (unfolded protein pool), F (folding capacity), D (clearance flux) and explicitly sourced dynamics. Do not invent rates to present as human measurements. Accept an illustrative toy equation with a prominently labelled synthetic status, without upgrading evidence to physiological validity.

**S3:** Link to protein translation, ERAD, autophagy and cell survival through typed rates and bounded model interactions only after checking no unsupported parameter handoff.

**S4/S5:** Independent data/review required; cannot be claimed from frontend demo or synthetic test.

A minimal useful PR is one real model or concept + one interactive consumer + positive/negative tests + source and maturity badge. Do not expand 30 adjacent pathways in one giant diff.

## 9. Test and acceptance matrix

Every simulation PR includes:
1. Repo ancestry, scope and overlap check, truth-class contract, and existing feature preservation.
2. Positive and negative input fixtures, known boundary conditions and valid parameter units.
3. Mathematical golden values where S2+, numerical reproducibility, convergence and failure-path assertions.
4. Model-independent tests that invalid/missing sources cannot become "measured" or "clinically reviewed."
5. Explicit unsupported domain/unknown states; fake patient input cannot become signed/diagnostic.
6. UI interaction tests and screenshots for S1+, including empty/error/loading states and accessibility.
7. Resource/performance budget: capped steps and memory, predictable cancellation; adapt to actual repo quality gates.
8. Licence/source audit for any external assets, data, model parameter sets or structures.
9. Engineering verification at the exact head SHA, required CI including Body 3D acceptance where affected, independent reviewer and merge proof.
10. Claim ledger: implementation vs engineering-tested vs simulation validated vs clinical validation vs deployed, never conflated.

Suggested acceptance evidence:
- One replayable scenario manifest + versioned model and parameter set.
- At least two golden or mechanistic fixtures and at least two negative/fail-closed controls (additional cases per invariant).
- A documented test that intentionally fails when truth class or input units are corrupted (non-production sabotage proof).
- Mobile/desktop render evidence where visualization exists.
- Source table: DOI/PMID/URL, organism/tissue, parameter provenance, data licence, date, evidence level.
- A reviewer disposition and current check status bound to exact SHA.

No merge of new simulation claims merely because cosmetic UI tests are green. Conversely, do not hold an S0 educational explanation to S5 clinical standards: restrict its claims and preserve the appropriate phase gates.

## 10. Knowledge and standards references

Prefer standard identifiers and reproducible computational biology exchange where applicable:

- COMBINE standards: https://co.mbine.org/standards/ (SBML, CellML, SED-ML, BioPAX, SBGN and related formats).
- SED-ML experiment descriptions: https://sed-ml.org/
- BioSimulations and BioSimulators documentation: https://docs.biosimulations.org/
- Physiome / CellML model repository: https://models.physiomeproject.org/cellml
- Reactome pathways: https://reactome.org/
- EMBL-EBI BioModels: https://www.ebi.ac.uk/biomodels/
- Protein Data Bank: https://www.rcsb.org/
- UniProt: https://www.uniprot.org/
- NCBI ClinVar: https://www.ncbi.nlm.nih.gov/clinvar/
- National Genomics Data Center: https://ngdc.cncb.ac.cn/
- SinoMed: https://www.sinomed.ac.cn/
- CyberLeninka: https://cyberleninka.ru/

These are candidate reference sources; verify current availability, exact rights and scientific suitability for each task. A standardized file or published model is not itself independent biological validation.

## 11. Suggested sequence and infinite roadmap discipline

Order depends on live blockers, not numbering vanity:
- H0: repair failing main acceptance/safety/security before integration.
- Audit existing T-CLIN scientific maturity. Identify S0 projections misdescribed as simulations.
- Register reusable model metadata and source provenance in the existing architecture.
- Upgrade ONE mechanistic module to working S1 with evidence-safe interaction.
- Add a true S2 numerical kernel only after locating a reusable, adequately parameterized benchmark.
- Integrate graph/source knowledge from China, Russia and global repositories through permissioned adapters, without importing restricted content.
- Reuse kernel in cell-cycle, signaling, mitochondrial energetics, molecular transport, PK/PD teaching, and then selected organ physiology.
- Only attempt S3 coupling when inputs/outputs are dimensionally and mechanistically compatible.
- Consider S4 validation as a separate benchmark-driven research task.
- Keep S5 gated for qualified, intended-use clinical validation.

T-CLIN-56+, T-CLIN-100+, T-CLIN-∞ are proposals until registered/claimed in TASK_BOARD. No arbitrary upper bound, but no duplicate/shallow/generated "completed" task proliferation.

## 12. Ready-to-use model-specific prompts

- Kimi: [prompts/KIMI_TCLIN_SIMULATION.md](prompts/KIMI_TCLIN_SIMULATION.md)
- Claude Sonnet: [prompts/SONNET_TCLIN_SIMULATION.md](prompts/SONNET_TCLIN_SIMULATION.md)

Both prompts inherit this document and all higher governance. They are execution adapters, not exemptions from the source of truth. Astra and Argon work through their existing model-agnostic entrypoint and the responsibilities in section 6.

## 13. Completion rubric

Before telling anyone "T-CLIN simulation complete", answer with evidence:

- What actual simulation level (S0–S5) is implemented, for precisely which model?
- What computational state evolves and by what sourced laws, if S2+?
- Which inputs, outputs, units, assumptions, limitations and uncertainties are recorded?
- What source, model version, params and run manifest reproduce the result?
- Does any browser asset overstate anatomy, structural precision or clinical truth?
- Can test negatives catch provenance/missingness/NaN/clinical leakage?
- What is the exact PR head SHA and independent required CI status?
- Which human authorization or clinical-validation gates remain deferred?
- What user can now demonstrably learn or do that was impossible before?

If any answer is missing, mark the specific quality dimension incomplete, reduce the claim and continue the most valuable independent correction. Infinity is an intellectual frontier, not a reason to skip acceptance.
