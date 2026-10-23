# D7 source-bound measurement evidence

Base: `0b1ed844`. Scope: the public male and Denver female WALK/RUN rigs already claimed by the D7 reproducer. D7 remains **REPORTED**, with no ledger promotion.

The reproducer previously emitted rounded-only residuals and no source identity. A residual of 30.04 mm could become 30.0 mm before acceptance evaluated the 30 mm research placeholder. It could also emit a success-shaped report when a required animation was missing. The revised report keeps full-precision metre/second and millimetre values as acceptance inputs, with separate display rounding. It records SHA-256 of the actual GLB, reproducer, and regression implementation, the frame/unit contract, and each valid phase's sampled times and pelvis-relative AP coordinates. No geometry, landmark definition, or threshold changes are included.

## Reproduction

```sh
node scripts/qa/glb-foot-contact-reproduce.mjs public/bodyexposure/adult_male.rig_rom.glb
node scripts/qa/glb-foot-contact-reproduce.mjs public/bodyexposure/vhf_denver_ct_adult_female.rig_rom.glb
node --test scripts/qa/foot-contact-math.test.mjs
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-foot-contact-reproduction.mts
```

The mandatory `npm run uji` suite regenerates both complete reports and compares their complete JSON, including source identities and raw samples. The build's Node QA discovers the independent math regressions. Negative controls change copies of the real GLB: missing/duplicate WALK or RUN, missing pelvis/foot, zero scale and reflection. Each must exit unsuccessfully, identify its cause, and emit no success report. Invalid contact thresholds, malformed/nonfinite sample arrays, unordered times and regression overflow are also rejected. A 30.04 mm synthetic residual is still rejected by the actual acceptance evaluator although display rounding reads 30.0 mm. This fixture proves numerical behavior, not patient biomechanics.

## Source identity and current measurements

| Public GLB | SHA-256 |
| --- | --- |
| adult_male.rig_rom.glb | 0d4a95646feac9d64a8c734877090d11d5a366d0b825a3f8ac9bf3a8df35450b |
| vhf_denver_ct_adult_female.rig_rom.glb | 73b112ed087bbdbf0778232f2fede7ea27e1b55ca0d2d363b0260552821a4525 |

| Variant/clip/landmark | Valid phases | RMS mm | Maximum mm |
| --- | ---: | ---: | ---: |
| Male WALK plantar heel | 2 | 7.763764946696831 | 16.643469604190706 |
| Male WALK plantar toe | 2 | 8.68758191375185 | 16.57656235993915 |
| Male RUN plantar heel/toe | 0 | unavailable | unavailable |
| Female WALK/RUN plantar heel/toe | 0 | unavailable | unavailable |

The lowest-point method has one RUN phase for each variant and therefore lacks bilateral phase coverage. Switching lowest vertex identity adds rolling/selection noise, so its residual is not actual ground slip. A finite positive but wrong unit scale cannot be identified from arbitrary geometry alone: the GLB metre convention and pinned source hashes bind these measurements to the inspected source. Zero/singular/reflected transforms are rejected. This does not establish physical calibration for arbitrary replacement assets.

## Native Blender cross-check and limits

Blender **5.2.2 LTS**, build `d13f752e3b9c`, successfully reran the existing `bodyexposure/pipeline/check_foot_slide.py` against both local native GAIT sources without saving them:

- `PANACEA_RIG_ADULT_MALE_GAIT.blend`: SHA-256 `6b5b15a38bfc0ca0dc3f5d578fa8b577c8854ef4393f4b5bf4f9cb6cfb4cb660`, 21,660,197 bytes.
- `PANACEA_RIG_VHF_DENVER_CT_GAIT.blend`: SHA-256 `e5821ff40a5a0a879bb1f2946720325bf07bb700aa16bafc80c436ce45a086d1`, 27,676,730 bytes; `--arm RIG.VHF_LOWER_LIMB --body VHF_DENVER_CT.ADULT.FEMALE`.

The male legacy WALK heel was 24.5 RMS/32.5 maximum mm, toe 11.2/29.9 mm. Female legacy WALK heel was 5.0/7.7 mm, toe 7.6/12.9 mm. These reproduce legacy method results; they do **not** validate corrected plantar contact. The native legacy script uses each marker's own floor and duplicates loop end frames, while the GLB reproducer uses one clip-wide floor and joins loop phases. The native source files are local dependencies, not newly published artifacts. Its output cannot substitute for independent Blender reproduction of the corrected full contact methodology.

Remaining D7 work: valid plantar contacts for RUN and female variants, independent corrected Blender/rig reproduction, and justified engineering acceptance limits. Existing 15 mm RMS/30 mm peak limits remain expressly research placeholders, without literature or clinical validation. Rigid ankle-attached markers and a fitted forward speed measure regression residuals, not ground-truth foot slip; no clinical approval or anatomical source modification is inferred.

## Validation

Focused final source replay, source identity, eight corrupted-GLB cases, four invalid threshold cases, and raw acceptance regression passed. Math QA: 3/3 passed. The build completed its 975/975 Node QA tests. Native Blender checks completed for both variants as described above. `git diff --check` passed.

Full local build/typecheck, frontend `npm run uji`, and server `npm run uji` were interrupted with exit 130 at the integrator's request to avoid concurrent heavy processes exhausting host resources. They are **not** recorded as passed. Remaining full gates are queued serially; exact-head CI and required integration checks must finish before merge. Local logs are supplementary; the committed automated suites are the reproducible contract.
