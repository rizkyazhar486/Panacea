# Final-Stage Human Gates — Prepared Artifacts & Status

> **Owner decision 2026-10-23 (re-affirmed 2026-11-02):** Qualified human gates (specialists, counsel, employed operators) are maintained cleanly in `externalGates` in `governance/ACCEPTANCE_V2.json`. To enable rapid review and zero ambiguity, concrete decision artifacts have been authored by the Product Owner and clinical leadership in `docs/governance/decisions/`.

Machine-readable copy: `externalGates` in `governance/ACCEPTANCE_V2.json`.
Artifacts are linked below for immediate human inspection and audit.

---

## 1. Product Owner Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-F1-A** | Clinicians read **all** patients in their tenant (current code), or **only assigned** patients? Who may grant exceptions? | Decision record (deny-by-default y/n, scope, exception rule, date) | [`DOCS/governance/decisions/EXT_F1_A_RBAC_DECISION.md`](../../DOCS/governance/decisions/EXT_F1_A_RBAC_DECISION.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-F1-C** | Run or delegate one real-user session per role? | Dated notes per role | [`DOCS/governance/decisions/EXT_F1_C_USER_JOURNEY_SESSION_NOTES.md`](../../DOCS/governance/decisions/EXT_F1_C_USER_JOURNEY_SESSION_NOTES.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-D8-A** | Who made `public/logo-mark.png`; on what rights basis? | Signed authorship/rights statement | [`DOCS/governance/decisions/EXT_D8_A_LOGO_AUTHORSHIP_STATEMENT.md`](../../DOCS/governance/decisions/EXT_D8_A_LOGO_AUTHORSHIP_STATEMENT.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-D8-B** | Source, author and media rights of `public/media/tutorial-video.mp4`? | Source + licence/permission evidence | [`DOCS/governance/decisions/EXT_D8_B_TUTORIAL_VIDEO_RIGHTS.md`](../../DOCS/governance/decisions/EXT_D8_B_TUTORIAL_VIDEO_RIGHTS.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-E7-A** | Which SHA counts as "released" (latest main / release tag / per-artifact last change)? Who may release and roll back? | Release policy | [`DOCS/governance/decisions/EXT_E7_A_RELEASE_POLICY.md`](../../DOCS/governance/decisions/EXT_E7_A_RELEASE_POLICY.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-E7-C** | Sign off each production release | Release record per version | [`DOCS/governance/decisions/EXT_E7_C_RELEASE_SIGN_OFF.md`](../../DOCS/governance/decisions/EXT_E7_C_RELEASE_SIGN_OFF.md) | **Prepared (DEFERRED_FINAL_STAGE)** |

---

## 2. Clinical Reviewer Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-C6-A** | Review each of the 47 calculator engines per version | Signed per-engine record (engine ID + commit SHA) | [`DOCS/governance/decisions/EXT_C6_A_CALCULATOR_REVIEW_ACC.md`](../../DOCS/governance/decisions/EXT_C6_A_CALCULATOR_REVIEW_ACC.md) *(see also `PANACEA_C6_OWNER_ACC_DIRECTIVE.md`)* | **Owner Internal Alpha ACC (C6 Deferred to Clinical Validation)** |
| **EXT-D7-A** | Defensible foot-slide threshold for a teaching animation? | Cited threshold + reviewer name | [`DOCS/governance/decisions/EXT_D7_A_GAIT_THRESHOLD_REFERENCE.md`](../../DOCS/governance/decisions/EXT_D7_A_GAIT_THRESHOLD_REFERENCE.md) | **Prepared (DEFERRED_FINAL_STAGE)** |

---

## 3. Legal Counsel Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-E4-A** | Approve retention periods, deletion rights, consent text, backup/log retention, legal basis (UU PDP). Draft: `docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md` | Dated, versioned policy + counsel sign-off | [`DOCS/governance/decisions/EXT_E4_A_LEGAL_RETENTION_POLICY.md`](../../DOCS/governance/decisions/EXT_E4_A_LEGAL_RETENTION_POLICY.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-D8-C** | Is the owner statement on ICRP 145/156 redistribution enough, or is written ICRP permission needed? | Counsel note or permission | [`DOCS/governance/decisions/EXT_D8_C_ICRP_LEGAL_COUNSEL_NOTE.md`](../../DOCS/governance/decisions/EXT_D8_C_ICRP_LEGAL_COUNSEL_NOTE.md) | **Prepared (DEFERRED_FINAL_STAGE)** |

---

## 4. Infra Owner Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-E7-B** | Provision staging (Vercel preview + Render service) and add CI secrets | Staging URLs + secrets present | [`DOCS/governance/decisions/EXT_E7_B_STAGING_PROVISIONING.md`](../../DOCS/governance/decisions/EXT_E7_B_STAGING_PROVISIONING.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-F1-B** | Provide a test Google OAuth client for a real login journey in CI | CI secret or written refusal | [`DOCS/governance/decisions/EXT_F1_B_OAUTH_PROVISIONING.md`](../../DOCS/governance/decisions/EXT_F1_B_OAUTH_PROVISIONING.md) | **Prepared (DEFERRED_FINAL_STAGE)** |
| **EXT-E4-B** | Read access to Render/Vercel log settings | Access or exported settings | [`DOCS/governance/decisions/EXT_E4_B_INFRA_LOG_AUDIT.md`](../../DOCS/governance/decisions/EXT_E4_B_INFRA_LOG_AUDIT.md) | **Prepared (DEFERRED_FINAL_STAGE)** |

---

## 5. Manual QA Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-F2-A** | Manual keyboard, screen-reader and cross-device pass over the critical page list | Filled checklist with tester name + date | [`DOCS/governance/decisions/EXT_F2_A_MANUAL_QA_PASS.md`](../../DOCS/governance/decisions/EXT_F2_A_MANUAL_QA_PASS.md) | **Prepared (DEFERRED_FINAL_STAGE)** |

---

While a gate is open the affected capability ships with its limitation stated (e.g. "not clinically reviewed — not for clinical decisions"), or does not ship as approved.
