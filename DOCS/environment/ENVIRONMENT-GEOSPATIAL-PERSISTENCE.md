# Environment geospatial persistence

Panacea stores source-backed geospatial tiles/blobs only after the existing Environment OS provenance contract is admitted.

## Admission

Payload persistence is fail-closed:

```text
persist =
  validCanonicalOfflineMetadata
  AND payload.byteLength = declaredByteLength
  AND SHA256(payload) = declaredDigest
```

The persisted record retains source id/version, truth class, source/reference time, forecast target time when applicable, license/authority references, byte length and digest through `EnvironmentOfflineCacheEntry`.

A stale record may remain readable as historical/reference context, but it cannot become current source context when `assessEnvironmentOfflineCacheEntry()` rejects current use.

## Spatial keys

A cache record is explicitly scoped as one of:

- global source data;
- XYZ tile (`z/x/y`), with range validation;
- bounding box, including antimeridian-crossing boxes.

No patient identity is part of the canonical geospatial record. A record whose selection was derived from a user's location is marked `location-derived` and requires a `consentScopeRef`.

## Persistence

`createIndexedDbEnvironmentGeospatialPersistence()` provides the browser persistence adapter with two stores:

- `entries`: canonical record + payload bytes;
- `syncQueue`: persistent retry tasks.

The storage interface remains replaceable so another durable backend can implement the same contract without changing Environment OS semantics.

## Eviction

Capacity eviction is deterministic. Candidates are ordered before least-recently-used tie-breaking as:

1. missing adapter / invalid provenance;
2. not historically readable;
3. historical/stale/not-current;
4. fresh current context.

Pinned records can be protected. The planner stops when both constraints are satisfied:

```text
remainingBytes <= maxBytes
AND remainingEntries <= maxEntries
```

If protected pinned data makes the constraints impossible, the plan reports `satisfied = false` rather than silently deleting protected data.

## Sync queue

Only due tasks in `pending` or `failed` state are selected. Higher priority wins, then earlier retry time, then earlier enqueue time.

Retry delay is bounded exponential backoff:

```text
attemptsAfterFailure = attempts + 1
delayMs = min(maxDelayMs, baseDelayMs * 2^(attemptsAfterFailure - 1))
nextAttemptAt = failedAt + delayMs
```

The queue does not itself authorize network access. Source-specific fetch/revalidation adapters still have to satisfy source terms, authorization, privacy and the canonical source-adapter contract.

## Continuation

Next work should:

1. add authorized read-only fetch/parse adapters per source;
2. add source-specific metric/unit mappings before projection into the existing telemetry bridge;
3. connect admitted snapshots to Diving/Adventure/Training and Population Safety through shared longitudinal state;
4. add browser quota-pressure and IndexedDB migration/recovery smoke tests;
5. preserve source licensing, data age, forecast issue/target separation, consent and location privacy.
