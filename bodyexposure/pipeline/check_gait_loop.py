"""Uji kontinuitas loop WALK/RUN langsung dari GLB terbit (bukan dari sumber Blender).

  npx gltfpack -i public/bodyexposure/adult_male.rig_rom.glb -o /tmp/gait_decoded.glb -noq   # buka kompresi meshopt
  python3 bodyexposure/pipeline/check_gait_loop.py /tmp/gait_decoded.glb --out bodyexposure/qa_reports/gait_loop_continuity.json

Metrik per klip (kuaternion lokal tiap tulang, translasi akar):
  seam_deg          = 2·acos(clamp(|q_awal·q_akhir|, 0, 1)) antara kunci pertama dan terakhir
  omega_jump_deg_s  = |ω_akhir − ω_awal|: kecepatan sudut sebelum titik sambung (kunci n−2→n−1) dibanding sesudahnya (0→1),
                      vektor ω = 2·log(q₂·q₁⁻¹)/Δt pada kerangka induk; endpoint sama TIDAK menjamin kecepatan sama
  root_drift_m      = |p_akhir − p_awal| translasi akar; root_vel_jump_m_s = lompatan kecepatan akar di sambungan
  ankle_stance      = EKSPERIMENTAL: kecepatan anterior-posterior pergelangan kaki yang dekat lantai relatif panggul (tumpu dihampiri
                      dari tinggi pergelangan; rig tak punya tulang tumit/jari). Selip kaki sebenarnya TIDAK TERVERIFIKASI: klip berjalan di tempat
Mengulang tiga siklus tidak diperlukan terpisah: sambungan dinilai pada nilai dan turunan pertama.
"""
import json, struct, sys, math
import numpy as np

path = sys.argv[1]
out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
b = open(path, "rb").read()
n = struct.unpack("<I", b[12:16])[0]; J = json.loads(b[20:20 + n]); off = 20 + n + 8
BIN = b[off:off + struct.unpack("<I", b[20 + n:24 + n])[0]]
CT = {5126: ("f4", 1.0), 5122: ("i2", 32767.0), 5123: ("u2", 65535.0), 5120: ("i1", 127.0), 5121: ("u1", 255.0)}
NC = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}


def acc(i):
    a = J["accessors"][i]; bv = J["bufferViews"][a["bufferView"]]; dt, sc = CT[a["componentType"]]
    k = NC[a["type"]]; o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    arr = np.frombuffer(BIN, dtype="<" + dt, count=a["count"] * k, offset=o).reshape(a["count"], k).astype(float)
    return arr / sc if a.get("normalized") else arr


nodes = J["nodes"]; parent = {}
for i, nd in enumerate(nodes):
    for c in nd.get("children", []): parent[c] = i
name_of = {i: nd.get("name", "") for i, nd in enumerate(nodes)}
idx = {nm: i for i, nm in name_of.items() if nm}


def qmul(a, b_):
    w1, x1, y1, z1 = a[3], a[0], a[1], a[2]; w2, x2, y2, z2 = b_[3], b_[0], b_[1], b_[2]
    return np.array([x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2, y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2,
                     z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2, w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2])


def qinv(q): return np.array([-q[0], -q[1], -q[2], q[3]])
def qn(q): return q / np.linalg.norm(q)


def qlog_vec(q):  # rotasi sebagai vektor sumbu-sudut (rad), bahu terpendek
    q = qn(q)
    if q[3] < 0: q = -q
    s = np.linalg.norm(q[:3])
    return np.zeros(3) if s < 1e-12 else q[:3] / s * 2 * math.atan2(s, q[3])


def qrot(q, v):
    q = qn(q); u = q[:3]; w = q[3]
    return v + 2 * np.cross(u, np.cross(u, v) + w * v)


