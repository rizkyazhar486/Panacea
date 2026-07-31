// Macroeconomic analysis toolkit.
//
// Two honesty constraints govern this whole module, and they are visible in the
// UI rather than buried here:
//
// 1. The country table is STATIC REFERENCE DATA with an explicit as-of year,
//    not a live feed. Shipping hardcoded figures that look authoritative and
//    silently go stale is how people end up quoting five-year-old GDP numbers
//    in real decisions. Every figure is rounded, dated, and points at the
//    primary source to verify against.
//
// 2. Nothing here "predicts" inflation or markets. What it does is show the
//    MECHANICAL CONSEQUENCE of assumptions the user supplies — if the policy
//    rate moves this much, and pass-through is this strong, here is what the
//    identity implies. That is a simulator, not a forecast, and the difference
//    matters: a forecast invites you to trust it, a simulator invites you to
//    change the inputs and see how fragile the answer is.

export type Bloc = 'top10' | 'brics' | 'nato' | 'asean'

export const BLOC_LABEL: Record<Bloc, string> = {
  top10: '10 Ekonomi Terbesar',
  brics: 'BRICS',
  nato: 'NATO',
  asean: 'ASEAN',
}

export interface Country {
  code: string
  name: string
  blocs: Bloc[]
  /** Nominal GDP, USD trillions — rounded, indicative. */
  gdpUsdTn: number
  population: number       // millions
  inflationPct: number     // headline CPI, annual
  policyRatePct: number    // central bank policy rate
  unemploymentPct: number
  govDebtPctGdp: number
  currentAccountPctGdp: number
  centralBank: string
}

/**
 * As-of year for every figure below. Displayed prominently in the UI — a number
 * without a date is worse than no number.
 */
export const DATA_AS_OF = 2024

export const DATA_SOURCES = [
  'International Monetary Fund. World Economic Outlook Database. Washington DC: IMF.',
  'World Bank. World Development Indicators. Washington DC: World Bank Group.',
  'Badan Pusat Statistik. Statistik Indonesia. Jakarta: BPS.',
  'Bank Indonesia. Laporan Kebijakan Moneter. Jakarta: Bank Indonesia.',
]

