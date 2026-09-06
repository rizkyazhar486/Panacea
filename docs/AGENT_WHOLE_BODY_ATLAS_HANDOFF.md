# Panacea Whole-Body Precision Atlas — Agent Handoff

This file is the implementation contract for the next coding/visual agents. Do not restart the design from scratch. Extend the scaffold already committed in:

- `src/lib/wholeBodyAtlasBlueprint.ts`
- `src/lib/biomechanicsModel.ts`
- `src/pages/bodyhub/WholeBodyPrecisionLab.tsx`
- existing `src/components/Body3D.tsx`
- existing `src/pages/BodyExplorer.tsx`
- existing `src/pages/bodyhub/SurgicalLab.tsx`
- existing `src/pages/bodyhub/CellLab.tsx`
- existing `src/pages/bodyhub/WorkoutSimSection.tsx`

## Product target

Build a whole-body medical atlas with the interaction quality of an exploded anatomy product and the inspectability of a high-detail dental atlas, but scaled to the entire human body and linked to human movement biomechanics.

Reference UX supplied by the product owner:

- `https://anatomy-unfolded.brianp.chatgpt.site/`
- `https://dental-atlas-akimoto.m-akimoto.chatgpt.site/`

Do not copy proprietary assets or source code from those sites. Reproduce the interaction principles only: exploded layers, direct inspection, region focus, precise labels, translucent tissues, strong depth cues, orbit controls, contextual panels and progressive detail.

## Non-negotiable medical truth rules

1. Never invent anatomy geometry to fill a mesh gap.
2. Every specialty structure must expose one of:
   - `native-geometry`
   - `adjacent-geometry`
   - `not-represented`
3. Teaching overlays must say they are overlays.
4. CT/MRI educational rendering must never be presented as a patient scan.
5. Microanatomy/cell scale must never imply literal whole-body scale.
6. Biomechanics equations must distinguish external-load teaching calculations from patient-specific inverse dynamics.

## Existing formulas to preserve

### External-load mechanics

`m_eff = m_body × support_fraction + m_external`

`F = m_eff × (g + a)`

`τ = F × r`

`W = τ × θ`

`P = τ × ω`

`J ≈ F × Δt`

Use `g = 9.80665 m/s²`.

The implementation lives in `src/lib/biomechanicsModel.ts`. Extend it; do not create another conflicting calculation engine.

### Cell energy accounting

Keep the existing Cell Lab distinction between malate–aspartate and glycerol-3-phosphate shuttles. A single universal ATP-per-glucose number without compartment/shuttle context is not acceptable.

## Required Body Explorer integration

Add a new lazy-loaded panel in `src/pages/BodyExplorer.tsx`:

```ts
const WholeBodyPrecisionLab = lazy(() => import('./bodyhub/WholeBodyPrecisionLab'))
```

Add a new `PanelTab`, recommended key:

```ts
'precision-atlas'
```

Recommended label:

```ts
Whole-body atlas
```

Render it using the existing shared Body3D state, not a second independent body viewer:

```tsx
<WholeBodyPrecisionLab
  onHighlight={(nodeHints) => {
    // resolve hints to real node names through the existing structure index
    // then setHighlighted(...)
  }}
  onEnableLayer={(layer) => {
    setLayers((prev) => prev.has(layer) ? prev : new Set(prev).add(layer))
  }}
  onSetUnfold={setUnfold}
  onSetDissectionDepth={setDissect}
/>
```

### Important integration requirement

`nodeHints` are semantic hints, not guaranteed exact GLB names. Resolve them against the existing 2,587-structure index or a generated mesh-name lookup. Do not pass fuzzy hints directly to exact-name highlighting if `Body3D` expects exact names.

## Whole-body exploded anatomy requirements

### Camera presets

Create camera presets for:

- head/neck
- thorax
- abdomen
- pelvis/perineum
- upper limb
- lower limb
- spine/back

Each preset must preserve orientation and provide a reset-to-whole-body action.

### Unfold algorithm

The current radial unfold rule is the correct foundation:

- preserve superior–inferior position
- translate structures away from the body axis
- do not explode everything away from one central point
- midline structures should move minimally
- interpolate smoothly between anatomical and exploded state

Improve with:

- region-specific maximum displacement
- collision-aware label placement
- optional per-system explode amount
- animated transition with reduced-motion support

### Material stack

Use clinically readable materials rather than game-like shading:

- bone: warm ivory, low roughness variation
- muscle: deep red with subtle fiber-oriented normal detail if available
- artery: arterial red
- vein: deep blue
- nerve: warm yellow
- viscera: organ-specific restrained color
- fascia/teaching overlays: translucent neutral layers
- selected structure: Panacea green edge/emissive accent

Do not replace source materials with photorealistic texture that obscures structure boundaries.

### Labels

Labels must:

- occlude intelligently
- avoid crossing the entire screen
- collapse when zoomed out
- expand from system → organ → structure → substructure as camera distance decreases
- show left/right explicitly
- show geometry provenance in the details panel

## Dental-atlas interaction translated to the whole body

The whole-body equivalent of tooth-by-tooth inspection is:

`body → region → organ/system → structure → substructure → tissue/microstructure`

Examples:

- whole body → upper limb → shoulder → rotator cuff → supraspinatus → tendon insertion
- whole body → abdomen → hepatobiliary → gallbladder → cystic duct → critical-view structures
- whole body → lower limb → knee → extensor mechanism → patella/quadriceps tendon → surgical layer

Implement progressive detail. Do not dump every label at once.

## Surgical education bridge

Use `SPECIALTY_ATLAS_MODULES` from `wholeBodyAtlasBlueprint.ts` as the bridge between the whole-body atlas and `SurgicalLab`.

