# Adult female main bronchi source reference

The female atlas now offers **Main bronchi reference (HRA)** alongside its
whole-body model. This separate reference contains the four original source
components: the left and right main bronchi and their cartilage. It preserves
the source coordinates and does not register, duplicate or replace structures
in the 841-component whole-body female.

## Source and outputs

- Source: Human Reference Atlas, main bronchus female v1.0, NLM Visible Human
  female; [NIH 3D entry 3DPX-020976](https://3d.nih.gov/entries/3DPX-020976).
- License: CC BY 4.0, attributed in the variant, review data and GLB extras.
- Existing local input: `3d-vh-f-main-bronchus.glb`, 2,858,776 bytes.
- Pinned input SHA-256:
  `c58e5b8fb61d982eb72f7385b6ce858e07e05766b0101ff0e15c7bc469cf60ff`.
  This identifies the local input; it is not a claimed hash comparison with a
  newly downloaded server copy.
- Four meshes, **33,865 triangles**. Both web LODs retain all triangles and
  source positions; each is 1,217,600 bytes with meshopt compression.
- IDs begin `REFERENCE.VH_FEMALE.RESPIRATORY.` and the variant body ID is
  `HUMAN.ADULT.FEMALE.MAIN_BRONCHI_REFERENCE`.
- All four ontology mappings come directly from `ontologyid` and `label` in
  the pinned source GLB node extras: right/left bronchi `UBERON:0002177` /
  `UBERON:0002178`, right/left cartilage `FMA:13143` / `FMA:13144`.
  The existing atlas search and selected-structure panel display these IDs.
- Clinical validation remains **pending**. This is an educational source
  reference, with no added segmentation, registration or medical acceptance.

The source includes open bronchial ends and source cartilage topology. The
pipeline reports their boundaries rather than closing or remodelling them.

## Reproduce in a fresh independent worktree

Use a fresh output directory and a worktree which does not yet contain this
reference. The builder refuses an opened BLEND master or a different input
hash. Publishing refuses existing reference identities and output files.
Adjust the three local paths below to the available source and owned worktree.

```sh
bronchi_source="$HOME/Downloads/29135-outputs/3d-vh-f-main-bronchus.glb"
bronchi_output="/tmp/panacea-female-main-bronchi-new"
bronchi_worktree="$HOME/.codex/worktrees/female-respiratory-source"

/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
  --python-exit-code 1 -P bodyexposure/pipeline/build_female_main_bronchi.py \
  -- --source "$bronchi_source" --out "$bronchi_output"

# Use the pinned gltfpack version. --offline requires its existing npm cache;
# when preparing another machine, install/cache that version first.
npx --offline gltfpack@1.3.0 \
  -i "$bronchi_output/female_main_bronchi.glb" \
  -o "$bronchi_output/female_main_bronchi.meshopt.glb" -c -kn -km -ke -noq

python3 bodyexposure/pipeline/publish_female_main_bronchi.py \
  --prepared "$bronchi_output" \
  --packed "$bronchi_output/female_main_bronchi.meshopt.glb" \
  --repo "$bronchi_worktree"

node scripts/qa/capture-female-bronchi-source.mjs "$bronchi_source" \
  bodyexposure/qa_reports/female_main_bronchi_reference.json
node --test scripts/qa/female-main-bronchi.test.mjs
python3 bodyexposure/pipeline/check_web_budget.py --out /tmp/bronchi-web-budget.json
```

Packing uses no requested simplification or position quantization. The test
decodes the actual published meshopt GLB and compares every indexed triangle
in world space with hashes captured from the pinned original input, rounding
positions to one micrometre and preserving triangle winding. It also checks
per-component triangle counts, bounds, identity and pending review metadata.
These checks verify source preservation and software behavior; human review
determines anatomical fitness and clinical accuracy.

## GPU preview

```sh
/Applications/Blender.app/Contents/MacOS/Blender \
  -b "$bronchi_output/female_main_bronchi.blend" --python-exit-code 1 \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile preview --bench body-qa --device METAL --lighting studio \
  --frame-visible --out /tmp/panacea-bronchi-preview-new
node qa/validate-cinematic-reports.mjs /tmp/panacea-bronchi-preview-new
```

Two 960×540 preview captures completed with Metal on the local Apple M4.
The render pipeline records source/output hashes, framing, devices and timings
without modifying the input BLEND. See
[METAL_8K_FEASIBILITY.md](METAL_8K_FEASIBILITY.md) for the separate completed
fetal 8K capture measurements; this bronchus preview is not an 8K benchmark.

For a human trial, open Body Exposure → Adult female → Main bronchi reference
(HRA), then find and select each of the four structures. Inspect its source and
review status, rotate the reference and compare it with the original HRA data.
