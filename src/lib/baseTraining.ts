// ─────────────────────────────────────────────────────────────────────────────
// Latihan dasar: lari, push-up, pull-up, sit-up, dan koreksi postur.
//
// Kenapa file ini ada terpisah dari TrainingPlan: TrainingPlan menyusun program
// gym mingguan. Yang tidak ada di mana pun sebelumnya adalah dua hal yang
// justru paling sering ditanyakan orang yang berlatih tanpa alat:
//
//   1. PACE LARI. Kesalahan tersering pemula adalah menjalankan SEMUA sesi
//      lari sekencang mungkin. Akibatnya aerobic base tidak pernah terbangun,
//      kelelahan menumpuk, dan risiko cedera naik — sementara VO2max justru
//      stagnan. Empat jenis lari punya empat tujuan fisiologis berbeda, dan
//      masing-masing hanya tercapai bila dijalankan pada intensitas yang tepat.
//
//   2. PROGRESI KALISTENIK. "Push-up 3×10" tidak berarti apa-apa bila orangnya
//      belum bisa satu repetisi penuh, dan tidak menantang bila sudah bisa 30.
//      Yang diperlukan adalah tangga regresi-progresi: mulai dari varian yang
//      bisa dikerjakan hari ini, naik ketika syaratnya terpenuhi.
//
// Angka pace di bawah mengikuti kerangka VDOT (Jack Daniels' Running Formula).
// Nilainya diinterpolasi linier di antara titik-titik tabel supaya pengguna
// dengan pace race di antara baris tabel tetap mendapat angka yang masuk akal.
// ─────────────────────────────────────────────────────────────────────────────

export type RunType = 'easy' | 'long' | 'tempo' | 'interval'

export interface RunZone {
  key: RunType
  name: string
  tujuan: string
  /** Fisiologi — kenapa intensitasnya harus segini, bukan lebih cepat. */
  kenapa: string
  /** Porsi dari total kilometer mingguan. */
  porsi: string
  durasi: string
  rasa: string
  /** Tanda bahwa sesi dijalankan TERLALU cepat — kesalahan tersering. */
  salahnya: string
}

export const RUN_ZONES: RunZone[] = [
  {
    key: 'easy',
    name: 'Easy Run',
    tujuan: 'Membangun aerobic base',
    kenapa:
      'Intensitas rendah yang dijalankan lama merangsang pertumbuhan kapiler di otot, menambah jumlah dan ukuran mitokondria, serta memperbesar volume sekuncup jantung. Adaptasi ini hanya terjadi bila intensitasnya cukup rendah untuk dipertahankan berlama-lama — begitu terlalu cepat, sesi berubah menjadi beban kelelahan tanpa menambah basis aerobik.',
    porsi: '70-80% dari total kilometer mingguan',
    durasi: '30-60 menit',
    rasa: 'Masih bisa berbicara dalam kalimat penuh tanpa terengah',
    salahnya:
      'Easy run yang dijalankan terlalu cepat adalah kesalahan paling umum dan paling merugikan: terlalu berat untuk pemulihan, terlalu ringan untuk memicu adaptasi kecepatan — sesi yang mahal secara kelelahan namun murah secara manfaat.',
  },
  {
    key: 'long',
    name: 'Long Run',
    tujuan: 'Membangun endurance',
    kenapa:
      'Durasi panjang menguras cadangan glikogen sehingga tubuh belajar memakai lemak sebagai bahan bakar, memperkuat jaringan ikat, dan melatih daya tahan mental. Yang memberi adaptasi di sini adalah LAMA WAKTUNYA, bukan kecepatannya.',
    porsi: '20-30% dari total kilometer mingguan, satu kali seminggu',
    durasi: '60-120 menit',
    rasa: 'Sedikit lebih santai daripada easy run, dan harus tetap terkendali sampai kilometer terakhir',
    salahnya:
      'Memulai terlalu cepat sehingga separuh akhir berantakan. Long run yang benar terasa membosankan pada 30 menit pertama.',
  },
  {
    key: 'tempo',
    name: 'Tempo Run',
    tujuan: 'Menaikkan lactate threshold',
    kenapa:
      'Ambang laktat adalah kecepatan tertinggi yang masih bisa dipertahankan tanpa laktat menumpuk lebih cepat daripada dibersihkan. Berlari tepat di sekitar ambang ini melatih tubuh membersihkan laktat lebih efisien, sehingga pace yang dulu terasa berat menjadi terasa nyaman. Inilah penentu terbesar performa lari jarak menengah dan jauh.',
    porsi: '10-15% dari total kilometer mingguan',
    durasi: '20-40 menit berlari menerus, atau blok 2×15 menit',
    rasa: 'Nyaman namun berat — hanya sanggup mengucapkan 3-5 kata sekaligus',
    salahnya:
      'Dijalankan seperti balapan. Bila napas sudah tersengal, itu bukan lagi tempo melainkan interval, dan manfaat ambang laktatnya justru hilang.',
  },
  {
    key: 'interval',
    name: 'Interval',
    tujuan: 'Melatih kecepatan dan VO₂max',
    kenapa:
      'Blok pendek pada intensitas sangat tinggi memaksa jantung bekerja pada curah maksimal — rangsangan yang paling kuat untuk menaikkan VO₂max, penanda kebugaran yang paling erat berkaitan dengan angka harapan hidup. Karena sangat melelahkan, porsinya harus kecil.',
    porsi: '5-10% dari total kilometer mingguan, maksimal 1-2 sesi seminggu',
    durasi: 'Blok 400 m sampai 1200 m, jeda jogging di antaranya',
    rasa: 'Berat, hanya sanggup satu-dua kata; napas belum pulih penuh saat blok berikutnya dimulai',
    salahnya:
      'Menambah sesi interval karena merasa itu yang "paling berguna". Interval tanpa basis aerobik yang cukup adalah jalan tercepat menuju cedera dan kelelahan menahun.',
  },
]

