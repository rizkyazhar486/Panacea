// ─────────────────────────────────────────────────────────────────────────────
// Kisah para nabi.
//
// SATU BATAS YANG MENENTUKAN SELURUH BENTUK BERKAS INI, dan ia sama dengan
// batas pada lib/kitab.ts: TEKS AL-QUR'AN TIDAK PERNAH DITULIS DI SINI, tidak
// sebagian, tidak satu ayat pun, tidak dalam bahasa Arab maupun terjemahan.
// Yang disimpan hanya ALAMAT ayatnya — nomor surah dan nomor ayat — dan
// teksnya diambil lewat jalur yang sudah memeriksa keutuhannya.
//
// APA YANG BOLEH DITULIS DI SINI, dan apa yang tidak:
//
//   BOLEH — ringkasan alur kisah sebagaimana diceritakan Al-Qur'an, ditulis
//   sebagai keterangan, dengan penunjuk ke surah yang memuatnya sehingga
//   pembaca dapat memeriksanya sendiri. Ini bentuk yang sama dengan buku
//   pengantar mana pun.
//
//   TIDAK BOLEH — mengarang perincian yang tidak ada dalam sumbernya, mengaku
//   tahu jumlah nabi, tahun, atau letak yang tidak disebutkan, dan menyajikan
//   riwayat israiliyat sebagai bagian dari Al-Qur'an. Perincian semacam itu
//   beredar luas dan terdengar meyakinkan, dan justru karena itulah ia
//   berbahaya di layar yang tampak berwibawa.
//
// TENTANG JUMLAH. Al-Qur'an menyebut nama 25 nabi. Jumlah SELURUH nabi tidak
// disebutkan dalam Al-Qur'an; angka-angka yang beredar berasal dari riwayat
// yang diperselisihkan keabsahannya, dan karena itu tidak dinyatakan di sini
// sebagai fakta.
//
// PELAJARAN YANG DICANTUMKAN DITULIS SEBAGAI BACAAN, BUKAN SEBAGAI FATWA. Ia
// tidak mengklaim kewenangan keagamaan, dan pembaca diarahkan kepada gurunya
// sendiri untuk penafsiran.
// ─────────────────────────────────────────────────────────────────────────────

export interface RujukanAyat {
  surah: number
  /** Nomor ayat; bila kosong berarti seluruh surahnya berkisah tentang ini. */
  ayat?: number
  keterangan: string
}

export interface Nabi {
  id: string
  /** Nama sebagaimana disebut dalam Al-Qur'an, alih aksara Latin. */
  nama: string
  namaArab: string
  /** Nama yang lazim dipakai dalam tradisi lain, bila ada — membantu pencarian. */
  lain?: string
  /** Ringkasan alur kisah, dalam bahasa Indonesia. */
  ringkasId: string
  /** Ringkasan yang sama dalam bahasa Inggris. */
  ringkasEn: string
  /** Di mana kisahnya dapat dibaca sendiri. */
  rujukan: RujukanAyat[]
  /** Apa yang lazim diambil pembaca dari kisah ini — bacaan, bukan fatwa. */
  pelajaran: string[]
  /** Perincian yang sering dikira bagian Al-Qur'an padahal bukan. */
  seringKeliru?: string
}

