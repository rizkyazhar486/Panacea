// Mesin ventilasi (menit vs alveolar) dan membran tereksitasi (Nernst, arus).
//
// KENAPA SATU BERKAS. Dua gugusan ini sebelumnya hanya hidup sebagai TEKS di
// `bodyPhysiology.ts` -- rumus yang dicetak tetapi tidak pernah dihitung. Teks
// tidak bisa salah, dan karena itu tidak bisa mengajar. Keduanya dipasang di
// satu mesin karena keduanya berbagi satu pelajaran: tanda dan pengurangan
// per-satuan menentukan hasilnya, bukan besaran kotornya.
//
// Semua fungsi di sini juga yang MENGGAMBAR kurva di panelnya. Kalau gambar
// dan angka punya dua sumber, gambarnya bisa berbohong sementara setiap uji
// tetap lulus.

// ── Tetapan fisika, satu sumber ────────────────────────────────────────────
export const TETAPAN_MEMBRAN = {
  /** Tetapan gas universal, J/(mol·K). */
  R: 8.314462618,
  /** Tetapan Faraday, C/mol. */
  F: 96485.33212,
  /** Nol Celsius dalam Kelvin. */
  NOL_C: 273.15,
} as const

// ── Ventilasi ──────────────────────────────────────────────────────────────

export interface MasukanVentilasi {
  /** Laju napas, kali per menit. */
  rr: number
  /** Volume tidal, mL per napas. */
  vt: number
  /** Ruang rugi anatomik, mL per napas. MASUKAN, bukan hasil ukur. */
  vd: number
}

/** Ventilasi menit, L/menit. Tidak mengurangi apa pun: inilah besaran kotor
 *  yang bisa tampak tenang sementara pertukaran gas runtuh. */
export function ventilasiMenit(rr: number, vt: number): number {
  if (!Number.isFinite(rr) || !Number.isFinite(vt)) return Number.NaN
  return (rr * vt) / 1000
}

/** Ventilasi alveolar, L/menit.
 *
 *  Ruang rugi dikurangi PER NAPAS -- itulah seluruh pelajarannya. Napas yang
 *  lebih kecil dari ruang rugi tidak memventilasi apa pun; ia tidak
 *  "meng-anti-ventilasi", jadi hasilnya dijepit di nol, bukan dibiarkan
 *  negatif. Membiarkannya negatif akan menggambar kurva yang menukik ke bawah
 *  sumbu dan mengajarkan besaran yang tidak ada di alam. */
export function ventilasiAlveolar({ rr, vt, vd }: MasukanVentilasi): number {
  if (![rr, vt, vd].every(Number.isFinite)) return Number.NaN
  const efektif = Math.max(0, vt - vd)
  return (rr * efektif) / 1000
}

/** Fraksi ruang rugi VD/VT. Tidak terdefinisi tanpa napas. */
export function fraksiRuangRugi(vt: number, vd: number): number {
  if (!Number.isFinite(vt) || !Number.isFinite(vd) || vt <= 0) return Number.NaN
  return vd / vt
}

export interface TitikNapas {
  rr: number
  vt: number
  menit: number
  alveolar: number
  fraksi: number
}

/** Deret laju-napas pada VENTILASI MENIT TETAP.
 *
 *  Volume tidal dipaksa mengikuti laju agar hasil kalinya tetap; yang tersisa
 *  hanyalah pengurangan ruang rugi yang makin sering. Inilah satu-satunya
 *  alasan kurva ini digambar: V̇E datar, V̇A runtuh. */
export function deretNapasCepatDangkal(veTarget: number, vd: number, rrMin = 6, rrMaks = 60, langkah = 1): TitikNapas[] {
  const titik: TitikNapas[] = []
  for (let rr = rrMin; rr <= rrMaks + 1e-9; rr += langkah) {
    const vt = (veTarget * 1000) / rr
    titik.push({
      rr,
      vt,
      menit: ventilasiMenit(rr, vt),
      alveolar: ventilasiAlveolar({ rr, vt, vd }),
      fraksi: fraksiRuangRugi(vt, vd),
    })
  }
  return titik
}

// ── Membran tereksitasi ────────────────────────────────────────────────────

