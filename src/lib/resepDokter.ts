// ─────────────────────────────────────────────────────────────────────────────
// Penulisan resep dokter — anatomi resep, aturan, dan contoh siap pakai.
//
// KENAPA BERKAS INI ADA. Menulis resep adalah stasiun OSCE tersendiri dan
// keterampilan yang dipakai setiap hari setelah lulus, tetapi ia hampir tidak
// pernah diajarkan sebagai KETERAMPILAN — yang diajarkan adalah obat dan
// dosisnya, lalu mahasiswa diminta menuliskannya tanpa pernah diberi tahu
// bagian-bagian resep, urutannya, dan kesalahan mana yang membuat apoteker
// menolak menebus.
//
// BATAS YANG TIDAK BOLEH KABUR. Berkas ini mengajarkan CARA MENULIS, dan
// contoh-contohnya adalah contoh BENTUK, bukan anjuran terapi. Dosis pada
// contoh tetap harus diperiksa terhadap PIONAS, formularium institusi, dan
// penyelia klinis sebelum dipakai pada pasien sungguhan. Sebuah aplikasi
// belajar tidak berwenang menjadi sumber dosis, dan tidak berpura-pura begitu.
//
// TIDAK ADA CONTOH BERISI IDENTITAS ASLI. Nama dokter, nomor SIP, alamat, dan
// nama pasien pada contoh sengaja ditulis sebagai placeholder yang jelas
// terlihat placeholder — resep yang tampak sah dan dapat ditebus adalah hal
// yang tidak boleh diedarkan sebagai bahan belajar.
// ─────────────────────────────────────────────────────────────────────────────

export interface BagianResep {
  nama: string
  arti: string
  wajib: boolean
  penjelasan: string
  contoh: string
}

/**
 * Anatomi resep menurut urutan penulisannya dari atas ke bawah.
 *
 * Urutan ini bukan selera penulis: apotek membaca resep dari atas ke bawah,
 * dan bagian yang tertukar tempatnya membuat pembacaan melambat justru pada
 * saat resep paling dibutuhkan cepat.
 */
export const BAGIAN_RESEP: BagianResep[] = [
  {
    nama: 'Inscriptio',
    arti: 'Identitas penulis resep',
    wajib: true,
    penjelasan:
      'Nama dokter, nomor Surat Izin Praktik, alamat praktik, dan nomor telepon — dicetak di kepala blanko. Tanpa nomor SIP, resep tidak sah secara hukum dan apotek berhak menolak. Tanggal penulisan juga masuk di sini, dan ia menentukan masa berlaku resep.',
    contoh: 'dr. [Nama Dokter]\nSIP: [nomor SIP]\n[Alamat praktik] — Telp. [nomor]\n[Kota], [tanggal]',
  },
  {
    nama: 'Invocatio',
    arti: 'Permintaan kepada apoteker',
    wajib: true,
    penjelasan:
      'Tanda R/ (recipe, artinya "ambillah") yang mengawali SETIAP formula obat. Bila satu resep memuat tiga obat, maka ditulis tiga R/ terpisah, masing-masing dengan aturan pakainya sendiri. Menggabungkan tiga obat di bawah satu R/ membuat aturan pakainya menjadi kabur.',
    contoh: 'R/',
  },
  {
    nama: 'Praescriptio / Ordonatio',
    arti: 'Nama obat, kekuatan, bentuk sediaan, dan jumlah',
    wajib: true,
    penjelasan:
      'Nama obat sebaiknya nama GENERIK. Sertakan kekuatan sediaan dan bentuknya (tablet, kapsul, sirup, salep), lalu jumlah yang diminta setelah tanda "No." dengan ANGKA ROMAWI. Angka Romawi dipakai justru karena ia sulit diubah — angka Arab mudah ditambahi satu digit oleh orang lain.',
    contoh: 'R/ Amoksisilin tab 500 mg   No. XV',
  },
  {
    nama: 'Signatura',
    arti: 'Aturan pakai untuk pasien',
    wajib: true,
    penjelasan:
      'Diawali huruf S (signa), lalu berapa kali sehari, berapa banyak tiap kali, dan keterangan tambahan. Inilah bagian yang disalin apoteker ke etiket, sehingga bahasanya harus dapat dipahami pasien setelah diterjemahkan.',
    contoh: 'S 3 dd tab 1 p.c.',
  },
  {
    nama: 'Subscriptio',
    arti: 'Paraf atau tanda tangan dokter',
    wajib: true,
    penjelasan:
      'Paraf dibubuhkan SETELAH signatura pada tiap R/. Fungsinya menutup formula itu sehingga tidak ada yang dapat menambahkan baris baru di bawahnya. Untuk obat golongan narkotika, diperlukan TANDA TANGAN LENGKAP, bukan paraf.',
    contoh: '⎯⎯ paraf ⎯⎯',
  },
  {
    nama: 'Pro',
    arti: 'Identitas pasien',
    wajib: true,
    penjelasan:
      'Nama pasien, umur, berat badan, dan alamat. UMUR DAN BERAT BADAN WAJIB pada pasien anak karena seluruh dosis anak dihitung per kilogram; resep anak tanpa berat badan tidak dapat diverifikasi apotek dan seharusnya ditolak.',
    contoh: 'Pro    : [Nama pasien]\nUmur   : [umur]   BB: [kg]\nAlamat : [alamat]',
  },
]

