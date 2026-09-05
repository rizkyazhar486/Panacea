// ─────────────────────────────────────────────────────────────────────────────
// Simulator faal seluruh tubuh — kardiovaskular, paru, dan ginjal TERKAIT.
//
// Yang membuatnya simulator dan bukan tabel: tidak ada satu pun angka keluaran
// yang ditulis tangan. Semuanya DIHITUNG dari persamaan faal baku, dan
// ketiganya saling menyuapi. Menurunkan volume darah menurunkan curah jantung,
// yang menurunkan tekanan arteri, yang menurunkan perfusi ginjal, yang
// menurunkan laju filtrasi dan menyalakan RAAS, yang menaikkan resistensi dan
// menahan air — dan lingkar itu balik lagi menaikkan tekanan. Itulah sebabnya
// perdarahan menghasilkan pola yang khas, bukan sekadar "semua angka turun".
//
// PERSAMAAN YANG DIPAKAI, semuanya baku dan bisa diperiksa:
//   Frank-Starling      SV naik dengan preload sampai mendatar
//   Curah jantung       CO = HR x SV
//   Tekanan arteri      MAP = CO x SVR + CVP
//   Ventilasi alveolar  VA = (VT - VD) x RR
//   Tekanan CO2 alveol  PaCO2 = 0.863 x VCO2 / VA
//   Persamaan gas alveolar  PAO2 = FiO2 x (Patm - 47) - PaCO2 / R
//   Disosiasi Hb (Hill) SaO2 = PO2^n / (PO2^n + P50^n)
//   Kandungan O2        CaO2 = 1.34 x Hb x SaO2 + 0.003 x PaO2
//   Hantaran O2         DO2 = CO x CaO2 x 10
//   Autoregulasi ginjal GFR datar pada MAP 80-180, jatuh tajam di bawahnya
//
// BATASNYA, dan ini harus dikatakan: ini model KEADAAN TUNAK yang disederhanakan
// untuk MENGAJARKAN ARAH DAN BESARAN hubungan antar-sistem. Ia bukan model
// pasien. Ia tidak mensimulasikan waktu, tidak memodelkan tiap organ secara
// mekanistik, dan tidak boleh dipakai untuk memperkirakan keadaan orang
// sungguhan.
// ─────────────────────────────────────────────────────────────────────────────

/** Yang bisa diputar pengguna. Semuanya besaran faal, bukan angka abstrak. */
export interface SimInput {
  /** Denyut jantung, /menit. */
  heartRate: number
  /** Kontraktilitas relatif; 1.0 = normal. Turun pada gagal jantung. */
  contractility: number
  /** Volume darah relatif; 1.0 = ~5 L. Turun pada perdarahan/dehidrasi. */
  bloodVolume: number
  /** Resistensi vaskular sistemik relatif; 1.0 = normal. Turun pada sepsis. */
  svr: number
  /** Hemoglobin, g/dL. */
  hemoglobin: number
  /** Laju napas, /menit. */
  respRate: number
  /** Volume tidal, mL. */
  tidalVolume: number
  /** Fraksi oksigen inspirasi; 0.21 = udara ruang. */
  fio2: number
  /**
   * Fraksi pirau (shunt) — bagian curah jantung yang melewati alveolus tanpa
   * ikut bertukar gas. 0.02-0.05 normal, >0.3 pada ARDS berat.
   *
   * Ini menggantikan "selisih A-a" yang dipakai lebih dulu, dan penggantian itu
   * memperbaiki kesalahan nyata: selisih A-a yang TETAP membuat menaikkan FiO2
   * selalu menaikkan PaO2, sehingga ARDS berat pada FiO2 0,8 menghasilkan PaO2
   * 227 mmHg — mustahil. Darah yang dipirau tidak pernah bertemu gas alveolar
   * sama sekali, jadi oksigen tambahan tidak menjangkaunya. Hanya model pirau
   * yang berperilaku begitu, dan justru perilaku itulah pelajarannya.
   */
  shuntFraction: number
  /** Fraksi ruang rugi VD/VT. ~0.3 normal, 0.6-0.7 pada PPOK. */
  deadSpaceFraction: number
  /** Konsumsi O2, mL/menit. */
  vo2: number
  /** Produksi CO2, mL/menit. Naik saat olahraga. */
  vco2: number
  /** Fungsi ginjal relatif; 1.0 = normal. Turun pada penyakit ginjal. */
  renalFunction: number
}

