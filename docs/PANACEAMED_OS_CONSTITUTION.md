# PANACEAMED OS — CONSTITUTIONAL MASTER ARCHITECTURE & ENGINEERING DIRECTIVE
**Classification:** Canonical System Specification (v3.0 — Living OS Blueprint)  
**Target Executors:** Frontier Agentic Coding CLIs & Autonomous Multi-Agent Workflows (Claude Code, Gemini CLI, OpenAI Codex, Antigravity)  
**Scope:** End-to-End Clinical Operating System, 1:1 Personified WebGPU Digital Twin (`BodyExposure`), Longitudinal Automated EMR (`SATUSEHAT / FHIR R4`), Mechanistic GPU Physiology & Pharmacology Simulator, and *Et Causalis* Preventive Intelligence Engine.

---

## SECTION 0: THE CIVILIZATIONAL MANDATE & HIPPOCRATIC CONSTITUTION

### 0.1 Core Thesis
Modern medicine suffers from a catastrophic **epistemic asymmetry**: biological truth happens in four-dimensional, interconnected, dynamic human physiology, yet healthcare communicates it through fragmented, static, text-heavy records that patients cannot comprehend and physicians lack time to translate.

**PanaceaMed OS** exists to dismantle the knowledge gap between clinician and patient. Its singular civilizational purpose is to unify daily wearable telemetry, clinical diagnostics, electronic medical records, mechanistic pharmacology/vaccinology, and preventive foresight into **one living, 1:1 personified anatomical reality engine**—so a patient literally *sees* what is happening inside their own body, understands *why* it is happening through daily causal patterns, and observes *how* today's habits, medications, or vaccines alter their future trajectory.

### 0.2 The Seven Immutable Constitutional Laws
Every line of code, shader, algorithm, database schema, and UI component MUST obey these seven laws without exception. Any pull request or agent commit violating these laws is automatically invalid:

1. **LAW I — Primum Non Nocere (Clinical Safety Above Visual Drama):** Never exaggerate pathology to induce fear, and never minimize red-flag clinical deterioration for aesthetic smoothness. Every visualization must clarify reality, preserve psychological dignity, and prioritize patient safety.
2. **LAW II — Strict Epistemic Provenance (Zero Ambiguity Between Fact and Forecast):** Every data point, glowing anatomical overlay, chart curve, and text statement MUST bind to an immutable provenance tag:
   - `OBSERVED_CLINICAL` — Verified laboratory assay, imaging, physical exam, or medical-grade device reading.
   - `OBSERVED_CONSUMER` — Consumer wearable telemetry (Apple Watch, Garmin, WHOOP, Amazfit) or patient self-report; explicitly modeled with device confidence margins and NEVER mislabeled as a clinical diagnosis.
   - `CLINICAL_RECORD` — Physician-authored diagnosis, prescription, immunization, or care plan.
   - `MECHANISTIC_SIMULATION` — Deterministic or probabilistic physiological/pharmacological simulation (mandatory uncertainty band, model version, and assumptions inspectable in one click).
3. **LAW III — Et Causalis Integrity (Zero Black-Box Outputs):** PanaceaMed OS never emits naked scores (e.g., "Heart Risk: 74") without an inspectable causal chain: `[Daily Behavioral / Telemetry Pattern] → [Physiological Mechanism] → [Anatomical Target & Biomarker Shift] → [Projected Longitudinal Outcome] → [Evidence-Graded Preventive Counterfactual]`.
4. **LAW IV — Doctor-in-the-Loop Sovereignty:** Patient Mode builds comprehension, adherence, and evidence-based lifestyle prevention. Clinical diagnosis, prescription authority, dosing modifications, and invasive intervention decisions remain strictly anchored to licensed clinicians.
5. **LAW V — Dual-Density Universal Accessibility (The 5-Second / 1-Click Standard):**
   - **Patient Surface:** A non-technical elderly parent must look at their 1:1 body and grasp *(1) what is happening now, (2) why it connects to their recent days, and (3) one concrete action for today* within **5 seconds**, with zero medical jargon barrier.
   - **Physician Surface:** A practicing clinician must reach full multi-biomarker trends, ICD-10/ICD-11/SNOMED-CT/LOINC codes, DDI/pharmacogenomic safety checks, and mechanistic citations in **1 click**, and project plain-language visual explanations onto the patient's view instantaneously during consultation.
