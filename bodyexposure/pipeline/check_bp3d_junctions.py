"""Uji sambungan struktur BP3D yang diregistrasi: jarak celah ke tetangga anatomisnya dan penetrasi ke organ lain.

  Blender -b PANACEA_HUMAN_MASTER_v009.blend -P bodyexposure/pipeline/check_bp3d_junctions.py -- --region pelvis --out <json>
"""
import bpy, bmesh, json, os, sys
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:]
REG = argv[argv.index("--region") + 1]; OUT = argv[argv.index("--out") + 1]
ROOT = os.path.expanduser("~/Documents/Panaceamed.id/bodyexposure"); SRC = f"{ROOT}/sources/bodyparts3d"
HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(f"{HERE}/../manifest/bp3d_frame.json")); ICP = json.load(open(f"{HERE}/../manifest/bp3d_icp.json"))
s, R, t = G["scale"], np.array(G["rotation"]), np.array(G["translation_m"])
# --ileum-region: region ICP khusus ileum (default sama dengan --region)
IREG = argv[argv.index("--ileum-region") + 1] if "--ileum-region" in argv else REG
elems = {}
for line in open(f"{SRC}/partof_element_parts.txt").read().splitlines()[1:]:
    c, n, e = line.split("\t")[:3]; elems.setdefault(n.strip().lower(), []).append(e.strip())


def load(name):
    reg = IREG if name == "ileum" else REG
    Ri, ti = np.array(ICP[reg]["rotation"]), np.array(ICP[reg]["translation_m"])
    V, F = [], []
    for e in elems[name]:
        off = len(V)
        for l in open(f"{SRC}/partof_BP3D_4.0_obj_99/{e}.obj"):
            if l.startswith("v "): V.append(list(map(float, l.split()[1:4])))
            elif l.startswith("f "): F.append([off + int(x.split("/")[0]) - 1 for x in l.split()[1:]])
    V = (Ri @ ((s * (R @ np.array(V).T)).T + t).T).T + ti
    return V, F


def tree_np(V, F):
    return BVHTree.FromPolygons([Vector(v) for v in V], F)


def tree_obj(sid):
    o = bpy.data.objects[sid]; bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    tr = BVHTree.FromBMesh(bm); bm.free(); return tr


def gap(Va, tb):
    d = np.array([tb.find_nearest(Vector(v))[3] for v in Va[::max(1, len(Va) // 4000)]]); return float(d.min())


def inside(Va, tb, n=400):
    dirs = [Vector((1, 0.013, 0.007)).normalized(), Vector((-0.011, 1, 0.017)).normalized(), Vector((0.009, -0.015, -1)).normalized()]
    cnt = 0; P = Va[::max(1, len(Va) // n)]
    for v in P:
        votes = 0
        for d in dirs:
            q, k = Vector(v), 0
            for _ in range(64):
                h = tb.ray_cast(q, d)
                if h[0] is None: break
                k += 1; q = h[0] + d * 1e-5
            votes += k % 2
        cnt += votes >= 2
    return round(cnt / len(P), 3)


mesh = {n: load(n) for n in ["rectum", "external anal sphincter", "ileum", "cecum", "jejunum"]}
M = lambda sid: tree_obj(sid)
JUNCTIONS = [("rectum", "ADULT.MALE.DIGESTIVE.SIGMOID_COLON", "rectosigmoid junction"),
             ("cecum", "ADULT.MALE.DIGESTIVE.ASCENDING_COLON", "caecum to ascending colon"),
             ("cecum", "ADULT.MALE.DIGESTIVE.VERMIFORM_APPENDIX", "appendix base on caecum"),
             ("external anal sphincter", None, "sphincter around rectum/anal canal")]
PEN = [("rectum", "ADULT.MALE.URINARY.URINARY_BLADDER"), ("rectum", "ADULT.MALE.SKELETAL.SACRUM"), ("rectum", "ADULT.MALE.SKELETAL.COCCYX"),
       ("ileum", "ADULT.MALE.URINARY.URINARY_BLADDER"), ("ileum", "ADULT.MALE.SKELETAL.HIP_BONE.R"), ("ileum", "ADULT.MALE.DIGESTIVE.SIGMOID_COLON"),
       ("cecum", "ADULT.MALE.SKELETAL.HIP_BONE.R"), ("cecum", "ADULT.MALE.DIGESTIVE.ASCENDING_COLON"),
       ("rectum", "ADULT.MALE.DIGESTIVE.SIGMOID_COLON"), ("external anal sphincter", "ADULT.MALE.DIGESTIVE.SIGMOID_COLON"), ("ileum", "ADULT.MALE.DIGESTIVE.ASCENDING_COLON"), ("ileum", "ADULT.MALE.DIGESTIVE.JEJUNUM"), ("cecum", "ADULT.MALE.DIGESTIVE.JEJUNUM")]
res = {"region": REG, "ileum_region": IREG, "junction_gap_m": {}, "inside_fraction": {}}
for a, b, lab in JUNCTIONS:
    tb = tree_np(*mesh["rectum"]) if b is None else M(b)
    res["junction_gap_m"][lab] = round(gap(mesh[a][0], tb), 4)
res["junction_gap_m"]["terminal ileum to caecum"] = round(gap(mesh["ileum"][0], tree_np(*mesh["cecum"])), 4)
for a, b in PEN:
    res["inside_fraction"][f"{a} in {b.split('.')[-1] if not b.endswith(('.L','.R')) else '.'.join(b.split('.')[-2:])}"] = inside(mesh[a][0], M(b))
# pembanding: tumpang tindih yang sama di dalam sumber BP3D sendiri (jejunum BP3D, transformasi identik)
res["inside_fraction_within_source"] = {"ileum in BP3D jejunum": inside(mesh["ileum"][0], tree_np(*mesh["jejunum"])),
                                        "external anal sphincter in BP3D rectum": inside(mesh["external anal sphincter"][0], tree_np(*mesh["rectum"]))}
json.dump(res, open(OUT, "w"), indent=1); print(json.dumps(res, indent=1))
