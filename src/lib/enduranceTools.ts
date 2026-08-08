// ─────────────────────────────────────────────────────────────────────────────
// Alat endurance yang berdiri sendiri: bahan bakar, panduan daya, FTP, dan
// aklimatisasi panas/ketinggian.
//
// Kenapa berkas ini ada terpisah dari trainingPhysiology: modul itu MEMBACA
// data yang sudah terekam. Yang di sini MERENCANAKAN sesuatu yang belum
// terjadi, dan karena itu tidak boleh bergantung pada ekspor jam tangan sama
// sekali. Semua masukannya berasal dari pengguna — jarak lomba, profil
// tanjakan, hasil tes FTP, suhu tempat berlatih — sehingga fiturnya tetap
// bekerja pada orang yang bersepeda maupun berenang, memakai power meter apa
// pun, atau belum menyinkronkan apa pun.
//
// Seluruh angka rujukan di sini berasal dari literatur gizi dan fisiologi
// olahraga yang sudah mapan, dan setiap fungsi menyebutkan dasarnya.
// ─────────────────────────────────────────────────────────────────────────────

// ═══ 1. RENCANA BAHAN BAKAR ═════════════════════════════════════════════════

export interface UjiKeringat {
  beratSebelumKg: number
  beratSesudahKg: number
  durasiMenit: number
  minumMl: number
  /** Urin selama sesi, bila sempat ditimbang. */
  urinMl?: number
}

export interface LajuKeringat {
  mlPerJam: number
  /** Persen berat badan yang hilang — di atas 2% mulai menurunkan performa. */
  pctKehilangan: number
  catatan: string
}

/**
 * Laju keringat dari selisih berat badan.
 *
 *   keringat = (berat sebelum − berat sesudah) + minum − urin
 *
 * Ini satu-satunya cara yang masuk akal untuk mengetahui kebutuhan cairan
 * seseorang, karena laju keringat berbeda sampai tiga kali lipat antarorang
 * pada suhu yang sama. Anjuran umum "minum 500 mL per jam" karena itu bisa
 * jauh terlalu sedikit bagi satu orang dan berlebihan bagi yang lain.
 */
export function lajuKeringat(u: UjiKeringat): LajuKeringat | null {
  if (!(u.durasiMenit > 0) || !(u.beratSebelumKg > 0) || !(u.beratSesudahKg > 0)) return null
  const hilangGram = (u.beratSebelumKg - u.beratSesudahKg) * 1000
  const keringatMl = hilangGram + (u.minumMl || 0) - (u.urinMl || 0)
  const mlPerJam = Math.round((keringatMl / u.durasiMenit) * 60)
  const pctKehilangan = +(((u.beratSebelumKg - u.beratSesudahKg) / u.beratSebelumKg) * 100).toFixed(2)

  const catatan = pctKehilangan >= 2
    ? `Anda kehilangan ${pctKehilangan}% berat badan. Di atas 2% performa daya tahan mulai menurun dan rasa lelah muncul lebih cepat — sesi ini kurang minum.`
    : pctKehilangan <= -1
      ? 'Berat badan Anda NAIK selama sesi. Ini tanda minum berlebihan; pada sesi panjang keadaan itu berisiko menurunkan kadar natrium darah (hiponatremia), yang justru lebih berbahaya daripada sedikit dehidrasi.'
      : `Kehilangan ${pctKehilangan}% berat badan — dalam rentang yang wajar.`

  return { mlPerJam: Math.max(0, mlPerJam), pctKehilangan, catatan }
}

export interface RencanaBahanBakar {
  durasiMenit: number
  karboPerJamGram: number
  totalKarboGram: number
  cairanPerJamMl: number
  totalCairanMl: number
  natriumPerJamMg: number
  jadwal: { menit: number; isi: string }[]
  dasar: string[]
  peringatan: string[]
}