6. **LAW VI — Cryptographic & Biometric Sovereignty:** Health data and biometric photos are sacred. Identity relies on persistent cryptographic vaults and local-first privacy. Facial/body photos used for 1:1 avatar personification must extract normalized parametric morph weights locally/ephemerally and purge raw source imagery by default unless explicitly encrypted in the user's private vault.
7. **LAW VII — Non-Destructive Additive OS Evolution:** Always inspect the existing repository (`argon-bx8` / `Panacea`) before writing code. Integrate into existing engines (e.g., Z-Anatomy clinical atlas, Hodgkin-Huxley solver, pharmacogenomics/DDI safety engine, OmniCausalis knowledge graph, SATUSEHAT/FHIR R4 adapters, existing test suites). NEVER delete, stub out, or silently regress working modules.

---

## SECTION 1: PANACEAMED OS 6-LAYER SYSTEM TOPOLOGY

All features across PanaceaMed OS must function as **one tightly coupled closed-loop operating system**, never disconnected web pages or isolated demos.

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: ADAPTIVE DUAL-DENSITY OS SHELL (4 Compact SuperPages + Co-Consultation)    │
│  [Your Body]  [Clinical]  [For You]  [Open 3D]  |  Patient Mode ⇄ Physician Mode   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: BODYEXPOSURE 1:1 REALITY ENGINE (WebGPU + TSL + Parametric Morph Kernel)   │
│  1:1 Biometric Avatar ↔ 10-System Macro Anatomy ↔ Cross-Section ↔ Cellular/Molecular│
│  RenderPipeline (Single-Pass MRT: Color + Normal + Emissive) | GTAO | SelectiveBloom│
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: ET CAUSALIS & GPU MECHANISTIC COMPUTE KERNEL                               │
│  OmniCausalis 20-Relation Graph | Personal Baseline Drift | Time-Axis (-5Y ↔ +10Y)  │
│  WebGPU Compute Solvers: Electrophysiology | Hemodynamics | Organ Load | PK/PD/Vax  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: LONGITUDINAL CLINICAL STATE MACHINE & INTEROPERABILITY KERNEL              │
│  FHIR R4 / SATUSEHAT Synthesizer | ICD-10 / ICD-11 (+Ch.26 TM1) / SNOMED / LOINC    │
│  Automated Longitudinal SOAP & Delta Engine | Bidirectional EMR ↔ 3D Organ Registry │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: OMNI-TELEMETRY & MULTIMODAL INGESTION BUS                                  │
│  Wearables (Apple/Garmin/WHOOP/Amazfit) | BLE/Wi-Fi Devices | OCR Labs/Rx | MicroLog│
│  Signal Calibration, Artifact Rejection & Confidence Scoring Pipeline               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 0: CRYPTOGRAPHIC IDENTITY, CONSENT & EPIDEMIOLOGICAL AUDIT KERNEL             │
│  Persistent Auth | Local-First Encrypted Vault | Epistemic Guardrail Enforcer       │
└─────────────────────────────────────────────────────────────────────────────────────┘

