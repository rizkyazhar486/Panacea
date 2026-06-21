// ICD diagnosis catalogue for the AI-EMR Assessment (Diagnosis Utama).
//
// Codes follow ICD-10 (the standard used by SATUSEHAT/BPJS in Indonesia); the
// ICD-11 successor is noted in comments where relevant. This is a curated,
// frequently-used subset across primary care, internal medicine, emergency,
// pediatrics, ob-gyn, surgery, psychiatry & infectious disease — searchable by
// code or Indonesian/English term.
export interface ICDCode {
  code: string // ICD-10 code
  id: string // Indonesian name
  en: string // English name
  chapter: string // body-system / category grouping
}

export const ICD_CODES: ICDCode[] = [
  // Infeksi & penyakit menular
  { code: 'A09', id: 'Diare & gastroenteritis (dugaan infeksi)', en: 'Diarrhoea & gastroenteritis', chapter: 'Infeksi' },
  { code: 'A15', id: 'Tuberkulosis paru', en: 'Respiratory tuberculosis', chapter: 'Infeksi' },
  { code: 'A90', id: 'Demam dengue', en: 'Dengue fever', chapter: 'Infeksi' },
  { code: 'A91', id: 'Demam berdarah dengue (DBD)', en: 'Dengue haemorrhagic fever', chapter: 'Infeksi' },
  { code: 'A01.0', id: 'Demam tifoid', en: 'Typhoid fever', chapter: 'Infeksi' },
  { code: 'B50', id: 'Malaria falciparum', en: 'Plasmodium falciparum malaria', chapter: 'Infeksi' },
  { code: 'B34.2', id: 'Infeksi coronavirus (COVID-19)', en: 'Coronavirus infection', chapter: 'Infeksi' },
  { code: 'B20', id: 'Penyakit HIV', en: 'HIV disease', chapter: 'Infeksi' },
  { code: 'B19', id: 'Hepatitis virus', en: 'Viral hepatitis', chapter: 'Infeksi' },
  { code: 'A46', id: 'Erisipelas/selulitis', en: 'Erysipelas', chapter: 'Infeksi' },
  // Pernapasan
  { code: 'J00', id: 'Nasofaringitis akut (common cold)', en: 'Acute nasopharyngitis', chapter: 'Pernapasan' },
  { code: 'J02.9', id: 'Faringitis akut', en: 'Acute pharyngitis', chapter: 'Pernapasan' },
  { code: 'J03.9', id: 'Tonsilitis akut', en: 'Acute tonsillitis', chapter: 'Pernapasan' },
  { code: 'J06.9', id: 'ISPA akut', en: 'Acute upper respiratory infection', chapter: 'Pernapasan' },
  { code: 'J18.9', id: 'Pneumonia', en: 'Pneumonia, unspecified', chapter: 'Pernapasan' },
  { code: 'J45.9', id: 'Asma', en: 'Asthma', chapter: 'Pernapasan' },
  { code: 'J44.9', id: 'PPOK (COPD)', en: 'Chronic obstructive pulmonary disease', chapter: 'Pernapasan' },
  { code: 'J20.9', id: 'Bronkitis akut', en: 'Acute bronchitis', chapter: 'Pernapasan' },
  { code: 'J30.4', id: 'Rinitis alergi', en: 'Allergic rhinitis', chapter: 'Pernapasan' },
  { code: 'J01.9', id: 'Sinusitis akut', en: 'Acute sinusitis', chapter: 'Pernapasan' },
  // Kardiovaskular
  { code: 'I10', id: 'Hipertensi esensial (primer)', en: 'Essential hypertension', chapter: 'Kardiovaskular' },
  { code: 'I20.0', id: 'Angina tidak stabil', en: 'Unstable angina', chapter: 'Kardiovaskular' },
  { code: 'I21.9', id: 'Infark miokard akut (serangan jantung)', en: 'Acute myocardial infarction', chapter: 'Kardiovaskular' },
  { code: 'I25.1', id: 'Penyakit jantung koroner', en: 'Atherosclerotic heart disease', chapter: 'Kardiovaskular' },
  { code: 'I50.9', id: 'Gagal jantung', en: 'Heart failure', chapter: 'Kardiovaskular' },
  { code: 'I48', id: 'Fibrilasi & flutter atrium', en: 'Atrial fibrillation and flutter', chapter: 'Kardiovaskular' },
  { code: 'I63.9', id: 'Stroke iskemik (infark serebral)', en: 'Cerebral infarction', chapter: 'Kardiovaskular' },
  { code: 'I64', id: 'Stroke (tidak ditentukan perdarahan/infark)', en: 'Stroke, not specified', chapter: 'Kardiovaskular' },
  { code: 'I83.9', id: 'Varises tungkai', en: 'Varicose veins of lower extremities', chapter: 'Kardiovaskular' },
  // Endokrin & metabolik
  { code: 'E11.9', id: 'Diabetes melitus tipe 2', en: 'Type 2 diabetes mellitus', chapter: 'Endokrin & Metabolik' },
  { code: 'E10.9', id: 'Diabetes melitus tipe 1', en: 'Type 1 diabetes mellitus', chapter: 'Endokrin & Metabolik' },
  { code: 'E78.5', id: 'Dislipidemia/hiperlipidemia', en: 'Hyperlipidaemia', chapter: 'Endokrin & Metabolik' },
  { code: 'E03.9', id: 'Hipotiroidisme', en: 'Hypothyroidism', chapter: 'Endokrin & Metabolik' },
  { code: 'E05.9', id: 'Hipertiroidisme', en: 'Thyrotoxicosis', chapter: 'Endokrin & Metabolik' },
  { code: 'E66.9', id: 'Obesitas', en: 'Obesity', chapter: 'Endokrin & Metabolik' },
  { code: 'E79.0', id: 'Hiperurisemia (asam urat)', en: 'Hyperuricaemia', chapter: 'Endokrin & Metabolik' },
  { code: 'E86', id: 'Dehidrasi', en: 'Volume depletion', chapter: 'Endokrin & Metabolik' },
  // Saluran cerna
  { code: 'K29.7', id: 'Gastritis (maag)', en: 'Gastritis', chapter: 'Saluran Cerna' },
  { code: 'K21.9', id: 'GERD (refluks gastroesofageal)', en: 'Gastro-oesophageal reflux disease', chapter: 'Saluran Cerna' },
  { code: 'K27.9', id: 'Ulkus peptikum', en: 'Peptic ulcer', chapter: 'Saluran Cerna' },
  { code: 'K35.8', id: 'Apendisitis akut (usus buntu)', en: 'Acute appendicitis', chapter: 'Saluran Cerna' },
  { code: 'K40.9', id: 'Hernia inguinalis', en: 'Inguinal hernia', chapter: 'Saluran Cerna' },
  { code: 'K80.2', id: 'Batu empedu (kolelitiasis)', en: 'Gallstones', chapter: 'Saluran Cerna' },
  { code: 'K59.0', id: 'Konstipasi', en: 'Constipation', chapter: 'Saluran Cerna' },
  { code: 'K58.9', id: 'Sindrom usus iritabel (IBS)', en: 'Irritable bowel syndrome', chapter: 'Saluran Cerna' },
  { code: 'K76.0', id: 'Perlemakan hati (fatty liver)', en: 'Fatty liver', chapter: 'Saluran Cerna' },
  { code: 'K74.6', id: 'Sirosis hati', en: 'Cirrhosis of liver', chapter: 'Saluran Cerna' },
  { code: 'K52.9', id: 'Gastroenteritis & kolitis non-infeksi', en: 'Noninfective gastroenteritis', chapter: 'Saluran Cerna' },
  // Ginjal & saluran kemih
  { code: 'N39.0', id: 'Infeksi saluran kemih (ISK)', en: 'Urinary tract infection', chapter: 'Ginjal & Kemih' },
  { code: 'N18.9', id: 'Penyakit ginjal kronik', en: 'Chronic kidney disease', chapter: 'Ginjal & Kemih' },
  { code: 'N17.9', id: 'Gagal ginjal akut', en: 'Acute kidney failure', chapter: 'Ginjal & Kemih' },
  { code: 'N20.0', id: 'Batu ginjal (nefrolitiasis)', en: 'Kidney stone', chapter: 'Ginjal & Kemih' },
  { code: 'N40', id: 'Pembesaran prostat jinak (BPH)', en: 'Benign prostatic hyperplasia', chapter: 'Ginjal & Kemih' },
  // Muskuloskeletal
  { code: 'M54.5', id: 'Nyeri punggung bawah (low back pain)', en: 'Low back pain', chapter: 'Muskuloskeletal' },
  { code: 'M54.2', id: 'Nyeri leher (servikalgia)', en: 'Cervicalgia', chapter: 'Muskuloskeletal' },
  { code: 'M17.9', id: 'Osteoartritis lutut', en: 'Osteoarthritis of knee', chapter: 'Muskuloskeletal' },
  { code: 'M06.9', id: 'Artritis reumatoid', en: 'Rheumatoid arthritis', chapter: 'Muskuloskeletal' },
  { code: 'M10.9', id: 'Gout (artritis pirai)', en: 'Gout', chapter: 'Muskuloskeletal' },
  { code: 'M79.1', id: 'Mialgia (nyeri otot)', en: 'Myalgia', chapter: 'Muskuloskeletal' },
  { code: 'M81.9', id: 'Osteoporosis', en: 'Osteoporosis', chapter: 'Muskuloskeletal' },
  { code: 'S52.5', id: 'Fraktur ujung distal radius', en: 'Fracture of lower end of radius', chapter: 'Muskuloskeletal' },
  // Saraf
  { code: 'G43.9', id: 'Migrain', en: 'Migraine', chapter: 'Saraf' },
  { code: 'G44.2', id: 'Nyeri kepala tipe tegang', en: 'Tension-type headache', chapter: 'Saraf' },
  { code: 'R51', id: 'Sefalgia (nyeri kepala)', en: 'Headache', chapter: 'Saraf' },
  { code: 'G40.9', id: 'Epilepsi', en: 'Epilepsy', chapter: 'Saraf' },
  { code: 'G62.9', id: 'Polineuropati', en: 'Polyneuropathy', chapter: 'Saraf' },
  { code: 'G47.0', id: 'Insomnia', en: 'Insomnia', chapter: 'Saraf' },
  { code: 'H81.1', id: 'Vertigo posisi paroksismal (BPPV)', en: 'Benign paroxysmal vertigo', chapter: 'Saraf' },
  // Jiwa
  { code: 'F32.9', id: 'Depresi', en: 'Depressive episode', chapter: 'Kesehatan Jiwa' },
  { code: 'F41.1', id: 'Gangguan cemas menyeluruh', en: 'Generalized anxiety disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F41.0', id: 'Gangguan panik', en: 'Panic disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F43.1', id: 'Gangguan stres pascatrauma (PTSD)', en: 'Post-traumatic stress disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F20.9', id: 'Skizofrenia', en: 'Schizophrenia', chapter: 'Kesehatan Jiwa' },
  // Kulit
  { code: 'L20.9', id: 'Dermatitis atopik (eksim)', en: 'Atopic dermatitis', chapter: 'Kulit' },
  { code: 'L23.9', id: 'Dermatitis kontak alergi', en: 'Allergic contact dermatitis', chapter: 'Kulit' },
  { code: 'L50.9', id: 'Urtikaria (biduran)', en: 'Urticaria', chapter: 'Kulit' },
  { code: 'L70.0', id: 'Akne vulgaris (jerawat)', en: 'Acne vulgaris', chapter: 'Kulit' },
  { code: 'B35.9', id: 'Dermatofitosis (kurap/panu)', en: 'Dermatophytosis', chapter: 'Kulit' },
  { code: 'L40.9', id: 'Psoriasis', en: 'Psoriasis', chapter: 'Kulit' },
  // Mata & THT
  { code: 'H10.9', id: 'Konjungtivitis', en: 'Conjunctivitis', chapter: 'Mata & THT' },
  { code: 'H66.9', id: 'Otitis media', en: 'Otitis media', chapter: 'Mata & THT' },
  { code: 'H60.9', id: 'Otitis eksterna', en: 'Otitis externa', chapter: 'Mata & THT' },
  { code: 'H25.9', id: 'Katarak senilis', en: 'Senile cataract', chapter: 'Mata & THT' },
  { code: 'H40.9', id: 'Glaukoma', en: 'Glaucoma', chapter: 'Mata & THT' },
  // Darah & gizi
  { code: 'D50.9', id: 'Anemia defisiensi besi', en: 'Iron deficiency anaemia', chapter: 'Darah & Gizi' },
  { code: 'D64.9', id: 'Anemia', en: 'Anaemia, unspecified', chapter: 'Darah & Gizi' },
  { code: 'E44.0', id: 'Malnutrisi energi-protein sedang', en: 'Moderate protein-energy malnutrition', chapter: 'Darah & Gizi' },
  { code: 'E55.9', id: 'Defisiensi vitamin D', en: 'Vitamin D deficiency', chapter: 'Darah & Gizi' },
  // Ob-gyn
  { code: 'O80', id: 'Persalinan spontan normal', en: 'Single spontaneous delivery', chapter: 'Obstetri & Ginekologi' },
  { code: 'O14.9', id: 'Preeklampsia', en: 'Pre-eclampsia', chapter: 'Obstetri & Ginekologi' },
  { code: 'N91.2', id: 'Amenorea', en: 'Amenorrhoea', chapter: 'Obstetri & Ginekologi' },
  { code: 'N95.1', id: 'Keadaan menopause', en: 'Menopausal state', chapter: 'Obstetri & Ginekologi' },
  { code: 'N76.0', id: 'Vaginitis akut', en: 'Acute vaginitis', chapter: 'Obstetri & Ginekologi' },
  // Anak
  { code: 'P07.3', id: 'Bayi prematur', en: 'Preterm infant', chapter: 'Anak' },
  { code: 'A08.0', id: 'Rotavirus enteritis', en: 'Rotaviral enteritis', chapter: 'Anak' },
  { code: 'J21.9', id: 'Bronkiolitis akut', en: 'Acute bronchiolitis', chapter: 'Anak' },
  { code: 'B01.9', id: 'Varicella (cacar air)', en: 'Varicella', chapter: 'Anak' },
  // Gejala & tanda umum
  { code: 'R50.9', id: 'Demam', en: 'Fever, unspecified', chapter: 'Gejala Umum' },
  { code: 'R10.4', id: 'Nyeri perut', en: 'Abdominal pain', chapter: 'Gejala Umum' },
  { code: 'R05', id: 'Batuk', en: 'Cough', chapter: 'Gejala Umum' },
  { code: 'R07.4', id: 'Nyeri dada', en: 'Chest pain, unspecified', chapter: 'Gejala Umum' },
  { code: 'R11', id: 'Mual & muntah', en: 'Nausea and vomiting', chapter: 'Gejala Umum' },
  { code: 'R42', id: 'Pusing & vertigo', en: 'Dizziness and giddiness', chapter: 'Gejala Umum' },
  { code: 'R53', id: 'Lemas & lelah (malaise)', en: 'Malaise and fatigue', chapter: 'Gejala Umum' },
  { code: 'R55', id: 'Sinkop & kolaps', en: 'Syncope and collapse', chapter: 'Gejala Umum' },
  { code: 'Z00.0', id: 'Pemeriksaan kesehatan umum', en: 'General medical examination', chapter: 'Pemeriksaan' },
]

