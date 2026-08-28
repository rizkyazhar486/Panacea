// ─────────────────────────────────────────────────────────────────────────────
// Katalog obat — zat aktif, bukan merek.
//
// APA YANG BISA DAN TIDAK BISA DIJANJIKAN OLEH BERKAS INI.
//
// Permintaannya "semua obat yang ada di muka bumi". Angka sebenarnya: ada
// puluhan ribu PRODUK obat terdaftar di dunia, dan beberapa ribu ZAT AKTIF
// yang berbeda. Menuliskan semuanya dengan tangan berarti, tak terhindarkan,
// mengarang sebagian — dan di aplikasi medis, dosis yang dikarang bukan
// ketidaknyamanan, ia bahaya. Aturan di aplikasi ini sudah jelas dan tidak
// berubah di sini: yang tidak dapat dipastikan, dikosongkan.
//
// Jadi keluasannya dikejar dengan dua jalan yang berbeda, dan keduanya jujur:
//
//   1. KELUASAN LEWAT REGISTRI, saat daring. Halaman Drug Info memanggil
//      openFDA (label resmi) dan RxNorm (NLM) LEWAT SERVER aplikasi ini.
//      Keduanya memuat pada dasarnya setiap obat yang dipasarkan di Amerika
//      Serikat berikut merek dan sediaannya — jauh melampaui apa pun yang
//      masuk akal untuk ditulis tangan, dan teksnya datang dari labelnya,
//      bukan dari ingatan siapa pun.
//
//   2. KEDALAMAN LEWAT KATALOG INI, selalu. Yang ada di sini adalah zat aktif
//      beserta GOLONGAN, KELOMPOK ATC, dan UNTUK APA ia dipakai. Tidak ada
//      dosis di berkas ini. Dosis hidup di dua tempat yang memang berhak
//      memuatnya: corpus SKDI (golonganObat.ts, sudah berdosis dan
//      dikurasi) dan label resmi dari registri.
//
// TENTANG KODE ATC. Yang ditulis hanya KELOMPOKNYA — huruf golongan anatomi
// dan kelompok terapinya — bukan kode tujuh karakter tiap zat. Kode lengkap
// per zat jumlahnya ribuan dan satu digit yang meleset menunjuk ke zat yang
// sama sekali lain, tanpa ada yang menyadarinya. Kelompoknya cukup untuk
// menavigasi, dan ia benar.
//
// Klasifikasi ATC resmi diterbitkan WHO Collaborating Centre for Drug
// Statistics Methodology; daftar obat esensial diterbitkan WHO. Keduanya
// dapat diperiksa sendiri, dan tautannya ada di layar.
// ─────────────────────────────────────────────────────────────────────────────

export interface Obat {
  /** Nama generik internasional (INN). Ini kuncinya, bukan mereknya. */
  nama: string
  /** Golongan farmakologi, ditulis sebagaimana ia dikenal di klinik. */
  kelas: string
  /** Untuk apa ia dipakai, singkat. */
  untuk: string
  /** Ada pada WHO Model List of Essential Medicines. */
  eml?: boolean
  /** Satu hal yang benar-benar perlu diketahui — keamanan, bukan hiasan. */
  catatan?: string
}

export interface KelompokAtc {
  /** Huruf golongan anatomi ATC. */
  huruf: string
  /** Nama golongan anatominya. */
  judul: string
  emoji: string
  /** Kelompok terapi di dalamnya. */
  sub: { nama: string; obat: Obat[] }[]
}

import { OBAT_PER_KELUHAN } from './golonganObat'

const o = (nama: string, kelas: string, untuk: string, eml?: boolean, catatan?: string): Obat =>
  ({ nama, kelas, untuk, ...(eml ? { eml: true } : {}), ...(catatan ? { catatan } : {}) })

