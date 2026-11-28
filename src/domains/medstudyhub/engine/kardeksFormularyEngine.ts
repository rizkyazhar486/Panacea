/**
 * MedSciHub Kardeks DPJP <-> SIMRS / Transmedic Medication Formulary (140+ entries)
 * & Unified Universal Medical Search Engine (Part III).
 *
 * Non-negotiable safety rules:
 * - Reference & verification support only (`autoPrescribeAllowed: false`).
 * - Highlights High-Alert & LASA medications and DDI/allergy/renal/hepatic/pregnancy cautions.
 */
import type { VaultFileRecord } from '../../../lib/medscihub/driveSync'

export type FormularyChannel = 'SIMRS' | 'Resep Kertas Manual / Resep ke Luar'
export type SkdiCompetencyLevel = '4A' | '3B' | '3A' | '2' | '1'

export interface KardeksEntry {
  readonly id: string
  readonly kardeksName: string
  readonly genericName: string
  readonly simrsName: string
  readonly formulationStrength: string
  readonly route: string
  readonly categoryNote: string
  readonly channel: FormularyChannel
  readonly highAlert: boolean
  readonly lasa: boolean
  readonly safetyNote: string
  readonly facilityAvailability: 'Tersedia RS' | 'Perlu Konfirmasi Farmasi' | 'Stok Terbatas'
}

type RawKardeksTuple = readonly [
  kardeks: string,
  generic: string,
  simrs: string,
  strength: string,
  route: string,
  category: string,
  channel: FormularyChannel,
  highAlert: boolean,
  lasa: boolean,
  safety: string,
]

