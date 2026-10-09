"""Gerak berjalan & berlari dari motion capture nyata (CMU Graphics Lab Motion Capture Database) → rig laki-laki dewasa.

  Blender -b bodies/PANACEA_RIG_ADULT_MALE_ROM.blend -P bodyexposure/pipeline/retarget_cmu_gait.py -- \
      --rom bodyexposure/manifest/rig_adult_male.json --src sources/cmu_mocap \
      --clips WALK:07:07_01,RUN:09:09_02 --out bodies/PANACEA_RIG_ADULT_MALE_GAIT.blend --report bodyexposure/qa_reports/rig_gait.json

Sumber: mocap.cs.cmu.edu — "free for all uses; may be included in commercially-sold products; may not be resold
directly, even in converted form". Ucapan terima kasih wajib: "The data used in this project was obtained from
mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217."

Kelas kebenaran: gerak TERUKUR dari individu lain (subjek CMU), dipetakan ke rig ini — bukan biomekanika pasien.
Metode: forward kinematics ASF/AMC (konvensi CMU: M = M_induk·C·R·C⁻¹, Euler statis x→y→z). Paha & lengan atas
diukur terhadap vertikal dunia (pelvis rig tegak & statis; pelvis CMU condong 3–11°), arah depan = arah hadap root
per frame; lutut, pergelangan kaki & siku = sudut antar-segmen. Satu siklus gait (periode dari autokorelasi sudut lutut
kanan, diperhalus ±3 frame untuk sambungan loop terkecil; sisa selisih akhir−awal disebar linear sepanjang siklus)
di-resample 24 fps, diterapkan ke tulang rig dengan tanda
dari manifest ROM dan dijepit ke batas AAOS. Di tempat (treadmill): translasi horizontal dibuang. Jalan: tinggi pelvis
per frame dibuat agar kaki terendah tepat di lantai (selalu ada kaki menumpu). Lari: naik-turun pelvis dari mocap
(diskalakan rasio panjang tungkai) digeser agar titik terendah siklus di lantai (fase melayang dipertahankan).
Tanpa IK penguncian kaki: kaki tumpu bergeser ke belakang seperti di treadmill.
"""
import bpy, json, math, os, sys
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
ROM = json.load(open(arg("--rom")))
LIM = ROM["rom_limits_deg_local"]
SRC, OUT, REPORT = arg("--src"), os.path.abspath(arg("--out")), arg("--report")
CLIPS = [c.split(":") for c in arg("--clips").split(",")]
FPS_OUT = 24  # sama dengan klip ROM: waktu kunci glTF = frame / fps scene (satu nilai untuk semua klip)


