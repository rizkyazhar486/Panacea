# OPERATING MODEL — AI as primary contributor, humans as gate-keepers

## Principle
AI writes, tests, reviews (cross-agent) and prepares evidence. Humans decide only what AI cannot legitimately decide: ownership/licence, legal policy, clinical validation, production authority, real-world user acceptance. A human is never a bottleneck for engineering work; an AI never fabricates a human's decision.

## Job descriptions
| Role | Does | Must not |
|---|---|---|
| **Claude Code (implementer)** | D7/F1/F2/D8 engineering, dependency/CI fixes, governance docs; one branch per change; failing test first | merge own PR unless the owner explicitly asks; edit another agent's draft PR; promote any status; claim a human decision |
| **Codex (reviewer/integrator)** | independent review, exact-head CI check, merge gate, E4 safeguards, E7 verification, C6 formula transparency | act as owner approver; force-merge; accept stale green |
| **Product Owner** | answer the shortlist in [EXTERNAL_GATES.md](EXTERNAL_GATES.md) once; approve governance v2; name QA assignee and specialist reviewers | be asked to read status reports |
| **Legal/privacy counsel** | E4 policy, D8 third-party rights | — |
| **Specialist physicians** | C6 per-formula sign-off | — |
| **Manual QA** | F2 checklist | — |

## Loop (one cycle = one meaningful commit/test or one proven external blocker)
reproduce first failure → minimal fix → targeted test → sabotage the gate → exact-head CI → independent review → guarded merge (main idle, full SHA) → verify main.
If blocked externally: send the specific question once, move to the next independent task.

## Reporting (max 7 lines)
main SHA · PR/merge · tests changed · CI cost saved or spent · blockers (gate ids) · one decision needed · next atomic task.

## Limits of this environment (honest)
This cloud session can read and write the GitHub repository and run code in its own container. It has **no access to the owner's laptop, browser sessions or local files** unless a computer-use/remote-device connector is attached and approved in the Claude app. Local work on the laptop therefore means running Claude Code (or the Claude desktop app with computer use enabled) there; nothing in this repository requires laptop control to progress.
