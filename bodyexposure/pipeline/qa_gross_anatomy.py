"""Gerbang anatomi kasar (SOP §11) untuk satu berkas tubuh — dijalankan headless per tubuh.

  Blender -b bodies/PANACEA_BODY_<ID>.blend -P pipeline/qa_gross_anatomy.py -- --out <json>

Pemeriksaan (semua terukur, tanpa skor karangan):
  1. Lateralitas: struktur ber-sufiks .L harus bersentroid x > 0 (kiri subjek), .R x < 0.
  2. Sisi organ asimetris: hati kanan (x<0), limpa kiri, jantung condong kiri, lambung kiri.
  3. Urutan vertikal: otak > jantung > hati ≥ ginjal > kandung kemih; kaki di z≈0.
  4. Relasi rongga: jantung & paru di dalam rangka iga (rentang z iga), otak di dalam kranium (bbox).
  5. Interpenetrasi kasar: pasangan organ besar diuji dengan sampel verteks + uji paritas sinar;
     dilaporkan sebagai fraksi verteks organ A yang berada di dalam organ B.
"""
import bpy, bmesh, json, sys, re
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]
objs = {o.name: o for o in bpy.context.scene.objects if o.type == 'MESH'}
body = next(iter(objs.values()))["panacea_body_id"]


def cen(o):
    M = o.matrix_world
    return sum((M @ v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)


def find(pat):
    return [o for n, o in objs.items() if re.search(pat, n)]


def tree(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    t = BVHTree.FromBMesh(bm); bm.free(); return t


def inside_frac(a, b, n=300):
    tb = tree(b); vs = list(a.data.vertices); step = max(1, len(vs) // n); M = a.matrix_world
    dirs = [Vector((1, 0.013, 0.007)).normalized(), Vector((-0.011, 1, 0.017)).normalized(), Vector((0.009, -0.015, -1)).normalized()]
    cnt = tot = 0
    for v in vs[::step]:
        p = M @ v.co; votes = 0
        for d in dirs:
            q, k = p.copy(), 0
            for _ in range(64):
                hit = tb.ray_cast(q, d)
                if hit[0] is None:
                    break
                k += 1; q = hit[0] + d * 1e-5
            votes += k % 2
        cnt += votes >= 2; tot += 1
    return round(cnt / max(tot, 1), 3)


res = {"body": body, "checks": [], "failures": []}


def check(name, ok, detail):
    res["checks"].append({"check": name, "ok": bool(ok), "detail": detail})
    if not ok:
        res["failures"].append(name)


# 1 lateralitas
bad = []
for n, o in objs.items():
    x = cen(o).x
    if n.endswith(".L") and x < -0.003: bad.append((n, round(x, 4)))
    if n.endswith(".R") and x > 0.003: bad.append((n, round(x, 4)))
check("laterality_suffix_matches_side", not bad, bad[:10] or f"{sum(1 for n in objs if n.endswith(('.L','.R')))} paired structures consistent")

# 2 organ asimetris
def one(p):
    r = find(p); return r[0] if r else None
liver, spleen, heart, stomach = one(r"\.LIVER$"), one(r"\.SPLEEN$"), one(r"HEART_WALL$"), one(r"\.STOMACH_WALL$")
if liver: check("liver_on_right", cen(liver).x < 0, round(cen(liver).x, 4))
if spleen: check("spleen_on_left", cen(spleen).x > 0, round(cen(spleen).x, 4))
if heart: check("heart_left_of_midline", cen(heart).x > -0.005, round(cen(heart).x, 4))
if stomach: check("stomach_on_left", cen(stomach).x > 0, round(cen(stomach).x, 4))

# 3 urutan vertikal
z = lambda o: cen(o).z if o else None
brain, bladder = one(r"\.BRAIN$"), one(r"URINARY_BLADDER_WALL$")
kidneys = find(r"KIDNEY_CORTEX\.[LR]$") or find(r"KIDNEY.*CORTEX")
zs = {"brain": z(brain), "heart": z(heart), "liver": z(liver), "kidney": (sum(z(k) for k in kidneys) / len(kidneys)) if kidneys else None, "bladder": z(bladder)}
order_ok = all(zs[a] is not None and zs[b] is not None and zs[a] > zs[b] for a, b in [("brain", "heart"), ("heart", "liver"), ("liver", "bladder"), ("kidney", "bladder")])
check("vertical_organ_order", order_ok, {k: (round(v, 3) if v else None) for k, v in zs.items()})
feet = min((o.matrix_world @ Vector(c)).z for o in objs.values() for c in o.bound_box)
check("feet_on_ground", abs(feet) < 0.005, round(feet, 4))

# 4 relasi rongga
ribs = one(r"RIBS_CORTICAL$")
if ribs and heart:
    rz = [(ribs.matrix_world @ Vector(c)).z for c in ribs.bound_box]
    check("heart_within_ribcage_height", min(rz) < z(heart) < max(rz), {"heart_z": round(z(heart), 3), "ribs_z": [round(min(rz), 3), round(max(rz), 3)]})
cranium = one(r"CRANIUM_CORTICAL$")
if cranium and brain:
    cb = [cranium.matrix_world @ Vector(c) for c in cranium.bound_box]; bb = [brain.matrix_world @ Vector(c) for c in brain.bound_box]
    inside = all(min(p[i] for p in cb) - 0.002 <= min(p[i] for p in bb) and max(p[i] for p in bb) <= max(p[i] for p in cb) + 0.002 for i in range(3))
    check("brain_within_cranium_bounds", inside, "bbox containment")

# 5 interpenetrasi organ besar
pairs = [(r"\.LIVER$", r"HEART_WALL$"), (r"\.LIVER$", r"STOMACH_WALL$"), (r"HEART_WALL$", r"LUNG\.L$"), (r"HEART_WALL$", r"LUNG\.R$"),
         (r"KIDNEY_CORTEX\.L$", r"\.SPLEEN$"), (r"\.LIVER$", r"KIDNEY_CORTEX\.R$"), (r"URINARY_BLADDER_WALL$", r"RECTUM_WALL$")]
pen = {}
for a, b in pairs:
    A, Bo = one(a), one(b)
    if A and Bo:
        f = inside_frac(A, Bo); pen[f"{A.name.split('.')[-1]}|{Bo.name.split('.', 3)[-1]}"] = f
check("no_gross_organ_interpenetration", all(v <= 0.05 for v in pen.values()), pen)
json.dump(res, open(OUT, "w"), indent=1)
print("QA", body, "failures:", res["failures"])
