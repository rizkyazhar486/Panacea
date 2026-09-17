# PANACEA PRIME — Wisdom Source Expansion + Adaptive Stress / Longevity / Emotional Regulation Addendum

Date: 2026-09-17
Status: Approved requirement addendum
Parent spec: `docs/superpowers/specs/2026-09-17-panacea-prime-human-potential-design.md`
Parent plan: `docs/superpowers/plans/2026-09-17-prime-wisdom-fabric.md`
Execution branch: `feat/prime-wisdom-fabric-sdd`

## 1. Purpose

Expand PRIME Wisdom Fabric with additional source identities requested by product direction, and make **adaptive stress, hormesis, perceived adversity, recovery, allostatic load, and emotional regulation** a first-class cross-domain lens.

This addendum does **not** treat podcasts, social posts, books, interviews, or creator claims as scientific truth. It defines how they enter the provenance graph and how PRIME separates:

- scientific/clinical evidence;
- mechanistic hypothesis;
- expert education;
- historical/philosophical frameworks;
- founder/athlete case studies;
- personal experience;
- opinion;
- contested claims.

The screenshots supplied with this requirement are examples of why this separation is mandatory: one feed can mix plausible physiology, oversimplified mechanisms, numerical performance claims, personal resilience narratives, nutrition simplifications, product-specific metabolic claims, and potentially unsafe blanket health advice.

---

## 2. New source identities to include in the catalog

These identities are **coverage targets**, not endorsements. Exact canonical URLs, rights, publication dates, episode IDs, transcript rights, and creator identity must be verified during source-catalog implementation.

### 2.1 Health, physiology, metabolism, longevity, sexual medicine, exercise

- **Thomas Seyfried** — cancer metabolism, mitochondrial/metabolic theory, ketogenic/metabolic therapy research and public education. High-risk clinical claims require independent primary/clinical evidence and must never become self-treatment instructions.
- **Andrew Huberman / Huberman Lab** — neuroscience, sleep, stress, behavior, exercise, addiction, performance. `expert_education` until independently evidence-linked for health guidance.
- **David Sinclair** — aging biology, longevity mechanisms, public education, books, interviews. Peer-reviewed work and public commentary must remain separate source units.
- **Darren Candow** — creatine, skeletal muscle, aging and resistance-training research. Prefer peer-reviewed publications as primary evidence; interviews are secondary explanation.
- **Rachel Rubin** — sexual medicine/urology education. Clinical claims require guideline/primary-evidence linkage.
- **Jeff Cavaliere / ATHLEAN-X** — exercise technique, training and injury-related education. Training claims may be educational; diagnosis, rehab, or injury management must remain subordinate to Clinical.
- **Sam Sulek** — bodybuilding/training/nutrition personal experience and athlete case study. Never elevated to clinical or scientific evidence by popularity.
- **Chris Bumstead** — elite bodybuilding/performance case study and public personal experience. Useful for discipline/competition narratives; not evidence of safety or generalizability.
- **My Metabolism app / source identity as supplied by product direction** — consumer/provider source. Canonical identity and exact claims must be resolved before catalog activation; provider-generated claims remain `provider_claim`/`expert_interpretation` unless independently validated.
- **TED / TED Health / TED podcast ecosystem** — educational distribution platform. Evidence class attaches to the individual speaker and claim, not to the TED brand itself.

### 2.2 Psychology, emotional regulation, social behavior, performance

- **Jay Shetty** — relationships, habits, meaning, communication, self-development perspective.
- **Steven Bartlett / The Diary of a CEO** — interview platform spanning health, psychology, relationships and entrepreneurship. Classify guest-by-guest and claim-by-claim.
- **Vanessa Van Edwards** — social behavior, communication, interpersonal skills. Research claims should resolve to primary literature where possible.
- **Leanne ten Brinke** — psychology / behavior research and public education. Prefer scholarly publications over interview summaries when available.
- **Steven Kotler** — flow, performance, motivation, peak-performance frameworks. Neuroscience claims require independent literature linkage.
- **Brian Tracy** — productivity, goals, sales, self-development. Perspective/framework source, not scientific authority.
- **Alex Hormozi** — business execution, sales, offers, entrepreneurship and operating heuristics. Case-study/perspective source.

