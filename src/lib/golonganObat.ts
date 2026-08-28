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
]

/** Semua golongan, diratakan — untuk pencarian. */
export const SEMUA_GOLONGAN = OBAT_PER_KELUHAN.flatMap((k) =>
  k.golongan.map((g) => ({ ...g, keluhan: k.keluhan })),
)

export default OBAT_PER_KELUHAN
