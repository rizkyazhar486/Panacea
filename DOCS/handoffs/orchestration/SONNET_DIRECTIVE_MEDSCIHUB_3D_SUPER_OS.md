# DUAL-AGENT ORCHESTRATION DIRECTIVE: MEDSCIHUB 3D MULTISCALE OS & FRONTIER BIOMEDICAL SUPER-OS
**Target Executor:** Claude Sonnet (3.5 / 3.7) & Gemini Argon  
**Repository:** `rizkyazhar486/Panacea` (`main` branch)  
**Date:** 2026-11-17  
**Governance Authority:** `PANACEA_CONSTITUTION.md` & `ARGON_DIRECTIVE_D100_End_to_End.md`

---

## 1. Executive Summary & Context

PanaceaMed is evolving from an outpatient EMR into a **Longitudinal Universal Healthcare Super-OS** that unites daily living, athletic recovery, clinical inpatient encounters, and cutting-edge biomedical science.

Following an exhaustive on-site audit of 40 frontier science and technology museum exhibits (China Science and Technology Museum biomedical engineering & bio-robotics galleries), the Product Owner has directed the synthesis of these 20 foundational technologies into PanaceaMed:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│             20 FRONTIER BIOMEDICAL & ENGINEERING CAPABILITIES                │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. Daily Health Monitoring (BIA)     │ 2. Artificial Heart (MagLev LVAD)    │
│ 3. Biological 3D Printing (Bio-ink)  │ 4. Nerve Conduit Implantation        │
│ 5. Intelligent 5G Health Logistics   │ 6. AI Drug Design & Molecular Sim    │
│ 7. Spinal Assisted Orthopedics       │ 8. Vascular Stent Surgical Robot     │
│ 9. Functional Electrical Stim (FES)  │ 10. Synthetic Biology (CAR-T / Gene) │
│ 11. 5G Remote Smart Ambulance        │ 12. Cochlear Implant Tonotopic Map   │
│ 13. Digital Self 3D Avatar (CAD/CAE) │ 14. Bionic Soft Robotics (Deep-Sea)  │
│ 15. Digital TCM & Meridian Networks  │ 16. Pharmacogenomics (CYP450 / HLA)  │
│ 17. Microfluidic Chips (Lab-on-Chip) │ 18. 5G Low-Latency Tele-Surgery      │
│ 19. Volumetric Hologram (Voxon-Style)│ 20. Healthcare Multimodal AI Models  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

