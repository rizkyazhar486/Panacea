"""Rig tungkai bawah perempuan (Visible Human Female, Denver): pusat sendi dari geometri sumber, ikatan kaku, batas ROM AAOS.

  Blender -b bodyexposure/bodies/PANACEA_BODY_VHF_LOWER_LIMB_ADULT_FEMALE.blend -P bodyexposure/pipeline/build_rig_lower_limb.py -- \
      --out bodyexposure/bodies/PANACEA_RIG_VHF_LOWER_LIMB.blend --report bodyexposure/manifest/rig_vhf_lower_limb.json

Rig hanya mencakup panggul (tulang pinggul, sakrum, koksiks), paha, tungkai bawah, dan kaki: sumber tidak punya tulang belakang atau
lengan. Pusat sendi memakai definisi ISB (Wu dkk. 2002, J Biomech 35:543) dari geometri, tanpa landmark berlabel:
  panggul         : bola kuadrat-terkecil pada kartilago kaput femur (silang-uji: bola kartilago asetabulum)
  lutut           : titik tengah titik ekstrem medial–lateral femur distal (sumbu PCA; pendekatan epikondilus transversal)
  pergelangan kaki: titik tengah ujung maleolus medial (tibia distal) dan lateral (fibula distal): titik terendah lempeng 8 mm paling medial/lateral
Kartilago artikular mengikuti tulangnya. Ligamen lutut (melintasi sendi) dan otot TIDAK ikut dirig (butuh skinning lunak).
Batas ROM: nilai normal AAOS (Greene & Heckman 1994); tanda sumbu ditentukan numerik, bukan diasumsikan.
Pusat pergelangan kaki disempurnakan dengan fit kongruensi permukaan (--hinges, fit_hinge_centres.py --profile lower_limb); lutut dan panggul memakai pusat ISB apa adanya.
"""
import bpy, json, math, os, re, sys
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]
REPORT = argv[argv.index("--report") + 1]
B = "VHF_LOWER_LIMB.ADULT.FEMALE."
S = B + "SKELETAL."
J = B + "JOINT."
SIDES = ("L", "R")
sgn = {"L": 1.0, "R": -1.0}  # +X = kiri subjek; lateral kiri = +X
ob = bpy.data.objects


def verts(name):
    o = ob[name]; M = o.matrix_world
    return np.array([(M @ v.co)[:] for v in o.data.vertices])


def tree(name):
    o = ob[name]; M = o.matrix_world
    return BVHTree.FromPolygons([M @ v.co for v in o.data.vertices], [p.vertices[:] for p in o.data.polygons])


def surf_dist(name, p):
    return tree(name).find_nearest(Vector(p))[3]


def sphere_fit(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]; b = (pts ** 2).sum(1)
    c, *_ = np.linalg.lstsq(A, b, rcond=None); r = math.sqrt(c[3] + (c[:3] ** 2).sum())
    return c[:3], r, float(np.sqrt(np.mean((np.linalg.norm(pts - c[:3], axis=1) - r) ** 2)))


def unit(v):
    return v / np.linalg.norm(v)


