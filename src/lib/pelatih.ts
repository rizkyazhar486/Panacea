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

export function olahragaDari(nama: string | undefined | null): Olahraga {
  // Nama boleh kosong. Penjaga bentuk di workoutStore tidak menuntut nama,
  // sehingga satu sesi lama tanpa nama pernah menjatuhkan SELURUH beranda ke
  // layar galat — satu ruas yang hilang menghapus semua angka orang itu.
  // Sesi tanpa nama tetap terhitung, hanya jenis olahraganya yang tak dikenali.
  const n = (nama ?? '').toLowerCase()
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
    return { jenis: 'sprint', label: 'Sprint / speed', warna: '#ef4444',
      alasan: `${kerasPct}% of the time in zones 4–5 across a ${Math.round(menit)}-minute session. Short and very intense — this is speed work, not endurance.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Interval: keras berulang di sesi lebih panjang.
  if (kerasPct >= 18) {
    return { jenis: 'interval', label: 'Interval', warna: '#f97316',
      alasan: `${kerasPct}% of the time in zones 4–5 with recoveries between. Sessions like this raise VO₂max, and demand more recovery than any other type.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Tempo: banyak di zona 3, sedikit di zona 4–5.
  if (menengahPct >= 30) {
    return { jenis: 'tempo', label: 'Tempo', warna: '#fbbf24',
      alasan: `${menengahPct}% of the time held in zone 3. This is the "comfortably hard" pace that shifts the lactate threshold — useful, but not an easy session even though it feels controlled.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Long: mudah tapi panjang.
  if (mudahPct >= 65 && menit >= 75) {
    return { jenis: 'long', label: 'Long run', warna: '#60a5fa',
      alasan: `${Math.round(menit)} minutes with ${mudahPct}% of the time in the easy zones. It is the duration that builds endurance here, not the speed.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  // Pemulihan: sangat ringan dan singkat.
  if (mudahPct >= 85 && menit <= 45) {
    return { jenis: 'pemulihan', label: 'Recovery', warna: '#94a3b8',
      alasan: `${mudahPct}% of the time in the lightest zone across ${Math.round(menit)} minutes. This adds blood flow without adding fatigue.`,
      mudahPct, menengahPct, kerasPct, yakin }
  }
  return { jenis: 'easy', label: 'Easy run', warna: '#34d399',
    alasan: `${mudahPct}% of the time in zones 1–2. This is the type that should dominate your week — around 80% of total time.`,
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
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
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
    poin.push({ ikon: '❤️', teks: `Average ${w.avgHr} bpm (${pct}% HRmax)${w.maxHr ? `, peak ${w.maxHr}` : ''}` })
  }
  poin.push({ ikon: '🔥', teks: `Relative effort ${u.skor} — ${u.label.toLowerCase()}` })
  if (kl.yakin !== 'rendah') {
    poin.push({ ikon: '🎯', teks: `Zone spread: ${kl.mudahPct}% easy · ${kl.menengahPct}% moderate · ${kl.kerasPct}% hard` })
  }
  if (w.hrr1) {
    const nilai = w.hrr1 >= 25 ? 'very good' : w.hrr1 >= 15 ? 'good' : 'slow'
    poin.push({ ikon: '📉', teks: `Heart rate fell ${w.hrr1} bpm in the first minute after finishing — ${nilai}. This number rises as fitness improves.` })
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
      banding = `Against your previous ${kl.label.toLowerCase()}, you were ${fmtPaceSingkat(Math.abs(dPace))} per km faster at the same heart rate or lower. That is a sign of rising fitness, not just a good day.`
    } else if (dPace < -5 && dHr >= 3) {
      banding = `Slightly slower and at a higher heart rate than your previous ${kl.label.toLowerCase()}. One session like this is ordinary — heat, short sleep, or residual fatigue. It only matters if the pattern repeats.`
    } else if (Math.abs(dPace) <= 5) {
      banding = `Very close to your previous ${kl.label.toLowerCase()}. Consistency like this is exactly what builds fitness.`
    }
  }

  const ringkas =
    kl.jenis === 'kekuatan' ? 'Strength session logged. This complements running rather than replacing it.'
      : kl.jenis === 'lainnya' ? 'Session logged, but without a heart-rate series its type cannot be judged yet.'
        : `This session reads as a ${kl.label.toLowerCase()}. ${kl.alasan}`

  return { judul: `Summary: ${kl.label}`, ringkas, poin, klasifikasi: kl, upaya: u.skor, banding }
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

const HARI = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
      isi: 'No sessions recorded yet. Start with 20–30 minutes at a pace that still lets you speak a full sentence.',
      kapan: 'Any time',
      dasar: 'No history to base this on yet.',
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
      isi: 'Your last session was hard. Today is better spent walking, jogging very easily for 20–30 minutes, or resting completely. Adaptation happens while recovering, not while piling on load.',
      kapan: 'Today',
      dasar: `Last session was a ${kl.label.toLowerCase()} about ${Math.round(jamSejak)} hours ago.`,
    }
  }

  if (segar <= -30) {
    return {
      judul: 'Ease off for now', jenis: 'pemulihan', warna: '#ef4444',
      isi: 'Fatigue is well above fitness. Take 2–3 easy days or rest. Pushing on from here adds injury risk, not progress.',
      kapan: 'Over the next few days',
      dasar: `Freshness ${Math.round(segar)} — load is accumulating faster than recovery.`,
    }
  }

  if (kerasPekanIni >= 2) {
    return {
      judul: 'Easy run', jenis: 'easy', warna: '#34d399',
      isi: 'You already have two quality sessions this week — that is enough. Another hard session in the same week rarely adds progress and often adds fatigue. An easy 40–60 minute run.',
      kapan: `Tomorrow (${namaBesok})`,
      dasar: `${kerasPekanIni} tempo/interval sessions in the last seven days.`,
    }
  }

  if (segar >= 5 && jamSejak >= 24) {
    return {
      judul: 'Time for a quality session', jenis: 'tempo', warna: '#fbbf24',
      isi: 'You are fresh and ready for a stimulus. Options: a 20-minute tempo at comfortably hard pace, or 5×3 minutes in zone 4 with 2-minute recoveries.',
      kapan: jamSejak >= 40 ? 'Today' : `Tomorrow (${namaBesok})`,
      dasar: `Freshness ${Math.round(segar)} and ${Math.round(jamSejak)} hours since the last session.`,
    }
  }

  if (kl.jenis === 'long') {
    return {
      judul: 'Short easy run', jenis: 'easy', warna: '#34d399',
      isi: 'After a long session, a short easy run recovers the legs faster than complete rest. 30–40 minutes is enough.',
      kapan: `Tomorrow (${namaBesok})`,
      dasar: 'The last session was a long run.',
    }
  }

  return {
    judul: 'Easy run', jenis: 'easy', warna: '#34d399',
    isi: 'Keep the aerobic base: 40–60 minutes at a conversational pace. Sessions like this should fill most of your week.',
    kapan: jamSejak >= 24 ? 'Today' : `Tomorrow (${namaBesok})`,
    dasar: `Last session was a ${kl.label.toLowerCase()}, freshness ${Math.round(segar)}.`,
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
    { jenis: 'easy', label: 'Easy run', isi: '40–50 minutes, conversational pace', warna: '#34d399' },
    { jenis: 'tempo', label: 'Tempo', isi: '15 min warm-up, 20 min tempo, 10 min cool-down', warna: '#fbbf24' },
    { jenis: 'pemulihan', label: 'Recovery / rest day', isi: 'Walking, mobility, or complete rest', warna: '#94a3b8' },
    { jenis: 'easy', label: 'Easy run', isi: '40 relaxed minutes', warna: '#34d399' },
    { jenis: 'interval', label: 'Interval', isi: '6×3 minutes in zone 4, 2-minute recoveries', warna: '#f97316' },
    { jenis: 'pemulihan', label: 'Rest', isi: 'Complete rest — this is part of the programme, not a failure', warna: '#94a3b8' },
    { jenis: 'long', label: 'Long run', isi: '75–90 easy minutes, with no chasing pace', warna: '#60a5fa' },
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
      isi: `Last week: ${pekanLalu.length} sessions (${kmLalu} km). A week off does not erase fitness — fitness decays far more slowly than fatigue. One easy session is enough to start again.` }
  }

  if (!pekanIni.length) {
    return { judul: 'Start again whenever you like', nada: 'netral',
      isi: 'No sessions in the last seven days. There is nothing to catch up on — start with one easy session.' }
  }

  // Kenaikan beban yang terlalu cepat lebih penting disampaikan daripada pujian.
  if (kmLalu > 0 && kmIni > kmLalu * 1.3) {
    return { judul: 'Rising quite fast', nada: 'hati-hati',
      isi: `${kmIni} km this week, up from ${kmLalu} km last week — a ${Math.round(((kmIni - kmLalu) / kmLalu) * 100)}% rise. Jumps above roughly 10% a week are the pattern that most often precedes injury. Holding the increase back now is what keeps you running next month.` }
  }

  if (kmLalu > 0 && kmIni >= kmLalu) {
    return { judul: 'Consistent and controlled', nada: 'baik',
      isi: `${pekanIni.length} sessions, ${kmIni} km this week — level with or above last week (${kmLalu} km), and still within a sensible increase. It is precisely this boring pattern that builds fitness.` }
  }

  return { judul: 'A lighter week', nada: 'netral',
    isi: `${pekanIni.length} sessions, ${kmIni} km. Lighter than last week (${kmLalu} km). A deliberate light week is part of the programme; it only matters if it was not deliberate and keeps repeating.` }
}

/** Summary kesegaran untuk ditampilkan di kolom pelatih. */
export function statusSingkat(riwayat: ImportedWorkout[], k: Konteks, sekarang = Date.now()) {
  const ff = kebugaranKesegaran(riwayat, k, 90, sekarang)
  if (!ff.length) return null
  const kini = ff[ff.length - 1]
  return { ...kini, baca: bacaKesegaran(kini.kesegaran, hariRiwayatLatihan(riwayat, sekarang)) }
}
