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

  // ── Tambahan: kasus SKDI 4A dan keadaan gawat darurat yang lazim diujikan ──
  // Infeksi & penyakit menular
  { code: 'A00.9', id: 'Kolera', en: 'Cholera', chapter: 'Infeksi' },
  { code: 'A03.9', id: 'Disentri basiler (shigelosis)', en: 'Shigellosis', chapter: 'Infeksi' },
  { code: 'A06.0', id: 'Disentri amuba akut', en: 'Acute amoebic dysentery', chapter: 'Infeksi' },
  { code: 'A16.2', id: 'TB paru tanpa konfirmasi bakteriologis', en: 'TB of lung without bacteriological confirmation', chapter: 'Infeksi' },
  { code: 'A17.0', id: 'Meningitis tuberkulosis', en: 'Tuberculous meningitis', chapter: 'Infeksi' },
  { code: 'A30.9', id: 'Kusta (lepra)', en: 'Leprosy', chapter: 'Infeksi' },
  { code: 'A33', id: 'Tetanus neonatorum', en: 'Tetanus neonatorum', chapter: 'Infeksi' },
  { code: 'A35', id: 'Tetanus', en: 'Other tetanus', chapter: 'Infeksi' },
  { code: 'A36.9', id: 'Difteri', en: 'Diphtheria', chapter: 'Infeksi' },
  { code: 'A37.9', id: 'Pertusis (batuk rejan)', en: 'Whooping cough', chapter: 'Infeksi' },
  { code: 'A41.9', id: 'Sepsis', en: 'Sepsis, unspecified', chapter: 'Infeksi' },
  { code: 'A27.9', id: 'Leptospirosis', en: 'Leptospirosis', chapter: 'Infeksi' },
  { code: 'A51.0', id: 'Sifilis primer genital', en: 'Primary genital syphilis', chapter: 'Infeksi' },
  { code: 'A54.9', id: 'Gonore', en: 'Gonococcal infection', chapter: 'Infeksi' },
  { code: 'A63.0', id: 'Kondiloma akuminata', en: 'Anogenital warts', chapter: 'Infeksi' },
  { code: 'A82.9', id: 'Rabies', en: 'Rabies', chapter: 'Infeksi' },
  { code: 'A92.0', id: 'Chikungunya', en: 'Chikungunya virus disease', chapter: 'Infeksi' },
  { code: 'A97.2', id: 'Dengue berat', en: 'Severe dengue', chapter: 'Infeksi' },
  { code: 'B05.9', id: 'Campak (morbili)', en: 'Measles', chapter: 'Infeksi' },
  { code: 'B26.9', id: 'Parotitis epidemika (gondongan)', en: 'Mumps', chapter: 'Infeksi' },
  { code: 'B51.9', id: 'Malaria vivax', en: 'Plasmodium vivax malaria', chapter: 'Infeksi' },
  { code: 'B54', id: 'Malaria tidak ditentukan', en: 'Unspecified malaria', chapter: 'Infeksi' },
  { code: 'B77.9', id: 'Askariasis (cacing gelang)', en: 'Ascariasis', chapter: 'Infeksi' },
  { code: 'B76.9', id: 'Ankilostomiasis (cacing tambang)', en: 'Hookworm disease', chapter: 'Infeksi' },
  { code: 'B86', id: 'Skabies', en: 'Scabies', chapter: 'Infeksi' },
  { code: 'B37.9', id: 'Kandidiasis', en: 'Candidiasis', chapter: 'Infeksi' },
  { code: 'B02.9', id: 'Herpes zoster', en: 'Zoster', chapter: 'Infeksi' },
  { code: 'B00.9', id: 'Infeksi herpes simpleks', en: 'Herpesviral infection', chapter: 'Infeksi' },
  // Pernapasan
  { code: 'J09', id: 'Influenza karena virus influenza zoonotik', en: 'Influenza, zoonotic virus', chapter: 'Pernapasan' },
  { code: 'J11.1', id: 'Influenza dengan manifestasi pernapasan', en: 'Influenza with respiratory manifestations', chapter: 'Pernapasan' },
  { code: 'J15.9', id: 'Pneumonia bakterial', en: 'Bacterial pneumonia', chapter: 'Pernapasan' },
  { code: 'J46', id: 'Status asmatikus (asma serangan berat)', en: 'Status asthmaticus', chapter: 'Pernapasan' },
  { code: 'J38.5', id: 'Spasme laring', en: 'Laryngeal spasm', chapter: 'Pernapasan' },
  { code: 'J05.0', id: 'Laringitis obstruktif akut (croup)', en: 'Acute obstructive laryngitis (croup)', chapter: 'Pernapasan' },
  { code: 'J90', id: 'Efusi pleura', en: 'Pleural effusion', chapter: 'Pernapasan' },
  { code: 'J93.9', id: 'Pneumotoraks', en: 'Pneumothorax', chapter: 'Pernapasan' },
  { code: 'J81', id: 'Edema paru', en: 'Pulmonary oedema', chapter: 'Pernapasan' },
  { code: 'J96.0', id: 'Gagal napas akut', en: 'Acute respiratory failure', chapter: 'Pernapasan' },
  { code: 'J47', id: 'Bronkiektasis', en: 'Bronchiectasis', chapter: 'Pernapasan' },
  { code: 'J32.9', id: 'Sinusitis kronik', en: 'Chronic sinusitis', chapter: 'Pernapasan' },
  { code: 'J35.0', id: 'Tonsilitis kronik', en: 'Chronic tonsillitis', chapter: 'Pernapasan' },
  // Kardiovaskular
  { code: 'I11.0', id: 'Penyakit jantung hipertensif dengan gagal jantung', en: 'Hypertensive heart disease with heart failure', chapter: 'Kardiovaskular' },
  { code: 'I16.0', id: 'Hipertensi urgensi', en: 'Hypertensive urgency', chapter: 'Kardiovaskular' },
  { code: 'I16.1', id: 'Hipertensi emergensi', en: 'Hypertensive emergency', chapter: 'Kardiovaskular' },
  { code: 'I21.0', id: 'STEMI dinding anterior', en: 'Acute transmural MI of anterior wall', chapter: 'Kardiovaskular' },
  { code: 'I21.1', id: 'STEMI dinding inferior', en: 'Acute transmural MI of inferior wall', chapter: 'Kardiovaskular' },
  { code: 'I21.4', id: 'NSTEMI', en: 'Acute subendocardial myocardial infarction', chapter: 'Kardiovaskular' },
  { code: 'I26.9', id: 'Emboli paru', en: 'Pulmonary embolism', chapter: 'Kardiovaskular' },
  { code: 'I46.9', id: 'Henti jantung', en: 'Cardiac arrest', chapter: 'Kardiovaskular' },
  { code: 'I47.1', id: 'Takikardia supraventrikular (SVT)', en: 'Supraventricular tachycardia', chapter: 'Kardiovaskular' },
  { code: 'I49.0', id: 'Fibrilasi & flutter ventrikel', en: 'Ventricular fibrillation and flutter', chapter: 'Kardiovaskular' },
  { code: 'I44.2', id: 'Blok atrioventrikular total', en: 'Complete atrioventricular block', chapter: 'Kardiovaskular' },
  { code: 'I60.9', id: 'Perdarahan subaraknoid', en: 'Subarachnoid haemorrhage', chapter: 'Kardiovaskular' },
  { code: 'I61.9', id: 'Stroke perdarahan intraserebral', en: 'Intracerebral haemorrhage', chapter: 'Kardiovaskular' },
  { code: 'I73.9', id: 'Penyakit arteri perifer', en: 'Peripheral vascular disease', chapter: 'Kardiovaskular' },
  { code: 'I80.2', id: 'Trombosis vena dalam tungkai (DVT)', en: 'Deep vein thrombosis of lower extremity', chapter: 'Kardiovaskular' },
  { code: 'I84.9', id: 'Hemoroid', en: 'Haemorrhoids', chapter: 'Kardiovaskular' },
  { code: 'I01.9', id: 'Demam reumatik akut dengan keterlibatan jantung', en: 'Acute rheumatic heart disease', chapter: 'Kardiovaskular' },
  { code: 'I05.0', id: 'Stenosis mitral reumatik', en: 'Rheumatic mitral stenosis', chapter: 'Kardiovaskular' },
  // Endokrin & metabolik
  { code: 'E10.1', id: 'DM tipe 1 dengan ketoasidosis', en: 'Type 1 diabetes with ketoacidosis', chapter: 'Endokrin & Metabolik' },
  { code: 'E11.0', id: 'DM tipe 2 dengan koma hiperosmolar', en: 'Type 2 diabetes with hyperosmolar coma', chapter: 'Endokrin & Metabolik' },
  { code: 'E11.6', id: 'DM tipe 2 dengan kaki diabetik', en: 'Type 2 diabetes with other specified complications', chapter: 'Endokrin & Metabolik' },
  { code: 'E16.2', id: 'Hipoglikemia', en: 'Hypoglycaemia, unspecified', chapter: 'Endokrin & Metabolik' },
  { code: 'E05.5', id: 'Krisis tiroid (badai tiroid)', en: 'Thyroid crisis or storm', chapter: 'Endokrin & Metabolik' },
  { code: 'E01.0', id: 'Goiter difus akibat defisiensi yodium', en: 'Iodine-deficiency diffuse goitre', chapter: 'Endokrin & Metabolik' },
  { code: 'E27.1', id: 'Insufisiensi adrenokortikal primer (Addison)', en: 'Primary adrenocortical insufficiency', chapter: 'Endokrin & Metabolik' },
  { code: 'E24.9', id: 'Sindrom Cushing', en: 'Cushing syndrome', chapter: 'Endokrin & Metabolik' },
  { code: 'E87.6', id: 'Hipokalemia', en: 'Hypokalaemia', chapter: 'Endokrin & Metabolik' },
  { code: 'E87.5', id: 'Hiperkalemia', en: 'Hyperkalaemia', chapter: 'Endokrin & Metabolik' },
  { code: 'E87.1', id: 'Hiponatremia', en: 'Hypo-osmolality and hyponatraemia', chapter: 'Endokrin & Metabolik' },
  { code: 'E87.2', id: 'Asidosis', en: 'Acidosis', chapter: 'Endokrin & Metabolik' },
  // Saluran cerna
  { code: 'K25.0', id: 'Ulkus lambung akut dengan perdarahan', en: 'Acute gastric ulcer with haemorrhage', chapter: 'Saluran Cerna' },
  { code: 'K30', id: 'Dispepsia fungsional', en: 'Functional dyspepsia', chapter: 'Saluran Cerna' },
  { code: 'K44.9', id: 'Hernia diafragma', en: 'Diaphragmatic hernia', chapter: 'Saluran Cerna' },
  { code: 'K42.9', id: 'Hernia umbilikalis', en: 'Umbilical hernia', chapter: 'Saluran Cerna' },
  { code: 'K56.6', id: 'Obstruksi usus', en: 'Intestinal obstruction', chapter: 'Saluran Cerna' },
  { code: 'K57.9', id: 'Penyakit divertikular usus', en: 'Diverticular disease of intestine', chapter: 'Saluran Cerna' },
  { code: 'K60.2', id: 'Fisura ani', en: 'Anal fissure', chapter: 'Saluran Cerna' },
  { code: 'K61.0', id: 'Abses anal', en: 'Anal abscess', chapter: 'Saluran Cerna' },
  { code: 'K70.3', id: 'Sirosis hati alkoholik', en: 'Alcoholic cirrhosis of liver', chapter: 'Saluran Cerna' },
  { code: 'K72.9', id: 'Gagal hati', en: 'Hepatic failure', chapter: 'Saluran Cerna' },
  { code: 'K81.0', id: 'Kolesistitis akut', en: 'Acute cholecystitis', chapter: 'Saluran Cerna' },
  { code: 'K85.9', id: 'Pankreatitis akut', en: 'Acute pancreatitis', chapter: 'Saluran Cerna' },
  { code: 'K92.2', id: 'Perdarahan saluran cerna', en: 'Gastrointestinal haemorrhage', chapter: 'Saluran Cerna' },
  { code: 'K11.5', id: 'Sialolitiasis', en: 'Sialolithiasis', chapter: 'Saluran Cerna' },
  { code: 'K12.0', id: 'Stomatitis aftosa (sariawan)', en: 'Recurrent oral aphthae', chapter: 'Saluran Cerna' },
  // Ginjal & kemih
  { code: 'N10', id: 'Pielonefritis akut', en: 'Acute tubulo-interstitial nephritis', chapter: 'Ginjal & Kemih' },
  { code: 'N30.0', id: 'Sistitis akut', en: 'Acute cystitis', chapter: 'Ginjal & Kemih' },
  { code: 'N34.2', id: 'Uretritis', en: 'Other urethritis', chapter: 'Ginjal & Kemih' },
  { code: 'N04.9', id: 'Sindrom nefrotik', en: 'Nephrotic syndrome', chapter: 'Ginjal & Kemih' },
  { code: 'N00.9', id: 'Sindrom nefritik akut', en: 'Acute nephritic syndrome', chapter: 'Ginjal & Kemih' },
  { code: 'N45.9', id: 'Orkitis & epididimitis', en: 'Orchitis and epididymitis', chapter: 'Ginjal & Kemih' },
  { code: 'N44', id: 'Torsio testis', en: 'Torsion of testis', chapter: 'Ginjal & Kemih' },
  { code: 'N47', id: 'Fimosis & parafimosis', en: 'Redundant prepuce, phimosis and paraphimosis', chapter: 'Ginjal & Kemih' },
  { code: 'N48.3', id: 'Priapismus', en: 'Priapism', chapter: 'Ginjal & Kemih' },
  { code: 'R33', id: 'Retensi urin', en: 'Retention of urine', chapter: 'Ginjal & Kemih' },
  // Muskuloskeletal & cedera
  { code: 'M51.1', id: 'HNP lumbal dengan radikulopati', en: 'Lumbar disc disorder with radiculopathy', chapter: 'Muskuloskeletal' },
  { code: 'M75.1', id: 'Sindrom rotator cuff', en: 'Rotator cuff syndrome', chapter: 'Muskuloskeletal' },
  { code: 'M77.1', id: 'Epikondilitis lateral (tennis elbow)', en: 'Lateral epicondylitis', chapter: 'Muskuloskeletal' },
  { code: 'M65.9', id: 'Sinovitis & tenosinovitis', en: 'Synovitis and tenosynovitis', chapter: 'Muskuloskeletal' },
  { code: 'G56.0', id: 'Sindrom terowongan karpal', en: 'Carpal tunnel syndrome', chapter: 'Muskuloskeletal' },
  { code: 'M86.9', id: 'Osteomielitis', en: 'Osteomyelitis', chapter: 'Muskuloskeletal' },
  { code: 'S06.0', id: 'Komosio serebri (gegar otak)', en: 'Concussion', chapter: 'Muskuloskeletal' },
  { code: 'S72.0', id: 'Fraktur leher femur', en: 'Fracture of neck of femur', chapter: 'Muskuloskeletal' },
  { code: 'S42.3', id: 'Fraktur batang humerus', en: 'Fracture of shaft of humerus', chapter: 'Muskuloskeletal' },
  { code: 'S82.6', id: 'Fraktur maleolus lateral', en: 'Fracture of lateral malleolus', chapter: 'Muskuloskeletal' },
  { code: 'S93.4', id: 'Sprain pergelangan kaki', en: 'Sprain of ankle', chapter: 'Muskuloskeletal' },
  { code: 'S43.0', id: 'Dislokasi bahu', en: 'Dislocation of shoulder joint', chapter: 'Muskuloskeletal' },
  { code: 'T14.1', id: 'Luka terbuka (vulnus)', en: 'Open wound of unspecified body region', chapter: 'Muskuloskeletal' },
  { code: 'T30.0', id: 'Luka bakar', en: 'Burn of unspecified body region', chapter: 'Muskuloskeletal' },
  { code: 'T63.0', id: 'Gigitan ular berbisa', en: 'Toxic effect of snake venom', chapter: 'Muskuloskeletal' },
  { code: 'T78.2', id: 'Syok anafilaktik', en: 'Anaphylactic shock', chapter: 'Muskuloskeletal' },
  { code: 'T75.1', id: 'Tenggelam & submersi tidak fatal', en: 'Drowning and nonfatal submersion', chapter: 'Muskuloskeletal' },
  { code: 'T67.0', id: 'Heat stroke', en: 'Heatstroke and sunstroke', chapter: 'Muskuloskeletal' },
  { code: 'T68', id: 'Hipotermia', en: 'Hypothermia', chapter: 'Muskuloskeletal' },
  { code: 'T17.9', id: 'Benda asing saluran napas', en: 'Foreign body in respiratory tract', chapter: 'Muskuloskeletal' },
  // Saraf
  { code: 'G00.9', id: 'Meningitis bakterial', en: 'Bacterial meningitis', chapter: 'Saraf' },
  { code: 'G04.9', id: 'Ensefalitis', en: 'Encephalitis, unspecified', chapter: 'Saraf' },
  { code: 'G41.9', id: 'Status epileptikus', en: 'Status epilepticus', chapter: 'Saraf' },
  { code: 'G45.9', id: 'Serangan iskemik sepintas (TIA)', en: 'Transient cerebral ischaemic attack', chapter: 'Saraf' },
  { code: 'G51.0', id: 'Bell palsy', en: 'Bell palsy', chapter: 'Saraf' },
  { code: 'G50.0', id: 'Neuralgia trigeminus', en: 'Trigeminal neuralgia', chapter: 'Saraf' },
  { code: 'G61.0', id: 'Sindrom Guillain-Barré', en: 'Guillain-Barre syndrome', chapter: 'Saraf' },
  { code: 'G20', id: 'Penyakit Parkinson', en: 'Parkinson disease', chapter: 'Saraf' },
  { code: 'G35', id: 'Sklerosis multipel', en: 'Multiple sclerosis', chapter: 'Saraf' },
  { code: 'G47.3', id: 'Apnea tidur', en: 'Sleep apnoea', chapter: 'Saraf' },
  { code: 'R40.2', id: 'Koma', en: 'Coma, unspecified', chapter: 'Saraf' },
  { code: 'R56.0', id: 'Kejang demam', en: 'Febrile convulsions', chapter: 'Saraf' },
  // Jiwa
  { code: 'F31.9', id: 'Gangguan bipolar', en: 'Bipolar affective disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F05.9', id: 'Delirium', en: 'Delirium, unspecified', chapter: 'Kesehatan Jiwa' },
  { code: 'F03', id: 'Demensia', en: 'Unspecified dementia', chapter: 'Kesehatan Jiwa' },
  { code: 'F10.2', id: 'Ketergantungan alkohol', en: 'Alcohol dependence syndrome', chapter: 'Kesehatan Jiwa' },
  { code: 'F17.2', id: 'Ketergantungan nikotin', en: 'Nicotine dependence', chapter: 'Kesehatan Jiwa' },
  { code: 'F45.9', id: 'Gangguan somatoform', en: 'Somatoform disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F50.0', id: 'Anoreksia nervosa', en: 'Anorexia nervosa', chapter: 'Kesehatan Jiwa' },
  { code: 'F90.9', id: 'Gangguan pemusatan perhatian & hiperaktivitas (ADHD)', en: 'Hyperkinetic disorder', chapter: 'Kesehatan Jiwa' },
  { code: 'F84.0', id: 'Autisme masa kanak', en: 'Childhood autism', chapter: 'Kesehatan Jiwa' },
  // Kulit
  { code: 'L01.0', id: 'Impetigo', en: 'Impetigo', chapter: 'Kulit' },
  { code: 'L02.9', id: 'Abses kulit, furunkel & karbunkel', en: 'Cutaneous abscess, furuncle and carbuncle', chapter: 'Kulit' },
  { code: 'L03.9', id: 'Selulitis', en: 'Cellulitis', chapter: 'Kulit' },
  { code: 'L21.9', id: 'Dermatitis seboroik', en: 'Seborrhoeic dermatitis', chapter: 'Kulit' },
  { code: 'L24.9', id: 'Dermatitis kontak iritan', en: 'Irritant contact dermatitis', chapter: 'Kulit' },
  { code: 'L30.9', id: 'Dermatitis numularis', en: 'Dermatitis, unspecified', chapter: 'Kulit' },
  { code: 'L43.9', id: 'Liken planus', en: 'Lichen planus', chapter: 'Kulit' },
  { code: 'L51.1', id: 'Sindrom Stevens-Johnson', en: 'Stevens-Johnson syndrome', chapter: 'Kulit' },
  { code: 'L80', id: 'Vitiligo', en: 'Vitiligo', chapter: 'Kulit' },
  { code: 'L89.9', id: 'Ulkus dekubitus', en: 'Pressure ulcer', chapter: 'Kulit' },
  { code: 'B36.0', id: 'Pitiriasis versikolor (panu)', en: 'Pityriasis versicolor', chapter: 'Kulit' },
  { code: 'B07', id: 'Veruka vulgaris (kutil)', en: 'Viral warts', chapter: 'Kulit' },
  // Mata & THT
  { code: 'H00.0', id: 'Hordeolum (bintitan)', en: 'Hordeolum', chapter: 'Mata & THT' },
  { code: 'H01.0', id: 'Blefaritis', en: 'Blepharitis', chapter: 'Mata & THT' },
  { code: 'H16.0', id: 'Ulkus kornea', en: 'Corneal ulcer', chapter: 'Mata & THT' },
  { code: 'H20.9', id: 'Uveitis anterior', en: 'Iridocyclitis', chapter: 'Mata & THT' },
  { code: 'H33.2', id: 'Ablasio retina', en: 'Retinal detachment', chapter: 'Mata & THT' },
  { code: 'H36.0', id: 'Retinopati diabetik', en: 'Diabetic retinopathy', chapter: 'Mata & THT' },
  { code: 'H52.1', id: 'Miopia', en: 'Myopia', chapter: 'Mata & THT' },
  { code: 'H52.4', id: 'Presbiopia', en: 'Presbyopia', chapter: 'Mata & THT' },
  { code: 'H11.0', id: 'Pterigium', en: 'Pterygium', chapter: 'Mata & THT' },
  { code: 'H61.2', id: 'Serumen obturans', en: 'Impacted cerumen', chapter: 'Mata & THT' },
  { code: 'H65.9', id: 'Otitis media non-supuratif (OME)', en: 'Nonsuppurative otitis media', chapter: 'Mata & THT' },
  { code: 'H72.0', id: 'Perforasi membran timpani', en: 'Central perforation of tympanic membrane', chapter: 'Mata & THT' },
  { code: 'H81.0', id: 'Penyakit Meniere', en: 'Meniere disease', chapter: 'Mata & THT' },
  { code: 'H90.3', id: 'Tuli sensorineural', en: 'Sensorineural hearing loss', chapter: 'Mata & THT' },
  { code: 'H93.1', id: 'Tinitus', en: 'Tinnitus', chapter: 'Mata & THT' },
  { code: 'R04.0', id: 'Epistaksis (mimisan)', en: 'Epistaxis', chapter: 'Mata & THT' },
  { code: 'J34.2', id: 'Deviasi septum nasi', en: 'Deviated nasal septum', chapter: 'Mata & THT' },
  // Darah & gizi
  { code: 'D53.1', id: 'Anemia megaloblastik', en: 'Other megaloblastic anaemias', chapter: 'Darah & Gizi' },
  { code: 'D56.9', id: 'Talasemia', en: 'Thalassaemia', chapter: 'Darah & Gizi' },
  { code: 'D57.1', id: 'Anemia sel sabit', en: 'Sickle-cell disease without crisis', chapter: 'Darah & Gizi' },
  { code: 'D59.9', id: 'Anemia hemolitik didapat', en: 'Acquired haemolytic anaemia', chapter: 'Darah & Gizi' },
  { code: 'D69.3', id: 'Purpura trombositopenik imun (ITP)', en: 'Immune thrombocytopenic purpura', chapter: 'Darah & Gizi' },
  { code: 'D66', id: 'Hemofilia A', en: 'Hereditary factor VIII deficiency', chapter: 'Darah & Gizi' },
  { code: 'C92.0', id: 'Leukemia mieloblastik akut', en: 'Acute myeloblastic leukaemia', chapter: 'Darah & Gizi' },
  { code: 'E43', id: 'Malnutrisi energi-protein berat', en: 'Severe protein-energy malnutrition', chapter: 'Darah & Gizi' },
  { code: 'E40', id: 'Kwashiorkor', en: 'Kwashiorkor', chapter: 'Darah & Gizi' },
  { code: 'E41', id: 'Marasmus', en: 'Nutritional marasmus', chapter: 'Darah & Gizi' },
  { code: 'E50.9', id: 'Defisiensi vitamin A', en: 'Vitamin A deficiency', chapter: 'Darah & Gizi' },
  { code: 'E51.1', id: 'Beri-beri (defisiensi tiamin)', en: 'Beriberi', chapter: 'Darah & Gizi' },
  { code: 'E53.8', id: 'Defisiensi vitamin B12', en: 'Deficiency of other specified B group vitamins', chapter: 'Darah & Gizi' },
  // Ob-gyn
  { code: 'O03.9', id: 'Abortus spontan', en: 'Spontaneous abortion', chapter: 'Obstetri & Ginekologi' },
  { code: 'O00.1', id: 'Kehamilan ektopik tuba', en: 'Tubal pregnancy', chapter: 'Obstetri & Ginekologi' },
  { code: 'O15.9', id: 'Eklampsia', en: 'Eclampsia', chapter: 'Obstetri & Ginekologi' },
  { code: 'O21.0', id: 'Hiperemesis gravidarum ringan', en: 'Mild hyperemesis gravidarum', chapter: 'Obstetri & Ginekologi' },
  { code: 'O44.1', id: 'Plasenta previa dengan perdarahan', en: 'Placenta praevia with haemorrhage', chapter: 'Obstetri & Ginekologi' },
  { code: 'O45.9', id: 'Solusio plasenta', en: 'Premature separation of placenta', chapter: 'Obstetri & Ginekologi' },
  { code: 'O72.1', id: 'Perdarahan pascapersalinan (HPP)', en: 'Other immediate postpartum haemorrhage', chapter: 'Obstetri & Ginekologi' },
  { code: 'O42.9', id: 'Ketuban pecah dini', en: 'Premature rupture of membranes', chapter: 'Obstetri & Ginekologi' },
  { code: 'O24.4', id: 'Diabetes melitus gestasional', en: 'Diabetes mellitus arising in pregnancy', chapter: 'Obstetri & Ginekologi' },
  { code: 'O99.0', id: 'Anemia dalam kehamilan', en: 'Anaemia complicating pregnancy', chapter: 'Obstetri & Ginekologi' },
  { code: 'N70.9', id: 'Salpingo-ooforitis', en: 'Salpingitis and oophoritis', chapter: 'Obstetri & Ginekologi' },
  { code: 'N73.9', id: 'Penyakit radang panggul (PID)', en: 'Female pelvic inflammatory disease', chapter: 'Obstetri & Ginekologi' },
  { code: 'N80.9', id: 'Endometriosis', en: 'Endometriosis', chapter: 'Obstetri & Ginekologi' },
  { code: 'N83.2', id: 'Kista ovarium', en: 'Ovarian cyst', chapter: 'Obstetri & Ginekologi' },
  { code: 'D25.9', id: 'Mioma uteri', en: 'Leiomyoma of uterus', chapter: 'Obstetri & Ginekologi' },
  { code: 'N92.0', id: 'Menoragia', en: 'Excessive menstruation with regular cycle', chapter: 'Obstetri & Ginekologi' },
  { code: 'N94.6', id: 'Dismenorea', en: 'Dysmenorrhoea', chapter: 'Obstetri & Ginekologi' },
  { code: 'E28.2', id: 'Sindrom ovarium polikistik (PCOS)', en: 'Polycystic ovarian syndrome', chapter: 'Obstetri & Ginekologi' },
  { code: 'N61', id: 'Mastitis', en: 'Inflammatory disorders of breast', chapter: 'Obstetri & Ginekologi' },
  { code: 'C50.9', id: 'Kanker payudara', en: 'Malignant neoplasm of breast', chapter: 'Obstetri & Ginekologi' },
  { code: 'C53.9', id: 'Kanker serviks', en: 'Malignant neoplasm of cervix uteri', chapter: 'Obstetri & Ginekologi' },
  // Anak & neonatus
  { code: 'P59.9', id: 'Ikterus neonatorum', en: 'Neonatal jaundice', chapter: 'Anak' },
  { code: 'P36.9', id: 'Sepsis neonatorum', en: 'Bacterial sepsis of newborn', chapter: 'Anak' },
  { code: 'P21.9', id: 'Asfiksia lahir', en: 'Birth asphyxia', chapter: 'Anak' },
  { code: 'P22.0', id: 'Sindrom gawat napas neonatus', en: 'Respiratory distress syndrome of newborn', chapter: 'Anak' },
  { code: 'P07.1', id: 'Berat lahir rendah', en: 'Other low birth weight', chapter: 'Anak' },
  { code: 'R62.8', id: 'Gagal tumbuh & perawakan pendek (stunting)', en: 'Other lack of expected normal development', chapter: 'Anak' },
  { code: 'Q21.0', id: 'Defek septum ventrikel (VSD)', en: 'Ventricular septal defect', chapter: 'Anak' },
  { code: 'Q25.0', id: 'Duktus arteriosus persisten (PDA)', en: 'Patent ductus arteriosus', chapter: 'Anak' },
  { code: 'Q21.3', id: 'Tetralogi Fallot', en: 'Tetralogy of Fallot', chapter: 'Anak' },
  { code: 'Q35.9', id: 'Palatoskisis (celah langit-langit)', en: 'Cleft palate', chapter: 'Anak' },
  { code: 'Q37.9', id: 'Labiopalatoskisis', en: 'Cleft palate with cleft lip', chapter: 'Anak' },
  { code: 'Q53.9', id: 'Kriptorkismus (testis tidak turun)', en: 'Undescended testicle', chapter: 'Anak' },
  { code: 'Q40.0', id: 'Stenosis pilorus hipertrofik', en: 'Congenital hypertrophic pyloric stenosis', chapter: 'Anak' },
  { code: 'Q90.9', id: 'Sindrom Down', en: 'Down syndrome', chapter: 'Anak' },
  // Gejala & tanda umum
  { code: 'R60.0', id: 'Edema setempat', en: 'Localized oedema', chapter: 'Gejala Umum' },
  { code: 'R63.4', id: 'Penurunan berat badan tidak wajar', en: 'Abnormal weight loss', chapter: 'Gejala Umum' },
  { code: 'R57.0', id: 'Syok kardiogenik', en: 'Cardiogenic shock', chapter: 'Gejala Umum' },
  { code: 'R57.1', id: 'Syok hipovolemik', en: 'Hypovolaemic shock', chapter: 'Gejala Umum' },
  { code: 'R06.0', id: 'Dispnea (sesak napas)', en: 'Dyspnoea', chapter: 'Gejala Umum' },
  { code: 'R04.2', id: 'Hemoptisis (batuk darah)', en: 'Haemoptysis', chapter: 'Gejala Umum' },
  { code: 'R17', id: 'Ikterus', en: 'Unspecified jaundice', chapter: 'Gejala Umum' },
  { code: 'R18', id: 'Asites', en: 'Ascites', chapter: 'Gejala Umum' },
  { code: 'R19.0', id: 'Massa & benjolan perut', en: 'Intra-abdominal swelling, mass and lump', chapter: 'Gejala Umum' },
  { code: 'R31', id: 'Hematuria', en: 'Unspecified haematuria', chapter: 'Gejala Umum' },
  { code: 'R59.9', id: 'Pembesaran kelenjar getah bening', en: 'Enlarged lymph nodes', chapter: 'Gejala Umum' },
  { code: 'R73.9', id: 'Hiperglikemia', en: 'Hyperglycaemia, unspecified', chapter: 'Gejala Umum' },
  // Pemeriksaan & pencegahan
  { code: 'Z23', id: 'Kontak untuk imunisasi', en: 'Encounter for immunization', chapter: 'Pemeriksaan' },
  { code: 'Z34.9', id: 'Pengawasan kehamilan normal', en: 'Supervision of normal pregnancy', chapter: 'Pemeriksaan' },
  { code: 'Z30.9', id: 'Kontrasepsi', en: 'Encounter for contraceptive management', chapter: 'Pemeriksaan' },
  { code: 'Z71.3', id: 'Konseling & pengawasan diet', en: 'Dietary counselling and surveillance', chapter: 'Pemeriksaan' },
  { code: 'Z20.9', id: 'Kontak dengan penyakit menular', en: 'Contact with communicable disease', chapter: 'Pemeriksaan' },
]

