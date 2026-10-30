"""Rig tungkai bawah perempuan (Visible Human Female, Denver): pusat sendi dari geometri sumber, ikatan kaku, batas ROM AAOS.

  Blender -b bodyexposure/bodies/PANACEA_BODY_VHF_LOWER_LIMB_ADULT_FEMALE.blend -P bodyexposure/pipeline/build_rig_lower_limb.py -- \
      --out bodyexposure/bodies/PANACEA_RIG_VHF_LOWER_LIMB.blend --report bodyexposure/manifest/rig_vhf_lower_limb.json

Rig hanya mencakup panggul (tulang pinggul, sakrum, koksiks), paha, tungkai bawah, dan kaki: sumber tidak punya tulang belakang atau
lengan. Pusat sendi memakai definisi ISB (Wu dkk. 2002, J Biomech 35:543) dari geometri, tanpa landmark berlabel:
  panggul         : bola kuadrat-terkecil pada kartilago kaput femur (silang-uji: bola kartilago asetabulum)
  lutut           : titik tengah titik ekstrem medial–lateral femur distal (sumbu PCA; pendekatan epikondilus transversal)
  pergelangan kaki: titik tengah ujung maleolus medial (tibia distal) dan lateral (fibula distal): titik terendah lempeng 8 mm paling medial/lateral
Kartilago artikular mengikuti tulangnya. Ligamen lutut (melintasi sendi) dan otot TIDAK ikut dirig (butuh skinning lunak).
Batas ROM: nilai normal AAOS (Greene & Heckman 1994), berlaku dari pose NETRAL berdiri (bukan dari pose istirahat kadaver telentang, yang
pergelangan kakinya ±38° plantarfleksi); offset istirahat diukur dari geometri rig dan batas lokal digeser sebesar itu. Tanda sumbu ditentukan numerik.
Pusat pergelangan kaki disempurnakan dengan fit kongruensi permukaan (--hinges, fit_hinge_centres.py --profile lower_limb); lutut dan panggul memakai pusat ISB apa adanya.
"""
import bpy, json, math, os, re, sys
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]
REPORT = argv[argv.index("--report") + 1]
BODY = argv[argv.index("--body") + 1] if "--body" in argv else "VHF_LOWER_LIMB.ADULT.FEMALE"  # tubuh gabungan Denver+CT: --body VHF_DENVER_CT.ADULT.FEMALE
B = BODY + "."
S = B + "SKELETAL."
J = B + "JOINT."
SIDES = ("L", "R")
sgn = {"L": 1.0, "R": -1.0}  # +X = kiri subjek; lateral kiri = +X
ob = bpy.data.objects


def verts(name):
    o = ob[name]; M = o.matrix_world
    return np.array([(M @ v.co)[:] for v in o.data.vertices])


def tree(name):
    o = ob[name]; M = o.matrix_world
    return BVHTree.FromPolygons([M @ v.co for v in o.data.vertices], [p.vertices[:] for p in o.data.polygons])


def surf_dist(name, p):
    return tree(name).find_nearest(Vector(p))[3]


def sphere_fit(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]; b = (pts ** 2).sum(1)
    c, *_ = np.linalg.lstsq(A, b, rcond=None); r = math.sqrt(c[3] + (c[:3] ** 2).sum())
    return c[:3], r, float(np.sqrt(np.mean((np.linalg.norm(pts - c[:3], axis=1) - r) ** 2)))


def unit(v):
    return v / np.linalg.norm(v)


