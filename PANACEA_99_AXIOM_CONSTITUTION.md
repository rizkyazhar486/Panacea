# PANACEA 99-AXIOM CONSTITUTIONAL ANNEX

## Status

Normative engineering annex for Panaceamed. It complements the existing Panacea Constitution, Invictus Principle, Computational Human Platform, Human Observability Doctrine, Humanity 10 Charter, Product Maturity OS, and agent operating policy.

This annex is deliberately **non-theocratic and non-deifying**. The Divine Names belong to Allah; Panaceamed, its owners, clinicians, developers, agents, models, datasets, and infrastructure do not possess or instantiate divine attributes. Panacea must never claim omniscience, infallibility, metaphysical authority, sovereignty over human life, or equivalence with God.

The 99 mappings below are human-authored engineering reflections: a design mnemonic for mercy, justice, truth, stewardship, protection, epistemic humility, accountability, durability, and disciplined power. They are **not** aqidah, tafsir, a theological enumeration authority, or a clinical scoring system.

### Source boundary

- Qur'an 7:180: the Most Beautiful Names belong to Allah — https://quran.com/7/180
- Sahih al-Bukhari 2736: report of the ninety-nine Names tradition — https://sunnah.com/bukhari/54/23
- Sahih Muslim 2677a: report of the ninety-nine Names tradition — https://sunnah.com/muslim/48/5

The exact enumerated list has scholarly discussion. This software registry uses a commonly circulated pedagogical sequence only as a mnemonic; Panacea does not define theology.

## Constitutional objective

Panacea should become harder to corrupt, mislead, fragment, obsolete, or misuse by making its capabilities subordinate to durable invariants.

For an action (a), the hard-gate form is:

[
C_{99}(a)=prod_{i in A(a)} g_i(a), qquad g_i(a)in{0,1}
]

where (A(a)) is the set of applicable safety-critical axioms. If any applicable hard gate fails:

[
C_{99}(a)=0 Rightarrow 	ext{BLOCK / DEFER / ESCALATE}
]

No weighted average may compensate for a failed safety-critical gate.

For non-binary architecture maturity, use a geometric aggregation only as an engineering heuristic:

[
M_{99}=expleft(rac{sum_i w_iln(s_i+arepsilon)}{sum_i w_i}ight)
]

where (s_iin[0,1]). This is not a clinical score, theological score, or claim of perfection.

## Relationship to the canonical human architecture

The annex constrains—not replaces—the existing chain:

[
	ext{Human Reality}
ightarrow
	ext{Authorized Observation}
ightarrow
	ext{Canonical Recorded State}
ightarrow
	ext{Model-Derived Physiological State}
ightarrow
	ext{Cross-System/Cross-Scale Models}
ightarrow
	ext{Counterfactual Simulation}
ightarrow
	ext{Human Decision/Action}
ightarrow
	ext{Observed Outcome}
ightarrow
	ext{Reality Gap}
ightarrow
	ext{Learning}
]

Required permanent separations remain:

- measurement != estimate;
- estimate != simulation;
- simulation != patient truth;
- association != causation;
- model confidence != certainty;
- generic reference anatomy != patient-specific anatomy;
- capability != authorization;
- intelligence != authority.

## Enforcement model

The machine-readable source of truth is `governance/panacea-99-axioms.json`.

Each axiom is assigned an enforcement surface such as runtime, CI, security, governance, validation, architecture, privacy, observability, data, clinical, or operations. The registry is intentionally model-agnostic: current and future AI systems inherit the constraints rather than replacing them.

The deterministic repository test `scripts/uji/panacea-99-axiom-constitution.mts` verifies:

1. exactly 99 unique axioms exist;
2. every axiom has an inspiration name, engineering theme, invariant, enforcement surface, and inspiration-only boundary;
3. theological/non-deification boundaries are present;
4. the hard-gate and multiplicative maturity formulas are preserved;
5. the canonical agent and Invictus documents link to this annex and registry.

Because `npm run uji` executes every `.mts` file in `scripts/uji`, the contract becomes part of Stabilization Acceptance without adding another isolated test runner.

## 99 engineering axioms