/**
 * Rencana karbohidrat, cairan, dan natrium untuk satu sesi.
 *
 * Anjuran karbohidrat mengikuti kerangka yang lazim dipakai:
 *   < 45 menit  : tidak perlu apa-apa
 *   45-75 menit : berkumur karbohidrat saja sudah membantu
 *   1-2,5 jam   : 30-60 g/jam
 *   > 2,5 jam   : 60-90 g/jam, dan di atas 60 g/jam HARUS memakai campuran
 *                 glukosa dan fruktosa karena penyerapan glukosa sendiri
 *                 jenuh di sekitar 60 g/jam.
 *
 * Bagian glukosa-fruktosa itu yang paling sering dilewatkan, dan justru itu
 * yang menyebabkan mual serta gangguan perut pada lomba panjang.
 */
export function rencanaBahanBakar(opsi: {
  durasiMenit: number
  intensitas: 'mudah' | 'sedang' | 'berat'
  beratKg: number
  lajuKeringatMlPerJam?: number
  suhuC?: number
  perutSensitif?: boolean
}): RencanaBahanBakar {
  const { durasiMenit, intensitas, beratKg } = opsi
  const jam = durasiMenit / 60
  const dasar: string[] = []
  const peringatan: string[] = []

  let karboPerJamGram = 0
  if (durasiMenit < 45) {
    dasar.push('Di bawah 45 menit, simpanan glikogen tubuh sudah cukup — tidak perlu karbohidrat selama sesi.')
  } else if (durasiMenit < 75) {
    karboPerJamGram = intensitas === 'berat' ? 30 : 0
    dasar.push(karboPerJamGram > 0
      ? '45-75 menit pada intensitas berat: 30 g/jam, atau cukup berkumur minuman karbohidrat — efeknya lewat rangsangan di mulut, bukan lewat penyerapan.'
      : '45-75 menit intensitas ringan-sedang: belum perlu karbohidrat.')
  } else if (durasiMenit <= 150) {
    karboPerJamGram = intensitas === 'berat' ? 60 : 45
    dasar.push('1-2,5 jam: 30-60 g/jam adalah rentang yang lazim; diambil bagian atasnya untuk intensitas berat.')
  } else {
    karboPerJamGram = intensitas === 'berat' ? 90 : 70
    dasar.push('Di atas 2,5 jam: 60-90 g/jam. Penyerapan glukosa jenuh sekitar 60 g/jam, sehingga di atas itu WAJIB memakai campuran glukosa dan fruktosa (perbandingan sekitar 2:1) — jalur penyerapan fruktosa berbeda dan tidak ikut jenuh.')
    peringatan.push('Di atas 60 g/jam, pakai produk campuran glukosa-fruktosa. Memaksakan glukosa saja pada dosis ini adalah penyebab tersering mual dan gangguan perut saat lomba.')
  }

  if (opsi.perutSensitif && karboPerJamGram > 60) {
    karboPerJamGram = 60
    peringatan.push('Dosis diturunkan ke 60 g/jam karena Anda menandai perut sensitif. Toleransi usus bisa DILATIH: naikkan 10 g/jam tiap dua pekan pada sesi panjang latihan, jangan saat lomba.')
  }

  // Cairan: pakai laju keringat sendiri bila ada; kalau tidak, perkiraan kasar
  // yang dinaikkan bila panas.
  let cairanPerJamMl = opsi.lajuKeringatMlPerJam ?? 0
  if (cairanPerJamMl > 0) {
    dasar.push(`Cairan mengikuti laju keringat Anda sendiri (${cairanPerJamMl} mL/jam) — ini jauh lebih tepat daripada anjuran umum.`)
  } else {
    cairanPerJamMl = 500
    if ((opsi.suhuC ?? 25) >= 28) cairanPerJamMl = 750
    if ((opsi.suhuC ?? 25) >= 32) cairanPerJamMl = 900
    dasar.push('Belum ada uji keringat, jadi dipakai perkiraan umum yang disesuaikan suhu. Lakukan uji keringat untuk angka yang benar-benar milik Anda.')
    peringatan.push('Angka cairan ini PERKIRAAN. Laju keringat berbeda sampai tiga kali lipat antarorang pada suhu yang sama.')
  }
  // Minum melebihi laju keringat berisiko; batasi anjurannya.
  cairanPerJamMl = Math.min(cairanPerJamMl, 1000)

  // Natrium: makin panas dan makin lama, makin penting.
  let natriumPerJamMg = durasiMenit > 90 ? 500 : 300
  if ((opsi.suhuC ?? 25) >= 30) natriumPerJamMg += 200
  if (durasiMenit > 240) natriumPerJamMg = Math.max(natriumPerJamMg, 800)
  if (durasiMenit > 90) {
    dasar.push('Natrium ditambahkan karena sesi melewati 90 menit: pada sesi panjang, minum air tawar dalam jumlah besar tanpa garam dapat menurunkan kadar natrium darah.')
  }

  const jadwal: { menit: number; isi: string }[] = []
  if (durasiMenit >= 45) {
    const langkah = karboPerJamGram >= 60 ? 20 : 30
    for (let m = langkah; m < durasiMenit; m += langkah) {
      const gram = Math.round((karboPerJamGram * langkah) / 60)
      const ml = Math.round((cairanPerJamMl * langkah) / 60)
      jadwal.push({ menit: m, isi: `${gram > 0 ? `${gram} g karbohidrat + ` : ''}${ml} mL cairan` })
    }
  }
  if (durasiMenit >= 90) {
    peringatan.push('Latih rencana ini pada sesi latihan panjang SEBELUM dipakai di lomba. Usus perlu dibiasakan, dan hari lomba bukan tempat mencoba sesuatu yang baru.')
  }

  return {
    durasiMenit,
    karboPerJamGram,
    totalKarboGram: Math.round(karboPerJamGram * jam),
    cairanPerJamMl,
    totalCairanMl: Math.round(cairanPerJamMl * jam),
    natriumPerJamMg,
    jadwal,
    dasar,
    peringatan,
  }
}

