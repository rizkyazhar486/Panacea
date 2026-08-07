// ─────────────────────────────────────────────────────────────────────────────
// CrossFit — format latihan, benchmark, penskalaan dan batas keamanan.
//
// Halaman ini mengajarkan FORMAT-nya, bukan menyuruh Anda menyelesaikan angka
// tertentu. Alasannya medis, bukan gaya bahasa: format CrossFit yang bervolume
// tinggi dan berbasis waktu adalah salah satu penyebab rabdomiolisis olahraga
// yang paling sering dilaporkan pada pemula, karena format "sebanyak mungkin
// dalam 20 menit" secara harfiah memberi hadiah pada mengabaikan sinyal berhenti.
// Karena itu penskalaan dan batas berhenti ditulis sejajar dengan workout-nya,
// bukan sebagai catatan kaki.
//
// Soal nama: "Girls" dan "Hero WOD" adalah benchmark bernama milik CrossFit
// Inc. yang sudah lama beredar umum. Yang dimuat di sini adalah daftar gerakan
// dan repetisinya — fakta yang bisa diverifikasi — bukan salinan materi kursus
// berbayar mereka.
//
// Hero WOD dinamai dari anggota militer dan petugas penyelamat yang gugur.
// Halaman ini menyebutkan itu, karena memakai namanya sebagai sekadar "workout
// berat" tanpa tahu asalnya adalah hal yang pantas dihindari.
// ─────────────────────────────────────────────────────────────────────────────

export interface Format {
  id: string
  nama: string
  kepanjangan: string
  singkat: string
  caraKerja: string
  bagusUntuk: string
  jebakan: string
  contoh: string
}