export const NABI: Nabi[] = [
  {
    id: 'adam',
    nama: 'Adam',
    namaArab: 'آدَم',
    ringkasId:
      'Manusia pertama, yang penciptaannya diikuti perintah kepada para malaikat untuk bersujud, dan penolakan Iblis. Ia dan pasangannya ditempatkan di surga, melanggar satu larangan, lalu diturunkan ke bumi — dan yang paling ditekankan bukan pelanggarannya melainkan bahwa ia menerima kalimat tobat dari Tuhannya dan diterima tobatnya.',
    ringkasEn:
      'The first human. His creation is followed by the command to the angels to bow, and by Iblis refusing. He and his wife are placed in the garden, break one prohibition, and are sent down to the earth — and the weight of the account falls not on the transgression but on the fact that he received words of repentance and was forgiven.',
    rujukan: [
      { surah: 2, ayat: 30, keterangan: 'Penciptaan dan perintah bersujud' },
      { surah: 2, ayat: 37, keterangan: 'Menerima kalimat tobat' },
      { surah: 7, ayat: 19, keterangan: 'Larangan di surga' },
      { surah: 20, ayat: 115, keterangan: 'Perjanjian yang terlupa' },
    ],
    pelajaran: [
      'Kesalahan tidak dinilai sebagai akhir; yang dinilai adalah apa yang dilakukan sesudahnya.',
      'Penolakan Iblis digambarkan berakar pada kesombongan, bukan pada ketidaktahuan.',
    ],
    seringKeliru:
      'Jenis buah yang dilarang tidak disebutkan Al-Qur\'an. "Apel" berasal dari tradisi lain dan bukan bagian dari kisah ini.',
  },
  {
    id: 'nuh',
    nama: 'Nuh',
    namaArab: 'نُوح',
    lain: 'Noah',
    ringkasId:
      'Berdakwah kepada kaumnya dalam waktu yang sangat panjang dengan hasil yang sedikit, lalu diperintahkan membuat bahtera di tempat yang jauh dari air sehingga ditertawakan. Banjir datang; yang beriman selamat. Yang paling menyayat adalah anaknya sendiri termasuk yang menolak, dan permintaan Nuh untuknya tidak dikabulkan.',
    ringkasEn:
      'He calls his people over a very long span with little result, then is told to build the ark far from water and is mocked for it. The flood comes; those who believed are saved. The sharpest part of the account is that his own son is among those who refuse, and his plea for him is not granted.',
    rujukan: [
      { surah: 11, ayat: 25, keterangan: 'Dakwah dan penolakan kaumnya' },
      { surah: 11, ayat: 42, keterangan: 'Anaknya yang menolak naik' },
      { surah: 71, keterangan: 'Surah Nuh — seluruhnya tentang dakwahnya' },
      { surah: 29, ayat: 14, keterangan: 'Lamanya ia tinggal bersama kaumnya' },
    ],
    pelajaran: [
      'Hasil dakwah tidak dipakai sebagai ukuran keberhasilan seseorang.',
      'Hubungan darah tidak dengan sendirinya menyelamatkan; ini ditegaskan justru pada anak seorang nabi.',
    ],
  },
  {
    id: 'ibrahim',
    nama: 'Ibrahim',
    namaArab: 'إِبْرَاهِيم',
    lain: 'Abraham',
    ringkasId:
      'Mencari Tuhan yang sebenarnya dengan menolak yang terbenam dan yang berubah, berhadapan dengan kaumnya dan dengan penguasa, dihadapkan pada api, lalu diuji dengan perintah menyembelih anaknya. Ia membangun Ka\'bah bersama Ismail, dan disebut sebagai bapak dari jalan yang lurus.',
    ringkasEn:
      'He searches for the true God by rejecting what sets and what changes, confronts his people and a ruler, is thrown into fire, and is finally tested with the command to sacrifice his son. He raises the foundations of the Kaaba with Ismail, and is named as the father of the upright way.',
    rujukan: [
      { surah: 6, ayat: 76, keterangan: 'Mencari Tuhan: bintang, bulan, matahari' },
      { surah: 21, ayat: 51, keterangan: 'Menghadapi berhala kaumnya' },
      { surah: 21, ayat: 69, keterangan: 'Api yang dijadikan dingin' },
      { surah: 37, ayat: 102, keterangan: 'Ujian penyembelihan' },
      { surah: 2, ayat: 127, keterangan: 'Meninggikan fondasi Ka\'bah' },
    ],
    pelajaran: [
      'Keyakinan digambarkan sebagai hasil pencarian yang sungguh-sungguh, bukan warisan yang diterima begitu saja.',
      'Ujian terberatnya menyangkut apa yang paling ia cintai, bukan apa yang paling ia takuti.',
    ],
    seringKeliru:
      'Nama anak yang diperintahkan disembelih TIDAK disebutkan secara tegas dalam ayat itu, dan para ulama berbeda pendapat. Menyebutkan salah satu sebagai kepastian melampaui apa yang dinyatakan teksnya.',
  },
  {
    id: 'yusuf',
    nama: 'Yusuf',
    namaArab: 'يُوسُف',
    lain: 'Joseph',
    ringkasId:
      'Mimpi masa kecil, pengkhianatan saudara-saudaranya, sumur, perbudakan, godaan dan penjara, lalu tafsir mimpi yang mengangkatnya menjadi pengurus perbendaharaan Mesir. Ia bertemu kembali dengan saudara-saudaranya dari kedudukan yang memungkinkannya membalas — dan tidak membalas.',
    ringkasEn:
      'A childhood dream, betrayal by his brothers, the well, slavery, temptation and prison, then the reading of a dream that raises him to charge of Egypt\'s stores. He meets his brothers again from a position that would let him take revenge — and does not.',
    rujukan: [
      { surah: 12, keterangan: 'Surah Yusuf — kisahnya secara utuh dari awal sampai akhir' },
      { surah: 12, ayat: 92, keterangan: 'Kalimat pemaafannya kepada saudara-saudaranya' },
    ],
    pelajaran: [
      'Kisah ini disebut sendiri sebagai "kisah terbaik", dan ia diceritakan utuh dalam satu surah — bentuk yang tidak diberikan kepada kisah nabi lain.',
      'Kekuasaan digambarkan sebagai kesempatan untuk memaafkan, bukan untuk menuntut balas.',
    ],
  },
  {
    id: 'musa',
    nama: 'Musa',
    namaArab: 'مُوسَىٰ',
    lain: 'Moses',
    ringkasId:
      'Bayi yang dihanyutkan lalu dibesarkan di istana yang memburu kaumnya, meninggalkan Mesir, menerima kenabian di lembah suci, kembali menghadapi Fir\'aun, membelah laut, dan menerima wahyu di gunung. Ia nabi yang paling banyak disebut namanya dalam Al-Qur\'an.',
    ringkasEn:
      'An infant set on the river, raised in the palace of the very power hunting his people, leaving Egypt, receiving prophethood in the sacred valley, returning to confront Pharaoh, the parting of the sea, and revelation at the mountain. He is the prophet named most often in the Qur\'an.',
    rujukan: [
      { surah: 28, ayat: 7, keterangan: 'Bayi yang dihanyutkan' },
      { surah: 20, ayat: 9, keterangan: 'Api di lembah Tuwa dan kenabian' },
      { surah: 26, ayat: 63, keterangan: 'Laut yang terbelah' },
      { surah: 18, ayat: 60, keterangan: 'Perjalanan bersama hamba yang diberi ilmu' },
      { surah: 7, ayat: 143, keterangan: 'Permintaan untuk melihat, dan gunung yang hancur' },
    ],
    pelajaran: [
      'Ia menyebutkan keterbatasannya sendiri — lidah yang berat — dan meminta pertolongan, bukan menyembunyikannya.',
      'Kisah perjalanannya bersama hamba yang diberi ilmu berkisar pada satu hal: menahan diri dari menilai apa yang belum dipahami seluruhnya.',
    ],
  },
  {
    id: 'isa',
    nama: 'Isa',
    namaArab: 'عِيسَىٰ',
    lain: 'Jesus',
    ringkasId:
      'Lahir dari Maryam tanpa ayah, berbicara sejak dalam buaian, diberi mukjizat menyembuhkan dan menghidupkan dengan izin Allah, dan membawa Injil. Al-Qur\'an menegaskan ia hamba dan utusan, menolak penuhanannya, dan menyatakan bahwa ia tidak dibunuh dan tidak disalib melainkan diserupakan bagi mereka.',
    ringkasEn:
      'Born of Maryam without a father, speaking from the cradle, given the signs of healing and of giving life by God\'s permission, and bringing the Injil. The Qur\'an affirms him as servant and messenger, rejects his deification, and states that he was neither killed nor crucified but that it was made to appear so to them.',
    rujukan: [
      { surah: 19, ayat: 16, keterangan: 'Maryam dan kelahirannya' },
      { surah: 19, ayat: 30, keterangan: 'Berbicara dalam buaian' },
      { surah: 3, ayat: 49, keterangan: 'Mukjizat yang diberikan' },
      { surah: 4, ayat: 157, keterangan: 'Tentang penyaliban' },
      { surah: 5, ayat: 116, keterangan: 'Pertanyaan yang diajukan kepadanya' },
    ],
    pelajaran: [
      'Ibunya, Maryam, adalah satu-satunya perempuan yang namanya disebut dalam Al-Qur\'an, dan satu surah dinamai dengan namanya.',
    ],
    seringKeliru:
      'Perbedaan pandangan tentang penyaliban antara Islam dan Kristen adalah perbedaan pokok yang nyata. Menyamarkannya demi terdengar sejuk tidak menghormati kedua tradisi; keduanya sebaiknya disebutkan apa adanya.',
  },
  {
    id: 'muhammad',
    nama: 'Muhammad',
    namaArab: 'مُحَمَّد',
    ringkasId:
      'Nabi terakhir menurut keyakinan Islam, yang kepadanya Al-Qur\'an diturunkan berangsur-angsur selama sekitar dua puluh tiga tahun. Al-Qur\'an menyebutnya sebagai rahmat bagi seluruh alam dan sebagai penutup para nabi, dan berkali-kali menegaskan bahwa ia manusia biasa yang diberi wahyu.',
    ringkasEn:
      'The final prophet in Islamic belief, to whom the Qur\'an was revealed in stages over some twenty-three years. The Qur\'an names him a mercy to all the worlds and the seal of the prophets, and states repeatedly that he is a human being to whom revelation is given.',
    rujukan: [
      { surah: 21, ayat: 107, keterangan: 'Rahmat bagi seluruh alam' },
      { surah: 33, ayat: 40, keterangan: 'Penutup para nabi' },
      { surah: 93, keterangan: 'Surah Ad-Duha — pada masa yang berat baginya' },
      { surah: 94, keterangan: 'Surah Al-Insyirah — kelapangan sesudah kesempitan' },
      { surah: 96, ayat: 1, keterangan: 'Wahyu yang pertama turun' },
    ],
    pelajaran: [
      'Surah Ad-Duha dan Al-Insyirah turun pada masa yang berat, dan keduanya berbicara tentang menunggu, bukan tentang kemenangan.',
    ],
  },
]

