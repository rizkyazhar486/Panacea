# Body Toolkit browser storage isolation

The three personal-health tools previously read and wrote unscoped browser keys. A different account using the same browser could therefore see another person's symptom history, skincare routine or activity minutes.

Storage now uses the existing account/self-subject identity parser and `:scope_v1:<encoded identity>` key convention. The mounted account must match the remembered identity. Writes re-check both immediately, so stale callbacks cannot copy data into the new account. Changing identity remounts the tools; cross-tab mismatches, malformed sessions and expired sessions hide their content. Guest changes are ephemeral and never persisted.

Old unscoped data has no attributable owner. Its original bytes remain untouched, but the application does not automatically adopt them. There is no automated migration or clinical approval. A deliberate recovery/import flow that establishes ownership is future work.

Cached records are checked before rendering: supported skincare steps, finite valid symptom entries (at most 30), and finite daily minutes within the existing 0–1440 range. Explicit zero minutes remain visible. The existing daily-log input validator and all three tools are retained. Failed storage writes are reported and do not imply successful persistence.

Run:

```sh
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-toolkit-storage.mts
npm run uji
npm run build
BODY_TOOLKIT_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/body-toolkit-storage-smoke.mjs
```

The browser test uses two synthetic accounts against the actual client, including switching the remembered identity from another tab. It checks legacy non-adoption, isolation and restoration of all three tools, preservation of zero, runtime errors and mobile overflow. Stabilization Acceptance runs this test against its built client. This is browser-cache engineering evidence, not server persistence, tenant authorization, clinical acceptance or human review. Same-origin scripts remain able to access browser storage; this change is not encryption or an XSS defense.
