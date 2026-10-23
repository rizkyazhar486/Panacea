"""Tabel acuan biometri janin dari sumber primer → public/bodyexposure/fetal_reference_tables.json (tanpa angka karangan; semua nilai disalin dari tabel terbit).

  python3 bodyexposure/pipeline/build_fetal_reference_tables.py --who who.xml --intergrowth <dir PDF> --out public/bodyexposure/fetal_reference_tables.json

Sumber 1 — WHO Fetal Growth Charts (Kiserud dkk., PLOS Medicine 2017, doi:10.1371/journal.pmed.1002220, akses terbuka CC BY): Tabel 6 (BPD luar-dalam), 7 (HC), 8 (AC),
  9 (FL), 11 (EFW), 14 (EFW perempuan), 15 (EFW laki-laki); usia kehamilan 14–40 minggu, persentil per tabel (2,5 sampai 97,5; EFW per jenis kelamin 5 sampai 95), dibulatkan seperti terbit. Berkas: XML naskah PLOS.
Sumber 2 — INTERGROWTH-21st (Papageorghiou dkk., Lancet 2014;384:869-79, doi:10.1016/S0140-6736(14)61490-2): PDF resmi Universitas Oxford "Standards" (persentil 3/5/10/50/90/95/97)
  dan "Z-scores" (nilai pada z = −3…+3) untuk HC, BPD, AC, FL, 14–40 minggu; EFW TIDAK diterbitkan di tabel ini.
Pemeriksaan: 27 baris minggu, persentil naik monoton, median naik monoton menurut usia, jarak z-score sama (SD) per minggu, median persentil = nilai z 0.
"""
import argparse, hashlib, json, os, re, sys
from pypdf import PdfReader

ap = argparse.ArgumentParser(); ap.add_argument("--who", required=True); ap.add_argument("--intergrowth", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()
WEEKS = list(range(14, 41))
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()

# ---- WHO ----
xml = open(a.who, encoding="utf8").read()
def who_table(tid):
    t = re.search(r'<table-wrap[^>]*id="%s".*?</table-wrap>' % tid, xml, re.S).group(0)
    rows = [[re.sub(r"<[^>]+>", "", c).strip().replace(",", "") for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)] for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S)]
    pct = [float(x) for x in rows[1]]
    data = {}
    for r in rows[2:]:
        if re.fullmatch(r"\d+", r[0]): data[r[0]] = [float(x) for x in r[1:]]
    return pct, data
WHO_TABLES = {"bpd": ("pmed.1002220.t006", "Biparietal diameter (outer-inner)", "mm"), "hc": ("pmed.1002220.t007", "Head circumference", "mm"), "ac": ("pmed.1002220.t008", "Abdominal circumference", "mm"),
              "fl": ("pmed.1002220.t009", "Femur length", "mm"), "efw": ("pmed.1002220.t011", "Estimated fetal weight (sex not distinguished)", "g"),
              "efw_female": ("pmed.1002220.t014", "Estimated fetal weight, female fetuses", "g"), "efw_male": ("pmed.1002220.t015", "Estimated fetal weight, male fetuses", "g")}
who = {"measures": {}}
for k, (tid, label, unit) in WHO_TABLES.items():
    pct, data = who_table(tid)          # persentil tiap tabel dibaca dari tabelnya sendiri (EFW per jenis kelamin: 5 sampai 95)
    assert pct == sorted(pct) and 50.0 in pct, (k, pct)
    assert sorted(map(int, data)) == WEEKS, (k, sorted(data)[:3], len(data))
    for w, v in data.items():
        assert len(v) == len(pct) and v == sorted(v), (k, w, v)
    meds = [data[str(w)][pct.index(50.0)] for w in WEEKS]
    assert meds == sorted(meds), k
    who["measures"][k] = {"label": label, "unit": unit, "percentiles": pct, "table": {w: data[w] for w in sorted(data, key=int)}, "source_table": tid}

# ---- INTERGROWTH-21st ----
def pdf_rows(path):
    txt = PdfReader(path).pages[0].extract_text().replace("‐", "-")
    rows = {}
    for line in txt.splitlines():
        m = re.match(r"^\s*(\d{2})\s+((?:-?\d+(?:\.\d+)?\s*){7})$", line)
        if m and 14 <= int(m.group(1)) <= 40: rows[m.group(1)] = [float(x) for x in m.group(2).split()]
    return rows
