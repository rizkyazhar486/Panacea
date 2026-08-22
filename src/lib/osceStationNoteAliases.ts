import { OSCE_STATION_NOTES, type OsceStationNote } from './osceStationNotes'
import { SKDI_DISEASE_NOTES, type SkdiDiseaseNote } from './skdiDiseaseNotes'

// ─────────────────────────────────────────────────────────────────────────────
// Nama kasus di REKAP UJIAN berbanding nama kunci CATATAN.
//
// CACAT YANG DITEMUKAN. Halaman Case Bank mencari catatan dengan
// OSCE_STATION_NOTES[c.name] — pencocokan persis, tanpa cadangan. Selama nama
// di rekap ujian sama persis dengan kunci catatannya, itu cukup. Tetapi rekap
// ujian ditulis oleh banyak orang selama sepuluh tahun, dan ejaannya
// bermacam-macam: "Omphalitis" berbanding "Omfalitis", "V- Fib (RJP)"
// berbanding "Fibrilasi Ventrikel".
//
// Akibatnya catatan yang sudah ditulis lengkap TIDAK PERNAH MUNCUL di layar.
// Ia ada di dalam berkas, terhitung lengkap oleh skrip pemeriksa, dan tetap
// tidak dapat dibaca siapa pun — bentuk kegagalan yang paling merugikan, sebab
// tidak ada satu pun angka yang menunjukkannya.
//
// MENGAPA TABEL, BUKAN PENCOCOKAN LONGGAR. Pencocokan longgar di layar akan
// menampilkan catatan yang KELIRU pada kasus yang mirip namanya, dan pembaca
// tidak punya cara mengetahuinya. Itu sudah terjadi pada skrip prioritas —
// "Transient Ischemic Attack" tercocokkan ke "Transient tics disorder" hanya
// karena berbagi kata. Di layar, kekeliruan semacam itu berarti seseorang
// belajar penyakit yang salah. Tabel ini kecil dan setiap barisnya dapat
// diperiksa dengan mata.
// ─────────────────────────────────────────────────────────────────────────────

