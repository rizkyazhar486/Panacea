// ─────────────────────────────────────────────────────────────────────────────
// Quick-reference clinical notes for the full SKDI 2012 disease directory
// (src/lib/skdiDiseaseList.ts), covering diseases beyond the 143-case OSCE
// practical exam bank (which has full station notes in osceStationNotes.ts).
// Kept intentionally concise (definisi/diagnosis/tatalaksana) given the ~600+
// entry volume — cross-check current dosing/guidelines before clinical use.
//
// PROVENANCE / SITASI — dibaca sebelum menambah entry baru:
//   • Nama penyakit dan level kompetensi berasal dari dokumen resmi SKDI 2012
//     (Konsil Kedokteran Indonesia) — dokumen ini HANYA memuat tabel nama +
//     level, tanpa isi klinis.
//   • Isi klinis (definisi/diagnosis/tatalaksana) disusun dari ajaran klinis
//     baku dan diselaraskan dengan pedoman/textbook terbit yang tercantum di
//     REFERENSI_SUMBER di bawah. Isi ini BUKAN salinan verbatim dari dokumen
//     mana pun; field `referensi` menunjuk pedoman yang menjadi rujukan
//     konsep, bukan klaim kutipan halaman.
//   • Jangan menuliskan sitasi ke dokumen yang isinya tidak benar-benar
//     menjadi rujukan entry tersebut.
// ─────────────────────────────────────────────────────────────────────────────

/** Daftar sumber rujukan, format Vancouver. Key dipakai di field `referensi`. */
export const REFERENSI_SUMBER: Record<string, string> = {
  SKDI2012:
    'Konsil Kedokteran Indonesia. Standar Kompetensi Dokter Indonesia. Jakarta: Konsil Kedokteran Indonesia; 2012.',
  PPKFKTP2014:
    'Kementerian Kesehatan Republik Indonesia. Panduan Praktik Klinis bagi Dokter di Fasilitas Pelayanan Kesehatan Tingkat Pertama. Jakarta: Kementerian Kesehatan RI; 2014.',
  PAPDI2014:
    'Setiati S, Alwi I, Sudoyo AW, Simadibrata M, Setiyohadi B, Syam AF, editors. Buku Ajar Ilmu Penyakit Dalam. 6th ed. Jakarta: InternaPublishing; 2014.',
  HARRISON2022:
    "Loscalzo J, Fauci AS, Kasper DL, Hauser SL, Longo DL, Jameson JL, editors. Harrison's Principles of Internal Medicine. 21st ed. New York: McGraw Hill; 2022.",
  PERKENI2021:
    'Perkumpulan Endokrinologi Indonesia. Pedoman Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 Dewasa di Indonesia. Jakarta: PB PERKENI; 2021.',
  ADA2024:
    'American Diabetes Association Professional Practice Committee. Standards of Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S1-S321.',
  WHOSAM2013:
    'World Health Organization. Guideline: Updates on the Management of Severe Acute Malnutrition in Infants and Children. Geneva: World Health Organization; 2013.',
  FORENSIKFKUI:
    'Budiyanto A, Widiatmaka W, Sudiono S, Winardi T, Mun’im Idries A, Sidhi, et al. Ilmu Kedokteran Forensik. Jakarta: Bagian Kedokteran Forensik Fakultas Kedokteran Universitas Indonesia; 1997.',
  KNIGHT2016:
    "Saukko P, Knight B. Knight's Forensic Pathology. 4th ed. Boca Raton: CRC Press; 2016.",
  KDIGOCKD2024:
    'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
  KDIGOAKI2012:
    'Kidney Disease: Improving Global Outcomes (KDIGO) Acute Kidney Injury Work Group. KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.',
  CAMPBELL2016:
    'Wein AJ, Kavoussi LR, Partin AW, Peters CA, editors. Campbell-Walsh Urology. 11th ed. Philadelphia: Elsevier; 2016.',
  HOFFBRAND2019:
    "Hoffbrand AV, Moss PAH. Hoffbrand's Essential Haematology. 8th ed. Oxford: Wiley-Blackwell; 2019.",
  SSC2021:
    'Evans L, Rhodes A, Alhazzani W, Antonelli M, Coopersmith CM, French C, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143.',
  WHODENGUE2009:
    'World Health Organization. Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control. New ed. Geneva: World Health Organization; 2009.',
  WAO2020:
    'Cardona V, Ansotegui IJ, Ebisawa M, El-Gamal Y, Fernandez Rivas M, Fineman S, et al. World Allergy Organization Anaphylaxis Guidance 2020. World Allergy Organ J. 2020;13(10):100472.',
  ACREULAR2010:
    'Aletaha D, Neogi T, Silman AJ, Funovits J, Felson DT, Bingham CO 3rd, et al. 2010 Rheumatoid Arthritis Classification Criteria: an American College of Rheumatology/European League Against Rheumatism Collaborative Initiative. Arthritis Rheum. 2010;62(9):2569-81.',
  ADAMS2019:
    "Ropper AH, Samuels MA, Klein JP, Prasad S. Adams and Victor's Principles of Neurology. 11th ed. New York: McGraw Hill; 2019.",
  PERDOSSI2016:
    'Perhimpunan Dokter Spesialis Saraf Indonesia. Panduan Praktik Klinis Neurologi. Jakarta: PERDOSSI; 2016.',
  AHASTROKE2019:
    'Powers WJ, Rabinstein AA, Ackerson T, Adeoye OM, Bambakidis NC, Becker K, et al. Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update. Stroke. 2019;50(12):e344-418.',
  PPDGJIII:
    'Departemen Kesehatan Republik Indonesia, Direktorat Jenderal Pelayanan Medik. Pedoman Penggolongan dan Diagnosis Gangguan Jiwa di Indonesia III (PPDGJ-III). Jakarta: Departemen Kesehatan RI; 1993.',
  DSM5TR2022:
    'American Psychiatric Association. Diagnostic and Statistical Manual of Mental Disorders. 5th ed., text revision (DSM-5-TR). Washington, DC: American Psychiatric Association Publishing; 2022.',
  KAPLAN2015:
    "Sadock BJ, Sadock VA, Ruiz P. Kaplan & Sadock's Synopsis of Psychiatry: Behavioral Sciences/Clinical Psychiatry. 11th ed. Philadelphia: Wolters Kluwer; 2015.",
  WHOMHGAP2016:
    'World Health Organization. mhGAP Intervention Guide for Mental, Neurological and Substance Use Disorders in Non-Specialized Health Settings. Version 2.0. Geneva: World Health Organization; 2016.',
  PERKIHF2020:
    'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia. Pedoman Tatalaksana Gagal Jantung. 2nd ed. Jakarta: PERKI; 2020.',
  PERKIHT2021:
    'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia. Pedoman Tatalaksana Hipertensi pada Penyakit Kardiovaskular. 2nd ed. Jakarta: PERKI; 2021.',
  ESCACS2023:
    'Byrne RA, Rossello X, Coughlan JJ, Barbato E, Berry C, Chieffo A, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44(38):3720-826.',
  BRAUNWALD2022:
    "Libby P, Bonow RO, Mann DL, Tomaselli GF, Bhatt DL, Solomon SD, editors. Braunwald's Heart Disease: A Textbook of Cardiovascular Medicine. 12th ed. Philadelphia: Elsevier; 2022.",
  GOLD2024:
    'Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for the Diagnosis, Management, and Prevention of Chronic Obstructive Pulmonary Disease: 2024 Report. GOLD; 2024.',
  PNPKTB2020:
    'Kementerian Kesehatan Republik Indonesia. Pedoman Nasional Pelayanan Kedokteran Tata Laksana Tuberkulosis. Jakarta: Kementerian Kesehatan RI; 2020.',
  WHOTBDR2022:
    'World Health Organization. WHO Consolidated Guidelines on Tuberculosis. Module 4: Treatment — Drug-Resistant Tuberculosis Treatment, 2022 Update. Geneva: World Health Organization; 2022.',
  MURRAY2022:
    "Broaddus VC, Ernst JD, King TE Jr, Lazarus SC, Sarmiento KF, Schnapp LM, et al., editors. Murray & Nadel's Textbook of Respiratory Medicine. 7th ed. Philadelphia: Elsevier; 2022.",
  ARDSBERLIN2012:
    'ARDS Definition Task Force; Ranieri VM, Rubenfeld GD, Thompson BT, Ferguson ND, Caldwell E, et al. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012;307(23):2526-33.',
  APLEY2018:
    "Solomon L, Warwick D, Nayagam S. Apley & Solomon's System of Orthopaedics and Trauma. 10th ed. Boca Raton: CRC Press; 2018.",
  CAMPBELLORTHO2021:
    "Azar FM, Beaty JH, editors. Campbell's Operative Orthopaedics. 14th ed. Philadelphia: Elsevier; 2021.",
  ATLS2018:
    'American College of Surgeons Committee on Trauma. Advanced Trauma Life Support: Student Course Manual. 10th ed. Chicago: American College of Surgeons; 2018.',
  ATA2016:
    'Ross DS, Burch HB, Cooper DS, Greenlee MC, Laurberg P, Maia AL, et al. 2016 American Thyroid Association Guidelines for Diagnosis and Management of Hyperthyroidism and Other Causes of Thyrotoxicosis. Thyroid. 2016;26(10):1343-421.',
}