### 2.3 Philosophy, meaning, worldview

- **Friedrich Nietzsche** — philosophy, adversity, meaning, self-overcoming, values. Use primary texts/public-domain editions where lawful; keep translation provenance. Never convert philosophical aphorisms into biomedical claims.

### 2.4 Business, capital, macro, technology

- **Michael Saylor** — technology/business/Bitcoin and capital-allocation viewpoints. Treat finance/market claims as attributed perspective; never convert into individualized investment instructions.
- **Ray Dalio** — macroeconomic frameworks, decision principles, organizational/portfolio viewpoints. Primary writings/interviews preferred; not a source of personalized financial advice.

### 2.5 Interview/media platforms with political or geopolitical content

- **Tucker Carlson** — interview/media source identity. Non-political life-history or guest material can be routed normally by claim type. Political/geopolitical claims must remain explicitly attributed, fact-checked against independent sources where used, and must never become user-specific political persuasion, candidate guidance, or unlabeled fact.

---

## 3. PRIME Adaptive Stress & Longevity Lens

PRIME must model stress as a **dose-, context-, time-, and recovery-dependent biological and psychological process**.

It must reject both simplistic extremes:

```text
"all stress is bad"   -> false simplification
"more adversity is always better" -> unsafe simplification
```

The product model is:

```text
adaptive_response ~= f(
  stressor_type,
  dose,
  duration,
  frequency,
  baseline_capacity,
  prior_adaptation,
  perceived_control,
  recovery_capacity,
  sleep,
  nutrition,
  disease/injury context,
  age/life stage,
  environment
)
```

This is a **conceptual product model, not a validated clinical equation**.

A second conceptual relationship is:

```text
net_adaptation ~= adaptive_gain - cumulative_unrecovered_load
```

Again, this must never be displayed as a clinical score or numerical truth without validation.

### 3.1 Stress regimes

PRIME should reason categorically first:

```text
CHALLENGE
  brief / recoverable / meaningful / capacity-appropriate

ADAPT
  evidence of tolerated exposure + recovery + positive trend

RECOVER
  insufficient recovery or accumulating fatigue

PROTECT
  clinical, mental-health, injury, sleep, or safety context overrides challenge

UNCERTAIN
  insufficient data or conflicting evidence
```

### 3.2 Hormesis boundary

Hormesis is represented as **biphasic/adaptive stress biology**, not as a slogan.

PRIME may teach:

```text
mild / bounded stressor -> adaptive response may increase resilience
excessive / chronic / poorly recovered stressor -> benefit can disappear or reverse
```

Do not use UI copy such as `what does not kill you makes you live longer` as a medical principle.

Do not call sirtuins, AMPK, mTOR, Nrf2, autophagy, or other pathways `longevity genes` without context. Mechanistic pathways may be displayed only with evidence class, species/context, and uncertainty.

### 3.3 Stressor classes

PRIME may model, with separate safety gates:

- aerobic exercise;
- resistance training;
- interval/high-intensity exercise;
- heat exposure;
- cold exposure;
- fasting / energy restriction;
- cognitive challenge;
- novelty/skill learning;
- psychologically meaningful challenge;
- social exposure/challenge;
- competition;
- environmental adversity.

Each stressor must carry:

```ts
interface PrimeAdaptiveStressor {
  class: string;
  intendedDose?: string;
  observedDose?: string;
  duration?: string;
  frequency?: string;
  evidenceTier: 'clinical' | 'human_trial' | 'human_observational' | 'mechanistic_human' | 'animal' | 'cellular' | 'expert_interpretation' | 'anecdote';
  expectedAdaptation?: string;
  recoveryDemand?: 'low' | 'moderate' | 'high' | 'unknown';
  contraindicationFlags: string[];
  measuredOutcomes: string[];
  selfReportedOutcomes: string[];
  uncertainty: string[];
}
```

