// Health quiz content bank — graded from layperson to frontier science.
// Every answer carries an `explanation`; from "spesialis" upward this must
// include the underlying pathophysiology/biochemistry, not just the verdict —
// per house rule (see VO2max/Ference/Celis-Morales citations elsewhere in the
// app): no unqualified claims, cite where a claim could plausibly be doubted.

export type Band = 'mudah' | 'menengah' | 'sulit'
export type Tier =
  | 'awam' | 'preklinik' | 'koas' | 'internship' | 'dokter_umum' // mudah
  | 'spesialis' | 'fellowship' | 'subspesialis' // menengah
  | 'profesor' | 'nobel' | 'inovator' // sulit

export interface QuizQuestion {
  id: string
  type: 'tf' | 'mcq'
  q: string
  options?: string[] // mcq only
  answer: boolean | number // tf: true=Fakta; mcq: index into options
  explanation: string
  source?: string
}

export const BANDS: { id: Band; label: string; tiers: Tier[] }[] = [
  { id: 'mudah', label: 'Mudah', tiers: ['awam', 'preklinik', 'koas', 'internship', 'dokter_umum'] },
  { id: 'menengah', label: 'Menengah', tiers: ['spesialis', 'fellowship', 'subspesialis'] },
  { id: 'sulit', label: 'Sulit', tiers: ['profesor', 'nobel', 'inovator'] },
]

export const TIER_LABEL: Record<Tier, string> = {
  awam: 'Awam', preklinik: 'Preklinik', koas: 'Koas', internship: 'Internship', dokter_umum: 'Dokter Umum',
  spesialis: 'Spesialis', fellowship: 'Fellowship', subspesialis: 'Subspesialis',
  profesor: 'Profesor', nobel: 'Nobel', inovator: 'Inovator',
}

