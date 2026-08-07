// ─────────────────────────────────────────────────────────────────────────────
// Peregangan — protokol per situasi, bukan satu daftar untuk semua.
//
// Satu hal yang perlu diluruskan lebih dulu, karena hampir semua orang salah:
// peregangan STATIS sebelum latihan (menahan posisi 30 detik atau lebih)
// menurunkan tenaga dan kekuatan sementara, dan tidak menurunkan risiko cedera.
// Yang sebelum latihan seharusnya DINAMIS — gerakan yang membawa sendi melewati
// rentang geraknya berulang kali. Peregangan statis punya tempatnya sendiri:
// setelah latihan, atau sebagai sesi terpisah untuk menambah rentang gerak.
//
// Karena itu daftar di bawah dipisah menurut KAPAN, bukan menurut otot. Orang
// tidak salah memilih otot; mereka salah memilih waktu.
// ─────────────────────────────────────────────────────────────────────────────

export type Kapan = 'sebelum' | 'sesudah' | 'harian' | 'yoga'

export interface Gerakan {
  id: string
  nama: string
  kapan: Kapan
  target: string
  durasi: string
  cara: string[]
  untuk: string[]      // cabang olahraga / situasi
  hindari?: string
  video?: string       // URL klip demonstrasi, bila ada
}

