"""Cek cakupan: daftar organ per sistem dari referensi "Body Exposure 2D Organ" vs inventaris berbasis sumber.

  python3 bodyexposure/pipeline/check_reference_coverage.py

Hanya nama organ yang diambil dari referensi (daftar periksa), bukan bentuk. Pola regex dicocokkan ke
canonical_name per tubuh dewasa. Hasil: manifest/reference_coverage.json.
"""
import json, os, re

HERE = os.path.dirname(__file__)
S = json.load(open(os.path.join(HERE, "..", "manifest", "structures.json")))["structures"]
CHECKLIST = {  # sistem → [(label referensi, pola nama kanonik)]
    "integumentary": [("skin", r"\bskin\b|^SURFACE:"), ("hair", r"\bhair\b"), ("nail", r"\bnail\b"), ("sweat gland", r"sweat gland"), ("sebaceous gland", r"sebaceous")],
    "skeletal": [("skull", r"frontal bone|occipital bone|parietal bone"), ("vertebral column", r"vertebra"), ("ribs", r"\brib\b"), ("sternum", r"sternum|manubrium"), ("limb bones", r"\bfemur\b|\bhumerus\b")],
    "muscular": [("skeletal muscle", r"muscle|\bmusculus\b|gluteus|biceps"), ("cardiac muscle", r"myocardium|ventricle"), ("smooth muscle (organ walls)", r"muscular layer|muscularis|detrusor")],
    "nervous": [("brain", r"cerebr|brain|telencephal|cortex"), ("spinal cord", r"spinal cord"), ("cranial nerves", r"(optic|oculomotor|trigeminal|facial|vagus|hypoglossal) nerve"), ("spinal nerves", r"spinal nerve|intercostal nerve|sciatic|femoral nerve"), ("eye", r"eyeball|sclera|retina|\blens\b")],
    "endocrine": [("hypothalamus", r"hypothalamus"), ("pituitary", r"pituitary|hypophys"), ("pineal", r"pineal"), ("thyroid", r"thyroid"), ("parathyroid", r"parathyroid"), ("adrenal", r"adrenal|suprarenal"), ("pancreas", r"pancrea"), ("thymus", r"thymus")],
    "cardiovascular": [("heart", r"heart|ventricle|atrium"), ("arteries", r"artery|aorta"), ("veins", r"\bvein\b|vena cava"), ("capillaries", r"capillar")],
    "lymphatic": [("lymph nodes", r"lymph node|\bnodes?\b"), ("lymphatic vessels", r"lymphatic|thoracic duct"), ("spleen", r"spleen"), ("thymus", r"thymus"), ("tonsils", r"tonsil"), ("red bone marrow", r"marrow")],
    "respiratory": [("nasal cavity", r"nasal cavity|nasal concha|nasal septum"), ("pharynx", r"pharynx"), ("larynx", r"larynx|thyroid cartilage|cricoid|epiglott"), ("trachea", r"trachea"), ("lungs", r"lung|lobe of (left|right) lung"), ("diaphragm", r"diaphragm")],
    "digestive": [("mouth / tongue / teeth", r"tongue|tooth|incisor|molar"), ("salivary glands", r"parotid|submandibular gland|sublingual gland|salivary"), ("oesophagus", r"esophag|oesophag"), ("stomach", r"stomach"), ("liver", r"liver"), ("gallbladder", r"gallbladder"), ("pancreas", r"pancrea"), ("small intestine", r"duodenum|jejunum|ileum|small intestine"), ("large intestine", r"colon|caecum|cecum"), ("rectum and anus", r"\brectum\b|anal canal|\banus\b|rectal ampulla")],
    "urinary": [("kidney", r"kidney|renal (cortex|pelvis)"), ("ureter", r"ureter"), ("urinary bladder", r"urinary bladder"), ("urethra", r"urethra")],
    "reproductive_male": [("testis", r"testis"), ("epididymis", r"epididymis"), ("seminal vesicle", r"seminal vesicle|seminal gland"), ("prostate", r"prostate"), ("bulbourethral gland", r"bulbourethral"), ("penis", r"penis|corpus cavernosum|corpus spongiosum")],
    "reproductive_female": [("ovary", r"ovary"), ("uterine tube", r"uterine tube|fallopian"), ("uterus", r"uterus|myometrium|endometrium"), ("cervix", r"cervix"), ("vagina", r"vagina"), ("mammary gland", r"mammary|breast")],
    "sensory": [("eye", r"eyeball|sclera|cornea|retina"), ("ear", r"cochlea|tympanic|auricle|malleus|incus|stapes|semicircular"), ("nose", r"nasal"), ("tongue", r"tongue"), ("skin", r"\bskin\b|^SURFACE:")],
}
res = {}
for body in ("HUMAN.ADULT.MALE", "HUMAN.ADULT.FEMALE"):
    # permukaan tubuh dewasa laki-laki dipecah menjadi region kulit Z-Anatomy; ditandai prefiks agar terhitung sebagai kulit
    names = [("SURFACE:" if r["panacea_system"] == "surface" else "") + r["canonical_name"].lower() for r in S if r["panacea_body_id"] == body]
    out = {}
    for sysn, items in CHECKLIST.items():
        if sysn == "reproductive_male" and body.endswith("FEMALE") or sysn == "reproductive_female" and body.endswith(".MALE"):
            continue
        out[sysn] = {lab: sum(1 for n in names if re.search(p, n)) for lab, p in items}
    res[body] = out
miss = {b: sorted(f"{s}: {lab}" for s, d in v.items() for lab, c in d.items() if c == 0) for b, v in res.items()}
json.dump({"reference": "Body Exposure 2D Organ.png (AI-generated checklist; names only)", "counts": res, "missing": miss},
          open(os.path.join(HERE, "..", "manifest", "reference_coverage.json"), "w"), indent=1)
for b, m in miss.items():
    tot = sum(len(d) for d in res[b].values())
    print(b, f"{tot - len(m)}/{tot} checklist items present; missing:", m)
