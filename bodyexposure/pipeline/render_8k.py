"""Render 8K (7680×4320) dari proksi render 2M: dua tampilan anterior berdampingan.

  Blender -b bodies/PANACEA_RENDER_2M_ADULT_MALE.blend -P bodyexposure/pipeline/render_8k.py -- \
      --out bodyexposure/renders/adult_male_8k_7680x4320.png [--samples 128] [--pct 100]

Kiri : kulit tembus pandang (alpha 0,08); otot, fasia, perlekatan disembunyikan → rangka, organ, pembuluh, saraf.
Kanan: lapisan otot (kulit & fasia disembunyikan) — salinan instans objek, tidak menduplikasi mesh.
"""
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT, SAMPLES, PCT = os.path.abspath(arg("--out")), int(arg("--samples", "128")), int(arg("--pct", "100"))
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
sysof = lambda o: o.get("panacea_system", "")
ATTACH = ("ORIGIN", "INSERTION")

# kolom kiri: lapisan dalam
left = bpy.data.collections.new("VIEW.DEEP"); right = bpy.data.collections.new("VIEW.MUSCLE")
sc.collection.children.link(left); sc.collection.children.link(right)
h = max((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
DX = 0.95  # jarak antar tampilan (m)
ghost = {}


def ghost_mat(m):
    if m.name not in ghost:
        g = m.copy(); b = next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Alpha'].default_value = 0.08; b.inputs['Subsurface Weight'].default_value = 0
        ghost[m.name] = g
    return ghost[m.name]


for o in meshes:
    s = sysof(o); name = o.name.upper()
    deep_vis = s not in ("muscular", "fascia") and not any(k in name for k in ATTACH) and "HAIR" not in name
    musc_vis = s in ("muscular", "skeletal", "joint") and not any(k in name for k in ATTACH)
    if deep_vis:
        d = o.copy(); left.objects.link(d); d.location.x -= DX / 2
        if s == "surface":
            for sl in d.material_slots:
                m = sl.material  # ambil sebelum slot dialihkan ke objek (slot objek awalnya kosong)
                if m: sl.link = 'OBJECT'; sl.material = ghost_mat(m)
    if musc_vis:
        r = o.copy(); right.objects.link(r); r.location.x += DX / 2
    for c in list(o.users_collection):
        c.objects.unlink(o)

# dunia, cahaya, kamera
w = bpy.data.worlds.new("W8K"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.008, 0.009, 0.012, 1)
cz = h * 0.5
for name, loc, e, size in (("KEY", (-2.2, -3.2, 2.6), 1400, 2.5), ("FILL", (2.6, -2.4, 1.4), 600, 3), ("RIM", (0.5, 3.2, 2.2), 900, 2)):
    d = bpy.data.lights.new(name, 'AREA'); d.size = size; d.energy = e
    L = bpy.data.objects.new(name, d); L.location = loc; sc.collection.objects.link(L)
    L.rotation_euler = (Vector((0, 0, cz)) - L.location).to_track_quat('-Z', 'Y').to_euler()
cd = bpy.data.cameras.new("CAM8K"); cd.lens = 85; cd.sensor_width = 36
cam = bpy.data.objects.new("CAM8K", cd); sc.collection.objects.link(cam)
span_h = h * 1.06; dist = span_h / 2 / math.tan(math.atan(cd.sensor_width * 9 / 16 / 2 / cd.lens))
cam.location = (0, -dist, cz); cam.rotation_euler = (math.radians(90), 0, 0); sc.camera = cam

r = sc.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y, r.resolution_percentage = 7680, 4320, PCT
try:
    p = bpy.context.preferences.addons['cycles'].preferences; p.compute_device_type = 'METAL'; p.refresh_devices()
    for dv in p.devices: dv.use = dv.type != 'CPU'
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.cycles.samples = SAMPLES; sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -1.2
r.image_settings.file_format = 'PNG'; r.image_settings.color_depth = '16'; r.filepath = OUT
bpy.ops.render.render(write_still=True)
print("WROTE", OUT, r.resolution_x * PCT // 100, r.resolution_y * PCT // 100)
