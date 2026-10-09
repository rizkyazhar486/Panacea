# WALK / RUN loop continuity and clip transitions (adult male rig)

Measured 2026-10-10 on the published `adult_male.rig_rom.glb` from PR #2300 (fixed loop timing), decoded with
`gltfpack -noq -af 0` (without `-af 0` gltfpack resamples to 30 Hz and the numbers change).
Reproduce: `python3 bodyexposure/pipeline/check_gait_loop.py <decoded.glb>` (needs numpy); browser part: `qa/gait-visual-check.mjs`.
Reports: `bodyexposure/qa_reports/gait_loop_continuity.json`, `gait_visual_browser.json`.

## What was checked and the result

| Check | WALK (27 keys, 1.083 s) | RUN (19 keys, 0.75 s) |
|---|---|---|
| Max seam angle, first vs last key, 10 animated bones | 0.0° | 0.0° |
| Pelvis/root drift | 0.0 m | 0.0 m |
| Angular-velocity jump at the seam, worst bone | 132 deg/s (SHIN.L) | 251 deg/s (SHIN.R) |
| Same jump relative to the largest interior frame-to-frame change of that bone | ≤ 0.48 | ≤ 0.83 |
| Bones whose seam jump exceeds their own interior maximum | none | none |
| Root velocity jump (vertical bounce) | 0.12 m/s | 0.33 m/s |

Reading: endpoints match exactly, and the velocity step at the wrap is no larger than the variation between ordinary
neighbouring keys. Endpoint match alone would not have shown that, so both are reported. At 24 fps the finite differences
are coarse; this is not a proof of C1 continuity.

## Defect found: clip switches are hard cuts

The viewer used `stopAllAction()` then `play()`, so a switch jumped to the new clip's first pose. Largest single-bone pose jump
between first keys: ROM↔WALK 69°, ROM↔RUN 117°, WALK↔RUN 102°.
Fix in this PR: the last pose of the old clip is captured and blended into the new clip over 0.3 s (smootherstep,
`crossfadeWeight`, unit-tested). Browser check: the first frame after a switch is 85–89 % of the hard-cut pixel difference
(the screenshot itself takes a sizeable part of the 0.3 s, so this shows a blend in progress, not exact continuity).

## Not verified

- **Foot sliding**: NOT VERIFIED. The clips are in place and the viewer applies no root speed. The rig has no heel/toe
  bone, so stance is only approximated by ankle height; the WALK figure is inconclusive, the RUN figure (7 intervals) is indicative only.
- Animation in a physical sense (ground reaction, centre of mass) is not modelled. The motion is CMU motion capture of one other
  person, retargeted and range-limited; it is not patient biomechanics.
- Real-GPU frame rate: the 48–60 fps figures come from software rendering in headless Chrome.
- `clinically_reviewed` is false; nothing here is clinical validation.