export const QUIZ_BANK: Record<Tier, QuizQuestion[]> = {
  awam: [
    { id: 'awam-1', type: 'tf', q: 'Minum air dingin setelah olahraga berat berbahaya bagi jantung.', answer: false,
      explanation: 'Mitos. Tidak ada mekanisme yang membuat air dingin "mengejutkan" jantung — lambung hanya menghangatkan cairan sebelum diserap. Yang perlu diwaspadai justru dehidrasi, bukan suhu air minumnya.' },
    { id: 'awam-2', type: 'tf', q: 'Tekanan darah normal dewasa sekitar 120/80 mmHg.', answer: true,
      explanation: 'Fakta (mendekati). Pedoman ACC/AHA 2017 mendefinisikan "normal" sebagai <120/<80 mmHg; 120-129/<80 sudah masuk kategori "elevated".' },
    { id: 'awam-3', type: 'tf', q: 'Detoks jus 3 hari dapat "membersihkan" racun dari hati.', answer: false,
      explanation: 'Mitos. Hati dan ginjal Anda sudah menetralisir & membuang zat sisa setiap saat lewat enzim sitokrom P450 dan konjugasi — bukan proses yang butuh "dipicu" oleh jus, dan tidak ada bukti klinis detoks jus mempercepatnya.' },
    { id: 'awam-4', type: 'tf', q: 'Bunyi "kretek" saat menekuk buku jari menyebabkan radang sendi (artritis) di kemudian hari.', answer: false,
      explanation: 'Mitos. Bunyi itu berasal dari pecahnya gelembung gas (nitrogen) di cairan sinovial sendi (kavitasi) — beberapa studi jangka panjang tidak menemukan hubungan dengan risiko artritis.' },
  ],
  preklinik: [
    { id: 'prek-1', type: 'mcq', q: 'Fase kontraksi ventrikel jantung yang memompa darah keluar disebut...', options: ['Diastol', 'Sistol', 'Refrakter absolut', 'Repolarisasi'], answer: 1,
      explanation: 'Sistol ventrikel dipicu influks Ca²⁺ lewat kanal L-type saat depolarisasi, yang memicu pelepasan Ca²⁺ tambahan dari retikulum sarkoplasma (calcium-induced calcium release) — Ca²⁺ berikatan troponin C, membuka situs miosin, kontraksi aktin-miosin dimulai.' },
    { id: 'prek-2', type: 'tf', q: 'HbA1c mencerminkan rerata gula darah 2-3 bulan terakhir.', answer: true,
      explanation: 'Fakta. Glukosa berikatan non-enzimatik (glikasi) dengan valin N-terminal rantai beta hemoglobin secara ireversibel, sebanding paparan glukosa — dan eritrosit hidup ~120 hari, sehingga HbA1c mencerminkan rerata ~2-3 bulan.' },
    { id: 'prek-3', type: 'mcq', q: 'Enzim glikolisis yang menjadi titik kontrol utama (rate-limiting), dihambat ATP/sitrat dan diaktifkan AMP...', options: ['Heksokinase', 'Piruvat kinase', 'Fosfofruktokinase-1 (PFK-1)', 'Aldolase'], answer: 2,
      explanation: 'PFK-1 mengubah fruktosa-6-fosfat → fruktosa-1,6-bisfosfat. Ini titik kontrol paling ketat glikolisis: ATP & sitrat (sinyal energi cukup) menghambatnya, AMP & fruktosa-2,6-bisfosfat (sinyal energi rendah) mengaktifkannya.' },
  ],
  koas: [
    { id: 'koas-1', type: 'mcq', q: 'Nyeri dada tipikal + ST elevasi di sadapan II, III, aVF paling mengarah oklusi...', options: ['Left Anterior Descending (LAD)', 'Right Coronary Artery (RCA)', 'Left Circumflex (LCx)', 'Left Main'], answer: 1,
      explanation: 'Sadapan II, III, aVF merekam permukaan inferior jantung, yang pada mayoritas orang (right-dominant) diperdarahi RCA — STEMI inferior klasik juga berisiko melibatkan ventrikel kanan & blok AV karena RCA turut memperdarahi nodus AV.' },
    { id: 'koas-2', type: 'tf', q: 'Pankreatitis akut khas dengan nyeri epigastrium menjalar ke punggung disertai kenaikan lipase serum.', answer: true,
      explanation: 'Fakta. Lipase lebih spesifik & bertahan naik lebih lama dibanding amilase karena tidak dibersihkan secepat amilase oleh ginjal; nyeri menjalar ke punggung karena pankreas terletak retroperitoneal dekat pleksus splanknikus.' },
  ],
  internship: [
    { id: 'intern-1', type: 'mcq', q: 'Tatalaksana lini pertama syok anafilaksis adalah...', options: ['Difenhidramin IV', 'Metilprednisolon IV', 'Epinefrin IM (paha, anterolateral)', 'Salbutamol nebul'], answer: 2,
      explanation: 'Epinefrin IM adalah satu-satunya obat yang membalik semua komponen anafilaksis: agonis α1 (vasokonstriksi, lawan hipotensi), β1 (inotropik/kronotropik), β2 (bronkodilatasi, kurangi pelepasan mediator mast cell). Antihistamin/steroid hanya terapi tambahan, tidak menyelamatkan nyawa secepat epinefrin.' },
    { id: 'intern-2', type: 'tf', q: 'Pada hiperkalemia berat dengan perubahan EKG, kalsium glukonat diberikan untuk menurunkan kadar kalium darah.', answer: false,
      explanation: 'Mitos — ini kesalahan umum. Kalsium glukonat menstabilkan membran miokard (menaikkan ambang depolarisasi) untuk mencegah aritmia fatal, TIDAK menurunkan kadar K⁺. Yang menggeser K⁺ masuk sel adalah insulin+glukosa atau β2-agonis (salbutamol); yang membuang K⁺ dari tubuh adalah furosemide/resin/dialisis.' },
  ],
  dokter_umum: [
    { id: 'gp-1', type: 'tf', q: 'Statin menurunkan risiko kardiovaskular terutama karena efeknya menurunkan LDL, yang bersifat kausal terhadap aterosklerosis.', answer: true,
      explanation: 'Fakta. Konsensus EAS (Ference dkk., Eur Heart J 2017) mensintesis bukti genetik (Mendelian randomization), epidemiologis, dan RCT — hubungan LDL-ASCVD log-linear dan dose-dependent, dengan prinsip "lower is better, longer is better".',
      source: 'PMID 28444290' },
    { id: 'gp-2', type: 'mcq', q: 'Antihipertensi lini pertama pada pasien diabetes dengan proteinuria adalah golongan...', options: ['Beta-blocker', 'ACE-inhibitor/ARB', 'Diuretik tiazid', 'Calcium channel blocker dihidropiridin'], answer: 1,
      explanation: 'ACE-i/ARB bersifat renoprotektif spesifik: melebarkan arteriol eferen glomerulus lebih besar dari aferen, menurunkan tekanan intraglomerulus & proteinuria — efek independen dari sekadar penurunan tekanan darah sistemik.' },
  ],
  spesialis: [
    { id: 'sp-1', type: 'tf', q: 'Rasio beban akut:kronis (ACWR) di atas ~1.5 dikaitkan dengan meningkatnya risiko cedera non-kontak pada atlet.', answer: true,
      explanation: 'Fakta (dengan nuansa). Kerja Tim Gabbett menunjukkan "sweet spot" ACWR sekitar 0.8–1.3 memiliki risiko cedera terendah; lonjakan beban akut jauh melebihi rerata kronis (>1.5) berkorelasi dengan cedera non-kontak, meski metodologi ACWR sendiri masih diperdebatkan (masalah kalkulasi rasio & bias matematis).' },
    { id: 'sp-2', type: 'mcq', q: 'Manfaat SGLT2 inhibitor pada gagal jantung (independen dari efek glukosurik/diuretiknya) paling banyak dikaitkan dengan mekanisme...', options: ['Blokade reseptor beta-adrenergik', 'Pergeseran metabolisme miokard ke pemanfaatan keton yang lebih efisien energi + penghambatan Na⁺/H⁺ exchanger (NHE) kardiak', 'Peningkatan kontraktilitas lewat cAMP', 'Vasodilatasi koroner langsung'], answer: 1,
      explanation: 'Mekanisme kardioprotektif SGLT2i pada gagal jantung masih area riset aktif, tapi hipotesis terkuat saat ini: pergeseran bahan bakar miokard ke badan keton (lebih efisien secara termodinamik) dan penghambatan NHE kardiak yang mengurangi overload Na⁺/Ca²⁺ intraseluler — bukan semata efek diuretik/glukosurik seperti dikira awalnya.' },
  ],
  fellowship: [
    { id: 'fel-1', type: 'mcq', q: 'Familial hypercholesterolemia klasik paling sering disebabkan mutasi loss-of-function pada gen...', options: ['PCSK9', 'APOB', 'LDLR (reseptor LDL)', 'LPL'], answer: 2,
      explanation: 'Mutasi LDLR (~85-90% kasus FH) membuat reseptor LDL hepatosit tidak berfungsi/berkurang, sehingga LDL plasma tidak dibersihkan efisien. Mutasi APOB (defective ligand-binding) dan gain-of-function PCSK9 (mendegradasi reseptor LDL) adalah penyebab minoritas dengan fenotipe serupa.' },
    { id: 'fel-2', type: 'tf', q: 'PCSK9 bekerja dengan mendegradasi reseptor LDL di hepatosit, sehingga inhibitor PCSK9 meningkatkan daur ulang reseptor & menurunkan LDL plasma.', answer: true,
      explanation: 'Fakta. PCSK9 normalnya berikatan dengan reseptor LDL dan mengarahkannya ke degradasi lisosomal alih-alih didaur ulang ke permukaan sel. Menghambat PCSK9 (mis. alirocumab/evolocumab) membuat lebih banyak reseptor LDL kembali ke permukaan hepatosit, menurunkan LDL plasma tajam.' },
  ],
  subspesialis: [
    { id: 'sub-1', type: 'mcq', q: 'Varian null ACTN3 R577X (genotipe XX, tanpa protein alfa-aktinin-3 fungsional) secara populasi cenderung terkait fenotipe...', options: ['Sprint/power lebih unggul', 'Endurans/daya tahan relatif lebih unggul', 'Tidak ada asosiasi apa pun', 'Risiko kardiomiopati'], answer: 1,
      explanation: 'Alfa-aktinin-3 (produk ACTN3) terekspresi di serat otot cepat (tipe II). Studi landmark Yang dkk. (Am J Hum Genet 2003) menemukan genotipe RR (protein fungsional utuh) berlebih pada atlet sprint/power elit, sementara XX (null) relatif berlebih pada atlet endurans — meski efeknya kecil di level individu, bukan determinan tunggal.',
      source: 'PMID 12879365' },
    { id: 'sub-2', type: 'tf', q: 'PGC-1α adalah co-activator utama biogenesis mitokondria yang diinduksi latihan aerobik lewat jalur AMPK-SIRT1.', answer: true,
      explanation: 'Fakta. Latihan menaikkan rasio AMP:ATP → mengaktifkan AMPK → meningkatkan NAD⁺ yang mengaktifkan SIRT1 → keduanya men-deasetilasi & memfosforilasi PGC-1α → PGC-1α mengoordinasi transkripsi gen nuklir & mitokondria (lewat NRF-1/2 dan TFAM) untuk biogenesis mitokondria baru.' },
  ],
  profesor: [
    { id: 'prof-1', type: 'mcq', q: 'Suplementasi antioksidan dosis tinggi pasca-latihan dapat MENGURANGI adaptasi latihan aerobik karena...', options: ['Antioksidan bersifat toksik pada otot', 'Meredam sinyal ROS yang diperlukan untuk mengaktifkan jalur Nrf2/PGC-1α (mitohormesis)', 'Antioksidan menghambat sintesis protein otot secara langsung', 'Tidak ada bukti efek semacam itu'], answer: 1,
      explanation: 'Konsep "mitohormesis": ROS (spesies oksigen reaktif) yang dihasilkan mitokondria selama latihan bukan semata produk sampingan berbahaya, tapi sinyal adaptif yang mengaktifkan jalur Nrf2 (respons antioksidan endogen) dan PGC-1α (biogenesis mitokondria). Meredam ROS dengan antioksidan dosis tinggi (vitamin C/E megadose) di beberapa uji coba justru meredam adaptasi ini — hormesis: dosis rendah stresor menguntungkan, netralisasi penuh menghilangkan manfaat.' },
    { id: 'prof-2', type: 'tf', q: 'Akumulasi sel senescent berkontribusi pada penuaan lewat SASP (senescence-associated secretory phenotype) yang memicu inflamasi kronis sistemik ("inflammaging").', answer: true,
      explanation: 'Fakta. Sel senescent berhenti membelah tapi tetap metabolik aktif, mensekresi sitokin pro-inflamasi (IL-6, IL-8, TNF-α) dan protease (SASP) yang merusak jaringan sekitar & merekrut sel imun — akumulasinya seiring usia dikaitkan dengan inflammaging dan menjadi target terapi senolitik eksperimental (dasatinib+quercetin, fisetin).' },
  ],
  nobel: [
    { id: 'nob-1', type: 'mcq', q: 'Hadiah Nobel Fisiologi/Kedokteran 2016 diberikan atas penemuan mekanisme...', options: ['Apoptosis', 'Autofagi', 'CRISPR-Cas9', 'Imunoterapi kanker (checkpoint inhibitor)'], answer: 1,
      explanation: 'Yoshinori Ohsumi menerima Nobel 2016 untuk penemuan mekanisme autofagi — proses sel mendegradasi & mendaur ulang komponennya sendiri lewat vesikel (autofagosom) yang menyatu dengan lisosom, penting untuk respons kelaparan, pembersihan protein rusak, dan implikasi luas pada penuaan & neurodegenerasi.' },
    { id: 'nob-2', type: 'tf', q: 'Nobel Fisiologi/Kedokteran 2019 (Semenza, Kaelin, Ratcliffe) menjelaskan bagaimana sel mendeteksi oksigen lewat degradasi HIF-1α oleh VHL saat oksigen cukup tersedia.', answer: true,
      explanation: 'Fakta. Saat oksigen cukup, enzim prolyl hydroxylase menghidroksilasi HIF-1α, yang kemudian dikenali protein von Hippel-Lindau (VHL) dan didegradasi lewat jalur ubiquitin-proteasome. Saat hipoksia, hidroksilasi terhambat, HIF-1α stabil, translokasi ke nukleus, mengaktifkan gen adaptif (eritropoietin, VEGF, enzim glikolitik).' },
  ],
  inovator: [
    { id: 'inov-1', type: 'tf', q: 'Terapi berbasis CRISPR (exagamglogene autotemcel / Casgevy) telah mendapat persetujuan regulator untuk penyakit sel sabit sejak akhir 2023.', answer: true,
      explanation: 'Fakta. Casgevy menjadi terapi gene-editing CRISPR-Cas9 pertama yang disetujui regulator (UK MHRA & FDA AS, akhir 2023) untuk sickle cell disease & thalasemia dependen-transfusi — bekerja dengan mengedit gen BCL11A pada sel punca hematopoietik pasien sendiri untuk mereaktivasi produksi hemoglobin fetal (HbF) yang menggantikan HbS yang cacat.',
      source: 'PMID 38425279' },
    { id: 'inov-2', type: 'mcq', q: 'Sensor continuous glucose monitor (CGM) modern mendeteksi glukosa interstisial memakai prinsip elektrokimia berbasis enzim...', options: ['Amilase', 'Glukosa oksidase', 'Laktat dehidrogenase', 'Heksokinase'], answer: 1,
      explanation: 'Glukosa oksidase mengkatalisis oksidasi glukosa menjadi asam glukonat + hidrogen peroksida (H₂O₂); elektroda sensor mengukur arus dari oksidasi H₂O₂ yang sebanding linear dengan konsentrasi glukosa interstisial — prinsip yang sama dipakai sejak glukometer generasi awal, kini diminiaturisasi untuk pemakaian kontinu 10-14 hari.' },
  ],
}

export function questionsForTier(tier: Tier): QuizQuestion[] {
  return QUIZ_BANK[tier] ?? []
}

export function bandOfTier(tier: Tier): Band {
  return BANDS.find((b) => b.tiers.includes(tier))!.id
}
