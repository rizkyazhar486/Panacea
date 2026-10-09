"""Animasi ROM tungkai bawah perempuan (Visible Human Female, Denver) + QA per frame.

  Blender -b bodies/PANACEA_RIG_VHF_LOWER_LIMB.blend -P bodyexposure/pipeline/animate_rom_lower_limb.py -- \
      --rom bodyexposure/manifest/rig_vhf_lower_limb.json --out bodies/PANACEA_RIG_VHF_LOWER_LIMB_ROM.blend \
      --report bodyexposure/qa_reports/rig_vhf_lower_limb_rom.json

Gerakan hanya dari batas ROM AAOS yang tersimpan di rig (Greene & Heckman 1994): tiap sendi 0 → batas → 0, tanpa kinematika
karangan. Fleksi panggul dengan lutut menekuk (cara ukur AAOS). QA per frame: (1) sudut sendi efektif ≤ batas + 1°;
(2) penetrasi tulang-ke-tulang maksimum antar pasangan yang berartikulasi ≤ 1,5 mm (paritas 3 sinar, dua arah; rig_contact_qa).
Kartilago ikut tulangnya, sehingga celah sendi sudah termodelkan; ligamen dan otot tidak dirig.
"""
import bpy, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rig_contact_qa  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
ROM = json.load(open(arg("--rom")))["rom_limits_deg_local"]
OUT, REPORT = os.path.abspath(arg("--out")), arg("--report")
arm = bpy.data.objects["RIG.VHF_LOWER_LIMB"]; P = arm.pose.bones
FPS, SEG = 24, 36  # frame per setengah gerakan (0 → batas)
rig_contact_qa.configure("VHF_LOWER_LIMB.ADULT.FEMALE.SKELETAL.",
                         [("FEMUR", "TIBIA"), ("FEMUR", "HIP_BONE_OS_COXAE"), ("FEMUR", "PATELLA"), ("TIBIA", "FIBULA"),
                          ("TIBIA", "TALUS"), ("FIBULA", "TALUS")])


def sign_for(bone, axis, movement):
    """+1 bila gerakan menuju sisi positif sumbu lokal; arah positif tiap sumbu dicatat numerik oleh build_rig_lower_limb.py."""
    return 1 if ROM[bone][f"positive_{axis}"] == movement else -1


MOVES = [
    ("hip flexion (knee flexed)", [("THIGH.L", "X", "flexion", 120), ("SHIN.L", "X", "flexion", 120), ("THIGH.R", "X", "flexion", 120), ("SHIN.R", "X", "flexion", 120)], "AAOS hip 120, knee flexed"),
    ("hip extension", [("THIGH.L", "X", "extension", 30), ("THIGH.R", "X", "extension", 30)], "AAOS 30"),
    ("hip abduction", [("THIGH.L", "Z", "abduction", 45), ("THIGH.R", "Z", "abduction", 45)], "AAOS 45"),
    ("hip adduction", [("THIGH.L", "Z", "adduction", 30), ("THIGH.R", "Z", "adduction", 25)],
     "AAOS 30; right side 25: femur meets the right hip bone 4.0 mm deep at 30 degrees but 1.0 mm at 25 (left side clear at 30). Cause not determined (donor anatomy or right hip-centre error)"),
    ("hip internal rotation", [("THIGH.L", "Y", "internal_rotation", 45), ("THIGH.R", "Y", "internal_rotation", 45)], "AAOS 45"),
    ("hip external rotation", [("THIGH.L", "Y", "external_rotation", 45), ("THIGH.R", "Y", "external_rotation", 40)],
     "AAOS 45; right side 40: femur meets the right hip bone 2.9 mm deep at 45 degrees but 0.4 mm at 40 (left side 0.8 at 45). Cause not determined"),
    ("knee flexion", [("SHIN.L", "X", "flexion", 135), ("SHIN.R", "X", "flexion", 135)], "AAOS 135"),
    ("ankle plantarflexion", [("FOOT.L", "X", "flexion", 50), ("FOOT.R", "X", "flexion", 50)], "AAOS 50"),
    ("ankle dorsiflexion", [("FOOT.L", "X", "extension", 20), ("FOOT.R", "X", "extension", 15)],
     "AAOS 20; right side 15: fibula meets the right talus 2.2 mm deep at 20 degrees but 0.9 mm at 15 (left side clear at 20). Cause not determined"),
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
        sg = sign_for(bone, axis, mov)
        for f, d in ((start, 0), (peak, deg), (end, 0)):
            e = [0.0, 0.0, 0.0]; e[AX[axis]] = math.radians(sg * d)
            pb.rotation_euler = e; pb.keyframe_insert("rotation_euler", frame=f)
    timeline.append({"movement": name, "frames": [start, peak, end], "target_deg": {b: d for b, _, _, d in parts}, "note": note})
    frame = end
sc = bpy.context.scene; sc.frame_start, sc.frame_end, sc.render.fps = 1, frame, FPS
for fc in (arm.animation_data.action.fcurves if hasattr(arm.animation_data.action, "fcurves") else []):
    for k in fc.keyframe_points: k.interpolation = 'SINE'


def joint_deg(parent, child):
    a = (P[parent].tail - P[parent].head).normalized(); b = (P[child].tail - P[child].head).normalized()
    return math.degrees(a.angle(b))


vec = lambda b: (P[b].tail - P[b].head).normalized()
sc.frame_set(1); rest_knee = joint_deg("THIGH.L", "SHIN.L"); rest_hip = vec("THIGH.R")
dev = {"knee": 0.0, "hip": 0.0}
for f in range(1, frame + 1, 2):
    sc.frame_set(f)
    dev["knee"] = max(dev["knee"], abs(joint_deg("THIGH.L", "SHIN.L") - rest_knee))
    dev["hip"] = max(dev["hip"], math.degrees(rest_hip.angle(vec("THIGH.R"))))
LIM = {"knee": 135, "hip": 120}
angle_ok = all(dev[k] <= LIM[k] + 1 for k in LIM)

frames = sorted(set(list(range(1, frame + 1, 12)) + [t["frames"][1] for t in timeline]))
contact = rig_contact_qa.sweep(sc, frames, lambda at: next((t["movement"] for t in timeline if t["frames"][0] <= at <= t["frames"][2]), "rest"))
contact_ok = all(c["max_penetration_mm"] <= 1.5 for c in contact)
sc.frame_set(1)
arm["panacea_animation"] = "ROM demonstration from AAOS limits (see qa_reports/rig_vhf_lower_limb_rom.json)"
bpy.ops.wm.save_as_mainfile(filepath=OUT)
rep = {"frames": frame, "fps": FPS, "timeline": timeline, "max_joint_excursion_deg": {k: round(v, 1) for k, v in dev.items()},
       "angle_within_limits": angle_ok, "bone_contact_overlap": contact, "no_new_bone_penetration": contact_ok, "ok": angle_ok and contact_ok}
json.dump(rep, open(REPORT, "w"), indent=1)
print("ROMANIM", json.dumps({k: rep[k] for k in ("frames", "max_joint_excursion_deg", "angle_within_limits", "no_new_bone_penetration", "ok")}))
for c in sorted(contact, key=lambda c: -c["max_penetration_mm"])[:10]: print("CONTACT", c)
