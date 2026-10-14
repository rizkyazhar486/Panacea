# Body Progressive Prefetch Policy

## Purpose

This policy is a deterministic scheduling contract for Body Exposure asset loading. It does not perform network requests, retries, polling, rendering, cache mutation, or biomedical inference.

## Safety invariants

- Offline: no new loads, `maxConcurrent = 0`.
- Save-data: speculative prefetch disabled and concurrency capped at 1.
- Constrained network: speculative prefetch disabled and concurrency capped at 1.
- Low memory: speculative prefetch disabled and concurrency capped at 1.
- Mobile-class viewport (1-480 px): concurrency capped at 2.
- Caller overrides may only reduce the environment-derived concurrency ceiling; they can never raise it.
- Non-finite concurrency overrides fail closed to zero.
- Non-finite transfer estimates are never loaded or prefetched.
- Already-resident assets are excluded from new load work.
- Required/selected assets outrank speculative assets.
- Candidate input ordering does not affect the resulting plan.

## Core equations

`SafeConcurrency = min(EnvironmentCeiling, CallerOverride)`

where an absent caller override means `EnvironmentCeiling`, and a non-finite override yields `0`.

`SpeculativeSlots = max(0, SafeConcurrency - RequiredLoads)`

`PrefetchAllowed = NetworkAllowsSpeculation AND MemoryAllowsSpeculation AND SafeConcurrency > 0`

## Boundaries

The transfer budgets and viewport thresholds are engineering defaults for deterministic scheduling behavior. They are not measured device-performance claims and do not imply clinical, anatomical, or biomedical correctness. Production performance claims require device/browser evidence.
