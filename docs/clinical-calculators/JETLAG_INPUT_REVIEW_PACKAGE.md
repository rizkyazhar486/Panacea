# Jet-lag widget input boundary

Status: human review unassigned; clinically_reviewed=false. This is an illustrative timing model, not a measured or individualized recovery prediction.

The existing selector permits whole-hour differences from −12 to +12. Preserve that technical UI range and explicit Same=0; a blank, malformed, fractional, nonfinite or out-of-range saved value is unknown. This does not claim support for every real-world time-zone difference or fractional offset.

The original illustrative model remains absolute hour difference × one nominal day/hour. East/west context and the existing no-melatonin boundary are preserved. Its roughly-one-hour-per-day heuristic is not established here as a clinical prediction for an individual. The displayed duration is labelled illustrative model days; source/clinical applicability requires qualified review.

Departure dates must be real ISO calendar dates; invalid saved dates do not become an already-departed plan or a NaN count. Existing local-calendar day-difference arithmetic remains unchanged for valid dates. Patient-specific circadian factors and medical treatment are outside this widget.

Plans reuse the existing account/self-subject cache adapter: immediate write checks, keyed remount, hiding mismatched/expired remembered sessions, ephemeral guests and no unknown-owner legacy adoption. Original legacy bytes remain untouched. This is browser-cache isolation, not server authorization or encryption.

```sh
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/jetlag-inputs.mts
npm run uji
npm run build
JETLAG_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/jetlag-input-smoke.mjs
```

Tests cover every existing hour option, explicit zero, wrong types/nonfinite/fractional values, paired range boundaries and Gregorian leap/calendar cases. The built-client fixture enables the actual home widget, opens its real disclosure and checks invalid cache, identity isolation/restoration and legacy preservation. Client tests are not clinical or physiological validation. Reviewer credentials/version/date/signature remain unassigned.
