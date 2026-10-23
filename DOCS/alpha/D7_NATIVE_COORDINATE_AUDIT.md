# D7 public gait rig coordinate audit

This is a reproducible engineering inventory for the two published adult WALK/RUN rigs. It does not promote D7 from **REPORTED**. The separate source-bound contact measurement is in PR #2554; this audit does not replace its stance or slip analysis.

The public GLBs use `EXT_meshopt_compression`, which Blender 5.2.2 cannot directly import in this workflow. `scripts/qa/decode-rig-for-blender.mjs` creates temporary decoded GLBs by rewriting buffer storage only. The test compares all node, mesh, animation, skin, accessor, and scene declarations, each loaded mesh position/index array, and every animation track's name, duration, times, values, and interpolation against the original as loaded by Three.js. It also pins source and decoded SHA-256. The original GLBs are never rewritten.

From the repository root:

```sh
node --test scripts/qa/gait-coordinate-decode.test.mjs
node scripts/qa/decode-rig-for-blender.mjs --decoded-dir /tmp/panacea-d7-decoded
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 --python bodyexposure/pipeline/audit_public_gait_coordinates.py -- --decoded-dir /tmp/panacea-d7-decoded --out /tmp/panacea-d7-coordinate-audit.json
cmp bodyexposure/qa_reports/gait_coordinate_audit.json /tmp/panacea-d7-coordinate-audit.json
```

| Published source | SHA-256 |
| --- | --- |
| `public/bodyexposure/adult_male.rig_rom.glb` | `0d4a95646feac9d64a8c734877090d11d5a366d0b825a3f8ac9bf3a8df35450b` |
| `public/bodyexposure/vhf_denver_ct_adult_female.rig_rom.glb` | `73b112ed087bbdbf0778232f2fede7ea27e1b55ca0d2d363b0260552821a4525` |

Blender imports both intermediaries in fresh factory scenes at metric scale 1 and 24 fps. Both have WALK and RUN actions, positive foot mesh vertex counts, finite nonsingular import-pose transforms, and no glTF skins or Blender armatures. Their named pelvis and foot nodes form a rigid hierarchy of empties. The [glTF coordinate convention](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units) defines metres and +Y up; the assets' inspected foot geometry/animation establishes +Z anterior for this rig. Blender import maps that to +Z up, -Y anterior. The committed JSON records exact nodes, transforms, foot bounds, sampled frame, active action bindings, action ranges, and limitations. Blender's glTF importer evaluates its selected initial animation (ROM) at frame 1, so these bounds are explicitly labelled **import pose**, not source rest geometry. A second Blender run produced a byte-identical JSON report.

The native audit does not sample Blender animation against source animation, measure foot-ground contact or 3D slip, establish force/ground truth, or justify the current 15 mm contact and 30 mm peak research placeholders. No source geometry, landmarks, or thresholds were modified. D7 still needs valid stance coverage for female WALK/RUN and RUN plantar landmarks, independently reproduced contact measurements, and documented engineering limits before formal verification.

An independent engineering review caught an initial mislabel of imported ROM frame-1 bounds as rest bounds. The report now records the sampled frame and active action bindings, and calls these import-pose bounds. This correction changes no asset bytes or contact metric.
