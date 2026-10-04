"""Langkah 1 (headless, di Startup.blend Z-Anatomy): inventaris mesh + ekstraksi struktur yang belum ada di master.

  Blender -b sources/zanatomy/Z-Anatomy/Startup.blend -P pipeline/extract_zanatomy.py
Membutuhkan /tmp/master_raw_names.json (nama sumber yang sudah ada di master, ditulis dari master).
Menulis /tmp/zanatomy_inventory.json dan sources/zanatomy/za_extra.blend (mesh dievaluasi: modifier diterapkan, koordinat dunia).
"""
import bpy, json, mathutils, re


def inventory():
    out=[]
    for o in bpy.data.objects:
        if o.type!='MESH' or not o.data.vertices: continue
        bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
        out.append({"name":o.name,"verts":len(o.data.vertices),"coll":[c.name for c in o.users_collection][:2],
          "min":[round(min(b[i] for b in bb),4) for i in range(3)],"max":[round(max(b[i] for b in bb),4) for i in range(3)],
          "hidden":o.hide_render})
    json.dump(out,open('/tmp/zanatomy_inventory.json','w'))
    print("N",len(out))


inventory()
inv=json.load(open('/tmp/zanatomy_inventory.json'))
have=set(json.load(open('/tmp/master_raw_names.json')))
want={x["name"] for x in inv if x["verts"]>2 and re.sub(r"\.\d{3}$","",x["name"]) not in have and x["coll"]
      and x["coll"][0] in ("1: Skeletal system","2: Muscular insertions","3: Joints","4: Muscular system","5: Cardiovascular system","6: Lymphoid organs","7: Nervous system & Sense organs","8: Visceral systems")}
dg=bpy.context.evaluated_depsgraph_get()
out=bpy.data.collections.new("ZA_EXTRA")
made=0; skipped=[]
for name in sorted(want):
    o=bpy.data.objects.get(name)
    if not o or o.type!='MESH': skipped.append(name); continue
    try:
        me=bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False)
    except Exception as e:
        skipped.append(name); continue
    if len(me.vertices)<3: skipped.append(name); continue
    me.transform(o.matrix_world)
    if o.matrix_world.determinant()<0: me.flip_normals()
    n=bpy.data.objects.new("ZA::"+name, me)
    n["za_raw_name"]=name
    n["za_collection"]=[c.name for c in o.users_collection][0] if o.users_collection else ""
    top=[x for x in inv if x["name"]==name][0]["coll"]
    n["za_top"]=top[0]; n["za_sub"]=top[1] if len(top)>1 else ""
    n["za_material"]=o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else ""
    out.objects.link(n); made+=1
# keep only extracted data in a fresh file
for ob in list(bpy.data.objects):
    if not ob.name.startswith("ZA::"): bpy.data.objects.remove(ob, do_unlink=True)
for c in list(bpy.data.collections):
    if c.name!="ZA_EXTRA": bpy.data.collections.remove(c)
bpy.context.scene.collection.children.link(out)
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath="/Users/rizkyazhar/Documents/Panaceamed.id/bodyexposure/sources/zanatomy/za_extra.blend")
print("MADE",made,"SKIPPED",len(skipped),skipped[:10])
