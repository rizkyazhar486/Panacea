"""Penyempurnaan pusat engsel siku, pergelangan kaki & pergelangan tangan berbasis kesesuaian permukaan tulang (geometri sumber).

  Blender -b bodyexposure/PANACEA_HUMAN_MASTER_v011.blend -P bodyexposure/pipeline/fit_hinge_centres.py -- \
      --rig bodyexposure/manifest/rig_adult_male.json --out bodyexposure/manifest/rig_hinge_refinement.json

Pusat ISB (titik tengah epikondilus / maleolus) adalah pendekatan untuk sistem koordinat; engsel fungsional melalui
pusat troklea–kapitulum (siku) dan talus (talokrural). Di sini pusat engsel digeser hanya di bidang ⟂ sumbu fleksi
(sumbu tetap garis epikondilus/maleolus), dalam kisi ±12 mm per arah (≤ 17 mm total) langkah 2 mm, untuk meminimalkan penetrasi maksimum tulang
anak ke tulang induk di sepanjang rentang ROM AAOS. Hasil (pergeseran mm, penetrasi sebelum/sesudah) dibaca build_rig.py.
"""
import bpy, json, math, sys
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:]
arg = lambda k: argv[argv.index(k) + 1]
RIG = json.load(open(arg("--rig"))); OUT = arg("--out")
LOWER_LIMB = "--profile" in argv and argv[argv.index("--profile") + 1] == "lower_limb"  # tungkai bawah perempuan (Denver)
S = "VHF_LOWER_LIMB.ADULT.FEMALE.SKELETAL." if LOWER_LIMB else "ADULT.MALE.SKELETAL."
HINGES_LL = {"ANKLE": (["TIBIA", "FIBULA"], ["TALUS"], (-20, 50), "TOE_END", "inferior")}  # hanya pergelangan kaki: lutut/panggul tanpa penetrasi
HINGES = HINGES_LL if LOWER_LIMB else {  # kunci: (tulang induk, tulang anak, rentang sudut [deg] dalam arah anatomis, titik distal untuk tanda)
    "ELBOW": (["HUMERUS"], ["ULNA", "RADIUS"], (0, 150), "WRIST", "anterior"),     # fleksi: tangan ke anterior
    "ANKLE": (["TIBIA", "FIBULA"], ["TALUS"], (-20, 50), "TOE_END", "inferior"),   # plantar fleksi (+): jari ke inferior
    # pergelangan: baris karpal proksimal terhadap radius & ulna; fleksi (+) = tangan ke anterior (telapak menghadap depan)
    "WRIST": (["RADIUS", "ULNA"], ["SCAPHOID_BONE", "LUNATE_BONE", "TRIQUETRUM_BONE"], (-70, 80), "HAND_END", "anterior"),
}
JC = {k: np.array(v) for k, v in RIG["joint_centres_m"].items()}


def mesh_world(name):
    o = bpy.data.objects[name]; M = o.matrix_world
    return np.array([(M @ v.co)[:] for v in o.data.vertices]), [p.vertices[:] for p in o.data.polygons]


def rot(axis, deg):
    return np.array(Matrix.Rotation(math.radians(deg), 3, Vector(axis.tolist())))


res = {}
for side in ("L", "R"):
    for key, (parents, children, (a0, a1), distal, direction) in HINGES.items():
        c0 = JC[f"{key}.{side}"]
        # sumbu: garis epikondilus/maleolus dari manifest rig (titik medial/lateral tidak disimpan → arah dari X lokal)
        ax = np.array(RIG["flexion_axes"][f"{key}.{side}"])
        trees = []
        for pn in parents:
            V, F = mesh_world(f"{S}{pn}.{side}"); trees.append(BVHTree.FromPolygons([Vector(v) for v in V], F))
        child = np.vstack([mesh_world(f"{S}{cn}.{side}")[0] for cn in children])
        child = child[np.linspace(0, len(child) - 1, min(4000, len(child))).astype(int)]
        # tanda: rotasi positif yang membawa titik distal ke arah anatomis
        d = JC[f"{distal}.{side}"] - c0
        moved = rot(ax, 10) @ d
        sgn = 1 if ((moved - d)[1] < 0 if direction == "anterior" else (moved - d)[2] < 0) else -1
        angles = np.linspace(a0, a1, 8)
        # basis bidang ⟂ sumbu
        u = np.cross(ax, [0, 0, 1.0]); u = u / np.linalg.norm(u); w = np.cross(ax, u)

        def max_pen(c):
            worst = 0.0
            for ang in angles:
                R = rot(ax, sgn * ang); P = (child - c) @ R.T + c
                for t in trees:
                    for p in P:
                        loc, nor, _, dist = t.find_nearest(Vector(p))
                        if loc is not None and (Vector(p) - loc).dot(nor) < 0 and dist > worst:
                            worst = dist
            return worst

        base = max_pen(c0); best = (base, 0.0, c0)
        for du in np.arange(-0.012, 0.0121, 0.002):
            for dw in np.arange(-0.012, 0.0121, 0.002):
                c = c0 + du * u + dw * w
                m = max_pen(c)
                shift = math.hypot(du, dw)
                if m < best[0] - 1e-5 or (abs(m - best[0]) <= 1e-5 and shift < best[1]):
                    best = (m, shift, c)
        res[f"{key}.{side}"] = {"isb_centre_m": c0.round(4).tolist(), "refined_centre_m": best[2].round(4).tolist(),
                                "shift_mm": round(best[1] * 1000, 1), "max_penetration_mm_isb": round(base * 1000, 2),
                                "max_penetration_mm_refined": round(best[0] * 1000, 2), "range_deg": [a0, a1]}
        print("HINGE", key, side, res[f"{key}.{side}"])
json.dump({"method": __doc__.strip().splitlines()[0], "hinges": res}, open(OUT, "w"), indent=1)
