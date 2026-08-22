// ─────────────────────────────────────────────────────────────────────────────
// Penjelasan fungsi tiap fitur, dalam bahasa sehari-hari.
//
// Halaman "Semua Fitur" berbentuk tabel: satu baris satu fitur, dengan kolom
// kedua berisi APA GUNANYA. Tanpa kolom itu, tabel hanya menjadi daftar nama
// yang tidak lebih berguna daripada deretan keping sebelumnya — nama seperti
// "VitaPulse" dan "Braden Scale" tidak memberi tahu siapa pun apa isinya.
//
// ATURAN PENULISAN — dipegang tanpa kecuali:
//
//   * SATU KALIMAT, dan sependek mungkin. Kolom ini dibaca sambil menggulir,
//     bukan dipelajari.
//   * MULAI DENGAN KATA KERJA yang menjawab "saya bisa apa di sini", bukan
//     "halaman ini adalah…". Yang dicari orang adalah kegiatannya.
//   * TANPA ISTILAH TEKNIS bila ada padanan sehari-hari. "Tekanan darah",
//     bukan "tensi arterial". Sasarannya harus terbaca oleh orang yang bukan
//     tenaga kesehatan.
//   * TIDAK MENJANJIKAN LEBIH DARI ISINYA. Kalimat yang melebih-lebihkan
//     membuat orang membuka halaman lalu merasa tertipu, dan itu lebih buruk
//     daripada nama yang membosankan.
//
// Kunci peta ini adalah alamat halamannya, bukan namanya — nama berubah saat
// disunting, alamat tidak.
// ─────────────────────────────────────────────────────────────────────────────

