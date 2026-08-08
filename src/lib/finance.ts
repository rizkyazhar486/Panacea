// Personal finance engine — recording, cash-flow analysis, emergency fund,
// debt prioritisation, and risk profiling.
//
// Scope note, stated here because it governs every function below: this module
// deliberately does NOT tell anyone which security to buy or sell. That is
// regulated investment advice, it requires a licence, and an algorithm that
// issues buy/sell calls on someone's savings can do real financial harm. What
// it does instead is the part that actually determines most people's outcomes
// and is safe to automate: knowing where the money goes, whether there is a
// buffer, whether expensive debt is being cleared first, and which broad asset
// mix matches a stated risk tolerance and time horizon.
//
// All amounts are in the smallest sensible unit the user types (rupiah), stored
// as plain numbers. Everything stays on the device.

export type TxKind = 'income' | 'expense'

/** Expense buckets chosen so the 50/30/20 split can be computed automatically. */
export type Category =
  | 'income'
  | 'housing' | 'food' | 'transport' | 'utilities' | 'health' | 'debt' | 'education'
  | 'lifestyle' | 'shopping' | 'savings' | 'other'

export const CATEGORY_LABEL: Record<Category, string> = {
  income: 'Pemasukan',
  housing: 'Residence',
  food: 'Makan & bahan pokok',
  transport: 'Transportasi',
  utilities: 'Listrik, air, internet',
  health: 'Kesehatan',
  debt: 'Cicilan & utang',
  education: 'Pendidikan',
  lifestyle: 'Hiburan & gaya hidup',
  shopping: 'Belanja',
  savings: 'Tabungan & investasi',
  other: 'Lain-lain',
}

/** 50/30/20: needs, wants, savings-and-debt-repayment. */
export type Bucket = 'needs' | 'wants' | 'savings'
export const CATEGORY_BUCKET: Record<Category, Bucket | null> = {
  income: null,
  housing: 'needs', food: 'needs', transport: 'needs', utilities: 'needs',
  health: 'needs', education: 'needs',
  debt: 'savings',          // repaying principal builds net worth
  savings: 'savings',
  lifestyle: 'wants', shopping: 'wants', other: 'wants',
}

export interface Tx {
  id: string
  date: string          // ISO yyyy-mm-dd
  kind: TxKind
  category: Category
  amount: number
  note?: string
}

export interface Debt {
  id: string
  name: string
  balance: number
  annualRatePct: number
  minPayment: number
}

// ── Cash flow ────────────────────────────────────────────────────────────────

export interface CashflowSummary {
  income: number
  expense: number
  net: number
  savingsRatePct: number
  byCategory: { category: Category; amount: number; pct: number }[]
  buckets: Record<Bucket, number>
  bucketPct: Record<Bucket, number>
}

export function summarise(txs: Tx[]): CashflowSummary {
  const income = txs.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0)
  const expenseTxs = txs.filter((t) => t.kind === 'expense')
  const expense = expenseTxs.reduce((a, t) => a + t.amount, 0)

  const byCatMap = new Map<Category, number>()
  for (const t of expenseTxs) byCatMap.set(t.category, (byCatMap.get(t.category) ?? 0) + t.amount)
  const byCategory = [...byCatMap.entries()]
    .map(([category, amount]) => ({ category, amount, pct: expense > 0 ? (amount / expense) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)

  const buckets: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 }
  for (const t of expenseTxs) {
    const b = CATEGORY_BUCKET[t.category]
    if (b) buckets[b] += t.amount
  }
  const base = income > 0 ? income : expense
  const bucketPct: Record<Bucket, number> = {
    needs: base > 0 ? (buckets.needs / base) * 100 : 0,
    wants: base > 0 ? (buckets.wants / base) * 100 : 0,
    savings: base > 0 ? (buckets.savings / base) * 100 : 0,
  }

  const net = income - expense
  return {
    income, expense, net,
    savingsRatePct: income > 0 ? (net / income) * 100 : 0,
    byCategory, buckets, bucketPct,
  }
}

// ── Emergency fund ───────────────────────────────────────────────────────────

