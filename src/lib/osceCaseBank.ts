// ─────────────────────────────────────────────────────────────────────────────
// OSCE Case Bank — curated, deduplicated case topics by body system, compiled
// from a decade (2016-2026) of real OSCE UKMPPD exam recaps. Frequency is a
// rough "how often a variant of this case has appeared" signal, not an exact
// count — useful for prioritizing high-yield review, not a guarantee of what
// will appear on any specific exam sitting.
// ─────────────────────────────────────────────────────────────────────────────

export type OsceSystem =
  | 'Saraf (Neurologi)'
  | 'Psikiatri'
  | 'Indera (Mata/THT)'
  | 'Respirasi'
  | 'Kardiovaskular'
  | 'Gastrointestinal & Hepatobilier'
  | 'Ginjal & Saluran Kemih'
  | 'Obgyn'
  | 'Endokrin & Metabolik'
  | 'Hematologi, Imunologi & Infeksi'
  | 'Muskuloskeletal'
  | 'Integumen'

export interface OsceCase {
  system: OsceSystem
  name: string
  frequency: 'Sangat Sering' | 'Sering' | 'Kadang'
  note?: string
}

export const OSCE_CASES: OsceCase[] = [
  // Saraf (Neurologi)
  { system: 'Saraf (Neurologi)', name: 'BPPV (Benign Paroxysmal Positional Vertigo)', frequency: 'Sangat Sering', note: 'Kasus vertigo perifer paling sering muncul — kuasai Dix-Hallpike & Epley maneuver' },
  { system: 'Saraf (Neurologi)', name: "Bell's Palsy", frequency: 'Sangat Sering', note: 'Paresis N.VII perifer — bedakan dari sentral' },
  { system: 'Saraf (Neurologi)', name: 'Tension Type Headache (TTH)', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Cluster Headache', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Migrain (dengan/tanpa aura)', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Kejang Demam Sederhana (KDS)', frequency: 'Sering', note: 'Anak — edukasi orang tua jadi poin penilaian utama' },
  { system: 'Saraf (Neurologi)', name: 'Epilepsi', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Stroke Iskemik', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Stroke Hemoragik / TIA', frequency: 'Kadang' },
  { system: 'Saraf (Neurologi)', name: 'Meningitis / Meningoensefalitis', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'HNP / Low Back Pain', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Carpal Tunnel Syndrome (CTS)', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Tarsal Tunnel Syndrome', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Neuralgia Trigeminal', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Neuropati Perifer e.c. DM', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Parkinson Disease', frequency: 'Kadang' },
  { system: 'Saraf (Neurologi)', name: 'Meniere Disease', frequency: 'Sering' },
  { system: 'Saraf (Neurologi)', name: 'Myasthenia Gravis', frequency: 'Kadang' },
  { system: 'Saraf (Neurologi)', name: 'Guillain-Barré Syndrome', frequency: 'Kadang' },
  { system: 'Saraf (Neurologi)', name: 'Trauma Medulla Spinalis dengan Fraktur Kompresi', frequency: 'Kadang' },
  { system: 'Saraf (Neurologi)', name: 'Rabies / Tetanus', frequency: 'Kadang', note: 'Edukasi & pencegahan sering jadi fokus penilaian' },
  { system: 'Saraf (Neurologi)', name: 'Ensefalopati Hipertensi', frequency: 'Kadang' },

  // Psikiatri
  { system: 'Psikiatri', name: 'Post-Traumatic Stress Disorder (PTSD)', frequency: 'Sangat Sering', note: 'Status mental lengkap wajib didokumentasikan' },
  { system: 'Psikiatri', name: 'Gangguan Cemas Menyeluruh (GAD)', frequency: 'Sangat Sering' },
  { system: 'Psikiatri', name: 'Skizofrenia Paranoid', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Gangguan Afektif Bipolar (manik/depresi)', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Depresi (ringan/sedang/berat)', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Insomnia (primer/early/middle/late)', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Gangguan Waham Menetap', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Gangguan Psikotik Akut', frequency: 'Kadang' },
  { system: 'Psikiatri', name: 'Gangguan Panik', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Gangguan Somatisasi / Hipokondriasis', frequency: 'Sering' },
  { system: 'Psikiatri', name: 'Baby Blues / Depresi Postpartum', frequency: 'Kadang' },
  { system: 'Psikiatri', name: 'Trikotilomania', frequency: 'Kadang' },
  { system: 'Psikiatri', name: 'Skizoafektif', frequency: 'Kadang' },
  { system: 'Psikiatri', name: 'Intoksikasi Alkohol / Zat Psikoaktif', frequency: 'Kadang' },
  { system: 'Psikiatri', name: 'Disfungsi Ereksi e.c. Psikologis', frequency: 'Kadang' },

  // Indera
  { system: 'Indera (Mata/THT)', name: 'Konjungtivitis (bakteri/vernal/viral)', frequency: 'Sangat Sering' },
  { system: 'Indera (Mata/THT)', name: 'Hordeolum / Blefaritis', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Episkleritis / Keratitis', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi', frequency: 'Sangat Sering', note: 'Skill ekstraksi benda asing sering jadi station tindakan' },
  { system: 'Indera (Mata/THT)', name: 'Pterygium', frequency: 'Kadang' },
  { system: 'Indera (Mata/THT)', name: 'Glaukoma Akut Sudut Tertutup', frequency: 'Sering', note: 'Kegawatan mata — jangan sampai terlewat' },
  { system: 'Indera (Mata/THT)', name: 'Hifema', frequency: 'Kadang' },
  { system: 'Indera (Mata/THT)', name: 'Dakrioadenitis / Dakriosistitis', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Rhinitis Alergika', frequency: 'Sangat Sering' },
  { system: 'Indera (Mata/THT)', name: 'Sinusitis Maksilaris', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Tonsilitis (akut/kronis eksaserbasi)', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Faringitis Akut', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Otitis Media Akut (OMA) — semua stadium', frequency: 'Sangat Sering' },
  { system: 'Indera (Mata/THT)', name: 'Otitis Eksterna', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Serumen Prop / Mastoiditis', frequency: 'Kadang' },
  { system: 'Indera (Mata/THT)', name: 'Epistaksis Anterior — tindakan tampon', frequency: 'Sering' },
  { system: 'Indera (Mata/THT)', name: 'Abses Peritonsil', frequency: 'Kadang' },

  // Respirasi
  { system: 'Respirasi', name: 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi', frequency: 'Sangat Sering' },
  { system: 'Respirasi', name: 'PPOK Eksaserbasi Akut', frequency: 'Sangat Sering' },
  { system: 'Respirasi', name: 'Pneumonia (lobaris/aspirasi/CAP)', frequency: 'Sangat Sering' },
  { system: 'Respirasi', name: 'Bronkitis Akut', frequency: 'Sering' },
  { system: 'Respirasi', name: 'Bronkiolitis (anak)', frequency: 'Sering' },
  { system: 'Respirasi', name: 'Pertusis', frequency: 'Sering' },
  { system: 'Respirasi', name: 'Tuberkulosis Paru', frequency: 'Sering' },
  { system: 'Respirasi', name: 'Efusi Pleura Massive', frequency: 'Kadang' },
  { system: 'Respirasi', name: 'Bronkiektasis', frequency: 'Kadang' },
  { system: 'Respirasi', name: 'Abses Paru', frequency: 'Kadang' },
  { system: 'Respirasi', name: 'Laringitis Akut / Sindroma Croup', frequency: 'Kadang' },
  { system: 'Respirasi', name: 'Pneumotoraks (Tension/Terbuka) — needle decompression', frequency: 'Sering', note: 'Kegawatan trauma toraks — lokasi insersi needle decompression sering jadi poin penilaian' },
  { system: 'Respirasi', name: 'Hematotoraks & Flail Chest', frequency: 'Kadang' },

  // Kardiovaskular
  { system: 'Kardiovaskular', name: 'Syok Anafilaktik — tindakan resusitasi', frequency: 'Sangat Sering', note: 'Adrenalin IM dosis & lokasi injeksi sering jadi poin penilaian' },
  { system: 'Kardiovaskular', name: 'Syok Hipovolemik / Hemoragik — pasang IV line', frequency: 'Sangat Sering' },
  { system: 'Kardiovaskular', name: 'STEMI / NSTEMI / UAP — baca & interpretasi EKG', frequency: 'Sangat Sering' },
  { system: 'Kardiovaskular', name: 'Atrial Fibrilasi — baca EKG', frequency: 'Sangat Sering' },
  { system: 'Kardiovaskular', name: 'Supraventricular Tachycardia (SVT) — vagal maneuver', frequency: 'Sering' },
  { system: 'Kardiovaskular', name: 'Ventricular Ectopic (VES) — baca EKG', frequency: 'Sering' },
  { system: 'Kardiovaskular', name: 'Angina Pektoris Stabil', frequency: 'Sering' },
  { system: 'Kardiovaskular', name: 'CHF / ADHF / Cor Pulmonale', frequency: 'Sering' },
  { system: 'Kardiovaskular', name: 'Cardiac Arrest — RJP/BLS/ACLS', frequency: 'Sangat Sering', note: 'Skill resusitasi jantung paru wajib lancar' },
  { system: 'Kardiovaskular', name: 'Bradiaritmia / AV Block', frequency: 'Sering', note: 'Bedakan stabil vs tidak stabil — menentukan atropin vs pacemaker' },

  // GI & Hepatobilier
  { system: 'Gastrointestinal & Hepatobilier', name: 'Demam Tifoid', frequency: 'Sangat Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Hepatitis A / B', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Gastritis / Dispepsia / GERD', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Disentri (Amoeba / Basiler)', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Appendisitis Akut', frequency: 'Sangat Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Kolesistitis / Kolelitiasis', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Hemoroid Interna (berbagai grade)', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Ileus Obstruktif — pasang NGT', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Peritonitis', frequency: 'Kadang' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Ascariasis / Taeniasis / Amoebiasis (parasit)', frequency: 'Sering' },
  { system: 'Gastrointestinal & Hepatobilier', name: 'Hernia Inguinalis', frequency: 'Kadang' },

  // Ginjal & Saluran Kemih
  { system: 'Ginjal & Saluran Kemih', name: 'Sistitis Akut', frequency: 'Sangat Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Pielonefritis Akut', frequency: 'Sangat Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Glomerulonefritis Akut Pasca-Streptokokus (GNAPS)', frequency: 'Sangat Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis', frequency: 'Sangat Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter', frequency: 'Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Sindrom Nefrotik / Sindrom Nefritik', frequency: 'Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Fimosis / Parafimosis — tindakan sirkumsisi', frequency: 'Sering' },
  { system: 'Ginjal & Saluran Kemih', name: 'Prostatitis', frequency: 'Kadang' },

  // Obgyn
  { system: 'Obgyn', name: 'ANC Normal (Antenatal Care)', frequency: 'Sangat Sering' },
  { system: 'Obgyn', name: 'Ketuban Pecah Dini (KPD)', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Abortus Imminens / Inkomplit', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Mastitis / Cracked Nipple', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Bakterial Vaginosis (BV)', frequency: 'Sangat Sering' },
  { system: 'Obgyn', name: 'Kandidiasis Vulvovaginalis', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Servisitis / Uretritis Gonore', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Pelvic Inflammatory Disease (PID)', frequency: 'Kadang' },
  { system: 'Obgyn', name: 'Hiperemesis Gravidarum (HEG)', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Preeklamsia Berat (PEB) / Impending Eklamsia', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Asuhan Persalinan Normal (APN 60 langkah)', frequency: 'Sangat Sering', note: 'Skill wajib — hafal urutan 60 langkah APN' },
  { system: 'Obgyn', name: 'Kista Bartholin / Bartholinitis', frequency: 'Sering' },
  { system: 'Obgyn', name: 'Suspek Ca Serviks — IVA test / Pap smear', frequency: 'Sangat Sering' },
  { system: 'Obgyn', name: 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)', frequency: 'Sangat Sering' },
  { system: 'Obgyn', name: 'Endometritis', frequency: 'Kadang' },

  // Endokrin & Metabolik
  { system: 'Endokrin & Metabolik', name: 'DM Tipe 2 (edukasi & tatalaksana)', frequency: 'Sangat Sering' },
  { system: 'Endokrin & Metabolik', name: 'Ketoasidosis Diabetik (KAD) — resusitasi cairan', frequency: 'Sangat Sering' },
  { system: 'Endokrin & Metabolik', name: 'Hyperosmolar Hyperglycemic State (HHS/HONK) — resusitasi cairan', frequency: 'Sering' },
  { system: 'Endokrin & Metabolik', name: 'Sindrom Metabolik', frequency: 'Sangat Sering' },
  { system: 'Endokrin & Metabolik', name: 'Dislipidemia', frequency: 'Sering' },
  { system: 'Endokrin & Metabolik', name: "Goiter Endemik / Grave's Disease / Hipertiroid", frequency: 'Sangat Sering' },
  { system: 'Endokrin & Metabolik', name: 'Hipotiroid Primer', frequency: 'Kadang' },
  { system: 'Endokrin & Metabolik', name: 'Obesitas (berbagai grade)', frequency: 'Sering' },
  { system: 'Endokrin & Metabolik', name: 'Marasmus / Kwashiorkor (gizi buruk anak)', frequency: 'Sangat Sering' },
  { system: 'Endokrin & Metabolik', name: 'Imunisasi & Interpretasi KMS/Tumbang (anak)', frequency: 'Sangat Sering', note: 'Skill konseling imunisasi rutin muncul di hampir tiap periode' },

  // Hematologi, Imunologi & Infeksi
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Dengue Hemorrhagic Fever (DHF) — semua grade', frequency: 'Sangat Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Malaria (falciparum/vivax) — apus darah tebal/tipis', frequency: 'Sangat Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Anemia Defisiensi Besi', frequency: 'Sangat Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Thalassemia', frequency: 'Kadang' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Leptospirosis / Weil Disease', frequency: 'Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Filariasis', frequency: 'Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Rheumatoid Arthritis (RA)', frequency: 'Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Systemic Lupus Erythematosus (SLE)', frequency: 'Sering' },
  { system: 'Hematologi, Imunologi & Infeksi', name: 'Autoimmune Hemolytic Anemia (AIHA)', frequency: 'Kadang' },

  // Muskuloskeletal
  { system: 'Muskuloskeletal', name: 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai', frequency: 'Sangat Sering', note: 'Skill pemasangan bidai/mitela sering jadi station tindakan' },
  { system: 'Muskuloskeletal', name: 'Ankle Sprain / Knee Sprain', frequency: 'Sering' },
  { system: 'Muskuloskeletal', name: 'Gout Artritis', frequency: 'Sangat Sering' },
  { system: 'Muskuloskeletal', name: 'Osteoarthritis (OA)', frequency: 'Sering' },
  { system: 'Muskuloskeletal', name: 'Dislokasi Patela', frequency: 'Kadang' },
  { system: 'Muskuloskeletal', name: 'Ruptur Tendon Achilles', frequency: 'Kadang' },

  // Integumen
  { system: 'Integumen', name: 'Tinea Corporis', frequency: 'Sering' },
  { system: 'Integumen', name: 'Dermatitis Atopik', frequency: 'Sering' },
  { system: 'Integumen', name: 'Dermatitis Seboroik', frequency: 'Sering' },
  { system: 'Integumen', name: 'Dermatitis Venenata / Kontak', frequency: 'Sering' },
  { system: 'Integumen', name: 'Kandidiasis Intertriginosa', frequency: 'Kadang' },
  { system: 'Integumen', name: 'Insect Bite / Fixed Drug Eruption', frequency: 'Kadang' },
  { system: 'Integumen', name: 'Herpes Simplex / Herpes Zoster', frequency: 'Sering' },
]

export const OSCE_SYSTEMS: OsceSystem[] = [
  'Saraf (Neurologi)',
  'Psikiatri',
  'Indera (Mata/THT)',
  'Respirasi',
  'Kardiovaskular',
  'Gastrointestinal & Hepatobilier',
  'Ginjal & Saluran Kemih',
  'Obgyn',
  'Endokrin & Metabolik',
  'Hematologi, Imunologi & Infeksi',
  'Muskuloskeletal',
  'Integumen',
]
