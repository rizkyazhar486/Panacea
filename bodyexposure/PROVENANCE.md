# Provenance

## HUMAN.ADULT.MALE — source_backed

- **Source:** Z-Anatomy, the libre 3D atlas of anatomy, itself derived from BodyParts3D
  (DBCLS, Mitsuhashi et al. 2009, doi:10.1093/nar/gkn613). Taken from this repo's existing
  `public/anatomy/{skeletal,muscular,cardiovascular,nervous,visceral,lymphoid,surface}.glb`.
- **Licence:** CC BY-SA 4.0 (Z-Anatomy). Derivatives of these meshes stay CC BY-SA 4.0.
- **Changes made:**
  - Removed importer helper objects ("HOW TO…", "Take a picture") and wrapper empties.
  - Applied all object transforms into mesh data (world coordinates), flipping normals where
    the source transform was mirrored; merged exact duplicate vertices (≤ 1 µm); dissolved
    degenerate faces. Pivots moved to each structure's bounding-box centre.
  - Routed every structure into anatomical system collections, assigned semantic IDs and
    `panacea_*` metadata.
  - Laterality: taken from the source `.l/.r` suffix where present; otherwise paired
    structures were assigned by the sign of their vertex centroid (+X = subject left);
    single unpaired structures carry no side.
  - **Corrections to the source**, each recorded on the object as `panacea_qa_note`:
    - `Eyelashes.l/.r` had swapped sides relative to the eyebrows; corrected.
    - `Vagus nerve (X).r` merges the thoracic/abdominal vagal continuation of both sides;
      left as-is and flagged `review_required` (splitting it needs a reference-backed
      segmentation).
  - Material library replaced with physically based `PAN_*` materials (subsurface, coat,
    transmission). Pulmonary arteries are shown blue and pulmonary veins red, following the
    oxygenation colour convention used in Netter.

## Structures from the full Z-Anatomy model (in HUMAN.ADULT.MALE) — source_backed

Panacea's original web export (`public/anatomy/*.glb`) contained 2,431 of the 4,567 meshes in
Z-Anatomy's full model (`Startup.blend` from `Z-Anatomy.zip`, Z-Anatomy/Models-of-human-anatomy,
CC BY-SA 4.0, downloaded 2026-10-03). The full model uses the same coordinate frame: the left
femur's bounds match to 0.1 mm. Using `pipeline/extract_zanatomy.py` (headless) and `pipeline/merge_zanatomy_extra.py`, 1,238
missing structures were added, with modifiers applied (subdivision, solidify) and in world
coordinates:

| Kind | Count |
|---|---|
| Muscle origin areas (`.o`) / insertion areas (`.e`) | 351 / 354 |
| Ligaments | 304 |
| Bursae / tendon sheaths | 78 / 38 |
| Fascia sheets and intermuscular septa | 54 |
| Joint capsules | 32 |
| Cartilages and menisci | 31 |
| Intervertebral discs and nuclei pulposi | 23 + 23 |

The `.o`/`.e` reading comes from the source's own material names (`Origin-*`, `End-*`).

Dropped:
- 24 exact duplicates of structures already present (0.0 mm apart);
- collection icons;
- label leader lines (2-vertex `.j`/`.i` objects, hook-driven; their raw vertices do not lie
  on the named landmark, so they were not used as anchors);
- reference lines (pelvic inlet and outlet, eyeball axes and meridians).

## Intervertebral discs (in HUMAN.ADULT.MALE) — source_backed_corrected

The source discs replace the earlier Panacea reconstruction. The source shape is primary
evidence; a reconstruction is not. The source discs overlapped the adjacent vertebral bodies
(14–33 % of their vertices lay inside bone), so each one was pushed out to the bone surface
+0.15 mm with the same routine the reconstruction used. The moved-vertex count is stored per
disc in `qa_vertices_pushed_out_of_bone`.

## Terminologia Anatomica 2

`TA2.csv` (Z-Anatomy repository, CC BY-SA 4.0) supplies the TA2 ID, Latin name and French name
through `pipeline/annotate_ta2.py`. Matching is exact on the English name only, with no fuzzy
matching, because a wrong Latin label is worse than none. Coverage: male 3,489 / 3,876 (v009); female
259 / 841 (HuBMAP naming departs from TA more often).

