// ─────────────────────────────────────────────────────────────────────────────
// SKDI Clinical Skills Checklist — the official competency-level (1-4) list
// for every physical-exam maneuver, diagnostic procedure, and clinical skill
// an Indonesian medical graduate is expected to master, per Standar Kompetensi
// Dokter Indonesia (SKDI), Konsil Kedokteran Indonesia 2019.
//
// Level guide:
//   1 = knows the theory only (Mengetahui dan menjelaskan)
//   2 = has seen/observed the skill performed (Pernah melihat/didemonstrasikan)
//   3A = can perform under supervision, non-emergency (Bukan gawat darurat)
//   3B = can perform under supervision, emergency setting (Gawat darurat)
//   4A = can perform independently, most cases (Mandiri, tuntas)
//   4  = can perform independently (used interchangeably with 4A in the source)
// ─────────────────────────────────────────────────────────────────────────────

export type SkillSystem =
  | 'Gastrointestinal'
  | 'Ginjal dan Saluran Kemih'
  | 'Hematologi dan Imunologi'
  | 'Indera'
  | 'Kardiovaskular'
  | 'Kulit dan Integumen'
  | 'Muskuloskeletal'
  | 'Psikiatri'
  | 'Reproduksi'
  | 'Obstetri'
  | 'Respirasi'
  | 'Saraf'
  | 'Endokrin, Metabolisme dan Nutrisi'
  | 'Anak'
  | 'Dewasa'
  | 'Kegawatdaruratan'
  | 'Komunikasi'
  | 'Pelayanan Paliatif'
  | 'Forensik dan Medikolegal'

export interface SkillEntry {
  system: SkillSystem
  skill: string
  level: string
}

