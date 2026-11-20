# Orchestrator Directive — Claude × Gemini (CLI + Chat) × Hydrogen × Argon

Issued 2026-11-16 by the Claude orchestrator at the Product Owner's request. Audience: Gemini CLI, Gemini chat,
Hydrogen, Argon, and any other agent that works on Panaceamed.id. Read this file in full before material work.

**Ringkasan (ID).** Dokumen ini mengatur kerja sama Claude, Gemini CLI/chat, Hydrogen dan Argon agar tidak saling
bertabrakan, menetapkan kapan Panaceamed layak dirilis ke publik (saat ini **belum**), apa yang harus dikerjakan
berurutan, dan bagaimana menyederhanakan alur kerja, UI/UX dan perjalanan pengguna. Ambisi setara Alipay/WeChat/Visa
diperlakukan sebagai arah jangka panjang yang dicapai lewat gerbang bukti bertahap, bukan sebagai klaim.

---

## 0. Authority and precedence

Higher beats lower. A lower document never overrides a higher one.

1. Latest explicit instruction from the Product Owner (Rizky) in chat.
2. Safety, security, privacy, provenance limits in `CLAUDE.md` §8 and `governance/doctrine/PANACEA_CONSTITUTION.md`.
3. `CLAUDE.md` (git flow, architecture, tests) → `AGENTS.md` → `GEMINI.md`.
4. `docs/governance/` v2 (task selection, acceptance, verification, stabilization, lanes).
5. **This directive** (coordination, release readiness, sequencing). It adds rules; it removes none.
6. Older agent recommendations and checkpoint notes.

If this file conflicts with 1–4, 1–4 win and the conflict is fixed in a PR to this file.

## 1. What the ambition means, honestly

North star: one simple, trusted, longitudinal operating system for human basic needs, starting with healthcare, that
people and institutions *choose* to rely on daily, comparable in reach to the largest payment and super-app networks.

Rules that keep this honest:

- Scale is **earned by trust and measured adoption**. No agent writes, ships or implies "dominates a country",
  "replaces X", "clinically validated", "licensed payment provider" or "unbeatable" without evidence in the repo.
- "Surveillance" in the owner's shorthand means **permissioned observability**: purpose-bound consent, least
  privilege, access lineage, revocation, visible blind spots. Never covert monitoring, never silent tracking.
- "Control" means **the person controls their own data and actions**; institutions get scoped, audited access.
- Healthcare comes first. Payments, identity and other life domains are added by the ladder in §8, never in parallel
  breadth.
- Regulated domains (payments, health data, medical devices, claims) need qualified legal/regulatory review before
  public operation. Agents prepare research and drafts; they never declare compliance or licensure.

## 2. Ground truth today (re-verify before relying on it)

Evidence from this session (2026-11-16) and repo files. Re-run the commands before quoting a number.

| Fact | Evidence |
|---|---|
| Engineering acceptance v2: 32/32 PASS; 14 human gates deferred, 0 decided | `node scripts/qa/acceptance-v2.mjs` |
| Legacy Alpha ledger: 38/44 verified, 6 REPORTED, C6 deferred | `docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md` (baseline `4b2009a1f`) |
| Zero calculators clinically reviewed; product is non-clinical | `docs/governance/PROJECT_REALITY_MAP.md` §2 |
| No staging environment; real OAuth untested in CI | `docs/governance/PROJECT_REALITY_MAP.md` §2, EXT-E7-B, EXT-F1-B |
| Wearable/device support mostly contract/mocked | `docs/governance/PROJECT_REALITY_MAP.md` §2 |
| Backend free tier was suspended for bandwidth on 2026-10-29 | `docs/governance/TASK_BOARD.md` T-OPS-BW-01 |
| `https://panaceamed.id` was served by `vite preview` on port 4399 plus a `cloudflared` tunnel on one personal laptop; the tunnel being stopped produced Cloudflare 502/1033 | `~/.cloudflared/config.yml` ingress, `ps`, curl, browser (2026-11-16) |
| `server/data.json` holds only 3 seeded test users; no real registered account is stored server-side | read-only inspection (2026-11-16) |
| The owner's real account data (profile, workouts, vitals) exists only in that browser's `localStorage` | in-browser key listing (2026-11-16) |