export interface SkdiDiseaseNote {
  definisi: string
  diagnosis: string[]
  tatalaksana: string[]
  /** Key ke REFERENSI_SUMBER — pedoman yang menjadi rujukan konsep entry ini. */
  referensi: string[]
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
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
    referensi: ['SKDI2012', 'FORENSIKFKUI', 'KNIGHT2016'],
  },

  // ─── Endokrin & Metabolik ────────────────────────────────────────────────
  'Diabetes melitus tipe 1': {
    definisi: 'DM akibat destruksi autoimun sel beta pankreas sehingga defisiensi insulin absolut, umumnya onset usia muda.',
    diagnosis: [
      'Poliuria, polidipsia, penurunan BB cepat, sering onset dengan ketoasidosis diabetikum',
      'GDP ≥126 mg/dL atau GDS ≥200 mg/dL + gejala klasik; C-peptide rendah, autoantibodi (anti-GAD, anti-islet) mendukung',
    ],
    tatalaksana: [
      'Terapi insulin wajib seumur hidup (basal-bolus), tidak responsif terhadap OAD oral',
      'Edukasi pemantauan gula darah mandiri, pengenalan dan tatalaksana hipoglikemia',
      'Skrining komplikasi kronik rutin (mata, ginjal, kaki) sejak dini',
    ],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Diabetes melitus tipe 2': {
    definisi: 'DM akibat resistensi insulin dengan defisiensi insulin relatif, terkait obesitas dan gaya hidup, onset biasanya usia dewasa.',
    diagnosis: [
      'GDP ≥126 mg/dL, GD 2 jam PP (TTGO) ≥200 mg/dL, GDS ≥200 mg/dL + gejala, atau HbA1c ≥6,5%',
      'Sering asimtomatik, ditemukan skrining rutin atau saat komplikasi muncul',
    ],
    tatalaksana: [
      'Modifikasi gaya hidup + metformin lini pertama, kombinasi OAD/insulin bertahap sesuai target HbA1c',
      'Skrining dan tatalaksana komorbid kardiovaskular (hipertensi, dislipidemia)',
    ],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Ketoasidosis diabetikum nonketotik': {
    definisi: 'Merujuk pada Hyperosmolar Hyperglycemic State (HHS) — dekompensasi hiperglikemik berat tanpa ketosis signifikan, khas pada DM tipe 2 lansia.',
    diagnosis: [
      'GDS sangat tinggi (>600 mg/dL), osmolaritas serum >320 mOsm/kg, keton minimal/negatif, pH >7,3',
      'Dehidrasi berat dan penurunan kesadaran progresif, sering dengan faktor pencetus infeksi',
    ],
    tatalaksana: [
      'Resusitasi cairan agresif sebagai prioritas utama, insulin drip setelah cairan dan kalium adekuat',
      'Cari dan atasi faktor pencetus, monitor status neurologis ketat',
    ],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Hiperglikemi hiperosmolar': {
    definisi: 'Hyperosmolar Hyperglycemic State (HHS) — komplikasi akut DM tipe 2 dengan hiperglikemia ekstrem dan dehidrasi berat tanpa ketoasidosis bermakna.',
    diagnosis: ['GDS >600 mg/dL, osmolaritas serum efektif >320 mOsm/kg, keton negatif/minimal, penurunan kesadaran'],
    tatalaksana: ['Resusitasi cairan kristaloid bertahap (defisit besar, koreksi 24-48 jam), insulin drip setelah resusitasi awal, koreksi kalium'],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Hipoglikemia ringan': {
    definisi: 'Penurunan gula darah <70 mg/dL dengan gejala otonom (berkeringat, gemetar, jantung berdebar) tanpa gangguan kesadaran berat.',
    diagnosis: ['Gejala adrenergik + GDS rendah, membaik setelah asupan glukosa (whipple triad)'],
    tatalaksana: ['Rule of 15: 15g karbohidrat cepat serap oral, ulangi cek GDS 15 menit, edukasi penyesuaian dosis obat DM'],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Hipoglikemia berat': {
    definisi: 'Hipoglikemia dengan gangguan kesadaran/kejang, memerlukan bantuan orang lain untuk penanganan — kegawatdaruratan.',
    diagnosis: ['GDS sangat rendah disertai penurunan kesadaran, kejang, atau perilaku abnormal'],
    tatalaksana: ['Dekstrosa 40% IV bolus (bila akses IV ada) atau glukagon IM bila tidak ada akses IV, lanjut infus dekstrosa maintenance, cari penyebab (overdosis insulin/sulfonilurea)'],
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024'],
  },
  'Diabetes insipidus': {
    definisi: 'Gangguan defisiensi ADH (sentral) atau resistensi ginjal terhadap ADH (nefrogenik) menyebabkan poliuria masif dan polidipsia.',
    diagnosis: ['Poliuria >3L/hari dengan urin sangat encer (osmolaritas rendah), water deprivation test membedakan sentral vs nefrogenik'],
    tatalaksana: ['Sentral: desmopressin (DDAVP); Nefrogenik: atasi penyebab dasar, diuretik tiazid paradoksal, restriksi garam'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Akromegali, gigantisme': {
    definisi: 'Kelebihan hormon pertumbuhan (GH) kronik akibat adenoma hipofisis — gigantisme bila terjadi sebelum lempeng epifisis menutup, akromegali bila sesudahnya.',
    diagnosis: ['Pembesaran tangan/kaki/wajah progresif (akromegali), pertumbuhan tinggi berlebihan (gigantisme); IGF-1 meningkat, GH tidak tersupresi pada OGTT'],
    tatalaksana: ['Reseksi transsfenoidal adenoma hipofisis sebagai lini pertama, analog somatostatin/pegvisomant bila residual/tidak operable'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Defisiensi hormon pertumbuhan': {
    definisi: 'Kekurangan GH menyebabkan perawakan pendek pada anak atau gejala metabolik pada dewasa.',
    diagnosis: ['Perawakan pendek dengan kecepatan tumbuh melambat pada anak; stimulation test GH rendah'],
    tatalaksana: ['Terapi GH rekombinan pada anak dengan defisiensi terbukti, dipantau kecepatan tumbuh dan usia tulang'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Hiperparatiroid': {
    definisi: 'Kelebihan hormon paratiroid (PTH) menyebabkan hiperkalsemia, tersering akibat adenoma paratiroid.',
    diagnosis: ['Gejala hiperkalsemia ("stones, bones, groans, psychiatric overtones"), PTH dan kalsium serum meningkat bersamaan'],
    tatalaksana: ['Paratiroidektomi pada kasus simtomatik/kalsium sangat tinggi, hidrasi dan bifosfonat untuk kontrol hiperkalsemia akut'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Hipoparatiroid': {
    definisi: 'Defisiensi PTH menyebabkan hipokalsemia, sering pasca tiroidektomi/paratiroidektomi.',
    diagnosis: ['Gejala hipokalsemia: parestesia perioral, tetani, Chvostek/Trousseau sign positif; kalsium rendah, PTH rendah/tidak sesuai'],
    tatalaksana: ['Kalsium dan vitamin D oral jangka panjang, kalsium glukonas IV pada tetani akut'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Hipertiroid': {
    definisi: 'Kelebihan hormon tiroid menyebabkan hipermetabolisme sistemik, tersering akibat Grave\'s disease.',
    diagnosis: ['Penurunan BB, palpitasi, tremor, intoleransi panas; TSH rendah, FT4/FT3 tinggi'],
    tatalaksana: ['Obat antitiroid (methimazole/PTU), beta-blocker simptomatik, terapi definitif (iodine radioaktif/tiroidektomi) bila relaps'],
    referensi: ['SKDI2012', 'ATA2016', 'PAPDI2014'],
  },
  'Tirotoksikosis': {
    definisi: 'Sindrom klinis kelebihan hormon tiroid beredar, dapat akibat hipertiroid primer atau sumber lain (tiroiditis, eksogen).',
    diagnosis: ['Gejala hipermetabolik berat, krisis tiroid (thyroid storm) bila disertai demam tinggi/takikardia berat/penurunan kesadaran'],
    tatalaksana: ['Krisis tiroid: PTU dosis tinggi, iodine (1 jam setelah PTU), beta-blocker, kortikosteroid, tatalaksana suportif ICU'],
    referensi: ['SKDI2012', 'ATA2016', 'PAPDI2014'],
  },
  'Hipotiroid': {
    definisi: 'Defisiensi hormon tiroid menyebabkan perlambatan metabolisme sistemik, tersering akibat tiroiditis Hashimoto.',
    diagnosis: ['Lemas, penambahan BB, intoleransi dingin, konstipasi; TSH tinggi, FT4 rendah'],
    tatalaksana: ['Levothyroxine substitusi seumur hidup, titrasi berdasarkan TSH tiap 6-8 minggu'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Goiter': {
    definisi: 'Pembesaran kelenjar tiroid, dapat difus atau nodular, dengan fungsi tiroid normal/hiper/hipo.',
    diagnosis: ['Pembesaran leher anterior teraba/terlihat, USG tiroid dan fungsi tiroid (TSH/FT4) untuk klasifikasi'],
    tatalaksana: ['Suplementasi iodium bila endemik, obat antitiroid/levothyroxine sesuai fungsi, operasi bila kompresi/kosmetik/curiga keganasan'],
    referensi: ['SKDI2012', 'ATA2016', 'PAPDI2014'],
  },
  'Tiroiditis': {
    definisi: 'Inflamasi kelenjar tiroid (autoimun, subakut/de Quervain, atau pasca-partum), dapat menyebabkan fase hipertiroid diikuti hipotiroid.',
    diagnosis: ['Nyeri tiroid (subakut) atau tanpa nyeri (Hashimoto/pascapartum), pola TSH/FT4 berubah sesuai fase'],
    tatalaksana: ['Subakut: NSAID/steroid untuk nyeri, beta-blocker fase hipertiroid; Hashimoto: levothyroxine bila hipotiroid menetap'],
    referensi: ['SKDI2012', 'ATA2016', 'PAPDI2014'],
  },
  "Cushing's disease": {
    definisi: "Sindrom Cushing akibat kelebihan ACTH dari adenoma hipofisis, menyebabkan hiperkortisolisme kronik.",
    diagnosis: ['Moon face, buffalo hump, striae ungu, obesitas sentral; kortisol bebas urin 24 jam meningkat, tidak tersupresi dexamethasone'],
    tatalaksana: ['Reseksi transsfenoidal adenoma hipofisis sebagai terapi definitif, terapi medikamentosa (ketoconazole) bila tidak operable'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Krisis adrenal': {
    definisi: 'Kegawatdaruratan akibat defisiensi kortisol akut, dapat dipicu stres/infeksi pada pasien insufisiensi adrenal kronik atau penghentian steroid mendadak.',
    diagnosis: ['Hipotensi refrakter, syok, hiponatremia, hiperkalemia, hipoglikemia, nyeri perut/muntah'],
    tatalaksana: ['Hidrokortison IV bolus segera (jangan tunda untuk hasil lab), resusitasi cairan NaCl 0,9% dengan dekstrosa, cari dan atasi pencetus'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  "Addison's disease": {
    definisi: 'Insufisiensi adrenal primer akibat destruksi korteks adrenal (autoimun tersering), menyebabkan defisiensi kortisol dan aldosteron.',
    diagnosis: ['Lemas, hiperpigmentasi kulit, hipotensi, hiponatremia, hiperkalemia; kortisol pagi rendah, ACTH tinggi'],
    tatalaksana: ['Substitusi hidrokortison dan fludrokortison seumur hidup, edukasi dosis stres saat sakit/prosedur'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Pubertas prekoks': {
    definisi: 'Munculnya tanda pubertas sebelum usia 8 tahun (perempuan) atau 9 tahun (laki-laki).',
    diagnosis: ['Tanda seks sekunder dini, usia tulang lebih maju dari usia kronologis, LH/FSH dan hormon seks meningkat sesuai jenis (sentral vs perifer)'],
    tatalaksana: ['Sentral: agonis GnRH untuk menekan pubertas; cari dan tatalaksana penyebab dasar (tumor SSP, dll)'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Hipogonadisme': {
    definisi: 'Penurunan fungsi gonad menyebabkan defisiensi hormon seks, dapat primer (gonad) atau sekunder (hipotalamus-hipofisis).',
    diagnosis: ['Pubertas terlambat/tidak lengkap, infertilitas, penurunan libido; kadar hormon seks rendah dengan LH/FSH tinggi (primer) atau rendah (sekunder)'],
    tatalaksana: ['Terapi sulih hormon seks sesuai jenis kelamin dan usia, evaluasi penyebab sekunder (tumor hipofisis, dll)'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Prolaktinemia': {
    definisi: 'Hiperprolaktinemia — kelebihan hormon prolaktin, tersering akibat prolaktinoma hipofisis atau obat (antipsikotik).',
    diagnosis: ['Galaktorea, gangguan menstruasi/infertilitas pada wanita, disfungsi ereksi pada pria; prolaktin serum meningkat, MRI hipofisis bila curiga tumor'],
    tatalaksana: ['Agonis dopamin (bromocriptine/cabergoline) lini pertama untuk prolaktinoma, hentikan/ganti obat pencetus bila penyebab medikamentosa'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Adenoma tiroid': {
    definisi: 'Tumor jinak kelenjar tiroid, dapat fungsional (toxic adenoma) atau non-fungsional.',
    diagnosis: ['Nodul tiroid teraba, USG untuk karakteristik nodul, sidik tiroid bila fungsional (hot nodule), FNAB bila curiga keganasan'],
    tatalaksana: ['Observasi bila non-fungsional dan jinak, ablasi/operasi bila toxic adenoma atau kecurigaan keganasan'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Karsinoma tiroid': {
    definisi: 'Keganasan kelenjar tiroid, tersering tipe papiler dengan prognosis baik bila ditatalaksana tepat.',
    diagnosis: ['Nodul tiroid dengan tanda curiga (keras, fiksasi, pembesaran KGB), FNAB untuk konfirmasi sitologi'],
    tatalaksana: ['Tiroidektomi total/near-total, ablasi iodine radioaktif pasca-operasi, supresi TSH dengan levothyroxine, surveilans tiroglobulin'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Malnutrisi energi-protein': {
    definisi: 'Kekurangan asupan energi dan protein kronik, meliputi spektrum marasmus, kwashiorkor, dan campuran keduanya.',
    diagnosis: ['BB/TB rendah, LiLA rendah, edema (kwashiorkor), wasting berat (marasmus)'],
    tatalaksana: ['Tatalaksana 10 langkah WHO gizi buruk, pemberian makan bertahap (F-75 lalu F-100), koreksi mikronutrien'],
    referensi: ['SKDI2012', 'WHOSAM2013', 'PPKFKTP2014'],
  },
  'Defisiensi vitamin': {
    definisi: 'Kekurangan satu atau lebih vitamin esensial, manifestasi bervariasi sesuai jenis vitamin (A: xerophthalmia, B1: beri-beri, C: skorbut, D: rakitis).',
    diagnosis: ['Sesuai jenis vitamin: gangguan penglihatan malam (A), neuropati/gagal jantung (B1), perdarahan gusi (C), deformitas tulang (D)'],
    tatalaksana: ['Suplementasi vitamin spesifik sesuai defisiensi, atasi penyebab dasar (malabsorpsi, diet tidak adekuat)'],
    referensi: ['SKDI2012', 'WHOSAM2013', 'PPKFKTP2014'],
  },
  'Defisiensi mineral': {
    definisi: 'Kekurangan mineral esensial (besi, zink, iodium, kalsium) dengan manifestasi klinis sesuai jenis.',
    diagnosis: ['Sesuai jenis: anemia (besi), gangguan pertumbuhan/imunitas (zink), goiter (iodium), osteopenia (kalsium)'],
    tatalaksana: ['Suplementasi mineral spesifik, perbaikan diet, atasi penyebab dasar'],
    referensi: ['SKDI2012', 'WHOSAM2013', 'PPKFKTP2014'],
  },
  'Dislipidemia': {
    definisi: 'Kelainan profil lipid darah (kolesterol total, LDL, HDL, trigliserida) yang meningkatkan risiko kardiovaskular.',
    diagnosis: ['Profil lipid puasa abnormal sesuai kriteria (LDL/TG tinggi, HDL rendah)'],
    tatalaksana: ['Modifikasi gaya hidup, statin lini pertama sesuai kategori risiko kardiovaskular'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'PAPDI2014'],
  },
  'Porfiria': {
    definisi: 'Kelompok gangguan metabolik akibat defek enzim sintesis heme, menyebabkan akumulasi porfirin/prekursornya.',
    diagnosis: ['Nyeri perut hebat, gejala neuropsikiatri, urin berwarna gelap (port-wine) saat serangan akut; porfobilinogen urin meningkat saat serangan'],
    tatalaksana: ['Hindari faktor pencetus (obat porfirinogenik, puasa, alkohol), hematin/glukosa IV pada serangan akut'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },
  'Hiperurisemia': {
    definisi: 'Peningkatan kadar asam urat serum, dapat asimtomatik atau berujung gout artritis/batu ginjal.',
    diagnosis: ['Asam urat serum tinggi (>7 mg/dL pria, >6 mg/dL wanita), evaluasi gejala gout bila ada'],
    tatalaksana: ['Modifikasi diet (batasi purin, alkohol), obat penurun urat (allopurinol) bila simtomatik/berulang, tidak rutin diobati bila asimtomatik murni'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'PAPDI2014'],
  },
  'Obesitas': {
    definisi: 'Akumulasi lemak tubuh berlebih yang meningkatkan risiko berbagai komorbid metabolik dan kardiovaskular.',
    diagnosis: ['BMI ≥25 kg/m² (kriteria Asia Pasifik), evaluasi komorbid terkait (DM, hipertensi, sleep apnea)'],
    tatalaksana: ['Modifikasi gaya hidup (defisit kalori, aktivitas fisik), farmakoterapi/bedah bariatrik pada kasus berat gagal konservatif'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'PAPDI2014'],
  },
  'Sindrom metabolik': {
    definisi: 'Kumpulan faktor risiko kardiometabolik (obesitas sentral, dislipidemia, hipertensi, hiperglikemia) yang meningkatkan risiko DM dan penyakit kardiovaskular.',
    diagnosis: ['Minimal 3 dari 5 kriteria NCEP ATP III modifikasi Asia (lingkar pinggang, TG, HDL, TD, GDP)'],
    tatalaksana: ['Modifikasi gaya hidup multifaktorial sebagai dasar, tatalaksana tiap komponen sesuai indikasi'],
    referensi: ['SKDI2012', 'PAPDI2014', 'HARRISON2022'],
  },

  // ─── Hematologi & Imunologi ──────────────────────────────────────────────
  'Anemia aplastik': {
    definisi: 'Kegagalan sumsum tulang memproduksi sel darah (pansitopenia) akibat destruksi/supresi sel punca hematopoietik.',
    diagnosis: ['Pansitopenia (anemia, leukopenia, trombositopenia) tanpa organomegali, biopsi sumsum tulang menunjukkan hiposelularitas berat'],
    tatalaksana: ['Transplantasi sumsum tulang alogenik pada usia muda dengan donor cocok, terapi imunosupresif (ATG + siklosporin) bila tidak ada donor, transfusi suportif'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Anemia hemolitik': {
    definisi: 'Anemia akibat destruksi eritrosit dipercepat, dapat imun (AIHA) atau non-imun (defek membran, enzim, hemoglobinopati).',
    diagnosis: ['Ikterik, splenomegali, retikulositosis, bilirubin indirek dan LDH meningkat, haptoglobin menurun; Coombs test membedakan imun vs non-imun'],
    tatalaksana: ['Kortikosteroid bila autoimun, transfusi bila anemia berat simtomatik, atasi penyebab dasar'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Anemia makrositik': {
    definisi: 'Anemia dengan MCV meningkat (>100 fL), tersering akibat defisiensi B12/folat atau penyakit hati/hipotiroid.',
    diagnosis: ['MCV tinggi, kadar B12/folat serum, apus darah tepi (megaloblastik vs non-megaloblastik)'],
    tatalaksana: ['Suplementasi B12/folat sesuai defisiensi, atasi penyebab dasar (malabsorpsi, diet, penyakit hati)'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Anemia megaloblastik': {
    definisi: 'Anemia makrositik akibat gangguan sintesis DNA, tersering defisiensi vitamin B12 atau asam folat.',
    diagnosis: ['MCV tinggi, hipersegmentasi neutrofil pada apus darah tepi, B12/folat serum rendah'],
    tatalaksana: ['B12 injeksi (bila defisiensi B12, terutama jika ada gejala neurologis) atau folat oral; jangan beri folat saja bila B12 belum disingkirkan (dapat memperberat neuropati)'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Hemoglobinopati': {
    definisi: 'Kelainan genetik struktur/produksi hemoglobin (thalassemia, sickle cell disease, dll).',
    diagnosis: ['Anemia mikrositik/hemolitik kronik sejak usia dini, riwayat keluarga; elektroforesis hemoglobin untuk konfirmasi jenis'],
    tatalaksana: ['Sesuai jenis: transfusi rutin + kelasi besi (thalassemia mayor), hidroksiurea (sickle cell), konseling genetik'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Polisitemia': {
    definisi: 'Peningkatan jumlah eritrosit/hemoglobin di atas normal, dapat primer (polisitemia vera) atau sekunder (hipoksia kronik, tumor penghasil EPO).',
    diagnosis: ['Hb/hematokrit tinggi, gejala hiperviskositas (nyeri kepala, pruritus pasca mandi air hangat); mutasi JAK2 mendukung polisitemia vera'],
    tatalaksana: ['Flebotomi berkala, aspirin dosis rendah, sitoreduksi (hidroksiurea) pada polisitemia vera risiko tinggi; atasi penyebab dasar bila sekunder'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'DIC (Disseminated Intravascular Coagulation)': {
    definisi: 'Aktivasi sistem koagulasi yang meluas dan tidak terkontrol, menyebabkan trombosis mikrovaskular sekaligus perdarahan akibat konsumsi faktor pembekuan.',
    diagnosis: ['Perdarahan multipel (bekas suntikan, mukosa) bersamaan tanda trombosis; trombositopenia, PT/aPTT memanjang, fibrinogen rendah, D-dimer sangat tinggi'],
    tatalaksana: ['Atasi penyebab dasar (sepsis, obstetri, keganasan) sebagai prioritas utama, transfusi komponen darah (FFP, kriopresipitat, trombosit) sesuai defisit'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Agranulositosis': {
    definisi: 'Penurunan neutrofil berat (<500/µL), sering akibat obat (misal: OAT, propylthiouracil, clozapine), meningkatkan risiko infeksi berat.',
    diagnosis: ['Demam tinggi mendadak pada pasien dengan riwayat obat penyebab, hitung neutrofil absolut sangat rendah'],
    tatalaksana: ['Hentikan segera obat penyebab, isolasi protektif, antibiotik empiris spektrum luas segera bila demam neutropenia, G-CSF dipertimbangkan'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Inkompatibilitas golongan darah': {
    definisi: 'Reaksi imunologis akibat ketidakcocokan golongan darah ABO/Rh antara donor-resipien transfusi atau ibu-janin.',
    diagnosis: ['Reaksi transfusi akut: demam, menggigil, nyeri pinggang, hemoglobinuria; pada neonatus: ikterik dini berat, anemia hemolitik (inkompatibilitas Rh/ABO ibu-janin)'],
    tatalaksana: ['Hentikan transfusi segera bila reaksi, tatalaksana suportif dan cari penyebab; pada neonatus: fototerapi/transfusi tukar sesuai derajat, profilaksis anti-D pada ibu Rh negatif'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Timoma': {
    definisi: 'Tumor kelenjar timus, sering berkaitan dengan myasthenia gravis dan gangguan autoimun lain.',
    diagnosis: ['Massa mediastinum anterior pada pencitraan, sering ditemukan insidental atau saat evaluasi myasthenia gravis'],
    tatalaksana: ['Timektomi sebagai terapi utama, radioterapi adjuvan pada kasus invasif'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  "Limfoma non-Hodgkin's, Hodgkin's": {
    definisi: 'Keganasan sistem limfatik; Hodgkin ditandai sel Reed-Sternberg, non-Hodgkin lebih heterogen dan sering ekstranodal.',
    diagnosis: ['Limfadenopati tanpa nyeri progresif, gejala B (demam, keringat malam, penurunan BB); biopsi kelenjar getah bening untuk konfirmasi histopatologi'],
    tatalaksana: ['Kemoterapi kombinasi (ABVD untuk Hodgkin, R-CHOP untuk non-Hodgkin sel B), radioterapi pada stadium terbatas, rujuk hematologi-onkologi'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Leukemia akut, kronik': {
    definisi: 'Keganasan sel darah putih; akut (AML/ALL) progresif cepat, kronik (CML/CLL) lebih indolen.',
    diagnosis: ['Akut: anemia, perdarahan, infeksi berulang, blast di darah tepi/sumsum tulang; Kronik: sering asimtomatik, leukositosis ditemukan skrining, splenomegali'],
    tatalaksana: ['Akut: kemoterapi induksi segera, rujuk hematologi-onkologi cito; Kronik: CML dengan TKI (imatinib), CLL observasi/kemoterapi sesuai stadium'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Mieloma multipel': {
    definisi: 'Keganasan sel plasma klonal yang memproduksi imunoglobulin monoklonal berlebih, menyerang tulang dan ginjal.',
    diagnosis: ['CRAB criteria: hiperCalcemia, Renal insufficiency, Anemia, Bone lesions (lesi litik); elektroforesis protein serum menunjukkan M-protein/gap paraprotein'],
    tatalaksana: ['Kemoterapi kombinasi/terapi target (bortezomib, lenalidomide), transplantasi sel punca autolog pada kandidat sesuai, bifosfonat untuk lesi tulang'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Limfadenopati': {
    definisi: 'Pembesaran kelenjar getah bening, dapat reaktif (infeksi), atau patologis (keganasan, autoimun).',
    diagnosis: ['Evaluasi lokasi, ukuran, konsistensi, nyeri tekan; curiga keganasan bila keras, fiksasi, tidak nyeri, progresif — biopsi bila persisten/curiga'],
    tatalaksana: ['Atasi penyebab dasar (infeksi/antibiotik), observasi bila reaktif jelas, rujuk untuk biopsi bila kriteria curiga terpenuhi'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Limfadenitis': {
    definisi: 'Inflamasi kelenjar getah bening akibat infeksi, umumnya bakteri (limfadenitis supuratif) atau TB (skrofuloderma).',
    diagnosis: ['Kelenjar bengkak, nyeri, hangat, dapat fluktuatif bila abses; cari fokus infeksi primer'],
    tatalaksana: ['Antibiotik sesuai sumber infeksi, insisi drainase bila abses, OAT bila limfadenitis TB'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Bakteremia': {
    definisi: 'Keberadaan bakteri dalam aliran darah, dapat transien atau menetap, berpotensi berkembang menjadi sepsis.',
    diagnosis: ['Demam, menggigil, kultur darah positif; cari sumber infeksi primer (ISK, pneumonia, infeksi kulit)'],
    tatalaksana: ['Antibiotik empiris IV segera setelah kultur diambil, sesuaikan berdasarkan hasil kultur dan sensitivitas, atasi sumber infeksi'],
    referensi: ['SKDI2012', 'SSC2021', 'PAPDI2014'],
  },
  'Demam dengue, DHF': {
    definisi: 'Infeksi virus dengue dengan spektrum dari demam dengue ringan hingga DHF dengan kebocoran plasma.',
    diagnosis: ['Demam akut + 2 gejala penyerta (nyeri kepala, mialgia, ruam, uji tourniquet positif) + trombositopenia + tanda kebocoran plasma untuk DHF'],
    tatalaksana: ['Cairan oral/IV sesuai derajat, monitor Hct dan trombosit serial, hindari NSAID/aspirin'],
    referensi: ['SKDI2012', 'WHODENGUE2009', 'PPKFKTP2014'],
  },
  'Dengue shock syndrome': {
    definisi: 'Bentuk DHF paling berat dengan kegagalan sirkulasi akibat kebocoran plasma masif.',
    diagnosis: ['Tanda syok: akral dingin, nadi cepat lemah, tekanan nadi menyempit <20mmHg, penurunan kesadaran'],
    tatalaksana: ['Resusitasi cairan kristaloid bolus segera 10-20 mL/kgBB, evaluasi ketat, pertimbangkan koloid bila tidak respon, rawat ICU'],
    referensi: ['SKDI2012', 'WHODENGUE2009', 'PPKFKTP2014'],
  },
  'Leishmaniasis dan tripanosomiasis': {
    definisi: 'Infeksi parasit protozoa ditularkan vektor serangga (lalat pasir untuk Leishmania, lalat tsetse/triatoma untuk Trypanosoma).',
    diagnosis: ['Leishmaniasis: lesi kulit ulseratif kronik atau demam+hepatosplenomegali (visceral); Tripanosomiasis: chancre di gigitan, limfadenopati, gangguan neurologis stadium lanjut'],
    tatalaksana: ['Sesuai spesies dan bentuk klinis: antimonial pentavalen/amphotericin B (leishmaniasis), suramin/melarsoprol (tripanosomiasis) — rujuk pusat tropis'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Toksoplasmosis': {
    definisi: 'Infeksi protozoa Toxoplasma gondii, penting pada kehamilan (risiko kongenital) dan imunokompromais (ensefalitis).',
    diagnosis: ['Umumnya asimtomatik pada imunokompeten; serologi IgM/IgG toxoplasma untuk skrining kehamilan; pada imunokompromais: gejala ensefalitis dengan lesi cincin pada CT/MRI'],
    tatalaksana: ['Pirimetamin + sulfadiazin + asam folinat pada kasus simtomatik/kongenital/imunokompromais; spiramycin pada ibu hamil terinfeksi akut untuk cegah transmisi'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Sepsis': {
    definisi: 'Disfungsi organ mengancam nyawa akibat respons tubuh yang tidak teratur terhadap infeksi.',
    diagnosis: ['Kecurigaan infeksi + perubahan skor SOFA ≥2 poin, atau qSOFA ≥2 (perubahan kesadaran, RR≥22, TD sistolik≤100) sebagai skrining cepat'],
    tatalaksana: ['Bundle sepsis jam pertama: kultur darah sebelum antibiotik, antibiotik empiris broad-spectrum segera, resusitasi cairan kristaloid 30mL/kgBB bila hipotensi/laktat tinggi, vasopresor bila tetap hipotensi'],
    referensi: ['SKDI2012', 'SSC2021', 'PAPDI2014'],
  },
  'Lupus eritematosus sistemik': {
    definisi: 'Penyakit autoimun sistemik kronik yang dapat menyerang berbagai organ (kulit, sendi, ginjal, SSP).',
    diagnosis: ['Kriteria SLICC/ACR-EULAR: kombinasi klinis (ruam malar, artritis, serositis, nefritis) dan imunologis (ANA, anti-dsDNA positif)'],
    tatalaksana: ['Hydroxychloroquine dasar untuk semua pasien, kortikosteroid/imunosupresan sesuai keterlibatan organ'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Poliarteritis nodosa': {
    definisi: 'Vaskulitis nekrotikans pembuluh darah sedang, dapat mengenai berbagai organ (ginjal, kulit, saraf perifer, GI).',
    diagnosis: ['Gejala sistemik (demam, penurunan BB) + keterlibatan organ multipel; angiografi menunjukkan aneurisma mikro, biopsi menunjukkan vaskulitis nekrotikans'],
    tatalaksana: ['Kortikosteroid dosis tinggi ± siklofosfamid pada kasus berat, skrining dan tatalaksana hepatitis B (asosiasi etiologi pada sebagian kasus)'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Polimialgia reumatik': {
    definisi: 'Sindrom inflamasi pada usia lanjut dengan nyeri dan kaku otot proksimal (bahu, panggul), sering berkaitan dengan giant cell arteritis.',
    diagnosis: ['Nyeri/kaku bahu dan panggul bilateral usia >50 tahun, LED/CRP meningkat signifikan; respons dramatis terhadap kortikosteroid dosis rendah mendukung diagnosis'],
    tatalaksana: ['Prednison dosis rendah (12,5-25mg/hari) dengan tapering bertahap, waspada gejala giant cell arteritis (nyeri kepala, gangguan penglihatan) yang memerlukan dosis lebih tinggi segera'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Reaksi anafilaktik': {
    definisi: 'Reaksi hipersensitivitas sistemik berat dan mendadak, dapat mengancam nyawa melalui gangguan jalan napas dan syok.',
    diagnosis: ['Onset cepat setelah paparan alergen: urtikaria, angioedema, sesak/stridor, hipotensi — klinis, tidak perlu menunggu pemeriksaan penunjang'],
    tatalaksana: ['Epinefrin IM 0,3-0,5mg (1:1000) di paha anterolateral segera sebagai lini pertama, dapat diulang tiap 5-15 menit; oksigen, cairan IV, antihistamin dan kortikosteroid sebagai adjuvan (bukan pengganti epinefrin)'],
    referensi: ['SKDI2012', 'WAO2020', 'PPKFKTP2014'],
  },
  'Demam reumatik': {
    definisi: 'Reaksi autoimun pasca infeksi Streptococcus grup A yang dapat menyerang jantung, sendi, SSP, dan kulit.',
    diagnosis: ['Kriteria Jones: mayor (karditis, poliartritis migrans, korea, eritema marginatum, nodul subkutan) + bukti infeksi strep sebelumnya (ASTO)'],
    tatalaksana: ['Penisilin untuk eradikasi streptokokus, NSAID/aspirin untuk artritis, kortikosteroid bila karditis berat, profilaksis penisilin jangka panjang untuk cegah rekurensi'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Artritis reumatoid': {
    definisi: 'Penyakit autoimun kronik menyerang sendi secara simetris, dapat menyebabkan deformitas progresif bila tidak diterapi.',
    diagnosis: ['Kriteria ACR/EULAR 2010: sendi terlibat, serologi (RF/anti-CCP), reaktan fase akut, durasi ≥6 minggu'],
    tatalaksana: ['DMARD (methotrexate) sedini mungkin, NSAID/steroid dosis rendah untuk kontrol gejala sementara'],
    referensi: ['SKDI2012', 'ACREULAR2010', 'PAPDI2014'],
  },
  'Juvenile chronic arthritis': {
    definisi: 'Artritis idiopatik pada anak (<16 tahun) berlangsung >6 minggu, berbagai subtipe (oligoartikular, poliartikular, sistemik).',
    diagnosis: ['Bengkak sendi persisten pada anak tanpa penyebab lain, subtipe sistemik disertai demam tinggi intermiten dan ruam'],
    tatalaksana: ['NSAID lini pertama, DMARD (methotrexate) bila persisten, biologik pada kasus refrakter, fisioterapi untuk cegah kontraktur'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Henoch-schoenlein purpura': {
    definisi: 'Vaskulitis IgA yang mengenai pembuluh darah kecil, tersering pada anak, dengan tetrad klasik purpura-artritis-nyeri perut-nefritis.',
    diagnosis: ['Purpura palpabel di ekstremitas bawah/bokong, artralgia, nyeri perut, hematuria/proteinuria (nefritis)'],
    tatalaksana: ['Suportif pada kasus ringan (self-limiting), kortikosteroid untuk nyeri perut berat/keterlibatan ginjal signifikan, monitor fungsi ginjal jangka panjang'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Eritema multiformis': {
    definisi: 'Reaksi hipersensitivitas kulit akut, tersering dipicu infeksi HSV atau obat, dengan lesi target khas.',
    diagnosis: ['Lesi target/iris (tiga zona warna konsentris) simetris di ekstremitas, dapat disertai lesi mukosa ringan'],
    tatalaksana: ['Hentikan obat pencetus bila ada, atasi infeksi HSV pemicu (asiklovir bila rekuren), simtomatik (antihistamin, kompres)'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },
  'Imunodefisiensi': {
    definisi: 'Gangguan sistem imun (primer/kongenital atau sekunder/didapat seperti HIV, obat imunosupresan) yang meningkatkan kerentanan infeksi.',
    diagnosis: ['Infeksi berulang/berat/oportunistik, evaluasi jumlah dan fungsi sel imun (limfosit, imunoglobulin) sesuai kecurigaan jenis'],
    tatalaksana: ['Atasi/cegah infeksi (profilaksis sesuai jenis defisiensi), substitusi imunoglobulin pada defisiensi antibodi berat, atasi penyebab dasar bila sekunder'],
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'PAPDI2014'],
  },

  // ─── Ginjal & Saluran Kemih ──────────────────────────────────────────────
  'Infeksi saluran kemih': {
    definisi: 'Infeksi bakteri pada saluran kemih, dapat mengenai kandung kemih (sistitis) atau naik ke ginjal (pielonefritis).',
    diagnosis: ['Disuria, frekuensi, urgensi (sistitis); demam, nyeri pinggang, nyeri ketok CVA (pielonefritis); urinalisis leukosituria/nitrit positif, kultur urin konfirmasi'],
    tatalaksana: ['Sistitis tanpa komplikasi: antibiotik oral (nitrofurantoin/kotrimoksazol/fluoroquinolone) 3-7 hari; pielonefritis: antibiotik lebih lama, rawat inap bila berat/tidak toleransi oral'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'CAMPBELL2016'],
  },
  'Glomerulonefritis kronik': {
    definisi: 'Kerusakan glomerulus progresif dan menetap, dapat berujung penyakit ginjal kronik.',
    diagnosis: ['Proteinuria persisten, hematuria mikroskopik, penurunan fungsi ginjal bertahap; biopsi ginjal untuk klasifikasi histopatologi'],
    tatalaksana: ['Kontrol tekanan darah ketat (ACE-inhibitor/ARB untuk efek renoprotektif), imunosupresan sesuai etiologi, tatalaksana komplikasi CKD'],
    referensi: ['SKDI2012', 'KDIGOCKD2024', 'PAPDI2014'],
  },
  'Karsinoma sel renal': {
    definisi: 'Keganasan primer ginjal tersering pada dewasa, berasal dari epitel tubulus ginjal.',
    diagnosis: ['Trias klasik (jarang lengkap): hematuria, nyeri pinggang, massa teraba; CT scan kontras untuk karakterisasi massa ginjal'],
    tatalaksana: ['Nefrektomi parsial/radikal sebagai terapi utama, terapi target/imunoterapi pada stadium metastatik'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Tumor Wilms': {
    definisi: 'Nefroblastoma — tumor ginjal ganas tersering pada anak, umumnya usia <5 tahun.',
    diagnosis: ['Massa abdomen asimtomatik teraba orang tua, kadang hematuria/hipertensi; USG/CT abdomen menunjukkan massa ginjal'],
    tatalaksana: ['Nefrektomi + kemoterapi (dan radioterapi pada stadium lanjut), prognosis umumnya baik dengan terapi multimodal'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Acute kidney injury': {
    definisi: 'Penurunan fungsi ginjal mendadak (jam-hari), diklasifikasikan pre-renal, renal (intrinsik), atau post-renal (obstruktif).',
    diagnosis: ['Peningkatan kreatinin serum akut dan/atau penurunan produksi urin (kriteria KDIGO); cari penyebab (hipovolemia, nefrotoksin, obstruksi)'],
    tatalaksana: ['Atasi penyebab dasar, optimalkan volume cairan, hindari nefrotoksin, dialisis bila indikasi (overload cairan, hiperkalemia berat, asidosis berat, uremia simtomatik)'],
    referensi: ['SKDI2012', 'KDIGOAKI2012', 'PAPDI2014'],
  },
  'Penyakit ginjal kronik': {
    definisi: 'Kerusakan ginjal dan/atau penurunan fungsi ginjal ≥3 bulan, diklasifikasikan berdasarkan eGFR dan albuminuria.',
    diagnosis: ['eGFR <60 mL/min/1.73m² dan/atau penanda kerusakan ginjal (albuminuria) menetap ≥3 bulan'],
    tatalaksana: ['Kontrol tekanan darah dan gula darah, ACE-inhibitor/ARB untuk proteinuria, restriksi diet sesuai stadium, terapi pengganti ginjal (dialisis/transplantasi) pada stadium akhir'],
    referensi: ['SKDI2012', 'KDIGOCKD2024', 'PAPDI2014'],
  },
  'Kolik renal': {
    definisi: 'Nyeri hebat akibat obstruksi akut saluran kemih atas, tersering karena batu ureter.',
    diagnosis: ['Nyeri pinggang hebat menjalar ke selangkangan, hematuria mikroskopik; USG/CT non-kontras untuk konfirmasi batu dan lokasinya'],
    tatalaksana: ['Analgesia (NSAID lini pertama), hidrasi, alpha-blocker untuk membantu ekspulsi batu ureter distal kecil, litotripsi/endourologi bila batu besar/tidak keluar spontan'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Ginjal polikistik simtomatik': {
    definisi: 'Penyakit ginjal genetik dengan kista multipel progresif, tersering tipe autosomal dominan (ADPKD).',
    diagnosis: ['Riwayat keluarga, nyeri pinggang kronik, hipertensi, hematuria; USG/CT menunjukkan kista multipel bilateral'],
    tatalaksana: ['Kontrol tekanan darah ketat, tolvaptan dapat memperlambat progresi pada kasus terpilih, tatalaksana komplikasi (infeksi kista, batu, CKD)'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Ginjal tapal kuda': {
    definisi: 'Horseshoe kidney — anomali kongenital fusi kutub bawah kedua ginjal, umumnya asimtomatik namun predisposisi komplikasi.',
    diagnosis: ['Sering insidental pada pencitraan; predisposisi infeksi berulang, batu, obstruksi ureteropelvic junction'],
    tatalaksana: ['Observasi bila asimtomatik, tatalaksana komplikasi spesifik (infeksi, batu, obstruksi) bila muncul'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Pielonefritis tanpa komplikasi': {
    definisi: 'Infeksi bakteri parenkim ginjal tanpa faktor penyulit anatomis/sistemik.',
    diagnosis: ['Demam, menggigil, nyeri pinggang, nyeri ketok CVA positif; urinalisis dan kultur urin positif'],
    tatalaksana: ['Antibiotik empiris (fluoroquinolone/ceftriaxone) 7-14 hari, rawat jalan bila stabil, rawat inap bila muntah/tidak toleransi oral/tanda sepsis'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'CAMPBELL2016'],
  },
  'Nekrosis tubular akut': {
    definisi: 'Penyebab tersering AKI intrinsik, akibat iskemia atau toksin langsung merusak sel tubulus ginjal.',
    diagnosis: ['Riwayat hipotensi/syok/nefrotoksin, FENa >2%, sedimen urin menunjukkan muddy brown casts'],
    tatalaksana: ['Suportif: optimalkan hemodinamik, hindari nefrotoksin tambahan, dialisis bila indikasi, umumnya reversibel dalam 1-3 minggu bila penyebab diatasi'],
    referensi: ['SKDI2012', 'KDIGOAKI2012', 'PAPDI2014'],
  },
  'Hipospadia': {
    definisi: 'Kelainan kongenital muara uretra terletak di sisi ventral penis, bukan di ujung glans.',
    diagnosis: ['Tampak saat pemeriksaan neonatus: lokasi meatus uretra abnormal, dapat disertai chordee (kelengkungan penis)'],
    tatalaksana: ['Koreksi bedah elektif (uretroplasti), idealnya sebelum usia sekolah, hindari sirkumsisi sebelum operasi (kulit preputium digunakan untuk rekonstruksi)'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Epispadia': {
    definisi: 'Kelainan kongenital muara uretra terletak di sisi dorsal penis, sering berkaitan dengan ekstrofi buli.',
    diagnosis: ['Meatus uretra di dorsum penis, evaluasi keterlibatan buli (ekstrofi vesika) yang sering menyertai'],
    tatalaksana: ['Koreksi bedah rekonstruksi kompleks, rujuk pusat urologi pediatrik berpengalaman'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Testis tidak turun/ kriptorkidismus': {
    definisi: 'Kegagalan testis turun ke skrotum selama perkembangan janin, meningkatkan risiko infertilitas dan keganasan testis bila tidak dikoreksi.',
    diagnosis: ['Skrotum kosong pada palpasi, testis mungkin teraba di kanalis inguinalis atau tidak teraba sama sekali'],
    tatalaksana: ['Orkidopeksi sebelum usia 1-2 tahun untuk optimalkan fertilitas dan deteksi dini keganasan, observasi hingga usia 6 bulan (kemungkinan turun spontan)'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Rectratile testis': {
    definisi: 'Testis retraktil — testis yang dapat naik-turun akibat refleks kremaster hiperaktif, bukan kriptorkidismus sejati.',
    diagnosis: ['Testis dapat dimanipulasi turun ke skrotum secara manual dan menetap sesaat (beda dari kriptorkidismus yang tidak bisa)'],
    tatalaksana: ['Observasi berkala (umumnya menetap turun sendiri saat pubertas), tidak perlu bedah kecuali berkembang jadi ascending testis'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Varikokel': {
    definisi: 'Dilatasi vena pleksus pampiniformis di skrotum, tersering sisi kiri, dapat memengaruhi fertilitas.',
    diagnosis: ['Massa skrotum seperti "bag of worms", lebih jelas saat berdiri/Valsava, mengecil saat berbaring'],
    tatalaksana: ['Observasi bila asimtomatik, varikokelektomi bila nyeri, atrofi testis, atau infertilitas terkait'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Hidrokel': {
    definisi: 'Akumulasi cairan di antara lapisan tunika vaginalis testis.',
    diagnosis: ['Pembengkakan skrotum tidak nyeri, transiluminasi positif (membedakan dari massa solid)'],
    tatalaksana: ['Observasi pada bayi (sering menutup spontan <1-2 tahun), operasi (hidrokelektomi) bila menetap/besar/simtomatik pada anak besar atau dewasa'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Spermatokel': {
    definisi: 'Kista berisi cairan mengandung sperma, muncul dari epididimis, umumnya jinak.',
    diagnosis: ['Massa kistik teraba terpisah dari testis di superior/posterior, transiluminasi positif'],
    tatalaksana: ['Observasi bila asimtomatik/kecil, eksisi bedah bila besar/simtomatik'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Epididimitis': {
    definisi: 'Inflamasi epididimis, tersering akibat infeksi (IMS pada usia muda, bakteri enterik pada usia tua).',
    diagnosis: ['Nyeri dan bengkak skrotum unilateral gradual, Prehn sign positif (nyeri berkurang dengan elevasi testis) — bantu bedakan dari torsio'],
    tatalaksana: ['Antibiotik sesuai usia dan kemungkinan patogen (ceftriaxone+doksisiklin bila IMS, fluoroquinolone bila enterik), analgesia, elevasi skrotum'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Torsio testis': {
    definisi: 'Kegawatdaruratan urologi — testis terpuntir pada funikulus spermatikus menyebabkan iskemia, memerlukan tatalaksana segera untuk selamatkan testis.',
    diagnosis: ['Nyeri skrotum mendadak hebat, testis letak tinggi dan horizontal, refleks kremaster hilang, Prehn sign negatif (nyeri tidak berkurang dengan elevasi)'],
    tatalaksana: ['Eksplorasi bedah emergensi <6 jam onset untuk detorsi dan orkidopeksi bilateral — jangan tunda pencitraan bila kecurigaan klinis tinggi'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Ruptur uretra': {
    definisi: 'Cedera traumatik uretra, tersering akibat trauma pelvis (uretra posterior) atau straddle injury (uretra anterior).',
    diagnosis: ['Darah di meatus uretra, retensi urin, hematoma perineum kupu-kupu (uretra anterior); kontraindikasi kateterisasi buta sebelum evaluasi'],
    tatalaksana: ['Sistostomi suprapubik bila kecurigaan ruptur (hindari kateterisasi uretra langsung), uretrografi retrograd untuk konfirmasi, rujuk urologi untuk rekonstruksi definitif'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Ruptur kandung kencing': {
    definisi: 'Cedera traumatik kandung kemih, dapat intraperitoneal atau ekstraperitoneal, sering berkaitan trauma pelvis.',
    diagnosis: ['Hematuria gross, nyeri suprapubik, riwayat trauma pelvis/abdomen bawah; sistografi CT/konvensional untuk konfirmasi dan lokasi'],
    tatalaksana: ['Ekstraperitoneal: kateter urin terpasang untuk drainase, sering sembuh konservatif; Intraperitoneal: perbaikan bedah wajib (risiko peritonitis kimia)'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Ruptur ginjal': {
    definisi: 'Cedera traumatik ginjal, diklasifikasikan derajat I-V berdasarkan luas kerusakan (AAST grading).',
    diagnosis: ['Riwayat trauma tumpul/tajam pinggang/abdomen, hematuria (dapat tidak sebanding derajat cedera), nyeri pinggang; CT kontras untuk staging'],
    tatalaksana: ['Sebagian besar (derajat rendah) tatalaksana konservatif dengan observasi ketat, derajat tinggi/tidak stabil hemodinamik memerlukan intervensi/nefrektomi'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Karsinoma uroterial': {
    definisi: 'Keganasan epitel urotelial, dapat terjadi di kandung kemih, ureter, atau pelvis renal — tersering kandung kemih.',
    diagnosis: ['Hematuria makroskopik tanpa nyeri (gejala kunci), sistoskopi + biopsi untuk konfirmasi dan staging'],
    tatalaksana: ['Reseksi transuretral tumor buli (TURBT) untuk superfisial, sistektomi + kemoterapi untuk invasif otot, BCG intravesikal untuk risiko tinggi rekuren'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Seminoma testis': {
    definisi: 'Tumor sel germinal testis tersering, prognosis baik karena sangat radiosensitif dan kemosensitif.',
    diagnosis: ['Massa testis tidak nyeri, teraba padat; USG skrotum, penanda tumor (LDH, hCG umumnya normal/ringan naik, AFP normal — beda dari non-seminoma)'],
    tatalaksana: ['Orkidektomi radikal inguinal sebagai terapi awal, radioterapi/kemoterapi adjuvan sesuai stadium'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Teratoma testis': {
    definisi: 'Tumor sel germinal non-seminoma testis berisi berbagai jenis jaringan (ketiga lapisan germinal).',
    diagnosis: ['Massa testis tidak nyeri; penanda tumor AFP dapat meningkat, USG dan CT untuk staging'],
    tatalaksana: ['Orkidektomi radikal inguinal, kemoterapi berbasis platinum untuk penyakit metastatik/residual'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Hiperplasia prostat jinak': {
    definisi: 'Pembesaran jinak kelenjar prostat terkait usia, menyebabkan gejala obstruksi saluran kemih bawah (LUTS).',
    diagnosis: ['Gejala LUTS (pancaran lemah, hesitansi, nokturia, frekuensi), colok dubur: prostat membesar simetris, kenyal; PSA untuk skrining keganasan'],
    tatalaksana: ['Alpha-blocker (tamsulosin) untuk gejala, 5-alpha reductase inhibitor (finasteride) untuk mengecilkan volume, TURP bila gagal medikamentosa/retensi berulang'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Karsinoma prostat': {
    definisi: 'Keganasan prostat, tersering pada pria usia lanjut, sering asimtomatik pada stadium dini.',
    diagnosis: ['Colok dubur: nodul keras/ireguler; PSA meningkat, biopsi transrektal untuk konfirmasi histopatologi dan skor Gleason'],
    tatalaksana: ['Active surveillance pada risiko rendah, prostatektomi radikal/radioterapi pada risiko sedang-tinggi lokal, terapi deprivasi androgen pada metastatik'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Striktura uretra': {
    definisi: 'Penyempitan lumen uretra akibat jaringan parut, tersering akibat trauma, instrumentasi, atau infeksi kronik.',
    diagnosis: ['Pancaran urin lemah/bercabang, retensi urin, riwayat kateterisasi/IMS/trauma; uretrografi untuk lokasi dan panjang striktur'],
    tatalaksana: ['Dilatasi uretra/uretrotomi interna untuk striktur pendek, uretroplasti untuk striktur panjang/rekuren'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Priapismus': {
    definisi: 'Ereksi persisten >4 jam tanpa rangsangan seksual, kegawatdaruratan urologi (risiko iskemia korpus kavernosum).',
    diagnosis: ['Ereksi menetap nyeri (tipe iskemik/low-flow, lebih sering dan lebih darurat) atau tidak nyeri (tipe non-iskemik/high-flow); analisis gas darah korpus kavernosum membedakan tipe'],
    tatalaksana: ['Tipe iskemik: aspirasi korpus kavernosum + irigasi salin, injeksi fenilefrin intrakavernosa bila tidak respon, shunt bedah bila refrakter — tatalaksana <4-6 jam untuk cegah kerusakan permanen'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },
  'Chancroid': {
    definisi: 'Infeksi menular seksual akibat Haemophilus ducreyi, menyebabkan ulkus genital nyeri.',
    diagnosis: ['Ulkus genital nyeri dengan dasar kotor, tepi ireguler, disertai limfadenopati inguinal nyeri (bubo) — beda dari sifilis (ulkus tidak nyeri)'],
    tatalaksana: ['Azithromycin dosis tunggal atau ceftriaxone IM dosis tunggal, skrining IMS lain dan pasangan seksual'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'PAPDI2014'],
  },

  // ─── Muskuloskeletal ─────────────────────────────────────────────────────
  'Fraktur terbuka, tertutup': {
    definisi: 'Diskontinuitas tulang; terbuka bila ada hubungan fragmen fraktur dengan dunia luar melalui luka kulit, tertutup bila kulit di atasnya utuh.',
    diagnosis: [
      'Riwayat trauma, nyeri, bengkak, deformitas, krepitasi, keterbatasan gerak',
      'Fraktur terbuka diklasifikasikan Gustilo-Anderson I-III berdasarkan ukuran luka dan derajat kerusakan jaringan lunak',
      'Wajib evaluasi status neurovaskular distal sebelum dan sesudah setiap manipulasi; rontgen dua proyeksi mencakup sendi proksimal dan distal',
    ],
    tatalaksana: [
      'Fraktur terbuka adalah kegawatdaruratan: irigasi dan debridement segera, antibiotik IV dalam 1 jam, profilaksis tetanus, stabilisasi fraktur',
      'Fraktur tertutup: analgesia, imobilisasi/pembidaian mencakup sendi atas dan bawah, reduksi dan fiksasi definitif sesuai jenis fraktur',
      'Waspadai sindrom kompartemen (nyeri tidak proporsional, nyeri saat peregangan pasif) — fasciotomi bila terjadi',
    ],
    referensi: ['SKDI2012', 'APLEY2018', 'ATLS2018'],
  },
  'Fraktur klavikula': {
    definisi: 'Patah tulang selangka, tersering pada sepertiga tengah, umumnya akibat jatuh pada bahu atau tangan terulur.',
    diagnosis: ['Nyeri dan deformitas di klavikula, bahu terlihat turun, nyeri saat gerakan lengan; rontgen klavikula memastikan lokasi dan pergeseran'],
    tatalaksana: [
      'Sebagian besar konservatif: arm sling atau figure-of-eight bandage, analgesia, mobilisasi bertahap',
      'Operasi (fiksasi plate) bila pergeseran berat, fraktur terbuka, kominutif, atau mengancam kulit/neurovaskular',
    ],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Fraktur patologis': {
    definisi: 'Fraktur pada tulang yang sudah melemah oleh proses patologis (metastasis, osteoporosis, tumor primer, infeksi), terjadi akibat trauma minimal.',
    diagnosis: ['Fraktur dengan mekanisme trauma tidak sebanding; cari lesi litik/blastik pada rontgen, riwayat keganasan, nyeri tulang mendahului fraktur'],
    tatalaksana: ['Stabilisasi fraktur (sering memerlukan fiksasi internal), biopsi untuk diagnosis penyebab, tatalaksana penyakit dasar (onkologi, osteoporosis), radioterapi paliatif bila metastasis'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Fraktur dan dislokasi tulang belakang': {
    definisi: 'Cedera traumatik kolumna vertebralis, berpotensi menyebabkan cedera medula spinalis permanen.',
    diagnosis: [
      'Riwayat trauma energi tinggi, nyeri tulang belakang, deformitas; nilai defisit neurologis (motorik, sensorik, refleks, tonus sfingter)',
      'Imobilisasi servikal dan spine precaution sejak prehospital; CT/MRI untuk menilai stabilitas dan kompresi medula',
    ],
    tatalaksana: [
      'Imobilisasi ketat (collar, log roll saat memindahkan pasien) untuk cegah cedera sekunder',
      'Rujuk bedah saraf/ortopedi spine — dekompresi dan stabilisasi bila fraktur tidak stabil atau ada kompresi neurologis',
      'Tatalaksana ATLS bersamaan (cedera penyerta, syok neurogenik)',
    ],
    referensi: ['SKDI2012', 'ATLS2018', 'APLEY2018'],
  },
  'Dislokasi pada sendi ekstremitas': {
    definisi: 'Hilangnya hubungan normal permukaan sendi akibat trauma, tersering bahu dan jari.',
    diagnosis: ['Deformitas sendi, nyeri hebat, gerakan terkunci; wajib periksa status neurovaskular distal sebelum dan sesudah reduksi; rontgen menyingkirkan fraktur penyerta'],
    tatalaksana: ['Reduksi tertutup segera setelah analgesia/sedasi adekuat, imobilisasi pasca reduksi, rontgen ulang konfirmasi, rehabilitasi bertahap'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Osteogenesis imperfekta': {
    definisi: 'Kelainan genetik sintesis kolagen tipe I yang menyebabkan tulang sangat rapuh dan mudah patah.',
    diagnosis: ['Fraktur berulang dengan trauma minimal sejak usia dini, sklera biru, gangguan pendengaran, dentinogenesis imperfecta; riwayat keluarga mendukung'],
    tatalaksana: ['Bifosfonat untuk meningkatkan densitas tulang, fisioterapi dan rehabilitasi, fiksasi intramedular (rodding) pada deformitas berat, hindari trauma'],
    referensi: ['SKDI2012', 'APLEY2018', 'HARRISON2022'],
  },
  'Ricketsia, osteomalasia': {
    definisi: 'Gangguan mineralisasi tulang akibat defisiensi vitamin D/kalsium/fosfat — disebut rakitis bila terjadi pada anak (lempeng epifisis masih terbuka), osteomalasia pada dewasa.',
    diagnosis: [
      'Rakitis: deformitas tungkai (genu varum/valgum), rosary rib, pelebaran metafisis pergelangan tangan, keterlambatan pertumbuhan',
      'Osteomalasia: nyeri tulang difus, kelemahan otot proksimal; kalsium/fosfat rendah, alkali fosfatase tinggi, 25-OH vitamin D rendah',
    ],
    tatalaksana: ['Suplementasi vitamin D dan kalsium sesuai derajat defisiensi, paparan sinar matahari, koreksi penyebab dasar (malabsorpsi, penyakit ginjal), koreksi bedah pada deformitas berat menetap'],
    referensi: ['SKDI2012', 'APLEY2018', 'HARRISON2022'],
  },
  'Osteoporosis': {
    definisi: 'Penurunan densitas dan kualitas mikroarsitektur tulang yang meningkatkan risiko fraktur fragilitas.',
    diagnosis: ['Sering asimtomatik hingga terjadi fraktur (vertebra, panggul, pergelangan tangan); DXA scan dengan T-score ≤ -2,5 menegakkan diagnosis'],
    tatalaksana: [
      'Kalsium dan vitamin D adekuat, latihan menahan beban, berhenti merokok, batasi alkohol',
      'Bifosfonat sebagai lini pertama farmakoterapi pada risiko tinggi/riwayat fraktur fragilitas',
      'Pencegahan jatuh pada lansia sebagai komponen penting tatalaksana',
    ],
    referensi: ['SKDI2012', 'HARRISON2022', 'PAPDI2014'],
  },
  'Akondroplasia': {
    definisi: 'Displasia skeletal genetik (mutasi FGFR3) penyebab tersering dwarfisme dengan pemendekan tungkai proporsi rizomelik.',
    diagnosis: ['Perawakan pendek dengan tungkai pendek disproporsional, makrosefali, frontal bossing, lordosis lumbal; rontgen menunjukkan gambaran khas'],
    tatalaksana: ['Tidak ada terapi kuratif; pemantauan komplikasi (stenosis foramen magnum, apnea tidur, stenosis spinal), dukungan multidisiplin, konseling genetik'],
    referensi: ['SKDI2012', 'APLEY2018', 'HARRISON2022'],
  },
  'Displasia fibrosa': {
    definisi: 'Kelainan perkembangan tulang di mana jaringan tulang normal digantikan jaringan fibrosa, dapat monostotik atau poliostotik.',
    diagnosis: ['Nyeri tulang, deformitas, atau fraktur patologis; rontgen menunjukkan lesi "ground-glass" dengan batas sklerotik'],
    tatalaksana: ['Observasi bila asimtomatik, bifosfonat untuk nyeri tulang, stabilisasi bedah pada fraktur/deformitas berat'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Tenosinovitis supuratif': {
    definisi: 'Infeksi bakteri pada selubung tendon, tersering tendon fleksor jari — kegawatdaruratan bedah tangan.',
    diagnosis: ['Empat tanda Kanavel: jari posisi fleksi ringan, bengkak fusiform seluruh jari, nyeri tekan sepanjang selubung tendon, nyeri hebat saat ekstensi pasif'],
    tatalaksana: ['Antibiotik IV segera dan rujuk bedah untuk irigasi dan drainase selubung tendon — penundaan berisiko nekrosis tendon dan kehilangan fungsi permanen'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Tumor tulang primer, sekunder': {
    definisi: 'Neoplasma tulang; primer berasal dari jaringan tulang itu sendiri, sekunder merupakan metastasis dari keganasan organ lain (lebih sering).',
    diagnosis: [
      'Nyeri tulang persisten terutama malam hari, massa teraba, fraktur patologis',
      'Rontgen: lesi litik/blastik, reaksi periosteal; MRI untuk perluasan lokal, biopsi untuk diagnosis definitif',
      'Metastasis tulang tersering dari kanker payudara, prostat, paru, ginjal, tiroid',
    ],
    tatalaksana: ['Rujuk pusat onkologi ortopedi; terapi sesuai jenis dan stadium (kemoterapi, reseksi bedah, radioterapi), stabilisasi profilaksis pada lesi berisiko fraktur'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Osteosarkoma': {
    definisi: 'Tumor tulang ganas primer tersering pada remaja, umumnya mengenai metafisis tulang panjang sekitar lutut.',
    diagnosis: ['Nyeri dan massa di sekitar lutut/bahu pada remaja; rontgen menunjukkan lesi destruktif dengan reaksi periosteal sunburst dan segitiga Codman; biopsi untuk konfirmasi'],
    tatalaksana: ['Kemoterapi neoadjuvan, reseksi bedah luas dengan limb salvage bila memungkinkan, dilanjutkan kemoterapi adjuvan — rujuk pusat onkologi ortopedi'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Sarcoma Ewing': {
    definisi: 'Tumor tulang ganas primer pada anak dan remaja, sering mengenai diafisis tulang panjang dan tulang pipih (pelvis).',
    diagnosis: ['Nyeri tulang, massa, sering disertai demam dan penurunan BB (menyerupai infeksi); rontgen menunjukkan reaksi periosteal onion-skin; biopsi dan analisis genetik (translokasi EWSR1) konfirmatif'],
    tatalaksana: ['Kemoterapi multiagen sebagai tulang punggung terapi, dikombinasi bedah dan/atau radioterapi lokal — rujuk pusat onkologi'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Kista ganglion': {
    definisi: 'Kista berisi cairan mukoid yang timbul dari kapsul sendi atau selubung tendon, tersering di dorsum pergelangan tangan.',
    diagnosis: ['Benjolan kenyal, batas tegas, tidak nyeri atau nyeri ringan, transiluminasi positif; USG bila diagnosis meragukan'],
    tatalaksana: ['Observasi (banyak yang regresi spontan), aspirasi bila mengganggu, eksisi bedah bila rekuren atau simtomatik menetap'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Trauma sendi': {
    definisi: 'Cedera pada struktur sendi (kapsul, ligamen, kartilago) akibat trauma, tanpa harus disertai fraktur.',
    diagnosis: ['Nyeri, bengkak, keterbatasan gerak, efusi sendi; uji stabilitas ligamen spesifik sesuai sendi; rontgen menyingkirkan fraktur, MRI untuk cedera jaringan lunak'],
    tatalaksana: ['RICE (rest, ice, compression, elevation) fase akut, analgesia, imobilisasi sesuai derajat, fisioterapi, rujuk ortopedi bila instabilitas berat'],
    referensi: ['SKDI2012', 'APLEY2018', 'PPKFKTP2014'],
  },
  'Spondilitis, spondilodisitis': {
    definisi: 'Infeksi tulang belakang; spondilitis mengenai korpus vertebra, spondilodisitis melibatkan diskus intervertebralis — di Indonesia sering akibat tuberkulosis (Pott disease).',
    diagnosis: ['Nyeri punggung progresif, demam, penurunan BB, gibbus (kifosis angular) pada TB spinal; MRI modalitas terbaik, kultur/biopsi untuk patogen'],
    tatalaksana: ['OAT jangka panjang bila TB spinal (minimal 9-12 bulan), antibiotik sesuai kultur bila piogenik, imobilisasi, dekompresi bedah bila defisit neurologis atau instabilitas'],
    referensi: ['SKDI2012', 'APLEY2018', 'PAPDI2014'],
  },
  'Teratoma sakrokoksigeal': {
    definisi: 'Tumor sel germinal kongenital di regio sakrokoksigeal, tersering pada neonatus perempuan.',
    diagnosis: ['Massa di regio sakrokoksigeal terlihat saat lahir atau terdeteksi USG antenatal; MRI menilai perluasan intrapelvik; AFP sebagai penanda'],
    tatalaksana: ['Eksisi bedah komplet termasuk os koksigis (mencegah rekurensi) sedini mungkin, pemantauan AFP pasca operasi untuk deteksi rekurensi'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Spondilolistesis': {
    definisi: 'Pergeseran satu korpus vertebra terhadap vertebra di bawahnya, tersering L5 terhadap S1.',
    diagnosis: ['Nyeri punggung bawah, dapat disertai gejala radikular; rontgen lateral (termasuk fleksi-ekstensi) menunjukkan pergeseran dan derajatnya (grading Meyerding)'],
    tatalaksana: ['Konservatif: analgesia, fisioterapi penguatan otot inti, modifikasi aktivitas; fusi bedah bila defisit neurologis progresif atau nyeri refrakter'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Spondilolisis': {
    definisi: 'Defek pada pars interartikularis vertebra, sering akibat stres berulang pada atlet remaja, dapat berkembang menjadi spondilolistesis.',
    diagnosis: ['Nyeri punggung bawah memberat dengan ekstensi/hiperekstensi; rontgen oblik menunjukkan gambaran "Scottie dog with collar", CT/MRI lebih sensitif'],
    tatalaksana: ['Istirahat dari aktivitas pencetus, fisioterapi, brace pada kasus tertentu; operasi jarang diperlukan kecuali gagal konservatif'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Lesi pada ligamentosa panggul': {
    definisi: 'Cedera struktur ligamen sekitar sendi panggul akibat trauma atau stres berulang.',
    diagnosis: ['Nyeri panggul/selangkangan, keterbatasan gerak, nyeri saat gerakan spesifik; MRI untuk visualisasi cedera jaringan lunak'],
    tatalaksana: ['Istirahat, analgesia, fisioterapi bertahap; rujuk ortopedi bila nyeri menetap atau ada instabilitas'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Displasia panggul': {
    definisi: 'Developmental dysplasia of the hip (DDH) — gangguan perkembangan asetabulum dan kaput femoris, dapat menyebabkan subluksasi/dislokasi.',
    diagnosis: ['Skrining neonatus dengan manuver Ortolani dan Barlow, asimetri lipatan paha, keterbatasan abduksi panggul; USG panggul (<6 bulan) atau rontgen (>4-6 bulan)'],
    tatalaksana: ['Pavlik harness pada bayi <6 bulan, reduksi tertutup/terbuka dengan spica cast bila lebih tua atau gagal harness — deteksi dini sangat menentukan hasil'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Nekrosis kaput femoris': {
    definisi: 'Kematian jaringan tulang kaput femoris akibat gangguan suplai darah (osteonekrosis avaskular).',
    diagnosis: ['Nyeri panggul/selangkangan progresif, keterbatasan gerak; faktor risiko: steroid jangka panjang, alkohol, penyakit sel sabit, trauma; MRI paling sensitif untuk deteksi dini'],
    tatalaksana: ['Stadium dini: kurangi pembebanan, bifosfonat, core decompression; stadium lanjut dengan kolaps: artroplasti panggul total'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Tendinitis Achilles': {
    definisi: 'Inflamasi/degenerasi tendon Achilles akibat overuse, sering pada pelari dan olahragawan.',
    diagnosis: ['Nyeri dan kaku di tendon Achilles terutama saat memulai aktivitas, nyeri tekan dan penebalan tendon; Thompson test negatif (membedakan dari ruptur komplit)'],
    tatalaksana: ['Istirahat relatif, es, NSAID, latihan eksentrik betis sebagai terapi utama; hindari injeksi steroid ke tendon (risiko ruptur)'],
    referensi: ['SKDI2012', 'APLEY2018', 'PPKFKTP2014'],
  },
  'Lesi meniskus, medial, dan lateral': {
    definisi: 'Robekan kartilago meniskus lutut, umumnya akibat gerakan memutar dengan kaki terfiksasi.',
    diagnosis: ['Nyeri sepanjang garis sendi, locking/catching sensation, efusi lutut yang muncul bertahap; McMurray dan Thessaly test positif; MRI konfirmatif'],
    tatalaksana: ['Konservatif (fisioterapi, analgesia) untuk robekan degeneratif/stabil; artroskopi (repair bila memungkinkan, meniskektomi parsial bila tidak) untuk robekan simtomatik dengan locking'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Instabilitas sendi tumit': {
    definisi: 'Ketidakstabilan kronik sendi pergelangan kaki akibat kelemahan ligamen, umumnya pasca sprain berulang.',
    diagnosis: ['Riwayat sprain berulang, rasa "giving way", nyeri kronik; anterior drawer dan talar tilt test menunjukkan laksitas berlebih'],
    tatalaksana: ['Fisioterapi proprioseptif dan penguatan peroneus sebagai lini pertama, ankle brace saat aktivitas, rekonstruksi ligamen bila gagal konservatif'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Claw foot, drop foot': {
    definisi: 'Deformitas kaki akibat gangguan neuromuskular; claw foot (pes cavus dengan jari mencakar), drop foot (kelemahan dorsofleksi akibat lesi N. peroneus komunis atau radiks L4-L5).',
    diagnosis: ['Drop foot: pola jalan steppage gait, kelemahan dorsofleksi kaki, cari lesi N. peroneus (fibula proksimal) atau radikulopati; EMG/NCS melokalisasi lesi'],
    tatalaksana: ['Ankle-foot orthosis (AFO) untuk fungsi berjalan, fisioterapi, atasi penyebab dasar (dekompresi saraf, tatalaksana radikulopati), transfer tendon pada kasus permanen'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Claw hand, drop hand': {
    definisi: 'Deformitas tangan akibat lesi saraf perifer; claw hand (lesi N. ulnaris), drop hand/wrist drop (lesi N. radialis).',
    diagnosis: ['Claw hand: hiperekstensi MCP dan fleksi PIP/DIP jari 4-5, Froment sign positif (lesi ulnaris); Drop hand: ketidakmampuan ekstensi pergelangan tangan dan jari (lesi radialis)'],
    tatalaksana: ['Splinting fungsional, fisioterapi untuk cegah kontraktur, atasi penyebab (dekompresi/neurolisis, tatalaksana fraktur humerus pada lesi radialis), transfer tendon bila lesi permanen'],
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
  'Ulkus pada tungkai': {
    definisi: 'Luka terbuka kronik pada tungkai, tersering akibat insufisiensi vena, penyakit arteri perifer, neuropati diabetik, atau kombinasi.',
    diagnosis: [
      'Ulkus vena: maleolus medial, tepi landai, dasar granulasi, disertai edema dan hiperpigmentasi kulit',
      'Ulkus arterial: distal/ujung jari, tepi tegas "punched-out", dasar pucat, nyeri, nadi distal lemah',
      'Ulkus neuropatik (diabetik): di titik tekan plantar, tidak nyeri, dikelilingi kalus; nilai ABI dan sensasi monofilamen',
    ],
    tatalaksana: [
      'Perawatan luka (debridement, dressing sesuai jenis luka), kontrol infeksi',
      'Ulkus vena: kompresi sebagai terapi utama, elevasi tungkai; Ulkus arterial: revaskularisasi, JANGAN diberi kompresi',
      'Ulkus diabetik: offloading (mengurangi tekanan), kontrol gula darah, edukasi perawatan kaki',
    ],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'APLEY2018'],
  },
  'Osteomielitis': {
    definisi: 'Infeksi tulang dan sumsum tulang, dapat akut atau kronik, akibat penyebaran hematogen, perluasan infeksi sekitar, atau inokulasi langsung (fraktur terbuka, operasi).',
    diagnosis: ['Nyeri tulang lokal, demam, bengkak dan kemerahan; LED/CRP meningkat, rontgen sering normal pada 2 minggu pertama, MRI paling sensitif; kultur tulang/darah untuk patogen'],
    tatalaksana: ['Antibiotik IV jangka panjang (umumnya 4-6 minggu) disesuaikan kultur, debridement bedah pada jaringan nekrotik/sekuestrum, tatalaksana kronik sering memerlukan reseksi dan rekonstruksi'],
    referensi: ['SKDI2012', 'APLEY2018', 'PAPDI2014'],
  },
  'Rhabdomiosarkoma': {
    definisi: 'Sarkoma jaringan lunak ganas berasal dari sel prekursor otot lurik, keganasan jaringan lunak tersering pada anak.',
    diagnosis: ['Massa jaringan lunak yang membesar cepat (kepala-leher, genitourinaria, ekstremitas); MRI untuk perluasan lokal, biopsi untuk konfirmasi histopatologi'],
    tatalaksana: ['Terapi multimodal: kemoterapi + reseksi bedah dan/atau radioterapi sesuai lokasi dan risiko — rujuk pusat onkologi anak'],
    referensi: ['SKDI2012', 'CAMPBELLORTHO2021', 'HARRISON2022'],
  },
  'Leiomioma, leiomiosarkoma, liposarkoma': {
    definisi: 'Tumor jaringan lunak; leiomioma (jinak, otot polos), leiomiosarkoma (ganas, otot polos), liposarkoma (ganas, jaringan lemak).',
    diagnosis: ['Massa jaringan lunak; tanda curiga keganasan: ukuran >5cm, letak dalam (subfascial), tumbuh cepat, nyeri; MRI dan biopsi untuk diagnosis definitif'],
    tatalaksana: ['Eksisi bedah luas dengan tepi bebas tumor untuk sarkoma, radioterapi adjuvan sesuai grade dan tepi reseksi, kemoterapi pada penyakit lanjut — rujuk pusat onkologi'],
    referensi: ['SKDI2012', 'CAMPBELLORTHO2021', 'HARRISON2022'],
  },
  'Lipoma': {
    definisi: 'Tumor jinak jaringan lemak subkutan, sangat umum dan tidak berbahaya.',
    diagnosis: ['Benjolan subkutan lunak, mobile, batas tegas, tidak nyeri, pertumbuhan sangat lambat; curigai liposarkoma bila >5cm, letak dalam, tumbuh cepat, atau nyeri'],
    tatalaksana: ['Observasi bila asimtomatik dan gambaran khas jinak; eksisi bila mengganggu kosmetik, nyeri, membesar, atau ada keraguan diagnosis'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'CAMPBELLORTHO2021'],
  },
  'Fibromatosis, fibroma, fibrosarkoma': {
    definisi: 'Spektrum tumor jaringan fibrosa; fibroma (jinak), fibromatosis/desmoid (agresif lokal namun tidak bermetastasis), fibrosarkoma (ganas).',
    diagnosis: ['Massa jaringan lunak padat; fibromatosis cenderung infiltratif dan rekuren lokal; MRI dan biopsi untuk membedakan jenis dan grade'],
    tatalaksana: ['Eksisi bedah dengan tepi adekuat, radioterapi adjuvan pada kasus tertentu; fibromatosis desmoid dapat diobservasi atau diberi terapi sistemik karena tingginya rekurensi pasca operasi'],
    referensi: ['SKDI2012', 'CAMPBELLORTHO2021', 'HARRISON2022'],
  },

  // ─── Respirasi ───────────────────────────────────────────────────────────
  'Influenza': {
    definisi: 'Infeksi virus influenza pada saluran napas, umumnya self-limiting namun dapat berat pada kelompok risiko tinggi.',
    diagnosis: ['Demam mendadak, mialgia, nyeri kepala, batuk kering, nyeri tenggorokan; diagnosis umumnya klinis, rapid antigen/PCR bila perlu konfirmasi'],
    tatalaksana: ['Suportif (istirahat, cairan, antipiretik); oseltamivir dalam 48 jam onset pada kelompok risiko tinggi atau kasus berat; vaksinasi influenza tahunan sebagai pencegahan'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'MURRAY2022'],
  },
  'Acute Respiratory distress syndrome (ARDS)': {
    definisi: 'Gagal napas hipoksemik akut akibat kerusakan alveolar difus dengan edema paru non-kardiogenik.',
    diagnosis: ['Definisi Berlin: onset dalam 1 minggu, infiltrat bilateral pada pencitraan, bukan gagal jantung/overload cairan, dengan derajat berdasarkan PaO2/FiO2 (ringan ≤300, sedang ≤200, berat ≤100)'],
    tatalaksana: ['Ventilasi mekanik protektif paru (tidal volume 4-8 mL/kgBB prediksi, plateau pressure <30 cmH2O), posisi pronasi pada ARDS berat, atasi penyebab dasar, strategi cairan konservatif'],
    referensi: ['SKDI2012', 'ARDSBERLIN2012', 'MURRAY2022'],
  },
  'SARS': {
    definisi: 'Severe Acute Respiratory Syndrome — pneumonia atipik berat akibat infeksi coronavirus (SARS-CoV), berpotensi wabah.',
    diagnosis: ['Demam tinggi, batuk, sesak progresif dengan riwayat kontak/perjalanan dari daerah wabah; infiltrat paru pada rontgen, konfirmasi PCR'],
    tatalaksana: ['Isolasi ketat dengan kewaspadaan airborne dan droplet, terapi suportif dan oksigenasi, ventilasi mekanik bila gagal napas, pelaporan wajib ke otoritas kesehatan'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Flu burung': {
    definisi: 'Infeksi virus avian influenza (H5N1/H7N9) pada manusia, umumnya dari kontak unggas terinfeksi, dengan mortalitas tinggi.',
    diagnosis: ['Demam tinggi, gejala pernapasan progresif cepat, dengan riwayat kontak unggas sakit/mati; konfirmasi PCR dari swab'],
    tatalaksana: ['Oseltamivir segera (jangan menunggu konfirmasi bila kecurigaan kuat), isolasi, terapi suportif intensif, pelaporan wajib sebagai penyakit berpotensi wabah'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Hipertrofi adenoid': {
    definisi: 'Pembesaran jaringan adenoid di nasofaring, umum pada anak, dapat menyumbat jalan napas atas dan tuba Eustachius.',
    diagnosis: ['Napas lewat mulut, mendengkur, rinore kronik, suara sengau, fasies adenoid; rontgen lateral nasofaring atau nasoendoskopi menunjukkan pembesaran'],
    tatalaksana: ['Observasi (sering mengecil seiring usia), kortikosteroid nasal, adenoidektomi bila obstruksi berat, sleep apnea, atau otitis media efusi berulang'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'MURRAY2022'],
  },
  'Pseudo-croop acute epiglotitis': {
    definisi: 'Croup (laringotrakeobronkitis, umumnya viral) dan epiglotitis akut (umumnya bakterial, H. influenzae tipe b) — keduanya menyebabkan obstruksi jalan napas atas pada anak.',
    diagnosis: [
      'Croup: batuk menggonggong (barking cough), stridor inspirasi, suara serak, demam ringan; rontgen leher menunjukkan steeple sign',
      'Epiglotitis: onset sangat cepat, demam tinggi, air hunger, drooling, tripod position, tanpa batuk menggonggong; rontgen lateral menunjukkan thumb sign',
    ],
    tatalaksana: [
      'Croup: deksametason dosis tunggal, nebulisasi epinefrin pada distres sedang-berat, oksigen',
      'Epiglotitis: JANGAN periksa faring/tekan lidah (risiko spasme laring fatal) — amankan jalan napas di kamar operasi terlebih dahulu, lalu antibiotik IV (ceftriaxone)',
    ],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'MURRAY2022'],
  },
  'Difteria (THT)': {
    definisi: 'Infeksi Corynebacterium diphtheriae pada saluran napas atas dengan pembentukan pseudomembran dan produksi eksotoksin sistemik.',
    diagnosis: ['Nyeri tenggorokan dengan pseudomembran abu-abu yang melekat dan mudah berdarah bila diangkat, bull neck (limfadenopati servikal berat), riwayat imunisasi tidak lengkap; kultur swab konfirmatif'],
    tatalaksana: ['Anti-Difteri Serum (ADS) segera berdasarkan kecurigaan klinis (jangan tunggu kultur), antibiotik (penisilin/eritromisin), isolasi, monitor komplikasi miokarditis dan neuropati, profilaksis dan imunisasi kontak'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Karsinoma laring': {
    definisi: 'Keganasan laring, tersering karsinoma sel skuamosa, faktor risiko utama merokok dan alkohol.',
    diagnosis: ['Suara serak progresif >2-3 minggu (gejala kunci pada tumor glotis), disfagia, sesak, benjolan leher; laringoskopi dan biopsi untuk konfirmasi'],
    tatalaksana: ['Radioterapi atau bedah konservasi laring pada stadium dini, laringektomi total ± kemoradiasi pada stadium lanjut, rehabilitasi suara pasca operasi'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Karsinoma nasofaring': {
    definisi: 'Keganasan epitel nasofaring, insidens relatif tinggi di Asia Tenggara termasuk Indonesia, berkaitan dengan infeksi virus Epstein-Barr.',
    diagnosis: ['Trias: benjolan leher (limfadenopati servikal), gejala hidung (epistaksis, sumbatan), gejala telinga (tinitus, tuli konduktif unilateral); nasoendoskopi dan biopsi konfirmatif, titer EBV mendukung'],
    tatalaksana: ['Radioterapi sebagai modalitas utama (sangat radiosensitif), dikombinasi kemoterapi pada stadium lanjut — rujuk pusat onkologi'],
    referensi: ['SKDI2012', 'HARRISON2022', 'MURRAY2022'],
  },
  'Trakeitis': {
    definisi: 'Inflamasi trakea, dapat viral atau bakterial (trakeitis bakterial berpotensi mengancam jalan napas pada anak).',
    diagnosis: ['Batuk, stridor, demam; trakeitis bakterial: demam tinggi, toksik, sekret purulen dan tidak respons terhadap terapi croup standar'],
    tatalaksana: ['Antibiotik IV bila bakterial, amankan jalan napas bila obstruksi mengancam, terapi suportif dan humidifikasi'],
    referensi: ['SKDI2012', 'MURRAY2022', 'PPKFKTP2014'],
  },
  'Aspirasi': {
    definisi: 'Masuknya material (cairan lambung, makanan, benda asing) ke saluran napas bawah, dapat menyebabkan pneumonitis kimia atau pneumonia aspirasi.',
    diagnosis: ['Riwayat penurunan kesadaran/gangguan menelan, batuk dan sesak mendadak saat/setelah makan; infiltrat pada segmen dependen paru (lobus bawah kanan bila posisi tegak)'],
    tatalaksana: ['Bebaskan jalan napas dan suction, oksigenasi; antibiotik bila terbukti pneumonia aspirasi (bukan profilaksis rutin pada pneumonitis kimia murni), cegah rekurensi (posisi, evaluasi menelan)'],
    referensi: ['SKDI2012', 'MURRAY2022', 'PPKFKTP2014'],
  },
  'Benda asing': {
    definisi: 'Obstruksi saluran napas oleh benda asing, kegawatdaruratan tersering pada anak kecil.',
    diagnosis: ['Riwayat tersedak mendadak, batuk paroksismal, stridor/wheezing unilateral; rontgen dapat menunjukkan air trapping unilateral (benda asing radiolusen sering tidak tampak langsung)'],
    tatalaksana: ['Obstruksi total: back blows dan chest thrusts pada bayi, Heimlich manuver pada anak besar/dewasa; obstruksi parsial dengan pasien masih bisa batuk: jangan intervensi buta, rujuk untuk bronkoskopi ekstraksi'],
    referensi: ['SKDI2012', 'MURRAY2022', 'ATLS2018'],
  },
  'Displasia bronkopulmonar': {
    definisi: 'Penyakit paru kronik pada bayi prematur akibat cedera paru dari ventilasi mekanik dan oksigen suplemental.',
    diagnosis: ['Bayi prematur yang masih memerlukan oksigen pada usia koreksi 36 minggu; gambaran rontgen menunjukkan perubahan kistik dan fibrosis'],
    tatalaksana: ['Dukungan oksigen dan nutrisi optimal, minimalkan barotrauma, diuretik dan bronkodilator selektif, pencegahan infeksi (imunisasi, profilaksis RSV bila tersedia)'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Karsinoma paru': {
    definisi: 'Keganasan primer paru, dibagi non-small cell (NSCLC, ~85%) dan small cell (SCLC); faktor risiko utama merokok.',
    diagnosis: ['Batuk kronik yang berubah pola, hemoptisis, penurunan BB, nyeri dada; rontgen/CT toraks menunjukkan massa, konfirmasi biopsi (bronkoskopi/TTNA) dan staging'],
    tatalaksana: ['NSCLC stadium dini: reseksi bedah; stadium lanjut: kemoterapi/terapi target sesuai mutasi (EGFR, ALK)/imunoterapi; SCLC: kemoterapi ± radioterapi karena umumnya sudah menyebar saat diagnosis'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Tuberkulosis dengan HIV': {
    definisi: 'Koinfeksi TB pada orang dengan HIV — TB adalah penyebab kematian tersering pada ODHIV, dengan presentasi sering atipik.',
    diagnosis: ['Gejala TB dapat atipik dan rontgen sering tidak khas (terutama CD4 rendah); TB ekstraparu lebih sering; gunakan TCM (Xpert MTB/RIF) sebagai uji awal, skrining TB pada semua ODHIV'],
    tatalaksana: ['OAT dimulai lebih dahulu, ARV dimulai dalam 2-8 minggu setelah OAT (lebih cepat bila CD4 sangat rendah), waspada IRIS dan interaksi rifampisin dengan ARV, profilaksis kotrimoksazol'],
    referensi: ['SKDI2012', 'PNPKTB2020', 'WHOTBDR2022'],
  },
  'Multi Drug Resistance (MDR) TB': {
    definisi: 'TB yang resisten terhadap minimal isoniazid dan rifampisin, memerlukan regimen lini kedua yang lebih panjang dan toksik.',
    diagnosis: ['Kecurigaan pada gagal terapi, kambuh, putus obat, atau kontak pasien MDR; konfirmasi dengan uji kepekaan obat/TCM yang mendeteksi resistensi rifampisin'],
    tatalaksana: ['Regimen MDR sesuai pedoman nasional (regimen jangka pendek atau individual dengan bedaquiline dan obat lini kedua), pengawasan menelan obat ketat, pemantauan efek samping (ototoksisitas, QT, hepatotoksisitas)'],
    referensi: ['SKDI2012', 'WHOTBDR2022', 'PNPKTB2020'],
  },
  'Pneumothorax ventil': {
    definisi: 'Tension pneumothorax — udara masuk rongga pleura secara satu arah, menekan mediastinum dan menurunkan curah jantung; kegawatdaruratan yang mengancam nyawa.',
    diagnosis: ['Sesak berat, hipotensi, distensi vena leher, deviasi trakea ke sisi kontralateral, suara napas hilang dan hipersonor pada sisi terkena — diagnosis KLINIS, jangan tunggu rontgen'],
    tatalaksana: ['Dekompresi jarum segera (ICS 2 linea midklavikula atau ICS 4-5 linea aksilaris anterior), dilanjutkan pemasangan WSD (chest tube) definitif'],
    referensi: ['SKDI2012', 'ATLS2018', 'MURRAY2022'],
  },
  'Pneumothorax': {
    definisi: 'Terkumpulnya udara dalam rongga pleura menyebabkan kolaps paru; dapat spontan primer, sekunder, atau traumatik.',
    diagnosis: ['Nyeri dada pleuritik mendadak dan sesak, suara napas menurun dan hipersonor pada perkusi; rontgen toraks menunjukkan garis pleura viseral tanpa corakan paru di perifer'],
    tatalaksana: ['Kecil dan asimtomatik: observasi dengan oksigen; besar atau simtomatik: aspirasi atau pemasangan WSD; pleurodesis dipertimbangkan pada kasus berulang'],
    referensi: ['SKDI2012', 'MURRAY2022', 'ATLS2018'],
  },
  'Efusi pleura masif': {
    definisi: 'Akumulasi cairan dalam rongga pleura dalam jumlah besar sehingga menekan paru dan menyebabkan gangguan napas berat.',
    diagnosis: ['Sesak, perkusi redup, suara napas menghilang, fremitus menurun; rontgen menunjukkan perselubungan luas dengan pergeseran mediastinum kontralateral; torasentesis dengan analisis kriteria Light membedakan transudat vs eksudat'],
    tatalaksana: ['Torasentesis terapeutik (drainase bertahap, hindari >1-1,5 L sekaligus karena risiko re-expansion pulmonary edema), atasi penyebab dasar (TB, keganasan, gagal jantung), pleurodesis pada efusi maligna berulang'],
    referensi: ['SKDI2012', 'MURRAY2022', 'PAPDI2014'],
  },
  'Emfisema paru': {
    definisi: 'Pembesaran permanen rongga udara distal bronkiolus terminalis dengan destruksi dinding alveolus — komponen utama PPOK.',
    diagnosis: ['Sesak progresif, barrel chest, hipersonor, suara napas melemah; spirometri menunjukkan obstruksi ireversibel (FEV1/FVC pasca-bronkodilator <0,70)'],
    tatalaksana: ['Berhenti merokok sebagai intervensi paling penting, bronkodilator kerja panjang, rehabilitasi paru, oksigen jangka panjang bila hipoksemia kronik, vaksinasi influenza dan pneumokokus'],
    referensi: ['SKDI2012', 'GOLD2024', 'MURRAY2022'],
  },
  'Atelektasis': {
    definisi: 'Kolaps atau pengembangan tidak sempurna jaringan paru, dapat obstruktif (sumbatan bronkus) atau non-obstruktif (kompresi, hipoventilasi).',
    diagnosis: ['Sesak, penurunan suara napas, perkusi redup; rontgen menunjukkan opasitas dengan tanda kehilangan volume (pergeseran fisura/mediastinum ke sisi lesi)'],
    tatalaksana: ['Atasi penyebab (bronkoskopi untuk sumbatan, drainase efusi), fisioterapi dada dan latihan napas dalam, mobilisasi dini pasca operasi sebagai pencegahan'],
    referensi: ['SKDI2012', 'MURRAY2022', 'PAPDI2014'],
  },
  'Edema paru': {
    definisi: 'Akumulasi cairan di alveoli dan interstisium paru, umumnya kardiogenik (gagal jantung kiri) atau non-kardiogenik (ARDS).',
    diagnosis: ['Sesak berat ortopnea, batuk berbusa kemerahan, ronki basah halus bilateral; rontgen menunjukkan gambaran batwing dan garis Kerley B; BNP tinggi mendukung kardiogenik'],
    tatalaksana: ['Posisi duduk, oksigen/ventilasi non-invasif, diuretik loop IV (furosemid), nitrat bila tekanan darah memadai, atasi pencetus (iskemia, aritmia, krisis hipertensi)'],
    referensi: ['SKDI2012', 'PERKIHF2020', 'BRAUNWALD2022'],
  },
  'Infark paru': {
    definisi: 'Nekrosis jaringan paru akibat obstruksi aliran arteri pulmonalis, umumnya komplikasi emboli paru.',
    diagnosis: ['Nyeri dada pleuritik, hemoptisis, sesak; CT angiografi paru menunjukkan defek pengisian dengan opasitas berbentuk baji perifer (Hampton hump)'],
    tatalaksana: ['Antikoagulasi seperti pada emboli paru, analgesia, oksigen, atasi faktor risiko tromboemboli'],
    referensi: ['SKDI2012', 'MURRAY2022', 'BRAUNWALD2022'],
  },
  'Emboli paru': {
    definisi: 'Obstruksi arteri pulmonalis oleh trombus (umumnya dari trombosis vena dalam tungkai), dapat fatal bila masif.',
    diagnosis: ['Sesak mendadak, nyeri dada pleuritik, takikardia, dapat disertai sinkop/syok bila masif; skor Wells untuk probabilitas, D-dimer untuk menyingkirkan pada risiko rendah, CT angiografi paru sebagai baku emas'],
    tatalaksana: ['Antikoagulasi segera (heparin/LMWH lalu antikoagulan oral), trombolisis pada emboli masif dengan instabilitas hemodinamik, filter vena kava bila antikoagulasi kontraindikasi'],
    referensi: ['SKDI2012', 'MURRAY2022', 'BRAUNWALD2022'],
  },
  'Kistik fibrosis': {
    definisi: 'Penyakit genetik autosomal resesif (mutasi gen CFTR) menyebabkan sekret kental di paru, pankreas, dan organ lain.',
    diagnosis: ['Infeksi paru berulang, bronkiektasis, steatore dan gagal tumbuh (insufisiensi pankreas); uji keringat (sweat chloride) meningkat, konfirmasi analisis genetik'],
    tatalaksana: ['Fisioterapi dada dan mukolitik, antibiotik agresif untuk eksaserbasi, enzim pankreas dan dukungan nutrisi, modulator CFTR pada mutasi yang sesuai — rujuk pusat rujukan'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Haematothorax': {
    definisi: 'Terkumpulnya darah dalam rongga pleura, umumnya akibat trauma toraks.',
    diagnosis: ['Riwayat trauma, sesak, perkusi redup, suara napas menurun, dapat disertai syok hipovolemik; rontgen toraks menunjukkan perselubungan'],
    tatalaksana: ['Pemasangan WSD untuk evakuasi darah dan pemantauan produksi, resusitasi cairan/darah; torakotomi bila drainase awal >1500 mL atau perdarahan berlanjut >200 mL/jam selama 2-4 jam'],
    referensi: ['SKDI2012', 'ATLS2018', 'MURRAY2022'],
  },
  'Tumor mediastinum': {
    definisi: 'Massa di rongga mediastinum, jenisnya berkorelasi dengan kompartemen (anterior: timoma, limfoma, teratoma, tiroid; posterior: tumor neurogenik).',
    diagnosis: ['Sering asimtomatik/insidental; bila besar dapat menyebabkan batuk, sesak, sindrom vena kava superior, disfagia; CT toraks untuk lokasi dan karakterisasi, biopsi untuk histopatologi'],
    tatalaksana: ['Sesuai jenis: reseksi bedah (timoma, teratoma, tumor neurogenik), kemoterapi/radioterapi (limfoma, tumor sel germinal) — rujuk bedah toraks/onkologi'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Pnemokoniasis': {
    definisi: 'Penyakit paru akibat inhalasi debu mineral di tempat kerja (silikosis, asbestosis, coal workers pneumoconiosis).',
    diagnosis: ['Riwayat paparan okupasional bertahun-tahun, sesak progresif, batuk kering; rontgen/HRCT menunjukkan nodul atau fibrosis dengan pola khas sesuai jenis debu'],
    tatalaksana: ['Tidak ada terapi kuratif — hentikan paparan, terapi suportif dan rehabilitasi paru, skrining TB (silikosis meningkatkan risiko) dan keganasan (asbestosis), pelaporan sebagai penyakit akibat kerja'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Penyakit paru intersisial': {
    definisi: 'Kelompok penyakit yang menyebabkan inflamasi dan fibrosis interstisium paru, menghasilkan pola restriktif dan gangguan difusi.',
    diagnosis: ['Sesak progresif, batuk kering, ronki velcro basal, clubbing; spirometri pola restriktif dengan DLCO menurun, HRCT toraks menunjukkan pola fibrosis (mis. UIP)'],
    tatalaksana: ['Sesuai etiologi: hentikan paparan/obat penyebab, kortikosteroid-imunosupresan pada penyakit inflamasi, antifibrotik (pirfenidone/nintedanib) pada fibrosis paru idiopatik, oksigen dan rehabilitasi paru'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },
  'Obstructive Sleep Apnea (OSA)': {
    definisi: 'Episode berulang obstruksi jalan napas atas saat tidur menyebabkan apnea/hipopnea, hipoksemia intermiten, dan fragmentasi tidur.',
    diagnosis: ['Mendengkur keras, apnea disaksikan, mengantuk berlebih siang hari; skrining kuesioner STOP-BANG/Epworth, konfirmasi polisomnografi dengan indeks apnea-hipopnea (AHI)'],
    tatalaksana: ['Penurunan berat badan dan hindari alkohol/sedatif sebelum tidur, CPAP sebagai terapi utama pada OSA sedang-berat, oral appliance atau bedah pada kasus terpilih'],
    referensi: ['SKDI2012', 'MURRAY2022', 'HARRISON2022'],
  },

  // ─── Kardiovaskular ──────────────────────────────────────────────────────
  'Syok (septik, hipovolemik, kardiogenik, neurogenik)': {
    definisi: 'Kegagalan sirkulasi yang menyebabkan hipoperfusi jaringan dan hipoksia sel; diklasifikasikan berdasarkan mekanisme utama.',
    diagnosis: [
      'Hipotensi, takikardia, akral dingin dan CRT memanjang (kecuali syok distributif fase awal yang hangat), oliguria, penurunan kesadaran, laktat meningkat',
      'Bedakan mekanisme: hipovolemik (perdarahan/dehidrasi, JVP rendah), kardiogenik (JVP tinggi, ronki, riwayat jantung), septik (sumber infeksi, hangat vasodilatasi), neurogenik (bradikardia paradoks, cedera spinal)',
    ],
    tatalaksana: [
      'Hipovolemik: resusitasi cairan/darah agresif dan kontrol sumber perdarahan',
      'Septik: bundle sepsis — kultur, antibiotik dini, kristaloid 30 mL/kgBB, vasopresor (norepinefrin) bila tetap hipotensi',
      'Kardiogenik: hati-hati cairan, inotropik/vasopresor, revaskularisasi segera bila akibat infark miokard',
      'Neurogenik: cairan dan vasopresor, atropin bila bradikardia bermakna, imobilisasi spinal',
    ],
    referensi: ['SKDI2012', 'SSC2021', 'ATLS2018'],
  },
  'Infark miokard': {
    definisi: 'Nekrosis miokardium akibat iskemia berkepanjangan, umumnya oleh trombosis pada plak aterosklerotik koroner.',
    diagnosis: [
      'Nyeri dada tipikal >20 menit, menjalar ke lengan kiri/rahang, disertai keringat dingin, mual; dapat atipik pada lansia, wanita, dan pasien DM',
      'EKG 12 sadapan dalam 10 menit pertama: elevasi ST (STEMI) atau depresi ST/inversi T (NSTEMI); troponin jantung meningkat',
    ],
    tatalaksana: [
      'Terapi awal: oksigen bila saturasi rendah, aspirin kunyah 160-320 mg, nitrat sublingual, morfin bila nyeri persisten, antiplatelet kedua dan antikoagulan',
      'STEMI: reperfusi segera — IKP primer dalam 120 menit bila tersedia, atau fibrinolitik dalam 30 menit bila IKP tidak terjangkau',
      'NSTEMI: stratifikasi risiko dan strategi invasif sesuai risiko; lanjutkan terapi antiiskemik dan statin dosis tinggi',
    ],
    referensi: ['SKDI2012', 'ESCACS2023', 'BRAUNWALD2022'],
  },
  'Gagal jantung akut': {
    definisi: 'Onset atau perburukan cepat gejala dan tanda gagal jantung yang memerlukan terapi segera.',
    diagnosis: ['Sesak berat/ortopnea, ronki basah, peningkatan JVP, edema; rontgen menunjukkan kongesti paru, BNP/NT-proBNP meningkat, ekokardiografi menilai fungsi ventrikel'],
    tatalaksana: ['Posisi duduk dan oksigen/ventilasi non-invasif, diuretik loop IV, vasodilator bila tekanan darah memadai, inotropik/vasopresor bila hipoperfusi; identifikasi dan atasi pencetus (iskemia, aritmia, infeksi, ketidakpatuhan obat)'],
    referensi: ['SKDI2012', 'PERKIHF2020', 'BRAUNWALD2022'],
  },
  'Gagal jantung kronik': {
    definisi: 'Sindrom klinis akibat kelainan struktur/fungsi jantung yang menurunkan curah jantung atau meningkatkan tekanan pengisian.',
    diagnosis: ['Sesak saat aktivitas, ortopnea, paroxysmal nocturnal dyspnea, edema tungkai, JVP meningkat; ekokardiografi mengklasifikasikan HFrEF (EF ≤40%) dan HFpEF (EF ≥50%)'],
    tatalaksana: [
      'HFrEF — empat pilar terapi: ACE-inhibitor/ARB/ARNI, beta-blocker, antagonis reseptor mineralokortikoid, dan SGLT2 inhibitor; diuretik untuk kontrol gejala kongesti',
      'Edukasi restriksi garam dan cairan, pemantauan berat badan harian, rehabilitasi jantung, vaksinasi',
    ],
    referensi: ['SKDI2012', 'PERKIHF2020', 'BRAUNWALD2022'],
  },
  'Takikardi: supraventrikular, ventrikular': {
    definisi: 'Aritmia dengan laju >100x/menit; supraventrikular berasal dari atas berkas His (QRS umumnya sempit), ventrikular dari ventrikel (QRS lebar).',
    diagnosis: ['EKG membedakan: SVT (QRS sempit, reguler, laju 150-250), VT (QRS lebar >120 ms, dapat disertai disosiasi AV); nilai stabilitas hemodinamik segera'],
    tatalaksana: [
      'Tidak stabil (hipotensi, nyeri dada iskemik, gagal jantung akut, penurunan kesadaran): kardioversi tersinkronisasi segera',
      'SVT stabil: manuver vagal, lalu adenosin IV bolus cepat; VT stabil: antiaritmia IV (amiodaron) dengan persiapan kardioversi',
    ],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Fibrilasi atrial': {
    definisi: 'Aritmia supraventrikular dengan aktivasi atrium tidak terkoordinasi sehingga kontraksi atrium tidak efektif; aritmia menetap tersering.',
    diagnosis: ['Palpitasi, sesak, lemas; EKG menunjukkan irama ireguler tanpa gelombang P yang jelas; nilai laju ventrikel dan cari penyebab (hipertiroid, penyakit katup, hipertensi)'],
    tatalaksana: [
      'Kontrol laju (beta-blocker/calcium channel blocker non-dihidropiridin) atau kontrol irama sesuai kondisi pasien',
      'Antikoagulasi berdasarkan skor CHA2DS2-VASc dengan mempertimbangkan risiko perdarahan (HAS-BLED) — pencegahan stroke adalah prioritas utama',
      'Kardioversi segera bila hemodinamik tidak stabil',
    ],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Fibrilasi ventrikular': {
    definisi: 'Aktivitas listrik ventrikel yang kacau tanpa kontraksi efektif — menyebabkan henti jantung, fatal bila tidak ditangani dalam menit.',
    diagnosis: ['Pasien tidak sadar, tidak bernapas normal, nadi tidak teraba; monitor menunjukkan gelombang ireguler kacau tanpa kompleks QRS terorganisasi'],
    tatalaksana: ['Defibrilasi (unsynchronized shock) SEGERA sebagai prioritas, RJP berkualitas tinggi dengan interupsi minimal, epinefrin tiap 3-5 menit, amiodaron setelah syok ketiga, cari dan atasi penyebab reversibel (5H-5T)'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Atrial flutter': {
    definisi: 'Takiaritmia atrium akibat sirkuit re-entry, umumnya di atrium kanan, dengan laju atrium sekitar 250-350x/menit.',
    diagnosis: ['EKG menunjukkan gelombang flutter "gigi gergaji" (sawtooth) terutama di sadapan inferior, dengan konduksi blok tetap (sering 2:1 sehingga laju ventrikel ~150)'],
    tatalaksana: ['Prinsip serupa fibrilasi atrium: kontrol laju, antikoagulasi berdasarkan risiko tromboemboli, kardioversi bila tidak stabil; ablasi kateter sangat efektif untuk flutter tipikal'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Ekstrasistol supraventrikular, ventrikular': {
    definisi: 'Denyut prematur yang berasal dari atrium (SVES/PAC) atau ventrikel (VES/PVC), sering ditemukan pada jantung normal.',
    diagnosis: ['Sensasi denyut "terlewat" atau berdebar; EKG menunjukkan kompleks prematur — QRS sempit (supraventrikular) atau lebar dengan pause kompensasi (ventrikular)'],
    tatalaksana: ['Umumnya jinak: reassurance, kurangi kafein/alkohol/stres, koreksi gangguan elektrolit; beta-blocker bila sangat simtomatik; evaluasi lebih lanjut bila sangat sering atau ada penyakit jantung struktural'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Bundle Branch Block': {
    definisi: 'Gangguan konduksi pada berkas cabang kanan (RBBB) atau kiri (LBBB) sehingga aktivasi ventrikel tidak sinkron.',
    diagnosis: ['EKG: QRS ≥120 ms; RBBB pola rSR\' di V1 dengan S lebar di V6; LBBB QRS lebar bertakik di V5-V6 tanpa gelombang Q septal — LBBB baru dengan nyeri dada dianggap setara STEMI'],
    tatalaksana: ['Tidak perlu terapi khusus bila asimtomatik dan tanpa penyakit struktural; evaluasi penyakit jantung dasar; pacu jantung bila disertai blok AV derajat tinggi atau gejala bradikardia'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Aritmia lainnya': {
    definisi: 'Kelainan irama jantung selain yang tersebut spesifik, mencakup bradiaritmia, blok AV, sindrom sick sinus, dan aritmia kanal ion.',
    diagnosis: ['Palpitasi, pusing, sinkop, atau asimtomatik; EKG 12 sadapan, Holter monitoring untuk aritmia intermiten, studi elektrofisiologi pada kasus tertentu'],
    tatalaksana: ['Atasi pemicu (elektrolit, obat, iskemia, hipertiroid); pacu jantung permanen pada bradiaritmia simtomatik, antiaritmia atau ablasi sesuai jenis takiaritmia'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Kardiomiopati': {
    definisi: 'Penyakit otot jantung primer, tipe utama: dilatasi, hipertrofik, dan restriktif.',
    diagnosis: ['Gejala gagal jantung, aritmia, atau sinkop; ekokardiografi menentukan tipe (dilatasi ruang dengan EF turun, hipertrofi septum asimetris, atau gangguan pengisian restriktif); MRI jantung untuk karakterisasi lanjut'],
    tatalaksana: ['Dilatasi: terapi gagal jantung standar; Hipertrofik: beta-blocker, hindari dehidrasi dan olahraga kompetitif intens, evaluasi risiko kematian mendadak untuk ICD; Restriktif: atasi penyebab dasar (amiloidosis, hemokromatosis)'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PERKIHF2020'],
  },
  'Kor pulmonale akut': {
    definisi: 'Dilatasi dan gagal ventrikel kanan akut akibat peningkatan mendadak tekanan arteri pulmonalis, tersering karena emboli paru masif.',
    diagnosis: ['Sesak mendadak, hipotensi, JVP meningkat, EKG dapat menunjukkan pola S1Q3T3 dan RBBB baru; ekokardiografi menunjukkan dilatasi dan disfungsi ventrikel kanan'],
    tatalaksana: ['Atasi penyebab segera (trombolisis/antikoagulasi pada emboli paru masif), dukungan hemodinamik hati-hati (cairan berlebih dapat memperburuk), oksigen'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'MURRAY2022'],
  },
  'Kor pulmonale kronik': {
    definisi: 'Hipertrofi dan/atau dilatasi ventrikel kanan akibat penyakit paru kronik dengan hipertensi pulmonal, tersering pada PPOK lanjut.',
    diagnosis: ['Sesak kronik, edema tungkai, JVP meningkat, hepatomegali, P pulmonal pada EKG; ekokardiografi memperkirakan tekanan arteri pulmonalis'],
    tatalaksana: ['Optimalkan terapi penyakit paru dasar, oksigen jangka panjang bila hipoksemia kronik (memperbaiki survival), diuretik hati-hati untuk kongesti, hindari terapi berlebihan yang menurunkan preload ventrikel kanan'],
    referensi: ['SKDI2012', 'GOLD2024', 'BRAUNWALD2022'],
  },
  'Hipertensi esensial': {
    definisi: 'Peningkatan tekanan darah persisten tanpa penyebab sekunder yang teridentifikasi (>90% kasus hipertensi).',
    diagnosis: ['TD ≥140/90 mmHg pada pengukuran berulang dengan teknik benar; konfirmasi dengan pengukuran di rumah/ABPM; evaluasi kerusakan organ target (jantung, ginjal, mata) dan risiko kardiovaskular total'],
    tatalaksana: [
      'Modifikasi gaya hidup: restriksi garam <5 g/hari, penurunan BB, aktivitas fisik, batasi alkohol, berhenti merokok',
      'Farmakoterapi: ACE-inhibitor/ARB, calcium channel blocker, atau diuretik tiazid; kombinasi dosis rendah lebih dianjurkan daripada monoterapi dosis maksimal',
      'Target umumnya <140/90 mmHg, lebih ketat pada pasien tertentu sesuai toleransi',
    ],
    referensi: ['SKDI2012', 'PERKIHT2021', 'BRAUNWALD2022'],
  },
  'Hipertensi sekunder': {
    definisi: 'Hipertensi dengan penyebab spesifik yang dapat diidentifikasi dan berpotensi dikoreksi.',
    diagnosis: ['Curigai bila onset usia <30 atau >55 tahun, hipertensi resisten, perburukan mendadak, atau ada petunjuk klinis; cari penyebab: penyakit ginjal, stenosis arteri renalis (bruit abdomen), hiperaldosteronisme (hipokalemia), feokromositoma (trias sakit kepala-palpitasi-berkeringat), koarktasio aorta, sleep apnea'],
    tatalaksana: ['Tatalaksana penyebab dasar (revaskularisasi, adrenalektomi, CPAP), sambil kontrol tekanan darah dengan antihipertensi yang sesuai mekanisme'],
    referensi: ['SKDI2012', 'PERKIHT2021', 'BRAUNWALD2022'],
  },
  'Hipertensi pulmoner': {
    definisi: 'Peningkatan tekanan arteri pulmonalis rata-rata, dapat idiopatik atau sekunder terhadap penyakit jantung kiri, paru, atau tromboemboli kronik.',
    diagnosis: ['Sesak progresif tanpa sebab jelas, lelah, sinkop saat aktivitas; ekokardiografi sebagai skrining, kateterisasi jantung kanan sebagai baku emas'],
    tatalaksana: ['Atasi penyakit dasar; pada hipertensi arteri pulmonalis: terapi spesifik vasodilator pulmonal (antagonis reseptor endotelin, inhibitor PDE-5, analog prostasiklin), antikoagulasi selektif, oksigen — rujuk pusat rujukan'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'MURRAY2022'],
  },
  'Penyakit Raynaud': {
    definisi: 'Vasospasme arteri digital episodik yang dipicu dingin atau stres emosional, menyebabkan perubahan warna jari berurutan.',
    diagnosis: ['Perubahan warna trifasik: pucat (iskemia) → sianosis → kemerahan (reperfusi), disertai rasa baal dan nyeri; bedakan primer (jinak) dari sekunder (terkait skleroderma/SLE — periksa ANA dan kapilaroskopi)'],
    tatalaksana: ['Hindari dingin dan gunakan sarung tangan, berhenti merokok, hindari obat vasokonstriktor; calcium channel blocker (nifedipin) bila serangan sering/berat; tatalaksana penyakit autoimun dasar bila sekunder'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Trombosis arteri': {
    definisi: 'Pembentukan trombus dalam arteri yang menyebabkan iskemia akut pada jaringan distal.',
    diagnosis: ['Iskemia tungkai akut dengan 6P: Pain, Pallor, Pulselessness, Paresthesia, Paralysis, Poikilothermia; Doppler dan angiografi menentukan lokasi oklusi'],
    tatalaksana: ['Antikoagulasi (heparin) segera, revaskularisasi darurat (trombektomi/trombolisis kateter/bypass) — iskemia tungkai akut adalah kegawatdaruratan dengan jendela waktu terbatas untuk menyelamatkan ekstremitas'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Koarktasio aorta': {
    definisi: 'Penyempitan kongenital aorta, umumnya distal terhadap arteri subklavia kiri.',
    diagnosis: ['Hipertensi pada ekstremitas atas dengan tekanan darah lebih rendah dan nadi femoral melemah/terlambat (radiofemoral delay); rontgen dapat menunjukkan rib notching; ekokardiografi/CT angiografi konfirmatif'],
    tatalaksana: ['Koreksi bedah atau intervensi kateter (balloon angioplasty/stent), kontrol hipertensi, pemantauan jangka panjang (rekoarktasio, aneurisma, hipertensi menetap)'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  "Penyakit Buerger's (Thromboangiitis Obliterans)": {
    definisi: 'Vaskulitis oklusif non-aterosklerotik pada arteri dan vena kecil-sedang ekstremitas, sangat erat kaitannya dengan merokok.',
    diagnosis: ['Laki-laki muda perokok berat dengan klaudikasio distal, nyeri istirahat, ulkus/gangren jari, dapat disertai tromboflebitis migrans dan fenomena Raynaud; angiografi menunjukkan gambaran corkscrew collateral'],
    tatalaksana: ['BERHENTI MEROKOK TOTAL adalah satu-satunya terapi yang terbukti mengubah perjalanan penyakit, perawatan luka, analgesia, vasodilator/iloprost pada iskemia berat, amputasi bila gangren luas'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Emboli arteri': {
    definisi: 'Oklusi arteri oleh material embolus yang berasal dari tempat lain, tersering dari jantung (fibrilasi atrium, trombus mural pasca infark).',
    diagnosis: ['Iskemia akut mendadak pada ekstremitas/organ dengan batas jelas, pada pasien dengan sumber emboli (fibrilasi atrium, penyakit katup); bedakan dari trombosis in situ yang biasanya pada pasien dengan riwayat klaudikasio kronik'],
    tatalaksana: ['Heparinisasi segera, embolektomi darurat (kateter Fogarty) atau trombolisis, kemudian antikoagulasi jangka panjang untuk mencegah rekurensi dan tatalaksana sumber emboli'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Aterosklerosis': {
    definisi: 'Penumpukan plak lipid dan fibrosis pada dinding arteri, dasar patologi penyakit jantung koroner, stroke, dan penyakit arteri perifer.',
    diagnosis: ['Umumnya asimtomatik hingga stenosis bermakna; nilai faktor risiko (merokok, hipertensi, dislipidemia, DM, riwayat keluarga) dan skrining organ target'],
    tatalaksana: ['Modifikasi faktor risiko agresif: berhenti merokok, statin, kontrol tekanan darah dan gula darah, aktivitas fisik, diet sehat; antiplatelet pada pencegahan sekunder'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PERKIHT2021'],
  },
  'Subclavian steal syndrome': {
    definisi: 'Stenosis arteri subklavia proksimal menyebabkan aliran balik dari arteri vertebralis untuk memasok lengan, sehingga "mencuri" aliran serebral.',
    diagnosis: ['Gejala vertebrobasilar (pusing, sinkop, gangguan penglihatan) yang dipicu penggunaan lengan, perbedaan tekanan darah antar lengan >15-20 mmHg; Doppler menunjukkan aliran vertebralis terbalik'],
    tatalaksana: ['Modifikasi faktor risiko aterosklerosis dan antiplatelet; revaskularisasi (stenting/bypass) bila gejala neurologis atau iskemia lengan bermakna'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Aneurisma Aorta': {
    definisi: 'Dilatasi permanen aorta melebihi 1,5 kali diameter normal, berisiko ruptur yang fatal.',
    diagnosis: ['Sering asimtomatik dan ditemukan insidental; massa abdomen berdenyut pada aneurisma aorta abdominalis; USG/CT menentukan diameter dan perluasan; ruptur ditandai nyeri hebat mendadak dan syok'],
    tatalaksana: ['Surveilans pencitraan berkala dan kontrol tekanan darah serta berhenti merokok bila kecil; perbaikan elektif (EVAR atau bedah terbuka) bila diameter mencapai ambang atau tumbuh cepat; ruptur adalah kegawatdaruratan bedah'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Aneurisma diseksi': {
    definisi: 'Diseksi aorta — robekan tunika intima menyebabkan darah masuk ke dinding aorta dan memisahkan lapisannya; kegawatdaruratan dengan mortalitas tinggi.',
    diagnosis: ['Nyeri dada/punggung mendadak sangat hebat, sering digambarkan menyayat (tearing), perbedaan tekanan darah/nadi antar ekstremitas; CT angiografi sebagai modalitas konfirmasi utama; klasifikasi Stanford A (aorta asendens) dan B'],
    tatalaksana: ['Kontrol tekanan darah dan denyut jantung agresif (beta-blocker IV dahulu, baru vasodilator) untuk menurunkan tegangan dinding aorta; Stanford A memerlukan bedah darurat, Stanford B umumnya terapi medis kecuali ada komplikasi'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Klaudikasio': {
    definisi: 'Nyeri otot tungkai yang timbul saat aktivitas dan mereda dengan istirahat, akibat penyakit arteri perifer.',
    diagnosis: ['Nyeri betis/paha saat berjalan sejauh jarak tertentu dan hilang dengan istirahat, nadi distal melemah, kulit atrofi dan rambut rontok; ankle-brachial index (ABI) <0,9 menegakkan diagnosis'],
    tatalaksana: ['Program latihan berjalan terstruktur (terapi paling efektif untuk jarak tempuh), berhenti merokok, statin dan antiplatelet, cilostazol pada kasus terpilih; revaskularisasi bila mengganggu berat atau iskemia kritis'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Penyakit jantung reumatik': {
    definisi: 'Kerusakan katup jantung permanen sebagai sekuele demam reumatik akut pasca infeksi Streptococcus grup A; katup mitral tersering terkena.',
    diagnosis: ['Riwayat demam reumatik, murmur jantung (stenosis/regurgitasi mitral), gejala gagal jantung atau fibrilasi atrium; ekokardiografi menilai katup dan derajat keparahan'],
    tatalaksana: ['Profilaksis penisilin jangka panjang untuk mencegah serangan berulang, terapi gagal jantung dan aritmia, antikoagulasi bila fibrilasi atrium, intervensi katup (valvuloplasti/penggantian) bila berat'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Tromboflebitis': {
    definisi: 'Inflamasi vena superfisial disertai pembentukan trombus.',
    diagnosis: ['Vena superfisial teraba keras seperti tali, nyeri, kemerahan dan hangat sepanjang jalurnya; USG Doppler menyingkirkan perluasan ke vena dalam'],
    tatalaksana: ['Kompres hangat, NSAID, elevasi dan kompresi, mobilisasi tetap dianjurkan; antikoagulasi bila trombus meluas mendekati sistem vena dalam'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'BRAUNWALD2022'],
  },
  'Limfangitis': {
    definisi: 'Inflamasi saluran limfe akibat infeksi, umumnya bakteri Streptococcus dari luka di distal.',
    diagnosis: ['Garis merah memanjang dari fokus infeksi menuju kelenjar getah bening regional, nyeri, demam, limfadenopati regional'],
    tatalaksana: ['Antibiotik sistemik yang mencakup Streptococcus (penisilin/sefalosporin), elevasi ekstremitas, perawatan luka sumber infeksi, kompres hangat'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Varises (primer, sekunder)': {
    definisi: 'Dilatasi dan pemanjangan vena superfisial akibat inkompetensi katup vena; primer bila idiopatik, sekunder bila akibat obstruksi/refluks vena dalam.',
    diagnosis: ['Vena superfisial berkelok dan menonjol, rasa berat dan pegal pada tungkai yang memberat saat berdiri lama; USG Doppler menilai refluks dan patensi vena dalam'],
    tatalaksana: ['Stoking kompresi, elevasi tungkai, hindari berdiri lama, penurunan BB; intervensi (ablasi endovena, skleroterapi, stripping) bila simtomatik berat atau ada komplikasi kulit'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PPKFKTP2014'],
  },
  'Obstructed venous return': {
    definisi: 'Hambatan aliran balik vena, dapat akibat trombosis, kompresi eksternal (tumor, kehamilan), atau sindrom vena kava superior.',
    diagnosis: ['Edema, distensi vena kolateral, perubahan warna kulit pada area drainase terhambat; sindrom vena kava superior: pembengkakan wajah dan lengan, distensi vena leher, dispnea; CT/venografi menentukan lokasi'],
    tatalaksana: ['Atasi penyebab (antikoagulasi bila trombosis, terapi tumor/radioterapi pada kompresi maligna, stenting vena pada kasus terpilih), elevasi dan kompresi untuk gejala'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },
  'Trombosis vena dalam': {
    definisi: 'Pembentukan trombus pada vena dalam, umumnya tungkai, dengan risiko utama emboli paru.',
    diagnosis: ['Bengkak unilateral, nyeri, hangat, kemerahan pada tungkai; skor Wells untuk probabilitas, D-dimer untuk menyingkirkan pada risiko rendah, USG Doppler kompresi sebagai konfirmasi'],
    tatalaksana: ['Antikoagulasi (LMWH/antikoagulan oral langsung) minimal 3 bulan, durasi lebih panjang bila faktor risiko menetap; mobilisasi dan stoking kompresi; filter vena kava hanya bila antikoagulasi kontraindikasi'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PAPDI2014'],
  },
  'Emboli vena': {
    definisi: 'Lepasnya trombus vena yang terbawa aliran darah, umumnya bermanifestasi sebagai emboli paru.',
    diagnosis: ['Sesak mendadak, nyeri dada pleuritik, takikardia pada pasien dengan faktor risiko/trombosis vena dalam; CT angiografi paru sebagai baku emas'],
    tatalaksana: ['Antikoagulasi segera, trombolisis bila emboli masif dengan instabilitas hemodinamik, dukungan oksigen dan hemodinamik, pencegahan sekunder jangka panjang'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'MURRAY2022'],
  },
  'Limfedema (primer, sekunder)': {
    definisi: 'Pembengkakan jaringan akibat gangguan drainase limfe; primer bila kelainan perkembangan sistem limfe, sekunder bila akibat obstruksi (filariasis, pasca diseksi kelenjar, radioterapi, keganasan).',
    diagnosis: ['Edema non-pitting kronik yang progresif, kulit menebal, tanda Stemmer positif (kulit dasar jari kaki tidak dapat dicubit); bedakan dari edema vena/jantung'],
    tatalaksana: ['Terapi dekongestif kompleks: perawatan kulit ketat (cegah selulitis), drainase limfatik manual, bandaging/stoking kompresi, latihan; tatalaksana penyebab (DEC pada filariasis); diuretik tidak efektif'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PPKFKTP2014'],
  },
  'Insufisiensi vena kronik': {
    definisi: 'Gangguan aliran balik vena kronik akibat inkompetensi katup dan/atau obstruksi, menyebabkan hipertensi vena dan perubahan kulit.',
    diagnosis: ['Edema tungkai yang memberat sore hari, hiperpigmentasi hemosiderin, lipodermatosklerosis, varises, hingga ulkus vena di area maleolus medial; USG Doppler menilai refluks'],
    tatalaksana: ['Kompresi sebagai terapi utama, elevasi tungkai, latihan otot betis, perawatan kulit; intervensi vena pada refluks superfisial signifikan; pastikan ABI normal sebelum memberikan kompresi'],
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'PPKFKTP2014'],
  },

  // ─── Psikiatri ───────────────────────────────────────────────────────────
  'Intoksikasi akut zat psikoaktif': {
    definisi: 'Kondisi akut akibat konsumsi zat psikoaktif dalam dosis yang menimbulkan gangguan kesadaran, kognisi, persepsi, afek, atau perilaku.',
    diagnosis: ['Riwayat penggunaan zat, gejala sesuai jenis: opioid (pupil pinpoint, depresi napas, kesadaran menurun), stimulan (pupil midriasis, agitasi, hipertensi, takikardia), alkohol (bicara cadel, ataksia); skrining toksikologi urin bila tersedia'],
    tatalaksana: ['Amankan ABC, monitor tanda vital dan kesadaran; nalokson pada intoksikasi opioid dengan depresi napas, tatalaksana suportif dan lingkungan tenang pada stimulan, tiamin sebelum glukosa pada intoksikasi alkohol; rujuk untuk rehabilitasi setelah fase akut'],
    referensi: ['SKDI2012', 'WHOMHGAP2016', 'KAPLAN2015'],
  },
  'Adiksi/ketergantungan Narkoba': {
    definisi: 'Pola penggunaan zat berulang yang menimbulkan toleransi, gejala putus zat, dan dorongan kuat (craving) hingga mengabaikan fungsi sosial dan pekerjaan.',
    diagnosis: ['Kriteria ketergantungan: craving kuat, kesulitan mengendalikan penggunaan, gejala putus zat, toleransi meningkat, mengabaikan aktivitas lain, penggunaan berlanjut meski ada kerugian nyata'],
    tatalaksana: ['Tatalaksana gejala putus zat (detoksifikasi terkontrol), terapi substitusi pada ketergantungan opioid (metadon/buprenorfin), psikoterapi dan terapi perilaku, dukungan keluarga dan kelompok, rujuk ke pusat rehabilitasi — pendekatan tanpa stigma meningkatkan retensi terapi'],
    referensi: ['SKDI2012', 'WHOMHGAP2016', 'KAPLAN2015'],
  },
  'Gangguan bipolar, episode manik': {
    definisi: 'Gangguan suasana perasaan dengan episode manik (mood meningkat/iritabel, energi berlebih) yang bergantian dengan episode depresi.',
    diagnosis: ['Episode manik: mood elasi/iritabel ≥1 minggu disertai peningkatan aktivitas, berkurangnya kebutuhan tidur, bicara cepat, flight of ideas, grandiositas, perilaku berisiko; dapat disertai gejala psikotik'],
    tatalaksana: ['Mood stabilizer (litium/asam valproat) sebagai terapi utama, antipsikotik untuk agitasi dan gejala psikotik akut, hindari antidepresan tunggal (risiko memicu mania), rawat inap bila risiko bahaya diri/orang lain, pemantauan kadar litium dan fungsi tiroid-ginjal'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan siklotimia': {
    definisi: 'Instabilitas suasana perasaan menetap dengan periode hipomania ringan dan depresi ringan yang tidak memenuhi kriteria bipolar penuh.',
    diagnosis: ['Fluktuasi mood kronik ≥2 tahun tanpa periode bebas gejala yang panjang, derajat gejala lebih ringan dari episode manik/depresi mayor'],
    tatalaksana: ['Psikoedukasi dan pemantauan mood, mood stabilizer bila mengganggu fungsi, psikoterapi; waspadai perkembangan ke gangguan bipolar penuh'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan distimia (depresi neurosis)': {
    definisi: 'Depresi kronik derajat ringan-sedang yang berlangsung lama (≥2 tahun) tanpa memenuhi kriteria episode depresi mayor.',
    diagnosis: ['Mood depresi hampir sepanjang hari lebih banyak hari daripada tidak, ≥2 tahun, disertai gangguan nafsu makan/tidur, energi rendah, harga diri rendah, sulit konsentrasi, rasa putus asa'],
    tatalaksana: ['Psikoterapi (CBT) dan/atau antidepresan (SSRI), aktivasi perilaku dan olahraga teratur, evaluasi berkala risiko bunuh diri'],
    referensi: ['SKDI2012', 'PPDGJIII', 'WHOMHGAP2016'],
  },
  'Agorafobia dengan/tanpa panik': {
    definisi: 'Ketakutan berada di tempat atau situasi yang sulit meloloskan diri atau sulit mendapat pertolongan bila terjadi serangan panik.',
    diagnosis: ['Cemas berat pada situasi seperti keramaian, transportasi umum, ruang terbuka/tertutup, hingga menghindari situasi tersebut; dapat disertai serangan panik'],
    tatalaksana: ['CBT dengan terapi paparan bertahap sebagai terapi utama, SSRI bila berat, latihan relaksasi dan pernapasan; hindari benzodiazepin jangka panjang'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Fobia sosial': {
    definisi: 'Ketakutan menetap dan berlebihan terhadap situasi sosial atau situasi di mana individu merasa dinilai orang lain.',
    diagnosis: ['Cemas berat saat berbicara di depan umum, bertemu orang baru, atau makan di depan orang; disertai gejala otonom (wajah memerah, gemetar, berkeringat) dan perilaku menghindar yang mengganggu fungsi'],
    tatalaksana: ['CBT dengan paparan bertahap dan latihan keterampilan sosial, SSRI bila gejala berat/menetap, beta-blocker situasional untuk gejala otonom pada performance anxiety'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Fobia spesifik': {
    definisi: 'Ketakutan irasional dan berlebihan terhadap objek atau situasi tertentu (ketinggian, hewan, darah, jarum suntik).',
    diagnosis: ['Cemas segera muncul saat terpapar stimulus spesifik, dihindari secara aktif, individu menyadari ketakutannya berlebihan, mengganggu aktivitas sehari-hari'],
    tatalaksana: ['Terapi paparan bertahap (desensitisasi sistematis) sebagai terapi paling efektif; farmakoterapi jarang diperlukan; teknik applied tension khusus untuk fobia darah/jarum yang disertai sinkop vasovagal'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan obsesif-kompulsif': {
    definisi: 'Gangguan dengan pikiran obsesif berulang yang mengganggu dan/atau perilaku kompulsif berulang yang dilakukan untuk meredakan kecemasan.',
    diagnosis: ['Obsesi (pikiran/dorongan berulang, tidak diinginkan, menimbulkan cemas) dan/atau kompulsi (perilaku repetitif seperti mencuci, mengecek, menghitung); menyita waktu >1 jam/hari atau mengganggu fungsi'],
    tatalaksana: ['CBT dengan Exposure and Response Prevention (ERP) sebagai terapi lini pertama, SSRI dosis lebih tinggi dan durasi lebih lama dibanding depresi, kombinasi keduanya pada kasus berat'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Reaksi terhadap stres yg berat, & gangguan penyesuaian': {
    definisi: 'Respons maladaptif terhadap stresor psikososial yang jelas, mencakup reaksi stres akut dan gangguan penyesuaian.',
    diagnosis: ['Gejala emosional/perilaku muncul dalam kaitan waktu jelas dengan stresor (umumnya dalam 1-3 bulan), derajat distres melebihi yang diperkirakan, mengganggu fungsi; reaksi stres akut muncul dalam menit-jam dan mereda dalam beberapa hari'],
    tatalaksana: ['Dukungan psikososial dan konseling sebagai terapi utama, teknik pemecahan masalah dan koping, farmakoterapi jangka pendek hanya bila gejala berat; sebagian besar membaik seiring adaptasi terhadap stresor'],
    referensi: ['SKDI2012', 'PPDGJIII', 'WHOMHGAP2016'],
  },
  'Post traumatic stress disorder': {
    definisi: 'Gangguan yang berkembang setelah mengalami/menyaksikan peristiwa traumatik berat, ditandai reexperiencing, avoidance, dan hyperarousal.',
    diagnosis: ['Gejala menetap >1 bulan pasca trauma: mimpi buruk dan kilas balik, menghindari pengingat trauma, perubahan negatif kognisi dan mood, kewaspadaan berlebih dan mudah terkejut'],
    tatalaksana: ['Psikoterapi berfokus trauma (trauma-focused CBT, EMDR) sebagai lini pertama, SSRI bila psikoterapi tidak tersedia/tidak adekuat, hindari benzodiazepin, dukungan sosial dan keamanan pasien'],
    referensi: ['SKDI2012', 'PPDGJIII', 'WHOMHGAP2016'],
  },
  'Gangguan disosiasi (konversi)': {
    definisi: 'Hilangnya integrasi normal antara memori, identitas, sensasi, dan kontrol gerakan tubuh, tanpa dasar kelainan organik yang menjelaskan.',
    diagnosis: ['Gejala neurologis (kelumpuhan, kejang non-epileptik, buta, afonia) atau gangguan memori/identitas yang tidak sesuai pola anatomis/fisiologis; sering didahului stresor psikologis; wajib menyingkirkan penyebab organik lebih dahulu'],
    tatalaksana: ['Jelaskan diagnosis dengan empatik tanpa menuduh pasien berpura-pura, psikoterapi dan fisioterapi bila ada gejala motorik, atasi stresor pemicu; hindari pemeriksaan berlebihan yang memperkuat gejala'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan somatoform': {
    definisi: 'Keluhan fisik berulang tanpa dasar kelainan organik yang memadai, disertai kekhawatiran berlebihan terhadap kesehatan.',
    diagnosis: ['Keluhan fisik multipel dan berulang ≥2 tahun, pemeriksaan berulang negatif, pasien menolak meyakini bahwa tidak ada kelainan fisik, mengganggu fungsi sosial dan pekerjaan'],
    tatalaksana: ['Bangun hubungan terapeutik dengan satu dokter tetap, jadwalkan kunjungan berkala terjadwal (bukan berdasarkan keluhan), batasi pemeriksaan penunjang yang tidak perlu, CBT, atasi komorbid depresi/cemas'],
    referensi: ['SKDI2012', 'PPDGJIII', 'PPKFKTP2014'],
  },
  'Gangguan kepribadian': {
    definisi: 'Pola perilaku, kognisi, dan pengalaman batin yang menetap, kaku, menyimpang dari norma budaya, dimulai sejak remaja dan menimbulkan hendaya.',
    diagnosis: ['Pola menetap dan pervasif lintas situasi, onset masa remaja/dewasa muda, menimbulkan distres atau hendaya; dikelompokkan cluster A (aneh), B (dramatis/emosional), C (cemas/takut)'],
    tatalaksana: ['Psikoterapi jangka panjang sebagai terapi utama (mis. dialectical behaviour therapy untuk kepribadian ambang), farmakoterapi hanya untuk gejala target/komorbid, konsistensi batasan terapeutik, rujuk psikiatri'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan identitas gender': {
    definisi: 'Ketidaksesuaian yang menetap antara identitas gender yang dialami seseorang dengan jenis kelamin yang ditetapkan saat lahir, disertai distres bermakna.',
    diagnosis: ['Ketidaksesuaian menetap ≥6 bulan disertai distres klinis bermakna atau hendaya fungsi; evaluasi oleh tenaga yang kompeten, singkirkan gangguan psikiatri lain sebagai penjelasan'],
    tatalaksana: ['Pendekatan afirmatif dan tanpa stigma, dukungan psikologis untuk distres dan komorbid (depresi, cemas, risiko bunuh diri lebih tinggi), rujuk ke layanan spesialistik untuk keputusan penanganan lanjutan'],
    referensi: ['SKDI2012', 'PPDGJIII', 'DSM5TR2022'],
  },
  'Gangguan preferensi seksual': {
    definisi: 'Pola dorongan atau perilaku seksual yang menyimpang dari norma dan menimbulkan distres pada individu atau kerugian pada orang lain.',
    diagnosis: ['Dorongan/fantasi/perilaku seksual berulang ≥6 bulan terhadap objek atau situasi atipik; menjadi gangguan bila menimbulkan distres pada diri sendiri atau melibatkan orang yang tidak menyetujui/tidak mampu menyetujui'],
    tatalaksana: ['Psikoterapi (CBT) untuk kontrol dorongan, terapi farmakologis penurun dorongan seksual pada kasus tertentu, rujuk psikiatri; laporan wajib bila melibatkan korban anak/tanpa persetujuan sesuai ketentuan hukum'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan perkembangan pervasif': {
    definisi: 'Kelompok gangguan neurodevelopmental (termasuk spektrum autisme) dengan hendaya interaksi sosial, komunikasi, dan pola perilaku repetitif.',
    diagnosis: ['Onset masa kanak awal: hendaya interaksi sosial timbal balik, gangguan komunikasi verbal-nonverbal, minat terbatas dan perilaku repetitif; skrining perkembangan (M-CHAT) dan asesmen komprehensif'],
    tatalaksana: ['Intervensi perilaku dan edukasi terstruktur sedini mungkin (terapi wicara, okupasi, ABA), dukungan keluarga, farmakoterapi hanya untuk gejala penyerta (agresi, hiperaktivitas), rujuk tim tumbuh kembang'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Retardasi mental': {
    definisi: 'Disabilitas intelektual — keterbatasan bermakna pada fungsi intelektual dan perilaku adaptif dengan onset masa perkembangan.',
    diagnosis: ['IQ di bawah rata-rata bermakna (biasanya <70) disertai defisit perilaku adaptif (konseptual, sosial, praktis), onset sebelum usia 18 tahun; klasifikasi ringan, sedang, berat, sangat berat'],
    tatalaksana: ['Program pendidikan khusus dan pelatihan keterampilan hidup, terapi okupasi dan wicara, dukungan keluarga, cari dan atasi penyebab yang dapat dikoreksi (hipotiroid kongenital, fenilketonuria), pencegahan melalui skrining neonatus'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Gangguan tingkah laku (conduct disorder)': {
    definisi: 'Pola perilaku berulang yang melanggar hak orang lain atau norma sosial pada anak dan remaja.',
    diagnosis: ['Agresi terhadap orang/hewan, perusakan properti, berbohong atau mencuri, pelanggaran aturan serius, berlangsung ≥12 bulan; bedakan dari gangguan menentang oposisional yang lebih ringan'],
    tatalaksana: ['Terapi perilaku dan parent management training sebagai lini pertama, intervensi berbasis sekolah dan keluarga, atasi komorbid (ADHD, depresi, penyalahgunaan zat), farmakoterapi hanya untuk komorbid'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Anoreksia nervosa': {
    definisi: 'Gangguan makan dengan restriksi asupan yang menyebabkan berat badan sangat rendah, disertai ketakutan intens naik berat badan dan gangguan persepsi tubuh.',
    diagnosis: ['Berat badan jauh di bawah normal untuk usia dan tinggi, ketakutan gemuk meski kurus, gangguan citra tubuh; komplikasi: amenore, bradikardia, hipotensi, gangguan elektrolit, osteoporosis'],
    tatalaksana: ['Pemulihan nutrisi bertahap dengan pemantauan ketat refeeding syndrome (fosfat, kalium, magnesium), psikoterapi (family-based therapy pada remaja, CBT), rawat inap bila instabilitas medis; tangani komplikasi medis sebagai prioritas'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Bulimia': {
    definisi: 'Gangguan makan dengan episode makan berlebihan berulang diikuti perilaku kompensasi (memuntahkan, laksatif, olahraga berlebihan).',
    diagnosis: ['Episode binge eating dengan rasa kehilangan kendali, diikuti perilaku kompensatorik, ≥1x/minggu selama 3 bulan; tanda fisik: erosi email gigi, tanda Russell di punggung tangan, pembesaran kelenjar parotis, hipokalemia'],
    tatalaksana: ['CBT untuk gangguan makan sebagai lini pertama, fluoxetine dosis tinggi sebagai farmakoterapi dengan bukti terbaik, koreksi gangguan elektrolit, edukasi pola makan teratur'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Pica': {
    definisi: 'Konsumsi berulang zat non-nutritif (tanah, kapur, es, rambut) selama minimal 1 bulan dan tidak sesuai tahap perkembangan.',
    diagnosis: ['Riwayat konsumsi bahan non-makanan menetap; skrining defisiensi besi dan zink, kadar timbal bila konsumsi cat/tanah, evaluasi disabilitas intelektual atau kehamilan sebagai konteks'],
    tatalaksana: ['Koreksi defisiensi nutrisi (terutama besi), terapi perilaku dan pengawasan lingkungan, atasi komplikasi (obstruksi, keracunan timbal, infeksi parasit)'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Gilles de la tourette syndrome': {
    definisi: 'Gangguan tic dengan kombinasi tic motorik multipel dan minimal satu tic vokal yang berlangsung lebih dari satu tahun.',
    diagnosis: ['Tic motorik multipel dan ≥1 tic vokal (tidak harus bersamaan), onset sebelum usia 18 tahun, berlangsung >1 tahun; sering komorbid dengan ADHD dan OCD'],
    tatalaksana: ['Psikoedukasi (banyak kasus ringan tidak perlu obat), Comprehensive Behavioral Intervention for Tics (CBIT), farmakoterapi (antipsikotik dosis rendah, klonidin) bila tic mengganggu, atasi komorbid'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Chronic motor of vocal tics disorder': {
    definisi: 'Gangguan tic kronik dengan tic motorik ATAU vokal (tidak keduanya) yang berlangsung lebih dari satu tahun.',
    diagnosis: ['Tic motorik saja atau tic vokal saja, menetap >1 tahun, onset sebelum usia 18 tahun, tidak pernah memenuhi kriteria Tourette'],
    tatalaksana: ['Psikoedukasi dan observasi bila ringan, terapi perilaku (CBIT), farmakoterapi hanya bila menimbulkan hendaya bermakna'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Transient tics disorder': {
    definisi: 'Tic motorik dan/atau vokal yang berlangsung kurang dari satu tahun, umum pada anak usia sekolah dan umumnya sembuh sendiri.',
    diagnosis: ['Tic tunggal atau multipel berlangsung <12 bulan sejak onset pertama, sering memberat saat stres atau lelah'],
    tatalaksana: ['Reassurance dan psikoedukasi kepada anak, orang tua, dan guru; kurangi stresor dan hindari menegur tic (memperberat); umumnya tidak perlu farmakoterapi'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Functional encoperasis': {
    definisi: 'Enkopresis fungsional — pengeluaran feses berulang di tempat tidak semestinya pada anak usia ≥4 tahun tanpa penyebab organik, umumnya akibat konstipasi kronik dengan overflow.',
    diagnosis: ['Kejadian ≥1x/bulan selama ≥3 bulan pada anak usia perkembangan ≥4 tahun; periksa massa feses (skibala) pada palpasi abdomen dan colok dubur; singkirkan penyebab organik (Hirschsprung, hipotiroid)'],
    tatalaksana: ['Disimpaksi awal lalu terapi rumatan laksatif (polietilen glikol) jangka panjang, toilet training terjadwal setelah makan, edukasi keluarga bahwa ini bukan kesengajaan anak, dukungan psikologis bila ada distres'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Functional enuresis': {
    definisi: 'Enuresis fungsional — berkemih berulang di tempat tidur atau pakaian pada anak usia ≥5 tahun tanpa penyebab organik.',
    diagnosis: ['Kejadian ≥2x/minggu selama ≥3 bulan pada anak usia ≥5 tahun; bedakan primer (belum pernah kering) dan sekunder (kambuh setelah periode kering); singkirkan ISK, DM, diabetes insipidus, konstipasi'],
    tatalaksana: ['Edukasi dan hindari hukuman, batasi cairan malam hari dan berkemih sebelum tidur, alarm enuresis sebagai terapi paling efektif jangka panjang, desmopressin untuk kebutuhan jangka pendek (mis. menginap)'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Uncoordinated speech': {
    definisi: 'Gangguan kelancaran bicara (termasuk gagap/stuttering dan cluttering) yang mengganggu komunikasi dan tidak sesuai usia.',
    diagnosis: ['Pengulangan suara/suku kata, perpanjangan bunyi, blok bicara, atau bicara terlalu cepat dan tidak teratur; nilai dampak pada komunikasi dan kepercayaan diri; singkirkan gangguan neurologis dan pendengaran'],
    tatalaksana: ['Terapi wicara sebagai terapi utama, edukasi keluarga dan guru untuk memberi waktu bicara tanpa menyela/mengoreksi, dukungan psikologis bila ada kecemasan sosial sekunder'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'PPKFKTP2014'],
  },
  'Parafilia': {
    definisi: 'Dorongan seksual intens dan berulang terhadap objek, situasi, atau individu atipik; menjadi gangguan bila menimbulkan distres atau melibatkan orang tanpa persetujuan.',
    diagnosis: ['Fantasi, dorongan, atau perilaku seksual berulang ≥6 bulan; bedakan minat parafilik (tidak merugikan) dari gangguan parafilik (menimbulkan distres atau korban)'],
    tatalaksana: ['CBT untuk kontrol dorongan dan pencegahan relaps, farmakoterapi penurun dorongan seksual pada kasus berisiko, rujuk psikiatri; kewajiban pelaporan bila ada korban sesuai ketentuan hukum'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Gangguan keinginan dan gairah seksual': {
    definisi: 'Penurunan atau hilangnya hasrat dan/atau gairah seksual yang menimbulkan distres pada individu atau pasangan.',
    diagnosis: ['Kurang/hilangnya minat seksual dan fantasi menetap ≥6 bulan disertai distres; evaluasi penyebab organik (hipogonadisme, hipotiroid, hiperprolaktinemia), obat (SSRI, antihipertensi), depresi, dan faktor relasi'],
    tatalaksana: ['Atasi penyebab organik dan tinjau ulang obat yang berkontribusi, konseling seksual dan terapi pasangan, tatalaksana depresi/cemas penyerta, terapi hormonal hanya bila ada defisiensi terbukti'],
    referensi: ['SKDI2012', 'PPDGJIII', 'KAPLAN2015'],
  },
  'Hipersomnia': {
    definisi: 'Rasa kantuk berlebihan pada siang hari atau durasi tidur berlebihan meski tidur malam cukup.',
    diagnosis: ['Kantuk berlebih hampir setiap hari ≥3 bulan; singkirkan penyebab sekunder: OSA, kurang tidur kronik, obat sedatif, depresi, hipotiroid; polisomnografi dan multiple sleep latency test bila curiga narkolepsi'],
    tatalaksana: ['Higiene tidur dan jadwal tidur teratur, atasi penyebab dasar (CPAP bila OSA), stimulan (modafinil) pada hipersomnia primer/narkolepsi setelah diagnosis tegak, hindari mengemudi saat mengantuk'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Sleep-wake cycle disturbance': {
    definisi: 'Gangguan irama sirkadian tidur-bangun akibat ketidaksesuaian antara jam biologis internal dan jadwal tidur yang dituntut lingkungan.',
    diagnosis: ['Pola tidur bergeser menetap (delayed/advanced sleep phase, kerja shift, jet lag) menyebabkan insomnia atau kantuk berlebih dan hendaya fungsi; sleep diary atau aktigrafi membantu'],
    tatalaksana: ['Higiene tidur, terapi cahaya terang pada waktu tepat untuk menggeser fase, melatonin terjadwal, penyesuaian jadwal kerja bila memungkinkan, hindari kafein dan layang menjelang tidur'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Nightmare': {
    definisi: 'Mimpi buruk berulang yang membangunkan penderita dengan ingatan jelas isi mimpi, umumnya pada fase tidur REM (paruh kedua malam).',
    diagnosis: ['Mimpi menakutkan berulang dengan bangun penuh kesadaran dan ingatan jelas; bedakan dari night terror (terjadi awal malam, tidak ingat kejadian, sulit dibangunkan); cari kaitan trauma atau obat'],
    tatalaksana: ['Higiene tidur dan reassurance (umumnya jinak pada anak), imagery rehearsal therapy bila berulang pada dewasa, tatalaksana PTSD bila terkait trauma, tinjau obat pemicu'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },
  'Sleep walking': {
    definisi: 'Somnambulisme — parasomnia berupa bangkit dan berjalan saat tidur gelombang lambat, umumnya pada sepertiga awal malam, tanpa ingatan kejadian.',
    diagnosis: ['Episode berjalan saat tidur dengan tatapan kosong, sulit dibangunkan, amnesia terhadap kejadian; umum pada anak dan biasanya menghilang seiring usia; pemicu: kurang tidur, demam, stres, alkohol'],
    tatalaksana: ['Utamakan keamanan lingkungan (kunci pintu/jendela, singkirkan benda berbahaya, hindari tempat tidur tingkat), tidur cukup dan teratur, jangan membangunkan paksa saat episode; farmakoterapi hanya bila sering dan berisiko cedera'],
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015'],
  },

  // ─── Saraf (Neurologi) ───────────────────────────────────────────────────
  'Spina bifida': {
    definisi: 'Defek penutupan tabung saraf sehingga arkus vertebra tidak menutup sempurna; spektrum dari spina bifida okulta hingga mielomeningokel.',
    diagnosis: ['Okulta: tanda kulit di garis tengah punggung (rambut, lesung, hemangioma) tanpa defisit; mielomeningokel: kantong berisi jaringan saraf, defisit motorik-sensorik tungkai, gangguan berkemih/defekasi; USG antenatal dan AFP maternal untuk deteksi dini'],
    tatalaksana: ['Penutupan bedah dini pada mielomeningokel (cegah infeksi dan kerusakan lanjut), shunt bila hidrosefalus menyertai, rehabilitasi dan manajemen kandung kemih neurogenik; pencegahan: asam folat prakonsepsi'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Fenilketonuria': {
    definisi: 'Kelainan metabolik genetik akibat defisiensi enzim fenilalanin hidroksilase sehingga fenilalanin menumpuk dan bersifat neurotoksik.',
    diagnosis: ['Skrining neonatus (kadar fenilalanin darah) — kunci karena bayi tampak normal saat lahir; bila tidak terdeteksi: keterlambatan perkembangan progresif, mikrosefali, kejang, bau apek pada urin'],
    tatalaksana: ['Diet rendah fenilalanin seumur hidup dimulai sedini mungkin (mencegah retardasi mental secara total bila dimulai neonatal), pemantauan kadar fenilalanin berkala, konseling genetik'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Duchene muscular dystrophy': {
    definisi: 'Distrofi otot terkait kromosom X akibat defisiensi distrofin, menyebabkan kelemahan otot progresif pada anak laki-laki.',
    diagnosis: ['Kelemahan otot proksimal progresif usia 3-5 tahun, Gowers sign positif, pseudohipertrofi betis, keterlambatan berjalan; kreatin kinase sangat tinggi, konfirmasi analisis genetik/biopsi otot'],
    tatalaksana: ['Kortikosteroid memperlambat progresi kelemahan, fisioterapi dan bracing untuk cegah kontraktur, pemantauan fungsi jantung dan paru (kardiomiopati dan gagal napas adalah penyebab kematian), konseling genetik'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Infeksi sitomegalovirus': {
    definisi: 'Infeksi virus CMV; penting sebagai infeksi kongenital (TORCH) dan infeksi oportunistik pada imunokompromais.',
    diagnosis: ['Kongenital: mikrosefali, kalsifikasi periventrikular, gangguan pendengaran sensorineural, hepatosplenomegali, petekie; imunokompromais: retinitis, kolitis, ensefalitis; PCR CMV dan serologi'],
    tatalaksana: ['Gansiklovir/valgansiklovir pada kongenital simtomatik dan kasus imunokompromais, pemantauan pendengaran dan perkembangan jangka panjang, optimalkan status imun (ARV pada HIV)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Tetanus neonatorum': {
    definisi: 'Tetanus pada neonatus akibat infeksi Clostridium tetani melalui tali pusat yang dirawat tidak steril, dengan mortalitas sangat tinggi.',
    diagnosis: ['Bayi usia 3-14 hari: mulanya tidak mau menyusu (trismus), lalu kaku seluruh tubuh, opistotonus, spasme dipicu rangsang; riwayat persalinan tidak bersih dan ibu tidak diimunisasi TT'],
    tatalaksana: ['Anti-tetanus serum/HTIG, metronidazol, kontrol spasme dengan diazepam, rawat di ruang tenang dan gelap dengan rangsang minimal, dukungan jalan napas dan nutrisi; pencegahan: imunisasi TT ibu hamil dan perawatan tali pusat bersih'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Toksoplasmosis serebral': {
    definisi: 'Infeksi oportunistik otak oleh Toxoplasma gondii, tersering pada pasien HIV dengan CD4 rendah (<100).',
    diagnosis: ['Nyeri kepala, defisit neurologis fokal, kejang, penurunan kesadaran pada pasien imunokompromais; CT/MRI menunjukkan lesi multipel dengan ring enhancement dan edema perilesi; serologi IgG toxoplasma positif mendukung'],
    tatalaksana: ['Pirimetamin + sulfadiazin + asam folinat (alternatif: kotrimoksazol dosis tinggi), kortikosteroid bila edema/efek massa berat, mulai/optimalkan ARV, profilaksis sekunder hingga CD4 pulih'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Abses otak': {
    definisi: 'Kumpulan pus terlokalisasi di dalam parenkim otak akibat infeksi, umumnya penyebaran dari sinusitis, otitis, endokarditis, atau trauma tembus.',
    diagnosis: ['Trias klasik (sering tidak lengkap): demam, nyeri kepala, defisit neurologis fokal; CT/MRI dengan kontras menunjukkan lesi dengan ring enhancement berdinding tipis dan edema luas'],
    tatalaksana: ['Antibiotik IV spektrum luas jangka panjang (4-8 minggu) disesuaikan kultur, aspirasi/drainase bedah pada abses besar atau untuk diagnosis, atasi sumber infeksi primer; hati-hati pungsi lumbal (risiko herniasi)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'HIV AIDS tanpa komplikasi': {
    definisi: 'Infeksi Human Immunodeficiency Virus yang menyerang limfosit CD4, tanpa infeksi oportunistik atau keganasan terkait saat ini.',
    diagnosis: ['Skrining dengan tiga rapid test berurutan sesuai algoritma nasional; nilai stadium klinis WHO dan kadar CD4 serta viral load sebagai baseline'],
    tatalaksana: ['ARV segera untuk semua ODHIV tanpa memandang CD4 (test and treat), kombinasi standar 2 NRTI + 1 NNRTI/INSTI, edukasi kepatuhan seumur hidup, profilaksis kotrimoksazol bila CD4 rendah, skrining TB dan IMS, pencegahan penularan'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'AIDS dengan komplikasi': {
    definisi: 'HIV stadium lanjut dengan infeksi oportunistik dan/atau keganasan terkait AIDS.',
    diagnosis: ['Stadium klinis WHO 3-4: TB, kandidiasis esofagus, pneumonia Pneumocystis, toksoplasmosis serebral, kriptokokosis, sarkoma Kaposi; CD4 umumnya sangat rendah'],
    tatalaksana: ['Tatalaksana infeksi oportunistik lebih dahulu, lalu mulai ARV dengan waktu sesuai jenis infeksi (waspada IRIS, terutama pada meningitis kriptokokus dan TB), profilaksis kotrimoksazol, dukungan nutrisi — rujuk layanan HIV'],
    referensi: ['SKDI2012', 'HARRISON2022', 'PNPKTB2020'],
  },
  'Hidrosefalus': {
    definisi: 'Penumpukan cairan serebrospinal berlebih di dalam ventrikel otak akibat gangguan produksi, aliran, atau absorpsi.',
    diagnosis: ['Bayi: lingkar kepala membesar cepat melewati garis persentil, ubun-ubun membonjol, sunset eyes, vena kulit kepala melebar; anak besar/dewasa: gejala tekanan intrakranial meningkat; USG kepala (bayi)/CT/MRI konfirmatif'],
    tatalaksana: ['Pemasangan shunt ventrikuloperitoneal atau endoscopic third ventriculostomy, atasi penyebab (tumor, infeksi, perdarahan), pemantauan komplikasi shunt (infeksi, sumbatan)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Poliomielitis': {
    definisi: 'Infeksi virus polio yang menyerang sel motor neuron kornu anterior medula spinalis, menyebabkan kelumpuhan flaksid asimetris.',
    diagnosis: ['Acute flaccid paralysis asimetris, tanpa gangguan sensorik, refleks menurun/hilang, demam mendahului kelumpuhan; wajib lapor sebagai kasus AFP dan ambil dua spesimen tinja untuk isolasi virus'],
    tatalaksana: ['Tidak ada terapi antivirus spesifik — suportif, fisioterapi untuk cegah kontraktur dan optimalkan fungsi, dukungan ventilasi bila otot napas terkena; pencegahan melalui imunisasi polio (OPV/IPV) dan surveilans AFP'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PPKFKTP2014'],
  },
  'Spondilitis TB': {
    definisi: 'Tuberkulosis tulang belakang (Pott disease), bentuk TB ekstraparu yang dapat menyebabkan destruksi vertebra dan paraplegia.',
    diagnosis: ['Nyeri punggung kronik progresif, gibbus (kifosis angular), demam dan penurunan BB, dapat disertai defisit neurologis (Pott paraplegia) dan abses dingin; MRI paling sensitif, konfirmasi bakteriologis via biopsi'],
    tatalaksana: ['OAT jangka panjang (umumnya 9-12 bulan), imobilisasi/bracing, dekompresi dan stabilisasi bedah bila defisit neurologis progresif, instabilitas, atau deformitas berat'],
    referensi: ['SKDI2012', 'PNPKTB2020', 'APLEY2018'],
  },
  'Tumor primer': {
    definisi: 'Neoplasma yang berasal dari jaringan sistem saraf pusat itu sendiri (glioma, meningioma, dll).',
    diagnosis: ['Nyeri kepala progresif memberat pagi hari, muntah proyektil, kejang onset baru pada dewasa, defisit neurologis fokal progresif, papiledema; MRI dengan kontras sebagai modalitas pilihan, histopatologi menentukan jenis dan grade'],
    tatalaksana: ['Reseksi bedah maksimal aman, radioterapi dan/atau kemoterapi sesuai jenis dan grade, kortikosteroid untuk edema peritumoral, antiepilepsi bila kejang — rujuk bedah saraf/onkologi'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Tumor sekunder': {
    definisi: 'Metastasis ke otak dari keganasan organ lain — lesi intrakranial ganas tersering pada dewasa.',
    diagnosis: ['Gejala serupa tumor primer, sering lesi multipel di perbatasan substansia grisea-alba; primer tersering: paru, payudara, melanoma, ginjal, kolorektal; MRI kontras dan pencarian tumor primer'],
    tatalaksana: ['Kortikosteroid untuk edema, radioterapi seluruh otak atau radiosurgery stereotaktik, reseksi pada lesi soliter yang aksesibel, terapi sistemik untuk keganasan primer — sering bersifat paliatif'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Mati batang otak': {
    definisi: 'Hilangnya seluruh fungsi batang otak secara ireversibel — secara hukum dan medis setara dengan kematian.',
    diagnosis: ['Prasyarat: penyebab diketahui dan ireversibel, singkirkan hipotermia, gangguan metabolik/elektrolit berat, intoksikasi obat sedatif; pemeriksaan: koma dalam, semua refleks batang otak hilang (pupil, kornea, okulosefalik, okulovestibular, muntah, batuk), tes apnea positif; diperiksa oleh tim dan diulang sesuai ketentuan'],
    tatalaksana: ['Bukan kondisi yang diterapi — penentuan mati batang otak menghentikan dukungan hidup yang sia-sia; komunikasikan dengan keluarga secara empatik, pertimbangkan donasi organ sesuai ketentuan hukum dan persetujuan keluarga'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Tension headache': {
    definisi: 'Nyeri kepala tipe tegang — nyeri kepala primer tersering, bilateral dengan kualitas menekan/mengikat.',
    diagnosis: ['Nyeri bilateral seperti diikat, intensitas ringan-sedang, tidak memberat dengan aktivitas fisik rutin, tanpa mual/muntah bermakna, dapat disertai fotofobia ATAU fonofobia (tidak keduanya)'],
    tatalaksana: ['Analgesik sederhana (parasetamol/NSAID) untuk serangan, hindari penggunaan berlebihan (risiko medication overuse headache), identifikasi dan kelola stres, perbaiki postur dan higiene tidur; amitriptilin sebagai profilaksis bila kronik'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014'],
  },
  'Migren': {
    definisi: 'Nyeri kepala primer berulang, umumnya unilateral dan berdenyut, sering disertai mual, fotofobia, dan fonofobia; dapat dengan atau tanpa aura.',
    diagnosis: ['Serangan 4-72 jam dengan ≥2 dari: unilateral, berdenyut, intensitas sedang-berat, memberat dengan aktivitas; disertai ≥1 dari: mual/muntah, atau fotofobia dan fonofobia; aura visual/sensorik reversibel bila migren dengan aura'],
    tatalaksana: ['Serangan akut: NSAID atau triptan sedini mungkin, antiemetik bila mual; hindari pemicu (kurang tidur, lapar, stres, makanan tertentu); profilaksis (propranolol, amitriptilin, topiramat) bila ≥4 serangan/bulan atau serangan berat'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014'],
  },
  'Arteritis kranial': {
    definisi: 'Giant cell arteritis — vaskulitis arteri sedang-besar terutama cabang arteri karotis eksterna, pada usia >50 tahun, berisiko kebutaan permanen.',
    diagnosis: ['Nyeri kepala temporal baru, nyeri rahang saat mengunyah (jaw claudication), arteri temporalis menebal dan nyeri tekan, gangguan penglihatan; LED dan CRP sangat tinggi, biopsi arteri temporalis konfirmatif'],
    tatalaksana: ['Kortikosteroid dosis tinggi SEGERA berdasarkan kecurigaan klinis (jangan menunggu biopsi — penundaan berisiko kebutaan ireversibel), biopsi tetap dilakukan dalam 1-2 minggu setelah steroid dimulai, tapering panjang dengan pemantauan'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Infark serebral': {
    definisi: 'Stroke iskemik — kematian jaringan otak akibat sumbatan aliran darah arteri serebral.',
    diagnosis: ['Defisit neurologis fokal onset mendadak (hemiparesis, afasia, hemianopia), tentukan waktu onset (last known well) secara akurat; CT kepala non-kontras segera untuk menyingkirkan perdarahan; skor NIHSS untuk derajat'],
    tatalaksana: ['Trombolisis IV (alteplase) bila dalam jendela 4,5 jam dan tanpa kontraindikasi, trombektomi mekanik untuk oklusi pembuluh besar dalam jendela yang lebih panjang; jangan turunkan tekanan darah agresif kecuali >220/120 atau akan ditrombolisis; aspirin setelah perdarahan disingkirkan, unit stroke, pencegahan sekunder'],
    referensi: ['SKDI2012', 'AHASTROKE2019', 'PERDOSSI2016'],
  },
  'Hematom intraserebral': {
    definisi: 'Perdarahan ke dalam parenkim otak, tersering akibat hipertensi kronik yang merusak arteri perforantes.',
    diagnosis: ['Defisit neurologis fokal mendadak disertai nyeri kepala hebat, muntah, dan penurunan kesadaran lebih cepat dibanding stroke iskemik; CT kepala non-kontras menunjukkan lesi hiperdens'],
    tatalaksana: ['Kontrol tekanan darah lebih ketat daripada stroke iskemik, koreksi koagulopati/antikoagulan, kontrol tekanan intrakranial, hindari antiplatelet/antikoagulan; evaluasi bedah saraf pada hematoma serebelar atau volume besar dengan efek massa'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'ADAMS2019'],
  },
  'Perdarahan subarakhnoid': {
    definisi: 'Perdarahan ke rongga subarachnoid, tersering akibat ruptur aneurisma sakular.',
    diagnosis: ['Nyeri kepala hebat mendadak mencapai puncak dalam detik (thunderclap headache, "nyeri kepala terhebat seumur hidup"), kaku kuduk, dapat disertai penurunan kesadaran; CT kepala non-kontras dini sangat sensitif, pungsi lumbal (xantokromia) bila CT negatif namun kecurigaan tinggi'],
    tatalaksana: ['Rujuk bedah saraf segera untuk clipping/coiling aneurisma, nimodipin untuk cegah vasospasme, kontrol tekanan darah dan nyeri, tirah baring dan lingkungan tenang, pantau komplikasi (rebleeding, vasospasme, hidrosefalus, hiponatremia)'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'ADAMS2019'],
  },
  'Bells’ palsy': {
    definisi: 'Kelumpuhan nervus fasialis perifer idiopatik akut, menyebabkan kelemahan seluruh sisi wajah termasuk dahi.',
    diagnosis: ['Kelemahan wajah unilateral onset akut yang MELIBATKAN dahi (membedakan lesi perifer dari sentral seperti stroke, yang menyisakan dahi), tidak bisa menutup mata (lagoftalmos), sudut mulut turun; dapat disertai gangguan pengecapan dan hiperakusis'],
    tatalaksana: ['Kortikosteroid oral dalam 72 jam onset (meningkatkan pemulihan), antivirus dipertimbangkan pada kasus berat, PROTEKSI MATA wajib (air mata buatan, salep dan penutup mata saat tidur untuk cegah ulkus kornea), fisioterapi wajah; prognosis umumnya baik'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014'],
  },
  'Lesi batang otak': {
    definisi: 'Kerusakan pada mesensefalon, pons, atau medula oblongata akibat stroke, tumor, demielinisasi, atau trauma.',
    diagnosis: ['Ciri khas crossed findings: defisit saraf kranial ipsilateral dengan defisit motorik/sensorik kontralateral; dapat disertai gangguan kesadaran, pola napas abnormal, dan disfungsi okulomotor; MRI modalitas pilihan'],
    tatalaksana: ['Tatalaksana penyebab dasar (protokol stroke, terapi tumor/demielinisasi), amankan jalan napas dan fungsi menelan (risiko aspirasi tinggi), rehabilitasi intensif'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  "Meniere's disease": {
    definisi: 'Gangguan telinga dalam akibat hidrops endolimfatik, ditandai serangan vertigo berulang dengan gejala pendengaran.',
    diagnosis: ['Trias: vertigo episodik (20 menit-12 jam), tuli sensorineural fluktuatif frekuensi rendah, tinitus dan rasa penuh di telinga; audiometri menunjukkan tuli sensorineural, singkirkan penyebab lain'],
    tatalaksana: ['Serangan akut: antivertigo (betahistin), antiemetik, tirah baring; jangka panjang: restriksi garam dan diuretik, hindari kafein/alkohol/rokok, rehabilitasi vestibular; intervensi invasif hanya pada kasus refrakter'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014'],
  },
  'Vertigo (Benign paroxysmal positional vertigo)': {
    definisi: 'Vertigo perifer akibat otolith yang terlepas dan masuk ke kanalis semisirkularis, dipicu perubahan posisi kepala.',
    diagnosis: ['Vertigo berputar singkat (<1 menit) yang dipicu perubahan posisi kepala, tanpa gangguan pendengaran; manuver Dix-Hallpike memicu vertigo dan nistagmus torsional dengan latensi singkat dan fatigable'],
    tatalaksana: ['Manuver reposisi kanalit (Epley) sebagai terapi definitif dan sangat efektif, latihan Brandt-Daroff di rumah, antivertigo hanya jangka sangat pendek untuk gejala berat (penggunaan lama menghambat kompensasi sentral)'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014'],
  },
  'Cerebral palsy': {
    definisi: 'Kelompok gangguan permanen gerakan dan postur akibat lesi non-progresif pada otak yang sedang berkembang.',
    diagnosis: ['Keterlambatan motorik, abnormalitas tonus (spastisitas tersering), refleks primitif menetap, refleks tendon meningkat, pola gerak abnormal; lesi otaknya statis meski manifestasi klinis berubah seiring pertumbuhan'],
    tatalaksana: ['Rehabilitasi multidisiplin (fisioterapi, okupasi, wicara), manajemen spastisitas (baklofen, toksin botulinum, bedah ortopedi), penanganan komorbid (epilepsi, gangguan makan, disabilitas intelektual), dukungan keluarga dan alat bantu'],
    referensi: ['SKDI2012', 'ADAMS2019', 'APLEY2018'],
  },
  'Demensia': {
    definisi: 'Penurunan fungsi kognitif progresif dari tingkat sebelumnya yang cukup berat sehingga mengganggu kemandirian aktivitas sehari-hari.',
    diagnosis: ['Gangguan memori dan minimal satu domain kognitif lain (bahasa, eksekutif, visuospasial), progresif, tanpa gangguan kesadaran; skrining MMSE/MoCA; singkirkan penyebab reversibel (hipotiroid, defisiensi B12, depresi, hidrosefalus tekanan normal, obat)'],
    tatalaksana: ['Atasi penyebab reversibel, inhibitor kolinesterase pada tipe tertentu, intervensi non-farmakologis (stimulasi kognitif, rutinitas terstruktur, keamanan rumah), dukungan dan edukasi caregiver, hindari antipsikotik rutin untuk gejala perilaku'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Penyakit Alzheimer': {
    definisi: 'Penyebab demensia tersering, penyakit neurodegeneratif dengan penumpukan plak amiloid dan neurofibrillary tangles.',
    diagnosis: ['Onset perlahan dengan gangguan memori episodik sebagai gejala paling awal dan menonjol, progresif bertahap; MRI menunjukkan atrofi hipokampus dan kortikal; diagnosis pasti secara histopatologis'],
    tatalaksana: ['Inhibitor kolinesterase (donepezil, rivastigmin) pada tahap ringan-sedang, memantin pada sedang-berat, intervensi psikososial dan lingkungan, dukungan caregiver, perencanaan perawatan jangka panjang'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Gangguan pergerakan lainnya': {
    definisi: 'Kelompok gangguan gerak selain parkinsonisme, mencakup tremor esensial, distonia, korea, mioklonus, dan ataksia.',
    diagnosis: ['Karakterisasi jenis gerakan (ritmis/tidak, saat istirahat/aksi/postural), distribusi, dan pemicu; cari penyebab sekunder (obat, metabolik, Wilson pada usia muda, genetik)'],
    tatalaksana: ['Sesuai jenis: propranolol/primidon untuk tremor esensial, toksin botulinum untuk distonia fokal, tatalaksana penyebab dasar; hentikan obat penyebab bila drug-induced; rujuk neurologi untuk kasus kompleks'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Status epileptikus': {
    definisi: 'Kejang berlangsung ≥5 menit atau kejang berulang tanpa pemulihan kesadaran di antaranya — kegawatdaruratan neurologis.',
    diagnosis: ['Kejang berkepanjangan/berulang; periksa gula darah segera, elektrolit, dan cari pencetus (putus obat antiepilepsi, infeksi SSP, stroke, intoksikasi, hipoglikemia)'],
    tatalaksana: ['Amankan ABC dan oksigen, akses IV; benzodiazepin sebagai lini pertama (diazepam/lorazepam IV, midazolam IM bila tanpa akses IV), lanjut antiepilepsi lini kedua (fenitoin/valproat/levetirasetam) bila kejang berlanjut, anestesi umum dan intubasi bila refrakter; koreksi hipoglikemia dan berikan tiamin bila ada indikasi'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'ADAMS2019'],
  },
  'Sklerosis multipel': {
    definisi: 'Penyakit demielinisasi autoimun kronik pada sistem saraf pusat dengan lesi yang tersebar dalam ruang dan waktu.',
    diagnosis: ['Episode neurologis berulang (neuritis optik, mielitis, gejala batang otak) dengan pemulihan sebagian; MRI menunjukkan lesi demielinisasi periventrikular/jukstakortikal/infratentorial/medula spinalis; oligoclonal bands pada CSS mendukung'],
    tatalaksana: ['Serangan akut: kortikosteroid dosis tinggi IV; jangka panjang: disease-modifying therapy untuk kurangi relaps dan progresi; rehabilitasi dan tatalaksana simtomatik (spastisitas, fatigue, kandung kemih neurogenik)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Amyotrophic lateral sclerosis (ALS)': {
    definisi: 'Penyakit neurodegeneratif progresif yang menyerang motor neuron atas dan bawah, tanpa gangguan sensorik.',
    diagnosis: ['Kombinasi tanda motor neuron atas (spastisitas, refleks meningkat, Babinski) dan bawah (atrofi, fasikulasi, kelemahan) pada regio yang sama dan menyebar; sensorik normal; EMG menunjukkan denervasi luas'],
    tatalaksana: ['Riluzole dan edaravone memperlambat progresi secara terbatas; fokus pada perawatan suportif multidisiplin: dukungan ventilasi non-invasif, nutrisi (gastrostomi), komunikasi, manajemen sekresi dan spastisitas, perawatan paliatif dan diskusi tujuan perawatan'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Complete spinal transaction': {
    definisi: 'Transeksi medula spinalis komplet — hilangnya seluruh fungsi motorik dan sensorik di bawah level lesi.',
    diagnosis: ['Paralisis flaksid dan anestesi total di bawah level lesi, arefleksia dengan hilangnya refleks bulbokavernosus (fase syok spinal), retensi urin; klasifikasi ASIA A; MRI menentukan level dan penyebab'],
    tatalaksana: ['Imobilisasi spinal ketat dan tatalaksana ATLS, waspada syok neurogenik (bradikardia dengan hipotensi) dan gangguan napas pada lesi servikal, dekompresi/stabilisasi bedah, pencegahan komplikasi (ulkus dekubitus, DVT, kandung kemih neurogenik), rehabilitasi jangka panjang'],
    referensi: ['SKDI2012', 'ATLS2018', 'ADAMS2019'],
  },
  'Sindrom kauda equine': {
    definisi: 'Kompresi berkas radiks saraf kauda equina — kegawatdaruratan bedah dengan jendela waktu terbatas.',
    diagnosis: ['Nyeri punggung dengan saddle anesthesia (perineum), retensi/inkontinensia urin dan alvi, kelemahan tungkai bilateral, penurunan tonus sfingter ani; MRI lumbosakral CITO'],
    tatalaksana: ['Dekompresi bedah darurat (idealnya <24-48 jam onset) — penundaan berisiko disfungsi kandung kemih dan seksual permanen; kateterisasi urin, analgesia, rujuk bedah saraf/ortopedi spine segera'],
    referensi: ['SKDI2012', 'ADAMS2019', 'APLEY2018'],
  },
  'Neurogenic bladder': {
    definisi: 'Disfungsi kandung kemih akibat gangguan persarafan, dapat spastik (lesi upper motor neuron) atau flaksid (lesi lower motor neuron).',
    diagnosis: ['Retensi urin, inkontinensia, atau berkemih tidak tuntas pada pasien dengan penyakit/cedera neurologis; ukur residu urin pasca berkemih, urodinamik untuk karakterisasi, pantau fungsi ginjal'],
    tatalaksana: ['Kateterisasi intermiten bersih sebagai standar untuk pengosongan, antikolinergik pada kandung kemih overaktif, cegah dan deteksi ISK berulang, pemantauan saluran kemih atas untuk cegah kerusakan ginjal'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'ADAMS2019'],
  },
  'Siringomielia': {
    definisi: 'Terbentuknya rongga berisi cairan (syrinx) di dalam medula spinalis yang merusak traktus di sekitarnya.',
    diagnosis: ['Gangguan sensorik disosiasi khas: hilangnya sensasi nyeri dan suhu dengan sensasi raba dan proprioseptif utuh, pola "cape-like" di bahu dan lengan; kelemahan dan atrofi tangan; MRI konfirmatif, cari malformasi Chiari yang sering menyertai'],
    tatalaksana: ['Atasi penyebab dasar (dekompresi fossa posterior pada Chiari, drainase syrinx pada kasus tertentu), pemantauan progresi, rehabilitasi dan edukasi proteksi dari luka bakar/cedera akibat hilangnya sensasi nyeri'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Mielopati': {
    definisi: 'Disfungsi medula spinalis dari berbagai sebab (kompresi degeneratif, tumor, infeksi, demielinisasi, defisiensi B12).',
    diagnosis: ['Kelemahan spastik dan hiperrefleksia di bawah level lesi, Babinski positif, gangguan sensorik dengan level, gangguan berkemih; MRI menentukan level dan penyebab; periksa B12 pada mielopati tanpa kompresi'],
    tatalaksana: ['Dekompresi bedah bila kompresif dan progresif, terapi penyebab spesifik (B12, steroid pada demielinisasi, OAT pada TB), rehabilitasi; mielopati kompresif progresif memerlukan rujukan tanpa penundaan'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Dorsal root syndrome': {
    definisi: 'Gangguan radiks dorsalis (sensorik) menyebabkan nyeri dan defisit sensorik sesuai distribusi dermatom.',
    diagnosis: ['Nyeri menjalar dan parestesia sesuai dermatom, hipestesia dermatomal, refleks terkait dapat menurun, kekuatan motorik relatif utuh; cari penyebab (herpes zoster, HNP, tumor, diabetes)'],
    tatalaksana: ['Analgesia termasuk obat nyeri neuropatik (gabapentin/pregabalin/amitriptilin), terapi penyebab dasar, fisioterapi; hindari analgesik biasa saja karena nyeri neuropatik responsnya terbatas'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Acute medulla compression': {
    definisi: 'Kompresi medula spinalis akut — kegawatdaruratan neurologis akibat tumor/metastasis, abses, hematoma, atau fraktur.',
    diagnosis: ['Nyeri punggung, kelemahan tungkai progresif cepat, level sensorik, gangguan berkemih dan defekasi; MRI seluruh spine CITO (metastasis sering multilevel)'],
    tatalaksana: ['Deksametason dosis tinggi segera bila kompresi maligna, dekompresi bedah dan/atau radioterapi darurat, tatalaksana penyebab; kecepatan intervensi menentukan pemulihan fungsi — status ambulasi saat terapi dimulai adalah prediktor terkuat'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Radicular syndrome': {
    definisi: 'Radikulopati — gangguan fungsi radiks saraf spinal yang menimbulkan nyeri, gangguan sensorik, dan kelemahan sesuai miotom/dermatom.',
    diagnosis: ['Nyeri menjalar sesuai dermatom, dapat disertai kelemahan dan penurunan refleks spesifik; Lasegue positif pada radikulopati lumbal, Spurling test pada servikal; MRI bila ada red flags atau defisit progresif'],
    tatalaksana: ['Konservatif pada sebagian besar kasus: analgesia (termasuk obat nyeri neuropatik), fisioterapi, hindari tirah baring total berkepanjangan; rujuk bedah bila defisit motorik progresif, sindrom kauda equina, atau nyeri refrakter'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'APLEY2018'],
  },
  'Hernia nucleus pulposus (HNP)': {
    definisi: 'Protrusi atau ekstrusi nukleus pulposus diskus intervertebralis yang menekan radiks saraf atau medula spinalis.',
    diagnosis: ['Nyeri punggung dengan penjalaran radikular (iskialgia pada HNP lumbal), memberat dengan batuk/mengejan, Lasegue positif, defisit sensorik-motorik dermatomal; MRI bila ada indikasi'],
    tatalaksana: ['Konservatif 6-12 minggu (analgesia, fisioterapi, aktivitas bertahap, edukasi ergonomi) — mayoritas membaik; operasi (diskektomi) bila defisit neurologis progresif, kauda equina, atau nyeri berat refrakter'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'APLEY2018'],
  },
  'Hematom epidural': {
    definisi: 'Perdarahan antara duramater dan tulang tengkorak, umumnya arterial (a. meningea media) akibat fraktur temporal.',
    diagnosis: ['Riwayat trauma kepala dengan lucid interval klasik (sadar sesaat lalu menurun cepat), pupil anisokor ipsilateral dan hemiparesis kontralateral bila herniasi; CT menunjukkan lesi hiperdens bikonveks (lentikular) yang tidak melewati sutura'],
    tatalaksana: ['Evakuasi bedah darurat (kraniotomi) — prognosis sangat baik bila cepat ditangani sebelum kerusakan sekunder; kontrol tekanan intrakranial, hindari hipotensi dan hipoksia sambil menunggu operasi'],
    referensi: ['SKDI2012', 'ATLS2018', 'ADAMS2019'],
  },
  'Hematom subdural': {
    definisi: 'Perdarahan antara duramater dan araknoid, umumnya venosa (bridging veins); dapat akut, subakut, atau kronik.',
    diagnosis: ['Akut: trauma berat dengan penurunan kesadaran; Kronik: lansia atau pengguna antikoagulan dengan trauma ringan/tidak diingat, gejala berkembang minggu-bulan (nyeri kepala, bingung, hemiparesis); CT menunjukkan lesi berbentuk bulan sabit (konkaf) yang MELEWATI sutura'],
    tatalaksana: ['Evakuasi bedah bila ketebalan besar, pergeseran garis tengah, atau gejala progresif (burr hole pada kronik, kraniotomi pada akut); koreksi koagulopati, observasi ketat pada lesi kecil asimtomatik'],
    referensi: ['SKDI2012', 'ATLS2018', 'ADAMS2019'],
  },
  'Trauma Medula Spinalis': {
    definisi: 'Cedera medula spinalis akibat trauma, dapat komplet atau inkomplet dengan berbagai sindrom klinis.',
    diagnosis: ['Nilai level neurologis dan kelengkapan cedera (skala ASIA), periksa refleks bulbokavernosus, waspada syok neurogenik; sindrom inkomplet: central cord (lengan lebih berat dari tungkai), Brown-Séquard, anterior cord; CT/MRI spine'],
    tatalaksana: ['Imobilisasi spinal sejak prehospital, tatalaksana ATLS, pertahankan perfusi medula (hindari hipotensi), dekompresi dan stabilisasi bedah bila terindikasi, pencegahan komplikasi imobilisasi, rehabilitasi dini'],
    referensi: ['SKDI2012', 'ATLS2018', 'ADAMS2019'],
  },
  'Reffered pain': {
    definisi: 'Nyeri alih — nyeri yang dirasakan di lokasi berbeda dari sumber patologinya, karena konvergensi persarafan aferen viseral dan somatik.',
    diagnosis: ['Pola khas membantu identifikasi sumber: infark miokard ke lengan kiri/rahang, kolesistitis ke skapula kanan, iritasi diafragma ke bahu, batu ureter ke selangkangan; tidak ada kelainan lokal di area yang nyeri'],
    tatalaksana: ['Kunci tatalaksana adalah menemukan dan mengatasi sumber patologi sebenarnya, bukan mengobati area nyeri; analgesia sebagai terapi simtomatik sementara'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PPKFKTP2014'],
  },
  'Nyeri neuropatik': {
    definisi: 'Nyeri akibat lesi atau penyakit pada sistem somatosensorik, bukan akibat stimulasi nosiseptor normal.',
    diagnosis: ['Kualitas terbakar, menyetrum, atau menusuk; disertai alodinia (nyeri oleh rangsang tidak nyeri) dan hiperalgesia; sesuai distribusi neuroanatomis; kuesioner DN4/painDETECT membantu skrining'],
    tatalaksana: ['Lini pertama: gabapentin/pregabalin, antidepresan trisiklik (amitriptilin), atau SNRI (duloksetin); analgesik konvensional dan NSAID umumnya kurang efektif; atasi penyebab dasar, terapi topikal (lidokain/kapsaisin) pada nyeri terlokalisasi'],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'ADAMS2019'],
  },
  'Sindrom Horner': {
    definisi: 'Gangguan persarafan simpatis okulosimpatis menyebabkan trias ptosis, miosis, dan anhidrosis pada sisi yang sama.',
    diagnosis: ['Trias: ptosis ringan, pupil miosis (anisokoria lebih jelas di ruang gelap), anhidrosis wajah ipsilateral; cari lesi sepanjang jalur simpatis — waspadai tumor Pancoast paru, diseksi karotis (Horner dengan nyeri leher akut adalah tanda bahaya)'],
    tatalaksana: ['Tidak ada terapi untuk Hornernya sendiri — fokus mencari dan mengatasi penyebab; pencitraan leher-dada-otak sesuai kecurigaan lokasi lesi, rujuk sesuai etiologi'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Peroneal palsy': {
    definisi: 'Kelumpuhan nervus peroneus komunis, penyebab tersering drop foot, umumnya akibat kompresi di kaput fibula.',
    diagnosis: ['Drop foot dengan kelemahan dorsofleksi dan eversi kaki, hipestesia dorsum kaki dan lateral tungkai bawah, steppage gait; inversi kaki tetap kuat (membedakan dari radikulopati L5); riwayat menyilangkan kaki lama, gips ketat, atau berbaring lama'],
    tatalaksana: ['Hilangkan sumber kompresi, ankle-foot orthosis untuk fungsi berjalan dan cegah kontraktur, fisioterapi; sebagian besar pulih dalam beberapa bulan bila lesi kompresi ringan; EMG untuk prognosis bila tidak membaik'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Guillain Barre syndrome': {
    definisi: 'Poliradikuloneuropati demielinisasi akut yang dimediasi imun, sering didahului infeksi saluran cerna atau napas.',
    diagnosis: ['Kelemahan flaksid asending simetris progresif dengan arefleksia, gangguan sensorik ringan; risiko gagal napas dan disautonomia; CSS menunjukkan disosiasi sitoalbuminik (protein tinggi, sel normal), EMG mendukung'],
    tatalaksana: ['IVIG atau plasmaferesis (kortikosteroid TIDAK bermanfaat), pemantauan ketat fungsi napas (kapasitas vital serial) dengan kesiapan intubasi, monitor jantung untuk disautonomia, profilaksis DVT, rehabilitasi'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Miastenia gravis': {
    definisi: 'Penyakit autoimun pada taut neuromuskular akibat antibodi terhadap reseptor asetilkolin, menyebabkan kelemahan otot yang fluktuatif.',
    diagnosis: ['Kelemahan yang memberat dengan aktivitas dan membaik dengan istirahat (fatigability), ptosis dan diplopia sering menjadi gejala awal, kelemahan bulbar; antibodi anti-AChR/anti-MuSK, uji repetitive nerve stimulation, CT toraks untuk timoma'],
    tatalaksana: ['Inhibitor kolinesterase (piridostigmin) untuk gejala, imunosupresan (kortikosteroid, azatioprin), timektomi bila timoma atau pada kasus terpilih; krisis miastenik (gagal napas) memerlukan IVIG/plasmaferesis dan ventilasi — hindari obat yang memperberat (aminoglikosida, beta-blocker, magnesium)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Polimiositis': {
    definisi: 'Miopati inflamasi autoimun dengan kelemahan otot proksimal simetris progresif tanpa lesi kulit (berbeda dari dermatomiositis).',
    diagnosis: ['Kelemahan proksimal simetris (sulit naik tangga, menyisir rambut), kreatin kinase sangat meningkat, EMG pola miopatik, biopsi otot menunjukkan infiltrat inflamasi endomisial; skrining keganasan terkait'],
    tatalaksana: ['Kortikosteroid dosis tinggi sebagai lini pertama dengan tapering bertahap, imunosupresan steroid-sparing (metotreksat/azatioprin), fisioterapi untuk pertahankan kekuatan dan cegah kontraktur'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Neurofibromatosis (Von Recklaing Hausen disease)': {
    definisi: 'Kelainan genetik autosomal dominan (neurofibromatosis tipe 1) dengan tumor jaringan saraf multipel dan manifestasi kulit khas.',
    diagnosis: ['Kriteria: ≥6 makula café-au-lait, ≥2 neurofibroma atau 1 neurofibroma pleksiform, freckling aksila/inguinal, glioma optik, ≥2 nodul Lisch pada iris, lesi tulang khas, atau keluarga tingkat pertama dengan NF1'],
    tatalaksana: ['Tidak ada terapi kuratif — surveilans berkala (tekanan darah, mata, perkembangan, skoliosis, tanda transformasi maligna), eksisi tumor yang simtomatik atau curiga ganas, konseling genetik'],
    referensi: ['SKDI2012', 'ADAMS2019', 'HARRISON2022'],
  },
  'Amnesia pascatrauma': {
    definisi: 'Periode kebingungan dan ketidakmampuan membentuk memori baru setelah cedera kepala; durasinya menjadi indikator keparahan cedera otak.',
    diagnosis: ['Disorientasi dan gangguan memori antegrad pasca trauma kepala; durasi PTA menentukan derajat (< 1 jam ringan, 1-24 jam sedang, > 24 jam berat); nilai dengan instrumen terstruktur dan pantau serial'],
    tatalaksana: ['Lingkungan tenang dan terstruktur dengan reorientasi berulang, hindari sedatif bila memungkinkan, keamanan pasien (risiko agitasi dan jatuh), rehabilitasi kognitif, edukasi keluarga tentang perjalanan pemulihan'],
    referensi: ['SKDI2012', 'ADAMS2019', 'ATLS2018'],
  },
  'Afasia': {
    definisi: 'Gangguan bahasa akibat lesi otak (tersering stroke pada hemisfer dominan), memengaruhi produksi dan/atau pemahaman bahasa.',
    diagnosis: ['Nilai kelancaran bicara, pemahaman, repetisi, dan penamaan untuk klasifikasi: Broca (tidak lancar, pemahaman baik, pasien sadar akan defisitnya), Wernicke (lancar namun tidak bermakna, pemahaman buruk), global, konduksi'],
    tatalaksana: ['Terapi wicara-bahasa intensif sedini mungkin sebagai terapi utama, strategi komunikasi alternatif, edukasi keluarga cara berkomunikasi efektif, tatalaksana penyebab dasar (stroke) dan pencegahan sekunder'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
  'Mild Cognitive Impairment (MCI)': {
    definisi: 'Penurunan kognitif yang lebih dari perkiraan usia namun belum mengganggu kemandirian aktivitas sehari-hari — tahap antara penuaan normal dan demensia.',
    diagnosis: ['Keluhan kognitif dari pasien/keluarga, gangguan objektif pada uji kognitif (MoCA lebih sensitif dari MMSE untuk MCI), aktivitas sehari-hari masih mandiri, belum memenuhi kriteria demensia'],
    tatalaksana: ['Tidak ada farmakoterapi yang terbukti mencegah konversi ke demensia; kendalikan faktor risiko vaskular, aktivitas fisik teratur, stimulasi kognitif dan sosial, tinjau obat yang mengganggu kognisi, evaluasi ulang berkala untuk deteksi progresi'],
    referensi: ['SKDI2012', 'ADAMS2019', 'PERDOSSI2016'],
  },
}
