# QA record

Engineering checks run on the master. These are measurements, not clinical validation, and
no aggregate quality score is claimed: the reference measurements needed for one do not exist
yet.

## Whole-body frame (adult male)

| Check | Result |
|---|---|
| Stature (vertex z-extent) | 1.696 m (0.009 → 1.705 m) |
| Pose | Anatomical position: palms anterior, radius/ulna parallel (anterior and lateral viewport review) |
| Left/right mirror symmetry of paired bone centroids | all pairs within 4 mm |
| Knee vs hip–ankle line | 1.8 mm medial-lateral, 7.2 mm antero-posterior |
| ASIS–pubic plane tilt | 0.5° (neutral) |
| Lateral malleolus below medial malleolus | yes, by 20 mm (anatomically expected) |
| Layer alignment | muscle, vessel, nerve, visceral, lymphoid and surface layers share the skeleton's frame (bounds and viewport overlap checks) |

## Laterality audit

- All 2,610 male structures have unique IDs; no Blender `.001` duplicates remain.
- 1 source naming error corrected (eyelashes), 1 merged source object flagged (right vagus).
- 219 unpaired organs had their geometric side suffix removed (an early pass had produced
  names like `RIGHT_VENTRICLE.L`).
- Female: cardiac structures whose names contain "left"/"right" (left ventricle, right
  coronary artery…) are kept unpaired; the side words are part of the name.

## Intervertebral discs (23, C2–C3 to L5–S1)