/** Titik acuan tabel VDOT: race pace → rentang pace tiap jenis lari (detik/km). */
interface PaceRow {
  race: number
  easy: [number, number]
  long: [number, number]
  tempo: [number, number]
  interval: [number, number]
}

const mmss = (m: number, s: number) => m * 60 + s

const TABLE: PaceRow[] = [
  { race: mmss(3, 0), easy: [mmss(3, 55), mmss(4, 25)], long: [mmss(4, 5), mmss(4, 30)], tempo: [mmss(3, 15), mmss(3, 20)], interval: [mmss(2, 55), mmss(3, 5)] },
  { race: mmss(3, 30), easy: [mmss(4, 25), mmss(4, 55)], long: [mmss(4, 35), mmss(5, 0)], tempo: [mmss(3, 45), mmss(3, 50)], interval: [mmss(3, 25), mmss(3, 35)] },
  { race: mmss(4, 0), easy: [mmss(5, 0), mmss(5, 35)], long: [mmss(5, 10), mmss(5, 45)], tempo: [mmss(4, 15), mmss(4, 20)], interval: [mmss(3, 55), mmss(4, 5)] },
  { race: mmss(4, 30), easy: [mmss(5, 35), mmss(6, 10)], long: [mmss(5, 45), mmss(6, 20)], tempo: [mmss(4, 45), mmss(4, 50)], interval: [mmss(4, 25), mmss(4, 35)] },
  { race: mmss(5, 0), easy: [mmss(6, 10), mmss(6, 45)], long: [mmss(6, 20), mmss(6, 55)], tempo: [mmss(5, 15), mmss(5, 20)], interval: [mmss(4, 55), mmss(5, 5)] },
  { race: mmss(5, 30), easy: [mmss(6, 45), mmss(7, 20)], long: [mmss(6, 55), mmss(7, 30)], tempo: [mmss(5, 45), mmss(5, 50)], interval: [mmss(5, 25), mmss(5, 35)] },
  { race: mmss(6, 0), easy: [mmss(7, 20), mmss(8, 0)], long: [mmss(7, 30), mmss(8, 10)], tempo: [mmss(6, 15), mmss(6, 20)], interval: [mmss(5, 55), mmss(6, 5)] },
]

