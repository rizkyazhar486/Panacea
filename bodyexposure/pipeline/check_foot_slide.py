"""Selip kaki klip WALK/RUN dari mesh rig di Blender (heel & toe sebagai penanda kaku pada tulang kaki).

  Blender -b bodies/PANACEA_RIG_ADULT_MALE_GAIT.blend -P bodyexposure/pipeline/check_foot_slide.py -- --out bodyexposure/qa_reports/gait_foot_slide.json

Klip berjalan di tempat. Selip diukur terhadap kecepatan akar maju v yang SEHARUSNYA dipakai pemutar: untuk setiap kaki, penanda (tumit = titik
paling belakang, jari = titik paling depan pada mesh kaki saat istirahat) dianggap menapak bila tingginya < 15 mm di atas lantai pada klip.
Posisi anterior-posterior penanda relatif panggul selama satu fase tumpu didekati garis lurus x(t) = x0 − v·t; v dicari kuadrat-terkecil
dari SEMUA fase tumpu klip (satu v bersama), dan selip = simpangan sisa (RMS dan maksimum, mm) dari garis itu. Tanpa tulang tumit/jari tersendiri, kaki
berguling hanya lewat tulang pergelangan, jadi penanda tumit/jari yang kaku melebih-lebihkan guling; angka ini batas atas selip, bukan selip sebenarnya.
"""
import bpy, json, sys, numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[argv.index("--out") + 1]
arm = bpy.data.objects["RIG.ADULT_MALE"]; sc = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
FOOT_SKEL = "ADULT.MALE.SKELETAL."
res = {"method": __doc__.strip().splitlines()[0], "clips": {}}
for clip in ("WALK", "RUN"):
    act = bpy.data.actions.get(clip)
    if not act:
        continue
    arm.animation_data.action = act
    f0, f1 = int(round(act.frame_range[0])), int(round(act.frame_range[1]))
    # penanda dari mesh kaki pada frame pertama (pose awal klip): tumit = y maksimum posterior (+Y = posterior), jari = y minimum
    markers = {}
    sc.frame_set(f0); dg.update()
    for side in "LR":
        meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent_bone == f"FOOT.{side}"]
        pts = [(o, v.index, (o.matrix_world @ v.co)) for o in meshes for v in o.data.vertices]
        heel = max(pts, key=lambda t: t[2].y); toe = min(pts, key=lambda t: t[2].y)
        markers[side] = {"heel": (heel[0], heel[1]), "toe": (toe[0], toe[1])}
    traj = {(s, k): [] for s in "LR" for k in ("heel", "toe")}; pel = []
    for f in range(f0, f1 + 1):
        sc.frame_set(f); dg.update()
        pel.append(np.array((arm.matrix_world @ arm.pose.bones["PELVIS"].head)[:]))
        for s in "LR":
            for k, (o, i) in markers[s].items():
                oe = o.evaluated_get(dg); traj[(s, k)].append(np.array((oe.matrix_world @ oe.data.vertices[i].co)[:]))
    pel = np.array(pel); times = np.arange(f0, f1 + 1) / 24.0
    out = {}
    for k in ("heel", "toe"):
        rows_t, rows_x, groups = [], [], []
        for s in "LR":
            P = np.array(traj[(s, k)]); h = P[:, 2] - min(P[:, 2].min(), 0.0)  # tinggi di atas titik terendah penanda sendiri
            low = h < 0.015
            # fase tumpu = runtun frame berurutan dengan low
            i = 0
            while i < len(low):
                if low[i]:
                    j = i
                    while j + 1 < len(low) and low[j + 1]: j += 1
                    if j - i >= 2:  # ≥ 3 frame
                        rel = P[i:j + 1, 1] - pel[i:j + 1, 1]  # anterior-posterior relatif panggul (m)
                        groups.append((s, times[i:j + 1], rel)); 
                    i = j + 1
                else:
                    i += 1
        if not groups:
            out[k] = {"stance_phases": 0}; continue
        # satu v bersama: x_g(t) = c_g − v t → v = −Σ cov(t, x)/Σ var(t)
        num = sum(((t - t.mean()) * (x - x.mean())).sum() for _, t, x in groups); den = sum(((t - t.mean()) ** 2).sum() for _, t, _ in groups)
        v = -num / den
        resid = np.concatenate([x - (x.mean() - v * (t - t.mean())) for _, t, x in groups])
        out[k] = {"stance_phases": len(groups), "stance_frames": int(sum(len(t) for _, t, _ in groups)), "common_forward_speed_m_s": round(abs(float(v)), 3),  # +Y = posterior: tumpu bergerak ke posterior relatif panggul, jadi v < 0 = maju; dilaporkan sebagai besaran
                  
                  "slide_rms_mm": round(float(np.sqrt((resid ** 2).mean())) * 1000, 1), "slide_max_mm": round(float(np.abs(resid).max()) * 1000, 1)}
    res["clips"][clip] = out
    print("FOOTSLIDE", clip, json.dumps(out))
json.dump(res, open(OUT, "w"), indent=1)
