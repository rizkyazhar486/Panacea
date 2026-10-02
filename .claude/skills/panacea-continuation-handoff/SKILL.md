---
name: panacea-continuation-handoff
description: Use when Panaceamed work must stop before completion, move to another agent, continue in a later session, or is blocked by an external dependency or long-running task.
---

# Panacea Continuation Handoff

## Goal
Make continuation deterministic. The next agent should not need to reconstruct state from chat history.

## Handoff contract
Record:
- objective and user-visible outcome;
- current branch and exact head SHA;
- latest known `main` SHA;
- completed work;
- remaining work ordered by dependency;
- files/areas currently owned;
- active overlapping PRs or coordination risks;
- commands/checks already run and exact results;
- failing checks with reproducible error excerpts;
- evidence/provenance work still required;
- external blockers, missing credentials, or unavailable services;
- next safest concrete action;
- explicit things the next agent must not redo or overwrite.

## Rules
- State facts, not optimistic status labels.
- Never write “almost done” without enumerating what remains.
- Preserve links/IDs for PRs, issues, datasets, assets, and evidence sources.
- If the task is long-running or blocked, put the durable continuation entry in the repository's canonical handoff mechanism rather than relying on conversation memory.
- Do not claim tests were run if they were not.

## Quality test
A fresh agent with repository access but no chat history should be able to resume from the handoff without asking what happened previously.