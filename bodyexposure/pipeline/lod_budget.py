"""Alat bersama untuk desimasi berbasis budget segitiga (LOD4 web dan proksi render 2M)."""
import bmesh


def tri_count(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


def allocate(objs, budget, floor):
    """Rasio desimasi per struktur: lantai + sisa ∝ luas permukaan, dibatasi jumlah aslinya."""
    area = {o.name: max(sum(p.area for p in o.data.polygons), 1e-9) for o in objs}
    tris = {o.name: tri_count(o.data) for o in objs}
    alloc = {n: min(tris[n], floor) for n in tris}
    free = budget - sum(alloc.values())
    for _ in range(6):  # distribusikan ulang kelebihan dari struktur yang sudah mentok jumlah aslinya
        open_ = [n for n in tris if alloc[n] < tris[n]]
        tot = sum(area[n] for n in open_)
        if free <= 0 or not open_:
            break
        used = 0
        for n in open_:
            new = min(tris[n], alloc[n] + free * area[n] / tot); used += new - alloc[n]; alloc[n] = new
        free -= used
    return {n: alloc[n] / max(tris[n], 1) for n in tris}


def split_nonmanifold(o):
    """Edge non-manifold (>2 face) mengunci decimate collapse; pisahkan pada SALINAN mesh (posisi verteks identik).
    Mengembalikan mesh asli bila ditukar (pemanggil memulihkannya), atau None."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    nm = [e for e in bm.edges if len(e.link_faces) > 2]
    orig = None
    if nm:
        bmesh.ops.split_edges(bm, edges=nm); me = o.data.copy(); bm.to_mesh(me); orig = o.data; o.data = me
    bm.free()
    return orig


def escape_mm(o, dg):
    """Jarak terjauh (m) verteks hasil evaluasi di luar bbox mesh asli, dan diagonal bbox asli (m)."""
    vs = o.data.vertices
    if not vs:
        return 0.0, 0.0
    lo = [min(v.co[i] for v in vs) for i in range(3)]; hi = [max(v.co[i] for v in vs) for i in range(3)]
    diag = sum((hi[i] - lo[i]) ** 2 for i in range(3)) ** 0.5
    esc = max([max(lo[i] - v.co[i], v.co[i] - hi[i], 0.0) for v in o.evaluated_get(dg).data.vertices for i in range(3)] or [0.0])
    return esc, diag


def escapes_bbox(o, dg):
    """Verteks hasil desimasi keluar dari bbox asli lebih dari max(3 mm, 5 % diagonal) — penempatan verteks
    kolaps pada tabung tipis wajar bergeser beberapa mm, tetapi lebih dari itu (sampai 'meledak') ditolak."""
    esc, diag = escape_mm(o, dg)
    return esc > max(0.003, 0.05 * diag)


def fix_escapes(objs, dg, unsplit, mod_name="PAN_LOD"):
    """Perbaiki struktur yang lolos bbox: rasio ×2 (maks 3×) → mesh tanpa pemisahan non-manifold → tanpa desimasi.
    unsplit: {nama: mesh asli} dari split_nonmanifold. Mengembalikan [(nama, langkah)] yang diperbaiki."""
    import bpy
    fixed = []
    for o in objs:
        m = o.modifiers.get(mod_name)
        if m is None or not escapes_bbox(o, dg):
            continue
        step = None
        for k in range(3):
            m.ratio = min(1.0, m.ratio * 2); bpy.context.view_layer.update(); dg.update()
            if not escapes_bbox(o, dg):
                step = f"ratio x{2 ** (k + 1)}"; break
        if step is None and o.name in unsplit:
            o.data = unsplit.pop(o.name); bpy.context.view_layer.update(); dg.update()
            if not escapes_bbox(o, dg):
                step = "unsplit mesh"
        if step is None:
            o.modifiers.remove(m); bpy.context.view_layer.update(); dg.update(); step = "not decimated"
        fixed.append((o.name, step))
    return fixed