export const PACE_TABLE = TABLE

/** Format detik/km menjadi "m:ss". */
export function fmtPace(sec: number): string {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Ubah "5:30" atau "5.30" menjadi detik. Mengembalikan null bila tidak sah. */
export function parsePace(text: string): number | null {
  const t = text.trim().replace('.', ':')
  const m = /^(\d{1,2}):([0-5]?\d)$/.exec(t)
  if (!m) return null
  const sec = Number(m[1]) * 60 + Number(m[2])
  return Number.isFinite(sec) && sec > 0 ? sec : null
}

export interface PaceResult {
  race: number
  zones: Record<RunType, [number, number]>
  /** Diluar rentang tabel — angka diambil dari baris terdekat, bukan interpolasi. */
  clamped: boolean
}

/**
 * Pace latihan untuk satu race pace. Diinterpolasi linier di antara baris tabel
 * sehingga pace di antara nilai tabel tetap menghasilkan angka yang wajar,
 * alih-alih dibulatkan ke baris terdekat.
 */
export function trainingPaces(racePaceSec: number): PaceResult {
  const first = TABLE[0]
  const last = TABLE[TABLE.length - 1]
  const pick = (r: PaceRow): Record<RunType, [number, number]> => ({
    easy: r.easy, long: r.long, tempo: r.tempo, interval: r.interval,
  })

  if (racePaceSec <= first.race) return { race: racePaceSec, zones: pick(first), clamped: true }
  if (racePaceSec >= last.race) return { race: racePaceSec, zones: pick(last), clamped: true }

  let lo = TABLE[0]
  let hi = TABLE[1]
  for (let i = 0; i < TABLE.length - 1; i++) {
    if (racePaceSec >= TABLE[i].race && racePaceSec <= TABLE[i + 1].race) {
      lo = TABLE[i]
      hi = TABLE[i + 1]
      break
    }
  }
  const span = hi.race - lo.race
  const t = span === 0 ? 0 : (racePaceSec - lo.race) / span
  const mix = (a: [number, number], b: [number, number]): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ]
  return {
    race: racePaceSec,
    clamped: false,
    zones: {
      easy: mix(lo.easy, hi.easy),
      long: mix(lo.long, hi.long),
      tempo: mix(lo.tempo, hi.tempo),
      interval: mix(lo.interval, hi.interval),
    },
  }
}

/** Perkiraan race pace 5 K dari waktu tempuh suatu jarak. */
export function paceFromRun(distanceKm: number, minutes: number): number | null {
  if (!(distanceKm > 0) || !(minutes > 0)) return null
  return (minutes * 60) / distanceKm
}

// ─── Kalistenik: tangga progresi ────────────────────────────────────────────

export interface Step {
  level: number
  name: string
  target: string
  /** Syarat naik ke tingkat berikutnya. */
  naik: string
  cue: string
}

export interface Ladder {
  key: 'pushup' | 'pullup' | 'situp'
  title: string
  otot: string
  /** Kenapa gerakan ini penting untuk postur, bukan sekadar untuk kekuatan. */
  postur: string
  frekuensi: string
  steps: Step[]
}

