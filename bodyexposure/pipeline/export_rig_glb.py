"""Ekspor kerangka beranimasi (rig + klip ROM) ke GLB web.

  Blender -b bodies/PANACEA_RIG_ADULT_MALE_ROM.blend -P bodyexposure/pipeline/export_rig_glb.py -- \
      --out <raw>/adult_male.rig_rom.glb --timeline bodyexposure/qa_reports/rig_rom_animation.json \
      --timeline-out public/bodyexposure/adult_male.rig_rom.json [--budget 34000]

Mesh rangka & sendi tetap terikat kaku ke tulang rig (anak node joint di glTF). Desimasi memakai lod_budget
(lantai 8 segitiga, sisa ∝ luas, gerbang bbox: tak ada verteks lolos > max(3 mm, 5 % diagonal)). Animasi diekspor
sebagai satu klip "ROM" (rotasi tulang, 24 fps). Berkas sumber tidak disimpan ulang.
"""
import bpy, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lod_budget import tri_count, allocate, split_nonmanifold, escapes_bbox, fix_escapes

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT, BUDGET = os.path.abspath(arg("--out")), int(arg("--budget", "34000"))
arm = bpy.data.objects["RIG.ADULT_MALE"]
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    o.hide_set(False); o.hide_viewport = False
dg = bpy.context.evaluated_depsgraph_get()
unsplit = {}
for o in meshes:
    orig = split_nonmanifold(o)
    if orig is not None:
        unsplit[o.name] = orig
r = allocate(meshes, BUDGET, 8)
for _ in range(5):
    for o in meshes:
        m = o.modifiers.get("PAN_LOD") or o.modifiers.new("PAN_LOD", 'DECIMATE')
        m.decimate_type = 'COLLAPSE'; m.ratio = r[o.name]
    bpy.context.scene.frame_set(1); bpy.context.view_layer.update(); dg.update()
    fixed = {n for n, _ in fix_escapes(meshes, dg, unsplit)}
    tri = {o.name: len(o.evaluated_get(dg).data.polygons) for o in meshes}
    r = {o.name: (o.modifiers["PAN_LOD"].ratio if o.modifiers.get("PAN_LOD") else 1.0) for o in meshes}
    got = sum(tri.values())
    if got <= BUDGET:
        break
    locked = fixed | {n for n, v in r.items() if v >= 1.0}
    free_t = got - sum(tri[n] for n in locked)
    if free_t <= 0:
        break
    scale = max(0.05, (BUDGET - sum(tri[n] for n in locked)) / free_t) * 0.97
    r = {n: (v if n in locked else v * scale) for n, v in r.items()}
bad = [o.name for o in meshes if escapes_bbox(o, dg)]
if bad:
    raise SystemExit(f"bbox escape: {bad[:5]}")

if arm.animation_data and arm.animation_data.action and "ROM" not in bpy.data.actions:
    arm.animation_data.action.name = "ROM"
GAIT = json.load(open(arg("--gait"))) if arg("--gait") else None
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sc = bpy.context.scene
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_extras=True,
                          export_yup=True, export_texcoords=False, export_normals=True, export_animations=True,
                          export_frame_range=False, export_force_sampling=True, export_animation_mode='ACTIONS', export_skins=False, export_materials='EXPORT')
tl = json.load(open(arg("--timeline")))
# kunci glTF dari Blender: frame f → waktu f/fps (frame 1 = 1/24 s); timeline memakai skala yang sama, durasi = frames/fps
clips = [{"clip": "ROM", "label_short": "Range of motion", "fps": tl["fps"], "frames": tl["frames"] + 1,
          "source": "AAOS normal range of motion (Greene & Heckman 1994)", "truth_class": "simulated",
          "label": "Range-of-motion demonstration from AAOS normal limits (educational simulation, not measured motion)",
          "movements": [{"name": t["movement"], "start_s": round(t["frames"][0] / tl["fps"], 6), "end_s": round(t["frames"][2] / tl["fps"], 6), "note": t["note"]} for t in tl["timeline"]],
          "qa": {"angle_within_limits": tl["angle_within_limits"], "max_bone_penetration_mm": max(c["max_penetration_mm"] for c in tl["bone_contact_overlap"])}}]
if GAIT:
    for name, short, verb in (("WALK", "Walk", "walking"), ("RUN", "Run", "running")):
        g = GAIT["clips"].get(name)
        if not g:
            continue
        n = g["frames_24fps"]  # kunci di frame 0 … n−1 → waktu 0 … (n−1)/24 = satu siklus; kunci terakhir = pose awal
        clips.append({"clip": name, "label_short": short, "fps": 24, "frames": n, "source": GAIT["source"],
                      "acknowledgement": GAIT["acknowledgement"], "truth_class": "measured-retargeted",
                      "label": f"Recorded {verb} of another person (CMU subject {g['subject']}, trial {g['trial']}), retargeted to this skeleton and clamped to AAOS limits; treadmill-style, not patient biomechanics",
                      "movements": [{"name": f"{verb} cycle", "start_s": 0.0, "end_s": round((n - 1) / 24, 6), "note": f"one gait cycle, {g['cycle_s']} s"}],
                      "qa": {"max_bone_penetration_mm": g["max_bone_penetration_mm"], "lowest_foot_point_m": g["lowest_foot_point_m"], "loop_drift_corrected_max_deg": g["loop_drift_corrected_max_deg"]}})
json.dump({"clips": clips}, open(arg("--timeline-out"), "w"), indent=1)
print("RIGGLB", OUT, "tris", got, "meshes", len(meshes), "fixed", len(fixed), os.path.getsize(OUT))