jc, meta, AXIS = {}, {}, {}
for s in SIDES:
    c, r, rms = sphere_fit(verts(f"{J}FEMORAL_HEAD_ARTICULAR_CARTILAGE.{s}"))
    jc[f"HIP.{s}"] = c
    ca, ra, rmsa = sphere_fit(verts(f"{J}ACETABULAR_ARTICULAR_CARTILAGE.{s}"))
    meta[f"HIP.{s}"] = {"method": "least-squares sphere fit on femoral-head articular cartilage", "radius_mm": round(r * 1000, 1),
                        "rms_mm": round(rms * 1000, 2), "vertices": int(len(verts(f"{J}FEMORAL_HEAD_ARTICULAR_CARTILAGE.{s}"))),
                        "acetabular_sphere_centre_distance_mm": round(float(np.linalg.norm(ca - c)) * 1000, 1),
                        "acetabular_radius_mm": round(ra * 1000, 1)}
    # femur distal: sumbu medial–lateral = arah varians terbesar pada bidang ⟂ sumbu panjang femur
    F = verts(f"{S}FEMUR.{s}"); dist_pts = F[F[:, 2] < F[:, 2].min() + 0.060]
    u = unit(dist_pts.mean(0) - jc[f"HIP.{s}"])
    Q = dist_pts - dist_pts.mean(0); Q = Q - np.outer(Q @ u, u)
    a = np.linalg.eigh(np.cov(Q.T))[1][:, -1]
    if a[0] * sgn[s] < 0: a = -a  # menunjuk lateral
    proj = dist_pts @ a; pm, pl = dist_pts[proj.argmin()], dist_pts[proj.argmax()]
    jc[f"KNEE.{s}"] = (pm + pl) / 2
    AXIS[f"KNEE.{s}"] = unit(pl - pm)
    meta[f"KNEE.{s}"] = {"method": "midpoint of the medial and lateral extremes of the distal 60 mm of the femur along its principal mediolateral axis",
                         "width_mm": round(float(np.linalg.norm(pl - pm)) * 1000, 1)}
    T, Fb = verts(f"{S}TIBIA.{s}"), verts(f"{S}FIBULA.{s}")
    Td, Fd = T[T[:, 2] < T[:, 2].min() + 0.050], Fb[Fb[:, 2] < Fb[:, 2].min() + 0.050]
    m = Fd.mean(0) - Td.mean(0); m[2] = 0; m = unit(m)  # medial → lateral, horizontal
    # maleolus = titik terendah di lempeng 8 mm paling medial (tibia) / lateral (fibula): sisi medial tibia hampir vertikal,
    # sehingga titik "paling medial" saja tidak menentukan ketinggian
    tm, fl_ = Td @ m, Fd @ m
    slab_m, slab_l = Td[tm < tm.min() + 0.008], Fd[fl_ > fl_.max() - 0.008]
    mm, ml = slab_m[slab_m[:, 2].argmin()], slab_l[slab_l[:, 2].argmin()]
    jc[f"ANKLE.{s}"] = (mm + ml) / 2
    AXIS[f"ANKLE.{s}"] = unit(ml - mm)
    meta[f"ANKLE.{s}"] = {"method": "midpoint of the malleolar tips: lowest point of the most medial 8 mm of the distal tibia and of the most lateral 8 mm of the distal fibula",
                          "intermalleolar_mm": round(float(np.linalg.norm(ml - mm)) * 1000, 1)}
    fv = verts(f"{S}METATARSALS_AND_PHALANGES_COMBINED.{s}")
    jc[f"TOE_END.{s}"] = fv[fv[:, 1].argmin()]; meta[f"TOE_END.{s}"] = {"method": "most anterior vertex of the forefoot mesh"}
# opsional: pusat engsel pergelangan kaki yang disempurnakan (fit_hinge_centres.py --profile lower_limb; geser ⟂ sumbu, ±12 mm per arah)
HINGE_NOTE = None
if "--hinges" in argv:
    ref = json.load(open(argv[argv.index("--hinges") + 1]))["hinges"]
    for k, r in ref.items():
        jc[k] = np.array(r["refined_centre_m"])
        meta[k] = dict(meta[k], refined="surface-congruence hinge fit", shift_mm=r["shift_mm"],
                       max_penetration_mm=[r["max_penetration_mm_isb"], r["max_penetration_mm_refined"]])
    HINGE_NOTE = {k: {"shift_mm": r["shift_mm"], "max_penetration_mm_isb": r["max_penetration_mm_isb"],
                      "max_penetration_mm_refined": r["max_penetration_mm_refined"]} for k, r in ref.items()}