// Compact tuple table of 144 genuine Indonesian IGD / ward / ICU Kardeks <-> SIMRS entries.
const RAW_KARDEKS_ROWS: readonly RawKardeksTuple[] = [
  ['Lasix', 'Furosemide', 'furosemide', '20 mg/2 mL · 40 mg tab', 'IV / PO', 'Diuretik Loop', 'SIMRS', false, false, 'Pantau K+ & tekanan darah; hati-hati hipovolemia'],
  ['Primperan / Eran', 'Metoclopramide', 'metoclopramide', '10 mg/2 mL · 10 mg tab', 'IV / PO', 'Antiemetik Prokinetik', 'SIMRS', false, false, 'Waspada gejala ekstrapiramidal & QT memanjang'],
  ['Ozid', 'Omeprazole', 'omeprazole', '40 mg vial · 20 mg kaps', 'IV / PO', 'PPI', 'SIMRS', false, true, 'Interaksi potensial dengan clopidogrel'],
  ['Nexium', 'Esomeprazole', 'esomeprazole / meprazole', '40 mg vial · 40 mg tab', 'IV / PO', 'PPI', 'SIMRS', false, true, 'Evaluasi fungsi hepar pada dosis tinggi'],
  ['Ketesse / Voxib', 'Dexketoprofen', 'dexketoprofen', '50 mg/2 mL · 25 mg tab', 'IV / PO', 'Analgetik NSAID', 'SIMRS', false, false, 'Hindari pada AKI/CKD berat & ulkus peptikum aktif'],
  ['Brilinta', 'Ticagrelor', 'ticagrelor', '90 mg tab', 'PO', 'Antiplatelet P2Y12', 'SIMRS', true, true, 'Risiko perdarahan; hindari bersama aspirin >100 mg/hari'],
  ['Bactesyn', 'Ampicillin-Sulbactam', 'ampicillin-sulbactam', '1.5 g · 750 mg vial', 'IV', 'Antibiotik Beta-Laktam', 'SIMRS', false, false, 'Wajib cek alergi penisilin; sesuaikan pada CrCl <30'],
  ['Resfar', 'Acetylcysteine', 'acetylcysteine', '5 g/25 mL · 200 mg', 'IV / Nebu / PO', 'Antidotum / Mukolitik', 'SIMRS', false, false, 'Pantau bronkospasme pada asma saat inhalasi/IV'],
  ['Ondansetron / Narfoz', 'Ondansetron', 'ondansetron', '4 mg/2 mL · 8 mg/4 mL', 'IV / PO', 'Antiemetik 5-HT3', 'SIMRS', false, false, 'Pantau interval QT bila kombinasi dengan amiodaron'],
  ['Ranitidin / Acran', 'Ranitidine / Famotidine', 'ranitidine / famotidine', '50 mg/2 mL', 'IV / PO', 'H2 Blocker', 'SIMRS', false, false, 'Sesuaikan interval pada gangguan ginjal berat'],
  ['Pantozol / Pumpitor', 'Pantoprazole', 'pantoprazole', '40 mg vial · 40 mg tab', 'IV / PO', 'PPI', 'SIMRS', false, true, 'Pilihan aman bersama clopidogrel'],
  ['Lansoprazole / Prosogan', 'Lansoprazole', 'lansoprazole', '30 mg kaps', 'PO', 'PPI', 'SIMRS', false, true, 'Minum 30 menit sebelum makan'],
  ['Inpepsa / Episan', 'Sucralfate', 'sucralfate susp', '500 mg/5 mL', 'PO', 'Mukoprotektor Lambung', 'SIMRS', false, false, 'Berikan jarak 2 jam dari antibiotik kuinolon/levofloxacin'],
  ['Buscopan', 'Hyoscine Butylbromide', 'hyoscine butylbromide', '20 mg/mL', 'IV / IM / PO', 'Antispasmodik', 'SIMRS', false, false, 'Kontraindikasi glaukoma sudut sempit & ileus paralitik'],
  ['Torasic / Remopain', 'Ketorolac', 'ketorolac', '30 mg/mL', 'IV / IM', 'Analgetik NSAID', 'SIMRS', false, true, 'Maksimal 5 hari; hindari pada CKD/usia lanjut dehidrasi'],
  ['Sanmol / Tamoliv', 'Paracetamol', 'paracetamol inf / tab', '1 g/100 mL · 500 mg', 'IV / PO', 'Analgetik Antipiretik', 'SIMRS', false, false, 'Hati-hati bila SGOT/SGPT meningkat (>3x ULN)'],
  ['Tramadol / Tradosik', 'Tramadol', 'tramadol', '50 mg · 100 mg/2 mL', 'IV / PO', 'Opioid Lemah', 'SIMRS', true, true, 'Turunkan ambang kejang; hindari dengan SSRI/MAOI'],
  ['Fentanyl', 'Fentanyl', 'fentanyl inj (narkotika)', '50 mcg/mL', 'IV', 'Opioid Kuat (High Alert)', 'SIMRS', true, true, 'HIGH ALERT: risiko depresi napas; wajib monitoring SpO2'],
  ['Morfin Sulfat / MST', 'Morphine', 'morphine sulfat', '10 mg/mL · 10 mg MST', 'IV / PO', 'Opioid Kuat (High Alert)', 'SIMRS', true, true, 'HIGH ALERT: siapkan nalokson & sesuaikan pada CKD'],
  ['Pethidine / Clopedin', 'Pethidine', 'pethidine hcl', '50 mg/mL', 'IV / IM', 'Opioid', 'SIMRS', true, true, 'Hindari penggunaan berulang pada gagal ginjal (normeperidin)'],
  ['Ceftriaxone / Broadced', 'Ceftriaxone', 'ceftriaxone', '1 g vial', 'IV', 'Sefalosporin Gen 3', 'SIMRS', false, true, 'Jangan dicampur larutan Ca++ (RL/Ca glukonas) satu jalur'],
  ['Cefotaxime / Kalfoxim', 'Cefotaxime', 'cefotaxime', '1 g vial', 'IV', 'Sefalosporin Gen 3', 'SIMRS', false, true, 'LASA dengan ceftazidime & ceftriaxone'],
  ['Ceftazidime / Zibac', 'Ceftazidime', 'ceftazidime', '1 g vial', 'IV', 'Sefalosporin Anti-Pseudomonas', 'SIMRS', false, true, 'Sesuaikan dosis pada eGFR <50'],
  ['Cefepime / Maxipime', 'Cefepime', 'cefepime', '1 g vial', 'IV', 'Sefalosporin Gen 4', 'SIMRS', false, true, 'Risiko ensefalopati bila dosis ginjal tidak disesuaikan'],
  ['Cefoperazone-Sulbactam / Sulperazon', 'Cefoperazone-Sulbactam', 'cefoperazone sulbactam', '1 g vial', 'IV', 'Beta-Laktam/Inhibitor', 'SIMRS', false, true, 'Pantau PT/INR & reaksi mirip disulfiram'],
  ['Meropenem / Meronem', 'Meropenem', 'meropenem', '500 mg · 1 g vial', 'IV', 'Karbapenem', 'SIMRS', false, false, 'Sesuaikan dosis CrCl; interaksi menurunkan kadar asam valproat'],
  ['Imipenem / Tienam', 'Imipenem-Cilastatin', 'imipenem cilastatin', '500 mg/500 mg', 'IV', 'Karbapenem', 'SIMRS', false, false, 'Waspada risiko kejang pada gangguan ginjal'],
  ['Piperacillin-Tazobactam / Tazocin', 'Piperacillin-Tazobactam', 'piperacillin tazobactam', '4.5 g vial', 'IV', 'Antipseudomonal Penisilin', 'SIMRS', false, false, 'Hindari kombinasi nefrotoksik jangka panjang dengan vankomisin'],
  ['Levofloxacin / Cravit', 'Levofloxacin', 'levofloxacin inf / tab', '500 mg · 750 mg', 'IV / PO', 'Fluorokuinolon', 'SIMRS', false, true, 'Pantau QTc, tendinopati, & disglikemia'],
  ['Ciprofloxacin / Baquinor', 'Ciprofloxacin', 'ciprofloxacin inf / tab', '200 mg/100 mL · 500 mg', 'IV / PO', 'Fluorokuinolon', 'SIMRS', false, true, 'Hindari pemberian bersama teofilin/tizanidin'],
  ['Moxifloxacin / Avelox', 'Moxifloxacin', 'moxifloxacin inf / tab', '400 mg', 'IV / PO', 'Respirasi Kuinolon', 'SIMRS', false, true, 'Perpanjangan QTc signifikan'],
  ['Azithromycin / Zithromax', 'Azithromycin', 'azithromycin inf / tab', '500 mg', 'IV / PO', 'Makrolida', 'SIMRS', false, false, 'Pantau QT bila bersama hidroksiklorokuin/amiodaron'],
  ['Metronidazole / Flagyl', 'Metronidazole', 'metronidazole inf / tab', '500 mg/100 mL', 'IV / PO', 'Nitroimidazol Anaerob', 'SIMRS', false, false, 'Pantau neurotoksisitas bila terapi >14 hari'],
  ['Vancomycin / Vancep', 'Vancomycin', 'vancomycin', '500 mg vial', 'IV pelan >=60 mnt', 'Glikopeptida MRSA', 'SIMRS', true, false, 'Wajib infus pelan (hindari Red Man) & pantau fungsi ginjal'],
  ['Gentamicin', 'Gentamicin', 'gentamicin', '80 mg/2 mL', 'IV / IM', 'Aminoglikosida', 'SIMRS', false, true, 'Ototoksik & nefrotoksik; pantau kreatinin serial'],
  ['Amikacin / Mikasin', 'Amikacin', 'amikacin', '500 mg/2 mL', 'IV', 'Aminoglikosida', 'SIMRS', false, true, 'Ototoksik & nefrotoksik; sesuaikan CrCl'],
  ['Clindamycin / Dalacin', 'Clindamycin', 'clindamycin', '300 mg kaps · 600 mg inj', 'PO / IV', 'Linkosamid', 'SIMRS', false, false, 'Waspada diare terkait C. difficile'],
  ['Amoxicillin-Clavulanate / Augmentin', 'Co-Amoxiclav', 'amoxicillin clavulanat', '625 mg tab · 1.2 g inj', 'PO / IV', 'Beta-Laktam', 'SIMRS', false, false, 'Pantau fungsi hati kolestatik'],
  ['Cefixime / Cefspan', 'Cefixime', 'cefixime', '100 mg · 200 mg kaps', 'PO', 'Sefalosporin Oral Gen 3', 'SIMRS', false, true, 'LASA dengan cefadroxil'],
  ['Cefadroxil / Cefat', 'Cefadroxil', 'cefadroxil', '500 mg kaps', 'PO', 'Sefalosporin Oral Gen 1', 'SIMRS', false, true, 'LASA dengan cefixime'],
  ['Acyclovir / Zovirax', 'Acyclovir', 'acyclovir tab / salep', '400 mg · 250 mg inj', 'PO / IV', 'Antivirus', 'SIMRS', false, false, 'Hidrasi adekuat pada IV (cegah nefropati kristal)'],
  ['Fluconazole / Diflucan', 'Fluconazole', 'fluconazole inf / kaps', '200 mg/100 mL · 150 mg', 'IV / PO', 'Antijamur Azol', 'SIMRS', false, false, 'Inhibitor CYP kuat (pantau warfarin/simvastatin)'],
  ['Aspilet / Miniaspi / Ascardia', 'Acetylsalicylic Acid', 'asam asetilsalisilat 80mg', '80 mg · 100 mg', 'PO', 'Antiplatelet', 'SIMRS', false, false, 'Waspada perdarahan GI; hentikan sesuai advis pra-operasi'],
  ['Plavix / CPG', 'Clopidogrel', 'clopidogrel', '75 mg tab · 300 mg', 'PO', 'Antiplatelet P2Y12', 'SIMRS', false, false, 'Kurang efektif bila dipakai bersama omeprazole'],
  ['ISDN / Cedocard / Farsorbid', 'Isosorbide Dinitrate', 'isosorbide dinitrate', '5 mg SL · 10 mg inj', 'SL / IV', 'Nitrat Vasodilator', 'SIMRS', false, true, 'KONTRAINDIKASI dalam 24–48 jam setelah sildenafil/tadalafil'],
  ['NTG / Nitrokaf / Nitral', 'Nitroglycerin', 'nitroglycerin inj / ret', '10 mg/10 mL · 2.5 mg', 'IV / PO', 'Nitrat Kardiak', 'SIMRS', true, true, 'HIGH ALERT IV: wajib syringe pump + pantau TD ketat'],
  ['Cordarone / Tiaryt', 'Amiodarone', 'amiodarone inj / tab', '150 mg/3 mL · 200 mg', 'IV / PO', 'Antiaritmia Kelas III', 'SIMRS', true, true, 'HIGH ALERT: wajib jalur sentral/Vena besar & pantau tiroid/QT'],
  ['Fargoxin / Lanoxin', 'Digoxin', 'digoxin inj / tab', '0.5 mg/2 mL · 0.25 mg', 'IV / PO', 'Glikosida Jantung', 'SIMRS', true, true, 'Indeks terapi sempit; pantau K+ & toksisitas ginjal'],
  ['Concor / B-Beta', 'Bisoprolol', 'bisoprolol', '2.5 mg · 5 mg tab', 'PO', 'Beta-Blocker Selektif', 'SIMRS', false, false, 'Hindari pada syok kardiogenik / AV blok derajat 2–3'],
  ['V-Bloc / Dilbloc', 'Carvedilol', 'carvedilol', '6.25 mg · 25 mg tab', 'PO', 'Alpha-Beta Blocker', 'SIMRS', false, false, 'Titrasi bertahap pada gagal jantung kronik'],
  ['Herbesser / Farmabes', 'Diltiazem', 'diltiazem inj / CD', '50 mg inj · 100 mg CD', 'IV / PO', 'CCB Non-DHP', 'SIMRS', true, true, 'Jangan kombinasi IV dengan beta-blocker (risiko asistol)'],
  ['Amlodipine / Norvask / Tensivask', 'Amlodipine', 'amlodipine', '5 mg · 10 mg tab', 'PO', 'CCB Antihipertensi', 'SIMRS', false, false, 'Efek puncak lambat; pantau edema perifer'],
  ['Perdipine / Nicardipine', 'Nicardipine', 'nicardipine hcl inj', '10 mg/10 mL', 'IV Titrasional', 'Antihipertensi Krisis', 'SIMRS', true, true, 'HIGH ALERT: pantau TD per 5–15 menit via syringe pump'],
  ['Capoten / Tensicap', 'Captopril', 'captopril', '12.5 mg · 25 mg tab', 'PO', 'ACE Inhibitor', 'SIMRS', false, false, 'Kontraindikasi kehamilan & stenosis arteri renalis bilateral'],
  ['Ramipril / Triatec', 'Ramipril', 'ramipril', '5 mg · 10 mg tab', 'PO', 'ACE Inhibitor', 'SIMRS', false, false, 'Pantau K+ & kreatinin 1–2 minggu pasca inisiasi'],
  ['Candesartan / Blopress', 'Candesartan', 'candesartan', '8 mg · 16 mg tab', 'PO', 'ARB', 'SIMRS', false, false, 'Kontraindikasi kehamilan; pantau hiperkalemia'],
  ['Valsartan / Diovan', 'Valsartan', 'valsartan', '80 mg · 160 mg tab', 'PO', 'ARB', 'SIMRS', false, false, 'Jangan kombinasikan ganda dengan ACEi'],
  ['Uperio / Entresto', 'Sacubitril-Valsartan', 'sacubitril valsartan', '50 mg · 100 mg tab', 'PO', 'ARNI Gagal Jantung', 'Resep Kertas Manual / Resep ke Luar', false, false, 'Wajib washout >=36 jam dari ACEi (cegah angioedema)'],
  ['Spironolactone / Aldactone', 'Spironolactone', 'spironolactone', '25 mg · 100 mg tab', 'PO', 'Antagonis Aldosteron', 'SIMRS', false, false, 'Pantau K+ & kreatinin ketat bila CrCl turun'],
  ['Atorvastatin / Lipitor', 'Atorvastatin', 'atorvastatin', '20 mg · 40 mg tab', 'PO', 'Statin', 'SIMRS', false, false, 'Pantau transaminase hati & gejala mialgia'],
  ['Rosuvastatin / Crestor', 'Rosuvastatin', 'rosuvastatin', '10 mg · 20 mg tab', 'PO', 'Statin Intensitas Tinggi', 'SIMRS', false, false, 'Pantau CK bila nyeri otot berat'],
  ['Heparin Sodium / Inviclot', 'Unfractionated Heparin', 'heparin sodium 5000 IU/mL', '25.000 IU/5 mL', 'IV / SC', 'Antikoagulan (High Alert)', 'SIMRS', true, true, 'HIGH ALERT: wajib cek aPTT & trombosit (waspada HIT)'],
  ['Lovenox', 'Enoxaparin', 'enoxaparin sodium', '40 mg · 60 mg syringe', 'SC', 'LMWH Antikoagulan', 'SIMRS', true, false, 'HIGH ALERT: sesuaikan dosis pada CrCl <30 mL/mnt'],
  ['Arixtra / Diviti', 'Fondaparinux', 'fondaparinux', '2.5 mg/0.5 mL', 'SC', 'Inhibitor Xa', 'SIMRS', true, false, 'Kontraindikasi bila CrCl <30 mL/mnt'],
  ['Simarc-2 / Notisil', 'Warfarin', 'warfarin', '2 mg tab', 'PO', 'Antikoagulan Oral VKA', 'SIMRS', true, false, 'HIGH ALERT: wajib pantau INR berkala; interaksi obat/makanan luas'],
  ['Xarelto', 'Rivaroxaban', 'rivaroxaban', '10 · 15 · 20 mg tab', 'PO', 'DOAC', 'SIMRS', true, true, 'Minum dosis 15/20 mg bersama makan untuk absorpsi optimal'],
  ['Vascon / Raivas / Norepinefrin', 'Norepinephrine', 'norepinephrine bitartrate', '4 mg/4 mL', 'IV Kontinu', 'Vasopresor (High Alert)', 'SIMRS', true, true, 'HIGH ALERT: wajib jalur sentral / pengenceran terkalibrasi'],
  ['Dopamin / Cetadop', 'Dopamine', 'dopamine hcl', '200 mg/5 mL', 'IV Kontinu', 'Inotropik/Vasopresor', 'SIMRS', true, true, 'HIGH ALERT LASA dengan Dobutamin; risiko ekstravasasi nekrosis'],
  ['Dobutamin / Dobuject', 'Dobutamine', 'dobutamine hcl', '250 mg/5 mL', 'IV Kontinu', 'Inotropik Beta-1', 'SIMRS', true, true, 'HIGH ALERT LASA dengan Dopamin; pantau hipotensi & takikardia'],
  ['Epinefrin / Adrenalin', 'Epinephrine', 'epinephrine 1 mg/mL', '1 mg/mL', 'IV / IM', 'Katekolamin Resusitasi', 'SIMRS', true, true, 'HIGH ALERT: pastikan rute (IV bolus henti jantung vs IM anafilaksis)'],
  ['Sulfas Atropin', 'Atropine Sulfate', 'atropine sulfate 0.25mg', '0.25 mg/mL', 'IV', 'Antikolinergik', 'SIMRS', true, true, 'LASA ampul; dosis bradikardia 1 mg IV'],
  ['Ca Gluconas', 'Calcium Gluconate', 'calcium gluconate 10%', '1 g/10 mL', 'IV Pelan', 'Elektrolit Kardioprotektif', 'SIMRS', true, true, 'HIGH ALERT: stabilisasi membran hiperkalemia; cek ECG'],
  ['KCl 7.46% / Otsu-KCl', 'Potassium Chloride', 'kalium klorida 7.46% 25mL', '25 mEq/25 mL', 'IV Drip Terencer', 'Elektrolit Konsentrat', 'SIMRS', true, true, 'HIGH ALERT: DILARANG BOLUS IV LANGSUNG (henti jantung fatal)!'],
  ['NaCl 3%', 'Hypertonic Saline 3%', 'natrium klorida 3%', '500 mL kolf', 'IV Terbatas', 'Elektrolit Konsentrat', 'SIMRS', true, true, 'HIGH ALERT: pantau Na+ ketat (cegah mielinolisis pontin)'],
  ['Meylon 8.4%', 'Sodium Bicarbonate', 'natrium bikarbonat 8.4%', '25 mEq/25 mL', 'IV', 'Alkalinizator', 'SIMRS', true, false, 'HIGH ALERT: hindari pencampuran dengan katekolamin/Ca2+'],
  ['MgSO4 20% / 40%', 'Magnesium Sulfate', 'magnesium sulfat 40%', '25 mL vial', 'IV Infus Pelan', 'Tokolitik / Anti-kejang', 'SIMRS', true, true, 'HIGH ALERT: pantau refleks patella, RR, & urine >=30 mL/jam; siapkan Ca glukonas'],
  ['KSR', 'Potassium Chloride SR', 'kalium klorida 600mg SR', '600 mg tab', 'PO', 'Suplemen Kalium', 'SIMRS', false, false, 'Telan utuh dengan segelas air (iritasi GI)'],
  ['Kalitake / Kalsium Polistiren', 'Calcium Polystyrene Sulfonate', 'calcium polystyrene sulfonate', '5 g sachet', 'PO / Rektal', 'Pengikat Kalium', 'SIMRS', false, false, 'Waspada risiko nekrosis kolon bila bersama sorbitol'],
  ['Novorapid', 'Insulin Aspart', 'insulin aspart flexpen', '100 IU/mL', 'SC / IV', 'Insulin Kerja Cepat', 'SIMRS', true, true, 'HIGH ALERT: pastikan makan tersedia; pantau hipoglikemia'],
  ['Lantus / Sansulin Log-G', 'Insulin Glargine', 'insulin glargine pen', '100 IU/mL', 'SC', 'Insulin Basal', 'SIMRS', true, true, 'HIGH ALERT LASA; JANGAN diberikan secara IV bolus'],
  ['Levemir', 'Insulin Detemir', 'insulin detemir pen', '100 IU/mL', 'SC', 'Insulin Basal', 'SIMRS', true, true, 'HIGH ALERT LASA dengan Novorapid/Apidra'],
  ['Apidra', 'Insulin Glulisine', 'insulin glulisine pen', '100 IU/mL', 'SC', 'Insulin Prandial', 'SIMRS', true, true, 'HIGH ALERT: berikan 0–15 menit sebelum makan'],
  ['Humalog Mix', 'Insulin Lispro Mix', 'insulin lispro mix 50/25', '100 IU/mL', 'SC', 'Insulin Campuran', 'SIMRS', true, true, 'HIGH ALERT: hanya untuk SC'],
  ['Glucophage / Forbetes', 'Metformin', 'metformin hcl', '500 mg · 850 mg tab', 'PO', 'Biguanid DM2', 'SIMRS', false, false, 'Tunda bila eGFR <30, syok, atau pra-kontras IV'],
  ['Amaryl / Gluvas', 'Glimepiride', 'glimepiride', '1 · 2 · 4 mg tab', 'PO', 'Sulfonilurea', 'SIMRS', false, false, 'Risiko hipoglikemia memanjang pada lansia/CKD'],
  ['Gliclazide / Diamicron MR', 'Gliclazide', 'gliclazide MR', '60 mg tab', 'PO', 'Sulfonilurea', 'SIMRS', false, false, 'Diminum sebelum sarapan'],
  ['Trajenta', 'Linagliptin', 'linagliptin', '5 mg tab', 'PO', 'DPP-4 Inhibitor', 'Resep Kertas Manual / Resep ke Luar', false, false, 'Aman pada penurunan fungsi ginjal tanpa penyesuaian dosis'],
  ['Forxiga', 'Dapagliflozin', 'dapagliflozin', '10 mg tab', 'PO', 'SGLT2 Inhibitor', 'Resep Kertas Manual / Resep ke Luar', false, false, 'Waspada DKA euglikemik pada stres bedah/puasa'],
  ['Jardiance', 'Empagliflozin', 'empagliflozin', '10 · 25 mg tab', 'PO', 'SGLT2 Inhibitor', 'SIMRS', false, false, 'Pantau dehidrasi & infeksi saluran kemih/genital'],
  ['PTU', 'Propylthiouracil', 'propylthiouracil', '100 mg tab', 'PO', 'Antitiroid', 'SIMRS', false, false, 'Pantau hepatotoksisitas (SGOT/SGPT) & agranulositosis'],
  ['Thyrozol', 'Thiamazole', 'thiamazole', '5 mg · 10 mg tab', 'PO', 'Antitiroid', 'SIMRS', false, false, 'Kontraindikasi trimester 1 kehamilan bila memungkinkan (lebih pilih PTU)'],
  ['Euthyrox', 'Levothyroxine', 'levothyroxine', '50 · 100 mcg tab', 'PO', 'Hormon Tiroid', 'SIMRS', false, false, 'Minum perut kosong pagi hari terpisah 4 jam dari Ca/Fe'],
  ['Dexamethasone / Cortidex', 'Dexamethasone', 'dexamethasone inj / tab', '5 mg/mL · 0.5 mg', 'IV / PO', 'Kortikosteroid', 'SIMRS', false, false, 'Pantau hiperglikemia & perdarahan saluran cerna'],
  ['Methylprednisolone / Lameson', 'Methylprednisolone', 'methylprednisolone inj / tab', '125 · 500 mg inj · 4/8/16 mg', 'IV / PO', 'Kortikosteroid', 'SIMRS', false, true, 'Tapering off bila dipakai >10–14 hari'],
  ['Solu-Cortef / Fartison', 'Hydrocortisone', 'hydrocortisone 100mg inj', '100 mg vial', 'IV', 'Kortikosteroid Syok/Adrenal', 'SIMRS', false, false, 'Terapi pilihan pada krisis adrenal & syok septik refrakter'],
  ['Ventolin Nebulizer / Salbuven', 'Salbutamol', 'salbutamol nebules', '2.5 mg/2.5 mL', 'Inhalasi', 'SABA Bronkodilator', 'SIMRS', false, false, 'Pantau takikardia & hipokalemia pada nebulisasi berulang'],
  ['Combivent', 'Ipratropium + Salbutamol', 'ipratropium salbutamol resp', '2.5 mL unit dose', 'Inhalasi', 'SABA + SAMA', 'SIMRS', false, false, 'Hindari paparan langsung aerosol ke mata (glaukoma)'],
  ['Pulmicort', 'Budesonide', 'budesonide respules', '0.5 mg/2 mL', 'Inhalasi', 'ICS Nebu', 'SIMRS', false, false, 'Bilas mulut setelah inhalasi (cegah kandidiasis oral)'],
  ['Symbicort', 'Budesonide + Formoterol', 'budesonide formoterol turbo', '160/4.5 mcg', 'Inhalasi', 'ICS + LABA', 'SIMRS', false, false, 'Bilas mulut pasca-pakai; sesuai GINA MART'],
  ['Seretide', 'Fluticasone + Salmeterol', 'fluticasone salmeterol', '125/250 mcg', 'Inhalasi', 'ICS + LABA', 'SIMRS', false, false, 'Bukan pelega onset cepat akut'],
  ['Aminophylline', 'Aminophylline', 'aminophylline inj', '240 mg/10 mL', 'IV Pelan', 'Metilxantin', 'SIMRS', true, false, 'Indeks terapi sempit; jangan dicampur pada aritmia aktif'],
  ['Citicoline / Brainact', 'Citicoline', 'citicoline inj / tab', '250 · 500 mg inj · 500 mg', 'IV / PO', 'Neuroprotektor', 'SIMRS', false, true, 'Evaluasi kesesuaian indikasi klinis FORNAS/BPJS'],
  ['Piracetam / Nootropil', 'Piracetam', 'piracetam inj / kapl', '1 g/5 mL · 3 g/15 mL', 'IV / PO', 'Nootropik', 'SIMRS', false, false, 'Hindari pada perdarahan intraserebral aktif'],
  ['Mecobalamin / Kalmeco', 'Mecobalamin', 'mecobalamin inj / kaps', '500 mcg', 'IV / PO', 'Vitamin B12 Neuro', 'SIMRS', false, false, 'Dokumentasikan diagnosis neuropati objektif'],
  ['Phenytoin / Kutoin / Dilantin', 'Phenytoin', 'phenytoin sodium inj', '100 mg/2 mL · 100 mg kaps', 'IV dalam NaCl 0.9%', 'Antikonvulsan', 'SIMRS', true, true, 'DILARANG campur Dekstrosa (presipitasi!); kecepatan <=50 mg/mnt'],
  ['Depakote / Valproic Acid', 'Valproate', 'asam valproat / divalproex', '250 · 500 mg tab', 'PO', 'Antikonvulsan / Mood', 'SIMRS', true, false, 'Teratogenik tinggi; kadar turun drastis bila pakai meropenem'],
  ['Keppra / Levetiracetam', 'Levetiracetam', 'levetiracetam inj / tab', '500 mg', 'IV / PO', 'Antikonvulsan', 'SIMRS', false, false, 'Sesuaikan pada gangguan ginjal'],
  ['Stesolid / Valisanbe', 'Diazepam', 'diazepam inj / rektal', '10 mg/2 mL · 5/10 mg supp', 'IV / Rektal', 'Benzodiazepin Anti-Kejang', 'SIMRS', true, true, 'HIGH ALERT: pantau depresi napas saat injeksi IV'],
  ['Miloz / Fortanes', 'Midazolam', 'midazolam inj', '5 mg/5 mL · 15 mg/3 mL', 'IV', 'Sedatif Benzodiazepin', 'SIMRS', true, true, 'HIGH ALERT: wajib monitoring jalan napas & SpO2'],
  ['Manitol 20%', 'Mannitol 20%', 'mannitol 20% inf', '250 · 500 mL', 'IV Filter Set', 'Diuretik Osmotik TIK', 'SIMRS', true, false, 'Cek osmolaritas serum & kristal sebelum infus; hindari anuria'],
  ['Asam Traneksamat / Kalnex', 'Tranexamic Acid', 'asam traneksamat inj / tab', '500 mg/5 mL · 500 mg', 'IV / PO', 'Antifibrinolitik', 'SIMRS', false, true, 'Waspada tromboemboli; sesuaikan pada gagal ginjal'],
  ['Vitamin K1 / Phytomenadione', 'Phytomenadione', 'phytomenadione inj', '2 mg · 10 mg/mL', 'IM / IV / PO', 'Koagulasi Vitamin K', 'SIMRS', false, true, 'IV pelan berisiko anafilaktoid'],
  ['Protamine Sulfate', 'Protamine Sulfate', 'protamine sulfate', '50 mg/5 mL', 'IV Pelan', 'Antidotum Heparin', 'SIMRS', true, false, 'HIGH ALERT: hipotensi/bradikardia bila disuntik cepat'],
  ['Octreotide / Sandostatin', 'Octreotide', 'octreotide 0.1mg/mL', '100 mcg/mL', 'IV / SC', 'Somatostatin Analog', 'SIMRS', false, false, 'Pantau bradikardia & glukosa pada variceal bleeding'],
  ['Alinamin F', 'Fursultiamine', 'fursultiamine inj', '25 mg/10 mL', 'IV', 'Vitamin B1', 'SIMRS', false, false, 'Berikan sebelum glukosa IV pada suspek Wernicke'],
  ['Neurobion 5000', 'Vit B1+B6+B12', 'vitamin b1 b6 b12 inj/tab', '3 mL ampul', 'IM / PO', 'Suplemen Neurotropik', 'SIMRS', false, false, 'Hanya IM dalam pada sediaan ampul'],
  ['Urdafalk', 'Ursodeoxycholic Acid', 'ursodeoxycholic acid', '250 mg kaps', 'PO', 'Hepatoprotektor / Empedu', 'SIMRS', false, false, 'Efektif pada kolestasis tanpa obstruksi mekanik total'],
  ['HP Pro / Curcuma', 'Silymarin / Curcumin', 'curcuma / silymarin', 'tab', 'PO', 'Suplemen Hepar', 'SIMRS', false, false, 'Bukti terapi terbatas; tidak menggantikan tata laksana etiologi'],
  ['L-Bio / Lacidofil / Interlac', 'Probiotic', 'lactobacillus sachet', '1 g sach', 'PO', 'Probiotik GI', 'SIMRS', false, false, 'Hati-hati pada imunosupresi berat / jalur vena sentral'],
  ['Imodium / Lodia', 'Loperamide', 'loperamide hcl', '2 mg tab', 'PO', 'Antidiare Antiperistaltik', 'SIMRS', false, false, 'KONTRAINDIKASI diare berdarah/disentri demam tinggi'],
  ['Attapulgite / New Diatabs', 'Attapulgite', 'attapulgite 600mg', '600 mg tab', 'PO', 'Adsorben Diare', 'SIMRS', false, false, 'Berikan jeda 2 jam dari obat oral lain'],
  ['Zinc 20 mg', 'Zinc Sulfate', 'zinc sulfat 20mg', '20 mg tab dispersible', 'PO', 'Terapi Diare Anak', 'SIMRS', false, false, '10–14 hari penuh pada anak diare'],
  ['Oralit / Pharolit', 'ORS / Garam Rehidrasi', 'garam oralit sachet', '200 mL sach', 'PO', 'Rehidrasi Oral', 'SIMRS', false, false, 'Hitung sesuai derajat dehidrasi'],
  ['Oxytocin / Syntocinon', 'Oxytocin', 'oxytocin 10 IU/mL', '10 IU/mL', 'IV / IM', 'Uterotonik', 'SIMRS', true, true, 'HIGH ALERT: pantau his & DJJ ketat pada induksi persalinan'],
  ['Methergin / Pospargin', 'Methylergometrine', 'methylergometrine inj', '0.2 mg/mL', 'IM / IV Pelan', 'Uterotonik Alkaloid', 'SIMRS', true, false, 'KONTRAINDIKASI hipertensi / preeklamsia!'],
  ['Misoprostol / Gastrul', 'Misoprostol', 'misoprostol 200mcg', '200 mcg tab', 'SL / Rektal / PO', 'Prostaglandin E1', 'SIMRS', true, false, 'Kontraindikasi bila riwayat SC pada kehamilan aterm hidup (ruptur uteri)'],
  ['Nifedipine / Adalat Oros', 'Nifedipine', 'nifedipine 10mg / 30mg', '10 mg · 30 mg OROS', 'PO', 'CCB / Tokolitik', 'SIMRS', false, false, 'Hindari rute SL cepat (risiko iskemia miokard/stroke mendadak)'],
  ['Methyldopa / Dopamet', 'Methyldopa', 'methyldopa 250mg', '250 mg tab', 'PO', 'Antihipertensi Kehamilan', 'SIMRS', false, false, 'Lini utama hipertensi kronis kehamilan; pantau SGOT/SGPT'],
  ['Allopurinol / Zyloric', 'Allopurinol', 'allopurinol', '100 · 300 mg tab', 'PO', 'Xanthine Oxidase Inhibitor', 'SIMRS', false, false, 'Waspada SJS/TEN (HLA-B*5801); jangan mulai saat serangan gout akut'],
  ['Colchicine / Recolfar', 'Colchicine', 'colchicine 0.5mg', '0.5 mg tab', 'PO', 'Anti-Gout Akut', 'SIMRS', false, false, 'Sesuaikan dosis pada CKD; toksisitas GI bila berlebih'],
  ['Meloxicam / Movi-Cox', 'Meloxicam', 'meloxicam', '7.5 · 15 mg tab', 'PO', 'NSAID COX-2 Preferential', 'SIMRS', false, false, 'Pantau TD, kreatinin, & risiko GI'],
  ['Celecoxib / Celebrex', 'Celecoxib', 'celecoxib', '100 · 200 mg kaps', 'PO', 'NSAID COX-2 Selektif', 'SIMRS', false, true, 'Kontraindikasi alergi sulfonamid / pasca CABG'],
  ['Etoricoxib / Arcoxia', 'Etoricoxib', 'etoricoxib', '60 · 90 · 120 mg tab', 'PO', 'NSAID COX-2 Selektif', 'SIMRS', false, false, 'Pantau peningkatan tekanan darah & risiko kardiovaskular'],
  ['Gabapentin / Neurontin', 'Gabapentin', 'gabapentin', '100 · 300 mg kaps', 'PO', 'Nyeri Neuropatik', 'SIMRS', false, true, 'Sesuaikan CrCl; efek sedasi & pusing'],
  ['Pregabalin / Lyrica', 'Pregabalin', 'pregabalin', '75 · 150 mg kaps', 'PO', 'Nyeri Neuropatik', 'SIMRS', false, true, 'Sesuaikan dosis pada gangguan ginjal'],
  ['Haloperidol / Lodomer', 'Haloperidol', 'haloperidol inj / tab', '5 mg/mL · 5 mg', 'IM / PO', 'Antipsikotik Tipikal', 'SIMRS', false, true, 'Hati-hati pada lansia demensia & perpanjangan QTc'],
  ['Risperidone', 'Risperidone', 'risperidone', '2 mg tab', 'PO', 'Antipsikotik Atipikal', 'SIMRS', false, false, 'Pantau sindrom metabolik & gejala ekstrapiramidal'],
  ['Lorazepam / Ativan', 'Lorazepam', 'lorazepam', '0.5 · 1 · 2 mg tab', 'PO', 'Benzodiazepin', 'SIMRS', true, true, 'LASA & psikotropika; aman pada gangguan hepar dibanding diazepam'],
  ['Alprazolam / Xanax / Zypraz', 'Alprazolam', 'alprazolam', '0.5 · 1 mg tab', 'PO', 'Benzodiazepin', 'SIMRS', true, false, 'Psikotropika; risiko ketergantungan & depresi napas dengan opioid'],
  ['Fluoxetine / Kalxetin', 'Fluoxetine', 'fluoxetine 20mg', '20 mg kaps', 'PO', 'Antidepresan SSRI', 'SIMRS', false, false, 'Pantau aktivasi awal/suicidal ideation pada awal terapi'],
  ['Cetirizine / Incidal OD', 'Cetirizine', 'cetirizine', '10 mg tab · syr', 'PO', 'Antihistamin Gen 2', 'SIMRS', false, false, 'Sedasi minimal pada dosis standar'],
  ['Diphenhydramine / Recodryl', 'Diphenhydramine', 'diphenhydramine 10mg/mL', '10 mg/mL vial', 'IV / IM', 'Antihistamin Gen 1', 'SIMRS', false, false, 'Antikolinergik kuat & sedasi'],
  ['Chlorpheniramine / CTM', 'Chlorpheniramine', 'klorfeniramin maleat', '4 mg tab', 'PO', 'Antihistamin Gen 1', 'SIMRS', false, false, 'Menyebabkan kantuk'],
  ['Pseudoefedrin / Tremenza / Rhinos', 'Pseudoephedrine + Triprolidine/Loratadine', 'rhinos sr / tremenza', '60/120 mg', 'PO', 'Dekongestan Oral', 'SIMRS', false, false, 'Hindari pada hipertensi tak terkontrol & krisis simpatomimetik'],
  ['Ringer Laktat (RL)', 'Lactated Ringer', 'infus ringer laktat 500mL', '500 mL', 'IV', 'Kristaloid Resusitasi', 'SIMRS', false, false, 'Jangan satu selang dengan ceftriaxone; hati-hati gagal hati berat'],
  ['NaCl 0.9% / NS', 'Normal Saline 0.9%', 'natrium klorida 0.9% 500mL', '100 · 500 mL', 'IV', 'Kristaloid Isotonis', 'SIMRS', false, false, 'Pantau hiperkloremia asidosis bila volume masif'],
  ['Asering', 'Ringer Asetat', 'asering infus 500mL', '500 mL', 'IV', 'Kristaloid Buffer Asetat', 'SIMRS', false, false, 'Dimetabolisme ekstra-hepatik (lebih aman pada gangguan hati)'],
  ['Ka-En 3B', 'Elektrolit Maintenance + D5 + K20', 'ka-en 3b 500mL', '500 mL (K+ 20 mEq/L)', 'IV', 'Cairan Rumatan (Mengandung K+)', 'SIMRS', false, true, 'Kontraindikasi hiperkalemia & anuria!'],
  ['Dextrose 40% / Otsu-D40', 'Dextrose 40%', 'glukosa 40% 25mL', '25 mL flakon', 'IV Pelan', 'Terapi Hipoglikemia Berat', 'SIMRS', true, false, 'HIGH ALERT: risiko flebitis berat (bilas dengan NS/vena besar)'],
  ['Albumin 20% / 25% (Plasbumin)', 'Human Albumin', 'albumin manusia 20% 100mL', '100 mL', 'IV', 'Koloid / Hipoalbuminemia', 'SIMRS', true, false, 'Pantau overload cairan / edema paru pada infus cepat'],
  ['HES 6% / Voluven', 'Hydroxyethyl Starch', 'hydroxyethyl starch 6%', '500 mL', 'IV', 'Koloid Sintetik (Terbatas)', 'SIMRS', false, false, 'KONTRAINDIKASI pada sepsis kritis & AKI (risiko gagal ginjal)'],
  ['Tamsulosin / Harnal OCAS', 'Tamsulosin', 'tamsulosin hcl 0.4mg', '0.4 mg tab', 'PO', 'Alpha-1A Blocker BPH', 'SIMRS', false, false, 'Waspada hipotensi ortostatik dosis pertama & floppy iris pada operasi katarak'],
  ['Dutasteride / Avodart', 'Dutasteride', 'dutasteride 0.5mg', '0.5 mg kaps', 'PO', '5-Alpha Reductase Inhibitor', 'SIMRS', false, false, 'Wanita hamil dilarang menyentuh kapsul pecah'],
  ['Folic Acid / Folavit', 'Folic Acid', 'asam folat 1mg / 400mcg', '1 mg tab', 'PO', 'Vitamin Hematopoietik', 'SIMRS', false, false, 'Singkirkan defisiensi B12 terlebih dahulu pada anemia makrositik'],
  ['Ferritin / Maltofer / Sangobion', 'Iron Polymaltose / Ferrous', 'tablet tambah darah fe', '100 mg elemen Fe', 'PO', 'Suplemen Besi', 'SIMRS', false, false, 'Jeda 2 jam dari teh, susu, antasida, & PPI'],
  ['Vitamin C / Redoxon', 'Ascorbic Acid', 'asam askorbat 500mg', '500 mg · 1 g inj', 'PO / IV', 'Vitamin', 'SIMRS', false, false, 'Dosis IV tinggi berisiko oksalat nefropati pada gagal ginjal'],
  ['ATLS Tetagam / ATS', 'Human Tetanus Immunoglobulin', 'tetanus ig 250 IU', '250 IU syringe', 'IM', 'Profilaksis Tetanus', 'SIMRS', false, false, 'Berikan di lokasi terpisah dari vaksin Td/TT'],
  ['Bio-TT / Td', 'Tetanus Toxoid', 'vaksin td / tt', '0.5 mL', 'IM', 'Vaksinasi Tetanus', 'SIMRS', false, false, 'Cek status imunisasi trauma luka kotor'],
  ['Candesartan-HCT', 'Candesartan + Hydrochlorothiazide', 'candesartan hct 16/12.5', '16/12.5 mg', 'PO', 'Antihipertensi Kombinasi', 'SIMRS', false, false, 'Pantau elektrolit K+/Na+ & asam urat'],
  ['Spironolactone + Furosemide', 'Kombinasi Asites/CHF', 'furosemide + spironolactone', '40 mg + 100 mg', 'PO', 'Diuretik Rasio 40:100', 'SIMRS', false, false, 'Pantau Na+, K+, kreatinin pada sirosis dekompensata'],
  ['Kombiglyze XR', 'Saxagliptin + Metformin XR', 'saxagliptin metformin xr', '5/1000 mg', 'PO', 'Antidiabetik Kombinasi', 'Resep Kertas Manual / Resep ke Luar', false, false, 'Hentikan bila gagal jantung akut (saxagliptin)'],
]

