import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconToken } from '../components/icons'
import {
  CATEGORY_LABEL, summarise, emergencyMonths, emergencyVerdict, planDebt, assessRisk,
  project, formatIdr, RISK_LEVEL_LABEL,
  type Category, type Tx, type Debt, type RiskAnswers,
} from '../lib/finance'

// ─────────────────────────────────────────────────────────────────────────────
// Money Hub — recording, cash flow, emergency fund, debt order, risk profile.
//
// What this page will NOT do, deliberately: name a security to buy or sell.
// That is regulated investment advice and an algorithm issuing buy/sell calls
// on someone's savings can cause real financial harm. The parts that actually
// decide most people's outcomes — where the money goes, whether there is a
// buffer, whether expensive debt is cleared first, and whether the asset mix
// matches the time horizon — are safe to automate and are what this page does.
// ─────────────────────────────────────────────────────────────────────────────

const TX_KEY = 'pmd_finance_tx_v1'
const DEBT_KEY = 'pmd_finance_debt_v1'

const EXPENSE_CATEGORIES: Category[] = [
  'housing', 'food', 'transport', 'utilities', 'health', 'debt',
  'education', 'lifestyle', 'shopping', 'savings', 'other',
]

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback } catch { return fallback }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ }
}

type Tab = 'catat' | 'arus' | 'darurat' | 'utang' | 'investasi'

export function MoneyHub() {
  const [tab, setTab] = useState<Tab>('catat')
  const [txs, setTxs] = useState<Tx[]>(() => load<Tx[]>(TX_KEY, []))
  const [debts, setDebts] = useState<Debt[]>(() => load<Debt[]>(DEBT_KEY, []))

  useEffect(() => save(TX_KEY, txs), [txs])
  useEffect(() => save(DEBT_KEY, debts), [debts])

  const summary = useMemo(() => summarise(txs), [txs])

  const TABS: { id: Tab; l: string }[] = [
    { id: 'catat', l: 'Record' },
    { id: 'arus', l: 'Cash Flow' },
    { id: 'darurat', l: 'Emergency Fund' },
    { id: 'utang', l: 'Debt' },
    { id: 'investasi', l: 'Risk Profile' },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">💰</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Personal Finance</h1>
          <p className="text-xs text-neutral-500">Record it, see where the money goes, and know the right order</p>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'catat' && <RecordTab txs={txs} setTxs={setTxs} />}
      {tab === 'arus' && <CashflowTab summary={summary} hasData={txs.length > 0} />}
      {tab === 'darurat' && <EmergencyTab summary={summary} />}
      {tab === 'utang' && <DebtTab debts={debts} setDebts={setDebts} />}
      {tab === 'investasi' && <RiskTab />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        An educational personal-finance tool. This page does not recommend buying or selling any
        specific security or investment product, and is not a substitute for advice from a licensed
        financial planner. All data stays on your own device.
      </div>
    </div>
  )
}

