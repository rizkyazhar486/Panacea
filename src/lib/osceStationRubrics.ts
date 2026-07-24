// ─────────────────────────────────────────────────────────────────────────────
// OSCE Station Rubrics — official Indonesian UKMPPD OSCE exam station
// templates with full scoring content: scenario, candidate tasks, the
// examiner's hidden findings/diagnosis/treatment, and the standardized
// patient script. Sourced from an official national OSCE item-bank
// document (station template format used across Indonesian medical
// faculties), transcribed faithfully from the source PDF. A few purely
// procedural stations (IV line insertion, NG tube, skin test, CPR) use a
// blank standardized-patient template in the source itself — that's
// preserved here (no `standardPatient` field) rather than invented.
// ─────────────────────────────────────────────────────────────────────────────

export interface StandardPatient {
  nama: string
  usia: string
  jenisKelamin: string
  pekerjaan: string
  keluhanUtama?: string
  riwayatPenyakitSekarang?: string
  riwayatPenyakitDahulu?: string
  riwayatPenyakitKeluarga?: string
  pertanyaanWajib?: string
  peranWajib?: string
}

export interface ExaminerFindings {
  anamnesis?: string
  physicalExam?: string
  supportingExam?: string
  diagnosis?: string
  differentials?: string[]
  treatment?: string
}

export interface OsceStationRubric {
  system: string
  title: string
  allocatedMinutes: number
  skdiLevel: string
  scenario: string
  tasks: string[]
  examinerFindings: ExaminerFindings
  standardPatient?: StandardPatient
  author?: string
  reference?: string
}

