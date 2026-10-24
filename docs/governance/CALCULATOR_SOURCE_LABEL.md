# Calculator source record and not-reviewed label (ENG-C6-03, partial)

`governance/CALCULATOR_REVIEW_REGISTRY.json` now carries a `source` record for every one of the 47 engines, checked by `scripts/uji/calculator-source-label.mts` (part of `npm run uji`). The criterion stays **NOT_RUN**: only the machine-checkable half is built.

## What is checked

1. Every engine declares a source record with a `kind` and a one-sentence `basis`; an engine with no record fails (`source-missing`).
2. `published` needs a citation and an `anchor`, a string that must appear verbatim in that engine's header comment, so a citation cannot drift away from the code or be added without the code naming it (`anchor-not-in-engine-header`).
3. Any other kind must carry no citation and no DOI/PMID (`unsourced-must-not-carry-citation`, `identifier-without-citation`). An engine whose repo text names no source says so instead of getting one.
4. DOI and PMID, when present, must be well formed.
5. Every engine has at least one page that renders it, and every such page shows the shared claim boundary (`BatasKlaimSkorTerbit` / `BatasKlaimKesehatan`, text "Technical output. Not clinician-reviewed or clinically validated.").
6. No page that renders an engine passes `clinicianReviewed: true`, and the registry has zero reviewed engines, so the label cannot be upgraded by a page on its own.

## Measured result

| kind | engines | meaning |
|---|---|---|
| published | 24 | the engine header cites author and year (often journal and pages) |
| named-method | 9 | the header names a method (Holliday-Segar, Parkland, Naegele, ...) with no citation |
| unattributed | 6 | the header names no source |
| arithmetic | 4 | arithmetic on user-entered values, no clinical claim |
| repo-heuristic | 4 | repo-defined model (hydration, sleep debt, caffeine, glycogen timing), not published |

31 distinct pages render the 47 engines; none lacks the label.

## Negative controls (real files, each reverted)

- label component removed from the FeNa page: `fena: pages/clinical/scores/FenaCalculator.tsx` is named.
- FeNa header citation changed to a different year: `fena: anchor-not-in-engine-header`.
- one registry entry loses its `source`: `centor: source-missing`.
- the FeNa page given `clinicianReviewed: true`: the page is named.
- built-in pairs: a page without the label, a page that does not import the engine, and a non-page module are each classified correctly.

## Why ENG-C6-03 is not PASS

- **19 of 47 engines have no citable source** (named-method, unattributed, arithmetic, repo-heuristic). The criterion asks for a source for every engine; that needs a verified reference found for each, not an invented one.
- **PMID is recorded for 10 of the 24 published engines** (cockcroftGault, correctedCalcium, fena, findrisc, glasgowBlatchford, ldlFriedewald, lightsCriteria, sirirajStrokeScore, stopBang, charlson), each looked up on 2026-10-24 against PubMed by journal, year, volume, first page and first author, then checked against the returned title, authors, journal, year and pages. DOI is recorded for nine of them (ldlFriedewald has none in PubMed). A `lookup` block keeps what PubMed returned; the suite requires it whenever an identifier is present, requires its PMID/DOI to equal the record's (so swapping one side fails by name), and requires its first author and year to appear in the citation the engine header carries. The suite uses no network, so it cannot re-check the lookup: the match to PubMed is a recorded manual check, not a continuous one. The other 14 published engines have no PMID because their citations lack a journal or page (for example 'Maddrey et al. 1978') or name a guideline rather than an article, and were not guessed.
- **The source is not shown to users.** The registry holds it; the pages show the label but not the source line, and this suite does not check that pages show formula and units.
- The label is shown while `clinically_reviewed` is false for every engine. Nothing here is a clinical review.