// Rounded, indicative values for teaching comparison — verify against the
// primary sources above before using any of these in a real decision.
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'Amerika Serikat', blocs: ['top10', 'nato'], gdpUsdTn: 29.2, population: 342, inflationPct: 2.9, policyRatePct: 4.75, unemploymentPct: 4.1, govDebtPctGdp: 121, currentAccountPctGdp: -3.3, centralBank: 'Federal Reserve' },
  { code: 'CN', name: 'Tiongkok', blocs: ['top10', 'brics'], gdpUsdTn: 18.7, population: 1410, inflationPct: 0.3, policyRatePct: 3.1, unemploymentPct: 5.1, govDebtPctGdp: 88, currentAccountPctGdp: 1.4, centralBank: "People's Bank of China" },
  { code: 'DE', name: 'Jerman', blocs: ['top10', 'nato'], gdpUsdTn: 4.7, population: 84, inflationPct: 2.4, policyRatePct: 3.4, unemploymentPct: 3.4, govDebtPctGdp: 63, currentAccountPctGdp: 6.1, centralBank: 'European Central Bank' },
  { code: 'JP', name: 'Jepang', blocs: ['top10'], gdpUsdTn: 4.1, population: 124, inflationPct: 2.7, policyRatePct: 0.25, unemploymentPct: 2.5, govDebtPctGdp: 251, currentAccountPctGdp: 3.6, centralBank: 'Bank of Japan' },
  { code: 'IN', name: 'India', blocs: ['top10', 'brics'], gdpUsdTn: 3.9, population: 1440, inflationPct: 4.9, policyRatePct: 6.5, unemploymentPct: 4.2, govDebtPctGdp: 83, currentAccountPctGdp: -1.1, centralBank: 'Reserve Bank of India' },
  { code: 'GB', name: 'Britania Raya', blocs: ['top10', 'nato'], gdpUsdTn: 3.6, population: 69, inflationPct: 2.5, policyRatePct: 4.75, unemploymentPct: 4.3, govDebtPctGdp: 101, currentAccountPctGdp: -2.7, centralBank: 'Bank of England' },
  { code: 'FR', name: 'Prancis', blocs: ['top10', 'nato'], gdpUsdTn: 3.2, population: 68, inflationPct: 2.1, policyRatePct: 3.4, unemploymentPct: 7.4, govDebtPctGdp: 112, currentAccountPctGdp: -0.9, centralBank: 'European Central Bank' },
  { code: 'IT', name: 'Italia', blocs: ['top10', 'nato'], gdpUsdTn: 2.4, population: 59, inflationPct: 1.1, policyRatePct: 3.4, unemploymentPct: 6.6, govDebtPctGdp: 139, currentAccountPctGdp: 1.1, centralBank: 'European Central Bank' },
  { code: 'BR', name: 'Brasil', blocs: ['top10', 'brics'], gdpUsdTn: 2.3, population: 217, inflationPct: 4.4, policyRatePct: 12.25, unemploymentPct: 6.2, govDebtPctGdp: 87, currentAccountPctGdp: -1.9, centralBank: 'Banco Central do Brasil' },
  { code: 'CA', name: 'Kanada', blocs: ['top10', 'nato'], gdpUsdTn: 2.2, population: 41, inflationPct: 2.0, policyRatePct: 3.25, unemploymentPct: 6.8, govDebtPctGdp: 105, currentAccountPctGdp: -0.6, centralBank: 'Bank of Canada' },
  { code: 'ID', name: 'Indonesia', blocs: ['brics', 'asean'], gdpUsdTn: 1.4, population: 283, inflationPct: 1.6, policyRatePct: 6.0, unemploymentPct: 4.9, govDebtPctGdp: 39, currentAccountPctGdp: -0.6, centralBank: 'Bank Indonesia' },
  { code: 'RU', name: 'Rusia', blocs: ['brics'], gdpUsdTn: 2.2, population: 144, inflationPct: 8.4, policyRatePct: 21.0, unemploymentPct: 2.3, govDebtPctGdp: 20, currentAccountPctGdp: 2.6, centralBank: 'Bank of Russia' },
  { code: 'ZA', name: 'Afrika Selatan', blocs: ['brics'], gdpUsdTn: 0.4, population: 63, inflationPct: 4.4, policyRatePct: 7.75, unemploymentPct: 32.1, govDebtPctGdp: 75, currentAccountPctGdp: -1.6, centralBank: 'South African Reserve Bank' },
  { code: 'SA', name: 'Arab Saudi', blocs: ['brics'], gdpUsdTn: 1.1, population: 34, inflationPct: 1.7, policyRatePct: 5.0, unemploymentPct: 3.5, govDebtPctGdp: 30, currentAccountPctGdp: -0.5, centralBank: 'Saudi Central Bank' },
  { code: 'TR', name: 'Turki', blocs: ['nato'], gdpUsdTn: 1.3, population: 86, inflationPct: 44.4, policyRatePct: 47.5, unemploymentPct: 8.6, govDebtPctGdp: 26, currentAccountPctGdp: -1.0, centralBank: 'Central Bank of Türkiye' },
  { code: 'SG', name: 'Singapura', blocs: ['asean'], gdpUsdTn: 0.55, population: 6, inflationPct: 2.4, policyRatePct: 3.1, unemploymentPct: 2.0, govDebtPctGdp: 175, currentAccountPctGdp: 17.5, centralBank: 'Monetary Authority of Singapore' },
  { code: 'TH', name: 'Thailand', blocs: ['asean'], gdpUsdTn: 0.53, population: 72, inflationPct: 0.4, policyRatePct: 2.25, unemploymentPct: 1.0, govDebtPctGdp: 62, currentAccountPctGdp: 2.1, centralBank: 'Bank of Thailand' },
  { code: 'VN', name: 'Vietnam', blocs: ['asean'], gdpUsdTn: 0.47, population: 101, inflationPct: 3.6, policyRatePct: 4.5, unemploymentPct: 2.2, govDebtPctGdp: 35, currentAccountPctGdp: 4.7, centralBank: 'State Bank of Vietnam' },
]

export function gdpPerCapitaUsd(c: Country): number {
  return (c.gdpUsdTn * 1e12) / (c.population * 1e6)
}

// ── Interest-rate impact ─────────────────────────────────────────────────────

export interface RateScenario {
  /** Change in the policy rate, percentage points. Negative = cut. */
  deltaRatePp: number
  /** How much of a policy move reaches lending rates, 0-1. */
  passThrough: number
  /** Household debt as a share of income — governs how much a move bites. */
  householdDebtPctIncome: number
}

export interface RateImpact {
  lendingRateChangePp: number
  channels: { name: string; direction: 'naik' | 'turun'; note: string }[]
  /** Rough, clearly-labelled magnitude on a household's monthly payment. */
  monthlyPaymentChangePct: number
  lagNote: string
}