# T-D7-05 (perempuan): sendi MTP. Mesh kaki depan sumber GABUNGAN (metatarsal + falang, satu komponen terhubung), jadi tidak ada
# landmark per-tulang. Bidang MTP = langkah luas penampang di ujung kepala metatarsal -> basis falang proksimal: luas penampang
# per irisan 2 mm turun tajam tepat di sana (kepala metatarsal menggembung, falang lebih ramping). Posisi = irisan dengan selisih
# rerata luas (6 mm sebelum - 6 mm sesudah) terbesar di jendela 55-85% rentang mesh. Ini HEURISTIK TURUNAN (derived), bukan landmark
# berlabel; ketidakpastian diperkirakan beberapa mm dan dilaporkan. Kelas kebenaran: derived.
SLAB = 0.002; MTP_SPLIT = {}


def forefoot_name(s): return f"{S}METATARSALS_AND_PHALANGES_COMBINED.{s}"


def slab_cross_section_area(name, origin, ax):
    """Luas permukaan mesh per irisan SLAB sepanjang ax (proksi luas penampang tulang; pusat segitiga menentukan irisan)."""
    o = ob[name]; M = o.matrix_world; areas = {}
    for p in o.data.polygons:
        v = [M @ o.data.vertices[i].co for i in p.vertices]
        a = sum(0.5 * ((v[i] - v[0]).cross(v[i + 1] - v[0])).length for i in range(1, len(v) - 1))
        c = sum((np.array(x[:]) for x in v), np.zeros(3)) / len(v)
        k = int(math.floor(float((c - origin) @ ax) / SLAB)); areas[k] = areas.get(k, 0.0) + a
    return areas


for s in SIDES:
    P_ = verts(forefoot_name(s)); tip = jc[f"TOE_END.{s}"]
    ax_f = unit(tip - jc[f"ANKLE.{s}"]); t_all = (P_ - jc[f"ANKLE.{s}"]) @ ax_f
    areas = slab_cross_section_area(forefoot_name(s), jc[f"ANKLE.{s}"], ax_f)
    ks = sorted(areas); k0, k1 = ks[0], ks[-1]; span = (k1 - k0 + 1) * SLAB
    win = range(int(k0 + 0.55 * (k1 - k0)), int(k0 + 0.85 * (k1 - k0)) + 1); win_scores = {}
    for k in win:
        before = np.mean([areas.get(j, 0.0) for j in range(k - 3, k)]); after = np.mean([areas.get(j, 0.0) for j in range(k, k + 3)])
        win_scores[k] = before - after
    # titik awal = puncak lokal PERTAMA (dari posterior) yang skornya >= 70% skor tertinggi: penurunan luas kedua, lebih ke anterior,
    # adalah runcingnya ujung falang distal, bukan sendi MTP
    top = max(win_scores.values()); ks_w = sorted(win_scores)
    peaks = [k for i, k in enumerate(ks_w) if win_scores[k] >= 0.7 * top and (i == 0 or win_scores[k] >= win_scores[ks_w[i - 1]]) and (i == len(ks_w) - 1 or win_scores[k] >= win_scores[ks_w[i + 1]])]
    kbest = peaks[0]; t_mtp = kbest * SLAB
    slab = P_[np.abs(t_all - t_mtp) < 0.0015]
    c = slab.mean(0); Q = slab - c; Q = Q - np.outer(Q @ ax_f, ax_f)
    a = np.linalg.eigh(np.cov(Q.T))[1][:, -1]; a = a - ax_f * float(a @ ax_f); a = unit(a)
    if a[0] * sgn[s] < 0: a = -a  # menunjuk lateral (sama dengan lutut)
    jc[f"MTP.{s}"] = c + ax_f * (t_mtp - float((c - jc[f"ANKLE.{s}"]) @ ax_f))  # centroid irisan, digeser ke bidang t_mtp
    AXIS[f"MTP.{s}"] = a
    ratio = float(t_mtp / ((tip - jc[f"ANKLE.{s}"]) @ ax_f))
    meta[f"MTP.{s}"] = {"method": "step in forefoot cross-section area (derived heuristic, not a labelled landmark): largest drop of the 6 mm mean slab area along the ankle->toe axis within 55-85% of the mesh span; centre = centroid of the 3 mm slab at that plane; flexion axis = mediolateral principal axis of that slab",
                        "truth_class": "derived", "plane_from_ankle_mm": round(t_mtp * 1000, 1), "fraction_of_ankle_to_toe_tip": round(ratio, 3),
                        "area_drop_mm2_per_mm": round(float(win_scores[kbest]) * 1e6 / (SLAB * 1000), 1), "mesh_span_from_ankle_mm": [round(k0 * SLAB * 1000), round((k1 + 1) * SLAB * 1000)], "search_window_mm": [round(min(win) * SLAB * 1000), round(max(win) * SLAB * 1000)], "uncertainty_note": "order of several mm; no per-bone landmarks in the combined mesh"}
    MTP_SPLIT[s] = (ax_f, jc[f"ANKLE.{s}"] + ax_f * t_mtp)
    jc[f"TOE_TIP.{s}"] = jc[f"TOE_END.{s}"]; meta[f"TOE_TIP.{s}"] = {"method": "most anterior vertex of the forefoot mesh"}
