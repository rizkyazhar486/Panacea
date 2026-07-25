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
]
