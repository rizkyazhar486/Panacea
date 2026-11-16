# Amendment A to the Unified Multi-Agent Directive V2

Issued 2026-11-16 by the Claude orchestrator. This file is an **amendment, not a competing directive.** The base text
is `PANACEA_UNIFIED_MULTI_AGENT_DIRECTIVE_V2` (branch `docs/unified-orchestrator-directive-v2`, commit `d353ad779`,
not yet merged when this was written). Where V2 and this amendment differ on roles, gates G1–G9 or release stages,
**V2 wins**; this file only adds the items below and corrects facts. If V2 is merged, fold this file into it in one
PR and delete this file, so exactly one directive exists.

**Ringkasan (ID).** Amandemen ini tidak menggantikan Direktif V2. Isinya: koreksi fakta (backend produksi ternyata
hidup di Render + MongoDB), protokol perselisihan antar-agent, pemicu ketidakstabilan, aturan worktree terpisah
(karena checkout bersama menyebabkan commit nyasar), usulan gerbang tambahan G10–G11, dan tangga menuju skala platform.

## A0. Authority

Order: Product Owner's latest chat instruction → safety/security/privacy limits (`CLAUDE.md` §8, Constitution) →
`CLAUDE.md`, `AGENTS.md`, `GEMINI.md` → `docs/governance/` v2 → Directive V2 → this amendment.

## A1. Corrections of fact (supersede the earlier draft of this amendment and any contrary line in V2)

| Statement | Status | Evidence (2026-11-16) |
|---|---|---|
| The production backend is live and stores data in MongoDB | **Confirmed** | `GET https://panaceamed-backend.onrender.com/api/health` → `"penyimpanan":"mongo"`, `"penyimpananSehat":true`, `s5xx:0` |
| The served frontend is built to call that backend | **Confirmed** | `.env.local` `VITE_API_URL` host is the Render backend; the host string appears in `dist/assets/index-*.js` |
| `https://panaceamed.id` itself is served from `vite preview` on a personal laptop through a Cloudflare tunnel | **Confirmed** | `~/.cloudflared/config.yml` ingress to `127.0.0.1:4399`; `ps`; tunnel stop produced Cloudflare 502/1033 |
| `server/data.json` in a checkout is production data | **False.** It is a local dev file with 3 seeded test users | read-only inspection of `server/data.json` |
| Owner's real data exists only in browser `localStorage` | **False as a general claim.** A local copy exists there; the production copy is in MongoDB and was not read (no credentials, not requested) | in-browser key listing; health endpoint |
| The owner's current browser session is authenticated to the backend | **Unverified.** Nobody has proven it; this must be checked by the owner signing in | — |

Recovery of past registered accounts and logs therefore means: **sign in with the same account** so the app reads
from the backend, then compare counts against the local copy. No agent reads, exports or edits production Mongo data
without the owner's explicit instruction and a read-only, audited method.

## A2. Disagreement protocol

1. State the claim and evidence (file:line, command, URL). Rank is not evidence.
2. The reviewer reproduces it. Unreproducible claims are marked `{unverified}` and do not block.
3. If still disputed, the orchestrator decides in this order: safety > data integrity > evidence > reversibility >
   simplicity > speed, and writes the reason in the PR.
4. If the orchestrator is a party, or scope/risk changes, the Product Owner decides. Others keep working on
   unblocked rows.

## A3. Instability triggers (stop, isolate, tell the owner)

Required CI red on `main`; auth/RBAC/consent/audit/signing changed without tests; PHI or a secret in a diff; a test
deleted, skipped or loosened; a non-Claude agent editing another agent's branch; a second patient-truth store; a
clinical-validity, licensure or compliance claim; a direct push to `main`; a duplicated authority document.

## A4. Isolation rule (new; caused by a real incident today)

Evidence: in one session the shared checkout's branch was switched by a parallel agent between two of my commands;
my commit landed on another agent's branch name and was pushed there (`06179efc5`), creating a remote branch
`feat/perf-ux-interop-split` that held only that commit. Three directive documents were also written in parallel.

Rules:
1. **Every agent works in its own `git worktree`**, e.g. `git worktree add ../Panaceamed.id-wt-<agent>-<task> -b <type>/<scope> origin/main`.
   Never run `git switch`/`checkout` in the primary checkout.
2. Before commit and push, assert the branch in the same command: `test "$(git branch --show-current)" = "<branch>"`,
   and push with an explicit refspec: `git push -u origin <branch>`. Never push `HEAD` from a shared checkout.
3. Before writing any new document of authority (directive, policy, checklist), search open PRs and remote branches
   (`gh pr list`, `git branch -r`) and claim a TASK_BOARD row. One canonical directive; changes arrive as PRs to it.
4. If a stray branch or commit is created, the creator reports it to the owner immediately with the SHA; only Claude
   cleans up another agent's refs, and never with force.

## A5. Proposed additions to the release gates (owner approval needed; V2 G1–G9 unchanged)

| Gate | Addition | Why (evidence) |
|---|---|---|
| G3+ | **Data-durability drill:** sign in on a clean browser, restore, compare record counts with a known export; Atlas backup restore test | Recovery depends on a working backend; today nobody has proven restore |
| G9+ | **Support and deletion workflow:** abuse report, takedown, user deletion, incident contact, tested once | Public users need recourse; UU PDP duties are for counsel to confirm |
| **G10** | **Asset rights:** logo, tutorial video and ICRP data cleared or removed (EXT-D8-A/B/C) | Legal risk recorded in `EXTERNAL_GATES.md` |
| **G11** | **Load and failure test at the planned user cap**, plus a bandwidth/cost guard | Render service was suspended for bandwidth on 2026-10-29 (`TASK_BOARD.md` T-OPS-BW-01) |

Verdict stays as in V2: **not ready for the general public.**

## A6. Ladder toward platform scale (each rung needs evidence before the next)

1. Trust core: identity, consent, audit, durable data. 2. One daily loop people repeat (retention measured).
3. One institution episode with measured completion and speed. 4. Interoperability (FHIR/DICOM/device fixtures,
export/import, a second site). 5. Cross-site referral and payer adapters per jurisdiction. 6. Open APIs/SDK with
sandbox. 7. Payments/claims only through licensed partners, confirmed by counsel. 8. Audited operations at scale.
Skipping a rung is a defect. No claim of dominance, compliance or licensure without evidence.

## A7. Open questions for the owner

1. Is V2's description of Hydrogen (biological-depth lane) and Argon (clinical/interop lane) correct and final?
2. Which file is the single canonical directive (V2 recommended), and may this amendment be folded into it?
3. Will you sign in on a clean browser to run the A5 durability drill?

## A8. Gemini bootstrap

1. Read `AGENTS.md`, `CLAUDE.md`, `docs/governance/README.md`, V2, then this amendment.
2. State your lane and what you can actually run. Chat agents give proposals only and tag recalled facts `{unverified}`.
3. CLI agents: create your own worktree (A4), run `git fetch`, `gh pr list`, `node scripts/qa/acceptance-v2.mjs`,
   claim one TASK_BOARD row, then work.
4. Report per task: SHA, change, evidence, PR/branch, blocker or the one decision needed (≤120 words).