jc, meta, AXIS = {}, {}, {}
for s in SIDES:
    c, r, rms = sphere_fit(verts(f"{J}FEMORAL_HEAD_ARTICULAR_CARTILAGE.{s}"))
    jc[f"HIP.{s}"] = c
    ca, ra, rmsa = sphere_fit(verts(f"{J}ACETABULAR_ARTICULAR_CARTILAGE.{s}"))
    meta[f"HIP.{s}"] = {"method": "least-squares sphere fit on femoral-head articular cartilage", "radius_mm": round(r * 1000, 1),
                        "rms_mm": round(rms * 1000, 2), "vertices": int(len(verts(f"{J}FEMORAL_HEAD_ARTICULAR_CARTILAGE.{s}"))),
                        "acetabular_sphere_centre_distance_mm": round(float(np.linalg.norm(ca - c)) * 1000, 1),
                        "acetabular_radius_mm": round(ra * 1000, 1)}
    # femur distal: sumbu medial–lateral = arah varians terbesar pada bidang ⟂ sumbu panjang femur
    F = verts(f"{S}FEMUR.{s}"); dist_pts = F[F[:, 2] < F[:, 2].min() + 0.060]
    u = unit(dist_pts.mean(0) - jc[f"HIP.{s}"])
    Q = dist_pts - dist_pts.mean(0); Q = Q - np.outer(Q @ u, u)
    a = np.linalg.eigh(np.cov(Q.T))[1][:, -1]
    if a[0] * sgn[s] < 0: a = -a  # menunjuk lateral
    proj = dist_pts @ a; pm, pl = dist_pts[proj.argmin()], dist_pts[proj.argmax()]
    jc[f"KNEE.{s}"] = (pm + pl) / 2
    AXIS[f"KNEE.{s}"] = unit(pl - pm)
    meta[f"KNEE.{s}"] = {"method": "midpoint of the medial and lateral extremes of the distal 60 mm of the femur along its principal mediolateral axis",
                         "width_mm": round(float(np.linalg.norm(pl - pm)) * 1000, 1)}
    T, Fb = verts(f"{S}TIBIA.{s}"), verts(f"{S}FIBULA.{s}")
    Td, Fd = T[T[:, 2] < T[:, 2].min() + 0.050], Fb[Fb[:, 2] < Fb[:, 2].min() + 0.050]
    m = Fd.mean(0) - Td.mean(0); m[2] = 0; m = unit(m)  # medial → lateral, horizontal
    # maleolus = titik terendah di lempeng 8 mm paling medial (tibia) / lateral (fibula): sisi medial tibia hampir vertikal,
    # sehingga titik "paling medial" saja tidak menentukan ketinggian
    tm, fl_ = Td @ m, Fd @ m
    slab_m, slab_l = Td[tm < tm.min() + 0.008], Fd[fl_ > fl_.max() - 0.008]
    mm, ml = slab_m[slab_m[:, 2].argmin()], slab_l[slab_l[:, 2].argmin()]
    jc[f"ANKLE.{s}"] = (mm + ml) / 2
    AXIS[f"ANKLE.{s}"] = unit(ml - mm)
    meta[f"ANKLE.{s}"] = {"method": "midpoint of the malleolar tips: lowest point of the most medial 8 mm of the distal tibia and of the most lateral 8 mm of the distal fibula",
                          "intermalleolar_mm": round(float(np.linalg.norm(ml - mm)) * 1000, 1)}
    fv = verts(f"{S}METATARSALS_AND_PHALANGES_COMBINED.{s}")
    jc[f"TOE_END.{s}"] = fv[fv[:, 1].argmin()]; meta[f"TOE_END.{s}"] = {"method": "most anterior vertex of the forefoot mesh"}
# opsional: pusat engsel pergelangan kaki yang disempurnakan (fit_hinge_centres.py --profile lower_limb; geser ⟂ sumbu, ±12 mm per arah)
HINGE_NOTE = None
if "--hinges" in argv:
    ref = json.load(open(argv[argv.index("--hinges") + 1]))["hinges"]
    for k, r in ref.items():
        jc[k] = np.array(r["refined_centre_m"])
        meta[k] = dict(meta[k], refined="surface-congruence hinge fit", shift_mm=r["shift_mm"],
                       max_penetration_mm=[r["max_penetration_mm_isb"], r["max_penetration_mm_refined"]])
    HINGE_NOTE = {k: {"shift_mm": r["shift_mm"], "max_penetration_mm_isb": r["max_penetration_mm_isb"],
                      "max_penetration_mm_refined": r["max_penetration_mm_refined"]} for k, r in ref.items()}
jc["PELVIS_CENTRE"] = (jc["HIP.L"] + jc["HIP.R"]) / 2; meta["PELVIS_CENTRE"] = {"method": "midpoint of hip joint centres"}
sac = verts(f"{S}SACRUM"); jc["SACRUM_TOP"] = sac[sac[:, 2].argmax()]; meta["SACRUM_TOP"] = {"method": "highest sacral vertex (pelvis bone tail)"}

# ── armature ──────────────────────────────────────────────────────────────────
arm_d = bpy.data.armatures.new("RIG.VHF_LOWER_LIMB"); arm = bpy.data.objects.new("RIG.VHF_LOWER_LIMB", arm_d)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones
ANT = Vector((0, -1, 0))