## Intervertebral discs (superseded reconstruction)

- **Method:** `pipeline/build_intervertebral_discs.py`. Each disc fills the space between the
  source vertebral endplates. The endplates are detected as the connected face patch on the
  vertebral body; the outline is the 2D convex hull of both endplates; the surfaces follow
  the endplate heights with a 0.15 mm gap; any vertex left inside bone is pushed back out
  to the bone surface. No external dimensions are imposed.
- **Reference rule:** a disc occupies the space between adjacent vertebral bodies (Gray's
  Anatomy, vertebral column). Check: the discs make up 25.6 % of the C2–L5 column path,
  matching Gray's "about one quarter".
- **Limitations:** the convex outline slightly overfills the posterior concavity; the annulus
  fibrosus and nucleus pulposus are not separated.

## Pericardium (in HUMAN.ADULT.MALE) — approximate

- **Method:** `pipeline/build_pericardium.py`. Takes the union of the source heart chambers,
  the coronary sinus, the roots of the great vessels and the epicardial vessels, then:
  - voxel remesh at 3 mm, morphological closing at 6 mm, and a 3.5 mm outward offset;
  - cut at the top of the pulmonary-trunk bifurcation (superior reflection) and where it
    enters the diaphragm.
- **Reference:** Gray's Anatomy, middle mediastinum. The sac encloses the heart and the great
  vessel roots, reflects at about the pulmonary-trunk bifurcation and start of the aortic
  arch, and rests on the central tendon of the diaphragm.
- **Limitations:** the fibrous and parietal serous layers are one surface, with no wall
  thickness; reflections around the pulmonary veins and the oblique and transverse sinuses
  are not modelled.

## Lung correction (source_backed_corrected)

The source lungs intrude into the space occupied by the source heart (confirmed by a
three-ray parity test: 17–24 of about 450 sampled ventricle vertices lie inside the left
upper lobe). Lung vertices lying inside the pericardial sac were moved onto its surface
plus 0.8 mm, which produces the cardiac impression. Vertices within 4 mm of the sac's cut
edges were left alone, because the inside/outside test is unreliable there. Each lobe
records how many vertices moved in `panacea_qa_note`.

## Source objects with lost names

Three source objects had non-ASCII names that did not survive export:
- `????????` — identified by morphology as the **probable** epicardial veins of the right
  ventricle (anterior cardiac veins plus right marginal vein). Flagged `review_required`.
- `?x.l` / `?x.r` — a small paired artery running front-to-back beside the nasal septum at
  palate level. **Not identified**; stored as `UNIDENTIFIED_PARASEPTAL_ARTERY_NASAL_FLOOR`.

## Label anchors — approximate

Sixteen `ANCHOR.ADULT_MALE.*` empties (femoral head, greater trochanter, ASIS, tibial plateau,
tibial tuberosity, both malleoli, humeral head; left and right). Each is computed from a
stated extremal or centroid rule, recorded in `panacea_anchor_method`.

## HUMAN.ADULT.FEMALE — source_backed_partial

- **Source:** HuBMAP Consortium, CCF 3D Reference Object Library, VH_Female
  (`VH_Female/v1.1/VH_F_United.glb`), from the NLM Visible Human female. Brain parcellation
  from the Allen Human Brain Reference Atlas, as packaged in that file.
  https://github.com/hubmapconsortium/ccf-3d-reference-object-library
- **Licence:** CC BY 4.0. Downloaded 2026-10-03.
- **Changes made:**
  - Removed 116 non-anatomical objects (tissue-sampling "extraction site" blocks, spleen
    sample grids, landmark markers).
  - Shifted the body so the feet sit at z = 0 (the source is centred on the origin). No
    rotation was needed: the source already uses +X subject left and −Y anterior, verified
    from heart/liver/spleen/kidney positions.
  - Semantic IDs, metadata and `PAN_*` materials as for the male. System assignment was
    inferred from source names and is marked `panacea_system_assignment: inferred`.
