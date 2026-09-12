// Kinetika urea hemodialisis — model satu-kompartemen bervolume berubah.
//
// KENAPA DIHITUNG, BUKAN DITULISKAN. Kt/V adalah satu-satunya angka dialisis
// yang semua orang hafal dan hampir tidak ada yang bisa menurunkan. Ia bukan
// hasil pengukuran: ia adalah akibat dari satu persamaan diferensial yang
// sangat sederhana, dan bentuk kurvanya — melandai, tidak lurus — adalah alasan
// menambah waktu memberi hasil yang makin sedikit. Itu tidak terbaca dari tabel.
//
// SATU SUMBER KEBENARAN. Fungsi yang sama dipakai untuk menggambar kurva dan
// untuk mencetak angkanya. Kalau keduanya berasal dari kode berbeda, gambarnya
// bisa berbohong sementara seluruh uji tetap hijau.
//
// SATUAN, dipegang konsisten di seluruh berkas:
//   K   klirens dialiser        mL/menit
//   V   volume distribusi urea  mL (masukan pengguna dalam liter)
//   C   konsentrasi urea        mg/dL
//   G   laju generasi urea      mg/menit
//   Quf laju ultrafiltrasi      mL/menit
//   t   waktu                   menit (masukan pengguna dalam jam)
//
// Neraca massa: d(C·V)/dt = 100·G − K·C  dengan  dV/dt = −Quf.
// Diuraikan:    dC/dt = (100·G − (K − Quf)·C) / V(t)
// Faktor 100 menjembatani mg/dL terhadap volume dalam mL.

export type SesiDialisis = {
  /** Klirens urea dialiser, mL/menit. */
  klirens: number
  /** Volume distribusi urea pra-dialisis, liter. */
  volumeAwal: number
  /** Durasi sesi, jam. */
  durasiJam: number
  /** Generasi urea endogen, mg/menit. */
  generasi: number
  /** Ultrafiltrasi total sepanjang sesi, liter. */
  ultrafiltrasi: number
  /** Konsentrasi urea pra-dialisis, mg/dL. */
  ureaAwal: number
}

const MENIT_PER_JAM = 60
const ML_PER_L = 1000

/** Laju ultrafiltrasi, mL/menit. */
export function lajuUltrafiltrasi(s: SesiDialisis): number {
  return (s.ultrafiltrasi * ML_PER_L) / (s.durasiJam * MENIT_PER_JAM)
}

/** Volume distribusi pada menit ke-t, mL. */
export function volumePada(s: SesiDialisis, tMenit: number): number {
  return s.volumeAwal * ML_PER_L - lajuUltrafiltrasi(s) * tMenit
}

/**
 * Sesi yang tidak bisa dimodelkan sama sekali.
 *
 * KONTROL NEGATIF. Angka yang tidak bermakna harus MENOLAK, bukan tercetak.
 * Volume nol membuat dC/dt tak terhingga; klirens nol membuat Kt/V nol yang
 * tidak berarti "dialisis ringan" melainkan "tidak ada dialisis"; ultrafiltrasi
 * yang melebihi volume distribusi mengeringkan kompartemennya di tengah sesi
 * dan seluruh lintasannya tidak punya arti fisik.
 */
export function sesiSahih(s: SesiDialisis): boolean {
  if (!Number.isFinite(s.klirens) || !Number.isFinite(s.volumeAwal)) return false
  if (!Number.isFinite(s.durasiJam) || !Number.isFinite(s.generasi)) return false
  if (!Number.isFinite(s.ultrafiltrasi) || !Number.isFinite(s.ureaAwal)) return false
  if (s.klirens <= 0 || s.volumeAwal <= 0 || s.durasiJam <= 0) return false
  if (s.ureaAwal <= 0 || s.generasi < 0 || s.ultrafiltrasi < 0) return false
  // Volume akhir harus tetap positif dengan marjin — bukan sekadar tak negatif.
  if (s.ultrafiltrasi >= s.volumeAwal * 0.9) return false
  return true
}

/**
 * Penyelesaian analitik dari persamaan di atas.
 *
 * Dengan a = K − Quf dan Cinf = 100·G/a:
 *   C(t) = Cinf + (C0 − Cinf)·(V(t)/V0)^(a/Quf)
 * Batas Quf → 0 adalah peluruhan eksponensial biasa; dipakai di bawah ambang
 * agar pangkat a/Quf tidak meledak.
 */
