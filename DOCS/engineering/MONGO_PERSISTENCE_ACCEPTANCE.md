# Mongo save ordering and application restart acceptance

All in-process Mongo snapshot writes run through one promise queue, including
initial migration and debounced saves. The existing 400 ms debounce is preserved.
`flushStore()` drains the pending debounce, already active writes and mutations
queued while awaiting them. Slice deletion from an older snapshot cannot run
after a newer in-process save. File-only serialization and persistence failure
diagnostics retain their existing behavior.

`node --test scripts/qa/mongo-save-drain.test.mjs` executes the actual production
scheduling functions extracted through the TypeScript AST. Only disk, timer and
Mongo I/O boundaries are replaced. It checks suspended writes, stale snapshot
deletion, changes during drain, simultaneous drain callers, debounce coalescing,
file mode and observable failure followed by recovery. The baseline functions
fail four regression contracts; the patched functions pass all six tests.

The separate `Mongo Persistence Acceptance` workflow uses an official pinned
Mongo image and `server/uji/mongoRestart.uji.ts`. Its writer and reader are
separate application processes with different local data files. The writer uses
the real lab/referral service and repository ports; the reader checks identity,
values, statuses, provenance and valid audit hashes after reloading from Mongo.
File fallback cannot pass. Only an explicitly supplied loopback Mongo URI is
accepted, and the fixture drops only its own randomly named synthetic database.

To run against a disposable local Mongo service, from `server/`:

```sh
PANACEA_TEST_MONGO_URI=mongodb://127.0.0.1:27017 npx tsx uji/mongoRestart.uji.ts
```

This acceptance verifies application-process restart and single-process write
ordering. It does not certify clinical decisions, restore previously lost data,
or establish cross-process transaction isolation. Mongo failures remain visible
through the existing persistence diagnostics; a completed drain is not itself
proof that a failed database operation became durable.
