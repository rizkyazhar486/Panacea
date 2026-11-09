# Panaceamed Horizon 2027 — the Person-Owned Longitudinal Care OS

**Status:** owner-approved concept, 2026-11-09. Subordinate to the Constitution, the 99-axiom annex, the One OS doctrine and every safety rule in `CLAUDE.md` §8: it sets direction and 2026 scope, it never relaxes a gate.
**Source:** the two Strategic Masterplan PDFs (algorithmic masterplan; Next-Gen Rev 2.0) plus the repository's current state.
**Nothing here is a clinical claim, a regulatory clearance, or a promise of outcomes.**

## 1. Owner decisions recorded (2026-11-09)

1. **Replace everything, drop nothing, improve everything.** Every element of the two PDFs is kept in an improved form (section 3). Where an element could harm people, the improvement is the design rule that makes it safe; the ambition stays.
2. **Scope is the whole human body as one system**, not a single clinical domain.
3. **Datasets must be lawful, with no extra human re-verification of the dataset.** The only human verification allowed anywhere in the product is by a user who holds an **STR** (Surat Tanda Registrasi); patient-level signing additionally needs the signer's **SIP** (Surat Izin Praktik).

## 2. The concept

One person's whole health story lives **once, is understood once, and travels with them**: daily life → clinic → referral lab → ward → home. The person holds it. Clinicians, labs and devices connect through open standards, with consent that can be revoked. Every value shows its source, time, unit and uncertainty. The 4D body is the explanation surface (see, ask, zoom, why, what if, act). Power comes from continuity and earned preference, not from a cage.

The whole body is modelled as **one coupled system**: the shared longitudinal state spans every organ system, each with its own truth lanes (measured, derived, simulated, reference, unknown). Depth differs by system; a missing layer is shown as `VERTICAL GAP — NOT YET MODELED`, never hidden.

## 3. Every PDF element, improved (nothing dropped)

| PDF element | Improved form | Design rule that makes it hold |
|---|---|---|
| Own the highest-resolution body model | **Whole-body coupled state with a visible gap registry** | One state, many projections; unknown stays visibly unknown. |
| Switching costs "catastrophic" / lock-in | **Gravity without a cage** | Full export always works; preference is earned by being the best continuity, not by trapping. |
| Practising medicine without it is "malpractice" | **Standard-of-care aspiration** | Clinicians choose to rely on checks (identity, provenance, interaction) once measured to reduce errors; never a coercive claim. |
| Autonomous actuation of food, water, HVAC, lighting, sleep surfaces | **Person-approved assistive loops** | Automation runs only inside an envelope the person sets (limits, schedule, off switch, reversible, logged); non-medical daily needs first. |
| Transdermal / compounded micro-dosing | **Clinician-ordered prophylactic protocols (research track)** | Anything that delivers a drug or alters physiology stays clinician-ordered and inside the device/drug regulatory path. |
| Dynamic real-time pricing of life insurance from biological age | **Voluntary Verified Health Proof** | A person may share a minimal-disclosure verified proof to earn benefits; participation can only help, non-participation is never penalised, no denial or rationing by profitability. |
| Insurers/employers mandate kinetic telemetry | **Opt-in occupational safety programs** | Worker-held data; the employer sees only the flags the worker authorises; no mandate. |
| Population-scale re-routing of food, pharma, energy | **Aggregate planner advisory** | Anonymised, thresholded aggregates advise human planners; humans decide; no actuation. |
| Sovereign data partnerships | **Data-commons agreements** | National partners agree to the same consent, portability and audit rules; person-level consent is preserved. |
| Own standards and benchmarks | **Open standards and benchmarks** | Published schemas, fixtures and evaluations anyone can implement and challenge. |
| Closed loop: telemetry → prediction → action → outcome → update | **Consent-per-loop learning with a Reality Gap record** | Contribution is opt-in, auditable, withdrawable; predictions versus outcomes are kept even when poor. |
| Talent density and venture studio | **Kept** | No exclusive data deals; consent decides, not the studio. |
| Kill criterion (beat best unimodal models or narrow the slice) | **Kept and made executable** | Pre-registered, measured on held-out data, published either way. |
| "Clinical care is under 15% of longevity variance" | **Hypothesis until cited** | Not repeated as fact without a source. |
| "Pre-symptomatic alerts 48–168 h early" | **Pre-registered hypothesis** | Not a claim; tested before it is stated. |

## 4. Datasets and human verification (owner rule)