export const OSCE_STATION_RUBRICS: OsceStationRubric[] = [
  {
    system: 'Psikiatri',
    title: 'Gangguan Stres Pasca Trauma',
    allocatedMinutes: 15,
    skdiLevel: '3A — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Seorang laki-laki 30 tahun diantar keluarganya ke praktek dokter umum dengan keluhan sering mengalami mimpi-mimpi buruk.',
    tasks: [
      'Lakukan wawancara psikiatrik',
      'Tuliskan status mental PS pada rekam medis, berikan kepada penguji',
      'Tetapkan diagnosis dan diagnosis banding dengan cara disampaikan pada keluarga PS',
      'Lakukan edukasi kepada PS untuk kelanjutan terapinya',
      'Berikan resep untuk terapi farmakologik kepada pasien',
    ],
    examinerFindings: {
      anamnesis: 'Sejak kapan gejala ini timbul? Apakah ada gejala-gejala lain? Apakah ada peristiwa yang mendasari timbulnya gejala ini? Apakah tidur terganggu? Apakah pernah mengalami keadaan seperti ini sebelumnya? Apakah ada keluarga yang pernah mengalami keadaan yang sama? Apakah menggunakan zat adiktif? Apakah ada riwayat trauma kepala? Apakah ada riwayat pembedahan? Obat-obat apa yang sering dimakan? Apakah ada riwayat alergi?',
      physicalExam: 'Status mental: penampilan umum rapi, raut wajah cemas dan tegang; perilaku normoaktif, sesekali meremas tangan, mudah terkejut; kesadaran compos mentis, GCS E4V5M6; mood/afek disforik, appropriate; pembicaraan biasa, isi relevan; tidak ada halusinasi/ilusi; RTA baik; isi pikiran preokupasi tentang kecelakaan bus; orientasi & daya ingat baik; konsentrasi terganggu; pengendalian impuls baik; tilikan derajat 6. Tanda vital dan pemeriksaan fisik umum dalam batas normal.',
      diagnosis: 'Gangguan stres pasca trauma',
      differentials: ['Reaksi stres akut', 'Gangguan penyesuaian'],
      treatment: 'Pilih salah satu: Sertraline 50mg 1x½-1 tab; Imipramine 25mg 1-2x1 tab; Amitriptiline 25mg 1-2x1 tab.',
    },
    standardPatient: {
      nama: 'Andi', usia: '30 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Karyawan bank swasta',
      keluhanUtama: 'Mengalami mimpi-mimpi buruk tentang kecelakaan bis yang dialaminya',
      riwayatPenyakitSekarang: 'Sejak 2 bulan lalu, hampir tiap malam mimpi tentang kecelakaan bus yang dialami 5 hari sebelumnya (menyaksikan pengendara motor tewas di tempat). Selalu terbayang peristiwa itu, mudah terkejut suara keras, menghindari naik bus. Berkurang bila ditemani keluarga/teman.',
      pertanyaanWajib: 'Apakah saya bisa sembuh dokter?',
      peranWajib: 'Raut wajah cemas dan tegang, sesekali meremas-remas tangan sendiri, mudah terkejut, perhatian mudah teralihkan.',
    },
    author: 'Dr. dr. Elmeida Effendy, M.Ked.KJ, Sp.KJ(K); dr. Nazli Mahdinasari Nasution — FK Universitas Sumatera Utara',
    reference: "PPDGJ III 1993; Kaplan & Sadock's Synopsis of Psychiatry, 10th ed.",
  },
  {
    system: 'Ginjal dan Saluran Kemih',
    title: 'Pyelonefritis tanpa komplikasi',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan secara mandiri dan tuntas.',
    scenario: 'Seorang wanita, 40 tahun, datang ke puskesmas dengan keluhan utama nyeri pinggang kanan disertai demam.',
    tasks: [
      'Lakukan anamnesis pada pasien',
      'Lakukan pemeriksaan fisik pada pasien',
      'Usulkan jenis pemeriksaan penunjang dan lakukan interpretasi atas data yang didapatkan',
      'Tegakkan diagnosis dan dua (2) diagnosis banding',
      'Berikan tatalaksana farmakoterapi, tuliskan resep, serahkan pada penguji/jelaskan pada pasien',
      'Komunikasikan dan berikan edukasi pada pasien terkait penyakit/tatalaksana/prognosisnya',
    ],
    examinerFindings: {
      anamnesis: 'Nyeri sejak 3 hari, pinggang kanan menjalar ke perut depan bawah pusat, bertambah saat diketok pinggang, berkurang dengan parasetamol. Mual (+), muntah (-). Demam menggigil naik-turun 3 hari. BAK nyeri, anyang-anyangan, rasa tidak puas ±10 hari. Sering menahan BAK, minum kurang. RPO: parasetamol.',
      physicalExam: 'KU tampak lemah. TD 120/80, N 100x/menit, R 20x/menit, t 39,5°C. Abdomen: nyeri tekan suprapubik. Pinggang: nyeri ketok CVA (+) kanan.',
      supportingExam: 'Darah rutin: Hb 12, Lekosit 12.000, Trombosit 368.000. Urinalisa: Protein +1. Sedimen: Eritrosit 8-10/lp, Lekosit 40-60/lp, silinder lekosit 10-20/lp.',
      diagnosis: 'Pyelonefritis tanpa komplikasi',
      differentials: ['Pyelonefritis dengan komplikasi', 'Cholecystitis', 'Spondilosis Lumbalis'],
      treatment: 'Fluorokuinolon atau trimetoprim/sulfametoxazol — mis. Levofloxacin 1x250-500mg 7-10 hari, Ciprofloxacin 2x500mg 7-10 hari, atau Cotrimoxazol 2x960mg 14 hari. Contoh resep: R/ Levofloxacin tab 250mg No X, S 1 dd tab 1.',
    },
    standardPatient: {
      nama: 'Ny. S', usia: '40 tahun', jenisKelamin: 'Wanita', pekerjaan: 'Ibu rumah tangga',
      keluhanUtama: 'Nyeri pinggang kanan',
      riwayatPenyakitSekarang: '3 hari, makin nyeri disertai demam menggigil, nyeri juga di perut bawah pusat, mual (+), muntah (-). BAK nyeri, anyang-anyangan ±10 hari. Sering menahan BAK dan kurang minum. VAS 5. Sudah minum parasetamol dan kompres hangat.',
      pertanyaanWajib: 'Saya sakit apa ya dok?',
      peranWajib: 'Kedinginan, lemas, sesekali memegang pinggang kanan.',
    },
    author: 'dr. Heny Syahrini, SpPD — Departemen Ilmu Penyakit Dalam FK USU',
    reference: 'Buku Ajar Ilmu Penyakit Dalam FKUI',
  },
  {
    system: 'Respirasi',
    title: 'Emfisema Paru / PPOK',
    allocatedMinutes: 15,
    skdiLevel: '3A',
    scenario: 'Seorang laki-laki 54 tahun datang ke puskesmas mengeluhkan sesak napas terus-menerus.',
    tasks: [
      'Lakukan anamnesis kepada pasien',
      'Lakukan pemeriksaan fisik pada pasien',
      'Usulkan jenis pemeriksaan penunjang dan lakukan interpretasi atas data yang didapatkan',
      'Tegakkan diagnosis dan tiga (3) diagnosis banding',
      'Berikan tatalaksana non farmakoterapi pada pasien',
      'Berikan tatalaksana farmakoterapi, tuliskan resep',
    ],
    examinerFindings: {
      anamnesis: 'Sesak 2 tahun terakhir, sangat membatasi aktivitas. Batuk dahak kental putih. Tidak demam, tidak ada penurunan BB. Perokok aktif sejak usia 20 tahun, 24 batang/hari.',
      physicalExam: 'TD 110/70, N 104x/menit, R 24x/menit, t 37,6°C. Barrel chest (+). Perkusi hipersonor kedua lapangan paru. Auskultasi vesikuler dengan mengi bilateral.',
      supportingExam: 'Foto toraks: hiperinflasi/hiperlusen. AGDA: PaCO2 60 (hiperkapnia). Spirometri: KVP 83%, VEP1 56%, VEP1/KVP <70% — obstruksi sedang.',
      diagnosis: 'Emfisema paru',
      differentials: ['Bronkitis kronis', 'PPOK', 'Asma'],
      treatment: 'Non-farmako: program berhenti merokok. Farmako: salbutamol inhalasi prn, ambroxol syrup 3x1 sendok makan, metilprednisolon 3x4mg.',
    },
    standardPatient: {
      nama: '(sesuai standardized patient)', usia: '54 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Tukang bengkel',
      keluhanUtama: 'Sesak napas dan batuk dahak',
      riwayatPenyakitSekarang: 'Sesak terus-menerus 2 tahun, batuk dahak kental putih, merokok sejak usia 20 tahun (24 batang/hari), diperparah asap kendaraan.',
    },
    author: 'dr. Syamsul Bihar, SpP — Departemen Ilmu Penyakit Paru FK USU',
    reference: 'Pedoman Penatalaksanaan Asma, PDPI 2011',
  },
  {
    system: 'Indera',
    title: 'Motion Sickness',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu membuat diagnosis klinik dan melakukan penatalaksanaan penyakit secara mandiri dan tuntas.',
    scenario: 'Seorang laki-laki 22 tahun datang ke poliklinik dengan mual muntah dan pusing sejak 1 hari, setelah perjalanan jauh dengan kapal laut.',
    tasks: [
      'Lakukan anamnesis untuk pasien ini',
      'Lakukan pemeriksaan fisik pada pasien ini',
      'Terapi sesuai pasien ini',
      'Tentukan diagnosis, diagnosis banding, dan konseling yang dibutuhkan',
    ],
    examinerFindings: {
      physicalExam: 'TD 110/70, N 80x/menit, R 20x/menit, t 37°C. Status lokalis telinga normal bilateral, membran timpani intak, refleks cahaya (+).',
      diagnosis: 'Motion sickness',
      differentials: ['Cerebrovascular accident', 'Trauma kepala', 'Migrain', 'BPPV'],
      treatment: 'Antikolinergik (scopolamine) atau antihistamin (dimenhydrinate).',
    },
    standardPatient: {
      nama: 'Tn. L', usia: '22 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Mahasiswa',
      keluhanUtama: 'Mual muntah',
      riwayatPenyakitSekarang: 'Sejak 1 hari, terus-menerus, didahului pusing, malaise, mengantuk, mudah tersinggung, rasa penuh epigastrium. Pusing berhubungan dengan gerak berlebihan. Sudah minum metoklopramid.',
      peranWajib: 'Posisi duduk lemas, raut muka pucat.',
    },
    author: 'Departemen THT-KL FK USU',
  },
  {
    system: 'Kardiovaskular',
    title: 'Atrial Fibrilasi + Hipertensi',
    allocatedMinutes: 15,
    skdiLevel: '3B — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus gawat darurat.',
    scenario: 'Seorang laki-laki 45 tahun datang dengan keluhan berdebar sejak 2 minggu, terutama saat beraktivitas dan setelah minum kopi. Diketahui menderita darah tinggi tapi tidak rutin minum obat.',
    tasks: [
      'Lakukan anamnesis pada pasien',
      'Lakukan pemeriksaan fisik pada pasien/manikin',
      'Usulkan pemeriksaan penunjang dan interpretasikan',
      'Tegakkan diagnosis dan dua (2) diagnosis banding',
      'Berikan tatalaksana farmakoterapi, tuliskan resep',
      'Lakukan tatalaksana non farmakoterapi yang relevan',
      'Komunikasikan dan berikan edukasi pada pasien',
    ],
    examinerFindings: {
      physicalExam: 'TD 170/100, N 108x/menit ireguler, R 22x/menit. S1/S2 ireguler, gallop (-). Akral hangat, edema (-).',
      supportingExam: 'EKG: atrial fibrilasi + LVH. Foto toraks: CTR 56%, apex tertanam, tanpa kongesti.',
      diagnosis: 'Atrial Fibrilasi + Hipertensi',
      differentials: ['Atrial Flutter', 'Supraventricular tachycardia'],
      treatment: 'R/ Captopril 25mg PO; R/ Bisoprolol 2,5mg PO; R/ Simarc (warfarin) 2mg PO. Konseling: hindari kopi, batasi garam, olahraga teratur.',
    },
    standardPatient: {
      nama: '-', usia: '45 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Kuli bangunan',
      keluhanUtama: 'Berdebar',
      riwayatPenyakitSekarang: '2 minggu, berdebar tidak beraturan terus-menerus, diperparah aktivitas dan kopi, mengurang istirahat. Riwayat darah tinggi.',
      peranWajib: 'Posisi duduk, ekspresi cemas.',
    },
    author: 'dr. Anggia Chairuddin Lubis, Teuku Bob Haykal — Kardiologi FK USU',
    reference: 'Guideline PERKI 2012',
  },
  {
    system: 'Saraf',
    title: 'Tension Type Headache',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan secara mandiri dan tuntas.',
    scenario: 'Seorang perempuan 45 tahun berobat ke Poliklinik Saraf dengan keluhan sakit kepala berulang.',
    tasks: [
      'Lakukan anamnesis pada pasien tersebut',
      'Lakukan pemeriksaan tanda vital termasuk pemeriksaan neurologis',
      'Sebutkan diagnosis dan diagnosis banding',
      'Jelaskan terapi farmakologi dan non-farmakologi',
    ],
    examinerFindings: {
      anamnesis: 'Sakit kepala berulang 1 tahun, seluruh kepala terasa berat, tengkuk tegang, tidak memberat progresif, bertambah bila capek/kurang tidur/stres, berkurang istirahat. Tidak ada riwayat trauma kepala.',
      physicalExam: 'TD 120/80, N 80x/menit, R 18x/menit, t 37°C. Status neurologis dalam batas normal seluruhnya.',
      diagnosis: 'Tension Type Headache',
      differentials: ['Migrain', 'Tumor otak'],
      treatment: 'Parasetamol 3x500mg atau Ibuprofen 3x400mg. Edukasi: istirahat cukup, pola tidur teratur, olahraga teratur.',
    },
    standardPatient: {
      nama: 'Desi', usia: '45 tahun', jenisKelamin: 'Perempuan', pekerjaan: 'Karyawati swasta',
      keluhanUtama: 'Sakit kepala',
      riwayatPenyakitSekarang: '1 tahun, hilang timbul, kepala berat dan tengkuk tegang, bertambah bila capek/kurang tidur/stres (sering lembur, tidak pernah olahraga), berkurang istirahat.',
      riwayatPenyakitDahulu: 'Hipertensi (-), DM (-), riwayat kepala terbentur disangkal.',
    },
    author: 'dr. Aida Fitri, Sp.S — Departemen Neurologi FK USU',
    reference: 'Konsensus Nyeri Kepala',
  },
  {
    system: 'Reproduksi',
    title: 'Kehamilan Post Matur',
    allocatedMinutes: 15,
    skdiLevel: '3B — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Seorang wanita 32 tahun, G3P2A0, datang untuk kontrol kehamilan.',
    tasks: [
      'Lakukan anamnesis pada pasien ini',
      'Tentukan diagnosis, diagnosis banding, dan penatalaksanaan pasien ini',
    ],
    examinerFindings: {
      anamnesis: 'Perut tegang sesekali. Tidak ada air-air dari kemaluan. Merasa seharusnya sudah melahirkan berdasarkan pemeriksaan bulan sebelumnya. HPHT lupa.',
      physicalExam: 'TD 120/80, N 80x/menit. TFU 2 jari bawah processus xyphoideus, letak kepala, gerak (+), DJJ 148x/menit.',
      supportingExam: 'Hb 10, Ht 36. USG: janin tunggal, gerak (+), DJJ (+), plasenta grade III, AFI 6, biometri sesuai 40-42 minggu.',
      diagnosis: 'Multigravida + kehamilan 40-42 minggu + presentasi kepala + janin hidup (kehamilan post matur)',
      differentials: [],
      treatment: 'Rujuk SpOG. Edukasi risiko post matur: distosia makrosomia, laserasi perineum, peningkatan risiko seksio sesarea; risiko bayi: meconium aspiration syndrome, dysmaturity syndrome.',
    },
    standardPatient: {
      nama: 'Ny. N', usia: '32 tahun', jenisKelamin: 'Perempuan', pekerjaan: 'Pegawai swasta',
      keluhanUtama: 'Kontrol hamil',
      pertanyaanWajib: 'Apakah janin saya baik-baik saja? Apa risikonya? Apa yang sebaiknya saya lakukan?',
      peranWajib: 'Raut cemas.',
    },
    author: 'dr. Riza Rivany, SpOG.K — Universitas Sumatera Utara',
    reference: "Williams Gynecology 2nd ed.; Dewhurst's Textbook of Obstetrics and Gynecology 7th ed.",
  },
  {
    system: 'Endokrin dan Metabolik',
    title: "Hipertiroid (Penyakit Graves)",
    allocatedMinutes: 15,
    skdiLevel: '4A',
    scenario: 'Seorang wanita 20 tahun datang dengan keluhan berdebar-debar, berkeringat, dan cemas sejak 2 minggu.',
    tasks: [
      'Lakukan anamnesis pada pasien',
      'Lakukan pemeriksaan fisik pada pasien',
      'Usulkan pemeriksaan penunjang dan interpretasikan',
      'Tegakkan diagnosis dan diagnosis banding',
      'Berikan terapi farmakologi',
    ],
    examinerFindings: {
      anamnesis: 'Berdasarkan indeks Wayne/New Castle: sesak, mudah lelah, senang hawa dingin, keringat berlebih, gugup, nafsu makan naik, BB turun, diare. Tinggal di wilayah endemik goiter perlu ditanyakan.',
      physicalExam: 'Mata: eksoftalmus (+). Leher: struma difus, bruit (+). Jantung: takikardia. Ekstremitas: tremor (+).',
      supportingExam: 'TSH 0,001 µIU/L, FT3 14, FT4 20. EKG: sinus takikardia. USG tiroid: struma difusa bilateral.',
      diagnosis: 'Penyakit Graves',
      differentials: ['Goiter multinodular', 'Adenoma toksik'],
      treatment: 'PTU 100mg atau Methimazol 30mg.',
    },
    standardPatient: {
      nama: 'A', usia: '20 tahun', jenisKelamin: 'Perempuan', pekerjaan: 'Mahasiswi',
      keluhanUtama: 'Jantung berdebar-debar',
      riwayatPenyakitSekarang: '2 minggu, disertai sesak, mudah lelah, senang hawa dingin, keringat berlebih, gugup, nafsu makan naik, BB turun, diare.',
    },
  },
  {
    system: 'Muskuloskeletal',
    title: 'Ruptur Tendon Achilles',
    allocatedMinutes: 15,
    skdiLevel: '3A — Mampu mendiagnosis, melakukan penatalaksanaan awal, dan merujuk (bukan gawat darurat).',
    scenario: 'Seorang pria 43 tahun datang ke IGD dengan nyeri pada tumit kaki kanan.',
    tasks: [
      'Lakukan anamnesa',
      'Lakukan pemeriksaan fisik',
      'Tentukan pemeriksaan penunjang dan tujuannya',
      'Tegakkan diagnosis utama dan DD',
      'Tentukan tatalaksana non-farmakoterapi',
      'Tentukan tatalaksana farmakoterapi',
    ],
    examinerFindings: {
      physicalExam: 'Ankle kanan — Look: terkesan ada "ruang kosong" posterior ankle di atas kalkaneus, dorsifleksi bertambah dibanding kiri (posisi pronasi, lutut fleksi 90°). Feel: nyeri (+), gap teraba, pulsasi distal (+). Move: plantar fleksi melemah, Thomson test (+).',
      supportingExam: 'X-ray ankle lateral: non-spesifik, untuk menyingkirkan kelainan tulang lain.',
      diagnosis: 'Ruptur tendon Achilles',
      differentials: ['Ankle sprain'],
      treatment: 'Non-farmako: bidai/slab posisi resting equinus. Farmako: NSAID (cox inhibitor 2x7,5/15mg, atau parasetamol 3x500mg, atau asam mefenamat 3x500mg).',
    },
    standardPatient: {
      nama: 'Laki-laki', usia: '43 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Pegawai bank',
      keluhanUtama: 'Nyeri tumit kaki kanan',
      riwayatPenyakitSekarang: '1 jam sebelumnya, bermain badminton, terdengar bunyi "pop" dari kaki kanan diikuti nyeri dan sulit berjalan. Diperparah bila lokasi ditekan, mengurang bila diistirahatkan.',
      pertanyaanWajib: 'Ada tulang saya yang patah? Kenapa pergelangan kaki kanan sulit digerakkan ke atas?',
      peranWajib: 'Kesakitan, kesulitan berjalan, gelisah.',
    },
    reference: "Apley's System of Orthopaedics and Fracture 9th ed.; Orthopaedic Knowledge Update 10",
  },
  {
    system: 'Integumen',
    title: 'Sifilis Stadium 1',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan secara mandiri dan tuntas.',
    scenario: 'Seorang laki-laki 37 tahun datang dengan keluhan tukak pada kelamin sejak 5 hari.',
    tasks: [
      'Lakukan anamnesis untuk pasien ini',
      'Lakukan pemeriksaan fisik pada pasien ini',
      'Tentukan pemeriksaan penunjang yang diperlukan',
      'Tentukan diagnosis dan 2 diagnosis banding',
      'Berikan tatalaksana farmakoterapi',
      'Lakukan komunikasi dan edukasi',
    ],
    examinerFindings: {
      anamnesis: 'Sejak kapan tukak timbul? Nyeri/panas? Riwayat kontak seksual, kapan terakhir, berganti pasangan, pakai kondom? Sudah diobati?',
      physicalExam: 'Genitalia: ulkus soliter, pinggir indurasi, dasar bersih, tidak nyeri tekan. KGB inguinal bilateral membesar, tidak nyeri tekan.',
      supportingExam: 'Lapangan gelap: T. pallidum (+). VDRL 1/16, TPHA 1/80.',
      diagnosis: 'Sifilis stadium 1',
      differentials: ['Ulkus mole', 'Granuloma inguinale'],
      treatment: 'Penisilin G benzatin 2,4 juta unit IM dosis tunggal, atau Penisilin G prokain 600.000 unit IM selama 10 hari.',
    },
    standardPatient: {
      nama: 'Siandri', usia: '37 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Wiraswasta',
      keluhanUtama: 'Tukak pada kelamin',
      riwayatPenyakitSekarang: '5 hari, lokasi batang penis, kering, tidak nyeri.',
    },
    author: 'dr. Cut Putri Hazlianda, M.Ked(DV), SpDV — FK Universitas Sumatera Utara',
    reference: 'Infeksi Menular Seksual ed.3, FK USU 2005',
  },
  {
    system: 'Prosedur/Tindakan',
    title: 'Nasogastric Suction (Keracunan Organofosfat)',
    allocatedMinutes: 15,
    skdiLevel: '4A — menegakkan diagnosis serta penatalaksanaan non-farmakoterapi pada keracunan organofosfat.',
    scenario: 'Perempuan 25 tahun datang dengan muntah setelah minum 1 botol cairan racun serangga, disertai keringat dingin dan air liur banyak. Kesadaran kompos mentis, RR 28x/menit, TD 100/50, N 120x/menit lemah.',
    tasks: [
      'Tentukan diagnosis dan diagnosis banding',
      'Lakukan penatalaksanaan non farmakoterapi (nasogastric suction)',
    ],
    examinerFindings: {
      diagnosis: 'Intoksikasi organofosfat',
      differentials: ['Keracunan makanan (botulismus)'],
      treatment: 'Prosedur NG suction berurutan: cuci tangan, informed consent, posisi Fowler, cek kepatenan nasal, sarung tangan, ukur panjang selang (hidung–telinga–sternum), masukkan ke lubang hidung terbersih, pasien menekuk kepala & menelan saat selang di faring, dorong ke esofagus, cek penempatan (aspirasi + auskultasi lambung), fiksasi plester, aspirasi isi lambung, sambungkan penampung, cuci tangan.',
    },
    author: 'dr. Cut Meliza Zainumi, M.Ked(An), SpAn — Universitas Sumatera Utara',
  },
  {
    system: 'Prosedur/Tindakan',
    title: 'Skin Test Sebelum Injeksi Obat',
    allocatedMinutes: 15,
    skdiLevel: '3B — tatalaksana non-farmakoterapi, komunikasi dan edukasi, perilaku profesional.',
    scenario: 'Laki-laki 50 tahun di IGD didiagnosis Appendisitis Akut, akan dioperasi, dan akan diberi antibiotik Ceftriaxone 1g IV.',
    tasks: ['Lakukan skin test sebelum diberikan injeksi intravena'],
    examinerFindings: {
      treatment: 'Cuci tangan, informed consent, dilusi obat 1/10-1/100-1/1000-1/10.000 dengan NaCl 0,9%/aquabidest, tes di punggung tangan, disinfeksi alkohol 70%, injeksi 0,04mL subkutan hingga bentuk bendungan diameter 4-6mm, tunggu 15-30 menit — positif bila diameter bertambah ≥5mm dari awal.',
    },
    author: 'dr. Cut Meliza Zainumi, M.Ked(An), SpAn — Universitas Sumatera Utara',
    reference: 'Barbaud et al., Guidelines for performing skin tests with drugs, Contact Dermatitis 2001',
  },
  {
    system: 'Reproduksi',
    title: 'Abortus Spontan Komplit',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Seorang wanita 24 tahun, G1P0A0, hamil 2 bulan, datang dengan perdarahan dari kemaluan.',
    tasks: [
      'Lakukan anamnesis pada pasien ini',
      'Tentukan diagnosis, diagnosis banding, dan penatalaksanaan',
    ],
    examinerFindings: {
      anamnesis: 'Perdarahan 2 hari, memberat 1 hari terakhir, disertai mules bawah perut dan keluar jaringan banyak. Sebelumnya perdarahan 2 minggu lalu, kehamilan dinyatakan masih baik oleh SpOG.',
      physicalExam: 'Anemis (+). TD 100/80, N 88x/menit. Inspekulo: darah di ostium tidak mengalir, OUI tertutup. VT: porsio tertutup, nyeri goyang (-), uterus setinggi simfisis, lunak.',
      supportingExam: 'Hb 9. USG: uterus 10x6cm, penebalan endometrium, janin/gestational sac tidak terlihat.',
      diagnosis: 'Abortus komplet',
      differentials: ['Abortus imminens', 'Kehamilan ektopik', 'Missed abortion'],
      treatment: 'R/ Sulfas ferosus 300mg No VI, S2ddtab I; analgetik bila perlu asam mefenamat 500mg. Edukasi: keguguran karena faktor fetus, hanya observasi, perdarahan berkurang dalam 7 hari, kontrol bila berlanjut/demam.',
    },
    standardPatient: {
      nama: 'Ny. N', usia: '24 tahun', jenisKelamin: 'Perempuan', pekerjaan: 'Pegawai swasta',
      keluhanUtama: 'Perdarahan dari kemaluan',
      riwayatPenyakitSekarang: '2 hari, darah tidak mengalir deras, makin sedikit, diperingan bed rest.',
      pertanyaanWajib: 'Apakah saya harus dikuret? Bisakah saya hamil kembali? Kapan?',
      peranWajib: 'Cemas, ketakutan, menahan nyeri perut bawah.',
    },
    author: 'dr. Riza Rivany, SpOG.K — Universitas Sumatera Utara',
  },
  {
    system: 'Prosedur/Tindakan',
    title: 'Syok Hipovolemik — Pemasangan Infus',
    allocatedMinutes: 15,
    skdiLevel: '3B — pemeriksaan fisik, diagnosis, dan penatalaksanaan syok hemoragik.',
    scenario: 'Laki-laki 50 tahun di IGD dengan nyeri kaki kanan pasca kecelakaan, terlihat lemah dan pucat.',
    tasks: [
      'Lakukan pemeriksaan fisik',
      'Tentukan diagnosis dan diagnosis banding',
      'Lakukan penatalaksanaan non-farmakoterapi (pasang infus)',
    ],
    examinerFindings: {
      physicalExam: 'Airway clear. Breathing RR 24x/menit vesikuler. Circulation: akral dingin pucat basah, TD 90/60, N 120x/menit kecil. Exposure: jejas kemerahan, edema, nyeri paha.',
      diagnosis: 'Syok hipovolemik',
      differentials: ['Syok obstruktif/septik', 'Syok neurogenik'],
      treatment: 'Pasang infus berurutan: sambung cairan-infus set, posisi nyaman, identifikasi vena antecubital, torniket proksimal, disinfeksi, insersi IV-catheter sudut 10-30°, konfirmasi flashback, dorong kateter, lepas torniket, sambung set + flush, fiksasi.',
    },
    author: 'dr. Cut Meliza Zainumi, M.Ked(An), SpAn — Universitas Sumatera Utara',
  },
  {
    system: 'Prosedur/Tindakan',
    title: 'Demam Tifoid dengan Dehidrasi — Pemasangan Infus',
    allocatedMinutes: 15,
    skdiLevel: '3B — pemeriksaan fisik, diagnosis, dan penatalaksanaan demam tifoid dengan dehidrasi.',
    scenario: 'Laki-laki 35 tahun (50kg) di IGD dengan demam, nyeri kepala, mual muntah, nyeri otot, diare; lidah berselaput (kotor tengah, tepi/ujung merah).',
    tasks: [
      'Lakukan pemeriksaan fisik',
      'Tentukan diagnosis dan diagnosis banding',
      'Lakukan penatalaksanaan non-farmakoterapi (pasang infus)',
    ],
    examinerFindings: {
      physicalExam: 'RR 22x/menit vesikuler. Akral merah kering, mata cekung. TD 90/50, N 120x/menit lemah, urin 50cc kuning pekat.',
      diagnosis: 'Demam tifoid dengan dehidrasi sedang',
      differentials: ['Demam dengue', 'Demam malaria'],
      treatment: 'Pemasangan infus (prosedur kanulasi vena standar sama seperti station syok hipovolemik).',
    },
    author: 'dr. Raka Jati Prasetya, M.Ked(An), SpAn — Universitas Sumatera Utara',
  },
  {
    system: 'Respirasi',
    title: 'Asma Bronkial',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Laki-laki 35 tahun ke IGD dengan sesak napas memberat sejak 2 hari.',
    tasks: [
      'Lakukan anamnesis terarah',
      'Minta hasil pemeriksaan tanda vital dan fisik paru pada penguji',
      'Sebutkan diagnosis',
      'Identifikasi tanda kegawatdaruratan bila ada',
      'Sebutkan tatalaksana kegawatdaruratan',
      'Minta hasil pemeriksaan pasca tatalaksana awal',
      'Sebutkan pengobatan pulang',
    ],
    examinerFindings: {
      physicalExam: 'TD 140/90, N 110x/menit, R 26x/menit. Otot bantu napas (+). Auskultasi vesikuler dengan mengi bilateral.',
      supportingExam: 'APE 450 L/detik, SpO2 93%. Pasca tatalaksana: TD 120/80, N 76x/menit, R 18x/menit, SpO2 99%, tanpa mengi, APE 550 L/detik.',
      diagnosis: 'Asma akut sedang pada asma persisten sedang, tidak terkontrol',
      differentials: ['Bronkitis akut'],
      treatment: 'Kegawatdaruratan: O2 untuk SpO2≥90%, agonis β2 inhalasi dalam 60 menit, glukokortikosteroid sistemik bila respons tidak segera. Pulang: pelega agonis β2 inhalasi + pengontrol (kortikosteroid inhalasi dosis rendah/sedang + LABA, atau + leukotriene modifier, atau + teofilin lepas lambat).',
    },
    standardPatient: {
      nama: 'Husin', usia: '35 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Pabrik pupuk (pencampuran)',
      keluhanUtama: 'Sesak napas memberat',
      riwayatPenyakitSekarang: 'Serangan hampir tiap hari 3 bulan terakhir, terutama subuh/pulang kerja, memberat posisi tiduran, semprot pelega tanpa perbaikan.',
      riwayatPenyakitDahulu: 'Tifus 3 tahun lalu.',
      riwayatPenyakitKeluarga: 'Ayah dan adik juga menderita asma.',
    },
    author: 'dr. Syamsul Bihar, SpP — Departemen Ilmu Penyakit Paru FK USU',
    reference: 'Pedoman Penatalaksanaan Asma PDPI 2011; GINA 2012',
  },
  {
    system: 'Saraf',
    title: "Bell's Palsy",
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan secara mandiri dan tuntas.',
    scenario: 'Laki-laki 45 tahun dengan mulut mencong tiba-tiba saat bangun tidur pagi.',
    tasks: [
      'Lakukan anamnesis pada pasien tersebut',
      'Lakukan pemeriksaan tanda vital dan neurologis',
      'Sebutkan diagnosis dan diagnosis banding',
      'Jelaskan terapi farmakologi dan non-farmakologi',
    ],
    examinerFindings: {
      anamnesis: 'Mulut mencong tiba-tiba sejak 1 hari saat bangun tidur, kelopak mata kiri sulit menutup, malam sebelumnya terpapar angin kencang.',
      physicalExam: 'Asimetri wajah kiri, kerut kening kiri hilang, lagoftalmus kiri, mulut tertarik ke kanan, sulit menggembungkan pipi kiri → paresis N.VII sinistra LMN. Saraf kranial lain, motorik, refleks, sensorik normal.',
      diagnosis: "Bell's palsy sinistra",
      differentials: ['Stroke batang otak'],
      treatment: 'Non-farmako: massage, exercise, fisioterapi setelah 1 minggu onset. Farmako: prednison 4x4 tab (1 minggu, tapering), mecobalamin 3x500mg. Edukasi: hindari kompres panas 1 minggu pertama, hindari mengunyah permen karet.',
    },
    standardPatient: {
      nama: 'Ardi', usia: '45 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Karyawan swasta',
      keluhanUtama: 'Kelopak mata kiri sulit menutup dan mulut mencong',
      riwayatPenyakitSekarang: '1 hari, tiba-tiba saat bangun pagi, malam sebelumnya terpapar angin kencang. Tidak ada sakit kepala, gangguan penglihatan/pendengaran, bicara pelo, kelemahan tubuh.',
      riwayatPenyakitDahulu: 'Hipertensi (-), DM (-), trauma kepala disangkal.',
      peranWajib: 'Kerut kening kiri hilang, kelopak mata kiri sulit menutup, mulut mencong, sulit menggembungkan pipi kiri.',
    },
  },
  {
    system: 'Psikiatri',
    title: 'Gangguan Bipolar Episode Manik',
    allocatedMinutes: 15,
    skdiLevel: '3A — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Perempuan 28 tahun diantar keluarga dengan keluhan bicara tak henti-henti.',
    tasks: [
      'Lakukan wawancara psikiatrik',
      'Tuliskan status mental PS pada rekam medis, berikan kepada penguji',
      'Tetapkan diagnosis dan diagnosis banding, sampaikan ke keluarga PS',
      'Berikan resep terapi farmakologik',
      'Lakukan edukasi kelanjutan terapi',
    ],
    examinerFindings: {
      anamnesis: 'Sejak kapan gejala timbul? Mudah marah? Tidur terganggu? Lebih boros? Pernah episode depresi (mengurung diri, menangis)? Riwayat keluarga sama? Zat adiktif? Trauma kepala? Pembedahan? Obat rutin? Alergi?',
      physicalExam: 'Dandanan mencolok berlebihan, hiperaktif, GCS E4V5M6, mood elevated/labil, pembicaraan cepat/produktif, flight of ideas (+), halusinasi dengar (+), waham kebesaran (yakin dirinya artis terkenal), konsentrasi terganggu, pengendalian impuls terganggu, tilikan derajat 1.',
      diagnosis: 'Gangguan afektif bipolar, episode kini manik dengan gejala psikotik',
      differentials: ['Episode manik tanpa gejala psikotik', 'Gangguan Skizoafektif Tipe Manik', 'Skizofrenia Paranoid'],
      treatment: 'Pilih salah satu mood stabilizer/antipsikotik: Risperidone 2x1mg; Quetiapine 2x250mg; kombinasi Divalproat 2dd250mg + Risperidone 1dd2mg; Carbamazepine 2dd200mg.',
    },
    standardPatient: {
      nama: 'Rina', usia: '28 tahun', jenisKelamin: 'Perempuan', pekerjaan: 'Karyawati swasta',
      keluhanUtama: 'Bicara tak henti-henti dan mudah marah',
      riwayatPenyakitSekarang: '10 hari, makin parah: tidak tidur, bicara terus tak bisa dihentikan, ingin keluar rumah, belanja tidak perlu, merasa tidak butuh tidur tetap segar.',
      riwayatPenyakitDahulu: '6 bulan lalu episode tidak mau keluar rumah, tidak mau bicara/makan, sering menangis ±2 minggu, pulih setelah berobat.',
      peranWajib: 'Berdandan menor, bicara tak henti-henti, sesekali bernyanyi, menggoda dokternya.',
    },
    author: 'Dr. dr. Elmeida Effendy, M.Ked.KJ, Sp.KJ(K) — FK Universitas Sumatera Utara',
    reference: "PPDGJ III 1993; Kaplan & Sadock's Synopsis of Psychiatry, 10th ed.",
  },
  {
    system: 'Kardiovaskular',
    title: 'Angina Pectoris Stabil',
    allocatedMinutes: 15,
    skdiLevel: '3B — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus gawat darurat.',
    scenario: 'Laki-laki 48 tahun ke praktik umum mengeluhkan nyeri dada kiri.',
    tasks: [
      'Lakukan anamnesis pada pasien',
      'Lakukan pemeriksaan fisik pada pasien',
      'Usulkan pemeriksaan penunjang dan interpretasikan',
      'Tegakkan diagnosis dan diagnosis banding',
      'Berikan tatalaksana farmakoterapi, tuliskan resep',
      'Komunikasikan dan berikan edukasi',
    ],
    examinerFindings: {
      anamnesis: '1 bulan terakhir, makin memberat 3 hari terakhir, nyeri saat aktivitas berat, seperti tertindih benda berat, tembus ke punggung, durasi 5 menit, tanpa keringat dingin/mual. Merokok 2 bungkus/hari. Dua saudara kandung meninggal mendadak.',
      physicalExam: 'TD 135/85, N 86x/menit. JVP R+2. Auskultasi jantung normal, gallop (-). Akral hangat, edema (-).',
      supportingExam: 'EKG: sinus ritme, iskemia anterolateral. Foto toraks: CTR 46%, tanpa kongesti/infiltrat.',
      diagnosis: 'Angina Pektoris Stabil',
      differentials: ['Sindrom Koroner Akut', 'Dispepsia', 'Angina on Hypertension', 'Nyeri otot'],
      treatment: 'R/ Aspirin 80mg 1dd1; R/ ISDN 5mg 3dd1. Konseling: olahraga teratur, stop merokok, hindari stres, hindari makanan berlemak/alkohol.',
    },
    standardPatient: {
      nama: '-', usia: '48 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Karyawan bank',
      keluhanUtama: 'Nyeri dada kiri',
      riwayatPenyakitSekarang: '1 bulan, substernal, durasi 5 menit, 2-4x/hari, tertindih benda berat, tembus punggung, memberat 3 hari terakhir, VAS 4-5, diperparah aktivitas berat, mengurang istirahat.',
      pertanyaanWajib: 'Beratkah penyakit saya? Apakah saya akan meninggal mendadak seperti saudara-saudara saya?',
      peranWajib: 'Duduk, muka cemas, sesekali meringis nyeri dada kiri.',
    },
    author: 'dr. Anggia Chairuddin Lubis, Teuku Bob Haykal — Kardiologi FK USU',
    reference: 'Guideline PERKI 2012',
  },
  {
    system: 'Kardiovaskular',
    title: 'Cardiorespiratory Arrest (RJP/CPR)',
    allocatedMinutes: 15,
    skdiLevel: '3B',
    scenario: 'Laki-laki 65 tahun di puskesmas dengan nyeri dada, 2 menit kemudian tidak bernapas.',
    tasks: [
      'Lakukan pemeriksaan fisik',
      'Tentukan diagnosis',
      'Lakukan penanganan awal',
    ],
    examinerFindings: {
      physicalExam: 'Cek kesadaran (tepuk bahu, panggil keras) — tidak respons. Panggil bantuan. Bebaskan jalan napas (head tilt-chin lift/jaw thrust) — tidak bernapas. Raba a. karotis — tidak teraba.',
      diagnosis: 'Cardio-respiratory arrest',
      treatment: 'Kompresi 30x (posisi tegak lurus dada, siku lurus, kedalaman 2 inci, cepat, 100x/menit, beri chest recoil), lalu 2 napas buatan (>1 detik/hembusan hingga dada terangkat). Ulangi 30:2 selama 2 menit/5 siklus. Nilai ROSC (nadi + napas spontan). Posisikan recovery position. Rujuk RS ber-ICU.',
    },
    author: 'dr. Cut Meliza Zainumi, M.Ked(An), SpAn — Universitas Sumatera Utara',
  },
  {
    system: 'Hematologi dan Imunologi',
    title: 'Dengue Hemorrhagic Fever Grade I',
    allocatedMinutes: 15,
    skdiLevel: '4A — Mampu mendiagnosis, melakukan penatalaksanaan secara mandiri dan tuntas.',
    scenario: 'Wanita 30 tahun dengan demam 3 hari, naik-turun tidak pernah normal, turun dengan parasetamol, nyeri kepala dahi-belakang mata. Tidak ada mual/muntah atau perdarahan spontan.',
    tasks: [
      'Lakukan pemeriksaan Rumple Leed dan Bleeding Time metode Ivy, interpretasikan',
      'Usulkan pemeriksaan penunjang dan interpretasikan',
      'Tegakkan diagnosis dan dua (2) diagnosis banding',
    ],
    examinerFindings: {
      physicalExam: 'Rumple Leed: manset ke 100mmHg (rata-rata TD 120/80 + diastolik ÷2), tahan 10 menit, positif bila petekie >10 dalam 1 inci di bawah fossa cubiti — hasil 25 petekie (positif). Bleeding Time (Ivy): manset 40mmHg, tusuk volar lengan bawah, hitung waktu hingga henti perdarahan — normal <6 menit, hasil 3 menit.',
      supportingExam: 'Hb 12, Ht 36%, Lekosit 3.000, Trombosit 102.000.',
      diagnosis: 'DHF grade I',
      differentials: ['Chikungunya', 'Demam tifoid', 'Campak/Morbili'],
      treatment: 'Edukasi hidrasi oral adekuat; boleh rawat jalan bila Hb/Ht normal, trombosit >100.000, tidak muntah, masih bisa makan/minum — dengan syarat kontrol darah 24 jam kemudian. Rawat inap bila trombosit turun progresif atau Hb/Ht meningkat (hemokonsentrasi).',
    },
    author: 'dr. Heny Syahrini, SpPD — Departemen Ilmu Penyakit Dalam FK USU',
    reference: 'Buku Ajar Ilmu Penyakit Dalam FKUI',
  },
  {
    system: 'Muskuloskeletal',
    title: 'Fraktur Klavikula',
    allocatedMinutes: 15,
    skdiLevel: '3A — Mampu mendiagnosis, melakukan penatalaksanaan awal, merujuk kasus bukan gawat darurat.',
    scenario: 'Laki-laki 31 tahun ke IGD dengan nyeri bahu kiri pasca kecelakaan motor. Primary survey clear.',
    tasks: [
      'Lakukan anamnesa',
      'Lakukan pemeriksaan fisik (look-feel-move)',
      'Minta pemeriksaan penunjang (x-ray thorax/klavikula) dan interpretasikan',
      'Tegakkan diagnosis',
      'Lakukan tatalaksana non-farmako (imobilisasi)',
      'Berikan resep farmako',
    ],
    examinerFindings: {
      physicalExam: 'Look: swelling 1/3 tengah klavikula kiri, tanpa laserasi. Feel: nyeri tekan (+), sensorik normal, pulsasi distal normal. Move: ROM bahu terbatas karena nyeri.',
      supportingExam: 'X-ray: diskontinuitas 1/3 tengah klavikula kiri dengan displacement jelas.',
      diagnosis: 'Fraktur tertutup 1/3 tengah klavikula kiri',
      differentials: [],
      treatment: 'Non-farmako: arm sling atau figure-of-eight bandage. Farmako: NSAID (cox inhibitor 2x7,5/15mg, atau parasetamol 3x500mg, atau asam mefenamat 3x500mg). Edukasi keamanan berkendara.',
    },
    standardPatient: {
      nama: 'Udin', usia: '31 tahun', jenisKelamin: 'Laki-laki', pekerjaan: 'Seniman',
      keluhanUtama: 'Nyeri bahu kiri',
      riwayatPenyakitSekarang: '2 jam lalu, kecelakaan motor (ditabrak dari kanan), jatuh ke kiri menahan beban dengan bahu, memakai helm, sadar penuh, tanpa mual/muntah. Nyeri terlokalisir klavikula kiri, memberat digerakkan.',
      pertanyaanWajib: 'Apa tulang saya patah? Bisa sembuh? Perlu operasi?',
      peranWajib: 'Malas menggerakkan tubuh, nyeri bertambah saat bahu digerakkan.',
    },
    author: 'dr. Iman Dwi Winanto, SpOT — Departemen Bedah Ortopedi FK USU',
    reference: "Rockwood and Green's Fractures in Adults 7th ed.; Handbook of Fractures 3rd ed.",
  },
]
