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
BODY = argv[argv.index("--body") + 1] if "--body" in argv else None
NO_ORGANS = "--no-organs" in argv  # tubuh kerangka: pemeriksaan organ dicatat tidak berlaku (bukan dilewati diam-diam)
objs = {o.name: o for o in bpy.context.scene.objects if o.type == 'MESH' and "panacea_body_id" in o
        and (BODY is None or o["panacea_body_id"] == BODY)}
body = BODY or next(iter(objs.values()))["panacea_body_id"]


def offset(o):
    """Offset tampilan tubuh (empty ROOT) — koordinat kanonik = dunia − offset."""
    p = o.parent
    return p.matrix_world.translation.copy() if p is not None and "panacea_display_offset_m" in p else Vector()


def cen(o):
    M = o.matrix_world
    return sum((M @ v.co for v in o.data.vertices), Vector()) / len(o.data.vertices) - offset(o)


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
# konflik yang sudah ditinjau & dicatat (panacea_qa_note) dilaporkan terpisah; gagal hanya bila tak terjelaskan
unexplained = [b for b in bad if not objs[b[0]].get("panacea_qa_note")]
check("laterality_suffix_matches_side", not unexplained,
      {"paired": sum(1 for n in objs if n.endswith(('.L', '.R'))), "documented_exceptions": len(bad) - len(unexplained),
       "unexplained": unexplained[:10]})

# 2 organ asimetris
def one(*pats):
    for p in pats:
        r = find(p)
        if r:
            return max(r, key=lambda o: len(o.data.vertices))
    return None
liver = one(r"\.LIVER$", r"DIGESTIVE\.CAPSULE_OF_THE_LIVER$")
spleen = one(r"\.SPLEEN$")
heart = one(r"HEART_WALL$", r"CARDIOVASCULAR\.LEFT_VENTRICLE$")
stomach = one(r"\.STOMACH_WALL$", r"DIGESTIVE\.STOMACH$")
if liver: check("liver_on_right", cen(liver).x < 0, round(cen(liver).x, 4))
if spleen: check("spleen_on_left", cen(spleen).x > 0, round(cen(spleen).x, 4))
if heart: check("heart_left_of_midline", cen(heart).x > -0.005, round(cen(heart).x, 4))
if stomach: check("stomach_on_left", cen(stomach).x > 0, round(cen(stomach).x, 4))

# 3 urutan vertikal
z = lambda o: cen(o).z if o else None
brain = one(r"\.BRAIN$", r"WHITE_MATTER_OF_TELENCEPHALON$", r"NERVOUS\.CORPUS_CALLOSUM\.[LR]$")
bladder = one(r"URINARY_BLADDER_WALL$", r"URINARY\.URINARY_BLADDER$", r"FUNDUS_OF_URINARY_BLADDER_DOME$")
kidneys = find(r"KIDNEY_CORTEX\.[LR]$") or find(r"URINARY\.KIDNEY\.[LR]$") or find(r"KIDNEY_CAPSULE\.[LR]$")
zs = {"brain": z(brain), "heart": z(heart), "liver": z(liver), "kidney": (sum(z(k) for k in kidneys) / len(kidneys)) if kidneys else None, "bladder": z(bladder)}
order_ok = all(zs[a] is not None and zs[b] is not None and zs[a] > zs[b] for a, b in [("brain", "heart"), ("heart", "liver"), ("liver", "bladder"), ("kidney", "bladder")])
if NO_ORGANS:
    res["checks"].append({"check": "vertical_organ_order", "ok": True, "not_applicable": "body has no organs (--no-organs)"})
else:
    check("vertical_organ_order", order_ok, {k: (round(v, 3) if v else None) for k, v in zs.items()})
feet = min((o.matrix_world @ Vector(c)).z for o in objs.values() for c in o.bound_box)
check("feet_on_ground", abs(feet) < 0.005, round(feet, 4))

# 4 relasi rongga
ribs = find(r"RIBS_CORTICAL$") or find(r"SKELETAL\.\w+_RIB\.[LR]$")
if ribs and heart:
    rz = [(r.matrix_world @ Vector(c)).z for r in ribs for c in r.bound_box]
    check("heart_within_ribcage_height", min(rz) < z(heart) < max(rz), {"heart_z": round(z(heart), 3), "ribs_z": [round(min(rz), 3), round(max(rz), 3)]})
cranium = find(r"CRANIUM_CORTICAL$") or find(r"SKELETAL\.(FRONTAL_BONE|OCCIPITAL_BONE|PARIETAL_BONE\.[LR]|SPHENOID_BONE|TEMPORAL_BONE\.[LR])$")
if cranium and brain:
    cb = [cr.matrix_world @ Vector(c) for cr in cranium for c in cr.bound_box]; bb = [brain.matrix_world @ Vector(c) for c in brain.bound_box]
    inside = all(min(p[i] for p in cb) - 0.002 <= min(p[i] for p in bb) and max(p[i] for p in bb) <= max(p[i] for p in cb) + 0.002 for i in range(3))
    check("brain_within_cranium_bounds", inside, "bbox containment")

