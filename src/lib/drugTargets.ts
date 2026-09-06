import { MOLECULE_BY_ID, type MoleculeMeta } from './molecules.gen'

// ─────────────────────────────────────────────────────────────────────────────
// DARI MOLEKUL KE PASIEN — satu rantai yang bisa ditelusuri.
//
//   molekul 3D → target molekulnya → apa yang dilakukannya di sana
//   → organ tempat kerjanya di figur → penyakit yang diobatinya
//   → catatan klinis obat itu di katalog yang sudah ada
//
// Ini yang membedakannya dari daftar obat: bukan "amlodipin untuk hipertensi",
// melainkan kanal kalsium tipe-L pada otot polos pembuluh, tempatnya di tubuh,
// dan keadaan mana di atlas patologi yang ia lawan.
//
// TIGA TAUTAN DI TIAP BARIS DIUJI, karena tautan mati tidak terlihat: nama obat
// harus ada di obatKatalog.ts, sasaran organ harus ada di organFocus.ts, dan id
// penyakit harus ada di atlas patologi. Lihat server/uji/drugTargets.uji.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface DrugTarget {
  /** Sama dengan id molekul di molecules.gen.ts dan nama berkas JSON-nya. */
  id: string
  /** Nama PERSIS seperti di obatKatalog.ts, supaya catatannya bisa ditarik. */
  katalog: string
  /** Protein, enzim, atau kanal yang benar-benar diikatnya. */
  target: string
  targetKelas: 'enzyme' | 'receptor' | 'channel' | 'transporter' | 'nucleic acid' | 'cell wall' | 'other'
  /** Apa yang terjadi setelah ia terikat — tingkat rujukan, bukan slogan. */
  aksi: string
  /** Sasaran organ (organFocus.ts) tempat efek yang dikehendaki muncul. */
  sites: string[]
  /** Sasaran organ tempat efek TIDAK dikehendaki lazim muncul. */
  efekSamping: string[]
  /** id keadaan di atlas patologi kardiovaskular atau spesialisasi. */
  mengobati: string[]
  /** Satu hal keamanan yang benar-benar mengubah tindakan. */
  peringatan: string
}

