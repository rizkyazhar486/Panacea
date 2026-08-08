import type { HrSample, SleepNight } from './api'

// ─────────────────────────────────────────────────────────────────────────────
// Body Battery — cadangan energi 0–100 sepanjang hari.
//
// Garmin membangunnya dari variabilitas denyut (HRV) yang direkam terus-menerus.
// Apple Watch tidak merekam HRV seperti itu, jadi mesin di sini memakai jalur
// kedua yang datanya memang ada: posisi denyut terhadap cadangan denyut
// (heart-rate reserve). Denyut tinggi menguras, denyut mendekati istirahat
// mengisi, tidur mengisi paling cepat. Ini pendekatan yang sama yang dipakai
// literatur beban fisiologis berbasis denyut, hanya dijalankan ke dua arah.
//
// Yang membedakan halaman ini dari mengarang kurva: setiap celah antar sampel
// dilaporkan apa adanya lewat `cakupan`, dan celah yang lebih panjang dari
// JEDA_MAKS_MS tidak diinterpolasi sama sekali — ia diperlakukan sebagai waktu
// yang tidak diketahui, bukan waktu istirahat. Dengan begitu jam tangan yang
// hanya mengirim beberapa titik sehari menghasilkan kurva yang jujur pendek,
// bukan garis mulus yang terlihat meyakinkan padahal ditebak.
//
// Bila kelak tersambung perangkat yang merekam denyut berkesinambungan (sabuk
// dada, cincin, Garmin), mesin yang sama langsung menghasilkan kurva penuh
// tanpa perubahan kode — yang berubah hanya kerapatan sampelnya.
// ─────────────────────────────────────────────────────────────────────────────

/** Celah antar sampel yang lebih panjang dari ini tidak dijembatani. */
export const JEDA_MAKS_MS = 30 * 60_000

/** Batas bawah dan atas baterai. */
const MIN = 5
const MAX = 100

export interface TitikBaterai {
  t: number
  nilai: number
  bpm: number
  /** Laju perubahan per jam pada titik ini; negatif berarti sedang terkuras. */
  lajuPerJam: number
  tidur: boolean
}

export interface PeristiwaBaterai {
  mulai: number
  selesai: number
  jenis: 'kuras' | 'isi'
  delta: number
  label: string
}

export interface HasilBaterai {
  cukupData: boolean
  alasan?: string
  titik: TitikBaterai[]
  sekarang: number
  tertinggi: number
  terendah: number
  /** Bagian rentang waktu yang benar-benar tertutup sampel, 0–1. */
  cakupan: number
  jamTertutup: number
  jamTotal: number
  peristiwa: PeristiwaBaterai[]
  istirahat: number
  hrMaks: number
  catatan: string[]
}

/**
 * Denyut istirahat dari data itu sendiri: persentil ke-5 dari sampel non-latihan
 * bila ada cukup sampel, kalau tidak dari sampel bertanda `resting`.
 *
 * Persentil dipilih, bukan nilai minimum, karena satu sampel meleset ke bawah
 * akan menggeser seluruh kurva bila dipakai sebagai dasar.
 */
export function perkiraanIstirahat(samples: HrSample[]): number | null {
  const bertanda = samples.filter((s) => s.kind === 'resting').map((s) => s.bpm)
  const harian = samples.filter((s) => s.kind !== 'workout').map((s) => s.bpm).sort((a, b) => a - b)
  if (harian.length >= 20) return Math.round(harian[Math.floor(harian.length * 0.05)])
  if (bertanda.length) return Math.round(bertanda.reduce((a, b) => a + b, 0) / bertanda.length)
  if (harian.length) return Math.round(harian[0])
  // Hanya ada sampel latihan — terjadi bila otomatisasi Workouts yang aktif.
  // Persentil terendahnya masih jauh lebih baik daripada menolak menghitung,
  // karena pemanasan dan pendinginan selalu ikut terekam dalam sesi.
  const semua = samples.map((s) => s.bpm).sort((a, b) => a - b)
  if (semua.length >= 20) return Math.round(semua[Math.floor(semua.length * 0.05)])
  if (semua.length) return Math.round(semua[0])
  return null
}

