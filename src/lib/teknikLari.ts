// ─────────────────────────────────────────────────────────────────────────────
// Teknik lari — dari kepala sampai kaki, plus fisiologi yang membuat teknik itu
// bertahan sampai kilometer terakhir.
//
// Satu hal yang perlu ditegaskan di depan, karena sebagian besar konten teknik
// lari salah di titik ini: TIDAK ADA satu bentuk lari yang benar untuk semua
// orang. Bukti terbaik yang ada menunjukkan bahwa mengubah gaya lari secara
// paksa — misalnya memaksa mendarat pada ujung kaki — tidak menurunkan risiko
// cedera dan sering memindahkannya (dari lutut ke tendon Achilles dan tulang
// telapak kaki). Yang benar-benar didukung bukti hanya sedikit, dan itulah yang
// ditandai "kuat" di bawah.
//
// Karena itu tiap butir di sini membawa tingkat buktinya sendiri. Menyamakan
// "menaikkan irama langkah 5%" (bukti kuat) dengan "condongkan badan dari
// pergelangan kaki" (kebiasaan pelatih, bukti lemah) akan membuat pembaca
// menghabiskan tenaga pada hal yang salah.
// ─────────────────────────────────────────────────────────────────────────────

export type Bukti = 'kuat' | 'sedang' | 'lemah'

export interface Bagian {
  id: string
  nama: string
  emoji: string
  ringkas: string
  /** Seberapa kuat bukti bahwa mengubah ini membantu. */
  bukti: Bukti
  intinya: string
  langkah: string[]
  kesalahan: string
  latihan: string
  video?: string
  gambar?: string
}

export const LABEL_BUKTI: Record<Bukti, { label: string; warna: string; arti: string }> = {
  kuat: { label: 'Bukti kuat', warna: 'text-emerald-400',
    arti: 'Beberapa uji terkendali menunjukkan manfaatnya. Layak diprioritaskan.' },
  sedang: { label: 'Bukti sedang', warna: 'text-amber-400',
    arti: 'Masuk akal secara biomekanik dan didukung sebagian penelitian, tetapi belum pasti.' },
  lemah: { label: 'Kebiasaan pelatih', warna: 'text-slate-400',
    arti: 'Diajarkan luas, tetapi buktinya tipis. Jangan diubah kalau lari Anda sudah nyaman dan bebas cedera.' },
}