export const KARDEKS_SIMRS_DICTIONARY: readonly KardeksEntry[] = RAW_KARDEKS_ROWS.map((r, i) => ({
  id: `kdx-${i + 1}`,
  kardeksName: r[0],
  genericName: r[1],
  simrsName: r[2],
  formulationStrength: r[3],
  route: r[4],
  categoryNote: r[5],
  channel: r[6],
  highAlert: r[7],
  lasa: r[8],
  safetyNote: r[9],
  facilityAvailability: r[6] === 'SIMRS' ? 'Tersedia RS' : 'Perlu Konfirmasi Farmasi',
}))

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 3) return 99
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }
  return dp[n]
}

export function searchKardeksDictionary(
  query: string,
  entries: readonly KardeksEntry[] = KARDEKS_SIMRS_DICTIONARY,
  filters?: { readonly highAlertOnly?: boolean; readonly lasaOnly?: boolean },
): KardeksEntry[] {
  const q = query.trim().toLowerCase()
  const base = entries.filter((e) => (!filters?.highAlertOnly || e.highAlert) && (!filters?.lasaOnly || e.lasa))
  if (!q) return [...base]
  return base.filter((e) => {
    const hay = `${e.kardeksName} ${e.genericName} ${e.simrsName} ${e.categoryNote}`.toLowerCase()
    if (hay.includes(q)) return true
    const tokens = hay.split(/[\s/,()-]+/).filter((t) => t.length >= 4)
    return tokens.some((tok) => levenshtein(q, tok) <= 2)
  })
}

