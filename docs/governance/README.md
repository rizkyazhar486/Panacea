# Panaceamed Governance v2 — how work gets done

Status: **PROPOSED** until the Product Owner merges the PR that adds this folder. After merge it
supersedes any conflicting *process* text in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and
`governance/CONTINUATION_STATE.md`. Product doctrine (One OS, safety boundaries, English-first UI,
evidence rules) is unchanged.

**Operating model: AI does all the work; humans are a final stage.** AI agents write the code,
tests, evidence and PRs and carry them to merge. Decisions that need a qualified human (rights, legal
policy, clinical validation, release sign-off) are deferred to a *final stage (H3)* that starts only
when such a person actually exists after Alpha engineering. Nobody is asked for signatures, QA or
attestations now. Deferral grants no approval: AI never marks a gate decided, and safety labels stay
(`clinically_reviewed=false`, unattested assets flagged, non-clinical use).

| Need | File |
|---|---|
| **Start here, any AI model** (60-second entry) | [AGENT_ENTRYPOINT.md](AGENT_ENTRYPOINT.md) |
| Capability router per task class (tiers, evidence, prohibitions) | [SUPER_INTELLIGENCE_CAPABILITIES.md](SUPER_INTELLIGENCE_CAPABILITIES.md) + `governance/TASK_CATALOG.json` |
| Optional human review (voluntary, with terms) | [HUMAN_VERIFICATION_OPTIONAL.md](HUMAN_VERIFICATION_OPTIONAL.md) |
| What exists, what is real vs mocked | [PROJECT_REALITY_MAP.md](PROJECT_REALITY_MAP.md) |
| Where we are going (H0 → H1 → H2) | [ROADMAP_RESET.md](ROADMAP_RESET.md) |
| What to do next, who holds it | [TASK_BOARD.md](TASK_BOARD.md) |
| What "done" means (machine-checked) | [ACCEPTANCE_V2.md](ACCEPTANCE_V2.md) + `governance/ACCEPTANCE_V2.json` |
| How evidence is judged | [VERIFICATION_V2.md](VERIFICATION_V2.md) |
| How main stays green | [STABILIZATION_V2.md](STABILIZATION_V2.md) |
| Who does what (AI lanes + human gates) | [JOB_DESCRIPTIONS.md](JOB_DESCRIPTIONS.md) |
| Decisions only humans can make | [EXTERNAL_GATES.md](EXTERNAL_GATES.md) |
| Old 45-criterion ledger → v2 | [LEGACY_MIGRATION.md](LEGACY_MIGRATION.md) |

## The loop (every task, every agent)

```
pick top READY task on TASK_BOARD (respect lane + WIP)
→ reproduce first failure at exact main SHA
→ smallest fix + failing-before / passing-after test
→ targeted tests → exact-head required CI
→ independent AI review (other lane) → guarded merge
→ re-verify main → update criterion status + TASK_BOARD row
```

A loop ends with **a merged/mergeable commit** or **a gate recorded as deferred**. Never with a
report alone, and never with a question to the owner.

## Seven hard rules

1. **Red main stops the line.** While any required check is red on main, the only allowed work is
   fixing it (or work that does not touch main).
2. **WIP limit:** 1 integration-critical PR at a time (integrator); max 2 open PRs per lane; no two
   open PRs edit the same file.
3. **No docs-only PRs** unless the doc is an acceptance artifact or removes a real risk.
4. **Status words mean one thing** (see VERIFICATION_V2): `PASS` only with evidence at the exact SHA.
   Implemented ≠ tested ≠ merged ≠ deployed ≠ clinically validated.
5. **Humans are a final stage.** A task that needs a human becomes a deferred gate in EXTERNAL_GATES
   (future question + activation condition); agents move on and do not ask or re-report it.
6. **Never fabricate** approvals, licences, clinical review, deployments or test results. Never lower
   a threshold or ratchet after seeing it fail without a versioned, owner-approved change.
7. **Reports are short:** SHA, what changed, test/CI result, PR, the one decision needed. Max ~120
   words to the owner; full evidence lives in the PR.

## Check it

```
node scripts/qa/acceptance-v2.mjs       # validates criteria, prints PASS x/y + open gates
npm run uji                             # includes scripts/uji/acceptance-v2.mts (anti-gaming controls)
```
