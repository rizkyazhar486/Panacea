# Numeric display state

Nutrition's former `ANum` read formatted DOM text with `Number(text) || 0`. React had already rendered the target, so updates skipped their intended animation. Missing or malformed display text could also be treated as zero.

The reusable `AnimatedNumber` tracks finite numeric display state directly and updates before paint. Missing/nonfinite values display unavailable; explicit zero is valid. It retains the existing 500 ms visual easing and formatting precision without changing nutrition formulas or input ranges. Reduced-motion preferences settle immediately. Nutrition keys the component by account and selected patient, so an identity change cannot interpolate through the previous subject's displayed value. This is visual state, not a medical measurement or data-authorization mechanism.

```sh
node scripts/qa/animated-number-smoke.mjs
npm run uji
npm run build
```

The browser test bundles and renders the actual component, records real DOM intermediate frames, and checks unavailable/zero transitions, keyed subject reset and reduced motion. `ANIMATION_QA_COMPONENT` permits baseline substitution for a reproducible old-component failure. It is component-only evidence, not full Nutrition-page E2E, clinical validation or production delivery. No DOM coercion is moved into another parser.