jc["PELVIS_CENTRE"] = (jc["HIP.L"] + jc["HIP.R"]) / 2; meta["PELVIS_CENTRE"] = {"method": "midpoint of hip joint centres"}
sac = verts(f"{S}SACRUM"); jc["SACRUM_TOP"] = sac[sac[:, 2].argmax()]; meta["SACRUM_TOP"] = {"method": "highest sacral vertex (pelvis bone tail)"}

# ── armature ──────────────────────────────────────────────────────────────────
arm_d = bpy.data.armatures.new("RIG.VHF_LOWER_LIMB"); arm = bpy.data.objects.new("RIG.VHF_LOWER_LIMB", arm_d)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones
ANT = Vector((0, -1, 0))


def bone(name, h, t, parent=None, connect=False):
    b = eb.new(name); b.head = Vector(h.tolist()); b.tail = Vector(t.tolist()); b.align_roll(ANT)
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b


bone("PELVIS", jc["PELVIS_CENTRE"], jc["SACRUM_TOP"])
for s in SIDES:
    bone(f"THIGH.{s}", jc[f"HIP.{s}"], jc[f"KNEE.{s}"], "PELVIS")
    bone(f"SHIN.{s}", jc[f"KNEE.{s}"], jc[f"ANKLE.{s}"], f"THIGH.{s}", connect=True)
    bone(f"FOOT.{s}", jc[f"ANKLE.{s}"], jc[f"TOE_END.{s}"], f"SHIN.{s}", connect=True)
    bone(f"TOE.{s}", jc[f"MTP.{s}"], jc[f"TOE_TIP.{s}"], f"FOOT.{s}", connect=False)  # T-D7-05: sendi MTP (pusat turunan, sedikit di luar garis tulang kaki)
# tulang kaki: arah Y dibuat TEGAK LURUS sumbu pergelangan kaki (vektor ke jari diproyeksikan ke bidang ⟂ sumbu), supaya X lokal = sumbu maleolus yang
# sebenarnya. Tanpa ini X lokal diproyeksikan ⟂ tulang dan menyimpang 36–53° dari garis maleolus: sendi berputar pada sumbu yang salah, sehingga fit engsel
# dan QA kontak tidak sejalan. Panjang tulang tetap; geometri tidak berubah (mesh hanya terikat ke bingkai tulang).
for s in SIDES:
    fb = eb[f"FOOT.{s}"]; ax_ = Vector(AXIS[f"ANKLE.{s}"].tolist()); length_ = (fb.tail - fb.head).length
    y_ = fb.tail - fb.head; y_ = (y_ - ax_ * y_.dot(ax_)).normalized(); fb.tail = fb.head + y_ * length_
