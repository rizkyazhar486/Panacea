// Optika akomodasi dan skala desibel.
//
// KENAPA DUA GUGUS INI SATU BERKAS. Keduanya ada di `bodyPhysiology.ts` hanya
// sebagai TEKS -- P = 1/f, E = hv, SPL = 20 log10(p/p0), V = dP/R -- dan tidak
// satu pun pernah dihitung. Keduanya juga berbagi satu pelajaran yang sama:
//
//   PERUBAHAN YANG LINEAR PADA SATU SKALA TIDAK LINEAR PADA SKALA LAIN.
//
// Mata diukur dalam dioptri, yang linear; tetapi yang dialami orang adalah
// JARAK, yang merupakan kebalikannya. Kehilangan dua dioptri yang sama besar
// menggeser titik dekat beberapa sentimeter pada usia muda dan lebih dari satu
// meter pada usia lanjut. Itu hiperbola, bukan garis, dan tidak ada tabel yang
// membuatnya terasa.
//
// Telinga diukur dalam desibel, yang logaritmik; tetapi yang sampai ke gendang
// telinga adalah TEKANAN. Melipatduakan tekanan hanya menambah 6 dB, dan
// menjumlahkan dua sumber yang sama keras menambah 3 dB -- bukan 6, dan sama
// sekali bukan dua kali lipat.
//
// Semua fungsi di sini juga yang MENGGAMBAR kurvanya. Kalau gambar dan angka
// punya dua sumber, gambarnya bisa berbohong sementara uji tetap lulus.

export const TETAPAN_INDERA = {
  /** Tekanan acuan pendengaran, Pa (20 µPa). */
  P_ACUAN: 20e-6,
  /** Tetapan Planck, J·s. */
  PLANCK: 6.62607015e-34,
  /** Laju cahaya, m/s. */
  CAHAYA: 299792458,
} as const

// ── Optika ────────────────────────────────────────────────────────────────

/** Kekuatan lensa, dioptri, dari jarak fokus dalam METER. */
export function kekuatanLensa(fokusMeter: number): number {
  if (!Number.isFinite(fokusMeter) || fokusMeter === 0) return Number.NaN
  return 1 / fokusMeter
}

/**
 * Titik dekat, meter, dari amplitudo akomodasi.
 *
 * Inilah kebalikan yang menjadi seluruh pelajarannya: titik dekat adalah
 * 1/amplitudo, sehingga amplitudo yang turun linear memindahkan titik dekat
 * makin jauh dengan percepatan. Amplitudo nol berarti tidak ada titik dekat
 * sama sekali -- dikembalikan Infinity, bukan angka besar yang mengarang.
 */
export function titikDekat(amplitudoDioptri: number): number {
  if (!Number.isFinite(amplitudoDioptri) || amplitudoDioptri < 0) return Number.NaN
  if (amplitudoDioptri === 0) return Number.POSITIVE_INFINITY
  return 1 / amplitudoDioptri
}

/**
 * Amplitudo akomodasi lazim menurut usia (perkiraan Hofstetter), dioptri.
 *
 * Perkiraan RUJUKAN populasi untuk pengajaran, bukan hasil ukur seseorang dan
 * bukan ambang untuk meresepkan apa pun. Dijepit di nol: amplitudo negatif
 * tidak ada artinya.
 */
export function amplitudoLazimUsia(usiaTahun: number): number {
  if (!Number.isFinite(usiaTahun) || usiaTahun < 0) return Number.NaN
  return Math.max(0, 15 - 0.25 * usiaTahun)
}

/** Energi foton, joule, dari panjang gelombang dalam NANOMETER. */
export function energiFoton(panjangGelombangNm: number): number {
  if (!Number.isFinite(panjangGelombangNm) || panjangGelombangNm <= 0) return Number.NaN
  return (TETAPAN_INDERA.PLANCK * TETAPAN_INDERA.CAHAYA) / (panjangGelombangNm * 1e-9)
}

/** Energi foton dalam elektronvolt, satuan yang lebih terbaca. */
export function energiFotonEv(panjangGelombangNm: number): number {
  const j = energiFoton(panjangGelombangNm)
  return Number.isFinite(j) ? j / 1.602176634e-19 : Number.NaN
}

// ── Akustik ───────────────────────────────────────────────────────────────

/** Tingkat tekanan bunyi, dB, dari tekanan dalam PASCAL. */
export function tingkatTekanan(tekananPa: number): number {
  if (!Number.isFinite(tekananPa) || tekananPa <= 0) return Number.NaN
  return 20 * Math.log10(tekananPa / TETAPAN_INDERA.P_ACUAN)
}

/** Tekanan, Pa, dari tingkat tekanan bunyi dalam dB. Kebalikan yang tepat. */
export function tekananDariDb(db: number): number {
  if (!Number.isFinite(db)) return Number.NaN
  return TETAPAN_INDERA.P_ACUAN * Math.pow(10, db / 20)
}

/**
 * Jumlah beberapa sumber TAK KOHEREN, dB.
 *
 * Dijumlahkan pada INTENSITAS, bukan pada desibel dan bukan pada tekanan. Dua
 * sumber yang sama keras memberi +3 dB; menjumlahkan desibelnya akan memberi
 * angka dua kali lipat yang tidak berarti apa-apa secara fisika.
 */
export function jumlahSumber(db: readonly number[]): number {
  if (!db.length || db.some((d) => !Number.isFinite(d))) return Number.NaN
  return 10 * Math.log10(db.reduce((t, d) => t + Math.pow(10, d / 10), 0))
}

/** Aliran udara, dari beda tekanan dan hambatan (hubungan Ohm sederhana). */
export function aliranUdara(bedaTekanan: number, hambatan: number): number {
  if (!Number.isFinite(bedaTekanan) || !Number.isFinite(hambatan) || hambatan <= 0) return Number.NaN
  return bedaTekanan / hambatan
}

// ── Deret untuk kurva ─────────────────────────────────────────────────────

export interface TitikUsia { usia: number; amplitudo: number; titikDekatCm: number }

/** Titik dekat terhadap usia. Hiperbola, bukan garis. */
export function deretTitikDekat(usiaMin = 10, usiaMaks = 70, langkah = 1): TitikUsia[] {
  const titik: TitikUsia[] = []
  for (let u = usiaMin; u <= usiaMaks + 1e-9; u += langkah) {
    const a = amplitudoLazimUsia(u)
    const d = titikDekat(a)
    titik.push({ usia: u, amplitudo: a, titikDekatCm: Number.isFinite(d) ? d * 100 : Number.POSITIVE_INFINITY })
  }
  return titik
}

export interface TitikDb { db: number; tekananPa: number }

/** Tekanan terhadap desibel. Eksponensial, bukan garis. */
export function deretTekanan(dbMin = 0, dbMaks = 120, langkah = 1): TitikDb[] {
  const titik: TitikDb[] = []
  for (let d = dbMin; d <= dbMaks + 1e-9; d += langkah) titik.push({ db: d, tekananPa: tekananDariDb(d) })
  return titik
}

export const RENTANG_INDERA = {
  usia: { min: 10, maks: 70 },
  amplitudo: { min: 0, maks: 15 },
  db: { min: 0, maks: 120 },
  sumber: { min: 1, maks: 10 },
  panjangGelombang: { min: 380, maks: 740 },
} as const