// ═══ 2. FTP & ZONA DAYA ═════════════════════════════════════════════════════

export type TesFtp = 'tes20menit' | 'tes8menit' | 'ramp' | 'manual'

export interface HasilFtp {
  ftp: number
  wattPerKg: number | null
  metode: string
  kategori: string | null
  zona: { z: number; nama: string; dari: number; sampai: number | null; tujuan: string }[]
}

/**
 * FTP dari beberapa protokol tes yang lazim.
 *
 * Faktor pengalinya berbeda karena panjang tesnya berbeda: makin pendek tes,
 * makin besar sumbangan sistem anaerobik, sehingga makin besar pula angka yang
 * harus dipotong untuk sampai ke daya yang benar-benar bisa dipertahankan.
 */
export function hitungFtp(opsi: { metode: TesFtp; nilaiWatt: number; beratKg?: number; sex?: 'M' | 'F' }): HasilFtp | null {
  const { metode, nilaiWatt, beratKg } = opsi
  if (!(nilaiWatt > 0)) return null

  const faktor: Record<TesFtp, number> = {
    tes20menit: 0.95,
    tes8menit: 0.90,
    ramp: 0.75, // dari daya 1 menit terakhir
    manual: 1,
  }
  const nama: Record<TesFtp, string> = {
    tes20menit: 'Tes 20 menit — rata-rata daya × 0,95',
    tes8menit: 'Tes 2 × 8 menit — rata-rata terbaik × 0,90',
    ramp: 'Tes ramp — daya 1 menit terakhir × 0,75',
    manual: 'Dimasukkan sendiri',
  }
  const ftp = Math.round(nilaiWatt * faktor[metode])
  const wattPerKg = beratKg && beratKg > 0 ? +(ftp / beratKg).toFixed(2) : null

  // Zona Coggan, dinyatakan sebagai persentase FTP.
  const zona = [
    { z: 1, nama: 'Pemulihan aktif', lo: 0, hi: 0.55, tujuan: 'Memulihkan tanpa menambah beban.' },
    { z: 2, nama: 'Ketahanan', lo: 0.56, hi: 0.75, tujuan: 'Basis aerobik. Di sinilah sebagian besar jam bersepeda seharusnya dihabiskan.' },
    { z: 3, nama: 'Tempo', lo: 0.76, hi: 0.90, tujuan: 'Menengah — berguna, namun bila SEMUA sesi di sini, kemajuan mandek.' },
    { z: 4, nama: 'Ambang', lo: 0.91, hi: 1.05, tujuan: 'Menaikkan FTP itu sendiri. Interval 8-20 menit.' },
    { z: 5, nama: 'VO2max', lo: 1.06, hi: 1.20, tujuan: 'Menaikkan kemampuan aerobik maksimal. Interval 3-5 menit.' },
    { z: 6, nama: 'Kapasitas anaerobik', lo: 1.21, hi: 1.50, tujuan: 'Serangan pendek 30 detik sampai 3 menit.' },
    { z: 7, nama: 'Daya neuromuskular', lo: 1.51, hi: null as number | null, tujuan: 'Sprint di bawah 30 detik.' },
  ].map((z) => ({
    z: z.z, nama: z.nama, tujuan: z.tujuan,
    dari: Math.round(ftp * z.lo),
    sampai: z.hi != null ? Math.round(ftp * z.hi) : null,
  }))

  return { ftp, wattPerKg, metode: nama[metode], kategori: wattPerKg != null ? kategoriWkg(wattPerKg, opsi.sex ?? 'M') : null, zona }
}

