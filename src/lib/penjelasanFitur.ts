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

  // ── Peran khusus ──
  '/admin': 'Alat pengelola untuk pengurus aplikasi',
  '/owner': 'Ringkasan untuk pemilik aplikasi',
  '/owner-analytics': 'Angka pemakaian dan pertumbuhan untuk pemilik aplikasi',
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
