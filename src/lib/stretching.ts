// ─────────────────────────────────────────────────────────────────────────────
// Peregangan yang benar, per kelompok otot.
//
// Kenapa file ini ada: bagian "Koreksi Postur" di Latihan Dasar menyebut otot
// mana yang perlu diregangkan, tetapi tidak pernah mengajarkan CARANYA. Padahal
// peregangan adalah bagian yang paling sering dikerjakan dengan salah — bukan
// karena orang malas, melainkan karena empat hal berikut hampir tidak pernah
// disampaikan:
//
//   1. WAKTUNYA. Peregangan statis yang ditahan lama SEBELUM latihan menurunkan
//      kekuatan dan daya ledak untuk sementara. Pemanasan seharusnya dinamis;
//      peregangan statis tempatnya sesudah latihan atau sebagai sesi tersendiri.
//
//   2. DOSISNYA. Satu tarikan sepuluh detik tidak mengubah apa pun. Yang
//      menentukan pertambahan lingkup gerak adalah TOTAL WAKTU per otot per
//      minggu, dan ambangnya jauh lebih besar daripada yang diduga orang.
//
//   3. RASANYA. Peregangan yang benar terasa sebagai tarikan yang dapat
//      ditoleransi, bukan nyeri. Nyeri tajam adalah tanda berhenti, bukan tanda
//      berhasil — dan "no pain no gain" adalah nasihat yang keliru di sini.
//
//   4. OTOT YANG TERASA TEGANG BELUM TENTU OTOT YANG MEMENDEK. Otot yang lemah
//      dan tertarik memanjang juga menimbulkan rasa kencang. Meregangkannya
//      lebih jauh justru memperburuk keadaan. Ini penyebab tersering peregangan
//      yang dikerjakan rajin bertahun-tahun tanpa hasil.
//
// Seluruh isi di sini bersifat edukasi latihan untuk orang sehat, bukan terapi
// untuk cedera maupun nyeri yang sedang berlangsung.
// ─────────────────────────────────────────────────────────────────────────────

export type Wilayah = 'atas' | 'inti' | 'bawah'

export interface Stretch {
  nama: string
  /** Otot yang benar-benar disasar. */
  otot: string
  /** Langkah posisi, berurutan. */
  posisi: string[]
  /** Di mana tarikan seharusnya terasa — pembeda gerakan benar dan salah. */
  terasaDi: string
  /** Kesalahan tersering pada gerakan ini. */
  salah: string
  durasi: string
  /** Peringatan khusus bila ada. */
  hatiHati?: string
}

export interface MuscleGroup {
  key: string
  nama: string
  ikon: string
  wilayah: Wilayah
  /** Kenapa kelompok otot ini memendek pada orang kebanyakan. */
  kenapaTegang: string
  /** Akibatnya bila dibiarkan — menghubungkan ke postur maupun performa. */
  akibat: string
  stretches: Stretch[]
}

