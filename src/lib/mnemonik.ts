// ─────────────────────────────────────────────────────────────────────────────
// Jembatan keledai (mnemonik) untuk OSCE dan CBT.
//
// Dipisahkan dari catatan penyakit karena tujuannya berbeda. Catatan penyakit
// menjawab "apa yang benar"; mnemonik menjawab "bagaimana supaya tidak ada
// yang terlewat saat gugup di depan penguji". Keduanya tidak saling
// menggantikan: mnemonik tanpa isi menghasilkan hafalan kosong, dan isi tanpa
// mnemonik gugur satu per satu di bawah tekanan.
//
// BENTUK YANG DIPAKAI — mengikuti contoh status psikiatri yang diminta:
//   * satu akronim yang setiap hurufnya berdiri sendiri,
//   * kotak definisi singkat supaya akronimnya punya sandaran,
//   * bagian bernomor yang isinya butir-butir siap ucap,
//   * daftar "mengapa ini penting" di akhir.
//
// ATURAN ISI:
//   * Setiap huruf harus benar-benar dipakai di ujian maupun di klinik. Huruf
//     yang dipaksakan hanya demi kata yang enak diucapkan justru membebani.
//   * Dosis dan angka ditulis apa adanya, tidak dipendekkan. Mnemonik boleh
//     memampatkan URUTAN, tidak boleh memampatkan ANGKA.
//   * Tidak ada isi yang disalin dari materi berbayar mana pun; seluruhnya
//     disusun dari ajaran klinis baku yang sama dengan catatan penyakit.
// ─────────────────────────────────────────────────────────────────────────────

export interface Huruf {
  /** Satu huruf akronim. */
  huruf: string
  /** Kepanjangannya. */
  arti: string
  /** Penjelas satu kalimat — apa yang sebenarnya dikerjakan pada langkah ini. */
  isi: string
}

export interface Bagian {
  judul: string
  butir: string[]
}

export interface Mnemonik {
  /** Kunci URL-aman. */
  id: string
  /** Akronimnya, misalnya ASMTPCIJ. */
  akronim: string
  /** Judul yang dibantu diingat oleh akronim ini. */
  judul: string
  /** Kelompok, dipakai untuk penyaring. */
  kelompok: string
  /** Untuk apa dipakai: OSCE, CBT, atau keduanya. */
  untuk: 'OSCE' | 'CBT' | 'OSCE & CBT'
  /** Kotak definisi — sandaran sebelum menghafal hurufnya. */
  definisi: string
  huruf: Huruf[]
  /** Bagian bernomor. */
  bagian?: Bagian[]
  /** Daftar "mengapa ini penting". */
  penting?: string[]
  /** Jebakan yang sering membuat gugur. */
  jebakan?: string[]
}