Consequence: the product works and is well tested in engineering terms, but real-user data durability, hosting,
legal/privacy approval and clinical review are **not** in place. Those are the release blockers (§6).

## 3. Roles and cooperation protocol

### 3.1 Lanes

| Agent | Role | May do | Never does |
|---|---|---|---|
| **Claude** | Orchestrator; Integrator-advisory; frontend/UX, browser E2E, Body Exposure lane | Sets order of work; reviews other lanes; the **only** agent allowed to take over another agent's branch/PR (owner rule 2026-10-23, `JOB_DESCRIPTIONS.md`); merges own PRs after exact-head CI green when the owner has authorised it | Merge over red; approve own PR; invent approvals |
| **Gemini CLI** | Repo-writing lane (`any-ai` rows): backend/tests/docs/research tasks it claims | Own branches and PRs; claim rows; propose rows | Edit another agent's branch; push to `main`; weaken tests |
| **Gemini chat** | Advisory/research/review. Cannot touch the repo. | Draft specs, critiques, test matrices, copy, regulatory research summaries; return them as text for a CLI agent or the owner to commit | Claim anything was run, merged or deployed |
| **Argon** | Existing lane per `JOB_DESCRIPTIONS.md` (CI/ENG-CI work, WP series) | Own branches; claim rows | Edit others' branches |
| **Hydrogen** | **Not defined anywhere in the repo.** Until the owner states its scope in writing it is treated as an `any-ai` lane with the same limits as Gemini CLI | Claim READY rows not held by others | Anything beyond `any-ai` |

Open question for the owner: what is Hydrogen's scope and model? (Do not guess in PRs.)

### 3.2 The one loop

```
read TASK_BOARD → claim ONE row (write your name + branch) → re-check main + open PRs for the criterion
→ reproduce at exact main SHA → smallest change + failing-before/passing-after test
→ local gates → PR (docs/governance rules) → exact-head CI → cross-lane review → merge by authorised merger
→ update the row + criterion → next row
```

### 3.3 Hard coordination rules (conflict-proofing)

1. **Claim before work.** Parallel agents race; re-check `git fetch`, `gh pr list`, and the TASK_BOARD row right
   before coding. If someone claimed it, take the next row.
2. **One file, one open PR.** Never edit a file another open PR edits. Shared hot files (ClinicalHub,
   UnifiedBodyWorkspace, BodyExposure, EMR, ForYouHub, `store.tsx`) need a stated plan in the row first.
3. **Own branches only.** Naming `<type>/<scope>-<desc>` (CLAUDE.md §5). Direct pushes to `main` are forbidden;
   if one happens (it did on 2026-11-16: `71957cd86`), it is logged on the TASK_BOARD and CI on that SHA becomes
   the next priority.
4. **Red main stops the line.** Only repair work proceeds until required checks are green again.
5. **Author ≠ reviewer.** Gemini CLI work is reviewed by Claude or Argon; Claude work by Gemini CLI or Argon.
   Safety/auth/privacy/clinical paths get an *adversarial* review (try to break it), not a skim.
6. **No test weakening.** Never delete asserts, loosen tolerances, skip tests or lower ratchets to get green.
7. **Rebase, don't force.** Rebase only your own branch; no force-push of shared history.
8. **Reports are short:** SHA, what changed, test/CI result, PR link, the one decision needed (≤120 words).
9. **Chat-agent output is a proposal.** Anything Gemini chat writes enters the repo only through a CLI agent's PR
   and passes the same gates.

### 3.4 Disagreement protocol

1. State the claim and the evidence (file:line, command output, URL) in the PR or row. Rank is not evidence.
2. The reviewer must reproduce the evidence. Unreproducible claims are marked `{unverified}` and do not block.
3. If two agents still disagree, the orchestrator decides using this order: safety > data integrity > evidence >
   reversibility > simplicity > speed. The decision and reason are written in the PR.
4. If the orchestrator is a party or the decision changes scope/risk, the Product Owner decides. Agents keep
   working on unblocked rows meanwhile.

### 3.5 Instability triggers (stop and escalate)

