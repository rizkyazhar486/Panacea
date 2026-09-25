# Lab → Trend → Trajectory: Measurable Outcome + Prospective Validation Protocol

> **Status: design artifact only.** No prospective study has been run. No clinician
> has reviewed or approved this protocol. No clinical validation of the
> `longitudinal.lab_to_trajectory` lane exists as of this writing (2026-09-25).
> This document turns "the lane works end-to-end" into a concrete, falsifiable,
> already-computable **process** metric, and specifies what a real prospective
> study would need to test whether that process actually helps patients. It
> does not itself constitute evidence of benefit.

## Why this document exists

`governance/MATURITY_REGISTRY.yaml` (`workflow_id: longitudinal.lab_to_trajectory`)
and `governance/RND_BACKLOG.yaml` (`rnd.lab_longitudinal_vertical_slice`) both list
`measurable_outcome` as required evidence before this lane can move past
engineering-correctness maturity. CLAUDE.md's 2026-09-25 "Maturation phase
directive" is explicit: the lane must reach "a measurable outcome definition"
before further widening, and "technically works", "clinically reviewed" and
"clinically validated" must be reported as separate, honestly labeled states.

This document is the measurable-outcome definition plus the protocol design
that a future prospective clinician validation would run against. The
computation itself already ships in `src/lib/hasilTerukurLab.ts`
(`VERSI_DEFINISI = 'lab-outcome-v1'`), gated by `scripts/uji/hasil-terukur-lab.mts`
and surfaced as one line in `src/components/UbinLab.tsx` when the patient has
enough data for it to be non-trivial.

## What already exists in this lane (technically works, not clinically validated)

- patient-entered lab values with per-report reference ranges (`src/lib/lab.ts`,
  `server/src/labLog.ts`);
- server persistence with last-write-wins + 409 conflict handling
  (`server/uji/labLog.uji.ts`);
- FHIR R4 export with verified LOINC/UCUM only, explicit "copied by patient, not
  received from the lab" provenance tagging (`server/src/labFhir.ts`,
  `server/uji/labFhir.uji.ts`);
- time-limited, revocable patient→clinician read consent, with server-side
  eligibility checks and audit (`izinBerlaku`, `server/src/labFhir.ts`);
- clinician-authored reviews (`TinjauanLab`: test, review timestamp, optional
  note, optional recheck-by date), written only under an active consent grant;
- baseline/trend and PhenoAge/AgeGap trajectory projection into the canonical
  longitudinal state (`src/lib/labLongitudinalBridge.ts`,
  `src/lib/panaceaLongitudinalState.ts`);
- a clinician view built from the same server-persisted sources as the patient
  view (`src/lib/statusPasienDokter.ts`).

None of this is clinical-outcome evidence. It is the substrate the process
metric below is computed from, and nothing more.

## The metric: `lab-outcome-v1`

Source of truth: `src/lib/hasilTerukurLab.ts`, function `hitungHasilTerukur`.
This section documents the same definition in English so it can be reviewed
without reading TypeScript; the code is authoritative if the two ever diverge.

**Class of measure: process, not clinical outcome.** These three numbers answer
*"does the result → review → recheck loop actually close?"*, never *"did the
patient get healthier?"*. A clinical outcome measure (e.g. change in HbA1c,
time to guideline-concordant therapy adjustment) needs its own prospective
protocol and is explicitly out of scope here.

### 1. Review coverage (`cakupanTinjauan`)

```
review coverage =
    out-of-range results reviewed by a clinician for that same test
      within REVIEW_WINDOW_DAYS (14) of the result's recorded collection date
  / out-of-range results whose 14-day window has already elapsed
```

- "out of range" uses the reference range **printed on that specific lab
  report** when the patient entered one (`rujukanBawah`/`rujukanAtas` on the
  `ButirLab`); it falls back to the app's general reference range only when no
  per-report range was entered (`rentangUntuk()` in `src/lib/lab.ts`).
- A review only counts if its timestamp is **on or after** the result's
  collection date (a review dated before the blood draw cannot be the review
  of that draw — this is the one case the shipped test asserts explicitly
  as a guard against a backwards-counting bug).
- A result whose 14-day window has not yet elapsed is excluded from both
  numerator and denominator (`cocok.length === 0` and the elapsed check both
  fail) — it is *pending*, not *missed*, and must not silently lower coverage.