/** Rentang kasar yang lazim dipakai untuk menempatkan diri; bukan patokan medis. */
export function kategoriWkg(wkg: number, sex: 'M' | 'F'): string {
  const batas = sex === 'F'
    ? [[1.4, 'Pemula'], [2.2, 'Rekreasi'], [3.1, 'Adequate terlatih'], [4.0, 'Terlatih'], [4.8, 'Sangat terlatih'], [99, 'Tingkat elite']] as const
    : [[1.8, 'Pemula'], [2.6, 'Rekreasi'], [3.5, 'Adequate terlatih'], [4.5, 'Terlatih'], [5.3, 'Sangat terlatih'], [99, 'Tingkat elite']] as const
  for (const [b, l] of batas) if (wkg < b) return l
  return 'Tingkat elite'
}

// ═══ 3. PANDUAN DAYA UNTUK RUTE ═════════════════════════════════════════════

export interface Segmen {
  nama: string
  jarakKm: number
  /** Kemiringan rata-rata dalam persen; negatif berarti menurun. */
  gradienPct: number
}

export interface TargetSegmen extends Segmen {
  targetWatt: number
  pctFtp: number
  perkiraanMenit: number
  perkiraanKmh: number
  catatan: string
}

export interface PanduanDaya {
  segmen: TargetSegmen[]
  totalMenit: number
  totalKm: number
  ifPerkiraan: number
  peringatan: string[]
}

/**
 * Kecepatan dari daya lewat persamaan tenaga bersepeda.
 *
 *   P = (gravitasi + gelinding + udara) / efisiensi transmisi
 *   gravitasi = m·g·sin(θ)·v
 *   gelinding = m·g·Crr·cos(θ)·v
 *   udara     = ½·ρ·CdA·v³
 *
 * Diselesaikan secara numerik karena suku udara membuatnya kubik.
 */
