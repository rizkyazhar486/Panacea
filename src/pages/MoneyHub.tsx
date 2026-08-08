import { useEffect, useMemo, useState } from 'react'
import { hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconToken } from '../components/icons'
import {
  CATEGORY_LABEL, summarise, emergencyMonths, emergencyVerdict, planDebt, assessRisk,
  project, formatIdr,
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
    { id: 'catat', l: 'Catat' },
    { id: 'arus', l: 'Arus Kas' },
    { id: 'darurat', l: 'Dana Darurat' },
    { id: 'utang', l: 'Utang' },
    { id: 'investasi', l: 'Profil Risiko' },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">💰</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Keuangan Pribadi</h1>
          <p className="text-xs text-neutral-500">Catat, lihat ke mana uang pergi, dan tahu urutan yang benar</p>
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
        Alat bantu edukasi keuangan pribadi. Halaman ini tidak memberi rekomendasi membeli atau
        menjual saham maupun produk investasi tertentu, dan bukan pengganti nasihat perencana
        keuangan berizin. Seluruh data disimpan di perangkat Anda sendiri.
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
        <SectionTitle icon={<IconToken size={18} />} title="Catat transaksi" subtitle="Ten seconds is enough — regularity matters more than completeness" />
        <div className="mt-3 flex gap-2">
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-bold transition ${kind === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}
            >
              {k === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <Field label="Jumlah (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="50000"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>

        {kind === 'expense' && (
          <div className="mt-3">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Kategori</div>
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
          <Field label="Tanggal">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Catatan (opsional)">
            <input className={inputClass} placeholder="makan siang" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <Button className="mt-3 w-full" onClick={add}>Tambahkan</Button>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Terakhir dicatat</div>
        {recent.length === 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
            Belum ada catatan. Mulai dari mencatat pengeluaran hari ini saja — jangan mencoba
            merekonstruksi sebulan ke belakang, karena itulah yang membuat sebagian besar orang
            berhenti di hari pertama.
          </p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-ink dark:text-ink">
                    {t.kind === 'income' ? 'Pemasukan' : CATEGORY_LABEL[t.category]}
                  </div>
                  <div className="text-[10px] text-neutral-500">{t.date}{t.note ? ` · ${t.note}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-black ${t.kind === 'income' ? 'text-emerald-600' : 'text-neutral-700 dark:text-neutral-200'}`}>
                    {t.kind === 'income' ? '+' : '−'}{formatIdr(t.amount)}
                  </span>
                  <button onClick={() => setTxs((x) => x.filter((y) => y.id !== t.id))}
                    className="text-[11px] font-bold text-rose-500 hover:underline">Hapus</button>
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
          Belum ada data. Catat beberapa transaksi lebih dulu di tab <b>Catat</b> — analisis di sini
          dihitung dari catatan Anda sendiri, bukan dari angka contoh.
        </p>
      </Card>
    )
  }

  const b = summary.bucketPct
  const verdict =
    summary.net < 0 ? { l: 'Pengeluaran melebihi pemasukan', tone: 'critical' as const }
    : summary.savingsRatePct < 10 ? { l: 'Sisa tipis', tone: 'high' as const }
    : summary.savingsRatePct < 20 ? { l: 'Adequate sehat', tone: 'low' as const }
    : { l: 'Sehat', tone: 'normal' as const }

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Arus kas" subtitle="From the transactions you record" />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-500/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Masuk</div>
            <div className="text-[13px] font-black text-emerald-700 dark:text-emerald-300">{formatIdr(summary.income)}</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-2.5 dark:bg-rose-500/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Keluar</div>
            <div className="text-[13px] font-black text-rose-700 dark:text-rose-300">{formatIdr(summary.expense)}</div>
          </div>
          <div className="rounded-xl bg-neutral-100 p-2.5 dark:bg-white/10">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Sisa</div>
            <div className="text-[13px] font-black text-ink dark:text-ink">{formatIdr(summary.net)}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={verdict.tone}>{verdict.l}</Badge>
          {summary.income > 0 && (
            <span className="text-[11px] text-neutral-500">Rasio menabung {summary.savingsRatePct.toFixed(0)}%</span>
          )}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Pola 50/30/20</div>
        <div className="mt-2 space-y-2">
          {([
            ['needs', 'Kebutuhan', 50],
            ['wants', 'Keinginan', 30],
            ['savings', 'Menabung & bayar utang', 20],
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
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
          50/30/20 adalah patokan kasar, bukan aturan. Di kota dengan biaya sewa tinggi, porsi
          kebutuhan hampir selalu melewati 50% dan itu bukan tanda Anda boros — yang lebih berguna
          adalah melihat arahnya dari bulan ke bulan, bukan membandingkannya dengan angka ideal.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Ke mana uang pergi</div>
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
        <SectionTitle icon={<IconToken size={18} />} title="Dana darurat" subtitle="Prioritas pertama, sebelum investasi apa pun" />
        <div className="mt-3 grid gap-3">
          <Field label="Tabungan likuid saat ini (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="10000000"
              value={savings} onChange={(e2) => setSavings(e2.target.value)} />
          </Field>
          <Field label="Pengeluaran POKOK per bulan (Rp)">
            <input className={inputClass} inputMode="numeric" placeholder="5000000"
              value={essentials} onChange={(e2) => setEssentials(e2.target.value)} />
          </Field>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Gunakan pengeluaran <b>pokok</b>, bukan total. Yang menentukan saat penghasilan berhenti
          adalah apa yang tetap harus dibayar — bukan apa yang biasa Anda belanjakan.
        </p>

        {s > 0 && e > 0 && (
          <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-neutral-500">Bertahan sekitar</span>
              <span className="text-2xl font-black text-ink dark:text-ink">{months.toFixed(1)}<span className="text-sm text-neutral-500"> bulan</span></span>
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
        <SectionTitle icon={<IconToken size={18} />} title="Daftar utang" subtitle="The payoff order decides how much interest you pay in total" />
        <div className="mt-3 grid gap-2">
          <Field label="Nama utang"><input className={inputClass} placeholder="Kartu kredit A" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Sisa (Rp)"><input className={inputClass} inputMode="numeric" placeholder="8000000" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
            <Field label="Bunga / tahun (%)"><input className={inputClass} inputMode="decimal" placeholder="24" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          </div>
          <Field label="Cicilan minimum (Rp)"><input className={inputClass} inputMode="numeric" placeholder="500000" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></Field>
        </div>
        <Button className="mt-3 w-full" onClick={add}>Tambahkan utang</Button>
      </Card>

      {debts.length > 0 && (
        <Card className="!p-4">
          <div className="flex gap-2">
            {([['avalanche', 'Bunga tertinggi dulu'], ['snowball', 'Saldo terkecil dulu']] as const).map(([k, l]) => (
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
                  <div className="text-[10px] text-neutral-500">{formatIdr(d.balance)} · {d.annualRatePct}% / tahun</div>
                </div>
                <button onClick={() => setDebts((x) => x.filter((y) => y.id !== d.id))}
                  className="shrink-0 text-[11px] font-bold text-rose-500 hover:underline">Hapus</button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-[12px] dark:bg-white/5">
            <div className="flex justify-between"><span className="text-neutral-500">Total utang</span><span className="font-black text-ink dark:text-ink">{formatIdr(plan.totalBalance)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-neutral-500">Bunga rata-rata tertimbang</span><span className="font-black text-ink dark:text-ink">{plan.weightedRatePct.toFixed(1)}%</span></div>
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
        <SectionTitle icon={<IconToken size={18} />} title="Profil risiko" subtitle="Menentukan campuran kelas aset — bukan saham tertentu" />

        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">Uang ini tidak akan dipakai selama</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[1, 3, 5, 10, 20].map((y) => (
                <button key={y} onClick={() => set({ horizonYears: y })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${a.horizonYears === y ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {y} tahun
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">Jika nilainya turun 20% dalam sebulan, Anda akan</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {([[0, 'Jual semua'], [1, 'Jual sebagian'], [2, 'Diamkan'], [3, 'Tambah beli']] as const).map(([v, l]) => (
                <button key={v} onClick={() => set({ drawdownReaction: v })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${a.drawdownReaction === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">Kestabilan penghasilan</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {([[0, 'Tidak tetap'], [1, 'Campuran'], [2, 'Tetap']] as const).map(([v, l]) => (
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
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Dana darurat minimal 3 bulan sudah ada</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" checked={a.hasHighInterestDebt} onChange={(e) => set({ hasHighInterestDebt: e.target.checked })} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Masih punya utang berbunga tinggi (di atas 15% per tahun)</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Your profile</span>
          <Badge tone={r.level === 'agresif' ? 'high' : r.level === 'moderat' ? 'low' : 'normal'}>{r.level}</Badge>
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
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Proyeksi menabung rutin</div>
        <div className="mt-2">
          <Field label="Setoran per bulan (Rp)">
            <input className={inputClass} inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
        </div>
        {m > 0 && (
          <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="text-[12px] font-bold text-neutral-500">Setelah {a.horizonYears} tahun, kemungkinan berada di antara</div>
            <div className="mt-1 text-[15px] font-black text-ink dark:text-ink">
              {formatIdr(low[low.length - 1]?.value ?? 0)} — {formatIdr(high[high.length - 1]?.value ?? 0)}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              Ditampilkan sebagai rentang (asumsi 4% dan 9% per tahun), bukan satu angka. Satu angka
              memberi kesan pasti yang tidak ada — dan orang menyusun rencana hidup di atas kesan itu.
              Hasil sesungguhnya bisa di luar rentang ini, termasuk lebih rendah dari total setoran
              Anda bila pasar sedang buruk saat Anda membutuhkannya.
            </p>
          </div>
        )}
      </Card>
    </>
  )
}

export default MoneyHub
