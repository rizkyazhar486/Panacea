"""Render kerja (QA) satu berkas tubuh: kulit tembus pandang, tampak anterior + lateral, resolusi rendah.

  Blender -b bodyexposure/bodies/PANACEA_BODY_<ID>.blend -P bodyexposure/pipeline/render_body_file.py -- --out <png>
"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[argv.index("--out") + 1]
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
for o in meshes:
    if o.get("panacea_system") == "surface":
        for s in o.material_slots:
            if s.material:
                m = s.material.copy(); s.material = m
                b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                b.inputs['Alpha'].default_value = 0.08; b.inputs['Subsurface Weight'].default_value = 0
    if o.get("panacea_system") == "muscular":
        o.hide_render = True  # satu mesh otot ICRP menutup seluruh isi tubuh
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
h = max(p.z for p in pts); cz = h / 2
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.01, 0.012, 0.016, 1)
for name, loc, e in (("key", (-2, -3, 3), 900), ("fill", (3, -2, 1.5), 400), ("rim", (1, 3, 2), 500)):
    d = bpy.data.lights.new(name, 'AREA'); d.size = 2; d.energy = e * h / 1.7
    L = bpy.data.objects.new(name, d); L.location = Vector(loc) * h; sc.collection.objects.link(L)
    L.rotation_euler = (Vector((0, 0, cz)) - L.location).to_track_quat('-Z', 'Y').to_euler()
cams = []
for i, (dx, dy) in enumerate(((-0.55, -1), (0.55, 0))):  # anterior & lateral kiri
    d = bpy.data.cameras.new(f"c{i}"); d.type = 'ORTHO'; d.ortho_scale = h * 1.08
    c = bpy.data.objects.new(f"c{i}", d); sc.collection.objects.link(c); cams.append(c)
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
try:
    p = bpy.context.preferences.addons['cycles'].preferences; p.compute_device_type = 'METAL'; p.refresh_devices()
    for dv in p.devices: dv.use = dv.type != 'CPU'
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -2.5
sc.render.resolution_x, sc.render.resolution_y = 800, 900
import os
paths = []
for i, (c, view) in enumerate(zip(cams, ("anterior", "lateral"))):
    c.location = (0, -5 * h, cz) if view == "anterior" else (5 * h, 0, cz)
    c.rotation_euler = (Vector((0, 0, cz)) - c.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = c
    sc.render.filepath = out.replace(".png", f"_{view}.png"); bpy.ops.render.render(write_still=True); paths.append(sc.render.filepath)
print("WROTE", paths)