export const FORMAT: Format[] = [
  {
    id: 'amrap',
    nama: 'AMRAP',
    kepanjangan: 'As Many Rounds/Reps As Possible',
    singkat: 'Waktu tetap, kerja sebanyak mungkin.',
    caraKerja: 'Waktu dipatok (mis. 20 menit). Anda mengulang rangkaian gerakan terus-menerus dan menghitung berapa ronde plus repetisi yang selesai. Skornya jumlah ronde.',
    bagusUntuk: 'Melatih pacing. Karena jamnya tidak berhenti, AMRAP jujur memperlihatkan apakah Anda memulai terlalu cepat.',
    jebakan: 'Mudah berubah jadi lomba melawan orang di sebelah. Ronde pertama yang terlalu cepat hampir selalu membuat total akhir lebih rendah, bukan lebih tinggi.',
    contoh: 'Cindy — 20 menit: 5 pull-up, 10 push-up, 15 air squat.',
  },
  {
    id: 'fortime',
    nama: 'For Time',
    kepanjangan: 'Selesaikan secepat mungkin',
    singkat: 'Kerja tetap, waktu sebagai skor.',
    caraKerja: 'Jumlah repetisi sudah ditentukan. Skornya waktu yang Anda butuhkan untuk menyelesaikannya.',
    bagusUntuk: 'Perbandingan antarwaktu yang bersih — beban dan repetisi sama, jadi waktunya berarti.',
    jebakan: 'Format paling sering dikaitkan dengan cedera pada pemula, karena teknik yang rusak tetap "dihitung" selama repetisinya selesai.',
    contoh: 'Fran — 21-15-9 thruster & pull-up, secepat mungkin.',
  },
  {
    id: 'emom',
    nama: 'EMOM',
    kepanjangan: 'Every Minute On the Minute',
    singkat: 'Kerja di awal tiap menit, sisanya istirahat.',
    caraKerja: 'Tiap menit Anda mengerjakan sejumlah repetisi, lalu istirahat sampai menit berikutnya. Makin cepat Anda selesai, makin panjang istirahatnya.',
    bagusUntuk: 'Format paling AMAN untuk pemula. Istirahatnya terstruktur, jadi teknik tidak runtuh, dan intensitasnya bisa diatur tepat.',
    jebakan: 'Kalau repetisinya kebanyakan sampai istirahat tinggal beberapa detik, EMOM berubah jadi kerja terus-menerus dan kehilangan gunanya.',
    contoh: 'EMOM 12 menit: menit ganjil 10 kettlebell swing, menit genap 8 burpee.',
  },
  {
    id: 'tabata',
    nama: 'Tabata',
    kepanjangan: '20 detik kerja / 10 detik istirahat × 8',
    singkat: 'Empat menit interval sangat pendek.',
    caraKerja: 'Delapan putaran 20 detik kerja maksimal dan 10 detik istirahat, total empat menit per gerakan. Skornya repetisi TERENDAH dari delapan putaran.',
    bagusUntuk: 'Waktu sangat terbatas. Skor "putaran terendah" cerdas: ia menghukum ledakan awal yang tidak bisa dipertahankan.',
    jebakan: 'Protokol Tabata asli (Tabata 1996) memakai sepeda ergometer pada ±170% VO₂max — versi bodyweight-nya bukan hal yang sama dan tidak boleh diklaim memberi hasil yang sama.',
    contoh: 'Tabata air squat, lalu Tabata push-up.',
  },
  {
    id: 'chipper',
    nama: 'Chipper',
    kepanjangan: 'Daftar panjang, sekali lewat',
    singkat: 'Banyak gerakan, tidak diulang.',
    caraKerja: 'Sederet gerakan dengan repetisi besar, dikerjakan berurutan sampai habis, tanpa ronde.',
    bagusUntuk: 'Ketahanan mental dan variasi gerakan dalam satu sesi.',
    jebakan: 'Volume totalnya besar. Chipper adalah format yang paling perlu dipangkas untuk pemula — potong semua repetisi setengahnya dulu.',
    contoh: '100 double-under, 80 sit-up, 60 lunge, 40 push-up, 20 burpee.',
  },
  {
    id: 'couplet',
    nama: 'Couplet & Triplet',
    kepanjangan: 'Dua atau tiga gerakan berselang',
    singkat: 'Struktur paling umum di CrossFit.',
    caraKerja: 'Dua (couplet) atau tiga (triplet) gerakan diselang-seling. Biasanya dipasangkan agar otot yang dipakai berbeda, sehingga satu gerakan "mengistirahatkan" yang lain.',
    bagusUntuk: 'Intensitas tinggi tanpa satu kelompok otot menyerah lebih dulu dari sistem jantung-paru.',
    jebakan: 'Pasangan yang buruk (mis. dua gerakan tarik) membuat sesi berhenti karena genggaman habis, bukan karena napas.',
    contoh: 'Helen (triplet) — 3 ronde: lari 400 m, 21 kettlebell swing, 12 pull-up.',
  },
  {
    id: 'ladder',
    nama: 'Ladder',
    kepanjangan: 'Repetisi naik atau turun bertahap',
    singkat: 'Angka berubah tiap ronde.',
    caraKerja: 'Repetisi naik (1, 2, 3, …) atau turun (21-15-9). Tangga turun terasa makin ringan justru saat Anda makin lelah.',
    bagusUntuk: 'Membuat sesi tetap bisa diselesaikan meski kelelahan menumpuk.',
    jebakan: 'Tangga naik tanpa batas waktu bisa berlanjut jauh melewati titik teknik rusak.',
    contoh: '21-15-9 dan "death by burpee" (tambah satu repetisi tiap menit sampai gagal).',
  },
  {
    id: 'hyrox',
    nama: 'HYROX',
    kepanjangan: 'Lomba kebugaran terstandar',
    singkat: '8 × 1 km lari diselingi 8 stasiun.',
    caraKerja: 'Berbeda dari CrossFit: urutannya SAMA di setiap lomba di dunia — lari 1 km, satu stasiun, ulangi delapan kali. Stasiunnya ski erg, sled push, sled pull, burpee broad jump, rowing, farmers carry, sandbag lunge, wall ball.',
    bagusUntuk: 'Orang yang ingin membandingkan diri secara adil antarwaktu dan antarkota, dan yang lebih suka daya tahan daripada gerakan barbel teknis.',
    jebakan: 'Porsi larinya delapan kilometer. Banyak yang berlatih stasiunnya dan melupakan bahwa lomba ini sebagian besarnya adalah lari.',
    contoh: 'Simulasi separuh: 4 × (lari 1 km + satu stasiun).',
  },
]