// ─── Kelompok otot ──────────────────────────────────────────────────────────

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: 'leher',
    nama: 'Leher & Bahu Atas',
    ikon: '🦴',
    wilayah: 'atas',
    kenapaTegang:
      'Kepala orang dewasa beratnya sekitar 5 kilogram bila tegak. Setiap 2,5 sentimeter kepala maju ke depan, beban efektif yang harus ditahan otot leher belakang bertambah kira-kira sebesar berat kepala itu sendiri. Menunduk ke layar, ke berkas, maupun ke lapangan operasi selama berjam-jam membuat trapezius atas dan levator scapulae bekerja menahan beban itu tanpa henti.',
    akibat:
      'Rasa pegal menetap di pundak, nyeri kepala yang berasal dari leher, dan bahu yang terangkat ke arah telinga sepanjang hari tanpa disadari.',
    stretches: [
      {
        nama: 'Peregangan trapezius atas',
        otot: 'Trapezius atas',
        posisi: [
          'Duduk tegak, pegang sisi bawah kursi dengan tangan kanan agar bahu kanan tidak ikut naik',
          'Miringkan kepala ke kiri, telinga kiri mendekat ke bahu kiri',
          'Tambahkan tarikan sangat ringan dengan tangan kiri di atas kepala — beratnya tangan saja sudah cukup',
        ],
        terasaDi: 'Sisi samping leher kanan sampai ke atas pundak',
        salah: 'Menarik kepala dengan kuat. Otot ini kecil dan dekat dengan saraf; tarikan keras tidak menambah hasil dan justru memicu nyeri kepala.',
        durasi: '30 detik tiap sisi, 2-3 kali',
      },
      {
        nama: 'Peregangan levator scapulae',
        otot: 'Levator scapulae',
        posisi: [
          'Duduk tegak, tangan kanan memegang kursi',
          'Putar kepala 45° ke kiri seolah melihat ke saku celana kiri',
          'Tundukkan kepala ke arah itu sampai terasa tarikan di sudut leher belakang kanan',
        ],
        terasaDi: 'Sudut antara leher dan pundak kanan, lebih ke belakang daripada trapezius',
        salah: 'Menundukkan kepala lurus ke depan tanpa memutarnya lebih dulu — itu meregangkan otot lain, bukan levator scapulae. Perputaran 45° inilah kuncinya.',
        durasi: '30 detik tiap sisi, 2-3 kali',
      },
      {
        nama: 'Chin tuck',
        otot: 'Suboksipital (regangkan) dan fleksor leher dalam (kuatkan)',
        posisi: [
          'Duduk atau berdiri tegak, pandangan lurus ke depan',
          'Tarik dagu lurus ke belakang seperti membuat dagu berlipat, tanpa menunduk',
          'Tahan 5 detik lalu lepaskan',
        ],
        terasaDi: 'Tarikan ringan di belakang pangkal tengkorak, sekaligus otot di depan leher bekerja',
        salah: 'Menganggap ini gerakan menunduk. Dagu bergerak MUNDUR mendatar, bukan turun. Gerakan ini sekaligus menguatkan otot yang lemah, sehingga boleh dikerjakan berkali-kali sehari.',
        durasi: '10 kali tahan 5 detik, beberapa kali sehari',
      },
    ],
  },
  {
    key: 'dada',
    nama: 'Dada & Depan Bahu',
    ikon: '🫁',
    wilayah: 'atas',
    kenapaTegang:
      'Hampir semua kegiatan sehari-hari terjadi di depan tubuh: menulis, mengetik, memegang telepon, menjahit luka, mendorong. Pectoralis major dan terutama pectoralis minor menetap dalam posisi memendek selama berjam-jam, sementara tidak ada satu pun kegiatan harian yang memanjangkannya kembali.',
    akibat:
      'Bahu tertarik ke depan, belikat terputar sehingga rongga di bawah tulang selangka menyempit, dan lama-kelamaan mengangkat lengan ke atas kepala menjadi terbatas serta nyeri.',
    stretches: [
      {
        nama: 'Peregangan dada di kusen pintu',
        otot: 'Pectoralis major',
        posisi: [
          'Berdiri di kusen pintu, tekuk siku 90° dan tempelkan lengan bawah pada kusen',
          'Atur tinggi siku SEJAJAR BAHU untuk serat tengah',
          'Langkahkan satu kaki ke depan dan pindahkan berat badan perlahan sampai terasa tarikan',
        ],
        terasaDi: 'Melintang di depan dada, bukan di dalam sendi bahu',
        salah: 'Mendorong sampai terasa di sendi bahu bagian depan. Itu bukan peregangan otot melainkan penarikan kapsul sendi, dan berulang kali dilakukan dapat membuat sendi bahu terlalu longgar ke depan.',
        durasi: '30 detik tiap posisi, 2-3 kali',
        hatiHati: 'Hentikan bila timbul kesemutan maupun rasa baal menjalar ke lengan — itu tanda pembuluh dan saraf ikut tertekan, bukan tanda peregangan berhasil.',
      },
      {
        nama: 'Peregangan pectoralis minor (siku tinggi)',
        otot: 'Pectoralis minor',
        posisi: [
          'Posisi sama di kusen pintu, tetapi siku diangkat lebih tinggi daripada bahu',
          'Condongkan badan maju sedikit saja',
        ],
        terasaDi: 'Lebih dalam dan lebih ke atas, dekat tulang selangka',
        salah: 'Melewatkan variasi ini. Pectoralis minor melekat pada belikat, sehingga justru otot inilah yang paling langsung menarik bahu ke depan — dan ia tidak teregang pada posisi siku sejajar bahu.',
        durasi: '30 detik tiap sisi, 2-3 kali',
      },
    ],
  },
  {
    key: 'punggung-atas',
    nama: 'Punggung Atas & Latissimus',
    ikon: '🔙',
    wilayah: 'atas',
    kenapaTegang:
      'Punggung atas (torakal) dirancang untuk berputar dan menegak, namun duduk membungkuk menguncinya dalam posisi melengkung ke depan. Latissimus dorsi yang membentang dari lengan atas sampai panggul ikut memendek dan menarik lengan berputar ke dalam.',
    akibat:
      'Punggung atas yang kaku memaksa leher dan bahu bergerak berlebihan sebagai gantinya. Banyak nyeri bahu sebenarnya berasal dari punggung atas yang tidak bisa menegak, bukan dari bahunya sendiri.',
    stretches: [
      {
        nama: 'Ekstensi torakal di sandaran kursi',
        otot: 'Sendi dan otot punggung atas',
        posisi: [
          'Duduk, letakkan sandaran kursi tepat di bawah tulang belikat',
          'Sanggah kepala dengan kedua tangan agar leher tidak menahan beban',
          'Lengkungkan punggung atas ke belakang melewati sandaran, tanpa melengkungkan pinggang',
        ],
        terasaDi: 'Terbuka di punggung atas dan depan dada',
        salah: 'Melengkung dari pinggang, bukan dari punggung atas. Pinggang memang lebih mudah melengkung, tetapi itulah bagian yang justru tidak perlu ditambah lengkungannya.',
        durasi: '5-8 kali gerakan lambat, atau tahan 20-30 detik',
      },
      {
        nama: 'Open book (rotasi berbaring miring)',
        otot: 'Rotasi punggung atas',
        posisi: [
          'Berbaring miring, kedua lutut ditekuk 90° dan ditumpuk, kedua lengan lurus ke depan bertumpuk',
          'Buka lengan atas ke sisi berlawanan seperti membuka buku, ikuti dengan pandangan mata',
          'Jaga kedua lutut tetap menempel satu sama lain dan tetap di lantai',
        ],
        terasaDi: 'Putaran di punggung atas dan tarikan di dada',
        salah: 'Membiarkan lutut ikut terbuka. Begitu lutut lepas, putarannya berpindah ke pinggang dan punggung atas tidak mendapat apa pun.',
        durasi: '8-10 kali tiap sisi, gerakan lambat',
      },
      {
        nama: 'Peregangan latissimus dorsi',
        otot: 'Latissimus dorsi dan teres major',
        posisi: [
          'Berlutut di depan kursi maupun meja rendah, letakkan kedua siku di atasnya',
          'Dudukkan bokong ke arah tumit sambil membiarkan dada turun ke bawah',
          'Putar telapak tangan menghadap ke atas untuk menambah tarikan',
        ],
        terasaDi: 'Sepanjang sisi badan dari ketiak sampai pinggang',
        salah: 'Melengkungkan pinggang untuk menambah tarikan. Kencangkan perut ringan supaya tarikan tetap jatuh pada latissimus.',
        durasi: '30 detik, 2-3 kali',
      },
    ],
  },
  {
    key: 'pinggul-depan',
    nama: 'Pinggul Depan (Hip Flexor)',
    ikon: '🦵',
    wilayah: 'inti',
    kenapaTegang:
      'Duduk menempatkan otot iliopsoas dalam posisi memendek selama seluruh waktu duduk. Pada koas dan pekerja meja, ini bisa berarti delapan sampai dua belas jam sehari. Otot ini melekat langsung pada ruas tulang belakang pinggang, sehingga pemendekannya menarik panggul berputar ke depan.',
    akibat:
      'Panggul menungging ke depan, pinggang melengkung berlebihan dan terasa pegal saat berdiri lama, bokong sulit bekerja penuh, dan langkah lari menjadi pendek karena tungkai tidak bisa mendorong ke belakang.',
    stretches: [
      {
        nama: 'Peregangan hip flexor berlutut',
        otot: 'Iliopsoas dan rectus femoris',
        posisi: [
          'Berlutut satu kaki, kaki depan menapak dengan lutut 90°',
          'KENCANGKAN BOKONG sisi kaki yang berlutut lebih dahulu — ini yang membuat panggul berputar ke belakang',
          'Dorong panggul ke depan sedikit saja, dada tetap tegak',
          'Untuk menambah tarikan pada rectus femoris, tekuk lutut belakang dengan memegang pergelangan kaki',
        ],
        terasaDi: 'Depan pangkal paha sisi kaki yang berlutut',
        salah:
          'Melangkah jauh ke depan sambil membiarkan pinggang melengkung. Bila pinggang melengkung, panggul ikut maju dan otot yang dituju sama sekali tidak memanjang — yang teregang hanyalah ruas pinggang. Mengencangkan bokong lebih dahulu adalah langkah yang membedakan gerakan ini berhasil atau sia-sia.',
        durasi: '30-45 detik tiap sisi, 2-3 kali',
      },
      {
        nama: 'Peregangan 90/90 duduk',
        otot: 'Rotator pinggul dalam',
        posisi: [
          'Duduk di lantai, kaki depan ditekuk 90° di depan badan, kaki belakang ditekuk 90° di samping',
          'Jaga punggung tegak, condongkan badan ke depan di atas tungkai depan',
        ],
        terasaDi: 'Dalam pinggul sisi tungkai depan',
        salah: 'Membungkukkan punggung untuk mencapai lebih jauh. Kedalaman tidak menentukan apa pun bila punggung yang membungkuk.',
        durasi: '30 detik tiap sisi',
      },
    ],
  },
  {
    key: 'bokong',
    nama: 'Bokong & Piriformis',
    ikon: '🍑',
    wilayah: 'inti',
    kenapaTegang:
      'Duduk lama menekan otot bokong secara langsung sekaligus membuatnya jarang berkontraksi. Piriformis yang terletak di bawah gluteus maximus memendek, dan pada sebagian orang saraf skiatik berjalan tepat melewati maupun menembus otot ini.',
    akibat:
      'Nyeri tumpul di bokong yang memberat saat duduk lama, dan pada sebagian orang penjalaran ke belakang paha yang sering disangka masalah tulang belakang.',
    stretches: [
      {
        nama: 'Figure-4 berbaring',
        otot: 'Gluteus maximus dan piriformis',
        posisi: [
          'Berbaring telentang, silangkan pergelangan kaki kanan di atas lutut kiri membentuk angka empat',
          'Pegang belakang paha kiri dan tarik mendekat ke dada',
          'Jaga kepala dan bahu tetap menempel di lantai',
        ],
        terasaDi: 'Dalam bokong kanan',
        salah: 'Mengangkat kepala dan bahu untuk menjangkau paha. Gunakan handuk melingkari paha bila tangan tidak sampai.',
        durasi: '30-45 detik tiap sisi, 2-3 kali',
        hatiHati:
          'Bila yang terasa adalah rasa terbakar, kesemutan, maupun setrum yang menjalar sampai ke betis dan kaki, HENTIKAN. Itu bukan otot yang meregang melainkan saraf yang tertarik, dan meregangkannya lebih jauh memperburuk keadaan.',
      },
      {
        nama: 'Pigeon pose (versi ringan)',
        otot: 'Gluteus dan rotator luar pinggul',
        posisi: [
          'Dari posisi merangkak, bawa lutut kanan ke depan mendekat pergelangan tangan kanan',
          'Julurkan tungkai kiri lurus ke belakang',
          'Ganjal bokong kanan dengan bantal maupun buku bila panggul miring',
        ],
        terasaDi: 'Dalam bokong kanan dan sisi luar pinggul',
        salah: 'Memaksa panggul rata ke lantai tanpa ganjalan sehingga beban berpindah ke lutut depan. Bila lutut terasa nyeri, hentikan dan kembali ke figure-4.',
        durasi: '45-60 detik tiap sisi',
        hatiHati: 'Lewati gerakan ini bila ada riwayat cedera lutut.',
      },
    ],
  },
  {
    key: 'pinggang',
    nama: 'Pinggang & Quadratus Lumborum',
    ikon: '🧍',
    wilayah: 'inti',
    kenapaTegang:
      'Berdiri bertumpu pada satu kaki, menggendong tas di satu sisi, dan duduk dengan panggul miring membuat quadratus lumborum satu sisi bekerja terus-menerus sebagai penahan.',
    akibat:
      'Pegal satu sisi pinggang yang khas muncul di akhir hari, dan panggul yang tampak tidak sama tinggi.',
    stretches: [
      {
        nama: 'Side bend berdiri',
        otot: 'Quadratus lumborum dan otot sisi badan',
        posisi: [
          'Berdiri, kaki selebar pinggul, angkat lengan kanan lurus ke atas',
          'Condongkan badan ke kiri sambil mendorong panggul kanan ke kanan',
          'Jaga badan tetap pada satu bidang, jangan condong ke depan',
        ],
        terasaDi: 'Sisi kanan pinggang sampai bawah ketiak',
        salah: 'Membungkuk ke depan sambil menyamping, sehingga tarikan hilang.',
        durasi: '30 detik tiap sisi',
      },
      {
        nama: 'Child pose menyamping',
        otot: 'Punggung bawah dan latissimus',
        posisi: [
          'Duduk di atas tumit, julurkan kedua tangan ke depan di lantai',
          'Geser kedua tangan ke sisi kanan sampai terasa tarikan di sisi kiri badan',
        ],
        terasaDi: 'Sisi punggung bawah dan pinggang',
        salah: 'Menahan napas. Napas panjang lewat perut membantu otot punggung melepas ketegangan.',
        durasi: '45 detik tiap sisi',
      },
    ],
  },
  {
    key: 'hamstring',
    nama: 'Hamstring (Belakang Paha)',
    ikon: '🦿',
    wilayah: 'bawah',
    kenapaTegang:
      'Ini kelompok otot yang paling sering disalahpahami. Pada orang yang duduk lama, hamstring memang terasa kencang — tetapi sering kali bukan karena memendek, melainkan karena panggul yang menungging ke depan sudah menariknya memanjang sepanjang hari. Otot yang tertarik memanjang dan lemah menimbulkan rasa kencang yang sama persis dengan otot yang memendek.',
    akibat:
      'Pada peregangan yang salah sasaran, rasa kencang tidak pernah hilang meski diregangkan bertahun-tahun. Yang dibutuhkan justru penguatan dan perbaikan posisi panggul, bukan tarikan yang lebih keras.',
    stretches: [
      {
        nama: 'Peregangan hamstring berbaring dengan handuk',
        otot: 'Hamstring',
        posisi: [
          'Berbaring telentang, lingkarkan handuk pada telapak kaki kanan',
          'Luruskan tungkai kanan ke atas sejauh yang nyaman, lutut boleh sedikit menekuk',
          'Jaga tungkai kiri tetap lurus menempel lantai — ini menahan panggul agar tidak ikut berputar',
        ],
        terasaDi: 'Belakang paha, di tengah-tengah otot',
        salah:
          'Meluruskan lutut secara paksa. Posisi berbaring dipilih justru karena punggung tersangga sehingga tarikan benar-benar jatuh pada hamstring, bukan pada punggung bawah seperti pada gerakan membungkuk menyentuh jari kaki.',
        durasi: '30-45 detik tiap sisi, 2-3 kali',
        hatiHati:
          'Bila terasa seperti kabel yang tertarik, panas menjalar, maupun kesemutan sampai betis, itu ketegangan SARAF bukan otot. Turunkan tungkai sedikit dan tekuk lutut sampai rasa itu hilang.',
      },
      {
        nama: 'Hip hinge dengan tumpuan',
        otot: 'Hamstring, sekaligus melatih pola gerak panggul',
        posisi: [
          'Berdiri, letakkan tumit kanan di atas kursi rendah dengan lutut lurus',
          'Tegakkan punggung, lalu dorong bokong KE BELAKANG sambil mencondongkan badan dari pangkal paha',
          'Punggung tetap lurus sepanjang gerakan',
        ],
        terasaDi: 'Belakang paha kanan',
        salah:
          'Membungkukkan punggung untuk menjangkau ujung kaki. Ini memindahkan tarikan ke ligamen punggung bawah dan menjadi kebiasaan gerak yang berbahaya saat mengangkat beban.',
        durasi: '30 detik tiap sisi',
      },
    ],
  },
  {
    key: 'kuadrisep',
    nama: 'Kuadrisep (Depan Paha)',
    ikon: '🦵',
    wilayah: 'bawah',
    kenapaTegang:
      'Rectus femoris melintasi dua sendi sekaligus, panggul dan lutut, sehingga ia memendek karena duduk dan sekaligus dibebani setiap kali berlari maupun menaiki tangga.',
    akibat:
      'Tarikan pada tempurung lutut yang menimbulkan nyeri depan lutut, terutama saat turun tangga dan setelah duduk lama.',
    stretches: [
      {
        nama: 'Peregangan kuadrisep berdiri',
        otot: 'Kuadrisep, terutama rectus femoris',
        posisi: [
          'Berdiri berpegangan dinding, tekuk lutut kanan dan pegang pergelangan kaki kanan',
          'Tarik tumit mendekat bokong, JAGA KEDUA LUTUT SEJAJAR',
          'Kencangkan bokong dan perut agar pinggang tidak melengkung',
        ],
        terasaDi: 'Depan paha kanan',
        salah:
          'Menarik lutut ke samping maupun ke belakang menjauhi tubuh, dan membiarkan pinggang melengkung. Keduanya memindahkan tarikan dari otot ke sendi lutut dan pinggang.',
        durasi: '30 detik tiap sisi, 2-3 kali',
        hatiHati: 'Bila terasa nyeri di dalam lutut, ganti dengan versi berbaring miring maupun tengkurap memakai handuk.',
      },
    ],
  },
  {
    key: 'adduktor',
    nama: 'Pangkal Paha Dalam (Adduktor)',
    ikon: '🔻',
    wilayah: 'bawah',
    kenapaTegang:
      'Duduk dengan kaki rapat maupun menyilang selama berjam-jam membuat otot sisi dalam paha jarang dipanjangkan. Pada pelari, otot ini juga bekerja keras menstabilkan panggul setiap langkah.',
    akibat: 'Langkah menjadi sempit, dan risiko cedera pangkal paha meningkat saat gerakan menyamping mendadak.',
    stretches: [
      {
        nama: 'Peregangan adduktor duduk (kupu-kupu)',
        otot: 'Adduktor pendek',
        posisi: [
          'Duduk, tempelkan kedua telapak kaki satu sama lain, tarik mendekat ke badan',
          'Tegakkan punggung, lalu condongkan badan ke depan dari pangkal paha',
          'Boleh menekan lutut ke bawah dengan siku secara ringan',
        ],
        terasaDi: 'Sisi dalam kedua paha',
        salah: 'Memantul-mantulkan lutut ke bawah. Gerakan memantul memicu refleks otot untuk justru menegang.',
        durasi: '45 detik, 2-3 kali',
      },
      {
        nama: 'Peregangan adduktor panjang (tungkai lurus)',
        otot: 'Gracilis dan adduktor panjang',
        posisi: [
          'Berdiri dengan kaki jauh melebar, telapak kaki menghadap ke depan',
          'Tekuk lutut kanan dan geser berat badan ke kanan, tungkai kiri tetap lurus',
        ],
        terasaDi: 'Sisi dalam paha kiri yang lurus',
        salah: 'Memutar telapak kaki keluar sehingga tarikan berpindah dan lutut terpuntir.',
        durasi: '30 detik tiap sisi',
      },
    ],
  },
  {
    key: 'betis',
    nama: 'Betis (Gastrocnemius & Soleus)',
    ikon: '🦶',
    wilayah: 'bawah',
    kenapaTegang:
      'Berdiri lama, berjalan di lantai keras, dan memakai sepatu bertumit sedikit tinggi membuat betis menetap dalam posisi memendek. Pada pelari, betis menerima beban berulang paling besar di antara semua otot tungkai.',
    akibat:
      'Pergelangan kaki yang kaku memaksa lutut dan pinggul mengambil alih beban, dan merupakan salah satu penyebab tersering nyeri tumit serta plantar fasciitis.',
    stretches: [
      {
        nama: 'Peregangan betis di dinding — lutut LURUS',
        otot: 'Gastrocnemius',
        posisi: [
          'Hadap dinding, letakkan kedua tangan di dinding',
          'Langkahkan kaki kanan jauh ke belakang, tumit menempel lantai, telapak lurus ke depan',
          'LURUSKAN LUTUT KANAN, condongkan badan ke depan',
        ],
        terasaDi: 'Bagian atas betis yang menonjol',
        salah: 'Membiarkan tumit terangkat maupun telapak kaki berputar keluar.',
        durasi: '30 detik tiap sisi, 2-3 kali',
      },
      {
        nama: 'Peregangan betis di dinding — lutut DITEKUK',
        otot: 'Soleus',
        posisi: [
          'Posisi sama, tetapi langkah ke belakang lebih pendek',
          'TEKUK LUTUT BELAKANG sambil menjaga tumit tetap menempel lantai',
        ],
        terasaDi: 'Betis bagian bawah, dekat tendon Achilles',
        salah:
          'Hanya mengerjakan versi lutut lurus. Gastrocnemius melewati sendi lutut sehingga ia mengendur begitu lutut ditekuk — hanya pada posisi lutut ditekuk itulah soleus benar-benar teregang. Melewatkan versi kedua berarti separuh betis tidak pernah tersentuh, dan soleus justru yang paling berkaitan dengan nyeri Achilles.',
        durasi: '30 detik tiap sisi, 2-3 kali',
      },
      {
        nama: 'Peregangan telapak kaki',
        otot: 'Plantar fascia dan otot kecil telapak',
        posisi: [
          'Duduk, silangkan kaki kanan di atas paha kiri',
          'Tarik jari-jari kaki ke arah tulang kering sampai terasa tegang di telapak',
          'Pijat lembut sepanjang telapak dengan ibu jari',
        ],
        terasaDi: 'Sepanjang telapak kaki dari tumit ke pangkal jari',
        salah: 'Melewatkannya. Bagi orang yang berdiri seharian, ini salah satu gerakan yang paling terasa manfaatnya, terutama dikerjakan sebelum menapak pertama kali di pagi hari.',
        durasi: '30 detik tiap sisi, 3 kali',
      },
    ],
  },
  {
    key: 'lengan',
    nama: 'Lengan Bawah & Pergelangan',
    ikon: '✍️',
    wilayah: 'atas',
    kenapaTegang:
      'Menulis, mengetik, memegang telepon, dan memegang alat dalam waktu lama membuat otot penekuk pergelangan bekerja terus tanpa pernah dipanjangkan.',
    akibat:
      'Pegal di lengan bawah, dan pada pemakaian berlebihan dapat berkembang menjadi nyeri sisi luar maupun dalam siku.',
    stretches: [
      {
        nama: 'Peregangan penekuk pergelangan',
        otot: 'Fleksor lengan bawah',
        posisi: [
          'Julurkan lengan kanan lurus ke depan, telapak menghadap ke atas',
          'Tarik jari-jari tangan kanan ke bawah dan ke belakang dengan tangan kiri',
        ],
        terasaDi: 'Sisi dalam lengan bawah',
        salah: 'Menekuk siku. Siku harus lurus agar otot benar-benar memanjang.',
        durasi: '30 detik tiap sisi',
      },
      {
        nama: 'Peregangan pelurus pergelangan',
        otot: 'Ekstensor lengan bawah',
        posisi: [
          'Julurkan lengan kanan lurus ke depan, telapak menghadap ke bawah',
          'Tekuk pergelangan ke bawah dan tarik lembut dengan tangan kiri',
        ],
        terasaDi: 'Sisi luar lengan bawah dekat siku',
        salah: 'Menarik terlalu kuat pada orang yang sudah nyeri siku — pada keadaan itu diperlukan latihan penguatan bertahap, bukan tarikan.',
        durasi: '30 detik tiap sisi',
      },
    ],
  },
]

