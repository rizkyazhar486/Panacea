# Calculator source record and not-reviewed label (ENG-C6-03, partial)

`governance/CALCULATOR_REVIEW_REGISTRY.json` now carries a `source` record for every one of the 47 engines, checked by `scripts/uji/calculator-source-label.mts` (part of `npm run uji`). The criterion stays **NOT_RUN**: eight source records remain incomplete and formula/unit display is not machine-checked.

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
| published | 27 | the engine header cites author and year (often journal and pages) |
| named-method | 6 | the header names a method (Holliday-Segar, Parkland, Naegele, ...) with no citation |
| unattributed | 2 | the header names no source |
| arithmetic | 5 | arithmetic on user-entered values, no clinical claim |
| repo-heuristic | 7 | repo-defined model (hydration, sleep debt, caffeine, glycogen timing), not published |

31 distinct pages render the 47 engines; none lacks the label.

## Negative controls (real files, each reverted)

- label component removed from the FeNa page: `fena: pages/clinical/scores/FenaCalculator.tsx` is named.
- FeNa header citation changed to a different year: `fena: anchor-not-in-engine-header`.
- one registry entry loses its `source`: `centor: source-missing`.
- the FeNa page given `clinicianReviewed: true`: the page is named.
- built-in pairs: a page without the label, a page that does not import the engine, and a non-page module are each classified correctly.

## Why ENG-C6-03 is not PASS

- Eight engines still have neither a verified publication record nor a declared repo heuristic: aaGradient, fletcher, idealBodyWeight, mcdonaldRule, midParentalHeight, naegele, parkland and widmarkBac. The owner rule permits a verified source or an explicit heuristic declaration; unknown citations are never invented.
- The live source suite now reports 27 published sources, of which 26 carry a PubMed lookup; NEWS2 has an explicit unindexed RCP-report record. Lookup fields are checked offline against the stored citation/header and identifier; the suite cannot continuously re-check PubMed. The source record and its boundary label are shown to users through the shared disclosure component.
- The suite checks source disclosure and not-reviewed labels on consuming pages, but does not yet mechanically verify every displayed formula and unit.
- All 47 engines remain `clinically_reviewed=false`. Source transparency and engineering checks do not constitute clinical validation.

## Temporary Claude takeover — 2026-10-24, four-engine slice

Owner authorized Codex to continue Claude's work during the usage limit. Baseline main: `9db6b04e2e69794cf7cf320c59e41cf3cc275990`. The live suite reports 12 incomplete source records before this slice and 8 after. ENG-C6-03 remains NOT_RUN; all 47 `clinically_reviewed` flags remain false. No calculator equation, threshold, units, page action or authorization changes.

- `waistToHeight`: Ashwell M, Gibson S. BMJ Open. 2016;6:e010159. PMID [26975935](https://pubmed.ncbi.nlm.nih.gov/26975935/), DOI [10.1136/bmjopen-2015-010159](https://doi.org/10.1136/bmjopen-2015-010159). PubMed metadata and rights-eligible [PMC4800150](https://pmc.ncbi.nlm.nih.gov/articles/PMC4800150/) full text were retrieved on 2026-10-24. Methods explicitly uses WHtR <0.5, >=0.5 to <0.6 and >=0.6 in 1,453 UK adults. The equation is waist circumference / height with matching units; this supports the existing boundaries, not a calibrated individual risk probability or validation in children. The input sanity bounds are repo-defined.
- `bloodDonationScreen`: declared **repo heuristic — no clinical source** for this assembled 17–65-year, 50-kg, 12-week screen and generic deferral flags. The shared source disclosure now explicitly disclaims WHO/PMI/national-service endorsement and defers actual eligibility to the blood service.
- `fluidElectrolytes`: declared **repo heuristic — no clinical source** for the combined worksheet. Named published component methods do not validate its combined outputs. The already documented mismatch between the 140 mEq/L infusate constant and the page's 0.9% saline description is disclosed, not silently corrected or clinically approved.
- `pediatricDka`: declared **repo heuristic — no clinical source** for the composite 48-hour fluid/potassium/insulin worksheet; a published Holliday-Segar component does not establish protocol validation. No dose or algorithm is altered.

The completeness ratchet shrinks only by these four IDs; no baseline grows and no test is removed. Remaining IDs: aaGradient, fletcher, idealBodyWeight, mcdonaldRule, midParentalHeight, naegele, parkland, widmarkBac. Bibliographic identity for Baxter/Shires 1968 (PMID 4973463) and Tanner et al. 1970 (PMID 5491878) was found, but those engines are left unchanged because the retrieved metadata alone does not establish every implemented constant or applicability boundary.
