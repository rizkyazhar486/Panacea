# Panacea Body Exposure — Astra Visual Gold for All Organs

## Purpose
Astra is reserved for the highest-value frontier work: biomedical 3D/4D geometry integration, scene architecture, procedural geometry when scientifically appropriate, kinematics, physiology simulation, radiology/surgical interaction, WebGL performance, and visible polish. Git/CI archaeology, routine rebases, prose, housekeeping, and low-complexity tests should consume as little Astra compute as possible.

Success is a user-visible executable biomedical milestone. A green CI run, manifest-only change, source list, or prose document is not completion by itself.

## Compute budget
Target Astra effort per run:

- 55% 3D/geometry/rendering
- 20% interaction/physiology/simulation
- 10% visual polish
- 10% integration
- 5% Git/CI

If the run is spending most time on repository management, stop and redirect to a rendered artifact.

## Universal execution loop
For every organ/system:

1. Inspect only the minimum latest-main context needed to find the universal Body renderer, the target organ implementation, validated assets, and active ownership conflicts.
2. Reuse validated geometry first. Preserve provenance and licenses. Never invent anatomy, imaging, academic review, validation, or patient-specific inference.
3. Use procedural geometry only where scientifically appropriate. Label schematic/parametric geometry honestly when it is not validated anatomical ground truth.
4. Reuse or improve the universal renderer instead of creating a new viewer per organ.
5. Produce working code first. Render it. Inspect visible defects. Fix them.
6. Only after the executable milestone works: add deterministic source checks, tests, documentation, integration, and PR preparation.
7. Use exact-head Validate + full Stabilization Acceptance + fresh latest-main check before merge. Never force merge. Verify merge on main.
8. If externally blocked, record the blocker and immediately move to another independent organ.

## Universal renderer capabilities
All mature organ scenes should inherit the same primitives where relevant:

- orbit / pan / zoom
- touch gestures and mobile-safe controls
- select / isolate / hide
- transparency
- exploded anatomy
- clipping / cross-section
- labels and semantic hierarchy
- camera presets
- animation timeline
- physiologic state controls
- pathology overlays
- radiology correlation when source-backed
- performance/LOD management
- deterministic loading and teardown

## Definition of Done
An organ is not Gold merely because it has a PR. Completion requires:

`GOLD = anatomy credibility ∧ visible quality ∧ meaningful interaction ∧ mobile usability ∧ known provenance`

When physiology is claimed, add `physiologic behavior is mechanistically defensible`.

## Organ/System Gold lanes

### Eye / Orbit
Globe, cornea, anterior chamber, iris/pupil, lens, zonules/ciliary apparatus, vitreous, retina, choroid, sclera, optic disc/nerve, EOM, orbital relationships, lacrimal apparatus, major vascular/neural relationships. Prioritize accommodation, pupil response, EOM movement, visual-pathway demonstrations, clipping, exploded layers, and clinically useful camera presets.

### Ear / Vestibular / ENT sensory
External/middle/inner ear, ossicles, cochlea, semicircular canals, vestibular apparatus, tympanic membrane, key nerves and spaces. Prioritize ossicular motion, pressure/sound propagation as educational simulation, vestibular orientation, section views, and radiology correlation where source-backed.

### Nose / Sinus / Upper airway
Nasal cavity, turbinates, septum, paranasal sinuses, ostia, nasopharyngeal relationships, olfactory region. Prioritize airflow/obstruction visualization only when honestly modeled and labeled.

### Oral cavity / Dental / Pharynx / Larynx
Teeth and supporting anatomy when licensed/validated, tongue, palate, pharynx, laryngeal framework, vocal folds, airway relationships. Prioritize phonation/swallowing/airway mechanics where scientifically defensible.

### Brain / CNS
Cortex, major lobes/gyri where supported, deep nuclei, ventricles, brainstem, cerebellum, major white-matter and vascular relationships. Prioritize lesion localization, tract/pathway demonstrations, perfusion/stroke overlays, and CT/MRI correlation without pretending schematic pathways are patient-specific reconstructions.

### Spinal cord / Peripheral nervous system
Cord segments, roots, plexuses, major peripheral nerves and clinically useful dermatomal/myotomal relationships. Prioritize lesion localization and pathway animation.

