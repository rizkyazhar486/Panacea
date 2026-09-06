import { SKDI_DISEASE_LIST, type SkdiDiseaseSystem } from './skdiDiseaseList'
import { SKDI_DISEASE_NOTES, type SkdiDiseaseNote } from './skdiDiseaseNotes'
import { semuaObat, dosisSkdi } from './obatKatalog'

// ─────────────────────────────────────────────────────────────────────────────
// Ketuk satu organ pada figur 3D -> penyakitnya dan obatnya langsung terbuka.
//
// INI BUKAN KOTAK PENCARIAN. Tidak ada yang perlu diketik: struktur yang
// disentuh sudah menentukan apa yang ditampilkan. Kotak cari menuntut orang
// SUDAH tahu nama apa yang dicari — padahal yang sedang dipelajari justru
// nama-nama itu.
//
// SUMBER ISINYA ADALAH CATATAN YANG SUDAH ADA DI REPO INI, bukan korpus baru:
//   - skdiDiseaseList.ts  : daftar resmi SKDI 2012 + level kompetensinya.
//   - skdiDiseaseNotes.ts : ~26.000 baris catatan klinis yang sudah ditulis
//                           (definisi, patofisiologi, gold standard, dst).
//   - obatKatalog.ts      : zat aktif + golongan + indikasinya.
// Yang baru di berkas ini HANYA PEMETAANNYA: organ mana memuat penyakit yang
// mana. Menulis ulang isinya berarti membuat korpus kedua yang akan
// bercabang diam-diam dari yang pertama.
//
// CARA PEMETAANNYA, dan kenapa dua lapis. Sistem SKDI terlalu kasar sendirian:
// "Gastrointestinal & Hepatobilier" memuat penyakit hati, lambung, usus, dan
// empedu sekaligus, sedangkan yang diketuk orang adalah SATU organ. Jadi tiap
// organ membawa (1) sistem SKDI-nya sebagai penyaring kasar, lalu (2) kata
// kunci nama penyakit sebagai penyaring halus. Penyakit yang tidak lolos
// keduanya tidak ditampilkan — lebih baik daftarnya pendek dan benar.
// ─────────────────────────────────────────────────────────────────────────────

/** Tingkat kedalaman pembaca. Menentukan BERAPA BANYAK yang ditampilkan dari
 *  catatan yang sama — bukan menampilkan isi yang berbeda-beda. */
export type Audience = 'awam' | 'student' | 'professional' | 'specialist'

export const AUDIENCES: Array<{ key: Audience; label: string; hint: string }> = [
  { key: 'awam', label: 'Public', hint: 'Plain language — what it is and what to do' },
  { key: 'student', label: 'Student', hint: 'Definition, diagnosis, management — exam level' },
  { key: 'professional', label: 'Professional', hint: 'Mechanism, gold standard, differentials, prognosis, sources' },
  { key: 'specialist', label: 'Specialist', hint: 'Full workup, supportive care, complications, live literature' },
]

export interface OrganPenyakit {
  nama: string
  system: SkdiDiseaseSystem
  /** Level kompetensi SKDI (1, 2, 3A, 3B, 4A) — 4A = harus tuntas ditangani. */
  level: string
  subsection: string | null
  /** Catatan klinisnya kalau sudah ditulis. Tidak semua nama punya catatan. */
  note?: SkdiDiseaseNote
}

export interface OrganObat {
  nama: string
  kelas: string
  untuk: string
  eml?: boolean
  catatan?: string
  /** Kelompok ATC-nya menurut katalog — huruf pertamanya kelompok anatomi. */
  golongan: string
  /** Dosis dari korpus SKDI kalau ada. Kosong berarti memang tidak ada, dan
   *  dikosongkan; tidak pernah ditebak. */
  dosis: Array<{ keluhan: string; golongan: string; dosis: string }>
}

interface PetaOrgan {
  /** Sistem SKDI yang memuat organ ini. */
  systems: SkdiDiseaseSystem[]
  /** Penyaring halus: nama penyakit HARUS memuat salah satu kata ini. Kalau
   *  kosong, seluruh isi sistemnya dipakai (benar untuk organ yang memang
   *  identik dengan sistemnya, mis. jantung terhadap Kardiovaskular). */
  kata?: string[]
  /** Kata kunci untuk memilih obat dari katalog — dicocokkan ke kelas & indikasi. */
  obat: string[]
}

