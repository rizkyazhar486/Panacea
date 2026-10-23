# Production longitudinal health bridge replay

Extracted from stale #1744 after the canonical longitudinal governance kernel landed on main through #1805.

This subset intentionally contains only pure production-store adapters and deterministic tests:
- clinical-vital, self-vital, VO2max and current-device snapshot normalization;
- explicit subject scoping;
- clinical-only vs personal-plus-clinical selection;
- caller-supplied consent/confidence/receivedAt policy;
- canonical LongitudinalEvent output and idempotent ingestion.

It does not create a second longitudinal store, does not read localStorage, does not call a network/provider, and does not mount UI. #1745 must be adapted to this canonical boundary rather than transplanting longitudinalPatientState.ts.

Before opening a PR, sync to latest main, rerun exact-head gates, and audit any changes to src/lib/types.ts or src/lib/healthVitals.ts that could affect adapter shape.
