# Cardiovascular Identity Engine

**Status:** implemented deterministic domain engine for algebraic ventricular identities. It is not a complete cardiovascular digital twin, hemodynamic monitor, diagnostic model or treatment engine.

Runtime: `src/lib/physiology/runtime.ts`  
Engine: `src/lib/physiology/cardiovascularIdentityEngine.ts`  
Gate: `scripts/uji/cardiovascular-identity-engine.mts`

## Purpose

This is the first literature-anchored domain-engine slice on the Computational Human Platform runtime. It deliberately reuses the established calculations in `src/lib/hemodinamik.ts` instead of creating a second cardiovascular formula implementation.

Measured/imported/clinician-entered boundary inputs:

- `cardio.heart_rate` — bpm;
- `cardio.lv.edv` — mL;
- `cardio.lv.esv` — mL.

Model-derived outputs:

- `cardio.lv.stroke_volume` — mL;
- `cardio.cardiac_output` — L/min;
- `cardio.lv.ejection_fraction` — dimensionless fraction.

## Equations

[
SV = EDV - ESV
]

[
CO = \frac{HR \times SV}{1000}
]

where HR is beats/min and SV is mL/beat, so CO is L/min.

[
EF = \frac{SV}{EDV} = 1 - \frac{ESV}{EDV}
]

These are deterministic algebraic identities from supplied boundary values. The engine does not infer HR, EDV or ESV from unrelated wearable signals.

## Uncertainty

When input 1-SD uncertainties are known and treated as independent:

[
\sigma_{SV}=\sqrt{\sigma_{EDV}^{2}+\sigma_{ESV}^{2}}
]

[
\sigma_{CO}=\sqrt{
\left(\frac{SV}{1000}\sigma_{HR}\right)^2+
\left(\frac{HR}{1000}\sigma_{SV}\right)^2}
]

Using (EF=1-ESV/EDV):

[
\sigma_{EF}=\sqrt{
\left(\frac{ESV}{EDV^2}\sigma_{EDV}\right)^2+
\left(\frac{1}{EDV}\sigma_{ESV}\right)^2}
]

If required input uncertainty is unknown, output uncertainty remains `null`; the engine does not manufacture precision.

## Fail-closed domain

Execution rejects:

- HR <= 0;
- EDV <= 0;
- ESV < 0;
- ESV > EDV.

These checks prevent algebraically possible but unsupported input states from being silently emitted as valid model-derived physiology.

## Evidence anchors

- PMID 27598497 — ventricular contractility/ejection volume and load dependence; pressure-volume framework.
- PMID 26436838 — pressure-volume analysis for ventricular systolic/diastolic function and preload/afterload relationships.

These anchors support the physiology framework; they do not make this engine clinically validated.

## Explicitly deferred: oxygen transport

This slice does **not** implement CaO2, DO2 or Fick oxygen transport. The repository currently documents an unresolved body-wide convention difference between `hemodinamik.ts` (Hufner 1.34; dissolved O2 0.003) and the ECMO evidence path (1.39 / 0.0034 with a unit-convention issue). A single evidence-backed body-wide constant registry must be resolved before the new shared runtime exposes oxygen transport.

This is deliberate architectural restraint: reuse and reconcile before adding another formula source.