/**
 * Laju perubahan baterai per jam pada denyut tertentu.
 *
 * Sumbunya adalah fraksi cadangan denyut, f = (bpm − istirahat) / (maks − istirahat).
 * Di bawah AMBANG_ISI tubuh memulihkan, di atasnya menguras, dan pengurasan
 * naik kuadratik sehingga usaha keras jauh lebih mahal daripada jalan santai —
 * sesuai bentuk hubungan denyut dengan beban fisiologis.
 */
const AMBANG_ISI = 0.18
export function lajuPerJam(bpm: number, istirahat: number, hrMaks: number, tidur: boolean): number {
  const cadangan = Math.max(1, hrMaks - istirahat)
  const f = (bpm - istirahat) / cadangan
  if (f <= AMBANG_ISI) {
    // Pengisian: paling cepat saat tidur, dan melambat saat denyut merangkak naik.
    const kedalaman = Math.max(0, (AMBANG_ISI - f) / AMBANG_ISI)
    return (tidur ? 13 : 4.5) * kedalaman
  }
  const lebih = (f - AMBANG_ISI) / (1 - AMBANG_ISI)
  return -(6 + 54 * lebih * lebih)
}

function malamMengandung(t: number, malam: SleepNight[]): boolean {
  for (const n of malam) {
    if (!n.start || !n.end) continue
    const a = Date.parse(n.start)
    const b = Date.parse(n.end)
    if (Number.isFinite(a) && Number.isFinite(b) && t >= a && t <= b) return true
  }
  return false
}

function labelPeristiwa(jenis: 'kuras' | 'isi', delta: number, tidur: boolean, menit: number): string {
  if (jenis === 'isi') {
    if (tidur) return `Tidur mengisi ${delta} poin`
    return `Istirahat mengisi ${delta} poin`
  }
  if (menit <= 90 && delta >= 15) return `Aktivitas berat menguras ${delta} poin`
  return `Aktivitas menguras ${delta} poin`
}

/**
 * Hitung kurva baterai.
 *
 * @param samples deret denyut, urutan bebas (akan diurutkan)
 * @param malam   sesi tidur, dipakai untuk mempercepat pengisian
 * @param hrMaks  denyut maksimum
 * @param awal    nilai baterai di titik sampel pertama
 * @param istirahatDiketahui denyut istirahat dari profil, bila ada. Selalu lebih
 *   dipercaya daripada perkiraan dari deret, karena deret pendek bisa saja tidak
 *   memuat satu pun momen benar-benar istirahat.
 */
