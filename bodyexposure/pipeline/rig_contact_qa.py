"""QA kontak tulang untuk animasi rig (dipakai animate_rom.py & retarget_cmu_gait.py).

Penetrasi = kedalaman maksimum verteks tulang A di dalam permukaan tulang B, dua arah. "Di dalam" ditentukan dengan
paritas 3 sinar (mayoritas), bukan normal terdekat: pada tulang pipih (skapula) titik yang menembus sampai sisi seberang
punya normal terdekat yang menghadap keluar. Semua verteks A di dalam bbox B diuji (yang terbenam penuh ikut terhitung).
Pasangan yang objeknya tidak ada = kesalahan QA (SystemExit), bukan dilewati.
"""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

S = "ADULT.MALE.SKELETAL."
PAIRS = [("FEMUR", "TIBIA"), ("HUMERUS", "ULNA"), ("HUMERUS", "RADIUS"), ("FEMUR", "HIP_BONE"), ("HUMERUS", "SCAPULA"),
         ("HUMERUS", "CLAVICLE"), ("RADIUS", "ULNA"), ("TIBIA", "TALUS"), ("FIBULA", "TALUS"),
         ("RADIUS", "LUNATE_BONE"), ("RADIUS", "SCAPHOID_BONE"), ("ULNA", "LUNATE_BONE"), ("ULNA", "TRIQUETRUM_BONE")]
DIRS = [Vector((1, 0.013, 0.007)).normalized(), Vector((-0.011, 1, 0.017)).normalized(), Vector((0.009, -0.015, -1)).normalized()]


def _world(name):
    o = bpy.data.objects[name]; dg = bpy.context.evaluated_depsgraph_get(); M = o.matrix_world
    me = o.evaluated_get(dg).data
    return [M @ v.co for v in me.vertices], [p.vertices[:] for p in me.polygons]


def inside(tb, p):
    votes = 0
    for d in DIRS:
        q, k = p.copy(), 0
        for _ in range(64):
            h = tb.ray_cast(q, d)
            if h[0] is None: break
            k += 1; q = h[0] + d * 1e-5
        votes += k % 2
    return votes >= 2


def depth(a, b):
    Va, _ = _world(a); Vb, Fb = _world(b); tb = BVHTree.FromPolygons(Vb, Fb)
    lo = [min(v[i] for v in Vb) for i in range(3)]; hi = [max(v[i] for v in Vb) for i in range(3)]
    worst = 0.0
    for p in Va:
        if all(lo[i] <= p[i] <= hi[i] for i in range(3)) and inside(tb, p):
            worst = max(worst, tb.find_nearest(p)[3])
    return worst


def sweep(scene, frames, label_of=lambda f: ""):
    """Penetrasi maksimum per pasangan (kedua sisi, dua arah) atas daftar frame."""
    out = []
    for side in ("L", "R"):
        for a0, b0 in PAIRS:
            a, b = f"{S}{a0}.{side}", f"{S}{b0}.{side}"
            missing = [n for n in (a, b) if n not in bpy.data.objects]
            if missing:
                raise SystemExit(f"contact pair object missing: {missing}")
            worst, at = 0.0, frames[0]
            for f in frames:
                scene.frame_set(f); d = max(depth(a, b), depth(b, a))
                if d > worst: worst, at = d, f
            out.append({"pair": [f"{a0}.{side}", f"{b0}.{side}"], "max_penetration_mm": round(worst * 1000, 2), "at_frame": at, "movement": label_of(at)})
    return out