export const NORMAL: SimInput = {
  heartRate: 70,
  contractility: 1,
  bloodVolume: 1,
  svr: 1,
  hemoglobin: 15,
  respRate: 14,
  tidalVolume: 500,
  fio2: 0.21,
  shuntFraction: 0.03,
  deadSpaceFraction: 0.3,
  vo2: 250,
  vco2: 200,
  renalFunction: 1,
}

export interface SimOutput {
  strokeVolume: number      // mL
  cardiacOutput: number     // L/min
  map: number               // mmHg
  systolic: number
  diastolic: number
  paco2: number             // mmHg
  pao2: number              // mmHg
  sao2: number              // %
  cao2: number              // mL O2 / dL
  do2: number               // mL O2 / min
  renalPerfusion: number    // mL/min
  gfr: number               // mL/min
  urineOutput: number       // mL/hour
  ph: number
  /** Bikarbonat setelah komponen metabolik, mmol/L. */
  hco3: number
  /** Laktat perkiraan, mmol/L — naik saat hantaran O2 di bawah kritis. */
  lactate: number
  /** Penjelasan yang ikut berubah — apa yang sedang menahan sistem ini. */
  catatan: string[]
}

const CVP = 4                  // tekanan vena sentral, mmHg
const SVR_NORMAL = 16          // mmHg per L/min, sehingga CO 5 -> MAP ~84
const P50 = 26.6               // mmHg
const HILL_N = 2.7
const R_QUOTIENT = 0.8         // hasil bagi pernapasan

function batas(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)) }

/** Saturasi Hb dari tekanan parsial O2 — kurva Hill. */
function saturasi(po2: number): number {
  return (100 * Math.pow(po2, HILL_N)) / (Math.pow(po2, HILL_N) + Math.pow(P50, HILL_N))
}

/** Kandungan O2 darah, mL per dL. Perhatikan bahwa yang dibawa ke jaringan
 *  adalah KANDUNGAN, bukan saturasi — itulah sebabnya anemia berat berbahaya
 *  meski oksimeter menunjukkan 98%. */
function kandunganO2(hb: number, sat: number, po2: number): number {
  return 1.34 * hb * (sat / 100) + 0.003 * po2
}

