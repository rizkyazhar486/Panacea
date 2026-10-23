# LEGACY MIGRATION

The v1 ledger (`governance/ALPHA_ACCEPTANCE_LEDGER.json`: 45 criteria, 38 VERIFIED, 6 REPORTED, 1 DEFERRED) stays **read-only history**. Nothing is deleted, re-labelled or retroactively promoted. v2 has a new denominator ([ACCEPTANCE_V2.md](ACCEPTANCE_V2.md)); its progress is not comparable to v1 percentages and must not be presented as progress on them.

| v1 | v1 status | v2 engineering criteria | v2 external gates | What changed |
|---|---|---|---|---|
| D7 | REPORTED | ENG-D7-1, -2, -3 | EXT-D7-1 | thresholds/realism claim split from geometry & contact tests |
| D8 | REPORTED | ENG-D8-1, -2, -3 | EXT-D8-1, EXT-D8-2 | authorship/licence split from inventory and metadata |
| E4 | REPORTED | ENG-E4-1, -2, -3 | EXT-E4-1, EXT-E4-2 | legal policy and 3rd-party logs split from scanners/redaction |
| E7 | REPORTED | ENG-E7-1, -2 | EXT-E7-1, EXT-PROD-1 | SHA policy and production authority split; staging = roadmap task #6 |
| F1 | REPORTED | ENG-F1-1, -2, -3 | EXT-F1-1, EXT-F1-2 | access policy and real OAuth split from RBAC/E2E |
| F2 | REPORTED | ENG-F2-1 … -6 | EXT-F2-1 | manual UX split from contrast/axe/keyboard/screenshot/UX/bundle |
| C6 | DEFERRED | ENG-C6-1 | EXT-C6-1 | engineering reference tests ≠ clinical validation; deferral preserved |
| other 38 | VERIFIED | not re-listed | — | remain valid as of their evidence; their test suites keep running in CI |

Anti-gaming checks: (a) `scripts/qa/acceptance-v2.test.mjs` fails if any of the seven legacy ids loses its mapping; (b) deferred gates stay listed beside the engineering count; (c) moving a hard item out of the engineering list requires adding it as a deferred gate with its future question and an `activatesWhen` condition.

Honest consequence: deferral changes the workflow, not the facts. v1 statuses stay REPORTED/DEFERRED; nothing here claims they were verified.

Phase F (after owner approval): switch active workflows to the tiers in [STABILIZATION_V2.md](STABILIZATION_V2.md) one at a time; no required check is turned off before its replacement has passed.
