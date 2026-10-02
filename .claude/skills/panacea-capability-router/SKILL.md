---
name: panacea-capability-router
description: Use when a Panaceamed task can be served by multiple tools, plugins, agents, evidence providers, or execution environments and choosing among them affects correctness, safety, cost, or verification.
---

# Panacea Capability Router

## Core rule
Select the narrowest safe capability for the task. `CLAUDE.md` and `AGENTS.md` remain authoritative; this skill cannot override repository, clinical, privacy, security, authorization, or merge policy.

## Workflow
1. Read `CLAUDE.md`, `AGENTS.md`, then `config/capability-os.json`.
2. Identify one logical capability for each independent information or action need.
3. Check that the current executor is listed under that capability's supported executors.
4. Check runtime availability and authorization. Never treat the manifest as connection state and never infer that a provider is installed, connected, or authorized from repository data.
5. Use the declared primary provider when available. Otherwise walk fallbacks in order.
6. A fallback may never bypass policy denial, missing authorization, clinical publication gates, privacy rules, security rules, or repository ownership conflicts.
7. Use a second provider only for a documented reason: conflict, high-risk corroboration, distinct evidence class, or explicit comparison.
8. Capture the capability's required evidence and stop condition before execution ends.
9. Delegate dependency ordering, path ownership, sequencing, parallelism, and integration to `panacea-orchestrator`.

## Fail-closed boundaries
- Never install a plugin automatically.
- Never change plugin permission settings automatically.
- Stop when user authorization or connection is required.
- Never use a general fallback to weaken evidence quality silently.
- An LLM is not biomedical evidence; evidence must come from the routed source/provider and preserve provenance.
- Do not add undeclared deployment providers as an implicit production migration path.

## Output contract
A routed task should identify:
- capability id;
- chosen provider and executor;
- whether an ordered fallback was used;
- required evidence;
- stop condition;
- any authorization, policy, overlap, or availability blocker.

The router selects capabilities. The orchestrator schedules work.
