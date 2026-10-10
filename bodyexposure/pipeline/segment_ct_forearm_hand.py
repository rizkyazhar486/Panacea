"""Tulang lengan bawah dan tangan Visible Human Female dari CT resolusi asli (0,72 × 0,72 × 1,0 mm), tanpa model dan tanpa tebakan.

  python3 bodyexposure/pipeline/segment_ct_forearm_hand.py --dicom "~/Downloads/Aligned CT-DICOM" --ct vhf_ct_hu_1p5mm.nii.gz \
      --seg ts_out15 --validation bodyexposure/qa_reports/ct_segmentation_vs_denver.json --out <dir> --work <dir kerja>

Mengapa skrip ini ada: TotalSegmentator `total` (bobot terbuka) tidak punya kelas radius, ulna, atau tulang tangan, jadi ct_masks_to_stl.py tidak
menghasilkannya. CT-nya sendiri memuat seluruh lengan (lengan bawah dan tangan terletak di samping panggul), jadi geometri diturunkan LANGSUNG dari
citra: ambang HU pada resolusi asli, bukan bentuk prosedural dan bukan tulang laki-laki.

Langkah (semuanya deterministik, tanpa sampel acak):
 1. Pada 1,5 mm: voksel tulang (HU > 250) di luar masker tulang lain yang sudah ada (dilatasi 3 voksel), komponen besar yang bawahnya berada di bawah
    pertengahan humerus = dua lengan. Sisi kiri/kanan ditentukan dari humerus TotalSegmentator terdekat, bukan dari urutan indeks.
 2. Potong DICOM resolusi asli di sekitar tiap lengan (peta indeks: nifti[i,j,k] = DICOM[baris j, kolom i, irisan 1,5·k]; diverifikasi korelasi 0,9995).
 3. Ambang HU > 250 pada resolusi asli, buang masker tulang lain (humerus, skapula, klavikula, iga, vertebra, sakrum, pinggul, femur), pembukaan 1 voksel,
    komponen < 1500 voksel dibuang.
 4. Radius, ulna dan "tangan" dipisah dengan watershed pada transformasi jarak, dengan benih: dua penampang poros tengah (dua komponen terpisah pada
    irisan tertentu) dan semua voksel distal terhadap ujung poros.
 5. Mesh marching cubes + pemulusan Taubin, ke kerangka Denver dengan transformasi ICP femur yang sama dengan tulang CT lainnya.
Batas sambungan siku diperkirakan (±2–3 mm): radius dan ulna menyentuh humerus yang maskernya dilatasi. Tulang individual tangan dipisah di skrip lain.
"""
import argparse, glob, json, os, sys
import numpy as np, nibabel as nib, pydicom
from scipy import ndimage as ndi
from skimage.segmentation import watershed

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_segmentation_common import _taubin, write_stl
from skimage.measure import marching_cubes

HU_BONE = 250
HU_PROX = 450         # ambang di atas poros bersih (lihat split_forearm)
PX = 0.722656            # mm per piksel DICOM (baris dan kolom)
DZ = 1.0                 # mm antar irisan
S = 1.5 / PX             # piksel asli per voksel 1,5 mm
EXCLUDE = ("humerus", "scapula", "clavicula", "rib", "vertebrae", "sacrum", "hip", "femur", "skull", "sternum", "costal")
MIN_VOX = 1500
PROX_GAP_OK_MM = 15  # celah ke humerus yang masih dianggap ujung proksimal lengkap (ruang sendi siku + kerapuhan korteks tipis); perkiraan
MAX_GAP = 80          # irisan tanpa tulang yang masih diizinkan sebelum pelacakan berakhir
REACQ_MM = 12         # jarak maksimum komponen kandidat ke pusat yang diekstrapolasi
REACQ_MIN_PX = 300    # luas minimum komponen yang boleh ditangkap kembali (piksel 0,72 mm)
AREA_DROP = 0.45      # penampang < 45% median irisan terakhir = tulang hilang
K_LOST = 60           # irisan yang dipakai memperkirakan pusat tulang yang sedang hilang
K_TRACK = 20  # irisan terakhir yang dipakai memperkirakan pusat tulang berikutnya
GROW_PX = 4  # pertumbuhan lateral maksimum per irisan 1 mm (lengan miring ±30°, olekranon melebar); perkiraan
TUBE_MM = 16  # jari-jari tabung proksimal di sekitar poros radius/ulna (olekranon ±20 mm lebar); perkiraan
ELBOW_MARGIN_MM = 25  # irisan 1,0 mm; perkiraan, bukan batas sendi yang diukur


