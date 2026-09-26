# ECMO Digital Twin — status ledger

Owner prompt: "PANACEA ECMO DIGITAL TWIN" (2026-09-26). Parent directive: `docs/body-exposure/HUMAN_DIGITAL_TWIN_GOLD_STANDARD.md`.
Wording rule: "evidence-informed and aligned with published ELSO guidance". Never "ELSO-endorsed/certified".

## Where it lives

| Layer | Path |
|-------|------|
| Evidence + scientific-model registry | `src/lib/ecmo/bukti.ts` |
| O₂ transport (ODC, content) | `src/lib/ecmo/oksigen.ts` |
| Engine (VV, peripheral VA, CO₂, causal trace) | `src/lib/ecmo/mesin.ts` |
| UI (reads state only) | `src/components/PanelEcmo.tsx`, mounted in Body Exposure → Physiology |
| Numerical + golden physiological gate | `scripts/uji/ecmo-kembaran-digital.mts` |

The engine runs without React/Three.js and is deterministic (no randomness). Alveolar gas reuses `gasAlveolar.ts`.

## Verified sources (PubMed metadata checked; see registry for status per rule)

- ELSO VV guideline 2021, PMID 33965970 — full text read: O₂ content, DO₂/VO₂ ≈ 5:1 target and ~2:1 supply dependence, effective flow = (Q_ECMO − Q_recirc)/CO, flow < 60% CO often with SaO₂ < 90% in ARDS, sweep raises CO₂ removal, paradoxical desaturation with more flow when recirculation rises.
- ELSO VA interim guideline 2021, PMID 34339398 (metadata).
- Abrams 2015 recirculation review, PMID 25423117 (abstract). Saturation-method formula: **verification against full text pending**.
- Lindholm 2018 VV cannulation, PMID 29732177 (abstract).
- Badulak 2024 dual-circulation position paper, PMID 39557688 (abstract).
- Severinghaus 1979 ODC, PMID 35496 — equation printed in abstract.

## Known unit issue (documented, tested)

ELSO prints `CaO2 = Hb(g/L) × 1.39 × SaO2 + 0.0034 × PaO2`. Taken literally the dissolved term is 10× too small relative to the bound term. The engine uses Hb in g/dL so both terms are mL/dL. `hemodinamik.ts` uses the other convention (1.34/0.003); registering one body-wide choice is a HumanState task.

## Calibration note

The default VV patient (CO 7.5, Q 4, Hb 10, VO₂ 320) sits in the ELSO-typical band (SaO₂ 0.90, SvO₂ 0.60) and is locked by the gate. At Q/CO just below 0.6 the model gives SaO₂ 0.90–0.93, slightly more optimistic than ELSO's clinical association (< 60% often with SaO₂ < 90% in ARDS): complete RA mixing, no hemodynamic coupling and illustrative membrane constants are the likely reasons. Not tuned away; recorded.

## Progress against the 25-step order

| # | Step | State |
|---|------|-------|
| 1 | Evidence registry | done (6 sources, 11 models with status) |
| 2 | Lumped-parameter cardiovascular engine | **not started** — needed for LV afterload/distension, waveforms, VA pulsatility |
| 3 | O₂/CO₂ transport | done at steady state (CO₂ membrane term illustrative) |
| 4 | Circuit engine | partial: flow, membrane O₂/CO₂, pre/post saturation; no pressures, RPM→head curve, temperature |
| 5 | VV ECMO | done at steady state |
| 6 | VV recirculation | done (illustrative geometry model; content method exact; saturation method shown to overestimate) |
| 7 | Peripheral VA | partial: flow partition and oxygenation; no hemodynamics |
| 8 | Dual circulation / mixing point | done as plug-flow partition with illustrative branch fractions |
| 9 | Heart / LV loading | not started (explicitly shown as "not yet simulated") |
| 10–15 | Lungs (mechanics), brain, kidney, liver, limb, hematology | directional CO₂→CBF only; rest not started |
| 16–18 | Cannulation, ultrasound, ICU scene | not started |
| 19 | Body Exposure 3D overlays | not started (2D schematics only) |
| 20–21 | Crisis scenarios, weaning | not started |
| 22 | Explanations | done: causal trace generated from state differences |
| 23 | Conference mode | not started |
| 24 | Validation suite | numerical + directional golden tests; sabotaged |
| 25 | Expert review | **external** — requires real intensivist, cannulating surgeon, perfusionist |

## Next increment

Step 2: a time-stepped lumped-parameter circulation (elastance ventricles, R/C compartments). Reuse `hemodinamik.ts` P-V elastance primitives rather than adding a parallel heart. ECMO becomes a flow path in that network, which unlocks LV afterload/distension, pulsatility and pressure waveforms. Calibrate against published normal adult values with sources in the registry.