export function simulate(inp: SimInput): SimOutput {
  const catatan: string[] = []

  // ── Jantung ───────────────────────────────────────────────────────────────
  // Preload BUKAN volume darah total. Sebagian besar darah duduk di reservoir
  // vena sebagai "unstressed volume" dan tidak ikut mengisi jantung; yang
  // menentukan pengisian adalah kelebihan di atas ambang itu. Karena itu
  // kehilangan 30-40% volume menurunkan isi sekuncup jauh LEBIH dari 30-40% —
  // dan model yang memakai volume total secara langsung akan menyimpulkan
  // perdarahan kelas III nyaris tak berpengaruh, yang keliru.
  const V0 = 0.58
  const preloadEff = batas((inp.bloodVolume - V0) / (1 - V0), 0, 2.5)
  // Frank-Starling: menanjak lalu MENDATAR — otot yang sudah teregang penuh
  // tidak menghasilkan tambahan gaya. Bentuk mendatar inilah sebabnya memberi
  // cairan pada jantung yang sudah penuh tidak menolong.
  const starling = preloadEff / (0.25 + preloadEff)
  const starlingNormal = 1 / 1.25

  // Afterload menekan isi sekuncup, dan jauh lebih terasa saat kontraktilitas
  // rendah — dasar pemakaian vasodilator pada gagal jantung.
  const afterloadPenalty = batas(1 - 0.25 * (inp.svr - 1) / Math.max(inp.contractility, 0.25), 0.3, 1.4)

  // Diastol memendek pada denyut sangat cepat, jadi pengisian berkurang —
  // sebabnya takikardia ekstrem justru MENURUNKAN curah jantung.
  const fillingPenalty = inp.heartRate > 150 ? batas(1 - (inp.heartRate - 150) / 200, 0.4, 1) : 1

  const sv = batas(
    70 * (starling / starlingNormal) * inp.contractility * afterloadPenalty * fillingPenalty,
    3, 180,
  )
  const co = (inp.heartRate * sv) / 1000

  // ── Tekanan arteri ────────────────────────────────────────────────────────
  const svrAbs = SVR_NORMAL * inp.svr
  const map = batas(co * svrAbs + CVP, 10, 220)
  const pulsePressure = batas(sv * 0.58 / Math.max(inp.svr, 0.4) * 0.85, 8, 95)
  const diastolic = batas(map - pulsePressure / 3, 5, 160)
  const systolic = batas(diastolic + pulsePressure, 20, 280)

  // ── Paru ──────────────────────────────────────────────────────────────────
  // Hanya udara yang mencapai alveolus ikut bertukar gas. Napas cepat tapi
  // DANGKAL bisa punya ventilasi semenit besar sementara ventilasi ALVEOLAR
  // kecil, karena ruang rugi dibayar pada TIAP napas — itulah yang membuat
  // PPOK menahan CO2 meski tampak bernapas keras.
  const alveolarPerBreath = Math.max(inp.tidalVolume * (1 - inp.deadSpaceFraction), 0)
  const va = (alveolarPerBreath * inp.respRate) / 1000        // L/menit
  const paco2 = batas(va > 0.05 ? (0.863 * inp.vco2) / va : 140, 8, 140)

  // Persamaan gas alveolar.
  const pAO2 = batas(inp.fio2 * (760 - 47) - paco2 / R_QUOTIENT, 5, 700)

  // Persamaan pirau. Darah yang dipirau meninggalkan paru dengan kandungan
  // VENA; sisanya seimbang dengan gas alveolar. Karena kandungan vena
  // bergantung pada kandungan arteri (lewat konsumsi O2 dan curah jantung),
  // persamaannya diselesaikan dengan iterasi titik-tetap — beberapa putaran
  // sudah konvergen.
  const ccO2 = kandunganO2(inp.hemoglobin, saturasi(pAO2), pAO2)
  let caO2 = ccO2
  for (let i = 0; i < 12; i++) {
    const cvO2 = Math.max(caO2 - inp.vo2 / Math.max(co * 10, 1), 1)
    caO2 = inp.shuntFraction * cvO2 + (1 - inp.shuntFraction) * ccO2
  }
  // Balik dari kandungan ke saturasi dan PO2 arteri.
  //
  // Dua jebakan di langkah ini, dan keduanya sempat menghasilkan angka
  // mustahil (PaO2 700 mmHg pada anemia berat):
  //   1. O2 TERLARUT harus dikurangi dulu, kalau tidak saturasinya terhitung
  //      lebih tinggi dari yang sebenarnya. Karena terlarut sendiri bergantung
  //      pada PaO2, langkahnya diiterasi.
  //   2. Di bagian DATAR kurva disosiasi, galat saturasi sekecil apa pun
  //      meledak jadi galat PaO2 yang besar saat kurva dibalik. Karena itu
  //      saturasi dibatasi di bawah 100% dan PaO2 arteri tidak pernah boleh
  //      melampaui PAO2 alveolar — darah tidak bisa lebih beroksigen daripada
  //      gas yang mengoksigenasinya.
  let pao2 = 95
  let sao2 = 97
  for (let i = 0; i < 8; i++) {
    sao2 = batas(((caO2 - 0.003 * pao2) / (1.34 * inp.hemoglobin)) * 100, 1, 99.5)
    pao2 = Math.min(
      batas(P50 * Math.pow(sao2 / Math.max(100 - sao2, 0.01), 1 / HILL_N), 5, 700),
      pAO2,
    )
  }
  const do2 = co * caO2 * 10

  // ── Metabolik ─────────────────────────────────────────────────────────────
  // Di bawah hantaran O2 kritis (~500 mL/menit) jaringan beralih ke metabolisme
  // anaerob dan laktat menumpuk. Tanpa kopling ini, syok menghasilkan pH basa
  // yang keliru: hiperventilasi tercatat sedangkan asidosis metaboliknya tidak.
  const DO2_KRITIS = 500
  const lactate = do2 < DO2_KRITIS ? batas(1 + (DO2_KRITIS - do2) / 30, 1, 20) : 1
  const hco3 = batas(24 - Math.max(lactate - 1, 0) * 0.85, 4, 34)
  const ph = batas(6.1 + Math.log10(hco3 / (0.03 * paco2)), 6.5, 7.9)

  // ── Ginjal ────────────────────────────────────────────────────────────────
  // Aliran ginjal ikut curah jantung, tapi laju filtrasi DIPERTAHANKAN datar
  // pada MAP 80-180 oleh autoregulasi miogenik dan umpan balik tubuloglomerular.
  // Di bawah ~80 mmHg autoregulasi habis dan filtrasi jatuh cepat — sebabnya
  // tekanan yang "cuma sedikit rendah" bisa menghentikan ginjal.
  const renalPerfusion = batas(co * 0.20 * 1000, 20, 2500)
  let autoreg: number
  if (map >= 80) autoreg = 1
  else if (map >= 50) autoreg = (map - 50) / 30
  else autoreg = 0
  const gfr = batas(120 * autoreg * inp.renalFunction, 0, 160)
  const retensi = inp.bloodVolume < 1 ? batas((inp.bloodVolume - 0.5) / 0.5, 0.05, 1) : 1
  const urineOutput = batas((gfr / 120) * 60 * retensi, 0, 200)

  // ── Apa yang sedang menahan sistem ini ────────────────────────────────────
  if (map < 65) catatan.push(`MAP ${map.toFixed(0)} mmHg is below the ~65 mmHg organs need — this is shock.`)
  if (autoreg < 1 && autoreg > 0) catatan.push('Renal autoregulation is exhausted: GFR now falls directly with blood pressure.')
  if (autoreg === 0) catatan.push('Renal perfusion pressure is too low to filter at all — anuria.')
  if (inp.heartRate > 150) catatan.push('Diastole is too short to fill the ventricle, so stroke volume falls despite the fast rate.')
  if (paco2 > 50) catatan.push(`PaCO₂ ${paco2.toFixed(0)} mmHg — alveolar ventilation is inadequate; respiratory acidosis.`)
  if (paco2 < 30) catatan.push(`PaCO₂ ${paco2.toFixed(0)} mmHg — hyperventilation; respiratory alkalosis.`)
  if (inp.shuntFraction > 0.2) catatan.push(`Shunt ${(inp.shuntFraction * 100).toFixed(0)}% — raising FiO₂ helps little, because shunted blood never meets alveolar gas.`)
  if (sao2 < 90) catatan.push(`SaO₂ ${sao2.toFixed(0)}% — on the steep part of the dissociation curve, where small PaO₂ changes matter greatly.`)
  if (lactate > 2) catatan.push(`Lactate ~${lactate.toFixed(1)} mmol/L — oxygen delivery is below the critical threshold and tissues are respiring anaerobically.`)
  if (do2 < 600) catatan.push(`Oxygen delivery ${do2.toFixed(0)} mL/min is near the critical threshold (~500).`)
  if (inp.hemoglobin < 8) catatan.push('Anaemia limits oxygen delivery despite a normal saturation — tissues receive content, not percentage.')
  if (urineOutput < 30) catatan.push(`Urine ${urineOutput.toFixed(0)} mL/h is below the ~0.5 mL/kg/h oliguria threshold.`)
  if (!catatan.length) catatan.push('All three systems are within normal operating range.')

  return {
    strokeVolume: sv, cardiacOutput: co, map, systolic, diastolic,
    paco2, pao2, sao2, cao2: caO2, do2, hco3, lactate,
    renalPerfusion, gfr, urineOutput, ph, catatan,
  }
}

