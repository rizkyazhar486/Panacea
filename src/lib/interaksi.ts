import { semuaObat } from './obatKatalog'
import { semuaHerbal } from './herbal'

// ─────────────────────────────────────────────────────────────────────────────
// Pemeriksa interaksi — obat dengan obat, dan obat dengan herbal.
//
// APA YANG ALAT INI ADALAH, DAN APA YANG BUKAN. Ini harus dinyatakan lebih
// dahulu, sebab kesalahpahaman di sini berbahaya.
//
// INI BUKAN pemeriksa interaksi yang lengkap. Ia memeriksa MEKANISME yang
// ditulis ke dalam aplikasi ini, dan tidak lebih. Tidak ditemukannya sesuatu
// TIDAK berarti kombinasi itu aman — ia berarti tidak ada aturan di sini yang
// cocok. Kalimat itu tampil di layar setiap kali hasilnya kosong, sebab hasil
// kosong yang dibaca sebagai "aman" justru kegagalan yang paling merugikan
// yang bisa dilakukan alat semacam ini.
//
// MENGAPA MEKANISME, BUKAN DAFTAR PASANGAN. Menuliskan tiap pasangan obat
// satu per satu berarti 550 x 550 kemungkinan, dan yang tertulis akan selalu
// sebagian kecil saja — sementara layar tetap tampak seperti memeriksa
// semuanya. Dengan menandai MEKANISME (menginduksi CYP3A4, menambah risiko
// perdarahan, menurunkan kalium, memanjangkan QT), satu aturan menjangkau
// seluruh golongan sekaligus, dan alasannya dapat ditampilkan apa adanya —
// pembaca melihat MENGAPA, bukan sekadar "hati-hati".
//
// OBAT DITANDAI MENURUT GOLONGANNYA, bukan satu per satu. Golongan sudah ada
// di katalog dan sudah benar; menandai ulang tiap zat hanya menambah tempat
// baru untuk keliru. Beberapa zat memang punya penandaan sendiri karena
// perilakunya menyimpang dari golongannya, dan itu ditulis terpisah.
//
// TIDAK MENYALAKAN PERINGATAN PADA TERAPI YANG MEMANG DISENGAJA. Dua
// antihipertensi bersama adalah pengobatan yang benar, bukan interaksi.
// Aturan yang akan menyala pada kombinasi lazim ditandai `hanyaHerbal`,
// sehingga ia hanya berlaku ketika salah satu pihaknya herbal. Peringatan yang
// menyala terus-menerus berhenti dibaca, dan sesudah itu peringatan yang
// benar-benar penting ikut tidak terbaca.
// ─────────────────────────────────────────────────────────────────────────────

export type Tanda =
  | 'induksi-cyp3a4' | 'hambat-cyp3a4'
  | 'antikoagulan' | 'antiplatelet' | 'risiko-perdarahan'
  | 'hipoglikemik'
  | 'sedatif'
  | 'serotonergik'
  | 'qt'
  | 'kalium-turun' | 'kalium-naik'
  | 'digoksin'
  | 'imunosupresan'
  | 'antihipertensi'
  | 'levodopa'
  | 'hepatotoksik'
  | 'nefrotoksik'
  | 'kontrasepsi-hormonal'
  | 'antiretroviral'
  | 'nitrat' | 'pde5'
  | 'litium'
  // ── Ditambahkan pada putaran kedua. Semuanya mekanisme yang mapan dan
  //    sering benar-benar mencederai orang, bukan kemungkinan teoretis.
  | 'hambat-cyp2c19' | 'substrat-cyp2c19'
  | 'naikkan-warfarin'
  | 'antikolinergik' | 'kolinergik'
  | 'hiperglikemik'
  | 'mielosupresi'
  | 'miopati'
  | 'tiopurin' | 'xantin-oksidase'
  | 'valproat' | 'karbapenem'
  | 'kelasi-kation' | 'kation-polivalen'
  | 'vaksin-hidup'
  | 'hiponatremia'
  | 'blokade-neuromuskular' | 'potensiasi-nm'
  // ── Penajaman. Dua penandaan sebelumnya TERLALU LEBAR dan menyalakan
  //    peringatan yang keliru — ditemukan dengan menyilangkan seluruh 619
  //    butir dan membaca aturan mana yang paling sering menyala.
  //
  //    'imunosupresan' dipakai untuk aturan vaksin hidup, dan di situ ia
  //    memang harus lebar: anti-TNF dan penghambat JAK sama-sama menekan
  //    imunitas. Tetapi aturan CYP3A4 keliru bila memakai tanda yang sama —
  //    adalimumab bukan substrat CYP3A4, jadi klaritromisin + adalimumab
  //    menyala tanpa dasar. Yang berlaku untuk CYP adalah penghambat
  //    kalsineurin dan mTOR saja.
  //
  //    Hal serupa pada antikoagulan: rivaroksaban dan apiksaban memang
  //    substrat CYP3A4 dan P-gp, sedangkan heparin sama sekali bukan, dan
  //    warfarin lewat CYP2C9 — bukan 3A4. Menyamakan ketiganya membuat
  //    rifampisin + heparin menyala, padahal tidak ada yang terjadi di sana.
  | 'imunosupresan-sempit'
  | 'doac' | 'warfarin'
  // ── Putaran ketiga ────────────────────────────────────────────────────────
  | 'kardiotoksik' | 'ototoksik'
  | 'metotreksat' | 'hambat-sekresi-tubular'
  | 'bradikardik'
  | 'opioid' | 'benzodiazepin'
  | 'nsaid' | 'raas'

