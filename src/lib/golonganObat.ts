// ─────────────────────────────────────────────────────────────────────────────
// Golongan obat menurut KELUHAN — bukan menurut abjad.
//
// KEKURANGAN YANG MELAHIRKAN BERKAS INI. mekanismeObat.ts sudah memuat 151 obat
// satuan, dan tiap entri menjelaskan obatnya dengan baik. Tetapi seluruhnya
// disusun sebagai KAMUS: ia menjawab "apa itu furosemid", dan tidak menjawab
// pertanyaan yang sebenarnya muncul di depan pasien — "orang ini sesak dan
// bengkak, golongan apa yang saya pakai, dan mengapa bukan yang lain".
//
// Kamus hanya berguna bagi yang SUDAH tahu nama obatnya. Yang belum tahu tidak
// punya jalan masuk sama sekali; ia harus menebak dahulu nama yang dicarinya.
// Berkas ini membalik arahnya: dari keluhan menuju golongan, lalu baru menuju
// obat satuannya.
//
// MENGAPA GOLONGAN, BUKAN OBAT SATUAN. Yang diujikan dan yang dipakai di
// bangsal adalah keputusan tingkat GOLONGAN: mukolitik atau antitusif, loop
// atau tiazid, vasopresor atau inotropik, beta-laktam atau makrolid. Setelah
// golongannya benar, memilih satu obat di dalamnya adalah soal ketersediaan dan
// kebiasaan tempat. Yang mematikan adalah salah golongan, bukan salah merek.
//
// TIAP GOLONGAN MEMUAT 'salahnya' — kekeliruan yang paling sering terjadi pada
// golongan itu. Bagian inilah yang paling menentukan, dan justru yang paling
// jarang ditulis: daftar obat mengajarkan apa yang harus dipilih, bukan apa
// yang akan keliru dipilih.
// ─────────────────────────────────────────────────────────────────────────────

export interface GolonganObat {
  /** Nama golongan sebagaimana disebut orang. */
  nama: string
  /** Contoh obat di dalamnya — nama yang benar-benar dipakai di Indonesia. */
  contoh: string
  /** Dosis lazim dewasa (dan anak bila berbeda) untuk obat-obat di atas. */
  dosis: string
  /** Kapan golongan ini yang dipilih. */
  kapan: string
  /** Mekanisme sebagai rantai berpanah; '' memisahkan dua rantai. */
  rantai: string[]
  /** Cara memilih satu obat DI DALAM golongan ini. */
  memilih: string
  /** Kekeliruan yang paling sering pada golongan ini. */
  salahnya: string
}

export interface KelompokKeluhan {
  keluhan: string
  /** Kalimat pembuka: apa yang sesungguhnya sedang diobati. */
  inti: string
  golongan: GolonganObat[]
}

