# PanaceaMed Workout & Athletics Automation Specification

This specification turns the workout and athletics modules into an automated, self-auditing, scientific analysis pipeline rather than a manually curated dashboard.

## 1. Objective

Automate the flow from raw workout data to validated metrics, physiology interpretation, scientific scoring, UI-ready insights, and QA status.

Target pipeline:

`raw session data -> normalize -> validate -> derive metrics -> scientific interpretation -> anomaly detection -> recommendation generation -> UI payload -> QA report`

## 2. Core Automation Layers

### A. Data ingestion automation
Automatically normalize incoming workout data into a single schema regardless of source:
- Apple Health
- Garmin
- Strava
- Suunto
- manual entry
- future wearable APIs

Required normalized fields:
- session_id
- date_time
- sport_type
- duration_sec
- distance_m
- avg_hr
- max_hr
- resting_hr
- pace
- speed
- cadence
- elevation_gain
- calories
- perceived_exertion
- sleep/recovery context if available

### B. Validation automation
Every imported session should automatically be checked for:
- impossible heart-rate values
- negative/zero duration
- inconsistent pace-speed conversion
- impossible distance-duration combinations
- missing required fields
- duplicated sessions
- sensor dropouts
- null-heavy records

Each session gets a machine-readable status:
- `valid`
- `valid_with_warnings`
- `needs_review`
- `rejected`

### C. Derived-metric automation
Automatically calculate when inputs are available:

#### Speed
\[
Speed = \frac{Distance}{Time}
\]

#### Pace
\[
Pace = \frac{Time}{Distance}
\]

#### Heart Rate Reserve
\[
HRR = HR_{max} - HR_{rest}
\]

#### Relative HRR intensity
\[
Intensity_{HRR} = \frac{HR_{session}-HR_{rest}}{HR_{max}-HR_{rest}}
\]

#### Cardiac-output conceptual layer
\[
CO = HR \times SV
\]

#### Fick principle educational layer
\[
\dot{V}O_2 = Q \times (C_{aO_2} - C_{vO_2})
\]

#### Running VO2 estimate where appropriate
\[
VO_2 \approx 0.2S + 0.9SG + 3.5
\]
where `S` is speed in m/min and `G` is treadmill grade as a fraction.

### D. Heart-rate-zone automation
Automatically calculate time and percentage in each HR zone.

Support at least:
- percentage of measured HRmax
- heart-rate-reserve / Karvonen mode
- optional user-specific threshold mode

The system must record which zone method was used so interpretations are reproducible.

### E. Session interpretation automation
Generate structured interpretations for each session:
- aerobic emphasis
- anaerobic emphasis
- threshold exposure
- easy/base work
- likely recovery burden
- pacing consistency
- cardiovascular strain context
- possible sensor/data-quality concerns

Do not produce generic messages such as `great workout` without quantitative support.

## 3. Scientific Interpretation Engine

Each metric should generate five structured fields:
1. `value`
2. `meaning`
3. `physiology`
4. `confidence`
5. `next_action`

Example:

```json
{
  "metric": "avg_hr",
  "value": 168,
  "meaning": "High relative cardiovascular intensity for this session",
  "physiology": "Higher sympathetic drive and cardiac output demand are expected at this intensity",
  "confidence": "moderate",
  "next_action": "Compare with pace, temperature, sleep, recovery, and prior sessions before changing training load"
}
```

## 4. Automated Analytics

### A. Aerobic efficiency
Use a simple proxy only when session type and conditions are sufficiently comparable:

\[
Aerobic\ Efficiency\ Proxy = \frac{Speed}{Heart\ Rate}
\]

Never present this as a universal physiological constant. Display it as a longitudinal proxy.

### B. Pace-HR decoupling
For steady endurance sessions, compare first-half and second-half efficiency.

Example proxy:

\[
Decoupling(\%) = \frac{EF_1-EF_2}{EF_1}\times 100\%
\]

where:

\[
EF = \frac{Speed}{HR}
\]

Flag high decoupling only if the session is sufficiently steady and long enough for the calculation to make sense.

### C. Session-RPE load
If RPE is available:

\[
Session\ Load = Duration_{min} \times RPE
\]

### D. Training monotony
\[
Monotony = \frac{Mean\ Daily\ Load}{SD\ Daily\ Load}
\]

### E. Training strain
\[
Strain = Weekly\ Load \times Monotony
\]

These should be shown as monitoring metrics, not standalone diagnoses of overtraining.

## 5. Automated Trend Engine

For each athlete/user, automatically compare:
- session vs previous similar session
- 7-day trend
- 28-day trend
- current block vs prior block

Automated trend outputs should include:
- pace change at similar HR
- HR change at similar pace
- volume change
- intensity distribution change
- recovery trend
- session-load trend
- possible performance plateau

## 6. Automated Context Engine

Before generating strong conclusions, automatically account for available confounders:
- sleep
- temperature
- humidity
- altitude
- incline
- dehydration context
- illness context
- recent training load
- stimulant use if recorded
- sensor confidence