/** Penandaan menurut GOLONGAN farmakologi di katalog obat. */
const TANDA_KELAS: { cocok: RegExp; tanda: Tanda[] }[] = [
  { cocok: /anticoagulant|heparin|vitamin K antagonist|factor Xa|thrombin inhibitor/i, tanda: ['antikoagulan', 'risiko-perdarahan'] },
  { cocok: /antiplatelet|P2Y12/i, tanda: ['antiplatelet', 'risiko-perdarahan'] },
  { cocok: /thrombolytic/i, tanda: ['risiko-perdarahan'] },
  { cocok: /NSAID|COX-2/i, tanda: ['risiko-perdarahan', 'nefrotoksik'] },
  { cocok: /biguanide|sulfonylurea|SGLT2|DPP-4|GLP-1|insulin|glucosidase|thiazolidinedione/i, tanda: ['hipoglikemik'] },
  { cocok: /benzodiazepine|hypnotic|anaesthetic|opioid|barbiturate|antihistamine|antipsychotic/i, tanda: ['sedatif'] },
  { cocok: /SSRI|SNRI|tricyclic antidepressant|serotonin|triptan|5-HT1B/i, tanda: ['serotonergik'] },
  { cocok: /macrolide|fluoroquinolone|antiarrhythmic|antipsychotic|5-HT3 antagonist|triazole antifungal/i, tanda: ['qt'] },
  { cocok: /loop diuretic|thiazide/i, tanda: ['kalium-turun', 'antihipertensi'] },
  { cocok: /mineralocorticoid receptor antagonist|potassium-sparing|non-steroidal MRA/i, tanda: ['kalium-naik', 'antihipertensi'] },
  { cocok: /ACE inhibitor|angiotensin receptor blocker|neprilysin/i, tanda: ['kalium-naik', 'antihipertensi'] },
  { cocok: /cardiac glycoside/i, tanda: ['digoksin'] },
  { cocok: /calcineurin inhibitor|mTOR inhibitor/i, tanda: ['imunosupresan', 'imunosupresan-sempit'] },
  { cocok: /immunosuppressant|anti-TNF|JAK inhibitor|IL-6|IL-12|TNF receptor|anti-integrin|checkpoint inhibitor/i, tanda: ['imunosupresan'] },
  { cocok: /direct factor Xa inhibitor|direct thrombin inhibitor/i, tanda: ['doac'] },
  { cocok: /beta blocker|calcium channel blocker|alpha-2 agonist|vasodilator|alpha-1 blocker|If channel/i, tanda: ['antihipertensi'] },
  { cocok: /dopamine precursor|dopamine agonist|MAO-B|COMT/i, tanda: ['levodopa'] },
  /* 'hepatotoksik' sempat mencakup statin dan seluruh antiretroviral, dan
     akibatnya aturan hati menjadi yang PALING SERING menyala dari semuanya —
     630 dari 191.271 pasangan. Statin jarang benar-benar merusak hati
     (persoalannya otot, dan itu sudah punya aturannya sendiri), dan
     antiretroviral modern juga tidak. Yang tersisa hanyalah golongan yang
     memang dikenal hepatotoksik; sisanya ditandai satu per satu pada zatnya. */
  { cocok: /antituberculosis|triazole antifungal/i, tanda: ['hepatotoksik'] },
  { cocok: /aminoglycoside|glycopeptide|polymyxin|platinum compound|contrast medium/i, tanda: ['nefrotoksik'] },
  { cocok: /contraceptive|progestogen|oestrogen/i, tanda: ['kontrasepsi-hormonal'] },
  { cocok: /reverse transcriptase inhibitor|integrase|protease inhibitor|non-nucleoside/i, tanda: ['antiretroviral'] },
  { cocok: /nitrate/i, tanda: ['nitrat'] },
  { cocok: /PDE5/i, tanda: ['pde5'] },
  { cocok: /mood stabiliser/i, tanda: ['litium'] },
  // ── Putaran kedua ─────────────────────────────────────────────────────────
  { cocok: /proton pump inhibitor/i, tanda: ['hambat-cyp2c19', 'kation-polivalen'] },
  { cocok: /antimuscarinic|antispasmodic|cycloplegic|mydriatic|first-generation antihistamine/i, tanda: ['antikolinergik'] },
  { cocok: /tricyclic antidepressant|typical antipsychotic|atypical antipsychotic/i, tanda: ['antikolinergik'] },
  { cocok: /acetylcholinesterase inhibitor|cholinesterase (inhibitor|reactivator)/i, tanda: ['kolinergik'] },
  { cocok: /glucocorticoid|corticosteroid with mineralocorticoid/i, tanda: ['hiperglikemik', 'kalium-turun'] },
  { cocok: /beta-2 agonist/i, tanda: ['kalium-turun'] },
  { cocok: /alkylating agent|anthracycline|vinca alkaloid|taxane|topoisomerase|pyrimidine analogue|purine analogue|antifolate|platinum compound|antitumour antibiotic|oral fluoropyrimidine|antimetabolite/i, tanda: ['mielosupresi'] },
  { cocok: /HMG-CoA reductase inhibitor|fibrate/i, tanda: ['miopati'] },
  { cocok: /xanthine oxidase inhibitor/i, tanda: ['xantin-oksidase'] },
  { cocok: /carbapenem/i, tanda: ['karbapenem'] },
  { cocok: /tetracycline|glycylcycline|fluoroquinolone|bisphosphonate|thyroid hormone/i, tanda: ['kelasi-kation'] },
  { cocok: /antacid|iron salt|intravenous iron|mineral|phosphate binder|potassium binder/i, tanda: ['kation-polivalen'] },
  { cocok: /live attenuated vaccine/i, tanda: ['vaksin-hidup'] },
  { cocok: /SSRI|SNRI|thiazide/i, tanda: ['hiponatremia'] },
  { cocok: /neuromuscular blocker/i, tanda: ['blokade-neuromuskular'] },
  { cocok: /aminoglycoside/i, tanda: ['potensiasi-nm', 'ototoksik'] },
  // ── Putaran ketiga ────────────────────────────────────────────────────────
  { cocok: /anthracycline|anti-HER2/i, tanda: ['kardiotoksik'] },
  { cocok: /platinum compound|loop diuretic|glycopeptide/i, tanda: ['ototoksik'] },
  { cocok: /NSAID|COX-2/i, tanda: ['nsaid', 'hambat-sekresi-tubular'] },
  { cocok: /penicillin|aminopenicillin/i, tanda: ['hambat-sekresi-tubular'] },
  { cocok: /ACE inhibitor|angiotensin receptor blocker|neprilysin|mineralocorticoid receptor antagonist|non-steroidal MRA/i, tanda: ['raas'] },
  { cocok: /beta blocker|non-dihydropyridine calcium channel blocker|cardiac glycoside|If channel|acetylcholinesterase inhibitor/i, tanda: ['bradikardik'] },
  { cocok: /opioid|synthetic opioid/i, tanda: ['opioid'] },
  { cocok: /benzodiazepine/i, tanda: ['benzodiazepin'] },
]

