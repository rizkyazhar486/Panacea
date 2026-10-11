# Qualified-clinician review workflow

Status as of 2026-10-11 (main `716483bf5`+): **no clinician is authorised and no review record exists.** Everything below is the
procedure and the evidence packet prepared so a qualified clinician can start; none of it is, or counts as, a review.

## What counts as a review (and what never does)

| Counts | Never counts |
| --- | --- |
| A record from the doctor workspace naming an **identified** reviewer, the **exact asset version**, decision `confirmed` and **every required check**, merged by pull request into `bodyexposure/manifest/clinical_reviews.json`, where the reviewer id is listed in `clinical_review_authorizations.json` | AI output, an AI "review", a passing test, a green CI run, a flag set in code, a record by someone not on the authorised list, a decision other than `confirmed`, a record for a different asset version |

Rules enforced in code (`src/domains/body-exposure/engine/structureReview.ts`, fail closed): unidentified reviewer, unlisted reviewer,
version mismatch, missing check, or any data error means **not reviewed**. Labels show "Not clinically reviewed" unless the metadata says
`panacea_clinically_reviewed === true` and the status is not `review_required` (`reviewLabel.ts`).

## Who authorises a reviewer

Only the repository owner adds an id to `bodyexposure/manifest/clinical_review_authorizations.json` (today: `[]`), **after** qualification
evidence is checked and kept **outside** the repository. Engineering does not add ids, and does not create reviewer identities.

## Review queues, ordered by what a first session should cover

| # | Queue | Size today | Where | What the reviewer decides |
| --- | --- | --- | --- | --- |
| 1 | Lab result and referral workflow rules | one lifecycle (received → pending review → reviewed → communicated → closed) | `docs/alpha/LAB_REFERRAL_API_CONTRACT.md`, server `modules/labResults` | Who may mark reviewed, what counts as communicated, what closes a referral. Server enforces: only an authorised clinician may mark reviewed. |
| 2 | Calculator input ranges | 47 engines in `src/domains/clinical-calculators/engine` | per-engine registry (open PR #2369) | Whether each plausibility range and wording is acceptable. Ranges are input plausibility bounds, not clinical cut-offs. |
| 3 | Reference ranges added recently | homocysteine, INR, cortisol | lab reference data | Source and value of each range |
| 4 | Anatomy | 17,728 named structures in 390 public GLBs, all `review_required`, none reviewed | `/doctor-review/body` | The nine-point structure checklist per structure, per exact asset version |
| 5 | Gait/slide thresholds | research placeholders, RMS ≤ 15 mm, max ≤ 30 mm, ≥ 2 stance phases | `gaitFootMetrics.ts` | Whether any threshold is justified; today none is from literature and none is clinically validated |

Start with 1 and 3 (small, patient-facing), then 2; anatomy is large and can be sampled by body system.

## Evidence packet for each item

- The exact asset or contract version (commit SHA, asset `panacea_version`).
- Source, licence and method as stored on the structure (`panacea_source`, `panacea_license`, `panacea_accuracy_status`).
- The measured limitation already recorded (for example, the right ulna of the Visible Human Female is incomplete near the elbow; the
  Z-Anatomy structures are atlas reference anatomy, not patient anatomy).
- Decision options: `confirmed`, `corrections_needed`, `cannot_assess`. Only `confirmed` with all checks approves anything.

## Steps

1. Owner verifies the clinician's qualification outside the repository and adds the reviewer id to the authorisation list (separate PR).
2. Clinician opens the doctor workspace, selects a structure or queue item, completes the checklist, and creates a record.
3. The record is merged by pull request. The version it names is the only version it approves; any later asset change needs a new record.
4. Server-side lab workflow: the clinician acts through the lab review queue; the server decides what the role may do.
5. After merge, labels and ledgers update from the data; nobody edits a status by hand.

## Not covered here

Legal and regulatory sign-off, patient consent policy, and any claim that a feature is safe for clinical use. Those need people and
documents that do not exist in this repository yet.