```

---

## SECTION 2: KERNEL-BY-KERNEL TECHNICAL SPECIFICATIONS

### KERNEL 1: 1:1 BIOMETRIC PERSONIFICATION & ANATOMICAL CO-REGISTRATION ENGINE

*Goal: Transform generic 3D medical anatomy into the patient's own recognizable body so clinical findings trigger immediate personal resonance rather than abstract detachment.*

1. **Smart Biometric Intake & Alignment Interface:**
* Provide a frictionless onboarding modal supporting two paths (combinable):
* **Path A (Visual Morph Alignment):** Optional front/profile photo upload with an interactive circular/silhouette guide frame supporting drag, pinch/scroll zoom, and fine rotation. Run client-side landmark extraction (e.g., MediaPipe/ONNX WebGPU face & body proportions) to derive normalized morphological descriptors (craniofacial geometry, jawline, ocular/nasal proportions, skin melanin/undertone LUT, body habitus) without uploading raw photos to external servers.
* **Path B (Anthropometric Fast-Config):** Age, biological sex, height, weight, waist circumference, estimated body fat/muscle distribution, posture profile, and skin tone sliders for users preferring zero photo input.


* Enforce an explicit default-ON privacy toggle: `Extract parametric 3D proportions locally & immediately discard source photo`.


2. **Parametric Morph-Target & Skeletal Scaling Engine:**
* Drive a single topology-consistent, rigged base human shell using normalized morph targets (`morphTargetInfluences`) and bounded skeletal bone scales.
* **Strict Internal Co-Registration Invariant:** Scaling outer torso height, ribcage volume, waist adiposity, or pelvic width MUST propagate calibrated affine transforms to internal visceral containers (`heart`, `lungs`, `liver`, `kidneys`, `vasculature`, `musculoskeletal`) while preventing inter-organ mesh intersection or floating vessels.
* Animate profile creation and longitudinal body-composition changes (e.g., visceral fat reduction over 12 months) using a custom TSL luminous **biometric scan-wave shader transition** sweeping vertically across the mesh.


3. **Continuous 5-Scale Depth Peeling (Zero Scene Reloads):**
* Implement a smooth, continuous camera + shader opacity/clipping continuum:
* **Scale 0 — Personified External Self:** 1:1 recognizable skin, posture, superficial vascular/dermatologic findings, and wearable sensor anchor points.
* **Scale 1 — 10-System Macro Anatomy:** Cardiovascular, Respiratory, Nervous, Musculoskeletal, Gastrointestinal/Hepatic, Renal/Urinary, Endocrine, Immune/Lymphatic, Integumentary, Reproductive—individually peelable with smart auto-ghosting of occluding layers.
* **Scale 2 — Organ & Sub-Structure Atlas:** Multilingual clinical nomenclature (`Indonesian` / `English` / `Latin TA2` via Z-Anatomy registry) with clickable sub-regions (e.g., LAD coronary artery, SA node, hepatic lobule, renal nephron cortex).
* **Scale 3 — Volumetric Cross-Section & Clinical Slicing:** Solid-capped TSL cross-section shader (never hollow paper-thin polygon shells) revealing internal chambers, wall thickness, plaques, fibrosis, or registered CT/MRI slice overlays.
* **Scale 4 — Cellular, Electrophysiological & Molecular View:** Seamless transition into living mechanistic micro-scenes (cardiomyocyte ion channels, endothelial shear stress, drug-receptor binding, or vaccine antigen-presenting immune synapse).





---

### KERNEL 2: BODYEXPOSURE NEXT-LEVEL HD WEBGPU RENDERING & ASSET PIPELINE

*Goal: Deliver studio-grade medical CGI realism in a standard browser while maintaining 30–60 FPS on ordinary Indonesian clinic laptops and smartphones.*

1. **Strict Modern Graphics Stack (Hard Enforcements):**
* **REQUIRED:** `three/webgpu` (`WebGPURenderer` with transparent WebGL 2 fallback), **TSL (`three/tsl`)**, `MeshPhysicalNodeMaterial`, `RenderPipeline` with `mrt` (Multiple Render Targets), and `renderer.compute()`.
* **STRICTLY BANNED:** Legacy `EffectComposer`, raw GLSL `ShaderMaterial`, `onBeforeCompile` string-patching hacks, unbaked flat-shaded Phong/Lambert materials, and raw uncompressed PNG/JPEG textures in production bundles.


2. **Physically Based Biological Tissue Material Matrix:**
Every anatomical category MUST inherit from calibrated TSL biological material presets driven by 4 baked PBR maps (`Albedo`, `Normal`, `Roughness`, `AO` + `Thickness`):
| Tissue Class | Base Albedo / Melanin | Roughness Range | Clearcoat (Wetness) | Subsurface Scattering (SSS) | Micro-Detail Normal (Macro Zoom) |
| --- | --- | --- | --- | --- | --- |
| **Myocardium / Striated Muscle** | Deep oxygenated crimson-brown + fibrous striations | `0.32 – 0.58` | `0.65` (roughness `0.18`) | Warm deep-red via Thickness map | Anisotropic myofibril micro-normal |
| **Visceral Parenchyma (Liver/Kidney/Gut)** | Moist maroon / rose-tan + lobular variation | `0.18 – 0.42` | `0.85` (roughness `0.12`) | Moderate translucent edge glow | Fine serosal capillary micro-normal |
| **Arteries / Veins** | Elastic arterial crimson / venous plum | `0.25 – 0.45` | `0.70` (roughness `0.15`) | High backlit transmission on thin walls | Smooth adventitia + pulse stretch |
| **Cortical Bone / Cartilage** | Ivory trabecular / pearlescent hyaline | `0.55 – 0.85` (bone) / `0.25` (cartilage) | `0.05` (bone) / `0.50` (cartilage) | Subtle warm ivory SSS on thin edges | Porous periosteal micro-grain |
| **Neural / Brain Sulci** | Soft pinkish-grey cortex + pial vasculature | `0.22 – 0.40` | `0.75` (CSF sheen) | Delicate translucent cortical rim | Arachnoid & microvascular overlay |
| **1:1 Personified Skin Shell** | Calibrated melanin/hemoglobin shader | `0.40 – 0.65` | `0.15` (sebum micro-spec) | Dual-lobe dermal SSS | Pore-level tri-planar detail normal |


3. **Studio Medical Lighting & Single-Pass MRT Post-Processing:**
* **Lighting Rig:** Custom neutral soft-box Studio HDRI (`PMREMGenerator`) + subtle cool rim light (`#88B4FF` low intensity) separating dark-mode organ silhouettes cleanly against the Apple HIG obsidian canvas.
* **Tone Mapping:** `AgX` (fallback `ACESFilmic`) with calibrated exposure so wet organ highlights roll off organically without clipping to flat white.
* **MRT `RenderPipeline`:** Capture `output`, `normalView`, and `emissive` in one pass:
* `GTAONode`: Ground-truth ambient occlusion for deep anatomical contact shadows inside ribcages, sulci, and vessel bifurcations.
* **Selective Emissive Bloom:** Apply bloom *exclusively* to the `emissive` MRT channel (depolarization waves, inflammatory hotspots, drug/vaccine binding vectors, preventive alert halos) so anatomical textures stay clinically razor-sharp.
* `TRAANode` / `SMAANode`: Eliminate temporal aliasing on thin capillaries, nerves, and glassmorphic HUD callouts.




