// Persamaan gas alveolar dan selisih A-a.
//
// KENAPA INI DIHITUNG, BUKAN DICETAK. `bodyPhysiology.ts` memuat
// `PAO2 = FiO2(Patm - PH2O) - PaCO2/R` sebagai TEKS. Rumus yang dicetak tidak
// pernah bisa salah, dan karena itu tidak pernah bisa mengajar. Pelajaran
// sebenarnya hanya muncul kalau angkanya digerakkan:
//
//   1. Pada udara ruang, PaCO2 yang naik MENURUNKAN oksigen alveolar --
//      hipoventilasi sendirian membuat hipoksemia, dan selisih A-a-nya tetap.
//      Jadi selisih A-a yang normal pada pasien hipoksemik bukan berarti
//      "paru baik-baik saja"; ia justru menunjuk ke penyebab di luar paru.
//   2. Menaikkan FiO2 hampir menghapus kemiringan itu. Suku PaCO2/R tetap,
//      tetapi suku pertama tumbuh jauh lebih cepat.
//   3. Di ketinggian, Patm turun, PAO2 ikut turun, dan selisih A-a TIDAK
//      berubah sama sekali.
//
// Ketiganya adalah pernyataan tentang BENTUK KURVA, bukan tentang satu angka,
// sehingga tidak ada tabel yang bisa menyampaikannya.
//
// Fungsi di berkas ini juga yang menggambar kurva di panelnya. Kalau gambar
// dan angka punya dua sumber, gambarnya bisa berbohong sementara setiap uji
// tetap lulus.

export const TETAPAN_GAS = {
  /** Tekanan barometrik permukaan laut, mmHg. */
  PATM_LAUT: 760,
  /** Tekanan uap air jenuh pada 37 C, mmHg. Tubuh melembapkan udara inspirasi
   *  sampai jenuh sebelum mencapai alveolus, jadi suku ini SELALU dikurangi. */
  PH2O_37C: 47,
  /** Hasil bagi pernapasan lazim untuk diet campuran. MASUKAN asumsi, bukan
   *  hasil ukur. */
  R_LAZIM: 0.8,
} as const

/** Tekanan barometrik menurut ketinggian, mmHg (model atmosfer baku).
 *
 *  Fraksi oksigen udara TIDAK berubah dengan ketinggian -- yang turun hanyalah
 *  tekanan totalnya. Itulah sebabnya ketinggian menurunkan PAO2 tanpa menyentuh
 *  selisih A-a. */
export function tekananBarometrik(meter: number): number {
  if (!Number.isFinite(meter) || meter < 0) return Number.NaN
  return TETAPAN_GAS.PATM_LAUT * Math.pow(1 - 2.25577e-5 * meter, 5.25588)
}

/** Tekanan oksigen inspirasi yang dilembapkan, mmHg.
 *
 *  Dipisahkan dari PAO2 dengan sengaja: PIO2 adalah apa yang MASUK, PAO2 apa
 *  yang tersisa setelah karbon dioksida menempati ruangnya. */
export function tekananInspirasi(fio2: number, patm: number = TETAPAN_GAS.PATM_LAUT): number {
  if (!Number.isFinite(fio2) || !Number.isFinite(patm)) return Number.NaN
  if (fio2 <= 0 || fio2 > 1) return Number.NaN
  if (patm <= TETAPAN_GAS.PH2O_37C) return Number.NaN
  return fio2 * (patm - TETAPAN_GAS.PH2O_37C)
}

export interface MasukanAlveolar {
  /** Fraksi oksigen inspirasi, 0 < FiO2 <= 1. */
  fio2: number
  /** PaCO2 arteri, mmHg. */
  paco2: number
  /** Tekanan barometrik, mmHg. */
  patm?: number
  /** Hasil bagi pernapasan. */
  r?: number
}

/** Tekanan oksigen alveolar, mmHg.
 *
 *  Dijepit di nol: karbon dioksida dapat mendesak oksigen keluar sepenuhnya,
 *  tetapi tekanan parsial negatif tidak ada di alam dan menggambarnya akan
 *  mengajarkan besaran yang tidak pernah wujud. */