# ── ASF / AMC ────────────────────────────────────────────────────────────────
def euler(deg):  # Euler statis x→y→z (transforms3d 'sxyz'): Rz·Ry·Rx
    x, y, z = np.radians(deg)
    Rx = np.array([[1, 0, 0], [0, math.cos(x), -math.sin(x)], [0, math.sin(x), math.cos(x)]])
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rz = np.array([[math.cos(z), -math.sin(z), 0], [math.sin(z), math.cos(z), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


def parse_asf(path):
    lines = [l.strip() for l in open(path) if l.strip() and not l.startswith("#")]
    bones, hier, i, scale = {}, {}, 0, 1.0
    while i < len(lines):
        l = lines[i]
        if l.startswith("length") and not bones:
            scale = float(l.split()[1])
        if l == "begin" and i > 0 and any(lines[j] == ":bonedata" for j in range(i)) and not any(lines[j] == ":hierarchy" for j in range(i)):
            b = {"dof": []}; i += 1
            while lines[i] != "end":
                t = lines[i].split()
                if t[0] == "name": b["name"] = t[1]
                elif t[0] == "direction": b["dir"] = np.array(list(map(float, t[1:4])))
                elif t[0] == "length": b["len"] = float(t[1])
                elif t[0] == "axis": b["axis"] = np.array(list(map(float, t[1:4])))
                elif t[0] == "dof": b["dof"] = t[1:]
                i += 1
            bones[b["name"]] = b
        if l == ":hierarchy":
            i += 2  # begin
            while lines[i] != "end":
                t = lines[i].split(); hier.update({c: t[0] for c in t[1:]}); i += 1
        i += 1
    return bones, hier, scale


def parse_amc(path):
    frames, cur = [], None
    for l in open(path):
        l = l.strip()
        if not l or l[0] in "#:":
            continue
        t = l.split()
        if len(t) == 1 and t[0].isdigit():
            cur = {}; frames.append(cur)
        elif cur is not None:
            cur[t[0]] = list(map(float, t[1:]))
    return frames


def fk(bones, hier, frame):
    """Posisi ujung tiap tulang (unit ASF) + matriks root."""
    root = frame.get("root", [0] * 6)
    M = {"root": euler(root[3:6])}; P = {"root": np.array(root[:3])}
    order = []
    def visit(n):
        for c, p in hier.items():
            if p == n: order.append(c); visit(c)
    visit("root")
    for n in order:
        b = bones[n]; par = hier[n]
        C = euler(b["axis"]); vals = frame.get(n, [])
        rot = [0.0, 0.0, 0.0]
        for d, v in zip(b["dof"], vals):
            rot["xyz".index(d[1])] = v
        M[n] = M[par] @ C @ euler(rot) @ C.T
        P[n] = P[par] + b["len"] * (M[n] @ b["dir"])
    return P, M


# ── sudut anatomis ───────────────────────────────────────────────────────────
def ang(a, b):
    return math.degrees(math.acos(max(-1, min(1, float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))))))


def angles(bones, hier, frames):
    """Sudut anatomis per frame. Paha & lengan atas terhadap VERTIKAL DUNIA (pelvis rig tegak & statis), arah depan
    = arah hadap root per frame (horizontal), kiri dari panggul R→L. Lutut, pergelangan kaki & siku: sudut antar-segmen."""
    zeroP, _ = fk(bones, hier, {})
    a0 = {s: ang(zeroP[f"{s}tibia"] - zeroP[f"{s}femur"], zeroP[f"{s}foot"] - zeroP[f"{s}tibia"]) for s in "lr"}
    up = np.array([0, 1.0, 0])  # ASF/CMU: Y ke atas
    out, roots = [], []
    for fr in frames:
        P, M = fk(bones, hier, fr)
        fwd = M["root"] @ np.array([0, 0, 1.0]); fwd -= up * fwd.dot(up); fwd /= np.linalg.norm(fwd)
        left = np.cross(up, fwd)
        if (P["lhipjoint"] - P["rhipjoint"]).dot(left) < 0: left = -left
        r = {}
        for s, side in (("l", "L"), ("r", "R")):
            out_dir = left if s == "l" else -left
            thigh = P[f"{s}femur"] - P[f"{s}hipjoint"]; shank = P[f"{s}tibia"] - P[f"{s}femur"]; foot = P[f"{s}foot"] - P[f"{s}tibia"]
            r[f"hip_flex.{side}"] = math.degrees(math.atan2(thigh.dot(fwd), -thigh.dot(up)))
            r[f"hip_abd.{side}"] = math.degrees(math.atan2(thigh.dot(out_dir), -thigh.dot(up)))
            r[f"knee_flex.{side}"] = ang(thigh, shank)
            r[f"ankle_dorsi.{side}"] = ang(shank, foot) - a0[s]
            upper = P[f"{s}humerus"] - P[f"{s}clavicle"]; fore = P[f"{s}radius"] - P[f"{s}humerus"]
            r[f"shoulder_flex.{side}"] = math.degrees(math.atan2(upper.dot(fwd), -upper.dot(up)))
            r[f"elbow_flex.{side}"] = ang(upper, fore)
        out.append(r); roots.append(P["root"])
    bob = np.array([float(p[1]) for p in roots])
    return out, bob - bob.mean(), up


def cycle(sig, fps, lo_s, hi_s):
    """Periode (frame) dari autokorelasi; awal di puncak fleksi lutut pertama."""
    x = np.array(sig) - np.mean(sig)
    ac = np.correlate(x, x, "full")[len(x) - 1:]
    lo, hi = int(lo_s * fps), min(int(hi_s * fps), len(x) - 1)
    period = lo + int(np.argmax(ac[lo:hi]))
    start = int(np.argmax(x[: period]))
    return start, period


def refine_period(A, start, period, keys):
    """Periode ±3 frame dengan lompatan sambungan loop terkecil (jumlah |sudut akhir − awal|)."""
    best = min((p for p in range(period - 3, period + 4) if start + p < len(A)),
               key=lambda p: sum(abs(A[start + p][k] - A[start][k]) for k in keys))
    return best


# ── terapkan ke rig ─────────────────────────────────────────────────────────
arm = bpy.data.objects["RIG.ADULT_MALE"]; P = arm.pose.bones
if arm.animation_data and arm.animation_data.action:  # klip ROM yang sudah ada tetap disimpan bersama klip gait
    arm.animation_data.action.name = "ROM"; arm.animation_data.action.use_fake_user = True
sg = lambda b, mov: 1 if LIM[b]["positive_X"] == mov else -1
def zsign(b):  # abduksi = sisi batas Z yang lebih besar
    lo, hi = LIM[b]["Z"]; return 1 if hi >= -lo else -1
CLAMP = {"hip_flex": (-30, 120), "hip_abd": (-30, 45), "knee_flex": (0, 135), "ankle_dorsi": (-50, 20),
         "shoulder_flex": (-60, 180), "elbow_flex": (0, 150)}
seg = ROM["segments_mm"]
leg_rig = (seg["THIGH.L"] + seg["SHIN.L"]) / 1000.0
report = {"source": "CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu)",
          "acknowledgement": "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.",
          "truth_class": "measured motion of another individual (CMU subject), retargeted and ROM-clamped; not patient biomechanics",
          "clips": {}}
for name, subj, trial in CLIPS:
    bones, hier, scale = parse_asf(os.path.join(SRC, f"{subj}.asf"))
    frames = parse_amc(os.path.join(SRC, f"{trial}.amc"))
    A, bob, _ = angles(bones, hier, frames)
    unit_m = (1.0 / scale) * 0.0254  # ASF: length × (1/scale) = inci
    leg_src = (bones["lfemur"]["len"] + bones["ltibia"]["len"]) * unit_m
    k = [r["knee_flex.R"] for r in A]
    lo_s, hi_s = (0.8, 1.6) if name == "WALK" else (0.5, 1.0)
    start, period = cycle(k, 120, lo_s, hi_s)
    period = refine_period(A, start, period, [f"{key}.{s}" for key in CLAMP for s in "LR"])
    n_out = int(round(period / 120 * FPS_OUT))
    idx = [start + i * period / n_out for i in range(n_out + 1)]  # titik akhir = awal siklus berikutnya (loop mulus)
    def raw(key, t):
        i0 = int(math.floor(t)); f = t - i0; i1 = min(i0 + 1, len(A) - 1)
        return A[i0][key] * (1 - f) + A[i1][key] * f
    # koreksi drift loop: selisih akhir−awal siklus disebar linear sepanjang siklus → sambungan loop persis 0
    drift = {f"{key}.{s}": raw(f"{key}.{s}", idx[-1]) - raw(f"{key}.{s}", idx[0]) for key in CLAMP for s in "LR"}
    def sample(key, t):
        return raw(key, t) - drift[key] * (t - idx[0]) / (idx[-1] - idx[0])
    act = bpy.data.actions.new(name); arm.animation_data_create(); arm.animation_data.action = act
    for pb in P:
        pb.rotation_mode = 'XYZ'
    clamped = {}
    base_z = arm.location.z; bobs = []
    for j, t in enumerate(idx):
        fr = j  # frame 0 → waktu glTF 0; kunci terakhir = pose awal pada t = siklus (loop tanpa jeda)
        for side in ("L", "R"):
            vals = {}
            for key in CLAMP:
                v = sample(f"{key}.{side}", t); lo, hi = CLAMP[key]
                if v < lo or v > hi: clamped[f"{key}.{side}"] = clamped.get(f"{key}.{side}", 0) + 1
                vals[key] = min(max(v, lo), hi)
            def setb(b, x=0.0, z=0.0):
                P[b].rotation_euler = (math.radians(x), 0, math.radians(z)); P[b].keyframe_insert("rotation_euler", frame=fr)
            setb(f"THIGH.{side}", sg(f"THIGH.{side}", "flexion") * vals["hip_flex"], zsign(f"THIGH.{side}") * vals["hip_abd"])
            setb(f"SHIN.{side}", sg(f"SHIN.{side}", "flexion") * vals["knee_flex"])
            setb(f"FOOT.{side}", sg(f"FOOT.{side}", "extension") * vals["ankle_dorsi"])  # FOOT: ekstensi = dorsofleksi
            setb(f"UPPER_ARM.{side}", sg(f"UPPER_ARM.{side}", "flexion") * vals["shoulder_flex"])
            setb(f"FOREARM.{side}", sg(f"FOREARM.{side}", "flexion") * vals["elbow_flex"])
        bobs.append(float(np.interp(t, np.arange(len(bob)), bob)) * unit_m * (leg_rig / leg_src))
    # kontak lantai: tinggi kaki terendah per frame pada pelvis dasar
    sc = bpy.context.scene; sc.frame_start, sc.frame_end = 0, len(idx) - 1; sc.render.fps = FPS_OUT
    feet = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent_bone and o.parent_bone.startswith("FOOT.")]
    def lowest_now():
        dg = bpy.context.evaluated_depsgraph_get(); low = math.inf
        for o in feet:
            vs = o.evaluated_get(dg).data.vertices; M = o.matrix_world
            for i in range(0, len(vs), 7): low = min(low, (M @ vs[i].co).z)
        return low
    base_low = []
    for fr in range(0, len(idx)):
        sc.frame_set(fr); base_low.append(lowest_now())
    if name == "WALK":  # selalu ada kaki menumpu: pelvis diturunkan/dinaikkan agar kaki terendah tepat di lantai
        zs = [-l for l in base_low]
    else:  # lari punya fase melayang: naik-turun dari mocap (dikoreksi drift seperti sudut), digeser agar titik terendah siklus di lantai
        n1 = len(bobs) - 1; bobs = [b - (bobs[-1] - bobs[0]) * k / n1 for k, b in enumerate(bobs)]
        c = -min(l + b for l, b in zip(base_low, bobs)); zs = [b + c for b in bobs]
    for fr, z in enumerate(zs, start=0):
        arm.location.z = base_z + z; arm.keyframe_insert("location", index=2, frame=fr)
    arm.location.z = base_z
    # ── QA siklus ini ───────────────────────────────────────────────────────
    lowest = []
    for fr in range(0, len(idx)):
        sc.frame_set(fr); lowest.append(lowest_now())
    rngs = {key: [round(min(r[f"{key}.{s}"] for r in A[start:start + period + 1] for s in "LR"), 1),
                  round(max(r[f"{key}.{s}"] for r in A[start:start + period + 1] for s in "LR"), 1)] for key in CLAMP}
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from rig_contact_qa import sweep
    contact = sweep(sc, list(range(0, len(idx), 2)), lambda at: name.lower())
    loop_err = max(abs(sample(f"{key}.{s}", idx[0]) - sample(f"{key}.{s}", idx[-1])) for key in CLAMP for s in "LR")
    drift_max = max(abs(v) for v in drift.values())
    report["clips"][name] = {
        "subject": subj, "trial": trial, "source_fps": 120, "cycle_start_frame": start, "cycle_frames_120fps": period,
        "cycle_s": round(period / 120, 3), "frames_24fps": len(idx), "keys_start_at_s": 0.0, "loop_seam_max_deg": round(loop_err, 2),
        "loop_drift_corrected_max_deg": round(drift_max, 2),
        "joint_angle_range_deg": rngs, "clamped_samples": clamped,
        "leg_length_m": {"rig": round(leg_rig, 3), "source": round(leg_src, 3)},
        "lowest_foot_point_m": {"min": round(min(lowest), 4), "max": round(max(lowest), 4)},
        "max_bone_penetration_mm": max(c["max_penetration_mm"] for c in contact), "bone_contact": contact}
    # rentang frame manual (bukan dari handle Bezier) & interpolasi linear: sampel 24 fps rapat, tanpa overshoot
    act.use_frame_range = True; act.frame_start, act.frame_end = 0, len(idx) - 1
    fcs = act.fcurves if hasattr(act, "fcurves") else [fc for l in act.layers for st in l.strips for cb in st.channelbags for fc in cb.fcurves]
    for fc in fcs:
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    print("GAIT", name, json.dumps({k: v for k, v in report["clips"][name].items() if k != "bone_contact"}))
    act.use_fake_user = True
arm.animation_data.action = None
bpy.ops.wm.save_as_mainfile(filepath=OUT)
json.dump(report, open(REPORT, "w"), indent=1)
