"""Rig rangka laki-laki dewasa (P5): pusat sendi dari geometri sumber, ikatan kaku, batas ROM AAOS.

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v011.blend -P bodyexposure/pipeline/build_rig.py -- \
      --out bodyexposure/bodies/PANACEA_RIG_ADULT_MALE.blend --report bodyexposure/manifest/rig_adult_male.json

Pusat sendi (definisi ISB, Wu dkk. 2002 J Biomech 35:543; 2005 J Biomech 38:981):
  panggul & bahu  : pusat bola hasil fit kuadrat-terkecil pada verteks kepala femur / humerus
  lutut, siku     : titik tengah epikondilus medial & lateral
  pergelangan kaki: titik tengah maleolus medial & lateral
  pergelangan tgn : titik tengah ujung prosesus stiloideus radius & ulna (verteks paling distal)
  tulang belakang : sentroid diskus intervertebralis; atlanto-oksipital: kondilus oksipital (bidang tengah)
  sternoklavikular: sentroid diskus artikular sendi sternoklavikular
Landmark Z-Anatomy hanya dilabeli di sisi kanan; sisi kiri BodyParts3D adalah cermin sisi kanan, jadi titik
dicerminkan lalu dikunci ke permukaan tulang kirinya sendiri (jarak kunci dilaporkan).
Batas ROM: nilai normal AAOS (Greene & Heckman 1994, The Clinical Measurement of Joint Motion). Arah tanda tiap
sumbu (fleksi/abduksi/rotasi internal) ditentukan secara numerik pada rig, bukan diasumsikan.
Rig disimpan di berkas terpisah; master dan pipeline ekspor web tidak diubah.
"""
import bpy, json, math, os, re, sys
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]
REPORT = argv[argv.index("--report") + 1]
HERE = os.path.dirname(os.path.abspath(__file__))
P = "ADULT.MALE.SKELETAL."
J = "ADULT.MALE.JOINT."
SIDES = ("L", "R")
sgn = {"L": 1.0, "R": -1.0}  # +X = kiri subjek

ob = bpy.data.objects
anch = {}
for a in json.load(open(f"{HERE}/../manifest/anchors.json"))["anchors"]:
    anch.setdefault((a["landmark"], a["anchor_of"]), a["position_m"])


def verts(name):
    o = ob[name]; M = o.matrix_world
    return np.array([(M @ v.co)[:] for v in o.data.vertices])


def tree(name):
    o = ob[name]; M = o.matrix_world
    return BVHTree.FromPolygons([M @ v.co for v in o.data.vertices], [p.vertices[:] for p in o.data.polygons])


def snap(name, p):
    loc, _, _, d = tree(name).find_nearest(Vector(p)); return np.array(loc[:]), d


def landmark(label, struct, side):
    """Landmark sisi kanan dari Z-Anatomy; sisi kiri = cermin x lalu dikunci ke permukaan tulang kiri."""
    p = np.array(anch[(label, struct + ".R")])
    if side == "R":
        return p, 0.0
    q, d = snap(struct + ".L", p * [-1, 1, 1]); return q, d


def sphere_fit(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]; b = (pts ** 2).sum(1)
    c, *_ = np.linalg.lstsq(A, b, rcond=None); r = math.sqrt(c[3] + (c[:3] ** 2).sum())
    return c[:3], r, float(np.sqrt(np.mean((np.linalg.norm(pts - c[:3], axis=1) - r) ** 2)))


def head_centre(bone, seed_label, side):
    """Fit bola pada verteks kepala tulang di sekitar landmark 'Head of …' (radius 30 mm)."""
    seed, _ = landmark(seed_label, P + bone, side)
    V = verts(f"{P}{bone}.{side}")
    c = seed
    for _ in range(4):  # perhalus: pilih verteks dekat pusat sementara
        sel = V[np.linalg.norm(V - c, axis=1) < (0.030 if _ == 0 else r * 1.15)]
        c, r, rms = sphere_fit(sel)
    return c, {"method": "least-squares sphere fit on femoral/humeral head vertices", "radius_mm": round(r * 1000, 1),
               "rms_mm": round(rms * 1000, 2), "vertices": int(len(sel))}


