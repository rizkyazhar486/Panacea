// ─────────────────────────────────────────────────────────────────────────────
// CARA MELAKUKAN pemeriksaan fisik khusus — bukan sekadar namanya.
//
// CACAT YANG DIPERBAIKI. Catatan stasiun menyebut "Finkelstein positif",
// "McMurray positif", "Lasegue positif" — dan berhenti di situ. Nama tesnya
// dapat dihafal dalam satu menit; yang dinilai penguji adalah TANGANNYA, dan
// itulah yang tidak tertulis di mana pun. Peserta yang tahu nama tesnya tetapi
// salah memegang tetap kehilangan angkanya, dan tidak ada satu pun catatan di
// aplikasi ini yang menolongnya.
//
// BENTUKNYA LANGKAH BERPANAH, sama dengan patofisiologi dan mekanisme obat,
// supaya dapat diucapkan ulang sambil tangannya bergerak.
//
// TIAP MANUVER MEMUAT 'AWAS'. Sebagian besar tes ini punya positif palsu yang
// terkenal, dan justru itu yang membedakan peserta yang mengerti dari yang
// menghafal — Lasegue yang positif pada 80 derajat bukan Lasegue positif, dan
// Tinel positif pada orang sehat bukan hal yang jarang.
//
// FINKELSTEIN BERBANDING EICHHOFF: hampir seluruh buku ajar Indonesia dan
// sebagian besar buku ajar berbahasa Inggris menyebut "Finkelstein" untuk
// manuver yang sebenarnya diuraikan Eichhoff. Keduanya dituliskan terpisah di
// bawah, apa adanya, beserta keterangan bahwa yang diminta penguji hampir
// selalu manuver Eichhoff dengan nama Finkelstein. Menuliskan yang benar tanpa
// menyebut yang lazim akan membuat pembacanya menjawab "salah" di hadapan
// penguji yang memakai istilah lazim; menuliskan yang lazim saja membuatnya
// tidak pernah tahu bedanya.
// ─────────────────────────────────────────────────────────────────────────────

export interface ManuverPF {
  nama: string
  /** Nama lain yang DIKETIK atau DISEBUT orang. Dipakai untuk mendeteksi. */
  alias?: string[]
  /** Bagian tubuh — dipakai mengelompokkan. */
  wilayah: string
  /** Apa yang diuji. Satu kalimat. */
  untuk: string
  /** Langkah demi langkah. Baris kosong '' memisahkan dua rangkaian. */
  langkah: string[]
  /** Apa yang disebut POSITIF. Harus tegas, bukan "nyeri". */
  positif: string
  /** Jebakan, positif palsu, dan hal yang membuat nilainya hilang. */
  awas?: string
}

