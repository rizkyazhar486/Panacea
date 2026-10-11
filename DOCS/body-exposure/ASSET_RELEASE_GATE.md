# Body Exposure asset release gate

The viewer loads the lightweight LOD declared in `public/bodyexposure/body_matrix.json`,
falling back to LOD3 when that body has no override. `check_web_budget.py` follows that
same rule and checks every declared body/system file at that LOD, including systems
hidden at first load. A missing or malformed file fails the gate. An empty manifest
also fails; scanning an empty directory cannot certify a release.

Initial visible triangles must stay at or below 80,000 per body. The checker reads
`DEFAULT_ON` from `CanonicalBody.tsx`, counts both indexed and non-indexed triangles,
and rejects unsupported primitive modes and invalid GLB headers. This is an asset
availability and polygon-budget check; it does not establish anatomical accuracy,
visual quality, rig contact safety, or a successful production deployment.

Run from the repository root:

```sh
python3 -m unittest discover -s bodyexposure/pipeline -p test_web_budget.py
python3 bodyexposure/pipeline/check_web_budget.py --out /tmp/body-exposure-web-budget.json
node scripts/qa/glb-load-all.mjs
node scripts/qa/glb-provenance-audit.mjs
```

The `Body Exposure assets` workflow runs the Python regressions and asset budget gate
on relevant pull requests and main pushes. Python checks need no additional packages.
Three.js decode and provenance audits require `npm ci` first and run separately.
