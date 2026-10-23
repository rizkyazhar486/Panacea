# Panacea Feature Factory — 1000 Work Units

Feature Factory turns the large Panacea roadmap into a deterministic, auditable queue instead of loading hundreds of unrelated features into the production bundle.

## Why exactly 1000

The queue is the Cartesian product of:

- 20 product/science domains in `data/feature-factory/domains.json`
- 50 reusable capability units in `data/feature-factory/capabilities.json`

`20 × 50 = 1000` candidates.

A candidate is a tracked implementation unit, not a promise that every combination should become a visible standalone page. During implementation it may become a small widget, shared engine, adapter, validation rule, report panel, worker, test or intentionally skipped item with a documented reason.

## Source-first architecture

Every domain references existing Source Registry records. The roadmap may use the registry filename as a stable alias (for example `healthkit`), while the record retains its authoritative canonical ID (for example `apple_healthkit`). The factory resolves both forms without mutating the registry.

External APIs, datasets, models and repositories continue to follow the Source Registry flow:

`source -> license/provenance gate -> adapter -> normalized Panacea schema -> engine -> UI`

Do not bypass that path by calling third-party medical APIs directly from a React page.

## Automatic promotion policy

Automatic eligibility is deliberately conservative. Source lists are candidate sources, not permission to use every listed source.

A candidate can be `autoEligible` only when:

1. domain risk is no higher than `medium`;
2. every referenced Source Registry record resolves;
3. at least one referenced source is currently operational for bounded use because it already has an `ACTIVE` Panacea adapter or a `VERIFIED` license gate;
4. the candidate is not classified as the heaviest performance tier.

Only the operational source subset may be used by an automatic implementation. Other listed sources remain explicitly tagged `source-review` until their registry gate is resolved. `high` candidates require scientific review. `clinical` candidates require explicit clinical validation. Very heavy visualization/asset work requires performance review. These gates must never be weakened merely to make CI pass.

## Priority formula

The current deterministic ranking is:

```text
benefit = 0.55 × (impact / 5)
        + 0.25 × (reach / 5)
        + 0.20 × sourceReadiness

complexityCost  = (complexity - 1) / 4
performanceCost = (performance - 1) / 4
riskPenalty     = 0.0 low | 0.1 medium | 0.3 high | 0.5 clinical

denominator = 1
            + 0.35 × complexityCost
            + 0.25 × performanceCost
            + riskPenalty

priority = clamp(0, 100, round(100 × benefit / denominator))
```

`sourceReadiness` is the fraction of candidate sources that already have an active adapter or verified license gate. This is an engineering prioritization score, not a clinical confidence score.

## Runtime stability rules

For every implemented candidate:

- prefer reuse of an existing component, engine or adapter over adding a dependency;
- lazy-load route-level and expensive secondary functionality;
- never place native/scientific toolchains or large datasets in the initial Vite bundle;
- use workers/services for expensive computation when justified;
- bound arrays, chart point counts and retained history;
- downsample before visualization where medically/scientifically acceptable;
- cancel stale async requests and avoid duplicate polling;
- define timeout, retry/backoff only where safe, and meaningful upstream-error states;
- provide empty/loading/offline/fallback states;
- fail closed when a clinical/scientific input is invalid or incomplete;
- preserve units, time, source identity and transformation provenance;
- do not fabricate data to keep animation or UI populated;
- use progressive disclosure: simple surface, complex detail on demand;
- add deterministic tests before marking work `done`.

## Commands

```bash
# Validate all 1000 generated candidates and safety invariants
npm run validate:feature-factory

# Run deterministic Feature Factory tests
npm run test:feature-factory

# Show the next safe candidates
npm run next:features

# Inspect gated candidates too
npm run next:features -- --include-review

# Scope ranking to one domain
npm run next:features -- --domain=fitness --limit=10

# Machine-readable state
npm run feature:status

# Update the auditable progress ledger
npm run feature:update -- ff-fitness-chart in_progress --paths=src/example.ts --note="work started"
npm run feature:update -- ff-fitness-chart done --commit=<sha> --paths=src/example.ts,scripts/qa/example.test.mjs
```

## Status semantics

- `candidate`: not started
- `in_progress`: implementation is actively being changed
- `done`: implemented and verified; record affected paths and commit
- `blocked`: cannot safely proceed; document the exact license, scientific, clinical, data-access or performance gate
- `skipped`: intentionally not implemented because the combination adds no meaningful product value or duplicates a shared implementation; record the reason

The ledger lives in `data/feature-factory/progress.json` and is version-controlled so automated and human work cannot silently lose state.

## Completion definition

The roadmap is complete when every one of the 1000 candidates is either:

- `done` with implementation evidence and tests, or
- `skipped` with a specific documented reason.

A blocked item is not complete. It remains in the queue until the required gate is resolved or an explicit product decision changes it to `skipped` with rationale.
