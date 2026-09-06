import { ATLAS_BY_NAME } from './systemAtlas.gen'
import type { JenisLesi } from './cardioPathology'

// ─────────────────────────────────────────────────────────────────────────────
// PATOLOGI LINTAS SPESIALISASI, ditunjukkan pada geometri manusia yang nyata.
//
// Bentuknya sengaja SAMA dengan cardioPathology.ts: tiap keadaan menyebut
// struktur bernama yang rusak dan struktur yang menderita di hilirnya, memakai
// nama yang sama persis dengan nama mesh di /atlas/<modul>.glb. Dengan begitu
// membuka "apendisitis akut" menyalakan apendiks pada figur, bukan menampilkan
// paragraf tentang apendiks.
//
// BATAS YANG HARUS DINYATAKAN, bukan disembunyikan. BodyParts3D adalah rujukan
// anatomi laki-laki dewasa, dan beberapa struktur memang tidak ada di dalamnya:
// organ reproduksi perempuan, kelenjar tiroid, telinga tengah, serta parenkim
// paru dan pleura (yang ada hanya pohon bronkus). Modul yang menyentuh bagian
// itu membawa keterangannya sendiri di layar. Menyorot struktur yang salah
// hanya supaya ada yang menyala adalah mengajarkan letak yang keliru, dan itu
// lebih buruk daripada mengakui batasnya.
//
// Teks klinis ditulis dalam bahasa Inggris (bahasa dasar aplikasi); tautan ke
// korpus SKDI memakai nama penyakit PERSIS seperti di skdiDiseaseList.ts, dan
// ada ujinya di server/uji/specialtyPathology.uji.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemLesion {
  struktur: string
  jenis: JenisLesi
  derajat?: number
  catatan: string
}

export interface SystemCondition {
  id: string
  /** Modul atlas tempat strukturnya berada (lihat systemAtlas.gen.ts). */
  module: string
  label: string
  ringkas: string
  lesi: SystemLesion[]
  hilir: string[]
  mekanisme: string
  temuan: string[]
  penunjang: string[]
  tata: string[]
  organKey: string
  skdi: string[]
}