# T-D7-05: orientasi istirahat FOOT TIDAK boleh berubah (offset netral ROM dan sudut gait dihitung terhadapnya): arah tetap ke ujung jari,
# hanya dipendekkan sampai proyeksi MTP pada arah itu, supaya gerak kaki/tumit identik dengan rig tanpa sendi jari.
for s in SIDES:
    fb = eb[f"FOOT.{s}"]; y_ = (fb.tail - fb.head).normalized()
    fb.tail = fb.head + y_ * float((Vector(jc[f"MTP.{s}"].tolist()) - fb.head).dot(y_))
axis_dev = {}
for s in SIDES:
    for bn, key in {"SHIN": "KNEE", "FOOT": "ANKLE", "TOE": "MTP"}.items():
        b = eb[f"{bn}.{s}"]; y = (b.tail - b.head).normalized()
        x = Vector(AXIS[f"{key}.{s}"].tolist()); x = (x - y * x.dot(y)).normalized()
        old_x = b.x_axis.copy(); b.align_roll(x.cross(y))
        dev = math.degrees(old_x.angle(b.x_axis)); axis_dev[f"{bn}.{s}"] = round(min(dev, 180 - dev), 1)
bpy.ops.object.mode_set(mode='OBJECT')

# ── T-D7-05: pisahkan mesh kaki depan gabungan di bidang MTP ───────────────────────────────────────────────────
import bmesh


def split_forefoot(s):
    """Potong mesh gabungan di bidang MTP (turunan). Bagian posterior = nama asli (metatarsal); anterior = *_PHALANGEAL_PART (falang).
    Tiap bagian ditutup (tutup datar pada bidang potong) supaya jari yang berputar tidak membuka lubang di sendi."""
    name = forefoot_name(s); o = ob[name]; ax_f, origin = MTP_SPLIT[s]
    inv = o.matrix_world.inverted()
    # bidang dalam ruang objek (matrix_world murni translasi/rotasi tanpa skala non-seragam di sumber ini): ubah titik & normal
    co = inv @ Vector(origin.tolist()); no = (inv.to_3x3() @ Vector(ax_f.tolist())).normalized()
    bm = bmesh.new(); bm.from_mesh(o.data)
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-7, plane_co=co, plane_no=no)
    cut_edges = [g for g in res["geom_cut"] if isinstance(g, bmesh.types.BMEdge)]
    bm.faces.ensure_lookup_table()
    side_of = lambda f: (f.calc_center_median() - co).dot(no)
    parts = {}
    for label, keep_pos in (("post", False), ("ant", True)):
        b2 = bm.copy(); b2.faces.ensure_lookup_table()
        drop = [f for f in b2.faces if (side_of(f) > 0) != keep_pos]
        bmesh.ops.delete(b2, geom=drop, context='FACES')
        b2.verts.ensure_lookup_table(); b2.edges.ensure_lookup_table()
        edge_on_plane = lambda e: all(abs((v.co - co).dot(no)) < 5e-6 for v in e.verts)
        bnd = [e for e in b2.edges if e.is_boundary and edge_on_plane(e)]
        n0 = len(b2.faces)
        if bnd:
            cap = bmesh.ops.holes_fill(b2, edges=bnd, sides=0)["faces"]
            bmesh.ops.triangulate(b2, faces=cap, quad_method='BEAUTY', ngon_method='EAR_CLIP')
        bmesh.ops.recalc_face_normals(b2, faces=b2.faces[:])
        parts[label] = (b2, len(b2.faces) - n0)
    bm.free()
    def put(obj_name, b2, mesh_name):
        me = bpy.data.meshes.new(mesh_name); b2.to_mesh(me); b2.free()
        for m in o.data.materials: me.materials.append(m)
        return me
    me_post = put(name, parts["post"][0], o.data.name + ".post"); me_ant = put(name, parts["ant"][0], o.data.name + ".ant")
    new = bpy.data.objects.new(name.replace("COMBINED.", "COMBINED_PHALANGEAL_PART."), me_ant)
    for k in o.keys():
        try: new[k] = o[k]
        except Exception: pass
    new.matrix_world = o.matrix_world.copy()
    for c in o.users_collection: c.objects.link(new)
    o.data = me_post
    return {"posterior_faces": len(me_post.polygons), "anterior_faces": len(me_ant.polygons), "cap_faces_posterior": parts["post"][1], "cap_faces_anterior": parts["ant"][1],
            "cut_edges": len(cut_edges), "plane_from_ankle_mm": meta[f"MTP.{s}"]["plane_from_ankle_mm"]}