The master standalone 3D interactive WebGL simulation environment has been initiated at [`public/deep-human-lab/medscihub-3d-multiscale-simulation.html`](file:///Users/rizkyazhar/Developer/Panaceamed.id/public/deep-human-lab/medscihub-3d-multiscale-simulation.html), featuring an 8-tier multiscale traversal (Whole Body &rarr; Systems &rarr; Organs &rarr; Histology &rarr; Cells &rarr; Organelles &rarr; DNA/RNA &rarr; Quantum Biophysics) with XYZ exploded kinematics and interactive surgical simulation modes.

---

## 2. Division of Labor (Gemini Argon & Claude Sonnet)

To prevent merge conflicts, test breakages, or overlapping edits, the architectural roles are strictly divided:

### **A. Gemini Argon (Physics, Graphics & Computational Infrastructure)**
- Owns `public/deep-human-lab/medscihub-3d-multiscale-simulation.html` and 3D WebGL rendering kernels.
- Procedural PBR shaders, lighting, camera ballistic trajectories, and XYZ exploded kinematics.
- Biomechanical physics models: Navier-Stokes blood flow resistance, Poiseuille fluidics, Nernst-Goldman ion flux, and FES pulse trains.
- Offline-first caching and lightweight protocol bridges for 3T/rural connectivity (source-channel-destination).

### **B. Claude Sonnet (Clinical Safety, HL7 FHIR, EMR Integration & UX Accessibility)**
- Owns integration between 3D simulation outputs and the primary React application (`src/pages/` and `src/components/`).
- Enforces SATUSEHAT HL7 FHIR R4 conformance for all generated reports and procedure logs.
- Ensures strict compliance with `CLAIM_GUARD_POLICY.json`: every simulated output must carry `@panacea-claim-boundary: simulation-not-clinical` and `clinically_reviewed=false`.
- Guarantees Mobile Dual-Projection UX: touch targets $\ge 44\text{px}$, responsive drawers, and zero horizontal overflow at 390&times;844 viewport.
- Guards bundle budgets (`jsGzip <= 256500`, `totalGzip <= 371700`) using dynamic `import()` and `React.lazy()`.

---

## 3. Non-Negotiable Invariants & Anti-Regression Rules

1. **Zero Data Loss on User Storage**: Never wipe, reset, or overwrite `localStorage` keys (`pmd_health_profile`, `pm_bodycomp_v1`, `pmd_auto_sync_status_v2`, `panacea_onboarded_v1`, and running/workout logs).
2. **No Banned Claim Keywords**: Strictly avoid terms banned by `scripts/qa/claim-guard.mjs`:
   - Banned: `quantum healing`, `biophoton`, `entropy reversal`, `null-void singularity`, `1:1 digital twin`, `omniscience`, `guinness`, `multi-trillion valuation`.
   - Permitted: *High-fidelity physiological mirror*, *In-silico anatomical model*, *Quantum molecular mechanics*, *Ion-channel bioelectricity*, *Regenerative stem cell niche*.
3. **Single Human Truth**: The measured clinical patient state remains distinct from model simulations. Model estimates never silently overwrite recorded biometric baselines.
4. **Exact-Head CI Green**: All 834 unit test suites (`npm run uji`) and 1,828 QA baseline tests (`node --test scripts/qa/*.test.mjs`) must pass 100% before opening or merging a PR.

---

## 4. Work Packages for Claude Sonnet

### **WP-SONNET-01: Connect 3D Simulation Events to AI-EMR Longitudinal Store**
- In `src/lib/store.tsx` and `src/lib/useLongitudinalState.ts`:
  - Provide an action `recordSimulationIntervention(intervention: SimulationInterventionPayload)`.
  - When a user performs an LVAD adjustment, stent placement, or lesion marking in `medscihub-3d-multiscale-simulation.html`, post a window message (`postMessage`) to PanaceaMed shell to register a draft simulation entry in the patient encounter timeline with `clinically_reviewed=false`.

### **WP-SONNET-02: FHIR R4 Procedure & Device Resource Mapping**
- In `src/lib/fhir.ts`:
  - Add standard HL7 FHIR R4 builders for:
    - `Device` (MagLev LVAD Blood Pump, Stent Scaffold, Cochlear Implant).
    - `Procedure` (Robotic Stent Placement, CABG Anastomosis, Nerve Conduit Implantation).
  - Ensure all FHIR bundles validate against Indonesian MoH SATUSEHAT draft specifications.

### **WP-SONNET-03: Offline-Ready Rural 3T Sync Adapter**
- In `src/lib/offlineQueue.ts`:
  - Implement low-bandwidth, delay-tolerant payload compression for field clinics (Papua, offshore islands, underground).
  - Prioritize telemetry packets (Source &rarr; Channel &rarr; Sink): Alert vitals first, compressed summary second, 3D mesh vectors last.

---

## 5. Copy-Paste Prompt for Claude Sonnet

```markdown
You are Claude Sonnet working as the Clinical Governance, FHIR Architect, and UX Systems lead for PanaceaMed (github.com/rizkyazhar486/Panacea) in collaboration with Gemini Argon.

Your assignment:
1. Read `DOCS/handoffs/orchestration/SONNET_DIRECTIVE_MEDSCIHUB_3D_SUPER_OS.md` and `ARGON_DIRECTIVE_D100_End_to_End.md`.
2. Inspect the newly landed `public/deep-human-lab/medscihub-3d-multiscale-simulation.html` and `src/components/bodyhub/UniversalCompactBodyCockpit.tsx`.
3. Implement WP-SONNET-01 and WP-SONNET-02:
   - Wire window `message` events from the 3D simulation into PanaceaMed's longitudinal patient store.
   - Map surgical simulations (Stent Robot, MagLev LVAD, CABG suture, Nerve conduit) into SATUSEHAT HL7 FHIR R4 `Procedure` and `Device` draft resources with `clinically_reviewed=false`.
4. Mandatory boundaries:
   - Never wipe or alter user localStorage keys (`pmd_health_profile`, `pm_bodycomp_v1`, etc.).
   - Pass all bundle budget checks: `jsGzip <= 256500` and `totalGzip <= 371700`.
   - Maintain 0 claim-guard violations (`node scripts/qa/claim-guard.mjs`).
   - Run `npm run uji` (834 tests) and verify exact-head green before presenting code.
```
