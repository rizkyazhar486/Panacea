// ─────────────────────────────────────────────────────────────────────────────
// Pilihan kartu di Beranda.
//
// Fitur sudah banyak, dan tidak semua orang memakai bagian yang sama. Alih-alih
// menebak mana yang penting bagi setiap orang, biarkan pengguna memilih sendiri
// apa yang muncul di Beranda.
//
// Bawaannya sengaja sedikit — tiga kartu — karena beranda yang penuh sejak awal
// justru membuat orang berhenti membacanya. Sisanya tinggal dinyalakan.
//
// PENTING SAAT MENAMBAH HALAMAN BARU: daftar ini ditulis manual dan TIDAK
// diturunkan dari navigasi, karena tiap kartu punya label dan ringkasan yang
// digubah khusus untuk beranda. Akibatnya halaman baru tidak muncul di sini
// sampai didaftarkan — itu yang sempat terjadi pada CrossFit, Peregangan dan
// Harada. Kalau Anda menambah halaman yang layak jadi pintasan beranda,
// tambahkan barisnya di sini juga.
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetDef {
  id: string
  label: string
  ringkas: string
  ke: string
  emoji: string
  /** Kelompok pada pemilih widget. Menentukan urutan dan judul bagiannya. */
  kategori: string
  /** Nyala secara bawaan bagi pengguna baru. */
  bawaan?: boolean
}