No stressor becomes a recommendation merely because it has a plausible pathway.

---

## 4. Perceived Adversity + Emotional Regulation

PRIME should distinguish **external load** from **perceived load**.

Two users can experience the same event differently because appraisal, predictability, control, prior experience, safety, social support, sleep, illness, and current capacity differ.

Use this conceptual loop:

```text
event / stressor
  -> appraisal / perceived adversity
  -> autonomic + endocrine + cognitive response
  -> behavior / coping
  -> recovery or persistence
  -> learning / adaptation or cumulative load
```

The UI must not imply that distress is simply a failure of mindset.

### 4.1 Emotional-regulation state model

Store separate dimensions instead of one fake `resilience score`:

```ts
interface PrimeRegulationContext {
  perceivedDemand?: 'low' | 'moderate' | 'high' | 'unknown';
  perceivedControl?: 'low' | 'moderate' | 'high' | 'unknown';
  predictability?: 'low' | 'moderate' | 'high' | 'unknown';
  socialSafety?: 'low' | 'moderate' | 'high' | 'unknown';
  physiologicalArousal?: 'low' | 'moderate' | 'high' | 'unknown';
  cognitiveLoad?: 'low' | 'moderate' | 'high' | 'unknown';
  recoveryCapacity?: 'low' | 'moderate' | 'high' | 'unknown';
  copingMode?: 'approach' | 'avoidance' | 'reappraisal' | 'suppression' | 'support_seeking' | 'unknown';
  source: 'self_reported' | 'measured' | 'derived' | 'reference';
  observedAt: string;
}
```

### 4.2 Product objective

PRIME should help the user learn:

```text
notice state
 -> label demand
 -> identify controllable vs uncontrollable elements
 -> choose regulation / action / recovery
 -> observe physiological + subjective response
 -> learn what improves recovery and agency
```

Examples of possible **education/action classes** only when appropriate:

- paced breathing / down-regulation;
- movement/exercise;
- cognitive reappraisal;
- decompression and sleep protection;
- social support;
- exposure to constructive, reversible challenge;
- mindfulness/attention practice;
- environmental change;
- clinician/mental-health escalation when indicated.

Mental-health safety orchestration remains upstream. PRIME must never frame severe distress, suicidality, trauma, panic, depression, or addiction as a hormesis opportunity.

---

## 5. Screenshot Claim Router — required adversarial examples

The supplied screenshots should become test fixtures conceptually, without redistributing their copyrighted media/text.

| Example claim pattern | PRIME classification | Required behavior |
|---|---|---|
| `Hormesis / fasting / heat / cold / exercise activate longevity pathways` | expert education + mechanistic/scientific candidate | resolve pathway claim to human/primary evidence; show dose/context; never promise slowed aging |
| `Sirtuins/AMPK/mTOR are longevity genes` | oversimplified mechanistic wording | normalize to pathway-specific language; preserve uncertainty and species/context |
| `Creatine adds 2-3 lb lean mass / accelerates muscle gain by one-third / 1 in 4 non-responder` | quantitative intervention claim | require exact study/meta-analysis population, intervention, duration and effect estimate; no universal promise |
| elite bodybuilder `shows up anyway` | personal experience / athlete case study | usable as motivation lens only when recovery/safety permits; never evidence that pushing through illness is safe |
| `calories in/out is all that matters; food almost does not matter` | partially true model + oversimplification | preserve energy-balance principle while surfacing effects of food composition on satiety, intake, expenditure, performance, health and adherence |
| `low-carb product still spikes glucose` | product-specific/provider claim | require product composition and measured evidence; individual CGM response is not automatically generalizable |
| `cutting salt causes insulin resistance / salt is not the driver of hypertension` | contested/high-risk nutrition claim | route to guidelines/systematic evidence; never issue blanket high-sodium advice; clinical context wins |
| `detox water / cucumber / green tea / fasting causes weight loss` | mixed behavioral + unsupported marketing claims | separate plausible calorie/adherence behaviors from unsupported detox language |

