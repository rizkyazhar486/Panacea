// ─────────────────────────────────────────────────────────────────────────────
// Keterampilan klinis & prosedur — langkah demi langkah, lengkap dengan alat,
// indikasi, mnemonik, dan jebakan yang sering menggugurkan nilai OSCE.
//
// CATATAN GAMBAR: seluruh diagram pada halaman ini digambar ULANG SENDIRI
// sebagai SVG (lihat src/components/SkillDiagrams.tsx). Tidak ada gambar yang
// diambil dari internet — menyalin ilustrasi buku ajar atau situs lain berarti
// mendistribusikan ulang karya berhak cipta orang lain. Diagram orisinal juga
// tetap tajam di semua ukuran layar dan mengikuti mode gelap.
//
// SUMBER: rujukan dicantumkan per keterampilan menggunakan key REFERENSI_SUMBER
// pada src/lib/skdiDiseaseNotes.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillCategory =
  | 'Pemeriksaan Fisik per Sistem'
  | 'Kegawatdaruratan'
  | 'Obstetri & Ginekologi'
  | 'Akses Vaskular & Cairan'
  | 'Injeksi & Imunisasi'
  | 'Saluran Cerna & Kemih'
  | 'Bedah Minor & Luka'
  | 'Muskuloskeletal'

export interface SkillPhase {
  fase: string
  steps: string[]
}

export interface SkillMnemonic {
  akronim: string
  /** Tiap baris: "H — Hipovolemia" */
  kepanjangan: string[]
  catatan?: string
}

export interface ClinicalSkill {
  id: string
  category: SkillCategory
  title: string
  subtitle?: string
  /** Key diagram pada SkillDiagrams.tsx */
  diagram?: 'injectionAngles' | 'ivGauges' | 'abcde' | 'suturePatterns'
  indikasi?: string[]
  kontraindikasi?: string[]
  alat?: string[]
  fases: SkillPhase[]
  mnemonics?: SkillMnemonic[]
  tips?: string[]
  komplikasi?: string[]
  referensi: string[]
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Kegawatdaruratan',
  'Obstetri & Ginekologi',
  'Akses Vaskular & Cairan',
  'Injeksi & Imunisasi',
  'Saluran Cerna & Kemih',
  'Bedah Minor & Luka',
  'Muskuloskeletal',
]