/** Zat yang perilakunya menyimpang dari golongannya. Ditulis satu per satu. */
const TANDA_ZAT: Record<string, Tanda[]> = {
  'Rifampicin': ['induksi-cyp3a4', 'hepatotoksik'],
  'Phenytoin': ['induksi-cyp3a4'],
  'Phenobarbital': ['induksi-cyp3a4'],
  'Clarithromycin': ['hambat-cyp3a4', 'qt'],
  'Erythromycin': ['hambat-cyp3a4', 'qt'],
  'Itraconazole': ['hambat-cyp3a4'],
  'Voriconazole': ['hambat-cyp3a4', 'hepatotoksik'],
  'Ketoconazole (topical)': ['hambat-cyp3a4'],
  'Nirmatrelvir/ritonavir': ['hambat-cyp3a4'],
  'Cimetidine': ['hambat-cyp3a4'],
  'Lithium carbonate': ['litium'],
  'Tramadol': ['serotonergik', 'sedatif'],
  'Paracetamol': ['hepatotoksik'],
  'Isoniazid': ['hepatotoksik'],
  'Pyrazinamide': ['hepatotoksik'],
  'Warfarin': ['antikoagulan', 'risiko-perdarahan', 'warfarin'],
  'Aspirin (low dose)': ['antiplatelet', 'risiko-perdarahan'],
  'Aspirin (analgesic dose)': ['antiplatelet', 'risiko-perdarahan'],
  'Digoxin': ['digoksin'],
  'Glyceryl trinitrate': ['nitrat'],
  'Isosorbide dinitrate': ['nitrat'],
  'Sildenafil': ['pde5'],
  'Tadalafil': ['pde5'],
  'Levodopa/carbidopa': ['levodopa'],
  'Spironolactone': ['kalium-naik', 'antihipertensi'],
  'Liquorice': ['kalium-turun'],
  // ── Putaran kedua ─────────────────────────────────────────────────────────
  'Clopidogrel': ['antiplatelet', 'risiko-perdarahan', 'substrat-cyp2c19'],
  'Omeprazole': ['hambat-cyp2c19', 'kation-polivalen'],
  'Esomeprazole': ['hambat-cyp2c19', 'kation-polivalen'],
  'Metronidazole': ['naikkan-warfarin'],
  'Metronidazole (vaginal)': ['naikkan-warfarin'],
  'Fluconazole': ['naikkan-warfarin', 'qt', 'hambat-cyp3a4'],
  'Trimethoprim/sulfamethoxazole': ['naikkan-warfarin', 'kalium-naik', 'mielosupresi'],
  'Colchicine': ['miopati'],
  'Azathioprine': ['tiopurin', 'mielosupresi', 'imunosupresan'],
  '6-Mercaptopurine': ['tiopurin', 'mielosupresi'],
  'Allopurinol': ['xantin-oksidase'],
  'Febuxostat': ['xantin-oksidase'],
  'Sodium valproate': ['valproat', 'hepatotoksik'],
  'Levothyroxine': ['kelasi-kation'],
  'Lamotrigine': ['hiponatremia'],
  'Oxcarbazepine': ['hiponatremia', 'induksi-cyp3a4'],
  'Carbamazepine': ['induksi-cyp3a4', 'hiponatremia'],
  'Ganciclovir': ['mielosupresi'],
  'Valganciclovir': ['mielosupresi'],
  'Zidovudine': ['mielosupresi', 'antiretroviral'],
  'Linezolid': ['serotonergik', 'mielosupresi'],
  'Hydroxycarbamide': ['mielosupresi'],
  'Neostigmine': ['kolinergik'],
  'Pyridostigmine': ['kolinergik'],
  'Physostigmine': ['kolinergik'],
  'Quinine': ['qt'],
  'Mefloquine': ['qt'],
  'Chloroquine': ['qt'],
  'Bedaquiline': ['qt'],
  'Domperidone': ['qt'],
  'Methadone': ['qt', 'sedatif'],
  'Citalopram': ['serotonergik', 'qt', 'hiponatremia'],
  'Escitalopram': ['serotonergik', 'qt', 'hiponatremia'],
  'Nevirapine': ['hepatotoksik', 'antiretroviral'],
  'Efavirenz': ['hepatotoksik', 'antiretroviral'],
  'Ritonavir': ['hambat-cyp3a4', 'antiretroviral', 'hepatotoksik'],
  // ── Putaran ketiga ────────────────────────────────────────────────────────
  'Methotrexate': ['metotreksat', 'mielosupresi', 'hepatotoksik', 'nefrotoksik'],
  'Simvastatin': ['miopati', 'hepatotoksik'],
  'Atorvastatin': ['miopati', 'hepatotoksik'],
  'Amiodarone': ['qt', 'hepatotoksik', 'hambat-cyp3a4', 'bradikardik'],
  'Diltiazem': ['antihipertensi', 'bradikardik', 'hambat-cyp3a4'],
  'Verapamil': ['antihipertensi', 'bradikardik', 'hambat-cyp3a4'],
  'Doxorubicin': ['kardiotoksik', 'mielosupresi'],
  'Daunorubicin': ['kardiotoksik', 'mielosupresi'],
  'Trastuzumab': ['kardiotoksik'],
  'Cisplatin': ['ototoksik', 'nefrotoksik', 'mielosupresi'],
  'Furosemide': ['kalium-turun', 'antihipertensi', 'ototoksik'],
  'Vancomycin': ['nefrotoksik', 'ototoksik'],
  'Tenofovir disoproxil': ['nefrotoksik', 'antiretroviral'],
  'Probenecid': ['hambat-sekresi-tubular'],
  'Haloperidol': ['qt', 'antikolinergik', 'sedatif'],
  'Chlorpromazine': ['qt', 'antikolinergik', 'sedatif'],
  'Hydroxyzine': ['qt', 'antikolinergik', 'sedatif'],
  'Ondansetron': ['qt'],
}

