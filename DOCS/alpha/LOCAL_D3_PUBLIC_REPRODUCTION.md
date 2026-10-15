# D3 public geometry reproduction

Engineering evidence, not patient anatomy or clinical review. Baseline main: `94d2e0f8597cef18e5f7fe485f7b7c606ed23b42`.

The original Blender report `bodyexposure/qa_reports/gross_adult_male.json` passes. Previous independent public GLB checks reproduced only lateralities, organ sides and feet; PR2525 added coarse cavity bounds. This increment reproduces all nine original gross relations using source vertex centroids and seven directional organ-interpenetration screens over public LOD3 geometry.

## Reproduce

```sh
node scripts/qa/public-organ-geometry.mjs public/bodyexposure/adult_male /tmp/public-organs.json
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 -P scripts/qa/public-organ-interpenetration.py -- /tmp/public-organs.json /tmp/public-interpenetration.json
node --test scripts/qa/public-organ-geometry.test.mjs
BLENDER_BIN=/Applications/Blender.app/Contents/MacOS/Blender node scripts/qa/public-organ-replay.mjs
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 -P scripts/qa/test_public_organ_interpenetration.py
```

Use the installed Blender executable on other platforms. The extractor uses the application Three.js/meshopt loader, original `userData.name`, world transformations and a glTF Y-up to Blender Z-up basis change. Source GLBs are read only. Each of the 14 files is SHA256-pinned in the committed report.

## Observed result

`bodyexposure/qa_reports/gross_public_organ_interpenetration.adult_male.json`: 3,877 structures, 3,403 paired, nine gross checks pass. The source-documented right vagus ambiguity remains an exception; no new QA exemption is added. Seven vertex-interpenetration fractions: liver/heart 0.014; liver/stomach 0.024; heart/left lung 0; heart/right lung 0; left kidney/spleen 0.016; liver/right kidney 0; bladder/rectum 0. All are at or below the original 0.05 technical screen.

The sampling stride, three ray directions, majority parity, 1e-5 metre crossing advance and display rounding follow `bodyexposure/pipeline/qa_gross_anatomy.py`. The threshold compares the raw fraction before display rounding: 15/298 rejects even though it displays 0.050. This is stricter than the original rounded comparison; all public pairs still pass. A ray hitting the crossing cap fails closed. Missing geometry, required structures and pair coverage reject rather than yielding a vacuous pass.

## Limits and integration

LOD3 topology, quantization and split source vertices differ from the original Blender mesh, so numerical centroids and fractions need not be identical. This directional sampled vertex fraction is not overlap volume. Reference anatomy is not patient-specific; existing accuracy/review-required labels and clinical boundaries remain intact.

This provides missing local D3 evidence. Canonical status promotion remains contingent on review, current-head required CI and integration. Initial baseline main had moved-module path failures; PR2534 repaired those contracts and this candidate is synchronized onto main `12515dbd`. Use the canonical `docs/alpha/OMEGA_EXECUTION_CHECKPOINT.md` for the execution ledger. No CI, shared baseline or clinical-review status is modified here.

Configured CodeRabbit review on e497def2 identified the rounding boundary and requested an exact report replay. Both are addressed: six Node tests, nine Blender tests including 15/298 rejection, and the native replay command compare all committed source/result fields. Changing a fraction, inside count, gross detail or success flag is rejected.