export const WIDGETS: WidgetDef[] = [
  { id: 'medStudy', label: 'Med Study Hub', ringkas: 'Bank soal, teknik OSCE, dan rencana ujian', ke: '/med-study', emoji: '📚', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'tatalaksana', label: 'Tatalaksana SKDI', ringkas: 'Cari obat dan dosis per penyakit', ke: '/med-study?bagian=therapy', emoji: '💊', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'penyakit', label: 'Daftar Penyakit SKDI', ringkas: 'Catatan lengkap per penyakit', ke: '/med-study?bagian=diseases', emoji: '📖', kategori: 'Klinis & Belajar' },
  { id: 'osce', label: 'Stasiun OSCE UKMPPD', ringkas: 'Rekap 1.416 stasiun, 32 periode', ke: '/osce-ukmppd', emoji: '🩺', kategori: 'Klinis & Belajar' },
  { id: 'caseBank', label: 'OSCE Case Bank', ringkas: 'Kasus beserta frekuensinya', ke: '/med-study?bagian=case-bank', emoji: '📋', kategori: 'Klinis & Belajar' },
  { id: 'simulator', label: 'Station Simulator', ringkas: 'Latihan stasiun dengan pewaktu', ke: '/med-study?bagian=station-sim', emoji: '🎭', kategori: 'Klinis & Belajar' },
  { id: 'mnemonik', label: 'Jembatan Keledai', ringkas: 'Singkatan yang menempel', ke: '/med-study?bagian=mnemonik', emoji: '🔤', kategori: 'Klinis & Belajar' },
  { id: 'evidence', label: 'Clinical Evidence', ringkas: 'Tanya klinis, jawaban bertingkat bukti', ke: '/evidence', emoji: '🔬', kategori: 'Klinis & Belajar' },
  { id: 'emr', label: 'AI-EMR', ringkas: 'Rekam medis SOAP dengan bantuan AI', ke: '/emr', emoji: '📝', kategori: 'Klinis & Belajar' },
  { id: 'drugInfo', label: 'Informasi Obat', ringkas: 'Telusuri obat dan interaksinya', ke: '/drug-info', emoji: '💉', kategori: 'Klinis & Belajar' },
  { id: 'empirik', label: 'Terapi Empirik', ringkas: 'Antibiotik empiris per sumber infeksi', ke: '/empiric-therapy-reference', emoji: '🦠', kategori: 'Klinis & Belajar' },
  { id: 'lesi', label: 'Peta Lesi Kulit', ringkas: 'Kenali morfologi lesi', ke: '/dermatology-lesion-mapper', emoji: '🔎', kategori: 'Klinis & Belajar' },
  { id: 'psikiatri', label: 'Status Mental', ringkas: 'Pemeriksaan status psikiatri', ke: '/psychiatric-status-exam', emoji: '🧠', kategori: 'Klinis & Belajar' },
  { id: 'neonatus', label: 'Resusitasi Neonatus', ringkas: 'Alur langkah demi langkah', ke: '/neonatal-resuscitation-guide', emoji: '👶', kategori: 'Klinis & Belajar' },
  { id: 'trials', label: 'Uji Klinis', ringkas: 'Studi yang sedang merekrut', ke: '/trials', emoji: '🧪', kategori: 'Klinis & Belajar' },
  { id: 'geneInfo', label: 'Informasi Gen', ringkas: 'Telusuri gen dan kaitan penyakit', ke: '/gene-info', emoji: '🧬', kategori: 'Klinis & Belajar' },
  { id: 'edukasiPasien', label: 'Edukasi Pasien', ringkas: 'Bahan penjelasan untuk pasien', ke: '/education', emoji: '🗣️', kategori: 'Klinis & Belajar' },
  { id: 'kalkulator', label: 'Kalkulator Klinis', ringkas: 'Seluruh skor dalam satu tempat', ke: '/clinical-calculators', emoji: '🧮', kategori: 'Kalkulator & Skor' },
  { id: 'kalkulatorHub', label: 'Pusat Kalkulator', ringkas: 'Kalkulator kesehatan umum', ke: '/calculator-hub', emoji: '🔢', kategori: 'Kalkulator & Skor' },
  { id: 'sofa', label: 'Skor SOFA', ringkas: 'Disfungsi organ pada sepsis', ke: '/sofa-score', emoji: '⚕️', kategori: 'Kalkulator & Skor' },
  { id: 'wells', label: 'Skor Wells', ringkas: 'Kemungkinan DVT dan emboli paru', ke: '/wells-score', emoji: '🫁', kategori: 'Kalkulator & Skor' },
  { id: 'news2', label: 'NEWS2', ringkas: 'Peringatan dini perburukan', ke: '/news2-score', emoji: '🚨', kategori: 'Kalkulator & Skor' },
  { id: 'childPugh', label: 'Child-Pugh', ringkas: 'Beratnya sirosis hati', ke: '/child-pugh-score', emoji: '🫀', kategori: 'Kalkulator & Skor' },
  { id: 'meld', label: 'Skor MELD', ringkas: 'Prioritas transplantasi hati', ke: '/meld-score', emoji: '🩸', kategori: 'Kalkulator & Skor' },
  { id: 'grace', label: 'Skor GRACE', ringkas: 'Risiko pada sindrom koroner akut', ke: '/grace-score', emoji: '❤️‍🩹', kategori: 'Kalkulator & Skor' },
  { id: 'timi', label: 'TIMI', ringkas: 'Risiko pada nyeri dada', ke: '/timi-risk-score', emoji: '📉', kategori: 'Kalkulator & Skor' },
  { id: 'hasbled', label: 'HAS-BLED', ringkas: 'Risiko perdarahan antikoagulan', ke: '/has-bled-score', emoji: '🩹', kategori: 'Kalkulator & Skor' },
  { id: 'qtc', label: 'QTc', ringkas: 'Interval QT terkoreksi', ke: '/qtc-calculator', emoji: '📈', kategori: 'Kalkulator & Skor' },
  { id: 'kreatinin', label: 'Klirens Kreatinin', ringkas: 'Sesuaikan dosis menurut ginjal', ke: '/creatinine-clearance', emoji: '🫘', kategori: 'Kalkulator & Skor' },
  { id: 'cairan', label: 'Kalkulator Cairan', ringkas: 'Kebutuhan dan defisit cairan', ke: '/fluid-calculators', emoji: '💧', kategori: 'Kalkulator & Skor' },
  { id: 'ottawa', label: 'Aturan Ottawa', ringkas: 'Perlu foto atau tidak', ke: '/ottawa-ankle', emoji: '🦴', kategori: 'Kalkulator & Skor' },
  { id: 'ldl', label: 'LDL & Lipid', ringkas: 'Hitung LDL dan risiko', ke: '/ldl-calculator', emoji: '🧈', kategori: 'Kalkulator & Skor' },
  { id: 'braden', label: 'Skala Braden', ringkas: 'Risiko luka tekan', ke: '/braden-scale', emoji: '🛏️', kategori: 'Kalkulator & Skor' },
  { id: 'risiko', label: 'Kalkulator Risiko', ringkas: 'Risiko kardiovaskular dan lainnya', ke: '/risk', emoji: '⚖️', kategori: 'Kalkulator & Skor' },
  { id: 'pelatih', label: 'Pelatih Latihan', ringkas: 'Sesi berikutnya dan status kesegaran', ke: '/riwayat-latihan', emoji: '🏃', kategori: 'Latihan', bawaan: true },
  { id: 'targetLatihan', label: 'Target Latihan', ringkas: 'Kemajuan target pekan atau bulan', ke: '/analisis-pro', emoji: '🎯', kategori: 'Latihan' },
  { id: 'kebugaran', label: 'Latihan Hari Ini', ringkas: 'Bugar, lelah, segar, dan keputusan hari ini', ke: '/analisis-pro', emoji: '📊', kategori: 'Latihan', bawaan: true },
  { id: 'usahaTerbaik', label: 'Usaha Terbaik', ringkas: 'Rekor waktu per jarak', ke: '/analisis-pro', emoji: '🏅', kategori: 'Latihan' },
  { id: 'grafikOlahraga', label: 'Grafik Olahraga', ringkas: 'Jarak, langkah, pace, denyut, zona, kadens', ke: '/riwayat-latihan', emoji: '📈', kategori: 'Latihan' },
  { id: 'latihanTerpandu', label: 'Latihan Terpandu', ringkas: 'Sesi berpandu dengan video gerakan', ke: '/workout', emoji: '🏋️', kategori: 'Latihan' },
  { id: 'pusatLatihan', label: 'Pusat Latihan', ringkas: 'Semua alat latihan Anda', ke: '/latihan', emoji: '🏟️', kategori: 'Latihan' },
  { id: 'crossfit', label: 'CrossFit & AMRAP', ringkas: 'Benchmark dengan jam dan ketuk ronde', ke: '/crossfit', emoji: '🔥', kategori: 'Latihan' },
  { id: 'teknikLari', label: 'Teknik Lari', ringkas: 'Irama langkah, jangkauan, napas', ke: '/teknik-lari', emoji: '👟', kategori: 'Latihan' },
  { id: 'multisport', label: 'Lari, Sepeda, Renang', ringkas: 'Latihan tiga cabang', ke: '/lari-sepeda-renang', emoji: '🚴', kategori: 'Latihan' },
  { id: 'alatFitness', label: 'Alat Fitness', ringkas: 'Panduan tiap alat di gym', ke: '/alat-fitness', emoji: '🏋️‍♀️', kategori: 'Latihan' },
  { id: 'peregangan', label: 'Peregangan & Postur', ringkas: 'Rutinitas sebelum dan sesudah', ke: '/peregangan', emoji: '🧘', kategori: 'Latihan' },
  { id: 'rencanaLatihan', label: 'Rencana Latihan', ringkas: 'Program berminggu ke depan', ke: '/training-plan', emoji: '🗓️', kategori: 'Latihan' },
  { id: 'ujiKebugaran', label: 'Uji Kebugaran', ringkas: 'Ukur kapasitas Anda', ke: '/fitness-test', emoji: '⏱️', kategori: 'Latihan' },
  { id: 'gerak', label: 'Analisis Gerak', ringkas: 'Telaah pola gerakan', ke: '/analisis-gerak', emoji: '🎥', kategori: 'Latihan' },
  { id: 'sportsLab', label: 'Sports Lab', ringkas: 'Fisiologi latihan mendalam', ke: '/sports-lab', emoji: '🔬', kategori: 'Latihan' },
  { id: 'latihanBeban', label: 'Latihan Beban', ringkas: 'Set, ulangan, volume, dan rekor per gerakan', ke: '/latihan-beban', emoji: '🏋️', kategori: 'Latihan' },
  // Grafik tujuh hari di beranda. Terdaftar sebagai widget tersendiri supaya
  // dapat dimatikan: sebelumnya kelimanya tampil apa pun pilihan pemakainya,
  // sehingga "Atur widget" terasa tidak berfungsi — orang mematikan Pola Tidur
  // dan grafik tidurnya tetap ada di layar.
  { id: 'grafikLatihan', label: 'Grafik Latihan 7 Hari', ringkas: 'Menit latihan per hari', ke: '/latihan', emoji: '📊', kategori: 'Latihan', bawaan: true },
  { id: 'grafikTidur', label: 'Grafik Tidur 7 Hari', ringkas: 'Jam tidur per malam', ke: '/pola-tidur', emoji: '🌙', kategori: 'Tidur & Pemulihan', bawaan: true },
  { id: 'grafikLangkah', label: 'Grafik Langkah 7 Hari', ringkas: 'Langkah per hari', ke: '/tubuh', emoji: '👣', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'grafikGizi', label: 'Grafik Gizi 7 Hari', ringkas: 'Kalori tercatat per hari', ke: '/nutrition', emoji: '🍽️', kategori: 'Gizi', bawaan: true },
  { id: 'grafikDenyut', label: 'Grafik Denyut 14 Hari', ringkas: 'Denyut istirahat dari waktu ke waktu', ke: '/tubuh', emoji: '❤️', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'pantauan', label: 'Pantauan', ringkas: 'Penyakit, obat, dan skor pilihan Anda sendiri', ke: '/cari', emoji: '★', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'harian', label: 'Harian', ringkas: 'Telusuri hari mana pun: terukur dan yang dirasakan', ke: '/harian', emoji: '📅', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'ikhtisar', label: 'Ikhtisar', ringkas: 'Semua angka tubuh dan grafiknya pada satu layar', ke: '/ikhtisar', emoji: '📈', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'tubuh', label: 'Pusat Tubuh', ringkas: 'Angka tubuh dan rentang rujukannya', ke: '/tubuh', emoji: '🫁', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'bodyBattery', label: 'Body Battery', ringkas: 'Cadangan energi hari ini', ke: '/body-battery', emoji: '🔋', kategori: 'Tubuh & Data' },
  { id: 'detakJantung', label: 'Detak Jantung', ringkas: 'Sampel terbaru dari jam tangan', ke: '/log-detak-jantung', emoji: '❤️', kategori: 'Tubuh & Data' },
  { id: 'healthData', label: 'Data Kesehatan', ringkas: 'Metrik yang terisi dari perangkat', ke: '/health-data', emoji: '📲', kategori: 'Tubuh & Data' },
  { id: 'komposisi', label: 'Komposisi Tubuh', ringkas: 'Lemak, otot, dan air tubuh', ke: '/body', emoji: '⚖️', kategori: 'Tubuh & Data' },
  { id: 'usiaBiologis', label: 'Usia Biologis', ringkas: 'Perkiraan usia tubuh Anda', ke: '/biological-age', emoji: '🕰️', kategori: 'Tubuh & Data' },
  { id: 'organ', label: 'Vitalitas Organ', ringkas: 'Keadaan tiap sistem organ', ke: '/organ-vitality', emoji: '🫀', kategori: 'Tubuh & Data' },
  { id: 'labDecoder', label: 'Baca Hasil Lab', ringkas: 'Terjemahkan angka laboratorium', ke: '/lab-decoder', emoji: '🧾', kategori: 'Tubuh & Data' },
  { id: 'rppg', label: 'Detak dari Kamera', ringkas: 'Ukur nadi lewat wajah', ke: '/rppg-heart-rate', emoji: '📷', kategori: 'Tubuh & Data' },
  { id: 'vokal', label: 'Biomarker Suara', ringkas: 'Petunjuk kesehatan dari suara', ke: '/vocal-biomarkers', emoji: '🎙️', kategori: 'Tubuh & Data' },
  { id: 'inspirasi', label: 'Inspirasi', ringkas: 'Kisah dan kutipan, berganti tiap hari', ke: '/resilience-stories', emoji: '✨', kategori: 'Ibadah & Hidup', bawaan: true },
  { id: 'kartuBelajar', label: 'Kartu Belajar', ringkas: 'Diagnosis → tatalaksana, ditutup dulu', ke: '/med-study?bagian=therapy', emoji: '🗂️', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'soalHarian', label: 'Soal Hari Ini', ringkas: 'Satu soal dengan pembahasan', ke: '/med-study', emoji: '❓', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'skorTim', label: 'Skor Tim Anda', ringkas: 'Pertandingan tim favorit', ke: '/sports-scores', emoji: '⚽', kategori: 'Ibadah & Hidup', bawaan: true },
  { id: 'tidurLebar', label: 'Tidur 14 Malam', ringkas: 'Malam ini terhadap kebiasaan', ke: '/pola-tidur', emoji: '🌙', kategori: 'Tidur & Pemulihan', bawaan: true },
  { id: 'giziLebar', label: 'Asupan Hari Ini', ringkas: 'Kalori dan susunan makro', ke: '/nutrition', emoji: '🥗', kategori: 'Gizi', bawaan: true },
  { id: 'motivasi', label: 'Pekan Ini', ringkas: 'Rangkaian hari dan menit latihan', ke: '/harian', emoji: '🔥', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'obatCepat', label: 'Obat & Dosis', ringkas: 'Cari dosis langsung di beranda', ke: '/med-study?bagian=therapy', emoji: '💊', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'kalkulatorCepat', label: 'Hitung Cepat', ringkas: 'IMT, MAP, LPB, dosis per kg', ke: '/clinical-calculators', emoji: '🧮', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'stasiunSering', label: 'Stasiun Tersering', ringkas: 'Kasus OSCE per sistem', ke: '/osce-ukmppd', emoji: '🩺', kategori: 'Klinis & Belajar', bawaan: true },
  { id: 'konsistensi', label: 'Konsistensi', ringkas: 'Hari tercatat 12 pekan', ke: '/harian', emoji: '🟩', kategori: 'Tubuh & Data', bawaan: true },
  { id: 'longevity', label: 'Longevity', ringkas: 'Umur panjang berbasis bukti', ke: '/longevity', emoji: '🌱', kategori: 'Tubuh & Data' },
  { id: 'nutrisi', label: 'Gizi', ringkas: 'Asupan hari ini', ke: '/nutrition', emoji: '🥗', kategori: 'Gizi', bawaan: true },
  { id: 'macroLab', label: 'Macro Lab', ringkas: 'Susun makro sesuai sasaran', ke: '/macro-lab', emoji: '🍽️', kategori: 'Gizi' },
  { id: 'hidrasi', label: 'Hidrasi', ringkas: 'Kebutuhan cairan harian', ke: '/hydration', emoji: '🚰', kategori: 'Gizi' },
  { id: 'kafein', label: 'Kafein', ringkas: 'Batas aman dan waktu paruhnya', ke: '/caffeine', emoji: '☕', kategori: 'Gizi' },
  { id: 'alkohol', label: 'Alkohol', ringkas: 'Hitung unit dan risikonya', ke: '/alcohol', emoji: '🍷', kategori: 'Gizi' },
  { id: 'puasa', label: 'Pewaktu Puasa', ringkas: 'Jendela makan dan puasa', ke: '/fasting', emoji: '⏳', kategori: 'Gizi' },
  { id: 'suplemen', label: 'Suplemen', ringkas: 'Yang terbukti dan yang tidak', ke: '/supplements', emoji: '💊', kategori: 'Gizi' },
  { id: 'carbonDiet', label: 'Jejak Karbon Makanan', ringkas: 'Dampak lingkungan pola makan', ke: '/carbon-diet', emoji: '🌍', kategori: 'Gizi' },
  { id: 'tidur', label: 'Pola Tidur', ringkas: 'Durasi dan tahapan tidur semalam', ke: '/pola-tidur', emoji: '😴', kategori: 'Tidur & Pemulihan' },
  { id: 'utangTidur', label: 'Utang Tidur', ringkas: 'Kekurangan yang menumpuk', ke: '/sleep-debt', emoji: '🌙', kategori: 'Tidur & Pemulihan' },
  { id: 'kronotipe', label: 'Kronotipe', ringkas: 'Jam biologis Anda', ke: '/chronotype', emoji: '🦉', kategori: 'Tidur & Pemulihan' },
  { id: 'apneaTidur', label: 'Skrining Apnea Tidur', ringkas: 'Mendengkur dan henti napas', ke: '/sleep-apnea-screen', emoji: '💤', kategori: 'Tidur & Pemulihan' },
  { id: 'epworth', label: 'Skala Epworth', ringkas: 'Kantuk berlebihan siang hari', ke: '/epworth-sleepiness', emoji: '😪', kategori: 'Tidur & Pemulihan' },
  { id: 'kesiapan', label: 'Kesiapan Hari Ini', ringkas: 'Siap berlatih atau perlu pulih', ke: '/readiness', emoji: '🔆', kategori: 'Tidur & Pemulihan' },
  { id: 'pemulihan', label: 'Pemulihan', ringkas: 'Alat bantu pulih setelah latihan', ke: '/recovery', emoji: '🛌', kategori: 'Tidur & Pemulihan' },
  { id: 'termal', label: 'Terapi Termal', ringkas: 'Sauna dan mandi dingin', ke: '/thermal-therapy', emoji: '🔥', kategori: 'Tidur & Pemulihan' },
  { id: 'napas', label: 'Latihan Napas', ringkas: 'Pola napas untuk tenang dan fokus', ke: '/breathwork', emoji: '🌬️', kategori: 'Tidur & Pemulihan' },
  { id: 'jedaPostur', label: 'Jeda Postur', ringkas: 'Pengingat bangkit dari duduk', ke: '/posture-breaks', emoji: '🪑', kategori: 'Tidur & Pemulihan' },
  { id: 'mentalHealth', label: 'Skrining Kesehatan Jiwa', ringkas: 'PHQ-9 dan GAD-7', ke: '/mental-health-screen', emoji: '🧩', kategori: 'Jiwa & Kebiasaan' },
  { id: 'syukur', label: 'Jurnal Syukur', ringkas: 'Tiga hal tiap hari', ke: '/gratitude', emoji: '🙏', kategori: 'Jiwa & Kebiasaan' },
  { id: 'perubahan', label: 'Ubah Kebiasaan', ringkas: 'Satu kebiasaan pada satu waktu', ke: '/change', emoji: '🔁', kategori: 'Jiwa & Kebiasaan' },
  { id: 'ikigai', label: 'Ikigai', ringkas: 'Temukan alasan bangun pagi', ke: '/ikigai', emoji: '🎋', kategori: 'Jiwa & Kebiasaan' },
  { id: 'harada', label: 'Kisi Harada 9×9', ringkas: 'Satu sasaran, 64 tindakan', ke: '/harada', emoji: '🧱', kategori: 'Jiwa & Kebiasaan' },
  { id: 'kompasHidup', label: 'Kompas Hidup', ringkas: 'Arah dan nilai yang Anda pegang', ke: '/life-compass', emoji: '🧭', kategori: 'Jiwa & Kebiasaan' },
  { id: 'zat', label: 'Skrining Penggunaan Zat', ringkas: 'Rokok, alkohol, dan lainnya', ke: '/substance-use-screen', emoji: '🚭', kategori: 'Jiwa & Kebiasaan' },
  { id: 'nyeri', label: 'Buku Harian Nyeri', ringkas: 'Catat pola nyeri Anda', ke: '/pain-diary', emoji: '📔', kategori: 'Jiwa & Kebiasaan' },
  { id: 'vaksin', label: 'Catatan Vaksin', ringkas: 'Jadwal dan yang sudah diberikan', ke: '/vaccine-tracker', emoji: '💉', kategori: 'Pencegahan & Skrining' },
  { id: 'alergi', label: 'Catatan Alergi', ringkas: 'Riwayat alergi Anda', ke: '/allergy-tracker', emoji: '⚠️', kategori: 'Pencegahan & Skrining' },
  { id: 'obatPengingat', label: 'Pengingat Obat', ringkas: 'Jadwal minum berikutnya', ke: '/med-reminders', emoji: '⏰', kategori: 'Pencegahan & Skrining' },
  { id: 'keluarga', label: 'Kesehatan Keluarga', ringkas: 'Riwayat penyakit keluarga', ke: '/family-health', emoji: '👨‍👩‍👧', kategori: 'Pencegahan & Skrining' },
  { id: 'tumbuhAnak', label: 'Tumbuh Kembang Anak', ringkas: 'Kurva berat dan tinggi', ke: '/child-growth', emoji: '🧒', kategori: 'Pencegahan & Skrining' },
  { id: 'findrisc', label: 'FINDRISC', ringkas: 'Risiko diabetes 10 tahun', ke: '/findrisc', emoji: '🍬', kategori: 'Pencegahan & Skrining' },
  { id: 'stroke', label: 'Risiko Stroke', ringkas: 'Perkirakan dan turunkan', ke: '/stroke-risk', emoji: '🧠', kategori: 'Pencegahan & Skrining' },
  { id: 'donorDarah', label: 'Donor Darah', ringkas: 'Kapan boleh menyumbang lagi', ke: '/blood-donation', emoji: '🩸', kategori: 'Pencegahan & Skrining' },
  { id: 'donorOrgan', label: 'Kartu Donor Organ', ringkas: 'Nyatakan kesediaan Anda', ke: '/organ-donor', emoji: '💗', kategori: 'Pencegahan & Skrining' },
  { id: 'matahari', label: 'Paparan Matahari', ringkas: 'Vitamin D dan batas amannya', ke: '/sun-exposure', emoji: '☀️', kategori: 'Pencegahan & Skrining' },
  { id: 'udara', label: 'Kualitas Udara', ringkas: 'Keadaan udara di sekitar Anda', ke: '/air-quality', emoji: '🌫️', kategori: 'Pencegahan & Skrining' },
  { id: 'seksual', label: 'Kesehatan Seksual', ringkas: 'Informasi dan skrining', ke: '/sexual-health', emoji: '🫶', kategori: 'Pencegahan & Skrining' },
  { id: 'darurat', label: 'Kartu Darurat', ringkas: 'Informasi Anda saat gawat', ke: '/emergency', emoji: '🆘', kategori: 'Layanan & Darurat', bawaan: true },
  { id: 'p3k', label: 'Pertolongan Pertama', ringkas: 'Langkah pada keadaan darurat', ke: '/first-aid', emoji: '🚑', kategori: 'Layanan & Darurat' },
  { id: 'rumahSakit', label: 'Rumah Sakit', ringkas: 'Fasilitas terdekat', ke: '/hospitals', emoji: '🏥', kategori: 'Layanan & Darurat' },
  { id: 'apotek', label: 'Apotek', ringkas: 'Cari dan pesan obat', ke: '/pharmacy', emoji: '🏪', kategori: 'Layanan & Darurat' },
  { id: 'konsultasi', label: 'Konsultasi', ringkas: 'Bicara dengan tenaga kesehatan', ke: '/consult', emoji: '💬', kategori: 'Layanan & Darurat' },
  { id: 'opiniKedua', label: 'Opini Kedua', ringkas: 'Tinjauan dari dokter lain', ke: '/second-opinion', emoji: '🔁', kategori: 'Layanan & Darurat' },
  { id: 'siapKunjungan', label: 'Siap ke Dokter', ringkas: 'Daftar tanya sebelum berobat', ke: '/visit-prep', emoji: '📋', kategori: 'Layanan & Darurat' },
  { id: 'pesanan', label: 'Pesanan', ringkas: 'Riwayat pesanan Anda', ke: '/orders', emoji: '📦', kategori: 'Layanan & Darurat' },
  { id: 'keuangan', label: 'Keuangan', ringkas: 'Dompet dan transaksi', ke: '/keuangan', emoji: '💰', kategori: 'Layanan & Darurat' },
  { id: 'salat', label: 'Jadwal Salat', ringkas: 'Waktu salat hari ini', ke: '/prayer-times', emoji: '🕌', kategori: 'Ibadah & Hidup' },
  { id: 'kitab', label: 'Kitab', ringkas: 'Bacaan harian', ke: '/scripture', emoji: '📜', kategori: 'Ibadah & Hidup' },
  { id: 'hadis', label: 'Hadis', ringkas: 'Kumpulan hadis', ke: '/hadith', emoji: '🕋', kategori: 'Ibadah & Hidup' },
  { id: 'komunitas', label: 'Komunitas', ringkas: 'Kabar dan diskusi', ke: '/community', emoji: '👥', kategori: 'Ibadah & Hidup' },
  { id: 'klub', label: 'Klub', ringkas: 'Kelompok latihan bersama', ke: '/clubs', emoji: '🏆', kategori: 'Ibadah & Hidup' },
  { id: 'skorOlahraga', label: 'Skor Olahraga', ringkas: 'Pertandingan tim Anda', ke: '/sports-scores', emoji: '⚽', kategori: 'Ibadah & Hidup' },
  { id: 'kisah', label: 'Kisah Ketangguhan', ringkas: 'Cerita orang yang bertahan', ke: '/resilience-stories', emoji: '📻', kategori: 'Ibadah & Hidup' },
  { id: 'jelajah', label: 'Jelajah', ringkas: 'Tempat dan rute di sekitar', ke: '/jelajah', emoji: '🗺️', kategori: 'Ibadah & Hidup' },

  // ───────────────────────────────────────────────────────────────────────────
  // GELOMBANG SUSULAN: halaman yang sudah ada tetapi hanya terjangkau lewat
  // beberapa lapis menu. Selama tidak terdaftar di sini, satu-satunya jalan ke
  // sana adalah menebak namanya di /semua-fitur — dan fitur yang harus ditebak
  // sama saja dengan fitur yang tidak ada. Semua tetap MATI secara bawaan;
  // yang berubah hanyalah dapat-tidaknya dinyalakan dari Beranda.
  //
  // Halaman pengurus (admin, owner, verifikator, editor), halaman akun
  // (billing, settings, legal, pricing) dan halaman sistem sengaja TIDAK
  // dimasukkan: tempatnya di menu samping, bukan di pintasan beranda.
  // ───────────────────────────────────────────────────────────────────────────
  { id: 'semuaFitur', label: 'Semua Fitur', ringkas: 'Daftar seluruh halaman beserta kegunaannya', ke: '/semua-fitur', emoji: '🧭', kategori: 'Klinis & Belajar' },
  { id: 'cariGlobal', label: 'Pencarian', ringkas: 'Cari apa pun di dalam aplikasi dari satu kotak', ke: '/search', emoji: '🔎', kategori: 'Klinis & Belajar' },
  { id: 'clinicalHub', label: 'Alat Klinis Lain', ringkas: 'Pintu ke seluruh alat klinis dan bantuan AI', ke: '/clinical-hub', emoji: '🩺', kategori: 'Klinis & Belajar' },
  { id: 'chatbot', label: 'Tanya Kesehatan', ringkas: 'Jawaban bahasa sederhana beserta sumbernya', ke: '/chatbot', emoji: '💬', kategori: 'Klinis & Belajar' },
  { id: 'panduanPakai', label: 'Panduan Pemakaian', ringkas: 'Enam langkah untuk yang baru pertama kali', ke: '/tutorial', emoji: '🗺️', kategori: 'Klinis & Belajar' },
  { id: 'catatanLog', label: 'Log & Statistik', ringkas: 'Catatan harian dan angka yang terkumpul', ke: '/logs', emoji: '🗒️', kategori: 'Tubuh & Data' },
  { id: 'profilSaya', label: 'Profil Saya', ringkas: 'Tinggi, berat, dan riwayat kesehatan Anda', ke: '/profile', emoji: '🙋', kategori: 'Tubuh & Data' },

  // Skor klinis yang selama ini hanya ada di dalam Kalkulator Hub.
  { id: 'perc', label: 'PERC Rule', ringkas: 'Singkirkan emboli paru pada risiko rendah', ke: '/perc-rule', emoji: '🫁', kategori: 'Kalkulator & Skor' },
  { id: 'padua', label: 'Skor Padua', ringkas: 'Perlu tidaknya profilaksis VTE pasien penyakit dalam', ke: '/padua-score', emoji: '🩸', kategori: 'Kalkulator & Skor' },
  { id: 'caprini', label: 'Skor Caprini', ringkas: 'Perlu tidaknya profilaksis VTE pasien bedah', ke: '/caprini-score', emoji: '🩹', kategori: 'Kalkulator & Skor' },
  { id: 'duke', label: 'Kriteria Duke', ringkas: 'Penegakan diagnosis endokarditis infektif', ke: '/duke-criteria', emoji: '❤️‍🩹', kategori: 'Kalkulator & Skor' },
  { id: 'lights', label: "Kriteria Light", ringkas: 'Eksudat atau transudat pada efusi pleura', ke: '/lights-criteria', emoji: '💧', kategori: 'Kalkulator & Skor' },
  { id: 'ranson', label: 'Kriteria Ranson', ringkas: 'Beratnya pankreatitis saat masuk dan 48 jam', ke: '/ranson-criteria', emoji: '🧪', kategori: 'Kalkulator & Skor' },
  { id: 'bisap', label: 'Skor BISAP', ringkas: 'Beratnya pankreatitis dalam 24 jam pertama', ke: '/bisap-score', emoji: '⏱️', kategori: 'Kalkulator & Skor' },
  { id: 'blatchford', label: 'Glasgow-Blatchford', ringkas: 'Siapa perlu dirawat pada perdarahan SCBA', ke: '/glasgow-blatchford-score', emoji: '🩸', kategori: 'Kalkulator & Skor' },
  { id: 'rockall', label: 'Skor Rockall', ringkas: 'Risiko perdarahan ulang sesudah endoskopi', ke: '/rockall-score', emoji: '🔬', kategori: 'Kalkulator & Skor' },
  { id: 'maddrey', label: 'Maddrey DF', ringkas: 'Perlu tidaknya steroid pada hepatitis alkoholik', ke: '/maddrey-score', emoji: '🫀', kategori: 'Kalkulator & Skor' },
  { id: 'charlson', label: 'Indeks Charlson', ringkas: 'Beban komorbiditas dan harapan hidup 10 tahun', ke: '/charlson-index', emoji: '📊', kategori: 'Kalkulator & Skor' },
  { id: 'fourTs', label: 'Skor 4Ts', ringkas: 'Kemungkinan trombositopenia akibat heparin', ke: '/4ts-score', emoji: '🧫', kategori: 'Kalkulator & Skor' },
  { id: 'aaGradient', label: 'Gradien A-a', ringkas: 'Letak sebab hipoksemia: paru atau hipoventilasi', ke: '/aa-gradient', emoji: '🌬️', kategori: 'Kalkulator & Skor' },
  { id: 'fena', label: 'FeNa', ringkas: 'AKI prarenal atau nekrosis tubular akut', ke: '/fena-calculator', emoji: '🚰', kategori: 'Kalkulator & Skor' },
  { id: 'kalsiumKoreksi', label: 'Kalsium Terkoreksi', ringkas: 'Sesuaikan kalsium bila albumin rendah', ke: '/corrected-calcium', emoji: '🦴', kategori: 'Kalkulator & Skor' },
  { id: 'osmolalitas', label: 'Osmolalitas Serum', ringkas: 'Selisih osmolal untuk menapis keracunan alkohol', ke: '/serum-osmolality', emoji: '⚗️', kategori: 'Kalkulator & Skor' },
  { id: 'kadAnak', label: 'KAD Anak', ringkas: 'Bolus, defisit, rumatan, kalium, dan insulin', ke: '/pediatric-dka-calculator', emoji: '🧒', kategori: 'Kalkulator & Skor' },

  // Latihan dan sains olahraga.
  { id: 'fitnessHub', label: 'Fitness Hub', ringkas: 'Pintu ke seluruh alat kebugaran dan latihan', ke: '/fitness-hub', emoji: '🏃', kategori: 'Latihan' },
  { id: 'athlete', label: 'Papan Atlet', ringkas: 'Zona denyut, beban, dan lari ber-GPS', ke: '/athlete', emoji: '🏅', kategori: 'Latihan' },
  { id: 'fisiologiLatihan', label: 'Fisiologi Latihan', ringkas: 'Beban, status, waktu pulih, dan kesiapan', ke: '/fisiologi-latihan', emoji: '📈', kategori: 'Latihan' },
  { id: 'sportsScience', label: 'Sports Science', ringkas: 'Bukti ilmiah di balik angka-angka Anda', ke: '/sports-science', emoji: '🔬', kategori: 'Latihan' },
  { id: 'labLatihan', label: 'Lab Latihan', ringkas: 'Beban latihan, VO2max, dan ukuran penampilan', ke: '/lab', emoji: '🧬', kategori: 'Latihan' },
  { id: 'latihanDasar', label: 'Latihan Dasar', ringkas: 'Zona pace, push-up, pull-up, sit-up, postur', ke: '/latihan-dasar', emoji: '💪', kategori: 'Latihan' },
  { id: 'alatEndurance', label: 'Alat Endurance', ringkas: 'Bahan bakar, laju keringat, FTP, penyesuaian panas', ke: '/alat-endurance', emoji: '🚴', kategori: 'Latihan' },
  { id: 'assessmentAwal', label: 'Asesmen Awal', ringkas: 'Titik mulai: kebugaran dan pola gerak', ke: '/assessment', emoji: '📋', kategori: 'Latihan' },
  { id: 'shapeForming', label: 'Shape Forming', ringkas: 'Program tersusun membentuk komposisi tubuh', ke: '/shape-forming', emoji: '🧗', kategori: 'Latihan' },
  { id: 'movementToolkit', label: 'Movement Toolkit', ringkas: 'Genggaman, keseimbangan, zona 2, latihan singkat', ke: '/movement-toolkit', emoji: '🤸', kategori: 'Latihan' },

  // Longevity dan data tubuh.
  { id: 'longevitySains', label: 'Ilmu Penuaan', ringkas: 'Hallmark of aging, NAD+, sirtuin, rapamisin', ke: '/longevity-science', emoji: '🧪', kategori: 'Tubuh & Data' },
  { id: 'longevityKurikulum', label: 'Kurikulum Longevity', ringkas: 'Materi ajar tersusun kedokteran umur panjang', ke: '/longevity-curriculum', emoji: '🎓', kategori: 'Tubuh & Data' },
  { id: 'simulatorSehat', label: 'What-If Simulator', ringkas: 'Pilihan hari ini vs risiko sepuluh tahun ke depan', ke: '/health-simulator', emoji: '🔮', kategori: 'Tubuh & Data' },
  { id: 'dataLab', label: 'Data Lab', ringkas: 'Unggah data kesehatan Anda, ubah jadi grafik', ke: '/data-lab', emoji: '📂', kategori: 'Tubuh & Data' },
  { id: 'dataLabLanjut', label: 'Data Lab Lanjutan', ringkas: 'Tren darah, PhenoAge, brankas terenkripsi', ke: '/data-lab-advanced', emoji: '🔐', kategori: 'Tubuh & Data' },
  { id: 'snp', label: 'SNP Profiler', ringkas: 'Data DNA mentah diolah di peramban Anda sendiri', ke: '/snp-profiler', emoji: '🧬', kategori: 'Tubuh & Data' },
  { id: 'bioSimulator', label: 'Bio Simulator', ringkas: 'mTOR/AMPK, ritme harian, dan telomer', ke: '/bio-simulators', emoji: '⚙️', kategori: 'Tubuh & Data' },
  { id: 'modelPrediktif', label: 'Model Prediktif', ringkas: 'Waktu autofagi, kurva kortisol, beban glikemik', ke: '/predictive-models-toolkit', emoji: '📐', kategori: 'Tubuh & Data' },
  { id: 'vitapulse', label: 'VitaPulse', ringkas: 'Pantau denyut, tekanan darah, dan tanda tubuh', ke: '/vitapulse', emoji: '💓', kategori: 'Tubuh & Data' },
  { id: 'pelacakKlinis', label: 'Pelacak Klinis', ringkas: 'SpO2, EKG, jet lag, kehamilan, kursi roda', ke: '/pelacak-klinis', emoji: '📟', kategori: 'Tubuh & Data' },
  { id: 'penilaianDiri', label: 'Penilaian Diri', ringkas: 'Kuis telomer, skor radang, pinggang/tinggi', ke: '/self-assessment-toolkit', emoji: '📝', kategori: 'Tubuh & Data' },

  // Pencegahan, gizi, tidur, jiwa.
  { id: 'toksin', label: 'Daftar Periksa Toksin', ringkas: 'Kurangi paparan plastik, pembersih, udara kotor', ke: '/toxin-checklist', emoji: '☣️', kategori: 'Pencegahan & Skrining' },
  { id: 'realityCheck', label: 'Reality Check', ringkas: 'Penapisan CAGE dan hitungan bungkus-tahun', ke: '/reality-check', emoji: '🪞', kategori: 'Pencegahan & Skrining' },
  { id: 'aesthetic', label: 'Perawatan Kulit', ringkas: 'Panduan merawat kulit dan wajah', ke: '/aesthetic', emoji: '🧴', kategori: 'Pencegahan & Skrining' },
  { id: 'bodyToolkit', label: 'Body Toolkit', ringkas: 'Rutinitas kulit, peta gejala, catatan gerak', ke: '/body-toolkit', emoji: '🧰', kategori: 'Pencegahan & Skrining' },
  { id: 'gizisToolkit', label: 'Nutrition Toolkit', ringkas: 'Mediterania, catatan gula, keragaman tanaman', ke: '/nutrition-toolkit', emoji: '🥗', kategori: 'Gizi' },
  { id: 'sleepToolkit', label: 'Sleep Toolkit', ringkas: 'Alarm siklus, tidur siang, jurnal mimpi, suara', ke: '/sleep-toolkit', emoji: '🌙', kategori: 'Tidur & Pemulihan' },
  { id: 'mindToolkit', label: 'Mind Toolkit', ringkas: 'Latihan otak, ingatan, waktu reaksi, stres', ke: '/mind-toolkit', emoji: '🧠', kategori: 'Jiwa & Kebiasaan' },
  { id: 'sehatSibuk', label: 'Sehat Saat Sibuk', ringkas: 'Kebiasaan sehat yang muat di jadwal padat', ke: '/sehat-sibuk', emoji: '⏳', kategori: 'Jiwa & Kebiasaan' },
  { id: 'gameLongevity', label: 'Game Center', ringkas: 'Bingo kebiasaan, rapor, dan kutipan harian', ke: '/longevity-game-center', emoji: '🎲', kategori: 'Jiwa & Kebiasaan' },

  // Sosial dan layanan.
  { id: 'kabarTeman', label: 'Kabar Teman', ringkas: 'Kegiatan dari teman-teman Anda', ke: '/feed', emoji: '📰', kategori: 'Layanan & Darurat' },
  { id: 'pesanPribadi', label: 'Pesan', ringkas: 'Percakapan pribadi dengan pemakai lain', ke: '/messages', emoji: '✉️', kategori: 'Layanan & Darurat' },
  { id: 'pasarMateri', label: 'Marketplace', ringkas: 'Jual beli materi dan catatan antar pemakai', ke: '/marketplace', emoji: '🛍️', kategori: 'Layanan & Darurat' },
  { id: 'materiSaya', label: 'Materi Saya', ringkas: 'Materi yang Anda tulis maupun simpan', ke: '/my-materials', emoji: '📚', kategori: 'Layanan & Darurat' },
]