# 5 interpenetrasi organ besar
LIV = (r"\.LIVER$", r"DIGESTIVE\.CAPSULE_OF_THE_LIVER$"); HRT = (r"HEART_WALL$", r"CARDIOVASCULAR\.LEFT_VENTRICLE$")
LL = (r"LUNG\.L$", r"INFERIOR_LOBE_OF_LEFT_LUNG$"); LR = (r"LUNG\.R$", r"INFERIOR_LOBE_OF_RIGHT_LUNG$")
KL = (r"KIDNEY_CORTEX\.L$", r"URINARY\.KIDNEY\.L$", r"OUTER_CORTEX_OF_KIDNEY\.L$"); KR = (r"KIDNEY_CORTEX\.R$", r"URINARY\.KIDNEY\.R$", r"OUTER_CORTEX_OF_KIDNEY\.R$")
STO = (r"\.STOMACH_WALL$", r"DIGESTIVE\.STOMACH$"); BLD = (r"URINARY_BLADDER_WALL$", r"URINARY\.URINARY_BLADDER$"); REC = (r"RECTUM_WALL$", r"DIGESTIVE\.RECTUM$", r"SIGMOID_COLON$")
pairs = [(LIV, HRT), (LIV, STO), (HRT, LL), (HRT, LR), (KL, (r"\.SPLEEN$",)), (LIV, KR), (BLD, REC)]
pen = {}
for a, b in pairs:
    A, Bo = one(*a), one(*b)
    if A and Bo:
        f = inside_frac(A, Bo); pen[f"{A.name.split('.', 2)[-1]}|{Bo.name.split('.', 2)[-1]}"] = f
check("no_gross_organ_interpenetration", all(v <= 0.05 for v in pen.values()), pen)
# kerangka (bila ada vertebra): urutan kolom, tengkorak, 12 iga per sisi, sternum anterior, sakrum di bawah L5
if find(r"SKELETAL\.VERTEBRA_C1$"):
    names = [f"C{i}" for i in range(1, 8)] + [f"T{i}" for i in range(1, 13)] + [f"L{i}" for i in range(1, 6)]
    vz = [z(find(rf"SKELETAL\.VERTEBRA_{n}$")[0]) for n in names]
    check("vertebral_column_ordered_top_to_bottom", all(a > b for a, b in zip(vz, vz[1:])), {"c1_z": round(vz[0], 3), "l5_z": round(vz[-1], 3)})
    sk = find(r"SKELETAL\.SKULL"); sac = find(r"SKELETAL\.SACRUM$"); st = find(r"SKELETAL\.STERNUM$"); t6 = find(r"SKELETAL\.VERTEBRA_T6$")
    if sk: check("skull_above_c1", z(sk[0]) > vz[0], {"skull_z": round(z(sk[0]), 3), "c1_z": round(vz[0], 3)})
    if sac: check("sacrum_below_l5", z(sac[0]) < vz[-1], {"sacrum_z": round(z(sac[0]), 3), "l5_z": round(vz[-1], 3)})
    missing = [f"RIB_{i}.{sd}" for i in range(1, 13) for sd in "LR" if not find(rf"SKELETAL\.RIB_{i}\.{sd}$")]
    check("twelve_ribs_each_side", not missing, {"missing": missing})
    if st and t6: check("sternum_anterior_to_spine", cen(st[0]).y < cen(t6[0]).y - 0.08, {"sternum_y": round(cen(st[0]).y, 3), "t6_y": round(cen(t6[0]).y, 3)})
# janin atlas (organ saja): relasi antar-organ terukur; heart/brain tidak ada sehingga urutan vertikal umum tidak berlaku
if body == "FETUS":
    lungs, thymus = find(r"RESPIRATORY\.LUNG\.[LR]$"), one(r"\.THYMUS$")
    kid = find(r"URINARY\.RENAL_PARENCHYMA\.[LR]$"); bl = one(r"URINARY\.BLADDER$")
    if lungs and liver: check("lungs_above_liver", all(cen(l).z > cen(liver).z for l in lungs), {"lungs_z": [round(cen(l).z, 3) for l in lungs], "liver_z": round(cen(liver).z, 3)})
    if thymus and liver: check("thymus_above_liver", cen(thymus).z > cen(liver).z, round(cen(thymus).z, 3))
    if kid and liver: check("kidneys_posterior_to_liver", all(cen(k).y > cen(liver).y for k in kid), {"kidneys_y": [round(cen(k).y, 3) for k in kid], "liver_y": round(cen(liver).y, 3)})
    if kid and stomach: check("stomach_anterior_to_kidneys", all(cen(stomach).y < cen(k).y for k in kid), round(cen(stomach).y, 3))
    if kid and bl: check("bladder_below_kidneys", all(cen(bl).z < cen(k).z for k in kid), round(cen(bl).z, 3))
    if len(lungs) == 2: check("both_lungs_present_and_paired", {o.name[-1] for o in lungs} == {"L", "R"}, [o.name[-1] for o in lungs])
json.dump(res, open(OUT, "w"), indent=1)
print("QA", body, "failures:", res["failures"])