export function hitungBodyBattery(
  samples: HrSample[],
  malam: SleepNight[],
  hrMaks: number,
  awal = 70,
  istirahatDiketahui?: number | null,
): HasilBaterai {
  const catatan: string[] = []
  const urut = [...samples].filter((s) => Number.isFinite(s.t) && s.bpm > 0).sort((a, b) => a.t - b.t)

  if (urut.length < 2) {
    return {
      cukupData: false,
      alasan: 'Belum ada cukup sampel denyut untuk membentuk kurva. Perlu minimal dua titik.',
      titik: [], sekarang: awal, tertinggi: awal, terendah: awal,
      cakupan: 0, jamTertutup: 0, jamTotal: 0, peristiwa: [], istirahat: 0, hrMaks, catatan,
    }
  }

  const adaSampelDiam = urut.some((s) => s.kind !== 'workout')
  let istirahat = istirahatDiketahui && istirahatDiketahui > 0
    ? Math.round(istirahatDiketahui)
    : perkiraanIstirahat(urut)

  // Bila dasarnya hanya sampel latihan, angka terendahnya tetap denyut kerja,
  // bukan denyut istirahat. Tanpa batas ini seluruh sesi latihan akan terbaca
  // sebagai istirahat dan baterai justru naik saat tubuh dikuras.
  if (istirahat != null && !adaSampelDiam && !(istirahatDiketahui && istirahatDiketahui > 0)) {
    const ATAP_MASUK_AKAL = 90
    if (istirahat > ATAP_MASUK_AKAL) {
      istirahat = ATAP_MASUK_AKAL
      catatan.push('Rentang ini hanya berisi sampel dari sesi latihan, sehingga denyut istirahat tidak bisa diukur dan dipakai perkiraan umum. Isi denyut istirahat di profil kesehatan agar kurvanya akurat.')
    }
  }
  if (istirahat == null) {
    return {
      cukupData: false,
      alasan: 'Denyut istirahat belum bisa diperkirakan dari data yang ada.',
      titik: [], sekarang: awal, tertinggi: awal, terendah: awal,
      cakupan: 0, jamTertutup: 0, jamTotal: 0, peristiwa: [], istirahat: 0, hrMaks, catatan,
    }
  }
  if (istirahat >= hrMaks - 20) {
    catatan.push('Denyut istirahat dan denyut maksimum terlalu berdekatan, sehingga kurva di bawah ini kurang peka. Periksa umur di profil.')
  }

  const titik: TitikBaterai[] = []
  let nilai = Math.min(MAX, Math.max(MIN, awal))
  let tertutupMs = 0

  titik.push({
    t: urut[0].t, nilai: Math.round(nilai), bpm: urut[0].bpm,
    lajuPerJam: 0, tidur: malamMengandung(urut[0].t, malam),
  })

  for (let i = 1; i < urut.length; i++) {
    const s = urut[i]
    const jeda = s.t - urut[i - 1].t
    const tidur = malamMengandung(s.t, malam)

    if (jeda > JEDA_MAKS_MS) {
      // Celah terlalu panjang untuk ditebak. Putuskan kurvanya alih-alih
      // mengarang: nilai dibawa apa adanya dan ditandai laju nol.
      titik.push({ t: s.t, nilai: Math.round(nilai), bpm: s.bpm, lajuPerJam: 0, tidur })
      continue
    }

    // Rata-rata laju di kedua ujung celah (aturan trapesium) supaya satu lonjakan
    // pendek tidak dihitung seolah berlaku sepanjang celah.
    const l1 = lajuPerJam(urut[i - 1].bpm, istirahat, hrMaks, malamMengandung(urut[i - 1].t, malam))
    const l2 = lajuPerJam(s.bpm, istirahat, hrMaks, tidur)
    const laju = (l1 + l2) / 2
    nilai = Math.min(MAX, Math.max(MIN, nilai + (laju * jeda) / 3_600_000))
    tertutupMs += jeda
    titik.push({ t: s.t, nilai: Math.round(nilai), bpm: s.bpm, lajuPerJam: Math.round(laju), tidur })
  }

  // Peristiwa: rentang berturut-turut dengan arah yang sama dan perubahan berarti.
  const peristiwa: PeristiwaBaterai[] = []
  let mulai = 0
  for (let i = 1; i <= titik.length; i++) {
    const arahIni = i < titik.length ? Math.sign(titik[i].nilai - titik[i - 1].nilai) : 0
    const arahLalu = Math.sign(titik[mulai + 1] ? titik[mulai + 1].nilai - titik[mulai].nilai : 0)
    if (i === titik.length || (arahIni !== arahLalu && arahIni !== 0)) {
      const a = titik[mulai]
      const b = titik[i - 1]
      const delta = b.nilai - a.nilai
      const menit = Math.round((b.t - a.t) / 60_000)
      if (Math.abs(delta) >= 8 && menit >= 10) {
        peristiwa.push({
          mulai: a.t, selesai: b.t,
          jenis: delta < 0 ? 'kuras' : 'isi',
          delta: Math.abs(delta),
          label: labelPeristiwa(delta < 0 ? 'kuras' : 'isi', Math.abs(delta), a.tidur || b.tidur, menit),
        })
      }
      mulai = i - 1
    }
  }

  const totalMs = urut[urut.length - 1].t - urut[0].t
  const nilaiSemua = titik.map((p) => p.nilai)
  const cakupan = totalMs > 0 ? tertutupMs / totalMs : 0
  if (cakupan < 0.5) {
    catatan.push('Lebih dari separuh rentang ini tidak tertutup sampel, jadi kurvanya terputus-putus. Nyalakan "Include Workouts" dan matikan "Aggregate Data" di Health Auto Export untuk data yang jauh lebih rapat.')
  }
  if (!malam.length) {
    catatan.push('Belum ada data tidur, sehingga pengisian malam dihitung dengan laju istirahat biasa dan cenderung lebih rendah dari sebenarnya.')
  }

  return {
    cukupData: true,
    titik,
    sekarang: nilaiSemua[nilaiSemua.length - 1],
    tertinggi: Math.max(...nilaiSemua),
    terendah: Math.min(...nilaiSemua),
    cakupan,
    jamTertutup: Math.round((tertutupMs / 3_600_000) * 10) / 10,
    jamTotal: Math.round((totalMs / 3_600_000) * 10) / 10,
    peristiwa: peristiwa.sort((a, b) => b.delta - a.delta).slice(0, 6),
    istirahat,
    hrMaks,
    catatan,
  }
}