def big_only(m, min_vox=3000):
    """TotalSegmentator memberi label tulang besar pada serpihan kecil di pergelangan/tangan (karpal); hanya komponen besar dipakai untuk pengecualian."""
    lab, n = ndi.label(m)
    if n == 0: return m
    sz = np.bincount(lab.ravel())[1:]
    return np.isin(lab, np.where(sz >= min_vox)[0] + 1)


def load_known(seg_dir):
    """gabungan masker tulang lain (1,5 mm) + masker humerus per sisi untuk penentuan sisi."""
    known = None; hum = {}; humerus = {}
    for f in sorted(glob.glob(os.path.join(seg_dir, "*.nii.gz"))):
        nm = os.path.basename(f)[:-7]
        if not any(k in nm for k in EXCLUDE): continue
        m = big_only(np.asarray(nib.load(f).dataobj) > 0)
        known = m.copy() if known is None else known | m
        if nm in ("humerus_left", "humerus_right"):
            hum[nm.split("_")[1]] = np.argwhere(m).mean(0)
            humerus[nm.split("_")[1]] = m
    return known, hum, humerus


def find_arms(hu, known):
    rest = (hu > HU_BONE) & ~ndi.binary_dilation(known, iterations=3)
    lab, n = ndi.label(rest); sz = np.bincount(lab.ravel())[1:]
    arms = []
    for i in np.argsort(sz)[::-1][:6]:
        if sz[i] < 20000: continue
        idx = np.argwhere(lab == i + 1); lo, hi = idx.min(0), idx.max(0)
        if 500 < lo[2] < 700:  # lengan: ujung bawahnya (tangan) di sekitar pinggul; komponen tungkai (z < 500) dan serpihan kecil diabaikan
            arms.append((lo, hi, idx.mean(0)))
    return arms


def crop_native(dicoms, lo, hi, shape_native):
    c0, c1 = max(int((lo[0] - 8) * S), 0), min(int((hi[0] + 8) * S), shape_native[1])
    r0, r1 = max(int((lo[1] - 8) * S), 0), min(int((hi[1] + 8) * S), shape_native[0])
    s0, s1 = int((lo[2] - 8) * 1.5), int((hi[2] + 8) * 1.5)
    vol = np.zeros((r1 - r0, c1 - c0, s1 - s0), np.int16)
    for s in range(s0, s1):
        vol[:, :, s - s0] = (pydicom.dcmread(dicoms[s]).pixel_array[r0:r1, c0:c1].astype(np.int32) - 1024).astype(np.int16)
    return vol, (r0, c0, s0)


def to_native(known_vol, origin, shape):
    """masker 1,5 mm → grid asli potongan (tetangga terdekat; baris=j, kolom=i, irisan=1,5·k)."""
    r0, c0, s0 = origin
    rr = np.clip(((np.arange(shape[0]) + r0) / S).astype(int), 0, known_vol.shape[1] - 1)
    cc = np.clip(((np.arange(shape[1]) + c0) / S).astype(int), 0, known_vol.shape[0] - 1)
    ss = np.clip(((np.arange(shape[2]) + s0) / 1.5).astype(int), 0, known_vol.shape[2] - 1)
    return known_vol[np.ix_(cc, rr, ss)].transpose(1, 0, 2)


def shaft_seeds(m):
    """irisan dengan tepat dua komponen besar berurutan → benih radius dan ulna; mengembalikan (z_tengah, z_ujung_distal)."""
    two = []
    for z in range(m.shape[2]):
        lab, n = ndi.label(m[:, :, z]); sz = np.bincount(lab.ravel())[1:]
        big = [i + 1 for i, s in enumerate(sz) if s >= 120]
        two.append(len(big) == 2)
    two = np.array(two)
    # run terpanjang
    best = (0, 0); z = 0
    while z < len(two):
        if two[z]:
            e = z
            while e + 1 < len(two) and two[e + 1]: e += 1
            if e - z > best[1] - best[0]: best = (z, e)
            z = e + 1
        else: z += 1
    return best