const PETA: Record<string, PetaOrgan> = {
  heart: { systems: ['Kardiovaskular'], obat: ['jantung', 'antihipertensi', 'antiaritmia', 'gagal jantung', 'angina', 'beta', 'ace', 'diuretik'] },
  lungs: { systems: ['Respirasi'], obat: ['asma', 'ppok', 'bronko', 'paru', 'batuk', 'tuberkulosis'] },
  liver: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['hepat', 'hati', 'sirosis', 'ikterus', 'kolestasis', 'abses hati'], obat: ['hepatitis', 'sirosis', 'ensefalopati hepatik', 'hepatoprotektor'] },
  stomach: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['gaster', 'lambung', 'gastritis', 'ulkus', 'dispepsia', 'refluks', 'gerd', 'esofag'], obat: ['lambung', 'asam lambung', 'antasida', 'ulkus'] },
  'small-intestine': { systems: ['Gastrointestinal & Hepatobilier'], kata: ['duoden', 'usus halus', 'malabsorpsi', 'celiac', 'cacing', 'ileus', 'intoleransi'], obat: ['cacing', 'diare'] },
  'large-intestine': { systems: ['Gastrointestinal & Hepatobilier'], kata: ['kolon', 'usus besar', 'kolitis', 'disentri', 'diare', 'konstipasi', 'hemoroid', 'apendis', 'rektum', 'irritable'], obat: ['diare', 'konstipasi', 'laksatif'] },
  pancreas: { systems: ['Gastrointestinal & Hepatobilier', 'Endokrin & Metabolik'], kata: ['pankrea', 'diabetes'], obat: ['diabetes', 'insulin', 'glikemik'] },
  gallbladder: { systems: ['Gastrointestinal & Hepatobilier'], kata: ['kolesist', 'empedu', 'kolelitiasis', 'koledok', 'kolangitis'], obat: ['empedu'] },
  kidneys: { systems: ['Ginjal & Saluran Kemih'], kata: ['ginjal', 'nefr', 'glomerul', 'renal', 'pielonefritis', 'batu'], obat: ['ginjal', 'diuretik'] },
  bladder: { systems: ['Ginjal & Saluran Kemih'], kata: ['kandung kemih', 'sistitis', 'uretr', 'inkontinensia', 'kemih'], obat: ['saluran kemih', 'infeksi kemih'] },
  breast: {
    systems: ['Reproduksi & Obstetri'],
    kata: ['payudara', 'mammae', 'mastitis', 'nipple', 'filoides', 'paget', 'ginekomastia', 'fibrokista'],
    obat: ['payudara', 'mastitis'],
  },
  prostate: { systems: ['Ginjal & Saluran Kemih', 'Reproduksi & Obstetri'], kata: ['prostat'], obat: ['prostat'] },
  testis: { systems: ['Reproduksi & Obstetri'], kata: ['testis', 'skrotum', 'varikokel', 'hidrokel', 'epididim', 'torsio'], obat: [] },
  spleen: { systems: ['Hematologi & Imunologi'], kata: ['limpa', 'splen', 'anemia', 'talasemia', 'hemolitik'], obat: ['anemia', 'besi'] },
  'lymph-nodes': { systems: ['Hematologi & Imunologi'], obat: ['imun', 'alergi', 'kortikosteroid'] },
  thyroid: { systems: ['Endokrin & Metabolik'], kata: ['tiroid', 'gondok', 'struma', 'hipertiroid', 'hipotiroid'], obat: ['tiroid'] },
  adrenal: { systems: ['Endokrin & Metabolik'], kata: ['adrenal', 'cushing', 'addison', 'kortisol'], obat: ['kortikosteroid'] },
  pituitary: { systems: ['Endokrin & Metabolik'], kata: ['hipofisis', 'pituitari', 'akromegali', 'prolaktin', 'diabetes insipidus'], obat: [] },
  brain: { systems: ['Saraf (Neurologi)', 'Psikiatri'], obat: ['epilepsi', 'kejang', 'nyeri kepala', 'depresi', 'ansietas', 'psikosis', 'antipsikotik', 'antidepresan'] },
  'spinal-cord': { systems: ['Saraf (Neurologi)'], kata: ['medula spinalis', 'mielitis', 'spina', 'radikulopati', 'hernia nukleus', 'saraf tepi', 'neuropati'], obat: ['nyeri neuropatik'] },
  eye: { systems: ['Indera'], kata: ['mata', 'konjungtiv', 'katarak', 'glaukoma', 'retina', 'kornea', 'uveitis', 'hordeolum', 'refraksi', 'miopia', 'buta'], obat: ['mata'] },
  ear: { systems: ['Indera'], kata: ['telinga', 'otitis', 'tuli', 'serumen', 'vertigo', 'tinitus', 'mastoid'], obat: ['telinga'] },
  'external-ear': { systems: ['Indera'], kata: ['telinga', 'otitis eksterna', 'serumen'], obat: [] },
  'external-nose': { systems: ['Indera', 'Respirasi'], kata: ['hidung', 'rinitis', 'sinusitis', 'epistaksis', 'polip'], obat: ['hidung', 'alergi'] },
  larynx: { systems: ['Respirasi', 'Indera'], kata: ['laring', 'faring', 'tonsil', 'suara', 'epiglot', 'trakea'], obat: ['batuk'] },
}