export const CLINICAL_SKILLS: ClinicalSkill[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PEMERIKSAAN FISIK PER SISTEM ORGAN
  //
  // Sebelumnya seluruh keterampilan di berkas ini adalah TINDAKAN, dan tidak
  // satu pun berupa PEMERIKSAAN. Padahal stasiun pemeriksaan fisik adalah yang
  // paling banyak jumlahnya di OSCE, dan nilainya diberikan untuk perilaku yang
  // TERLIHAT PENGUJI — urutan yang benar, sisi yang benar, dan menyebutkan apa
  // yang sedang dicari. Mahasiswa yang tahu temuannya tetapi memeriksa dengan
  // urutan acak tetap kehilangan angka.
  //
  // Urutan universalnya inspeksi, palpasi, perkusi, auskultasi — kecuali pada
  // abdomen yang auskultasinya didahulukan, karena palpasi mengubah bising usus
  // yang justru hendak dinilai.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'pf-head-to-toe',
    category: 'Pemeriksaan Fisik per Sistem',
    title: 'Pemeriksaan Fisik Umum — Head to Toe',
    subtitle: 'Kerangka menyeluruh dari kepala sampai ujung kaki, dipakai sebagai tulang punggung semua stasiun',
    indikasi: [
      'Pemeriksaan awal setiap pasien baru, rawat inap, dan medical check-up',
      'Kerangka dasar yang dipersempit menjadi pemeriksaan terarah pada stasiun bersistem tunggal',
    ],
    alat: [
      'Stetoskop, tensimeter, termometer, dan oksimeter denyut',
      'Senter kecil, spatula lidah, palu refleks, dan garpu tala',
      'Meteran, timbangan, dan pengukur tinggi badan',
      'Sarung tangan dan pengalas pemeriksaan',
    ],
    fases: [
      {
        fase: 'Pembukaan yang bernilai angka di setiap stasiun',
        steps: [
          'Cuci tangan atau pakai antiseptik SECARA TERLIHAT sebelum menyentuh pasien — nilai gratis yang paling sering terlewat.',
          'Ucapkan salam, sebutkan nama dan peran Anda, lalu konfirmasi identitas pasien dengan dua penanda.',
          'Jelaskan apa yang akan diperiksa dan mengapa, lalu MINTA IZIN secara tegas.',
          'Tanyakan apakah ada bagian yang nyeri, dan periksa bagian itu PALING AKHIR.',
          'Atur posisi dan buka pakaian seperlunya sambil menjaga privasi; tawarkan pendamping pada pemeriksaan yang sensitif.',
          'Berdiri di SISI KANAN pasien sebagai kelaziman pemeriksaan.',
        ],
      },
      {
        fase: 'Kesan umum dan tanda vital',
        steps: [
          'Kesan umum: tampak sakit ringan, sedang, atau berat; posisi tubuh; dan apakah tampak sesak maupun kesakitan.',
          'Kesadaran secara kualitatif (kompos mentis sampai koma) dan kuantitatif dengan Skala Koma Glasgow.',
          'Tekanan darah pada kedua lengan bila pertama kali diperiksa; nadi menyangkut frekuensi, irama, isi, dan kesamaan kanan-kiri.',
          'Laju napas dihitung satu menit penuh TANPA memberi tahu pasien, agar tidak dipengaruhi kesadaran diri.',
          'Suhu, saturasi oksigen, serta skala nyeri.',
          'Antropometri: berat badan, tinggi badan, indeks massa tubuh, dan lingkar perut.',
        ],
      },
      {
        fase: 'Kepala dan leher',
        steps: [
          'Kepala: bentuk, ukuran, luka, dan nyeri tekan; rambut dan kulit kepala.',
          'Mata: konjungtiva anemis, sklera ikterik, pupil bulat isokor beserta refleks cahaya langsung dan tidak langsung, serta gerak bola mata enam arah.',
          'Telinga: daun telinga, liang, membran timpani bila memakai otoskop, dan nyeri tekan tragus maupun mastoid.',
          'Hidung: deviasi septum, mukosa, sekret, dan nyeri tekan sinus frontalis serta maksilaris.',
          'Mulut dan tenggorok: bibir, mukosa, lidah, gigi, faring, dan tonsil beserta ukurannya.',
          'Leher: kelenjar getah bening submandibula, servikal, dan supraklavikula; kelenjar tiroid saat menelan; tekanan vena jugularis; dan kaku kuduk.',
        ],
      },
      {
        fase: 'Toraks — jantung dan paru',
        steps: [
          'Inspeksi: bentuk dada, kesimetrisan gerak napas, retraksi, dan iktus kordis.',
          'Palpasi: pengembangan dada kanan-kiri, fremitus taktil, dan iktus kordis menyangkut letak, kuat angkat, serta thrill.',
          'Perkusi: batas paru-hati, batas jantung, dan bandingkan sonor kanan-kiri.',
          'Auskultasi paru pada seluruh lapangan depan, samping, dan belakang secara BERSELANG KANAN-KIRI pada ketinggian yang sama.',
          'Auskultasi jantung pada empat katup dengan diafragma dan bel.',
        ],
      },
      {
        fase: 'Abdomen',
        steps: [
          'INSPEKSI lalu AUSKULTASI lalu PERKUSI lalu PALPASI. Urutannya berbeda dari bagian tubuh lain karena palpasi mengubah bising usus.',
          'Inspeksi: bentuk, jaringan parut, pelebaran vena, dan gerak dinding perut.',
          'Auskultasi bising usus minimal satu menit, dan bruit pada aorta maupun arteri renalis.',
          'Perkusi: timpani atau redup, pekak beralih pada asites, serta batas hati dan limpa.',
          'Palpasi superfisial lalu dalam, DIMULAI DARI DAERAH YANG TIDAK NYERI; nilai hati, limpa, ginjal, nyeri tekan, nyeri lepas, dan defans.',
        ],
      },
      {
        fase: 'Ekstremitas, kulit, dan punggung',
        steps: [
          'Ekstremitas: akral hangat atau dingin, pengisian kapiler, edema beserta derajat dan sifat cekungnya, sianosis, jari tabuh, dan deformitas.',
          'Nadi perifer radialis, brakialis, femoralis, poplitea, tibialis posterior, dan dorsalis pedis — bandingkan kanan dan kiri.',
          'Kulit: warna, turgor, kelembapan, ruam, dan luka termasuk daerah tertekan.',
          'Punggung: bentuk tulang belakang, nyeri ketok kostovertebra, dan nyeri tekan.',
          'Neurologis singkat berupa kekuatan motorik, sensorik kasar, dan refleks fisiologis; diperdalam bila ada keluhan.',
        ],
      },
      {
        fase: 'Penutup',
        steps: [
          'Rapikan pakaian pasien dan kembalikan ke posisi nyaman.',
          'Cuci tangan kembali secara terlihat.',
          'Sampaikan ringkasan temuan kepada pasien dengan bahasa yang ia pahami, lalu rencana selanjutnya.',
          'Ucapkan terima kasih dan tanyakan apakah ada yang ingin ditanyakan.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'IPPA',
        kepanjangan: [
          'I — Inspeksi',
          'P — Palpasi',
          'P — Perkusi',
          'A — Auskultasi',
        ],
        catatan: 'Berlaku di semua bagian tubuh KECUALI abdomen, yang urutannya menjadi Inspeksi, Auskultasi, Perkusi, Palpasi.',
      },
    ],
    tips: [
      'Sebutkan dengan suara terdengar apa yang sedang Anda cari — penguji menilai apa yang ia dengar dan lihat, bukan apa yang ada di kepala Anda.',
      'Selalu bandingkan kanan dan kiri pada ketinggian yang sama; membandingkan adalah inti pemeriksaan fisik.',
      'Daerah yang nyeri diperiksa PALING AKHIR, supaya pasien tidak menegang sepanjang sisa pemeriksaan.',
      'Hangatkan tangan dan stetoskop lebih dahulu; tangan dingin membuat pasien menegang dan hasil palpasi menjadi keliru.',
    ],
    referensi: ['SKDI2012', 'PPKFKTP2014'],
  },
  {
    id: 'pf-jantung',
    category: 'Pemeriksaan Fisik per Sistem',
    title: 'Pemeriksaan Jantung',
    subtitle: 'Empat katup, tekanan vena jugularis, dan tanda gagal jantung',
    alat: [
      'Stetoskop dengan diafragma dan bel',
      'Tensimeter',
      'Penggaris untuk mengukur tekanan vena jugularis',
    ],
    fases: [
      {
        fase: 'Posisi dan inspeksi',
        steps: [
          'Baringkan pasien dengan kepala terangkat 30-45 derajat, dada terbuka, dan pemeriksa berdiri di sisi kanan.',
          'Inspeksi dari ujung ke pusat: jari tabuh, splinter haemorrhage, dan sianosis perifer pada tangan; xanthelasma, sianosis sentral, serta konjungtiva pucat pada wajah.',
          'Inspeksi dada: bentuk, jaringan parut bekas operasi, dan iktus kordis yang terlihat.',
          'Nilai tekanan vena jugularis pada sudut 45 derajat, diukur vertikal dari sudut sternum; lebih dari 4 cm menandakan peninggian.',
        ],
      },
      {
        fase: 'Palpasi',
        steps: [
          'Cari iktus kordis; normalnya di sela iga kelima garis midklavikula kiri seluas satu ujung jari.',
          'Nilai apakah iktus BERGESER yang menandakan pembesaran ventrikel kiri, KUAT ANGKAT yang menandakan hipertrofi, maupun MELEBAR.',
          'Raba thrill pada tiap katup — thrill selalu berarti bising derajat empat atau lebih.',
          'Raba heaving parasternal kiri sebagai tanda hipertrofi ventrikel kanan.',
          'Raba nadi karotis untuk menilai bentuk gelombangnya, lalu periksa nadi perifer beserta kesamaannya.',
        ],
      },
      {
        fase: 'Auskultasi empat katup',
        steps: [
          'AORTA di sela iga kedua garis parasternal KANAN.',
          'PULMONAL di sela iga kedua garis parasternal KIRI.',
          'TRIKUSPID di sela iga keempat sampai kelima garis parasternal kiri bawah.',
          'MITRAL di sela iga kelima garis midklavikula kiri, yaitu pada iktus kordis.',
          'Pakai DIAFRAGMA untuk bunyi bernada tinggi seperti bising sistolik, S1, dan S2; pakai BEL untuk bernada rendah seperti S3, S4, dan stenosis mitral.',
          'Pada tiap titik: kenali S1 dan S2, cari bunyi tambahan, lalu tentukan waktu bising terhadap siklus dengan meraba nadi karotis bersamaan.',
        ],
      },
      {
        fase: 'Manuver penajam',
        steps: [
          'Miringkan pasien ke KIRI lalu dengarkan dengan bel di apeks — menajamkan bising stenosis mitral dan S3.',
          'Dudukkan pasien lalu condongkan ke depan, minta membuang napas dan menahannya, dengarkan di tepi sternum kiri — menajamkan bising regurgitasi aorta.',
          'Nilai penjalaran: bising stenosis aorta menjalar ke karotis, sedangkan regurgitasi mitral menjalar ke aksila.',
        ],
      },
      {
        fase: 'Tanda gagal jantung dan penutup',
        steps: [
          'Auskultasi basal paru untuk ronki halus.',
          'Palpasi hati untuk hepatomegali dan refluks hepatojugular.',
          'Periksa edema tungkai serta daerah sakrum pada pasien yang berbaring lama.',
          'Rapikan pasien, cuci tangan, dan sampaikan temuan.',
        ],
      },
    ],
    tips: [
      'Selalu raba nadi karotis SAAT auskultasi untuk menentukan bising itu sistolik atau diastolik — tanpa itu penentuan waktunya hanya tebakan.',
      'Bising yang disertai thrill sudah pasti derajat empat atau lebih; menyebut derajat tanpa meraba thrill adalah kesalahan yang mudah terlihat penguji.',
    ],
    referensi: ['SKDI2012', 'BRAUNWALD2022'],
  },
  {
    id: 'pf-paru',
    category: 'Pemeriksaan Fisik per Sistem',
    title: 'Pemeriksaan Paru',
    subtitle: 'Depan, samping, dan belakang — selalu membandingkan kanan dan kiri',
    alat: [
      'Stetoskop',
      'Pita ukur untuk lingkar dada bila diperlukan',
    ],
    fases: [
      {
        fase: 'Inspeksi',
        steps: [
          'Bentuk dada: normal, barrel chest, pektus ekskavatum, maupun kifoskoliosis.',
          'Pola dan laju napas, pemakaian otot bantu napas, retraksi sela iga dan suprasternal, serta napas cuping hidung.',
          'Kesimetrisan gerak napas kanan dan kiri; sisi yang tertinggal menandakan kelainan pada sisi itu.',
          'Cari jaringan parut, pelebaran vena dada, dan jari tabuh.',
        ],
      },
      {
        fase: 'Palpasi',
        steps: [
          'Nilai pengembangan dada dengan kedua ibu jari bertemu di garis tengah punggung, lalu minta pasien menarik napas dalam — kedua ibu jari harus menjauh sama besar.',
          'FREMITUS TAKTIL: minta pasien mengucapkan tujuh puluh tujuh berulang sambil telapak tangan dipindah berselang kanan-kiri pada ketinggian sama. MENINGKAT pada konsolidasi, MENURUN pada efusi, pneumotoraks, dan penebalan pleura.',
          'Raba nyeri tekan, krepitasi subkutis, dan posisi trakea di suprasternal — trakea terdorong menjauh pada pneumotoraks tekanan dan efusi masif, tertarik mendekat pada atelektasis.',
        ],
      },
      {
        fase: 'Perkusi',
        steps: [
          'Perkusi BERSELANG KANAN-KIRI pada ketinggian yang sama, dari puncak ke basal, di depan lalu di belakang.',
          'Sonor adalah normal; REDUP menandakan konsolidasi maupun efusi; HIPERSONOR menandakan pneumotoraks maupun emfisema.',
          'Tentukan batas paru-hati di garis midklavikula kanan, lalu nilai peranjakan diafragma saat napas dalam.',
        ],
      },
      {
        fase: 'Auskultasi',
        steps: [
          'Minta pasien bernapas dalam lewat MULUT, lalu dengarkan berselang kanan-kiri pada ketinggian sama di seluruh lapangan.',
          'Nilai suara napas dasar: vesikuler yang normal, bronkial, maupun melemah sampai menghilang.',
          'Cari suara tambahan berupa ronki basah halus maupun kasar, ronki kering atau wheezing, dan pleural friction rub.',
          'Bila dicurigai konsolidasi, nilai bronkofoni, egofoni, dan bisikan pektoriloquy.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Pola temuan yang khas',
        kepanjangan: [
          'KONSOLIDASI — fremitus meningkat, perkusi redup, suara napas bronkial',
          'EFUSI PLEURA — fremitus menurun, perkusi redup, suara napas menghilang',
          'PNEUMOTORAKS — fremitus menurun, perkusi hipersonor, suara napas menghilang',
          'ATELEKTASIS — fremitus menurun, perkusi redup, trakea TERTARIK ke sisi sakit',
        ],
        catatan: 'Yang membedakan efusi dari pneumotoraks adalah PERKUSINYA; yang membedakan atelektasis dari efusi adalah ARAH DEVIASI TRAKEA.',
      },
    ],
    tips: [
      'Selalu bandingkan kanan-kiri pada ketinggian yang SAMA — memeriksa seluruh sisi kanan lalu seluruh sisi kiri membuat perbedaan halus terlewat.',
      'Jangan lupa memeriksa punggung; sebagian besar lapangan paru justru berada di belakang.',
    ],
    referensi: ['SKDI2012', 'GOLD2024'],
  },
  {
    id: 'pf-abdomen',
    category: 'Pemeriksaan Fisik per Sistem',
    title: 'Pemeriksaan Abdomen',
    subtitle: 'Urutannya berbeda: inspeksi, auskultasi, perkusi, baru palpasi',
    alat: [
      'Stetoskop',
      'Pita ukur untuk lingkar perut',
    ],
    fases: [
      {
        fase: 'Posisi dan inspeksi',
        steps: [
          'Baringkan pasien telentang dengan lutut sedikit ditekuk dan tangan di samping badan — posisi ini melemaskan dinding perut.',
          'Buka dari batas bawah dada sampai simfisis pubis sambil menjaga privasi.',
          'Inspeksi bentuk apakah datar, cembung, maupun cekung; jaringan parut, striae, pelebaran vena, benjolan, dan gerak dinding perut saat bernapas.',
          'Perhatikan pulsasi di epigastrium serta tanda Cullen maupun Grey Turner pada perdarahan retroperitoneal.',
        ],
      },
      {
        fase: 'Auskultasi — SEBELUM palpasi',
        steps: [
          'Dengarkan bising usus minimal SATU MENIT sebelum menyimpulkan menurun, dan sampai tiga menit sebelum menyatakan menghilang.',
          'Nilai sifatnya: normal, meningkat dan metalik pada obstruksi mekanik dini, maupun menghilang pada ileus paralitik dan peritonitis.',
          'Cari bruit pada aorta, arteri renalis, dan arteri iliaka.',
          'Alasan auskultasi didahulukan: palpasi merangsang usus dan mengubah bising yang hendak dinilai.',
        ],
      },
      {
        fase: 'Perkusi',
        steps: [
          'Perkusi seluruh kuadran; timpani adalah normal karena usus berisi gas.',
          'Tentukan batas atas dan bawah hati di garis midklavikula kanan, lalu ukur rentang pekaknya.',
          'Perkusi limpa di ruang Traube; pekak menandakan pembesaran.',
          'Bila dicurigai asites, cari PEKAK BERALIH dengan memiringkan pasien, dan uji gelombang cairan pada asites masif.',
        ],
      },
      {
        fase: 'Palpasi',
        steps: [
          'MULAI DARI KUADRAN YANG PALING JAUH DARI NYERI. Memulai di titik nyeri membuat pasien menegang sehingga sisa pemeriksaan tidak dapat dinilai.',
          'Palpasi superfisial seluruh kuadran untuk nyeri tekan, defans muskular, dan massa dangkal — perhatikan WAJAH PASIEN, bukan tangan Anda.',
          'Palpasi dalam untuk massa dan organ.',
          'HATI: mulai dari fosa iliaka kanan naik ke arah iga sambil pasien menarik napas dalam; nilai tepi, permukaan, dan nyeri tekan.',
          'LIMPA: dari fosa iliaka kanan menuju iga kiri; bila tidak teraba, ulangi dengan pasien miring ke kanan.',
          'GINJAL: dengan teknik ballotement dua tangan pada kedua sisi.',
          'Nilai nyeri lepas, tanda Murphy pada kolesistitis, serta titik McBurney beserta tanda Rovsing, psoas, dan obturator pada apendisitis.',
        ],
      },
      {
        fase: 'Pelengkap',
        steps: [
          'Periksa seluruh lubang hernia inguinal, femoral, dan umbilikal, saat berbaring dan saat mengejan.',
          'Nyeri ketok kostovertebra untuk kelainan ginjal.',
          'Colok dubur bila ada indikasi, dengan penjelasan dan izin tersendiri.',
          'Rapikan pasien, cuci tangan, dan sampaikan temuan.',
        ],
      },
    ],
    tips: [
      'Urutan inspeksi, auskultasi, perkusi, palpasi pada abdomen adalah pertanyaan ujian yang paling sering keluar sekaligus paling sering dijawab keliru.',
      'Perhatikan wajah pasien selama palpasi — nyeri lebih dulu terlihat di wajah daripada terdengar dari mulut.',
    ],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  {
    id: 'pf-neurologis',
    category: 'Pemeriksaan Fisik per Sistem',
    title: 'Pemeriksaan Neurologis',
    subtitle: 'Kesadaran, saraf kranial, motorik, sensorik, refleks, koordinasi, dan rangsang meningeal',
    alat: [
      'Palu refleks',
      'Senter kecil',
      'Garpu tala 128 Hz dan 512 Hz',
      'Jarum tumpul, kapas, serta tabung air hangat dan dingin',
    ],
    fases: [
      {
        fase: 'Kesadaran dan fungsi luhur',
        steps: [
          'Kesadaran kualitatif dan Skala Koma Glasgow dengan mata 1 sampai 4, verbal 1 sampai 5, dan motorik 1 sampai 6.',
          'Orientasi terhadap waktu, tempat, dan orang.',
          'Bila ada gangguan bicara, bedakan AFASIA yang merupakan gangguan bahasa dari DISARTRIA yang merupakan gangguan artikulasi — uji kelancaran, pemahaman, pengulangan, dan penamaan.',
        ],
      },
      {
        fase: 'Dua belas saraf kranial',
        steps: [
          'I Olfaktorius: penciuman tiap lubang hidung dengan bahan yang tidak merangsang.',
          'II Optikus: tajam penglihatan, lapang pandang konfrontasi, dan funduskopi.',
          'III, IV, dan VI: gerak bola mata enam arah, ptosis, pupil, serta refleks cahaya langsung dan tidak langsung.',
          'V Trigeminus: sensorik wajah tiga cabang, kekuatan otot kunyah, dan refleks kornea.',
          'VII Fasialis: minta mengangkat alis, memejamkan mata kuat, dan menyeringai. DAHI IKUT TERKENA menandakan lesi PERIFER, sedangkan dahi terkecuali menandakan lesi SENTRAL — pembeda yang paling sering ditanyakan.',
          'VIII Vestibulokoklearis: uji bisik, uji Rinne dan Weber, serta keseimbangan.',
          'IX dan X: refleks muntah, elevasi palatum, dan uvula yang terdorong ke sisi sehat.',
          'XI Aksesorius: kekuatan sternokleidomastoideus dan trapezius melawan tahanan.',
          'XII Hipoglosus: julurkan lidah; deviasinya mengarah ke sisi LESI.',
        ],
      },
      {
        fase: 'Motorik',
        steps: [
          'Inspeksi atrofi, fasikulasi, dan gerakan involunter.',
          'Tonus dinilai saat gerakan pasif: menurun pada lesi neuron motorik bawah, meningkat spastik pada lesi atas, dan rigiditas pada gangguan ekstrapiramidal.',
          'Kekuatan dengan skala 0 sampai 5 pada tiap kelompok otot, dibandingkan kanan dan kiri.',
          'Uji tahan lengan lurus dengan mata tertutup untuk mendeteksi kelemahan ringan.',
        ],
      },
      {
        fase: 'Sensorik, refleks, dan koordinasi',
        steps: [
          'Sensorik: raba halus, nyeri tumpul, suhu, getar dengan garpu tala 128 Hz, dan rasa posisi sendi. Bandingkan kanan-kiri serta ujung dan pangkal; tentukan batas setinggi dermatom bila ada.',
          'Refleks fisiologis bisep, trisep, brakioradialis, patella, dan Achilles; nilai dengan skala 0 sampai 4 plus dan bandingkan kedua sisi.',
          'Refleks patologis Babinski dan kelompoknya; positif menandakan lesi neuron motorik atas.',
          'Koordinasi: telunjuk-hidung, tumit-lutut, gerak berganti cepat, dan uji Romberg.',
          'Cara berjalan: pola langkah, ayunan lengan, dan jalan tandem.',
        ],
      },
      {
        fase: 'Rangsang meningeal',
        steps: [
          'Kaku kuduk dinilai dengan menekuk leher secara pasif; adanya tahanan menandakan positif.',
          'Tanda Brudzinski I: fleksi leher menimbulkan fleksi kedua tungkai.',
          'Tanda Brudzinski II: fleksi satu tungkai menimbulkan fleksi tungkai lainnya.',
          'Tanda Kernig: tungkai difleksikan 90 derajat lalu diluruskan; tahanan sebelum 135 derajat menandakan positif.',
          'Rangsang meningeal WAJIB diperiksa pada setiap demam yang disertai nyeri kepala maupun penurunan kesadaran.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Lesi atas dan lesi bawah',
        kepanjangan: [
          'NEURON MOTORIK ATAS — tonus meningkat, refleks meningkat, Babinski positif, atrofi minimal',
          'NEURON MOTORIK BAWAH — tonus menurun, refleks menurun, Babinski negatif, atrofi dan fasikulasi jelas',
        ],
      },
    ],
    tips: [
      'Pemeriksaan neurologis lengkap itu panjang; pada stasiun berbatas waktu, sebutkan bahwa Anda akan memeriksa secara terarah beserta alasannya.',
      'Selalu bandingkan kanan dan kiri — hampir seluruh temuan neurologis bermakna karena perbedaannya, bukan karena nilai mutlaknya.',
    ],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'apn-60',
    category: 'Obstetri & Ginekologi',
    title: 'Asuhan Persalinan Normal — 60 Langkah',
    subtitle: 'Standar APN Kemenkes; station OSCE paling panjang dan paling sering diuji',
    indikasi: [
      'Persalinan aterm (37-42 minggu) dengan presentasi belakang kepala',
      'Janin tunggal hidup, taksiran berat janin normal',
      'Tidak ada tanda gawat janin, disproporsi, atau penyulit lain',
    ],
    kontraindikasi: [
      'Malpresentasi (letak lintang, sungsang pada penolong tidak terlatih)',
      'Plasenta previa dan vasa previa',
      'Disproporsi kepala panggul',
      'Gawat janin, prolaps tali pusat, ruptur uteri mengancam',
      'Bekas seksio sesarea dengan indikasi menetap — rujuk',
    ],
    alat: [
      'Partus set: klem tali pusat 2, gunting tali pusat, gunting episiotomi, ½ kocher, kateter nekaton, benang tali pusat',
      'Hecting set: needle holder, pinset chirurgis, gunting benang, jarum dan benang kromik 2-0/3-0',
      'Obat: oksitosin 10 IU minimal 3 ampul, lidokain 1% tanpa epinefrin, metilergometrin, cairan infus RL',
      'Spuit 3 mL dan 5 mL, sarung tangan steril 2 pasang, kateter urin',
      'Alat resusitasi bayi: balon dan sungkup, penghisap lendir DeLee, meja resusitasi dengan lampu penghangat',
      'APD lengkap: celemek, masker, kacamata pelindung, sepatu tertutup',
      'Handuk bersih 3 (mengeringkan bayi, ganti, alas perut ibu), kain bersih, pembalut, tempat plasenta, larutan klorin 0,5%',
    ],
    fases: [
      {
        fase: 'I. Mengenali gejala dan tanda kala dua (langkah 1-2)',
        steps: [
          '1. Mendengar dan melihat tanda kala dua: ibu merasa ada dorongan kuat untuk meneran, ibu merasakan tekanan yang semakin meningkat pada rektum dan vagina, perineum menonjol, vulva dan sfingter ani membuka.',
          '2. Memastikan kelengkapan alat, bahan, dan obat esensial. Mematahkan ampul oksitosin dan memasukkan spuit sekali pakai ke dalam partus set.',
        ],
      },
      {
        fase: 'II. Menyiapkan pertolongan persalinan (langkah 3-9)',
        steps: [
          '3. Memakai celemek plastik yang bersih.',
          '4. Melepaskan dan menyimpan semua perhiasan, mencuci tangan dengan sabun di bawah air mengalir, mengeringkan dengan handuk pribadi yang bersih dan kering.',
          '5. Memakai sarung tangan steril pada tangan yang akan digunakan untuk pemeriksaan dalam.',
          '6. Mengisap oksitosin 10 IU ke dalam spuit dengan teknik satu tangan dan meletakkannya kembali ke partus set tanpa mengontaminasi spuit.',
          '7. Membersihkan vulva dan perineum dengan kapas basah dari arah depan ke belakang.',
          '8. Melakukan pemeriksaan dalam untuk memastikan pembukaan sudah lengkap.',
          '9. Mendekontaminasi sarung tangan dengan mencelupkan tangan bersarung ke larutan klorin 0,5%, melepaskan dalam keadaan terbalik, dan merendamnya selama 10 menit. Mencuci tangan.',
        ],
      },
      {
        fase: 'III. Memastikan pembukaan lengkap dan janin baik (langkah 10-11)',
        steps: [
          '10. Memeriksa denyut jantung janin setelah kontraksi berakhir dan memastikan nilainya dalam batas normal 120-160 kali per menit.',
          '11. Memberi tahu ibu bahwa pembukaan sudah lengkap dan keadaan janin baik, lalu membantu ibu menemukan posisi yang nyaman dan sesuai keinginannya.',
        ],
      },
      {
        fase: 'IV. Menyiapkan ibu dan keluarga untuk membantu meneran (langkah 12-16)',
        steps: [
          '12. Meminta bantuan keluarga untuk menyiapkan posisi ibu meneran.',
          '13. Melakukan bimbingan meneran saat ibu merasakan dorongan kuat untuk meneran: menganjurkan meneran mengikuti dorongan alamiah, tidak menahan napas saat meneran, dan beristirahat di antara kontraksi.',
          '14. Menganjurkan ibu berjalan, berjongkok, atau mengambil posisi nyaman lain bila ibu belum merasakan dorongan meneran dalam 60 menit.',
          '15. Meletakkan handuk bersih di perut ibu untuk mengeringkan bayi bila kepala bayi telah membuka vulva dengan diameter 5-6 cm.',
          '16. Meletakkan kain bersih yang dilipat sepertiga bagian di bawah bokong ibu.',
        ],
      },
      {
        fase: 'V. Persiapan pertolongan kelahiran bayi (langkah 17-18)',
        steps: [
          '17. Membuka tutup partus set dan memeriksa kembali kelengkapan alat dan bahan.',
          '18. Memakai sarung tangan steril pada kedua tangan.',
        ],
      },
      {
        fase: 'VI. Menolong kelahiran bayi (langkah 19-27)',
        steps: [
          '19. Setelah tampak kepala bayi dengan diameter 5-6 cm membuka vulva, melindungi perineum dengan satu tangan yang dialasi kain bersih, dan tangan lain menahan kepala bayi untuk menahan posisi defleksi serta membantu lahirnya kepala. Menganjurkan ibu meneran perlahan atau bernapas cepat dan dangkal.',
          '20. Memeriksa kemungkinan adanya lilitan tali pusat. Bila lilitan longgar, melonggarkan melewati kepala bayi; bila lilitan erat, mengeklem tali pusat di dua tempat lalu memotong di antaranya.',
          '21. Menunggu hingga kepala bayi melakukan putaran paksi luar secara spontan.',
          '22. Setelah kepala melakukan putaran paksi luar, memegang kepala secara biparietal. Menganjurkan ibu meneran saat kontraksi. Dengan lembut menggerakkan kepala ke arah bawah untuk melahirkan bahu depan, lalu ke arah atas untuk melahirkan bahu belakang.',
          '23. Setelah kedua bahu lahir, menggeser tangan bawah untuk menyangga kepala dan lengan, dan menggunakan tangan atas untuk menelusuri dan memegang lengan serta siku sebelah atas.',
          '24. Setelah tubuh dan lengan lahir, menelusurkan tangan atas dari punggung ke arah kaki bayi untuk menyangganya saat punggung dan kaki lahir. Memegang kedua mata kaki dengan ibu jari dan jari lainnya.',
          '25. Melakukan penilaian selintas: apakah bayi cukup bulan, apakah bayi menangis kuat dan bernapas tanpa kesulitan, apakah bayi bergerak aktif.',
          '26. Mengeringkan tubuh bayi mulai dari muka, kepala, dan bagian tubuh lain KECUALI kedua tangan, tanpa membersihkan verniks. Mengganti handuk basah dengan handuk kering, dan membiarkan bayi di atas perut ibu.',
          '27. Memeriksa kembali uterus untuk memastikan tidak ada bayi kedua.',
        ],
      },
      {
        fase: 'VII. Manajemen aktif kala tiga (langkah 28-40)',
        steps: [
          '28. Memberi tahu ibu bahwa ia akan disuntik oksitosin agar uterus berkontraksi dengan baik.',
          '29. Dalam waktu 1 menit setelah bayi lahir, menyuntikkan oksitosin 10 IU secara intramuskular di sepertiga paha atas bagian lateral, setelah melakukan aspirasi terlebih dahulu.',
          '30. Setelah 2 menit sejak bayi lahir, mengeklem tali pusat sekitar 3 cm dari pusat bayi. Mendorong isi tali pusat ke arah ibu dan memasang klem kedua 2 cm dari klem pertama.',
          '31. Memotong dan mengikat tali pusat: memegang tali pusat di antara dua klem sambil melindungi perut bayi, memotong di antara kedua klem, lalu mengikat tali pusat dengan benang steril.',
          '32. Meletakkan bayi tengkurap di dada ibu untuk INISIASI MENYUSU DINI, dengan kontak kulit ke kulit, diselimuti dan diberi topi, selama minimal 1 jam.',
          '33. Memindahkan klem pada tali pusat hingga berjarak 5-10 cm dari vulva.',
          '34. Meletakkan satu tangan di atas simfisis untuk mendeteksi kontraksi, dan tangan lain memegang klem untuk melakukan peregangan tali pusat terkendali.',
          '35. Setelah uterus berkontraksi, melakukan peregangan tali pusat terkendali dengan tangan lain mendorong uterus ke arah dorso-kranial (DORONGAN DORSO-KRANIAL — bukan menekan fundus).',
          '36. Melakukan peregangan dan dorongan dorso-kranial hingga plasenta terlepas, lalu meminta ibu meneran sambil menarik tali pusat sejajar lantai kemudian ke arah atas mengikuti poros jalan lahir.',
          '37. Setelah plasenta tampak di introitus vagina, melahirkan plasenta dengan kedua tangan, memegang dan memutar plasenta hingga selaput ketuban terpilin, lalu melahirkannya dengan hati-hati.',
          '38. Segera setelah plasenta lahir, melakukan MASASE UTERUS dengan meletakkan telapak tangan di fundus dan menggosok dengan gerakan melingkar hingga uterus berkontraksi (fundus teraba keras) selama 15 detik.',
          '39. Memeriksa kedua sisi plasenta baik bagian maternal maupun fetal, memastikan kotiledon dan selaput ketuban LENGKAP, lalu memasukkannya ke dalam kantong plastik atau tempat khusus.',
          '40. Mengevaluasi kemungkinan laserasi pada vagina dan perineum, serta melakukan penjahitan bila laserasi menyebabkan perdarahan aktif.',
        ],
      },
      {
        fase: 'VIII. Menilai perdarahan dan asuhan pascapersalinan (langkah 41-60)',
        steps: [
          '41. Memastikan uterus berkontraksi dengan baik dan tidak terjadi perdarahan pervaginam.',
          '42. Membiarkan bayi tetap melakukan kontak kulit ke kulit di dada ibu selama minimal 1 jam.',
          '43. Setelah 1 jam, melakukan penimbangan dan pengukuran bayi, memberi tetes mata antibiotik profilaksis, dan menyuntikkan vitamin K1 1 mg intramuskular di paha kiri anterolateral.',
          '44. Setelah 1 jam pemberian vitamin K1, memberikan suntikan imunisasi hepatitis B di paha kanan anterolateral.',
          '45. Melanjutkan pemantauan kontraksi uterus dan mencegah perdarahan pervaginam: setiap 15 menit pada 1 jam pertama dan setiap 20-30 menit pada jam kedua pascapersalinan.',
          '46. Mengajarkan ibu dan keluarga cara melakukan masase uterus dan menilai kontraksi.',
          '47. Mengevaluasi dan mengestimasi jumlah kehilangan darah.',
          '48. Memeriksa nadi ibu dan keadaan kandung kemih setiap 15 menit pada 1 jam pertama dan setiap 30 menit pada jam kedua.',
          '49. Memeriksa kembali kondisi bayi untuk memastikan bayi bernapas dengan baik (40-60 kali per menit) serta suhu tubuh normal (36,5-37,5 °C).',
          '50. Menempatkan semua peralatan bekas pakai dalam larutan klorin 0,5% untuk dekontaminasi selama 10 menit, lalu mencuci dan membilasnya.',
          '51. Membuang bahan-bahan yang terkontaminasi ke tempat sampah yang sesuai.',
          '52. Membersihkan ibu dengan air disinfeksi tingkat tinggi, membersihkan sisa cairan ketuban, lendir, dan darah, lalu membantu ibu memakai pakaian yang bersih dan kering.',
          '53. Memastikan ibu merasa nyaman, membantu ibu memberikan ASI, dan menganjurkan keluarga memberi ibu minuman dan makanan yang diinginkan.',
          '54. Mendekontaminasi tempat bersalin dengan larutan klorin 0,5%.',
          '55. Mencelupkan sarung tangan kotor ke dalam larutan klorin 0,5%, melepaskan dalam keadaan terbalik, dan merendamnya selama 10 menit.',
          '56. Mencuci kedua tangan dengan sabun di bawah air mengalir dan mengeringkannya.',
          '57. Melengkapi partograf pada halaman depan dan belakang, memeriksa tanda vital dan asuhan kala empat.',
          '58. (Pemantauan lanjutan) Memastikan seluruh pemantauan kala empat tercatat lengkap termasuk tekanan darah, nadi, suhu, tinggi fundus, kontraksi, kandung kemih, dan perdarahan.',
          '59. (Edukasi) Memberikan konseling tanda bahaya masa nifas kepada ibu dan keluarga, perawatan bayi, ASI eksklusif, serta jadwal kunjungan ulang.',
          '60. (Dokumentasi) Melengkapi seluruh dokumentasi rekam medis dan buku KIA.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Tanda kala dua — "DOR-TEK-NOL-KA"',
        kepanjangan: [
          'DOR — Dorongan meneran yang kuat',
          'TEK — TEKanan pada anus/rektum meningkat',
          'NOL — periNeum menONjol',
          'KA — vulva dan sfingter ani memBUKA',
        ],
      },
      {
        akronim: 'Manajemen aktif kala tiga — "OPM"',
        kepanjangan: [
          'O — Oksitosin 10 IU IM dalam 1 menit setelah bayi lahir',
          'P — Peregangan tali pusat terkendali dengan dorongan dorso-kranial',
          'M — Masase uterus 15 detik segera setelah plasenta lahir',
        ],
        catatan: 'Tiga langkah ini terbukti menurunkan perdarahan pascapersalinan dan hampir selalu menjadi poin kritis penilaian di OSCE.',
      },
      {
        akronim: 'Penilaian selintas bayi baru lahir — 3 pertanyaan',
        kepanjangan: [
          '1 — Apakah bayi cukup bulan?',
          '2 — Apakah bayi menangis kuat / bernapas tanpa kesulitan?',
          '3 — Apakah bayi bergerak aktif?',
        ],
        catatan: 'Bila salah satu jawabannya TIDAK, segera lakukan langkah awal resusitasi neonatus.',
      },
    ],
    tips: [
      'Suntik oksitosin dalam 1 MENIT setelah bayi lahir — bukan setelah plasenta lahir. Ini kesalahan urutan yang paling sering terjadi.',
      'Dorongan pada uterus adalah DORSO-KRANIAL, bukan menekan fundus ke bawah. Menekan fundus berisiko inversio uteri.',
      'Jangan memotong tali pusat terlalu dini — tunggu sekitar 2 menit atau hingga pulsasi berhenti, kecuali bayi memerlukan resusitasi segera.',
      'Verniks JANGAN dibersihkan; berfungsi sebagai pelindung dan penghangat alami kulit bayi.',
      'Vitamin K1 dan hepatitis B disuntikkan di paha yang BERBEDA dan berjarak 1 jam.',
      'Periksa kelengkapan plasenta dengan teliti — sisa kotiledon adalah penyebab perdarahan pascapersalinan dan subinvolusi.',
      'Verbalisasikan setiap langkah dengan lantang saat OSCE; penguji menilai apa yang terlihat dan terdengar, bukan yang Anda pikirkan.',
    ],
    komplikasi: [
      'Perdarahan pascapersalinan akibat atonia uteri, retensio plasenta, atau laserasi jalan lahir',
      'Inversio uteri akibat traksi tali pusat berlebihan atau penekanan fundus yang salah',
      'Ruptur perineum derajat 3-4 bila perineum tidak dilindungi dengan baik',
      'Asfiksia neonatorum bila resusitasi terlambat',
      'Infeksi akibat pelanggaran teknik aseptik',
    ],
    referensi: ['POGI2016', 'WILLIAMSOB2022', 'WHOPPH2012', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'atls-abcde',
    category: 'Kegawatdaruratan',
    title: 'ATLS — Primary Survey ABCDE',
    subtitle: 'Penilaian awal pasien trauma; temukan dan atasi yang mematikan lebih dahulu',
    diagram: 'abcde',
    indikasi: ['Semua pasien trauma', 'Pasien kritis dengan mekanisme cedera bermakna'],
    alat: [
      'APD lengkap: sarung tangan, masker, kacamata pelindung, apron',
      'Collar neck, long spine board, head block dan tali fiksasi',
      'Alat jalan napas: OPA, NPA, laringoskop, ETT, bag-valve-mask, suction',
      'Oksigen dengan non-rebreathing mask',
      'Akses IV: kanula besar (14-16 G) 2 buah, cairan kristaloid hangat',
      'Monitor, pulse oximeter, tensimeter, stetoskop',
      'Alat torakostomi (chest tube), needle decompression, USG FAST bila tersedia',
    ],
    fases: [
      {
        fase: 'Persiapan & Triase',
        steps: [
          'Pakai APD lengkap sebelum menyentuh pasien.',
          'Terima informasi dari pra-rumah sakit: mekanisme cedera, tanda vital, tindakan yang sudah diberikan.',
          'Siapkan tim dan pembagian peran; pastikan alat siap pakai.',
        ],
      },
      {
        fase: 'A — Airway dengan proteksi servikal',
        steps: [
          'Nilai patensi jalan napas: ajak pasien bicara. Pasien yang dapat menjawab dengan suara jelas menandakan jalan napas paten, ventilasi cukup, dan perfusi otak memadai.',
          'Cari tanda obstruksi: stridor, suara serak, gurgling, benda asing, darah, muntahan, cedera wajah, dan luka bakar jalan napas (bulu hidung terbakar, sputum jelaga, suara serak).',
          'Bebaskan jalan napas dengan JAW THRUST (bukan head tilt-chin lift, karena harus mempertahankan imobilisasi servikal), suction, dan pasang OPA atau NPA.',
          'IMOBILISASI SERVIKAL secara manual sejak awal, lalu pasang collar neck dan head block — pertahankan hingga cedera servikal disingkirkan.',
          'Jalan napas definitif (intubasi) bila: GCS ≤8, jalan napas tidak dapat dipertahankan, gagal napas, atau risiko obstruksi progresif seperti luka bakar inhalasi.',
        ],
      },
      {
        fase: 'B — Breathing dan ventilasi',
        steps: [
          'Buka pakaian dada, lalu lakukan inspeksi, palpasi, perkusi, dan auskultasi.',
          'Berikan oksigen aliran tinggi dengan non-rebreathing mask 10-15 L/menit dan pasang pulse oximeter.',
          'Hitung frekuensi napas, nilai simetrisitas gerak dada, jejas, luka terbuka, dan penggunaan otot bantu napas.',
          'CARI DAN ATASI SEGERA enam kondisi yang mengancam nyawa pada breathing: tension pneumothorax, open pneumothorax (sucking chest wound), massive haemothorax, flail chest dengan kontusio paru, dan tamponade jantung.',
          'TENSION PNEUMOTHORAX adalah diagnosis KLINIS — jangan menunggu rontgen. Lakukan needle decompression segera di ICS 5 linea aksilaris anterior (atau ICS 2 linea midklavikula), dilanjutkan pemasangan WSD.',
          'Open pneumothorax: tutup luka dengan kasa kedap tiga sisi (three-sided dressing) agar udara dapat keluar namun tidak masuk.',
        ],
      },
      {
        fase: 'C — Circulation dengan kontrol perdarahan',
        steps: [
          'Nilai perfusi: tingkat kesadaran, warna dan suhu kulit, capillary refill time, serta nadi (frekuensi, kualitas, keteraturan).',
          'KONTROL PERDARAHAN EKSTERNAL dengan penekanan langsung; gunakan tourniquet pada perdarahan ekstremitas yang tidak terkontrol.',
          'Pasang DUA akses intravena berukuran besar (14-16 G) pada vena antekubiti; ambil sampel darah termasuk golongan darah dan crossmatch saat memasang.',
          'Berikan cairan kristaloid HANGAT 1 liter (dewasa) atau 20 mL/kgBB (anak) sebagai bolus awal, lalu nilai respons. Pertimbangkan transfusi darah dini pada perdarahan masif.',
          'Cari LIMA sumber perdarahan tersembunyi: rongga dada, rongga abdomen, retroperitoneum/pelvis, tulang panjang (femur), dan perdarahan eksternal di lantai — dikenal sebagai "blood on the floor and four more".',
          'Gunakan USG FAST dan foto toraks serta pelvis untuk mencari sumber perdarahan; pasang pelvic binder bila dicurigai fraktur pelvis.',
          'Tamponade jantung: trias Beck berupa hipotensi, distensi vena leher, dan bunyi jantung menjauh — memerlukan perikardiosentesis atau torakotomi.',
        ],
      },
      {
        fase: 'D — Disability (status neurologis)',
        steps: [
          'Nilai GCS (mata, verbal, motorik) dan catat nilainya.',
          'Periksa PUPIL: ukuran, simetri, dan refleks cahaya. Pupil dilatasi unilateral yang tidak reaktif mengarah pada herniasi unkal dan merupakan kedaruratan bedah saraf.',
          'Nilai gerakan keempat ekstremitas dan cari tanda lateralisasi.',
          'Periksa gula darah — hipoglikemia dapat menyerupai cedera kepala.',
          'Ingat bahwa hipoksia dan hipotensi merupakan penyebab penurunan kesadaran yang harus dikoreksi lebih dahulu sebelum menyimpulkan adanya cedera otak.',
        ],
      },
      {
        fase: 'E — Exposure dan kontrol lingkungan',
        steps: [
          'Buka seluruh pakaian pasien untuk pemeriksaan menyeluruh, termasuk log roll untuk memeriksa punggung dengan menjaga kesegarisan tulang belakang.',
          'CEGAH HIPOTERMIA segera setelah pemeriksaan: selimuti pasien, gunakan selimut penghangat, dan berikan cairan infus yang dihangatkan.',
          'Hipotermia memperberat koagulopati dan asidosis — bersama-sama membentuk TRIAS KEMATIAN pada trauma.',
        ],
      },
      {
        fase: 'Tambahan pada primary survey & Reevaluasi',
        steps: [
          'Pasang monitor EKG, pulse oximeter, kapnografi, kateter urin (kontraindikasi bila dicurigai ruptur uretra: darah di meatus, hematoma perineum, prostat melayang), dan NGT (gunakan jalur oral bila dicurigai fraktur basis kranii).',
          'Foto toraks dan pelvis, serta USG FAST.',
          'REEVALUASI ABCDE setiap kali kondisi pasien berubah atau memburuk — kembali ke A.',
          'Secondary survey (pemeriksaan head-to-toe dan anamnesis AMPLE) hanya dikerjakan SETELAH primary survey selesai dan pasien stabil.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'ABCDE',
        kepanjangan: [
          'A — Airway dengan proteksi servikal',
          'B — Breathing dan ventilasi',
          'C — Circulation dengan kontrol perdarahan',
          'D — Disability (status neurologis)',
          'E — Exposure dan kontrol lingkungan (cegah hipotermia)',
        ],
        catatan: 'Kerjakan BERURUTAN. Jangan lanjut ke huruf berikutnya sebelum masalah pada huruf sebelumnya diatasi.',
      },
      {
        akronim: 'AMPLE — anamnesis pada secondary survey',
        kepanjangan: [
          'A — Allergies (alergi)',
          'M — Medications (obat yang sedang dikonsumsi)',
          'P — Past illness / Pregnancy (riwayat penyakit / kehamilan)',
          'L — Last meal (makan terakhir)',
          'E — Events / Environment (kronologi kejadian)',
        ],
      },
      {
        akronim: 'Perdarahan tersembunyi — "Blood on the floor and four more"',
        kepanjangan: [
          '1 — Lantai (perdarahan eksternal)',
          '2 — Toraks',
          '3 — Abdomen',
          '4 — Pelvis / retroperitoneum',
          '5 — Tulang panjang (femur)',
        ],
      },
      {
        akronim: 'Trias kematian pada trauma',
        kepanjangan: ['1 — Hipotermia', '2 — Asidosis', '3 — Koagulopati'],
        catatan: 'Ketiganya saling memperberat; karena itu penghangatan pasien bukan hal sepele melainkan bagian dari resusitasi.',
      },
    ],
    tips: [
      'Pasien yang dapat berbicara jelas berarti A, B, dan sebagian C sedang aman — ini penilaian tercepat.',
      'Pada trauma gunakan JAW THRUST, bukan head tilt-chin lift, demi menjaga imobilisasi servikal.',
      'Tension pneumothorax dan tamponade jantung ditegakkan secara KLINIS; menunggu foto rontgen dapat berakibat fatal.',
      'Jangan mencabut benda asing yang menancap — stabilkan di tempatnya dan rujuk untuk eksplorasi.',
      'Hipotensi pada trauma dianggap akibat perdarahan sampai terbukti sebaliknya.',
      'Reevaluasi berulang lebih bernilai daripada pemeriksaan sekali yang sangat teliti.',
    ],
    referensi: ['ATLS2018', 'SCHWARTZ2019'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'acls-arrest',
    category: 'Kegawatdaruratan',
    title: 'ACLS — Henti Jantung (Cardiac Arrest)',
    subtitle: 'Algoritma resusitasi dewasa; kualitas kompresi menentukan luaran',
    indikasi: ['Pasien tidak sadar, tidak bernapas normal, dan nadi karotis tidak teraba'],
    alat: [
      'Defibrilator/AED dengan pad atau paddle',
      'Bag-valve-mask dengan reservoir dan sumber oksigen',
      'Alat jalan napas: OPA, NPA, laringoskop, ETT, LMA',
      'Akses IV atau IO, cairan kristaloid',
      'Obat: epinefrin 1 mg/10 mL, amiodaron 300 mg, lidokain, natrium bikarbonat, kalsium glukonas, magnesium sulfat',
      'Monitor EKG, kapnografi bentuk gelombang',
      'Papan resusitasi (backboard)',
    ],
    fases: [
      {
        fase: 'Pengenalan & aktivasi',
        steps: [
          'Pastikan keamanan penolong, pasien, dan lingkungan (3A: Aman diri, Aman pasien, Aman lingkungan).',
          'Periksa respons dengan menepuk bahu dan memanggil pasien.',
          'Aktifkan sistem gawat darurat dan minta AED/defibrilator serta bantuan.',
          'Periksa napas dan nadi karotis SECARA BERSAMAAN dalam waktu MAKSIMAL 10 detik. Bila nadi tidak teraba atau ragu, mulai kompresi.',
        ],
      },
      {
        fase: 'RJP berkualitas tinggi',
        steps: [
          'Posisikan pasien terlentang di atas permukaan keras; letakkan tumit tangan di setengah bawah sternum.',
          'KECEPATAN 100-120 kompresi per menit.',
          'KEDALAMAN 5-6 cm pada dewasa (sekitar sepertiga diameter anteroposterior dada pada anak).',
          'Berikan RECOIL DADA PENUH setiap kompresi — jangan bertumpu pada dada pasien.',
          'MINIMALKAN INTERUPSI; usahakan jeda kurang dari 10 detik dan chest compression fraction lebih dari 60%.',
          'Rasio kompresi banding ventilasi 30:2 tanpa jalan napas lanjut; setelah jalan napas lanjut terpasang, kompresi kontinu dengan ventilasi 1 kali setiap 6 detik (10 kali per menit).',
          'GANTI PENOLONG setiap 2 menit untuk mencegah penurunan kualitas akibat kelelahan.',
          'HINDARI ventilasi berlebihan — meningkatkan tekanan intratorakal dan menurunkan aliran balik vena.',
        ],
      },
      {
        fase: 'Irama SHOCKABLE — VF / pVT',
        steps: [
          'Kenali fibrilasi ventrikel atau takikardia ventrikel tanpa nadi pada monitor.',
          'DEFIBRILASI SEGERA: bifasik 120-200 J sesuai rekomendasi alat, atau monofasik 360 J.',
          'Segera lanjutkan RJP selama 2 menit tanpa menunggu penilaian irama.',
          'Pasang akses IV atau IO. Berikan EPINEFRIN 1 mg IV/IO setiap 3-5 menit (setelah syok kedua pada irama shockable).',
          'Setelah syok KETIGA, berikan AMIODARON 300 mg IV bolus; dosis kedua 150 mg dapat diberikan. Alternatif: lidokain 1-1,5 mg/kgBB.',
          'Nilai irama setiap 2 menit; bila tetap shockable, ulangi syok dan lanjutkan siklus.',
        ],
      },
      {
        fase: 'Irama NON-SHOCKABLE — PEA / Asistol',
        steps: [
          'Kenali pulseless electrical activity atau asistol. JANGAN melakukan defibrilasi pada irama ini.',
          'Lanjutkan RJP dan berikan EPINEFRIN 1 mg IV/IO SESEGERA MUNGKIN, lalu ulangi setiap 3-5 menit.',
          'Pada asistol, konfirmasi dengan memeriksa sambungan elektroda dan menaikkan gain untuk memastikan bukan fine VF.',
          'Fokus utama adalah mencari dan mengatasi PENYEBAB REVERSIBEL (5H dan 5T).',
          'Nilai irama setiap 2 menit; bila berubah menjadi shockable, masuk ke jalur defibrilasi.',
        ],
      },
      {
        fase: 'Penyebab reversibel & pemantauan',
        steps: [
          'Telusuri 5H: Hipovolemia, Hipoksia, Hidrogen ion (asidosis), Hipo/hiperkalemia, dan Hipotermia.',
          'Telusuri 5T: Tension pneumothorax, Tamponade jantung, Toksin, Trombosis paru, dan Trombosis koroner.',
          'Gunakan KAPNOGRAFI: nilai ETCO2 kurang dari 10 mmHg menandakan kualitas kompresi buruk — perbaiki teknik. Peningkatan ETCO2 mendadak menjadi 35-40 mmHg merupakan tanda kembalinya sirkulasi spontan.',
          'USG bedside dapat membantu mencari tamponade, hipovolemia, dan pneumotoraks tanpa mengganggu kompresi.',
        ],
      },
      {
        fase: 'Perawatan pascahenti jantung (ROSC)',
        steps: [
          'Konfirmasi kembalinya sirkulasi spontan: nadi teraba, tekanan darah terukur, dan lonjakan ETCO2.',
          'Optimalkan oksigenasi dengan target saturasi 92-98%; HINDARI hiperoksia. Target ventilasi normokapnia.',
          'Pertahankan tekanan darah sistolik di atas 90 mmHg atau MAP di atas 65 mmHg dengan cairan dan vasopresor.',
          'Rekam EKG 12 sadapan; bila STEMI atau kecurigaan iskemia, rujuk untuk reperfusi koroner segera.',
          'Terapkan manajemen suhu terarah (targeted temperature management) pada pasien yang tetap tidak sadar.',
          'Cari dan atasi penyebab dasar; rawat di unit perawatan intensif.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: '5H — penyebab reversibel',
        kepanjangan: [
          'H — Hipovolemia',
          'H — Hipoksia',
          'H — Hidrogen ion (asidosis)',
          'H — Hipo/hiperkalemia',
          'H — Hipotermia',
        ],
      },
      {
        akronim: '5T — penyebab reversibel',
        kepanjangan: [
          'T — Tension pneumothorax',
          'T — Tamponade (jantung)',
          'T — Toksin',
          'T — Trombosis paru (emboli paru)',
          'T — Trombosis koroner (infark miokard)',
        ],
      },
      {
        akronim: 'Irama henti jantung — "Shockable vs Non-shockable"',
        kepanjangan: [
          'SHOCKABLE — VF (fibrilasi ventrikel) dan pVT (VT tanpa nadi) → DEFIBRILASI',
          'NON-SHOCKABLE — PEA dan Asistol → EPINEFRIN + cari penyebab',
        ],
        catatan: 'Kesalahan fatal yang sering terjadi: melakukan defibrilasi pada asistol, atau memberi syok pada pasien yang masih memiliki nadi.',
      },
      {
        akronim: 'RJP berkualitas — "CAB + 100-120 + 5-6"',
        kepanjangan: [
          'C — Compression lebih dahulu (bukan airway)',
          'A — Airway',
          'B — Breathing',
          '100-120 kompresi per menit',
          'Kedalaman 5-6 cm dengan recoil penuh',
        ],
      },
    ],
    tips: [
      'Kompresi berkualitas tinggi dan defibrilasi dini adalah dua hal yang paling menentukan luaran — bukan obat.',
      'Epinefrin diberikan SEGERA pada irama non-shockable, tetapi SETELAH syok kedua pada irama shockable.',
      'Jangan menghentikan kompresi untuk memasang jalur infus, intubasi, atau memberi obat.',
      'Asistol pada monitor: selalu konfirmasi sambungan elektroda dan naikkan gain sebelum menyimpulkan.',
      'ETCO2 adalah umpan balik objektif kualitas RJP — nilai rendah berarti kompresi perlu diperbaiki.',
      'Pada OSCE, verbalisasikan "aman diri, aman pasien, aman lingkungan" dan hitung kompresi dengan lantang.',
    ],
    komplikasi: [
      'Fraktur iga dan sternum akibat kompresi (dapat diterima; jangan mengurangi kedalaman karenanya)',
      'Pneumotoraks dan hemotoraks',
      'Regurgitasi dan aspirasi isi lambung',
      'Cedera hati dan limpa bila posisi tangan terlalu rendah',
      'Cedera otak hipoksik-iskemik pascahenti jantung',
    ],
    referensi: ['BRAUNWALD2022', 'ATLS2018', 'PAPDI2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'iv-line',
    category: 'Akses Vaskular & Cairan',
    title: 'Pemasangan IV Line — Kanulasi Vena Perifer',
    subtitle: 'Ukuran gauge, pemilihan lokasi, dan teknik aseptik',
    diagram: 'ivGauges',
    indikasi: [
      'Pemberian cairan resusitasi dan rumatan',
      'Pemberian obat intravena dan transfusi darah',
      'Akses darurat pada pasien kritis',
      'Persiapan tindakan atau operasi',
    ],
    kontraindikasi: [
      'Ekstremitas dengan fistula arteriovenosa untuk hemodialisis',
      'Sisi tubuh pascamastektomi dengan diseksi kelenjar aksila',
      'Ekstremitas dengan selulitis, luka bakar, atau trombosis pada lokasi tusukan',
      'Ekstremitas yang mengalami cedera atau fraktur di proksimal lokasi',
    ],
    alat: [
      'Kanula IV (abocath) sesuai ukuran yang dibutuhkan',
      'Torniket, sarung tangan, alkohol swab atau povidon iodin/klorheksidin',
      'Infus set atau blood set, cairan infus, standar infus',
      'Plester fiksasi transparan, kasa, spuit berisi NaCl 0,9% untuk flush',
      'Bengkok dan wadah benda tajam',
    ],
    fases: [
      {
        fase: 'Persiapan',
        steps: [
          'Perkenalkan diri, konfirmasi identitas pasien, jelaskan tujuan dan prosedur, lalu minta persetujuan.',
          'Tanyakan riwayat alergi (terutama plester dan povidon iodin) serta sisi tubuh yang perlu dihindari.',
          'Siapkan alat, buka set infus, sambungkan ke cairan, dan alirkan hingga bebas gelembung udara.',
          'Cuci tangan dan pakai sarung tangan.',
        ],
      },
      {
        fase: 'Pemilihan vena',
        steps: [
          'Pilih vena dari DISTAL ke PROKSIMAL — mulai dari punggung tangan, agar bila gagal masih tersedia lokasi di proksimal.',
          'Urutan pilihan umum: vena metakarpal (punggung tangan), vena sefalika, vena basilika, lalu vena antekubiti.',
          'Pada kondisi darurat pilih vena antekubiti karena besar dan mudah diakses; pada anak dapat digunakan vena di punggung tangan, kaki, atau kepala (bayi).',
          'HINDARI vena di area persendian, vena yang berkelok, keras, atau bercabang, serta vena pada ekstremitas yang lumpuh.',
          'Pasang torniket 10-15 cm di proksimal lokasi tusukan; minta pasien mengepalkan tangan dan lakukan palpasi untuk menilai vena yang lunak dan memantul.',
        ],
      },
      {
        fase: 'Insersi',
        steps: [
          'Desinfeksi kulit dengan gerakan melingkar dari dalam ke luar atau satu arah, lalu biarkan MENGERING sempurna (alkohol sekitar 30 detik, povidon iodin sekitar 2 menit).',
          'Fiksasi vena dengan meregangkan kulit di distal menggunakan ibu jari tangan non-dominan.',
          'Tusukkan kanula dengan sudut 15-30 derajat terhadap kulit, dengan BEVEL MENGHADAP KE ATAS, mengarah sejajar jalannya vena.',
          'Perhatikan FLASHBACK darah pada chamber kanula sebagai tanda jarum telah masuk vena.',
          'Turunkan sudut hingga hampir sejajar kulit, majukan kanula sedikit (2-3 mm) agar kateter plastik ikut masuk ke dalam lumen vena.',
          'Tahan mandrin (jarum) di tempatnya, lalu dorong kateter plastik seluruhnya ke dalam vena.',
          'Lepaskan torniket, tekan ujung kateter di bawah kulit untuk mencegah darah keluar, lalu cabut mandrin dan langsung buang ke wadah benda tajam.',
          'Sambungkan infus set, buka klem, dan pastikan tetesan lancar tanpa pembengkakan di sekitar lokasi.',
        ],
      },
      {
        fase: 'Fiksasi & dokumentasi',
        steps: [
          'Fiksasi kanula dengan plester transparan agar lokasi tusukan tetap terlihat untuk pemantauan.',
          'Atur kecepatan tetesan sesuai kebutuhan cairan.',
          'Tulis tanggal dan jam pemasangan pada plester.',
          'Rapikan alat, lepas sarung tangan, cuci tangan, dan dokumentasikan tindakan.',
          'Evaluasi lokasi secara berkala untuk tanda flebitis, infiltrasi, dan ekstravasasi.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Warna & ukuran kanula IV',
        kepanjangan: [
          'ORANYE 14 G — aliran ~270 mL/menit; trauma mayor, transfusi masif',
          'ABU-ABU 16 G — aliran ~180 mL/menit; resusitasi cairan, bedah besar',
          'HIJAU 18 G — aliran ~90 mL/menit; transfusi darah, cairan kental',
          'MERAH MUDA 20 G — aliran ~60 mL/menit; pilihan umum dewasa',
          'BIRU 22 G — aliran ~36 mL/menit; anak, lansia, vena kecil',
          'KUNING 24 G — aliran ~20 mL/menit; neonatus dan bayi',
        ],
        catatan: 'Semakin KECIL angka gauge, semakin BESAR diameter kanula dan semakin cepat alirannya. Untuk resusitasi pilih kanula PENDEK dan BESAR — aliran berbanding lurus dengan pangkat empat jari-jari dan berbanding terbalik dengan panjang (hukum Hagen-Poiseuille).',
      },
      {
        akronim: 'Komplikasi lokal — "FIRE"',
        kepanjangan: [
          'F — Flebitis (nyeri, kemerahan, vena teraba mengeras)',
          'I — Infiltrasi (cairan non-vesikan masuk jaringan; bengkak, dingin)',
          'R — Reaksi alergi (plester, antiseptik)',
          'E — Ekstravasasi (cairan vesikan bocor ke jaringan; berisiko nekrosis)',
        ],
      },
    ],
    tips: [
      'Biarkan antiseptik MENGERING sempurna sebelum menusuk — inilah yang membunuh kuman, bukan sekadar mengoles.',
      'Bila gagal, jangan menusuk ulang dengan kanula yang sama dan jangan memasukkan kembali mandrin ke kateter plastik (berisiko memotong kateter dan menimbulkan emboli).',
      'Untuk transfusi darah gunakan minimal 20 G (idealnya 18 G) agar eritrosit tidak mengalami hemolisis.',
      'Pada syok, dua jalur besar (14-16 G) di antekubiti jauh lebih berguna daripada satu jalur sentral yang lama pemasangannya.',
      'Ganti lokasi kanula sesuai kebijakan dan segera bila muncul tanda flebitis.',
    ],
    komplikasi: [
      'Flebitis, infiltrasi, dan ekstravasasi',
      'Hematoma dan perdarahan lokal',
      'Infeksi lokal hingga bakteremia terkait kateter',
      'Emboli udara dan emboli kateter',
      'Tusukan tidak sengaja pada arteri atau saraf',
    ],
    referensi: ['ATLS2018', 'PPKFKTP2014', 'PAPDI2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'cairan-infus',
    category: 'Akses Vaskular & Cairan',
    title: 'Jenis-Jenis Cairan Infus & Pemilihannya',
    subtitle: 'Kristaloid, koloid, dan cairan khusus — indikasi serta jebakannya',
    fases: [
      {
        fase: 'Kristaloid isotonik — pilihan utama resusitasi',
        steps: [
          'RINGER LAKTAT (RL): Na 130, K 4, Ca 3, Cl 109, laktat 28 mEq/L. Paling mendekati komposisi plasma. Pilihan utama resusitasi trauma, luka bakar, dan dehidrasi. HINDARI pada gangguan hati berat (laktat dimetabolisme di hati) dan hiperkalemia berat. JANGAN dicampur dalam satu jalur dengan transfusi darah karena kalsium memicu pembekuan.',
          'RINGER ASETAT: serupa RL namun asetat dimetabolisme di otot, sehingga lebih aman pada gangguan hati.',
          'NaCl 0,9% (NORMAL SALINE): Na 154, Cl 154 mEq/L. Isotonik, aman bersama transfusi darah, pilihan pada hiponatremia, alkalosis metabolik, dan cedera kepala. Pemberian volume besar berisiko ASIDOSIS METABOLIK HIPERKLOREMIK karena kandungan klorida yang jauh melebihi plasma.',
        ],
      },
      {
        fase: 'Kristaloid hipotonik & hipertonik',
        steps: [
          'DEKSTROSA 5% (D5W): setelah glukosa dimetabolisme, yang tersisa adalah air bebas sehingga bersifat HIPOTONIK. TIDAK BOLEH untuk resusitasi syok karena cepat berpindah ke intrasel. Digunakan untuk rumatan, hipernatremia, dan sebagai pembawa obat. Berbahaya pada cedera kepala karena memperberat edema serebri.',
          'NaCl 0,45%: hipotonik, untuk hipernatremia dan rumatan pada kondisi tertentu; hindari pada pasien berisiko edema serebri.',
          'NaCl 3% (HIPERTONIK): untuk hiponatremia simtomatik berat dan penurunan tekanan intrakranial. Koreksi natrium harus PERLAHAN (maksimal 8-10 mEq/L per 24 jam) untuk mencegah sindrom demielinisasi osmotik.',
          'DEKSTROSA 40%: untuk koreksi hipoglikemia; berikan bolus lalu lanjutkan infus dekstrosa rumatan.',
        ],
      },
      {
        fase: 'Koloid',
        steps: [
          'ALBUMIN: koloid alami; digunakan pada sirosis dengan parasentesis volume besar, peritonitis bakterial spontan, dan sindrom hepatorenal. Mahal dan tidak superior dibanding kristaloid untuk resusitasi umum.',
          'HES (hydroxyethyl starch) dan GELATIN: koloid sintetik. Penggunaan HES kini SANGAT DIBATASI karena meningkatkan risiko gagal ginjal akut dan kematian pada sepsis dan pasien kritis.',
          'Prinsip terkini: kristaloid tetap menjadi pilihan pertama resusitasi; koloid tidak terbukti memberi keuntungan mortalitas dan lebih mahal.',
        ],
      },
      {
        fase: 'Menghitung kebutuhan cairan',
        steps: [
          'RUMATAN dewasa: sekitar 30-35 mL/kgBB/hari.',
          'RUMATAN anak (formula Holliday-Segar): 100 mL/kg untuk 10 kg pertama, ditambah 50 mL/kg untuk 10 kg berikutnya, ditambah 20 mL/kg untuk setiap kilogram selanjutnya — per 24 jam.',
          'Versi per jam (formula 4-2-1): 4 mL/kg/jam untuk 10 kg pertama, 2 mL/kg/jam untuk 10 kg berikutnya, dan 1 mL/kg/jam untuk sisanya.',
          'RESUSITASI syok: kristaloid 20 mL/kgBB bolus pada anak, atau 1 liter pada dewasa, lalu nilai respons.',
          'LUKA BAKAR (formula Parkland): 4 mL × berat badan (kg) × persentase luas luka bakar derajat 2 dan 3, menggunakan RL. Setengah volume diberikan dalam 8 jam PERTAMA sejak waktu kejadian (bukan sejak pasien datang), sisanya dalam 16 jam berikutnya.',
          'Target pemantauan: produksi urin 0,5-1 mL/kg/jam pada dewasa dan 1-2 mL/kg/jam pada anak, perbaikan kesadaran, capillary refill, dan penurunan laktat.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Pilihan cairan cepat',
        kepanjangan: [
          'SYOK / RESUSITASI → RL atau NaCl 0,9% (kristaloid isotonik)',
          'BERSAMA TRANSFUSI → NaCl 0,9% (JANGAN RL)',
          'CEDERA KEPALA → NaCl 0,9%; hindari D5W dan cairan hipotonik',
          'HIPOGLIKEMIA → Dekstrosa 40% bolus lalu rumatan dekstrosa',
          'GANGGUAN HATI → Ringer Asetat lebih dipilih daripada Ringer Laktat',
          'LUKA BAKAR → RL dengan formula Parkland',
        ],
      },
    ],
    tips: [
      'D5W BUKAN cairan resusitasi — setelah glukosanya dimetabolisme yang tersisa hanyalah air bebas.',
      'Jangan mencampur RL dengan transfusi darah dalam satu jalur; kalsium pada RL memicu pembekuan.',
      'Pada luka bakar, hitung waktu mulai dari SAAT KEJADIAN, bukan saat pasien tiba di rumah sakit.',
      'Koreksi hiponatremia dan hipernatremia harus perlahan — koreksi terlalu cepat menimbulkan kerusakan neurologis permanen.',
      'Produksi urin adalah indikator perfusi paling praktis dan murah di lapangan.',
    ],
    referensi: ['ATLS2018', 'PAPDI2014', 'HARRISON2022'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'injeksi-vaksin',
    category: 'Injeksi & Imunisasi',
    title: 'Teknik Injeksi & Imunisasi — Sudut, Gauge, dan Lokasi',
    subtitle: 'Intrakutan, subkutan, intramuskular, intravena — beserta jadwal imunisasi dasar',
    diagram: 'injectionAngles',
    alat: [
      'Spuit sesuai volume (0,05-1 mL untuk imunisasi; 3-5 mL untuk obat)',
      'Jarum sesuai rute dan usia pasien',
      'Alkohol swab, sarung tangan, kapas kering',
      'Vaksin dalam rantai dingin (2-8 °C) beserta pelarutnya',
      'Wadah benda tajam (safety box), kartu imunisasi/buku KIA',
      'Set penanganan anafilaksis: epinefrin 1:1000, spuit, oksigen',
    ],
    fases: [
      {
        fase: 'INTRAKUTAN (IC) — sudut 5-15°',
        steps: [
          'Contoh penggunaan: BCG, uji tuberkulin (Mantoux), uji alergi.',
          'Lokasi: lengan atas kanan (insersio m. deltoideus) untuk BCG; volar lengan bawah untuk Mantoux.',
          'Jarum 26-27 G, panjang pendek, dengan BEVEL MENGHADAP KE ATAS.',
          'Sudut 5-15 derajat, hampir sejajar permukaan kulit; ujung jarum harus TERLIHAT membayang di bawah epidermis.',
          'Volume kecil: BCG 0,05 mL untuk bayi kurang dari 1 tahun (0,1 mL untuk usia lebih besar); Mantoux 0,1 mL.',
          'Tanda keberhasilan: terbentuk GELEMBUNG (wheal) pucat seperti kulit jeruk berdiameter sekitar 6-10 mm.',
          'JANGAN melakukan aspirasi dan JANGAN memijat setelah penyuntikan.',
        ],
      },
      {
        fase: 'SUBKUTAN (SC) — sudut 45°',
        steps: [
          'Contoh penggunaan: vaksin campak/MR, MMR, varisela, insulin, dan beberapa vaksin virus hidup.',
          'Lokasi: lengan atas bagian luar (deltoid), paha anterolateral, atau perut di sekitar umbilikus untuk insulin.',
          'Jarum 25-27 G; cubit kulit dan jaringan subkutan.',
          'Sudut 45 derajat (dapat 90 derajat pada pasien gemuk dengan jarum pendek).',
          'Volume umumnya 0,5 mL.',
          'Untuk insulin gunakan spuit insulin dan ROTASI lokasi penyuntikan untuk mencegah lipohipertrofi.',
        ],
      },
      {
        fase: 'INTRAMUSKULAR (IM) — sudut 90°',
        steps: [
          'Contoh penggunaan: DPT-HB-Hib, hepatitis B, IPV, tetanus, vitamin K1, sebagian besar antibiotik injeksi.',
          'Lokasi BAYI DAN ANAK KECIL: PAHA ANTEROLATERAL (m. vastus lateralis) — pilihan utama karena massa otot paling besar dan jauh dari saraf serta pembuluh besar.',
          'Lokasi ANAK BESAR DAN DEWASA: m. deltoideus (2-3 jari di bawah akromion), atau ventrogluteal.',
          'HINDARI regio dorsogluteal (bokong) pada bayi dan anak karena risiko cedera nervus iskiadikus dan penyerapan vaksin yang kurang baik.',
          'Jarum 22-25 G; panjang disesuaikan usia dan ketebalan jaringan (bayi sekitar 25 mm, dewasa 25-38 mm).',
          'Sudut 90 derajat, tegak lurus permukaan kulit; regangkan kulit (teknik Z-track untuk obat yang mengiritasi).',
          'Volume maksimal: 0,5-1 mL pada bayi, hingga 2 mL pada deltoid dewasa, hingga 5 mL pada gluteal dewasa.',
          'ASPIRASI TIDAK LAGI DIREKOMENDASIKAN untuk vaksinasi rutin, karena tidak ada pembuluh darah besar di lokasi yang dianjurkan dan aspirasi menambah nyeri.',
        ],
      },
      {
        fase: 'INTRAVENA (IV) — sudut 15-30°',
        steps: [
          'Untuk obat yang memerlukan efek cepat dan cairan resusitasi.',
          'Jarum atau kanula 14-24 G sesuai kebutuhan; sudut 15-30 derajat dengan bevel menghadap ke atas.',
          'Wajib melakukan aspirasi untuk memastikan posisi dalam vena sebelum menyuntikkan obat.',
          'Perhatikan kecepatan pemberian; sebagian obat harus diberikan sangat perlahan atau diencerkan.',
        ],
      },
      {
        fase: 'Jadwal imunisasi dasar (Kemenkes/IDAI)',
        steps: [
          'Segera setelah lahir (0-24 jam): Hepatitis B-0 (IM, paha) — pada bayi dari ibu HBsAg positif, tambahkan HBIg dalam 12 jam pertama di paha yang berbeda.',
          'Usia 1 bulan: BCG (IC 0,05 mL, lengan atas kanan) dan Polio-1 (OPV tetes).',
          'Usia 2 bulan: DPT-HB-Hib-1 (IM paha) dan Polio-2.',
          'Usia 3 bulan: DPT-HB-Hib-2 dan Polio-3.',
          'Usia 4 bulan: DPT-HB-Hib-3, Polio-4, dan IPV (suntik).',
          'Usia 9 bulan: Campak/MR-1 (SC 0,5 mL).',
          'Usia 18 bulan: DPT-HB-Hib-4 (booster) dan Campak/MR-2.',
          'Program BIAS di sekolah dasar: kelas 1 Campak/MR dan DT; kelas 2 dan 5 Td.',
          'Rotavirus dan PCV telah masuk program nasional secara bertahap sesuai kebijakan daerah.',
        ],
      },
      {
        fase: 'Keamanan & rantai dingin',
        steps: [
          'Simpan vaksin pada suhu 2-8 °C; JANGAN membekukan vaksin DPT, HB, dan Td karena akan rusak permanen.',
          'Lakukan uji kocok (shake test) bila dicurigai vaksin pernah beku.',
          'Periksa VVM (vaccine vial monitor) dan tanggal kedaluwarsa sebelum pemberian.',
          'Gunakan satu spuit dan satu jarum steril untuk setiap anak (auto-disable syringe bila tersedia).',
          'JANGAN menutup kembali jarum (no recapping); langsung buang ke safety box.',
          'Amati pasien 15-30 menit setelah penyuntikan untuk mendeteksi reaksi anafilaksis; epinefrin harus selalu tersedia.',
          'Catat jenis vaksin, nomor batch, tanggal, dan lokasi penyuntikan pada buku KIA.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Sudut injeksi — "5-45-90"',
        kepanjangan: [
          'IC (intrakutan) — 5-15° (hampir sejajar kulit), terbentuk wheal',
          'SC (subkutan) — 45° (atau 90° dengan jarum pendek), kulit dicubit',
          'IM (intramuskular) — 90° (tegak lurus), kulit diregangkan',
          'IV (intravena) — 15-30°, bevel ke atas, wajib aspirasi',
        ],
      },
      {
        akronim: 'Lokasi IM menurut usia',
        kepanjangan: [
          'BAYI & ANAK KECIL → PAHA anterolateral (vastus lateralis)',
          'ANAK BESAR & DEWASA → DELTOID atau ventrogluteal',
          'HINDARI bokong (dorsogluteal) pada bayi — risiko cedera n. iskiadikus',
        ],
      },
      {
        akronim: 'BCG — angka penting',
        kepanjangan: [
          '0,05 mL untuk bayi kurang dari 1 tahun',
          'Sudut 5-15 derajat, intrakutan',
          'Lengan atas KANAN, insersio m. deltoideus',
          'Wheal 6-10 mm sebagai tanda berhasil',
        ],
        catatan: 'Jaringan parut BCG muncul 4-6 minggu kemudian. Bila timbul abses atau limfadenitis supuratif, jangan diinsisi rutin — konsultasikan.',
      },
    ],
    tips: [
      'Bila terbentuk wheal pada BCG, teknik sudah benar. Bila tidak terbentuk wheal, jarum terlalu dalam (masuk subkutan).',
      'Aspirasi sebelum vaksinasi IM sudah TIDAK direkomendasikan lagi — menambah nyeri tanpa manfaat.',
      'Beberapa vaksin dapat diberikan bersamaan pada kunjungan yang sama, namun harus di lokasi BERBEDA dan dengan spuit terpisah.',
      'Demam ringan dan bengkak lokal setelah imunisasi adalah wajar; edukasi orang tua agar tidak menghentikan imunisasi berikutnya.',
      'Vaksin hidup (BCG, campak, polio oral) merupakan kontraindikasi pada imunodefisiensi berat dan kehamilan.',
    ],
    komplikasi: [
      'Nyeri, bengkak, dan kemerahan lokal',
      'Abses steril atau abses bakterial akibat teknik tidak aseptik',
      'Cedera saraf (terutama n. iskiadikus bila menyuntik di bokong pada bayi)',
      'Reaksi anafilaksis — memerlukan epinefrin IM segera',
      'Limfadenitis BCG dan reaksi lokal berlebihan',
    ],
    referensi: ['PPKFKTP2014', 'HARRISON2022', 'POGI2016'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngt',
    category: 'Saluran Cerna & Kemih',
    title: 'Pemasangan NGT (Nasogastric Tube)',
    subtitle: 'Dekompresi lambung, pemberian nutrisi, dan bilas lambung',
    indikasi: [
      'Dekompresi lambung pada ileus obstruktif, distensi abdomen, dan persiapan operasi',
      'Pemberian nutrisi enteral pada pasien yang tidak dapat menelan',
      'Pemberian obat pada pasien tidak sadar dengan saluran cerna berfungsi',
      'Bilas lambung pada keracunan tertentu',
      'Evaluasi perdarahan saluran cerna atas',
    ],
    kontraindikasi: [
      'FRAKTUR BASIS KRANII atau trauma wajah berat — pemasangan lewat hidung berisiko tube masuk ke rongga kranium; gunakan jalur ORAL (OGT)',
      'Striktur atau riwayat operasi esofagus, varises esofagus yang berdarah aktif (relatif)',
      'Menelan zat korosif — pemasangan buta berisiko perforasi',
      'Koagulopati berat (relatif, risiko epistaksis)',
    ],
    alat: [
      'NGT ukuran sesuai: dewasa 14-18 Fr, anak 8-12 Fr, bayi 5-8 Fr',
      'Jeli pelumas larut air, spuit 50 mL (catheter tip), stetoskop',
      'Sarung tangan, plester fiksasi, segelas air dan sedotan (bila pasien sadar)',
      'Kertas pH atau lakmus, bengkok, kantong penampung, tisu',
    ],
    fases: [
      {
        fase: 'Persiapan',
        steps: [
          'Perkenalkan diri, konfirmasi identitas, jelaskan prosedur dan tujuannya, lalu minta persetujuan.',
          'Tanyakan riwayat trauma wajah, operasi hidung, deviasi septum, dan epistaksis.',
          'Posisikan pasien duduk atau semi-Fowler 45-90 derajat dengan kepala sedikit fleksi. Bila pasien tidak sadar, posisikan terlentang dengan kepala miring.',
          'Cuci tangan dan pakai sarung tangan.',
          'Periksa patensi kedua lubang hidung dengan meminta pasien bernapas melalui satu lubang bergantian; pilih yang lebih paten.',
        ],
      },
      {
        fase: 'Pengukuran panjang',
        steps: [
          'Ukur dengan metode NEX: dari ujung HIDUNG (Nose) → daun TELINGA (Ear) → prosesus XIPHOIDEUS (Xiphoid).',
          'Alternatif pada anak gunakan metode NEMU: hidung → telinga → titik tengah antara prosesus xiphoideus dan umbilikus.',
          'Tandai panjang tersebut pada selang dengan plester agar tidak terlalu dangkal maupun terlalu dalam.',
        ],
      },
      {
        fase: 'Insersi',
        steps: [
          'Lumasi ujung selang sepanjang 10-15 cm dengan jeli LARUT AIR (jangan gunakan pelumas berbahan minyak karena berisiko pneumonia lipoid bila masuk paru).',
          'Masukkan selang melalui lubang hidung dengan arah HORIZONTAL menyusuri dasar rongga hidung, bukan diarahkan ke atas.',
          'Setelah selang mencapai nasofaring (sekitar 10-15 cm), minta pasien MENUNDUKKAN kepala (fleksi leher) — gerakan ini menutup jalan napas dan mengarahkan selang ke esofagus.',
          'Minta pasien MENELAN atau menyedot air melalui sedotan, dan majukan selang bersamaan dengan gerakan menelan.',
          'Lanjutkan memasukkan selang hingga mencapai batas tanda yang telah dibuat.',
          'HENTIKAN SEGERA dan tarik selang bila pasien batuk hebat, tersedak, sianosis, suara menghilang, atau tampak distres napas — tanda selang masuk ke trakea.',
        ],
      },
      {
        fase: 'Konfirmasi posisi',
        steps: [
          'Aspirasi cairan lambung dengan spuit, lalu uji pH menggunakan kertas indikator. pH 5,5 ATAU KURANG mendukung posisi di lambung — ini metode di samping tempat tidur yang paling dapat diandalkan.',
          'Uji auskultasi (memasukkan udara 20-30 mL sambil mendengarkan bunyi di epigastrium) masih banyak dipakai namun TIDAK DAPAT DIANDALKAN sebagai satu-satunya konfirmasi, karena bunyi serupa dapat terdengar meski selang berada di paru atau esofagus.',
          'Foto rontgen merupakan BAKU EMAS konfirmasi dan wajib dilakukan sebelum pemberian nutrisi atau obat pada pasien berisiko tinggi (tidak sadar, ventilasi mekanik, gangguan refleks menelan).',
          'Jangan pernah memberikan apa pun melalui NGT sebelum posisi dipastikan.',
        ],
      },
      {
        fase: 'Fiksasi & perawatan',
        steps: [
          'Fiksasi selang pada hidung dengan plester tanpa menekan atau menarik ala nasi (mencegah nekrosis tekan).',
          'Sambungkan ke kantong penampung untuk dekompresi, atau tutup bila untuk pemberian nutrisi.',
          'Catat panjang selang di luar hidung sebagai acuan pemantauan pergeseran.',
          'Bilas selang dengan air sebelum dan sesudah pemberian nutrisi atau obat agar tidak tersumbat.',
          'Rawat kebersihan hidung dan mulut, serta evaluasi posisi selang secara berkala.',
          'Dokumentasikan ukuran selang, panjang, cara konfirmasi, karakter cairan, dan toleransi pasien.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Pengukuran panjang — "NEX"',
        kepanjangan: ['N — Nose (ujung hidung)', 'E — Ear (daun telinga)', 'X — Xiphoid (prosesus xiphoideus)'],
      },
      {
        akronim: 'Manuver insersi — "Horizontal lalu Menunduk"',
        kepanjangan: [
          'Masuk HORIZONTAL menyusuri dasar hidung (bukan ke atas)',
          'Setelah di nasofaring, minta pasien MENUNDUK',
          'Majukan selang bersamaan pasien MENELAN',
        ],
        catatan: 'Menundukkan kepala menutup jalan napas dan membuka esofagus — inilah kunci agar selang tidak masuk trakea.',
      },
    ],
    tips: [
      'Pada dugaan fraktur basis kranii (raccoon eyes, Battle sign, rinore/otore cairan serebrospinal), pasang lewat MULUT — bukan hidung.',
      'pH aspirat 5,5 atau kurang adalah konfirmasi bedside terbaik; auskultasi saja tidak cukup dan sudah ditinggalkan sebagai metode tunggal.',
      'Jika pasien batuk hebat atau tidak dapat bersuara saat insersi, segera tarik selang.',
      'Gunakan pelumas larut air, bukan vaselin atau minyak.',
      'Pada pasien sadar, kerja sama menelan sangat menentukan keberhasilan — jelaskan lebih dahulu apa yang harus dilakukan.',
    ],
    komplikasi: [
      'Salah posisi masuk ke trakea dan paru — berisiko pneumonia aspirasi hingga kematian bila diberi nutrisi',
      'Epistaksis dan trauma mukosa hidung',
      'Nekrosis tekan pada ala nasi akibat fiksasi terlalu ketat',
      'Sinusitis dan otitis media pada pemakaian lama',
      'Perforasi esofagus (jarang)',
      'Refluks dan aspirasi isi lambung',
    ],
    referensi: ['SCHWARTZ2019', 'SLEISENGER2021', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'kateter-urin',
    category: 'Saluran Cerna & Kemih',
    title: 'Pemasangan Kateter Urin',
    subtitle: 'Teknik steril, ukuran Fr, dan kontraindikasi mutlak pada trauma',
    indikasi: [
      'Retensi urin akut maupun kronik',
      'Pemantauan produksi urin ketat pada pasien kritis, syok, dan luka bakar',
      'Perioperatif pada operasi lama atau operasi daerah panggul',
      'Pengambilan sampel urin steril bila cara lain tidak memungkinkan',
      'Irigasi kandung kemih pada hematuria dengan bekuan',
      'Perawatan paliatif dan pasien imobilisasi dengan luka sakral',
    ],
    kontraindikasi: [
      'DUGAAN RUPTUR URETRA — merupakan kontraindikasi MUTLAK untuk kateterisasi buta. Tandanya: darah pada meatus uretra, hematoma perineum berbentuk kupu-kupu, prostat melayang atau tidak teraba pada colok dubur, dan riwayat trauma pelvis. Pada keadaan ini lakukan sistostomi suprapubik dan uretrografi retrograd lebih dahulu',
      'Striktur uretra berat dan riwayat operasi uretra (relatif — perlu operator berpengalaman)',
      'Infeksi akut uretra atau prostatitis akut (relatif)',
    ],
    alat: [
      'Kateter Foley ukuran sesuai: dewasa laki-laki 16-18 Fr, dewasa perempuan 14-16 Fr, anak 6-10 Fr',
      'Sarung tangan steril, duk steril berlubang, kasa steril',
      'Jeli lidokain 2% (anestesi sekaligus pelumas), povidon iodin atau klorheksidin',
      'Spuit 10 mL berisi AQUADES STERIL (bukan NaCl — kristal garam dapat menyumbat balon)',
      'Urine bag, plester fiksasi, bengkok, pinset',
    ],
    fases: [
      {
        fase: 'Persiapan',
        steps: [
          'Perkenalkan diri, jelaskan prosedur, dan minta persetujuan. Jaga PRIVASI pasien dengan sampiran dan buka area seperlunya saja.',
          'SEBELUM memasang, singkirkan tanda ruptur uretra: periksa meatus untuk darah, perineum untuk hematoma, dan lakukan colok dubur pada trauma untuk menilai posisi prostat.',
          'Posisikan pasien: laki-laki terlentang dengan tungkai sedikit abduksi; perempuan posisi litotomi atau dorsal rekumben dengan lutut fleksi dan abduksi.',
          'Cuci tangan, siapkan alat steril di atas duk, dan pakai sarung tangan steril.',
          'Uji balon kateter dengan mengembangkannya menggunakan aquades lalu kempiskan kembali sebelum digunakan.',
        ],
      },
      {
        fase: 'Antisepsis',
        steps: [
          'LAKI-LAKI: pegang penis dengan tangan non-dominan dan tarik preputium ke belakang (retraksi) untuk membuka glans. Bersihkan meatus secara melingkar dari dalam ke luar sebanyak tiga kali dengan kasa antiseptik berbeda.',
          'PEREMPUAN: buka labia dengan tangan non-dominan dan pertahankan posisinya (tangan ini menjadi tidak steril). Bersihkan dari arah DEPAN KE BELAKANG, dimulai dari labia mayora, labia minora, lalu meatus di tengah, masing-masing dengan kasa berbeda.',
          'Pasang duk steril berlubang.',
        ],
      },
      {
        fase: 'Insersi — laki-laki',
        steps: [
          'Masukkan jeli lidokain 2% sebanyak 10-20 mL ke dalam uretra melalui meatus, lalu jepit meatus selama 3-5 menit agar anestesi bekerja.',
          'Pegang penis TEGAK LURUS (90 derajat) terhadap tubuh dengan sedikit traksi — posisi ini meluruskan uretra pars pendulans.',
          'Masukkan kateter perlahan hingga hampir seluruh panjangnya (sekitar 18-22 cm) atau sampai percabangan kateter menyentuh meatus.',
          'Bila terasa tahanan pada uretra pars membranasea, TURUNKAN penis ke arah kaudal dan minta pasien menarik napas dalam atau seperti akan berkemih — jangan pernah memaksa mendorong.',
          'Pastikan urin KELUAR sebelum mengembangkan balon.',
        ],
      },
      {
        fase: 'Insersi — perempuan',
        steps: [
          'Identifikasi meatus uretra yang terletak di antara klitoris dan introitus vagina.',
          'Berikan pelumas pada ujung kateter dan masukkan perlahan sekitar 5-7 cm hingga urin keluar.',
          'Bila kateter tidak sengaja masuk ke vagina, TINGGALKAN kateter tersebut sebagai penanda, lalu gunakan kateter BARU yang steril untuk uretra.',
          'Setelah urin keluar, majukan kateter 2-3 cm lagi sebelum mengembangkan balon.',
        ],
      },
      {
        fase: 'Fiksasi & pascatindakan',
        steps: [
          'Kembangkan balon dengan AQUADES STERIL sesuai volume yang tertera pada kateter (umumnya 10 mL pada dewasa).',
          'JANGAN mengembangkan balon sebelum urin keluar — mengembangkan balon di dalam uretra menyebabkan ruptur uretra.',
          'Tarik kateter perlahan hingga terasa tahanan balon pada leher kandung kemih.',
          'PADA LAKI-LAKI, KEMBALIKAN PREPUTIUM ke posisi semula — bila lupa akan terjadi PARAFIMOSIS yang merupakan kedaruratan.',
          'Sambungkan ke urine bag dan letakkan kantong LEBIH RENDAH dari kandung kemih untuk mencegah aliran balik, namun jangan menyentuh lantai.',
          'Fiksasi kateter pada paha (perempuan) atau abdomen bawah (laki-laki, untuk mencegah nekrosis penoskrotal pada pemakaian lama).',
          'Pada retensi urin lama, keluarkan urin secara BERTAHAP untuk mengurangi risiko hematuria ex vacuo dan hipotensi.',
          'Dokumentasikan ukuran kateter, volume urin awal, karakteristik urin, dan toleransi pasien.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Kontraindikasi mutlak — tanda ruptur uretra',
        kepanjangan: [
          '1 — Darah pada meatus uretra',
          '2 — Hematoma perineum berbentuk kupu-kupu',
          '3 — Prostat melayang / tidak teraba pada colok dubur',
          '4 — Riwayat trauma pelvis',
        ],
        catatan: 'Bila ada salah satu tanda ini, JANGAN memasang kateter uretra. Lakukan sistostomi suprapubik dan uretrografi retrograd.',
      },
      {
        akronim: 'Tiga kesalahan fatal',
        kepanjangan: [
          '1 — Mengembangkan balon SEBELUM urin keluar → ruptur uretra',
          '2 — Lupa mengembalikan PREPUTIUM → parafimosis',
          '3 — Memaksa mendorong saat ada tahanan → false passage',
        ],
      },
    ],
    tips: [
      'Gunakan AQUADES untuk balon, bukan NaCl — kristal garam dapat menyumbat saluran balon sehingga sulit dikempiskan saat pelepasan.',
      'Jeli lidokain berfungsi ganda sebagai anestesi dan pelumas; beri waktu 3-5 menit agar bekerja.',
      'Kateter yang tidak diperlukan adalah sumber utama infeksi saluran kemih terkait perawatan kesehatan — evaluasi indikasi setiap hari dan lepas sedini mungkin.',
      'Jangan mengobati bakteriuria asimtomatik pada pasien berkateter; hanya mendorong resistensi tanpa manfaat.',
      'Pada OSCE, verbalisasikan pemeriksaan tanda ruptur uretra SEBELUM menyentuh kateter — ini sering menjadi poin penilaian kritis.',
    ],
    komplikasi: [
      'Infeksi saluran kemih terkait kateter dan urosepsis',
      'Trauma uretra dan pembentukan false passage',
      'Ruptur uretra akibat pengembangan balon di dalam uretra',
      'Parafimosis akibat preputium tidak dikembalikan',
      'Striktur uretra pada pemakaian lama',
      'Hematuria ex vacuo pada pengosongan terlalu cepat',
      'Nekrosis penoskrotal akibat fiksasi yang salah',
    ],
    referensi: ['CAMPBELL2016', 'ATLS2018', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'pungsi-suprapubik',
    category: 'Saluran Cerna & Kemih',
    title: 'Pungsi & Sistostomi Suprapubik',
    subtitle: 'Jalan keluar urin saat kateterisasi uretra tidak mungkin dilakukan',
    indikasi: [
      'Retensi urin dengan kateterisasi uretra gagal atau merupakan kontraindikasi',
      'DUGAAN RUPTUR URETRA pada trauma pelvis',
      'Striktur uretra berat dan fimosis berat yang menghalangi akses',
      'Prostatitis akut berat di mana kateterisasi uretra sebaiknya dihindari',
      'Pengambilan sampel urin steril pada bayi (aspirasi suprapubik)',
    ],
    kontraindikasi: [
      'Kandung kemih TIDAK teraba atau tidak penuh — risiko melukai usus; wajib dipastikan dengan palpasi, perkusi, atau USG',
      'Riwayat operasi abdomen bawah dengan perlengketan (relatif)',
      'Koagulopati yang tidak terkoreksi',
      'Kecurigaan keganasan kandung kemih (risiko penyebaran sepanjang jalur tusukan)',
      'Kehamilan (relatif)',
    ],
    alat: [
      'Set sistostomi atau trokar suprapubik dengan kateter (10-16 Fr)',
      'Untuk aspirasi diagnostik: spuit 10-20 mL dengan jarum spinal 22 G atau jarum panjang',
      'Antiseptik, duk steril berlubang, sarung tangan steril',
      'Lidokain 1-2% untuk anestesi lokal, spuit 5 mL, jarum 23-25 G',
      'Bisturi, benang dan jarum untuk fiksasi, kasa steril, urine bag',
      'USG bedside bila tersedia — sangat dianjurkan untuk memastikan kandung kemih penuh',
    ],
    fases: [
      {
        fase: 'Persiapan & penentuan lokasi',
        steps: [
          'Jelaskan prosedur, jelaskan alasan mengapa kateter uretra tidak dapat dipasang, lalu minta persetujuan tindakan.',
          'PASTIKAN KANDUNG KEMIH PENUH: palpasi massa di suprapubik, perkusi redup, dan idealnya konfirmasi dengan USG. Ini adalah syarat keamanan yang tidak boleh dilewati.',
          'Posisikan pasien terlentang dengan sedikit Trendelenburg agar usus bergeser ke kranial.',
          'Tentukan titik tusukan: GARIS TENGAH, sekitar 2 JARI (2-4 cm) DI ATAS SIMFISIS PUBIS — di atas titik ini terdapat risiko mengenai peritoneum dan usus.',
          'Cukur rambut bila perlu, lakukan antisepsis luas, dan pasang duk steril.',
        ],
      },
      {
        fase: 'Tindakan',
        steps: [
          'Berikan anestesi lokal lidokain infiltrasi pada kulit hingga fasia, sambil melakukan aspirasi berkala.',
          'Untuk ASPIRASI DIAGNOSTIK (misalnya pengambilan sampel urin steril pada bayi): tusukkan jarum tegak lurus 90 derajat terhadap kulit atau sedikit mengarah ke kaudal, sambil melakukan aspirasi terus-menerus hingga urin keluar.',
          'Untuk SISTOSTOMI: buat insisi kecil pada kulit dengan bisturi, lalu masukkan trokar dengan arah tegak lurus atau sedikit ke arah kaudal (menjauhi peritoneum).',
          'Setelah terasa sensasi menembus dinding kandung kemih dan urin mengalir, majukan kateter ke dalam kandung kemih lalu tarik trokar.',
          'Kembangkan balon bila menggunakan kateter berbalon, lalu tarik perlahan hingga terasa tahanan.',
          'Keluarkan urin secara BERTAHAP pada retensi lama untuk mencegah hematuria ex vacuo.',
        ],
      },
      {
        fase: 'Fiksasi & pemantauan',
        steps: [
          'Fiksasi kateter pada kulit dengan jahitan dan plester, lalu tutup dengan kasa steril.',
          'Sambungkan ke urine bag dan posisikan lebih rendah dari kandung kemih.',
          'Pantau warna urin, jumlah, tanda perdarahan, dan tanda iritasi peritoneum.',
          'Dokumentasikan indikasi, volume urin, dan kondisi pascatindakan; rujuk ke urologi untuk penanganan definitif penyebab retensi.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Syarat aman — "PENUH, TENGAH, DUA JARI"',
        kepanjangan: [
          'PENUH — kandung kemih harus teraba/perkusi redup (idealnya konfirmasi USG)',
          'TENGAH — tusukan pada garis tengah (midline)',
          'DUA JARI — sekitar 2-4 cm di atas simfisis pubis',
        ],
        catatan: 'Menusuk terlalu tinggi atau saat kandung kemih kosong berisiko melukai usus dan peritoneum.',
      },
    ],
    tips: [
      'Kandung kemih yang tidak penuh adalah alasan paling sering terjadinya cedera usus — jangan pernah menusuk "coba-coba".',
      'Arahkan jarum sedikit ke KAUDAL untuk menjauhi rongga peritoneum.',
      'Pada trauma dengan dugaan ruptur uretra, sistostomi suprapubik adalah tindakan yang BENAR, sedangkan memaksakan kateter uretra justru memperburuk cedera.',
      'USG bedside sangat menurunkan risiko komplikasi dan sebaiknya digunakan bila tersedia.',
    ],
    komplikasi: [
      'Perforasi usus dan peritonitis',
      'Perdarahan dan hematuria',
      'Infeksi luka dan selulitis di sekitar lokasi',
      'Kebocoran urin ke rongga perivesika',
      'Kateter tersumbat atau terlepas',
    ],
    referensi: ['CAMPBELL2016', 'SCHWARTZ2019', 'ATLS2018'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hecting',
    category: 'Bedah Minor & Luka',
    title: 'Hecting — Penjahitan Luka',
    subtitle: 'Anestesi lokal, pemilihan benang, pola jahitan, dan waktu angkat jahitan',
    diagram: 'suturePatterns',
    indikasi: [
      'Luka terbuka dengan tepi yang dapat didekatkan',
      'Luka yang memerlukan hemostasis',
      'Luka pada area yang memerlukan hasil kosmetik baik',
    ],
    kontraindikasi: [
      'Luka gigitan binatang atau manusia pada umumnya TIDAK dijahit primer (kecuali pada wajah dengan pertimbangan kosmetik dan setelah irigasi sangat adekuat) — risiko infeksi tinggi',
      'Luka terkontaminasi berat atau luka lebih dari 6-8 jam pada ekstremitas — pertimbangkan penjahitan primer tertunda',
      'Luka tusuk dalam yang tidak dapat dieksplorasi seluruhnya',
      'Adanya benda asing atau jaringan nekrotik yang belum dibersihkan',
      'Tanda infeksi aktif pada luka',
    ],
    alat: [
      'Hecting set: needle holder, pinset chirurgis, pinset anatomis, gunting benang, gunting jaringan, klem arteri',
      'Benang dan jarum sesuai lokasi (lihat panduan pemilihan)',
      'Lidokain 1-2%; gunakan TANPA epinefrin pada jari, penis, hidung, dan telinga',
      'Spuit 3-5 mL dengan jarum 25-27 G untuk anestesi',
      'NaCl 0,9% untuk irigasi (idealnya 250-1000 mL tergantung ukuran luka), spuit 20-50 mL untuk irigasi bertekanan',
      'Povidon iodin atau klorheksidin untuk kulit sekitar, duk steril berlubang, sarung tangan steril, kasa',
    ],
    fases: [
      {
        fase: 'Penilaian luka',
        steps: [
          'Nilai mekanisme cedera, waktu kejadian (golden period), derajat kontaminasi, dan kemungkinan benda asing.',
          'Periksa status NEUROVASKULAR dan fungsi TENDON di distal luka SEBELUM anestesi — setelah dianestesi penilaian sensorik menjadi tidak valid.',
          'Nilai kedalaman luka dan struktur di bawahnya; luka pada tangan sering melibatkan tendon dan memerlukan rujukan.',
          'Tanyakan riwayat imunisasi tetanus dan riwayat alergi obat.',
          'Foto rontgen bila dicurigai benda asing radiopak atau fraktur di bawahnya.',
        ],
      },
      {
        fase: 'Anestesi lokal',
        steps: [
          'Aspirasi sebelum menyuntik untuk memastikan tidak masuk pembuluh darah.',
          'Infiltrasi lidokain 1-2% pada tepi luka dari DALAM luka (lebih tidak nyeri) atau dari kulit sekitar, secara perlahan.',
          'Dosis maksimal lidokain: 4,5 mg/kgBB tanpa epinefrin, dan 7 mg/kgBB dengan epinefrin. Ingat bahwa lidokain 1% berarti 10 mg per mL.',
          'JANGAN menggunakan lidokain dengan epinefrin pada bagian tubuh dengan sirkulasi ujung: jari, penis, hidung, daun telinga — risiko iskemia dan nekrosis.',
          'Untuk luka pada jari gunakan blok digital dengan menyuntik pada kedua sisi basis jari.',
          'Uji efektivitas anestesi dengan pinset sebelum memulai penjahitan.',
        ],
      },
      {
        fase: 'Pembersihan luka',
        steps: [
          'IRIGASI adalah langkah paling menentukan dalam mencegah infeksi — gunakan NaCl 0,9% bertekanan dengan spuit 20-50 mL, sebanyak sekitar 50-100 mL per sentimeter panjang luka.',
          'Bersihkan kulit di sekitar luka dengan antiseptik; hindari menuangkan povidon iodin pekat langsung ke dalam luka karena bersifat toksik terhadap jaringan.',
          'Lakukan debridement jaringan nekrotik dan angkat benda asing dengan pinset.',
          'Eksplorasi luka untuk menilai kedalaman dan struktur yang terlibat.',
          'Pasang duk steril berlubang.',
        ],
      },
      {
        fase: 'Teknik penjahitan',
        steps: [
          'Pegang needle holder dengan jarum dijepit pada sepertiga posterior hingga tengah jarum.',
          'Tusukkan jarum TEGAK LURUS 90 derajat terhadap permukaan kulit pada jarak dari tepi luka yang sebanding dengan tebal kulit (umumnya 3-5 mm).',
          'Ikuti LENGKUNG jarum saat mendorong (gerakan supinasi pergelangan), jangan mendorong lurus karena dapat membengkokkan jarum.',
          'Ambil kedalaman yang SAMA pada kedua tepi luka agar tepi bertemu rata tanpa bertingkat.',
          'JAHITAN SIMPUL TERPUTUS (simple interrupted) merupakan pilihan paling umum dan paling aman karena bila satu simpul lepas, sisanya tetap bertahan.',
          'Jarak antarjahitan kurang lebih sama dengan jarak jahitan dari tepi luka.',
          'Tepi luka harus sedikit EVERSI (terangkat ke luar) — tepi yang inversi menyebabkan penyembuhan buruk dan bekas luka lebih jelas.',
          'Ikat simpul dengan tegangan secukupnya untuk mendekatkan tepi, JANGAN terlalu kencang karena edema akan menyebabkan iskemia dan nekrosis tepi luka.',
          'Letakkan simpul di SATU SISI luka, bukan tepat di atas garis luka.',
          'Untuk luka dalam, jahit lapis demi lapis: jahitan subkutan dengan benang absorbable untuk menghilangkan rongga mati, lalu kulit.',
        ],
      },
      {
        fase: 'Pascatindakan',
        steps: [
          'Bersihkan darah, olesi salep antibiotik bila diindikasikan, lalu tutup dengan kasa steril.',
          'Berikan PROFILAKSIS TETANUS sesuai status imunisasi dan jenis luka.',
          'Antibiotik TIDAK rutin diberikan pada luka bersih; diberikan pada luka gigitan, luka terkontaminasi, luka tembus, pasien diabetes, atau imunokompromais.',
          'Edukasi perawatan luka: jaga tetap kering dan bersih, ganti balutan sesuai anjuran, serta kenali tanda infeksi.',
          'Jadwalkan kontrol dan waktu angkat jahitan sesuai lokasi luka.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Waktu angkat jahitan menurut lokasi',
        kepanjangan: [
          'WAJAH — 3-5 hari (kosmetik; makin cepat makin baik)',
          'KULIT KEPALA — 7-10 hari',
          'LEHER — 5-7 hari',
          'BADAN / DADA / PERUT — 7-10 hari',
          'LENGAN & TUNGKAI — 10-14 hari',
          'SENDI & TELAPAK / PUNGGUNG TANGAN & KAKI — 14 hari',
        ],
        catatan: 'Semakin banyak tegangan dan gerakan pada suatu area, semakin lama jahitan dipertahankan.',
      },
      {
        akronim: 'Pemilihan benang',
        kepanjangan: [
          'WAJAH — non-absorbable halus 5-0 atau 6-0 (nilon/prolene)',
          'BADAN & EKSTREMITAS — 3-0 atau 4-0',
          'KULIT KEPALA — 3-0 (lebih kuat)',
          'MUKOSA & SUBKUTAN — absorbable (catgut/vicryl) karena tidak perlu diangkat',
          'Makin besar angka, makin HALUS benangnya',
        ],
      },
      {
        akronim: 'Anestesi lokal — dosis maksimal lidokain',
        kepanjangan: [
          'TANPA epinefrin — 4,5 mg/kgBB',
          'DENGAN epinefrin — 7 mg/kgBB',
          'Lidokain 1% = 10 mg/mL',
          'JANGAN pakai epinefrin pada: jari, penis, hidung, telinga',
        ],
      },
    ],
    tips: [
      'IRIGASI yang adekuat jauh lebih menentukan pencegahan infeksi daripada pemberian antibiotik.',
      'Periksa fungsi saraf dan tendon SEBELUM memberikan anestesi — setelahnya penilaian tidak lagi dapat dipercaya.',
      'Simpul yang terlalu kencang menyebabkan nekrosis tepi luka; sisakan ruang untuk edema.',
      'Eversi tepi luka menghasilkan bekas luka yang lebih halus dibanding tepi yang datar atau masuk ke dalam.',
      'Luka gigitan umumnya tidak dijahit primer; irigasi sangat adekuat, berikan antibiotik, dan pertimbangkan profilaksis rabies serta tetanus.',
      'Pada OSCE, verbalisasikan penilaian neurovaskular, riwayat tetanus, dan irigasi — ketiganya sering menjadi poin penilaian yang terlewat.',
    ],
    komplikasi: [
      'Infeksi luka dan abses',
      'Dehisensi (luka terbuka kembali)',
      'Nekrosis tepi luka akibat jahitan terlalu kencang',
      'Jaringan parut hipertrofik dan keloid',
      'Cedera struktur di bawah luka yang tidak terdeteksi (tendon, saraf, pembuluh darah)',
      'Reaksi terhadap benang atau anestesi lokal, hingga toksisitas sistemik lidokain bila dosis berlebih',
      'Tetanus bila profilaksis terlewat',
    ],
    referensi: ['SCHWARTZ2019', 'ATLS2018', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bidai',
    category: 'Muskuloskeletal',
    title: 'Pembidaian (Splinting) Fraktur',
    subtitle: 'Klavikula, brachii, antebrachii, manus, femur, tibia, dan pedis',
    indikasi: [
      'Fraktur atau dugaan fraktur pada ekstremitas',
      'Dislokasi dan cedera ligamen berat',
      'Imobilisasi sebelum dan selama transportasi pasien',
      'Mengurangi nyeri, perdarahan, dan risiko cedera jaringan lunak lanjutan',
    ],
    kontraindikasi: [
      'Tidak ada kontraindikasi mutlak; namun pembidaian TIDAK boleh menunda penanganan kegawatan jalan napas, pernapasan, dan sirkulasi',
      'Pada fraktur terbuka, jangan mendorong kembali tulang yang menonjol ke dalam luka',
    ],
    alat: [
      'Bidai kaku (spalk kayu, bidai vakum, atau bidai udara) dengan panjang memadai',
      'Mitela (kain segitiga), verban elastis, kasa gulung, dan padding (kapas atau kasa tebal)',
      'Gunting, plester, bantal atau selimut untuk penyangga',
      'Sarung tangan dan kasa steril untuk menutup luka pada fraktur terbuka',
    ],
    fases: [
      {
        fase: 'Prinsip umum pembidaian',
        steps: [
          'Nilai dan catat status NEUROVASKULAR DISTAL sebelum dan sesudah pembidaian: warna, suhu, capillary refill, pulsasi, sensasi, dan gerakan. Dokumentasikan keduanya.',
          'Berikan analgesia yang memadai sebelum melakukan manipulasi.',
          'Buka atau gunting pakaian pada area cedera; lepaskan cincin, jam, dan gelang sebelum pembengkakan bertambah.',
          'Tutup luka pada fraktur terbuka dengan kasa steril lebih dahulu; JANGAN mendorong kembali tulang yang menonjol.',
          'IMOBILISASI harus mencakup SENDI DI PROKSIMAL DAN DI DISTAL lokasi fraktur.',
          'Beri padding yang cukup terutama pada tonjolan tulang untuk mencegah luka tekan.',
          'Bidai dalam POSISI DITEMUKAN bila terdapat deformitas berat dan nadi distal masih baik; luruskan hati-hati hanya bila perfusi distal terganggu.',
          'Ikat bidai secukupnya — tidak boleh terlalu ketat sehingga menghambat sirkulasi; periksa ulang setelah terpasang.',
          'Elevasi ekstremitas dan berikan kompres dingin bila memungkinkan.',
        ],
      },
      {
        fase: 'Klavikula',
        steps: [
          'Gunakan MITELA (arm sling) untuk menyangga lengan sisi yang cedera, atau balutan RANSEL (figure-of-eight bandage) untuk menarik bahu ke belakang.',
          'Pada mitela, siku difleksikan 90 derajat dan lengan bawah disangga dengan pergelangan tangan sedikit lebih tinggi dari siku.',
          'Simpul mitela diletakkan di sisi leher yang SEHAT agar tidak menekan tulang belakang leher dan tidak menimbulkan nyeri.',
          'Periksa sirkulasi dan sensasi lengan setelah pemasangan; balutan ransel yang terlalu ketat dapat menekan pleksus brakialis.',
        ],
      },
      {
        fase: 'Humerus (brachii)',
        steps: [
          'Pasang bidai pada sisi lateral lengan atas dari BAHU hingga melewati SIKU.',
          'Sangga lengan bawah dengan mitela dan tambahkan swathe (balutan melingkar dada) untuk memfiksasi lengan ke dinding dada.',
          'Periksa fungsi NERVUS RADIALIS: kemampuan ekstensi pergelangan tangan dan jari, serta sensasi pada dorsum tangan antara ibu jari dan telunjuk — nervus radialis paling sering cedera pada fraktur humerus.',
        ],
      },
      {
        fase: 'Antebrachii (radius-ulna)',
        steps: [
          'Pasang bidai dari SIKU hingga melewati PERGELANGAN TANGAN sampai pangkal jari.',
          'Posisikan lengan bawah dalam posisi netral atau pronasi ringan, dengan pergelangan tangan sedikit ekstensi.',
          'Sangga dengan mitela dan pastikan siku terfiksasi dalam fleksi 90 derajat.',
          'Fraktur distal radius (Colles) menimbulkan deformitas khas menyerupai garpu makan (dinner fork deformity).',
        ],
      },
      {
        fase: 'Manus (tangan & jari)',
        steps: [
          'Imobilisasi tangan dalam POSISI FUNGSIONAL: pergelangan ekstensi sekitar 20-30 derajat, sendi metakarpofalang fleksi 70-90 derajat, dan sendi interfalang hampir lurus — posisi seperti sedang menggenggam gelas.',
          'Letakkan gulungan kasa pada telapak tangan untuk mempertahankan posisi tersebut.',
          'Untuk fraktur jari, dapat digunakan buddy taping yaitu mengikat jari yang cedera pada jari sehat di sebelahnya dengan pemisah kasa.',
          'Elevasi tangan untuk mengurangi pembengkakan.',
        ],
      },
      {
        fase: 'Femur',
        steps: [
          'Fraktur femur dapat menyebabkan kehilangan darah 1-2 liter ke dalam paha — nilai tanda syok dan pasang jalur infus.',
          'Gunakan BIDAI TRAKSI (traction splint) bila tersedia untuk fraktur batang femur tertutup, karena mengurangi nyeri, perdarahan, dan spasme otot.',
          'BIDAI TRAKSI merupakan KONTRAINDIKASI pada fraktur pelvis, fraktur leher femur, cedera lutut, dan fraktur tungkai bawah yang menyertai.',
          'Bila bidai traksi tidak tersedia, pasang bidai panjang dari PANGGUL (setinggi krista iliaka atau aksila) hingga melewati LUTUT sampai pergelangan kaki, dan ikat kedua tungkai bersama dengan padding di antaranya.',
          'Periksa pulsasi arteri dorsalis pedis dan tibialis posterior sebelum dan sesudah pemasangan.',
        ],
      },
      {
        fase: 'Tibia-fibula (cruris)',
        steps: [
          'Pasang bidai dari atas LUTUT hingga melewati PERGELANGAN KAKI, idealnya pada sisi medial dan lateral.',
          'Posisikan pergelangan kaki dalam 90 derajat (posisi netral) untuk mencegah kontraktur equinus.',
          'Beri padding pada maleolus dan kaput fibula — NERVUS PERONEUS KOMUNIS berjalan superfisial di kaput fibula dan mudah tertekan sehingga menimbulkan drop foot.',
          'WASPADAI SINDROM KOMPARTEMEN pada fraktur tibia: nyeri hebat tidak sebanding dengan cedera, nyeri saat peregangan pasif jari kaki, parestesia, dan tegang pada kompartemen. Bila dicurigai, LONGGARKAN semua balutan dan segera rujuk untuk fasciotomi.',
        ],
      },
      {
        fase: 'Pedis (kaki & pergelangan kaki)',
        steps: [
          'Gunakan bidai posterior berbentuk L dari belakang tungkai bawah hingga telapak kaki, dengan pergelangan kaki dipertahankan 90 derajat.',
          'Alternatif: gunakan bantal atau selimut yang dilipat mengelilingi kaki dan pergelangan kaki lalu diikat.',
          'Jangan menutup jari-jari kaki agar sirkulasi tetap dapat dipantau.',
          'Elevasi tungkai dan berikan kompres dingin.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Prinsip bidai — "PNP"',
        kepanjangan: [
          'P — Periksa neurovaskular distal SEBELUM dan SESUDAH',
          'N — Netralkan dengan melewati sendi Proksimal dan Distal',
          'P — Padding cukup, ikat tidak terlalu ketat',
        ],
      },
      {
        akronim: 'Sindrom kompartemen — 6P',
        kepanjangan: [
          'Pain — nyeri hebat tidak sebanding cedera (tanda paling awal)',
          'Pain on passive stretch — nyeri saat peregangan pasif (paling sensitif)',
          'Paresthesia — kesemutan',
          'Pallor — pucat',
          'Pulselessness — nadi hilang (tanda LAMBAT)',
          'Paralysis — lumpuh (tanda LAMBAT)',
        ],
        catatan: 'Jangan menunggu nadi hilang untuk mendiagnosis — pada saat itu kerusakan otot dan saraf sudah terjadi.',
      },
      {
        akronim: 'Saraf yang berisiko menurut lokasi fraktur',
        kepanjangan: [
          'HUMERUS batang — N. radialis (drop hand)',
          'HUMERUS suprakondilar (anak) — N. medianus & a. brakialis',
          'KAPUT FIBULA — N. peroneus komunis (drop foot)',
          'DISLOKASI BAHU — N. aksilaris (baal di regio deltoid)',
          'DISLOKASI PANGGUL posterior — N. iskiadikus',
        ],
      },
    ],
    tips: [
      'Dokumentasi status neurovaskular sebelum dan sesudah pembidaian adalah keharusan medikolegal, bukan sekadar formalitas.',
      'Fraktur femur dapat menyembunyikan perdarahan 1-2 liter — selalu nilai tanda syok.',
      'Jangan pernah mendorong kembali tulang yang menonjol pada fraktur terbuka; tutup dengan kasa steril lembap dan berikan antibiotik serta profilaksis tetanus.',
      'Balutan yang terlalu ketat adalah penyebab sindrom kompartemen iatrogenik — periksa ulang secara berkala.',
      'Selalu sisakan ujung jari tangan atau kaki terbuka agar perfusi dapat dipantau.',
      'Pada fraktur terbuka, antibiotik dalam 1 jam pertama menurunkan risiko infeksi secara bermakna.',
    ],
    komplikasi: [
      'Sindrom kompartemen akibat balutan terlalu ketat atau pembengkakan progresif',
      'Cedera neurovaskular akibat manipulasi yang kasar',
      'Luka tekan pada tonjolan tulang akibat padding tidak memadai',
      'Fraktur tertutup berubah menjadi terbuka akibat manipulasi berlebihan',
      'Kontraktur akibat imobilisasi pada posisi yang salah',
      'Emboli lemak pada fraktur tulang panjang',
    ],
    referensi: ['ATLS2018', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sirkumsisi',
    category: 'Bedah Minor & Luka',
    title: 'Sirkumsisi & Dorsumsisi',
    subtitle: 'Teknik dorsal slit dan pembedahan; dorsumsisi sebagai tindakan darurat parafimosis',
    indikasi: [
      'SIRKUMSISI: fimosis patologis, balanopostitis berulang, parafimosis rekuren, kondiloma preputium, serta indikasi agama dan budaya',
      'DORSUMSISI (dorsal slit): PARAFIMOSIS yang tidak berhasil direduksi manual — merupakan tindakan darurat untuk membebaskan jepitan',
      'Fimosis berat dengan retensi urin yang memerlukan pembebasan segera',
    ],
    kontraindikasi: [
      'HIPOSPADIA dan EPISPADIA — KONTRAINDIKASI MUTLAK, karena kulit preputium diperlukan untuk rekonstruksi uretra di kemudian hari',
      'Kelainan kongenital penis lain: chordee, mikropenis, penis tersembunyi (buried penis), webbed penis',
      'Gangguan pembekuan darah yang belum terkoreksi (hemofilia, trombositopenia berat)',
      'Infeksi lokal akut yang aktif (tunda hingga tenang, kecuali dorsumsisi darurat)',
      'Bayi belum stabil, prematur, atau dengan penyakit penyerta yang belum teratasi',
    ],
    alat: [
      'Sirkumsisi set: klem lurus dan bengkok, gunting jaringan, needle holder, pinset chirurgis, klem bengkok (mosquito), duk klem',
      'Lidokain 1-2% TANPA EPINEFRIN (mutlak — epinefrin berisiko nekrosis penis)',
      'Spuit 3-5 mL dengan jarum 25-27 G',
      'Benang absorbable halus (catgut/vicryl 4-0 atau 5-0)',
      'Antiseptik povidon iodin, duk steril berlubang, sarung tangan steril, kasa steril',
      'Kauter atau klem untuk hemostasis, salep antibiotik',
    ],
    fases: [
      {
        fase: 'Persiapan & informed consent',
        steps: [
          'Jelaskan prosedur, manfaat, risiko, dan perawatan pascatindakan; minta persetujuan tertulis dari pasien atau orang tua.',
          'PERIKSA ANATOMI PENIS DENGAN TELITI SEBELUM TINDAKAN — pastikan tidak ada hipospadia (muara uretra tidak di ujung glans), epispadia, atau chordee. Ini adalah langkah keselamatan yang tidak boleh dilewati.',
          'Tanyakan riwayat perdarahan pada pasien dan keluarga, serta riwayat alergi obat.',
          'Posisikan pasien terlentang; jaga privasi dan kehangatan terutama pada bayi.',
          'Antisepsis lapangan operasi dari glans ke arah luar secara melingkar, lalu pasang duk steril berlubang.',
        ],
      },
      {
        fase: 'Anestesi',
        steps: [
          'BLOK PENIS (dorsal penile nerve block): suntikkan lidokain 1% tanpa epinefrin pada posisi jam 10 dan jam 2 di basis penis, tepat di bawah fasia Buck, setelah melakukan aspirasi.',
          'Tambahkan infiltrasi cincin (ring block) melingkar di basis penis untuk melengkapi anestesi.',
          'Dosis pada anak disesuaikan berat badan; batas aman lidokain tanpa epinefrin adalah 4,5 mg/kgBB.',
          'MUTLAK JANGAN menggunakan lidokain dengan epinefrin — penis merupakan organ dengan sirkulasi ujung sehingga vasokonstriksi dapat menyebabkan nekrosis.',
          'Tunggu 5-10 menit dan uji efektivitas anestesi dengan pinset sebelum memulai.',
        ],
      },
      {
        fase: 'DORSUMSISI (dorsal slit) — darurat parafimosis',
        steps: [
          'Coba lebih dahulu REDUKSI MANUAL: kompres dingin dan tekan glans secara konstan selama beberapa menit untuk mengurangi edema, lalu dorong glans ke belakang sambil menarik preputium ke depan.',
          'Bila reduksi manual gagal, lakukan dorsumsisi sebagai tindakan penyelamatan.',
          'Setelah anestesi bekerja, jepit preputium pada posisi jam 12 dengan dua klem, satu di sisi luar dan satu di sisi dalam preputium.',
          'Gunting preputium pada garis di antara kedua klem ke arah proksimal hingga melewati cincin jepitan (constricting band) — inilah yang membebaskan jepitan.',
          'Jahit tepi luka dengan benang absorbable secara jelujur atau simpul terputus untuk hemostasis.',
          'Dorsumsisi bersifat SEMENTARA dan tidak rapi secara kosmetik; jadwalkan sirkumsisi definitif setelah edema dan inflamasi mereda.',
        ],
      },
      {
        fase: 'SIRKUMSISI — teknik dorsal slit dengan eksisi',
        steps: [
          'Bebaskan perlekatan antara preputium dan glans dengan sonde atau klem secara hati-hati, lalu bersihkan smegma.',
          'Tandai batas insisi: sekitar 0,5-1 cm proksimal dari sulkus koronarius pada lembar luar, dan sejajar sulkus pada lembar dalam.',
          'Lakukan dorsal slit pada posisi jam 12 hingga sekitar 0,5-1 cm dari sulkus koronarius.',
          'Eksisi preputium secara melingkar mengikuti garis penandaan, dengan menyisakan mukosa dalam sekitar 3-5 mm dari sulkus.',
          'JAGA JARAK AMAN dari glans dan frenulum; hati-hati pada arteri frenularis di posisi jam 6 yang sering menjadi sumber perdarahan.',
          'Lakukan hemostasis dengan klem dan ligasi atau kauter; pastikan tidak ada perdarahan aktif sebelum menjahit.',
          'Jahit tepi kulit dengan mukosa menggunakan benang absorbable 4-0 atau 5-0, dimulai dari jam 12, 6, 3, dan 9 sebagai jahitan penyangga, lalu lengkapi di antaranya.',
          'Jahitan frenulum dikerjakan dengan cermat karena merupakan lokasi perdarahan tersering pascatindakan.',
        ],
      },
      {
        fase: 'Pascatindakan & edukasi',
        steps: [
          'Olesi salep antibiotik dan balut longgar dengan kasa; jangan membalut terlalu ketat karena berisiko iskemia.',
          'Observasi 15-30 menit untuk memastikan tidak ada perdarahan aktif sebelum pasien pulang.',
          'Berikan analgesik (parasetamol) dan antibiotik bila diindikasikan.',
          'Edukasi: jaga area tetap bersih dan kering, boleh mandi setelah 1-2 hari sesuai anjuran, gunakan celana longgar, dan hindari aktivitas berat serta bersepeda selama 1-2 minggu.',
          'Jelaskan bahwa bengkak dan warna kebiruan ringan adalah normal pada beberapa hari pertama.',
          'SEGERA kembali bila: perdarahan yang tidak berhenti dengan penekanan, bengkak hebat, nanah, demam, atau TIDAK BISA BUANG AIR KECIL.',
          'Kontrol dalam 3-7 hari; benang absorbable akan lepas sendiri.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Kontraindikasi mutlak — "HEC"',
        kepanjangan: [
          'H — Hipospadia (dan Epispadia)',
          'E — Epispadia',
          'C — Chordee dan kelainan kongenital penis lain',
        ],
        catatan: 'Preputium diperlukan sebagai bahan rekonstruksi uretra. Menyirkumsisi pasien hipospadia menghilangkan bahan tersebut dan menyulitkan operasi perbaikan di kemudian hari.',
      },
      {
        akronim: 'Fimosis vs Parafimosis',
        kepanjangan: [
          'FIMOSIS — preputium TIDAK BISA DITARIK ke belakang; umumnya tidak darurat',
          'PARAFIMOSIS — preputium sudah tertarik ke belakang dan TIDAK BISA DIKEMBALIKAN, menjepit batang penis; DARURAT karena berisiko iskemia glans',
        ],
        catatan: 'Penyebab parafimosis iatrogenik paling sering adalah lupa mengembalikan preputium setelah pemasangan kateter.',
      },
    ],
    tips: [
      'Periksa muara uretra SEBELUM menyentuh pisau — hipospadia yang terlewat adalah kesalahan yang tidak dapat diperbaiki.',
      'Lidokain untuk penis WAJIB tanpa epinefrin.',
      'Perdarahan pascasirkumsisi paling sering berasal dari arteri frenularis di posisi jam 6 — pastikan hemostasis di titik ini.',
      'Pada parafimosis, selalu coba reduksi manual dengan kompres dingin lebih dahulu sebelum memutuskan dorsumsisi.',
      'Balutan yang terlalu ketat dapat menyebabkan iskemia glans — balut longgar.',
      'Retensi urin pascatindakan merupakan tanda bahaya yang memerlukan evaluasi segera.',
    ],
    komplikasi: [
      'Perdarahan (terutama dari arteri frenularis)',
      'Infeksi luka operasi',
      'Cedera glans atau uretra akibat eksisi terlalu dalam',
      'Eksisi kulit berlebihan atau kurang, hasil kosmetik tidak simetris',
      'Stenosis meatus di kemudian hari',
      'Nekrosis penis akibat penggunaan epinefrin atau balutan terlalu ketat',
      'Pembentukan adhesi dan jembatan kulit (skin bridge)',
    ],
    referensi: ['CAMPBELL2016', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'iud',
    category: 'Obstetri & Ginekologi',
    title: 'Pemasangan & Pelepasan AKDR (IUD)',
    subtitle: 'Teknik withdrawal, waktu pemasangan, dan penanganan benang tidak terlihat',
    indikasi: [
      'Kontrasepsi jangka panjang yang sangat efektif dan reversibel',
      'Perempuan yang menginginkan kontrasepsi tanpa hormon (AKDR tembaga)',
      'Kontrasepsi darurat: AKDR tembaga dapat dipasang hingga 5 hari pascasenggama tanpa pelindung',
      'AKDR levonorgestrel juga bermanfaat untuk menorrhagia dan proteksi endometrium',
    ],
    kontraindikasi: [
      'KEHAMILAN atau dugaan kehamilan — wajib disingkirkan sebelum pemasangan',
      'Perdarahan pervaginam yang belum diketahui penyebabnya',
      'Infeksi panggul aktif, servisitis purulen, atau infeksi menular seksual aktif',
      'Sepsis pascapersalinan dan pascaabortus septik',
      'Keganasan serviks, endometrium, atau penyakit trofoblas ganas',
      'Kelainan kavum uteri yang mengganggu pemasangan (mioma submukosa besar, malformasi uterus)',
      'Alergi tembaga dan penyakit Wilson (khusus AKDR tembaga)',
    ],
    alat: [
      'AKDR dalam kemasan steril yang belum kedaluwarsa (CuT-380A atau LNG-IUS)',
      'Spekulum Sims atau cocor bebek, tenakulum, sonde uterus, gunting benang panjang',
      'Sarung tangan steril, antiseptik povidon iodin, kasa dan tampon tang',
      'Lampu sorot, meja ginekologi, alas bokong',
      'Tes kehamilan urin bila status kehamilan belum pasti',
    ],
    fases: [
      {
        fase: 'Konseling & persiapan',
        steps: [
          'Lakukan konseling metode kontrasepsi secara menyeluruh; jelaskan cara kerja, efektivitas, lama pemakaian, efek samping, dan cara pelepasan. Minta persetujuan.',
          'SINGKIRKAN KEHAMILAN: tanyakan hari pertama haid terakhir dan riwayat senggama; lakukan tes kehamilan bila ragu.',
          'Tapis kontraindikasi dan risiko infeksi menular seksual; obati infeksi lebih dahulu bila ada.',
          'WAKTU PEMASANGAN: dapat kapan saja dalam siklus asalkan dipastikan tidak hamil. Saat haid memudahkan karena serviks lebih terbuka dan kehamilan dapat disingkirkan. Pascapersalinan dapat dalam 10 menit setelah plasenta lahir, atau setelah 4 minggu. Pascaabortus dapat segera bila tidak ada infeksi.',
          'Minta pasien mengosongkan kandung kemih, lalu posisikan litotomi.',
          'Cuci tangan dan pakai sarung tangan.',
        ],
      },
      {
        fase: 'Pemeriksaan bimanual & antisepsis',
        steps: [
          'Lakukan PEMERIKSAAN BIMANUAL untuk menentukan UKURAN, POSISI (antefleksi atau retrofleksi), dan konsistensi uterus, serta menilai adanya massa atau nyeri goyang serviks.',
          'Langkah ini krusial — memasang AKDR tanpa mengetahui arah uterus adalah penyebab utama perforasi.',
          'Pasang spekulum dan inspeksi serviks untuk menilai adanya duh purulen, lesi, atau tanda infeksi.',
          'Usap serviks dan vagina dengan antiseptik dua kali menggunakan kasa berbeda.',
        ],
      },
      {
        fase: 'Pemasangan — teknik withdrawal',
        steps: [
          'Jepit bibir depan serviks dengan TENAKULUM pada posisi jam 11 dan jam 1; lakukan perlahan dan beri tahu pasien akan terasa seperti dicubit.',
          'Lakukan traksi lembut pada tenakulum untuk MELURUSKAN sudut antara kanalis servikalis dan kavum uteri.',
          'Masukkan SONDE UTERUS dengan teknik tanpa sentuh (no-touch technique) untuk mengukur kedalaman dan arah kavum uteri; kedalaman normal 6-9 cm. Bila kurang dari 6,5 cm, pemasangan umumnya tidak dianjurkan.',
          'Atur leher biru (blue flange) pada tabung inserter sesuai kedalaman hasil sonde, dan pastikan bidangnya sejajar dengan lengan horizontal AKDR.',
          'Masukkan tabung inserter berisi AKDR ke dalam kavum uteri hingga leher biru menyentuh serviks.',
          'TEKNIK WITHDRAWAL: tahan pendorong (plunger) tetap di tempatnya, lalu TARIK TABUNG INSERTER ke arah luar sehingga lengan AKDR terlepas membuka membentuk huruf T. Teknik ini mengurangi risiko perforasi dibandingkan teknik mendorong.',
          'Setelah lengan terbuka, dorong tabung inserter perlahan ke atas hingga terasa menyentuh fundus, lalu tarik keluar pendorong terlebih dahulu, baru tabung inserter.',
          'Gunting benang AKDR menyisakan sekitar 3-4 cm dari ostium eksternum.',
          'Lepaskan tenakulum, periksa perdarahan pada bekas jepitan, lalu lepaskan spekulum.',
        ],
      },
      {
        fase: 'Pascapemasangan & edukasi',
        steps: [
          'Minta pasien beristirahat sejenak dan pantau adanya reaksi vasovagal (pusing, berkeringat, bradikardia).',
          'AJARKAN PASIEN MEMERIKSA BENANG sendiri secara berkala, terutama setelah haid, dengan cara mencuci tangan lalu meraba benang di mulut rahim.',
          'Catat jenis AKDR, tanggal pemasangan, panjang sonde, dan tanggal perkiraan pelepasan pada kartu peserta.',
          'Jadwalkan kontrol 4-6 minggu setelah pemasangan atau setelah haid berikutnya.',
          'EDUKASI TANDA BAHAYA dengan mnemonik PAINS.',
          'PELEPASAN: jepit benang dengan klem lalu tarik perlahan dengan traksi mantap. Bila benang tidak terlihat, jangan memaksa — lakukan USG untuk memastikan AKDR masih di dalam kavum, lalu lepaskan dengan alat khusus atau histeroskopi.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Tanda bahaya AKDR — "PAINS"',
        kepanjangan: [
          'P — Period late (haid terlambat, curiga hamil) atau perdarahan abnormal',
          'A — Abdominal pain (nyeri perut) atau nyeri saat berhubungan',
          'I — Infection (duh vagina abnormal atau berbau)',
          'N — Not feeling well (demam, menggigil, tidak enak badan)',
          'S — String missing (benang tidak teraba, lebih pendek, atau lebih panjang)',
        ],
      },
      {
        akronim: 'Benang tidak terlihat — tiga kemungkinan',
        kepanjangan: [
          '1 — Benang terlipat masuk ke kanalis servikalis (paling sering)',
          '2 — EKSPULSI (AKDR keluar tanpa disadari) → risiko kehamilan',
          '3 — PERFORASI dan migrasi ke rongga abdomen',
        ],
        catatan: 'Selalu singkirkan KEHAMILAN lebih dahulu, lalu lakukan USG untuk memastikan lokasi AKDR sebelum tindakan lain.',
      },
    ],
    tips: [
      'Pemeriksaan bimanual untuk menentukan arah uterus adalah langkah pencegahan perforasi yang paling penting — jangan pernah dilewati.',
      'Gunakan teknik WITHDRAWAL (menarik tabung), bukan mendorong AKDR, untuk menurunkan risiko perforasi.',
      'Traksi tenakulum meluruskan sudut uterus dan membuat pemasangan jauh lebih mudah serta lebih aman.',
      'AKDR tembaga adalah kontrasepsi darurat paling efektif dan dapat dipasang hingga 5 hari pascasenggama.',
      'Bila pasien hamil dengan AKDR terpasang dan benang terlihat, AKDR sebaiknya dilepas untuk menurunkan risiko abortus septik — konsultasikan.',
      'Nyeri perut hebat dengan demam pada pengguna AKDR harus dievaluasi sebagai penyakit radang panggul sampai terbukti sebaliknya.',
    ],
    komplikasi: [
      'Perforasi uterus saat pemasangan',
      'Ekspulsi, terutama pada bulan-bulan pertama',
      'Penyakit radang panggul (risiko tertinggi pada 20 hari pertama pascapemasangan)',
      'Perdarahan haid lebih banyak dan nyeri haid (khas pada AKDR tembaga)',
      'Kehamilan dengan AKDR in situ, termasuk peningkatan proporsi kehamilan ektopik',
      'Reaksi vasovagal saat pemasangan',
      'Benang hilang dan AKDR tertanam (embedded)',
    ],
    referensi: ['POGI2016', 'WILLIAMSOB2022', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'implan',
    category: 'Obstetri & Ginekologi',
    title: 'Pemasangan & Pencabutan Implan (Susuk KB)',
    subtitle: 'Insersi subdermal lengan atas non-dominan dan teknik pencabutan',
    indikasi: [
      'Kontrasepsi jangka panjang 3 tahun yang sangat efektif dan reversibel',
      'Perempuan yang menginginkan metode tanpa estrogen (aman untuk ibu menyusui)',
      'Kesulitan mematuhi kontrasepsi harian seperti pil',
      'Kontraindikasi terhadap estrogen (migren dengan aura, riwayat tromboemboli)',
    ],
    kontraindikasi: [
      'Kehamilan atau dugaan kehamilan',
      'Perdarahan pervaginam yang belum diketahui penyebabnya',
      'Kanker payudara saat ini atau riwayat kanker payudara',
      'Penyakit hati berat dan tumor hati',
      'Tromboemboli vena aktif (relatif)',
      'Penggunaan obat yang menginduksi enzim hati (rifampisin, sebagian antiepilepsi) yang menurunkan efektivitas',
    ],
    alat: [
      'Implan dalam kemasan steril dengan aplikator (batang tunggal atau dua batang sesuai jenis)',
      'Lidokain 1% tanpa epinefrin, spuit 3-5 mL, jarum 25-27 G',
      'Sarung tangan steril, antiseptik, duk steril berlubang, kasa',
      'Untuk pencabutan: bisturi 11, klem mosquito lurus dan bengkok, needle holder',
      'Plester, verban elastis untuk balut tekan',
    ],
    fases: [
      {
        fase: 'Konseling & persiapan',
        steps: [
          'Konseling menyeluruh: cara kerja, efektivitas sangat tinggi, lama pemakaian 3 tahun, dan yang PALING PENTING — efek samping berupa PERUBAHAN POLA HAID yang hampir selalu terjadi (haid tidak teratur, bercak, atau tidak haid sama sekali).',
          'Konseling pola haid ini merupakan penentu utama kepuasan dan kelangsungan pemakaian; banyak pencabutan dini terjadi hanya karena pasien tidak diberi tahu sebelumnya.',
          'Singkirkan kehamilan; tapis kontraindikasi dan riwayat obat penginduksi enzim hati.',
          'WAKTU PEMASANGAN: hari ke-1 sampai ke-7 siklus haid tidak memerlukan kontrasepsi tambahan. Di luar itu, pastikan tidak hamil dan gunakan kontrasepsi tambahan selama 7 hari.',
          'Posisikan pasien terlentang dengan LENGAN NON-DOMINAN diabduksikan dan siku difleksikan, tangan di bawah kepala.',
        ],
      },
      {
        fase: 'Penentuan lokasi & anestesi',
        steps: [
          'Tentukan lokasi insersi: sisi MEDIAL lengan atas non-dominan, sekitar 8-10 cm di atas epikondilus medialis, di alur antara m. biceps dan m. triceps.',
          'Lokasi ini dipilih karena JAUH dari sulkus bisipitalis tempat berjalannya nervus ulnaris dan pembuluh darah brakialis.',
          'Tandai jalur insersi dengan pena steril.',
          'Antisepsis area yang luas dan pasang duk steril berlubang.',
          'Anestesi lidokain 1% tanpa epinefrin secara SUBDERMAL sepanjang jalur yang telah ditandai (sekitar 2-3 mL), setelah aspirasi.',
        ],
      },
      {
        fase: 'Insersi',
        steps: [
          'Regangkan kulit pada area insersi.',
          'Tusukkan ujung aplikator dengan sudut sekitar 30 derajat hanya sampai menembus kulit.',
          'Setelah menembus dermis, TURUNKAN aplikator hingga hampir SEJAJAR permukaan kulit — implan harus berada tepat di bawah kulit (subdermal), bukan di dalam otot.',
          'Angkat kulit dengan ujung aplikator (tenting) sambil memajukan aplikator secara perlahan sepanjang jalur; batang implan harus TERABA dan hampir terlihat membayang di bawah kulit.',
          'Setelah aplikator masuk seluruhnya, lepaskan implan sesuai mekanisme alat (umumnya dengan menarik aplikator sambil menahan pendorong).',
          'RABA IMPLAN dengan jari untuk memastikan posisi dan jumlah batang sudah benar; MINTA PASIEN JUGA MERABANYA agar ia dapat memeriksanya sendiri di rumah.',
          'Tutup luka tusuk dengan plester; tidak diperlukan jahitan.',
          'Pasang balut tekan dengan verban elastis selama 24-48 jam untuk mengurangi memar dan hematoma.',
        ],
      },
      {
        fase: 'Pencabutan',
        steps: [
          'Raba dan tentukan lokasi ujung implan yang paling dekat dengan permukaan; tandai.',
          'Antisepsis dan berikan anestesi lokal TEPAT DI BAWAH ujung distal implan (bukan di atasnya, agar implan tidak terdorong lebih dalam dan tetap teraba).',
          'Buat insisi kecil 2-3 mm pada kulit di dekat ujung implan.',
          'Dorong implan ke arah insisi dengan jari, lalu jepit dengan klem mosquito dan tarik keluar.',
          'Bila implan terbungkus jaringan fibrosa, bersihkan selubung tersebut dengan bisturi atau kasa sebelum menarik.',
          'Pastikan JUMLAH BATANG yang dikeluarkan SESUAI dengan yang dipasang.',
          'Bila implan tidak teraba, JANGAN melakukan eksplorasi buta — rujuk untuk lokalisasi dengan USG frekuensi tinggi atau pencitraan lain.',
          'Tutup insisi dengan plester; jahitan umumnya tidak diperlukan. Pasang balut tekan.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'Lokasi aman — "NON-DOMINAN, MEDIAL, 8-10 cm"',
        kepanjangan: [
          'Lengan NON-DOMINAN',
          'Sisi MEDIAL, di alur antara biceps dan triceps',
          '8-10 cm DI ATAS epikondilus medialis',
        ],
        catatan: 'Menjauhi sulkus bisipitalis melindungi nervus ulnaris dan pembuluh brakialis dari cedera.',
      },
      {
        akronim: 'Kunci keberhasilan konseling',
        kepanjangan: [
          'Perubahan POLA HAID hampir selalu terjadi dan merupakan hal normal',
          'Bukan tanda bahaya dan tidak mengganggu kesuburan setelah dicabut',
          'Konseling yang jelas di awal mencegah pencabutan dini',
        ],
      },
    ],
    tips: [
      'Implan harus SUBDERMAL — bila terlalu dalam (intramuskular), pencabutan menjadi sangat sulit dan berisiko melukai saraf.',
      'Minta pasien meraba implannya sendiri setelah pemasangan; ini memberdayakan pasien sekaligus memastikan posisi benar.',
      'Anestesi saat pencabutan diberikan DI BAWAH implan, bukan di atasnya.',
      'Jangan pernah melakukan eksplorasi buta bila implan tidak teraba — rujuk untuk pencitraan.',
      'Obat penginduksi enzim hati seperti rifampisin menurunkan efektivitas implan secara bermakna; sarankan metode tambahan.',
      'Kesuburan kembali dengan cepat setelah pencabutan — sampaikan ini pada konseling.',
    ],
    komplikasi: [
      'Memar, hematoma, dan nyeri lokal',
      'Infeksi pada lokasi insersi',
      'Implan terpasang terlalu dalam sehingga sulit dicabut',
      'Migrasi implan (jarang)',
      'Cedera saraf atau pembuluh darah bila lokasi insersi salah',
      'Perubahan pola haid yang mengganggu dan menjadi alasan pencabutan dini',
      'Jaringan parut pada lokasi insisi',
    ],
    referensi: ['POGI2016', 'WILLIAMSOB2022', 'PPKFKTP2014'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'iva-papsmear',
    category: 'Obstetri & Ginekologi',
    title: 'IVA & Pap Smear — Skrining Kanker Serviks',
    subtitle: 'Inspeksi visual asam asetat dan sitologi serviks',
    indikasi: [
      'Skrining kanker serviks pada perempuan usia 30-50 tahun yang sudah pernah berhubungan seksual',
      'IVA diulang setiap 3-5 tahun bila hasil negatif; Pap smear setiap 3 tahun (atau 5 tahun bila dikombinasi tes HPV)',
      'Skrining lebih dini dan lebih sering pada perempuan dengan HIV atau imunokompromais',
    ],
    kontraindikasi: [
      'Sedang menstruasi (tunda hingga selesai) — darah mengganggu penilaian dan kualitas sediaan',
      'Infeksi serviks atau vagina akut — obati lebih dahulu',
      'Belum pernah berhubungan seksual',
      'Kehamilan bukan kontraindikasi mutlak untuk IVA, namun pengambilan sampel endoserviks pada Pap smear perlu kehati-hatian',
      'Pascapersalinan kurang dari 6 minggu',
    ],
    alat: [
      'Spekulum cocor bebek (Cusco) berbagai ukuran, lampu sorot yang terang',
      'IVA: asam asetat 3-5% (dapat dibuat dari cuka dapur yang diencerkan), lidi kapas besar, wadah',
      'Pap smear: spatula Ayre dan/atau cytobrush, kaca objek dengan label, alkohol 95% atau fiksatif semprot, atau media cair untuk liquid-based cytology',
      'Sarung tangan, meja ginekologi, alas bokong, formulir permintaan pemeriksaan',
    ],
    fases: [
      {
        fase: 'Persiapan pasien',
        steps: [
          'Jelaskan tujuan skrining, prosedur, dan bahwa pemeriksaan mungkin terasa tidak nyaman namun singkat. Minta persetujuan dan JAGA PRIVASI.',
          'Anjuran sebelum pemeriksaan: tidak berhubungan seksual, tidak menggunakan obat atau bilasan vagina, dan tidak sedang haid dalam 24-48 jam sebelumnya.',
          'Minta pasien mengosongkan kandung kemih, lalu posisikan litotomi dengan penutup tubuh yang memadai.',
          'Cuci tangan dan pakai sarung tangan.',
        ],
      },
      {
        fase: 'Pemasangan spekulum & inspeksi',
        steps: [
          'Inspeksi genitalia eksterna untuk menilai lesi, duh, dan tanda infeksi.',
          'Masukkan spekulum dalam posisi miring lalu putar hingga horizontal; buka perlahan hingga SELURUH SERVIKS TERLIHAT dan kunci.',
          'Gunakan pelumas seminimal mungkin atau air saja pada Pap smear karena pelumas dapat mengganggu interpretasi sitologi.',
          'Identifikasi SAMBUNGAN SKUAMOKOLUMNAR (SSK) atau zona transformasi — inilah lokasi tempat hampir semua lesi prakanker berkembang, dan pemeriksaan dinyatakan tidak adekuat bila zona ini tidak terlihat.',
          'Bersihkan lendir berlebih dengan lidi kapas secara lembut tanpa menggosok keras.',
        ],
      },
      {
        fase: 'IVA — Inspeksi Visual dengan Asam Asetat',
        steps: [
          'Oleskan asam asetat 3-5% secara merata pada seluruh permukaan serviks menggunakan lidi kapas besar.',
          'TUNGGU 1 MENIT PENUH — ini adalah langkah yang paling sering dipersingkat dan menyebabkan hasil negatif palsu.',
          'Amati perubahan warna pada zona transformasi di bawah pencahayaan yang baik.',
          'IVA POSITIF: tampak bercak PUTIH (acetowhite) yang TEBAL, BERBATAS TEGAS, OPAK, dan MENEMPEL pada zona transformasi atau dekat sambungan skuamokolumnar.',
          'IVA NEGATIF: serviks licin tanpa bercak putih bermakna; bercak putih tipis, samar, atau jauh dari zona transformasi tidak dianggap positif.',
          'CURIGA KANKER: tampak massa berbenjol, mudah berdarah, ulkus, atau pertumbuhan seperti bunga kol — pada keadaan ini langsung RUJUK, tidak perlu menilai hasil IVA.',
          'Sampaikan hasil kepada pasien segera setelah pemeriksaan — inilah keunggulan utama IVA sebagai metode see and treat.',
        ],
      },
      {
        fase: 'Pap smear — pengambilan sediaan',
        steps: [
          'Gunakan SPATULA AYRE dengan ujung panjang dimasukkan ke ostium eksternum, lalu putar 360 DERAJAT untuk mengambil sel dari ektoserviks dan zona transformasi.',
          'Gunakan CYTOBRUSH yang dimasukkan ke kanalis servikalis dan diputar 90-180 derajat untuk mengambil sel endoserviks.',
          'Sediaan konvensional: oleskan bahan pada kaca objek SATU ARAH secara merata dan TIPIS, jangan bolak-balik karena merusak sel.',
          'FIKSASI SEGERA dalam hitungan detik dengan alkohol 95% atau fiksatif semprot — sediaan yang mengering sebelum difiksasi menjadi tidak dapat dibaca dan merupakan penyebab tersering sampel ditolak laboratorium.',
          'Pada liquid-based cytology, masukkan alat pengambil ke dalam media cair dan bilas sesuai petunjuk.',
          'Beri label identitas pasien pada kaca objek dan lengkapi formulir dengan data klinis termasuk hari pertama haid terakhir, riwayat kontrasepsi, dan keluhan.',
        ],
      },
      {
        fase: 'Pascatindakan & tindak lanjut',
        steps: [
          'Lepaskan spekulum perlahan sambil menginspeksi dinding vagina.',
          'Beri tahu pasien bahwa bercak darah ringan selama 1-2 hari adalah wajar.',
          'IVA POSITIF: dapat langsung ditawarkan KRIOTERAPI pada pendekatan see and treat bila memenuhi syarat (lesi kecil, seluruhnya terlihat, tidak mencurigakan kanker), atau dirujuk untuk kolposkopi.',
          'CURIGA KANKER: rujuk segera untuk biopsi dan penanganan onkologi ginekologi.',
          'Pap smear abnormal: tindak lanjut sesuai derajat kelainan, umumnya dengan kolposkopi dan biopsi terarah.',
          'Jadwalkan skrining ulang sesuai hasil dan pedoman; catat pada rekam medis dan kartu pasien.',
          'EDUKASI PENCEGAHAN: vaksinasi HPV, hubungan seksual yang aman, berhenti merokok, dan pentingnya skrining berkala.',
        ],
      },
    ],
    mnemonics: [
      {
        akronim: 'IVA — "OLES, TUNGGU 1 MENIT, LIHAT"',
        kepanjangan: [
          'OLES asam asetat 3-5% merata pada seluruh serviks',
          'TUNGGU 1 MENIT PENUH (jangan dipersingkat)',
          'LIHAT bercak putih tebal berbatas tegas pada zona transformasi',
        ],
      },
      {
        akronim: 'Interpretasi IVA',
        kepanjangan: [
          'NEGATIF — serviks licin, tanpa bercak putih bermakna',
          'POSITIF — bercak acetowhite TEBAL, BERBATAS TEGAS, di zona transformasi',
          'CURIGA KANKER — massa berbenjol, mudah berdarah, ulkus → RUJUK langsung',
        ],
      },
      {
        akronim: 'Pap smear — kesalahan yang membuat sampel ditolak',
        kepanjangan: [
          '1 — Sediaan MENGERING sebelum difiksasi (paling sering)',
          '2 — Zona transformasi TIDAK terambil (tidak ada sel endoserviks)',
          '3 — Olesan terlalu tebal atau bolak-balik sehingga sel rusak',
          '4 — Terlalu banyak darah atau lendir',
          '5 — Label dan data klinis tidak lengkap',
        ],
      },
    ],
    tips: [
      'Zona transformasi adalah tempat hampir semua lesi prakanker berkembang — bila tidak terlihat, pemeriksaan dianggap tidak adekuat.',
      'Menunggu satu menit penuh pada IVA bukan formalitas; mempersingkatnya menghasilkan negatif palsu.',
      'Fiksasi Pap smear harus dalam hitungan detik — siapkan fiksatif sebelum mulai mengambil sampel.',
      'Bila tampak massa yang jelas mencurigakan kanker, JANGAN menunggu hasil skrining — langsung rujuk untuk biopsi.',
      'IVA sangat sesuai untuk fasilitas dengan sumber daya terbatas karena murah, hasil langsung diketahui, dan memungkinkan pendekatan see and treat.',
      'Vaksinasi HPV tidak menggantikan skrining — perempuan yang sudah divaksin tetap perlu diskrining sesuai jadwal.',
    ],
    komplikasi: [
      'Perdarahan bercak ringan pascatindakan',
      'Rasa tidak nyaman dan nyeri saat pemasangan spekulum',
      'Reaksi vasovagal',
      'Hasil negatif palsu akibat teknik yang tidak tepat sehingga lesi terlewat',
      'Kecemasan akibat hasil positif palsu',
    ],
    referensi: ['POGI2016', 'WILLIAMSOB2022', 'PPKFKTP2014'],
  },
]
