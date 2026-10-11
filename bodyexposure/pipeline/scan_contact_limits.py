"""Batas gerak yang dibatasi kontak tulang pada rig tungkai bawah: untuk tiap gerakan dan sisi, sudut terbesar (≤ nilai AAOS) dengan penetrasi ≤ 1,5 mm.

  Blender -b bodies/PANACEA_RIG_VHF_DENVER_CT.blend -P bodyexposure/pipeline/scan_contact_limits.py -- --body VHF_DENVER_CT.ADULT.FEMALE \
      --rom bodyexposure/manifest/rig_vhf_denver_ct.json --out bodyexposure/manifest/rig_vhf_denver_ct_contact_caps.json

Gerakan diukur dari pose NETRAL (offset istirahat sudah dimasukkan di manifest). Langkah 5° dari nilai AAOS ke bawah; pasangan tulang yang diuji adalah
yang berartikulasi pada gerakan itu. Hasil dibaca animate_rom_lower_limb.py: sudut animasi = min(AAOS, batas kontak). Penyebab batas (anatomi donor atau
kesalahan pusat sendi) tidak ditentukan oleh skrip ini.
"""
import bpy, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rig_contact_qa as q

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
BODY = arg("--body"); RIG = json.load(open(arg("--rom"))); ROM = RIG["rom_limits_deg_local"]; NEUTRAL = RIG["neutral_local_deg"]
arm = bpy.data.objects["RIG.VHF_LOWER_LIMB"]; P = arm.pose.bones; pre = BODY + ".SKELETAL."
AX = {"X": 0, "Y": 1, "Z": 2}
# (kunci, tulang dasar, sumbu, gerakan, derajat AAOS, pasangan tulang)
MOVES = [("hip_flexion", "THIGH", "X", "flexion", 120, [("FEMUR", "HIP_BONE_OS_COXAE")]), ("hip_extension", "THIGH", "X", "extension", 30, [("FEMUR", "HIP_BONE_OS_COXAE")]),
         ("hip_abduction", "THIGH", "Z", "abduction", 45, [("FEMUR", "HIP_BONE_OS_COXAE")]), ("hip_adduction", "THIGH", "Z", "adduction", 30, [("FEMUR", "HIP_BONE_OS_COXAE")]),
         ("hip_internal_rotation", "THIGH", "Y", "internal_rotation", 45, [("FEMUR", "HIP_BONE_OS_COXAE")]), ("hip_external_rotation", "THIGH", "Y", "external_rotation", 45, [("FEMUR", "HIP_BONE_OS_COXAE")]),
         ("knee_flexion", "SHIN", "X", "flexion", 135, [("FEMUR", "TIBIA"), ("FEMUR", "PATELLA"), ("TIBIA", "FIBULA")]),
         ("ankle_plantarflexion", "FOOT", "X", "flexion", 50, [("TIBIA", "TALUS"), ("FIBULA", "TALUS")]), ("ankle_dorsiflexion", "FOOT", "X", "extension", 20, [("TIBIA", "TALUS"), ("FIBULA", "TALUS")])]


def pen(bone, axis, mov, deg, pairs, side):
    for pb in P:
        pb.rotation_mode = 'XYZ'; pb.rotation_euler = [math.radians(NEUTRAL.get(pb.name, {}).get(ax, 0.0)) for ax in "XYZ"]
    sg = 1 if ROM[bone][f"positive_{axis}"] == mov else -1
    e = [math.radians(NEUTRAL.get(bone, {}).get(ax, 0.0)) for ax in "XYZ"]; e[AX[axis]] += math.radians(sg * deg); P[bone].rotation_euler = e
    if bone == "THIGH" and mov == "flexion": P[f"SHIN.{side}"].rotation_euler[0] += math.radians(sg * deg)  # panggul diukur dengan lutut menekuk (cara ukur AAOS)
    bpy.context.view_layer.update()
    return max(max(q.depth(f"{pre}{a}.{side}", f"{pre}{b}.{side}"), q.depth(f"{pre}{b}.{side}", f"{pre}{a}.{side}")) for a, b in pairs) * 1000


res = {"gate_mm": 1.5, "step_deg": 5, "caps": {}}
for key, base, axis, mov, aaos, pairs in MOVES:
    for side in "LR":
        bone = f"{base}.{side}"
        if base == "THIGH" and axis == "Z" and ROM[bone].get("positive_Z") not in ("abduction", "adduction"): continue
        # tanda arah: 'adduction' memakai sumbu Z dengan tanda berlawanan terhadap abduksi
        eff_mov = mov
        if axis == "Z": eff_mov = mov
        deg, first = aaos, None
        while deg > 0:
            d = pen(bone, axis, eff_mov, deg, pairs, side)
            if first is None: first = d
            if d <= 1.5: break
            deg -= 5
        res["caps"][f"{key}.{side}"] = {"aaos_deg": aaos, "cap_deg": max(deg, 0), "penetration_at_aaos_mm": round(first, 2), "penetration_at_cap_mm": round(d, 2)}
        print("CAP", key, side, res["caps"][f"{key}.{side}"])
json.dump(res, open(arg("--out"), "w"), indent=1)