export const OBAT_PER_KELUHAN: KelompokKeluhan[] = [
  {
    keluhan: 'Batuk berdahak',
    inti:
      'Yang diobati bukan batuknya melainkan dahaknya. Batuk pada dahak yang banyak adalah MEKANISME PEMBERSIH — menghentikannya berarti menahan dahak di dalam.',
    golongan: [
      {
        nama: 'Mukolitik',
        contoh: 'Asetilsistein, ambroksol, bromheksin, erdostein',
        dosis:
          'Asetilsistein 3×200 mg PO (atau 1×600 mg efervesen); ambroksol 3×30 mg PO; bromheksin 3×8 mg PO; erdostein 2×300 mg PO. Anak: asetilsistein 100 mg 2–3×/hari (<2 th 2×100 mg). Nebulisasi asetilsistein 10% 3–5 mL tiap 6–8 jam.',
        kapan: 'Dahak KENTAL dan sulit dikeluarkan — PPOK, bronkitis, bronkiektasis, pascaoperasi.',
        rantai: [
          'Asetilsistein memutus ikatan disulfida antar-rantai glikoprotein mukus',
          'anyaman mukus terurai',
          'KEKENTALAN DAHAK TURUN',
          'dahak dapat dikeluarkan oleh batuk dan silia',
          '',
          'Ambroksol menambah surfaktan dan mempercepat gerak silia',
          'dahak terdorong keluar, bukan sekadar diencerkan',
          '',
          'Gugus sulfhidril asetilsistein juga menjadi bahan GLUTATION',
          'dan dari situlah ia menjadi penawar keracunan parasetamol',
        ],
        memilih:
          'Asetilsistein bila dahak sangat kental atau ada penyakit paru menahun; ambroksol untuk keperluan sehari-hari; gliseril guaiakolat (ekspektoran) paling lemah dan sebenarnya bekerja dengan menambah cairan sekret, bukan memutus mukus.',
        salahnya:
          'Diberikan BERSAMA antitusif. Yang satu memperbanyak dahak yang harus dibatukkan, yang lain menghentikan batuknya — dahak tertahan di jalan napas. Ini kombinasi yang lazim ditulis dan tidak masuk akal.',
      },
      {
        nama: 'Antitusif',
        contoh: 'Dekstrometorfan, kodein',
        dosis:
          'Dekstrometorfan 3–4×10–20 mg PO (maks 120 mg/hari); anak 6–12 th 3×5–10 mg, TIDAK untuk <4 tahun. Kodein 3–4×10–20 mg PO (maks 120 mg/hari), tidak untuk <12 tahun.',
        kapan: 'Batuk KERING yang mengganggu tidur atau melelahkan. TIDAK pada batuk berdahak.',
        rantai: [
          'Menekan pusat batuk di medula',
          'refleks batuk ↓',
          'batuk kering mereda',
          '',
          'Pada batuk BERDAHAK, refleks yang ditekan itu justru yang membersihkan',
          'dahak menumpuk, jalan napas kecil tersumbat',
          'risiko infeksi dan atelektasis ↑',
        ],
        memilih:
          'Dekstrometorfan untuk batuk kering biasa. Kodein hanya bila batuknya benar-benar melelahkan dan bukan pada anak.',
        salahnya:
          'Kodein pada ANAK di bawah 12 tahun — dilarang; sebagian anak mengubahnya menjadi morfin dengan sangat cepat dan berhenti bernapas.',
      },
      {
        nama: 'Bronkodilator',
        contoh: 'Salbutamol, ipratropium, aminofilin',
        dosis:
          'Salbutamol inhalasi 2–4 semprot (100 µg/semprot) tiap 4–6 jam; nebulisasi 2,5 mg dalam 2,5 mL NaCl 0,9% tiap 20 menit ×3 pada serangan. Oral 3×2–4 mg. Ipratropium nebulisasi 0,5 mg tiap 6–8 jam; inhalasi 2 semprot (20 µg) 4×/hari. Aminofilin IV muatan 5 mg/kgBB dalam 30 menit, rumatan 0,5 mg/kgBB/jam.',
        kapan: 'Batuk disertai MENGI dan sesak — asma, PPOK. Batuk di sini gejala penyempitan, bukan gejala dahak.',
        rantai: [
          'Beta-2 agonis → cAMP ↑ di otot polos bronkus',
          'otot polos melemas',
          'lumen melebar, mengi dan sesak mereda',
          '',
          'Ipratropium memblok muskarinik',
          'tonus vagal ↓ dan SEKRESI ↓',
          'lebih menolong pada PPOK yang dahaknya banyak',
        ],
        memilih:
          'Salbutamol hirup untuk serangan; ipratropium ditambahkan pada PPOK dan pada serangan asma berat; aminofilin hanya bila keduanya gagal, sebab rentang amannya sempit.',
        salahnya:
          'Diberikan pada batuk berdahak TANPA mengi. Tidak ada penyempitan untuk dilebarkan — yang didapat hanya jantung berdebar dan tangan gemetar.',
      },
    ],
  },

  {
    keluhan: 'Sesak dan bengkak (gagal jantung)',
    inti:
      'Ada DUA sasaran yang berbeda dan tidak boleh tertukar: MEREDAKAN keluhan hari ini, dan MEMPERPANJANG umur. Diuretik meredakan tetapi tidak memperpanjang; penghambat sistem renin dan penyekat beta memperpanjang tetapi tidak meredakan cepat.',
    golongan: [
      {
        nama: 'Diuretik loop',
        contoh: 'Furosemid',
        dosis:
          'Furosemid IV 20–40 mg bolus (yang belum pernah memakai); yang sudah rutin: 1–2,5× dosis oral hariannya IV. Ulang tiap 6–12 jam; infus 5–20 mg/jam bila bandel. Oral 1–2×20–80 mg (maks 600 mg/hari pada gagal ginjal). Anak 1–2 mg/kgBB/kali.',
        kapan: 'Ada BENDUNGAN: sesak, ronki, bengkak tungkai, asites, berat badan naik.',
        rantai: [
          'Furosemid menghambat kotransporter Na-K-2Cl di ansa Henle tebal',
          'natrium tidak diserap kembali',
          'gradien osmotik medula rusak',
          'AIR IKUT KELUAR — diuresis kuat',
          '',
          'Furosemid intravena juga MELEBARKAN VENA dalam beberapa menit',
          'preload turun sebelum satu tetes urin keluar',
          'inilah sebab sesaknya mereda lebih dulu daripada bengkaknya',
          '',
          'Natrium yang lolos ke tubulus distal ditukar dengan KALIUM',
          'kalium dan magnesium terbuang',
          'HIPOKALEMIA → aritmia, dan pada pemakai digoksin jauh lebih berbahaya',
        ],
        memilih:
          'Furosemid intravena pada bendungan akut (bioavailabilitas oral tidak menentu saat usus ikut bendung); oral untuk pemeliharaan. Dosis dinaikkan dengan menambah FREKUENSI, bukan hanya besarnya.',
        salahnya:
          'Dipakai mengejar bengkak tanpa memeriksa KALIUM dan KREATININ. Dan pada edema paru akut, furosemid dosis besar bukan penolong tercepat — sebagian besar penderita tidak kelebihan cairan tubuh melainkan cairannya berpindah ke paru; nitrat, oksigen, dan tekanan positif bekerja lebih dahulu.',
      },
      {
        nama: 'Antagonis aldosteron',
        contoh: 'Spironolakton, eplerenon',
        dosis:
          'Spironolakton 1×12,5–25 mg PO, naikkan sampai 1×50 mg bila kalium <5,0 dan eGFR >30. Eplerenon 1×25 mg → 1×50 mg. Pada asites sirosis: spironolakton 1×100 mg (rasio 100:40 terhadap furosemid), maks 400 mg/hari. Periksa kalium dan kreatinin hari ke-3, ke-7, lalu bulanan.',
        kapan:
          'Gagal jantung dengan fraksi ejeksi menurun, DITAMBAHKAN pada penghambat ACE dan penyekat beta. Juga sirosis dengan asites — di sana ia obat UTAMA, bukan tambahan.',
        rantai: [
          'Spironolakton memblok reseptor mineralokortikoid',
          'natrium tidak ditahan, KALIUM TIDAK DIBUANG',
          'diuresis ringan — dan inilah bagian yang paling tidak penting',
          '',
          'Aldosteron juga merangsang FIBROSIS otot jantung dan pembuluh',
          'memblokirnya menghambat remodeling',
          'ini yang MEMPERPANJANG UMUR, bukan efek diuretiknya',
          '',
          'Pada sirosis, hiperaldosteronisme sekunder adalah pendorong utama asites',
          'karena itu spironolakton lebih unggul daripada furosemid di sana',
        ],
        memilih:
          'Spironolakton lebih murah dan tersedia; eplerenon dipilih bila ginekomastia mengganggu.',
        salahnya:
          'Digabung dengan penghambat ACE dan suplemen kalium tanpa memeriksa kalium — HIPERKALEMIA sampai henti jantung. Ini penyebab kematian iatrogenik yang lazim dan sepenuhnya dapat dicegah.',
      },
      {
        nama: 'Penyekat beta',
        contoh: 'Bisoprolol, karvedilol, metoprolol suksinat',
        dosis:
          'Mulai KECIL, gandakan tiap 2 pekan. Bisoprolol 1×1,25 mg → sasaran 1×10 mg. Karvedilol 2×3,125 mg → sasaran 2×25 mg (>85 kg: 2×50 mg). Metoprolol suksinat 1×12,5–25 mg → sasaran 1×200 mg. Hanya dimulai saat EUVOLEMIK, bukan saat masih bendung.',
        kapan:
          'Gagal jantung yang sudah STABIL dan tidak sedang bendung. Juga hipertensi dengan penyakit koroner, dan pengendalian laju pada fibrilasi atrium.',
        rantai: [
          'Gagal jantung menyalakan simpatis terus-menerus',
          'jangka pendek menolong, jangka panjang MERACUNI otot jantung',
          'reseptor beta menurun, aritmia, remodeling berlanjut',
          '',
          'Penyekat beta memutus rangsangan itu',
          'denyut ↓, kebutuhan oksigen ↓, waktu pengisian diastolik ↑',
          'remodeling melambat',
          'UMUR BERTAMBAH',
          '',
          'Tetapi kontraktilitas juga turun pada minggu-minggu pertama',
          'karena itu dimulai dosis SANGAT KECIL dan dinaikkan perlahan',
          '"start low, go slow"',
        ],
        memilih:
          'Hanya tiga yang terbukti memperpanjang umur pada gagal jantung: bisoprolol, karvedilol, metoprolol suksinat. Karvedilol juga memblok alfa sehingga menurunkan tekanan darah lebih banyak.',
        salahnya:
          'Dimulai atau dinaikkan saat penderita SEDANG bendung dan sesak — memperburuknya. Dan dihentikan MENDADAK pada penyakit koroner: reseptor yang sudah bertambah peka membuat angina dan infark memantul balik.',
      },
      {
        nama: 'Digoksin',
        contoh: 'Digoksin',
        dosis:
          'Rumatan 1×0,125–0,25 mg PO. Usia >70 tahun, berat badan kecil, atau eGFR <60: 1×0,0625–0,125 mg. Digitalisasi cepat (jarang): 0,5 mg IV, lalu 0,25 mg tiap 6 jam sampai 1–1,5 mg. Sasaran kadar 0,5–0,9 ng/mL.',
        kapan:
          'Gagal jantung yang masih bergejala walau obat utamanya sudah lengkap, dan fibrilasi atrium dengan laju cepat — terutama bila penderitanya banyak berbaring.',
        rantai: [
          'Digoksin menghambat pompa Na-K-ATPase',
          'natrium menumpuk di dalam sel',
          'penukar Na-Ca melambat',
          'KALSIUM di dalam sel ↑',
          'kontraksi lebih kuat (inotropik positif)',
          '',
          'Sekaligus menaikkan tonus VAGUS',
          'hantaran nodus AV melambat',
          'laju bilik pada fibrilasi atrium turun',
          '',
          'Ia MENGURANGI GEJALA dan rawat inap',
          'tetapi TIDAK memperpanjang umur',
        ],
        memilih:
          'Dosis kecil, dan disesuaikan pada usia lanjut serta gangguan ginjal — digoksin dibuang lewat ginjal.',
        salahnya:
          'Diberikan bersama furosemid tanpa memantau kalium. HIPOKALEMIA membuat digoksin jauh lebih mudah meracuni: mual, penglihatan KEKUNINGAN, bigemini, blok AV. Dan pada fibrilasi atrium yang penderitanya aktif, digoksin kalah oleh penyekat beta karena tonus vagal kalah oleh simpatis saat bergerak.',
      },
      {
        nama: 'Nitrat',
        contoh: 'ISDN, isosorbid mononitrat, nitrogliserin',
        dosis:
          'Nitrogliserin sublingual 0,3–0,6 mg tiap 5 menit maks 3×; IV mulai 5–10 µg/menit, naikkan 5 µg tiap 3–5 menit (sasaran TDS >90 mmHg). ISDN sublingual 5 mg; oral 3×5–20 mg. Isosorbid mononitrat 1×30–120 mg lepas lambat. WAJIB jeda bebas nitrat 8–12 jam.',
        kapan:
          'Edema paru akut, angina, dan hipertensi berat dengan bendungan paru. Yang diredakan adalah SESAK dan NYERI DADA.',
        rantai: [
          'Nitrat melepas nitrat oksida',
          'cGMP ↑ di otot polos pembuluh',
          'VENA melemas lebih dahulu daripada arteri',
          'darah tertampung di perifer',
          'PRELOAD TURUN',
          'tekanan pengisian bilik kiri turun dalam hitungan MENIT',
          'cairan berhenti merembes ke alveolus',
          '',
          'Pada dosis lebih besar arteri koroner ikut melebar',
          'aliran ke daerah iskemik ↑, nyeri dada mereda',
          '',
          'Dipakai terus-menerus, reseptornya menumpul',
          'TOLERANSI — karena itu perlu jeda bebas nitrat 8-12 jam',
        ],
        memilih:
          'Nitrogliserin infus pada edema paru akut dan sindrom koroner akut (mudah dititrasi); ISDN sublingual untuk serangan angina; mononitrat oral untuk pencegahan.',
        salahnya:
          'Diberikan pada TEKANAN DARAH RENDAH, stenosis aorta berat, atau INFARK BILIK KANAN — ketiganya bergantung pada preload, dan menurunkannya membuat tekanan darah anjlok. Dan MUTLAK dilarang bila penderita memakai obat disfungsi ereksi dalam 24-48 jam.',
      },
      {
        nama: 'Penghambat ACE / ARB / ARNI',
        contoh: 'Kaptopril, ramipril, lisinopril; kandesartan, valsartan; sakubitril-valsartan',
        dosis:
          'Kaptopril 3×6,25 mg → sasaran 3×50 mg. Ramipril 1×1,25–2,5 mg → sasaran 1×10 mg. Lisinopril 1×2,5–5 mg → sasaran 1×20–35 mg. Kandesartan 1×4 mg → sasaran 1×32 mg. Valsartan 2×40 mg → sasaran 2×160 mg. Sakubitril-valsartan 2×49/51 mg → sasaran 2×97/103 mg; bila dari penghambat ACE WAJIB jeda 36 jam, bila dari ARB langsung. Gandakan tiap 2 pekan; periksa kalium dan kreatinin 1–2 pekan sesudah tiap kenaikan.',
        kapan:
          'SEMUA gagal jantung dengan fraksi ejeksi turun (HFrEF), tanpa menunggu keluhan mereda. Inilah tiang pertama "terapi kuartet".',
        rantai: [
          'Curah jantung turun → ginjal mengira tubuh kekurangan darah',
          'renin keluar → angiotensin II → aldosteron',
          'pembuluh menyempit, garam dan air ditahan',
          'beban jantung yang sudah lemah justru DITAMBAH',
          '',
          'Penghambat ACE memutus angiotensin I → II',
          'afterload dan preload turun, remodeling terhambat',
          'bilik kiri tidak terus membesar — inilah yang memperpanjang umur',
          '',
          'Penghambat ACE juga menghambat penguraian BRADIKININ',
          'bradikinin menumpuk di saluran napas → BATUK KERING (sampai 15%)',
          'ARB tidak menyentuh bradikinin — karena itu tidak membuat batuk',
          '',
          'Sakubitril menghambat neprilisin',
          'peptida natriuretik (BNP, ANP) tidak diuraikan',
          'diuresis dan vasodilatasi alami menguat SEKALIGUS RAAS dihambat',
        ],
        memilih:
          'Mulai dengan penghambat ACE murah (kaptopril/ramipril). Pindah ke ARB hanya bila BATUK mengganggu. Naikkan ke ARNI bila masih bergejala pada dosis sasaran — ARNI lebih unggul daripada enalapril pada PARADIGM-HF, tetapi harganya menentukan.',
        salahnya:
          'Dihentikan karena kreatinin naik sedikit. Kenaikan sampai 30% dari awal adalah HARAPAN, bukan bahaya — itu tanda tekanan glomerulus turun. Yang benar-benar menghentikan: kalium >5,5, kreatinin naik >30%, atau angioedema. Dan ARNI diberikan berdampingan dengan penghambat ACE dalam 36 jam → ANGIOEDEMA.',
      },
      {
        nama: 'Penghambat SGLT2',
        contoh: 'Dapagliflozin, empagliflozin',
        dosis:
          'Dapagliflozin 1×10 mg PO. Empagliflozin 1×10 mg PO. Tanpa titrasi — dosisnya satu dan langsung sasaran. Diteruskan sampai eGFR ≥20; dihentikan sementara saat puasa lama, sakit berat, atau sebelum operasi (3 hari).',
        kapan:
          'SEMUA gagal jantung — fraksi ejeksi turun MAUPUN terjaga, ada kencing manis maupun tidak. Tiang keempat "terapi kuartet".',
        rantai: [
          'SGLT2 di tubulus proksimal menyerap kembali glukosa bersama NATRIUM',
          'dihambat → glukosa dan natrium keluar bersama air',
          'preload turun tanpa mengaktifkan renin seperti diuretik loop',
          '',
          'Natrium sampai ke makula densa dalam jumlah normal kembali',
          'umpan balik tubuloglomerulus pulih → arteriol aferen menyempit',
          'tekanan di dalam glomerulus TURUN — ginjal terlindungi',
          '',
          'Sel jantung beralih memakai badan keton sebagai bahan bakar',
          'efisiensi energi miokardium naik',
          'manfaatnya muncul dalam PEKAN, jauh sebelum gula darah berubah',
        ],
        memilih:
          'Keduanya setara; pilih yang tersedia. Tidak perlu menunggu penghambat ACE dan penyekat beta mencapai dosis sasaran — keempat tiang dimulai berdekatan, bukan berurutan.',
        salahnya:
          'Dianggap obat kencing manis sehingga tidak diberikan pada yang gulanya normal — padahal manfaat gagal jantungnya tidak bergantung pada gula. Lupa memperingatkan KETOASIDOSIS EUGLIKEMIK (ketoasidosis dengan gula darah normal) dan infeksi jamur kelamin.',
      },
    ],
  },

  {
    keluhan: 'Syok — tekanan darah tidak terangkat oleh cairan',
    inti:
      'Sebelum obat apa pun: pastikan CAIRANNYA sudah cukup. Vasopresor pada penderita yang masih kekurangan cairan hanya menyembunyikan hipovolemia sambil mematikan perfusi organ. Setelah itu pertanyaannya satu — yang rusak POMPANYA atau PIPANYA?',
    golongan: [
      {
        nama: 'Vasopresor',
        contoh: 'Norepinefrin, dopamin dosis besar, vasopresin',
        dosis:
          'Norepinefrin 0,05–0,1 µg/kgBB/menit, titrasi sampai MAP ≥65 mmHg (lazim 0,05–1 µg/kgBB/menit). Vasopresin 0,03 unit/menit dosis TETAP (tidak dititrasi). Dopamin 5–20 µg/kgBB/menit. Sebaiknya lewat vena sentral.',
        kapan: 'PIPANYA yang melebar: syok septik, syok neurogenik, anafilaksis yang tidak menjawab adrenalin.',
        rantai: [
          'Norepinefrin → reseptor ALFA-1 pembuluh',
          'vasokonstriksi',
          'tahanan pembuluh sistemik ↑',
          'TEKANAN PERFUSI ORGAN ↑',
          '',
          'Efek beta-1-nya ringan sehingga denyut tidak banyak bertambah',
          'inilah sebab ia menjadi pilihan pertama pada syok septik',
        ],
        memilih:
          'Norepinefrin adalah pilihan pertama pada syok septik. Vasopresin ditambahkan bila dosis norepinefrin sudah tinggi. Adrenalin pada anafilaksis dan henti jantung.',
        salahnya:
          'Diberikan lewat vena tepi kecil — kebocorannya menimbulkan NEKROSIS jaringan; pakai vena besar atau vena sentral. Dan dinaikkan terus tanpa menilai ulang kecukupan cairan.',
      },
      {
        nama: 'Inotropik',
        contoh: 'Dobutamin, milrinon, dopamin dosis sedang',
        dosis:
          'Dobutamin 2,5–20 µg/kgBB/menit. Milrinon muatan 50 µg/kgBB dalam 10 menit (sering dilewati karena menurunkan tekanan), rumatan 0,125–0,75 µg/kgBB/menit; kurangi pada gagal ginjal. Dopamin 3–5 µg/kgBB/menit.',
        kapan: 'POMPANYA yang gagal: syok kardiogenik, gagal jantung dengan perfusi buruk — akral DINGIN dengan urin sedikit.',
        rantai: [
          'Dobutamin → reseptor BETA-1 otot jantung',
          'cAMP ↑, kalsium intrasel ↑',
          'KONTRAKTILITAS ↑',
          'curah jantung ↑',
          '',
          'Efek beta-2-nya sedikit melebarkan pembuluh',
          'afterload turun, jantung lebih ringan bekerja',
          'tetapi TEKANAN DARAH dapat justru TURUN',
          'karena itu pada syok kardiogenik ia sering dipadu vasopresor',
          '',
          'Kontraksi yang lebih kuat menuntut oksigen lebih banyak',
          'pada jantung yang sedang iskemik, ini pedang bermata dua',
        ],
        memilih:
          'Dobutamin bila tekanan darah masih dapat dipertahankan; bila tekanan darah sangat rendah, norepinefrin lebih dahulu, baru dobutamin ditambahkan.',
        salahnya:
          'Dipakai sebagai "obat penaik tekanan darah". Dobutamin bukan vasopresor — pada penderita yang hipotensi karena pipanya melebar, ia dapat menurunkan tekanan darah lebih jauh.',
      },
      {
        nama: 'Dopamin',
        contoh: 'Dopamin',
        dosis:
          '<3 µg/kgBB/menit dopaminergik (TIDAK melindungi ginjal), 3–5 beta (inotropik), >10 alfa (vasopresor). Efeknya bertumpang tindih pada tiap orang — takaran tidak menjamin reseptor mana yang bekerja.',
        kapan:
          'Kini jarang menjadi pilihan pertama. Masih dipakai bila norepinefrin tidak tersedia, dan pada bradikardia bergejala.',
        rantai: [
          'EFEKNYA BERUBAH MENURUT DOSIS — inilah yang membuatnya sering keliru dipakai',
          '',
          'Dosis kecil (1-3 mcg/kg/menit) → reseptor dopaminergik',
          'pembuluh ginjal melebar, urin bertambah',
          'TETAPI ini TIDAK melindungi ginjal — "dosis ginjal" sudah ditinggalkan',
          '',
          'Dosis sedang (3-10) → beta-1',
          'kontraktilitas dan denyut ↑ — bekerja sebagai inotropik',
          '',
          'Dosis besar (di atas 10) → alfa-1',
          'vasokonstriksi — bekerja sebagai vasopresor',
        ],
        memilih:
          'Bila terpaksa dipakai, dosisnya ditentukan oleh apa yang dituju, bukan oleh kebiasaan.',
        salahnya:
          'Dibandingkan norepinefrin pada syok, dopamin menimbulkan lebih banyak ARITMIA dan pada syok kardiogenik kematiannya lebih tinggi. "Dosis ginjal" untuk mencegah gagal ginjal tidak pernah terbukti dan sudah ditinggalkan — memakainya berarti menunda pengobatan yang sesungguhnya.',
      },
    ],
  },

  {
    keluhan: 'Infeksi bakteri — memilih golongan antibiotik',
    inti:
      'Pertanyaannya berurutan: organ apa, kuman apa yang paling mungkin di sana, dan apakah obatnya SAMPAI ke tempat itu. Bukan "antibiotik apa yang kuat".',
    golongan: [
      {
        nama: 'Beta-laktam — penisilin',
        contoh: 'Amoksisilin, ampisilin, penisilin benzatin, amoksisilin-klavulanat',
        dosis:
          'Amoksisilin 3×500 mg PO (pneumonia komunitas dewasa 3×1 g); anak 25–50 mg/kgBB/hari terbagi 3, otitis/pneumonia 80–90 mg/kgBB/hari. Amoksisilin-klavulanat 3×500/125 mg atau 2×875/125 mg. Ampisilin IV 4×1–2 g. Penisilin benzatin 1,2 juta IU IM dosis tunggal (<27 kg: 600.000 IU); sifilis lanjut 2,4 juta IU/pekan ×3.',
        kapan:
          'Infeksi saluran napas atas dan bawah komunitas, radang tenggorok streptokokus, kulit, dan gigi. Pilihan pertama untuk sebagian besar keadaan.',
        rantai: [
          'Cincin beta-laktam mengikat protein pengikat penisilin (PBP)',
          'penyambungan silang peptidoglikan dinding sel terhenti',
          'dinding rapuh sementara autolisin terus bekerja',
          'BAKTERI PECAH — bakterisid',
          '',
          'Bakteri melawan dengan enzim BETA-LAKTAMASE yang membuka cincinnya',
          'klavulanat mengorbankan diri mengikat enzim itu',
          'karena itu amoksisilin-klavulanat bekerja pada kuman penghasil beta-laktamase',
        ],
        memilih:
          'Amoksisilin untuk infeksi komunitas biasa; ditambah klavulanat bila ada gigitan, sinusitis yang gagal, atau dugaan penghasil beta-laktamase; penisilin benzatin suntik untuk pencegahan demam reumatik.',
        salahnya:
          'Diberikan pada MONONUKLEOSIS yang dikira radang tenggorok bakteri — timbul ruam menyeluruh yang lalu salah dicatat sebagai alergi penisilin seumur hidup. Dan riwayat "alergi" yang tidak ditelusuri: sebagian besar sebenarnya hanya mual atau mencret.',
      },
      {
        nama: 'Beta-laktam — sefalosporin',
        contoh: 'Sefadroksil, sefiksim (generasi 1-3 oral); seftriakson, sefotaksim, seftazidim (suntik)',
        dosis:
          'Sefadroksil 2×500 mg PO. Sefiksim 2×100–200 mg PO (anak 8 mg/kgBB/hari). Seftriakson 1–2 g IV/IM 1×/hari; meningitis 2×2 g. Sefotaksim 3–4×1–2 g IV. Seftazidim 3×1–2 g IV (Pseudomonas). Sefazolin 3×1–2 g IV untuk profilaksis bedah (30–60 menit sebelum insisi).',
        kapan:
          'Bila penisilin tidak memadai atau infeksinya berat. Seftriakson menembus selaput otak sehingga menjadi tulang punggung pengobatan meningitis dan tifoid berat.',
        rantai: [
          'Mekanismenya SAMA dengan penisilin — mengikat PBP, dinding sel gagal terbentuk',
          '',
          'Yang berubah menurut generasi adalah SASARANNYA',
          'generasi 1 → kuat pada gram POSITIF (kulit, jaringan lunak)',
          'generasi 2 → mulai bergeser',
          'generasi 3 → kuat pada gram NEGATIF, dan menembus selaput otak',
          'generasi 4 dan seterusnya → termasuk Pseudomonas',
          '',
          'Makin tinggi generasinya, makin ke gram negatif — dan makin lemah pada stafilokokus',
        ],
        memilih:
          'Sefadroksil untuk kulit; sefiksim oral untuk saluran kemih dan tifoid ringan; seftriakson untuk meningitis, tifoid berat, pneumonia berat, dan gonore; seftazidim bila Pseudomonas dicurigai.',
        salahnya:
          'Seftriakson diberikan bersama cairan yang MENGANDUNG KALSIUM pada bayi baru lahir — endapan kalsium-seftriakson di paru dan ginjal, dan bayi meninggal. Dan generasi ketiga dipakai untuk infeksi kulit biasa, padahal justru di situ ia lebih lemah daripada generasi pertama.',
      },
      {
        nama: 'Makrolid',
        contoh: 'Azitromisin, eritromisin, klaritromisin',
        dosis:
          'Azitromisin 1×500 mg hari ke-1 lalu 1×250 mg hari ke-2–5, atau 1×500 mg ×3 hari; anak 10 mg/kgBB/hari. Eritromisin 4×500 mg. Klaritromisin 2×500 mg. Pertusis: azitromisin 1×500 mg ×5 hari.',
        kapan:
          'Kuman ATIPIK — Mycoplasma, Chlamydophila, Legionella. Juga pilihan bila penderita benar-benar alergi penisilin, dan untuk pertusis serta gonore (dipadu seftriakson).',
        rantai: [
          'Mengikat subunit ribosom 50S',
          'translokasi rantai peptida terhenti',
          'sintesis protein berhenti — bakteriostatik',
          '',
          'Bersifat lipofilik dan MASUK KE DALAM SEL',
          'karena itu ia mencapai kuman yang hidup di dalam sel',
          'inilah sebab ia menjadi pilihan untuk kuman atipik',
          '',
          'Azitromisin menumpuk di jaringan dan bertahan lama',
          'cukup diberikan 3-5 hari untuk kerja seminggu',
        ],
        memilih:
          'Azitromisin paling praktis (sekali sehari, jangka pendek, lambung lebih tahan); eritromisin murah tetapi sering mual; klaritromisin dipakai pada pemberantasan Helicobacter pylori.',
        salahnya:
          'Diberikan bersama obat lain yang MEMANJANGKAN QT (kuinolon, haloperidol, ondansetron, antijamur azol) — risiko torsades. Dan eritromisin serta klaritromisin menghambat CYP3A4 sehingga menaikkan kadar statin, warfarin, dan karbamazepin sampai berbahaya.',
      },
      {
        nama: 'Kuinolon (fluorokuinolon)',
        contoh: 'Siprofloksasin, levofloksasin, moksifloksasin',
        dosis:
          'Siprofloksasin 2×500 mg PO / 2×400 mg IV (ISK sederhana 2×250 mg ×3 hari). Levofloksasin 1×500–750 mg. Moksifloksasin 1×400 mg. TIDAK diberikan bersama antasida, besi, kalsium, atau susu — beri jarak 2 jam. Hindari pada <18 tahun dan kehamilan.',
        kapan:
          'Infeksi saluran kemih atas, infeksi perut (dipadu metronidazol), tifoid, dan sebagian infeksi paru. Bukan obat pertama untuk keluhan ringan.',
        rantai: [
          'Menghambat DNA girase dan topoisomerase IV',
          'DNA tidak dapat dilepas pilinannya untuk disalin',
          'BAKTERI MATI — bakterisid',
          '',
          'Penyerapan oralnya sangat baik, hampir setara suntikan',
          'menembus prostat, tulang, dan ginjal dengan baik',
          '',
          'Siprofloksasin kuat pada gram negatif termasuk Pseudomonas',
          'levofloksasin dan moksifloksasin bergeser ke arah pneumokokus dan atipik',
          '"kuinolon pernapasan"',
        ],
        memilih:
          'Siprofloksasin untuk saluran kemih dan perut; levofloksasin untuk paru; moksifloksasin bila anaerob juga dituju (tetapi lemah di saluran kemih).',
        salahnya:
          'Diminum bersamaan dengan SUSU, ANTASIDA, BESI, atau ZINK — kation dua valensi mengikatnya di usus dan penyerapannya anjlok; beri jarak dua jam. Merusak TENDON (Achilles dapat putus, berbulan-bulan setelah obat dihentikan), memperberat MIASTENIA GRAVIS, dan MEMANJANGKAN QT. Dan ia menyamarkan TUBERKULOSIS: kuinolon membunuh sebagian basil TB sehingga penderita membaik sementara, diagnosisnya tertunda, dan resistansi terbentuk — ini persoalan nyata di Indonesia.',
      },
      {
        nama: 'Aminoglikosida',
        contoh: 'Gentamisin, amikasin, streptomisin',
        dosis:
          'Gentamisin 5–7 mg/kgBB IV 1×/hari (sekali sehari lebih aman dan lebih kuat daripada terbagi). Amikasin 15 mg/kgBB 1×/hari. Streptomisin 15 mg/kgBB IM (maks 1 g; >60 tahun 500–750 mg). Sesuaikan dengan kreatinin; pantau kadar palung.',
        kapan:
          'Infeksi gram negatif berat, sepsis, dan sebagai pendamping beta-laktam pada endokarditis. Streptomisin pada tuberkulosis.',
        rantai: [
          'Mengikat subunit ribosom 30S secara TIDAK TERPULIHKAN',
          'pembacaan kode genetik menjadi salah',
          'protein cacat disisipkan ke dinding sel',
          'BAKTERI MATI — bakterisid, tidak seperti penghambat ribosom lain',
          '',
          'Masuk ke dalam bakteri lewat pengangkutan yang MEMBUTUHKAN OKSIGEN',
          'karena itu ia TIDAK BEKERJA pada kuman ANAEROB sama sekali',
          'dan lemah dalam nanah yang asam dan miskin oksigen',
          '',
          'Membunuh bergantung PUNCAK kadar, bukan lamanya',
          'dan efeknya bertahan setelah kadarnya turun (post-antibiotic effect)',
          'karena itu diberikan SEKALI SEHARI dosis besar',
          'lebih manjur DAN lebih aman daripada dibagi tiga',
        ],
        memilih:
          'Gentamisin paling tersedia; amikasin bila sudah ada resistansi terhadap gentamisin.',
        salahnya:
          'Dipakai tanpa memantau KREATININ dan tanpa menyesuaikan dosis pada gangguan ginjal. Dua racunnya: GINJAL (biasanya pulih) dan TELINGA — ketulian dan kerusakan keseimbangan yang MENETAP dan tidak pulih. Dan jangan digabung dengan furosemid dosis besar atau vankomisin: keduanya menambah kerusakan telinga dan ginjal.',
      },
      {
        nama: 'Antianaerob',
        contoh: 'Metronidazol, klindamisin',
        dosis:
          'Metronidazol 3×500 mg PO/IV; amubiasis 3×750 mg ×7–10 hari; anak 30–50 mg/kgBB/hari. Klindamisin 3–4×300–600 mg PO / 3×600–900 mg IV. Metronidazol MELARANG alkohol sampai 3 hari sesudahnya (reaksi disulfiram).',
        kapan:
          'Infeksi di bawah diafragma dan di rongga mulut: abses, peritonitis, radang panggul, gigi, dan luka gigitan.',
        rantai: [
          'Metronidazol hanya aktif dalam lingkungan TANPA OKSIGEN',
          'gugus nitronya direduksi menjadi radikal',
          'radikal memotong untai DNA',
          'kuman anaerob dan protozoa mati',
          '',
          'Karena butuh keadaan anaerob untuk diaktifkan',
          'ia tidak mengganggu kuman aerob sama sekali — dan itu keunggulannya',
        ],
        memilih:
          'Metronidazol untuk anaerob perut, amubiasis, giardiasis, trikomoniasis, dan Clostridioides difficile. Klindamisin untuk anaerob mulut dan infeksi kulit pada penderita alergi penisilin.',
        salahnya:
          'Metronidazol diminum bersama ALKOHOL — reaksi seperti disulfiram: muka merah, mual hebat, jantung berdebar. Dan klindamisin adalah penyebab klasik KOLITIS oleh Clostridioides difficile.',
      },
    ],
  },

  {
    keluhan: 'Nyeri dada koroner',
    inti:
      'Dua sasaran lagi, dan lagi-lagi jangan tertukar: MEREDAKAN nyeri sekarang, dan MENCEGAH sumbatan berikutnya. Yang meredakan tidak menyelamatkan; yang menyelamatkan tidak terasa.',
    golongan: [
      {
        nama: 'Antiplatelet',
        contoh: 'Aspirin, klopidogrel, tikagrelor',
        dosis:
          'Aspirin muatan 160–320 mg dikunyah, rumatan 1×75–100 mg seumur hidup. Klopidogrel muatan 300 mg (600 mg bila akan PCI; >75 tahun dengan fibrinolisis TANPA muatan), rumatan 1×75 mg. Tikagrelor muatan 180 mg, rumatan 2×90 mg — aspirin pendampingnya tidak boleh >100 mg/hari.',
        kapan: 'Setiap sindrom koroner akut, dan seumur hidup sesudahnya. Diberikan SEGERA — dikunyah, bukan ditelan utuh.',
        rantai: [
          'Aspirin mengasetilasi COX-1 trombosit secara TIDAK TERPULIHKAN',
          'tromboksan A2 tidak terbentuk',
          'trombosit tidak dapat saling menempel',
          '',
          'Trombosit tidak berinti dan tidak dapat membuat enzim baru',
          'maka satu dosis melumpuhkannya SEUMUR HIDUP trombosit itu — 7-10 hari',
          'inilah sebab dosis 80 mg cukup, dan sebab aspirin dihentikan sepekan sebelum operasi',
          '',
          'Klopidogrel memblok reseptor ADP P2Y12',
          'jalur yang BERBEDA dari aspirin',
          'karena itu keduanya dipakai bersama setelah pemasangan cincin',
        ],
        memilih:
          'Aspirin pada semua; klopidogrel ditambahkan pada sindrom koroner akut dan setelah pemasangan cincin; tikagrelor lebih kuat dan tidak perlu diaktifkan hati.',
        salahnya:
          'Dosis besar dikira lebih baik — di atas 300 mg aspirin justru ikut menghambat prostasiklin endotel yang bersifat melindungi. Dan dihentikan sendiri oleh penderita setelah cincin dipasang: risiko cincin menyumbat mendadak, dan itu sering fatal.',
      },
      {
        nama: 'Statin',
        contoh: 'Atorvastatin, simvastatin, rosuvastatin',
        dosis:
          'Atorvastatin 1×40–80 mg (intensitas tinggi — sesudah sindrom koroner akut, tanpa menunggu hasil kolesterol). Rosuvastatin 1×20–40 mg. Simvastatin 1×20–40 mg malam hari; JANGAN 80 mg (miopati). Simvastatin + amlodipin: maks 20 mg. Periksa transaminase awal, ulangi bila bergejala.',
        kapan: 'Setiap penyakit koroner, stroke iskemik, diabetes usia lanjut, dan LDL tinggi dengan risiko besar.',
        rantai: [
          'Menghambat HMG-KoA reduktase di hati',
          'kolesterol dalam sel hati ↓',
          'sel hati menambah RESEPTOR LDL di permukaannya',
          'LDL ditarik keluar dari darah',
          '',
          'Tetapi manfaat terbesarnya BUKAN dari angka LDL',
          'radang dalam plak mereda, tudung fibrosa menebal',
          'PLAK MENJADI STABIL dan tidak mudah pecah',
          'inilah yang mencegah infark berikutnya',
        ],
        memilih:
          'Atorvastatin dan rosuvastatin adalah yang berintensitas tinggi; simvastatin lebih lemah dan lebih banyak berinteraksi obat.',
        salahnya:
          'Dihentikan karena "kolesterolnya sudah normal" — yang dijaga adalah kestabilan plak, bukan angkanya. Dan simvastatin digabung dengan amlodipin dosis besar, klaritromisin, atau gemfibrozil: kadarnya melonjak dan otot rusak (rabdomiolisis).',
      },
    ],
  },

  {
    keluhan: 'Demam',
    inti:
      'Demam bukan penyakit melainkan TANDA. Yang menurunkan suhu tidak mengobati sebabnya, dan suhu yang turun oleh obat tidak berarti sumbernya hilang. Obat penurun panas diberikan untuk KENYAMANAN, bukan untuk mencegah kejang demam — tidak ada bukti ia mencegahnya.',
    golongan: [
      {
        nama: 'Parasetamol (asetaminofen)',
        contoh: 'Parasetamol tablet, sirup, supositoria, infus',
        dosis:
          'Dewasa 3–4×500–1000 mg PO, maks 4 g/hari (3 g bila usia lanjut, kurang gizi, atau peminum alkohol). Anak 10–15 mg/kgBB/kali tiap 4–6 jam, maks 5 kali/hari dan maks 60 mg/kgBB/hari. Supositoria 10–20 mg/kgBB/kali. Infus dewasa ≥50 kg 1 g tiap 6 jam; <50 kg 15 mg/kgBB tiap 6 jam.',
        kapan:
          'Pilihan PERTAMA pada hampir semua demam dan nyeri ringan-sedang: anak, ibu hamil, penyakit lambung, gangguan ginjal, gangguan pembekuan, dan tersangka demam berdarah.',
        rantai: [
          'Parasetamol bekerja terutama di SUSUNAN SARAF PUSAT',
          'menurunkan titik setel suhu di hipotalamus',
          'panas dibuang lewat vasodilatasi dan keringat',
          '',
          'Di jaringan tepi hambatannya lemah',
          'karena itu TIDAK antiradang dan TIDAK melukai lambung',
          'dan tidak mengganggu trombosit — aman pada demam berdarah',
          '',
          'Sebagian kecil diubah menjadi NAPQI oleh CYP2E1',
          'NAPQI dinetralkan oleh glutation hati',
          'dosis berlebih menghabiskan glutation → NEKROSIS HATI',
          'penawarnya asetilsistein, paling berhasil dalam 8 jam pertama',
        ],
        memilih:
          'Oral bila bisa menelan; supositoria bila muntah; infus hanya bila keduanya tidak mungkin. Sirup anak dihitung dari BERAT BADAN, bukan dari umur.',
        salahnya:
          'Dijumlahkan tanpa sadar — obat flu racikan, obat nyeri, dan obat demam sering sama-sama berisi parasetamol, dan penderita melampaui 4 g/hari tanpa tahu. Juga diberikan "berselang-seling dengan ibuprofen" secara rutin: cara ini membingungkan takaran dan tidak terbukti lebih baik.',
      },
      {
        nama: 'OAINS sebagai antipiretik',
        contoh: 'Ibuprofen, natrium diklofenak, asam mefenamat, ketoprofen',
        dosis:
          'Ibuprofen dewasa 3–4×200–400 mg PO (maks 2,4 g/hari); anak 5–10 mg/kgBB/kali tiap 6–8 jam. Natrium diklofenak 2–3×25–50 mg. Asam mefenamat 3×500 mg (muatan pertama 500 mg), maks 7 hari. Ketoprofen 2×100 mg. Semua DIMINUM SESUDAH MAKAN.',
        kapan:
          'Demam yang disertai NYERI atau RADANG — nyeri otot, nyeri sendi, nyeri haid, sakit gigi, radang tenggorokan — atau demam yang tidak turun oleh parasetamol.',
        rantai: [
          'OAINS menghambat COX-1 dan COX-2',
          'prostaglandin E2 turun di hipotalamus → demam turun',
          'prostaglandin turun di jaringan → RADANG dan NYERI ikut turun',
          '',
          'COX-1 juga menjaga lendir lambung dan aliran darah ginjal',
          'dihambat → tukak lambung, perdarahan, gagal ginjal akut',
          '',
          'Trombosit hanya punya COX-1 dan tidak berinti',
          'hambatan pada trombosit memperpanjang waktu perdarahan',
          'inilah sebab OAINS DILARANG pada tersangka demam berdarah',
        ],
        memilih:
          'Ibuprofen paling ringan terhadap lambung dan paling aman untuk anak. Asam mefenamat lazim untuk nyeri haid tetapi tidak boleh lama. Diklofenak paling kuat antiradangnya dan paling besar risiko jantungnya.',
        salahnya:
          'Diberikan pada demam hari ke-3–5 yang ternyata DEMAM BERDARAH — perdarahan menjadi jauh lebih berat. Juga pada penderita yang dehidrasi: ginjal yang sedang mengandalkan prostaglandin kehilangan aliran darahnya dan terjadi gagal ginjal akut.',
      },
    ],
  },

  {
    keluhan: 'Nyeri otot dan tulang',
    inti:
      'Bedakan lebih dulu: nyeri RADANG (sendi bengkak, kaku pagi hari, panas), nyeri OTOT KEJANG (tegang, teraba keras), atau nyeri SARAF (menjalar, terbakar, kesemutan). Ketiganya diobati golongan yang berbeda, dan memberikan OAINS pada nyeri saraf hampir selalu gagal.',
    golongan: [
      {
        nama: 'OAINS untuk nyeri muskuloskeletal',
        contoh: 'Ibuprofen, natrium diklofenak, meloksikam, piroksikam, celecoxib, ketorolak',
        dosis:
          'Ibuprofen 3–4×400 mg. Natrium diklofenak 2–3×50 mg (atau 1×75–100 mg lepas lambat). Meloksikam 1×7,5–15 mg. Piroksikam 1×20 mg. Celecoxib 1–2×100–200 mg. Ketorolak 3–4×10 mg PO maks 5 hari, atau 15–30 mg IV/IM tiap 6 jam maks 2 hari — TIDAK LEBIH. Gel diklofenak 1% dioles 2–4×/hari untuk nyeri setempat.',
        kapan:
          'Nyeri dengan komponen RADANG: keseleo, osteoartritis yang sedang kambuh, artritis, nyeri punggung bawah akut, cedera olahraga.',
        rantai: [
          'Jaringan cedera → fosfolipase A2 → asam arakidonat',
          'COX-2 mengubahnya menjadi prostaglandin E2',
          'PGE2 tidak menimbulkan nyeri sendiri melainkan MENURUNKAN AMBANG nosiseptor',
          'rangsang ringan pun terasa nyeri (hiperalgesia)',
          '',
          'OAINS menghambat COX → PGE2 turun → ambang nyeri kembali normal',
          'sekaligus bengkak dan kemerahan berkurang',
          '',
          'COX-2 selektif (celecoxib) menghindari lambung',
          'tetapi prostasiklin turun sementara tromboksan tetap',
          'keseimbangan bergeser ke arah PEMBEKUAN → risiko jantung ↑',
        ],
        memilih:
          'Nyeri setempat dan dangkal: GEL lebih dahulu — kadar dalam darah kecil, lambung dan ginjal aman. Perlu oral: ibuprofen atau meloksikam. Riwayat tukak lambung: celecoxib, atau OAINS biasa DITAMBAH penghambat pompa proton. Ketorolak hanya untuk nyeri berat jangka sangat pendek.',
        salahnya:
          'Ketorolak diteruskan berhari-hari — ia OAINS terkuat sekaligus paling cepat melukai lambung dan ginjal; batas 5 hari (oral) dan 2 hari (suntik) bukan anjuran melainkan aturan. Dan dua OAINS diberikan bersamaan (misalnya diklofenak oral + ketorolak suntik): manfaatnya tidak bertambah, bahayanya berlipat.',
      },
      {
        nama: 'Pelemas otot (relaksan otot rangka)',
        contoh: 'Eperison, tizanidin, tiokolkikosida, baklofen, diazepam',
        dosis:
          'Eperison 3×50 mg PO. Tizanidin 3×2–4 mg (maks 36 mg/hari). Tiokolkikosida 2×4 mg maks 7 hari. Baklofen mulai 3×5 mg → 3×10–25 mg. Diazepam 2–3×2–5 mg, hanya beberapa hari.',
        kapan:
          'Nyeri yang disertai SPASME OTOT yang teraba: leher kaku, nyeri punggung bawah dengan otot paravertebra tegang, tortikolis.',
        rantai: [
          'Nyeri → refleks spinal → otot sekitarnya menegang untuk membidai',
          'otot yang tegang menekan pembuluh darahnya sendiri',
          'iskemia setempat → nyeri BERTAMBAH → lingkaran setan',
          '',
          'Pelemas otot memutus lingkaran itu di SUSUNAN SARAF PUSAT',
          'tizanidin bekerja pada reseptor alfa-2 di kornu dorsalis',
          'eperison menurunkan lepas muatan gama-motoneuron',
          'baklofen sebagai agonis GABA-B menghambat refleks spinal',
          '',
          'Semuanya menekan susunan saraf pusat',
          'MENGANTUK adalah efek yang selalu ada, bukan efek samping langka',
        ],
        memilih:
          'Eperison paling sedikit mengantukkan — pilihan bagi yang harus mengemudi atau bekerja. Tizanidin paling kuat tetapi menurunkan tekanan darah. Baklofen untuk spastisitas neurologis (stroke, cedera medula), bukan untuk keseleo. Diazepam sedapat mungkin dihindari.',
        salahnya:
          'Diberikan sendirian tanpa OAINS dan tanpa gerak — spasme mereda sementara lalu kembali karena sebabnya tidak disentuh. Dan baklofen DIHENTIKAN MENDADAK sesudah dipakai lama: dapat menimbulkan kejang dan halusinasi; harus diturunkan bertahap.',
      },
      {
        nama: 'Obat nyeri saraf (neuropatik)',
        contoh: 'Gabapentin, pregabalin, amitriptilin, duloksetin, karbamazepin',
        dosis:
          'Gabapentin hari 1: 1×300 mg malam; hari 2: 2×300 mg; hari 3: 3×300 mg; naikkan sampai 900–3600 mg/hari terbagi 3. Pregabalin 2×75 mg → 2×150 mg (maks 600 mg/hari). Amitriptilin 1×10–25 mg MALAM → maks 75 mg. Duloksetin 1×30 mg → 1×60 mg. Karbamazepin 2×100 mg → 600–1200 mg/hari (pilihan pertama neuralgia trigeminus). Sesuaikan gabapentin dan pregabalin dengan fungsi ginjal.',
        kapan:
          'Nyeri MENJALAR, terbakar, seperti tersetrum, kesemutan, atau baal: neuropati diabetik, iskialgia/HNP, neuralgia pascaherpes, neuralgia trigeminus, sindrom terowongan karpal.',
        rantai: [
          'Saraf yang cedera melepaskan muatan SPONTAN tanpa rangsang',
          'kanal kalsium tipe N di ujung prasinaps terbuka berlebihan',
          'glutamat dan substansi P tercurah ke kornu dorsalis',
          'neuron di medula menjadi PEKA BERLEBIHAN (sensitisasi sentral)',
          '',
          'Gabapentin dan pregabalin mengikat subunit alfa-2-delta kanal kalsium',
          'jumlah kanal yang sampai ke membran berkurang',
          'curahan neurotransmiter turun — nyeri mereda TANPA menyentuh prostaglandin',
          '',
          'Amitriptilin dan duloksetin menahan ambilan kembali noradrenalin',
          'jalur penghambat turun dari batang otak menguat',
          'gerbang di kornu dorsalis menutup lebih rapat',
        ],
        memilih:
          'Gabapentin paling murah dan tersedia luas, tetapi harus dinaikkan bertahap dan diminum 3×. Pregabalin bekerja lebih cepat dan cukup 2×, harganya lebih mahal. Amitriptilin bila disertai sukar tidur (diminum malam). Duloksetin bila disertai depresi. Karbamazepin adalah pilihan pertama neuralgia trigeminus dan bukan yang lain.',
        salahnya:
          'Dinilai gagal terlalu cepat. Golongan ini butuh 2–4 PEKAN pada dosis yang cukup — dihentikan pada hari ke-5 karena "tidak mempan" adalah kekeliruan yang paling sering. Dan gabapentin diberikan langsung 3×300 mg pada hari pertama sehingga penderita terlalu mengantuk lalu berhenti sendiri.',
      },
      {
        nama: 'Vitamin neurotropik',
        contoh: 'Mekobalamin (B12), tiamin (B1), piridoksin (B6), asam folat',
        dosis:
          'Mekobalamin 3×500 µg PO, atau 500 µg IM/IV 3×/pekan selama 8 pekan lalu 500 µg tiap 1–3 bulan. Sianokobalamin oral 1×1000 µg pada defisiensi. Tiamin 1×50–100 mg PO; pada beri-beri atau alkoholisme 100–300 mg IV. Piridoksin 1×10–25 mg — WAJIB 25 mg/hari bersama isoniazid.',
        kapan:
          'Neuropati dengan sebab yang JELAS memerlukannya: kekurangan B12, pemakai metformin lama, pemakai isoniazid, alkoholisme, pascabedah lambung, vegetarian ketat, dan nyeri saraf diabetik sebagai pendamping.',
        rantai: [
          'Mekobalamin adalah bentuk AKTIF vitamin B12',
          'kofaktor metionin sintase → homosistein diubah menjadi metionin',
          'metionin → S-adenosilmetionin, pemberi gugus metil',
          'metilasi fosfolipid selubung MIELIN berjalan',
          '',
          'Tanpa B12 mielin tidak terbentuk sempurna',
          'kolumna posterior dan traktus kortikospinal rusak',
          'DEGENERASI GABUNGAN SUBAKUT: baal, ataksia, kelemahan',
          '',
          'ASAM FOLAT memperbaiki anemianya TETAPI TIDAK mielinnya',
          'gambaran darah membaik sementara kerusakan saraf berjalan terus',
          'inilah sebab B12 harus diperiksa SEBELUM folat diberikan',
        ],
        memilih:
          'Mekobalamin lebih disukai daripada sianokobalamin karena tidak perlu diubah dahulu di dalam sel. Oral cukup pada sebagian besar keadaan (penyerapan pasif tetap berjalan pada dosis besar); suntikan bila ada anemia pernisiosa atau gangguan penyerapan berat.',
        salahnya:
          'Diberikan sebagai "obat kesemutan" untuk semua orang. Pada yang kadar B12-nya normal, manfaatnya kecil dan ia BUKAN pengganti gabapentin atau pregabalin pada nyeri neuropatik sejati. Kekeliruan yang jauh lebih berat: memberi asam folat pada anemia megaloblastik tanpa memeriksa B12 — anemianya sembuh, sarafnya rusak permanen.',
      },
    ],
  },

  {
    keluhan: 'Pilek dan hidung tersumbat',
    inti:
      'Sebagian besar pilek adalah VIRUS dan sembuh sendiri dalam 7–10 hari; tidak ada obat yang memperpendeknya. Yang diobati adalah keluhannya, dan tiap keluhan punya golongannya sendiri — inilah sebab obat flu racikan sering memberi tiga zat untuk satu keluhan.',
    golongan: [
      {
        nama: 'Antihistamin',
        contoh: 'Klorfeniramin (CTM), setirizin, loratadin, feksofenadin, difenhidramin',
        dosis:
          'Klorfeniramin 3–4×4 mg PO (maks 24 mg/hari); anak 0,35 mg/kgBB/hari terbagi 4. Setirizin 1×10 mg (anak 2–6 th 1×5 mg). Loratadin 1×10 mg. Feksofenadin 1×120–180 mg. Difenhidramin 3–4×25–50 mg. Generasi kedua diminum PAGI, generasi pertama malam.',
        kapan:
          'Pilek ENCER, bersin berturut-turut, hidung dan mata gatal — terutama bila alergi. Kurang berguna bila ingus sudah kental.',
        rantai: [
          'Alergen atau virus → sel mast melepas HISTAMIN',
          'reseptor H1 di ujung saraf → GATAL dan BERSIN',
          'H1 di pembuluh → bocor → ingus encer dan bengkak selaput',
          '',
          'Antihistamin menahan reseptor H1 (agonis terbalik)',
          'gatal, bersin, dan ingus encer berkurang',
          'SUMBATAN hampir tidak berubah — itu urusan pembuluh, bukan histamin',
          '',
          'Generasi pertama menembus sawar darah-otak',
          'H1 di otak menjaga kewaspadaan → dihambat → MENGANTUK',
          'sifat antikolinergiknya mengeringkan ingus sekaligus mengentalkan dahak',
        ],
        memilih:
          'Siang hari dan bagi yang mengemudi: setirizin atau loratadin. Malam hari atau bila ingin sekalian membantu tidur: klorfeniramin. Usia lanjut: HINDARI generasi pertama (bingung, jatuh, retensi urin, glaukoma).',
        salahnya:
          'Dipakai pada BATUK BERDAHAK — pengeringannya membuat dahak makin lengket dan sulit keluar. Dan diberikan pada anak di bawah 2 tahun: obat batuk-pilek racikan tidak diizinkan pada kelompok umur itu.',
      },
      {
        nama: 'Dekongestan',
        contoh: 'Pseudoefedrin, fenilefrin (oral); oksimetazolin, xilometazolin (semprot)',
        dosis:
          'Pseudoefedrin 3–4×30–60 mg PO (maks 240 mg/hari). Fenilefrin 4×10 mg. Oksimetazolin 0,05% semprot 2–3 kali tiap lubang, 2×/hari — MAKS 3 HARI. Xilometazolin 0,1% dewasa / 0,05% anak, 2–3×/hari, maks 3–5 hari.',
        kapan:
          'Hidung TERSUMBAT sampai mengganggu tidur atau menyusu. Bukan untuk ingus encer.',
        rantai: [
          'Selaput hidung membengkak karena pembuluh venanya melebar dan bocor',
          'Dekongestan adalah agonis alfa-1',
          'pembuluh menyempit → bengkak surut → jalan napas terbuka',
          '',
          'Diteruskan lebih dari 3 hari, reseptor alfa menumpul',
          'kadar obat turun sedikit saja → pembuluh melebar lebih hebat daripada semula',
          'RINITIS MEDIKAMENTOSA — tersumbat oleh obatnya sendiri',
          '',
          'Yang oral sampai ke seluruh tubuh',
          'tekanan darah naik, jantung berdebar, sukar tidur, gelisah',
        ],
        memilih:
          'Semprot bekerja jauh lebih cepat dan hampir tidak menaikkan tekanan darah — tetapi HARUS berhenti pada hari ke-3. Oral untuk yang tidak bisa memakai semprot, dan dihindari pada hipertensi, penyakit jantung, hipertiroid, glaukoma sudut tertutup, dan pembesaran prostat.',
        salahnya:
          'Semprot dipakai berpekan-pekan karena "hanya ini yang menolong" — itu justru rinitis medikamentosa, dan jalan keluarnya adalah menghentikan semprotnya sambil memakai kortikosteroid semprot. Dan pseudoefedrin diberikan pada penderita hipertensi tanpa disadari karena tersembunyi di dalam obat flu racikan.',
      },
      {
        nama: 'Kortikosteroid semprot hidung',
        contoh: 'Flutikason, mometason, budesonid, beklometason',
        dosis:
          'Flutikason propionat 1×2 semprot (50 µg/semprot) tiap lubang, atau 2×1 semprot. Mometason 1×2 semprot (50 µg) tiap lubang; anak 2–11 th 1×1 semprot. Budesonid 1×2 semprot (64 µg). Semprot diarahkan ke LUAR, menjauhi sekat hidung.',
        kapan:
          'Rinitis alergi yang menetap, hidung tersumbat menahun, polip hidung, dan sebagai jalan keluar dari rinitis medikamentosa. Golongan PALING KUAT untuk sumbatan alergi.',
        rantai: [
          'Steroid masuk ke inti sel selaput hidung',
          'menekan penyalinan gen sitokin radang (IL-4, IL-5, eotaksin)',
          'perekrutan eosinofil dan sel mast berhenti',
          '',
          'Radangnya sendiri yang dipadamkan, bukan satu perantaranya',
          'karena itu bersin, gatal, ingus, DAN sumbatan semuanya membaik',
          '',
          'Perlu 3–7 HARI sampai terasa, penuh pada 2 pekan',
          'penyerapan ke seluruh tubuh sangat kecil pada dosis lazim',
        ],
        memilih:
          'Mometason dan flutikason paling sedikit terserap — paling aman untuk anak dan pemakaian panjang. Dipakai TERATUR setiap hari, bukan hanya saat bergejala.',
        salahnya:
          'Dihentikan pada hari ke-2 karena "tidak terasa apa-apa" — obat ini memang belum bekerja pada hari ke-2. Dan disemprotkan ke arah sekat hidung sehingga terjadi mimisan dan, bila lama, perforasi sekat.',
      },
    ],
  },

  {
    keluhan: 'Mual dan muntah',
    inti:
      'Antimuntah dipilih dari LETAK pemicunya, bukan dari kuat-lemahnya mual. Muntah karena gerakan diobati di telinga dalam, muntah karena obat dan racun di pusat kemoreseptor, muntah karena lambung lambat di saluran cerna. Salah letak berarti obat yang benar tidak akan bekerja.',
    golongan: [
      {
        nama: 'Antagonis dopamin (prokinetik)',
        contoh: 'Metoklopramid, domperidon',
        dosis:
          'Metoklopramid 3×10 mg PO/IV/IM, 30 menit sebelum makan; MAKS 5 HARI; anak 0,1–0,15 mg/kgBB/kali. Domperidon 3×10 mg PO sebelum makan (maks 30 mg/hari, maks 7 hari); anak 0,25 mg/kgBB/kali.',
        kapan:
          'Mual dengan LAMBUNG LAMBAT: kembung sesudah makan, cepat kenyang, gastroparesis diabetik, mual karena obat, mual pada migrain.',
        rantai: [
          'Reseptor D2 di zona pemicu kemoreseptor (di luar sawar darah-otak)',
          'dihambat → rangsang muntah dari darah tidak diteruskan',
          '',
          'D2 di dinding lambung menghambat pelepasan asetilkolin',
          'dihambat → asetilkolin naik → peristaltik menguat, pilorus terbuka',
          'isi lambung MAJU, bukan berbalik',
          '',
          'Metoklopramid MENEMBUS sawar darah-otak',
          'D2 di striatum ikut terhambat',
          'REAKSI EKSTRAPIRAMIDAL: krisis okulogirik, tortikolis, lidah kaku',
          'domperidon hampir tidak menembusnya — karena itu jauh lebih aman',
        ],
        memilih:
          'Domperidon untuk anak, usia muda, dan pemakaian di rumah. Metoklopramid bila perlu suntikan atau efek pusatnya diinginkan. Keduanya dibatasi waktu.',
        salahnya:
          'Metoklopramid diberikan berulang pada anak dan remaja lalu timbul reaksi distonik yang disangka kejang — penawarnya difenhidramin 1 mg/kgBB IV atau triheksifenidil. Dan domperidon diberikan bersama eritromisin/ketokonazol: keduanya memperpanjang QT.',
      },
      {
        nama: 'Antagonis serotonin 5-HT3',
        contoh: 'Ondansetron, granisetron',
        dosis:
          'Ondansetron dewasa 4–8 mg IV pelan atau PO tiap 8 jam (kemoterapi 8–16 mg sebelum obat); anak 0,1–0,15 mg/kgBB/kali maks 4 mg. Granisetron 1–2 mg 1×/hari. Suntikan cepat menimbulkan pusing — berikan dalam 2–5 menit.',
        kapan:
          'Muntah HEBAT: kemoterapi, radioterapi, pascabedah, gastroenteritis pada anak yang gagal minum, hiperemesis gravidarum yang berat.',
        rantai: [
          'Sel enterokromafin usus rusak (obat sitotoksik, radiasi, virus)',
          'SEROTONIN tercurah ke dinding usus',
          'reseptor 5-HT3 pada ujung nervus vagus terangsang',
          'sinyal naik ke nukleus traktus solitarius → pusat muntah',
          '',
          'Ondansetron menutup reseptor 5-HT3 di usus DAN di batang otak',
          'jalur vagal dan jalur pusat diputus bersamaan',
          '',
          'Tidak menyentuh reseptor dopamin di striatum',
          'karena itu TIDAK menimbulkan reaksi ekstrapiramidal',
          'tetapi memperpanjang interval QT dan menyebabkan sembelit',
        ],
        memilih:
          'Pilihan pertama bila muntahnya menghalangi minum obat atau cairan. Pada anak dengan gastroenteritis, satu dosis sering cukup untuk memungkinkan rehidrasi oral dan menghindarkan infus.',
        salahnya:
          'Dipakai untuk mabuk perjalanan — di sana pemicunya vestibular, bukan serotonin usus, dan ondansetron praktis tidak bekerja. Juga diberikan tanpa memeriksa kalium dan magnesium pada penderita yang muntah lama: QT yang sudah panjang diperpanjang lagi.',
      },
      {
        nama: 'Antihistamin dan antikolinergik vestibular',
        contoh: 'Dimenhidrinat, meklizin, prometazin, skopolamin, betahistin',
        dosis:
          'Dimenhidrinat 50 mg PO 30–60 menit sebelum berangkat, ulang tiap 4–6 jam (maks 400 mg/hari); anak 2–6 th 12,5–25 mg. Meklizin 25–50 mg 1×/hari. Prometazin 12,5–25 mg tiap 4–6 jam. Skopolamin koyo 1,5 mg di belakang telinga, dipasang 4 jam sebelumnya, tahan 72 jam. Betahistin 3×8–16 mg (untuk vertigo Meniere, bukan mabuk perjalanan).',
        kapan:
          'Mual dan muntah yang berasal dari KESEIMBANGAN: mabuk perjalanan, vertigo perifer, penyakit Meniere, neuritis vestibular.',
        rantai: [
          'Ketidakcocokan antara isyarat mata, telinga dalam, dan proprioseptif',
          'nukleus vestibular terangsang berlebihan',
          'jalurnya menuju pusat muntah memakai HISTAMIN dan ASETILKOLIN',
          'bukan dopamin, dan bukan serotonin',
          '',
          'Obat vestibular menghambat H1 dan muskarinik di jalur itu',
          'isyarat tidak sampai ke pusat muntah',
          '',
          'Karena harus menembus sawar darah-otak, MENGANTUK tidak terhindarkan',
          'dan itu pula sebab ia bekerja',
        ],
        memilih:
          'Diminum SEBELUM berangkat — sesudah muntah dimulai hasilnya jauh lebih buruk. Skopolamin koyo untuk perjalanan berhari-hari (menyelam, berlayar). Betahistin hanya untuk vertigo Meniere dan dipakai jangka panjang, bukan sekali pakai.',
        salahnya:
          'Dipakai jangka panjang pada vertigo perifer — menekan penyesuaian sentral sehingga pemulihannya justru TERTUNDA; sesudah 3 hari sebaiknya dihentikan dan diganti latihan vestibular. Dan diberikan pada usia lanjut sehingga jatuh, bingung, atau retensi urin.',
      },
    ],
  },

  {
    keluhan: 'Nyeri perut, kembung, dan begah',
    inti:
      'Nyeri perut dibedakan dahulu: nyeri ULU HATI seperti terbakar (asam), nyeri MELILIT yang datang-pergi (kejang otot polos), atau perut PENUH dan bersendawa (gerak lambung lambat dan gas). Tiga bentuk itu tiga golongan yang berbeda, dan yang paling penting: nyeri perut hebat mendadak TIDAK boleh ditutup obat sebelum perut akut disingkirkan.',
    golongan: [
      {
        nama: 'Penghambat pompa proton',
        contoh: 'Omeprazol, lansoprazol, pantoprazol, esomeprazol, rabeprazol',
        dosis:
          'Omeprazol 1×20–40 mg PO 30–60 menit SEBELUM sarapan. Lansoprazol 1×30 mg. Pantoprazol 1×40 mg PO atau IV. Esomeprazol 1×20–40 mg. Tukak lambung 4–8 pekan; GERD 8 pekan. Perdarahan tukak: pantoprazol 80 mg IV bolus lalu 8 mg/jam selama 72 jam. Pemberantasan H. pylori: PPI 2×/hari + amoksisilin 2×1 g + klaritromisin 2×500 mg selama 14 hari.',
        kapan:
          'Nyeri ulu hati TERBAKAR, GERD, tukak lambung dan duodenum, perdarahan saluran cerna atas, pencegahan pada pemakai OAINS jangka panjang.',
        rantai: [
          'Obat adalah PRAOBAT, aktif hanya di suasana sangat asam',
          'ia menumpuk di kanalikuli sel parietal',
          'berikatan KOVALEN dengan H+/K+-ATPase — pompa proton',
          '',
          'Ikatannya tidak dapat diputus',
          'asam baru muncul kembali sesudah pompa BARU dibuat sel',
          'inilah sebab kerjanya bertahan >24 jam meski separuh umurnya 1–2 jam',
          '',
          'Pompa hanya aktif sesudah makanan merangsangnya',
          'karena itu obat harus SUDAH ada di darah saat makan dimulai',
          'diminum sesudah makan → sebagian besar pompa terlewat',
        ],
        memilih:
          'Semuanya setara pada dosis padanan. Pantoprazol paling sedikit berinteraksi (penting pada pemakai klopidogrel — omeprazol menurunkan pengaktifannya; pilih pantoprazol). Bentuk IV hanya bila tidak bisa menelan atau ada perdarahan.',
        salahnya:
          'Diminum SESUDAH makan atau menjelang tidur — inilah sebab tersering "PPI tidak mempan". Dan diteruskan bertahun-tahun tanpa alasan: risiko patah tulang, kekurangan B12 dan magnesium, serta infeksi C. difficile bertambah.',
      },
      {
        nama: 'Antasida dan penghambat H2',
        contoh: 'Aluminium-magnesium hidroksida, kalsium karbonat, sukralfat; ranitidin, famotidin',
        dosis:
          'Antasida 1–2 tablet dikunyah atau 10–15 mL sirup, 1 jam sesudah makan dan menjelang tidur, sampai 4×/hari. Sukralfat 4×1 g PO saat perut KOSONG (1 jam sebelum makan). Famotidin 2×20 mg atau 1×40 mg malam. Ranitidin 2×150 mg (banyak negara menariknya karena cemaran NDMA — periksa ketersediaannya).',
        kapan:
          'Nyeri ulu hati yang perlu reda SEKARANG (antasida bekerja dalam menit, PPI dalam jam), atau sebagai pendamping PPI pada malam hari.',
        rantai: [
          'Antasida menetralkan asam yang SUDAH ada — reaksi kimia sederhana',
          'seketika, tetapi hanya selama obatnya masih ada di lambung (30–60 menit)',
          '',
          'Penghambat H2 menutup reseptor histamin sel parietal',
          'satu dari tiga jalur perangsang (histamin, gastrin, asetilkolin)',
          'karena hanya satu jalur, hambatannya lebih lemah daripada PPI',
          'dan dalam beberapa pekan timbul TOLERANSI',
          '',
          'Sukralfat tidak menyentuh asam sama sekali',
          'di suasana asam ia menjadi bubur lengket yang menempel pada dasar tukak',
          'SELIMUT mekanis terhadap asam dan pepsin',
        ],
        memilih:
          'Antasida untuk redaan segera dan sesekali. Famotidin bila PPI tidak tersedia atau untuk terobosan asam malam hari. Sukralfat pada tukak stres dan penderita yang harus menghindari penekanan asam.',
        salahnya:
          'Antasida dan sukralfat diminum berdekatan dengan obat lain — keduanya MENGIKAT dan menggagalkan penyerapan kuinolon, tetrasiklin, besi, levotiroksin, dan digoksin; beri jarak 2 jam. Dan antasida bermagnesium diberikan pada gagal ginjal → hipermagnesemia.',
      },
      {
        nama: 'Antispasmodik',
        contoh: 'Hiosin butilbromida, mebeverin, papaverin, alverin, drotaverin',
        dosis:
          'Hiosin butilbromida 3–5×10–20 mg PO; 20 mg IV/IM pelan pada kolik, boleh diulang sesudah 30 menit (maks 100 mg/hari). Mebeverin 3×135 mg atau 2×200 mg lepas lambat, 20 menit sebelum makan. Papaverin 3–4×30–60 mg. Alverin 3×60–120 mg.',
        kapan:
          'Nyeri MELILIT yang datang dan pergi: kolik usus, sindrom usus iritabel, kolik empedu dan ginjal (bersama OAINS), nyeri haid.',
        rantai: [
          'Otot polos berongga meregang atau tersumbat → berkontraksi kuat',
          'kontraksi menjepit pembuluhnya sendiri → iskemia → NYERI KOLIK',
          '',
          'Hiosin menghambat reseptor muskarinik pada otot polos',
          'ia amonium KUATERNER — bermuatan, tidak menembus sawar darah-otak',
          'karena itu bekerja di perut tanpa membingungkan otak',
          '',
          'Mebeverin dan papaverin bekerja LANGSUNG pada selnya',
          'tanpa jalur kolinergik → tidak mengeringkan mulut, tidak menahan kencing',
        ],
        memilih:
          'Hiosin paling cepat dan ada bentuk suntiknya — pilihan pada kolik akut. Mebeverin untuk sindrom usus iritabel jangka panjang karena tidak antikolinergik. Kolik ginjal: OAINS (ketorolak/diklofenak) lebih unggul daripada antispasmodik.',
        salahnya:
          'Diberikan pada nyeri perut hebat mendadak yang belum jelas — apendisitis, perforasi, dan iskemia usus dapat TERTUTUP sementara lalu datang kembali sudah dalam keadaan lanjut. Dan hiosin diberikan pada glaukoma sudut tertutup, pembesaran prostat, atau ileus paralitik.',
      },
      {
        nama: 'Obat kembung dan enzim pencernaan',
        contoh: 'Simetikon (dimetilpolisiloksan), arang aktif, pankreatin, laktase',
        dosis:
          'Simetikon 3–4×40–80 mg dikunyah sesudah makan dan menjelang tidur (maks 500 mg/hari); bayi 20–40 mg/kali. Arang aktif 3–4×250–500 mg, TIDAK bersama obat lain. Pankreatin (lipase 10.000–25.000 unit) tiap makan besar, setengahnya untuk kudapan. Laktase 3000–9000 unit saat menyantap susu.',
        kapan:
          'Perut PENUH, bersendawa, kentut berlebihan, kolik bayi, persiapan endoskopi dan ultrasonografi perut, atau kekurangan enzim (pankreatitis kronik, fibrosis kistik, intoleransi laktosa).',
        rantai: [
          'Gas dalam usus terperangkap sebagai BUIH — gelembung kecil berselaput lendir',
          'buih tidak dapat bergerak maju dan tidak dapat dikeluarkan',
          '',
          'Simetikon menurunkan tegangan permukaan selaput itu',
          'gelembung-gelembung kecil MENYATU menjadi gelembung besar',
          'yang besar mudah bergerak dan keluar lewat sendawa atau kentut',
          'simetikon TIDAK diserap sama sekali — ia hanya lewat',
          '',
          'Pankreatin mengganti lipase, amilase, dan protease yang tidak dihasilkan',
          'lemak yang tidak tercerna itulah yang difermentasi kuman → gas dan tinja berminyak',
        ],
        memilih:
          'Simetikon untuk kembung biasa dan kolik bayi — praktis tanpa risiko karena tidak terserap. Pankreatin hanya bila ada bukti kekurangan enzim (steatore, pankreatitis kronik); ia harus diminum BERSAMA suapan, bukan sesudahnya.',
        salahnya:
          'Kembung menahun langsung diberi simetikon tanpa mencari sebabnya — intoleransi laktosa, pertumbuhan kuman berlebihan di usus halus, sembelit, atau penyakit seliaka semuanya memberi keluhan yang sama dan tidak akan membaik oleh simetikon. Dan arang aktif diminum bersamaan dengan obat lain sehingga obatnya ikut terikat dan tidak terserap.',
      },
    ],
  },

  {
    keluhan: 'Pusing berputar (vertigo)',
    inti:
      'Bedakan lebih dulu PUSING BERPUTAR (lingkungan bergerak — telinga dalam atau batang otak) dari MELAYANG (mau pingsan — jantung, tekanan darah, gula, anemia). Obat vertigo tidak menolong yang melayang, dan yang paling menentukan pada vertigo posisi bukanlah obat melainkan perasat reposisi.',
    golongan: [
      {
        nama: 'Penekan vestibular',
        contoh: 'Betahistin, dimenhidrinat, flunarizin, difenhidramin, diazepam',
        dosis:
          'Betahistin 3×8–16 mg PO sesudah makan (Meniere, jangka panjang 2–3 bulan). Dimenhidrinat 3×50 mg, maks 3 hari. Flunarizin 1×5–10 mg malam (pencegahan migrain vestibular; maks 2–3 bulan). Difenhidramin 10–50 mg IM/IV pada serangan akut. Diazepam 2–5 mg hanya bila cemasnya menonjol dan hanya 1–2 hari.',
        kapan:
          'Serangan vertigo AKUT yang membuat penderita tidak dapat berdiri atau terus muntah. Bukan untuk dipakai terus-menerus.',
        rantai: [
          'Sisi vestibular yang sakit dan yang sehat mengirim isyarat yang TIDAK SEIMBANG',
          'otak membaca selisih itu sebagai gerakan berputar',
          '',
          'Penekan vestibular meredam lepas muatan nukleus vestibular',
          'selisihnya terasa lebih kecil → berputarnya mereda',
          '',
          'Tetapi otak MENYESUAIKAN diri hanya bila selisih itu ia rasakan',
          'menekannya terus-menerus menghapus rangsang yang dibutuhkan',
          'PENYESUAIAN SENTRAL TERTUNDA — vertigonya justru berlarut',
          '',
          'Betahistin berbeda: agonis H1 lemah dan antagonis H3',
          'histamin di nukleus vestibular naik, aliran darah telinga dalam membaik',
          'karena itu ia dipakai jangka panjang, bukan sebagai penekan',
        ],
        memilih:
          'Serangan akut: dimenhidrinat atau difenhidramin, MAKSIMAL 3 hari, lalu berhenti dan mulai latihan vestibular. Meniere: betahistin jangka panjang ditambah pembatasan garam. Migrain vestibular: flunarizin.',
        salahnya:
          'Diteruskan berpekan-pekan "supaya tidak kambuh" — justru inilah yang membuat vertigo tidak sembuh-sembuh. Dan vertigo posisi paroksismal jinak (BPPV) diobati dengan betahistin bertahun-tahun padahal yang menyembuhkannya adalah perasat Epley dalam beberapa menit. Flunarizin lebih dari 3 bulan menimbulkan parkinsonisme dan depresi, terutama pada usia lanjut.',
      },
    ],
  },

  {
    keluhan: 'Diare akut',
    inti:
      'Yang membunuh pada diare BUKAN kumannya melainkan CAIRAN YANG HILANG. Urutan yang benar: rehidrasi lebih dahulu, zinc pada anak, lalu — hanya bila memang berindikasi — antibiotik. Antibiotik pada diare cair biasa tidak memperpendek sakitnya dan menambah kekebalan kuman.',
    golongan: [
      {
        nama: 'Cairan rehidrasi oral',
        contoh: 'Oralit osmolaritas rendah, larutan gula-garam buatan sendiri',
        dosis:
          'DEWASA: 200-400 mL tiap kali buang air cair. ANAK tanpa dehidrasi (rencana A): <2 tahun 50-100 mL, 2-10 tahun 100-200 mL, >10 tahun sebanyak yang mau, tiap kali mencret. DEHIDRASI RINGAN-SEDANG (rencana B): 75 mL/kgBB dalam 3-4 jam, diberikan sesendok tiap 1-2 menit. Muntah bukan alasan berhenti — tunggu 10 menit lalu lanjutkan lebih lambat. Satu sachet oralit dilarutkan dalam 200 mL air matang, TIDAK boleh setengah sachet dan tidak boleh ditambah gula.',
        kapan: 'SEMUA diare, dengan atau tanpa dehidrasi, sebelum obat apa pun dipikirkan.',
        rantai: [
          'Toksin kuman membuka kanal klorida di kripta usus',
          'klorida, natrium, dan AIR tercurah ke lumen',
          'kehilangan cairan melampaui daya serap usus → tinja cair',
          '',
          'Tetapi kotransporter NATRIUM-GLUKOSA (SGLT1) di vilus TETAP UTUH',
          'ia menyerap natrium HANYA bila ada glukosa bersamanya',
          'air mengikuti natrium secara osmotik',
          '',
          'Inilah seluruh dasar oralit: glukosa bukan makanan di sini, ia KUNCI',
          'itu sebab air putih saja tidak cukup, dan gula saja juga tidak',
          '',
          'Osmolaritas rendah (245 mOsm/L) menyerap lebih baik daripada rumus lama',
          'muntah berkurang, volume tinja berkurang, kebutuhan infus berkurang',
        ],
        memilih:
          'Oralit sachet bila ada. Bila tidak: 1 sendok teh munjung gula + seujung sendok teh garam dalam 200 mL air — perbandingan ini penting, larutan yang terlalu manis JUSTRU menarik air ke usus dan memperberat diare. Infus (ringer laktat 30 mL/kgBB dalam 30 menit lalu 70 mL/kgBB dalam 2,5 jam) hanya untuk dehidrasi berat, syok, atau yang tidak dapat minum.',
        salahnya:
          'Diganti teh manis, sirup, atau minuman olahraga yang jauh lebih pekat gulanya dan justru menambah diare. Dan penderita dipuasakan — padahal MAKAN DITERUSKAN; usus yang tidak diberi makan justru lebih lambat pulih, dan ASI tidak pernah dihentikan.',
      },
      {
        nama: 'Zinc',
        contoh: 'Zinc sulfat, zinc dispersibel',
        dosis:
          'ANAK <6 bulan: 10 mg sekali sehari selama 10-14 HARI PENUH. Anak >=6 bulan: 20 mg sekali sehari selama 10-14 hari. Diteruskan SAMPAI HABIS meski diarenya sudah berhenti pada hari ketiga — itulah bagian yang menentukan.',
        kapan: 'SEMUA anak dengan diare akut, tanpa kecuali, sejak hari pertama.',
        rantai: [
          'Zinc adalah kofaktor ratusan enzim, termasuk yang membangun sel usus',
          'diare menghabiskan simpanan zinc justru saat ia paling dibutuhkan',
          '',
          'Zinc memulihkan sawar epitel dan mengembalikan enzim tepi sikat',
          'menekan kanal klorida yang dibuka toksin',
          'dan memperbaiki tanggapan kekebalan mukosa',
          '',
          'Akibatnya lama diare berkurang sekitar seperempat',
          'DAN — inilah yang sering tidak disadari — kejadian diare pada 2-3 BULAN',
          'berikutnya juga berkurang; itulah sebab 10-14 hari, bukan 3 hari',
        ],
        memilih:
          'Bentuk dispersibel dilarutkan dalam sedikit ASI, oralit, atau air matang. Rasanya pahit; berikan bersama sedikit makanan bila anak menolak.',
        salahnya:
          'Dihentikan saat diare berhenti. Manfaat pencegahannya justru datang dari 10-14 hari penuh, dan menghentikannya pada hari ketiga membuang bagian terbesar manfaatnya.',
      },
      {
        nama: 'Antimotilitas dan penyerap',
        contoh: 'Loperamid; attapulgit, kaolin-pektin, karbon aktif',
        dosis:
          'Loperamid DEWASA: 4 mg dosis awal lalu 2 mg tiap kali mencret, maksimal 16 mg/hari, tidak lebih dari 2 hari. Attapulgit 2 tablet tiap kali mencret, maksimal 12 tablet/hari. Racecadotril (antisekretorik, lebih aman daripada loperamid) dewasa 3x100 mg; anak 1,5 mg/kgBB tiap 8 jam maksimal 7 hari.',
        kapan:
          'Diare cair TANPA demam dan TANPA darah, pada dewasa, ketika mencretnya sendiri yang mengganggu (perjalanan, bekerja).',
        rantai: [
          'Loperamid adalah agonis opioid yang hampir tidak menembus sawar darah-otak',
          'reseptor mu di pleksus mienterikus dihambat',
          'gerak peristaltik melambat, waktu singgah memanjang',
          'usus punya waktu lebih lama menyerap air',
          '',
          'Tetapi bila penyebabnya kuman INVASIF atau toksin',
          'memperlambat usus berarti MENAHAN kuman dan toksin di dalam',
          'demam memanjang, dan pada Shigella atau E. coli penghasil toksin',
          'dapat timbul MEGAKOLON TOKSIK dan sindrom uremik hemolitik',
        ],
        memilih:
          'Racecadotril lebih disukai daripada loperamid, terutama pada anak: ia mengurangi sekresi tanpa melumpuhkan gerak usus. Penyerap seperti attapulgit memadatkan tinja tetapi tidak mengurangi kehilangan cairan — ia menenangkan mata, bukan menyelamatkan.',
        salahnya:
          'Diberikan pada DISENTRI (tinja berdarah), demam tinggi, atau pada ANAK — ketiganya kontraindikasi. Loperamid TIDAK BOLEH pada anak di bawah 2 tahun sama sekali, dan sebaiknya dihindari sampai usia 12 tahun.',
      },
      {
        nama: 'Antibiotik pada diare — yang berindikasi saja',
        contoh: 'Siprofloksasin, azitromisin, kotrimoksazol, metronidazol',
        dosis:
          'DISENTRI BASILER: siprofloksasin 2x500 mg selama 3 hari; anak sefiksim 8 mg/kgBB/hari selama 5 hari atau azitromisin 10 mg/kgBB/hari selama 3 hari. KOLERA: doksisiklin 300 mg dosis tunggal (anak azitromisin 20 mg/kgBB tunggal). TIFOID: seftriakson 1x2-4 g IV selama 10-14 hari, atau sefiksim 2x200 mg selama 14 hari. AMUBIASIS: metronidazol 3x500-750 mg selama 7-10 hari. GIARDIASIS: metronidazol 3x250 mg selama 5-7 hari atau tinidazol 2 g dosis tunggal.',
        kapan:
          'HANYA bila: tinja BERDARAH, demam tinggi dengan tanda invasif, kolera dengan dehidrasi berat, tifoid, amubiasis atau giardiasis yang terbukti, diare pada penderita imunitas turun, atau diare pelancong yang berat.',
        rantai: [
          'Sebagian besar diare akut adalah VIRUS — rotavirus, norovirus',
          'antibiotik tidak menyentuhnya sama sekali',
          '',
          'Bahkan pada diare bakteri yang ringan, penyakitnya sembuh sendiri',
          'antibiotik memendekkannya sehari sambil membunuh flora normal',
          'dan flora yang hilang membuka jalan bagi Clostridioides difficile',
          '',
          'Pada E. coli O157:H7, antibiotik MEMPERBESAR pelepasan toksin Shiga',
          'risiko SINDROM UREMIK HEMOLITIK meningkat — itulah sebab',
          'diare berdarah pada anak tidak diberi antibiotik sebelum jelas kumannya',
        ],
        memilih:
          'Bila memang berindikasi, pilih menurut gambaran kliniknya, bukan menurut kebiasaan. Kuinolon dihindari pada anak. Metronidazol untuk amuba dan giardia, bukan untuk diare cair biasa.',
        salahnya:
          'Diberikan pada hampir semua diare "supaya cepat sembuh". Ini kekeliruan resep yang paling sering di Indonesia, dan akibatnya bukan hanya pada satu penderita — kekebalan kuman yang terbentuk menjadi milik bersama.',
      },
    ],
  },

  {
    keluhan: 'Sembelit (sulit buang air besar)',
    inti:
      'Yang pertama dicari bukan obatnya melainkan SEBABNYA: serat dan air yang kurang, kurang gerak, obat yang menyembelitkan (opioid, besi, antasida beraluminium, antikolinergik, penghambat kanal kalsium), hipotiroid, dan — yang tidak boleh terlewat — tanda bahaya berupa darah, berat badan turun, atau sembelit baru pada usia di atas 50 tahun.',
    golongan: [
      {
        nama: 'Pencahar osmotik',
        contoh: 'Laktulosa, polietilen glikol (PEG/makrogol), magnesium hidroksida',
        dosis:
          'Laktulosa DEWASA 15-30 mL sekali sehari (boleh 2x/hari); ANAK 1-3 mL/kgBB/hari terbagi 1-2. Pada ENSEFALOPATI HEPATIK dosisnya berbeda dan jauh lebih besar: 30-45 mL 3-4x/hari, dititrasi sampai buang air lunak 2-3 kali sehari. PEG 3350 dewasa 17 g dalam 240 mL air sekali sehari; anak 0,4-0,8 g/kgBB/hari. Susu magnesia 15-30 mL sebelum tidur.',
        kapan: 'Pilihan PERTAMA untuk hampir semua sembelit, termasuk pada anak, ibu hamil, dan usia lanjut.',
        rantai: [
          'Zat ini tidak diserap dan tetap tinggal di dalam lumen',
          'ia menarik AIR ke dalam usus secara osmotik',
          'tinja menjadi lunak dan volumenya bertambah',
          'regangan dinding memicu peristaltik secara alami',
          '',
          'Laktulosa juga difermentasi kuman kolon menjadi asam laktat dan asetat',
          'pH kolon turun, dan itulah yang dimanfaatkan pada ensefalopati hepatik:',
          'amonia (NH3) diubah menjadi amonium (NH4+) yang TIDAK dapat diserap',
          'lalu dibuang bersama tinja — di sini pencaharnya bukan efek samping',
          '',
          'Fermentasi yang sama menghasilkan gas — inilah sebab kembungnya',
        ],
        memilih:
          'PEG paling sedikit menimbulkan kembung dan paling nyaman untuk pemakaian panjang serta untuk anak. Laktulosa lebih murah dan lebih tersedia. Magnesium DIHINDARI pada gangguan ginjal (hipermagnesemia).',
        salahnya:
          'Dosisnya dinaikkan pada hari kedua karena "belum bekerja" — pencahar osmotik memerlukan 1-3 HARI. Yang menaikkan terlalu cepat mendapat diare dan berhenti sama sekali.',
      },
      {
        nama: 'Pencahar perangsang',
        contoh: 'Bisakodil, sena (senna), natrium pikosulfat',
        dosis:
          'Bisakodil DEWASA 5-15 mg PO malam hari (bekerja 6-12 jam), atau supositoria 10 mg (bekerja 15-60 menit); anak >4 tahun 5 mg PO. Sena 1-2 tablet (7,5-15 mg sennosida) malam hari. Natrium pikosulfat 5-10 mg malam.',
        kapan:
          'Sembelit yang tidak menyerah pada osmotik, sembelit akibat opioid, dan bila diperlukan buang air pada waktu tertentu (persiapan pemeriksaan).',
        rantai: [
          'Golongan ini merangsang LANGSUNG pleksus saraf di dinding kolon',
          'peristaltik propulsif meningkat',
          'sekaligus menghambat penyerapan air dan elektrolit',
          '',
          'Kerjanya cepat dan pasti — dan justru itulah bahayanya:',
          'yang memakainya tiap hari selama bertahun-tahun kehilangan dorongan alami',
          'dan kehilangan kalium lewat tinja, yang justru MELEMASKAN usus lagi',
          '',
          'Salut enterik pada bisakodil pecah di usus, bukan di lambung',
          'meminumnya bersama susu atau antasida memecahnya terlalu awal → kram lambung',
        ],
        memilih:
          'Supositoria bila perlu hasil dalam waktu satu jam. Oral malam hari agar bekerja pagi. Pemakaian selang-seling, bukan tiap hari.',
        salahnya:
          'Bisakodil salut enterik diminum bersama SUSU atau antasida — jaraknya harus satu jam. Dan dipakai tiap hari bertahun-tahun; usus menjadi malas dan kaliumnya terkuras.',
      },
      {
        nama: 'Pembentuk massa dan pelunak',
        contoh: 'Psilium (ispaghula), metilselulosa; dokusat, parafin cair',
        dosis:
          'Psilium 1 sendok makan (3,5 g) dalam 250 mL air, 1-3 kali sehari, DIIKUTI segelas air lagi. Dokusat natrium 100-300 mg/hari. Parafin cair 15-45 mL malam hari — jangka sangat pendek saja.',
        kapan:
          'Sembelit ringan menahun dengan asupan serat rendah; juga pada wasir dan fisura ani agar tinja tidak keras.',
        rantai: [
          'Serat larut menyerap air dan membentuk gel',
          'massa tinja bertambah, regangan dinding memicu peristaltik',
          'ini paling mendekati cara kerja alamiah',
          '',
          'TETAPI tanpa air yang cukup, gel yang sama menjadi sumbatan',
          'pada usus yang gerakannya sudah lemah, serat justru memperberat',
          '',
          'Parafin cair melapisi tinja, tidak diserap',
          'bila terhirup ia menimbulkan PNEUMONIA LIPOID yang tidak dapat diobati',
        ],
        memilih:
          'Psilium bila penderita mau dan mampu minum banyak. Dokusat pada mereka yang tidak boleh mengejan (pascabedah, penyakit jantung). Parafin dihindari pada usia lanjut, penderita gangguan menelan, dan pada anak.',
        salahnya:
          'Diberikan pada sembelit karena SUMBATAN atau usus yang lambat berat — serat menambah massa di depan sumbatan. Dan diminum tanpa air yang cukup, yang mengubah obatnya menjadi penyebab.',
      },
    ],
  },

  {
    keluhan: 'Gatal, biduran, dan ruam alergi',
    inti:
      'Gatal bukan satu penyakit. Yang menentukan pengobatan adalah apakah gatalnya berasal dari HISTAMIN (biduran, alergi), dari KULIT KERING DAN RADANG (eksim), dari INFEKSI (jamur, skabies), atau dari dalam tubuh (penyakit hati, ginjal, kelenjar getah bening) — dan antihistamin hanya menolong yang pertama.',
    golongan: [
      {
        nama: 'Antihistamin H1 untuk gatal',
        contoh: 'Setirizin, loratadin, feksofenadin, klorfeniramin, hidroksizin',
        dosis:
          'Setirizin 1x10 mg (anak 6 bulan-2 tahun 1x2,5 mg; 2-6 tahun 1x5 mg). Loratadin 1x10 mg (anak 2-12 tahun <30 kg 1x5 mg). Feksofenadin 1x180 mg. Pada URTIKARIA KRONIK dosisnya boleh DINAIKKAN SAMPAI EMPAT KALI lipat (setirizin sampai 40 mg/hari) sebelum dianggap gagal — ini yang paling sering tidak dilakukan. Klorfeniramin 3-4x4 mg atau hidroksizin 25 mg malam bila gatalnya mengganggu tidur.',
        kapan: 'Biduran (urtikaria), gatal alergi, gigitan serangga, reaksi obat ringan, dan gatal malam yang mengganggu tidur.',
        rantai: [
          'Sel mast melepas histamin ke dermis',
          'reseptor H1 pada ujung saraf C tak bermielin → rasa GATAL',
          'H1 pada venula → bocor dan melebar → BENTOL dan KEMERAHAN',
          '',
          'Antihistamin menstabilkan reseptor H1 pada bentuk tidak aktif',
          'gatal dan bentol mereda',
          '',
          'Pada urtikaria kronik, pelepasan histamin berlangsung terus-menerus',
          'dosis biasa hanya menutup sebagian reseptor',
          'itulah dasar menaikkan dosis sampai empat kali — bukan mengganti obat',
        ],
        memilih:
          'Generasi kedua (setirizin, loratadin, feksofenadin) untuk siang hari dan pemakaian panjang. Generasi pertama hanya bila efek mengantuknya memang diinginkan pada malam hari, dan DIHINDARI pada usia lanjut serta anak kecil.',
        salahnya:
          'Diganti-ganti merek ketika yang seharusnya dilakukan adalah MENAIKKAN DOSIS obat yang sama. Dan dipakai untuk gatal eksim atau gatal kulit kering, yang bukan urusan histamin — di sana pelembap dan steroid topikal yang bekerja.',
      },
      {
        nama: 'Kortikosteroid topikal',
        contoh: 'Hidrokortison 1-2,5%; desonid; mometason; betametason; klobetasol',
        dosis:
          'Dioles TIPIS 1-2 kali sehari. Ukuran memakai FINGERTIP UNIT (FTU): satu ruas ujung jari telunjuk (±0,5 g) menutup dua telapak tangan orang dewasa. Wajah dan lipatan: hidrokortison 1% atau desonid 0,05%, maksimal 1-2 pekan. Badan dan lengan: mometason 0,1% atau betametason valerat 0,1%, 2 pekan. Telapak tangan dan kaki: klobetasol 0,05%, maksimal 2 pekan lalu berhenti. ANAK: potensi rendah saja, dan tidak di wajah lebih dari seminggu.',
        kapan: 'Eksim, dermatitis kontak, dermatitis seboroik, psoriasis terbatas — radang kulit, bukan infeksi kulit.',
        rantai: [
          'Steroid masuk ke inti keratinosit dan sel radang',
          'menekan penyalinan gen sitokin dan fosfolipase A2',
          'radang, kemerahan, dan gatal mereda',
          '',
          'Sel yang sama juga menghasilkan KOLAGEN',
          'penyalinannya ikut tertekan → kulit MENIPIS, guratan, pembuluh melebar',
          'dan penipisan itu TIDAK selalu pulih',
          '',
          'Kulit wajah, kelopak, lipatan, dan kelamin jauh lebih tipis',
          'penyerapannya berlipat, dan di sanalah kerusakan datang paling cepat',
        ],
        memilih:
          'Sekuat yang diperlukan, sesingkat mungkin, dan disesuaikan dengan LETAKNYA — bukan dengan beratnya gatal saja. Salep untuk kulit kering dan tebal, krim untuk lesi basah dan lipatan, losion untuk kulit berambut.',
        salahnya:
          'Dipakai pada kulit yang sebenarnya berjamur atau berskabies — radangnya mereda, jamurnya menyebar dengan tepi yang tidak khas lagi (tinea incognito), dan diagnosisnya menjadi kabur. Dan krim gabungan steroid + antijamur + antibiotik dipakai untuk segalanya, sehingga tidak ada satu pun yang benar-benar diobati.',
      },
      {
        nama: 'Pelembap (emolien) — obat, bukan pelengkap',
        contoh: 'Petrolatum, urea 10%, gliserin, ceramide, minyak zaitun',
        dosis:
          'Dioles TEBAL 2-3 kali sehari, dan yang terpenting dalam 3 MENIT sesudah mandi saat kulit masih lembap. Dewasa dengan eksim luas memerlukan 250-500 g SEPEKAN — jumlah yang jauh melampaui perkiraan kebanyakan orang, dan kekurangannya adalah sebab tersering eksim tidak membaik.',
        kapan: 'SEMUA eksim, kulit kering, dermatitis atopik, psoriasis — dipakai terus-menerus, termasuk saat kulit sedang baik.',
        rantai: [
          'Pada eksim, protein filagrin yang menyusun sawar kulit berkurang',
          'air menguap keluar, alergen dan kuman masuk',
          'sistem imun terpapar → radang → garukan → sawar makin rusak',
          '',
          'Pelembap menutup celah itu dari luar',
          'penguapan berhenti, alergen tidak lagi masuk',
          'lingkaran radang-garuk terputus di pangkalnya',
          '',
          'Pemakaian pelembap yang cukup MENGURANGI kebutuhan steroid',
          'inilah satu-satunya "obat" eksim yang boleh dipakai selamanya',
        ],
        memilih:
          'Salep dan petrolatum paling kuat menahan air, cocok untuk malam dan kulit sangat kering. Krim untuk siang. Urea 10% bila kulit sangat menebal. Hindari yang berpewangi.',
        salahnya:
          'Dianggap perawatan, bukan pengobatan, sehingga hanya dipakai kalau ingat. Steroid diberi resep, pelembap disebut sepintas — padahal yang menentukan hasil jangka panjang justru yang kedua.',
      },
    ],
  },

  {
    keluhan: 'Sesak dengan mengi (asma dan PPOK)',
    inti:
      'Dua obat yang tampak mirip mengerjakan dua hal yang sama sekali berbeda: PELEGA membuka jalan napas hari ini dan tidak mengubah penyakitnya, PENGENDALI memadamkan radang dan menentukan apakah serangan berikutnya terjadi. Penderita yang hanya memegang pelega merasa terkendali sampai serangan yang mematikannya.',
    golongan: [
      {
        nama: 'Agonis beta-2 kerja singkat (pelega)',
        contoh: 'Salbutamol, terbutalin',
        dosis:
          'SERANGAN: salbutamol inhalasi 4-10 semprot (100 µg/semprot) LEWAT SPACER, diulang tiap 20 menit pada satu jam pertama; atau nebulisasi 2,5-5 mg dalam NaCl 0,9% tiap 20 menit ×3. ANAK: 2-6 semprot lewat spacer, atau nebulisasi 2,5 mg (<20 kg) dan 5 mg (>20 kg). Sesudah stabil: 2 semprot tiap 4-6 jam SESUAI KEBUTUHAN. Terbutalin 0,25-0,5 mg subkutan bila inhalasi tidak mungkin.',
        kapan: 'Meredakan sesak dan mengi SEKARANG — pada serangan, dan sebelum olahraga pada asma yang dipicu aktivitas.',
        rantai: [
          'Agonis beta-2 → adenilat siklase → cAMP naik di otot polos bronkus',
          'miosin kinase rantai ringan terhambat → otot MELEMAS',
          'jalan napas melebar dalam 5-15 menit',
          '',
          'Tetapi RADANG dan LENDIR di dinding tidak disentuh sama sekali',
          'itu sebabnya lega yang dirasakan tidak berarti penyakitnya membaik',
          '',
          'Reseptor beta-2 juga ada di otot rangka dan jantung',
          'TREMOR, berdebar, dan kalium turun adalah tanda dosisnya bekerja',
          'bukan tanda alergi — dan kalium yang turun penting pada serangan berat',
          '',
          'Pemakaian berlebihan menumpulkan reseptornya sendiri',
          'lebih dari 3 kali sepekan berarti PENGENDALINYA yang kurang',
        ],
        memilih:
          'Inhaler dengan SPACER sama baiknya dengan nebulisasi pada serangan ringan-sedang, dan lebih cepat disiapkan. Nebulisasi bila penderita terlalu sesak untuk mengatur napas.',
        salahnya:
          'Menjadi satu-satunya obat yang dipegang. Pemakaian LEBIH DARI SATU TABUNG SEBULAN adalah tanda bahaya yang berhubungan dengan kematian akibat asma — dan itu tanda pengendalinya belum ada, bukan tanda pelega perlu ditambah.',
      },
      {
        nama: 'Kortikosteroid inhalasi dan kombinasinya (pengendali)',
        contoh: 'Budesonid, flutikason; budesonid-formoterol, flutikason-salmeterol',
        dosis:
          'Budesonid 2x200-400 µg (dosis rendah 200-400 µg/hari, sedang 400-800, tinggi >800). Flutikason propionat 2x100-250 µg. KOMBINASI: budesonid-formoterol 160/4,5 µg, 1-2 semprot 2x/hari. Pendekatan kini pada asma dewasa: budesonid-formoterol dipakai SEBAGAI PELEGA SEKALIGUS PENGENDALI (MART) — tiap kali butuh pelega, radangnya ikut diobati. WAJIB BERKUMUR sesudah memakai.',
        kapan:
          'SEMUA asma persisten — bahkan yang gejalanya jarang. Pada PPOK hanya bila sering eksaserbasi atau eosinofil darah tinggi, sebab pada PPOK ia menaikkan risiko pneumonia.',
        rantai: [
          'Steroid masuk ke inti sel epitel dan sel radang saluran napas',
          'penyalinan gen sitokin (IL-4, IL-5, eotaksin) ditekan',
          'eosinofil dan sel mast tidak lagi direkrut',
          '',
          'Kepekaan berlebihan saluran napas menurun secara BERTAHAP',
          'perlu 1-2 pekan untuk terasa dan 2-3 bulan untuk penuh',
          'inilah sebab ia tidak berguna sebagai obat serangan',
          '',
          'Steroid juga MEMULIHKAN kepekaan reseptor beta-2 yang menumpul',
          'karena itu pelega bekerja lebih baik pada yang memakai pengendali',
          '',
          'Yang mengendap di mulut menumbuhkan KANDIDA dan menyerakkan suara',
          'berkumur dan spacer menghapus hampir seluruh masalah itu',
        ],
        memilih:
          'Mulai dari dosis rendah dan naikkan bila belum terkendali. Kombinasi dengan formoterol (kerja cepat dan panjang) memungkinkan satu tabung untuk dua keperluan. LABA TIDAK PERNAH diberikan sendirian pada asma — tanpa steroid ia menaikkan kematian.',
        salahnya:
          'Dihentikan begitu merasa enak. Asma tidak hilang, radangnya yang sedang tenang — dan menghentikan pengendali adalah jalan paling langsung menuju serangan berikutnya. Kekeliruan kedua: tidak berkumur, lalu sariawan jamur dianggap alergi obat.',
      },
      {
        nama: 'Antikolinergik inhalasi',
        contoh: 'Ipratropium (kerja singkat); tiotropium, glikopironium (kerja panjang)',
        dosis:
          'Ipratropium nebulisasi 0,5 mg (anak 0,25 mg) DIGABUNG dengan salbutamol tiap 20 menit ×3 pada serangan berat; inhalasi 2 semprot (20 µg) 4x/hari. Tiotropium 1x18 µg (serbuk) atau 1x5 µg (kabut halus) — sekali sehari, PENGENDALI, bukan pelega.',
        kapan:
          'PPOK sebagai tulang punggung pengobatannya; asma serangan berat sebagai TAMBAHAN pada salbutamol; dan asma yang belum terkendali dengan steroid inhalasi.',
        rantai: [
          'Nervus vagus melepas asetilkolin ke reseptor M3 otot polos bronkus',
          'dihambat → tonus penyempitan dasar hilang → jalan napas melebar',
          '',
          'Pada PPOK, tonus kolinergik inilah bagian penyempitan yang MASIH DAPAT DIBALIK',
          'itu sebab antikolinergik justru lebih menentukan di PPOK daripada di asma',
          '',
          'Molekulnya amonium kuaterner — hampir tidak diserap',
          'mulut kering adalah keluhan yang lazim; efek tubuh menyeluruh jarang',
          '',
          'Yang terkena MATA menimbulkan pandangan kabur dan dapat mencetuskan',
          'glaukoma sudut tertutup — karena itu sungkup nebulisasi harus rapat',
        ],
        memilih:
          'Ipratropium untuk keadaan akut, tiotropium untuk pemeliharaan PPOK. Pada serangan asma berat, menggabungkannya dengan salbutamol mengurangi kebutuhan rawat inap.',
        salahnya:
          'Tiotropium dipakai saat serangan — ia kerja panjang dan tidak melegakan sekarang. Dan nebulisasi bersungkup longgar pada penderita glaukoma sudut tertutup.',
      },
      {
        nama: 'Kortikosteroid sistemik pada serangan',
        contoh: 'Prednison, metilprednisolon, deksametason, hidrokortison',
        dosis:
          'DEWASA: prednison 40-50 mg PO sekali sehari selama 5-7 HARI, TANPA perlu diturunkan bertahap bila kurang dari 2 pekan. ANAK: prednisolon 1-2 mg/kgBB/hari (maksimal 40 mg) selama 3-5 hari; atau deksametason 0,6 mg/kgBB dosis tunggal (maksimal 16 mg) yang sama baiknya dan lebih mudah dipatuhi. Tidak dapat menelan: metilprednisolon 1-2 mg/kgBB IV atau hidrokortison 100 mg IV tiap 6 jam. DIBERIKAN DALAM SATU JAM PERTAMA.',
        kapan: 'Serangan asma sedang sampai berat, dan eksaserbasi PPOK — pada hampir semua yang datang ke gawat darurat.',
        rantai: [
          'Steroid tidak melebarkan bronkus dan tidak terasa dalam 4-6 jam pertama',
          'yang ia kerjakan adalah memadamkan radang yang MENYEBABKAN penyempitan',
          '',
          'Perekrutan sel radang berhenti, kebocoran dinding berkurang',
          'lendir yang menyumbat berkurang',
          '',
          'Dan ia MENGEMBALIKAN kepekaan reseptor beta-2 yang menumpul',
          'inilah sebab salbutamol bekerja lebih baik beberapa jam sesudahnya',
          '',
          'Manfaat terbesarnya adalah MENCEGAH SERANGAN BERULANG',
          'dalam pekan berikutnya — yang tidak terlihat malam itu juga',
        ],
        memilih:
          'Oral sama baiknya dengan suntikan bila penderita dapat menelan. Deksametason dosis tunggal pada anak menghindarkan lima hari sirup yang sering tidak dihabiskan.',
        salahnya:
          'Ditunda sampai "kalau nanti tidak membaik" — padahal manfaatnya bergantung pada seberapa dini ia diberikan. Kekeliruan sebaliknya: steroid oral berulang setiap bulan tanpa pernah memulai pengendali inhalasi, sehingga penderita menanggung seluruh bahaya steroid tanpa satu pun manfaat jangka panjangnya.',
      },
    ],
  },

  {
    keluhan: 'Nyeri kepala',
    inti:
      'Yang pertama bukan memilih obat melainkan memisahkan nyeri kepala PRIMER (tegang, migrain, klaster) dari yang SEKUNDER — dan tanda bahayanya: mendadak seperti disambar (thunderclap), disertai demam dan kaku kuduk, defisit neurologis, kejang, usia di atas 50 tahun yang baru mulai, memberat saat berbaring atau mengejan, atau pada penderita kanker dan HIV. Analgesik pada nyeri kepala sekunder hanya menunda diagnosisnya.',
    golongan: [
      {
        nama: 'Analgesik sederhana',
        contoh: 'Parasetamol, ibuprofen, natrium diklofenak, aspirin, kombinasi kafein',
        dosis:
          'Parasetamol 1000 mg. Ibuprofen 400-600 mg. Natrium diklofenak 50-100 mg. Aspirin 900-1000 mg. Diminum SEDINI mungkin saat serangan dimulai. BATAS PEMAKAIAN: parasetamol tidak lebih dari 15 hari/bulan, NSAID dan kombinasi tidak lebih dari 10 hari/bulan.',
        kapan: 'Nyeri kepala tipe tegang, dan migrain ringan sampai sedang.',
        rantai: [
          'Nyerinya berasal dari peregangan dan peradangan pembuluh serta selaput otak',
          'prostaglandin menurunkan ambang nosiseptor di sana',
          'penghambatan COX mengembalikan ambangnya',
          '',
          'Pada migrain, keterlambatan minum obat menghukum:',
          'begitu sensitisasi sentral terbentuk (kulit kepala terasa perih disentuh),',
          'obat oral bekerja jauh lebih buruk — jendelanya jam pertama',
          '',
          'Kafein 65-100 mg mempercepat penyerapan dan menambah efeknya',
          'tetapi kafein pula yang paling cepat menimbulkan nyeri kepala AKIBAT OBAT',
        ],
        memilih:
          'Parasetamol pada kehamilan, penyakit lambung, dan gangguan pembekuan. NSAID bila komponen nyerinya lebih berat. Aspirin dosis besar efektif untuk migrain tetapi tidak untuk anak (sindrom Reye).',
        salahnya:
          'Diminum hampir setiap hari sampai timbul NYERI KEPALA AKIBAT PENGGUNAAN OBAT BERLEBIH — nyeri harian yang disebabkan obatnya sendiri, yang hanya sembuh dengan menghentikan obatnya dan akan memburuk dahulu selama 1-2 pekan.',
      },
      {
        nama: 'Triptan',
        contoh: 'Sumatriptan, rizatriptan, eletriptan',
        dosis:
          'Sumatriptan 50-100 mg PO, boleh diulang sesudah 2 jam, maksimal 200 mg/hari; bentuk subkutan 6 mg (paling cepat, untuk migrain berat dan klaster), maksimal 12 mg/hari; semprot hidung 20 mg bila disertai muntah. Rizatriptan 10 mg. Maksimal 9-10 hari sebulan.',
        kapan: 'Migrain sedang sampai berat, atau yang tidak menyerah pada analgesik sederhana.',
        rantai: [
          'Triptan adalah agonis serotonin 5-HT1B dan 5-HT1D',
          '5-HT1B pada pembuluh meningeal → pembuluh yang melebar MENYEMPIT kembali',
          '5-HT1D pada ujung trigeminal → pelepasan CGRP dan substansi P dihentikan',
          'radang neurogenik pada selaput otak padam',
          '',
          'Karena ia MENYEMPITKAN pembuluh, ia juga menyempitkan koroner',
          'itulah dasar seluruh kontraindikasinya',
          '',
          'Ia bekerja pada jalur migrain, bukan pada jalur nyeri umum',
          'karena itu tidak berguna untuk nyeri kepala tegang maupun nyeri lain',
        ],
        memilih:
          'Sumatriptan subkutan bila muntah atau serangannya sangat cepat memuncak; semprot hidung bila tidak dapat menelan; oral untuk sisanya. Bila satu triptan gagal, triptan LAIN masih mungkin berhasil — kegagalan satu bukan kegagalan golongan.',
        salahnya:
          'Diberikan pada penyakit jantung koroner, stroke, hipertensi tidak terkendali, migrain hemiplegik, dan migrain batang otak — semuanya kontraindikasi. Dan diminum bersama SSRI dosis besar tanpa kewaspadaan terhadap sindrom serotonin.',
      },
      {
        nama: 'Pencegah migrain',
        contoh: 'Propranolol, amitriptilin, topiramat, flunarizin, asam valproat',
        dosis:
          'Propranolol 2x20 mg dinaikkan sampai 80-160 mg/hari. Amitriptilin 1x10 mg malam sampai 25-75 mg. Topiramat 1x25 mg malam, dinaikkan 25 mg tiap pekan sampai 2x50 mg. Flunarizin 1x5-10 mg malam (maksimal 3 bulan). Asam valproat 2x250-500 mg — DIHINDARI pada perempuan usia subur. Semuanya dinilai sesudah 8-12 PEKAN, bukan sebelumnya.',
        kapan:
          'Serangan 4 kali atau lebih sebulan, serangan yang melumpuhkan, obat serangan dipakai lebih dari 10 hari sebulan, atau ada aura yang berkepanjangan.',
        rantai: [
          'Migrain bukan penyakit pembuluh melainkan otak yang MUDAH TEREKSITASI',
          'gelombang depolarisasi menyebar (cortical spreading depression) mencetuskannya',
          '',
          'Obat pencegah menaikkan ambang eksitasi itu dengan cara berbeda-beda:',
          'topiramat menghambat kanal natrium dan menguatkan GABA',
          'propranolol menstabilkan tonus adrenergik sentral',
          'amitriptilin menguatkan jalur penghambat turun',
          '',
          'Tidak satu pun bekerja cepat — perubahan ambang perlu berpekan-pekan',
          'menilainya pada pekan kedua adalah sebab tersering ia dianggap gagal',
        ],
        memilih:
          'Pilih menurut penyakit penyertanya: propranolol bila ada hipertensi atau cemas (HINDARI pada asma), amitriptilin bila ada sukar tidur atau nyeri kronik, topiramat bila obesitas (ia menurunkan berat) tetapi awas gangguan kata dan batu ginjal, flunarizin bila disertai vertigo.',
        salahnya:
          'Dihentikan pada pekan kedua karena "tidak mempan". Dan sasarannya salah dipahami: pencegah dianggap berhasil bila migrain HILANG, padahal keberhasilan yang wajar adalah frekuensi berkurang separuh.',
      },
    ],
  },

  {
    keluhan: 'Sulit tidur',
    inti:
      'Obat tidur adalah pilihan TERAKHIR, bukan pertama. Yang terbukti mengubah insomnia menahun adalah terapi perilaku (CBT-I) — pembatasan waktu di ranjang, jam bangun yang tetap, dan bangkit dari ranjang bila tidak mengantuk. Obat mempercepat tertidur belasan menit dan berhenti bekerja dalam beberapa pekan.',
    golongan: [
      {
        nama: 'Agonis reseptor benzodiazepin',
        contoh: 'Zolpidem, alprazolam, lorazepam, klonazepam, estazolam',
        dosis:
          'Zolpidem 5 mg untuk perempuan dan usia lanjut, 10 mg untuk laki-laki dewasa, diminum LANGSUNG sebelum tidur dengan sisa waktu tidur minimal 7 jam. Lorazepam 0,5-2 mg. Alprazolam 0,25-0,5 mg. Semuanya untuk 2-4 PEKAN saja, sebaiknya selang-seling, bukan tiap malam.',
        kapan: 'Insomnia akut yang jelas pencetusnya — kehilangan, nyeri, rawat inap — dan hanya untuk jangka pendek.',
        rantai: [
          'Obat mengikat tapak pada reseptor GABA-A',
          'ia MEMPERBESAR pengaruh GABA, bukan menggantikannya',
          'kanal klorida lebih sering terbuka → neuron terhiperpolarisasi',
          'susunan saraf pusat tertekan → tertidur',
          '',
          'Tetapi tidur yang dihasilkan BUKAN tidur alami:',
          'tidur dalam gelombang lambat dan tidur REM berkurang',
          'orang merasa "tidur" tanpa mendapat seluruh manfaat pemulihannya',
          '',
          'Reseptor menyesuaikan diri dalam 2-4 pekan → TOLERANSI',
          'dan menghentikannya menimbulkan INSOMNIA PANTULAN yang lebih buruk',
          'daripada keadaan semula — inilah jebakan yang membuatnya diteruskan',
        ],
        memilih:
          'Zolpidem bila kesulitannya MEMULAI tidur (kerjanya pendek). Yang berwaktu paruh panjang menyisakan kantuk pagi hari. Pada usia lanjut, seluruh golongan ini menaikkan risiko JATUH, patah tulang panggul, dan bingung — dan risikonya melampaui manfaatnya pada hampir semua keadaan.',
        salahnya:
          'Diteruskan berbulan-bulan lalu dihentikan mendadak — putus obat benzodiazepin dapat menimbulkan KEJANG. Penghentian harus bertahap, 10-25% dosis tiap 1-2 pekan. Dan digabung dengan alkohol atau opioid: penekanan napas.',
      },
      {
        nama: 'Antihistamin dan melatonin',
        contoh: 'Difenhidramin, doksilamin, hidroksizin; melatonin',
        dosis:
          'Difenhidramin 25-50 mg sebelum tidur. Doksilamin 12,5-25 mg. Melatonin 1-3 mg diminum 1-2 JAM SEBELUM waktu tidur yang dituju (bukan saat hendak tidur) — untuk pergeseran jam tubuh, dosis kecil pada waktu yang tepat lebih menentukan daripada dosis besar.',
        kapan:
          'Melatonin untuk jet lag, kerja sif, dan sindrom fase tidur tertunda. Antihistamin sesekali untuk insomnia akut ringan.',
        rantai: [
          'Difenhidramin menghambat H1 di otak; histamin adalah salah satu',
          'pemelihara kewaspadaan, sehingga menghambatnya menimbulkan kantuk',
          'ia juga antikolinergik — mulut kering, sembelit, dan pada usia lanjut',
          'BINGUNG serta risiko demensia pada pemakaian panjang',
          '',
          'Melatonin bukan obat tidur melainkan ISYARAT WAKTU',
          'ia memberi tahu inti suprakiasmatik bahwa malam telah tiba',
          'karena itu waktunya menentukan, dan dosis besar tidak menambah manfaat',
          '',
          'Toleransi terhadap efek mengantuk antihistamin muncul dalam BEBERAPA HARI',
        ],
        memilih:
          'Melatonin bila masalahnya waktu tidur yang bergeser, bukan tidur yang tidak nyenyak. Antihistamin dihindari pada usia lanjut, glaukoma sudut tertutup, dan pembesaran prostat.',
        salahnya:
          'Melatonin diminum saat sudah berbaring dan dianggap gagal — ia bukan obat bius, ia isyarat, dan isyarat yang datang terlambat tidak menggeser apa pun. Dan antihistamin dipakai tiap malam bertahun-tahun pada usia lanjut.',
      },
    ],
  },

  {
    keluhan: 'Tekanan darah tinggi',
    inti:
      'Yang diobati bukan angka di layar melainkan RISIKO stroke, serangan jantung, dan gagal ginjal. Karena itu obatnya diminum seumur hidup meski tidak ada keluhan sama sekali — dan tidak adanya keluhan itulah sebab tersering obatnya berhenti diminum sendiri.',
    golongan: [
      {
        nama: 'Penghambat ACE dan ARB',
        contoh: 'Kaptopril, ramipril, lisinopril; kandesartan, valsartan, losartan, telmisartan',
        dosis:
          'Kaptopril 2-3x12,5-50 mg (perutnya harus kosong). Ramipril 1x2,5-10 mg. Lisinopril 1x10-40 mg. Kandesartan 1x8-32 mg. Valsartan 1x80-320 mg. Losartan 1x50-100 mg. Telmisartan 1x40-80 mg. Periksa kalium dan kreatinin 1-2 pekan sesudah mulai dan sesudah tiap kenaikan.',
        kapan:
          'Pilihan pertama pada usia di bawah 55 tahun, dan WAJIB dipertimbangkan bila ada diabetes, proteinuria, penyakit ginjal kronik, gagal jantung, atau riwayat infark.',
        rantai: [
          'Angiotensin II menyempitkan pembuluh dan memerintahkan aldosteron menahan garam',
          'dihambat → pembuluh melebar, garam dan air keluar',
          '',
          'Yang paling menentukan justru terjadi di GINJAL:',
          'angiotensin II menyempitkan arteriol EFEREN glomerulus',
          'dihambat → tekanan di dalam glomerulus TURUN',
          'proteinuria berkurang dan laju kerusakan ginjal melambat',
          '',
          'Kreatinin naik sedikit pada awal adalah TANDA ITU BEKERJA',
          'kenaikan sampai 30% dari awal diteruskan, bukan dihentikan',
          '',
          'Penghambat ACE juga menahan penguraian bradikinin → BATUK KERING',
          'ARB tidak menyentuh bradikinin — karena itu tidak membatukkan',
        ],
        memilih:
          'Penghambat ACE lebih murah dan bukti terpanjang. Pindah ke ARB HANYA bila batuk mengganggu. Keduanya TIDAK PERNAH digabung.',
        salahnya:
          'Diberikan pada KEHAMILAN — keduanya merusak ginjal janin dan mutlak dilarang; ini pertanyaan yang hampir selalu ada di ujian dan kekeliruan yang berat di praktik. Dan digabung dengan suplemen kalium atau spironolakton tanpa memeriksa kalium.',
      },
      {
        nama: 'Penghambat kanal kalsium',
        contoh: 'Amlodipin, nifedipin lepas lambat; diltiazem, verapamil',
        dosis:
          'Amlodipin 1x5-10 mg. Nifedipin lepas lambat 1x30-60 mg. Diltiazem lepas lambat 1x180-360 mg. Verapamil 1x180-480 mg. Amlodipin adalah antihipertensi yang paling aman diminum kapan saja karena kerjanya sangat panjang.',
        kapan:
          'Pilihan pertama pada usia di atas 55 tahun dan pada orang keturunan Afrika; juga bila ada angina, atau bila penghambat ACE tidak dapat dipakai.',
        rantai: [
          'Kanal kalsium tipe L pada otot polos pembuluh dihambat',
          'kalsium tidak masuk → otot tidak berkontraksi → arteri MELEBAR',
          'tahanan perifer turun → tekanan turun',
          '',
          'Golongan dihidropiridin (amlodipin, nifedipin) bekerja pada PEMBULUH',
          'golongan non-dihidropiridin (verapamil, diltiazem) juga pada JANTUNG:',
          'ia memperlambat nodus AV — berguna pada fibrilasi atrium,',
          'berbahaya bila digabung dengan penyekat beta (bradikardia berat)',
          '',
          'Pelebaran arteriol tanpa pelebaran venula menaikkan tekanan kapiler',
          'cairan merembes ke jaringan → BENGKAK PERGELANGAN KAKI',
          'yang bukan tanda gagal jantung dan tidak menyerah pada furosemid',
        ],
        memilih:
          'Amlodipin untuk hampir semua keadaan. Verapamil dan diltiazem bila sekaligus perlu mengendalikan laju jantung — dan JANGAN bersama penyekat beta.',
        salahnya:
          'Bengkak kaki akibat amlodipin diobati dengan furosemid — ia tidak akan hilang, sebab bukan kelebihan cairan; yang menolong adalah menurunkan dosis atau menambahkan penghambat ACE (yang melebarkan venula). Dan nifedipin KERJA PENDEK dipakai untuk menurunkan tekanan darah cepat: penurunan mendadak dapat mencetuskan stroke dan infark.',
      },
      {
        nama: 'Diuretik tiazid',
        contoh: 'Hidroklorotiazid, indapamid, klortalidon',
        dosis:
          'Hidroklorotiazid 1x12,5-25 mg PAGI HARI. Indapamid 1x1,5-2,5 mg. Klortalidon 1x12,5-25 mg (paling panjang kerjanya dan bukti terbaik). Periksa kalium dan natrium 2-4 pekan sesudah mulai.',
        kapan:
          'Obat kedua yang paling sering ditambahkan; juga pilihan pertama pada usia lanjut dan hipertensi sistolik terisolasi.',
        rantai: [
          'Kotransporter Na-Cl di tubulus distal dihambat',
          'natrium dan air dibuang → volume plasma turun (pekan-pekan pertama)',
          '',
          'Sesudah beberapa pekan volume kembali hampir normal',
          'tetapi tekanan TETAP turun — karena tahanan perifer ikut menurun',
          'inilah sebab efek penuhnya baru terlihat pada pekan ke-4 sampai ke-6',
          '',
          'Natrium yang lolos ke tubulus pengumpul ditukar dengan KALIUM',
          'hipokalemia, hiponatremia, hiperurisemia (mencetuskan gout),',
          'dan gula darah sedikit naik',
        ],
        memilih:
          'Klortalidon atau indapamid lebih kuat daripada hidroklorotiazid pada dosis setara. Diminum PAGI agar tidak membangunkan untuk kencing. TIDAK berguna bila eGFR di bawah 30 — di sana furosemid yang dipakai.',
        salahnya:
          'Diberikan pada penderita gout tanpa disadari — tiazid adalah penyebab obat tersering serangan gout. Dan hiponatremia pada usia lanjut tidak dicari, padahal ia sebab bingung dan jatuh yang sering tidak dihubungkan dengan obatnya.',
      },
      {
        nama: 'Penyekat beta pada hipertensi',
        contoh: 'Bisoprolol, atenolol, metoprolol, karvedilol',
        dosis:
          'Bisoprolol 1x2,5-10 mg. Metoprolol suksinat 1x50-200 mg. Atenolol 1x25-100 mg. Karvedilol 2x6,25-25 mg.',
        kapan:
          'BUKAN lagi pilihan pertama untuk hipertensi biasa. Dipakai bila ada alasan lain: gagal jantung, sesudah infark, angina, fibrilasi atrium, migrain, tremor, atau kehamilan (labetalol).',
        rantai: [
          'Reseptor beta-1 di jantung dihambat → denyut dan kekuatan turun',
          'curah jantung turun',
          'beta-1 di ginjal juga dihambat → pelepasan RENIN berkurang',
          '',
          'Pada orang muda dengan renin tinggi ia bekerja baik',
          'pada usia lanjut dengan renin rendah manfaatnya jauh lebih kecil',
          '',
          'Beta-2 di bronkus ikut terhambat pada yang tidak selektif',
          'MENGI pada penderita asma',
          '',
          'Dan ia MENYAMARKAN gejala hipoglikemia (berdebar, gemetar)',
          'sehingga penyandang diabetes kehilangan peringatan dininya',
        ],
        memilih:
          'Bisoprolol dan metoprolol suksinat bila diperlukan selektivitas beta-1. Karvedilol bila ada gagal jantung. Labetalol atau metildopa pada kehamilan.',
        salahnya:
          'DIHENTIKAN MENDADAK — reseptor yang selama ini terhambat menjadi sangat peka, dan dapat timbul angina berat, infark, atau krisis hipertensi. Penghentian selalu bertahap selama 1-2 pekan.',
      },
    ],
  },

  {
    keluhan: 'Gula darah tinggi (diabetes melitus tipe 2)',
    inti:
      'Sasarannya bukan angka gula semata melainkan mencegah kerusakan mata, ginjal, saraf, dan pembuluh besar. Dua golongan kini dipilih bukan karena paling kuat menurunkan gula melainkan karena terbukti MEMPERPANJANG UMUR dan melindungi jantung serta ginjal — dan itu mengubah urutan pilihannya.',
    golongan: [
      {
        nama: 'Metformin',
        contoh: 'Metformin, metformin lepas lambat',
        dosis:
          'Mulai 1x500 mg BERSAMA makan malam, naikkan 500 mg tiap 1-2 pekan sampai 2x1000 mg (maksimal 2550 mg/hari). Bentuk lepas lambat 1x500-2000 mg malam bila lambungnya terganggu. Dihentikan bila eGFR <30; dosis dibatasi 1000 mg/hari bila eGFR 30-45. DIHENTIKAN SEMENTARA sebelum pemeriksaan dengan kontras dan sebelum operasi.',
        kapan: 'Obat PERTAMA pada hampir semua diabetes tipe 2, dimulai bersamaan dengan perubahan gaya hidup, bukan sesudahnya.',
        rantai: [
          'Metformin mengaktifkan AMPK di hati',
          'GLUKONEOGENESIS ditekan — hati berhenti mencurahkan gula ke darah',
          'inilah sumber utama gula darah puasa yang tinggi',
          '',
          'Ia juga menambah kepekaan otot terhadap insulin',
          'dan tidak merangsang pankreas mengeluarkan insulin',
          'karena itu ia TIDAK menimbulkan hipoglikemia bila dipakai sendiri',
          '',
          'Sebagian glukosa dialihkan ke glikolisis anaerob di usus',
          'LAKTAT bertambah — pada ginjal yang sehat ia dibuang tanpa masalah,',
          'pada ginjal yang rusak ia menumpuk → ASIDOSIS LAKTAT',
          '',
          'Pemakaian bertahun-tahun mengganggu penyerapan VITAMIN B12',
          'kesemutan yang muncul sering disangka neuropati diabetik, padahal',
          'ia kekurangan B12 yang dapat dikoreksi',
        ],
        memilih:
          'Bentuk lepas lambat bila mual dan mencret mengganggu. Selalu dinaikkan PERLAHAN — hampir seluruh keluhan lambung berasal dari menaikkan dosis terlalu cepat.',
        salahnya:
          'Diteruskan saat penderita muntah, dehidrasi, atau sakit berat — di situlah asidosis laktat terjadi. Dan B12 tidak pernah diperiksa pada pemakai lebih dari 4 tahun.',
      },
      {
        nama: 'Penghambat SGLT2',
        contoh: 'Dapagliflozin, empagliflozin',
        dosis: 'Dapagliflozin 1x10 mg. Empagliflozin 1x10-25 mg. Tanpa titrasi. Diteruskan sampai eGFR >=20.',
        kapan:
          'Ditambahkan LEBIH AWAL — bukan menunggu gula tidak terkendali — bila ada penyakit jantung, gagal jantung, atau penyakit ginjal kronik. Manfaatnya di sana tidak bergantung pada gula darahnya.',
        rantai: [
          'SGLT2 di tubulus proksimal menyerap kembali glukosa bersama natrium',
          'dihambat → 60-80 gram glukosa dibuang lewat kemih tiap hari',
          'gula turun, berat badan turun 2-3 kg, tekanan darah turun sedikit',
          '',
          'Natrium yang lolos memulihkan umpan balik tubuloglomerulus',
          'arteriol aferen menyempit → tekanan glomerulus turun → GINJAL TERLINDUNGI',
          '',
          'Jantung beralih memakai badan keton yang lebih efisien',
          'perawatan karena gagal jantung berkurang dalam hitungan pekan',
          '',
          'Gula di dalam kemih adalah makanan bagi jamur',
          'infeksi jamur kelamin lazim; kebersihan dan air yang cukup mengurangi',
        ],
        memilih:
          'Keduanya setara. DIHENTIKAN SEMENTARA saat puasa panjang, sakit berat, atau 3 hari sebelum operasi.',
        salahnya:
          'KETOASIDOSIS EUGLIKEMIK tidak dikenali — ketoasidosis dengan gula darah NORMAL atau hanya sedikit naik. Penderita yang sesak dan mual dengan gula 180 mg/dL tetap dapat mengalami ketoasidosis bila memakai golongan ini; yang diperiksa keton, bukan gula.',
      },
      {
        nama: 'Agonis reseptor GLP-1',
        contoh: 'Liraglutid, semaglutid, dulaglutid',
        dosis:
          'Liraglutid 0,6 mg subkutan sekali sehari selama 1 pekan, lalu 1,2 mg, lalu 1,8 mg. Semaglutid suntik 0,25 mg sepekan sekali selama 4 pekan, lalu 0,5 mg, lalu 1 mg. Dulaglutid 0,75-1,5 mg sepekan sekali. Dinaikkan perlahan semata-mata untuk mengurangi mual.',
        kapan:
          'Bila ada penyakit kardiovaskular aterosklerotik, atau bila penurunan berat badan menjadi sasaran penting sekaligus.',
        rantai: [
          'GLP-1 adalah hormon usus yang keluar saat makanan datang',
          'ia merangsang insulin HANYA bila gula sedang tinggi',
          'karena itu hipoglikemia jarang bila dipakai sendiri',
          '',
          'Ia menekan glukagon, MEMPERLAMBAT pengosongan lambung,',
          'dan bekerja pada pusat kenyang di hipotalamus',
          'akibatnya berat badan turun bermakna — 5-15%',
          '',
          'Pengosongan lambung yang melambat itu pula sebab MUAL',
          'yang hampir selalu mereda dalam 4-8 pekan',
        ],
        memilih:
          'Semaglutid mingguan bila suntikan harian memberatkan. Naikkan dosis lebih lambat daripada jadwal baku bila mual mengganggu.',
        salahnya:
          'Diberikan pada riwayat karsinoma tiroid meduler atau MEN-2 (kontraindikasi), dan digabung dengan penghambat DPP-4 yang bekerja pada jalur yang sama tanpa menambah manfaat.',
      },
      {
        nama: 'Sulfonilurea dan insulin',
        contoh: 'Glibenklamid, glimepirid, gliklazid; insulin basal dan prandial',
        dosis:
          'Glimepirid 1x1-4 mg bersama sarapan (maksimal 8 mg). Gliklazid lepas lambat 1x30-120 mg. Glibenklamid 1x2,5-10 mg — DIHINDARI pada usia lanjut dan gangguan ginjal. INSULIN BASAL: glargin atau detemir 10 unit atau 0,1-0,2 unit/kgBB malam hari, dinaikkan 2 unit tiap 3 hari sampai gula puasa 80-130 mg/dL. Prandial: 4 unit atau 10% dosis basal sebelum makan terbesar.',
        kapan:
          'Bila gula masih jauh dari sasaran, atau bila HbA1c di atas 10% dan ada gejala berat — di sana insulin dimulai lebih dahulu, bukan terakhir.',
        rantai: [
          'Sulfonilurea menutup kanal kalium peka-ATP pada sel beta',
          'sel mengalami depolarisasi → kalsium masuk → INSULIN dikeluarkan',
          'ini terjadi TANPA memandang kadar gula saat itu',
          'itulah sebab ia menimbulkan HIPOGLIKEMIA, dan mengapa makan tidak boleh terlewat',
          '',
          'Glibenklamid berwaktu paruh panjang dan bermetabolit aktif',
          'hipoglikemianya berkepanjangan dan dapat kembali setelah tampak pulih',
          'itu sebab hipoglikemia karena sulfonilurea DIRAWAT, bukan dipulangkan',
          '',
          'Insulin bekerja pasti dan tanpa batas atas',
          'yang membatasinya hanya hipoglikemia dan kenaikan berat badan',
        ],
        memilih:
          'Gliklazid atau glimepirid lebih aman daripada glibenklamid. Insulin basal lebih dahulu sebelum prandial. Pada HbA1c >10% dengan penurunan berat badan dan gejala, mulai dengan insulin lalu kurangi kemudian.',
        salahnya:
          'Sulfonilurea diberikan pada usia lanjut yang makannya tidak menentu — hipoglikemia pada kelompok ini mematikan lebih sering daripada gula tinggi. Dan insulin ditunda bertahun-tahun sebagai "ancaman", sehingga penderita menanggung gula tinggi selama itu.',
      },
    ],
  },

  {
    keluhan: 'Nyeri dan panas saat kencing (infeksi saluran kemih)',
    inti:
      'Yang menentukan bukan berat ringannya nyeri melainkan apakah infeksinya masih di KANDUNG KEMIH (sistitis: nyeri kencing, anyang-anyangan, tanpa demam) atau sudah naik ke GINJAL (pielonefritis: demam menggigil, nyeri pinggang, mual). Keduanya berbeda obat, berbeda lama, dan berbeda tempat perawatan.',
    golongan: [
      {
        nama: 'Antibiotik sistitis tanpa komplikasi',
        contoh: 'Nitrofurantoin, kotrimoksazol, fosfomisin, sefiksim',
        dosis:
          'Nitrofurantoin 2x100 mg selama 5 HARI (pilihan pertama; hindari bila eGFR <30 dan menjelang aterm). Kotrimoksazol 2x960 mg selama 3 hari (hanya bila kekebalan setempat di bawah 20%). Fosfomisin 3 g DOSIS TUNGGAL. Sefiksim 2x100 mg selama 5-7 hari. Siprofloksasin 2x250 mg selama 3 hari — DICADANGKAN, bukan lini pertama.',
        kapan: 'Perempuan tidak hamil dengan nyeri kencing, sering kencing, dan anyang-anyangan TANPA demam dan tanpa nyeri pinggang.',
        rantai: [
          'Kuman (tersering Escherichia coli) menempel pada urotelium kandung kemih',
          'radang setempat → rasa terbakar dan dorongan berkemih terus-menerus',
          '',
          'Nitrofurantoin dipekatkan di dalam KEMIH dan hampir tidak di jaringan',
          'inilah sebab ia sangat baik untuk sistitis',
          'dan sama sekali TIDAK BOLEH dipakai untuk pielonefritis —',
          'kadarnya di jaringan ginjal terlalu rendah untuk menolong',
          '',
          'Ia juga tidak menyebar ke seluruh tubuh sehingga kekebalan',
          'yang ditimbulkannya kecil — itulah mengapa ia dikembalikan ke lini pertama',
        ],
        memilih:
          'Nitrofurantoin bila tersedia. Fosfomisin dosis tunggal bila kepatuhan diragukan. Kuinolon disimpan untuk keadaan yang benar-benar memerlukannya.',
        salahnya:
          'Nitrofurantoin diberikan untuk demam dengan nyeri pinggang — pielonefritis akan berlanjut meski kemihnya jernih. Dan bakteriuria TANPA gejala diobati pada orang biasa; ia hanya diobati pada KEHAMILAN dan sebelum tindakan urologi.',
      },
      {
        nama: 'Antibiotik pielonefritis dan ISK berkomplikasi',
        contoh: 'Seftriakson, sefotaksim, siprofloksasin, levofloksasin, gentamisin',
        dosis:
          'Rawat jalan (ringan, dapat minum): siprofloksasin 2x500 mg selama 7 hari, atau levofloksasin 1x750 mg selama 5 hari, sering didahului seftriakson 1 g IV dosis pertama. RAWAT INAP: seftriakson 1x1-2 g IV, atau sefotaksim 3x1-2 g IV, atau gentamisin 5-7 mg/kgBB IV sekali sehari; total 10-14 hari, dialihkan ke oral sesudah 48-72 jam bebas demam.',
        kapan:
          'Demam menggigil dengan nyeri ketok pinggang, mual muntah, laki-laki dengan ISK, kehamilan, batu, kateter, atau kencing manis.',
        rantai: [
          'Kuman naik dari kandung kemih lewat ureter ke pelvis ginjal',
          'radang mengenai JARINGAN ginjal, bukan sekadar permukaan kandung kemih',
          'karena itu antibiotiknya harus mencapai kadar tinggi di jaringan dan darah',
          '',
          'Dari jaringan ginjal kuman mudah masuk ke aliran darah → SEPSIS',
          'inilah sebab pielonefritis dinilai berbeda sejak awal',
          '',
          'Bila ada SUMBATAN (batu, prostat besar), antibiotik saja TIDAK cukup',
          'nanah yang terkurung harus dialirkan — kalau tidak, demam tidak akan turun',
        ],
        memilih:
          'Suntikan bila muntah, demam tinggi, atau hamil. Biakan kemih diambil SEBELUM antibiotik pertama. Bila demam menetap 72 jam, cari sumbatan atau abses dengan pencitraan — bukan mengganti antibiotik.',
        salahnya:
          'Diobati 3 hari seperti sistitis, lalu kambuh. Dan pada laki-laki ISK dianggap biasa — pada laki-laki hampir selalu ada sebab di belakangnya (prostat, batu, kelainan saluran) yang harus dicari.',
      },
      {
        nama: 'Pereda gejala dan pencegahan berulang',
        contoh: 'Fenazopiridin, parasetamol, NSAID; kalium sitrat; estrogen vagina topikal',
        dosis:
          'Fenazopiridin 3x100-200 mg SESUDAH makan, maksimal 2 HARI saja (kemih berubah jingga terang — beri tahu sebelumnya). Parasetamol 3x500-1000 mg. Pencegahan berulang: minum 2-2,5 L/hari, kencing sesudah bersanggama, dan pada perempuan pascamenopause estrogen vagina topikal. Profilaksis antibiotik dosis rendah (nitrofurantoin 50 mg malam) hanya untuk kekambuhan >=3 kali setahun dan atas pertimbangan matang.',
        kapan: 'Meredakan nyeri kencing pada hari-hari pertama, dan mencegah kekambuhan pada yang sering.',
        rantai: [
          'Fenazopiridin adalah zat warna azo yang dikeluarkan lewat kemih',
          'ia bekerja setempat pada mukosa saluran kemih sebagai penenang',
          'ia sama sekali TIDAK membunuh kuman',
          '',
          'Air yang cukup mengencerkan dan MEMBILAS kuman keluar',
          'ini pencegahan yang paling murah dan paling terbukti',
          '',
          'Sesudah menopause, estrogen yang turun mengubah flora vagina',
          'laktobasilus hilang, pH naik, E. coli mudah menetap',
          'estrogen topikal mengembalikan flora itu dan menurunkan kekambuhan',
          'tanpa risiko estrogen telan',
        ],
        memilih:
          'Fenazopiridin hanya sebagai peredam sementara di samping antibiotik, bukan pengganti. Estrogen topikal jauh lebih bermanfaat daripada antibiotik profilaksis pada perempuan pascamenopause.',
        salahnya:
          'Fenazopiridin dipakai berhari-hari sehingga gejalanya tertutup sementara infeksinya berjalan naik. Dan warna jingga pada kemih dan lensa kontak dikira perdarahan atau kerusakan — semata karena tidak diberitahukan sejak awal.',
      },
    ],
  },

  {
    keluhan: 'Mata merah',
    inti:
      'Pertanyaan pertama bukan obat apa, melainkan APAKAH PENGLIHATANNYA TERGANGGU. Mata merah dengan penglihatan turun, nyeri dalam, silau, atau pupil yang tidak wajar adalah kegawatan mata — glaukoma akut, uveitis, ulkus kornea — dan STEROID TETES pada keadaan yang salah dapat membutakan.',
    golongan: [
      {
        nama: 'Antibiotik tetes dan salep mata',
        contoh: 'Kloramfenikol, tobramisin, levofloksasin, moksifloksasin, asam fusidat',
        dosis:
          'KONJUNGTIVITIS BAKTERI: tetes kloramfenikol 0,5% satu tetes tiap 2 jam pada 2 hari pertama lalu 4x/hari, total 5-7 hari; atau salep kloramfenikol 1% 3-4x/hari (salep lebih cocok untuk anak dan malam hari). ULKUS KORNEA: tetes levofloksasin 0,5% atau moksifloksasin 0,5% tiap 1 JAM siang dan malam pada 48 jam pertama, lalu dijarangkan — ini pengobatan rumah sakit, bukan rawat jalan.',
        kapan: 'Kotoran mata bernanah dan lengket, kelopak berlengketan pagi hari, tanpa gangguan penglihatan.',
        rantai: [
          'Konjungtiva meradang, pembuluhnya melebar → merah',
          'sel radang dan lendir keluar sebagai kotoran',
          '',
          'Yang PURULEN dan lengket condong ke BAKTERI',
          'yang ENCER berair dengan kelenjar depan telinga membesar condong ke VIRUS',
          'yang GATAL hebat dengan riwayat alergi condong ke ALERGI',
          '',
          'Sebagian besar konjungtivitis bakteri sembuh sendiri dalam 7-10 hari',
          'antibiotik memendekkannya beberapa hari dan mengurangi penularan',
          '',
          'Kornea BUKAN konjungtiva: infeksi di sana meninggalkan PARUT',
          'dan parut di tengah kornea berarti penglihatan hilang selamanya',
        ],
        memilih:
          'Kloramfenikol untuk konjungtivitis biasa. Kuinolon dicadangkan untuk kornea. Konjungtivitis VIRUS tidak memerlukan antibiotik sama sekali — yang diberikan air mata buatan, kompres dingin, dan cuci tangan.',
        salahnya:
          'Tetes gabungan ANTIBIOTIK + STEROID diberikan untuk semua mata merah. Bila penyebabnya herpes simpleks atau jamur, steroid mempercepat perusakan kornea sampai berlubang. Steroid mata hanya atas pertimbangan dokter mata.',
      },
      {
        nama: 'Tetes alergi dan air mata buatan',
        contoh: 'Olopatadin, ketotifen, natrium kromoglikat; hidroksipropil metilselulosa, natrium hialuronat',
        dosis:
          'Olopatadin 0,1% 2x/hari (0,2% 1x/hari). Ketotifen 0,025% 2-3x/hari. Natrium kromoglikat 2% 4x/hari — perlu 5-7 hari untuk bekerja, jadi dipakai TERATUR pada musim alergi. Air mata buatan 4-8x/hari, atau tiap jam bila berat; pilih yang TANPA PENGAWET bila dipakai lebih dari 4-6 kali sehari.',
        kapan: 'Mata gatal, berair, dan merah pada alergi; mata kering; iritasi karena layar, kipas, dan asap.',
        rantai: [
          'Sel mast di konjungtiva melepas histamin',
          'H1 pada ujung saraf → GATAL, yang menjadi tanda paling khas alergi mata',
          'pembuluh melebar dan bocor → merah dan bengkak',
          '',
          'Olopatadin dan ketotifen menghambat H1 SEKALIGUS menstabilkan sel mast',
          'karena itu ia meredakan sekarang dan mencegah nanti',
          'kromoglikat hanya menstabilkan — mencegah, tidak meredakan',
          '',
          'Pengawet benzalkonium pada tetes justru MERUSAK epitel kornea',
          'bila diteteskan berkali-kali sehari dalam jangka panjang',
        ],
        memilih:
          'Olopatadin bila perlu segera reda dan cukup 1-2 kali sehari. Kromoglikat untuk pencegahan musiman. Air mata buatan tanpa pengawet bila pemakaiannya sering.',
        salahnya:
          'Tetes "pemutih mata" berisi vasokonstriktor (tetrahidrozolin, nafazolin) dipakai tiap hari — matanya memutih sebentar lalu MERAH LEBIH HEBAT saat obatnya habis, persis seperti rinitis medikamentosa di hidung.',
      },
    ],
  },

  {
    keluhan: 'Sakit gigi dan gusi bengkak',
    inti:
      'Obat hanya menunda; yang menyembuhkan adalah TINDAKAN GIGI — menambal, merawat saluran akar, mencabut, atau mengalirkan nanah. Antibiotik pada sakit gigi tanpa tanda penyebaran tidak mempercepat apa pun, dan yang menentukan keselamatan adalah mengenali abses yang menyebar ke dasar mulut atau leher.',
    golongan: [
      {
        nama: 'Analgesik gigi',
        contoh: 'Ibuprofen, natrium diklofenak, asam mefenamat, parasetamol',
        dosis:
          'Ibuprofen 400-600 mg tiap 6-8 jam — analgesik TERBAIK untuk nyeri gigi. Bila belum cukup: ibuprofen 400 mg DITAMBAH parasetamol 1000 mg bersamaan, yang lebih kuat daripada menaikkan salah satunya dan lebih kuat daripada banyak opioid. Natrium diklofenak 50 mg 3x/hari. Asam mefenamat 500 mg pertama lalu 3x250-500 mg. Anak: ibuprofen 5-10 mg/kgBB/kali.',
        kapan: 'Pulpitis, nyeri pascacabut, perikoronitis, dan hampir semua nyeri gigi.',
        rantai: [
          'Pulpa gigi terkurung dalam ruang berdinding keras yang tidak dapat mengembang',
          'radang menaikkan tekanan di dalamnya',
          'tekanan menekan saraf → nyeri yang berdenyut dan sangat khas',
          '',
          'Prostaglandin di sini bukan sekadar penghantar nyeri melainkan',
          'penyebab tekanannya — itulah sebab NSAID jauh lebih menolong daripada',
          'parasetamol maupun opioid pada nyeri gigi',
          '',
          'Menggabungkan NSAID dan parasetamol bekerja pada dua jalur berbeda',
          'sehingga hasilnya melampaui keduanya sendiri-sendiri',
        ],
        memilih:
          'Ibuprofen lebih dahulu; tambahkan parasetamol bila kurang. Kompres DINGIN dari luar, bukan hangat — hangat memperbesar bengkak dan mempercepat penyebaran nanah.',
        salahnya:
          'Tablet analgesik DILETAKKAN pada gusi atau lubang gigi — aspirin dan asam mefenamat membakar mukosa dan menimbulkan luka putih yang nyeri. Obat ditelan, bukan ditempel.',
      },
      {
        nama: 'Antibiotik gigi — hanya bila menyebar',
        contoh: 'Amoksisilin, amoksisilin-klavulanat, metronidazol, klindamisin',
        dosis:
          'Amoksisilin 3x500 mg selama 5 hari. Bila ada bau busuk atau kecurigaan anaerob: DITAMBAH metronidazol 3x500 mg selama 5 hari (paduan ini yang paling lazim di Indonesia), atau langsung amoksisilin-klavulanat 3x500/125 mg. Alergi penisilin: klindamisin 3x300 mg. Anak: amoksisilin 50 mg/kgBB/hari terbagi 3.',
        kapan:
          'HANYA bila ada tanda penyebaran: bengkak wajah, demam, kelenjar leher membesar, sulit membuka mulut (trismus), atau daya tahan tubuh menurun. Bukan untuk sakit gigi biasa.',
        rantai: [
          'Nanah yang terkurung tidak dapat dicapai antibiotik dengan baik',
          'aliran darah ke rongga abses buruk dan pH-nya asam',
          'itulah sebab MENGALIRKAN nanah selalu mengalahkan menambah antibiotik',
          '',
          'Flora mulut campuran: kokus aerob dan anaerob bersama-sama',
          'amoksisilin menutup yang aerob, metronidazol yang anaerob',
          '',
          'Infeksi gigi bawah dapat turun ke DASAR MULUT (angina Ludwig)',
          'lidah terangkat, air liur menetes, suara berubah, napas sesak',
          'ini kegawatan jalan napas, bukan lagi urusan resep',
        ],
        memilih:
          'Amoksisilin + metronidazol untuk sebagian besar keadaan. Klindamisin bila alergi penisilin. Dan selalu dengan rujukan ke dokter gigi — antibiotik memberi waktu, bukan penyembuhan.',
        salahnya:
          'Diberikan berulang kali untuk gigi yang sama selama bertahun-tahun tanpa gigi itu pernah dirawat. Tiap kali membaik sebentar, tiap kali kembali, dan kekebalan kuman terbentuk untuk hasil yang nol.',
      },
    ],
  },

  {
    keluhan: 'Nyeri haid dan haid berlebihan',
    inti:
      'Nyeri haid PRIMER (mulai 6-12 bulan sesudah haid pertama, nyeri kram pada hari pertama-kedua) berbeda dari SEKUNDER (mulai bertahun-tahun kemudian, memberat, disertai nyeri sanggama atau haid banyak) yang mengarah ke endometriosis, adenomiosis, atau mioma — dan yang kedua tidak diselesaikan dengan analgesik.',
    golongan: [
      {
        nama: 'NSAID untuk dismenorea',
        contoh: 'Asam mefenamat, ibuprofen, natrium diklofenak, naproksen',
        dosis:
          'Asam mefenamat 500 mg dosis pertama lalu 3x250-500 mg. Ibuprofen 400-600 mg tiap 6-8 jam. Naproksen 500 mg lalu 250 mg tiap 6-8 jam. YANG MENENTUKAN: dimulai 1-2 HARI SEBELUM haid diperkirakan datang, atau pada tanda pertama, dan diteruskan teratur 2-3 hari — bukan diminum saat nyeri sudah memuncak.',
        kapan: 'Nyeri haid primer — dan ia berhasil pada sekitar 80% perempuan bila waktunya benar.',
        rantai: [
          'Menjelang haid, kadar progesteron turun',
          'endometrium melepaskan PROSTAGLANDIN F2-alfa dalam jumlah besar',
          'rahim berkontraksi kuat dan lama',
          'kontraksi menjepit arteri rahimnya sendiri → ISKEMIA → nyeri kram',
          '',
          'Prostaglandin yang sama masuk ke peredaran darah',
          'menimbulkan MUAL, MENCRET, dan nyeri kepala yang menyertai haid',
          'inilah sebab NSAID juga meredakan keluhan-keluhan itu',
          '',
          'NSAID menghambat pembentukan prostaglandin, BUKAN menghapus yang sudah ada',
          'itulah sebab memulainya sebelum nyeri jauh lebih berhasil',
        ],
        memilih:
          'Asam mefenamat paling lazim di Indonesia; naproksen paling panjang kerjanya sehingga cukup 2 kali sehari. Ditambah kompres hangat perut, yang manfaatnya nyata dan sering diremehkan.',
        salahnya:
          'Diminum saat nyeri sudah tidak tertahankan pada jam kesekian — prostaglandinnya sudah terlanjur terbentuk. Dan nyeri haid yang MEMBERAT dari tahun ke tahun terus diberi analgesik tanpa pernah dicari endometriosisnya, yang rata-rata terlambat didiagnosis bertahun-tahun.',
      },
      {
        nama: 'Hormon dan antifibrinolitik untuk haid banyak',
        contoh: 'Pil kontrasepsi kombinasi, AKDR levonorgestrel, medroksiprogesteron; asam traneksamat',
        dosis:
          'Asam traneksamat 3x1000 mg (atau 3x500 mg) SELAMA HARI-HARI PERDARAHAN saja, maksimal 5 hari — mengurangi jumlah darah haid sekitar sepertiga sampai separuh. Pil kombinasi diminum seperti biasa dan mengurangi jumlah sekaligus nyeri. AKDR levonorgestrel 52 mg adalah yang PALING efektif untuk haid banyak dan bertahan 5-8 tahun. Medroksiprogesteron asetat 3x10 mg pada hari ke-5 sampai ke-26 siklus.',
        kapan:
          'Haid yang mengganggu kegiatan sehari-hari, atau yang sudah menimbulkan ANEMIA — dan anemianya diobati bersamaan dengan besi.',
        rantai: [
          'Setelah endometrium terlepas, perdarahan dihentikan oleh',
          'penyempitan pembuluh dan sumbat bekuan setempat',
          '',
          'Pada haid banyak, aktivitas FIBRINOLITIK di rahim berlebihan',
          'plasmin melarutkan bekuan lebih cepat daripada ia terbentuk',
          '',
          'Asam traneksamat menutup tapak pengikat lisin pada plasminogen',
          'plasminogen tidak lagi menempel pada fibrin → bekuan bertahan',
          'ia TIDAK mengubah hormon dan tidak mengganggu kesuburan',
          '',
          'Hormon bekerja dari sisi lain: menipiskan endometrium',
          'sedikit lapisan yang dilepas berarti sedikit darah yang keluar',
        ],
        memilih:
          'Asam traneksamat bila ingin sesuatu yang dipakai hanya saat haid dan tidak berpengaruh pada kesuburan. AKDR levonorgestrel bila juga menginginkan kontrasepsi jangka panjang. Pil kombinasi bila sekaligus ingin siklus yang teratur.',
        salahnya:
          'Haid banyak diobati tanpa memeriksa HEMOGLOBIN dan FERITIN — anemia defisiensi besi karena haid adalah sebab anemia tersering pada perempuan usia subur, dan mengobati perdarahannya saja meninggalkan simpanan besinya tetap kosong.',
      },
    ],
  },

  {
    keluhan: 'Luka dan infeksi kulit',
    inti:
      'Yang menentukan penyembuhan luka bukan salep melainkan PEMBERSIHAN dan kelembapan yang tepat. Dan pada infeksi kulit, yang paling menentukan adalah memisahkan selulitis (yang diobati antibiotik) dari ABSES (yang harus disayat dan dialirkan — antibiotik saja tidak akan menyembuhkannya).',
    golongan: [
      {
        nama: 'Perawatan dan antiseptik luka',
        contoh: 'NaCl 0,9%, povidon iodin, klorheksidin, salep antibiotik topikal',
        dosis:
          'Cuci dengan NaCl 0,9% mengalir dalam jumlah BANYAK — pada luka kotor 50-100 mL per sentimeter panjang luka. Povidon iodin 10% hanya untuk kulit UTUH di sekitar luka dan untuk antisepsis sebelum tindakan, bukan disiramkan ke dalam luka berulang kali. Salep mupirosin 2% 3x/hari selama 5 hari pada impetigo terbatas. Asam fusidat 2% 3x/hari.',
        kapan: 'Luka lecet, luka sayat, luka pascabedah, dan impetigo yang masih terbatas.',
        rantai: [
          'Penyembuhan luka menuntut sel bermigrasi di permukaan yang LEMBAP',
          'luka yang dibiarkan mengering membentuk keropeng',
          'sel harus menggali di bawahnya — penyembuhan melambat dan parutnya lebih besar',
          '',
          'Antiseptik pekat membunuh kuman DAN membunuh fibroblas serta keratinosit',
          'povidon iodin yang disiram berulang ke dasar luka memperlambat penyembuhan',
          '',
          'Yang paling menentukan justru mekanis: MEMBILAS',
          'jumlah kuman dan benda asing berkurang oleh volume dan tekanan air,',
          'bukan oleh zat kimianya',
        ],
        memilih:
          'NaCl 0,9% atau air matang untuk membilas; balutan yang menjaga kelembapan, bukan kasa kering yang menempel. Antibiotik topikal hanya untuk infeksi permukaan yang terbatas — pada luka bersih ia tidak mencegah apa-apa dan menimbulkan alergi kontak.',
        salahnya:
          'Alkohol dan hidrogen peroksida dituangkan ke dalam luka terbuka: perih hebat, jaringan sehat rusak, dan tidak satu pun mempercepat penyembuhan. Dan STATUS TETANUS tidak ditanyakan — pada luka kotor, tertusuk, atau gigitan, ini bagian yang tidak boleh terlewat.',
      },
      {
        nama: 'Antibiotik infeksi kulit',
        contoh: 'Sefaleksin, kloksasilin, amoksisilin-klavulanat, klindamisin, kotrimoksazol',
        dosis:
          'SELULITIS tanpa nanah (streptokokus): sefaleksin 4x500 mg atau kloksasilin 4x500 mg selama 5-7 hari; anak 25-50 mg/kgBB/hari terbagi 4. ABSES atau curiga MRSA: kotrimoksazol 2x960 mg atau klindamisin 3x300-450 mg selama 5-7 hari. Berat atau meluas cepat: seftriakson 1x1-2 g IV, atau kloksasilin 4x1-2 g IV. GIGITAN (manusia atau hewan): amoksisilin-klavulanat 3x500/125 mg selama 5-7 hari — pilihan yang hampir selalu benar untuk gigitan.',
        kapan: 'Kemerahan yang meluas dengan hangat dan nyeri; abses SESUDAH disayat; gigitan; dan luka yang sudah bernanah.',
        rantai: [
          'Selulitis adalah radang menyebar di dermis dan lemak bawah kulit',
          'penyebab tersering streptokokus beta-hemolitikus, lalu Staphylococcus aureus',
          '',
          'Abses berbeda secara mendasar: ia rongga tertutup berisi nanah',
          'tidak berpembuluh, ber-pH asam, dan penuh enzim yang merusak antibiotik',
          'kadar antibiotik di dalamnya tidak pernah mencukupi',
          '',
          'Karena itu urutannya tetap: SAYAT DAN ALIRKAN lebih dahulu',
          'antibiotik menjadi tambahan, bukan pengganti',
          '',
          'Kemerahan yang menyebar SANGAT CEPAT dengan nyeri yang jauh melampaui',
          'tampilannya, kulit keabuan, dan gelembung berisi cairan',
          'mengarah ke FASIITIS NEKROTIKANS — itu meja operasi, bukan resep',
        ],
        memilih:
          'Sefaleksin atau kloksasilin untuk selulitis biasa. Kotrimoksazol atau klindamisin bila ada nanah (kemungkinan MRSA). Amoksisilin-klavulanat untuk gigitan. Tandai batas kemerahan dengan pena dan tanggalnya — itu cara termurah menilai apakah pengobatannya berhasil.',
        salahnya:
          'Abses diberi antibiotik berhari-hari tanpa disayat. Dan tungkai yang bengkak KEDUA SISI tanpa nyeri disangka selulitis, padahal selulitis hampir selalu SATU SISI; yang dua sisi biasanya bendungan vena atau gagal jantung.',
      },
      {
        nama: 'Antijamur kulit',
        contoh: 'Ketokonazol, mikonazol, klotrimazol, terbinafin (oles); griseofulvin, itrakonazol, terbinafin (telan)',
        dosis:
          'OLES: krim ketokonazol 2%, mikonazol 2%, atau klotrimazol 1% 2x/hari selama 2-4 pekan, DITERUSKAN 1-2 pekan sesudah kulit tampak bersih; terbinafin 1% 1-2x/hari selama 1-2 pekan. TELAN (bila luas, di kulit kepala, atau di kuku): griseofulvin 500-1000 mg/hari bersama makanan berlemak selama 4-8 pekan (kulit kepala anak 10-20 mg/kgBB/hari selama 6-8 pekan); terbinafin 1x250 mg selama 2 pekan (badan), 6 pekan (kuku tangan), 12 pekan (kuku kaki); itrakonazol 1x200 mg. PITIRIASIS VERSIKOLOR: ketokonazol 2% sampo dioleskan ke seluruh badan, didiamkan 5 menit, 1x/hari selama 3-5 hari.',
        kapan: 'Kurap, panu, kutu air, kandidiasis lipatan, dan jamur kuku.',
        rantai: [
          'Golongan azol menghambat enzim lanosterol 14-alfa-demetilase jamur',
          'ERGOSTEROL — bahan penyusun membran jamur — tidak terbentuk',
          'membran bocor, jamur mati',
          '',
          'Terbinafin memutus jalur yang sama pada langkah lebih awal (skualen epoksidase)',
          'skualen menumpuk dan meracuni jamur itu sendiri — kerjanya membunuh, bukan menahan',
          '',
          'Jamur hidup di lapisan tanduk yang TERUS berganti',
          'obat harus diteruskan sampai lapisan yang terinfeksi seluruhnya terkelupas',
          'itulah sebab pengobatan diteruskan sesudah kulit tampak bersih',
          '',
          'Kuku tumbuh 1 mm sebulan — inilah sebab jamur kuku kaki 12 pekan',
        ],
        memilih:
          'Oles untuk lesi terbatas. Telan bila mengenai kulit kepala, kuku, luas, atau berulang. Griseofulvin tetap pilihan pertama tinea kapitis pada anak dan harus diminum bersama makanan berlemak agar terserap.',
        salahnya:
          'Dihentikan begitu gatal hilang, sehingga kambuh berulang-ulang. Dan diberi krim gabungan berisi STEROID — gatalnya hilang cepat, jamurnya menyebar dengan tepi yang tidak lagi khas (tinea incognito), dan pengobatan berikutnya menjadi jauh lebih sulit.',
      },
    ],
  },

  {
    keluhan: 'Cacingan',
    inti:
      'Di daerah endemis, obat cacing bukan pengobatan perorangan melainkan tindakan masyarakat: seluruh anggota rumah diobati bersamaan, sebab mengobati satu orang di rumah yang sama berarti menunggu penularan ulang. Dan pada cacing tambang, memberi besi tanpa obat cacing tidak pernah menyelesaikan anemianya.',
    golongan: [
      {
        nama: 'Antihelmintik benzimidazol',
        contoh: 'Albendazol, mebendazol',
        dosis:
          'ALBENDAZOL 400 mg DOSIS TUNGGAL untuk askariasis, cacing tambang, dan cacing cambuk (anak 1-2 tahun 200 mg); untuk cacing cambuk berat 400 mg/hari selama 3 hari. CACING KREMI: albendazol 400 mg dosis tunggal, DIULANG 2 PEKAN kemudian, dan SELURUH ANGGOTA RUMAH diobati bersamaan. Mebendazol 500 mg dosis tunggal, atau 2x100 mg selama 3 hari. STRONGILOIDIASIS: ivermektin 200 µg/kgBB/hari selama 2 hari (pilihan pertama, bukan albendazol). SISTISERKOSIS dan hidatid: albendazol dosis tinggi berminggu-minggu di rumah sakit.',
        kapan:
          'Cacingan yang terbukti atau sangat mungkin; pemberian massal berkala pada anak di daerah endemis sesuai program setempat.',
        rantai: [
          'Benzimidazol mengikat beta-tubulin cacing',
          'mikrotubulus tidak dapat dirakit',
          'sel usus cacing kehilangan kemampuan menyerap GLUKOSA',
          '',
          'Cacing tidak mati seketika — ia kehabisan tenaga secara perlahan',
          'kehilangan pegangan pada dinding usus, lalu terbawa keluar',
          'itulah sebab cacing yang keluar utuh dan masih bergerak',
          '',
          'Afinitasnya terhadap tubulin cacing jauh melampaui tubulin manusia',
          'karena itu dosis tunggalnya sangat aman',
          '',
          'Telur cacing kremi bertahan di sprei, pakaian, dan kuku sampai 2-3 pekan',
          'inilah sebab pengulangan pada pekan kedua menentukan keberhasilannya',
        ],
        memilih:
          'Albendazol dosis tunggal untuk hampir semua cacing usus. Pirantel pamoat 10 mg/kgBB dosis tunggal sebagai pilihan pada kehamilan trimester 2-3. Prazikuantel 5-10 mg/kgBB dosis tunggal untuk cacing pita.',
        salahnya:
          'Hanya anak yang gatal duburnya yang diobati, sementara sprei tidak dicuci air panas, kuku tidak dipotong, dan anggota rumah lain tidak ikut — kambuhnya lalu disangka obatnya tidak manjur. Dan pada cacing tambang, besi diberikan tanpa obat cacing sehingga anemianya bertahan.',
      },
    ],
  },

  {
    keluhan: 'Kejang',
    inti:
      'Pada kejang yang sedang berlangsung, yang menentukan adalah WAKTU. Sesudah 5 menit kejang tidak akan berhenti sendiri, dan tiap menit berikutnya reseptor GABA ditarik dari sinaps sehingga obatnya justru makin kurang bekerja — inilah sebab obat pertama diberikan cepat dan dosisnya penuh, bukan dicicil.',
    golongan: [
      {
        nama: 'Benzodiazepin — obat pertama',
        contoh: 'Diazepam, lorazepam, midazolam',
        dosis:
          'DEWASA: diazepam 10 mg IV pelan (2 mg/menit), boleh diulang satu kali sesudah 5 menit; atau lorazepam 4 mg IV. TANPA JALUR VENA: midazolam 10 mg intramuskular, atau 10 mg di dalam pipi, atau diazepam 10 mg per rektal. ANAK: diazepam 0,2-0,3 mg/kgBB IV (maksimal 10 mg) atau REKTAL 5 mg untuk <10 kg dan 10 mg untuk >=10 kg; midazolam 0,2 mg/kgBB intramuskular atau intranasal.',
        kapan: 'Kejang yang berlangsung lebih dari 5 menit, atau kejang berulang tanpa sadar di antaranya.',
        rantai: [
          'Benzodiazepin memperbesar pengaruh GABA pada reseptor GABA-A',
          'kanal klorida lebih sering terbuka → neuron sukar tereksitasi',
          'lepas muatan yang menjalar padam',
          '',
          'Tetapi kejang yang berlangsung lama MENARIK reseptor GABA-A',
          'dari membran sinaps ke dalam sel (internalisasi)',
          'sasaran obatnya sendiri berkurang seiring waktu',
          '',
          'Bersamaan itu reseptor NMDA justru dipindahkan KE membran',
          'otak menjadi makin mudah tereksitasi dan makin sukar ditenangkan',
          '',
          'Inilah dasar biologis mengapa lima menit pertama menentukan,',
          'dan mengapa dosis yang dicicil hampir selalu gagal',
        ],
        memilih:
          'Lorazepam paling panjang mencegah kejang berulang. Diazepam paling tersedia. Midazolam intramuskular atau intranasal bila jalur vena belum ada — sama efektifnya dan lebih cepat disiapkan.',
        salahnya:
          'Dosisnya dikurangi karena takut penderita berhenti bernapas, lalu kejangnya berlanjut — dan kejang yang berlanjut jauh lebih berbahaya. Yang benar adalah memberi dosis penuh SAMBIL menyiapkan alat bantu napas.',
      },
      {
        nama: 'Antikejang lini kedua',
        contoh: 'Fenitoin, asam valproat, levetirasetam, fenobarbital',
        dosis:
          'Diberikan bila kejang menetap sesudah dua kali benzodiazepin. FENITOIN 20 mg/kgBB IV, kecepatan MAKSIMAL 50 mg/menit pada dewasa dan 1 mg/kgBB/menit pada anak — dilarutkan dalam NaCl 0,9% SAJA, tidak pernah dalam dekstrosa (mengendap), dengan pemantauan EKG. ASAM VALPROAT 40 mg/kgBB IV dalam 10 menit (maksimal 3000 mg). LEVETIRASETAM 60 mg/kgBB IV dalam 10 menit (maksimal 4500 mg) — paling sedikit efek sampingnya. FENOBARBITAL 20 mg/kgBB IV, kecepatan 50-100 mg/menit; pada NEONATUS ia yang menjadi lini pertama.',
        kapan: 'Status epileptikus yang tidak berhenti dengan benzodiazepin.',
        rantai: [
          'Fenitoin memperpanjang keadaan tidak aktif kanal natrium',
          'neuron tidak dapat melepaskan muatan berulang dengan cepat',
          'lepas muatan berfrekuensi tinggi padam tanpa menekan kesadaran',
          '',
          'Kecepatan suntik yang berlebihan menimbulkan HIPOTENSI dan ARITMIA',
          'sebagian besar karena pelarut propilen glikolnya',
          '',
          'Bila bocor ke luar vena, fenitoin menimbulkan nekrosis jaringan hebat',
          '(purple glove syndrome) — jalur vena yang besar dan mantap wajib',
          '',
          'Levetirasetam bekerja pada protein vesikel sinaps SV2A',
          'jalur yang sama sekali berbeda, tanpa mengganggu jantung dan tekanan darah',
        ],
        memilih:
          'Ketiganya (fenitoin, valproat, levetirasetam) sama efektifnya menurut penelitian pembanding; yang membedakan adalah keamanannya. Levetirasetam paling aman pada jantung dan hati. Valproat DIHINDARI pada perempuan usia subur dan pada kecurigaan penyakit metabolik. Fenobarbital pada neonatus.',
        salahnya:
          'Fenitoin dilarutkan dalam DEKSTROSA — ia mengendap dan menyumbat jalurnya. Dan disuntikkan terlalu cepat karena kejangnya belum berhenti, yang menimbulkan henti jantung.',
      },
      {
        nama: 'Yang dicari bersamaan — sebab yang dapat dikoreksi',
        contoh: 'Dekstrosa, tiamin, magnesium sulfat, kalsium glukonas, natrium',
        dosis:
          'GULA DARAH diperiksa pada menit pertama: bila rendah, dekstrosa 40% 25-50 mL IV pada dewasa (anak dekstrosa 10% 2 mL/kgBB), DIDAHULUI tiamin 100 mg IV pada peminum alkohol dan penderita kurang gizi. EKLAMPSIA: magnesium sulfat 4 g IV dalam 15-20 menit lalu 1 g/jam — di sini MgSO4, BUKAN diazepam, yang menjadi obat pilihan. HIPOKALSEMIA: kalsium glukonas 10% 10-20 mL IV pelan. HIPONATREMIA berat bergejala: NaCl 3% 100 mL dalam 10 menit, boleh diulang.',
        kapan: 'Pada SETIAP kejang, dicari bersamaan dengan memberi obat — bukan sesudahnya.',
        rantai: [
          'Kejang adalah GEJALA, dan sebagian sebabnya tidak akan menyerah',
          'pada antikejang mana pun sampai sebabnya sendiri dikoreksi',
          '',
          'Hipoglikemia: otak kehabisan bahan bakar; antikejang tidak memberinya gula',
          'Hiponatremia: sel otak membengkak; hanya natrium yang mengecilkannya',
          'Eklampsia: magnesium menstabilkan membran dan melebarkan pembuluh otak',
          '',
          'Pada peminum alkohol, dekstrosa TANPA tiamin lebih dahulu',
          'mencetuskan ensefalopati Wernicke — urutannya menentukan',
        ],
        memilih:
          'Gula darah kapiler pada menit pertama, selalu. Natrium, kalsium, magnesium, fungsi ginjal, dan suhu menyusul. Pada perempuan hamil atau baru melahirkan, eklampsia dianggap ada sampai terbukti tidak.',
        salahnya:
          'Seluruh perhatian tertuju pada memilih antikejang sementara GULA DARAH tidak pernah diperiksa. Dan kejang pada kehamilan diberi diazepam berulang, padahal magnesium sulfat yang terbukti dan yang menyelamatkan.',
      },
    ],
  },
]

/** Semua golongan, diratakan — untuk pencarian. */
export const SEMUA_GOLONGAN = OBAT_PER_KELUHAN.flatMap((k) =>
  k.golongan.map((g) => ({ ...g, keluhan: k.keluhan })),
)

export default OBAT_PER_KELUHAN
