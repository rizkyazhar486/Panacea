# Metal / 8K output-path feasibility

The local Apple M4 GPU (10 cores), Blender 5.2.2 LTS and existing Cycles cinematic pipeline successfully produced three 7680 × 4320, 16-bit RGBA PNG captures. `qa/validate-cinematic-reports.mjs` verified the actual image hashes, PNG headers and capture settings. Compact evidence is retained in `bodyexposure/qa_reports/metal_8k_feasibility.json`; full images and original reports remain local.

| Source scene | Visible meshes | Source polygons | Capture render time |
|---|---:|---:|---:|
| Adult female master v011, female_layered | 841 | 4,467,873 | 455.236 seconds |
| VHF cleaned skeleton, body-qa c0 | 277 | 701,812 | 271.871 seconds |
| VHF cleaned skeleton, body-qa c1 | Same scene | Same scene | 211.762 seconds |

These were **one-sample output-path tests**, with a two-second sampling time limit, studio lighting and denoising. The limit does not bound scene synchronization, denoising or image encoding; observed total capture times are much longer. This proves that the selected Metal GPU path can finish these particular 8K captures. It does not validate the default 512-sample cinematic profile, production render quality, animation throughput, AAA quality, peak memory or anatomical/clinical correctness. Source BLEND content hashes were not recorded at capture and are explicitly unknown. Clinical review remains pending.

Reproduce with an explicit source and a new output directory:

```sh
blender -b /path/to/PANACEA_HUMAN_MASTER_v011.blend --python-exit-code 1 \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile cinematic --bench female_layered --device METAL \
  --samples 1 --time-limit 2 --lighting studio --out /tmp/female-metal-8k-new
node qa/validate-cinematic-reports.mjs /tmp/female-metal-8k-new
```

Before a quality render, run a preview to inspect source geometry and material limitations. Then run the full cinematic profile separately, record actual samples/time/memory and inspect the resulting images. Do not extrapolate one-sample timings linearly to 512 samples. Use a single heavy render at a time on the 16 GB shared-memory machine while Claude is working. Offline 8K images do not belong in the initial web asset payload; web LODs keep their existing independent budget gates.
