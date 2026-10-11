"""Gerak napas dari CT 4D nyata (TCIA 4D-Lung, CC BY 3.0): ukuran paru tiap fase napas → model gerak berlabel, bukan data tubuh ini.

  python3 bodyexposure/pipeline/respiratory_4dlung.py --cases <dir berisi <n>_HM10395/<n>_HM10395_g0?0.nii.gz> \
      --out public/bodyexposure/respiration_model.json --report bodyexposure/qa_reports/respiration_4dlung.json [--png <montase.png>]

Data: fan-beam CT 4D (10 fase napas, 0–90 %, 0,977 × 0,977 × 3 mm) pasien NSCLC dari "Data from 4D Lung Imaging of NSCLC Patients (4D-Lung)", The Cancer Imaging
Archive (Hugo dkk. 2017), lisensi CC BY 3.0 (halaman koleksi TCIA); salinan NIfTI diambil dari rilis 2026.07.1 MONAI Physio. Paru disegmentasi tiap fase dengan ambang HU
(< −400 di dalam tubuh), dipisah dari trakea dengan pembukaan morfologi 6 mm; dua komponen terbesar = paru.

Yang diukur (tiap fase, relatif terhadap fase paru terkecil = akhir ekspirasi kasus itu): volume paru, rentang LR/AP/SI (→ skala), pergeseran pusat massa (mm) dalam sumbu kanonik (+X kiri, +Y posterior, +Z superior; koordinat fisik LPS). Fase tiap kasus
diputar agar akhir ekspirasi di indeks 0; model = rata-rata kasus yang lolos pemeriksaan kewajaran, simpangan baku disimpan. TIDAK diukur: periode napas (CT 4D yang
dikelompokkan fase tidak memuatnya), gerak tulang rusuk/diafragma terpisah dari paru, pencocokan ke tubuh Body Exposure mana pun.

Kewajaran (kasus ditolak bila gagal, alasan dicatat): 10 fase berukuran sama, volume akhir ekspirasi 1,0–7,0 L, perubahan volume 2–45 %, skala 0,85–1,25.
"""
import argparse, glob, json, os
import numpy as np
import SimpleITK as sitk
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument("--cases", required=True); ap.add_argument("--out", required=True); ap.add_argument("--report", required=True); ap.add_argument("--png", default="")
a = ap.parse_args()
PHASES = [f"g{p:03d}" for p in range(0, 100, 10)]
HU_AIR = -400
OPEN_MM = 6.0
CITATION = ("Hugo GD, Weiss E, Sleeman WC, et al. A longitudinal four-dimensional computed tomography and cone beam computed tomography dataset for image-guided radiation "
            "therapy research in lung cancer. Med Phys 44(2):762-771 (2017). TCIA 4D-Lung, https://www.cancerimagingarchive.net/collection/4d-lung/ (CC BY 3.0). "
            "Clark K, et al. The Cancer Imaging Archive (TCIA). J Digit Imaging 26(6):1045-1057 (2013).")


def lung_mask(img):
    arr = sitk.GetArrayFromImage(img)  # (z, y, x)
    sx, sy, sz = img.GetSpacing()
    body = np.zeros(arr.shape, bool)
    for z in range(arr.shape[0]):
        b = ndi.binary_fill_holes(arr[z] > -300)
        lab, n = ndi.label(b)
        if n: body[z] = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    air = (arr < HU_AIR) & body
    # pembukaan morfologi dengan bola OPEN_MM lewat transformasi jarak (setara, jauh lebih cepat daripada elemen penstruktur 3D): erosi = jarak ke tepi > r
    samp = (sz, sy, sx)
    eroded = ndi.distance_transform_edt(air, sampling=samp) > OPEN_MM
    lab, n = ndi.label(eroded)
    sizes = np.bincount(lab.ravel())[1:]
    keep = np.argsort(sizes)[::-1][:2] + 1
    core = np.isin(lab, keep)
    return ((ndi.distance_transform_edt(~core, sampling=samp) <= OPEN_MM) & air), arr


def metrics(m, img):
    sx, sy, sz = img.GetSpacing()
    idx = np.argwhere(m)
    lo, hi = idx.min(0), idx.max(0)
    ext = (hi - lo + 1) * np.array([sz, sy, sx])           # (si, ap, lr) mm
    # pusat massa di koordinat FISIK ITK LPS = sumbu kanonik Body Exposure (+X kiri, +Y posterior, +Z superior); arah sumbu indeks citra tidak diandalkan
    mz, my, mx = idx.mean(0)
    cen = np.array(img.TransformContinuousIndexToPhysicalPoint((float(mx), float(my), float(mz))))  # (x kiri, y posterior, z superior) mm
    return {"volume_ml": float(m.sum() * sx * sy * sz / 1000.0), "extent_mm": ext.tolist(), "centroid_mm": cen.tolist(), "base_slice": int(lo[0]), "apex_slice": int(hi[0])}


