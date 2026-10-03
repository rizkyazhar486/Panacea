"""Transformasi kemiripan (skala + rotasi + translasi) dari koordinat BodyParts3D (mm) ke frame kanonik laki-laki.

  Blender -b -P bodyexposure/pipeline/fit_bp3d_frame.py -- --out bodyexposure/manifest/bp3d_frame.json

Korespondensi: konsep BP3D yang namanya sama dengan struktur Z-Anatomy di tubuh dewasa laki-laki
(Z-Anatomy sendiri turunan BodyParts3D, jadi bentuknya identik sampai transformasi). Titik = pusat bbox
gabungan elemen (BP3D) vs pusat bbox struktur (manifest). Fit Umeyama dengan pemangkasan pencilan iteratif.
"""
import json, os, re, sys
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
SRC = f"{ROOT}/sources/bodyparts3d"
OUT = argv[argv.index("--out") + 1] if "--out" in argv else f"{ROOT}/manifest/bp3d_frame.json"
HERE = os.path.dirname(os.path.abspath(__file__))

names = {}
for line in open(f"{SRC}/partof_parts_list_e.txt").read().splitlines()[1:]:
    c, _, n = line.split("\t")[:3]; names[c] = n.strip().lower()
elems = {}
for line in open(f"{SRC}/partof_element_parts.txt").read().splitlines()[1:]:
    c, _, e = line.split("\t")[:3]; elems.setdefault(c, []).append(e.strip())


def bbox_obj(ids):
    lo = np.full(3, np.inf); hi = -lo
    for e in ids:
        p = f"{SRC}/partof_BP3D_4.0_obj_99/{e}.obj"
        if not os.path.exists(p):
            continue
        v = np.array([list(map(float, l.split()[1:4])) for l in open(p) if l.startswith("v ")])
        if len(v):
            lo = np.minimum(lo, v.min(0)); hi = np.maximum(hi, v.max(0))
    return (lo, hi) if np.isfinite(lo).all() else None


S = json.load(open(f"{HERE}/../manifest/structures.json"))["structures"]
male = {}
for r in S:
    if r["panacea_body_id"] != "HUMAN.ADULT.MALE":
        continue
    key = (r["canonical_name"].lower(), {"left": "L", "right": "R"}.get(r["panacea_laterality"], ""))
    male.setdefault(key, []).append(r)
pairs = []
for c, n in names.items():
    m = re.match(r"^(left|right) (.*)$", n)
    key = (m.group(2), m.group(1)[0].upper()) if m else (n, "")
    rs = male.get(key)
    if not rs or len(rs) != 1 or c not in elems:
        continue
    bb = bbox_obj(elems[c])
    if bb is None:
        continue
    r = rs[0]
    a = (bb[0] + bb[1]) / 2; b = (np.array(r["bbox_min_m"]) + np.array(r["bbox_max_m"])) / 2
    pairs.append((c, n, a, b, float(np.linalg.norm(np.array(r["bbox_max_m"]) - np.array(r["bbox_min_m"])))))
print("pairs", len(pairs))


def umeyama(A, B):
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, D, Vt = np.linalg.svd(B0.T @ A0 / len(A))
    Sg = np.eye(3); Sg[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = U @ Sg @ Vt; s = np.trace(np.diag(D) @ Sg) / A0.var(0).sum()
    return s, R, mb - s * R @ ma


keep = list(range(len(pairs)))
for it in range(6):
    A = np.array([pairs[i][2] for i in keep]); B = np.array([pairs[i][3] for i in keep])
    s, R, t = umeyama(A, B)
    res = np.array([np.linalg.norm(s * R @ p[2] + t - p[3]) for p in pairs])
    thr = max(0.002, 3 * np.median(res[keep]))
    keep = [i for i in range(len(pairs)) if res[i] <= thr]
res_keep = res[keep]
out = {"source": "BodyParts3D 4.0 partof (DBCLS)", "maps": "BP3D obj coordinates (mm) -> canonical male frame (m)",
       "scale": float(s), "rotation": R.tolist(), "translation_m": t.tolist(),
       "pairs_total": len(pairs), "pairs_inliers": len(keep),
       "residual_m": {"median": float(np.median(res_keep)), "p95": float(np.percentile(res_keep, 95)), "max": float(res_keep.max())},
       "worst_inliers": sorted(([pairs[i][1], round(float(res[i]), 4)] for i in keep), key=lambda x: -x[1])[:8]}
json.dump(out, open(OUT, "w"), indent=1)
print(json.dumps({k: out[k] for k in ("scale", "rotation", "pairs_total", "pairs_inliers", "residual_m")}, indent=1))

# koreksi lokal per target: rata-rata vektor residu tetangga (inlier dalam radius) di sekitar pusat target
TARGETS = {"FMA14544": "rectum", "FMA7208": "ileum", "FMA14541": "cecum", "FMA21930": "external anal sphincter"}
RADIUS = 0.12
local = {}
for c, n in TARGETS.items():
    bb = bbox_obj(elems[c]); p = s * R @ ((bb[0] + bb[1]) / 2) + t
    nb = [i for i in keep if np.linalg.norm(s * R @ pairs[i][2] + t - p) < RADIUS]
    vecs = np.array([pairs[i][3] - (s * R @ pairs[i][2] + t) for i in nb])
    off = vecs.mean(0) if len(vecs) else np.zeros(3)
    after = [float(np.linalg.norm(v - off)) for v in vecs]
    local[c] = {"name": n, "neighbours": [pairs[i][1] for i in nb], "offset_m": off.tolist(),
                "neighbour_residual_before_median_m": float(np.median([np.linalg.norm(v) for v in vecs])) if len(vecs) else None,
                "neighbour_residual_after_median_m": float(np.median(after)) if after else None,
                "elements": elems[c]}
    print(n, len(nb), np.round(off, 4), local[c]["neighbour_residual_before_median_m"], local[c]["neighbour_residual_after_median_m"])
out["local_offsets"] = local
json.dump(out, open(OUT, "w"), indent=1)
