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
  WILLIAMSOB2022:
    "Cunningham FG, Leveno KJ, Dashe JS, Hoffman BL, Spong CY, Casey BM, editors. Williams Obstetrics. 26th ed. New York: McGraw Hill; 2022.",
  POGI2016:
    'Perkumpulan Obstetri dan Ginekologi Indonesia. Pedoman Nasional Pelayanan Kedokteran: Pelayanan Kesehatan Maternal dan Neonatal. Jakarta: POGI; 2016.',
  WHOPPH2012:
    'World Health Organization. WHO Recommendations for the Prevention and Treatment of Postpartum Haemorrhage. Geneva: World Health Organization; 2012.',
  KANSKI2020:
    "Salmon JF. Kanski's Clinical Ophthalmology: A Systematic Approach. 9th ed. Edinburgh: Elsevier; 2020.",
  CUMMINGS2021:
    'Flint PW, Francis HW, Haughey BH, Lesperance MM, Lund VJ, Robbins KT, et al., editors. Cummings Otolaryngology: Head and Neck Surgery. 7th ed. Philadelphia: Elsevier; 2021.',
  FITZPATRICK2019:
    "Kang S, Amagai M, Bruckner AL, Enk AH, Margolis DJ, McMichael AJ, et al., editors. Fitzpatrick's Dermatology. 9th ed. New York: McGraw Hill; 2019.",
  PERDOSKI2021:
    'Perhimpunan Dokter Spesialis Kulit dan Kelamin Indonesia. Panduan Praktik Klinis bagi Dokter Spesialis Kulit dan Kelamin di Indonesia. Jakarta: PERDOSKI; 2021.',
  WHOLEPROSY2018:
    'World Health Organization. Guidelines for the Diagnosis, Treatment and Prevention of Leprosy. New Delhi: WHO Regional Office for South-East Asia; 2018.',
  SLEISENGER2021:
    "Feldman M, Friedman LS, Brandt LJ, editors. Sleisenger and Fordtran's Gastrointestinal and Liver Disease. 11th ed. Philadelphia: Elsevier; 2021.",
  WHOHEPB2024:
    'World Health Organization. Guidelines for the Prevention, Diagnosis, Care and Treatment for People with Chronic Hepatitis B Infection. Geneva: World Health Organization; 2024.',
  SCHWARTZ2019:
    "Brunicardi FC, Andersen DK, Billiar TR, Dunn DL, Kao LS, Hunter JG, et al., editors. Schwartz's Principles of Surgery. 11th ed. New York: McGraw Hill; 2019.",
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

/**
 * Anamnesis terstruktur. Ditulis sebagai template klinis yang dapat langsung
 * dipakai saat menghadapi pasien dengan diagnosis ini — bukan riwayat satu
 * pasien tertentu.
 */
export interface AnamnesisTerstruktur {
  keluhanUtama: string
  /** RPS diuraikan dengan kerangka SOCRATES. */
  riwayatPenyakitSekarang: string
  riwayatPenyakitDahulu?: string
  riwayatPenyakitKeluarga?: string
  riwayatPengobatan?: string
  riwayatAlergi?: string
  riwayatKehamilanPersalinan?: string
  riwayatTumbuhKembang?: string
  riwayatNutrisi?: string
  riwayatImunisasi?: string
  riwayatSosialEkonomi?: string
}

/**
 * Catatan penyakit. Ringkasan kriteria diagnosis boleh diberikan lewat
 * `diagnosis` (format ringkas) atau `goldStandard` (format mendalam) — tipe di
 * bawah memaksa minimal salah satunya ada, sehingga tidak mungkin ada entri
 * tanpa keterangan cara menegakkan diagnosis.
 */
export type SkdiDiseaseNote = SkdiDiseaseNoteBase &
  ({ diagnosis: string[] } | { goldStandard: string })

interface SkdiDiseaseNoteBase {
  definisi: string
  diagnosis?: string[]
  tatalaksana: string[]
  /** Key ke REFERENSI_SUMBER — pedoman yang menjadi rujukan konsep entry ini. */
  referensi: string[]

  // ── Pendalaman klinis (opsional; diisi bertahap, diprioritaskan level 4A) ──
  /** Anamnesis terstruktur lengkap dengan kerangka SOCRATES pada RPS. */
  anamnesis?: AnamnesisTerstruktur
  /** Temuan pemeriksaan fisik yang khas untuk diagnosis ini. */
  pemeriksaanFisik?: string[]
  /** Interpretasi antropometri (BB/U, TB/U, BB/TB, IMT) bila relevan. */
  antropometri?: string
  /** Pemeriksaan penunjang beserta interpretasi temuan yang diharapkan. */
  penunjang?: string[]
  etiologi?: string
  patofisiologi?: string
  faktorRisiko?: string[]
  /** Baku emas penegakan diagnosis. */
  goldStandard?: string
  diagnosisBanding?: string[]
  /**
   * Paragraf pengkajian yang diawali "Dipikirkan …" — menjelaskan alur
   * penalaran dari anamnesis, pemeriksaan fisik, dan penunjang menuju
   * diagnosis, dibandingkan terhadap diagnosis bandingnya.
   */
  pengkajian?: string
  /** Terapi suportif: resusitasi, balans cairan, kebutuhan kalori, urine output. */
  terapiSuportif?: string[]
  /** Edukasi: pola makan, tidur, olahraga, dan jadwal kontrol. */
  edukasi?: string[]
  komplikasi?: string[]
  prognosis?: string
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
    definisi: 'DM akibat resistensi insulin pada jaringan perifer disertai defisiensi insulin relatif akibat disfungsi sel beta pankreas yang progresif; erat kaitannya dengan obesitas sentral dan gaya hidup, onset umumnya usia dewasa.',
    anamnesis: {
      keluhanUtama: 'Sering buang air kecil, banyak minum, dan banyak makan disertai penurunan berat badan tanpa sebab jelas — atau tanpa keluhan sama sekali dan ditemukan saat pemeriksaan gula darah rutin.',
      riwayatPenyakitSekarang:
        'Telusuri dengan kerangka SOCRATES yang disesuaikan untuk keluhan non-nyeri. Site: keluhan bersifat sistemik, bukan terlokalisasi pada satu organ. Onset: umumnya perlahan dalam hitungan bulan hingga tahun, berbeda dari DM tipe 1 yang mendadak. Character: poliuria terutama malam hari sehingga terbangun berkali-kali, polidipsia yang tidak hilang meski banyak minum, polifagia namun berat badan justru turun. Radiation: gali keluhan penyerta yang menandakan komplikasi — kesemutan dan baal simetris pada kedua kaki (neuropati), pandangan kabur atau berbayang (retinopati), luka yang lama sembuh, gatal pada kemaluan atau keputihan berulang (kandidiasis), serta disfungsi ereksi. Associations: lemas, mudah lelah, penurunan berat badan yang dikuantifikasi dalam kilogram per periode waktu. Time course: apakah keluhan menetap, memberat, atau berfluktuasi mengikuti pola makan. Exacerbating/relieving: hubungan keluhan dengan asupan karbohidrat, kepatuhan obat, aktivitas fisik, dan stres atau infeksi penyerta. Severity: dampak terhadap pekerjaan, kualitas tidur, dan aktivitas harian.',
      riwayatPenyakitDahulu:
        'Riwayat hipertensi, dislipidemia, penyakit jantung koroner, stroke, dan penyakit ginjal. Riwayat diabetes gestasional atau melahirkan bayi dengan berat lahir lebih dari 4 kg pada perempuan. Riwayat pankreatitis atau penggunaan kortikosteroid jangka panjang yang dapat memicu hiperglikemia sekunder. Riwayat infeksi berulang seperti tuberkulosis, infeksi saluran kemih, atau infeksi kulit.',
      riwayatPenyakitKeluarga:
        'Riwayat diabetes melitus pada orang tua dan saudara kandung sangat meningkatkan risiko; tanyakan pula riwayat keluarga dengan hipertensi, penyakit jantung dini, dan stroke untuk menilai risiko kardiovaskular keluarga.',
      riwayatPengobatan:
        'Obat antidiabetik yang pernah dan sedang digunakan beserta dosis dan kepatuhannya, riwayat hipoglikemia akibat obat, serta penggunaan kortikosteroid, diuretik tiazid, antipsikotik atipik, dan obat herbal yang tidak jelas kandungannya.',
      riwayatAlergi: 'Riwayat alergi obat, terutama golongan sulfa yang relevan untuk pemilihan sulfonilurea.',
      riwayatNutrisi:
        'Pola makan sehari-hari termasuk frekuensi, porsi, dan jenis karbohidrat; konsumsi minuman manis, gorengan, dan camilan; kebiasaan makan malam larut; serta upaya diet yang pernah dijalani beserta hasilnya.',
      riwayatSosialEkonomi:
        'Aktivitas fisik harian dan olahraga terstruktur, kebiasaan merokok dan konsumsi alkohol, jenis pekerjaan dan tingkat sedentari, kualitas dan durasi tidur, tingkat stres, serta kemampuan finansial dan akses terhadap obat dan pemeriksaan berkala yang menentukan keberlanjutan terapi.',
    },
    pemeriksaanFisik: [
      'Antropometri: berat badan, tinggi badan, indeks massa tubuh, dan lingkar pinggang sebagai penanda obesitas sentral',
      'Tekanan darah pada kedua lengan dalam posisi duduk setelah istirahat 5 menit; nilai pula hipotensi ortostatik sebagai tanda neuropati otonom',
      'Kulit: acanthosis nigricans pada leher dan aksila sebagai penanda resistensi insulin, xanthoma, luka atau infeksi jamur pada lipatan',
      'Pemeriksaan kaki diabetik menyeluruh: inspeksi kulit, kalus, deformitas dan ulkus; palpasi nadi dorsalis pedis dan tibialis posterior; uji sensasi protektif dengan monofilamen 10 g pada sepuluh titik dan uji getar dengan garpu tala 128 Hz',
      'Funduskopi untuk mencari mikroaneurisma, perdarahan dot-blot, eksudat keras, dan neovaskularisasi',
      'Pemeriksaan jantung dan pembuluh darah perifer termasuk auskultasi bruit karotis dan abdomen',
    ],
    antropometri:
      'Hitung indeks massa tubuh dengan rumus berat badan dalam kilogram dibagi kuadrat tinggi badan dalam meter. Menurut kriteria Asia Pasifik: kurang dari 18,5 berarti berat kurang; 18,5 sampai 22,9 normal; 23 sampai 24,9 berat berlebih; 25 sampai 29,9 obesitas derajat I; dan 30 atau lebih obesitas derajat II. Obesitas sentral ditegakkan bila lingkar pinggang lebih dari 90 cm pada laki-laki atau lebih dari 80 cm pada perempuan, dan merupakan prediktor risiko kardiometabolik yang lebih kuat daripada indeks massa tubuh saja.',
    penunjang: [
      'Glukosa darah puasa, glukosa 2 jam setelah pembebanan 75 gram glukosa, dan glukosa darah sewaktu untuk penegakan diagnosis',
      'HbA1c untuk menilai kendali glikemik rerata 2-3 bulan terakhir; hasil dapat menyesatkan pada anemia, hemoglobinopati, dan penyakit ginjal kronik',
      'Profil lipid puasa: kolesterol total, LDL, HDL, dan trigliserida untuk stratifikasi risiko kardiovaskular',
      'Kreatinin serum dengan perhitungan laju filtrasi glomerulus, serta rasio albumin-kreatinin urin sebagai penanda nefropati dini',
      'Elektrokardiogram untuk mencari iskemia diam yang sering terjadi tanpa nyeri dada pada pasien diabetes',
      'Fungsi hati sebagai data dasar sebelum terapi dan untuk menilai perlemakan hati yang sering menyertai',
    ],
    etiologi:
      'Kombinasi predisposisi genetik poligenik dengan faktor lingkungan berupa asupan kalori berlebih, obesitas sentral, dan aktivitas fisik rendah.',
    patofisiologi:
      'Kelebihan jaringan lemak viseral meningkatkan pelepasan asam lemak bebas dan sitokin proinflamasi yang mengganggu jalur sinyal insulin pada otot dan hati, sehingga ambilan glukosa perifer menurun dan produksi glukosa hepatik meningkat. Sel beta pankreas awalnya mengompensasi dengan hipersekresi insulin sehingga glukosa masih normal; ketika kapasitas kompensasi terlampaui dan massa sel beta menurun secara progresif, muncul hiperglikemia. Hiperglikemia kronik menimbulkan kerusakan mikrovaskular melalui jalur poliol, pembentukan advanced glycation end products, dan stres oksidatif, serta mempercepat aterosklerosis makrovaskular.',
    faktorRisiko: [
      'Usia 40 tahun atau lebih',
      'Indeks massa tubuh 23 kg/m² atau lebih dan obesitas sentral',
      'Riwayat keluarga diabetes pada kerabat derajat pertama',
      'Hipertensi, dislipidemia, dan sindrom metabolik',
      'Riwayat diabetes gestasional atau melahirkan bayi lebih dari 4 kg',
      'Sindrom ovarium polikistik',
      'Aktivitas fisik kurang dan pola makan tinggi kalori',
      'Riwayat toleransi glukosa terganggu atau glukosa puasa terganggu',
    ],
    diagnosis: [
      'Glukosa darah puasa 126 mg/dL atau lebih setelah puasa minimal 8 jam',
      'Glukosa 2 jam setelah tes toleransi glukosa oral 75 gram sebesar 200 mg/dL atau lebih',
      'Glukosa darah sewaktu 200 mg/dL atau lebih disertai gejala klasik poliuria, polidipsia, dan penurunan berat badan tanpa sebab jelas',
      'HbA1c 6,5% atau lebih pada laboratorium terstandar',
      'Tanpa gejala klasik, diperlukan dua hasil abnormal untuk konfirmasi',
    ],
    goldStandard:
      'Diagnosis ditegakkan bila glukosa darah puasa 126 mg/dL atau lebih, atau glukosa 2 jam setelah tes toleransi glukosa oral 75 gram 200 mg/dL atau lebih, atau HbA1c 6,5% atau lebih. Bila pasien tanpa gejala klasik, diperlukan dua hasil abnormal — baik dari dua pemeriksaan berbeda pada satu sampel maupun dari pemeriksaan ulang pada hari berbeda. Glukosa darah sewaktu 200 mg/dL atau lebih disertai gejala klasik sudah cukup untuk diagnosis tanpa konfirmasi ulang.',
    diagnosisBanding: [
      'Diabetes melitus tipe 1 — usia lebih muda, kurus, onset cepat, cenderung ketoasidosis, C-peptide rendah, autoantibodi positif',
      'Diabetes tipe lain akibat obat (kortikosteroid), penyakit pankreas, atau endokrinopati (Cushing, akromegali, hipertiroid)',
      'Maturity-onset diabetes of the young — onset usia muda, riwayat keluarga tiga generasi, tidak obesitas, tidak ketosis',
      'Diabetes insipidus — poliuria dan polidipsia berat namun glukosa darah normal dan urin sangat encer',
    ],
    pengkajian:
      'Dipikirkan diabetes melitus tipe 2 pada pasien ini atas dasar keluhan klasik poliuria, polidipsia, dan polifagia yang berlangsung perlahan disertai penurunan berat badan, yang muncul pada usia dewasa dengan latar obesitas sentral dan gaya hidup sedentari serta riwayat keluarga diabetes. Perjalanan yang bertahap tersebut menjauhkan dari diabetes melitus tipe 1 yang khasnya timbul mendadak pada usia lebih muda dengan perawakan kurus dan sering langsung bermanifestasi sebagai ketoasidosis; pada pemeriksaan, temuan acanthosis nigricans justru memperkuat adanya resistensi insulin yang menjadi dasar patofisiologi tipe 2. Poliuria dan polidipsia pada kasus ini juga perlu dibedakan dari diabetes insipidus, namun pada diabetes insipidus glukosa darah normal dan urin sangat encer dengan osmolaritas rendah, sedangkan di sini glukosa darah jelas meningkat. Kemungkinan diabetes tipe lain disingkirkan dengan menelusuri riwayat penggunaan kortikosteroid, penyakit pankreas, dan tanda endokrinopati seperti moon face, striae ungu, atau pembesaran akral yang tidak ditemukan. Adanya kesemutan simetris pada kedua tungkai dan pandangan kabur menunjukkan hiperglikemia telah berlangsung lama sebelum terdiagnosis, sehingga skrining komplikasi mikrovaskular dan makrovaskular perlu dikerjakan sejak diagnosis ditegakkan, berbeda dari diabetes tipe 1 yang skrining komplikasinya dimulai lima tahun setelah diagnosis.',
    terapiSuportif: [
      'Kebutuhan kalori dihitung dari berat badan ideal menggunakan rumus Broca, yaitu tinggi badan dalam sentimeter dikurangi 100 lalu dikurangi 10 persen. Kebutuhan basal 25-30 kkal/kg berat badan ideal per hari, disesuaikan faktor aktivitas dan stres, lalu dikurangi 500 kkal per hari bila ditargetkan penurunan berat badan',
      'Komposisi makronutrien: karbohidrat 45-65% dengan mengutamakan indeks glikemik rendah dan tinggi serat, protein 10-20% (diturunkan bila sudah ada nefropati), lemak 20-25% dengan lemak jenuh kurang dari 7%',
      'Serat 20-35 gram per hari dan pembatasan garam kurang dari 5 gram per hari terutama bila disertai hipertensi',
      'Pemantauan glukosa darah mandiri; pada pasien dengan insulin atau sulfonilurea, ajarkan pengenalan dan penanganan hipoglikemia dengan aturan 15 yaitu 15 gram karbohidrat cepat serap lalu evaluasi ulang setelah 15 menit',
    ],
    tatalaksana: [
      'Modifikasi gaya hidup pada semua pasien: penurunan berat badan 5-10%, aktivitas aerobik sedang minimal 150 menit per minggu terbagi minimal 3 hari dengan jeda tidak lebih dari 2 hari berturut-turut, ditambah latihan beban 2-3 kali per minggu',
      'Metformin sebagai lini pertama, dimulai 500 mg satu kali sehari bersama makan lalu dititrasi bertahap hingga maksimal 2000-2550 mg per hari terbagi; kontraindikasi bila laju filtrasi glomerulus kurang dari 30 mL/menit/1,73 m² dan perlu dihentikan sementara sebelum pemberian kontras beryodium',
      'Bila HbA1c belum mencapai target setelah 3 bulan, tambahkan obat kedua sesuai komorbid: penghambat SGLT2 bila ada gagal jantung atau penyakit ginjal kronik, agonis reseptor GLP-1 bila ada penyakit kardiovaskular aterosklerotik atau perlu penurunan berat badan, sulfonilurea atau penghambat DPP-4 bila pertimbangan utama adalah biaya',
      'Insulin dimulai bila HbA1c sangat tinggi (di atas 9-10%) dengan gejala katabolik, saat sakit berat atau perioperatif, atau bila kombinasi obat oral gagal; mulai dengan insulin basal 10 unit atau 0,1-0,2 unit/kg berat badan sebelum tidur dan titrasi berdasarkan glukosa darah puasa',
      'Target terapi umum: HbA1c kurang dari 7%, glukosa puasa 80-130 mg/dL, glukosa 2 jam setelah makan kurang dari 180 mg/dL; target dilonggarkan pada usia lanjut, harapan hidup terbatas, riwayat hipoglikemia berat, atau komorbid berat',
      'Statin diberikan pada sebagian besar pasien diabetes usia 40 tahun ke atas untuk pencegahan kardiovaskular; target tekanan darah umumnya kurang dari 140/90 mmHg dengan penghambat ACE atau ARB sebagai pilihan bila disertai albuminuria',
      'Skrining komplikasi sejak diagnosis dan diulang setiap tahun: funduskopi, rasio albumin-kreatinin urin dan laju filtrasi glomerulus, pemeriksaan kaki, profil lipid, serta elektrokardiogram sesuai indikasi',
    ],
    edukasi: [
      'Penjadwalan makan: tiga kali makan utama dengan jarak 5-6 jam ditambah 2-3 kali selingan; makan pada jam yang konsisten setiap hari agar sesuai dengan kerja obat dan mencegah hipoglikemia',
      'Porsi menggunakan metode piring: setengah piring sayur non-tepung, seperempat protein tanpa lemak, dan seperempat karbohidrat kompleks; batasi gula sederhana dan minuman manis, ganti nasi putih dengan nasi merah atau kentang berkulit',
      'Tidur 7-8 jam per malam dengan jadwal teratur — kurang tidur dan gangguan tidur memperburuk resistensi insulin; skrining sleep apnea bila mendengkur keras dan mengantuk berat pada siang hari',
      'Pola olahraga: jalan cepat, sepeda, atau berenang 30 menit per hari selama 5 hari seminggu pada intensitas sedang (masih dapat berbicara namun tidak dapat bernyanyi). Jangan berolahraga bila glukosa darah kurang dari 100 mg/dL tanpa asupan karbohidrat terlebih dahulu, atau bila glukosa lebih dari 250 mg/dL disertai keton. Gunakan alas kaki yang pas dan periksa kaki setelah berolahraga',
      'Perawatan kaki harian: periksa telapak dan sela jari setiap hari termasuk dengan bantuan cermin, keringkan sela jari setelah mandi, potong kuku lurus, jangan berjalan tanpa alas kaki, dan segera periksakan setiap luka sekecil apa pun',
      'Jadwal kontrol: setiap 2-4 minggu saat penyesuaian dosis hingga target tercapai, lalu setiap 3 bulan bersamaan pemeriksaan HbA1c; segera datang bila muncul gejala hipoglikemia berulang, luka pada kaki, demam, muntah, atau penurunan kesadaran',
      'Saat sakit (sick day rules): jangan menghentikan obat antidiabetik sendiri, perbanyak cairan, periksa glukosa lebih sering, dan segera ke fasilitas kesehatan bila tidak dapat makan-minum atau muntah terus-menerus',
    ],
    komplikasi: [
      'Akut: ketoasidosis diabetik, status hiperglikemik hiperosmolar, dan hipoglikemia akibat terapi',
      'Mikrovaskular: retinopati hingga kebutaan, nefropati hingga penyakit ginjal tahap akhir, dan neuropati perifer maupun otonom',
      'Makrovaskular: penyakit jantung koroner, stroke, dan penyakit arteri perifer',
      'Kaki diabetik dengan ulkus, infeksi, hingga amputasi; serta kerentanan terhadap infeksi termasuk tuberkulosis',
    ],
    prognosis:
      'Penyakit bersifat kronik progresif namun komplikasi sangat dapat dicegah. Kendali glikemik, tekanan darah, dan lipid secara simultan terbukti menurunkan kejadian komplikasi mikrovaskular dan makrovaskular secara bermakna. Prognosis paling ditentukan oleh kepatuhan jangka panjang, pengendalian faktor risiko kardiovaskular, dan keteraturan skrining komplikasi.',
    referensi: ['SKDI2012', 'PERKENI2021', 'ADA2024', 'PAPDI2014', 'HARRISON2022'],
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
    definisi: 'Keadaan kurang gizi akibat asupan energi dan protein yang tidak mencukupi kebutuhan dalam waktu lama, mencakup spektrum marasmus (defisiensi energi dominan), kwashiorkor (defisiensi protein dominan dengan edema), dan marasmik-kwashiorkor; merupakan penyebab tersembunyi di balik hampir separuh kematian balita karena memperberat hampir semua penyakit infeksi.',
    anamnesis: {
      keluhanUtama: 'Anak sangat kurus dan tidak mau makan sejak beberapa bulan, atau bengkak pada kedua punggung kaki.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES yang disesuaikan. Site: pada kwashiorkor, EDEMA dimulai simetris dari punggung kaki lalu naik ke tungkai, wajah, hingga seluruh tubuh; pada marasmus tampak kekurusan menyeluruh terutama pada bokong dan lengan. Onset: berlangsung perlahan berbulan-bulan — tanyakan kapan orang tua pertama kali menyadari anak makin kurus atau bengkak. Character: nafsu makan menurun atau justru hilang sama sekali (nafsu makan yang sangat buruk merupakan tanda bahaya dan indikasi rawat inap), anak tampak lemah, rewel atau justru terlalu diam dan apatis. Radiation: gali penyakit penyerta yang memperberat — diare berulang, batuk lama, demam berulang, dan luka yang tidak sembuh. Associations: rambut menipis dan berubah warna menjadi kemerahan atau mudah dicabut tanpa nyeri, kulit bersisik atau mengelupas, perut membuncit, serta anak tampak lebih tua dari usianya. Time course: apakah berat badan pernah turun atau tidak naik selama beberapa bulan berturut-turut — periksa langsung grafik pada buku KIA/KMS. Exacerbating: episode diare atau infeksi yang memicu penurunan berat badan tajam, penyapihan mendadak, dan kondisi ekonomi yang memburuk. Severity: apakah anak masih mau menyusu atau makan, masih bisa duduk dan bermain, atau sudah terlalu lemah.',
      riwayatPenyakitDahulu:
        'Riwayat diare berulang atau persisten, tuberkulosis, campak, infeksi saluran napas berulang, HIV, kelainan jantung bawaan, celah bibir dan langit-langit yang mengganggu menyusu, serta riwayat rawat inap sebelumnya karena gizi buruk.',
      riwayatPenyakitKeluarga: 'Riwayat tuberkulosis pada anggota serumah, HIV pada ibu, dan status gizi saudara kandung — anak lain dalam keluarga yang juga kurus menandakan masalah pada tingkat rumah tangga, bukan hanya individu.',
      riwayatPengobatan: 'Obat cacing terakhir, vitamin A terakhir, suplementasi zat besi, obat tuberkulosis, dan pengobatan tradisional yang pernah diberikan termasuk pantangan makanan yang dianjurkan orang lain.',
      riwayatAlergi: 'Riwayat alergi susu sapi atau makanan lain yang menyebabkan orang tua membatasi asupan anak.',
      riwayatKehamilanPersalinan:
        'Berat badan lahir (berat lahir rendah merupakan faktor risiko kuat), usia kehamilan saat lahir, kondisi gizi dan penyakit ibu selama hamil, serta riwayat persalinan dan komplikasinya.',
      riwayatTumbuhKembang:
        'Riwayat kenaikan berat badan pada buku KIA/KMS — kapan grafik mulai mendatar atau menurun; capaian milestone motorik, bahasa, dan sosial dibanding usia, karena gizi buruk kronik berdampak pada perkembangan kognitif yang sebagiannya tidak dapat dipulihkan.',
      riwayatNutrisi:
        'Ini merupakan bagian TERPENTING pada kasus gizi buruk. Apakah mendapat inisiasi menyusu dini dan ASI eksklusif enam bulan; kapan dan bagaimana MPASI dimulai termasuk jenis, tekstur, frekuensi, serta porsi; kapan disapih dan bagaimana caranya; berapa kali makan sehari saat ini dan seberapa banyak yang benar-benar dihabiskan; apakah anak makan sendiri atau disuapi; penggunaan susu formula beserta cara pengenceran (pengenceran berlebihan untuk berhemat merupakan penyebab yang sering luput); serta kepercayaan atau pantangan makanan yang dianut keluarga.',
      riwayatImunisasi: 'Kelengkapan imunisasi sesuai usia, terutama campak yang bila terlewat sangat meningkatkan risiko gizi buruk berat, serta riwayat pemberian kapsul vitamin A.',
      riwayatSosialEkonomi:
        'Penghasilan dan pekerjaan orang tua, jumlah anggota keluarga dan anak yang harus diberi makan, ketahanan pangan rumah tangga, sumber air bersih dan jamban, pengasuh utama anak sehari-hari, tingkat pendidikan ibu, akses ke posyandu dan puskesmas, serta kepesertaan dalam program bantuan pangan — informasi ini menentukan apakah pemulihan dapat dipertahankan setelah anak pulang.',
    },
    pemeriksaanFisik: [
      'Nilai KEADAAN UMUM dan tanda bahaya lebih dahulu: letargi atau tidak sadar, kejang, dehidrasi, hipotermia, hipoglikemia, dan tanda syok — semuanya mengancam nyawa dan harus ditangani sebelum yang lain',
      'MARASMUS: tampak sangat kurus, wajah seperti orang tua (old man face), iga gambang, atrofi otot, dan kulit longgar pada bokong menyerupai celana longgar (baggy pants); anak umumnya masih tampak lapar',
      'KWASHIORKOR: EDEMA BILATERAL yang menekan meninggalkan cekungan (pitting) dimulai dari punggung kaki, rambut kemerahan mudah dicabut tanpa nyeri dengan tanda bendera (flag sign), dermatosis berupa kulit mengelupas seperti cat retak (crazy pavement dermatosis), hepatomegali akibat perlemakan hati, wajah sembab (moon face), dan anak apatis serta menolak makan',
      'Ukur LINGKAR LENGAN ATAS pada anak usia 6-59 bulan sebagai penapisan cepat yang tidak memerlukan pengukuran tinggi badan',
      'UJI NAFSU MAKAN dengan memberikan makanan terapeutik siap saji — hasil uji ini menentukan apakah anak dapat dirawat jalan atau harus dirawat inap',
      'Cari tanda defisiensi mikronutrien: bercak Bitot dan kekeruhan kornea pada defisiensi vitamin A (KEDARURATAN mata), stomatitis angularis, glositis, dan pucat pada anemia',
      'Cari fokus infeksi secara teliti: telinga, tenggorok, paru, kulit, dan saluran kemih — pada gizi buruk, infeksi sering TANPA DEMAM dan tanpa leukositosis karena respons imun tertekan',
      'Periksa suhu tubuh dengan termometer yang mampu membaca suhu rendah — hipotermia sering terjadi dan mudah terlewat',
    ],
    antropometri:
      'Timbang berat badan dengan timbangan yang ditera dan anak berpakaian minimal; ukur panjang badan berbaring untuk anak kurang dari 24 bulan atau tinggi badan berdiri untuk anak 24 bulan ke atas. Plot pada kurva WHO untuk memperoleh tiga indeks. Pertama, BERAT BADAN MENURUT UMUR (BB/U) menilai berat kurang (underweight) namun tidak dapat membedakan apakah masalahnya akut atau kronik. Kedua, TINGGI BADAN MENURUT UMUR (TB/U) menilai stunting yang mencerminkan kekurangan gizi KRONIK berkepanjangan. Ketiga, BERAT BADAN MENURUT TINGGI BADAN (BB/TB) menilai wasting yang mencerminkan kekurangan gizi AKUT dan merupakan indeks paling menentukan untuk diagnosis serta tatalaksana gizi buruk. Ambang standar deviasi: nilai -2 sampai +1 berarti normal; kurang dari -2 sampai -3 berarti gizi kurang atau wasting sedang; dan KURANG DARI -3 berarti GIZI BURUK atau wasting berat. Lingkar lengan atas pada anak 6-59 bulan: kurang dari 11,5 cm menandakan gizi buruk, 11,5 sampai kurang dari 12,5 cm menandakan gizi kurang. Pada dewasa gunakan indeks massa tubuh dengan ambang kurang dari 18,5 kg/m² sebagai berat kurang. Perlu diingat bahwa pada KWASHIORKOR, edema menambah berat badan sehingga BB/TB dapat tampak normal atau bahkan tinggi dan MENYESATKAN — karena itu adanya edema bilateral pitting dengan sendirinya sudah menegakkan gizi buruk tanpa memandang hasil pengukuran berat badan.',
    penunjang: [
      'Gula darah SEGERA — hipoglikemia sangat sering, sering tanpa gejala khas, dan merupakan penyebab kematian dini pada gizi buruk',
      'Darah lengkap untuk menilai anemia dan tanda infeksi; ingat leukosit dapat NORMAL meski terdapat infeksi berat karena respons imun tertekan',
      'Elektrolit termasuk kalium, magnesium, natrium, dan FOSFAT — fosfat penting untuk mengantisipasi sindrom refeeding',
      'Gula darah, ureum, kreatinin, dan albumin; albumin rendah mendukung kwashiorkor namun bukan syarat diagnosis',
      'Skrining infeksi sesuai kecurigaan: urinalisis dan kultur urin, foto toraks, uji tuberkulin atau tes cepat molekuler untuk tuberkulosis, apus darah untuk malaria pada daerah endemis, dan tes HIV dengan konseling',
      'Pemeriksaan tinja untuk parasit',
      'Pantau berat badan HARIAN selama perawatan dan lingkar lengan atas secara berkala sebagai indikator respons terapi',
    ],
    etiologi:
      'Penyebab langsung adalah asupan gizi tidak adekuat dan penyakit infeksi yang saling memperberat. Penyebab tidak langsung meliputi ketahanan pangan rumah tangga yang rendah, pola asuh dan pemberian makan yang kurang tepat, serta akses terbatas terhadap air bersih, sanitasi, dan pelayanan kesehatan.',
    patofisiologi:
      'Ketika asupan energi tidak mencukupi, tubuh melakukan ADAPTASI REDUKTIF: laju metabolisme basal diturunkan, cadangan lemak dan protein otot dipecah untuk bahan bakar, fungsi jantung dan ginjal menurun, pompa natrium-kalium melemah sehingga natrium tertahan di dalam sel sementara kalium keluar dan terbuang lewat urin, serta produksi panas berkurang sehingga anak mudah hipotermia. Cadangan glikogen hati yang minim menyebabkan hipoglikemia cepat terjadi bila anak tidak makan beberapa jam. Sistem imun tertekan sehingga infeksi sering berjalan tanpa demam dan tanpa leukositosis, membuatnya mudah terlewat. Pada kwashiorkor, hipoalbuminemia menurunkan tekanan onkotik plasma sehingga cairan berpindah ke jaringan interstisial dan menimbulkan edema; stres oksidatif serta kebocoran kapiler turut berperan. Adaptasi reduktif inilah yang menjelaskan mengapa pemberian makan yang terlalu cepat dan terlalu banyak justru berbahaya: masuknya karbohidrat memicu lonjakan insulin yang mendorong fosfat, kalium, dan magnesium masuk ke dalam sel secara masif, sementara jantung yang sudah mengecil dan lemah tidak mampu menangani beban cairan dan elektrolit yang meningkat — inilah SINDROM REFEEDING yang dapat menimbulkan gagal jantung, aritmia, dan kematian mendadak pada anak yang tampak sedang membaik. Prinsip inilah yang mendasari seluruh tatalaksana bertahap dengan F-75 pada fase stabilisasi sebelum beralih ke F-100 pada fase rehabilitasi.',
    faktorRisiko: [
      'Berat lahir rendah dan prematuritas',
      'Tidak mendapat ASI eksklusif serta MPASI yang terlambat, tidak adekuat, atau tidak higienis',
      'Penyapihan mendadak dan pengenceran susu formula berlebihan',
      'Diare berulang, tuberkulosis, HIV, campak, dan infeksi kronik lain',
      'Kemiskinan, ketahanan pangan rumah tangga rendah, dan jumlah anak banyak',
      'Pendidikan ibu rendah dan pola asuh yang kurang tepat',
      'Sanitasi buruk dan air bersih tidak tersedia',
      'Imunisasi tidak lengkap dan tidak rutin ke posyandu',
      'Kelainan bawaan yang mengganggu asupan seperti celah bibir dan langit-langit serta penyakit jantung bawaan',
    ],
    goldStandard:
      'Gizi buruk pada anak 6-59 bulan ditegakkan bila terdapat salah satu dari: berat badan menurut tinggi badan KURANG DARI -3 standar deviasi kurva WHO, lingkar lengan atas KURANG DARI 11,5 cm, atau EDEMA BILATERAL PITTING pada kedua punggung kaki tanpa memandang hasil antropometri lain. Penentuan rawat inap atau rawat jalan didasarkan pada ada tidaknya komplikasi medis, hasil uji nafsu makan, dan adanya edema berat.',
    diagnosisBanding: [
      'Edema akibat sindrom nefrotik — edema dimulai dari wajah dan kelopak mata terutama pagi hari, disertai proteinuria masif pada urinalisis',
      'Edema akibat gagal jantung — disertai sesak, takikardia, hepatomegali dengan refluks hepatojugular, dan ronki paru',
      'Edema akibat penyakit hati kronik — disertai asites menonjol, ikterik, dan tanda hipertensi portal',
      'Enteropati kehilangan protein dan sindrom malabsorpsi seperti penyakit seliak — diare kronik dengan tinja berlemak',
      'Tuberkulosis dan HIV sebagai penyakit dasar yang bermanifestasi sebagai gagal tumbuh — harus dicari, bukan sekadar dibedakan',
      'Keganasan dan penyakit ginjal kronik pada anak dengan penurunan berat badan progresif',
    ],
    pengkajian:
      'Dipikirkan gizi buruk pada anak ini atas dasar tampilan sangat kurus dengan atrofi otot dan kulit longgar pada bokong, disertai berat badan menurut tinggi badan kurang dari -3 standar deviasi serta lingkar lengan atas kurang dari 11,5 cm, pada latar riwayat pemberian makan yang tidak adekuat, penyapihan dini, dan diare berulang dengan grafik berat badan pada KMS yang mendatar sejak beberapa bulan. Bila dijumpai edema bilateral pitting pada kedua punggung kaki, maka gambaran mengarah pada kwashiorkor dan diagnosis gizi buruk tetap ditegakkan meski berat badan menurut tinggi badan tampak tidak terlalu rendah — hal ini penting karena edema menambah berat badan sehingga hasil antropometri dapat menyesatkan dan berisiko membuat klinisi meremehkan beratnya kondisi. Edema pada anak ini perlu dibedakan dari sindrom nefrotik yang khasnya dimulai dari kelopak mata dan wajah pada pagi hari dengan proteinuria masif pada urinalisis, dari gagal jantung yang disertai sesak, takikardia, serta hepatomegali dengan ronki paru, dan dari penyakit hati kronik yang menonjol dengan asites, ikterik, serta tanda hipertensi portal. Yang tidak boleh dilewatkan adalah PENCARIAN PENYAKIT DASAR — tuberkulosis, HIV, dan infeksi kronik lain sangat sering menjadi penyebab di balik gizi buruk, dan tanpa mengobatinya perbaikan gizi tidak akan bertahan. Perlu ditekankan pula bahwa pada anak ini infeksi dapat berjalan TANPA DEMAM DAN TANPA LEUKOSITOSIS akibat imunitas yang tertekan, sehingga antibiotik diberikan secara empiris pada semua kasus gizi buruk dengan komplikasi meski tidak ditemukan tanda infeksi yang jelas. Prioritas tatalaksana pada fase awal bukanlah menaikkan berat badan secepatnya, melainkan mencegah kematian akibat hipoglikemia, hipotermia, dehidrasi, gangguan elektrolit, dan infeksi — sebab pemberian makan yang terlalu agresif pada tubuh yang telah beradaptasi secara reduktif justru dapat memicu sindrom refeeding yang fatal.',
    terapiSuportif: [
      'FASE STABILISASI (hari 1-7) menggunakan F-75 yang mengandung 75 kkal dan 0,9 gram protein per 100 mL, diberikan 130 mL/kgBB/hari terbagi dalam 8-12 kali pemberian (setiap 2-3 jam termasuk malam hari) — target pada fase ini adalah MEMPERTAHANKAN, bukan menaikkan berat badan',
      'FASE TRANSISI (hari 8-14) mengganti F-75 dengan F-100 yang mengandung 100 kkal dan 2,9 gram protein per 100 mL secara bertahap, dengan pemantauan ketat tanda kelebihan cairan',
      'FASE REHABILITASI (minggu 3-6) dengan F-100 atau makanan terapeutik siap saji hingga 150-220 kkal/kgBB/hari dan protein 4-6 gram/kgBB/hari untuk mengejar pertumbuhan; kenaikan berat badan yang baik adalah 10 gram/kgBB/hari atau lebih',
      'Cairan pada gizi buruk diberikan dengan SANGAT HATI-HATI: gunakan ReSoMal 5 mL/kgBB setiap 30 menit selama 2 jam pertama lalu 5-10 mL/kgBB per jam berselang-seling dengan F-75; cairan intravena HANYA untuk syok karena risiko gagal jantung sangat tinggi',
      'JANGAN gunakan oralit standar karena kandungan natriumnya terlalu tinggi dan kaliumnya terlalu rendah untuk kondisi gizi buruk',
      'Pantau tanda kelebihan cairan setiap jam selama rehidrasi: frekuensi napas dan nadi yang meningkat, munculnya ronki, pembesaran hati, dan edema yang bertambah — hentikan cairan bila muncul',
      'Target produksi urin adekuat dengan pemantauan berat badan harian; kenaikan berat badan yang terlalu cepat pada fase awal justru mencurigakan sebagai retensi cairan',
      'Jaga kehangatan: selimuti anak termasuk kepala, rawat dengan metode kanguru bila memungkinkan, hindari mandi terlalu lama, dan ukur suhu berkala',
    ],
    tatalaksana: [
      'SEPULUH LANGKAH TATALAKSANA GIZI BURUK menurut WHO, dikerjakan berurutan. Langkah 1: atasi dan cegah HIPOGLIKEMIA dengan pemberian F-75 segera atau larutan glukosa 10% bila kadar gula rendah, lalu lanjutkan pemberian setiap 2-3 jam termasuk malam hari',
      'Langkah 2: atasi dan cegah HIPOTERMIA dengan menghangatkan anak dan memberi makan teratur',
      'Langkah 3: atasi DEHIDRASI dengan ReSoMal secara oral atau melalui pipa nasogastrik; hindari jalur intravena kecuali syok',
      'Langkah 4: koreksi GANGGUAN ELEKTROLIT — berikan kalium dan magnesium tambahan, serta JANGAN memberi diuretik untuk mengatasi edema kwashiorkor karena edema disebabkan hipoalbuminemia bukan kelebihan cairan',
      'Langkah 5: obati INFEKSI dengan antibiotik empiris pada SEMUA anak gizi buruk dengan komplikasi meski tanpa demam — amoksisilin oral pada kasus tanpa komplikasi, atau ampisilin dan gentamisin parenteral pada kasus dengan komplikasi',
      'Langkah 6: koreksi DEFISIENSI MIKRONUTRIEN — berikan vitamin A sesuai usia, asam folat, seng, dan multivitamin; TUNDA PEMBERIAN ZAT BESI hingga fase rehabilitasi karena besi bebas pada fase awal memperberat infeksi dan stres oksidatif',
      'Langkah 7: mulai PEMBERIAN MAKAN secara hati-hati dengan F-75',
      'Langkah 8: fasilitasi TUMBUH KEJAR dengan F-100 atau makanan terapeutik siap saji',
      'Langkah 9: berikan STIMULASI SENSORIK dan dukungan emosional melalui bermain, kasih sayang, dan keterlibatan ibu — malnutrisi berdampak pada perkembangan otak sehingga stimulasi merupakan bagian terapi, bukan pelengkap',
      'Langkah 10: siapkan TINDAK LANJUT setelah pulang dengan konseling gizi kepada keluarga dan penjadwalan kontrol',
      'Cari dan obati PENYAKIT DASAR: tuberkulosis, HIV, infeksi cacing (obat cacing diberikan pada fase rehabilitasi), dan kelainan bawaan',
      'Kriteria rawat inap: usia kurang dari 6 bulan, adanya komplikasi medis, edema berat, atau uji nafsu makan yang buruk; selebihnya dapat dirawat jalan dengan makanan terapeutik siap saji dan pemantauan mingguan',
      'Kriteria sembuh: berat badan menurut tinggi badan mencapai -2 standar deviasi atau lebih, edema hilang selama minimal dua minggu, dan nafsu makan pulih',
    ],
    edukasi: [
      'Penjadwalan makan: berikan makanan porsi KECIL namun SERING, minimal 5-6 kali sehari, karena lambung anak gizi buruk mengecil dan tidak mampu menampung porsi besar sekaligus; jangan memaksa anak menghabiskan porsi besar dalam satu waktu',
      'Porsi dan komposisi setelah pulih: gunakan prinsip isi piringku dengan makanan pokok, lauk hewani yang diutamakan karena protein hewani lebih lengkap asam aminonya, lauk nabati, sayur, dan buah; tambahkan minyak atau santan pada makanan anak untuk meningkatkan kepadatan energi tanpa menambah volume',
      'Lanjutkan ASI hingga usia dua tahun bila masih menyusu; jangan mengencerkan susu formula untuk berhemat karena justru menyebabkan anak kekurangan kalori',
      'Tidur: pastikan anak tidur cukup sesuai usia, sekitar 11-14 jam per hari termasuk tidur siang pada balita, karena hormon pertumbuhan bekerja optimal saat tidur',
      'Pola aktivitas dan stimulasi: ajak anak bermain dan berinteraksi setiap hari sesuai kemampuannya; aktivitas fisik ditingkatkan bertahap seiring pemulihan tenaga — pada fase awal anak masih terlalu lemah dan istirahat lebih diutamakan',
      'Higiene dan pencegahan infeksi: cuci tangan pakai sabun sebelum menyiapkan makanan dan menyuapi anak, gunakan air matang, dan jaga kebersihan alat makan — karena setiap episode diare akan menghapus kemajuan berat badan yang sudah dicapai',
      'Lengkapi imunisasi, berikan kapsul vitamin A sesuai jadwal, dan berikan obat cacing berkala',
      'TIMBANG ANAK SETIAP BULAN DI POSYANDU dan pastikan grafik pada buku KIA terus naik mengikuti pita warnanya — grafik yang mendatar dua bulan berturut-turut merupakan tanda bahaya yang harus segera dikonsultasikan, jauh sebelum anak tampak kurus',
      'Kontrol setiap minggu pada bulan pertama setelah pulang, lalu setiap dua minggu, kemudian bulanan hingga status gizi pulih dan bertahan',
      'SEGERA kembali bila anak tidak mau makan atau minum, muntah terus, diare, demam, bengkak bertambah, sesak, atau tampak makin lemah',
      'Luruskan mitos dan pantangan makanan yang membatasi telur, ikan, dan protein hewani — justru bahan inilah yang paling dibutuhkan anak untuk pulih',
    ],
    komplikasi: [
      'Hipoglikemia dan hipotermia yang merupakan penyebab kematian dini',
      'SINDROM REFEEDING dengan hipofosfatemia, hipokalemia, gagal jantung, dan aritmia akibat pemberian makan terlalu cepat',
      'Sepsis dan syok septik dengan tanda yang samar karena respons imun tertekan',
      'Dehidrasi berat serta gangguan elektrolit termasuk hipokalemia dan hipomagnesemia',
      'Anemia berat dan gagal jantung akibat kelebihan cairan atau transfusi yang terlalu cepat',
      'Defisiensi vitamin A dengan xeroftalmia hingga kebutaan permanen',
      'Gangguan pertumbuhan menetap berupa stunting dan hambatan perkembangan kognitif yang sebagian bersifat ireversibel',
    ],
    prognosis:
      'Dengan tatalaksana sepuluh langkah yang benar, angka kematian dapat ditekan di bawah 5%, namun tanpa penanganan yang tepat mortalitas gizi buruk berkomplikasi dapat mencapai 20-30%. Kematian paling sering terjadi pada 48-72 jam pertama akibat hipoglikemia, hipotermia, dan infeksi yang tidak terdeteksi, atau pada minggu pertama akibat sindrom refeeding. Pemulihan berat badan umumnya baik, tetapi dampak terhadap tinggi badan akhir dan perkembangan kognitif bergantung pada usia saat kejadian dan lamanya kekurangan gizi berlangsung — pada anak di bawah dua tahun sebagian hambatan kognitif bersifat menetap, sehingga PENCEGAHAN melalui pemantauan pertumbuhan rutin di posyandu jauh lebih menentukan daripada pengobatan.',
    referensi: ['SKDI2012', 'WHOSAM2013', 'PPKFKTP2014', 'HARRISON2022'],
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
    definisi: 'Penyakit infeksi akibat virus dengue (serotipe DEN-1 sampai DEN-4) yang ditularkan nyamuk Aedes aegypti, dengan spektrum dari demam dengue tanpa komplikasi hingga demam berdarah dengue yang ditandai kebocoran plasma dan sindrom syok dengue.',
    anamnesis: {
      keluhanUtama: 'Demam tinggi mendadak sejak beberapa hari, disertai nyeri kepala, nyeri di belakang mata, dan nyeri seluruh badan.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: nyeri kepala di regio frontal dan retro-orbital, disertai mialgia dan artralgia menyeluruh yang khas disebut breakbone fever. Onset: demam timbul MENDADAK tinggi, bukan bertahap seperti demam tifoid. Character: demam terus-menerus, nyeri terasa pegal menusuk hingga ke tulang. Radiation: nyeri menyebar ke seluruh otot dan sendi. Associations: mual, muntah, nyeri perut, ruam kulit, serta manifestasi perdarahan berupa bintik merah di kulit, mimisan, gusi berdarah, muntah hitam, atau tinja hitam. Time course: HITUNG HARI DEMAM dengan tepat karena menentukan fase penyakit — fase demam hari 1-3, FASE KRITIS hari 4-6 saat demam mulai turun, dan fase penyembuhan setelahnya. Exacerbating: penurunan asupan cairan memperberat perjalanan penyakit. Severity: gali tanda bahaya (warning signs) secara aktif — nyeri perut hebat dan terus-menerus, muntah persisten, perdarahan mukosa, letargi atau gelisah, pembesaran hati, penurunan produksi urin, dan tangan-kaki teraba dingin.',
      riwayatPenyakitDahulu:
        'Riwayat pernah menderita demam berdarah sebelumnya sangat penting — infeksi sekunder oleh serotipe berbeda meningkatkan risiko DBD berat melalui mekanisme antibody-dependent enhancement. Tanyakan pula komorbid yang memperburuk prognosis: diabetes, penyakit ginjal, penyakit jantung, obesitas, thalassemia, dan tukak lambung.',
      riwayatPenyakitKeluarga: 'Adakah anggota keluarga atau tetangga yang menderita demam berdarah dalam 1-2 minggu terakhir — mendukung adanya penularan setempat.',
      riwayatPengobatan:
        'Obat yang sudah diminum sebelum datang, terutama ASPIRIN dan obat antiinflamasi nonsteroid yang meningkatkan risiko perdarahan dan harus dihentikan; tanyakan pula penggunaan antikoagulan dan kortikosteroid.',
      riwayatAlergi: 'Riwayat alergi obat sebelum pemberian terapi.',
      riwayatSosialEkonomi:
        'Lingkungan tempat tinggal: keberadaan genangan air, bak mandi, vas bunga, ban bekas, dan tempat penampungan air yang menjadi tempat perindukan nyamuk; riwayat fogging di lingkungan; kebiasaan menguras bak; riwayat bepergian ke daerah endemis; dan akses ke fasilitas kesehatan bila terjadi perburukan.',
    },
    pemeriksaanFisik: [
      'Tanda vital lengkap dengan penekanan pada TEKANAN NADI — penyempitan menjadi 20 mmHg atau kurang merupakan tanda syok dini yang sering mendahului penurunan tekanan sistolik',
      'Nilai perfusi: akral dingin, capillary refill time lebih dari 2 detik, nadi cepat dan lemah, produksi urin menurun',
      'Uji tourniquet (Rumple Leede): pasang manset pada tekanan antara sistolik dan diastolik selama 5 menit, dinyatakan positif bila timbul 10 petekie atau lebih dalam area 1 inci persegi',
      'Kulit: petekie, purpura, ekimosis, dan ruam konvalesens berupa eritema konfluens dengan pulau-pulau kulit normal (islands of white in a sea of red) pada fase penyembuhan',
      'Perdarahan mukosa: epistaksis, perdarahan gusi, hematemesis, melena',
      'Abdomen: nyeri tekan epigastrium dan hipokondrium kanan, HEPATOMEGALI yang nyeri, serta tanda asites berupa shifting dullness',
      'Toraks: nilai efusi pleura melalui perkusi redup dan penurunan suara napas basal, umumnya sisi kanan',
      'Status kesadaran dan tanda ensefalopati dengue pada kasus berat',
    ],
    penunjang: [
      'Darah lengkap SERIAL minimal dua kali sehari pada fase kritis: leukopenia sering mendahului fase kritis; TROMBOSITOPENIA kurang dari 100.000/µL; dan PENINGKATAN HEMATOKRIT 20% atau lebih dari nilai dasar sebagai penanda kebocoran plasma',
      'Penurunan hematokrit setelah pemberian cairan menandakan respons baik; penurunan hematokrit disertai perburukan klinis justru mencurigakan perdarahan internal',
      'NS1 antigen positif pada hari 1-3 demam; IgM dan IgG dengue mulai terdeteksi setelah hari ke-5',
      'Albumin serum menurun dan transaminase (SGOT lebih dominan daripada SGPT) meningkat sebagai penanda kebocoran plasma dan keterlibatan hati',
      'USG abdomen atau rontgen toraks lateral dekubitus kanan untuk mendeteksi asites dan efusi pleura sebagai bukti objektif kebocoran plasma',
      'Pada kasus berat: analisis gas darah, elektrolit, gula darah, dan profil koagulasi untuk menilai asidosis dan koagulopati',
    ],
    etiologi:
      'Virus dengue, anggota famili Flaviviridae, dengan empat serotipe yang ditularkan melalui gigitan nyamuk Aedes aegypti dan Aedes albopictus yang aktif menggigit pada pagi dan sore hari.',
    patofisiologi:
      'Setelah masa inkubasi 4-10 hari, virus bereplikasi dan memicu respons imun yang melepaskan sitokin proinflamasi secara masif. Sitokin ini meningkatkan permeabilitas endotel kapiler sehingga plasma merembes ke rongga interstisial, pleura, dan peritoneum — inilah kebocoran plasma yang membedakan demam berdarah dengue dari demam dengue biasa. Kebocoran memuncak pada fase kritis, yaitu saat suhu tubuh justru mulai turun, dan berlangsung sekitar 24-48 jam. Hemokonsentrasi terjadi karena plasma keluar sementara sel darah tetap di intravaskular, sehingga hematokrit meningkat. Trombositopenia terjadi akibat supresi sumsum tulang, destruksi trombosit oleh mekanisme imun, dan peningkatan konsumsi. Bila kebocoran tidak dikompensasi dengan cairan yang adekuat, volume intravaskular menurun hingga terjadi syok hipovolemik. Pada infeksi sekunder oleh serotipe berbeda, antibodi non-netralisasi dari infeksi sebelumnya justru memfasilitasi masuknya virus ke sel melalui reseptor Fc, memperbesar beban virus dan respons sitokin.',
    faktorRisiko: [
      'Tinggal atau bepergian ke daerah endemis dengue',
      'Musim hujan dan lingkungan dengan banyak tempat perindukan nyamuk',
      'Infeksi dengue sekunder oleh serotipe berbeda',
      'Usia anak dan bayi, serta usia lanjut',
      'Komorbid: diabetes, obesitas, penyakit ginjal, thalassemia, tukak peptik',
      'Kehamilan',
    ],
    diagnosis: [
      'Demam akut mendadak 2-7 hari disertai minimal dua gejala: nyeri kepala, nyeri retro-orbital, mialgia, artralgia, ruam, atau manifestasi perdarahan',
      'Uji tourniquet positif (≥10 petekie per inci persegi) atau perdarahan spontan',
      'Trombositopenia kurang dari 100.000/µL',
      'Bukti kebocoran plasma: peningkatan hematokrit ≥20%, efusi pleura, asites, atau hipoalbuminemia — inilah pembeda DBD dari demam dengue biasa',
      'Tentukan FASE penyakit dari hitungan hari demam; fase kritis pada hari 4-6 saat demam mulai turun',
    ],
    goldStandard:
      'Konfirmasi laboratorium melalui deteksi NS1 antigen atau RNA virus dengan RT-PCR pada fase akut (hari 1-5), atau serokonversi IgM dengue maupun kenaikan titer IgG empat kali lipat pada sampel berpasangan setelah hari kelima. Secara klinis, demam berdarah dengue ditegakkan bila terdapat demam akut 2-7 hari, kecenderungan perdarahan (minimal uji tourniquet positif), trombositopenia kurang dari 100.000/µL, DAN bukti kebocoran plasma berupa peningkatan hematokrit 20% atau lebih, efusi pleura, asites, atau hipoalbuminemia.',
    diagnosisBanding: [
      'Demam tifoid — demam naik bertahap seperti anak tangga dan lebih tinggi sore-malam, bradikardia relatif, lidah kotor tepi hiperemis, tanpa kebocoran plasma',
      'Malaria — demam periodik dengan menggigil dan berkeringat, splenomegali, parasit pada apus darah',
      'Chikungunya — artralgia jauh lebih menonjol dan dapat menetap berbulan-bulan, kebocoran plasma tidak terjadi',
      'Leptospirosis — nyeri betis, injeksi konjungtiva, ikterik, riwayat kontak air banjir',
      'Sepsis bakterial dan infeksi virus lain, serta demam pada kondisi hematologi seperti leukemia akut',
    ],
    pengkajian:
      'Dipikirkan demam berdarah dengue pada pasien ini atas dasar demam tinggi yang timbul mendadak selama beberapa hari disertai nyeri kepala retro-orbital, mialgia, dan artralgia yang khas, ditambah manifestasi perdarahan berupa petekie dengan uji tourniquet positif, pada latar lingkungan tempat tinggal yang endemis dan adanya kasus serupa di sekitar rumah. Temuan trombositopenia bersama peningkatan hematokrit dan hipoalbuminemia menunjukkan telah terjadi kebocoran plasma, yang secara konseptual merupakan pembeda utama demam berdarah dengue dari demam dengue biasa; bukti ini diperkuat bila ditemukan efusi pleura atau asites pada pencitraan. Diagnosis banding demam tifoid dipertimbangkan karena sama-sama menimbulkan demam berkepanjangan, namun pada tifoid demam naik secara bertahap dengan pola anak tangga dan memuncak pada sore hingga malam hari, disertai lidah kotor dengan tepi hiperemis dan bradikardia relatif, serta tidak disertai hemokonsentrasi maupun kebocoran plasma. Malaria disingkirkan karena tidak dijumpai pola demam periodik dengan fase menggigil dan berkeringat yang jelas maupun splenomegali, dan apus darah tebal tidak menunjukkan parasit. Chikungunya menjadi pertimbangan karena kemiripan gejala nyeri sendi, namun pada chikungunya artralgia jauh mendominasi gambaran klinis dan tidak terjadi kebocoran plasma maupun syok. Leptospirosis dipertimbangkan bila terdapat riwayat kontak dengan air banjir, namun tidak ditemukan nyeri tekan otot betis yang khas maupun injeksi konjungtiva. Yang paling menentukan tatalaksana pada kasus ini bukanlah semata penegakan etiologi, melainkan penentuan FASE penyakit berdasarkan hitungan hari demam, sebab fase kritis justru dimulai ketika suhu tubuh mulai turun pada hari keempat hingga keenam — periode saat pasien tampak membaik namun sesungguhnya paling berisiko jatuh ke dalam syok.',
    terapiSuportif: [
      'Kebutuhan cairan rumatan dihitung dengan rumus Holliday-Segar: 100 mL/kg untuk 10 kg pertama, ditambah 50 mL/kg untuk 10 kg berikutnya, ditambah 20 mL/kg untuk sisa berat badan',
      'Pada dewasa dan anak besar dapat digunakan perhitungan berdasarkan berat badan ideal; cairan pilihan adalah kristaloid isotonik seperti ringer laktat atau NaCl 0,9%',
      'Target PRODUKSI URIN 0,5-1 mL/kg/jam sebagai penanda perfusi yang paling praktis dipantau — pasang kateter pada kasus syok untuk pemantauan ketat',
      'Pantau tanda vital, tekanan nadi, capillary refill, hematokrit, dan produksi urin secara berkala; frekuensi pemantauan ditingkatkan pada fase kritis',
      'Cairan diberikan dalam jumlah paling sedikit yang mampu mempertahankan perfusi adekuat — kelebihan cairan menyebabkan edema paru dan distres napas, terutama saat fase reabsorpsi',
      'Nutrisi: diet lunak tinggi kalori dan protein sesuai toleransi, hindari makanan berwarna merah atau cokelat gelap yang dapat mengaburkan penilaian perdarahan saluran cerna',
    ],
    tatalaksana: [
      'Demam dengue tanpa tanda bahaya: rawat jalan dengan cairan oral banyak (oralit, jus, sup), parasetamol 10-15 mg/kgBB per kali maksimal 4 kali sehari untuk demam',
      'HINDARI MUTLAK aspirin, obat antiinflamasi nonsteroid, dan injeksi intramuskular karena meningkatkan risiko perdarahan',
      'Dengan tanda bahaya: rawat inap dan mulai kristaloid intravena 5-7 mL/kg/jam selama 1-2 jam, lalu diturunkan bertahap menjadi 3-5 mL/kg/jam dan 2-3 mL/kg/jam sesuai perbaikan klinis dan hematokrit',
      'Sindrom syok dengue: bolus kristaloid 10-20 mL/kg secepatnya, evaluasi respons dalam 15-30 menit; bila belum membaik ulangi bolus, dan bila tetap tidak respons pertimbangkan koloid serta cari perdarahan tersembunyi',
      'Transfusi darah bila terdapat perdarahan bermakna atau penurunan hematokrit dengan perburukan hemodinamik; TRANSFUSI TROMBOSIT TIDAK diberikan sebagai profilaksis semata berdasarkan angka trombosit rendah tanpa perdarahan aktif',
      'Koreksi gangguan elektrolit, gula darah, dan asidosis pada kasus berat; hindari pemberian kortikosteroid dan imunoglobulin karena tidak terbukti bermanfaat',
      'Kriteria pemulangan: bebas demam minimal 24-48 jam tanpa antipiretik, nafsu makan membaik, klinis stabil, produksi urin cukup, hematokrit stabil, dan trombosit menunjukkan tren naik',
    ],
    edukasi: [
      'FASE KRITIS TERJADI SAAT DEMAM TURUN — jelaskan bahwa suhu yang membaik pada hari keempat hingga keenam bukan berarti sembuh, justru saat itulah pemantauan paling ketat diperlukan. Ini pesan edukasi terpenting pada dengue',
      'Penjadwalan makan: porsi kecil namun sering (5-6 kali sehari) karena mual sering menurunkan nafsu makan; utamakan makanan lunak tinggi kalori dan cairan',
      'Asupan cairan oral ditingkatkan pada pasien rawat jalan: oralit, air kelapa, jus buah, dan sup; hindari cairan berwarna merah atau cokelat gelap agar perdarahan saluran cerna tidak terlewat',
      'Istirahat total dan tidur cukup selama fase demam dan kritis; aktivitas fisik dan olahraga baru dimulai bertahap setelah pemulihan penuh dan trombosit kembali normal, umumnya setelah 1-2 minggu',
      'TANDA BAHAYA yang mengharuskan segera kembali ke fasilitas kesehatan: nyeri perut hebat, muntah terus-menerus, perdarahan dari hidung atau gusi, muntah atau tinja kehitaman, tangan dan kaki dingin, gelisah atau sangat lemas, tidak buang air kecil lebih dari 4-6 jam, dan napas terasa sesak',
      'Kontrol setiap hari pada pasien rawat jalan selama fase demam untuk pemeriksaan darah, dan segera bila muncul tanda bahaya',
      'Pencegahan dengan 3M Plus: menguras tempat penampungan air seminggu sekali, menutup rapat penampungan air, memanfaatkan atau mendaur ulang barang bekas, ditambah penggunaan kelambu, repelan, dan larvasida; libatkan seluruh keluarga dan lingkungan karena nyamuk Aedes menggigit pada pagi dan sore hari',
    ],
    komplikasi: [
      'Sindrom syok dengue dan syok berulang',
      'Perdarahan masif saluran cerna',
      'Kelebihan cairan dengan edema paru dan distres napas',
      'Ensefalopati dengue, miokarditis, dan gangguan fungsi hati berat',
      'Koagulasi intravaskular diseminata pada kasus syok berkepanjangan',
    ],
    prognosis:
      'Sangat baik bila dikenali dan dipantau dengan tepat — angka kematian demam berdarah dengue yang tertangani baik kurang dari 1%, namun dapat mencapai 10-20% pada sindrom syok dengue yang terlambat ditangani. Kunci prognosis bukan pada pemberian obat khusus melainkan pada ketepatan penentuan fase penyakit, pemantauan berkala, dan pemberian cairan yang tepat jumlah dan tepat waktu.',
    referensi: ['SKDI2012', 'WHODENGUE2009', 'PPKFKTP2014', 'PAPDI2014', 'HARRISON2022'],
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
    definisi: 'Reaksi hipersensitivitas sistemik berat yang timbul cepat dan dapat menyebabkan kematian; melibatkan pelepasan mediator sel mast dan basofil secara masif sehingga terjadi obstruksi jalan napas, bronkospasme, dan syok distributif.',
    anamnesis: {
      keluhanUtama: 'Sesak napas, bengkak pada wajah dan bibir, serta bentol gatal di seluruh tubuh yang timbul mendadak setelah terpapar obat, makanan, atau sengatan serangga.',
      riwayatPenyakitSekarang:
        'Anamnesis dilakukan SINGKAT DAN SIMULTAN dengan tindakan — jangan menunda pemberian epinefrin untuk melengkapi riwayat. Site: keluhan bersifat sistemik mengenai kulit, saluran napas, kardiovaskular, dan saluran cerna sekaligus. Onset: MENDADAK, umumnya dalam hitungan menit hingga 2 jam setelah paparan; makin cepat onset makin berat reaksinya. Character: sesak disertai suara mengi atau stridor, rasa tercekik dan sulit menelan, suara serak, gatal pada telapak tangan dan kaki serta kulit kepala, rasa hangat dan kemerahan, serta perasaan akan terjadi sesuatu yang buruk (impending doom). Radiation: bengkak menyebar dari wajah ke bibir, lidah, dan tenggorokan. Associations: mual, muntah, nyeri perut kram, diare, pusing berputar, pandangan gelap, hingga pingsan. Time course: apakah keluhan progresif memberat, dan apakah sempat membaik lalu memberat kembali yang menandakan reaksi bifasik. Exacerbating: posisi berdiri mendadak dapat memicu kolaps kardiovaskular fatal. Severity: nilai berdasarkan keterlibatan jalan napas dan sirkulasi, bukan luas ruam.',
      riwayatPenyakitDahulu:
        'Riwayat reaksi alergi atau anafilaksis sebelumnya beserta pencetusnya, riwayat asma (asma yang tidak terkontrol merupakan faktor risiko anafilaksis fatal), rinitis alergi, dermatitis atopik, dan mastositosis.',
      riwayatPenyakitKeluarga: 'Riwayat atopi dan alergi pada keluarga.',
      riwayatPengobatan:
        'Obat yang baru diminum atau disuntikkan dan waktunya secara TEPAT; penggunaan PENYEKAT BETA dan penghambat ACE penting diketahui karena penyekat beta membuat pasien resisten terhadap epinefrin sehingga memerlukan glukagon.',
      riwayatAlergi:
        'Rincian alergen yang diketahui — obat (antibiotik golongan beta-laktam, obat antiinflamasi nonsteroid, media kontras, relaksan otot), makanan (kacang, seafood, telur, susu), sengatan serangga (tawon, lebah), dan lateks; catat pula jenis reaksi yang timbul sebelumnya.',
      riwayatSosialEkonomi: 'Ketersediaan dan kemampuan menggunakan epinefrin autoinjektor, serta jarak tempat tinggal ke fasilitas kesehatan terdekat.',
    },
    pemeriksaanFisik: [
      'Nilai AIRWAY terlebih dahulu: suara serak, stridor, edema lidah dan uvula, kesulitan menelan air liur — tanda ancaman obstruksi total yang menuntut pengamanan jalan napas segera',
      'Breathing: frekuensi napas, saturasi oksigen, retraksi, wheezing difus akibat bronkospasme',
      'Circulation: takikardia, HIPOTENSI, akral dingin, capillary refill memanjang, nadi lemah',
      'Kulit: urtikaria generalisata, angioedema pada kelopak mata dan bibir, eritema difus, dan rasa hangat — perlu diingat bahwa gejala kulit TIDAK MUNCUL pada sekitar 10-20% kasus anafilaksis sehingga ketiadaannya tidak menyingkirkan diagnosis',
      'Neurologis: gelisah, bingung, penurunan kesadaran akibat hipoperfusi serebral',
      'Cari lokasi sengatan serangga atau bekas suntikan sebagai sumber paparan',
    ],
    penunjang: [
      'Diagnosis anafilaksis adalah DIAGNOSIS KLINIS — tidak ada pemeriksaan penunjang yang boleh menunda pemberian epinefrin',
      'Triptase serum diambil dalam 15 menit sampai 3 jam sejak onset dan dibandingkan dengan kadar basal setelah pemulihan; berguna untuk konfirmasi retrospektif namun hasil normal tidak menyingkirkan diagnosis',
      'Pemeriksaan penunjang lain (darah lengkap, elektrolit, elektrokardiogram, analisis gas darah) dikerjakan setelah stabilisasi untuk menilai komplikasi dan diagnosis banding',
      'Rujukan ke alergi-imunologi untuk uji kulit atau IgE spesifik dilakukan 4-6 minggu setelah episode, bukan pada fase akut',
    ],
    etiologi:
      'Tersering akibat obat (antibiotik beta-laktam, obat antiinflamasi nonsteroid, media kontras beryodium, relaksan otot), makanan (kacang tanah, kacang pohon, seafood, telur, susu, gandum), sengatan serangga ordo Hymenoptera, dan lateks. Sebagian kasus bersifat idiopatik.',
    patofisiologi:
      'Pada mekanisme klasik yang diperantarai IgE, paparan ulang alergen mengikat silang IgE pada permukaan sel mast dan basofil sehingga terjadi degranulasi masif dengan pelepasan histamin, triptase, prostaglandin, leukotrien, dan faktor pengaktif trombosit. Histamin menyebabkan vasodilatasi arteriol dan peningkatan permeabilitas kapiler sehingga plasma keluar ke interstisium — hingga 35% volume plasma dapat berpindah dalam 10 menit, menghasilkan syok distributif sekaligus hipovolemik relatif. Pada saluran napas terjadi edema mukosa laring dan bronkospasme, sedangkan pada jantung terjadi penurunan preload dan depresi miokard langsung. Sebagian reaksi tidak diperantarai IgE (misalnya akibat media kontras atau opioid) melalui aktivasi sel mast langsung, namun gambaran klinis dan tatalaksananya identik. Reaksi bifasik terjadi pada 1-20% kasus, umumnya 1-8 jam setelah reaksi awal mereda, akibat pelepasan mediator fase lambat.',
    faktorRisiko: [
      'Riwayat anafilaksis atau reaksi alergi berat sebelumnya',
      'Asma yang tidak terkontrol — faktor risiko utama anafilaksis fatal',
      'Penyakit atopi lain dan mastositosis',
      'Penggunaan penyekat beta dan penghambat ACE yang memperberat reaksi dan mengurangi respons terapi',
      'Usia remaja dan dewasa muda (perilaku berisiko dan keterlambatan menggunakan autoinjektor)',
      'Pemberian obat secara parenteral dibanding oral',
    ],
    diagnosis: [
      'DIAGNOSIS KLINIS — jangan menunda epinefrin untuk pemeriksaan penunjang apa pun',
      'Onset akut dalam menit hingga beberapa jam setelah paparan alergen',
      'Keterlibatan kulit/mukosa (urtikaria generalisata, angioedema) DISERTAI gangguan respirasi atau penurunan tekanan darah',
      'Atau: hipotensi, bronkospasme, maupun keterlibatan laring setelah paparan alergen yang diketahui, meskipun tanpa gejala kulit',
      'Gejala kulit tidak muncul pada 10-20% kasus sehingga ketiadaannya TIDAK menyingkirkan diagnosis',
    ],
    goldStandard:
      'Diagnosis ditegakkan secara klinis bila memenuhi salah satu dari dua kriteria: (1) onset akut dalam menit hingga beberapa jam dengan keterlibatan kulit dan/atau mukosa (urtikaria generalisata, gatal, kemerahan, bengkak bibir-lidah-uvula) DISERTAI minimal salah satu dari gangguan respirasi (sesak, wheezing, stridor, hipoksemia) atau penurunan tekanan darah maupun gejala disfungsi organ (sinkop, inkontinensia); ATAU (2) onset akut hipotensi, bronkospasme, atau keterlibatan laring setelah paparan alergen yang diketahui atau sangat mungkin bagi pasien tersebut, meskipun tanpa gejala kulit.',
    diagnosisBanding: [
      'Reaksi vasovagal — bradikardia, pucat, berkeringat, tanpa urtikaria maupun bronkospasme, dan membaik dengan posisi berbaring',
      'Asma eksaserbasi akut — bronkospasme tanpa hipotensi, urtikaria, atau angioedema',
      'Angioedema herediter atau akibat penghambat ACE — bengkak tanpa urtikaria dan tanpa gatal, TIDAK RESPONS terhadap epinefrin, antihistamin, maupun steroid',
      'Sindrom karsinoid, mastositosis sistemik, dan skombroid akibat konsumsi ikan dengan kadar histamin tinggi',
      'Serangan panik — sesak dan rasa tercekik tanpa temuan objektif hipoksemia, hipotensi, atau urtikaria',
    ],
    pengkajian:
      'Dipikirkan reaksi anafilaktik pada pasien ini atas dasar onset gejala yang sangat cepat dalam hitungan menit setelah paparan alergen yang jelas, dengan keterlibatan lebih dari satu sistem organ secara bersamaan — kulit berupa urtikaria generalisata dan angioedema, saluran napas berupa sesak dengan stridor dan wheezing, serta kardiovaskular berupa hipotensi dan takikardia. Kombinasi multisistem inilah yang membedakannya dari reaksi alergi lokal maupun urtikaria akut biasa yang terbatas pada kulit tanpa mengancam jalan napas atau sirkulasi. Reaksi vasovagal menjadi pertimbangan karena sama-sama dapat menimbulkan pingsan setelah tindakan medis, namun pada vasovagal denyut jantung justru melambat, kulit tampak pucat dan berkeringat tanpa urtikaria, dan kondisi membaik cepat dengan posisi berbaring serta elevasi tungkai — berbeda dengan kasus ini yang menunjukkan takikardia disertai kelainan kulit yang khas. Asma eksaserbasi dipertimbangkan karena adanya wheezing, namun pada asma murni tidak dijumpai hipotensi, urtikaria, maupun angioedema. Angioedema akibat penghambat ACE penting disingkirkan melalui riwayat obat, sebab bengkaknya tidak disertai gatal maupun urtikaria dan yang terpenting TIDAK MEMBAIK dengan epinefrin, antihistamin, atau kortikosteroid sehingga memerlukan terapi berbeda berupa ikatibant atau konsentrat C1-inhibitor. Serangan panik dipertimbangkan pada pasien cemas dengan rasa tercekik, namun tidak disertai hipoksemia objektif, hipotensi, maupun temuan kulit. Yang menentukan luaran pada kasus ini bukanlah ketepatan membedakan seluruh diagnosis banding tersebut, melainkan KECEPATAN pemberian epinefrin intramuskular — keterlambatan pemberian epinefrin merupakan faktor tunggal yang paling konsisten ditemukan pada kasus anafilaksis yang berakhir fatal.',
    terapiSuportif: [
      'Posisi: baringkan pasien TERLENTANG dengan tungkai dielevasi; pada distres napas posisi setengah duduk, dan pada ibu hamil posisi miring kiri. JANGAN mendudukkan atau menyuruh pasien berdiri mendadak — perubahan posisi ke tegak dapat memicu empty ventricle syndrome yang fatal',
      'Oksigen aliran tinggi 6-8 L/menit dengan sungkup, target saturasi 94-98%',
      'Resusitasi cairan kristaloid: 20 mL/kgBB bolus cepat pada anak, dan 500-1000 mL bolus pada dewasa, diulang sesuai respons — kebocoran plasma masif membuat kebutuhan cairan sering jauh lebih besar dari perkiraan awal',
      'Pasang dua akses intravena berdiameter besar, pantau tekanan darah, nadi, saturasi, dan produksi urin dengan target 0,5-1 mL/kg/jam',
      'Siapkan peralatan intubasi dan jalur bedah jalan napas sejak awal bila terdapat edema laring — edema berkembang sangat cepat sehingga intubasi tertunda menjadi jauh lebih sulit',
    ],
    tatalaksana: [
      'EPINEFRIN INTRAMUSKULAR adalah terapi lini pertama dan harus diberikan SEGERA tanpa menunggu pemeriksaan apa pun: dosis 0,01 mg/kgBB larutan 1:1000, maksimal 0,5 mg pada dewasa dan 0,3 mg pada anak, disuntikkan pada PAHA ANTEROLATERAL (vastus lateralis)',
      'Paha anterolateral dipilih karena absorpsi lebih cepat dan kadar puncak lebih tinggi dibanding deltoid maupun jalur subkutan; ulangi setiap 5-15 menit bila belum ada perbaikan',
      'TIDAK ADA kontraindikasi absolut pemberian epinefrin pada anafilaksis — termasuk pada usia lanjut dan penyakit jantung, karena risiko tidak memberikan epinefrin jauh lebih besar',
      'Bila tidak respons setelah beberapa dosis intramuskular: epinefrin infus kontinu dengan pemantauan ketat di fasilitas yang mampu, serta pertimbangkan vasopresor tambahan',
      'Pada pasien yang menggunakan penyekat beta dan tidak respons epinefrin: GLUKAGON 1-5 mg intravena perlahan dilanjutkan infus, karena glukagon bekerja melalui reseptor yang tidak terblok',
      'Bronkodilator inhalasi (salbutamol nebulisasi) sebagai TAMBAHAN untuk bronkospasme yang menetap, bukan pengganti epinefrin',
      'Antihistamin H1 (difenhidramin) dan H2 (ranitidin) serta kortikosteroid (metilprednisolon) merupakan terapi ADJUVAN yang hanya meredakan gejala kulit dan mungkin mengurangi reaksi bifasik — keduanya BUKAN penyelamat nyawa dan tidak boleh mendahului epinefrin',
      'Observasi minimal 4-6 jam setelah gejala mereda, diperpanjang hingga 12-24 jam pada reaksi berat, memerlukan lebih dari satu dosis epinefrin, atau riwayat reaksi bifasik — mengingat risiko reaksi bifasik',
      'Sebelum pulang: resepkan DUA epinefrin autoinjektor, latih cara penggunaannya bersama keluarga, buat rencana tindakan tertulis, dan rujuk ke alergi-imunologi',
    ],
    edukasi: [
      'Identifikasi dan hindari pencetus secara ketat: ajarkan membaca label komposisi makanan dan obat, serta memberi tahu setiap tenaga kesehatan tentang riwayat alerginya sebelum menerima obat atau tindakan',
      'Bawa epinefrin autoinjektor SETIAP SAAT dan pastikan pasien serta keluarga mampu memperagakan cara penggunaannya; periksa tanggal kedaluwarsa berkala',
      'Gunakan gelang atau kartu identitas alergi yang mencantumkan alergen dan riwayat anafilaksis',
      'Setelah menyuntikkan epinefrin, TETAP segera ke fasilitas kesehatan meski gejala membaik — karena risiko reaksi bifasik dalam beberapa jam berikutnya',
      'Penjadwalan makan pada alergi makanan: hindari makan di tempat yang komposisinya tidak dapat dipastikan, waspadai kontaminasi silang di dapur, dan bawa bekal sendiri saat bepergian',
      'Pola olahraga: pada anafilaksis yang dipicu olahraga terkait makanan, hindari berolahraga dalam 4-6 jam setelah makan alergen pencetus dan jangan berolahraga sendirian',
      'Tidur dan aktivitas normal setelah pemulihan; asma penyerta harus dikontrol optimal karena merupakan faktor risiko utama anafilaksis fatal',
      'Kontrol ke alergi-imunologi 4-6 minggu setelah episode untuk uji alergi dan pertimbangan imunoterapi (terutama pada alergi sengatan serangga yang sangat efektif dengan imunoterapi venom)',
    ],
    komplikasi: [
      'Obstruksi jalan napas total akibat edema laring hingga henti napas',
      'Syok refrakter, aritmia, iskemia miokard, dan henti jantung',
      'Ensefalopati hipoksik-iskemik akibat hipoperfusi berkepanjangan',
      'Reaksi bifasik yang muncul beberapa jam setelah reaksi awal mereda',
    ],
    prognosis:
      'Sangat baik bila epinefrin diberikan dini — sebagian besar pasien pulih sempurna tanpa gejala sisa. Kematian umumnya terjadi dalam 30-60 menit pertama akibat obstruksi jalan napas atau kolaps kardiovaskular, dan analisis kasus fatal secara konsisten menunjukkan keterlambatan atau kegagalan pemberian epinefrin sebagai faktor yang dapat dicegah. Risiko berulang tetap ada seumur hidup sehingga penghindaran alergen dan ketersediaan autoinjektor menentukan keselamatan jangka panjang.',
    referensi: ['SKDI2012', 'WAO2020', 'PPKFKTP2014', 'HARRISON2022'],
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
    definisi: 'Invasi dan multiplikasi mikroorganisme pada saluran kemih yang normalnya steril; dibedakan menjadi infeksi saluran kemih bawah (sistitis, uretritis) dan atas (pielonefritis), serta menjadi tanpa komplikasi dan berkomplikasi berdasarkan ada tidaknya kelainan struktural, fungsional, atau faktor pejamu yang memperberat.',
    anamnesis: {
      keluhanUtama: 'Nyeri dan perih saat buang air kecil disertai rasa ingin berkemih terus-menerus sejak beberapa hari.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: nyeri suprapubik pada sistitis, sedangkan nyeri pinggang unilateral yang menjalar ke depan mengarah pada pielonefritis. Onset: umumnya mendadak dalam hitungan hari. Character: disuria berupa rasa perih atau terbakar saat berkemih, frekuensi bertambah dengan volume tiap kali sedikit, urgensi, rasa tidak tuntas setelah berkemih, dan nokturia. Radiation: nyeri pinggang yang menjalar ke selangkangan lebih mengarah pada kolik akibat batu daripada infeksi murni. Associations: DEMAM DAN MENGGIGIL merupakan pembeda kunci — sistitis tanpa komplikasi umumnya TANPA demam, sedangkan demam tinggi dengan menggigil menandakan infeksi telah naik ke ginjal; tanyakan pula mual, muntah, hematuria makroskopis, urin keruh atau berbau menyengat, serta keluarnya duh dari uretra yang mengarah pada uretritis akibat infeksi menular seksual. Time course: berapa lama keluhan berlangsung, apakah pernah berulang, dan berapa kali dalam setahun terakhir. Exacerbating: hubungan dengan aktivitas seksual, menahan kencing, dan asupan cairan yang kurang. Severity: dampak terhadap tidur dan aktivitas, serta apakah masih mampu makan-minum yang menentukan pilihan terapi oral atau parenteral.',
      riwayatPenyakitDahulu:
        'Riwayat infeksi saluran kemih sebelumnya dan frekuensinya, riwayat batu saluran kemih, kelainan anatomi saluran kemih termasuk refluks vesikoureter pada anak, pembesaran prostat pada laki-laki, diabetes melitus, penyakit ginjal, imunosupresi, serta riwayat pemasangan kateter atau tindakan urologi.',
      riwayatPenyakitKeluarga: 'Riwayat batu saluran kemih, penyakit ginjal polikistik, dan kelainan bawaan saluran kemih dalam keluarga.',
      riwayatPengobatan:
        'Antibiotik yang pernah digunakan untuk keluhan serupa beserta responsnya — penting untuk memperkirakan pola resistensi; penggunaan antibiotik dalam 3 bulan terakhir; serta obat yang menurunkan imunitas seperti kortikosteroid dan kemoterapi.',
      riwayatAlergi: 'Riwayat alergi antibiotik terutama golongan sulfa, penisilin, dan kuinolon yang menentukan pilihan terapi.',
      riwayatKehamilanPersalinan:
        'Pada perempuan usia subur WAJIB ditanyakan kemungkinan hamil dan tanggal haid terakhir — status kehamilan mengubah pilihan antibiotik secara mendasar dan menjadikan bakteriuria asimtomatik pun harus diobati.',
      riwayatNutrisi: 'Asupan cairan harian dan kebiasaan minum, konsumsi kopi dan minuman beralkohol yang bersifat iritatif terhadap kandung kemih.',
      riwayatSosialEkonomi:
        'Kebiasaan menahan buang air kecil, cara cebok (pada perempuan arah membersihkan yang benar dari depan ke belakang), kebersihan toilet, aktivitas seksual dan penggunaan spermisida atau diafragma, serta higiene perorangan; pada laki-laki tanyakan status sirkumsisi.',
    },
    pemeriksaanFisik: [
      'Tanda vital lengkap — demam tinggi dengan menggigil mengarahkan pada pielonefritis atau bakteremia; hipotensi dan takikardia menandakan urosepsis yang merupakan kegawatdaruratan',
      'Nyeri tekan SUPRAPUBIK pada sistitis',
      'NYERI KETOK KOSTOVERTEBRA (sudut kostovertebra) unilateral — temuan kunci yang membedakan pielonefritis dari sistitis',
      'Palpasi abdomen untuk kandung kemih yang teraba penuh (retensi urin) dan massa ginjal',
      'Inspeksi genitalia eksterna: duh uretra, ulkus, tanda infeksi menular seksual, fimosis pada laki-laki, dan tanda atrofi vagina pada perempuan pascamenopause',
      'Colok dubur pada laki-laki untuk menilai prostat — prostat yang sangat nyeri saat disentuh mengarah pada prostatitis akut dan JANGAN dipijat karena berisiko bakteremia',
      'Pada anak: periksa kelainan anatomi genitalia, tanda gagal tumbuh, dan ukur tekanan darah',
    ],
    penunjang: [
      'URINALISIS sebagai pemeriksaan utama: leukosituria (piuria) lebih dari 5 leukosit per lapang pandang besar, nitrit positif yang spesifik untuk bakteri pengubah nitrat seperti Escherichia coli, esterase leukosit positif, dan dapat disertai hematuria',
      'Cara pengambilan sangat menentukan hasil: gunakan urin PORSI TENGAH (midstream) setelah membersihkan genitalia; pada bayi gunakan kateterisasi atau aspirasi suprapubik karena kantong penampung urin memberi banyak hasil positif palsu',
      'KULTUR URIN dengan uji kepekaan diindikasikan pada: pielonefritis, infeksi berulang, kegagalan terapi, kehamilan, laki-laki, anak, dan pasien dengan faktor komplikasi. Ambang bermakna umumnya 100.000 koloni per mL pada urin porsi tengah, namun ambang lebih rendah dapat bermakna pada spesimen kateter atau pasien bergejala',
      'Darah lengkap dan penanda inflamasi pada infeksi berat; kultur darah bila dicurigai urosepsis',
      'Ureum, kreatinin, dan elektrolit untuk menilai fungsi ginjal',
      'USG saluran kemih pada pielonefritis yang tidak membaik dalam 48-72 jam, infeksi berulang, dugaan batu atau obstruksi, laki-laki, dan semua anak dengan infeksi saluran kemih pertama demi mencari kelainan anatomi',
      'Pada anak dengan infeksi berulang dipertimbangkan pemeriksaan lanjutan untuk mencari refluks vesikoureter sesuai indikasi',
    ],
    etiologi:
      'Escherichia coli merupakan penyebab pada sekitar 75-90% infeksi tanpa komplikasi. Penyebab lain meliputi Klebsiella, Proteus mirabilis (berkaitan dengan batu struvit), Enterococcus, Staphylococcus saprophyticus (khas pada perempuan muda aktif seksual), dan Pseudomonas pada infeksi terkait perawatan kesehatan.',
    patofisiologi:
      'Sebagian besar infeksi terjadi melalui jalur ASENDEN: bakteri dari flora perineum dan kolon berkolonisasi di daerah periuretra, naik melalui uretra ke kandung kemih, dan pada sebagian kasus terus naik melalui ureter ke ginjal. Uretra perempuan yang pendek dan letaknya berdekatan dengan anus menjelaskan mengapa insidens pada perempuan jauh lebih tinggi. Bakteri uropatogenik memiliki fimbria atau pili yang memungkinkan pelekatan pada uroepitel sehingga tidak tersapu aliran urin; strain dengan P-fimbria memiliki kemampuan lebih besar naik ke ginjal dan menimbulkan pielonefritis. Mekanisme pertahanan pejamu meliputi aliran urin yang membilas secara berkala, pH urin yang asam, osmolaritas tinggi, protein Tamm-Horsfall yang mengikat bakteri, serta lapisan glikosaminoglikan pada mukosa kandung kemih. Setiap keadaan yang menghambat aliran urin — batu, striktur, pembesaran prostat, kehamilan yang menekan ureter, kandung kemih neurogenik, atau kateter menetap — mengganggu pertahanan ini dan mengubah infeksi menjadi berkomplikasi. Pada pielonefritis, invasi bakteri ke parenkim ginjal memicu respons inflamasi yang bila berulang dapat meninggalkan jaringan parut, dan pada anak dengan refluks vesikoureter jaringan parut ini berpotensi berkembang menjadi hipertensi serta penyakit ginjal kronik di kemudian hari.',
    faktorRisiko: [
      'Jenis kelamin perempuan karena uretra pendek dan dekat anus',
      'Aktivitas seksual, penggunaan spermisida dan diafragma',
      'Kehamilan — dilatasi ureter dan stasis urin akibat progesteron serta penekanan uterus',
      'Menopause dengan atrofi urogenital dan berkurangnya laktobasilus',
      'Diabetes melitus dan imunosupresi',
      'Obstruksi: batu, striktur, pembesaran prostat, tumor',
      'Kateter urin menetap dan instrumentasi saluran kemih',
      'Kandung kemih neurogenik dan residu urin pascaberkemih',
      'Kelainan anatomi bawaan dan refluks vesikoureter pada anak',
      'Kebiasaan menahan kencing dan asupan cairan kurang',
    ],
    goldStandard:
      'Baku emas adalah KULTUR URIN yang menumbuhkan bakteri patogen bermakna disertai uji kepekaan antibiotik — umumnya 100.000 koloni per mL atau lebih pada urin porsi tengah, dengan ambang lebih rendah (1.000-10.000 koloni per mL) dapat bermakna pada pasien bergejala, spesimen kateter, atau aspirasi suprapubik. Pada perempuan tidak hamil dengan sistitis tanpa komplikasi dan gejala khas, diagnosis dapat ditegakkan secara klinis dengan dukungan urinalisis tanpa perlu menunggu kultur.',
    diagnosisBanding: [
      'Uretritis akibat infeksi menular seksual — disuria dengan duh uretra, riwayat seksual berisiko, sering pada laki-laki muda; memerlukan terapi gonore dan klamidia beserta pasangannya',
      'Vaginitis — keluhan lebih ke gatal dan duh vagina dengan disuria eksternal, bukan frekuensi dan urgensi',
      'Sindrom kandung kemih hiperaktif dan sistitis interstisial — gejala iritatif kronik namun urinalisis dan kultur steril',
      'Kolik renal akibat batu — nyeri pinggang hebat menjalar ke selangkangan, hematuria, umumnya tanpa demam kecuali disertai infeksi',
      'Apendisitis dan penyakit radang panggul pada perempuan dengan nyeri perut bawah',
      'Prostatitis pada laki-laki — nyeri perineum dan prostat sangat nyeri pada colok dubur',
      'Tuberkulosis saluran kemih — piuria steril yang menetap dengan kultur bakteri biasa negatif',
    ],
    pengkajian:
      'Dipikirkan infeksi saluran kemih bawah berupa sistitis pada pasien ini atas dasar keluhan disuria, frekuensi, dan urgensi yang timbul mendadak disertai nyeri suprapubik, TANPA demam maupun nyeri ketok kostovertebra, dengan urinalisis menunjukkan leukosituria dan nitrit positif. Ketiadaan demam dan nyeri ketok kostovertebra inilah yang secara klinis memisahkannya dari pielonefritis, sebab keterlibatan parenkim ginjal hampir selalu memunculkan gejala sistemik berupa demam tinggi dengan menggigil, mual, serta nyeri pinggang — perbedaan ini menentukan durasi terapi, pilihan antibiotik yang mampu mencapai kadar adekuat di jaringan ginjal, dan keputusan rawat inap. Uretritis akibat infeksi menular seksual dipertimbangkan terutama bila terdapat riwayat seksual berisiko dan duh uretra, namun pada kasus ini tidak dijumpai duh dan keluhan didominasi frekuensi serta urgensi yang lebih khas untuk keterlibatan kandung kemih. Vaginitis disingkirkan karena tidak ada duh vagina maupun gatal, dan disuria yang dirasakan bersifat internal saat berkemih bukan perih di luar akibat kontak urin dengan mukosa yang meradang. Kolik renal akibat batu dipertimbangkan bila nyeri pinggang bersifat hebat dan menjalar ke selangkangan secara episodik, yang tidak sesuai gambaran pasien ini. Sindrom kandung kemih hiperaktif dan sistitis interstisial menjadi pertimbangan pada keluhan iritatif yang kronik, namun keduanya menunjukkan urinalisis dan kultur yang steril sehingga dapat dibedakan. Hal yang perlu ditegaskan dalam pengkajian adalah pencarian FAKTOR KOMPLIKASI — jenis kelamin laki-laki, kehamilan, usia anak, diabetes, batu, obstruksi, kateter, atau infeksi berulang — sebab keberadaannya mengubah pendekatan dari terapi empiris jangka pendek menjadi keharusan melakukan kultur, memperpanjang durasi antibiotik, dan mencari kelainan struktural yang mendasari.',
    terapiSuportif: [
      'Hidrasi adekuat dengan target asupan cairan 2-2,5 liter per hari pada dewasa tanpa kontraindikasi, untuk meningkatkan produksi urin dan membilas bakteri dari kandung kemih',
      'Target produksi urin minimal 0,5-1 mL/kg/jam; pada pielonefritis dengan dehidrasi berikan kristaloid intravena',
      'Analgesik dan antipiretik: parasetamol untuk nyeri dan demam; obat antiinflamasi nonsteroid dapat digunakan hati-hati dan dihindari bila fungsi ginjal terganggu',
      'Kompres hangat pada suprapubik untuk meredakan nyeri',
      'Kebutuhan kalori dipenuhi seperti biasa; pada pielonefritis dengan mual muntah berikan dukungan cairan dan nutrisi parenteral sementara bila asupan oral tidak memadai',
      'Berkemih teratur setiap 2-3 jam dan tidak menahan kencing',
    ],
    tatalaksana: [
      'SISTITIS TANPA KOMPLIKASI pada perempuan tidak hamil: nitrofurantoin 2x100 mg selama 5 hari, kotrimoksazol 2x960 mg selama 3 hari (hanya bila resistensi lokal di bawah 20%), atau fosfomisin 3 gram dosis tunggal',
      'Fluorokuinolon TIDAK dianjurkan sebagai lini pertama untuk sistitis tanpa komplikasi karena efek samping serius (tendinitis, ruptur tendon, neuropati) dan perlunya menjaga cadangan obat ini untuk infeksi yang lebih berat',
      'PIELONEFRITIS AKUT tanpa komplikasi rawat jalan: siprofloksasin 2x500 mg selama 7 hari atau sefiksim, dengan syarat pasien stabil, mampu minum obat, dan dapat dipantau; kultur urin WAJIB diambil sebelum antibiotik dimulai',
      'Pielonefritis berat, muntah, tanda sepsis, kehamilan, atau gagal terapi oral: RAWAT INAP dengan seftriakson 1-2 gram sekali sehari intravena atau sesuai pola kepekaan setempat; alihkan ke oral setelah bebas demam 24-48 jam, total durasi 10-14 hari',
      'PADA KEHAMILAN: bakteriuria asimtomatik pun WAJIB diobati karena berisiko pielonefritis, persalinan preterm, dan berat lahir rendah. Antibiotik aman meliputi nitrofurantoin (hindari menjelang aterm), sefaleksin, dan amoksisilin; KONTRAINDIKASI fluorokuinolon sepanjang kehamilan dan kotrimoksazol pada trimester pertama dan ketiga',
      'PADA ANAK: kultur urin sebelum antibiotik, terapi 7-14 hari, dan lakukan USG saluran kemih setelah infeksi pertama untuk mencari kelainan anatomi',
      'PADA LAKI-LAKI: setiap infeksi saluran kemih dianggap berkomplikasi — lakukan kultur, berikan terapi lebih lama (7-14 hari), dan cari kelainan prostat maupun obstruksi',
      'Infeksi terkait kateter: lepas atau ganti kateter bila memungkinkan; JANGAN mengobati bakteriuria asimtomatik pada pasien berkateter karena hanya mendorong resistensi tanpa manfaat klinis',
      'Evaluasi ulang dalam 48-72 jam; bila tidak membaik lakukan pencitraan untuk mencari abses ginjal, pionefrosis, atau obstruksi yang memerlukan drainase',
      'Infeksi berulang (2 kali dalam 6 bulan atau 3 kali dalam setahun): pertimbangkan profilaksis pascasenggama atau dosis rendah jangka panjang, dan pada perempuan pascamenopause estrogen vaginal topikal terbukti menurunkan kekambuhan',
    ],
    edukasi: [
      'Minum air putih cukup 2-2,5 liter per hari dan JANGAN MENAHAN KENCING — berkemih setiap 2-3 jam adalah pertahanan alami paling efektif terhadap infeksi berulang',
      'Cebok dengan arah DARI DEPAN KE BELAKANG pada perempuan untuk mencegah perpindahan bakteri dari daerah anus ke uretra',
      'Berkemih segera setelah berhubungan seksual untuk membilas bakteri yang terdorong masuk uretra; hindari penggunaan spermisida dan diafragma bila infeksi sering berulang',
      'Penjadwalan makan tetap normal; kurangi kopi, teh pekat, minuman bersoda, alkohol, dan makanan pedas selama fase akut karena bersifat iritatif terhadap kandung kemih',
      'Tidur cukup 7-8 jam untuk mendukung pemulihan; aktivitas dan olahraga dilanjutkan sesuai toleransi pada sistitis, sedangkan pada pielonefritis dianjurkan istirahat hingga bebas demam',
      'HABISKAN ANTIBIOTIK sampai selesai meski keluhan sudah hilang dalam 1-2 hari — menghentikan lebih awal menyebabkan infeksi kambuh dan mendorong resistensi kuman',
      'Gunakan pakaian dalam berbahan katun dan hindari yang terlalu ketat serta lembap',
      'Kontrol dalam 48-72 jam bila keluhan tidak membaik; SEGERA kembali bila timbul demam tinggi dengan menggigil, nyeri pinggang, mual muntah hebat sehingga tidak dapat minum obat, urin sangat sedikit, atau penurunan kesadaran — tanda infeksi telah naik ke ginjal atau menjadi sepsis',
      'Pada ibu hamil tekankan pentingnya pemeriksaan urin rutin saat kunjungan antenatal karena infeksi tanpa gejala pun berbahaya bagi kehamilan',
    ],
    komplikasi: [
      'Pielonefritis akut dan kronik dengan jaringan parut ginjal',
      'Abses ginjal dan perinefrik, serta pionefrosis yang memerlukan drainase',
      'Urosepsis dan syok septik',
      'Pada kehamilan: persalinan preterm, berat lahir rendah, dan pielonefritis maternal',
      'Pada anak dengan refluks vesikoureter: jaringan parut ginjal, hipertensi, dan penyakit ginjal kronik di kemudian hari',
      'Infeksi berulang dan resistensi antibiotik',
    ],
    prognosis:
      'Sangat baik pada sistitis tanpa komplikasi — sebagian besar sembuh sempurna dengan antibiotik jangka pendek. Pielonefritis tanpa komplikasi juga berprognosis baik bila diterapi tepat, namun keterlambatan penanganan dapat berujung urosepsis dengan mortalitas bermakna. Prognosis jangka panjang paling ditentukan oleh ada tidaknya kelainan struktural yang mendasari; pada anak dengan refluks vesikoureter dan infeksi berulang, pencegahan jaringan parut ginjal menjadi kunci untuk menghindari hipertensi dan penyakit ginjal kronik pada usia dewasa.',
    referensi: ['SKDI2012', 'PPKFKTP2014', 'CAMPBELL2016', 'PAPDI2014', 'HARRISON2022'],
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
    definisi: 'Peningkatan tekanan darah arteri yang menetap tanpa penyebab sekunder yang dapat diidentifikasi; mencakup lebih dari 90% seluruh kasus hipertensi dan merupakan faktor risiko utama stroke, penyakit jantung koroner, gagal jantung, dan penyakit ginjal kronik.',
    anamnesis: {
      keluhanUtama: 'Umumnya TANPA KELUHAN dan ditemukan saat pemeriksaan rutin — inilah sebabnya hipertensi disebut silent killer. Bila bergejala: nyeri kepala terutama pada tengkuk saat bangun tidur, pusing, atau jantung berdebar.',
      riwayatPenyakitSekarang:
        'Bila terdapat nyeri kepala, telusuri dengan SOCRATES. Site: khas di regio oksipital atau tengkuk. Onset: sering dirasakan saat bangun pagi dan berkurang seiring siang hari. Character: rasa berat atau menekan, bukan berdenyut. Radiation: menjalar ke bahu dan leher. Associations: gali gejala kerusakan organ target — nyeri dada atau sesak saat aktivitas (jantung), pandangan kabur mendadak (retina), kelemahan sesisi atau bicara pelo (serebrovaskular), urin berbusa atau bengkak tungkai (ginjal), serta klaudikasio. Time course: berapa lama tekanan darah diketahui tinggi, hasil pengukuran tertinggi, dan pola pengukuran mandiri di rumah. Exacerbating: konsumsi garam berlebih, stres, kurang tidur, penghentian obat mendadak. Severity: dampak terhadap aktivitas dan kualitas hidup. Wajib tanyakan gejala krisis hipertensi: nyeri kepala hebat mendadak, penurunan kesadaran, kejang, nyeri dada berat, atau sesak napas hebat.',
      riwayatPenyakitDahulu:
        'Riwayat diabetes melitus, dislipidemia, penyakit jantung koroner, stroke atau serangan iskemik sepintas, gagal jantung, penyakit ginjal, gout, dan asma (relevan untuk pemilihan beta-blocker). Pada perempuan tanyakan riwayat preeklampsia yang meningkatkan risiko hipertensi di kemudian hari.',
      riwayatPenyakitKeluarga: 'Riwayat hipertensi, stroke, penyakit jantung koroner dini (laki-laki kurang dari 55 tahun, perempuan kurang dari 65 tahun), diabetes, dan penyakit ginjal pada keluarga.',
      riwayatPengobatan:
        'Obat antihipertensi yang pernah dan sedang digunakan beserta dosis, efek samping yang dialami, dan alasan penghentian. Telusuri obat yang MENAIKKAN tekanan darah: obat antiinflamasi nonsteroid, kortikosteroid, dekongestan hidung, pil kontrasepsi kombinasi, eritropoietin, siklosporin, serta jamu dan suplemen yang tidak jelas kandungannya.',
      riwayatAlergi: 'Riwayat alergi obat, termasuk riwayat angioedema akibat penghambat ACE yang menjadi kontraindikasi mutlak golongan tersebut.',
      riwayatNutrisi:
        'Perkirakan asupan garam harian dari kebiasaan menambah garam di meja makan, konsumsi makanan olahan dan diawetkan, ikan asin, mi instan, dan makanan cepat saji. Tanyakan pula konsumsi buah dan sayur, serta minuman berkafein dan berenergi.',
      riwayatSosialEkonomi:
        'Kebiasaan merokok termasuk jumlah batang per hari dan lama merokok, konsumsi alkohol, aktivitas fisik, jenis pekerjaan dan tingkat stres kerja, durasi dan kualitas tidur termasuk gejala sleep apnea (mendengkur keras, apnea disaksikan, mengantuk siang hari), serta kemampuan finansial dan akses obat yang menentukan kepatuhan jangka panjang.',
    },
    pemeriksaanFisik: [
      'Pengukuran tekanan darah dengan teknik benar: pasien duduk tenang minimal 5 menit tanpa merokok atau kafein 30 menit sebelumnya, punggung bersandar, kaki menapak lantai tidak menyilang, lengan disangga setinggi jantung, manset menutup 80% lingkar lengan dan 40% lebar lengan',
      'Kembangkan manset 20-30 mmHg di atas titik hilangnya pulsasi radial, turunkan perlahan 2-3 mmHg per detik; sistolik dibaca pada suara Korotkoff fase I dan diastolik pada fase V',
      'Ukur pada KEDUA lengan pada kunjungan pertama — selisih lebih dari 15-20 mmHg mengarah pada penyakit arteri; gunakan lengan dengan nilai lebih tinggi untuk pemantauan selanjutnya',
      'Ukur tekanan darah berdiri setelah 1 dan 3 menit pada pasien lanjut usia dan diabetes untuk menilai hipotensi ortostatik',
      'Antropometri: indeks massa tubuh dan lingkar pinggang',
      'Funduskopi untuk retinopati hipertensif: penyempitan arteriol, AV nicking, perdarahan flame-shaped, cotton wool spots, hingga papiledema pada hipertensi maligna',
      'Jantung: iktus kordis bergeser ke lateral dan kuat angkat sebagai tanda hipertrofi ventrikel kiri, bunyi jantung S4, murmur',
      'Auskultasi bruit pada arteri karotis, abdomen (bruit renalis mengarah ke stenosis arteri renalis), dan femoralis; palpasi nadi perifer keempat ekstremitas serta nilai radiofemoral delay untuk menyingkirkan koarktasio aorta',
      'Palpasi ginjal untuk massa (ginjal polikistik) dan periksa edema tungkai',
    ],
    antropometri:
      'Hitung indeks massa tubuh dari berat badan dalam kilogram dibagi kuadrat tinggi badan dalam meter, dengan ambang Asia Pasifik: 23 sampai 24,9 berat berlebih dan 25 atau lebih obesitas. Lingkar pinggang lebih dari 90 cm pada laki-laki atau lebih dari 80 cm pada perempuan menandakan obesitas sentral. Penurunan berat badan 1 kg secara rerata menurunkan tekanan darah sistolik sekitar 1 mmHg, sehingga penurunan 10 kg dapat setara dengan efek satu obat antihipertensi.',
    penunjang: [
      'Urinalisis untuk proteinuria dan hematuria, serta rasio albumin-kreatinin urin sebagai penanda kerusakan ginjal dini',
      'Kreatinin serum dengan perhitungan laju filtrasi glomerulus',
      'Elektrolit terutama kalium — hipokalemia spontan tanpa diuretik mengarah pada hiperaldosteronisme primer',
      'Glukosa darah puasa dan profil lipid untuk stratifikasi risiko kardiovaskular total',
      'Asam urat sebagai data dasar sebelum pemberian diuretik tiazid',
      'Elektrokardiogram untuk hipertrofi ventrikel kiri (kriteria Sokolow-Lyon atau Cornell), strain pattern, dan bukti iskemia atau infark lama',
      'Ekokardiografi bila tersedia untuk menilai massa ventrikel kiri dan fungsi diastolik',
    ],
    etiologi:
      'Multifaktorial: interaksi predisposisi genetik poligenik dengan faktor lingkungan berupa asupan natrium tinggi, obesitas, aktivitas fisik rendah, konsumsi alkohol, stres kronik, dan gangguan tidur.',
    patofisiologi:
      'Tekanan darah merupakan hasil curah jantung dikalikan resistensi vaskular perifer. Pada hipertensi esensial, gangguan awal berupa retensi natrium dan air oleh ginjal serta aktivasi berlebihan sistem renin-angiotensin-aldosteron dan sistem saraf simpatis meningkatkan volume dan tonus vaskular. Angiotensin II menyebabkan vasokonstriksi, remodeling dinding pembuluh, dan fibrosis; disfungsi endotel menurunkan ketersediaan nitrit oksida sehingga vasodilatasi terganggu. Seiring waktu terjadi hipertrofi tunika media arteriol dan kekakuan arteri besar yang meningkatkan tekanan sistolik dan tekanan nadi. Beban tekanan kronik memicu hipertrofi ventrikel kiri konsentrik yang akhirnya berkembang menjadi disfungsi diastolik dan gagal jantung, sementara pada ginjal terjadi nefrosklerosis dan penurunan laju filtrasi glomerulus.',
    faktorRisiko: [
      'Usia lanjut dan riwayat keluarga hipertensi',
      'Asupan garam berlebih dan pola makan rendah buah-sayur',
      'Obesitas dan obesitas sentral',
      'Aktivitas fisik kurang',
      'Merokok dan konsumsi alkohol berlebih',
      'Stres kronik dan gangguan tidur termasuk sleep apnea obstruktif',
      'Diabetes melitus dan dislipidemia',
    ],
    diagnosis: [
      'Tekanan darah sistolik 140 mmHg atau lebih dan/atau diastolik 90 mmHg atau lebih pada dua kali pengukuran atau lebih di dua kunjungan berbeda',
      'Pengukuran dilakukan dengan teknik benar setelah istirahat 5 menit, manset sesuai ukuran lengan, dan diukur pada kedua lengan saat kunjungan pertama',
      'Konfirmasi dengan pemantauan mandiri di rumah atau ambulatori untuk menyingkirkan hipertensi jas putih',
      'Klasifikasi: derajat 1 (140-159/90-99), derajat 2 (160-179/100-109), derajat 3 (≥180/110 mmHg)',
      'Lengkapi dengan penilaian kerusakan organ target dan stratifikasi risiko kardiovaskular total',
    ],
    goldStandard:
      'Diagnosis ditegakkan dari rerata dua kali pengukuran atau lebih pada dua kunjungan berbeda atau lebih dengan teknik yang benar, menunjukkan tekanan darah sistolik 140 mmHg atau lebih dan/atau diastolik 90 mmHg atau lebih. Pemantauan tekanan darah ambulatori 24 jam merupakan rujukan terbaik untuk menyingkirkan hipertensi jas putih dan mendeteksi hipertensi terselubung, dengan ambang rerata 24 jam 130/80 mmHg. Klasifikasi: derajat 1 yaitu 140-159/90-99 mmHg, derajat 2 yaitu 160-179/100-109 mmHg, dan derajat 3 yaitu 180/110 mmHg atau lebih.',
    diagnosisBanding: [
      'Hipertensi jas putih — tinggi hanya di fasilitas kesehatan, normal pada pengukuran rumah atau ambulatori',
      'Hipertensi sekunder akibat penyakit ginjal kronik, stenosis arteri renalis, hiperaldosteronisme primer, feokromositoma, sindrom Cushing, koarktasio aorta, atau sleep apnea',
      'Hipertensi akibat obat — antiinflamasi nonsteroid, kortikosteroid, kontrasepsi hormonal, dekongestan',
      'Krisis hipertensi: urgensi tanpa kerusakan organ akut versus emergensi dengan kerusakan organ akut yang memerlukan penurunan segera',
    ],
    pengkajian:
      'Dipikirkan hipertensi esensial pada pasien ini atas dasar tekanan darah yang menetap di atas ambang pada pengukuran berulang dengan teknik yang benar, muncul bertahap pada usia pertengahan dengan latar riwayat keluarga hipertensi, obesitas sentral, asupan garam tinggi, dan gaya hidup sedentari, tanpa petunjuk klinis yang mengarah pada penyebab sekunder. Kemungkinan hipertensi jas putih dipertimbangkan karena tekanan darah dapat meningkat semata akibat kecemasan di fasilitas kesehatan, namun hal ini disingkirkan melalui pengukuran mandiri di rumah atau pemantauan ambulatori yang tetap menunjukkan nilai tinggi. Hipertensi sekunder menjadi pertimbangan penting bila onset terjadi pada usia sangat muda atau di atas 55 tahun, tekanan darah resisten terhadap tiga obat, atau terjadi perburukan mendadak pada pasien yang sebelumnya terkontrol; pada kasus ini tidak ditemukan bruit abdomen yang mengarah pada stenosis arteri renalis, tidak ada hipokalemia spontan yang menyertai hiperaldosteronisme primer, tidak ada trias nyeri kepala-palpitasi-berkeringat yang khas feokromositoma, tidak ada moon face maupun striae ungu pada sindrom Cushing, dan tidak dijumpai radiofemoral delay yang menandakan koarktasio aorta. Temuan funduskopi dan elektrokardiogram menjadi penentu apakah telah terjadi kerusakan organ target, karena keberadaannya mengubah stratifikasi risiko sekaligus mempertegas indikasi memulai farmakoterapi tanpa menunggu percobaan modifikasi gaya hidup terlebih dahulu.',
    terapiSuportif: [
      'Restriksi natrium kurang dari 2 gram natrium atau setara kurang dari 5 gram garam dapur per hari — setara satu sendok teh peres',
      'Pola makan DASH: tinggi buah, sayur, biji-bijian utuh, dan produk susu rendah lemak; kaya kalium, magnesium, dan kalsium; rendah lemak jenuh dan gula tambahan',
      'Asupan kalium ditingkatkan melalui buah dan sayur kecuali pada pasien dengan penyakit ginjal kronik atau yang menggunakan diuretik hemat kalium',
      'Batasi alkohol maksimal 2 unit per hari pada laki-laki dan 1 unit pada perempuan; berhenti merokok sepenuhnya',
      'Pemantauan tekanan darah mandiri di rumah dua kali pagi dan dua kali malam dengan alat lengan atas yang tervalidasi, dicatat untuk dibawa saat kontrol',
    ],
    tatalaksana: [
      'Modifikasi gaya hidup diberikan pada SEMUA pasien; pada hipertensi derajat 1 tanpa risiko tinggi dan tanpa kerusakan organ target, dapat dicoba 3-6 bulan sebelum memulai obat',
      'Farmakoterapi dimulai segera bersama modifikasi gaya hidup bila derajat 2 atau lebih, atau derajat 1 dengan diabetes, penyakit ginjal kronik, penyakit kardiovaskular, atau kerusakan organ target',
      'Lini pertama: penghambat ACE (misalnya ramipril 2,5-10 mg per hari) atau ARB (misalnya kandesartan 8-32 mg per hari); penghambat kanal kalsium (amlodipin 5-10 mg per hari); diuretik tiazid (hidroklorotiazid 12,5-25 mg per hari)',
      'Utamakan KOMBINASI dua obat dosis rendah dalam satu tablet dibanding menaikkan satu obat ke dosis maksimal — efektivitas lebih baik dengan efek samping lebih sedikit dan kepatuhan lebih tinggi',
      'Pemilihan berdasarkan komorbid: penghambat ACE atau ARB pada diabetes dengan albuminuria, penyakit ginjal kronik, gagal jantung, dan pascainfark; beta-blocker bila ada penyakit jantung koroner, gagal jantung, atau aritmia; penghambat kanal kalsium pada usia lanjut dan hipertensi sistolik terisolasi',
      'JANGAN mengombinasikan penghambat ACE dengan ARB (risiko gagal ginjal dan hiperkalemia); penghambat ACE dan ARB merupakan KONTRAINDIKASI pada kehamilan',
      'Target umum kurang dari 140/90 mmHg; dapat dipertimbangkan kurang dari 130/80 mmHg pada pasien berisiko tinggi bila dapat ditoleransi; pada usia lanjut rapuh utamakan menghindari hipotensi ortostatik dan jatuh',
      'Periksa kreatinin dan kalium 1-2 minggu setelah memulai atau menaikkan dosis penghambat ACE, ARB, atau diuretik; kenaikan kreatinin sampai 30% masih dapat diterima',
      'Statin dan aspirin diberikan sesuai risiko kardiovaskular total, bukan berdasarkan nilai tekanan darah semata',
    ],
    edukasi: [
      'Penjadwalan makan: tiga kali makan utama pada jam teratur; masak sendiri untuk mengendalikan garam, kurangi garam bertahap agar lidah beradaptasi, gunakan bumbu rempah, jeruk nipis, dan bawang sebagai pengganti rasa asin',
      'Porsi metode piring: setengah piring sayur dan buah, seperempat protein tanpa lemak seperti ikan dan ayam tanpa kulit, seperempat karbohidrat kompleks; hindari ikan asin, telur asin, kornet, sosis, mi instan, dan makanan kaleng',
      'Tidur 7-8 jam per malam dengan jadwal konsisten; kurang tidur dan sleep apnea yang tidak diobati merupakan penyebab hipertensi resisten yang sering terlewat — skrining bila mendengkur keras dan mengantuk berat pada siang hari',
      'Pola olahraga: aktivitas aerobik intensitas sedang seperti jalan cepat, sepeda, atau berenang 30 menit per hari selama 5-7 hari per minggu, ditambah latihan beban ringan 2-3 kali per minggu. Hindari mengangkat beban sangat berat dengan menahan napas (manuver Valsava) karena melonjakkan tekanan darah sesaat',
      'Kepatuhan obat: tekankan bahwa hipertensi umumnya memerlukan obat SEUMUR HIDUP dan obat tidak boleh dihentikan sendiri meski tekanan darah sudah normal — tekanan normal justru menandakan obat bekerja. Minum obat pada jam yang sama setiap hari dan gunakan pengingat',
      'Jadwal kontrol: setiap 2-4 minggu saat penyesuaian dosis hingga target tercapai, lalu setiap 3-6 bulan bila stabil, dengan pemeriksaan laboratorium tahunan',
      'Segera ke fasilitas kesehatan bila muncul nyeri kepala hebat mendadak, nyeri dada, sesak berat, pandangan kabur mendadak, kelemahan sesisi, bicara pelo, atau penurunan kesadaran',
    ],
    komplikasi: [
      'Jantung: hipertrofi ventrikel kiri, penyakit jantung koroner, infark miokard, gagal jantung, fibrilasi atrium',
      'Otak: stroke iskemik dan hemoragik, serangan iskemik sepintas, demensia vaskular',
      'Ginjal: nefrosklerosis hipertensif hingga penyakit ginjal tahap akhir',
      'Mata: retinopati hipertensif hingga kehilangan penglihatan',
      'Pembuluh darah besar: aneurisma dan diseksi aorta, penyakit arteri perifer',
    ],
    prognosis:
      'Sangat baik bila tekanan darah terkontrol. Penurunan tekanan darah sistolik sebesar 10 mmHg menurunkan risiko stroke sekitar sepertiga dan kejadian jantung koroner sekitar seperlima. Prognosis ditentukan bukan hanya oleh angka tekanan darah, melainkan oleh pengendalian risiko kardiovaskular secara menyeluruh dan kepatuhan jangka panjang; hipertensi yang tidak terkontrol memperpendek harapan hidup secara bermakna.',
    referensi: ['SKDI2012', 'PERKIHT2021', 'BRAUNWALD2022', 'PPKFKTP2014', 'HARRISON2022'],
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
    definisi: 'Nyeri kepala primer berulang akibat gangguan neurovaskular, khasnya unilateral dan berdenyut dengan intensitas sedang hingga berat, disertai mual, fotofobia, dan fonofobia; dapat didahului aura maupun tidak, dan merupakan salah satu penyebab disabilitas terbesar pada usia produktif.',
    anamnesis: {
      keluhanUtama: 'Nyeri kepala berdenyut pada satu sisi yang berulang sejak bertahun-tahun, disertai mual dan silau melihat cahaya.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: khas UNILATERAL berpindah sisi antar serangan, umumnya frontotemporal; pada anak sering bilateral sehingga tidak menyingkirkan diagnosis. Onset: bertahap dalam menit hingga jam, memuncak perlahan — berbeda dari nyeri kepala hebat yang memuncak dalam hitungan detik yang wajib dicurigai perdarahan subarakhnoid. Character: BERDENYUT atau berdentum seiring denyut nadi. Radiation: menjalar ke belakang mata, rahang, dan leher. Associations: mual dan muntah, fotofobia, fonofobia, osmofobia, serta AURA berupa gangguan penglihatan seperti garis berkelok, kilatan cahaya, atau bintik gelap yang berlangsung 5-60 menit dan REVERSIBEL PENUH sebelum atau saat nyeri dimulai; tanyakan pula gejala prodromal beberapa jam hingga sehari sebelumnya berupa menguap berlebihan, mengidam makanan tertentu, dan perubahan suasana perasaan. Time course: serangan berlangsung 4-72 jam bila tidak diobati; catat FREKUENSI serangan per bulan dan jumlah hari nyeri kepala per bulan karena inilah yang menentukan perlu tidaknya profilaksis. Exacerbating: memberat dengan aktivitas fisik rutin seperti naik tangga sehingga penderita cenderung berbaring di ruang gelap dan tenang; gali pemicu berupa kurang tidur atau tidur berlebihan, telat makan, dehidrasi, stres atau justru saat stres mereda, haid, cahaya terang, bau menyengat, dan makanan tertentu. Severity: dampak terhadap pekerjaan dan sekolah, berapa hari produktivitas hilang per bulan, serta apakah sampai harus berbaring.',
      riwayatPenyakitDahulu:
        'Riwayat nyeri kepala sejak kapan dan apakah polanya BERUBAH belakangan ini (perubahan pola merupakan tanda bahaya), riwayat trauma kepala, kejang, hipertensi, penyakit kardiovaskular dan serebrovaskular yang menjadi pertimbangan sebelum meresepkan triptan, riwayat asma dan penyakit paru yang menjadi pertimbangan sebelum meresepkan propranolol, serta riwayat depresi dan gangguan cemas yang sering menyertai.',
      riwayatPenyakitKeluarga: 'Riwayat migren pada keluarga sangat sering positif dan mendukung diagnosis; tanyakan pula riwayat stroke usia muda dan aneurisma dalam keluarga.',
      riwayatPengobatan:
        'Obat yang digunakan saat serangan, dosisnya, dan BERAPA HARI DALAM SEBULAN obat tersebut dikonsumsi — penggunaan analgesik sederhana lebih dari 15 hari per bulan atau triptan dan kombinasi lebih dari 10 hari per bulan menimbulkan MEDICATION OVERUSE HEADACHE yang justru memperberat dan mempersering nyeri kepala. Tanyakan pula penggunaan kontrasepsi hormonal kombinasi yang berkaitan dengan risiko stroke pada migren dengan aura.',
      riwayatAlergi: 'Riwayat alergi obat terutama obat antiinflamasi nonsteroid.',
      riwayatKehamilanPersalinan: 'Pada perempuan: hubungan serangan dengan siklus haid (migren menstrual), status kehamilan dan menyusui yang membatasi pilihan obat, serta perubahan pola serangan saat hamil dan menopause.',
      riwayatNutrisi: 'Keteraturan waktu makan (melewatkan makan merupakan pemicu kuat), asupan cairan, konsumsi kopi dan cokelat, keju yang difermentasi, makanan mengandung monosodium glutamat, serta minuman beralkohol terutama anggur merah.',
      riwayatSosialEkonomi: 'Pola dan durasi tidur termasuk kerja giliran malam, beban kerja dan tingkat stres, paparan layar berkepanjangan, kebiasaan merokok, serta dampak penyakit terhadap pekerjaan dan hubungan sosial.',
    },
    pemeriksaanFisik: [
      'Pemeriksaan fisik dan neurologis pada migren umumnya NORMAL di antara serangan — temuan abnormal justru mengarahkan pada nyeri kepala sekunder dan wajib ditelusuri',
      'Tekanan darah untuk menyingkirkan krisis hipertensi sebagai penyebab nyeri kepala',
      'Pemeriksaan neurologis lengkap: kesadaran, saraf kranial, motorik, sensorik, refleks, dan koordinasi',
      'FUNDUSKOPI untuk mencari papiledema yang menandakan peningkatan tekanan intrakranial',
      'Pemeriksaan tanda rangsang meningeal (kaku kuduk, Kernig, Brudzinski) untuk menyingkirkan meningitis dan perdarahan subarakhnoid',
      'Palpasi arteri temporalis pada pasien usia di atas 50 tahun untuk menilai nyeri tekan dan penebalan yang mengarah pada arteritis sel raksasa',
      'Palpasi otot perikranial, leher, dan sendi temporomandibular untuk menilai komponen tegang otot yang sering menyertai',
    ],
    penunjang: [
      'Migren merupakan diagnosis KLINIS — pencitraan TIDAK diperlukan bila anamnesis khas, pemeriksaan neurologis normal, dan tidak ada tanda bahaya',
      'Lakukan pencitraan (CT atau MRI kepala) bila ditemukan TANDA BAHAYA yang diringkas sebagai SNNOOP10: gejala sistemik termasuk demam dan penurunan berat badan, riwayat keganasan atau HIV, defisit neurologis, ONSET MENDADAK memuncak dalam hitungan detik, onset pertama pada usia di atas 50 tahun, perubahan pola atau nyeri yang memberat progresif, nyeri kepala yang dipicu batuk atau mengejan, papiledema, nyeri kepala saat kehamilan atau nifas, serta nyeri kepala yang selalu di sisi yang sama',
      'Pungsi lumbal bila dicurigai meningitis atau perdarahan subarakhnoid dengan CT yang normal — dilakukan SETELAH pencitraan',
      'Laju endap darah dan protein C-reaktif pada pasien di atas 50 tahun dengan nyeri kepala baru untuk menyingkirkan arteritis sel raksasa',
      'Catatan harian nyeri kepala (headache diary) merupakan alat paling berguna: mencatat tanggal, durasi, intensitas, pemicu, obat yang diminum, dan hubungan dengan haid — berguna untuk diagnosis, identifikasi medication overuse, dan penilaian respons profilaksis',
    ],
    etiologi:
      'Kelainan neurovaskular dengan dasar predisposisi genetik poligenik yang menyebabkan otak lebih mudah terangsang (hipereksitabilitas kortikal) dan lebih peka terhadap perubahan lingkungan internal maupun eksternal.',
    patofisiologi:
      'Migren tidak lagi dipahami sebagai sekadar penyempitan dan pelebaran pembuluh darah, melainkan sebagai gangguan otak yang melibatkan sistem trigeminovaskular. Aura disebabkan CORTICAL SPREADING DEPRESSION, yaitu gelombang depolarisasi neuron dan glia yang menjalar perlahan sekitar 3 mm per menit melintasi korteks lalu diikuti penekanan aktivitas listrik — inilah sebabnya gejala aura berkembang bertahap dalam 5-60 menit dan bersifat sementara, berbeda dengan defisit stroke yang muncul mendadak dan menetap. Gelombang ini mengaktifkan ujung saraf trigeminal yang menginervasi pembuluh darah meningeal, memicu pelepasan neuropeptida terutama CALCITONIN GENE-RELATED PEPTIDE (CGRP) serta substansi P, yang menimbulkan vasodilatasi dan inflamasi neurogenik steril pada meningen. Sinyal nyeri diteruskan melalui ganglion trigeminal ke nukleus kaudalis trigeminal di batang otak lalu ke talamus dan korteks. Sensitisasi perifer menjelaskan sifat nyeri yang berdenyut dan memberat dengan aktivitas fisik, sedangkan sensitisasi sentral menjelaskan timbulnya alodinia kulit kepala di mana menyisir rambut pun terasa nyeri. Pemahaman peran CGRP inilah yang melahirkan kelas obat baru berupa antagonis CGRP. Batang otak dan hipotalamus berperan sebagai generator serangan yang menjelaskan gejala prodromal seperti menguap dan mengidam makanan yang muncul jauh sebelum nyeri dimulai.',
    faktorRisiko: [
      'Riwayat migren dalam keluarga',
      'Jenis kelamin perempuan, dengan rasio sekitar tiga kali lipat dibanding laki-laki setelah pubertas',
      'Usia produktif, puncak insidens pada dekade ketiga dan keempat',
      'Fluktuasi hormonal: haid, kontrasepsi hormonal, dan perimenopause',
      'Gangguan tidur termasuk kurang tidur, tidur berlebihan, dan kerja giliran malam',
      'Stres psikososial serta komorbid depresi dan gangguan cemas',
      'Obesitas yang berkaitan dengan kronifikasi migren',
      'Penggunaan analgesik berlebihan yang memicu medication overuse headache',
    ],
    goldStandard:
      'Diagnosis ditegakkan secara klinis menurut kriteria International Classification of Headache Disorders. MIGREN TANPA AURA memerlukan minimal 5 serangan yang berlangsung 4-72 jam bila tidak diobati, dengan minimal DUA dari empat sifat nyeri (unilateral, berdenyut, intensitas sedang-berat, memberat dengan aktivitas fisik rutin), DAN minimal SATU dari dua gejala penyerta (mual dengan atau tanpa muntah, atau fotofobia bersama fonofobia), serta tidak lebih baik dijelaskan oleh diagnosis lain. MIGREN DENGAN AURA memerlukan minimal 2 serangan dengan gejala aura visual, sensorik, atau bicara yang reversibel penuh, berkembang bertahap dalam 5 menit atau lebih, dan berlangsung 5-60 menit.',
    diagnosisBanding: [
      'Nyeri kepala tipe tegang — bilateral, seperti diikat atau ditekan, intensitas ringan-sedang, TIDAK memberat dengan aktivitas, tanpa mual bermakna',
      'Nyeri kepala klaster — serangan sangat hebat unilateral periorbital berdurasi 15-180 menit dengan gejala otonom ipsilateral (mata merah, berair, hidung tersumbat, ptosis), dan penderita justru GELISAH mondar-mandir bukan berbaring diam',
      'Perdarahan subarakhnoid — nyeri kepala HEBAT MENDADAK memuncak dalam detik, kaku kuduk; kedaruratan yang wajib disingkirkan',
      'Meningitis — demam, kaku kuduk, penurunan kesadaran',
      'Arteritis sel raksasa — usia di atas 50 tahun, nyeri temporal, klaudikasio rahang, laju endap darah sangat tinggi; berisiko kebutaan bila terlambat',
      'Tumor intrakranial dan hipertensi intrakranial — nyeri progresif memberat, memburuk pagi hari atau saat batuk dan mengejan, papiledema, defisit neurologis',
      'Neuralgia trigeminal — nyeri seperti tersengat listrik sesaat pada distribusi saraf trigeminal, dipicu sentuhan ringan',
      'Medication overuse headache — nyeri kepala hampir setiap hari pada pengguna analgesik berlebihan',
      'Transient ischaemic attack — defisit neurologis mendadak tanpa perkembangan bertahap dan tanpa gejala positif seperti kilatan cahaya',
    ],
    pengkajian:
      'Dipikirkan migren tanpa aura pada pasien ini atas dasar nyeri kepala berulang yang telah berlangsung bertahun-tahun dengan sifat unilateral dan berdenyut, intensitas sedang hingga berat yang memberat bila beraktivitas sehingga pasien memilih berbaring di ruang gelap, disertai mual serta fotofobia dan fonofobia, dengan durasi serangan antara empat hingga tujuh puluh dua jam dan pemeriksaan neurologis yang sepenuhnya normal di antara serangan. Riwayat keluarga yang positif serta adanya pemicu yang dapat diidentifikasi seperti kurang tidur, telat makan, dan haid semakin mendukung. Nyeri kepala tipe tegang menjadi pertimbangan utama karena sama-sama merupakan nyeri kepala primer yang berulang, namun sifatnya bilateral seperti diikat dengan intensitas yang lebih ringan, TIDAK memberat dengan aktivitas fisik, dan tidak disertai mual yang bermakna — ketiga perbedaan inilah yang secara praktis memisahkan keduanya di layanan primer. Nyeri kepala klaster dipertimbangkan bila nyeri sangat hebat di sekitar mata dengan gejala otonom ipsilateral berupa mata merah berair dan hidung tersumbat, namun durasinya jauh lebih singkat dan penderita justru gelisah mondar-mandir, bukan berbaring diam seperti pada migren. Yang paling penting dan tidak boleh dilewatkan adalah menyingkirkan NYERI KEPALA SEKUNDER melalui pencarian tanda bahaya: perdarahan subarakhnoid ditandai nyeri hebat mendadak yang memuncak dalam hitungan detik disertai kaku kuduk; meningitis ditandai demam dengan rangsang meningeal; arteritis sel raksasa dicurigai pada pasien di atas lima puluh tahun dengan nyeri temporal dan klaudikasio rahang yang bila terlambat berujung kebutaan; sedangkan lesi desak ruang ditandai nyeri progresif yang memberat pagi hari atau saat mengejan disertai papiledema dan defisit neurologis. Karena pada pasien ini tidak dijumpai satu pun tanda bahaya dan pemeriksaan neurologis normal, pencitraan kepala tidak diperlukan. Satu hal yang wajib ditelusuri sebelum menyusun rencana terapi adalah JUMLAH HARI PENGGUNAAN ANALGESIK PER BULAN, sebab pemakaian berlebihan dapat mengubah migren episodik menjadi nyeri kepala harian akibat medication overuse — pada keadaan tersebut menambah dosis analgesik justru memperburuk, dan yang diperlukan adalah penghentian obat penyebab disertai pemberian profilaksis.',
    terapiSuportif: [
      'Saat serangan: istirahat di ruang gelap, tenang, dan sejuk; kompres dingin pada dahi atau pelipis',
      'Hidrasi adekuat, terutama bila disertai muntah — berikan cairan intravena pada serangan berat dengan muntah persisten (status migrainosus)',
      'Jangan melewatkan waktu makan; asupan kalori teratur mencegah hipoglikemia relatif yang menjadi pemicu',
      'Antiemetik seperti metoklopramid atau domperidon tidak hanya meredakan mual tetapi juga memperbaiki penyerapan analgesik oral yang terhambat akibat gastroparesis saat serangan',
      'Teknik relaksasi, pernapasan dalam, biofeedback, dan terapi perilaku kognitif sebagai terapi non-farmakologis dengan bukti manfaat',
    ],
    tatalaksana: [
      'TERAPI SERANGAN AKUT diberikan SEDINI MUNGKIN saat nyeri baru mulai — menunda pemberian menurunkan efektivitas secara bermakna karena sensitisasi sentral sudah terlanjur terbentuk',
      'Serangan ringan-sedang: parasetamol 1000 mg, atau obat antiinflamasi nonsteroid seperti ibuprofen 400-600 mg, natrium diklofenak 50-100 mg, atau asam mefenamat 500 mg',
      'Serangan sedang-berat atau gagal dengan analgesik biasa: TRIPTAN seperti sumatriptan 50-100 mg oral, dapat diulang setelah 2 jam dengan dosis maksimal 200 mg per hari',
      'Triptan KONTRAINDIKASI pada penyakit jantung koroner, riwayat infark miokard, stroke, penyakit arteri perifer, hipertensi tidak terkontrol, dan migren hemiplegik — karena bersifat vasokonstriktor',
      'Tambahkan antiemetik metoklopramid 10 mg bila disertai mual dan muntah',
      'BATASI penggunaan analgesik maksimal 15 hari per bulan untuk analgesik sederhana dan 10 hari per bulan untuk triptan serta obat kombinasi guna mencegah medication overuse headache',
      'TERAPI PROFILAKSIS diindikasikan bila serangan 4 kali atau lebih per bulan, serangan berat yang mengganggu fungsi, terapi akut tidak efektif atau kontraindikasi, atau terdapat medication overuse',
      'Pilihan profilaksis: propranolol 40-160 mg per hari (hindari pada asma, bradikardia, dan blok jantung), amitriptilin 10-75 mg malam hari (bermanfaat bila disertai insomnia atau depresi, hati-hati efek antikolinergik), topiramat 25-100 mg per hari (perhatikan penurunan berat badan, parestesia, dan TERATOGENIK sehingga perlu kontrasepsi efektif), atau flunarizin',
      'Mulai profilaksis dengan dosis rendah lalu titrasi bertahap; nilai respons setelah 8-12 minggu pada dosis adekuat sebelum menyimpulkan gagal — target keberhasilan adalah pengurangan frekuensi serangan sebesar 50% atau lebih',
      'Lanjutkan profilaksis 6-12 bulan bila berhasil, lalu turunkan bertahap',
      'Pada migren menstrual dapat diberikan profilaksis jangka pendek di sekitar masa haid',
      'PERHATIAN KHUSUS: migren DENGAN AURA merupakan kontraindikasi relatif hingga absolut bagi kontrasepsi hormonal KOMBINASI karena meningkatkan risiko stroke iskemik, terlebih bila disertai merokok — pilih kontrasepsi progestin saja atau non-hormonal',
      'Pada kehamilan: parasetamol merupakan pilihan paling aman; hindari obat antiinflamasi nonsteroid pada trimester ketiga dan hindari topiramat sepenuhnya',
      'Status migrainosus (serangan lebih dari 72 jam): rawat inap dengan hidrasi, antiemetik parenteral, dan kortikosteroid untuk memutus serangan',
    ],
    edukasi: [
      'Jelaskan bahwa migren adalah penyakit otak yang NYATA dan dapat dikendalikan meski belum dapat disembuhkan total — pemahaman ini penting karena banyak penderita merasa keluhannya diremehkan atau dianggap mengada-ada',
      'Ajarkan penggunaan CATATAN HARIAN NYERI KEPALA untuk mengenali pola dan pemicu pribadi, karena pemicu bersifat sangat individual dan berbeda antar penderita',
      'Penjadwalan makan: makan TERATUR tiga kali sehari dan JANGAN MELEWATKAN WAKTU MAKAN — telat makan merupakan salah satu pemicu paling sering; sediakan camilan bila jadwal padat',
      'Porsi dan jenis makanan: tidak ada pantangan universal, namun bila catatan harian menunjukkan makanan tertentu memicu serangan (keju fermentasi, cokelat, penyedap monosodium glutamat, anggur merah), barulah makanan tersebut dihindari. Jaga asupan air minimal 2 liter per hari, dan bila terbiasa minum kopi jangan menghentikannya mendadak karena putus kafein justru memicu nyeri kepala',
      'JAM TIDUR merupakan salah satu intervensi paling berdampak: tidur 7-8 jam dengan jadwal KONSISTEN termasuk pada akhir pekan — baik kurang tidur maupun tidur berlebihan sama-sama memicu serangan',
      'Pola olahraga: aktivitas aerobik intensitas sedang seperti jalan cepat, berenang, atau bersepeda selama 30 menit sebanyak 3-5 kali per minggu terbukti menurunkan frekuensi serangan. Lakukan pemanasan memadai dan jangan berolahraga berat saat perut kosong atau dehidrasi karena justru dapat memicu serangan',
      'Kelola stres dengan teknik relaksasi, pernapasan dalam, atau meditasi; perhatikan bahwa serangan sering muncul justru SETELAH stres mereda seperti pada akhir pekan',
      'Batasi paparan cahaya menyilaukan dan layar berkepanjangan; gunakan pencahayaan yang nyaman dan istirahatkan mata secara berkala',
      'Minum obat pereda SEGERA saat serangan mulai, jangan ditunda menunggu nyeri memberat; namun JANGAN melebihi batas jumlah hari per bulan yang sudah ditentukan',
      'Kontrol dalam 4-8 minggu untuk menilai respons terapi dan meninjau catatan harian; bila menggunakan profilaksis, evaluasi setelah 8-12 minggu',
      'SEGERA ke fasilitas kesehatan bila nyeri kepala berubah pola, terasa jauh lebih hebat dari biasanya atau muncul mendadak, disertai demam dan kaku kuduk, kelemahan anggota gerak, bicara pelo, gangguan penglihatan yang menetap, kejang, atau penurunan kesadaran',
    ],
    komplikasi: [
      'Status migrainosus berupa serangan yang berlangsung lebih dari 72 jam dengan risiko dehidrasi',
      'Migren kronik yaitu nyeri kepala 15 hari atau lebih per bulan selama lebih dari 3 bulan',
      'Medication overuse headache akibat penggunaan analgesik berlebihan',
      'Infark migrainosus — stroke iskemik yang terjadi saat serangan migren dengan aura, risikonya meningkat bila disertai merokok dan kontrasepsi hormonal kombinasi',
      'Aura persisten tanpa infark dan kejang yang dipicu aura migren',
      'Komorbid depresi, gangguan cemas, dan gangguan tidur',
      'Disabilitas bermakna berupa hilangnya hari kerja dan sekolah serta penurunan kualitas hidup',
    ],
    prognosis:
      'Migren merupakan penyakit kronik yang tidak dapat disembuhkan total namun sangat dapat dikendalikan. Sebagian besar penderita mengalami perbaikan frekuensi dan intensitas seiring bertambahnya usia, dan pada perempuan sering membaik setelah menopause serta selama kehamilan trimester kedua dan ketiga. Dengan kombinasi identifikasi pemicu, pengaturan gaya hidup terutama tidur dan makan yang teratur, terapi akut yang tepat waktu, serta profilaksis pada indikasi yang sesuai, mayoritas penderita dapat mencapai pengurangan frekuensi serangan lebih dari separuh. Risiko utama yang justru bersumber dari penanganan yang keliru adalah kronifikasi akibat penggunaan analgesik berlebihan, sehingga edukasi mengenai batas pemakaian obat menjadi sama pentingnya dengan pemilihan obatnya.',
    referensi: ['SKDI2012', 'PERDOSSI2016', 'PPKFKTP2014', 'ADAMS2019'],
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

  // ─── Gastrointestinal & Hepatobilier ─────────────────────────────────────
  'Sumbing pada bibir dan palatum': {
    definisi: 'Celah bibir (labioschisis) dan/atau langit-langit (palatoschisis) akibat kegagalan fusi struktur wajah pada masa embrional.',
    diagnosis: ['Tampak jelas saat lahir; nilai luas celah (unilateral/bilateral, komplet/inkomplet), kemampuan menyusu, dan cari kelainan kongenital penyerta'],
    tatalaksana: ['Prioritas awal: nutrisi (dot khusus, posisi menyusu tegak), cegah aspirasi; koreksi bedah bertahap — labioplasti sekitar usia 3 bulan, palatoplasti sekitar 9-18 bulan (rule of ten); terapi wicara dan evaluasi pendengaran jangka panjang'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Micrognatia and macrognatia': {
    definisi: 'Kelainan ukuran mandibula — mikrognatia (rahang bawah terlalu kecil) atau makrognatia (terlalu besar).',
    diagnosis: ['Tampak pada inspeksi wajah dan oklusi gigi; mikrognatia berat berisiko obstruksi jalan napas (mis. pada sekuens Pierre Robin); evaluasi kelainan sindromik penyerta'],
    tatalaksana: ['Amankan jalan napas pada mikrognatia berat (posisi pronasi, alat bantu), dukungan nutrisi, koreksi bedah ortognatik setelah pertumbuhan selesai, kerja sama ortodonti'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Kandidiasis mulut': {
    definisi: 'Infeksi jamur Candida pada mukosa mulut, umum pada bayi, lansia, pengguna kortikosteroid inhalasi, dan imunokompromais.',
    diagnosis: ['Plak putih seperti susu yang dapat dikerok meninggalkan dasar eritematosa dan mudah berdarah; pada dewasa tanpa faktor risiko jelas, skrining HIV dan DM'],
    tatalaksana: ['Antijamur topikal (nistatin drop/gel mikonazol) sebagai lini pertama, flukonazol oral bila luas/rekuren atau imunokompromais; atasi faktor predisposisi (kumur setelah steroid inhalasi, kebersihan dot dan gigi palsu)'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Ulkus mulut (aptosa, herpes)': {
    definisi: 'Luka pada mukosa mulut; stomatitis aftosa rekuren (sariawan) bersifat idiopatik, sedangkan herpes oral disebabkan HSV-1.',
    diagnosis: ['Aftosa: ulkus bulat dangkal dengan dasar kuning dan halo eritematosa, pada mukosa tidak berkeratin, tidak didahului vesikel; Herpes: didahului vesikel berkelompok, gingivostomatitis primer disertai demam pada anak'],
    tatalaksana: ['Aftosa: analgesik/anestetik topikal, kortikosteroid topikal, hindari pemicu, cari defisiensi (besi, B12, folat) bila rekuren berat; Herpes: asiklovir bila dalam 72 jam onset atau kasus berat, jaga hidrasi terutama pada anak'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Glositis': {
    definisi: 'Inflamasi lidah yang menyebabkan perubahan warna, tekstur (atrofi papil), dan nyeri.',
    diagnosis: ['Lidah merah, licin karena atrofi papil, nyeri atau rasa terbakar; cari penyebab: defisiensi besi/B12/folat/riboflavin, kandidiasis, iritasi lokal, obat'],
    tatalaksana: ['Koreksi defisiensi nutrisi yang mendasari, hilangkan iritan (gigi tajam, tembakau, alkohol), antijamur bila kandidiasis, kebersihan mulut dan analgesik topikal'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Leukoplakia': {
    definisi: 'Bercak putih pada mukosa mulut yang tidak dapat dikerok dan tidak dapat diklasifikasikan sebagai penyakit lain — bersifat prakanker.',
    diagnosis: ['Plak putih melekat yang TIDAK bisa dikerok (membedakan dari kandidiasis), faktor risiko merokok/tembakau kunyah/alkohol; biopsi wajib untuk menilai displasia atau keganasan'],
    tatalaksana: ['Hentikan tembakau dan alkohol, biopsi dan eksisi lesi dengan displasia, pemantauan berkala jangka panjang karena risiko transformasi menjadi karsinoma sel skuamosa'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'HARRISON2022'],
  },
  'Angina Ludwig': {
    definisi: 'Selulitis progresif pada ruang submandibular bilateral, umumnya berasal dari infeksi gigi — mengancam jalan napas.',
    diagnosis: ['Pembengkakan keras (brawny) dasar mulut dan submandibular bilateral, lidah terangkat, disfagia, trismus, demam; waspada stridor dan gawat napas'],
    tatalaksana: ['AMANKAN JALAN NAPAS sebagai prioritas utama (siapkan intubasi sulit/trakeostomi), antibiotik IV dosis tinggi mencakup anaerob, drainase bedah, atasi sumber infeksi gigi — rujuk segera'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Parotitis': {
    definisi: 'Inflamasi kelenjar parotis, dapat viral (mumps/gondongan) atau bakterial (supuratif).',
    diagnosis: ['Pembengkakan di depan dan bawah daun telinga yang mengangkat lobus telinga, nyeri saat mengunyah; mumps: bilateral, riwayat kontak, tidak ada pus dari duktus Stensen; bakterial: unilateral, pus dapat diperah dari duktus'],
    tatalaksana: ['Mumps: suportif (analgesik, kompres, hidrasi), isolasi, waspada komplikasi (orkitis, meningitis, pankreatitis); pencegahan melalui vaksin MMR. Bakterial: antibiotik antistafilokokus, hidrasi, stimulasi saliva, drainase bila abses'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Karies gigi': {
    definisi: 'Kerusakan jaringan keras gigi akibat demineralisasi oleh asam hasil fermentasi bakteri plak.',
    diagnosis: ['Lubang atau perubahan warna pada gigi, nyeri saat makan manis/dingin, dapat berkembang menjadi pulpitis dan abses periapikal bila dalam'],
    tatalaksana: ['Rujuk dokter gigi untuk restorasi/penambalan, analgesia dan antibiotik bila sudah ada infeksi periapikal, edukasi kebersihan mulut, pasta gigi berfluorida, batasi gula, kontrol gigi berkala'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Atresia esofagus': {
    definisi: 'Kelainan kongenital berupa terputusnya kontinuitas esofagus, umumnya disertai fistula trakeoesofageal.',
    diagnosis: ['Neonatus dengan air liur berbuih berlebih, tersedak dan sianosis saat menyusu, polihidramnion antenatal; kateter nasogastrik tidak dapat masuk ke lambung (coiling pada rontgen) menegakkan diagnosis'],
    tatalaksana: ['Puasa dan suction kontinu kantong esofagus proksimal, posisi kepala lebih tinggi untuk cegah aspirasi, antibiotik, rujuk bedah anak untuk koreksi definitif; cari anomali VACTERL penyerta'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Akalasia': {
    definisi: 'Gangguan motilitas esofagus akibat kegagalan relaksasi sfingter esofagus bawah dan hilangnya peristaltik.',
    diagnosis: ['Disfagia progresif untuk makanan padat DAN cair sejak awal (berbeda dari striktur/keganasan yang mulai dari padat), regurgitasi makanan tidak tercerna, penurunan BB; barium swallow menunjukkan gambaran bird beak, manometri sebagai baku emas'],
    tatalaksana: ['Dilatasi pneumatik atau miotomi Heller (laparoskopik/POEM) sebagai terapi definitif, injeksi toksin botulinum pada pasien risiko tinggi operasi, nitrat/calcium channel blocker sebagai terapi sementara'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Esofagitis refluks': {
    definisi: 'Inflamasi mukosa esofagus akibat paparan asam lambung berulang pada penyakit refluks gastroesofageal.',
    diagnosis: ['Rasa terbakar di dada (heartburn) dan regurgitasi asam, memberat saat berbaring atau setelah makan; endoskopi bila ada alarm symptoms (disfagia, penurunan BB, anemia, perdarahan, usia lanjut onset baru)'],
    tatalaksana: ['Modifikasi gaya hidup: tinggikan kepala tempat tidur, hindari makan 3 jam sebelum tidur, turunkan BB, hindari pemicu (kopi, cokelat, makanan berlemak, rokok); PPI sebagai terapi utama; evaluasi Barrett esofagus pada kasus kronik'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Lesi korosif pada esofagus': {
    definisi: 'Kerusakan esofagus akibat menelan zat korosif (asam kuat atau basa kuat), dapat menyebabkan perforasi akut dan striktur kronik.',
    diagnosis: ['Riwayat menelan zat korosif, nyeri menelan hebat, air liur berlebih, luka bakar di bibir/mulut; endoskopi dini (12-24 jam) untuk menilai derajat — hindari setelah 48 jam karena risiko perforasi'],
    tatalaksana: ['JANGAN merangsang muntah, JANGAN memasang NGT buta, JANGAN memberi zat penetral (reaksi eksotermik memperberat); puasa, cairan IV, analgesia, PPI; rujuk untuk endoskopi dan pemantauan striktur jangka panjang'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Varises esofagus': {
    definisi: 'Dilatasi vena submukosa esofagus akibat hipertensi portal, umumnya karena sirosis hati; berisiko perdarahan masif.',
    diagnosis: ['Hematemesis masif atau melena pada pasien dengan tanda penyakit hati kronik (ikterik, spider naevi, asites, splenomegali); endoskopi menegakkan sumber sekaligus terapi'],
    tatalaksana: ['Resusitasi cairan/darah, obat vasoaktif (oktreotid/terlipresin), antibiotik profilaksis (menurunkan mortalitas), ligasi endoskopik sebagai terapi definitif; profilaksis sekunder: beta-blocker non-selektif dan ligasi berulang'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Ruptur esofagus': {
    definisi: 'Perforasi dinding esofagus, dapat spontan setelah muntah hebat (sindrom Boerhaave) atau iatrogenik pasca instrumentasi.',
    diagnosis: ['Nyeri dada hebat setelah muntah, emfisema subkutis leher, sesak, tanda sepsis; rontgen menunjukkan pneumomediastinum, konfirmasi dengan esofagografi kontras larut air atau CT'],
    tatalaksana: ['Kegawatdaruratan bedah — puasa, antibiotik IV spektrum luas, resusitasi, drainase mediastinum dan perbaikan bedah segera; mortalitas meningkat tajam bila terlambat >24 jam'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Hernia umbilikalis': {
    definisi: 'Protrusi isi abdomen melalui cincin umbilikus yang tidak menutup sempurna.',
    diagnosis: ['Benjolan di umbilikus yang membesar saat menangis/mengejan dan dapat dimasukkan kembali (reponibel); nilai tanda inkarserata/strangulata (nyeri, keras, tidak dapat direposisi, muntah)'],
    tatalaksana: ['Observasi pada anak — sebagian besar menutup spontan sebelum usia 4-5 tahun; operasi bila menetap setelah usia tersebut, cincin sangat besar, atau terjadi komplikasi; pada dewasa umumnya perlu perbaikan bedah'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Perforasi usus': {
    definisi: 'Terbentuknya lubang pada dinding usus sehingga isi lumen masuk ke rongga peritoneum, menyebabkan peritonitis.',
    diagnosis: ['Nyeri perut hebat mendadak, defans muskular dan nyeri lepas (tanda peritonitis), bising usus menghilang, tanda sepsis; rontgen abdomen tegak/LLD menunjukkan udara bebas subdiafragma'],
    tatalaksana: ['Kegawatdaruratan bedah: puasa, NGT dekompresi, resusitasi cairan, antibiotik IV spektrum luas termasuk anaerob, laparotomi segera untuk menutup perforasi dan lavase peritoneum'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Malrotasi traktus gastro-intestinal': {
    definisi: 'Kelainan kongenital rotasi dan fiksasi usus selama perkembangan, berisiko volvulus midgut yang mengancam nyawa.',
    diagnosis: ['Neonatus/bayi dengan muntah hijau (bilious vomiting) — selalu anggap sebagai kedaruratan bedah sampai terbukti sebaliknya; upper GI series menunjukkan posisi abnormal ligamentum Treitz'],
    tatalaksana: ['Puasa, NGT, resusitasi cairan, rujuk bedah anak SEGERA; prosedur Ladd untuk koreksi; volvulus midgut dapat menyebabkan nekrosis usus masif dalam hitungan jam'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Infeksi pada umbilikus': {
    definisi: 'Omfalitis — infeksi tali pusat dan jaringan sekitarnya pada neonatus, berpotensi menjadi sepsis dan fasciitis nekrotikans.',
    diagnosis: ['Kemerahan dan indurasi kulit sekitar umbilikus, sekret purulen berbau, dapat disertai demam dan tanda sepsis neonatal; nilai luas eritema sebagai penanda keparahan'],
    tatalaksana: ['Antibiotik sistemik (kombinasi mencakup Staphylococcus dan gram negatif), perawatan tali pusat bersih dan kering, rawat inap dan evaluasi sepsis pada neonatus; pencegahan melalui perawatan tali pusat higienis'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Sindrom Reye': {
    definisi: 'Ensefalopati akut dengan degenerasi lemak hati, klasik terkait pemberian aspirin pada anak dengan infeksi virus.',
    diagnosis: ['Anak pasca infeksi virus (influenza, varisela) dengan muntah persisten diikuti perubahan perilaku dan penurunan kesadaran; transaminase dan amonia meningkat, bilirubin relatif normal, hipoglikemia'],
    tatalaksana: ['Suportif intensif: koreksi hipoglikemia dan gangguan elektrolit, turunkan amonia, kontrol tekanan intrakranial; PENCEGAHAN adalah kunci — jangan berikan aspirin pada anak dan remaja dengan infeksi virus'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'HARRISON2022'],
  },
  'Gastroenteritis (termasuk kolera, giardiasis)': {
    definisi: 'Peradangan mukosa lambung dan usus akibat infeksi yang bermanifestasi sebagai diare akut dengan atau tanpa muntah; masih menjadi penyebab kematian anak balita terbanyak kedua di dunia, dan hampir seluruh kematiannya disebabkan dehidrasi yang sebenarnya dapat dicegah.',
    anamnesis: {
      keluhanUtama: 'Buang air besar cair lebih dari tiga kali sehari sejak beberapa hari, disertai muntah dan lemas.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: nyeri perut periumbilikal pada enteritis usus halus, atau nyeri perut bawah dan tenesmus pada kolitis. Onset: mendadak; catat waktu tepat dimulainya untuk memperkirakan penyebab — toksin praterbentuk seperti Staphylococcus aureus menimbulkan gejala dalam 1-6 jam, sedangkan patogen invasif seperti Salmonella dalam 12-72 jam. Character: KUANTIFIKASI diare — frekuensi per hari, volume tiap kali (seberapa banyak dibanding gelas), konsistensi (cair, lembek, seperti air cucian beras pada kolera), dan yang paling penting ADA TIDAKNYA DARAH DAN LENDIR yang menandakan disentri. Radiation: nyeri menjalar ke seluruh perut. Associations: muntah dan frekuensinya, demam, nyeri kepala, kram otot akibat gangguan elektrolit, tenesmus, dan yang terpenting FREKUENSI SERTA VOLUME BUANG AIR KECIL TERAKHIR sebagai penanda dehidrasi paling praktis. Time course: diare akut kurang dari 14 hari, persisten 14-30 hari, kronik lebih dari 30 hari; giardiasis khas berlangsung kronik dengan tinja berlemak dan kembung. Exacerbating: hubungan dengan makanan atau minuman tertentu, riwayat jajan di luar, dan sumber air minum. Severity: kemampuan minum dan makan, tingkat kelemahan, serta apakah masih dapat beraktivitas.',
      riwayatPenyakitDahulu: 'Riwayat diare berulang, penyakit saluran cerna kronik, imunodefisiensi termasuk HIV, diabetes, dan penyakit ginjal yang memperberat gangguan cairan.',
      riwayatPenyakitKeluarga: 'Apakah ada anggota keluarga atau orang lain yang makan bersama juga mengalami keluhan serupa — mengarah pada keracunan makanan atau wabah setempat.',
      riwayatPengobatan:
        'Penggunaan ANTIBIOTIK dalam 3 bulan terakhir (mengarahkan pada kolitis akibat Clostridioides difficile), obat antidiare yang sudah diminum sendiri, obat pencahar, dan jamu; tanyakan pula penggunaan obat antiinflamasi nonsteroid dan penghambat pompa proton.',
      riwayatAlergi: 'Riwayat alergi obat dan alergi makanan yang dapat menjadi diagnosis banding.',
      riwayatTumbuhKembang: 'Pada anak: berat badan sebelum sakit sebagai pembanding, riwayat pertumbuhan pada KMS, dan riwayat diare berulang yang berdampak pada status gizi.',
      riwayatNutrisi:
        'Pada bayi: apakah mendapat ASI eksklusif, penggunaan susu formula dan cara penyiapannya (kebersihan botol dan air), serta usia dan jenis MPASI. Pada semua usia: riwayat makanan dan minuman dalam 72 jam terakhir, terutama makanan tidak dimasak matang, es batu, jajanan pinggir jalan, dan makanan yang disimpan lama.',
      riwayatImunisasi: 'Status imunisasi rotavirus dan campak pada anak — campak meningkatkan risiko diare berat.',
      riwayatSosialEkonomi:
        'Sumber air minum dan cara pengolahannya, ketersediaan jamban sehat, kebiasaan cuci tangan pakai sabun, kondisi sanitasi lingkungan, riwayat banjir, serta akses ke fasilitas kesehatan bila kondisi memburuk.',
    },
    pemeriksaanFisik: [
      'PENILAIAN DERAJAT DEHIDRASI adalah pemeriksaan terpenting dan menentukan seluruh rencana terapi',
      'Tanpa dehidrasi: sadar penuh, mata normal, minum biasa, turgor kembali cepat',
      'Dehidrasi ringan-sedang: gelisah atau rewel, mata cekung, HAUS dan ingin minum banyak, turgor kembali lambat (kurang dari 2 detik)',
      'Dehidrasi berat: letargi atau tidak sadar, mata sangat cekung, TIDAK BISA MINUM atau malas minum, turgor kembali sangat lambat (2 detik atau lebih), nadi cepat lemah, akral dingin, capillary refill memanjang',
      'Timbang berat badan — selisih terhadap berat sebelum sakit merupakan estimasi defisit cairan paling akurat (penurunan 1 kg setara 1 liter)',
      'Tanda vital lengkap termasuk suhu, nadi, tekanan darah, dan frekuensi napas; napas cepat dan dalam menandakan asidosis metabolik',
      'Ubun-ubun besar cekung pada bayi, mulut dan lidah kering, air mata berkurang saat menangis',
      'Abdomen: bising usus meningkat, nyeri tekan difus; waspadai distensi dengan bising usus menghilang yang menandakan ileus akibat hipokalemia',
      'Inspeksi perianal untuk ekskoriasi, dan periksa tinja secara makroskopis untuk darah dan lendir',
    ],
    antropometri:
      'Pada anak, plot berat badan menurut umur, tinggi badan menurut umur, dan berat badan menurut tinggi badan pada kurva WHO. Berat badan menurut tinggi badan kurang dari -3 standar deviasi menandakan gizi buruk yang memerlukan tatalaksana khusus dan meningkatkan risiko kematian akibat diare secara bermakna. Persentase penurunan berat badan terhadap berat sebelum sakit memperkirakan derajat dehidrasi: kurang dari 5% ringan, 5-10% sedang, dan lebih dari 10% berat. Pada anak dengan gizi buruk, tanda klinis dehidrasi seperti turgor dan mata cekung menjadi TIDAK ANDAL karena hilangnya lemak subkutan, sehingga penilaian harus lebih hati-hati dan rehidrasi menggunakan ReSoMal, bukan oralit standar.',
    penunjang: [
      'Sebagian besar diare akut TIDAK memerlukan pemeriksaan penunjang — diagnosis dan tatalaksana berdasarkan penilaian klinis derajat dehidrasi',
      'Pemeriksaan tinja rutin dan mikroskopis bila diare berdarah, dicurigai amubiasis (ditemukan trofozoit dengan eritrosit di dalamnya), atau giardiasis (kista atau trofozoit Giardia)',
      'Kultur tinja pada diare berdarah, demam tinggi, imunokompromais, atau dugaan wabah',
      'Elektrolit, ureum, kreatinin, dan analisis gas darah pada dehidrasi berat, kejang, atau penurunan kesadaran — cari hipokalemia, hipernatremia atau hiponatremia, dan asidosis metabolik',
      'Darah lengkap bila dicurigai infeksi bakteri invasif atau sepsis; gula darah pada penurunan kesadaran',
      'Pada kolera: konfirmasi dengan kultur atau rapid test untuk kepentingan surveilans dan pelaporan wabah',
    ],
    etiologi:
      'Virus merupakan penyebab tersering pada anak, terutama rotavirus dan norovirus. Bakteri meliputi Escherichia coli patogen, Shigella, Salmonella, Campylobacter, dan Vibrio cholerae. Parasit meliputi Entamoeba histolytica, Giardia lamblia, dan Cryptosporidium.',
    patofisiologi:
      'Terdapat dua mekanisme utama. Diare SEKRETORIK terjadi ketika enterotoksin, misalnya toksin kolera, mengaktifkan adenilat siklase sehingga kadar siklik AMP dalam enterosit meningkat dan memicu sekresi klorida beserta air ke lumen usus secara masif — akibatnya diare berlangsung tanpa henti meski pasien dipuasakan, dan volume kehilangan cairan dapat mencapai beberapa liter per hari. Diare INVASIF atau inflamatorik terjadi ketika patogen seperti Shigella menginvasi mukosa kolon, menimbulkan ulserasi dan respons inflamasi sehingga tinja mengandung darah, lendir, dan leukosit, disertai demam dan tenesmus. Kunci terapi rehidrasi oral terletak pada mekanisme kotransporter natrium-glukosa di brush border enterosit yang TETAP UTUH meski terjadi infeksi: penyerapan glukosa menarik natrium, dan natrium menarik air secara osmotik. Inilah sebabnya oralit harus mengandung glukosa dan garam dalam perbandingan tepat, dan mengapa air putih saja atau minuman manis tinggi gula justru tidak efektif bahkan dapat memperberat diare osmotik.',
    faktorRisiko: [
      'Sanitasi buruk, air minum tidak layak, dan jamban tidak sehat',
      'Tidak mendapat ASI eksklusif dan penyiapan susu formula yang tidak higienis',
      'Status gizi buruk dan defisiensi zink serta vitamin A',
      'Usia balita dan usia lanjut',
      'Imunodefisiensi termasuk HIV',
      'Kepadatan hunian, musim hujan, dan riwayat banjir',
      'Penggunaan antibiotik yang mengganggu flora normal usus',
    ],
    goldStandard:
      'Diagnosis gastroenteritis akut ditegakkan secara KLINIS berdasarkan buang air besar cair tiga kali atau lebih dalam 24 jam yang berlangsung kurang dari 14 hari, disertai penilaian derajat dehidrasi sesuai klasifikasi WHO/Kemenkes. Identifikasi etiologi melalui kultur atau mikroskopi tinja bukan syarat diagnosis dan hanya diperlukan pada diare berdarah, kecurigaan wabah, kasus persisten, atau pasien imunokompromais.',
    diagnosisBanding: [
      'Disentri basiler atau amuba — diare berdarah dengan tenesmus; amubiasis khas dengan tinja berlendir darah dan nyeri perut kanan bawah tanpa demam tinggi',
      'Demam tifoid — demam bertahap mendominasi dengan diare atau justru konstipasi, bradikardia relatif, lidah kotor',
      'Kolera — diare cair sangat masif seperti air cucian beras tanpa nyeri dan tanpa demam, dehidrasi berat dalam hitungan jam',
      'Alergi atau intoleransi makanan — berulang dan berkaitan jelas dengan makanan tertentu, tanpa demam',
      'Apendisitis dan invaginasi pada anak — nyeri perut mendominasi, diare hanya sedikit; invaginasi khas dengan tinja lendir darah seperti selai kismis dan massa berbentuk sosis',
      'Malaria pada daerah endemis dapat bermanifestasi sebagai diare pada anak',
    ],
    pengkajian:
      'Dipikirkan gastroenteritis akut pada pasien ini atas dasar buang air besar cair yang timbul mendadak dengan frekuensi lebih dari tiga kali sehari disertai muntah, berlangsung kurang dari empat belas hari, pada latar riwayat konsumsi makanan atau minuman yang diragukan kebersihannya dan sanitasi lingkungan yang kurang memadai. Ketiadaan darah dan lendir pada tinja mengarahkan pada mekanisme non-invasif, sehingga kemungkinan disentri basiler maupun amuba menjadi kurang mendukung; pada disentri, tinja berdarah berlendir disertai tenesmus merupakan gambaran yang menonjol, dan pada amubiasis khas ditemukan nyeri perut kanan bawah dengan demam yang tidak terlalu tinggi. Demam tifoid dipertimbangkan karena sama-sama dapat menimbulkan gangguan saluran cerna, namun pada tifoid yang mendominasi adalah demam yang naik bertahap dengan pola anak tangga selama lebih dari satu minggu disertai lidah kotor bertepi hiperemis dan bradikardia relatif, sedangkan diare justru sering ringan atau bahkan digantikan konstipasi. Kolera menjadi pertimbangan penting bila diare sangat masif menyerupai air cucian beras tanpa nyeri perut dan tanpa demam dengan dehidrasi yang berkembang sangat cepat, terutama pada situasi wabah. Pada anak, invaginasi wajib disingkirkan bila nyeri perut bersifat kolik hebat dengan tangisan episodik, tinja berlendir darah menyerupai selai kismis, dan teraba massa berbentuk sosis di abdomen, karena kondisi ini merupakan kegawatdaruratan bedah. Namun yang paling menentukan keselamatan pasien pada kasus ini bukanlah penentuan etiologi, melainkan PENILAIAN DERAJAT DEHIDRASI — karena hampir seluruh kematian akibat diare disebabkan oleh kehilangan cairan dan elektrolit, bukan oleh kuman penyebabnya, sehingga rehidrasi yang tepat dan segera menjadi prioritas utama sebelum pertimbangan pemberian antimikroba.',
    terapiSuportif: [
      'RENCANA TERAPI A (tanpa dehidrasi, di rumah): berikan cairan lebih banyak dari biasanya. Oralit setiap kali buang air besar — 50-100 mL pada anak kurang dari 2 tahun, 100-200 mL pada anak 2-10 tahun, dan sebanyak yang diinginkan pada anak lebih besar dan dewasa',
      'RENCANA TERAPI B (dehidrasi ringan-sedang): oralit 75 mL/kgBB diberikan dalam 3 jam pertama di fasilitas kesehatan, lalu nilai ulang derajat dehidrasi',
      'RENCANA TERAPI C (dehidrasi berat): ringer laktat intravena 100 mL/kgBB dengan pembagian — pada bayi kurang dari 12 bulan, 30 mL/kgBB dalam 1 jam pertama dilanjutkan 70 mL/kgBB dalam 5 jam berikutnya; pada anak lebih dari 12 bulan dan dewasa, 30 mL/kgBB dalam 30 menit pertama dilanjutkan 70 mL/kgBB dalam 2,5 jam berikutnya',
      'Nilai ulang setiap 15-30 menit pada dehidrasi berat; bila nadi masih lemah ulangi bolus. Mulai oralit segera setelah pasien mampu minum, umumnya setelah 3-4 jam',
      'Target PRODUKSI URIN minimal 0,5-1 mL/kg/jam sebagai penanda perfusi yang paling praktis; pemulihan kesadaran dan kembalinya rasa haus normal menandakan rehidrasi berhasil',
      'Kebutuhan kalori tetap dipenuhi — jangan puasakan pasien. Pemberian makan yang dilanjutkan mempercepat pemulihan mukosa usus, mengurangi durasi diare, dan mencegah penurunan berat badan',
      'Pada anak dengan gizi buruk gunakan ReSoMal (rehydration solution for malnutrition) yang lebih rendah natrium dan lebih tinggi kalium, dengan pemberian LEBIH LAMBAT dan pemantauan ketat karena risiko gagal jantung akibat kelebihan cairan',
    ],
    tatalaksana: [
      'LIMA LANGKAH TUNTASKAN DIARE (LINTAS Diare) sesuai program nasional: (1) oralit osmolaritas rendah, (2) zink 10-14 hari, (3) teruskan pemberian ASI dan makanan, (4) antibiotik SELEKTIF saja, (5) edukasi kepada orang tua',
      'ZINK diberikan pada semua anak dengan diare selama 10-14 hari BERTURUT-TURUT meskipun diare sudah berhenti: 10 mg per hari untuk bayi kurang dari 6 bulan dan 20 mg per hari untuk anak 6 bulan ke atas — terbukti memperpendek durasi, mengurangi keparahan, dan menurunkan kekambuhan dalam 2-3 bulan berikutnya',
      'ASI dan makanan DITERUSKAN selama diare; jangan mengencerkan susu formula dan jangan menghentikan makan',
      'Antibiotik hanya untuk indikasi jelas: disentri (siprofloksasin atau sefiksim pada anak), kolera (doksisiklin dosis tunggal atau azitromisin), amubiasis dan giardiasis (metronidazol), serta dugaan kolera pada situasi wabah',
      'Antibiotik TIDAK diberikan pada diare cair akut tanpa darah — sebagian besar disebabkan virus, dan pemberian antibiotik justru memperpanjang diare, mendorong resistensi, serta meningkatkan risiko kolitis akibat Clostridioides difficile',
      'OBAT ANTIMOTILITAS seperti loperamid MERUPAKAN KONTRAINDIKASI pada anak dan pada diare berdarah maupun demam — dapat memicu ileus, megakolon toksik, dan memperlama pembuangan kuman',
      'Koreksi hipokalemia dan asidosis; antiemetik hanya bila muntah menghalangi rehidrasi oral',
      'Lapor dan lakukan penyelidikan epidemiologi bila dicurigai kolera atau kejadian luar biasa',
    ],
    edukasi: [
      'Ajarkan CARA MEMBUAT DAN MEMBERI ORALIT dengan benar: satu bungkus dilarutkan dalam 200 mL air matang, diberikan sedikit-sedikit dengan sendok setiap 1-2 menit — bukan diminum sekaligus yang justru memicu muntah. Bila muntah, hentikan 10 menit lalu lanjutkan lebih lambat',
      'Penjadwalan dan porsi makan: berikan makanan porsi KECIL namun SERING, sekitar 6 kali sehari, dengan makanan lunak yang mudah dicerna seperti bubur, pisang, dan kentang. Tambahkan satu kali makan ekstra setiap hari selama dua minggu setelah diare berhenti untuk mengejar pertumbuhan pada anak',
      'Hindari minuman bersoda, jus buah kemasan, teh manis pekat, dan minuman energi karena kandungan gula tinggi memperberat diare osmotik; hindari pula makanan berlemak dan berserat sangat tinggi selama fase akut',
      'Istirahat dan tidur cukup selama fase akut; aktivitas dan olahraga dilanjutkan bertahap setelah rehidrasi tercapai dan tenaga pulih, umumnya dalam beberapa hari',
      'TANDA BAHAYA yang mengharuskan segera kembali: tidak mau minum atau tidak bisa minum, muntah terus-menerus, buang air besar cair sangat sering, timbul darah pada tinja, demam tinggi, sangat lemas atau tidak sadar, mata makin cekung, kejang, dan TIDAK BUANG AIR KECIL lebih dari 6 jam',
      'Kontrol dalam 3 hari bila tidak membaik, atau segera bila muncul tanda bahaya di atas',
      'PENCEGAHAN: cuci tangan pakai sabun sebelum menyiapkan makanan dan setelah dari jamban, gunakan air minum yang direbus hingga mendidih, buang air besar di jamban sehat, berikan ASI eksklusif enam bulan, lengkapi imunisasi rotavirus dan campak, serta suplementasi vitamin A sesuai program',
    ],
    komplikasi: [
      'Dehidrasi berat, syok hipovolemik, dan kematian',
      'Gangguan elektrolit: hipokalemia dengan ileus dan aritmia, hipernatremia atau hiponatremia dengan kejang',
      'Asidosis metabolik dengan napas Kussmaul',
      'Gagal ginjal akut prarenal',
      'Kejang akibat gangguan elektrolit atau demam',
      'Malnutrisi dan gagal tumbuh akibat diare berulang atau persisten, serta intoleransi laktosa sekunder',
    ],
    prognosis:
      'Sangat baik bila rehidrasi diberikan tepat dan segera — sebagian besar diare akut bersifat swasirna dalam 3-7 hari. Terapi rehidrasi oral merupakan salah satu intervensi kesehatan masyarakat paling berdampak dalam sejarah kedokteran modern dan telah menyelamatkan puluhan juta jiwa. Kematian hampir selalu disebabkan keterlambatan pengenalan dehidrasi, bukan oleh virulensi kuman; prognosis memburuk pada bayi, gizi buruk, dan pasien imunokompromais.',
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021', 'WHOSAM2013'],
  },
  'Refluks gastroesofagus': {
    definisi: 'Naiknya isi lambung ke esofagus yang menimbulkan gejala mengganggu dan/atau komplikasi.',
    diagnosis: ['Heartburn dan regurgitasi sebagai gejala khas; diagnosis umumnya klinis dengan respons terhadap PPI; endoskopi bila alarm symptoms atau gagal terapi'],
    tatalaksana: ['Modifikasi gaya hidup dan diet, PPI selama 4-8 minggu lalu evaluasi, antasida untuk gejala sesekali; pada bayi umumnya fisiologis dan membaik seiring usia — cukup edukasi posisi dan pemberian minum'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Ulkus (gaster, duodenum)': {
    definisi: 'Defek mukosa lambung atau duodenum yang menembus muskularis mukosa, tersering akibat infeksi Helicobacter pylori atau penggunaan NSAID.',
    diagnosis: ['Nyeri epigastrium — ulkus duodenum khas membaik dengan makan lalu kambuh 2-3 jam kemudian, ulkus gaster sering memberat dengan makan; uji H. pylori (urea breath test/antigen tinja), endoskopi bila alarm symptoms'],
    tatalaksana: ['Eradikasi H. pylori dengan terapi tripel/kuadrupel bila positif, PPI, hentikan NSAID atau tambahkan proteksi lambung; waspada komplikasi: perdarahan, perforasi, obstruksi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Stenosis pilorik': {
    definisi: 'Hipertrofi otot pilorus yang menyebabkan obstruksi jalan keluar lambung, khas pada bayi usia 3-6 minggu.',
    diagnosis: ['Muntah proyektil non-bilious setelah menyusu, bayi tetap lapar, penurunan BB dan dehidrasi; massa seperti buah zaitun di epigastrium; USG konfirmatif; laboratorium khas alkalosis metabolik hipokloremik hipokalemik'],
    tatalaksana: ['KOREKSI cairan dan elektrolit lebih dahulu (bukan operasi darurat — operasi pada bayi yang belum terkoreksi berbahaya), lalu piloromiotomi Ramstedt; prognosis sangat baik'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Atresia intestinal': {
    definisi: 'Kelainan kongenital berupa terputusnya lumen usus, menyebabkan obstruksi usus neonatal.',
    diagnosis: ['Muntah hijau, distensi abdomen, dan tidak keluar mekonium pada neonatus; rontgen abdomen menunjukkan gambaran double bubble (atresia duodenum) atau multiple air-fluid levels; polihidramnion antenatal'],
    tatalaksana: ['Puasa, NGT dekompresi, resusitasi cairan dan elektrolit, antibiotik, rujuk bedah anak untuk anastomosis; cari kelainan penyerta (sindrom Down pada atresia duodenum)'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Divertikulum Meckel': {
    definisi: 'Sisa duktus vitelinus berupa divertikulum sejati pada ileum, kelainan kongenital saluran cerna tersering.',
    diagnosis: ['Sering asimtomatik; bila bergejala: perdarahan saluran cerna tanpa nyeri pada anak (tersering), obstruksi, atau divertikulitis yang menyerupai apendisitis; Meckel scan (technetium-99m) untuk mukosa lambung ektopik'],
    tatalaksana: ['Reseksi bedah pada divertikulum simtomatik; penemuan insidental pada anak umumnya direseksi, pada dewasa dipertimbangkan kasus per kasus'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Fistula umbilikal, omphalocoele-gastroschisis': {
    definisi: 'Defek dinding abdomen kongenital; omfalokel tertutup kantong peritoneum pada umbilikus, gastroskisis berupa herniasi usus tanpa kantong di lateral umbilikus.',
    diagnosis: ['Tampak saat lahir; omfalokel: organ tertutup membran, sering disertai anomali lain (jantung, kromosom); gastroskisis: usus terpapar langsung, biasanya terisolasi tanpa anomali penyerta'],
    tatalaksana: ['Bungkus organ terpapar dengan kasa lembab steril dan plastik untuk cegah kehilangan cairan dan panas, puasa, NGT, cairan IV, antibiotik, rujuk bedah anak segera untuk penutupan primer atau bertahap (silo)'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Apendisitis akut': {
    definisi: 'Inflamasi apendiks vermiformis, umumnya akibat obstruksi lumen — penyebab abdomen akut bedah tersering.',
    diagnosis: ['Nyeri berpindah dari periumbilikal ke kuadran kanan bawah, anoreksia, mual, demam ringan; nyeri tekan McBurney, Rovsing, psoas, dan obturator sign; skor Alvarado, USG/CT bila meragukan'],
    tatalaksana: ['Apendektomi sebagai terapi definitif, antibiotik perioperatif, resusitasi cairan; jangan tunda karena risiko perforasi meningkat tajam setelah 48 jam gejala'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Abses apendiks': {
    definisi: 'Kumpulan pus terlokalisasi akibat apendisitis yang mengalami perforasi namun terbungkus omentum dan usus sekitarnya.',
    diagnosis: ['Riwayat nyeri perut kanan bawah >5 hari, teraba massa di kuadran kanan bawah, demam; USG/CT menunjukkan koleksi cairan berdinding'],
    tatalaksana: ['Antibiotik IV dan drainase perkutan bila abses besar (pendekatan konservatif awal), apendektomi interval dipertimbangkan 6-8 minggu kemudian; operasi segera lebih sulit karena jaringan rapuh dan berisiko cedera usus'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Perdarahan gastrointestinal': {
    definisi: 'Perdarahan dari saluran cerna, dibagi atas (proksimal ligamentum Treitz) dan bawah.',
    diagnosis: ['Atas: hematemesis, melena; Bawah: hematokezia; nilai hemodinamik lebih dahulu; cari sumber: ulkus peptikum, varises, keganasan, divertikel, hemoroid; endoskopi untuk diagnosis sekaligus terapi'],
    tatalaksana: ['Resusitasi ABC dan akses IV besar, transfusi sesuai kebutuhan (target restriktif Hb ~7 g/dL pada kasus stabil), PPI IV pada perdarahan atas, obat vasoaktif dan antibiotik bila curiga varises, endoskopi terapeutik dini'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Malabsorbsi': {
    definisi: 'Gangguan penyerapan nutrien di usus halus, menyebabkan defisiensi nutrisi dan diare kronik.',
    diagnosis: ['Diare berlemak (steatorea), penurunan BB meski asupan cukup, kembung, tanda defisiensi vitamin; cari penyebab: penyakit seliak, insufisiensi pankreas, pertumbuhan bakteri berlebih, infeksi kronik, penyakit Crohn'],
    tatalaksana: ['Atasi penyebab dasar (diet bebas gluten pada seliak, enzim pankreas pada insufisiensi, antibiotik pada SIBO), suplementasi vitamin dan mineral yang defisien, dukungan nutrisi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Intoleransi makanan': {
    definisi: 'Reaksi merugikan terhadap makanan yang TIDAK diperantarai sistem imun, tersering intoleransi laktosa akibat defisiensi laktase.',
    diagnosis: ['Kembung, nyeri perut, diare, flatus setelah konsumsi makanan tertentu; tidak ada gejala alergi sistemik (urtikaria, anafilaksis); uji eliminasi dan provokasi, hydrogen breath test untuk laktosa'],
    tatalaksana: ['Batasi atau hindari makanan pemicu sesuai ambang toleransi individu (banyak pasien masih toleran jumlah kecil), suplementasi enzim laktase, pastikan asupan kalsium tetap adekuat bila membatasi susu'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Alergi makanan': {
    definisi: 'Reaksi merugikan terhadap makanan yang diperantarai sistem imun, umumnya IgE.',
    diagnosis: ['Gejala muncul cepat setelah konsumsi: urtikaria, angioedema, muntah, sesak, hingga anafilaksis; alergen tersering: susu sapi, telur, kacang, seafood; skin prick test/IgE spesifik, baku emas adalah oral food challenge'],
    tatalaksana: ['Hindari alergen secara ketat dan edukasi membaca label makanan, sediakan epinefrin autoinjector pada riwayat anafilaksis dan latih penggunaannya, antihistamin untuk reaksi ringan; rencana tindakan darurat tertulis'],
    referensi: ['SKDI2012', 'WAO2020', 'PPKFKTP2014'],
  },
  'Keracunan makanan': {
    definisi: 'Penyakit akibat konsumsi makanan terkontaminasi mikroorganisme atau toksinnya.',
    diagnosis: ['Mual, muntah, diare, nyeri perut dengan onset sesuai penyebab (toksin preformed seperti S. aureus dalam 1-6 jam; invasif seperti Salmonella dalam 12-72 jam); riwayat makanan bersama dan kasus serupa pada orang lain'],
    tatalaksana: ['Rehidrasi sebagai terapi utama, sebagian besar self-limiting; antibiotik hanya pada kasus tertentu (invasif berat, imunokompromais); laporkan bila kejadian luar biasa, edukasi higiene dan penyimpanan makanan'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SLEISENGER2021'],
  },
  'Botulisme': {
    definisi: 'Keracunan neurotoksin Clostridium botulinum yang menghambat pelepasan asetilkolin, menyebabkan kelumpuhan flaksid desenden.',
    diagnosis: ['Kelemahan desenden simetris dimulai dari saraf kranial (diplopia, ptosis, disartria, disfagia) menjalar ke bawah, TANPA gangguan sensorik dan kesadaran tetap jernih; riwayat makanan kaleng/fermentasi; botulisme bayi dari madu'],
    tatalaksana: ['Antitoksin botulinum segera (jangan tunda menunggu konfirmasi), dukungan ventilasi mekanik bila otot napas terkena, perawatan intensif; JANGAN beri madu pada bayi <1 tahun sebagai pencegahan'],
    referensi: ['SKDI2012', 'HARRISON2022', 'PPKFKTP2014'],
  },
  'Penyakit cacing tambang': {
    definisi: 'Infeksi Ancylostoma duodenale atau Necator americanus yang menempel pada mukosa usus halus dan mengisap darah.',
    diagnosis: ['Anemia defisiensi besi kronik, nyeri perut, dapat didahului ground itch di kaki dan gejala paru saat migrasi larva; telur cacing pada pemeriksaan tinja'],
    tatalaksana: ['Albendazol 400 mg dosis tunggal atau mebendazol, suplementasi besi untuk anemia, edukasi penggunaan alas kaki dan sanitasi, pemberian obat cacing massal pada daerah endemis'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Strongiloidiasis': {
    definisi: 'Infeksi Strongyloides stercoralis yang mampu bereplikasi dalam tubuh (autoinfeksi), berisiko hiperinfeksi fatal pada imunosupresi.',
    diagnosis: ['Sering asimtomatik atau gejala GI ringan, larva currens (ruam bermigrasi cepat), eosinofilia; larva (bukan telur) pada tinja; skrining WAJIB sebelum pemberian kortikosteroid pada pasien dari daerah endemis'],
    tatalaksana: ['Ivermektin sebagai obat pilihan, albendazol sebagai alternatif; pada hiperinfeksi: ivermektin berkepanjangan dan hentikan imunosupresan bila memungkinkan — mortalitas hiperinfeksi sangat tinggi'],
    referensi: ['SKDI2012', 'HARRISON2022', 'PPKFKTP2014'],
  },
  'Askariasis': {
    definisi: 'Infeksi cacing gelang Ascaris lumbricoides, infeksi helmintik tersering di dunia.',
    diagnosis: ['Sering asimtomatik; dapat menyebabkan gangguan gizi pada anak, nyeri perut, obstruksi usus atau bilier bila cacing banyak; sindrom Loeffler saat migrasi larva ke paru; telur pada pemeriksaan tinja'],
    tatalaksana: ['Albendazol 400 mg dosis tunggal atau mebendazol; obstruksi memerlukan tatalaksana bedah/endoskopik; edukasi sanitasi, cuci tangan, dan pemberian obat cacing berkala pada anak di daerah endemis'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022'],
  },
  'Skistosomiasis': {
    definisi: 'Infeksi cacing trematoda Schistosoma; di Indonesia endemis Schistosoma japonicum di Sulawesi Tengah.',
    diagnosis: ['Dermatitis serkaria saat kontak air, demam Katayama pada fase akut, fase kronik: hepatosplenomegali dan hipertensi portal (japonicum/mansoni) atau hematuria (haematobium); telur pada tinja atau urin'],
    tatalaksana: ['Prazikuantel sesuai spesies, tatalaksana komplikasi hipertensi portal, edukasi hindari kontak air terkontaminasi, program pengendalian keong perantara di daerah endemis'],
    referensi: ['SKDI2012', 'HARRISON2022', 'PPKFKTP2014'],
  },
  'Hepatitis B': {
    definisi: 'Infeksi virus hepatitis B yang dapat akut atau kronik, dengan risiko sirosis dan karsinoma hepatoselular.',
    diagnosis: ['HBsAg positif menandakan infeksi; HBsAg menetap >6 bulan berarti kronik; HBeAg, DNA HBV, dan transaminase menentukan fase dan indikasi terapi; anti-HBs menandakan imunitas'],
    tatalaksana: ['Akut: umumnya suportif; Kronik: antivirus (tenofovir/entecavir) sesuai kriteria DNA HBV, ALT, dan derajat fibrosis; surveilans karsinoma hepatoselular berkala; PENCEGAHAN: vaksinasi HB dan HBIg pada bayi dari ibu HBsAg positif dalam 12 jam pertama'],
    referensi: ['SKDI2012', 'WHOHEPB2024', 'SLEISENGER2021'],
  },
  'Hepatitis C': {
    definisi: 'Infeksi virus hepatitis C, sebagian besar menjadi kronik dan berisiko sirosis serta karsinoma hepatoselular.',
    diagnosis: ['Anti-HCV positif sebagai skrining, konfirmasi dengan RNA HCV; sering asimtomatik hingga stadium lanjut; nilai derajat fibrosis dan genotipe untuk perencanaan terapi'],
    tatalaksana: ['Direct-acting antiviral (DAA) selama 8-12 minggu dengan angka kesembuhan >95% — semua pasien dengan infeksi kronik layak diterapi; surveilans karsinoma hepatoselular tetap dilanjutkan pada pasien sirosis meski sudah sembuh virologis'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'HARRISON2022'],
  },
  'Abses hepar amoeba': {
    definisi: 'Abses hati akibat Entamoeba histolytica yang menyebar dari kolon melalui vena porta.',
    diagnosis: ['Demam, nyeri kuadran kanan atas, hepatomegali nyeri tekan, riwayat diare berdarah (tidak selalu ada); USG menunjukkan lesi hipoekoik soliter (umumnya lobus kanan), serologi amoeba positif, aspirasi berisi cairan seperti pasta anchovy'],
    tatalaksana: ['Metronidazol sebagai terapi utama diikuti amebisida luminal (paromomisin) untuk eradikasi kista; aspirasi hanya bila abses besar, mengancam ruptur, atau gagal terapi medis'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Perlemakan hepar': {
    definisi: 'Akumulasi lemak di hepatosit; non-alcoholic fatty liver disease berkaitan erat dengan obesitas dan sindrom metabolik.',
    diagnosis: ['Umumnya asimtomatik, ditemukan dari transaminase meningkat atau USG (hati hiperekoik/bright liver); singkirkan penyebab lain (alkohol, hepatitis viral, obat); nilai fibrosis dengan skor non-invasif'],
    tatalaksana: ['Penurunan berat badan bertahap 7-10% adalah intervensi paling efektif, aktivitas fisik teratur, kontrol DM dan dislipidemia, hindari alkohol; belum ada farmakoterapi baku universal'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Sirosis hepatis': {
    definisi: 'Fibrosis hati difus dengan pembentukan nodul regeneratif yang mengubah arsitektur hati — tahap akhir penyakit hati kronik.',
    diagnosis: ['Stigmata penyakit hati kronik (spider naevi, eritema palmaris, ginekomastia, kaput medusa), asites, splenomegali; albumin rendah, INR memanjang, trombositopenia; klasifikasi Child-Pugh dan MELD untuk prognosis'],
    tatalaksana: ['Atasi etiologi (antivirus, hentikan alkohol), tatalaksana komplikasi: asites (restriksi garam, diuretik, parasentesis), ensefalopati (laktulosa, rifaksimin), varises (beta-blocker, ligasi), SBP (antibiotik); surveilans karsinoma hepatoselular; transplantasi hati pada kandidat sesuai'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Gagal hepar': {
    definisi: 'Hilangnya fungsi hati secara berat; gagal hati akut ditandai koagulopati dan ensefalopati pada pasien tanpa penyakit hati kronik sebelumnya.',
    diagnosis: ['Ikterik, ensefalopati hepatik, INR memanjang (≥1,5), hipoglikemia; cari penyebab: parasetamol (tersering di banyak negara), hepatitis viral, obat, iskemik, Wilson'],
    tatalaksana: ['N-asetilsistein pada intoksikasi parasetamol (dan bermanfaat pada gagal hati akut non-parasetamol), koreksi hipoglikemia dan elektrolit, cegah dan atasi edema serebri, hindari sedatif; rujuk pusat transplantasi hati sedini mungkin — kriteria King\'s College membantu penentuan indikasi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Kole(doko)litiasis': {
    definisi: 'Batu pada duktus koledokus, dapat berasal dari kandung empedu atau terbentuk primer di saluran empedu.',
    diagnosis: ['Nyeri kuadran kanan atas, ikterik obstruktif, urin gelap dan tinja pucat; bilirubin direk dan alkali fosfatase meningkat; USG menunjukkan duktus melebar, MRCP/EUS untuk konfirmasi; trias Charcot menandakan kolangitis'],
    tatalaksana: ['ERCP dengan sfingterotomi dan ekstraksi batu sebagai terapi utama, dilanjutkan kolesistektomi; kolangitis akut memerlukan antibiotik IV dan drainase bilier segera (kegawatdaruratan)'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Empiema dan hidrops kandung empedu': {
    definisi: 'Komplikasi obstruksi duktus sistikus; hidrops berupa distensi berisi mukus steril, empiema berupa kandung empedu berisi pus.',
    diagnosis: ['Nyeri kuadran kanan atas dengan massa teraba; empiema disertai demam tinggi dan tanda sepsis; USG menunjukkan kandung empedu sangat distensi dengan dinding menebal dan isi ekogenik pada empiema'],
    tatalaksana: ['Antibiotik IV, kolesistektomi (atau kolesistostomi perkutan pada pasien risiko tinggi operasi); empiema adalah kedaruratan bedah karena risiko perforasi dan sepsis'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Atresia biliaris': {
    definisi: 'Obliterasi progresif saluran empedu ekstrahepatik pada bayi, menyebabkan kolestasis dan sirosis bila tidak dikoreksi dini.',
    diagnosis: ['Ikterik menetap >2 minggu pada neonatus dengan bilirubin DIREK meningkat, tinja pucat/dempul, urin gelap, hepatomegali; USG dan skintigrafi hepatobilier, konfirmasi dengan kolangiografi intraoperatif'],
    tatalaksana: ['Prosedur Kasai (portoenterostomi) SEGERA — keberhasilan menurun tajam setelah usia 60-90 hari; transplantasi hati bila Kasai gagal; kunci: setiap ikterik neonatus >2 minggu wajib diperiksa bilirubin direk'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Pankreatitis': {
    definisi: 'Inflamasi pankreas akibat aktivasi enzim pankreas di dalam kelenjar; penyebab tersering batu empedu dan alkohol.',
    diagnosis: ['Dua dari tiga: nyeri epigastrium menembus ke punggung, amilase/lipase ≥3 kali batas atas normal, gambaran khas pada pencitraan; tanda Grey-Turner dan Cullen pada kasus berat; nilai keparahan dengan skor (mis. BISAP/Ranson)'],
    tatalaksana: ['Resusitasi cairan agresif dini adalah terapi utama, analgesia adekuat, nutrisi enteral dini bila dapat ditoleransi (bukan puasa berkepanjangan), atasi penyebab (ERCP bila kolangitis/obstruksi bilier, kolesistektomi setelah pulih); antibiotik TIDAK rutin tanpa bukti infeksi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Karsinoma pankreas': {
    definisi: 'Keganasan pankreas, tersering adenokarsinoma duktal di kaput pankreas, dengan prognosis buruk karena diagnosis umumnya terlambat.',
    diagnosis: ['Ikterik obstruktif tanpa nyeri disertai penurunan BB (tanda klasik tumor kaput), nyeri punggung, onset DM baru pada usia lanjut; tanda Courvoisier (kandung empedu teraba tanpa nyeri); CT pankreas protokol khusus, CA 19-9 sebagai penanda pemantauan'],
    tatalaksana: ['Reseksi (Whipple) hanya pada minoritas kasus yang masih resectable, kemoterapi adjuvan/paliatif, drainase bilier (stent) untuk ikterik, manajemen nyeri dan perawatan paliatif dini'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Divertikulosis/divertikulitis': {
    definisi: 'Divertikulosis adalah adanya kantong divertikel pada kolon; divertikulitis adalah inflamasi/infeksi divertikel tersebut.',
    diagnosis: ['Divertikulosis umumnya asimtomatik atau perdarahan tanpa nyeri; divertikulitis: nyeri kuadran KIRI bawah, demam, leukositosis; CT abdomen sebagai modalitas pilihan — hindari kolonoskopi pada fase akut (risiko perforasi)'],
    tatalaksana: ['Divertikulitis tanpa komplikasi: antibiotik selektif dan diet cair bertahap, banyak kasus ringan cukup suportif; dengan komplikasi (abses, perforasi): drainase atau bedah; jangka panjang: diet tinggi serat; kolonoskopi setelah fase akut mereda untuk menyingkirkan keganasan'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Kolitis': {
    definisi: 'Inflamasi kolon dari berbagai sebab: infeksi, iskemia, radiasi, obat, atau penyakit radang usus.',
    diagnosis: ['Diare (sering berdarah), nyeri perut, tenesmus, demam; kolitis pseudomembran akibat Clostridioides difficile pasca antibiotik; kolonoskopi dan biopsi menentukan pola dan penyebab'],
    tatalaksana: ['Sesuai etiologi: antibiotik untuk kolitis infeksi tertentu, vankomisin oral/fidaksomisin untuk C. difficile (hentikan antibiotik pencetus), tatalaksana IBD bila penyakit radang usus, suportif dan rehidrasi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Penyakit Crohn': {
    definisi: 'Penyakit radang usus kronik yang dapat mengenai seluruh saluran cerna dari mulut hingga anus, dengan lesi transmural dan skip lesions.',
    diagnosis: ['Diare kronik, nyeri perut, penurunan BB, lesi perianal (fistula, fisura); kolonoskopi menunjukkan skip lesions dan cobblestone appearance, biopsi dapat menunjukkan granuloma non-kaseosa; kalprotektin tinja meningkat'],
    tatalaksana: ['Induksi remisi (kortikosteroid), rumatan dengan imunomodulator (azatioprin/metotreksat) atau biologik (anti-TNF), berhenti merokok (memperburuk Crohn), dukungan nutrisi, bedah untuk komplikasi (striktur, fistula, abses) — bukan kuratif'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Kolitis ulseratif': {
    definisi: 'Penyakit radang usus kronik yang mengenai mukosa kolon secara kontinu mulai dari rektum ke proksimal.',
    diagnosis: ['Diare berdarah kronik dengan lendir, tenesmus, urgensi; kolonoskopi menunjukkan inflamasi kontinu dari rektum, biopsi menunjukkan abses kripta; waspada megakolon toksik pada eksaserbasi berat'],
    tatalaksana: ['Aminosalisilat (mesalazin) sebagai dasar terapi, kortikosteroid untuk eksaserbasi, imunomodulator/biologik pada kasus refrakter; kolektomi bersifat kuratif dan diindikasikan pada penyakit refrakter, megakolon toksik, atau displasia; surveilans kanker kolon berkala'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PAPDI2014'],
  },
  'Irritable Bowel Syndrome': {
    definisi: 'Gangguan fungsional saluran cerna dengan nyeri perut berulang terkait defekasi dan perubahan pola BAB, tanpa kelainan struktural.',
    diagnosis: ['Kriteria Rome IV: nyeri perut berulang ≥1 hari/minggu dalam 3 bulan terakhir, terkait defekasi dan/atau perubahan frekuensi atau bentuk tinja; WAJIB tidak ada alarm symptoms (penurunan BB, perdarahan, anemia, usia lanjut onset baru, riwayat keluarga kanker kolon)'],
    tatalaksana: ['Edukasi dan hubungan dokter-pasien yang baik, modifikasi diet (diet rendah FODMAP, serat larut), antispasmodik untuk nyeri, laksatif atau antidiare sesuai subtipe, antidepresan dosis rendah pada kasus refrakter, kelola stres'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Polip/adenoma': {
    definisi: 'Pertumbuhan jaringan menonjol ke lumen kolon; adenoma bersifat prakanker melalui sekuens adenoma-karsinoma.',
    diagnosis: ['Umumnya asimtomatik, ditemukan saat skrining atau kolonoskopi karena perdarahan samar; histopatologi menentukan jenis (adenomatosa vs hiperplastik) dan derajat displasia'],
    tatalaksana: ['Polipektomi endoskopik saat kolonoskopi, surveilans kolonoskopi berkala sesuai jumlah, ukuran, dan histologi polip; skrining kanker kolorektal populasi sesuai usia dan faktor risiko'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Karsinoma kolon': {
    definisi: 'Keganasan kolon, umumnya adenokarsinoma yang berkembang dari polip adenomatosa.',
    diagnosis: ['Perubahan pola BAB, perdarahan per anum atau anemia defisiensi besi tanpa sebab (terutama pada pria dan wanita pascamenopause — wajib evaluasi kolon), penurunan BB, obstruksi; kolonoskopi dengan biopsi, CEA sebagai pemantauan, CT untuk staging'],
    tatalaksana: ['Reseksi bedah dengan limfadenektomi sebagai terapi utama, kemoterapi adjuvan sesuai stadium, terapi target/paliatif pada metastatik; skrining populasi menurunkan mortalitas secara bermakna'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },
  'Penyakit Hirschsprung': {
    definisi: 'Aganglionosis kongenital segmen distal kolon sehingga terjadi obstruksi fungsional.',
    diagnosis: ['Gagal keluar mekonium dalam 48 jam pertama, distensi abdomen, muntah hijau; colok dubur menghasilkan semburan feses dan gas (explosive stool); barium enema menunjukkan zona transisi, biopsi rektum (tidak ada sel ganglion) sebagai baku emas'],
    tatalaksana: ['Dekompresi (wash out rektal) dan stabilisasi, lalu pull-through bedah untuk mengangkat segmen aganglionik; waspada enterokolitis Hirschsprung yang mengancam nyawa (demam, distensi, diare berbau busuk)'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Enterokolitis nekrotik': {
    definisi: 'Nekrosis iskemik dan inflamasi usus pada neonatus, terutama bayi prematur — kedaruratan bedah neonatal tersering.',
    diagnosis: ['Bayi prematur dengan intoleransi minum, distensi abdomen, residu lambung bilious, tinja berdarah, letargi; rontgen abdomen menunjukkan pneumatosis intestinalis (patognomonik), dapat disertai udara vena porta atau pneumoperitoneum'],
    tatalaksana: ['Puasa dan dekompresi NGT, nutrisi parenteral, antibiotik IV spektrum luas, resusitasi; bedah bila perforasi atau perburukan; pencegahan: ASI (protektif), pemberian minum bertahap pada prematur'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Intususepsi atau invaginasi': {
    definisi: 'Masuknya segmen usus ke dalam segmen distalnya, menyebabkan obstruksi dan iskemia; tersering pada bayi usia 3-12 bulan.',
    diagnosis: ['Trias klasik (sering tidak lengkap): nyeri perut kolik episodik dengan bayi menarik lutut ke perut, massa berbentuk sosis di abdomen, tinja lendir darah (red currant jelly); USG menunjukkan target/doughnut sign'],
    tatalaksana: ['Reduksi dengan enema udara atau kontras di bawah panduan pencitraan sebagai terapi pilihan (bila tanpa perforasi/peritonitis), reduksi bedah bila gagal atau ada kontraindikasi; resusitasi cairan sebelum tindakan'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Atresia anus': {
    definisi: 'Malformasi anorektal kongenital berupa tidak terbentuknya lubang anus normal, sering disertai fistula.',
    diagnosis: ['Tidak ditemukan lubang anus pada pemeriksaan neonatus rutin, tidak keluar mekonium, distensi abdomen; cari fistula (mekonium keluar dari vagina/uretra); klasifikasi letak tinggi atau rendah; cari anomali VACTERL'],
    tatalaksana: ['Puasa dan NGT, rujuk bedah anak; lesi rendah dapat dikoreksi primer (anoplasti), lesi tinggi memerlukan kolostomi terlebih dahulu diikuti PSARP dan penutupan kolostomi bertahap'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Proktitis': {
    definisi: 'Inflamasi mukosa rektum akibat infeksi (termasuk IMS), radiasi, atau penyakit radang usus.',
    diagnosis: ['Tenesmus, nyeri anorektal, keluarnya lendir atau darah per anum, urgensi defekasi; anoskopi/sigmoidoskopi; pada proktitis akibat IMS lakukan skrining gonore, klamidia, sifilis, dan HIV'],
    tatalaksana: ['Sesuai etiologi: antibiotik untuk proktitis infeksi (dan terapi pasangan seksual), mesalazin topikal untuk IBD, tatalaksana suportif untuk proktitis radiasi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'PPKFKTP2014'],
  },
  'Hemoroid grade 1-2': {
    definisi: 'Pelebaran pleksus hemoroidalis interna; grade 1 tidak prolaps, grade 2 prolaps saat mengejan namun kembali spontan.',
    diagnosis: ['Perdarahan merah segar menetes saat BAB tanpa nyeri, rasa mengganjal; anoskopi memastikan derajat; WAJIB menyingkirkan keganasan kolorektal pada perdarahan per anum, terutama usia >40 tahun'],
    tatalaksana: ['Diet tinggi serat dan cairan cukup, hindari mengejan lama dan duduk terlalu lama di toilet, rendam duduk hangat, laksatif pelunak tinja, obat venotonik dan topikal; ligasi karet gelang bila gagal konservatif'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SCHWARTZ2019'],
  },
  'Hemoroid grade 3-4': {
    definisi: 'Hemoroid interna dengan prolaps yang memerlukan reposisi manual (grade 3) atau tidak dapat direposisi (grade 4).',
    diagnosis: ['Prolaps menetap, perdarahan, nyeri bila trombosis atau strangulasi; pemeriksaan colok dubur dan anoskopi; nilai adanya trombosis akut'],
    tatalaksana: ['Rujuk bedah untuk hemoroidektomi atau stapled hemorrhoidopexy; sementara: analgesia, rendam duduk, pelunak tinja; hemoroid trombosis akut dalam 72 jam dapat dieksisi untuk redakan nyeri'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Fistula': {
    definisi: 'Fistula perianal — saluran abnormal antara kanalis analis dan kulit perianal, umumnya akibat abses perianal sebelumnya.',
    diagnosis: ['Sekret purulen berulang dari lubang di kulit perianal, riwayat abses yang pecah/didrainase; identifikasi muara interna dan eksterna (aturan Goodsall), MRI pelvis pada fistula kompleks; cari penyakit Crohn bila multipel/rekuren'],
    tatalaksana: ['Rujuk bedah: fistulotomi pada fistula simpel superfisial, seton atau teknik sphincter-sparing pada fistula kompleks untuk melindungi kontinensia; tatalaksana penyakit dasar bila Crohn'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Fisura anus': {
    definisi: 'Robekan linear pada anoderm distal linea dentata, umumnya di garis tengah posterior.',
    diagnosis: ['Nyeri hebat seperti teriris saat dan setelah BAB disertai darah segar sedikit; inspeksi hati-hati menunjukkan robekan, dapat disertai skin tag sentinel pada fisura kronik; fisura di lokasi atipikal (lateral) curigai Crohn, TB, HIV, atau keganasan'],
    tatalaksana: ['Pelunak tinja dan diet tinggi serat sebagai dasar, rendam duduk hangat, salep nifedipin/diltiazem atau gliseril trinitrat topikal untuk relaksasi sfingter; toksin botulinum atau sfingterotomi lateral internal pada kasus kronik refrakter'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'SCHWARTZ2019'],
  },
  'Prolaps rektum, anus': {
    definisi: 'Turunnya dinding rektum melalui anus, dapat parsial (mukosa saja) atau komplet (seluruh lapisan dinding).',
    diagnosis: ['Massa keluar dari anus saat mengejan; prolaps komplet menunjukkan lipatan mukosa konsentris (membedakan dari hemoroid prolaps yang radial); nilai kontinensia dan cari faktor predisposisi (konstipasi kronik, multiparitas, fibrosis kistik atau parasit pada anak)'],
    tatalaksana: ['Anak: umumnya konservatif — reposisi manual, atasi konstipasi dan penyebab dasar, sebagian besar membaik sendiri; Dewasa: perbaikan bedah (rektopeksi) sebagai terapi definitif, atasi konstipasi'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'PPKFKTP2014'],
  },
  'Limfoma': {
    definisi: 'Limfoma saluran cerna — keganasan limfoid yang mengenai traktus gastrointestinal, tersering di lambung (sering terkait H. pylori pada MALT limfoma).',
    diagnosis: ['Gejala tidak khas: nyeri perut, penurunan BB, perdarahan, obstruksi; endoskopi dengan biopsi dalam untuk histopatologi dan imunohistokimia, staging dengan CT/PET'],
    tatalaksana: ['MALT limfoma lambung stadium dini: eradikasi H. pylori saja sering menghasilkan regresi; limfoma agresif: kemoterapi (± rituximab), bedah untuk komplikasi — rujuk hematologi-onkologi'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'HARRISON2022'],
  },
  'Gastrointestinal Stromal Tumor (GIST)': {
    definisi: 'Tumor mesenkimal saluran cerna yang berasal dari sel interstisial Cajal, tersering di lambung, dengan mutasi KIT.',
    diagnosis: ['Sering asimtomatik/insidental; dapat menyebabkan perdarahan, massa, atau nyeri; endoskopi menunjukkan lesi submukosa, CT untuk staging; imunohistokimia CD117 (KIT) positif menjadi penanda diagnostik'],
    tatalaksana: ['Reseksi bedah komplet pada penyakit terlokalisasi (hindari biopsi rutin pra-operasi bila resectable karena risiko ruptur), imatinib (TKI) sebagai adjuvan pada risiko tinggi dan terapi utama pada penyakit lanjut/metastatik'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'SCHWARTZ2019'],
  },

  // ─── Integumen ───────────────────────────────────────────────────────────
  'Veruka vulgaris': {
    definisi: 'Kutil akibat infeksi human papillomavirus pada epidermis.',
    diagnosis: ['Papul/nodul kasar berwarna kulit dengan permukaan verukosa, dapat tampak titik hitam (kapiler trombosis) saat permukaan dikikis; predileksi tangan dan jari'],
    tatalaksana: ['Banyak regresi spontan; asam salisilat topikal, krioterapi, atau elektrokauter/bedah untuk lesi persisten; edukasi tidak menggaruk (autoinokulasi)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Kondiloma akuminatum': {
    definisi: 'Kutil kelamin akibat HPV (tersering tipe 6 dan 11), tergolong infeksi menular seksual.',
    diagnosis: ['Papul/vegetasi seperti jengger ayam di area anogenital; tes asam asetat 5% menghasilkan acetowhitening; skrining IMS lain termasuk HIV dan sifilis, serta pemeriksaan pasangan'],
    tatalaksana: ['Kemodestruksi (podofilotoksin, asam trikloroasetat), krioterapi, elektrokauter, atau eksisi sesuai luas lesi; imunomodulator topikal (imiquimod); pencegahan dengan vaksin HPV dan kondom'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Moluskum kontagiosum': {
    definisi: 'Infeksi kulit oleh poxvirus yang menimbulkan papul berumbilikasi, umum pada anak dan pasien imunokompromais.',
    diagnosis: ['Papul kecil berkilat warna kulit dengan lekukan di tengah (umbilikasi), isi massa putih bila ditekan; pada dewasa dengan lesi genital pertimbangkan penularan seksual'],
    tatalaksana: ['Sering sembuh spontan pada anak imunokompeten; ekstraksi massa (enukleasi), krioterapi, atau kauterisasi bila luas/mengganggu; hindari berbagi handuk dan menggaruk'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Herpes zoster tanpa komplikasi': {
    definisi: 'Reaktivasi virus varisela-zoster laten pada ganglion sensorik, menimbulkan erupsi vesikuler sesuai dermatom.',
    diagnosis: ['Nyeri/parestesia mendahului erupsi, vesikel berkelompok UNILATERAL sesuai dermatom yang tidak melewati garis tengah; waspada zoster oftalmikus (tanda Hutchinson pada ujung hidung)'],
    tatalaksana: ['Antivirus (asiklovir/valasiklovir) idealnya dalam 72 jam onset untuk kurangi durasi dan risiko neuralgia pascaherpetik, analgesia adekuat termasuk obat nyeri neuropatik, perawatan lesi; rujuk oftalmologi bila zoster oftalmikus'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Morbili tanpa komplikasi': {
    definisi: 'Campak — infeksi akut oleh virus measles yang SANGAT MENULAR dengan angka reproduksi dasar 12-18, artinya satu penderita dapat menulari belasan orang rentan; masih menjadi penyebab kematian anak yang dapat dicegah dengan vaksin, dan wabah berulang muncul setiap kali cakupan imunisasi turun di bawah ambang kekebalan kelompok sekitar 95%.',
    anamnesis: {
      keluhanUtama: 'Demam tinggi selama beberapa hari yang kemudian diikuti timbulnya ruam merah mulai dari belakang telinga.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: RUAM dimulai dari belakang telinga dan batas rambut, lalu menyebar ke wajah, leher, badan, dan terakhir ke ekstremitas — pola SEFALOKAUDAL ini merupakan ciri khas. Onset: demam mendahului ruam selama 3-4 hari, dan yang sangat khas adalah DEMAM TIDAK TURUN bahkan MEMUNCAK justru saat ruam pertama kali muncul; demam yang menetap lebih dari 3 hari SETELAH ruam timbul menandakan adanya komplikasi. Character: ruam makulopapular eritematosa yang dapat berkonfluens membentuk bercak besar, tidak gatal atau hanya gatal ringan. Radiation: penyebaran ruam sefalokaudal dalam 3 hari. Associations: trias 3C yaitu COUGH (batuk), CORYZA (pilek), dan CONJUNCTIVITIS (mata merah berair dan silau) yang mendahului ruam, serta bercak Koplik di mukosa pipi yang muncul 1-2 hari sebelum ruam dan menghilang cepat sehingga sering terlewat; tanyakan pula nafsu makan, diare, dan sesak. Time course: ruam bertahan 5-6 hari lalu memudar dengan urutan yang sama dan meninggalkan bekas kecokelatan yang mengelupas halus (deskuamasi furfurasea). Exacerbating: kondisi gizi buruk dan defisiensi vitamin A memperberat perjalanan penyakit. Severity: nilai apakah anak masih mau minum, tampak sesak, atau letargi.',
      riwayatPenyakitDahulu: 'Riwayat campak sebelumnya (infeksi alami memberi kekebalan seumur hidup), gizi buruk, tuberkulosis, HIV, defisiensi imun, dan penyakit kronik lain yang memperberat perjalanan penyakit.',
      riwayatPenyakitKeluarga: 'Adakah anggota keluarga atau teman sekolah dengan keluhan serupa dalam 2-3 minggu terakhir, serta status imunisasi saudara kandung.',
      riwayatPengobatan: 'Obat yang sudah diberikan termasuk antipiretik dan antibiotik; tanyakan pula apakah anak menerima kortikosteroid atau imunosupresan yang memperburuk perjalanan campak.',
      riwayatAlergi: 'Riwayat alergi obat, serta riwayat reaksi anafilaksis terhadap vaksin sebelumnya atau alergi berat terhadap neomisin dan gelatin yang relevan untuk vaksinasi berikutnya.',
      riwayatTumbuhKembang: 'Riwayat pertumbuhan pada KMS dan status gizi sebelum sakit, karena campak pada anak gizi buruk berisiko jauh lebih fatal.',
      riwayatNutrisi: 'Status gizi, asupan sebelum dan selama sakit, riwayat pemberian kapsul VITAMIN A, dan riwayat ASI eksklusif.',
      riwayatImunisasi:
        'Ini merupakan pertanyaan KUNCI. Apakah sudah menerima vaksin campak atau MR pada usia 9 bulan, dosis lanjutan pada usia 18 bulan, dan dosis pada anak kelas 1 SD melalui program BIAS; periksa langsung catatan pada buku KIA, bukan hanya mengandalkan ingatan orang tua. Bila belum diimunisasi, gali ALASANNYA — apakah karena akses, keraguan terhadap vaksin, atau kontraindikasi medis.',
      riwayatSosialEkonomi:
        'Kepadatan hunian, jumlah anak dalam rumah, riwayat kontak dengan penderita di sekolah, tempat penitipan anak, atau pengungsian; cakupan imunisasi di lingkungan tempat tinggal; serta status sosial ekonomi dan akses ke fasilitas kesehatan.',
    },
    pemeriksaanFisik: [
      'Keadaan umum dan tanda bahaya: letargi, tidak mau minum, kejang, sesak napas, dan tanda dehidrasi',
      'Suhu tubuh — demam tinggi umumnya 38,5°C atau lebih dan memuncak saat ruam muncul',
      'BERCAK KOPLIK: bintik putih keabuan sebesar butiran pasir dengan dasar kemerahan pada mukosa bukal berhadapan dengan geraham — PATOGNOMONIK untuk campak, muncul 1-2 hari sebelum ruam dan hilang dalam 1-2 hari sehingga harus dicari secara aktif dengan penerangan yang baik',
      'RUAM makulopapular eritematosa dengan penyebaran SEFALOKAUDAL: dimulai di belakang telinga dan batas rambut, lalu wajah, badan, dan ekstremitas; dapat berkonfluens terutama di wajah dan badan',
      'Konjungtivitis bilateral dengan mata merah dan berair disertai fotofobia',
      'Faring hiperemis, batuk, dan rinore',
      'PERIKSA MATA dengan teliti untuk tanda defisiensi vitamin A: bercak Bitot, xerosis konjungtiva dan kornea, hingga keratomalasia — campak sangat cepat menghabiskan cadangan vitamin A dan dapat menyebabkan KEBUTAAN',
      'Auskultasi paru untuk ronki dan napas cepat yang menandakan pneumonia sebagai komplikasi tersering',
      'Periksa telinga untuk otitis media, mulut untuk stomatitis dan kandidiasis, serta status hidrasi bila disertai diare',
      'Nilai status gizi karena campak dan gizi buruk saling memperberat',
    ],
    antropometri:
      'Timbang berat badan dan ukur tinggi atau panjang badan, lalu plot pada kurva WHO. Berat badan menurut tinggi badan kurang dari -3 standar deviasi atau lingkar lengan atas kurang dari 11,5 cm menandakan gizi buruk, yang pada campak SANGAT BERMAKNA karena meningkatkan risiko komplikasi berat dan kematian secara nyata. Sebaliknya campak sendiri memperburuk status gizi melalui demam tinggi berkepanjangan, stomatitis yang menyulitkan makan, diare, serta peningkatan kebutuhan metabolik — sehingga sering terjadi penurunan berat badan bermakna selama dan setelah sakit. Karena itu pemantauan berat badan pascasakit dan pemberian makanan tambahan untuk mengejar pertumbuhan merupakan bagian dari tatalaksana, bukan sekadar pelengkap.',
    penunjang: [
      'Diagnosis umumnya KLINIS pada kasus khas dengan trias 3C, bercak Koplik, dan ruam sefalokaudal — pengobatan tidak perlu menunggu hasil laboratorium',
      'SEROLOGI IgM anti-measles merupakan konfirmasi laboratorium yang dianjurkan untuk kepentingan SURVEILANS; diambil pada hari ke-4 hingga ke-28 setelah ruam muncul karena IgM dapat belum terdeteksi bila diambil terlalu dini',
      'Setiap kasus suspek campak WAJIB DILAPORKAN dan diambil spesimen sesuai pedoman surveilans nasional, meskipun diagnosis klinis sudah jelas',
      'Darah lengkap dapat menunjukkan leukopenia dengan limfopenia yang khas pada infeksi virus',
      'Foto toraks bila dicurigai pneumonia; pemeriksaan lain sesuai komplikasi yang muncul',
      'Pemeriksaan cairan serebrospinal bila dicurigai ensefalitis',
    ],
    etiologi: 'Virus measles, suatu RNA virus dari genus Morbillivirus famili Paramyxoviridae, dengan manusia sebagai satu-satunya reservoir alami — sifat inilah yang secara teoretis memungkinkan campak dieradikasi melalui vaksinasi.',
    patofisiologi:
      'Virus masuk melalui droplet dan aerosol ke saluran napas atau konjungtiva, lalu bereplikasi di epitel saluran napas dan jaringan limfoid regional sebelum menyebar melalui viremia primer ke sistem retikuloendotelial. Viremia sekunder menyebarkan virus ke kulit, konjungtiva, saluran napas, dan saluran cerna. Ruam serta bercak Koplik BUKAN akibat kerusakan langsung oleh virus melainkan hasil REAKSI IMUN SELULER terhadap sel terinfeksi pada endotel pembuluh darah kecil — inilah sebabnya ruam muncul justru bersamaan dengan mulai terbentuknya antibodi, dan mengapa pada anak dengan defisiensi imun berat ruam dapat TIDAK MUNCUL sama sekali meski penyakitnya justru lebih berat dan berkepanjangan. Virus measles memiliki sifat yang khas dan berbahaya yaitu menyebabkan penekanan imun (immune amnesia): virus menginfeksi dan menghancurkan sel memori limfosit sehingga tubuh KEHILANGAN sebagian memori imunologis terhadap patogen yang sebelumnya sudah dikenal, dan keadaan ini bertahan hingga dua sampai tiga tahun setelah sembuh. Hal inilah yang menjelaskan mengapa anak pascacampak jauh lebih rentan terhadap pneumonia, diare, dan infeksi lain dalam jangka panjang, serta mengapa angka kematian akibat campak sebagian besar sesungguhnya disebabkan infeksi sekunder, bukan oleh virusnya secara langsung. Penularan berlangsung melalui udara dan virus dapat bertahan di udara ruangan hingga dua jam setelah penderita meninggalkan tempat tersebut; masa penularan berlangsung sejak 4 hari sebelum hingga 4 hari setelah ruam muncul, sehingga penularan sudah terjadi sebelum diagnosis dapat ditegakkan.',
    faktorRisiko: [
      'BELUM ATAU TIDAK LENGKAP IMUNISASI campak/MR — faktor risiko terpenting dan sepenuhnya dapat dicegah',
      'Usia bayi 6-11 bulan setelah antibodi maternal menurun namun sebelum jadwal imunisasi',
      'Gizi buruk dan defisiensi vitamin A',
      'Imunodefisiensi termasuk HIV, keganasan, dan terapi imunosupresan',
      'Kepadatan hunian, pengungsian, dan lingkungan dengan cakupan imunisasi rendah',
      'Kehamilan (risiko abortus, persalinan preterm, dan campak berat pada ibu)',
      'Perjalanan ke daerah wabah',
    ],
    goldStandard:
      'Konfirmasi laboratorium dengan SEROLOGI IgM ANTI-MEASLES yang diambil pada hari ke-4 sampai ke-28 setelah timbulnya ruam, atau deteksi RNA virus dengan RT-PCR dari swab tenggorok, nasofaring, atau urin. Dalam praktik sehari-hari, definisi kasus klinis campak menurut WHO adalah demam disertai ruam makulopapular generalisata dengan salah satu dari batuk, pilek, atau konjungtivitis — dan berdasarkan definisi ini tatalaksana serta pelaporan sudah harus dijalankan tanpa menunggu konfirmasi laboratorium.',
    diagnosisBanding: [
      'Rubela (campak Jerman) — demam ringan, ruam lebih halus dan cepat hilang dalam 3 hari, disertai LIMFADENOPATI RETROAURIKULER dan SUBOKSIPITAL yang khas, tanpa bercak Koplik dan tanpa trias 3C yang menonjol',
      'Demam dengue — ruam muncul saat demam mulai turun, disertai nyeri kepala retro-orbital, mialgia, uji tourniquet positif, dan trombositopenia; tidak ada batuk pilek yang mencolok',
      'Roseola infantum (eksantema subitum) — pada bayi, demam tinggi 3-5 hari yang TURUN LEBIH DAHULU baru kemudian muncul ruam saat anak sudah tampak sehat (kebalikan dari campak)',
      'Demam skarlatina — ruam kasar seperti amplas, lidah stroberi, faringitis eksudatif streptokokus, dengan garis Pastia pada lipatan',
      'Erupsi obat — riwayat obat baru, ruam sering gatal, tanpa trias 3C dan tanpa bercak Koplik',
      'Penyakit Kawasaki — demam 5 hari atau lebih dengan konjungtivitis non-eksudatif, bibir pecah dan lidah stroberi, ruam polimorfik, edema tangan dan kaki, serta limfadenopati servikal; penting dikenali karena berisiko aneurisma koroner',
      'Sindrom Stevens-Johnson pada fase awal — nyeri kulit menonjol dengan keterlibatan mukosa multipel dan tanda Nikolsky positif',
    ],
    pengkajian:
      'Dipikirkan morbili tanpa komplikasi pada anak ini atas dasar demam tinggi yang telah berlangsung tiga hingga empat hari disertai trias batuk, pilek, dan konjungtivitis, yang kemudian diikuti munculnya ruam makulopapular dengan penyebaran khas sefalokaudal dimulai dari belakang telinga, pada anak dengan riwayat imunisasi campak yang belum lengkap dan adanya kontak dengan penderita serupa. Temuan bercak Koplik pada mukosa bukal bersifat patognomonik sehingga bila berhasil ditemukan diagnosis menjadi sangat pasti, meskipun ketidakhadirannya tidak menyingkirkan diagnosis karena bercak ini hanya bertahan satu hingga dua hari. Ciri yang sangat membantu membedakan campak dari sebagian besar penyakit eksantematosa lain adalah bahwa DEMAM TIDAK TURUN saat ruam muncul melainkan justru memuncak — pola ini berkebalikan dengan roseola infantum, di mana demam tinggi justru mereda lebih dahulu dan ruam baru timbul ketika anak sudah tampak sehat. Rubela menjadi diagnosis banding utama karena sama-sama menimbulkan ruam makulopapular, namun pada rubela demam jauh lebih ringan, ruam lebih halus dan menghilang dalam tiga hari, tidak dijumpai bercak Koplik maupun trias 3C yang menonjol, serta ditemukan limfadenopati retroaurikuler dan suboksipital yang khas. Demam dengue dipertimbangkan mengingat endemisitasnya, namun pada dengue ruam justru muncul ketika demam mulai turun dan disertai nyeri kepala retro-orbital, mialgia hebat, uji tourniquet positif, serta trombositopenia, sementara batuk dan pilek tidak menonjol. Demam skarlatina dibedakan melalui ruam berbutir kasar seperti amplas dengan lidah stroberi dan faringitis eksudatif. Penyakit Kawasaki wajib dipertimbangkan bila demam menetap lima hari atau lebih dengan konjungtivitis non-eksudatif, bibir pecah, dan edema tangan serta kaki, karena keterlambatan mengenalinya berisiko aneurisma arteri koroner. Yang perlu ditegaskan pada kasus ini adalah bahwa penetapan sebagai campak TANPA komplikasi mensyaratkan tidak adanya napas cepat, ronki, diare dengan dehidrasi, nyeri telinga, kekeruhan kornea, maupun penurunan kesadaran — dan penilaian ini harus DIULANG pada evaluasi berikutnya, sebab demam yang menetap lebih dari tiga hari setelah ruam timbul merupakan petunjuk kuat telah terjadi komplikasi.',
    terapiSuportif: [
      'Pertahankan hidrasi: berikan cairan sedikit-sedikit namun sering; oralit bila disertai diare, dan cairan intravena bila tidak dapat minum atau terjadi dehidrasi berat',
      'Antipiretik parasetamol 10-15 mg/kgBB per kali setiap 4-6 jam untuk kenyamanan; JANGAN memberikan aspirin pada anak karena risiko sindrom Reye',
      'Pertahankan asupan kalori — berikan makanan lunak porsi kecil namun sering; teruskan ASI pada bayi; tambahkan satu kali makan ekstra per hari selama dua minggu setelah sembuh untuk mengejar pertumbuhan',
      'Perawatan mata: bersihkan sekret dengan kapas dan air matang, hindari cahaya menyilaukan; JANGAN memberikan obat tetes mata yang mengandung kortikosteroid',
      'Perawatan mulut: bersihkan mulut secara lembut dan berikan makanan yang tidak mengiritasi bila terdapat stomatitis',
      'Jaga kebersihan kulit dengan mandi seperti biasa — TIDAK ADA larangan mandi pada campak sebagaimana keyakinan yang beredar di masyarakat',
      'Istirahat cukup di ruangan dengan pencahayaan yang tidak menyilaukan',
    ],
    tatalaksana: [
      'VITAMIN A DOSIS TINGGI diberikan pada SEMUA anak dengan campak tanpa memandang status gizi, sebanyak dua dosis pada hari pertama dan hari kedua berturut-turut — terbukti menurunkan angka kematian dan komplikasi secara bermakna',
      'Dosis vitamin A: 50.000 IU untuk bayi kurang dari 6 bulan, 100.000 IU untuk usia 6-11 bulan, dan 200.000 IU untuk usia 12 bulan ke atas',
      'Berikan DOSIS KETIGA vitamin A pada minggu ke-2 hingga ke-4 bila ditemukan tanda defisiensi vitamin A pada mata atau anak menderita gizi buruk',
      'Tidak ada antivirus spesifik — tatalaksana bersifat suportif',
      'ANTIBIOTIK TIDAK diberikan secara rutin pada campak tanpa komplikasi; berikan hanya bila terbukti ada infeksi bakteri sekunder seperti pneumonia, otitis media, atau infeksi kulit',
      'Anak dengan gizi buruk, imunodefisiensi, atau tanda komplikasi memerlukan RAWAT INAP dan pemberian antibiotik dengan ambang yang lebih rendah',
      'ISOLASI penderita hingga 4 hari setelah ruam muncul (pada imunokompromais lebih lama); rawat di ruang terpisah dengan kewaspadaan AIRBORNE bila dirawat inap, karena virus dapat bertahan di udara hingga dua jam',
      'WAJIB LAPOR sebagai penyakit yang dapat dicegah dengan imunisasi dan berpotensi kejadian luar biasa; ambil spesimen serologi sesuai pedoman surveilans',
      'PENANGANAN KONTAK: berikan vaksin campak dalam 72 jam setelah paparan pada kontak rentan sebagai profilaksis pascapajanan, atau imunoglobulin dalam 6 hari pada bayi kurang dari 6 bulan, ibu hamil, dan pasien imunokompromais yang tidak dapat menerima vaksin hidup',
      'Lakukan penyelidikan epidemiologi dan pertimbangkan imunisasi tambahan (outbreak response immunization) di lingkungan sekitar',
    ],
    edukasi: [
      'Jelaskan perjalanan penyakit: demam berlangsung sekitar 4-7 hari dan ruam memudar dalam 5-6 hari meninggalkan bekas kecokelatan yang mengelupas halus dan akan hilang sendiri — bekas ini normal dan tidak memerlukan pengobatan khusus',
      'LURUSKAN MITOS: pada campak anak TETAP BOLEH DIMANDIKAN dan tidak ada pantangan makanan. Justru larangan mandi dan pantangan makan yang beredar di masyarakat memperburuk kebersihan serta status gizi anak, dan meningkatkan risiko infeksi sekunder',
      'Penjadwalan dan porsi makan: berikan makanan lunak dengan porsi KECIL namun SERING sebanyak 5-6 kali sehari karena mulut anak nyeri dan nafsu makan menurun; utamakan makanan tinggi kalori dan protein, teruskan ASI pada bayi. Setelah sembuh, tambahkan SATU KALI MAKAN EKSTRA setiap hari selama dua minggu untuk mengejar berat badan yang turun',
      'Cairan diperbanyak; hindari makanan yang terlalu panas, asam, atau pedas selama terdapat sariawan',
      'Jam tidur: istirahatkan anak sebanyak yang dibutuhkan di ruangan dengan cahaya redup karena anak silau; tidur cukup membantu pemulihan',
      'Aktivitas dan olahraga: batasi aktivitas selama fase demam, lalu tingkatkan bertahap sesuai tenaga anak setelah demam turun; anak boleh kembali bersekolah setelah 4 hari sejak ruam muncul dan kondisi membaik',
      'ISOLASI di rumah: jauhkan anak dari bayi yang belum diimunisasi, ibu hamil, dan orang dengan daya tahan tubuh rendah; tunda kunjungan ke tempat ramai',
      'TANDA BAHAYA yang mengharuskan SEGERA kembali: napas cepat atau sesak, tidak mau minum, muntah terus, diare dengan tanda dehidrasi, demam yang MENETAP atau MUNCUL KEMBALI setelah ruam mulai memudar, nyeri telinga atau keluar cairan dari telinga, mata menjadi keruh atau anak tidak dapat melihat, kejang, dan penurunan kesadaran',
      'Kontrol dalam 2 hari untuk menilai perkembangan, atau lebih cepat bila muncul tanda bahaya',
      'PENCEGAHAN merupakan pesan terpenting: pastikan imunisasi campak/MR lengkap sesuai jadwal pada usia 9 bulan, 18 bulan, dan kelas 1 SD; lengkapi imunisasi saudara kandung dan anak lain di lingkungan sekitar, karena campak hanya dapat dikendalikan bila cakupan imunisasi mencapai sekitar 95%',
      'Jelaskan bahwa setelah sembuh dari campak anak menjadi lebih rentan terhadap infeksi lain selama beberapa waktu, sehingga gizi dan kebersihan perlu lebih diperhatikan pada periode ini',
    ],
    komplikasi: [
      'PNEUMONIA — komplikasi tersering dan penyebab kematian utama pada campak, dapat akibat virus itu sendiri maupun infeksi bakteri sekunder',
      'Diare dan dehidrasi, serta memburuknya status gizi hingga gizi buruk',
      'Otitis media akut',
      'Stomatitis dan kandidiasis mulut yang menyulitkan asupan',
      'Komplikasi mata akibat defisiensi vitamin A: xeroftalmia, ulkus kornea, keratomalasia, hingga KEBUTAAN PERMANEN',
      'Ensefalitis akut yang terjadi pada sekitar satu dari seribu kasus dengan risiko gejala sisa neurologis menetap',
      'Subacute sclerosing panencephalitis — komplikasi degeneratif fatal yang muncul bertahun-tahun setelah infeksi, lebih berisiko bila terinfeksi pada usia kurang dari dua tahun',
      'Pada kehamilan: abortus, persalinan preterm, dan berat lahir rendah',
      'Penekanan imun berkepanjangan hingga 2-3 tahun yang meningkatkan kerentanan terhadap infeksi lain',
    ],
    prognosis:
      'Baik pada anak dengan gizi cukup dan tanpa komplikasi — penyakit bersifat swasirna dan memberi kekebalan seumur hidup. Namun prognosis memburuk secara tajam pada anak gizi buruk, defisiensi vitamin A, imunokompromais, dan usia kurang dari lima tahun, dengan kematian sebagian besar disebabkan pneumonia dan diare. Pemberian vitamin A dosis tinggi merupakan intervensi sederhana namun sangat berdampak dalam menurunkan mortalitas. Yang perlu digarisbawahi adalah bahwa campak sepenuhnya DAPAT DICEGAH dengan vaksin yang aman, murah, dan tersedia gratis dalam program nasional — sehingga setiap kasus campak yang ditemukan pada dasarnya menandakan adanya kesenjangan cakupan imunisasi di masyarakat, dan wabah akan berulang selama cakupan belum mencapai sekitar 95%.',
    referensi: ['SKDI2012', 'PPKFKTP2014', 'HARRISON2022', 'FITZPATRICK2019'],
  },
  'Varisela tanpa komplikasi': {
    definisi: 'Cacar air — infeksi primer virus varisela-zoster dengan erupsi vesikuler generalisata.',
    diagnosis: ['Demam ringan diikuti lesi polimorfik (makula, papul, vesikel, krusta bersamaan dalam satu waktu — dewdrop on rose petal), penyebaran sentrifugal dimulai dari badan; sangat menular hingga semua lesi berkrusta'],
    tatalaksana: ['Anak imunokompeten umumnya suportif: antipiretik (HINDARI aspirin — risiko sindrom Reye), antihistamin untuk gatal, jaga kebersihan kulit dan potong kuku; asiklovir pada remaja/dewasa, imunokompromais, atau kasus berat; isolasi dan vaksinasi sebagai pencegahan'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'FITZPATRICK2019'],
  },
  'Herpes simpleks tanpa komplikasi': {
    definisi: 'Infeksi virus herpes simpleks tipe 1 (umumnya orolabial) atau tipe 2 (umumnya genital) dengan kecenderungan rekuren.',
    diagnosis: ['Vesikel berkelompok di atas dasar eritematosa yang mudah pecah menjadi erosi, didahului gejala prodromal (gatal/terbakar); rekurensi di lokasi yang sama; Tzanck smear menunjukkan multinucleated giant cells'],
    tatalaksana: ['Asiklovir/valasiklovir oral sedini mungkin pada episode, terapi supresif jangka panjang bila rekurensi sering (≥6x/tahun), analgesia dan perawatan lesi; edukasi penularan — hindari kontak saat lesi aktif'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Impetigo': {
    definisi: 'Infeksi bakteri superfisial epidermis oleh Staphylococcus aureus dan/atau Streptococcus pyogenes.',
    diagnosis: ['Impetigo krustosa: krusta kuning keemasan seperti madu (honey-colored crust) terutama sekitar hidung dan mulut; impetigo bulosa: bula kendur yang mudah pecah; sangat menular pada anak'],
    tatalaksana: ['Kompres untuk mengangkat krusta, antibiotik topikal (mupirosin) pada lesi terbatas, antibiotik oral antistafilokokus bila luas/multipel; edukasi higiene, potong kuku, hindari berbagi handuk; waspada komplikasi glomerulonefritis pascastreptokokus'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Impetigo ulseratif (ektima)': {
    definisi: 'Infeksi piogenik yang menembus hingga dermis sehingga meninggalkan ulkus dan jaringan parut.',
    diagnosis: ['Ulkus dangkal dengan krusta tebal melekat dan tepi meninggi, tersering di tungkai bawah; faktor risiko higiene buruk, gizi kurang, gigitan serangga terinfeksi'],
    tatalaksana: ['Antibiotik sistemik (bukan hanya topikal karena lesi lebih dalam), pembersihan luka dan pengangkatan krusta, perbaiki higiene dan status gizi'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Folikulitis superfisialis': {
    definisi: 'Infeksi bakteri terbatas pada muara folikel rambut.',
    diagnosis: ['Papul atau pustul kecil dengan rambut di tengahnya, eritema sekitar, tidak nyeri berat; folikulitis akibat Pseudomonas terkait berendam di air terkontaminasi'],
    tatalaksana: ['Kompres hangat, antiseptik atau antibiotik topikal, hindari mencukur pada area terkena; antibiotik oral hanya bila luas atau rekuren'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Furunkel, karbunkel': {
    definisi: 'Infeksi folikel rambut yang meluas ke jaringan subkutan; furunkel mengenai satu folikel, karbunkel merupakan gabungan beberapa furunkel.',
    diagnosis: ['Nodul eritematosa nyeri yang berkembang menjadi fluktuatif dengan pustul di puncaknya; karbunkel lebih besar dengan beberapa muara drainase dan sering disertai demam'],
    tatalaksana: ['Kompres hangat pada lesi dini, INSISI DAN DRAINASE bila sudah fluktuatif (terapi utama), antibiotik sistemik bila selulitis luas, demam, lokasi wajah (segitiga bahaya), atau imunokompromais'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Erisipelas': {
    definisi: 'Infeksi kulit superfisial dengan keterlibatan limfatik, umumnya oleh Streptococcus grup A.',
    diagnosis: ['Plak eritematosa merah terang, hangat, nyeri, dengan BATAS TEGAS DAN MENINGGI (membedakan dari selulitis yang batasnya kabur), sering disertai demam menggigil dan limfadenopati; tersering di tungkai dan wajah'],
    tatalaksana: ['Antibiotik yang mencakup Streptococcus (penisilin/amoksisilin) 7-14 hari, elevasi ekstremitas, analgesia, cari dan atasi pintu masuk kuman (tinea pedis, luka); antibiotik IV bila berat atau tidak respons'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Skrofuloderma': {
    definisi: 'Tuberkulosis kulit akibat penjalaran langsung dari kelenjar getah bening atau tulang yang terinfeksi ke kulit di atasnya.',
    diagnosis: ['Nodul subkutan yang melunak dan pecah membentuk ulkus dengan tepi bergaung (undermined) dan jembatan kulit (skin bridge), sekret seropurulen, tersering di leher; cari TB di tempat lain'],
    tatalaksana: ['OAT sesuai pedoman nasional (regimen TB ekstraparu), perawatan luka, dukungan nutrisi, pemeriksaan kontak serumah'],
    referensi: ['SKDI2012', 'PNPKTB2020', 'PERDOSKI2021'],
  },
  'Lepra': {
    definisi: 'Kusta atau morbus Hansen — penyakit infeksi kronik akibat Mycobacterium leprae yang terutama menyerang saraf tepi dan kulit; Indonesia masih menempati peringkat ketiga dunia dalam jumlah kasus baru, dan disabilitas yang ditimbulkannya bersifat permanen namun sepenuhnya dapat dicegah bila diagnosis ditegakkan dini.',
    anamnesis: {
      keluhanUtama: 'Bercak putih atau kemerahan di kulit yang TIDAK GATAL dan MATI RASA sejak beberapa bulan.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: lokasi bercak — pada tipe pausibasilar umumnya sedikit, asimetris, dan berbatas tegas; pada multibasilar banyak, simetris, berbatas kurang tegas, dengan predileksi pada wajah, telinga, dan permukaan tubuh yang lebih dingin. Onset: SANGAT PERLAHAN dalam hitungan bulan hingga tahun karena masa inkubasi 2-5 tahun bahkan dapat mencapai 20 tahun. Character: bercak hipopigmentasi atau eritematosa yang kering karena berkurangnya produksi keringat, tidak gatal, dan yang paling khas MATI RASA atau berkurang rasanya terhadap sentuhan, nyeri, dan suhu. Radiation: gali gejala keterlibatan saraf tepi — kesemutan atau baal pada tangan dan kaki, kelemahan otot, kesulitan menggenggam atau mengancing baju, kaki sering terseret, serta luka atau melepuh yang tidak terasa sakit. Associations: alis menipis atau rontok (madarosis), hidung tersumbat dan mimisan, mata kering dan sulit menutup sempurna, serta nodul pada kulit. Time course: apakah bercak bertambah jumlah dan luas; tanyakan adanya episode bercak menjadi merah, bengkak, dan nyeri mendadak atau nyeri hebat pada saraf yang menandakan REAKSI KUSTA. Exacerbating: kehamilan, infeksi penyerta, stres, dan permulaan pengobatan dapat memicu reaksi. Severity: sejauh mana keluhan mengganggu fungsi tangan, kaki, dan penglihatan, serta dampak psikososial akibat stigma.',
      riwayatPenyakitDahulu: 'Riwayat pengobatan kusta sebelumnya beserta kelengkapannya (penting untuk membedakan kasus baru, kambuh, atau reaksi), tuberkulosis, HIV, diabetes, serta penyakit yang menurunkan imunitas.',
      riwayatPenyakitKeluarga:
        'RIWAYAT KONTAK SERUMAH ATAU KONTAK ERAT dengan penderita kusta merupakan pertanyaan kunci — risiko pada kontak serumah jauh lebih tinggi dibanding populasi umum; tanyakan pula adakah anggota keluarga dengan bercak mati rasa atau kecacatan tangan dan kaki.',
      riwayatPengobatan: 'Obat yang sudah digunakan termasuk salep antijamur atau kortikosteroid topikal yang sering diberikan karena bercak disalahartikan sebagai panu atau eksim; tanyakan pula riwayat penggunaan MDT dan kepatuhannya.',
      riwayatAlergi: 'Riwayat alergi obat terutama dapson dan rifampisin.',
      riwayatSosialEkonomi:
        'Kondisi tempat tinggal termasuk kepadatan hunian dan ventilasi, status gizi, pekerjaan, tingkat pendidikan, akses ke fasilitas kesehatan untuk pengobatan yang berlangsung 6-12 bulan, serta yang tidak kalah penting adalah PERSEPSI PASIEN DAN KELUARGA TERHADAP PENYAKIT INI — stigma merupakan penyebab utama keterlambatan berobat dan putus pengobatan.',
    },
    pemeriksaanFisik: [
      'Pemeriksaan dilakukan di bawah CAHAYA ALAMI YANG CUKUP dengan pasien membuka pakaian secukupnya sambil menjaga privasi; periksa seluruh permukaan tubuh secara sistematis dari kepala hingga kaki termasuk punggung dan bokong',
      'Inspeksi lesi kulit: makula hipopigmentasi atau eritematosa, plak, nodul; nilai jumlah, distribusi (simetris atau asimetris), batas (tegas atau tidak), permukaan (kering, tidak berkeringat), dan pertumbuhan rambut pada lesi yang berkurang',
      'UJI SENSASI pada lesi merupakan pemeriksaan terpenting: uji raba dengan kapas, uji nyeri dengan jarum, dan uji suhu dengan tabung berisi air hangat dan dingin — bandingkan dengan kulit normal di sekitarnya dan lakukan dengan mata pasien tertutup',
      'PALPASI SARAF TEPI untuk menilai penebalan dan nyeri, dilakukan simetris kanan-kiri: nervus aurikularis magnus di leher, nervus ulnaris di sulkus olekrani, nervus medianus di pergelangan tangan, nervus radialis, nervus peroneus komunis di kaput fibula, dan nervus tibialis posterior di belakang maleolus medial',
      'Uji fungsi motorik: kekuatan jari kelingking dan ibu jari (nervus ulnaris dan medianus), kemampuan mengangkat pergelangan tangan (nervus radialis), dorsofleksi kaki (nervus peroneus), dan kekuatan menutup mata (nervus fasialis)',
      'Uji sensasi telapak tangan dan kaki dengan monofilamen untuk deteksi dini gangguan sensorik protektif',
      'Cari kecacatan: claw hand, drop hand, drop foot, lagoftalmus, madarosis, hidung pelana, serta ulkus plantaris pada area mati rasa',
      'Pemeriksaan mata: kemampuan menutup mata sempurna, kejernihan kornea, dan tajam penglihatan',
    ],
    penunjang: [
      'SLIT-SKIN SMEAR (kerokan jaringan kulit) dari cuping telinga dan lesi aktif, diwarnai Ziehl-Neelsen untuk mencari basil tahan asam; hasil dinyatakan sebagai indeks bakteri dan indeks morfologi',
      'Hasil NEGATIF TIDAK MENYINGKIRKAN diagnosis — pada tipe pausibasilar basil memang tidak ditemukan, sehingga diagnosis tetap ditegakkan secara klinis',
      'Biopsi kulit dengan pemeriksaan histopatologi bila gambaran klinis meragukan; menunjukkan granuloma dengan keterlibatan saraf kutan',
      'Mycobacterium leprae TIDAK DAPAT dibiakkan pada media buatan sehingga kultur tidak tersedia sebagai sarana diagnosis',
      'Pemeriksaan fungsi hati dan darah lengkap sebelum dan selama terapi untuk memantau efek samping dapson (anemia hemolitik, terutama pada defisiensi G6PD) dan rifampisin (hepatotoksisitas)',
      'PCR tersedia di pusat rujukan tertentu untuk kasus sulit',
    ],
    etiologi: 'Mycobacterium leprae, basil tahan asam intraselular obligat yang memiliki afinitas khusus terhadap sel Schwann saraf tepi dan makrofag kulit, serta tumbuh optimal pada suhu lebih rendah dari suhu inti tubuh.',
    patofisiologi:
      'Penularan terjadi terutama melalui droplet dari saluran napas atas penderita multibasilar yang belum diobati, memerlukan kontak erat dan lama; sebagian besar orang yang terpapar (sekitar 95%) tidak jatuh sakit karena imunitas selular mereka mampu mengendalikan kuman. Gambaran klinis yang muncul ditentukan oleh KEKUATAN IMUNITAS SELULAR pejamu, sehingga kusta menempati sebuah spektrum. Pada kutub tuberkuloid dengan imunitas selular kuat, respons Th1 membentuk granuloma yang membatasi kuman sehingga lesi sedikit, asimetris, berbatas tegas, dan basil sulit ditemukan — namun reaksi imun yang kuat inilah yang justru merusak saraf secara cepat. Pada kutub lepromatosa dengan imunitas selular lemah, respons bergeser ke Th2 sehingga kuman berkembang biak tanpa kendali, menghasilkan lesi banyak, simetris, dan basil melimpah, dengan kerusakan saraf yang lebih lambat namun luas. Mycobacterium leprae menginvasi sel Schwann dan merusak selubung mielin sehingga terjadi gangguan sensorik lebih dahulu, disusul gangguan otonom berupa kulit kering karena kelenjar keringat tidak berfungsi, dan akhirnya gangguan motorik berupa kelemahan otot. Predileksi pada saraf superfisial yang bersuhu lebih rendah menjelaskan mengapa nervus ulnaris di siku dan nervus peroneus di kaput fibula paling sering terkena. Kecacatan yang terjadi bersifat sekunder: hilangnya sensasi protektif menyebabkan pasien tidak menyadari luka bakar, luka tekan, dan trauma berulang sehingga terjadi ulkus, infeksi, dan mutilasi — bukan karena kuman memakan jaringan sebagaimana dipercaya secara keliru di masyarakat.',
    faktorRisiko: [
      'Kontak serumah atau kontak erat berkepanjangan dengan penderita multibasilar yang belum diobati',
      'Tinggal di daerah endemis dengan kepadatan hunian tinggi dan ventilasi buruk',
      'Status gizi buruk dan sosial ekonomi rendah',
      'Faktor genetik yang memengaruhi respons imun selular',
      'Imunodefisiensi termasuk HIV',
      'Usia anak dan dewasa muda pada daerah endemis',
    ],
    goldStandard:
      'Diagnosis ditegakkan bila ditemukan minimal SATU dari TIGA TANDA KARDINAL: (1) bercak kulit hipopigmentasi atau eritematosa dengan KEHILANGAN ATAU BERKURANGNYA SENSASI yang jelas, (2) PENEBALAN ATAU NYERI SARAF TEPI disertai gangguan fungsi sensorik, motorik, atau otonom pada area persarafannya, atau (3) ditemukan BASIL TAHAN ASAM pada slit-skin smear atau biopsi. Klasifikasi operasional WHO untuk menentukan regimen: PAUSIBASILAR bila lesi kulit 1-5 dengan hanya satu batang saraf terkena dan apusan negatif; MULTIBASILAR bila lesi lebih dari 5, atau lebih dari satu batang saraf terkena, atau apusan positif.',
    diagnosisBanding: [
      'Pitiriasis versikolor (panu) — bercak hipopigmentasi berskuama halus namun TIDAK MATI RASA, KOH positif menunjukkan gambaran spaghetti and meatballs',
      'Vitiligo — depigmentasi total berwarna putih susu berbatas tegas, sensasi NORMAL, tanpa penebalan saraf',
      'Pitiriasis alba — bercak hipopigmentasi pada anak atopik dengan sensasi normal dan cenderung membaik sendiri',
      'Tinea korporis — lesi anular dengan tepi aktif yang GATAL dan sensasi normal',
      'Hipopigmentasi pascainflamasi — didahului riwayat lesi kulit sebelumnya di lokasi yang sama, sensasi normal',
      'Granuloma anulare dan sarkoidosis kulit — lesi anular tanpa gangguan sensorik',
      'Neuropati perifer akibat diabetes — gangguan sensorik simetris pola kaus kaki dan sarung tangan tanpa lesi kulit khas maupun penebalan saraf asimetris',
    ],
    pengkajian:
      'Dipikirkan kusta pada pasien ini atas dasar bercak kulit hipopigmentasi yang berlangsung menahun, tidak gatal, permukaannya kering, dan yang paling menentukan adalah TERBUKTI MATI RASA pada uji sensasi raba, nyeri, serta suhu, disertai teraba penebalan saraf tepi pada palpasi, pada latar riwayat kontak serumah dengan penderita kusta di lingkungan yang endemis. Kombinasi bercak dengan anestesi dan penebalan saraf telah memenuhi tanda kardinal sehingga diagnosis dapat ditegakkan secara klinis tanpa harus menunggu hasil apusan, dan penting dipahami bahwa apusan yang negatif tidak menyingkirkan diagnosis karena pada tipe pausibasilar basil memang tidak ditemukan akibat imunitas selular yang kuat. Pitiriasis versikolor menjadi diagnosis banding yang paling sering menyesatkan karena sama-sama menimbulkan bercak putih, namun panu terasa gatal terutama saat berkeringat, permukaannya berskuama halus dengan finger nail sign positif, SENSASINYA NORMAL, dan KOH menunjukkan hifa pendek dengan spora bergerombol — perbedaan pada uji sensasi inilah yang paling menentukan dan sayangnya paling sering tidak dikerjakan sehingga banyak pasien kusta terlambat terdiagnosis setelah berbulan-bulan diobati sebagai panu. Vitiligo dipertimbangkan namun depigmentasinya total berwarna putih susu dengan batas sangat tegas, sensasi utuh, dan tidak disertai penebalan saraf. Pitiriasis alba lazim pada anak dengan latar atopi dan sensasinya normal. Neuropati diabetik dipertimbangkan bila keluhan didominasi baal pada tangan dan kaki, namun polanya simetris menyerupai kaus kaki dan sarung tangan tanpa bercak kulit khas maupun penebalan saraf yang asimetris. Yang harus ditegaskan dalam pengkajian adalah bahwa penentuan tipe pausibasilar atau multibasilar bukan sekadar penggolongan akademis melainkan menentukan lama pengobatan, dan bahwa PEMERIKSAAN FUNGSI SARAF BERKALA merupakan inti tatalaksana — sebab kecacatan pada kusta bukan disebabkan kuman yang memakan jaringan sebagaimana keyakinan keliru di masyarakat, melainkan akibat hilangnya sensasi protektif sehingga luka dan trauma berulang tidak disadari pasien.',
    terapiSuportif: [
      'Perawatan diri (self-care) untuk area yang mati rasa merupakan tulang punggung pencegahan kecacatan: rendam tangan dan kaki dalam air biasa 20 menit setiap hari, gosok halus kulit yang menebal dengan batu apung, keringkan, lalu olesi minyak atau pelembap agar kulit tidak pecah',
      'PERIKSA tangan dan kaki SETIAP HARI dengan bantuan cermin untuk mencari luka, lepuh, atau kemerahan yang tidak terasa',
      'Gunakan alas kaki tertutup bersol tebal dan empuk yang sesuai ukuran; jangan berjalan tanpa alas kaki; gunakan sarung tangan atau kain tebal saat memegang benda panas dan saat bekerja',
      'Latihan gerak sendi setiap hari untuk mencegah kontraktur pada tangan dan kaki yang mengalami kelemahan otot',
      'Proteksi mata pada lagoftalmus: air mata buatan, kacamata pelindung dari debu dan sinar matahari, serta menutup mata saat tidur',
      'Perbaikan status gizi dengan asupan protein dan kalori adekuat untuk mendukung penyembuhan luka',
      'Dukungan psikososial untuk mengatasi stigma, serta rehabilitasi vokasional agar pasien tetap dapat bekerja',
    ],
    tatalaksana: [
      'MULTI DRUG THERAPY (MDT) sesuai program nasional, obat DISEDIAKAN GRATIS di puskesmas — informasi ini penting disampaikan karena biaya sering menjadi alasan pasien tidak berobat',
      'PAUSIBASILAR dewasa selama 6 bulan: rifampisin 600 mg sekali sebulan diminum di depan petugas, ditambah dapson 100 mg setiap hari diminum sendiri di rumah',
      'MULTIBASILAR dewasa selama 12 bulan: rifampisin 600 mg dan klofazimin 300 mg sekali sebulan di depan petugas, ditambah dapson 100 mg dan klofazimin 50 mg setiap hari di rumah',
      'Dosis anak disesuaikan berat badan sesuai pedoman program; tersedia blister pack khusus anak',
      'PEMERIKSAAN FUNGSI SARAF secara berkala setiap bulan selama pengobatan dan setelahnya — deteksi dini gangguan fungsi saraf memungkinkan pemberian kortikosteroid sebelum kerusakan menjadi permanen',
      'REAKSI KUSTA TIPE 1 (reversal) dengan neuritis atau gangguan fungsi saraf baru: prednison mulai 40-60 mg per hari diturunkan bertahap selama 12 minggu; ini merupakan KEDARURATAN karena penundaan berujung kecacatan permanen',
      'REAKSI KUSTA TIPE 2 (eritema nodosum leprosum): prednison, klofazimin dosis tinggi, atau talidomid pada kasus berulang (talidomid KONTRAINDIKASI MUTLAK pada perempuan usia subur karena teratogenik)',
      'MDT TETAP DILANJUTKAN selama reaksi berlangsung — reaksi bukan tanda kegagalan terapi melainkan pergeseran respons imun',
      'Waspadai efek samping: dapson dapat menimbulkan anemia hemolitik terutama pada defisiensi G6PD dan sindrom hipersensitivitas; klofazimin menyebabkan perubahan warna kulit menjadi kecokelatan yang REVERSIBEL namun perlu dijelaskan di awal agar pasien tidak putus obat; rifampisin membuat urin berwarna merah oranye yang tidak berbahaya',
      'PEMERIKSAAN KONTAK serumah dan kontak erat secara berkala minimal setahun sekali selama 5 tahun; profilaksis rifampisin dosis tunggal untuk kontak dapat diberikan sesuai kebijakan program',
      'Rujuk untuk bedah rekonstruksi dan rehabilitasi pada kecacatan yang sudah terbentuk',
    ],
    edukasi: [
      'LURUSKAN MITOS sejak kunjungan pertama: kusta disebabkan kuman dan DAPAT DISEMBUHKAN TOTAL dengan obat gratis, bukan kutukan, guna-guna, keturunan, atau dosa. Setelah minum dosis pertama MDT, penularan praktis terhenti sehingga pasien TIDAK PERLU DIKUCILKAN dan dapat tetap bersekolah, bekerja, serta tinggal bersama keluarga',
      'Jelaskan bahwa kecacatan terjadi karena mati rasa membuat luka tidak disadari, BUKAN karena kuman memakan jaringan — pemahaman ini yang mendorong pasien rajin melakukan perawatan diri',
      'Kepatuhan minum obat sampai TUNTAS 6 atau 12 bulan meski bercak sudah membaik; jelaskan sejak awal bahwa klofazimin membuat kulit menggelap namun akan pulih setelah pengobatan selesai, dan rifampisin membuat urin kemerahan yang tidak berbahaya',
      'Penjadwalan makan teratur tiga kali sehari dengan protein cukup untuk mendukung penyembuhan; tidak ada pantangan makanan khusus pada kusta — luruskan mitos pantang ikan dan telur yang justru memperburuk gizi',
      'Tidur cukup 7-8 jam; periksa kaki sebelum tidur setiap malam sebagai kebiasaan rutin',
      'Pola olahraga dan aktivitas normal dianjurkan, dengan perhatian khusus pada perlindungan tangan dan kaki yang mati rasa selama beraktivitas; hindari pekerjaan dengan risiko luka bakar atau trauma berulang bila sensasi sudah hilang',
      'SEGERA kembali bila muncul: bercak menjadi merah bengkak dan nyeri, nyeri hebat pada saraf, kelemahan otot baru, mata sulit menutup, demam dengan benjolan merah nyeri di kulit, atau luka yang tidak sembuh — semua ini menandakan reaksi kusta atau gangguan fungsi saraf yang harus ditangani segera agar kecacatan tidak menetap',
      'Kontrol rutin setiap bulan untuk pengambilan obat sekaligus pemeriksaan fungsi saraf, dan lanjutkan pemantauan setelah pengobatan selesai',
      'Ajak seluruh anggota keluarga serumah untuk diperiksa — deteksi dini pada kontak mencegah rantai penularan dan kecacatan berikutnya',
    ],
    komplikasi: [
      'Kecacatan tangan: claw hand, atrofi otot, kontraktur, dan mutilasi jari akibat trauma berulang',
      'Kecacatan kaki: drop foot, ulkus plantaris kronik, osteomielitis, hingga amputasi',
      'Kecacatan mata: lagoftalmus, keratitis eksposur, uveitis, hingga kebutaan',
      'Reaksi kusta tipe 1 dan tipe 2 yang dapat berulang dan menyebabkan kerusakan saraf permanen',
      'Deformitas wajah: madarosis, hidung pelana akibat destruksi septum',
      'Dampak psikososial berat berupa stigma, penolakan keluarga, kehilangan pekerjaan, dan depresi',
    ],
    prognosis:
      'Sangat baik bila terdeteksi dan diobati dini — MDT menyembuhkan kusta secara tuntas dan kekambuhan sangat jarang. Namun kerusakan saraf yang sudah terjadi sebelum pengobatan bersifat PERMANEN dan tidak dapat dipulihkan oleh obat apa pun, sehingga prognosis fungsional sepenuhnya ditentukan oleh seberapa dini diagnosis ditegakkan. Inilah alasan mengapa setiap bercak kulit yang tidak gatal wajib diuji sensasinya, dan mengapa pemeriksaan kontak serumah menjadi strategi kunci pengendalian kusta.',
    referensi: ['SKDI2012', 'WHOLEPROSY2018', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Reaksi lepra': {
    definisi: 'Episode inflamasi akut pada perjalanan kusta; tipe 1 (reversal) dan tipe 2 (eritema nodosum leprosum) — kedaruratan karena berisiko kerusakan saraf permanen.',
    diagnosis: ['Tipe 1: lesi kulit lama menjadi merah dan bengkak, neuritis akut dengan nyeri dan gangguan fungsi saraf; Tipe 2: nodul merah nyeri baru, demam, malaise, dapat disertai neuritis, iritis, orkitis'],
    tatalaksana: ['Kortikosteroid sistemik (prednison) dengan tapering bertahap untuk reaksi disertai neuritis atau gangguan fungsi saraf — jangan tunda karena kerusakan saraf bisa permanen; LANJUTKAN MDT, analgesia, istirahatkan anggota gerak yang terkena; klofazimin dosis tinggi atau talidomid pada ENL berulang'],
    referensi: ['SKDI2012', 'WHOLEPROSY2018', 'PERDOSKI2021'],
  },
  'Sifilis stadium 1 dan 2': {
    definisi: 'Infeksi Treponema pallidum menular seksual; stadium primer ditandai chancre, stadium sekunder oleh erupsi generalisata.',
    diagnosis: ['Primer: ulkus soliter dasar bersih, tepi teratur, TIDAK NYERI (membedakan dari chancroid), limfadenopati tidak nyeri; Sekunder: ruam makulopapular termasuk telapak tangan dan kaki, kondiloma lata; serologi non-treponemal (VDRL/RPR) dan treponemal (TPHA)'],
    tatalaksana: ['Benzatin penisilin G 2,4 juta unit IM dosis tunggal (stadium dini), doksisiklin bila alergi penisilin; obati pasangan seksual, skrining IMS lain termasuk HIV, pantau titer serologi untuk respons; edukasi reaksi Jarisch-Herxheimer'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Tinea kapitis': {
    definisi: 'Dermatofitosis pada kulit kepala dan rambut, umum pada anak.',
    diagnosis: ['Bercak alopesia bersisik dengan rambut patah, dapat disertai gatal; kerion berupa massa inflamasi basah dan nyeri; KOH menunjukkan hifa/spora pada rambut'],
    tatalaksana: ['Antijamur SISTEMIK wajib (griseofulvin atau terbinafin) — topikal saja tidak menembus folikel rambut; sampo antijamur sebagai tambahan untuk kurangi penularan; periksa dan obati sumber penularan (anggota keluarga, hewan peliharaan)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Tinea barbe': {
    definisi: 'Dermatofitosis pada area janggut dan kumis pria, mengenai folikel rambut terminal.',
    diagnosis: ['Papul/pustul folikuler dengan eritema di area janggut, rambut mudah dicabut, dapat membentuk lesi inflamasi mirip kerion; KOH positif membedakan dari folikulitis bakterial'],
    tatalaksana: ['Antijamur sistemik (terbinafin/itrakonazol) karena melibatkan folikel, kompres pada lesi inflamasi, hentikan bercukur sementara pada area terkena'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Tinea fasialis': {
    definisi: 'Dermatofitosis pada kulit wajah tanpa keterlibatan area berjanggut.',
    diagnosis: ['Plak eritematosa dengan tepi aktif dan central clearing; sering menjadi atipik (tinea incognito) akibat pemakaian kortikosteroid topikal; KOH konfirmatif'],
    tatalaksana: ['Antijamur topikal golongan azol 2-4 minggu, hindari kortikosteroid topikal tunggal, antijamur sistemik bila luas atau gagal terapi topikal'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Tinea korporis': {
    definisi: 'Dermatofitosis pada kulit tubuh yang tidak berambut terminal.',
    diagnosis: ['Lesi anular dengan tepi aktif eritematosa bersisik dan central clearing, gatal; KOH menunjukkan hifa panjang bersepta'],
    tatalaksana: ['Antijamur topikal azol 2x/hari selama 2-4 minggu, sistemik bila luas/rekuren, jaga kulit kering, hindari berbagi handuk dan pakaian'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Tinea manus': {
    definisi: 'Dermatofitosis pada telapak dan punggung tangan.',
    diagnosis: ['Skuama difus pada telapak tangan sering unilateral, dapat disertai hiperkeratosis; klasik "two feet one hand syndrome" bila disertai tinea pedis bilateral; KOH konfirmatif'],
    tatalaksana: ['Antijamur topikal, sering memerlukan sistemik bila hiperkeratotik; obati tinea pedis yang menyertai untuk cegah reinfeksi'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Tinea unguium': {
    definisi: 'Onikomikosis akibat dermatofita pada kuku tangan atau kaki.',
    diagnosis: ['Kuku menebal, rapuh, berubah warna kekuningan, onikolisis dan debris subungual; KOH/kultur potongan kuku konfirmatif sebelum memulai terapi sistemik jangka panjang'],
    tatalaksana: ['Antijamur sistemik (terbinafin) 6 minggu untuk kuku tangan, 12 minggu untuk kuku kaki; topikal saja umumnya kurang efektif kecuali lesi sangat terbatas; pantau fungsi hati pada terapi sistemik panjang'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Tinea kruris': {
    definisi: 'Dermatofitosis pada lipat paha, genital, dan area perineum.',
    diagnosis: ['Plak eritematosa dengan tepi aktif bersisik di lipat paha, gatal, umumnya tidak mengenai skrotum (membedakan dari kandidiasis); KOH konfirmatif'],
    tatalaksana: ['Antijamur topikal azol 2-4 minggu, jaga area tetap kering, hindari pakaian ketat dan lembap, obati tinea pedis yang sering menjadi sumber'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Tinea pedis': {
    definisi: 'Dermatofitosis pada kaki, terutama sela jari; dikenal sebagai athlete\'s foot.',
    diagnosis: ['Maserasi, skuama, dan fisura pada sela jari kaki, gatal; bentuk mokasin berupa skuama difus pada telapak; KOH konfirmatif; sering menjadi pintu masuk erisipelas/selulitis'],
    tatalaksana: ['Antijamur topikal 4 minggu, keringkan sela jari setelah mandi, gunakan kaus kaki menyerap keringat dan alas kaki terbuka bila memungkinkan; sistemik bila luas atau tipe mokasin'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Pitiriasis vesikolor': {
    definisi: 'Infeksi superfisial oleh ragi Malassezia yang menimbulkan makula hipopigmentasi atau hiperpigmentasi berskuama halus.',
    diagnosis: ['Makula berbatas tegas dengan skuama halus di badan dan lengan atas, tanda finger nail sign positif; KOH menunjukkan gambaran spaghetti and meatballs (hifa pendek dan spora bergerombol)'],
    tatalaksana: ['Antijamur topikal (ketokonazol krim/sampo, selenium sulfida), sistemik bila luas atau rekuren; EDUKASI bahwa perbedaan warna kulit menetap berbulan-bulan setelah jamur mati — bukan tanda kegagalan terapi; rekurensi sering, dapat diberikan profilaksis berkala'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Kandidosis mukokutan ringan': {
    definisi: 'Infeksi Candida pada kulit dan/atau mukosa dengan derajat ringan.',
    diagnosis: ['Plak eritematosa merah cerah pada lipatan kulit dengan LESI SATELIT khas, atau plak putih pada mukosa yang dapat dikerok; KOH menunjukkan pseudohifa dan blastospora'],
    tatalaksana: ['Antijamur topikal azol atau nistatin, jaga area lipatan kering, atasi faktor predisposisi (DM, obesitas, kelembapan, antibiotik/steroid berkepanjangan)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Cutaneus larva migran': {
    definisi: 'Creeping eruption — migrasi larva cacing tambang hewan di dalam epidermis manusia.',
    diagnosis: ['Lesi linear berkelok-kelok (serpiginosa) yang menonjol dan sangat gatal, bergerak beberapa mm sampai cm per hari; riwayat kontak kulit dengan pasir/tanah terkontaminasi tinja hewan; tersering di kaki dan bokong'],
    tatalaksana: ['Albendazol oral 3-7 hari atau ivermektin dosis tunggal, antihistamin untuk gatal; edukasi gunakan alas kaki dan alas saat duduk di pasir'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Pedikulosis kapitis': {
    definisi: 'Infestasi kutu kepala Pediculus humanus capitis.',
    diagnosis: ['Gatal kulit kepala terutama oksipital dan belakang telinga, ditemukan telur (nits) melekat erat pada batang rambut dan kutu dewasa; bekas garukan dapat mengalami infeksi sekunder'],
    tatalaksana: ['Permetrin 1% topikal diulang 7-10 hari kemudian, sisir serit untuk mengangkat telur, cuci sprei/handuk/topi dengan air panas, periksa dan obati anggota keluarga serta kontak sekolah bersamaan'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Pedikulosis pubis': {
    definisi: 'Infestasi kutu Pthirus pubis pada rambut kemaluan, umumnya ditularkan melalui kontak seksual.',
    diagnosis: ['Gatal di area pubis, ditemukan kutu dan telur pada rambut pubis, dapat ditemukan macula cerulea (bercak kebiruan); skrining IMS lain karena penularan seksual'],
    tatalaksana: ['Permetrin topikal pada area terinfestasi, obati pasangan seksual, cuci pakaian dalam dan sprei dengan air panas; periksa bulu mata pada anak (curigai kekerasan seksual bila ditemukan)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Skabies': {
    definisi: 'Infestasi kulit oleh tungau Sarcoptes scabiei varietas hominis yang membuat terowongan di stratum korneum; sangat menular melalui kontak kulit langsung yang lama dan merupakan masalah kesehatan utama di lingkungan padat seperti pesantren, asrama, panti, dan lembaga pemasyarakatan.',
    anamnesis: {
      keluhanUtama: 'Gatal hebat di sela-sela jari tangan dan lipatan tubuh yang SANGAT MEMBERAT PADA MALAM HARI sejak beberapa minggu.',
      riwayatPenyakitSekarang:
        'Telusuri dengan SOCRATES. Site: predileksi khas pada sela jari tangan, pergelangan tangan sisi volar, siku bagian luar, lipat ketiak depan, areola mamma pada perempuan, umbilikus, bokong, dan genitalia eksterna pada laki-laki; pada bayi dan anak kecil dapat mengenai wajah, kulit kepala, telapak tangan, dan telapak kaki yang biasanya terhindar pada dewasa. Onset: bertahap, dan pada infestasi pertama gatal baru muncul 4-6 minggu setelah terpapar karena perlu waktu untuk sensitisasi — pada reinfestasi gatal timbul jauh lebih cepat dalam 1-3 hari. Character: gatal hebat yang membuat pasien menggaruk hingga lecet dan sulit tidur. Radiation: menyebar ke lipatan tubuh lain seiring waktu. Associations: adanya lesi bernanah akibat infeksi sekunder, dan yang paling penting ADAKAH ORANG SERUMAH ATAU SEASRAMA YANG MENGALAMI KELUHAN SERUPA — ini merupakan salah satu tanda kardinal. Time course: gatal khas MEMBERAT PADA MALAM HARI dan saat tubuh hangat setelah mandi air panas atau berolahraga, karena tungau lebih aktif pada suhu hangat. Exacerbating: suhu hangat, keringat, dan malam hari; garukan memperberat serta memicu infeksi sekunder. Severity: dampak terhadap kualitas tidur, konsentrasi belajar atau bekerja, dan aktivitas sehari-hari.',
      riwayatPenyakitDahulu: 'Riwayat skabies sebelumnya dan terapi yang pernah diterima, riwayat dermatitis atopik yang memperberat gatal, serta kondisi imunokompromais seperti HIV, penggunaan kortikosteroid jangka panjang, atau keganasan yang berisiko menimbulkan skabies berkrusta (skabies Norwegia).',
      riwayatPenyakitKeluarga: 'Anggota keluarga serumah atau teman sekamar dengan keluhan gatal serupa — informasi ini menentukan strategi terapi karena SEMUA kontak harus diobati serentak.',
      riwayatPengobatan:
        'Obat yang sudah dipakai sendiri termasuk salep antigatal, KORTIKOSTEROID TOPIKAL yang dapat menyamarkan gambaran klinis menjadi skabies inkognito, antihistamin, serta obat tradisional. Tanyakan pula riwayat terapi skabies sebelumnya, cara pemakaian, dan apakah kontak serumah ikut diobati — kegagalan terapi paling sering disebabkan cara pakai yang salah atau kontak yang tidak diobati.',
      riwayatAlergi: 'Riwayat alergi obat topikal dan riwayat dermatitis kontak.',
      riwayatSosialEkonomi:
        'Kondisi tempat tinggal: jumlah penghuni per kamar, kebiasaan tidur bersama, berbagi tempat tidur, handuk, pakaian, atau sajadah; riwayat tinggal di pesantren, asrama, panti asuhan, atau lembaga pemasyarakatan; ketersediaan air bersih dan fasilitas mencuci; frekuensi mengganti dan menjemur sprei serta pakaian; dan kemampuan finansial untuk mengobati seluruh anggota keluarga sekaligus.',
    },
    pemeriksaanFisik: [
      'KUNIKULUS (terowongan): garis halus berkelok sepanjang beberapa milimeter berwarna keabuan dengan papul atau vesikel kecil di ujungnya — temuan patognomonik namun sering sulit dilihat karena tertutup bekas garukan',
      'Papul, vesikel, dan ekskoriasi pada tempat predileksi; distribusi lesi jauh lebih membantu diagnosis daripada bentuk lesi itu sendiri',
      'Nodul skabies berwarna kecokelatan yang sangat gatal pada skrotum, penis, dan aksila — dapat bertahan berminggu-minggu setelah tungau mati dan bukan berarti terapi gagal',
      'Pada bayi: lesi juga mengenai wajah, kulit kepala, telapak tangan, dan telapak kaki, sering berupa vesikel dan pustul',
      'Tanda infeksi sekunder: pustul, krusta kekuningan seperti madu (impetigenisasi), selulitis, dan limfadenopati regional',
      'Skabies berkrusta pada imunokompromais: krusta tebal berlapis yang mengandung ribuan hingga jutaan tungau, gatal justru dapat ringan, dan SANGAT MENULAR',
      'Periksa seluruh permukaan tubuh termasuk area genital dengan menjaga privasi pasien',
    ],
    penunjang: [
      'Diagnosis umumnya KLINIS berdasarkan empat tanda kardinal — pemeriksaan penunjang tidak wajib bila gambaran klinis khas',
      'Kerokan kulit dari kunikulus atau papul yang belum tergaruk, diperiksa dengan KOH atau minyak mineral di bawah mikroskop untuk menemukan tungau, telur, atau skibala (kotoran tungau); temuan positif memastikan diagnosis namun hasil negatif TIDAK menyingkirkan karena jumlah tungau pada skabies klasik hanya sekitar 10-15 ekor',
      'Uji tinta Burrow: teteskan tinta pada lesi lalu hapus dengan alkohol — tinta akan tertinggal mengisi terowongan dan memperjelas gambarannya',
      'Dermoskopi menunjukkan gambaran delta wing jet atau hang glider berupa struktur segitiga gelap di ujung terowongan',
      'Pemeriksaan tambahan bila terdapat infeksi sekunder luas atau kecurigaan skabies berkrusta: darah lengkap dan skrining HIV sesuai indikasi',
    ],
    etiologi: 'Tungau Sarcoptes scabiei varietas hominis, parasit obligat manusia berukuran sekitar 0,3-0,4 mm.',
    patofisiologi:
      'Tungau betina yang telah dibuahi menggali terowongan di stratum korneum dengan kecepatan sekitar 2 mm per hari dan meletakkan 2-3 telur setiap hari selama masa hidupnya yang berlangsung 4-6 minggu. Telur menetas dalam 3-4 hari menjadi larva yang keluar ke permukaan kulit, lalu berkembang menjadi tungau dewasa dalam sekitar 2 minggu. Gatal timbul bukan akibat gigitan langsung melainkan karena REAKSI HIPERSENSITIVITAS TIPE LAMBAT terhadap tungau, telur, dan kotorannya. Inilah sebabnya pada infestasi pertama gatal baru muncul 4-6 minggu setelah paparan yaitu setelah proses sensitisasi selesai, sedangkan pada reinfestasi gatal timbul dalam hitungan hari karena sistem imun sudah tersensitisasi. Mekanisme yang sama menjelaskan mengapa gatal masih dapat bertahan 2-4 minggu setelah seluruh tungau mati — reaksi imun memerlukan waktu untuk mereda, dan hal ini sering disalahartikan sebagai kegagalan terapi sehingga pasien mengoleskan obat berulang kali hingga timbul dermatitis iritan. Penularan memerlukan kontak kulit langsung yang cukup lama, sedangkan penularan melalui pakaian dan sprei berperan kecil pada skabies klasik namun menjadi sangat penting pada skabies berkrusta yang beban tungaunya sangat tinggi.',
    faktorRisiko: [
      'Hunian padat: pesantren, asrama, panti asuhan, barak, lembaga pemasyarakatan',
      'Higiene perorangan dan sanitasi lingkungan yang kurang, keterbatasan air bersih',
      'Kebiasaan berbagi tempat tidur, handuk, pakaian, dan perlengkapan ibadah',
      'Kontak erat dengan penderita skabies',
      'Status sosial ekonomi rendah dan tingkat pengetahuan terbatas',
      'Imunokompromais dan usia lanjut untuk skabies berkrusta',
    ],
    goldStandard:
      'Baku emas adalah identifikasi tungau, telur, atau skibala melalui kerokan kulit yang diperiksa mikroskopis, atau visualisasi langsung dengan dermoskopi. Namun dalam praktik, diagnosis ditegakkan secara klinis bila terpenuhi minimal DUA dari EMPAT TANDA KARDINAL: (1) pruritus nokturna yaitu gatal yang memberat pada malam hari, (2) menyerang sekelompok orang yang tinggal bersama, (3) ditemukan kunikulus pada tempat predileksi, dan (4) ditemukan tungau pada pemeriksaan.',
    diagnosisBanding: [
      'Prurigo — papul gatal kronik pada ekstensor ekstremitas, tidak berkelompok pada sela jari, tidak ada kunikulus, dan tidak menular pada orang serumah',
      'Dermatitis atopik — riwayat atopi dan predileksi fleksural, gatal tidak khas nokturnal, tidak menular',
      'Pedikulosis korporis — gatal dengan lesi pada area yang tertutup pakaian, ditemukan kutu dan telur pada serat pakaian',
      'Dermatitis kontak — lesi terbatas pada area kontak dengan batas tegas dan riwayat pajanan jelas',
      'Reaksi gigitan serangga — lesi lebih sporadis dengan punctum sentral, tidak ada terowongan, tidak ada penularan pada kontak serumah',
      'Urtikaria papular dan erupsi obat — pola distribusi dan riwayat berbeda',
    ],
    pengkajian:
      'Dipikirkan skabies pada pasien ini atas dasar gatal hebat yang khas memberat pada malam hari, dengan lesi berupa papul dan ekskoriasi pada tempat predileksi yaitu sela jari tangan, pergelangan tangan sisi volar, dan lipatan tubuh, disertai riwayat keluhan serupa pada anggota keluarga atau teman sekamar yang tinggal bersama, pada latar hunian padat dengan kebiasaan berbagi perlengkapan pribadi. Kombinasi pruritus nokturna, distribusi lesi yang khas, dan penularan pada orang sekitar telah memenuhi tanda kardinal sehingga diagnosis dapat ditegakkan secara klinis meski tungau tidak selalu berhasil ditemukan pada kerokan — hal ini wajar mengingat jumlah tungau pada skabies klasik hanya sekitar sepuluh hingga lima belas ekor sehingga hasil negatif tidak menyingkirkan diagnosis. Prurigo menjadi pertimbangan karena sama-sama menimbulkan papul yang sangat gatal dan kronik, namun pada prurigo lesi berpredileksi pada sisi ekstensor ekstremitas, tidak ditemukan kunikulus, gatal tidak berpola nokturnal yang jelas, dan yang paling membedakan adalah tidak adanya penularan kepada orang serumah. Dermatitis atopik dipertimbangkan pada pasien dengan latar atopi, namun distribusinya fleksural dengan riwayat perjalanan kronik hilang timbul sejak kecil serta tidak menular. Pedikulosis korporis dapat menyerupai karena gatal dan lesi garukan, namun lesinya terdapat pada area yang tertutup pakaian dan kutu beserta telurnya ditemukan pada serat pakaian, bukan pada kulit. Reaksi gigitan serangga menimbulkan papul gatal namun tersebar sporadis dengan punctum sentral tanpa terowongan dan tanpa pola penularan. Yang menentukan keberhasilan terapi pada kasus ini bukanlah ketepatan memilih obat skabisida, melainkan PENGOBATAN SERENTAK SELURUH KONTAK SERUMAH beserta dekontaminasi pakaian dan alas tidur — sebab pengobatan pasien tunggal tanpa menyertakan kontak yang asimtomatik hampir selalu berakhir dengan reinfestasi berulang.',
    terapiSuportif: [
      'Antihistamin oral untuk mengendalikan gatal, terutama sediaan sedatif pada malam hari agar pasien dapat tidur',
      'Emolien untuk memperbaiki sawar kulit yang rusak akibat garukan dan pemakaian skabisida',
      'Potong kuku pendek dan jaga kebersihan tangan untuk mengurangi kerusakan kulit serta risiko infeksi sekunder akibat garukan',
      'Antibiotik topikal atau sistemik bila terdapat infeksi sekunder — impetigenisasi diobati lebih dahulu atau bersamaan sebelum kulit menjadi terlalu rusak untuk menerima skabisida',
      'Kortikosteroid topikal potensi ringan dapat diberikan SETELAH terapi skabisida selesai untuk meredakan dermatitis pascaskabies, bukan sebagai terapi awal',
    ],
    tatalaksana: [
      'PERMETRIN 5% krim sebagai lini pertama: oleskan MERATA ke SELURUH TUBUH dari leher ke bawah termasuk sela jari tangan dan kaki, lipatan, umbilikus, genitalia, dan di bawah kuku; pada bayi dan anak kecil termasuk wajah dan kulit kepala dengan menghindari mata dan mulut',
      'Diamkan 8-12 jam (dioleskan malam hari sebelum tidur lalu dibilas keesokan paginya), ULANGI 7 HARI KEMUDIAN untuk membunuh tungau yang menetas dari telur yang tidak terbunuh pada aplikasi pertama',
      'Bila mencuci tangan dalam masa aplikasi, oleskan ulang krim pada tangan tersebut',
      'Alternatif: salep sulfur presipitatum 5-10% dioleskan 3 malam berturut-turut (pilihan untuk bayi kurang dari 2 bulan dan ibu hamil, murah namun berbau dan mengotori pakaian), atau ivermektin oral 200 mcg/kgBB dosis tunggal diulang 7-14 hari kemudian pada kasus luas, gagal terapi, skabies berkrusta, atau wabah di institusi',
      'IVERMEKTIN tidak diberikan pada anak dengan berat kurang dari 15 kg dan pada ibu hamil maupun menyusui',
      'OBATI SEMUA KONTAK SERUMAH DAN KONTAK ERAT SECARA SERENTAK pada hari yang sama, termasuk yang belum bergejala — ini merupakan langkah paling menentukan keberhasilan terapi',
      'Dekontaminasi: cuci sprei, sarung bantal, handuk, dan pakaian yang dipakai 3 hari terakhir dengan air panas lalu setrika atau jemur di bawah sinar matahari; barang yang tidak dapat dicuci dimasukkan kantong plastik tertutup selama 3-7 hari karena tungau mati di luar tubuh manusia dalam 2-3 hari',
      'Skabies berkrusta memerlukan kombinasi ivermektin oral berulang dengan skabisida topikal, keratolitik untuk melunakkan krusta, serta isolasi kontak karena tingkat penularannya sangat tinggi',
      'Evaluasi ulang 2 dan 4 minggu setelah terapi; dinyatakan gagal terapi bila ditemukan lesi BARU atau tungau pada pemeriksaan ulang, bukan semata karena gatal masih ada',
    ],
    edukasi: [
      'GATAL DAPAT BERTAHAN 2-4 MINGGU setelah seluruh tungau mati karena reaksi alergi terhadap sisa tungau masih berlangsung — ini BUKAN kegagalan terapi. Pesan ini paling penting disampaikan agar pasien tidak mengoleskan skabisida berulang-ulang yang justru menimbulkan dermatitis iritan',
      'Cara pakai obat yang benar: mandi bersih dan keringkan tubuh, oleskan tipis merata ke seluruh permukaan kulit tanpa ada bagian yang terlewat, gunakan pada malam hari, dan jangan mandi selama masa aplikasi',
      'Seluruh anggota keluarga harus diobati BERSAMAAN pada hari yang sama meski tidak gatal — bila bergantian, yang sudah sembuh akan tertular kembali dari yang belum diobati',
      'Jangan berbagi handuk, pakaian, sabun batangan, tempat tidur, dan sajadah selama masa pengobatan',
      'Tidur: gatal malam hari sangat mengganggu istirahat sehingga antihistamin sedatif dapat membantu; perbaikan tidur umumnya terasa dalam minggu pertama terapi',
      'Pola aktivitas dan olahraga tetap normal; mandi dan berkeringat justru dianjurkan untuk kebersihan namun hindari mandi air terlalu panas yang memperberat gatal',
      'Jaga kuku tetap pendek dan hindari menggaruk untuk mencegah infeksi sekunder yang dapat berujung pada impetigo dan pada kasus tertentu glomerulonefritis pascastreptokokus',
      'Kontrol 1-2 minggu setelah aplikasi kedua, atau segera bila muncul lesi bernanah, demam, atau bengkak pada wajah dan tungkai yang dapat menandakan komplikasi ginjal',
      'Pencegahan di lingkungan padat: mandi teratur dengan sabun, jemur kasur dan bantal secara berkala, ganti sprei minimal seminggu sekali, dan lakukan pengobatan massal serentak bila terjadi wabah di pesantren atau asrama',
    ],
    komplikasi: [
      'Infeksi sekunder bakteri: impetigo, ektima, folikulitis, selulitis, hingga sepsis pada kasus berat',
      'Glomerulonefritis akut pascastreptokokus akibat infeksi sekunder Streptococcus',
      'Demam reumatik dan penyakit jantung reumatik sebagai konsekuensi jangka panjang infeksi streptokokus berulang',
      'Dermatitis iritan akibat penggunaan skabisida berlebihan',
      'Nodul skabies persisten dan hiperpigmentasi pascainflamasi',
      'Gangguan tidur, penurunan konsentrasi belajar, dan dampak psikososial berupa stigma',
    ],
    prognosis:
      'Sangat baik dengan terapi yang tepat — angka kesembuhan tinggi bila obat digunakan dengan cara benar dan seluruh kontak diobati serentak. Kegagalan terapi hampir selalu disebabkan tiga hal yang dapat dicegah: cara pengolesan yang tidak menyeluruh, kontak serumah yang tidak ikut diobati, dan reinfestasi dari lingkungan yang tidak didekontaminasi. Pada skabies berkrusta prognosis lebih berat dan memerlukan terapi kombinasi berulang serta penanganan penyakit dasar yang menyebabkan imunosupresi.',
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014', 'FITZPATRICK2019'],
  },
  'Reaksi gigitan serangga': {
    definisi: 'Reaksi hipersensitivitas lokal atau sistemik terhadap gigitan atau sengatan serangga.',
    diagnosis: ['Papul urtika dengan punctum sentral, gatal, dapat berkelompok atau linear; reaksi sistemik (urtikaria generalisata, sesak, hipotensi) menandakan anafilaksis'],
    tatalaksana: ['Kompres dingin, antihistamin oral, kortikosteroid topikal untuk lesi lokal; ANAFILAKSIS: epinefrin IM segera; hindari menggaruk (infeksi sekunder), gunakan repelan dan kelambu'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'WAO2020'],
  },
  'Dermatitis kontak iritan': {
    definisi: 'Peradangan kulit akibat kerusakan langsung oleh bahan iritan, tanpa mekanisme imunologis.',
    diagnosis: ['Lesi terbatas pada area kontak dengan batas tegas, muncul segera setelah paparan, rasa perih/terbakar lebih menonjol daripada gatal; riwayat paparan deterjen, sabun, pelarut, atau air berulang (sering pekerjaan)'],
    tatalaksana: ['Hindari dan minimalkan paparan iritan, gunakan sarung tangan pelindung, emolien sebagai barrier repair, kortikosteroid topikal untuk fase inflamasi akut'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Dermatitis kontak alergika': {
    definisi: 'Peradangan kulit akibat reaksi hipersensitivitas tipe IV terhadap alergen kontak.',
    diagnosis: ['Muncul 24-72 jam setelah paparan pada individu tersensitisasi, gatal dominan, lesi dapat meluas melampaui area kontak; alergen umum: nikel, karet, pewarna rambut, kosmetik; patch test untuk identifikasi alergen'],
    tatalaksana: ['Identifikasi dan hindari alergen (kunci utama), kortikosteroid topikal, antihistamin oral untuk gatal, kortikosteroid sistemik pada kasus luas/berat; edukasi membaca komposisi produk'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Dermatitis numularis': {
    definisi: 'Dermatitis kronik dengan lesi berbentuk koin (numular) yang sangat gatal.',
    diagnosis: ['Plak berbentuk bulat seperti uang logam, berbatas tegas, dengan papulovesikel, eksudasi, dan krusta, tersering di ekstremitas; sering pada kulit kering/lansia'],
    tatalaksana: ['Emolien rutin sebagai dasar, kortikosteroid topikal potensi sedang-kuat, antihistamin untuk gatal, kompres bila eksudatif, antibiotik bila infeksi sekunder'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Liken simpleks kronik/neurodermatitis': {
    definisi: 'Penebalan kulit (likenifikasi) akibat garukan berulang kronik pada area tertentu.',
    diagnosis: ['Plak likenifikasi dengan garis kulit menonjol, hiperpigmentasi, sangat gatal terutama saat santai/malam; predileksi tengkuk, lengan bawah ekstensor, tungkai bawah, area genital; siklus gatal-garuk-gatal'],
    tatalaksana: ['MEMUTUS SIKLUS GARUK adalah kunci: kortikosteroid topikal potensi kuat (dapat dengan oklusi), antihistamin sedatif malam hari, tutup lesi untuk cegah garukan, kelola stres; evaluasi komorbid psikologis'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Napkin eczema': {
    definisi: 'Dermatitis popok — dermatitis iritan pada area yang tertutup popok akibat kontak lama dengan urin dan feses.',
    diagnosis: ['Eritema pada permukaan konveks (bokong, paha, perut bawah) dengan LIPATAN TERSISA (membedakan dari kandidiasis yang justru mengenai lipatan dan disertai lesi satelit)'],
    tatalaksana: ['Sering ganti popok, bersihkan lembut dan keringkan, krim barrier (zinc oxide), beri waktu bebas popok; antijamur topikal bila terinfeksi Candida, kortikosteroid potensi ringan jangka pendek bila inflamasi berat'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Psoriasis vulgaris': {
    definisi: 'Penyakit inflamasi kronik yang dimediasi imun dengan hiperproliferasi keratinosit, ditandai plak eritematosa berskuama tebal keperakan.',
    diagnosis: ['Plak eritematosa berbatas tegas dengan skuama tebal putih keperakan pada area ekstensor (siku, lutut), kulit kepala, dan lumbosakral; fenomena Auspitz (bintik perdarahan setelah skuama dikerok), fenomena Koebner, pitting nails; nilai keterlibatan sendi (artritis psoriatik)'],
    tatalaksana: ['Ringan-sedang: emolien, kortikosteroid topikal, analog vitamin D (kalsipotriol), tar; Sedang-berat: fototerapi, metotreksat, siklosporin, retinoid, atau biologik; hindari pemicu (stres, infeksi, trauma kulit, obat tertentu); JANGAN hentikan kortikosteroid sistemik mendadak (risiko psoriasis pustulosa)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Pitiriasis rosea': {
    definisi: 'Erupsi papuloskuamosa akut yang self-limiting, diduga berkaitan dengan reaktivasi virus herpes tipe 6/7.',
    diagnosis: ['Diawali herald patch (bercak soliter lebih besar) diikuti 1-2 minggu kemudian erupsi lesi oval lebih kecil dengan skuama halus di tepi (collarette), tersusun mengikuti garis kulit membentuk gambaran POHON CEMARA di punggung; wajib singkirkan sifilis sekunder'],
    tatalaksana: ['Umumnya sembuh spontan dalam 6-8 minggu — EDUKASI dan reassurance adalah terapi utama; emolien dan antihistamin untuk gatal, kortikosteroid topikal ringan bila perlu; hindari iritasi dan mandi air terlalu panas'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Akne vulgaris ringan': {
    definisi: 'Penyakit unit pilosebasea dengan komedo dan lesi inflamasi ringan, tanpa nodul atau jaringan parut bermakna.',
    diagnosis: ['Komedo terbuka (blackhead) dan tertutup (whitehead) dominan, dengan sedikit papul dan pustul, tanpa nodul/kista; predileksi wajah, dada, punggung'],
    tatalaksana: ['Retinoid topikal (tretinoin/adapalen) sebagai dasar untuk komedo, benzoil peroksida untuk lesi inflamasi, pembersih wajah lembut 2x/hari; edukasi jangan memencet lesi, gunakan pelembap dan tabir surya non-komedogenik, hasil terlihat setelah 6-8 minggu'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Akne vulgaris sedang-berat': {
    definisi: 'Akne dengan lesi inflamasi luas, nodul, atau kista yang berisiko meninggalkan jaringan parut permanen.',
    diagnosis: ['Papul dan pustul inflamasi banyak, disertai nodul/kista, dapat menimbulkan jaringan parut dan hiperpigmentasi pascainflamasi; nilai dampak psikososial'],
    tatalaksana: ['Kombinasi retinoid topikal + benzoil peroksida + antibiotik oral (doksisiklin) untuk sedang; isotretinoin oral pada akne berat/nodulokistik atau gagal terapi — WAJIB kontrasepsi ketat pada perempuan (sangat teratogenik) dan pantau fungsi hati dan lipid; hindari antibiotik tunggal jangka panjang (resistensi)'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Hidradenitis supuratif': {
    definisi: 'Penyakit inflamasi kronik folikel pada area kaya kelenjar apokrin dengan nodul nyeri, abses, sinus, dan jaringan parut berulang.',
    diagnosis: ['Nodul nyeri berulang di aksila, inguinal, perianal, dan inframama; berkembang menjadi abses, saluran sinus, dan jaringan parut tali; faktor risiko merokok dan obesitas'],
    tatalaksana: ['Berhenti merokok dan turunkan BB, hindari pakaian ketat dan bercukur pada area terkena; antibiotik topikal/oral (klindamisin, kombinasi rifampisin), kortikosteroid intralesi untuk nodul akut, biologik anti-TNF pada kasus sedang-berat, bedah untuk sinus dan jaringan parut menetap'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Dermatitis perioral': {
    definisi: 'Erupsi papulopustular di sekitar mulut, sering dipicu penggunaan kortikosteroid topikal di wajah.',
    diagnosis: ['Papul dan pustul kecil dengan eritema di sekitar mulut, khas MENYISAKAN zona sempit kulit normal tepat di batas bibir; riwayat pemakaian steroid topikal atau kortikosteroid inhalasi'],
    tatalaksana: ['HENTIKAN kortikosteroid topikal (waspadai flare rebound sementara dan edukasikan sejak awal), metronidazol atau eritromisin topikal, doksisiklin oral pada kasus berat, hindari kosmetik oklusif dan pasta gigi berfluorida tinggi bila dicurigai berperan'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Miliaria': {
    definisi: 'Biang keringat — retensi keringat akibat sumbatan duktus ekrin, umum di iklim panas dan lembap.',
    diagnosis: ['Miliaria kristalina: vesikel jernih superfisial tanpa eritema; Miliaria rubra: papul eritematosa gatal dan pedih; predileksi badan tertutup pakaian, leher, dan lipatan; sangat umum pada bayi'],
    tatalaksana: ['Dinginkan dan keringkan kulit, pakaian longgar menyerap keringat, hindari panas berlebih dan krim oklusif; losion calamine untuk gejala, kortikosteroid topikal ringan bila inflamasi berat'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Toxic epidermal necrolysis': {
    definisi: 'Reaksi obat berat dengan nekrosis dan pelepasan epidermis luas (>30% luas permukaan tubuh) — mengancam nyawa.',
    diagnosis: ['Riwayat obat pencetus 1-3 minggu sebelumnya (sulfonamid, antiepilepsi, allopurinol, NSAID), didahului gejala mirip flu, lalu makula purpurik nyeri yang meluas, tanda Nikolsky positif, keterlibatan mukosa multipel (mulut, mata, genital)'],
    tatalaksana: ['HENTIKAN SEGERA semua obat yang dicurigai (menentukan prognosis), rujuk unit luka bakar/ICU, resusitasi cairan dan elektrolit, perawatan luka steril, nutrisi, perawatan mata untuk cegah kebutaan; hitung skor SCORTEN untuk prognosis; hindari antibiotik profilaksis rutin'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Sindrom Stevens-Johnson': {
    definisi: 'Reaksi mukokutan berat akibat obat dengan pelepasan epidermis <10% luas permukaan tubuh — satu spektrum dengan TEN.',
    diagnosis: ['Lesi target atipik dan makula purpurik dengan pelepasan epidermis <10% LPT, keterlibatan minimal dua permukaan mukosa, tanda Nikolsky positif, didahului prodromal demam; riwayat obat pencetus'],
    tatalaksana: ['Hentikan obat penyebab segera, rawat inap dengan perawatan suportif intensif (cairan, nutrisi, perawatan luka dan mukosa), konsultasi oftalmologi dini; dokumentasikan alergi obat secara permanen di rekam medis dan berikan kartu alergi kepada pasien'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Urtikaria akut': {
    definisi: 'Erupsi bentol (wheal) gatal yang berlangsung kurang dari 6 minggu, akibat pelepasan histamin dari sel mast.',
    diagnosis: ['Bentol eritematosa dengan tepi meninggi dan pusat pucat, sangat gatal, INDIVIDUAL LESI HILANG <24 JAM tanpa bekas (bila menetap >24 jam atau meninggalkan bekas, curigai urtikaria vaskulitis); cari pemicu: obat, makanan, infeksi, gigitan serangga'],
    tatalaksana: ['Antihistamin H1 non-sedatif dosis standar, dapat dinaikkan hingga 4x dosis bila perlu; hindari pemicu yang teridentifikasi dan NSAID; kortikosteroid sistemik jangka pendek pada kasus berat; waspadai tanda anafilaksis (sesak, hipotensi) yang memerlukan epinefrin'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'WAO2020'],
  },
  'Urtikaria kronis': {
    definisi: 'Urtikaria yang berlangsung lebih dari 6 minggu, sebagian besar bersifat spontan/idiopatik.',
    diagnosis: ['Bentol berulang hampir setiap hari >6 minggu; sebagian besar tidak ditemukan penyebab spesifik — pemeriksaan penunjang ekstensif umumnya TIDAK bermanfaat; skrining terarah bila ada gejala penyakit sistemik; nilai urtikaria fisik (dermografisme, kolinergik)'],
    tatalaksana: ['Antihistamin H1 non-sedatif rutin (bukan hanya saat gejala), naikkan hingga 4x dosis bila belum terkontrol, tambahkan omalizumab pada kasus refrakter; edukasi bahwa kondisi umumnya jinak dan sering remisi spontan dalam 1-5 tahun; hindari steroid sistemik jangka panjang'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'WAO2020'],
  },
  'Angioedema': {
    definisi: 'Pembengkakan dermis dalam, subkutis, atau submukosa; dapat histaminergik (menyertai urtikaria) atau bradikinin-mediated (herediter/akibat ACE-inhibitor).',
    diagnosis: ['Pembengkakan asimetris pada bibir, kelopak mata, lidah, atau genital, rasa tegang lebih dominan daripada gatal; BAHAYA bila mengenai lidah/laring (obstruksi jalan napas); tanyakan pemakaian ACE-inhibitor dan riwayat keluarga (angioedema herediter)'],
    tatalaksana: ['Nilai dan amankan jalan napas sebagai prioritas; histaminergik: epinefrin IM bila mengancam jalan napas, antihistamin dan kortikosteroid; bradikinin-mediated: TIDAK RESPONS terhadap epinefrin/antihistamin/steroid — perlu ikatibant atau konsentrat C1-inhibitor, dan hentikan ACE-inhibitor permanen'],
    referensi: ['SKDI2012', 'WAO2020', 'PERDOSKI2021'],
  },
  'Lupus eritematosis kulit': {
    definisi: 'Manifestasi kulit lupus eritematosus, dapat terbatas pada kulit (diskoid) atau bagian dari penyakit sistemik.',
    diagnosis: ['Diskoid: plak eritematosa berskuama dengan sumbatan folikel, atrofi sentral, dan jaringan parut serta alopesia permanen; ruam malar pada lupus sistemik; fotosensitif; biopsi dan skrining ANA untuk menilai keterlibatan sistemik'],
    tatalaksana: ['PROTEKSI SINAR MATAHARI ketat (tabir surya spektrum luas, pakaian tertutup) sebagai dasar, kortikosteroid topikal/intralesi, hidroksiklorokuin untuk penyakit luas atau rekuren; berhenti merokok (mengurangi respons antimalaria); evaluasi berkala keterlibatan sistemik'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Ichthyosis vulgaris': {
    definisi: 'Kelainan keratinisasi genetik tersering, ditandai kulit kering dengan skuama halus seperti sisik ikan.',
    diagnosis: ['Kulit kering dengan skuama halus keputihan terutama pada ekstensor tungkai, MENYISAKAN area lipatan; hiperlinearitas palmar dan keratosis pilaris; sering menyertai atopi; memberat saat cuaca dingin dan kering'],
    tatalaksana: ['Emolien intensif dan rutin sebagai terapi utama (idealnya segera setelah mandi), keratolitik (urea, asam laktat, asam salisilat) untuk mengurangi skuama, mandi air hangat singkat dengan pembersih lembut, hindari sabun keras'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Exanthematous drug eruption, fixed drug eruption': {
    definisi: 'Erupsi obat; eksantematosa berupa ruam morbiliform generalisata, fixed drug eruption berupa lesi berulang di lokasi yang sama setiap paparan obat.',
    diagnosis: ['Eksantematosa: ruam makulopapular simetris muncul 4-14 hari setelah obat baru, gatal, tanpa keterlibatan mukosa berat; FDE: makula/plak eritematosa keunguan berbatas tegas yang selalu muncul di lokasi sama, sembuh dengan hiperpigmentasi menetap'],
    tatalaksana: ['Hentikan obat penyebab, kortikosteroid topikal dan antihistamin, kortikosteroid sistemik bila luas; WASPADAI tanda erupsi obat berat (keterlibatan mukosa, Nikolsky positif, lepuh, demam tinggi, edema wajah, eosinofilia) yang menandakan SJS/TEN atau DRESS; dokumentasikan alergi obat dan berikan kartu alergi'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Vitiligo': {
    definisi: 'Depigmentasi kulit didapat akibat destruksi melanosit, umumnya berdasar autoimun.',
    diagnosis: ['Makula depigmentasi (putih susu) berbatas tegas, sering simetris pada area periorifisial, ekstensor, dan tangan; lampu Wood mempertegas batas; skrining penyakit autoimun penyerta terutama tiroid'],
    tatalaksana: ['Kortikosteroid topikal atau inhibitor kalsineurin topikal pada lesi terbatas, fototerapi NB-UVB untuk lesi luas, tabir surya (kulit depigmentasi sangat rentan terbakar) dan kamuflase kosmetik; dukungan psikologis penting karena dampak psikososial besar'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Albino': {
    definisi: 'Albinisme — kelainan genetik sintesis melanin yang menyebabkan hipopigmentasi kulit, rambut, dan mata sejak lahir.',
    diagnosis: ['Kulit dan rambut sangat terang sejak lahir, iris translusen, nistagmus, penurunan tajam penglihatan dan fotofobia; bedakan dari vitiligo yang bersifat didapat dan terlokalisasi'],
    tatalaksana: ['PROTEKSI matahari seumur hidup (tabir surya SPF tinggi, pakaian tertutup, topi) karena risiko kanker kulit sangat tinggi, skrining kulit berkala, koreksi refraksi dan alat bantu penglihatan, dukungan psikososial dan konseling genetik'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Hiperpigmentasi pascainflamasi': {
    definisi: 'Peningkatan pigmen kulit setelah proses inflamasi atau cedera kulit, lebih sering pada kulit berwarna gelap.',
    diagnosis: ['Makula cokelat hingga kehitaman pada lokasi bekas lesi inflamasi sebelumnya (akne, dermatitis, trauma), tanpa tanda inflamasi aktif'],
    tatalaksana: ['ATASI inflamasi yang mendasari lebih dahulu, tabir susun rutin (paparan UV memperberat), agen pencerah (hidrokuinon, asam azelaik, retinoid topikal); EDUKASI bahwa perbaikan memerlukan waktu berbulan-bulan dan bersifat bertahap'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Hipopigmentasi pascainflamasi': {
    definisi: 'Berkurangnya pigmen kulit setelah proses inflamasi, umumnya bersifat sementara.',
    diagnosis: ['Makula lebih terang dari kulit sekitar pada lokasi bekas inflamasi, batas sering tidak setegas vitiligo dan tidak sepenuhnya depigmentasi; pitiriasis alba merupakan bentuk umum pada anak atopik'],
    tatalaksana: ['Umumnya membaik spontan seiring waktu — reassurance, atasi penyakit kulit yang mendasari, emolien, tabir surya untuk mencegah kontras warna makin mencolok'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Keratosis seboroik': {
    definisi: 'Tumor jinak epidermis yang sangat umum pada usia pertengahan dan lanjut.',
    diagnosis: ['Papul/plak berwarna cokelat hingga hitam dengan permukaan berminyak dan verukosa, tampak "menempel" di permukaan kulit (stuck-on appearance); dermoskopi menunjukkan kista milia dan comedo-like opening'],
    tatalaksana: ['Tidak perlu terapi (jinak) — edukasi dan reassurance; krioterapi, kuretase, atau elektrokauter bila mengganggu kosmetik atau teriritasi; biopsi bila gambaran atipik untuk menyingkirkan melanoma'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Kista epitel': {
    definisi: 'Kista epidermoid — kista berdinding epitel berisi keratin, umumnya di kulit kepala, wajah, leher, dan punggung.',
    diagnosis: ['Nodul subkutan mobile berbatas tegas dengan punctum sentral, isi material putih berbau bila dipencet; dapat mengalami inflamasi atau infeksi sekunder'],
    tatalaksana: ['Observasi bila asimtomatik; eksisi komplet TERMASUK DINDING KISTA untuk cegah rekurensi (dilakukan saat tenang, bukan saat inflamasi akut); insisi drainase dan antibiotik dahulu bila terinfeksi, eksisi definitif setelah reda'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'SCHWARTZ2019'],
  },
  'Squamous cell carcinoma (Karsinoma sel skuamosa)': {
    definisi: 'Keganasan keratinosit epidermis, kanker kulit tersering kedua, dengan potensi metastasis lebih tinggi dari karsinoma sel basal.',
    diagnosis: ['Nodul atau plak hiperkeratotik yang mudah berdarah dan tidak sembuh, dapat berulserasi; sering pada area terpapar matahari kronik, bekas luka bakar, atau ulkus kronik (ulkus Marjolin); biopsi konfirmatif'],
    tatalaksana: ['Eksisi bedah dengan tepi bebas tumor adekuat sebagai terapi utama, bedah Mohs pada area kosmetik/risiko tinggi, radioterapi pada pasien bukan kandidat bedah; evaluasi kelenjar getah bening regional; edukasi proteksi matahari dan surveilans lesi baru'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Basal cell carcinoma (Karsinoma sel basal)': {
    definisi: 'Kanker kulit tersering, berasal dari sel basal epidermis, tumbuh lambat dan sangat jarang bermetastasis namun destruktif lokal.',
    diagnosis: ['Papul/nodul mengkilat seperti mutiara (pearly) dengan telangiektasis di permukaan, dapat berulserasi dengan tepi meninggi (rodent ulcer); predileksi wajah bagian atas dan hidung; biopsi konfirmatif'],
    tatalaksana: ['Eksisi bedah dengan tepi adekuat, bedah Mohs untuk lesi wajah/rekuren/batas tidak tegas, krioterapi atau terapi topikal pada lesi superfisial tertentu; edukasi proteksi matahari dan pemeriksaan kulit berkala seumur hidup'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Xanthoma': {
    definisi: 'Deposit lipid dalam kulit dan tendon, sering menjadi penanda gangguan lipid yang mendasari.',
    diagnosis: ['Papul/plak/nodul kekuningan; xanthelasma di kelopak mata, xanthoma tendon di tendon Achilles dan ekstensor jari (sangat sugestif hiperkolesterolemia familial), xanthoma eruptif pada hipertrigliseridemia berat; WAJIB periksa profil lipid'],
    tatalaksana: ['Fokus pada tatalaksana dislipidemia yang mendasari (statin/fibrat sesuai jenis) dan skrining risiko kardiovaskular; eksisi atau terapi lokal hanya untuk alasan kosmetik'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PAPDI2014'],
  },
  'Hemangioma': {
    definisi: 'Tumor vaskular jinak, tersering hemangioma infantil yang tumbuh cepat pada tahun pertama lalu mengalami involusi spontan.',
    diagnosis: ['Lesi vaskular merah terang menonjol yang muncul minggu-minggu pertama kehidupan, membesar hingga usia 6-12 bulan lalu memudar bertahap; nilai lokasi berisiko (periokular, jalan napas, segmental wajah) yang memerlukan intervensi'],
    tatalaksana: ['Observasi pada mayoritas kasus karena involusi spontan; propranolol oral sebagai terapi lini pertama bila mengancam fungsi (penglihatan, jalan napas), ulserasi, atau risiko deformitas; rujuk untuk lesi berisiko tinggi'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Lentigo': {
    definisi: 'Makula hiperpigmentasi akibat peningkatan jumlah melanosit, umumnya terkait paparan sinar matahari kronik (lentigo solaris).',
    diagnosis: ['Makula cokelat berbatas tegas, warna homogen, pada area terpapar matahari (wajah, punggung tangan); TIDAK memudar saat tidak terpapar matahari (berbeda dari efelid/freckles); lentigo maligna bila tumbuh, warna heterogen, tepi ireguler — perlu biopsi'],
    tatalaksana: ['Jinak dan tidak perlu terapi; tabir surya untuk cegah lesi baru, krioterapi/laser untuk alasan kosmetik; biopsi bila ada tanda perubahan atipik'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Nevus pigmentosus': {
    definisi: 'Tahi lalat — proliferasi jinak sel nevus melanositik.',
    diagnosis: ['Makula atau papul berpigmen dengan warna homogen, batas teratur, ukuran umumnya <6 mm dan stabil; terapkan ABCDE untuk skrining transformasi: Asymmetry, Border irregular, Color variegated, Diameter >6 mm, Evolving'],
    tatalaksana: ['Observasi dan edukasi pemeriksaan kulit mandiri; eksisi dan pemeriksaan histopatologi bila ada tanda ABCDE, perubahan cepat, gatal, atau perdarahan; hindari kauterisasi tanpa histopatologi pada lesi mencurigakan'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Melanoma maligna': {
    definisi: 'Keganasan melanosit, kanker kulit dengan mortalitas tertinggi karena kecenderungan metastasis dini.',
    diagnosis: ['Lesi berpigmen dengan tanda ABCDE atau ugly duckling sign; pada populasi Asia sering tipe akral lentiginosa (telapak kaki, telapak tangan, subungual — tanda Hutchinson pada kuku); BIOPSI EKSISIONAL untuk diagnosis dan pengukuran ketebalan Breslow'],
    tatalaksana: ['Eksisi luas dengan tepi sesuai ketebalan Breslow, biopsi kelenjar getah bening sentinel pada indikasi, imunoterapi/terapi target pada penyakit lanjut; rujuk onkologi segera; edukasi proteksi matahari dan surveilans seumur hidup — JANGAN kauterisasi/laser lesi berpigmen mencurigakan tanpa histopatologi'],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PERDOSKI2021'],
  },
  'Alopesia areata': {
    definisi: 'Kerontokan rambut berbatas tegas akibat serangan autoimun pada folikel rambut.',
    diagnosis: ['Bercak botak bulat/oval berbatas tegas dengan kulit kepala normal (tanpa skuama atau jaringan parut), ditemukan exclamation mark hair di tepi lesi; nail pitting dapat menyertai; skrining penyakit autoimun terkait (tiroid)'],
    tatalaksana: ['Banyak kasus mengalami regrowth spontan; kortikosteroid topikal atau intralesi pada lesi terbatas, imunoterapi topikal atau terapi sistemik pada kasus luas; dukungan psikologis dan opsi kamuflase (wig) karena dampak psikososial'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Alopesia androgenik': {
    definisi: 'Kerontokan rambut berpola akibat pengaruh androgen pada folikel yang tersensitisasi secara genetik.',
    diagnosis: ['Pria: kemunduran garis rambut frontotemporal dan penipisan verteks (pola Hamilton-Norwood); Wanita: penipisan difus pada verteks dengan garis rambut frontal terjaga (pola Ludwig); rambut menipis (miniaturisasi), tanpa jaringan parut; pada wanita dengan tanda hiperandrogenisme skrining PCOS'],
    tatalaksana: ['Minoksidil topikal untuk pria dan wanita, finasterid oral pada pria (KONTRAINDIKASI pada wanita usia subur — teratogenik), transplantasi rambut pada kasus terpilih; edukasi bahwa terapi harus berkelanjutan karena efek hilang bila dihentikan'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Telogen eflluvium': {
    definisi: 'Kerontokan rambut difus akibat pergeseran folikel secara serentak ke fase telogen setelah stresor fisiologis.',
    diagnosis: ['Kerontokan difus 2-4 BULAN setelah pencetus (melahirkan, demam tinggi, operasi, penurunan BB drastis, stres berat, obat); hair pull test positif; kulit kepala normal tanpa bercak botak berbatas tegas; periksa feritin, tiroid, dan status gizi'],
    tatalaksana: ['REASSURANCE adalah terapi utama — umumnya reversibel dan rambut tumbuh kembali dalam 6-12 bulan setelah pencetus diatasi; koreksi defisiensi besi dan gangguan tiroid, perbaiki nutrisi, kelola stres'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Vulnus laseratum, punctum': {
    definisi: 'Luka robek akibat trauma tumpul (laseratum) dan luka tusuk akibat benda runcing (punctum).',
    diagnosis: ['Nilai mekanisme, waktu kejadian (golden period), kedalaman, kontaminasi, benda asing, dan cedera struktur di bawahnya (tendon, saraf, pembuluh darah); periksa status neurovaskular distal dan riwayat imunisasi tetanus'],
    tatalaksana: ['Kontrol perdarahan dengan penekanan, anestesi lokal, irigasi dengan NaCl 0,9% bertekanan, debridement jaringan mati, penjahitan primer bila luka bersih dan <6-8 jam (luka kotor/terlambat dibiarkan terbuka atau jahit primer tertunda); profilaksis tetanus sesuai status imunisasi, antibiotik pada luka terkontaminasi'],
    referensi: ['SKDI2012', 'ATLS2018', 'PPKFKTP2014'],
  },
  'Vulnus perforatum, penetratum': {
    definisi: 'Luka tembus yang menembus rongga tubuh (perforatum) atau menembus jaringan hingga kedalaman tertentu (penetratum).',
    diagnosis: ['Nilai jalur dan kedalaman luka serta organ yang mungkin terkena; JANGAN mencabut benda asing yang masih tertancap (dapat memicu perdarahan masif) — stabilkan di tempat; pencitraan sesuai lokasi (rontgen, CT, FAST)'],
    tatalaksana: ['Tatalaksana ATLS: amankan ABC, resusitasi cairan/darah, kontrol perdarahan; rujuk bedah segera untuk eksplorasi; profilaksis tetanus dan antibiotik; luka tembus toraks terbuka ditutup dengan kasa tiga sisi (three-sided dressing)'],
    referensi: ['SKDI2012', 'ATLS2018', 'SCHWARTZ2019'],
  },
  'Luka bakar derajat 1 dan 2': {
    definisi: 'Luka bakar superfisial (derajat 1, epidermis) dan sebagian ketebalan (derajat 2, mengenai dermis).',
    diagnosis: ['Derajat 1: eritema nyeri tanpa bula, sembuh tanpa jaringan parut; Derajat 2 superfisial: bula, dasar merah basah, SANGAT NYERI, capillary refill positif; hitung luas dengan rule of nine (atau telapak tangan pasien ≈1%); derajat 1 TIDAK dihitung dalam estimasi luas untuk resusitasi cairan'],
    tatalaksana: ['Dinginkan dengan air mengalir suhu ruang 20 menit (JANGAN es, odol, atau kecap), analgesia adekuat, tutup dengan dressing steril non-adheren, bula besar dirawat sesuai protokol; resusitasi cairan formula Parkland bila luas (>10% anak, >15-20% dewasa); profilaksis tetanus; rujuk bila luas, mengenai wajah/tangan/genital/persendian, atau melingkar'],
    referensi: ['SKDI2012', 'ATLS2018', 'SCHWARTZ2019'],
  },
  'Luka bakar derajat 3 dan 4': {
    definisi: 'Luka bakar ketebalan penuh (derajat 3, seluruh dermis) dan yang mengenai struktur di bawahnya seperti otot dan tulang (derajat 4).',
    diagnosis: ['Kulit tampak putih pucat, cokelat, atau hangus (eskar), kering dan kaku, TIDAK NYERI karena ujung saraf rusak, capillary refill negatif; nilai tanda cedera inhalasi (bulu hidung terbakar, sputum jelaga, suara serak, luka bakar wajah) yang memerlukan intubasi dini'],
    tatalaksana: ['AMANKAN JALAN NAPAS dini bila curiga cedera inhalasi (edema berkembang cepat), resusitasi cairan formula Parkland dengan pemantauan produksi urin, analgesia, jaga suhu tubuh; ESKAROTOMI bila luka bakar melingkar mengganggu perfusi distal atau pengembangan dada; rujuk pusat luka bakar — memerlukan eksisi dan skin graft'],
    referensi: ['SKDI2012', 'ATLS2018', 'SCHWARTZ2019'],
  },
  'Luka akibat bahan kimia': {
    definisi: 'Cedera jaringan akibat kontak bahan kimia korosif; basa menyebabkan nekrosis likuefaksi (lebih dalam dan progresif), asam menyebabkan nekrosis koagulasi.',
    diagnosis: ['Riwayat paparan zat kimia — identifikasi jenis dan konsentrasi bila mungkin; nilai luas, kedalaman, dan keterlibatan mata; kerusakan dapat terus berlanjut selama zat masih kontak dengan kulit'],
    tatalaksana: ['IRIGASI segera dan lama dengan air mengalir (minimal 20-30 menit, lebih lama untuk basa), lepaskan pakaian dan perhiasan terkontaminasi, sikat bubuk kering sebelum irigasi; JANGAN menetralkan dengan zat lawan (reaksi eksotermik memperburuk); irigasi mata segera dan rujuk oftalmologi; gunakan alat pelindung diri saat menolong'],
    referensi: ['SKDI2012', 'ATLS2018', 'SCHWARTZ2019'],
  },
  'Luka akibat sengatan listrik': {
    definisi: 'Cedera akibat aliran listrik melalui tubuh; kerusakan jaringan dalam sering jauh lebih luas daripada tampilan luka di permukaan.',
    diagnosis: ['Cari titik masuk dan keluar arus, nilai jalur arus yang mungkin melewati jantung; EKG dan pemantauan aritmia, periksa mioglobinuria dan kreatin kinase (rhabdomiolisis), waspada sindrom kompartemen dan fraktur akibat kontraksi otot tetanik atau terjatuh'],
    tatalaksana: ['AMANKAN sumber listrik sebelum menyentuh korban, RJP bila henti jantung, pemantauan EKG; resusitasi cairan agresif dengan target produksi urin lebih tinggi bila rhabdomiolisis untuk cegah gagal ginjal akut; fasciotomi bila sindrom kompartemen; rujuk pusat luka bakar'],
    referensi: ['SKDI2012', 'ATLS2018', 'SCHWARTZ2019'],
  },

  // ─── Indera ──────────────────────────────────────────────────────────────
  'Benda asing di konjungtiva': {
    definisi: 'Partikel asing yang menempel pada konjungtiva, sering di forniks atau di bawah kelopak mata atas.',
    diagnosis: ['Rasa mengganjal, mata merah, berair, blefarospasme; WAJIB eversi kelopak mata atas untuk mencari benda asing tersembunyi; nilai tajam penglihatan dan singkirkan trauma tembus'],
    tatalaksana: ['Anestesi topikal, irigasi atau angkat dengan lidi kapas basah/jarum tumpul, antibiotik topikal setelahnya; rujuk bila benda asing menempel di kornea, tertanam dalam, atau curiga penetrasi bola mata'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Pterigium': {
    definisi: 'Pertumbuhan jaringan fibrovaskular konjungtiva berbentuk segitiga yang menjalar ke kornea, terkait paparan UV kronik.',
    diagnosis: ['Jaringan berbentuk sayap dari konjungtiva nasal menuju kornea, dapat menimbulkan iritasi dan astigmatisme; nilai apakah sudah melewati batas pupil (mengganggu penglihatan)'],
    tatalaksana: ['Air mata buatan untuk iritasi, kacamata pelindung UV; eksisi bedah dengan cangkok konjungtiva bila mengganggu penglihatan, astigmatisme bermakna, atau kosmetik — rekurensi pasca operasi cukup sering'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Perdarahan subkonjungtiva': {
    definisi: 'Perdarahan di bawah konjungtiva akibat pecahnya pembuluh darah kecil, umumnya jinak.',
    diagnosis: ['Bercak merah homogen berbatas tegas pada sklera TANPA nyeri, tanpa gangguan penglihatan, tanpa sekret; cari pemicu (batuk, mengejan, hipertensi, antikoagulan, trauma); bila akibat trauma tumpul berat, singkirkan ruptur bola mata'],
    tatalaksana: ['Tidak perlu terapi — REASSURANCE bahwa darah akan diserap dalam 1-3 minggu dengan perubahan warna seperti memar; periksa tekanan darah, evaluasi bila rekuren; kompres dingin hari pertama bila akibat trauma'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Mata kering': {
    definisi: 'Dry eye disease — gangguan film air mata akibat produksi kurang atau evaporasi berlebihan.',
    diagnosis: ['Rasa berpasir, perih, terbakar, mata lelah, kadang justru berair berlebihan (refleks); uji Schirmer menurun, tear break-up time memendek; cari faktor: usia, layar, lensa kontak, obat antikolinergik, sindrom Sjögren'],
    tatalaksana: ['Air mata buatan (preservative-free bila sering dipakai), kompres hangat dan pembersihan kelopak bila disfungsi kelenjar Meibom, aturan 20-20-20 saat kerja layar, hindari AC/kipas langsung ke wajah; siklosporin topikal pada kasus sedang-berat; evaluasi penyakit autoimun bila disertai mulut kering'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Chalazion': {
    definisi: 'Peradangan granulomatosa kronik kelenjar Meibom akibat sumbatan, bukan infeksi akut.',
    diagnosis: ['Benjolan kelopak mata yang keras, berbatas tegas, TIDAK NYERI (membedakan dari hordeolum yang nyeri dan akut), tumbuh perlahan; chalazion rekuren di lokasi sama pada lansia perlu biopsi untuk singkirkan karsinoma kelenjar sebasea'],
    tatalaksana: ['Kompres hangat 10-15 menit beberapa kali sehari dengan pijatan lembut sebagai terapi awal, higiene kelopak; injeksi kortikosteroid intralesi atau insisi dan kuretase bila menetap >beberapa minggu atau mengganggu penglihatan'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Laserasi kelopak mata': {
    definisi: 'Luka robek pada kelopak mata akibat trauma, berpotensi melibatkan margo palpebra dan sistem lakrimal.',
    diagnosis: ['Nilai apakah laserasi melibatkan margo palpebra, kanalikuli lakrimal (laserasi medial), atau otot levator (ptosis); WAJIB singkirkan cedera bola mata di baliknya dan benda asing; periksa tajam penglihatan'],
    tatalaksana: ['Irigasi dan bersihkan luka, tutup steril, profilaksis tetanus dan antibiotik; RUJUK oftalmologi untuk laserasi yang melibatkan margo, kanalikuli, levator, atau bila ada cedera bola mata — penjahitan yang tidak tepat menyebabkan deformitas dan epifora permanen'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ATLS2018'],
  },
  'Entropion': {
    definisi: 'Terlipatnya margo palpebra ke arah dalam sehingga bulu mata menggesek permukaan bola mata.',
    diagnosis: ['Kelopak (umumnya bawah) terlipat ke dalam, iritasi kronik, mata merah dan berair; periksa kornea dengan fluoresein untuk erosi akibat gesekan bulu mata; penyebab tersering involusional (usia) atau sikatrisial (trakoma, luka bakar kimia)'],
    tatalaksana: ['Lubrikan dan pelindung kornea sementara, plester untuk menarik kelopak keluar sebagai tindakan darurat; koreksi bedah adalah terapi definitif untuk cegah kerusakan kornea permanen'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Trikiasis': {
    definisi: 'Tumbuhnya bulu mata ke arah dalam sehingga menggesek kornea dan konjungtiva, dengan posisi kelopak normal.',
    diagnosis: ['Rasa mengganjal, mata merah dan berair kronik; tampak bulu mata mengarah ke bola mata; fluoresein menunjukkan erosi kornea; komplikasi trakoma merupakan penyebab penting di daerah endemis'],
    tatalaksana: ['Epilasi (mencabut bulu mata) sebagai tindakan sementara karena akan tumbuh kembali, terapi definitif dengan elektrolisis, krioterapi, atau bedah; lubrikan dan antibiotik topikal bila ada erosi kornea'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Lagoftalmus': {
    definisi: 'Ketidakmampuan menutup kelopak mata sempurna, menyebabkan kornea terpapar dan berisiko keratitis eksposur.',
    diagnosis: ['Celah tetap terbuka saat mata dipejamkan, mata kering dan merah, erosi kornea bagian bawah; cari penyebab: Bell palsy dan lesi N. fasialis lain, proptosis, sikatriks kelopak, lepra'],
    tatalaksana: ['PROTEKSI KORNEA adalah prioritas: air mata buatan sering, salep mata dan penutup/plester kelopak saat tidur, moisture chamber; atasi penyebab dasar; tarsorafi bila lagoftalmus berat atau berkepanjangan'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PERDOSSI2016'],
  },
  'Epikantus': {
    definisi: 'Lipatan kulit vertikal pada kantus medial yang menutupi sebagian sklera nasal, umum pada ras Asia dan pada anak kecil.',
    diagnosis: ['Lipatan kulit di sudut mata dalam; dapat menimbulkan PSEUDOSTRABISMUS (tampak juling padahal refleks cahaya kornea simetris) — bedakan dengan uji Hirschberg dan cover test'],
    tatalaksana: ['Umumnya varian normal yang berkurang seiring pertumbuhan batang hidung — reassurance; koreksi bedah hanya untuk indikasi kosmetik atau bila bagian dari sindrom; pastikan tidak melewatkan strabismus sejati yang memerlukan terapi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Ptosis': {
    definisi: 'Turunnya kelopak mata atas akibat gangguan otot levator palpebra atau persarafannya.',
    diagnosis: ['Kelopak atas menutupi sebagian pupil, nilai fungsi levator dan derajat ptosis; cari penyebab: kongenital, involusional, lesi N. III (disertai pupil dilatasi dan mata deviasi — kedaruratan, curigai aneurisma), sindrom Horner (ptosis ringan + miosis), miastenia gravis (fatigable, memburuk sore hari)'],
    tatalaksana: ['Atasi penyebab dasar; ptosis kongenital berat pada anak memerlukan koreksi bedah dini untuk CEGAH AMBLIOPIA; ptosis dengan pupil terlibat atau onset akut memerlukan pencitraan segera'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ADAMS2019'],
  },
  'Retraksi kelopak mata': {
    definisi: 'Posisi kelopak mata yang tertarik sehingga sklera tampak di atas limbus, khas pada orbitopati tiroid.',
    diagnosis: ['Tampak sklera di atas kornea (Dalrymple sign), lid lag saat melihat ke bawah (von Graefe sign); periksa fungsi tiroid; nilai risiko keratitis eksposur dan neuropati optik kompresif pada orbitopati Graves'],
    tatalaksana: ['Atasi disfungsi tiroid, lubrikan untuk proteksi kornea, berhenti merokok (memperburuk orbitopati Graves); kortikosteroid atau dekompresi orbita pada penyakit aktif berat; koreksi bedah kelopak setelah penyakit stabil'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ATA2016'],
  },
  'Dakriostenosis': {
    definisi: 'Sumbatan duktus nasolakrimalis yang menghambat aliran air mata ke rongga hidung.',
    diagnosis: ['Epifora (mata berair terus) dan sekret sejak bayi (kongenital, tersering akibat membran Hasner belum terbuka); tekanan pada sakus lakrimal mengeluarkan sekret; bedakan dari dakriosistitis akut (nyeri, bengkak, merah di kantus medial)'],
    tatalaksana: ['Bayi: pijat sakus lakrimal (Crigler) beberapa kali sehari dan bersihkan sekret — sebagian besar membuka spontan sebelum usia 12 bulan; probing bila menetap setelah usia tersebut; antibiotik bila ada infeksi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Laserasi duktus lakrimal': {
    definisi: 'Robekan sistem drainase air mata akibat trauma, umumnya pada laserasi kelopak bagian medial.',
    diagnosis: ['Laserasi di area kantus medial — SELALU curigai keterlibatan kanalikuli pada luka di sepertiga medial kelopak; probing kanalikuli untuk memastikan'],
    tatalaksana: ['RUJUK oftalmologi untuk repair kanalikuli dengan pemasangan stent dalam 24-48 jam — perbaikan yang terlambat atau tidak dilakukan menyebabkan epifora permanen; profilaksis tetanus dan antibiotik'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ATLS2018'],
  },
  'Erosi': {
    definisi: 'Erosi kornea — hilangnya lapisan epitel kornea akibat trauma, benda asing, atau lensa kontak.',
    diagnosis: ['Nyeri hebat, fotofobia, berair, sensasi benda asing; PEWARNAAN FLUORESEIN menunjukkan defek epitel yang menyala hijau di bawah cahaya biru; nilai tajam penglihatan dan cari benda asing di bawah kelopak'],
    tatalaksana: ['Antibiotik topikal profilaksis, sikloplegik untuk nyeri bila berat, analgesia oral; JANGAN memberikan anestesi topikal untuk dipakai di rumah (menghambat penyembuhan dan menutupi kerusakan) dan JANGAN menutup mata pada erosi terkait lensa kontak; evaluasi ulang 24 jam — rujuk bila tidak membaik atau ada infiltrat'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Benda asing di kornea': {
    definisi: 'Partikel asing yang menempel atau tertanam pada kornea.',
    diagnosis: ['Nyeri, fotofobia, berair, riwayat mengelas atau menggerinda tanpa pelindung; tampak benda asing pada kornea, dapat disertai rust ring bila logam; WAJIB singkirkan penetrasi intraokular (uji Seidel) terutama pada trauma kecepatan tinggi'],
    tatalaksana: ['Anestesi topikal lalu pengangkatan hati-hati dengan jarum tumpul/spud di bawah pembesaran, antibiotik topikal dan evaluasi 24 jam; RUJUK bila benda asing di aksis visual, dalam, tidak dapat diangkat, ada rust ring, atau curiga penetrasi intraokular'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Luka bakar kornea': {
    definisi: 'Cedera kornea akibat bahan kimia, panas, atau radiasi UV; luka bakar basa lebih berbahaya karena penetrasi dalam.',
    diagnosis: ['Nyeri hebat, penurunan penglihatan, mata merah; tanda prognosis buruk: kornea keruh dan iskemia limbus (konjungtiva tampak pucat, bukan merah); periksa pH forniks; keratitis fotoelektrik (las) menimbulkan nyeri hebat 6-12 jam pasca paparan'],
    tatalaksana: ['IRIGASI SEGERA dan lama dengan NaCl 0,9% atau air bersih minimal 30 menit SEBELUM pemeriksaan lain — ini menentukan prognosis; angkat partikel dari forniks, periksa pH hingga netral; antibiotik dan sikloplegik topikal; RUJUK segera semua luka bakar kimia'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Edema kornea': {
    definisi: 'Penumpukan cairan pada stroma kornea akibat disfungsi endotel atau tekanan intraokular tinggi.',
    diagnosis: ['Penglihatan kabur terutama pagi hari, halo di sekitar cahaya, kornea tampak keruh/keabuan; cari penyebab: glaukoma akut, distrofi endotel Fuchs, pasca operasi katarak, uveitis'],
    tatalaksana: ['Atasi penyebab dasar (turunkan tekanan intraokular bila glaukoma), larutan hipertonik NaCl 5% topikal untuk menarik cairan, lensa kontak perban bila bulla nyeri; keratoplasti endotel pada kasus berat menetap'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Keratokonus': {
    definisi: 'Penipisan progresif kornea sentral yang menyebabkan penonjolan berbentuk kerucut dan astigmatisme ireguler.',
    diagnosis: ['Penglihatan kabur progresif dengan astigmatisme ireguler yang sering berubah dan sulit dikoreksi kacamata, onset remaja/dewasa muda; tanda Munson (indentasi kelopak bawah saat melihat ke bawah); topografi kornea sebagai baku emas; sering dikaitkan dengan mengucek mata dan atopi'],
    tatalaksana: ['EDUKASI JANGAN MENGUCEK MATA (mempercepat progresi), lensa kontak rigid untuk koreksi optik, corneal cross-linking untuk menghentikan progresi pada penyakit aktif, keratoplasti pada stadium lanjut'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Xerophtalmia': {
    definisi: 'Kelainan mata akibat defisiensi vitamin A, penyebab kebutaan anak yang dapat dicegah.',
    diagnosis: ['Spektrum: buta senja (XN, gejala paling awal), bercak Bitot (X1B), xerosis konjungtiva dan kornea, ulkus kornea, hingga keratomalasia (X3B); nilai status gizi dan riwayat campak/diare berulang'],
    tatalaksana: ['VITAMIN A dosis tinggi segera sesuai usia pada hari ke-1, ke-2, dan minggu ke-2; perbaiki gizi dan atasi penyakit penyerta, antibiotik topikal bila ada lesi kornea; PENCEGAHAN melalui suplementasi vitamin A rutin pada balita (kapsul biru dan merah) dan edukasi gizi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Endoftalmitis': {
    definisi: 'Infeksi berat pada rongga intraokular yang mengancam penglihatan.',
    diagnosis: ['Nyeri hebat, penurunan tajam penglihatan drastis, mata merah, hipopion, media keruh; riwayat operasi mata baru, trauma tembus, atau infeksi sistemik (endogen); KEDARURATAN OFTALMOLOGI'],
    tatalaksana: ['RUJUK SEGERA — antibiotik intravitreal adalah terapi utama, dapat disertai vitrektomi; jangan menunda karena kehilangan penglihatan permanen terjadi dalam hitungan jam-hari; antibiotik sistemik pada kasus endogen'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Mikroftalmos': {
    definisi: 'Kelainan kongenital berupa bola mata berukuran lebih kecil dari normal.',
    diagnosis: ['Bola mata kecil sejak lahir, dapat unilateral atau bilateral, sering disertai kelainan okular lain (katarak, koloboma) atau sindrom sistemik; USG untuk mengukur panjang aksial'],
    tatalaksana: ['Rujuk oftalmologi pediatrik; optimalkan penglihatan mata yang lebih baik dan cegah ambliopia, prostesis/konformer untuk pertumbuhan orbita yang simetris, konseling genetik'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Hipopion': {
    definisi: 'Penumpukan sel radang (pus) di bilik mata depan yang tampak sebagai lapisan putih dengan batas cairan horizontal.',
    diagnosis: ['Lapisan putih di bagian bawah bilik mata depan dengan permukaan datar; merupakan TANDA dari penyakit lain — cari penyebabnya: ulkus kornea berat, uveitis anterior berat, endoftalmitis, atau keganasan (pseudohipopion)'],
    tatalaksana: ['RUJUK oftalmologi segera — tatalaksana ditujukan pada penyebab dasar (antibiotik intensif pada ulkus/endoftalmitis, steroid pada uveitis setelah infeksi disingkirkan); jangan memberikan steroid topikal sebelum menyingkirkan infeksi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Perdarahan Vitreous': {
    definisi: 'Perdarahan ke dalam rongga vitreus yang menghalangi jalannya cahaya ke retina.',
    diagnosis: ['Penurunan penglihatan mendadak tanpa nyeri, floaters banyak atau bayangan seperti jelaga/laba-laba; refleks fundus menurun atau hilang; penyebab tersering retinopati diabetik proliferatif, robekan retina, trauma; USG mata bila fundus tidak terlihat untuk menyingkirkan ablasio retina'],
    tatalaksana: ['Rujuk oftalmologi; elevasi kepala dan istirahat, hentikan antikoagulan bila memungkinkan; observasi untuk absorpsi spontan, laser/anti-VEGF sesuai penyebab, vitrektomi bila tidak jernih atau ada ablasio retina'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Iridosisklitis, iritis': {
    definisi: 'Uveitis anterior — peradangan iris dan badan siliar.',
    diagnosis: ['Nyeri, fotofobia, mata merah dengan injeksi SILIAR (merah dominan di sekitar limbus), penglihatan kabur, pupil MIOSIS dan ireguler bila ada sinekia; sel dan flare di bilik mata depan; cari penyakit sistemik terkait (spondiloartropati, TB, sarkoidosis) bila rekuren'],
    tatalaksana: ['Kortikosteroid topikal dan SIKLOPLEGIK (untuk mencegah sinekia posterior dan meredakan nyeri spasme siliar) — rujuk oftalmologi; JANGAN memberi steroid bila belum menyingkirkan keratitis herpes atau infeksi lain; evaluasi tekanan intraokular selama terapi steroid'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Tumor iris': {
    definisi: 'Neoplasma pada iris, dapat jinak (nevus iris) atau ganas (melanoma iris).',
    diagnosis: ['Lesi berpigmen atau tidak berpigmen pada iris; tanda curiga keganasan: ukuran membesar, distorsi pupil, pembuluh darah sendiri, glaukoma sekunder, penyebaran ke sudut bilik mata; dokumentasi foto serial dan USG biomikroskopi'],
    tatalaksana: ['Rujuk oftalmologi onkologi; observasi dengan dokumentasi berkala untuk lesi kecil stabil, eksisi lokal, radioterapi plaque, atau enukleasi pada tumor besar/agresif'],
    referensi: ['SKDI2012', 'KANSKI2020', 'HARRISON2022'],
  },
  'Katarak': {
    definisi: 'Kekeruhan lensa mata yang menyebabkan penurunan penglihatan progresif; penyebab kebutaan tersering yang dapat dipulihkan.',
    diagnosis: ['Penglihatan kabur progresif tanpa nyeri, silau, halo, penglihatan ganda monokuler; refleks fundus berkurang, lensa tampak keruh; katarak kongenital pada bayi ditandai LEUKOKORIA (refleks pupil putih) — kedaruratan karena risiko ambliopia dan perlu disingkirkan retinoblastoma'],
    tatalaksana: ['Operasi (fakoemulsifikasi dengan implantasi lensa intraokular) adalah satu-satunya terapi definitif — indikasi bila mengganggu aktivitas sehari-hari; tidak ada obat tetes yang menyembuhkan katarak; katarak kongenital harus dioperasi SEDINI mungkin untuk perkembangan penglihatan'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Afakia kongenital': {
    definisi: 'Tidak adanya lensa kristalina sejak lahir (primer) atau setelah pengangkatan lensa (sekunder, mis. pasca operasi katarak kongenital).',
    diagnosis: ['Bilik mata depan dalam, iridodonesis (iris bergetar), hipermetropia tinggi, refleks fundus jelas tanpa lensa; tajam penglihatan sangat menurun tanpa koreksi'],
    tatalaksana: ['Koreksi optik SEGERA dan agresif (lensa kontak afakia atau kacamata pada bayi, lensa intraokular pada anak lebih besar) untuk cegah ambliopia deprivasi, terapi oklusi bila unilateral, pemantauan berkala oleh oftalmologi pediatrik'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Dislokasi lensa': {
    definisi: 'Perpindahan lensa dari posisi normalnya akibat kelemahan atau putusnya zonula Zinn.',
    diagnosis: ['Penglihatan kabur mendadak atau berubah-ubah, diplopia monokuler, iridodonesis, tepi lensa terlihat pada pupil dilatasi; cari penyebab: trauma, sindrom Marfan (dislokasi superotemporal), homosistinuria (inferonasal)'],
    tatalaksana: ['Rujuk oftalmologi; koreksi optik bila subluksasi ringan, ekstraksi lensa bila dislokasi ke bilik mata depan (risiko glaukoma dan dekompensasi kornea) atau menimbulkan komplikasi; evaluasi kelainan sistemik penyerta terutama kardiovaskular pada Marfan'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Hipermetropia ringan': {
    definisi: 'Rabun dekat — bayangan jatuh di belakang retina karena kekuatan refraksi kurang atau bola mata terlalu pendek.',
    diagnosis: ['Penglihatan dekat kabur (dan jauh pada derajat tinggi), mata cepat lelah dan sakit kepala saat membaca; koreksi dengan lensa SFERIS POSITIF (plus) terkecil yang memberi tajam penglihatan terbaik; pada anak gunakan sikloplegik karena akomodasi kuat dapat menutupi hipermetropia'],
    tatalaksana: ['Kacamata atau lensa kontak sferis positif; pada anak, hipermetropia tinggi yang tidak dikoreksi berisiko esotropia akomodatif dan ambliopia — koreksi dini penting; pemeriksaan mata berkala'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Miopia ringan': {
    definisi: 'Rabun jauh — bayangan jatuh di depan retina karena kekuatan refraksi berlebih atau bola mata terlalu panjang.',
    diagnosis: ['Penglihatan jauh kabur, penglihatan dekat jelas, sering memicingkan mata; koreksi dengan lensa SFERIS NEGATIF (minus) terkecil yang memberi tajam penglihatan terbaik'],
    tatalaksana: ['Kacamata atau lensa kontak sferis negatif, bedah refraktif pada dewasa dengan refraksi stabil; pada anak: aktivitas luar ruangan dan pembatasan kerja jarak dekat dapat memperlambat progresi; miopia tinggi perlu skrining berkala retina (risiko ablasio, degenerasi makula miopik)'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Astigmatism ringan': {
    definisi: 'Kelainan refraksi akibat kelengkungan kornea atau lensa yang tidak sama pada meridian berbeda.',
    diagnosis: ['Penglihatan kabur atau terdistorsi pada semua jarak, sakit kepala, memicingkan mata; koreksi memerlukan lensa SILINDRIS dengan aksis yang tepat; keratometri/topografi menilai kelengkungan kornea'],
    tatalaksana: ['Kacamata dengan lensa silindris atau lensa kontak toric, bedah refraktif pada dewasa; astigmatisme ireguler yang berat memerlukan lensa kontak rigid — pertimbangkan keratokonus bila astigmatisme cepat berubah'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Presbiopia': {
    definisi: 'Berkurangnya kemampuan akomodasi lensa seiring usia sehingga penglihatan dekat terganggu.',
    diagnosis: ['Kesulitan membaca dekat mulai usia sekitar 40 tahun, cenderung menjauhkan bacaan, perlu cahaya lebih terang; koreksi dengan lensa adisi positif sesuai usia (umumnya +1,00 D usia 40 meningkat bertahap hingga +3,00 D usia 60)'],
    tatalaksana: ['Kacamata baca, bifokal, atau progresif; lensa kontak multifokal atau monovision sebagai alternatif; edukasi bahwa ini proses fisiologis penuaan dan adisi akan meningkat bertahap hingga sekitar usia 65 lalu stabil'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Anisometropia pada dewasa': {
    definisi: 'Perbedaan kekuatan refraksi bermakna antara kedua mata pada pasien dewasa.',
    diagnosis: ['Perbedaan refraksi antar mata (umumnya >2 D dianggap bermakna), dapat menimbulkan aniseikonia (perbedaan ukuran bayangan), sakit kepala, dan gangguan penglihatan binokuler'],
    tatalaksana: ['Koreksi dengan LENSA KONTAK lebih baik daripada kacamata pada perbedaan besar (mengurangi aniseikonia dan efek prismatik), koreksi bertahap bila tidak toleran, bedah refraktif pada kasus terpilih'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Anisometropia pada anak': {
    definisi: 'Perbedaan refraksi bermakna antar kedua mata pada anak — penyebab penting ambliopia.',
    diagnosis: ['Sering tidak disadari karena mata yang lebih baik mengkompensasi — DITEMUKAN MELALUI SKRINING; periksa tajam penglihatan tiap mata secara terpisah, refraksi sikloplegik'],
    tatalaksana: ['Koreksi refraksi penuh sesegera mungkin, terapi oklusi (patching) mata yang lebih baik untuk melatih mata ambliopia; RUJUK oftalmologi pediatrik — keberhasilan terapi jauh lebih tinggi bila dimulai sebelum usia 7-8 tahun'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Ambliopia': {
    definisi: 'Mata malas — penurunan tajam penglihatan pada satu atau kedua mata akibat gangguan perkembangan penglihatan pada masa kritis, tanpa kelainan struktural yang menjelaskan.',
    diagnosis: ['Tajam penglihatan menurun yang tidak membaik dengan koreksi refraksi terbaik, tanpa kelainan organik; penyebab: strabismus, anisometropia, atau deprivasi (katarak kongenital, ptosis berat)'],
    tatalaksana: ['ATASI penyebab (koreksi refraksi, operasi katarak/ptosis), lalu terapi oklusi atau penalisasi atropin pada mata yang lebih baik; SEMAKIN DINI SEMAKIN BAIK — hasil terbatas setelah usia 8-10 tahun; kepatuhan orang tua sangat menentukan'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Diplopia binokuler': {
    definisi: 'Penglihatan ganda yang hilang bila salah satu mata ditutup, menandakan gangguan kesejajaran kedua mata.',
    diagnosis: ['Ganda hilang saat satu mata ditutup (binokuler) — berbeda dari diplopia monokuler yang menetap dan biasanya masalah optik (katarak, astigmatisme ireguler); cari lesi saraf kranial III/IV/VI, miastenia gravis, orbitopati tiroid, fraktur blowout orbita'],
    tatalaksana: ['CARI PENYEBAB SEGERA — diplopia binokuler onset akut dapat menandakan aneurisma, stroke batang otak, atau tumor; pencitraan sesuai kecurigaan; oklusi sementara atau prisma untuk gejala, tatalaksana penyakit dasar, operasi strabismus setelah stabil'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ADAMS2019'],
  },
  'Buta senja': {
    definisi: 'Niktalopia — gangguan penglihatan pada cahaya redup akibat disfungsi sel batang retina.',
    diagnosis: ['Kesulitan melihat saat senja atau di ruang gelap, sulit beradaptasi dari terang ke gelap; penyebab tersering DEFISIENSI VITAMIN A (gejala paling awal xeroftalmia), juga retinitis pigmentosa dan miopia tinggi'],
    tatalaksana: ['Suplementasi vitamin A dosis terapi bila defisiensi (respons cepat dalam beberapa hari), perbaikan gizi; rujuk oftalmologi bila tidak respons untuk evaluasi distrofi retina; edukasi keamanan (hindari mengemudi malam)'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Skotoma': {
    definisi: 'Area kehilangan penglihatan (bintik buta) di dalam lapang pandang yang dikelilingi penglihatan normal.',
    diagnosis: ['Nilai dengan uji konfrontasi dan perimetri; lokasi memberi petunjuk: skotoma sentral (lesi makula atau saraf optik), skotoma arkuata (glaukoma), skotoma sentrosekal (neuropati optik toksik/nutrisional)'],
    tatalaksana: ['Tatalaksana ditujukan pada penyebab dasar (glaukoma, neuritis optik, penyakit makula); rujuk oftalmologi untuk pemeriksaan lapang pandang formal dan funduskopi; rehabilitasi penglihatan (low vision aid) bila menetap'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ADAMS2019'],
  },
  'Hemianopia, bitemporal, and homonymous': {
    definisi: 'Hilangnya separuh lapang pandang; bitemporal menandakan lesi kiasma optikum, homonim menandakan lesi retrokiasmal.',
    diagnosis: ['Hemianopia BITEMPORAL: lesi kiasma (tersering adenoma hipofisis — cari gejala endokrin); Hemianopia HOMONIM: lesi traktus optikus, radiasi, atau korteks oksipital kontralateral (tersering stroke); uji konfrontasi lalu perimetri formal, pencitraan otak'],
    tatalaksana: ['Rujuk untuk pencitraan otak dan tatalaksana penyebab (reseksi/terapi adenoma hipofisis, protokol stroke); rehabilitasi penglihatan dan edukasi keselamatan (larangan mengemudi sesuai ketentuan, strategi pemindaian visual)'],
    referensi: ['SKDI2012', 'ADAMS2019', 'KANSKI2020'],
  },
  'Gangguan lapang pandang': {
    definisi: 'Berbagai pola penyempitan atau kehilangan lapang pandang akibat kelainan retina, saraf optik, atau jalur penglihatan intrakranial.',
    diagnosis: ['Uji konfrontasi sebagai skrining, perimetri otomatis untuk pemetaan; pola menentukan lokalisasi lesi — penyempitan konsentris (glaukoma lanjut, retinitis pigmentosa), defek altitudinal (oklusi vaskular), defek berpola kiasmal/retrokiasmal'],
    tatalaksana: ['Identifikasi dan tatalaksana penyebab; pemantauan lapang pandang berkala pada glaukoma; rehabilitasi low vision dan konseling keselamatan aktivitas'],
    referensi: ['SKDI2012', 'KANSKI2020', 'ADAMS2019'],
  },
  'Ablasio retina': {
    definisi: 'Terlepasnya retina neurosensorik dari epitel pigmen retina di bawahnya — kedaruratan yang mengancam penglihatan.',
    diagnosis: ['Floaters mendadak bertambah banyak, kilatan cahaya (fotopsia), lalu bayangan gelap seperti TIRAI yang meluas menutupi lapang pandang, penurunan penglihatan bila makula terlepas; funduskopi menunjukkan retina terangkat; faktor risiko: miopia tinggi, trauma, pasca operasi katarak'],
    tatalaksana: ['RUJUK OFTALMOLOGI SEGERA (dalam hitungan jam-hari) — operasi (vitrektomi, scleral buckle, atau retinopeksi pneumatik); prognosis jauh lebih baik bila makula BELUM terlepas, sehingga kecepatan rujukan sangat menentukan; batasi aktivitas dan posisi kepala sesuai anjuran sambil menunggu'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Perdarahan retina, oklusi pembuluh darah retina': {
    definisi: 'Perdarahan pada retina dan sumbatan arteri atau vena retina yang menyebabkan iskemia retina.',
    diagnosis: ['Oklusi ARTERI retina sentral: kehilangan penglihatan mendadak total tanpa nyeri, funduskopi menunjukkan retina pucat dengan CHERRY RED SPOT — kedaruratan setara stroke mata; Oklusi VENA retina: penurunan penglihatan lebih bertahap, funduskopi menunjukkan perdarahan menyebar blood and thunder'],
    tatalaksana: ['Oklusi arteri: RUJUK SEGERA (jendela terapi sangat sempit, beberapa jam) dan evaluasi sumber emboli — periksa karotis, jantung, dan pada usia >50 tahun periksa LED/CRP untuk arteritis sel raksasa; Oklusi vena: anti-VEGF/laser untuk edema makula, kendalikan hipertensi, DM, dan dislipidemia'],
    referensi: ['SKDI2012', 'KANSKI2020', 'BRAUNWALD2022'],
  },
  'Degenerasi makula karena usia': {
    definisi: 'Degenerasi makula terkait usia (AMD) — penyebab utama kehilangan penglihatan sentral pada lansia; tipe kering (atrofi) dan basah (neovaskular).',
    diagnosis: ['Penglihatan sentral kabur dan METAMORFOPSIA (garis lurus tampak bengkok — dinilai dengan kisi Amsler), kesulitan membaca dan mengenali wajah dengan penglihatan tepi tetap baik; funduskopi menunjukkan drusen (kering) atau perdarahan/eksudat makula (basah); OCT untuk konfirmasi'],
    tatalaksana: ['Kering: suplementasi antioksidan formula AREDS2 pada stadium tertentu, berhenti merokok, kontrol faktor risiko kardiovaskular; Basah: injeksi anti-VEGF intravitreal berkala — RUJUK SEGERA karena terapi dini menyelamatkan penglihatan; pemantauan mandiri dengan kisi Amsler dan rehabilitasi low vision'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Retinopati (diabetik, hipertensi, prematur)': {
    definisi: 'Kerusakan pembuluh darah retina akibat diabetes, hipertensi, atau imaturitas vaskular pada bayi prematur.',
    diagnosis: [
      'Diabetik: mikroaneurisma, perdarahan dot-blot, eksudat keras, hingga neovaskularisasi pada stadium proliferatif; sering asimtomatik hingga lanjut',
      'Hipertensi: penyempitan arteriol, AV nicking, perdarahan flame-shaped, cotton wool spots, papiledema pada hipertensi maligna',
      'Prematuritas (ROP): skrining wajib pada bayi prematur/berat lahir rendah sesuai kriteria program',
    ],
    tatalaksana: ['SKRINING BERKALA adalah kunci: funduskopi tahunan pada semua pasien DM sejak diagnosis (tipe 2) dan 5 tahun setelah diagnosis (tipe 1); kontrol gula darah, tekanan darah, dan lipid; laser fotokoagulasi atau anti-VEGF pada retinopati proliferatif dan edema makula; skrining ROP terjadwal dan laser/anti-VEGF bila terindikasi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PERKENI2021'],
  },
  'Korioretinitis': {
    definisi: 'Peradangan koroid dan retina, sering akibat infeksi (toksoplasmosis, TB, sifilis, CMV) atau autoimun.',
    diagnosis: ['Floaters, penglihatan kabur, skotoma; funduskopi menunjukkan lesi putih kekuningan dengan batas kabur pada fase aktif dan jaringan parut berpigmen pada fase lama; toksoplasmosis okular klasik berupa lesi aktif di tepi jaringan parut lama; skrining infeksi termasuk HIV'],
    tatalaksana: ['Rujuk oftalmologi; terapi antimikroba spesifik sesuai etiologi (pirimetamin-sulfadiazin pada toksoplasmosis, OAT pada TB), kortikosteroid sistemik hanya BERSAMA terapi antimikroba pada lesi yang mengancam makula atau saraf optik'],
    referensi: ['SKDI2012', 'KANSKI2020', 'HARRISON2022'],
  },
  'Optic disc cupping': {
    definisi: 'Pelebaran cekungan diskus optik akibat hilangnya serabut saraf, tanda khas kerusakan glaukomatosa.',
    diagnosis: ['Rasio cup-to-disc meningkat (>0,5) atau asimetris antar mata >0,2, penipisan neuroretinal rim (aturan ISNT terganggu), takik pada rim; korelasikan dengan tekanan intraokular dan lapang pandang'],
    tatalaksana: ['Evaluasi dan tatalaksana glaukoma: turunkan tekanan intraokular dengan tetes mata (analog prostaglandin, beta-blocker), laser, atau bedah; pemantauan berkala diskus dan lapang pandang — kerusakan bersifat PERMANEN sehingga tujuan terapi adalah mencegah progresi'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Edema papil': {
    definisi: 'Papiledema — pembengkakan diskus optik BILATERAL akibat peningkatan tekanan intrakranial.',
    diagnosis: ['Batas diskus kabur bilateral, elevasi diskus, vena melebar, perdarahan peripapiler, tanpa penurunan tajam penglihatan pada fase awal; gejala tekanan intrakranial: nyeri kepala memberat pagi hari, muntah, obskurasi visual transien; WAJIB pencitraan otak sebelum pungsi lumbal'],
    tatalaksana: ['CARI PENYEBAB SEGERA — pencitraan otak untuk menyingkirkan massa/hidrosefalus/trombosis sinus; tatalaksana penyebab; pada hipertensi intrakranial idiopatik: penurunan BB, asetazolamid, pemantauan lapang pandang ketat karena berisiko kebutaan permanen'],
    referensi: ['SKDI2012', 'ADAMS2019', 'KANSKI2020'],
  },
  'Atrofi optik': {
    definisi: 'Kerusakan permanen serabut saraf optik yang tampak sebagai diskus optik pucat.',
    diagnosis: ['Diskus optik pucat dengan penurunan tajam penglihatan, gangguan penglihatan warna, dan defek pupil aferen relatif (RAPD) bila unilateral; cari penyebab: glaukoma, neuritis optik lama, kompresi (tumor), iskemia, toksik (metanol, etambutol), herediter'],
    tatalaksana: ['Kerusakan tidak reversibel — fokus pada MENGHENTIKAN penyebab yang masih aktif (dekompresi tumor, hentikan obat toksik seperti etambutol, kontrol tekanan intraokular); rehabilitasi low vision dan pemantauan mata sebelahnya'],
    referensi: ['SKDI2012', 'ADAMS2019', 'KANSKI2020'],
  },
  'Neuropati optik': {
    definisi: 'Kerusakan saraf optik dari berbagai sebab: iskemik, kompresif, toksik/nutrisional, atau herediter.',
    diagnosis: ['Penurunan tajam penglihatan, gangguan penglihatan warna, RAPD positif, defek lapang pandang; neuropati optik iskemik anterior: kehilangan penglihatan mendadak dengan defek altitudinal pada usia lanjut — WAJIB periksa LED/CRP untuk menyingkirkan arteritis sel raksasa'],
    tatalaksana: ['Sesuai etiologi: kortikosteroid dosis tinggi SEGERA bila arteritis sel raksasa (mencegah kebutaan mata sebelahnya), hentikan agen toksik dan koreksi defisiensi B12/folat pada tipe nutrisional, dekompresi pada tipe kompresif, kontrol faktor risiko vaskular'],
    referensi: ['SKDI2012', 'ADAMS2019', 'KANSKI2020'],
  },
  'Neuritis optik': {
    definisi: 'Peradangan saraf optik, sering merupakan manifestasi awal sklerosis multipel pada dewasa muda.',
    diagnosis: ['Penurunan penglihatan subakut unilateral pada dewasa muda, NYERI SAAT MENGGERAKKAN BOLA MATA (khas), gangguan penglihatan warna terutama merah, RAPD positif; diskus dapat normal (neuritis retrobulbar — "pasien tidak melihat apa-apa, dokter tidak melihat apa-apa"); MRI otak untuk lesi demielinisasi'],
    tatalaksana: ['Metilprednisolon IV dosis tinggi mempercepat pemulihan (tidak mengubah hasil akhir tajam penglihatan) — HINDARI kortikosteroid oral dosis standar tunggal (meningkatkan risiko rekurensi); rujuk neurologi untuk evaluasi sklerosis multipel dan pertimbangan terapi pengubah penyakit'],
    referensi: ['SKDI2012', 'ADAMS2019', 'KANSKI2020'],
  },
  'Glaukoma lainnya': {
    definisi: 'Kelompok neuropati optik progresif dengan kerusakan khas diskus optik dan lapang pandang, umumnya terkait tekanan intraokular tinggi; mencakup glaukoma sekunder dan kongenital.',
    diagnosis: ['Glaukoma sudut terbuka: asimtomatik hingga lanjut, ditemukan lewat skrining (TIO, cupping, lapang pandang); Glaukoma akut sudut tertutup: nyeri mata hebat, mual muntah, halo, mata merah, kornea keruh, pupil mid-dilatasi non-reaktif — KEDARURATAN; Kongenital: buftalmos, epifora, fotofobia, kornea keruh pada bayi'],
    tatalaksana: ['Sudut terbuka: tetes penurun TIO seumur hidup, laser trabekuloplasti, atau trabekulektomi; AKUT SUDUT TERTUTUP: rujuk segera — turunkan TIO dengan obat sistemik dan topikal lalu iridotomi laser (juga profilaksis pada mata sebelahnya); Kongenital: bedah segera; kerusakan lapang pandang bersifat permanen sehingga deteksi dini kritis'],
    referensi: ['SKDI2012', 'KANSKI2020', 'PPKFKTP2014'],
  },
  'Tuli (kongenital, perseptif, konduktif)': {
    definisi: 'Gangguan pendengaran; konduktif akibat gangguan hantaran telinga luar/tengah, sensorineural (perseptif) akibat gangguan koklea atau saraf, dan campuran.',
    diagnosis: ['Uji penala: RINNE negatif dengan WEBER lateralisasi ke telinga sakit menandakan tuli konduktif; Rinne positif dengan Weber lateralisasi ke telinga sehat menandakan tuli sensorineural; audiometri nada murni untuk konfirmasi dan derajat; skrining pendengaran neonatus (OAE) penting untuk tuli kongenital'],
    tatalaksana: ['Konduktif: atasi penyebab (serumen, efusi, perforasi, otosklerosis) — sering reversibel; Sensorineural: alat bantu dengar, implan koklea pada tuli berat bilateral; TULI KONGENITAL harus diintervensi sedini mungkin (idealnya sebelum 6 bulan) untuk perkembangan bahasa'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Inflamasi pada aurikular': {
    definisi: 'Peradangan daun telinga, mencakup perikondritis (mengenai tulang rawan) dan selulitis aurikula.',
    diagnosis: ['Daun telinga merah, bengkak, nyeri; PERIKONDRITIS menyisakan lobulus telinga (tidak berkartilago) — berbeda dari selulitis yang mengenai lobulus juga; riwayat tindik tulang rawan, trauma, atau gigitan serangga'],
    tatalaksana: ['Antibiotik yang mencakup Pseudomonas (fluoroquinolone) pada perikondritis — jangan terlambat karena nekrosis tulang rawan menyebabkan deformitas cauliflower ear permanen; drainase bila ada abses; lepas anting/tindik'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Herpes zoster pada telinga': {
    definisi: 'Sindrom Ramsay Hunt — reaktivasi virus varisela-zoster pada ganglion genikulatum.',
    diagnosis: ['Trias: nyeri telinga hebat, vesikel pada daun telinga/liang telinga, dan paresis fasialis perifer; dapat disertai gangguan pendengaran, tinitus, dan vertigo'],
    tatalaksana: ['Antivirus (asiklovir/valasiklovir) DAN kortikosteroid sedini mungkin (idealnya <72 jam) — prognosis pemulihan saraf fasialis lebih buruk daripada Bell palsy sehingga terapi dini penting; proteksi mata bila lagoftalmus, analgesia adekuat'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PERDOSKI2021'],
  },
  'Fistula pre-aurikular': {
    definisi: 'Kelainan kongenital berupa lubang kecil di depan daun telinga akibat kegagalan fusi tuberkel aurikular.',
    diagnosis: ['Lubang kecil di anterior heliks, umumnya asimtomatik; dapat mengeluarkan sekret atau mengalami infeksi/abses berulang'],
    tatalaksana: ['Tidak perlu tindakan bila asimtomatik; antibiotik dan drainase bila infeksi akut; eksisi komplet saluran fistula secara elektif setelah infeksi tenang bila sering kambuh — eksisi tidak lengkap menyebabkan rekurensi'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Labirintitis': {
    definisi: 'Peradangan labirin telinga dalam yang mengenai fungsi keseimbangan dan pendengaran.',
    diagnosis: ['Vertigo berat berkepanjangan (jam-hari) disertai GANGGUAN PENDENGARAN dan tinitus, mual muntah, nistagmus; adanya gangguan pendengaran membedakan dari neuritis vestibular; cari sumber infeksi telinga tengah atau meningitis'],
    tatalaksana: ['Antibiotik bila labirintitis supuratif/otogenik (dan atasi otitis media sebagai sumber), kortikosteroid pada labirintitis viral, antivertigo dan antiemetik jangka pendek, hidrasi; rehabilitasi vestibular dini; rujuk THT — dapat menyebabkan tuli permanen'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Otitis media serosa': {
    definisi: 'Otitis media dengan efusi — cairan di telinga tengah tanpa tanda infeksi akut.',
    diagnosis: ['Pendengaran berkurang dan rasa penuh di telinga TANPA nyeri atau demam; otoskopi menunjukkan membran timpani suram/retraksi dengan air-fluid level atau gelembung; timpanometri tipe B; pada DEWASA dengan efusi unilateral menetap, WAJIB periksa nasofaring untuk singkirkan karsinoma nasofaring'],
    tatalaksana: ['Observasi 3 bulan pada anak (banyak sembuh spontan), atasi faktor predisposisi (rinitis alergi, hipertrofi adenoid); miringotomi dengan pemasangan grommet bila menetap >3 bulan dengan gangguan pendengaran bermakna atau gangguan bicara; antibiotik dan dekongestan rutin TIDAK direkomendasikan'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Otitis media kronik': {
    definisi: 'Peradangan kronik telinga tengah dengan perforasi membran timpani menetap dan sekret berulang; tipe aman (tubotimpani) dan bahaya (atikoantral, dengan kolesteatoma).',
    diagnosis: ['Sekret telinga berulang >2 bulan dengan perforasi membran timpani, gangguan pendengaran konduktif; TIPE BAHAYA ditandai perforasi marginal/atik, sekret berbau busuk, dan kolesteatoma — berisiko komplikasi intrakranial'],
    tatalaksana: ['Tipe aman: bersihkan telinga (aural toilet), tetes antibiotik topikal, jaga telinga kering, timpanoplasti elektif; TIPE BAHAYA: rujuk THT untuk mastoidektomi — waspadai tanda komplikasi (vertigo, paresis fasialis, nyeri kepala hebat, demam tinggi) yang menandakan penyebaran intrakranial'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Miringitis bullosa': {
    definisi: 'Peradangan membran timpani dengan pembentukan bula, umumnya terkait infeksi virus atau Mycoplasma.',
    diagnosis: ['NYERI TELINGA SANGAT HEBAT dan mendadak, otoskopi menunjukkan bula berisi cairan serosa atau hemoragik pada membran timpani; dapat disertai gangguan pendengaran'],
    tatalaksana: ['Analgesia adekuat sebagai prioritas (nyeri sangat berat), antibiotik topikal/sistemik bila dicurigai bakterial; bula umumnya pecah sendiri dan nyeri mereda cepat; jaga telinga kering'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Perforasi membran timpani': {
    definisi: 'Robekan pada membran timpani akibat trauma, barotrauma, atau infeksi.',
    diagnosis: ['Nyeri mendadak diikuti keluarnya cairan/darah dan penurunan pendengaran konduktif setelah trauma (tamparan, benda asing, barotrauma) atau saat otitis media akut pecah; otoskopi menunjukkan defek; nilai ukuran dan lokasi'],
    tatalaksana: ['JAGA TELINGA TETAP KERING (hindari berenang, tutup saat mandi), JANGAN irigasi telinga, hindari tetes ototoksik; sebagian besar perforasi traumatik menutup spontan dalam beberapa minggu; antibiotik bila ada infeksi; timpanoplasti bila tidak menutup setelah 3-6 bulan'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Otosklerosis': {
    definisi: 'Pertumbuhan tulang abnormal pada kapsul otik yang memfiksasi stapes, menyebabkan tuli konduktif progresif.',
    diagnosis: ['Tuli konduktif progresif bilateral pada dewasa muda (sering memburuk saat kehamilan), riwayat keluarga positif, tinitus; membran timpani NORMAL pada otoskopi; audiometri menunjukkan tuli konduktif dengan Carhart notch, timpanometri tipe As, refleks stapedius hilang'],
    tatalaksana: ['Alat bantu dengar sebagai opsi non-bedah, stapedektomi/stapedotomi memberikan hasil pendengaran sangat baik pada kandidat yang sesuai; rujuk THT; suplementasi fluorida kadang digunakan untuk memperlambat progresi'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Timpanosklerosis': {
    definisi: 'Deposit hialin dan kalsifikasi pada membran timpani dan telinga tengah akibat inflamasi kronik berulang.',
    diagnosis: ['Bercak putih kapur pada membran timpani (myringosklerosis) pada otoskopi, sering asimtomatik; bila mengenai rantai tulang pendengaran menimbulkan tuli konduktif; riwayat otitis media berulang atau pemasangan grommet'],
    tatalaksana: ['Tidak perlu terapi bila hanya bercak pada membran timpani tanpa gangguan pendengaran; bedah rekonstruksi rantai tulang pendengaran bila menyebabkan tuli konduktif bermakna; alat bantu dengar sebagai alternatif'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Kolesteatoma': {
    definisi: 'Akumulasi epitel skuamosa keratinisasi di telinga tengah/mastoid yang bersifat destruktif terhadap tulang sekitarnya.',
    diagnosis: ['Sekret telinga BERBAU BUSUK menetap, gangguan pendengaran progresif, perforasi atik atau marginal dengan massa putih seperti keju; CT tulang temporal menilai perluasan; waspadai komplikasi: paresis fasialis, fistula labirin (vertigo), abses otak, meningitis'],
    tatalaksana: ['TIDAK ADA terapi medikamentosa yang menyembuhkan — bedah (mastoidektomi) adalah satu-satunya terapi definitif; rujuk THT tanpa penundaan; antibiotik hanya mengendalikan infeksi sementara; pemantauan jangka panjang karena dapat rekuren'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Presbiakusis': {
    definisi: 'Gangguan pendengaran sensorineural bilateral simetris akibat proses degeneratif penuaan.',
    diagnosis: ['Kesulitan mendengar terutama frekuensi tinggi dan sulit memahami pembicaraan di tempat ramai, bertahap dan simetris pada lansia; audiometri menunjukkan penurunan ambang dengar frekuensi tinggi bilateral'],
    tatalaksana: ['Alat bantu dengar (semakin dini dipakai semakin baik adaptasinya), strategi komunikasi (bicara jelas menghadap pasien, kurangi bising latar), implan koklea pada kasus berat; skrining pendengaran pada lansia penting karena kaitan dengan isolasi sosial, depresi, dan penurunan kognitif'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Mabuk perjalanan': {
    definisi: 'Motion sickness — gejala akibat ketidaksesuaian masukan sensorik antara sistem vestibular, penglihatan, dan proprioseptif.',
    diagnosis: ['Mual, muntah, pusing, keringat dingin, dan pucat saat perjalanan darat, laut, atau udara; membaik setelah gerakan berhenti; tidak ada kelainan neurologis atau vestibular yang mendasari'],
    tatalaksana: ['Pencegahan: duduk di posisi paling stabil menghadap arah perjalanan, pandang horizon, hindari membaca dan layar, ventilasi baik, hindari makan berlebih dan alkohol; antihistamin (dimenhidrinat) atau skopolamin transdermal diberikan SEBELUM perjalanan'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Trauma akustik akut': {
    definisi: 'Kerusakan koklea akibat paparan suara sangat keras mendadak (ledakan, tembakan) atau bising intensitas tinggi.',
    diagnosis: ['Gangguan pendengaran dan tinitus mendadak setelah paparan bising keras, dapat disertai nyeri; audiometri menunjukkan penurunan ambang dengar khas pada 4000 Hz (notch); periksa membran timpani untuk perforasi akibat blast'],
    tatalaksana: ['Kortikosteroid sistemik dini dapat dipertimbangkan (mirip tuli mendadak sensorineural), hindari paparan bising lanjutan, rujuk THT untuk audiometri serial; PENCEGAHAN dengan alat pelindung telinga di lingkungan bising adalah kunci karena kerusakan sering permanen'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Trauma aurikular': {
    definisi: 'Cedera daun telinga akibat trauma tumpul atau tajam, termasuk hematoma aurikula.',
    diagnosis: ['Hematoma aurikula: pembengkakan fluktuatif pada permukaan anterior daun telinga setelah trauma tumpul (khas pada olahraga kontak); laserasi dapat melibatkan tulang rawan; nilai juga liang telinga dan membran timpani'],
    tatalaksana: ['HEMATOMA WAJIB dievakuasi (aspirasi atau insisi drainase) diikuti balut tekan — bila dibiarkan, tulang rawan nekrosis dan terjadi deformitas cauliflower ear permanen; laserasi: penjahitan dengan penutupan tulang rawan yang baik, antibiotik profilaksis, dan profilaksis tetanus'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'ATLS2018'],
  },
  'Deviasi septum hidung': {
    definisi: 'Pergeseran septum nasi dari garis tengah yang dapat menyumbat aliran udara hidung.',
    diagnosis: ['Sumbatan hidung menetap sering unilateral, dapat disertai mimisan berulang, nyeri kepala, dan gangguan tidur; rinoskopi anterior menunjukkan deviasi; nilai apakah gejala sesuai sisi deviasi'],
    tatalaksana: ['Deviasi tanpa gejala tidak perlu diterapi; atasi kondisi penyerta (rinitis alergi) yang sering memperberat gejala; septoplasti bila sumbatan bermakna dan mengganggu kualitas hidup — sebaiknya setelah pertumbuhan wajah selesai'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Furunkel pada hidung': {
    definisi: 'Infeksi folikel rambut pada vestibulum nasi, umumnya oleh Staphylococcus aureus.',
    diagnosis: ['Nodul nyeri di lubang hidung dengan eritema; lokasi ini berada dalam SEGITIGA BAHAYA WAJAH — drainase vena ke sinus kavernosus sehingga berisiko trombosis sinus kavernosus'],
    tatalaksana: ['Antibiotik sistemik antistafilokokus (bukan hanya topikal karena lokasi berisiko), kompres hangat, JANGAN DIPENCET; insisi drainase hanya bila sudah jelas berfluktuasi; waspadai tanda bahaya: demam tinggi, edema periorbital, oftalmoplegia, penurunan kesadaran'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Rhinitis akut': {
    definisi: 'Peradangan mukosa hidung akut, umumnya akibat infeksi virus (common cold).',
    diagnosis: ['Bersin, rinore encer menjadi kental, hidung tersumbat, dapat disertai demam ringan dan nyeri tenggorokan; berlangsung 7-10 hari; sekret purulen saja BUKAN indikasi antibiotik'],
    tatalaksana: ['Suportif: istirahat, cairan cukup, cuci hidung dengan salin, analgesik/antipiretik; dekongestan topikal MAKSIMAL 3-5 hari untuk cegah rinitis medikamentosa; ANTIBIOTIK TIDAK diindikasikan pada rinitis viral — edukasi pasien mengenai hal ini'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Rhinitis vasomotor': {
    definisi: 'Rinitis non-alergi akibat disregulasi otonom mukosa hidung, dipicu perubahan suhu, bau menyengat, atau makanan.',
    diagnosis: ['Hidung tersumbat dan rinore encer dipicu udara dingin, asap, parfum, atau makanan pedas; TANPA gatal hidung/mata dan bersin bertubi (yang khas alergi); uji alergi NEGATIF dan tidak ada eosinofil pada sekret'],
    tatalaksana: ['Hindari pemicu yang teridentifikasi, cuci hidung dengan salin, kortikosteroid nasal atau antihistamin nasal (azelastin), ipratropium nasal efektif bila rinore dominan; antihistamin oral umumnya kurang efektif dibanding pada rinitis alergi'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Rhinitis kronik': {
    definisi: 'Peradangan mukosa hidung yang berlangsung lama, dapat berupa hipertrofi atau atrofi mukosa.',
    diagnosis: ['Sumbatan hidung dan sekret menetap >12 minggu; rinitis atrofi (ozaena) ditandai mukosa atrofi, krusta tebal, hidung terasa lapang namun terasa tersumbat, dan BAU BUSUK yang tidak disadari pasien'],
    tatalaksana: ['Cuci hidung salin rutin sebagai dasar, kortikosteroid nasal untuk tipe hipertrofi, pengangkatan krusta dan pelembap mukosa pada tipe atrofi, antibiotik bila infeksi sekunder; hindari penggunaan dekongestan topikal jangka panjang; rujuk THT bila refrakter'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Rhinitis medikamentosa': {
    definisi: 'Sumbatan hidung rebound akibat penggunaan dekongestan topikal berkepanjangan (>5-7 hari).',
    diagnosis: ['Sumbatan hidung memberat dan semakin sering memerlukan semprot dekongestan, riwayat pemakaian oksimetazolin/xylometazolin berminggu-minggu hingga berbulan-bulan; mukosa tampak merah dan bengkak'],
    tatalaksana: ['HENTIKAN dekongestan topikal (dapat bertahap satu lubang hidung dahulu), mulai kortikosteroid nasal untuk membantu masa transisi, cuci hidung salin; EDUKASI bahwa sumbatan akan memburuk sementara selama 1-2 minggu sebelum membaik — pemahaman ini penting agar pasien tidak kembali memakai'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Sinusitis frontal akut': {
    definisi: 'Peradangan akut sinus frontalis, umumnya akibat infeksi bakteri setelah infeksi saluran napas atas.',
    diagnosis: ['Nyeri kepala di dahi yang memberat saat membungkuk, nyeri tekan di atas alis, sekret purulen, sumbatan hidung; sinusitis frontal berisiko komplikasi intrakranial dan orbita — waspadai edema dahi (Pott puffy tumor), edema periorbital, dan gejala neurologis'],
    tatalaksana: ['Antibiotik (amoksisilin-klavulanat), dekongestan jangka pendek, kortikosteroid nasal, cuci hidung salin, analgesia; RUJUK SEGERA bila ada tanda komplikasi orbita atau intrakranial — memerlukan pencitraan dan kemungkinan drainase bedah'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Sinusitis kronik': {
    definisi: 'Peradangan sinus paranasal yang berlangsung 12 minggu atau lebih.',
    diagnosis: ['Minimal dua gejala menetap ≥12 minggu: sumbatan hidung, sekret (anterior/posterior), nyeri wajah, penurunan penghidu; konfirmasi dengan nasoendoskopi atau CT sinus; cari faktor predisposisi: polip, alergi, deviasi septum, imunodefisiensi, infeksi gigi'],
    tatalaksana: ['Cuci hidung salin volume besar dan kortikosteroid nasal sebagai terapi dasar jangka panjang, antibiotik hanya untuk eksaserbasi akut, atasi alergi penyerta; bedah sinus endoskopik fungsional (FESS) bila gagal terapi medis maksimal'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Etmoiditis akut': {
    definisi: 'Peradangan akut sinus etmoidalis; pada anak merupakan penyebab tersering selulitis orbita.',
    diagnosis: ['Nyeri di antara/di belakang mata, sumbatan hidung, sekret purulen, demam; WASPADAI perluasan ke orbita: edema dan eritema periorbital, proptosis, nyeri gerak bola mata, gangguan penglihatan, oftalmoplegia'],
    tatalaksana: ['Antibiotik IV dan rawat inap bila ada kecurigaan komplikasi orbita, CT sinus dan orbita untuk menilai abses; RUJUK THT dan oftalmologi segera — abses subperiosteal atau orbita memerlukan drainase bedah untuk mencegah kebutaan dan penyebaran intrakranial'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Polip': {
    definisi: 'Polip nasi — massa jinak edematosa dari mukosa hidung dan sinus, terkait inflamasi kronik.',
    diagnosis: ['Sumbatan hidung bilateral progresif, penurunan atau hilangnya penghidu, rinore; rinoskopi menunjukkan massa bertangkai putih keabuan seperti anggur, TIDAK NYERI dan tidak berdarah saat disentuh (berbeda dari tumor); polip UNILATERAL pada dewasa atau polip pada anak perlu evaluasi lanjut (keganasan, fibrosis kistik)'],
    tatalaksana: ['Kortikosteroid nasal jangka panjang sebagai terapi utama, kortikosteroid oral jangka pendek untuk polip besar, cuci hidung salin; polipektomi/FESS bila gagal terapi medis — REKURENSI tinggi sehingga steroid nasal harus dilanjutkan pasca operasi; evaluasi asma dan sensitivitas aspirin penyerta'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'PPKFKTP2014'],
  },
  'Fistula dan kista brankial lateral dan medial': {
    definisi: 'Kelainan kongenital sisa lengkung brankial; kista brankial lateral di leher lateral, kista duktus tiroglosus di garis tengah.',
    diagnosis: ['Kista brankial: massa kistik di leher lateral sepanjang tepi anterior m. sternokleidomastoideus, sering membesar saat infeksi saluran napas atas; Kista tiroglosus: massa di GARIS TENGAH yang IKUT BERGERAK saat menelan dan menjulurkan lidah; USG dan pastikan ada tiroid normal sebelum eksisi tiroglosus'],
    tatalaksana: ['Antibiotik bila infeksi akut, lalu eksisi bedah elektif setelah tenang; kista tiroglosus memerlukan prosedur Sistrunk (termasuk pengangkatan bagian os hioid) untuk mencegah rekurensi'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'SCHWARTZ2019'],
  },
  'Higroma kistik': {
    definisi: 'Malformasi limfatik kongenital, umumnya di regio leher posterior atau aksila.',
    diagnosis: ['Massa lunak, kistik, TRANSILUMINASI POSITIF, sering tampak sejak lahir atau usia dini, dapat membesar cepat saat infeksi atau perdarahan ke dalam kista; USG/MRI menilai perluasan; lesi besar di leher dapat mengancam jalan napas neonatus'],
    tatalaksana: ['Nilai dan amankan jalan napas pada lesi besar; skleroterapi (OK-432, bleomisin) atau eksisi bedah — eksisi komplet sering sulit karena sifat infiltratif dan rekurensi cukup sering; rujuk bedah anak'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'SCHWARTZ2019'],
  },
  'Tortikolis': {
    definisi: 'Posisi kepala miring dan berputar akibat kontraktur atau spasme otot leher, tersering m. sternokleidomastoideus.',
    diagnosis: ['Kepala miring ke sisi otot yang terkena dengan dagu berputar ke sisi berlawanan; kongenital: teraba massa fibrosa pada SCM bayi, terkait posisi intrauterin/persalinan sulit; didapat: cari penyebab (spasme otot, infeksi retrofaring, distonia, tumor fossa posterior, subluksasi atlantoaksial)'],
    tatalaksana: ['Kongenital: fisioterapi peregangan dini sangat efektif bila dimulai awal, tummy time dan penempatan posisi; bedah bila gagal konservatif setelah usia 1 tahun; Didapat: atasi penyebab dasar — tortikolis akut disertai demam atau gejala neurologis memerlukan evaluasi segera'],
    referensi: ['SKDI2012', 'APLEY2018', 'CUMMINGS2021'],
  },
  'Abses Bezold': {
    definisi: 'Komplikasi mastoiditis di mana pus menembus ujung mastoid dan menyebar ke ruang leher dalam di bawah m. sternokleidomastoideus.',
    diagnosis: ['Riwayat otitis media/mastoiditis, pembengkakan dan nyeri di leher lateral bawah ujung mastoid, demam tinggi, tortikolis; CT tulang temporal dan leher menilai perluasan abses dan destruksi mastoid'],
    tatalaksana: ['Antibiotik IV spektrum luas dan DRAINASE BEDAH (mastoidektomi dan drainase leher) — kedaruratan karena dapat menyebar ke mediastinum dan intrakranial; rujuk THT segera'],
    referensi: ['SKDI2012', 'CUMMINGS2021', 'SCHWARTZ2019'],
  },

  // ─── Reproduksi & Obstetri ───────────────────────────────────────────────
  'Sifilis': {
    definisi: 'Infeksi menular seksual sistemik oleh Treponema pallidum dengan perjalanan bertahap.',
    diagnosis: ['Primer: chancre tidak nyeri; Sekunder: ruam termasuk telapak tangan dan kaki, kondiloma lata; Laten: tanpa gejala dengan serologi positif; Tersier: gumma, kardiovaskular, neurosifilis; skrining VDRL/RPR dengan konfirmasi TPHA; skrining WAJIB pada semua ibu hamil'],
    tatalaksana: ['Benzatin penisilin G IM — dosis tunggal pada sifilis dini, tiga dosis mingguan pada laten lanjut; pada IBU HAMIL hanya penisilin yang efektif mencegah sifilis kongenital (desensitisasi bila alergi); obati pasangan, skrining HIV, pantau titer serologi'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'POGI2016'],
  },
  'Infeksi virus Herpes genital': {
    definisi: 'Infeksi herpes simpleks pada area genital, umumnya HSV-2, dengan kecenderungan rekuren.',
    diagnosis: ['Vesikel berkelompok nyeri pada genital yang pecah menjadi ulkus dangkal, didahului prodromal; episode primer lebih berat disertai demam dan limfadenopati; rekurensi lebih ringan dan singkat'],
    tatalaksana: ['Asiklovir/valasiklovir oral pada episode, terapi supresif bila rekurensi sering; PENTING pada kehamilan — lesi aktif saat persalinan merupakan indikasi seksio sesarea untuk mencegah herpes neonatal yang fatal; edukasi penularan dan skrining IMS lain'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'WILLIAMSOB2022'],
  },
  'Infeksi saluran kemih bagian bawah': {
    definisi: 'Infeksi kandung kemih dan uretra; pada kehamilan bahkan bakteriuria asimtomatik pun bermakna.',
    diagnosis: ['Disuria, frekuensi, urgensi, nyeri suprapubik; urinalisis menunjukkan leukosituria dan nitrit positif, kultur urin konfirmatif; SKRINING bakteriuria asimtomatik rutin pada ibu hamil'],
    tatalaksana: ['Antibiotik sesuai kultur; pada kehamilan bakteriuria asimtomatik WAJIB diobati (mencegah pielonefritis dan persalinan preterm) dengan antibiotik yang aman (nitrofurantoin, sefaleksin, amoksisilin) — HINDARI fluoroquinolone dan kotrimoksazol trimester akhir; hidrasi dan berkemih pasca senggama'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'WILLIAMSOB2022'],
  },
  'Vulvitis': {
    definisi: 'Peradangan vulva akibat infeksi, iritan, alergen, atau atrofi.',
    diagnosis: ['Gatal, perih, kemerahan, dan bengkak pada vulva, dapat disertai duh; cari penyebab: kandidiasis, iritan (sabun, pembalut, pembersih kewanitaan), dermatitis kontak, atrofi pascamenopause, atau diabetes'],
    tatalaksana: ['Hentikan iritan dan hindari pembersih kewanitaan/douching, gunakan pembersih lembut dan pakaian dalam katun, kompres dingin; antijamur bila kandidiasis, estrogen topikal bila atrofi, kortikosteroid topikal ringan bila dermatitis; skrining DM bila rekuren'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'POGI2016'],
  },
  'Vaginitis': {
    definisi: 'Peradangan vagina dengan duh abnormal; penyebab tersering kandidiasis, trikomoniasis, dan vaginosis bakterialis.',
    diagnosis: ['Kandidiasis: duh putih kental seperti keju, gatal hebat, pH <4,5, KOH menunjukkan pseudohifa; Trikomoniasis: duh kuning kehijauan berbusa dan berbau, strawberry cervix, trikomonas motil pada sediaan basah; nilai pH dan whiff test untuk membedakan'],
    tatalaksana: ['Kandidiasis: antijamur topikal atau flukonazol oral (HINDARI flukonazol pada kehamilan — gunakan topikal); Trikomoniasis: metronidazol dan WAJIB mengobati pasangan seksual karena tergolong IMS; hindari douching'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'POGI2016'],
  },
  'Vaginosis bakterialis': {
    definisi: 'Pergeseran flora normal vagina dari Lactobacillus ke bakteri anaerob, bukan infeksi menular seksual klasik.',
    diagnosis: ['Kriteria Amsel (3 dari 4): duh homogen putih keabuan, pH vagina >4,5, whiff test positif (bau amis dengan KOH), dan CLUE CELLS pada sediaan basah; gatal dan inflamasi biasanya minimal'],
    tatalaksana: ['Metronidazol oral atau gel vagina, atau klindamisin; pengobatan pasangan TIDAK diperlukan (bukan IMS); pada kehamilan pengobatan diberikan karena berkaitan dengan persalinan preterm dan ketuban pecah dini; hindari douching yang memperburuk'],
    referensi: ['SKDI2012', 'PPKFKTP2014', 'POGI2016'],
  },
  'Salpingitis': {
    definisi: 'Peradangan tuba falopii, umumnya bagian dari penyakit radang panggul akibat infeksi asenden.',
    diagnosis: ['Nyeri perut bawah bilateral, duh serviks purulen, nyeri goyang serviks dan nyeri adneksa pada pemeriksaan bimanual, demam; skrining gonore dan klamidia; singkirkan kehamilan ektopik dengan tes kehamilan'],
    tatalaksana: ['Antibiotik empiris kombinasi yang mencakup gonore, klamidia, dan anaerob segera setelah diagnosis klinis (jangan menunggu hasil kultur), obati pasangan seksual, hindari senggama selama terapi; EDUKASI risiko jangka panjang: infertilitas tuba, kehamilan ektopik, dan nyeri panggul kronik'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Abses tubo-ovarium': {
    definisi: 'Kumpulan pus yang melibatkan tuba dan ovarium, komplikasi berat penyakit radang panggul.',
    diagnosis: ['Nyeri perut bawah hebat, demam tinggi, massa adneksa teraba nyeri, leukositosis; USG atau CT menunjukkan massa kompleks berisi cairan; waspadai ruptur yang menyebabkan peritonitis dan sepsis'],
    tatalaksana: ['Rawat inap dengan antibiotik IV spektrum luas, drainase (perkutan atau laparoskopik) bila abses besar atau tidak respons dalam 48-72 jam, laparotomi darurat bila ruptur; pertimbangkan pelestarian fertilitas dalam keputusan bedah pada pasien muda'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Penyakit radang panggul': {
    definisi: 'Infeksi asenden traktus genital atas mencakup endometritis, salpingitis, dan peritonitis pelvik.',
    diagnosis: ['Nyeri perut bawah dengan nyeri goyang serviks, nyeri uterus, atau nyeri adneksa pada wanita usia reproduksi; kriteria tambahan: demam, duh abnormal, LED/CRP meningkat, bukti gonore/klamidia; ambang diagnosis sengaja RENDAH karena konsekuensi keterlambatan berat'],
    tatalaksana: ['Antibiotik empiris segera mencakup gonore, klamidia, dan anaerob; rawat inap bila hamil, abses, gagal terapi oral, atau sakit berat; obati pasangan, lepas AKDR hanya bila tidak ada perbaikan; edukasi pencegahan IMS'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Kehamilan normal': {
    definisi: 'Kehamilan yang berlangsung tanpa penyulit dengan pertumbuhan janin dan adaptasi fisiologis ibu yang sesuai usia kehamilan; pelayanan antenatal pada kehamilan normal merupakan kesempatan utama untuk MENAPIS risiko sejak dini, sebab sebagian besar kematian ibu terjadi pada perempuan yang kehamilannya semula dianggap normal.',
    anamnesis: {
      keluhanUtama: 'Terlambat haid dan ingin memeriksakan kehamilan, atau kunjungan ulang pemeriksaan kehamilan rutin.',
      riwayatPenyakitSekarang:
        'Tentukan lebih dahulu HARI PERTAMA HAID TERAKHIR dan keteraturan siklus sebelumnya, karena inilah dasar penghitungan usia kehamilan dan taksiran persalinan. Telusuri keluhan yang menyertai dengan SOCRATES bila ada: mual dan muntah pada trimester pertama (nilai apakah masih fisiologis atau sudah mengganggu asupan sehingga mengarah hiperemesis), nyeri perut, keputihan, nyeri saat berkemih, sesak, dan bengkak. Tanyakan GERAKAN JANIN — mulai dirasakan sekitar usia 18-20 minggu pada kehamilan pertama dan 16-18 minggu pada kehamilan berikutnya; pada trimester tiga tanyakan apakah gerakan berkurang dibanding biasanya. Yang WAJIB ditanyakan pada setiap kunjungan adalah ada tidaknya TANDA BAHAYA: perdarahan pervaginam, nyeri kepala hebat, pandangan kabur atau berkunang-kunang, nyeri ulu hati, bengkak pada wajah dan tangan, demam tinggi, keluar cairan ketuban, kejang, dan gerakan janin berkurang.',
      riwayatPenyakitDahulu:
        'Hipertensi, diabetes, penyakit jantung, asma, tuberkulosis, epilepsi, penyakit tiroid, penyakit ginjal, HIV, hepatitis B, serta riwayat operasi terutama SEKSIO SESAREA sebelumnya beserta indikasinya; riwayat transfusi darah dan alergi.',
      riwayatPenyakitKeluarga: 'Hipertensi, diabetes melitus, kehamilan kembar, kelainan bawaan, thalassemia, dan gangguan pembekuan darah dalam keluarga.',
      riwayatPengobatan:
        'Semua obat yang sedang dikonsumsi termasuk obat rutin untuk penyakit kronik, jamu, dan suplemen — tinjau keamanannya dalam kehamilan; tanyakan pula konsumsi asam folat sebelum dan sejak hamil, serta kepatuhan tablet tambah darah.',
      riwayatAlergi: 'Riwayat alergi obat dan makanan, terutama alergi penisilin yang menentukan pilihan antibiotik bila kelak diperlukan.',
      riwayatKehamilanPersalinan:
        'Ini merupakan bagian TERPENTING. Catat status GRAVIDA, PARA, ABORTUS. Untuk setiap kehamilan sebelumnya: tahun, usia kehamilan saat lahir, cara persalinan (spontan, vakum, forsep, atau seksio beserta indikasinya), berat lahir bayi, jenis kelamin, kondisi bayi saat lahir dan sekarang, serta penyulit yang terjadi seperti preeklamsia, perdarahan pascapersalinan, retensio plasenta, persalinan lama, atau kematian janin. Riwayat abortus, kehamilan ektopik, dan mola. Riwayat bayi besar lebih dari 4 kg yang mengarahkan pada diabetes gestasional, dan riwayat persalinan preterm yang meningkatkan risiko berulang. Tanyakan pula jarak kehamilan dan riwayat penggunaan kontrasepsi sebelum hamil ini.',
      riwayatNutrisi:
        'Pola makan sehari-hari dan kecukupannya, kenaikan berat badan sejak hamil, pantangan makanan yang dianut, kebiasaan mengonsumsi makanan mentah atau setengah matang (risiko toksoplasmosis dan listeriosis), serta asupan kalsium, zat besi, dan yodium.',
      riwayatImunisasi: 'Status imunisasi tetanus (TT atau Td) beserta jumlah dosis yang sudah diterima seumur hidup, serta riwayat imunisasi rubela sebelum hamil.',
      riwayatSosialEkonomi:
        'Usia ibu (kurang dari 20 tahun atau lebih dari 35 tahun meningkatkan risiko), pendidikan, pekerjaan ibu dan suami termasuk paparan zat berbahaya di tempat kerja, dukungan keluarga, kebiasaan merokok termasuk PAPARAN ASAP ROKOK DARI SUAMI, konsumsi alkohol dan zat terlarang, kekerasan dalam rumah tangga (tanyakan dengan hati-hati dan tanpa kehadiran pendamping bila memungkinkan), jarak ke fasilitas kesehatan, ketersediaan transportasi, kepesertaan jaminan kesehatan, serta siapa pengambil keputusan dalam keluarga bila terjadi kegawatan.',
    },
    pemeriksaanFisik: [
      'Keadaan umum, kesadaran, dan tanda anemia berupa konjungtiva pucat',
      'TEKANAN DARAH pada setiap kunjungan dengan teknik benar — tekanan 140/90 mmHg atau lebih setelah usia 20 minggu mengarahkan pada hipertensi dalam kehamilan',
      'Berat badan dan tinggi badan; hitung indeks massa tubuh sebelum hamil untuk menentukan target kenaikan berat badan',
      'LINGKAR LENGAN ATAS — kurang dari 23,5 cm menandakan kurang energi kronik dan berisiko melahirkan bayi berat lahir rendah',
      'Konjungtiva, sklera, tiroid, jantung, dan paru; periksa edema pada tungkai, wajah, dan tangan',
      'TINGGI FUNDUS UTERI diukur dengan pita ukur dalam sentimeter dari simfisis pubis; setelah usia 24 minggu angkanya kurang lebih sama dengan usia kehamilan dalam minggu dengan selisih 2 cm — selisih lebih besar mengarah pada gangguan pertumbuhan janin, kehamilan ganda, atau polihidramnion',
      'PEMERIKSAAN LEOPOLD pada usia kehamilan 28 minggu ke atas: Leopold I menentukan tinggi fundus dan bagian janin di fundus; Leopold II menentukan letak punggung dan bagian kecil janin; Leopold III menentukan bagian terbawah janin dan apakah masih dapat digoyangkan; Leopold IV menentukan seberapa jauh bagian terbawah telah masuk pintu atas panggul',
      'DENYUT JANTUNG JANIN dengan Doppler mulai usia 10-12 minggu atau dengan Laenec mulai 18-20 minggu; nilai normal 120-160 kali per menit',
      'Pemeriksaan payudara untuk menilai kesiapan menyusui termasuk bentuk puting',
      'Pemeriksaan genitalia eksterna bila ada keluhan; pemeriksaan dalam TIDAK rutin dan dihindari bila dicurigai plasenta previa',
    ],
    antropometri:
      'Hitung indeks massa tubuh SEBELUM hamil untuk menentukan target kenaikan berat badan selama kehamilan menurut rekomendasi Institute of Medicine. Pada ibu dengan indeks massa tubuh kurang dari 18,5 kg/m² (berat kurang), target kenaikan 12,5-18 kg. Pada 18,5-24,9 kg/m² (normal), target 11,5-16 kg. Pada 25-29,9 kg/m² (berat berlebih), target 7-11,5 kg. Pada 30 kg/m² atau lebih (obesitas), target 5-9 kg. Pada trimester pertama kenaikan yang wajar hanya sekitar 0,5-2 kg secara keseluruhan, selanjutnya sekitar 0,4-0,5 kg per minggu pada trimester kedua dan ketiga untuk ibu dengan berat badan normal. Kenaikan yang terlalu sedikit berkaitan dengan berat lahir rendah dan persalinan preterm, sedangkan kenaikan berlebih meningkatkan risiko diabetes gestasional, preeklamsia, makrosomia, dan seksio sesarea. LINGKAR LENGAN ATAS kurang dari 23,5 cm menjadi penanda kurang energi kronik yang praktis karena tidak dipengaruhi oleh edema maupun berat janin. Tinggi badan ibu kurang dari 145 cm perlu diperhatikan sebagai faktor risiko disproporsi kepala panggul.',
    penunjang: [
      'Tes kehamilan urin (beta-hCG) untuk konfirmasi awal',
      'Hemoglobin pada kunjungan pertama dan diulang pada trimester ketiga — anemia bila kurang dari 11 g/dL pada trimester pertama dan ketiga, atau kurang dari 10,5 g/dL pada trimester kedua',
      'Golongan darah dan rhesus; pada ibu rhesus negatif diperlukan perhatian khusus terhadap risiko isoimunisasi',
      'Skrining WAJIB pada kunjungan pertama sesuai program nasional: HIV, sifilis, dan hepatitis B (HBsAg) — ketiganya dapat dicegah penularannya ke bayi bila terdeteksi',
      'Urinalisis untuk protein dan glukosa; skrining bakteriuria asimtomatik yang wajib diobati bila positif',
      'Gula darah untuk skrining diabetes; tes toleransi glukosa oral 75 gram pada usia 24-28 minggu bagi ibu dengan faktor risiko',
      'USG idealnya minimal dua kali: trimester pertama untuk memastikan kehamilan intrauterin, jumlah janin, dan MENENTUKAN USIA KEHAMILAN secara paling akurat; serta usia 18-22 minggu untuk skrining anomali janin dan menilai lokasi plasenta',
      'Pemeriksaan malaria pada daerah endemis dan skrining tuberkulosis bila ada gejala',
    ],
    etiologi: 'Fisiologis — hasil pembuahan ovum oleh spermatozoa yang diikuti implantasi dan perkembangan hasil konsepsi dalam kavum uteri.',
    patofisiologi:
      'Kehamilan menimbulkan adaptasi fisiologis luas yang penting dipahami agar temuan normal tidak disalahartikan sebagai penyakit. Volume plasma meningkat sekitar 40-50% sementara massa eritrosit hanya meningkat sekitar 20-30%, sehingga terjadi HEMODILUSI FISIOLOGIS yang membuat hemoglobin menurun — inilah sebabnya ambang anemia dalam kehamilan lebih rendah daripada di luar kehamilan. Curah jantung meningkat sekitar 30-50% sedangkan resistensi vaskular sistemik menurun akibat progesteron, sehingga tekanan darah justru cenderung TURUN pada trimester kedua dan kembali normal menjelang aterm; tekanan darah yang meningkat pada pertengahan kehamilan karenanya selalu bermakna patologis. Progesteron melemaskan otot polos sehingga menimbulkan mual, konstipasi, refluks akibat relaksasi sfingter esofagus bawah, serta dilatasi ureter dengan stasis urin yang menjelaskan tingginya risiko infeksi saluran kemih dan pielonefritis. Laju filtrasi glomerulus meningkat sekitar 50% sehingga kreatinin dan ureum serum menurun — nilai kreatinin yang tampak normal justru dapat menandakan gangguan ginjal pada ibu hamil. Kehamilan juga merupakan keadaan HIPERKOAGULASI akibat peningkatan faktor pembekuan, yang secara evolusioner melindungi dari perdarahan saat persalinan namun meningkatkan risiko tromboemboli. Uterus yang membesar menekan vena kava inferior pada posisi terlentang sehingga menurunkan aliran balik vena dan dapat menimbulkan sindrom hipotensi supin — alasan ibu hamil trimester akhir dianjurkan berbaring MIRING KE KIRI.',
    faktorRisiko: [
      'Usia ibu kurang dari 20 tahun atau lebih dari 35 tahun',
      'Tinggi badan kurang dari 145 cm dan lingkar lengan atas kurang dari 23,5 cm',
      'Paritas tinggi (empat atau lebih) dan jarak kehamilan kurang dari 2 tahun',
      'Riwayat seksio sesarea, preeklamsia, perdarahan pascapersalinan, atau kematian janin sebelumnya',
      'Penyakit penyerta: hipertensi, diabetes, penyakit jantung, anemia, tuberkulosis, HIV',
      'Kehamilan ganda dan kelainan letak janin',
      'Merokok aktif maupun pasif, konsumsi alkohol, dan zat terlarang',
      'Akses terbatas ke fasilitas kesehatan dan status sosial ekonomi rendah',
      'Kekerasan dalam rumah tangga',
    ],
    goldStandard:
      'Kehamilan dipastikan dengan tes beta-hCG positif disertai konfirmasi USG yang menunjukkan kantong gestasi intrauterin dengan janin dan denyut jantung. Penentuan usia kehamilan paling akurat menggunakan USG TRIMESTER PERTAMA (pengukuran crown-rump length), yang lebih dapat diandalkan daripada perhitungan dari hari pertama haid terakhir terutama bila siklus haid tidak teratur atau tanggal tidak diingat pasti. Taksiran persalinan dihitung dengan rumus Naegele: hari pertama haid terakhir ditambah 7 hari, bulan dikurangi 3, tahun ditambah 1 — berlaku untuk siklus 28 hari dan perlu penyesuaian bila siklus berbeda.',
    diagnosisBanding: [
      'Kehamilan ektopik — amenore dengan nyeri perut bawah dan perdarahan, tes kehamilan positif namun USG tidak menemukan kantong gestasi intrauterin; wajib disingkirkan pada setiap perdarahan trimester pertama',
      'Mola hidatidosa — uterus lebih besar dari usia kehamilan, beta-hCG sangat tinggi, tidak ada denyut jantung janin, USG menunjukkan gambaran badai salju',
      'Abortus (iminens, insipiens, inkomplit) — perdarahan pervaginam dengan atau tanpa pembukaan serviks',
      'Pseudosiesis — tanda kehamilan subjektif dengan tes kehamilan negatif',
      'Amenore akibat sebab lain: sindrom ovarium polikistik, hiperprolaktinemia, gangguan tiroid, atau menopause dini',
      'Massa abdomen lain seperti mioma uteri dan kista ovarium yang membesar',
    ],
    pengkajian:
      'Dipikirkan kehamilan normal pada pasien ini atas dasar amenore sejak hari pertama haid terakhir yang tercatat jelas, disertai tes kehamilan yang positif dan dikonfirmasi USG berupa kantong gestasi intrauterin dengan janin tunggal hidup yang ukurannya sesuai usia kehamilan, tanpa disertai keluhan tanda bahaya, dengan tekanan darah serta pemeriksaan fisik dalam batas normal dan tinggi fundus uteri yang sesuai. Kehamilan ektopik merupakan diagnosis banding yang WAJIB disingkirkan pada setiap kehamilan muda karena merupakan penyebab utama kematian maternal pada trimester pertama; pada kehamilan ektopik dijumpai nyeri perut bawah dan perdarahan dengan tes kehamilan positif namun USG tidak menemukan kantong gestasi di dalam kavum uteri — pada pasien ini kantong gestasi intrauterin terlihat jelas sehingga kemungkinan tersebut dapat disingkirkan. Mola hidatidosa dipertimbangkan bila uterus teraba lebih besar dari usia kehamilan dengan mual muntah yang sangat berat dan tidak ditemukan denyut jantung janin, yang tidak sesuai pada kasus ini. Abortus iminens dipertimbangkan bila terdapat perdarahan pervaginam dengan ostium yang masih tertutup, namun pasien tidak mengeluhkan perdarahan. Perlu ditegaskan bahwa penetapan kehamilan sebagai normal BUKAN berarti pengawasan dapat dikurangi, melainkan justru menjadi dasar untuk melakukan penapisan risiko secara sistematis pada setiap kunjungan — sebab sebagian besar komplikasi berat seperti preeklamsia, perdarahan, dan gawat janin justru berkembang pada kehamilan yang semula tergolong normal, dan sebagian besar kematian ibu terjadi karena keterlambatan mengenali tanda bahaya, keterlambatan mengambil keputusan merujuk, dan keterlambatan sampai di fasilitas rujukan.',
    terapiSuportif: [
      'Kebutuhan energi bertambah sekitar 180 kkal per hari pada trimester pertama dan sekitar 300 kkal per hari pada trimester kedua dan ketiga — bukan "makan untuk dua orang" sebagaimana keyakinan yang beredar',
      'Kebutuhan protein bertambah sekitar 20 gram per hari, diutamakan dari protein hewani yang lengkap asam aminonya',
      'ASAM FOLAT 400 mikrogram per hari idealnya dimulai sejak prakonsepsi hingga trimester pertama untuk mencegah defek tabung saraf; dosis lebih tinggi pada ibu dengan riwayat bayi defek tabung saraf, diabetes, atau penggunaan antiepilepsi',
      'TABLET TAMBAH DARAH mengandung 60 mg besi elemental dan 400 mikrogram asam folat, diminum satu tablet setiap hari minimal 90 tablet selama kehamilan',
      'Kalsium 1000 mg per hari, terutama pada ibu dengan asupan rendah karena menurunkan risiko preeklamsia',
      'Cairan minimal 2-2,5 liter per hari; asupan yodium cukup melalui garam beryodium',
      'Aspirin dosis rendah 75-150 mg per hari mulai usia 12-16 minggu pada ibu dengan risiko tinggi preeklamsia',
      'Imunisasi tetanus sesuai status imunisasi untuk mencegah tetanus neonatorum',
    ],
    tatalaksana: [
      'JADWAL ANTENATAL sesuai standar nasional: minimal ENAM kali kunjungan selama kehamilan, dengan minimal DUA kali pemeriksaan oleh DOKTER yaitu pada trimester pertama dan trimester ketiga — pemeriksaan oleh dokter pada trimester pertama disertai USG untuk memastikan kehamilan dan menghitung usia kehamilan',
      'Distribusi kunjungan: satu kali pada trimester pertama (sebelum 12 minggu), dua kali pada trimester kedua, dan tiga kali pada trimester ketiga',
      'Pelayanan 10 T pada setiap kunjungan: Timbang berat badan dan ukur tinggi badan, ukur Tekanan darah, nilai status gizi melalui lingkar lengan atas, ukur Tinggi fundus uteri, tentukan presentasi janin dan denyut jantung janin, skrining status imunisasi Tetanus, pemberian Tablet tambah darah, pemeriksaan laboratorium, Tatalaksana kasus, serta Temu wicara berupa konseling',
      'Skrining preeklamsia pada setiap kunjungan melalui pengukuran tekanan darah dan pemeriksaan protein urin',
      'Skrining dan tatalaksana anemia, kurang energi kronik, serta penyakit penyerta',
      'Rencana persalinan disusun bersama sejak trimester ketiga: tempat bersalin, penolong, transportasi, pendamping, calon pendonor darah, dan persiapan biaya — dikenal sebagai Program Perencanaan Persalinan dan Pencegahan Komplikasi',
      'Konseling kontrasepsi pascapersalinan sudah dimulai sejak masa antenatal, bukan menunggu setelah melahirkan',
      'Rujuk ke fasilitas dengan kemampuan lebih tinggi bila ditemukan faktor risiko atau komplikasi',
      'Hindari obat yang berisiko bagi janin; bila memerlukan obat untuk penyakit kronik, sesuaikan dengan pilihan yang aman dalam kehamilan bersama dokter',
    ],
    edukasi: [
      'Penjadwalan dan porsi makan: makan dengan porsi KECIL namun SERING, sekitar 5-6 kali sehari, terutama bila mual pada trimester pertama; sediakan biskuit atau roti kering untuk dimakan sebelum bangun dari tempat tidur pagi hari guna mengurangi mual',
      'Komposisi: gunakan prinsip isi piringku dengan penekanan pada protein hewani, sayur, buah, dan sumber zat besi; batasi makanan tinggi gula dan garam. HINDARI makanan mentah atau setengah matang termasuk daging, telur, dan ikan; hindari susu yang tidak dipasteurisasi; batasi kafein maksimal setara dua cangkir kopi per hari; dan HINDARI SEPENUHNYA alkohol serta rokok termasuk sebagai perokok pasif',
      'Minum tablet tambah darah pada malam hari sebelum tidur bersama air jeruk atau vitamin C untuk membantu penyerapan, dan JANGAN bersamaan dengan teh, kopi, atau susu; jelaskan bahwa tinja menjadi kehitaman adalah hal normal dan bukan alasan untuk berhenti minum',
      'JAM TIDUR: usahakan tidur malam 7-8 jam ditambah istirahat siang 1-2 jam; mulai trimester kedua biasakan tidur MIRING KE KIRI untuk memperbaiki aliran darah ke plasenta dan mencegah penekanan pada vena kava',
      'Pola olahraga: aktivitas fisik intensitas sedang seperti jalan kaki, senam hamil, atau berenang selama 30 menit sebanyak 3-5 kali per minggu aman dan bermanfaat pada kehamilan tanpa penyulit. HINDARI olahraga dengan risiko benturan atau jatuh, olahraga terlentang berkepanjangan setelah trimester pertama, menyelam, dan aktivitas pada suhu sangat panas. Hentikan dan periksakan bila timbul perdarahan, nyeri perut, kontraksi teratur, pusing, atau sesak berlebihan',
      'Hubungan seksual umumnya aman pada kehamilan normal, kecuali bila ada perdarahan, plasenta previa, ketuban pecah, atau riwayat persalinan preterm',
      'Perawatan payudara dan persiapan menyusui, serta edukasi inisiasi menyusu dini dan ASI eksklusif sejak masa kehamilan',
      'TANDA BAHAYA yang mengharuskan SEGERA ke fasilitas kesehatan: perdarahan pervaginam, keluar cairan ketuban, nyeri kepala hebat, pandangan kabur, nyeri ulu hati, bengkak pada wajah dan tangan, demam tinggi, kejang, muntah terus-menerus, nyeri perut hebat, dan GERAKAN JANIN BERKURANG atau tidak dirasakan',
      'Ajarkan cara menghitung gerakan janin pada trimester ketiga: dalam keadaan berbaring miring setelah makan, janin normalnya bergerak minimal 10 kali dalam 2 jam',
      'Jadwal kontrol: sesuai jadwal enam kali kunjungan minimal, dan lebih sering bila ditemukan faktor risiko; ingatkan tanggal kunjungan berikutnya pada setiap pertemuan',
      'Siapkan rencana persalinan sejak dini termasuk siapa yang mengantar, kendaraan, dan calon pendonor darah — kesiapan ini terbukti menurunkan keterlambatan yang menjadi penyebab utama kematian ibu',
    ],
    komplikasi: [
      'Hipertensi dalam kehamilan, preeklamsia, dan eklamsia',
      'Anemia dalam kehamilan dan kurang energi kronik',
      'Diabetes gestasional',
      'Perdarahan antepartum akibat plasenta previa atau solusio plasenta',
      'Persalinan preterm dan ketuban pecah dini',
      'Pertumbuhan janin terhambat dan kematian janin dalam rahim',
      'Infeksi saluran kemih hingga pielonefritis, serta infeksi yang menular ke janin',
      'Perdarahan pascapersalinan sebagai penyebab kematian maternal terbanyak',
      'Tromboemboli vena',
    ],
    prognosis:
      'Sangat baik pada kehamilan tanpa penyulit yang mendapat pelayanan antenatal teratur dan persalinan ditolong tenaga kesehatan terlatih di fasilitas yang memadai. Nilai terbesar pelayanan antenatal bukan terletak pada pengobatan melainkan pada PENAPISAN RISIKO dan EDUKASI, sebab sebagian besar komplikasi berat berkembang pada kehamilan yang semula dinilai normal dan tidak dapat diprediksi sepenuhnya sejak awal. Kematian ibu di Indonesia sebagian besar masih disebabkan tiga keterlambatan — terlambat mengenali tanda bahaya dan mengambil keputusan, terlambat mencapai fasilitas kesehatan, serta terlambat memperoleh penanganan yang tepat — sehingga edukasi tanda bahaya dan penyusunan rencana persalinan sejak masa kehamilan merupakan intervensi yang paling menentukan keselamatan ibu dan bayi.',
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022', 'PPKFKTP2014'],
  },
  'Infeksi intra-uterin: korioamnionitis': {
    definisi: 'Infeksi cairan amnion, membran, dan plasenta, umumnya asenden setelah ketuban pecah.',
    diagnosis: ['Demam ibu disertai: takikardia ibu, TAKIKARDIA JANIN, nyeri tekan uterus, cairan amnion berbau busuk, atau leukositosis; riwayat ketuban pecah lama atau pemeriksaan dalam berulang'],
    tatalaksana: ['Antibiotik IV spektrum luas SEGERA dan PERSALINAN (terminasi kehamilan) tanpa memandang usia kehamilan — melanjutkan kehamilan membahayakan ibu dan janin; antipiretik, siapkan resusitasi neonatus dan evaluasi sepsis neonatal'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Aborsi mengancam': {
    definisi: 'Abortus iminens — perdarahan pervaginam pada kehamilan <20 minggu dengan serviks masih tertutup dan janin hidup.',
    diagnosis: ['Perdarahan sedikit, nyeri perut ringan atau tidak ada, OSTIUM UTERI TERTUTUP, besar uterus sesuai usia kehamilan; USG menunjukkan janin hidup dengan denyut jantung positif'],
    tatalaksana: ['Istirahat cukup (tirah baring total tidak terbukti bermanfaat), hindari senggama, observasi perdarahan; progesteron dapat dipertimbangkan pada kasus tertentu; EDUKASI tanda perburukan dan kontrol ulang — sebagian besar kehamilan berlanjut normal'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Aborsi spontan inkomplit': {
    definisi: 'Abortus dengan sebagian hasil konsepsi masih tertinggal dalam kavum uteri.',
    diagnosis: ['Perdarahan banyak dapat sampai syok, nyeri perut, OSTIUM UTERI TERBUKA dengan jaringan teraba atau menonjol, besar uterus lebih kecil dari usia kehamilan; USG menunjukkan sisa jaringan'],
    tatalaksana: ['Nilai dan atasi syok lebih dahulu (resusitasi cairan, transfusi bila perlu), evakuasi sisa konsepsi dengan AVM/kuretase atau misoprostol, uterotonika, antibiotik bila ada tanda infeksi; berikan anti-D pada ibu Rh negatif; konseling kontrasepsi dan dukungan emosional'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Aborsi spontan komplit': {
    definisi: 'Abortus dengan seluruh hasil konsepsi telah keluar sehingga kavum uteri kosong.',
    diagnosis: ['Perdarahan berkurang setelah keluarnya jaringan lengkap, nyeri mereda, OSTIUM UTERI TERTUTUP, uterus mengecil; USG menunjukkan kavum uteri kosong tanpa sisa jaringan'],
    tatalaksana: ['Tidak perlu evakuasi; observasi perdarahan dan tanda infeksi, tablet tambah darah bila anemia, anti-D pada ibu Rh negatif; konseling bahwa sebagian besar abortus disebabkan kelainan kromosom dan bukan kesalahan ibu, konseling kontrasepsi dan rencana kehamilan berikutnya'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Inkompatibilitas darah': {
    definisi: 'Ketidakcocokan golongan darah ibu dan janin (tersering Rhesus) yang memicu antibodi maternal dan hemolisis janin.',
    diagnosis: ['Ibu Rh NEGATIF dengan janin Rh positif; uji Coombs indirek pada ibu untuk mendeteksi sensitisasi; pemantauan anemia janin dengan Doppler MCA; pada neonatus: ikterik dini <24 jam, anemia, Coombs direk positif'],
    tatalaksana: ['PENCEGAHAN: anti-D imunoglobulin pada ibu Rh negatif belum tersensitisasi — pada usia kehamilan 28 minggu, dalam 72 jam pascapersalinan bayi Rh positif, dan setelah kejadian berisiko (abortus, amniosentesis, trauma); bila sudah tersensitisasi: pemantauan ketat, transfusi intrauterin, fototerapi atau transfusi tukar pada neonatus'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'POGI2016'],
  },
  'Mola hidatidosa': {
    definisi: 'Kehamilan mola — proliferasi abnormal trofoblas membentuk vesikel seperti anggur, tergolong penyakit trofoblas gestasional.',
    diagnosis: ['Perdarahan pervaginam trimester pertama, uterus LEBIH BESAR dari usia kehamilan, hiperemesis berat, tidak ada denyut jantung janin, dapat disertai preeklampsia dini (<20 minggu) dan tanda hipertiroid; β-hCG sangat tinggi, USG menunjukkan gambaran badai salju (snowstorm)'],
    tatalaksana: ['Evakuasi dengan kuretase vakum dan siapkan darah (risiko perdarahan), pemeriksaan patologi; PEMANTAUAN β-hCG SERIAL sangat penting untuk deteksi dini keganasan trofoblas (koriokarsinoma); KONTRASEPSI wajib selama masa pemantauan (kehamilan baru mengacaukan interpretasi β-hCG)'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Hipertensi pada kehamilan': {
    definisi: 'Tekanan darah ≥140/90 mmHg dalam kehamilan; mencakup hipertensi kronik, hipertensi gestasional, preeklampsia, dan preeklampsia pada hipertensi kronik.',
    diagnosis: ['Hipertensi KRONIK bila terdeteksi sebelum 20 minggu atau menetap >12 minggu pascapersalinan; hipertensi GESTASIONAL bila muncul setelah 20 minggu TANPA proteinuria atau tanda kerusakan organ; nilai proteinuria dan gejala berat setiap kunjungan'],
    tatalaksana: ['Antihipertensi yang AMAN dalam kehamilan: metildopa, nifedipin, labetalol — KONTRAINDIKASI ACE-inhibitor dan ARB (teratogenik); aspirin dosis rendah sejak trimester pertama pada risiko tinggi preeklampsia; pemantauan ketat ibu dan pertumbuhan janin, edukasi tanda preeklampsia'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Preeklampsia': {
    definisi: 'Hipertensi yang muncul setelah 20 minggu kehamilan disertai proteinuria atau disfungsi organ, akibat gangguan plasentasi.',
    diagnosis: ['TD ≥140/90 setelah 20 minggu dengan proteinuria ≥300 mg/24 jam ATAU tanpa proteinuria bila ada disfungsi organ; TANDA BERAT: TD ≥160/110, trombosit <100.000, transaminase meningkat, kreatinin meningkat, edema paru, nyeri kepala hebat, gangguan penglihatan, nyeri epigastrium; sindrom HELLP merupakan varian berat'],
    tatalaksana: ['MgSO4 untuk PENCEGAHAN KEJANG pada preeklampsia berat (bukan antihipertensi) dengan pemantauan refleks patela, produksi urin, dan frekuensi napas — siapkan kalsium glukonas sebagai antidot; antihipertensi bila TD ≥160/110; TERMINASI KEHAMILAN adalah satu-satunya terapi definitif — waktu disesuaikan usia kehamilan dan kondisi ibu-janin; kortikosteroid pematangan paru bila preterm'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Eklampsia': {
    definisi: 'Kejang tonik-klonik pada pasien preeklampsia tanpa penyebab lain — kedaruratan obstetri.',
    diagnosis: ['Kejang pada wanita hamil/nifas dengan hipertensi dan proteinuria; dapat terjadi antepartum, intrapartum, atau pascapersalinan hingga beberapa hari; singkirkan epilepsi, stroke, dan gangguan metabolik'],
    tatalaksana: ['Amankan jalan napas dan posisi miring kiri, oksigen, cegah trauma saat kejang; MgSO4 dosis loading dan rumatan sebagai obat pilihan untuk menghentikan dan mencegah kejang berulang (BUKAN diazepam sebagai lini pertama), antihipertensi bila TD sangat tinggi; STABILKAN IBU DAHULU baru terminasi kehamilan — jangan seksio dalam keadaan kejang; rujuk fasilitas dengan kemampuan bedah dan perawatan intensif'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Diabetes gestasional': {
    definisi: 'Intoleransi glukosa yang pertama kali terdeteksi dalam kehamilan.',
    diagnosis: ['Skrining dengan TTGO 75 g pada usia kehamilan 24-28 minggu (atau lebih dini bila faktor risiko tinggi); nilai ambang glukosa puasa, 1 jam, dan 2 jam sesuai kriteria yang dipakai; faktor risiko: obesitas, riwayat DMG, riwayat bayi besar, riwayat keluarga DM'],
    tatalaksana: ['Terapi nutrisi medis dan aktivitas fisik sebagai lini pertama dengan pemantauan gula darah mandiri; INSULIN bila target tidak tercapai (obat pilihan dalam kehamilan), metformin pada kasus tertentu; pantau pertumbuhan janin (risiko makrosomia dan distosia bahu); SKRINING ULANG DM 6-12 minggu pascapersalinan karena risiko DM tipe 2 di kemudian hari tinggi'],
    referensi: ['SKDI2012', 'POGI2016', 'PERKENI2021'],
  },
  'Kehamilan posterm': {
    definisi: 'Kehamilan yang berlanjut hingga 42 minggu atau lebih.',
    diagnosis: ['Usia kehamilan ≥42 minggu berdasarkan HPHT yang akurat atau USG trimester pertama (penentuan usia kehamilan yang tepat sangat penting untuk menghindari diagnosis palsu); nilai kesejahteraan janin dan volume cairan amnion'],
    tatalaksana: ['Pemantauan kesejahteraan janin (NST, indeks cairan amnion) mulai usia 41 minggu, induksi persalinan umumnya ditawarkan pada 41-42 minggu untuk menurunkan risiko; waspadai komplikasi: insufisiensi plasenta, oligohidramnion, aspirasi mekonium, makrosomia'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Insufisiensi plasenta': {
    definisi: 'Gangguan fungsi plasenta yang menyebabkan pasokan oksigen dan nutrisi ke janin tidak adekuat.',
    diagnosis: ['Tinggi fundus uteri kurang dari usia kehamilan, gerak janin berkurang, pertumbuhan janin terhambat pada USG serial; Doppler arteri umbilikalis menunjukkan resistensi meningkat hingga absent/reversed end-diastolic flow pada kasus berat'],
    tatalaksana: ['Pemantauan ketat kesejahteraan janin (Doppler serial, NST, profil biofisik), kortikosteroid pematangan paru bila preterm, MgSO4 neuroprotektif pada usia kehamilan sangat muda; TERMINASI bila terdapat tanda gawat janin — penentuan waktu menyeimbangkan risiko prematuritas dengan risiko intrauterin'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Plasenta previa': {
    definisi: 'Plasenta menutupi sebagian atau seluruh ostium uteri internum.',
    diagnosis: ['Perdarahan pervaginam MERAH SEGAR, TANPA NYERI, berulang pada trimester ketiga; uterus lunak dan tidak nyeri, bagian terbawah janin belum masuk panggul, sering malpresentasi; DIAGNOSIS DENGAN USG — PEMERIKSAAN DALAM MUTLAK DIHINDARI karena dapat memicu perdarahan masif'],
    tatalaksana: ['Rawat inap, JANGAN periksa dalam, pasang akses IV besar dan siapkan darah, kortikosteroid pematangan paru bila preterm; ekspektatif dengan pemantauan bila perdarahan berhenti dan janin preterm; SEKSIO SESAREA adalah cara persalinan pada plasenta previa; waspadai plasenta akreta terutama pada riwayat seksio sebelumnya'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Vasa previa': {
    definisi: 'Pembuluh darah janin melintasi ostium uteri internum tanpa perlindungan tali pusat atau plasenta.',
    diagnosis: ['Perdarahan pervaginam saat ketuban pecah disertai BRADIKARDIA JANIN mendadak — perdarahan berasal dari JANIN sehingga volume kecil pun fatal bagi janin; USG Doppler transvaginal antenatal dapat mendeteksi; faktor risiko: insersi velamentosa, plasenta bilobata, plasenta previa'],
    tatalaksana: ['Bila terdiagnosis antenatal: rawat inap, kortikosteroid, dan SEKSIO SESAREA ELEKTIF terjadwal sebelum inpartu (sekitar 34-36 minggu); bila terjadi ruptur: seksio sesarea darurat segera dan siapkan resusitasi neonatus dengan transfusi — angka kematian janin sangat tinggi bila tidak terdiagnosis sebelumnya'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'POGI2016'],
  },
  'Abrupsio plasenta': {
    definisi: 'Solusio plasenta — terlepasnya plasenta yang berimplantasi normal sebelum janin lahir.',
    diagnosis: ['Perdarahan pervaginam berwarna KEHITAMAN dengan NYERI PERUT HEBAT, uterus TEGANG dan nyeri (uterus seperti papan), gawat janin atau kematian janin; perdarahan dapat tersembunyi (retroplasenta) sehingga syok tampak tidak sebanding perdarahan yang terlihat; faktor risiko: hipertensi, trauma, riwayat solusio, merokok'],
    tatalaksana: ['Resusitasi agresif dan siapkan darah, pantau koagulasi (risiko DIC), pasang kateter untuk pantau produksi urin; TERMINASI KEHAMILAN segera — seksio sesarea bila janin hidup dengan gawat janin, persalinan pervaginam dapat dipertimbangkan bila janin sudah meninggal dan ibu stabil; waspadai atonia uteri dan DIC pascapersalinan'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Inkompeten serviks': {
    definisi: 'Ketidakmampuan serviks mempertahankan kehamilan akibat kelemahan struktural, menyebabkan pembukaan tanpa kontraksi.',
    diagnosis: ['Riwayat kehilangan kehamilan trimester kedua yang berulang, TANPA NYERI dan tanpa kontraksi bermakna, dengan pembukaan serviks progresif; USG transvaginal menunjukkan pemendekan serviks dan funneling; faktor risiko: riwayat konisasi, trauma serviks, kelainan kongenital'],
    tatalaksana: ['Serklase serviks (profilaksis berdasarkan riwayat pada 12-14 minggu, atau berdasarkan USG/pemeriksaan), progesteron vaginal untuk serviks pendek; batasi aktivitas berat; pelepasan serklase pada 36-37 minggu atau bila inpartu/ketuban pecah'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Polihidramnion': {
    definisi: 'Cairan amnion berlebih (indeks cairan amnion >24 cm atau kantong tunggal terdalam >8 cm).',
    diagnosis: ['Uterus lebih besar dari usia kehamilan, bagian janin sulit diraba, DJJ sulit didengar, sesak pada ibu; USG mengukur volume; cari penyebab: DM maternal, kelainan janin (atresia esofagus/duodenum, anensefali — gangguan menelan), kehamilan ganda, hidrops'],
    tatalaksana: ['Cari dan atasi penyebab (kontrol gula darah pada DM, evaluasi anomali janin), amnioreduksi bila gejala berat pada ibu, indometasin pada usia kehamilan tertentu; WASPADAI saat ketuban pecah: risiko prolaps tali pusat dan solusio plasenta akibat dekompresi mendadak; siapkan penanganan atonia uteri pascapersalinan'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'POGI2016'],
  },
  'Kelainan letak janin setelah 36 minggu': {
    definisi: 'Presentasi janin selain kepala (sungsang, lintang, oblik) yang menetap mendekati aterm.',
    diagnosis: ['Pemeriksaan Leopold menunjukkan kepala di fundus (sungsang) atau bagian terbawah kosong dengan kepala di samping (lintang); konfirmasi USG termasuk lokasi plasenta dan taksiran berat janin'],
    tatalaksana: ['Versi luar (external cephalic version) dapat ditawarkan pada 36-37 minggu bila tidak ada kontraindikasi; LETAK LINTANG yang menetap merupakan indikasi mutlak seksio sesarea (persalinan pervaginam tidak mungkin, risiko ruptur uteri dan prolaps tali pusat); sungsang: seksio umumnya lebih aman, persalinan pervaginam hanya pada kriteria ketat dan penolong berpengalaman'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Kehamilan ganda': {
    definisi: 'Kehamilan dengan dua janin atau lebih; korionisitas menentukan risiko komplikasi.',
    diagnosis: ['Uterus lebih besar dari usia kehamilan, teraba banyak bagian kecil janin, dua DJJ berbeda; USG menegakkan jumlah janin dan KORIONISITAS (paling akurat pada trimester pertama — monokorionik berisiko twin-to-twin transfusion syndrome)'],
    tatalaksana: ['Antenatal care lebih ketat dengan USG serial (lebih sering pada monokorionik), suplementasi besi dan asam folat lebih tinggi, edukasi tanda persalinan preterm; rencana persalinan sesuai presentasi janin pertama dan korionisitas; WASPADAI komplikasi: preeklampsia, anemia, persalinan preterm, dan perdarahan pascapersalinan akibat overdistensi uterus'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Janin tumbuh lambat': {
    definisi: 'Pertumbuhan janin terhambat (IUGR) — taksiran berat janin di bawah persentil 10 untuk usia kehamilan.',
    diagnosis: ['Tinggi fundus uteri kurang dari usia kehamilan, taksiran berat janin <persentil 10 pada USG serial; Doppler arteri umbilikalis menilai derajat gangguan; cari penyebab: insufisiensi plasenta, hipertensi/preeklampsia, infeksi TORCH, merokok, gizi buruk, kelainan janin'],
    tatalaksana: ['Atasi penyebab yang dapat dikoreksi, perbaikan gizi ibu dan berhenti merokok, pemantauan kesejahteraan janin ketat (Doppler, NST, profil biofisik), kortikosteroid bila preterm; penentuan waktu persalinan berdasarkan hasil Doppler dan pemantauan — terminasi bila terdapat tanda perburukan'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Kelainan janin': {
    definisi: 'Anomali kongenital struktural atau kromosomal pada janin.',
    diagnosis: ['Skrining USG anomali pada 18-22 minggu, penanda biokimia dan NIPT untuk risiko kromosomal, USG serial bila ada temuan; polihidramnion atau oligohidramnion dapat menjadi petunjuk; amniosentesis/CVS untuk konfirmasi kariotipe pada indikasi'],
    tatalaksana: ['Konseling menyeluruh dan empatik oleh tim multidisiplin mengenai prognosis dan pilihan, rencana persalinan di fasilitas dengan kemampuan neonatal yang sesuai, persiapan bedah neonatal bila diperlukan; PENCEGAHAN: asam folat prakonsepsi, hindari teratogen, kontrol DM sebelum hamil, imunisasi rubela'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'POGI2016'],
  },
  'Diproporsi kepala panggul': {
    definisi: 'Cephalopelvic disproportion — ketidaksesuaian ukuran kepala janin dengan panggul ibu sehingga persalinan pervaginam terhambat.',
    diagnosis: ['Persalinan tidak maju meski his adekuat, kepala tidak turun, kaput suksedaneum dan molase berat, tanda Osborn positif; pelvimetri klinis; WASPADAI tanda ruptur uteri mengancam: lingkaran Bandl, uterus tegang terus-menerus, nyeri hebat, hematuria'],
    tatalaksana: ['SEKSIO SESAREA adalah tatalaksana definitif — jangan memaksakan persalinan pervaginam atau memberi oksitosin pada disproporsi nyata (risiko ruptur uteri); rujuk segera ke fasilitas dengan kemampuan bedah; hindari dorongan fundus'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Intra-Uterine Fetal Death (IUFD)': {
    definisi: 'Kematian janin dalam rahim pada usia kehamilan ≥20 minggu sebelum persalinan.',
    diagnosis: ['Gerak janin tidak dirasakan, tinggi fundus tidak bertambah atau berkurang, DJJ tidak terdengar; USG mengonfirmasi tidak ada denyut jantung janin (konfirmasi oleh dua pemeriksa bila memungkinkan); cari penyebab: preeklampsia, DM, solusio, infeksi, kelainan tali pusat, anomali janin'],
    tatalaksana: ['Sampaikan berita dengan empati dan beri waktu bagi keluarga; induksi persalinan (umumnya pervaginam lebih aman daripada seksio), pantau koagulasi bila retensi lama (risiko DIC); dukungan psikologis dan konseling duka, tawarkan pemeriksaan untuk mencari penyebab guna konseling kehamilan berikutnya, supresi laktasi'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Persalinan preterm': {
    definisi: 'Persalinan yang terjadi pada usia kehamilan 20 hingga kurang dari 37 minggu.',
    diagnosis: ['Kontraksi teratur disertai perubahan serviks pada usia kehamilan <37 minggu; panjang serviks USG dan fibronektin janin membantu memprediksi; cari pencetus: infeksi (ISK, vaginosis, korioamnionitis), ketuban pecah dini, kehamilan ganda, polihidramnion'],
    tatalaksana: ['KORTIKOSTEROID pematangan paru (deksametason/betametason) pada 24-34 minggu — intervensi dengan manfaat terbesar bagi luaran neonatus; tokolitik untuk menunda persalinan 48 jam agar steroid bekerja dan rujukan dapat dilakukan; MgSO4 neuroprotektif bila <32 minggu; antibiotik profilaksis GBS; RUJUK ke fasilitas dengan NICU (transfer in utero lebih baik daripada transfer neonatus)'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Ruptur uteri': {
    definisi: 'Robekan dinding uterus — kedaruratan obstetri dengan mortalitas ibu dan janin tinggi.',
    diagnosis: ['Nyeri perut hebat mendadak, kontraksi berhenti, bagian janin mudah teraba di luar uterus, DJJ hilang atau bradikardia berat, syok yang tidak sebanding perdarahan tampak, hematuria; TANDA MENGANCAM: lingkaran Bandl, uterus tegang terus, ligamentum rotundum tegang; faktor risiko: bekas seksio, partus lama, penggunaan oksitosin tidak terkontrol, dorongan fundus'],
    tatalaksana: ['LAPAROTOMI DARURAT segera bersamaan resusitasi agresif dan transfusi — jangan menunda untuk stabilisasi lengkap; repair uterus atau histerektomi sesuai luas robekan dan kondisi ibu; PENCEGAHAN: partograf untuk deteksi partus lama, hati-hati pada bekas seksio, jangan lakukan dorongan fundus'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Bayi post matur': {
    definisi: 'Sindrom postmaturitas — neonatus dengan tanda dismaturitas akibat insufisiensi plasenta pada kehamilan lewat waktu.',
    diagnosis: ['Kulit keriput mengelupas, lemak subkutan sedikit, kuku panjang, kulit dan tali pusat terwarnai mekonium, tampak waspada seperti "orang tua"; risiko aspirasi mekonium, hipoglikemia, dan polisitemia'],
    tatalaksana: ['Siapkan resusitasi neonatus dengan kewaspadaan aspirasi mekonium, pantau dan koreksi hipoglikemia sedini mungkin, jaga suhu tubuh, pantau hematokrit; PENCEGAHAN melalui penentuan usia kehamilan akurat dan penatalaksanaan kehamilan posterm yang tepat'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'POGI2016'],
  },
  'Distosia': {
    definisi: 'Persalinan macet atau sulit akibat gangguan tenaga (power), jalan lahir (passage), atau janin (passenger).',
    diagnosis: ['Kemajuan persalinan melewati garis waspada/bertindak pada PARTOGRAF; identifikasi penyebab: his tidak adekuat, disproporsi kepala panggul, malpresentasi/malposisi; DISTOSIA BAHU merupakan kedaruratan intrapartum dengan tanda turtle sign'],
    tatalaksana: ['Koreksi penyebab: augmentasi oksitosin bila his tidak adekuat dan tidak ada disproporsi, seksio bila disproporsi atau malpresentasi; DISTOSIA BAHU: manuver McRoberts dan tekanan suprapubik sebagai langkah pertama (JANGAN tekan fundus), lanjut manuver internal bila perlu — siapkan penanganan cedera pleksus brakialis dan asfiksia'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Malpresentasi': {
    definisi: 'Presentasi janin selain verteks (sungsang, muka, dahi, bahu/lintang).',
    diagnosis: ['Pemeriksaan Leopold dan pemeriksaan dalam menentukan bagian terbawah dan denominator; konfirmasi USG; presentasi DAHI dan LINTANG umumnya tidak dapat lahir pervaginam pada janin aterm'],
    tatalaksana: ['Tentukan cara persalinan sesuai jenis: presentasi muka dengan dagu anterior dapat pervaginam, dagu posterior memerlukan seksio; presentasi dahi dan letak lintang memerlukan seksio; sungsang sesuai kriteria dan pengalaman penolong; rujuk ke fasilitas dengan kemampuan bedah'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Partus lama': {
    definisi: 'Persalinan yang berlangsung melewati batas waktu normal untuk masing-masing kala.',
    diagnosis: ['Kemajuan pembukaan serviks melewati garis bertindak pada partograf, kala dua memanjang; nilai his, kondisi janin, dan tanda disproporsi; komplikasi: kelelahan dan dehidrasi ibu, gawat janin, infeksi, ruptur uteri, fistula obstetri'],
    tatalaksana: ['Hidrasi dan dukungan ibu, evaluasi ulang his dan kemungkinan disproporsi; augmentasi oksitosin HANYA bila tidak ada disproporsi atau malpresentasi; persalinan operatif (vakum/forsep pada syarat terpenuhi, atau seksio) sesuai indikasi; antibiotik bila ketuban pecah lama; kateterisasi untuk cegah retensi dan fistula'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Prolaps tali pusat': {
    definisi: 'Turunnya tali pusat mendahului atau di samping bagian terbawah janin setelah ketuban pecah — kedaruratan obstetri.',
    diagnosis: ['Tali pusat teraba atau tampak di vagina setelah ketuban pecah, disertai BRADIKARDIA JANIN atau deselerasi variabel berat; faktor risiko: malpresentasi, polihidramnion, prematuritas, kehamilan ganda, bagian terbawah belum masuk panggul'],
    tatalaksana: ['SEKSIO SESAREA DARURAT segera; sambil menyiapkan: posisi Trendelenburg atau knee-chest, TAHAN bagian terbawah janin ke atas dengan tangan pemeriksa untuk mengurangi kompresi tali pusat (jangan dilepas hingga bayi lahir), oksigen ibu, isi kandung kemih dengan salin sebagai alternatif, JANGAN mendorong tali pusat kembali ke dalam'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Hipoksia janin': {
    definisi: 'Gawat janin — berkurangnya oksigenasi janin yang dapat menyebabkan asidosis dan kerusakan organ.',
    diagnosis: ['DJJ abnormal: bradikardia <110 atau takikardia >160 menetap, deselerasi lambat atau variabel berat, variabilitas menghilang; cairan amnion bercampur mekonium kental; kategori kardiotokografi menilai derajat'],
    tatalaksana: ['Resusitasi intrauterin: posisi miring KIRI, oksigen ibu, hentikan oksitosin, koreksi hipotensi dengan cairan, singkirkan prolaps tali pusat; bila tidak membaik lakukan PERSALINAN SEGERA melalui cara tercepat dan teraman; siapkan tim resusitasi neonatus'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Ruptur serviks': {
    definisi: 'Robekan serviks saat persalinan, penyebab penting perdarahan pascapersalinan dengan uterus berkontraksi baik.',
    diagnosis: ['Perdarahan aktif merah segar pascapersalinan meski UTERUS BERKONTRAKSI BAIK dan plasenta lengkap; eksplorasi serviks dengan spekulum dan klem ovum menemukan robekan; faktor risiko: persalinan operatif pervaginam, mengejan sebelum pembukaan lengkap, partus presipitatus'],
    tatalaksana: ['Eksplorasi sistematis dengan penerangan dan asisten yang baik, penjahitan robekan dengan jahitan mulai di atas apeks robekan; resusitasi cairan/darah sesuai kehilangan; rujuk bila robekan meluas ke segmen bawah uterus atau parametrium'],
    referensi: ['SKDI2012', 'POGI2016', 'WHOPPH2012'],
  },
  'Ruptur perineum tingkat 1-2': {
    definisi: 'Robekan perineum derajat 1 (kulit dan mukosa) dan derajat 2 (mengenai otot perineum tanpa sfingter ani).',
    diagnosis: ['Inspeksi perineum setelah persalinan; derajat 1 mengenai mukosa vagina dan kulit perineum, derajat 2 meluas ke otot perineum; WAJIB colok dubur untuk memastikan sfingter ani utuh sebelum menyimpulkan derajat'],
    tatalaksana: ['Anestesi lokal adekuat, penjahitan lapis demi lapis dengan benang absorbable (derajat 1 kecil tanpa perdarahan dapat tidak dijahit), pastikan hemostasis dan tidak ada kasa tertinggal; perawatan: jaga kebersihan dan kekeringan perineum, analgesia, pelunak tinja; edukasi tanda infeksi'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Ruptur perineum tingkat 3-4': {
    definisi: 'Robekan perineum yang mengenai sfingter ani (derajat 3) hingga mukosa rektum (derajat 4).',
    diagnosis: ['COLOK DUBUR WAJIB untuk menilai integritas sfingter ani dan mukosa rektum pada setiap robekan perineum; derajat 3 mengenai sfingter ani (dibagi 3a, 3b, 3c), derajat 4 menembus mukosa anorektal'],
    tatalaksana: ['RUJUK untuk repair oleh penolong terlatih di kamar operasi dengan anestesi dan penerangan adekuat — repair yang tidak tepat menyebabkan INKONTINENSIA ALVI dan fistula permanen; antibiotik profilaksis, pelunak tinja, hindari konstipasi; fisioterapi dasar panggul dan pemantauan fungsi kontinensia jangka panjang'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Retensi plasenta': {
    definisi: 'Plasenta belum lahir dalam 30 menit setelah bayi lahir dengan manajemen aktif kala tiga.',
    diagnosis: ['Plasenta tidak lahir dalam 30 menit, dapat disertai perdarahan; bedakan plasenta terperangkap (serviks berkontraksi), gangguan kontraksi, dan plasenta akreta (melekat abnormal pada miometrium)'],
    tatalaksana: ['Manajemen aktif: oksitosin, peregangan tali pusat terkendali dengan counter-traction; bila gagal lakukan MANUAL PLASENTA dengan analgesia dan teknik aseptik, dilanjutkan uterotonika dan antibiotik profilaksis; JANGAN memaksa pelepasan bila dicurigai akreta (perdarahan masif) — siapkan rujukan, transfusi, dan kemungkinan histerektomi'],
    referensi: ['SKDI2012', 'WHOPPH2012', 'POGI2016'],
  },
  'Inversio uterus': {
    definisi: 'Uterus terbalik dengan fundus masuk ke dalam kavum hingga dapat keluar melalui serviks — kedaruratan obstetri.',
    diagnosis: ['Perdarahan pascapersalinan disertai SYOK YANG TIDAK SEBANDING dengan perdarahan (komponen neurogenik), nyeri hebat, fundus uteri tidak teraba di abdomen, massa merah keluar dari vagina; faktor risiko: tarikan tali pusat berlebihan, tekanan fundus, plasenta akreta'],
    tatalaksana: ['REPOSISI SEGERA sebelum lingkaran konstriksi terbentuk (semakin cepat semakin mudah) — manuver Johnson dengan mendorong fundus melalui vagina; resusitasi cairan dan analgesia/anestesi, JANGAN lepaskan plasenta sebelum reposisi berhasil, tokolitik untuk relaksasi bila perlu; setelah berhasil berikan uterotonika; laparotomi bila reposisi manual gagal'],
    referensi: ['SKDI2012', 'WHOPPH2012', 'POGI2016'],
  },
  'Perdarahan post partum': {
    definisi: 'Perdarahan ≥500 mL setelah persalinan pervaginam atau ≥1000 mL setelah seksio, atau perdarahan yang menyebabkan gangguan hemodinamik.',
    diagnosis: ['Cari penyebab dengan 4T: TONE (atonia uteri — tersering, uterus lembek), TISSUE (sisa plasenta), TRAUMA (robekan jalan lahir, ruptur uteri, inversio), THROMBIN (gangguan pembekuan); nilai jumlah perdarahan dan tanda syok'],
    tatalaksana: ['Panggil bantuan, ABC, dua akses IV besar, resusitasi cairan/darah, kateter urin; ATONIA: masase uterus, oksitosin lini pertama, dilanjutkan uterotonika lain (misoprostol, metilergometrin — kontraindikasi pada hipertensi), ASAM TRANEKSAMAT dalam 3 jam pertama; kompresi bimanual dan kompresi aorta sebagai tindakan sementara, tamponade balon uterus, lalu tindakan bedah (jahitan B-Lynch, ligasi arteri, histerektomi) bila gagal; PENCEGAHAN: manajemen aktif kala tiga pada semua persalinan'],
    referensi: ['SKDI2012', 'WHOPPH2012', 'POGI2016'],
  },
  'Tromboemboli': {
    definisi: 'Trombosis vena dalam dan emboli paru pada kehamilan dan nifas — kehamilan merupakan keadaan hiperkoagulasi.',
    diagnosis: ['DVT: bengkak tungkai unilateral (lebih sering KIRI dalam kehamilan), nyeri, hangat; Emboli paru: sesak mendadak, nyeri dada, takikardia; D-dimer kurang bermanfaat dalam kehamilan (fisiologis meningkat) — gunakan USG Doppler kompresi dan pencitraan paru dengan proteksi janin'],
    tatalaksana: ['LMWH sebagai antikoagulan pilihan dalam kehamilan (tidak melewati plasenta) — WARFARIN KONTRAINDIKASI pada trimester pertama karena teratogenik; lanjutkan hingga minimal 6 minggu pascapersalinan; hentikan sementara menjelang persalinan/anestesi neuraksial; PENCEGAHAN: mobilisasi dini, stoking kompresi, dan profilaksis pada pasien berisiko tinggi'],
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'BRAUNWALD2022'],
  },
  'Inkontinensia urine': {
    definisi: 'Keluarnya urin tanpa disadari; pada wanita sering terkait kelemahan dasar panggul pascapersalinan atau menopause.',
    diagnosis: ['Tipe stres: keluar saat batuk, bersin, tertawa, atau mengangkat beban (uji batuk positif); Tipe urgensi: didahului dorongan berkemih kuat mendadak; Campuran; nilai residu urin dan singkirkan ISK serta prolaps organ panggul'],
    tatalaksana: ['LATIHAN OTOT DASAR PANGGUL (Kegel) yang benar dan konsisten sebagai lini pertama untuk tipe stres, penurunan BB, kurangi kafein; bladder training dan antimuskarinik untuk tipe urgensi; pesarium atau bedah (sling) bila konservatif gagal; estrogen topikal pada atrofi pascamenopause'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'POGI2016'],
  },
  'Inkontinensia feses': {
    definisi: 'Ketidakmampuan menahan feses atau flatus, pada wanita sering akibat cedera sfingter ani saat persalinan.',
    diagnosis: ['Riwayat robekan perineum derajat 3-4 atau persalinan operatif pervaginam, colok dubur menilai tonus sfingter, USG endoanal menilai defek sfingter; nilai dampak psikososial yang sering besar dan tidak dilaporkan pasien kecuali ditanya'],
    tatalaksana: ['Pengaturan konsistensi tinja (serat, antidiare), latihan otot dasar panggul dan biofeedback, perawatan kulit perianal; repair sfingter atau sakral neuromodulasi pada kasus terpilih; TANYAKAN AKTIF pada pasien pascapersalinan berisiko karena pasien sering malu melaporkan'],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'POGI2016'],
  },
  'Subinvolusio uterus': {
    definisi: 'Kegagalan uterus mengecil kembali sebagaimana mestinya pada masa nifas.',
    diagnosis: ['Uterus lebih besar dan lebih lunak dari yang seharusnya untuk hari nifas, lokia berlebih atau berbau, dapat disertai perdarahan; cari penyebab: sisa plasenta, endometritis, mioma'],
    tatalaksana: ['Uterotonika (oksitosin/metilergometrin), antibiotik bila ada endometritis, USG untuk mencari sisa jaringan dan kuretase bila ada; mobilisasi dan menyusui membantu involusi; evaluasi anemia'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Kista dan abses kelenjar bartolini': {
    definisi: 'Sumbatan duktus kelenjar Bartholin membentuk kista, yang dapat terinfeksi menjadi abses.',
    diagnosis: ['Benjolan unilateral di sepertiga posterior labia mayora; kista umumnya tidak nyeri, abses sangat nyeri dengan eritema dan fluktuasi, dapat disertai demam; pada wanita >40 tahun pertimbangkan biopsi untuk singkirkan keganasan'],
    tatalaksana: ['Kista asimtomatik: observasi dan rendam duduk hangat; ABSES: insisi dan drainase dengan pemasangan kateter Word atau MARSUPIALISASI untuk mencegah rekurensi (insisi drainase sederhana sering kambuh); antibiotik bila selulitis luas atau imunokompromais; skrining gonore/klamidia'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Abses folikel rambut atau kelenjar sebasea': {
    definisi: 'Infeksi folikel rambut atau kelenjar sebasea pada area genital eksterna membentuk abses.',
    diagnosis: ['Nodul nyeri dengan eritema dan fluktuasi pada vulva atau area pubis, dapat disertai demam; bedakan dari abses Bartholin berdasarkan lokasi (superfisial, bukan di sepertiga posterior labia mayora)'],
    tatalaksana: ['Kompres hangat pada lesi dini, INSISI DAN DRAINASE bila sudah fluktuatif, antibiotik antistafilokokus bila selulitis luas/demam/imunokompromais; higiene, hindari mencukur pada area terkena; skrining DM bila rekuren'],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'PPKFKTP2014'],
  },
  'Malformasi kongenital': {
    definisi: 'Kelainan bawaan organ genitalia eksterna dan interna wanita, termasuk himen imperforata dan agenesis vagina.',
    diagnosis: ['Himen imperforata: amenore primer dengan nyeri perut siklik dan membran menonjol kebiruan; agenesis vagina/uterus (sindrom Mayer-Rokitansky): amenore primer dengan karakteristik seks sekunder normal; USG dan MRI menilai anatomi, evaluasi ginjal (sering menyertai)'],
    tatalaksana: ['Himen imperforata: insisi/eksisi himen untuk drainase; agenesis vagina: dilatasi vagina atau rekonstruksi bedah pada waktu yang tepat; konseling menyeluruh mengenai fertilitas dan dukungan psikologis, rujuk ginekologi'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Kistokel': {
    definisi: 'Sistokel — penurunan dinding vagina anterior akibat kelemahan penyangga sehingga kandung kemih menonjol ke dalam vagina.',
    diagnosis: ['Rasa mengganjal atau benjolan keluar dari vagina yang memberat saat berdiri lama dan mengejan, gangguan berkemih (pengosongan tidak tuntas, perlu reposisi manual untuk berkemih); pemeriksaan dengan spekulum saat mengejan menilai derajat'],
    tatalaksana: ['Latihan otot dasar panggul, penurunan BB, hindari mengangkat berat dan atasi konstipasi serta batuk kronik; pesarium sebagai pilihan non-bedah; bedah rekonstruksi bila gejala mengganggu dan konservatif gagal'],
    referensi: ['SKDI2012', 'POGI2016', 'CAMPBELL2016'],
  },
  'Rektokel': {
    definisi: 'Penurunan dinding vagina posterior sehingga rektum menonjol ke dalam vagina.',
    diagnosis: ['Rasa mengganjal, kesulitan defekasi dengan sensasi tidak tuntas, kadang perlu penekanan dinding vagina posterior (splinting) untuk membantu BAB; pemeriksaan vagina dan colok dubur saat mengejan'],
    tatalaksana: ['Pelunak tinja dan diet tinggi serat untuk hindari mengejan, latihan otot dasar panggul, pesarium; kolporafi posterior bila gejala berat dan gagal konservatif'],
    referensi: ['SKDI2012', 'POGI2016', 'SLEISENGER2021'],
  },
  'Kista Gartner': {
    definisi: 'Kista pada dinding lateral vagina yang berasal dari sisa duktus Wolffian (mesonefrik).',
    diagnosis: ['Massa kistik di dinding lateral vagina, umumnya kecil dan asimtomatik ditemukan saat pemeriksaan rutin; bila besar dapat menimbulkan rasa mengganjal atau dispareunia; evaluasi saluran kemih karena dapat menyertai anomali'],
    tatalaksana: ['Observasi bila kecil dan asimtomatik; eksisi bila besar, simtomatik, atau diagnosis meragukan — hati-hati karena dapat berhubungan dengan struktur saluran kemih'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Fistula (vesiko-vaginal, uretero-vagina, rektovagina)': {
    definisi: 'Hubungan abnormal antara traktus genital dengan saluran kemih atau rektum, tersering akibat persalinan macet berkepanjangan (fistula obstetri).',
    diagnosis: ['Vesikovaginal: keluar urin terus-menerus dari vagina tanpa disadari; Rektovaginal: keluar feses atau flatus melalui vagina; riwayat partus lama, persalinan macet, bedah panggul, atau radioterapi; uji metilen biru dan sistoskopi untuk lokalisasi'],
    tatalaksana: ['Rujuk ke pusat rujukan untuk repair bedah oleh operator berpengalaman (waktu repair disesuaikan kondisi jaringan), kateter menetap dan perawatan kulit sementara; DAMPAK PSIKOSOSIAL BESAR (isolasi sosial) sehingga dukungan psikologis penting; PENCEGAHAN melalui akses persalinan aman dan penggunaan partograf'],
    referensi: ['SKDI2012', 'POGI2016', 'CAMPBELL2016'],
  },
  'Kista Nabotian': {
    definisi: 'Kista retensi kelenjar endoserviks akibat sumbatan muara oleh epitel skuamosa, temuan jinak yang sangat umum.',
    diagnosis: ['Tampak sebagai benjolan kecil translusen kekuningan pada permukaan serviks saat inspekulo, asimtomatik; merupakan proses fisiologis penyembuhan metaplasia'],
    tatalaksana: ['Tidak perlu terapi — REASSURANCE bahwa ini temuan jinak; tetap lakukan skrining kanker serviks sesuai jadwal; eksisi hanya bila sangat besar dan simtomatik atau diagnosis meragukan'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Polip serviks': {
    definisi: 'Pertumbuhan jinak bertangkai dari mukosa endoserviks atau ektoserviks.',
    diagnosis: ['Sering asimtomatik; dapat menyebabkan perdarahan pascasenggama, perdarahan di luar haid, atau duh; tampak sebagai massa kemerahan bertangkai keluar dari kanalis servikalis saat inspekulo'],
    tatalaksana: ['Ekstirpasi polip dengan puntiran (mudah dilakukan) dan KIRIM UNTUK PEMERIKSAAN PATOLOGI untuk menyingkirkan keganasan; lakukan skrining kanker serviks bersamaan; evaluasi lanjut bila perdarahan menetap setelah polip diangkat'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Malformasi kongenital uterus': {
    definisi: 'Kelainan bentuk uterus akibat gangguan fusi atau resorpsi duktus Mülleri (uterus septus, bikornis, didelfis, unikornis).',
    diagnosis: ['Sering ditemukan saat evaluasi abortus berulang, persalinan preterm, malpresentasi, atau infertilitas; USG 3D, histerosalpingografi, atau MRI untuk klasifikasi; evaluasi ginjal karena sering menyertai anomali saluran kemih'],
    tatalaksana: ['Banyak kasus tidak memerlukan tindakan; reseksi septum histeroskopik pada uterus septus dengan riwayat kehilangan kehamilan berulang (bentuk yang paling terbukti bermanfaat dikoreksi); pemantauan kehamilan lebih ketat karena risiko malpresentasi dan persalinan preterm'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Prolaps uterus, sistokel, rektokel': {
    definisi: 'Penurunan organ panggul ke dalam atau keluar liang vagina akibat kelemahan otot dan ligamen penyangga.',
    diagnosis: ['Rasa mengganjal atau benjolan keluar dari vagina, gangguan berkemih dan defekasi, dispareunia; derajat dinilai dengan sistem POP-Q atau derajat 1-4; faktor risiko: multiparitas, persalinan pervaginam, usia, menopause, obesitas, batuk kronik'],
    tatalaksana: ['Konservatif: latihan otot dasar panggul, penurunan BB, atasi konstipasi dan batuk kronik, estrogen topikal pada pascamenopause; PESARIUM sebagai pilihan efektif non-bedah terutama pada pasien risiko operasi tinggi; bedah (histerektomi vaginal, sakrokolpopeksi, kolporafi) sesuai derajat dan keinginan fertilitas'],
    referensi: ['SKDI2012', 'POGI2016', 'CAMPBELL2016'],
  },
  'Hematokolpos': {
    definisi: 'Penumpukan darah haid dalam vagina akibat obstruksi jalan keluar, tersering karena himen imperforata.',
    diagnosis: ['Remaja dengan AMENORE PRIMER disertai nyeri perut bawah SIKLIK yang makin berat, dapat disertai retensi urin dan massa perut bawah; inspeksi menunjukkan membran himen menonjol berwarna kebiruan; USG menunjukkan vagina terdistensi darah'],
    tatalaksana: ['Insisi atau eksisi himen (himenektomi) untuk drainase dengan teknik yang menjaga anatomi, antibiotik profilaksis; hindari aspirasi jarum saja (risiko infeksi); konseling bahwa fertilitas umumnya tidak terganggu setelah koreksi'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Endometriosis': {
    definisi: 'Adanya jaringan mirip endometrium di luar kavum uteri yang menimbulkan inflamasi kronik dan perlekatan.',
    diagnosis: ['Trias: dismenore progresif, dispareunia dalam, dan infertilitas; dapat disertai nyeri panggul kronik dan diskezia; pemeriksaan menemukan nodul di kavum Douglas dan uterus terfiksasi retroversi; USG mendeteksi endometrioma, laparoskopi merupakan baku emas — KETERLAMBATAN DIAGNOSIS umum terjadi bertahun-tahun'],
    tatalaksana: ['Analgesia (NSAID), terapi hormonal untuk menekan haid (pil kombinasi kontinu, progestin, GnRH agonis dengan add-back therapy); laparoskopi untuk eksisi/ablasi lesi terutama bila nyeri refrakter atau infertilitas; rujuk fertilitas bila ingin hamil — jangan menunda evaluasi fertilitas'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Hiperplasia endometrium': {
    definisi: 'Proliferasi berlebihan kelenjar endometrium akibat paparan estrogen tanpa imbangan progesteron; dengan atipia merupakan lesi prakanker.',
    diagnosis: ['Perdarahan uterus abnormal terutama pada perimenopause dan pascamenopause; USG menunjukkan penebalan endometrium; BIOPSI ENDOMETRIUM wajib untuk menentukan ada tidaknya ATIPIA — faktor risiko: obesitas, PCOS, nuliparitas, terapi estrogen tanpa progestin, tamoksifen'],
    tatalaksana: ['TANPA atipia: progestin (oral atau AKDR levonorgestrel) dengan biopsi ulang untuk menilai respons; DENGAN atipia: risiko karsinoma bersamaan tinggi — histerektomi umumnya dianjurkan, terapi progestin dosis tinggi dengan pemantauan ketat bila ingin mempertahankan fertilitas; turunkan berat badan sebagai bagian tatalaksana'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Menopause, perimenopausal syndome': {
    definisi: 'Berhentinya haid permanen akibat hilangnya fungsi folikel ovarium, ditegakkan setelah 12 bulan amenore.',
    diagnosis: ['Amenore 12 bulan pada usia sekitar 45-55 tahun disertai gejala vasomotor (hot flashes, keringat malam), kekeringan vagina, dispareunia, gangguan tidur dan mood; pemeriksaan hormon umumnya tidak diperlukan bila usia dan gejala khas; PERDARAHAN PASCAMENOPAUSE selalu memerlukan evaluasi keganasan'],
    tatalaksana: ['Terapi hormonal untuk gejala vasomotor mengganggu — gunakan dosis efektif terendah, tambahkan progestin bila uterus masih ada, dan pertimbangkan kontraindikasi (riwayat kanker payudara, tromboemboli, penyakit kardiovaskular); estrogen VAGINAL untuk gejala urogenital lokal; kalsium, vitamin D, latihan menahan beban, dan skrining osteoporosis serta risiko kardiovaskular'],
    referensi: ['SKDI2012', 'POGI2016', 'HARRISON2022'],
  },
  'Polikistik ovarium': {
    definisi: 'Sindrom ovarium polikistik (PCOS) — gangguan endokrin dengan hiperandrogenisme, disfungsi ovulasi, dan gambaran ovarium polikistik.',
    diagnosis: ['Kriteria Rotterdam (2 dari 3): oligo/anovulasi, hiperandrogenisme klinis (hirsutisme, akne) atau biokimiawi, dan gambaran ovarium polikistik pada USG — SETELAH menyingkirkan penyebab lain (hiperprolaktinemia, tiroid, hiperplasia adrenal kongenital); skrining intoleransi glukosa dan dislipidemia'],
    tatalaksana: ['PENURUNAN BERAT BADAN dan gaya hidup sebagai lini pertama (bahkan 5-10% memperbaiki ovulasi); pil kontrasepsi kombinasi untuk keteraturan haid, perlindungan endometrium, dan hiperandrogenisme; metformin pada resistensi insulin; letrozol sebagai induksi ovulasi lini pertama bila ingin hamil; skrining berkala DM tipe 2 dan risiko kanker endometrium'],
    referensi: ['SKDI2012', 'POGI2016', 'PERKENI2021'],
  },
  'Kehamilan ektopik': {
    definisi: 'Implantasi hasil konsepsi di luar kavum uteri, tersering di tuba falopii — penyebab utama kematian maternal trimester pertama.',
    diagnosis: ['Trias: amenore, nyeri perut bawah, dan perdarahan pervaginam; TES KEHAMILAN POSITIF dengan USG tidak menemukan kantong gestasi intrauterin pada kadar β-hCG di atas ambang diskriminatif; TERGANGGU (ruptur): nyeri hebat mendadak, nyeri goyang serviks, cavum Douglas menonjol, syok — SELALU pikirkan pada wanita usia subur dengan nyeri perut dan syok'],
    tatalaksana: ['RUPTUR: resusitasi dan LAPAROTOMI DARURAT — jangan menunda untuk pemeriksaan lengkap; belum ruptur dan stabil dengan kriteria terpenuhi: metotreksat dengan pemantauan β-hCG serial, atau salpingostomi/salpingektomi laparoskopik; berikan anti-D pada Rh negatif; konseling risiko rekurensi dan fertilitas'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Karsinoma serviks': {
    definisi: 'Keganasan serviks, hampir seluruhnya disebabkan infeksi HPV onkogenik persisten; kanker pada wanita yang paling dapat dicegah.',
    diagnosis: ['Perdarahan pascasenggama, perdarahan di luar haid atau pascamenopause, duh berbau; inspekulo menunjukkan lesi eksofitik atau ulseratif pada serviks; SKRINING dengan IVA atau Pap smear/tes HPV, konfirmasi dengan biopsi; staging klinis FIGO'],
    tatalaksana: ['Lesi prakanker: krioterapi/LEEP; kanker invasif: histerektomi radikal pada stadium dini, kemoradiasi pada stadium lanjut lokal — rujuk onkologi ginekologi; PENCEGAHAN: vaksinasi HPV pada remaja sebelum aktif seksual dan skrining berkala sesuai program nasional — tekankan bahwa vaksinasi tidak menggantikan skrining'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Karsinoma endometrium': {
    definisi: 'Keganasan lapisan dalam uterus, kanker ginekologi tersering di negara maju, umumnya terkait paparan estrogen berlebih.',
    diagnosis: ['PERDARAHAN PASCAMENOPAUSE adalah gejala kunci — wajib dievaluasi hingga tuntas; USG transvaginal menilai ketebalan endometrium, BIOPSI ENDOMETRIUM menegakkan diagnosis; faktor risiko: obesitas, nuliparitas, menopause terlambat, PCOS, tamoksifen, sindrom Lynch'],
    tatalaksana: ['Histerektomi total dengan salpingo-ooforektomi bilateral dan penentuan stadium bedah sebagai terapi utama, radioterapi/kemoterapi adjuvan sesuai stadium dan risiko; rujuk onkologi ginekologi; skrining sindrom Lynch pada pasien muda atau riwayat keluarga sesuai'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Karsinoma ovarium': {
    definisi: 'Keganasan ovarium, sering terdiagnosis pada stadium lanjut karena gejala tidak khas — mortalitas tertinggi di antara kanker ginekologi.',
    diagnosis: ['Gejala samar dan sering diabaikan: kembung menetap, cepat kenyang, nyeri perut/panggul, perubahan pola berkemih; massa adneksa dengan asites pada stadium lanjut; USG dan CA-125 (kurang spesifik, dapat meningkat pada kondisi jinak), CT untuk staging; riwayat keluarga dan mutasi BRCA meningkatkan risiko'],
    tatalaksana: ['Bedah sitoreduksi (debulking) optimal dan kemoterapi berbasis platinum — rujuk onkologi ginekologi; konseling genetik dan tes BRCA; TIDAK ADA skrining populasi yang terbukti efektif sehingga kewaspadaan terhadap gejala persisten pada wanita usia lanjut penting'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Teratoma ovarium (kista dermoid)': {
    definisi: 'Tumor sel germinal jinak ovarium yang mengandung jaringan dari ketiga lapisan germinal (rambut, gigi, lemak).',
    diagnosis: ['Sering asimtomatik ditemukan insidental, dapat menyebabkan nyeri atau teraba massa; USG menunjukkan gambaran khas dengan komponen lemak, kalsifikasi, dan bayangan akustik; berisiko TORSI karena berat dan bertangkai'],
    tatalaksana: ['Kistektomi dengan mempertahankan jaringan ovarium sehat (penting pada wanita usia reproduksi), hati-hati agar isi kista tidak tumpah ke rongga peritoneum (risiko peritonitis kimia); observasi hanya pada lesi kecil asimtomatik dengan pemantauan'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Kista ovarium': {
    definisi: 'Kantong berisi cairan pada ovarium; sebagian besar kista fungsional bersifat fisiologis dan menghilang sendiri.',
    diagnosis: ['Sering asimtomatik atau nyeri panggul, gangguan haid; USG membedakan kista simpel (dinding tipis, anekoik, jinak) dari kompleks; nilai risiko keganasan berdasarkan usia, gambaran USG, dan penanda tumor — kista pada PASCAMENOPAUSE lebih mencurigakan'],
    tatalaksana: ['Kista fungsional simpel pada usia reproduksi: observasi dengan USG ulang setelah 1-2 siklus (sebagian besar menghilang); intervensi bedah bila persisten, ukuran besar, gambaran kompleks/mencurigakan, atau timbul komplikasi; EDUKASI tanda torsi/ruptur yang memerlukan pertolongan segera'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Torsi dan ruptur kista': {
    definisi: 'Terpuntirnya ovarium pada pedikelnya (torsi) atau pecahnya kista — kedaruratan ginekologi.',
    diagnosis: ['Nyeri perut bawah HEBAT MENDADAK unilateral, mual muntah, dapat disertai demam ringan; nyeri tekan dan massa adneksa; USG Doppler dapat menunjukkan gangguan aliran (namun ALIRAN NORMAL TIDAK MENYINGKIRKAN TORSI); singkirkan kehamilan ektopik dan apendisitis dengan tes kehamilan'],
    tatalaksana: ['LAPAROSKOPI/LAPAROTOMI DARURAT — detorsi dan pertahankan ovarium bila masih viabel (ovarium sering pulih meski tampak kebiruan, terutama pada pasien muda), sistektomi; keterlambatan menyebabkan nekrosis dan hilangnya ovarium; ruptur kista dengan hemoperitoneum memerlukan resusitasi dan hemostasis bedah'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Koriokarsinoma': {
    definisi: 'Keganasan trofoblas gestasional yang sangat agresif namun sangat responsif terhadap kemoterapi.',
    diagnosis: ['Perdarahan uterus abnormal dengan β-hCG tetap tinggi atau meningkat setelah kehamilan (tersering pasca mola, dapat juga pasca abortus atau persalinan normal); metastasis dini ke PARU (batuk, hemoptisis), otak, dan hati; USG dan pencitraan untuk staging'],
    tatalaksana: ['KEMOTERAPI adalah terapi utama dengan angka kesembuhan sangat tinggi bahkan pada penyakit metastatik (metotreksat pada risiko rendah, kombinasi EMA-CO pada risiko tinggi); pemantauan β-hCG serial hingga normal dan selama masa tindak lanjut, kontrasepsi selama pemantauan; rujuk onkologi ginekologi'],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Inflamasi, abses': {
    definisi: 'Mastitis dan abses payudara, umumnya terjadi pada masa menyusui akibat stasis ASI dan infeksi Staphylococcus aureus.',
    diagnosis: ['Payudara nyeri, merah, bengkak, teraba hangat disertai demam dan gejala mirip flu; ABSES bila teraba fluktuasi atau tidak membaik dengan antibiotik — USG memastikan; MASTITIS RADANG pada wanita tidak menyusui yang tidak membaik perlu evaluasi karsinoma inflamatorik'],
    tatalaksana: ['LANJUTKAN MENYUSUI atau perah ASI dari payudara yang sakit (pengosongan payudara adalah kunci — ASI tetap aman bagi bayi), kompres hangat, analgesia, antibiotik antistafilokokus; ABSES: aspirasi dengan panduan USG atau insisi drainase; perbaiki teknik pelekatan menyusui untuk mencegah rekurensi'],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Inverted nipple': {
    definisi: 'Puting susu yang tertarik ke dalam, dapat kongenital atau didapat.',
    diagnosis: ['Puting tertarik ke dalam; kongenital umumnya sejak pubertas dan bilateral; RETRAKSI PUTING BARU pada satu sisi pada wanita dewasa merupakan TANDA BAHAYA keganasan payudara dan wajib dievaluasi dengan pencitraan'],
    tatalaksana: ['Kongenital: teknik menyusui dengan bantuan (perah sedikit sebelum menyusui, nipple shield, perlekatan yang benar) — sebagian besar tetap dapat menyusui dengan dukungan konselor laktasi; DIDAPAT: rujuk untuk evaluasi keganasan (mamografi/USG dan biopsi bila perlu)'],
    referensi: ['SKDI2012', 'POGI2016', 'SCHWARTZ2019'],
  },
  'Fibrokista': {
    definisi: 'Perubahan fibrokistik payudara — kondisi jinak yang sangat umum akibat respons jaringan payudara terhadap fluktuasi hormon.',
    diagnosis: ['Nyeri dan benjolan payudara yang berubah mengikuti siklus haid (memberat prahaid), sering bilateral dan multipel, tekstur berbenjol; USG pada wanita muda, mamografi pada usia lebih tua; aspirasi kista simpel dapat sekaligus terapeutik'],
    tatalaksana: ['REASSURANCE bahwa ini kondisi jinak dan tidak meningkatkan risiko kanker secara bermakna; bra penyangga yang baik, analgesia, kurangi kafein (bukti terbatas namun membantu sebagian pasien); aspirasi kista bila nyeri; evaluasi lanjut bila ada benjolan dominan menetap'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'POGI2016'],
  },
  'Fibroadenoma mammae (FAM)': {
    definisi: 'Tumor jinak payudara tersering pada wanita muda, berasal dari jaringan fibrosa dan kelenjar.',
    diagnosis: ['Benjolan KENYAL, BATAS TEGAS, SANGAT MOBILE (breast mouse), TIDAK NYERI, umumnya soliter pada wanita usia 15-35 tahun; USG menunjukkan lesi hipoekoik berbatas tegas dengan orientasi horizontal; konfirmasi dengan FNAB/core biopsy sesuai triple assessment'],
    tatalaksana: ['Observasi dengan pemantauan berkala bila kecil, gambaran khas jinak, dan diagnosis pasti; eksisi bila membesar, ukuran >3 cm, usia lebih tua, gambaran meragukan, atau atas keinginan pasien; edukasi SADARI dan kontrol berkala'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'POGI2016'],
  },
  'Tumor Filoides': {
    definisi: 'Tumor fibroepitelial payudara yang tumbuh cepat, dapat jinak, borderline, atau ganas.',
    diagnosis: ['Massa payudara yang TUMBUH CEPAT, umumnya lebih besar dari fibroadenoma dan pada usia lebih tua (40-50 tahun); sulit dibedakan dari fibroadenoma pada pencitraan — CORE BIOPSY lebih baik daripada FNAB, diagnosis pasti sering baru setelah eksisi'],
    tatalaksana: ['EKSISI LUAS dengan tepi bebas ≥1 cm (bukan enukleasi seperti fibroadenoma) untuk mencegah rekurensi; mastektomi pada tumor besar atau ganas; penyebaran ke kelenjar getah bening jarang sehingga diseksi aksila umumnya tidak diperlukan; pemantauan rekurensi lokal'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'HARRISON2022'],
  },
  'Karsinoma payudara': {
    definisi: 'Keganasan payudara, kanker tersering pada wanita.',
    diagnosis: ['Benjolan KERAS, batas tidak tegas, terfiksasi, tidak nyeri; tanda lanjut: retraksi puting, peau d\'orange, ulkus, keluar cairan berdarah dari puting, pembesaran kelenjar aksila; TRIPLE ASSESSMENT (klinis + pencitraan + patologi) adalah standar diagnosis; status reseptor ER/PR/HER2 menentukan terapi'],
    tatalaksana: ['Terapi multimodal sesuai stadium dan subtipe: bedah (breast-conserving surgery atau mastektomi dengan evaluasi kelenjar sentinel), kemoterapi, radioterapi, terapi hormonal (tamoksifen/aromatase inhibitor pada reseptor hormon positif), dan terapi target anti-HER2; rujuk onkologi; SKRINING dan deteksi dini (SADARI, SADANIS, mamografi sesuai usia dan risiko) sangat menentukan prognosis'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'HARRISON2022'],
  },
  'Penyakit Paget': {
    definisi: 'Penyakit Paget payudara — lesi eksematosa pada puting yang menandakan adanya karsinoma payudara di bawahnya.',
    diagnosis: ['Lesi merah, bersisik, gatal, atau berkerak pada PUTING yang meluas ke areola (berbeda dari eksema yang biasanya mulai dari areola dan bilateral), unilateral dan TIDAK MEMBAIK dengan kortikosteroid topikal; biopsi puting menunjukkan sel Paget; mamografi wajib mencari karsinoma yang mendasari'],
    tatalaksana: ['Setiap lesi eksematosa puting unilateral yang tidak sembuh dalam beberapa minggu WAJIB dibiopsi — keterlambatan diagnosis sering terjadi karena diterapi sebagai eksema; tatalaksana sesuai karsinoma yang mendasari (bedah dengan pengangkatan kompleks puting-areola, terapi adjuvan sesuai stadium)'],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'FITZPATRICK2019'],
  },
  'Ginekomastia': {
    definisi: 'Pembesaran jaringan kelenjar payudara pada pria akibat ketidakseimbangan rasio estrogen dan androgen.',
    diagnosis: ['Jaringan kenyal konsentris di bawah areola yang dapat nyeri, BILATERAL atau unilateral; bedakan dari lipomastia (lemak, tanpa jaringan kelenjar teraba) dan karsinoma payudara pria (keras, eksentrik, terfiksasi, retraksi puting — perlu evaluasi); cari penyebab: fisiologis (neonatus, pubertas, lansia), obat (spironolakton, simetidin, antipsikotik, anabolik), sirosis, hipogonadisme, hipertiroid, tumor testis'],
    tatalaksana: ['Ginekomastia pubertas umumnya fisiologis dan REGRESI SPONTAN dalam 1-2 tahun — reassurance dan observasi; hentikan atau ganti obat penyebab, atasi penyakit dasar; tamoksifen pada kasus nyeri dan baru, bedah bila menetap >1-2 tahun (jaringan sudah fibrotik) atau mengganggu psikososial'],
    referensi: ['SKDI2012', 'HARRISON2022', 'SCHWARTZ2019'],
  },
  'Infertilitas': {
    definisi: 'Ketidakmampuan mencapai kehamilan setelah 12 bulan hubungan seksual teratur tanpa kontrasepsi (6 bulan bila usia wanita >35 tahun).',
    diagnosis: ['EVALUASI KEDUA PASANGAN bersamaan: pria dengan ANALISIS SPERMA (pemeriksaan awal utama, sederhana dan non-invasif); wanita dengan penilaian ovulasi, patensi tuba (HSG), dan cadangan ovarium; faktor pria berperan pada sekitar separuh kasus'],
    tatalaksana: ['Optimalkan gaya hidup kedua pasangan (berat badan, berhenti merokok dan alkohol, hindari panas berlebih pada testis), edukasi masa subur dan frekuensi hubungan; atasi penyebab spesifik (induksi ovulasi, varikokelektomi, bedah tuba); teknologi reproduksi berbantu (IUI, IVF/ICSI) sesuai indikasi; JANGAN menunda rujukan pada usia wanita lanjut karena cadangan ovarium menurun cepat; berikan dukungan psikologis'],
    referensi: ['SKDI2012', 'POGI2016', 'CAMPBELL2016'],
  },
  'Gangguan ereksi': {
    definisi: 'Disfungsi ereksi — ketidakmampuan mencapai atau mempertahankan ereksi yang cukup untuk hubungan seksual memuaskan.',
    diagnosis: ['Anamnesis terarah termasuk onset, ereksi pagi hari (ada pada penyebab psikogenik, hilang pada organik), libido, dan faktor relasi; nilai faktor risiko kardiovaskular, DM, obat (antihipertensi, antidepresan), hipogonadisme; DISFUNGSI EREKSI SERING MERUPAKAN PENANDA DINI PENYAKIT KARDIOVASKULAR — skrining wajib'],
    tatalaksana: ['Modifikasi gaya hidup dan kendalikan faktor risiko kardiovaskular, tinjau ulang obat yang berkontribusi, konseling seksual dan libatkan pasangan; inhibitor PDE-5 (sildenafil, tadalafil) sebagai lini pertama — KONTRAINDIKASI MUTLAK dengan nitrat (risiko hipotensi berat); terapi testosteron hanya bila hipogonadisme terbukti'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'HARRISON2022'],
  },
  'Gangguan ejakulasi': {
    definisi: 'Gangguan proses ejakulasi mencakup ejakulasi dini, tertunda, retrograd, dan anejakulasi.',
    diagnosis: ['Ejakulasi dini: ejakulasi terjadi sangat cepat, sulit dikendalikan, dan menimbulkan distres; Retrograd: orgasme tanpa keluarnya semen dengan urin keruh setelahnya (ditemukan sperma pada urinalisis pascaejakulasi) — terkait DM, operasi prostat, alpha-blocker; nilai faktor psikologis dan obat (SSRI menyebabkan ejakulasi tertunda)'],
    tatalaksana: ['Ejakulasi dini: teknik perilaku (stop-start, squeeze), anestetik topikal, SSRI atau dapoksetin, libatkan pasangan dalam terapi; Retrograd: tinjau ulang obat penyebab, simpatomimetik pada kasus tertentu, pengambilan sperma dari urin bila menginginkan fertilitas; atasi penyakit dasar dan berikan konseling seksual'],
    referensi: ['SKDI2012', 'CAMPBELL2016', 'KAPLAN2015'],
  },

  // ─── Entri pelengkap: penyakit SKDI tanpa padanan catatan OSCE ────────────
  // Ditulis tersendiri karena tidak ada station note yang benar-benar setara.
  // (Pencocokan otomatis akan salah — mis. "Koma" → "Glaukoma", "Xanthelasma"
  // → "Asma" — sehingga entri ini sengaja dibuat manual.)
  'Ensefalopati': {
    definisi: 'Disfungsi otak difus akibat penyebab sistemik (metabolik, toksik, infeksi, hipoksia) yang bermanifestasi sebagai perubahan status mental — bukan lesi struktural fokal.',
    diagnosis: [
      'Penurunan kesadaran atau perubahan perilaku/kognisi yang berfluktuasi, umumnya TANPA defisit neurologis fokal (membedakan dari stroke)',
      'Cari penyebab sistemik: hepatik (asteriksis, fetor hepatikum, riwayat sirosis), uremik, hipoglikemia, hiponatremia, hiperkarbia, sepsis, obat/intoksikasi, defisiensi tiamin (Wernicke)',
      'Pemeriksaan wajib: gula darah kapiler SEGERA, elektrolit, ureum-kreatinin, fungsi hati dan amonia, analisis gas darah, urinalisis dan kultur; CT kepala bila ada defisit fokal, trauma, atau antikoagulan',
    ],
    tatalaksana: [
      'Amankan ABC dan posisi; koreksi hipoglikemia segera (dekstrosa 40% IV) dan berikan TIAMIN 100 mg IV sebelum/bersama glukosa pada pasien berisiko (alkohol, malnutrisi)',
      'Ensefalopati hepatik: laktulosa 3x30 mL dititrasi hingga BAB 2-3x/hari, rifaksimin, atasi pencetus (perdarahan saluran cerna, infeksi, konstipasi, gangguan elektrolit)',
      'Koreksi gangguan elektrolit secara BERTAHAP (koreksi hiponatremia terlalu cepat berisiko mielinolisis pontin)',
      'Hentikan/kurangi obat sedatif dan nefrotoksik, atasi infeksi, dukungan nutrisi',
    ],
    referensi: ['SKDI2012', 'ADAMS2019', 'SLEISENGER2021'],
  },
  'Koma': {
    definisi: 'Keadaan tidak sadar yang dalam dan menetap, pasien tidak dapat dibangunkan dan tidak menunjukkan respons bertujuan terhadap rangsang — kedaruratan neurologis.',
    diagnosis: [
      'Nilai GCS (mata, verbal, motorik) dan pola pernapasan; periksa PUPIL (ukuran, simetri, refleks cahaya) dan refleks batang otak (kornea, okulosefalik, muntah) untuk lokalisasi',
      'Pupil pinpoint reaktif → intoksikasi opioid atau lesi pons; pupil dilatasi unilateral non-reaktif → herniasi unkal (kedaruratan bedah saraf); pupil dilatasi bilateral → hipoksia berat atau intoksikasi antikolinergik',
      'Singkirkan penyebab reversibel dengan cepat: gula darah kapiler, elektrolit, gas darah, kadar obat/toksin, suhu tubuh; CT kepala segera bila lateralisasi, trauma, atau penyebab tidak jelas',
    ],
    tatalaksana: [
      'ABC dan proteksi jalan napas — intubasi bila GCS ≤8 atau refleks proteksi jalan napas hilang; imobilisasi servikal bila kemungkinan trauma',
      '"Coma cocktail" terarah: dekstrosa 40% IV bila hipoglikemia, TIAMIN 100 mg IV (sebelum glukosa pada pasien berisiko), nalokson bila dicurigai opioid',
      'Cegah cedera otak sekunder: hindari hipotensi, hipoksia, hipertermia, dan hipo/hiperglikemia; elevasi kepala 30° bila tekanan intrakranial meningkat',
      'Rujuk untuk pencitraan dan tatalaksana penyebab; tentukan prognosis hanya setelah penyebab reversibel disingkirkan dan pasien tidak dalam pengaruh sedatif',
    ],
    referensi: ['SKDI2012', 'ADAMS2019', 'ATLS2018'],
  },
  'Kejang': {
    definisi: 'Manifestasi klinis akibat lepas muatan listrik neuron serebral yang berlebihan dan sinkron; dapat merupakan kejang provokasi (akut simtomatik) maupun bagian dari epilepsi.',
    diagnosis: [
      'Bedakan dari sinkop dan kejang psikogenik: kejang epileptik umumnya disertai fase tonik-klonik, mata TERBUKA dan deviasi, lidah tergigit sisi lateral, inkontinensia, diikuti fase pascaiktal yang bingung dan mengantuk',
      'Cari PROVOKASI (kejang akut simtomatik): hipoglikemia, hiponatremia, hipokalsemia, demam pada anak, infeksi SSP, trauma kepala, stroke, putus alkohol/obat, intoksikasi, eklampsia pada kehamilan',
      'Pemeriksaan awal: gula darah kapiler segera, elektrolit termasuk kalsium dan magnesium, fungsi ginjal, tes kehamilan pada wanita usia subur; EEG dan pencitraan otak sesuai indikasi',
    ],
    tatalaksana: [
      'Saat kejang: posisi miring, amankan dari cedera (JANGAN memasukkan benda ke mulut atau menahan gerakan), oksigen, catat durasi',
      'Kejang >5 menit ditangani sebagai status epileptikus: benzodiazepin (diazepam/lorazepam IV, midazolam IM bila tanpa akses IV) dilanjutkan antiepilepsi lini kedua bila berlanjut',
      'KOREKSI PENYEBAB adalah kunci pada kejang provokasi — antiepilepsi jangka panjang umumnya TIDAK diindikasikan bila kejang murni akibat provokasi yang sudah diatasi',
      'Edukasi keselamatan (hindari berenang sendiri, mengemudi sesuai ketentuan, bekerja di ketinggian) dan kepatuhan obat bila epilepsi',
    ],
    referensi: ['SKDI2012', 'PERDOSSI2016', 'ADAMS2019'],
  },
  'Gangguan campuran cemas depresi': {
    definisi: 'Gangguan dengan gejala cemas dan depresi yang muncul bersamaan, masing-masing tidak cukup berat untuk memenuhi kriteria diagnosis tersendiri.',
    diagnosis: [
      'Gejala cemas (khawatir berlebihan, tegang, gelisah, gangguan otonom) dan depresi (mood turun, anhedonia, mudah lelah) muncul bersamaan dengan intensitas ringan-sedang',
      'Tidak memenuhi kriteria penuh gangguan cemas menyeluruh maupun episode depresi; sangat sering ditemukan di layanan primer',
      'Skrining risiko bunuh diri WAJIB ditanyakan secara langsung pada setiap pasien dengan gejala depresi',
    ],
    tatalaksana: [
      'Psikoedukasi, teknik relaksasi dan pernapasan, aktivasi perilaku, higiene tidur, dan aktivitas fisik teratur sebagai lini pertama',
      'SSRI bila gejala menetap atau mengganggu fungsi; jelaskan efek terapeutik baru terasa 2-4 minggu dan jangan dihentikan mendadak',
      'Hindari benzodiazepin jangka panjang (risiko ketergantungan); atasi stresor psikososial dan libatkan dukungan keluarga',
      'Rujuk psikiatri bila ada risiko bunuh diri, gejala psikotik, atau tidak respons terapi',
    ],
    referensi: ['SKDI2012', 'PPDGJIII', 'WHOMHGAP2016'],
  },
  'Xanthelasma': {
    definisi: 'Deposit lipid berwarna kekuningan pada kulit kelopak mata, tersering di kantus medial — penanda kulit yang dapat menunjukkan dislipidemia.',
    diagnosis: [
      'Plak kekuningan lunak berbatas tegas simetris pada kelopak mata, tidak nyeri dan tidak mengganggu penglihatan',
      'WAJIB periksa profil lipid — sebagian pasien normolipidemik, namun xanthelasma tetap berkaitan dengan peningkatan risiko aterosklerosis dan penyakit jantung koroner',
      'Cari xantoma di lokasi lain (tendon Achilles, ekstensor jari) yang sangat sugestif hiperkolesterolemia familial',
    ],
    tatalaksana: [
      'Fokus utama: tatalaksana dislipidemia dan penilaian risiko kardiovaskular total (statin sesuai kategori risiko, modifikasi gaya hidup)',
      'Tindakan lokal untuk alasan kosmetik: eksisi bedah, laser, atau asam trikloroasetat — EDUKASI bahwa rekurensi sering terjadi bila dislipidemia tidak dikendalikan',
    ],
    referensi: ['SKDI2012', 'FITZPATRICK2019', 'PAPDI2014'],
  },
  'Skleritis': {
    definisi: 'Peradangan sklera yang bersifat nyeri dan destruktif, sering berkaitan dengan penyakit autoimun sistemik — berbeda dari episkleritis yang jinak dan swasirna.',
    diagnosis: [
      'NYERI HEBAT menembus hingga ke kepala yang mengganggu tidur (episkleritis hanya rasa tidak nyaman ringan), mata merah kebiruan/keunguan, nyeri tekan bola mata, dapat disertai penurunan penglihatan',
      'Kemerahan TIDAK memucat dengan tetes fenilefrin topikal (pada episkleritis memucat) — pembeda klinis penting di layanan primer',
      'Cari penyakit sistemik penyerta: artritis reumatoid, granulomatosis dengan poliangiitis, SLE, dan penyakit jaringan ikat lain',
    ],
    tatalaksana: [
      'RUJUK oftalmologi — skleritis dapat menyebabkan penipisan sklera, perforasi, dan kehilangan penglihatan permanen',
      'NSAID sistemik pada kasus ringan, kortikosteroid sistemik dan imunosupresan pada skleritis nekrotikans atau terkait penyakit autoimun',
      'Kortikosteroid topikal saja TIDAK adekuat; evaluasi dan tatalaksana penyakit sistemik yang mendasari bersama reumatologi',
    ],
    referensi: ['SKDI2012', 'KANSKI2020', 'HARRISON2022'],
  },
  'Kerato-konjungtivitis sicca': {
    definisi: 'Sindrom mata kering dengan keterlibatan kornea dan konjungtiva akibat defisiensi atau instabilitas film air mata.',
    diagnosis: [
      'Rasa berpasir, perih, terbakar, mata cepat lelah, kadang justru berair berlebihan (epifora refleks); memberat saat kerja layar, di ruang ber-AC, dan sore hari',
      'Uji Schirmer menurun, tear break-up time memendek, pewarnaan fluoresein/rose bengal menunjukkan pungtata pada kornea dan konjungtiva',
      'Bila disertai MULUT KERING dan artritis, curigai sindrom Sjögren — periksa anti-Ro/SSA dan anti-La/SSB',
    ],
    tatalaksana: [
      'Air mata buatan tanpa pengawet bila pemakaian sering (>4-6x/hari), gel atau salep mata malam hari',
      'Kompres hangat dan pembersihan kelopak bila disertai disfungsi kelenjar Meibom; aturan 20-20-20 saat kerja layar dan hindari embusan AC/kipas langsung ke wajah',
      'Siklosporin atau kortikosteroid topikal jangka pendek pada kasus sedang-berat, punctal plug bila refrakter',
      'Tinjau obat yang memperberat (antihistamin, antikolinergik, isotretinoin) dan tatalaksana penyakit autoimun yang mendasari',
    ],
    referensi: ['SKDI2012', 'KANSKI2020', 'HARRISON2022'],
  },
  'Hernia (diaframatika, hiatus)': {
    definisi: 'Herniasi isi abdomen ke rongga toraks; hernia diafragmatika kongenital pada neonatus, hernia hiatus berupa naiknya lambung melalui hiatus esofagus.',
    diagnosis: [
      'Hernia diafragmatika kongenital: distres napas berat segera setelah lahir, abdomen skafoid (cekung), suara napas menghilang dan bising usus terdengar di dada, mediastinum bergeser; rontgen toraks menunjukkan usus di rongga dada',
      'Hernia hiatus: sering asimtomatik atau bermanifestasi sebagai gejala refluks (heartburn, regurgitasi); barium swallow atau endoskopi memastikan',
    ],
    tatalaksana: [
      'Hernia diafragmatika kongenital: JANGAN berikan ventilasi tekanan positif dengan sungkup (memperberat distensi usus di dada) — intubasi dini, pasang NGT untuk dekompresi, stabilkan lalu rujuk bedah anak',
      'Hernia hiatus: tatalaksana refluks (modifikasi gaya hidup, PPI); operasi fundoplikasi bila gejala refrakter, hernia besar, atau ada komplikasi (volvulus lambung, strangulasi)',
    ],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Pes': {
    definisi: 'Penyakit pes (plague) — infeksi Yersinia pestis yang ditularkan melalui gigitan pinjal tikus; penyakit karantina dengan potensi wabah.',
    diagnosis: [
      'Bentuk bubonik (tersering): demam tinggi mendadak, menggigil, dan BUBO yaitu pembesaran kelenjar getah bening yang sangat nyeri (inguinal/aksila/servikal) dengan edema sekitarnya',
      'Bentuk pneumonik: pneumonia berat dengan hemoptisis, menular antarmanusia melalui droplet; bentuk septikemik: sepsis dengan purpura dan gangren akral',
      'Riwayat tinggal/berkunjung ke daerah fokus pes dan kontak dengan tikus atau hewan mati; konfirmasi dengan pewarnaan dan kultur aspirat bubo, darah, atau sputum',
    ],
    tatalaksana: [
      'Antibiotik SEGERA tanpa menunggu konfirmasi laboratorium (streptomisin/gentamisin, alternatif doksisiklin atau siprofloksasin) — keterlambatan meningkatkan mortalitas secara tajam',
      'ISOLASI dengan kewaspadaan droplet pada bentuk pneumonik, profilaksis antibiotik untuk kontak erat',
      'WAJIB LAPOR ke dinas kesehatan sebagai penyakit berpotensi wabah, pengendalian tikus dan pinjal di lingkungan',
    ],
    referensi: ['SKDI2012', 'HARRISON2022', 'PPKFKTP2014'],
  },
  'Neoplasma hepar': {
    definisi: 'Tumor hati, mencakup karsinoma hepatoselular (primer, umumnya pada hati sirotik) dan metastasis hati yang jauh lebih sering.',
    diagnosis: [
      'Nyeri perut kanan atas, penurunan BB, hepatomegali berbenjol, dekompensasi mendadak pada pasien sirosis stabil',
      'Karsinoma hepatoselular: faktor risiko sirosis, hepatitis B dan C kronik; alfa-fetoprotein meningkat, CT/MRI empat fase menunjukkan pola khas hipervaskular fase arteri dengan washout — sering dapat didiagnosis tanpa biopsi',
      'SURVEILANS 6 bulanan dengan USG (± AFP) pada semua pasien sirosis dan hepatitis B berisiko adalah kunci deteksi dini',
    ],
    tatalaksana: [
      'Stadium dini: reseksi, ablasi, atau transplantasi hati (kriteria Milan) — satu-satunya pilihan kuratif',
      'Stadium menengah: kemoembolisasi transarterial; stadium lanjut: terapi sistemik (inhibitor tirosin kinase, imunoterapi)',
      'Metastasis hati: tatalaksana sesuai keganasan primer; perawatan paliatif dan penanganan nyeri sejak dini',
      'PENCEGAHAN: vaksinasi hepatitis B, terapi antivirus hepatitis B/C, hindari alkohol dan aflatoksin',
    ],
    referensi: ['SKDI2012', 'SLEISENGER2021', 'WHOHEPB2024'],
  },
  'Abses (peri)anal': {
    definisi: 'Kumpulan pus di ruang perianal atau perirektal, umumnya berasal dari infeksi kelenjar anal (kripta) — pendahulu terbentuknya fistula ani.',
    diagnosis: [
      'Nyeri anus hebat terus-menerus yang memberat saat duduk dan defekasi, bengkak, kemerahan, dan fluktuasi di perianal, dapat disertai demam',
      'Abses yang lebih dalam (iskiorektal, supralevator) mungkin TIDAK tampak dari luar — nyeri hebat tanpa temuan luar yang jelas tetap memerlukan pemeriksaan colok dubur dan pencitraan',
      'Cari faktor predisposisi: DM, imunosupresi, penyakit Crohn, keganasan',
    ],
    tatalaksana: [
      'INSISI DAN DRAINASE adalah terapi utama dan tidak boleh ditunda — antibiotik saja tidak menyembuhkan abses yang sudah terbentuk',
      'Antibiotik sebagai tambahan bila selulitis luas, demam, DM, imunosupresi, atau penyakit katup jantung',
      'Rendam duduk hangat, analgesia, pelunak tinja setelah drainase; EDUKASI bahwa sekitar sepertiga kasus berkembang menjadi fistula ani yang memerlukan tindakan lanjutan',
    ],
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'SLEISENGER2021'],
  },
  'Infeksi pada kehamilan: TORCH, hepatitis B, malaria': {
    definisi: 'Infeksi maternal yang dapat ditransmisikan ke janin atau memperberat luaran kehamilan — Toxoplasma, Others (sifilis, varisela, parvovirus), Rubella, Cytomegalovirus, Herpes, ditambah hepatitis B dan malaria.',
    diagnosis: [
      'Sering asimtomatik pada ibu — ditemukan melalui SKRINING ANTENATAL rutin (HBsAg, sifilis, HIV; malaria pada daerah endemis)',
      'Petunjuk pada janin/neonatus: pertumbuhan janin terhambat, mikrosefali, kalsifikasi intrakranial, hepatosplenomegali, ikterik dini, ruam, katarak, gangguan pendengaran',
      'Serologi IgM/IgG dengan aviditas untuk menentukan infeksi akut vs lampau; malaria dikonfirmasi apus darah tebal/tipis atau RDT',
    ],
    tatalaksana: [
      'Hepatitis B: bayi dari ibu HBsAg positif WAJIB mendapat vaksin HB dan HBIg dalam 12 JAM pertama kehidupan; antivirus pada ibu dengan viral load tinggi trimester ketiga',
      'Sifilis: benzatin penisilin G (satu-satunya yang mencegah sifilis kongenital — lakukan desensitisasi bila alergi)',
      'Toksoplasmosis akut: spiramisin untuk cegah transmisi, pirimetamin-sulfadiazin bila janin terinfeksi',
      'Malaria dalam kehamilan: obati sesuai pedoman dengan obat yang aman menurut trimester, gunakan kelambu berinsektisida; malaria meningkatkan risiko anemia berat, abortus, dan berat lahir rendah',
      'PENCEGAHAN: vaksinasi rubela prakonsepsi, higiene makanan dan kontak kucing untuk toksoplasma, skrining antenatal lengkap',
    ],
    referensi: ['SKDI2012', 'POGI2016', 'WHOHEPB2024'],
  },
  'Anemia defisiensi besi pada kehamilan': {
    definisi: 'Anemia akibat kekurangan besi selama kehamilan, kondisi yang sangat umum karena kebutuhan besi meningkat tajam untuk ekspansi massa eritrosit ibu dan pertumbuhan janin.',
    diagnosis: [
      'Anemia dalam kehamilan bila Hb <11 g/dL (trimester I dan III) atau <10,5 g/dL (trimester II); gejala lemas, pusing, pucat, sesak saat aktivitas',
      'Gambaran mikrositik hipokrom dengan feritin serum rendah (penanda paling spesifik); bedakan dari hemodilusi fisiologis kehamilan dan thalassemia',
      'Skrining Hb rutin pada kunjungan antenatal pertama dan trimester ketiga',
    ],
    tatalaksana: [
      'Tablet tambah darah rutin sebagai PENCEGAHAN pada semua ibu hamil sesuai program nasional; pada anemia berikan besi elemental dosis terapi',
      'Minum bersama vitamin C dan hindari bersamaan teh, kopi, susu, atau kalsium; edukasi efek samping (mual, konstipasi, tinja hitam) agar kepatuhan terjaga',
      'Besi intravena bila intoleransi oral berat, anemia sedang-berat mendekati persalinan, atau respons oral tidak adekuat',
      'Transfusi hanya pada anemia berat simtomatik atau mendekati persalinan dengan risiko perdarahan',
      'EDUKASI: anemia meningkatkan risiko perdarahan pascapersalinan, persalinan preterm, dan berat lahir rendah — kepatuhan minum tablet besi sangat penting',
    ],
    referensi: ['SKDI2012', 'POGI2016', 'WILLIAMSOB2022'],
  },
  'Corpus alienum vaginae': {
    definisi: 'Benda asing dalam vagina; pada anak sering benda kecil atau tisu, pada dewasa sering tampon tertinggal, kondom, atau pesarium terlupakan.',
    diagnosis: [
      'Duh vagina BERBAU SANGAT BUSUK dan persisten, dapat disertai bercak darah dan iritasi — pada ANAK, duh berbau busuk atau berdarah adalah petunjuk kuat benda asing',
      'Inspeksi vagina; pada anak dilakukan dengan sangat hati-hati dan sering memerlukan pemeriksaan dalam sedasi/anestesi oleh tenaga yang kompeten',
      'PENTING: pada anak dengan benda asing vagina, pertimbangkan dan evaluasi kemungkinan kekerasan seksual sesuai prosedur perlindungan anak',
    ],
    tatalaksana: [
      'Ekstraksi benda asing (irigasi lembut atau dengan forsep; pada anak sebaiknya di bawah sedasi/anestesi oleh tenaga terlatih)',
      'Antibiotik bila terdapat infeksi sekunder atau tanda selulitis; sebagian besar duh membaik cepat setelah benda asing diangkat',
      'Edukasi higiene; rujuk sesuai protokol perlindungan anak bila dicurigai kekerasan seksual',
    ],
    referensi: ['SKDI2012', 'POGI2016', 'PPKFKTP2014'],
  },
  'Eritrasma': {
    definisi: 'Infeksi superfisial kulit oleh Corynebacterium minutissimum pada area lipatan — bakteri, bukan jamur, sehingga sering salah diterapi sebagai tinea.',
    diagnosis: [
      'Bercak cokelat kemerahan berbatas tegas dengan skuama halus pada lipatan (sela jari kaki, inguinal, aksila, inframama), gatal ringan atau tanpa gejala',
      'LAMPU WOOD menunjukkan fluoresensi MERAH KORAL yang khas — pemeriksaan sederhana yang langsung membedakannya dari tinea kruris',
      'KOH negatif (tidak ada hifa) menyingkirkan dermatofitosis; faktor risiko: DM, obesitas, hiperhidrosis, iklim panas dan lembap',
    ],
    tatalaksana: [
      'Eritromisin topikal atau oral, atau klindamisin topikal; asam fusidat topikal sebagai alternatif',
      'Jaga area lipatan tetap kering, pakaian longgar menyerap keringat, turunkan berat badan bila obesitas',
      'SKRINING DIABETES pada kasus luas atau berulang; obati tinea pedis penyerta bila ada',
    ],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
  'Melasma': {
    definisi: 'Hipermelanosis didapat berupa bercak cokelat simetris pada wajah, dipicu paparan sinar matahari dan faktor hormonal (kehamilan, kontrasepsi hormonal).',
    diagnosis: [
      'Makula cokelat berbatas tidak tegas dan SIMETRIS pada wajah dengan pola sentrofasial, malar, atau mandibular; lebih sering pada wanita dan kulit berwarna gelap',
      'Lampu Wood membantu menilai kedalaman pigmen (epidermal lebih responsif terapi daripada dermal)',
      'Cari faktor pencetus: paparan UV, kehamilan (kloasma gravidarum), pil kontrasepsi, terapi hormon, obat fotosensitif',
    ],
    tatalaksana: [
      'TABIR SURYA spektrum luas SPF tinggi setiap hari dan diulang berkala adalah fondasi terapi — tanpa ini semua terapi lain akan gagal dan cepat kambuh',
      'Agen pencerah topikal: hidrokuinon, kombinasi triple (hidrokuinon-tretinoin-kortikosteroid), asam azelaik, asam traneksamat',
      'Hentikan kontrasepsi hormonal pencetus bila memungkinkan; peeling kimia atau laser hanya oleh tenaga berpengalaman (risiko hiperpigmentasi pascainflamasi justru memperburuk)',
      'EDUKASI: terapi memerlukan waktu berbulan-bulan, bersifat mengendalikan bukan menyembuhkan, dan sangat mudah kambuh bila proteksi matahari lalai',
    ],
    referensi: ['SKDI2012', 'PERDOSKI2021', 'FITZPATRICK2019'],
  },
}