// ICD-11 (the newest WHO revision) stem codes for the most common diagnoses,
// mapped from their ICD-10 counterpart. Provided for diagnoses where the
// crosswalk is well-established; the treating doctor verifies the final code.
export const ICD11_MAP: Record<string, string> = {
  // Infeksi
  A15: '1B11', A90: '1D20', 'A01.0': '1A07', B20: '1C62', 'B34.2': 'RA01', 'B35.9': '1F28',
  // Pernapasan
  J00: 'CA00', 'J45.9': 'CA23', 'J44.9': 'CA22', 'J18.9': 'CA40', 'J30.4': 'CA08',
  // Kardiovaskular
  I10: 'BA00', 'I20.0': 'BA40', 'I21.9': 'BA41', 'I50.9': 'BD10', I48: 'BC81', 'I63.9': '8B11',
  // Endokrin & metabolik
  'E11.9': '5A11', 'E10.9': '5A10', 'E78.5': '5C80', 'E03.9': '5A00', 'E05.9': '5A02', 'E66.9': '5B81', 'E55.9': '5B57',
  // Saluran cerna
  'K21.9': 'DA22', 'K29.7': 'DA42', 'K35.8': 'DB10', 'K40.9': 'DD50', 'K80.2': 'DC11',
  // Ginjal & kemih
  'N18.9': 'GB61', 'N39.0': 'GC08', 'N20.0': 'GB70', N40: 'GA90',
  // Muskuloskeletal
  'M10.9': 'FA25', 'M17.9': 'FA01', 'M06.9': 'FA20',
  // Saraf & jiwa
  'G43.9': '8A80', 'G40.9': '8A6Z', 'F32.9': '6A70', 'F41.1': '6B00', 'F41.0': '6B01', 'F20.9': '6A20',
  // Kulit
  'L20.9': 'EA80', 'L50.9': 'EB05', 'L70.0': 'ED80',
  // Darah & gizi
  'D50.9': '3A00',
  // Gejala umum
  'R50.9': 'MG26', R05: 'MD12',
}

export function icd11(code: string): string | undefined {
  return ICD11_MAP[code]
}

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
