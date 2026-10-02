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

## Intervertebral discs (in HUMAN.ADULT.MALE) — reconstructed

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
- **Coverage:** thoracic, abdominal and pelvic organs (including uterus, cervix, tubes,
  ovaries and their ligaments), heart with coronaries, airway, kidneys with internal
  structure, eyes, knees, female bony pelvis, brain. **Not present:** full skeleton, most
  musculature, peripheral nerves.
- **Not merged with the male.** The two bodies are separate subjects; combining them would
  need a registration transform that no source provides.

## Placeholders

`HUMAN.PREGNANT`, `FETUS`, `PEDIATRIC.{NEONATE,INFANT,TODDLER,CHILD,ADOLESCENT}` and
`HUMAN.OLDER_ADULT` exist as empty root collections. Each records the source data it needs
(`panacea_source_requirement`). No geometry was fabricated, and none was produced by scaling
or inflating an adult body.