export const ATC: KelompokAtc[] = [
  {
    huruf: 'A', judul: 'Alimentary tract and metabolism', emoji: '🍽️',
    sub: [
      { nama: 'A02 — Acid-related disorders', obat: [
        o('Omeprazole', 'Proton pump inhibitor', 'Peptic ulcer, GORD, H. pylori regimens', true, 'Long-term use is associated with hypomagnesaemia and B12 deficiency; review the indication periodically.'),
        o('Esomeprazole', 'Proton pump inhibitor', 'GORD, erosive oesophagitis'),
        o('Lansoprazole', 'Proton pump inhibitor', 'Peptic ulcer, GORD'),
        o('Pantoprazole', 'Proton pump inhibitor', 'GORD, stress ulcer prophylaxis'),
        o('Rabeprazole', 'Proton pump inhibitor', 'GORD, peptic ulcer'),
        o('Ranitidine', 'H2 receptor antagonist', 'Acid suppression', false, 'Withdrawn or restricted in many countries after NDMA contamination findings — check local status.'),
        o('Famotidine', 'H2 receptor antagonist', 'Acid suppression', true),
        o('Cimetidine', 'H2 receptor antagonist', 'Acid suppression', false, 'A potent CYP450 inhibitor — the interaction burden is the reason it is rarely first choice now.'),
        o('Sucralfate', 'Mucosal protectant', 'Ulcer healing, stress ulcer prophylaxis'),
        o('Aluminium hydroxide', 'Antacid', 'Symptomatic dyspepsia'),
        o('Magnesium hydroxide', 'Antacid', 'Symptomatic dyspepsia, constipation'),
        o('Bismuth subsalicylate', 'Mucosal protectant', 'Dyspepsia, H. pylori quadruple therapy'),
        o('Misoprostol', 'Prostaglandin analogue', 'NSAID ulcer prevention; obstetric uses', true, 'Contraindicated in pregnancy when used for ulcer prophylaxis — it causes uterine contraction.'),
      ] },
      { nama: 'A03 — Functional gastrointestinal disorders', obat: [
        o('Hyoscine butylbromide', 'Antimuscarinic antispasmodic', 'Colic, smooth muscle spasm', true),
        o('Mebeverine', 'Direct smooth muscle relaxant', 'Irritable bowel syndrome'),
        o('Drotaverine', 'Phosphodiesterase inhibitor antispasmodic', 'Smooth muscle spasm'),
        o('Metoclopramide', 'Dopamine antagonist prokinetic', 'Nausea, gastroparesis', true, 'Extrapyramidal reactions, especially in the young; duration of use is restricted in most guidance.'),
        o('Domperidone', 'Peripheral dopamine antagonist', 'Nausea, gastroparesis', false, 'QT prolongation — dose and duration are restricted.'),
        o('Simeticone', 'Antifoaming agent', 'Flatulence'),
      ] },
      { nama: 'A04 — Antiemetics', obat: [
        o('Ondansetron', '5-HT3 antagonist', 'Chemotherapy and postoperative nausea', true, 'Dose-dependent QT prolongation.'),
        o('Granisetron', '5-HT3 antagonist', 'Chemotherapy-induced nausea'),
        o('Aprepitant', 'NK1 antagonist', 'Delayed chemotherapy-induced nausea'),
        o('Promethazine', 'Antihistamine antiemetic', 'Nausea, vertigo, sedation'),
        o('Dimenhydrinate', 'Antihistamine antiemetic', 'Motion sickness, vertigo'),
      ] },
      { nama: 'A06 — Laxatives', obat: [
        o('Lactulose', 'Osmotic laxative', 'Constipation; hepatic encephalopathy', true),
        o('Polyethylene glycol', 'Osmotic laxative', 'Constipation, bowel preparation'),
        o('Bisacodyl', 'Stimulant laxative', 'Constipation'),
        o('Senna', 'Stimulant laxative', 'Constipation', true),
        o('Psyllium', 'Bulk-forming laxative', 'Constipation, IBS'),
        o('Docusate', 'Stool softener', 'Constipation'),
      ] },
      { nama: 'A07 — Antidiarrhoeals and intestinal anti-inflammatories', obat: [
        o('Oral rehydration salts', 'Rehydration', 'Dehydration from diarrhoea', true, 'Low-osmolarity ORS is the standard formulation; it treats dehydration, it does not stop the diarrhoea.'),
        o('Zinc sulfate', 'Micronutrient', 'Adjunct in childhood diarrhoea', true),
        o('Loperamide', 'Opioid receptor agonist (gut)', 'Non-infective diarrhoea', false, 'Avoid in bloody diarrhoea or suspected invasive infection, and in young children.'),
        o('Racecadotril', 'Enkephalinase inhibitor', 'Acute secretory diarrhoea'),
        o('Mesalazine', 'Aminosalicylate', 'Ulcerative colitis', true),
        o('Sulfasalazine', 'Aminosalicylate', 'Ulcerative colitis, rheumatoid arthritis', true),
      ] },
      { nama: 'A10 — Drugs used in diabetes', obat: [
        o('Metformin', 'Biguanide', 'Type 2 diabetes — first line', true, 'Withhold around iodinated contrast and in significant renal impairment; lactic acidosis is rare but serious.'),
        o('Gliclazide', 'Sulfonylurea', 'Type 2 diabetes', true, 'Hypoglycaemia risk, particularly in the elderly and in renal impairment.'),
        o('Glibenclamide', 'Sulfonylurea', 'Type 2 diabetes', false, 'Long-acting; the sulfonylurea with the highest hypoglycaemia risk in older people.'),
        o('Glimepiride', 'Sulfonylurea', 'Type 2 diabetes'),
        o('Sitagliptin', 'DPP-4 inhibitor', 'Type 2 diabetes'),
        o('Linagliptin', 'DPP-4 inhibitor', 'Type 2 diabetes', false, 'Not renally cleared, which is why it is chosen in advanced kidney disease.'),
        o('Empagliflozin', 'SGLT2 inhibitor', 'Type 2 diabetes, heart failure, CKD', true, 'Euglycaemic ketoacidosis and genital mycotic infection; withhold during acute illness and before surgery.'),
        o('Dapagliflozin', 'SGLT2 inhibitor', 'Type 2 diabetes, heart failure, CKD'),
        o('Canagliflozin', 'SGLT2 inhibitor', 'Type 2 diabetes, CKD'),
        o('Liraglutide', 'GLP-1 receptor agonist', 'Type 2 diabetes, obesity'),
        o('Semaglutide', 'GLP-1 receptor agonist', 'Type 2 diabetes, obesity'),
        o('Dulaglutide', 'GLP-1 receptor agonist', 'Type 2 diabetes'),
        o('Pioglitazone', 'Thiazolidinedione', 'Type 2 diabetes', false, 'Fluid retention — avoid in heart failure.'),
        o('Acarbose', 'Alpha-glucosidase inhibitor', 'Postprandial hyperglycaemia'),
        o('Insulin human (regular)', 'Short-acting insulin', 'Diabetes; DKA', true),
        o('Insulin isophane (NPH)', 'Intermediate-acting insulin', 'Diabetes', true),
        o('Insulin glargine', 'Long-acting insulin analogue', 'Basal insulin'),
        o('Insulin detemir', 'Long-acting insulin analogue', 'Basal insulin'),
        o('Insulin degludec', 'Ultra-long-acting insulin analogue', 'Basal insulin'),
        o('Insulin aspart', 'Rapid-acting insulin analogue', 'Prandial insulin'),
        o('Insulin lispro', 'Rapid-acting insulin analogue', 'Prandial insulin'),
      ] },
      { nama: 'A11/A12 — Vitamins and minerals', obat: [
        o('Thiamine (B1)', 'Vitamin', 'Deficiency, Wernicke encephalopathy, alcohol use', true, 'Give before glucose in a malnourished patient — glucose first can precipitate Wernicke encephalopathy.'),
        o('Pyridoxine (B6)', 'Vitamin', 'Deficiency; isoniazid-associated neuropathy', true),
        o('Cyanocobalamin (B12)', 'Vitamin', 'B12 deficiency, pernicious anaemia', true),
        o('Folic acid', 'Vitamin', 'Deficiency, pregnancy, methotrexate cover', true),
        o('Ascorbic acid (C)', 'Vitamin', 'Scurvy', true),
        o('Colecalciferol (D3)', 'Vitamin', 'Deficiency, rickets, osteoporosis adjunct', true),
        o('Retinol (A)', 'Vitamin', 'Deficiency, measles adjunct in children', true, 'Teratogenic at high dose — avoid supratherapeutic doses in pregnancy.'),
        o('Phytomenadione (K1)', 'Vitamin', 'Newborn prophylaxis, warfarin reversal', true),
        o('Ferrous sulfate', 'Iron salt', 'Iron deficiency anaemia', true),
        o('Calcium carbonate', 'Mineral', 'Calcium supplementation, antacid'),
        o('Potassium chloride', 'Electrolyte', 'Hypokalaemia', true, 'Never give undiluted intravenously.'),
        o('Magnesium sulfate', 'Electrolyte', 'Eclampsia, severe asthma, torsades', true),
        o('Zinc sulfate (supplement)', 'Mineral', 'Deficiency, diarrhoea in children', true),
        o('Iodine / potassium iodide', 'Mineral', 'Deficiency, thyroid blockade'),
      ] },
    ],
  },
  {
    huruf: 'B', judul: 'Blood and blood-forming organs', emoji: '🩸',
    sub: [
      { nama: 'B01 — Antithrombotics', obat: [
        o('Heparin (unfractionated)', 'Anticoagulant', 'VTE, ACS, extracorporeal circuits', true, 'Monitored by APTT or anti-Xa; protamine reverses it. Watch for heparin-induced thrombocytopenia.'),
        o('Enoxaparin', 'Low molecular weight heparin', 'VTE prophylaxis and treatment, ACS', true, 'Accumulates in renal impairment; dose reduction is required.'),
        o('Fondaparinux', 'Factor Xa inhibitor (indirect)', 'VTE, ACS'),
        o('Warfarin', 'Vitamin K antagonist', 'AF, mechanical valves, VTE', true, 'Narrow therapeutic index, extensive interactions, requires INR monitoring; still first choice with a mechanical valve.'),
        o('Rivaroxaban', 'Direct factor Xa inhibitor', 'Non-valvular AF, VTE'),
        o('Apixaban', 'Direct factor Xa inhibitor', 'Non-valvular AF, VTE'),
        o('Edoxaban', 'Direct factor Xa inhibitor', 'Non-valvular AF, VTE'),
        o('Dabigatran', 'Direct thrombin inhibitor', 'Non-valvular AF, VTE', false, 'Idarucizumab is the specific reversal agent.'),
        o('Aspirin (low dose)', 'Antiplatelet', 'Secondary cardiovascular prevention', true),
        o('Clopidogrel', 'P2Y12 inhibitor', 'ACS, stroke, stenting', true, 'A prodrug — CYP2C19 poor metabolisers get less effect.'),
        o('Ticagrelor', 'P2Y12 inhibitor', 'ACS'),
        o('Prasugrel', 'P2Y12 inhibitor', 'ACS with PCI'),
        o('Alteplase', 'Thrombolytic', 'Ischaemic stroke, PE, STEMI where PCI is unavailable', true),
        o('Tenecteplase', 'Thrombolytic', 'STEMI; increasingly used in stroke'),
        o('Streptokinase', 'Thrombolytic', 'STEMI where newer agents are unavailable'),
        o('Tranexamic acid', 'Antifibrinolytic', 'Trauma haemorrhage, postpartum haemorrhage, menorrhagia', true, 'In trauma and PPH the benefit is time-dependent — early administration is the point.'),
      ] },
      { nama: 'B02/B03 — Haemostatics and antianaemics', obat: [
        o('Protamine sulfate', 'Heparin antagonist', 'Heparin reversal'),
        o('Idarucizumab', 'Monoclonal antibody', 'Dabigatran reversal'),
        o('Prothrombin complex concentrate', 'Clotting factor concentrate', 'Urgent warfarin reversal, major bleeding'),
        o('Erythropoietin (epoetin)', 'Erythropoiesis-stimulating agent', 'Anaemia of chronic kidney disease'),
        o('Ferric carboxymaltose', 'Intravenous iron', 'Iron deficiency where oral iron fails or is not tolerated'),
        o('Hydroxocobalamin', 'Vitamin B12', 'B12 deficiency; cyanide poisoning'),
      ] },
    ],
  },
  {
    huruf: 'C', judul: 'Cardiovascular system', emoji: '🫀',
    sub: [
      { nama: 'C01 — Cardiac therapy', obat: [
        o('Digoxin', 'Cardiac glycoside', 'Rate control in AF, heart failure', true, 'Narrow therapeutic index; toxicity is worsened by hypokalaemia and renal impairment.'),
        o('Amiodarone', 'Class III antiarrhythmic', 'Ventricular and atrial arrhythmia', true, 'Thyroid, pulmonary, hepatic and ocular toxicity with long-term use — monitoring is not optional.'),
        o('Adenosine', 'Antiarrhythmic', 'Termination of SVT', true, 'Very short half-life; warn the patient about the transient chest discomfort.'),
        o('Lidocaine (antiarrhythmic)', 'Class Ib antiarrhythmic', 'Ventricular arrhythmia', true),
        o('Adrenaline (epinephrine)', 'Sympathomimetic', 'Anaphylaxis, cardiac arrest, croup', true, 'In anaphylaxis the route is intramuscular into the anterolateral thigh — delay is the main cause of death.'),
        o('Noradrenaline (norepinephrine)', 'Vasopressor', 'Septic and other vasodilatory shock', true),
        o('Dobutamine', 'Inotrope', 'Cardiogenic shock, low output states'),
        o('Dopamine', 'Vasopressor/inotrope', 'Shock', false, 'More arrhythmia than noradrenaline in septic shock.'),
        o('Vasopressin', 'Vasopressor', 'Septic shock adjunct, diabetes insipidus'),
        o('Milrinone', 'Phosphodiesterase-3 inhibitor', 'Acute decompensated heart failure'),
        o('Glyceryl trinitrate', 'Nitrate', 'Angina, acute pulmonary oedema', true, 'Contraindicated with PDE5 inhibitors — profound hypotension.'),
        o('Isosorbide dinitrate', 'Nitrate', 'Angina prophylaxis', true),
        o('Ivabradine', 'If channel inhibitor', 'Heart failure, angina with high heart rate'),
      ] },
      { nama: 'C02/C03 — Antihypertensives and diuretics', obat: [
        o('Furosemide', 'Loop diuretic', 'Fluid overload, heart failure, oedema', true, 'Ototoxicity with rapid high-dose infusion; watch potassium and magnesium.'),
        o('Bumetanide', 'Loop diuretic', 'Fluid overload'),
        o('Hydrochlorothiazide', 'Thiazide diuretic', 'Hypertension, oedema', true, 'Hyponatraemia and hypokalaemia; also raises urate.'),
        o('Indapamide', 'Thiazide-like diuretic', 'Hypertension'),
        o('Chlortalidone', 'Thiazide-like diuretic', 'Hypertension'),
        o('Spironolactone', 'Mineralocorticoid receptor antagonist', 'Heart failure, ascites, resistant hypertension', true, 'Hyperkalaemia, especially with ACE inhibitors or ARBs and in renal impairment.'),
        o('Eplerenone', 'Mineralocorticoid receptor antagonist', 'Heart failure after MI'),
        o('Finerenone', 'Non-steroidal MRA', 'CKD with type 2 diabetes'),
        o('Amiloride', 'Potassium-sparing diuretic', 'Hypokalaemia with diuretics'),
        o('Acetazolamide', 'Carbonic anhydrase inhibitor', 'Glaucoma, altitude sickness, metabolic alkalosis'),
        o('Mannitol', 'Osmotic diuretic', 'Raised intracranial pressure'),
        o('Methyldopa', 'Central alpha-2 agonist', 'Hypertension in pregnancy', true),
        o('Clonidine', 'Central alpha-2 agonist', 'Hypertension, withdrawal states', false, 'Abrupt cessation causes rebound hypertension.'),
        o('Hydralazine', 'Direct vasodilator', 'Hypertensive emergency, pregnancy', true),
        o('Sodium nitroprusside', 'Direct vasodilator', 'Hypertensive emergency', false, 'Cyanide accumulation with prolonged or high-dose infusion.'),
      ] },
      { nama: 'C07 — Beta blockers', obat: [
        o('Bisoprolol', 'Cardioselective beta blocker', 'Heart failure, hypertension, angina', true),
        o('Metoprolol', 'Cardioselective beta blocker', 'Heart failure, ACS, arrhythmia', true),
        o('Carvedilol', 'Non-selective beta blocker with alpha-1 blockade', 'Heart failure, hypertension'),
        o('Atenolol', 'Cardioselective beta blocker', 'Hypertension, angina', true),
        o('Propranolol', 'Non-selective beta blocker', 'Thyrotoxicosis, tremor, migraine prophylaxis, portal hypertension', true),
        o('Nebivolol', 'Cardioselective beta blocker with nitric oxide effect', 'Hypertension'),
        o('Esmolol', 'Ultra-short-acting beta blocker', 'Perioperative and acute rate control'),
        o('Labetalol', 'Combined alpha and beta blocker', 'Hypertensive emergency, pregnancy', true),
      ] },
      { nama: 'C08 — Calcium channel blockers', obat: [
        o('Amlodipine', 'Dihydropyridine calcium channel blocker', 'Hypertension, angina', true, 'Ankle oedema is dose-related and is not fluid overload.'),
        o('Nifedipine (modified release)', 'Dihydropyridine calcium channel blocker', 'Hypertension, angina, tocolysis', true),
        o('Felodipine', 'Dihydropyridine calcium channel blocker', 'Hypertension'),
        o('Nicardipine', 'Dihydropyridine calcium channel blocker', 'Hypertensive emergency'),
        o('Diltiazem', 'Non-dihydropyridine calcium channel blocker', 'Rate control, angina', false, 'Negative inotrope — avoid combining with a beta blocker intravenously.'),
        o('Verapamil', 'Non-dihydropyridine calcium channel blocker', 'Rate control, SVT', false, 'Contraindicated in heart failure with reduced ejection fraction.'),
      ] },
      { nama: 'C09 — Renin–angiotensin agents', obat: [
        o('Enalapril', 'ACE inhibitor', 'Hypertension, heart failure, CKD', true, 'Cough and angio-oedema; contraindicated in pregnancy.'),
        o('Lisinopril', 'ACE inhibitor', 'Hypertension, heart failure', true),
        o('Ramipril', 'ACE inhibitor', 'Hypertension, heart failure, cardiovascular prevention'),
        o('Captopril', 'ACE inhibitor', 'Hypertension, heart failure'),
        o('Perindopril', 'ACE inhibitor', 'Hypertension, coronary disease'),
        o('Losartan', 'Angiotensin receptor blocker', 'Hypertension, CKD, heart failure', true),
        o('Valsartan', 'Angiotensin receptor blocker', 'Hypertension, heart failure'),
        o('Candesartan', 'Angiotensin receptor blocker', 'Hypertension, heart failure'),
        o('Telmisartan', 'Angiotensin receptor blocker', 'Hypertension'),
        o('Irbesartan', 'Angiotensin receptor blocker', 'Hypertension, diabetic nephropathy'),
        o('Sacubitril/valsartan', 'Angiotensin receptor–neprilysin inhibitor', 'Heart failure with reduced ejection fraction', false, 'A washout period is required when switching from an ACE inhibitor, because of angio-oedema risk.'),
      ] },
      { nama: 'C10 — Lipid modifying agents', obat: [
        o('Simvastatin', 'HMG-CoA reductase inhibitor', 'Hyperlipidaemia, cardiovascular prevention', true, 'The statin with the most interaction restrictions; dose caps apply with several common drugs.'),
        o('Atorvastatin', 'HMG-CoA reductase inhibitor', 'Hyperlipidaemia, cardiovascular prevention', true),
        o('Rosuvastatin', 'HMG-CoA reductase inhibitor', 'Hyperlipidaemia'),
        o('Pravastatin', 'HMG-CoA reductase inhibitor', 'Hyperlipidaemia'),
        o('Ezetimibe', 'Cholesterol absorption inhibitor', 'Add-on lipid lowering'),
        o('Evolocumab', 'PCSK9 inhibitor', 'Familial and refractory hyperlipidaemia'),
        o('Alirocumab', 'PCSK9 inhibitor', 'Refractory hyperlipidaemia'),
        o('Fenofibrate', 'Fibrate', 'Hypertriglyceridaemia'),
        o('Gemfibrozil', 'Fibrate', 'Hypertriglyceridaemia', false, 'Markedly raises statin myopathy risk when combined.'),
      ] },
    ],
  },
  {
    huruf: 'D', judul: 'Dermatologicals', emoji: '🧴',
    sub: [
      { nama: 'D01 — Antifungals for dermatological use', obat: [
        o('Clotrimazole (topical)', 'Imidazole antifungal', 'Dermatophytosis, candidiasis', true),
        o('Miconazole (topical)', 'Imidazole antifungal', 'Dermatophytosis, candidiasis', true),
        o('Ketoconazole (topical)', 'Imidazole antifungal', 'Seborrhoeic dermatitis, tinea versicolor'),
        o('Terbinafine (topical)', 'Allylamine antifungal', 'Dermatophytosis'),
        o('Nystatin (topical)', 'Polyene antifungal', 'Cutaneous and mucosal candidiasis', true),
      ] },
      { nama: 'D06/D07 — Antibiotics and corticosteroids for topical use', obat: [
        o('Mupirocin', 'Topical antibacterial', 'Impetigo, nasal staphylococcal carriage', true),
        o('Fusidic acid (topical)', 'Topical antibacterial', 'Localised skin infection'),
        o('Silver sulfadiazine', 'Topical antibacterial', 'Burn wounds', true),
        o('Hydrocortisone (topical)', 'Mild topical corticosteroid', 'Eczema, dermatitis', true),
        o('Betamethasone valerate', 'Potent topical corticosteroid', 'Inflammatory dermatoses', true),
        o('Clobetasol propionate', 'Very potent topical corticosteroid', 'Resistant dermatoses', false, 'Skin atrophy and systemic absorption with prolonged use or occlusion.'),
        o('Mometasone furoate', 'Potent topical corticosteroid', 'Eczema, psoriasis'),
      ] },
      { nama: 'D05/D10/D11 — Other dermatologicals', obat: [
        o('Calcipotriol', 'Vitamin D analogue', 'Plaque psoriasis'),
        o('Coal tar', 'Keratoplastic', 'Psoriasis, chronic eczema'),
        o('Benzoyl peroxide', 'Topical antibacterial/keratolytic', 'Acne vulgaris', true),
        o('Adapalene', 'Topical retinoid', 'Acne vulgaris'),
        o('Tretinoin (topical)', 'Topical retinoid', 'Acne, photoageing'),
        o('Isotretinoin (oral)', 'Systemic retinoid', 'Severe nodulocystic acne', false, 'Powerfully teratogenic — pregnancy prevention programmes are mandatory.'),
        o('Permethrin', 'Topical scabicide/pediculicide', 'Scabies, head lice', true),
        o('Benzyl benzoate', 'Topical scabicide', 'Scabies', true),
        o('Ivermectin (topical)', 'Topical antiparasitic', 'Scabies, rosacea'),
        o('Tacrolimus (topical)', 'Topical calcineurin inhibitor', 'Atopic dermatitis on face and flexures'),
      ] },
    ],
  },
  {
    huruf: 'G', judul: 'Genito-urinary system and sex hormones', emoji: '⚕️',
    sub: [
      { nama: 'G01/G02 — Gynaecological anti-infectives and obstetric agents', obat: [
        o('Metronidazole (vaginal)', 'Nitroimidazole', 'Bacterial vaginosis, trichomoniasis'),
        o('Clotrimazole (vaginal)', 'Imidazole antifungal', 'Vulvovaginal candidiasis', true),
        o('Oxytocin', 'Uterotonic', 'Labour augmentation, postpartum haemorrhage', true, 'First-line uterotonic for PPH prophylaxis and treatment.'),
        o('Misoprostol (obstetric)', 'Prostaglandin E1 analogue', 'PPH where oxytocin is unavailable, cervical ripening', true),
        o('Carbetocin', 'Long-acting oxytocin analogue', 'PPH prophylaxis at caesarean section', true),
        o('Ergometrine', 'Ergot alkaloid uterotonic', 'Postpartum haemorrhage', true, 'Contraindicated in hypertension and pre-eclampsia.'),
        o('Nifedipine (tocolysis)', 'Calcium channel blocker', 'Tocolysis in preterm labour', true),
        o('Betamethasone (antenatal)', 'Corticosteroid', 'Fetal lung maturation before preterm birth', true),
      ] },
      { nama: 'G03 — Sex hormones and contraception', obat: [
        o('Ethinylestradiol/levonorgestrel', 'Combined oral contraceptive', 'Contraception', true, 'Contraindicated with migraine with aura and in high VTE risk.'),
        o('Levonorgestrel (progestogen only)', 'Progestogen', 'Contraception; emergency contraception', true),
        o('Ulipristal acetate', 'Selective progesterone receptor modulator', 'Emergency contraception'),
        o('Medroxyprogesterone acetate (depot)', 'Injectable progestogen', 'Contraception', true),
        o('Etonogestrel implant', 'Progestogen implant', 'Long-acting contraception', true),
        o('Estradiol', 'Oestrogen', 'Menopausal symptoms, hypogonadism'),
        o('Testosterone', 'Androgen', 'Male hypogonadism', true),
        o('Clomifene', 'Selective oestrogen receptor modulator', 'Ovulation induction'),
        o('Mifepristone', 'Antiprogestogen', 'Medical abortion, where legally permitted', true),
      ] },
      { nama: 'G04 — Urologicals', obat: [
        o('Tamsulosin', 'Alpha-1 blocker', 'Benign prostatic hyperplasia', true, 'Intraoperative floppy iris syndrome — tell the ophthalmologist before cataract surgery.'),
        o('Finasteride', '5-alpha reductase inhibitor', 'BPH, androgenetic alopecia'),
        o('Dutasteride', '5-alpha reductase inhibitor', 'BPH'),
        o('Sildenafil', 'PDE5 inhibitor', 'Erectile dysfunction, pulmonary hypertension', true, 'Absolutely contraindicated with nitrates.'),
        o('Tadalafil', 'PDE5 inhibitor', 'Erectile dysfunction, BPH'),
        o('Oxybutynin', 'Antimuscarinic', 'Overactive bladder', false, 'Anticholinergic burden — a common cause of confusion in the elderly.'),
        o('Solifenacin', 'Antimuscarinic', 'Overactive bladder'),
        o('Mirabegron', 'Beta-3 agonist', 'Overactive bladder'),
        o('Desmopressin', 'Vasopressin analogue', 'Diabetes insipidus, nocturnal enuresis', true, 'Hyponatraemia if fluid intake is not restricted.'),
      ] },
    ],
  },
  {
    huruf: 'H', judul: 'Systemic hormonal preparations', emoji: '🧬',
    sub: [
      { nama: 'H02 — Corticosteroids for systemic use', obat: [
        o('Prednisolone', 'Glucocorticoid', 'Inflammatory and autoimmune disease, asthma exacerbation', true, 'Do not stop abruptly after prolonged courses — adrenal suppression.'),
        o('Dexamethasone', 'Glucocorticoid', 'Cerebral oedema, croup, antenatal lung maturation, COVID-19 with hypoxia', true),
        o('Hydrocortisone (systemic)', 'Glucocorticoid with mineralocorticoid activity', 'Adrenal crisis, anaphylaxis adjunct', true),
        o('Methylprednisolone', 'Glucocorticoid', 'Pulse therapy in severe inflammatory disease'),
        o('Fludrocortisone', 'Mineralocorticoid', 'Adrenal insufficiency, orthostatic hypotension', true),
      ] },
      { nama: 'H03 — Thyroid therapy', obat: [
        o('Levothyroxine', 'Thyroid hormone', 'Hypothyroidism', true, 'Absorption is reduced by iron, calcium and PPIs — separate the doses.'),
        o('Carbimazole', 'Antithyroid agent', 'Hyperthyroidism', false, 'Agranulocytosis — any sore throat or fever needs an urgent full blood count.'),
        o('Propylthiouracil', 'Antithyroid agent', 'Hyperthyroidism, first trimester, thyroid storm', true, 'Hepatotoxicity limits its use outside those indications.'),
      ] },
      { nama: 'H01/H05 — Pituitary, hypothalamic and calcium homeostasis', obat: [
        o('Octreotide', 'Somatostatin analogue', 'Variceal bleeding, acromegaly, neuroendocrine tumours'),
        o('Somatropin', 'Growth hormone', 'Growth hormone deficiency'),
        o('Alendronic acid', 'Bisphosphonate', 'Osteoporosis', true, 'Take upright with water and remain upright — oesophageal ulceration otherwise.'),
        o('Zoledronic acid', 'Bisphosphonate', 'Osteoporosis, hypercalcaemia of malignancy, bone metastases'),
        o('Denosumab', 'RANKL inhibitor', 'Osteoporosis, skeletal-related events', false, 'Rebound vertebral fractures if stopped without follow-on therapy.'),
        o('Teriparatide', 'PTH analogue', 'Severe osteoporosis'),
        o('Calcitriol', 'Active vitamin D', 'CKD-mineral bone disorder, hypocalcaemia'),
      ] },
    ],
  },
  {
    huruf: 'J', judul: 'Anti-infectives for systemic use', emoji: '🦠',
    sub: [
      { nama: 'J01C/J01D — Beta-lactams', obat: [
        o('Benzylpenicillin', 'Natural penicillin', 'Streptococcal infection, syphilis, meningococcal disease', true),
        o('Phenoxymethylpenicillin', 'Natural penicillin', 'Streptococcal pharyngitis, rheumatic fever prophylaxis', true),
        o('Benzathine benzylpenicillin', 'Depot penicillin', 'Syphilis, rheumatic fever prophylaxis', true),
        o('Amoxicillin', 'Aminopenicillin', 'Respiratory, ENT and urinary infection; H. pylori', true),
        o('Ampicillin', 'Aminopenicillin', 'Listeria, enterococcal and neonatal sepsis cover', true),
        o('Amoxicillin/clavulanate', 'Aminopenicillin with beta-lactamase inhibitor', 'Beta-lactamase producing organisms, bite wounds, aspiration', true),
        o('Ampicillin/sulbactam', 'Aminopenicillin with beta-lactamase inhibitor', 'Intra-abdominal and skin infection'),
        o('Piperacillin/tazobactam', 'Antipseudomonal penicillin combination', 'Hospital-acquired and neutropenic sepsis', true),
        o('Flucloxacillin', 'Antistaphylococcal penicillin', 'Staphylococcal skin, bone and joint infection'),
        o('Cloxacillin', 'Antistaphylococcal penicillin', 'Staphylococcal infection', true),
        o('Cefazolin', 'First-generation cephalosporin', 'Surgical prophylaxis, staphylococcal infection', true),
        o('Cefalexin', 'First-generation cephalosporin', 'Skin and urinary infection', true),
        o('Cefuroxime', 'Second-generation cephalosporin', 'Respiratory and urinary infection'),
        o('Ceftriaxone', 'Third-generation cephalosporin', 'Meningitis, gonorrhoea, severe community-acquired infection', true, 'Do not co-administer with calcium-containing fluids in neonates.'),
        o('Cefotaxime', 'Third-generation cephalosporin', 'Meningitis, neonatal sepsis', true),
        o('Ceftazidime', 'Third-generation cephalosporin with antipseudomonal activity', 'Pseudomonas infection', true),
        o('Cefepime', 'Fourth-generation cephalosporin', 'Febrile neutropenia, hospital-acquired infection'),
        o('Ceftaroline', 'Fifth-generation cephalosporin', 'MRSA skin and soft tissue infection'),
        o('Ceftazidime/avibactam', 'Cephalosporin with novel beta-lactamase inhibitor', 'Multidrug-resistant Gram-negative infection'),
        o('Meropenem', 'Carbapenem', 'Severe and resistant Gram-negative infection, meningitis', true),
        o('Imipenem/cilastatin', 'Carbapenem', 'Severe polymicrobial infection', true, 'Lowers the seizure threshold more than meropenem.'),
        o('Ertapenem', 'Carbapenem', 'ESBL infection; no antipseudomonal activity'),
        o('Aztreonam', 'Monobactam', 'Gram-negative infection in severe beta-lactam allergy'),
      ] },
      { nama: 'J01A/J01F/J01M — Tetracyclines, macrolides, quinolones', obat: [
        o('Doxycycline', 'Tetracycline', 'Atypical pneumonia, rickettsia, acne, malaria prophylaxis', true, 'Avoid in pregnancy and in young children; photosensitivity.'),
        o('Tetracycline', 'Tetracycline', 'H. pylori quadruple therapy, rickettsia'),
        o('Tigecycline', 'Glycylcycline', 'Complicated intra-abdominal and skin infection'),
        o('Azithromycin', 'Macrolide', 'Atypical pneumonia, chlamydia, trachoma', true, 'QT prolongation.'),
        o('Clarithromycin', 'Macrolide', 'Respiratory infection, H. pylori', true, 'A strong CYP3A4 inhibitor — check the whole medication list.'),
        o('Erythromycin', 'Macrolide', 'Penicillin allergy, pertussis, gastroparesis', true),
        o('Ciprofloxacin', 'Fluoroquinolone', 'Urinary, gastrointestinal and pseudomonal infection', true, 'Tendon rupture, aortic aneurysm and neuropsychiatric effects — reserve where alternatives exist.'),
        o('Levofloxacin', 'Fluoroquinolone', 'Respiratory infection, tuberculosis regimens', true),
        o('Moxifloxacin', 'Fluoroquinolone', 'Respiratory infection, drug-resistant tuberculosis', true),
        o('Ofloxacin', 'Fluoroquinolone', 'Urinary and ophthalmic infection'),
      ] },
      { nama: 'J01G/J01X — Aminoglycosides and others', obat: [
        o('Gentamicin', 'Aminoglycoside', 'Gram-negative sepsis, endocarditis synergy', true, 'Nephrotoxic and ototoxic; levels and renal function must be monitored.'),
        o('Amikacin', 'Aminoglycoside', 'Resistant Gram-negative infection, mycobacteria', true),
        o('Streptomycin', 'Aminoglycoside', 'Tuberculosis, plague, brucellosis'),
        o('Vancomycin', 'Glycopeptide', 'MRSA, C. difficile (oral)', true, 'Infusion-related reaction with rapid administration; trough or AUC monitoring required.'),
        o('Teicoplanin', 'Glycopeptide', 'Gram-positive infection'),
        o('Linezolid', 'Oxazolidinone', 'MRSA, VRE, drug-resistant tuberculosis', true, 'Myelosuppression and serotonin syndrome risk with serotonergic drugs.'),
        o('Daptomycin', 'Lipopeptide', 'MRSA bacteraemia, skin infection', false, 'Inactivated by pulmonary surfactant — not for pneumonia.'),
        o('Clindamycin', 'Lincosamide', 'Anaerobic, skin and dental infection, toxin suppression', true, 'Classically associated with C. difficile colitis.'),
        o('Metronidazole', 'Nitroimidazole', 'Anaerobic infection, amoebiasis, giardiasis, C. difficile', true, 'Disulfiram-like reaction with alcohol.'),
        o('Nitrofurantoin', 'Urinary antibacterial', 'Uncomplicated lower urinary tract infection', true, 'Ineffective when renal function is poor; avoid at term in pregnancy.'),
        o('Fosfomycin', 'Phosphonic acid antibacterial', 'Uncomplicated urinary tract infection'),
        o('Trimethoprim/sulfamethoxazole', 'Folate pathway inhibitor combination', 'Urinary infection, PCP prophylaxis and treatment', true, 'Hyperkalaemia and rash; interacts with warfarin and methotrexate.'),
        o('Chloramphenicol', 'Amphenicol', 'Meningitis and typhoid where alternatives are unavailable', true, 'Aplastic anaemia and grey baby syndrome.'),
        o('Colistin', 'Polymyxin', 'Multidrug-resistant Gram-negative infection', false, 'Nephrotoxicity; a last-line agent.'),
      ] },
      { nama: 'J04 — Antimycobacterials', obat: [
        o('Isoniazid', 'Antituberculosis agent', 'Tuberculosis treatment and preventive therapy', true, 'Peripheral neuropathy prevented with pyridoxine; hepatotoxicity.'),
        o('Rifampicin', 'Antituberculosis agent', 'Tuberculosis, leprosy, staphylococcal bone infection', true, 'A powerful enzyme inducer — it fails oral contraceptives and many other drugs; orange body fluids.'),
        o('Pyrazinamide', 'Antituberculosis agent', 'Tuberculosis intensive phase', true, 'Hepatotoxicity and hyperuricaemia.'),
        o('Ethambutol', 'Antituberculosis agent', 'Tuberculosis intensive phase', true, 'Optic neuritis — check colour vision.'),
        o('Bedaquiline', 'Diarylquinoline', 'Multidrug-resistant tuberculosis', true, 'QT prolongation.'),
        o('Delamanid', 'Nitroimidazole', 'Multidrug-resistant tuberculosis'),
        o('Dapsone', 'Sulfone', 'Leprosy, dermatitis herpetiformis, PCP prophylaxis', true, 'Haemolysis in G6PD deficiency; methaemoglobinaemia.'),
        o('Clofazimine', 'Riminophenazine', 'Leprosy, drug-resistant tuberculosis', true),
      ] },
      { nama: 'J02 — Antifungals for systemic use', obat: [
        o('Fluconazole', 'Triazole antifungal', 'Candidiasis, cryptococcal meningitis', true, 'Teratogenic at high dose; QT prolongation.'),
        o('Itraconazole', 'Triazole antifungal', 'Dermatophytosis, aspergillosis, histoplasmosis'),
        o('Voriconazole', 'Triazole antifungal', 'Invasive aspergillosis', false, 'Visual disturbance and extensive CYP interactions.'),
        o('Posaconazole', 'Triazole antifungal', 'Prophylaxis in neutropenia, mucormycosis'),
        o('Amphotericin B', 'Polyene antifungal', 'Severe systemic mycoses, cryptococcal meningitis, leishmaniasis', true, 'Nephrotoxicity and infusion reactions; the liposomal formulation is less toxic.'),
        o('Caspofungin', 'Echinocandin', 'Invasive candidiasis'),
        o('Micafungin', 'Echinocandin', 'Invasive candidiasis'),
        o('Griseofulvin', 'Antifungal', 'Tinea capitis', true),
        o('Terbinafine (oral)', 'Allylamine antifungal', 'Onychomycosis, dermatophytosis', true),
        o('Flucytosine', 'Antimetabolite antifungal', 'Cryptococcal meningitis with amphotericin', true),
      ] },
      { nama: 'J05 — Antivirals', obat: [
        o('Aciclovir', 'Nucleoside analogue', 'Herpes simplex, varicella zoster, encephalitis', true, 'Adequate hydration prevents crystal nephropathy.'),
        o('Valaciclovir', 'Nucleoside analogue prodrug', 'Herpes simplex and zoster'),
        o('Ganciclovir', 'Nucleoside analogue', 'CMV disease', false, 'Myelosuppression.'),
        o('Valganciclovir', 'Nucleoside analogue prodrug', 'CMV prophylaxis and treatment', true),
        o('Oseltamivir', 'Neuraminidase inhibitor', 'Influenza', true),
        o('Remdesivir', 'RNA polymerase inhibitor', 'COVID-19'),
        o('Nirmatrelvir/ritonavir', 'Protease inhibitor combination', 'COVID-19 in high-risk outpatients', false, 'Very extensive drug interactions through ritonavir.'),
        o('Tenofovir disoproxil', 'Nucleotide reverse transcriptase inhibitor', 'HIV, hepatitis B', true, 'Renal and bone toxicity with long-term use.'),
        o('Tenofovir alafenamide', 'Nucleotide reverse transcriptase inhibitor', 'HIV, hepatitis B'),
        o('Emtricitabine', 'Nucleoside reverse transcriptase inhibitor', 'HIV', true),
        o('Lamivudine', 'Nucleoside reverse transcriptase inhibitor', 'HIV, hepatitis B', true),
        o('Zidovudine', 'Nucleoside reverse transcriptase inhibitor', 'HIV, prevention of mother-to-child transmission', true, 'Anaemia and myopathy.'),
        o('Abacavir', 'Nucleoside reverse transcriptase inhibitor', 'HIV', true, 'Hypersensitivity linked to HLA-B*57:01 — test before starting.'),
        o('Dolutegravir', 'Integrase strand transfer inhibitor', 'HIV — first line', true),
        o('Raltegravir', 'Integrase strand transfer inhibitor', 'HIV'),
        o('Efavirenz', 'Non-nucleoside reverse transcriptase inhibitor', 'HIV', true, 'Neuropsychiatric effects, worse if taken with food.'),
        o('Nevirapine', 'Non-nucleoside reverse transcriptase inhibitor', 'HIV', false, 'Severe rash and hepatotoxicity during the lead-in period.'),
        o('Ritonavir', 'Protease inhibitor / pharmacokinetic booster', 'HIV, boosting'),
        o('Lopinavir/ritonavir', 'Protease inhibitor combination', 'HIV', true),
        o('Sofosbuvir', 'NS5B polymerase inhibitor', 'Hepatitis C', true),
        o('Sofosbuvir/velpatasvir', 'Pan-genotypic direct-acting antiviral', 'Hepatitis C', true),
        o('Daclatasvir', 'NS5A inhibitor', 'Hepatitis C', true),
        o('Entecavir', 'Nucleoside analogue', 'Chronic hepatitis B', true),
      ] },
      { nama: 'J06/J07 — Immune sera and vaccines', obat: [
        o('Tetanus immunoglobulin', 'Immune globulin', 'Tetanus-prone wounds, tetanus treatment', true),
        o('Rabies immunoglobulin', 'Immune globulin', 'Category III rabies exposure', true),
        o('Hepatitis B immunoglobulin', 'Immune globulin', 'Post-exposure prophylaxis', true),
        o('Anti-D immunoglobulin', 'Immune globulin', 'Rhesus prophylaxis', true),
        o('BCG vaccine', 'Live attenuated vaccine', 'Tuberculosis prevention', true),
        o('Measles-mumps-rubella vaccine', 'Live attenuated vaccine', 'MMR immunisation', true, 'Live — avoid in pregnancy and significant immunosuppression.'),
        o('Diphtheria-tetanus-pertussis vaccine', 'Combination vaccine', 'Routine childhood immunisation', true),
        o('Hepatitis B vaccine', 'Recombinant vaccine', 'Hepatitis B prevention', true),
        o('Polio vaccine (IPV/OPV)', 'Vaccine', 'Poliomyelitis prevention', true),
        o('Human papillomavirus vaccine', 'Recombinant vaccine', 'Cervical cancer prevention', true),
        o('Pneumococcal conjugate vaccine', 'Conjugate vaccine', 'Pneumococcal disease prevention', true),
        o('Rotavirus vaccine', 'Live attenuated vaccine', 'Rotavirus gastroenteritis prevention', true),
        o('Influenza vaccine', 'Inactivated vaccine', 'Seasonal influenza prevention', true),
        o('Rabies vaccine', 'Inactivated vaccine', 'Pre- and post-exposure prophylaxis', true),
        o('Typhoid vaccine', 'Vaccine', 'Typhoid prevention', true),
      ] },
    ],
  },
  {
    huruf: 'L', judul: 'Antineoplastic and immunomodulating agents', emoji: '🎗️',
    sub: [
      { nama: 'L01 — Cytotoxic chemotherapy', obat: [
        o('Cyclophosphamide', 'Alkylating agent', 'Lymphoma, breast cancer, vasculitis, lupus nephritis', true, 'Haemorrhagic cystitis, prevented with mesna and hydration.'),
        o('Ifosfamide', 'Alkylating agent', 'Sarcoma, germ cell tumours'),
        o('Cisplatin', 'Platinum compound', 'Testicular, lung, head and neck cancer', true, 'Nephrotoxic, ototoxic and intensely emetogenic.'),
        o('Carboplatin', 'Platinum compound', 'Ovarian and lung cancer', true),
        o('Oxaliplatin', 'Platinum compound', 'Colorectal cancer', true, 'Cold-induced peripheral neuropathy.'),
        o('Methotrexate', 'Antifolate', 'Leukaemia, lymphoma; low dose in rheumatoid arthritis and psoriasis', true, 'Weekly dosing in rheumatology — daily dosing by error has killed patients. Folic acid supplementation is standard.'),
        o('5-Fluorouracil', 'Pyrimidine analogue', 'Colorectal, breast, gastric cancer', true, 'Severe toxicity in DPD deficiency.'),
        o('Capecitabine', 'Oral fluoropyrimidine', 'Colorectal and breast cancer', true),
        o('Cytarabine', 'Pyrimidine analogue', 'Acute myeloid leukaemia', true),
        o('Gemcitabine', 'Pyrimidine analogue', 'Pancreatic, lung and bladder cancer'),
        o('6-Mercaptopurine', 'Purine analogue', 'Acute lymphoblastic leukaemia maintenance', true, 'TPMT and NUDT15 status alters tolerated dose markedly.'),
        o('Azathioprine', 'Purine analogue immunosuppressant', 'Autoimmune disease, transplant', true, 'Severe interaction with allopurinol.'),
        o('Doxorubicin', 'Anthracycline', 'Breast cancer, lymphoma, sarcoma', true, 'Cumulative dose-dependent cardiomyopathy; vesicant on extravasation.'),
        o('Daunorubicin', 'Anthracycline', 'Acute leukaemia', true),
        o('Bleomycin', 'Antitumour antibiotic', 'Germ cell tumours, lymphoma', true, 'Pulmonary fibrosis, worsened by high inspired oxygen.'),
        o('Vincristine', 'Vinca alkaloid', 'Leukaemia, lymphoma', true, 'Fatal if given intrathecally — a never event with mandated safeguards. Peripheral neuropathy.'),
        o('Vinblastine', 'Vinca alkaloid', 'Hodgkin lymphoma, germ cell tumours', true),
        o('Paclitaxel', 'Taxane', 'Breast, ovarian and lung cancer', true, 'Hypersensitivity requires premedication; neuropathy.'),
        o('Docetaxel', 'Taxane', 'Breast, prostate and lung cancer', true),
        o('Etoposide', 'Topoisomerase II inhibitor', 'Lung cancer, germ cell tumours, lymphoma', true),
        o('Irinotecan', 'Topoisomerase I inhibitor', 'Colorectal cancer', false, 'Early cholinergic diarrhoea and late severe diarrhoea are managed differently.'),
        o('Hydroxycarbamide', 'Antimetabolite', 'Sickle cell disease, myeloproliferative disease', true),
      ] },
      { nama: 'L01X — Targeted therapy and immunotherapy', obat: [
        o('Imatinib', 'BCR-ABL tyrosine kinase inhibitor', 'Chronic myeloid leukaemia, GIST', true),
        o('Erlotinib', 'EGFR tyrosine kinase inhibitor', 'EGFR-mutant lung cancer', true),
        o('Osimertinib', 'Third-generation EGFR inhibitor', 'EGFR-mutant lung cancer'),
        o('Trastuzumab', 'Anti-HER2 monoclonal antibody', 'HER2-positive breast and gastric cancer', true, 'Cardiotoxicity — monitor ejection fraction.'),
        o('Rituximab', 'Anti-CD20 monoclonal antibody', 'B-cell lymphoma, autoimmune disease', true, 'Hepatitis B reactivation — screen before starting.'),
        o('Bevacizumab', 'Anti-VEGF monoclonal antibody', 'Colorectal and lung cancer; ophthalmic use', true),
        o('Pembrolizumab', 'PD-1 checkpoint inhibitor', 'Melanoma, lung and other cancers', false, 'Immune-related adverse events can affect any organ and need steroids, not dose reduction alone.'),
        o('Nivolumab', 'PD-1 checkpoint inhibitor', 'Melanoma, lung, renal cancer'),
        o('Ipilimumab', 'CTLA-4 checkpoint inhibitor', 'Melanoma'),
        o('Tamoxifen', 'Selective oestrogen receptor modulator', 'Hormone receptor-positive breast cancer', true, 'Endometrial cancer and VTE risk.'),
        o('Anastrozole', 'Aromatase inhibitor', 'Postmenopausal breast cancer', true),
        o('Letrozole', 'Aromatase inhibitor', 'Breast cancer; ovulation induction'),
        o('Bicalutamide', 'Antiandrogen', 'Prostate cancer', true),
        o('Leuprorelin', 'GnRH agonist', 'Prostate cancer, endometriosis', true),
        o('All-trans retinoic acid', 'Differentiating agent', 'Acute promyelocytic leukaemia', true, 'Differentiation syndrome is a medical emergency.'),
      ] },
      { nama: 'L04 — Immunosuppressants', obat: [
        o('Ciclosporin', 'Calcineurin inhibitor', 'Transplant, severe autoimmune disease', true, 'Nephrotoxicity, hypertension, gingival hyperplasia; levels required.'),
        o('Tacrolimus', 'Calcineurin inhibitor', 'Transplant rejection prophylaxis', true),
        o('Mycophenolate mofetil', 'Antimetabolite immunosuppressant', 'Transplant, lupus nephritis', false, 'Teratogenic — pregnancy prevention required.'),
        o('Sirolimus', 'mTOR inhibitor', 'Transplant'),
        o('Adalimumab', 'Anti-TNF monoclonal antibody', 'Rheumatoid arthritis, IBD, psoriasis', true, 'Screen for latent tuberculosis and hepatitis B before starting.'),
        o('Infliximab', 'Anti-TNF monoclonal antibody', 'IBD, rheumatoid arthritis', true),
        o('Etanercept', 'TNF receptor fusion protein', 'Rheumatoid arthritis, psoriasis'),
        o('Tocilizumab', 'IL-6 receptor antagonist', 'Rheumatoid arthritis, giant cell arteritis, cytokine release syndrome'),
        o('Ustekinumab', 'IL-12/23 inhibitor', 'Psoriasis, Crohn disease'),
        o('Tofacitinib', 'JAK inhibitor', 'Rheumatoid arthritis, ulcerative colitis', false, 'Cardiovascular and malignancy signals restrict use in older patients with risk factors.'),
        o('Natalizumab', 'Anti-integrin monoclonal antibody', 'Multiple sclerosis', false, 'Progressive multifocal leukoencephalopathy risk, stratified by JC virus status.'),
      ] },
    ],
  },
  {
    huruf: 'M', judul: 'Musculo-skeletal system', emoji: '🦴',
    sub: [
      { nama: 'M01 — Anti-inflammatory and antirheumatic', obat: [
        o('Ibuprofen', 'NSAID', 'Pain, fever, inflammation', true, 'Gastrointestinal, renal and cardiovascular risk; avoid in the third trimester.'),
        o('Naproxen', 'NSAID', 'Musculoskeletal pain, gout', true, 'The NSAID with the most favourable cardiovascular profile at usual doses.'),
        o('Diclofenac', 'NSAID', 'Musculoskeletal pain', false, 'Higher cardiovascular risk than other non-selective NSAIDs.'),
        o('Indometacin', 'NSAID', 'Gout, patent ductus arteriosus', true),
        o('Ketorolac', 'NSAID', 'Short-term severe pain', false, 'Duration strictly limited by bleeding and renal risk.'),
        o('Meloxicam', 'Preferential COX-2 NSAID', 'Osteoarthritis, rheumatoid arthritis'),
        o('Celecoxib', 'Selective COX-2 inhibitor', 'Arthritis with high GI risk'),
        o('Etoricoxib', 'Selective COX-2 inhibitor', 'Arthritis, gout'),
      ] },
      { nama: 'M03/M04/M05 — Muscle relaxants, gout, bone', obat: [
        o('Suxamethonium', 'Depolarising neuromuscular blocker', 'Rapid sequence intubation', true, 'Hyperkalaemia in burns, denervation and crush injury; malignant hyperthermia trigger.'),
        o('Rocuronium', 'Non-depolarising neuromuscular blocker', 'Intubation, surgical relaxation', false, 'Reversed rapidly by sugammadex.'),
        o('Vecuronium', 'Non-depolarising neuromuscular blocker', 'Surgical relaxation'),
        o('Atracurium', 'Non-depolarising neuromuscular blocker', 'Relaxation in renal or hepatic failure', true),
        o('Neostigmine', 'Acetylcholinesterase inhibitor', 'Reversal of neuromuscular blockade, myasthenia', true),
        o('Sugammadex', 'Selective relaxant binding agent', 'Reversal of rocuronium and vecuronium'),
        o('Baclofen', 'GABA-B agonist', 'Spasticity', false, 'Abrupt withdrawal of intrathecal baclofen is life-threatening.'),
        o('Tizanidine', 'Alpha-2 agonist muscle relaxant', 'Spasticity'),
        o('Allopurinol', 'Xanthine oxidase inhibitor', 'Gout prophylaxis, tumour lysis prevention', true, 'Do not start during an acute attack without cover; severe interaction with azathioprine.'),
        o('Febuxostat', 'Xanthine oxidase inhibitor', 'Gout where allopurinol is unsuitable'),
        o('Colchicine', 'Antimitotic', 'Acute gout, pericarditis, familial Mediterranean fever', true, 'Narrow therapeutic index; toxicity is dose-related and can be fatal.'),
        o('Rasburicase', 'Recombinant urate oxidase', 'Tumour lysis syndrome', false, 'Contraindicated in G6PD deficiency.'),
      ] },
    ],
  },
  {
    huruf: 'N', judul: 'Nervous system', emoji: '🧠',
    sub: [
      { nama: 'N01 — Anaesthetics', obat: [
        o('Propofol', 'Intravenous anaesthetic', 'Induction and maintenance of anaesthesia, sedation', true, 'Hypotension and apnoea; propofol infusion syndrome with prolonged high-dose use.'),
        o('Ketamine', 'NMDA antagonist anaesthetic', 'Induction in shock, analgesia, refractory asthma', true, 'Preserves airway reflexes and blood pressure better than most alternatives.'),
        o('Etomidate', 'Intravenous anaesthetic', 'Induction in haemodynamic instability', false, 'Adrenal suppression after even a single dose.'),
        o('Thiopental', 'Barbiturate anaesthetic', 'Induction, status epilepticus'),
        o('Sevoflurane', 'Inhalational anaesthetic', 'Maintenance; inhalational induction in children'),
        o('Isoflurane', 'Inhalational anaesthetic', 'Maintenance of anaesthesia'),
        o('Nitrous oxide', 'Inhalational analgesic/anaesthetic', 'Labour analgesia, procedural sedation', true, 'Inactivates B12 with repeated exposure.'),
        o('Lidocaine (local)', 'Amide local anaesthetic', 'Infiltration and regional anaesthesia', true),
        o('Bupivacaine', 'Amide local anaesthetic', 'Regional and spinal anaesthesia', true, 'Cardiotoxic on inadvertent intravascular injection; lipid emulsion is the rescue.'),
        o('Ropivacaine', 'Amide local anaesthetic', 'Regional anaesthesia'),
      ] },
      { nama: 'N02 — Analgesics', obat: [
        o('Paracetamol', 'Analgesic and antipyretic', 'Pain and fever — first line', true, 'Hepatotoxic in overdose; acetylcysteine is the antidote and works best given early.'),
        o('Morphine', 'Opioid agonist', 'Moderate to severe pain, cancer pain, breathlessness', true, 'Active metabolites accumulate in renal failure.'),
        o('Fentanyl', 'Synthetic opioid agonist', 'Procedural and severe pain, anaesthesia', true, 'Chest wall rigidity with rapid high-dose administration.'),
        o('Oxycodone', 'Opioid agonist', 'Moderate to severe pain'),
        o('Codeine', 'Weak opioid prodrug', 'Mild to moderate pain, cough', true, 'CYP2D6 ultra-rapid metabolisers are at risk; contraindicated in children after tonsillectomy and in breastfeeding.'),
        o('Tramadol', 'Weak opioid with monoamine reuptake inhibition', 'Moderate pain', false, 'Lowers seizure threshold; serotonin syndrome with other serotonergic drugs.'),
        o('Buprenorphine', 'Partial opioid agonist', 'Pain, opioid dependence', true),
        o('Methadone', 'Opioid agonist', 'Opioid dependence, cancer pain', true, 'Long and variable half-life; QT prolongation.'),
        o('Naloxone', 'Opioid antagonist', 'Opioid overdose reversal', true, 'Shorter-acting than most opioids — repeat dosing or infusion is often needed.'),
        o('Sumatriptan', '5-HT1B/1D agonist', 'Acute migraine', true, 'Avoid in ischaemic heart disease and uncontrolled hypertension.'),
        o('Aspirin (analgesic dose)', 'NSAID', 'Pain, fever', true, 'Avoid in children with viral illness — Reye syndrome.'),
      ] },
      { nama: 'N03 — Antiepileptics', obat: [
        o('Sodium valproate', 'Broad-spectrum antiepileptic', 'Generalised and focal epilepsy, bipolar disorder', true, 'Highly teratogenic and associated with neurodevelopmental harm — restricted in people who can become pregnant.'),
        o('Carbamazepine', 'Sodium channel blocker', 'Focal epilepsy, trigeminal neuralgia', true, 'HLA-B*15:02 and severe cutaneous reactions; a strong enzyme inducer; hyponatraemia.'),
        o('Oxcarbazepine', 'Sodium channel blocker', 'Focal epilepsy'),
        o('Lamotrigine', 'Sodium channel blocker', 'Focal and generalised epilepsy, bipolar depression', true, 'Slow titration is mandatory to reduce the risk of severe rash; valproate raises its levels.'),
        o('Levetiracetam', 'SV2A ligand', 'Focal and generalised epilepsy, status epilepticus', true, 'Behavioural and mood adverse effects.'),
        o('Phenytoin', 'Sodium channel blocker', 'Status epilepticus, focal epilepsy', true, 'Zero-order kinetics — small dose changes cause large level changes; purple glove syndrome.'),
        o('Phenobarbital', 'Barbiturate antiepileptic', 'Epilepsy, neonatal seizures', true),
        o('Topiramate', 'Multiple mechanisms', 'Epilepsy, migraine prophylaxis', false, 'Teratogenic; nephrolithiasis; acute angle-closure glaucoma.'),
        o('Diazepam', 'Benzodiazepine', 'Seizures, muscle spasm, alcohol withdrawal', true),
        o('Lorazepam', 'Benzodiazepine', 'Status epilepticus, agitation', true, 'The benzodiazepine of choice in status epilepticus where available.'),
        o('Midazolam', 'Benzodiazepine', 'Sedation, seizures, buccal route in the community', true),
        o('Ethosuximide', 'T-type calcium channel blocker', 'Absence seizures', true),
      ] },
      { nama: 'N04 — Anti-parkinson drugs', obat: [
        o('Levodopa/carbidopa', 'Dopamine precursor with decarboxylase inhibitor', 'Parkinson disease', true, 'Motor fluctuations and dyskinesia with long-term use; never stop abruptly.'),
        o('Pramipexole', 'Dopamine agonist', 'Parkinson disease, restless legs', false, 'Impulse control disorders — ask about gambling and compulsive behaviour.'),
        o('Ropinirole', 'Dopamine agonist', 'Parkinson disease, restless legs'),
        o('Selegiline', 'MAO-B inhibitor', 'Parkinson disease'),
        o('Entacapone', 'COMT inhibitor', 'Parkinson disease with wearing-off'),
        o('Trihexyphenidyl', 'Antimuscarinic', 'Drug-induced parkinsonism, dystonia', true),
        o('Amantadine', 'Dopaminergic/NMDA agent', 'Dyskinesia in Parkinson disease'),
      ] },
      { nama: 'N05 — Antipsychotics and anxiolytics', obat: [
        o('Haloperidol', 'Typical antipsychotic', 'Psychosis, delirium, acute agitation', true, 'Extrapyramidal effects and QT prolongation.'),
        o('Chlorpromazine', 'Typical antipsychotic', 'Psychosis, intractable hiccup', true),
        o('Fluphenazine decanoate', 'Long-acting typical antipsychotic', 'Maintenance in schizophrenia', true),
        o('Risperidone', 'Atypical antipsychotic', 'Schizophrenia, bipolar mania', true, 'The atypical most likely to raise prolactin.'),
        o('Olanzapine', 'Atypical antipsychotic', 'Schizophrenia, bipolar disorder', true, 'Substantial weight gain and metabolic effects.'),
        o('Quetiapine', 'Atypical antipsychotic', 'Schizophrenia, bipolar disorder, adjunct in depression'),
        o('Aripiprazole', 'Dopamine partial agonist', 'Schizophrenia, bipolar disorder'),
        o('Clozapine', 'Atypical antipsychotic', 'Treatment-resistant schizophrenia', true, 'Agranulocytosis, myocarditis and ileus; mandatory blood monitoring.'),
        o('Lithium carbonate', 'Mood stabiliser', 'Bipolar disorder', true, 'Narrow therapeutic index; levels rise with dehydration, NSAIDs, ACE inhibitors and thiazides.'),
        o('Alprazolam', 'Benzodiazepine', 'Anxiety, panic disorder', false, 'Short-acting and strongly habit-forming.'),
        o('Clonazepam', 'Benzodiazepine', 'Seizures, panic disorder'),
        o('Zolpidem', 'Non-benzodiazepine hypnotic', 'Short-term insomnia', false, 'Complex sleep behaviours; short-term use only.'),
      ] },
      { nama: 'N06 — Antidepressants and dementia drugs', obat: [
        o('Fluoxetine', 'SSRI', 'Depression, anxiety, bulimia', true, 'Long half-life; a strong CYP2D6 inhibitor.'),
        o('Sertraline', 'SSRI', 'Depression, anxiety, PTSD, OCD', true, 'Generally preferred where cardiac disease is present.'),
        o('Escitalopram', 'SSRI', 'Depression, generalised anxiety'),
        o('Citalopram', 'SSRI', 'Depression', false, 'Dose-dependent QT prolongation with a maximum dose limit.'),
        o('Paroxetine', 'SSRI', 'Depression, anxiety disorders', false, 'Marked discontinuation syndrome.'),
        o('Fluvoxamine', 'SSRI', 'OCD, depression'),
        o('Venlafaxine', 'SNRI', 'Depression, generalised anxiety', false, 'Raises blood pressure at higher doses.'),
        o('Duloxetine', 'SNRI', 'Depression, diabetic neuropathic pain'),
        o('Mirtazapine', 'Noradrenergic and specific serotonergic antidepressant', 'Depression with insomnia or weight loss'),
        o('Amitriptyline', 'Tricyclic antidepressant', 'Depression, neuropathic pain, migraine prophylaxis', true, 'Dangerous in overdose — cardiac conduction and seizures.'),
        o('Nortriptyline', 'Tricyclic antidepressant', 'Depression, neuropathic pain'),
        o('Bupropion', 'Noradrenaline-dopamine reuptake inhibitor', 'Depression, smoking cessation', false, 'Lowers the seizure threshold; contraindicated in eating disorders.'),
        o('Donepezil', 'Acetylcholinesterase inhibitor', "Alzheimer's disease", true, 'Bradycardia and syncope.'),
        o('Rivastigmine', 'Acetylcholinesterase inhibitor', "Alzheimer's and Parkinson disease dementia"),
        o('Memantine', 'NMDA antagonist', 'Moderate to severe Alzheimer disease'),
      ] },
      { nama: 'N07 — Other nervous system drugs', obat: [
        o('Nicotine replacement therapy', 'Nicotinic agonist', 'Smoking cessation', true, 'Roughly doubles quit rates compared with willpower alone.'),
        o('Varenicline', 'Nicotinic partial agonist', 'Smoking cessation', true),
        o('Naltrexone', 'Opioid antagonist', 'Alcohol and opioid dependence', true),
        o('Acamprosate', 'Glutamatergic modulator', 'Maintenance of alcohol abstinence'),
        o('Disulfiram', 'Aldehyde dehydrogenase inhibitor', 'Alcohol dependence', false, 'Severe reaction with any alcohol exposure, including in medicines and topical products.'),
        o('Pyridostigmine', 'Acetylcholinesterase inhibitor', 'Myasthenia gravis', true),
        o('Riluzole', 'Glutamate modulator', 'Amyotrophic lateral sclerosis'),
        o('Betahistine', 'Histamine analogue', 'Ménière disease'),
      ] },
    ],
  },
  {
    huruf: 'P', judul: 'Antiparasitic products', emoji: '🪱',
    sub: [
      { nama: 'P01 — Antiprotozoals', obat: [
        o('Artemether/lumefantrine', 'Artemisinin combination therapy', 'Uncomplicated falciparum malaria', true, 'Take with fat-containing food for absorption.'),
        o('Artesunate', 'Artemisinin derivative', 'Severe malaria — first line', true, 'Delayed haemolysis can occur weeks later; follow up the blood count.'),
        o('Dihydroartemisinin/piperaquine', 'Artemisinin combination therapy', 'Uncomplicated malaria', true),
        o('Chloroquine', '4-aminoquinoline', 'Vivax malaria, amoebic liver abscess', true),
        o('Primaquine', '8-aminoquinoline', 'Radical cure of vivax and ovale malaria', true, 'Haemolysis in G6PD deficiency — test before prescribing.'),
        o('Quinine', 'Cinchona alkaloid', 'Malaria where artemisinins are unavailable', true, 'Hypoglycaemia and cinchonism.'),
        o('Atovaquone/proguanil', 'Antimalarial combination', 'Prophylaxis and treatment of falciparum malaria'),
        o('Mefloquine', 'Antimalarial', 'Prophylaxis and treatment', false, 'Neuropsychiatric adverse effects.'),
        o('Tinidazole', 'Nitroimidazole', 'Amoebiasis, giardiasis, trichomoniasis'),
        o('Pentamidine', 'Antiprotozoal', 'Pneumocystis pneumonia, trypanosomiasis, leishmaniasis'),
        o('Miltefosine', 'Alkylphosphocholine', 'Visceral leishmaniasis', true, 'Teratogenic.'),
      ] },
      { nama: 'P02 — Anthelmintics', obat: [
        o('Albendazole', 'Benzimidazole anthelmintic', 'Soil-transmitted helminths, neurocysticercosis, hydatid disease', true),
        o('Mebendazole', 'Benzimidazole anthelmintic', 'Intestinal worms', true),
        o('Ivermectin', 'Avermectin', 'Onchocerciasis, strongyloidiasis, scabies', true, 'Serious reactions in heavy Loa loa co-infection.'),
        o('Praziquantel', 'Anthelmintic', 'Schistosomiasis, tapeworm, liver flukes', true),
        o('Diethylcarbamazine', 'Anthelmintic', 'Lymphatic filariasis', true),
        o('Pyrantel pamoate', 'Depolarising anthelmintic', 'Pinworm, roundworm'),
        o('Niclosamide', 'Anthelmintic', 'Tapeworm infection'),
      ] },
      { nama: 'P03 — Ectoparasiticides', obat: [
        o('Malathion (topical)', 'Organophosphate pediculicide', 'Head lice, scabies'),
        o('Lindane', 'Organochlorine', 'Scabies and lice where alternatives fail', false, 'Neurotoxicity — restricted or withdrawn in many countries.'),
      ] },
    ],
  },
  {
    huruf: 'R', judul: 'Respiratory system', emoji: '🫁',
    sub: [
      { nama: 'R03 — Obstructive airway disease', obat: [
        o('Salbutamol', 'Short-acting beta-2 agonist', 'Asthma and COPD relief, hyperkalaemia', true, 'Reliever-only use in asthma is associated with worse outcomes; inhaled corticosteroid cover is now standard.'),
        o('Terbutaline', 'Short-acting beta-2 agonist', 'Bronchospasm'),
        o('Salmeterol', 'Long-acting beta-2 agonist', 'Asthma with an inhaled corticosteroid, COPD', false, 'Never as monotherapy in asthma.'),
        o('Formoterol', 'Long-acting beta-2 agonist with rapid onset', 'Asthma maintenance and reliever therapy, COPD'),
        o('Ipratropium bromide', 'Short-acting antimuscarinic', 'Acute severe asthma, COPD', true),
        o('Tiotropium', 'Long-acting antimuscarinic', 'COPD, severe asthma'),
        o('Beclometasone', 'Inhaled corticosteroid', 'Asthma maintenance', true),
        o('Budesonide', 'Inhaled corticosteroid', 'Asthma, COPD, croup', true),
        o('Fluticasone', 'Inhaled corticosteroid', 'Asthma, COPD'),
        o('Montelukast', 'Leukotriene receptor antagonist', 'Asthma, allergic rhinitis', false, 'Neuropsychiatric adverse events carry a boxed warning in several countries.'),
        o('Theophylline', 'Methylxanthine', 'Asthma and COPD where other options fail', false, 'Narrow therapeutic index with many interactions.'),
        o('Omalizumab', 'Anti-IgE monoclonal antibody', 'Severe allergic asthma'),
        o('Mepolizumab', 'Anti-IL-5 monoclonal antibody', 'Severe eosinophilic asthma'),
      ] },
      { nama: 'R01/R05/R06 — Nasal, cough and antihistamines', obat: [
        o('Fluticasone (nasal)', 'Intranasal corticosteroid', 'Allergic rhinitis, nasal polyps'),
        o('Mometasone (nasal)', 'Intranasal corticosteroid', 'Allergic rhinitis'),
        o('Oxymetazoline', 'Topical decongestant', 'Nasal congestion', false, 'Rebound congestion if used beyond a few days.'),
        o('Pseudoephedrine', 'Systemic decongestant', 'Nasal congestion', false, 'Raises blood pressure; caution in hypertension and cardiac disease.'),
        o('Dextromethorphan', 'Central antitussive', 'Dry cough'),
        o('Acetylcysteine', 'Mucolytic and antidote', 'Mucus clearance; paracetamol overdose', true),
        o('Ambroxol', 'Mucolytic', 'Productive cough'),
        o('Cetirizine', 'Second-generation antihistamine', 'Allergic rhinitis, urticaria', true),
        o('Loratadine', 'Second-generation antihistamine', 'Allergic rhinitis, urticaria', true),
        o('Fexofenadine', 'Second-generation antihistamine', 'Allergic rhinitis, urticaria'),
        o('Chlorphenamine', 'First-generation antihistamine', 'Allergic reactions, anaphylaxis adjunct', true, 'Sedating and anticholinergic — never the primary treatment of anaphylaxis.'),
        o('Diphenhydramine', 'First-generation antihistamine', 'Allergy, sedation, dystonic reactions'),
      ] },
    ],
  },
  {
    huruf: 'S', judul: 'Sensory organs', emoji: '👁️',
    sub: [
      { nama: 'S01 — Ophthalmologicals', obat: [
        o('Timolol (eye drops)', 'Topical beta blocker', 'Glaucoma, ocular hypertension', true, 'Systemic absorption can cause bronchospasm and bradycardia.'),
        o('Latanoprost', 'Prostaglandin analogue', 'Glaucoma', true, 'Iris and periocular pigmentation, eyelash growth.'),
        o('Brimonidine', 'Alpha-2 agonist', 'Glaucoma'),
        o('Dorzolamide', 'Topical carbonic anhydrase inhibitor', 'Glaucoma'),
        o('Pilocarpine', 'Muscarinic agonist', 'Acute angle-closure glaucoma', true),
        o('Atropine (ophthalmic)', 'Cycloplegic and mydriatic', 'Uveitis, refraction, myopia control', true),
        o('Tropicamide', 'Short-acting mydriatic', 'Fundus examination'),
        o('Chloramphenicol (eye)', 'Topical antibacterial', 'Bacterial conjunctivitis', true),
        o('Tetracycline (eye ointment)', 'Topical antibacterial', 'Trachoma, neonatal conjunctivitis prophylaxis', true),
        o('Aciclovir (eye ointment)', 'Topical antiviral', 'Herpes simplex keratitis', true),
        o('Prednisolone (eye drops)', 'Topical corticosteroid', 'Ocular inflammation', true, 'Never start topical steroids in an undiagnosed red eye — dendritic ulcer will worsen.'),
        o('Oxybuprocaine', 'Topical anaesthetic', 'Ocular examination and procedures', true, 'For examination only; repeated use delays corneal healing.'),
      ] },
      { nama: 'S02/S03 — Otologicals', obat: [
        o('Ciprofloxacin (ear drops)', 'Topical antibacterial', 'Otitis externa, discharging ear'),
        o('Acetic acid (ear drops)', 'Topical acidifier', 'Otitis externa'),
      ] },
    ],
  },
  {
    huruf: 'V', judul: 'Various — antidotes, contrast, and dialysis', emoji: '🧯',
    sub: [
      { nama: 'V03 — Antidotes and detoxifying agents', obat: [
        o('Acetylcysteine (antidote)', 'Antidote', 'Paracetamol poisoning', true, 'Most effective when started early; the nomogram guides but never delays treatment in a staggered overdose.'),
        o('Activated charcoal', 'Adsorbent', 'Recent oral poisoning', true, 'Useless for iron, lithium, alcohols and corrosives; airway must be protected.'),
        o('Atropine (antidote)', 'Antimuscarinic', 'Organophosphate poisoning, bradycardia', true, 'In organophosphate poisoning the endpoint is drying of secretions, not heart rate.'),
        o('Pralidoxime', 'Cholinesterase reactivator', 'Organophosphate poisoning', true),
        o('Flumazenil', 'Benzodiazepine antagonist', 'Benzodiazepine reversal', false, 'Can precipitate seizures in mixed overdose or dependence — rarely used.'),
        o('Deferoxamine', 'Iron chelator', 'Iron poisoning, iron overload', true),
        o('Calcium gluconate', 'Electrolyte and antidote', 'Hyperkalaemia, magnesium toxicity, hydrofluoric acid burns', true),
        o('Sodium bicarbonate', 'Alkalinising agent', 'Tricyclic overdose, severe acidosis, urinary alkalinisation', true),
        o('Glucagon', 'Hormone and antidote', 'Hypoglycaemia, beta blocker overdose', true),
        o('Methylthioninium chloride (methylene blue)', 'Antidote', 'Methaemoglobinaemia', true, 'Avoid in G6PD deficiency.'),
        o('Fomepizole', 'Alcohol dehydrogenase inhibitor', 'Methanol and ethylene glycol poisoning', true),
        o('Dimercaprol', 'Chelating agent', 'Arsenic, gold and lead poisoning', true),
        o('Penicillamine', 'Chelating agent', 'Wilson disease, copper and lead poisoning', true),
        o('Succimer (DMSA)', 'Chelating agent', 'Lead poisoning', true),
        o('Prussian blue', 'Chelating agent', 'Thallium and caesium poisoning'),
        o('Physostigmine', 'Cholinesterase inhibitor', 'Severe anticholinergic toxicity'),
        o('Digoxin-specific antibody fragments', 'Antidote', 'Digoxin toxicity'),
        o('Lipid emulsion', 'Antidote', 'Local anaesthetic systemic toxicity'),
        o('Hydroxocobalamin (antidote)', 'Antidote', 'Cyanide poisoning'),
        o('Sodium thiosulfate', 'Antidote', 'Cyanide poisoning'),
        o('Naloxone (antidote)', 'Opioid antagonist', 'Opioid overdose', true),
      ] },
      { nama: 'V08 — Contrast media and other', obat: [
        o('Iohexol', 'Iodinated contrast medium', 'CT and angiographic imaging', true, 'Contrast-associated acute kidney injury and reactions; check renal function and allergy history.'),
        o('Gadoterate meglumine', 'Gadolinium contrast medium', 'MRI', false, 'Nephrogenic systemic fibrosis in severe renal impairment.'),
        o('Barium sulfate', 'Contrast medium', 'Gastrointestinal imaging', true, 'Contraindicated where perforation is suspected.'),
        o('Sodium polystyrene sulfonate', 'Potassium binder', 'Hyperkalaemia'),
        o('Sevelamer', 'Phosphate binder', 'Hyperphosphataemia in CKD'),
        o('Calcium polystyrene sulfonate', 'Potassium binder', 'Hyperkalaemia'),
      ] },
    ],
  },
]