export interface Skenario {
  key: string
  label: string
  /** Apa yang sebenarnya terjadi pada tubuh — bukan sekadar nama penyakit. */
  cerita: string
  /** Yang mesti diperhatikan saat menjalankannya. */
  perhatikan: string
  input: SimInput
}

export const SKENARIO: Skenario[] = [
  { key: 'normal', label: 'Healthy at rest', cerita: 'Baseline adult at rest.', perhatikan: 'Note how little of the body’s reserve is being used.', input: { ...NORMAL } },
  {
    key: 'exercise', label: 'Hard exercise',
    cerita: 'Sympathetic drive raises rate and contractility; working muscle dilates its arterioles, so total resistance FALLS even as pressure rises.',
    perhatikan: 'Cardiac output can quintuple. Systolic climbs while diastolic barely moves — that is the normal response, and a falling systolic during exercise is not.',
    input: { ...NORMAL, heartRate: 170, contractility: 1.6, svr: 0.34, respRate: 40, tidalVolume: 2000, vco2: 2400, vo2: 2800, deadSpaceFraction: 0.2 },
  },
  {
    key: 'hemorrhage', label: 'Haemorrhage (class III)',
    cerita: 'About 30–40% of blood volume lost. Preload collapses, so stroke volume falls despite a healthy heart.',
    perhatikan: 'The baroreflex defends pressure with tachycardia and vasoconstriction — so blood pressure is the LAST thing to fall. Watch urine output and GFR drop long before MAP does.',
    input: { ...NORMAL, bloodVolume: 0.62, heartRate: 130, svr: 1.5, hemoglobin: 9, respRate: 22, tidalVolume: 450 },
  },
  {
    key: 'sepsis', label: 'Septic shock',
    cerita: 'Inflammatory vasodilatation collapses systemic vascular resistance. The heart compensates with a high output.',
    perhatikan: 'This is the one shock state with a HIGH cardiac output and warm peripheries — yet MAP is still low, because resistance is the term that failed. Treating it like haemorrhage misses that.',
    input: { ...NORMAL, svr: 0.30, heartRate: 125, contractility: 1.15, respRate: 28, vco2: 300, vo2: 320, shuntFraction: 0.12 },
  },
  {
    key: 'heart-failure', label: 'Decompensated heart failure',
    cerita: 'Contractility is halved and fluid is retained, so the ventricle is both weak and over-filled.',
    perhatikan: 'Adding volume does almost nothing — Frank-Starling has already flattened. Reducing afterload does more, which is why vasodilators help here and would harm in haemorrhage.',
    input: { ...NORMAL, contractility: 0.45, bloodVolume: 1.35, svr: 1.35, heartRate: 105, respRate: 24, shuntFraction: 0.15 },
  },
  {
    key: 'copd', label: 'COPD exacerbation',
    cerita: 'Airflow obstruction and a high dead-space fraction: breathing is fast but shallow and inefficient.',
    perhatikan: 'Minute ventilation looks adequate while ALVEOLAR ventilation is not — dead space is paid on every breath, so rapid shallow breathing raises CO₂ rather than lowering it.',
    input: { ...NORMAL, respRate: 28, tidalVolume: 320, deadSpaceFraction: 0.65, shuntFraction: 0.1, fio2: 0.28, heartRate: 100, svr: 0.95 },
  },
  {
    key: 'aki', label: 'Acute kidney injury',
    cerita: 'Intrinsic renal function is severely reduced while the circulation is intact.',
    perhatikan: 'Blood pressure and oxygen delivery are normal, yet GFR and urine output are not — proof that the kidney is not merely a pressure gauge.',
    input: { ...NORMAL, renalFunction: 0.15, bloodVolume: 1.1, heartRate: 82, svr: 1.05 },
  },
  {
    key: 'ards', label: 'Severe hypoxaemic failure (ARDS)',
    cerita: 'Widespread shunt: a very large A–a gradient means blood bypasses ventilated alveoli.',
    perhatikan: 'Raising FiO₂ helps far less than expected — shunted blood never meets alveolar gas at all. That is the distinction between shunt and simple V/Q mismatch.',
    input: { ...NORMAL, shuntFraction: 0.45, fio2: 0.8, respRate: 32, tidalVolume: 420, deadSpaceFraction: 0.45, heartRate: 100, svr: 0.72, vo2: 360, vco2: 260 },
  },
  {
    key: 'anemia', label: 'Severe anaemia',
    cerita: 'Haemoglobin 5 g/dL with normal lungs and a compensating heart.',
    perhatikan: 'Saturation reads a reassuring 98% while oxygen DELIVERY is dangerously low. Pulse oximetry cannot see this — it measures the percentage of a carrier that is barely there.',
    input: { ...NORMAL, hemoglobin: 5, heartRate: 115, contractility: 1.2, svr: 0.52 },
  },
]