| Check | Result |
|---|---|
| Vertices inside adjacent bone | 0 for all 23 (after the push-out pass; 45–243 per disc before it) |
| Manifold | all 23 closed manifold |
| Disc share of C2–L5 column path | 0.256 (Gray's: about one quarter) |
| Cranio-caudal trend of centre height | cervical 2.7–4.7 mm, thoracic 3.9–8.1 mm, lumbar 6.2–16.3 mm |
| Lordotic wedge L4–L5 | anterior 9.2 mm > posterior 7.1 mm |

Known: some posterior heights read low (C4–C5 0.5 mm, C7–T1 0.6 mm). Those posterior
probes fall where the convex outline overfills the endplate, and the minimum-thickness
clamp sets the floor. Needs review against imaging.

## Pericardium and heart–lung relationship

| Check | Result |
|---|---|
| Sampled heart-chamber vertices outside the sac | 0 / 3,671 |
| Coronary/epicardial vessels inside the sac | included by construction (27 structures) |
| Sac vertices inside lung tissue (3-ray parity), before → after lung correction | left upper lobe 114 → 10 of 2,143; the other lobes 0–50 of 2,143 |
| Surface | smooth after morphological closing; first attempts showed coronary imprints and pits (fixed) |

Iterations that failed and were replaced, kept here for the record:
- Corrective smoothing alone let the heart poke through.
- A Laplacian pre-smooth wrinkled the surface and left 8% of chamber vertices outside.

## Web derivatives

| Check | Result |
|---|---|
| Files | 108 GLB: 2 bodies × 12–14 systems × 4 LODs, plus the lymph-node tissue module |
| Size | 315 MB raw → 87 MB meshopt-compressed; male LOD2 = 1.05 M triangles in 9.2 MB |
| Structure names and provenance extras after compression | preserved in 108 / 108 files (checked by `pack_web.py`) |
| LOD2 mean geometric error vs master | 0.03–0.39 mm by system (worst single case: hair, 7.8 mm max) |
| Browser test at 390×844 (Chromium, three r185) | male LOD2: 2,611 structures in 0.7 s; female LOD2: 841 in 0.12 s; 0 load failures; tap-to-identify returns ID, system, laterality, status and source |

## Adult bodies — gross-anatomy gate and laterality audit (master v009)

Both adult bodies now pass the gate:
- **Male:** 10/10 checks. 3,403 paired structures, 1 documented exception (the right vagus,
  flagged since v002).
- **Female:** all applicable checks pass. 649 paired structures, 13 documented exceptions.
  Her spleen and stomach checks could not run: the HuBMAP female has spleen surface parts and
  no single stomach object.

The audit found 299 structures whose side suffix contradicted their geometry. Geometry
decided each case:

| Class | Count | Resolution |
|---|---|---|
| Allen brain atlas (female): L/R labels mirrored relative to the body, consistently across the atlas | 141 pairs | Swapped. Near-midline pairs were judged against the brain's own midline (x = −5.7 mm), not the body's |
| Full Z-Anatomy muscle attachments and the temporomandibular ligament (male): suffix contradicts geometry | 16 pairs swapped; 22 single structures renamed | Corrected by side |
| Other female single structure with no counterpart | 1 | Renamed to the side its geometry shows |
| HuBMAP round ligaments of the uterus: source labels swapped | 1 pair | Swapped |
| "left/right" naming a liver lobe or segment, not a body side (portal-vein branch, hepatic duct/artery, liver segments) | 5 | Made unpaired with the qualifier restored to the name; 2 liver segments moved from respiratory to digestive |
| Ambiguous (midline central canal, 4.5 mm corniculate cartilage, right vagus) | 3 | Flagged `review_required`, not changed |

Every change records the reason in `panacea_qa_note` and
`panacea_laterality_source: geometry_override`. The gate fails only on *unexplained*
conflicts.

## Paediatric bodies — gross-anatomy gate (SOP §11), `pipeline/qa_gross_anatomy.py`

Ten automated checks per body:
- the side suffix (.L/.R) matches the centroid side;
- liver on the right, spleen and stomach on the left, heart left of the midline;
- vertical organ order brain > heart > liver ≥ kidneys > bladder;
- feet on the ground;
- heart within the rib-cage height;
- brain inside the cranium;
- no gross interpenetration between major organ pairs (three-ray parity test).

| Body | Checks passed | Liver x / spleen x (m) | Organ heights z (m) |
|---|---|---|---|
| ADOLESCENT.FEMALE | 10/10 | -0.045 / +0.097 | 1.516 > 1.226 > 1.11 > 0.834 |
| ADOLESCENT.MALE | 10/10 | -0.050 / +0.103 | 1.566 > 1.27 > 1.141 > 0.868 |
| CHILD_10Y.FEMALE | 10/10 | -0.041 / +0.081 | 1.29 > 1.039 > 0.951 > 0.709 |
| CHILD_10Y.MALE | 10/10 | -0.041 / +0.081 | 1.287 > 1.036 > 0.948 > 0.699 |
| CHILD_5Y.FEMALE | 10/10 | -0.033 / +0.067 | 0.998 > 0.782 > 0.711 > 0.533 |
| CHILD_5Y.MALE | 10/10 | -0.033 / +0.067 | 0.996 > 0.778 > 0.708 > 0.525 |
| INFANT.FEMALE | 10/10 | -0.030 / +0.056 | 0.68 > 0.508 > 0.441 > 0.317 |
| INFANT.MALE | 10/10 | -0.030 / +0.056 | 0.679 > 0.507 > 0.439 > 0.313 |
| NEONATE.FEMALE | 10/10 | -0.011 / +0.041 | 0.422 > 0.305 > 0.263 > 0.16 |
| NEONATE.MALE | 10/10 | -0.011 / +0.041 | 0.422 > 0.305 > 0.263 > 0.167 |

The gate found three defects, all fixed:
1. Side words in the middle of ICRP labels (`Kidney_left_cortex`) were not stripped.
2. "pelvis" in the bone keyword list sent the kidney pelvis to skeletal.
3. **Source error:** the 15-year-old female phantom labels its ovaries with swapped sides
   (`Ovary_left` at x = −0.034 m). The builder now corrects any side label that contradicts
   the geometry and records the correction on the object
   (`panacea_laterality_source: geometry_override`).

## Pass v007

- **Joint capsule reconstruction: attempted and rejected.** Distance-rule attachment regions
  produced a cap over the femoral head and acetabulum instead of a sleeve from the
  acetabular rim to the intertrochanteric line. The objects were deleted, not shipped. Real
  source capsules were then found in the full Z-Anatomy model and used instead.
- Knee, reviewed anterior and posterior: the cruciate ligaments cross in the intercondylar
  notch; the menisci sit on the tibial plateau; the collateral and popliteofibular ligaments
  are in place.
- Femur and hip bone attachments: the vastus intermedius origin covers the anterior shaft,
  the iliacus origin the iliac fossa, and the adductor and pectineus origins the pubic region.
- Source discs: 0 vertices left inside bone after correction (14–33 % before).

## Defects found in the previous pass and fixed

1. **Female frame mismatch.** The spinal cord and breast tissue added later sat 1.2 m to the
   side and 0.67 m low. They were imported at source coordinates while the rest of the
   female body carried a display offset. The alignment check at the time only compared the
   front-to-back axis, so it missed this. Fix: every female mesh is baked to one canonical
   frame (feet at z = 0) with no hidden hierarchy offsets. Re-check: the C5 cord segment is
   above the aortic arch, and the L1 segment is level with the upper kidneys.
2. **System misroutes from keyword collisions:** 57 female and 3 male structures; see
   PROVENANCE.
3. **Kidney sub-part laterality:** the side was embedded mid-name; fixed for 69 structures.
4. **Lymph-node tissue model filed as part of the female body:** moved to
   `21_MICROSCOPY` as `MODULE.TISSUE.LYMPH_NODE`.
5. **Viewer:** the surface system was missing from the load list, and overlapping loads
   raced each other.

## Mesh topology (from `manifest/qa_summary.json`)

- Male vessels: 663 of 676 meshes are open. That is expected: the source models vessel
  segments as open-ended tubes.
- Male nervous: 70 meshes have non-manifold edges and the ethmoid/occipital/Vertebra T8
  meshes have residual open edges. These come from the source and have not been repaired.
- Totals: male 5.0 M vertices, female 1.78 M. That is far above a mobile web budget, so
  LOD derivation is required before any web export.

## Render QA

- Bugs caught by visual review and fixed: overexposure (AgX highlight desaturation), serous
  membranes hiding the viscera, sub-collections excluded from the view layer (vessels and
  nerves missing from renders), anchors computed before matrix update (all at the origin).
- Opened-thorax frame: the translucent lungs expose the cut ends of source pulmonary vessels where they stop inside the lung. This is a source limitation, left visible on purpose.
- Benchmarks (`renders/`) were checked at 100 % crop for readability of the brachial
  neurovascular bundle, intercostal vessels and bowel.