- **`REVIEW_WINDOW_DAYS = 14`** is a product default, not a clinically
  validated timeliness threshold. It is versioned (`lab-outcome-v1`) precisely
  so it can be revised under a `lab-outcome-v2` without silently changing what
  a previously reported number meant.

### 2. Median days to review (`medianHariKeTinjauan`)

```
median(review_date − collection_date) over all results counted as
reviewed in measure 1
```

Reported as `null` when no result has been reviewed within the window (empty
sample — a median of zero results is not zero).

### 3. Recheck adherence (`kepatuhanCekUlang`)

```
recheck adherence =
    reviews with a clinician-set recheck-by date that has already passed,
      AND a new result of that same test exists after the review date and
      on-or-before the recheck-by date
  / all reviews with a recheck-by date that has already passed
```

Reviews whose recheck-by date has not yet arrived are excluded from both
numerator and denominator — the deadline has not failed yet, so it cannot
count as adherence or non-adherence.

### Zero-denominator rule (all three measures)

```
ratio = denominator > 0 ? numerator / denominator : null
```

A patient/clinician pair with no out-of-range results, or no elapsed
recheck deadlines, gets `null`, never `0%` and never `100%`. `UbinLab.tsx`
only renders the line when at least one denominator is `> 0`, so the UI never
implies a rate where there is no underlying event.

## Data provenance and honest limitations

- **Collection date is patient-reported**, copied from a paper/PDF lab report
  into the app (`tanggal` on `ButirLab`). It is not independently verified
  against the source lab system. A patient who mis-keys a date changes the
  computed measure; there is no ground truth to detect this from inside the
  app today (`known_gaps: direct_lab_system_integration`).
- **Review timestamp is server-authoritative**: `buatTinjauan()` in
  `server/src/labFhir.ts` stamps `ditinjau` from the server clock at write
  time, not from clinician-entered text, so this half of the interval is not
  self-reported.
- **Recheck-by date is clinician-set**, optional, and unvalidated against any
  guideline — it reflects clinical judgment, not an app-derived
  recommendation.
- The metric is computed **per patient/clinician pair** from the same data the
  patient and clinician can already see (`hitungHasilTerukur` takes one
  patient's lab log and one clinician's reviews). A cohort-level or
  population-level rollup would require iterating this per shared patient
  under an authenticated clinician session and summing numerators/denominators
  across pairs; that aggregation does not exist yet and is not needed for a
  single-patient prospective study design (see below).
- A closed loop (review happened, recheck happened) is evidence the *process*
  worked. It is not evidence of a *good clinical decision*, of *correct
  interpretation*, or of *improved health*. Those require a different,
  clinically adjudicated study design.

## Prospective clinician validation protocol (design only — not run)

This section specifies what would need to happen for `lab-outcome-v1` to
become validated evidence rather than a computable definition. Nothing below
has been executed. No IRB/ethics review has been sought. No clinician
investigator has been identified or has agreed to run this. No participants
have been enrolled.

### Objective

Estimate, in a real patient/clinician population using Panacea's lab-share and
review pathway, the observed values of the three `lab-outcome-v1` measures,
and determine whether they meet a pre-specified, clinically defensible bar for
closing the abnormal-result follow-up loop.

### Design

Prospective, single-arm, observational cohort of patients enrolled through
normal use of the existing lab-log-and-share feature. This is a process/
feasibility study, not a therapeutic intervention trial — no treatment is
being tested, so equipoise/randomization concerns differ from a drug or device
RCT. A randomized comparator (Panacea-assisted review vs. usual care without
it) is a reasonable **next** study once single-arm feasibility data exist, but
building the comparator arm (a second, non-Panacea follow-up pathway to
measure against) is outside what this repository can define unilaterally and
is left as future scope.

### Population

- **Inclusion**: adult patients who (a) enter at least one lab result with a
  value outside the applicable reference range during the enrollment window,
  and (b) grant read access to a verified clinician who accepts the grant.