4. **Automated Blender / `gltf-transform` Asset Pipeline & Adaptive Device Tiering:**
* Provide reproducible CLI/Blender Python scripts that take high-poly anatomical sculpts (`Z-Anatomy` / custom models), bake 2K/4K `Normal`, `Roughness`, `AO`, and `Thickness` maps onto clean mid-poly topology, and compress assets via `gltf-transform`:
* **Geometry:** `Meshopt` compression (fast decode, morph-target & skinning safe).
* **Textures:** **KTX2 (Basis Universal)**—strictly **UASTC** for data maps (`Normal`, `Roughness`, `Thickness`, `AO`) to prevent normal-map banding, and **ETC1S** for `Albedo`.


* **Runtime Performance Tiers (Automatic Hardware Detection):**
* `TIER_ULTRA` (Discrete GPU / Apple Silicon M-Pro/Max): 2x DPR, 4K KTX2 textures, full GTAO + TRAA, 200k GPU compute particles.
* `TIER_STANDARD` (MacBook Air / Modern Clinic Laptop / Flagship Phone): 1.5x DPR, 2K KTX2, half-res GTAO + SMAA, 60k compute particles.
* `TIER_CLINIC_SAFE` (Low-end clinic PC / older mobile / WebGL2 fallback): 1.0x DPR, 1K KTX2, baked AO only, 10k particles, guaranteed ≥30 FPS and ≤512 MB VRAM ceiling.





---

### KERNEL 3: GPU COMPUTE PHYSIOLOGY, PHARMACODYNAMICS & IMMUNODYNAMICS ENGINE

*Goal: Elevate simulations from decorative animations to mathematically grounded, real-time mechanistic models running directly on GPU storage buffers (`renderer.compute()` + `instancedArray`).*

1. **Electrophysiology & Mechanical Coupling Solver:**
* Couple the existing Hodgkin-Huxley / cardiac action-potential model to 3D myocardial & neural mesh vertices via GPU storage buffers.
* Real-time heart rate, PR/QRS/QT intervals, ectopic foci, or autonomic HRV states ingested from wearables/ECG directly drive depolarization wave propagation speed (emissive MRT channel) and synchronized ventricular/atrial mechanical contraction (vertex displacement shader).


2. **Hemodynamic & Respiratory Vector-Field Transport:**
* Simulate 10,000–200,000 instanced blood cells, lipid/glucose markers, or inhaled aerosol particles along 3D anatomical centerlines and velocity fields in WebGPU compute shaders.
* Dynamically reflect patient telemetry: elevated systolic BP increases wall shear stress & pulsatile radial strain; stenotic plaque geometry visibly accelerates local turbulent flow; smoking/heated-tobacco or pollutant exposure visualizes airway ciliary load and vascular endothelial oxidative stress.


