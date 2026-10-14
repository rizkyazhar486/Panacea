"""Pembangkit GEOMETRI MOLEKUL 3D untuk Panaceamed.

Kenapa dibangkitkan, bukan diunduh: struktur 3D obat harus tersedia walau
peramban sedang tanpa jaringan, dan berkas yang dikirim harus kecil. RDKit
menghitung konformer dari SMILES dengan ETKDG lalu merapikannya dengan medan
gaya MMFF94 — ini kimia sungguhan, bukan bola-bola yang disusun agar terlihat
seperti molekul.

PENJAGA MUTU, dan ini bagian terpenting berkas ini. Tiap molekul membawa RUMUS
dan MASSA MOLEKUL rujukannya sendiri. Skrip menolak menulis molekul yang rumus
atau massanya tidak cocok dengan hitungan RDKit dari SMILES-nya. Jadi SMILES
yang salah ketik — satu ikatan keliru, satu cincin kurang — menghentikan
pembangunan, bukan diam-diam menjadi molekul palsu di layar aplikasi kedokteran.

Jalankan:  python3 scripts/molekul.py
"""

import json
import os
import sys

from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors

RDLogger.DisableLog("rdApp.*")

KELUAR = os.path.join(os.path.dirname(__file__), "..", "public", "molecules")
GEN_TS = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "molecules.gen.ts")