cases, rejected, montage = [], [], []
for cdir in sorted(glob.glob(os.path.join(os.path.expanduser(a.cases), "*_HM10395"))):
    name = os.path.basename(cdir)
    files = [os.path.join(cdir, f"{name}_{p}.nii.gz") for p in PHASES]
    if not all(os.path.isfile(f) for f in files): rejected.append({"case": name, "reason": "fewer than 10 phase volumes"}); continue
    imgs = [sitk.ReadImage(f) for f in files]
    if len({im.GetSize() for im in imgs}) != 1 or len({tuple(round(s, 4) for s in im.GetSpacing()) for im in imgs}) != 1:
        rejected.append({"case": name, "reason": "phases differ in size or spacing"}); continue
    ms, per = [], []
    print('case', name, flush=True)
    for im in imgs:
        m, arr = lung_mask(im); ms.append(m); per.append(metrics(m, im))
    vol = np.array([p["volume_ml"] for p in per])
    ref = int(np.argmin(vol))
    dv = float((vol.max() - vol.min()) / vol.min())
    ext = np.array([p["extent_mm"] for p in per]); cen = np.array([p["centroid_mm"] for p in per])
    scale = ext / ext[ref]                                   # (si, ap, lr) terhadap akhir ekspirasi
    shift = cen - cen[ref]
    why = []
    if not (1000 <= vol[ref] <= 7000): why.append(f"end-expiratory volume {vol[ref]:.0f} mL outside 1000-7000")
    if not (0.02 <= dv <= 0.45): why.append(f"volume change {dv * 100:.1f} % outside 2-45 %")
    if scale.min() < 0.85 or scale.max() > 1.25: why.append(f"extent scale {scale.min():.2f}-{scale.max():.2f} outside 0.85-1.25")
    if why: rejected.append({"case": name, "reason": "; ".join(why), "volume_ml": vol.round(0).tolist()}); continue
    order = [(ref + k) % 10 for k in range(10)]               # akhir ekspirasi di indeks 0
    cases.append({"case": name, "reference_phase": PHASES[ref], "volume_ml": vol[order], "scale_lr_ap_si": scale[order][:, ::-1], "centroid_shift_mm_lr_ap_si": shift[order],
                  "volume_change_pct": dv * 100, "spacing_mm": list(imgs[0].GetSpacing()), "phase_order": [PHASES[i] for i in order]})
    mid = ms[int(np.argmax(vol))]; z = int(np.argwhere(mid)[:, 0].mean())
    montage.append((name, sitk.GetArrayFromImage(imgs[int(np.argmax(vol))])[z], mid[z]))

assert cases, f"no usable case: {rejected}"
V = np.array([c["volume_ml"] for c in cases]); S = np.array([c["scale_lr_ap_si"] for c in cases]); C = np.array([c["centroid_shift_mm_lr_ap_si"] for c in cases])
phases = []
for k in range(10):
    phases.append({"phase_index": k, "volume_ml": round(float(V[:, k].mean()), 1), "volume_sd_ml": round(float(V[:, k].std()), 1),
                   "scale_lr_ap_si": [round(float(S[:, k, j].mean()), 4) for j in range(3)], "scale_sd": [round(float(S[:, k, j].std()), 4) for j in range(3)],
                   "centroid_shift_mm_lr_ap_si": [round(float(C[:, k, j].mean()), 2) for j in range(3)]})
model = {
    "schema": 1, "kind": "respiratory_motion_model", "truth_class": "measured-transferred",
    "label": "Breathing from 4D-CT of other patients: lung size and position change over one breath, averaged over cases and transferred to this body. Not this body's measured motion.",
    "source": f"TCIA 4D-Lung (Hugo et al., VCU), {len(cases)} patients, 10 gated phases", "licence": "CC BY 3.0", "citation": CITATION,
    "cases": [c["case"] for c in cases], "cases_rejected": rejected,
    "reference": "phase 0 = end-expiration of each case (smallest lung volume); phases are 10 % bins of one breath, aligned this way before averaging",
    "limitations": ("Lung segmentation by HU threshold (< -400 HU) with a 6 mm opening, no manual check against contours. The CT does not give the breathing period, so playback speed is a "
                    "viewer setting. Only lung size and position are modelled, not the diaphragm, ribs or heart separately. Patients have lung cancer; one breath of free breathing."),
    "phases": phases, "volume_change_pct_mean": round(float(np.mean([c["volume_change_pct"] for c in cases])), 1),
}
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
json.dump(model, open(a.out, "w"), indent=1)
rep = {"cases": [{k: (v.round(3).tolist() if isinstance(v, np.ndarray) else v) for k, v in c.items()} for c in cases], "rejected": rejected, "hu_air": HU_AIR, "opening_mm": OPEN_MM}
json.dump(rep, open(a.report, "w"), indent=1)
if a.png and montage:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, len(montage), figsize=(3 * len(montage), 3.2))
    ax = np.atleast_1d(ax)
    for x, (n, sl, mk) in zip(ax, montage):
        x.imshow(np.clip(sl, -1000, 400), cmap="gray"); x.contour(mk, levels=[0.5], colors="r", linewidths=0.6); x.set_title(n, fontsize=8); x.axis("off")
    fig.suptitle("Lung masks at end-inspiration (red), mid-lung axial slice", fontsize=9); plt.tight_layout(); plt.savefig(a.png, dpi=80)
print("RESPIRATION", len(cases), "cases used,", len(rejected), "rejected; volume change", model["volume_change_pct_mean"], "%")
for p in phases: print(p["phase_index"], p["volume_ml"], p["scale_lr_ap_si"], p["centroid_shift_mm_lr_ap_si"])
