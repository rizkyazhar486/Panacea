// "Minimum effective dose" library for people who want to be healthy but have
// no time and little energy.
//
// The design premise, which is a criticism of how most wearables behave: giving
// someone a bad score without a solution is worse than saying nothing. A busy
// person who is told "your recovery is 31%" and nothing else learns only that
// they are failing. So every entry here is an ACTION first — small enough to
// actually happen today — and the number is only ever context for the action.
//
// Every action is capped at what genuinely fits the stated time budget, and
// each carries the honest reason it works, so users can judge it rather than
// obey it.

export type Effort = 'zero' | 'low' | 'medium'
export type Slot = 2 | 10 | 30

export interface DoseAction {
  id: string
  title: string
  /** What to actually do, concretely enough to start without deciding anything. */
  how: string
  /** Why it works — kept honest, including where the evidence is modest. */
  why: string
  minutes: Slot
  effort: Effort
  /** Domains this helps, used to match against what the user says is worst. */
  helps: Domain[]
  /** Shown when the user is running on very little sleep or energy. */
  safeWhenWrecked: boolean
}

export type Domain = 'energy' | 'sleep' | 'stress' | 'movement' | 'food' | 'pain'

export const DOMAIN_LABEL: Record<Domain, string> = {
  energy: 'Selalu lelah',
  sleep: 'Tidur berantakan',
  stress: 'Stres / cemas',
  movement: 'Tidak pernah gerak',
  food: 'Makan asal-asalan',
  pain: 'Badan pegal / nyeri',
}