export function kecepatanDariDaya(opsi: {
  watt: number
  massaTotalKg: number
  gradienPct: number
  cda?: number
  crr?: number
  rho?: number
}): number {
  const { watt, massaTotalKg, gradienPct } = opsi
  const CdA = opsi.cda ?? 0.32
  const Crr = opsi.crr ?? 0.005
  const rho = opsi.rho ?? 1.225
  const g = 9.81
  const eff = 0.976
  const theta = Math.atan(gradienPct / 100)

  const dayaUntuk = (v: number) =>
    (massaTotalKg * g * Math.sin(theta) * v + massaTotalKg * g * Crr * Math.cos(theta) * v + 0.5 * rho * CdA * v * v * v) / eff

  // Bagi dua sampai konvergen; rentang 0,5-25 m/detik cukup untuk semua kasus nyata.
  let lo = 0.5, hi = 25
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (dayaUntuk(mid) > watt) hi = mid
    else lo = mid
  }
  return +(((lo + hi) / 2) * 3.6).toFixed(2)
}

/**
 * Menetapkan target daya per segmen.
 *
 * Aturan intinya: naik tanjakan pakai daya LEBIH TINGGI, turun dan datar pakai
 * LEBIH RENDAH. Ini berlawanan dengan naluri kebanyakan orang yang menjaga daya
 * tetap sama, padahal pada tanjakan setiap watt tambahan menghemat lebih banyak
 * waktu karena kecepatannya rendah dan hambatan udara kecil — sedangkan saat
 * menurun, watt tambahan hampir seluruhnya terbuang melawan udara.
 */
export function panduanDaya(opsi: {
  segmen: Segmen[]
  ftp: number
  targetIf: number
  massaTotalKg: number
  cda?: number
  crr?: number
}): PanduanDaya {
  const { segmen, ftp, targetIf, massaTotalKg } = opsi
  const peringatan: string[] = []

  const out: TargetSegmen[] = segmen.map((s) => {
    // Penyesuaian menurut kemiringan, dibatasi agar tetap masuk akal.
    let pengali = 1
    let catatan = 'Datar — jaga daya tepat pada target, jangan tergoda menambah.'
    if (s.gradienPct >= 8) { pengali = 1.12; catatan = 'Tanjakan curam — boleh di atas target; di kecepatan rendah setiap watt paling berharga.' }
    else if (s.gradienPct >= 4) { pengali = 1.07; catatan = 'Tanjakan sedang — sedikit di atas target.' }
    else if (s.gradienPct >= 1.5) { pengali = 1.03; catatan = 'Tanjakan landai — sedikit di atas target.' }
    else if (s.gradienPct <= -4) { pengali = 0.7; catatan = 'Turunan — kurangi daya, hampir seluruhnya akan terbuang melawan udara. Pulihkan di sini.' }
    else if (s.gradienPct <= -1.5) { pengali = 0.85; catatan = 'Turunan landai — turunkan daya sedikit.' }

    const targetWatt = Math.round(ftp * targetIf * pengali)
    const kmh = kecepatanDariDaya({ watt: targetWatt, massaTotalKg, gradienPct: s.gradienPct, cda: opsi.cda, crr: opsi.crr })
    const menit = kmh > 0 ? (s.jarakKm / kmh) * 60 : 0

    return { ...s, targetWatt, pctFtp: Math.round((targetWatt / ftp) * 100), perkiraanKmh: kmh, perkiraanMenit: +menit.toFixed(1), catatan }
  })

  const totalMenit = out.reduce((a, s) => a + s.perkiraanMenit, 0)
  const totalKm = out.reduce((a, s) => a + s.jarakKm, 0)

  if (targetIf > 0.85 && totalMenit > 120) {
    peringatan.push('Intensitas di atas 0,85 FTP untuk lomba lebih dari dua jam hampir selalu terlalu tinggi. Sebagian besar pelomba yang "meledak" melakukannya pada jam pertama.')
  }
  if (targetIf > 1) peringatan.push('Target di atas FTP tidak dapat dipertahankan lebih dari sekitar satu jam menurut definisi FTP itu sendiri.')
  peringatan.push('Perkiraan waktu memakai nilai baku CdA dan hambatan gelinding, dan TIDAK memperhitungkan angin. Angin berlawanan mengubah hasilnya secara berarti.')

  return { segmen: out, totalMenit: +totalMenit.toFixed(1), totalKm: +totalKm.toFixed(2), ifPerkiraan: targetIf, peringatan }
}

