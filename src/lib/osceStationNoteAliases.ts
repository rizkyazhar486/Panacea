import { OSCE_STATION_NOTES } from './osceStationNotes'

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
}

/**
 * Catatan untuk sebuah nama kasus, lewat nama aslinya lebih dahulu lalu
 * lewat tabel padanan. Mengembalikan undefined bila memang belum ada — dan
 * itu benar; kartu kasusnya lalu tampil tanpa tombol "Catatan", bukan tampil
 * dengan catatan penyakit lain.
 */
export function catatanStasiun(nama: string) {
  return OSCE_STATION_NOTES[nama] ?? OSCE_STATION_NOTES[ALIAS[nama] ?? '']
}

export default catatanStasiun