# id, nama INN, SMILES, rumus rujukan, massa molekul rujukan (g/mol)
OBAT = [
    ("aspirin",        "Aspirin",         "CC(=O)Oc1ccccc1C(=O)O",                              "C9H8O4",        180.16),
    ("paracetamol",    "Paracetamol",     "CC(=O)Nc1ccc(O)cc1",                                 "C8H9NO2",       151.16),
    ("ibuprofen",      "Ibuprofen",       "CC(C)Cc1ccc(cc1)C(C)C(=O)O",                         "C13H18O2",      206.28),
    ("metformin",      "Metformin",       "CN(C)C(=N)NC(=N)N",                                  "C4H11N5",       129.16),
    ("atorvastatin",   "Atorvastatin",    "CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CC[C@@H](O)C[C@@H](O)CC(=O)O", "C33H35FN2O5", 558.64),
    ("simvastatin",    "Simvastatin",     "CC[C](C)(C)C(=O)O[C@H]1C[C@H](C)C=C2C=C[C@H](C)[C@H](CC[C@@H]3C[C@@H](O)CC(=O)O3)[C@@H]12", "C25H38O5", 418.57),
    ("amlodipine",     "Amlodipine",      "CCOC(=O)C1=C(COCCN)NC(C)=C(C(=O)OC)C1c1ccccc1Cl",    "C20H25ClN2O5",  408.88),
    ("lisinopril",     "Lisinopril",      "NCCCC[C@H](N[C@@H](CCc1ccccc1)C(=O)O)C(=O)N1CCC[C@H]1C(=O)O", "C21H31N3O5", 405.49),
    ("captopril",      "Captopril",       "CC(CS)C(=O)N1CCC[C@H]1C(=O)O",                       "C9H15NO3S",     217.29),
    ("losartan",       "Losartan",        "CCCCc1nc(Cl)c(CO)n1Cc1ccc(-c2ccccc2-c2nnn[nH]2)cc1", "C22H23ClN6O",   422.91),
    ("furosemide",     "Furosemide",      "NS(=O)(=O)c1cc(C(=O)O)c(NCc2ccco2)cc1Cl",            "C12H11ClN2O5S", 330.74),
    ("hct",            "Hydrochlorothiazide", "NS(=O)(=O)c1cc2c(cc1Cl)NCNS2(=O)=O",             "C7H8ClN3O4S2",  297.74),
    ("spironolactone", "Spironolactone",  "CC(=O)S[C@@H]1CC2=CC(=O)CC[C@]2(C)[C@H]2CC[C@]3(C)[C@@H](CC[C@]34CCC(=O)O4)[C@@H]12", "C24H32O4S", 416.57),
    ("bisoprolol",     "Bisoprolol",      "CC(C)NCC(O)COc1ccc(COCCOC(C)C)cc1",                  "C18H31NO4",     325.44),
    ("propranolol",    "Propranolol",     "CC(C)NCC(O)COc1cccc2ccccc12",                        "C16H21NO2",     259.34),
    ("warfarin",       "Warfarin",        "CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O",              "C19H16O4",      308.33),
    ("clopidogrel",    "Clopidogrel",     "COC(=O)[C@@H](c1ccccc1Cl)N1CCc2sccc2C1",             "C16H16ClNO2S",  321.82),
    ("salbutamol",     "Salbutamol",      "CC(C)(C)NCC(O)c1ccc(O)c(CO)c1",                      "C13H21NO3",     239.31),
    ("prednisolone",   "Prednisolone",    "C[C@]12CC(O)[C@H]3[C@@H](CCC4=CC(=O)C=C[C@]43C)[C@@H]1CC[C@@]2(O)C(=O)CO", "C21H28O5", 360.44),
    ("dexamethasone",  "Dexamethasone",   "C[C@@H]1C[C@H]2[C@@H]3CCC4=CC(=O)C=C[C@]4(C)[C@@]3(F)[C@@H](O)C[C@]2(C)[C@@]1(O)C(=O)CO", "C22H29FO5", 392.46),
    ("omeprazole",     "Omeprazole",      "COc1ccc2[nH]c(S(=O)Cc3ncc(C)c(OC)c3C)nc2c1",         "C17H19N3O3S",   345.42),
    ("amoxicillin",    "Amoxicillin",     "CC1(C)S[C@@H]2[C@H](NC(=O)[C@H](N)c3ccc(O)cc3)C(=O)N2[C@H]1C(=O)O", "C16H19N3O5S", 365.40),
    ("ciprofloxacin",  "Ciprofloxacin",   "O=C(O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O",         "C17H18FN3O3",   331.34),
    ("metronidazole",  "Metronidazole",   "Cc1ncc([N+](=O)[O-])n1CCO",                          "C6H9N3O3",      171.15),
    ("isoniazid",      "Isoniazid",       "NNC(=O)c1ccncc1",                                    "C6H7N3O",       137.14),
    ("allopurinol",    "Allopurinol",     "O=c1[nH]cnc2[nH]ncc12",                              "C5H4N4O",       136.11),
    ("levodopa",       "Levodopa",        "N[C@@H](Cc1ccc(O)c(O)c1)C(=O)O",                     "C9H11NO4",      197.19),
    ("diazepam",       "Diazepam",        "CN1c2ccc(Cl)cc2C(c2ccccc2)=NCC1=O",                  "C16H13ClN2O",   284.74),
    ("haloperidol",    "Haloperidol",     "O=C(CCCN1CCC(O)(c2ccc(Cl)cc2)CC1)c1ccc(F)cc1",       "C21H23ClFNO2",  375.86),
    ("sertraline",     "Sertraline",      "CN[C@H]1CC[C@@H](c2ccc(Cl)c(Cl)c2)c2ccccc21",        "C17H17Cl2N",    306.23),
    ("phenytoin",      "Phenytoin",       "O=C1NC(=O)C(c2ccccc2)(c2ccccc2)N1",                  "C15H12N2O2",    252.27),
    ("morphine",       "Morphine",        "CN1CC[C@]23c4c5ccc(O)c4O[C@H]2[C@H](O)C=C[C@H]3[C@H]1C5", "C17H19NO3", 285.34),
    ("cetirizine",     "Cetirizine",      "OC(=O)COCCN1CCN(C(c2ccccc2)c2ccc(Cl)cc2)CC1",        "C21H25ClN2O3",  388.89),
    ("ondansetron",    "Ondansetron",     "Cc1nccn1CC1CCc2c(c3ccccc3n2C)C1=O",                  "C18H19N3O",     293.36),
]

# Warna unsur mengikuti kesepakatan CPK — kesepakatan yang sama dipakai di
# setiap buku dan setiap penampil molekul, jadi tidak boleh dikarang sendiri.
os.makedirs(KELUAR, exist_ok=True)

meta = []
gagal = []