export function rateImpact(s: RateScenario): RateImpact {
  const lendingRateChangePp = s.deltaRatePp * Math.min(Math.max(s.passThrough, 0), 1)
  const up = s.deltaRatePp > 0

  // Sensitivity scales with how leveraged households are: the same rate move is
  // barely felt at low debt levels and severe at high ones.
  const leverage = Math.min(Math.max(s.householdDebtPctIncome, 0), 250) / 100
  const monthlyPaymentChangePct = lendingRateChangePp * leverage * 6

  return {
    lendingRateChangePp,
    monthlyPaymentChangePct,
    channels: [
      { name: 'Biaya kredit rumah tangga', direction: up ? 'naik' : 'turun',
        note: up ? 'Cicilan KPR dan kredit konsumsi bertambah, menekan konsumsi.' : 'Cicilan turun, menyisakan ruang belanja rumah tangga.' },
      { name: 'Investasi usaha', direction: up ? 'turun' : 'naik',
        note: up ? 'Proyek dengan imbal hasil tipis menjadi tidak layak sehingga ditunda.' : 'Proyek yang tadinya marginal menjadi layak dibiayai.' },
      { name: 'Nilai tukar', direction: up ? 'naik' : 'turun',
        note: up ? 'Imbal hasil lebih tinggi menarik modal masuk sehingga mata uang cenderung menguat — ini juga menekan inflasi impor.' : 'Modal cenderung keluar, mata uang melemah, harga barang impor naik.' },
      { name: 'Harga aset', direction: up ? 'turun' : 'naik',
        note: up ? 'Tingkat diskonto naik sehingga penilaian saham dan properti tertekan.' : 'Tingkat diskonto turun sehingga penilaian aset terangkat.' },
      { name: 'Inflasi', direction: up ? 'turun' : 'naik',
        note: 'Arah yang dituju kebijakan — namun ini kanal yang paling lambat dan paling tidak pasti.' },
    ],
    lagNote:
      'Kebijakan moneter bekerja dengan jeda panjang dan berubah-ubah — umumnya 4 sampai 8 kuartal sebelum dampak penuhnya pada inflasi terlihat. Karena itu menilai keberhasilan kenaikan suku bunga dari data satu atau dua bulan berikutnya hampir selalu menyesatkan.',
  }
}

// ── Quarterly policy simulation ──────────────────────────────────────────────

export interface PolicyAssumptions {
  startInflationPct: number
  targetInflationPct: number
  startPolicyRatePct: number
  /** Output gap, % — positive means the economy is running hot. */
  outputGapPct: number
  /** How aggressively the bank responds to inflation deviations (Taylor rule). */
  taylorInflationWeight: number
  taylorOutputWeight: number
  neutralRealRatePct: number
  quarters: number
}

export interface PolicyQuarter {
  quarter: number
  inflationPct: number
  policyRatePct: number
  outputGapPct: number
}

/**
 * A transparent Taylor-rule simulation.
 *
 * This is intentionally simple and its equations are stated in the UI. It is
 * NOT a forecast of any real economy — it shows how a rule-following central
 * bank would respond to the assumptions you enter, so you can see which
 * assumption the answer is actually sensitive to.
 */
export function simulatePolicy(a: PolicyAssumptions): PolicyQuarter[] {
  const out: PolicyQuarter[] = []
  let inflation = a.startInflationPct
  let rate = a.startPolicyRatePct
  let gap = a.outputGapPct

  for (let q = 1; q <= a.quarters; q++) {
    // Taylor rule: nominal rate = neutral real + inflation + weights on gaps.
    const target = a.neutralRealRatePct + inflation
      + a.taylorInflationWeight * (inflation - a.targetInflationPct)
      + a.taylorOutputWeight * gap
    // Central banks move gradually rather than jumping to the rule's answer.
    rate = rate + 0.5 * (target - rate)

    // Real rate above neutral cools the economy, with a lag.
    const realRate = rate - inflation
    gap = gap - 0.3 * (realRate - a.neutralRealRatePct)
    // Phillips-curve style: the output gap feeds inflation, which is sticky.
    inflation = 0.7 * inflation + 0.3 * a.targetInflationPct + 0.2 * gap

    out.push({
      quarter: q,
      inflationPct: +inflation.toFixed(2),
      policyRatePct: +rate.toFixed(2),
      outputGapPct: +gap.toFixed(2),
    })
  }
  return out
}

// ── Trade ────────────────────────────────────────────────────────────────────

export interface TradeInput {
  exportsUsdBn: number
  importsUsdBn: number
  gdpUsdBn: number
}

export interface TradeAnalysis {
  balanceUsdBn: number
  balancePctGdp: number
  tradeOpennessPct: number
  verdict: string
  caution: string
}

export function analyseTrade(t: TradeInput): TradeAnalysis {
  const balanceUsdBn = t.exportsUsdBn - t.importsUsdBn
  const balancePctGdp = t.gdpUsdBn > 0 ? (balanceUsdBn / t.gdpUsdBn) * 100 : 0
  const tradeOpennessPct = t.gdpUsdBn > 0 ? ((t.exportsUsdBn + t.importsUsdBn) / t.gdpUsdBn) * 100 : 0

  return {
    balanceUsdBn, balancePctGdp, tradeOpennessPct,
    verdict: balanceUsdBn >= 0
      ? `Surplus ${balancePctGdp.toFixed(1)}% dari PDB.`
      : `Defisit ${Math.abs(balancePctGdp).toFixed(1)}% dari PDB.`,
    caution: balanceUsdBn >= 0
      ? 'Surplus perdagangan sering dianggap otomatis baik, padahal belum tentu. Surplus bisa berasal dari permintaan domestik yang lemah sehingga impor turun — gejala perlambatan, bukan kekuatan. Yang perlu dilihat adalah dari mana surplus itu datang.'
      : 'Defisit perdagangan tidak otomatis buruk. Defisit yang membiayai impor barang modal dan mesin membangun kapasitas produksi di masa depan; defisit yang membiayai konsumsi barang jadi tidak. Komposisinya lebih menentukan daripada angkanya.',
  }
}
