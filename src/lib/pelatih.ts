import { zoneBreakdown, type ImportedWorkout } from './workoutImport'
import { upayaRelatif, kebugaranKesegaran, bacaKesegaran, hariRiwayatLatihan, kunciHari } from './analisisPro'
import type { Konteks } from './trainingPhysiology'

// ─────────────────────────────────────────────────────────────────────────────
// Pelatih — lapisan yang BERBICARA di atas angka.
//
// Analisis Pro menjawab "berapa". Berkas ini menjawab "jadi apa artinya, dan
// sebaiknya besok bagaimana". Semua kesimpulannya diturunkan dari sesi nyata;
// tidak ada kalimat semangat yang tidak berpijak pada data.
//
// Dua hal yang sengaja TIDAK dilakukan, dan ini keputusan, bukan kelalaian:
//
//   * Tidak ada mekanisme kecanduan. Tidak ada rentetan (streak) yang
//     "putus" dan menghukum, tidak ada hadiah acak. Rentetan yang menghukum
//     membuat orang berlari saat cedera dan saat sakit — persis kebalikan dari
//     tujuan halaman ini.
//   * Tidak ada pujian kosong. Bila pekan ini lebih buruk, kalimatnya
//     mengatakan begitu dengan tenang, lalu menyebutkan langkah berikutnya.
//     Semangat yang dibangun di atas angka yang dipoles akan runtuh begitu
//     penggunanya sadar.
// ─────────────────────────────────────────────────────────────────────────────

export type JenisSesi = 'pemulihan' | 'easy' | 'long' | 'tempo' | 'interval' | 'sprint' | 'kekuatan' | 'lainnya'
export type Olahraga = 'lari' | 'sepeda' | 'renang' | 'kekuatan' | 'lainnya'

export function olahragaDari(nama: string): Olahraga {
  const n = nama.toLowerCase()
  if (/run|lari|jog|treadmill|marathon/.test(n)) return 'lari'
  if (/cycl|bike|sepeda|ride|spin/.test(n)) return 'sepeda'
  if (/swim|renang|pool/.test(n)) return 'renang'
  if (/strength|functional|traditional|hiit|core|angkat|gym|weight/.test(n)) return 'kekuatan'
  return 'lainnya'
}

export interface Klasifikasi {
  jenis: JenisSesi
  label: string
  warna: string
  /** Kenapa disimpulkan begitu — supaya bisa dibantah, bukan diterima buta. */
  alasan: string
  /** Bagian waktu di zona 1–2, 3, dan 4–5. */
  mudahPct: number
  menengahPct: number
  kerasPct: number
  yakin: 'tinggi' | 'sedang' | 'rendah'
}

/**
 * Simpulkan jenis sesi dari sebaran zona, bukan dari namanya.
 *
 * Nama sesi hampir selalu "Running" apa pun isinya, jadi menamai berdasarkan
 * judul akan selalu salah. Sebaran waktu per zona membedakan easy dari tempo
 * dan tempo dari interval — dan durasi memisahkan easy dari long run.
 */
