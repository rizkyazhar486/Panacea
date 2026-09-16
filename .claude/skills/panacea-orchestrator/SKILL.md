---
name: panacea-orchestrator
description: Use when a Panaceamed task spans multiple domains, agents, repositories areas, or independent implementation tracks and needs coordinated execution without overlapping active work.
---

# Panacea Orchestrator

## Core rule
Coordinate work; do not replace `CLAUDE.md` or `AGENTS.md`. Those files remain authoritative for repository policy, Git/CI coordination, language, and clinical publication boundaries.

## Workflow
1. Read `CLAUDE.md` and `AGENTS.md` before planning.
2. Resolve the latest `main` SHA and inspect open PRs touching intended paths.
3. Build a dependency graph: blockers first, then independent tracks.
4. Split only truly independent work; never let two agents own overlapping files or the same product surface simultaneously.
5. For each track define: objective, owned paths, acceptance checks, evidence needed, and stop condition.
6. Prefer the smallest coherent reversible batch per PR.
7. Reconcile outputs at integration boundaries: types, contracts, routes, shared state, design tokens, and medical provenance.
8. Hand off long-running or blocked work with exact current state rather than vague summaries.

## Dispatch test
Parallelize only when all are true:
- no shared mutable files;
- no unresolved API/schema dependency;
- no competing ownership of the same UI surface;
- each track can be tested independently.

Otherwise execute sequentially.

## Completion
A track is not complete because code exists. It is complete only after its defined checks pass and the result is ready for the repository PR gate.