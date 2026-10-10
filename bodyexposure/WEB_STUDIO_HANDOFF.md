# Body Exposure: interactive studio lighting

## Scope and coordination

Branch `feat/body-studio-viewer`, based on upstream main `0e3bab80`, is independent
of the offline Cycles PR #2360. Work was isolated in the Codex worktree; Claude's
dirty source/data/QA files and PRs #2338/#2353 were inspected and not changed.
The additive domain exports must be retained alongside concurrent ontology work.
Before publication, upstream merged Claude's #2338. The branch was rebased onto
`1dda7e71` without conflicts; its neutral-centred female WALK/RUN rig is preserved.
Architecture/build/full-suite gates were rerun on that integration.

Open **Canonical Human Bodies** in the existing navigation, or the existing
`/#/body-exposure/canonical` route. Lighting controls sit below Graphics quality.
Default **Standard / 0 EV** preserves the existing lighting, tone mapping and
environment intensity. **Studio** adds camera-relative key/rim lighting and
hemispheric fill. It uses the same directional/hemisphere light counts as Standard
and no shadows, new textures, models or external requests. Exposure is validated
within −2…+2 EV and maps to `2 ** EV`. Reset returns Standard / 0 EV.

Quality changes retain lighting/exposure. The existing adaptive DPR, LOD,
render-on-demand, motion, clipping, picking and clinical-review paths are retained.
Temporary lighting groups are removed on unmount. Toolbar controls now precede
the canvas in normal layout instead of obscuring the head, particularly on mobile.

## Validation rules and evidence

- `scripts/qa/presentation-lighting.test.mjs`: exact settings/multipliers,
  accepted modes, invalid types/NaN/infinities/range/prototype-like modes, paired
  boundaries, no partial writes, original rig parity, unchanged light counts,
  camera-world/target transforms, source identity preservation and disposal.
- The eight unit tests passed repeatedly. Changing the upper limit from +2 to +1
  deliberately made the boundary test fail; the source was restored immediately.
- `qa/studio-lighting-check.mjs` loads actual published GLBs, tests both light/dark
  at 390×844 and 1440×900 with screenshot DPR 2, keyboard exposure endpoints,
  reset, performance-quality changes, anatomical navigation, source review,
  overflow and lighting edits during deliberately held GLB loading. Empty and
  HTTP 503 body indexes are tested without inventing anatomy.
- Actual unmodified PNGs and measured JSON live in `qa_reports/web-studio/`.
  Standard/studio captures use the same source and camera. The historical
  `mobile-before-toolbar-fix.png` shows the occlusion found during inspection.
- Reset asserts exact decoded scene-pixel hashes, with the bottom 40 CSS pixels
  excluded from **comparison only** because they contain the CSS stats/footer.
  Full PNGs remain unmodified. Early comparisons found 1–2-channel compositor
  differences in the footer, not in the anatomy. Captures use a fixed scroll
  alignment to avoid fractional CSS/device interpolation differences. No pixel
  error tolerance was introduced; assertions on review/geometry remain intact.
  Geometry checks compare exact structure/triangle counters and exact GLB request
  counts; elapsed import milliseconds are telemetry, not an invariant. An initial
  repeat caught differing timing text (250→219 ms) with unchanged geometry. Timing
  text was removed from the geometry assertion, not from the recorded report;
  the independent request-count assertion remains strict.
  The corrected smoke suite passed again in `/tmp/panacea-web-studio-repeat`.

Run the dev server on port 5207, then:

```sh
node --test scripts/qa/presentation-lighting.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  QA_OUT=/tmp/panacea-web-studio node qa/studio-lighting-check.mjs
```

Playwright's bundled PNG decoder is reused; no application dependency was added.
`CHROME_PATH`, `QA_URL`, `QA_OUT` can override the local browser/fixture/output.
The first cold local Vite navigation exceeded 180 seconds while modules were
processed. Subsequent checks ran after the server warmed; these are not production
load-time benchmarks.

The recorded run passed seven scenarios with 24 hashed renderer captures (plus
four full-page screenshots and the earlier toolbar diagnostic). All four
viewport/theme combinations loaded 1,313 structures / approximately 78k
triangles from seven GLB requests. Lighting/quality edits did not reload GLBs.
Performance preset measured DPR 1: 364×523 drawing buffer at 390px viewport and
1414×558 at 1440px viewport. Renderer identification was ANGLE Metal / Apple M4.
Observed page JS heap at the checkpoint ranged 52,857,276–83,820,558 bytes.
Local warmed-server load checkpoints ranged 1,650–4,111 ms; asset-import counters
were 181–268 ms. These are one-run observations, not comparative speedups or
production/mobile/GPU-memory benchmarks.

The fast Studio→exposure→quality interaction initially caught a stale-field
overwrite. Mode/exposure updates now patch independent fields through functional
React state updates; reset updates both atomically. Exact scene-pixel reset and
quality-retention assertions were retained and passed after the fix.

`qa/studio-motion-check.mjs` additionally passed on the rebased female VHF rig:
Studio remained selected through body/variant switches, WALK and RUN each changed
actual canvas pixels over 1.2 seconds, the recorded-motion/partial-coverage labels
remained present, and Stop motion exited cleanly with no page errors. Four actual
frames and hashes are in `qa_reports/web-studio-motion/`. This compatibility check
does not establish clinical gait, foot-slide accuracy or animation continuity.

Local architecture lint and ratchet passed. Build runs passed 707 QA tests and
compiled the production bundle; the full deterministic suite passed 686 files.
The build retains existing large-chunk warnings; no bundle-wide refactor was made.

Engineering API references: [Three.js directional-light targets](https://threejs.org/docs/pages/DirectionalLight.html)
and [scene environment intensity](https://threejs.org/docs/pages/Scene.html).

## Safety and limits

The scene remains a reference model, not patient-specific anatomy. Geometry,
materials, mesh metadata and source clinical review status are not upgraded by
lighting. Existing dataset provenance/licenses remain in the published
`bodyexposure/provenance.html` and per-structure panel. The screenshots are
reference-data derivatives, not new clinical evidence.

This is rasterized Three.js WebGL lighting, not Cycles, WebGPU or path tracing.
Anatomical fidelity and material realism remain limited by the existing assets.
Viewport checks on desktop hardware are not physical-mobile acceptance. Browser
JS heap observations are not GPU memory measurements. No 30–60 FPS, 8K real-time
or AAA photorealism guarantee is made. Maturity levels remain unchanged.

The branch must pass local build/tests and exact-head CI, receive the required
owner/designated review, and merge through the repository workflow before the
production Vercel deployment. A branch push alone does not update panaceamed.id.
