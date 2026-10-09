"""Animasi demo rentang gerak (ROM) pada rig laki-laki dewasa + QA per frame.

  Blender -b bodies/PANACEA_RIG_ADULT_MALE.blend -P bodyexposure/pipeline/animate_rom.py -- \
      --rom bodyexposure/manifest/rig_adult_male.json --out bodies/PANACEA_RIG_ADULT_MALE_ROM.blend \
      --report bodyexposure/qa_reports/rig_rom_animation.json [--preview renders/rom_preview.mp4]

Gerakan hanya dari batas ROM AAOS yang tersimpan di rig (Greene & Heckman 1994), tidak ada kinematika karangan:
tiap sendi bergerak 0 → batas → 0. Pengecualian yang disengaja (rig belum punya sendi skapulotorakal): abduksi bahu
dibatasi 90° (angka AAOS 180° mencakup rotasi skapula). Fleksi panggul dilakukan dengan lutut menekuk, sesuai cara
pengukuran AAOS (paha belakang tidak membatasi).
QA per frame: (1) sudut sendi efektif ≤ batas + 1° (lutut, siku: sudut antar tulang; panggul, bahu: perubahan arah
tulang dari istirahat); (2) kedalaman penetrasi maksimum antar tulang yang berartikulasi
pada frame ekstrem ≤ 1,5 mm (verteks tulang A di dalam permukaan B, BVH + arah normal). Rig tidak memodelkan kartilago
artikular, sehingga kontak tulang-ke-tulang tanpa celah sudah merupakan penyederhanaan.
"""
import bpy, json, math, os, sys
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
ROM = json.load(open(arg("--rom")))["rom_limits_deg_local"]
OUT, REPORT, PREVIEW = os.path.abspath(arg("--out")), arg("--report"), arg("--preview")
arm = bpy.data.objects["RIG.ADULT_MALE"]; P = arm.pose.bones
FPS, SEG = 24, 36  # frame per setengah gerakan (0 → batas)


def sign_for(bone, axis, movement):
    """Tanda sudut lokal untuk gerakan anatomis, dibaca dari batas yang tersimpan (positif = arah batas terbesar)."""
    lo, hi = ROM[bone][axis]
    if axis == "X":
        return 1 if ROM[bone]["positive_X"] == movement else -1
    return 1 if hi >= -lo else -1  # Z: abduksi = sisi batas yang lebih besar; Y: pronasi / rotasi internal


# (nama, [(tulang, sumbu, gerakan, derajat)], catatan)
MOVES = [
    ("shoulder flexion", [("UPPER_ARM.L", "X", "flexion", 180), ("UPPER_ARM.R", "X", "flexion", 180)], "AAOS 180"),
    ("shoulder abduction", [("UPPER_ARM.L", "Z", "abduction", 90), ("UPPER_ARM.R", "Z", "abduction", 90)], "90 of AAOS 180: no scapulothoracic joint yet"),
    ("elbow flexion", [("FOREARM.L", "X", "flexion", 150), ("FOREARM.R", "X", "flexion", 150)], "AAOS 150"),
    ("forearm pronation", [("FOREARM.L", "Y", "pronation", 160), ("FOREARM.R", "Y", "pronation", 160)], "AAOS 80+80 from supinated rest"),
    ("wrist flexion", [("HAND.L", "X", "flexion", 80), ("HAND.R", "X", "flexion", 80)], "AAOS 80"),
    ("wrist extension", [("HAND.L", "X", "extension", 70), ("HAND.R", "X", "extension", 70)], "AAOS 70"),
    ("hip flexion (knee flexed)", [("THIGH.R", "X", "flexion", 120), ("SHIN.R", "X", "flexion", 120)], "AAOS hip 120, knee flexed"),
    ("hip abduction", [("THIGH.L", "Z", "abduction", 45), ("THIGH.R", "Z", "abduction", 45)], "AAOS 45"),
    ("knee flexion", [("SHIN.L", "X", "flexion", 135)], "AAOS 135"),
    ("ankle plantarflexion", [("FOOT.L", "X", "flexion", 50), ("FOOT.R", "X", "flexion", 50)], "AAOS 50"),
    ("ankle dorsiflexion", [("FOOT.L", "X", "extension", 20), ("FOOT.R", "X", "extension", 20)], "AAOS 20"),
]
AX = {"X": 0, "Y": 1, "Z": 2}
for pb in P:
    pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0)
    pb.keyframe_insert("rotation_euler", frame=1)
frame, timeline = 1, []
for name, parts, note in MOVES:
    start, peak, end = frame, frame + SEG, frame + 2 * SEG
    for bone, axis, mov, deg in parts:
        pb = P[bone]
        for f, d in ((start, 0), (peak, deg), (end, 0)):
            e = [0.0, 0.0, 0.0]; e[AX[axis]] = math.radians(sign_for(bone, axis, mov) * d)
            pb.rotation_euler = e; pb.keyframe_insert("rotation_euler", frame=f)
    timeline.append({"movement": name, "frames": [start, peak, end], "target_deg": parts[0][3], "note": note})
    frame = end
sc = bpy.context.scene; sc.frame_start, sc.frame_end, sc.render.fps = 1, frame, FPS
for fc in (arm.animation_data.action.fcurves if hasattr(arm.animation_data.action, "fcurves") else []):
    for k in fc.keyframe_points: k.interpolation = 'SINE'

# ── QA ────────────────────────────────────────────────────────────────────────
def joint_deg(parent, child):
    a = (P[parent].tail - P[parent].head).normalized(); b = (P[child].tail - P[child].head).normalized()
    return math.degrees(a.angle(b))