// ─── Aturan yang menentukan berhasil atau tidaknya ──────────────────────────

export const STRETCH_RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Jangan meregang statis lama sebelum latihan',
    isi: 'Peregangan statis yang ditahan lama tepat sebelum berlatih menurunkan kekuatan dan daya ledak untuk sementara. Sebelum latihan yang dibutuhkan adalah pemanasan DINAMIS — gerakan berulang yang menaikkan suhu otot dan membawa sendi melewati lingkup geraknya. Peregangan statis tempatnya sesudah latihan, maupun sebagai sesi tersendiri di waktu lain.',
  },
  {
    judul: 'Yang menentukan hasil adalah total waktu per minggu',
    isi: 'Satu tarikan sepuluh detik tidak mengubah apa pun. Pertambahan lingkup gerak yang bertahan membutuhkan akumulasi sekitar lima menit per kelompok otot per minggu. Menahan 30 detik sebanyak 2 kali, 5 hari seminggu, sudah memenuhi ambang itu — dan itu jauh lebih menentukan daripada seberapa dalam tarikannya.',
  },
  {
    judul: 'Tarikan yang tertahankan, bukan nyeri',
    isi: 'Rasa yang dituju adalah tarikan yang jelas namun masih bisa ditahan sambil bernapas tenang — sekitar 4 sampai 6 dari 10. Nyeri tajam adalah tanda berhenti. Meregang sampai nyeri membuat otot justru menegang sebagai refleks perlindungan, sehingga hasilnya berlawanan dengan yang diinginkan.',
  },
  {
    judul: 'Bernapas, jangan menahan napas',
    isi: 'Menahan napas menaikkan ketegangan otot dan tekanan darah. Bernapas panjang dan lambat, dan manfaatkan setiap embusan untuk melepas sedikit lebih dalam.',
  },
  {
    judul: 'Jangan memantul',
    isi: 'Gerakan memantul memicu refleks regang yang justru membuat otot berkontraksi melawan. Selain kurang efektif, ia menambah risiko robekan serat otot. Tahan diam, atau gunakan gerakan dinamis yang terkendali.',
  },
  {
    judul: 'Otot hangat lebih aman diregangkan',
    isi: 'Meregangkan otot dingin di pagi hari langsung dari tempat tidur kurang efektif dan lebih berisiko. Berjalan maupun bergerak ringan lima menit lebih dahulu sudah cukup.',
  },
  {
    judul: 'Terasa kencang belum tentu memendek',
    isi: 'Otot yang LEMAH dan tertarik memanjang menimbulkan rasa kencang yang sama persis dengan otot yang memendek. Hamstring dan punggung atas pada orang yang duduk lama adalah contoh tersering. Bila suatu otot sudah diregangkan bertahun-tahun tanpa perubahan, kemungkinan besar yang dibutuhkannya adalah penguatan, bukan tarikan yang lebih keras.',
  },
  {
    judul: 'Saraf bukan otot',
    isi: 'Rasa terbakar, kesemutan, baal, maupun setrum yang menjalar sepanjang tungkai atau lengan adalah tanda saraf yang tertarik, bukan otot yang meregang. Menariknya lebih jauh memperburuk keadaan. Kurangi posisinya sampai rasa itu hilang, dan bila menetap perlu diperiksakan.',
  },
  {
    judul: 'Bila sendi Anda memang sangat lentur, kurangi peregangan',
    isi: 'Sebagian orang memiliki sendi yang secara bawaan longgar. Pada mereka, menambah kelenturan justru mengurangi kestabilan dan meningkatkan risiko cedera — yang dibutuhkan adalah penguatan dan kendali gerak.',
  },
]