export interface SingkatanResep {
  singkatan: string
  latin: string
  arti: string
}

/** Singkatan Latin yang paling sering dipakai dan paling sering keliru dibaca. */
export const SINGKATAN_RESEP: SingkatanResep[] = [
  { singkatan: 'R/', latin: 'recipe', arti: 'ambillah' },
  { singkatan: 'S', latin: 'signa', arti: 'tandailah / aturan pakai' },
  { singkatan: 'dd', latin: 'de die', arti: 'sehari' },
  { singkatan: '1 dd', latin: 'semel de die', arti: 'sekali sehari' },
  { singkatan: '2 dd', latin: 'bis de die', arti: 'dua kali sehari' },
  { singkatan: '3 dd', latin: 'ter de die', arti: 'tiga kali sehari' },
  { singkatan: 'a.c.', latin: 'ante coenam', arti: 'sebelum makan' },
  { singkatan: 'p.c.', latin: 'post coenam', arti: 'sesudah makan' },
  { singkatan: 'd.c.', latin: 'durante coenam', arti: 'saat makan' },
  { singkatan: 'p.r.n.', latin: 'pro re nata', arti: 'bila perlu' },
  { singkatan: 'h.s.', latin: 'hora somni', arti: 'sebelum tidur' },
  { singkatan: 'o.m.', latin: 'omni mane', arti: 'tiap pagi' },
  { singkatan: 'o.n.', latin: 'omni nocte', arti: 'tiap malam' },
  { singkatan: 'p.o.', latin: 'per oral', arti: 'lewat mulut' },
  { singkatan: 'gtt', latin: 'guttae', arti: 'tetes' },
  { singkatan: 'ODS / OD / OS', latin: 'oculo dextro et sinistro', arti: 'kedua mata / mata kanan / mata kiri' },
  { singkatan: 'ADS / AD / AS', latin: 'auri dextrae et sinistrae', arti: 'kedua telinga / telinga kanan / telinga kiri' },
  { singkatan: 'u.e.', latin: 'usus externus', arti: 'pemakaian luar' },
  { singkatan: 'm.f.', latin: 'misce fac', arti: 'campur dan buatlah' },
  { singkatan: 'pulv.', latin: 'pulveres', arti: 'serbuk terbagi' },
  { singkatan: 'da in dim.', latin: 'da in dimidio', arti: 'berikan setengahnya' },
  { singkatan: 'iter', latin: 'iteratie', arti: 'dapat diulang' },
  { singkatan: 'n.i.', latin: 'ne iteretur', arti: 'TIDAK boleh diulang' },
  { singkatan: 'c.', latin: 'cum', arti: 'dengan' },
  { singkatan: 'q.s.', latin: 'quantum satis', arti: 'secukupnya' },
]

export interface AturanResep {
  judul: string
  isi: string
  berat: 'wajib' | 'penting' | 'lazim'
}

/**
 * Aturan yang membuat resep sah dan aman.
 *
 * Diurutkan menurut akibat bila dilanggar, bukan menurut urutan penulisan —
 * yang paling atas adalah yang paling sering menimbulkan celaka.
 */