/** Nabi yang namanya disebut dalam Al-Qur'an. */
export const NAMA_25 = [
  'Adam', 'Idris', 'Nuh', 'Hud', 'Salih', 'Ibrahim', 'Lut', 'Ismail', 'Ishaq', 'Yaqub',
  'Yusuf', 'Ayyub', 'Syuaib', 'Musa', 'Harun', 'Zulkifli', 'Dawud', 'Sulaiman', 'Ilyas',
  'Ilyasa', 'Yunus', 'Zakariya', 'Yahya', 'Isa', 'Muhammad',
]

/**
 * Apa yang TIDAK dinyatakan berkas ini, ditulis supaya terbaca pemakainya.
 */
export const BATAS = [
  'The Qur\'anic text itself is never written here. Only the address of a verse is stored — the surah and ayah number — and the words are fetched through the same checked path the rest of the app uses.',
  'The summaries are descriptions written to introduce a story, in the way any primer does. They are not translation, not tafsir, and carry no religious authority.',
  'The Qur\'an names 25 prophets. It does not give a total number of all prophets; the figures that circulate come from reports whose authenticity is disputed, so no total is stated here as fact.',
  'Details that circulate widely but are not in the source — the kind of fruit, names the text leaves unnamed — are marked as such rather than repeated.',
]