export const LADDERS: Ladder[] = [
  {
    key: 'pushup',
    title: 'Push-Up',
    otot: 'Dada, trisep, deltoid anterior, dan serratus anterior',
    postur:
      'Serratus anterior adalah otot yang menahan tulang belikat menempel pada dinding dada. Bila lemah, belikat mencuat dan bahu jatuh ke depan. Push-up yang dikerjakan dengan dorongan penuh di akhir gerakan — bukan berhenti saat siku lurus — melatih otot ini secara langsung.',
    frekuensi: '3-4 kali seminggu, jeda minimal satu hari antar sesi',
    steps: [
      { level: 1, name: 'Push-up dinding', target: '3×15', naik: 'Bisa 3×15 dengan gerakan penuh dan terkendali', cue: 'Tubuh satu garis lurus dari telinga sampai tumit; jangan menekuk pinggul' },
      { level: 2, name: 'Push-up meja / bangku', target: '3×12', naik: 'Bisa 3×12 tanpa pinggul turun', cue: 'Semakin rendah tumpuan, semakin berat; turunkan ketinggian secara bertahap' },
      { level: 3, name: 'Push-up lutut', target: '3×12', naik: 'Bisa 3×12 dengan dada menyentuh dekat lantai', cue: 'Lutut, pinggul, dan bahu tetap satu garis — jangan menekuk di pinggul' },
      { level: 4, name: 'Push-up penuh', target: '3×8', naik: 'Bisa 3×8 dengan dada hampir menyentuh lantai', cue: 'Siku sekitar 45° dari badan, bukan melebar 90° — siku melebar membebani sendi bahu' },
      { level: 5, name: 'Push-up penuh volume', target: '3×20', naik: 'Bisa 3×20', cue: 'Tahan 1 detik di bawah; kualitas gerakan lebih menentukan daripada jumlah' },
      { level: 6, name: 'Push-up kaki ditinggikan / archer', target: '3×10', naik: 'Lanjut ke varian satu tangan bila diinginkan', cue: 'Naikkan kaki untuk menambah beban pada bahu dan dada atas' },
    ],
  },
  {
    key: 'pullup',
    title: 'Pull-Up',
    otot: 'Latissimus dorsi, rhomboid, trapezius bawah, bisep, dan otot genggam',
    postur:
      'INI GERAKAN PALING PENTING UNTUK POSTUR. Rhomboid dan trapezius bawah adalah otot yang menarik belikat ke belakang dan ke bawah. Duduk membungkuk berjam-jam melemahkan keduanya sekaligus memendekkan otot dada, sehingga bahu tertarik ke depan dan kepala maju — pola yang dikenal sebagai upper cross syndrome. Semua latihan tarik memperbaikinya; tidak ada latihan dorong yang bisa menggantikannya.',
    frekuensi: '2-3 kali seminggu, jeda minimal satu hari antar sesi',
    steps: [
      { level: 1, name: 'Dead hang', target: '3×20 detik', naik: 'Bisa menggantung 30 detik', cue: 'Bahu aktif ditarik turun menjauhi telinga, bukan menggantung pasif' },
      { level: 2, name: 'Scapular pull', target: '3×8', naik: 'Bisa 3×10 terkendali', cue: 'Hanya belikat yang bergerak turun; siku tetap lurus. Inilah gerakan yang paling langsung melatih trapezius bawah' },
      { level: 3, name: 'Australian row / inverted row', target: '3×10', naik: 'Bisa 3×12 dengan badan makin mendatar', cue: 'Tarik sampai dada menyentuh batang; jaga badan lurus seperti papan' },
      { level: 4, name: 'Negative pull-up', target: '3×5 turun 5 detik', naik: 'Bisa menahan turun 5 detik sebanyak 3×5', cue: 'Naik dengan bantuan lompatan, lalu turun selambat mungkin — fase turun inilah yang membangun kekuatan' },
      { level: 5, name: 'Pull-up penuh', target: '3×3', naik: 'Bisa 3×5', cue: 'Dagu melewati batang, turun sampai siku hampir lurus; jangan mengayun' },
      { level: 6, name: 'Pull-up volume / berbeban', target: '3×10 atau tambah beban', naik: '—', cue: 'Setelah 3×10 tercapai, tambah beban alih-alih menambah jumlah repetisi' },
    ],
  },
  {
    key: 'situp',
    title: 'Sit-Up & Core',
    otot: 'Rektus abdominis, obliks, dan otot dalam perut (transversus abdominis)',
    postur:
      'Untuk postur, bagian core yang paling menentukan bukan otot perut bagian depan melainkan transversus abdominis dan otot dalam yang menstabilkan panggul. Sit-up berulang dalam jumlah sangat besar justru membebani cakram tulang belakang, sementara latihan menahan seperti plank dan dead bug melatih fungsi menstabilkan yang sesungguhnya dibutuhkan untuk berdiri tegak tanpa nyeri.',
    frekuensi: '3-4 kali seminggu; boleh setiap hari untuk latihan menahan yang ringan',
    steps: [
      { level: 1, name: 'Dead bug', target: '3×8 tiap sisi', naik: 'Punggung bawah tetap menempel lantai sepanjang gerakan', cue: 'Punggung bawah TIDAK boleh terangkat dari lantai — ini syarat, bukan saran' },
      { level: 2, name: 'Plank', target: '3×30 detik', naik: 'Bisa 3×45 detik tanpa pinggul turun', cue: 'Pinggul sejajar bahu; kencangkan bokong agar panggul tidak menungging' },
      { level: 3, name: 'Crunch terkendali', target: '3×15', naik: 'Bisa 3×20', cue: 'Angkat hanya sampai belikat terangkat; leher rileks dan jangan ditarik dengan tangan' },
      { level: 4, name: 'Sit-up penuh', target: '3×15', naik: 'Bisa 3×20', cue: 'Gerakan lambat dan terkendali; berhenti bila punggung bawah terasa nyeri' },
      { level: 5, name: 'Hanging knee raise', target: '3×10', naik: 'Bisa 3×12', cue: 'Angkat dengan panggul menggulung ke atas, bukan sekadar menekuk pinggul' },
      { level: 6, name: 'Hanging leg raise / ab wheel', target: '3×8', naik: '—', cue: 'Jangan mengayun; kendalikan fase turun' },
    ],
  },
]

