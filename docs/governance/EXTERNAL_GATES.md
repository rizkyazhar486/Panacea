# External Gates — decisions only humans can make

Machine-readable copy: `externalGates` in `governance/ACCEPTANCE_V2.json`. Each gate is asked
**once**. Agents continue independent engineering work and do not re-report open gates.
To close a gate: supply the artifact, then an agent sets `status: DECIDED` and `decisionRef` to it.

## Product Owner

| ID | Question | Artifact that closes it |
|---|---|---|
| EXT-F1-A | Clinicians read **all** patients in their tenant (current code), or **only assigned** patients? Who may grant exceptions? | Decision record (deny-by-default y/n, scope, exception rule, date) |
| EXT-F1-C | Run or delegate one real-user session per role? | Dated notes per role |
| EXT-D8-A | Who made `public/logo-mark.png`; on what rights basis? | Signed authorship/rights statement |
| EXT-D8-B | Source, author and media rights of `public/media/tutorial-video.mp4`? | Source + licence/permission evidence |
| EXT-E7-A | Which SHA counts as "released" (latest main / release tag / per-artifact last change)? Who may release and roll back? | Release policy |
| EXT-E7-C | Sign off each production release | Release record per version |

## Clinical reviewer

| ID | Question | Artifact |
|---|---|---|
| EXT-C6-A | Review each of the 47 calculator engines per version | Signed per-engine record (engine ID + commit SHA) |
| EXT-D7-A | Defensible foot-slide threshold for a teaching animation? | Cited threshold + reviewer name |

## Legal counsel

| ID | Question | Artifact |
|---|---|---|
| EXT-E4-A | Approve retention periods, deletion rights, consent text, backup/log retention, legal basis (UU PDP). Draft: `docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md` | Dated, versioned policy + counsel sign-off |
| EXT-D8-C | Is the owner statement on ICRP 145/156 redistribution enough, or is written ICRP permission needed? | Counsel note or permission |

## Infra owner

| ID | Question | Artifact |
|---|---|---|
| EXT-E7-B | Provision staging (Vercel preview + Render service) and add CI secrets | Staging URLs + secrets present |
| EXT-F1-B | Provide a test Google OAuth client for a real login journey in CI | CI secret or written refusal |
| EXT-E4-B | Read access to Render/Vercel log settings | Access or exported settings |
| §Repo | Enable branch protection on `main` requiring Validate changes, server-validate, Stabilization Acceptance | Protection enabled (API no longer returns "Branch not protected") |

## Manual QA

| ID | Question | Artifact |
|---|---|---|
| EXT-F2-A | Manual keyboard, screen-reader and cross-device pass over the critical page list | Filled checklist with tester name + date |

While a gate is open the affected capability ships with its limitation stated (e.g. "not clinically
reviewed — not for clinical decisions"), or does not ship. It is never presented as approved.
