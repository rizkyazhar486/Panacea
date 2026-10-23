# EXTERNAL GATES — decisions AI cannot make

> Every gate below needs a human, a vendor or an expert. None of them blocks engineering work on other criteria (`blocksEngineeringWork: false`). Source: [`governance/ACCEPTANCE_V2.json`](../../governance/ACCEPTANCE_V2.json).

Statuses: `OPEN` → `BLOCKED_EXTERNAL` (request sent) → `DECIDED` (decision record attached). The AI never writes `DECIDED` on a human's behalf.

| ID | Legacy | Who decides | Specific question | Why AI cannot | Until decided |
|---|---|---|---|---|---|
| EXT-D8-1 | D8 | Product Owner | Is public/logo-mark.png original work you may use? Provide an author statement and the basis of rights. | AI must not self-attest ownership | Keep asset; D8 stays BLOCKED_EXTERNAL |
| EXT-D8-2 | D8 | Product Owner (+ legal if third-party) | Source, author and rights of public/media/tutorial-video.mp4 including music, voice and footage. | AI must not self-attest rights | Keep asset; D8 stays BLOCKED_EXTERNAL |
| EXT-E4-1 | E4 | Product Owner + legal/privacy counsel | Approve retention periods, deletion rights, consent and legal basis (docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md). | 'Compliant with policy' is untestable without an approved policy | Engineering safeguards proceed; policy tests added after approval |
| EXT-E4-2 | E4 | Product Owner | Provide Render/Vercel/Mongo log visibility or accept them as out of scope. | Third-party logs are unreadable from the repo | Documented as a blind spot |
| EXT-E7-1 | E7 | Product Owner | Define 'accepted release SHA' (HEAD vs last release vs per-artifact), whether staging is required, and grant infra access. | Equivalence rule is policy | Comparator reports facts; no VERIFIED claim |
| EXT-F1-1 | F1 | Product Owner (+ security reviewer) | Choose clinician access model A-D (docs/alpha/F1_CLINICIAN_ACCESS_AUDIT.md), contributor role scope, owner/admin treatment and OAuth scope. | AI must not silently open or restrict access | Current behaviour pinned by test |
| EXT-F1-2 | F1 | Product Owner | Provide a real Google OAuth test account, or accept synthetic sessions only. | Real provider flow is untestable in CI | Gap stays listed |
| EXT-F2-1 | F2 | Manual QA assignee | Run docs/alpha/F2_MANUAL_QA_CHECKLIST.md and record results. | Human judgment | Result cells stay blank until done |
| EXT-D7-1 | D7 | Biomechanics expert | Justify or replace placeholder slip thresholds; judge rig fidelity before any 'realistic' claim. | Thresholds are placeholders, not literature | Claims limited to 'measured against a placeholder' |
| EXT-C6-1 | C6 | Named specialist physicians | Review each calculator engine, sign per formula, record version and findings. | Clinical validation is not an engineering result | clinically_reviewed=false and the deferral stay |
| EXT-PROD-1 | all | Product Owner | Confirm production credentials/ownership and who may publish or roll back. | AI cannot hold production authority | Release gate records SHA only |

## Product Owner shortlist (the only items that need you)

1. **D8** — keep or retire `logo-mark.png` and `tutorial-video.mp4`, and state source/rights (`docs/alpha/D8_OWNER_ATTESTATION_REQUESTS.md`).
2. **F1** — pick clinician access option A–D (`docs/alpha/F1_CLINICIAN_ACCESS_AUDIT.md`).
3. **E7** — define 'accepted release SHA' and whether staging is required.
4. **E4** — retention/consent policy with counsel.
5. Name a manual QA assignee for F2 and a specialist reviewer for C6 (C6 stays deferred).
