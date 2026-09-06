// ─────────────────────────────────────────────────────────────────────────────
// UMUR BIOLOGIS DAN BEBAN FISIOLOGIS — hanya yang koefisiennya bisa dirujuk.
//
// Berkas ini sengaja MEMBATASI diri pada persamaan yang sudah diterbitkan dan
// konstantanya tetap, karena di bidang inilah angka palsu paling mudah dijual:
// "umur biologis" apa pun bisa dikarang dari rumus apa pun, terlihat ilmiah,
// dan tidak ada yang bisa membantahnya tanpa membuka sumbernya.
//
// Yang ADA di sini, beserta sumbernya:
//   PhenoAge        Levine ML dkk. (2018) Aging 10(4):573-591. Sembilan penanda
//                   darah ditambah usia, dengan koefisien Gompertz yang
//                   diterbitkan di makalah itu.
//   eGFR CKD-EPI    Inker LA dkk. (2021) NEJM 385:1737-1749 — persamaan tanpa
//                   koefisien ras.
//   FIB-4           Sterling RK dkk. (2006) Hepatology 43:1317-1325.
//   VO2max          Uth N dkk. (2004) Eur J Appl Physiol 91:111-115.
//   HR maksimal     Tanaka H dkk. (2001) J Am Coll Cardiol 37:153-156.
//   Sindrom metabolik  International Diabetes Federation (2006), dengan ambang
//                   lingkar pinggang khusus Asia Selatan dan Asia Tenggara.
//
// Yang TIDAK ada, dan alasannya:
//   Klemera-Doubal dan homeostatic dysregulation memerlukan regresi dan matriks
//   kovarians dari POPULASI RUJUKAN (NHANES). Tanpa data itu, angkanya akan
//   dikarang. Jam metilasi DNA (Horvath, GrimAge, DunedinPACE) memerlukan data
//   metilasi yang tidak dimiliki aplikasi ini.
//   "Membalik penuaan" tidak dihitung di mana pun di sini, karena tidak ada
//   pengukuran tervalidasi yang bisa mengatakannya pada seseorang.
// ─────────────────────────────────────────────────────────────────────────────

export interface HasilAngka {
  nilai: number
  satuan: string
  /** Kenapa hasilnya begitu — kalimat yang ikut ditampilkan. */
  catatan: string[]
}

export type Hasil<T> = { ok: true; data: T } | { ok: false; alasan: string }

const angkaSah = (x: number | undefined | null, min: number, maks: number): x is number =>
  typeof x === 'number' && Number.isFinite(x) && x >= min && x <= maks

// ── Pengubah satuan ─────────────────────────────────────────────────────────
// Satuan adalah sumber galat paling sering di kalkulator klinis: albumin 4,2
// g/dL dimasukkan sebagai 4,2 g/L membuat PhenoAge meleset puluhan tahun.
export const konversi = {
  albuminGdLKeGL: (x: number) => x * 10,
  kreatininMgdLKeUmolL: (x: number) => x * 88.4,
  glukosaMgdLKeMmolL: (x: number) => x / 18.0182,
  crpMgLKeMgdL: (x: number) => x / 10,
}

export interface MasukanPhenoAge {
  usia: number
  /** g/L (bukan g/dL). */
  albuminGL: number
  /** µmol/L. */
  kreatininUmolL: number
  /** mmol/L. */
  glukosaMmolL: number
  /** mg/dL — logaritma naturalnya yang dipakai. */
  crpMgdL: number
  /** Persen limfosit dari hitung jenis. */
  limfositPersen: number
  /** fL. */
  mcvFL: number
  /** Persen. */
  rdwPersen: number
  /** U/L. */
  alpUL: number
  /** 10^3/µL. */
  wbcRibu: number
}

export interface HasilPhenoAge {
  phenoAge: number
  /** PhenoAge dikurangi usia sebenarnya. Positif berarti "lebih tua". */
  percepatan: number
  /** Sumbangan tiap penanda terhadap xb, diurutkan dari yang terbesar. */
  kontribusi: Array<{ penanda: string; nilai: number; satuan: string; sumbangan: number }>
  mortalitas10Tahun: number
}

