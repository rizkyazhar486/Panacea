"""Proksi render 2M: salinan tubuh dengan budget ~2.000.000 segitiga, Smart UV, material PBR prosedural.

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v011.blend -P bodyexposure/pipeline/build_render_proxy.py -- \
      --body HUMAN.ADULT.MALE --budget 2000000 --out bodies/PANACEA_RENDER_2M_ADULT_MALE.blend --report <json>

Master tidak diubah (hasil disimpan ke berkas lain). Desimasi: lod_budget.allocate (lantai 60 segitiga per struktur,
sisa ∝ luas permukaan), edge non-manifold dipisah dulu. Galat bentuk diukur per struktur (jarak verteks asli → permukaan
proksi). Material: PBR prosedural yang diturunkan dari geometri — variasi albedo & roughness (noise ruang objek), bump
mikro, penggelapan rongga dari pointiness geometri (Cycles). Tidak menambah detail anatomi (serat, pori, pola) yang
tidak ada di sumber; resolusinya tak bergantung tekstur sehingga tetap tajam di render 8K.
"""
import bpy, json, os, sys
from mathutils.bvhtree import BVHTree
import bmesh

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lod_budget import tri_count, allocate, split_nonmanifold, escapes_bbox, fix_escapes

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
BODY, BUDGET, FLOOR = arg("--body"), int(arg("--budget", "2000000")), 60
OUT, REPORT = os.path.abspath(arg("--out")), arg("--report")

for lc in bpy.context.view_layer.layer_collection.children:
    lc.exclude = False
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.get("panacea_body_id") == BODY]
keep = {o.name for o in objs}
for o in list(bpy.data.objects):  # hanya tubuh ini (tanpa tubuh lain, jangkar, kamera lama)
    if o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
unsplit = {}
for o in objs:
    o.hide_set(False); o.hide_viewport = False; o.hide_render = False
    o.data = o.data.copy()  # salinan; berkas keluaran tidak berbagi mesh dengan master
    orig = split_nonmanifold(o)
    if orig is not None:
        unsplit[o.name] = orig

