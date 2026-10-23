# D7 independent Blender contact reproduction

This engineering cross-check samples the public adult male and Denver CT adult female WALK/RUN clips in Blender 5.2.2 LTS. It depends on the temporary meshopt decoder in PR #2555; source-bound Three.js measurements are in PR #2554 (`44ecb92d`). Neither published GLB nor native `.blend` source is modified. D7 stays **REPORTED**.

Blender's glTF importer initially activates ROM at frame 1. The script first resets each imported node to the GLB-declared rest transform, converting the glTF metre/+Y-up basis to Blender +Z-up. It selects posterior/anterior extreme vertices and the lowest vertices in the posterior/anterior quarters of each foot in that source rest pose. It then activates each WALK/RUN action slot, samples at 24 fps, uses one floor per clip, drops the duplicate loop end frame, joins stance across the loop seam, and fits one shared forward velocity to pelvis-relative AP samples. `bodyexposure/qa_reports/gait_contact_blender_reproduction.json` includes source/decoded hashes, rest marker indices/positions, phase windows, raw samples, RMS and peak residuals.

```sh
node scripts/qa/decode-rig-for-blender.mjs --decoded-dir /tmp/panacea-d7-decoded
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 --python bodyexposure/pipeline/reproduce_public_contact_blender.py -- --decoded-dir /tmp/panacea-d7-decoded --out /tmp/panacea-d7-blender-contact.json
cmp bodyexposure/qa_reports/gait_contact_blender_reproduction.json /tmp/panacea-d7-blender-contact.json
node --test scripts/qa/blender-contact-report.test.mjs scripts/qa/compare-blender-gait-contact.test.mjs
```

After obtaining the exact `44ecb92d` PR #2554 reports as `/tmp/panacea-d7-pr2554-male.json` and `/tmp/panacea-d7-pr2554-female.json`, compare the two independent implementations:

```sh
node scripts/qa/compare-blender-gait-contact.mjs bodyexposure/qa_reports/gait_contact_blender_reproduction.json /tmp/panacea-d7-pr2554-male.json /tmp/panacea-d7-pr2554-female.json
```

The checked run matched **all** frame counts, loop flags, stance counts, stance frame counts and per-side phase windows for both rigs and both clips. Eight valid marker/clip pairs had maximum absolute differences of **0.010934 mm** in RMS/peak residuals and **0.000157 m/s** in fitted speed. The largest floor difference was **0.000076 m**. The comparator rejects deviations of 0.02 mm, 0.0002 m/s, or 0.0001 m respectively; these are cross-library numerical tolerances chosen above measured differences, **not gait quality or clinical acceptance thresholds**. The focused comparator tests include forged source, changed phases, invented no-stance metrics, nonfinite values, missing clips, and an excessive residual.

Native Blender reproduced the same **missing coverage**: adult male WALK has two heel/toe plantar stance phases, but male RUN and both female clips have zero plantar stance phases. The sole definition has at most one RUN phase per rig. These source limitations cannot be repaired by changing the measurement code. The existing 15 mm contact window and 15/30 mm research acceptance limits remain unvalidated placeholders. Rigid vertices and a fitted AP velocity do not measure 3D ground slip, ground-reaction forces, or clinical biomechanics; Blender and Three.js also share the same underlying GLB, so their agreement is numerical implementation evidence, not independent anatomical truth.

The Blender report replay was byte-identical. A truncated decoded GLB produced `invalid GLB header`, nonzero exit, and left a prior output file untouched. The coordinate/rest pose correction was independently reviewed in PR #2555. Remaining D7 work is source-valid stance coverage for all claimed variants, justified technical limits, and any additional measurement needed to establish actual foot-ground slip.