- **Additional parts merged (2026-10-03),** only structures absent from VH_F_United, placed with
  the same body transform:
  - `v1.2/VH_F_Spinal_Cord.glb`: 29 spinal cord segments, C1–S4;
  - `v1.3/VH_F_mammary_gland_L/R.glb`: lobes, lactiferous ducts and sinuses, nipple, areola,
    areolar tubercles, mammary fat, suspensory (Cooper's) ligaments;
  - `v1.4/3d-vh-f-blood-vasculature.glb`: 2 new vessels.

  The other 108 objects in those files duplicated structures already present and were
  dropped. Alignment check: the cord lies posterior to the aortic arch, and the breast
  lobes are anterior to the chest wall.
- **System routing audit:** keyword routing had collisions, all corrected:
  - "bladder" in gallbladder;
  - "papilla" in the heart's papillary muscles;
  - "renal" in the liver's renal impression;
  - laryngeal cartilages and femoral condyles filed under joint;
  - hepatic, uterine and sigmoid vessels filed under their organs instead of
    cardiovascular;
  - "uter" in "outer cortex of kidney".

  The male master had the same gallbladder error, plus the suprarenal gland under urinary;
  both are fixed.
- **Embedded laterality:** 69 kidney sub-parts were named like `major calyx L a`. They now
  carry the side as laterality (`MAJOR_CALYX_A.L`).
- **Coverage:** thoracic, abdominal and pelvic organs (including uterus, cervix, tubes,
  ovaries and their ligaments), heart with coronaries, airway, kidneys with internal
  structure, eyes, knees, female bony pelvis, brain. **Not present:** full skeleton, most
  musculature, peripheral nerves. (Spinal cord and breast tissue were added afterwards; see above.)
- **Not merged with the male.** The two bodies are separate subjects; combining them would
  need a registration transform that no source provides.

## VHF_LOWER_LIMB.ADULT.FEMALE — source_backed_partial (v012)

**What this is:** one individual, not an atlas. The donor of the NLM Visible Human Female was a 59-year-old woman, 62 in (157 cm),
88 kg, BMI 36 (Andreassen et al. 2023). The paper notes disrupted anatomy in the female specimen and that some
structures (patellar tendon, complete Achilles tendon) were left out of the dataset. This body must never be labelled "reference
adult female", "average" or patient-specific. `clinically_reviewed` is false for every structure (owner decision of 2026-10-09,
PR #2303: no anatomist review for this step; unreviewed, not reviewed).

- **Source:** Andreassen TE, Hume DR, Hamilton LD, Walker KE, Higinbotham SE, Shelburne KB. "Three-dimensional lower
  extremity musculoskeletal geometry of the Visible Human Female and Male." *Scientific Data* 10:34 (2023),
  doi:10.1038/s41597-022-01905-2. Data: University of Denver Center for Orthopaedic Biomechanics,
  doi:10.56902/COB.vh.2022.0, "Final 3D STL Models" (smoothed). Manual segmentation of the NLM Visible Human Female cryosections
  in ScanIP v. S-2021.06 (Simpleware, Synopsys), using Netter and Fleckenstein et al. as references. Obtained from the owner's
  download (2026-10-10); copied to `sources/du_vhf/`.
- **Licence terms read from the official pages on 2026-10-10:**
  - *Denver collection* (digitalcommons.du.edu/visiblehuman): "This work is licensed under a Creative Commons Attribution 4.0
    International License". Data are supplied "as is"; the University of Denver and the Center for Orthopaedic Biomechanics accept no
    liability. Required citation: the 2023 Scientific Data paper above. The collection's own README also asks for the second paper
    (Andreassen et al., arXiv:2209.06948). Commercial use and redistribution are allowed with attribution.
  - *NLM Visible Human images* (nlm.nih.gov/research/visible/getting_data.html and the NLM Terms and Conditions): no licence or
    registration is required since July 2019. Terms: acknowledge NLM with "Courtesy of the U.S. National Library of Medicine"; do not imply
    NLM endorsement; when redistributing, keep the data current or state clearly that it may not reflect NLM's latest data. NLM
    gives no warranty and no legal advice on third-party rights. Commercial use is not prohibited. The NLM page gives no donor
    biography beyond thanking the donors; age and habitus above come from the Denver paper.
  - These terms permit the use made here. If either page changes, re-read before the next release.
- **Coverage (checked against the Denver collection before any CT work):** pelvis to ankle only: 28 bones (13 per side plus sacrum
  and coccyx), 16 cartilages, 8 ligaments, 76 muscles. The collection also lists 2 fat geometries, which are not in the folder
  received. Not covered, so still open for CT segmentation: lumbar and thoracic spine, ribs, sternum, skull, shoulder girdle and the
  whole upper limb.
- **Changes made:** STL (mm) merged by 0.1 mm to connected meshes; rotated 180° about Z into the canonical frame (+X subject left,
  −Y anterior, +Z superior), converted to metres, centred on the midpoint of the two hip bones, lowest point at z = 0. Frame checked from
  geometry: patella anterior to femur on both sides, every "Left" object at +X (the build aborts otherwise). Source spellings
  normalised (Calcaneous → Calcaneus, Illiacus → Iliacus, Quadratis → Quadratus, Semitendonosus → Semitendinosus); "Peroneus longus"
  is named "Fibularis (peroneus) longus".
- **Not split:** the source forefoot mesh is labelled "Phalanges"; a top-view render shows metatarsal shafts and toe bones in one
  mesh with a coarse toe segmentation, so it is named "Metatarsals and phalanges (combined)". Bone boundaries are not in the source.
- **Separate body, not grafted.** Like the ICRP variants, it is its own internally consistent body. Both this set and the HuBMAP
  `VH_Female` come from the same cadaver, but they use different segmentations, so they are not merged. Cross-check
  (`pipeline/check_vhf_lower_limb_vs_hubmap.py`, `qa_reports/vhf_lower_limb_vs_hubmap.json`): after one rigid fit on the left
  femur, tibia, fibula and patella lie 3.6–3.8 mm median from the HuBMAP surfaces (p95 6–8 mm), and 2.5 mm when fitted per bone.
  That supports "same subject, different segmentation", not agreement at sub-millimetre level.
- **Geometry QA** (`qa_reports/vhf_lower_limb_build.json`): 2.34 M triangles in total, 0 non-manifold edges, 3 meshes with open
  boundaries (left forefoot, left talar cartilage, right talus).
- **Rig** (`pipeline/build_rig_lower_limb.py`, `animate_rom_lower_limb.py`; reports `manifest/rig_vhf_lower_limb*.json`,
  `qa_reports/rig_vhf_lower_limb_rom.json`): hip, knee and ankle joint centres from geometry only (no labelled landmarks); ankle
  centre refined by surface-congruence fit (shift 13.4 and 17.0 mm, bone overlap 6.9 → 0.6 mm and 6.5 → 0.4 mm). Bones and
  cartilages are bound rigidly (44 meshes); the 4 knee ligaments and 76 muscles are not rigged. ROM limits are AAOS values; the
  animation reaches them except on the right side, where bone contact exceeds 1.5 mm: hip adduction 25 (AAOS 30), hip external
  rotation 40 (45), ankle dorsiflexion 15 (20). The cause (donor anatomy or right hip-centre error) is not determined. After
  these caps the largest bone overlap in the sweep is 1.0 mm.
- This supersedes the "no source supplies individually separated female bones" result of the female rig source survey below, for
  the lower extremity only. The female spine, ribs, skull and upper limb remain without separated-bone sources.

## Paediatric bodies — source_backed (published; redistribution cleared by owner 2026-10-03)

- **Source:** ICRP Publication 156, *Paediatric Mesh-type Reference Computational Phantoms*
  (2024), polygon-mesh OBJ files from `P156 Electronic files.zip`
  (https://www.icrp.org/publication.asp?id=ICRP+Publication+156). Ten phantoms: newborn and
  1, 5, 10 and 15 years, male and female. They are built from CT images of real people and
  adjusted to the ICRP Publication 89 reference values. They are **not** scaled adults.
- **Retrieval:** HTTP range requests on the 11.8 GB archive fetched only the README and the
  ten OBJ/MTL pairs.
- **Licence:** neither the ICRP page nor the README states redistribution terms. The project
  owner cleared redistribution in Panacea on 2026-10-03. The web derivatives are published in
  `public/bodyexposure/pediatric_*`; the master body `.blend` files stay local (size).
- **Laterality correction:** the 15-year female phantom labels its ovaries with swapped
  sides; the builder corrects this from geometry and records it on the objects.
- **Conversion** (`pipeline/build_icrp156_bodies.py`): cm → m, feet to z = 0, no rotation
  needed. Verified on the 5-year-old male: sternum at −Y, liver at −X, the master's
  convention.
- **Kept:** 102–140 anatomical surfaces per body.
- **Dropped:** 88–90 dosimetry-only groups per body (µm target layers, spongiosa and
  medulla, lumen and air contents, residual soft tissue).
- **Measured statures:**

  | Age | Male | Female | ICRP reference |
  |---|---|---|---|
  | Newborn | 48.1 cm | 48.2 cm | 51 cm |
  | 1 year | 76.0 cm | 76.0 cm | 76 cm |
  | 5 years | 109.0 cm | 109.1 cm | 109 cm |
  | 10 years | 138.0 cm | 138.1 cm | 138 cm |
  | 15 years | 167.0 cm | 161.0 cm | 167 / 161 cm |

  The newborn phantom has flexed legs, which explains the shorter standing height.
- **In the master:** each variant is linked as a library collection (one `.blend` per body)
  under `PEDIATRIC.NEONATE`, `PEDIATRIC.INFANT`, `PEDIATRIC.CHILD` (5 and 10 y) and
  `PEDIATRIC.ADOLESCENT`.

## Placeholders

`HUMAN.PREGNANT`, `FETUS`, `PEDIATRIC.TODDLER` and `HUMAN.OLDER_ADULT` exist as empty root collections. Each records the source data it needs
(`panacea_source_requirement`). No geometry was fabricated, and none was produced by scaling
or inflating an adult body.

## Considered and not used: thebuggeddev/anatomy

The owner pointed to https://github.com/thebuggeddev/anatomy (inspected 2026-10-03). Its nine
organ models (brain, eyeball, heart, intestine, kidneys, liver, lungs, pancreas, skin) are
each a single mesh named `tripo_node_<uuid>`: output of the Tripo AI text/image-to-3D
generator. The repository has no licence file and no attribution, and the meshes have no
internal anatomy. Under this project's reference standard, generated geometry is not
evidence for anatomy, so none of it was merged. Source-backed versions of all nine organs
already exist in the canonical bodies.

## Owner reference set (art direction only)

The owner's "Panaceamed Resources" folder (71 files, registered 2026-10-03 in `manifest/references.json`) is
entirely AI-generated: ChatGPT images and Tripo meshes or multiview inputs. It sets the view layout, the peel order
and the coverage checklists (see `references/README.md`). It contributes no geometry, landmarks or measurements to
any canonical body, and it is not redistributed with the app.

## BodyParts3D 4.0 (adult male gut audit, v010)

Source: BodyParts3D 4.0 "partof" release, DBCLS (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/). The OBJ headers say
CC BY-SA 2.1 Japan; the DBCLS licence page now says CC BY 4.0. Attribution follows the stricter of the two.

BodyParts3D is the source Z-Anatomy was built from. It was registered to the canonical male frame in two steps:
1. A global similarity fit on 277 structures present in both datasets (`manifest/bp3d_frame.json`).
2. A rigid ICP on the pelvis: sacrum, coccyx, both hip bones and the urinary bladder (`manifest/bp3d_icp.json`). The
   median reference surface distance fell from 7.4 mm to 1.1 mm.

Registration showed that three Z-Anatomy gut labels do not match the geometry (`manifest/bp3d_label_audit.json`):

| Z-Anatomy label | Relabelled to | Evidence |
|---|---|---|
| Sigmoid colon | Rectum | 97% of vertices on the BodyParts3D rectum; spans S3 (z 0.925 m) to below the pelvic diaphragm |
| Jejunum | Jejunum and ileum | 46% jejunum, 33% ileum |
| Descending colon | Descending and sigmoid colon | lower end turns to the midline below the pelvic brim |

The old IDs are kept in `panacea_previous_ids`. One structure was added: the external anal sphincter (FMA21930). The
BodyParts3D caecum was **not** added because 60% of it lies inside the Z-Anatomy small-intestine mesh. The caecum
stays an open gap.

## ICRP Publication 145 adult reference phantoms (v011)

Source: ICRP Publication 145, *Adult Mesh-type Reference Computational Phantoms* (2020), electronic files
`MRCP_AM` and `MRCP_AF`, polygon-mesh version (https://www.icrp.org/docs/P145%20Electronic%20files.zip). Built with the
same pipeline as the paediatric bodies (`pipeline/build_icrp156_bodies.py -- --only AM,AF`). The coordinate convention
matches the paediatric phantoms: cm with +Z superior, sternum at −Y and liver at −X. Redistribution falls under the
owner's 2026-10-03 clearance of ICRP-derived meshes.

These are **separate, internally consistent bodies**, published as an "ICRP reference" variant of the adult male and
adult female entries. They are not grafted onto the Z-Anatomy male or the HuBMAP female. Mixing two individuals'
anatomy in one body would itself be invented anatomy. The ICRP female supplies everything the HuBMAP female lacks:
the axial skeleton (cranium, spine, ribs, sternum), stomach, oesophagus, oral cavity, airways, pituitary and thyroid.
Both bodies pass the gross-anatomy gate with no exceptions (`qa_reports/gross_icrp_adult_*.json`). Statures are 176 cm
and 163 cm, the Publication 89 reference values.

Limits, inherited from the source's dosimetry purpose: bones are grouped by region (for example "Ribs cortical" covers
all ribs), and the skeletal muscle is a single tissue mesh. Airway regions follow the ICRP Human Respiratory Tract
Model names (ET1, ET2, BB); the display names spell out what those regions are.

## CMU Graphics Lab Motion Capture Database (walk and run clips)

Source: mocap.cs.cmu.edu, subject 07 trial 01 (walk) and subject 09 trial 02 (run), ASF/AMC files at 120 fps,
downloaded 2026-10-09.

Licence, read from the site on 2026-10-09: "free for all uses … You may include this data in commercially-sold
products, but you may not resell this data directly, even in converted form." Required acknowledgement: "The data
used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF
EIA-0196217." The acknowledgement appears in the app's Motion panel and in `public/bodyexposure/CREDITS.txt`.

Truth class: **measured-retargeted**. This is the recorded motion of another person, mapped onto the Z-Anatomy
skeleton. It is not the motion of the anatomy shown and not patient biomechanics.

## Female rig source survey (2026-10-09) — no production import

Checked against the publishers' pages on 2026-10-09; nothing below was downloaded or imported.

| Candidate | Verified | Consequence for a female rig |
|---|---|---|
| BodyParts3D 4.0 (DBCLS) | The database description states "a three-dimensional whole-body model for an adult human male". Licence is CC BY. Download page offers `isa_BP3D_4.0_obj_99.zip` (136 MB) and `partof_BP3D_4.0_obj_99.zip` (62 MB), 99 % polygon-reduced. Nothing on either page mentions female. | **Male only.** It must not be used or relabelled as female anatomy. It remains the male gut-audit source. |
| NLM Visible Human Female | Cryosection and CT images (about 40 GB, 0.33 mm spacing), no registration. NLM Terms and Conditions require "Courtesy of the U.S. National Library of Medicine", forbid implying NLM endorsement, and require either current data or a clear notice that it is not current. Commercial use is not prohibited, but NLM gives no legal advice. | Images, not meshes: every bone would need our own segmentation, then review. The HuBMAP `VH_Female` mesh already published here derives from the same subject, but has no axial skeleton. |
| DIR-Lab 4DCT | Published as a public lung-registration benchmark (10 cases, 10 respiratory phases, landmark pairs). **Licence and redistribution terms NOT VERIFIED**: the site did not respond to the fetch. | Research and validation use only until the terms are read. Not a source of production geometry. |
| ICRP Publication 145 `MRCP_AF` (already published, v011) | Complete female body with axial skeleton, airways and lungs. Bones are grouped by region (for example "Ribs cortical" is one mesh). | Cannot drive a per-bone rig: individual vertebrae, ribs and limb bones are not separate objects. |

**Result:** no currently available, licensed source supplies individually separated female bones. Splitting the ICRP
regional meshes would mean inventing the boundaries between neighbouring bones, which this project does not do.
`clinically_reviewed` stays `false` for every body.

Unblocking options that stay within the rules: (1) a mesh set with separated female bones and a confirmed licence;
(2) segmenting the Visible Human Female CT ourselves, then having a qualified anatomist review it; (3) a published
ICRP or other phantom variant that separates the bones. Read the DIR-Lab terms before any 4DCT use.
