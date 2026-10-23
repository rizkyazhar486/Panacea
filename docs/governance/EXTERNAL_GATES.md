# FINAL-STAGE HUMAN GATES (deferred, not requested now)

> **Operating decision (owner, 2026-10-23):** the project runs AI-first. Decisions that need a qualified human — licensed clinicians, legal counsel, employed operators, real-user panels — are a **final stage**, activated only after Alpha engineering is complete **and** such a person actually exists in the project. Asking a non-specialist to sign off now is unrealistic and is removed from the working path. Source: [`governance/ACCEPTANCE_V2.json`](../../governance/ACCEPTANCE_V2.json).

## What deferral does and does not mean
- Does: no engineering task waits for these; the owner is not asked to answer anything now; no status report is generated about them.
- Does not: grant any approval. The AI never writes `DECIDED`, never marks these `PASS`/`VERIFIED`, and never claims legal, clinical or licence validity. Safety labels in the product stay as they are (`clinically_reviewed=false`, unattested assets flagged, decision-support limited to non-clinical use).
- Consequence stated once, honestly: until a gate is decided, the product must not be offered for real clinical decisions or published with the unattested assets presented as cleared.

| ID | Legacy | Who (later) | Future question | Why AI cannot | Until then |
|---|---|---|---|---|---|
| EXT-D8-1 | D8 | Product Owner | Is public/logo-mark.png original work you may use? Provide an author statement and the basis of rights. | AI must not self-attest ownership | Keep asset; D8 stays BLOCKED_EXTERNAL |
| EXT-D8-2 | D8 | Product Owner (+ legal if third-party) | Source, author and rights of public/media/tutorial-video.mp4 including music, voice and footage. | AI must not self-attest rights | Keep asset; D8 stays BLOCKED_EXTERNAL |
| EXT-E4-1 | E4 | Product Owner + legal/privacy counsel | Approve retention periods, deletion rights, consent and legal basis (docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md). | 'Compliant with policy' is untestable without an approved policy | Engineering safeguards proceed; policy tests added after approval |
| EXT-E4-2 | E4 | Product Owner | Provide Render/Vercel/Mongo log visibility or accept them as out of scope. | Third-party logs are unreadable from the repo | Documented as a blind spot |
| EXT-E7-1 | E7 | Product Owner | Define 'accepted release SHA' (HEAD vs last release vs per-artifact), whether staging is required, and grant infra access. | Equivalence rule is policy | Comparator reports facts; no VERIFIED claim |
| EXT-F1-1 | F1 | Product Owner (+ security reviewer) | Choose clinician access model A-D (docs/alpha/F1_CLINICIAN_ACCESS_AUDIT.md), contributor role scope, owner/admin treatment and OAuth scope. | AI must not silently open or restrict access | Current behaviour pinned by test |
| EXT-F1-2 | F1 | Product Owner | Provide a real Google OAuth test account, or accept synthetic sessions only. | Real provider flow is untestable in CI | Gap stays listed |
| EXT-F2-1 | F2 | Manual QA (final stage) | Run docs/alpha/F2_MANUAL_QA_CHECKLIST.md with real assistive tech and devices. | Automated axe/keyboard/screenshot checks cover what a machine can; assistive-tech judgment needs a person | Automated F2 criteria keep running; manual cells stay blank |
| EXT-D7-1 | D7 | Biomechanics expert | Justify or replace placeholder slip thresholds; judge rig fidelity before any 'realistic' claim. | Thresholds are placeholders, not literature | Claims limited to 'measured against a placeholder' |
| EXT-C6-1 | C6 | Named specialist physicians | Review each calculator engine, sign per formula, record version and findings. | Clinical validation is not an engineering result | clinically_reviewed=false and the deferral stay |
| EXT-PROD-1 | all | Product Owner | Confirm production credentials/ownership and who may publish or roll back. | AI cannot hold production authority | Release gate records SHA only |

Status values: `DEFERRED_FINAL_STAGE` (default) → `DECIDED` (only a human, with a signed record).