/**
 * WIDGET YANG BENAR-BENAR HIDUP.
 *
 * Hanya id di sini yang boleh muncul di papan beranda dan di pemilih widget.
 * Alasannya sederhana dan diminta langsung oleh pemakainya: sebuah widget yang
 * hanya berisi lambang dan nama fitur bukan widget — ia pintu. Pintu sudah ada
 * tempatnya sendiri (kisi fitur dan pencarian), dan menaruhnya di papan widget
 * membuat papan itu penuh oleh benda yang tidak menjawab apa pun.
 *
 * Sisa katalog WIDGETS tetap ada dan tetap dipakai — oleh kisi fitur, oleh
 * halaman Semua Fitur, dan oleh mesin pencari. Yang berubah hanyalah siapa
 * yang berhak menempati beranda.
 */
export const WIDGET_HIDUP = [
  'pantauan',       // daftar pilihan sendiri: penyakit, obat, skor, stasiun
  'kebugaran',      // bugar/lelah/segar + keputusan hari ini
  'grafikLatihan',
  'grafikTidur',
  'grafikLangkah',
  'grafikGizi',
  'grafikDenyut',
  'tubuh',          // langkah hari ini + cincin kebiasaan
  'pelatih',        // latihan 7 hari
  'tidur',          // tidur semalam + 14 malam
  'detakJantung',   // denyut istirahat + garis
  'longevity',      // kapasitas aerobik + selisih MET
  'salat',          // salat berikutnya + hitungan mundur
  'konsistensi',    // peta 12 pekan: hari mana saja yang tercatat
  'motivasi',       // rangkaian hari + pekan ini vs pekan lalu
  'obatCepat',      // cari dosis SKDI di dalam ubinnya
  'kalkulatorCepat',// IMT/MAP/LPB/dosis per kg, dihitung di tempat
  'stasiunSering',  // kasus OSCE tersering per sistem, dari arsip
  'skorTim',        // pertandingan tim favorit, dari server skor
  'tidurLebar',     // 14 malam + kebiasaan sendiri
  'giziLebar',      // kalori hari ini + susunan makro
  'inspirasi',      // 97 kartu: kisah ketahanan, kutipan atlet, semangat koas
  'kartuBelajar',   // kartu tatalaksana yang jawabannya ditutup
  'soalHarian',     // satu soal dari bank soal, dengan pembahasan
] as const