FOREFOOT_SPLIT = {s: split_forefoot(s) for s in SIDES}

# ── ikatan kaku ──────────────────────────────────────────────────────────────
RULES = [
    (r"SKELETAL\.(HIP_BONE_OS_COXAE|SACRUM|COCCYX)|ACETABULAR_ARTICULAR_CARTILAGE", "PELVIS"),
    (r"SKELETAL\.(FEMUR|PATELLA)\.|FEMORAL_HEAD_ARTICULAR|DISTAL_FEMORAL_ARTICULAR|PATELLAR_ARTICULAR", "THIGH"),
    (r"SKELETAL\.(TIBIA|FIBULA)\.|TIBIAL_PLATEAU_ARTICULAR|DISTAL_TIBIAL_ARTICULAR", "SHIN"),
    (r"COMBINED_PHALANGEAL_PART", "TOE"),  # T-D7-05: bagian falang dari mesh kaki depan yang dipisah di bidang MTP
    (r"SKELETAL\.(TALUS|CALCANEUS|CUBOID|NAVICULAR|MEDIAL_CUNEIFORM|INTERMEDIATE_CUNEIFORM|LATERAL_CUNEIFORM|METATARSALS)|TALAR_ARTICULAR", "FOOT"),
]
binding, unbound = {}, []
targets = [o for o in ob if o.type == 'MESH' and o.get("panacea_body_id") == BODY and o.get("panacea_system") in ("skeletal", "joint")]
for o in targets:
    n = o.name; side = n[-1] if n[-2:] in (".L", ".R") else None
    base = next((b for pat, b in RULES if re.search(pat, n)), None)
    if base is None:
        unbound.append(n); continue  # ligamen lutut: melintasi sendi, tidak dirig
    bname = base if base == "PELVIS" else f"{base}.{side}"
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bname; o.matrix_world = mw
    binding.setdefault(bname, []).append(n)

# ── batas ROM (AAOS) dengan tanda sumbu ditentukan numerik ─────────────────────
ROM = {
    "THIGH": {"flexion": 120, "extension": 30, "abduction": 45, "adduction": 30, "internal_rotation": 45, "external_rotation": 45},
    "SHIN": {"flexion": 135, "extension": 0},
    "FOOT": {"flexion": 50, "extension": 20},  # fleksi plantar 50, dorsofleksi 20 (sendi talokrural)
}


def moved(pb, axis, ang, probe):
    M0 = pb.bone.matrix_local
    return np.array((M0 @ Matrix.Rotation(math.radians(ang), 4, axis) @ probe)[:])


def rest_offsets(side):
    """Pose istirahat rig (kadaver telentang) terhadap berdiri netral, diukur dari geometri rig, dalam derajat anatomis: panggul fleksi/abduksi,
    lutut fleksi, pergelangan kaki dorsofleksi (negatif = fleksi plantar). Kerangka dunia: +Z atas, −Y anterior, +X kiri subjek."""
    sx = 1.0 if side == "L" else -1.0
    v = lambda n: np.array((arm_d.bones[f"{n}.{side}"].tail_local - arm_d.bones[f"{n}.{side}"].head_local)[:]) * np.array([sx, 1, 1])
    th, sh = v("THIGH"), v("SHIN")
    ft = (jc[f"TOE_END.{side}"] - jc[f"ANKLE.{side}"]) * np.array([sx, 1, 1])  # kaki: dari titik jari sebenarnya (tulang kaki tegak lurus sumbu, bukan searah jari)
    fl = lambda x: math.degrees(math.atan2(-x[1], -x[2]))
    return {"hip_flex": fl(th), "hip_abd": math.degrees(math.atan2(th[0], -th[2])), "knee_flex": fl(th) - fl(sh),
            "ankle_dorsi": -math.degrees(math.atan2(-ft[2], -ft[1])) - fl(sh)}