export const ATURAN_RESEP: AturanResep[] = [
  {
    judul: 'Jangan pernah menulis nol di belakang koma',
    berat: 'wajib',
    isi: 'Tulis 5 mg, BUKAN 5,0 mg. Bila komanya tidak terbaca, 5,0 dibaca 50 dan pasien menerima sepuluh kali lipat dosisnya. Sebaliknya, SELALU tulis nol di depan koma: 0,5 mg dan bukan ,5 mg — sebab ,5 mudah terbaca 5.',
  },
  {
    judul: 'Jumlah obat ditulis dengan angka Romawi',
    berat: 'penting',
    isi: 'No. X, bukan No. 10. Angka Romawi dipilih karena sulit diubah orang lain; angka Arab cukup ditambahi satu digit untuk menjadi berkali lipat.',
  },
  {
    judul: 'Resep anak wajib memuat umur dan berat badan',
    berat: 'wajib',
    isi: 'Seluruh dosis anak dihitung per kilogram berat badan. Tanpa berat badan, apotek tidak dapat memverifikasi kewajaran dosis, sehingga resep anak tanpa berat badan seharusnya ditolak, bukan ditebus dengan perkiraan.',
  },
  {
    judul: 'Satu R/ untuk satu formula obat',
    berat: 'penting',
    isi: 'Tiap obat mendapat R/ sendiri lengkap dengan signatura dan parafnya. Menggabungkan beberapa obat di bawah satu R/ membuat aturan pakainya menjadi kabur dan menjadi sumber kesalahan penyerahan.',
  },
  {
    judul: 'Paraf menutup tiap formula',
    berat: 'penting',
    isi: 'Paraf dibubuhkan langsung setelah signatura sehingga tidak tersisa ruang untuk menambahkan baris baru. Untuk narkotika diperlukan tanda tangan lengkap dan resep tidak boleh diulang tanpa resep baru.',
  },
  {
    judul: 'Utamakan nama generik',
    berat: 'lazim',
    isi: 'Nama generik dipahami di mana saja dan tidak mengunci pasien pada satu merek yang mungkin lebih mahal maupun kosong. Bila menulis merek, tuliskan pula zat aktifnya.',
  },
  {
    judul: 'Hindari singkatan yang mudah tertukar',
    berat: 'wajib',
    isi: 'Tulis "unit" secara lengkap, jangan "U" yang mudah terbaca 0 sehingga 10 U menjadi 100. Hindari "µg" yang mudah terbaca mg; tulis mikrogram. Tulis nama obat lengkap, karena singkatan buatan sendiri hanya dipahami penulisnya.',
  },
  {
    judul: 'Tulisan tangan yang tidak terbaca adalah kesalahan medis',
    berat: 'wajib',
    isi: 'Resep yang harus ditebak apoteker adalah sumber kesalahan obat yang terdokumentasi baik. Bila ragu terbaca, tulis dengan huruf cetak. Ini bukan soal kerapian melainkan soal keselamatan.',
  },
  {
    judul: 'Periksa alergi dan interaksi sebelum menulis',
    berat: 'wajib',
    isi: 'Tanyakan riwayat alergi obat setiap kali, dan periksa interaksi dengan obat yang sedang diminum pasien. Riwayat alergi yang tidak ditanyakan adalah kelalaian, bukan kesialan.',
  },
  {
    judul: 'Resep bukan pengganti penjelasan',
    berat: 'lazim',
    isi: 'Sampaikan secara lisan untuk apa tiap obat, berapa lama diminum, apa efek samping yang mungkin muncul, dan kapan harus kembali. Pasien yang tidak paham tujuan obatnya adalah pasien yang akan berhenti minum di hari ketiga.',
  },
]

export interface ContohResep {
  id: string
  kasus: string
  sistem: string
  /** Catatan penalaran: kenapa obat ini, kenapa bentuk sediaan ini. */
  alasan: string
  /** Baris resep, ditulis apa adanya sebagaimana di blanko. */
  baris: string[]
  pro: string
  /** Kesalahan yang khas muncul pada kasus ini. */
  jebakan?: string
}

/**
 * Contoh resep — CONTOH BENTUK, bukan anjuran terapi.
 *
 * Yang diajarkan di sini adalah bagaimana sebuah resep disusun: urutan bagian,
 * cara menuliskan jumlah, cara menuliskan aturan pakai, dan bagaimana resep
 * anak berbeda dari resep dewasa. Dosisnya tetap wajib diperiksa terhadap
 * PIONAS dan formularium sebelum dipakai pada pasien.
 */