export const BAGIAN: Bagian[] = [
  {
    id: 'irama', nama: 'Irama langkah (cadence)', emoji: '🥁', bukti: 'kuat',
    ringkas: 'Satu-satunya pengaturan yang paling terbukti membantu',
    intinya: 'Menaikkan jumlah langkah per menit sekitar 5-10% menurunkan beban pada lutut dan pinggul secara nyata, karena setiap langkah jadi lebih pendek dan mendarat lebih dekat ke bawah badan. Ini juga cara paling mudah memperbaiki overstriding tanpa memikirkan bagian tubuh mana pun.',
    langkah: [
      'Hitung langkah satu kaki selama 30 detik saat lari mudah, lalu kalikan empat. Itu irama Anda sekarang.',
      'Naikkan 5% dulu — bukan langsung ke 180. Angka 180 berasal dari pengamatan pelari elite pada lomba, bukan target untuk semua orang.',
      'Pakai metronom atau lagu ber-BPM sesuai target selama 5-10 menit di tengah lari mudah.',
      'Biarkan panjang langkah menyesuaikan sendiri. Jangan diatur langsung.',
    ],
    kesalahan: 'Mengejar 180 spm padahal irama alami Anda 158. Lompatan sebesar itu memaksa lari terasa tidak wajar dan biasanya ditinggalkan dalam sepekan.',
    latihan: '4 × 1 menit pada irama +5%, diselingi 2 menit irama bebas, di dalam lari mudah.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133225_6063efdb-e7da-4556-8524-07130b3a1d14.png',
  },
  {
    id: 'jangkauan', nama: 'Jangkauan kaki (panjang langkah)', emoji: '📏', bukti: 'kuat',
    ringkas: 'Mendarat di depan badan adalah pengereman',
    intinya: 'Kaki yang mendarat jauh di depan pinggul dengan lutut lurus menghasilkan gaya pengereman pada setiap langkah — Anda mengerem lalu mendorong lagi, ratusan kali per kilometer. Kaki yang mendarat mendekati bawah pinggul membuat gaya itu hilang. Ini bukan soal panjang langkah "pendek", melainkan soal DI MANA kaki menyentuh tanah relatif terhadap badan.',
    langkah: [
      'Perbaiki lewat irama langkah, bukan dengan sengaja memendekkan langkah.',
      'Rasakan tumit yang naik ke belakang setelah menolak — langkah panjang yang sehat datang dari dorongan ke belakang, bukan dari raihan ke depan.',
      'Saat menanjak langkah memendek sendiri; jangan dilawan.',
    ],
    kesalahan: 'Meraih ke depan untuk "menambah panjang langkah" saat ingin lebih cepat. Kecepatan datang dari dorongan ke belakang dan irama, bukan dari raihan.',
    latihan: 'Lari menurun landai 4 × 20 detik dengan irama tinggi — turunan memaksa langkah cepat tanpa perlu dipikirkan.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132825_217fde24-e5a4-4959-8f3d-2b13b88b5aa2.png',
  },
  {
    id: 'postur', nama: 'Postur & posisi tubuh', emoji: '🧍', bukti: 'sedang',
    ringkas: 'Tinggi, rileks, condong sedikit dari pergelangan kaki',
    intinya: 'Badan tegak memanjang dengan condong ringan ke depan dari PERGELANGAN KAKI, bukan dari pinggang. Membungkuk dari pinggang menutup rongga dada dan mengurangi ruang napas; badan yang terlalu tegak ke belakang membuat kaki mendarat di depan badan.',
    langkah: [
      'Bayangkan tali menarik ubun-ubun ke atas; jarak antara telinga dan bahu dijaga tetap jauh.',
      'Pandangan 20-30 meter ke depan, bukan ke ujung sepatu.',
      'Panggul netral — tulang ekor tidak menonjol ke belakang.',
      'Condong ringan datang dari seluruh badan mulai pergelangan kaki, bukan dari pinggang.',
    ],
    kesalahan: 'Menunduk melihat jam tangan berulang kali. Setiap tundukan menutup dada dan memecah irama.',
    latihan: 'Lari 30 detik sambil membayangkan membawa gelas penuh di kepala, tiap 5 menit.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132825_2647117a-d0d6-4c64-a656-30c5dfd921c7.png',
  },
  {
    id: 'kaki', nama: 'Gerakan & pendaratan kaki', emoji: '🦶', bukti: 'lemah',
    ringkas: 'Jangan diubah kalau Anda tidak sedang cedera',
    intinya: 'Sekitar tiga perempat pelari rekreasi mendarat dengan tumit lebih dulu, dan itu bukan kesalahan. Mengubah pendaratan dari tumit ke tengah/ujung kaki memindahkan beban dari lutut ke tendon Achilles dan tulang telapak kaki — menolong sebagian orang dengan nyeri lutut, tetapi menyebabkan cedera baru pada yang lain. Yang benar-benar penting bukan bagian kaki mana yang menyentuh, melainkan DI MANA kaki mendarat relatif terhadap pinggul.',
    langkah: [
      'Biarkan pendaratan Anda apa adanya kecuali ada nyeri berulang yang sudah dinilai tenaga kesehatan.',
      'Kalau memang perlu diubah, lakukan bertahap selama 8-12 pekan, tidak sekaligus.',
      'Perbaiki tempat pendaratan (lewat irama) sebelum memikirkan bagian kaki mana yang menyentuh.',
    ],
    kesalahan: 'Beralih ke pendaratan ujung kaki dalam sepekan setelah menonton satu video. Cedera tendon Achilles dan patah tulang lelah pada telapak kaki adalah akibat yang biasa.',
    latihan: 'Lari tanpa alas 4 × 30 detik di rumput yang aman — memberi umpan balik alami tanpa memaksa perubahan.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132546_46927bfd-dcb5-459e-9778-59d19c0426c3.mp4',
  },
  {
    id: 'lengan', nama: 'Gerakan lengan', emoji: '💪', bukti: 'sedang',
    ringkas: 'Mengimbangi kaki, bukan mendorong badan',
    intinya: 'Lengan tidak membuat Anda lebih cepat secara langsung; tugasnya meredam putaran badan yang ditimbulkan kaki. Ayunan yang menyilang dada memaksa badan berputar, dan pinggul ikut berputar melawannya — tenaga terbuang untuk melawan diri sendiri.',
    langkah: [
      'Siku ditekuk sekitar 90 derajat dan dijaga tetap segitu.',
      'Ayunkan dari BAHU, ke depan dan ke belakang, tanpa melewati garis tengah dada.',
      'Tangan rileks seperti memegang keripik tanpa meremukkannya.',
      'Bahu turun dan jauh dari telinga. Periksa tiap beberapa kilometer — bahu naik saat lelah.',
    ],
    kesalahan: 'Mengepal kuat dan menaikkan bahu saat lelah. Itu menghabiskan tenaga tanpa menambah kecepatan sedikit pun.',
    latihan: 'Lari 1 menit dengan tangan sengaja dibuka lemas, rasakan bedanya pada bahu.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_132546_f809197f-3183-4982-bbc3-278389826065.mp4',
  },
  {
    id: 'napas', nama: 'Pernapasan & tekniknya', emoji: '🫁', bukti: 'sedang',
    ringkas: 'Dari perut, lewat mulut, berirama',
    intinya: 'Napas dada yang dangkal memakai otot leher dan bahu — mahal dan tidak efisien. Napas diafragma (perut mengembang) memasukkan udara lebih banyak dengan tenaga lebih sedikit. Mulut boleh dan sebaiknya dipakai: hidung saja tidak cukup di atas intensitas mudah.',
    langkah: [
      'Berbaring dengan satu tangan di dada dan satu di perut; latih agar hanya tangan di perut yang naik. 5 menit sehari.',
      'Saat lari mudah, pakai pola 3:3 (tiga langkah tarik, tiga langkah buang).',
      'Saat tempo, turunkan ke 2:2. Saat interval, 2:1 atau apa pun yang terjadi sendiri.',
      'Buang napas lebih panjang dari tarikannya saat mulai panik — itu menurunkan denyut lebih cepat daripada menarik napas dalam-dalam.',
    ],
    kesalahan: 'Menahan napas tanpa sadar saat menanjak. Perhatikan ini — sangat umum dan langsung membuat kaki terasa berat.',
    latihan: 'Napas diafragma 5 menit sebelum tidur; pola 3:3 selama 10 menit pertama tiap lari mudah.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133020_bee9d699-8539-4279-ac9a-f930d423afb1.png',
  },
  {
    id: 'start', nama: 'Posisi & cara memulai', emoji: '🚦', bukti: 'kuat',
    ringkas: 'Sepuluh menit pertama menentukan sisanya',
    intinya: 'Memulai terlalu cepat adalah kesalahan paling mahal dalam lari jarak jauh, dan yang paling sering. Otot belum hangat, denyut belum menyesuaikan, dan hutang oksigen yang terbentuk di lima menit pertama harus dibayar sepanjang sisa lari.',
    langkah: [
      'Jalan cepat 3-5 menit, lalu gerakan dinamis (ayunan kaki, lunge berputar).',
      'Mulai lari 5-10 menit LEBIH LAMBAT dari pace target. Rasanya akan terlalu pelan — memang begitu seharusnya.',
      'Untuk lomba: 4-6 akselerasi pendek 20 detik sebelum start, lalu tenang.',
      'Kilometer pertama lomba sebaiknya 5-10 detik lebih lambat dari pace target, bukan lebih cepat.',
    ],
    kesalahan: 'Ikut terbawa arus massa di 500 meter pertama lomba. Hampir semua orang membayarnya di kilometer terakhir.',
    latihan: 'Latih "negative split": paruh kedua lari lebih cepat dari paruh pertama, sekali sepekan.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133020_61c28730-5b8a-433e-96f0-71dd168daeb3.png',
  },
  {
    id: 'aero', nama: 'Aerodinamis & hambatan udara', emoji: '💨', bukti: 'sedang',
    ringkas: 'Baru berarti saat cepat atau berangin',
    intinya: 'Hambatan udara naik seiring kuadrat kecepatan, jadi pada pace 6:00/km pengaruhnya kecil — sekitar 2% dari tenaga. Pada pace 3:30/km atau saat melawan angin kencang, angkanya bisa lebih dari 8%. Berlari tepat di belakang orang lain (drafting) memangkas sebagian besar dari itu, dan ini efek yang terukur, bukan perasaan.',
    langkah: [
      'Saat melawan angin, cari pelari di depan dan berlarilah sekitar satu meter di belakangnya.',
      'Pakaian yang pas badan berpengaruh; jaket longgar mengepak dan menambah hambatan.',
      'Jangan menunduk untuk "menembus angin" — itu menutup dada dan merugikan lebih banyak.',
      'Pada lari mudah, abaikan sepenuhnya. Tenaga Anda lebih baik dipakai untuk hal lain.',
    ],
    kesalahan: 'Memikirkan aerodinamis pada lari santai. Pada kecepatan itu, postur dan napas jauh lebih berpengaruh.',
    latihan: 'Saat berangin, jadikan arah pulang melawan angin — Anda sudah hangat dan bisa merasakan bedanya.',
    gambar: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_133225_8f375cc1-a8a3-435d-9335-c0ef2d519ea1.png',
  },
]

