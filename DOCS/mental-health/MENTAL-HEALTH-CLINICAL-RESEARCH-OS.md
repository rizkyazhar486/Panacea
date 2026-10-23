# Panacea Mental Health Clinical Research OS

## Purpose

Mental-health prevention and treatment research must live inside the **Clinical** architecture as a mechanistic, longitudinal research system — not as a chatbot-only experience and not as a decorative wellness widget.

The intended loop is:

```text
longitudinal phenotype
-> behavioral / social / circadian exposures
-> compound mechanism
-> PK/PD teaching model
-> synapse / signaling / network context
-> observed clinical outcome
-> clinician review
-> model update
```

The implementation must preserve the repository's existing mental-health safety orchestrator. Molecular sophistication never bypasses suicide/self-harm escalation, clinician review, prescribing rules, emergency policy or evidence boundaries.

## Research domains

### Depression

Represent multiple mechanistic families rather than reducing depression to "low serotonin":

- monoaminergic transport/receptor biology;
- glutamatergic/NMDA mechanisms;
- GABA-A neurosteroid mechanisms;
- BDNF/plasticity-associated signaling;
- HPA-axis context;
- inflammation/mitochondrial biomarker research;
- distributed network adaptation.

Current first-party mechanism examples include dextromethorphan-bupropion, esketamine and zuranolone. Regulatory scope must remain explicit; e.g. zuranolone's U.S. approval for postpartum depression must never be silently generalized to ordinary MDD.

### Anxiety

Represent:

- serotonergic 5-HT1A mechanisms;
- GABAergic inhibition;
- HPA-axis / stress physiology;
- autonomic/interoceptive state;
- fear learning/extinction;
- pharmacogenomic/epigenetic research only when evidence justifies it.

Buspirone provides a useful established serotonergic mechanism example without implying immediate sedative action.

### Loneliness

Loneliness must not be represented as a single-compound deficiency.

The oxytocin/social-salience model is useful as a **research hypothesis**, not a validated treatment rule. Social attention, rejection vigilance, prior learning and real-world reconnection behavior may alter direction of effect.

There is no established medication that simply "treats loneliness." Panacea should therefore model compound hypotheses alongside psychosocial intervention evidence rather than manufacturing a pharmacological solution.

## Generic compound simulation

Panacea may expose a generic PK teaching sandbox when the user supplies the parameters.

### First-order elimination

[
\frac{C(t)}{C_0}=2^{-t/t_{1/2}}
]

Equivalent form:

[
C(t)=C_0e^{-k_et},\qquad
k_e=\frac{\ln 2}{t_{1/2}}
]

This is **not** a selected-drug default and must not imply absorption, active metabolites, nonlinear kinetics, free brain concentration, protein binding or individual clearance.

### Simple receptor occupancy

For a 1:1 equilibrium teaching model:

[
\theta=\frac{[L]}{K_d+[L]}
]

The UI must state that real target engagement requires validated free-site concentration, target-specific affinity and an appropriate kinetic model. It must never translate this directly into a clinical response probability.

## Longitudinal daily foundation

Reset-style daily tasks are valuable as **repeated exposures**, not moral streaks.

Canonical domains:

1. movement / training;
2. meaningful social contact;
3. circadian and sleep routine;
4. nutrition foundation;
5. individualized hydration;
6. purpose / reading / learning;
7. deliberate recovery;
8. user-defined compulsion boundary.

Adherence is descriptive only:

[
A=
\frac{\text{completed observed actions}}
{\text{all observed actions}}
]

Missing observations are excluded rather than treated as failure.

No fixed 2 L water rule is universal. A 2 L target may be user-chosen, but fluid needs depend on body size, climate, activity, losses and clinical constraints.

"No masturbation" is **not** a universal Panacea mental-health rule. Pornography/masturbation or another behavior may be tracked when the user chooses it as a goal or when loss of control, distress or functional impairment is relevant. The system must not claim universal antidepressant, anxiolytic, testosterone or longevity benefits from abstinence.

## Longitudinal requirement

A session is not the unit of truth. The longitudinal record is.

For behavior/intervention history:

[
\mathcal H_t=\{E_1,E_2,\ldots,E_t\}
]

and the future-state research model should conceptually depend on prior state and history:

[
H_{t+1}
=
F(H_t,E_t,\mathcal H_t,Recovery_t,Environment_t,Behavior_t)
]

The repository must continue to distinguish:

- **observed** measurements;
- **derived** arithmetic;
- **estimated latent** states;
- **simulated** states;
- **population/reference** evidence;
- **unknown** state.

No simulated neurotransmitter, receptor occupancy, cytokine or network state may be rendered as a patient measurement.

## Safety boundaries

The Clinical research surface MUST NOT:

- autonomously prescribe or select psychiatric medication;
- provide patient-specific dosing from the teaching simulator;
- turn a mechanism graph into a probability of remission;
- present oxytocin as an established loneliness treatment;
- infer suicidal intent from wearables, mood language or engagement behavior alone;
- downgrade explicit self-harm escalation;
- replace clinician assessment.

Existing `mentalHealthSafety.ts` remains the orchestration authority for explicit high-risk signals.

## Evidence anchors

1. DeBattista C, Schatzberg AF. *The Black Book of Psychotropic Dosing and Monitoring.* Psychopharmacol Bull. 2024. PMID: **38993656**. doi:10.64719/pb.4493.
2. Johnston JN, Zarate CA, Kvarta MD. *Esketamine in depression: putative biomarkers from clinical research.* Eur Arch Psychiatry Clin Neurosci. 2025. PMID: **38997425**. doi:10.1007/s00406-024-01865-1.
3. Riebel M, et al. *Neurosteroids and translocator protein 18 kDa (TSPO) ligands as novel treatment options in depression.* Eur Arch Psychiatry Clin Neurosci. 2025. PMID: **38976049**. doi:10.1007/s00406-024-01843-7.
4. Merkouris E, et al. *Molecular Basis of Anxiety: A Comprehensive Review of 2014-2024 Clinical and Preclinical Studies.* Int J Mol Sci. 2025. PMID: **40508224**. doi:10.3390/ijms26115417.
5. Chessick CA, et al. *Azapirones for generalized anxiety disorder.* Cochrane Database Syst Rev. 2006. PMID: **16856115**. doi:10.1002/14651858.CD006115.
6. Shamai-Leshem D, Radai T, Shamay-Tsoory S. *The oxytocin-attention loop of loneliness.* Neurosci Biobehav Rev. 2025. PMID: **41067329**. doi:10.1016/j.neubiorev.2025.106395.
7. Lasgaard M, et al. *Are loneliness interventions effective for reducing loneliness? A meta-analytic review of 280 studies.* Am Psychol. 2026. PMID: **41129341**. doi:10.1037/amp0001578.

## Product rule

**Mental-health innovation = molecular pharmacology + behavioral medicine + social biology + longitudinal prediction + human clinical governance.**

The UI should expose mechanistic depth, uncertainty and evidence. It should never make unsupported certainty look futuristic.