def split_forearm(m, z0, z1, vol):
    """radius (1), ulna (2), tangan (3) dengan watershed pada transformasi jarak; benih = dua penampang poros dan semua voksel distal ujung poros.

    Bagian proksimal (di atas poros bersih, sekitar siku) dibatasi pada tabung TUBE_MM di sekitar garis poros tiap tulang: di situ ambang HU juga
    menangkap sisa iga/tulang rawan dan epifisis humerus yang tidak berlabel, yang menempel pada lengan yang bersandar di badan."""
    zm = (z0 + z1) // 2; slab = np.zeros_like(m); slab[:, :, zm - 10:zm + 11] = m[:, :, zm - 10:zm + 11]
    lab, n = ndi.label(slab); sz = np.bincount(lab.ravel())[1:]
    big = [i + 1 for i, v in enumerate(sz) if v >= 1500]
    assert len(big) == 2, f"expected two shaft seeds, found {len(big)}"
    markers = np.zeros(m.shape, np.int32)
    for k, b in enumerate(big): markers[lab == b] = k + 1
    hand = m.copy(); hand[:, :, z0 + 1:] = False; markers[hand & (markers == 0)] = 3
    edt = ndi.gaussian_filter(ndi.distance_transform_edt(m, sampling=(PX, PX, DZ)), 0.8)
    ws = watershed(-edt, markers, mask=m)
    # radius = tulang dengan penampang distal lebih besar (epifisis distal radius jauh lebih lebar daripada kepala ulna). Penampang proksimal TIDAK dipakai:
    # di sekitar siku ambang HU juga menangkap sisa iga/tulang rawan yang menempel, sehingga luas proksimal tidak dapat dipercaya (terbukti salah pada satu lengan).
    def mean_area(k, za, zb): return float(np.mean([(ws[:, :, z] == k).sum() for z in range(za, zb)]))
    dist = [mean_area(k, z0 + 3, z0 + 15) for k in (1, 2)]
    ratio = [d / max(1.0, mean_area(k, z1 - 15, z1 - 3)) for d, k in zip(dist, (1, 2))]
    assert max(dist) / max(1.0, min(dist)) > 1.3, f"radius/ulna cannot be told apart (distal areas {dist})"
    swap = dist[0] < dist[1]  # label 1 = benih pertama; jika ia ulna (distal lebih kecil), radius = label 2
    out = np.zeros(m.shape, np.uint8)
    out[ws == (2 if swap else 1)] = 1; out[ws == (1 if swap else 2)] = 2; out[ws == 3] = 3
    # Seluruh lengan bawah di atas pergelangan: label dirambatkan irisan demi irisan ke atas dari irisan distal yang bersih. Tiap irisan dibagi dengan
    # watershed 2D memakai label irisan sebelumnya sebagai penanda; hanya voksel dekat penanda (<= GROW_PX) dan di dalam tabung TUBE_MM di sekitar garis
    # poros (ekstrapolasi linear dari irisan distal) yang diterima. Di atas poros bersih ada garis terang tipis (<= 3 piksel) di permukaan kulit lengan
    # (artefak tepi blok CT) yang menempel pada tulang; ambang HU_PROX dan pembukaan 2D 2 iterasi menghapusnya sambil mempertahankan korteks radius
    # (cincin 4–5 piksel) dan ulna.
    zs = z0 + 3
    rr, cc = np.mgrid[:m.shape[0], :m.shape[1]]
    out[:, :, zs + 1:] = 0
    st2 = ndi.generate_binary_structure(2, 1)
    track = {1: [], 2: []}   # (irisan, baris, kolom, luas) tiap tulang pada irisan yang berhasil dilacak
    for z in range(zs - K_TRACK, zs + 1):
        for lid in (1, 2):
            pts = np.argwhere(out[:, :, z] == lid)
            if len(pts): track[lid].append((z, *pts.mean(0), len(pts)))
    lost = {1: False, 2: False}; lost_since = {1: 0, 2: 0}; frag_start = None
    for z in range(zs + 1, m.shape[2]):
        mz = ndi.binary_opening(m[:, :, z] & (vol[:, :, z] > HU_PROX), structure=st2, iterations=2)
        lab2, n2 = ndi.label(mz)
        markers = np.zeros(m.shape[:2], np.int32); tube_all = np.zeros(m.shape[:2], bool); near_all = np.zeros(m.shape[:2], bool)
        pred = {}
        for lid in (1, 2, 4):
            if lid == 4 and frag_start is None: continue
            tr = np.array(track.setdefault(lid, [])[-(K_LOST if lid != 4 and lost[lid] else K_TRACK):])  # tulang hilang: garis dari poros bersih yang lebih panjang
            if len(tr) < 1 or z - tr[-1, 0] > MAX_GAP or (len(tr) < 3 and lid != 4): continue  # sudah hilang terlalu lama: berakhir
            if len(tr) < 3: pred[lid] = (tr[-1, 1], tr[-1, 2])  # serpihan baru: pusat irisan terakhir
            else:
                fr = np.polyfit(tr[:, 0], tr[:, 1], 1); fc = np.polyfit(tr[:, 0], tr[:, 2], 1)  # pusat diperkirakan dari irisan terakhir (tulang melengkung)
                pred[lid] = (np.polyval(fr, z), np.polyval(fc, z))
            tube_all |= np.hypot((rr - pred[lid][0]) * PX, (cc - pred[lid][1]) * PX) <= TUBE_MM
            if lid == 4 or not lost[lid]:
                prev = out[:, :, z - 1] == lid
                near_all |= ndi.binary_dilation(prev, iterations=GROW_PX); markers[prev & mz & tube_all] = lid
        lost_ids = [lid for lid in (1, 2) if lid in pred and lost[lid]]
        if lost_ids and frag_start is None:
            # Tulang yang hilang muncul kembali sebagai komponen kompak dekat garis poros yang diekstrapolasi. Identitasnya (radius atau ulna) TIDAK dapat
            # ditentukan dengan andal setelah celah beberapa cm (jarak ke kedua prediksi hampir sama), maka diberi label sendiri (4), bukan ditebak.
            for c in range(1, n2 + 1):
                comp = lab2 == c
                if int(comp.sum()) < REACQ_MIN_PX or (markers[comp] != 0).any(): continue
                cy, cx = np.argwhere(comp).mean(0)
                dd = min(np.hypot((cy - pred[l][0]) * PX, (cx - pred[l][1]) * PX) for l in lost_ids)
                if dd <= REACQ_MM:
                    markers[comp] = 4; near_all |= comp; frag_start = int(z); track[4] = []; break
        if not markers.any(): continue
        mk = mz & (near_all | (markers > 0)) & tube_all
        e = ndi.distance_transform_edt(mk)
        w = watershed(-e, markers * mk, mask=mk)
        for lid in list(pred) + ([4] if frag_start == z and 4 not in pred else []):
            n_px = int((w == lid).sum())
            if lid != 4 and not lost[lid]:
                trl = np.array(track[lid][-K_TRACK:])
                # luas penampang runtuh (< AREA_DROP × median irisan terakhir): tulang tidak lagi terlihat utuh di CT (mis. korteks terpotong tepi blok CT)
                if len(trl) >= 10 and n_px < AREA_DROP * np.median(trl[:, 3]):
                    lost[lid] = True; lost_since[lid] = int(z); continue
            if lid in (1, 2) and lost[lid]: continue
            if n_px >= 20:
                out[:, :, z][w == lid] = lid; track.setdefault(lid, []).append((z, *np.argwhere(w == lid).mean(0), n_px))
    gaps = {"fragment_first_slice": frag_start, "lost_from_slice": {"radius": lost_since[1] if lost[1] else None, "ulna": lost_since[2] if lost[2] else None}}
    return out, {"shaft_seed_slice": int(zm), "distal_shaft_area_vox": [round(x) for x in dist], "distal_over_proximal_area": [round(r, 2) for r in ratio], "radius_seed_is_second": bool(swap),
                 "tube_mm": TUBE_MM, "hu_proximal": HU_PROX, "grow_px_per_slice": GROW_PX, "track_slices": K_TRACK, "tracking": gaps, "label_voxels": {k: int((out == v).sum()) for k, v in (("radius", 1), ("ulna", 2), ("hand_bones", 3), ("forearm_fragment", 4))}}