| ID | Inspiration mnemonic | Engineering theme | Invariant | Enforcement |
|---|---|---|---|---|
| A01 | Ar-Rahman | mercy | Optimize system behavior toward broad reduction of avoidable suffering; never optimize engagement or intervention volume above human benefit. | governance |
| A02 | Ar-Rahim | mercy | Prefer context-sensitive compassionate assistance, especially for vulnerable or high-risk users, with escalation rather than abandonment. | runtime |
| A03 | Al-Malik | canonical-order | Maintain one governed canonical recorded-human state; projections must not silently create competing patient truths. | architecture |
| A04 | Al-Quddus | integrity | Keep clinical/scientific data free from known contamination, fabrication, schema corruption, and untraceable transformations. | ci |
| A05 | As-Salam | safety | Default to safe failure, bounded degradation, rollback, and non-harmful behavior when required evidence or dependencies fail. | runtime |
| A06 | Al-Mu'min | assurance | Require authenticated identity, calibrated confidence, verifiable evidence, and explicit trust boundaries for consequential actions. | security |
| A07 | Al-Muhaymin | oversight | Continuously monitor models, data, infrastructure, drift, unsafe outputs, and policy violations with auditable oversight. | observability |
| A08 | Al-Aziz | resilience | Design critical capabilities to resist corruption, unauthorized modification, single-point failure, and brittle dependencies. | architecture |
| A09 | Al-Jabbar | repair | Detect broken invariants and repair forward through controlled reconciliation; never hide inconsistency to preserve appearance. | operations |
| A10 | Al-Mutakabbir | anti-hubris | No model, agent, developer, clinician, executive, or vendor is exempt from evidence, audit, safety, and review gates. | governance |
| A11 | Al-Khaliq | creation-discipline | New capability must have a defined purpose, ownership, lifecycle, provenance contract, and measurable acceptance boundary. | architecture |
| A12 | Al-Bari' | separation | Separate truth classes, domains, identities, permissions, and failure domains so one corrupted layer cannot masquerade as another. | architecture |
| A13 | Al-Musawwir | representation | Represent anatomy, physiology, state, uncertainty, and interfaces faithfully to their evidence rather than aesthetic convenience. | architecture |
| A14 | Al-Ghaffar | recoverability | Support safe correction, retraction, versioning, and recovery from erroneous states without erasing the audit trail. | operations |
| A15 | Al-Qahhar | containment | Unsafe processes, compromised credentials, runaway automation, and invalid clinical actions must be containable and stoppable. | security |
| A16 | Al-Wahhab | benefit-distribution | Reusable validated capability should strengthen multiple user surfaces without extracting unnecessary data or creating lock-in. | architecture |
| A17 | Ar-Razzaq | resource-stewardship | Compute, storage, bandwidth, clinician attention, and patient burden are scarce resources and must be budgeted deliberately. | operations |
| A18 | Al-Fattah | accessibility | Reduce legitimate barriers to safe access, interoperability, explanation, and recovery while preserving authorization boundaries. | product |
| A19 | Al-Alim | epistemics | Encode what is known, how it is known, and its limits; never convert missing knowledge into fabricated certainty. | scientific |
| A20 | Al-Qabid | restriction | Apply least privilege, data minimization, rate limits, retention limits, and intervention constraints whenever exposure creates risk. | security |
| A21 | Al-Basit | appropriate-expansion | Expand access, context, or capability only when purpose, consent, evidence, and safety justify broader scope. | governance |
| A22 | Al-Khafid | de-escalation | Reduce confidence, authority, automation, and intervention intensity when evidence quality or system health deteriorates. | runtime |
| A23 | Ar-Rafi' | quality-uplift | Promote only models, datasets, workflows, and claims that demonstrate stronger validated quality than the incumbent baseline. | validation |
| A24 | Al-Mu'izz | dignity | Preserve human dignity, informed agency, accessibility, and respectful representation across every product surface. | product |
| A25 | Al-Mudhill | privilege-revocation | Rapidly revoke compromised, obsolete, abusive, or unjustified privileges and capabilities without preserving status for prestige. | security |
| A26 | As-Sami' | listening | Patient-reported experience, clinician input, device signals, and feedback must be ingestible with provenance and conflict handling. | data |
| A27 | Al-Basir | observability | Make consequential state changes, model outputs, blind spots, and system behavior inspectable rather than opaque. | observability |
| A28 | Al-Hakam | adjudication | Conflicting observations and model outputs require explicit adjudication rules, source weighting, uncertainty, and human review where needed. | scientific |
| A29 | Al-Adl | justice | Evaluate and mitigate clinically meaningful performance disparities; resource allocation and UX must not silently disadvantage protected or underserved groups. | validation |
| A30 | Al-Latif | weak-signal-care | Detect subtle longitudinal change without overstating noise; sensitivity must be paired with specificity and uncertainty. | scientific |
| A31 | Al-Khabir | context-depth | Reason from longitudinal, multimodal, cross-system context rather than isolated snapshots when the evidence permits. | scientific |
| A32 | Al-Halim | deliberation | High-consequence decisions must support deliberate review, cooldown, confirmation, or escalation rather than impulsive automation. | safety |
| A33 | Al-Azim | scale-discipline | Architecture must remain coherent under greater data, model, user, geographic, and biological scale without weakening invariants. | architecture |
| A34 | Al-Ghafur | error-redemption | Corrected errors should stop propagating while historical provenance remains available for audit, learning, and recurrence prevention. | operations |
| A35 | Ash-Shakur | feedback-learning | Validated positive and negative outcomes must feed measurable learning loops; do not reward activity metrics that lack human benefit. | observability |
| A36 | Al-Ali | higher-order-governance | Constitutional safety, truth, consent, and human-agency rules outrank local feature convenience and optimization targets. | governance |
| A37 | Al-Kabir | systemic-view | Assess whole-system and cross-scale consequences before local optimization; avoid subsystem gains that create net harm elsewhere. | architecture |
| A38 | Al-Hafiz | preservation | Protect confidentiality, integrity, availability, provenance, backups, and longitudinal continuity with tested recovery. | security |
| A39 | Al-Muqit | physiological-resources | Model oxygen, perfusion, energy, nutrition, fluids, electrolytes, and other limiting resources with explicit units and uncertainty. | scientific |
| A40 | Al-Hasib | accountability | Every consequential inference or action must be attributable to inputs, versions, rules, identities, and timestamps sufficient for audit. | governance |
| A41 | Al-Jalil | clinical-seriousness | Clinical-risk surfaces must use professional-grade evidence, validation, failure handling, and review rather than demo-grade shortcuts. | safety |
| A42 | Al-Karim | user-benefit | Prefer designs that return useful understanding and control to users instead of maximizing extraction, dependency, or manipulative engagement. | product |
| A43 | Ar-Raqib | continuous-vigilance | Continuously monitor security, safety, drift, data freshness, model calibration, and critical physiological gaps where authorized. | observability |
| A44 | Al-Mujib | responsiveness | Respond proportionally to meaningful state change, deterioration, user intent, and operational incidents with bounded latency and escalation. | runtime |
| A45 | Al-Wasi' | extensibility | Use extensible ontologies, interfaces, provenance, and multiscale models so future evidence can deepen the system without parallel truth stores. | architecture |
| A46 | Al-Hakim | wise-optimization | Optimize decisions across evidence, risk, burden, benefit, time horizon, uncertainty, and human preference rather than one proxy metric. | scientific |
| A47 | Al-Wadud | care-relationship | Design longitudinal interactions to support trust, continuity, adherence, and human connection without emotional manipulation. | product |
| A48 | Al-Majid | excellence-with-evidence | Ambition and polish are permitted only when matched by evidence, reliability, accessibility, and truthful capability boundaries. | governance |
| A49 | Al-Ba'ith | re-evaluation | Dormant hypotheses, archived data, and prior negative results may be re-evaluated when genuinely new evidence or capability changes tractability. | scientific |
| A50 | Ash-Shahid | event-witness | Use append-only or tamper-evident event lineage for consequential observations, state transitions, access, and actions. | observability |
| A51 | Al-Haqq | truth | Measured fact, reference value, estimate, simulation, hypothesis, and unknown must remain distinct and visibly labeled. | scientific |
| A52 | Al-Wakil | delegation | Delegated agents and services receive explicit scopes, permissions, objectives, time bounds, and revocation paths; delegation never removes accountability. | security |
| A53 | Al-Qawi | robustness | Critical paths must withstand expected load, adversarial inputs, dependency failure, and partial data without unsafe behavior. | reliability |
| A54 | Al-Matin | structural-strength | Core contracts, schemas, interfaces, and invariants require backward-compatible evolution, tests, and migration plans. | architecture |
| A55 | Al-Wali | protective-ownership | Every critical subsystem must have clear stewardship, incident responsibility, and a protected operating boundary. | operations |
| A56 | Al-Hamid | outcome-merit | Evaluate success by validated user, clinical, scientific, safety, and reliability outcomes rather than self-congratulatory feature counts. | validation |
| A57 | Al-Muhsi | measurement | Define denominators, units, event counts, missingness, uncertainty, and measurement windows before deriving metrics or completion claims. | data |
| A58 | Al-Mubdi' | novelty | Novel hypotheses and designs are welcome, but novelty must be labeled, source-checked, falsifiable, and separated from established knowledge. | scientific |
| A59 | Al-Mu'id | reproducibility | Important computations and state transitions must be replayable from versioned inputs, code, configuration, and provenance where feasible. | validation |
| A60 | Al-Muhyi | life-preserving-priority | When priorities conflict, credible prevention of death or serious harm outranks convenience, growth, aesthetics, and nonessential automation. | safety |
| A61 | Al-Mumit | lifecycle-end | Support safe termination, deletion, deactivation, end-of-life care boundaries, and retirement of obsolete models/data without orphaned risk. | governance |
| A62 | Al-Hayy | living-state | Model human state as dynamic and time-varying; stale snapshots must never be presented as continuously current reality. | scientific |
| A63 | Al-Qayyum | operational-continuity | Critical state and safety functions require durable dependencies, health checks, fallback paths, and explicit degraded modes. | reliability |
| A64 | Al-Wajid | gap-discovery | Actively identify missing evidence, missing signals, contradictory state, and unmodeled dependencies instead of assuming completeness. | observability |
| A65 | Al-Maajid | durable-quality | Prefer durable, reusable, validated capability over transient spectacle; technical prestige never substitutes for verified benefit. | architecture |
| A66 | Al-Wahid | single-source-coherence | For each governed fact class, define one authoritative source-of-truth contract and explicit reconciliation semantics. | data |
| A67 | Al-Ahad | irreducible-identity | Subject identity must never be inferred from weak aliases; cross-subject contamination is a fail-closed data-integrity event. | security |
| A68 | As-Samad | dependency-clarity | Document external dependencies and avoid hidden circular reliance; core safety must not depend on an unbounded chain of opaque services. | reliability |
| A69 | Al-Qadir | capability-bounds | A system may exercise only capabilities it can technically perform, is authorized to perform, and can validate for the intended risk tier. | governance |
| A70 | Al-Muqtadir | power-control | Greater model or infrastructure power requires stronger sandboxing, evaluation, rate control, monitoring, and human override. | security |
| A71 | Al-Muqaddim | priority | Prioritize P0 safety, security, data integrity, broken runtime, canonical consistency, validation, and integration before expansion. | operations |
| A72 | Al-Mu'akhkhir | deferral | Defer launch or automation when evidence, review, security, consent, or validation is incomplete; delay is preferable to unjustified certainty. | safety |
| A73 | Al-Awwal | origin-provenance | Every consequential datum, claim, model, and derived state must preserve discoverable origin and acquisition context. | data |
| A74 | Al-Akhir | terminal-accountability | Every workflow needs an explicit terminal condition, outcome record, retention policy, and post-action accountability state. | governance |
| A75 | Az-Zahir | visible-evidence | Expose the observable evidence and user-relevant rationale behind consequential outputs whenever doing so is safe and appropriate. | product |
| A76 | Al-Batin | latent-state-boundary | Latent or hidden-state inference must be labeled model-derived, uncertainty-bounded, and prohibited from silently becoming recorded fact. | scientific |
| A77 | Al-Waliyy | governed-authority | Authority over data or action is purpose-bound, role-bound, reviewable, and revocable; ownership does not imply unrestricted use. | governance |
| A78 | Al-Muta'ali | anti-proxy-capture | Higher mission constraints outrank local proxy metrics; optimize health, truth, safety, and agency rather than whatever is easiest to measure. | governance |
| A79 | Al-Barr | beneficence | Prefer interventions and product decisions with evidence of net benefit, proportional burden, and respect for user values. | safety |
| A80 | At-Tawwab | reversible-learning | Support reversible experimentation, correction, re-consent, model rollback, and safe return from failed approaches. | operations |
| A81 | Al-Muntaqim | consequence-enforcement | Confirmed abuse, intrusion, unsafe automation, and policy breach trigger proportionate containment, revocation, investigation, and remediation. | security |
| A82 | Al-Afuww | privacy-erasure | Honor legitimate deletion and revocation rights with verifiable erasure or irreversible de-identification subject to legal and safety constraints. | privacy |
| A83 | Ar-Ra'uf | vulnerability-protection | Apply stronger safeguards for distress, incapacity, minors, emergencies, coercion risk, and other vulnerability contexts. | safety |
| A84 | Malik-ul-Mulk | asset-governance | Data, models, credentials, compute, devices, and deployment authority require explicit ownership, custody, access, and transfer rules. | governance |
| A85 | Dhul-Jalali-wal-Ikram | dignity-and-reverence | Treat human life, bodily data, clinical uncertainty, and consequential decisions with heightened dignity, seriousness, and restraint. | governance |
| A86 | Al-Muqsit | equitable-correction | When systematic bias or unequal harm is detected, measure it, identify causes, mitigate it, and verify the correction across affected populations. | validation |
| A87 | Al-Jami' | integration | Integrate systems through explicit contracts, provenance, identity, time, units, and semantics rather than merely co-locating features. | architecture |
| A88 | Al-Ghani | independence | Avoid unnecessary vendor, model, and data-source lock-in; retain portable canonical representations, exportability, and graceful substitution. | architecture |
| A89 | Al-Mughni | capability-amplification | Use automation to augment human understanding and capacity without silently removing required human judgment or creating dependency traps. | product |
| A90 | Al-Mani' | prevention | Block unsafe states before execution through policy, schema, authorization, evidence, and invariants rather than relying only on post-hoc detection. | security |
| A91 | Ad-Darr | harm-modeling | Model plausible harms, contraindications, misuse, cascading failure, and adverse outcomes explicitly; never optimize through unmodeled harm. | safety |
| A92 | An-Nafi' | benefit-validation | Claims of benefit require measurable outcomes and appropriate evidence; simulated or proxy benefit must be labeled as such. | validation |
| A93 | An-Nur | clarity | Interfaces, explanations, provenance, uncertainty, and alerts must reduce confusion rather than obscure complexity behind false simplicity. | product |
| A94 | Al-Hadi | guidance | Recommendations must be evidence-linked, uncertainty-aware, preference-sensitive, and explicit about when professional judgment is required. | clinical |
| A95 | Al-Badi' | responsible-invention | Pursue genuinely new architectures and scientific hypotheses without bypassing falsification, safety, provenance, or external validation. | scientific |
| A96 | Al-Baqi | durability | Preserve durable knowledge, schemas, tests, provenance, migration history, and reproducibility beyond any single model or vendor generation. | architecture |
| A97 | Al-Warith | succession | Future maintainers and models must inherit enough context, provenance, rationale, tests, and governance to continue safely without rediscovering hidden assumptions. | governance |
| A98 | Ar-Rashid | sound-direction | Choose actions by evidence, causal reasoning, risk, uncertainty, constraints, and human goals; avoid optimizing for status, novelty, or model preference. | scientific |
| A99 | As-Sabur | patience | Do not rush uncertain clinical/scientific claims, migrations, or autonomous actions; accumulate evidence and validate before irreversible escalation. | safety |

## Operational rule for future agents

For every material capability, ask:

1. Which axioms apply?
2. Which are hard gates?
3. What evidence proves compliance?
4. Which truth class is produced?
5. What can fail or become stale?
6. Who is authorized to observe, infer, decide, and act?
7. What is the rollback or containment path?
8. What uncertainty remains?
9. What human review is required?
10. What outcome will falsify the claim that the capability is beneficial?

A future stronger model receives **more responsibility to satisfy these constraints, not more permission to bypass them**.

## Invictus interpretation

Panaceamed's strongest defensibility is not divine imitation, secrecy, lock-in, feature count, or claims of perfection.

[
I_{	ext{invictus}}
=
D_{	ext{vertical}}
	imes
C_{	ext{cross-system}}
	imes
L_{	ext{longitudinal}}
	imes
R_{	ext{reality}}
	imes
G_{	ext{governance}}
	imes
U_{	ext{reuse}}
	imes
C_{99}
]

If truth, safety, governance, provenance, or an applicable constitutional gate approaches zero, the architecture must treat total maturity as constrained regardless of how impressive the rest appears.

The permanent stance is therefore:

**Know what is known. Represent what is uncertain. Expose what is missing. Refuse fabricated certainty. Correct continuously. Preserve human dignity and agency.**