/** Semua zat, diratakan, dengan kelompoknya ikut terbawa. */
export function semuaObat(): (Obat & { huruf: string; golongan: string; kelompok: string })[] {
  return ATC.flatMap((g) =>
    g.sub.flatMap((sb) => sb.obat.map((x) => ({ ...x, huruf: g.huruf, golongan: g.judul, kelompok: sb.nama }))),
  )
}

/**
 * Pencarian sederhana atas nama, golongan, dan indikasi.
 *
 * Sengaja TIDAK memakai pencocokan samar. Pada nama obat, kemiripan ejaan
 * adalah bahaya, bukan kemudahan: "clobazam" dan "clonazepam", "chlorpromazine"
 * dan "chlorpropamide" berjarak dekat sekali menurut ukuran jarak teks mana pun,
 * dan menawarkan yang keliru sebagai "mungkin maksud Anda" pada layar obat
 * adalah cara yang sangat rapi untuk menyebabkan kesalahan.
 */
export function cariObat(q: string, batas = 60) {
  const t = q.toLowerCase().trim()
  if (!t) return []
  const semua = semuaObat()
  const awalan = semua.filter((x) => x.nama.toLowerCase().startsWith(t))
  const mengandung = semua.filter(
    (x) => !x.nama.toLowerCase().startsWith(t) &&
      `${x.nama} ${x.kelas} ${x.untuk}`.toLowerCase().includes(t),
  )
  return [...awalan, ...mengandung].slice(0, batas)
}

