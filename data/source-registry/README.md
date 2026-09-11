# Panacea Source Registry

The Source Registry is the provenance, licensing, validation and adapter contract for external scientific and health sources used by Panacea.

It exists to keep this flow explicit:

`Source -> license/provenance gate -> adapter -> normalized Panacea schema -> engine -> UI`

A registry entry is **not** permission to use an asset, dataset or API. It documents what must be true before that source is used.

## Core rules

1. Never hard-code a third-party API directly inside a React page. External data enters through an adapter and a normalized Panacea schema.
2. Preserve source identity. Reference data, computational predictions, provider-derived scores, simulated outputs and patient measurements must remain distinguishable.
3. Never infer a license. If commercial, redistribution or derivative rights are unclear, use `CHECK_REQUIRED` or `UNKNOWN`.
4. Never treat framework/software licensing as permission to redistribute the data or assets rendered with it.
5. Patient, wearable, genomic and imaging data require consent/access-control boundaries separate from public reference data.
6. Clinical correctness is independent of schema/API correctness. Valid FHIR, valid DICOM, valid CellML or a successful API response does not by itself make a clinical conclusion valid.
7. Prefer targeted, lazy or build-time ingestion over shipping large scientific datasets to the browser.

## Adapter maturity

### `PLANNED`
Documentation only. No production code should depend on the source. License, provenance, privacy and normalized target are identified, but an adapter is not implemented.

### `PROTOTYPE`
An isolated adapter may exist for development/research. It must fail closed, retain provenance, avoid production secrets in the browser, and have deterministic fixtures or test cases before promotion.

### `ACTIVE`
Production use is allowed only when all applicable gates below are satisfied. An `ACTIVE` entry must declare `adapter.module`; the registry validator enforces this.

### `DEPRECATED`
No new feature should depend on the source. Existing consumers need an explicit migration/removal path.

### `NOT_APPLICABLE`
The source is documentation, a standard, build-time reference or tooling and does not have a runtime adapter.

## Production promotion gates

Before moving an adapter to `ACTIVE`, verify as applicable:

- source/version is pinned or otherwise reproducibly identified;
- license/terms and commercial-use scope are verified;
- attribution requirements are implemented through UI/export/report paths where required;
- secrets and access tokens are server-side or in the correct native secure boundary;
- consent/revocation/deletion behavior is defined for user-linked data;
- rate-limit, timeout, partial-result and upstream-error handling are explicit;
- normalized units, timestamps, coordinate systems, genome assembly or terminology versions are preserved where relevant;
- raw/source identity survives transformations and derived outputs;
- deterministic fixtures/tests cover parsing and normalization;
- empty/loading/error states exist before user-facing activation;
- clinical or scientific claims are no stronger than the source supports;
- mobile/runtime performance is measured for any large data, mesh, image or visualization path.

## License semantics

- `VERIFIED`: the applicable license/terms were checked and `identifier`, `verificationUrl` and `verifiedAt` are recorded.
- `CHECK_REQUIRED`: useful source, but production rights still require confirmation for the intended use.
- `UNKNOWN`: rights are not sufficiently known.

`commercialUse: ALLOWED` is permitted only with `license.status: VERIFIED`; the validator enforces this. `CONDITIONAL` means product use still depends on contract, attribution, asset-level terms, consent or other stated conditions.

## Scientific validation semantics

`validation.level` describes the source role, not a universal truth score. `trust` dimensions stay separate because authority, evidence quality, recency, license clarity and reproducibility are not interchangeable.

Do not collapse these dimensions into a single clinical confidence score unless a feature-specific, validated method defines the weighting and intended use.

## Source-specific examples

- Anatomy mesh: preserve source asset ID, anatomical ID, transform history, validation status and asset-level license.
- DICOM/medical imaging: preserve study/series/instance identity, coordinate/orientation metadata and derived-object lineage.
- Genomics: preserve reference assembly, release, stable IDs/versions and distinguish predicted consequence from submitted clinical assertion.
- Physiology simulation: preserve model, parameters, solver/version, initial conditions, units and simulation time span.
- Wearables: preserve provider/device origin and distinguish measured observations from provider-derived scores.
- Drug data: keep medication identity, official label provenance and chemical structure sources separate.

## Validation

Run:

```bash
npm run validate:source-registry
```

The normal production build also runs the registry validator before TypeScript/Vite. Validation checks JSON schema conformance plus semantic integrity such as unique source IDs, category/folder consistency, ACTIVE adapter modules, and verified-license requirements.

When a registry check fails, fix the source metadata or implementation contract. Do not weaken the validator merely to make CI green.
