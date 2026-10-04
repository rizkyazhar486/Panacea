"""Anotasi Terminologia Anatomica 2 (TA2): ID TA2, nama Latin, nama Prancis.

Sumber: TA2.csv dari repositori Z-Anatomy (CC BY-SA 4.0), kolom
TA2ID;English;Latin;Français;Español;Portugues;Italiano;Parsi.

Pencocokan hanya EKSAK pada nama Inggris (tanpa beda huruf besar/kecil, tanpa sufiks lateralitas,
tanda kurung varian dibuang). Tidak ada pencocokan kabur: nama yang tidak cocok dibiarkan tanpa
anotasi, bukan ditebak — label Latin yang salah lebih buruk daripada tidak ada label.
"""
import bpy, csv, re

TA2 = "/Users/rizkyazhar/Documents/Panaceamed.id/bodyexposure/sources/zanatomy/TA2.csv"


def load():
    rows = {}
    with open(TA2, encoding="utf-8-sig", errors="replace") as f:
        for line in csv.reader(f):
            if not line:
                continue
            parts = line[0].split(";") if len(line) == 1 else line
            if len(parts) < 4 or not parts[0].strip().isdigit():
                continue
            rows.setdefault(parts[1].strip().lower(), (parts[0].strip(), parts[2].strip(), parts[3].strip()))
    return rows


def key(name):
    n = re.sub(r"\s+(origin|insertion)(\s+\d+)?$", "", name.strip())  # area perlekatan → nama otot
    return n.strip("() ").lower()


def run():
    ta = load()
    hit = miss = 0
    for o in bpy.data.objects:
        if o.type != 'MESH' or "canonical_name" not in o:
            continue
        r = ta.get(key(o["canonical_name"]))
        for k in ("panacea_ta2_id", "panacea_latin_name", "panacea_name_fr"):
            if k in o:
                del o[k]
        if r:
            o["panacea_ta2_id"], o["panacea_latin_name"], o["panacea_name_fr"] = r
            o["panacea_ta2_match"] = "exact_english_name" + ("_of_muscle" if o.get("panacea_kind") in ("origin", "insertion") else "")
            hit += 1
        else:
            miss += 1
    return len(ta), hit, miss


if __name__ == "__main__":
    print(run())
