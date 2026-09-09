# Panacea Surgical Simulator Curriculum

This contract turns the shared Body Exposure anatomy/physiology graph into a broad surgical-education curriculum. It does not create a duplicate heavy 3D viewer. Existing Body3D/atlas surfaces should consume modules progressively and lazy-load procedure-specific overlays.

## Interaction model

Each simulation can combine: anatomy rehearsal, operative-sequence timeline, instrument-handling exercises, exposure/dissection planes, hemostasis concepts, reconstruction, physiology response, complication rescue and team crisis. The reference interaction target is an explorable surgical field with selectable anatomy, physiology/flow overlays, named hazards, sequence checkpoints, and post-action consequences.

## Coverage

Initial curriculum spans general surgery; digestive/HPB and colorectal; cardiothoracic/vascular; surgical oncology; pediatric surgery; plastic/reconstructive and burn concepts; neurosurgery; orthopaedics/trauma; urology; oral/maxillofacial surgery; vascular surgery; transplantation; endocrine surgery; minimally invasive skills; trauma/critical care; and ophthalmic microsurgery.

Representative modules include appendectomy, inguinal hernia repair, cholecystectomy, colorectal resection, hepatopancreatobiliary resection concepts, cardiac revascularization/valve concepts, pulmonary resection, oncologic resection principles, pediatric congenital surgery, reconstructive flap surgery, cerebral aneurysm clipping, spine decompression, fracture fixation, arthroplasty, endourology, maxillofacial reconstruction, peripheral vascular reconstruction, kidney/liver transplant concepts, endocrine surgery, laparoscopic core skills, trauma crisis simulation and ophthalmic microsurgery.

## Precision rule

Precision means the highest defensible anatomical and physiological resolution with explicit provenance. Gross 3D anatomy must transition to sectional anatomy, histology, cellular/molecular mechanisms or conceptual flow/physiology overlays when literal geometry would be fabricated. Generic atlas geometry is not patient-specific anatomy.

## Safety and academic boundary

All procedure modules are educational simulations. They must not provide autonomous real-world operative guidance, patient-specific procedure planning, treatment recommendations, or claim that generic anatomy predicts an individual patient's anatomy. High-risk clinical/procedure functionality requires the Academic Accuracy Gate and qualified human review. Patient-specific functionality, if ever separately developed, requires validated patient data, provenance, dedicated validation and a distinct safety review.

Mandatory external anatomy/UX references already defined by the multisystem foundation remain reference-only unless license/provenance is separately verified. Existing PubMed evidence boundaries and prohibitions on deterministic gene/RNA→thought, hormone→personality, research-frontier→validated therapy and longevity→immortality remain controlling.

Implementation: `src/lib/surgicalSimulatorCurriculum.ts`; deterministic guard: `scripts/uji/surgical-simulator-curriculum.mts`.