// ─── Pemanasan dinamis (sebelum latihan) ────────────────────────────────────

export interface DynamicMove {
  nama: string
  dosis: string
  cue: string
}

export const DYNAMIC_WARMUP: DynamicMove[] = [
  { nama: 'Jalan cepat atau lari sangat pelan', dosis: '3-5 menit', cue: 'Tujuannya menaikkan suhu otot lebih dahulu; sisa pemanasan bekerja jauh lebih baik pada otot yang sudah hangat' },
  { nama: 'Leg swing depan-belakang', dosis: '10 kali tiap tungkai', cue: 'Berpegangan dinding, ayun terkendali; jangkauan ditambah bertahap, bukan langsung maksimal' },
  { nama: 'Leg swing menyamping', dosis: '10 kali tiap tungkai', cue: 'Menyiapkan adduktor dan otot sisi pinggul' },
  { nama: 'Walking lunge', dosis: '8 langkah tiap sisi', cue: 'Memanjangkan hip flexor sambil membebani — inilah yang tidak diberikan peregangan statis' },
  { nama: 'Ayunan lengan menyilang dan membuka', dosis: '15 kali', cue: 'Membuka dada dan menyiapkan bahu' },
  { nama: 'Rotasi torakal berdiri', dosis: '10 kali tiap sisi', cue: 'Panggul menghadap depan, hanya badan atas yang berputar' },
  { nama: 'Ankle rocking (lutut melewati ujung kaki)', dosis: '10 kali tiap sisi', cue: 'Menyiapkan pergelangan kaki yang menentukan mekanika lari' },
  { nama: 'Skipping ringan atau high knee', dosis: '20-30 detik', cue: 'Menutup pemanasan dengan gerakan yang menyerupai lari' },
]