export function importLocalFormularyCsv(csvText: string): KardeksEntry[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const imported: KardeksEntry[] = []
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    if (cols.length < 3 || /^kardeks/i.test(cols[0])) continue
    imported.push({
      id: `local-csv-${i + 1}`,
      kardeksName: cols[0],
      genericName: cols[1] || cols[0],
      simrsName: cols[2],
      formulationStrength: cols[3] || '-',
      route: cols[4] || 'PO/IV',
      categoryNote: cols[5] || 'Formularium Lokal',
      channel: 'SIMRS',
      highAlert: /\b(true|1|high)\b/i.test(cols[6] ?? ''),
      lasa: /\b(true|1|lasa)\b/i.test(cols[7] ?? ''),
      safetyNote: cols[8] || 'Verifikasi dosis sesuai PPK lokal.',
      facilityAvailability: 'Tersedia RS',
    })
  }
  return imported
}

// ── Unified Universal Medical Search ────────────────────────────────────────
export interface UnifiedMedicalSearchHit {
  readonly domain: 'Drug' | 'Symptom' | 'Diagnosis_SKDI' | 'Vaccine' | 'Calculator' | 'Private_Vault'
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly codeBadge?: string
  readonly routeHint: string
}

const SYMPTOM_DIAGNOSIS_VACCINE_CALC: readonly UnifiedMedicalSearchHit[] = [
  { domain: 'Symptom', id: 'sym-cp', title: 'Nyeri Dada Akut / Chest Pain', subtitle: 'Skrining ACS STEMI/NSTEMI, diseksi aorta, emboli paru, GERD', codeBadge: 'SKDI 3B', routeHint: '/emr' },
  { domain: 'Symptom', id: 'sym-sob', title: 'Sesak Napas / Dyspnea', subtitle: 'Gagal napas akut, edema paru, asma eksaserbasi, PPOK, pneumotoraks', codeBadge: 'SKDI 3B', routeHint: '/emr' },
  { domain: 'Diagnosis_SKDI', id: 'dx-acs', title: 'Sindrom Koroner Akut (STEMI / NSTEMI / UAP)', subtitle: 'I21 / I20 · EKG 12-lead <10 menit, troponin serial, MONACO bila terindikasi', codeBadge: 'SKDI 3B', routeHint: '/med-study?bagian=diseases' },
  { domain: 'Diagnosis_SKDI', id: 'dx-ht', title: 'Hipertensi Esensial & Krisis Hipertensi', subtitle: 'I10 / I16 · Bedakan urgensi vs emergensi (kerusakan organ target)', codeBadge: 'SKDI 4A', routeHint: '/med-study?bagian=diseases' },
  { domain: 'Vaccine', id: 'vax-td', title: 'Vaksin Td / TT & Tetagam (Profilaksis Luka)', subtitle: 'Cek status imunisasi 5/10 tahun & luka rentan tetanus', codeBadge: 'IMUNISASI', routeHint: '/vaksin' },
  { domain: 'Vaccine', id: 'vax-hepb', title: 'Vaksin Hepatitis B Dewasa & Nakes', subtitle: 'Jadwal 0-1-6 bulan + cek anti-HBs protektif >=10 mIU/mL', codeBadge: 'IMUNISASI', routeHint: '/vaksin' },
  { domain: 'Calculator', id: 'calc-bmi', title: 'IMT Dewasa, Mosteller BSA & LMS Z-Score Pediatrik', subtitle: 'Antropometri deterministik terpisah dewasa vs pediatrik', codeBadge: 'CALC', routeHint: '/clinical-calculators' },
  { domain: 'Calculator', id: 'calc-news2', title: 'NEWS2, MAP & Urine Output (mL/kg/jam)', subtitle: 'Deteksi dini perburukan fisiologis & oliguria <0.5 mL/kg/jam', codeBadge: 'CALC', routeHint: '/clinical-calculators' },
]