The policy test suite should contain synthetic equivalents of these claims so the production router is tested without copying the source posts.

---

## 6. Evidence routing hierarchy for longevity/stress content

For patient-facing health guidance:

```text
clinical guideline / consensus where applicable
  > systematic review / meta-analysis
  > human randomized evidence
  > strong human observational evidence
  > mechanistic human evidence
  > animal evidence
  > cellular evidence
  > expert interpretation
  > podcast / book / social post
  > anecdote
```

This ordering is a routing rule, not a universal quality score. Study design, population, effect size, bias, replication, recency and applicability still matter.

A creator with scientific credentials can generate multiple source classes:

```text
peer-reviewed paper -> scientific_evidence
podcast explanation  -> expert_education
book hypothesis      -> expert_interpretation
personal routine     -> personal_experience
```

PRIME must never merge those into one authority label.

---

## 7. Source-specific guardrails

### Thomas Seyfried

- distinguish cancer-metabolism research from clinical standard of care;
- metabolic-therapy hypotheses cannot override oncology guidance;
- no unsupervised fasting/ketogenic protocols for cancer treatment.

### David Sinclair

- separate peer-reviewed aging biology from book/podcast extrapolation;
- do not convert pathway activation into guaranteed lifespan extension;
- `xenohormesis` remains hypothesis-level unless the specific claim is independently supported.

### Andrew Huberman

- source individual claims to underlying literature where possible;
- health protocol popularity does not upgrade evidence class.

### Darren Candow / creatine

- prefer research publications for effect estimates;
- preserve population, dose, training context, duration and outcome definition;
- avoid universal `responder/non-responder` claims without exact evidence.

### Rachel Rubin

- sexual-health claims use clinical evidence hierarchy and contraindication context;
- educational content does not substitute for diagnosis or treatment.

### Jeff Cavaliere / Sam Sulek / Chris Bumstead

- separate biomechanics/training education from athlete anecdote;
- physique success is not evidence of safety, optimality or generalizability;
- no normalization of injury, sleep loss, drug use, or illness as the cost of discipline.

### Steven Kotler / Brian Tracy / Jay Shetty / Steven Bartlett / Vanessa Van Edwards / Alex Hormozi

- useful as behavioral frameworks, interview sources and case studies;
- psychological/scientific claims require underlying research linkage;
- no universal definition of success.

### Nietzsche

- philosophy/worldview lens only;
- preserve work/edition/translator provenance;
- aphorism is not empirical evidence.

### Michael Saylor / Ray Dalio

- finance/business perspective and primary-source case study;
- no individualized investment recommendation or guaranteed return inference;
- explicitly preserve disagreement and counter-models.

### Tucker Carlson

- treat as interview/media source, not authority by platform identity;
- political/geopolitical material remains attributed and independently verified when surfaced;
- no personalized political persuasion or electoral recommendation.

---

## 8. Visual-first PRIME surface: Stress & Adaptation Lens

Do not create a new top-level page.

Expose inside PRIME/Your Body/For You as a contextual lens with one dominant visual state.

Possible compact states:

```text
CHALLENGE  -> pulse / load arc
ADAPT      -> recovery-complete trajectory
RECOVER    -> downward load + recovery window
PROTECT    -> safety boundary
UNCERTAIN  -> incomplete provenance/data
```

Main-scroll text remains one line or less. Detail is behind `Why?`, `Evidence`, `Dose`, `Recovery`, `Contradictions`, or `Interpret` actions.

The user should be able to see:

