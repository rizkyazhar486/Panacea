---
name: panacea-autonomous-debugger
description: Use when Panaceamed has a failing test, broken build, runtime error, regression, deployment failure, flaky behavior, or unclear defect that needs root-cause diagnosis before a fix.
---

# Panacea Autonomous Debugger

## Rule
Diagnose before patching. Do not stack speculative fixes.

## Workflow
1. Reproduce the failure with the smallest reliable command or browser path.
2. Capture the exact error, failing assertion, logs, environment, and commit SHA.
3. Trace backward from the failure to the first incorrect state or contract.
4. Separate root cause from downstream symptoms.
5. Write or identify a test that fails for the root cause.
6. Apply the smallest fix that makes that test pass.
7. Run targeted checks, then the relevant broader gate.
8. Verify no validator, medical gate, or assertion was weakened merely to pass.

## Escalation
If the defect depends on another active PR, external service, unavailable secret, corrupted asset, or unresolved architecture ownership, stop mutation and create a precise handoff containing reproduction, evidence, affected paths, and next safe action.

## Anti-patterns
- random dependency upgrades;
- broad rewrites before reproducing;
- disabling tests;
- swallowing errors with empty catch blocks;
- adding fallback data that hides a real failure;
- declaring success from a single local build when browser/runtime behavior was affected.