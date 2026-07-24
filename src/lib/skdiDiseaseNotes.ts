// Quick-reference clinical notes for the full SKDI 2012 disease directory
// (src/lib/skdiDiseaseList.ts), covering diseases beyond the 143-case OSCE
// practical exam bank (which has full station notes in osceStationNotes.ts).
// Kept intentionally concise (definisi/diagnosis/tatalaksana) given the ~600+
// entry volume — cross-check current dosing/guidelines before clinical use.

export interface SkdiDiseaseNote {
  definisi: string
  diagnosis: string[]
  tatalaksana: string[]
}

export const SKDI_DISEASE_NOTES: Record<string, SkdiDiseaseNote> = {
  // ─── Forensik & Medikolegal ──────────────────────────────────────────────
  'Kekerasan tumpul': {
    definisi: 'Cedera akibat benda tumpul (memar, luka lecet, luka robek) tanpa terputusnya kontinuitas kulit secara tajam.',
    diagnosis: [
      'Deskripsi luka: lokasi, bentuk, ukuran, warna (perkiraan usia luka dari perubahan warna memar), tepi luka tidak rata dengan jembatan jaringan (vibrio/bridging) — khas luka robek akibat benda tumpul',
      'Bedakan luka lecet tekan, geser, dan luka memar berdasarkan mekanisme',
      'Visum et repertum mendeskripsikan derajat luka sesuai KUHP (ringan/sedang/berat) berdasarkan dampak fungsional, bukan hanya ukuran',
    ],
    tatalaksana: [
      'Tatalaksana medis sesuai jenis dan derajat cedera (luka, fraktur, organ dalam)',
      'Dokumentasi forensik: foto, pengukuran, deskripsi tertulis rinci sebelum/selama tindakan medis',
      'Pembuatan visum et repertum atas permintaan resmi penyidik',
    ],
  },
  'Kekerasan tajam': {
    definisi: 'Cedera akibat benda bermata tajam/berujung runcing (luka iris, luka tusuk, luka bacok) dengan tepi luka rata.',
    diagnosis: [
      'Luka iris: panjang > dalam, tepi rata, tidak ada jembatan jaringan',
      'Luka tusuk: dalam > panjang permukaan, dapat menembus rongga tubuh',
      'Luka bacok: kombinasi sifat tajam dan tumpul, biasanya luas dan dalam akibat benda besar/berat',
      'Perkirakan arah, jumlah, dan kemungkinan mekanisme (self-inflicted vs. akibat orang lain) dari pola luka',
    ],
    tatalaksana: [
      'Tatalaksana kegawatdaruratan bila mengenai organ vital/pembuluh darah besar',
      'Dokumentasi forensik lengkap sebelum debridement/penjahitan bila memungkinkan',
      'Visum et repertum menjelaskan jenis kekerasan dan derajat luka',
    ],
  },
  'Trauma kimia': {
    definisi: 'Cedera jaringan akibat kontak dengan bahan kimia korosif (asam/basa), dapat mengenai kulit, mata, atau saluran cerna.',
    diagnosis: [
      'Riwayat kontak dengan zat kimia spesifik (identifikasi jenis asam/basa bila mungkin)',
      'Luka bakar kimia: nekrosis koagulasi (asam) atau likuefaksi (basa, lebih dalam dan progresif)',
      'Pada tertelan: nilai risiko cedera esofagus/lambung, endoskopi dini bila indikasi',
    ],
    tatalaksana: [
      'Irigasi segera dengan air mengalir banyak (kecuali kontraindikasi spesifik zat tertentu)',
      'Netralisasi tidak direkomendasikan rutin (risiko reaksi eksotermik memperberat cedera)',
      'Rujuk untuk evaluasi lebih lanjut sesuai organ terkena (mata: oftalmologi; esofagus: endoskopi)',
    ],
  },
  'Luka tembak': {
    definisi: 'Cedera akibat proyektil senjata api, dengan karakteristik luka masuk dan keluar yang khas untuk rekonstruksi forensik.',
    diagnosis: [
      'Luka tembak masuk: kelim lecet, kelim tato/jelaga (jarak dekat), kelim api (jarak sangat dekat/kontak)',
      'Luka tembak keluar: umumnya lebih besar, tepi tidak rata, tanpa kelim lecet',
      'Estimasi jarak tembak dari pola residu mesiu di sekitar luka',
    ],
    tatalaksana: [
      'Tatalaksana kegawatdaruratan trauma (ATLS) sesuai organ yang terkena',
      'Dokumentasi forensik sebelum tindakan bedah bila kondisi pasien memungkinkan',
      'Pelaporan wajib ke pihak berwajib (kasus forensik/pidana)',
    ],
  },
  'Luka listrik dan petir': {
    definisi: 'Cedera akibat aliran listrik (arus rumah tangga/industri) atau sambaran petir, dapat menyebabkan luka lokal maupun kerusakan sistemik.',
    diagnosis: [
      'Luka listrik: titik masuk dan keluar arus (electrical mark), dapat tampak minimal di permukaan meski kerusakan jaringan dalam luas',
      'Sambaran petir: pola Lichtenberg (percabangan seperti pakis) pada kulit, dapat disertai ruptur gendang telinga, katarak',
      'Waspada aritmia jantung, rhabdomiolisis, dan cedera organ dalam meski luka kulit tampak ringan',
    ],
    tatalaksana: [
      'Amankan sumber listrik sebelum pertolongan (safety pertama)',
      'Monitor EKG dan jantung (risiko aritmia terutama arus AC)',
      'Resusitasi cairan bila rhabdomiolisis (cegah gagal ginjal akut)',
      'Tatalaksana luka bakar lokal sesuai derajat',
    ],
  },
  'Barotrauma': {
    definisi: 'Cedera jaringan akibat perubahan tekanan lingkungan mendadak (menyelam, penerbangan), sering mengenai telinga tengah, sinus, atau paru.',
    diagnosis: [
      'Nyeri telinga, tuli konduktif, kadang ruptur gendang telinga pada barotrauma telinga',
      'Nyeri wajah/sinus pada barotrauma sinus',
      'Barotrauma paru (dekompresi): nyeri dada, sesak, kemungkinan pneumotoraks/emboli udara pada penyelam',
    ],
    tatalaksana: [
      'Barotrauma telinga/sinus ringan: analgesik, dekongestan, hindari penyelaman/penerbangan hingga sembuh',
      'Barotrauma paru berat (emboli udara/dekompresi): oksigen 100%, rekompresi hiperbarik segera',
      'Rujuk THT bila ruptur membran timpani menetap',
    ],
  },
  'Trauma suhu': {
    definisi: 'Cedera jaringan akibat paparan suhu ekstrem, meliputi luka bakar (panas) dan frostbite/hipotermia (dingin).',
    diagnosis: [
      'Luka bakar: derajat I (epidermis), II (dermis, bulla), III (full-thickness); hitung luas dengan rule of nine',
      'Frostbite: pucat, mati rasa, kemudian nyeri hebat saat rewarming, bula hemoragik pada derajat berat',
      'Hipotermia: suhu inti <35°C, bradikardia, penurunan kesadaran progresif',
    ],
    tatalaksana: [
      'Luka bakar: pendinginan air mengalir (bukan es), resusitasi cairan formula Parkland bila luas >20%, rujuk pusat luka bakar bila berat',
      'Frostbite: rewarming cepat air hangat 37-39°C, hindari gosokan/pemanasan langsung api',
      'Hipotermia: rewarming bertahap (pasif eksternal ringan, aktif internal pada berat), hindari pergerakan kasar (risiko aritmia)',
    ],
  },
  'Asfiksia': {
    definisi: 'Kondisi kekurangan oksigen jaringan akibat gangguan jalan napas/pertukaran gas, penyebab kematian penting dalam kasus forensik (pencekikan, penjeratan, pembekapan).',
    diagnosis: [
      'Tanda umum asfiksia: sianosis, petekie konjungtiva/wajah, kongesti dan edema wajah',
      'Tanda spesifik sesuai mekanisme: jejas jerat (penjeratan/gantung), jejas kuku/tangan (pencekikan manual)',
      'Otopsi: kongesti viseral, perdarahan petekie pleura/perikardium (tardieu spots)',
    ],
    tatalaksana: [
      'Bila korban masih hidup: bebaskan jalan napas segera, oksigenasi, resusitasi sesuai kondisi',
      'Kasus forensik (korban meninggal): pemeriksaan luar dan dalam sistematis, dokumentasi jejas untuk rekonstruksi mekanisme kematian',
    ],
  },
  'Tenggelam': {
    definisi: 'Asfiksia akibat terendamnya jalan napas dalam cairan, dapat fatal atau non-fatal (near-drowning) tergantung durasi dan pertolongan.',
    diagnosis: [
      'Riwayat terendam air, ditemukan tidak sadar di air/dekat air',
      'Otopsi: buih halus di jalan napas (jamur buih), paru-paru membesar dan berat (paru cadaver), diatom dalam jaringan pada kasus tertentu',
      'Bedakan tenggelam basah (aspirasi cairan) vs kering (spasme laring)',
    ],
    tatalaksana: [
      'Resusitasi jantung paru segera bila korban ditemukan, prioritaskan ventilasi (hipoksia adalah masalah utama)',
      'Rujuk ICU untuk pemantauan ARDS/edema paru sekunder meski awalnya tampak stabil',
      'Kasus forensik: pemeriksaan lengkap untuk konfirmasi tenggelam vs penyebab kematian lain sebelum masuk air',
    ],
  },
  'Pembunuhan anak sendiri': {
    definisi: 'Istilah forensik (dan pasal KUHP) untuk pembunuhan bayi baru lahir oleh ibu kandungnya sendiri, umumnya dalam kondisi psikologis tertekan pasca melahirkan.',
    diagnosis: [
      'Pemeriksaan forensik menentukan: apakah bayi lahir hidup (uji apung paru/docimasia pulmonum), viabilitas (cukup bulan), dan penyebab kematian',
      'Cari tanda kekerasan pada bayi dan bukti persalinan pada ibu (tersangka)',
      'Aspek medikolegal: dibedakan dari kematian janin dalam kandungan atau kematian alamiah bayi',
    ],
    tatalaksana: [
      'Bukan kondisi klinis yang ditatalaksana medis — peran dokter adalah pemeriksaan forensik objektif dan pembuatan visum et repertum',
      'Rujuk ibu untuk evaluasi dan dukungan psikiatri (sering terkait gangguan psikologis pascapersalinan)',
    ],
  },
  'Pengguguran kandungan': {
    definisi: 'Aborsi/abortus provokatus — penghentian kehamilan secara sengaja, aspek forensik menilai legalitas (indikasi medis vs kriminal) dan komplikasinya.',
    diagnosis: [
      'Pemeriksaan tanda kehamilan sebelumnya dan bukti tindakan pengguguran (instrumentasi, obat)',
      'Identifikasi komplikasi: perdarahan, infeksi, perforasi uterus',
      'Aspek hukum: bedakan abortus provokatus medisinalis (indikasi medis, legal dengan syarat) dari abortus provokatus kriminalis',
    ],
    tatalaksana: [
      'Tatalaksana komplikasi medis (kuretase, antibiotik, resusitasi bila perdarahan/sepsis)',
      'Pelaporan sesuai ketentuan hukum bila dicurigai tindak pidana',
    ],
  },
  'Kematian mendadak': {
    definisi: 'Kematian yang terjadi tiba-tiba dan tidak terduga pada individu yang tampak sehat/tanpa penyakit terminal diketahui sebelumnya, sering memerlukan otopsi untuk penyebab.',
    diagnosis: [
      'Penyebab tersering: penyakit jantung koroner/aritmia mendadak, emboli paru, perdarahan intrakranial',
      'Otopsi forensik menentukan penyebab kematian alamiah vs tidak alamiah',
      'Perlu anamnesis riwayat penyakit sebelumnya dari keluarga dan kronologi kejadian',
    ],
    tatalaksana: [
      'Bukan kondisi yang ditatalaksana — fokus pada penentuan sebab kematian yang akurat untuk kepentingan medikolegal dan keluarga',
      'Visum et repertum jenazah sesuai permintaan penyidik',
    ],
  },
  'Toksikologi forensik': {
    definisi: 'Cabang forensik yang mempelajari identifikasi zat racun/obat dalam tubuh untuk menentukan peran zat tersebut dalam sakit/kematian.',
    diagnosis: [
      'Pengambilan sampel forensik: darah, urin, isi lambung, jaringan hati/ginjal untuk analisis toksikologi',
      'Korelasikan gejala klinis (bila korban sempat hidup) dengan pola keracunan spesifik (organofosfat, sianida, alkohol, NAPZA)',
      'Interpretasi kadar zat mempertimbangkan post-mortem redistribution (kadar dapat berubah setelah kematian)',
    ],
    tatalaksana: [
      'Bila korban hidup: tatalaksana keracunan sesuai zat (antidot spesifik, dekontaminasi, suportif)',
      'Kasus forensik: koordinasi dengan laboratorium forensik untuk analisis toksikologi lengkap sebagai bagian visum',
    ],
  },
}