export const SYSTEM_CONDITIONS: SystemCondition[] = [
  // ══ RESPIRASI ══════════════════════════════════════════════════════════════
  {
    id: 'asthma',
    module: 'respirasi',
    label: 'Bronchial asthma',
    ringkas: 'The airways tighten and swell in attacks, and breathing out becomes the hard part.',
    lesi: [
      { struktur: 'Left main bronchus', jenis: 'stenosis', derajat: 0.5, catatan: 'Smooth-muscle constriction, mucosal oedema and mucus plugging.' },
      { struktur: 'Right main bronchus proper', jenis: 'stenosis', derajat: 0.5, catatan: 'Narrowing is diffuse, not focal — every generation of airway is involved.' },
    ],
    hilir: ['Left apical segmental bronchial tree', 'Right apical segmental bronchial tree', 'Diaphragm'],
    mekanisme:
      'Type 2 airway inflammation drives smooth-muscle hyperresponsiveness, oedema and mucus. Because resistance ' +
      'rises with the fourth power of the radius, a small circumferential narrowing multiplies the work of ' +
      'breathing. Expiration suffers first: airways narrow further as intrathoracic pressure rises, so air is ' +
      'trapped, the lung sits at a higher volume, and the flattened diaphragm loses mechanical advantage.',
    temuan: [
      'Episodic wheeze, cough and chest tightness, worse at night and with triggers',
      'Prolonged expiration; a silent chest is a sign of severity, not improvement',
      'Reversible airflow obstruction: FEV1 rises after a bronchodilator',
    ],
    penunjang: ['Spirometry with reversibility testing; peak flow diary', 'Blood eosinophils or FeNO where available to phenotype'],
    tata: [
      'Inhaled corticosteroid-containing therapy for every patient — not reliever alone',
      'Acute attack: oxygen, inhaled beta-2 agonist, systemic corticosteroid; reassess objectively',
      'Written action plan, inhaler technique, trigger and comorbidity control',
    ],
    organKey: 'lungs',
    skdi: ['Asma bronkial', 'Status asmatikus (asma akut berat)'],
  },
  {
    id: 'copd',
    module: 'respirasi',
    label: 'COPD and emphysema',
    ringkas: 'Years of smoke destroy the air sacs; the chest becomes a barrel and the diaphragm loses its pull.',
    lesi: [
      { struktur: 'Left superior segmental bronchial tree', jenis: 'stenosis', derajat: 0.45, catatan: 'Small-airway fibrosis and loss of elastic tethering.' },
      { struktur: 'Diaphragm', jenis: 'hypertrophy', catatan: 'Flattened and shortened by hyperinflation — mechanically disadvantaged.' },
    ],
    hilir: ['Left main bronchus', 'Right main bronchus proper'],
    mekanisme:
      'Protease–antiprotease imbalance destroys alveolar walls, removing the radial traction that holds small ' +
      'airways open. They collapse on expiration, gas is trapped, and hyperinflation flattens the diaphragm so it ' +
      'contracts on the wrong part of its length–tension curve. Hypoxic pulmonary vasoconstriction then loads the ' +
      'right ventricle — the road to cor pulmonale.',
    temuan: [
      'Chronic productive cough and progressive exertional breathlessness in a smoker',
      'Barrel chest, pursed-lip breathing, reduced breath sounds, hyperresonance',
      'Post-bronchodilator FEV1/FVC below 0.70 — obstruction that does not fully reverse',
    ],
    penunjang: ['Post-bronchodilator spirometry (required for diagnosis)', 'Chest radiograph, blood gases in exacerbation, alpha-1 antitrypsin in the young'],
    tata: [
      'Smoking cessation — the only intervention that changes the slope of decline',
      'Bronchodilators, pulmonary rehabilitation, vaccination; long-term oxygen only for proven chronic hypoxaemia',
      'Exacerbation: bronchodilators, corticosteroid, antibiotics if purulent, ventilatory support (NIV) for hypercapnic acidosis',
    ],
    organKey: 'lungs',
    skdi: ['Penyakit Paru Obstruksi Kronik (PPOK) eksaserbasi akut', 'Emfisema paru', 'Kor pulmonale kronik'],
  },
  {
    id: 'pneumonia',
    module: 'respirasi',
    label: 'Lobar pneumonia',
    ringkas: 'One segment of lung fills with infected fluid, so that part stops taking up oxygen.',
    lesi: [
      { struktur: 'Right anterior basal segmental bronchial tree', jenis: 'occlusion', catatan: 'Consolidation fills the alveoli distal to this segmental airway.' },
    ],
    hilir: ['Right main bronchus proper'],
    mekanisme:
      'Alveoli fill with neutrophils and exudate while perfusion continues, creating a true right-to-left shunt: ' +
      'blood leaves the segment as deoxygenated as it arrived. That is why hypoxaemia from consolidation responds ' +
      'poorly to supplemental oxygen — the fraction of inspired oxygen cannot reach alveoli that are full of pus.',
    temuan: [
      'Fever, pleuritic pain, productive cough, tachypnoea',
      'Bronchial breathing, crackles, dullness to percussion over the affected segment',
      'CURB-65 or equivalent decides admission, not the appearance of the film',
    ],
    penunjang: ['Chest radiograph; oxygen saturation and respiratory rate', 'Blood and sputum cultures before antibiotics in severe disease'],
    tata: [
      'Antibiotics guided by severity and local resistance, started within hours',
      'Oxygen, fluids, analgesia; review at 48–72 hours and reconsider if not improving',
      'Consider empyema or abscess when fever persists despite adequate therapy',
    ],
    organKey: 'lungs',
    skdi: ['Pneumonia, bronkopneumonia', 'Pneumonia aspirasi', 'Abses paru'],
  },
  {
    id: 'tb-paru',
    module: 'respirasi',
    label: 'Pulmonary tuberculosis',
    ringkas: 'A slow infection that prefers the top of the lung, where oxygen is highest and blood flow lowest.',
    lesi: [
      { struktur: 'Right apical segmental bronchial tree', jenis: 'occlusion', catatan: 'Apical-posterior predilection with cavitation.' },
      { struktur: 'Left apical segmental bronchial tree', jenis: 'occlusion', catatan: 'The other classic upper-lobe site.' },
    ],
    hilir: ['Right superior segmental bronchial tree', 'Left superior segmental bronchial tree'],
    mekanisme:
      'Mycobacterium tuberculosis is an obligate aerobe and the lung apex has the highest ventilation–perfusion ' +
      'ratio and the least lymphatic drainage — hence the apical predilection. Caseating granulomas liquefy and ' +
      'drain into an airway, producing a cavity that both ventilates the organism into the air and seeds the rest ' +
      'of the lung.',
    temuan: [
      'Cough for two weeks or more, night sweats, weight loss, haemoptysis',
      'Contact history and HIV status change the pre-test probability decisively',
    ],
    penunjang: [
      'Rapid molecular testing (Xpert MTB/RIF) as the initial test — it reports rifampicin resistance too',
      'Chest radiograph; sputum smear and culture; HIV testing in every case',
    ],
    tata: [
      'Standard multi-drug regimen with directly supported adherence; never a single drug',
      'Test for drug resistance before assuming failure; screen and treat contacts',
    ],
    organKey: 'lungs',
    skdi: ['Tuberkulosis paru tanpa komplikasi', 'Multi Drug Resistance (MDR) TB', 'Tuberkulosis dengan HIV'],
  },
  {
    id: 'aspirasi-benda-asing',
    module: 'respirasi',
    label: 'Foreign body aspiration',
    ringkas: 'An inhaled object almost always goes down the right side — it is the wider, straighter tube.',
    lesi: [
      { struktur: 'Right main bronchus proper', jenis: 'occlusion', catatan: 'Wider, shorter and more vertical than the left, so aspirated material lands here.' },
    ],
    hilir: ['Right anterior segmental bronchial tree', 'Right apical segmental bronchial tree'],
    mekanisme:
      'The right main bronchus leaves the carina at a shallower angle, so gravity and airflow favour it. A ' +
      'ball-valve obstruction lets air in and not out, producing distal hyperinflation; complete obstruction ' +
      'produces collapse. Persisting foreign material becomes a fixed nidus for recurrent pneumonia in the same ' +
      'segment, which is the clue in a child treated three times for "pneumonia".',
    temuan: [
      'Sudden choking, then unilateral wheeze and reduced air entry',
      'A quiet interval after the initial episode misleads more often than the episode itself',
    ],
    penunjang: ['Inspiratory and expiratory chest radiographs (air trapping); bronchoscopy is both diagnostic and therapeutic'],
    tata: ['Bronchoscopic removal; do not attempt blind finger sweeps', 'Treat post-obstructive infection after removal'],
    organKey: 'lungs',
    skdi: ['Benda asing', 'Aspirasi', 'Atelektasis'],
  },

  // ══ GASTROENTEROLOGI ══════════════════════════════════════════════════════
  {
    id: 'appendicitis',
    module: 'gastro',
    label: 'Acute appendicitis',
    ringkas: 'A blocked appendix swells, its blood supply fails, and pain moves from the navel to the right lower belly.',
    lesi: [{ struktur: 'Appendix', jenis: 'occlusion', catatan: 'Luminal obstruction by a faecolith or lymphoid hyperplasia.' }],
    hilir: ['Ascending colon'],
    mekanisme:
      'Obstruction turns the appendix into a closed loop. Continued mucus secretion raises intraluminal pressure ' +
      'above venous then arterial pressure, and the wall becomes ischaemic and colonised. The pain migrates ' +
      'because the early visceral afferents refer to the T10 dermatome at the umbilicus; only when inflammation ' +
      'reaches the parietal peritoneum does it become sharp and localised at McBurney\'s point.',
    temuan: [
      'Periumbilical pain migrating to the right iliac fossa, anorexia, low-grade fever',
      'Rebound and guarding; Rovsing, psoas and obturator signs when retrocaecal or pelvic',
      'Alvarado score supports, but does not replace, the clinical decision',
    ],
    penunjang: ['Ultrasound first in children and pregnancy; CT where diagnosis is uncertain in adults', 'White cell count and CRP — normal values do not exclude it'],
    tata: [
      'Appendicectomy; antibiotics alone for selected uncomplicated cases with informed consent about recurrence',
      'Perforation with abscess may be drained first and operated later',
    ],
    organKey: 'large-intestine',
    skdi: ['Apendisitis akut', 'Abses apendiks', 'Peritonitis'],
  },
  {
    id: 'ulkus-peptikum',
    module: 'gastro',
    label: 'Peptic ulcer disease',
    ringkas: 'Acid wins against the stomach or duodenal lining, and a crater forms that can bleed or perforate.',
    lesi: [
      { struktur: 'Duodenum', jenis: 'occlusion', catatan: 'Ulcer of the first part of the duodenum — the commonest site.' },
      { struktur: 'Stomach', jenis: 'occlusion', catatan: 'Gastric ulcer, which unlike a duodenal ulcer may be malignant.' },
    ],
    hilir: ['Hepatic portal vein'],
    mekanisme:
      'Helicobacter pylori and NSAIDs break the balance between acid-peptic attack and mucosal defence. Depth ' +
      'decides the complication: erosion into the gastroduodenal artery on the posterior duodenal wall causes ' +
      'torrential bleeding, while an anterior ulcer perforates freely into the peritoneum. That anatomical ' +
      'difference, not ulcer size, predicts how the patient presents.',
    temuan: [
      'Epigastric pain related to meals; night pain relieved by food suggests duodenal',
      'Haematemesis or melaena; sudden severe pain with board-like rigidity means perforation',
      'Alarm features — weight loss, dysphagia, anaemia, age — demand endoscopy',
    ],
    penunjang: ['H. pylori testing (urea breath or stool antigen) off PPI', 'Endoscopy for alarm features; gastric ulcers must be biopsied and re-scoped'],
    tata: [
      'Eradicate H. pylori; stop or protect against NSAIDs; proton pump inhibitor',
      'Bleeding: resuscitation, endoscopic haemostasis, high-dose PPI; perforation is surgical',
    ],
    organKey: 'stomach',
    skdi: ['Ulkus (gaster, duodenum)', 'Gastritis', 'Perdarahan gastrointestinal'],
  },
  {
    id: 'kolelitiasis',
    module: 'gastro',
    label: 'Gallstones and cholecystitis',
    ringkas: 'A stone blocks the gallbladder outlet; pain comes in waves after fatty food, then becomes constant fever and tenderness.',
    lesi: [
      { struktur: 'Cystic duct', jenis: 'occlusion', catatan: 'Impacted stone — this is what turns colic into cholecystitis.' },
      { struktur: 'Gallbladder', jenis: 'dilatation', catatan: 'Distended, inflamed, and eventually gangrenous if unrelieved.' },
    ],
    hilir: ['Common hepatic duct'],
    mekanisme:
      'A stone impacted in the cystic duct traps concentrated bile; the wall becomes chemically then bacterially ' +
      'inflamed. If instead the stone passes into the common bile duct, obstruction is post-hepatic and jaundice ' +
      'with pale stool and dark urine appears — and if it obstructs the pancreatic outflow as well, gallstone ' +
      'pancreatitis follows. The site of impaction, not the stone, defines the disease.',
    temuan: [
      'Right upper quadrant pain radiating to the shoulder tip after fatty meals',
      'Murphy sign; fever and leucocytosis in cholecystitis',
      'Charcot triad (pain, fever, jaundice) points to cholangitis — an emergency',
    ],
    penunjang: ['Ultrasound first; liver function tests to detect duct obstruction', 'MRCP or endoscopic ultrasound when duct stones are suspected'],
    tata: [
      'Early laparoscopic cholecystectomy for acute cholecystitis',
      'ERCP for duct stones and urgent biliary drainage for cholangitis',
    ],
    organKey: 'gallbladder',
    skdi: ['Kole(doko)litiasis', 'Kolesistitis', 'Empiema dan hidrops kandung empedu'],
  },
  {
    id: 'pankreatitis',
    module: 'gastro',
    label: 'Acute pancreatitis',
    ringkas: 'The pancreas begins to digest itself; the pain bores through to the back.',
    lesi: [
      { struktur: 'Pancreas', jenis: 'dilatation', catatan: 'Oedematous or necrotising inflammation of the gland.' },
      { struktur: 'Parenchyma of pancreas', jenis: 'occlusion', catatan: 'Acinar injury with intraparenchymal enzyme activation.' },
    ],
    hilir: ['Duodenum', 'Common hepatic duct'],
    mekanisme:
      'Premature intra-acinar activation of trypsinogen triggers autodigestion, cytokine release and a systemic ' +
      'inflammatory response. Third-space fluid loss into the retroperitoneum can be enormous, which is why early ' +
      'management is haemodynamic rather than pancreatic: organ failure in the first week, not necrosis on a scan, ' +
      'determines mortality.',
    temuan: [
      'Severe epigastric pain radiating to the back, relieved by sitting forward; vomiting',
      'Gallstones and alcohol account for most cases; hypertriglyceridaemia and drugs for much of the rest',
      'Cullen and Grey Turner signs are late and rare',
    ],
    penunjang: ['Lipase (or amylase) three times the upper limit; ultrasound for gallstones', 'CT after 72 hours if severe or not improving — earlier scans understate necrosis'],
    tata: [
      'Aggressive but goal-directed fluid resuscitation, analgesia, early enteral feeding',
      'Treat the cause: cholecystectomy on the same admission for gallstone pancreatitis',
      'Antibiotics only for proven infection, not prophylactically',
    ],
    organKey: 'pancreas',
    skdi: ['Pankreatitis', 'Kole(doko)litiasis'],
  },
  {
    id: 'sirosis',
    module: 'gastro',
    label: 'Cirrhosis with portal hypertension',
    ringkas: 'A scarred liver dams the blood coming from the gut, and it escapes through veins that were never meant to carry it.',
    lesi: [
      { struktur: 'Caudate lobe of liver', jenis: 'hypertrophy', catatan: 'Fibrosis with regenerative nodules; the caudate lobe classically enlarges.' },
      { struktur: 'Hepatic portal vein', jenis: 'stenosis', derajat: 0.5, catatan: 'Raised sinusoidal resistance transmitted back into the portal vein.' },
    ],
    hilir: ['Esophagus', 'Spleen', 'Pre-hepatic portal vein'],
    mekanisme:
      'Fibrosis and nodular regeneration raise intrahepatic resistance while splanchnic vasodilatation raises ' +
      'inflow, so the portal gradient rises from both directions. Collaterals open at embryological anastomoses; ' +
      'the gastro-oesophageal ones bleed catastrophically because those veins are superficial and thin-walled. ' +
      'Meanwhile failing synthetic and clearance functions produce coagulopathy, ascites and encephalopathy.',
    temuan: [
      'Jaundice, ascites, spider naevi, palmar erythema, gynaecomastia, splenomegaly',
      'Haematemesis from varices; confusion and asterixis in encephalopathy',
      'Child-Pugh and MELD quantify what the examination suggests',
    ],
    penunjang: ['Ultrasound with Doppler; endoscopy to grade varices; albumin, INR, bilirubin', 'Ascitic tap with cell count to exclude spontaneous bacterial peritonitis'],
    tata: [
      'Treat the cause (alcohol, viral hepatitis, metabolic); vaccinate; avoid hepatotoxins',
      'Non-selective beta blocker or banding for varices; salt restriction and diuretics for ascites; lactulose and rifaximin for encephalopathy',
      'Six-monthly ultrasound surveillance for hepatocellular carcinoma; transplant assessment',
    ],
    organKey: 'liver',
    skdi: ['Sirosis hepatis', 'Varises esofagus', 'Gagal hepar'],
  },
  {
    id: 'hirschsprung',
    module: 'gastro',
    label: 'Hirschsprung disease (congenital)',
    ringkas: 'A length of bowel is born without nerve cells, so it never relaxes and stool cannot pass.',
    lesi: [
      { struktur: 'Rectum', jenis: 'stenosis', derajat: 0.8, catatan: 'Aganglionic, permanently contracted segment — always includes the rectum.' },
    ],
    hilir: ['Descending colon', 'Transverse colon'],
    mekanisme:
      'Neural crest cells migrate craniocaudally through the gut during weeks 5–12; arrest of that migration ' +
      'leaves the distal bowel without submucosal and myenteric ganglia. The aganglionic segment is tonically ' +
      'contracted, so the obstruction is functional and the dilated bowel proximal to it is the normal part — the ' +
      'reason the biopsy must be taken from the narrow segment, not the wide one.',
    temuan: [
      'Failure to pass meconium within 48 hours; abdominal distension and bilious vomiting',
      'Explosive release of stool on rectal examination',
      'Enterocolitis with fever and foul diarrhoea is the life-threatening complication',
    ],
    penunjang: ['Contrast enema showing a transition zone; anorectal manometry', 'Suction rectal biopsy is the diagnostic standard — absent ganglion cells'],
    tata: [
      'Decompress and treat enterocolitis first — it is what kills, not the obstruction itself',
      'Pull-through resection of the aganglionic segment once the child is stable',
      'Long-term follow-up for constipation, soiling and recurrent enterocolitis after surgery',
    ],
    organKey: 'large-intestine',
    skdi: ['Penyakit Hirschsprung', 'Ileus'],
  },

  // ══ NEFROLOGI ═════════════════════════════════════════════════════════════
  {
    id: 'aki',
    module: 'nefrologi',
    label: 'Acute kidney injury',
    ringkas: 'The kidneys stop filtering over hours to days — usually because they are underperfused.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'occlusion', catatan: 'Tubular injury and back-leak of filtrate.' },
      { struktur: 'Right kidney', jenis: 'occlusion', catatan: 'Injury is bilateral — one kidney alone cannot explain a rising creatinine.' },
    ],
    hilir: ['Left ureter', 'Right ureter', 'Urinary bladder'],
    mekanisme:
      'Autoregulation holds glomerular filtration constant down to a mean pressure near 80 mmHg by dilating the ' +
      'afferent arteriole (prostaglandins) and constricting the efferent one (angiotensin II). NSAIDs block the ' +
      'first and ACE inhibitors the second, which is why the combination plus hypovolaemia — the "triple whammy" — ' +
      'converts a survivable hypotensive episode into acute tubular necrosis.',
    temuan: [
      'Oliguria, rising creatinine, fluid overload or hyperkalaemia',
      'Always separate pre-renal, renal and post-renal — the third is reversible with a catheter',
      'Look for hypotension, sepsis, nephrotoxins and contrast exposure',
    ],
    penunjang: ['Creatinine and urine output (KDIGO staging), electrolytes, urinalysis', 'Ultrasound to exclude obstruction; ECG if potassium is high'],
    tata: [
      'Restore perfusion, stop nephrotoxins, relieve obstruction',
      'Treat hyperkalaemia and acidosis; dialysis for refractory overload, acidosis, potassium or uraemia',
    ],
    organKey: 'kidneys',
    skdi: ['Acute kidney injury', 'Nekrosis tubular akut'],
  },
  {
    id: 'ckd',
    module: 'nefrologi',
    label: 'Chronic kidney disease',
    ringkas: 'Nephrons are lost slowly and permanently; the ones left over-work and then fail too.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'stenosis', derajat: 0.6, catatan: 'Glomerulosclerosis and interstitial fibrosis; the kidney shrinks.' },
      { struktur: 'Right kidney', jenis: 'stenosis', derajat: 0.6, catatan: 'Symmetrically small kidneys on ultrasound.' },
    ],
    hilir: ['Left renal vein', 'Right renal vein'],
    mekanisme:
      'Surviving nephrons hyperfiltrate to compensate; the raised intraglomerular pressure is itself injurious, so ' +
      'loss becomes self-sustaining regardless of the original insult. This is exactly why renin–angiotensin ' +
      'blockade and SGLT2 inhibition protect the kidney: they lower intraglomerular pressure, and a small early ' +
      'creatinine rise on starting them is the expected haemodynamic effect, not harm.',
    temuan: [
      'Often silent until advanced; fatigue, nocturia, pruritus, anaemia',
      'Hypertension, proteinuria and small kidneys; renal bone disease and hyperkalaemia later',
    ],
    penunjang: ['eGFR and albumin–creatinine ratio (both, not creatinine alone), staged G1–G5/A1–A3', 'Ultrasound, calcium, phosphate, PTH, haemoglobin'],
    tata: [
      'Blood pressure and glycaemic control; ACE inhibitor or ARB plus SGLT2 inhibitor where indicated',
      'Treat anaemia, bone-mineral disorder and acidosis; avoid nephrotoxins; plan access before dialysis is needed',
    ],
    organKey: 'kidneys',
    skdi: ['Penyakit ginjal kronik', 'Glomerulonefritis kronik'],
  },
  {
    id: 'nefrotik',
    module: 'nefrologi',
    label: 'Nephrotic syndrome',
    ringkas: 'The filter leaks protein: the body swells, the blood thickens, and infections come easily.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'incompetence', catatan: 'Podocyte injury — the glomerular barrier loses its charge and size selectivity.' },
      { struktur: 'Right kidney', jenis: 'incompetence', catatan: 'Bilateral podocytopathy.' },
    ],
    hilir: ['Urinary bladder'],
    mekanisme:
      'Podocyte foot-process effacement allows heavy albuminuria. Falling oncotic pressure and primary renal ' +
      'sodium retention produce oedema, while urinary loss of antithrombin III and immunoglobulins creates a ' +
      'prothrombotic, infection-prone state — the reason renal vein thrombosis and pneumococcal peritonitis are ' +
      'classic complications rather than incidental ones.',
    temuan: [
      'Periorbital and dependent oedema; frothy urine',
      'Proteinuria above 3.5 g/day, hypoalbuminaemia, hyperlipidaemia',
    ],
    penunjang: ['Urine protein quantification, albumin, lipids; screen for diabetes, hepatitis, HIV, lupus', 'Renal biopsy in adults and in steroid-resistant children'],
    tata: [
      'Corticosteroids for minimal change disease (most children); immunosuppression by histology in adults',
      'Salt restriction and diuretics; ACE inhibitor or ARB for proteinuria; treat complications early',
    ],
    organKey: 'kidneys',
    skdi: ['Sindrom nefrotik', 'Glomerulonefritis akut'],
  },
  {
    id: 'urolitiasis',
    module: 'nefrologi',
    label: 'Urinary stone and renal colic',
    ringkas: 'A stone jams in the ureter; the pain comes in waves and cannot be relieved by lying still.',
    lesi: [
      { struktur: 'Left ureter', jenis: 'occlusion', catatan: 'Impaction at one of the three narrowings: pelviureteric junction, pelvic brim, vesicoureteric junction.' },
    ],
    hilir: ['Left kidney'],
    mekanisme:
      'Obstruction raises pressure in the collecting system; the ureter contracts against it, producing colic ' +
      'referred from loin to groin along T11–L2. Sustained pressure lowers filtration in that kidney within hours, ' +
      'and infection behind an obstruction is a urological emergency because antibiotics cannot reach a closed, ' +
      'pus-filled system — it must be drained.',
    temuan: [
      'Sudden severe loin-to-groin pain with restlessness, nausea and haematuria',
      'Fever with obstruction means infected obstructed system — decompress urgently',
    ],
    penunjang: ['Non-contrast CT of kidneys, ureters and bladder is the standard; ultrasound first in pregnancy and children', 'Urinalysis, renal function, calcium and urate'],
    tata: [
      'Analgesia with NSAIDs; most stones under 5 mm pass; medical expulsive therapy for selected distal stones',
      'Urgent drainage (stent or nephrostomy) for infection, single kidney or acute kidney injury',
      'Prevent recurrence: fluid intake, dietary and metabolic assessment',
    ],
    organKey: 'kidneys',
    skdi: ['Kolik renal', 'Infeksi saluran kemih', 'Pielonefritis tanpa komplikasi'],
  },

  // ══ ENDOKRIN & METABOLIK ══════════════════════════════════════════════════
  {
    id: 'dm2',
    module: 'endokrin',
    label: 'Type 2 diabetes mellitus',
    ringkas: 'The body stops listening to insulin, and the pancreas eventually cannot shout loud enough.',
    lesi: [
      { struktur: 'Parenchyma of pancreas', jenis: 'incompetence', catatan: 'Beta-cell mass and function decline progressively — this is not a static disease.' },
    ],
    hilir: ['Left kidney', 'Right kidney', 'Caudate lobe of liver'],
    mekanisme:
      'Insulin resistance in muscle, liver and fat is compensated by hyperinsulinaemia until beta-cell function ' +
      'fails; by diagnosis roughly half of it is already lost, which is why the disease progresses even with good ' +
      'early control. Chronic hyperglycaemia damages microvasculature through polyol flux, advanced glycation and ' +
      'protein kinase C activation, giving retinopathy, nephropathy and neuropathy their shared time course.',
    temuan: [
      'Often asymptomatic; polyuria, polydipsia, weight loss, recurrent infections when marked',
      'Screen for retinopathy, albuminuria, neuropathy and foot risk at diagnosis, not years later',
    ],
    penunjang: ['Fasting or random plasma glucose, HbA1c, oral glucose tolerance test where uncertain', 'Lipids, renal function, albumin–creatinine ratio, retinal screening, foot examination'],
    tata: [
      'Structured lifestyle change and metformin as the base of therapy',
      'Add SGLT2 inhibitor or GLP-1 receptor agonist when cardiovascular, renal or weight indications exist — outcome, not glucose alone',
      'Blood pressure and lipid control deliver more absolute risk reduction than tight glycaemia in most patients',
    ],
    organKey: 'pancreas',
    skdi: ['Diabetes melitus tipe 2', 'Sindrom metabolik', 'Dislipidemia'],
  },
  {
    id: 'ketoasidosis',
    module: 'endokrin',
    label: 'Diabetic ketoacidosis',
    ringkas: 'Without insulin the body burns fat for fuel and the blood turns acid — an emergency of fluid, potassium and insulin.',
    lesi: [
      { struktur: 'Parenchyma of pancreas', jenis: 'occlusion', catatan: 'Absolute insulin deficiency — autoimmune beta-cell destruction or omitted insulin.' },
    ],
    hilir: ['Left kidney', 'Right kidney'],
    mekanisme:
      'Insulin deficiency plus counter-regulatory excess drives lipolysis and hepatic ketogenesis. Osmotic ' +
      'diuresis causes profound water and total-body potassium depletion, yet measured potassium is often normal ' +
      'or high because acidosis shifts it out of cells. Insulin drives it back in — which is why potassium must be ' +
      'replaced as insulin starts, and why the first hour is fluid, not insulin.',
    temuan: [
      'Polyuria, vomiting, abdominal pain, Kussmaul breathing, ketotic breath, dehydration',
      'Hyperglycaemia, ketonaemia and metabolic acidosis together — all three define it',
    ],
    penunjang: ['Capillary ketones, venous blood gas, glucose, potassium hourly', 'Look for the precipitant: infection, infarction, non-adherence'],
    tata: [
      'Isotonic fluid first, then fixed-rate insulin infusion with potassium replacement',
      'Do not stop insulin when glucose normalises — add dextrose and continue until ketones clear',
      'Treat the precipitant; watch for cerebral oedema in children',
    ],
    organKey: 'pancreas',
    skdi: ['Ketoasidosis diabetikum nonketotik', 'Diabetes melitus tipe 1', 'Hiperglikemi hiperosmolar'],
  },
  {
    id: 'cushing',
    module: 'endokrin',
    label: 'Cushing syndrome',
    ringkas: 'Too much cortisol for too long: the face rounds, the middle thickens, and the limbs waste.',
    lesi: [
      { struktur: 'Left adrenal gland', jenis: 'hypertrophy', catatan: 'Bilateral hyperplasia when ACTH-driven; a unilateral adenoma when adrenal in origin.' },
      { struktur: 'Pituitary gland', jenis: 'hypertrophy', catatan: 'Corticotroph adenoma in Cushing disease — the commonest endogenous cause.' },
    ],
    hilir: ['Right adrenal gland', 'Left kidney'],
    mekanisme:
      'Chronic glucocorticoid excess is catabolic in muscle, bone and skin while anabolic centrally, producing the ' +
      'characteristic fat redistribution. It raises blood pressure through mineralocorticoid receptor cross-over, ' +
      'causes insulin resistance and suppresses the hypothalamic–pituitary–adrenal axis — which is why abrupt ' +
      'withdrawal of long-term steroids precipitates adrenal crisis.',
    temuan: [
      'Moon face, central obesity, buffalo hump, purple striae wider than 1 cm, proximal myopathy',
      'Hypertension, hyperglycaemia, osteoporosis, easy bruising, mood change',
      'Exogenous steroid is by far the commonest cause — ask about every route, including topical and injected',
    ],
    penunjang: ['Confirm excess first: overnight dexamethasone suppression, late-night salivary cortisol or 24-hour urinary free cortisol', 'Then localise with ACTH, high-dose suppression and imaging — never image first'],
    tata: [
      'Withdraw exogenous steroid gradually where that is the cause',
      'Transsphenoidal surgery for pituitary disease; adrenalectomy for adrenal tumours; treat the ectopic source',
    ],
    organKey: 'adrenal',
    skdi: ['Cushing\'s disease', 'Hipertensi sekunder', 'Osteoporosis'],
  },
  {
    id: 'krisis-adrenal',
    module: 'endokrin',
    label: 'Adrenal insufficiency and crisis',
    ringkas: 'The adrenal glands cannot make cortisol; under stress, blood pressure collapses.',
    lesi: [
      { struktur: 'Left adrenal gland', jenis: 'occlusion', catatan: 'Autoimmune destruction, tuberculosis, haemorrhage or metastasis.' },
      { struktur: 'Right adrenal gland', jenis: 'occlusion', catatan: 'Both glands must fail before primary insufficiency appears.' },
    ],
    hilir: ['Left kidney', 'Right kidney'],
    mekanisme:
      'Loss of cortisol removes the permissive effect on vascular catecholamine responsiveness, so vasodilatory ' +
      'shock develops that does not respond to fluids or pressors alone. In primary disease aldosterone is lost ' +
      'too, adding hyponatraemia, hyperkalaemia and volume depletion; ACTH excess drives the pigmentation that ' +
      'distinguishes primary from secondary failure.',
    temuan: [
      'Fatigue, weight loss, postural hypotension, salt craving, hyperpigmentation',
      'Crisis: shock, vomiting, abdominal pain, confusion, hypoglycaemia — often triggered by infection or surgery',
    ],
    penunjang: ['Early-morning cortisol and ACTH; Short Synacthen test to confirm', 'Electrolytes, glucose; adrenal autoantibodies or imaging for cause'],
    tata: [
      'Crisis: immediate hydrocortisone and isotonic fluid — treat before the test result returns',
      'Lifelong replacement with sick-day rules, emergency injection kit and a steroid card',
    ],
    organKey: 'adrenal',
    skdi: ['Krisis adrenal', 'Addison\'s disease'],
  },

  // ══ NEUROLOGI & PSIKIATRI ═════════════════════════════════════════════════
  {
    id: 'stroke-iskemik',
    module: 'neurologi',
    label: 'Ischaemic stroke (MCA territory)',
    ringkas: 'A blocked brain artery: face, arm and speech fail suddenly on one side.',
    lesi: [
      { struktur: 'Insular part of left middle cerebral artery', jenis: 'occlusion', catatan: 'Thromboembolic occlusion of the middle cerebral artery.' },
    ],
    hilir: ['Left insula', 'Left precentral gyrus', 'Left postcentral gyrus', 'Left putamen'],
    mekanisme:
      'Flow below roughly 20 mL/100 g/min silences neurons but keeps them alive — the penumbra — while flow below ' +
      '10 kills them within minutes. Reperfusion targets the penumbra, which is why time and collateral quality ' +
      'both matter; the motor homunculus explains the face-and-arm predominance, since the leg area is supplied by ' +
      'the anterior cerebral artery.',
    temuan: [
      'Sudden contralateral face and arm weakness, gaze deviation, aphasia or neglect',
      'NIHSS quantifies severity and guides thrombectomy decisions',
    ],
    penunjang: ['Immediate non-contrast CT to exclude haemorrhage, then CT angiography', 'Glucose, ECG for atrial fibrillation, carotid imaging, echocardiography'],
    tata: [
      'Thrombolysis within the window; thrombectomy for large-vessel occlusion',
      'Stroke unit care, swallow screen before anything by mouth, early mobilisation',
      'Secondary prevention aimed at the mechanism found — anticoagulate atrial fibrillation, not everything',
    ],
    organKey: 'brain',
    skdi: ['Infark serebral', 'TIA', 'Afasia'],
  },
  {
    id: 'perdarahan-intraserebral',
    module: 'neurologi',
    label: 'Hypertensive intracerebral haemorrhage',
    ringkas: 'A small deep artery bursts; the clot itself pushes the brain aside.',
    lesi: [
      { struktur: 'Left putamen', jenis: 'thrombus', catatan: 'Basal ganglia haematoma — the classic hypertensive site.' },
    ],
    hilir: ['Left globus pallidus', 'Left thalamus', 'Left lateral ventricle'],
    mekanisme:
      'Chronic hypertension causes lipohyalinosis and Charcot–Bouchard microaneurysms on the lenticulostriate ' +
      'perforators, which supply the putamen, thalamus, pons and cerebellum — the four sites that account for most ' +
      'hypertensive bleeds. Injury is mechanical as well as ischaemic: haematoma expansion in the first hours is ' +
      'the modifiable determinant of outcome, hence early blood-pressure lowering and reversal of anticoagulation.',
    temuan: [
      'Sudden deficit with headache, vomiting and depressed consciousness more often than in infarction',
      'Clinical features cannot reliably separate bleed from infarct — imaging can',
    ],
    penunjang: ['Non-contrast CT immediately; coagulation screen and platelet count', 'CT angiography if a vascular malformation is suspected in a young or atypical patient'],
    tata: [
      'Reverse anticoagulation urgently; controlled blood-pressure lowering',
      'Neurosurgical referral for cerebellar haemorrhage, hydrocephalus or deteriorating consciousness',
    ],
    organKey: 'brain',
    skdi: ['Hematom intraserebral', 'Hipertensi esensial', 'Koma'],
  },
  {
    id: 'epilepsi-temporal',
    module: 'neurologi',
    label: 'Mesial temporal lobe epilepsy',
    ringkas: 'Scarring in the memory area of the temporal lobe starts seizures that begin with a rising odd feeling.',
    lesi: [
      { struktur: 'Left hippocampus', jenis: 'stenosis', derajat: 0.5, catatan: 'Hippocampal sclerosis — atrophy with neuronal loss and gliosis.' },
    ],
    hilir: ['Left amygdala', 'Left parahippocampal gyrus', 'Left inferior temporal gyrus'],
    mekanisme:
      'Loss of hilar interneurons removes inhibition while mossy-fibre sprouting creates recurrent excitatory ' +
      'circuits, so the hippocampus becomes an epileptogenic generator. Spread through limbic connections explains ' +
      'the semiology: an epigastric rising aura and déjà vu, then behavioural arrest with oral and manual ' +
      'automatisms, and post-ictal dysphasia when the dominant side is involved.',
    temuan: [
      'Focal seizures with impaired awareness, automatisms, post-ictal confusion',
      'History of febrile status epilepticus in childhood is common',
    ],
    penunjang: ['EEG (interictal temporal spikes) and epilepsy-protocol MRI showing hippocampal atrophy', 'Video-EEG telemetry when surgery is considered'],
    tata: [
      'Antiseizure medication chosen by seizure type, comorbidity, and pregnancy plans',
      'Refer early for epilepsy surgery in drug-resistant cases — two failed appropriate drugs define resistance',
      'Safety counselling, driving rules, adherence and sleep',
    ],
    organKey: 'brain',
    skdi: ['Epilepsi', 'Kejang', 'Status epileptikus'],
  },
  {
    id: 'parkinson',
    module: 'neurologi',
    label: 'Parkinson disease',
    ringkas: 'Dopamine cells in the midbrain die slowly; movement becomes small, stiff and slow.',
    lesi: [
      { struktur: 'Midbrain', jenis: 'occlusion', catatan: 'Loss of dopaminergic neurons in the substantia nigra pars compacta.' },
    ],
    hilir: ['Left putamen', 'Right putamen', 'Left globus pallidus', 'Right globus pallidus'],
    mekanisme:
      'Nigrostriatal dopamine loss disinhibits the indirect pathway and underdrives the direct one, so the ' +
      'thalamus is over-inhibited and movement is impoverished. Symptoms appear only after roughly 50–70% of ' +
      'nigral neurons are lost, which is why the disease is well established at the moment of diagnosis and why ' +
      'non-motor features often precede the tremor by years.',
    temuan: [
      'Bradykinesia with rest tremor or rigidity; asymmetric onset',
      'Micrographia, hypomimia, reduced arm swing, festinating gait',
      'Anosmia, REM sleep behaviour disorder, constipation and depression often come first',
    ],
    penunjang: ['Clinical diagnosis; imaging mainly to exclude alternatives', 'Response to levodopa supports it — absence of response should prompt review'],
    tata: [
      'Levodopa with a decarboxylase inhibitor; dopamine agonists and MAO-B inhibitors by age and comorbidity',
      'Physiotherapy, speech and swallow therapy; review for motor fluctuations and impulse-control disorders',
      'Never stop dopaminergic therapy abruptly',
    ],
    organKey: 'brain',
    skdi: ['Parkinson', 'Gangguan pergerakan lainnya'],
  },
  {
    id: 'hidrosefalus',
    module: 'neurologi',
    label: 'Hydrocephalus',
    ringkas: 'Cerebrospinal fluid cannot drain; the ventricles swell and press on the brain from inside.',
    lesi: [
      { struktur: 'Cerebral aqueduct', jenis: 'stenosis', derajat: 0.9, catatan: 'Aqueduct stenosis — the classic site of obstructive hydrocephalus.' },
    ],
    hilir: ['Third ventricle', 'Left lateral ventricle', 'Right lateral ventricle'],
    mekanisme:
      'About 500 mL of cerebrospinal fluid is produced daily and must reach the arachnoid granulations. Obstruction ' +
      'anywhere along that path dilates the spaces upstream while the fourth ventricle stays normal in aqueduct ' +
      'stenosis — the anatomical signature on imaging. In infants the skull expands and the head circumference ' +
      'crosses centiles; after fusion, pressure rises instead and papilloedema appears.',
    temuan: [
      'Infant: rapidly enlarging head, bulging fontanelle, sunsetting eyes, irritability',
      'Adult: headache worse lying flat, vomiting, papilloedema, gait disturbance',
      'Normal-pressure hydrocephalus: gait apraxia, incontinence and cognitive slowing',
    ],
    penunjang: ['Cranial ultrasound in infants; CT or MRI to show the level of obstruction', 'Measure head circumference serially — a single value says little'],
    tata: ['Ventriculoperitoneal shunt or endoscopic third ventriculostomy; treat the cause', 'Shunt complications — blockage, infection, over-drainage — need lifelong awareness'],
    organKey: 'brain',
    skdi: ['Hidrosefalus'],
  },

  // ══ THT ═══════════════════════════════════════════════════════════════════
  {
    id: 'tonsilofaringitis',
    module: 'tht',
    label: 'Tonsillopharyngitis',
    ringkas: 'A sore throat with swollen tonsils — most are viral, and the question is which ones are not.',
    lesi: [
      { struktur: 'Left superior pharyngeal constrictor', jenis: 'hypertrophy', catatan: 'Inflamed pharyngeal wall and tonsillar bed.' },
      { struktur: 'Right superior pharyngeal constrictor', jenis: 'hypertrophy', catatan: 'Bilateral involvement.' },
    ],
    hilir: ['Epiglottis', 'Left vocal ligament'],
    mekanisme:
      'Most cases are viral. The reason group A streptococcus still matters is not the sore throat itself but its ' +
      'sequelae: molecular mimicry between M protein and cardiac myosin drives acute rheumatic fever weeks later, ' +
      'and immune-complex deposition causes post-streptococcal glomerulonephritis. Antibiotics change the first ' +
      'risk far more than the second.',
    temuan: [
      'Fever, odynophagia, tender cervical nodes; exudate and absent cough favour bacterial (Centor)',
      'Trismus, unilateral swelling and a deviated uvula mean peritonsillar abscess',
      'Drooling, stridor and a toxic child suggest epiglottitis — do not examine the throat',
    ],
    penunjang: ['Rapid antigen or throat culture where Centor criteria are met', 'Avoid antibiotics for scores that do not warrant them'],
    tata: [
      'Analgesia and fluids for all; penicillin for confirmed or high-probability streptococcal infection',
      'Drain a peritonsillar abscess; secure the airway first in epiglottitis',
    ],
    organKey: 'pharynx',
    skdi: ['Tonsilitis', 'Faringitis', 'Abses peritonsilar'],
  },
  {
    id: 'rinosinusitis',
    module: 'tht',
    label: 'Rhinosinusitis',
    ringkas: 'Blocked sinus drainage: pressure in the face, thick discharge, and a nose that will not clear.',
    lesi: [
      { struktur: 'Left inferior nasal concha', jenis: 'hypertrophy', catatan: 'Mucosal oedema obstructing the ostiomeatal complex.' },
      { struktur: 'Septal nasal cartilage', jenis: 'stenosis', derajat: 0.4, catatan: 'A deviated septum narrows the airway and worsens drainage.' },
    ],
    hilir: ['Right inferior nasal concha', 'Left lateral nasal cartilage'],
    mekanisme:
      'The sinuses drain through a narrow ostiomeatal complex lined by ciliated epithelium. Oedema blocks the ' +
      'ostium, mucociliary clearance stalls, and the trapped mucus becomes a culture medium. Because the orbit is ' +
      'separated from the ethmoid by paper-thin bone, spread produces periorbital cellulitis — the complication ' +
      'that turns a common illness into an emergency.',
    temuan: [
      'Nasal obstruction, purulent discharge, facial pain, reduced smell for more than 10 days',
      'Red flags: orbital swelling, visual change, severe headache, neurological signs',
    ],
    penunjang: ['Clinical diagnosis; nasal endoscopy for chronic disease', 'CT only for complications, chronic disease or surgical planning — not routinely'],
    tata: [
      'Saline irrigation and intranasal corticosteroid; antibiotics only for the minority that meet criteria',
      'Urgent imaging and admission for orbital or intracranial complications',
    ],
    organKey: 'nasal-septum',
    skdi: ['Sinusitis', 'Rhinitis akut', 'Deviasi septum hidung'],
  },
  {
    id: 'osa',
    module: 'tht',
    label: 'Obstructive sleep apnoea',
    ringkas: 'The throat closes repeatedly during sleep; the night is fragmented and the day is spent exhausted.',
    lesi: [
      { struktur: 'Tongue', jenis: 'hypertrophy', catatan: 'Posterior tongue collapse against the pharyngeal wall during sleep.' },
      { struktur: 'Left palatopharyngeus', jenis: 'incompetence', catatan: 'Loss of pharyngeal dilator tone in sleep.' },
    ],
    hilir: ['Epiglottis', 'Trachea'],
    mekanisme:
      'The pharynx has no rigid skeleton; it stays open because dilator muscles counteract negative inspiratory ' +
      'pressure. Sleep withdraws that tone, the airway collapses, and each apnoea ends in an arousal with a surge ' +
      'of sympathetic activity. Repeated hundreds of times a night, this produces non-dipping nocturnal ' +
      'hypertension and daytime somnolence — the cardiovascular risk comes from the arousals, not the snoring.',
    temuan: [
      'Loud snoring, witnessed apnoeas, unrefreshing sleep, morning headache, daytime sleepiness',
      'Obesity, large neck circumference, retrognathia, nasal obstruction',
      'STOP-BANG or Epworth to stratify — then test, not treat, on suspicion',
    ],
    penunjang: ['Polysomnography or validated home sleep testing to obtain the apnoea–hypopnoea index'],
    tata: [
      'Weight reduction, positional therapy, alcohol and sedative avoidance',
      'CPAP for moderate-severe disease; mandibular advancement for selected mild cases; surgery for specific anatomical obstruction',
      'Driving advice is a legal as well as a clinical duty',
    ],
    organKey: 'pharynx',
    skdi: ['Obstructive Sleep Apnea (OSA)', 'Hipertrofi adenoid'],
  },
  {
    id: 'laringitis',
    module: 'tht',
    label: 'Laryngitis and voice disorders',
    ringkas: 'Inflamed vocal folds cannot vibrate evenly, and the voice goes husky or disappears.',
    lesi: [
      { struktur: 'Left vocal ligament', jenis: 'hypertrophy', catatan: 'Oedematous, thickened fold with impaired mucosal wave.' },
      { struktur: 'Right vocal ligament', jenis: 'hypertrophy', catatan: 'Usually bilateral in inflammatory causes.' },
    ],
    hilir: ['Thyroid cartilage', 'Cricoid cartilage', 'Trachea'],
    mekanisme:
      'Voice is produced by a mucosal wave travelling over the vocal ligament; anything that stiffens or thickens ' +
      'that layer degrades it. Inflammation does so reversibly, but persistent hoarseness beyond three weeks — ' +
      'particularly in a smoker — must be assumed to be laryngeal carcinoma until the cords have actually been ' +
      'seen. Hoarseness is a symptom that requires looking, not prescribing.',
    temuan: [
      'Hoarseness, vocal fatigue, throat discomfort; aphonia in severe acute cases',
      'Red flags: hoarseness over three weeks, neck lump, stridor, dysphagia, weight loss, smoking',
    ],
    penunjang: ['Laryngoscopy for persistent hoarseness — always', 'Consider reflux, thyroid disease and recurrent laryngeal nerve palsy'],
    tata: [
      'Voice rest, hydration, treat the cause; avoid whispering, which strains more than soft speech',
      'Speech therapy for functional disorders; urgent ENT referral for red flags',
    ],
    organKey: 'larynx',
    skdi: ['Laringitis', 'Karsinoma laring'],
  },

  // ══ MATA ══════════════════════════════════════════════════════════════════
  {
    id: 'katarak',
    module: 'mata',
    label: 'Cataract',
    ringkas: 'The lens turns cloudy, and vision fades like a window fogging over.',
    lesi: [
      { struktur: 'Left lens', jenis: 'stenosis', derajat: 0.6, catatan: 'Progressive opacification of lens proteins.' },
      { struktur: 'Right lens', jenis: 'stenosis', derajat: 0.6, catatan: 'Usually bilateral but asymmetric.' },
    ],
    hilir: ['Optic part of left retina', 'Optic part of right retina'],
    mekanisme:
      'Lens transparency depends on the ordered packing of crystallins in cells that have no organelles and no ' +
      'blood supply. Oxidative damage and glycation aggregate those proteins, scattering light. Nuclear ' +
      'sclerosis first increases the refractive index — the "second sight" of an elderly patient who suddenly ' +
      'reads without glasses — before opacity wins.',
    temuan: [
      'Gradual painless blurring, glare and haloes around lights, faded colours',
      'Reduced red reflex; the fundus becomes hard to see',
      'A white pupil (leukocoria) in a child is not cataract until retinoblastoma is excluded',
    ],
    penunjang: ['Visual acuity, slit-lamp examination, fundus assessment; biometry before surgery'],
    tata: [
      'Surgery when vision limits the life the patient actually leads — not at a fixed acuity',
      'Phacoemulsification with intraocular lens implantation; treat congenital cataract urgently to prevent amblyopia',
    ],
    organKey: 'eye',
    skdi: ['Katarak', 'Afakia kongenital'],
  },
  {
    id: 'glaukoma',
    module: 'mata',
    label: 'Glaucoma',
    ringkas: 'Pressure inside the eye damages the optic nerve, stealing side vision before the centre.',
    lesi: [
      { struktur: 'Anterior chamber of left eyeball', jenis: 'occlusion', catatan: 'Impaired aqueous outflow — trabecular in open-angle, iridocorneal apposition in closed-angle.' },
      { struktur: 'Left optic nerve', jenis: 'stenosis', derajat: 0.5, catatan: 'Retinal ganglion cell axon loss with cupping of the disc.' },
    ],
    hilir: ['Optic part of left retina', 'Optic chiasm'],
    mekanisme:
      'Aqueous is produced by the ciliary body and drains through the trabecular meshwork. Obstruction raises ' +
      'intraocular pressure, which injures axons at the lamina cribrosa — the weakest point of the scleral canal. ' +
      'Peripheral arcuate fibres are damaged first, so field loss precedes any change in acuity, and the patient ' +
      'notices nothing until the disease is advanced.',
    temuan: [
      'Open-angle: asymptomatic until late; increased cup-to-disc ratio, arcuate field defects',
      'Acute angle-closure: severe pain, red eye, mid-dilated fixed pupil, haloes, vomiting, hard eye',
    ],
    penunjang: ['Tonometry, gonioscopy, optic disc assessment, visual fields, OCT of the nerve fibre layer'],
    tata: [
      'Chronic: topical pressure-lowering therapy, laser trabeculoplasty, surgery; lifelong monitoring',
      'Acute closure is an emergency: lower pressure medically then laser peripheral iridotomy, and treat the other eye prophylactically',
    ],
    organKey: 'eye',
    skdi: ['Glaukoma akut', 'Glaukoma lainnya', 'Optic disc cupping'],
  },
  {
    id: 'retinopati-diabetik',
    module: 'mata',
    label: 'Diabetic retinopathy',
    ringkas: 'Years of high sugar damage the retina\'s tiny vessels; new fragile ones grow and bleed.',
    lesi: [
      { struktur: 'Optic part of left retina', jenis: 'incompetence', catatan: 'Microaneurysms, haemorrhages, then neovascularisation.' },
      { struktur: 'Optic part of right retina', jenis: 'incompetence', catatan: 'Bilateral and symmetrical in most patients.' },
    ],
    hilir: ['Left vitreous body', 'Right vitreous body'],
    mekanisme:
      'Pericyte loss and basement-membrane thickening make capillaries leaky and then occluded. Ischaemic retina ' +
      'releases VEGF, which drives neovascularisation on a surface that offers no support, so the new vessels ' +
      'bleed into the vitreous and contract into tractional detachment. Anti-VEGF therapy works precisely because ' +
      'it interrupts that signal.',
    temuan: [
      'Asymptomatic until maculopathy or haemorrhage — screening is the only way to find it in time',
      'Sudden floaters or vision loss suggests vitreous haemorrhage',
    ],
    penunjang: ['Dilated fundus examination or retinal photography at diagnosis and annually', 'OCT for macular oedema; fluorescein angiography for ischaemia'],
    tata: [
      'Glycaemic, blood pressure and lipid control slow progression',
      'Anti-VEGF injection for macular oedema; panretinal photocoagulation for proliferative disease; vitrectomy for non-clearing haemorrhage',
    ],
    organKey: 'eye',
    skdi: ['Retinopati (diabetik, hipertensi, prematur)', 'Perdarahan Vitreous', 'Ablasio retina'],
  },
  {
    id: 'strabismus',
    module: 'mata',
    label: 'Strabismus and amblyopia',
    ringkas: 'The eyes do not point together; in a child, the brain switches one off unless it is treated early.',
    lesi: [
      { struktur: 'Left medial rectus', jenis: 'incompetence', catatan: 'Imbalance of extraocular muscle action or innervation.' },
      { struktur: 'Left lateral rectus', jenis: 'incompetence', catatan: 'Lateral rectus palsy (sixth nerve) causes convergent deviation.' },
    ],
    hilir: ['Optic part of left retina', 'Left optic nerve'],
    mekanisme:
      'Binocular vision develops only if both foveae receive matching images during the critical period. Persistent ' +
      'misalignment produces diplopia and confusion, and the immature visual cortex suppresses one image; the ' +
      'suppressed eye then fails to develop normal acuity. Amblyopia is therefore a cortical, time-limited ' +
      'diagnosis — which is why treatment before school age matters more than the cosmetic alignment.',
    temuan: [
      'Abnormal corneal light reflex, positive cover test, head turn to compensate',
      'A new squint with diplopia in an adult is a cranial nerve problem until proven otherwise',
    ],
    penunjang: ['Cover and alternate cover tests, cycloplegic refraction, fundus examination', 'Neuroimaging for acute adult palsies, especially with pain or pupil involvement'],
    tata: [
      'Correct refractive error; patch or penalise the better eye to treat amblyopia',
      'Surgery for residual deviation after refractive and amblyopia treatment',
    ],
    organKey: 'eye',
    skdi: ['Ambliopia', 'Diplopia binokuler', 'Anisometropia pada anak'],
  },

  // ══ ORTOPEDI ══════════════════════════════════════════════════════════════
  {
    id: 'osteoartritis',
    module: 'ortopedi',
    label: 'Knee osteoarthritis',
    ringkas: 'The cartilage of the knee wears through; the joint aches with use and stiffens after rest.',
    lesi: [
      { struktur: 'Left femur', jenis: 'stenosis', derajat: 0.4, catatan: 'Cartilage loss with subchondral sclerosis at the medial femoral condyle.' },
      { struktur: 'Left tibia', jenis: 'stenosis', derajat: 0.4, catatan: 'Medial compartment narrowing — the varus knee wears here first.' },
    ],
    hilir: ['Left patella', 'Left rectus femoris'],
    mekanisme:
      'Osteoarthritis is active joint remodelling, not passive wear: chondrocytes upregulate metalloproteinases, ' +
      'the matrix degrades faster than it is replaced, and load transfers to bone, producing sclerosis and ' +
      'osteophytes. Varus alignment concentrates load medially, which is why the medial compartment fails first ' +
      'and why quadriceps strength and body weight change symptoms more than any drug.',
    temuan: [
      'Activity-related pain, brief morning stiffness under 30 minutes, crepitus, bony swelling',
      'Reduced range and varus deformity in advanced disease',
    ],
    penunjang: ['Clinical diagnosis in typical patients; radiographs when surgery or doubt arises — findings correlate poorly with pain'],
    tata: [
      'Exercise therapy and weight reduction first — the interventions with the strongest evidence',
      'Topical NSAIDs, then oral analgesia with gastric and renal caution; intra-articular steroid for flares',
      'Joint replacement for refractory pain and functional loss',
    ],
    organKey: 'skeleton',
    skdi: ['Artritis, osteoarthritis', 'Artritis, gout'],
  },
  {
    id: 'fraktur-osteoporosis',
    module: 'ortopedi',
    label: 'Osteoporotic hip fracture',
    ringkas: 'Bone thinned by age breaks in a fall from standing — and the year that follows is the real danger.',
    lesi: [
      { struktur: 'Left femur', jenis: 'occlusion', catatan: 'Femoral neck fracture; displacement threatens the blood supply of the head.' },
    ],
    hilir: ['Left hip bone', 'Left gluteus maximus'],
    mekanisme:
      'After the menopause, oestrogen withdrawal accelerates osteoclastic resorption and trabecular plates ' +
      'perforate — strength falls faster than density suggests. The femoral head is supplied retrogradely by the ' +
      'medial circumflex femoral artery running along the neck, so a displaced intracapsular fracture risks ' +
      'avascular necrosis: this anatomy, not the patient\'s age alone, decides fixation versus arthroplasty.',
    temuan: [
      'Fall from standing height, inability to weight bear, shortened externally rotated leg',
      'Excess mortality in the first year is substantial — this is a systemic disease presenting as a fracture',
    ],
    penunjang: ['Radiographs; MRI or CT if occult fracture is suspected', 'Assess bone health: DXA, vitamin D, calcium, and fracture-risk assessment'],
    tata: [
      'Early surgery with analgesia and delirium prevention; orthogeriatric care',
      'Start bone protection and falls assessment before discharge — the second fracture is the preventable one',
    ],
    organKey: 'skeleton',
    skdi: ['Osteoporosis', 'Fraktur terbuka, tertutup', 'Nekrosis kaput femoris'],
  },
  {
    id: 'hnp',
    module: 'ortopedi',
    label: 'Lumbar disc herniation',
    ringkas: 'The soft centre of a spinal disc bulges onto a nerve root; pain shoots down the leg.',
    lesi: [
      { struktur: 'Intervertebral disk of fourth lumbar vertebra', jenis: 'dilatation', catatan: 'Posterolateral herniation at L4–L5 compressing the traversing L5 root.' },
      { struktur: 'Intervertebral disk of fifth lumbar vertebra', jenis: 'dilatation', catatan: 'L5–S1 is the other common level.' },
    ],
    hilir: ['Fourth lumbar vertebra', 'Fifth lumbar vertebra', 'Sacrum', 'Left gluteus maximus'],
    mekanisme:
      'The posterior longitudinal ligament is strong centrally and thin laterally, so nucleus pulposus extrudes ' +
      'posterolaterally and strikes the traversing root — an L4–L5 disc therefore compresses L5, not L4. Pain is ' +
      'inflammatory as well as mechanical, which is why most resolve without surgery as the extrusion resorbs.',
    temuan: [
      'Radicular leg pain below the knee, worse on coughing; positive straight-leg raise',
      'Dermatomal sensory change, myotomal weakness, reduced reflex',
      'Cauda equina red flags: saddle anaesthesia, urinary retention, bilateral sciatica — emergency',
    ],
    penunjang: ['Clinical diagnosis; MRI when surgery is considered or red flags exist — not for uncomplicated back pain'],
    tata: [
      'Stay active, analgesia, physiotherapy; most improve within weeks',
      'Surgery for progressive neurological deficit, intractable pain, or cauda equina syndrome (immediate)',
    ],
    organKey: 'spinal-cord',
    skdi: ['Hernia nucleus pulposus (HNP)', 'Radicular syndrome', 'Sindrom kauda equine'],
  },
  {
    id: 'ruptur-achilles',
    module: 'ortopedi',
    label: 'Achilles tendon rupture',
    ringkas: 'A sudden snap at the back of the ankle, as if kicked — and push-off becomes impossible.',
    lesi: [
      { struktur: 'Left calcaneal tendon', jenis: 'occlusion', catatan: 'Rupture 2–6 cm above the insertion, in the hypovascular watershed.' },
    ],
    hilir: ['Left soleus', 'Left rectus femoris'],
    mekanisme:
      'The tendon\'s blood supply is poorest 2–6 cm proximal to the insertion, and that watershed is where ' +
      'degenerated collagen fails under sudden eccentric load. Fluoroquinolones and corticosteroids increase the ' +
      'risk by impairing tenocyte matrix turnover — a drug history that is easy to omit and directly relevant.',
    temuan: [
      'Audible snap, sudden pain, weak plantarflexion; palpable gap',
      'Positive Thompson (Simmonds) test: squeezing the calf produces no plantarflexion',
    ],
    penunjang: ['Clinical diagnosis; ultrasound or MRI when doubt remains or for surgical planning'],
    tata: [
      'Functional rehabilitation in equinus immobilisation, or surgical repair in selected patients',
      'Thromboprophylaxis consideration during immobilisation; structured return-to-sport programme',
    ],
    organKey: 'skeleton',
    skdi: ['Ruptur tendon Achilles', 'Tendinitis Achilles'],
  },

  // ══ UROGENITAL ════════════════════════════════════════════════════════════
  {
    id: 'bph',
    module: 'urogenital',
    label: 'Benign prostatic hyperplasia',
    ringkas: 'The prostate enlarges around the urethra; the stream weakens and the bladder never quite empties.',
    lesi: [
      { struktur: 'Prostate', jenis: 'hypertrophy', catatan: 'Nodular hyperplasia of the transition zone, compressing the prostatic urethra.' },
    ],
    hilir: ['Urethra', 'Urinary bladder', 'Left kidney', 'Right kidney'],
    mekanisme:
      'Hyperplasia arises in the transition zone that surrounds the urethra, which is why a modest volume can ' +
      'obstruct badly while a large peripheral cancer causes no symptoms at all. Chronic outflow resistance drives ' +
      'detrusor hypertrophy then decompensation, and sustained high pressure is transmitted upstream — the route ' +
      'from urinary symptoms to hydronephrosis and renal failure.',
    temuan: [
      'Hesitancy, weak stream, terminal dribbling, frequency, nocturia, incomplete emptying',
      'Smooth enlarged prostate on examination; a hard nodule suggests carcinoma instead',
      'Acute retention: painful distended bladder — an emergency for catheterisation',
    ],
    penunjang: ['IPSS symptom score, urinalysis, renal function, post-void residual', 'PSA after counselling; ultrasound if renal impairment or large residual'],
    tata: [
      'Alpha blocker for symptoms; 5-alpha reductase inhibitor for large glands (slow, but reduces retention risk)',
      'Surgery (TURP or equivalent) for refractory symptoms, retention, stones or renal impairment',
    ],
    organKey: 'prostate',
    skdi: ['Hiperplasia prostat jinak', 'Karsinoma prostat', 'Infeksi saluran kemih'],
  },
  {
    id: 'torsio-testis',
    module: 'urogenital',
    label: 'Testicular torsion',
    ringkas: 'The testis twists on its cord and loses its blood supply — surgery within hours or it dies.',
    lesi: [
      { struktur: 'Left testis', jenis: 'occlusion', catatan: 'Spermatic cord torsion strangling arterial inflow and venous outflow.' },
    ],
    hilir: ['Left epididymis', 'Left deferent duct'],
    mekanisme:
      'A high investment of the tunica vaginalis (the bell-clapper deformity) lets the testis rotate freely. ' +
      'Venous outflow occludes first, so the gland swells and arterial inflow then fails; salvage falls steeply ' +
      'after about six hours. The deformity is usually bilateral, which is why the contralateral testis is fixed ' +
      'at the same operation.',
    temuan: [
      'Sudden severe scrotal pain with nausea, often waking the patient; high-riding testis with a horizontal lie',
      'Absent cremasteric reflex; pain not relieved by elevation (unlike epididymitis)',
    ],
    penunjang: ['Doppler ultrasound only if it does not delay surgery — a convincing history mandates exploration'],
    tata: [
      'Immediate surgical exploration and detorsion — do not wait for imaging',
      'Bilateral orchidopexy, because the predisposing anatomy is bilateral; orchidectomy if non-viable',
    ],
    organKey: 'testis',
    skdi: ['Torsio testis', 'Epididimitis', 'Hidrokel'],
  },
  {
    id: 'isk',
    module: 'urogenital',
    label: 'Urinary tract infection',
    ringkas: 'Bacteria climb into the bladder — burning, urgency, and if it reaches the kidney, fever and loin pain.',
    lesi: [
      { struktur: 'Urinary bladder', jenis: 'occlusion', catatan: 'Mucosal inflammation of the bladder wall (cystitis).' },
    ],
    hilir: ['Left ureter', 'Left kidney'],
    mekanisme:
      'Most infections are ascending and uropathogenic E. coli dominates, using type 1 fimbriae to adhere to ' +
      'urothelium. Anything that obstructs flow or instruments the tract raises the risk, because the principal ' +
      'defence is simply washing organisms out. Vesicoureteric reflux or obstruction converts cystitis into ' +
      'pyelonephritis, and pyelonephritis behind an obstruction is a drainage problem, not an antibiotic problem.',
    temuan: [
      'Dysuria, frequency, urgency, suprapubic pain; cloudy offensive urine',
      'Fever, rigors, loin pain and vomiting indicate pyelonephritis',
      'In older patients, confusion may be the only clue — but asymptomatic bacteriuria should not be treated',
    ],
    penunjang: ['Urine dipstick and culture (culture in men, pregnancy, recurrence, or failure)', 'Imaging for recurrent infection, stones, or suspected obstruction'],
    tata: [
      'Short-course antibiotics by local sensitivities for uncomplicated cystitis; longer courses for men and pyelonephritis',
      'Admit for vomiting, sepsis or obstruction; drain an obstructed infected system urgently',
    ],
    organKey: 'bladder',
    skdi: ['Infeksi saluran kemih', 'Pielonefritis tanpa komplikasi', 'Prostatitis'],
  },

  // ══ OBSTETRI & GINEKOLOGI (panggul) ═══════════════════════════════════════
  {
    id: 'disproporsi',
    module: 'obstetri',
    label: 'Cephalopelvic disproportion',
    ringkas: 'The baby\'s head cannot pass the mother\'s pelvis — labour stalls no matter how strong the contractions.',
    lesi: [
      { struktur: 'Left hip bone', jenis: 'stenosis', derajat: 0.4, catatan: 'A contracted or android pelvis narrows the birth canal.' },
      { struktur: 'Sacrum', jenis: 'stenosis', derajat: 0.3, catatan: 'A flat or forward-angled sacrum reduces the pelvic outlet.' },
    ],
    hilir: ['Urinary bladder', 'Rectum'],
    mekanisme:
      'The fetal head must negotiate an inlet that is widest transversely and an outlet that is widest ' +
      'anteroposteriorly, which is why internal rotation is obligatory. A gynaecoid pelvis permits it; android and ' +
      'platypelloid shapes do not. Obstructed labour compresses the bladder base and anterior vaginal wall against ' +
      'the pubis, and prolonged compression causes the ischaemic necrosis that becomes a vesicovaginal fistula.',
    temuan: [
      'Poor progress in the active phase despite adequate contractions; caput and moulding',
      'Failure of descent, and a partogram crossing the action line',
    ],
    penunjang: ['Partogram; clinical pelvimetry has poor predictive value and radiological pelvimetry is not routine', 'Fetal monitoring for distress'],
    tata: [
      'Reassess presentation, position and contraction strength; caesarean section for true obstruction',
      'Prevent obstructed labour complications: never allow prolonged obstruction — the fistula is iatrogenic in effect',
    ],
    organKey: 'skeleton',
    skdi: ['Diproporsi kepala panggul', 'Distosia', 'Partus lama'],
  },
  {
    id: 'prolaps-panggul',
    module: 'obstetri',
    label: 'Pelvic organ prolapse',
    ringkas: 'The pelvic floor gives way after childbirth and age; the organs above it descend.',
    lesi: [
      { struktur: 'Left pubococcygeus', jenis: 'incompetence', catatan: 'Levator ani avulsion or denervation after vaginal delivery.' },
      { struktur: 'Right pubococcygeus', jenis: 'incompetence', catatan: 'Loss of the levator plate that normally supports the pelvic viscera.' },
    ],
    hilir: ['Urinary bladder', 'Rectum', 'Urethra'],
    mekanisme:
      'The levator ani forms a muscular plate whose tone keeps the urogenital hiatus closed; the endopelvic fascia ' +
      'suspends the organs above it. When the muscle fails, the fascia carries load it was never designed to bear ' +
      'and stretches, so prolapse is a two-stage failure — muscle first, connective tissue second. That is the ' +
      'reason pelvic floor training works best early and surgery is needed late.',
    temuan: [
      'Vaginal bulge or dragging sensation worse at the end of the day; urinary, bowel or sexual dysfunction',
      'POP-Q staging on examination with straining',
    ],
    penunjang: ['Clinical examination; post-void residual and urodynamics if incontinence coexists'],
    tata: [
      'Supervised pelvic floor muscle training; weight and constipation management',
      'Pessary as a durable non-surgical option; reconstructive surgery when symptoms justify it',
    ],
    organKey: 'bladder',
    skdi: ['Prolaps uterus, sistokel, rektokel', 'Inkontinensia urine', 'Rektokel'],
  },

  // ══ HEMATOLOGI, IMUNOLOGI & TROPIS ════════════════════════════════════════
  {
    id: 'leukemia',
    module: 'imunologi',
    label: 'Acute leukaemia',
    ringkas: 'The marrow fills with immature cells and stops making the ones the body needs.',
    lesi: [
      { struktur: 'Left femur', jenis: 'occlusion', catatan: 'Marrow replaced by blasts — the femur and pelvis are the major adult marrow sites.' },
      { struktur: 'Left hip bone', jenis: 'occlusion', catatan: 'The iliac crest is where the diagnostic biopsy is taken.' },
    ],
    hilir: ['Spleen', 'Left lobe of thymus'],
    mekanisme:
      'A transformed haematopoietic progenitor proliferates without maturing. The clinical picture follows ' +
      'directly from marrow failure — anaemia, infection from neutropenia, bleeding from thrombocytopenia — while ' +
      'tissue infiltration adds hepatosplenomegaly, gum hypertrophy and central nervous system disease. ' +
      'Hyperleukocytosis and tumour lysis are the emergencies that arrive with treatment.',
    temuan: [
      'Fatigue and pallor, fever and infection, bruising and bleeding — over weeks, not months',
      'Bone pain in children, lymphadenopathy, hepatosplenomegaly',
    ],
    penunjang: ['Full blood count and film (blasts), then bone marrow aspirate with immunophenotyping and cytogenetics', 'Coagulation screen — acute promyelocytic leukaemia presents with DIC and is a medical emergency'],
    tata: [
      'Urgent haematology referral; risk-adapted chemotherapy, supportive transfusion and infection control',
      'Tumour lysis prophylaxis with hydration and rasburicase or allopurinol',
    ],
    organKey: 'lymph-nodes',
    skdi: ['Leukemia akut, kronik', 'Anemia aplastik', 'Limfadenopati'],
  },
  {
    id: 'sle',
    module: 'imunologi',
    label: 'Systemic lupus erythematosus',
    ringkas: 'The immune system attacks the body\'s own tissues — skin, joints, kidneys, blood, in any combination.',
    lesi: [
      { struktur: 'Spleen', jenis: 'hypertrophy', catatan: 'Immune-complex handling and cytopenias; splenomegaly is common.' },
    ],
    hilir: ['Left femur', 'Left hip bone'],
    mekanisme:
      'Impaired clearance of apoptotic material exposes nuclear antigens, breaking tolerance; immune complexes ' +
      'deposit where filtration pressure is highest — hence the glomerulus. Complement is consumed as it is ' +
      'activated, so falling C3 and C4 with rising anti-dsDNA marks activity, and this is why lupus nephritis is ' +
      'sought actively by urinalysis rather than waiting for symptoms.',
    temuan: [
      'Malar rash, photosensitivity, oral ulcers, non-erosive arthritis, serositis',
      'Renal, haematological and neuropsychiatric involvement determine prognosis',
      'Antiphospholipid antibodies add thrombosis and pregnancy loss',
    ],
    penunjang: ['ANA as the screening test, then anti-dsDNA and anti-Sm; C3, C4, urinalysis with protein–creatinine ratio', 'Renal biopsy for proteinuria or active sediment — histological class decides therapy'],
    tata: [
      'Hydroxychloroquine for nearly all patients; corticosteroids at the lowest effective dose',
      'Immunosuppression by organ involvement; sun protection, vaccination, cardiovascular and bone risk management',
    ],
    organKey: 'spleen',
    skdi: ['Lupus eritematosus sistemik', 'Artritis reumatoid', 'Anemia hemolitik'],
  },
  {
    id: 'malaria',
    module: 'imunologi',
    label: 'Malaria',
    ringkas: 'A parasite bursts out of red cells in cycles — fever, chills, anaemia and an enlarged spleen.',
    lesi: [
      { struktur: 'Spleen', jenis: 'hypertrophy', catatan: 'Splenomegaly from clearing parasitised erythrocytes.' },
    ],
    hilir: ['Left femur', 'Right femur'],
    mekanisme:
      'Merozoites released synchronously from red cells drive the periodic fever. Plasmodium falciparum expresses ' +
      'PfEMP1, which binds endothelium so infected cells sequester in capillaries — this cytoadherence, not ' +
      'parasite numbers in the blood alone, produces cerebral malaria, acidosis and organ failure, and it is why ' +
      'falciparum is the species that kills.',
    temuan: [
      'Fever with chills and sweats in a traveller or resident of an endemic area; headache and myalgia',
      'Anaemia, jaundice, splenomegaly; impaired consciousness, seizures, acidosis or shock in severe disease',
    ],
    penunjang: ['Thick and thin blood films with species identification and parasite count; rapid diagnostic tests', 'Repeat films if negative and suspicion is high — a single negative does not exclude it'],
    tata: [
      'Artemisinin-based combination therapy for uncomplicated malaria by national guideline',
      'Severe malaria: parenteral artesunate, supportive care, glucose monitoring',
      'Radical cure for P. vivax and P. ovale hypnozoites after G6PD testing',
    ],
    organKey: 'spleen',
    skdi: ['Malaria', 'Malaria serebral', 'Anemia hemolitik'],
  },
  {
    id: 'dengue',
    module: 'imunologi',
    label: 'Dengue and dengue shock syndrome',
    ringkas: 'A viral fever whose danger comes as the fever falls and plasma leaks out of the vessels.',
    lesi: [
      { struktur: 'Spleen', jenis: 'hypertrophy', catatan: 'Reticuloendothelial activation with thrombocytopenia.' },
    ],
    hilir: ['Left lobe of thymus', 'Right lobe of thymus'],
    mekanisme:
      'Endothelial glycocalyx disruption causes plasma leakage rather than true bleeding, so haematocrit rises ' +
      'while platelets fall — an apparently paradoxical pair that is the diagnostic signature. The critical phase ' +
      'begins as the temperature settles, which is exactly when patients feel better and are most likely to be ' +
      'sent home. Fluid replacement, titrated and time-limited, is the treatment; platelets are not.',
    temuan: [
      'High fever, severe headache, retro-orbital pain, myalgia, rash',
      'Warning signs: abdominal pain, persistent vomiting, mucosal bleeding, lethargy, hepatomegaly, rising haematocrit with falling platelets',
    ],
    penunjang: ['Full blood count serially (haematocrit and platelets), NS1 antigen, IgM/IgG serology', 'Ultrasound for plasma leakage — pleural effusion, ascites, gallbladder wall oedema'],
    tata: [
      'Careful crystalloid fluid therapy guided by haematocrit and perfusion; avoid NSAIDs',
      'Recognise the critical phase and admit patients with warning signs; blood products only for significant bleeding',
    ],
    organKey: 'spleen',
    skdi: ['Demam dengue, DHF', 'Dengue shock syndrome', 'Sepsis'],
  },

  // ══ DERMATOLOGI ═══════════════════════════════════════════════════════════
  {
    id: 'psoriasis',
    module: 'kulit',
    label: 'Psoriasis vulgaris',
    ringkas: 'Skin cells are made far too fast, piling up as thick silvery plaques.',
    lesi: [{ struktur: 'Skin', jenis: 'hypertrophy', catatan: 'Epidermal hyperproliferation with parakeratosis on extensor surfaces and scalp.' }],
    hilir: ['Hair of head'],
    mekanisme:
      'An IL-23/Th17 axis drives keratinocyte proliferation, shortening epidermal transit from about 28 days to ' +
      'four; the stratum corneum is therefore retained and nucleated. Dilated dermal capillaries close to a thin ' +
      'suprapapillary plate explain the pinpoint bleeding when scale is lifted, and the same systemic inflammation ' +
      'accounts for the associated arthritis and cardiometabolic risk.',
    temuan: [
      'Well-demarcated erythematous plaques with silvery scale on extensors, scalp, umbilicus, natal cleft',
      'Nail pitting and onycholysis; Auspitz sign; Koebner phenomenon',
      'Ask about joint pain — psoriatic arthritis is often missed and is erosive',
    ],
    penunjang: ['Clinical diagnosis; biopsy rarely needed', 'Screen for arthritis, metabolic syndrome and depression'],
    tata: [
      'Topical vitamin D analogue with corticosteroid; emollients throughout',
      'Phototherapy, then systemic or biologic therapy by severity and joint involvement',
      'Avoid systemic corticosteroids — withdrawal can precipitate pustular flare',
    ],
    organKey: 'skin',
    skdi: ['Psoriasis vulgaris', 'Dermatitis seboroik'],
  },
  {
    id: 'dermatitis-atopik',
    module: 'kulit',
    label: 'Atopic dermatitis',
    ringkas: 'A leaky skin barrier that itches; scratching damages it further and the cycle feeds itself.',
    lesi: [{ struktur: 'Skin', jenis: 'incompetence', catatan: 'Filaggrin-deficient barrier with transepidermal water loss and Th2 inflammation.' }],
    hilir: ['Eyebrow', 'Hair of head'],
    mekanisme:
      'Barrier failure comes first: filaggrin loss raises transepidermal water loss and lets allergens and ' +
      'Staphylococcus aureus in, which drives Th2 inflammation, which further degrades the barrier. Treating only ' +
      'the inflammation while ignoring the barrier — or the reverse — is why so much treatment fails, and it is ' +
      'why emollient is therapy rather than comfort.',
    temuan: [
      'Itch is obligatory; flexural eczema in children, facial and extensor in infants',
      'Xerosis, lichenification, excoriation; weeping and crusting when secondarily infected',
      'Personal or family history of asthma, allergic rhinitis or food allergy',
    ],
    penunjang: ['Clinical diagnosis; swab for infection when weeping; allergy testing only when history suggests a trigger'],
    tata: [
      'Generous emollients as maintenance; topical corticosteroid of appropriate potency for flares — undertreatment prolongs disease',
      'Calcineurin inhibitors for delicate sites; treat infection; systemic or biologic therapy for severe disease',
    ],
    organKey: 'skin',
    skdi: ['Dermatitis atopik (kecuali recalcitrant)', 'Dermatitis numularis'],
  },
  {
    id: 'melanoma',
    module: 'kulit',
    label: 'Melanoma',
    ringkas: 'A changing mole that grows down as well as out — depth decides the prognosis.',
    lesi: [{ struktur: 'Skin', jenis: 'occlusion', catatan: 'Malignant melanocytic proliferation invading the dermis.' }],
    hilir: ['Hair of head'],
    mekanisme:
      'Ultraviolet-induced DNA damage and driver mutations such as BRAF V600E transform melanocytes. Radial growth ' +
      'is horizontal and curable; vertical growth gives access to dermal lymphatics and blood vessels, which is ' +
      'why Breslow thickness in millimetres — not diameter on the surface — is the dominant prognostic variable ' +
      'and why excision must be complete rather than partial.',
    temuan: [
      'ABCDE: asymmetry, border irregularity, colour variation, diameter, evolution',
      'The ugly duckling sign — the lesion that looks unlike the patient\'s others',
      'Nodular and amelanotic melanomas break the rules and present late',
    ],
    penunjang: ['Dermoscopy, then excisional biopsy with a narrow margin — never shave or punch a suspected melanoma', 'Staging by Breslow thickness, ulceration and sentinel node where indicated'],
    tata: [
      'Wide local excision with margins by thickness; sentinel lymph node biopsy in selected patients',
      'Targeted or immune therapy for advanced disease; lifelong skin surveillance and sun protection',
    ],
    organKey: 'skin',
    skdi: ['Melanoma maligna', 'Nevus pigmentosus', 'Basal cell carcinoma (Karsinoma sel basal)'],
  },
  {
    id: 'lepra',
    module: 'kulit',
    label: 'Leprosy',
    ringkas: 'A slow infection of skin and nerves: pale patches that have lost their feeling.',
    lesi: [{ struktur: 'Skin', jenis: 'occlusion', catatan: 'Hypopigmented anaesthetic patches with thickened cutaneous nerves.' }],
    hilir: ['Eyebrow'],
    mekanisme:
      'Mycobacterium leprae grows best at cooler temperatures, so it settles in skin, superficial nerves, the ' +
      'nasal mucosa and testes; the eyebrow loss and cool-site distribution follow directly from that. The clinical ' +
      'spectrum is decided by cell-mediated immunity — few lesions and strong response at the tuberculoid pole, ' +
      'many lesions and weak response at the lepromatous. Disability comes from nerve damage, and much of it is ' +
      'preventable if reactions are recognised early.',
    temuan: [
      'Hypopigmented or erythematous patches with definite sensory loss',
      'Thickened peripheral nerves; claw hand, foot drop, lagophthalmos, plantar ulcers',
      'Reactions (type 1 and erythema nodosum leprosum) are the emergencies of leprosy',
    ],
    penunjang: ['Slit-skin smear and histopathology; nerve function assessment at every visit'],
    tata: [
      'Multidrug therapy by WHO classification, given free through national programmes',
      'Corticosteroids for reactions and neuritis; protective footwear, wound care and rehabilitation',
      'Contact tracing — stigma kills more social life than the organism kills tissue',
    ],
    organKey: 'skin',
    skdi: ['Lepra', 'Reaksi lepra', 'Neuropati'],
  },
  // ══ GELOMBANG KEDUA ═══════════════════════════════════════════════════════
  // Ditambahkan setelah kerangkanya terbukti: tiap modul diisi sampai ia benar
  // benar bisa dipakai belajar, bukan sekadar berisi satu contoh.

  {
    id: 'bronkiektasis',
    module: 'respirasi',
    label: 'Bronchiectasis',
    ringkas: 'Airways permanently widened and scarred, holding sputum that never fully clears.',
    lesi: [
      { struktur: 'Left lateral basal segmental bronchial tree', jenis: 'dilatation', catatan: 'Irreversibly dilated, thick-walled airways, worst in the lower lobes where gravity holds secretions.' },
      { struktur: 'Right lateral basal segmental bronchial tree', jenis: 'dilatation', catatan: 'Bilateral basal predominance in post-infective disease.' },
    ],
    hilir: ['Left main bronchus', 'Right main bronchus proper', 'Diaphragm'],
    mekanisme:
      'Cole\'s vicious cycle: an initial insult impairs mucociliary clearance, retained secretions become chronically ' +
      'infected, neutrophil elastase destroys the airway wall, and the wider, floppier airway clears even less. Each ' +
      'turn of the cycle is irreversible, which is why treatment aims at clearance and infection control rather than cure.',
    temuan: [
      'Daily productive cough with large volumes of purulent sputum, worse in the morning',
      'Coarse crackles, clubbing, recurrent exacerbations, haemoptysis',
    ],
    penunjang: ['High-resolution CT is the diagnostic standard — signet-ring sign and lack of tapering', 'Sputum culture including mycobacteria; immunoglobulins and CF testing for cause'],
    tata: [
      'Airway clearance physiotherapy daily — the intervention that changes the cycle',
      'Treat exacerbations by culture; long-term macrolide or inhaled antibiotic in frequent exacerbators',
    ],
    organKey: 'lungs',
    skdi: ['Bronkiektasis', 'Abses paru'],
  },
  {
    id: 'bronkiolitis',
    module: 'respirasi',
    label: 'Acute bronchiolitis (infant)',
    ringkas: 'A viral infection swells the smallest airways of a baby, and feeding becomes harder than breathing.',
    lesi: [
      { struktur: 'Right anterior basal segmental bronchial tree', jenis: 'stenosis', derajat: 0.6, catatan: 'Oedema, sloughed epithelium and mucus plugging of small airways.' },
      { struktur: 'Left anterior basal segmental bronchial tree', jenis: 'stenosis', derajat: 0.6, catatan: 'Involvement is diffuse and bilateral.' },
    ],
    hilir: ['Diaphragm', 'Left main bronchus'],
    mekanisme:
      'Airway resistance rises with the fourth power of the radius, so a millimetre of oedema in an infant bronchiole ' +
      'that is itself only a millimetre wide multiplies resistance enormously. Air trapping flattens the diaphragm, ' +
      'the compliant infant chest wall recesses instead of expanding, and the work of breathing competes directly with feeding.',
    temuan: [
      'Coryza then wheeze, tachypnoea, subcostal recession and nasal flaring in a child under two',
      'Poor feeding and apnoea are the admission criteria that matter, not the wheeze itself',
    ],
    penunjang: ['Clinical diagnosis; oxygen saturation and feeding assessment', 'Chest radiograph only if the course is atypical — routine films drive unnecessary antibiotics'],
    tata: [
      'Supportive care: oxygen for hypoxaemia, small frequent or tube feeds, minimal handling',
      'Bronchodilators, steroids and antibiotics do not help typical bronchiolitis',
    ],
    organKey: 'lungs',
    skdi: ['Bronkiolitis akut', 'Asma bronkial'],
  },
  {
    id: 'epiglotitis',
    module: 'respirasi',
    label: 'Acute epiglottitis',
    ringkas: 'The lid over the airway swells within hours — the child sits still, drooling, and must not be upset.',
    lesi: [
      { struktur: 'Epiglottis', jenis: 'hypertrophy', catatan: 'Cherry-red oedematous epiglottis obstructing the supraglottis.' },
    ],
    hilir: ['Left vocal ligament', 'Cricoid cartilage', 'Left main bronchus'],
    mekanisme:
      'Supraglottic tissues are loose and swell rapidly; because flow through a narrowing is turbulent, a small further ' +
      'reduction in calibre causes a disproportionate rise in the work of breathing. Distress increases turbulence ' +
      'further, which is the reason for the rule that the child is not examined, cannulated or laid flat until the ' +
      'airway is secured by someone able to secure it.',
    temuan: [
      'Rapid onset fever, drooling, muffled voice, tripod posture and stridor',
      'Cough is characteristically absent, unlike croup',
    ],
    penunjang: ['Do not examine the throat outside theatre; lateral neck radiograph only if the child is stable and accompanied'],
    tata: [
      'Secure the airway first, in theatre, with senior anaesthetic and ENT presence',
      'Then intravenous antibiotics; check immunisation status and offer prophylaxis to contacts',
    ],
    organKey: 'larynx',
    skdi: ['Pseudo-croop acute epiglotitis', 'Benda asing'],
  },
  {
    id: 'ards',
    module: 'respirasi',
    label: 'Acute respiratory distress syndrome',
    ringkas: 'The lungs flood from inflammation, not from a failing heart, and stiffen until every breath is work.',
    lesi: [
      { struktur: 'Right posterior basal segmental bronchial tree', jenis: 'occlusion', catatan: 'Dependent alveolar flooding and collapse — gravity decides the distribution.' },
      { struktur: 'Left posterior basal segmental bronchial tree', jenis: 'occlusion', catatan: 'The dependent lung is consolidated while the anterior lung stays aerated.' },
    ],
    hilir: ['Diaphragm', 'Right main bronchus proper'],
    mekanisme:
      'Diffuse alveolar damage makes the capillary–alveolar barrier leak protein-rich fluid, so compliance collapses ' +
      'and shunt dominates. Only a fraction of the lung remains aerated — the "baby lung" — which is why a normal tidal ' +
      'volume delivered to it is injurious, and why low tidal volume ventilation, not higher oxygen, is what improves survival.',
    temuan: [
      'Refractory hypoxaemia within a week of an insult, bilateral opacities, not explained by cardiac failure',
      'Berlin criteria grade severity by PaO2/FiO2',
    ],
    penunjang: ['Arterial blood gas with PaO2/FiO2 ratio; chest imaging; echocardiography to exclude cardiogenic oedema'],
    tata: [
      'Lung-protective ventilation: 6 mL/kg predicted body weight, plateau pressure limited',
      'Prone positioning for severe cases, conservative fluids, and treatment of the underlying cause',
    ],
    organKey: 'lungs',
    skdi: ['Acute Respiratory distress syndrome (ARDS)', 'Edema paru', 'Sepsis'],
  },
  {
    id: 'gerd',
    module: 'gastro',
    label: 'Gastro-oesophageal reflux disease',
    ringkas: 'Acid escapes upward past a weak valve and burns the gullet.',
    lesi: [
      { struktur: 'Esophagus', jenis: 'incompetence', catatan: 'Transient lower oesophageal sphincter relaxations with mucosal injury at the squamocolumnar junction.' },
    ],
    hilir: ['Stomach'],
    mekanisme:
      'The barrier is not one sphincter but several: intrinsic smooth muscle, the crural diaphragm, and the acute angle ' +
      'of His. A hiatus hernia dismantles two of the three at once. Repeated acid and bile exposure drives metaplasia to ' +
      'intestinal-type epithelium — Barrett oesophagus — which is why long-standing reflux carries a cancer risk that heartburn severity does not predict.',
    temuan: [
      'Retrosternal burning after meals and lying flat, acid regurgitation, nocturnal cough',
      'Alarm features — dysphagia, weight loss, anaemia, vomiting — demand endoscopy before treatment',
    ],
    penunjang: ['Trial of proton pump inhibitor in typical uncomplicated cases; endoscopy for alarm features or failure', 'pH-impedance study when the diagnosis is genuinely in doubt'],
    tata: [
      'Weight loss, smaller evening meals, head-of-bed elevation — modest but real',
      'Proton pump inhibitor at the lowest effective dose; fundoplication for selected refractory disease',
    ],
    organKey: 'stomach',
    skdi: ['Refluks gastroesofagus', 'Esofagitis refluks', 'Gastritis'],
  },
  {
    id: 'ca-kolon',
    module: 'gastro',
    label: 'Colorectal carcinoma',
    ringkas: 'A polyp turns malignant over years — which is exactly why screening works.',
    lesi: [
      { struktur: 'Descending colon', jenis: 'stenosis', derajat: 0.7, catatan: 'Annular constricting tumour of the left colon.' },
      { struktur: 'Rectum', jenis: 'occlusion', catatan: 'Rectal tumours present earlier with bleeding and tenesmus.' },
    ],
    hilir: ['Transverse colon', 'Ascending colon'],
    mekanisme:
      'The adenoma–carcinoma sequence runs through APC, KRAS and TP53 over roughly a decade, which is the window ' +
      'screening exploits. Side determines presentation: the right colon is wide with liquid content, so tumours bleed ' +
      'occultly and present as iron deficiency anaemia; the left colon is narrow with formed stool, so tumours obstruct and alter bowel habit.',
    temuan: [
      'Change in bowel habit, rectal bleeding, tenesmus, weight loss',
      'Iron deficiency anaemia in a man or postmenopausal woman is colorectal cancer until proven otherwise',
    ],
    penunjang: ['Colonoscopy with biopsy; CT chest-abdomen-pelvis and pelvic MRI for rectal staging', 'CEA as a baseline for follow-up, never for diagnosis'],
    tata: [
      'Surgical resection with lymphadenectomy; neoadjuvant chemoradiotherapy for locally advanced rectal cancer',
      'Adjuvant chemotherapy by stage; screening and surveillance of first-degree relatives',
    ],
    organKey: 'large-intestine',
    skdi: ['Karsinoma kolon', 'Polip/adenoma', 'Perdarahan gastrointestinal'],
  },
  {
    id: 'crohn',
    module: 'gastro',
    label: 'Crohn disease',
    ringkas: 'Patchy full-thickness inflammation anywhere from mouth to anus, most often at the end of the small bowel.',
    lesi: [
      { struktur: 'Distal part of ileum', jenis: 'stenosis', derajat: 0.6, catatan: 'Transmural inflammation with skip lesions; the terminal ileum is the classic site.' },
    ],
    hilir: ['Ascending colon', 'Appendix'],
    mekanisme:
      'Transmural inflammation is what separates Crohn disease from ulcerative colitis and explains its complications: ' +
      'fistulae and abscesses because inflammation crosses the wall, and strictures because repeated healing lays down ' +
      'fibrosis. Terminal ileal disease also removes the only site of bile-salt and B12 absorption, giving diarrhoea and macrocytic anaemia.',
    temuan: [
      'Chronic diarrhoea, right iliac fossa pain, weight loss, perianal disease',
      'Mouth ulcers, erythema nodosum, uveitis and arthritis as extraintestinal features',
    ],
    penunjang: ['Faecal calprotectin, colonoscopy with ileal intubation and biopsy', 'MR enterography for small-bowel extent, strictures and fistulae'],
    tata: [
      'Induce remission with corticosteroid or exclusive enteral nutrition, then maintain with immunomodulator or biologic',
      'Smoking cessation — smoking worsens Crohn disease specifically; surgery for strictures and fistulae',
    ],
    organKey: 'small-intestine',
    skdi: ['Penyakit Crohn', 'Kolitis ulseratif', 'Malabsorbsi'],
  },
  {
    id: 'tifoid',
    module: 'gastro',
    label: 'Typhoid fever',
    ringkas: 'A stepwise fever from a Salmonella that invades through the gut lymphoid tissue.',
    lesi: [
      { struktur: 'Distal part of ileum', jenis: 'occlusion', catatan: 'Peyer patch hyperplasia, then necrosis and ulceration — the site of the classic perforation.' },
      { struktur: 'Spleen', jenis: 'hypertrophy', catatan: 'Reticuloendothelial proliferation with splenomegaly.' },
    ],
    hilir: ['Ascending colon', 'Pancreas'],
    mekanisme:
      'Salmonella Typhi crosses M cells over Peyer patches, survives inside macrophages and disseminates through the ' +
      'reticuloendothelial system before returning to the gut in bile. That itinerary explains the timing: bacteraemia ' +
      'and fever in week one, and ulceration with haemorrhage or perforation in week three, when the patient often seems to be improving.',
    temuan: [
      'Stepladder fever, relative bradycardia, abdominal pain, constipation more often than diarrhoea',
      'Rose spots, hepatosplenomegaly; sudden pain and peritonism suggest perforation',
    ],
    penunjang: ['Blood culture is the standard; bone marrow culture has the highest yield', 'Widal has poor specificity in endemic areas — do not treat on it alone'],
    tata: [
      'Antibiotics by local resistance patterns; watch for perforation and haemorrhage into week three',
      'Sanitation, safe water and vaccination for prevention; treat chronic carriers',
    ],
    organKey: 'small-intestine',
    skdi: ['Demam tifoid', 'Perforasi usus', 'Peritonitis'],
  },
  {
    id: 'intususepsi',
    module: 'gastro',
    label: 'Intussusception (infant)',
    ringkas: 'One piece of bowel telescopes into the next; the baby draws up the legs in waves and passes redcurrant stool.',
    lesi: [
      { struktur: 'Distal part of ileum', jenis: 'occlusion', catatan: 'Ileocolic intussusception — the ileum invaginates into the colon.' },
      { struktur: 'Ascending colon', jenis: 'occlusion', catatan: 'The receiving segment; its wall compresses the mesentery dragged in with the bowel.' },
    ],
    hilir: ['Transverse colon', 'Appendix'],
    mekanisme:
      'The invaginated segment drags its mesentery with it, so venous drainage obstructs first: the wall becomes ' +
      'oedematous and bleeds into the lumen, producing the redcurrant jelly stool, and only later does arterial supply ' +
      'fail and the bowel infarct. That sequence is why early reduction succeeds and late presentation needs resection.',
    temuan: [
      'Episodic inconsolable crying with drawing up of the legs, vomiting, a sausage-shaped mass',
      'Redcurrant jelly stool is a late sign — waiting for it is waiting too long',
    ],
    penunjang: ['Ultrasound showing the target sign is diagnostic and is the first-line test'],
    tata: [
      'Resuscitate, then air or hydrostatic enema reduction under supervision',
      'Surgery for failed reduction, peritonitis or perforation; look for a pathological lead point in older children',
    ],
    organKey: 'small-intestine',
    skdi: ['Intususepsi atau invaginasi', 'Ileus'],
  },
  {
    id: 'stenosis-pilorik',
    module: 'gastro',
    label: 'Infantile hypertrophic pyloric stenosis',
    ringkas: 'The stomach outlet muscle thickens in the first weeks of life; milk comes back forcefully and the baby is still hungry.',
    lesi: [
      { struktur: 'Stomach', jenis: 'hypertrophy', catatan: 'Hypertrophy of the pyloric muscle producing gastric outlet obstruction.' },
    ],
    hilir: ['Duodenum', 'Proximal part of jejunum'],
    mekanisme:
      'Obstruction is above the duodenum, so what is lost is gastric juice alone: hydrogen and chloride. The result is ' +
      'the hypochloraemic, hypokalaemic metabolic alkalosis that is nearly unique to this condition, with paradoxical ' +
      'aciduria as the kidney trades hydrogen to retain potassium. Correcting that biochemistry, not the muscle, is the emergency.',
    temuan: [
      'Projectile non-bilious vomiting at 3–6 weeks, immediately hungry again, weight loss and dehydration',
      'Visible gastric peristalsis and a palpable olive-shaped mass after a test feed',
    ],
    penunjang: ['Ultrasound of the pylorus (thickness and length); blood gas and electrolytes'],
    tata: [
      'Correct the alkalosis and dehydration first — anaesthesia before correction is dangerous',
      'Then Ramstedt pyloromyotomy; feeding resumes within hours',
    ],
    organKey: 'stomach',
    skdi: ['Stenosis pilorik', 'Ileus'],
  },
  {
    id: 'pielonefritis',
    module: 'nefrologi',
    label: 'Acute pyelonephritis',
    ringkas: 'Infection has climbed from the bladder into the kidney: fever, loin pain and rigors.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'occlusion', catatan: 'Neutrophilic infiltration of tubules and interstitium, often wedge-shaped.' },
    ],
    hilir: ['Left renal vein', 'Left ureter'],
    mekanisme:
      'Ascending infection reaches the renal pelvis through vesicoureteric reflux or obstruction. The medulla is ' +
      'unusually vulnerable — high osmolality and ammonia impair complement and neutrophil function there — which is why ' +
      'infection establishes in the interstitium and why scarring, not the acute illness, is the long-term threat in children.',
    temuan: [
      'Fever with rigors, loin pain, costovertebral angle tenderness, vomiting',
      'Lower urinary symptoms may be absent; sepsis can be the presentation in older patients',
    ],
    penunjang: ['Urine culture before antibiotics, blood cultures if unwell', 'Imaging for obstruction if not improving in 48–72 hours, or in men and children'],
    tata: [
      'Empirical antibiotics adjusted to culture, intravenous if vomiting or septic',
      'Drain an obstructed infected kidney urgently — antibiotics cannot sterilise a closed system',
    ],
    organKey: 'kidneys',
    skdi: ['Pielonefritis tanpa komplikasi', 'Infeksi saluran kemih', 'Sepsis'],
  },
  {
    id: 'gna',
    module: 'nefrologi',
    label: 'Acute glomerulonephritis',
    ringkas: 'Weeks after a throat or skin infection the urine turns cola-coloured and the face puffs up.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'occlusion', catatan: 'Subepithelial immune-complex deposits with endocapillary proliferation.' },
      { struktur: 'Right kidney', jenis: 'occlusion', catatan: 'Bilateral, as with every immune-mediated glomerular disease.' },
    ],
    hilir: ['Urinary bladder', 'Left renal vein'],
    mekanisme:
      'Immune complexes deposit in the glomerulus and activate complement, so C3 falls while the glomerulus becomes ' +
      'inflamed and leaky to red cells. Filtration falls, salt and water are retained, and the hypertension is therefore ' +
      'volume-dependent — which is why a diuretic works better than a vasodilator here, and why encephalopathy and pulmonary oedema are the acute dangers.',
    temuan: [
      'Cola-coloured urine, periorbital oedema, hypertension and oliguria 1–3 weeks after streptococcal infection',
      'Red cell casts and dysmorphic red cells define the nephritic sediment',
    ],
    penunjang: ['Urinalysis with microscopy, creatinine, C3 and C4, ASO titre or anti-DNase B', 'Biopsy if atypical, rapidly progressive, or C3 stays low beyond 8 weeks'],
    tata: [
      'Salt and fluid restriction with loop diuretic for the volume-dependent hypertension',
      'Treat residual infection; most childhood cases recover fully, so avoid unnecessary immunosuppression',
    ],
    organKey: 'kidneys',
    skdi: ['Glomerulonefritis akut', 'Sindrom nefrotik'],
  },
  {
    id: 'ginjal-polikistik',
    module: 'nefrologi',
    label: 'Polycystic kidney disease (congenital)',
    ringkas: 'Inherited cysts multiply until the kidneys are huge and their working tissue is squeezed out.',
    lesi: [
      { struktur: 'Left kidney', jenis: 'dilatation', catatan: 'Innumerable cysts arising from tubular segments, enlarging over decades.' },
      { struktur: 'Right kidney', jenis: 'dilatation', catatan: 'Always bilateral — unilateral cystic disease is something else.' },
    ],
    hilir: ['Left ureter', 'Left renal vein', 'Urinary bladder'],
    mekanisme:
      'PKD1 or PKD2 mutations disturb the primary cilium\'s mechanosensing, so tubular cells proliferate and secrete ' +
      'instead of remaining quiescent. Because cysts detach from the tubule, they grow independently of filtration — ' +
      'which is why kidney volume rises for years while creatinine stays normal, and why total kidney volume predicts decline better than eGFR.',
    temuan: [
      'Flank pain, haematuria, hypertension in early adulthood, palpable kidneys',
      'Family history in most; look for hepatic cysts and intracranial aneurysms',
    ],
    penunjang: ['Ultrasound with age-adjusted cyst criteria; MRI for total kidney volume', 'Genetic testing where the diagnosis changes family planning'],
    tata: [
      'Rigorous blood pressure control with renin–angiotensin blockade; high fluid intake',
      'Tolvaptan in rapidly progressive disease; screen relatives and consider aneurysm screening where indicated',
    ],
    organKey: 'kidneys',
    skdi: ['Ginjal polikistik simtomatik', 'Penyakit ginjal kronik'],
  },
  {
    id: 'akromegali',
    module: 'endokrin',
    label: 'Acromegaly',
    ringkas: 'A pituitary tumour keeps making growth hormone; hands, jaw and features enlarge over years.',
    lesi: [
      { struktur: 'Pituitary gland', jenis: 'hypertrophy', catatan: 'Somatotroph macroadenoma; upward growth compresses the optic chiasm.' },
    ],
    hilir: ['Hypothalamus', 'Left kidney', 'Caudate lobe of liver'],
    mekanisme:
      'Autonomous growth hormone drives hepatic IGF-1, which produces the soft-tissue and skeletal changes. Because they ' +
      'accrue over a decade, patients and their families do not notice — old photographs make the diagnosis more often ' +
      'than the examination. Mortality is cardiovascular, from hypertension, cardiomyopathy and diabetes, not from the tumour itself.',
    temuan: [
      'Enlarging hands, feet and jaw; ring and shoe size changes; coarse features and macroglossia',
      'Bitemporal hemianopia from chiasmal compression; carpal tunnel syndrome, sweating, arthropathy',
    ],
    penunjang: ['IGF-1 first (random GH is useless), then oral glucose tolerance test with GH suppression', 'Pituitary MRI and formal visual fields once biochemistry confirms'],
    tata: [
      'Transsphenoidal surgery is first line; somatostatin analogues or GH receptor antagonist when residual',
      'Treat the comorbidities — cardiovascular disease, diabetes, sleep apnoea — from the start',
    ],
    organKey: 'pituitary',
    skdi: ['Akromegali, gigantisme', 'Diabetes melitus tipe lain (intoleransi glukosa akibat penyakit lain atau obat-obatan)'],
  },
  {
    id: 'diabetes-insipidus',
    module: 'endokrin',
    label: 'Diabetes insipidus',
    ringkas: 'The body cannot concentrate urine: litres of dilute urine, and thirst that never settles.',
    lesi: [
      { struktur: 'Pituitary gland', jenis: 'incompetence', catatan: 'Failure of vasopressin release from the posterior pituitary (central form).' },
      { struktur: 'Left kidney', jenis: 'incompetence', catatan: 'Collecting duct unresponsive to vasopressin (nephrogenic form).' },
    ],
    hilir: ['Hypothalamus', 'Right kidney'],
    mekanisme:
      'Vasopressin inserts aquaporin-2 into the collecting duct. Without the hormone, or without the response to it, ' +
      'free water is lost and plasma osmolality rises. An intact thirst mechanism keeps the patient eunatraemic but ' +
      'exhausted; the danger appears the moment thirst or access to water is removed — after surgery, or in the unconscious patient.',
    temuan: [
      'Polyuria over 3 L a day with dilute urine, nocturia, unrelenting thirst',
      'Hypernatraemia only when water intake is restricted — which makes the postoperative period the risky one',
    ],
    penunjang: ['Paired serum and urine osmolality; water deprivation test with desmopressin to separate central from nephrogenic', 'Pituitary MRI for central disease; review lithium and hypercalcaemia for nephrogenic'],
    tata: [
      'Desmopressin for central disease; free access to water always',
      'Nephrogenic: remove the cause, thiazide with salt restriction, NSAID in selected cases',
    ],
    organKey: 'pituitary',
    skdi: ['Diabetes insipidus', 'Hipoglikemia berat'],
  },
  {
    id: 'nafld',
    module: 'endokrin',
    label: 'Metabolic-associated fatty liver disease',
    ringkas: 'Fat accumulates in the liver alongside insulin resistance, quietly, for years.',
    lesi: [
      { struktur: 'Caudate lobe of liver', jenis: 'hypertrophy', catatan: 'Macrovesicular steatosis, progressing in a minority to steatohepatitis and fibrosis.' },
    ],
    hilir: ['Pancreas', 'Left kidney'],
    mekanisme:
      'Insulin resistance raises free fatty acid delivery and de novo lipogenesis while suppressing export; the ' +
      'triglyceride itself is relatively inert, and it is lipotoxic intermediates plus mitochondrial stress that drive ' +
      'inflammation. That is why steatosis alone carries little hepatic risk, and fibrosis stage — not fat quantity — predicts outcome.',
    temuan: [
      'Usually asymptomatic; found on ultrasound or as mildly raised transaminases',
      'Central obesity, type 2 diabetes, dyslipidaemia, hypertension — the metabolic cluster',
    ],
    penunjang: ['Ultrasound; exclude alcohol, viral hepatitis and autoimmune causes', 'Non-invasive fibrosis scores (FIB-4, NAFLD fibrosis score), then elastography — stage the fibrosis, not the fat'],
    tata: [
      'Weight loss of 7–10% reverses steatohepatitis; exercise helps independently of weight',
      'Treat diabetes and lipids; cardiovascular disease, not cirrhosis, is the commonest cause of death',
    ],
    organKey: 'liver',
    skdi: ['Perlemakan hepar', 'Obesitas', 'Sindrom metabolik'],
  },
  {
    id: 'meningitis',
    module: 'neurologi',
    label: 'Bacterial meningitis',
    ringkas: 'The membranes around the brain become infected: fever, headache, a stiff neck, and hours that matter.',
    lesi: [
      { struktur: 'Left lateral ventricle', jenis: 'dilatation', catatan: 'Purulent exudate impairs cerebrospinal fluid resorption; ventricles enlarge.' },
      { struktur: 'Third ventricle', jenis: 'dilatation', catatan: 'Communicating hydrocephalus as arachnoid granulations block.' },
    ],
    hilir: ['Cerebral aqueduct', 'Fourth ventricle', 'Pons'],
    mekanisme:
      'Bacterial cell wall components trigger cytokine release in the subarachnoid space, opening the blood–brain barrier ' +
      'and causing vasogenic and cytotoxic oedema plus vasculitis. Because the inflammatory burst peaks as bacteria lyse, ' +
      'dexamethasone given with or just before the first antibiotic dose reduces hearing loss — given later it does nothing.',
    temuan: [
      'Fever, headache, neck stiffness and altered consciousness; the classic triad is often incomplete',
      'Non-blanching rash suggests meningococcal disease; focal signs or seizures suggest complications',
    ],
    penunjang: ['Blood cultures then immediate antibiotics; lumbar puncture as soon as safe', 'CT before lumbar puncture only for focal deficit, papilloedema, seizure or immunosuppression'],
    tata: [
      'Do not delay antibiotics for imaging or for the lumbar puncture',
      'Dexamethasone with the first dose in suspected pneumococcal disease; notify and trace contacts',
    ],
    organKey: 'brain',
    skdi: ['Meningitis', 'Ensefalitis', 'Sepsis'],
  },
  {
    id: 'sah',
    module: 'neurologi',
    label: 'Subarachnoid haemorrhage',
    ringkas: 'A sudden thunderclap headache — the worst of a life — from a burst aneurysm at the base of the brain.',
    lesi: [
      { struktur: 'Basilar artery', jenis: 'dilatation', catatan: 'Saccular aneurysm at a branch point of the circle of Willis.' },
      { struktur: 'Insular part of left middle cerebral artery', jenis: 'dilatation', catatan: 'The MCA bifurcation is another classic aneurysm site.' },
    ],
    hilir: ['Third ventricle', 'Left lateral ventricle', 'Left insula'],
    mekanisme:
      'Blood under arterial pressure enters the subarachnoid space, raising intracranial pressure abruptly and irritating ' +
      'the meninges. Two delayed dangers follow: hydrocephalus, as blood blocks cerebrospinal fluid resorption, and ' +
      'vasospasm at days 4–14, which causes delayed ischaemia — the reason nimodipine is given and the patient is watched well past the initial stabilisation.',
    temuan: [
      'Instantaneous severe headache peaking within a minute, with vomiting, neck stiffness and photophobia',
      'Transient loss of consciousness, sentinel headache days earlier, third nerve palsy with a posterior communicating aneurysm',
    ],
    penunjang: ['Non-contrast CT within 6 hours is highly sensitive; lumbar puncture for xanthochromia if later or negative', 'CT or catheter angiography to find the aneurysm'],
    tata: [
      'Early aneurysm securing by coiling or clipping; nimodipine for 21 days',
      'Blood pressure control, monitoring for hydrocephalus and delayed cerebral ischaemia',
    ],
    organKey: 'brain',
    skdi: ['Perdarahan subarakhnoid', 'Hematom intraserebral'],
  },
  {
    id: 'alzheimer',
    module: 'neurologi',
    label: 'Alzheimer disease',
    ringkas: 'Memory for recent events goes first, because the disease starts where new memories are made.',
    lesi: [
      { struktur: 'Left hippocampus', jenis: 'stenosis', derajat: 0.4, catatan: 'Medial temporal atrophy — the earliest structural change.' },
      { struktur: 'Right hippocampus', jenis: 'stenosis', derajat: 0.4, catatan: 'Bilateral, though often asymmetric at onset.' },
    ],
    hilir: ['Left parahippocampal gyrus', 'Left cingulate gyrus', 'Left superior frontal gyrus'],
    mekanisme:
      'Neurofibrillary tau pathology begins in the transentorhinal region and spreads along connected circuits, which is ' +
      'why the deficit begins with episodic memory and only later becomes global. Amyloid accumulates a decade or more ' +
      'before symptoms, so by the time the diagnosis is clinical the disease is long established — the reason treatment trials aim earlier and earlier.',
    temuan: [
      'Insidious episodic memory loss with repetitive questioning, then language and visuospatial decline',
      'Preserved social facade early; insight is often reduced, so a collateral history is essential',
    ],
    penunjang: ['Cognitive testing; bloods and imaging to exclude reversible causes (B12, thyroid, depression, hydrocephalus)', 'MRI showing medial temporal atrophy supports it; the diagnosis remains clinical'],
    tata: [
      'Cholinesterase inhibitor for mild-moderate disease, memantine later; treat depression and sensory impairment',
      'Support the carer, plan capacity and driving early, avoid anticholinergics and antipsychotics where possible',
    ],
    organKey: 'brain',
    skdi: ['Penyakit Alzheimer', 'Demensia', 'Mild Cognitive Impairment (MCI)'],
  },
  {
    id: 'depresi',
    module: 'neurologi',
    label: 'Major depressive disorder',
    ringkas: 'Persistent low mood and loss of pleasure, with changes visible in the brain circuits that regulate emotion.',
    lesi: [
      { struktur: 'Left cingulate gyrus', jenis: 'incompetence', catatan: 'Subgenual anterior cingulate hyperactivity is the most reproducible functional finding.' },
      { struktur: 'Left amygdala', jenis: 'hypertrophy', catatan: 'Exaggerated amygdala response to negative stimuli with weakened prefrontal regulation.' },
    ],
    hilir: ['Left hippocampus', 'Left middle frontal gyrus'],
    mekanisme:
      'Depression is a disorder of a distributed circuit rather than a single structure: limbic reactivity rises while ' +
      'dorsolateral prefrontal control falls, and chronic stress with elevated cortisol reduces hippocampal neurogenesis ' +
      'and volume. Antidepressants block reuptake within hours but take weeks to work, because the change that matters is synaptic remodelling, not the transporter block.',
    temuan: [
      'Low mood and anhedonia for at least two weeks, with sleep, appetite, energy and concentration change',
      'Ask directly about suicidal ideation, plan and means — asking does not plant the idea',
      'Screen for bipolarity before starting an antidepressant, and for thyroid disease and anaemia',
    ],
    penunjang: ['Structured assessment (PHQ-9 or equivalent) and risk assessment', 'Bloods to exclude organic contributors; imaging only for atypical or late-onset presentations'],
    tata: [
      'Psychological therapy and antidepressant have similar effect sizes in moderate disease; combine in severe',
      'Review at 1–2 weeks for risk, continue treatment at least 6 months after remission to prevent relapse',
    ],
    organKey: 'brain',
    skdi: ['Depresi endogen, episode tunggal dan rekuran', 'Gangguan campuran cemas depresi'],
  },
  {
    id: 'skizofrenia',
    module: 'neurologi',
    label: 'Schizophrenia',
    ringkas: 'Hallucinations and delusions from a dopamine system that signals meaning where there is none.',
    lesi: [
      { struktur: 'Left putamen', jenis: 'hypertrophy', catatan: 'Elevated presynaptic dopamine synthesis capacity in the associative striatum.' },
      { struktur: 'Left middle frontal gyrus', jenis: 'incompetence', catatan: 'Dorsolateral prefrontal hypofunction underlying negative and cognitive symptoms.' },
    ],
    hilir: ['Left hippocampus', 'Posterior part of left superior temporal gyrus', 'Left lateral ventricle'],
    mekanisme:
      'Excess striatal dopamine assigns salience to irrelevant stimuli, and delusions are the explanatory story the ' +
      'patient builds around that experience. Antipsychotics block D2 receptors and dampen the salience but do not ' +
      'remove the belief, which is why insight returns slowly. Prefrontal and hippocampal dysfunction account for the negative and cognitive symptoms that antipsychotics barely touch.',
    temuan: [
      'Auditory hallucinations, delusions, disorganised speech for at least a month with functional decline',
      'Negative symptoms — flat affect, avolition, poverty of speech — predict long-term disability',
      'Duration of untreated psychosis predicts outcome; early intervention matters',
    ],
    penunjang: ['Exclude organic and substance-induced causes: drug screen, bloods, imaging where atypical', 'Baseline weight, glucose, lipids and ECG before antipsychotics'],
    tata: [
      'Antipsychotic at the lowest effective dose with metabolic monitoring; clozapine for treatment resistance',
      'Family intervention and supported employment change the trajectory more than dose escalation',
    ],
    organKey: 'brain',
    skdi: ['Skizofrenia', 'Gangguan psikotik'],
  },
  {
    id: 'ocd',
    module: 'neurologi',
    label: 'Obsessive-compulsive disorder',
    ringkas: 'Intrusive thoughts and rituals driven by a loop between the frontal cortex and the basal ganglia.',
    lesi: [
      { struktur: 'Left caudate nucleus', jenis: 'hypertrophy', catatan: 'Hyperactivity in the cortico-striato-thalamo-cortical loop.' },
      { struktur: 'Left cingulate gyrus', jenis: 'hypertrophy', catatan: 'Anterior cingulate hyperactivity — the error-signal that will not switch off.' },
    ],
    hilir: ['Left thalamus', 'Left inferior frontal gyrus'],
    mekanisme:
      'The orbitofrontal–caudate–thalamic loop behaves as though an error signal cannot be cancelled: the thought that ' +
      'something is wrong persists, and the compulsion is the attempt to terminate it. Exposure with response prevention ' +
      'works because it allows the loop to habituate without the ritual, and successful treatment normalises the same metabolic overactivity on imaging.',
    temuan: [
      'Obsessions recognised as one\'s own and resisted, compulsions performed to reduce distress, over an hour a day',
      'Insight is usually preserved — this distinguishes it from psychosis',
    ],
    penunjang: ['Structured assessment (Y-BOCS); screen for depression, tics and hoarding'],
    tata: [
      'Exposure and response prevention is first-line; SSRI at higher doses and for longer than in depression',
      'Add antipsychotic augmentation or refer for specialist care in refractory disease',
    ],
    organKey: 'brain',
    skdi: ['Gangguan obsesif-kompulsif', 'Gangguan cemas menyeluruh'],
  },
  {
    id: 'epistaksis',
    module: 'tht',
    label: 'Epistaxis',
    ringkas: 'A nosebleed, almost always from the same patch of vessels just inside the nostril.',
    lesi: [
      { struktur: 'Septal nasal cartilage', jenis: 'incompetence', catatan: 'Little area (Kiesselbach plexus) on the anterior septum — the site of most bleeds.' },
    ],
    hilir: ['Left inferior nasal concha', 'Right inferior nasal concha'],
    mekanisme:
      'Four arteries anastomose on the anterior septum, in mucosa that is thin, dry and easily traumatised — an ' +
      'anatomical convergence that makes anterior bleeding common and usually controllable by direct pressure. Posterior ' +
      'bleeding from the sphenopalatine artery is far less common but far more dangerous, because blood runs backwards into the airway and the volume is underestimated.',
    temuan: [
      'Unilateral bleeding controlled by pinching the soft part of the nose for 10–15 minutes leaning forward',
      'Bleeding down the throat, or failure of anterior packing, suggests a posterior source',
    ],
    penunjang: ['Usually none; full blood count, coagulation and group-and-save for heavy or recurrent bleeding'],
    tata: [
      'First aid pressure, then topical vasoconstrictor and cautery of a visible vessel',
      'Anterior packing if that fails; posterior packing or arterial ligation for posterior bleeds — and review anticoagulation',
    ],
    organKey: 'nasal-septum',
    skdi: ['Epistaksis', 'Deviasi septum hidung'],
  },
  {
    id: 'npc',
    module: 'tht',
    label: 'Nasopharyngeal carcinoma',
    ringkas: 'A tumour hidden behind the nose that usually announces itself as a lump in the neck.',
    lesi: [
      { struktur: 'Left superior pharyngeal constrictor', jenis: 'occlusion', catatan: 'Tumour arising in the fossa of Rosenmüller, in the lateral nasopharyngeal wall.' },
    ],
    hilir: ['Left salpingopharyngeus', 'Left palatopharyngeus', 'Trachea'],
    mekanisme:
      'The fossa of Rosenmüller sits next to the eustachian tube opening and beneath the skull base, so early tumour ' +
      'blocks middle-ear ventilation and later invades cranial nerves. Rich lymphatic drainage means most patients ' +
      'present with cervical nodes rather than nasal symptoms — an adult with unilateral serous otitis media and a neck node must have the nasopharynx examined.',
    temuan: [
      'Painless upper cervical lymphadenopathy, unilateral hearing loss and blood-stained nasal discharge',
      'Cranial nerve palsies and headache in advanced disease; strongly associated with Epstein–Barr virus',
    ],
    penunjang: ['Nasoendoscopy with biopsy; MRI of the skull base and neck for staging', 'Plasma EBV DNA where available for prognosis and monitoring'],
    tata: [
      'Radiotherapy is the mainstay, with chemotherapy for advanced stage',
      'Long-term follow-up for recurrence and for radiation effects on hearing, thyroid and swallowing',
    ],
    organKey: 'pharynx',
    skdi: ['Karsinoma nasofaring', 'Otitis media serosa'],
  },
  {
    id: 'parotitis',
    module: 'tht',
    label: 'Salivary gland infection',
    ringkas: 'A painful swelling in front of the ear or under the jaw, worse at mealtimes.',
    lesi: [
      { struktur: 'Left submandibular gland', jenis: 'occlusion', catatan: 'Stone in the duct obstructing flow — the submandibular gland forms most stones.' },
    ],
    hilir: ['Left sublingual gland', 'Tongue'],
    mekanisme:
      'Submandibular saliva is viscous and alkaline and must flow uphill along a long duct, which is why 80% of salivary ' +
      'calculi form there. Obstruction produces pain that peaks with salivary stimulation at mealtimes, and stasis ' +
      'invites ascending bacterial infection — dehydration and anticholinergic drugs are therefore genuine risk factors, not incidental.',
    temuan: [
      'Painful glandular swelling worse with food, pus at the duct orifice in bacterial infection',
      'Bilateral parotid swelling with systemic symptoms suggests mumps rather than obstruction',
    ],
    penunjang: ['Ultrasound for stone and abscess; sialography or CT for recurrent disease'],
    tata: [
      'Hydration, sialagogues, gland massage and warm compresses; antibiotics for bacterial infection',
      'Stone removal or gland excision for recurrent obstruction; drain an abscess',
    ],
    organKey: 'pharynx',
    skdi: ['Parotitis', 'Kandidiasis mulut'],
  },
  {
    id: 'konjungtivitis',
    module: 'mata',
    label: 'Conjunctivitis and keratitis',
    ringkas: 'A red eye — the question is whether the cornea is involved, because that is what threatens sight.',
    lesi: [
      { struktur: 'Left sclera', jenis: 'incompetence', catatan: 'Conjunctival injection, maximal in the fornices in simple conjunctivitis.' },
      { struktur: 'Left cornea', jenis: 'occlusion', catatan: 'Corneal infiltrate or ulcer in keratitis — this is the sight-threatening one.' },
    ],
    hilir: ['Left iris', 'Optic part of left retina'],
    mekanisme:
      'The conjunctiva is vascular and heals without scarring; the cornea is avascular, transparent and heals with scar. ' +
      'That difference is the whole triage: discharge and gritty discomfort with normal vision is benign, while pain, ' +
      'photophobia, reduced acuity or a corneal opacity means the transparent tissue is involved and vision is at stake. Contact lens wear moves the odds sharply toward keratitis.',
    temuan: [
      'Bilateral gritty red eyes with discharge and normal vision suggest conjunctivitis',
      'Severe pain, photophobia, blurred vision, corneal opacity or a fixed pupil are red flags',
    ],
    penunjang: ['Visual acuity in every red eye; fluorescein staining for corneal defect', 'Corneal scrape for culture in suspected microbial keratitis'],
    tata: [
      'Hygiene and lubricants for viral conjunctivitis; topical antibiotic for bacterial',
      'Urgent ophthalmology referral for any red flag; never patch or steroid an undiagnosed red eye',
    ],
    organKey: 'eye',
    skdi: ['Konjungtivitis', 'Keratitis', 'Benda asing di kornea'],
  },
  {
    id: 'ablasio-retina',
    module: 'mata',
    label: 'Retinal detachment',
    ringkas: 'Flashes, a shower of floaters, then a curtain across the vision — hours matter.',
    lesi: [
      { struktur: 'Optic part of left retina', jenis: 'incompetence', catatan: 'Retinal break allowing vitreous fluid under the neurosensory retina.' },
      { struktur: 'Left vitreous body', jenis: 'dilatation', catatan: 'Posterior vitreous detachment pulling on the retina — the usual initiating event.' },
    ],
    hilir: ['Left choroid', 'Left optic nerve'],
    mekanisme:
      'The neurosensory retina is only attached at the ora serrata and the optic disc; elsewhere it is held by the ' +
      'retinal pigment epithelium pump. A break lets fluid through, the pump is overwhelmed, and the detached retina is ' +
      'cut off from its choroidal blood supply. Photoreceptors survive only days, which is why macula-on detachment is an emergency and macula-off is merely urgent.',
    temuan: [
      'Sudden flashes and floaters, then a progressing peripheral field defect described as a curtain',
      'Reduced acuity means the macula has detached; check the red reflex and relative afferent pupillary defect',
    ],
    penunjang: ['Dilated fundus examination by an ophthalmologist; ultrasound if the view is obscured'],
    tata: [
      'Immediate referral — same day for macula-on detachment',
      'Surgical repair by vitrectomy, scleral buckle or pneumatic retinopexy; laser for retinal tears before detachment',
    ],
    organKey: 'eye',
    skdi: ['Ablasio retina', 'Perdarahan Vitreous'],
  },
  {
    id: 'neuritis-optik',
    module: 'mata',
    label: 'Optic neuritis',
    ringkas: 'Vision dims over days in one eye and moving it hurts — often the first sign of multiple sclerosis.',
    lesi: [
      { struktur: 'Left optic nerve', jenis: 'occlusion', catatan: 'Demyelinating inflammation, usually retrobulbar so the disc looks normal.' },
    ],
    hilir: ['Optic chiasm', 'Optic part of left retina'],
    mekanisme:
      'Demyelination slows and blocks conduction in the optic nerve; because the inflammation is usually behind the ' +
      'globe, the disc appears normal — "the patient sees nothing and the doctor sees nothing". The relative afferent ' +
      'pupillary defect is the objective sign, and colour vision is lost out of proportion to acuity because parvocellular fibres are most vulnerable.',
    temuan: [
      'Subacute unilateral visual loss over days, pain on eye movement, desaturation of red',
      'Relative afferent pupillary defect; normal disc in two-thirds, swollen in one-third',
    ],
    penunjang: ['MRI of brain and orbits with contrast — it also stratifies multiple sclerosis risk', 'Consider aquaporin-4 and MOG antibodies in atypical, bilateral or severe cases'],
    tata: [
      'Most recover spontaneously; intravenous methylprednisolone speeds recovery without changing the final acuity',
      'Refer for neurology assessment of demyelinating disease and disease-modifying therapy',
    ],
    organKey: 'optic-pathway',
    skdi: ['Neuritis optik', 'Sklerosis multipel'],
  },
  {
    id: 'mata-kering',
    module: 'mata',
    label: 'Dry eye disease',
    ringkas: 'Not too few tears so much as tears that evaporate too fast — gritty, burning, worse on screens.',
    lesi: [
      { struktur: 'Left lacrimal gland', jenis: 'incompetence', catatan: 'Reduced aqueous secretion in the aqueous-deficient form.' },
      { struktur: 'Tarsal plate of left upper eyelid', jenis: 'occlusion', catatan: 'Meibomian gland dysfunction — the commonest, evaporative form.' },
    ],
    hilir: ['Left cornea', 'Left sclera'],
    mekanisme:
      'The tear film is three layers, and the lipid layer from the meibomian glands is what prevents evaporation. Most ' +
      'dry eye is evaporative rather than aqueous-deficient, which is why artificial tears alone often fail and lid ' +
      'hygiene works. Tear hyperosmolarity then inflames the surface, creating a self-sustaining cycle that outlives the original trigger.',
    temuan: [
      'Grittiness, burning, fluctuating vision, worse with screens, air conditioning and contact lenses',
      'Paradoxical watering from reflex tearing; reduced tear break-up time and punctate staining',
    ],
    penunjang: ['Tear break-up time, ocular surface staining, Schirmer test; screen for Sjögren syndrome if severe'],
    tata: [
      'Lid hygiene and warm compresses for meibomian disease; preservative-free lubricants',
      'Treat blepharitis and the environment; topical anti-inflammatory therapy in refractory cases',
    ],
    organKey: 'eye',
    skdi: ['Mata kering', 'Kerato-konjungtivitis sicca', 'Blefaritis'],
  },
  {
    id: 'skoliosis',
    module: 'ortopedi',
    label: 'Scoliosis',
    ringkas: 'The spine curves sideways and twists; a rib hump appears when the child bends forward.',
    lesi: [
      { struktur: 'Eighth thoracic vertebra', jenis: 'dilatation', catatan: 'Lateral curvature with vertebral rotation at the apex.' },
      { struktur: 'Intervertebral disk of eighth thoracic vertebra', jenis: 'stenosis', derajat: 0.4, catatan: 'Asymmetric disc loading on the concave side.' },
    ],
    hilir: ['Ninth thoracic vertebra', 'Seventh thoracic vertebra'],
    mekanisme:
      'Scoliosis is three-dimensional: lateral curvature is coupled to axial rotation, which rotates the ribs and ' +
      'produces the hump seen on forward flexion. Asymmetric loading then follows the Hueter-Volkmann principle — ' +
      'compression slows growth on the concave side — so the curve accelerates during the pubertal growth spurt and largely stops at skeletal maturity.',
    temuan: [
      'Asymmetric shoulders and waist, rib hump on Adams forward bend test',
      'Pain, rapid progression, or neurological signs suggest a secondary cause and need imaging',
    ],
    penunjang: ['Standing full-spine radiograph with Cobb angle; assess skeletal maturity (Risser)', 'MRI for atypical curves, left thoracic curves or neurological signs'],
    tata: [
      'Observation for curves under 25°, bracing for progressive curves in a growing child',
      'Surgery for curves beyond about 45–50° or progression despite bracing',
    ],
    organKey: 'skeleton',
    skdi: ['Kelainan bentuk tulang belakang (kifosis, skoliosis, lordosis)'],
  },
  {
    id: 'osteomielitis',
    module: 'ortopedi',
    label: 'Osteomyelitis',
    ringkas: 'Infection inside the bone: deep constant pain, fever, and bone that will not heal without dead tissue being removed.',
    lesi: [
      { struktur: 'Left femur', jenis: 'occlusion', catatan: 'Metaphyseal infection in children, where sluggish sinusoidal blood flow allows seeding.' },
    ],
    hilir: ['Left patella', 'Left tibia', 'Left rectus femoris'],
    mekanisme:
      'Pus raises intraosseous pressure inside a rigid compartment, thrombosing the nutrient vessels; the devascularised ' +
      'fragment becomes a sequestrum that antibiotics cannot penetrate because it has no blood supply. That single fact ' +
      'explains why chronic osteomyelitis is a surgical disease and why cure requires removing dead bone, not longer courses.',
    temuan: [
      'Localised deep bone pain, fever, refusal to weight bear in a child',
      'Chronic disease: sinus tract, sequestrum, recurrent flares over years',
    ],
    penunjang: ['MRI is the most sensitive early test; radiographs lag by 10–14 days', 'Blood cultures and bone biopsy for organism and sensitivities before long courses'],
    tata: [
      'Targeted antibiotics guided by culture, for weeks not days',
      'Surgical debridement of dead bone and drainage of abscess; stabilise and reconstruct as needed',
    ],
    organKey: 'skeleton',
    skdi: ['Osteomielitis', 'Artritis, osteoarthritis'],
  },
  {
    id: 'ca-prostat',
    module: 'urogenital',
    label: 'Prostate carcinoma',
    ringkas: 'A cancer of the outer prostate — which is why it causes no symptoms until late.',
    lesi: [
      { struktur: 'Prostate', jenis: 'occlusion', catatan: 'Adenocarcinoma of the peripheral zone, away from the urethra.' },
    ],
    hilir: ['Urethra', 'Urinary bladder', 'Left seminal vesicle'],
    mekanisme:
      'Benign hyperplasia arises centrally around the urethra and obstructs early; carcinoma arises in the peripheral ' +
      'zone and therefore causes symptoms only when locally advanced. That zonal anatomy is also why the posterior ' +
      'surface is palpable on rectal examination, and why a hard nodule matters more than the gland size.',
    temuan: [
      'Often asymptomatic; hard irregular nodule or loss of the median sulcus on examination',
      'Bone pain from sclerotic metastases, particularly the spine and pelvis',
    ],
    penunjang: ['PSA with informed counselling, multiparametric MRI, then targeted biopsy with Gleason grading', 'Bone scan or PSMA imaging when the risk of metastasis is significant'],
    tata: [
      'Active surveillance for low-risk disease — overtreatment causes real harm',
      'Radical prostatectomy or radiotherapy for localised intermediate/high risk; androgen deprivation for advanced disease',
    ],
    organKey: 'prostate',
    skdi: ['Karsinoma prostat', 'Hiperplasia prostat jinak'],
  },
  {
    id: 'kriptorkidismus',
    module: 'urogenital',
    label: 'Undescended testis (congenital)',
    ringkas: 'The testis never completed its journey into the scrotum, where it needs to be cooler than the body.',
    lesi: [
      { struktur: 'Left testis', jenis: 'occlusion', catatan: 'Arrested descent along the inguinal path; the scrotum is empty on that side.' },
    ],
    hilir: ['Left epididymis', 'Left deferent duct'],
    mekanisme:
      'Descent depends on the gubernaculum and androgen signalling in the third trimester. Germ cells need the two ' +
      'degrees of cooling that the scrotum provides, so an undescended testis loses spermatogonia progressively from ' +
      'about six months of age — the reason orchidopexy is done in infancy rather than at school age. Malignancy risk remains raised even after correction, and the contralateral testis shares it.',
    temuan: [
      'Empty hemiscrotum at newborn or infant examination; distinguish from a retractile testis',
      'Bilateral impalpable testes with hypospadias require urgent endocrine and genetic assessment',
    ],
    penunjang: ['Clinical examination in a warm room; laparoscopy for impalpable testes — imaging is unreliable'],
    tata: [
      'Orchidopexy between 6 and 18 months of age',
      'Teach self-examination at puberty; the malignancy risk persists after surgery',
    ],
    organKey: 'testis',
    skdi: ['Testis tidak turun/ kriptorkidismus', 'Hipospadia'],
  },
  {
    id: 'varikokel',
    module: 'urogenital',
    label: 'Varicocele',
    ringkas: 'Dilated veins around the testis — a bag of worms, and a treatable cause of infertility.',
    lesi: [
      { struktur: 'Left epididymis', jenis: 'incompetence', catatan: 'Incompetent valves of the pampiniform plexus draining that side.' },
    ],
    hilir: ['Left testis', 'Left deferent duct'],
    mekanisme:
      'The left testicular vein drains at a right angle into the left renal vein while the right drains obliquely into ' +
      'the vena cava, so left-sided pressure is higher — which is why some 90% of varicoceles are left-sided. Stagnant ' +
      'blood raises scrotal temperature and impairs spermatogenesis. A right-sided or sudden varicocele demands imaging, because it can mean a retroperitoneal mass obstructing venous drainage.',
    temuan: [
      'Dragging scrotal ache worse on standing, "bag of worms" that empties when supine',
      'Testicular atrophy and abnormal semen parameters in adolescents and men with infertility',
    ],
    penunjang: ['Scrotal ultrasound with Doppler; abdominal imaging for isolated right-sided or non-decompressing varicocele', 'Semen analysis where fertility is a concern'],
    tata: [
      'Observation if asymptomatic with normal testicular growth',
      'Embolisation or surgical ligation for pain, testicular growth arrest, or abnormal semen parameters',
    ],
    organKey: 'testis',
    skdi: ['Varikokel', 'Infertilitas'],
  },
  {
    id: 'fistula-obstetri',
    module: 'obstetri',
    label: 'Obstetric fistula',
    ringkas: 'After days of obstructed labour, a hole forms between bladder and vagina and urine leaks constantly.',
    lesi: [
      { struktur: 'Urinary bladder', jenis: 'occlusion', catatan: 'Pressure necrosis of the bladder base compressed between the fetal head and the pubis.' },
      { struktur: 'Urethra', jenis: 'incompetence', catatan: 'Urethral involvement makes repair harder and continence less certain.' },
    ],
    hilir: ['Rectum', 'Left pubococcygeus'],
    mekanisme:
      'This is an ischaemic injury, not a tear. Prolonged obstruction compresses soft tissue between the fetal skull and ' +
      'the pubic bone; perfusion stops, the tissue necroses over days, and the slough separates about a week later, ' +
      'leaving a fistula. It is therefore entirely preventable by relieving obstruction in time — the injury is a marker of access to care, not of anatomy.',
    temuan: [
      'Continuous painless urinary leakage beginning days after a prolonged labour, usually with a stillbirth',
      'Foot drop from lumbosacral compression, amenorrhoea, and profound social isolation',
    ],
    penunjang: ['Dye test to confirm and localise; examination under anaesthesia; assess renal function and ureteric involvement'],
    tata: [
      'Surgical repair by an experienced fistula surgeon, with prolonged postoperative catheter drainage',
      'Prevention is the real treatment: partogram use, timely caesarean, and skilled birth attendance',
    ],
    organKey: 'bladder',
    skdi: ['Fistula (vesiko-vaginal, uretero-vagina, rektovagina)', 'Partus lama', 'Distosia'],
  },
  {
    id: 'ruptur-perineum',
    module: 'obstetri',
    label: 'Obstetric anal sphincter injury',
    ringkas: 'A third or fourth degree perineal tear at delivery — repaired properly or it costs continence for life.',
    lesi: [
      { struktur: 'Left pubococcygeus', jenis: 'occlusion', catatan: 'Perineal body and levator disruption extending into the anal sphincter complex.' },
      { struktur: 'Rectum', jenis: 'incompetence', catatan: 'Fourth degree injury breaches the anorectal mucosa.' },
    ],
    hilir: ['Right pubococcygeus', 'Urethra'],
    mekanisme:
      'The external anal sphincter is a striated muscle ring whose ends retract laterally when torn, so an unrepaired ' +
      'or inadequately repaired injury heals as a gap rather than a ring. Continence then depends on the internal ' +
      'sphincter and puborectalis alone, which is why unrecognised third degree tears — not the delivery itself — account for much later faecal incontinence.',
    temuan: [
      'Systematic perineal and rectal examination after every vaginal birth is what finds these',
      'Risk: first vaginal birth, instrumental delivery, large baby, shoulder dystocia, midline episiotomy',
    ],
    penunjang: ['Examination under adequate analgesia and lighting; endoanal ultrasound in follow-up for persistent symptoms'],
    tata: [
      'Repair in theatre by a trained operator, with antibiotics and laxatives afterwards',
      'Pelvic floor physiotherapy and follow-up; discuss mode of delivery for the next pregnancy',
    ],
    organKey: 'bladder',
    skdi: ['Ruptur perineum tingkat 3-4', 'Inkontinensia feses'],
  },
  {
    id: 'anemia-defisiensi-besi',
    module: 'imunologi',
    label: 'Iron deficiency anaemia',
    ringkas: 'Not enough iron to build haemoglobin — and in an adult, the real question is where it is being lost.',
    lesi: [
      { struktur: 'Left femur', jenis: 'incompetence', catatan: 'Marrow erythropoiesis limited by iron supply, producing microcytic hypochromic cells.' },
    ],
    hilir: ['Spleen', 'Right femur'],
    mekanisme:
      'Iron is conserved rather than excreted, so deficiency means either poor intake and absorption or loss. Hepcidin ' +
      'falls, absorption rises, and stores are emptied before haemoglobin falls — which is why ferritin drops first and ' +
      'a normal haemoglobin does not exclude deficiency. In a man or postmenopausal woman, occult gastrointestinal blood loss is the assumption until proven otherwise.',
    temuan: [
      'Fatigue, pallor, exertional dyspnoea; koilonychia, angular stomatitis and pica when chronic',
      'Microcytic hypochromic indices with low ferritin and raised total iron binding capacity',
    ],
    penunjang: ['Ferritin (an acute-phase reactant — interpret with CRP), transferrin saturation', 'Coeliac serology, and endoscopic investigation of the gut in adults'],
    tata: [
      'Oral iron, alternate-day dosing improves absorption and tolerance; recheck at 2–4 weeks for a haemoglobin response',
      'Find and treat the cause; intravenous iron for malabsorption or intolerance',
    ],
    organKey: 'lymph-nodes',
    skdi: ['Anemia defisiensi besi', 'Perdarahan gastrointestinal'],
  },
  {
    id: 'sepsis',
    module: 'imunologi',
    label: 'Sepsis',
    ringkas: 'Infection tips the whole body into organ failure — every hour of delay costs lives.',
    lesi: [
      { struktur: 'Spleen', jenis: 'hypertrophy', catatan: 'Reticuloendothelial activation with immune dysregulation.' },
    ],
    hilir: ['Left femur', 'Left lobe of thymus', 'Right lobe of thymus'],
    mekanisme:
      'Sepsis is a dysregulated host response, not simply an overwhelming infection: endothelial injury and glycocalyx ' +
      'shedding cause capillary leak and microvascular shunting, so tissues stay hypoxic even when cardiac output and ' +
      'blood pressure look adequate. That explains the lactate that persists after the pressure is restored, and why source control matters more than any single drug.',
    temuan: [
      'Fever or hypothermia, tachycardia, tachypnoea, altered mental state, mottled skin, oliguria',
      'qSOFA or NEWS to flag; lactate above 2 mmol/L marks tissue hypoperfusion',
    ],
    penunjang: ['Blood cultures before antibiotics, lactate, full blood count, renal and liver function', 'Imaging directed at the suspected source'],
    tata: [
      'Antibiotics within the first hour, fluid resuscitation, and vasopressors when fluid alone fails',
      'Source control — drain, debride, remove the line; reassess perfusion rather than a single blood pressure number',
    ],
    organKey: 'spleen',
    skdi: ['Sepsis', 'Syok (septik, hipovolemik, kardiogenik, neurogenik)', 'Bakteremia'],
  },
  {
    id: 'hiv',
    module: 'imunologi',
    label: 'HIV infection',
    ringkas: 'A virus that destroys the CD4 cells coordinating immunity — treatable, and now compatible with a normal lifespan.',
    lesi: [
      { struktur: 'Left lobe of thymus', jenis: 'occlusion', catatan: 'Progressive CD4 T-cell depletion and lymphoid tissue destruction.' },
      { struktur: 'Right lobe of thymus', jenis: 'occlusion', catatan: 'Thymic output cannot compensate for peripheral loss.' },
    ],
    hilir: ['Spleen', 'Left femur'],
    mekanisme:
      'HIV integrates into CD4 cells and establishes a latent reservoir within days of infection — the reason therapy ' +
      'must be lifelong and why early treatment matters. Loss of CD4 help disables both cellular and humoral responses, ' +
      'so the opportunistic infections that define AIDS track predictably with the CD4 count. Effective therapy that suppresses viral load also eliminates sexual transmission.',
    temuan: [
      'Seroconversion illness; then years of asymptomatic infection with persistent generalised lymphadenopathy',
      'Weight loss, chronic diarrhoea, oral candidiasis, tuberculosis, Kaposi sarcoma in advanced disease',
    ],
    penunjang: ['Fourth-generation antigen/antibody test, confirmed and followed by viral load and CD4 count', 'Screen for tuberculosis, hepatitis B and C, syphilis and cryptococcal antigen by CD4'],
    tata: [
      'Start antiretroviral therapy immediately regardless of CD4 count; adherence is everything',
      'Prophylaxis by CD4 count, vaccination, partner testing and PrEP for those at risk',
    ],
    organKey: 'lymph-nodes',
    skdi: ['HIV AIDS tanpa komplikasi', 'AIDS dengan komplikasi', 'Tuberkulosis dengan HIV'],
  },
  {
    id: 'luka-bakar',
    module: 'kulit',
    label: 'Major burns',
    ringkas: 'The skin barrier is destroyed over a large area: fluid pours out, and infection pours in.',
    lesi: [
      { struktur: 'Skin', jenis: 'occlusion', catatan: 'Full-thickness destruction of epidermis and dermis; no spontaneous re-epithelialisation.' },
    ],
    hilir: ['Hair of head', 'Lip', 'Eyebrow'],
    mekanisme:
      'Burned tissue releases mediators that make capillaries leak systemically, so plasma is lost far beyond the wound ' +
      'itself — which is why resuscitation is calculated from body surface area and weight rather than from the wound\'s ' +
      'appearance. Loss of the barrier also abolishes evaporative and thermal control, and a full-thickness circumferential burn acts as a tourniquet as oedema develops.',
    temuan: [
      'Estimate depth and percentage body surface area (rule of nines; palm ≈ 1%)',
      'Airway burn signs: facial burns, singed nasal hair, soot, hoarseness, stridor — intubate early',
      'Circumferential burns of limb or chest threaten perfusion and ventilation — escharotomy',
    ],
    penunjang: ['Carboxyhaemoglobin and blood gas in enclosed-space fires; group and save, baseline renal function'],
    tata: [
      'Stop the burning, cool the burn and warm the patient; formula-guided fluid resuscitation titrated to urine output',
      'Analgesia, tetanus cover, early referral to a burns centre; dressings and early excision with grafting',
    ],
    organKey: 'skin',
    skdi: ['Luka bakar derajat 3 dan 4', 'Luka bakar derajat 1 dan 2', 'Luka akibat bahan kimia'],
  },
  {
    id: 'selulitis',
    module: 'kulit',
    label: 'Cellulitis and erysipelas',
    ringkas: 'A spreading hot red area of skin from bacteria that entered through a small break.',
    lesi: [
      { struktur: 'Skin', jenis: 'hypertrophy', catatan: 'Erysipelas is sharply demarcated and superficial dermal; cellulitis is deeper and less well defined.' },
    ],
    hilir: ['Hair of head', 'Lip'],
    mekanisme:
      'Streptococci and staphylococci enter through a fissure — tinea pedis between the toes is the classic unnoticed ' +
      'portal — and spread through dermal lymphatics, which is why erysipelas has a raised sharp border while deeper ' +
      'cellulitis does not. Each episode scars lymphatics and predisposes to the next, so treating the entry point prevents recurrence more reliably than longer antibiotics.',
    temuan: [
      'Unilateral hot, red, tender, swollen area with fever; bilateral leg redness is almost never cellulitis',
      'Look for the portal of entry — interdigital fungal infection, ulcer, insect bite',
      'Rapidly progressing pain out of proportion, crepitus or bullae suggest necrotising infection — surgical emergency',
    ],
    penunjang: ['Clinical diagnosis; mark the border and time it', 'Bloods and cultures if systemically unwell; imaging for abscess or deeper infection'],
    tata: [
      'Antibiotics covering streptococci and staphylococci; elevate the limb',
      'Treat the entry point and any oedema; consider prophylaxis after repeated episodes',
    ],
    organKey: 'skin',
    skdi: ['Erisipelas', 'Impetigo', 'Tinea pedis'],
  },
  {
    id: 'sjs',
    module: 'kulit',
    label: 'Stevens-Johnson syndrome and toxic epidermal necrolysis',
    ringkas: 'A drug reaction in which the skin and mucous membranes detach in sheets — a burns-level emergency.',
    lesi: [
      { struktur: 'Skin', jenis: 'occlusion', catatan: 'Keratinocyte apoptosis with full-thickness epidermal necrosis and detachment.' },
      { struktur: 'Lip', jenis: 'occlusion', catatan: 'Haemorrhagic mucosal erosions — two or more mucosal sites is characteristic.' },
    ],
    hilir: ['Eyebrow', 'Hair of head'],
    mekanisme:
      'Drug-specific cytotoxic T cells and natural killer cells release granulysin, killing keratinocytes across the ' +
      'full thickness of the epidermis. The result is functionally a burn without heat: fluid and protein loss, ' +
      'thermoregulatory failure and infection risk in proportion to detached surface area. Certain HLA alleles predict it — a pharmacogenomic risk, not idiosyncrasy.',
    temuan: [
      'Prodromal fever, then painful skin with dusky macules, blisters and a positive Nikolsky sign',
      'Mucosal involvement of eyes, mouth and genitals; percentage detachment separates SJS from TEN',
      'Common culprits: allopurinol, carbamazepine, phenytoin, sulfonamides, nevirapine, NSAIDs',
    ],
    penunjang: ['Skin biopsy where diagnosis is unclear; SCORTEN for severity; ophthalmology review early to prevent scarring'],
    tata: [
      'Stop the culprit drug immediately — the single most important action',
      'Burns-unit level supportive care: fluids, temperature, analgesia, wound and eye care',
      'Record the allergy prominently and counsel about cross-reacting drugs and family risk',
    ],
    organKey: 'skin',
    skdi: ['Sindrom Stevens-Johnson', 'Toxic epidermal necrolysis', 'Exanthematous drug eruption, fixed drug eruption'],
  },
  {
    id: 'skabies',
    module: 'kulit',
    label: 'Scabies',
    ringkas: 'A mite burrows into the skin; the itch is worst at night and the whole household needs treating.',
    lesi: [
      { struktur: 'Skin', jenis: 'occlusion', catatan: 'Burrows in the finger webs, wrists, axillae, waist and genitalia.' },
    ],
    hilir: ['Pubic hair', 'Hair of head'],
    mekanisme:
      'The itch is a delayed hypersensitivity response to mite antigen, not to the mite\'s movement — which is why it ' +
      'begins weeks after infestation, why it persists for a fortnight after successful treatment, and why the first ' +
      'infestation itches later than a reinfestation. Mite numbers are low in classic scabies but enormous in crusted scabies, which is highly contagious.',
    temuan: [
      'Intense nocturnal itch with burrows and papules in typical sites, sparing the head in adults',
      'Other household members itching is a stronger clue than any single sign',
    ],
    penunjang: ['Clinical diagnosis; dermoscopy or skin scraping shows the mite where doubt exists'],
    tata: [
      'Topical permethrin or oral ivermectin, applied to the whole body from the neck down, repeated after 7 days',
      'Treat all close contacts simultaneously and launder bedding; warn that itch persists for up to 2–4 weeks',
    ],
    organKey: 'skin',
    skdi: ['Skabies', 'Pedikulosis pubis'],
  },
]