export interface TingkatStres {
  skor: number
  label: string
  warna: string
  arti: string
}

/**
 * Stres sepanjang hari, 0–100, dari fraksi cadangan denyut saat tidak berlatih.
 *
 * Garmin memakai HRV; tanpa HRV berkesinambungan, denyut yang bertahan di atas
 * istirahat saat tubuh sedang diam adalah penanda pengganti yang paling dekat.
 * Sampel latihan dibuang karena denyut tinggi saat berolahraga bukan stres —
 * memasukkannya membuat sesi lari terbaca sebagai hari terburuk.
 */
export function hitungStres(samples: HrSample[], istirahat: number, hrMaks: number): TingkatStres | null {
  const diam = samples.filter((s) => s.kind !== 'workout' && s.bpm > 0)
  if (diam.length < 5) return null
  const cadangan = Math.max(1, hrMaks - istirahat)
  const rata = diam.reduce((a, s) => a + s.bpm, 0) / diam.length
  const f = Math.max(0, (rata - istirahat) / cadangan)
  // f 0 → 0, f 0.35 ke atas → 100. Di atas sepertiga cadangan saat diam,
  // membedakan lebih jauh tidak lagi bermakna.
  const skor = Math.round(Math.min(100, (f / 0.35) * 100))
  if (skor <= 25) return { skor, label: 'Istirahat', warna: '#22c55e', arti: 'Tubuh dalam keadaan pulih. Ini keadaan yang diharapkan saat santai dan saat tidur.' }
  if (skor <= 50) return { skor, label: 'Rendah', warna: '#84cc16', arti: 'Beban ringan sehari-hari. Tidak ada yang perlu dilakukan.' }
  if (skor <= 75) return { skor, label: 'Sedang', warna: '#f59e0b', arti: 'Tubuh bekerja lebih keras dari biasanya sepanjang periode ini. Bisa datang dari kurang tidur, kafein, sakit, atau tekanan pikiran.' }
  return { skor, label: 'Tinggi', warna: '#ef4444', arti: 'Denyut bertahan jauh di atas istirahat padahal tidak sedang berolahraga. Bila berlanjut beberapa hari, pertimbangkan mengurangi beban latihan dan memeriksa tidur.' }
}

/** Saran singkat berdasarkan nilai baterai saat ini. */
export function saranBaterai(nilai: number): { judul: string; isi: string; warna: string } {
  if (nilai >= 75) return { judul: 'Cadangan penuh', isi: 'Ini saat terbaik untuk sesi berat atau hari yang padat.', warna: '#22c55e' }
  if (nilai >= 50) return { judul: 'Cukup', isi: 'Sesi sedang masih aman. Sisakan ruang bila besok ada rencana berat.', warna: '#84cc16' }
  if (nilai >= 25) return { judul: 'Menipis', isi: 'Pilih sesi ringan atau pemulihan. Tidur lebih awal akan terasa besar efeknya.', warna: '#f59e0b' }
  return { judul: 'Hampir habis', isi: 'Tubuh sedang menuntut pemulihan. Hindari sesi berat hari ini.', warna: '#ef4444' }
}