def mesh_label(mask, org, R, t):
    """masker label (baris, kolom, irisan pada potongan) → mesh di kerangka Denver (mm)."""
    r0, c0, s0 = org
    lab, n = ndi.label(mask); sz = np.bincount(lab.ravel())[1:]
    mask = np.isin(lab, np.where(sz >= MIN_VOX)[0] + 1)
    P = np.pad(mask, 1)
    V, F, _, _ = marching_cubes(P.astype(np.uint8), 0.5, spacing=(PX, PX, DZ))
    V = V - np.array([PX, PX, DZ])  # padding
    V = _taubin(V, F)
    ct = np.c_[-(V[:, 1] + c0 * PX), -(V[:, 0] + r0 * PX), V[:, 2] + s0 * DZ]  # (baris, kolom, irisan) → kerangka CT: X = −kolom, Y = −baris, Z = irisan
    return ct @ R.T + t, F, {"volume_cm3": round(float(mask.sum()) * PX * PX * DZ / 1000.0, 1), "components": int(len(np.unique(ndi.label(mask)[0])) - 1)}


def main():
    ap = argparse.ArgumentParser()
    for k in ("dicom", "ct", "seg", "validation", "out", "work"): ap.add_argument("--" + k, required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True); os.makedirs(a.work, exist_ok=True)
    T = json.load(open(a.validation))["transform_ct_to_denver"]; R = np.array(T["R"]); t = np.array(T["t_mm"])
    dicoms = sorted(glob.glob(os.path.join(os.path.expanduser(a.dicom), "*.dcm")))
    p0 = pydicom.dcmread(dicoms[0], stop_before_pixels=True); shape_native = (p0.Rows, p0.Columns)
    ct = nib.load(a.ct); hu = np.asarray(ct.dataobj).astype(np.float32)
    known, hum, humerus = load_known(a.seg)
    arms = find_arms(hu, known)
    assert len(arms) == 2, f"expected two arms, found {len(arms)}"
    prov = {"tool": "threshold + distance-transform watershed on native-resolution CT (algorithmic; not TotalSegmentator, not manual)",
            "hu_threshold": HU_BONE, "voxel_mm": [PX, PX, DZ], "transform_ct_to_denver": T, "arms": {}}
    for lo, hi, cen in arms:
        side = min(hum, key=lambda s: np.linalg.norm(hum[s] - cen))
        vol, org = crop_native(dicoms, lo, hi, shape_native)
        ex = to_native(known, org, vol.shape)
        b = (vol > HU_BONE) & ~ndi.binary_dilation(ex, iterations=1)
        hm = to_native(humerus[side], org, vol.shape)
        hl, hn = ndi.label(hm)  # TotalSegmentator memberi label "humerus" pada serpihan kecil di pergelangan; hanya komponen terbesar yang humerus sebenarnya
        hz = np.argwhere(hl == (np.argmax(np.bincount(hl.ravel())[1:]) + 1))[:, 2]
        zc = int(hz.min()) + ELBOW_MARGIN_MM  # ujung distal humerus + margin: batas atas lengan bawah (olekranon dan kepala radius ada di sekitarnya)
        b[:, :, zc:] = False
        b = ndi.binary_opening(b, iterations=1)
        lab, n = ndi.label(b); sz = np.bincount(lab.ravel())[1:]
        m = np.isin(lab, np.where(sz >= MIN_VOX)[0] + 1)
        z0, z1 = shaft_seeds(m)
        info = {"native_crop_shape": list(vol.shape), "origin_rcz": list(org), "mask_voxels": int(m.sum()), "elbow_cut_slice": zc, "two_bone_shaft_slices": [int(z0), int(z1)]}
        labels, split = split_forearm(m, z0, z1, vol)
        info.update(split)
        np.save(os.path.join(a.work, f"mask_{side}.npy"), m); np.save(os.path.join(a.work, f"labels_{side}.npy"), labels); np.save(os.path.join(a.work, f"hu_{side}.npy"), vol)
        info["meshes"] = {}
        hd = ndi.distance_transform_edt(~(hl == (np.argmax(np.bincount(hl.ravel())[1:]) + 1)), sampling=(PX, PX, DZ))  # jarak ke humerus
        for name, lid in (("radius", 1), ("ulna", 2), ("hand_bones", 3), ("forearm_fragment", 4)):
            if lid == 4:  # serpihan proksimal yang identitasnya tidak dapat ditentukan: dicatat, TIDAK diekspor sebagai struktur bernama
                info["unresolved_proximal_fragment_voxels"] = int((labels == 4).sum()); continue
            V, F, vi = mesh_label(labels == lid, org, R, t)
            write_stl(os.path.join(a.out, f"{name}_{side}.stl"), V, F)
            zz = np.argwhere(labels == lid)[:, 2]
            vi = vi | {"triangles": int(len(F)), "slices_covered": [int(zz.min()), int(zz.max())]}
            if lid in (1, 2):  # kelengkapan ujung proksimal: celah antara ujung atas tulang dan humerus (siku)
                top = labels == lid; top[:, :, :int(zz.max()) - 2] = False
                vi["gap_to_humerus_mm"] = round(float(hd[top].min()), 1)
                vi["proximal_end_complete"] = vi["gap_to_humerus_mm"] <= PROX_GAP_OK_MM
            info["meshes"][name] = vi
        prov["arms"][side] = info
        print(side, info)
    json.dump(prov, open(os.path.join(a.work, "forearm_hand_stage1.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