for kunci, nama, smiles, rumus_rujukan, mm_rujukan in OBAT:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        gagal.append(f"{kunci}: SMILES tidak terbaca")
        continue

    rumus = rdMolDescriptors.CalcMolFormula(mol).replace("+", "").replace("-", "")
    mm = Descriptors.MolWt(mol)
    if rumus != rumus_rujukan:
        gagal.append(f"{kunci}: rumus {rumus} != rujukan {rumus_rujukan}")
        continue
    if abs(mm - mm_rujukan) > 0.5:
        gagal.append(f"{kunci}: massa {mm:.2f} != rujukan {mm_rujukan}")
        continue

    molh = Chem.AddHs(mol)
    params = AllChem.ETKDGv3()
    params.randomSeed = 0xC0FFEE          # konformer yang sama tiap kali dibangun
    if AllChem.EmbedMolecule(molh, params) != 0:
        gagal.append(f"{kunci}: konformer gagal dibentuk")
        continue
    AllChem.MMFFOptimizeMolecule(molh, maxIters=2000)

    conf = molh.GetConformer()
    pos = [conf.GetAtomPosition(i) for i in range(molh.GetNumAtoms())]
    # Dipusatkan pada titik asal supaya kamera penampil tidak perlu tahu apa-apa
    # tentang molekulnya.
    cx = sum(p.x for p in pos) / len(pos)
    cy = sum(p.y for p in pos) / len(pos)
    cz = sum(p.z for p in pos) / len(pos)

    atoms = [[a.GetSymbol(), round(p.x - cx, 3), round(p.y - cy, 3), round(p.z - cz, 3)]
             for a, p in zip(molh.GetAtoms(), pos)]
    bonds = [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(),
              {Chem.BondType.SINGLE: 1, Chem.BondType.DOUBLE: 2,
               Chem.BondType.TRIPLE: 3, Chem.BondType.AROMATIC: 4}.get(b.GetBondType(), 1)]
             for b in molh.GetBonds()]

    with open(os.path.join(KELUAR, f"{kunci}.json"), "w") as f:
        json.dump({"name": nama, "formula": rumus, "atoms": atoms, "bonds": bonds}, f, separators=(",", ":"))

    meta.append({
        "id": kunci, "name": nama, "smiles": smiles, "formula": rumus,
        "mass": round(mm, 2), "atoms": len(atoms), "heavyAtoms": mol.GetNumAtoms(),
        "rings": rdMolDescriptors.CalcNumRings(mol),
        "logP": round(Descriptors.MolLogP(mol), 2),
        "hbd": rdMolDescriptors.CalcNumHBD(mol), "hba": rdMolDescriptors.CalcNumHBA(mol),
        "tpsa": round(rdMolDescriptors.CalcTPSA(mol), 1),
    })

if gagal:
    print("GAGAL — tidak ada berkas ditulis untuk molekul berikut:", file=sys.stderr)
    for g in gagal:
        print("  " + g, file=sys.stderr)
    sys.exit(1)

with open(GEN_TS, "w") as f:
    f.write(
        "// DIBANGKITKAN oleh scripts/molekul.py — jangan disunting tangan.\n"
        "//\n"
        "// Konformer 3D dihitung RDKit (ETKDG + MMFF94) dari SMILES yang tercatat di\n"
        "// skrip itu, dan tiap molekul hanya ditulis setelah rumus serta massa\n"
        "// molekulnya cocok dengan nilai rujukannya. Sifat fisikokimia di bawah ini\n"
        "// dihitung dari struktur yang sama, bukan diketik ulang.\n"
        "export interface MoleculeMeta {\n"
        "  id: string\n"
        "  name: string\n"
        "  smiles: string\n"
        "  formula: string\n"
        "  mass: number\n"
        "  atoms: number\n"
        "  heavyAtoms: number\n"
        "  rings: number\n"
        "  /** Lipofilisitas terhitung (Crippen logP). */\n"
        "  logP: number\n"
        "  hbd: number\n"
        "  hba: number\n"
        "  /** Luas permukaan polar topologis (Å²) — penentu penembusan sawar. */\n"
        "  tpsa: number\n"
        "}\n\n"
        f"export const MOLECULES: MoleculeMeta[] = {json.dumps(meta, indent=2)}\n\n"
        "export const MOLECULE_BY_ID: Record<string, MoleculeMeta> = Object.fromEntries(\n"
        "  MOLECULES.map((m) => [m.id, m]),\n"
        ")\n"
    )

print(f"{len(meta)} molekul ditulis")
for m in meta[:5]:
    print(f"  {m['id']:14} {m['formula']:16} {m['mass']:8.2f}  {m['atoms']:3} atom  logP {m['logP']}")