Any of: required CI red on `main`; a change that touches auth/RBAC/consent/audit/clinical-signing without tests;
a PHI or secret in a diff; a deleted or skipped test; an agent editing another agent's branch (non-Claude);
duplicate patient truth store being introduced; a claim of clinical validity or licensure. Action: stop, revert or
isolate on a branch, write one row on the TASK_BOARD, tell the owner.

## 4. Product laws every agent must preserve

- One patient identity and one longitudinal state across daily life, clinic, ward, OR, ICU and follow-up.
- Measured / reference / simulated / derived / unsupported states stay distinct; unknown is shown as unknown.
- AI output is a draft with visible uncertainty (`clinically_reviewed=false`) until an identified clinician signs.
- No autonomous diagnosis, dosing, ordering, emergency decision or device actuation.
- Fail closed on missing identity, provenance, unit, consent or time.
- English-first UI strings; Indonesian and others via locales. Accessibility and 390×844 mobile preserved.
- Dual-projection UI (mobile stacked cards / desktop tables) using `src/shared/adaptive/` primitives.
- Check `docs/product/AUDIT_STATUS_REVAMP_UI.md` before any UI revamp; red-light flows are refused.

## 5. Minimizing work, workflow, UI/UX and journeys

Goal: the user finishes a daily task in the fewest steps, with the system doing the orchestration.

**Principles**

1. One focus and one primary action per screen; answer first, detail behind disclosure.
2. Two-tap rule: every primary feature reachable within two taps of Home.
3. ≤6 primary choices per surface; secondary features grouped, not deleted.
4. The system pre-fills from canonical state (never re-ask known facts); ask only what is missing.
5. Same grammar everywhere: SEE → ASK → ZOOM → WHY → WHAT IF → ACT.
6. Role-shaped, truth-identical: patient, doctor, nurse, lab, admin see different lenses of the same record.
7. Every step has loading, error, empty and retry states; no double-submit; empty is not zero.

**Journeys to reduce first (one at a time, in this order)**

