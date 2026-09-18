# Longitudinal governance core replay

This branch extracts the smallest self-contained governance kernel from stale PR #1744 onto the current repository baseline.

## Included

- immutable patient-scoped longitudinal state and idempotent event ingestion;
- explicit provenance, confidence, capture/receive timestamps and consent envelopes;
- purpose-specific consent ledger;
- clinician-review queue and immutable review ledger;
- minimum-necessary AI context packing;
- governed AI Chatbot / AI-EMR context orchestration;
- audit-manifest export preserving consent, provenance and review state;
- deterministic regression tests for each layer.

## Deliberately excluded

This replay does **not** transplant the old PR's Home/UI, Body Exposure, Motion UI, wearable runtime integration, route convergence, production health-store bridges, workflow files or shared QA changes. Those paths have moved substantially on main and must be handled by their current owners.

## Safety and governance boundary

- subject IDs are isolated at ingestion; cross-subject events fail closed;
- clinical and AI-EMR surfaces exclude review-required clinical events until accepted by the review ledger;
- AI Chatbot context may include consented, non-rejected events before clinical review is complete; this is contextual assistance only and does not authorize a clinical commit;
- rejected events are excluded from AI context;
- purpose consent can revoke visibility independently for personal visualization, clinical support and AI context;
- all generated context packets declare `autonomousClinicalCommitAllowed: false`;
- this kernel does not sign an EMR, place an order, prescribe, diagnose or execute treatment.

## Origin and replay policy

The implementation and tests are replayed byte-for-byte from #1744 head
`bc11bc05ded34343bb4c465f9e1427eb35b3bc88` except for this replay note.

Before opening or merging a PR, synchronize this branch to the latest main after the shared stabilization QA lane settles, run the repository exact-head gates, and perform a fresh overlap/ancestry audit. Never force merge.
