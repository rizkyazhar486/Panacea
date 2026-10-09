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
# arah: fleksi pergelangan (HAND.R +60 fleksi) → ujung tangan ke anterior relatif lengan bawah istirahat
hand_tip_y = (M @ P["HAND.R"].tail).y; wrist_y = (M @ P["HAND.R"].head).y
# pronasi: lengan bawah kanan diputar 90° ke arah pronasi → titik anterior distal bergerak ke medial
s_pr = 1 if ROM["FOREARM_ROT.R"]["Y"][1] > 0 else -1
P["FOREARM.L"].rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
before = (M @ P["FOREARM_ROT.R"].matrix @ Vector((0, P["FOREARM_ROT.R"].length, 0.03))).x
P["FOREARM_ROT.R"].rotation_mode = 'XYZ'; P["FOREARM_ROT.R"].rotation_euler = (0, math.radians(90 * s_pr), 0); bpy.context.view_layer.update()
after = (M @ P["FOREARM_ROT.R"].matrix @ Vector((0, P["FOREARM_ROT.R"].length, 0.03))).x
pronation_medial = after > before  # sisi kanan: medial = x naik (menuju garis tengah)
res = {"pose_deg": POSE, "left_knee_rest_deg": round(rest_knee, 1), "left_knee_after_170_request_deg": round(knee, 1),
       "rom_clamped": knee <= 135 + rest_knee + 0.5, "right_knee_anterior_y_m": round((M @ P["THIGH.R"].tail).y, 3),
       "meshes_far_from_bone": far, "wrist_flexion_moves_hand_anterior": hand_tip_y < wrist_y - 0.02,
       "forearm_pronation_limit_moves_anterior_point_medially": pronation_medial,
       "hand_X_limits": ROM["HAND.R"]["X"], "forearm_Y_limits": ROM["FOREARM_ROT.R"]["Y"],
       "note": "Centroid-to-bone distance only catches gross misbinding (wrong segment or side); ribs, costal cartilages and sternum are excluded because they are lever arms of their vertebrae."}
res["ok"] = (res["rom_clamped"] and not far and res["right_knee_anterior_y_m"] < -0.1 and res["wrist_flexion_moves_hand_anterior"]
             and pronation_medial and ROM["HAND.R"]["X"] == [-70, 80] and ROM["HAND.R"]["positive_X"] == "flexion" and max(abs(x) for x in ROM["FOREARM_ROT.R"]["Y"]) == 160)
json.dump(res, open(OUT, "w"), indent=1); print("RIGPOSE", json.dumps({k: res[k] for k in ("ok", "left_knee_after_170_request_deg", "rom_clamped", "right_knee_anterior_y_m", "wrist_flexion_moves_hand_anterior", "forearm_pronation_limit_moves_anterior_point_medially", "hand_X_limits", "forearm_Y_limits")}), "far:", far[:5])
