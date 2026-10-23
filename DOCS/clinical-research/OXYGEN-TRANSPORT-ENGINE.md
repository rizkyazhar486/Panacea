# Oxygen Transport Domain Engines

**Status:** implemented literature-anchored cross-system slice on the Physiological Runtime. These engines calculate from explicit boundary/model inputs; they do not diagnose hypoxia, prescribe oxygen/transfusion/ECMO settings, or infer unmeasured patient physiology.

Code:
- `src/lib/physiology/oxygenTransportEngine.ts`
- `src/lib/physiology/cardiovascularIdentityEngine.ts`
- `src/lib/physiology/oxygenContentConventions.ts`

Gate: `scripts/uji/oxygen-transport-engine.mts`.

## Computational chain

```text
HR + LV EDV + LV ESV
        |
cardiovascular.identities
        |
       CO -------------------+
                             |
Hb + SaO2 + PaO2             |
        |                    |
oxygen.arterial-content      |
        |                    |
       CaO2 -----------------+
              |
oxygen.systemic-delivery
              |
             DO2
```

The runtime dependency graph determines execution order; engine registration order is irrelevant.

## Formulas

Cardiac output is inherited from the canonical hemodynamic implementation:

[
SV = EDV - ESV
]

[
CO = \frac{HR \times SV}{1000}
]

Arterial oxygen content uses the named default convention `panacea-clinical-effective-v1`:

[
CaO_2 = 1.34\,Hb\,SaO_2 + 0.003\,PaO_2
]

with Hb in g/dL, saturation as a fraction and PaO2 in mmHg, producing mL O2/dL.

Systemic oxygen delivery:

[
DO_2 = 10\,CO\,CaO_2
]

because (CO) is L/min while (CaO_2) is mL O2/dL.

## Uncertainty propagation

For independent input 1-SD uncertainties:

[
\sigma_{CaO_2}
=
\sqrt{
(1.34\,SaO_2\,\sigma_{Hb})^2
+
(1.34\,Hb\,\sigma_{SaO_2})^2
+
(0.003\,\sigma_{PaO_2})^2
}
]

[
\sigma_{DO_2}
=
10\sqrt{
(CaO_2\,\sigma_{CO})^2
+
(CO\,\sigma_{CaO_2})^2
}
]

If required input uncertainty is unknown, downstream uncertainty remains unknown rather than fabricated.

## Provenance

`arterial.oxygen_content` has only Hb/SaO2/PaO2 parent state ids.

`systemic.oxygen_delivery` has exactly two computational parents:
- `cardio.cardiac_output`;
- `arterial.oxygen_content`.

The oxygen-content provenance records the exact named coefficient convention in `parameterSetId`.

## Evidence boundary

NCBI/StatPearls Oxygen Transport (NBK538336; PMID 30855920) describes oxygen delivery as cardiac output times arterial oxygen content and gives the empirical CaO2 relationship using 1.34 and 0.003.

The ELSO VV 2021 verbatim convention remains separately registered and non-executable in the shared runtime because of its printed unit ambiguity. The existing ECMO simulator remains on its versioned local convention until explicitly recalibrated.

This is a mechanistic calculation layer, not clinical validation.