3. **Longitudinal Organ-Load Accumulator:**
* Translate multi-week behavioral patterns (sleep debt, nocturnal HR elevation, depressed HRV, high glycemic/sodium intake, prolonged sedentary periods, alcohol/nicotine load) into continuous spatial stress fields mapped onto affected organs (myocardial afterload, hepatic steatosis gradient, renal glomerular hyperfiltration, HPA-axis autonomic tone).


4. **Mechanistic Drug & Vaccine Visualization Engine (The Noble Medicine Standard):**
* Enable patients and physicians to *watch* how pharmacotherapy and immunization physically work inside the 1:1 body:
* **Pharmacokinetics / Pharmacodynamics (PK/PD):** Visualize absorption curve, plasma concentration window (therapeutic vs. sub-therapeutic vs. toxic), hepatic CYP450 metabolism (wired to the existing `pharmacogenomicsAndDrugInteractionSafetyEngine`), target receptor occupancy (e.g., ACEi/ARB vasodilation reducing afterload; statin hepatic LDL-R upregulation clearing arterial ApoB/LDL flux; SGLT2i renal natriuresis/cardiorenal protection; biologic monoclonal antibody cytokine blockade).
* **Vaccine Immunodynamics:** Visually narrate antigen presentation at injection/lymph node sites → dendritic cell migration → germinal center B-cell affinity maturation & memory T-cell expansion → rapid neutralizing barrier upon simulated future pathogen challenge—transforming vaccine hesitancy into transparent biological literacy.





---

### KERNEL 4: *ET CAUSALIS* (OMNICAUSALIS) GRAPH & COUNTERFACTUAL TIME-AXIS ENGINE

*Goal: Connect daily life to clinical biology across time—past, present, and preventable future—with mathematical honesty.*

1. **20-Relation Typed Clinical Knowledge Graph (`OmniCausalis`):**
* Formalize every biological, behavioral, pharmacological, and diagnostic link as typed directed edges (`CAUSES`, `EXACERBATES`, `MITIGATES`, `PREVENTS`, `BIOMARKER_OF`, `ANATOMICALLY_LOCALIZES_TO`, `CONTRAINDICATES`, `METABOLIZED_BY`, `SYNERGIZES_WITH`, `EARLY_WARNING_FOR`, `COMPENSATES_FOR`, `REVERSIBLE_VIA`, etc.).
* Every edge MUST carry: `evidenceGrade ('A'|'B'|'C'|'D')`, `mechanisticSummaryPatient`, `mechanisticSummaryClinician`, `timeConstantDays`, `reversibilityIndex (0..1)`, and `citationRefs[]`.


2. **Personal Baseline & Multi-Signal Pattern Detector:**
* Never alert on noisy single-day spikes. Compute rolling 14-day, 30-day, and 90-day personal baselines (mean, MAD/IQR, circadian phase).
* Detect **compound behavioral-physiological signatures** (e.g., *Pattern: 10 days of sleep <6h + resting HR +6 bpm + HRV -18% + late-night glycemic load → Autonomic Sympathetic Drift & Insulin Resistance Acceleration*).


3. **Bidirectional Time-Axis Counterfactual Simulator (`-5Y ← NOW → +10Y`):**
* Provide a single continuous timeline scrubber across the 1:1 anatomy:
* **Past Reconstruction (`-5Y` to `NOW`):** Replay how documented clinical events, labs, and lifestyle periods shaped today's anatomy.
* **Present Reality (`NOW`):** Live integrated state from wearables + active EMR.
* **Dual-Branch Future Projection (`+30D`, `+6M`, `+1Y`, `+5Y`, `+10Y`):**
* *Branch A — Unmodified Trajectory:* Projects probable organ strain and symptom emergence if current daily patterns persist (rendered with translucent uncertainty envelopes, never false certainty).
* *Branch B — Preventive Counterfactual:* Interactive toggles for concrete, realistic changes (e.g., `+45 min sleep consistency`, `150 min/week Zone 2 cardio`, `sodium <2g/day`, `smoke/aerosol cessation`, `prescribed antihypertensive/statin adherence`, `recommended vaccination`). Moving any toggle immediately recalculates causal graph propagation, updates risk confidence intervals, and morphs the 1:1 future organ simulation in real time.







---

### KERNEL 5: OMNI-TELEMETRY INGESTION & AUTOMATED LONGITUDINAL EMR (FHIR R4 / SATUSEHAT)