export function jumlahObat(): number {
  return semuaObat().length
}

export function jumlahEml(): number {
  return semuaObat().filter((x) => x.eml).length
}

/**
 * Ejaan Indonesia untuk nama INN.
 *
 * Corpus SKDI memakai ejaan Indonesia ("Amoksisilin", "Parasetamol",
 * "Seftriakson") sedangkan katalog ini memakai INN. Tanpa jembatan ini,
 * pencarian dosis gagal diam-diam pada obat yang justru paling sering dipakai.
 *
 * DITULIS SATU PER SATU, TIDAK DITEBAK DENGAN ATURAN ALIH-EJAAN. Aturan
 * "c menjadi k" dan sejenisnya bekerja untuk sebagian besar nama lalu gagal
 * pada sebagian kecil — dan pada nama obat, gagal berarti mencocokkan zat yang
 * keliru. Daftar yang ditulis tangan bisa kurang lengkap; ia tidak bisa salah.
 */
export const EJAAN_ID: Record<string, string[]> = {
  'Amoxicillin': ['Amoksisilin'],
  'Paracetamol': ['Parasetamol'],
  'Omeprazole': ['Omeprazol'],
  'Ceftriaxone': ['Seftriakson'],
  'Cefalexin': ['Sefaleksin'],
  'Ciprofloxacin': ['Siprofloksasin'],
  'Azithromycin': ['Azitromisin'],
  'Chloramphenicol': ['Kloramfenikol'],
  'Metronidazole': ['Metronidazol'],
  'Albendazole': ['Albendazol'],
  'Gentamicin': ['Gentamisin'],
  'Captopril': ['Kaptopril'],
  'Amlodipine': ['Amlodipin'],
  'Bisoprolol': ['Bisoprolol'],
  'Furosemide': ['Furosemid'],
  'Hydrochlorothiazide': ['Hidroklorotiazid'],
  'Spironolactone': ['Spironolakton'],
  'Digoxin': ['Digoksin'],
  'Glibenclamide': ['Glibenklamid'],
  'Liraglutide': ['Liraglutid'],
  'Dapagliflozin': ['Dapagliflozin'],
  'Prednisolone': ['Prednison'],
  'Hydrocortisone (systemic)': ['Hidrokortison'],
  'Budesonide': ['Budesonid'],
  'Fluticasone': ['Flutikason'],
  'Ipratropium bromide': ['Ipratropium'],
  'Acetylcysteine': ['Asetilsistein'],
  'Dextromethorphan': ['Dekstrometorfan'],
  'Chlorphenamine': ['Klorfeniramin'],
  'Cetirizine': ['Setirizin'],
  'Diphenhydramine': ['Difenhidramin'],
  'Dimenhydrinate': ['Dimenhidrinat'],
  'Metoclopramide': ['Metoklopramid'],
  'Loperamide': ['Loperamid'],
  'Lactulose': ['Laktulosa'],
  'Bisacodyl': ['Bisakodil'],
  'Psyllium': ['Psilium'],
  'Simeticone': ['Simetikon'],
  'Hyoscine butylbromide': ['Hiosin'],
  'Betahistine': ['Betahistin'],
  'Phenytoin': ['Fenitoin'],
  'Nitrofurantoin': ['Nitrofurantoin'],
  'Ketoconazole (topical)': ['Ketokonazol'],
  'Noradrenaline (norepinephrine)': ['Norepinefrin'],
  'Dobutamine': ['Dobutamin'],
  'Dopamine': ['Dopamin'],
  'Propranolol': ['Propranolol'],
  'Isosorbide dinitrate': ['ISDN'],
  'Oral rehydration salts': ['Oralit'],
  'Pseudoephedrine': ['Pseudoefedrin'],
  'Cyanocobalamin (B12)': ['Mekobalamin'],
  'Zinc sulfate': ['Zinc'],
  'Zinc sulfate (supplement)': ['Zinc'],
}