/** Semua struktur yang disebut satu keadaan, lesi maupun hilirnya. */
export function strukturKondisiSistem(k: SystemCondition): string[] {
  return [...k.lesi.map((l) => l.struktur), ...k.hilir]
}

/** Dari struktur yang disentuh ke penyakit yang mengenainya. */
export function kondisiUntukStrukturSistem(module: string, nama: string): Array<{
  kondisi: SystemCondition
  peran: 'lesi' | 'hilir'
}> {
  const n = nama.toLowerCase()
  const out: Array<{ kondisi: SystemCondition; peran: 'lesi' | 'hilir' }> = []
  for (const k of SYSTEM_CONDITIONS) {
    if (k.module !== module) continue
    if (k.lesi.some((l) => l.struktur.toLowerCase() === n)) out.push({ kondisi: k, peran: 'lesi' })
    else if (k.hilir.some((h) => h.toLowerCase() === n)) out.push({ kondisi: k, peran: 'hilir' })
  }
  return out
}

export function kondisiUntukModul(module: string): SystemCondition[] {
  return SYSTEM_CONDITIONS.filter((k) => k.module === module)
}

/** Dipakai uji: struktur yang disebut tapi tidak ada di modulnya. */
export function strukturSistemTakDikenal(): string[] {
  const hilang: string[] = []
  for (const k of SYSTEM_CONDITIONS)
    for (const s of strukturKondisiSistem(k))
      if (!ATLAS_BY_NAME[`${k.module}::${s.toLowerCase()}`]) hilang.push(`${k.id}: ${s}`)
  return hilang
}