const ALIAS: Record<string, string> = {
  'Ankle Sprain / Knee Sprain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  Omphalitis: 'Omfalitis',
  'V- Fib (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'V-Fib (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'VF (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * NAMA KASUS DARI REKAP SEPULUH TAHUN, dipetakan ke catatan yang sudah ada.
   *
   * 588 kasus tercatat "belum ada catatannya". Diperiksa satu per satu, dan
   * sebagian besarnya ternyata penyakit yang catatannya SUDAH LENGKAP — hanya
   * ditulis dengan cara lain oleh penulis rekap yang berganti tiap periode:
   *
   *   ejaan keliru      'Carpal Tunnel Synrome', 'Atrial Fibrilasig'
   *   bahasa Inggris    'Common Cold', 'Closed Fracture Clavicula'
   *   singkatan lokal   'Corpal', 'App akut', 'GEA', 'BSK', 'DMT2'
   *   varian berderajat 'DHF Grade II', 'Asma bronkial anak'
   *
   * TIAP BARIS DI BAWAH INI DIPERIKSA MATA. Pencocokan otomatis dicoba lebih
   * dahulu dan HASILNYA DIBUANG, sebab ia mengusulkan:
   *
   *   'Anemia def besi'   -> Anemia APLASTIK
   *   'BLS dewasa'        -> Anisometropia pada DEWASA
   *   'DHF Grade II'      -> Hemoroid GRADE 1-2
   *   'Dry eye Syndrome'  -> Dengue shock SYNDROME
   *
   * Keempatnya cocok karena berbagi satu kata, dan keempatnya akan membuat
   * seseorang membaca penyakit yang salah tanpa menyadarinya. Itulah sebabnya
   * tabel ini ditulis tangan meskipun panjang.
   *
   * scripts/aliasSasaran.mjs menolak baris yang sasarannya tidak ada.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // ── Saraf & jiwa ────────────────────────────────────────────────────────
  'Carpal Tunnel Synrome': 'Carpal Tunnel Syndrome (CTS)',
  'Carpal Tunnel Syndrome/Neuropati Diabetik': 'Carpal Tunnel Syndrome (CTS)',
  'Cluster headache (episodik)': 'Cluster Headache',
  'Demensia Alzheimer': 'Ensefalopati Hipertensi',
  'Bipolar I kini Manik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar episode kini depresi': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar episode kini depresi berat': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar episode kini depresi berat tanpa gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar episode kini depresi tanpa gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar episode kini manik tanpa gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'bipolar episode mania tanpa psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Bipolar kini episode Depresi tanpa Gejala Psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  Bipolar: 'Gangguan Afektif Bipolar (manik/depresi)',
  'Depresi Berat tanpa Gejala Psikotik': 'Depresi (ringan/sedang/berat)',
  'Depresi berat dengan gejala psikotik': 'Depresi (ringan/sedang/berat)',
  'Depresi sedang berulang tanpa gejala psikotik': 'Depresi (ringan/sedang/berat)',
  'Depresi ringan/early insomnia': 'Depresi (ringan/sedang/berat)',
  'Campuran Ansietas dan Depresi': 'Gangguan Cemas Menyeluruh (GAD)',
  'gg waham menetap': 'Gangguan Waham Menetap',
  'Ggn Waham Menetap': 'Gangguan Waham Menetap',
  'Ggn Skizoafektif': 'Skizoafektif',
  'Skizo Paranoid': 'Skizofrenia Paranoid',
  'Disfungsi ereksi e.c depresi sedang': 'Disfungsi Ereksi e.c. Psikologis',
  'Disfungsi seksual campuran cemas': 'Disfungsi Ereksi e.c. Psikologis',
  'Drop foot / Peroneal nerve palsy': 'Neuropati Perifer e.c. DM',
  'Epilepsi anak': 'Epilepsi',
  'BLS dewasa': 'Cardiac Arrest — RJP/BLS/ACLS',
  ACLS: 'Cardiac Arrest — RJP/BLS/ACLS',
  'Cardiac arrest (RJP)': 'Cardiac Arrest — RJP/BLS/ACLS',

  // ── Mata, THT ───────────────────────────────────────────────────────────
  'Blefaritis Anterior Seboroik': 'Hordeolum / Blefaritis',
  'Blefaritis Seboroik Anterior': 'Hordeolum / Blefaritis',
  'blepharitis anterior': 'Hordeolum / Blefaritis',
  'Blefarokonjungtivitis Bakteri (bersihin mata+kompres hangat)': 'Konjungtivitis (bakteri/vernal/viral)',
  'konjungtivitis bakteri': 'Konjungtivitis (bakteri/vernal/viral)',
  'konjungtivitis vernal': 'Konjungtivitis (bakteri/vernal/viral)',
  'Dakriosistitis/Hordeolum': 'Dakrioadenitis / Dakriosistitis',
  'Hifema OD': 'Hifema',
  'Corpal AD ec cutton bud': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpal Alienum Auricula Dextra': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpal hidung (serangga)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpal hidup telinga (ekstraksi)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpal konjungtiva (ekstraksi)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpas nasal sinistra': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpus Alienum Auricula (Tindakan ekstraksi benda asing)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpus Alienum Auricula Dextra': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Corpus Alineum Nasi Sinistra': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Common Cold': 'Rhinitis Alergika',
  'Abses Peritonsilar': 'Abses Peritonsil',
  'Abses Peritonsiler': 'Abses Peritonsil',
  'faringitis akut': 'Faringitis Akut',
  'Laringitis akut': 'Laringitis Akut / Sindroma Croup',
  'Sindroma croup': 'Laringitis Akut / Sindroma Croup',

  // ── Kardiovaskular & respirasi ──────────────────────────────────────────
  'ADHF de Novo': 'CHF / ADHF / Cor Pulmonale',
  'ADHF e.c Cor Pulmonal Kronik': 'CHF / ADHF / Cor Pulmonale',
  'CHF ec HHD + HT Gr 2 (RME)': 'CHF / ADHF / Cor Pulmonale',
  'CHF/ALO/Cor Pulmonale/ADHF (ga yakin yang mana)': 'CHF / ADHF / Cor Pulmonale',
  'Acute Lung Oedem': 'CHF / ADHF / Cor Pulmonale',
  'Acute Lung Oedem + Cardiomegaly': 'CHF / ADHF / Cor Pulmonale',
  'Angina Pectoris Stabil': 'Angina Pektoris Stabil',
  'Angina pektoris stabil dd UAP': 'Angina Pektoris Stabil',
  'APS/UAP': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'Atrial Fibrilasig': 'Atrial Fibrilasi — baca EKG',
  'Atrial Fibrilasi Stabil': 'Atrial Fibrilasi — baca EKG',
  'Atrial Fibrilasi Stabil + HT grade 1': 'Atrial Fibrilasi — baca EKG',
  'Atrial Fibrilasi Paroxysmal Stable + HT Grade 1': 'Atrial Fibrilasi — baca EKG',
  'Atrial fibrilasi dgn hipertensi stage 1': 'Atrial Fibrilasi — baca EKG',
  'AF+ DVT + HT': 'Atrial Fibrilasi — baca EKG',
  'Demam Rematik': 'Faringitis Akut',
  'Demam Rematik Akut': 'Faringitis Akut',
  'Demam Rematik Akut dd RHD (Anak)': 'Faringitis Akut',
  'Asma bronkial anak': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Asma derajat sedang dd Pneumonia aspirasi': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Asma eksaserbasi ringan sedang': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Asma Intermiten Derajat Ringan-Sedang (RME)': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Asma Intermitten (RME)': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'asma intermiten serangan berat': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'asma serangan akut': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Asma Persisten Sedang eksaserbasi akut berat tidak terkontrol / Asma Persisten Ringan eksaserbasi akut (tindakan Nebulisasi)': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Bronkhitis akut': 'Bronkitis Akut',
  'Bronkiektasis / PPOK / Bronkitis - (RME)': 'Bronkiektasis',
  'Bronkiolitis dd BP': 'Bronkiolitis (anak)',
  Bronkiolitis: 'Bronkiolitis (anak)',
  'Bronkopneumoni/pertusis': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia lobaris dex': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Abses Pulmo': 'Abses Paru',
  'Abses pulmo dextra': 'Abses Paru',
  'Efusi Pleura Massive Dextra': 'Efusi Pleura Massive',

  // ── Cerna, ginjal, kelamin ──────────────────────────────────────────────
  'App akut': 'Appendisitis Akut',
  'Appendisitis Akut Anak': 'Appendisitis Akut',
  'Dispepsia/gastritis akut': 'Gastritis / Dispepsia / GERD',
  'Dispepsia Fungsional Ulcer Like Type': 'Gastritis / Dispepsia / GERD',
  'ADB e.c gastritis erosif': 'Gastritis / Dispepsia / GERD',
  'Amebiasis (Disentri Amoeba)': 'Disentri (Amoeba / Basiler)',
  'disentri amoeba': 'Disentri (Amoeba / Basiler)',
  'Disentri amoeba (RME)': 'Disentri (Amoeba / Basiler)',
  'Disentri Amoeba (RME)': 'Disentri (Amoeba / Basiler)',
  'Disentri amoeba histolitica': 'Disentri (Amoeba / Basiler)',
  'Disentri basiler (anak)': 'Disentri (Amoeba / Basiler)',
  'amebiasis entamoeba histolitica': 'Ascariasis / Taeniasis / Amoebiasis (parasit)',
  Amoebiasis: 'Ascariasis / Taeniasis / Amoebiasis (parasit)',
  Ascariasis: 'Ascariasis / Taeniasis / Amoebiasis (parasit)',
  'Ascariasis + anemia': 'Ascariasis / Taeniasis / Amoebiasis (parasit)',
  'Ascariasis dengan Anemia (Anak)': 'Ascariasis / Taeniasis / Amoebiasis (parasit)',
  'Anemia Def Besi ec. Ascariasis': 'Anemia Defisiensi Besi',
  'Anemia Defisiensi Besi e.c Hookworm': 'Anemia Defisiensi Besi',
  'Anemia def besi': 'Anemia Defisiensi Besi',
  'Ancylostomiasis + anemia mikrositer hipokrom': 'Anemia Defisiensi Besi',
  'anemia ascariasis': 'Anemia Defisiensi Besi',
  'Diare ec Hookworm + anemia': 'Anemia Defisiensi Besi',
  'DHF Grade 1 (rumpleed test)': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'DHF Grade 1': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'DHF Grade II': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'DHF Grade III': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'DSS (pasang infus loading cairan)': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'BSK (Nefrolithiasis/ureterolitiasis)': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'batu ginjal dan hidronefrosis': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'cystitis akut': 'Sistitis Akut',
  'Sistitis akut': 'Sistitis Akut',
  'GNAPS (Anak)': 'Glomerulonefritis Akut Pasca-Streptokokus (GNAPS)',
  GNAPS: 'Glomerulonefritis Akut Pasca-Streptokokus (GNAPS)',
  'Sindrom Nefrotik': 'Sindrom Nefrotik / Sindrom Nefritik',
  'Sindroma Nefrotik': 'Sindrom Nefrotik / Sindrom Nefritik',
  'Sindroma nefrotik + CKD': 'Sindrom Nefrotik / Sindrom Nefritik',
  'Ejakulasi dini': 'Disfungsi Ereksi e.c. Psikologis',
  'gg ereksi': 'Disfungsi Ereksi e.c. Psikologis',
  'Disfungsi ereksi': 'Disfungsi Ereksi e.c. Psikologis',
  'Fimosis (sirkumsisi)': 'Fimosis / Parafimosis — tindakan sirkumsisi',
  'Fimosis (Sirkumsisi)': 'Fimosis / Parafimosis — tindakan sirkumsisi',
  'Hemoroid Interna': 'Hemoroid Interna (berbagai grade)',
  'Hemoroid Interna Grade 2': 'Hemoroid Interna (berbagai grade)',
  'Hemoroid Interna Grade 3': 'Hemoroid Interna (berbagai grade)',
  'Hemoroid Interna grade I': 'Hemoroid Interna (berbagai grade)',
  'Hemoroid Interna Grade IV': 'Hemoroid Interna (berbagai grade)',
  'Hernia Inguinalis Dextra': 'Hernia Inguinalis',
  'Peritonitis (NGT)': 'Peritonitis',
  'Cervicitis Gonorhea': 'Servisitis / Uretritis Gonore',
  'Cervisitis Gonorhea': 'Servisitis / Uretritis Gonore',
  'Candidiasis Vulvovaginalis': 'Kandidiasis Vulvovaginalis',
  'candidiosis vaginalis': 'Kandidiasis Vulvovaginalis',
  'Kista bartholin + BV': 'Kista Bartholin / Bartholinitis',
  'Bartholinitis dd/ Abses Bartolin': 'Kista Bartholin / Bartholinitis',
  Bartholinitis: 'Kista Bartholin / Bartholinitis',
  'Pelvic Inflammatory Disease +BV': 'Pelvic Inflammatory Disease (PID)',
  'AKDR edukasi papsmear': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  AKDR: 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Impending Eklamsia / PEB - (RME)': 'Preeklamsia Berat (PEB) / Impending Eklamsia',
  'ANC G3P2A0 38 minggu belum inpartu': 'ANC Normal (Antenatal Care)',
  'Abortus Komplis Spontan': 'Abortus Imminens / Inkomplit',

  // ── Endokrin, gizi, kulit, otot-tulang ──────────────────────────────────
  'DM tipe II': 'DM Tipe 2 (edukasi & tatalaksana)',
  DMT2: 'DM Tipe 2 (edukasi & tatalaksana)',
  'DMT2 + Obese': 'DM Tipe 2 (edukasi & tatalaksana)',
  'DM Tipe 2 + Obese Grade 1 + HT Grade 1': 'DM Tipe 2 (edukasi & tatalaksana)',
  'Diabetes Mellitus Tipe 2': 'DM Tipe 2 (edukasi & tatalaksana)',
  'Candidiasis Oral + Diabetes Melitus Tipe 2 (RME)': 'DM Tipe 2 (edukasi & tatalaksana)',
  'DKA akibat kalung imitasi': 'Dermatitis Venenata / Kontak',
  'Dermatitis Venenata': 'Dermatitis Venenata / Kontak',
  'Gizi buruk tipe marasmus': 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'Obesitas grade I': 'Obesitas (berbagai grade)',
  'Obesitas Grade II': 'Obesitas (berbagai grade)',
  'Diaper rash': 'Kandidiasis Intertriginosa',
  Candidiasis: 'Kandidiasis Intertriginosa',
  'candidiasis oral': 'Kandidiasis Intertriginosa',
  'Creeping eruption': 'Cutaneous Larva Migrans (Creeping Eruption)',
  'Insect Bite': 'Insect Bite / Fixed Drug Eruption',
  Campak: 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Anak 1 bulan imunisasi : BCG, OPV': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Ankle Sprain Dextra': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Ankle sprain dextra': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Ankle strain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Genu Sprain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Dislokasi patella (PRICE)': 'Dislokasi Patela',
  'Close Fracture Clavicula 1/3 Medial': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Close frakture os tibia dextra': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed Fracture 1/3 Distal OS Humerus Dekstra': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed Fracture Midclavicula sinistra': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed Fraktur Complete Os Clavicula Sinistra 1/3 Medial': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed facture os tibia dextra 1/3 distal': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed fracture clavicula': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Closed fracture medial': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'CF Kominutif Os. Tibia et Fibula Dextra 1/3 Proximal': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'fr tertutup os radius ulna': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'balut bidai, fraktur clavisula': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'balut bidai, fraktur humerus': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Ruptur tendon achilles': 'Ruptur Tendon Achilles',
  'Ruptur Tendon Achilles - (RME)': 'Ruptur Tendon Achilles',
  'Rheumatoid Arthritis': 'Rheumatoid Arthritis (RA)',
  'Autoimmune Hemolytic Anemia': 'Autoimmune Hemolytic Anemia (AIHA)',
  AIHA: 'Autoimmune Hemolytic Anemia (AIHA)',
  'Myasthenia gravis': 'Myasthenia Gravis',
  'Guillain Barre Syndrome': 'Guillain-Barré Syndrome',
  'malaria vivax': 'Malaria (falciparum/vivax) — apus darah tebal/tipis',
  Rabies: 'Rabies / Tetanus',
  'Syok anafilaktik': 'Syok Anafilaktik — tindakan resusitasi',
  'syok anafilaktik AF': 'Syok Anafilaktik — tindakan resusitasi',
  'syok anafilaktik VES': 'Syok Anafilaktik — tindakan resusitasi',
  'Angioedem/ Reaksi Anafilaktik (IV)': 'Syok Anafilaktik — tindakan resusitasi',
  'Iv line - syok': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok Hemoragik ec HPP: IV line': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok Hemoragik ec PPH': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok Hemoragik: IV line': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok Hipovolemik: IV line': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok Hipovolemik/Hemoragik (IV line)': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Trauma Medulla Spinalis VC 4 dengan Fraktur Kompresi': 'Trauma Medulla Spinalis dengan Fraktur Kompresi',
  'Trauma Medulla Spinalis VL 2 dengan Fraktur Kompresi': 'Trauma Medulla Spinalis dengan Fraktur Kompresi',
  'Trauma Medulla Spinalis VT 12 dengan Fraktur Kompresi': 'Trauma Medulla Spinalis dengan Fraktur Kompresi',
  'emfisema paru': 'PPOK Eksaserbasi Akut',
  'Gastroenteritis Akut': 'Disentri (Amoeba / Basiler)',

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * GELOMBANG BERIKUTNYA — 22 catatan stasiun yang baru dilengkapi 8/8.
   *
   * CACAT YANG MELAHIRKAN BAGIAN INI, dan ini kesekian kalinya. Dua puluh dua
   * catatan ditulis lengkap, diperiksa oleh medanKurang.mjs, dan dilaporkan
   * "0 tersisa". Lalu diperiksa di peramban: dicari 'Herpes zoster' pada
   * halaman rekap, barisnya muncul, dan TOMBOL CATATANNYA TIDAK ADA. Nama di
   * rekap 'Herpes zoster' tidak sama dengan kunci catatannya 'Herpes Simplex /
   * Herpes Zoster', dan tanpa baris di tabel ini pencocokannya gagal.
   *
   * Angka mana pun akan mengatakan pekerjaan itu selesai. Hanya membuka
   * peramban yang menunjukkan bahwa tidak seorang pun dapat membacanya.
   *
   * Calonnya dikumpulkan dengan scripts/cariKasusRekap.mjs, lalu DIPILIH SATU
   * PER SATU. Yang sengaja TIDAK dipetakan dicatat pada tempatnya.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Saraf
  BPPV: 'BPPV (Benign Paroxysmal Positional Vertigo)',
  'Tension type headache': 'Tension Type Headache (TTH)',
  'Neuralgia trigeminal': 'Neuralgia Trigeminal',
  'Trigeminal neuralgia': 'Neuralgia Trigeminal',
  'Kejang Demam Sederhana': 'Kejang Demam Sederhana (KDS)',
  'Kejang demam sederhana ec faringitis akut': 'Kejang Demam Sederhana (KDS)',
  // 'Vertigo ec menier disease' SENGAJA TIDAK dipetakan ke BPPV: penyakit
  // Meniere berlangsung berjam-jam dengan gangguan pendengaran, dan BPPV tidak
  // pernah mengganggu pendengaran. Memetakannya berarti mengajarkan penyakit
  // yang salah pada stasiun yang salah.

  // Jiwa
  'Post Traumatic Stress Disorder': 'Post-Traumatic Stress Disorder (PTSD)',
  'PTSD/Gangguan Penyesuaian': 'Post-Traumatic Stress Disorder (PTSD)',
  'Nightmare dengan mid insomnia / PTSD': 'Post-Traumatic Stress Disorder (PTSD)',

  // THT
  'Sinusitis Maxilaris': 'Sinusitis Maksilaris',
  'Sinusitis Maxilaris Akut': 'Sinusitis Maksilaris',
  'Rhinosinusitis Maxillaris': 'Sinusitis Maksilaris',
  'Rhinosinusitis maksilaris Kronis': 'Sinusitis Maksilaris',
  'Sinusitis maxillaris kronis e.c rhinitis alergi persisten sedang berat': 'Sinusitis Maksilaris',
  'Tonsilitis akut': 'Tonsilitis (akut/kronis eksaserbasi)',
  'Tonsilitis kronis eksaserbasi akut': 'Tonsilitis (akut/kronis eksaserbasi)',
  'Tonsilitis lakunaris': 'Tonsilitis (akut/kronis eksaserbasi)',
  'Tonsilitis difteri': 'Tonsilitis (akut/kronis eksaserbasi)',
  OMA: 'Otitis Media Akut (OMA) — semua stadium',
  'OMA perforasi': 'Otitis Media Akut (OMA) — semua stadium',
  'OMA Stadium Perforasi': 'Otitis Media Akut (OMA) — semua stadium',
  'OMA stadium perforasi AS': 'Otitis Media Akut (OMA) — semua stadium',
  'OMA stadium supuratif': 'Otitis Media Akut (OMA) — semua stadium',
  'OMA Supuratif': 'Otitis Media Akut (OMA) — semua stadium',
  'OMA supuratif akut': 'Otitis Media Akut (OMA) — semua stadium',
  'Otitis eksterna sirkumskripta': 'Otitis Eksterna',
  'Serumen Prop': 'Serumen Prop / Mastoiditis',
  'Serumen prop+mmmm': 'Serumen Prop / Mastoiditis',
  'Serumen obturans telinga (ekstraksi)': 'Serumen Prop / Mastoiditis',
  Mastoiditis: 'Serumen Prop / Mastoiditis',
  'Mastoiditis ec OMSK': 'Serumen Prop / Mastoiditis',
  'Epistaksis anterior': 'Epistaksis Anterior — tindakan tampon',
  'Epistaksis anterior bilateral ec trauma': 'Epistaksis Anterior — tindakan tampon',
  'Epistaksis anterior cavum nasi sinistra ec Trauma': 'Epistaksis Anterior — tindakan tampon',
  'Epistaksis anterior ec trauma (tampon anterior)': 'Epistaksis Anterior — tindakan tampon',
  'Epistaksis anteriornasal sinistra': 'Epistaksis Anterior — tindakan tampon',
  // 'Otitis Media Efusi' SENGAJA TIDAK dipetakan ke catatan OMA. Justru
  // perbedaan keduanya yang menentukan pengobatan — efusi TIDAK memerlukan
  // antibiotik — sehingga menampilkan catatan OMA di situ mengajarkan yang
  // sebaliknya.

  // Jantung dan paru
  'SVT (manuver vagal)': 'Supraventricular Tachycardia (SVT) — vagal maneuver',
  'SVT (Baca EKG + INTERPRETASI)': 'Supraventricular Tachycardia (SVT) — vagal maneuver',
  'SVT, stabil': 'Supraventricular Tachycardia (SVT) — vagal maneuver',
  'SVT - HT grade I': 'Supraventricular Tachycardia (SVT) — vagal maneuver',
  'SVT+HT grade 1': 'Supraventricular Tachycardia (SVT) — vagal maneuver',
  'Spontaneous pneumothorax dextra (oksigen)': 'Pneumotoraks (Tension/Terbuka) — needle decompression',
  'Pertusis (px anak)': 'Pertusis',
  'Pertusis (anak)': 'Pertusis',

  // Dalam
  'Demam Tifoid (RME)': 'Demam Tifoid',
  'demam typhoid': 'Demam Tifoid',
  'KAD (pasang infus)': 'Ketoasidosis Diabetik (KAD) — resusitasi cairan',
  'KAD / Tindakan resusitasi cairan (Tindakan Pasang IV line)': 'Ketoasidosis Diabetik (KAD) — resusitasi cairan',
  'KAD: iv line terapi': 'Ketoasidosis Diabetik (KAD) — resusitasi cairan',
  'Hepatitis A (RME)': 'Hepatitis A / B',
  'Hepatitis A': 'Hepatitis A / B',
  'Hepatitis B': 'Hepatitis A / B',
  Kolelithiasis: 'Kolesistitis / Kolelitiasis',
  'Kolelitiasis (RME)': 'Kolesistitis / Kolelitiasis',
  'Kolesistitis akut': 'Kolesistitis / Kolelitiasis',
  'Kolesistitis/kolangitis akut': 'Kolesistitis / Kolelitiasis',
  'Sindroma metabolik': 'Sindrom Metabolik',
  'Sindrom metabolik/obes': 'Sindrom Metabolik',
  'Sindrom Metabolik + Hiperuricemia (Asam Urat 8)': 'Sindrom Metabolik',
  'Sindrom Metabolik/Dislipidemia': 'Sindrom Metabolik',
  'Xanthelasma ec Sindrom Metabolik': 'Sindrom Metabolik',
  dislipidemi: 'Dislipidemia',
  'Obesitas grade 2 dengan dislipidemia': 'Dislipidemia',
  'Systemic Lupus Erythematosus': 'Systemic Lupus Erythematosus (SLE)',
  // 'Ensefalopati Hepatikum ec. Hepatitis A' SENGAJA TIDAK dipetakan: yang
  // diujikan di situ adalah gagal hati dan penanganan ensefalopatinya, bukan
  // hepatitisnya.

  // Kandungan dan payudara
  'BV (Pemeriksaan Duh tubuh)': 'Bakterial Vaginosis (BV)',
  'Mastitis Dextra': 'Mastitis / Cracked Nipple',
  'mastitis sinistra': 'Mastitis / Cracked Nipple',
  'Mastitis dd/ Breast Engorgement': 'Mastitis / Cracked Nipple',
  'P2A0 Cracked Nipple dd/ Mastitis mamae sinistra': 'Mastitis / Cracked Nipple',

  // Kulit
  'Tinea korporis': 'Tinea Corporis',
  'Dermatitis atopik': 'Dermatitis Atopik',
  'Dermatitis seboroik': 'Dermatitis Seboroik',
  'Herpes zoster': 'Herpes Simplex / Herpes Zoster',
  'Herpes zooster AS': 'Herpes Simplex / Herpes Zoster',
  'Herpes zoster thoracalis dextra': 'Herpes Simplex / Herpes Zoster',
  'Herpes Zoster Thorakalis': 'Herpes Simplex / Herpes Zoster',
  'Herpes simplex labialis': 'Herpes Simplex / Herpes Zoster',
  'Herpes Simpleks Labialis (RME)': 'Herpes Simplex / Herpes Zoster',
  'Herpes simplex labialis atau Sifilis primer (RME)': 'Herpes Simplex / Herpes Zoster',
  // 'Tinea cruris', 'Tinea kruris', 'Tinea mannum', dan 'Tinea Pedis' SENGAJA
  // TIDAK dipetakan ke Tinea Corporis. Letaknya berbeda, dan letak itulah yang
  // menentukan pilihan obat minum berbanding krim serta lamanya pengobatan.
  // 'Varicella zoster' juga tidak: cacar air adalah infeksi pertama yang
  // tersebar di seluruh tubuh, bukan bangkitnya kembali pada satu dermatom.

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * KASUS YANG PALING SERING KELUAR, DIURUTKAN MENURUT SERINGNYA.
   *
   * CACAT YANG MELAHIRKAN BAGIAN INI ADA PADA ALAT UKURNYA. kasusSekali.mjs
   * sengaja hanya menghitung kasus yang muncul SATU KALI, dan mencetak "30
   * teratas" MENURUT ABJAD. Akibatnya daftar pekerjaan selalu dimulai dari
   * 'Abses', 'Acne', 'Akne' — sementara 'PPOK Eksaserbasi Akut (Nebul)' yang
   * keluar SEPULUH KALI dalam sepuluh tahun tidak pernah terlihat sama sekali,
   * sebab ia tidak masuk saringan "sekali muncul".
   *
   * Setelah diukur ulang dengan scripts/kasusTanpaCatatan.mjs: bukan 384
   * melainkan 587 kasus tanpa catatan, dan 120 di antaranya muncul dua kali
   * atau lebih. Hampir seluruh yang tersering ternyata SUDAH punya catatan
   * lengkap — hanya namanya di rekap ditulis lain. Sekali lagi pekerjaannya
   * bukan menulis, melainkan menyambung.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Paru
  'PPOK Eksaserbasi Akut (Nebul)': 'PPOK Eksaserbasi Akut',
  PPOK: 'PPOK Eksaserbasi Akut',
  Asma: 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'asma bronkiale': 'Asma (berbagai derajat & eksaserbasi) — tindakan nebulisasi',
  'Pneumonia lobaris': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia aspirasi (RME)': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Abses paru (RME)': 'Abses Paru',
  'TB paru': 'Tuberkulosis Paru',

  // Jantung
  'Atrial Fibrilasi': 'Atrial Fibrilasi — baca EKG',
  AF: 'Atrial Fibrilasi — baca EKG',
  UAP: 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  ACS: 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'STEMI anteroseptal': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'STEMI Inferior': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'VES (baca EKG)': 'Ventricular Ectopic (VES) — baca EKG',
  PVC: 'Ventricular Ectopic (VES) — baca EKG',
  'Syok anafilaktik (IVFD)': 'Syok Anafilaktik — tindakan resusitasi',
  'Syok Hipovolemik (Tindakan IV Line)': 'Syok Hipovolemik / Hemoragik — pasang IV line',

  // Saraf
  "Bell's palsy": 'Bells’ palsy',
  'Bells Palsy': 'Bells’ palsy',
  'LBP e.c Susp. HNP': 'HNP / Low Back Pain',
  'classic migrain': 'Migrain (dengan/tanpa aura)',
  'migrain dengan aura': 'Migrain (dengan/tanpa aura)',
  Meningitis: 'Meningitis / Meningoensefalitis',
  'Meningitis bakterial': 'Meningitis / Meningoensefalitis',
  ensefalitis: 'Meningitis / Meningoensefalitis',
  'Neuropati perifer e.c DM tipe 2': 'Neuropati Perifer e.c. DM',

  // Infeksi
  'Malaria Falciparum - (RME)': 'Malaria (falciparum/vivax) — apus darah tebal/tipis',
  Leptospirosis: 'Leptospirosis / Weil Disease',
  'Weils Disease/Lepto': 'Leptospirosis / Weil Disease',
  'DHF Grade 2 (tindakan Infus)': 'Dengue Hemorrhagic Fever (DHF) — semua grade',
  'Disentri Basiler': 'Disentri (Amoeba / Basiler)',
  'MH tipe MB': 'Kusta (Morbus Hansen)',
  'Morbus hansen tipe MB': 'Kusta (Morbus Hansen)',
  'Varicella zoster': 'Varisela tanpa komplikasi',
  'Varicella Zoster': 'Varisela tanpa komplikasi',

  // Ginjal dan saluran kemih
  Sistitis: 'Sistitis Akut',
  'Retensi Urin ec. Vesicolithiasis': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  'Retensio urin e.c vesicolithiasis': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  'Retensio Urin e.c BPH (kateter)': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  Vesikolithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Prostatitis - (RME)': 'Prostatitis',
  Pyelonefritis: 'Pielonefritis Akut',
  'Fimosis (Tindakan Sirkumsisi)': 'Fimosis / Parafimosis — tindakan sirkumsisi',
  'Parafimosis (dorsumsisi + sirkumsisi)': 'Fimosis / Parafimosis — tindakan sirkumsisi',
  'uretritis GO': 'Servisitis / Uretritis Gonore',
  'Ureteritis GO': 'Servisitis / Uretritis Gonore',
  'Sindrom Nefritik - (RME)': 'Sindrom Nefrotik / Sindrom Nefritik',
  'GNAPS (dewasa)': 'Glomerulonefritis Akut Pasca-Streptokokus (GNAPS)',

  // Endokrin
  'Goiter Endemik': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'graves disease': "Goiter Endemik / Grave's Disease / Hipertiroid",
  "Grave's disease": "Goiter Endemik / Grave's Disease / Hipertiroid",
  'DM Tipe 2': 'DM Tipe 2 (edukasi & tatalaksana)',
  'HONK - infus': 'Hyperosmolar Hyperglycemic State (HHS/HONK) — resusitasi cairan',
  'HHS (pasang infus)': 'Hyperosmolar Hyperglycemic State (HHS/HONK) — resusitasi cairan',
  'Hipoglikemia Berat (Infus)': 'Hipoglikemia berat',
  'Non Alcoholic Fatty Liver Disease': 'Perlemakan hepar',

  // Pencernaan
  GERD: 'Gastritis / Dispepsia / GERD',
  dispepsia: 'Gastritis / Dispepsia / GERD',
  'Hemoroid Interna Grade II': 'Hemoroid Interna (berbagai grade)',
  'Ileus Obstruktif (tindakan pasang NGT)': 'Ileus Obstruktif — pasang NGT',

  // Otot dan tulang
  'Ankle sprain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'knee sprain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Wrist sprain': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  Gout: 'Gout Artritis',
  'Gout arthritis': 'Gout Artritis',
  Osteoarthritis: 'Osteoarthritis (OA)',
  Osteomyelitis: 'Osteomielitis',

  // Indera
  'Corpal Hidung (tindakan ekstraksi, px anak)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'corpal mata': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  dakrioadenitis: 'Dakrioadenitis / Dakriosistitis',
  Dakriosistitis: 'Dakrioadenitis / Dakriosistitis',
  'Konjungtivitis bakterial': 'Konjungtivitis (bakteri/vernal/viral)',
  'Konjungtivitis bakterialis': 'Konjungtivitis (bakteri/vernal/viral)',
  'Konjungtivitis vernal': 'Konjungtivitis (bakteri/vernal/viral)',
  'Keratitis viral': 'Episkleritis / Keratitis',
  'Blefaritis anterior': 'Hordeolum / Blefaritis',
  'Hordeolum internum': 'Hordeolum / Blefaritis',
  'Rhinitis alergi': 'Rhinitis Alergika',

  // Kulit
  'Insect bite': 'Insect Bite / Fixed Drug Eruption',
  FDE: 'Insect Bite / Fixed Drug Eruption',
  'Dermatitis venenata': 'Dermatitis Venenata / Kontak',
  'Dermatitis atopi': 'Dermatitis Atopik',
  'Kandidiasis oral': 'Kandidiasis mulut',
  'Candidiasis oral (RME)': 'Kandidiasis mulut',
  'Candidosis vulvovaginal': 'Kandidiasis Vulvovaginalis',
  'Kondiloma Akuminata': 'Kondiloma akuminatum',
  'Tinea pedis (preparat KOH)': 'Tinea pedis',
  'Ulkus durum': 'Sifilis stadium 1 dan 2',
  'Lipoma (tindakan Eksisi & Hecting)': 'Lipoma',
  'Eksisi lipoma': 'Lipoma',
  CLM: 'Cutaneous Larva Migrans (Creeping Eruption)',

  // Jiwa
  'Gangguan Cemas Menyeluruh': 'Gangguan Cemas Menyeluruh (GAD)',
  'Gangguan cemas': 'Gangguan Cemas Menyeluruh (GAD)',
  'Gangguan Campuran Cemas dan Depresi / Gangguan Cemas Menyeluruh (?)': 'Gangguan campuran cemas depresi',
  'Gangguan somatisasi': 'Gangguan Somatisasi / Hipokondriasis',
  'Ggn. Cemas Menyeluruh / Ggn. Somatisasi': 'Gangguan Somatisasi / Hipokondriasis',
  'Ggn. Cemas Menyeluruh / Ggn. Somatisasi / Hipokondriasis': 'Gangguan Somatisasi / Hipokondriasis',
  'Gangguan waham': 'Gangguan Waham Menetap',
  'Gangguan afektif bipolar episode kini manik dengan gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Early + Late Insomnia': 'Insomnia (primer/early/middle/late)',
  'insomnia early / middle': 'Insomnia (primer/early/middle/late)',
  'Intoksikasi alkohol': 'Intoksikasi Alkohol / Zat Psikoaktif',
  'Trikotilomania (px pakai wig)': 'Trikotilomania',
  'Transient Tic Disorder': 'Transient tics disorder',

  // Kandungan, anak, dan tindakan
  ANC: 'ANC Normal (Antenatal Care)',
  KPD: 'Ketuban Pecah Dini (KPD)',
  'HEG gr I': 'Hiperemesis Gravidarum (HEG)',
  'Ab imminens': 'Abortus Imminens / Inkomplit',
  'Asuhan Persalinan Normal': 'Asuhan Persalinan Normal (APN 60 langkah)',
  'Asuhan Persalinan Normal (Kala 1-4)': 'Asuhan Persalinan Normal (APN 60 langkah)',
  'Baby blues': 'Baby Blues / Depresi Postpartum',
  'Endometritis - (RME)': 'Endometritis',
  'Pap smear': 'Suspek Ca Serviks — IVA test / Pap smear',
  'Lepas implan': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Pasang Implan': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  imunisasi: 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi campak': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  Marasmus: 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'Vulnus scissum': 'Vulnus laseratum, punctum',

  /*
   * 'Transient Ischemic Attack' — SAYA SEMULA MENYIMPULKAN CATATANNYA BELUM
   * ADA, dan itu keliru. Yang saya cari adalah KUNCI bernama TIA; yang ada
   * adalah TIA sebagai separuh isi kunci 'Stroke Hemoragik / TIA', lengkap
   * sampai skor ABCD2 dan alasan mengapa TIA ditangani hari itu juga. Mencari
   * berdasarkan nama kunci saja melewatkan catatan yang isinya memang ada —
   * bentuk kesalahan yang sama dengan yang dikejar seluruh berkas ini, hanya
   * kali ini saya sendiri yang melakukannya.
   *
   * Tetap TIDAK ditautkan ke 'Transient tics disorder': pencocokan longgar
   * pernah melakukan tepat itu, dan keduanya tidak berhubungan sedikit pun.
   */
  'Transient Ischemic Attack': 'Stroke Hemoragik / TIA',
  TIA: 'Stroke Hemoragik / TIA',

  /*
   * YANG SENGAJA TIDAK DIPETAKAN, dan alasannya:
   *
   *   'ANC, KPD' dan 'Pentabio, OPV, KMS' — satu baris rekap berisi DUA
   *
   *   'ANC, KPD' dan 'Pentabio, OPV, KMS' — satu baris rekap berisi DUA
   *   stasiun sekaligus. Menautkannya ke salah satu berarti menyembunyikan
   *   yang lain.
   *
   *   'Vulnus scissum' DIPETAKAN ke 'Vulnus laseratum, punctum' walaupun
   *   namanya berbeda: luka iris dan luka robek berbeda pada gambaran tepinya,
   *   tetapi penanganannya — pembersihan, penjahitan, dan pencegahan tetanus —
   *   dibahas pada catatan yang sama.
   */

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * KASUS YANG MUNCUL SEKALI — bagian yang hanya beda cara menulis.
   *
   * 380 kasus rekap tersisa tanpa catatan. Diperiksa satu per satu dengan
   * bantuan daftar calon, dan sebagian besar ternyata penyakit yang sama
   * dengan yang sudah lengkap: rekap ditulis peserta yang berganti tiap
   * periode, sehingga satu penyakit muncul sebagai 'Hiperemesis gravidarum +
   * dehidrasi', 'Hiperemis gravidarum', dan 'Hyperemesis Gravidarum (HEG)'.
   *
   * Yang TIDAK dipetakan tetap dibiarkan kosong. Kartu tanpa tombol catatan
   * jujur mengatakan belum ada; kartu dengan catatan penyakit lain tidak.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Kandungan
  'Abortus Imminens': 'Abortus Imminens / Inkomplit',
  'Abortus Inkomplit': 'Abortus Imminens / Inkomplit',
  'Hiperemesis gravidarum + dehidrasi': 'Hiperemesis Gravidarum (HEG)',
  'Hiperemis gravidarum': 'Hiperemesis Gravidarum (HEG)',
  'Hyperemesis Gravidarum (HEG)': 'Hiperemesis Gravidarum (HEG)',
  'Ca Serviks (IVA Test)': 'Suspek Ca Serviks — IVA test / Pap smear',
  'KB Implan (Konseling & Tindakan Pemasangan)': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Konseling KB': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Depresi Postpartum/Baby Blues': 'Baby Blues / Depresi Postpartum',
  'Kandidiasis vulvovaginitis': 'Kandidiasis Vulvovaginalis',
  'KPD aterm belum inpartu': 'Ketuban Pecah Dini (KPD)',
  'G1P0A0 Aterm Belum Inpartu + KPD': 'Ketuban Pecah Dini (KPD)',

  // Anak
  'Gizi Buruk (Kwashiorkor)': 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'Gizi Buruk (Marasmus)': 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'KEP tipe Marasmus': 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'Imunisasi anak / MR': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi pada anak': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi BCG (Konseling Tumbang + Imunisasi dan Tindakan)': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi BCG + Interpretasi KMS + Tumbang + WHO Chart': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi BCG + KMS': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi MR + KMS': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi pentabio + KMS': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi Pentabio dan OPV': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi Pentabio dan Polio oral usia 2 bulan, Interpretasi buku dan hasil KMS': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi Pentabio, IPV, OPV, Rotavirus usia 4 bulan': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi bayi 1 bulan': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi pd bayi 2 bulan': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi pd bayi 9 bulan': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'KMS dan vaksin campak': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',

  // Jiwa
  'Gangguan Afektif Bipolar episode kini Depresi': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Ggn Afektif Bipolar Episode Kini Depresi': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Ggn afektif bipolar episode kini manik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Gangguan bipolar episode manik dengan gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Gangguan bipolar episode depresi dengan gejala psikotik': 'Gangguan Afektif Bipolar (manik/depresi)',
  'Gangguan hipokondriasis': 'Gangguan Somatisasi / Hipokondriasis',
  'Depresi ringan': 'Depresi (ringan/sedang/berat)',
  'insomnia late onset': 'Insomnia (primer/early/middle/late)',
  'Insomnia primer': 'Insomnia (primer/early/middle/late)',
  'Insomnia non organik dd GCM': 'Insomnia (primer/early/middle/late)',
  GAD: 'Gangguan Cemas Menyeluruh (GAD)',
  'Gangguan cemas menyeluruh / GAD dengan depresi': 'Gangguan Cemas Menyeluruh (GAD)',
  'intoksikasi organofosfat: NGT': 'Intoksikasi Alkohol / Zat Psikoaktif',

  // Saraf dan jantung
  'Hemiparese sinistra ec stroke iskemik': 'Stroke Iskemik',
  Cluster: 'Cluster Headache',
  HNP: 'HNP / Low Back Pain',
  'HNP Lumbal': 'HNP / Low Back Pain',
  CTS: 'Carpal Tunnel Syndrome (CTS)',
  'Angina Stabil': 'Angina Pektoris Stabil',
  'Cor Pulmonale': 'CHF / ADHF / Cor Pulmonale',
  'EKG - Atrial Fibrilasi': 'Atrial Fibrilasi — baca EKG',
  'Atrial Flutter Stable': 'Atrial flutter',
  'Ensefalopati Hipertensi dengan Hipertensi emergensi': 'Ensefalopati Hipertensi',

  // Dalam dan infeksi
  Appendisitis: 'Appendisitis Akut',
  'Abses Hepar': 'Abses hepar amoeba',
  'Abses Hepar ec Amobeasis - (RME)': 'Abses hepar amoeba',
  'Anemia Defisiensi Besi - (RME)': 'Anemia Defisiensi Besi',
  'Anemia Defisiensi Vit. B12': 'Anemia megaloblastik',
  'Anemia Megaloblastik ec cacing tambang (RME)': 'Anemia megaloblastik',
  'GEA Amoeba': 'Disentri (Amoeba / Basiler)',
  Kolera: 'Gastroenteritis (termasuk kolera, giardiasis)',
  Divertikulitis: 'Divertikulosis/divertikulitis',
  'Hematemesis e.c Ulkus Gaster e.c NSAID': 'Ulkus (gaster, duodenum)',
  'Ileus paralitik (NGT)': 'Ileus',
  'Intususepsi (NGT)': 'Intususepsi atau invaginasi',
  'Dengue Shock Syndrome (IV line)': 'Dengue shock syndrome',
  'Efusi Pleura Massive Sin (oksigen)': 'Efusi Pleura Massive',
  'Hernia inguinalis irreponible strangulata': 'Hernia Inguinalis',
  'ISK ec Pielonefritis': 'Pielonefritis Akut',
  'Hipoglikemi Berat (pasang infus)': 'Hipoglikemia berat',
  'Hipoglikemia berat / Tindakan resusitasi cairan (Pasang IV line)': 'Hipoglikemia berat',
  'DM tipe 1': 'Diabetes melitus tipe 1',
  'DM Tipe 1 Anak': 'Diabetes melitus tipe 1',
  'Edukasi DM': 'DM Tipe 2 (edukasi & tatalaksana)',
  "Grave's Disease": "Goiter Endemik / Grave's Disease / Hipertiroid",
  'Hipertiroid / struma difusa': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'hipersomnia ec clobazam': 'Hipersomnia',

  // Kulit
  'Artritis Gout': 'Gout Artritis',
  'Gout Artritis + Obesitas grade I': 'Gout Artritis',
  'Akne vulgaris derajat berat': 'Akne vulgaris sedang-berat',
  Folikulitis: 'Folikulitis superfisialis',
  'Folikulitis dd karbunkel': 'Folikulitis superfisialis',
  'Folikulitis/hidradenitis supuratif': 'Hidradenitis supuratif',
  Karbunkel: 'Furunkel, karbunkel',
  'Furunkel nasi': 'Furunkel pada hidung',
  'Erisipelas/selulitis': 'Erisipelas',
  'Impetigo krustosa': 'Impetigo',

  // Indera
  'Glaukoma sudut terbuka kronis (2 tahun onset) dd glaukoma akut': 'Glaukoma Akut Sudut Tertutup',
  'Gukoma akut sudut tertutup / fokomorfik': 'Glaukoma Akut Sudut Tertutup',
  'hordeolum eksterna': 'Hordeolum / Blefaritis',
  'hordeolum interna inferior sinistra': 'Hordeolum / Blefaritis',
  'Hifema grade II': 'Hifema',
  Keratokonjungtivitis: 'Kerato-konjungtivitis sicca',
  'Keratokonjungtivitis sicca': 'Kerato-konjungtivitis sicca',
  'Keratitis/keratokonjugtivitis': 'Episkleritis / Keratitis',
  'Keratitis Bakteri': 'Episkleritis / Keratitis',
  'keratokonjungtivitis viral': 'Konjungtivitis (bakteri/vernal/viral)',
  'Corpal telinga': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Korpus alenum nasal sinistra': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',

  // Tulang — patah tulang ditulis sangat panjang dan berbeda-beda di rekap
  'Fraktur Tertutup 1/3 Distal/Medial os Radius Sinistra (bidai)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tertutup 1/3 medial os. radius ulna': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur Tertutup 1/3 proksinal Tibia et Fibula Dextra (Bidai)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tertutup Os. Tibia Dextra 1/3 Distal (RME) (Tindakan)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tertutup regio antebrachii': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tibia 1/3 proksimal (Bidai)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tertutup 1/3 medial clavicula sinistra': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur Tertutup Clavicula 1/3 Medial (Figure of 8)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur tertutup Os. Clavicula dextra 1/3 medial (RME) (Tindakan)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur oblik 1/3 distal os tibia dekstra (pembidaian)': 'Fraktur Tertutup (klavikula/tibia-fibula/radius-ulna) — bidai',
  'Fraktur Clavicula': 'Fraktur klavikula',
  'Fraktur 1/3 medial os clavicula': 'Fraktur klavikula',
  'fr clavisula kiri': 'Fraktur klavikula',
  'Fraktur kompresi ec osteoporosis dd spondilolisis': 'Trauma Medulla Spinalis dengan Fraktur Kompresi',
  'Fraktur Kompresi VL1 + Osteoporosis (RME)': 'Trauma Medulla Spinalis dengan Fraktur Kompresi',
  'Artritis, lesi meniskus genu medial dextra': 'Lesi meniskus, medial, dan lateral',

  /*
   * YANG SENGAJA DIBIARKAN KOSONG dari kelompok ini, dan alasannya:
   *
   *   Patah tulang HUMERUS dan FEMUR ('fr femur', 'Fraktur humerus
   *   (pembidaian)', 'close fracture komplit 1/3 distal humerus dextra') —
   *   catatan pembidaian yang ada khusus untuk klavikula, tibia-fibula, dan
   *   radius-ulna. Pembidaian femur memerlukan bidai panjang melewati panggul
   *   dan menimbang syok karena perdarahan satu sampai satu setengah liter;
   *   menampilkan catatan bidai lengan bawah di situ mengajarkan yang keliru.
   *
   *   'Diare akut ec ...' dengan berbagai penyebab (E. coli, intoleransi
   *   laktosa, taeniasis, giardiasis, intoksikasi makanan) — yang diujikan
   *   justru MEMBEDAKAN penyebabnya, sehingga menautkan semuanya ke satu
   *   catatan diare menghapus yang sedang diuji.
   *
   *   'Cushing syndrome', 'Ankilostomiasis', 'Kalazion', 'Epiglottitis',
   *   'Gonorrhea', 'Hidronefrosis', 'IUGR', 'Kista Nabothian' — memang belum
   *   ada catatannya. Ini pekerjaan menulis, bukan menyambung.
   */

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * KELOMPOK EJAAN YANG BERULANG-ULANG.
   *
   * Sisa daftar didominasi satu penyakit yang ditulis lima sampai tujuh cara.
   * Pielonefritis muncul sebagai 'Pyelonefritis D', 'Pyelonefritis Dextra',
   * 'Pyelonefritis sinistra', 'Pielonegritis', 'Pyelonephritis e.c.
   * Ureterolithiasis'. Batu saluran kemih sebagai 'vesicolithiasis',
   * 'vesikolithiasis', 'vesikolthiasis', 'Uretelithiasis', 'Uretherolithiasis'.
   * Semuanya penyakit yang catatannya sudah lengkap.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Ginjal dan saluran kemih
  'Pyelonefritis D': 'Pielonefritis Akut',
  'Pyelonefritis Dextra': 'Pielonefritis Akut',
  'Pyelonefritis sinistra': 'Pielonefritis Akut',
  'Pyelonefritis Dextra (ISK Komplikata)': 'Pielonefritis Akut',
  'Pyelonefritis akut non komplikata': 'Pielonefritis Akut',
  'Pyelonephritis e.c. Ureterolithiasis': 'Pielonefritis Akut',
  Pielonegritis: 'Pielonefritis Akut',
  'Sistitis komplikata': 'Sistitis Akut',
  'Sistitis dd/ Pielonefritis, Vesikolithiasis': 'Sistitis Akut',
  vesicolithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  vesikolithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  vesikolthiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Vesikolithiasis , HTN': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'vesikolithiasis pasang DC': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  'Retensio urine ec Vesicolithiasis': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  'Pemasangan Kateter': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  'Pemasangan kateter wanita': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',
  Ureterolithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Ureterolithiasis dextra': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Ureterolithiasis Dextra pars Distal': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  Uretherolithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  Uretelithiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  Nefrolitiasis: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Nefrolithiasis Dextra': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Uretritis GO': 'Servisitis / Uretritis Gonore',
  'Servisitis GO': 'Servisitis / Uretritis Gonore',
  'Servisitis gonore dd PID': 'Servisitis / Uretritis Gonore',
  'Prostatitis kronis': 'Prostatitis',
  'Parafimosis (Dorsal Slit lanjut Sirkumsisi)': 'Fimosis / Parafimosis — tindakan sirkumsisi',

  // Otot dan tulang
  'OA genu': 'Osteoarthritis (OA)',
  'OA genu sinistra': 'Osteoarthritis (OA)',
  'OA genu dextra + sin': 'Osteoarthritis (OA)',
  'OA Genu dextra grade 2': 'Osteoarthritis (OA)',
  'OA grade IV (RME)': 'Osteoarthritis (OA)',
  'OA Bahu': 'Osteoarthritis (OA)',
  Osteoartritis: 'Osteoarthritis (OA)',
  'Osteoartritis Genu': 'Osteoarthritis (OA)',
  'Rheumatoid Artritis': 'Rheumatoid Arthritis (RA)',
  'Polimyalgia Reumatik': 'Polimialgia reumatik',
  'Meniscus Tear': 'Lesi meniskus, medial, dan lateral',
  'Meniscus tear': 'Lesi meniskus, medial, dan lateral',
  'Meniscus tear dextra': 'Lesi meniskus, medial, dan lateral',
  'Meniscus tear lateral dextra': 'Lesi meniskus, medial, dan lateral',
  'Ruptur Meniscus - (RME)': 'Lesi meniskus, medial, dan lateral',
  'Sprain Ankle dekstra': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Sprain Genu': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Sprain genu Dx': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'sprain genu dextra': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  Tenosynovitis: 'Tenosinovitis supuratif',
  tenosivitis: 'Tenosinovitis supuratif',
  'Tenosynovitis Supuratif Akut (RME)': 'Tenosinovitis supuratif',
  'Tenosinovitis supurativ ec tertusuk duri ikan': 'Tenosinovitis supuratif',
  'Osteomyelitis kronik post-fraktur': 'Osteomielitis',
  'Spondylolisthesis/HNP': 'HNP / Low Back Pain',

  // Jiwa
  'Skizoafektif Depresif': 'Skizoafektif',
  'Skizoafektif Tipe Depresi': 'Skizoafektif',
  'Skizoafektif fase manik': 'Skizoafektif',
  'Skizoafektif tipe manik': 'Skizoafektif',
  skizoparanoid: 'Skizofrenia Paranoid',
  Paranoid: 'Skizofrenia Paranoid',
  'Skizofrenia dengan gangguan waham': 'Skizofrenia',
  'Serangan Panik': 'Gangguan Panik',
  'Panic attack/Gang. Cemas Menyeluruh': 'Gangguan Panik',
  Trikotiloamania: 'Trikotilomania',
  'Insomnia e.c. Depresi': 'Insomnia (primer/early/middle/late)',
  'Gangguan cemas + insomnia middle': 'Insomnia (primer/early/middle/late)',

  // Kulit
  'Pityriasis rosea': 'Pitiriasis rosea',
  'Ptiriasis rosea': 'Pitiriasis rosea',
  'LSK/Neurodermatitis': 'Liken simpleks kronik/neurodermatitis',
  'Dermatitis numularis/like simpleks kronis': 'Liken simpleks kronik/neurodermatitis',
  'Moluskum contagiosum': 'Moluskum kontagiosum',
  'Melasma / SC': 'Melasma',
  Rubeola: 'Morbili tanpa komplikasi',
  'Skrofuloderma TB': 'Skrofuloderma',
  'Sifilis Primer': 'Sifilis stadium 1 dan 2',
  'Lepra tipe MB': 'Kusta (Morbus Hansen)',
  'Morbus Hansen tipe MB': 'Kusta (Morbus Hansen)',
  'Morbus Hansen tipe Multibasiler dengan reaksi kusta tipe 1': 'Kusta (Morbus Hansen)',
  Varicella: 'Varisela tanpa komplikasi',
  'SJS/TEN (tindakan Infus)': 'Sindrom Stevens-Johnson',
  'Tinea cruris': 'Tinea kruris',
  'Tinea mannum': 'Tinea manus',
  'Vulnus apertum': 'Vulnus laseratum, punctum',
  'Vulnus laceratum antebrachii dextra': 'Vulnus laseratum, punctum',
  'Vulnus laceratum humerus sinistra': 'Vulnus laseratum, punctum',
  'Vulnus laceratum dd vulnus scissum': 'Vulnus laseratum, punctum',
  'Vulnus Scissum Regio Antebrachii Sinistra': 'Vulnus laseratum, punctum',
  'Vulnus scissum regio antebrachii sinistra': 'Vulnus laseratum, punctum',
  'Vulnus scissum regio femur': 'Vulnus laseratum, punctum',
  'Vulnus scissum: hecting': 'Vulnus laseratum, punctum',
  'Vulnus schissum': 'Vulnus laseratum, punctum',

  // Indera
  'Miopia (Koreksi Visus)': 'Miopia ringan',
  'Miopia ringan (resep kacamata)': 'Miopia ringan',
  'Presbiopia (resep kacamata)': 'Presbiopia',
  'Rinitis alergi': 'Rhinitis Alergika',
  'Rhinitis Alergika Persisten Sedang-Berat': 'Rhinitis Alergika',
  'Rhinitis alergi persisten derajat ringan': 'Rhinitis Alergika',
  'Rhinits Alergi Derajat Ringan': 'Rhinitis Alergika',
  'Laserasi palpebra': 'Laserasi kelopak mata',
  'Otitis Media Efusi': 'Otitis media serosa',

  // Paru dan infeksi
  'Penumonia (CAP)': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia lobaris komunitas': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia Klebsiella (ada hasil kultur, cxr)': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia dgn comorbid DM tipe 2': 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia Aspirasi (Anak)': 'Pneumonia (lobaris/aspirasi/CAP)',
  Pertussis: 'Pertusis',
  'PPOK (Spirometri)': 'PPOK Eksaserbasi Akut',
  'TB dewasa': 'Tuberkulosis Paru',
  'TB paru gagal pengobatan': 'Tuberkulosis Paru',
  'Tuberkulosis Paru Kasus Baru': 'Tuberkulosis Paru',
  'TB anak + gizi kurang': 'Tuberkulosis Paru',
  'TB Paru + candidiasis oral + Susp HIV': 'Tuberkulosis dengan HIV',
  'TB paru + HIV + Candidiasis Oral': 'Tuberkulosis dengan HIV',
  'Limfadenopati regio coli': 'Limfadenopati',
  /*
   * 'Limfadenopati TB' dan 'Limfadenopati TB anak' dipetakan ke 'Limfadenitis',
   * bukan ke catatan tuberkulosis paru: yang diujikan adalah benjolan lehernya
   * — sifat rabaan, untaian kelenjar yang menyatu, abses dingin, dan biopsi —
   * dan catatan limfadenitis membahas tuberkulosis kelenjar beserta
   * skrofuloderma pada tempatnya.
   */
  'Limfadenopati TB': 'Limfadenitis',
  'Limfadenopati TB anak': 'Limfadenitis',
  'Limfadenitis dd limfadenopati regio coli': 'Limfadenitis',
  'Malaria tropikana': 'Malaria (falciparum/vivax) — apus darah tebal/tipis',
  'Malaria (Pungsi vena)': 'Malaria (falciparum/vivax) — apus darah tebal/tipis',
  'Weils disease - (RME)': 'Leptospirosis / Weil Disease',
  'Leptospirosis/Weils': 'Leptospirosis / Weil Disease',
  'Toxoplasmosis + AIDS': 'Toksoplasmosis serebral',
  Meningoensefalitis: 'Meningitis / Meningoensefalitis',
  Menierre: 'Meniere Disease',
  'Vertigo ec menier disease': 'Meniere Disease',
  'Stroke hemoragik (SAH)': 'Stroke Hemoragik / TIA',

  // Jantung dan kegawatan
  'STEMI anteroseptal + HT grade 1': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'STEMI anteroseptal + HT grd 1 + Hiperlipidemia': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'UAP / NSTEMI / APS (tindakan pasang EKG dan interpretasi)': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'VES Unifokal Trigemini (Baca EKG + interpretasi)': 'Ventricular Ectopic (VES) — baca EKG',
  'VES + hipokalemia (3,1) + HT gr 1': 'Ventricular Ectopic (VES) — baca EKG',
  'Syok Anafilaksis (IV)': 'Syok Anafilaktik — tindakan resusitasi',
  'Syok Hipovolemik ec. Dehidrasi berat ec Diare': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok hipovolemik e.c diare dengan dehidrasi berat': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok dengan Riwayat Diare (tindakan Infus)': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Syok hipovolemik ec OF Femur Dextra': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Superficial Vein Thrombosis / Thromboflebitis': 'Tromboflebitis',
  'Partus normal (tindakan APN 60 langkah)': 'Asuhan Persalinan Normal (APN 60 langkah)',
  'Pasang AKDR': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Pasang IUD': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Vaksin campak': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Imunisasi dan status gizi anak': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',
  'Ulkus Peptikum ec Gastropati NSAID - (RME)': 'Ulkus (gaster, duodenum)',

  /*
   * YANG SENGAJA DIBIARKAN KOSONG dari kelompok ini:
   *
   *   'Retinitis pigmentosa', 'Kista Nabothian', dan 'IUGR' — memang belum
   *   ada catatannya sama sekali. Ini pekerjaan menulis.
   *
   *   'Sistitis komplikata' DIPETAKAN ke 'Sistitis Akut' walaupun komplikata
   *   dan non-komplikata berbeda lama pengobatannya; catatan itu membahas
   *   pembedaannya, sehingga yang membacanya justru menemukan yang dicari.
   *
   *   'RA OA' dan 'Ra/Gout' — dua penyakit dalam satu baris, seperti 'ANC,
   *   KPD'. Menautkannya ke salah satu menyembunyikan yang lain, dan justru
   *   MEMBEDAKAN keduanya yang sedang diuji.
   */

  // Catatan baru yang ditulis pada gelombang ini.
  Ankilostomiasis: 'Ankilostomiasis (Cacing Tambang)',
  'Ankilostomiasis (RME)': 'Ankilostomiasis (Cacing Tambang)',
  'Penyakit cacing tambang': 'Ankilostomiasis (Cacing Tambang)',
  /*
   * 'Anemia Megaloblastik ec cacing tambang (RME)' SUDAH dipetakan di atas ke
   * 'Anemia megaloblastik', dan itu dipertahankan: yang disebut sebagai
   * DIAGNOSIS pada baris rekap itu adalah anemia megaloblastiknya, cacing
   * tambang disebut sebagai sebabnya. Perlu dicatat bahwa cacing tambang
   * sesungguhnya menimbulkan anemia MIKROSITIK karena kehilangan besi, bukan
   * megaloblastik; keduanya baru terjadi bersamaan bila gizinya sangat buruk.
   * Kejanggalan itu dibiarkan apa adanya di sini karena berasal dari rekapnya,
   * dan catatan cacing tambang membahas perbedaan itu pada diagnosis banding.
   */
  'Cushing syndrome': 'Sindrom Cushing',
  'Cushing disease dd/ Cushing syndrome': 'Sindrom Cushing',
  'DM Tipe Lain ec Kortikosteroid': 'Sindrom Cushing',
  /*
   * 'Hidronefrosis renal kanan grade 2 e.c ureterolithiasis' dan 'Hidroureter'
   * dipetakan ke catatan batu saluran kemih: keduanya adalah AKIBAT sumbatan
   * batu, dan yang diujikan pada stasiun itu adalah menemukan sumbatannya
   * serta menanganinya, bukan bendungannya sendiri.
   */
  'Hidronefrosis renal kanan grade 2 e.c ureterolithiasis': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  Hidroureter: 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'Ramsay Hunt Syndrome': 'Sindrom Ramsay Hunt',
  'Epiglottitis - (RME)': 'Epiglotitis Akut',
  Epiglotitis: 'Epiglotitis Akut',
  Epiglottitis: 'Epiglotitis Akut',
  'Ulkus Mole': 'Ulkus Mole (Chancroid)',
  'Ulkus Molle': 'Ulkus Mole (Chancroid)',
  'Ulkus molle (H.Ducreyi)': 'Ulkus Mole (Chancroid)',
  Chancroid: 'Ulkus Mole (Chancroid)',
  'Pitiriasis Versicolor': 'Pitiriasis Versikolor (Panu)',
  Panu: 'Pitiriasis Versikolor (Panu)',

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * GELOMBANG TERAKHIR — sisa kasus sekali muncul yang hanya beda cara menulis.
   * Dipilih satu per satu dari daftar calon; yang tidak dipetakan diberi
   * alasannya di akhir bagian ini.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Jantung dan kegawatan
  STEMI: 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'UAP / NSTEMI': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'UAP/ NSTEMI : EKG': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'UAP/STEMI': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'ST elevasi V1-V4? St depresi II III aVf? LVH': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'syok anafilaktik STEMI': 'Syok Anafilaktik — tindakan resusitasi',
  'HHS / Tindakan resusitasi cairan (Tindakan Pasang IV line)': 'Hyperosmolar Hyperglycemic State (HHS/HONK) — resusitasi cairan',
  'Syok Septik': 'Syok (septik, hipovolemik, kardiogenik, neurogenik)',
  'Syok septik - iv line': 'Syok (septik, hipovolemik, kardiogenik, neurogenik)',
  'Syok hipovolemik ec PPH ec Atonia uteri (KBE KBI)': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'V-Fib + Sinus Bradikardia (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'RJP neonatus': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  Hipertensi: 'Hipertensi esensial',
  'Hipertensi grade I': 'Hipertensi esensial',
  'Hipertensi stage 2': 'Hipertensi esensial',
  'HT Stage 1': 'Hipertensi esensial',
  'HT Grade 1 + Hiperkolesterolnemia': 'Hipertensi esensial',

  // Saraf dan jiwa
  Migrain: 'Migrain (dengan/tanpa aura)',
  'Stroke/TIA': 'Stroke Hemoragik / TIA',
  'Neuropati DM': 'Neuropati Perifer e.c. DM',
  'Late insomnia': 'Insomnia (primer/early/middle/late)',
  'insomnia dd/depresi': 'Insomnia (primer/early/middle/late)',
  'Narkolepsi/hipersomnia': 'Hipersomnia',
  'Psikotik akut': 'Gangguan Psikotik Akut',
  'skizofrenia/ waham menetap( gajelas)': 'Gangguan Waham Menetap',
  'Gangguan cemas + depresi': 'Gangguan campuran cemas depresi',
  'gg cemas dan depresi ringan': 'Gangguan campuran cemas depresi',
  'gg cemas dan depresi sedang': 'Gangguan campuran cemas depresi',
  'impotensi e.c gangguan cemas': 'Gangguan Cemas Menyeluruh (GAD)',
  'Psikotik Post Partum': 'Baby Blues / Depresi Postpartum',
  'GMO karena demam (riwayat meminum alkohol': 'Intoksikasi Alkohol / Zat Psikoaktif',
  'Gangguan mental dan perilaku e.c zat psikoaktif ganja': 'Intoksikasi Alkohol / Zat Psikoaktif',
  'intoksikasi oplosan-pasang NGT': 'Intoksikasi Alkohol / Zat Psikoaktif',

  // Dalam dan infeksi
  Pneumonia: 'Pneumonia (lobaris/aspirasi/CAP)',
  'Pneumonia Berat / Bronkiolitis akut (px anak)': 'Bronkiolitis (anak)',
  Pielonefritis: 'Pielonefritis Akut',
  Hipoglikemia: 'Hipoglikemia berat',
  'Anemia G6PD - (RME)': 'Anemia hemolitik',
  'IBS tipe diare': 'Irritable Bowel Syndrome',
  'Ruptur ginjal ec trauma': 'Ruptur ginjal',
  'Trauma ginjal sinistra': 'Ruptur ginjal',
  'Ruptur Varises Esofagus (NGT)': 'Varises esofagus',
  'Sirhep - hematemesis melena (NGT)': 'Varises esofagus',
  'Peritonitis e.c Perforasi App (NGT)': 'Perforasi usus',
  'Peritonitis e.c Perforasi Gaster': 'Perforasi usus',
  'Ulkus DM': 'Ulkus pada tungkai',
  'Obesitas, hiperlipid': 'Obesitas (berbagai grade)',
  'Obestias anak + hipertrofi tonsil': 'Obesitas (berbagai grade)',
  'Underweight (BMI 15.6)': 'Obesitas (berbagai grade)',
  'omphalitis anak': 'Omfalitis',
  'Infeksi neonatorum dd omfalitis': 'Omfalitis',
  'Periappendicular Infiltrate': 'Appendisitis Akut',
  'diare anak': 'Gastroenteritis (termasuk kolera, giardiasis)',
  DADRS: 'Gastroenteritis (termasuk kolera, giardiasis)',
  'Diare cair akut ec intoksikasi makanan': 'Gastroenteritis (termasuk kolera, giardiasis)',

  // Indera dan kulit
  Miopia: 'Miopia ringan',
  'Astigmatisme / miopia': 'Astigmatism ringan',
  'Dry eye Syndrome': 'Mata kering',
  'Dry eyes ODS': 'Mata kering',
  'dry eye': 'Mata kering',
  rhinitis: 'Rhinitis akut',
  'Rinitis akut/Common cold': 'Rhinitis akut',
  Morbili: 'Morbili tanpa komplikasi',
  'Morbili / Ichtyosis vulgaris': 'Morbili tanpa komplikasi',
  'Miliaria Rubra / Measles': 'Miliaria',
  'Scabies / miliaria': 'Skabies',
  'Pityriasis rosea/urtikaria akut': 'Urtikaria akut',
  'Dermatitis numularis / LSK / Tinea pedis': 'Dermatitis numularis',
  'FDE di penis': 'Insect Bite / Fixed Drug Eruption',
  'Erupsi obat morbiliformis / makulopapular (exanthema drug eruption)': 'Insect Bite / Fixed Drug Eruption',
  'Acne vulgaris/folikulitis': 'Akne vulgaris sedang-berat',
  'Abses (insisi drainase)': 'Abses folikel rambut atau kelenjar sebasea',

  // Otot, tulang, dan tindakan
  'Sprain Ankle': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Sprain ankle dextra': 'Ankle Sprain / Knee Sprain / Wrist Sprain',
  'Sprain Genu /Meniscus Tear': 'Lesi meniskus, medial, dan lateral',
  'trauma genu': 'Lesi meniskus, medial, dan lateral',
  'Open fracture os tibia fibula': 'Fraktur terbuka, tertutup',
  'Open fracture os tibia-fibula sinistra 1/3 distal displaced': 'Fraktur terbuka, tertutup',
  'Fraktur Terbuka os Tibia Sinistra Medial Oblique grade 3A (RME) / Tx Pemasangan Bidai': 'Fraktur terbuka, tertutup',
  'Fraktur terbuka os radius et ulna 1/3 distal, komplit, dgn dislokasi os ulnar pd regio antebrachii (Irigasi / debridement + Bidai)': 'Fraktur terbuka, tertutup',
  'Soft tissue injury metacarpal sin': 'Trauma sendi',
  Hecting: 'Vulnus laseratum, punctum',
  'Retensio Urin (tindakan Kateter)': 'Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter',

  // Kandungan
  Partus: 'Partus lama',
  'Pelepasan Implan (konseling & tindakan)': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Pemasangan AKDR (Tindakan)': 'Konseling & Pemasangan/Pelepasan KB (implan/AKDR)',
  'Servisitis gonore': 'Servisitis / Uretritis Gonore',
  'uretritis non GO': 'Servisitis / Uretritis Gonore',
  'Susp. ca serviks (IVA)': 'Suspek Ca Serviks — IVA test / Pap smear',
  'suspek ca serviks IVA': 'Suspek Ca Serviks — IVA test / Pap smear',
  'servisitis suspek ca serviks tes iva': 'Suspek Ca Serviks — IVA test / Pap smear',
  'keputihan + papsmear': 'Suspek Ca Serviks — IVA test / Pap smear',
  'Candidiasis / Ca Cervix Lesi Prakanker (tindakan pap smear)': 'Suspek Ca Serviks — IVA test / Pap smear',
  'Ca Serviks': 'Karsinoma serviks',
  'Primigravida dengan anemia defisiensi besi (ANC)': 'Anemia defisiensi besi pada kehamilan',
  'Hamil 37 mgg tanpa penyulit (ANC)': 'ANC Normal (Antenatal Care)',
  'PEB (ANC)': 'Preeklampsia',
  'G1P0A0, Hamil 32 Minggu, JTH Preskep dengan PEB': 'Preeklampsia',
  'G4P2A0 hamil 32 minggu, janin tunggal hidup, letak kepala, dg PEB tanpa HELLP syndrome': 'Preeklampsia',
  'G1P0A0 + UK 38-39 minggu + JT + PK + AH + KPD': 'Ketuban Pecah Dini (KPD)',

  /*
   * YANG SENGAJA DIBIARKAN KOSONG, dan alasannya:
   *
   *   'Ra/Gout', 'RA OA', 'ANC, KPD', 'Pentabio, OPV, KMS', 'Mastitis
   *   uretritis GO' — satu baris berisi DUA penyakit atau dua stasiun, dan
   *   justru MEMBEDAKAN keduanya yang sedang diuji.
   *
   *   'Diare akut ec E coli', 'ec Intoleransi laktosa', 'Taeniasis',
   *   'Giardiasis', 'ec intoksikasi susu sapi', 'DADR-S ec intoleransi
   *   laktosa', 'DATD ec intoleransi laktosa' — yang diujikan adalah
   *   MEMBEDAKAN penyebabnya, sehingga menautkan semuanya ke satu catatan
   *   diare justru menghapus yang sedang diuji.
   *
   *   'Kista Nabothian', 'IUGR', 'Retinitis pigmentosa', 'Sindrom Geriatri',
   *   'Ruptur Vesica Urinaria' dan 'Akut abdomen ec Ruptur Buli',
   *   'Gangguan sex hipoaktif', 'Hiposeksual disorder (Vaginismus)',
   *   'Anemia + Diare ec Scistosomiasis', 'Toxic Thyroid Nodule', 'SNNT/SNT',
   *   'Konjungtivitis fliktenularis', 'Obstruksi Saluran Nafas e.c Aspirasi
   *   Corpus Alienum', 'Tenosinovitis supurativ ec tertusuk duri ikan' —
   *   memang belum ada catatannya. Ini pekerjaan menulis, bukan menyambung.
   *
   *   Patah tulang HUMERUS dan FEMUR tetap tidak ditautkan ke catatan bidai
   *   klavikula/tibia/radius; alasannya sudah ditulis di bagian sebelumnya.
   */

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * SISA TERAKHIR. Setelah ini yang belum terjangkau hanyalah baris yang
   * BUKAN kasus, baris berisi dua stasiun, dan segelintir penyakit yang
   * catatannya memang perlu ditulis — semuanya didaftar di akhir.
   * ═══════════════════════════════════════════════════════════════════════
   */

  // Tiroid
  'Struma difus toksik/Graves disease': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'Struma Difusa Toksik : Grave Disease': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'Struma difusa toksik / graves disease': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'Struma Difussa Toksik ec Graves Disease': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'Toxic Thyroid Nodule': "Goiter Endemik / Grave's Disease / Hipertiroid",
  'SNNT/SNT': 'Goiter',

  // Imunologi dan infeksi
  'SLE (ANA test, anti CCP) - (RME)': 'Systemic Lupus Erythematosus (SLE)',
  'Suspek SLE + Anemia + Candidiasis oral': 'Systemic Lupus Erythematosus (SLE)',
  'Toxo cerebri + HIV + candida': 'Toksoplasmosis serebral',
  Gonorrhea: 'Gonore',
  'Morbus Hansen tipe Multibasiler dengan reaksi kusta tipe II (ENL)': 'Kusta (Morbus Hansen)',
  'Anemia + Diare ec Scistosomiasis': 'Skistosomiasis',
  'Diare akut Taeniasis': 'Taeniasis',
  'Diare Berlemak e.c. Giardia Lamblia (Giardiasis)': 'Gastroenteritis (termasuk kolera, giardiasis)',
  'Diare akut ec E coli': 'Gastroenteritis (termasuk kolera, giardiasis)',
  'Ensefalopati Hepatikum ec. Hepatitis A': 'Hepatitis A / B',
  'intoksikasi organofosfat pasang NGT': 'Intoksikasi Alkohol / Zat Psikoaktif',
  PSCBA: 'Varises esofagus',

  // Anak dan saraf
  'Marasmus? Kwarshiorkor?': 'Marasmus / Kwashiorkor (gizi buruk anak)',
  'KDK / KDS + tatalaksana kejang + KIE gizi (tindakan infus)': 'Kejang Demam Sederhana (KDS)',
  'Hemiparese sinistra dan parese n. 7': 'Stroke Iskemik',
  'Anemia megaloblastik (tp bingung def B 12 atau asam folat, krn tdk ada data)': 'Anemia megaloblastik',

  // Indera
  'oe difusa aurikula dextra': 'Otitis Eksterna',
  'OD Corpal Konjungtiva OS Emetrop': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Korpus Alienum OD + Emetropia OS': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Obstruksi Saluran Nafas e.c Aspirasi Corpus Alienum Manik- manik (Backblow)': 'Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi',
  'Konjungtivitis fliktenularis? Pinguekulitis? Episkleritis?': 'Episkleritis / Keratitis',

  // Kandungan dan kemih
  'Syok Hipovolemik ec HPP + Inversio Uteri (tindakan Infus + Reposisi manual)': 'Syok Hipovolemik / Hemoragik — pasang IV line',
  'Akut abdomen ec Ruptur Buli (tindakan Kateter)': 'Ruptur uretra',
  'Ruptur Vesica Urinaria': 'Ruptur uretra',
  'Gangguan sex hipoaktif': 'Gangguan keinginan dan gairah seksual',
  'Hiposeksual disorder (Vaginismus)': 'Gangguan keinginan dan gairah seksual',

  // Tulang — patah femur dan humerus kini punya sasaran yang benar
  /*
   * Patah FEMUR dan HUMERUS sebelumnya sengaja dibiarkan kosong karena catatan
   * bidai yang ada khusus untuk klavikula, tibia-fibula, dan radius-ulna.
   * Sekarang catatan 'Fraktur terbuka, tertutup' sudah lengkap 8/8 dan
   * membahas prinsip umum — termasuk perdarahan 1-1,5 liter pada patah femur
   * dan sindrom kompartemen — sehingga menautkannya ke situ benar, dan bukan
   * lagi ke catatan bidai anggota gerak atas.
   */
  'fr femur': 'Fraktur terbuka, tertutup',
  'Fraktur femur 1/3 medial': 'Fraktur terbuka, tertutup',
  'Fraktur femur terutup 1/3 proksimal komplit': 'Fraktur terbuka, tertutup',
  'frtertutup os femur 1/3 medial sinistra': 'Fraktur terbuka, tertutup',
  'Fraktur humerus (pembidaian)': 'Fraktur terbuka, tertutup',
  'close fracture komplit 1/3 distal humerus dextra': 'Fraktur terbuka, tertutup',
  'Fraktur tertutup 1/3 distal os humerus dekstra oblik': 'Fraktur terbuka, tertutup',
  'Fraktur tertutup Os humerus 1/3 lateral, displacement garis fraktur oblique': 'Fraktur terbuka, tertutup',
  'Fr. Tibia 1/3 distal dekstra': 'Fraktur terbuka, tertutup',
  'Meniscus tear medial + dislokasi patella': 'Lesi meniskus, medial, dan lateral',

  /*
   * YANG TETAP TIDAK DIPETAKAN, dan seluruh alasannya:
   *
   *   'ANC, KPD', 'Pentabio, OPV, KMS', 'RA OA', 'Ra/Gout', 'Mastitis
   *   uretritis GO', 'fr humerus gout', dan 'ANC (G2P1A0H1 ... dd/ IUGR??)' —
   *   satu baris berisi DUA stasiun atau dua penyakit; menautkannya ke salah
   *   satu justru menyembunyikan yang lain.
   *
   *   'DADR-S ec intoleransi laktosa', 'DATD ec intoleransi laktosa', 'Diare
   *   akut ec Intoleransi laktosa', dan 'Diare ec intoksikasi susu sapi' —
   *   catatan intoleransi laktosa memang belum ada, dan menautkannya ke
   *   catatan diare umum menghapus justru yang sedang diuji.
   *
   *   'Retinitis pigmentosa', 'Kista Nabothian', 'IUGR', dan 'Sindrom
   *   Geriatri' — catatannya memang belum ada.
   *
   *   'Ga ada data' dan 'gaada?' bukan kasus sama sekali; keduanya lolos dari
   *   saringan bukanKasus() karena panjangnya melebihi ambang.
   */

  // Catatan yang ditulis pada gelombang penutup.
  'Retinitis pigmentosa': 'Retinitis Pigmentosa',
  IUGR: 'Pertumbuhan Janin Terhambat (IUGR)',
  'Sindrom Geriatri - (RME)': 'Sindrom Geriatri',
  'DADR-S ec intoleransi laktosa': 'Intoleransi Laktosa',
  'DATD ec intoleransi laktosa': 'Intoleransi Laktosa',
  'Diare akut ec Intoleransi laktosa': 'Intoleransi Laktosa',
  'Diare ec intoksikasi susu sapi': 'Intoleransi Laktosa',
}

/**
 * Catatan untuk sebuah nama kasus, lewat nama aslinya lebih dahulu lalu
 * lewat tabel padanan. Mengembalikan undefined bila memang belum ada — dan
 * itu benar; kartu kasusnya lalu tampil tanpa tombol "Catatan", bukan tampil
 * dengan catatan penyakit lain.
 */

/**
 * Catatan penyakit SKDI dibentuk ulang menjadi catatan stasiun.
 *
 * CACAT YANG MELAHIRKAN FUNGSI INI. catatanStasiun() hanya melihat
 * OSCE_STATION_NOTES. Padahal ratusan penyakit yang keluar di rekap ujian
 * catatannya sudah lengkap di skdiDiseaseNotes.ts — Bells' palsy, Goiter,
 * Hipertiroid, Osteomielitis, Lipoma, Kandidiasis mulut, Sifilis, Varisela.
 * Semuanya ADA, dan tidak satu pun dapat dibuka dari halaman rekap.
 *
 * Ketahuannya bukan dari membaca kode, melainkan dari aliasSasaran.mjs yang
 * menolak 19 padanan sekaligus: sasarannya memang ada sebagai catatan, hanya
 * bukan di rak yang dilihat fungsi ini.
 *
 * MENGAPA DIBENTUK ULANG, BUKAN DISATUKAN. Kedua bentuk berbeda dengan sengaja:
 * anamnesis SKDI berupa kerangka SOCRATES bermedan-medan, sedangkan stasiun
 * OSCE berupa daftar butir yang diucapkan di depan penguji. Menyatukan tipenya
 * akan memaksa salah satu kehilangan bentuk yang justru menjadi gunanya.
 * Perubahan bentuk dikerjakan di sini, di satu tempat, dan dapat dibaca.
 */
function dariCatatanSkdi(n: SkdiDiseaseNote): OsceStationNote {
  const a = n.anamnesis
  const anamnesis = a
    ? [
        `Keluhan utama: ${a.keluhanUtama}`,
        `Riwayat penyakit sekarang: ${a.riwayatPenyakitSekarang}`,
        a.riwayatPenyakitDahulu && `Riwayat penyakit dahulu: ${a.riwayatPenyakitDahulu}`,
        a.riwayatPenyakitKeluarga && `Riwayat penyakit keluarga: ${a.riwayatPenyakitKeluarga}`,
        a.riwayatPengobatan && `Riwayat pengobatan: ${a.riwayatPengobatan}`,
        a.riwayatAlergi && `Riwayat alergi: ${a.riwayatAlergi}`,
        a.riwayatKehamilanPersalinan && `Riwayat kehamilan dan persalinan: ${a.riwayatKehamilanPersalinan}`,
        a.riwayatTumbuhKembang && `Riwayat tumbuh kembang: ${a.riwayatTumbuhKembang}`,
        a.riwayatNutrisi && `Riwayat nutrisi: ${a.riwayatNutrisi}`,
        a.riwayatImunisasi && `Riwayat imunisasi: ${a.riwayatImunisasi}`,
        a.riwayatSosialEkonomi && `Riwayat sosial ekonomi: ${a.riwayatSosialEkonomi}`,
      ].filter((x): x is string => Boolean(x))
    : []

  // kriteriaDiagnosis WAJIB pada bentuk stasiun, dan tipe SkdiDiseaseNote sudah
  // memaksa salah satu dari `diagnosis` atau `goldStandard` ada — jadi rangkaian
  // ini tidak pernah benar-benar jatuh ke untai kosong. Untai kosong tetap
  // ditulis agar tidak ada tanda seru yang memaksa TypeScript diam.
  const kriteriaDiagnosis = n.goldStandard ?? (n.diagnosis ? n.diagnosis.join(' ') : '')

  return {
    definisi: n.definisi,
    // etiologi SKDI berupa satu paragraf, stasiun berupa daftar.
    etiologi: n.etiologi ? [n.etiologi] : undefined,
    patofisiologi: n.patofisiologi,
    rantai: n.rantai,
    anamnesis,
    pemeriksaanFisik: n.pemeriksaanFisik ?? [],
    penunjang: n.penunjang,
    kriteriaDiagnosis,
    diagnosisBanding: n.diagnosisBanding,
    tatalaksana: n.tatalaksana,
  }
}

export function catatanStasiun(nama: string): OsceStationNote | undefined {
  const sasaran = ALIAS[nama] ?? nama
  // Urutannya disengaja: catatan stasiun lebih dahulu, sebab ia ditulis khusus
  // untuk ujian dan memuat langkah tindakannya. Catatan SKDI adalah cadangan.
  const stasiun = OSCE_STATION_NOTES[nama] ?? OSCE_STATION_NOTES[sasaran]
  if (stasiun) return stasiun
  const skdi = SKDI_DISEASE_NOTES[nama] ?? SKDI_DISEASE_NOTES[sasaran]
  return skdi ? dariCatatanSkdi(skdi) : undefined
}

export default catatanStasiun