export interface Benchmark {
  nama: string
  kelompok: 'girls' | 'hero' | 'pemula'
  format: string
  isi: string[]
  bebanRx?: string
  targetWaktu: string
  bodyweight: boolean
  skala: string
  catatan?: string
}

export const BENCHMARK: Benchmark[] = [
  // ── Bodyweight, cocok dipelajari lebih dulu ───────────────────────────────
  {
    nama: 'Cindy', kelompok: 'girls', format: 'AMRAP 20 menit', bodyweight: true,
    isi: ['5 pull-up', '10 push-up', '15 air squat'],
    targetWaktu: 'Pemula 8-12 ronde · menengah 15-20 · mahir 20+',
    skala: 'Pull-up jadi ring row atau band-assisted; push-up dari lutut atau miring pada kotak. Kalau ronde pertama butuh lebih dari 90 detik, turunkan repetisinya jadi 3-6-9.',
    catatan: 'Benchmark bodyweight paling terkenal dan titik masuk terbaik: tidak ada barbel, tidak ada teknik olimpik.',
  },
  {
    nama: 'Mary', kelompok: 'girls', format: 'AMRAP 20 menit', bodyweight: true,
    isi: ['5 handstand push-up', '10 pistol (squat satu kaki)', '15 pull-up'],
    targetWaktu: 'Pemula jarang Rx — 5-8 ronde sudah bagus',
    skala: 'Handstand push-up jadi pike push-up di kotak; pistol jadi squat satu kaki ke bangku dengan pegangan.',
    catatan: 'Terlihat seperti Cindy tetapi jauh lebih teknis. Butuh mobilitas bahu dan pergelangan kaki yang sudah siap.',
  },
  {
    nama: 'Angie', kelompok: 'girls', format: 'For Time', bodyweight: true,
    isi: ['100 pull-up', '100 push-up', '100 sit-up', '100 air squat'],
    targetWaktu: 'Pemula 25-35 mnt · menengah 18-22 · mahir <15',
    skala: 'Versi "Half Angie" (50 tiap gerakan) adalah titik masuk yang jujur. Semua gerakan diselesaikan sebelum lanjut.',
    catatan: 'Volume 400 repetisi. Ini termasuk sesi berisiko rabdomiolisis pada orang yang belum terbiasa — lihat peringatan di bawah.',
  },
  {
    nama: 'Barbara', kelompok: 'girls', format: '5 ronde, istirahat 3 menit', bodyweight: true,
    isi: ['20 pull-up', '30 push-up', '40 sit-up', '50 air squat', 'istirahat 3 menit penuh'],
    targetWaktu: 'Tiap ronde 5-7 menit; total 35-50 menit',
    skala: 'Kurangi jadi 3 ronde atau setengahkan repetisinya. Istirahat 3 menit WAJIB diambil penuh — itu bagian dari desainnya.',
    catatan: 'Istirahat terjadwal membuat setiap ronde bisa dikerjakan cepat. Membandingkan waktu antarronde memperlihatkan daya tahan Anda dengan sangat jujur.',
  },
  {
    nama: 'Chelsea', kelompok: 'girls', format: 'EMOM 30 menit', bodyweight: true,
    isi: ['Tiap menit: 5 pull-up, 10 push-up, 15 air squat'],
    targetWaktu: 'Selesai berapa menit sebelum tertinggal — 15 menit sudah bagus untuk pemula',
    skala: 'Jadikan E2MOM (tiap dua menit) atau potong jadi 3-6-9. Berhenti saat Anda tidak lagi selesai dalam satu menit.',
    catatan: 'Cindy versi EMOM. Volumenya sama besar dengan Angie — perlakukan dengan hormat yang sama.',
  },
  {
    nama: 'Annie', kelompok: 'girls', format: 'For Time (50-40-30-20-10)', bodyweight: true,
    isi: ['Double-under', 'Sit-up'],
    targetWaktu: 'Pemula 12-18 mnt · mahir <7',
    skala: 'Double-under jadi single-under dengan repetisi ganda (100-80-60-40-20) — bukan setengahnya.',
    catatan: 'Bagus untuk belajar double-under, karena kelelahannya rendah dan pengulangannya banyak.',
  },
  // ── Melibatkan beban ──────────────────────────────────────────────────────
  {
    nama: 'Fran', kelompok: 'girls', format: 'For Time (21-15-9)', bodyweight: false,
    isi: ['Thruster', 'Pull-up'], bebanRx: '43 kg pria / 30 kg wanita',
    targetWaktu: 'Pemula 8-12 mnt · menengah 5-7 · elite <3',
    skala: 'Turunkan beban sampai set 21 bisa dikerjakan dalam maksimal dua set. Kalau harus dipecah lebih dari itu, bebannya terlalu berat untuk tujuan sesi ini.',
    catatan: 'Benchmark paling terkenal. Justru karena pendek, godaan memakai beban terlalu berat paling besar di sini.',
  },
  {
    nama: 'Helen', kelompok: 'girls', format: '3 ronde For Time', bodyweight: false,
    isi: ['Lari 400 m', '21 kettlebell swing', '12 pull-up'], bebanRx: 'KB 24 kg / 16 kg',
    targetWaktu: 'Pemula 14-18 mnt · menengah 10-12 · mahir <9',
    skala: 'Lari jadi 200-300 m; kettlebell diturunkan agar 21 ayunan bisa tanpa berhenti.',
    catatan: 'Triplet dengan keseimbangan bagus antara lari, tarik dan engsel pinggul.',
  },
  {
    nama: 'Grace', kelompok: 'girls', format: 'For Time', bodyweight: false,
    isi: ['30 clean & jerk'], bebanRx: '61 kg / 43 kg',
    targetWaktu: 'Pemula 6-10 mnt · mahir <3',
    skala: 'Pakai beban yang bisa Anda angkat 10 kali berturut-turut saat segar — biasanya jauh lebih ringan dari perkiraan.',
    catatan: 'Gerakan olimpik tunggal berulang. JANGAN dikerjakan sebelum teknik clean & jerk Anda dinilai pelatih.',
  },
  {
    nama: 'Karen', kelompok: 'girls', format: 'For Time', bodyweight: false,
    isi: ['150 wall ball'], bebanRx: '9 kg ke target 3 m / 6 kg ke 2,7 m',
    targetWaktu: 'Pemula 12-18 mnt · mahir <7',
    skala: 'Turunkan jadi 100 atau 75 repetisi sebelum menurunkan beban bolanya.',
    catatan: 'Sederhana dan brutal. Nyeri otot paha depan setelahnya biasanya berlangsung beberapa hari.',
  },
  // ── Hero WOD ──────────────────────────────────────────────────────────────
  {
    nama: 'Murph', kelompok: 'hero', format: 'For Time', bodyweight: false,
    isi: ['Lari 1,6 km', '100 pull-up', '200 push-up', '300 air squat', 'Lari 1,6 km'],
    bebanRx: 'Dengan rompi 9 kg / 6 kg',
    targetWaktu: 'Pemula 55-75 mnt · menengah 40-50 · mahir <35',
    skala: 'Tanpa rompi, pecah jadi 20 ronde 5-10-15, dan potong separuh ("Half Murph") pada percobaan pertama. Ini sesi yang paling sering menyebabkan rabdomiolisis dalam setahun.',
    catatan: 'Dinamai Letnan Michael Murphy, Navy SEAL yang gugur di Afghanistan 2005. Biasa dikerjakan saat Memorial Day.',
  },
  {
    nama: 'Chad', kelompok: 'hero', format: 'For Time', bodyweight: true,
    isi: ['1000 box step-up (kotak 50 cm)'], bebanRx: 'Ransel 20 kg / 14 kg',
    targetWaktu: '60-100 menit',
    skala: 'Tanpa ransel, kotak lebih rendah, dan 500 repetisi untuk percobaan pertama.',
    catatan: 'Dinamai Chad Wilkinson, Navy SEAL yang meninggal karena bunuh diri pada 2018; sesi ini digunakan untuk penggalangan kesadaran pencegahan bunuh diri di kalangan veteran.',
  },
  {
    nama: 'JT', kelompok: 'hero', format: 'For Time (21-15-9)', bodyweight: true,
    isi: ['Handstand push-up', 'Ring dip', 'Push-up'],
    targetWaktu: 'Pemula 15-25 mnt · mahir <8',
    skala: 'Pike push-up, bench dip, push-up lutut. Tangga turun membantu — bagian tersulit ada di awal.',
    catatan: 'Dinamai Petty Officer Jeff Taylor, gugur pada operasi yang sama dengan Michael Murphy.',
  },
  // ── Titik masuk ───────────────────────────────────────────────────────────
  {
    nama: 'Baby Cindy', kelompok: 'pemula', format: 'AMRAP 10 menit', bodyweight: true,
    isi: ['3 ring row', '6 push-up (boleh miring)', '9 air squat'],
    targetWaktu: '6-10 ronde',
    skala: 'Kalau 10 ronde terasa mudah, naikkan durasinya dulu jadi 15 menit sebelum menaikkan repetisi.',
    catatan: 'Mulai dari sini kalau ini pekan pertama Anda. Tidak ada yang memalukan dari memulai di sini.',
  },
  {
    nama: 'EMOM Pengenalan', kelompok: 'pemula', format: 'EMOM 10 menit', bodyweight: true,
    isi: ['Menit ganjil: 8 air squat + 4 push-up', 'Menit genap: istirahat penuh'],
    targetWaktu: 'Selesai tanpa napas tersengal',
    skala: 'Naikkan repetisi hanya kalau Anda masih punya 30 detik istirahat tiap menit kerja.',
    catatan: 'Format teraman untuk mempelajari gerakan sambil tetap terasa seperti latihan.',
  },
]

