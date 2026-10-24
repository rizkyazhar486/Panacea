# Calculator source record, formula, units and not-reviewed label (ENG-C6-03)

`governance/CALCULATOR_REVIEW_REGISTRY.json` carries a `source` record, mathematical `formula`, and output `units` for every one of the 47 engines, checked by `scripts/uji/calculator-source-label.mts` (part of `npm run uji`). The criterion is **PASS** at 6e41038382c82dbaaa6aed45be95c8848d0b4c87 (PR #2764, main 6b2e335f8f0fe8a54674b6888436293cd165022b, Validate changes run 40122462445).

## What is checked

1. Every engine declares a source record with a `kind` and a one-sentence `basis`; an engine with no record fails (`source-missing`).
2. `published` needs a citation and an `anchor`, a string that must appear verbatim in that engine's header comment, so a citation cannot drift away from the code or be added without the code naming it (`anchor-not-in-engine-header`).
3. Any other kind must carry no citation and no DOI/PMID (`unsourced-must-not-carry-citation`, `identifier-without-citation`). An engine whose repo text names no source says so instead of getting one.
4. DOI and PMID, when present, must be well formed.
5. Every engine has at least one page that renders it, and every such page shows the shared claim boundary (`BatasKlaimSkorTerbit` / `BatasKlaimKesehatan`, text "Technical output. Not clinician-reviewed or clinically validated.").
6. No page that renders an engine passes `clinicianReviewed: true`, and the registry has zero reviewed engines, so the label cannot be upgraded by a page on its own.
7. Every engine declares non-empty `formula` and `units` in the registry (`checkCalculatorFormulasAndUnits`), which are rendered in the `<SumberKalkulator>` disclosure on every consuming page.

## Measured result

| kind | engines | meaning |
|---|---|---|
| published | 29 | the engine header cites author and year; 28 carry a PubMed lookup (PMID), NEWS2 an `unindexed` RCP report record |
| named-method | 0 | (was 9) |
| unattributed | 0 | (was 6) |
| arithmetic | 5 | arithmetic on user-entered values, no clinical claim |
| repo-heuristic | 13 | repo-defined model or classic rule whose original source was not found or not verified (declared, never guessed) |

31 distinct pages render the 47 engines; none lacks the label or the source disclosure.

## Negative controls (real files, each reverted)

- label component removed from the FeNa page: `fena: pages/clinical/scores/FenaCalculator.tsx` is named.
- FeNa header citation changed to a different year: `fena: anchor-not-in-engine-header`.
- one registry entry loses its `source`: `centor: source-missing`.
- the FeNa page given `clinicianReviewed: true`: the page is named.
- `fena` registry entry loses its `formula`: `fena: formula-missing`.
- `qtc` registry entry loses its `units`: `qtc: units-missing`.
- built-in pairs: a page without the label, a page that does not import the engine, and a non-page module are each classified correctly.

## Path to ENG-C6-03 PASS

- **Source completeness is done.** `incompleteSources()` returns [] and the suite fails by name if any engine falls back (negative control: `naegele` set to `named-method` -> `actual: [ 'naegele' ]`). Batch 4b (2026-10-24): parkland -> Baxter & Shires 1968 (PMID 4973463); fletcher -> Fletcher 1950 (PMID 14818775, three-frequency index only); waistToHeight -> Ashwell & Gibson 2016 (PMID 26975935, 0.5/0.6 bands checked in PMC4800150 Methods; adopted from Codex draft #2760); the other nine engines declared `repo-heuristic` with the reason in `basis`. PubMed records for Parkland and Fletcher have no abstract, so their constants are not checked against the full text and `basis` says so.
- **Formula and units display is done.** All 47 engines declare explicit `formula` and output `units` in `governance/CALCULATOR_REVIEW_REGISTRY.json`, which are checked by `checkCalculatorFormulasAndUnits` in `scripts/uji/calculator-source-label.mts` and rendered via `<SumberKalkulator>`.
- The suite uses no network, so PubMed matches are a recorded manual check (`lookup` block), not a continuous one.
- All 47 engines remain `clinically_reviewed=false`. Nothing here is a clinical review.
- To record PASS: merge the implementation PR, verify green exact-head CI, and record PASS in `governance/ACCEPTANCE_V2.json` with the CI run ID and SHA.
