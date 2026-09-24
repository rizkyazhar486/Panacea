# Panacea Product Learning Loop

Panacea should grow from solved user problems, not from feature count.

## Core loop

```
Observe real workflow
  -> identify recurring pain
  -> ship the smallest useful intervention
  -> instrument behavior
  -> measure activation + retention
  -> collect qualitative feedback
  -> keep / change / kill
  -> feed the learning back into the platform
```

This is intentionally compatible with Panacea's existing first-party feedback inbox,
owner analytics, A/B calculator, RFM segmentation and sentiment triage.

## Wedge metric

For a candidate use case:

```
U = (P * F * W * D * E) / (R * C)
```

Where:

- P = pain severity
- F = frequency
- W = willingness to pay
- D = distribution advantage
- E = founder/domain edge
- R = regulatory risk
- C = complexity / time-to-value

The score is only a prioritization heuristic. Real behavior overrides the score.

## Product metrics

Activation is defined in code as:

```
viewed Home Health Brief
AND
opened at least one meaningful action / feature / feedback / share surface
```

Exact-day cohort retention:

```
D_n = retained users who return on day n / users whose cohort is old enough to observe day n
```

Immature cohorts are excluded rather than counted as failures.

Primary operational metrics:

- activated users and activation rate
- D1 / D7 / D30 exact-day retention
- 1d / 7d / 30d active users
- repeat users across >=2 distinct days in the last 7 days
- top feature/action targets by unique users and event count

## Privacy boundary

Product-learning telemetry is first-party and categorical.

Allowed:

- event name
- product surface identifier
- target identifier
- local session identifier
- server-side authenticated user id
- server timestamp

Not accepted:

- heart rate or any other health measurement
- diagnosis / symptom / lab values
- free-text notes
- arbitrary metadata blobs
- full URLs or query strings
- third-party analytics payloads

Qualitative text remains in the existing explicit Feedback system rather than being
mixed into behavioral telemetry.

## Experiments

`assignProductExperiment()` provides deterministic first-party assignment and records
an exposure event. It does not declare a winner. Panacea's existing Owner Analytics
A/B module retains the decision boundary: pre-commit sample size, then evaluate.

## Founder operating rule

Do not ask "Which feature sounds impressive?"

Ask:

1. Which problem occurs repeatedly?
2. What do users do today instead?
3. What is the smallest intervention that creates a visible benefit?
4. Do users come back without being chased?
5. If not, what evidence says to change or kill it?

The Health OS is the accumulation of repeatedly solved problems.
