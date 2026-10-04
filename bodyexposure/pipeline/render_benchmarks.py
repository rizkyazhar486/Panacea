"""Render frame benchmark Panacea Body Exposure dari master kanonik.

Jalankan headless (master .blend tidak diubah):
  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v005.blend -P bodyexposure/pipeline/render_benchmarks.py -- \
      --bench layered|cutaway|exploded|female_layered|lineup --pct 100 --out bodyexposure/renders

Visibilitas, transparansi dan perpindahan hanya diterapkan di memori per benchmark.
Kerangka koordinat (warisan Z-Anatomy / BodyParts3D, juga dipakai VH_Female):
+Z superior, +X kiri subjek, -Y anterior, 1 BU = 1 m.
"""
import bpy, sys, mathutils, argparse, os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--bench", default="layered")
ap.add_argument("--pct", type=int, default=100)
ap.add_argument("--samples", type=int, default=256)
ap.add_argument("--out", default="bodyexposure/renders")
ap.add_argument("--exposure", type=float, default=-3.0)
ap.add_argument("--skin", type=float, default=0.06)
ap.add_argument("--camera", default="")
ap.add_argument("--tag", default="")
a = ap.parse_args(argv)

sc = bpy.context.scene
try:  # preferensi GPU ada di user prefs, bukan di .blend
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.refresh_devices()
    for d in prefs.devices:
        d.use = d.type != 'CPU'
    sc.cycles.device = 'GPU'
except Exception as e:
    print("GPU gagal, pakai CPU:", e)

meshes = [o for o in sc.objects if o.type == 'MESH']
MALE, FEMALE = "HUMAN.ADULT.MALE", "HUMAN.ADULT.FEMALE"
SEROSA = ("PLEURA", "OMENTUM", "MESOCOLON", "MESO_APPENDIX", "PERITONEUM", "MESENTERY")


def body(o):
    return o.get("panacea_body_id", "")


def system(o):
    return o.get("panacea_system", "")


def lat(o):
    return o.get("panacea_laterality", "")


def show(o, v):
    o.hide_render = not v