/**
 * Months of essential spending covered by current savings.
 *
 * Uses ESSENTIAL spending, not total — the number that matters if income stops
 * is what you must keep paying, not what you currently choose to spend.
 */
export function emergencyMonths(savings: number, monthlyEssentials: number): number {
  if (monthlyEssentials <= 0) return 0
  return savings / monthlyEssentials
}

export function emergencyVerdict(months: number): { label: string; tone: 'critical' | 'high' | 'low' | 'normal'; advice: string } {
  if (months < 1) return {
    label: 'Belum ada penyangga', tone: 'critical',
    advice: 'Ini prioritas nomor satu, di atas investasi apa pun. Tanpa dana darurat, satu kejadian tak terduga memaksa Anda berutang berbunga tinggi — dan bunga itu hampir pasti lebih besar daripada imbal hasil investasi mana pun yang bisa Anda kejar.',
  }
  if (months < 3) return {
    label: 'Tipis', tone: 'high',
    advice: 'Teruskan menambah sampai minimal 3 bulan pengeluaran pokok sebelum menambah porsi investasi berisiko.',
  }
  if (months < 6) return {
    label: 'Cukup', tone: 'low',
    advice: 'Sudah memadai untuk sebagian besar keadaan. Target 6 bulan bila penghasilan Anda tidak tetap, bekerja lepas, atau menjadi satu-satunya pencari nafkah.',
  }
  return {
    label: 'Kuat', tone: 'normal',
    advice: 'Penyangga Anda kuat. Kelebihan di atas 12 bulan pengeluaran pokok umumnya lebih baik dialihkan sebagian, karena uang tunai tergerus inflasi.',
  }
}

// ── Debt ─────────────────────────────────────────────────────────────────────

export interface DebtPlan {
  order: Debt[]
  strategy: 'avalanche' | 'snowball'
  rationale: string
  totalBalance: number
  weightedRatePct: number
  highInterestWarning: string | null
}

export function planDebt(debts: Debt[], strategy: 'avalanche' | 'snowball'): DebtPlan {
  const order = [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.annualRatePct - a.annualRatePct : a.balance - b.balance)
  const totalBalance = debts.reduce((a, d) => a + d.balance, 0)
  const weightedRatePct = totalBalance > 0
    ? debts.reduce((a, d) => a + d.annualRatePct * d.balance, 0) / totalBalance
    : 0
  const worst = debts.reduce<Debt | null>((m, d) => (!m || d.annualRatePct > m.annualRatePct ? d : m), null)

  return {
    order, strategy, totalBalance, weightedRatePct,
    rationale: strategy === 'avalanche'
      ? 'Bunga tertinggi dilunasi lebih dulu. Secara matematis ini paling murah — total bunga yang Anda bayar paling kecil.'
      : 'Saldo terkecil dilunasi lebih dulu. Secara matematis sedikit lebih mahal, tetapi kemenangan cepat di awal membuat sebagian orang bertahan menjalankannya — dan rencana yang dijalankan mengalahkan rencana optimal yang ditinggalkan.',
    highInterestWarning: worst && worst.annualRatePct >= 18
      ? `"${worst.name}" berbunga ${worst.annualRatePct}% per tahun. Melunasi utang ini setara memperoleh imbal hasil ${worst.annualRatePct}% bebas risiko — hampir tidak ada investasi yang bisa mengalahkannya secara konsisten. Dahulukan ini sebelum berinvestasi.`
      : null,
  }
}

// ── Risk profile ─────────────────────────────────────────────────────────────

export interface RiskAnswers {
  horizonYears: number
  /** Reaction to a 20% drop: 0 sell all, 1 sell some, 2 hold, 3 buy more. */
  drawdownReaction: 0 | 1 | 2 | 3
  hasEmergencyFund: boolean
  hasHighInterestDebt: boolean
  incomeStability: 0 | 1 | 2   // 0 unstable, 1 mixed, 2 stable
  experience: 0 | 1 | 2
}

export type RiskLevel = 'konservatif' | 'moderat' | 'agresif'

