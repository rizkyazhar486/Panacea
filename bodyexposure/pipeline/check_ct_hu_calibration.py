"""Verifikasi pemetaan HU (HU = nilai tersimpan − 1024) pada CT Visible Human Female Denver, yang tidak menyertakan kalibrasi di DICOM.

  python3 bodyexposure/pipeline/check_ct_hu_calibration.py --dicom "~/Downloads/Aligned CT-DICOM" --ct vhf_ct_hu_1p5mm.nii.gz --seg ts_out15 --out bodyexposure/qa_reports/ct_hu_calibration.json

Tag DICOM: Modality OT (secondary capture), RescaleSlope 1, RescaleIntercept 0, tidak ada tag HU. Bukti yang diukur:
  1. Udara ruangan di dalam lingkaran FOV tetapi di luar tubuh harus ≈ −1000 HU (definisi): nilai tersimpan median ≈ 24–27 → offset 1024 ± 3.
  2. Lemak ≈ −100 HU dan jaringan lunak ≈ +30…+50 HU harus berselisih ≈ 130–150 HU: puncak histogram jaringan lunak (tanpa tulang/paru).
  3. Organ dengan nilai HU yang dikenal dari literatur (hati, aorta) jatuh dalam rentang wajar. Hati/otot kadaver dengan BMI 36 bisa lebih rendah dari populasi sehat.
Dua titik (udara, lemak/jaringan lunak) menetapkan offset dan kemiringan ≈ 1; ini bukan sertifikasi kalibrasi (tanpa phantom).
"""
import argparse, glob, json, os
import numpy as np, nibabel as nib, pydicom
from scipy.ndimage import binary_fill_holes, binary_erosion

ap = argparse.ArgumentParser(); ap.add_argument("--dicom", required=True); ap.add_argument("--ct", required=True); ap.add_argument("--seg", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
fs = sorted(glob.glob(os.path.join(os.path.expanduser(a.dicom), "*.dcm")))
ds = pydicom.dcmread(fs[0], stop_before_pixels=True)
res = {"dicom_tags": {k: str(getattr(ds, k, None)) for k in ("Modality", "RescaleSlope", "RescaleIntercept", "RescaleType", "BitsStored", "PixelRepresentation", "SpacingBetweenSlices")}, "air": [], "organs": {}}
for i in (700, 1000, 1300, 1450):
    px = pydicom.dcmread(fs[i]).pixel_array.astype(int); h, w = px.shape; yy, xx = np.mgrid[:h, :w]
    fov = ((yy - h / 2) ** 2 + (xx - w / 2) ** 2) < (0.45 * w) ** 2
    body = binary_fill_holes(px > 600); air = fov & ~binary_erosion(body, iterations=15) & (px < 400); air[h // 2:] = False  # tanpa meja
    v = px[air]; res["air"].append({"slice": i, "pixels": int(air.sum()), "stored_median": float(np.median(v)), "hu_median_if_offset_1024": float(np.median(v)) - 1024})
ct = np.asarray(nib.load(a.ct).dataobj).astype(np.int16)  # HU (nilai tersimpan − 1024) pada 1,5 mm
soft = (ct > -300) & (ct < 300)
h, e = np.histogram(ct[soft], bins=np.arange(-300, 300, 10)); top = sorted(zip(h, e[:-1]), reverse=True)[:6]
res["soft_tissue_histogram_peaks_hu"] = [(int(b), int(c)) for c, b in top]
fat_pk = max((t for t in top if -140 <= t[1] <= -60), default=None, key=lambda t: t[0]); sf_pk = max((t for t in top if 0 <= t[1] <= 80), default=None, key=lambda t: t[0])
res["fat_peak_hu_bin"] = int(fat_pk[1]) if fat_pk else None; res["soft_peak_hu_bin"] = int(sf_pk[1]) if sf_pk else None
res["fat_to_soft_separation_hu"] = (res["soft_peak_hu_bin"] - res["fat_peak_hu_bin"]) if fat_pk and sf_pk else None
for n, lit in (("liver", "about +50 to +70 healthy; lower with fat"), ("aorta", "blood about +40"), ("autochthon_left", "muscle about +45 to +60; lower post-mortem or fatty"), ("vertebrae_L3", "bone mix 150-400")):
    m = np.asarray(nib.load(os.path.join(a.seg, n + ".nii.gz")).dataobj) > 0
    res["organs"][n] = {"mean_hu": round(float(ct[m].mean()), 1), "p5": round(float(np.percentile(ct[m], 5)), 1), "p95": round(float(np.percentile(ct[m], 95)), 1), "literature": lit}
json.dump(res, open(a.out, "w"), indent=1)
print("AIR HU", [r["hu_median_if_offset_1024"] for r in res["air"]], "| fat/soft peaks", res["fat_peak_hu_bin"], res["soft_peak_hu_bin"], "sep", res["fat_to_soft_separation_hu"])