// Koefisien PhenoAge sebagaimana diterbitkan (Levine 2018). Ditulis sebagai
// konstanta bernama, bukan angka telanjang di dalam rumus, supaya bisa
// diperiksa satu per satu terhadap makalahnya.
const PHENO = {
  intersep: -19.90667,
  albumin: -0.03359355,
  kreatinin: 0.009506491,
  glukosa: 0.1953192,
  lnCrp: 0.09536762,
  limfosit: -0.01199984,
  mcv: 0.02676401,
  rdw: 0.3306156,
  alp: 0.001868778,
  wbc: 0.05542406,
  usia: 0.08035356,
  gompertzSkala: -1.51714,
  gompertzGamma: 0.0076927,
  ubahA: -0.0055305,
  ubahB: 0.090165,
  ubahC: 141.50225,
} as const

/**
 * PhenoAge — umur fenotipik dari sembilan penanda darah dan usia.
 *
 * Cara kerjanya: kesembilan penanda dan usia dimasukkan ke model Gompertz yang
 * dilatih terhadap mortalitas, menghasilkan peluang mati dalam 10 tahun; angka
 * itu lalu dibalik menjadi "usia berapa yang biasanya punya peluang sebesar
 * ini". Jadi PhenoAge 62 pada orang berusia 50 tidak berarti tubuhnya berusia
 * 62 — melainkan risiko kematiannya menyerupai rata-rata orang 62 tahun.
 *
 * Sumbangan tiap penanda ikut dikembalikan, karena angka tunggal tanpa
 * rinciannya tidak bisa ditindaklanjuti: CRP yang tinggi dan RDW yang tinggi
 * memberi PhenoAge yang sama tetapi menuntut penelusuran yang sama sekali
 * berbeda.
 */
export function phenoAge(m: MasukanPhenoAge): Hasil<HasilPhenoAge> {
  const cek: Array<[string, boolean]> = [
    ['age 18–120 years', angkaSah(m.usia, 18, 120)],
    ['albumin 10–60 g/L (not g/dL)', angkaSah(m.albuminGL, 10, 60)],
    ['creatinine 20–1500 µmol/L', angkaSah(m.kreatininUmolL, 20, 1500)],
    ['glucose 1–40 mmol/L', angkaSah(m.glukosaMmolL, 1, 40)],
    ['CRP 0.001–50 mg/dL', angkaSah(m.crpMgdL, 0.001, 50)],
    ['lymphocytes 1–90 %', angkaSah(m.limfositPersen, 1, 90)],
    ['MCV 50–130 fL', angkaSah(m.mcvFL, 50, 130)],
    ['RDW 8–35 %', angkaSah(m.rdwPersen, 8, 35)],
    ['ALP 10–1000 U/L', angkaSah(m.alpUL, 10, 1000)],
    ['WBC 0.5–100 ×10³/µL', angkaSah(m.wbcRibu, 0.5, 100)],
  ]
  const kurang = cek.filter(([, ok]) => !ok).map(([label]) => label)
  if (kurang.length) return { ok: false, alasan: `Needs plausible values for: ${kurang.join('; ')}` }

  // Satuan ikut dikembalikan karena nilai yang ditampilkan adalah nilai SETELAH
  // dikonversi: seseorang yang mengetik albumin 4,2 g/dL akan melihat 42 di
  // sini, dan tanpa satuannya itu terbaca seperti kesalahan aplikasi.
  const bagian: HasilPhenoAge['kontribusi'] = [
    { penanda: 'Albumin', nilai: m.albuminGL, satuan: 'g/L', sumbangan: PHENO.albumin * m.albuminGL },
    { penanda: 'Creatinine', nilai: m.kreatininUmolL, satuan: 'µmol/L', sumbangan: PHENO.kreatinin * m.kreatininUmolL },
    { penanda: 'Glucose', nilai: m.glukosaMmolL, satuan: 'mmol/L', sumbangan: PHENO.glukosa * m.glukosaMmolL },
    { penanda: 'CRP (ln)', nilai: m.crpMgdL, satuan: 'mg/dL', sumbangan: PHENO.lnCrp * Math.log(m.crpMgdL) },
    { penanda: 'Lymphocytes', nilai: m.limfositPersen, satuan: '%', sumbangan: PHENO.limfosit * m.limfositPersen },
    { penanda: 'MCV', nilai: m.mcvFL, satuan: 'fL', sumbangan: PHENO.mcv * m.mcvFL },
    { penanda: 'RDW', nilai: m.rdwPersen, satuan: '%', sumbangan: PHENO.rdw * m.rdwPersen },
    { penanda: 'Alkaline phosphatase', nilai: m.alpUL, satuan: 'U/L', sumbangan: PHENO.alp * m.alpUL },
    { penanda: 'White cells', nilai: m.wbcRibu, satuan: '×10³/µL', sumbangan: PHENO.wbc * m.wbcRibu },
    { penanda: 'Chronological age', nilai: m.usia, satuan: 'years', sumbangan: PHENO.usia * m.usia },
  ]
  const xb = PHENO.intersep + bagian.reduce((a, b) => a + b.sumbangan, 0)
  const mort = 1 - Math.exp((PHENO.gompertzSkala * Math.exp(xb)) / PHENO.gompertzGamma)
  if (!(mort > 0 && mort < 1)) return { ok: false, alasan: 'The biomarker combination falls outside the range the published model can invert' }

  const pheno = Math.log(PHENO.ubahA * Math.log(1 - mort)) / PHENO.ubahB + PHENO.ubahC
  if (!Number.isFinite(pheno)) return { ok: false, alasan: 'Result is not finite for these values' }

  return {
    ok: true,
    data: {
      phenoAge: Number(pheno.toFixed(1)),
      percepatan: Number((pheno - m.usia).toFixed(1)),
      kontribusi: bagian.sort((a, b) => Math.abs(b.sumbangan) - Math.abs(a.sumbangan)),
      mortalitas10Tahun: Number((mort * 100).toFixed(2)),
    },
  }
}