/* ── Catat ─────────────────────────────────────────────────────────────────── */
function RecordTab({ txs, setTxs }: { txs: Tx[]; setTxs: (f: (t: Tx[]) => Tx[]) => void }) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState<Category>('food')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => hariIni())

  function add() {
    const n = Number(amount.replace(/[^\d]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return
    setTxs((t) => [{
      id: Math.random().toString(36).slice(2),
      date, kind, amount: n,
      category: kind === 'income' ? 'income' : category,
      note: note.trim() || undefined,
    }, ...t])
    setAmount(''); setNote('')
  }

  const recent = txs.slice(0, 15)

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Record a transaction" subtitle="Ten seconds is enough — consistency matters more than completeness" />
        <div className="mt-3 flex gap-2">
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-bold transition ${kind === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
            >
              {k === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <Field label="Amount (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="50000"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>

        {kind === 'expense' && (
          <div className="mt-3">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Category</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${category === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Date">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note (optional)">
            <input className={inputClass} placeholder="lunch" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <Button className="mt-3 w-full" onClick={add}>Add</Button>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Recently recorded</div>
        {recent.length === 0 ? (
          <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-500">Nothing recorded yet. Start with just today's spending — do not try to reconstruct the past month, because that is what makes most people quit on day one.</Prosa>
        ) : (
          <div className="mt-2 space-y-1.5">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-ink dark:text-ink">
                    {t.kind === 'income' ? 'Income' : CATEGORY_LABEL[t.category]}
                  </div>
                  <div className="text-[10px] text-neutral-500">{t.date}{t.note ? ` · ${t.note}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-black ${t.kind === 'income' ? 'text-emerald-600' : 'text-neutral-700 dark:text-neutral-200'}`}>
                    {t.kind === 'income' ? '+' : '−'}{formatIdr(t.amount)}
                  </span>
                  <button onClick={() => setTxs((x) => x.filter((y) => y.id !== t.id))}
                    className="text-[11px] font-bold text-rose-500 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

/* ── Arus kas ──────────────────────────────────────────────────────────────── */
function CashflowTab({ summary, hasData }: { summary: ReturnType<typeof summarise>; hasData: boolean }) {
  if (!hasData) {
    return (
      <Card className="!p-4">
        <p className="text-[12px] leading-relaxed text-neutral-500">
          No data yet. Record a few transactions in the <b>Record</b> tab first — everything here is
          calculated from your own entries, not from sample numbers.
        </p>
      </Card>
    )
  }

  const b = summary.bucketPct
  const verdict =
    summary.net < 0 ? { l: 'Spending exceeds income', tone: 'critical' as const }
    : summary.savingsRatePct < 10 ? { l: 'Thin margin', tone: 'high' as const }
    : summary.savingsRatePct < 20 ? { l: 'Reasonably healthy', tone: 'low' as const }
    : { l: 'Healthy', tone: 'normal' as const }

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Cash flow" subtitle="From the transactions you recorded" />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-500/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">In</div>
            <div className="text-[13px] font-black text-emerald-700 dark:text-emerald-300">{formatIdr(summary.income)}</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-2.5 dark:bg-rose-500/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Out</div>
            <div className="text-[13px] font-black text-rose-700 dark:text-rose-300">{formatIdr(summary.expense)}</div>
          </div>
          <div className="rounded-xl bg-neutral-100 p-2.5 dark:bg-white/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Left</div>
            <div className="text-[13px] font-black text-ink dark:text-ink">{formatIdr(summary.net)}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={verdict.tone}>{verdict.l}</Badge>
          {summary.income > 0 && (
            <span className="text-[11px] text-neutral-500">Savings rate {summary.savingsRatePct.toFixed(0)}%</span>
          )}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">The 50/30/20 pattern</div>
        <div className="mt-2 space-y-2">
          {([
            ['needs', 'Needs', 50],
            ['wants', 'Wants', 30],
            ['savings', 'Saving & debt repayment', 20],
          ] as const).map(([k, label, target]) => (
            <div key={k}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold text-ink dark:text-ink">{label}</span>
                <span className="text-neutral-500">{b[k].toFixed(0)}% <span className="text-neutral-500">(target {target}%)</span></span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, b[k])}%` }} />
              </div>
            </div>
          ))}
        </div>
        <Prosa kelas="mt-3 text-[11px] leading-relaxed text-neutral-500">50/30/20 is a rough guide, not a rule. In a high-rent city the needs share almost always passes 50%, and that is not a sign you overspend — what actually helps is watching the direction month to month, rather than comparing yourself with an ideal number.</Prosa>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Where the money goes</div>
        <div className="mt-2 space-y-1.5">
          {summary.byCategory.map((c) => (
            <div key={c.category} className="flex items-center gap-2">
              <div className="w-32 shrink-0 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{CATEGORY_LABEL[c.category]}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-brand/70" style={{ width: `${c.pct}%` }} />
              </div>
              <div className="w-24 shrink-0 text-right text-[11px] font-bold text-ink dark:text-ink">{formatIdr(c.amount)}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ── Dana darurat ──────────────────────────────────────────────────────────── */
function EmergencyTab({ summary }: { summary: ReturnType<typeof summarise> }) {
  const [savings, setSavings] = useState('')
  const [essentials, setEssentials] = useState(() => String(Math.round(summary.buckets.needs) || ''))
  const s = Number(savings.replace(/[^\d]/g, '')) || 0
  const e = Number(essentials.replace(/[^\d]/g, '')) || 0
  const months = emergencyMonths(s, e)
  const v = emergencyVerdict(months)

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Emergency fund" subtitle="The first priority, before any investing" />
        <div className="mt-3 grid gap-3">
          <Field label="Liquid savings right now (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="10000000"
              value={savings} onChange={(e2) => setSavings(e2.target.value)} />
          </Field>
          <Field label="ESSENTIAL spending per month (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="5000000"
              value={essentials} onChange={(e2) => setEssentials(e2.target.value)} />
          </Field>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Use <b>essential</b> spending, not the total. What matters when income stops is what still
          has to be paid — not what you usually spend.
        </p>

        {s > 0 && e > 0 && (
          <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-neutral-500">Lasts roughly</span>
              <span className="text-2xl font-black text-ink dark:text-ink">{months.toFixed(1)}<span className="text-sm text-neutral-500"> months</span></span>
            </div>
            <div className="mt-1"><Badge tone={v.tone}>{v.label}</Badge></div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{v.advice}</p>
          </div>
        )}
      </Card>
    </>
  )
}

/* ── Utang ─────────────────────────────────────────────────────────────────── */
function DebtTab({ debts, setDebts }: { debts: Debt[]; setDebts: (f: (d: Debt[]) => Debt[]) => void }) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [rate, setRate] = useState('')
  const [minPay, setMinPay] = useState('')
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const plan = useMemo(() => planDebt(debts, strategy), [debts, strategy])

  function add() {
    const b = Number(balance.replace(/[^\d]/g, ''))
    const r = Number(rate.replace(',', '.'))
    if (!name.trim() || !Number.isFinite(b) || b <= 0) return
    setDebts((d) => [...d, {
      id: Math.random().toString(36).slice(2),
      name: name.trim(), balance: b,
      annualRatePct: Number.isFinite(r) ? r : 0,
      minPayment: Number(minPay.replace(/[^\d]/g, '')) || 0,
    }])
    setName(''); setBalance(''); setRate(''); setMinPay('')
  }

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Your debts" subtitle="The order you clear them decides how much interest you pay in total" />
        <div className="mt-3 grid gap-2">
          <Field label="Debt name"><input className={inputClass} placeholder="Credit card A" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Balance (Rp)"><input className={inputClass} inputMode="numeric" placeholder="8000000" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
            <Field label="Interest / year (%)"><input className={inputClass} inputMode="decimal" placeholder="24" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          </div>
          <Field label="Minimum payment (Rp)"><input className={inputClass} inputMode="numeric" placeholder="500000" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></Field>
        </div>
        <Button className="mt-3 w-full" onClick={add}>Add debt</Button>
      </Card>

      {debts.length > 0 && (
        <Card className="!p-4">
          <div className="flex gap-2">
            {([['avalanche', 'Highest interest first'], ['snowball', 'Smallest balance first']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setStrategy(k)}
                className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold transition ${strategy === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{plan.rationale}</p>

          {plan.highInterestWarning && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[12px] leading-relaxed text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
              {plan.highInterestWarning}
            </div>
          )}

          <div className="mt-3 space-y-1.5">
            {plan.order.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-ink dark:text-ink">{i + 1}. {d.name}</div>
                  <div className="text-[10px] text-neutral-500">{formatIdr(d.balance)} · {d.annualRatePct}% / year</div>
                </div>
                <button onClick={() => setDebts((x) => x.filter((y) => y.id !== d.id))}
                  className="shrink-0 text-[11px] font-bold text-rose-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-[12px] dark:bg-white/5">
            <div className="flex justify-between"><span className="text-neutral-500">Total debt</span><span className="font-black text-ink dark:text-ink">{formatIdr(plan.totalBalance)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-neutral-500">Weighted average interest</span><span className="font-black text-ink dark:text-ink">{plan.weightedRatePct.toFixed(1)}%</span></div>
          </div>
        </Card>
      )}
    </>
  )
}

/* ── Profil risiko ─────────────────────────────────────────────────────────── */
function RiskTab() {
  const [a, setA] = useState<RiskAnswers>({
    horizonYears: 5, drawdownReaction: 2, hasEmergencyFund: false,
    hasHighInterestDebt: false, incomeStability: 1, experience: 1,
  })
  const r = useMemo(() => assessRisk(a), [a])
  const [monthly, setMonthly] = useState('1000000')
  const m = Number(monthly.replace(/[^\d]/g, '')) || 0
  const low = useMemo(() => project(m, a.horizonYears, 4), [m, a.horizonYears])
  const high = useMemo(() => project(m, a.horizonYears, 9), [m, a.horizonYears])

  const set = (p: Partial<RiskAnswers>) => setA({ ...a, ...p })

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Risk profile" subtitle="Sets the mix of asset classes — not any particular security" />

        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">This money will not be touched for</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[1, 3, 5, 10, 20].map((y) => (
                <button key={y} onClick={() => set({ horizonYears: y })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${a.horizonYears === y ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {y} years
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">If it dropped 20% in a month, you would</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {([[0, 'Sell everything'], [1, 'Sell some'], [2, 'Leave it alone'], [3, 'Buy more']] as const).map(([v, l]) => (
                <button key={v} onClick={() => set({ drawdownReaction: v })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${a.drawdownReaction === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">Income stability</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {([[0, 'Irregular'], [1, 'Mixed'], [2, 'Steady']] as const).map(([v, l]) => (
                <button key={v} onClick={() => set({ incomeStability: v })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${a.incomeStability === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" checked={a.hasEmergencyFund} onChange={(e) => set({ hasEmergencyFund: e.target.checked })} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">I have at least 3 months of emergency fund</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" checked={a.hasHighInterestDebt} onChange={(e) => set({ hasHighInterestDebt: e.target.checked })} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">I still have high-interest debt (above 15% a year)</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Your profile</span>
          <Badge tone={r.level === 'agresif' ? 'high' : r.level === 'moderat' ? 'low' : 'normal'}>{RISK_LEVEL_LABEL[r.level]}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{r.reasoning}</p>

        {r.blockers.length > 0 && (
          <div className="mt-3 space-y-2">
            {r.blockers.map((b, i) => (
              <div key={i} className="rounded-xl bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{b}</div>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-2">
          {r.allocation.map((al) => (
            <div key={al.label} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-ink dark:text-ink">{al.label}</span>
                <span className="text-[13px] font-black text-brand-dark">{al.pct}%</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{al.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Regular-saving projection</div>
        <div className="mt-2">
          <Field label="Contribution per month (Rp)">
            <input className={inputClass} inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
        </div>
        {m > 0 && (
          <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="text-[12px] font-bold text-neutral-500">After {a.horizonYears} years, likely somewhere between</div>
            <div className="mt-1 text-[15px] font-black text-ink dark:text-ink">
              {formatIdr(low[low.length - 1]?.value ?? 0)} — {formatIdr(high[high.length - 1]?.value ?? 0)}
            </div>
            <Prosa kelas="mt-2 text-[11px] leading-relaxed text-neutral-500">Shown as a range (assuming 4% and 9% a year), not a single number. A single number implies a certainty that does not exist — and people build life plans on that impression. The real outcome can fall outside this range, including below what you paid in, if markets are down when you need the money.</Prosa>
          </div>
        )}
      </Card>
    </>
  )
}

export default MoneyHub
