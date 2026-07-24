// ─────────────────────────────────────────────────────────────────────────────
// OSCE Station Notes — substantive per-case teaching content (anamnesis,
// physical exam, diagnostic criteria, management) to accompany the OSCE Case
// Bank's frequency list. Written and verified against standard clinical
// teaching (SKDI 4A competency expectations, standard neurology/internal
// medicine/OB-GYN references) — not verbatim from any single source. Being
// filled in system by system; a case with no entry here still appears in the
// Case Bank with just its frequency tag until its notes are added.
//
// Keyed by the exact `name` string used in `osceCaseBank.ts`'s OSCE_CASES.
// ─────────────────────────────────────────────────────────────────────────────

export interface OsceStationNote {
  anamnesis: string[]
  pemeriksaanFisik: string[]
  kriteriaDiagnosis: string
  tatalaksana: string[]
  tips?: string
}

export const OSCE_STATION_NOTES: Record<string, OsceStationNote> = {
  // ─── Saraf (Neurologi) ─────────────────────────────────────────────────
  'BPPV (Benign Paroxysmal Positional Vertigo)': {
    anamnesis: [
      'Vertigo berputar mendadak, durasi singkat (<1 menit), dipicu perubahan posisi kepala (bangun tidur, menoleh, menunduk)',
      'Tidak ada gangguan pendengaran atau tinnitus',
      'Tidak ada gejala neurologis fokal lain (bicara pelo, kelemahan anggota gerak)',
      'Tanyakan riwayat trauma kepala atau infeksi telinga sebelumnya',
    ],
    pemeriksaanFisik: [
      'Dix-Hallpike maneuver: posisikan pasien duduk, kepala menoleh 45°, lalu baringkan cepat dengan kepala menggantung 20-30° di bawah horizontal — perhatikan nistagmus rotatorik dengan latensi beberapa detik, durasi <1 menit, dan fatigable (menghilang bila diulang)',
      'Pemeriksaan neurologis umum harus normal (tidak ada defisit fokal)',
      'Tes pendengaran (Rinne/Weber) normal',
    ],
    kriteriaDiagnosis: 'Vertigo posisional paroksismal berulang + Dix-Hallpike positif dengan nistagmus khas (rotatorik, laten, fatigable) tanpa defisit neurologis lain.',
    tatalaksana: [
      'Epley maneuver (canalith repositioning) dilakukan langsung di ruang periksa, dapat diulang bila belum efektif',
      'Betahistin oral sebagai terapi simtomatik tambahan (bukan pengganti reposisi)',
      'Edukasi: hindari gerakan kepala mendadak 24-48 jam pasca-reposisi, latihan Brandt-Daroff di rumah bila rekuren',
    ],
    tips: 'Station ini sering menilai kemampuan melakukan Dix-Hallpike dan Epley maneuver secara langsung — latih urutan gerakan sampai lancar, bukan hanya hafal teori.',
  },
  "Bell's Palsy": {
    anamnesis: [
      'Kelemahan wajah sepihak mendadak (onset jam-hari), tanpa kelemahan anggota gerak',
      'Gejala penyerta: nyeri di belakang telinga, gangguan pengecapan 2/3 anterior lidah, hiperakusis, mata kering/berair',
      'Riwayat infeksi virus sebelumnya (herpes simpleks sering dicurigai sebagai etiologi)',
      'Singkirkan faktor risiko stroke — bila ada kelemahan anggota gerak, curigai lesi sentral bukan Bell’s palsy',
    ],
    pemeriksaanFisik: [
      'Minta pasien mengangkat alis, menutup mata rapat, tersenyum, mengembungkan pipi — pada Bell’s palsy (perifer) seluruh otot wajah satu sisi termasuk dahi ikut lemah',
      'Tanda Bell (mata tidak menutup sempurna, bola mata berputar ke atas saat mencoba menutup)',
      'Uji pengecapan 2/3 anterior lidah dan refleks kornea',
    ],
    kriteriaDiagnosis: 'Paresis N. VII perifer (LMN) — melibatkan otot dahi (tidak bisa mengerutkan dahi), berbeda dari paresis sentral (UMN) yang dahi masih bisa berkerut karena persarafan bilateral kortikal ke otot dahi.',
    tatalaksana: [
      'Kortikosteroid oral (prednison) dosis penuh, dimulai sedini mungkin (idealnya <72 jam onset) untuk mempercepat pemulihan',
      'Pelindung mata: air mata buatan siang hari, salep mata + plester malam hari untuk mencegah keratopati exposure',
      'Fisioterapi/latihan otot wajah',
      'Antivirus (asiklovir) dapat dipertimbangkan pada kasus berat sebagai tambahan, bukan pengganti steroid',
    ],
    tips: 'Poin penilaian kunci: membedakan LMN vs UMN lewat pemeriksaan dahi, dan edukasi perlindungan mata (sering terlewat peserta).',
  },
  'Tension Type Headache (TTH)': {
    anamnesis: [
      'Nyeri kepala bilateral, seperti diikat/ditekan (bukan berdenyut), intensitas ringan-sedang, tidak memberat dengan aktivitas fisik rutin',
      'Tidak ada mual/muntah berat; fotofobia ATAU fonofobia boleh salah satu, tapi tidak keduanya',
      'Pemicu: stres, kurang tidur, posisi kerja lama (postur leher)',
      'Singkirkan red flags: onset mendadak "thunderclap", demam, defisit neurologis, perubahan pola nyeri kepala kronis',
    ],
    pemeriksaanFisik: [
      'Pemeriksaan neurologis normal',
      'Palpasi otot perikranial (temporalis, trapezius, oksipital) — sering teraba tegang/nyeri tekan',
    ],
    kriteriaDiagnosis: 'Kriteria IHS: nyeri kepala bilateral, menekan/mengikat, ringan-sedang, tidak memberat dengan aktivitas, tanpa mual/muntah signifikan, minimal salah satu dari fotofobia/fonofobia.',
    tatalaksana: [
      'Analgesik sederhana (parasetamol/NSAID) untuk episode akut',
      'Edukasi manajemen stres, perbaikan pola tidur & postur',
      'Bila kronis (>15 hari/bulan): pertimbangkan profilaksis (amitriptilin dosis rendah)',
    ],
  },
  'Cluster Headache': {
    anamnesis: [
      'Nyeri kepala unilateral periorbital/temporal sangat hebat, episodik, durasi 15-180 menit, dapat berulang beberapa kali sehari dalam periode "cluster" (minggu-bulan)',
      'Gejala otonom ipsilateral: mata merah berair, hidung tersumbat/berair, ptosis, miosis',
      'Pasien cenderung gelisah/mondar-mandir saat serangan (berbeda dari migrain yang cenderung diam di tempat gelap)',
    ],
    pemeriksaanFisik: [
      'Selama serangan: injeksi konjungtiva, lakrimasi, kongesti nasal ipsilateral, ptosis/miosis ringan (sindrom Horner parsial) pada sisi nyeri',
      'Pemeriksaan neurologis interiktal normal',
    ],
    kriteriaDiagnosis: 'Nyeri kepala unilateral berat episodik dengan gejala otonom trigeminal ipsilateral (lakrimasi, kongesti nasal, ptosis/miosis) sesuai kriteria IHS untuk cluster headache.',
    tatalaksana: [
      'Serangan akut: oksigen 100% aliran tinggi via masker non-rebreathing, atau triptan (sumatriptan subkutan/nasal)',
      'Profilaksis periode cluster: verapamil lini pertama',
      'Edukasi hindari pemicu (alkohol) selama periode aktif cluster',
    ],
  },
  'Migrain (dengan/tanpa aura)': {
    anamnesis: [
      'Nyeri kepala unilateral berdenyut, sedang-berat, memberat dengan aktivitas fisik rutin',
      'Disertai mual/muntah dan/atau fotofobia + fonofobia (keduanya)',
      'Aura (gangguan visual seperti kilatan cahaya/scotoma, parestesia) yang mendahului nyeri kepala pada migrain dengan aura',
      'Durasi tanpa terapi 4-72 jam; riwayat keluarga migrain sering positif',
    ],
    pemeriksaanFisik: [
      'Pemeriksaan neurologis interiktal normal',
      'Bila aura persisten/atipikal, singkirkan penyebab sekunder (TIA, dll)',
    ],
    kriteriaDiagnosis: 'Minimal 5 episode nyeri kepala unilateral berdenyut, sedang-berat, memberat aktivitas, disertai mual/muntah atau foto+fonofobia, durasi 4-72 jam (kriteria IHS), tanpa penyebab sekunder.',
    tatalaksana: [
      'Serangan akut ringan-sedang: NSAID/parasetamol',
      'Serangan sedang-berat: triptan (sumatriptan)',
      'Profilaksis bila serangan sering (>4x/bulan atau mengganggu aktivitas): beta-blocker (propranolol), amitriptilin, atau topiramat',
      'Edukasi identifikasi & hindari pemicu (kurang tidur, makanan tertentu, stres, hormonal)',
    ],
  },
  'Kejang Demam Sederhana (KDS)': {
    anamnesis: [
      'Anak usia 6 bulan - 5 tahun dengan kejang saat demam (biasanya suhu naik cepat)',
      'Kejang umum tonik-klonik, durasi <15 menit, hanya 1 kali dalam 24 jam',
      'Tidak ada riwayat kejang tanpa demam sebelumnya, tidak ada tanda infeksi SSP',
      'Riwayat kejang demam pada keluarga (faktor risiko genetik)',
    ],
    pemeriksaanFisik: [
      'Pasca-kejang, anak kembali sadar penuh (tidak ada defisit neurologis fokal residual)',
      'Cari sumber demam (faringitis, otitis, ISK, dll)',
      'Tidak ada tanda rangsang meningeal (kaku kuduk, Brudzinski, Kernig) — bila ada, curigai meningitis, bukan KDS',
    ],
    kriteriaDiagnosis: 'Kejang umum, durasi <15 menit, 1 kali per episode demam, tanpa kelainan neurologis pre/post-iktal, usia 6 bulan-5 tahun, tanpa infeksi SSP.',
    tatalaksana: [
      'Tatalaksana kejang akut bila masih berlangsung: diazepam rektal',
      'Antipiretik (parasetamol/ibuprofen) — tidak terbukti mencegah kejang demam berulang tapi diberikan untuk kenyamanan',
      'Edukasi orang tua: KDS umumnya jinak, ajarkan pertolongan pertama saat kejang (posisi miring, jangan memasukkan benda ke mulut), kapan harus ke IGD (kejang >5 menit, kejang fokal, kesadaran tidak pulih)',
    ],
    tips: 'Edukasi orang tua adalah poin penilaian utama — pastikan sampaikan bahwa KDS tidak menyebabkan epilepsi pada mayoritas kasus.',
  },
  'Epilepsi': {
    anamnesis: [
      'Kejang berulang tanpa provokasi (bukan karena demam/gangguan metabolik akut)',
      'Tipe kejang: fokal (dengan/tanpa gangguan kesadaran) atau umum (tonik-klonik, absans, mioklonik)',
      'Aura sebelum kejang, durasi, kondisi pasca-iktal (kebingungan, tidur)',
      'Faktor risiko: trauma kepala, infeksi SSP, riwayat keluarga epilepsi',
    ],
    pemeriksaanFisik: [
      'Pemeriksaan neurologis interiktal (bisa normal pada epilepsi idiopatik)',
      'Cari tanda defisit fokal yang mengarah ke lesi struktural',
    ],
    kriteriaDiagnosis: 'Minimal 2 kejang tanpa provokasi berjarak >24 jam, ATAU 1 kejang dengan risiko rekurensi tinggi (lesi struktural pada EEG/pencitraan).',
    tatalaksana: [
      'OAE lini pertama sesuai tipe kejang: fokal → karbamazepin/asam valproat; umum tonik-klonik → asam valproat; absans → etosuksimid/asam valproat',
      'Edukasi kepatuhan minum obat teratur, hindari pemicu (kurang tidur, alkohol, stroboskopik pada fotosensitif)',
      'Edukasi keselamatan: hindari aktivitas berisiko tinggi (berenang sendirian, memanjat) sampai kejang terkontrol',
    ],
  },
  'Stroke Iskemik': {
    anamnesis: [
      'Onset defisit neurologis fokal MENDADAK (menit-jam): kelemahan/parestesia satu sisi tubuh, bicara pelo/afasia, deviasi wajah',
      'Waktu onset PASTI (krusial untuk keputusan trombolisis — window time <4.5 jam)',
      'Faktor risiko: hipertensi, DM, dislipidemia, fibrilasi atrium, merokok',
      'Singkirkan gejala yang mengarah ke perdarahan (nyeri kepala hebat mendadak, muntah proyektil, penurunan kesadaran cepat)',
    ],
    pemeriksaanFisik: [
      'Skor NIHSS untuk menilai derajat defisit',
      'Tanda UMN: hemiparesis, refleks patologis (Babinski) positif, kelemahan wajah TIDAK melibatkan dahi (dahi simetris — beda dari Bell’s palsy)',
      'Periksa tekanan darah, irama jantung (fibrilasi atrium sebagai sumber emboli)',
    ],
    kriteriaDiagnosis: 'Defisit neurologis fokal mendadak akibat gangguan vaskular, dikonfirmasi CT scan kepala non-kontras TANPA gambaran perdarahan — CT juga bisa awalnya normal pada stroke iskemik akut dini.',
    tatalaksana: [
      'CT scan kepala non-kontras SEGERA untuk membedakan iskemik vs hemoragik sebelum terapi apapun',
      'Bila iskemik dan dalam window time: trombolisis IV (rtPA) atau trombektomi mekanik pada kasus tertentu',
      'Kontrol tekanan darah sesuai protokol (tidak diturunkan agresif kecuali >220/120 pada stroke iskemik akut)',
      'Antiplatelet (aspirin) setelah menyingkirkan perdarahan, rehabilitasi dini',
    ],
    tips: 'Jangan berikan aspirin/antiplatelet sebelum CT scan menyingkirkan perdarahan — kesalahan umum peserta OSCE.',
  },
  'Stroke Hemoragik / TIA': {
    anamnesis: [
      'Stroke hemoragik: onset mendadak dengan nyeri kepala hebat, muntah, penurunan kesadaran cepat, sering saat aktivitas/tekanan darah tinggi tidak terkontrol',
      'TIA: defisit neurologis fokal mendadak yang PULIH SEMPURNA dalam <24 jam (umumnya <1 jam) tanpa infark permanen pada pencitraan',
    ],
    pemeriksaanFisik: [
      'Stroke hemoragik: penurunan kesadaran lebih sering & berat dibanding iskemik, tanda peningkatan tekanan intrakranial (papiledema, Cushing triad pada kasus berat)',
      'TIA: pemeriksaan neurologis saat diperiksa bisa sudah normal — anamnesis riwayat defisit sesaat adalah kunci',
    ],
    kriteriaDiagnosis: 'Stroke hemoragik: CT scan menunjukkan perdarahan intraserebral/subarachnoid. TIA: defisit neurologis fokal reversibel sempurna <24 jam tanpa bukti infark akut pada pencitraan (MRI DWI lebih sensitif dari CT).',
    tatalaksana: [
      'Stroke hemoragik: kontrol tekanan darah lebih ketat, evaluasi bedah saraf bila indikasi (volume hematoma besar, herniasi), hindari antikoagulan/antiplatelet',
      'TIA: evaluasi cepat faktor risiko (skor ABCD2) untuk stratifikasi risiko stroke berikutnya, mulai antiplatelet & modifikasi faktor risiko segera',
    ],
  },
  'Meningitis / Meningoensefalitis': {
    anamnesis: [
      'Trias klasik: demam, nyeri kepala hebat, kaku kuduk — onset akut (bakterial) vs subakut (TB/jamur)',
      'Pada ensefalitis tambahkan: penurunan kesadaran, kejang, perubahan perilaku (keterlibatan parenkim otak)',
      'Riwayat kontak/wabah, status imunisasi (Hib, pneumokokus, meningokokus), status imun (HIV)',
    ],
    pemeriksaanFisik: [
      'Kaku kuduk, tanda Brudzinski (fleksi leher memicu fleksi lutut-panggul involunter), tanda Kernig (nyeri/tahanan ekstensi lutut saat panggul fleksi 90°)',
      'Penilaian kesadaran (GCS), cari petekie/purpura (curiga meningitis meningokokus)',
      'Tanda peningkatan TIK (bila ada, pungsi lumbal ditunda sampai pencitraan menyingkirkan kontraindikasi)',
    ],
    kriteriaDiagnosis: 'Klinis (trias meningeal) dikonfirmasi analisis cairan serebrospinal dari pungsi lumbal: bakterial (leukosit tinggi predominan PMN, glukosa rendah, protein tinggi); viral (leukosit lebih rendah, predominan limfosit, glukosa normal); TB (limfositik, glukosa sangat rendah, protein sangat tinggi).',
    tatalaksana: [
      'Antibiotik empiris segera (jangan tunda menunggu hasil kultur) — sefalosporin generasi 3 (seftriakson/sefotaksim) lini pertama dewasa',
      'Deksametason dapat diberikan sebelum/bersamaan dosis pertama antibiotik pada dugaan meningitis bakterial (mengurangi risiko komplikasi neurologis termasuk gangguan pendengaran)',
      'Pungsi lumbal SEGERA kecuali kontraindikasi (tanda peningkatan TIK berat, defisit fokal — lakukan CT dulu)',
    ],
    tips: 'Antibiotik empiris tidak boleh ditunda menunggu pungsi lumbal/CT bila pasien tampak sakit berat/sepsis.',
  },
  'HNP / Low Back Pain': {
    anamnesis: [
      'Nyeri punggung bawah menjalar ke tungkai (radikulopati) sesuai dermatom, diperberat batuk/bersin/mengejan',
      'Red flags: nyeri malam hari tidak membaik istirahat, penurunan berat badan, riwayat kanker, gangguan BAB/BAK (curiga cauda equina)',
      'Onset, mekanisme cedera (mengangkat beban berat, postur salah)',
    ],
    pemeriksaanFisik: [
      'Straight Leg Raise (Lasegue) test positif bila nyeri menjalar timbul pada elevasi tungkai 30-70°',
      'Kekuatan motorik, sensorik dermatomal, dan refleks tendon sesuai level suspek (L4, L5, S1)',
      'Saddle anesthesia/inkontinensia — bila positif, kegawatdaruratan cauda equina syndrome, rujuk bedah saraf segera',
    ],
    kriteriaDiagnosis: 'Nyeri radikular dengan Lasegue positif dan defisit neurologis dermatomal sesuai, dikonfirmasi MRI lumbal bila ada indikasi (red flags atau defisit progresif).',
    tatalaksana: [
      'Tanpa red flags: analgesik (NSAID), edukasi aktivitas bertahap (hindari bed rest total berkepanjangan), fisioterapi',
      'Bila red flags/cauda equina: rujuk segera untuk MRI cito & evaluasi bedah saraf',
      'Edukasi ergonomi & mekanika tubuh saat mengangkat beban',
    ],
  },
  'Carpal Tunnel Syndrome (CTS)': {
    anamnesis: [
      'Kesemutan/nyeri di jari 1-3 dan setengah radial jari 4 (distribusi N. medianus), memberat malam hari',
      'Faktor risiko: pekerjaan repetitif tangan, kehamilan, hipotiroid, DM, RA',
    ],
    pemeriksaanFisik: [
      'Phalen test: fleksi pergelangan tangan maksimal, tunggu 60 detik — gejala muncul/memberat',
      'Tinel sign: perkusi di atas terowongan karpal dengan posisi tangan dorsofleksi — timbul parestesia/nyeri pada distribusi N. medianus',
      'Flick\'s sign: pasien diminta mengibas-ibaskan tangan — keluhan berkurang (mendukung CTS)',
      'Froment\'s sign positif mengarah ke cubital tunnel syndrome (diagnosis banding N. ulnaris, bukan CTS)',
      'Pemeriksaan lokalis thenar/hipotenar (inspeksi, palpasi, gerakan) — atrofi thenar pada kasus lanjut',
      'DD yang perlu disingkirkan: polineuropati DM, defisiensi vitamin B12',
    ],
    kriteriaDiagnosis: 'Gejala klinis khas + Phalen/Tinel/Flick positif; baku emas konfirmasi adalah nerve conduction study (studi konduksi saraf/EMG).',
    tatalaksana: [
      'Non-medikamentosa: rest, ice pack, istirahatkan pergelangan tangan, bidai/wrist splint, edukasi mengurangi aktivitas yang melibatkan kompresi wrist',
      'Medikamentosa: gabapentin 100mg 3x1, mecobalamin 500mcg 3x1',
      'Penunjang: darah perifer lengkap, MCV/MCHC, GDS, HbA1c (singkirkan neuropati DM sebagai penyebab); EMG/nerve conduction study sebagai baku emas',
      'Operasi release terowongan karpal bila gagal konservatif atau ada atrofi/defisit motorik',
    ],
  },
  'Tarsal Tunnel Syndrome': {
    anamnesis: [
      'Nyeri/kesemutan telapak kaki (distribusi N. tibialis posterior), memberat berdiri/berjalan lama',
      'Faktor risiko: deformitas kaki, trauma pergelangan kaki, edema',
    ],
    pemeriksaanFisik: [
      'Look: edema, eritema, deformitas kaki',
      'Feel: nyeri tekan di area maleolus medial dan heel bagian plantar (DD: plantar fasciitis)',
      'Move: minta pasien dorsofleksi sendiri (bila tidak bisa, arahkan curiga peroneal palsy) dan minta berjalan — khas menumpu pada bagian belakang kaki',
      'Tinel sign di area maleolus medial; special test tambahan: dorsiflexion & eversion test memicu gejala',
      'Gejala diperberat pembebanan tubuh, memberat malam hari',
    ],
    kriteriaDiagnosis: 'Gejala klinis (nyeri sensoris plantar akibat kompresi N. tibialis posterior di area maleolus medial) + Tinel/dorsiflexion-eversion test positif, dikonfirmasi EMG bila tersedia.',
    tatalaksana: [
      'Non-medikamentosa: rest, ice pack, istirahatkan kaki bila nyeri',
      'Medikamentosa: gabapentin 100mg 1x1 prn nyeri, mecobalamin 100mcg 3x1',
      'Bila tidak membaik dengan konservatif: rujuk Sp.S untuk injeksi kortikosteroid',
      'Penunjang: EMG, GDS, HbA1c',
    ],
  },
  'Neuralgia Trigeminal': {
    anamnesis: [
      'Nyeri wajah unilateral seperti tersengat listrik, episodik singkat (detik), dipicu stimulus ringan (menyentuh wajah, mengunyah, menggosok gigi) — trigger zone',
      'Tidak ada defisit sensorik/motorik wajah di antara episode pada bentuk klasik/idiopatik',
    ],
    pemeriksaanFisik: [
      'Sensorik wajah & refleks kornea normal pada bentuk klasik',
      'Bila ada defisit sensorik menetap atau bilateral pada usia muda, curigai penyebab sekunder (sklerosis multipel, tumor) — perlu MRI',
    ],
    kriteriaDiagnosis: 'Nyeri paroksismal unilateral wajah sesuai distribusi cabang N. trigeminus, dipicu trigger zone, tanpa defisit neurologis interiktal (kriteria IHS).',
    tatalaksana: [
      'Karbamazepin lini pertama (respons dramatis mendukung diagnosis)',
      'Bila refrakter: pertimbangkan dekompresi mikrovaskular bedah atau prosedur ablasi',
      'MRI untuk menyingkirkan penyebab sekunder terutama bila onset usia muda atau bilateral',
    ],
  },
  'Neuropati Perifer e.c. DM': {
    anamnesis: [
      'Kesemutan/mati rasa distal simetris ("stocking-glove" distribution), dimulai dari kaki',
      'Riwayat DM lama/kontrol gula buruk',
      'Nyeri neuropatik (terbakar, seperti ditusuk) terutama malam hari',
    ],
    pemeriksaanFisik: [
      'Tes monofilament 10g untuk sensasi proteksi kaki (skrining kaki diabetik)',
      'Refleks tendon Achilles sering menurun/hilang',
      'Periksa kaki untuk luka/ulkus (risiko kaki diabetik akibat hilangnya sensasi protektif)',
      'Gejala klasik gloves and stocking distribution: ekstremitas bawah lebih berat dibanding atas',
    ],
    kriteriaDiagnosis: 'Gejala/tanda neuropati sensorik distal simetris (gloves and stocking) pada pasien DM (gali gejala klasik 3P, faktor pencetus riwayat DM/HT/kolesterol, riwayat konsumsi alkohol), setelah menyingkirkan penyebab neuropati lain (defisiensi B12, neuropati alkoholik, CTS).',
    tatalaksana: [
      'Non-medikamentosa: edukasi DM menyeluruh (diet, aktivitas fisik, kepatuhan obat)',
      'Medikamentosa nyeri neuropatik: gabapentin 100mg 3x1, mecobalamin 500mcg 3x1',
      'Kontrol gula darah: metformin 500mg 3x1 (atau sesuai regimen DM yang sudah berjalan) untuk mencegah progresi',
      'Edukasi perawatan kaki diabetik: inspeksi harian, alas kaki tertutup, hindari berjalan tanpa alas kaki',
    ],
  },
  'Parkinson Disease': {
    anamnesis: [
      'Gejala motorik progresif: tremor istirahat (membaik dengan gerakan), bradikinesia (gerakan melambat, kesulitan memulai gerakan), kekakuan',
      'Gangguan gaya berjalan: langkah kecil-kecil (shuffling), postur membungkuk, berkurangnya ayunan lengan',
      'Gejala non-motorik: konstipasi, gangguan penciuman, gangguan tidur REM yang mendahului gejala motorik',
    ],
    pemeriksaanFisik: [
      'Rigiditas roda gigi (cogwheel rigidity) saat menggerakkan sendi pasif',
      'Tremor istirahat 4-6 Hz, "pill-rolling"',
      'Uji stabilitas postural (pull test)',
    ],
    kriteriaDiagnosis: 'Bradikinesia + minimal salah satu dari tremor istirahat atau rigiditas, dengan respons baik terhadap levodopa mendukung diagnosis klinis.',
    tatalaksana: [
      'Levodopa/karbidopa sebagai terapi lini pertama untuk gejala motorik pada kebanyakan kasus',
      'Agonis dopamin sebagai alternatif pada pasien lebih muda (menunda komplikasi motorik jangka panjang levodopa)',
      'Fisioterapi, edukasi keluarga tentang progresivitas penyakit',
    ],
  },
  'Meniere Disease': {
    anamnesis: [
      'Trias klasik: vertigo episodik (menit-jam, lebih lama dari BPPV), tinnitus, dan penurunan pendengaran fluktuatif (biasanya unilateral)',
      'Rasa penuh/tertekan di telinga yang terkena sebelum/selama serangan',
    ],
    pemeriksaanFisik: [
      'Audiometri menunjukkan tuli sensorineural fluktuatif, terutama frekuensi rendah pada awal penyakit',
      'Pemeriksaan neurologis lain normal',
    ],
    kriteriaDiagnosis: 'Minimal 2 episode vertigo spontan (20 menit - 12 jam) + tuli sensorineural terdokumentasi minimal 1 kali pemeriksaan + tinnitus/rasa penuh telinga fluktuatif pada telinga terkena (kriteria Barany Society).',
    tatalaksana: [
      'Serangan akut: antivertigo (betahistin, antihistamin) + antiemetik',
      'Profilaksis: diet rendah garam, diuretik (mengurangi hidrops endolimfe)',
      'Kasus refrakter: injeksi intratimpani gentamisin/kortikosteroid, atau bedah pada kasus berat',
    ],
  },
  'Myasthenia Gravis': {
    anamnesis: [
      'Kelemahan otot yang memberat dengan aktivitas/sore hari dan membaik dengan istirahat (fatigability)',
      'Sering dimulai dari otot okular: ptosis, diplopia; dapat progresif ke bulbar (disfagia, disartria) dan otot pernapasan pada kasus berat',
    ],
    pemeriksaanFisik: [
      'Ptosis memberat dengan sustained upward gaze (fatigability test)',
      'Tes es (ice pack test) pada kelopak mata — perbaikan ptosis sementara mendukung diagnosis',
      'Nilai kapasitas vital bila dicurigai keterlibatan pernapasan (krisis miastenik — kegawatdaruratan)',
    ],
    kriteriaDiagnosis: 'Kelemahan fluktuatif fatigable, dikonfirmasi antibodi anti-reseptor asetilkolin positif dan/atau uji stimulasi saraf repetitif (respons dekremental).',
    tatalaksana: [
      'Piridostigmin (inhibitor asetilkolinesterase) sebagai terapi simtomatik lini pertama',
      'Imunosupresan (kortikosteroid, azatioprin) untuk kontrol jangka panjang',
      'Krisis miastenik (gagal napas): plasmaferesis/IVIG + ventilasi mekanik bila perlu — kegawatdaruratan',
    ],
    tips: 'Waspadai krisis miastenik pada station yang menampilkan sesak progresif — kegawatdaruratan neurologis yang butuh pengenalan cepat.',
  },
  'Guillain-Barré Syndrome': {
    anamnesis: [
      'Kelemahan motorik asendens (mulai dari kaki naik ke atas), progresif dalam hari, biasanya simetris',
      'Riwayat infeksi saluran cerna/napas 1-3 minggu sebelumnya (sering Campylobacter jejuni)',
      'Gangguan sensorik ringan, gangguan otonom (aritmia, labilitas tekanan darah)',
    ],
    pemeriksaanFisik: [
      'Kelemahan motorik simetris asendens, refleks tendon MENURUN/HILANG (berbeda dari lesi UMN)',
      'Nilai kapasitas vital/fungsi pernapasan (risiko gagal napas pada kasus berat)',
    ],
    kriteriaDiagnosis: 'Kelemahan motorik progresif asendens + arefleksia, didukung analisis CSS (disosiasi sitoalbuminik: protein tinggi, sel normal) dan studi konduksi saraf.',
    tatalaksana: [
      'Plasmaferesis atau IVIG (imunoglobulin intravena) sebagai terapi utama, idealnya dimulai dini',
      'Pemantauan ketat fungsi pernapasan (kapasitas vital serial) — ventilasi mekanik bila mengancam gagal napas',
      'Rehabilitasi fisik jangka panjang pasca-fase akut',
    ],
    tips: 'Jangan lewatkan pemantauan kapasitas vital — gagal napas adalah komplikasi paling mengancam jiwa dan sering jadi fokus station ini.',
  },
  'Trauma Medulla Spinalis dengan Fraktur Kompresi': {
    anamnesis: [
      'Riwayat trauma (jatuh, kecelakaan) dengan nyeri punggung hebat, kelemahan/mati rasa di bawah level cedera',
      'Gangguan BAB/BAK (retensi urin atau inkontinensia menandakan keterlibatan medula spinalis)',
    ],
    pemeriksaanFisik: [
      'Tentukan level neurologis (motorik, sensorik) sesuai dermatom/miotom',
      'Nilai tonus sfingter ani (refleks bulbokavernosus) untuk menilai syok spinal',
      'Imobilisasi tulang belakang SEGERA sebelum pemeriksaan lengkap (log-roll technique) untuk mencegah cedera sekunder',
    ],
    kriteriaDiagnosis: 'Defisit neurologis sesuai level cedera dikonfirmasi pencitraan (rontgen/CT/MRI tulang belakang) menunjukkan fraktur kompresi dengan/tanpa kompresi medula spinalis.',
    tatalaksana: [
      'Imobilisasi spinal segera (collar servikal, log-roll, spine board) sebelum & selama transportasi',
      'Kortikosteroid dosis tinggi pada cedera medula spinalis akut masih kontroversial (tidak lagi rutin direkomendasikan di banyak pedoman terbaru)',
      'Rujuk bedah saraf/ortopedi segera untuk evaluasi stabilisasi bila indikasi',
    ],
    tips: 'Imobilisasi spinal sebelum pemeriksaan lengkap adalah prinsip keselamatan utama — jangan langsung menggerakkan pasien untuk periksa refleks tanpa proteksi tulang belakang.',
  },
  'Rabies / Tetanus': {
    anamnesis: [
      'Rabies: kontak dengan binatang (anjing, kera, kucing, kelelawar) → agitasi, kejang, sulit minum tapi bisa makan makanan padat, hidrofobia, spasme faring; stadium klinis: prodromal (demam, malaise, mual, nyeri tenggorokan) → sensoris (nyeri/panas/kesemutan sekitar luka, reaksi berlebihan pada rangsang sensoris) → eksitasi (peningkatan tonus otot & aktivitas simpatis) → paralisis (paresis otot progresif)',
      'Tetanus: riwayat terkena paku/tertusuk benda berkarat, atau (pada neonatus) persalinan tidak higienis oleh dukun tanpa ibu divaksin; gejala trismus, kejang (tonic spasm), kaku seluruh tubuh, opistotonus, hiperrefleksia, keringat berlebih, demam, sulit menelan',
    ],
    pemeriksaanFisik: [
      'Rabies: KU, TTV, GCS, head-to-toe, status lokalis luka, pemeriksaan neurologis lengkap',
      'Tetanus: trismus (ukur jarak buka mulut), risus sardonicus, spatula test (sentuh dinding posterior faring dengan spatula lidah — bila muncul refleks spasme otot maseter, tes positif mendukung tetanus), kaku kuduk/Brudzinski 1-2-3 untuk menyingkirkan meningitis, thorax-abdomen (perut papan/board-like rigidity), status lokalis luka (vulnus punctum dengan jaringan nekrotik)',
    ],
    kriteriaDiagnosis: 'Rabies: klinis khas + riwayat pajanan; konfirmasi lab bila tersedia (antibodi pada saliva/serum/CSF pada manusia, RT-PCR isolasi virus; pada hewan — Negri bodies post-mortem, tes DFA) — begitu gejala muncul, hampir selalu fatal. Tetanus: klinis (trismus + kekakuan + kejang otot + spatula test positif) pada pasien dengan riwayat luka berisiko tanpa imunisasi adekuat; DD tetanus: meningoensefalitis; DD rabies: tetanus, meningoensefalitis.',
    tatalaksana: [
      'Rabies — pencegahan: cuci luka dengan air sabun 15 menit, lalu debridement dan antiseptik; isolasi pasien untuk menghindari rangsangan pemicu spasme otot',
      'Rabies — stratifikasi risiko luka: risiko tinggi (jilatan/luka daerah mukosa, luka di atas bahu, jari tangan/kaki, genital, luka multipel) → VAR + SAR. Bila hewan kabur → langsung VAR. Bila hewan tertangkap → tunda VAR, observasi gejala hewan 10-14 hari (hewan mati → VAR; hewan tetap sehat → VAR tidak perlu)',
      'Rabies — dosis: VAR 0,5mL IM, 4x pemberian (hari ke-0 dua kali sekaligus di lengan kiri-kanan, lalu hari ke-7, hari ke-21); SAR homolog 20 IU/kgBB dibagi 2 dosis (separuh infiltrasi di sekitar luka, separuh IM) — lakukan skin test dahulu',
      'Tetanus: rawat inap, konsul Sp.N, pendekatan ABCDE — oksigen 2 lpm (target SpO2 >94%), pasang IV line, pasang NGT, isolasi di ruang sunyi dan gelap, debridement luka',
      'Tetanus — cairan: IVFD D5%:RL = 1:1 per 6 jam',
      'Tetanus — luka kotor: ATS 50.000 IU IM/IV atau HTIG 3000-6000 IU dosis tunggal IM',
      'Tetanus — antibiotik: metronidazol 3x500mg selama 10 hari (anak: 30mg/kgBB/hari terbagi 4 dosis), kontrol kejang otot dengan diazepam/benzodiazepin',
    ],
    tips: 'Spatula test (tetanus) dan hidrofobia (rabies) adalah tanda klinis kunci yang membedakan keduanya dari meningoensefalitis biasa — edukasi pencegahan luka gigitan/tusukan tetap poin penilaian utama karena begitu gejala klinis muncul, keduanya berprognosis buruk.',
  },
  'Ensefalopati Hipertensi': {
    anamnesis: [
      'Nyeri kepala hebat, penurunan kesadaran/kebingungan, gangguan penglihatan mendadak, pada pasien dengan tekanan darah sangat tinggi',
      'Riwayat hipertensi kronis tidak terkontrol atau kondisi baru (preeklamsia/eklamsia pada wanita hamil)',
    ],
    pemeriksaanFisik: [
      'Tekanan darah sangat tinggi (biasanya >180/120 mmHg)',
      'Papiledema pada funduskopi, defisit neurologis fokal dapat muncul namun biasanya reversibel dengan kontrol tekanan darah',
      'Nilai tanda gagal organ target lain (jantung, ginjal)',
    ],
    kriteriaDiagnosis: 'Gejala neurologis akut (nyeri kepala, kebingungan, gangguan penglihatan, kejang) dengan tekanan darah sangat tinggi, membaik dengan penurunan tekanan darah terkontrol — MRI dapat menunjukkan PRES (Posterior Reversible Encephalopathy Syndrome).',
    tatalaksana: [
      'Penurunan tekanan darah terkontrol & bertahap (bukan mendadak drastis) — target penurunan sekitar 25% MAP dalam 1 jam pertama menggunakan antihipertensi IV (nikardipin, labetalol)',
      'Pemantauan ketat status neurologis selama penurunan tekanan darah',
      'Cari & tangani penyebab dasar (evaluasi ginjal, preeklamsia bila wanita hamil)',
    ],
  },

  // ─── Kardiovaskular ────────────────────────────────────────────────────
  'Syok Anafilaktik — tindakan resusitasi': {
    anamnesis: [
      'Riwayat paparan alergen (obat, makanan, sengatan serangga) sesaat sebelum gejala muncul',
      'Onset cepat: sesak napas, gatal seluruh tubuh, bengkak wajah/bibir, pusing/lemas',
    ],
    pemeriksaanFisik: [
      'Airway: nilai kepatenan jalan napas (dekatkan telinga ke mulut pasien, pandang ke arah dada)',
      'Breathing: RR meningkat, wheezing, SpO2 <95%',
      'Circulation: hipotensi, takikardia, akral dingin dan basah, CRT >2 detik',
      'Disability: nilai kesadaran & refleks pupil',
      'Exposure: buka pakaian — cari urtikaria generalisata/angioedema',
    ],
    kriteriaDiagnosis: 'Reaksi hipersensitivitas sistemik akut dengan keterlibatan kulit/mukosa (urtikaria, angioedema) dan gangguan respirasi dan/atau sirkulasi (hipotensi, syok) setelah paparan alergen.',
    tatalaksana: [
      'Posisi Trendelenburg (elevasi tungkai di atas jantung) untuk meningkatkan aliran darah ke organ vital',
      'Oksigen 6-8 L/menit via masker non-rebreathing',
      'Epinefrin 1:1000 0,01 mg/kgBB (0,3-0,5 mL) IM di anterolateral paha — dapat diulang tiap 5-10 menit hingga 3-4 kali bila belum membaik',
      'Bila belum membaik setelah epinefrin: difenhidramin 1-2 ampul IV + deksametason 1-2 ampul IV',
      'Bila wheezing menetap: nebulisasi salbutamol',
      'Observasi 1-3 x 24 jam setelah stabil karena risiko reaksi bifasik',
    ],
    tips: 'Evaluasi ulang KU-tanda vital-tanda syok-wheezing setiap 5-10 menit setelah setiap intervensi — urutan tatalaksana bertingkat ini sering jadi pola penilaian station.',
  },
  'Syok Hipovolemik / Hemoragik — pasang IV line': {
    anamnesis: [
      'Riwayat trauma/perdarahan (luka, cedera) dengan estimasi jumlah darah yang hilang',
      'Keluhan lemas, pusing, berdebar',
    ],
    pemeriksaanFisik: [
      'Airway: clear',
      'Breathing: RR normal-meningkat, suara napas vesikular',
      'Circulation: TD turun, HR meningkat teraba lemah, akral dingin dan basah, CRT >2 detik',
      'Disability: kesadaran & pupil',
      'Exposure: cari sumber perdarahan/jejas',
    ],
    kriteriaDiagnosis: 'Tanda syok (hipotensi, takikardia, akral dingin, CRT memanjang) dengan sumber kehilangan volume darah/cairan yang jelas (perdarahan/trauma).',
    tatalaksana: [
      'Informed consent pemasangan infus (jelaskan tujuan, risiko nyeri/memar/infeksi lokal)',
      'Identifikasi vena: pilih vena superfisial, lurus, di bagian distal, tidak bercabang, jauh dari persendian — tangan non-dominan',
      'Pasang tourniquet proksimal, disinfeksi melingkar dari dalam ke luar, insersi abbocath sudut 30-40° dengan bevel menghadap atas',
      'Setelah darah mengalir keluar (flashback), turunkan sudut sejajar kulit, tarik stylet sambil mendorong kateter masuk, lepas tourniquet, fiksasi dengan plester',
      'Resusitasi cairan: kristaloid hangat (NaCl 0,9%/RL) 1-2 liter tetesan cepat',
      'Hitung tetesan: makro drip = (kebutuhan cairan × 20) / (durasi jam × 60); mikro drip = (kebutuhan cairan × 60) / (durasi jam × 60)',
    ],
    tips: 'Pemasangan IV line yang benar (identifikasi vena → insersi → fiksasi) sering jadi station tindakan tersendiri — hafal urutan lengkap termasuk informed consent-nya.',
  },
  'STEMI / NSTEMI / UAP — baca & interpretasi EKG': {
    anamnesis: [
      'Nyeri dada retrosternal, difus (tidak dapat ditunjuk dengan 1 jari), menyebar ke bahu/lengan kiri/leher/rahang/punggung',
      'Durasi >20 menit, muncul saat istirahat dan terus-menerus (berbeda dari angina stabil yang durasinya singkat 2-10 menit dan membaik saat istirahat)',
      'Disertai sesak napas, mual, keringat dingin, gelisah, rasa ingin pingsan',
      'Nyeri seperti ditekan/diremas/tertindih benda berat (khas iskemik — beda dari nyeri "disobek" pada diseksi aorta atau "tertusuk" pada perikarditis/pleuritis)',
    ],
    pemeriksaanFisik: [
      'Tanda vital: TD meningkat, tampak cemas',
      'Auskultasi jantung untuk menyingkirkan komplikasi (S3 gallop, bising baru)',
      'EKG segera: STEMI bila ST elevasi ≥2,5mm (laki-laki <40th) / ≥2mm (laki-laki >40th) / ≥1,5mm (perempuan) di ≥2 lead berdekatan, konfigurasi konveks/dome-shaped',
    ],
    kriteriaDiagnosis: 'STEMI: nyeri dada iskemik khas + ST elevasi memenuhi ambang pada EKG. NSTEMI: gejala serupa + troponin meningkat tanpa ST elevasi. UAP (unstable angina): gejala serupa tanpa peningkatan troponin dan tanpa ST elevasi.',
    tatalaksana: [
      'Oksigen 2-3 L/menit via nasal kanul',
      'ISDN 5mg sublingual, dapat diulang maksimal 3 kali tiap 5 menit',
      'Loading aspirin 320mg (4 tablet kunyah) + klopidogrel 300mg (4 tablet)',
      'Rujuk segera ke fasilitas dengan ICCU/kemampuan reperfusi (PCI primer atau trombolisis) — sertakan komunikasi rujukan lisan + surat rujukan tertulis mencantumkan diagnosis, terapi yang sudah diberikan, dan tanda vital terkini',
    ],
    tips: 'Naskah rujukan (telepon + surat) sering dinilai sebagai bagian komunikasi station — sertakan identitas pasien, diagnosis kerja, terapi awal, dan kondisi vital saat merujuk.',
  },
  'Atrial Fibrilasi — baca EKG': {
    anamnesis: [
      'Berdebar-debar — tanyakan onset mendadak vs bertahap, teratur vs tidak teratur: "cepat dan tidak teratur" mengarah ke AF',
      'Gejala penyerta: nyeri dada, lemas, sesak, tremor (tremor + berkeringat curiga hipertiroid sebagai pencetus)',
      'Riwayat hipertensi, DM, penyakit jantung, penyakit gondok; riwayat stroke/kelumpuhan sebelumnya (kontraindikasi manuver vagal & penanda risiko emboli)',
      'Konsumsi kopi/alkohol/rokok, obat yang dapat memicu palpitasi (simpatomimetik, teofilin, amitriptilin)',
    ],
    pemeriksaanFisik: [
      'Nadi ireguler ireguler (irregularly irregular)',
      'EKG: irama irregularly irregular, gelombang P tidak ada (diganti gelombang fibrilasi), frekuensi >100x/menit, kompleks QRS normal',
      'Nilai tanda pembesaran jantung (batas jantung melebar) dan tanda gagal jantung',
    ],
    kriteriaDiagnosis: 'EKG menunjukkan irama irregularly irregular tanpa gelombang P jelas (diganti gelombang fibrilasi), frekuensi bervariasi >100x/menit.',
    tatalaksana: [
      'Nilai dulu kriteria tidak stabil: Hipotensi <90/60, penurunan Kesadaran, tanda Syok (akral dingin, CRT>2), Nyeri dada, Gagal jantung — bila ADA salah satu: kardioversi tersinkronisasi segera (AF: 120-200J; AFlutter/SVT: 50-100J)',
      'Bila stabil dengan QRS sempit reguler: kontrol laju dengan beta-blocker (bisoprolol) dan/atau antihipertensi bila ada hipertensi penyerta',
      'Evaluasi kebutuhan antikoagulasi jangka panjang berdasarkan skor risiko stroke (CHA2DS2-VASc)',
      'Edukasi: kurangi kopi/alkohol, batasi garam-gula-minyak, aktivitas fisik teratur, segera ke dokter bila muncul kelemahan anggota gerak mendadak',
    ],
    tips: 'Selalu skrining etiologi sebelum menegakkan AF idiopatik — singkirkan hipertiroid (tremor, penurunan BB, berkeringat) dan penyebab sekunder lain lewat anamnesis dan TSH/FT4.',
  },
  'Supraventricular Tachycardia (SVT) — vagal maneuver': {
    anamnesis: [
      'Berdebar muncul bertahap (semakin lama semakin cepat), cepat dan teratur — berbeda dari AF (tidak teratur) dan sinus takikardia (muncul mendadak)',
      'Riwayat pingsan akibat berdebar, riwayat stroke/TIA 3 bulan terakhir dan riwayat infark (kontraindikasi manuver vagal)',
    ],
    pemeriksaanFisik: [
      'EKG: irama regular, frekuensi 150-250x/menit, gelombang P tidak tampak (tertutup gelombang T), kompleks QRS normal (sempit, <0,12 detik)',
    ],
    kriteriaDiagnosis: 'Takikardia regular dengan frekuensi 150-250x/menit, QRS sempit normal, gelombang P tidak terlihat pada EKG.',
    tatalaksana: [
      'Nilai dulu kriteria tidak stabil (hipotensi, penurunan kesadaran, syok, nyeri dada, gagal jantung) — bila tidak stabil: kardioversi tersinkronisasi 50-100J segera',
      'Bila stabil: manuver vagal terlebih dulu — tekan salah satu arteri karotis secara sirkular selama 5-10 detik (periksa dulu bruit karotis dan riwayat stroke 3 bulan terakhir sebagai kontraindikasi)',
      'Bila manuver vagal gagal: adenosin 6mg IV bolus cepat, langsung diikuti flush NaCl 0,9% 20cc (dapat diulang dengan dosis lebih tinggi bila belum berhasil sesuai protokol fasilitas)',
      'Edukasi hindari pemicu: kafein, alkohol, nikotin',
    ],
    tips: 'Hafal kontraindikasi manuver vagal dan urutan "vagal dulu → adenosin bila gagal → kardioversi bila tidak stabil" — algoritma bertingkat ini sering jadi pola penilaian station takiaritmia.',
  },
  'Ventricular Ectopic (VES) — baca EKG': {
    anamnesis: [
      'Berdebar tidak teratur, dapat asimtomatik dan ditemukan insidental',
      'Faktor risiko/etiologi: usia tua, dehidrasi, hipokalemia, hipertensi',
    ],
    pemeriksaanFisik: [
      'EKG: irama irregular saat muncul VES, gelombang P hilang saat VES muncul, kompleks QRS melebar (>0,12 detik) dan berbentuk aneh ("wide and bizarre") saat VES, gelombang T normal saat irama dasar',
      'Kenali pola: bigemini (normal-VES-normal-VES berulang), trigemini (normal-normal-VES berulang), couplet (2 VES berturutan), triplet (3 VES berturutan), salvo/run (≥5 VES berturutan — dianggap kriteria "life-threatening" bila menetap)',
    ],
    kriteriaDiagnosis: 'Kompleks QRS prematur, melebar, dan bizarre tanpa didahului gelombang P pada rekaman EKG, tersisip di antara irama dasar yang normal.',
    tatalaksana: [
      'Cek kadar kalium — bila rendah, koreksi terlebih dulu: kalium 3,5-5,5 mEq/L (normal, tidak perlu koreksi agresif); bila rendah, KCl IV 5-10 mEq dilarutkan diberikan selama 15-20 menit, dapat diulang, atau KCl oral 20-40 mEq bila tidak ada kriteria life-threatening — monitor kalium ulang tiap 2-4 jam',
      'Bila pola VES life-threatening (salvo/run, atau simtomatik menetap setelah koreksi elektrolit): rujuk Sp.JP, pertimbangkan pemasangan Holter monitor 1-2 hari',
      'Terapi etiologi/kontrol jangka panjang: bisoprolol 1x5mg PO, atau diltiazem 3x30mg PO sebagai alternatif',
      'Edukasi kurangi kafein/alkohol, kelola stres, kontrol faktor risiko (dehidrasi, hipertensi)',
    ],
    tips: 'Koreksi kalium adalah langkah pertama sebelum menambah obat antiaritmia — banyak VES membaik begitu elektrolit dikoreksi.',
  },
  'Angina Pektoris Stabil': {
    anamnesis: [
      'Nyeri dada retrosternal, difus, menyebar ke bahu/lengan kiri/leher/rahang/punggung',
      'Durasi singkat 2-10 menit, frekuensi jarang, intensitas ringan',
      'Memberat saat aktivitas berat/stres emosional, membaik saat istirahat atau nitrat sublingual — tidak progresif memberat dan tidak mengganggu aktivitas sehari-hari',
      'Nyeri seperti ditekan/diremas/tertindih benda berat',
      'Identifikasi faktor risiko: hipertensi, DM, kolesterol tinggi, merokok, riwayat keluarga',
    ],
    pemeriksaanFisik: [
      'Umumnya normal saat tidak nyeri; TD dapat meningkat, HR normal',
      'EKG interiktal dapat normal atau menunjukkan tanda iskemik ringan (mis. T inversi); foto toraks umumnya normal',
    ],
    kriteriaDiagnosis: 'Nyeri dada khas angina (retrosternal, dipicu aktivitas/stres, membaik istirahat/nitrat, durasi singkat <20 menit) tanpa peningkatan enzim jantung, EKG interiktal umumnya normal atau perubahan ringan nonspesifik.',
    tatalaksana: [
      'Aspirin 1x80mg sebagai antiplatelet jangka panjang',
      'Bisoprolol 1x5-10mg (beta-blocker) untuk mengurangi kebutuhan oksigen miokard',
      'ISDN 3x5-20mg sublingual untuk serangan/pencegahan',
      'Edukasi: penjelasan patofisiologi penyempitan pembuluh darah oleh timbunan lemak, modifikasi faktor risiko (berhenti merokok bertahap, olahraga teratur 5x/minggu 30 menit, diet rendah garam/gula/lemak, tidur cukup, kelola stres)',
    ],
  },
  'CHF / ADHF / Cor Pulmonale': {
    anamnesis: [
      'Sesak napas saat aktivitas (dyspnea on exertion), memberat saat berbaring (ortopnea — tanyakan jumlah bantal yang dipakai untuk tidur), sesak mendadak malam hari (paroxysmal nocturnal dyspnea)',
      'Edema tungkai, perut membuncit (asites), cepat lelah',
      'Riwayat penyakit jantung sebelumnya (infark, hipertensi, katup), riwayat penyakit paru kronis (untuk cor pulmonale)',
    ],
    pemeriksaanFisik: [
      'Peningkatan JVP, ronki basah halus di basal paru, S3 gallop, edema tungkai pitting bilateral',
      'Pada ADHF (dekompensasi akut): tanda kongesti akut berat, kadang disertai gagal napas',
    ],
    kriteriaDiagnosis: 'Gejala & tanda kongesti (sesak, ortopnea, PND, edema, ronki, JVP meningkat) didukung ekokardiografi (fraksi ejeksi) dan/atau kadar BNP/NT-proBNP meningkat.',
    tatalaksana: [
      'ADHF akut: oksigen, diuretik IV (furosemide) untuk mengurangi kongesti, posisi duduk/semi-fowler',
      'Kronik (HFrEF): kombinasi ACE-inhibitor/ARNI + beta-blocker + antagonis mineralokortikoid + SGLT2 inhibitor ("terapi kuartet")',
      'Edukasi: pembatasan cairan & garam, timbang berat badan harian, kenali tanda perburukan dini',
    ],
  },
  'Cardiac Arrest — RJP/BLS/ACLS': {
    anamnesis: [
      'Ini station keterampilan resusitasi (BLS), bukan anamnesis — nilai kesadaran korban dengan AVPU sambil menepuk bahu dan memanggil, beri rangsang nyeri (sternum/supraorbita) bila tidak berespons',
    ],
    pemeriksaanFisik: [
      'Safety first: pastikan lingkungan aman untuk korban & penolong',
      'Call for help: minta tolong orang sekitar + minta seseorang menelepon ambulans (atau aktifkan code blue bila di rumah sakit)',
      'Posisikan korban telentang di alas keras, kedua tangan di samping; penolong berlutut sejajar',
      'Circulation: raba nadi karotis (dari Adam’s apple geser 1-2 cm ke lateral) maksimal 10 detik',
      'Bila nadi tidak teraba: mulai kompresi dada 30:2 — lokasi setengah bawah sternum, kedua tangan saling mengunci, lengan tegak lurus, kecepatan 100-120x/menit, kedalaman 5-6cm, beri kesempatan recoil sempurna, interupsi <10 detik, ganti posisi tiap 2 menit',
      'Airway: look-listen-feel, buka jalan napas dengan head tilt-chin lift (bila tidak curiga trauma servikal) atau jaw thrust (bila curiga trauma servikal), bersihkan sumbatan dengan cross-finger + jari dilapisi kain',
      'Breathing: bila napas tidak ada, berikan bantuan napas dengan bag-valve-mask (teknik C-E grip) — jangan mouth-to-mouth langsung',
      'Evaluasi ulang tiap 2 menit: nadi belum teraba → lanjut RJP; nadi teraba napas belum ada → napas buatan 1x/5-6 detik; nadi & napas ada → posisi mantap (recovery position)',
    ],
    kriteriaDiagnosis: 'Henti jantung ditegakkan dari tidak adanya respons + tidak teraba nadi karotis dalam 10 detik pemeriksaan — penilaian klinis cepat untuk memulai resusitasi tanpa delay, bukan diagnosis laboratorium.',
    tatalaksana: [
      'Ikuti sekuens BLS di atas secara berurutan tanpa jeda berarti',
      'Lanjutkan RJP hingga bantuan lanjutan (ambulans/tim code blue) tiba, tanda kehidupan kembali, atau penolong kelelahan total',
      'Di rumah sakit, lanjutkan ke algoritma ACLS (monitor irama, defibrilasi bila shockable rhythm, obat resusitasi) begitu tim & alat tersedia',
    ],
    tips: 'Station ini murni keterampilan — verbalisasi tiap langkah (safety, call for help, cek nadi, dst.) sama pentingnya dengan tindakan fisiknya karena penguji menilai kelengkapan sekuens.',
  },
  'Bradiaritmia / AV Block': {
    anamnesis: [
      'Lemas, letih, mudah lelah saat aktivitas, pingsan, sesak napas',
      'Riwayat penyakit jantung, serangan jantung sebelumnya, hipotiroid, konsumsi obat (beta-blocker), riwayat penyalahgunaan zat, riwayat anemia',
      'Aktivitas/pekerjaan sebagai atlet (bradikardia fisiologis atlet perlu dibedakan dari patologis)',
    ],
    pemeriksaanFisik: [
      'Tanda vital: HR <60x/menit, nilai tekanan darah',
      'Kriteria tidak stabil: hipotensi <90/60, penurunan kesadaran, tanda syok (akral dingin, CRT>2 detik), nyeri dada, gagal jantung',
      'JVP meningkat, edema — tanda gagal jantung penyerta',
      'EKG: AV block derajat 1 (PR interval memanjang konstan >0,2 detik tanpa drop beat); derajat 2 Mobitz I/Wenckebach (PR memanjang progresif lalu satu QRS hilang); derajat 2 Mobitz II (PR konstan, QRS tiba-tiba hilang tanpa pemanjangan progresif); derajat 3/total (gelombang P dan QRS berjalan sendiri-sendiri, tidak berhubungan/AV disosiasi)',
    ],
    kriteriaDiagnosis: 'HR <60x/menit dengan gambaran EKG sesuai derajat AV block; stratifikasi stabil vs tidak stabil menentukan tatalaksana.',
    tatalaksana: [
      'Stabil: monitor dan observasi, rawat inap, rujuk Sp.JP untuk evaluasi pacemaker sebagai terapi definitif',
      'Tidak stabil: sulfas atropin 1mg bolus IV, dapat diulang tiap 3-5 menit hingga maksimal 3mg — efektif terutama untuk AV block derajat 1 dan derajat 2 Mobitz I',
      'Bila atropin tidak efektif (terutama AV block derajat 2 Mobitz II dan derajat 3): dopamine 5-20 mcg/kgBB/menit atau epinefrin 2-10 mcg/kgBB/menit, atau transcutaneous pacemaker',
      'AV block derajat 2 Mobitz II dan derajat 3 memerlukan pacemaker definitif, bukan hanya terapi obat',
    ],
    tips: 'AV block Mobitz I umumnya jinak (respons baik dengan atropin), sedangkan Mobitz II dan derajat 3 berisiko progresi mendadak ke asistol — keduanya butuh pacemaker, bukan sekadar obat.',
  },

  // ─── Respirasi ─────────────────────────────────────────────────────────
  'Pneumotoraks (Tension/Terbuka) — needle decompression': {
    anamnesis: [
      'Sesak napas mendadak, sering dengan riwayat trauma dada (tumpul/tembus)',
      'Riwayat penyakit paru sebelumnya (TB, PPOK, pneumonia) sebagai faktor risiko pneumotoraks spontan',
    ],
    pemeriksaanFisik: [
      'Cek JVP (meningkat pada tension pneumothorax) dan tanda syok (hipotensi, takikardia, sianosis)',
      'Inspeksi: pengembangan dada asimetris, sisi yang sakit tertinggal',
      'Palpasi: fremitus taktil menurun pada sisi pneumotoraks',
      'Perkusi: hipersonor pada sisi pneumotoraks',
      'Auskultasi: suara napas menghilang/menjauh pada sisi pneumotoraks',
    ],
    kriteriaDiagnosis: 'Klinis (sesak + tanda fisik asimetris di atas) pada konteks trauma dada atau faktor risiko paru sebelumnya; foto toraks menyingkirkan diagnosis banding (asma, eksaserbasi PPOK, gagal jantung, pneumonia) — pada tension pneumothorax, tatalaksana tidak boleh menunggu konfirmasi radiologis.',
    tatalaksana: [
      'ABCDE, suplementasi oksigen, rujuk/konsul Sp.BTKV',
      'Tension pneumothorax: needle decompression/torakosentesis jarum 14-16G di ICS V linea midaksilaris (insersi di atas iga), selanjutnya rujuk untuk torakostomi + pemasangan WSD di ICS 4-5 antara linea midaksilaris dan aksilaris anterior',
      'Open pneumothorax: tutup luka dengan plester 3 sisi (occlusive dressing 3 sisi); bila berkembang menjadi tension pneumothorax, lakukan needle torakosentesis segera',
    ],
    tips: 'Pada tension pneumothorax, needle decompression adalah tindakan life-saving yang TIDAK BOLEH menunggu hasil rontgen — diagnosis dan tatalaksana murni klinis.',
  },
  'Hematotoraks & Flail Chest': {
    anamnesis: [
      'Riwayat trauma tumpul (dengan krepitasi, gerakan napas paradoksal) atau trauma tembus yang merobek pembuluh darah toraks',
    ],
    pemeriksaanFisik: [
      'Cek JVP dan tanda syok (hipotensi, takikardia, sianosis)',
      'Inspeksi: pengembangan dada asimetris (sisi sakit tertinggal); pada flail chest — gerakan napas paradoksal (segmen patah masuk ke dalam saat inspirasi, keluar saat ekspirasi, berlawanan dari dinding dada normal)',
      'Palpasi: fremitus taktil meningkat pada sisi hematotoraks, krepitasi bila ada flail chest',
      'Perkusi: redup pada sisi hematotoraks',
      'Auskultasi: suara napas menurun/menghilang pada sisi hematotoraks',
    ],
    kriteriaDiagnosis: 'Klinis + foto toraks menunjukkan area opak pada paru yang terkena (hematotoraks); flail chest ditegakkan dari fraktur iga tersegmen ≥3 yang menyebabkan gerakan dinding dada paradoksal.',
    tatalaksana: [
      'ABCDE, rujuk untuk pemasangan torakostomi + WSD di ICS 4-5 antara linea midaksilaris dan aksilaris anterior',
      'Analgesia: ketorolak 3x30mg IV',
      'Flail chest: fiksasi dengan balutan tetap (fixed bandage) selain analgesia',
      'Rujuk Sp.BTKV untuk torakotomi bila: drainase awal torakostomi >1000mL (trauma tembus) atau >1500mL (trauma tumpul), ATAU drainase >200cc/jam selama 3 jam berturut-turut',
    ],
  },
}