If context is missing, reduce confidence rather than pretending certainty.

## 7. Confidence Scoring

Every generated scientific interpretation should include a confidence score based on data completeness and comparability.

Example conceptual formula:

\[
Confidence = Data\ Quality \times Context\ Completeness \times Comparability
\]

Each component can be normalized to 0-1.

Never show high-confidence language from poor-quality data.

## 8. Automated UI Payload Generation

The analytics engine should produce UI-ready sections automatically:
- Session Summary
- Intensity & HR
- Pace & Efficiency
- HR Zones
- Training Load
- Recovery Context
- Energy Systems
- Scientific Interpretation
- Recommendation
- Data Quality

The UI should render from these structured payloads rather than hard-coded narrative blocks.

## 9. Automated Energy-System Classification

Use exercise duration, intensity, and sport type to estimate dominant contribution categories:
- phosphagen emphasis
- glycolytic emphasis
- oxidative emphasis

Do not imply one system works in isolation. Use wording such as `predominant contribution`.

Output should include:
- dominant system
- secondary system
- supporting explanation
- confidence

## 10. Workout Physiology Automation

Automatically attach relevant physiology modules to the session:

### Cardiovascular
- sympathetic activation
- HR response
- stroke-volume response
- cardiac-output demand

### Respiratory
- ventilation response
- oxygen transport
- gas exchange context

### Muscular/metabolic
- ATP demand
- phosphocreatine use
- glycolysis
- lactate production/clearance concepts
- oxidative phosphorylation
- substrate utilization

### Recovery
- parasympathetic reactivation
- glycogen restoration
- hydration
- sleep/recovery context

## 11. Recommendation Rules

Recommendations must be rule- and evidence-aware rather than motivational filler.

Each recommendation should store:
- trigger
- supporting metrics
- contraindicating/context factors
- confidence
- recommended action

Example:

```json
{
  "trigger": "high_intensity_accumulation",
  "supporting_metrics": ["zone4_5_minutes", "weekly_load", "recovery_score"],
  "confidence": 0.78,
  "action": "Consider lower-intensity training if recovery markers remain suppressed"
}
```

## 12. Automated Anomaly Detection

Flag automatically:
- unusually high HR for pace
- unusually low HR for pace
- major pace drop
- excessive HR drift
- unexpected cadence drop
- impossible sensor spikes
- sudden load increase
- repeated high-intensity days
- insufficient recovery markers

Important: classify as `signal`, not diagnosis.

## 13. Automated QA / Completeness Dashboard

Generate project-level reports:

\[
Workout\ Coverage = \frac{Sessions\ with\ complete\ analytics}{Total\ valid\ sessions}\times100\%
\]

\[
Scientific\ Coverage = \frac{Sessions\ with\ physiology\ interpretation}{Total\ valid\ sessions}\times100\%
\]

\[
Automation\ Success = \frac{Sessions\ processed\ without\ manual\ repair}{Total\ sessions}\times100\%
\]

Track:
- failed ingestion count
- failed analysis count
- missing metric count
- unsupported sport type count
- low-confidence interpretation count
- UI render failure count

## 14. Automation Architecture

Recommended code separation:

```text
src/
  domain/workout/
    schemas/
    normalization/
    validation/
    metrics/
    physiology/
    interpretation/
    recommendations/
    trends/
    qa/

scripts/
  audit-workout-data.*
  validate-workout-content.*
  report-workout-completeness.*
```

Keep formulas and scientific rules out of UI components.

## 15. Suggested Processing Contract

```ts
interface WorkoutAnalysisResult {
  sessionId: string;
  status: 'valid' | 'valid_with_warnings' | 'needs_review' | 'rejected';
  dataQuality: number;
  metrics: Record<string, number | string | null>;
  zones: Record<string, number>;
  physiology: PhysiologyInsight[];
  interpretations: ScientificInterpretation[];
  anomalies: WorkoutAnomaly[];
  recommendations: Recommendation[];
  confidence: number;
}
```

## 16. Automation Priority Order

1. normalize workout data
2. validate inputs
3. derive pace/speed/HR metrics
4. calculate HR zones
5. calculate load and longitudinal trends
6. detect anomalies
7. generate scientific interpretation
8. attach physiology explanations
9. generate recommendation payload
10. generate UI sections
11. run QA/completeness report

## 17. Guardrails

The automation must:
- distinguish measured vs estimated values
- never silently invent missing data
- show assumptions
- preserve raw source data
- record calculation method/version
- degrade confidence when inputs are incomplete
- avoid presenting training analytics as medical diagnosis

## 18. Definition of Done

The workout/athletics automation layer is complete when a valid session can enter the system and automatically produce:
- validated normalized data
- calculated metrics
- HR-zone distribution
- load/trend analytics
- scientific physiology interpretation
- contextual warnings
- data-quality/confidence score
- actionable recommendation
- UI-ready payload
- QA/completeness status

with no manual rewriting of each session.