*Goal: Zero manual data entry friction for patients; zero clerical burden for clinicians; full Indonesian & global clinical interoperability.*

1. **Unified Daily Ingestion Bus:**
* Normalize heterogeneous inputs into a single timestamped `TelemetryFrame` stream:
* **Consumer Wearables:** Apple HealthKit, Garmin, WHOOP, Amazfit (HR, RHR, HRV RMSSD/SDNN, SpO2, respiratory rate, skin temp delta, sleep stages, VO2max, HR zones, steps, strain/recovery).
* **Medical Peripherals (BLE / Wi-Fi):** Cuff blood pressure monitors, glucometers/CGM, pulse oximeters, smart scales (BIA), portable 1/6-lead ECG.
* **Zero-Friction Daily Micro-Logs:** 1-tap symptom check, medication adherence confirmation, nutrition/hydration photo or quick-tag, smoking/vaping count, subjective energy/stress.
* **Document OCR Pipeline:** Extract structured values, units, and reference ranges from uploaded lab PDFs, hospital discharge summaries, imaging reports, and prescriptions with mandatory human verification before committing to EMR.




2. **Automated Longitudinal EMR Synthesizer (`FHIR R4` + `SATUSEHAT`):**
* Continuously map verified observations and events into valid **FHIR R4** resources (`Patient`, `Observation`, `Condition`, `MedicationStatement`, `Immunization`, `CarePlan`, `DiagnosticReport`, `DetectedIssue`) ready for **SATUSEHAT** exchange.
* Support multi-terminology coding: `ICD-10`, `ICD-11` (including optional Chapter 26 TM1 integrative dual-coding bridge where clinically invoked, clearly tagged), `SNOMED-CT`, `LOINC`, and `RxNorm / KFA (Kamus Farmasi dan Alkes Indonesia)`.
* Auto-generate concise **Longitudinal Delta SOAP Notes** emphasizing *what changed since the last visit* and *correlating wearable patterns*, eliminating wall-of-text fatigue.


3. **Bi-Directional EMR ↔ 3D BodyExposure Binding:**
* Selecting any EMR diagnosis, abnormal lab, medication, or vaccine smoothly flies the 1:1 3D camera to the exact anatomical locus, peels occluding layers, and activates its mechanistic simulation.
* Tapping any organ or vessel in the 3D scene filters the longitudinal timeline, wearable charts, and EMR history exclusively to that organ system and its upstream/downstream causal nodes.



---

### KERNEL 6: ADAPTIVE DUAL-DENSITY OS SHELL (4 SUPERPAGES & CO-CONSULTATION MIRROR)

*Goal: Dark futuristic, chromatic glassmorphism, Apple HIG clarity—engineered so an elderly patient feels calm mastery and a specialist physician experiences surgical speed.*

1. **The 4 Compact SuperPages (Zero Navigation Bloat):**
* **`Your Body` (Home / Reality View):** Full-bleed 1:1 personified `BodyExposure` canvas + floating glassmorphic Time-Axis Scrubber + 3-Layer Progressive Disclosure Drawer.
* **`Clinical` (Longitudinal EMR & Workbench):** Automated FHIR R4 / SATUSEHAT record, lab trends, medication/DDI/PGx safety guardrails, vaccination passport, and Longitudinal SOAP synthesizer.
* **`For You` (Daily Prevention & Habits):** Pattern-driven daily rhythm cards, 1-tap preventive counterfactual toggles, wearable sync status, and hyper-practical daily micro-actions tied directly to the 1:1 body.
* **`Open 3D` (Deep Exploration & Education):** Free-roam 10-system Z-Anatomy explorer, volumetric cross-sections, cellular/drug/vaccine mechanistic sandboxes, and clinical teaching scenarios.


2. **3-Layer Progressive Disclosure (Patient Mode):**
* **Layer 1 (5-Second Glance):** 1:1 personified body with at most 3 calm visual indicators + 3 plain-language cards: *(a) What is happening right now*, *(b) What recent daily pattern is driving it*, *(c) 1–2 realistic actions for today*.
* **Layer 2 (Interactive Story):** Tap any glowing organ to trigger a 20-second interactive visual story + *"See 1-Year / 5-Year Impact"* preventive toggle.
* **Layer 3 (Structured Record):** Clean longitudinal passport, visual guide of *"How my medicine/vaccine protects me"*, and 1-tap Shareable Doctor Visit Brief.


