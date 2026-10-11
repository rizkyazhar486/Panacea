"""Masker TotalSegmentator dataset (v2.0.1, CC BY 4.0) satu subjek → STL per struktur (RAS mm) + provenance.json.

  python3 bodyexposure/pipeline/tsd_masks_to_stl.py --subject <dir sXXXX> --meta <meta.csv> --out <dir STL>

Masker adalah segmentasi acuan dataset (dibuat dengan nnU-Net iteratif lalu dikoreksi manual oleh dokter radiologi; Wasserthal dkk., Radiology: AI 2023), BUKAN keluaran model yang
dijalankan di sini. CT dalam dataset sudah diresampel 1,5 mm dan dipotong pada daerah yang disegmentasi, sehingga cakupan tubuh sebagian. Koordinat: afin NIfTI (RAS mm).
Pembersihan seperti ct_masks_to_stl.py (komponen ≥ 1 cm³ dipertahankan, selebihnya dibuang; Taubin 10 iterasi) dan dilaporkan per struktur.
"""
import argparse, csv, glob, json, os, sys
import numpy as np, nibabel as nib
from scipy.ndimage import label
from skimage.measure import marching_cubes

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_segmentation_common import _taubin, write_stl
from tsd_classes import classify

MIN_KEEP_CM3 = 1.0
ap = argparse.ArgumentParser(); ap.add_argument("--subject", required=True); ap.add_argument("--meta", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
sid = os.path.basename(os.path.normpath(a.subject))
rows = list(csv.DictReader(open(a.meta, encoding="utf-8-sig"), delimiter=";"))
meta = next(r for r in rows if r["image_id"] == sid)
ct = nib.load(os.path.join(a.subject, "ct.nii.gz"))
assert nib.aff2axcodes(ct.affine) == ("R", "A", "S"), nib.aff2axcodes(ct.affine)
os.makedirs(a.out, exist_ok=True)
prov = {"tool": "TotalSegmentator dataset v2.0.1 reference segmentations (Wasserthal et al., Radiology: Artificial Intelligence 2023; Zenodo 10047292, CC BY 4.0), subject mesh export",
        "subject": sid, "meta": meta, "ct_shape": list(ct.shape), "voxel_mm": [round(float(z), 3) for z in ct.header.get_zooms()], "ct_extent_mm": [round(float(s * z)) for s, z in zip(ct.shape, ct.header.get_zooms())],
        "cleaning": f"components >= {MIN_KEEP_CM3} cm3 kept (largest always); Taubin smoothing 10 iterations (0.5, -0.53)", "structures": {}, "not_published": {}, "empty": []}
for f in sorted(glob.glob(os.path.join(a.subject, "segmentations", "*.nii.gz"))):
    key = os.path.basename(f)[:-7]
    c = classify(key)
    if c is None:
        prov["not_published"][key] = "see tsd_classes.NOT_PUBLISHED"; continue
    img = nib.load(f); assert img.shape == ct.shape and np.allclose(img.affine, ct.affine), key
    m = np.asarray(img.dataobj) > 0
    if not m.any(): prov["empty"].append(key); continue
    vox = float(np.prod(ct.header.get_zooms())) / 1000.0
    lab, k = label(m); sizes = np.bincount(lab.ravel())[1:]
    keep = [j + 1 for j, n in enumerate(sizes) if n * vox >= MIN_KEEP_CM3 or j == int(sizes.argmax())]
    m = np.isin(lab, keep)
    P = np.pad(m, 1)
    V, F, _, _ = marching_cubes(P.astype(np.uint8), 0.5)
    V = _taubin(V - 1, F)                                   # indeks voksel (tanpa padding)
    W = (ct.affine @ np.c_[V, np.ones(len(V))].T).T[:, :3]  # RAS mm
    write_stl(os.path.join(a.out, key + ".stl"), W, F)
    prov["structures"][key] = {"voxels": int(m.sum()), "volume_cm3": round(float(m.sum()) * vox, 1), "components": int(k), "fragments_kept": len(keep),
                               "largest_component_fraction": round(float(sizes.max() / sizes.sum()), 4), "triangles": int(len(F)),
                               "touches_ct_border": bool(np.any(m[0]) or np.any(m[-1]) or np.any(m[:, 0]) or np.any(m[:, -1]) or np.any(m[:, :, 0]) or np.any(m[:, :, -1]))}
json.dump(prov, open(os.path.join(a.out, "provenance.json"), "w"), indent=1)
cut = [k for k, v in prov["structures"].items() if v["touches_ct_border"]]
print("WROTE", len(prov["structures"]), "meshes;", len(prov["empty"]), "empty;", len(prov["not_published"]), "not published; cut by the CT border:", len(cut))