/** Level SKDI 4A lebih dulu — itu yang wajib dituntaskan sendiri oleh dokter
 *  umum, jadi paling sering dipakai; sisanya menyusul menurun. */
const URUTAN_LEVEL: Record<string, number> = { '4A': 0, '4': 0, '3B': 1, '3A': 2, '2': 3, '1': 4 }

export interface OrganClinical {
  penyakit: OrganPenyakit[]
  obat: OrganObat[]
  /** true kalau organ ini memang belum punya pemetaan sama sekali. */
  belumDipetakan: boolean
}

export function clinicalForOrgan(organKey: string): OrganClinical {
  const peta = PETA[organKey]
  if (!peta) return { penyakit: [], obat: [], belumDipetakan: true }

  const kata = peta.kata?.map((k) => k.toLowerCase())
  const penyakit: OrganPenyakit[] = []
  for (const e of SKDI_DISEASE_LIST) {
    if (!peta.systems.includes(e.system)) continue
    if (kata && !kata.some((k) => e.disease.toLowerCase().includes(k))) continue
    penyakit.push({
      nama: e.disease,
      system: e.system,
      level: e.level,
      subsection: e.subsection,
      note: SKDI_DISEASE_NOTES[e.disease],
    })
  }
  penyakit.sort((a, b) => {
    // Yang sudah punya catatan klinis didahulukan: entri tanpa catatan hanya
    // menyumbang nama, dan nama saja tidak mengajarkan apa pun.
    const ca = a.note ? 0 : 1
    const cb = b.note ? 0 : 1
    if (ca !== cb) return ca - cb
    const la = URUTAN_LEVEL[a.level] ?? 9
    const lb = URUTAN_LEVEL[b.level] ?? 9
    if (la !== lb) return la - lb
    return a.nama.localeCompare(b.nama)
  })

  const kataObat = peta.obat.map((k) => k.toLowerCase())
  const obat: OrganObat[] = []
  if (kataObat.length) {
    for (const o of semuaObat()) {
      // Sengaja HANYA kelas & indikasi. Menyertakan teks golongan/kelompok ATC
      // membuat satu penyebutan organ di judul kelompok menyeret seluruh isi
      // kelompok itu — yang memunculkan atracurium dan dietilkarbamazin di
      // bawah "hati" hanya karena keterangannya menyinggung gagal hati.
      const teks = `${o.kelas} ${o.untuk}`.toLowerCase()
      if (!kataObat.some((k) => teks.includes(k))) continue
      obat.push({
        nama: o.nama, kelas: o.kelas, untuk: o.untuk, eml: o.eml, catatan: o.catatan,
        golongan: o.golongan,
        dosis: dosisSkdi(o.nama),
      })
    }
    // Obat esensial WHO lebih dulu — itu daftar yang paling mungkin benar-benar
    // dipakai, dan paling layak dihafal.
    obat.sort((a, b) => (a.eml === b.eml ? a.nama.localeCompare(b.nama) : a.eml ? -1 : 1))
  }

  return { penyakit, obat, belumDipetakan: false }
}