// Distinct chapters (for grouping / filters).
export const ICD_CHAPTERS = Array.from(new Set(ICD_CODES.map((c) => c.chapter)))

// Search by code or Indonesian/English term (ranked: code prefix > word start).
export function searchICD(query: string, limit = 20): ICDCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return ICD_CODES.slice(0, limit)
  const scored = ICD_CODES.map((c) => {
    const code = c.code.toLowerCase()
    const hay = `${c.id} ${c.en}`.toLowerCase()
    let score = 0
    if (code === q) score = 100
    else if (code.startsWith(q)) score = 80
    else if (hay.includes(q)) score = hay.startsWith(q) ? 60 : 40
    else if (q.split(/\s+/).every((w) => hay.includes(w))) score = 30
    return { c, score }
  }).filter((s) => s.score > 0)
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.c)
}

// Best-effort auto-match an AI free-text diagnosis to an ICD code (keyword
// overlap). Returns undefined when nothing reasonable matches.
export function matchICD(text: string): ICDCode | undefined {
  const t = (text || '').toLowerCase()
  if (!t) return undefined
  let best: { c: ICDCode; n: number } | undefined
  for (const c of ICD_CODES) {
    const words = `${c.id} ${c.en}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)
    const n = words.filter((w) => t.includes(w)).length
    if (n > 0 && (!best || n > best.n)) best = { c, n }
  }
  return best?.c
}
