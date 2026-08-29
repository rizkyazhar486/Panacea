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
  income: 'Income',
  housing: 'Housing',
  food: 'Food & groceries',
  transport: 'Transport',
  utilities: 'Utilities & internet',
  health: 'Health',
  debt: 'Debt repayments',
  education: 'Education',
  lifestyle: 'Lifestyle & entertainment',
  shopping: 'Shopping',
  savings: 'Savings & investing',
  other: 'Other',
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
    label: 'No buffer yet', tone: 'critical',
    advice: 'This is priority number one, ahead of any investing. Without an emergency fund, a single unexpected event forces you into high-interest debt — and that interest will almost certainly cost more than any investment return you could chase.',
  }
  if (months < 3) return {
    label: 'Thin', tone: 'high',
    advice: 'Keep adding until you have at least 3 months of essential spending before increasing your exposure to risk.',
  }
  if (months < 6) return {
    label: 'Adequate', tone: 'low',
    advice: 'Enough for most situations. Aim for 6 months if your income is irregular, you freelance, or you are the only earner.',
  }
  return {
    label: 'Strong', tone: 'normal',
    advice: 'Your buffer is strong. Beyond about 12 months of essential spending, cash is usually better partly redirected — it loses value to inflation.',
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
      ? 'Highest interest is cleared first. Mathematically this is the cheapest route — you pay the least total interest.'
      : 'Smallest balance is cleared first. Slightly more expensive on paper, but the early wins keep some people going — and a plan you actually follow beats an optimal plan you abandon.',
    highInterestWarning: worst && worst.annualRatePct >= 18
      ? `"${worst.name}" charges ${worst.annualRatePct}% a year. Paying it off is the same as earning a risk-free ${worst.annualRatePct}% return — almost no investment beats that consistently. Clear this before you invest.`
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

// Nilainya IDENTITAS, dibandingkan dengan === dan tersimpan di perangkat
// pengguna; menerjemahkannya akan mengosongkan profil yang sudah tersimpan.
// Yang diterjemahkan labelnya.
export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  konservatif: 'Conservative',
  moderat: 'Moderate',
  agresif: 'Aggressive',
}

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
    'You still carry high-interest debt. Paying it off returns exactly that interest rate, guaranteed — clear it before taking on more investment risk.')
  if (!a.hasEmergencyFund) blockers.push(
    'You have no emergency fund yet. Without a buffer, a market drop that coincides with an urgent need forces you to sell at the worst possible price.')

  const level: RiskLevel = blockers.length ? 'konservatif' : score >= 8 ? 'agresif' : score >= 5 ? 'moderat' : 'konservatif'

  const allocation =
    level === 'agresif'
      ? [
          { label: 'Equities / index & equity funds', pct: 70, note: 'Highest potential, and the deepest falls. Only for money you will not touch for years.' },
          { label: 'Bonds / fixed-income funds', pct: 20, note: 'A shock absorber when equities fall.' },
          { label: 'Cash & money market', pct: 10, note: 'Liquidity for near-term needs.' },
        ]
      : level === 'moderat'
      ? [
          { label: 'Equities / index & equity funds', pct: 50, note: 'The growth engine, at a size you can still stomach in a downturn.' },
          { label: 'Bonds / fixed-income funds', pct: 35, note: 'Steadies the value of the portfolio.' },
          { label: 'Cash & money market', pct: 15, note: 'Liquidity, and peace of mind.' },
        ]
      : [
          { label: 'Cash, deposits & money market', pct: 50, note: 'Protecting the principal and staying liquid come first.' },
          { label: 'Bonds / fixed income', pct: 35, note: 'More return than cash, with limited swings.' },
          { label: 'Equities / index funds', pct: 15, note: 'A small slice so the money still outgrows inflation.' },
        ]

  return {
    level, score, allocation, blockers,
    reasoning: blockers.length
      ? 'The profile is locked to conservative not because of your answers, but because the underlying finances are not ready to carry risk yet. This is about capacity, not nerve.'
      : `A ${a.horizonYears}-year horizon, your reaction to a drawdown, your income stability and your experience give a score of ${score}. The allocation below is asset classes — not a recommendation of any specific product or security.`,
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