/** Penandaan herbal, ditulis per tanaman. */
const TANDA_HERBAL: Record<string, Tanda[]> = {
  "Hypericum perforatum": ['induksi-cyp3a4', 'serotonergik'],
  'Commiphora mukul': ['induksi-cyp3a4'],
  'Schisandra chinensis': ['hambat-cyp3a4'],
  'Coptis chinensis / Berberis spp.': ['hambat-cyp3a4', 'hipoglikemik'],
  'Ginkgo biloba': ['risiko-perdarahan'],
  'Allium sativum': ['risiko-perdarahan', 'antihipertensi'],
  'Zingiber officinale': ['risiko-perdarahan'],
  'Curcuma longa': ['risiko-perdarahan'],
  'Salvia miltiorrhiza': ['risiko-perdarahan', 'antikoagulan'],
  'Angelica sinensis': ['risiko-perdarahan'],
  'Matricaria chamomilla': ['risiko-perdarahan', 'sedatif'],
  'Ganoderma lucidum': ['risiko-perdarahan', 'antihipertensi'],
  'Emblica officinalis': ['risiko-perdarahan'],
  'Trigonella foenum-graecum': ['hipoglikemik', 'risiko-perdarahan'],
  'Momordica charantia': ['hipoglikemik'],
  'Cinnamomum spp.': ['hipoglikemik', 'hepatotoksik'],
  'Cinnamomum burmannii': ['hipoglikemik', 'hepatotoksik'],
  'Syzygium polyanthum': ['hipoglikemik'],
  'Ocimum tenuiflorum': ['hipoglikemik', 'risiko-perdarahan'],
  'Panax ginseng': ['hipoglikemik'],
  'Valeriana officinalis': ['sedatif'],
  'Piper methysticum': ['sedatif', 'hepatotoksik'],
  'Withania somnifera': ['sedatif', 'hepatotoksik', 'imunosupresan'],
  'Bacopa monnieri': ['sedatif'],
  'Cannabis sativa': ['sedatif'],
  'Glycyrrhiza glabra': ['kalium-turun', 'antihipertensi'],
  'Glycyrrhiza uralensis': ['kalium-turun'],
  'Aloe vera': ['kalium-turun'],
  'Morinda citrifolia': ['kalium-naik', 'hepatotoksik'],
  'Astragalus membranaceus': ['imunosupresan'],
  'Mucuna pruriens': ['levodopa'],
  'Camellia sinensis': ['hepatotoksik'],
  'Garcinia cambogia': ['hepatotoksik'],
  'Tinospora crispa': ['hepatotoksik'],
  'Ephedra sinica': ['antihipertensi'],
  'Crataegus spp.': ['antihipertensi', 'digoksin'],
  'Terminalia arjuna': ['antihipertensi', 'risiko-perdarahan'],
  'Nigella sativa': ['antihipertensi', 'hipoglikemik'],
  'Orthosiphon aristatus': ['kalium-turun'],
  'Eurycoma longifolia': ['pde5'],
  'Silybum marianum': ['hambat-cyp3a4'],
}

