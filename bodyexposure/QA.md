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
- Benchmarks (`renders/`) were checked at 100 % crop for readability of the brachial
  neurovascular bundle, intercostal vessels and bowel.
