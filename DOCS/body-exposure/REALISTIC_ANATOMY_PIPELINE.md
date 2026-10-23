# PanaceaMed high-fidelity anatomy pipeline

## Objective

The `Realistic Atlas` is the rendering tier between the existing educational atlas and future scan-derived patient-specific digital twins.

Its job is to make open reference anatomy look materially closer to wet anatomy **without changing the epistemic status of the geometry**. A better shader does not make a reference mesh patient-specific, histologic, or diagnostically validated.

## Current implementation

`src/components/digital-twin/RealisticAnatomyAtlas.tsx` reuses the named GLB systems already stored under `public/anatomy/` and adds:

- ACES filmic tone mapping;
- a generated studio environment map using Three.js `RoomEnvironment`;
- physically based tissue materials;
- tissue-specific roughness, clearcoat, sheen and limited transmission;
- separate visual treatment for skin, bone, cartilage, muscle, tendon, ligament, artery, vein, nerve, brain, heart, lung, liver, kidney, gut, adipose, lymphatic and generic visceral tissue;
- exact named-structure raycast picking;
- layer-specific opacity controls;
- balanced and cinematic pixel-density modes;
- subtle educational cardiac and respiratory motion when the relevant named meshes are present.

## Anatomical source boundary

The current GLB geometry is derived from the repository's existing Z-Anatomy / BodyParts3D pipeline. Z-Anatomy distributes an open Blender human anatomy atlas and documents its BodyParts3D derivation and CC BY-SA attribution requirements.

See the existing `public/anatomy/CREDITS.txt` for repository-specific attribution.

## What “more precise” must mean

There are four different kinds of precision and they must not be conflated.

### 1. Rendering precision

Surface response, lighting, translucency, depth cues, anti-aliasing and material separation.

This is what the current Realistic Atlas improves immediately.

### 2. Geometric precision

Number and placement of anatomical structures, mesh topology, foramina, fascial planes, trabeculae, vessel branches, nerve fascicles, retinal laminae, valve apparatus, conduction system and other small structures.

This requires higher-resolution source geometry; shaders cannot create it.

### 3. Biological precision

Cell composition, extracellular matrix, histology, molecular gradients, electrophysiology, perfusion and time-varying tissue state.

This requires validated microscopy, omics, physiology or mechanistic models linked with provenance.

### 4. Patient precision

A specific person's anatomy or pathology.

This requires patient-derived DICOM / DICOM SEG / WSI / genomics / laboratory or other measured data. Reference atlas geometry must never be presented as a patient's measured anatomy.

## Future asset hierarchy

Use a multi-resolution asset contract:

```text
public/anatomy/
  reference/        # web-optimized current atlas
  high/             # higher-resolution reference anatomy
  micro/            # specialist microanatomy assets
  provenance/       # source, license, version and transform metadata
```

Every asset should have a sidecar record containing at minimum:

```json
{
  "assetId": "...",
  "structureId": "...",
  "source": "...",
  "sourceVersion": "...",
  "license": "...",
  "coordinateSystem": "...",
  "units": "mm",
  "meshResolution": "...",
  "decimationRatio": 1.0,
  "isPatientDerived": false,
  "validation": "reference-anatomy",
  "transformToPanaceaAtlas": []
}
```

## Blender export rules for high-resolution reference assets

A local Blender/Astra/Codex asset pipeline should:

1. start from a licensed source model;
2. preserve the original object name and anatomical identifier;
3. apply transforms consistently in millimetres;
4. preserve left/right laterality;
5. keep clinically meaningful structures as separate named objects;
6. remove only non-anatomical helper geometry;
7. generate normals/tangents after topology operations;
8. create multiple LOD tiers instead of destructive one-size-fits-all decimation;
9. export glTF/GLB with Meshopt or another web-compatible compression strategy;
10. record the exact source version, processing parameters and license in provenance metadata;
11. compare landmark distances and structure counts before/after processing;
12. fail the pipeline if a named clinically important structure disappears.

## Recommended LOD strategy

- **LOD0 / cinematic:** highest licensed reference geometry that mobile GPU memory permits;
- **LOD1 / desktop:** moderate reduction with preserved silhouette and small branches;
- **LOD2 / mobile:** aggressive reduction for whole-body navigation;
- **LOD3 / overview:** system-level proxy geometry for distant views.

LOD switching should be screen-space-error based, not only distance based.

## Specialist high-resolution modules

A whole-body mesh cannot realistically encode every scale. Use specialist modules with their own validation and coordinate transforms.

Examples:

- brain cortex, deep nuclei, white-matter tracts, cranial nerves and neurovasculature;
- globe, cornea, lens, retina, choroid, optic nerve and retinal vasculature;
- cardiac chambers, valves, papillary muscles, coronary vessels and conduction anatomy;
- nephron/glomerular microanatomy;
- hepatic lobule and sinusoidal microarchitecture;
- bone cortical/trabecular microstructure;
- muscle fascicle and tendon enthesis;
- skin epidermal/dermal layers;
- lymph-node and marrow microenvironments.

The user should transition between modules by anatomical anchors rather than pretending one giant mesh remains accurate from metres to micrometres.

## Material realism rules

PBR parameters are educational approximations, not optical measurements of a patient. Keep them separate from measured tissue properties.

If validated optical-property datasets are added later, store:

- wavelength;
- measurement method;
- tissue preparation state;
- scattering/absorption coefficients;
- refractive index;
- uncertainty;
- source citation.

Only then should the renderer claim measurement-based optical simulation.

## Performance requirements

Before adding larger geometry:

- monitor GPU memory per layer;
- use lazy layer streaming;
- release hidden layer geometry/material references;
- use Meshopt/Draco only where licensing and runtime support permit;
- avoid duplicating physical materials per mesh;
- retain exact picking through structure IDs or named nodes;
- test iPhone/Safari memory pressure and WebGL context loss;
- keep a low-memory fallback.

## Validation gates

A high-resolution asset is accepted only when:

- its source/license is known;
- expected structure names survive export;
- laterality survives export;
- world scale is verified;
- bounding boxes align to the atlas reference frame;
- landmark distances remain within an explicitly declared tolerance;
- topology corruption checks pass;
- screenshots are reviewed against source anatomy;
- provenance metadata ships beside the asset.

## Clinical boundary

The Realistic Atlas is educational reference anatomy. Patient-specific claims require patient-derived data and the provenance rules defined in `DIGITAL_TWIN_ENGINE.md`.
