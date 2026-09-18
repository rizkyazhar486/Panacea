# Neural Intent → canonical longitudinal bridge

Phase B does not create a second patient-state store or a new route. It maps the
device-independent IntentEvent kernel into the canonical longitudinal governance
kernel that landed through #1805.

## Evidence identity

Every mapped event retains:
- explicit / observed / decoded / simulated evidence class;
- source kind and source ID;
- effector and action;
- decoder ID/version, decoder confidence and signal quality when present;
- captured/received timestamps;
- original consent lifecycle and tags.

The caller supplies an ingestion confidence. That value describes confidence in
the adapter/ingestion context only; it is not a probability of diagnosis,
disability, intent correctness, motor ability or treatment outcome.

## Governance

- Rejected IntentEvents are not ingested.
- Non-simulated intent enters the canonical `intent` domain with review state
  `pending`. Your Body may visualize the context, but Clinical/AI-EMR remain
  blocked until a qualified review decision is materialized through the existing
  review ledger.
- Simulated intent is tagged `simulated`, has no clinical-support or ai-context
  purpose even if the source envelope accidentally grants them, and therefore
  cannot enter patient clinical/AI context.
- `rehab-tracking` is preserved as a separate consent purpose.
- No autonomous clinical action, diagnosis, order, prescription, or treatment is
  authorized by this bridge.
- No localStorage, network retrieval, hardware access or new top-level route is
  implemented here.

Phase C, if built, must mount inside existing Your Body and consume these governed
projections rather than creating another state authority.
