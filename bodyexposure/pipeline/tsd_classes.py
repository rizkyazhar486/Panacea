"""Kelas TotalSegmentator dataset v2 (117 kelas) → struktur kanonik Body Exposure: nama, sistem, bahan, lateralitas.

Dipakai oleh tsd_masks_to_stl.py (membuat mesh) dan build_tsd_body.py (Blender). Kelas yang tidak ada di sini menghentikan build (tidak ada tebakan);
kelas yang sengaja tidak diterbitkan ada di NOT_PUBLISHED dengan alasannya.
"""
import re

# kunci → (nama, sistem, bahan PAN_*, jenis)
_BONE = ("skeletal", "PAN_Bone", "bone")
_MUSCLE = ("muscular", "PAN_Muscle", "muscle")
_ARTERY = ("cardiovascular", "PAN_Artery", "artery")
_VEIN = ("cardiovascular", "PAN_Vein", "vein")
_ORGAN = "PAN_Organ"
SIMPLE = {
    "spleen": ("Spleen", "lymphatic", _ORGAN, "organ"),
    "kidney": ("Kidney", "urinary", _ORGAN, "organ"),
    "gallbladder": ("Gallbladder", "digestive", "PAN_Gallbladder", "organ"),
    "liver": ("Liver", "digestive", _ORGAN, "organ"),
    "stomach": ("Stomach", "digestive", "PAN_Organ", "organ"),
    "pancreas": ("Pancreas", "digestive", "PAN_Gland", "organ"),
    "adrenal_gland": ("Adrenal gland", "endocrine", "PAN_Gland", "gland"),
    "esophagus": ("Esophagus", "digestive", "PAN_Organ", "organ"),
    "trachea": ("Trachea", "respiratory", "PAN_Bronchus", "airway"),
    "thyroid_gland": ("Thyroid gland", "endocrine", "PAN_Gland", "gland"),
    "small_bowel": ("Small bowel (jejunum and ileum)", "digestive", "PAN_Intestine", "organ"),
    "duodenum": ("Duodenum", "digestive", "PAN_Intestine", "organ"),
    "colon": ("Colon", "digestive", "PAN_Intestine", "organ"),
    "urinary_bladder": ("Urinary bladder", "urinary", _ORGAN, "organ"),
    "heart": ("Heart (all chambers, one mesh)", "cardiovascular", "PAN_Myocardium", "organ"),
    "atrial_appendage_left": ("Left atrial appendage", "cardiovascular", "PAN_Myocardium", "organ"),
    "aorta": ("Aorta", *_ARTERY),
    "pulmonary_vein": ("Pulmonary veins (one mesh)", "cardiovascular", "PAN_PulmonaryVein", "vein"),
    "brachiocephalic_trunk": ("Brachiocephalic trunk", *_ARTERY),
    "subclavian_artery": ("Subclavian artery", *_ARTERY),
    "common_carotid_artery": ("Common carotid artery", *_ARTERY),
    "brachiocephalic_vein": ("Brachiocephalic vein", *_VEIN),
    "superior_vena_cava": ("Superior vena cava", *_VEIN),
    "inferior_vena_cava": ("Inferior vena cava", *_VEIN),
    "portal_vein_and_splenic_vein": ("Portal vein and splenic vein", *_VEIN),
    "iliac_artery": ("Iliac artery", *_ARTERY),
    "iliac_vena": ("Iliac vein", *_VEIN),
    "humerus": ("Humerus", *_BONE), "scapula": ("Scapula", *_BONE), "clavicula": ("Clavicle", *_BONE), "femur": ("Femur", *_BONE),
    "hip": ("Hip bone (os coxae)", *_BONE), "sacrum": ("Sacrum", *_BONE), "skull": ("Skull", *_BONE), "sternum": ("Sternum", *_BONE),
    "costal_cartilages": ("Costal cartilages (all, one mesh)", "joint", "PAN_Cartilage", "cartilage"),
    "spinal_cord": ("Spinal cord", "nervous", "PAN_WhiteMatter", "nerve"),
    "brain": ("Brain", "nervous", "PAN_GreyMatter", "nerve"),
    "gluteus_maximus": ("Gluteus maximus", *_MUSCLE), "gluteus_medius": ("Gluteus medius", *_MUSCLE), "gluteus_minimus": ("Gluteus minimus", *_MUSCLE),
    "iliopsoas": ("Iliopsoas", *_MUSCLE), "autochthon": ("Erector spinae (autochthonous back muscles)", *_MUSCLE),
}
LOBES = {"lung_upper_lobe_left": "Superior lobe of left lung", "lung_lower_lobe_left": "Inferior lobe of left lung", "lung_upper_lobe_right": "Superior lobe of right lung",
         "lung_middle_lobe_right": "Middle lobe of right lung", "lung_lower_lobe_right": "Inferior lobe of right lung"}
NOT_PUBLISHED = {
    "prostate": "the label is defined for male anatomy; in a female subject it is empty or wrong, so it is not published for women (see MALE_ONLY)",
    "kidney_cyst_left": "pathology label, not normal anatomy", "kidney_cyst_right": "pathology label, not normal anatomy",
}


MALE_ONLY = {"prostate": ("Prostate", "reproductive", "PAN_Gland", "gland", "unpaired")}


def classify(key, sex=None):
    """TotalSegmentator kelas → (nama, sistem, bahan, jenis, lateralitas) atau None bila tidak diterbitkan. KeyError bila kelas tidak dikenal.
    sex 'm'/'f' dari meta.csv: kelas khusus laki-laki (prostat) hanya diterbitkan untuk subjek laki-laki."""
    if key in MALE_ONLY: return MALE_ONLY[key] if sex == "m" else None
    if key in NOT_PUBLISHED: return None
    if key in LOBES: return (LOBES[key], "respiratory", "PAN_Lung", "lung", "left" if key.endswith("left") else "right")
    m = re.match(r"rib_(left|right)_(\d+)$", key)
    if m: return (f"Rib {m.group(2)}", *_BONE, m.group(1))
    m = re.match(r"vertebrae_([CTLS]\d+)$", key)
    if m: return (f"Vertebra {m.group(1)}", *_BONE, "unpaired")
    m = re.match(r"(.+)_(left|right)$", key)
    if m and m.group(1) in SIMPLE: return (*SIMPLE[m.group(1)], m.group(2))
    if key in SIMPLE: return (*SIMPLE[key], "unpaired")
    raise KeyError(f"unknown TotalSegmentator class: {key}")