export function klasifikasiSesi(w: ImportedWorkout, hrMax: number): Klasifikasi {
  const zona = zoneBreakdown(w.hr, hrMax)
  const total = zona.reduce((a, z) => a + z.menit, 0)
  const bagian = (dari: number, hingga: number) =>
    total > 0 ? Math.round((zona.filter((z) => z.zona >= dari && z.zona <= hingga).reduce((a, z) => a + z.menit, 0) / total) * 100) : 0

  const mudahPct = bagian(1, 2)
  const menengahPct = bagian(3, 3)
  const kerasPct = bagian(4, 5)
  const menit = w.durasi / 60
  const yakin: Klasifikasi['yakin'] = w.hr.length >= 20 ? 'tinggi' : w.hr.length >= 5 ? 'sedang' : 'rendah'

  const olahraga = olahragaDari(w.nama)
  if (olahraga === 'kekuatan') {
    return {
      jenis: 'kekuatan', label: 'Strength training', warna: '#a78bfa',
      alasan: 'Identified from the activity type. Heart-rate zone spread is not used to judge strength sessions, because heart rate while lifting does not reflect muscular load.',
      mudahPct, menengahPct, kerasPct, yakin,
    }
  }

  if (!w.hr.length) {
    return {
      jenis: 'lainnya', label: 'Cannot be assessed', warna: '#94a3b8',
      alasan: 'This session carries no heart-rate series, so its type cannot be inferred. Turn on Include Workouts and turn off Aggregate Data so the series is sent too.',
      mudahPct, menengahPct, kerasPct, yakin: 'rendah',
    }
  }

  // Sprint: potongan sangat keras yang singkat.
  if (kerasPct >= 20 && menit <= 25) {
    return { jenis: 'sprint', label: 'Sprint / kecepatan', warna: '#ef4444',
      alasan: `${kerasPct}% waktu di zona 4–5 dalam sesi ${Math.round(menit)} menit. Pendek dan sangat intens — ini kerja kecepatan, bukan daya tahan.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Interval: keras berulang di sesi lebih panjang.
  if (kerasPct >= 18) {
    return { jenis: 'interval', label: 'Interval', warna: '#f97316',
      alasan: `${kerasPct}% waktu di zona 4–5 diselingi pemulihan. Sesi seperti ini menaikkan VO₂max, dan menuntut pemulihan paling banyak di antara semua jenis.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Tempo: banyak di zona 3, sedikit di zona 4–5.
  if (menengahPct >= 30) {
    return { jenis: 'tempo', label: 'Tempo', warna: '#fbbf24',
      alasan: `${menengahPct}% waktu bertahan di zona 3. Ini laju "nyaman-keras" yang menggeser ambang laktat — bermanfaat, tetapi bukan sesi mudah meskipun terasa terkendali.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Long: mudah tapi panjang.
  if (mudahPct >= 65 && menit >= 75) {
    return { jenis: 'long', label: 'Long run', warna: '#60a5fa',
      alasan: `${Math.round(menit)} menit dengan ${mudahPct}% waktu di zona mudah. Durasinya yang membangun daya tahan, bukan kecepatannya.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Pemulihan: sangat ringan dan singkat.
  if (mudahPct >= 85 && menit <= 45) {
    return { jenis: 'pemulihan', label: 'Pemulihan', warna: '#94a3b8',
      alasan: `${mudahPct}% waktu di zona paling ringan selama ${Math.round(menit)} menit. Sesi ini menambah aliran darah tanpa menambah kelelahan.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  return { jenis: 'easy', label: 'Easy run', warna: '#34d399',
    alasan: `${mudahPct}% waktu di zona 1–2. Inilah jenis yang seharusnya mendominasi pekan Anda — sekitar 80% dari total waktu.`,
    mudahPct, menengahPct, kerasPct, yakin }
}

// ── Debrief pasca-latihan ───────────────────────────────────────────────────

export interface Debrief {
  judul: string
  ringkas: string
  poin: { ikon: string; teks: string }[]
  klasifikasi: Klasifikasi
  upaya: number
  /** Perbandingan dengan sesi sejenis sebelumnya, bila ada. */
  banding?: string
}

function fmtMenit(det: number): string {
  const m = Math.round(det / 60)
  return m >= 60 ? `${Math.floor(m / 60)} jam ${m % 60} menit` : `${m} menit`
}

function fmtPaceSingkat(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`
}

/**
 * Rangkuman satu sesi: apa yang barusan dilakukan, seberapa berat, dan apa
 * yang berubah dibandingkan sesi sejenis sebelumnya.
 */
export function debrief(w: ImportedWorkout, k: Konteks, riwayat: ImportedWorkout[]): Debrief {
  const kl = klasifikasiSesi(w, k.hrMax)
  const u = upayaRelatif(w, k)
  const poin: Debrief['poin'] = []

  poin.push({ ikon: '⏱', teks: `${fmtMenit(w.durasi)}${w.jarakKm ? ` · ${w.jarakKm} km` : ''}${w.paceSec ? ` · ${fmtPaceSingkat(w.paceSec)}/km` : ''}` })
  if (w.avgHr) {
    const pct = Math.round((w.avgHr / k.hrMax) * 100)
    poin.push({ ikon: '❤️', teks: `Rata-rata ${w.avgHr} bpm (${pct}% HRmaks)${w.maxHr ? `, puncak ${w.maxHr}` : ''}` })
  }
  poin.push({ ikon: '🔥', teks: `Upaya relatif ${u.skor} — ${u.label.toLowerCase()}` })
  if (kl.yakin !== 'rendah') {
    poin.push({ ikon: '🎯', teks: `Sebaran zona: ${kl.mudahPct}% mudah · ${kl.menengahPct}% menengah · ${kl.kerasPct}% keras` })
  }
  if (w.hrr1) {
    const nilai = w.hrr1 >= 25 ? 'sangat baik' : w.hrr1 >= 15 ? 'baik' : 'lambat'
    poin.push({ ikon: '📉', teks: `Denyut turun ${w.hrr1} bpm pada menit pertama setelah selesai — ${nilai}. Angka ini naik seiring kebugaran.` })
  }

  // Perbandingan dengan sesi sejenis terakhir.
  let banding: string | undefined
  const sejenis = riwayat
    .filter((x) => x.id !== w.id && Date.parse(x.mulai) < Date.parse(w.mulai))
    .filter((x) => klasifikasiSesi(x, k.hrMax).jenis === kl.jenis)
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
  const lalu = sejenis[0]
  if (lalu && w.paceSec && lalu.paceSec && w.avgHr && lalu.avgHr) {
    const dPace = lalu.paceSec - w.paceSec
    const dHr = w.avgHr - lalu.avgHr
    if (dPace > 5 && dHr <= 2) {
      banding = `Dibanding ${kl.label.toLowerCase()} sebelumnya, Anda ${fmtPaceSingkat(Math.abs(dPace))} per km lebih cepat dengan denyut yang sama atau lebih rendah. Itu tanda kebugaran naik, bukan sekadar hari yang bagus.`
    } else if (dPace < -5 && dHr >= 3) {
      banding = `Sedikit lebih lambat dan dengan denyut lebih tinggi daripada ${kl.label.toLowerCase()} sebelumnya. Satu sesi seperti ini biasa — bisa panas, kurang tidur, atau kelelahan sisa. Yang perlu diperhatikan hanya bila polanya berulang.`
    } else if (Math.abs(dPace) <= 5) {
      banding = `Sangat mirip dengan ${kl.label.toLowerCase()} sebelumnya. Konsistensi seperti ini justru yang membangun kebugaran.`
    }
  }

  const ringkas =
    kl.jenis === 'kekuatan' ? 'Strength session logged. This complements running rather than replacing it.'
      : kl.jenis === 'lainnya' ? 'Session logged, but without a heart-rate series its type cannot be judged yet.'
        : `Sesi ini terbaca sebagai ${kl.label.toLowerCase()}. ${kl.alasan}`

  return { judul: `Rangkuman: ${kl.label}`, ringkas, poin, klasifikasi: kl, upaya: u.skor, banding }
}

// ── Saran sesi berikutnya ───────────────────────────────────────────────────

export interface SaranBerikutnya {
  judul: string
  isi: string
  kapan: string
  jenis: JenisSesi
  warna: string
  /** Dasar keputusannya, terbuka untuk diperiksa. */
  dasar: string
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Sesi berikutnya, dari tiga hal: seberapa berat sesi terakhir, berapa lama
 * sejak itu, dan seberapa lelah tubuh menurut model kebugaran/kesegaran.
 */
export function saranBerikutnya(
  riwayat: ImportedWorkout[],
  k: Konteks,
  sekarang = Date.now(),
): SaranBerikutnya {
  const urut = [...riwayat].sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
  const terakhir = urut[0]

  if (!terakhir) {
    return {
      judul: 'Start with an easy session', jenis: 'easy', warna: '#34d399',
      isi: 'No sessions logged yet. Start with 20–30 minutes at a pace where you can still speak a full sentence.',
      kapan: 'Kapan saja',
      dasar: 'No history to build on yet.',
    }
  }

  const jamSejak = (sekarang - Date.parse(terakhir.mulai)) / 3_600_000
  const kl = klasifikasiSesi(terakhir, k.hrMax)
  const ff = kebugaranKesegaran(riwayat, k, 90, sekarang)
  const kini = ff.length ? ff[ff.length - 1] : null
  const segar = kini ? kini.kesegaran : 0

  const pekanIni = riwayat.filter((w) => sekarang - Date.parse(w.mulai) < 7 * 86400_000)
  const kerasPekanIni = pekanIni.filter((w) => {
    const j = klasifikasiSesi(w, k.hrMax).jenis
    return j === 'interval' || j === 'sprint' || j === 'tempo'
  }).length

  const besok = new Date(sekarang + 86400_000)
  const namaBesok = HARI[besok.getDay()]

  // Sesi berat baru saja: pulihkan dulu.
  if ((kl.jenis === 'interval' || kl.jenis === 'sprint') && jamSejak < 36) {
    return {
      judul: 'Recovery day', jenis: 'pemulihan', warna: '#94a3b8',
      isi: 'Your last session was intense. Today is better spent walking, jogging very easily for 20–30 minutes, or resting completely. Adaptation happens while you recover, not while you pile on.',
      kapan: 'Today',
      dasar: `Sesi terakhir ${kl.label.toLowerCase()} sekitar ${Math.round(jamSejak)} jam lalu.`,
    }
  }

  if (segar <= -30) {
    return {
      judul: 'Kurangi dulu', jenis: 'pemulihan', warna: '#ef4444',
      isi: 'Fatigue is far above fitness. Take 2–3 easy days or rest. Pushing from here adds injury risk, not progress.',
      kapan: 'Over the next few days',
      dasar: `Kesegaran ${Math.round(segar)} — menandakan beban menumpuk lebih cepat daripada pemulihan.`,
    }
  }

  if (kerasPekanIni >= 2) {
    return {
      judul: 'Easy run', jenis: 'easy', warna: '#34d399',
      isi: 'You already have two quality sessions this week — that is enough. Another hard session in the same week rarely adds progress and often adds fatigue. Run easy for 40–60 minutes.',
      kapan: `Besok (${namaBesok})`,
      dasar: `${kerasPekanIni} sesi tempo/interval dalam tujuh hari terakhir.`,
    }
  }

  if (segar >= 5 && jamSejak >= 24) {
    return {
      judul: 'Time for a quality session', jenis: 'tempo', warna: '#fbbf24',
      isi: 'You are fresh and ready for a stimulus. Options: a 20-minute tempo at a comfortably-hard pace, or 5×3 minutes in zone 4 with 2-minute recoveries.',
      kapan: jamSejak >= 40 ? 'Today' : `Besok (${namaBesok})`,
      dasar: `Kesegaran ${Math.round(segar)} dan ${Math.round(jamSejak)} jam sejak sesi terakhir.`,
    }
  }

  if (kl.jenis === 'long') {
    return {
      judul: 'Easy run pendek', jenis: 'easy', warna: '#34d399',
      isi: 'After a long session, a short easy run helps the legs recover faster than complete rest. 30–40 minutes is enough.',
      kapan: `Besok (${namaBesok})`,
      dasar: 'Sesi terakhir adalah long run.',
    }
  }

  return {
    judul: 'Easy run', jenis: 'easy', warna: '#34d399',
    isi: 'Hold your aerobic base: 40–60 minutes at a conversational pace. Sessions like this should fill most of your week.',
    kapan: jamSejak >= 24 ? 'Today' : `Besok (${namaBesok})`,
    dasar: `Sesi terakhir ${kl.label.toLowerCase()}, kesegaran ${Math.round(segar)}.`,
  }
}

// ── Jadwal pekan ────────────────────────────────────────────────────────────

export interface HariJadwal {
  hari: string
  tanggal: string
  jenis: JenisSesi
  label: string
  isi: string
  warna: string
  sudah?: boolean
}

/**
 * Rencana tujuh hari sederhana: dua sesi kualitas, satu sesi panjang, sisanya
 * mudah atau libur. Sengaja tidak rumit — rencana yang terlalu rinci adalah
 * rencana yang ditinggalkan di pekan kedua.
 */
export function jadwalPekan(
  riwayat: ImportedWorkout[],
  k: Konteks,
  sekarang = Date.now(),
): HariJadwal[] {
  const pola: { jenis: JenisSesi; label: string; isi: string; warna: string }[] = [
    { jenis: 'easy', label: 'Easy run', isi: '40–50 menit, laju bisa mengobrol', warna: '#34d399' },
    { jenis: 'tempo', label: 'Tempo', isi: '15 menit pemanasan, 20 menit tempo, 10 menit pendinginan', warna: '#fbbf24' },
    { jenis: 'pemulihan', label: 'Pemulihan / libur', isi: 'Walking, mobility, or complete rest', warna: '#94a3b8' },
    { jenis: 'easy', label: 'Easy run', isi: '40 menit santai', warna: '#34d399' },
    { jenis: 'interval', label: 'Interval', isi: '6×3 menit zona 4, pemulihan 2 menit', warna: '#f97316' },
    { jenis: 'pemulihan', label: 'Libur', isi: 'Istirahat penuh — ini bagian dari program, bukan kegagalan', warna: '#94a3b8' },
    { jenis: 'long', label: 'Long run', isi: '75–90 menit mudah, tanpa mengejar laju', warna: '#60a5fa' },
  ]

  const mulai = new Date(sekarang)
  const geser = (mulai.getDay() + 6) % 7 // Senin sebagai awal pekan
  mulai.setDate(mulai.getDate() - geser)
  mulai.setHours(0, 0, 0, 0)

  return pola.map((p, i) => {
    const d = new Date(mulai.getTime() + i * 86400_000)
    // Kalender setempat di kedua sisi. toISOString() selalu UTC, jadi di WIB
    // label harinya bergeser dan dibandingkan dengan tanggal mentah sesi yang
    // memang setempat — sesi yang sudah dijalankan tidak pernah dikenali.
    const tanggal = kunciHari(d)
    const sudah = riwayat.some((w) => {
      const t = Date.parse(w.mulai)
      return !Number.isNaN(t) && kunciHari(new Date(t)) === tanggal
    })
    return {
      hari: HARI[d.getDay()],
      tanggal,
      jenis: p.jenis,
      label: p.label,
      isi: p.isi,
      warna: p.warna,
      sudah,
    }
  })
}

// ── Dukungan ────────────────────────────────────────────────────────────────

export interface Dukungan {
  judul: string
  isi: string
  nada: 'baik' | 'netral' | 'hati-hati'
}

/**
 * Kalimat pendukung yang berpijak pada angka.
 *
 * Tidak ada rentetan yang menghukum dan tidak ada hadiah acak. Bila pekan ini
 * memang lebih sepi, kalimatnya mengatakan begitu tanpa menyalahkan — sebab
 * membuat orang merasa bersalah karena istirahat adalah cara tercepat membuat
 * mereka berlatih saat sedang tidak sehat.
 */
export function dukungan(riwayat: ImportedWorkout[], k: Konteks, sekarang = Date.now()): Dukungan {
  const dalam = (hariMulai: number, hariAkhir: number) =>
    riwayat.filter((w) => {
      const selisih = (sekarang - Date.parse(w.mulai)) / 86400_000
      return selisih >= hariMulai && selisih < hariAkhir
    })
  const pekanIni = dalam(0, 7)
  const pekanLalu = dalam(7, 14)

  const kmIni = +pekanIni.reduce((a, w) => a + (w.jarakKm ?? 0), 0).toFixed(1)
  const kmLalu = +pekanLalu.reduce((a, w) => a + (w.jarakKm ?? 0), 0).toFixed(1)

  if (!riwayat.length) {
    return { judul: 'Nothing to compare yet', nada: 'netral',
      isi: 'Once a few sessions are in, this section will compare this week with the last using your own numbers.' }
  }

  if (!pekanIni.length && pekanLalu.length) {
    return { judul: 'This week is still empty', nada: 'netral',
      isi: `Pekan lalu ${pekanLalu.length} sesi (${kmLalu} km). Istirahat satu pekan tidak menghapus kebugaran — kebugaran meluruh jauh lebih lambat daripada kelelahan. Satu sesi mudah sudah cukup untuk memulai lagi.` }
  }

  if (!pekanIni.length) {
    return { judul: 'Start again whenever you like', nada: 'netral',
      isi: 'No sessions in the last seven days. There is nothing to catch up on — start with one easy session.' }
  }

  // Kenaikan beban yang terlalu cepat lebih penting disampaikan daripada pujian.
  if (kmLalu > 0 && kmIni > kmLalu * 1.3) {
    return { judul: 'Naik cukup cepat', nada: 'hati-hati',
      isi: `${kmIni} km pekan ini dari ${kmLalu} km pekan lalu — naik ${Math.round(((kmIni - kmLalu) / kmLalu) * 100)}%. Lonjakan di atas sekitar 10% per pekan adalah pola yang paling sering mendahului cedera. Menahan laju penambahan sekarang akan membuat Anda tetap bisa berlari bulan depan.` }
  }

  if (kmLalu > 0 && kmIni >= kmLalu) {
    return { judul: 'Consistent and controlled', nada: 'baik',
      isi: `${pekanIni.length} sesi, ${kmIni} km pekan ini — setara atau di atas pekan lalu (${kmLalu} km), dan masih dalam kenaikan yang wajar. Justru pola membosankan seperti inilah yang membangun kebugaran.` }
  }

  return { judul: 'A lighter week', nada: 'netral',
    isi: `${pekanIni.length} sesi, ${kmIni} km. Lebih ringan daripada pekan lalu (${kmLalu} km). Pekan ringan yang disengaja adalah bagian dari program; yang perlu diperhatikan hanya bila ia tidak disengaja dan berulang.` }
}

/** Summary kesegaran untuk ditampilkan di kolom pelatih. */
export function statusSingkat(riwayat: ImportedWorkout[], k: Konteks, sekarang = Date.now()) {
  const ff = kebugaranKesegaran(riwayat, k, 90, sekarang)
  if (!ff.length) return null
  const kini = ff[ff.length - 1]
  return { ...kini, baca: bacaKesegaran(kini.kesegaran, hariRiwayatLatihan(riwayat, sekarang)) }
}