3. **Physician Workbench & Co-Consultation Mirror Mode:**
* Instant `Patient Mode ⇄ Physician Mode` switch without losing camera focus or selected organ.
* **Co-Consultation Mirror Mode:** During a clinic visit, the physician operates dense clinical controls (differential graph, lab deltas, drug titration, risk curves) while projecting a synchronized, distraction-free, plain-language 1:1 anatomical explanation onto a second screen or tablet facing the patient—closing the doctor–patient communication gap live in the exam room.



---

## SECTION 3: CANONICAL TYPESCRIPT KERNEL CONTRACTS

All agents MUST adhere to these foundational schemas (extend additively; never weaken strict union types or omit provenance/safety fields):

```typescript
export type EpistemicSource =
  | 'OBSERVED_CLINICAL'
  | 'OBSERVED_CONSUMER'
  | 'CLINICAL_RECORD'
  | 'MECHANISTIC_SIMULATION';

export interface EpistemicProvenance {
  source: EpistemicSource;
  deviceOrAuthor: string;
  timestampISO: string;
  confidenceScore: number; // 0.0 - 1.0
  uncertaintyBand?: { lower: number; upper: number; unit: string };
  modelVersion?: string;
  clinicalDisclaimerKey: 'DIAGNOSTIC_VERIFIED' | 'WELLNESS_TREND_ONLY' | 'PROBABILISTIC_SIMULATION';
  citations?: string[]; // DOI / PubMed / Guideline IDs
}

export interface BiometricTwinProfile {
  profileId: string;
  anthropometrics: {
    ageYears: number;
    biologicalSex: 'male' | 'female' | 'other';
    heightCm: number;
    weightKg: number;
    waistCm?: number;
    bodyFatPct?: number;
  };
  morphWeights: Record<string, number>; // Normalized [0..1] blendshape weights
  organScaleFactors: Record<string, [number, number, number]>;
  skinToneLUT: { melanin: number; hemoglobin: number; undertone: number };
  privacyPolicy: { rawPhotoRetained: false | 'LOCAL_ENCRYPTED_VAULT_ONLY'; consentTimestampISO: string };
}

export type CausalRelationType =
  | 'CAUSES' | 'EXACERBATES' | 'MITIGATES' | 'PREVENTS'
  | 'BIOMARKER_OF' | 'ANATOMICALLY_LOCALIZES_TO' | 'CONTRAINDICATES'
  | 'METABOLIZED_BY' | 'SYNERGIZES_WITH' | 'EARLY_WARNING_FOR'
  | 'COMPENSATES_FOR' | 'REVERSIBLE_VIA' | 'REGULATES' | 'INHIBITS'
  | 'ACTIVATES' | 'TRANSPORTS_TO' | 'STRUCTURALLY_SUPPORTS'
  | 'GENETICALLY_MODULATES' | 'IMMUNOLOGICALLY_PRIMES' | 'CORRELATES_WITH';

export interface CausalEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation: CausalRelationType;
  weight: number; // -1.0 to +1.0
  timeConstantDays: number;
  reversibilityIndex: number; // 0.0 (irreversible) to 1.0 (fully reversible)
  evidenceGrade: 'A' | 'B' | 'C' | 'D';
  anatomicalTargetIds: string[]; // Maps directly to Z-Anatomy / BodyExposure mesh IDs
  explanationPatient: { id: string; en: string };
  explanationClinician: { id: string; en: string };
  citations: string[];
}

export interface CounterfactualScenario {
  scenarioId: string;
  label: string;
  horizonDays: number; // e.g., 30, 180, 365, 1825, 3650
  interventions: Array<{
    type: 'HABIT' | 'PHARMACOTHERAPY' | 'VACCINE' | 'CLINICAL_PROCEDURE';
    code: string; // SNOMED / RxNorm / KFA / Internal Habit ID
    adherenceAssumed: number; // 0.0 - 1.0
    mechanismShaderPreset: string; // Triggers specific TSL/Compute visualization
  }>;
  projectedOrganStates: Record<string, {
    stressIndex: number; // 0.0 - 1.0
    visualShaderUniforms: Record<string, number>;
    projectedBiomarkers: Record<string, { value: number; lower: number; upper: number; unit: string }>;
    provenance: EpistemicProvenance;
  }>;
}

```

---

## SECTION 4: AGENTIC EXECUTION PROTOCOL & HARD VERIFICATION GATES