/**
 * Dosis dari corpus SKDI, bila zat ini memang ada di sana.
 *
 * Dosis TIDAK ditulis di katalog ini — lihat kepala berkas. Tetapi aplikasi ini
 * sudah punya corpus berdosis yang dikurasi (golonganObat.ts), dan membiarkan
 * keduanya terpisah berarti pemakainya menemukan zatnya di satu layar lalu
 * harus mencarinya lagi di layar lain untuk dosis yang sebenarnya sudah ada.
 *
 * Pencocokan dilakukan atas NAMA ZAT di dalam medan `contoh`, dan dilakukan
 * dengan batas kata — bukan dengan `includes` polos. Tanpa batas kata,
 * "Aspirin" cocok dengan "Aspirin-dipiridamol" dan, lebih buruk, potongan nama
 * pendek cocok dengan zat yang sama sekali lain.
 */
export function dosisSkdi(nama: string): { keluhan: string; golongan: string; dosis: string }[] {
  const dasar = nama.replace(/\s*\(.*?\)\s*/g, '').trim()
  const kandidat = [dasar, ...(EJAAN_ID[nama] ?? EJAAN_ID[dasar] ?? [])].filter((x) => x.length >= 4)
  if (!kandidat.length) return []
  const pola = kandidat.map(
    (x) => new RegExp(`(^|[^a-z])${x.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i'),
  )
  const keluar: { keluhan: string; golongan: string; dosis: string }[] = []
  for (const k of OBAT_PER_KELUHAN) {
    for (const g of k.golongan) {
      if (g.dosis && pola.some((r) => r.test(g.contoh))) {
        keluar.push({ keluhan: k.keluhan, golongan: g.nama, dosis: g.dosis })
      }
    }
  }
  return keluar
}

export default ATC