export interface RiskResult {
  level: RiskLevel
  score: number
  /** Broad asset-class mix — never individual securities. */
  allocation: { label: string; pct: number; note: string }[]
  blockers: string[]
  reasoning: string
}

export function assessRisk(a: RiskAnswers): RiskResult {
  let score = 0
  score += a.horizonYears >= 10 ? 3 : a.horizonYears >= 5 ? 2 : a.horizonYears >= 2 ? 1 : 0
  score += a.drawdownReaction
  score += a.incomeStability
  score += a.experience

  // Two conditions override any questionnaire answer, because they are about
  // capacity to take risk rather than willingness — and willingness cannot pay
  // a 24% credit-card bill.
  const blockers: string[] = []
  if (a.hasHighInterestDebt) blockers.push(
    'Anda masih punya utang berbunga tinggi. Melunasinya memberi imbal hasil pasti sebesar bunga utang itu — bereskan lebih dulu sebelum menambah porsi investasi berisiko.')
  if (!a.hasEmergencyFund) blockers.push(
    'Dana darurat belum terbentuk. Tanpa penyangga, penurunan pasar yang bersamaan dengan kebutuhan mendadak memaksa Anda menjual di harga terburuk.')

  const level: RiskLevel = blockers.length ? 'konservatif' : score >= 8 ? 'agresif' : score >= 5 ? 'moderat' : 'konservatif'

  const allocation =
    level === 'agresif'
      ? [
          { label: 'Saham / reksa dana saham & indeks', pct: 70, note: 'Potensi tertinggi, juga penurunan terdalam. Hanya untuk uang yang tidak akan dipakai bertahun-tahun.' },
          { label: 'Obligasi / reksa dana pendapatan tetap', pct: 20, note: 'Peredam saat pasar saham jatuh.' },
          { label: 'Kas & pasar uang', pct: 10, note: 'Likuiditas untuk kebutuhan dekat.' },
        ]
      : level === 'moderat'
      ? [
          { label: 'Saham / reksa dana saham & indeks', pct: 50, note: 'Mesin pertumbuhan, dengan porsi yang masih bisa Anda tahan saat turun.' },
          { label: 'Obligasi / reksa dana pendapatan tetap', pct: 35, note: 'Menstabilkan nilai portofolio.' },
          { label: 'Kas & pasar uang', pct: 15, note: 'Likuiditas dan ketenangan.' },
        ]
      : [
          { label: 'Kas, deposito & pasar uang', pct: 50, note: 'Prioritas menjaga nilai pokok dan likuiditas.' },
          { label: 'Obligasi / pendapatan tetap', pct: 35, note: 'Imbal hasil lebih tinggi dari kas dengan fluktuasi terbatas.' },
          { label: 'Saham / reksa dana indeks', pct: 15, note: 'Porsi kecil agar tetap tumbuh melawan inflasi.' },
        ]

  return {
    level, score, allocation, blockers,
    reasoning: blockers.length
      ? 'Profil dikunci di konservatif bukan karena jawaban Anda, melainkan karena kondisi keuangan dasarnya belum siap menanggung risiko. Ini soal kemampuan, bukan keberanian.'
      : `Jangka waktu ${a.horizonYears} tahun, reaksi Anda terhadap penurunan, kestabilan penghasilan, dan pengalaman menghasilkan skor ${score}. Alokasi di bawah adalah kelas aset, bukan rekomendasi produk atau saham tertentu.`,
  }
}

// ── Projection ───────────────────────────────────────────────────────────────

/**
 * Compound growth of regular contributions.
 *
 * Returned as a RANGE, not a single figure. A single number implies a certainty
 * that does not exist, and people plan their lives around it.
 */
export function project(monthly: number, years: number, annualRatePct: number, startingAmount = 0): { year: number; value: number }[] {
  const r = annualRatePct / 100 / 12
  const out: { year: number; value: number }[] = []
  let v = startingAmount
  for (let m = 1; m <= years * 12; m++) {
    v = v * (1 + r) + monthly
    if (m % 12 === 0) out.push({ year: m / 12, value: Math.round(v) })
  }
  return out
}

export function formatIdr(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return 'Rp ' + Math.round(n).toLocaleString('en-GB')
}
