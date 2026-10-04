"""Ekstraksi titik landmark dari garis penunjuk label Z-Anatomy (objek 2-verteks bersufiks .j).

  Blender -b sources/zanatomy/Z-Anatomy/Startup.blend -P pipeline/extract_zanatomy_landmarks.py

Garis penunjuk dievaluasi (modifier hook diterapkan). Ujung yang berada ≤ 1 mm dari permukaan sebuah
mesh adalah titik landmark; mesh itu adalah inangnya. Diverifikasi pada 7 landmark tulang
(tuberkulum adduktor, trokanter mayor/minor, akromion, tuberositas tibia, maleolus medial,
fossa interkondilar): ujung kedua berjarak 0,00–0,76 mm dari tulang, ujung pertama 21–52 mm (label).
Menulis /tmp/zanatomy_landmarks.json.
"""
import bpy, bmesh, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

dg = bpy.context.evaluated_depsgraph_get()
TOL = 0.001
meshes = []
for o in bpy.data.objects:
    if o.type != 'MESH' or o.name.endswith((".j", ".i", ".g")) or len(o.data.vertices) < 3:
        continue
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    meshes.append((o, Vector([min(b[i] for b in bb) for i in range(3)]), Vector([max(b[i] for b in bb) for i in range(3)])))
trees = {}


def tree(o):
    if o.name not in trees:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        bm = bmesh.new(); bm.from_mesh(me); bm.transform(o.matrix_world)
        trees[o.name] = BVHTree.FromBMesh(bm); bm.free(); ev.to_mesh_clear()
    return trees[o.name]


def host(p):
    best = None
    for o, lo, hi in meshes:
        if all(lo[i] - 0.003 <= p[i] <= hi[i] + 0.003 for i in range(3)):
            hit = tree(o).find_nearest(p)
            if hit[0] is not None and (best is None or hit[3] < best[1]):
                best = (o.name, hit[3])
    return best


out = []
for o in bpy.data.objects:
    if o.type != 'MESH' or not o.name.endswith(".j") or len(o.data.vertices) != 2:
        continue
    ev = o.evaluated_get(dg); me = ev.to_mesh()
    pts = [o.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear()
    cand = [(i, host(p)) for i, p in enumerate(pts)]
    cand = [(i, h) for i, h in cand if h and h[1] <= TOL]
    if not cand:
        continue
    i, (h, d) = min(cand, key=lambda c: c[1][1])
    out.append({"landmark": o.name[:-2], "point": [round(c, 5) for c in pts[i]], "label_end": [round(c, 5) for c in pts[1 - i]],
                "host": h, "distance_mm": round(d * 1000, 3),
                "group": [c.name for c in o.users_collection][0] if o.users_collection else ""})
json.dump(out, open("/tmp/zanatomy_landmarks.json", "w"), indent=0)
print("LANDMARKS", len(out))