- **Exclusion**: patients whose only lab entries are within reference range
  (they contribute no denominator events to measure 1 or 3); patients who
  revoke clinician access before the 14-day review window or the recheck-by
  date elapses (their in-flight events are censored, not counted as failures,
  matching the app's own "pending, not missed" rule above).
- **Clinicians**: must hold the app's verified-clinician role
  (`izinBerlaku` requires an active, non-revoked, non-expired grant plus a
  verified role) and must consent to being observed as part of the study.

### Primary endpoint

Review coverage (`cakupanTinjauan.nilai`) at study close, computed exactly as
defined above, over all denominator-eligible out-of-range results accrued
during the enrollment + follow-up window.

### Secondary endpoints

- median days to review (`medianHariKeTinjauan`);
- recheck adherence (`kepatuhanCekUlang.nilai`);
- proportion of enrolled patient/clinician pairs with at least one
  denominator-eligible event (feasibility of the metric itself — a lane can be
  "technically working" yet too low-volume to produce a meaningful rate).

**Explicitly not a primary or secondary endpoint in this protocol**: any
clinical outcome (lab value normalization, diagnosis change, medication
change, hospitalization, mortality). Those need a separate protocol with
clinical adjudication and are not derivable from `lab-outcome-v1` alone.

### Minimum sample size reasoning

This is a proportion-estimation study, not a hypothesis test against a
literature benchmark (no verified benchmark for this exact process, in this
exact tool, has been sourced for this document — see Academic Accuracy Gate:
do not cite a number that was not verified). The standard normal-approximation
sample size formula for estimating a single proportion to a target
confidence-interval half-width is:

```
n = z^2 * p*(1-p) / e^2
```

Using the conservative `p = 0.5` (maximizes required `n` when the true rate is
unknown), `z = 1.96` (95% CI) and a target half-width `e = 0.10`:

```
n ≈ 1.96^2 * 0.5 * 0.5 / 0.10^2 ≈ 96
```

So the study needs roughly **100 denominator-eligible out-of-range results**
(measure 1's denominator, accrued across all enrolled patients) to estimate
review coverage to within about ±10 percentage points at 95% confidence. A
tighter half-width (e.g. `e = 0.05`) needs roughly 4x that, ≈384 events. The
actual target `n` and acceptable `e` should be set by the investigator at
protocol finalization, informed by expected event volume — this document only
supplies the formula and a worked example, not a committed target.

### Duration

Duration is not fixed here because it depends on real enrollment and
out-of-range event rates that are not yet known from production use. It
should be set as:

```
duration such that cumulative denominator-eligible events >= target n
```

using observed weekly out-of-range-result volume once the feature has real
usage data, plus the 14-day review window and the longest recheck-by horizon
in use (up to the app's 2-year cap on recheck dates,
`server/src/labFhir.ts`) as a floor on how long follow-through can take to
resolve into the recheck-adherence denominator.

### Who would run it

Not yet identified. This requires, at minimum: a licensed clinician
investigator willing to take responsibility for the protocol and participant
safety; an appropriate ethics/IRB review given real patient data are
involved; and a data-handling agreement consistent with the app's existing
consent/audit boundaries (`izinBerlaku`, revoke-stops-access). None of these
exist today. Recording this gap honestly is the point — it is listed as
`prospective_clinician_validation` in `known_gaps` for
`longitudinal.lab_to_trajectory` and stays there until it is genuinely done.

### What "success" means numerically

Deferred to the investigator at protocol finalization, not fixed by this
document, because a clinically defensible bar for "acceptable review
coverage within 14 days" should come from the literature on abnormal
ambulatory test-result follow-up (a real, separately sourced literature
review — not reproduced here) or from the clinic's own pre-Panacea baseline,
not from an engineering guess. What this document commits to is the
**mechanism** for defining success once a bar is chosen:

```
success  ⇔  observed review-coverage rate's 95% CI does not fall below the
             pre-specified bar (or, if a baseline comparator exists, the
             observed rate exceeds the baseline rate with statistical
             significance at a pre-specified alpha)
```

Any number placed into "the bar" before that literature/baseline work is done
would be a fabricated threshold, which the Academic Accuracy Gate this
repository enforces does not permit.

## What this document does and does not close

**Closes**: the `measurable_outcome` evidence item for
`rnd.lab_longitudinal_vertical_slice` and `longitudinal.lab_to_trajectory` —
there is now a versioned, tested, code-computable, falsifiable process metric
grounded only in data the system already persists.

**Does not close**: `prospective_clinician_validation`. Running the study
above is a human/clinical action (investigator, IRB, participants, time) that
no amount of additional code can substitute for. Until it is genuinely run,
`clinical_validation: none` in `governance/MATURITY_REGISTRY.yaml` remains
accurate and must not be changed.