export const MANUVER_PF: ManuverPF[] = [
  // ── PERGELANGAN TANGAN & TANGAN ───────────────────────────────────────────
  {
    nama: 'Eichhoff (yang lazim disebut Finkelstein)',
    alias: ['eichhoff', 'eichoff', 'finkelstein'],
    wilayah: 'Pergelangan tangan',
    untuk: 'Tenosinovitis de Quervain — radang selubung tendon abduktor polisis longus dan ekstensor polisis brevis di kompartemen dorsal pertama.',
    langkah: [
      'Pasien duduk, lengan bawah PRONASI di atas meja',
      'minta pasien MENEKUK ibu jarinya ke dalam telapak',
      'genggam jari lain menutupi ibu jari (mengepal)',
      'pemeriksa memegang lengan bawah dengan satu tangan',
      'tangan lain mendeviasi pergelangan ke arah ULNAR (ke sisi kelingking)',
      'lakukan PERLAHAN, bukan menyentak',
      'NYERI TAJAM di sisi RADIAL pergelangan (prosesus stiloideus radii)',
    ],
    positif: 'Nyeri tajam pada sisi radial pergelangan tangan tepat di atas kompartemen dorsal pertama, yang jelas lebih hebat daripada sisi sebelahnya.',
    awas: 'Deviasi ulnar yang disentak menimbulkan nyeri pada hampir semua orang — positif palsu tersering. Bandingkan SELALU dengan tangan sebelahnya. Nyeri di dasar ibu jari yang lebih ke distal mengarah ke osteoartritis sendi karpometakarpal I, bukan de Quervain; bedakan dengan uji grind. Nama yang dipakai penguji hampir selalu "Finkelstein" walaupun langkah yang diminta adalah manuver ini.',
  },
  {
    nama: 'Finkelstein asli',
    alias: ['finkelstein asli', 'finkelstein sejati'],
    wilayah: 'Pergelangan tangan',
    untuk: 'Tenosinovitis de Quervain — bentuk yang diuraikan Finkelstein sendiri.',
    langkah: [
      'Ibu jari pasien TIDAK digenggam jari lain',
      'PEMERIKSA memegang ibu jari pasien langsung',
      'tarik ibu jari ke arah ulnar dan distal',
      'pergelangan dibiarkan, yang ditarik ibu jarinya',
      'NYERI di sisi radial pergelangan',
    ],
    positif: 'Nyeri pada sisi radial pergelangan saat ibu jari ditarik pemeriksa.',
    awas: 'Inilah yang sesungguhnya diuraikan Finkelstein, tetapi yang diajarkan dan diminta dengan nama itu di hampir semua tempat adalah manuver EICHHOFF di atas. Bila penguji menyebut Finkelstein, kerjakan manuver Eichhoff; sebutkan perbedaannya hanya bila ditanya.',
  },
  {
    nama: 'Phalen',
    alias: ['phalen'],
    wilayah: 'Pergelangan tangan',
    untuk: 'Sindrom terowongan karpal — penekanan n. medianus.',
    langkah: [
      'Siku ditekuk, lengan bawah tegak',
      'punggung kedua tangan DIRAPATKAN saling menempel',
      'pergelangan dalam FLEKSI penuh 90 derajat',
      'pertahankan 60 DETIK penuh — hitung, jangan dikira-kira',
      'kesemutan/baal pada jari 1-2-3 dan setengah radial jari 4',
    ],
    positif: 'Timbul parestesia pada distribusi n. medianus dalam 60 detik. Makin cepat muncul, makin berat.',
    awas: 'Menahan kurang dari 60 detik adalah sebab negatif palsu tersering. Kesemutan pada SELURUH jari termasuk kelingking bukan pola n. medianus — pikirkan polineuropati atau penekanan n. ulnaris.',
  },
  {
    nama: 'Tinel',
    alias: ['tinel'],
    wilayah: 'Saraf tepi',
    untuk: 'Iritasi atau regenerasi saraf tepi; paling dikenal untuk sindrom terowongan karpal.',
    langkah: [
      'Pergelangan tangan sedikit dorsofleksi di atas meja',
      'tentukan letak terowongan karpal (antara os pisiforme dan tuberkulum skafoid)',
      'KETUK dengan jari atau palu refleks, 4-6 kali',
      'kekuatan sedang dan TETAP — bukan makin keras',
      'sensasi tersetrum menjalar ke jari 1-2-3',
    ],
    positif: 'Rasa tersetrum atau kesemutan yang MENJALAR ke distribusi sarafnya, bukan nyeri setempat di tempat diketuk.',
    awas: 'Nyeri setempat saja BUKAN Tinel positif — kekeliruan yang paling sering. Tinel dapat positif pada orang sehat bila diketuk terlalu keras. Dapat dipakai pada saraf mana pun (ulnaris di sulkus siku, tibialis posterior di belakang maleolus medial untuk terowongan tarsal).',
  },
  {
    nama: 'Froment',
    alias: ['froment'],
    wilayah: 'Tangan',
    untuk: 'Kelumpuhan n. ulnaris — kelemahan m. adduktor polisis.',
    langkah: [
      'Beri selembar kertas untuk dijepit antara ibu jari dan sisi jari telunjuk',
      'pemeriksa MENARIK kertas itu',
      'perhatikan sendi interfalang ibu jari pasien',
      'bila adduktor polisis lemah, pasien menggantinya dengan m. fleksor polisis longus (n. medianus)',
      'ibu jari MENEKUK di sendi interfalang untuk menahan',
    ],
    positif: 'Sendi interfalang ibu jari menekuk saat kertas ditarik.',
    awas: 'Memisahkan lesi n. ulnaris dari sindrom terowongan karpal. Bandingkan kedua tangan.',
  },

  // ── LUTUT ─────────────────────────────────────────────────────────────────
  {
    nama: 'McMurray',
    alias: ['mcmurray', 'mc murray'],
    wilayah: 'Lutut',
    untuk: 'Robekan meniskus.',
    langkah: [
      'Pasien terlentang, lutut ditekuk PENUH',
      'satu tangan memegang tumit, tangan lain di garis sendi lutut',
      'MENISKUS MEDIAL: putar tungkai bawah ke LUAR (eksorotasi) + beri tekanan valgus',
      'lalu luruskan lutut perlahan sambil mempertahankan putaran',
      '',
      'MENISKUS LATERAL: putar tungkai bawah ke DALAM (endorotasi) + tekanan varus',
      'lalu luruskan lutut perlahan',
      'raba/dengar KLIK disertai NYERI di garis sendi',
    ],
    positif: 'Terasa atau terdengar klik DISERTAI nyeri pada garis sendi sisi yang diuji. Klik tanpa nyeri bukan positif.',
    awas: 'Klik saja terjadi pada banyak lutut normal — yang menentukan nyerinya. Jangan memaksa pada lutut yang sangat bengkak dan nyeri; hasilnya tidak dapat dinilai dan pasien tersiksa. Nyeri tekan garis sendi lebih peka daripada McMurray.',
  },
  {
    nama: 'Lachman',
    alias: ['lachman'],
    wilayah: 'Lutut',
    untuk: 'Robekan ligamen krusiat anterior — tes yang paling peka untuk ACL.',
    langkah: [
      'Pasien terlentang, lutut ditekuk 20-30 DERAJAT saja (bukan 90)',
      'satu tangan memfiksasi paha bawah',
      'tangan lain memegang tungkai bawah tepat di bawah lutut',
      'TARIK tungkai bawah ke ANTERIOR dengan mantap',
      'nilai seberapa jauh bergeser dan ADAKAH ujung yang tegas (end point)',
    ],
    positif: 'Pergeseran ke depan yang berlebihan DENGAN ujung yang lunak atau tanpa ujung tegas, dibanding lutut sebelahnya.',
    awas: 'Lebih peka daripada anterior drawer, terutama pada cedera akut ketika hamstring mengejang dan menutupi pergeseran pada posisi 90 derajat. Selalu bandingkan dengan lutut sehat — sebagian orang memang longgar pada kedua lututnya.',
  },
  {
    nama: 'Anterior drawer lutut',
    alias: ['anterior drawer', 'laci anterior'],
    wilayah: 'Lutut',
    untuk: 'Robekan ligamen krusiat anterior.',
    langkah: [
      'Pasien terlentang, panggul 45 derajat, lutut ditekuk 90 DERAJAT',
      'kaki pasien difiksasi (pemeriksa boleh duduk di atas punggung kaki)',
      'pastikan hamstring RILEKS lebih dahulu',
      'kedua tangan memegang tungkai bawah tepat di bawah garis sendi',
      'TARIK ke anterior',
    ],
    positif: 'Pergeseran anterior berlebihan dibanding sisi sebelahnya.',
    awas: 'Kurang peka pada cedera AKUT karena hamstring mengejang; pakai Lachman. Singkirkan lebih dahulu robekan PCL — tungkai bawah yang sudah tertinggal ke belakang (posterior sag) membuat tarikan ke depan terasa seperti ACL robek padahal yang robek PCL.',
  },

  // ── PUNGGUNG & PANGGUL ────────────────────────────────────────────────────
  {
    nama: 'Lasegue (straight leg raise)',
    alias: ['lasegue', 'laseque', 'straight leg raise', 'slr'],
    wilayah: 'Punggung bawah',
    untuk: 'Iritasi akar saraf lumbosakral (L4-S1) — mendukung HNP.',
    langkah: [
      'Pasien TERLENTANG, tanpa bantal, kedua tungkai lurus',
      'pemeriksa mengangkat SATU tungkai dalam keadaan LUTUT TETAP LURUS',
      'satu tangan di tumit, tangan lain menahan lutut agar tidak menekuk',
      'angkat perlahan sampai timbul nyeri',
      'CATAT SUDUTNYA',
      'nyeri MENJALAR sepanjang tungkai belakang pada 30-70 derajat',
    ],
    positif: 'Nyeri yang MENJALAR mengikuti dermatom (bukan sekadar tarikan di paha belakang) pada sudut 30-70 derajat.',
    awas: 'Nyeri di atas 70 derajat BUKAN positif — pada sudut itu akar saraf sudah tidak teregang lagi, dan yang terasa umumnya hanya hamstring yang kaku. Nyeri di bawah 30 derajat mencurigakan sebagai berlebih-lebihan atau kelainan lain. Tambahkan uji Bragard (dorsofleksi kaki pada sudut tepat sebelum nyeri) — nyeri bertambah menguatkan asal radikuler.',
  },
  {
    nama: 'Lasegue silang (crossed SLR)',
    alias: ['lasegue silang', 'crossed slr', 'crossed straight leg raise'],
    wilayah: 'Punggung bawah',
    untuk: 'Herniasi diskus yang besar dan biasanya di tengah.',
    langkah: [
      'Kerjakan Lasegue pada tungkai yang SEHAT',
      'perhatikan tungkai yang SAKIT',
      'nyeri timbul pada tungkai yang SAKIT',
    ],
    positif: 'Mengangkat tungkai sehat menimbulkan nyeri menjalar pada tungkai yang sakit.',
    awas: 'Kepekaannya rendah tetapi KEKHASANNYA sangat tinggi — bila positif, herniasinya hampir pasti dan biasanya besar. Sering terlupa dikerjakan.',
  },
  {
    nama: 'Patrick dan kontra-Patrick',
    alias: ['patrick', 'faber', 'kontra patrick', 'kontrapatrick'],
    wilayah: 'Panggul',
    untuk: 'Memisahkan nyeri dari sendi PANGGUL (Patrick) dan dari sendi SAKROILIAKA (kontra-Patrick).',
    langkah: [
      'PATRICK (FABER): terlentang, tumit satu kaki diletakkan di atas lutut kaki lain (angka 4)',
      'satu tangan menahan panggul sisi berlawanan',
      'tangan lain menekan lutut yang ditekuk ke arah meja',
      'nyeri di LIPAT PAHA = sendi panggul',
      '',
      'KONTRA-PATRICK: posisi kaki sama',
      'lutut yang ditekuk didorong ke arah DALAM (adduksi dan endorotasi)',
      'nyeri di BOKONG/sakroiliaka = sendi sakroiliaka',
    ],
    positif: 'Patrick: nyeri lipat paha. Kontra-Patrick: nyeri bokong pada sendi sakroiliaka.',
    awas: 'Letak nyerinya yang menentukan, bukan sekadar ada tidaknya nyeri. Nyeri punggung bawah yang timbul pada keduanya tidak memisahkan apa pun.',
  },

  // ── BAHU ──────────────────────────────────────────────────────────────────
  {
    nama: 'Neer',
    alias: ['neer'],
    wilayah: 'Bahu',
    untuk: 'Sindrom impingement subakromial.',
    langkah: [
      'Pasien duduk atau berdiri',
      'pemeriksa memfiksasi SKAPULA dengan satu tangan (agar tidak ikut berputar)',
      'lengan pasien dalam pronasi (ibu jari mengarah ke bawah)',
      'angkat lengan ke depan (fleksi) secara PASIF sampai maksimal',
      'nyeri pada 70-120 derajat',
    ],
    positif: 'Nyeri saat lengan diangkat pasif, terutama pada busur 70-120 derajat.',
    awas: 'Tanpa memfiksasi skapula, gerakannya menjadi gerakan skapulotorakal dan tesnya tidak menguji apa pun.',
  },
  {
    nama: 'Hawkins-Kennedy',
    alias: ['hawkins', 'hawkins kennedy'],
    wilayah: 'Bahu',
    untuk: 'Sindrom impingement subakromial.',
    langkah: [
      'Bahu diangkat ke depan 90 derajat, siku ditekuk 90 derajat',
      'pemeriksa menopang siku',
      'putar lengan bawah ke DALAM (rotasi internal) secara pasif',
      'nyeri saat rotasi internal',
    ],
    positif: 'Nyeri saat rotasi internal pada posisi tersebut.',
    awas: 'Lebih peka daripada Neer tetapi kurang khas; keduanya dikerjakan bersama, bukan salah satu saja.',
  },

  // ── PERUT ─────────────────────────────────────────────────────────────────
  {
    nama: 'Murphy',
    alias: ['murphy'],
    wilayah: 'Perut',
    untuk: 'Kolesistitis akut.',
    langkah: [
      'Pasien terlentang, pemeriksa di sisi kanan',
      'letakkan jari di bawah lengkung iga kanan pada garis midklavikula',
      'minta pasien MENARIK NAPAS DALAM',
      'kandung empedu yang meradang turun menyentuh jari pemeriksa',
      'pasien BERHENTI menarik napas karena nyeri (inspiratory arrest)',
    ],
    positif: 'Napas TERHENTI mendadak saat inspirasi karena nyeri. Nyeri tekan saja tanpa terhentinya napas bukan Murphy positif.',
    awas: 'Bandingkan dengan sisi kiri — bila nyeri sama pada kedua sisi, bukan Murphy. Kepekaannya menurun pada usia lanjut dan penderita diabetes.',
  },
  {
    nama: 'Blumberg (nyeri lepas)',
    alias: ['blumberg', 'nyeri lepas', 'rebound'],
    wilayah: 'Perut',
    untuk: 'Rangsangan peritoneum.',
    langkah: [
      'Tekan perut PERLAHAN dan dalam pada tempat yang jauh dari nyeri',
      'tahan beberapa detik',
      'LEPASKAN tangan dengan cepat',
      'nyeri justru saat DILEPAS, bukan saat ditekan',
    ],
    positif: 'Nyeri yang jelas lebih hebat saat tangan dilepas.',
    awas: 'Menyakitkan dan kepekaannya tidak lebih baik daripada nyeri ketok atau meminta pasien BATUK — pada anak dan pasien yang sangat nyeri, pakai uji batuk lebih dahulu. Jangan diulang berkali-kali.',
  },
  {
    nama: 'Rovsing',
    alias: ['rovsing'],
    wilayah: 'Perut',
    untuk: 'Appendisitis akut.',
    langkah: [
      'Tekan perut kuadran KIRI bawah',
      'lepaskan',
      'tanyakan letak nyerinya',
      'nyeri dirasakan di kuadran KANAN bawah',
    ],
    positif: 'Penekanan di kiri bawah menimbulkan nyeri di KANAN bawah.',
    awas: 'Nyeri di tempat yang ditekan (kiri) bukan Rovsing positif.',
  },
  {
    nama: 'Psoas dan Obturator',
    alias: ['psoas', 'obturator'],
    wilayah: 'Perut',
    untuk: 'Appendisitis dengan letak retrosekal (psoas) atau pelvis (obturator).',
    langkah: [
      'PSOAS: pasien berbaring MIRING KE KIRI',
      'pemeriksa menarik tungkai kanan ke belakang (ekstensi panggul)',
      'nyeri kanan bawah = apendiks menempel m. psoas (retrosekal)',
      '',
      'OBTURATOR: terlentang, panggul dan lutut kanan ditekuk 90 derajat',
      'putar tungkai ke DALAM (rotasi internal panggul)',
      'nyeri kanan bawah = apendiks di pelvis',
    ],
    positif: 'Nyeri pada kuadran kanan bawah saat manuver dikerjakan.',
    awas: 'Negatif tidak menyingkirkan appendisitis — keduanya hanya positif bila apendiks kebetulan berada di letak itu.',
  },

  // ── TELINGA, SARAF, DAN LAIN ──────────────────────────────────────────────
  {
    nama: 'Rinne dan Weber',
    alias: ['rinne', 'weber'],
    wilayah: 'Telinga',
    untuk: 'Memisahkan tuli HANTARAN dari tuli SENSORINEURAL.',
    langkah: [
      'Pakai garpu tala 512 Hz (bukan 128 Hz yang untuk getar)',
      '',
      'RINNE: getarkan, tempelkan pada PROSESUS MASTOID',
      'bila pasien tidak mendengar lagi, pindahkan ke DEPAN LIANG TELINGA',
      'masih terdengar = Rinne POSITIF (normal, hantaran udara > tulang)',
      'tidak terdengar = Rinne NEGATIF (tuli hantaran pada telinga itu)',
      '',
      'WEBER: tempelkan pada DAHI atau puncak kepala di garis tengah',
      'tanyakan terdengar lebih keras di sebelah mana',
      'LATERALISASI KE TELINGA SAKIT = tuli hantaran',
      'LATERALISASI KE TELINGA SEHAT = tuli sensorineural',
    ],
    positif: 'Bukan positif-negatif tunggal; hasilnya ditafsirkan bersama Rinne, Weber, dan Schwabach.',
    awas: 'Istilah "Rinne negatif" berarti ABNORMAL — kebalikan dari kebiasaan tes lain, dan sering tertukar saat gugup. Jangan menyentuh garpu tala pada bagian yang bergetar; getarannya berhenti.',
  },
  {
    nama: 'Dix-Hallpike',
    alias: ['dix hallpike', 'dix-hallpike'],
    wilayah: 'Vestibular',
    untuk: 'BPPV kanalis semisirkularis posterior.',
    langkah: [
      'Jelaskan lebih dahulu bahwa pasien akan pusing sesaat — dan siapkan tempat berbaring yang cukup panjang',
      'pasien DUDUK di tepi tempat tidur',
      'putar kepala 45 derajat ke sisi yang diuji',
      'baringkan CEPAT ke belakang sampai kepala menggantung 20-30 derajat di bawah bidang tempat tidur',
      'pertahankan posisi, MATA PASIEN TETAP TERBUKA',
      'amati NISTAGMUS selama 30-60 detik',
      'nistagmus torsional-upbeat setelah jeda 1-5 detik, mereda <60 detik',
    ],
    positif: 'Timbul vertigo disertai nistagmus torsional ke arah telinga bawah, dengan LATENSI beberapa detik dan mereda sendiri.',
    awas: 'JANGAN dikerjakan bila dicurigai diseksi arteri vertebralis, stenosis karotis berat, atau ketidakstabilan tulang leher. Nistagmus yang muncul TANPA latensi, tidak mereda, atau arahnya berubah mengarah ke sebab SENTRAL — itu bukan BPPV dan menuntut pencitraan.',
  },
  {
    nama: 'Brudzinski dan Kernig',
    alias: ['brudzinski', 'kernig', 'rangsang meningeal'],
    wilayah: 'Saraf',
    untuk: 'Rangsangan selaput otak.',
    langkah: [
      'KAKU KUDUK: terlentang tanpa bantal, tekukkan leher pasif ke dada',
      'tahanan atau nyeri = kaku kuduk',
      '',
      'BRUDZINSKI I: saat leher ditekuk, amati KEDUA TUNGKAI',
      'lutut dan panggul ikut menekuk sendiri = positif',
      '',
      'KERNIG: panggul dan lutut ditekuk 90 derajat',
      'lalu luruskan LUTUT perlahan',
      'tahanan atau nyeri sebelum mencapai 135 derajat = positif',
    ],
    positif: 'Brudzinski: tungkai menekuk sendiri saat leher ditekuk. Kernig: lutut tidak dapat diluruskan sampai 135 derajat karena nyeri.',
    awas: 'Kepekaannya RENDAH — tanda negatif TIDAK menyingkirkan meningitis, dan itu kekeliruan yang mahal. Pada bayi, lansia, dan penderita imunosupresi, tanda ini sering tidak ada sama sekali walaupun meningitisnya berat.',
  },
  {
    nama: 'Uji monofilamen 10 g',
    alias: ['monofilamen', 'semmes weinstein', 'semmes-weinstein'],
    wilayah: 'Kaki',
    untuk: 'Hilangnya sensasi protektif pada neuropati diabetik — penanda risiko ulkus.',
    langkah: [
      'Tunjukkan dahulu monofilamen pada LENGAN pasien agar tahu rasanya',
      'MATA PASIEN TERTUTUP',
      'tekankan tegak lurus pada kulit sampai filamen MELENGKUNG',
      'tahan 1-2 detik lalu angkat',
      'periksa 4-10 titik pada telapak; HINDARI kalus, luka, dan jaringan parut',
      'tanyakan terasa atau tidak, dan di mana',
      'sisipkan uji palsu (tidak menyentuh) untuk menguji kejujuran jawaban',
    ],
    positif: 'Tidak terasa pada satu titik atau lebih = hilangnya sensasi protektif = berisiko tinggi ulkus kaki.',
    awas: 'Menekan pada kalus memberi negatif palsu. Monofilamen kehilangan kekuatannya setelah dipakai berulang — istirahatkan 24 jam setiap 10 pasien.',
  },
  {
    nama: 'Uji Schober',
    alias: ['schober'],
    wilayah: 'Punggung',
    untuk: 'Keterbatasan gerak tulang belakang lumbal pada spondiloartritis aksial.',
    langkah: [
      'Pasien BERDIRI tegak',
      'tandai garis yang menghubungkan kedua spina iliaka posterior superior (setinggi L5)',
      'tandai 10 cm DI ATAS dan 5 cm DI BAWAH titik itu',
      'minta pasien membungkuk ke depan sejauh mungkin dengan lutut lurus',
      'ukur ulang jarak kedua tanda',
      'penambahan KURANG DARI 5 cm = terbatas',
    ],
    positif: 'Jarak 15 cm bertambah kurang dari 5 cm saat membungkuk penuh.',
    awas: 'Lutut yang ditekuk membuat hasilnya keliru. Nyeri yang menghalangi membungkuk juga memberi hasil terbatas walaupun sendinya tidak kaku — catat alasannya.',
  },
  {
    nama: 'Uji Thompson',
    alias: ['thompson', 'simmonds'],
    wilayah: 'Tungkai',
    untuk: 'Robekan total tendon Achilles.',
    langkah: [
      'Pasien TENGKURAP, kaki menggantung di ujung tempat tidur',
      'REMAS otot betis (gastroknemius) pada bagian tengahnya',
      'amati gerakan kaki',
      'normal: kaki ikut menekuk ke bawah (plantarfleksi)',
      'robek total: kaki TIDAK bergerak',
    ],
    positif: 'Kaki tidak berplantarfleksi saat betis diremas.',
    awas: 'Pasien dengan robekan total MASIH DAPAT berjalan dan masih dapat menggerakkan kakinya ke bawah dengan otot lain — kemampuan berjalan tidak menyingkirkan robekan, dan itu kekeliruan yang membuat cedera ini sering terlewat di IGD.',
  },
]

