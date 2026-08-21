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
]

/** Semua golongan, diratakan — untuk pencarian. */
export const SEMUA_GOLONGAN = OBAT_PER_KELUHAN.flatMap((k) =>
  k.golongan.map((g) => ({ ...g, keluhan: k.keluhan })),
)

export default OBAT_PER_KELUHAN
