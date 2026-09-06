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
      { struktur: 'Fourth lumbar vertebra', jenis: 'stenosis', derajat: 0.5, catatan: 'Posterolateral herniation at L4–L5 compressing the traversing root.' },
      { struktur: 'Fifth lumbar vertebra', jenis: 'stenosis', derajat: 0.5, catatan: 'L5–S1 is the other common level.' },
    ],
    hilir: ['Sacrum', 'Left gluteus maximus'],
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