export function konsentrasiPada(s: SesiDialisis, tMenit: number): number {
  if (!sesiSahih(s)) return NaN
  if (tMenit < 0 || tMenit > s.durasiJam * MENIT_PER_JAM + 1e-9) return NaN
  const K = s.klirens
  const quf = lajuUltrafiltrasi(s)
  const v0 = s.volumeAwal * ML_PER_L
  const gEff = 100 * s.generasi

  if (quf < 1e-9) {
    const cInf = gEff / K
    return cInf + (s.ureaAwal - cInf) * Math.exp((-K * tMenit) / v0)
  }
  const a = K - quf
  const v = v0 - quf * tMenit
  if (Math.abs(a) < 1e-9) {
    // Klirens persis sama dengan ultrafiltrasi: massa hanya berubah oleh generasi.
    return (s.ureaAwal * v0 + gEff * tMenit) / v
  }
  const cInf = gEff / a
  return cInf + (s.ureaAwal - cInf) * Math.pow(v / v0, a / quf)
}

/** Satu langkah Euler maju dari persamaan mentahnya — pembanding independen. */
export function langkahEuler(s: SesiDialisis, c: number, tMenit: number, dt: number): number {
  const quf = lajuUltrafiltrasi(s)
  const v = volumePada(s, tMenit)
  const dc = (100 * s.generasi - (s.klirens - quf) * c) / v
  return c + dc * dt
}

/** Lintasan seluruh sesi lewat Euler maju, dari persamaannya, bukan solusinya. */
export function lintasanEuler(s: SesiDialisis, langkah: number): number[] {
  if (!sesiSahih(s) || langkah < 1) return []
  const total = s.durasiJam * MENIT_PER_JAM
  const dt = total / langkah
  const keluar: number[] = [s.ureaAwal]
  let c = s.ureaAwal
  for (let i = 0; i < langkah; i++) {
    c = langkahEuler(s, c, i * dt, dt)
    keluar.push(c)
  }
  return keluar
}

export type TitikLintasan = { menit: number; urea: number; volume: number }

/** Lintasan analitik — INI yang digambar sekaligus yang dicetak. */
export function lintasan(s: SesiDialisis, titik = 96): TitikLintasan[] {
  if (!sesiSahih(s)) return []
  const total = s.durasiJam * MENIT_PER_JAM
  const keluar: TitikLintasan[] = []
  for (let i = 0; i <= titik; i++) {
    const t = (total * i) / titik
    keluar.push({ menit: t, urea: konsentrasiPada(s, t), volume: volumePada(s, t) / ML_PER_L })
  }
  return keluar
}

/** Urea pasca-dialisis, mg/dL. */
export function ureaAkhir(s: SesiDialisis): number {
  return konsentrasiPada(s, s.durasiJam * MENIT_PER_JAM)
}

/** Rasio reduksi urea, 0–1. URR = 1 − Cpost/Cpre. */
export function rasioReduksiUrea(s: SesiDialisis): number {
  const akhir = ureaAkhir(s)
  if (!Number.isFinite(akhir)) return NaN
  return 1 - akhir / s.ureaAwal
}

/** Identitas URR ↔ Kt/V untuk kasus tanpa UF dan tanpa generasi. */
export function urrDariKtv(ktv: number): number {
  if (!Number.isFinite(ktv) || ktv <= 0) return NaN
  return 1 - Math.exp(-ktv)
}

export function ktvDariUrr(urr: number): number {
  if (!Number.isFinite(urr) || urr <= 0 || urr >= 1) return NaN
  return -Math.log(1 - urr)
}

/**
 * Fraksi air tubuh total terhadap berat badan yang dipakai untuk mengubah
 * volume distribusi urea menjadi berat, karena rumus Daugirdas membagi
 * ultrafiltrasi dengan BERAT pasca-dialisis dan panel ini tidak memegang berat
 * siapa pun. 0,55 adalah angka buku teks untuk air tubuh total, bukan
 * pengukuran atas orang tertentu.
 */
export const FRAKSI_AIR_TUBUH = 0.55

/**
 * Kt/V langsung dari parameter mesin: K·t dibagi volume PASCA-dialisis.
 *
 * Dengan ultrafiltrasi, "V" tidak tunggal, jadi pilihannya harus disebut, bukan
 * disembunyikan. Volume pasca dipilih karena itulah yang membuat rute ini dan
 * rute Daugirdas saling mendekat pada rentang yang digambar; volume pra
 * meleset dua kali lebih jauh (diukur, bukan ditebak — lihat uji).
 */
export function ktvLangsung(s: SesiDialisis): number {
  if (!sesiSahih(s)) return NaN
  const t = s.durasiJam * MENIT_PER_JAM
  return (s.klirens * t) / volumePada(s, t)
}

