"""Render lineup semua tubuh kanonik (milestone gate) — 5K default.

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v008.blend -P bodyexposure/pipeline/render_lineup.py -- \
      --out bodyexposure/renders/milestone_lineup_5120x2880.png [--pct 100] [--samples 256]

Tubuh pediatrik ditautkan di master sebagai instans koleksi; untuk render mereka di-append ke memori
(tidak disimpan) agar material bisa dibuat tembus pandang. Bahasa visual seragam untuk semua tubuh:
kulit tembus pandang, otot disembunyikan (otot ICRP adalah satu blok jaringan), rangka + organ + pembuluh.
Urutan kiri→kanan: neonatus, bayi, anak 5 th, anak 10 th, remaja, dewasa perempuan, dewasa laki-laki.
"""
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
arg = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
OUT = arg("--out", "bodyexposure/renders/milestone_lineup_5120x2880.png")
PCT, SAMPLES = int(arg("--pct", "100")), int(arg("--samples", "256"))
SEX = arg("--sex", "FEMALE")  # varian pediatrik yang dibariskan
sc = bpy.context.scene
ROOT = os.path.dirname(bpy.data.filepath)

# 1. append tubuh pediatrik (varian SEX) dan sembunyikan instans tertaut
order = ["NEONATE", "INFANT", "CHILD_5Y", "CHILD_10Y", "ADOLESCENT"]
x = -3.9
placed = []
for stage in order:
    bid = f"PEDIATRIC.{stage}.{SEX}"
    root = bpy.data.objects.get(bid + ".ROOT")
    path = os.path.join(ROOT, root["panacea_body_file"])
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.collections = [bid]
    c = dst.collections[0]; c.name = bid + ".RENDER"
    sc.collection.children.link(c)
    width = max((o.matrix_world @ Vector(k)).x for o in c.objects for k in o.bound_box) - min((o.matrix_world @ Vector(k)).x for o in c.objects for k in o.bound_box)
    x += width / 2 + 0.22
    for o in c.objects:
        o.location.x += x
    placed.append((bid, x)); x += width / 2 + 0.22
for e in [o for o in sc.objects if o.type == 'EMPTY' and o.instance_type == 'COLLECTION']:
    e.hide_render = True
# dewasa: perempuan lalu laki-laki, di kanan barisan pediatrik
fem_root = bpy.data.objects.get("HUMAN.ADULT.FEMALE.ROOT")
if fem_root:
    fem_root.location.x = x + 0.55; x = fem_root.location.x + 0.55
male_shift = x + 0.45
for o in sc.objects:
    if o.type == 'MESH' and o.get("panacea_body_id") == "HUMAN.ADULT.MALE" and o.parent is None:
        o.location.x += male_shift
    if o.type == 'EMPTY' and o.name.startswith("ANCHOR."):
        o.hide_render = True

# 2. bahasa visual seragam
ghost_cache = {}


def ghost(o, alpha):
    for s in o.material_slots:
        m = s.material
        if not m:
            continue
        g = ghost_cache.get(m.name)
        if g is None:
            g = m.copy(); b = next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            b.inputs['Alpha'].default_value = alpha; b.inputs['Subsurface Weight'].default_value = 0
            b.inputs['Coat Weight'].default_value = 0; b.inputs['Base Color'].default_value = (0.74, 0.62, 0.54, 1)
            ghost_cache[m.name] = g
        s.link = 'OBJECT'; s.material = g


for o in sc.objects:
    if o.type != 'MESH':
        continue
    sysn = o.get("panacea_system", "")
    if not o.get("panacea_body_id") or o.get("panacea_body_id", "").startswith("MODULE"):
        o.hide_render = True; continue
    if sysn in ("muscular", "fascia", "lymphatic") or "HAIR" in o.name or "YAO" in o.name:
        o.hide_render = True
    elif sysn == "surface":
        ghost(o, 0.07)
    elif any(k in o.name for k in ("PLEURA", "OMENTUM", "MESOCOLON", "PERITONEUM", "PERICARDIUM", "MAMMARY_FAT", "ADIPOSE")):
        ghost(o, 0.15)

# 3. kamera & cahaya
bpy.context.view_layer.update()  # matriks dunia harus dihitung ulang setelah lokasi digeser
vis = [o for o in sc.objects if o.type == 'MESH' and not o.hide_render]
pts = [o.matrix_world @ Vector(k) for o in vis for k in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
ctr = (lo + hi) / 2
cam_d = bpy.data.cameras.new("CAM.MILESTONE.LINEUP"); cam_d.lens = 85; cam_d.sensor_width = 36
cam = bpy.data.objects.new("CAM.MILESTONE.LINEUP", cam_d); sc.collection.objects.link(cam)
span = (hi.x - lo.x) * 1.10
dist = span / 2 / math.tan(math.atan(18 / 85))
cam.location = (ctr.x, -dist, ctr.z * 0.95); cam.rotation_euler = (Vector((ctr.x, 0, ctr.z * 0.95)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
for L in [o for o in sc.objects if o.type == 'LIGHT']:
    L.location.x += ctr.x
    L.data.energy *= 2.2  # area cahaya disebar ke barisan yang lebih lebar
r = sc.render
r.resolution_x, r.resolution_y, r.resolution_percentage = 5120, 2880, PCT
try:
    p = bpy.context.preferences.addons['cycles'].preferences; p.compute_device_type = 'METAL'; p.refresh_devices()
    for d in p.devices: d.use = d.type != 'CPU'
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.cycles.samples = SAMPLES; sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
sc.view_settings.exposure = -3.0
r.image_settings.file_format = 'PNG'; r.image_settings.color_depth = '16'
r.filepath = os.path.abspath(OUT)
bpy.ops.render.render(write_still=True)
print("WROTE", r.filepath, [b for b, _ in placed])