export const DOSES: DoseAction[] = [
  // ── 2 minutes ──────────────────────────────────────────────────────────────
  {
    id: 'water-first',
    title: 'Minum satu gelas air sekarang',
    how: 'Satu gelas penuh (sekitar 250 ml), sekarang, sebelum lanjut apa pun.',
    why: 'Dehidrasi ringan menurunkan konsentrasi dan menambah rasa lelah, dan rasa haus adalah penanda yang buruk — pada orang sibuk, haus sering baru terasa setelah performa sudah turun. Ini bukan obat ajaib, hanya penyebab kelelahan yang paling murah untuk disingkirkan.',
    minutes: 2, effort: 'zero', helps: ['energy', 'food'], safeWhenWrecked: true,
  },
  {
    id: 'sunlight-2',
    title: 'Keluar kena cahaya matahari 2 menit',
    how: 'Berdiri di luar atau di dekat jendela terbuka. Tidak perlu berjemur — cukup cahaya luar mengenai mata (jangan menatap matahari).',
    why: 'Cahaya terang pagi adalah pengatur jam biologis yang paling kuat. Ini memperbaiki rasa kantuk malam nanti, bukan rasa lelah sekarang — jadi manfaatnya datang malam ini, bukan dalam dua menit ini.',
    minutes: 2, effort: 'zero', helps: ['sleep', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'breath-2',
    title: 'Napas 4-6 selama 2 menit',
    how: 'Tarik napas 4 detik, buang 6 detik. Buangan lebih panjang dari tarikan. Ulangi sampai 2 menit habis.',
    why: 'Embusan yang lebih panjang mengaktifkan jalur parasimpatis dan menurunkan denyut jantung dalam hitungan menit. Efeknya nyata tapi sementara — ini alat untuk menurunkan puncak stres, bukan penyelesaian sumber stresnya.',
    minutes: 2, effort: 'zero', helps: ['stress', 'sleep'], safeWhenWrecked: true,
  },
  {
    id: 'stand-2',
    title: 'Berdiri dan jalan keliling ruangan',
    how: 'Berdiri, jalan 2 menit ke mana pun. Ke pantry, ke toilet, ke luar pintu.',
    why: 'Duduk tanpa jeda berjam-jam berkaitan dengan risiko metabolik yang berdiri sendiri, terpisah dari apakah Anda berolahraga. Memecah durasi duduk itu sendiri sudah bernilai, meski totalnya tidak sampai jadi "olahraga".',
    minutes: 2, effort: 'zero', helps: ['movement', 'pain', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'neck-2',
    title: 'Lepaskan leher dan bahu',
    how: 'Angkat bahu ke telinga, tahan 5 detik, jatuhkan. Ulang 5 kali. Lalu tengok pelan ke kiri dan kanan, tahan masing-masing 15 detik.',
    why: 'Nyeri leher dan bahu pada pekerja layar sebagian besar berasal dari postur statis, bukan dari kerusakan struktur. Yang membantu adalah mengubah posisi secara berkala — jauh lebih menentukan daripada peregangan mana yang dipilih.',
    minutes: 2, effort: 'zero', helps: ['pain'], safeWhenWrecked: true,
  },
  {
    id: 'protein-grab',
    title: 'Tambahkan satu sumber protein ke makan berikutnya',
    how: 'Telur, tahu, tempe, ikan kaleng, dada ayam, atau yoghurt. Tidak mengganti apa pun — hanya menambah.',
    why: 'Menambah lebih mudah dijalankan daripada melarang. Protein memperlambat lapar kembali dan membantu mempertahankan massa otot — dua hal yang paling cepat hilang pada orang sibuk yang makan seadanya.',
    minutes: 2, effort: 'zero', helps: ['food', 'energy'], safeWhenWrecked: true,
  },

  // ── 10 minutes ─────────────────────────────────────────────────────────────
  {
    id: 'walk-10',
    title: 'Jalan kaki 10 menit',
    how: 'Kecepatan bicara masih bisa, tapi tidak bisa menyanyi. Ke mana saja — sekitar kantor, keliling blok.',
    why: 'Aktivitas sedang punya hubungan dosis-respons: manfaat terbesar per menit justru terjadi saat naik dari nol ke sedikit, bukan dari banyak ke sangat banyak. Sepuluh menit bukan versi gagal dari 30 menit — itu bagian yang paling berharga.',
    minutes: 10, effort: 'low', helps: ['movement', 'energy', 'stress'], safeWhenWrecked: true,
  },
  {
    id: 'walk-after-meal',
    title: 'Jalan 10 menit setelah makan terbesar',
    how: 'Segera setelah makan siang atau makan malam, jalan santai 10 menit.',
    why: 'Berjalan setelah makan menurunkan lonjakan gula darah setelah makan lebih baik daripada berjalan pada waktu lain. Waktunya yang bekerja, bukan intensitasnya — jadi ini salah satu tindakan dengan hasil terbesar per usaha.',
    minutes: 10, effort: 'low', helps: ['movement', 'food', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'wind-down',
    title: 'Matikan layar 10 menit sebelum tidur',
    how: 'Taruh telepon di luar jangkauan tangan dari tempat tidur. Sepuluh menit saja, bukan sejam.',
    why: 'Yang paling mengganggu tidur biasanya bukan cahaya birunya melainkan isi yang membuat pikiran aktif. Menaruh telepon di luar jangkauan bekerja lebih baik daripada berniat "tidak membukanya" — mengubah lingkungan lebih andal daripada mengandalkan kemauan saat lelah.',
    minutes: 10, effort: 'zero', helps: ['sleep', 'stress'], safeWhenWrecked: true,
  },
  {
    id: 'strength-10',
    title: 'Kekuatan 10 menit tanpa alat',
    how: '3 putaran: 10 squat berdiri dari kursi, 8 push-up (boleh bertumpu di meja), 20 detik plank. Istirahat sesuka Anda.',
    why: 'Latihan kekuatan dua kali seminggu memberi manfaat yang tidak bisa digantikan aerobik — massa otot, kepadatan tulang, dan sensitivitas insulin. Sepuluh menit dua kali seminggu sudah melewati ambang "tidak pernah sama sekali", dan itu lompatan terbesarnya.',
    minutes: 10, effort: 'medium', helps: ['movement', 'energy'], safeWhenWrecked: false,
  },
  {
    id: 'meal-prep-lite',
    title: 'Siapkan satu hal untuk besok',
    how: 'Rebus 4 telur, cuci buah, atau masak nasi berlebih. Satu hal saja, bukan meal prep seminggu.',
    why: 'Keputusan makan yang buruk hampir selalu terjadi saat lapar dan tidak ada pilihan siap. Menyiapkan satu pilihan siap mengubah keputusan besok tanpa perlu disiplin besok.',
    minutes: 10, effort: 'low', helps: ['food'], safeWhenWrecked: true,
  },

  // ── 30 minutes ─────────────────────────────────────────────────────────────
  {
    id: 'zone2-30',
    title: 'Kardio ringan 30 menit',
    how: 'Jalan cepat, sepeda, atau berenang pada kecepatan yang masih memungkinkan Anda berbicara kalimat penuh.',
    why: 'Intensitas rendah yang bisa diulang mengalahkan intensitas tinggi yang membuat Anda berhenti seminggu. Konsistensi adalah variabel yang paling menentukan, dan intensitas rendah adalah yang paling mungkin Anda ulangi minggu depan.',
    minutes: 30, effort: 'medium', helps: ['movement', 'energy', 'stress'], safeWhenWrecked: false,
  },
  {
    id: 'sleep-anchor',
    title: 'Kunci jam BANGUN, bukan jam tidur',
    how: 'Pilih satu jam bangun dan pertahankan tiap hari termasuk akhir pekan. Biarkan jam tidur menyesuaikan sendiri.',
    why: 'Jam bangun jauh lebih bisa dikendalikan daripada jam tidur, dan jam bangun yang konsisten itulah yang menstabilkan ritme sirkadian. Mencoba "tidur lebih awal" saat belum mengantuk umumnya gagal dan justru menambah cemas soal tidur.',
    minutes: 30, effort: 'low', helps: ['sleep', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'full-strength',
    title: 'Latihan kekuatan penuh 30 menit',
    how: '2-3 putaran: squat, dorongan (push-up/dumbbell press), tarikan (row), engsel pinggul (hip hinge), plank. 8-12 repetisi.',
    why: 'Mencakup semua pola gerak dasar dalam satu sesi. Dua sesi seminggu memenuhi anjuran kekuatan tanpa perlu masuk gym setiap hari.',
    minutes: 30, effort: 'medium', helps: ['movement', 'pain'], safeWhenWrecked: false,
  },
]

/** Actions that fit the time and energy the user actually has right now. */
export function pickDoses(opts: { slot: Slot; wrecked: boolean; worst: Domain | null }): DoseAction[] {
  const fits = DOSES.filter((d) => d.minutes <= opts.slot)
  const safe = opts.wrecked ? fits.filter((d) => d.safeWhenWrecked) : fits
  const matched = opts.worst ? safe.filter((d) => d.helps.includes(opts.worst!)) : safe
  // Never return an empty list — an empty state is exactly the failure mode
  // this page exists to avoid.
  const pool = matched.length ? matched : safe.length ? safe : fits
  return pool.sort((a, b) => b.minutes - a.minutes || a.effort.localeCompare(b.effort))
}

/**
 * Turns a poor wearable reading into something actionable.
 *
 * Wearables routinely tell people they slept badly and stop there. What a busy
 * person needs is: is this actually dangerous, and what is the one thing worth
 * doing today. So this deliberately reframes a low number as information about
 * TODAY'S PLAN rather than as a verdict on the person.
 */
export function triageBadReading(input: {
  sleepH?: number
  restingHr?: number
  baselineRestingHr?: number
  hrvMs?: number
}): { headline: string; meaning: string; doToday: string; seeDoctor?: string } | null {
  const { sleepH, restingHr, baselineRestingHr } = input

  if (typeof sleepH === 'number' && sleepH > 0 && sleepH < 5) {
    return {
      headline: 'Semalam tidur pendek. Itu saja artinya.',
      meaning:
        'Satu malam kurang tidur menurunkan konsentrasi dan menaikkan rasa lapar, tapi tidak merusak kesehatan Anda secara permanen. Tubuh menutup sebagian utangnya sendiri pada malam berikutnya. Yang merugikan bukan satu malam ini, melainkan pola berbulan-bulan.',
      doToday:
        'Jangan menambah beban hari ini: lewati latihan berat, jangan menambah kafein setelah sore, dan kunci jam bangun besok pagi seperti biasa. Tidur siang boleh, maksimal 20 menit dan sebelum jam 3 sore.',
      seeDoctor:
        'Bila Anda mengantuk berat sampai hampir tertidur saat menyetir, mendengkur keras dengan henti napas yang disaksikan orang lain, atau selalu lelah meski tidur cukup — itu perlu diperiksakan, bukan diperbaiki sendiri.',
    }
  }

  if (typeof restingHr === 'number' && typeof baselineRestingHr === 'number'
    && baselineRestingHr > 0 && restingHr - baselineRestingHr >= 7) {
    return {
      headline: 'Nadi istirahat Anda naik dari biasanya.',
      meaning:
        'Kenaikan nadi istirahat yang jelas biasanya berarti tubuh sedang menangani sesuatu — kurang tidur, alkohol, stres, dehidrasi, atau infeksi yang sedang berjalan. Ini penanda beban, bukan penanda kegagalan.',
      doToday:
        'Turunkan intensitas hari ini, perbanyak minum, dan tidur lebih awal bila mungkin. Bila besok sudah kembali normal, tidak ada yang perlu dikhawatirkan.',
      seeDoctor:
        'Bila disertai demam, sesak, nyeri dada, atau jantung berdebar tidak teratur — periksakan hari ini juga.',
    }
  }

  return null
}
