# Panacea Knowledge Bridge Engine — Agent Handoff

Do not restart the concept from scratch. Extend the committed scaffold:

- `src/lib/knowledgeBridge.ts`
- `src/pages/KnowledgeBridge.tsx`
- `server/uji/knowledgeBridge.uji.ts`
- existing `src/pages/Translator.tsx`
- existing `src/pages/SecondOpinion.tsx`
- existing visit-prep/care-episode/EMR/FHIR/radiology/drug modules

## Mission

Reduce the gap between what clinicians know and what ordinary people can understand, while also reducing the time clinicians spend translating, reorganizing and repeating the same information.

Panacea should become a bidirectional bridge:

`patient language → structured clinical meaning → evidence/source → decision → patient explanation → teach-back → follow-up`

The bridge must preserve the original source and uncertainty at every step.

## Eight modules already defined

1. Doctor ↔ Patient Translator
2. Teach-Back Loop
3. Evidence Ladder
4. Shared Decision Matrix
5. Visit Copilot
6. Consent Simulator
7. Care + Cost Pathway
8. Second-Opinion Packet

Do not duplicate these as disconnected mini-apps. They are views over the same care episode.

---

# 1. Doctor ↔ Patient Translator

### Inputs

- patient free text / voice transcript;
- clinician note;
- lab result;
- radiology/pathology report;
- medication list;
- procedure name;
- FHIR resources when available.

### Outputs

Always produce paired views:

- **Original source** — unchanged.
- **Clinical mirror** — concise professional language.
- **Plain-language explanation** — no hidden new facts.
- **Glossary** — term → explanation.
- **What we know / what we do not know**.
- **Questions worth asking next**.

Never let the simplified text replace the source document.

---

# 2. Teach-Back Loop

The product must not use a meaningless `Do you understand?` confirmation.

Use reconstructive prompts:

- What is the main problem?
- What is the next step and why?
- What change would make you seek help sooner?

Store comprehension gaps separately from clinical facts.

Future agent tasks:

- multilingual teach-back;
- voice mode;
- clinician review of misunderstood points;
- post-discharge re-check after a configurable interval;
- accessibility mode for low literacy and older adults.

---

# 3. Evidence Ladder

Every claim should be rendered with provenance such as:

- measured patient data;
- guideline recommendation;
- randomized/controlled trial evidence;
- observational evidence;
- expert consensus/opinion;
- uncertain / insufficient evidence.

Do not convert this into a fake universal evidence score.

Required metadata where available:

- source;
- version/publication date;
- population;
- outcome;
- time horizon;
- applicability caveat;
- conflicts/discordant evidence.

Measured patient data and population-level evidence must never be visually merged into one certainty bucket.

---

# 4. Shared Decision Matrix

Preserve transparent risk communication.

Existing engine in `knowledgeBridge.ts` calculates:

`ARR = CER - EER`

`RRR = ARR / CER`

`NNT = 1 / ARR` when ARR > 0

Natural frequency views:

`risk × 1000 = expected events per 1000`

Every risk comparison must keep the population and time horizon attached.

Next agent should add:

- benefit and harm on the same visual scale;
- patient preference weights;
- treatment burden (visits, monitoring, cost, route, frequency);
- reversible vs irreversible choices;
- option comparison export for clinician discussion.

Do not allow preference weights to change measured evidence values.

---

# 5. Visit Copilot

Build one pre-visit packet from existing Panacea data:

- reason for visit;
- symptom timeline;
- prior diagnoses;
- medication + adherence questions;
- allergies;
- relevant vitals/wearables;
- relevant labs/imaging;
- previous treatment attempts;
- patient goals;
- must-ask questions;
- red-flag escalation when appropriate.

The result must be readable in under one minute by a clinician.

After the visit, reuse the same object for:

- what changed;
- new tests;
- new treatment;
- follow-up date;
- safety-net instructions;
- unresolved questions.

---

# 6. Consent Simulator

Create a visual, replayable explanation of a procedure/intervention:

- why it is being considered;
- expected benefit;
- important material risks;
- alternatives;
- what may happen without intervention;
- recovery/monitoring burden;
- teach-back checkpoint.

Integrate with Body Explorer/Surgical Lab for procedures where geometry exists.

This is an educational/communication layer, not the legal act of consent itself.

---

# 7. Care + Cost Pathway

Visualize care as a graph instead of a list of appointments:

`home → primary care → lab → radiology → specialist → procedure → pharmacy → rehabilitation/home follow-up`

Each node should support:

- provider/facility role;
- prerequisite;
- expected waiting time;
- cost/range;
- coverage/eligibility hook;
- geographic availability;
- home-vs-facility alternative;
- reason the step exists;
- what can safely be skipped vs what cannot.

All prices/availability require source, geography and timestamp.

Later integrate real marketplace/provider data, but keep estimates visually distinct from quotations.

---

# 8. Second-Opinion Packet

Merge the already-existing Second Opinion concept with this engine.

One exportable package should include:

- problem list;
- timeline;
- original notes;
- labs;
- imaging and report links;
- pathology;
- genomics where relevant;
- medication history;
- procedures;
- response/adverse effects;
- patient preferences;
- unresolved diagnostic/therapeutic questions;
- source provenance.

Do not generate a clinician identity or pretend the packet itself is a medical second opinion.

---

# High-value integrations

## FHIR / EMR

Map source facts to existing FHIR exports instead of inventing another patient-data model.

## Radiology

Link a report sentence to the relevant structure in Body Explorer when reliable mapping exists. Keep the original report and scan provenance visible.

## Medication

Build medication explanations around:

- what it is for;
- how to use it;
- common vs serious adverse effects;
- monitoring;
- interactions;
- cost/availability alternatives;
- what to ask the prescriber/pharmacist.

Do not change a prescription or dose autonomously.

## Body Explorer

Use 3D anatomy as an explanation surface: clicking a clinical term can highlight the organ/structure where geometry exists.

## Marketplace

Connect the care pathway to doctor/lab/radiology/pharmacy availability and pricing when live data sources exist.

## Language + accessibility

Keep medical meaning stable across:

- Indonesian/English and future languages;
- low-literacy mode;
- clinician mode;
- older-adult large-text/audio mode;
- hearing/vision accessibility;
- culturally different symptom descriptions.

---

# Agent division

## Codex / ChatGPT coding agent

- connect `KnowledgeBridge` to the application router/navigation;
- reuse FHIR/EMR/Translator/SecondOpinion data structures;
- build source-provenance model;
- implement visit packet schema + export;
- add deterministic risk communication tests;
- connect to care episodes rather than duplicating patient state.

## Astra / visual agent

- make the bridge visually understandable at a glance;
- create side-by-side `clinical ↔ plain language` morphing views;
- build natural-frequency icon arrays and outcome timelines;
- make consent steps visual using existing anatomy/3D assets;
- animate care pathways without turning them into decorative infographics;
- prioritize mobile readability and accessibility.

## Ultracode / performance agent

- optimize large record rendering;
- virtualize long timelines and source lists;
- cache translation artifacts by source hash/version;
- add offline-safe packets where appropriate;
- audit bundle size and route lazy loading.

---

# Acceptance criteria

The feature is not complete until a user can take one real care episode and move through:

1. original source record;
2. understandable explanation;
3. glossary;
4. evidence provenance;
5. options with absolute numbers;
6. patient priorities;
7. teach-back;
8. visit/decision summary;
9. care/cost pathway;
10. exportable second-opinion packet.

At no point should Panacea silently transform uncertainty into certainty or patient education into autonomous diagnosis/treatment.