def centroid(name):
    return verts(name).mean(0)


def extreme(name, axis, mode):
    V = verts(name); i = V[:, axis].argmin() if mode == "min" else V[:, axis].argmax(); return V[i]


jc, meta = {}, {}
AXIS = {}  # sumbu fleksi anatomis ISB: medial → lateral (garis epikondilus / maleolus)
for s in SIDES:
    jc[f"HIP.{s}"], meta[f"HIP.{s}"] = head_centre("FEMUR", "Head of femur", s)
    jc[f"SHOULDER.{s}"], meta[f"SHOULDER.{s}"] = head_centre("HUMERUS", "Head of humerus", s)
    for key, bone, a, b, defn in [("KNEE", "FEMUR", "Medial epicondyle of femur", "Lateral epicondyle of femur", "midpoint of femoral epicondyles"),
                                  ("ELBOW", "HUMERUS", "Medial epicondyle of humerus", "Lateral epicondyle of humerus", "midpoint of humeral epicondyles")]:
        (pa, da), (pb, db) = landmark(a, P + bone, s), landmark(b, P + bone, s)
        jc[f"{key}.{s}"] = (pa + pb) / 2; meta[f"{key}.{s}"] = {"method": defn, "mirror_snap_mm": round(max(da, db) * 1000, 2)}
        AXIS[f"{key}.{s}"] = (pb - pa) / np.linalg.norm(pb - pa)
    (pm, dm), (pl, dl) = landmark("Medial malleolus", P + "TIBIA", s), landmark("Lateral malleolus", P + "FIBULA", s)
    jc[f"ANKLE.{s}"] = (pm + pl) / 2; meta[f"ANKLE.{s}"] = {"method": "midpoint of medial and lateral malleoli", "mirror_snap_mm": round(max(dm, dl) * 1000, 2)}
    AXIS[f"ANKLE.{s}"] = (pl - pm) / np.linalg.norm(pl - pm)
    rs, us = extreme(f"{P}RADIUS.{s}", 2, "min"), extreme(f"{P}ULNA.{s}", 2, "min")
    jc[f"WRIST.{s}"] = (rs + us) / 2; meta[f"WRIST.{s}"] = {"method": "midpoint of radial and ulnar styloid tips (most distal vertices)"}
    # sumbu pronasi–supinasi: pusat kaput radius (proksimal) → pusat kaput ulna (distal); radius berputar mengelilingi
    # ulna, ulna tetap pada sendi humeroulnar. Lengan tergantung (posisi anatomis): proksimal = z maksimum.
    Vr, Vu = verts(f"{P}RADIUS.{s}"), verts(f"{P}ULNA.{s}")
    jc[f"RADIAL_HEAD.{s}"] = Vr[Vr[:, 2] > Vr[:, 2].max() - 0.012].mean(0)
    jc[f"ULNAR_HEAD.{s}"] = Vu[Vu[:, 2] < Vu[:, 2].min() + 0.015].mean(0)
    meta[f"RADIAL_HEAD.{s}"] = {"method": "centroid of the proximal 12 mm of the radius (radial head)"}
    meta[f"ULNAR_HEAD.{s}"] = {"method": "centroid of the distal 15 mm of the ulna (ulnar head)"}
    jc[f"HAND_END.{s}"] = extreme(f"{P}THIRD_METACARPAL_BONE.{s}", 2, "min"); meta[f"HAND_END.{s}"] = {"method": "distal end of third metacarpal"}
    jc[f"TOE_END.{s}"] = extreme(f"{P}SECOND_METATARSAL_BONE.{s}", 1, "min"); meta[f"TOE_END.{s}"] = {"method": "distal (anterior) end of second metatarsal"}
    jc[f"STERNOCLAVICULAR.{s}"] = centroid(f"{J}ARTICULAR_DISC_OF_STERNOCLAVICULAR_JOINT.{s}"); meta[f"STERNOCLAVICULAR.{s}"] = {"method": "centroid of sternoclavicular articular disc"}

