# OPERATING MODEL — AI as primary contributor, humans as gate-keepers

## Principle
AI writes, tests, reviews (cross-agent), merges through protected flow when permitted, and prepares evidence. **Humans are a final stage**, activated only when a qualified human exists (specialist, counsel, employed operator) after Alpha engineering is complete. Nothing in the working loop waits for a human, and the owner is not asked to produce signatures or attestations now. An AI never fabricates a human's decision or marks a deferred gate decided.

## Job descriptions
| Role | Does | Must not |
|---|---|---|
| **Claude Code (implementer)** | D7/F1/F2/D8 engineering, dependency/CI fixes, governance docs; one branch per change; failing test first | merge own PR unless the owner explicitly asks; edit another agent's draft PR; promote any status; claim a human decision |
| **Codex (reviewer/integrator)** | independent review, exact-head CI check, merge gate, E4 safeguards, E7 verification, C6 formula transparency | act as owner approver; force-merge; accept stale green |
| **Product Owner** | sets direction and priorities; approves governance changes when they choose | is not asked to attest, sign or QA anything now |
| **Final-stage humans** (counsel, physicians, QA) | later: E4 policy, D8 rights, C6 sign-off, F2 assistive-tech QA ([EXTERNAL_GATES.md](EXTERNAL_GATES.md)) | not engaged until the final stage |

## Loop (one cycle = one meaningful commit/test or one proven external blocker)
reproduce first failure → minimal fix → targeted test → sabotage the gate → exact-head CI → independent review → guarded merge (main idle, full SHA) → verify main.
If a task needs a human: record it as a deferred final-stage gate and move on; do not ask.

## Reporting (max 7 lines)
main SHA · PR/merge · tests changed · CI cost saved or spent · blockers (gate ids) · one decision needed · next atomic task.

## Limits of this environment (honest)
This cloud session can read and write the GitHub repository and run code in its own container. It has **no access to the owner's laptop, browser sessions or local files** unless a computer-use/remote-device connector is attached and approved in the Claude app. Local work on the laptop therefore means running Claude Code (or the Claude desktop app with computer use enabled) there; nothing in this repository requires laptop control to progress.
