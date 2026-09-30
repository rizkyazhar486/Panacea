# Panaceamed Longevity-First Master Directive

Status: **standing product and engineering directive**
Owner priority: **Longevity · Wellness · Healthy Aging · Personalized Medicine**
Applies to: every current and future model, coding agent, workflow, product lane, and major architectural decision.

This document complements `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `AGENTS.md`, and `CLAUDE.md`. Safety, evidence, privacy, human oversight, and scientific provenance remain hard constraints.

## 1. Product north star

Panaceamed is primarily a **personalized longitudinal longevity and wellness operating system**.

The core loop is:

```
PERSONAL BASELINE
→ LONGITUDINAL MEASUREMENT
→ EARLY DEVIATION / TREND DETECTION
→ RISK CONTEXT
→ EXPLANATION
→ PERSONALIZED ACTION
→ RE-MEASUREMENT
→ CLINICIAN ESCALATION WHEN APPROPRIATE
```

The product promise **"know the data before the symptoms"** must never be implemented as a claim of certain presymptomatic diagnosis. It means identifying meaningful changes from an individual's prior state early enough to support measurement, prevention, behavior change, or appropriate clinical review.

## 2. Canonical longitudinal health state

Do not build disconnected mini-profiles. Converge all applicable data into one canonical person/patient state:

- demographics and identity;
- medical and family history;
- diagnoses/problems;
- medications and allergies;
- laboratory and blood-panel results;
- DNA/genomics;
- RNA/transcriptomics when real data exist;
- epigenetic/methylation data when real data exist;
- body composition;
- cardiovascular and cardiorespiratory fitness;
- sleep and recovery;
- wearable/device observations;
- nutrition;
- mental wellness;
- exercise/training;
- environment/exposome;
- sauna, thermal exposure, bath-house and recovery-center visits;
- preventive-care events;
- clinical encounters and clinician-reviewed decisions.

Every meaningful datapoint should preserve, when applicable:

```
person_id
timestamp
source
source_type
measurement_method
unit
reference_context
quality
provenance
review_state
confidence_or_uncertainty
```

Source types should remain visibly distinct:

```
CLINIC_OR_LAB
DEVICE_MEASURED
VENDOR_SYNCED
USER_ENTERED
IMPORTED
CALCULATED
AI_INFERRED
SIMULATED
```

Never silently collapse these classes.

## 3. Personal Baseline Engine

Population reference intervals remain useful, but Panaceamed must also understand the user's own history.

For longitudinal variable `X`:

```
AbsoluteChange = X_current - X_baseline

RelativeChangePercent =
((X_current - X_baseline) / X_baseline) × 100

RateOfChange ≈
(X_t2 - X_t1) / (t2 - t1)