export const SKDI_SKILLS: SkillEntry[] = [
  // ─── Gastrointestinal ──────────────────────────────────────────────────
  { system: 'Gastrointestinal', skill: 'Inspeksi bibir dan kavitas oral', level: '4' },
  { system: 'Gastrointestinal', skill: 'Inspeksi tonsil', level: '4' },
  { system: 'Gastrointestinal', skill: 'Penilaian pergerakan otot-otot hipoglosus', level: '4' },
  { system: 'Gastrointestinal', skill: 'Inspeksi abdomen', level: '4' },
  { system: 'Gastrointestinal', skill: 'Inspeksi lipat paha/inguinal saat tekanan abdomen meningkat', level: '4' },
  { system: 'Gastrointestinal', skill: 'Palpasi abdomen (dinding perut, kolon, hepar, lien, aorta, rigiditas)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Palpasi hernia', level: '4' },
  { system: 'Gastrointestinal', skill: 'Nyeri tekan dan nyeri lepas (Blumberg test)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Pemeriksaan Psoas sign', level: '4' },
  { system: 'Gastrointestinal', skill: 'Pemeriksaan Obturator sign', level: '4' },
  { system: 'Gastrointestinal', skill: 'Perkusi (pekak hati dan area Traube)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Pemeriksaan pekak beralih (shifting dullness)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Pemeriksaan undulasi (fluid thrill)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Colok dubur (digital rectal examination)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Palpasi sacrum', level: '4' },
  { system: 'Gastrointestinal', skill: 'Rovsing sign', level: '4' },
  { system: 'Gastrointestinal', skill: 'Pemasangan pipa nasogastrik (NGT)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Endoskopi', level: '2' },
  { system: 'Gastrointestinal', skill: 'Nasogastric suction', level: '4' },
  { system: 'Gastrointestinal', skill: 'Mengganti kantong kolostomi', level: '4' },
  { system: 'Gastrointestinal', skill: 'Enema', level: '4' },
  { system: 'Gastrointestinal', skill: 'Biopsi hepar', level: '1' },
  { system: 'Gastrointestinal', skill: 'Pengambilan cairan asites', level: '3' },
  { system: 'Gastrointestinal', skill: 'Interpretasi X-ray abdomen', level: '4' },
  { system: 'Gastrointestinal', skill: 'Interpretasi colon in loop', level: '2' },
  { system: 'Gastrointestinal', skill: 'Percutaneous Transhepatic Biliary Drainage (PTBD)', level: '1' },
  { system: 'Gastrointestinal', skill: 'MRI abdomen', level: '1' },
  { system: 'Gastrointestinal', skill: 'CT scan abdomen', level: '1' },
  { system: 'Gastrointestinal', skill: 'USG abdomen', level: '2' },
  { system: 'Gastrointestinal', skill: 'USG FAST', level: '3' },
  { system: 'Gastrointestinal', skill: 'PET scan abdomen', level: '1' },
  { system: 'Gastrointestinal', skill: 'Anuskopi', level: '4' },
  { system: 'Gastrointestinal', skill: 'Anal swab', level: '4' },
  { system: 'Gastrointestinal', skill: 'Identifikasi parasit & pemeriksaan feses (darah samar, protozoa, cacing)', level: '4' },
  { system: 'Gastrointestinal', skill: 'Proktoskopi', level: '2' },

  // ─── Ginjal dan Saluran Kemih ──────────────────────────────────────────
  { system: 'Ginjal dan Saluran Kemih', skill: 'Pemeriksaan bimanual ginjal', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Pemeriksaan nyeri ketok ginjal (CVA tenderness)', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Perkusi kandung kemih', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Refleks bulbocavernosus', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Uroflowmetri', level: '1' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Interpretasi BNO-IVP', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'USG ginjal', level: '1' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Biopsi ginjal', level: '1' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Kateter uretra', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Sirkumsisi', level: '4' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Dialisis ginjal', level: '3' },
  { system: 'Ginjal dan Saluran Kemih', skill: 'Clean intermittent catheterization / neurogenic bladder', level: '3' },

  // ─── Hematologi dan Imunologi ──────────────────────────────────────────
  { system: 'Hematologi dan Imunologi', skill: 'Palpasi kelenjar limfe', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Morfologi sel darah (apusan)', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Darah lengkap/rutin', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Profil pembekuan darah', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'LED/KED', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Permintaan pemeriksaan hematologi lengkap', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Permintaan pemeriksaan imunologi', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Skin test obat injeksi', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Golongan darah & inkompatibilitas', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Interpretasi uji inkompatibilitas', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Penanganan awal reaksi transfusi', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Konseling anemia defisiensi besi/thalasemia/HIV', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Indikasi & jenis transfusi', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Transfusi darah anak/neonatus', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Imunisasi/vaksinasi', level: '4' },
  { system: 'Hematologi dan Imunologi', skill: 'Bone marrow puncture', level: '2' },

  // ─── Indera ────────────────────────────────────────────────────────────
  { system: 'Indera', skill: 'Ketajaman penglihatan', level: '4' },
  { system: 'Indera', skill: 'Refraksi subjektif', level: '4' },
  { system: 'Indera', skill: 'Lapang pandang (confrontation)', level: '4' },
  { system: 'Indera', skill: 'Inspeksi kelopak mata & eversi kelopak atas', level: '4' },
  { system: 'Indera', skill: 'Hirschberg test & cover-uncover test', level: '4' },
  { system: 'Indera', skill: 'Pupil: inspeksi & reaksi cahaya', level: '4' },
  { system: 'Indera', skill: 'Fundoskopi (refleks & vaskular)', level: '4' },
  { system: 'Indera', skill: 'Tonometri Schiötz (palpasi TIO)', level: '4' },
  { system: 'Indera', skill: 'Tonometer aplanasi/non-contact', level: '2' },
  { system: 'Indera', skill: 'Ishihara color vision test', level: '4' },
  { system: 'Indera', skill: 'Slit-lamp examination', level: '2' },
  { system: 'Indera', skill: 'Otoskop aurikular/meatus & membran timpani', level: '4' },
  { system: 'Indera', skill: 'Garpu tala (Weber/Rinne/Schwabach)', level: '4' },
  { system: 'Indera', skill: 'Audiometri (interpretasi)', level: '3' },
  { system: 'Indera', skill: 'Timpanometri', level: '2' },
  { system: 'Indera', skill: 'Rinoskopi anterior', level: '4' },
  { system: 'Indera', skill: 'Transiluminasi sinus', level: '4' },
  { system: 'Indera', skill: 'Nasofaringoskopi', level: '2' },
  { system: 'Indera', skill: 'Resep kacamata refraksi ringan', level: '3' },
  { system: 'Indera', skill: 'Eversi kelopak & bersihkan benda asing konjungtiva/kornea', level: '4' },
  { system: 'Indera', skill: 'Bedah kelopak mata minor (chalazion/entropion/ectropion/ptosis)', level: '2' },
  { system: 'Indera', skill: 'Operasi katarak', level: '2' },
  { system: 'Indera', skill: 'Manuver Politzer & Valsalva (tuba eustachius)', level: '4' },
  { system: 'Indera', skill: 'Pengambilan serumen', level: '4' },
  { system: 'Indera', skill: 'Benda asing telinga', level: '3B' },
  { system: 'Indera', skill: 'Hentikan perdarahan hidung anterior (tampon anterior)', level: '4' },
  { system: 'Indera', skill: 'Benda asing hidung', level: '3B' },
  { system: 'Indera', skill: 'Tampon posterior (Bellocq)', level: '3' },

  // ─── Kardiovaskular ────────────────────────────────────────────────────
  { system: 'Kardiovaskular', skill: 'Anamnesis keluhan kardiovaskular & faktor risiko', level: '4' },
  { system: 'Kardiovaskular', skill: 'Inspeksi & palpasi apeks jantung', level: '4' },
  { system: 'Kardiovaskular', skill: 'Palpasi arteri karotis', level: '4' },
  { system: 'Kardiovaskular', skill: 'Perkusi ukuran jantung', level: '4' },
  { system: 'Kardiovaskular', skill: 'Auskultasi jantung', level: '4' },
  { system: 'Kardiovaskular', skill: 'Pengukuran tekanan darah', level: '4' },
  { system: 'Kardiovaskular', skill: 'Tekanan vena jugularis (JVP)', level: '4' },
  { system: 'Kardiovaskular', skill: 'Capillary refill time', level: '4' },
  { system: 'Kardiovaskular', skill: 'Deteksi bruit vaskular', level: '4' },
  { system: 'Kardiovaskular', skill: "Trendelenburg test, Carvallo's sign", level: '4' },
  { system: 'Kardiovaskular', skill: "Perthes test, Homan's sign", level: '3' },
  { system: 'Kardiovaskular', skill: 'Ankle-Brachial Index (ABI)', level: '3' },
  { system: 'Kardiovaskular', skill: 'Pemasangan & interpretasi dasar EKG', level: '4' },
  { system: 'Kardiovaskular', skill: 'Exercise ECG (treadmill test)', level: '2' },
  { system: 'Kardiovaskular', skill: 'Ekokardiografi', level: '2' },
  { system: 'Kardiovaskular', skill: 'USG Doppler / TCD', level: '2' },
  { system: 'Kardiovaskular', skill: 'CT cardiac / angiografi / kateterisasi jantung', level: '1' },
  { system: 'Kardiovaskular', skill: 'Pulse oximetry', level: '4' },
  { system: 'Kardiovaskular', skill: 'Ambulatory BP monitoring / Holter monitor', level: '2' },
  { system: 'Kardiovaskular', skill: 'Heparinisasi', level: '4' },
  { system: 'Kardiovaskular', skill: 'Defibrilasi manual/otomatik (AED)', level: '4' },
  { system: 'Kardiovaskular', skill: 'Kardioversi', level: '4' },
  { system: 'Kardiovaskular', skill: 'Vagal maneuver / massage karotis', level: '4' },

  // ─── Kulit dan Integumen ───────────────────────────────────────────────
  { system: 'Kulit dan Integumen', skill: 'Inspeksi kulit dengan kaca pembesar & Wood\'s lamp', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Dermografisme', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Deskripsi lesi kulit', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Rambut & skalp / pull test', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Pemeriksaan ZN/KOH/Giemsa/Gram', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Punch biopsy', level: '2' },
  { system: 'Kulit dan Integumen', skill: 'Patch test & prick test', level: '2' },
  { system: 'Kulit dan Integumen', skill: 'Sensibilitas saraf tepi (kusta/MH)', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Tanda khusus (Koebner, tetesan lilin, Auspitz)', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Insisi drainase abses', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Insisi drainase bursa/ganglion/lipoma/kista aterom', level: '2' },
  { system: 'Kulit dan Integumen', skill: 'Cryotherapy veruka vulgaris', level: '3' },
  { system: 'Kulit dan Integumen', skill: 'Eksisi tumor jinak kulit', level: '2' },
  { system: 'Kulit dan Integumen', skill: 'Perawatan luka akut sederhana', level: '4' },
  { system: 'Kulit dan Integumen', skill: 'Perawatan luka akut kompleks / luka kronis', level: '3' },
  { system: 'Kulit dan Integumen', skill: 'Sclerotherapy & bebat kompresi varises', level: '2' },
  { system: 'Kulit dan Integumen', skill: 'Contact tracing PMS/kulit', level: '4' },

  // ─── Muskuloskeletal ───────────────────────────────────────────────────
  { system: 'Muskuloskeletal', skill: 'Inspeksi gait, postur tulang belakang, tonus otot', level: '4' },
  { system: 'Muskuloskeletal', skill: 'ROM sendi ekstremitas & tulang belakang', level: '4' },
  { system: 'Muskuloskeletal', skill: 'Ligamen krusiatus/kolateral lutut', level: '4' },
  { system: 'Muskuloskeletal', skill: 'Tes meniscus', level: '3' },
  { system: 'Muskuloskeletal', skill: 'Tes fungsi pergelangan tangan (Phalen/Tinel/Luthy/Finkelstein)', level: '4' },
  { system: 'Muskuloskeletal', skill: 'X-ray trauma musculoskeletal', level: '4' },
  { system: 'Muskuloskeletal', skill: 'CT/MRI/bone scan musculoskeletal', level: '1' },
  { system: 'Muskuloskeletal', skill: 'Interpretasi bone mineral density (BMD)', level: '3' },
  { system: 'Muskuloskeletal', skill: 'Reposisi fraktur tertutup', level: '3' },
  { system: 'Muskuloskeletal', skill: 'Stabilisasi fraktur tanpa gips (bidai)', level: '4' },
  { system: 'Muskuloskeletal', skill: 'Reduksi dislokasi', level: '3' },
  { system: 'Muskuloskeletal', skill: 'Dressing (sling/bandage)', level: '4' },
  { system: 'Muskuloskeletal', skill: 'Aspirasi sendi', level: '3' },
  { system: 'Muskuloskeletal', skill: 'Removal of splinter', level: '3' },

  // ─── Psikiatri ─────────────────────────────────────────────────────────
  { system: 'Psikiatri', skill: 'Autoanamnesis & alloanamnesis', level: '4' },
  { system: 'Psikiatri', skill: 'Deskripsi status mental lengkap', level: '4' },
  { system: 'Psikiatri', skill: 'Penilaian kesadaran, persepsi, orientasi', level: '4' },
  { system: 'Psikiatri', skill: 'Bentuk/isi pikir, mood/afek', level: '4' },
  { system: 'Psikiatri', skill: 'Pengendalian impuls, judgement, insight (tilikan)', level: '4' },
  { system: 'Psikiatri', skill: 'GAF & diagnosis multiaksial', level: '4' },
  { system: 'Psikiatri', skill: 'Kedaruratan psikiatrik', level: '4' },
  { system: 'Psikiatri', skill: 'Terapi psikofarmaka & manajemen efek samping', level: '4' },
  { system: 'Psikiatri', skill: 'ECT (electroconvulsive therapy)', level: '1' },
  { system: 'Psikiatri', skill: 'Terapi suportif, psikoedukasi', level: '4' },
  { system: 'Psikiatri', skill: 'Manajemen perilaku gaduh gelisah', level: '4' },
  { system: 'Psikiatri', skill: 'Cognitive Behavioral Therapy (CBT)', level: '2' },
  { system: 'Psikiatri', skill: 'Psikoterapi psikoanalitik / hipnoterapi', level: '1' },
  { system: 'Psikiatri', skill: 'Terapi kelompok / terapi keluarga', level: '2' },
  { system: 'Psikiatri', skill: 'Pendekatan psikosomatik', level: '3' },

  // ─── Reproduksi ────────────────────────────────────────────────────────
  { system: 'Reproduksi', skill: 'Pemeriksaan genitalia eksterna pria/wanita', level: '4' },
  { system: 'Reproduksi', skill: 'Inspeksi/palpasi payudara', level: '4' },
  { system: 'Reproduksi', skill: 'Pemeriksaan spekulum (vagina/serviks)', level: '4' },
  { system: 'Reproduksi', skill: 'Pemeriksaan bimanual (vagina/serviks/uterus/ovarium)', level: '4' },
  { system: 'Reproduksi', skill: 'Pemeriksaan rektal (Douglas/uterus/adneksa)', level: '3' },
  { system: 'Reproduksi', skill: 'Swab vagina & duh genital (pH/Gram/salin/KOH)', level: '4' },
  { system: 'Reproduksi', skill: 'Pap smear & IVA', level: '4' },
  { system: 'Reproduksi', skill: 'Kolposkopi', level: '2' },
  { system: 'Reproduksi', skill: 'Kuretase', level: '2' },
  { system: 'Reproduksi', skill: 'Laparoskopi diagnostik', level: '1' },
  { system: 'Reproduksi', skill: 'USG transvaginal', level: '1' },
  { system: 'Reproduksi', skill: 'Insisi abses Bartholini', level: '2' },
  { system: 'Reproduksi', skill: 'Insersi pessarium', level: '3' },
  { system: 'Reproduksi', skill: 'Konseling kontrasepsi', level: '4' },
  { system: 'Reproduksi', skill: 'Insersi/ekstraksi IUD', level: '4' },
  { system: 'Reproduksi', skill: 'Insersi/ekstraksi implan', level: '4' },
  { system: 'Reproduksi', skill: 'Penanganan komplikasi KB', level: '4' },

  // ─── Obstetri ──────────────────────────────────────────────────────────
  { system: 'Obstetri', skill: 'Identifikasi kehamilan risiko & konseling prakonsepsi', level: '4' },
  { system: 'Obstetri', skill: 'Antenatal care (ANC)', level: '4' },
  { system: 'Obstetri', skill: 'Leopold maneuver', level: '4' },
  { system: 'Obstetri', skill: 'Denyut jantung janin (DJJ)', level: '4' },
  { system: 'Obstetri', skill: 'Pelvimetri klinis', level: '4' },
  { system: 'Obstetri', skill: 'Cardiotocography (CTG)', level: '3' },
  { system: 'Obstetri', skill: 'USG dasar obstetri', level: '3' },
  { system: 'Obstetri', skill: 'Amniosentesis / chorionic villus sampling', level: '1' },
  { system: 'Obstetri', skill: 'Penilaian usia gestasi & dilatasi serviks', level: '4' },
  { system: 'Obstetri', skill: 'Asuhan Persalinan Normal (APN)', level: '4' },
  { system: 'Obstetri', skill: 'Penilaian bayi baru lahir (napas/tonus/Apgar)', level: '4' },
  { system: 'Obstetri', skill: 'Potong & rawat tali pusat, injeksi vitamin K, salep mata, HB0', level: '4' },
  { system: 'Obstetri', skill: 'Episiotomi & jahit episiotomi derajat 1 & 2', level: '4' },
  { system: 'Obstetri', skill: 'Inisiasi Menyusui Dini (IMD)', level: '4' },
  { system: 'Obstetri', skill: 'Ekstraksi vakum rendah', level: '3' },
  { system: 'Obstetri', skill: 'Kompresi bimanual (atonia uteri)', level: '4' },
  { system: 'Obstetri', skill: 'Anestesi epidural / pudendal', level: '1' },
  { system: 'Obstetri', skill: 'Jahit laserasi derajat 3 & 4', level: '2' },
  { system: 'Obstetri', skill: 'Induksi persalinan kimiawi', level: '3' },
  { system: 'Obstetri', skill: 'Presentasi bokong', level: '3' },
  { system: 'Obstetri', skill: 'Operasi Caesar', level: '1' },
  { system: 'Obstetri', skill: 'Plasenta manual & distosia bahu', level: '3' },
  { system: 'Obstetri', skill: 'Stabilisasi perdarahan post partum', level: '3B' },
  { system: 'Obstetri', skill: 'Stabilisasi eklampsia', level: '3B' },
  { system: 'Obstetri', skill: 'Manajemen laktasi & konseling menyusui', level: '4' },
  { system: 'Obstetri', skill: 'Perawatan bayi prematur / metode kanguru', level: '4' },
  { system: 'Obstetri', skill: 'Stabilisasi bayi pra-rujukan', level: '4' },

  // ─── Respirasi ─────────────────────────────────────────────────────────
  { system: 'Respirasi', skill: 'Inspeksi leher & palpasi kelenjar tiroid', level: '4' },
  { system: 'Respirasi', skill: 'Rhinoskopi posterior', level: '3' },
  { system: 'Respirasi', skill: 'Laringoskopi indirek/direk', level: '3' },
  { system: 'Respirasi', skill: 'Inspeksi/palpasi/perkusi/auskultasi toraks', level: '4' },
  { system: 'Respirasi', skill: 'Throat swab & sputum Gram/ZN', level: '4' },
  { system: 'Respirasi', skill: 'Pleural tap', level: '4' },
  { system: 'Respirasi', skill: 'Spirometri dasar & uji bronkodilator', level: '4' },
  { system: 'Respirasi', skill: 'Interpretasi rontgen toraks', level: '4' },
  { system: 'Respirasi', skill: 'Mantoux test (tuberkulin)', level: '4' },
  { system: 'Respirasi', skill: 'Arus puncak ekspirasi (peak flow)', level: '4' },
  { system: 'Respirasi', skill: 'Biopsi jarum halus KGB', level: '4' },
  { system: 'Respirasi', skill: 'Biopsi pleura', level: '2' },
  { system: 'Respirasi', skill: 'Polisomnografi', level: '2' },
  { system: 'Respirasi', skill: 'Trakeostomi / krikotiroidektomi', level: '3' },
  { system: 'Respirasi', skill: 'Dekompresi jarum pneumotoraks', level: '4' },
  { system: 'Respirasi', skill: 'Pemasangan & perawatan WSD', level: '4' },
  { system: 'Respirasi', skill: 'Terapi inhalasi/nebulisasi & terapi oksigen', level: '4' },
  { system: 'Respirasi', skill: 'Non-invasive ventilation (NIV)', level: '2' },
  { system: 'Respirasi', skill: 'Tatalaksana hemoptisis', level: '3B' },
  { system: 'Respirasi', skill: 'Edukasi berhenti merokok', level: '4' },

  // ─── Saraf ─────────────────────────────────────────────────────────────
  { system: 'Saraf', skill: 'Pemeriksaan pupil, gerakan bola mata, refleks kornea', level: '4' },
  { system: 'Saraf', skill: 'Pemeriksaan 12 saraf kranial', level: '4' },
  { system: 'Saraf', skill: 'Refleks Gag', level: '3' },
  { system: 'Saraf', skill: 'Tonus, kekuatan, dan trofi otot', level: '4' },
  { system: 'Saraf', skill: 'Tes Fukuda, past-pointing, Romberg (dan dipertajam)', level: '4' },
  { system: 'Saraf', skill: 'Tes telunjuk-hidung, tumit-lutut, disdiadokinesis', level: '4' },
  { system: 'Saraf', skill: 'Sensasi nyeri, suhu, raba halus, proprioseptif, getar', level: '4' },
  { system: 'Saraf', skill: 'Glasgow Coma Scale (GCS)', level: '4' },
  { system: 'Saraf', skill: 'Penilaian afasia', level: '3' },
  { system: 'Saraf', skill: 'Apraksia & agnosia', level: '2' },
  { system: 'Saraf', skill: 'Refleks tendon, abdominal, kremaster, anal', level: '4' },
  { system: 'Saraf', skill: 'Refleks primitif (rooting, grasp, glabella, palmomental, snout)', level: '4' },
  { system: 'Saraf', skill: 'Refleks patologis (Hoffmann-Tromner, Babinski/plantar response)', level: '4' },
  { system: 'Saraf', skill: 'Kaku kuduk, Lasegue, Kernig, Brudzinski I & II', level: '4' },
  { system: 'Saraf', skill: 'Patrick & kontra-Patrick, Chvostek sign', level: '4' },
  { system: 'Saraf', skill: 'CT-scan otak / EEG / EMG-EMNG', level: '2' },
  { system: 'Saraf', skill: 'MRI / PET / SPECT / angiografi sistem saraf', level: '1' },
  { system: 'Saraf', skill: 'Punksi lumbal / spinal tap terapeutik', level: '2' },

  // ─── Endokrin, Metabolisme dan Nutrisi ─────────────────────────────────
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Anamnesis dietary recall', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Palpasi kelenjar tiroid', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Status gizi/antropometri', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Gula darah point-of-care & glukosa urin (Benedict)', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Pengaturan diet DM tanpa komplikasi', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Insulin & tatalaksana DM tipe 2 tanpa komplikasi', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Konseling metabolisme/endokrin', level: '4' },
  { system: 'Endokrin, Metabolisme dan Nutrisi', skill: 'Sidik kelenjar tiroid / uji tangkap tiroid', level: '1' },

  // ─── Anak (Lain-Lain) ──────────────────────────────────────────────────
  { system: 'Anak', skill: 'Anamnesis pihak ketiga & riwayat kelahiran/imunisasi', level: '4' },
  { system: 'Anak', skill: 'Pemeriksaan fisik bayi baru lahir & Apgar score', level: '4' },
  { system: 'Anak', skill: 'Palpasi fontanella', level: '4' },
  { system: 'Anak', skill: 'Refleks moro, melangkah, tonic neck reflex', level: '4' },
  { system: 'Anak', skill: 'Antropometri & tumbuh kembang anak', level: '4' },
  { system: 'Anak', skill: 'Tes fungsi paru anak', level: '2' },
  { system: 'Anak', skill: 'USG kranial / punksi lumbal anak', level: '1' },
  { system: 'Anak', skill: 'Tatalaksana BBLR tanpa komplikasi', level: '4' },
  { system: 'Anak', skill: 'Tatalaksana BBLR dengan komplikasi & bayi infeksi', level: '3' },
  { system: 'Anak', skill: 'Resep makanan bayi normal & gizi buruk', level: '4' },
  { system: 'Anak', skill: 'Punksi vena & kanula vena perifer anak', level: '4' },
  { system: 'Anak', skill: 'Kanulasi intraoseus', level: '3' },
  { system: 'Anak', skill: 'Perhitungan kalori bayi / MPASI', level: '3' },
  { system: 'Anak', skill: 'Keracunan umum anak', level: '4' },
  { system: 'Anak', skill: 'Tersedak, jalan napas, oksigen, anak tidak sadar', level: '4' },
  { system: 'Anak', skill: 'Infus syok & dehidrasi berat kegawatdaruratan', level: '4' },
  { system: 'Anak', skill: 'Resusitasi bayi baru lahir', level: '4' },
  { system: 'Anak', skill: 'Tatalaksana kejang', level: '4' },

  // ─── Dewasa (Lain-Lain) ────────────────────────────────────────────────
  { system: 'Dewasa', skill: 'Universal precaution', level: '4' },
  { system: 'Dewasa', skill: 'Punksi vena / punksi arteri / finger prick', level: '4' },
  { system: 'Dewasa', skill: 'Interpretasi AGD (analisis gas darah)', level: '4' },
  { system: 'Dewasa', skill: 'Resep obat rasional & edukasi obat', level: '4' },
  { system: 'Dewasa', skill: 'Keracunan umum & khusus dewasa', level: '4' },
  { system: 'Dewasa', skill: 'Injeksi (IC/IV/SC/IM)', level: '4' },
  { system: 'Dewasa', skill: 'Persiapan operasi minor & asisten kamar operasi', level: '4' },
  { system: 'Dewasa', skill: 'Anestesi infiltrasi & blok saraf lokal', level: '4' },
  { system: 'Dewasa', skill: 'Jahit luka & angkat jahitan', level: '4' },
  { system: 'Dewasa', skill: 'Perawatan luka / dressing & ekstraksi kuku', level: '4' },
  { system: 'Dewasa', skill: 'Radioterapi eksterna / brakhiterapi', level: '1' },

  // ─── Kegawatdaruratan (Lain-Lain) ──────────────────────────────────────
  { system: 'Kegawatdaruratan', skill: 'Bantuan hidup dasar (BLS)', level: '4' },
  { system: 'Kegawatdaruratan', skill: 'Ventilasi masker & intubasi', level: '4' },
  { system: 'Kegawatdaruratan', skill: 'Transport pasien', level: '4' },
  { system: 'Kegawatdaruratan', skill: 'Manuver Heimlich', level: '4' },
  { system: 'Kegawatdaruratan', skill: 'Resusitasi cairan', level: '4' },
  { system: 'Kegawatdaruratan', skill: 'Turgor kulit / penilaian dehidrasi', level: '4' },

  // ─── Komunikasi (Lain-Lain) ────────────────────────────────────────────
  { system: 'Komunikasi', skill: 'Komunikasi lisan/tulisan & edukasi individu/kelompok', level: '4' },
  { system: 'Komunikasi', skill: 'Rencana manajemen kesehatan & konsultasi terapi', level: '4' },
  { system: 'Komunikasi', skill: 'Komunikasi antar sejawat/rujukan', level: '4' },
  { system: 'Komunikasi', skill: 'Rekam medik & pelaporan', level: '4' },
  { system: 'Komunikasi', skill: 'Komunikasi patient-centered care & mendengar aktif', level: '4' },
  { system: 'Komunikasi', skill: 'Menyampaikan berita buruk', level: '4' },

  // ─── Pelayanan Paliatif (Lain-Lain) ────────────────────────────────────
  { system: 'Pelayanan Paliatif', skill: 'Manajemen nyeri akut/kronik', level: '4' },
  { system: 'Pelayanan Paliatif', skill: 'Evaluasi/tatalaksana gejala paliatif', level: '4' },
  { system: 'Pelayanan Paliatif', skill: 'Penanganan psikososial/spiritual/kultural', level: '4' },
  { system: 'Pelayanan Paliatif', skill: 'Instruksi advance directive', level: '4' },
  { system: 'Pelayanan Paliatif', skill: 'Tatalaksana kasus terminal', level: '3' },
  { system: 'Pelayanan Paliatif', skill: 'Pengorganisasian rujukan paliatif', level: '4' },

  // ─── Forensik dan Medikolegal (Lain-Lain) ──────────────────────────────
  { system: 'Forensik dan Medikolegal', skill: 'Prosedur medikolegal', level: '4' },
  { system: 'Forensik dan Medikolegal', skill: 'Pembuatan Visum et Repertum', level: '4' },
]

export const SKILL_SYSTEMS: SkillSystem[] = [
  'Saraf',
  'Psikiatri',
  'Indera',
  'Respirasi',
  'Kardiovaskular',
  'Gastrointestinal',
  'Ginjal dan Saluran Kemih',
  'Reproduksi',
  'Obstetri',
  'Endokrin, Metabolisme dan Nutrisi',
  'Hematologi dan Imunologi',
  'Muskuloskeletal',
  'Kulit dan Integumen',
  'Anak',
  'Dewasa',
  'Kegawatdaruratan',
  'Komunikasi',
  'Pelayanan Paliatif',
  'Forensik dan Medikolegal',
]
