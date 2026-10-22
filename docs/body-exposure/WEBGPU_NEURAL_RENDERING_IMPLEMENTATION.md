# Body Exposure — WebGPU / Temporal Upscaling / Neural Rendering Implementation Guide

**Status:** implementation specification, not a claim that the feature is shipped or verified  
**Requested:** 2026-10-22 (product owner)  
**For:** Claude Code, Argon, Codex, and any engineering agent touching Body Exposure  
**Scope:** Panacea Body Exposure only; optional reusable renderer primitives if justified

## 0. Goal and technology truth

Make Body Exposure's **existing source-backed 3D anatomy** more visually convincing, responsive, and stable, from phones to capable desktop GPUs. The desired visual quality is "DLSS 5-like"; **do not label a browser feature "NVIDIA DLSS 5" unless an officially supported, licensed NVIDIA integration actually runs there**.

As of 2026-10-22:
- NVIDIA DLSS 5 is a **3D-guided generative appearance** stage targeting supported RTX/native game pipelines. It is **not** the same as traditional DLSS Super Resolution, WebGPU, TAAU, or ordinary PBR. There is no documented, supported drop-in DLSS 5 integration for Panacea's browser-based Three.js application.
- Three.js r186 documents **TAAUNode** for temporal anti-aliasing plus resolution reconstruction in its WebGPU/TSL rendering pipeline. TAAU requires beauty, depth, and velocity buffers and camera motion; **MSAA must be disabled** on this path.
- A third-party WebGPU temporal upscaler, \`@pmndrs/upscaler\`, exists (r186+ preferred); compare against built-in TAAU before adding dependencies. It has **no WebGL fallback**.
- Experimental browser recreations of DLSS 5–like neural rendering exist, but are not equivalent to an official licensed production integration; browser neural appearance generation can be too slow or structurally misleading for medical reference.
- Treat **upscaling** (reconstructing a displayed image from lower-resolution rendering) and **neural appearance synthesis** (adding inferred visual appearance) as separate subsystems.

**Do not copy leaked NVIDIA weights, proprietary model files, or restricted SDKs.** Require published license/provenance and a separate explicit owner decision for any true neural appearance model.

## 1. Repo-specific starting point and constraints

At the time of this guide, root \`package.json\` uses React + Vite + TypeScript and \`three: ^0.185.1\` with \`@types/three: ^0.185.4\`. Inspect **actual lockfile resolution**, not only these version ranges. The existing Body Exposure pipeline is documented in \`DOCS/body-exposure/BODY-3D-ASSET-PIPELINE.md\` (check the current path after any documentation migration). It uses Blender-authored, licensed GLBs; named source meshes; atlas metadata; \`body3dPixelRatio\`; and progressive whole-body-to-organ detail.

Mandatory preflight, before editing:
1. Read root \`CLAUDE.md\`, \`AGENTS.md\`, the Body 3D asset pipeline, applicable anatomy source/manifest tests, UI responsive standards, and \`DOCS/FOLDER-STRUCTURE-STANDARD.md\`.
2. Search the working tree, **not assumed paths**, with \`git grep -n -E 'CanonicalBody|body3dPixelRatio|WebGLRenderer|WebGPURenderer|ShaderMaterial|onBeforeCompile|EffectComposer|requestAnimationFrame'\` and inspect the actual Body Exposure composition point, renderer owner, controls, atlas picking, overlays, disposals and relevant tests.
3. Check \`git status\`, exact \`main\` head, open PRs, their changed files, and ancestry. **PR #2677 (canonical materials/PBR) may overlap.** Reuse its verified approach or wait/rebase, but never overwrite or silently supersede unfinished work.
4. Identify existing renderer instances. Do **not** create a second competing renderer or duplicate the canonical anatomy model.
5. Before a Three.js upgrade, run a compatibility inventory of loaders, custom shaders, postprocessing, render-target usage, BVH picking, transparency, screenshots, and current WebGL path. Keep the upgrade isolated and regression-testable.

This is a **follow-on feature**, not permission to bypass outstanding stabilization, F1/F2, security, body-render, or clinical gates. Implement in small branch/PR slices. Never force-merge or mark unrelated ledger tasks VERIFIED.

## 2. Render-mode contract

Provide one renderer capability/service contract, independent of clinical/anatomical state:

| Internal mode | Backend | Purpose | User-visible description |
|---|---|---|---|
| \`clinical\` (default) | existing stable WebGL 2; WebGPU only after parity | source-faithful reference image | Clinical precision |
| \`ultra\` (opt-in) | WebGPU + PBR + temporal upscaling, when validated | high-fidelity interactive view | Ultra quality |
| \`experimental-neural\` (flagged OFF) | isolated, optional, licensed model | explicitly synthetic appearance study | Experimental appearance |

\`clinical\` must remain available on every currently supported browser/device. Avoid showing unavailable modes as functioning controls. On GPU feature detection failure, shader compilation failure, unsupported browser, context/device loss, low memory, or invalid temporal buffers: **recover to the prior supported renderer** with preserved anatomical selection/camera state and an honest non-blocking notification.

The experimental mode is **not** a source of diagnostic anatomy. Make it opt-in, visually distinguishable, and disabled for CT/MRI/X-ray, source-label overlays, measurements, clipping-derived geometry, lesion localization, and any reference/export used for medical accuracy. Never feed generated pixels into mesh identification, anatomical coordinates, registration, measurement, clinical inference, or clinical-state persistence.

## 3. Phased implementation — execute in order

### P0 — Inventory, baseline, and quality gates (no code changes required yet)

- Establish repeatable baseline screenshots and traces for the **same** anatomy GLBs: whole-body surface, muscle/skeleton transparency, nervous/vascular fine lines, eye/organ close-up, cross-section, fast orbit, camera zoom, and mobile portrait.
- Record device/browser/GPU, viewport, DPR, GLB counts/size, cold-start time, peak memory when measurable, p50/p95 frame time (milliseconds), and failure rates. Include desktop WebGPU, desktop forced WebGL, mobile WebGPU if supported, mobile WebGL fallback, and unsupported browser.
- Pin source assets and preserve mesh IDs/names, metadata, layer visibility, sex/reference coordinate modes, atlas picking, material provenance, screenshot semantics, and fallbacks. No invented structures or detail.
- Set a new, **independent** rendering acceptance matrix; do not modify the canonical 45-task/44-active ledger merely to count this experiment as completed.

### P1 — Controlled WebGPU compatibility branch

- Upgrade Three.js + typings to a **verified compatible** version (r186+ if TAAU is required); regenerate lockfile, rebuild and test. Do not assert upgrade support solely because an API exists in docs.
- Spike the current anatomical scene with \`three/webgpu\` on a temporary **opt-in feature flag**; initialize asynchronously and test the intended node-material pipeline. Three.js \`WebGPURenderer\` can use a WebGL 2 backend in some circumstances, **but WebGPU-only compute upscalers cannot**. Explicitly detect which backend is live.
- Audit incompatibilities: \`ShaderMaterial\`, \`RawShaderMaterial\`, \`onBeforeCompile\` customizations, \`EffectComposer\`, bespoke WebGL extensions, existing baked AO, transparent mesh ordering, line/shader uniforms, clipping, loaders and hit-testing. Port only what is necessary to TSL/node materials; don't silently drop features.
- Preserve the current WebGL implementation as a stable user-selectable/automatic fallback throughout rollout. Lazy-load WebGPU-only chunks; dispose GPU resources and callbacks when leaving Body Exposure.

### P2 — Ultra quality, without neural generation

- Retain source-authored GLB structure, provenance and colors. Extend the existing PBR material classification in coordination with PR #2677; improve physically plausible light rigs, optional screen-space AO, normals, tone mapping, material response and **conservative** subsurface appearance where source-backed. Cosmetic shading must never pretend to reveal histology.
- Integrate built-in \`TAAUNode\` with low-resolution beauty/depth/velocity passes and camera jitter, in a verified rendering-pipeline graph. Ensure velocity vectors cover skinned/transformed meshes or disable TAAU for scenes where correctness is not assured. Use an output-resolution resolve and disable MSAA on TAAU.
- Compare to one alternative \`@pmndrs/upscaler\` only if baseline measurements justify added code/dependency. Respect its browser/WebGPU requirements, license, raw-GPU assumptions, and release compatibility.
- Try **0.75 linear render scale** first (not a universal preset). At equal aspect ratio, source pixels = \`widthScale × heightScale\` = \`0.75 × 0.75 = 0.5625\` or 56.25% of native pixels. The 43.75% reduction in shaded input pixels is **not** a prediction of total frame-time improvement. Adapt scale within an evidence-based DPR/frame-budget policy, subject to safety checks.
- Preserve translucent tissues, edges, transparency, segmentation color semantics, semantic zoom, interactive cross-section and thin neurovascular branches. If temporally unstable, ghosting, flicker or blur affects clinically important contours, switch to full-res/native AA.

### P3 — Capability-aware, compact controls

- Add controls only if they do not cover the anatomical viewport: \`Clinical precision\` (default), \`Ultra quality\` (only supported and verified), and a compact information tooltip for backend/fallback.
- Keep the existing \`body3dPixelRatio\` and mobile performance policies as the authoritative outer cap. Never promise RTX/DLSS where hardware/backend cannot support it.
- Optional experimental neural mode: gated behind a separate developer feature flag **OFF by default** and an internal evaluation build; require explicitly cleared redistribution/model rights and documented mismatch-risk review. **Do not connect arbitrary network-upload image/model services to patient screenshots or PHI.**
- Never mutate canonical anatomy, mesh labels, source-space registration, anatomy provenance, AI clinical state, GLB source hashes or durable EMR data when the visual mode changes.

### P4 — Acceptance, rollout, and release

A rendering PR must supply **evidence for both success and failure cases**:
1. Contract tests: feature detection, backend selection, unsupported WebGPU fallback, device/context loss, absent velocity/depth, mode-switch race, cleanup, and safe persistence of camera/selection (if settings persist).
2. Visual regression: identical camera/asset baselines for default vs Ultra, including motion; anatomy silhouette/labels, organ layering, vascular branches, translucency, picking, cross-sections, export/reference mode and light/dark themes.
3. Medical fidelity: compare source-backed meshes/IDs, boundaries, landmark registration and measurements against the original. **No changes permitted to clinical truth, physical geometry, or disease depiction from generative appearance**.
4. Browser device matrix: Chrome/Edge WebGPU; Safari/mobile where supported; Firefox/no WebGPU as applicable; forced WebGL; WebGPU unavailable/memory-constrained. Check portrait 390×844, offscreen suspension, restored focus, keyboard and touch interaction.
5. Performance: report p50/p95 frame time, frame drops, startup, memory, GPU errors and screenshots **against P0 on matching devices/scenes**. Demonstrate benefit or explicitly justify reverting/limiting Ultra; do not publish an invented universal FPS claim.
6. Repository gates: run relevant anatomy/browser/3D acceptance tests plus \`npm run build\`, \`npm run uji\`, architecture checks and required exact-head CI. Report the exact SHA, checks and blockers. Never weaken tests to get green.
7. PR body: outline mode behavior, compatibility failures, tested hardware, source references, screenshots and explicit statement of what was **not** verified. Only merge after the project's standard review and acceptance policy.

## 4. Agent execution handoff

**Directive for Claude/Argon:** Implement P0 first. Then deliver **separate, small PRs**: (A) Three/WebGPU compatibility + fallbacks; (B) TAAU Ultra-quality pipeline; (C) UI + performance and visual acceptance; (D, only after explicit license/safety approval) optional neural experiment. Before each PR check updated \`main\`, competing PRs and exact-head gates. Protect the canonical GLBs, mesh IDs and medical source-of-truth. Keep every working current feature. If blocked, record reproducible blocker/command/log and continue only with a non-conflicting independent slice. **Do not claim DLSS 5 deployed, Ultra production-ready, or medical accuracy verified without exact evidence.**

Definition of done for browser-delivered improvement: Ultra actually renders on supported WebGPU hardware; default clinical rendering remains correct; unsupported devices fall back; image fidelity and interaction survive; perf improvement is measured; all relevant gates pass on the current exact head. A written document alone is **not** an implementation.

## 5. References (check versions/licensing at implementation time)

1. NVIDIA, **DLSS 5: Generative Neural Rendering**, research publication (2026-09-01): https://research.nvidia.com/labs/adlr/DLSS5/
2. NVIDIA Technical Blog, **DLSS 5 with 3D-Guided Neural Rendering** (2026-09-22): https://developer.nvidia.com/blog/whats-new-for-game-developers-dlss-5-with-3d-guided-neural-rendering-nvidia-ace-updates-and-new-rtx-kit-capabilities
3. Three.js **WebGPURenderer** official manual: https://threejs.org/manual/pages/webgpurenderer
4. Three.js **TAAUNode** documentation and example: https://threejs.org/docs/pages/TAAUNode.html and https://threejs.org/examples/webgpu_upscaling_taau.html
5. \`@pmndrs/upscaler\`, upstream implementation and compatibility: https://github.com/pmndrs/upscaler and https://github.com/pmndrs/upscaler/blob/main/docs/compatibility.md
6. Experimental browser DLSS-NR reference **for research only, not production/official NVIDIA support**: https://github.com/bhouston/three-dlss-nr
7. Panacea canonical 3D asset pipeline: \`DOCS/body-exposure/BODY-3D-ASSET-PIPELINE.md\`; corresponding manifest and source at \`public/anatomy/\`.

**Architecture rule:** anatomical truth comes from licensed and validated source data, not from an AI-generated photo-realistic appearance layer.