- current stressor exposure;
- recovery state;
- subjective/perceived adversity;
- objective signals when available;
- evidence tier;
- adaptation trend;
- why PRIME chose challenge vs recovery;
- conflicting source lenses.

Wearables enrich this but are never required.

---

## 9. Required implementation changes to the Wisdom Fabric plan

When Task 3 source-catalog work begins, include all identities in Section 2 with rights defaulting to `check_required` until verified.

When policy/retrieval tasks begin, add:

```ts
type PrimeHealthClaimClass =
  | 'guideline'
  | 'intervention_effect'
  | 'mechanistic'
  | 'dose_response'
  | 'safety'
  | 'product_specific'
  | 'personal_routine'
  | 'anecdote'
  | 'contested';
```

and require:

```text
health_action_allowed =
  safety_gate_passed
  AND evidence_fit_sufficient
  AND population_fit_sufficient
  AND contraindication_check_passed
```

This is deterministic policy logic, not a clinical probability formula.

Add adversarial tests for:

- acute challenge vs chronic overload;
- exhausted user receiving `RECOVER`, not motivational push content;
- depression/trauma not routed to hormesis;
- fasting/heat/cold not recommended under contraindication uncertainty;
- numerical creator claim missing study locator;
- mechanistic animal evidence blocked from becoming human outcome promise;
- social-media nutrition claim contradicted by guideline evidence;
- financial/political source content staying in its proper domain;
- emotional regulation action remaining optional and explainable.

---

## 10. Scientific anchors for implementation review

These references support the **architecture**, not every specific intervention claim.

1. Rattan SIS. Hormesis in aging. *Ageing Research Reviews*. 2008;7(1):63-78. PMID: 17964227. DOI: 10.1016/j.arr.2007.03.002. https://pubmed.ncbi.nlm.nih.gov/17964227/
2. Gems D, Partridge L. Stress-response hormesis and aging: "that which does not kill us makes us stronger". *Cell Metabolism*. 2008;7(3):200-203. PMID: 18316025. DOI: 10.1016/j.cmet.2008.01.001. https://pubmed.ncbi.nlm.nih.gov/18316025/
3. Mattson MP. Dietary factors, hormesis and health. *Ageing Research Reviews*. 2008;7(1):43-48. PMID: 17913594. DOI: 10.1016/j.arr.2007.08.004. https://pubmed.ncbi.nlm.nih.gov/17913594/
4. McEwen BS. Physiology and neurobiology of stress and adaptation: central role of the brain. *Physiological Reviews*. 2007;87(3):873-904. PMID: 17615391. DOI: 10.1152/physrev.00041.2006. https://pubmed.ncbi.nlm.nih.gov/17615391/
5. McEwen BS, Gianaros PJ. Stress- and allostasis-induced brain plasticity. *Annual Review of Medicine*. 2011;62:431-445. PMID: 20707675. DOI: 10.1146/annurev-med-052209-100430. https://pubmed.ncbi.nlm.nih.gov/20707675/
6. Pace-Schott EF, Amole MC, Aue T, et al. Physiological feelings. *Neuroscience & Biobehavioral Reviews*. 2019;103:267-304. PMID: 31125635. DOI: 10.1016/j.neubiorev.2019.05.002. https://pubmed.ncbi.nlm.nih.gov/31125635/

### Evidence interpretation

The literature supports modeling stress as adaptive in some short-term contexts and damaging when repeated, excessive, dysregulated or insufficiently recovered. It does **not** justify a universal rule that more fasting, cold, heat, exercise, pain, emotional adversity, or deprivation increases human lifespan.

---

## 11. Acceptance criterion for this addendum

Implementation is compliant only if PRIME can ingest the expanded source universe **without collapsing source popularity into authority**, and can explain the difference between:

```text
constructive challenge
vs
adaptive response
vs
recovery need
vs
chronic/allostatic overload
vs
clinical/mental-health risk
```

while preserving user agency, evidence provenance, contradictions, and explicit uncertainty.