src_tris = sum(tri_count(o.data) for o in objs)
ratios = allocate(objs, BUDGET, FLOOR)
dg = bpy.context.evaluated_depsgraph_get()
for attempt in range(3):
    mods = []
    for o in objs:
        if ratios[o.name] < 0.999:
            m = o.modifiers.new("PAN_LOD", 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = ratios[o.name]; mods.append((o, m))
    bpy.context.view_layer.update(); dg.update()
    got = sum(len(o.evaluated_get(dg).data.polygons) for o in objs)
    if got <= BUDGET or attempt == 2:
        break
    for o, m in mods: o.modifiers.remove(m)
    ratios = {n: v * BUDGET / got * 0.98 for n, v in ratios.items()}

# pengaman: verteks yang lolos bbox asli (sampai "meledak" pada mesh non-manifold yang dipisah) diperbaiki bertahap
reverted = fix_escapes(objs, dg, unsplit)
bad = [o.name for o in objs if escapes_bbox(o, dg)]
if bad:
    raise SystemExit(f"bbox escape remains after fix: {bad[:5]}")

# galat bentuk: verteks asli → permukaan proksi (sampel ≤ 300 verteks per struktur)
errs = []
for o in objs:
    me = o.evaluated_get(dg).to_mesh(); bm = bmesh.new(); bm.from_mesh(me)
    tree = BVHTree.FromBMesh(bm); bm.free(); o.evaluated_get(dg).to_mesh_clear()
    vs = o.data.vertices; step = max(1, len(vs) // 300)
    ds = [tree.find_nearest(vs[i].co)[3] for i in range(0, len(vs), step)]
    ds = [d for d in ds if d is not None]
    if ds: errs.append((o.name, sum(ds) / len(ds), max(ds)))
for o in objs:  # terapkan desimasi
    bpy.context.view_layer.objects.active = o
    if any(m.name == "PAN_LOD" for m in o.modifiers):
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier="PAN_LOD")
out_tris = sum(tri_count(o.data) for o in objs)

# Smart UV (semua struktur sekaligus, edit multi-objek)
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=0.003, area_weight=0.0, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
uv_ok = sum(1 for o in objs if o.data.uv_layers)

# PBR prosedural: detail berbasis geometri, skala noise per jenis jaringan (m⁻¹, ruang objek)
DETAIL = {"PAN_Bone": (900, 0.06, 0.35), "PAN_Skin": (1400, 0.05, 0.20), "PAN_SkinInner": (1400, 0.05, 0.2), "PAN_Muscle": (700, 0.08, 0.25),
          "PAN_Cartilage": (500, 0.04, 0.12), "PAN_Ligament": (800, 0.05, 0.2), "PAN_Tendon": (800, 0.05, 0.2)}


def pbr(mat):
    nt = mat.node_tree; b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    if any(n.name == "PAN_PBR" for n in nt.nodes):
        return
    scale, var, bump = DETAIL.get(mat.name, (600, 0.05, 0.15))
    base = tuple(b.inputs['Base Color'].default_value)
    tc = nt.nodes.new('ShaderNodeTexCoord'); tc.name = "PAN_PBR"
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    # albedo: base ±var lewat ramp noise
    ramp = nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].color = tuple(c * (1 - var) for c in base[:3]) + (1,)
    ramp.color_ramp.elements[1].color = tuple(min(1, c * (1 + var)) for c in base[:3]) + (1,)
    # rongga dari pointiness geometri (Cycles): cekungan sedikit lebih gelap
    geo = nt.nodes.new('ShaderNodeNewGeometry'); cav = nt.nodes.new('ShaderNodeValToRGB')
    cav.color_ramp.elements[0].position = 0.45; cav.color_ramp.elements[0].color = (0.82, 0.82, 0.82, 1)
    cav.color_ramp.elements[1].position = 0.55; cav.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(geo.outputs['Pointiness'], cav.inputs['Fac'])
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
    nt.links.new(ramp.outputs['Color'], mul.inputs['A']); nt.links.new(cav.outputs['Color'], mul.inputs['B'])
    nt.links.new(mul.outputs['Result'], b.inputs['Base Color'])
    # roughness ±0.06 dan bump mikro
    r0 = b.inputs['Roughness'].default_value
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = max(0, r0 - 0.06); rr.inputs['To Max'].default_value = min(1, r0 + 0.06)
    nt.links.new(nz.outputs['Fac'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.0004
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    mat["panacea_material_note"] = "Procedural appearance derived from geometry (object-space noise, cavity from pointiness); not measured tissue texture."


mats = {s.material for o in objs for s in o.material_slots if s.material}
for m in mats:
    pbr(m)

for c in list(bpy.data.collections):
    if not c.all_objects:
        bpy.data.collections.remove(c)
bpy.ops.outliner.orphans_purge(do_recursive=True)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
errs.sort(key=lambda e: -e[2])
rep = {"body": BODY, "budget_tris": BUDGET, "floor_tris": FLOOR, "source_tris": src_tris, "proxy_tris": out_tris,
       "structures": len(objs), "uv_mapped_structures": uv_ok, "materials_upgraded": len(mats),
       "reverted_after_bbox_escape": reverted,
       "error_mm": {"median_of_means": round(sorted(e[1] for e in errs)[len(errs) // 2] * 1000, 3),
                    "p95_of_max": round(sorted(e[2] for e in errs)[int(len(errs) * 0.95)] * 1000, 3),
                    "worst": [[n, round(a * 1000, 2), round(b * 1000, 2)] for n, a, b in errs[:10]]}}
json.dump(rep, open(REPORT, "w"), indent=1)
print("PROXY", json.dumps({k: rep[k] for k in ("source_tris", "proxy_tris", "structures", "uv_mapped_structures", "materials_upgraded")}), rep["error_mm"]["median_of_means"], rep["error_mm"]["p95_of_max"])
