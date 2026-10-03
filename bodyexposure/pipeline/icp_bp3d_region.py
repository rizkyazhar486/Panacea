"""Registrasi permukaan (ICP kaku) BodyParts3D → master per region, untuk struktur yang tidak ada di Z-Anatomy.

Catatan: dijalankan terhadap master v009 (ID sebelum relabel v010; JEJUNUM kini JEJUNUM_AND_ILEUM). Hanya region
"pelvis" yang dipakai; "right_iliac_fossa" (rotasi 6,9°, geser 12 cm) dan "small_bowel" ditolak.

  Blender -b PANACEA_HUMAN_MASTER_v009.blend -P bodyexposure/pipeline/icp_bp3d_region.py -- --out bodyexposure/manifest/bp3d_icp.json

Tiap region: titik permukaan BP3D dari struktur rujukan (ada di kedua dataset) dipetakan dulu dengan fit global
(bp3d_frame.json), lalu ICP kaku ke mesh master yang sama. Matriks hasil dipakai untuk struktur target di region itu.
Laporan: jarak permukaan rujukan sebelum/sesudah (median, p95) — bukti kecocokan, bukan klaim.
"""
import bpy, json, os, sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import bmesh

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure")
SRC = f"{ROOT}/sources/bodyparts3d"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = argv[argv.index("--out") + 1]
G = json.load(open(f"{HERE}/../manifest/bp3d_frame.json"))
s, R, t = G["scale"], np.array(G["rotation"]), np.array(G["translation_m"])

elems = {}
for line in open(f"{SRC}/partof_element_parts.txt").read().splitlines()[1:]:
    c, n, e = line.split("\t")[:3]; elems.setdefault(n.strip().lower(), []).append(e.strip())

REGIONS = {  # region: (rujukan [nama BP3D, id master], target)
    "pelvis": ([("sacrum", "ADULT.MALE.SKELETAL.SACRUM"), ("coccyx", "ADULT.MALE.SKELETAL.COCCYX"),
                ("left hip bone", "ADULT.MALE.SKELETAL.HIP_BONE.L"), ("right hip bone", "ADULT.MALE.SKELETAL.HIP_BONE.R"),
                ("urinary bladder", "ADULT.MALE.URINARY.URINARY_BLADDER")],  # BP3D 4.0 tak punya mesh "sigmoid colon"
               ["rectum", "external anal sphincter"]),
    "right_iliac_fossa": ([("ascending colon", "ADULT.MALE.DIGESTIVE.ASCENDING_COLON"), ("appendix", "ADULT.MALE.DIGESTIVE.VERMIFORM_APPENDIX"),
                           ("right hip bone", "ADULT.MALE.SKELETAL.HIP_BONE.R"),
                           ("jejunum", "ADULT.MALE.DIGESTIVE.JEJUNUM"), ("transverse colon", "ADULT.MALE.DIGESTIVE.TRANSVERSE_COLON")],
                          ["ileum", "cecum"]),
    # jejunum identik antar-dataset (Z-Anatomy = BP3D) → rujukan langsung untuk ileum yang berbagi paket usus halus
    "small_bowel": ([("jejunum", "ADULT.MALE.DIGESTIVE.JEJUNUM")], ["ileum"]),  # ditolak: lihat bp3d_label_audit.json
}


def obj_verts(names):
    out = []
    for e in names:
        p = f"{SRC}/partof_BP3D_4.0_obj_99/{e}.obj"
        if os.path.exists(p):
            out += [list(map(float, l.split()[1:4])) for l in open(p) if l.startswith("v ")]
    return np.array(out)


def find_obj(sid):
    o = bpy.data.objects.get(sid)
    if o is None:  # nama bisa berakhiran sufiks duplikat; cari via properti
        o = next((x for x in bpy.data.objects if x.get("panacea_structure_id") == sid), None)
    return o


def tree(objs):
    bm = bmesh.new()
    for o in objs:
        b2 = bmesh.new(); b2.from_mesh(o.data); b2.transform(o.matrix_world)
        me = bpy.data.meshes.new("tmp"); b2.to_mesh(me); b2.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    tr = BVHTree.FromBMesh(bm); bm.free(); return tr


def dists(tr, P):
    return np.array([(tr.find_nearest(Vector(p))[3]) for p in P])


def rigid(A, B):
    ma, mb = A.mean(0), B.mean(0); U, _, Vt = np.linalg.svd((B - mb).T @ (A - ma))
    D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(U @ Vt)); Rr = U @ D @ Vt
    return Rr, mb - Rr @ ma


report = {}
for reg, (refs, targets) in REGIONS.items():
    missing = [sid for _, sid in refs if find_obj(sid) is None]
    refs = [(n, sid) for n, sid in refs if find_obj(sid) is not None and n in elems]
    tr = tree([find_obj(sid) for _, sid in refs])
    P = np.vstack([obj_verts(elems[n]) for n, _ in refs]); P = P[::max(1, len(P) // 6000)]
    Q = (s * (R @ P.T)).T + t
    d0 = dists(tr, Q)
    Racc, tacc = np.eye(3), np.zeros(3)
    for it in range(40):
        cur = (Racc @ Q.T).T + tacc
        near = np.array([tr.find_nearest(Vector(p))[0][:] for p in cur])
        dd = np.linalg.norm(near - cur, axis=1); m = dd < max(0.004, 3 * np.median(dd))
        Ri, ti = rigid(cur[m], near[m]); Racc, tacc = Ri @ Racc, Ri @ tacc + ti
    d1 = dists(tr, (Racc @ Q.T).T + tacc)
    ang = float(np.degrees(np.arccos(np.clip((np.trace(Racc) - 1) / 2, -1, 1))))
    report[reg] = {"references": [n for n, _ in refs], "missing_references": missing, "targets": targets,
                   "rotation": Racc.tolist(), "translation_m": tacc.tolist(), "rotation_deg": ang,
                   "surface_distance_before_m": {"median": float(np.median(d0)), "p95": float(np.percentile(d0, 95))},
                   "surface_distance_after_m": {"median": float(np.median(d1)), "p95": float(np.percentile(d1, 95))}}
    print(reg, "missing", missing, "before", np.round([np.median(d0), np.percentile(d0, 95)], 4),
          "after", np.round([np.median(d1), np.percentile(d1, 95)], 4), "rot", round(ang, 2), "t", np.round(tacc, 4))
json.dump(report, open(OUT, "w"), indent=1)
