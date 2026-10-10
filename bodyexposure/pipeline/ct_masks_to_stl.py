"""Masker tulang TotalSegmentator pada CT Visible Human Female → STL di kerangka Denver (mm).

  python3 bodyexposure/pipeline/ct_masks_to_stl.py --seg <dir masker> --validation bodyexposure/qa_reports/ct_segmentation_vs_denver.json \
      --out ~/Documents/Panaceamed.id/bodyexposure/sources/du_vhf/ct_stl

Hanya tulang yang TIDAK dicakup Denver (tengkorak, vertebra C1–L5, iga 1–12, sternum, kartilago kosta, klavikula, skapula, humerus).
Femur, tulang pinggul, sakrum tetap dari Denver (segmentasi manual). Label "prostate" milik model TIDAK dipakai: model dilatih pada
CT hidup yang didominasi laki-laki dan memberi label itu pada subjek perempuan. Transformasi CT→Denver = ICP femur kiri (laporan validasi).
Menulis <nama>.stl dan provenance.json (versi alat, parameter, pembersihan, kualitas masker per tulang).
"""
import argparse, json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_segmentation_common import mask_mesh, write_stl

ap = argparse.ArgumentParser(); ap.add_argument("--seg", required=True); ap.add_argument("--validation", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
T = json.load(open(a.validation))["transform_ct_to_denver"]; R = np.array(T["R"]); t = np.array(T["t_mm"])
NAMES = (["skull", "sternum", "clavicula_left", "clavicula_right", "scapula_left", "scapula_right", "humerus_left", "humerus_right"]
         + [f"vertebrae_C{i}" for i in range(1, 8)] + [f"vertebrae_T{i}" for i in range(1, 13)] + [f"vertebrae_L{i}" for i in range(1, 6)]
         + [f"rib_{s}_{i}" for s in ("left", "right") for i in range(1, 13)])
os.makedirs(a.out, exist_ok=True)
prov = {"tool": "TotalSegmentator (task total, Apache-2.0)", "input": "Denver 'Aligned CT-DICOM' (NLM Visible Human Female CT), HU = stored value - 1024 (offset inferred from intensity peaks, not stated in the files), resampled to 1.5 mm isotropic",
        "cleaning": "largest connected component; Taubin smoothing 10 iterations (0.5, -0.53)", "transform_ct_to_denver": T, "bones": {}}
from importlib.metadata import version, PackageNotFoundError
for pkg in ("TotalSegmentator", "nnunetv2", "torch"):
    try: prov.setdefault("versions", {})[pkg] = version(pkg)
    except PackageNotFoundError: prov.setdefault("versions", {})[pkg] = "unknown"
for n in NAMES:
    V, F, info = mask_mesh(a.seg, n)
    if V is None:
        prov["bones"][n] = {"status": "empty mask"}; continue
    write_stl(os.path.join(a.out, n + ".stl"), V @ R.T + t, F)
    prov["bones"][n] = info | {"triangles": int(len(F))}
json.dump(prov, open(os.path.join(a.out, "provenance.json"), "w"), indent=1)
bad = {k: v for k, v in prov["bones"].items() if v.get("largest_component_fraction", 1) < 0.9 or v.get("components", 1) > 20}
print("WROTE", len(prov["bones"]), "meshes; masks with fragmented output:", {k: (v.get("components"), v.get("largest_component_fraction")) for k, v in bad.items()})
