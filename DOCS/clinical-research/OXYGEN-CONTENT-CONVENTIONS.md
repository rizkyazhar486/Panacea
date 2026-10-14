# Oxygen Content Convention Registry

**Status:** implemented unit-explicit evidence registry and calculation gate. This registry resolves silent coefficient drift; it does not yet migrate the existing ECMO engine.

Code: `src/lib/physiology/oxygenContentConventions.ts`  
Gate: `scripts/uji/oxygen-content-conventions.mts`

## Why this exists

Panacea already contained two oxygen-content coefficient families:

- `src/lib/hemodinamik.ts`: 1.34 mL O2/g Hb and 0.003 mL O2/dL/mmHg;
- `src/lib/ecmo/oksigen.ts`: 1.39 and 0.0034, derived from the ELSO VV 2021 evidence path.

Treating these as interchangeable silently changes calculated oxygen content and downstream delivery. The Computational Human Platform therefore makes the convention itself a versioned scientific object.

## Default executable convention

`panacea-clinical-effective-v1`

[
CaO_2 = 1.34 \times Hb_{g/dL} \times SaO_2 + 0.003 \times PaO_2
]

Output: mL O2/dL.

This exactly matches the currently validated `hemodinamik.ts` chain and the empirical clinical convention described by NCBI/StatPearls Oxygen Transport (NBK538336; PMID 30855920).

Example:

[
Hb=15, SaO_2=0.98, PaO_2=100
\Rightarrow CaO_2=19.998\;mL/dL
]

## Named theoretical convention

`theoretical-hufner-v1`

[
CaO_2 = 1.39 \times Hb_{g/dL} \times SaO_2 + 0.0031 \times PaO_2
]

The 1.39 coefficient represents the theoretical Hüfner oxygen-binding capacity. It remains a named alternative, not an invisible replacement for the clinical-effective convention.

Evidence anchors:
- Gorelov, theoretical Hüfner constant, DOI 10.1111/j.1365-2044.2004.03598.x;
- PMID 32789608 for a published oxygen-content formulation using 1.39 and 0.0031.

## ELSO VV 2021 verbatim record

`elso-vv-2021-verbatim` is deliberately **non-executable**.

The ELSO VV guideline (PMID 33965970; PMCID PMC8315725) prints an oxygen-content expression with Hb labelled in g/L, a 1.39 coefficient, and a 0.0034 dissolved term. If the two terms are interpreted using their usual dimensions, the bound term and dissolved term are not in one common volume basis. The same guideline later illustrates Hb in g/dL.

Panacea preserves this source exactly as an evidence/provenance record but refuses to execute it until an explicit normalization policy is chosen and validated. This is preferable to silently assuming that either the unit label or coefficient is a typo.

## Unit normalization

The executable API accepts Hb in either g/dL or g/L and explicitly normalizes to g/dL before calculation. Saturation must be a fraction in [0,1], and PO2 must be non-negative.

## Migration boundary

Current status:
- `hemodinamik.ts` is locked to the default registry convention by deterministic QA.
- `ecmo/oksigen.ts` remains on its existing local 1.39/0.0034 convention so existing ECMO calibration/golden tests are not silently changed.
- future shared O2-transport engines must import this registry rather than hand-type coefficients.
- migrating ECMO requires an explicit versioned recalibration and comparison run; it is not a search-and-replace.