report = {"source": path, "clips": {}}
start_pose = {}
for anim in J["animations"]:
    if anim["name"] not in ("WALK", "RUN", "ROM"): continue
    rot, trans = {}, {}
    for ch in anim["channels"]:
        s = anim["samplers"][ch["sampler"]]; t = acc(s["input"])[:, 0]; v = acc(s["output"])
        (rot if ch["target"]["path"] == "rotation" else trans)[ch["target"]["node"]] = (t, v)
    start_pose[anim["name"]] = {name_of[nd]: qn(q[0]) for nd, (t, q) in rot.items()}
    if anim["name"] == "ROM": continue  # ROM hanya dipakai sebagai pose awal (istirahat) untuk matriks transisi
    seams, jumps, interior = {}, {}, {}
    animated = {nd: tq for nd, tq in rot.items() if len(tq[0]) >= 3}  # kanal 1 kunci = tulang diam (konstan)
    for nd, (t, q) in animated.items():
        q = np.array([qn(x) for x in q]); d = abs(float(np.dot(q[0], q[-1])))
        seams[name_of[nd]] = math.degrees(2 * math.acos(min(1.0, d)))
        w_end = qlog_vec(qmul(q[-1], qinv(q[-2]))) / (t[-1] - t[-2])
        w_start = qlog_vec(qmul(q[1], qinv(q[0]))) / (t[1] - t[0])
        jumps[name_of[nd]] = math.degrees(float(np.linalg.norm(w_end - w_start)))
        # skala pembanding: perubahan ω antar-interval di dalam klip (bukan di sambungan). Lonjakan di sambungan yang tidak
        # melebihi sebaran interior = turunan sambungan sama mulusnya dengan bagian lain klip
        w = [qlog_vec(qmul(q[i + 1], qinv(q[i]))) / (t[i + 1] - t[i]) for i in range(len(t) - 1)]
        inner = [math.degrees(float(np.linalg.norm(w[i + 1] - w[i]))) for i in range(len(w) - 1)]
        interior[name_of[nd]] = (float(np.percentile(inner, 95)), float(np.max(inner)))
    dur = max(t[-1] for t, _ in animated.values())
    res = {"duration_s": round(float(dur), 4), "keys": int(len(next(iter(animated.values()))[0])), "rotation_channels": len(rot), "animated_rotation_channels": len(animated),
           "max_seam_deg": round(max(seams.values()), 4), "worst_seam_bone": max(seams, key=seams.get),
           "max_omega_jump_deg_s": round(max(jumps.values()), 1), "worst_omega_jump_bone": max(jumps, key=jumps.get),
           "median_omega_jump_deg_s": round(float(np.median(list(jumps.values()))), 1),
           "seam_jump_over_interior_p95": {k: round(jumps[k] / interior[k][0], 2) for k in jumps},
           "seam_jump_over_interior_max": {k: round(jumps[k] / interior[k][1], 2) for k in jumps}}
    res["bones_seam_jump_above_interior_max"] = [k for k in jumps if jumps[k] > interior[k][1]]
    # typical angular speed for scale: median over bones of the mean |ω| inside the clip
    sp = []
    for nd, (t, q) in animated.items():
        q = np.array([qn(x) for x in q])
        sp.append(np.mean([np.linalg.norm(qlog_vec(qmul(q[i + 1], qinv(q[i])))) / (t[i + 1] - t[i]) for i in range(len(t) - 1)]))
    res["median_mean_angular_speed_deg_s"] = round(math.degrees(float(np.median(sp))), 1)
    for nd, (t, p) in trans.items():
        v_end = (p[-1] - p[-2]) / (t[-1] - t[-2]); v_start = (p[1] - p[0]) / (t[1] - t[0])
        res.setdefault("translation", {})[name_of[nd]] = {"drift_m": round(float(np.linalg.norm(p[-1] - p[0])), 5),
                                                         "vel_jump_m_s": round(float(np.linalg.norm(v_end - v_start)), 4),
                                                         "range_m": [round(float(x), 4) for x in (p.max(0) - p.min(0))]}
    # kerangka maju (FK) pada tiap kunci: pergelangan kaki L/R
    times = next(iter(animated.values()))[0]
    def local(nd, k):
        t_, r_ = rot.get(nd, (None, None)); q = qn(r_[k]) if r_ is not None else np.array(nodes[nd].get("rotation", [0, 0, 0, 1]))
        tp = trans.get(nd); p = tp[1][k] if tp else np.array(nodes[nd].get("translation", [0, 0, 0]))
        return p, q
    def world(nd, k):
        p, q = local(nd, k)
        if nd not in parent: return p, q
        pp, pq = world(parent[nd], k)
        return pp + qrot(pq, p), qmul(pq, q)
    pel = idx["PELVIS"]; feet = {s: idx[f"FOOT.{s}"] for s in "LR"}
    ank = {s: np.array([world(feet[s], k)[0] for k in range(len(times))]) for s in "LR"}  # pangkal tulang kaki = pergelangan
    pel_p = np.array([world(pel, k)[0] for k in range(len(times))])
    rel = {s: ank[s] - pel_p for s in "LR"}  # relatif panggul; sumbu glTF: +Z anterior, +Y superior
    # tumpu = pergelangan kaki dalam 50 mm di atas titik terendahnya sendiri pada klip (tumit–telapak masih dekat lantai);
    # kecepatan anterior-posterior relatif panggul pada interval yang kedua ujungnya tumpu
    stance_v = []
    for sd in "LR":
        h = ank[sd][:, 1]; on = h < h.min() + 0.05
        for k in range(len(times) - 1):
            if on[k] and on[k + 1]:
                stance_v.append(float((rel[sd][k + 1, 2] - rel[sd][k, 2]) / (times[k + 1] - times[k])))
    sv = np.array(stance_v)
    res["ankle_stance"] = {"intervals": int(len(sv)), "mean_ap_velocity_m_s": round(float(sv.mean()), 3),
                           "cv": round(float(sv.std() / abs(sv.mean())), 3) if len(sv) > 1 and abs(sv.mean()) > 1e-6 else None,
                           "p10_p90_m_s": [round(float(np.percentile(sv, 10)), 2), round(float(np.percentile(sv, 90)), 2)],
                           "note": "EXPERIMENTAL. In-place clip: a supporting ankle moves backward relative to the pelvis, so foot sliding can only be judged against a root speed that the viewer does not yet apply. Stance is approximated by ankle height (no toe or heel bone), which also admits swing intervals in WALK; read the RUN figure with care and treat WALK as not verified"}
    report["clips"][anim["name"]] = res
# lonjakan pose saat pemain berpindah klip (pemain sekarang memotong keras: stopAllAction lalu play)
def pose_jump(a, b):
    ang = {k: math.degrees(2 * math.acos(min(1.0, abs(float(np.dot(a[k], b[k])))))) for k in a if k in b}
    w = max(ang, key=ang.get); return {"max_deg": round(ang[w], 1), "worst_bone": w}
report["transition_pose_jump"] = {f"{x}->{y}": pose_jump(start_pose[x], start_pose[y]) for x in start_pose for y in start_pose if x != y}
report["transition_note"] = "pose jump between the first keys of two clips; the viewer currently cuts between clips without a crossfade, so this is the visible pop at a switch"
txt = json.dumps(report, indent=1)
print(txt)
if out: open(out, "w").write(txt + "\n")
