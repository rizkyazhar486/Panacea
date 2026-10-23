# PanaceaMed Counterfactual Human Biology Lab

## Invention thesis

PanaceaMed should not only answer “what is this disease?” It should support the research question:

> If one biological state changed, what downstream states would be expected to move, with what uncertainty, and what data would falsify that hypothesis?

This feature encodes a biological hypothesis as an executable graph spanning molecular, organelle, cell, tissue, organ and observable-phenotype levels.

## Why this is useful

A conventional atlas is descriptive. A conventional chatbot is linguistic. A counterfactual biology engine is **mechanistic and inspectable**.

The initial implementation provides five research-grade educational scenarios:

1. neurovascular ischemic stress,
2. retinal metabolic stress,
3. cardiac remodeling/fibrosis,
4. EGFR–MAPK tumor signaling,
5. glomerular injury.

Each scenario contains:

- normalized biological state nodes,
- signed weighted causal edges,
- virtual perturbation presets,
- a time-indexed 4D propagation model,
- explicit uncertainty bands,
- a graph-theoretic leverage ranking,
- falsification measurements,
- a patient-specific data gate,
- literature anchors.

## Current mathematical model

For node `i` at step `t`, the educational state is updated approximately as:

```text
x_i(t+1) = clamp[
  a x_i(t)
  + (1-a) x_i,baseline
  + b Σ_j (sign_ji · w_ji · Δx_j(t-delay))
  + c · perturbation_i(t)
]
```

The current constants are chosen only to make propagation stable and interpretable in-browser. They are **not fitted physiological parameters**.

Uncertainty is propagated as a display band from:

- node baseline uncertainty,
- magnitude of incoming causal drive,
- magnitude of direct perturbation.

This is deliberately transparent. Future validated ODE/PDE, agent-based, PBPK, electrophysiologic or ML surrogates can replace a scenario’s simple update function while keeping the provenance/UI contract.

## Scientific credibility contract

The module follows the spirit of the 2026 CURE principles for computational biological models:

- **Credible:** expose validation status and uncertainty;
- **Understandable:** every edge has a mechanism label;
- **Reproducible:** scenarios and coefficients are version-controlled;
- **Extensible:** validated solvers can replace schematic edges.

It also follows current digital-twin literature emphasizing multi-scale modeling, uncertainty quantification and prospective validation before clinical translation.

## Safety boundary

The lab is not a treatment recommender, dose calculator, diagnostic predictor or wet-lab protocol generator.

No virtual perturbation value represents a human dose or concentration. A “reduced pathway drive” is a computational state change only.

Patient-specific outputs must remain locked until the application has:

1. traceable patient-derived source objects,
2. a validated disease/model implementation,
3. calibration metadata,
4. uncertainty quantification,
5. audit/provenance records.

## Literature anchors

- Gopukumar ST, et al. Multiscale predictive cellular modeling: integrating hypothesis grammars, digital twins, and multi-omics for in silico oncology and precision theranostics. *Funct Integr Genomics*. 2026. PMID 42213163. https://pubmed.ncbi.nlm.nih.gov/42213163/
- Sauro HM, et al. From FAIR to CURE: guidelines for computational models of biological systems. *NPJ Syst Biol Appl*. 2026. PMID 41888157. https://pubmed.ncbi.nlm.nih.gov/41888157/
- Tomek J, et al. T-World Virtual Human Cardiomyocyte. II. Organ-Scale Simulations and Applications. *Circ Res*. 2026. PMID 41948815. https://pubmed.ncbi.nlm.nih.gov/41948815/
- Berg LA, et al. Toward cardiac electrophysiology digital twins with an efficient open source scalable solver on GPU clusters. *Sci Rep*. 2026. PMID 41708641. https://pubmed.ncbi.nlm.nih.gov/41708641/
- Wang Z, et al. Corticostriatal glutamate mechanisms underlying beta synchrony and motor deficits via striatal NMDA receptors in Parkinson's disease. *EBioMedicine*. 2026. PMID 42580034. https://pubmed.ncbi.nlm.nih.gov/42580034/

## Astra / Codex refinement contract

A future visual/coding agent may improve rendering, but must preserve:

- explicit model uncertainty,
- the falsifiability panel,
- separation of reference simulation from patient-derived data,
- prohibition on presenting normalized state values as doses or clinical measurements,
- citations/provenance,
- modular scenario definitions.

High-value next steps are to replace individual schematic scenarios with validated open mechanistic models, add model cards and calibration tests, and support versioned scenario bundles loaded from the Panacea biomedical knowledge graph.
