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
      'Tinel sign: perkusi di atas terowongan karpal memicu parestesia ke distribusi N. medianus',
      'Phalen test: fleksi pergelangan tangan maksimal 60 detik memicu gejala',
      'Atrofi thenar pada kasus lanjut',
    ],
    kriteriaDiagnosis: 'Gejala klinis khas + Tinel/Phalen positif, dikonfirmasi studi konduksi saraf bila tersedia.',
    tatalaksana: [
      'Konservatif: splint pergelangan tangan posisi netral terutama malam hari, modifikasi aktivitas, NSAID',
      'Injeksi kortikosteroid lokal pada kasus sedang',
      'Operasi release terowongan karpal bila gagal konservatif atau ada atrofi/defisit motorik',
    ],
  },
  'Tarsal Tunnel Syndrome': {
    anamnesis: [
      'Nyeri/kesemutan telapak kaki (distribusi N. tibialis posterior), memberat berdiri/berjalan lama',
      'Faktor risiko: deformitas kaki, trauma pergelangan kaki, edema',
    ],
    pemeriksaanFisik: [
      'Tinel sign di area maleolus medial (belakang bawah)',
      'Sensasi telapak kaki, kekuatan otot intrinsik kaki',
    ],
    kriteriaDiagnosis: 'Gejala klinis + Tinel positif di terowongan tarsal, dikonfirmasi studi konduksi saraf bila tersedia.',
    tatalaksana: [
      'Konservatif: ortotik/sepatu suportif, NSAID, modifikasi aktivitas',
      'Injeksi kortikosteroid lokal',
      'Operasi release bila gagal konservatif',
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
    ],
    kriteriaDiagnosis: 'Gejala/tanda neuropati sensorik distal simetris pada pasien DM, setelah menyingkirkan penyebab neuropati lain (defisiensi B12, hipotiroid, dll).',
    tatalaksana: [
      'Optimalisasi kontrol gula darah (mencegah progresi)',
      'Nyeri neuropatik: gabapentin/pregabalin atau duloksetin',
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
      'Rabies: riwayat gigitan/cakaran hewan (anjing, kucing, kelelawar) tidak divaksinasi, gejala prodromal (nyeri/parestesia di lokasi gigitan), lalu hidrofobia, aerofobia, hipersalivasi, agitasi',
      'Tetanus: riwayat luka tusuk/kotor tanpa profilaksis tetanus adekuat, trismus (rahang terkunci), kekakuan otot progresif, kejang otot dipicu rangsang ringan (risus sardonicus)',
    ],
    pemeriksaanFisik: [
      'Rabies: pemeriksaan neurologis menunjukkan ensefalitis progresif, hidrofobia khas saat mencoba minum',
      'Tetanus: trismus, kekakuan otot leher-punggung (opistotonus pada kasus berat), kesadaran tetap baik (berbeda dari ensefalitis)',
    ],
    kriteriaDiagnosis: 'Rabies: klinis khas + riwayat pajanan, begitu gejala muncul hampir selalu fatal. Tetanus: klinis (trismus + kekakuan + kejang otot) pada pasien dengan riwayat luka berisiko tanpa imunisasi adekuat.',
    tatalaksana: [
      'Rabies: pencegahan adalah kunci — cuci luka segera dengan sabun/air mengalir 15 menit, vaksinasi rabies pasca-pajanan + imunoglobulin rabies (kategori luka III), tidak ada terapi kuratif setelah gejala muncul',
      'Tetanus: Human Tetanus Immunoglobulin (HTIG) + toksoid tetanus + antibiotik (metronidazol) + kontrol kejang otot (diazepam/benzodiazepin) + perawatan suportif ICU pada kasus berat, plus perawatan luka adekuat',
    ],
    tips: 'Edukasi pencegahan (protokol luka gigitan/tusukan, jadwal vaksinasi) sering jadi poin penilaian utama karena begitu gejala klinis muncul, keduanya punya prognosis buruk.',
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
      'Kontrol laju: beta-blocker (bisoprolol) dan/atau antihipertensi bila ada hipertensi penyerta',
      'Evaluasi kebutuhan antikoagulasi jangka panjang berdasarkan skor risiko stroke (CHA2DS2-VASc)',
      'Edukasi: kurangi kopi/alkohol, batasi garam-gula-minyak, aktivitas fisik teratur, segera ke dokter bila muncul kelemahan anggota gerak mendadak',
    ],
  },
  'Supraventricular Tachycardia (SVT) — vagal maneuver': {
    anamnesis: [
      'Berdebar muncul bertahap (semakin lama semakin cepat), cepat dan teratur — berbeda dari AF (tidak teratur) dan sinus takikardia (muncul mendadak)',
      'Riwayat pingsan akibat berdebar, riwayat stroke/TIA 3 bulan terakhir dan riwayat infark (kontraindikasi manuver vagal)',
    ],
    pemeriksaanFisik: [
      'EKG: irama regular, frekuensi 150-250x/menit, gelombang P tidak tampak (tertutup gelombang T), kompleks QRS normal',
    ],
    kriteriaDiagnosis: 'Takikardia regular dengan frekuensi 150-250x/menit, QRS sempit normal, gelombang P tidak terlihat pada EKG.',
    tatalaksana: [
      'Manuver vagal: tekan salah satu arteri karotis secara sirkular selama 5-10 menit (pastikan tidak ada kontraindikasi: riwayat infark, stroke/TIA <3 bulan, riwayat VT/VF, bruit karotis)',
      'Bila manuver vagal gagal: rujuk untuk terapi farmakologis (adenosin IV) atau kardioversi sesuai fasilitas',
      'Edukasi hindari pemicu: kafein, alkohol, nikotin',
    ],
    tips: 'Hafal kontraindikasi manuver vagal — sering ditanyakan sebelum peserta diminta melakukan tindakan ini.',
  },
  'Ventricular Ectopic (VES) — baca EKG': {
    anamnesis: [
      'Berdebar dengan sensasi "jantung berhenti sejenak" atau denyut ekstra, dapat asimtomatik dan ditemukan insidental',
    ],
    pemeriksaanFisik: [
      'EKG: irama irregular saat muncul VES, gelombang P hilang saat VES muncul, kompleks QRS melebar (>0,12 detik) dan berbentuk aneh ("wide and bizarre") saat VES, gelombang T normal saat irama dasar',
    ],
    kriteriaDiagnosis: 'Kompleks QRS prematur, melebar, dan bizarre tanpa didahului gelombang P pada rekaman EKG, tersisip di antara irama dasar yang normal.',
    tatalaksana: [
      'Bila asimtomatik & jarang: observasi, identifikasi & atasi faktor pencetus (elektrolit, kafein, stres, hipertiroid)',
      'Bila simtomatik/sering (bigemini, trigemini, VES multifokal) atau ada penyakit jantung struktural: beta-blocker, evaluasi kardiologi lebih lanjut',
      'Edukasi kurangi kafein/alkohol, kelola stres',
    ],
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
}