| # | Journey | Today's friction to measure | Target to measure against (baseline first) |
|---|---|---|---|
| J1 | First open → see my own data | sign-in steps, import steps, time to first meaningful screen | taps and seconds, recorded at a SHA |
| J2 | Daily check-in and wearable sync | taps to sync, stale-data visibility | one tap; stale shown as stale |
| J3 | Patient visit → signed record → follow-up | clicks per role, re-entry of known data | no re-entry; one signature step |
| J4 | Lab order → result → referral closure | handoffs, lost-result rate | closure with chain of custody |
| J5 | Access pass (QR/barcode) for identity | steps to present identity | one tap; real, scannable codes (PR #3073) |

Targets are set **after** a baseline measurement. Never publish a speed or ease claim without a comparative
measurement (One OS doctrine).

**Division of work for UX**

- Claude: IA, adaptive components, browser E2E, accessibility audits.
- Gemini CLI/Argon/Hydrogen: backend contracts needed by a journey, tests, data adapters, docs.
- Gemini chat: heuristic reviews, copy variants, test-case matrices, user-interview scripts (as proposals).
- Backend fields are never invented by the UI lane; request an API contract row first.

## 6. When is Panaceamed fit for public release?

### 6.1 Stages

| Stage | Who can use it | Scope | Entry gate (all must hold at one SHA) |
|---|---|---|---|
| **R0 Internal alpha** (now) | Owner/team | Engineering validation | acceptance-v2 PASS; main green |
| **R1 Closed technical preview** | Invited, named testers | Non-clinical wellness/longevity + demo clinic flows with synthetic data | R0 + §6.2 blockers B1–B6 closed |
| **R2 Limited public beta** | Open sign-up with caps | Non-clinical consumer use; no clinical claims | R1 + B7–B10 closed + 14 days stable + support/incident process |
| **R3 Clinical pilot** | One partner clinic, supervised | One governed outpatient episode (Longitudinal Clinical Encounter Orchestrator) | R2 + H3 human gates for that scope: clinical reviewer, counsel, release sign-off, EXT-E7-A/C |
| **R4 General availability** | Public, multi-site | Broader domains, payer adapters | R3 outcome evidence + per-jurisdiction legal clearance |
| **R5 Platform/ecosystem** | Third parties | Open APIs/SDKs, payments/claims rails | licences + security certifications + audited operations |

### 6.2 Blockers (ordered; one at a time)

| ID | Blocker | Why it blocks | Lane | Done when |
|---|---|---|---|---|
| B1 | **Durable server-side accounts and data.** Real account data lives only in browser storage today. | Clearing site data or switching device loses everything | Gemini CLI/Argon (backend), Claude (UI) | Persistent store enabled in a non-laptop environment; opt-in migration from local data with consent; export/import; restart and restore tests |
| B2 | **Hosting off a personal machine.** Production served via laptop tunnel. | One sleep/crash = public outage; no isolation | Infra owner (EXT-E7-B) + AI for workflows | Staging + production on managed hosting; deploy-SHA verification; rollback tested |
| B3 | **Real auth proven.** Google OAuth untested in CI; passkey/authenticator claims need tests. | Account takeover and lock-out risk | Argon/Gemini CLI | Test OAuth client (EXT-F1-B); journey tests for every offered login method |
| B4 | **Privacy and consent policy approved.** Retention/deletion/consent text unsigned. | Legal exposure (UU PDP); users cannot consent meaningfully | Counsel (EXT-E4-A) | Signed versioned policy; harness wired to the store |
| B5 | **Main green for 5 consecutive days** and the 6 REPORTED ledger items closed or re-classified with evidence | Unknown stability | Integrator | Run IDs recorded at one SHA |
| B6 | **Observability and incident process**: health, logs without PHI, alerting, bandwidth/cost guards | Outages unnoticed; earlier quota suspension | Argon/Codex | Dashboards + runbook + drill |
| B7 | Support, abuse, takedown and deletion workflow | Public users need recourse | AI drafts + owner | Operating procedure tested |
| B8 | Asset rights resolved or assets removed (EXT-D8-A/B/C) | Legal risk on logo/video/ICRP data | Owner/counsel | Statements recorded or assets restricted |
| B9 | Performance/accessibility budgets met on real devices (EXT-F2-A manual pass) | Exclusion of users | Claude + manual QA | Checklist filled with name/date |
| B10 | Load and failure testing at the planned beta cap | Surprises at scale | Argon/Gemini CLI | Test report at a SHA |

### 6.3 Verdict today

**Not ready for the general public.** Ready for R0. Closest next step is R1 after B1–B6. Until clinical review and
counsel sign-off exist (H3), the product stays labelled non-clinical and "not for clinical decisions".

### 6.4 What to push now (in order)

1. B2 safety net: keep the tunnel/server alive (owner-run installer) while staging is provisioned.
2. B1: persistence design row (contract first), then implementation slices with restart tests.
3. B5: close remaining REPORTED ledger items; keep main green.
4. B3: auth journey tests; B6: observability.
5. J1/J2 journey baselines and reductions (§5).
6. Prepare (not sign) B4/B8/B9 decision artifacts so the human gates take minutes when a person is available.

## 7. Covering fundamental human needs without sprawl

Order by dependency, not by appeal. A new domain enters only with: a named user, a real problem, a measurable
benefit, reuse of existing primitives, and a validation plan.

| Layer | Needs | Panacea scope | Entry condition |
|---|---|---|---|
| L1 | Identity, consent, record continuity | One patient state, provenance, access pass | Already core; harden (B1–B4) |
| L2 | Health maintenance | Sleep, activity, recovery, nutrition, labs trends, longevity baselines | Wearable adapter proven with fixtures |
| L3 | Care access | Clinic episode, labs, referrals, follow-up | R3 evidence |
| L4 | Mental and social wellbeing | Mental health safety orchestrator, community, coaching | Clinical safety rules reviewed |
| L5 | Environment and safety | Exposure, air, heat, emergency context | Source adapters with provenance |
| L6 | Coverage and payment | Claims state, payer adapters, reimbursement, QR payment | Counsel + licensing + per-jurisdiction adapters |
| L7 | Daily-life services | Marketplace/partners via open APIs | R5 platform gates |

Never copy domains in parallel; finish depth in one layer slice before opening the next.

## 8. The ladder toward super-app / payment-network scale

Each rung needs evidence before the next. Skipping a rung is a defect.

1. **Trust core:** identity, consent, audit, durable data (B1–B4).
2. **One loved daily loop:** J1–J2 used repeatedly by real people (retention measured).
3. **One institution loop:** one clinic episode with measured completion, speed and trust (R3).
4. **Interoperability:** FHIR/DICOM/device fixtures; export/import; a second site.
5. **Network effects:** referral and result return across sites; payer adapters per jurisdiction.
6. **Open platform:** documented APIs/SDK, partner onboarding, sandbox.
7. **Payments/claims rails:** only through licensed partners or licensed entities; QR/NFC acceptance via standards.
8. **Operational excellence:** SLOs, audits, certifications, incident discipline at national scale.

Regulatory/licensing specifics for payments and health data differ by country; counsel confirms them. Agents do not
assert them.

## 9. Execution backlog for the agents (one row at a time)

Add these rows to `docs/governance/TASK_BOARD.md` when claimed. IDs are proposals.

| ID | Task | Lane | Criterion/evidence |
|---|---|---|---|
| T-ORCH-01 | Contract-first design for server-side account and data persistence (schema, consent, migration from local, export) | Gemini CLI or Argon (design) → Claude review | design + negative tests list |
| T-ORCH-02 | Implement persistence slice 1: account + profile with restart/restore tests (file and Mongo modes) | Gemini CLI | HTTP restart suite |
| T-ORCH-03 | Opt-in local-data → server import UI with consent and rollback | Claude | browser E2E 390×844 + 1440×900 |
| T-ORCH-04 | Auth journey tests for each offered login method | Argon | CI evidence |
| T-ORCH-05 | Staging provisioning prep + deploy-SHA verification | Argon | workflow run |
| T-ORCH-06 | Baseline measurements for J1–J5 | Claude | recorded numbers at SHA |
| T-ORCH-07 | Wearable adapter with real-device fixture (one device) | Hydrogen/Gemini CLI | fixture + conformance tests |
| T-ORCH-08 | Observability + incident runbook | Argon | drill record |
| T-ORCH-09 | Prepare decision artifacts for B4/B8/B9 | Gemini chat draft → CLI PR | artifacts in `docs/governance/decisions/` |

## 10. Reporting, metrics, stop rules

- Every report: SHA, change, tests/CI, PR, one decision needed.
- Metrics (definition first, then measurement): time-to-first-value, taps per journey, task completion rate,
  weekly active users, retention, sync freshness, error rate, incident count, data-durability test pass rate,
  deploy lead time. Do not publish a metric without its definition and method.
- Stop rules: §3.5 triggers; any agent that cannot reproduce a claim marks it `{unverified}` and moves on.
- Status words (`PASS`, `VERIFIED`, `DEPLOYED`, `CLINICALLY REVIEWED`) mean exactly what `VERIFICATION_V2.md` says.

## 11. Consolidated prohibitions

No fabricated approvals, citations, reviewers, licences, test results, deployments or user data. No clinical claims.
No secrets, credentials or PHI in code, logs, commits or chat. No covert tracking. No bypass of consent/RBAC/audit.
No weakening of tests, ratchets, academic/biomedical or security gates. No direct push to `main`. No editing another
agent's branch (except Claude). No claim of scale, dominance, compliance or licensure without evidence.

## 12. Gemini bootstrap (use this PDF as the first message)

1. Read `AGENTS.md`, `CLAUDE.md`, `docs/governance/README.md`, `AGENT_ENTRYPOINT.md`, then this file.
2. Declare your lane (CLI/chat/Hydrogen/Argon) and what you can actually run.
3. CLI agents: run `git fetch`, `gh pr list`, `node scripts/qa/acceptance-v2.mjs`; claim one TASK_BOARD row.
4. Chat agents: produce proposals only; label every external or recalled fact `{unverified}`; ask the owner to route
   output to a CLI agent.
5. Return, per task: SHA, change, evidence, PR/branch, blocker or decision needed.
6. If anything in this directive conflicts with a higher authority (§0), stop and report the conflict.
