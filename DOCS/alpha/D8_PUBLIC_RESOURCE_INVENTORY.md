# D8 published Body Exposure resource inventory

Owner: Codex Terminal. Base: `0b1ed844e6b731461164a17671213dcefb33015b`.

Acceptance for this change: recursively inventory every file under
`public/bodyexposure`, including rigs, MRI PNGs and JSON datasets; preserve byte
hashes and metadata claims; expose missing claims, unknown licence strings and
unresolved permissions; reject snapshot drift. This is a bounded engineering
slice of D8, not formal D8 verification or a redistribution authorization.

## Reproduce

```sh
node --test scripts/qa/body-public-asset-inventory.test.mjs
node scripts/qa/body-public-asset-inventory.mjs public/bodyexposure bodyexposure/qa_reports/public_resource_inventory.json
```

The committed report records 591 files: 507 GLB, 55 JSON, 27 PNG, one TXT and one
HTML. Enumeration includes nested directories and all rigs. Each record includes
relative path, byte count, SHA-256, claim origin, source/licence claims, findings
and `permissionStatus: not-independently-cleared`. No timestamp, network access,
scene decoding, source geometry changes or model downloads are needed.

The existing `scripts/qa/glb-provenance-audit.mjs` remains the independent
scene/structure metadata audit; `scripts/uji/body-attribution-coverage.mts`
remains the metadata-to-attribution-page coverage test. This inventory complements
those tools. It does not replace them or change their detector patterns.

Claims are collected from explicit `source`, `source_url`, `citation`,
`panacea_source`, `license`, `licence`, and `panacea_license` string fields.
GLB JSON includes named parent metadata; mesh children need not duplicate those
extras. PNGs record the nearest same-directory `manifest.json` claims and its
relative path. This inheritance is a recorded claim, not proof that every image
is legally covered by that manifest. Other files without these structured claims
are reported as missing, including generated review/index documents and the
human-readable attribution documents; that finding does not by itself establish
copyright infringement or absence of human-readable attribution.

## Observed limitations and restrictions

- 51 resources lack a structured licence claim; 47 lack a structured source claim.
  Scope includes support documents: do not interpret these totals as 51
  unlicensed anatomical models. Trace each finding before deciding clearance.
- 289 resources carry ICRP Publication 145/156 claims. Existing project-owner
  clearance assertions are retained verbatim in source metadata. They are not
  independently verified rightsholder grants.
- `fetal_reference_tables.json` includes INTERGROWTH/Oxford material with reuse
  terms explicitly unstated; it is flagged independently of its WHO CC-attribution
  material. Attribution and availability for download do not establish permission
  for derivative redistribution or commercial use.
- The short licence-string recognizer distinguishes familiar from unfamiliar
  claims only. It is not an SPDX parser, source-to-licence rights resolver,
  contract interpreter, or permission validator. Even recognized claims remain
  `not-independently-cleared`.
- This bounded inventory excludes other public directories, external dependencies,
  npm packages and source-only datasets. Full D8 still needs those surfaces,
  asset-specific primary rights evidence and appropriate publication restrictions.
- The CLI snapshot check proves equality to the recorded bytes/claims. Zero
  snapshot differences does **not** mean zero rights issues. Existing rights
  findings are deliberately preserved in the report instead of hidden to make
  a permission gate pass.

Primary pages inspected 2026-10-16:

- [ICRP Publication 145](https://www.icrp.org/publication.asp?id=ICRP+Publication+145)
  identifies the adult mesh phantoms and publication copyright; no derivative
  redistribution grant was found in that page's available text.
- [ICRP Publication 156](https://www.icrp.org/publication.asp?id=ICRP+Publication+156)
  identifies the paediatric mesh phantoms; no derivative redistribution grant
  was found in that page's available text.
- [INTERGROWTH standards/tools](https://intergrowth21.tghn.org/standards-tools/)
  provides standards/resources and copyright notice. That page alone does not
  establish a redistribution grant for the transcribed Oxford tables.

These observations are limited to the cited pages, not assertions that no
permission exists elsewhere. Do not publish additional ICRP/Oxford derivatives
on assumed permissions. Source-rights evidence and release restrictions remain
unresolved; this change does not alter deployment or silently delete any asset.

## Regression evidence

The tests cover nested non-GLB resources, manifest-origin claims, parent GLB
metadata, deterministic hashes, missing attribution, unknown licence strings,
ICRP/Oxford restrictions, malformed input, symlink rejection, and paired
unchanged/modified/deleted/new resource checks. The committed resource snapshot
is replayed by the ordinary `scripts/qa/*.test.mjs` test glob, so a new file,
removed resource, changed asset or changed attribution requires explicit evidence
regeneration and review. Report regeneration itself never clears legal findings.

Formal D8 remains `REPORTED`. No clinical or legal approval is asserted.

## Independent engineering review

The coordinating Codex agent independently reviewed this candidate and identified
(1) an unanchored familiar-licence substring recognizer and (2) a PNG handler
that could read a symlinked manifest before recursive traversal rejected it.
Both findings were repaired: licence recognition now requires the complete
supported string, with conditional/negated/noncommercial strings explicitly
reported as unrecognized; the PNG handler checks manifest file type before
reading. Paired adversarial licence cases and an image-sorts-before-manifest
symlink negative control reproduce these findings. All twelve focused tests
pass after repair. This AI engineering review establishes neither rightsholder
permission nor legal/clinical approval.