export function tekananAlveolar({ fio2, paco2, patm = TETAPAN_GAS.PATM_LAUT, r = TETAPAN_GAS.R_LAZIM }: MasukanAlveolar): number {
  if (!Number.isFinite(paco2) || paco2 < 0) return Number.NaN
  if (!Number.isFinite(r) || r <= 0) return Number.NaN
  const pio2 = tekananInspirasi(fio2, patm)
  if (!Number.isFinite(pio2)) return Number.NaN
  return Math.max(0, pio2 - paco2 / r)
}

/** Selisih alveolar-arteri, mmHg.
 *
 *  Ini BUKAN besaran ukur: PAO2 dihitung, PaO2 diukur. Selisih negatif berarti
 *  masukannya tidak konsisten (PaO2 tidak dapat melampaui PAO2 pada model satu
 *  kompartemen ini), jadi dikembalikan NaN alih-alih dicetak. */
export function selisihAa(pao2Alveolar: number, pao2Arteri: number): number {
  if (!Number.isFinite(pao2Alveolar) || !Number.isFinite(pao2Arteri)) return Number.NaN
  if (pao2Arteri < 0) return Number.NaN
  const d = pao2Alveolar - pao2Arteri
  return d < 0 ? Number.NaN : d
}

/** Selisih A-a yang LAZIM pada usia tertentu di udara ruang, mmHg.
 *
 *  Perkiraan rujukan pengajaran (usia/4 + 4), bukan ambang diagnostik dan
 *  bukan batas normal untuk seseorang. Nilainya naik dengan usia karena
 *  kesepadanan ventilasi-perfusi melebar, bukan karena paru "memburuk". */
export function selisihAaLazimUsia(usiaTahun: number): number {
  if (!Number.isFinite(usiaTahun) || usiaTahun < 0) return Number.NaN
  return usiaTahun / 4 + 4
}

export interface TitikGas {
  x: number
  pio2: number
  pao2: number
  aa: number
}

/** Deret PAO2 terhadap PaCO2 pada FiO2 tetap.
 *
 *  Kemiringannya persis -1/R dan tidak bergantung pada FiO2 sama sekali; yang
 *  digeser FiO2 hanyalah seluruh kurvanya ke atas. Itulah sebabnya dua kurva
 *  digambar berdampingan alih-alih satu. */
export function deretTerhadapPaco2(
  fio2: number,
  paco2Min = 20,
  paco2Maks = 90,
  langkah = 1,
  patm: number = TETAPAN_GAS.PATM_LAUT,
  pao2Arteri?: number,
): TitikGas[] {
  const titik: TitikGas[] = []
  for (let paco2 = paco2Min; paco2 <= paco2Maks + 1e-9; paco2 += langkah) {
    const pao2 = tekananAlveolar({ fio2, paco2, patm })
    titik.push({
      x: paco2,
      pio2: tekananInspirasi(fio2, patm),
      pao2,
      aa: pao2Arteri === undefined ? Number.NaN : selisihAa(pao2, pao2Arteri),
    })
  }
  return titik
}

/** Deret PAO2 terhadap ketinggian, pada FiO2 dan PaCO2 tetap. */
export function deretTerhadapKetinggian(
  fio2: number,
  paco2: number,
  meterMaks = 6000,
  langkah = 100,
): TitikGas[] {
  const titik: TitikGas[] = []
  for (let m = 0; m <= meterMaks + 1e-9; m += langkah) {
    const patm = tekananBarometrik(m)
    titik.push({
      x: m,
      pio2: tekananInspirasi(fio2, patm),
      pao2: tekananAlveolar({ fio2, paco2, patm }),
      aa: Number.NaN,
    })
  }
  return titik
}

/** Rentang kendali panel. Satu sumber supaya grafik dan penggeser tidak pernah
 *  memakai batas yang berbeda. */
export const RENTANG_GAS = {
  fio2: { min: 0.21, maks: 1.0 },
  paco2: { min: 20, maks: 90 },
  pao2Arteri: { min: 20, maks: 150 },
  ketinggian: { min: 0, maks: 6000 },
  usia: { min: 18, maks: 90 },
} as const