/**
 * Perkiraan Daugirdas generasi kedua, dihitung dari rasio pra/pasca saja.
 *
 *   spKt/V = −ln(R − 0,008·t) + (4 − 3,5·R)·UF/W
 *
 * t dalam jam, UF dalam liter, W berat pasca dalam kg. Ini rute yang sepenuhnya
 * TERPISAH dari `ktvLangsung`: ia tidak pernah melihat K, hanya rasio pra/pasca
 * yang dihasilkan integrasi. Kesepakatan keduanya adalah uji terkuat yang
 * dipunyai berkas ini.
 */
export function ktvDaugirdas(s: SesiDialisis): number {
  if (!sesiSahih(s)) return NaN
  const akhir = ureaAkhir(s)
  if (!Number.isFinite(akhir)) return NaN
  const r = akhir / s.ureaAwal
  const t = s.durasiJam
  const dalamLog = r - 0.008 * t
  // Rasio yang tidak turun, atau turun sampai argumen log tidak positif, TIDAK
  // punya Kt/V. Kembalikan NaN daripada mencetak angka.
  if (!(dalamLog > 0) || r >= 1) return NaN
  const beratAkhir = volumePada(s, t * MENIT_PER_JAM) / ML_PER_L / FRAKSI_AIR_TUBUH
  if (!(beratAkhir > 0)) return NaN
  return -Math.log(dalamLog) + (4 - 3.5 * r) * (s.ultrafiltrasi / beratAkhir)
}

/** Selisih mutlak kedua rute Kt/V. NaN kalau salah satunya menolak. */
export function selisihKtv(s: SesiDialisis): number {
  return Math.abs(ktvLangsung(s) - ktvDaugirdas(s))
}

/**
 * Klirens urea dialiser dari KoA, aliran darah, dan aliran dialisat
 * (aliran berlawanan arah):
 *   K = Qb·(e^x − 1)/(e^x − Qb/Qd),  x = KoA·(1 − Qb/Qd)/Qb
 */
export function klirensDialiser(qb: number, qd: number, koa: number): number {
  if (!(qb > 0) || !(qd > 0) || !(koa > 0)) return NaN
  const z = qb / qd
  if (Math.abs(1 - z) < 1e-9) {
    // Aliran seimbang: batasnya K = KoA·Qb/(KoA + Qb).
    return (koa * qb) / (koa + qb)
  }
  const x = (koa * (1 - z)) / qb
  const e = Math.exp(x)
  const penyebut = e - z
  if (Math.abs(penyebut) < 1e-12) return NaN
  const k = (qb * (e - 1)) / penyebut
  return Math.min(k, qb)
}

/**
 * REBOUND — dinyatakan, tidak dipalsukan.
 *
 * Model satu-kompartemen menganggap urea tercampur seketika di seluruh tubuh.
 * Karena itu ia TIDAK BISA memperlihatkan rebound pasca-dialisis: dalam model
 * ini konsentrasi berhenti di titik akhirnya dan diam. Pada tubuh nyata urea
 * dari kompartemen intrasel mengalir kembali ke darah selama ~30–60 menit,
 * sehingga Kt/V terekuilibrasi selalu LEBIH RENDAH daripada Kt/V satu-kompartemen.
 * Selisih itu memerlukan model dua kompartemen, dan berkas ini tidak punya satu.
 */
export const CATATAN_REBOUND =
  'A single-pool model cannot show post-dialysis rebound: it assumes urea mixes ' +
  'instantly throughout the body, so the concentration simply stops at the end of ' +
  'the session. In a real body urea returns from the intracellular compartment over ' +
  'roughly half an hour, so equilibrated Kt/V is always lower than the single-pool ' +
  'value drawn here. That difference needs a two-compartment model, and this panel ' +
  'does not have one — no figure here is corrected for it.'

/**
 * Toleransi kesepakatan antara kedua rute Kt/V, DAN rentang tempat toleransi itu
 * berlaku. Daugirdas adalah kecocokan regresi, bukan identitas: suku −0,008·t
 * mengoreksi generasi urea yang diandaikan ada, sehingga kedua rute melebar di
 * luar rentang adekuasi lazim. Selisih maksimum terukur pada kisi di bawah
 * adalah 0,114; ambangnya 0,15.
 */
export const TOLERANSI_KTV = 0.15
export const RENTANG_KESEPAKATAN = { ktvMin: 0.8, ktvMaks: 1.8, ufMaksLiter: 3, generasiMin: 5, generasiMaks: 9 }