export const GERAKAN: Gerakan[] = [
  // ── Sebelum latihan: dinamis ──────────────────────────────────────────────
  {
    id: 'ayun-kaki', nama: 'Ayunan kaki', kapan: 'sebelum', target: 'Pinggul, hamstring, fleksor pinggul',
    durasi: '10-15 ayunan per kaki, per arah',
    cara: [
      'Berpegangan pada dinding atau tiang dengan satu tangan.',
      'Ayunkan satu kaki lurus ke depan dan ke belakang, terkendali — bukan dilempar.',
      'Badan tetap tegak dan diam; yang bergerak hanya kaki dari pinggul.',
      'Ulangi menyamping (ayunan kiri-kanan di depan badan) untuk adduktor.',
    ],
    untuk: ['Lari', 'Sepeda', 'Sepak bola', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f1f25333-8ce5-4225-88c2-f44fc4068096.mp4',
    hindari: 'Jangan mengayun sekuat mungkin di ayunan pertama. Tambah amplitudonya bertahap.',
  },
  {
    id: 'lunge-rotasi', nama: "World's greatest stretch", kapan: 'sebelum', target: 'Fleksor pinggul, tulang punggung dada, hamstring',
    durasi: '5 kali per sisi',
    cara: [
      'Melangkah lunge panjang ke depan, kaki belakang lurus.',
      'Taruh telapak tangan sisi dalam di lantai, sejajar telapak kaki depan.',
      'Putar badan dan raih lengan sisi luar lurus ke atap, pandangan ikut tangan.',
      'Tahan sebentar di puncak, lalu turun dan ganti sisi.',
    ],
    untuk: ['Lari', 'Angkat beban', 'CrossFit', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_b9b74010-a0d6-42d0-b66f-e48c2990ab73.mp4',
    hindari: 'Kalau lutut belakang nyeri, taruh di atas alas — bukan alasan untuk berhenti.',
  },
  {
    id: 'squat-dalam', nama: 'Squat dalam dengan tahanan', kapan: 'sebelum', target: 'Pergelangan kaki, pinggul, punggung bawah',
    durasi: '5 kali, tahan 5 detik',
    cara: [
      'Turun ke squat sedalam mungkin dengan tumit tetap menempel lantai.',
      'Siku di sisi dalam lutut, dorong lutut ke luar perlahan.',
      'Dada dijaga tetap terangkat.',
      'Berdiri, ulangi. Kedalaman biasanya bertambah tiap pengulangan.',
    ],
    untuk: ['Angkat beban', 'CrossFit', 'Umum'],
  },
  {
    id: 'lengan-renang', nama: 'Putaran lengan & tarikan bahu', kapan: 'sebelum', target: 'Bahu, dada, punggung atas',
    durasi: '10 putaran tiap arah',
    cara: [
      'Putar kedua lengan besar-besar ke depan, lalu ke belakang.',
      'Lanjutkan dengan menarik siku ke belakang, tulang belikat dirapatkan.',
      'Akhiri dengan meniru gerakan tarikan renang perlahan di udara.',
    ],
    untuk: ['Renang', 'Angkat beban', 'Umum'],
    hindari: 'Kalau bahu pernah dislokasi atau ada nyeri saat mengangkat lengan, konsultasikan dulu.',
  },
  // ── Sesudah latihan: statis ───────────────────────────────────────────────
  {
    id: 'fleksor-pinggul', nama: 'Peregangan fleksor pinggul berlutut', kapan: 'sesudah', target: 'Psoas, rektus femoris',
    durasi: 'Tahan 30-45 detik per sisi',
    cara: [
      'Berlutut satu kaki, kaki depan menapak di depan.',
      'Selipkan panggul ke bawah (seperti menarik tulang ekor ke depan) — inilah kuncinya.',
      'Badan tetap tegak, jangan condong ke depan.',
      'Angkat lengan sisi lutut yang di bawah untuk memperdalam.',
    ],
    untuk: ['Lari', 'Sepeda', 'Kerja duduk lama'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054631_f35cc36c-7c28-404f-8501-6bc49021ee28.mp4',
    hindari: 'Jangan mendorong panggul maju tanpa menyelipkannya — itu hanya melengkungkan punggung bawah.',
  },
  {
    id: 'hamstring-duduk', nama: 'Peregangan hamstring', kapan: 'sesudah', target: 'Hamstring, betis',
    durasi: 'Tahan 30 detik per sisi',
    cara: [
      'Duduk, satu kaki lurus, kaki lain ditekuk ke dalam.',
      'Engsel dari PINGGUL, bukan dari punggung — dada menuju lutut.',
      'Punggung tetap lurus; kalau membulat, Anda meregangkan punggung bawah, bukan hamstring.',
      'Napas keluar saat memperdalam.',
    ],
    untuk: ['Lari', 'Sepeda', 'Umum'],
  },
  {
    id: 'betis-dinding', nama: 'Peregangan betis di dinding', kapan: 'sesudah', target: 'Gastrocnemius, soleus',
    durasi: '30 detik lutut lurus + 30 detik lutut tertekuk, per sisi',
    cara: [
      'Kedua tangan di dinding, satu kaki mundur, tumit menempel lantai.',
      'Lutut belakang LURUS meregangkan gastrocnemius.',
      'Lalu tekuk sedikit lutut belakang, tumit tetap menempel — ini mengenai soleus.',
      'Keduanya perlu; kebanyakan orang hanya melakukan yang pertama.',
    ],
    untuk: ['Lari', 'Umum'],
  },
  {
    id: 'piriformis', nama: 'Peregangan gluteus & piriformis', kapan: 'sesudah', target: 'Gluteus, piriformis',
    durasi: 'Tahan 30 detik per sisi',
    cara: [
      'Berbaring telentang, silangkan pergelangan kaki di atas lutut sisi lain (angka 4).',
      'Tarik paha kaki bawah ke arah dada.',
      'Kepala dan bahu tetap rileks di lantai.',
    ],
    untuk: ['Lari', 'Sepeda', 'Kerja duduk lama'],
  },
  {
    id: 'dada-pintu', nama: 'Peregangan dada di kusen pintu', kapan: 'sesudah', target: 'Pektoralis, bahu depan',
    durasi: 'Tahan 30 detik, 2-3 kali',
    cara: [
      'Lengan bawah menempel kusen pintu, siku setinggi bahu.',
      'Melangkah maju perlahan sampai terasa tarikan di dada.',
      'Ulangi dengan siku lebih tinggi dan lebih rendah untuk serat yang berbeda.',
    ],
    untuk: ['Renang', 'Angkat beban', 'Kerja duduk lama'],
  },
  // ── Harian / postur ───────────────────────────────────────────────────────
  {
    id: 'rotasi-toraks', nama: 'Rotasi tulang punggung dada', kapan: 'harian', target: 'Tulang punggung dada',
    durasi: '8-10 kali per sisi',
    cara: [
      'Posisi merangkak, satu tangan di belakang kepala.',
      'Putar siku ke bawah menuju pergelangan tangan sisi lain.',
      'Lalu buka ke atas menuju atap, ikuti dengan pandangan.',
      'Panggul dijaga tetap menghadap lantai — kalau ikut berputar, gerakannya tidak kena sasaran.',
    ],
    untuk: ['Kerja duduk lama', 'Renang', 'Angkat beban', 'Umum'],
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_054839_9a901a97-ac23-4891-93de-5c0185f558b5.mp4',
  },
  {
    id: 'leher-dagu', nama: 'Tarikan dagu & peregangan leher', kapan: 'harian', target: 'Leher dalam, upper trapezius',
    durasi: '10 tarikan + tahan 30 detik per sisi',
    cara: [
      'Tarik dagu lurus ke belakang (membuat "dagu ganda"), tahan 3 detik, lepas.',
      'Lalu miringkan kepala ke satu sisi, tangan sisi itu menarik lembut.',
      'Bahu sisi berlawanan ditekan ke bawah.',
    ],
    untuk: ['Kerja duduk lama', 'Umum'],
    hindari: 'Jangan memutar leher penuh melingkar — gerakan itu menekan sendi facet tanpa manfaat tambahan.',
  },
  {
    id: 'kucing-sapi', nama: 'Kucing-sapi', kapan: 'harian', target: 'Seluruh tulang belakang',
    durasi: '10 siklus, mengikuti napas',
    cara: [
      'Posisi merangkak.',
      'Tarik napas: turunkan perut, angkat dada dan tulang ekor.',
      'Buang napas: bulatkan punggung, tarik dagu ke dada.',
      'Gerakannya lambat dan mengikuti napas, bukan dikejar jumlahnya.',
    ],
    untuk: ['Kerja duduk lama', 'Umum'],
  },
  // ── Yoga & pilates ────────────────────────────────────────────────────────
  {
    id: 'anjing-menunduk', nama: 'Downward dog', kapan: 'yoga', target: 'Rantai posterior menyeluruh',
    durasi: 'Tahan 30-60 detik',
    cara: [
      'Dari merangkak, dorong pinggul ke atas dan belakang membentuk segitiga.',
      'Lutut boleh ditekuk — punggung lurus lebih penting daripada kaki lurus.',
      'Dorong lantai menjauh lewat telapak tangan; telinga sejajar lengan.',
    ],
    untuk: ['Yoga', 'Lari', 'Umum'],
  },
  {
    id: 'merpati', nama: 'Pigeon pose', kapan: 'yoga', target: 'Rotator pinggul luar',
    durasi: 'Tahan 60-90 detik per sisi',
    cara: [
      'Dari posisi plank, bawa satu lutut ke depan di belakang pergelangan tangan sisi sama.',
      'Kaki belakang lurus ke belakang.',
      'Turunkan badan ke depan sejauh yang nyaman.',
    ],
    untuk: ['Yoga', 'Lari', 'Sepeda'],
    hindari: 'Kalau lutut depan terasa nyeri (bukan pinggul), keluar dari posisi. Ini posisi yang paling sering membebani lutut secara salah.',
  },
  {
    id: 'gulung-pilates', nama: 'Roll down pilates', kapan: 'yoga', target: 'Kontrol tulang belakang, hamstring',
    durasi: '5-8 kali',
    cara: [
      'Berdiri tegak, kaki selebar pinggul.',
      'Turunkan dagu, lalu gulung tulang belakang ke bawah satu ruas demi satu ruas.',
      'Gantung sebentar di bawah, lalu gulung naik dengan cara yang sama.',
      'Perut tetap aktif sepanjang gerakan.',
    ],
    untuk: ['Pilates', 'Kerja duduk lama', 'Umum'],
  },
]

export interface Protokol {
  id: string
  nama: string
  ikon: string
  ringkas: string
  urutan: string[]   // id gerakan
  durasiTotal: string
  catatan: string
}

export const PROTOKOL: Protokol[] = [
  {
    id: 'pra-lari', nama: 'Sebelum lari', ikon: '🏃', ringkas: 'Dinamis, 5-6 menit',
    urutan: ['ayun-kaki', 'lunge-rotasi', 'squat-dalam'],
    durasiTotal: '5-6 menit',
    catatan: 'Lalu mulai lari dengan 5-10 menit sangat mudah sebagai pemanasan lanjutan. Jangan lakukan peregangan statis di sini.',
  },
  {
    id: 'pasca-lari', nama: 'Sesudah lari', ikon: '🧘', ringkas: 'Statis, 6-8 menit',
    urutan: ['fleksor-pinggul', 'hamstring-duduk', 'betis-dinding', 'piriformis'],
    durasiTotal: '6-8 menit',
    catatan: 'Waktu terbaik untuk peregangan statis: otot sudah hangat, dan tidak ada tenaga yang perlu dijaga.',
  },
  {
    id: 'pra-angkat', nama: 'Sebelum angkat beban', ikon: '🏋️', ringkas: 'Dinamis, 6-8 menit',
    urutan: ['squat-dalam', 'lunge-rotasi', 'lengan-renang', 'rotasi-toraks'],
    durasiTotal: '6-8 menit',
    catatan: 'Lanjutkan dengan set pemanasan memakai beban ringan pada gerakan yang akan dilatih.',
  },
  {
    id: 'renang', nama: 'Sebelum renang', ikon: '🏊', ringkas: 'Bahu & punggung atas, 5 menit',
    urutan: ['lengan-renang', 'rotasi-toraks', 'dada-pintu'],
    durasiTotal: '5 menit',
    catatan: 'Renang menuntut rotasi bahu berulang ribuan kali. Punggung atas yang kaku memaksa bahu menutupi kekurangannya.',
  },
  {
    id: 'sepeda', nama: 'Sesudah bersepeda', ikon: '🚴', ringkas: 'Fokus pinggul, 6 menit',
    urutan: ['fleksor-pinggul', 'piriformis', 'hamstring-duduk', 'rotasi-toraks'],
    durasiTotal: '6 menit',
    catatan: 'Posisi bersepeda mengunci pinggul dalam keadaan tertekuk berjam-jam. Fleksor pinggul adalah prioritas utamanya.',
  },
  {
    id: 'meja', nama: 'Jeda kerja duduk', ikon: '💺', ringkas: 'Postur, 4 menit',
    urutan: ['leher-dagu', 'rotasi-toraks', 'dada-pintu', 'fleksor-pinggul'],
    durasiTotal: '4 menit',
    catatan: 'Lakukan tiap 2-3 jam. Sesi pendek yang sering jauh lebih berguna daripada satu sesi panjang di akhir hari.',
  },
  {
    id: 'pagi', nama: 'Bangun tidur', ikon: '🌅', ringkas: 'Lembut, 5 menit',
    urutan: ['kucing-sapi', 'rotasi-toraks', 'gulung-pilates', 'anjing-menunduk'],
    durasiTotal: '5 menit',
    catatan: 'Cakram tulang belakang paling banyak menyerap cairan saat tidur, jadi hindari membungkuk penuh berbeban di jam pertama setelah bangun.',
  },
]

export const SALAH_KAPRAH = [
  {
    klaim: 'Peregangan statis sebelum olahraga mencegah cedera.',
    fakta: 'Tinjauan sistematis tidak menemukan penurunan risiko cedera, dan menahan peregangan lebih dari 60 detik sebelum aktivitas justru menurunkan tenaga dan kekuatan sementara. Yang menurunkan risiko cedera adalah pemanasan bertahap dan latihan kekuatan yang teratur.',
  },
  {
    klaim: 'Peregangan menghilangkan nyeri otot setelah latihan (DOMS).',
    fakta: 'Efeknya sangat kecil sampai tidak berarti — sekitar satu poin pada skala 100. Peregangan tetap berguna untuk rentang gerak dan rasa nyaman, hanya saja bukan untuk itu.',
  },
  {
    klaim: 'Sakit berarti berhasil.',
    fakta: 'Peregangan seharusnya terasa tertarik, bukan tajam atau menusuk. Nyeri tajam, kesemutan atau baal berarti berhenti — itu tanda saraf, bukan otot.',
  },
  {
    klaim: 'Kalau kurang lentur, berarti kurang meregang.',
    fakta: 'Rentang gerak juga dibatasi struktur sendi dan toleransi sistem saraf. Sebagian keterbatasan tidak bisa diregangkan hilang, dan memaksanya justru membebani sendi.',
  },
]

export const RUJUKAN_PEREGANGAN = [
  'Behm DG, dkk. Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals. Appl Physiol Nutr Metab. 2016;41(1):1-11.',
  'Herbert RD, de Noronha M, Kamper SJ. Stretching to prevent or reduce muscle soreness after exercise. Cochrane Database Syst Rev. 2011;(7):CD004577.',
  'ACSM. Guidelines for Exercise Testing and Prescription, edisi ke-11, 2021 — bab fleksibilitas dan rentang gerak.',
  'Lauersen JB, dkk. The effectiveness of exercise interventions to prevent sports injuries. Br J Sports Med. 2014;48(11):871-877.',
]