export interface Fisiologi {
  id: string
  judul: string
  emoji: string
  pertanyaan: string
  jawaban: string
  aturan: string[]
}

export const FISIOLOGI: Fisiologi[] = [
  {
    id: 'kuantitas', judul: 'Kuantitas — berapa banyak', emoji: '📊',
    pertanyaan: 'Berapa kilometer sepekan?',
    jawaban: 'Volume adalah pendorong tunggal terbesar bagi daya tahan: ia menambah jumlah kapiler, mitokondria, dan enzim aerobik di otot. Tetapi adaptasi itu berlangsung di jaringan yang beradaptasi dengan kecepatan berbeda — jantung dan paru menyesuaikan dalam pekan, tendon dan tulang dalam bulan. Cedera lari hampir selalu datang dari selisih kecepatan adaptasi itu, bukan dari volume tinggi itu sendiri.',
    aturan: [
      'Naikkan total pekanan maksimal 10% dari pekan sebelumnya, dan tidak setiap pekan.',
      'Tiap pekan keempat, turunkan volume 20-30%. Adaptasi terjadi di pekan ringan itu, bukan di pekan beratnya.',
      'Satu lari panjang tidak boleh melebihi 30-35% total pekanan.',
      'Tambah jumlah sesi sebelum menambah jarak per sesi.',
    ],
  },
  {
    id: 'kualitas', judul: 'Kualitas — seberapa keras', emoji: '🔥',
    pertanyaan: 'Berapa banyak sesi keras?',
    jawaban: 'Pelari yang berlatih paling banyak justru menjalankan sekitar 80% larinya pada intensitas mudah — cukup pelan untuk bisa berbicara satu kalimat penuh. Sisanya yang 20% dijalankan benar-benar keras. Yang merugikan adalah zona tengah: cukup keras untuk melelahkan, tidak cukup keras untuk memicu adaptasi kecepatan. Kebanyakan pelari rekreasi menghabiskan sebagian besar waktunya di sana.',
    aturan: [
      'Maksimal dua sesi kualitas per pekan, apa pun tingkat Anda.',
      'Lari mudah harus terasa TERLALU mudah. Kalau tidak, itu bukan lari mudah.',
      'Jangan dua sesi keras berturut-turut. Beri jarak minimal 48 jam.',
      'Kalau ragu antara mudah dan sedang, pilih mudah.',
    ],
  },
  {
    id: 'durasi', judul: 'Durasi — berapa lama',  emoji: '⏱️',
    pertanyaan: 'Seberapa panjang lari panjangnya?',
    jawaban: 'Lari panjang melatih hal yang tidak bisa dilatih sesi pendek: kemampuan membakar lemak sebagai bahan bakar, ketahanan tendon, dan kesiapan mental menghadapi jam-jam terakhir. Tetapi manfaatnya datang dari WAKTU DI KAKI, bukan dari jarak — jadi untuk pelari lambat, patokan waktu lebih tepat daripada patokan kilometer.',
    aturan: [
      'Mulai dari 60-75 menit, naikkan 10 menit tiap dua pekan.',
      'Untuk maraton, sesi terpanjang 2,5-3 jam sudah cukup; lebih dari itu menambah kelelahan lebih cepat daripada menambah kebugaran.',
      'Jalankan pada pace mudah, bukan pace lomba. Lari panjang yang terlalu cepat merusak sesi kualitas pekan itu.',
      'Isi bahan bakar setelah 75 menit: 30-60 gram karbohidrat per jam.',
    ],
  },
  {
    id: 'pemulihan', judul: 'Pemulihan — kapan adaptasi terjadi', emoji: '😴',
    pertanyaan: 'Kenapa tidak membaik meski rajin?',
    jawaban: 'Latihan hanya memberi rangsangan; kebugarannya dibangun saat Anda tidur. Kurang tidur menurunkan sintesis protein otot, menaikkan hormon stres, dan memperpanjang waktu pulih. Menambah sesi sambil memotong jam tidur hampir selalu memberi hasil lebih buruk daripada berlatih lebih sedikit dengan tidur cukup.',
    aturan: [
      'Tidur 7-9 jam. Ini bagian dari program latihan, bukan pelengkapnya.',
      'Nyeri otot yang belum hilang setelah 72 jam berarti sesi sebelumnya terlalu berat.',
      'Denyut istirahat yang naik 5+ bpm dari biasanya adalah tanda untuk memilih sesi ringan.',
      'Satu pekan libur total setiap 12-16 pekan tidak menghilangkan kebugaran — ia memulihkan tendon.',
    ],
  },
]

export const RUJUKAN_LARI = [
  'Schubert AG, Kempf J, Heiderscheit BC. Influence of stride frequency and length on running mechanics. Sports Health. 2014;6(3):210-217.',
  'Anderson LM, dkk. What are the benefits and risks associated with changing foot strike pattern during running? Sports Med. 2020;50(5):885-917.',
  'Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform. 2010;5(3):276-291.',
  'Nielsen RO, dkk. Training errors and running related injuries: a systematic review. Int J Sports Phys Ther. 2012;7(1):58-75.',
  'Pugh LGCE. The influence of wind resistance in running and walking. J Physiol. 1971;213(2):255-276.',
]