/** Batas tampilan tiap kendali. */
export const KENDALI: Array<{
  key: keyof SimInput; label: string; min: number; max: number; step: number; unit: string; sistem: 'cv' | 'paru' | 'ginjal'
}> = [
  { key: 'heartRate', label: 'Heart rate', min: 30, max: 200, step: 1, unit: '/min', sistem: 'cv' },
  { key: 'contractility', label: 'Contractility', min: 0.2, max: 2, step: 0.05, unit: '×', sistem: 'cv' },
  { key: 'bloodVolume', label: 'Blood volume', min: 0.4, max: 1.5, step: 0.02, unit: '×', sistem: 'cv' },
  { key: 'svr', label: 'Vascular resistance', min: 0.3, max: 2.5, step: 0.05, unit: '×', sistem: 'cv' },
  { key: 'hemoglobin', label: 'Haemoglobin', min: 3, max: 20, step: 0.5, unit: 'g/dL', sistem: 'cv' },
  { key: 'respRate', label: 'Respiratory rate', min: 4, max: 60, step: 1, unit: '/min', sistem: 'paru' },
  { key: 'tidalVolume', label: 'Tidal volume', min: 150, max: 2500, step: 10, unit: 'mL', sistem: 'paru' },
  { key: 'fio2', label: 'Inspired O₂', min: 0.21, max: 1, step: 0.01, unit: '', sistem: 'paru' },
  { key: 'shuntFraction', label: 'Shunt fraction', min: 0.01, max: 0.6, step: 0.01, unit: '', sistem: 'paru' },
  { key: 'deadSpaceFraction', label: 'Dead space VD/VT', min: 0.15, max: 0.8, step: 0.01, unit: '', sistem: 'paru' },
  { key: 'vo2', label: 'O₂ consumption', min: 150, max: 3500, step: 25, unit: 'mL/min', sistem: 'paru' },
  { key: 'vco2', label: 'CO₂ production', min: 100, max: 3000, step: 20, unit: 'mL/min', sistem: 'paru' },
  { key: 'renalFunction', label: 'Renal function', min: 0.05, max: 1.2, step: 0.05, unit: '×', sistem: 'ginjal' },
]