export const CONTOH_RESEP: ContohResep[] = [
  {
    id: 'dewasa-tunggal',
    kasus: 'Resep dewasa — satu obat',
    sistem: 'Dasar',
    alasan:
      'Bentuk paling sederhana, dipakai untuk mengenali keenam bagian resep. Perhatikan jumlah dengan angka Romawi, dan aturan pakai yang menyebutkan waktu terhadap makan.',
    baris: ['R/ Amoksisilin tab 500 mg   No. XV', '   S 3 dd tab 1  p.c.', '                        ⎯ paraf ⎯'],
    pro: 'Pro: [Nama pasien], 28 tahun',
    jebakan: 'Menulis No. 15 alih-alih No. XV, dan lupa mencantumkan p.c. maupun a.c. sehingga pasien menebak sendiri.',
  },
  {
    id: 'dewasa-ganda',
    kasus: 'Resep dewasa — beberapa obat',
    sistem: 'Dasar',
    alasan:
      'Tiap obat memperoleh R/ sendiri lengkap dengan signatura dan parafnya. Obat bila perlu ditandai p.r.n. beserta batas pemakaian hariannya supaya pasien tidak melampaui dosis maksimal.',
    baris: [
      'R/ Amoksisilin tab 500 mg   No. XV',
      '   S 3 dd tab 1  p.c.',
      '                        ⎯ paraf ⎯',
      'R/ Parasetamol tab 500 mg   No. X',
      '   S 3 dd tab 1  p.r.n. demam',
      '                        ⎯ paraf ⎯',
    ],
    pro: 'Pro: [Nama pasien], 28 tahun',
    jebakan: 'Menggabungkan kedua obat di bawah satu R/, sehingga aturan pakainya menjadi kabur.',
  },
  {
    id: 'anak-sirup',
    kasus: 'Resep anak — sediaan sirup',
    sistem: 'Anak',
    alasan:
      'Dosis anak dihitung per kilogram, jadi BERAT BADAN WAJIB DITULIS. Bentuk sirup dipilih karena anak belum dapat menelan tablet; jumlah yang diminta dihitung dari kebutuhan seluruh masa terapi, bukan ditebak.',
    baris: ['R/ Amoksisilin sirup 125 mg/5 mL   fl. No. I', '   S 3 dd cth 1  p.c.', '                        ⎯ paraf ⎯'],
    pro: 'Pro: [Nama anak], 4 tahun   BB: 16 kg',
    jebakan:
      'Tidak menulis berat badan — apotek tidak dapat memverifikasi dosisnya. Juga: menulis "cth" (sendok teh, 5 mL) padahal yang dimaksud sendok makan, maupun sebaliknya.',
  },
  {
    id: 'anak-puyer',
    kasus: 'Resep anak — serbuk terbagi (puyer)',
    sistem: 'Anak',
    alasan:
      'Dipakai bila sediaan jadi tidak tersedia dalam kekuatan yang dibutuhkan. Dosis per bungkus ditulis, lalu m.f. pulv. dt.d. No. sekian menyatakan berapa bungkus yang dibuat.',
    baris: [
      'R/ Parasetamol            120 mg',
      '   m.f. pulv. dt.d. No. X',
      '   S 3 dd pulv. I  p.r.n. demam',
      '                        ⎯ paraf ⎯',
    ],
    pro: 'Pro: [Nama anak], 3 tahun   BB: 14 kg',
    jebakan: 'Lupa menuliskan m.f. pulv. sehingga apotek tidak tahu sediaan yang diminta racikan.',
  },
  {
    id: 'tetes-mata',
    kasus: 'Resep tetes mata',
    sistem: 'Mata',
    alasan:
      'Sisi mata WAJIB dinyatakan dengan OD, OS, maupun ODS. Menulis "tetes mata" tanpa sisi membuat pasien meneteskan ke mata yang salah, dan itu kesalahan yang sepenuhnya dapat dicegah.',
    baris: ['R/ [Tetes mata sesuai indikasi]   fl. No. I', '   S 4 dd gtt I  ODS', '                        ⎯ paraf ⎯'],
    pro: 'Pro: [Nama pasien], 35 tahun',
    jebakan: 'Tidak menuliskan sisi mata, dan memakai singkatan telinga (AD/AS) untuk mata.',
  },
  {
    id: 'topikal',
    kasus: 'Resep sediaan luar',
    sistem: 'Kulit',
    alasan:
      'Sediaan luar WAJIB diberi keterangan u.e. (usus externus, pemakaian luar) supaya tidak tertelan. Sebutkan pula daerah pemakaian dan lama pemakaiannya.',
    baris: ['R/ [Salep sesuai indikasi]   tube No. I', '   S u.e. 2 dd applic. loc. dol.', '                        ⎯ paraf ⎯'],
    pro: 'Pro: [Nama pasien], 22 tahun',
    jebakan: 'Lupa u.e. pada sediaan luar, dan tidak menyebutkan daerah maupun lama pemakaian.',
  },
  {
    id: 'narkotika',
    kasus: 'Resep narkotika',
    sistem: 'Khusus',
    alasan:
      'Aturannya lebih ketat: TANDA TANGAN LENGKAP dan bukan paraf, alamat pasien wajib lengkap, tidak boleh ada iter, dan resep ditulis pada blanko tersendiri sesuai ketentuan yang berlaku. Jumlahnya ditulis dengan huruf di samping angka Romawi untuk mencegah perubahan.',
    baris: [
      'R/ [Analgesik opioid sesuai indikasi]   No. X (sepuluh)',
      '   S 3 dd tab 1  p.r.n. nyeri hebat',
      '   n.i.',
      '                        ⎯ tanda tangan lengkap ⎯',
    ],
    pro: 'Pro: [Nama pasien], 54 tahun\nAlamat: [alamat lengkap wajib]',
    jebakan:
      'Membubuhkan paraf alih-alih tanda tangan lengkap, menulis iter pada narkotika, dan tidak mencantumkan alamat pasien secara lengkap.',
  },
  {
    id: 'iter',
    kasus: 'Resep dengan pengulangan (iter)',
    sistem: 'Khusus',
    alasan:
      'Dipakai pada penyakit menahun yang obatnya diminum terus-menerus. Iter 2x berarti resep dapat ditebus tiga kali seluruhnya: satu kali pertama ditambah dua kali pengulangan. Ini sumber kekeliruan yang lazim.',
    baris: [
      'iter 2x',
      'R/ [Obat rumatan sesuai indikasi]   No. XXX',
      '   S 1 dd tab 1  o.m.',
      '                        ⎯ paraf ⎯',
    ],
    pro: 'Pro: [Nama pasien], 60 tahun',
    jebakan:
      'Mengira iter 2x berarti dua kali penebusan; sebenarnya tiga kali. Dan iter TIDAK BOLEH dipakai untuk narkotika.',
  },
]