PAIRS = {"knee": ("THIGH.L", "SHIN.L"), "elbow": ("UPPER_ARM.L", "FOREARM.L")}
LIM = {"knee": 135, "elbow": 150, "hip": 120, "shoulder": 180}
# panggul & bahu: induk (pelvis, klavikula) tidak bergerak → ekskursi = perubahan arah tulang dari istirahat
SWING = {"hip": "THIGH.R", "shoulder": "UPPER_ARM.L"}
vec = lambda b: (P[b].tail - P[b].head).normalized()
sc.frame_set(1); rest = {k: joint_deg(*v) for k, v in PAIRS.items()}; rest_v = {k: vec(b) for k, b in SWING.items()}
maxdev = {k: 0.0 for k in list(PAIRS) + list(SWING)}
for f in range(1, frame + 1, 2):
    sc.frame_set(f)
    for k, v in PAIRS.items():
        maxdev[k] = max(maxdev[k], abs(joint_deg(*v) - rest[k]))
    for k, b in SWING.items():
        maxdev[k] = max(maxdev[k], math.degrees(rest_v[k].angle(vec(b))))
angle_ok = all(maxdev[k] <= LIM[k] + 1 for k in LIM)


def tree(name):
    o = bpy.data.objects[name]; dg = bpy.context.evaluated_depsgraph_get(); M = o.matrix_world
    me = o.evaluated_get(dg).data
    return BVHTree.FromPolygons([M @ v.co for v in me.vertices], [p.vertices[:] for p in me.polygons])


S = "ADULT.MALE.SKELETAL."
CONTACT = [("knee flexion", S + "FEMUR.L", S + "TIBIA.L"), ("elbow flexion", S + "HUMERUS.L", S + "ULNA.L"),
           ("hip flexion (knee flexed)", S + "FEMUR.R", S + "HIP_BONE.R"), ("shoulder abduction", S + "HUMERUS.L", S + "SCAPULA.L"),
           ("ankle plantarflexion", S + "TIBIA.L", S + "TALUS.L"), ("wrist flexion", S + "RADIUS.L", S + "LUNATE.L")]
peak_of = {t["movement"]: t["frames"][1] for t in timeline}
def depth(a, b):
    """Kedalaman maksimum (m) verteks tulang a yang berada di dalam permukaan tulang b."""
    oa = bpy.data.objects[a]; dg = bpy.context.evaluated_depsgraph_get(); M = oa.matrix_world
    tb = tree(b); ta = tree(a); me = oa.evaluated_get(dg).data
    V = [M @ v.co for v in me.vertices]; F = [p.vertices[:] for p in me.polygons]
    worst = 0.0
    for pa, _ in ta.overlap(tb):
        for i in F[pa]:
            loc, nor, _, dist = tb.find_nearest(V[i])
            if loc is not None and (V[i] - loc).dot(nor) < 0: worst = max(worst, dist)
    return worst


CONTACT += [("elbow flexion", S + "HUMERUS.L", S + "RADIUS.L"), ("ankle dorsiflexion", S + "TIBIA.L", S + "TALUS.L")]
contact = []
for mov, a, b in CONTACT:
    if a not in bpy.data.objects or b not in bpy.data.objects:
        continue
    sc.frame_set(1); d0 = depth(a, b); sc.frame_set(peak_of[mov]); d1 = depth(a, b)
    contact.append({"movement": mov, "pair": [a.split(".")[-2] + "." + a[-1], b.split(".")[-2] + "." + b[-1]],
                    "penetration_mm_rest": round(d0 * 1000, 2), "penetration_mm_peak": round(d1 * 1000, 2)})
contact_ok = all(c["penetration_mm_peak"] <= 1.5 for c in contact)
sc.frame_set(1)
arm["panacea_animation"] = "ROM demonstration from AAOS limits (see qa_reports/rig_rom_animation.json)"
bpy.ops.wm.save_as_mainfile(filepath=OUT)
rep = {"frames": frame, "fps": FPS, "timeline": timeline, "rest_joint_deg": {k: round(v, 1) for k, v in rest.items()},
       "max_joint_excursion_deg": {k: round(v, 1) for k, v in maxdev.items()}, "angle_within_limits": angle_ok,
       "bone_contact_overlap": contact, "no_new_bone_penetration": contact_ok, "ok": angle_ok and contact_ok}
json.dump(rep, open(REPORT, "w"), indent=1)
print("ROMANIM", json.dumps({k: rep[k] for k in ("frames", "max_joint_excursion_deg", "angle_within_limits", "no_new_bone_penetration", "ok")}))
for c in contact: print("CONTACT", c)

if PREVIEW:  # pratinjau cepat (Workbench), bukan render akhir
    for o in bpy.data.objects:
        if o.type == 'MESH': o.hide_render = False
    cd = bpy.data.cameras.new("CAMPV"); cam = bpy.data.objects.new("CAMPV", cd); sc.collection.objects.link(cam)
    cd.type = 'ORTHO'; cd.ortho_scale = 2.6; cam.location = (2.6, -3.2, 1.0); cam.rotation_euler = (math.radians(88), 0, math.radians(39)); sc.camera = cam
    r = sc.render; r.engine = 'BLENDER_WORKBENCH'; r.resolution_x, r.resolution_y, r.resolution_percentage = 1280, 720, 100
    sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
    if hasattr(r.image_settings, "media_type"):  # Blender ≥ 5: video dipilih lewat media_type
        r.image_settings.media_type = 'VIDEO'
    r.image_settings.file_format = 'FFMPEG'; r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'; r.ffmpeg.constant_rate_factor = 'MEDIUM'
    r.filepath = os.path.abspath(PREVIEW)
    bpy.ops.render.render(animation=True)
    print("PREVIEW", r.filepath)