// ─── Rutin siap pakai ───────────────────────────────────────────────────────

export interface Routine {
  key: string
  nama: string
  kapan: string
  durasi: string
  untuk: string
  langkah: string[]
}

export const ROUTINES: Routine[] = [
  {
    key: 'sebelum',
    nama: 'Sebelum latihan — dinamis',
    kapan: 'Tepat sebelum lari maupun latihan kekuatan',
    durasi: '8-10 menit',
    untuk: 'Menaikkan suhu otot dan membuka lingkup gerak tanpa menurunkan kekuatan',
    langkah: [
      'Jalan cepat atau lari sangat pelan 3-5 menit',
      'Leg swing depan-belakang 10 kali tiap tungkai',
      'Leg swing menyamping 10 kali tiap tungkai',
      'Walking lunge 8 langkah tiap sisi',
      'Rotasi torakal 10 kali tiap sisi',
      'Ankle rocking 10 kali tiap sisi',
      'Skipping ringan 20-30 detik',
    ],
  },
  {
    key: 'sesudah',
    nama: 'Sesudah latihan — statis',
    kapan: 'Dalam 10 menit setelah selesai, selagi otot masih hangat',
    durasi: '10-12 menit',
    untuk: 'Menambah lingkup gerak; inilah waktu peregangan statis yang tepat',
    langkah: [
      'Betis lutut lurus 30 detik tiap sisi',
      'Betis lutut ditekuk 30 detik tiap sisi',
      'Hamstring berbaring dengan handuk 30 detik tiap sisi',
      'Hip flexor berlutut 45 detik tiap sisi',
      'Kuadrisep berdiri 30 detik tiap sisi',
      'Figure-4 30 detik tiap sisi',
      'Peregangan dada di kusen pintu 30 detik tiap posisi',
    ],
  },
  {
    key: 'meja',
    nama: 'Sela kerja / jaga — 5 menit',
    kapan: 'Setiap 30-45 menit duduk maupun berdiri menetap',
    durasi: '5 menit',
    untuk: 'Melawan pola bungkuk sebelum menjadi menetap; ini yang paling menentukan bagi orang yang bekerja lama berdiri maupun duduk',
    langkah: [
      'Berdiri dan berjalan 1 menit — ini langkah terpenting dan paling sering dilewati',
      'Chin tuck 10 kali tahan 5 detik',
      'Peregangan dada di kusen pintu 30 detik tiap sisi',
      'Ekstensi torakal di sandaran kursi 5 kali',
      'Hip flexor berlutut 30 detik tiap sisi bila ada tempat, atau berdiri melangkah panjang',
      'Peregangan penekuk pergelangan 20 detik tiap sisi',
    ],
  },
  {
    key: 'malam',
    nama: 'Sebelum tidur — pelepasan',
    kapan: 'Malam hari, tanpa target menambah kelenturan',
    durasi: '8 menit',
    untuk: 'Menurunkan ketegangan dan membantu masuk tidur; tarikan dijaga tetap ringan',
    langkah: [
      'Child pose 60 detik',
      'Child pose menyamping 45 detik tiap sisi',
      'Figure-4 berbaring 45 detik tiap sisi',
      'Open book 8 kali tiap sisi',
      'Peregangan telapak kaki 30 detik tiap sisi',
      'Berbaring dengan napas perut lambat 2 menit',
    ],
  },
]