IG = {"hc": ("Head_Circumference", "Head circumference"), "bpd": ("Biparietal_Diameter", "Biparietal diameter"), "ac": ("Abdominal_Circumference", "Abdominal circumference"), "fl": ("Femur_Length", "Femur length")}
ig = {"centiles": [3, 5, 10, 50, 90, 95, 97], "z_values": [-3, -2, -1, 0, 1, 2, 3], "measures": {}}
sources = {"who_xml": {"file": os.path.basename(a.who), "sha256": sha(a.who)}, "intergrowth_pdfs": {}}
for k, (stem, label) in IG.items():
    std_p = os.path.join(a.intergrowth, f"{stem}.pdf"); z_p = os.path.join(a.intergrowth, f"{stem}_Z.pdf")
    std, z = pdf_rows(std_p), pdf_rows(z_p)
    assert sorted(map(int, std)) == WEEKS and sorted(map(int, z)) == WEEKS, (k, len(std), len(z))
    for w in std:
        assert std[w] == sorted(std[w]) and z[w] == sorted(z[w]), (k, w)
        steps = [z[w][i + 1] - z[w][i] for i in range(6)]
        assert max(steps) - min(steps) <= 0.011 * max(steps) + 0.011, (k, w, steps)     # jarak z sama (SD) hingga pembulatan 2 desimal
        assert abs(std[w][3] - z[w][3]) < 0.011, (k, w, std[w][3], z[w][3])              # persentil 50 = z 0
    ig["measures"][k] = {"label": label, "unit": "mm", "centile_table": {w: std[w] for w in sorted(std, key=int)}, "z_table": {w: z[w] for w in sorted(z, key=int)}}
    sources["intergrowth_pdfs"][stem] = {"standards_sha256": sha(std_p), "z_scores_sha256": sha(z_p)}

out = {
    "schema": 1, "kind": "fetal_reference_tables", "retrieved": "2026-10-11", "gestational_age_weeks": [14, 40], "sources": sources,
    "references": {
        "who_2017": {
            "name": "WHO Fetal Growth Charts", "citation": "Kiserud T, Piaggio G, Carroli G, et al. The World Health Organization Fetal Growth Charts: A Multinational Longitudinal Study of Ultrasound Biometric Measurements and Estimated Fetal Weight. PLOS Medicine 14(1):e1002220 (2017). doi:10.1371/journal.pmed.1002220",
            "licence": "Creative Commons Attribution License (PLOS Medicine, open access)",
            "population": "1,387 low-risk singleton pregnancies from 10 countries (Argentina, Brazil, Democratic Republic of Congo, Denmark, Egypt, France, Germany, India, Norway, Thailand)",
            "method": "Quantile regression; reference percentiles are the published table values (rounded as published). A measurement is placed by linear interpolation between neighbouring published percentiles; outside the 2.5th to 97.5th it is reported only as below or above that bound.",
            "efw_note": "EFW was calculated from head circumference, abdominal circumference and femur length with Hadlock's third formula (as stated in the paper).",
            "measures": who["measures"],
        },
        "intergrowth_2014": {
            "name": "INTERGROWTH-21st International Fetal Growth Standards", "citation": "Papageorghiou AT, Ohuma EO, Altman DG, et al. International standards for fetal growth based on serial ultrasound measurements: the Fetal Growth Longitudinal Study of the INTERGROWTH-21st Project. Lancet 384(9946):869-879 (2014). doi:10.1016/S0140-6736(14)61490-2 (the table PDFs print the citation as 'Villar et al Lancet 2014; 384:869-79')",
            "licence": "Terms of reuse not stated on the download page or in the PDFs, which carry '(c) University of Oxford'; values transcribed from the public tables with attribution",
            "population": "Fetal Growth Longitudinal Study, a multi-centre, multi-ethnic, population-based study (2009-2014) in eight urban areas: Pelotas (Brazil), Shunyi County Beijing (China), Central Nagpur (India), Turin (Italy), Nairobi (Kenya), Muscat (Oman), Oxford (UK), Seattle (USA)",
            "method": "Published tables of centiles (3, 5, 10, 50, 90, 95, 97) and of values at z = -3 to +3 for each exact week. The z-score of a measurement is interpolated linearly between the published z values (spacing is equal, checked), and the percentile is the standard normal cumulative distribution of that z; at the 3rd and 97th centiles this agrees with the published centile table within rounding (tested). No EFW standard is in these tables.",
            "measurement_note": "The table PDFs do not state the biparietal diameter measurement sites; see the paper.",
            "centiles": ig["centiles"], "z_values": ig["z_values"], "measures": ig["measures"],
        },
    },
}
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
json.dump(out, open(a.out, "w"), separators=(",", ":"))
print("FETAL TABLES", {k: len(v["table"]) for k, v in who["measures"].items()}, {k: len(v["centile_table"]) for k, v in ig["measures"].items()})