export type Berat = 'serius' | 'perhatian'

interface Aturan {
  a: Tanda
  b: Tanda
  berat: Berat
  judul: string
  sebab: string
  /** Hanya berlaku bila salah satu pihaknya herbal — lihat kepala berkas. */
  hanyaHerbal?: boolean
}

const ATURAN: Aturan[] = [
  { a: 'induksi-cyp3a4', b: 'kontrasepsi-hormonal', berat: 'serius',
    judul: 'Hormonal contraception may fail',
    sebab: 'Enzyme induction lowers hormone levels enough to cause unplanned pregnancy. Additional non-hormonal contraception is needed during use and for a period afterwards.' },
  { a: 'induksi-cyp3a4', b: 'antiretroviral', berat: 'serius',
    judul: 'Antiretroviral levels fall — risk of losing viral control and of resistance',
    sebab: 'Induction reduces drug exposure. This combination has caused treatment failure.' },
  { a: 'induksi-cyp3a4', b: 'imunosupresan-sempit', berat: 'serius',
    judul: 'Transplant rejection risk',
    sebab: 'Induction lowers tacrolimus and ciclosporin levels. Rejection has been reported with this combination.' },
  { a: 'induksi-cyp3a4', b: 'doac', berat: 'serius',
    judul: 'Direct oral anticoagulant may become ineffective',
    sebab: 'Rivaroxaban, apixaban and dabigatran depend on CYP3A4 and P-glycoprotein. Induction lowers their exposure, and unlike warfarin there is no INR to show it — the first sign is a clot.' },
  { a: 'induksi-cyp3a4', b: 'warfarin', berat: 'serius',
    judul: 'Warfarin effect falls',
    sebab: 'Enzyme induction increases warfarin clearance and the INR drops, often over days to weeks. It also rebounds when the inducer is stopped, which is the more dangerous half.' },
  { a: 'hambat-cyp3a4', b: 'imunosupresan-sempit', berat: 'serius',
    judul: 'Immunosuppressant levels may rise to toxic range',
    sebab: 'Enzyme inhibition raises exposure of narrow-index drugs; nephrotoxicity and neurotoxicity follow.' },
  { a: 'hambat-cyp3a4', b: 'doac', berat: 'perhatian',
    judul: 'Direct oral anticoagulant exposure rises',
    sebab: 'Inhibition of CYP3A4 and P-glycoprotein raises the level of these anticoagulants, increasing bleeding risk with no routine test to detect it.' },
  { a: 'risiko-perdarahan', b: 'antikoagulan', berat: 'serius',
    judul: 'Bleeding risk adds up',
    sebab: 'Two agents acting on haemostasis by different routes. The risk is additive and is not detected by INR alone.' },
  { a: 'risiko-perdarahan', b: 'antiplatelet', berat: 'perhatian',
    judul: 'Bleeding risk adds up',
    sebab: 'Platelet function is impaired further than either agent alone would.' },
  { a: 'hipoglikemik', b: 'hipoglikemik', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Blood glucose may fall further than intended',
    sebab: 'Both lower glucose. Monitoring matters more here than the combination being forbidden.' },
  { a: 'sedatif', b: 'sedatif', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Additive sedation',
    sebab: 'Drowsiness, falls and respiratory depression are worse in combination — particularly in older people.' },
  { a: 'serotonergik', b: 'serotonergik', berat: 'serius',
    judul: 'Serotonin syndrome risk',
    sebab: 'Agitation, tremor, hyperreflexia, fever and rigidity can develop within hours. It is a clinical diagnosis and can be fatal.' },
  { a: 'qt', b: 'qt', berat: 'serius',
    judul: 'QT prolongation adds up — torsades risk',
    sebab: 'Each agent lengthens repolarisation. Electrolyte disturbance makes it worse; an ECG is the way to see it.' },
  { a: 'kalium-turun', b: 'digoksin', berat: 'serius',
    judul: 'Digoxin toxicity risk from potassium loss',
    sebab: 'Low potassium markedly increases digoxin binding and toxicity, at digoxin levels that look acceptable.' },
  { a: 'kalium-turun', b: 'kalium-turun', berat: 'perhatian',
    judul: 'Potassium may fall further',
    sebab: 'Additive potassium loss, which itself raises arrhythmia risk.' },
  { a: 'kalium-naik', b: 'kalium-naik', berat: 'serius',
    judul: 'Hyperkalaemia risk',
    sebab: 'Both retain potassium. This is a common and preventable cause of dangerous hyperkalaemia, especially with reduced kidney function.' },
  { a: 'hepatotoksik', b: 'hepatotoksik', berat: 'perhatian',
    judul: 'Additive strain on the liver',
    sebab: 'Both have been associated with liver injury. Combined use warrants awareness and, where prolonged, monitoring.' },
  { a: 'nefrotoksik', b: 'nefrotoksik', berat: 'perhatian',
    judul: 'Additive strain on the kidneys',
    sebab: 'Combined nephrotoxic exposure, worse with dehydration.' },
  { a: 'nitrat', b: 'pde5', berat: 'serius',
    judul: 'Profound hypotension — this combination is contraindicated',
    sebab: 'The fall in blood pressure can be catastrophic. This applies to products adulterated with undeclared PDE5 inhibitors as well, which is why "herbal" does not make it safe.' },
  { a: 'levodopa', b: 'levodopa', berat: 'perhatian',
    judul: 'Additive dopaminergic effect',
    sebab: 'Dyskinesia, nausea and confusion. Preparations containing levodopa vary in content, so the total dose is unpredictable.' },
  { a: 'litium', b: 'kalium-turun', berat: 'serius',
    judul: 'Lithium levels may rise',
    sebab: 'Diuretics and fluid shifts raise lithium levels into the toxic range, and lithium toxicity can cause permanent neurological damage.' },
  { a: 'hambat-cyp2c19', b: 'substrat-cyp2c19', berat: 'serius',
    judul: 'Clopidogrel may not work',
    sebab: 'Clopidogrel is a prodrug activated by CYP2C19. Inhibiting that enzyme leaves less active drug, and the loss of antiplatelet effect is invisible without testing — it shows up as a stent thrombosis or a stroke.' },
  { a: 'naikkan-warfarin', b: 'antikoagulan', berat: 'serius',
    judul: 'Warfarin effect increases sharply',
    sebab: 'A well-documented rise in INR with bleeding. If the combination is necessary, the INR needs checking within days, not at the usual interval.' },
  { a: 'antikolinergik', b: 'antikolinergik', berat: 'perhatian',
    judul: 'Anticholinergic burden adds up',
    sebab: 'Confusion, urinary retention, constipation, dry mouth and falls. In older people this is one of the commonest avoidable causes of delirium, and each drug alone looks harmless.' },
  { a: 'kolinergik', b: 'antikolinergik', berat: 'perhatian',
    judul: 'These two work against each other',
    sebab: 'One is given to raise acetylcholine and the other blocks it. The prescribed benefit is being cancelled — a common and invisible prescribing cascade.' },
  { a: 'hiperglikemik', b: 'hipoglikemik', berat: 'perhatian',
    judul: 'Glucose control will be disturbed',
    sebab: 'Corticosteroids raise blood glucose, often substantially, and the diabetes treatment usually needs adjusting up during the course and back down afterwards.' },
  /* 'perhatian', bukan 'serius': kemoterapi kombinasi memang dirancang
     menumpuk mielosupresi, dan menandainya serius berarti memperingatkan
     regimen yang justru benar. Yang diminta di sini pemantauan, bukan
     penghindaran. */
  { a: 'mielosupresi', b: 'mielosupresi', berat: 'perhatian',
    judul: 'Additive bone marrow suppression',
    sebab: 'Neutropenia, anaemia and thrombocytopenia deepen together. Blood count monitoring is the safeguard.' },
  { a: 'miopati', b: 'miopati', berat: 'serius',
    judul: 'Muscle injury risk — up to rhabdomyolysis',
    sebab: 'Statins with fibrates or colchicine raise the risk of myopathy well above either alone. Unexplained muscle pain with dark urine needs a creatine kinase, not reassurance.' },
  { a: 'xantin-oksidase', b: 'tiopurin', berat: 'serius',
    judul: 'Life-threatening marrow suppression — this pair is a classic',
    sebab: 'Allopurinol blocks the enzyme that clears azathioprine and mercaptopurine, so their levels rise several-fold. Given together at normal doses this has killed people. It requires a large dose reduction or a different urate-lowering drug.' },
  { a: 'karbapenem', b: 'valproat', berat: 'serius',
    judul: 'Valproate levels collapse — seizures may break through',
    sebab: 'Carbapenems reduce valproate concentrations quickly and substantially, and raising the valproate dose does not reliably compensate. A different antibiotic is usually the answer.' },
  { a: 'kelasi-kation', b: 'kation-polivalen', berat: 'perhatian',
    judul: 'Absorption is reduced — separate the doses',
    sebab: 'Calcium, iron, magnesium and aluminium bind these drugs in the gut so that less is absorbed. Treatment failure follows, and it looks like resistance or non-response. Separating the doses by a few hours usually solves it.' },
  { a: 'vaksin-hidup', b: 'imunosupresan', berat: 'serius',
    judul: 'Live vaccine during immunosuppression',
    sebab: 'A live attenuated organism can cause disseminated infection in someone whose immunity is suppressed. Timing relative to therapy is what makes this safe or unsafe.' },
  { a: 'hiponatremia', b: 'hiponatremia', berat: 'perhatian',
    judul: 'Sodium may fall',
    sebab: 'Both are recognised causes of hyponatraemia, and together the risk is greater — particularly in older people, where it presents as confusion or a fall rather than as anything obviously chemical.' },
  { a: 'potensiasi-nm', b: 'blokade-neuromuskular', berat: 'perhatian',
    judul: 'Neuromuscular blockade may be prolonged',
    sebab: 'Aminoglycosides potentiate neuromuscular blockers, delaying recovery of breathing after anaesthesia.' },
  { a: 'hambat-cyp3a4', b: 'miopati', berat: 'serius',
    judul: 'Statin or colchicine levels rise — muscle injury risk',
    sebab: 'Macrolides, azole antifungals and some calcium channel blockers block the enzyme that clears simvastatin, atorvastatin and colchicine. Rhabdomyolysis and fatal colchicine toxicity have both occurred this way, and the usual answer is to pause the statin for the antibiotic course.' },
  { a: 'kardiotoksik', b: 'kardiotoksik', berat: 'serius',
    judul: 'Additive cardiac toxicity',
    sebab: 'Anthracyclines and trastuzumab both damage myocardium, and together the fall in ejection fraction is greater. Cardiac function is monitored, not assumed.' },
  { a: 'ototoksik', b: 'ototoksik', berat: 'perhatian',
    judul: 'Additive hearing and balance damage',
    sebab: 'Aminoglycosides, platinum agents, vancomycin and loop diuretics are each ototoxic, and the damage is usually permanent. Rapid infusion and dehydration make it worse.' },
  { a: 'hambat-sekresi-tubular', b: 'metotreksat', berat: 'serius',
    judul: 'Methotrexate clearance falls — toxicity risk',
    sebab: 'NSAIDs, penicillins, probenecid and proton pump inhibitors compete with methotrexate for renal tubular secretion. Levels rise, and marrow and mucosal toxicity follow. This has killed patients on weekly low-dose methotrexate.' },
  { a: 'bradikardik', b: 'bradikardik', berat: 'serius',
    judul: 'Bradycardia and heart block risk',
    sebab: 'Beta blockers with verapamil or diltiazem, or either with digoxin or amiodarone, can slow conduction to the point of arrest. The intravenous combination is the most dangerous.' },
  { a: 'opioid', b: 'benzodiazepin', berat: 'serius',
    judul: 'Respiratory depression — a leading cause of overdose death',
    sebab: 'Each depresses breathing by a different route and together the effect is more than additive. This combination carries a boxed warning in most countries. Where it is unavoidable, doses are kept low and naloxone is made available.' },
  { a: 'nsaid', b: 'raas', berat: 'perhatian',
    judul: 'Acute kidney injury risk',
    sebab: 'NSAIDs constrict the afferent arteriole while ACE inhibitors and ARBs dilate the efferent one, so filtration pressure falls from both sides. Add a diuretic and this is the classic triple whammy — a common, preventable cause of admission.' },
  { a: 'imunosupresan', b: 'imunosupresan', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Immune effects may oppose or add to each other',
    sebab: 'Herbal immunostimulants can oppose prescribed immunosuppression; the direction is not always predictable.' },
  { a: 'antihipertensi', b: 'antihipertensi', berat: 'perhatian', hanyaHerbal: true,
    judul: 'Blood pressure may fall further than intended',
    sebab: 'Additive lowering. Dizziness and falls are the practical consequence.' },
]