/** Kesalahan penulisan resep yang paling sering ditemukan pada ujian dan praktik. */
export const KESALAHAN_RESEP: { salah: string; benar: string; kenapa: string }[] = [
  {
    salah: 'Digoksin 0,250 mg',
    benar: 'Digoksin 0,25 mg',
    kenapa: 'Nol di belakang koma dapat terbaca sebagai angka tambahan sehingga dosis melonjak sepuluh kali lipat.',
  },
  {
    salah: 'Levotiroksin ,05 mg',
    benar: 'Levotiroksin 0,05 mg',
    kenapa: 'Koma di awal mudah terlewat sehingga ,05 terbaca 5 — seratus kali lipat.',
  },
  {
    salah: 'Insulin 10 U',
    benar: 'Insulin 10 unit',
    kenapa: 'Huruf U mudah terbaca angka nol sehingga 10 U menjadi 100.',
  },
  {
    salah: 'No. 10',
    benar: 'No. X',
    kenapa: 'Angka Arab mudah diubah dengan menambah satu digit; angka Romawi jauh lebih sulit dipalsukan.',
  },
  {
    salah: 'Resep anak tanpa berat badan',
    benar: 'Cantumkan umur DAN berat badan',
    kenapa: 'Dosis anak dihitung per kilogram; tanpa berat badan dosisnya tidak dapat diverifikasi apotek.',
  },
  {
    salah: 'S 3 dd 1 (tanpa keterangan waktu)',
    benar: 'S 3 dd tab 1 p.c.',
    kenapa: 'Sebagian obat harus sesudah makan dan sebagian justru sebelum; tanpa keterangan, pasien menebak sendiri.',
  },
  {
    salah: 'Tetes mata tanpa sisi',
    benar: 'S 4 dd gtt I OD (kanan) / OS (kiri) / ODS (keduanya)',
    kenapa: 'Tanpa sisi, obat diteteskan ke mata yang salah.',
  },
  {
    salah: 'Salep tanpa u.e.',
    benar: 'S u.e. 2 dd applic. loc. dol.',
    kenapa: 'Sediaan luar yang tidak ditandai pemakaian luar berisiko tertelan.',
  },
]

export const PERINGATAN_RESEP =
  'Seluruh contoh di halaman ini adalah contoh BENTUK PENULISAN, bukan anjuran terapi. Nama dokter, nomor SIP, dan nama pasien sengaja ditulis sebagai isian kosong supaya tidak ada resep di sini yang tampak sah dan dapat ditebus. Dosis apa pun yang Anda tuliskan pada pasien sungguhan wajib diperiksa lebih dahulu terhadap PIONAS, formularium institusi Anda, dan penyelia klinis.'