export const MNEMONIK: Mnemonik[] = [
  // ─── Psikiatri ─────────────────────────────────────────────────────────────
  {
    id: 'status-mental',
    akronim: 'ASMTPCIJ',
    judul: 'Pemeriksaan Status Mental',
    kelompok: 'Psikiatri',
    untuk: 'OSCE & CBT',
    definisi:
      'Pemeriksaan status mental adalah pengamatan dan penilaian terstruktur terhadap keadaan jiwa pasien PADA SAAT WAWANCARA BERLANGSUNG — bukan riwayat perjalanan penyakitnya. Kedudukannya setara dengan pemeriksaan fisik pada cabang lain: yang dinilai adalah temuan saat ini, dicatat sebagaimana teramati.',
    huruf: [
      { huruf: 'A', arti: 'Aktivitas psikomotor dan penampilan', isi: 'Cara berpakaian, kerapian, perawatan diri, kontak mata, sikap terhadap pemeriksa, serta gerakan yang berlebihan maupun melambat.' },
      { huruf: 'S', arti: 'Sikap terhadap pemeriksa', isi: 'Kooperatif, bermusuhan, curiga, menarik diri, atau terlalu akrab — catat apa adanya, bukan tafsirannya.' },
      { huruf: 'M', arti: 'Mood dan afek', isi: 'Mood adalah perasaan yang DIKATAKAN pasien, afek adalah yang TERLIHAT oleh pemeriksa; nilai keserasian keduanya.' },
      { huruf: 'T', arti: 'Tilikan (insight)', isi: 'Sejauh mana pasien menyadari dirinya sakit dan memerlukan pengobatan; nyatakan dalam derajat 1 sampai 6.' },
      { huruf: 'P', arti: 'Proses dan isi pikir', isi: 'Proses: alur pikir runtut atau melompat. Isi: waham, obsesi, dan preokupasi.' },
      { huruf: 'C', arti: 'Cara bicara', isi: 'Kecepatan, kelantangan, jumlah, spontanitas, dan kelancaran bicara.' },
      { huruf: 'I', arti: 'Ilusi dan halusinasi', isi: 'Gangguan persepsi; tentukan panca indera mana yang terkena dan kapan munculnya.' },
      { huruf: 'J', arti: 'Judgment (daya nilai) dan kesadaran', isi: 'Kemampuan menimbang keadaan dan mengambil keputusan yang wajar, serta tingkat kesadaran dan orientasi terhadap waktu, tempat, dan orang.' },
    ],
    bagian: [
      {
        judul: 'Derajat tilikan yang wajib dihafal',
        butir: [
          'Derajat 1 — menyangkal sepenuhnya bahwa dirinya sakit',
          'Derajat 2 — sedikit menyadari sakit namun sekaligus menyangkalnya',
          'Derajat 3 — menyadari sakit namun menyalahkan orang lain, faktor luar, maupun hal jasmani',
          'Derajat 4 — menyadari sakit karena sesuatu yang tidak diketahuinya',
          'Derajat 5 — tilikan intelektual: memahami sakit dan sebabnya, namun belum mengubah perilaku',
          'Derajat 6 — tilikan sebenarnya: memahami sepenuhnya dan bersedia berobat',
        ],
      },
      {
        judul: 'Bedakan tiga gangguan persepsi',
        butir: [
          'Ilusi — ada rangsangan nyata namun ditafsirkan keliru; tali disangka ular',
          'Halusinasi — TIDAK ada rangsangan sama sekali; mendengar suara di ruangan sunyi',
          'Depersonalisasi dan derealisasi — merasa diri maupun lingkungan tidak nyata, tanpa gangguan persepsi indera',
        ],
      },
      {
        judul: 'Penapisan risiko yang tidak boleh terlewat',
        butir: [
          'TANYAKAN LANGSUNG mengenai keinginan bunuh diri — bertanya TIDAK menanamkan gagasan, dan tidak bertanya adalah kelalaian yang paling sering menggugurkan',
          'Gali rencana, cara, waktu, dan percobaan sebelumnya',
          'Tanyakan pula niat menyakiti orang lain',
          'Nilai dukungan keluarga dan siapa yang dapat mengawasi di rumah',
        ],
      },
    ],
    penting: [
      'Menilai keadaan jiwa saat ini secara sistematis sehingga tidak ada bagian yang terlewat',
      'Membedakan gangguan jiwa berat dari gangguan jiwa ringan sejak wawancara pertama',
      'Menentukan pasien mana yang perlu segera dirujuk dan mana yang dapat ditangani di fasilitas tingkat pertama',
      'Menyediakan patokan tertulis untuk menilai perbaikan maupun perburukan pada kunjungan berikutnya',
      'Menjadi dasar penilaian kemampuan pasien mengambil keputusan bagi dirinya sendiri',
    ],
    jebakan: [
      'Menuliskan tafsiran, bukan pengamatan — tulis "berbicara sambil menatap sudut ruangan", bukan "tampak berhalusinasi"',
      'Menukar mood dengan afek; mood dikatakan pasien, afek terlihat pemeriksa',
      'Melewatkan penapisan bunuh diri karena sungkan',
      'Menuliskan tilikan tanpa derajat',
    ],
  },

  // ─── Anamnesis umum ────────────────────────────────────────────────────────
  {
    id: 'socrates',
    akronim: 'SOCRATES',
    judul: 'Menggali Keluhan Nyeri',
    kelompok: 'Anamnesis',
    untuk: 'OSCE & CBT',
    definisi:
      'Kerangka delapan langkah untuk menggali setiap keluhan nyeri secara lengkap. Dipakai pada nyeri di bagian tubuh mana pun, dan pada OSCE hampir selalu menjadi tulang punggung penilaian anamnesis.',
    huruf: [
      { huruf: 'S', arti: 'Site — letak', isi: 'Minta pasien MENUNJUK dengan satu jari; letak yang ditunjuk sering berbeda dari yang diucapkan.' },
      { huruf: 'O', arti: 'Onset — awal mula', isi: 'Mendadak atau bertahap, sedang melakukan apa saat itu, dan sudah berapa lama.' },
      { huruf: 'C', arti: 'Character — sifat', isi: 'Tertusuk, tertekan, terbakar, kemeng, atau kolik — sifat nyeri mengarahkan pada organnya.' },
      { huruf: 'R', arti: 'Radiation — penjalaran', isi: 'Ke mana nyeri menjalar; penjalaran sering lebih menentukan daripada letak awalnya.' },
      { huruf: 'A', arti: 'Associations — gejala penyerta', isi: 'Mual, muntah, demam, sesak, keringat dingin — di sinilah tanda bahaya digali.' },
      { huruf: 'T', arti: 'Time course — perjalanan waktu', isi: 'Menetap, hilang timbul, memberat, atau ada pola waktu tertentu dalam sehari.' },
      { huruf: 'E', arti: 'Exacerbating & relieving', isi: 'Apa yang memperberat dan apa yang meringankan, termasuk obat yang sudah diminum.' },
      { huruf: 'S', arti: 'Severity — beratnya', isi: 'Skala 0-10, dan yang lebih penting: seberapa jauh mengganggu tidur, makan, dan pekerjaan.' },
    ],
    bagian: [
      {
        judul: 'Lanjutkan dengan RPD, RPK, RPO, RA',
        butir: [
          'Riwayat penyakit dahulu — penyakit menahun, operasi, dan rawat inap',
          'Riwayat penyakit keluarga — penyakit yang sama maupun yang berkaitan',
          'Riwayat pengobatan — termasuk obat bebas, JAMU, dan suplemen yang sering tidak dianggap obat oleh pasien',
          'Riwayat alergi — sebutkan obatnya dan BENTUK reaksinya, karena ruam berbeda tata laksananya dari anafilaksis',
        ],
      },
      {
        judul: 'Tutup anamnesis dengan tiga langkah',
        butir: [
          'Rangkum kembali kepada pasien dan minta ia membenarkan',
          'Tanyakan apakah ada hal lain yang ingin disampaikan',
          'Tanyakan apa yang pasien khawatirkan dan apa yang ia harapkan dari kunjungan ini',
        ],
      },
    ],
    penting: [
      'Menjamin tidak ada bagian keluhan yang terlewat meskipun pemeriksa sedang tergesa',
      'Menghasilkan urutan cerita yang runtut sehingga diagnosis banding tersusun dengan sendirinya',
      'Memberi tempat khusus untuk menggali tanda bahaya pada bagian gejala penyerta',
      'Menjadi kerangka yang sama untuk semua keluhan, sehingga tidak perlu menghafal urutan yang berbeda-beda',
    ],
    jebakan: [
      'Menanyakan seluruh huruf namun tidak pernah menanyakan apa yang pasien khawatirkan',
      'Melewatkan riwayat jamu dan obat bebas',
      'Menuliskan beratnya nyeri hanya sebagai angka tanpa dampaknya pada kegiatan',
    ],
  },

  // ─── Kegawatdaruratan ──────────────────────────────────────────────────────
  {
    id: 'abcde',
    akronim: 'ABCDE',
    judul: 'Penilaian Awal Pasien Gawat',
    kelompok: 'Kegawatdaruratan',
    untuk: 'OSCE & CBT',
    definisi:
      'Urutan penilaian dan penanganan pasien gawat yang dikerjakan MENURUT URUTAN dan tidak boleh dilompati. Prinsipnya: temukan masalah, atasi saat itu juga, baru lanjut ke huruf berikutnya. Kembali ke A setiap kali keadaan pasien berubah.',
    huruf: [
      { huruf: 'A', arti: 'Airway dengan kendali tulang leher', isi: 'Nilai kepatenan jalan napas; buka dengan angkat dagu, atau dorong rahang bila dicurigai cedera leher. Pasang penyangga leher pada trauma.' },
      { huruf: 'B', arti: 'Breathing', isi: 'Lihat, dengar, raba: laju napas, gerak dada, saturasi, dan suara napas kedua sisi. Berikan oksigen.' },
      { huruf: 'C', arti: 'Circulation dengan kendali perdarahan', isi: 'Nadi, tekanan darah, pengisian kapiler, akral. Hentikan perdarahan dengan penekanan langsung, pasang dua jalur intravena besar.' },
      { huruf: 'D', arti: 'Disability', isi: 'Kesadaran dengan AVPU maupun Skala Koma Glasgow, pupil, dan GULA DARAH — hipoglikemia adalah penyebab penurunan kesadaran yang dapat langsung diperbaiki.' },
      { huruf: 'E', arti: 'Exposure dan lingkungan', isi: 'Buka seluruh pakaian untuk memeriksa cedera tersembunyi, lalu SEGERA SELIMUTI kembali untuk mencegah kedinginan.' },
    ],
    bagian: [
      {
        judul: 'Tanda bahaya pada jalan napas',
        butir: [
          'Suara berkumur — ada cairan; lakukan pengisapan',
          'Mengorok — pangkal lidah jatuh; lakukan angkat dagu maupun dorong rahang',
          'Bunyi melengking saat menarik napas — penyempitan; siapkan jalan napas lanjut',
          'DIAM TANPA SUARA pada pasien yang sesak — sumbatan total; tindakan segera',
        ],
      },
      {
        judul: 'AVPU untuk menilai kesadaran dengan cepat',
        butir: [
          'A — Alert, sadar penuh',
          'V — respons terhadap suara',
          'P — respons terhadap nyeri',
          'U — Unresponsive, tidak ada respons',
        ],
      },
    ],
    penting: [
      'Mendahulukan yang paling cepat mematikan, sehingga pasien tidak meninggal karena hal yang sebenarnya dapat ditangani lebih dulu',
      'Memberi urutan yang sama bagi seluruh anggota tim sehingga tidak ada tumpang tindih maupun bagian yang terlewat',
      'Menyediakan titik kembali yang jelas — setiap perburukan berarti mulai lagi dari A',
      'Menjadikan penanganan dapat dikerjakan meskipun diagnosis belum diketahui sama sekali',
    ],
    jebakan: [
      'Melompat ke pemeriksaan yang menarik sebelum jalan napas diamankan',
      'Lupa memeriksa gula darah pada huruf D',
      'Membuka pakaian pasien lalu lupa menyelimutinya kembali',
      'Tidak mengulang dari A setelah pasien memburuk',
    ],
  },

  // ─── Kardiologi ────────────────────────────────────────────────────────────
  {
    id: 'nyeri-dada-mona',
    akronim: 'MONA-B',
    judul: 'Penanganan Awal Sindrom Koroner Akut',
    kelompok: 'Kardiologi',
    untuk: 'OSCE & CBT',
    definisi:
      'Langkah pertama pada nyeri dada yang dicurigai berasal dari jantung, dikerjakan bersamaan dengan perekaman elektrokardiografi dalam 10 MENIT PERTAMA sejak pasien datang.',
    huruf: [
      { huruf: 'M', arti: 'Morfin', isi: '2-4 mg intravena bila nyeri tidak mereda dengan nitrat; berikan dengan hati-hati karena menurunkan tekanan darah.' },
      { huruf: 'O', arti: 'Oksigen', isi: 'HANYA bila saturasi kurang dari 90 persen — oksigen rutin pada saturasi normal justru merugikan.' },
      { huruf: 'N', arti: 'Nitrat', isi: 'Nitrogliserin 0,4 mg sublingual, dapat diulang tiap 5 menit sampai tiga kali. DILARANG pada infark ventrikel kanan, tekanan darah rendah, dan pemakaian obat disfungsi ereksi dalam 24-48 jam.' },
      { huruf: 'A', arti: 'Aspirin', isi: 'Aspirin 160-320 mg DIKUNYAH, bukan ditelan utuh, agar cepat diserap. Inilah langkah tunggal yang paling menyelamatkan nyawa.' },
      { huruf: 'B', arti: 'Beta-blocker dan rujuk', isi: 'Penyekat beta peroral dalam 24 jam bila tidak ada pantangan; RUJUK SEGERA untuk tindakan pembukaan pembuluh.' },
    ],
    bagian: [
      {
        judul: 'Yang menentukan sebenarnya bukan obatnya',
        butir: [
          'ELEKTROKARDIOGRAFI 12 SADAPAN DALAM 10 MENIT PERTAMA — inilah yang menentukan seluruh langkah berikutnya',
          'Bila ada elevasi segmen ST, sasarannya adalah membuka pembuluh secepat mungkin: waktu adalah otot jantung',
          'Rekam pula sadapan kanan pada infark dinding bawah untuk mencari keterlibatan ventrikel kanan',
          'Nyeri ulu hati pada pasien berusia lanjut dengan faktor risiko WAJIB direkam elektrokardiografinya',
        ],
      },
    ],
    penting: [
      'Aspirin kunyah menurunkan angka kematian secara bermakna dan dapat diberikan di fasilitas tingkat pertama mana pun',
      'Mengingatkan bahwa oksigen tidak diberikan secara rutin, sebuah kebiasaan lama yang kini justru dianggap merugikan',
      'Menempatkan perekaman jantung sebagai langkah yang tidak boleh ditunda',
      'Menyusun langkah yang dapat dikerjakan sambil menunggu rujukan berjalan',
    ],
    jebakan: [
      'Memberi nitrat pada infark ventrikel kanan sehingga tekanan darah jatuh',
      'Memberi oksigen pada pasien dengan saturasi normal',
      'Menyuruh pasien menelan aspirin utuh',
      'Menunda perekaman jantung karena sibuk memasang jalur infus',
    ],
  },

  // ─── Obstetri ──────────────────────────────────────────────────────────────
  {
    id: 'perdarahan-pascasalin',
    akronim: '4T',
    judul: 'Sebab Perdarahan Pascasalin',
    kelompok: 'Obstetri',
    untuk: 'OSCE & CBT',
    definisi:
      'Empat sebab perdarahan setelah melahirkan, diperiksa MENURUT URUTAN karena disusun dari yang paling sering ke yang paling jarang. Perdarahan pascasalin adalah penyebab kematian ibu tertinggi di Indonesia.',
    huruf: [
      { huruf: 'T', arti: 'Tonus — atonia uteri', isi: 'Penyebab sekitar 70 persen kasus. Rahim teraba LEMBEK dan tidak berkontraksi. Segera lakukan pemijatan rahim dan berikan uterotonika.' },
      { huruf: 'T', arti: 'Trauma — robekan jalan lahir', isi: 'Rahim berkontraksi baik namun darah tetap mengalir. Periksa jalan lahir dengan penerangan yang cukup dan jahit robekannya.' },
      { huruf: 'T', arti: 'Tissue — sisa plasenta', isi: 'Periksa kelengkapan plasenta dan selaputnya; sisa jaringan menghalangi rahim berkontraksi. Lakukan pengeluaran sisa jaringan.' },
      { huruf: 'T', arti: 'Thrombin — gangguan pembekuan', isi: 'Darah tidak menggumpal, perdarahan merembes dari bekas suntikan. Perbaiki dengan produk darah.' },
    ],
    bagian: [
      {
        judul: 'Urutan tindakan pada atonia uteri',
        butir: [
          'Pemijatan rahim segera dan kosongkan kandung kemih',
          'Oksitosin 20-40 unit dalam 1000 mL kristaloid, ditetesikan cepat',
          'Metilergometrin 0,2 mg intramuskular — DILARANG pada tekanan darah tinggi dan preeklamsia',
          'Misoprostol 800 mikrogram melalui dubur',
          'Asam traneksamat 1 g intravena dalam 3 jam pertama — semakin dini semakin bermanfaat',
          'Kompresi bimanual, kondom kateter maupun balon rahim, lalu RUJUK dengan infus tetap terpasang',
        ],
      },
      {
        judul: 'Jangan lupa yang sederhana',
        butir: [
          'KANDUNG KEMIH YANG PENUH menghalangi rahim berkontraksi — kosongkan lebih dahulu, langkah paling mudah yang paling sering terlewat',
          'Pasang dua jalur intravena berukuran besar sejak awal',
          'Timbang pembalut untuk memperkirakan jumlah darah yang hilang, jangan menaksir dengan mata',
          'Nilai denyut nadi dan kesadaran; tekanan darah baru turun setelah kehilangan darah cukup banyak',
        ],
      },
    ],
    penting: [
      'Menyusun pemeriksaan dari sebab tersering ke terjarang sehingga waktu tidak terbuang',
      'Setiap huruf memiliki tindakan yang berbeda, sehingga menemukan sebabnya berarti langsung mengetahui tindakannya',
      'Dapat dijalankan seluruhnya di fasilitas tingkat pertama sambil menunggu rujukan',
      'Mengingatkan pada langkah sederhana yang sering terlewat seperti mengosongkan kandung kemih',
    ],
    jebakan: [
      'Memberikan metilergometrin pada ibu dengan preeklamsia',
      'Menaksir jumlah perdarahan dengan mata alih-alih menimbang',
      'Menunggu tekanan darah turun sebelum menyatakan syok',
      'Memijat rahim tanpa lebih dahulu mengosongkan kandung kemih',
    ],
  },

  // ─── Pediatri ──────────────────────────────────────────────────────────────
  {
    id: 'dehidrasi-anak',
    akronim: 'KUMAT',
    judul: 'Menilai Derajat Dehidrasi Anak',
    kelompok: 'Pediatri',
    untuk: 'OSCE & CBT',
    definisi:
      'Lima hal yang dinilai untuk menentukan derajat dehidrasi pada anak dengan diare. Yang menentukan keselamatan pada diare bukanlah kumannya, melainkan cairan yang hilang — karena itu penilaian ini didahulukan sebelum mencari penyebab.',
    huruf: [
      { huruf: 'K', arti: 'Keadaan umum', isi: 'Sadar dan tenang, gelisah dan rewel, atau lesu sampai tidak sadar.' },
      { huruf: 'U', arti: 'Ubun-ubun dan mata', isi: 'Ubun-ubun besar cekung pada bayi, mata cekung, dan air mata berkurang saat menangis.' },
      { huruf: 'M', arti: 'Minum', isi: 'Minum biasa, haus dan minum dengan lahap, atau tidak mampu minum sama sekali.' },
      { huruf: 'A', arti: 'Air mata dan mulut', isi: 'Selaput lendir mulut dan lidah kering, air mata tidak keluar.' },
      { huruf: 'T', arti: 'Turgor kulit', isi: 'Cubitan kulit perut kembali cepat, lambat, atau sangat lambat lebih dari 2 detik.' },
    ],
    bagian: [
      {
        judul: 'Tiga derajat menurut WHO dan tindakannya',
        butir: [
          'TANPA DEHIDRASI — rencana A: teruskan makan dan minum, oralit setiap kali buang air besar cair, zink 10-14 hari',
          'DEHIDRASI RINGAN-SEDANG — rencana B: oralit 75 mL/kg dalam 3 jam di fasilitas kesehatan, lalu nilai ulang',
          'DEHIDRASI BERAT — rencana C: Ringer laktat 100 mL/kg intravena; bayi kurang dari 12 bulan 30 mL/kg dalam 1 jam lalu 70 mL/kg dalam 5 jam; anak lebih besar 30 mL/kg dalam 30 menit lalu 70 mL/kg dalam 2,5 jam',
        ],
      },
      {
        judul: 'Yang selalu diberikan pada setiap diare anak',
        butir: [
          'ZINK 20 mg per hari, 10 mg bila kurang dari 6 bulan, SELAMA 10-14 HARI meskipun diare sudah berhenti',
          'ORALIT osmolaritas rendah setiap kali buang air besar cair',
          'TERUSKAN pemberian air susu ibu dan makanan — memuasakan anak memperlambat pemulihan usus',
          'Edukasi tanda bahaya kepada orang tua',
          'Antibiotik HANYA bila ada darah pada tinja maupun kecurigaan kolera',
        ],
      },
    ],
    penting: [
      'Menempatkan penilaian cairan di depan pencarian kuman, sesuai dengan apa yang sesungguhnya mematikan',
      'Menghubungkan derajat langsung dengan rencana pengobatan A, B, atau C',
      'Mengingatkan zink yang sangat sering terlupa padahal menurunkan kekambuhan berbulan-bulan sesudahnya',
      'Dapat dikerjakan tanpa alat apa pun, hanya dengan mata dan tangan',
    ],
    jebakan: [
      'Lupa memberikan zink',
      'Menghentikan makan dan air susu ibu selama diare',
      'Memberikan antibiotik pada diare cair tanpa darah',
      'Menilai turgor pada anak dengan gizi buruk maupun kegemukan, yang hasilnya menyesatkan',
    ],
  },

  // ─── Neurologi ─────────────────────────────────────────────────────────────
  {
    id: 'stroke-fast',
    akronim: 'FAST',
    judul: 'Mengenali Stroke dengan Cepat',
    kelompok: 'Neurologi',
    untuk: 'OSCE & CBT',
    definisi:
      'Empat langkah untuk mengenali stroke dalam hitungan detik, cukup sederhana untuk diajarkan kepada keluarga pasien. Pada stroke, setiap menit yang terbuang berarti jutaan sel saraf mati — waktu adalah otak.',
    huruf: [
      { huruf: 'F', arti: 'Face — wajah', isi: 'Minta pasien tersenyum; perhatikan apakah satu sisi wajah tertinggal.' },
      { huruf: 'A', arti: 'Arm — lengan', isi: 'Minta mengangkat kedua lengan; perhatikan apakah satu lengan jatuh.' },
      { huruf: 'S', arti: 'Speech — bicara', isi: 'Minta mengulang satu kalimat; perhatikan pelo, kacau, maupun tidak dapat bicara.' },
      { huruf: 'T', arti: 'Time — waktu', isi: 'CATAT JAM TERAKHIR PASIEN TERLIHAT NORMAL, bukan jam ditemukannya; angka inilah yang menentukan boleh tidaknya obat penghancur bekuan.' },
    ],
    bagian: [
      {
        judul: 'Yang wajib dikerjakan sebelum merujuk',
        butir: [
          'Periksa GULA DARAH — hipoglikemia dapat menyerupai stroke secara sempurna dan langsung membaik bila dikoreksi',
          'Amankan jalan napas dan berikan oksigen bila saturasi kurang dari 94 persen',
          'JANGAN menurunkan tekanan darah secara agresif; pada stroke tekanan darah yang tinggi sebagian merupakan upaya tubuh mempertahankan aliran ke otak',
          'Puasakan sampai kemampuan menelan dinilai — memberi minum pada pasien stroke berisiko tersedak',
          'RUJUK SEGERA ke fasilitas dengan pencitraan kepala; obat penghancur bekuan memiliki tenggat 4,5 jam',
        ],
      },
    ],
    penting: [
      'Cukup sederhana untuk diajarkan kepada keluarga sehingga pasien datang lebih cepat',
      'Tidak memerlukan alat apa pun',
      'Menempatkan pencatatan waktu sebagai bagian dari pemeriksaan, bukan sekadar catatan administratif',
      'Mengingatkan bahwa hipoglikemia adalah penyerupa yang wajib disingkirkan',
    ],
    jebakan: [
      'Mencatat jam ditemukan, bukan jam terakhir terlihat normal',
      'Menurunkan tekanan darah dengan tergesa',
      'Memberi minum sebelum menilai kemampuan menelan',
      'Lupa memeriksa gula darah',
    ],
  },

  // ─── Pulmonologi ───────────────────────────────────────────────────────────
  {
    id: 'tb-oat',
    akronim: 'RHZE',
    judul: 'Paduan Obat Tuberkulosis Lini Pertama',
    kelompok: 'Pulmonologi',
    untuk: 'OSCE & CBT',
    definisi:
      'Empat obat pada fase awal pengobatan tuberkulosis, diberikan setiap hari selama 2 bulan, dilanjutkan RH selama 4 bulan. Ditulis 2RHZE/4RH.',
    huruf: [
      { huruf: 'R', arti: 'Rifampisin 10 mg/kg', isi: 'Efek samping khas: air kencing, air mata, dan keringat BERWARNA MERAH JINGGA. Terangkan lebih dahulu agar pasien tidak berhenti minum obat karena panik.' },
      { huruf: 'H', arti: 'Isoniazid 5 mg/kg', isi: 'Efek samping: kerusakan saraf tepi berupa kesemutan, dicegah dengan piridoksin 10-25 mg per hari; dapat pula merusak hati.' },
      { huruf: 'Z', arti: 'Pirazinamid 25 mg/kg', isi: 'Efek samping: menaikkan asam urat sehingga timbul nyeri sendi; juga membebani hati.' },
      { huruf: 'E', arti: 'Etambutol 15 mg/kg', isi: 'Efek samping: GANGGUAN SARAF MATA dengan penglihatan kabur dan sulit membedakan warna merah hijau. Periksa ketajaman penglihatan sebelum memulai.' },
    ],
    bagian: [
      {
        judul: 'Cara mengingat efek samping — satu organ untuk satu huruf',
        butir: [
          'R — warna merah pada cairan tubuh',
          'H — saraf tepi, dicegah piridoksin',
          'Z — sendi, karena asam urat naik',
          'E — mata, warna merah hijau',
          'R, H, dan Z ketiganya membebani hati; E tidak',
        ],
      },
      {
        judul: 'Dosis kombinasi tetap menurut berat badan',
        butir: [
          '30-37 kg — 2 tablet sekali sehari',
          '38-54 kg — 3 tablet sekali sehari',
          '55-70 kg — 4 tablet sekali sehari',
          'Lebih dari 70 kg — 5 tablet sekali sehari',
          'Diminum sekali sehari saat perut kosong',
        ],
      },
      {
        judul: 'Yang menentukan keberhasilan bukan obatnya',
        butir: [
          'PENGAWAS MENELAN OBAT — penentu terbesar, jauh melampaui pemilihan obat',
          'Pemeriksaan dahak ulang pada akhir bulan ke-2, ke-5, dan akhir pengobatan',
          'Dahak masih positif pada bulan ke-5 berarti gagal dan menuntut uji kepekaan serta rujukan',
          'Kekebalan terhadap rifampisin pada tes cepat molekuler berarti resistan obat — RUJUK, jangan memulai paduan lini pertama',
          'Tawarkan uji HIV kepada setiap penderita tuberkulosis',
        ],
      },
    ],
    penting: [
      'Memastikan keempat obat fase awal disebutkan lengkap beserta dosisnya',
      'Menghubungkan setiap obat dengan satu efek samping khas sehingga mudah diingat dan mudah dipantau',
      'Mengingatkan pemeriksaan mata sebelum etambutol dan piridoksin bersama isoniazid',
      'Menempatkan pengawas menelan obat sebagai bagian dari resep, bukan sekadar anjuran',
    ],
    jebakan: [
      'Lupa menerangkan air kencing berwarna merah sehingga pasien berhenti minum obat',
      'Lupa memberikan piridoksin pada pasien berisiko kerusakan saraf tepi',
      'Memulai paduan lini pertama padahal tes cepat molekuler menunjukkan kekebalan rifampisin',
      'Menghentikan seluruh obat karena kesemutan, padahal cukup ditambah piridoksin',
    ],
  },

  // ─── Penyakit dalam ────────────────────────────────────────────────────────
  {
    id: 'sepsis-hour-one',
    akronim: 'BUCKLE',
    judul: 'Satu Jam Pertama Sepsis',
    kelompok: 'Kegawatdaruratan',
    untuk: 'OSCE & CBT',
    definisi:
      'Enam tindakan yang harus selesai dalam SATU JAM PERTAMA sejak sepsis dikenali. Setiap jam keterlambatan pemberian antibiotik pada syok septik menaikkan angka kematian secara bermakna.',
    huruf: [
      { huruf: 'B', arti: 'Blood culture — kultur darah', isi: 'Ambil kultur darah SEBELUM antibiotik, namun jangan sampai menunda antibiotiknya.' },
      { huruf: 'U', arti: 'Urine output — pantau produksi urin', isi: 'Pasang kateter dan pantau; kurang dari 0,5 mL/kg per jam menandakan perfusi yang buruk.' },
      { huruf: 'C', arti: 'Cairan kristaloid', isi: '30 mL/kg dalam 3 jam pertama, dinilai ulang berulang kali agar tidak berlebihan.' },
      { huruf: 'K', arti: 'Kadar laktat', isi: 'Periksa laktat; nilai lebih dari 2 mmol/L menandakan gangguan perfusi jaringan, dan diulang setelah resusitasi.' },
      { huruf: 'L', arti: 'Lawan kumannya — antibiotik', isi: 'Antibiotik spektrum luas DALAM SATU JAM PERTAMA; jangan menunggu hasil kultur.' },
      { huruf: 'E', arti: 'Ekstra — vasopresor', isi: 'Norepinefrin bila tekanan arteri rata-rata tetap kurang dari 65 mmHg setelah cairan memadai.' },
    ],
    bagian: [
      {
        judul: 'Mengenali sepsis dengan qSOFA di fasilitas tingkat pertama',
        butir: [
          'Laju napas 22 kali per menit atau lebih',
          'Perubahan kesadaran',
          'Tekanan darah sistolik 100 mmHg atau kurang',
          'Dua dari tiga menandakan risiko tinggi dan menuntut penanganan segera serta rujukan',
        ],
      },
      {
        judul: 'Cari sumber infeksinya',
        butir: [
          'Paru, saluran kemih, perut, kulit dan jaringan lunak, serta susunan saraf pusat adalah lima sumber tersering',
          'Sumber yang dapat dikendalikan seperti abses dan sumbatan saluran empedu harus segera ditangani — antibiotik saja tidak menyelesaikan',
          'Periksa seluruh tubuh termasuk punggung dan sela paha; luka tekan sering terlewat',
        ],
      },
    ],
    penting: [
      'Mengubah penanganan sepsis dari serangkaian keputusan menjadi daftar periksa berbatas waktu',
      'Menempatkan antibiotik dalam satu jam pertama sebagai sasaran yang terukur',
      'Mengingatkan bahwa kultur diambil sebelum antibiotik namun tidak boleh menundanya',
      'Menghubungkan penilaian awal dengan pemantauan yang berkelanjutan melalui produksi urin dan laktat',
    ],
    jebakan: [
      'Menunda antibiotik karena menunggu kultur maupun hasil laboratorium',
      'Memberikan cairan terus-menerus tanpa menilai ulang sehingga terjadi kelebihan cairan',
      'Lupa mencari dan mengendalikan sumber infeksinya',
      'Menyatakan pasien membaik hanya karena tekanan darah naik, tanpa menilai produksi urin dan laktat',
    ],
  },

  // ─── Farmakologi ───────────────────────────────────────────────────────────
  {
    id: 'resep-lengkap',
    akronim: 'SUBTITUSI',
    judul: 'Menulis Resep yang Lengkap',
    kelompok: 'Farmakologi',
    untuk: 'OSCE',
    definisi:
      'Bagian-bagian resep yang wajib ada. Pada OSCE, resep yang isinya benar namun kehilangan satu bagian tetap kehilangan nilai — dan di klinik, bagian yang hilang itulah yang menimbulkan kesalahan pemberian obat.',
    huruf: [
      { huruf: 'S', arti: 'Superscriptio', isi: 'Identitas dokter, alamat, nomor surat izin praktik, tanggal, dan tanda R/ pada setiap obat.' },
      { huruf: 'U', arti: 'Uraian obat (inscriptio)', isi: 'Nama obat, bentuk sediaan, dan kekuatannya.' },
      { huruf: 'B', arti: 'Banyaknya (subscriptio)', isi: 'Jumlah yang diminta, ditulis dengan angka dan sebaiknya diperjelas dengan huruf.' },
      { huruf: 'T', arti: 'Tanda pakai (signatura)', isi: 'Aturan pakai yang jelas: berapa kali sehari, berapa banyak, kapan, dan berapa lama.' },
      { huruf: 'I', arti: 'Identitas pasien', isi: 'Nama, umur, berat badan pada anak, dan alamat.' },
      { huruf: 'T', arti: 'Tanda tangan', isi: 'Paraf maupun tanda tangan dokter pada setiap resep.' },
      { huruf: 'U', arti: 'Ulangi bila perlu (iter)', isi: 'Keterangan boleh tidaknya resep diulang, ditulis bila diperlukan.' },
      { huruf: 'S', arti: 'Segera bila mendesak (cito)', isi: 'Tanda cito maupun statim untuk obat yang harus segera disiapkan.' },
      { huruf: 'I', arti: 'Isi penutup', isi: 'Tanda penutup setelah obat terakhir agar tidak dapat ditambahi orang lain.' },
    ],
    bagian: [
      {
        judul: 'Kesalahan penulisan yang berbahaya',
        butir: [
          'JANGAN memakai singkatan yang mudah keliru; tulis "unit" dengan lengkap, bukan "U" yang mudah terbaca sebagai angka nol',
          'JANGAN menulis titik nol di belakang angka — tulis 5 mg, bukan 5,0 mg yang dapat terbaca 50 mg',
          'SELALU tulis angka nol di depan koma — tulis 0,5 mg, bukan ,5 mg yang dapat terbaca 5 mg',
          'Tulis dosis anak berdasarkan berat badan dan cantumkan berat badannya',
          'Tulis nama obat dengan lengkap dan jelas; nama yang mirip adalah sumber kesalahan yang sering',
        ],
      },
    ],
    penting: [
      'Menjamin resep dapat dilayani apoteker tanpa perlu menebak maksud penulisnya',
      'Menutup celah penambahan obat oleh pihak lain melalui tanda penutup',
      'Menjadikan aturan pakai cukup jelas sehingga pasien tidak salah meminum obat',
      'Memenuhi syarat hukum sebuah resep sebagai dokumen',
    ],
    jebakan: [
      'Menulis aturan pakai tanpa lama pemberian',
      'Lupa mencantumkan berat badan pada resep anak',
      'Memakai singkatan yang mudah disalahbaca',
      'Lupa membubuhkan tanda tangan',
    ],
  },
]

/** Kelompok yang ada, untuk penyaring. */
export const KELOMPOK_MNEMONIK = Array.from(new Set(MNEMONIK.map((m) => m.kelompok))).sort()