/** Semua nama yang dapat dikenali dari sebuah manuver. */
const namaCari = (m: ManuverPF) => [m.nama, ...(m.alias ?? [])]

/**
 * Manuver yang DISEBUT di dalam sepotong teks pemeriksaan fisik.
 *
 * Mencocokkan pada batas kata dan mendahulukan nama terpanjang, sehingga
 * 'Lasegue silang' tidak tertukar dengan 'Lasegue'. Tidak memakai pencocokan
 * longgar: menampilkan cara melakukan tes yang KELIRU jauh lebih berbahaya
 * daripada tidak menampilkan apa pun.
 */
export function manuverDalam(teks: string): ManuverPF[] {
  const t = teks.toLowerCase()
  const hasil: ManuverPF[] = []
  const urut = [...MANUVER_PF].sort(
    (a, b) => Math.max(...namaCari(b).map((n) => n.length)) - Math.max(...namaCari(a).map((n) => n.length)),
  )
  let sisa = t
  for (const m of urut) {
    for (const n of namaCari(m)) {
      const pola = new RegExp(`(^|[^a-z])${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`)
      if (pola.test(sisa)) {
        hasil.push(m)
        sisa = sisa.replace(new RegExp(n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ')
        break
      }
    }
  }
  return hasil
}

export default MANUVER_PF