REST = {sd: rest_offsets(sd) for sd in SIDES}
neutral_local = {}  # sudut lokal (derajat) tempat pose netral: batas AAOS berlaku dari NETRAL, bukan dari pose istirahat kadaver
limits_report = {}
for s in SIDES:
    for base, rom in ROM.items():
        pb = arm.pose.bones[f"{base}.{s}"]; L = pb.length
        tip = Vector((0, L, 0))
        lim = {"X": [0, 0], "Y": [0, 0], "Z": [0, 0]}
        pos = {}
        d = moved(pb, 'X', 10, tip) - np.array(pb.bone.tail_local[:])
        if base == "SHIN": flex_pos = d[1] > 0   # lutut: fleksi = tungkai bawah ke posterior (+Y)
        elif base == "FOOT": flex_pos = d[2] < 0  # fleksi plantar = ujung ke inferior
        else: flex_pos = d[1] < 0                 # panggul: fleksi = ujung ke anterior (−Y)
        fl, ex = rom.get("flexion", 0), rom.get("extension", 0)
        lim["X"] = [-ex, fl] if flex_pos else [-fl, ex]
        if "abduction" in rom:
            d = moved(pb, 'Z', 10, tip) - np.array(pb.bone.tail_local[:])
            ab_pos = d[0] * sgn[s] > 0
            ab, ad = rom["abduction"], rom.get("adduction", 0)
            lim["Z"] = [-ad, ab] if ab_pos else [-ab, ad]
            pos["positive_Z"] = "abduction" if ab_pos else "adduction"
        if "internal_rotation" in rom:
            probe = Vector((0, L / 2, 0.05))
            d = moved(pb, 'Y', 10, probe) - moved(pb, 'Y', 0, probe)
            ir_pos = d[0] * sgn[s] < 0
            ir, er = rom["internal_rotation"], rom["external_rotation"]
            lim["Y"] = [-er, ir] if ir_pos else [-ir, er]
            pos["positive_Y"] = "internal_rotation" if ir_pos else "external_rotation"
        # netral lokal = −tanda × offset istirahat (tanda = arah sumbu lokal untuk gerak anatomis positif)
        nl = {"X": 0.0, "Y": 0.0, "Z": 0.0}
        sx_s = 1.0 if flex_pos else -1.0  # tanda sumbu X lokal untuk fleksi (panggul, lutut) atau fleksi plantar (kaki)
        if base == "THIGH":
            nl["X"] = -sx_s * REST[s]["hip_flex"]
            if "positive_Z" in pos: nl["Z"] = -(1.0 if pos["positive_Z"] == "abduction" else -1.0) * REST[s]["hip_abd"]
        elif base == "SHIN":
            nl["X"] = -sx_s * REST[s]["knee_flex"]
        elif base == "FOOT":
            nl["X"] = sx_s * REST[s]["ankle_dorsi"]  # dorsofleksi anatomis positif = −tanda plantar
        for ax in "XZ":
            lim[ax] = [lim[ax][0] + nl[ax], lim[ax][1] + nl[ax]]
        neutral_local[pb.name] = {ax: round(nl[ax], 2) for ax in "XYZ"}
        c = pb.constraints.new('LIMIT_ROTATION'); c.owner_space = 'LOCAL'
        for ax in "XYZ":
            lo, hi = lim[ax]
            setattr(c, f"use_limit_{ax.lower()}", True)
            setattr(c, f"min_{ax.lower()}", math.radians(lo)); setattr(c, f"max_{ax.lower()}", math.radians(hi))
        pb.rotation_mode = 'XYZ'
        limits_report[pb.name] = {ax: lim[ax] for ax in "XYZ"} | {"positive_X": "flexion" if flex_pos else "extension"} | pos