export const DRUG_TARGETS: DrugTarget[] = [
  {
    id: 'aspirin', katalog: 'Aspirin (low dose)', target: 'Cyclo-oxygenase-1 (COX-1)', targetKelas: 'enzyme',
    aksi: 'Acetylates serine-529 of COX-1 irreversibly. Platelets have no nucleus and cannot resynthesise the enzyme, so a single dose disables thromboxane A2 production for the platelet\'s whole 7–10 day life — the reason a 75 mg daily dose works and why bleeding risk persists a week after stopping.',
    sites: ['heart'], efekSamping: ['stomach', 'kidneys'],
    mengobati: ['stemi-anterior', 'stable-angina', 'carotid-stenosis', 'mca-occlusion', 'pad'],
    peringatan: 'Avoid in children with viral illness (Reye syndrome) and in active peptic ulceration.',
  },
  {
    id: 'clopidogrel', katalog: 'Clopidogrel', target: 'P2Y12 ADP receptor', targetKelas: 'receptor',
    aksi: 'A prodrug activated by CYP2C19 to a thiol metabolite that binds P2Y12 irreversibly, blocking ADP-driven amplification of platelet aggregation. Loss-of-function CYP2C19 variants therefore produce genuine non-response, which is a pharmacogenomic problem rather than non-adherence.',
    sites: ['heart'], efekSamping: ['stomach'],
    mengobati: ['stemi-anterior', 'stable-angina', 'pad', 'carotid-stenosis'],
    peringatan: 'Stop 5–7 days before major surgery; omeprazole reduces activation via CYP2C19.',
  },
  {
    id: 'warfarin', katalog: 'Warfarin', target: 'Vitamin K epoxide reductase (VKORC1)', targetKelas: 'enzyme',
    aksi: 'Blocks regeneration of reduced vitamin K, so factors II, VII, IX and X cannot be gamma-carboxylated. Protein C has the shortest half-life of the vitamin K-dependent proteins, which is why warfarin is transiently prothrombotic at initiation and must be bridged in acute thrombosis.',
    sites: ['liver'], efekSamping: ['brain', 'stomach'],
    mengobati: ['dvt', 'pe', 'mitral-stenosis'],
    peringatan: 'Narrow therapeutic index with food and drug interactions; INR monitoring is not optional.',
  },
  {
    id: 'atorvastatin', katalog: 'Atorvastatin', target: 'HMG-CoA reductase', targetKelas: 'enzyme',
    aksi: 'Competitively inhibits the rate-limiting step of hepatic cholesterol synthesis; falling intracellular sterol upregulates LDL receptors, which clear LDL from plasma. The benefit tracks absolute LDL reduction, so the starting level matters more than the dose label.',
    sites: ['liver'], efekSamping: ['liver', 'skeleton'],
    mengobati: ['stable-angina', 'stemi-anterior', 'carotid-stenosis', 'pad'],
    peringatan: 'Myopathy risk rises with interacting drugs; investigate muscle pain with creatine kinase.',
  },
  {
    id: 'simvastatin', katalog: 'Simvastatin', target: 'HMG-CoA reductase', targetKelas: 'enzyme',
    aksi: 'Same target as atorvastatin but a lactone prodrug cleared by CYP3A4, which makes it far more interaction-prone — grapefruit, macrolides and azoles raise exposure and with it the risk of rhabdomyolysis.',
    sites: ['liver'], efekSamping: ['skeleton'],
    mengobati: ['stable-angina', 'pad'],
    peringatan: 'Dose is capped when combined with amlodipine, diltiazem or amiodarone.',
  },
  {
    id: 'amlodipine', katalog: 'Amlodipine', target: 'L-type calcium channel (Cav1.2)', targetKelas: 'channel',
    aksi: 'A dihydropyridine that binds the channel preferentially in vascular smooth muscle rather than myocardium, so it lowers peripheral resistance without depressing contractility. Its very long half-life makes the effect smooth and forgiving of a missed dose.',
    sites: ['heart'], efekSamping: ['heart'],
    mengobati: ['stable-angina', 'renal-artery-stenosis'],
    peringatan: 'Dose-dependent ankle oedema is precapillary vasodilatation, not fluid overload — diuretics do not fix it.',
  },
  {
    id: 'bisoprolol', katalog: 'Bisoprolol', target: 'Beta-1 adrenoceptor', targetKelas: 'receptor',
    aksi: 'Cardioselective antagonism lowers heart rate and contractility, cutting myocardial oxygen demand and lengthening diastole — which is when the coronaries actually fill. In heart failure it works by blocking chronic sympathetic drive, so it is started low and titrated slowly.',
    sites: ['heart'], efekSamping: ['lungs'],
    mengobati: ['stable-angina', 'heart-failure', 'stemi-inferior'],
    peringatan: 'Never stop abruptly (rebound ischaemia); caution in asthma even with cardioselective agents.',
  },
  {
    id: 'propranolol', katalog: 'Propranolol', target: 'Beta-1 and beta-2 adrenoceptors', targetKelas: 'receptor',
    aksi: 'Non-selective blockade; in portal hypertension the beta-2 component matters, because unopposed alpha tone constricts the splanchnic bed and lowers portal inflow — an effect a cardioselective blocker cannot reproduce.',
    sites: ['heart', 'liver'], efekSamping: ['lungs'],
    mengobati: ['portal-hypertension', 'sirosis'],
    peringatan: 'Contraindicated in asthma; masks the adrenergic warning signs of hypoglycaemia.',
  },
  {
    id: 'lisinopril', katalog: 'Lisinopril', target: 'Angiotensin-converting enzyme', targetKelas: 'enzyme',
    aksi: 'Blocks conversion of angiotensin I to II, lowering efferent arteriolar tone and aldosterone. That efferent dilatation reduces intraglomerular pressure — renoprotective in proteinuria, but the reason creatinine rises and can precipitate injury in bilateral renal artery stenosis.',
    sites: ['heart', 'kidneys'], efekSamping: ['kidneys'],
    mengobati: ['heart-failure', 'ckd', 'nefrotik', 'dm2'],
    peringatan: 'Contraindicated in pregnancy; a rise in creatinine above 30% after starting warrants review.',
  },
  {
    id: 'captopril', katalog: 'Captopril', target: 'Angiotensin-converting enzyme', targetKelas: 'enzyme',
    aksi: 'The first ACE inhibitor, carrying a sulfhydryl group that accounts for its taste disturbance and rash. Short-acting, so it is used where a rapid, reversible effect is wanted rather than for daily maintenance.',
    sites: ['heart', 'kidneys'], efekSamping: ['kidneys'],
    mengobati: ['heart-failure', 'ckd'],
    peringatan: 'Dry cough from bradykinin accumulation affects up to one in five; angioedema is rare but life-threatening.',
  },
  {
    id: 'losartan', katalog: 'Losartan', target: 'Angiotensin II type 1 receptor', targetKelas: 'receptor',
    aksi: 'Blocks the receptor rather than the enzyme, so bradykinin is not accumulated and cough does not occur. It is uricosuric, which is a useful side benefit in hypertensive patients with gout.',
    sites: ['heart', 'kidneys'], efekSamping: ['kidneys'],
    mengobati: ['heart-failure', 'ckd', 'dm2'],
    peringatan: 'Same pregnancy contraindication and hyperkalaemia risk as ACE inhibitors.',
  },
  {
    id: 'furosemide', katalog: 'Furosemide', target: 'Na-K-2Cl cotransporter (NKCC2)', targetKelas: 'transporter',
    aksi: 'Inhibits the cotransporter in the thick ascending limb, abolishing the corticomedullary gradient. It must be secreted into the tubular lumen to work, so in renal impairment the dose must rise to deliver enough drug to the site of action.',
    sites: ['kidneys', 'heart'], efekSamping: ['kidneys', 'ear'],
    mengobati: ['heart-failure', 'aki', 'ckd', 'sirosis'],
    peringatan: 'Hypokalaemia, hyponatraemia and ototoxicity with rapid high-dose infusion.',
  },
  {
    id: 'hct', katalog: 'Hydrochlorothiazide', target: 'Na-Cl cotransporter (NCC)', targetKelas: 'transporter',
    aksi: 'Blocks sodium reabsorption in the distal convoluted tubule. Its antihypertensive effect outlasts its natriuresis, which is why it works at doses that barely increase urine output, and it raises calcium reabsorption — useful in stone formers.',
    sites: ['kidneys'], efekSamping: ['kidneys', 'pancreas'],
    mengobati: ['urolitiasis', 'heart-failure'],
    peringatan: 'Hyponatraemia and hypokalaemia, especially in older women; raises urate and glucose.',
  },
  {
    id: 'spironolactone', katalog: 'Spironolactone', target: 'Mineralocorticoid receptor', targetKelas: 'receptor',
    aksi: 'Competitive aldosterone antagonism in the collecting duct spares potassium; in heart failure and cirrhosis its benefit is largely anti-fibrotic and neurohormonal rather than diuretic, which is why low doses improve survival.',
    sites: ['kidneys', 'heart', 'liver'], efekSamping: ['kidneys'],
    mengobati: ['heart-failure', 'sirosis', 'cushing'],
    peringatan: 'Hyperkalaemia — dangerous with ACE inhibitors, ARBs or renal impairment; gynaecomastia is common.',
  },
  {
    id: 'salbutamol', katalog: 'Salbutamol', target: 'Beta-2 adrenoceptor', targetKelas: 'receptor',
    aksi: 'Gs-coupled agonism raises cyclic AMP in airway smooth muscle and relaxes it within minutes. It relieves bronchoconstriction without touching the underlying inflammation, which is precisely why reliever-only treatment is now considered unsafe.',
    sites: ['lungs'], efekSamping: ['heart'],
    mengobati: ['asthma', 'copd'],
    peringatan: 'Rising reliever use signals deteriorating control; high doses cause tremor, tachycardia and hypokalaemia.',
  },
  {
    id: 'prednisolone', katalog: 'Prednisolone', target: 'Glucocorticoid receptor', targetKelas: 'receptor',
    aksi: 'The ligand–receptor complex enters the nucleus, transactivating anti-inflammatory genes and transrepressing NF-kB. Because the effect is transcriptional, clinical benefit takes hours — a corticosteroid is never the drug that rescues an acute airway in minutes.',
    sites: ['lungs', 'skin', 'adrenal'], efekSamping: ['adrenal', 'skeleton', 'stomach', 'pancreas'],
    mengobati: ['asthma', 'copd', 'sle', 'lepra', 'psoriasis'],
    peringatan: 'Suppresses the HPA axis after about three weeks — taper, and cover physiological stress.',
  },
  {
    id: 'dexamethasone', katalog: 'Dexamethasone', target: 'Glucocorticoid receptor', targetKelas: 'receptor',
    aksi: 'A long-acting, almost purely glucocorticoid agonist with negligible mineralocorticoid activity — the reason it is used where fluid retention must be avoided, and why it is the agent given in the suppression test that diagnoses Cushing syndrome.',
    sites: ['brain', 'adrenal'], efekSamping: ['adrenal', 'pancreas', 'skeleton'],
    mengobati: ['cushing', 'krisis-adrenal'],
    peringatan: 'Hyperglycaemia is rapid and marked; long courses carry the full glucocorticoid burden.',
  },
  {
    id: 'metformin', katalog: 'Metformin', target: 'Mitochondrial complex I / AMPK signalling', targetKelas: 'enzyme',
    aksi: 'Inhibits hepatic gluconeogenesis by raising the cellular AMP:ATP ratio and activating AMPK-dependent signalling. It does not stimulate insulin secretion, so it does not cause hypoglycaemia on its own, and it is weight-neutral to weight-reducing.',
    sites: ['liver', 'pancreas'], efekSamping: ['small-intestine', 'kidneys'],
    mengobati: ['dm2'],
    peringatan: 'Withhold in acute kidney injury, sepsis and before iodinated contrast — lactic acidosis risk.',
  },
  {
    id: 'omeprazole', katalog: 'Omeprazole', target: 'Gastric H+/K+-ATPase (proton pump)', targetKelas: 'transporter',
    aksi: 'A prodrug concentrated in the acidic canaliculus of the parietal cell, where it rearranges to a sulfenamide and binds the pump covalently. Only actively secreting pumps are inhibited, which is why it must be taken 30–60 minutes before a meal.',
    sites: ['stomach'], efekSamping: ['stomach', 'kidneys', 'skeleton'],
    mengobati: ['ulkus-peptikum', 'sirosis'],
    peringatan: 'Long-term use is associated with hypomagnesaemia, B12 deficiency and enteric infection; reduces clopidogrel activation.',
  },
  {
    id: 'ondansetron', katalog: 'Ondansetron', target: '5-HT3 receptor', targetKelas: 'receptor',
    aksi: 'Blocks serotonin at vagal afferents in the gut and at the chemoreceptor trigger zone. Because it targets the serotonergic pathway specifically, it is far more effective against chemotherapy and post-operative nausea than against motion sickness, which is histaminergic and cholinergic.',
    sites: ['brain', 'small-intestine'], efekSamping: ['heart', 'large-intestine'],
    mengobati: ['pankreatitis', 'ketoasidosis'],
    peringatan: 'Prolongs the QT interval; constipation is common.',
  },
  {
    id: 'amoxicillin', katalog: 'Amoxicillin', target: 'Penicillin-binding proteins (transpeptidase)', targetKelas: 'cell wall',
    aksi: 'The beta-lactam ring mimics the D-Ala-D-Ala terminus and acylates the transpeptidase, so peptidoglycan cannot be cross-linked and dividing bacteria lyse. Killing is time-dependent, which is why dosing interval matters more than peak concentration.',
    sites: ['lungs', 'pharynx', 'bladder'], efekSamping: ['large-intestine', 'skin'],
    mengobati: ['pneumonia', 'tonsilofaringitis', 'rinosinusitis', 'isk', 'ulkus-peptikum'],
    peringatan: 'A rash with amoxicillin in glandular fever is not a penicillin allergy; true anaphylaxis is.',
  },
  {
    id: 'ciprofloxacin', katalog: 'Ciprofloxacin', target: 'DNA gyrase and topoisomerase IV', targetKelas: 'nucleic acid',
    aksi: 'Traps the enzyme–DNA complex, converting it into a double-strand break generator. Excellent Gram-negative and urinary penetration, but the same class effect on collagen turnover explains tendinopathy and aortic risk.',
    sites: ['bladder', 'kidneys'], efekSamping: ['skeleton', 'brain'],
    mengobati: ['isk', 'urolitiasis'],
    peringatan: 'Tendon rupture, aortic aneurysm and QT prolongation; avoid with divalent cations, which chelate it.',
  },
  {
    id: 'metronidazole', katalog: 'Metronidazole', target: 'Bacterial and protozoal DNA (nitroreduction)', targetKelas: 'nucleic acid',
    aksi: 'Reduced by ferredoxin-like systems that exist only in anaerobes and certain protozoa, generating nitro radicals that fragment DNA. That selective reduction step is the entire basis of its narrow, anaerobe-specific spectrum.',
    sites: ['large-intestine', 'liver'], efekSamping: ['brain'],
    mengobati: ['appendicitis', 'kolelitiasis'],
    peringatan: 'Disulfiram-like reaction with alcohol; peripheral neuropathy with prolonged courses.',
  },
  {
    id: 'isoniazid', katalog: 'Isoniazid', target: 'Enoyl-ACP reductase (InhA), mycolic acid synthesis', targetKelas: 'enzyme',
    aksi: 'A prodrug activated by mycobacterial catalase-peroxidase (KatG); the active form blocks mycolic acid synthesis, so the cell wall cannot be built. Mutations in katG are the commonest route to isoniazid resistance — resistance to activation, not to the target.',
    sites: ['lungs'], efekSamping: ['liver', 'peripheral-nerves'],
    mengobati: ['tb-paru'],
    peringatan: 'Hepatitis and pyridoxine-responsive neuropathy; never used as a single agent for active disease.',
  },
  {
    id: 'allopurinol', katalog: 'Allopurinol', target: 'Xanthine oxidase', targetKelas: 'enzyme',
    aksi: 'Its metabolite oxypurinol inhibits xanthine oxidase, cutting urate production upstream rather than increasing excretion. Because urate crystals mobilise as levels fall, starting it during an acute attack can precipitate a flare — cover, or wait.',
    sites: ['kidneys', 'skeleton'], efekSamping: ['skin', 'kidneys'],
    mengobati: ['urolitiasis', 'osteoartritis', 'leukemia'],
    peringatan: 'Severe cutaneous reactions, strongly associated with HLA-B*58:01; interacts dangerously with azathioprine.',
  },
  {
    id: 'levodopa', katalog: 'Levodopa/carbidopa', target: 'Dopamine precursor (AADC substrate)', targetKelas: 'other',
    aksi: 'Dopamine cannot cross the blood–brain barrier but levodopa can, using the large neutral amino acid transporter. Carbidopa blocks peripheral decarboxylation without entering the brain, raising central delivery and abolishing most of the nausea.',
    sites: ['brain'], efekSamping: ['brain', 'heart'],
    mengobati: ['parkinson'],
    peringatan: 'Protein-rich meals compete for absorption; never stop abruptly — a malignant syndrome can follow.',
  },
  {
    id: 'phenytoin', katalog: 'Phenytoin', target: 'Voltage-gated sodium channel', targetKelas: 'channel',
    aksi: 'Binds preferentially to the inactivated state, prolonging recovery and so limiting high-frequency firing without touching normal traffic. Its elimination saturates within the therapeutic range, so a small dose increase can produce a large, toxic rise in concentration.',
    sites: ['brain'], efekSamping: ['brain', 'skin', 'skeleton'],
    mengobati: ['epilepsi-temporal'],
    peringatan: 'Zero-order kinetics, gum hypertrophy, and severe cutaneous reactions linked to HLA-B*15:02.',
  },
  {
    id: 'diazepam', katalog: 'Diazepam', target: 'GABA-A receptor benzodiazepine site', targetKelas: 'receptor',
    aksi: 'Increases the frequency of chloride channel opening in the presence of GABA — it amplifies inhibition rather than creating it, which is why the dose–response curve is far safer than that of barbiturates until opioids are added.',
    sites: ['brain'], efekSamping: ['brain', 'lungs'],
    mengobati: ['epilepsi-temporal'],
    peringatan: 'Respiratory depression compounds with opioids and alcohol; dependence develops within weeks.',
  },
  {
    id: 'haloperidol', katalog: 'Haloperidol', target: 'Dopamine D2 receptor', targetKelas: 'receptor',
    aksi: 'High-affinity D2 antagonism in the mesolimbic pathway treats positive psychotic symptoms; the same blockade in the nigrostriatal pathway produces the extrapyramidal effects, and in the tuberoinfundibular pathway raises prolactin. One target, four pathways, four consequences.',
    sites: ['brain'], efekSamping: ['brain', 'heart'],
    mengobati: ['perdarahan-intraserebral'],
    peringatan: 'Acute dystonia, tardive dyskinesia, QT prolongation and neuroleptic malignant syndrome.',
  },
  {
    id: 'sertraline', katalog: 'Sertraline', target: 'Serotonin transporter (SERT)', targetKelas: 'transporter',
    aksi: 'Blocks presynaptic reuptake within hours, yet the clinical effect takes weeks — the delay reflects receptor downregulation and synaptic remodelling, not slow absorption. Telling patients that is the difference between adherence and abandonment at day five.',
    sites: ['brain'], efekSamping: ['stomach', 'brain'],
    mengobati: ['epilepsi-temporal'],
    peringatan: 'Bleeding risk with NSAIDs, hyponatraemia in older patients, serotonin syndrome with other serotonergic drugs.',
  },
  {
    id: 'morphine', katalog: 'Morphine', target: 'Mu opioid receptor', targetKelas: 'receptor',
    aksi: 'Gi-coupled agonism closes calcium channels presynaptically and opens potassium channels postsynaptically, reducing transmission in the dorsal horn and altering the affective response to pain in the limbic system. Its active metabolite is renally cleared, so it accumulates in renal failure.',
    sites: ['brain', 'spinal-cord'], efekSamping: ['lungs', 'large-intestine'],
    mengobati: ['stemi-anterior', 'pankreatitis', 'urolitiasis'],
    peringatan: 'Respiratory depression and constipation without tolerance; avoid in right ventricular infarction hypotension.',
  },
  {
    id: 'paracetamol', katalog: 'Paracetamol', target: 'Central COX and endocannabinoid pathways', targetKelas: 'enzyme',
    aksi: 'Acts centrally rather than at inflamed tissue, which is why it is analgesic and antipyretic but barely anti-inflammatory. It is conjugated safely until glutathione is exhausted, and then NAPQI destroys hepatocytes — dose, not idiosyncrasy, is the hazard.',
    sites: ['brain'], efekSamping: ['liver'],
    mengobati: ['osteoartritis', 'dengue', 'tonsilofaringitis'],
    peringatan: 'Reduce the dose in low body weight, malnutrition and chronic alcohol use; N-acetylcysteine is the antidote.',
  },
  {
    id: 'ibuprofen', katalog: 'Ibuprofen', target: 'Cyclo-oxygenase-1 and -2', targetKelas: 'enzyme',
    aksi: 'Reversible, competitive inhibition reduces prostaglandin synthesis at inflamed tissue. The same prostaglandins maintain gastric mucus and afferent arteriolar dilatation, so the gastric and renal harms are on-target effects, not accidents.',
    sites: ['skeleton'], efekSamping: ['stomach', 'kidneys', 'heart'],
    mengobati: ['osteoartritis', 'urolitiasis'],
    peringatan: 'Avoid in dengue (bleeding), in acute kidney injury, and combined with ACE inhibitor plus diuretic.',
  },
  {
    id: 'cetirizine', katalog: 'Cetirizine', target: 'Histamine H1 receptor', targetKelas: 'receptor',
    aksi: 'An inverse agonist stabilising the inactive receptor conformation. Its low blood–brain penetration — a consequence of high polarity and P-glycoprotein efflux — is what separates second-generation antihistamines from the sedating first generation.',
    sites: ['skin', 'nasal-septum'], efekSamping: ['brain'],
    mengobati: ['dermatitis-atopik', 'rinosinusitis'],
    peringatan: 'Still sedating in a minority; reduce the dose in renal impairment.',
  },
]

export function targetForMolecule(id: string): DrugTarget | undefined {
  return DRUG_TARGETS.find((d) => d.id === id)
}

export function moleculeOf(d: DrugTarget): MoleculeMeta | undefined {
  return MOLECULE_BY_ID[d.id]
}

/** Obat yang menyerang satu keadaan — dipakai dari atlas patologi. */
export function drugsForCondition(conditionId: string): DrugTarget[] {
  return DRUG_TARGETS.filter((d) => d.mengobati.includes(conditionId))
}

/** Obat yang bekerja pada satu organ — dipakai dari figur 3D. */
export function drugsForOrgan(organKey: string): DrugTarget[] {
  return DRUG_TARGETS.filter((d) => d.sites.includes(organKey))
}