Minimum production coverage:

### Orthopedic

- medial parapatellar knee approach
- carpal tunnel release
- hip approach overview
- fracture fixation corridor concepts
- shoulder approach overview

### Plastic

- facial skin/subcutaneous/SMAS/deep-plane concept
- advancement flap
- rotation flap
- transposition flap
- graft versus flap blood-supply concept
- hand tendon/nerve danger zones

### General surgery

- anterior abdominal wall
- inguinal canal
- laparotomy entry
- hepatocystic triangle / critical view of safety
- bowel-wall/anastomosis concept
- chest tube safe triangle

Each step must expose:

- layer
- structure at risk
- what can actually be highlighted in the current mesh
- what is an overlay
- learning endpoint

## Cell and microanatomy bridge

The whole-body atlas must allow a transition from macro to micro without pretending they share literal scale.

Recommended flow:

`organ → representative tissue → representative cell → organelle → biochemical pathway`

Examples:

- heart → cardiomyocyte → mitochondrion → TCA/ETC
- liver → hepatocyte → smooth ER/peroxisome → detox/fatty-acid pathways
- skeletal muscle → myofiber → sarcomere/mitochondrion → ATP demand
- brain → neuron → axon/synapse/mitochondrion → membrane potential and energy use

Mark each transition as `teaching-scale transition`.

## Human movement biomechanics requirements

Extend the existing `WorkoutSimSection` rather than building a competing biomechanics page.

Minimum motion library:

- walking gait
- running
- squat
- deadlift/hip hinge
- lunge
- jump
- throw
- push
- pull
- overhead reach

### Motion visualization layers

For each movement show:

1. skeletal segment pose
2. joint-center markers
3. axis/plane indicators
4. active muscle highlight
5. kinetic-chain progression
6. external force vector
7. center-of-mass projection when available
8. moment-arm visualization

### Animation truth rule

If there is no validated motion-capture sequence in the repository, label the animation `kinematic teaching animation`. Do not imply measured human motion.

## Agent ownership

### Codex

Primary responsibilities:

- integrate `WholeBodyPrecisionLab` into `BodyExplorer`
- connect semantic node hints to exact GLB node names
- remove duplicated biomechanics formulas by routing through `biomechanicsModel.ts`
- add tests
- keep TypeScript/build clean
- wire specialty atlas to existing SurgicalLab
- add deep-link state between atlas ↔ surgery ↔ workout ↔ cell

Acceptance criteria:

- `npm run build` succeeds
- existing tests remain green
- no new duplicated formula engine
- no missing callback causes silent non-functioning UI

### Astra

Primary responsibilities:

- high-quality 3D presentation
- Blender cleanup/export pipeline when source license permits
- camera choreography
- region focus transitions
- translucent layer materials
- selected-structure outline/highlight
- label composition
- lighting and depth cues
- visual distinction between native mesh and teaching overlay

Astra must not fabricate fine anatomy solely to make the render look complete. If a missing structure is needed, source a compatible licensed mesh or render a clearly identified schematic overlay.

### Ultracode

Primary responsibilities:

- performance pass
- draw-call reduction
- geometry/texture compression
- mesh LOD
- progressive loading by region/system
- GPU memory control on mobile Safari
- raycast acceleration / spatial indexing
- label virtualization
- animation performance
- regression tests around the viewer

Target behavior:

- initial whole-body view should not require every specialty asset to load
- selecting a region may progressively load greater detail
- mobile interaction must remain responsive

## Asset and license gate

Before importing any new 3D asset, record:

- source URL/repository
- author/organization
- license
- modifications
- whether commercial redistribution is allowed
- attribution requirement

Update the relevant `CREDITS.txt`/license record in the same commit.

Reject:

- no-license repositories
- incompatible GPL/AGPL application code for direct commercial incorporation
- unclear redistribution rights
- scraped proprietary atlas meshes

## Recommended architecture

```text
BodyExplorer
  └── Body3D (one shared viewer)
      ├── WholeBodyPrecisionLab
      │   ├── Unfolded body
      │   ├── Specialty atlas
      │   └── Movement biomechanics
      ├── SurgicalLab
      ├── CellLab
      └── WorkoutSimSection
```

Do not create multiple disconnected full-body viewers unless there is a strong technical reason. Shared state is the product advantage.

## Completion checklist

- [ ] `WholeBodyPrecisionLab` integrated into Body Explorer tabs
- [ ] region camera presets implemented
- [ ] semantic hints resolved to exact mesh nodes
- [ ] progressive label hierarchy implemented
- [ ] native/adjacent/missing geometry shown in UI
- [ ] specialty atlas links to surgical steps
- [ ] macro-to-micro transition links to Cell Lab
- [ ] movement library connected to exact muscles
- [ ] force vector and moment arm visualized
- [ ] biomechanics calculations use shared engine
- [ ] mobile performance verified
- [ ] all new assets licensed and credited
- [ ] TypeScript/build/tests green
- [ ] Vercel deployment green

## References for implementation decisions

- Neumann DA. *Kinesiology of the Musculoskeletal System*. Elsevier.
- Winter DA. *Biomechanics and Motor Control of Human Movement*. Wiley.
- Moore KL, Dalley AF, Agur AMR. *Clinically Oriented Anatomy*. Wolters Kluwer.
- Standring S, ed. *Gray's Anatomy*. Elsevier.
- Alberts B, et al. *Molecular Biology of the Cell*. Garland Science.
- Nelson DL, Cox MM. *Lehninger Principles of Biochemistry*. Macmillan Learning.

The references guide anatomy and mechanics concepts. Mesh-specific claims must still be verified against the actual geometry shipped in this repository.