// ─── Program koreksi postur ─────────────────────────────────────────────────

export interface PostureItem {
  nama: string
  jenis: 'regangkan' | 'kuatkan' | 'sadari'
  dosis: string
  cue: string
}

/**
 * Postur bungkuk pada orang yang bekerja lama berdiri membungkuk maupun duduk
 * (koas, dokter jaga, pekerja meja) mengikuti pola yang dapat diprediksi:
 * OTOT DEPAN MEMENDEK, OTOT BELAKANG MELEMAH. Karena itu programnya bukan
 * "latihan punggung" semata, melainkan pasangan: regangkan yang memendek,
 * kuatkan yang melemah. Melakukan salah satunya saja jarang berhasil.
 */
export const POSTURE_PROGRAM: PostureItem[] = [
  { nama: 'Peregangan dada di kusen pintu', jenis: 'regangkan', dosis: '3×30 detik, 2 kali sehari', cue: 'Lengan atas sejajar bahu, melangkah maju sampai terasa tarikan di depan dada — bukan di sendi bahu' },
  { nama: 'Peregangan otot leher depan (chin tuck)', jenis: 'kuatkan', dosis: '3×10 tahan 5 detik, beberapa kali sehari', cue: 'Tarik dagu lurus ke belakang seperti membuat dagu berlipat; kepala tidak menunduk' },
  { nama: 'Peregangan otot pinggul depan (hip flexor)', jenis: 'regangkan', dosis: '3×30 detik tiap sisi', cue: 'Posisi berlutut satu kaki, kencangkan bokong sisi belakang lalu dorong panggul ke depan' },
  { nama: 'Scapular pull / band pull-apart', jenis: 'kuatkan', dosis: '3×15, 3 kali seminggu', cue: 'Tarik belikat turun dan ke belakang; bahu jangan naik ke arah telinga' },
  { nama: 'Face pull atau row dengan karet', jenis: 'kuatkan', dosis: '3×15, 3 kali seminggu', cue: 'Tarik ke arah dahi dengan siku tinggi — melatih trapezius bawah dan rotator eksternal' },
  { nama: 'Prone Y-T-W', jenis: 'kuatkan', dosis: '3×8 tiap huruf', cue: 'Tengkurap, angkat lengan membentuk huruf Y, T, dan W dengan ibu jari mengarah ke atas' },
  { nama: 'Glute bridge', jenis: 'kuatkan', dosis: '3×12', cue: 'Bokong yang lemah karena duduk lama membuat panggul menungging dan punggung bawah menahan beban berlebih' },
  { nama: 'Jeda berdiri tiap 30-45 menit', jenis: 'sadari', dosis: 'Sepanjang jam kerja', cue: 'Postur rusak karena LAMA menetap dalam satu posisi, bukan karena satu posisi yang salah. Berpindah posisi lebih menentukan daripada mencari posisi sempurna' },
  { nama: 'Atur tinggi layar dan meja', jenis: 'sadari', dosis: 'Sekali, permanen', cue: 'Bagian atas layar sedikit di bawah tinggi mata; siku sekitar 90°. Menahan postur baik di meja yang salah tidak akan bertahan' },
]