/** Anjuran intensitas menurut lama lomba. */
export function saranIf(durasiJam: number): { if: number; ket: string } {
  if (durasiJam <= 0.5) return { if: 1.0, ket: 'Sekitar 30 menit: mendekati FTP.' }
  if (durasiJam <= 1) return { if: 0.95, ket: 'Sekitar 1 jam: 0,93-0,97 FTP.' }
  if (durasiJam <= 2) return { if: 0.85, ket: '1-2 jam: 0,83-0,87 FTP.' }
  if (durasiJam <= 3) return { if: 0.80, ket: '2-3 jam: 0,78-0,82 FTP.' }
  if (durasiJam <= 5) return { if: 0.73, ket: '3-5 jam: 0,70-0,75 FTP.' }
  return { if: 0.65, ket: 'Di atas 5 jam: 0,60-0,68 FTP. Menahan diri di awal jauh lebih menentukan daripada tenaga di akhir.' }
}

// ═══ 4. AKLIMATISASI PANAS & KETINGGIAN ═════════════════════════════════════

export interface PaparanPanas { tanggal: string; suhuC: number; menit: number }
export interface PaparanKetinggian { tanggal: string; meter: number; jam: number }

export interface StatusAklimatisasi {
  persen: number
  label: string
  hariEfektif: number
  penjelasan: string
  saran: string
}

/**
 * Aklimatisasi panas.
 *
 * Adaptasi utamanya — volume plasma bertambah, keringat muncul lebih awal dan
 * lebih encer, denyut jantung pada beban yang sama turun — berkembang dalam
 * sekitar 10-14 hari paparan berulang, dengan sebagian besar kemajuan pada
 * lima hari pertama. Ia juga LURUH cepat: sekitar seperempat hilang tiap
 * pekan tanpa paparan, jadi mempertahankannya butuh paparan berkala.
 */
export function aklimatisasiPanas(paparan: PaparanPanas[], sekarang = Date.now()): StatusAklimatisasi {
  let poin = 0
  for (const p of paparan) {
    const t = Date.parse(p.tanggal)
    if (Number.isNaN(t) || t > sekarang) continue
    const umurHari = (sekarang - t) / 86_400_000
    if (umurHari > 42) continue
    if (p.suhuC < 27 || p.menit < 30) continue // di bawah ini rangsangannya terlalu lemah

    const kuat = Math.min(1.5, (p.suhuC - 27) / 8 + 0.5) * Math.min(1.5, p.menit / 60)
    // Peluruhan: sekitar 2,5% per hari, mendekati seperempat per pekan.
    poin += kuat * Math.pow(0.975, umurHari)
  }
  // Pembagi 14 supaya "penuh" jatuh di ujung rentang 10-14 hari yang disebut
  // pada penjelasannya sendiri, bukan lebih cepat daripada yang dijanjikan teks.
  const persen = Math.min(100, Math.round((poin / 14) * 100))
  const hariEfektif = +(poin).toFixed(1)

  const label = persen >= 80 ? 'Teraklimatisasi' : persen >= 50 ? 'Sebagian' : persen >= 20 ? 'Awal' : 'Belum'
  return {
    persen, label, hariEfektif,
    penjelasan: 'Aklimatisasi panas berkembang dalam sekitar 10-14 hari paparan berulang di atas 27 °C selama minimal 30 menit, dan sebagian besar kemajuannya terjadi pada lima hari pertama. Yang beradaptasi: volume plasma bertambah, keringat keluar lebih awal dan lebih encer, dan denyut jantung pada beban yang sama menurun.',
    saran: persen >= 80
      ? 'Pertahankan dengan paparan panas 2-3 kali sepekan. Tanpa paparan, sekitar seperempatnya luruh tiap pekan.'
      : persen >= 50
        ? 'Lanjutkan paparan harian. Sesi mudah di suhu panas sudah cukup — tidak perlu sesi keras, dan sesi keras dalam panas justru menambah risiko.'
        : 'Mulai dengan sesi mudah 30-60 menit dalam suhu panas, dan naikkan durasinya bertahap. Jangan memulai dengan sesi keras.',
  }
}

