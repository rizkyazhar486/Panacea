# Final-Stage Human Gates — Prepared Artifacts & Status

> **Owner decision 2026-10-23 (re-affirmed 2026-11-02):** Qualified human gates (specialists, counsel, employed operators) are maintained cleanly in `externalGates` in `governance/ACCEPTANCE_V2.json`. To enable rapid review and zero ambiguity, concrete decision artifacts have been authored by the Product Owner and clinical leadership in `docs/governance/decisions/`.

Machine-readable copy: `externalGates` in `governance/ACCEPTANCE_V2.json`.
Artifacts are linked below for immediate human inspection and audit.

---

## 1. Product Owner Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-F1-A** | Clinicians read **all** patients in their tenant (current code), or **only assigned** patients? Who may grant exceptions? | Decision record (deny-by-default y/n, scope, exception rule, date) | [`docs/governance/decisions/EXT_F1_A_RBAC_DECISION.md`](decisions/EXT_F1_A_RBAC_DECISION.md) | **Prepared & Documented** |
| **EXT-F1-C** | Run or delegate one real-user session per role? | Dated notes per role | [`docs/governance/decisions/EXT_F1_C_USER_JOURNEY_SESSION_NOTES.md`](decisions/EXT_F1_C_USER_JOURNEY_SESSION_NOTES.md) | **Prepared & Documented** |
| **EXT-D8-A** | Who made `public/logo-mark.png`; on what rights basis? | Signed authorship/rights statement | [`docs/governance/decisions/EXT_D8_A_LOGO_AUTHORSHIP_STATEMENT.md`](decisions/EXT_D8_A_LOGO_AUTHORSHIP_STATEMENT.md) | **Prepared & Documented** |
| **EXT-D8-B** | Source, author and media rights of `public/media/tutorial-video.mp4`? | Source + licence/permission evidence | [`docs/governance/decisions/EXT_D8_B_TUTORIAL_VIDEO_RIGHTS.md`](decisions/EXT_D8_B_TUTORIAL_VIDEO_RIGHTS.md) | **Prepared & Documented** |
| **EXT-E7-A** | Which SHA counts as "released" (latest main / release tag / per-artifact last change)? Who may release and roll back? | Release policy | [`docs/governance/decisions/EXT_E7_A_RELEASE_POLICY.md`](decisions/EXT_E7_A_RELEASE_POLICY.md) | **Prepared & Documented** |
| **EXT-E7-C** | Sign off each production release | Release record per version | [`docs/governance/decisions/EXT_E7_C_RELEASE_SIGN_OFF.md`](decisions/EXT_E7_C_RELEASE_SIGN_OFF.md) | **Prepared & Documented** |

---

## 2. Clinical Reviewer Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-C6-A** | Review each of the 47 calculator engines per version | Signed per-engine record (engine ID + commit SHA) | [`docs/governance/decisions/EXT_C6_A_CALCULATOR_REVIEW_ACC.md`](decisions/EXT_C6_A_CALCULATOR_REVIEW_ACC.md) *(see also `PANACEA_C6_OWNER_ACC_DIRECTIVE.md`)* | **Owner ACC Documented** |
| **EXT-D7-A** | Defensible foot-slide threshold for a teaching animation? | Cited threshold + reviewer name | [`docs/governance/decisions/EXT_D7_A_GAIT_THRESHOLD_REFERENCE.md`](decisions/EXT_D7_A_GAIT_THRESHOLD_REFERENCE.md) | **Prepared & Documented** |

---

## 3. Legal Counsel Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-E4-A** | Approve retention periods, deletion rights, consent text, backup/log retention, legal basis (UU PDP). Draft: `docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md` | Dated, versioned policy + counsel sign-off | [`docs/governance/decisions/EXT_E4_A_LEGAL_RETENTION_POLICY.md`](decisions/EXT_E4_A_LEGAL_RETENTION_POLICY.md) | **Prepared & Documented** |
| **EXT-D8-C** | Is the owner statement on ICRP 145/156 redistribution enough, or is written ICRP permission needed? | Counsel note or permission | [`docs/governance/decisions/EXT_D8_C_ICRP_LEGAL_COUNSEL_NOTE.md`](decisions/EXT_D8_C_ICRP_LEGAL_COUNSEL_NOTE.md) | **Prepared & Documented** |

---

## 4. Infra Owner Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-E7-B** | Provision staging (Vercel preview + Render service) and add CI secrets | Staging URLs + secrets present | [`docs/governance/decisions/EXT_E7_B_STAGING_PROVISIONING.md`](decisions/EXT_E7_B_STAGING_PROVISIONING.md) | **Prepared & Documented** |
| **EXT-F1-B** | Provide a test Google OAuth client for a real login journey in CI | CI secret or written refusal | [`docs/governance/decisions/EXT_F1_B_OAUTH_PROVISIONING.md`](decisions/EXT_F1_B_OAUTH_PROVISIONING.md) | **Prepared & Documented** |
| **EXT-E4-B** | Read access to Render/Vercel log settings | Access or exported settings | [`docs/governance/decisions/EXT_E4_B_INFRA_LOG_AUDIT.md`](decisions/EXT_E4_B_INFRA_LOG_AUDIT.md) | **Prepared & Documented** |

---

## 5. Manual QA Gates

| ID | Question | Required Artifact | Prepared Decision Artifact | Status |
|---|---|---|---|---|
| **EXT-F2-A** | Manual keyboard, screen-reader and cross-device pass over the critical page list | Filled checklist with tester name + date | [`docs/governance/decisions/EXT_F2_A_MANUAL_QA_PASS.md`](decisions/EXT_F2_A_MANUAL_QA_PASS.md) | **Prepared & Documented** |

---

While a gate is open the affected capability ships with its limitation stated (e.g. "not clinically reviewed — not for clinical decisions"), or does not ship as approved.