def bone(name, h, t, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(h.tolist()); b.tail = Vector(t.tolist()); b.align_roll(ANT)
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b


bone("PELVIS", jc["PELVIS_CENTRE"], jc["SACRUM_TOP"])
for s in SIDES:
    bone(f"THIGH.{s}", jc[f"HIP.{s}"], jc[f"KNEE.{s}"], "PELVIS")
    bone(f"SHIN.{s}", jc[f"KNEE.{s}"], jc[f"ANKLE.{s}"], f"THIGH.{s}", connect=True)
    bone(f"FOOT.{s}", jc[f"ANKLE.{s}"], jc[f"TOE_END.{s}"], f"SHIN.{s}", connect=True)
axis_dev = {}
for s in SIDES:
    for bn, key in {"SHIN": "KNEE", "FOOT": "ANKLE"}.items():
        b = eb[f"{bn}.{s}"]; y = (b.tail - b.head).normalized()
        x = Vector(AXIS[f"{key}.{s}"].tolist()); x = (x - y * x.dot(y)).normalized()
        old_x = b.x_axis.copy(); b.align_roll(x.cross(y))
        dev = math.degrees(old_x.angle(b.x_axis)); axis_dev[f"{bn}.{s}"] = round(min(dev, 180 - dev), 1)
bpy.ops.object.mode_set(mode='OBJECT')

# ── ikatan kaku ──────────────────────────────────────────────────────────────
RULES = [
    (r"SKELETAL\.(HIP_BONE_OS_COXAE|SACRUM|COCCYX)|ACETABULAR_ARTICULAR_CARTILAGE", "PELVIS"),
    (r"SKELETAL\.(FEMUR|PATELLA)\.|FEMORAL_HEAD_ARTICULAR|DISTAL_FEMORAL_ARTICULAR|PATELLAR_ARTICULAR", "THIGH"),
    (r"SKELETAL\.(TIBIA|FIBULA)\.|TIBIAL_PLATEAU_ARTICULAR|DISTAL_TIBIAL_ARTICULAR", "SHIN"),
    (r"SKELETAL\.(TALUS|CALCANEUS|CUBOID|NAVICULAR|MEDIAL_CUNEIFORM|INTERMEDIATE_CUNEIFORM|LATERAL_CUNEIFORM|METATARSALS)|TALAR_ARTICULAR", "FOOT"),
]
binding, unbound = {}, []
targets = [o for o in ob if o.type == 'MESH' and o.get("panacea_body_id") == "VHF_LOWER_LIMB.ADULT.FEMALE" and o.get("panacea_system") in ("skeletal", "joint")]
for o in targets:
    n = o.name; side = n[-1] if n[-2:] in (".L", ".R") else None
    base = next((b for pat, b in RULES if re.search(pat, n)), None)
    if base is None:
        unbound.append(n); continue  # ligamen lutut: melintasi sendi, tidak dirig
    bname = base if base == "PELVIS" else f"{base}.{side}"
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bname; o.matrix_world = mw
    binding.setdefault(bname, []).append(n)

# ── batas ROM (AAOS) dengan tanda sumbu ditentukan numerik ─────────────────────
ROM = {
    "THIGH": {"flexion": 120, "extension": 30, "abduction": 45, "adduction": 30, "internal_rotation": 45, "external_rotation": 45},
    "SHIN": {"flexion": 135, "extension": 0},
    "FOOT": {"flexion": 50, "extension": 20},  # fleksi plantar 50, dorsofleksi 20 (sendi talokrural)
}


def moved(pb, axis, ang, probe):
    M0 = pb.bone.matrix_local
    return np.array((M0 @ Matrix.Rotation(math.radians(ang), 4, axis) @ probe)[:])


limits_report = {}
for s in SIDES:
    for base, rom in ROM.items():
        pb = arm.pose.bones[f"{base}.{s}"]; L = pb.length
        tip = Vector((0, L, 0))
        lim = {"X": [0, 0], "Y": [0, 0], "Z": [0, 0]}
        pos = {}
        d = moved(pb, 'X', 10, tip) - np.array(pb.bone.tail_local[:])
        if base == "SHIN": flex_pos = d[1] > 0   # lutut: fleksi = tungkai bawah ke posterior (+Y)
        elif base == "FOOT": flex_pos = d[2] < 0  # fleksi plantar = ujung ke inferior
        else: flex_pos = d[1] < 0                 # panggul: fleksi = ujung ke anterior (−Y)
        fl, ex = rom.get("flexion", 0), rom.get("extension", 0)
        lim["X"] = [-ex, fl] if flex_pos else [-fl, ex]
        if "abduction" in rom:
            d = moved(pb, 'Z', 10, tip) - np.array(pb.bone.tail_local[:])
            ab_pos = d[0] * sgn[s] > 0
            ab, ad = rom["abduction"], rom.get("adduction", 0)
            lim["Z"] = [-ad, ab] if ab_pos else [-ab, ad]
            pos["positive_Z"] = "abduction" if ab_pos else "adduction"
        if "internal_rotation" in rom:
            probe = Vector((0, L / 2, 0.05))
            d = moved(pb, 'Y', 10, probe) - moved(pb, 'Y', 0, probe)
            ir_pos = d[0] * sgn[s] < 0
            ir, er = rom["internal_rotation"], rom["external_rotation"]
            lim["Y"] = [-er, ir] if ir_pos else [-ir, er]
            pos["positive_Y"] = "internal_rotation" if ir_pos else "external_rotation"
        c = pb.constraints.new('LIMIT_ROTATION'); c.owner_space = 'LOCAL'
        for ax in "XYZ":
            lo, hi = lim[ax]
            setattr(c, f"use_limit_{ax.lower()}", True)
            setattr(c, f"min_{ax.lower()}", math.radians(lo)); setattr(c, f"max_{ax.lower()}", math.radians(hi))
        pb.rotation_mode = 'XYZ'
        limits_report[pb.name] = {ax: lim[ax] for ax in "XYZ"} | {"positive_X": "flexion" if flex_pos else "extension"} | pos

# ── QA rig ────────────────────────────────────────────────────────────────────
def length(n): return arm_d.bones[n].length
sym = {b: round(abs(length(f"{b}.L") - length(f"{b}.R")) * 1000, 2) for b in ("THIGH", "SHIN", "FOOT")}
prox = {}
for key, pair in {"HIP": ("FEMUR", "HIP_BONE_OS_COXAE"), "KNEE": ("FEMUR", "TIBIA"), "ANKLE": ("TIBIA", "TALUS")}.items():
    for s in SIDES:
        prox[f"{key}.{s}"] = {bn: round(surf_dist(f"{S}{bn}.{s}", jc[f"{key}.{s}"]) * 1000, 1) for bn in pair}
seglen = {b.name: round(b.length * 1000, 1) for b in arm_d.bones}
qa = {"left_right_length_difference_mm": sym, "joint_centre_to_articulating_bone_surface_mm": prox,
      "bound_meshes": sum(len(v) for v in binding.values()), "meshes_considered": len(targets), "not_rigged": unbound,
      "not_rigged_reason": "knee ligaments span the joint and need soft skinning; 76 muscles are not rigged"}

keep = {arm.name} | {o.name for o in targets if o.parent == arm}
for o in list(ob):
    if o.name not in keep:
        ob.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if not c.all_objects:
        bpy.data.collections.remove(c)
bpy.ops.outliner.orphans_purge(do_recursive=True)
arm["panacea_rig_definition"] = "ISB-style joint centres from source geometry (no labelled landmarks); rigid bone binding; AAOS ROM limits"
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
json.dump({"body": "VHF_LOWER_LIMB.ADULT.FEMALE", "frame": "+Z superior, +X subject left, -Y anterior, metres",
           "joint_centres_m": {k: [round(float(x), 4) for x in v] for k, v in jc.items()}, "joint_centre_methods": meta,
           "segments_mm": seglen, "rom_limits_deg_local": limits_report, "rom_source": "AAOS normal values (Greene & Heckman 1994)",
           "flexion_axis": "knee and ankle flexion about the femoral mediolateral extreme line / intermalleolar line; hip perpendicular to the bone, anterior roll",
           "flexion_axis_change_deg": axis_dev, "hinge_refinement": HINGE_NOTE, "flexion_axes": {k: [round(float(x), 5) for x in v] for k, v in AXIS.items()},
           "binding": {k: len(v) for k, v in binding.items()}, "qa": qa}, open(REPORT, "w"), indent=1)
print("RIG", len(arm_d.bones), "bones;", qa["bound_meshes"], "/", qa["meshes_considered"], "bound; not rigged:", len(unbound))
print("SYM", sym); print("PROX", prox); print("META", {k: meta[k] for k in ("HIP.L", "KNEE.L", "ANKLE.L")})