// ─── Dosis mingguan ─────────────────────────────────────────────────────────

export interface DoseResult {
  perSesiDetik: number
  perMingguDetik: number
  /** Ambang akumulasi yang berkaitan dengan pertambahan lingkup gerak menetap. */
  targetDetik: number
  cukup: boolean
  /** Kekurangan dalam detik; 0 bila sudah cukup. */
  kurangDetik: number
  saran: string
}

export const WEEKLY_TARGET_SEC = 300 // ~5 menit per kelompok otot per minggu

/**
 * Menghitung total waktu regang per kelompok otot per minggu dan
 * membandingkannya dengan ambang yang berkaitan dengan pertambahan lingkup
 * gerak yang menetap. Dibuat sebagai hitungan tersendiri karena inilah angka
 * yang paling sering meleset — orang menambah KEDALAMAN tarikan padahal yang
 * kurang adalah TOTAL WAKTUNYA.
 */
export function stretchDose(holdSec: number, reps: number, sessionsPerWeek: number): DoseResult | null {
  if (!(holdSec > 0) || !(reps > 0) || !(sessionsPerWeek > 0)) return null
  const perSesiDetik = Math.round(holdSec * reps)
  const perMingguDetik = Math.round(perSesiDetik * sessionsPerWeek)
  const kurangDetik = Math.max(0, WEEKLY_TARGET_SEC - perMingguDetik)
  const cukup = kurangDetik === 0

  let saran: string
  if (cukup) {
    saran =
      perMingguDetik >= WEEKLY_TARGET_SEC * 2
        ? 'Sudah jauh melewati ambang. Menambah lagi memberi hasil yang semakin kecil — lebih baik alihkan waktunya ke penguatan.'
        : 'Sudah memenuhi ambang. Pertahankan, dan jangan tergoda menambah kedalaman tarikan sebagai gantinya.'
  } else {
    const tambahSesi = Math.ceil(kurangDetik / Math.max(perSesiDetik, 1))
    saran = `Kurang ${Math.round(kurangDetik / 60 * 10) / 10} menit per minggu. Cara termudah menutupnya adalah menambah ${tambahSesi} sesi lagi dalam seminggu, bukan menarik lebih dalam.`
  }

  return { perSesiDetik, perMingguDetik, targetDetik: WEEKLY_TARGET_SEC, cukup, kurangDetik, saran }
}

/** Format detik menjadi "3 mnt 30 dtk". */
export function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  if (m === 0) return `${s} dtk`
  return s === 0 ? `${m} mnt` : `${m} mnt ${s} dtk`
}

/** Tanda bahaya yang menuntut pemeriksaan, bukan peregangan lebih lanjut. */
export const RED_FLAGS: string[] = [
  'Kesemutan, baal, maupun rasa setrum yang menjalar ke tungkai maupun lengan',
  'Kelemahan otot yang nyata, misalnya kaki terasa lemas maupun sering tersandung',
  'Nyeri yang membangunkan dari tidur maupun tidak berkurang dengan istirahat',
  'Nyeri setelah cedera mendadak disertai bengkak, memar, maupun tidak bisa menumpu berat badan',
  'Gangguan buang air kecil maupun besar yang muncul bersama nyeri pinggang',
  'Nyeri disertai demam maupun penurunan berat badan tanpa sebab',
]