/** Katalog yang boleh menempati beranda. */
export function widgetPapan(): WidgetDef[] {
  return WIDGETS.filter((w) => (WIDGET_HIDUP as readonly string[]).includes(w.id))
}

const KUNCI = 'pmd-home-widgets'

export function widgetBawaan(): string[] {
  return widgetPapan().filter((w) => w.bawaan).map((w) => w.id)
}

export function ambilWidget(): string[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return widgetBawaan()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return widgetBawaan()
    // Saring id yang sudah tidak ada lagi, agar kartu yang dihapus dari aplikasi
    // tidak meninggalkan slot kosong di beranda seseorang.
    return arr.filter((id) => typeof id === 'string' && (WIDGET_HIDUP as readonly string[]).includes(id))
  } catch {
    return widgetBawaan()
  }
}

export function simpanWidget(ids: string[]): void {
  try { localStorage.setItem(KUNCI, JSON.stringify(ids)) } catch { /* kuota penuh */ }
  try { window.dispatchEvent(new Event('panacea:home-widgets')) } catch { /* ignore */ }
}

export function alihkanWidget(id: string): string[] {
  const kini = ambilWidget()
  const next = kini.includes(id) ? kini.filter((x) => x !== id) : [...kini, id]
  simpanWidget(next)
  return next
}