/**
 * Aklimatisasi ketinggian.
 *
 * Rangsangannya baru bermakna di atas sekitar 1500 m. Adaptasi awal (napas
 * lebih dalam, cairan tubuh menyesuaikan) berlangsung beberapa hari, sedangkan
 * pertambahan sel darah merah memerlukan sekitar 3-4 pekan. Waktu tinggal per
 * hari sangat menentukan — inilah dasar pendekatan "tinggal tinggi, berlatih
 * rendah".
 */
export function aklimatisasiKetinggian(paparan: PaparanKetinggian[], sekarang = Date.now()): StatusAklimatisasi {
  let poin = 0
  for (const p of paparan) {
    const t = Date.parse(p.tanggal)
    if (Number.isNaN(t) || t > sekarang) continue
    const umurHari = (sekarang - t) / 86_400_000
    if (umurHari > 60) continue
    if (p.meter < 1500) continue

    const kuat = Math.min(2, (p.meter - 1500) / 1200 + 0.4) * Math.min(1.2, p.jam / 12)
    poin += kuat * Math.pow(0.985, umurHari) // luruh lebih lambat daripada panas
  }
  // Pembagi 32: adaptasi sel darah merah butuh 3-4 pekan, jadi 20 hari tidak
  // boleh sudah terbaca penuh.
  const persen = Math.min(100, Math.round((poin / 32) * 100))
  return {
    persen, hariEfektif: +poin.toFixed(1),
    label: persen >= 80 ? 'Teraklimatisasi' : persen >= 50 ? 'Sebagian' : persen >= 20 ? 'Awal' : 'Belum',
    penjelasan: 'Rangsangan ketinggian baru bermakna di atas sekitar 1500 m. Penyesuaian pernapasan dan cairan berlangsung beberapa hari, sedangkan pertambahan sel darah merah memerlukan sekitar 3-4 pekan tinggal cukup lama tiap harinya.',
    saran: persen >= 80
      ? 'Sudah menyesuaikan. Ingat performa di ketinggian tetap lebih rendah daripada di permukaan laut, meskipun sudah teraklimatisasi.'
      : 'Pada hari-hari awal, turunkan intensitas dan jangan menilai kebugaran dari kecepatan — pada ketinggian, denyut jantung yang sama menghasilkan kecepatan yang lebih rendah. Perhatikan gejala penyakit ketinggian: nyeri kepala, mual, sulit tidur, dan sesak yang tidak wajar.',
  }
}

/** Penurunan performa daya tahan menurut ketinggian, sebagai gambaran kasar. */
export function penaltiKetinggian(meter: number): { pctVo2Turun: number; ket: string } {
  if (meter < 1000) return { pctVo2Turun: 0, ket: 'Di bawah 1000 m, pengaruhnya pada sebagian besar orang dapat diabaikan.' }
  // Sekitar 6% penurunan VO2max tiap 1000 m di atas 1000 m.
  const pct = +(((meter - 1000) / 1000) * 6).toFixed(1)
  return {
    pctVo2Turun: pct,
    ket: `Pada ${meter} m, kemampuan aerobik maksimal turun sekitar ${pct}% dibanding permukaan laut. Sesuaikan target kecepatan, bukan target denyut jantung — denyut Anda akan terasa lebih tinggi pada kecepatan yang lebih rendah, dan itu wajar.`,
  }
}