Any CLI agent executing against this constitution MUST follow this disciplined workflow:

### 4.1 Mandatory Pre-Flight Protocol (Before Editing Any File)

1. **Deep Repo Audit:** Map existing modules in `argon-bx8` / `Panacea` (Z-Anatomy atlas, Hodgkin-Huxley engine, DDI/PGx engine, OmniCausalis graph, FHIR/SATUSEHAT services, existing UI routes, test runner) against Kernels 1–6.
2. **Produce an Explicit Architecture Diff Plan:** List exact files to create/modify, new interfaces, GPU memory impact, and rollback safety. Never start blind rewrites.

### 4.2 Vertical-Slice Expansion Order (Depth Before Breadth)

Build end-to-end depth on one flagship clinical loop first so every kernel proves itself in production reality before scaling horizontally across all 10 systems:

* **Phase 1 — Constitutional Kernel & Unified Schemas:** Lock `EpistemicProvenance`, `BiometricTwinProfile`, `OmniCausalis` typed graph extensions, FHIR R4/SATUSEHAT bidirectional mapper, and local-first privacy guards.
* **Phase 2 — BodyExposure WebGPU/TSL Foundation & 1:1 Morph Engine:** Upgrade renderer to `WebGPURenderer` + `RenderPipeline` (MRT + GTAO + Selective Emissive Bloom + TRAA/SMAA), Blender/KTX2/Meshopt asset loader, adaptive 3-tier hardware scaling, and Smart Biometric Alignment UI.
* **Phase 3 — Flagship Vertical Slice (Cardiovascular + Autonomic/Metabolic Loop):** Connect wearable HR/HRV/sleep/activity streams → personal baseline drift detector → automated FHIR R4 longitudinal summary → GPU compute Hodgkin-Huxley + arterial flow shader on HD heart/vasculature → 5-year counterfactual prevention simulator (Zone-2 cardio + sleep + antihypertensive/statin mechanism visualization) across both Patient Mode (5-second clarity) and Physician Co-Consultation Mirror Mode.
* **Phase 4 — Mechanistic Immunology (Vaccine Engine) & Multi-System Expansion:** Replicate the exact vertical slice pattern across Respiratory, Hepatic-Metabolic, Renal, Neurological, Endocrine, Musculoskeletal, and Immune/Vaccine pathways (including optional ICD-11 Ch.26 dual-coding hooks).
* **Phase 5 — Clinical Hardening & Visual Realism Loop:** Run multimodal visual critiques comparing live canvas screenshots against studio medical CGI benchmarks (tuning SSS, clearcoat roughness, rim contrast, GTAO radius, bloom threshold, and elderly readability until indistinguishable from flagship medical visualization software).

### 4.3 Non-Negotiable Verification Gates (Every Milestone Must Pass All 5)

1. **Gate 1 — Type & Build Integrity:** Zero TypeScript errors (`strict: true`), clean production bundle, zero banned legacy WebGL APIs (`EffectComposer`, raw `ShaderMaterial`).
2. **Gate 2 — Clinical & Causal Automated Test Suite:** Unit and integration tests covering personal baseline drift, causal propagation determinism, DDI/PGx safety checks, FHIR R4 schema validity, and **Epistemic Provenance Enforcement** (tests MUST fail if any simulated/wearable output omits provenance or masquerades as `OBSERVED_CLINICAL`).
3. **Gate 3 — Performance & Clinic-Device Budget:** Verified ≥60 FPS on `TIER_ULTRA`, ≥30 FPS on `TIER_CLINIC_SAFE` / WebGL2 fallback, VRAM ≤512 MB on fallback tier, and zero browser context loss across rapid depth-peeling transitions.
4. **Gate 4 — Privacy & Biometric Audit:** Automated assertion confirming raw intake photos are purged when `rawPhotoRetained === false` and zero PHI leaks into unencrypted logs or third-party telemetry.
5. **Gate 5 — Dual-Mode Usability & Visual Critique Check:** Verify (a) a first-time non-technical user understands current body state + daily action in ≤5 seconds, (b) a clinician reaches FHIR/ICD/causal evidence in 1 click, and (c) screenshot audit confirms realistic biological shading with zero plastic specular blowouts or unreadable text contrast.

---

*End of PanaceaMed OS Constitutional Master Architecture. Every commit must narrow the distance between biological reality, clinical rigor, and human understanding.*
