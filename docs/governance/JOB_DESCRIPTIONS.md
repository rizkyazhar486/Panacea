# Job Descriptions — AI-first operating model

Panaceamed is built **primarily by AI agents**. Humans are not in the delivery path for routine
work; they hold the authority AI must not fake. This page extends the team function map
(Oct 10, 2026: P1–P6, X1–X7, B1–B8, C1–C6, O1–O3) by moving execution of X and B functions to AI
lanes, while every decision right stays with the named human.

## AI lanes (contributors)

| Lane | Owns (execution) | Typical criteria | Never does |
|---|---|---|---|
| **Integrator** (one agent at a time) | Main health, merge order, PR triage, CI fixes, evidence batches per SHA, TASK_BOARD upkeep | ENG-CI-*, ENG-REG-* recording | Merge over red; approve its own PR |
| **Claude lane** | Frontend & UX (X1–X5), browser E2E, Body Exposure & gait, asset provenance automation | ENG-F1-01/03, ENG-F2-*, ENG-D7-*, ENG-D8-*, ENG-REG-C/D | Decide clinician access, invent licences |
| **Codex lane** | Backend & security (B1–B8), RBAC tests, privacy engineering, release/deploy evidence, calculator formula transparency; independent reviewer of Claude PRs | ENG-F1-02, ENG-E4-*, ENG-E7-*, ENG-C6-*, ENG-REG-A/B/E | Enact unapproved policy values, record clinical review |
| **Any AI** (Gemini, cloud agents) | Same rules; takes READY rows not claimed by a lane | marked `any-ai` | Same as above |

Rules for every AI lane:
- Claim a TASK_BOARD row before starting; release it if blocked.
- Check open PRs for file overlap before editing; never edit a file another open PR edits.
- Author and reviewer are different lanes.
- AI may do legal and licence **research** (find primary licence text, draft questions, compare
  terms). AI may not grant rights, declare authorship, or approve a policy. Unresolved rights restrict
  the asset; they never become an invented grant.

## Human roles (gate holders)

Ask each person only the questions in [EXTERNAL_GATES.md](EXTERNAL_GATES.md). Expected time:
minutes per gate, not ongoing work.

| Role (team map) | Decides | Gates | Does not need to |
|---|---|---|---|
| **Product Owner** — Rizky (P1, P4, P6) | Priorities, release go/no-go, clinician access scope, owner asset attestations, release policy | EXT-F1-A, EXT-F1-C, EXT-D8-A/B, EXT-E7-A/C | Review code, run tests |
| **Clinical reviewer** — Prof. Mega (C1–C6) | Clinical validity per engine/version, scientific thresholds | EXT-C6-A, EXT-D7-A | Fix TypeScript, score UI |
| **Legal counsel** (O1 support; to be named) | Privacy policy legality (UU PDP), third-party licence sufficiency | EXT-E4-A, EXT-D8-C | Touch the repo |
| **Infra owner** — Insan (B6 decision rights) | Credentials and access: staging, OAuth test client, log access, branch protection | EXT-E7-B, EXT-F1-B, EXT-E4-B, §Repo | Write the workflows (AI does) |
| **Manual QA** (delegable, X3 support) | Hands-on keyboard / screen reader / device pass | EXT-F2-A | Write automated tests |
| **Core Product** — Gafi (P2, P3, P5) | Requirement wording, roadmap order inside owner priorities | Reviews ROADMAP_RESET changes | Approve clinical or legal items |

## Handoff (AI-first)

```
Owner priority (P1) → AI: scope task row → AI: implement + test + PR → AI: cross-lane review
→ guarded merge → AI: evidence at SHA → [only if the criterion has an EXT gate] human decision
→ Owner release sign-off (P6)
```

Two rules from the team map hold unchanged: Panaceamed never diagnoses, prescribes, doses, orders or
decides emergencies on its own; and an AI agent never records a clinical review or signs for a person.