// Pemeriksaan penunjang yang benar-benar dipakai untuk organ ini. Bukan daftar
// semua tes yang ada, melainkan yang MENGUBAH penatalaksanaan — daftar panjang
// tanpa indikasi justru mengajarkan kebiasaan yang salah.
export interface LabOrgan { nama: string; untuk: string }

const LAB_ORGAN: Record<string, LabOrgan[]> = {
  breast: [
    { nama: 'Triple assessment', untuk: 'Clinical examination, imaging and needle biopsy together — no one leg of it is enough alone' },
    { nama: 'Ultrasound', untuk: 'First imaging under 40 and in pregnancy; distinguishes cyst from solid mass' },
    { nama: 'Mammography', untuk: 'First imaging over 40 and for screening; poor in dense young breast tissue' },
    { nama: 'Core needle biopsy', untuk: 'Gives histology, grade and receptor status — fine-needle aspiration cannot' },
    { nama: 'ER, PR and HER2', untuk: 'Decides endocrine and anti-HER2 therapy; the single most treatment-changing result' },
  ],
  heart: [
    { nama: 'ECG (12-lead)', untuk: 'Rhythm, ischaemia, chamber enlargement — first test in almost any cardiac complaint' },
    { nama: 'Troponin I/T', untuk: 'Myocardial injury. Interpret the RISE AND FALL, never a single value' },
    { nama: 'NT-proBNP', untuk: 'Ventricular wall stress — a normal value largely excludes heart failure' },
    { nama: 'Echocardiography', untuk: 'Ejection fraction, valves, wall motion, pericardial fluid' },
    { nama: 'Lipid profile', untuk: 'Cardiovascular risk, and the target of statin therapy' },
  ],
  lungs: [
    { nama: 'Chest X-ray', untuk: 'Consolidation, effusion, pneumothorax, heart size' },
    { nama: 'Blood gas analysis', untuk: 'Oxygenation, ventilation and acid–base state together' },
    { nama: 'Spirometry', untuk: 'Obstructive versus restrictive pattern; reversibility in asthma' },
    { nama: 'Sputum AFB / GeneXpert', untuk: 'Tuberculosis — mandatory for a cough beyond two weeks' },
    { nama: 'D-dimer', untuk: 'Only useful to EXCLUDE embolism in low-probability patients' },
  ],
  kidneys: [
    { nama: 'Urea, creatinine & eGFR', untuk: 'Filtration function — but creatinine lags injury by ~48 hours' },
    { nama: 'Urinalysis', untuk: 'Protein, blood, casts — the cheapest window on the nephron' },
    { nama: 'Urine protein/creatinine ratio', untuk: 'Quantifies proteinuria without a 24-hour collection' },
    { nama: 'Serum electrolytes', untuk: 'Potassium first — it is what kills before uraemia does' },
    { nama: 'Renal ultrasound', untuk: 'Size, obstruction, cysts. Small kidneys mean chronic, not acute' },
  ],
  liver: [
    { nama: 'ALT & AST', untuk: 'Hepatocellular injury' },
    { nama: 'ALP & GGT', untuk: 'Cholestatic pattern — GGT confirms ALP is hepatic, not bone' },
    { nama: 'Bilirubin (total & direct)', untuk: 'Separates unconjugated from conjugated jaundice' },
    { nama: 'Albumin & INR', untuk: 'Synthetic FUNCTION — the enzymes measure damage, these measure capacity' },
    { nama: 'Hepatitis B & C serology', untuk: 'The commonest treatable causes of chronic liver disease' },
  ],
  thyroid: [
    { nama: 'TSH', untuk: 'The single best first test — it moves before free T4 does' },
    { nama: 'Free T4', untuk: 'Confirms and grades the abnormality TSH has flagged' },
    { nama: 'Anti-TPO antibody', untuk: 'Autoimmune thyroiditis' },
    { nama: 'Thyroid ultrasound', untuk: 'Nodules and their features; guides fine-needle aspiration' },
  ],
  pancreas: [
    { nama: 'Fasting glucose & HbA1c', untuk: 'Diagnosis and 3-month control of diabetes' },
    { nama: 'Serum lipase', untuk: 'More specific than amylase for acute pancreatitis' },
    { nama: 'Abdominal CT with contrast', untuk: 'Necrosis and complications, best after 72 hours' },
  ],
  stomach: [
    { nama: 'Upper endoscopy', untuk: 'Direct view plus biopsy — the definitive test' },
    { nama: 'H. pylori urea breath test', untuk: 'Active infection; stop PPI two weeks beforehand or it reads falsely negative' },
    { nama: 'Full blood count', untuk: 'Iron-deficiency anaemia from occult bleeding' },
  ],
  brain: [
    { nama: 'Non-contrast head CT', untuk: 'First in acute deficit — excludes haemorrhage before thrombolysis' },
    { nama: 'Brain MRI', untuk: 'Far better for early infarct, posterior fossa, tumour and demyelination' },
    { nama: 'Lumbar puncture', untuk: 'Meningitis, subarachnoid haemorrhage with a normal CT' },
    { nama: 'EEG', untuk: 'Seizure classification, not seizure exclusion' },
  ],
  eye: [
    { nama: 'Visual acuity', untuk: 'The vital sign of the eye — record before anything else' },
    { nama: 'Intraocular pressure', untuk: 'Glaucoma screening and acute angle closure' },
    { nama: 'Fundoscopy', untuk: 'Retina, disc and vessels — also a direct view of systemic vascular disease' },
    { nama: 'Slit-lamp examination', untuk: 'Anterior segment: cornea, chamber, lens' },
  ],
  ear: [
    { nama: 'Otoscopy', untuk: 'Canal, drum, and middle-ear effusion' },
    { nama: 'Rinne & Weber tests', untuk: 'Separates conductive from sensorineural loss at the bedside' },
    { nama: 'Pure-tone audiometry', untuk: 'Quantifies and characterises the loss' },
    { nama: 'Tympanometry', untuk: 'Middle-ear pressure and drum compliance' },
  ],
  bladder: [
    { nama: 'Urinalysis & culture', untuk: 'Infection and the organism with its sensitivities' },
    { nama: 'Post-void residual (ultrasound)', untuk: 'Retention and outlet obstruction' },
    { nama: 'Cystoscopy', untuk: 'Painless visible haematuria until proven otherwise' },
  ],
  prostate: [
    { nama: 'PSA', untuk: 'Raised in cancer, but also in BPH, infection and after examination' },
    { nama: 'Digital rectal examination', untuk: 'Size, symmetry and consistency' },
    { nama: 'IPSS symptom score', untuk: 'Grades severity and tracks response to treatment' },
  ],
  spleen: [
    { nama: 'Full blood count with film', untuk: 'The film shows what the count cannot' },
    { nama: 'Reticulocyte count', untuk: 'Separates marrow failure from peripheral destruction' },
    { nama: 'Abdominal ultrasound', untuk: 'Splenomegaly and portal hypertension' },
  ],
  'large-intestine': [
    { nama: 'Faecal occult blood / FIT', untuk: 'Colorectal cancer screening' },
    { nama: 'Colonoscopy', untuk: 'Diagnostic and therapeutic in one procedure' },
    { nama: 'Faecal calprotectin', untuk: 'Separates inflammatory bowel disease from irritable bowel syndrome' },
    { nama: 'Stool culture & microscopy', untuk: 'Infective diarrhoea, parasites, C. difficile toxin' },
    { nama: 'Rectal suction biopsy', untuk: 'Absent ganglion cells confirm Hirschsprung disease' },
  ],
  adrenal: [
    { nama: 'Morning cortisol', untuk: 'Screens adrenal insufficiency — must be drawn early, when it should be highest' },
    { nama: 'Short Synacthen test', untuk: 'The definitive test: does the gland respond to ACTH at all' },
    { nama: 'Plasma ACTH', untuk: 'Separates primary (adrenal, ACTH high) from secondary (pituitary, ACTH low)' },
    { nama: 'Aldosterone/renin ratio', untuk: 'Primary hyperaldosteronism — a curable cause of hypertension that is routinely missed' },
    { nama: '17-hydroxyprogesterone', untuk: 'Congenital adrenal hyperplasia; part of newborn screening' },
  ],
  pituitary: [
    { nama: 'Pituitary hormone panel', untuk: 'TSH, ACTH, LH, FSH, GH, prolactin — the axis fails in a predictable order' },
    { nama: 'Prolactin', untuk: 'Prolactinoma, but also raised by stalk compression from any mass' },
    { nama: 'IGF-1', untuk: 'A stable proxy for growth hormone, which is too pulsatile to measure directly' },
    { nama: 'Pituitary MRI', untuk: 'Adenoma, stalk and the relation to the optic chiasm' },
    { nama: 'Formal visual fields', untuk: 'Bitemporal loss appears before the patient notices it' },
  ],
  gallbladder: [
    { nama: 'Abdominal ultrasound', untuk: 'First test for stones, wall thickening and duct dilatation' },
    { nama: 'Liver function tests', untuk: 'A cholestatic pattern points to duct obstruction, not the gallbladder alone' },
    { nama: 'MRCP', untuk: 'Non-invasive imaging of the biliary tree when a duct stone is suspected' },
  ],
  'small-intestine': [
    { nama: 'Coeliac serology (tTG-IgA)', untuk: 'Must be taken while still eating gluten, or it reads falsely negative' },
    { nama: 'Faecal elastase', untuk: 'Separates pancreatic insufficiency from mucosal malabsorption' },
    { nama: 'Small bowel imaging (MR enterography)', untuk: 'Crohn disease, strictures and fistulae' },
    { nama: 'Technetium-99m scan', untuk: 'Finds ectopic gastric mucosa in a Meckel diverticulum' },
  ],
  testis: [
    { nama: 'Scrotal ultrasound with Doppler', untuk: 'Mass, hydrocele, varicocele — and blood flow in suspected torsion' },
    { nama: 'Tumour markers (AFP, β-hCG, LDH)', untuk: 'Germ cell tumours; drawn BEFORE orchidectomy so they can be interpreted' },
    { nama: 'Morning testosterone, LH & FSH', untuk: 'Separates testicular failure from a pituitary cause' },
    { nama: 'Semen analysis', untuk: 'Count, motility and morphology in infertility' },
  ],
  'spinal-cord': [
    { nama: 'MRI whole spine', untuk: 'Compression, myelitis, syrinx, tethering — the only test that shows the cord itself' },
    { nama: 'Neurological examination by level', untuk: 'Localises the lesion before any scan is ordered' },
    { nama: 'Bladder scan / post-void residual', untuk: 'Retention is often the earliest sign of cord compression' },
    { nama: 'Lumbar puncture', untuk: 'Inflammatory and infective causes — only after imaging excludes a block' },
  ],
  'peripheral-nerves': [
    { nama: 'Nerve conduction studies & EMG', untuk: 'Separates axonal from demyelinating disease, and nerve from muscle' },
    { nama: 'HbA1c and B12', untuk: 'The two commonest treatable causes of a peripheral neuropathy' },
    { nama: 'Nerve ultrasound or MRI', untuk: 'Entrapment, tumour, or a nerve sheath lesion' },
  ],
  skeleton: [
    { nama: 'Plain radiograph', untuk: 'Fracture, alignment, bone quality — still the first test in most bone complaints' },
    { nama: 'DXA bone density', untuk: 'Osteoporosis, and the T-score that guides treatment' },
    { nama: 'Calcium, phosphate, ALP, vitamin D, PTH', untuk: 'The metabolic panel behind most non-traumatic bone disease' },
    { nama: 'Skeletal survey', untuk: 'Multiple fractures of differing ages — non-accidental injury or osteogenesis imperfecta' },
  ],
  skin: [
    { nama: 'Dermoscopy', untuk: 'Raises accuracy for melanoma well above the naked eye' },
    { nama: 'Skin biopsy', untuk: 'Punch or excision — the definitive test for most rashes and all suspicious lesions' },
    { nama: 'Skin scraping / KOH', untuk: 'Fungal infection, which is frequently treated as eczema instead' },
    { nama: 'Patch testing', untuk: 'Allergic contact dermatitis — distinct from irritant, and managed differently' },
  ],
  larynx: [
    { nama: 'Flexible nasolaryngoscopy', untuk: 'Direct view of the cords and their movement' },
    { nama: 'Stroboscopy', untuk: 'Shows the mucosal wave, which ordinary light cannot' },
    { nama: 'CT neck and chest', untuk: 'Hoarseness with a normal larynx — the recurrent laryngeal nerve runs through the chest' },
  ],
  pharynx: [
    { nama: 'Throat swab / rapid strep test', untuk: 'Group A streptococcus, applied with Centor criteria rather than to everyone' },
    { nama: 'Flexible nasendoscopy', untuk: 'Persistent unilateral symptoms, or a neck lump with no obvious source' },
    { nama: 'Videofluoroscopic swallow', untuk: 'Aspiration and swallow safety after stroke or bulbar disease' },
  ],
  'external-nose': [
    { nama: 'Anterior rhinoscopy', untuk: 'Septum, turbinates, polyps and the bleeding point' },
    { nama: 'Nasendoscopy', untuk: 'Posterior bleeding and the postnasal space' },
    { nama: 'CT sinuses', untuk: 'Chronic rhinosinusitis and anatomy before surgery' },
    { nama: 'Allergy testing', untuk: 'Skin prick or specific IgE where allergic rhinitis is suspected' },
  ],
  'nasal-septum': [
    { nama: 'Anterior rhinoscopy', untuk: 'Deviation, spurs, perforation and Kiesselbach plexus' },
    { nama: 'Peak nasal inspiratory flow', untuk: 'Measures obstruction rather than assuming it from appearance' },
    { nama: 'CT sinuses', untuk: 'Bony anatomy before septal surgery' },
  ],
  'external-ear': [
    { nama: 'Otoscopy', untuk: 'Canal, wax, discharge and the drum beyond it' },
    { nama: 'Ear swab', untuk: 'Otitis externa that fails first-line treatment — pseudomonas and fungi' },
  ],
  eardrum: [
    { nama: 'Otoscopy', untuk: 'Perforation, effusion, retraction and cholesteatoma' },
    { nama: 'Tympanometry', untuk: 'Middle-ear pressure and drum compliance — detects effusion a normal-looking drum hides' },
    { nama: 'Pure-tone audiometry', untuk: 'Quantifies the conductive loss an abnormal drum produces' },
  ],
  ossicles: [
    { nama: 'Rinne & Weber tests', untuk: 'Separates conductive from sensorineural loss at the bedside, before any machine' },
    { nama: 'Pure-tone audiometry', untuk: 'The air-bone gap is the measurement that defines ossicular disease' },
    { nama: 'CT temporal bone', untuk: 'Ossicular chain integrity, fixation and erosion' },
  ],
  'inner-ear-nerve': [
    { nama: 'Pure-tone audiometry', untuk: 'Asymmetry is the finding that triggers everything else' },
    { nama: 'MRI internal auditory meatus', untuk: 'Vestibular schwannoma — the reason asymmetric loss is imaged' },
    { nama: 'Head impulse test & Dix-Hallpike', untuk: 'Separates peripheral from central vertigo at the bedside' },
    { nama: 'Auditory brainstem response', untuk: 'Newborn screening, and hearing in those who cannot respond' },
  ],
  'optic-pathway': [
    { nama: 'Formal visual fields (perimetry)', untuk: 'The pattern localises the lesion along the pathway' },
    { nama: 'Relative afferent pupillary defect', untuk: 'A bedside sign that localises to the nerve rather than the retina' },
    { nama: 'Optical coherence tomography', untuk: 'Retinal nerve fibre layer thinning, which precedes visible pallor' },
    { nama: 'MRI orbits and brain', untuk: 'Optic neuritis, compression, and demyelination elsewhere' },
  ],
  'lymph-nodes': [
    { nama: 'Full blood count with film', untuk: 'The film shows what the count cannot' },
    { nama: 'Lymph node ultrasound', untuk: 'Shape, hilum and vascularity separate reactive from malignant' },
    { nama: 'Excision biopsy', untuk: 'Preferred over fine-needle aspiration in lymphoma — architecture is the diagnosis' },
    { nama: 'LDH', untuk: 'Reflects tumour burden and prognosis in lymphoma' },
  ],
}

export function labsForOrgan(organKey: string): LabOrgan[] {
  return LAB_ORGAN[organKey] ?? []
}

/** Organ yang sudah punya pemetaan — dipakai layar untuk menandai mana yang
 *  akan langsung membuka isi klinis saat diketuk. */
export function organsWithClinical(): string[] {
  return Object.keys(PETA)
}