LEVELS = ["L5_S1", "L4_L5", "L3_L4", "L2_L3", "L1_L2", "T12_L1"] + [f"T{i}_T{i+1}" for i in range(11, 0, -1)] + ["C7_T1"] + [f"C{i}_C{i+1}" for i in range(6, 1, -1)]
for lv in LEVELS:
    jc[f"DISC.{lv}"] = centroid(f"{J}INTERVERTEBRAL_DISC_{lv}"); meta[f"DISC.{lv}"] = {"method": "intervertebral disc centroid"}
oc = np.array(anch[("Occipital condyle", P + "OCCIPITAL_BONE")])
jc["ATLANTO_OCCIPITAL"] = np.array([0.0, oc[1], oc[2]]); meta["ATLANTO_OCCIPITAL"] = {"method": "occipital condyle landmark projected to the midsagittal plane"}
skull = [n for n in ob.keys() if re.match(P + r"(FRONTAL_BONE|PARIETAL_BONE\.[LR]|OCCIPITAL_BONE)$", n)]
top = max((extreme(n, 2, "max") for n in skull), key=lambda v: v[2])
jc["VERTEX"] = np.array([0.0, top[1], top[2]]); meta["VERTEX"] = {"method": "highest point of the calvaria, midsagittal"}
jc["PELVIS_CENTRE"] = (jc["HIP.L"] + jc["HIP.R"]) / 2; meta["PELVIS_CENTRE"] = {"method": "midpoint of hip joint centres"}
# opsional: pusat engsel siku/pergelangan kaki yang disempurnakan (fit_hinge_centres.py; geser ⟂ sumbu, ±12 mm per arah)
HINGE_NOTE = None
if "--hinges" in argv:
    ref = json.load(open(argv[argv.index("--hinges") + 1]))["hinges"]
    for k, r in ref.items():
        jc[k] = np.array(r["refined_centre_m"])
        meta[k] = dict(meta[k], refined="surface-congruence hinge fit", shift_mm=r["shift_mm"],
                       max_penetration_mm=[r["max_penetration_mm_isb"], r["max_penetration_mm_refined"]])
    HINGE_NOTE = {k: {"shift_mm": r["shift_mm"], "max_penetration_mm_isb": r["max_penetration_mm_isb"],
                      "max_penetration_mm_refined": r["max_penetration_mm_refined"]} for k, r in ref.items()}

# ── armature ──────────────────────────────────────────────────────────────────
arm_d = bpy.data.armatures.new("RIG.ADULT_MALE"); arm = bpy.data.objects.new("RIG.ADULT_MALE", arm_d)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones
ANT = Vector((0, -1, 0))  # sumbu Z lokal tulang diarahkan ke anterior → X lokal = sumbu fleksi/ekstensi