export interface WeekPlan {
  hari: string
  isi: string
  jenis: 'lari' | 'kekuatan' | 'pulih'
}

/** Contoh susunan seminggu yang menggabungkan lari dan kalistenik. */
export function weeklyTemplate(hariLari: 3 | 4 | 5): WeekPlan[] {
  const base: WeekPlan[] = [
    { hari: 'Senin', isi: 'Easy run 30-40 menit + program postur', jenis: 'lari' },
    { hari: 'Selasa', isi: 'Push-up + pull-up + core (tangga progresi)', jenis: 'kekuatan' },
    { hari: 'Rabu', isi: 'Tempo run 20-30 menit (setelah pemanasan)', jenis: 'lari' },
    { hari: 'Kamis', isi: 'Jalan santai, peregangan, tidur cukup', jenis: 'pulih' },
    { hari: 'Jumat', isi: 'Push-up + pull-up + core (tangga progresi)', jenis: 'kekuatan' },
    { hari: 'Sabtu', isi: 'Long run 60-90 menit pada pace long run', jenis: 'lari' },
    { hari: 'Minggu', isi: 'Istirahat penuh atau jalan ringan', jenis: 'pulih' },
  ]
  if (hariLari === 4) base[3] = { hari: 'Kamis', isi: 'Easy run 30 menit', jenis: 'lari' }
  if (hariLari === 5) {
    base[3] = { hari: 'Kamis', isi: 'Easy run 30 menit', jenis: 'lari' }
    base[6] = { hari: 'Minggu', isi: 'Interval 6×400 m (hanya bila basis aerobik sudah kuat)', jenis: 'lari' }
  }
  return base
}

/** Aturan yang paling sering dilanggar dan paling sering menyebabkan cedera. */
export const RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Naikkan jarak maksimal 10% per minggu',
    isi: 'Cedera lari pada pemula hampir selalu berasal dari menambah jarak terlalu cepat, bukan dari teknik. Tulang, tendon, dan ligamen beradaptasi jauh lebih lambat daripada jantung dan paru — perasaan "masih kuat" datang lebih dulu daripada kesiapan jaringan.',
  },
  {
    judul: 'Sebagian besar lari harus terasa mudah',
    isi: 'Bila semua sesi terasa berat, program itu salah. Aturan 80/20 — sekitar 80% kilometer pada intensitas rendah — dipakai oleh hampir semua pelari jarak jauh, termasuk yang elite.',
  },
  {
    judul: 'Hari istirahat adalah bagian dari program',
    isi: 'Adaptasi terjadi saat pulih, bukan saat berlatih. Latihan tanpa pemulihan hanya menumpuk kelelahan, dan pada orang yang jam tidurnya sudah kacau karena jaga, ini merupakan risiko yang nyata.',
  },
  {
    judul: 'Tidur adalah latihan yang tidak terlihat',
    isi: 'Kurang tidur menurunkan sintesis protein otot, menaikkan hormon stres, dan memperlambat pemulihan. Menambah sesi latihan sambil memotong jam tidur hampir selalu memberi hasil yang lebih buruk daripada berlatih lebih sedikit dengan tidur cukup.',
  },
  {
    judul: 'Nyeri sendi bukan nyeri otot',
    isi: 'Pegal otot yang muncul 1-2 hari setelah latihan itu wajar. Nyeri yang tajam, terlokalisasi pada sendi, memburuk saat berlatih, atau menetap lebih dari beberapa hari bukan hal yang perlu dilawan — kurangi beban dan periksakan bila menetap.',
  },
]