// Arketipe motivasi. Sengaja BUKAN tokoh berhak cipta: menamai program latihan
// dengan Batman atau Spider-Man beserta gambarnya adalah pemakaian merek dan
// karakter milik orang lain, dan itu risiko hukum yang ditanggung pemilik
// aplikasi — bukan sesuatu yang pantas saya tinggalkan diam-diam di kode.
// Arketipenya sendiri (kelelawar, laba-laba, mesin, raksasa) memang lebih tua
// dari tokoh mana pun dan bebas dipakai.
export interface Arketipe {
  id: string
  ikon: string
  nama: string
  sifat: string
  latihan: string
  format: string
  kenapa: string
}

export const ARKETIPE: Arketipe[] = [
  { id: 'kelelawar', ikon: '🦇', nama: 'Sang Penjaga Malam', sifat: 'Manusia biasa yang menang lewat disiplin, bukan bakat',
    latihan: 'Kekuatan dasar + kapasitas kerja', format: 'Barbara atau Chelsea',
    kenapa: 'Arketipe tanpa kekuatan super. Semuanya hasil latihan yang diulang saat tidak ada yang menonton — istirahat terjadwal Barbara persis menguji itu.' },
  { id: 'laba-laba', ikon: '🕷️', nama: 'Sang Pemanjat', sifat: 'Ringan, lincah, kuat relatif terhadap berat badan',
    latihan: 'Rasio kekuatan-terhadap-berat', format: 'Cindy, lalu Mary',
    kenapa: 'Semua gerakannya bodyweight. Kemajuan datang dari menjadi lebih kuat pada tubuh Anda sendiri, bukan dari menambah beban.' },
  { id: 'baja', ikon: '🛡️', nama: 'Sang Perisai', sifat: 'Ketahanan yang tidak habis-habis',
    latihan: 'Daya tahan jangka panjang', format: 'Murph (diskalakan) atau HYROX',
    kenapa: 'Sesi panjang menguji hal berbeda dari sesi keras: kemampuan tetap bergerak rapi setelah menit ke-40.' },
  { id: 'mesin', ikon: '⚙️', nama: 'Sang Perekayasa', sifat: 'Menang lewat perhitungan dan alat, bukan otot',
    latihan: 'Pacing dan strategi', format: 'AMRAP apa pun dengan rencana pecah repetisi',
    kenapa: 'Tulis rencana pecah repetisi SEBELUM jam mulai, lalu ikuti. Ini keterampilan yang paling cepat menaikkan skor.' },
  { id: 'raksasa', ikon: '💪', nama: 'Sang Raksasa', sifat: 'Kekuatan mentah, ledakan pendek',
    latihan: 'Kekuatan maksimal', format: 'Grace atau Karen',
    kenapa: 'Sesi pendek dan berat. Justru arketipe ini yang paling perlu menahan diri: kekuatan mentah tanpa teknik adalah cara tercepat menuju cedera punggung.' },
  { id: 'petir', ikon: '⚡', nama: 'Sang Pelari Cepat', sifat: 'Kecepatan di atas segalanya',
    latihan: 'Tenaga anaerobik', format: 'Fran atau Tabata',
    kenapa: 'Semuanya selesai di bawah sepuluh menit. Menyenangkan — dan justru karena itu paling sering dikerjakan terlalu sering.' },
]