**Datasets.** A dataset is admitted only with a machine-checked provenance record: source, licence or consent scope, jurisdiction, retrieval date, SHA-256 of the bytes read, intended-use limits, and the data steward's declaration. A missing or inconsistent record fails closed. There is **no further human re-verification step for the dataset**, as decided. Limit to state plainly: the check proves the record is complete and consistent; it does not certify the legal claim, which stays the steward's accountable declaration.

**Human verification.** Only a user holding an **STR** may verify clinical content (labels, reviews, signing).
- The STR is recorded as a **claim** until an authoritative registry check exists; the interface never says "verified" for an unchecked STR. No registry adapter is assumed to exist today.
- A review stores reviewer identity, STR (as sensitive data), scope, timestamp and a hash of the reviewed content; it is append-only and AI cannot write it.
- Content without an STR-holder's signed review stays a draft, and `clinically_reviewed` stays false.
- Other users contribute their own data and consent; they cannot verify clinical content.
- **SIP is mandatory for patient-level signing** (owner, 2026-11-09). STR and SIP are each entered **once**, at the reviewer's first signing, and reused for every later signature; nobody is asked twice.
- **Never a burden for anyone else.** Only a person who chooses to verify or sign clinical content ever sees STR/SIP fields. Patients, caregivers, community health workers and every other user are never asked for them and lose nothing without them.
- SIP, like STR, is a claim until an authoritative registry check exists, and is stored as sensitive data. If a number is mistyped, correcting it is one edit, not a new onboarding.

## 5. Five capabilities (whole-body)

1. **Care Passport.** One record, many sources, full export, revocation that stops access. *2026:* export/import round trip rebuilds the same record; readable access log. *Not claimed:* national integration.
2. **Drift-aware baselines.** A person's own baseline across systems; leaving it says "worth asking a clinician" with numbers, uncertainty and gaps. *2026:* method, pre-registered protocol, retrospective test, kill criterion. *Not claimed:* diagnosis, prediction horizons, outcome effect.
3. **Explainable 4D body.** Shows measured, derived, simulated and unknown lanes for every system covered, with an isolated what-if branch. *2026:* reads the one longitudinal state. *Not claimed:* patient-specific anatomy, operative targeting.
4. **One episode, closed end to end.** Visit, order, remote or offline specimen/referral, result returns to the same record, follow-up, coverage state. Weak phone, weak connection, the person's language. *2026:* two cross-system fixtures in staging with synthetic data. *Not claimed:* real-world completion or reimbursement rates.
5. **Learning that respects people.** Outcome feedback with consent per loop and a Reality Gap record. *2026:* ledger structure, consent flow, prediction-versus-reality report on a legitimately available set. *Not claimed:* population accuracy.

## 6. What can be true before 2027 (7 weeks from 2026-11-09)

| Reachable by 2026-12-31 | Not reachable, not promised |
|---|---|
| Tests that fail by name for portability, consent/revocation, provenance fail-closed, STR-gated review, one episode in staging | Regulatory clearance (SaMD or equivalent) |
| Whole-body state schema with per-system truth lanes and a gap registry | Equal validated depth in every organ system |
| Pre-registered drift protocol and kill criterion | 10–25 health systems, sovereign partnerships, procurement mandates |
| Dataset provenance gate | A clinically validated, interactive 4D v1.0 |
| Evidence ledger: measured, derived, simulated, unknown, not claimed | Outcome, speed or cost claims without comparative measurement |

## 7. Measures

Round-trip fidelity (100% on the golden set) · result return time with a named baseline · provenance completeness (fails closed) · calibration error published including bad periods · reach (low-end devices, weak connections, language) · consent integrity (revocations that actually stopped access, by test) · STR-gated review coverage.

## 8. Hard guardrails (unchanged)

No autonomous diagnosis, dosing, ordering or physiological actuation. AI output is a draft until a named STR-holding clinician signs. Permissioned observability only. Health data is never used to price, deny or ration care by profitability. Measured, derived, simulated, reference and unknown states stay distinct; empty is never zero. Unverified numbers are labelled. No "first", "Nobel-level" or "dominance" claims without the search-evidence protocol.

## 9. Execution

Seven slices, one small PR each, on the board section "Horizon 2027" in `docs/governance/TASK_BOARD.md`. Work stays on the current wedge (Longitudinal Clinical Encounter Orchestrator). Body Exposure UI work waits for the open consolidation PR and the CSS budget.
