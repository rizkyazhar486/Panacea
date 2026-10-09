"""Validasi TotalSegmentator (task total, Apache-2.0) pada CT Visible Human Female terhadap segmentasi manual Denver.

  python3 bodyexposure/pipeline/validate_ct_segmentation_vs_denver.py --seg <dir masker .nii.gz 1,5 mm> \
      --stl ~/Documents/Panaceamed.id/bodyexposure/sources/du_vhf/final_stl --out bodyexposure/qa_reports/ct_segmentation_vs_denver.json

Satu-satunya dasar kebenaran di sini adalah segmentasi manual Denver pada subjek yang sama: femur, tulang pinggul, sakrum.
Mesh masker (marching cubes, 1,5 mm) disejajarkan dengan ICP rigid; jarak permukaan dua arah dilaporkan. Skor ini TIDAK
mengesahkan tulang lain (iga, vertebra, skapula, humerus): akurasi di sana tidak diukur.
"""
import argparse, json, os, struct, sys
import numpy as np
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser(); ap.add_argument("--seg", required=True); ap.add_argument("--stl", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()


def read_stl(path):
    b = open(path, "rb").read()
    if b[:5] == b"solid" and b"facet" in b[:400]:
        v = np.array([[float(x) for x in l.split()[1:4]] for l in b.decode().splitlines() if l.strip().startswith("vertex")])
    else:
        n = struct.unpack("<I", b[80:84])[0]
        v = np.frombuffer(b, dtype=np.dtype([("n", "<3f4"), ("v", "<9f4"), ("a", "<u2")]), count=n, offset=84)["v"].reshape(-1, 3).astype(float)
    return np.unique(np.round(v, 3), axis=0)


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_segmentation_common import mask_mesh as _mm  # noqa: E402


def mask_mesh(name):
    V, F, info = _mm(a.seg, name)
    return V, info


def kabsch(A, B):
    ca, cb = A.mean(0), B.mean(0); U, S, Vt = np.linalg.svd((A - ca).T @ (B - cb)); d = np.sign(np.linalg.det(Vt.T @ U.T))
    R = Vt.T @ np.diag([1, 1, d]) @ U.T; return R, cb - R @ ca


def icp(src, dst, it=50):
    s = src[:: max(1, len(src) // 6000)]; tree = cKDTree(dst); R = np.eye(3); t = dst.mean(0) - s.mean(0)
    for _ in range(it):
        _, i = tree.query(s @ R.T + t); R, t = kabsch(s, dst[i])
    return R, t


def surf(A, B):  # jarak simetris (mm)
    d1 = cKDTree(B).query(A[:: max(1, len(A) // 20000)])[0]; d2 = cKDTree(A).query(B[:: max(1, len(B) // 20000)])[0]
    d = np.r_[d1, d2]; return {"median_mm": round(float(np.median(d)), 2), "p95_mm": round(float(np.percentile(d, 95)), 2), "max_mm": round(float(d.max()), 1)}


PAIRS = [("femur_left", "Left/VHF_Left_Bone_Femur_smooth.stl"), ("femur_right", "Right/VHF_Right_Bone_Femur_smooth.stl"),
         ("hip_left", "Left/VHF_Left_Bone_Pelvis_smooth.stl"), ("hip_right", "Right/VHF_Right_Bone_Pelvis_smooth.stl"),
         ("sacrum", "Left/VHF_Left_Bone_Sacrum_smooth.stl")]
res = {"method": "TotalSegmentator total task on the Visible Human Female CT (1.5 mm), vs Denver manual segmentation (same subject)", "bones": {}}
meshes = {n: (mask_mesh(n), read_stl(os.path.join(a.stl, f))) for n, f in PAIRS}
(Pf, _), Df = meshes["femur_left"]; R0, t0 = icp(Pf, Df)
res["transform_ct_to_denver"] = {"R": [[round(float(x), 6) for x in r] for r in R0], "t_mm": [round(float(x), 3) for x in t0]}
res["common_transform_fitted_on"] = "femur_left"; res["residual_rotation_deg"] = round(float(np.degrees(np.arccos(np.clip((np.trace(R0) - 1) / 2, -1, 1)))), 2)
res["residual_translation_mm"] = [round(float(x), 1) for x in t0]
for n, ((P, vol), D) in meshes.items():
    own_R, own_t = icp(P, D)
    res["bones"][n] = {"ct_volume_cm3": vol["volume_cm3"], "mask_components": vol["components"], "largest_component_fraction": vol["largest_component_fraction"], "common_transform": surf(P @ R0.T + t0, D), "own_fit": surf(P @ own_R.T + own_t, D)}
    print(n, res["bones"][n])
json.dump(res, open(a.out, "w"), indent=1)