export function runUnifiedMedicalSearch(
  query: string,
  options?: { readonly customEntries?: readonly KardeksEntry[]; readonly vaultRecords?: readonly VaultFileRecord[] },
): { readonly autoPrescribeAllowed: false; readonly hits: UnifiedMedicalSearchHit[] } {
  const q = query.trim().toLowerCase()
  const drugs = searchKardeksDictionary(q, [...KARDEKS_SIMRS_DICTIONARY, ...(options?.customEntries ?? [])]).slice(0, 12)
  const drugHits: UnifiedMedicalSearchHit[] = drugs.map((d) => ({
    domain: 'Drug',
    id: d.id,
    title: `${d.kardeksName} <-> ${d.simrsName}`,
    subtitle: `${d.genericName} · ${d.formulationStrength} (${d.route}) · ${d.categoryNote}`,
    codeBadge: d.highAlert ? 'HIGH ALERT' : d.lasa ? 'LASA' : d.channel === 'SIMRS' ? 'SIMRS' : 'LUAR',
    routeHint: '/med-study?bagian=invictus-hub',
  }))
  const staticHits = SYMPTOM_DIAGNOSIS_VACCINE_CALC.filter(
    (h) => !q || `${h.title} ${h.subtitle} ${h.codeBadge ?? ''}`.toLowerCase().includes(q),
  )
  const vaultHits: UnifiedMedicalSearchHit[] = (options?.vaultRecords ?? [])
    .filter((v) => !q || `${v.name} ${v.domain} ${v.sourcePaths.join(' ')}`.toLowerCase().includes(q))
    .slice(0, 8)
    .map((v) => ({
      domain: 'Private_Vault',
      id: v.fileId,
      title: v.name,
      subtitle: `Private Vault (${v.domain}) · ${v.extractionStatus}`,
      codeBadge: 'VAULT',
      routeHint: '/med-study?bagian=invictus-hub',
    }))

  return {
    autoPrescribeAllowed: false,
    hits: [...drugHits, ...staticHits, ...vaultHits],
  }
}
