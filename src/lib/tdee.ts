// ─────────────────────────────────────────────────────────────────────────────
// Perhitungan TDEE dan makronutrien — SATU sumber untuk halaman Macro Lab dan
// untuk ubin di beranda.
//
// Dipisahkan ke berkas sendiri bukan demi kerapian melainkan karena dua salinan
// rumus yang sama pasti akan berbeda suatu hari: yang satu diperbaiki, yang
// satu lagi terlupakan, dan pemakainya melihat dua angka kalori yang berbeda di
// aplikasi yang sama tanpa tahu mana yang benar. Angka yang bertentangan lebih
// buruk daripada angka yang tidak ada.
//
// DUA HAL YANG PALING SERING KELIRU, dan karena itu ditanam di sini:
//   1. PROTEIN DIHITUNG DARI MASSA TUBUH, bukan dari persentase kalori. Dua
//      orang berberat sama dengan kalori berbeda membutuhkan protein yang
//      hampir sama — yang menentukan adalah jaringan yang dipelihara.
//   2. LEMAK PUNYA LANTAI, bukan sekadar sisa. Menaruhnya sebagai sisa kalori
//      dapat menjatuhkannya di bawah 0,5 g/kg dan mengganggu hormon serta
//      penyerapan vitamin larut lemak. Karbohidratlah penyeimbangnya.
// ─────────────────────────────────────────────────────────────────────────────

export type TujuanGizi = 'defisit' | 'rawat' | 'surplus'
export type TingkatAktivitas = 'ringan' | 'sedang' | 'berat' | 'atlet'

export const TUJUAN_GIZI: { id: TujuanGizi; label: string; ringkas: string; faktor: number }[] = [
  { id: 'defisit', label: 'Lose weight', ringkas: 'About 20% below maintenance', faktor: 0.8 },
  { id: 'rawat', label: 'Maintain', ringkas: 'Matches your needs', faktor: 1 },
  { id: 'surplus', label: 'Build mass', ringkas: 'About 10% above maintenance', faktor: 1.1 },
]

export const AKTIVITAS_GIZI: { id: TingkatAktivitas; label: string; f: number }[] = [
  { id: 'ringan', label: 'Rarely train', f: 1.375 },
  { id: 'sedang', label: '3-4x a week', f: 1.55 },
  { id: 'berat', label: '5-6x a week', f: 1.725 },
  { id: 'atlet', label: 'Athlete / twice a day', f: 1.9 },
]

/** Protein per kg berat badan menurut tujuan — rentang konsensus ISSN/ACSM. */
export const PROTEIN_PER_KG: Record<TujuanGizi, [number, number]> = {
  defisit: [1.8, 2.4], // lebih tinggi saat defisit: menjaga otot
  rawat: [1.4, 1.8],
  surplus: [1.6, 2.2],
}

export interface MasukanTdee {
  beratKg: number
  tinggiCm: number
  umur: number
  sex?: string
  tujuan: TujuanGizi
  aktivitas: TingkatAktivitas
  /** Berapa kali makan sehari; dipakai untuk membagi sasaran per sekali makan. */
  makanPerHari?: number
}

export interface HasilTdee {
  bmr: number
  tdee: number
  target: number
  proteinG: number
  lemakG: number
  karboG: number
  proteinLo: number
  proteinHi: number
  pctP: number
  pctL: number
  pctK: number
  perMakan: { kkal: number; protein: number; karbo: number; lemak: number }
  seratG: number
  airL: number
}

export function hitungTdee(m: MasukanTdee): HasilTdee {
  const b = m.beratKg > 0 ? m.beratKg : 70
  const t = m.tinggiCm > 0 ? m.tinggiCm : 170
  const u = m.umur > 0 ? m.umur : 30

  // Mifflin-St Jeor (1990), Am J Clin Nutr 51(2):241-7.
  const bmr = 10 * b + 6.25 * t - 5 * u + (m.sex === 'F' ? -161 : 5)
  const tdee = bmr * (AKTIVITAS_GIZI.find((a) => a.id === m.aktivitas)?.f ?? 1.55)
  const target = tdee * (TUJUAN_GIZI.find((x) => x.id === m.tujuan)?.faktor ?? 1)

  const [pLo, pHi] = PROTEIN_PER_KG[m.tujuan]
  const proteinG = Math.round(b * ((pLo + pHi) / 2))
  const lemakG = Math.max(Math.round(b * 0.8), Math.round((target * 0.25) / 9))
  const karboG = Math.max(0, Math.round((target - proteinG * 4 - lemakG * 9) / 4))

  const perMakan = m.makanPerHari && m.makanPerHari > 0 ? m.makanPerHari : 3
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
    proteinG,
    lemakG,
    karboG,
    proteinLo: Math.round(b * pLo),
    proteinHi: Math.round(b * pHi),
    pctP: Math.round(((proteinG * 4) / target) * 100),
    pctL: Math.round(((lemakG * 9) / target) * 100),
    pctK: Math.round(((karboG * 4) / target) * 100),
    perMakan: {
      kkal: Math.round(target / perMakan),
      protein: Math.round(proteinG / perMakan),
      karbo: Math.round(karboG / perMakan),
      lemak: Math.round(lemakG / perMakan),
    },
    seratG: Math.round((target / 1000) * 14), // 14 g per 1000 kkal (Institute of Medicine)
    // 33 mL/kg adalah aturan praktis yang lazim, bukan angka hasil penelitian.
    airL: Math.round(b * 0.033 * 10) / 10,
  }
}