export interface Peringatan {
  judul: string
  isi: string
  tanda: string[]
}

export const RABDO: Peringatan = {
  judul: 'Rabdomiolisis — kenali sebelum mulai',
  isi: 'Latihan bervolume sangat tinggi, terutama gerakan menurun berulang (turunan pull-up, lunge, box step-down) pada orang yang belum terlatih, bisa merusak serat otot sampai mioglobin masuk ke darah dan membebani ginjal. Ini bukan cerita menakut-nakuti: kasusnya paling sering dilaporkan setelah Murph, Angie dan sesi pertama seseorang setelah lama libur. Penanganannya gawat darurat.',
  tanda: [
    'Nyeri otot yang jauh lebih hebat dari nyeri latihan biasa, terutama pada 24-72 jam sesudahnya',
    'Bengkak nyata pada otot yang dilatih',
    'Air seni berwarna cokelat gelap atau seperti teh',
    'Kelemahan otot yang tidak membaik, atau lengan yang tidak bisa diluruskan',
    'Mual, demam, atau jumlah air seni yang jauh berkurang',
  ],
}

export const ATURAN_AMAN = [
  'Skalakan sampai sesi selesai dalam rentang waktu yang disarankan. Sesi yang molor dua kali lipat bukan versi "lebih keras" — itu sesi yang salah dosis.',
  'Pekan pertama: kerjakan setengah volume apa pun yang tertulis, tanpa kecuali. Termasuk kalau Anda merasa bugar dari olahraga lain.',
  'Berhenti saat teknik rusak, bukan saat repetisi habis. Repetisi dengan punggung membulat tidak "tetap dihitung" oleh tubuh Anda.',
  'Jangan mengerjakan dua sesi bervolume tinggi berturut-turut. Angie, Chelsea, Barbara dan Murph masing-masing butuh 48-72 jam pulih.',
  'Kalau baru sembuh dari sakit, kurang tidur berat, atau sedang dehidrasi — tunda. Ketiganya faktor risiko rabdomiolisis yang berdiri sendiri.',
  'Gerakan olimpik (clean, jerk, snatch) dipelajari dengan pelatih lebih dulu. Tidak ada video yang bisa melihat punggung Anda.',
]

export const RUJUKAN = [
  'Tabata I, dkk. Effects of moderate-intensity endurance and high-intensity intermittent training on anaerobic capacity and VO2max. Med Sci Sports Exerc. 1996;28(10):1327-30.',
  'Hopkins BS, dkk. Rhabdomyolysis in CrossFit: a systematic review. Orthop J Sports Med. 2019.',
  'ACSM. Guidelines for Exercise Testing and Prescription, edisi ke-11, 2021 — bab penskalaan dan progresi beban latihan.',
  'Meyer M, dkk. Exertional rhabdomyolysis: a systematic review. Sports Health. 2018;10(3):260-266.',
]
