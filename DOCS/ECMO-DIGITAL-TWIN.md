# ECMO Digital Twin — status ledger

Owner prompt: "PANACEA ECMO DIGITAL TWIN" (2026-09-26). Parent directive: `docs/body-exposure/HUMAN_DIGITAL_TWIN_GOLD_STANDARD.md`.
Wording rule: "evidence-informed and aligned with published ELSO guidance". Never "ELSO-endorsed/certified".

## Where it lives

| Layer | Path |
|-------|------|
| Evidence + scientific-model registry | `src/lib/ecmo/bukti.ts` |
| O₂ transport (ODC, content) | `src/lib/ecmo/oksigen.ts` |
| Engine (VV, peripheral VA, CO₂, causal trace) | `src/lib/ecmo/mesin.ts` |
| Lumped-parameter circulation + centrifugal pump | `src/lib/ecmo/sirkulasi.ts` (gate `scripts/uji/ecmo-sirkulasi.mts`) |
| UI (reads state only) | `src/components/PanelEcmo.tsx`, mounted in Body Exposure → Physiology |
| Numerical + golden physiological gate | `scripts/uji/ecmo-kembaran-digital.mts` |
| Organ perfusion (kidney, brain, splanchnic, limb) | `src/lib/ecmo/organ.ts` (gate `scripts/uji/ecmo-organ.mts`) |

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
| 2 | Lumped-parameter cardiovascular engine | done: time-varying elastance LV/RV (reuses `hemodinamik.ts`), R–C vessels, split aorta, dt-independent, mass-conserving; normal bands and CS criteria locked by tests |
| 3 | O₂/CO₂ transport | done at steady state (CO₂ membrane term illustrative) |
| 4 | Circuit engine | done except temperature: RPM → head → flow through drainage/oxygenator/return segments; drainage, pre-/post-oxygenator pressures and ΔP (shown vs the circuit's own baseline); suck-down. Scale anchored to Condello 2023 (device-specific) |
| 5 | VV ECMO | done at steady state |
| 6 | VV recirculation | done (illustrative geometry model; content method exact; saturation method shown to overestimate) |
| 7 | Peripheral VA | done at model level: VA flow comes from the circulation; oxygen partition uses the derived native LV output |
| 8 | Dual circulation / mixing point | done as plug-flow partition with illustrative branch fractions |
| 9 | Heart / LV loading | done: VA flow ↑ → MAP ↑, LVESV/PCWP ↑, pulse pressure and aortic-valve opening ↓; LV P–V loop and aortic waveform drawn from state. Unloading devices not yet |
| 10–15 | Lungs (mechanics), brain, kidney, liver, limb, hematology | kidney: RPP = distal MAP − CVP, illustrative autoregulation, creatinine by Chen 2013 mass balance (slow, projected); brain: head–neck DO₂ from the VA partition + PaCO₂ direction (ICP/CPP not modeled); splanchnic DO₂ + CVP; limb: residual lumen from cannula size + DPC (direction per Marbach 2022). Lung mechanics, liver synthetic function, hematology not started |
| 16–18 | Cannulation, ultrasound, ICU scene | not started |
| 19 | Body Exposure 3D overlays | not started (2D schematics only) |
| 20–21 | Crisis scenarios, weaning | first crisis: progressive oxygenator thrombosis over hours (ΔP ↑, flow ↓, drainage less negative, gas transfer ↓, dual-circulation shift) — rate illustrative. Others and weaning not started |
| 22 | Explanations | done: causal trace generated from state differences |
| 23 | Conference mode | not started |
| 24 | Validation suite | numerical + directional golden tests; sabotaged |
| 25 | Expert review | **external** — requires real intensivist, cannulating surgeon, perfusionist |

## Model-vs-literature notes

- Peripheral VA direction (LV/LA loading and PCWP rise with pump speed) agrees with De Lazzari 2025 (CARDIOSIM) and ELSO VA 2021; magnitude is smaller here (LVEDV +1–2% vs ≈14% in CARDIOSIM at 3000 rpm).
- RA is now a separate compartment: central VA drains the RA, peripheral drains the femoral/IVC compartment. At matched flow central gives lower PCWP and PAP, and PAP falls with central RPM but rises with peripheral (agrees with De Lazzari 2025). Still disagreeing: central PCWP stays above the untreated baseline (CARDIOSIM: falls) and peripheral RVEDV falls (CARDIOSIM: rises).
- Pump scale: ~4250 rpm → 3.5 L/min in the drainage-limited shock patient (CVP ≈ 1), vs 4.5 L/min in Condello 2023's clinical series.
- Shock scenario = LV Ees 30% + 350 mL compensatory volume; meets SBP < 90, PCWP > 15, CI < 2.2 (BSA 1.9 m² assumed).

- Creatinine: with production taken from a 70 kg steady state (≈1.4 g/day) and Vd = 0.6·weight, anuria raises Cr ≈3.4 mg/dL/day — a physical consequence of the stated inputs, often higher than bedside rises where residual filtration persists.

## Next increment

More crisis scenarios on the same engine (drainage insufficiency/chatter, pump failure, sweep gas failure, LV distension) and VV hemodynamic coupling.