### Heart / Cardiovascular
Chambers, valves, coronary anatomy, conduction system, great vessels, major venous/arterial structures. Prioritize cardiac cycle, valve motion, pressure/flow state, conduction propagation, ischemia/heart-failure teaching states, and radiology/echo-style correlation where source-backed.

### Respiratory
Upper/lower airway, tracheobronchial tree, lungs/lobes/segments where supported, pleura, diaphragm and thoracic relationships. Prioritize ventilation mechanics, airflow, gas-exchange teaching states, pleural pathology demonstrations, and CT correlation.

### Digestive
Esophagus, stomach, liver, gallbladder/biliary tree, pancreas/ducts, small bowel, colon, rectum, relevant mesentery/peritoneal and vascular relationships. Prioritize peristaltic/flow demonstrations only where they can be modeled honestly; use section/explode and radiology/surgical relationships.

### Urinary
Kidneys, collecting system, ureters, bladder, urethra, renal vasculature and retroperitoneal relationships. Prioritize filtration/urine-flow educational states, obstruction/stone localization, section views, and CT/US correlation where supported.

### Endocrine
Pituitary, thyroid/parathyroid, adrenal, pancreatic endocrine context, gonadal endocrine context and relevant vascular relationships. Anatomy must remain spatially grounded; hormone-network simulations must be labeled as models, not direct patient prediction.

### Male reproductive
Testes, epididymides, vas deferens, seminal vesicles, prostate, penis/erectile bodies, ducts and vascular relationships. Prioritize anatomy, flow pathways and surgical/radiologic relationships; do not claim fertility/erection/ejaculation prediction from static geometry.

### Female reproductive
Ovaries, tubes, uterus, cervix, vagina, vulvar structures where source-backed, pelvic support and key vascular relationships. Physiologic cycle/pregnancy demonstrations must distinguish reference simulation from patient-specific inference.

### Lymphatic / Immune
Lymph nodes/chains, spleen, thymus, marrow context, major lymphatic pathways and immune-cell/molecular views where supported. Dynamic immune behavior should be represented as educational simulation with uncertainty, not literal whole-body prediction.

### Musculoskeletal
Skeleton, joints, muscles, tendons, ligaments and major fascia/biomechanical relationships. Prioritize movement, force vectors, ROM, muscle recruitment demonstrations, exploded layers, injury/surgical relationships, and mobile performance.

### Integumentary / Surface
Skin surface, scalp/hair and other validated surface structures first. Do not fabricate histologic layers from a surface mesh. Histology/cellular modes require separate source-backed or explicitly schematic representations.

### Hematologic / Vascular
Major vessels, blood-cell scale views, clot/thrombus/atherosclerosis teaching states and circulation relationships. Flow simulations must identify assumptions and model limits.

### Breast
Source-backed breast anatomy and regional relationships, with imaging correlation where licensed/supported. Avoid implying screening diagnosis or patient-specific malignancy classification unless a separate validated diagnostic system exists.

### Other canonical structures
For remaining organs/structures not named above, apply the same Gold contract: source-backed geometry first, universal renderer, executable interaction, honest simulation, deterministic checks, mobile acceptance, and no fabricated provenance.

## Parallel lane policy
Heavy, Medium, Light, Fourth Body, and Visual Gold lanes may run simultaneously only when changed paths do not overlap. Visual Gold owns the currently selected benchmark organ's core visual implementation. Other lanes should prefer infrastructure, source verification, independent organs, deterministic tests, or non-overlapping system content.

Do not serialize all organs behind one candidate. Multiple independent system-scoped branches/PRs are encouraged when safe.

## Anti-limit rule
If an Astra run consumes substantial compute without a visible/executable improvement, reduce scope immediately. Prefer one rendered milestone over five planning outputs. Never spend repeated Astra runs producing only architecture notes, manifests, PR churn, or CI archaeology.

## Scaling rule
Build the universal engine once, then make organ modules primarily data/scene manifests plus behavior. Reuse interaction primitives and render infrastructure across all systems so later organs become cheaper and faster than the first benchmark organ.