export const PENJELASAN_FITUR: Record<string, string> = {
  // ── Beranda & harian ──
  '/': 'Ringkasan hari ini: angka tubuh, tugas, dan jalan pintas ke yang sering dipakai',
  '/tutorial': 'Panduan enam langkah untuk yang baru pertama kali memakai aplikasi ini',
  '/profile': 'Data diri, tinggi, berat, dan riwayat kesehatan Anda sendiri',
  '/settings': 'Atur tampilan, bahasa, pemberitahuan, dan hal teknis lainnya',
  '/search': 'Cari apa pun di dalam aplikasi dari satu kotak',

  // ── Tubuh & kesehatan harian ──
  '/latihan-beban': 'Catat set, ulangan, dan beban; lihat volume mingguan serta rekor per gerakan',
  '/cari': 'Satu kotak untuk mencari fitur, penyakit, obat, stasiun OSCE, dan kalkulator sekaligus',
  '/harian': 'Telusuri hari mana pun: angka yang terukur perangkat dan yang Anda rasakan sendiri',
  '/ikhtisar': 'Seluruh angka tubuh beserta grafik dan rata-ratanya, dengan jangka yang dipilih sendiri',
  '/tubuh': 'Energi, jantung, tidur, dan gerak dalam satu halaman',
  '/latihan': 'Pelatih, analisis, fisiologi, dan daya tahan latihan Anda',
  '/recovery': 'Seberapa pulih tubuh Anda hari ini, dan boleh tidaknya latihan keras',
  '/logs': 'Catatan harian dan angka-angka yang terkumpul dari waktu ke waktu',
  '/vitapulse': 'Pantau denyut, tekanan darah, dan tanda tubuh lain secara berkala',
  '/med-reminders': 'Pengingat minum obat supaya tidak ada dosis yang terlewat',

  // ── Darurat ──
  '/emergency': 'Kartu darurat berisi golongan darah, alergi, dan nomor yang dihubungi saat gawat',

  // ── Belajar & materi ──
  '/med-study': 'Bank soal, kasus OSCE, catatan penyakit, dan jembatan keledai untuk ujian',
  '/osce-ukmppd': 'Lihat kasus apa saja yang pernah keluar di ujian OSCE sejak 2016.',
  '/education': 'Materi belajar kesehatan untuk umum, bukan untuk ujian kedokteran',
  '/drug-info': 'Cari obat: kegunaan, dosis, efek samping, dan pantangannya',
  '/my-materials': 'Materi yang Anda tulis maupun simpan sendiri',
  '/editor': 'Tulis dan sunting materi untuk dibagikan',

  // ── Sosial ──
  '/feed': 'Kabar dan kegiatan dari teman-teman Anda',
  '/community': 'Ruang diskusi bersama pemakai lain',
  '/messages': 'Pesan pribadi dengan pemakai lain',
  '/clubs': 'Klub olahraga dan kelompok kegiatan bersama',
  '/jelajah': 'Cari orang dan kiriman di jejaring sosial aplikasi ini',

  // ── Ibadah ──
  '/scripture': 'Kitab suci beserta cara bacanya',
  '/hadith': 'Kumpulan hadis beserta terjemahannya',
  '/prayer-times': 'Jadwal salat dan arah kiblat di tempat Anda',

  // ── Hub ──
  '/wellness-hub': 'Pintu ke seluruh alat kesejahteraan dan umur panjang',
  '/calculator-hub': 'Pintu ke seluruh kalkulator klinis, dapat dicari',
  '/fitness-hub': 'Pintu ke seluruh alat kebugaran dan latihan',
  '/clinical-hub': 'Pintu ke seluruh alat klinis dan bantuan kecerdasan buatan',
  '/semua-fitur': 'Daftar seluruh halaman beserta kegunaannya',

  // ── Layanan & transaksi ──
  '/consult': 'Konsultasi dengan tenaga kesehatan',
  '/hospitals': 'Cari rumah sakit, puskesmas, dan klinik terdekat',
  '/pharmacy': 'Pesan obat dari apotek',
  '/orders': 'Riwayat pesanan dan pembelian Anda',
  '/marketplace': 'Jual beli materi, catatan, dan barang antar pemakai',
  '/pricing': 'Pilihan paket berlangganan dan harganya',
  '/billing': 'Tagihan dan cara pembayaran',
  '/keuangan': 'Catat pemasukan dan pengeluaran yang berkaitan dengan kesehatan',

  // ── Pengelolaan & akun ──
  '/atur-fitur': 'Pilih fitur mana yang ingin ditampilkan dan mana yang disembunyikan',
  '/verification': 'Ajukan bukti bahwa Anda tenaga kesehatan agar dapat fitur khusus',
  '/notifications': 'Semua pemberitahuan yang masuk',
  '/architecture': 'Susunan teknis aplikasi ini, untuk yang ingin tahu cara kerjanya',
  '/legal': 'Syarat pemakaian, kebijakan privasi, dan batas tanggung jawab',
  '/change': 'Daftar perubahan dan penambahan pada tiap versi aplikasi',
  '/learn': 'Bahan belajar memakai aplikasi ini beserta fiturnya',
  '/dek-connect': 'Kelola kartu profil Anda di fitur mencari teman dan pasangan',
  '/verifikasi-connect': 'Ajukan verifikasi agar profil Anda ditandai asli',
  '/tinjau-connect': 'Tinjau pengajuan verifikasi profil dari pemakai lain',

  // ── Peran khusus ──
  '/admin': 'Alat pengelola untuk pengurus aplikasi',
  '/owner': 'Ringkasan untuk pemilik aplikasi',
  '/owner-analytics': 'Angka pemakaian dan pertumbuhan untuk pemilik aplikasi',

  // ── Umur panjang & kesejahteraan ──
  '/health-simulator': 'Lihat bagaimana pilihan hari ini mengubah risiko penyakit Anda sepuluh tahun ke depan',
  '/findrisc': 'Hitung risiko terkena diabetes dalam sepuluh tahun, dan cara menurunkannya',
  '/biological-age': 'Perkirakan usia tubuh Anda yang sesungguhnya dari data kesehatan',
  '/longevity': 'Rencana pribadi agar tetap sehat lebih lama, bukan sekadar hidup lebih lama',
  '/organ-vitality': 'Lihat keadaan tiap organ satu per satu dalam satu gambaran',
  '/supplements': 'Suplemen mana yang benar-benar ada buktinya, dan mana yang tidak',
  '/family-health': 'Catat penyakit dalam keluarga untuk tahu apa yang perlu diperiksa lebih dini',
  '/gene-info': 'Cari tahu fungsi sebuah gen dan mengapa ia penting',
  '/connect': 'Cari teman maupun pasangan berdasarkan kecocokan gaya hidup sehat',
  '/breathwork': 'Latihan napas berirama untuk menenangkan diri dalam beberapa menit',
  '/gratitude': 'Tulis tiga hal baik setiap hari — cara sederhana yang terbukti memperbaiki suasana hati',
  '/mental-health-screen': 'Periksa sendiri tanda depresi dan kecemasan dengan kuesioner baku',
  '/substance-use-screen': 'Periksa sendiri kebiasaan minum alkohol dan merokok',
  '/ikigai': 'Temukan apa yang membuat Anda merasa hidup ini berarti',
  '/harada': 'Satu tujuan besar dipecah menjadi delapan penopang dan 64 langkah nyata',
  '/life-compass': 'Susun cita-cita, tujuan hidup, dan langkah berikutnya',
  '/resilience-stories': 'Kisah orang sungguhan yang bangkit dari keadaan berat',

  // ── Tidur ──
  '/sleep-debt': 'Hitung selisih antara tidur yang Anda butuhkan dan yang benar-benar didapat',
  '/chronotype': 'Cari tahu Anda tipe bangun pagi atau tipe begadang',
  '/epworth-sleepiness': 'Ukur seberapa mengantuk Anda pada siang hari',
  '/sleep-apnea-screen': 'Periksa risiko henti napas saat tidur',
  '/sleep-toolkit': 'Alarm siklus tidur, penghitung tidur siang, jurnal mimpi, dan suara pengantar tidur',
  '/log-detak-jantung': 'Setiap sampel denyut yang dikirim jam tangan, beserta serapatnya',
  '/pola-tidur': 'Lihat tahapan tidur tiap malam — dalam, REM, inti, dan terjaga — serta keteraturan jam tidur',

  // ── Makan & minum ──
  '/fasting': 'Atur jendela waktu makan dan lihat tahap metabolisme tubuh',
  '/thermal-therapy': 'Panduan sauna dan mandi air dingin beserta buktinya',
  '/macro-lab': 'Hitung kebutuhan karbohidrat, protein, dan lemak Anda',
  '/sehat-sibuk': 'Kebiasaan sehat yang muat di jadwal yang padat',
  '/carbon-diet': 'Pilihan makanan ditimbang dari jejak karbonnya',
  '/nutrition': 'Hitung kalori, zat gizi, dan laju pembakaran tubuh Anda',
  '/hydration': 'Hitung kebutuhan air minum harian Anda',
  '/alcohol': 'Hitung takaran alkohol dan perkiraan kadarnya dalam darah',
  '/caffeine': 'Lihat sampai jam berapa kopi hari ini masih mengganggu tidur malam nanti',
  '/nutrition-toolkit': 'Daftar periksa pola makan Mediterania, catatan gula, dan keragaman tanaman',

  // ── Lingkungan & kulit ──
  '/air-quality': 'Kualitas udara di sekitar Anda dan artinya bagi paru-paru',
  '/aesthetic': 'Panduan merawat kulit dan wajah',
  '/sun-exposure': 'Berjemur secukupnya untuk vitamin D tanpa merusak kulit',
  '/toxin-checklist': 'Kurangi paparan sehari-hari dari plastik, bahan pembersih, dan udara kotor',
  '/body-toolkit': 'Susun rutinitas perawatan kulit, peta gejala, dan catatan gerak harian',

  // ── Pencegahan & persiapan ──
  '/first-aid': 'Langkah pertolongan pertama dengan bahasa sederhana: tersedak, henti jantung, perdarahan',
  '/vaccine-tracker': 'Catat imunisasi terakhir dan kapan yang berikutnya jatuh tempo',
  '/allergy-tracker': 'Catat alergi makanan, minuman, obat, dan bahan yang menyentuh kulit',
  '/blood-donation': 'Periksa apakah Anda boleh donor darah dan kapan boleh lagi',
  '/organ-donor': 'Nyatakan kesediaan mendonorkan organ, lalu bicarakan dengan keluarga',
  '/visit-prep': 'Daftar apa yang perlu dibawa dan ditanyakan sebelum ke dokter',
  '/posture-breaks': 'Pengingat untuk berdiri, meregang, dan mengistirahatkan mata',
  '/pain-diary': 'Catat nyeri dari hari ke hari — berguna bagi Anda dan dokter Anda',
  '/second-opinion': 'Draf disusun kecerdasan buatan, lalu ditinjau dan disetujui dokter sungguhan',

  // ── Perkakas umur panjang ──
  '/movement-toolkit': 'Uji kekuatan genggaman, keseimbangan, zona 2, dan latihan singkat harian',
  '/mind-toolkit': 'Latihan otak, permainan ingatan, waktu reaksi, dan pengukur stres',
  '/longevity-science': 'Penjelasan ilmu penuaan: tanda-tanda menua, NAD+, sirtuin, rapamisin',
  '/self-assessment-toolkit': 'Kuis telomer, skor peradangan, dan rasio pinggang terhadap tinggi',
  '/longevity-game-center': 'Bingo kebiasaan, rapor yang bisa dibagikan, dan kutipan harian',
  '/predictive-models-toolkit': 'Perkiraan waktu autofagi, kurva kortisol, dan beban glikemik',
  '/data-lab-advanced': 'Ramalan tren darah, PhenoAge, dan brankas data terenkripsi',
  '/bio-simulators': 'Gambaran mTOR/AMPK, ritme harian, dan telomer sebagai ilustrasi',

  // ── Pengukuran mandiri ──
  '/rppg-heart-rate': 'Perkirakan denyut nadi dari kamera, tanpa perlu jam tangan pintar',
  '/vocal-biomarkers': 'Analisis nada dan getaran suara dari rekaman lima detik',
  '/snp-profiler': 'Unggah data DNA mentah — diolah di peramban Anda sendiri, tidak dikirim ke mana pun',
  '/data-lab': 'Unggah berkas data kesehatan Anda sendiri lalu ubah jadi grafik',

  // ── Latihan & olahraga ──
  '/athlete': 'Papan pantau latihan: zona denyut, beban, dan lari ber-GPS',
  '/workout': 'Sesi latihan berpandu lengkap dengan video contoh gerakan',
  '/training-plan': 'Program latihan tersusun yang menyesuaikan diri dengan kemajuan Anda',
  '/lari-sepeda-renang': 'Zona daya, kecepatan renang, latihan kecepatan, dan postur untuk tiga cabang',
  '/teknik-lari': 'Irama langkah, jangkauan kaki, ayunan lengan, napas, start, dan hambatan angin',
  '/peregangan': 'Peregangan sesuai keadaan — sebelum lari, sesudah sepeda, atau jeda kerja duduk',
  '/crossfit': 'Bentuk latihan CrossFit, tolok ukur bernama, dan cara menurunkan beratnya dengan aman',
  '/alat-fitness': 'Panduan alat gym dan bentuk latihan bergaya Hyrox',
  '/sports-lab': 'Uji dan uraian penampilan sesuai cabang olahraga',
  '/analisis-gerak': 'Baca asimetri langkah, kualitas jalan, bentuk lari, dan pemulihan denyut dari jam tangan',
  '/riwayat-latihan': 'Setiap sesi yang diimpor beserta kurva denyut per menit, pembagian zona, dan pemulihannya',
  '/analisis-pro': 'Kebugaran dan kesegaran, upaya relatif, usaha terbaik, zona pace, serta target',
  '/body-battery': 'Cadangan energi 0-100 sepanjang hari dan tingkat stres, dibaca dari denyut',
  '/fisiologi-latihan': 'Beban latihan, status, waktu pulih, dan kesiapan — dihitung dari jam tangan Anda',
  '/alat-endurance': 'Rencana bahan bakar, laju keringat, FTP sepeda, panduan daya, dan penyesuaian panas',
  '/pelacak-klinis': 'Catatan SpO2, hasil EKG, rencana jet lag, aktivitas kehamilan, dan fisiologi kursi roda',
  '/latihan-dasar': 'Zona pace lari, tahapan push-up, pull-up, sit-up, dan perbaikan postur',
  '/fitness-test': 'Periksa bentuk dan postur gerakan Anda dari sebuah foto',
  '/readiness': 'Hari ini sebaiknya latihan keras atau istirahat',
  '/assessment': 'Pengukuran awal kebugaran dan pola gerak sebagai titik mulai',
  '/body': 'Uraian komposisi tubuh: otot, lemak, dan air',
  '/lab': 'Pengelolaan beban latihan, VO2max, dan ukuran penampilan',
  '/sports-science': 'Bukti ilmiah dan ukuran utama di balik angka-angka Anda',
  '/shape-forming': 'Program tersusun untuk membentuk ulang komposisi tubuh',
  '/sports-scores': 'Skor langsung tim dan liga kesukaan Anda',
  '/health-data': 'Sambungkan Apple Watch, atau unggah ekspor Garmin, WHOOP, dan InBody',

  // ── Klinis & kecerdasan buatan ──
  '/chatbot': 'Ajukan pertanyaan kesehatan, dijawab dengan bahasa sederhana beserta sumbernya',
  '/evidence': 'Bukti terbitan ilmiah di balik sebuah pengobatan atau klaim',
  '/trials': 'Cari uji klinis yang mungkin dapat Anda ikuti',
  '/emr': 'Rekam medis elektronik dengan bantuan penulisan catatan',
  '/clinical': 'Daftar pasien Anda beserta angka klinisnya',
  '/planning': 'Susun jadwal dan rencana perawatan pasien',
  '/clinical-calculators': 'Skor dan kalkulator risiko yang dipakai di samping tempat tidur pasien',
  '/sexual-health': 'Kesehatan reproduksi, seksual, dan kebidanan',
  '/longevity-curriculum': 'Materi ajar tersusun tentang kedokteran umur panjang',
  '/lab-decoder': 'Penjelasan bahasa sederhana untuk hasil laboratorium yang umum',
  '/reality-check': 'Penapisan alkohol CAGE dan hitungan bungkus-tahun merokok',
  '/empiric-therapy-reference': 'Golongan obat lini pertama menurut diagnosis — acuan cepat yang dapat dicari',
  '/dermatology-lesion-mapper': 'Bentuk kelainan kulit dan letak kesukaannya menuju diagnosis banding baku',
  '/psychiatric-status-exam': 'Penulisan pemeriksaan status mental secara terstruktur',
  '/neonatal-resuscitation-guide': 'Alur langkah awal resusitasi bayi baru lahir beserta penghitung Menit Emas',
  '/fluid-calculators': 'Hitung cairan rumatan, resusitasi sepsis, PALS, Parkland, dan koreksi elektrolit',
  '/child-growth': 'Grafik pertumbuhan anak menurut WHO, usia 0 sampai 60 bulan',

  // ── Skor klinis: jantung & pembuluh ──
  '/stroke-risk': 'Hitung risiko stroke pada fibrilasi atrium untuk menentukan perlu tidaknya pengencer darah',
  '/has-bled-score': 'Hitung risiko perdarahan akibat pengencer darah — pasangan dari CHA₂DS₂-VASc',
  '/timi-risk-score': 'Hitung risiko 14 hari pada angina tidak stabil dan serangan jantung tanpa elevasi ST',
  '/grace-score': 'Perkirakan risiko kematian selama dirawat pada seluruh spektrum sindrom koroner akut',
  '/qtc-calculator': 'Hitung QT terkoreksi untuk menapis keamanan obat, empat rumus beserta trennya',
  '/duke-criteria': 'Kriteria penegakan diagnosis infeksi katup jantung',
  '/ldl-calculator': 'Hitung LDL dengan rumus Friedewald beserta kolesterol non-HDL',
  '/risk': 'Hitung risiko penyakit jantung sepuluh tahun, FIB-4, dan OST',

  // ── Skor klinis: paru ──
  '/wells-score': 'Perkirakan kemungkinan sumbatan pembuluh darah tungkai dan paru sebelum pemeriksaan',
  '/perc-rule': 'Singkirkan sumbatan pembuluh paru tanpa pemeriksaan pada pasien berisiko rendah',
  '/aa-gradient': 'Tentukan letak sebab kekurangan oksigen: masalah paru atau napas yang terlalu pelan',
  '/lights-criteria': 'Bedakan cairan di rongga paru: eksudat atau transudat',

  // ── Skor klinis: kegawatan ──
  '/sofa-score': 'Nilai beratnya kegagalan enam organ di ruang rawat intensif beserta trennya',
  '/news2-score': 'Peringatan dini dari tanda vital di bangsal beserta trennya',

  // ── Skor klinis: hati & saluran cerna ──
  '/meld-score': 'Nilai beratnya penyakit hati dan urutan prioritas cangkok hati',
  '/maddrey-score': 'Tentukan perlu tidaknya kortikosteroid pada hepatitis alkoholik berat',
  '/child-pugh-score': 'Golongkan sirosis ke kelas A, B, atau C beserta risiko pembedahannya',
  '/glasgow-blatchford-score': 'Tentukan siapa yang perlu dirawat pada perdarahan saluran cerna atas, sebelum endoskopi',
  '/rockall-score': 'Perkirakan risiko perdarahan ulang dan kematian sesudah endoskopi',
  '/ranson-criteria': 'Nilai beratnya radang pankreas saat masuk dan 48 jam sesudahnya',
  '/bisap-score': 'Nilai beratnya radang pankreas dalam 24 jam pertama',

  // ── Skor klinis: ginjal & metabolik ──
  '/creatinine-clearance': 'Hitung bersihan kreatinin untuk menyesuaikan dosis obat pada gangguan ginjal',
  '/fena-calculator': 'Bedakan gangguan ginjal akut karena kekurangan aliran darah atau kerusakan tubulus',
  '/pediatric-dka-calculator': 'Hitung bolus, defisit, rumatan, kalium, dan insulin pada ketoasidosis diabetik anak',
  '/corrected-calcium': 'Sesuaikan kadar kalsium bila albumin rendah',
  '/serum-osmolality': 'Hitung selisih osmolal untuk menapis keracunan alkohol beracun',

  // ── Skor klinis: darah & lainnya ──
  '/4ts-score': 'Perkirakan kemungkinan trombositopenia akibat heparin',
  '/padua-score': 'Tentukan perlu tidaknya pencegahan sumbatan pembuluh pada pasien penyakit dalam',
  '/caprini-score': 'Tentukan perlu tidaknya pencegahan sumbatan pembuluh pada pasien bedah',
  '/braden-scale': 'Nilai risiko luka tekan beserta tingkat pencegahan yang diperlukan',
  '/charlson-index': 'Hitung beban penyakit penyerta dan perkiraan harapan hidup sepuluh tahun',
  '/ottawa-ankle': 'Tentukan apakah cedera pergelangan kaki ini perlu difoto rontgen',
}

/**
 * Ambil penjelasan untuk sebuah alamat.
 *
 * Urutannya: penjelasan bahasa Indonesia lebih dahulu, lalu keterangan bawaan
 * dari hub sebagai cadangan. Bila keduanya tidak ada, dikembalikan teks kosong
 * dan pemanggilnya yang memutuskan apa yang ditampilkan — MENGARANG kalimat
 * penjelasan secara otomatis dari nama fitur akan menghasilkan keterangan yang
 * terdengar meyakinkan namun bisa saja keliru, dan keterangan keliru pada
 * halaman berisi dosis obat lebih berbahaya daripada kolom yang dikosongkan.
 */
export function penjelasan(to: string, cadangan?: string): string {
  return PENJELASAN_FITUR[to] ?? cadangan ?? ''
}