export interface MasukanNernst {
  /** Konsentrasi ekstrasel, mmol/L. */
  luar: number
  /** Konsentrasi intrasel, mmol/L. */
  dalam: number
  /** Valensi ion (K⁺ = 1, Ca²⁺ = 2, Cl⁻ = −1). */
  z: number
  /** Suhu, °C. */
  suhuC: number
}

/** Potensial keseimbangan Nernst, mV.
 *
 *  E = (RT/zF)·ln([luar]/[dalam]). Suhu dan valensi ikut dihitung, tidak
 *  dipendekkan menjadi tetapan 61,5/z: pendekan itu mengunci suhu pada 37 °C
 *  diam-diam. Konsentrasi nol atau negatif tidak punya logaritma nyata dan
 *  mengembalikan NaN, bukan angka yang tampak masuk akal. */
export function potensialNernst({ luar, dalam, z, suhuC }: MasukanNernst): number {
  if (![luar, dalam, z, suhuC].every(Number.isFinite)) return Number.NaN
  if (luar <= 0 || dalam <= 0) return Number.NaN
  if (z === 0) return Number.NaN
  const T = suhuC + TETAPAN_MEMBRAN.NOL_C
  if (T <= 0) return Number.NaN
  const volt = (TETAPAN_MEMBRAN.R * T) / (z * TETAPAN_MEMBRAN.F) * Math.log(luar / dalam)
  return volt * 1000
}

export interface MasukanArus {
  /** Konduktansi, nS. */
  g: number
  /** Potensial membran, mV. */
  v: number
  /** Potensial balik, mV. */
  erev: number
}

/** Gaya dorong (V − Erev), mV. Tandanya adalah seluruh isinya. */
export function gayaDorong(v: number, erev: number): number {
  if (!Number.isFinite(v) || !Number.isFinite(erev)) return Number.NaN
  return v - erev
}

/** Arus membran I = g(V − Erev), pA (nS × mV = pA).
 *
 *  Tepat nol di V = Erev dan berbalik tanda di kedua sisinya. Tanda positif
 *  berarti arus keluar menurut kesepakatan lazim. */
export function arusMembran({ g, v, erev }: MasukanArus): number {
  if (![g, v, erev].every(Number.isFinite)) return Number.NaN
  // `+ 0` menormalkan −0 menjadi 0: arus nol tidak punya arah, dan −0 akan
  // membuat pemeriksaan tanda melaporkan arus masuk di titik baliknya.
  return g * gayaDorong(v, erev) + 0
}

export interface TitikArus { v: number; i: number }

/** Deret I-V yang digambar panel. Dihitung oleh `arusMembran` yang sama yang
 *  mencetak angkanya. */
export function deretArus(g: number, erev: number, vMin = -120, vMaks = 60, langkah = 2): TitikArus[] {
  const titik: TitikArus[] = []
  for (let v = vMin; v <= vMaks + 1e-9; v += langkah) {
    titik.push({ v, i: arusMembran({ g, v, erev }) })
  }
  return titik
}

/** Ion rujukan: hanya GRADIEN-nya yang disimpan. Potensialnya dihitung, tidak
 *  pernah ditulis, supaya nilai klasik (K⁺ ≈ −90 mV, Na⁺ ≈ +60 mV) menjadi
 *  bukti mesinnya benar, bukan sekadar teks yang dipajang. */
export const ION_RUJUKAN = [
  { id: 'k', nama: 'Potassium (K⁺)', luar: 4, dalam: 140, z: 1 },
  { id: 'na', nama: 'Sodium (Na⁺)', luar: 145, dalam: 15, z: 1 },
  { id: 'ca', nama: 'Calcium (Ca²⁺)', luar: 2, dalam: 0.0001, z: 2 },
  { id: 'cl', nama: 'Chloride (Cl⁻)', luar: 110, dalam: 10, z: -1 },
] as const

/** Batas penggeser: satu sumber untuk panel dan ujinya. */
export const RENTANG_VM = {
  rr: { min: 6, maks: 60 },
  vt: { min: 100, maks: 900 },
  vd: { min: 50, maks: 350 },
  ve: { min: 3, maks: 12 },
  g: { min: 1, maks: 40 },
  v: { min: -120, maks: 60 },
  suhuC: { min: 0, maks: 45 },
} as const