PersonalDeviation =
(X_current - μ_personal) / σ_personal
```

Use these only where mathematically and clinically appropriate. A personal deviation score is a monitoring signal, not a diagnosis.

For each variable, support:

- current value;
- prior value;
- historical median / rolling baseline;
- population reference interval;
- absolute and relative change;
- rate of change;
- rolling variability;
- trend direction;
- data quality;
- measurement context.

Noise, biological variability, assay differences, missingness, and inadequate sample history must reduce confidence rather than produce false precision.

## 4. Early Health Signal Engine

Create a reusable early-deviation layer over longitudinal data.

Inputs may include:

- labs;
- resting HR;
- HRV;
- blood pressure;
- glucose data when available;
- sleep;
- fitness;
- body composition;
- mental wellness;
- medications;
- genomics;
- environment;
- thermal exposure;
- activity/training load.

Safe output classes:

```
STABLE
IMPROVING
WATCH
MEANINGFUL_CHANGE
CLINICAL_REVIEW_SUGGESTED
URGENT_CLINICAL_REVIEW
```

Do not escalate from one noisy datapoint unless the underlying clinical rule genuinely requires it. Consider repeatability, measurement quality, rate of change, biological variability, context, and established reference thresholds.

Every signal must explain:
- what changed;
- relative to what baseline;
- how confident the system is;
- why it may matter;
- what data could confound the signal;
- the next appropriate action.

## 5. Blood Panel Database — first-class product infrastructure

Blood and laboratory data are a primary longevity foundation.

Canonical lab observation fields should support:

```
person_id
canonical_analyte_id
display_name
LOINC_when_available
value
original_unit
normalized_unit
reference_low
reference_high
reference_context
collection_time
result_time
specimen
fasting_status_when_relevant
lab_or_source
assay_method_when_available
quality
provenance
```

Core panel families include, where relevant and actually measured:

- CBC;
- renal function;
- electrolytes;
- liver chemistry;
- lipids;
- glucose/HbA1c;
- insulin when measured;
- thyroid;
- iron studies;
- B12/folate;
- vitamin D;
- uric acid;
- inflammatory markers;
- cardiometabolic biomarkers;
- clinically appropriate hormonal tests.

Never fabricate missing values.

Each longitudinal analyte should expose:

```
CURRENT
PERSONAL_BASELINE
PREVIOUS
TREND
RATE_OF_CHANGE
REFERENCE_RANGE
PERSONAL_RANGE
WHY_IT_MAY_MATTER
POTENTIAL_CONFOUNDERS
NEXT_MEASUREMENT_OR_REVIEW
```

## 6. Personalized medicine

Personalized medicine should combine:

```
genetics
+ phenotype
+ family history
+ labs
+ medications
+ allergies
+ lifestyle
+ wearable state
+ diagnoses
+ prior response
```

Prioritize clinically validated personalization.

Pharmacogenomics should use authoritative evidence frameworks where applicable, such as CPIC, PharmGKB, ClinGen, FDA labeling, and DailyMed.

Evidence labels:

```
CLINICALLY_ACTIONABLE
EVIDENCE_SUPPORTED
RESEARCH
EXPERIMENTAL
```

Never invent gene–drug or gene–disease relationships.

## 7. DNA / genomics

Converge existing genome/SNP/gene/variant capabilities into one genomic profile.

Support, when real data exist:

- gene;
- variant;
- chromosome/location;
- genotype;
- zygosity;
- source;
- quality;
- clinical significance;
- evidence provenance;
- pharmacogenomic relevance;
- research-only traits.

Where appropriate use ACMG/AMP + ClinGen concepts. Consumer genetics must not be presented as definitive clinical diagnosis.

## 8. RNA / transcriptomics

Build architecture for real transcriptomic data without faking measurements.

When real RNA/transcriptomic data exist, preserve:

- sample/tissue;
- collection time;
- assay platform;
- normalization method;
- expression value;
- reference/comparator;
- pathway interpretation;
- quality;
- provenance.

Unless a validated clinical workflow exists, label transcriptomic interpretation as advanced/research functionality.

## 9. Biological Age Hub

Biological age is a major longevity surface, not a novelty calculator.

Never reduce biological aging to one supposedly definitive number.

Support evidence-classed outputs such as:
- phenotypic/clinical biological age;
- functional age;
- cardiorespiratory fitness age;
- validated epigenetic clocks only when required methylation data actually exist.

For each method show:
- method name;
- required inputs;
- missing inputs;
- reference population;
- uncertainty;
- modifiable contributors;
- longitudinal trajectory.

Core metrics:

```
AgeGap =
BiologicalAge - ChronologicalAge

