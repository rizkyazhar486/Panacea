# Panacea Longitudinal Patient State v50

## Purpose

Panacea's three super-pages must not behave like isolated products. Your Body, Clinical, and For You observe the same patient-scoped longitudinal state and preserve source, time, consent, and uncertainty boundaries.

Canonical flow:

`existing records → normalized signals → patient-scoped state → trends → contextual handoff → Chatbot / AI-EMR / Care`

This layer is an orchestration/data contract, not a diagnostic model.

## Signal envelope

Every normalized signal carries:

- `subjectId` — patient isolation boundary;
- `domain` — vitals, activity, sleep, recovery, fitness, nutrition, mind, or clinical;
- `metric`, `value`, `unit`;
- `measuredAt`, `receivedAt`;
- `source`;
- provenance kind: device, user, clinical, derived, or simulated;
- provenance source ID and evidence note;
- `confidence` used here as record/data fidelity metadata;
- consent state and scope;
- tags for source/bridge lineage.

`confidence = 1.0` on direct bridge copies means only that the longitudinal copy matches the stored source value. It MUST NOT be interpreted as device accuracy, diagnostic probability, prognosis, clinical certainty, or scientific validity.

## Patient isolation

Storage schema: `panacea.longitudinal.patient-state.v2`.

Every signal is keyed to a `subjectId`. UI readers and handoffs filter by the current active patient. Data from one patient must never be attached to another patient's AI, EMR, or Care context.

## Consent gate

Local state may display provenance/coverage even if consent is not yet available. AI/EMR/Care handoff is stricter:

`EligibleForHandoff = signal.consent.granted === true`

Only consent-granted signals are serialized into `panacea.longitudinal-handoff.v2`.

## Existing real data bridged in v50

### Patient clinical record

- systolic and diastolic blood pressure;
- heart rate;
- respiratory rate;
- temperature;
- SpO₂;
- glucose when present;
- structured supporting results (lab, ECG, radiology, other).

### Self / Your Body data

Only when the active subject is the signed-in person's self-patient:

- self-vitals;
- sleep duration and bedtime consistency;
- VO₂max;
- GPS activity distance, duration, average speed, energy, average/max HR;
- training RPE;
- food energy and macros;
- wellness sleep, water, exercise duration/energy, MET-hours;
- self-reported perceived energy, explicitly separated from measured physiology.

No new physiological value is fabricated by this bridge.

## Trend engine

The 30-day visual trend layer uses numeric observations only and groups values by subject, domain, metric, and unit.

### Least-squares slope

`m = Σ((tᵢ − t̄)(xᵢ − x̄)) / Σ((tᵢ − t̄)²)`

Time is expressed in days, so `m` is value-units/day.

### Relative change

`Δ% = (x_latest − x_earliest) / |x_earliest| × 100`

Relative change is omitted when the earliest value is effectively zero.

### Variability

`σ = sqrt(Σ(xᵢ − x̄)² / N)`

`CV% = σ / |x̄| × 100`

The trend engine is descriptive. It deliberately contains no disease-specific thresholds, diagnostic classification, treatment recommendation, risk score, or prognosis.

## UI contract

`LongitudinalStateRibbon` is reused by:

- Your Body (`/fitness-hub`);
- Clinical;
- For You.

It shows a compact visual state:

- signal count;
- domain coverage;
- source count;
- fidelity metadata;
- latest update recency;
- per-domain coverage bars;
- 30-day sparkline trends;
- consent coverage;
- one-tap context handoffs.

Visible interpretation remains minimal and one-line. Deeper clinical interpretation belongs to clinician-reviewed surfaces, not the scrolling state ribbon.

## Handoff boundary

The session handoff contains:

- schema version;
- `subjectId`;
- generated timestamp;
- summary;
- eligible signal count;
- up to 24 recent consented signals;
- provenance/confidence/consent for each attached signal;
- explicit safety boundary.

The handoff is context, not an autonomous instruction. Patient-specific clinical action remains clinician-controlled.

## Next compatible producers

Future source adapters should use the same envelope rather than inventing parallel state stores. Examples: Apple Health, Garmin, Oura, WHOOP, validated device feeds, laboratory interfaces, imaging metadata, and clinician-entered observations.

Every adapter must preserve original source identity and timestamps and must not silently convert missing/unknown data into zero or normal.