def ghost(objs, alpha, tint=None):
    """Override tembus pandang khusus render: satu material bayangan per material sumber."""
    cache = {}
    for o in objs:
        for s in o.material_slots:
            m = s.material
            if not m:
                continue
            g = cache.get(m.name)
            if g is None:
                g = m.copy(); g.name = m.name + "__GHOST"
                b = next(n for n in g.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
                b.inputs['Alpha'].default_value = alpha
                b.inputs['Subsurface Weight'].default_value = 0.0
                b.inputs['Coat Weight'].default_value = 0.0
                if tint:
                    b.inputs['Base Color'].default_value = (*tint, 1)
                cache[m.name] = g
            s.link = 'OBJECT'
            s.material = g


def world_centroid(o):
    return o.matrix_world @ (sum((mathutils.Vector(c) for c in o.bound_box), mathutils.Vector()) / 8)


def male_layered(objs):
    # Kulit regional tembus pandang, otot hanya sisi kiri subjek, sisi kanan dibuka sampai
    # rangka + pembuluh + saraf + visera toraks/abdomen.
    for o in objs:
        s = system(o)
        if s in ("muscular", "fascia") and lat(o) in ("right", "unpaired", "midline"):
            show(o, False)
        if s == "lymphatic" or (s == "surface" and "HAIR" in o.name):
            show(o, False)
    vis = [o for o in objs if not o.hide_render]
    ghost([o for o in vis if system(o) == "surface"], a.skin, (0.72, 0.62, 0.55))
    ghost([o for o in vis if system(o) in ("muscular", "fascia")], 0.82)
    ghost([o for o in vis if any(k in o.name for k in SEROSA)], 0.12)
    ghost([o for o in vis if o.name.endswith("PERICARDIUM")], 0.28)


def female_layered(objs):
    # VH_Female tidak punya otot/rangka lengkap: kulit tembus pandang, organ dan pembuluh utuh.
    for o in objs:
        if system(o) == "lymphatic" and "YAO" in o.name:
            show(o, False)  # modul jaringan kelenjar getah bening, bukan posisi anatomi kasar
    vis = [o for o in objs if not o.hide_render]
    ghost([o for o in vis if system(o) == "surface"], a.skin + 0.04, (0.72, 0.62, 0.55))


male = [o for o in meshes if body(o) == MALE]
female = [o for o in meshes if body(o) == FEMALE]
for o in meshes:
    show(o, body(o) in (MALE, FEMALE))  # modul jaringan (21_MICROSCOPY) tidak ikut adegan tubuh

bench = a.bench
if bench == "layered":
    sc.camera = sc.objects["CAM.ANTERIOR_34.R"]
    for o in female:
        show(o, False)
    male_layered(male)

elif bench == "thorax":
    # Toraks dibuka (gaya sternotomi edukatif): dinding dada anterior dilepas — sternum, kartilago
    # kosta, iga, otot dan kulit di depan rongga toraks — sehingga perikardium, jantung dan paru terlihat.
    sc.camera = sc.objects["CAM.DETAIL.THORAX"]
    for o in female:
        show(o, False)
    wall = ("STERNUM", "MANUBRIUM", "XIPHOID", "COSTAL_CARTILAGE", "_RIB", "INTERCOSTAL", "PLEURA")

    def overlaps_chest_front(o):
        bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
        lo = [min(v[k] for v in bb) for k in range(3)]; hi = [max(v[k] for v in bb) for k in range(3)]
        return lo[0] < 0.16 and hi[0] > -0.16 and lo[1] < 0.0 and lo[2] < 1.45 and hi[2] > 1.05

    for o in male:
        s_ = system(o)
        if any(k in o.name for k in wall) and s_ != "respiratory" or "PLEURA" in o.name:
            show(o, False)
        elif s_ in ("muscular", "fascia", "lymphatic") and overlaps_chest_front(o) and "DIAPHRAGM" not in o.name:
            show(o, False)
        elif s_ == "surface" and overlaps_chest_front(o):
            show(o, False)
    vis = [o for o in male if not o.hide_render]
    ghost([o for o in vis if system(o) == "surface"], a.skin, (0.72, 0.62, 0.55))
    ghost([o for o in vis if "LOBE_OF" in o.name and system(o) == "respiratory"], 0.20)
    ghost([o for o in vis if o.name.endswith("PERICARDIUM")], 0.55, (0.86, 0.80, 0.72))
    ghost([o for o in vis if any(k in o.name for k in SEROSA)], 0.10)

elif bench == "female_layered":
    sc.camera = sc.objects["CAM.FEMALE.ANTERIOR_34.R"]
    for o in male:
        show(o, False)
    female_layered(female)

elif bench == "lineup":
    sc.camera = sc.objects["CAM.LINEUP.ANTERIOR"]
    male_layered(male)
    female_layered(female)

elif bench == "cutaway":
    # Kembaran digital potongan, anterior lurus: sisi kiri subjek eksternal (kulit regional),
    # sisi kanan dibuka bertahap: otot lateral, visera medial, rangka/neurovaskular dalam.
    sc.camera = sc.objects["CAM.ANTERIOR"]
    for o in female:
        show(o, False)
    for o in male:
        s, l = system(o), lat(o)
        c = world_centroid(o)
        if s == "surface":
            show(o, (l == "left" or (l in ("unpaired", "midline") and c.x > 0)) and "HAIR" not in o.name)
        elif s in ("muscular", "fascia"):
            show(o, l == "right" and abs(c.x) > 0.17)
        elif s == "lymphatic":
            show(o, False)
        else:
            show(o, c.x < 0.02)

elif bench == "exploded":
    # Perpindahan lapisan yang koheren: P_disp = P0 + d * k, d = sumbu lapisan anatomis.
    sc.camera = sc.objects["CAM.ANTERIOR_34.R"]
    sc.camera.data.lens = 50
    for o in female:
        show(o, False)
    offsets = {"muscular": (0.55, 0, 0), "fascia": (0.55, 0, 0), "cardiovascular": (-0.55, 0, 0),
               "nervous": (-1.10, 0, 0), "sensory": (-1.10, 0, 0), "lymphatic": (1.65, 0, 0)}
    visc = ("respiratory", "digestive", "urinary", "endocrine", "reproductive")
    for o in male:
        s = system(o)
        if s == "surface":
            show(o, False)
        elif s in visc:
            # visera: kolom sendiri di +1.1 m, sedikit dimekarkan dari garis tengah agar organ terpisah
            c = world_centroid(o)
            o.location += mathutils.Vector((1.10 + c.x * 0.5, 0, 0))
        elif s in offsets:
            o.location += mathutils.Vector(offsets[s])

sc.view_settings.exposure = a.exposure
if a.camera:
    sc.camera = sc.objects[a.camera]
r = sc.render
r.resolution_x, r.resolution_y, r.resolution_percentage = 3840, 2160, a.pct
sc.cycles.samples = a.samples
r.image_settings.file_format = 'PNG'
r.image_settings.color_depth = '16'
os.makedirs(a.out, exist_ok=True)
r.filepath = os.path.abspath(os.path.join(a.out, f"bench_{bench}{a.tag}_{3840 * a.pct // 100}x{2160 * a.pct // 100}.png"))
bpy.ops.render.render(write_still=True)
print("WROTE", r.filepath)