# T-D7-05: TOE tidak diberi LIMIT_ROTATION (belum ada sumber terverifikasi untuk batas MTP); hanya konvensi tanda sumbu X:
# ekstensi MTP (dorsofleksi jari) = ujung jari bergerak ke superior (+Z).
for s in SIDES:
    pb = arm.pose.bones[f"TOE.{s}"]; pb.rotation_mode = 'XYZ'
    d = moved(pb, 'X', 10, Vector((0, pb.length, 0))) - np.array(pb.bone.tail_local[:])
    limits_report[pb.name] = {"X": None, "Y": None, "Z": None, "positive_X": "extension" if d[2] > 0 else "flexion", "note": "no ROM limit (no verified source); sign only"}

# ── QA rig ────────────────────────────────────────────────────────────────────
def length(n): return arm_d.bones[n].length
sym = {b: round(abs(length(f"{b}.L") - length(f"{b}.R")) * 1000, 2) for b in ("THIGH", "SHIN", "FOOT", "TOE")}
prox = {}
for key, pair in {"HIP": ("FEMUR", "HIP_BONE_OS_COXAE"), "KNEE": ("FEMUR", "TIBIA"), "ANKLE": ("TIBIA", "TALUS")}.items():
    for s in SIDES:
        prox[f"{key}.{s}"] = {bn: round(surf_dist(f"{S}{bn}.{s}", jc[f"{key}.{s}"]) * 1000, 1) for bn in pair}
seglen = {b.name: round(b.length * 1000, 1) for b in arm_d.bones}
qa = {"left_right_length_difference_mm": sym, "joint_centre_to_articulating_bone_surface_mm": prox,
      "bound_meshes": sum(len(v) for v in binding.values()), "meshes_considered": len(targets), "not_rigged": unbound, "forefoot_split_at_mtp": FOREFOOT_SPLIT,
      "not_rigged_reason": "knee ligaments span the joint and need soft skinning; muscles are not rigged; CT-derived upper-body bones (if present) are outside this lower-limb rig"}

keep = {arm.name} | {o.name for o in targets if o.parent == arm}
for o in list(ob):
    if o.name not in keep:
        ob.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if not c.all_objects:
        bpy.data.collections.remove(c)
bpy.ops.outliner.orphans_purge(do_recursive=True)
arm["panacea_rig_definition"] = "ISB-style joint centres from source geometry (no labelled landmarks); rigid bone binding; AAOS ROM limits"
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
json.dump({"body": BODY, "frame": "+Z superior, +X subject left, -Y anterior, metres",
           "joint_centres_m": {k: [round(float(x), 4) for x in v] for k, v in jc.items()}, "joint_centre_methods": meta,
           "segments_mm": seglen, "rom_limits_deg_local": limits_report, "rest_offsets_deg": {sd: {k: round(v, 2) for k, v in REST[sd].items()} for sd in SIDES}, "neutral_local_deg": neutral_local, "rom_source": "AAOS normal values (Greene & Heckman 1994)",
           "flexion_axis": "knee and ankle flexion about the femoral mediolateral extreme line / intermalleolar line; hip perpendicular to the bone, anterior roll",
           "flexion_axis_change_deg": axis_dev, "hinge_refinement": HINGE_NOTE, "flexion_axes": {k: [round(float(x), 5) for x in v] for k, v in AXIS.items()},
           "binding": {k: len(v) for k, v in binding.items()}, "qa": qa}, open(REPORT, "w"), indent=1)
print("RIG", len(arm_d.bones), "bones;", qa["bound_meshes"], "/", qa["meshes_considered"], "bound; not rigged:", len(unbound))
print("SYM", sym); print("PROX", prox); print("META", {k: meta[k] for k in ("HIP.L", "KNEE.L", "ANKLE.L")})
