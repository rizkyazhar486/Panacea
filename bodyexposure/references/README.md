# Owner reference set: art direction, not anatomy

On 2026-10-03 the owner supplied a folder named "Panaceamed Resources" as reference for Body Exposure. Every file is
registered in [`manifest/references.json`](../manifest/references.json) with its SHA-256, size, pixel dimensions,
detected generator and role. `pipeline/register_references.py` builds that register. A local copy lives in
`references/files/`. That folder is gitignored and is not redistributed.

## What the files are

| Kind | Count | Generator |
|---|---|---|
| System infographics, body sheets | 33 | ChatGPT image generation (10 named as such, the rest match its style) |
| Multiview input images | 20 | Tripo |
| 3D meshes (GLB/FBX) and archives | 18 | Tripo (`generator: "Tripo"`, `tripo_node_*` / `tripo_part_*`) |

All 71 files are generated. Under the project's reference standard, generated content is **not evidence for
anatomy**. These files are never used as geometry, landmark positions, measurements or laterality, and no mesh from
this set is merged into a canonical body. This matches the decision on thebuggeddev/anatomy (see PROVENANCE.md).

## How they are used

| Reference | Role | What it sets |
|---|---|---|
| Panacea Body Exposure 2D | body matrix target | The presentation view set per body: anterior, posterior, lateral, 3/4, head ×3, hands, feet. It also confirms that an older adult is in scope. That body stays a placeholder until source anatomy exists. |
| Body Exposure 2D Organ | coverage checklist | Twelve systems, each with its organ list, checked against the source-backed inventory |
| Cardiovascular 2D Panacea | view convention | Six orthographic views with axis labels, a 45° turntable, close-ups with scale bars, and a projectile path through the thoracic layers |
| Female body exposure asset set (ChatGPT 04:05 PM) | layer sequence | The external → skeletal peel order and the regional close-up list |
| Pelvic multiscale sheet (ChatGPT 08:18 PM) | view convention | Orthographic, sectional and trajectory panels for the pelvis |
| Biological hierarchy (ChatGPT 05:55 PM) | multiscale brief | Levels from chemical to organ system. Below gross anatomy, so out of current scope. |
| Per-system 2D infographics | art direction | Colour, labelling and layout direction only |

Where a reference and the source anatomy disagree, the source wins. For example, the infographics draw generic
organ shapes, but the canonical bodies keep their CT-, cryosection- and BodyParts3D-derived shapes.

## Coverage check against the reference checklist

`pipeline/check_reference_coverage.py` matches the reference organ names, not shapes, against the source-backed
inventory and writes [`manifest/reference_coverage.json`](../manifest/reference_coverage.json).

- **Adult male: 58 of 67 items present.** The gross-anatomy gaps are the **rectum and anal canal**, the **ileum and
  caecum**, and the bulbourethral gland. Z-Anatomy, the male source, has none of them, as confirmed by a
  name search of `Startup.blend`, so they need another source. The original BodyParts3D release is the first
  candidate. The other gaps are microscopic or not meshed in any source: hair, sweat and sebaceous glands,
  capillaries, smooth-muscle layers, red bone marrow and lymphatic vessels.
- **Adult female: 41 of 67 items present.** The HuBMAP VH_Female organ library has no skull, vertebral column,
  ribs, sternum, stomach, oral cavity, pharynx, nasal cavity, ear, pituitary, parathyroid or urethra. These are real
  source gaps, not extraction errors. Filling them needs a female source with an axial skeleton and upper GI tract.
- Paediatric bodies (ICRP 156) are checked separately by the gross-anatomy gate.