def bone(name, h, t, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(h); b.tail = Vector(t); b.align_roll(ANT)
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b


VERT_OF = {}  # tulang segmen tulang belakang ← vertebra di atas diskus kepalanya
bone("PELVIS", jc["PELVIS_CENTRE"], jc["DISC.L5_S1"])
prev = "PELVIS"
for lo, hi in zip(LEVELS, LEVELS[1:] + ["ATLANTO_OCCIPITAL"]):
    vb = lo.split("_")[0]  # vertebra di atas diskus lo: L5_S1 → L5
    name = f"SPINE.{vb}"
    bone(name, jc[f"DISC.{lo}"], jc[f"DISC.{hi}"] if hi != "ATLANTO_OCCIPITAL" else jc["ATLANTO_OCCIPITAL"], prev, connect=True)
    VERT_OF[vb] = name; prev = name
# C2 menampung C1+C2 (sendi atlantoaksial tidak dipisah pada rig minimal)
bone("HEAD", jc["ATLANTO_OCCIPITAL"], jc["VERTEX"], prev, connect=True)
for s in SIDES:
    bone(f"CLAVICLE.{s}", jc[f"STERNOCLAVICULAR.{s}"], jc[f"SHOULDER.{s}"], VERT_OF["T1"])
    bone(f"UPPER_ARM.{s}", jc[f"SHOULDER.{s}"], jc[f"ELBOW.{s}"], f"CLAVICLE.{s}", connect=True)
    bone(f"FOREARM.{s}", jc[f"ELBOW.{s}"], jc[f"WRIST.{s}"], f"UPPER_ARM.{s}", connect=True)
    bone(f"FOREARM_ROT.{s}", jc[f"RADIAL_HEAD.{s}"], jc[f"ULNAR_HEAD.{s}"], f"FOREARM.{s}")  # radius + tangan berputar di sini
    bone(f"HAND.{s}", jc[f"WRIST.{s}"], jc[f"HAND_END.{s}"], f"FOREARM_ROT.{s}")
    bone(f"THIGH.{s}", jc[f"HIP.{s}"], jc[f"KNEE.{s}"], "PELVIS")
    bone(f"SHIN.{s}", jc[f"KNEE.{s}"], jc[f"ANKLE.{s}"], f"THIGH.{s}", connect=True)
    bone(f"FOOT.{s}", jc[f"ANKLE.{s}"], jc[f"TOE_END.{s}"], f"SHIN.{s}", connect=True)
# sumbu fleksi lutut, siku, pergelangan kaki = garis epikondilus / maleolus (ISB, Wu dkk. 2002/2005), bukan sekadar
# tegak lurus tulang ke anterior: X lokal tulang distal diarahkan ke sumbu itu (diproyeksikan ⟂ tulang).
AXIS_BONE = {"SHIN": "KNEE", "FOREARM": "ELBOW", "FOOT": "ANKLE"}
axis_dev = {}
for s in SIDES:
    for bn, key in AXIS_BONE.items():
        b = eb[f"{bn}.{s}"]; y = (b.tail - b.head).normalized()
        x = Vector(AXIS[f"{key}.{s}"].tolist()); x = (x - y * x.dot(y)).normalized()
        old_x = b.x_axis.copy(); b.align_roll(x.cross(y))
        dev = math.degrees(old_x.angle(b.x_axis)); axis_dev[f"{bn}.{s}"] = round(min(dev, 180 - dev), 1)  # sudut antar garis (arah sumbu bisa terbalik)
bpy.ops.object.mode_set(mode='OBJECT')

# ── ikatan kaku: tiap mesh rangka/sendi → satu tulang rig ────────────────────
RULES = [
    (r"TRIRADIATE_CARTILAGE|INTERCORNUAL", "PELVIS"),
    (r"TRANSVERSE_HUMERAL_LIGAMENT", "UPPER_ARM"),
    (r"STYLOMANDIBULAR|SPHENOMANDIBULAR|PTERYGOSPINOUS", "HEAD"),
    (r"ULNOPISIFORM|TRAPEZOID_BONE", "HAND"),
    (r"\.(HIP_BONE|SACRUM|COCCYX)\b|INTERPUBIC|SACRO|PUBIC_SYMPH|ILIOLUMBAR|SACROSPINOUS|SACROTUBEROUS|ACETABUL|OBTURATOR_MEMBRANE|INGUINAL", "PELVIS"),
    (r"(FRONTAL|PARIETAL|OCCIPITAL|TEMPORAL|SPHENOID|ETHMOID|NASAL|LACRIMAL|ZYGOMATIC|PALATINE|VOMER|MAXILLA|MANDIBLE|HYOID|NASAL_CONCHA|AUDITORY_OSSICLE|MALLEUS|INCUS|STAPES|TOOTH|INCISOR|CANINE|MOLAR|PREMOLAR|TEMPOROMANDIBULAR|SKULL|CRANI)", "HEAD"),
    (r"\.(FEMUR|PATELLA)\.|HIP_JOINT|HEAD_OF_FEMUR|ILIOFEMORAL|PUBOFEMORAL|ISCHIOFEMORAL|ZONA_ORBICULARIS", "THIGH"),
    (r"\.(TIBIA|FIBULA)\.|KNEE|MENISC|CRUCIATE|TIBIAL_COLLATERAL|FIBULAR_COLLATERAL|PATELLAR_LIGAMENT|TIBIOFIBULAR|INTEROSSEOUS_MEMBRANE_OF_LEG|POPLITEAL", "SHIN"),
    (r"TALUS|CALCANEUS|NAVICULAR|CUBOID|CUNEIFORM|METATARS|OF_FOOT|TOE|SESAMOID_BONES_OF_FOOT|PLANTAR|TALO|CALCANEO|DELTOID_LIGAMENT|ANKLE|TARS", "FOOT"),
    (r"\.HUMERUS\.|GLENOHUMERAL|CORACOHUMERAL|GLENOID_LABRUM", "UPPER_ARM"),
    (r"\.RADIUS\.|RADIO_ULNAR|DISTAL_RADIO", "FOREARM_ROT"),  # radius & sendi radioulnar distal ikut berputar (pronasi)
    (r"\.ULNA\.|ELBOW|ANNULAR_LIGAMENT|INTEROSSEOUS_MEMBRANE_OF_FOREARM|ULNAR_COLLATERAL_LIGAMENT\.|RADIAL_COLLATERAL_LIGAMENT\.", "FOREARM"),
    (r"SCAPHOID|LUNATE|TRIQUETR|PISIFORM|TRAPEZI|CAPITATE|HAMATE|METACARP|OF_HAND|CARP|WRIST|RADIOCARPAL|FINGER|THUMB|SESAMOID_BONES_OF_HAND|PALMAR|PISOHAMATE", "HAND"),
    (r"\.(CLAVICLE|SCAPULA)\.|STERNOCLAVICULAR|ACROMIOCLAVICULAR|CORACOCLAVICULAR|CORACOACROMIAL|TRANSVERSE_SCAPULAR|COSTOCLAVICULAR|CONOID|TRAPEZOID_LIGAMENT", "CLAVICLE"),
]
RIB_NUM = {"FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4, "FIFTH": 5, "SIXTH": 6, "SEVENTH": 7, "EIGHTH": 8, "NINTH": 9, "TENTH": 10, "ELEVENTH": 11, "TWELFTH": 12}


def seg_dist(p, b):
    h, t = np.array(b.head_local[:]), np.array(b.tail_local[:]); d = t - h
    u = np.clip(np.dot(p - h, d) / np.dot(d, d), 0, 1); return float(np.linalg.norm(p - (h + u * d)))


def assign(o):
    n = o.name; side = n[-1] if n[-2:] in (".L", ".R") else None
    cx = sum((o.matrix_world @ Vector(k)).x for k in o.bound_box) / 8
    lat_side = side or (("L" if cx > 0 else "R") if abs(cx) > 0.05 else None)  # tanpa sufiks: sisi dari geometri
    m = re.search(r"VERTEBRA_([CTL]\d+)|ATLAS_(C1)|AXIS_(C2)", n)
    if m:
        v = next(g for g in m.groups() if g); return VERT_OF.get(v, VERT_OF["C2"] if v == "C1" else None), "rule:vertebra"
    m = re.search(r"(?:INTERVERTEBRAL_DISC|NUCLEUS_PULPOSUS)_([CTL]\d+)_", n)
    if m:
        return VERT_OF[m.group(1)], "rule:disc→upper vertebra"
    m = re.search(r"(\w+?)_RIB\b|COSTAL_CARTILAGE_OF_(\w+?)_RIB", n)
    if m:
        k = next(g for g in m.groups() if g).split("_")[-1]
        if k in RIB_NUM: return VERT_OF[f"T{RIB_NUM[k]}"], "rule:rib→thoracic vertebra"
    if re.search(r"STERN|MANUBRIUM|XIPHOID", n):
        return VERT_OF["T4"], "rule:sternum→T4 segment"
    for pat, b in RULES:
        if re.search(pat, n):
            return (f"{b}.{lat_side}" if b not in ("PELVIS", "HEAD") and lat_side else b if b in ("PELVIS", "HEAD") else None), f"rule:{b.lower()}"
    # cadangan: segmen terdekat pada sisi yang sama (dilaporkan untuk ditinjau)
    c = np.array(sum((o.matrix_world @ Vector(k) for k in o.bound_box), Vector()) / 8)
    cands = [b for b in arm_d.bones if side is None or not b.name.endswith((".L", ".R")) or b.name.endswith("." + side)]
    b = min(cands, key=lambda b: seg_dist(c, b)); return b.name, f"nearest segment ({seg_dist(c, b) * 1000:.0f} mm)"


SPANNING = re.compile(r"LONGITUDINAL_LIGAMENT|SUPRASPINOUS|INTERSPINOUS|NUCHAL|INTERCOSTAL_MEMBRANE|LIGAMENTA_FLAVA|INTERTRANSVERSE|INTERCLAVICULAR|COSTOTRANSVERSE|HEAD_OF_RIB")
binding, review, spanning = {}, [], []
targets = [o for o in ob if o.type == 'MESH' and o.get("panacea_body_id") == "HUMAN.ADULT.MALE" and o.get("panacea_system") in ("skeletal", "joint")]
for o in targets:
    bname, how = assign(o)
    if bname is None or bname not in arm_d.bones:
        bname, how = assign.__wrapped__(o) if hasattr(assign, "__wrapped__") else (None, "unassigned")
    if bname is None:
        review.append([o.name, "unassigned"]); continue
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bname; o.matrix_world = mw
    binding.setdefault(bname, []).append(o.name)
    if SPANNING.search(o.name):
        spanning.append(o.name); o["panacea_rig_note"] = "multi-segment structure; rigid binding is an approximation (needs deformable skinning)"
    elif how.startswith("nearest"): review.append([o.name, f"{bname} via {how}"])

# ── batas ROM (AAOS) dengan tanda sumbu ditentukan numerik ─────────────────────
ROM = {  # tulang: {gerak: derajat}
    "THIGH": {"flexion": 120, "extension": 30, "abduction": 45, "adduction": 30, "internal_rotation": 45, "external_rotation": 45},
    "SHIN": {"flexion": 135, "extension": 0},
    "FOOT": {"flexion": 50, "extension": 20},  # fleksi plantar 50, dorsofleksi 20 (sendi talokrural)
    # aduksi 0: lengan di sisi badan sudah menempel trunkus (aduksi horizontal tidak dimodelkan)
    "UPPER_ARM": {"flexion": 180, "extension": 60, "abduction": 180, "adduction": 0, "internal_rotation": 70, "external_rotation": 90},
    # rotasi lengan bawah = pronasi/supinasi. AAOS: 80/80 dari posisi netral (ibu jari ke atas); posisi istirahat
    # anatomis = supinasi penuh, jadi dari istirahat: pronasi 0→160, supinasi 0 (diverifikasi: radius distal lateral dari ulna)
    "FOREARM": {"flexion": 150, "extension": 0},
    "FOREARM_ROT": {"internal_rotation": 160, "external_rotation": 0},  # pronasi 0→160 dari istirahat (supinasi penuh)
    "HAND": {"flexion": 80, "extension": 70, "abduction": 20, "adduction": 30},  # abduksi = deviasi radial, aduksi = deviasi ulnar
}


def moved(pb, axis, ang, probe):
    """Posisi titik probe (ruang tulang) setelah rotasi lokal kecil."""
    M0 = pb.bone.matrix_local
    R = Matrix.Rotation(math.radians(ang), 4, axis)
    return np.array((M0 @ R @ probe)[:])


limits_report = {}
for s in SIDES:
    for base, rom in ROM.items():
        pb = arm.pose.bones[f"{base}.{s}"]; L = pb.length
        tip = Vector((0, L, 0))
        lim = {"X": [0, 0], "Y": [0, 0], "Z": [0, 0]}
        # fleksi/ekstensi (X lokal): fleksi = ujung bergerak ke anterior (−Y), kecuali lutut: tungkai ke posterior;
        # fleksi plantar kaki = ujung ke inferior
        d = moved(pb, 'X', 10, tip) - np.array(pb.bone.tail_local[:])
        if base == "SHIN": flex_pos = d[1] > 0
        elif base == "FOOT": flex_pos = d[2] < 0
        else: flex_pos = d[1] < 0
        fl, ex = rom.get("flexion", 0), rom.get("extension", 0)
        lim["X"] = [-ex, fl] if flex_pos else [-fl, ex]
        if "abduction" in rom:  # Z lokal: abduksi = ujung menjauhi garis tengah (|x| naik); tangan: deviasi radial = ke lateral
            d = moved(pb, 'Z', 10, tip) - np.array(pb.bone.tail_local[:])
            ab_pos = d[0] * sgn[s] > 0
            ab, ad = rom["abduction"], rom.get("adduction", 0)
            lim["Z"] = [-ad, ab] if ab_pos else [-ab, ad]
        if "internal_rotation" in rom:  # Y lokal: rotasi internal = permukaan anterior berputar ke medial
            probe = Vector((0, L / 2, 0.05))  # Z lokal = anterior
            d = moved(pb, 'Y', 10, probe) - moved(pb, 'Y', 0, probe)
            ir_pos = d[0] * sgn[s] < 0
            ir, er = rom["internal_rotation"], rom["external_rotation"]
            lim["Y"] = [-er, ir] if ir_pos else [-ir, er]
        c = pb.constraints.new('LIMIT_ROTATION'); c.owner_space = 'LOCAL'
        for ax in "XYZ":
            lo, hi = lim[ax]
            setattr(c, f"use_limit_{ax.lower()}", True)
            setattr(c, f"min_{ax.lower()}", math.radians(lo)); setattr(c, f"max_{ax.lower()}", math.radians(hi))
        pb.rotation_mode = 'XYZ'
        limits_report[pb.name] = {ax: lim[ax] for ax in "XYZ"} | {"positive_X": "flexion" if flex_pos else "extension"}

# ── QA rig ────────────────────────────────────────────────────────────────────
def length(n): return arm_d.bones[n].length
sym = {b: round(abs(length(f"{b}.L") - length(f"{b}.R")) * 1000, 2) for b in ("CLAVICLE", "UPPER_ARM", "FOREARM", "FOREARM_ROT", "HAND", "THIGH", "SHIN", "FOOT")}
seglen = {b.name: round(b.length * 1000, 1) for b in arm_d.bones}
prox = {}
for key, pair in {"HIP": ("FEMUR", "HIP_BONE"), "KNEE": ("FEMUR", "TIBIA"), "ANKLE": ("TIBIA", "TALUS"),
                  "SHOULDER": ("HUMERUS", "SCAPULA"), "ELBOW": ("HUMERUS", "ULNA"), "WRIST": ("RADIUS", "LUNATE")}.items():
    for s in SIDES:
        prox[f"{key}.{s}"] = {bn: round(snap(f"{P}{bn}.{s}", jc[f"{key}.{s}"])[1] * 1000, 1) for bn in pair if f"{P}{bn}.{s}" in ob}
qa = {"left_right_length_difference_mm": sym, "joint_centre_to_articulating_bone_surface_mm": prox,
      "bound_meshes": sum(len(v) for v in binding.values()), "meshes_considered": len(targets), "for_review": review,
      "multi_segment_rigid_approximation": spanning}

# simpan hanya rig + rangka/sendi laki-laki ke berkas terpisah
keep = {arm.name} | {o.name for o in targets}
for o in list(ob):
    if o.name not in keep:
        ob.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if not c.all_objects:
        bpy.data.collections.remove(c)
bpy.ops.outliner.orphans_purge(do_recursive=True)
arm["panacea_rig_definition"] = "ISB joint centres from source geometry; rigid bone binding; AAOS ROM limits"
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
json.dump({"body": "HUMAN.ADULT.MALE", "frame": "+Z superior, +X subject left, -Y anterior, metres",
           "joint_centres_m": {k: [round(float(x), 4) for x in v] for k, v in jc.items()}, "joint_centre_methods": meta,
           "segments_mm": seglen, "rom_limits_deg_local": limits_report,
           "rom_source": "AAOS normal values (Greene & Heckman 1994)",
           "flexion_axis": "knee, elbow and ankle flexion about the epicondylar / malleolar line (ISB); others perpendicular to the bone, anterior roll",
           "flexion_axis_change_deg": axis_dev,
           "flexion_axes": {k: [round(float(x), 5) for x in v] for k, v in AXIS.items()},
           "hinge_refinement": HINGE_NOTE, "binding": {k: len(v) for k, v in binding.items()}, "qa": qa},
          open(REPORT, "w"), indent=1)
print("RIG", len(arm_d.bones), "bones;", qa["bound_meshes"], "/", qa["meshes_considered"], "meshes bound;", len(review), "for review")
print("SYM", sym); print("PROX", prox)
print("HIPFIT", meta["HIP.L"], meta["SHOULDER.L"])