export interface Butir {
  id: string
  nama: string
  jenis: 'obat' | 'herbal'
  tanda: Tanda[]
  keterangan: string
}

/** Semua yang bisa dipilih, obat dan herbal sekaligus. */
export function semuaButir(): Butir[] {
  const obat: Butir[] = semuaObat().map((x) => {
    const dariKelas = TANDA_KELAS.filter((t) => t.cocok.test(x.kelas)).flatMap((t) => t.tanda)
    const tanda = [...new Set([...dariKelas, ...(TANDA_ZAT[x.nama] ?? [])])]
    return { id: `o:${x.nama}`, nama: x.nama, jenis: 'obat', tanda, keterangan: x.kelas }
  })
  const herbal: Butir[] = semuaHerbal().map((h) => ({
    id: `h:${h.latin}`,
    nama: h.nama + (h.lokal ? ` · ${h.lokal}` : ''),
    jenis: 'herbal',
    tanda: TANDA_HERBAL[h.latin] ?? [],
    keterangan: h.latin,
  }))
  return [...obat, ...herbal]
}

export interface Temuan {
  a: Butir
  b: Butir
  berat: Berat
  judul: string
  sebab: string
}

/**
 * Silangkan daftarnya.
 *
 * Tiap pasangan diperiksa terhadap seluruh aturan; satu pasangan dapat
 * memunculkan lebih dari satu temuan, dan itu memang benar — dua obat bisa
 * bertemu lewat lebih dari satu jalan sekaligus.
 */
export function periksa(butir: Butir[]): Temuan[] {
  const hasil: Temuan[] = []
  for (let i = 0; i < butir.length; i++) {
    for (let j = i + 1; j < butir.length; j++) {
      const x = butir[i]
      const y = butir[j]
      const adaHerbal = x.jenis === 'herbal' || y.jenis === 'herbal'
      for (const r of ATURAN) {
        if (r.hanyaHerbal && !adaHerbal) continue
        const cocok =
          (x.tanda.includes(r.a) && y.tanda.includes(r.b)) ||
          (x.tanda.includes(r.b) && y.tanda.includes(r.a))
        if (!cocok) continue
        if (hasil.some((h) => h.judul === r.judul && ((h.a === x && h.b === y) || (h.a === y && h.b === x)))) continue
        hasil.push({ a: x, b: y, berat: r.berat, judul: r.judul, sebab: r.sebab })
      }
    }
  }
  // Yang serius lebih dahulu. Urutan pada layar peringatan adalah bagian dari
  // peringatannya sendiri.
  return hasil.sort((p, q) => (p.berat === q.berat ? 0 : p.berat === 'serius' ? -1 : 1))
}

export default periksa
