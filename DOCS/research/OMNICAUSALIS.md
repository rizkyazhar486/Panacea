# Omnicausalis: first bounded research slice

Task: RND-OMNI-01 (owner-requested research demonstration). This is not a clinical acceptance promotion.

Route: `/#/frontier-health?workspace=omnicausalis`, reachable from the existing Discovery workbench inside the application session. The original Discovery and Body Exposure routes remain available. No new top-level category or patient state store is introduced. Browser QA seeds a clearly synthetic, non-clinician UI session to enter the existing shell and blocks backend requests; this proves research interaction, not backend authentication or clinical authorization.

## Implemented contract

- `src/domains/scientific-research/model/scientificGraph.ts`: typed reference nodes/edges with conditions, source IDs, unknowns, version and `doesNotImply`. This is a curated mechanism map, not a causal identification algorithm. Runtime validation checks structural constraints and preserves declared translation gaps; it cannot certify that prose is scientifically correct.
- `numerics.ts`: bounded vector RK4 and a separate seeded **diagonal** Euler–Maruyama capability. Finite-value, dimension, seed and step-budget guards fail closed. These algorithms do not supply a biological model or calibration.
- `ischemiaCascade.ts`: deterministic toy relay with explicit parameters, phase boundaries and model version; rejects additional fields, including patient identity. No API, storage, observations, consent records, clinical orders or signatures are read or written.
- UI: evidence inspection, component search, unknown-link disclosure, parameter changes, baseline comparison, manual time inspection, optional replay, sensitivity range and JSON replay artifact. Mobile uses the accessible component list rather than a miniature network. Body Exposure is linked; no anatomical geometry is copied or generated.

## Numerical assumptions

E, S and R are dimensionless **toy reserve, stress and response indices**, not ATP, ROS, cytokines, viability, organ function or patient measurements.

```text
E' = 0.35 u (1-E) - 0.20 (1-u) E
S' = 0.30 (1-E) (1-S) - 0.20 u S
R' = g S (1-R) - 0.15 R
```

Initial state `(1,0,0)`; step `0.1`; horizon `24 model-time`. `u=1` before 4, selected delivery at 4, optionally restored to 1 at 12. Phases are integrated separately across discontinuities. User delivery and response gain are finite numbers in `[0,1]`. Rates are **illustrative design choices**, with unit `1/model-time`, not physiological constants derived from the articles. No physical time conversion is known. Gain sensitivity is an imposed ±20% range bounded to `[0,1]`, not a confidence interval or biological uncertainty estimate. The 0.5 stress crossing is synthetic. No probability of a clinical event is estimated.

The toy demonstrates numerical coupling and recovery only. It does **not** quantitatively implement succinate metabolism, electron transport, reperfusion ROS bursts, NLRP3 activation, compensation, tissue heterogeneity or organ function. Biological quantities remain unavailable. The stochastic solver is tested separately; no biological diffusion law or stochastic clinical prediction is connected.

## Primary mechanism references and counterexamples

1. [Chouchani et al., Nature (2014), DOI 10.1038/nature13909; PMID 25383517](https://pubmed.ncbi.nlm.nih.gov/25383517/): experimental ischemic succinate accumulation and reperfusion-associated reverse-electron-transport ROS. Supports a conditional mechanism, not the toy rate constants.
2. [Gong et al., J Neuroinflammation (2018), DOI 10.1186/s12974-018-1282-6; PMID 30153825](https://pubmed.ncbi.nlm.nih.gov/30153825/): rat cerebral ischemia/reperfusion and cell co-culture; mitochondrial dysfunction and NLRP3 activation vary by cell type and phase. Not a human inflammatory response calibration.
3. [Lottes et al., AJP Lung (2014), DOI 10.1152/ajplung.00298.2013; PMID 24682450](https://pubmed.ncbi.nlm.nih.gov/24682450/): murine alveolar cells can preserve ATP under hypoxia despite reduced mitochondrial function. Hypoxia is not identical to flow-restricted ischemia; reduced oxygen does not prove total ATP depletion.
4. [Kim et al., BMC Physiology (2007), DOI 10.1186/1472-6793-7-5; PMID 17592640](https://pubmed.ncbi.nlm.nih.gov/17592640/): TLR4-deficient mice had smaller infarcts without preserved cardiac function. This is counterevidence to an automatic injury-to-function mapping, not validation of a joined NLRP3–TLR4 pathway.

Only bibliographic metadata, links and original summaries are included. No figures, anatomical assets or external datasets are imported. Publication accessibility is not blanket permission to reuse its assets. Reactome, PubMed search APIs, PDB, quantum chemistry, calibration and clinical observation adapters are **not connected**.

## Verification and boundaries

Focused command: `node --test scripts/qa/omnicausalis.test.mjs`. It checks analytic decay, fourth-order convergence, a coupled oscillator, seeded stochastic reproducibility/variance, parameter extremes, invalid inputs, graph provenance structure, translation gaps and safe crossing interpolation. Browser command: `node qa/research/omnicausalis.mjs` against the actual production preview, with `PLAYWRIGHT_MODULE` configured if needed. CI evidence belongs to the exact PR revision; local tests are not clinical validation.

Scientific maturity: interactive conceptual illustration plus numerically tested toy equations; **not calibrated, externally validated, patient-specific or clinically reviewed**. `clinically_reviewed=false` is retained in the run artifact. Future evidence may replace the toy with a model through the same interface, but must not relabel its outputs as measured truth.

## Gemini / Argon coordination

This slice owns `src/domains/scientific-research/**`, its focused QA/browser gate, and the small Discovery integration. It leaves Gemini's dirty `BodyExposureOS.tsx` / `BodyQuantumTelemetryEngine.ts` work untouched. Gemini can consume the exported graph and versioned toy runs for a later projection, preserving truth classes and unknowns. Biological rates, geometry, quantum results and patient values must not be manufactured to fill vertical gaps. Independent Argon scientific challenge is requested separately; an internal AI code review is not external clinical validation.

Next justified slice: replace one unknown link only after obtaining a reusable, source-licensed model with units, identifiable parameters, reference outputs and independent validation. No claim that the multiscale research program is complete.