DeltaAgeGap =
AgeGap_current - AgeGap_previous
```

The important product output is trajectory, not pseudo-precise absolute age.

## 10. Longevity Dashboard

The default longevity experience should answer:

1. **How am I doing?**
2. **What changed?**
3. **Why might it matter?**
4. **What should I do next?**

Primary information architecture:

```
TODAY
→ TRENDS
→ ACTIONS
```

Secondary depth may include:

- Blood;
- Cardiometabolic;
- Body;
- Sleep;
- Recovery;
- Fitness;
- Mental Wellness;
- Nutrition;
- Genome;
- Biological Age;
- Environment;
- Preventive Care.

Do not dump hundreds of metrics on the default screen.

## 11. Longevity trajectories

Prefer trajectories over snapshots.

Core domains:

```
CARDIOMETABOLIC
FITNESS
BODY_COMPOSITION
SLEEP
RECOVERY
MENTAL_WELLNESS
MUSCULOSKELETAL
NEUROCOGNITIVE
IMMUNE_INFLAMMATORY
PREVENTIVE_CARE
```

Each domain should expose:
- current state;
- previous state;
- personal baseline;
- direction;
- confidence;
- drivers/contributors;
- next useful measurement/action.

## 12. Mental wellness as longevity infrastructure

Mental wellness is part of the longevity state, not an isolated psychiatric product.

Integrate voluntary signals such as:
- mood;
- stress;
- energy;
- burnout;
- sleep;
- social connection;
- anxiety/depression screening;
- substance-use context;
- mindfulness/recovery behaviors.

Correlations with sleep, HRV, training, life events, and other factors must be presented as associations unless causal evidence exists.

Crisis/suicide-risk workflows remain safety-first and must never be gamified.

## 13. Sleep and recovery

Sleep/recovery should share one canonical state across:
- sleep duration;
- timing;
- regularity;
- sleep debt;
- resting HR;
- HRV;
- subjective energy;
- training load;
- recovery/readiness.

Avoid duplicated sleep/recovery scores that disagree because they use independent stores.

## 14. Cardiorespiratory fitness

Treat fitness as a major longevity domain.

Support:
- VO2max;
- resting HR;
- exercise HR;
- heart-rate recovery;
- activity volume;
- training history;
- walking/running fitness.

Always label source:

```
LAB_MEASURED
DEVICE_ESTIMATED
PANACEA_DERIVED
USER_ENTERED
```

Never present an estimate as a laboratory measurement.

## 15. Body composition

Track longitudinally when available:
- weight;
- BMI;
- waist circumference;
- body fat;
- lean mass;
- muscle mass;
- visceral-fat estimate.

Preserve measurement method:

```
MANUAL
CONSUMER_SCALE_BIA
CLINICAL_BIA
DEXA
DERIVED
```

Consumer BIA is not equivalent to DEXA.

## 16. Nutrition

Personalized nutrition may use:
- health goals;
- laboratory context;
- diagnoses;
- body composition;
- activity;
- allergies;
- medications;
- preferences;
- culture;
- affordability/availability.

Avoid unsupported anti-aging diets, extreme restriction, or pseudo-scientific supplement stacks.

## 17. Thermal Wellness — sauna / heat / recovery

Thermal exposure should be a real longitudinal wellness event.

Users may log, when available:

```
venue
modality
session_start
session_end
duration
temperature
humidity
hydration_context
heart_rate
subjective_response
recovery
sleep_afterward
source
```

Modalities can include:
- traditional sauna;
- infrared sauna;
- steam room;
- hammam;
- hot bath/onsen;
- cold plunge/contrast recovery when separately modeled.

Never invent physiological measurements.

## 18. Sauna / bath-house / wellness venue database

Create a real venue model for:
- saunas;
- bath houses;
- onsen;
- hammam;
- thermal spas;
- cold-plunge facilities;
- recovery centers;
- wellness clubs.

Venue schema:

```
venue_id
name
location
coordinates
facility_types
thermal_modalities
temperature_ranges_if_sourced
cold_plunge_available
steam_room_available
pool_available
opening_hours_if_sourced
pricing_if_sourced
amenities
source_url_or_provider
last_verified_at
```

Never fabricate venue data.

## 19. Wellness check-in

Canonical flow:

```
DISCOVER_VENUE
→ CHECK_IN
→ LOG_EXPOSURE
→ OPTIONAL_HEALTH_CONTEXT
→ COMPLETE_SESSION
→ RECORD_RECOVERY
```

A check-in should create a real longitudinal exposure event, not only a social badge.

Example:

```
ThermalExposureEvent {
  personId
  venueId
  timestamp
  modality
  duration
  temperature?
  humidity?
  hydration?
  heartRate?
  subjectiveResponse?
  source
}
```

## 20. Thermal safety

Thermal/cold exposure is not universally appropriate.

Safety logic should consider relevant contexts such as:
- acute illness;
- dehydration;
- significant hypotension;
- cardiovascular instability;
- pregnancy-specific considerations;
- medications affecting thermoregulation;
- alcohol/intoxication.

High-risk users should be directed to appropriate clinical guidance rather than receiving universal recommendations.

## 21. Environment / exposome

Long-term architecture should support environmental exposure context:
- air quality;
- UV;
- heat;
- temperature;
- pollution/environment;
- travel/activity setting.

Use these to support longitudinal association analysis without claiming unsupported causation.

## 22. Personal Health Graph

Build toward one graph connecting:

```
PERSON
→ GENETICS
→ BIOLOGY
→ LABS
→ ORGANS
→ PHYSIOLOGY
→ BEHAVIOR
→ ENVIRONMENT
→ INTERVENTIONS
→ OUTCOMES
```

Body Exposure should become a visualization surface over relevant portions of this graph.

## 23. Personalized Action Engine

Signals should end in a useful next step.

Action categories:

```
MEASURE
MONITOR
BEHAVIOR
RECOVERY
NUTRITION
FITNESS
SLEEP
MENTAL_WELLNESS
CLINICIAN_REVIEW
```

Do not convert weak correlations into treatment recommendations.

## 24. N-of-1 wellness experiments

Support safe personal experiments such as:
- earlier sleep schedule;
- exercise changes;
- sauna frequency;
- nutrition changes;
- caffeine reduction.

Canonical structure:

```
BASELINE
→ INTERVENTION
→ OBSERVATION_WINDOW
→ OUTCOME
→ COMPARE
```

Do not imply causal certainty from uncontrolled N-of-1 observations.

## 25. Intervention timeline

Record:
- what changed;
- when;
- reason;
- expected effect;
- measured outcome;
- confidence/limitations.

A future Panaceamed should be able to answer:
**"What changes in my life have actually been associated with improvement?"**

## 26. Preventive medicine remains first-class

Longevity must not obscure proven prevention.

Include age/risk-appropriate:
- vaccination;
- blood-pressure monitoring;
- lipid screening;
- diabetes screening;
- cancer screening;
- medication review;
- smoking/alcohol/substance risk;
- dental/vision/hearing care where appropriate.

Futuristic longevity features must never outrank high-evidence preventive care merely because they are more novel.

## 27. Aggregate scores

If an aggregate Longevity Score exists, it must be transparent.

Prefer domain profiles over a mysterious single number.

If:

```
Score = Σ(w_i × Domain_i)
```

then:

```
Σ w_i = 1
```

and weights, inputs, missingness, evidence, and uncertainty must be documented.

Never manufacture pseudo-scientific precision.

## 28. Product architecture

Primary product areas should converge toward a compact hierarchy such as:

```
TODAY
MY HEALTH
BLOOD
BODY
LONGEVITY
MIND
FITNESS
SLEEP
NUTRITION
GENOME
PLACES / WELLNESS
CLINICAL
```

This is a conceptual hierarchy, not permission to create more top-level pages automatically.

Prefer super-pages and progressive disclosure.

## 29. Engineering implementation priority

After stability/security blockers, the default longevity sequence is:

1. canonical longitudinal health state;
2. blood-panel database;
3. personal baseline/trend engine;
4. Longevity Dashboard;
5. biological-age trajectory;
6. early lab/health deviation detection;
7. wearable/health-metric convergence;
8. mental-wellness longitudinal model;
9. sleep/recovery integration;
10. cardiorespiratory fitness / VO2max;
11. body composition;
12. personalized medicine;
13. DNA/genomics;
14. pharmacogenomics;
15. RNA/transcriptomics architecture;
16. nutrition personalization;
17. thermal-wellness tracking;
18. bath-house / sauna venue database;
19. wellness check-ins;
20. N-of-1 intervention tracking;
21. Personal Health Graph;
22. Body Exposure integration.

A shared infrastructure improvement that unlocks several of these should outrank a lower-level isolated feature.

## 30. User questions Panaceamed should eventually answer

Using real longitudinal data and transparent computation:

- How has my health changed over the last year?
- Which blood markers are drifting?
- What is unusual relative to my own baseline?
- Is my biological-age trajectory improving?
- What changed after I changed my sleep?
- What happened after I changed my training?
- What patterns are associated with periods of high stress?
- Which risk factors should I discuss with my clinician?
- Do validated genetic findings alter a clinically actionable decision?
- What happened to my sleep/recovery during periods when I used sauna?
- Which interventions appear associated with improvement?
- What should I measure next?

The answer must come from source-backed stored data, not fabricated AI memory.

## 31. Optimization function

Optimize for:

```
LongevityUtility =
(
Personalization
× LongitudinalDepth
× DataQuality
× EarlySignalValue
× Actionability
× Adherence
)
/
(
Friction
+ Noise
+ FalseAlarmRisk
+ UnsupportedClaims
)
```

The goal is not **more health data**.

The goal is:

```
THE RIGHT DATA
→ IN CONTEXT
→ OVER TIME
→ WITH MEANING
→ LEADING TO THE RIGHT NEXT ACTION
```

## 32. Standards and evidence anchors

Use appropriate authoritative standards and sources by domain, including:
- HL7 FHIR for healthcare interoperability;
- LOINC for laboratory observations;
- SNOMED CT / ICD where appropriately licensed/configured;
- ACMG/AMP and ClinGen for clinical variant interpretation;
- CPIC and PharmGKB for pharmacogenomics;
- FDA/DailyMed for medications;
- WHO and NIH/NIA for healthy aging/prevention context;
- peer-reviewed validated biological-age models.

Do not create a clinical relationship merely because a correlation is biologically plausible.

## 33. Definition of done for longevity features

A longevity feature is not complete because a page/card exists.

Applicable completion requires:

```
real_or_explicitly_demo_data
+ canonical_person_identity
+ longitudinal_persistence
+ provenance
+ uncertainty
+ trend_or_context
+ useful_action
+ safety_boundary
+ error/empty/loading states
+ tests
+ reachable UX
```

Whenever a future model receives the instruction **"continue"**, it should first identify the highest-value unresolved item in this longevity-first hierarchy unless a more urgent stabilization, security, privacy, or clinical-safety blocker exists.