/**
 * eGFR CKD-EPI 2021, persamaan tanpa koefisien ras.
 *
 * Versi 2021 menghapus faktor ras yang ada pada persamaan 2009. Itu bukan
 * perubahan kosmetik: pada persamaan lama, dua orang dengan kreatinin yang
 * sama memperoleh eGFR berbeda semata karena kotak yang dicentang, yang
 * menunda rujukan dan transplantasi bagi pasien kulit hitam.
 */
export function egfrCkdEpi2021(kreatininMgdL: number, usia: number, perempuan: boolean): Hasil<HasilAngka> {
  if (!angkaSah(kreatininMgdL, 0.1, 25)) return { ok: false, alasan: 'Creatinine must be 0.1–25 mg/dL' }
  if (!angkaSah(usia, 18, 120)) return { ok: false, alasan: 'Age must be 18–120 years' }
  const kappa = perempuan ? 0.7 : 0.9
  const alfa = perempuan ? -0.241 : -0.302
  const r = kreatininMgdL / kappa
  const nilai = 142 * Math.pow(Math.min(r, 1), alfa) * Math.pow(Math.max(r, 1), -1.2)
    * Math.pow(0.9938, usia) * (perempuan ? 1.012 : 1)
  const stadium = nilai >= 90 ? 'G1' : nilai >= 60 ? 'G2' : nilai >= 45 ? 'G3a' : nilai >= 30 ? 'G3b' : nilai >= 15 ? 'G4' : 'G5'
  return {
    ok: true,
    data: {
      nilai: Number(nilai.toFixed(1)), satuan: 'mL/min/1.73m²',
      catatan: [
        `KDIGO category ${stadium} by eGFR alone`,
        'Staging also needs albuminuria — eGFR by itself is only half of it',
        'Unreliable in acute illness, extremes of muscle mass, pregnancy and amputation',
      ],
    },
  }
}

/** FIB-4 — penapis fibrosis hati dari usia, AST, ALT, dan trombosit. */
export function fib4(usia: number, astUL: number, altUL: number, trombosit10e9: number): Hasil<HasilAngka> {
  if (!angkaSah(usia, 18, 120)) return { ok: false, alasan: 'Age must be 18–120 years' }
  if (!angkaSah(astUL, 1, 5000) || !angkaSah(altUL, 1, 5000)) return { ok: false, alasan: 'AST and ALT must be 1–5000 U/L' }
  if (!angkaSah(trombosit10e9, 1, 1500)) return { ok: false, alasan: 'Platelets must be 1–1500 ×10⁹/L' }
  const nilai = (usia * astUL) / (trombosit10e9 * Math.sqrt(altUL))
  const catatan = nilai < 1.3
    ? ['Below 1.3 — advanced fibrosis unlikely; repeat in 1–3 years if risk persists']
    : nilai > 2.67
      ? ['Above 2.67 — advanced fibrosis likely; refer for elastography or specialist assessment']
      : ['Between 1.3 and 2.67 — indeterminate; elastography is the usual next step']
  catatan.push('Thresholds shift with age: use 2.0 rather than 1.3 as the lower cut-off above 65')
  return { ok: true, data: { nilai: Number(nilai.toFixed(2)), satuan: '', catatan } }
}

