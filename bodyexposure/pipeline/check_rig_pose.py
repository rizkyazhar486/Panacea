"""Uji pose rig: tiap mesh harus tetap dekat tulang induknya setelah pose uji; batas ROM AAOS harus memotong.

  Blender -b bodies/PANACEA_RIG_ADULT_MALE.blend -P bodyexposure/pipeline/check_rig_pose.py -- --rom <rig_adult_male.json> --out <json>

Gagal bila: mesh (selain iga/kartilago kosta/sternum, yang memang lengan tuas vertebra) > 0,25 m dari segmen tulangnya,
atau fleksi lutut yang diminta 170° tidak terpotong ke ≤ 135° (+ sudut istirahat).
"""
import bpy, json, math, sys, re
from mathutils import Vector
from mathutils.geometry import intersect_point_line

argv = sys.argv[sys.argv.index("--") + 1:]
ROM = json.load(open(argv[argv.index("--rom") + 1]))["rom_limits_deg_local"]; OUT = argv[argv.index("--out") + 1]
arm = bpy.data.objects["RIG.ADULT_MALE"]; P = arm.pose.bones; M = arm.matrix_world


def ang(a, b): return math.degrees((P[a].tail - P[a].head).angle(P[b].tail - P[b].head))


rest_knee = ang("THIGH.L", "SHIN.L")
POSE = {"THIGH.R": 90, "SHIN.R": 90, "UPPER_ARM.L": 90, "FOREARM.L": 100, "SHIN.L": 170, "FOOT.R": 30, "HAND.R": 60}
for b, deg in POSE.items():
    s = 1 if ROM[b]["positive_X"] == "flexion" else -1
    P[b].rotation_euler = (math.radians(s * deg), 0, 0)
bpy.context.view_layer.update()
far = []
for o in bpy.data.objects:
    if o.type != 'MESH' or not o.parent_bone or re.search(r"RIB|COSTAL|STERN|XIPHOID|MANUBRIUM", o.name):
        continue
    c = sum((o.matrix_world @ Vector(k) for k in o.bound_box), Vector()) / 8
    h, t = M @ P[o.parent_bone].head, M @ P[o.parent_bone].tail
    _, u = intersect_point_line(c, h, t); u = min(max(u, 0), 1); d = (c - (h + (t - h) * u)).length
    if d > 0.25: far.append([o.name, o.parent_bone, round(d, 3)])
knee = ang("THIGH.L", "SHIN.L")
res = {"pose_deg": POSE, "left_knee_rest_deg": round(rest_knee, 1), "left_knee_after_170_request_deg": round(knee, 1),
       "rom_clamped": knee <= 135 + rest_knee + 0.5, "right_knee_anterior_y_m": round((M @ P["THIGH.R"].tail).y, 3),
       "meshes_far_from_bone": far}
res["ok"] = res["rom_clamped"] and not far and res["right_knee_anterior_y_m"] < -0.1
json.dump(res, open(OUT, "w"), indent=1); print("RIGPOSE", json.dumps({k: res[k] for k in ("ok", "left_knee_after_170_request_deg", "rom_clamped", "right_knee_anterior_y_m")}), "far:", far[:5])