/** HR maksimal menurut Tanaka: 208 − 0,7 × usia. */
export function hrMaksTanaka(usia: number): Hasil<HasilAngka> {
  if (!angkaSah(usia, 18, 120)) return { ok: false, alasan: 'Age must be 18–120 years' }
  return {
    ok: true,
    data: {
      nilai: Math.round(208 - 0.7 * usia), satuan: 'bpm',
      catatan: [
        'Tanaka rather than "220 − age", which underestimates maximum rate in older adults',
        'Population formula: individual maximum varies by roughly ±10 bpm',
      ],
    },
  }
}

/**
 * Perkiraan VO2max dari nadi istirahat (Uth-Sørensen).
 *
 * Rumusnya sederhana justru karena rasio HRmaks terhadap HR istirahat adalah
 * cerminan volume sekuncup: jantung yang terlatih memompa lebih banyak per
 * denyut, sehingga butuh denyut lebih sedikit saat istirahat. Ketelitiannya
 * terbatas — ia tidak menggantikan uji latih beban — tetapi arah perubahannya
 * pada satu orang dari waktu ke waktu bermakna.
 */
export function vo2maxUth(hrIstirahat: number, usia: number): Hasil<HasilAngka> {
  if (!angkaSah(hrIstirahat, 25, 140)) return { ok: false, alasan: 'Resting heart rate must be 25–140 bpm' }
  const hrMaks = hrMaksTanaka(usia)
  if (!hrMaks.ok) return hrMaks
  const nilai = 15.3 * (hrMaks.data.nilai / hrIstirahat)
  return {
    ok: true,
    data: {
      nilai: Number(nilai.toFixed(1)), satuan: 'mL/kg/min',
      catatan: [
        'Estimated from the ratio of maximum to resting heart rate, not measured',
        'Beta blockers, illness, caffeine and poor sleep all shift resting heart rate and therefore this estimate',
        'Cardiorespiratory fitness is among the strongest predictors of mortality — the trend matters more than the absolute value',
      ],
    },
  }
}

export interface MasukanSindromMetabolik {
  lingkarPinggangCm: number
  perempuan: boolean
  trigliseridaMgdL: number
  hdlMgdL: number
  sistolik: number
  diastolik: number
  glukosaPuasaMgdL: number
  diobatiHipertensi?: boolean
  diobatiTrigliserida?: boolean
  diobatiGula?: boolean
}

/**
 * Sindrom metabolik menurut IDF (2006), dengan ambang lingkar pinggang khusus
 * Asia Selatan dan Asia Tenggara — 90 cm untuk laki-laki dan 80 cm untuk
 * perempuan. Memakai ambang Eropa (94/80) pada populasi Indonesia akan
 * melewatkan sebagian besar kasus, karena risiko kardiometabolik muncul pada
 * lingkar pinggang yang lebih kecil.
 */
export function sindromMetabolikIdf(m: MasukanSindromMetabolik): Hasil<{
  memenuhi: boolean
  obesitasSentral: boolean
  kriteriaTerpenuhi: string[]
  kriteriaTidak: string[]
}> {
  if (!angkaSah(m.lingkarPinggangCm, 40, 250)) return { ok: false, alasan: 'Waist circumference must be 40–250 cm' }
  const ambangPinggang = m.perempuan ? 80 : 90
  const obesitasSentral = m.lingkarPinggangCm >= ambangPinggang

  const daftar: Array<[string, boolean]> = [
    [`Triglycerides ≥150 mg/dL${m.diobatiTrigliserida ? ' (or treated)' : ''}`,
      m.trigliseridaMgdL >= 150 || !!m.diobatiTrigliserida],
    [`HDL <${m.perempuan ? 50 : 40} mg/dL`, m.hdlMgdL < (m.perempuan ? 50 : 40)],
    [`Blood pressure ≥130/85${m.diobatiHipertensi ? ' (or treated)' : ''}`,
      m.sistolik >= 130 || m.diastolik >= 85 || !!m.diobatiHipertensi],
    [`Fasting glucose ≥100 mg/dL${m.diobatiGula ? ' (or treated)' : ''}`,
      m.glukosaPuasaMgdL >= 100 || !!m.diobatiGula],
  ]
  const terpenuhi = daftar.filter(([, v]) => v).map(([l]) => l)
  const tidak = daftar.filter(([, v]) => !v).map(([l]) => l)
  return {
    ok: true,
    data: {
      // IDF menuntut obesitas sentral sebagai syarat WAJIB, ditambah dua dari empat.
      memenuhi: obesitasSentral && terpenuhi.length >= 2,
      obesitasSentral, kriteriaTerpenuhi: terpenuhi, kriteriaTidak: tidak,
    },
  }
}
