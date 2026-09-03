import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconToken } from '../components/icons'
import {
  BLOC_LABEL, COUNTRIES, DATA_AS_OF, DATA_SOURCES, gdpPerCapitaUsd,
  rateImpact, simulatePolicy, analyseTrade,
  type Bloc, type Country,
} from '../lib/macroEconomics'

// Macro Lab. Two rules the page states openly rather than hiding:
//   - the country table is dated static reference, not a live feed
//   - the simulator shows consequences of YOUR assumptions, not a forecast

type Tab = 'negara' | 'suku-bunga' | 'simulasi' | 'dagang'
type Metric = 'gdpUsdTn' | 'inflationPct' | 'policyRatePct' | 'unemploymentPct' | 'govDebtPctGdp' | 'perCapita'

const METRIC_LABEL: Record<Metric, string> = {
  gdpUsdTn: 'GDP (trillion USD)',
  perCapita: 'GDP per capita (USD)',
  inflationPct: 'Inflation (%)',
  policyRatePct: 'Policy rate (%)',
  unemploymentPct: 'Unemployment (%)',
  govDebtPctGdp: 'Government debt (% of GDP)',
}

export function MacroLab() {
  const [tab, setTab] = useState<Tab>('negara')

  const TABS: { id: Tab; l: string }[] = [
    { id: 'negara', l: 'Country Comparison' },
    { id: 'suku-bunga', l: 'Interest Rate Effects' },
    { id: 'simulasi', l: 'Policy Simulation' },
    { id: 'dagang', l: 'Trade' },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🌐</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Macro Lab</h1>
          <p className="text-xs text-neutral-500">Macroeconomics, interest rates and trade — with the assumptions in the open</p>
        </div>
      </div>

      <Card className="!p-4">
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <span className="text-base">⚠️</span>
          <p className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            The country figures on this page are <b>static reference data as of {DATA_AS_OF}</b>, not
            a live feed. A number without a date is more misleading than no number at all — so verify
            against primary sources before using any of it for a real decision. The simulation section
            is <b>not a forecast</b>: it shows the mechanical consequences of the assumptions you
            enter yourself.
          </p>
        </div>
      </Card>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'negara' && <CountryTab />}
      {tab === 'suku-bunga' && <RateTab />}
      {tab === 'simulasi' && <SimTab />}
      {tab === 'dagang' && <TradeTab />}

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Data source</div>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-neutral-500">
          {DATA_SOURCES.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        An educational macroeconomics tool. Not investment or policy advice, and it does not predict
        market movements. Figures are rounded for comparison, not for precise calculation.
      </div>
    </div>
  )
}

/* ── Perbandingan negara ───────────────────────────────────────────────────── */
function CountryTab() {
  const [bloc, setBloc] = useState<Bloc | null>('top10')
  const [metric, setMetric] = useState<Metric>('gdpUsdTn')

  const rows = useMemo(() => {
    const list = bloc ? COUNTRIES.filter((c) => c.blocs.includes(bloc)) : COUNTRIES
    const value = (c: Country) => (metric === 'perCapita' ? gdpPerCapitaUsd(c) : (c[metric] as number))
    return [...list].sort((a, b) => value(b) - value(a)).map((c) => ({ c, v: value(c) }))
  }, [bloc, metric])

  const max = Math.max(...rows.map((r) => r.v), 1)
  const fmt = (v: number) =>
    metric === 'perCapita' ? '$' + Math.round(v).toLocaleString('en-GB')
    : metric === 'gdpUsdTn' ? '$' + v.toFixed(1) + ' T'
    : v.toFixed(1) + '%'

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Country comparison" subtitle={`Reference data as of ${DATA_AS_OF}`} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => setBloc(null)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!bloc ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            All
          </button>
          {(Object.keys(BLOC_LABEL) as Bloc[]).map((b) => (
            <button key={b} onClick={() => setBloc(b)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${bloc === b ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {BLOC_LABEL[b]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
            <button key={m} onClick={() => setMetric(m)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${metric === m ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">{METRIC_LABEL[metric]}</div>
        <div className="mt-2 space-y-1.5">
          {rows.map(({ c, v }) => (
            <div key={c.code} className="flex items-center gap-2">
              <div className="w-28 shrink-0 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">{c.name}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <div className={`h-full rounded-full ${c.code === 'ID' ? 'bg-brand' : 'bg-brand/50'}`}
                  style={{ width: `${Math.max(2, (v / max) * 100)}%` }} />
              </div>
              <div className="w-24 shrink-0 text-right text-[11px] font-bold text-ink dark:text-ink">{fmt(v)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Detail</div>
        <div className="mt-2 space-y-2">
          {rows.map(({ c }) => (
            <div key={c.code} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-ink dark:text-ink">{c.name}</span>
                <Badge tone={c.code === 'ID' ? 'brand' : 'low'}>{c.blocs.map((b) => BLOC_LABEL[b]).join(' · ')}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                <span>PDB: ${c.gdpUsdTn.toFixed(1)} T</span>
                <span>Per capita: ${Math.round(gdpPerCapitaUsd(c)).toLocaleString('en-GB')}</span>
                <span>Inflation: {c.inflationPct}%</span>
                <span>Policy rate: {c.policyRatePct}%</span>
                <span>Unemployment: {c.unemploymentPct}%</span>
                <span>Debt: {c.govDebtPctGdp}% of GDP</span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-500">{c.centralBank}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ── Dampak suku bunga ─────────────────────────────────────────────────────── */
function RateTab() {
  const [delta, setDelta] = useState(1)
  const [pass, setPass] = useState(0.7)
  const [debt, setDebt] = useState(100)
  const r = useMemo(() => rateImpact({ deltaRatePp: delta, passThrough: pass, householdDebtPctIncome: debt }), [delta, pass, debt])

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Effects of an interest-rate change" subtitle="The consequences that follow from your own assumptions" />
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[12px] font-bold text-ink dark:text-ink">Change in the policy rate</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[-2, -1, -0.5, 0.5, 1, 2].map((d) => (
                <button key={d} onClick={() => setDelta(d)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${delta === d ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {d > 0 ? '+' : ''}{d} pp
                </button>
              ))}
            </div>
          </div>
          <Field label={`Pass-through ke bunga kredit: ${(pass * 100).toFixed(0)}%`}>
            <input type="range" min={0} max={1} step={0.05} value={pass}
              onChange={(e) => setPass(Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={`Household debt: ${debt}% of income`}>
            <input type="range" min={0} max={250} step={10} value={debt}
              onChange={(e) => setDebt(Number(e.target.value))} className="w-full" />
          </Field>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-500">Lending rate moves</span>
            <span className="text-xl font-black text-ink dark:text-ink">
              {r.lendingRateChangePp > 0 ? '+' : ''}{r.lendingRateChangePp.toFixed(2)} pp
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-500">Estimated monthly payment</span>
            <span className="text-[15px] font-black text-ink dark:text-ink">
              {r.monthlyPaymentChangePct > 0 ? '+' : ''}{r.monthlyPaymentChangePct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {r.channels.map((c) => (
            <div key={c.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-ink dark:text-ink">{c.name}</span>
                <Badge tone={c.direction === 'up' ? 'high' : 'low'}>{c.direction}</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{c.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Policy lag</div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{r.lagNote}</p>
        </div>
      </Card>
    </>
  )
}

/* ── Simulasi kebijakan ────────────────────────────────────────────────────── */
function SimTab() {
  const [startInflation, setStartInflation] = useState(6)
  const [target, setTarget] = useState(2.5)
  const [startRate, setStartRate] = useState(6)
  const [gap, setGap] = useState(1)
  const [quarters, setQuarters] = useState(12)

  const data = useMemo(() => simulatePolicy({
    startInflationPct: startInflation, targetInflationPct: target,
    startPolicyRatePct: startRate, outputGapPct: gap,
    taylorInflationWeight: 0.5, taylorOutputWeight: 0.5,
    neutralRealRatePct: 1.5, quarters,
  }), [startInflation, target, startRate, gap, quarters])

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Quarterly policy simulation" subtitle="A simple Taylor rule — not a forecast" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Starting inflation (%)">
            <input className={inputClass} inputMode="decimal" value={startInflation}
              onChange={(e) => setStartInflation(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Inflation target (%)">
            <input className={inputClass} inputMode="decimal" value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Starting policy rate (%)">
            <input className={inputClass} inputMode="decimal" value={startRate}
              onChange={(e) => setStartRate(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Output gap (%)">
            <input className={inputClass} inputMode="decimal" value={gap}
              onChange={(e) => setGap(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="mt-2">
          <div className="text-[12px] font-bold text-ink dark:text-ink">Number of quarters</div>
          <div className="mt-1 flex gap-1.5">
            {[4, 8, 12, 20].map((q) => (
              <button key={q} onClick={() => setQuarters(q)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${quarters === q ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="inflationPct" name="Inflation" stroke="#ef4444" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="policyRatePct" name="Policy rate" stroke="#00BF63" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="outputGapPct" name="Output gap" stroke="#6366f1" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">The equations used</div>
          <pre className="mt-1 overflow-x-auto text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">
{`target rate = neutral real + inflation
              + 0.5 × (inflation − target)
              + 0.5 × output gap
policy rate = moves 50% toward target each quarter
output gap  −= 0.3 × (real rate − neutral real)
inflation   = 0.7×inflation + 0.3×target + 0.2×output gap`}
          </pre>
          <Prosa kelas="mt-2 text-[11px] leading-relaxed text-neutral-500">The equations are shown so you can judge the model rather than simply trust the chart. This model is heavily simplified and ignores a great deal that is real — food and energy price shocks, exchange rates, unanchored inflation expectations, and fiscal policy. Use it to understand direction and lag, not to predict next month's number.</Prosa>
        </div>
      </Card>
    </>
  )
}

/* ── Perdagangan ───────────────────────────────────────────────────────────── */
function TradeTab() {
  const [ex, setEx] = useState('264')
  const [im, setIm] = useState('237')
  const [gdp, setGdp] = useState('1400')
  const a = useMemo(() => analyseTrade({
    exportsUsdBn: Number(ex) || 0, importsUsdBn: Number(im) || 0, gdpUsdBn: Number(gdp) || 0,
  }), [ex, im, gdp])

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconToken size={18} />} title="Trade analysis" subtitle="Balance, openness, and how to read them" />
        <div className="mt-3 grid gap-2">
          <Field label="Exports (billion USD)"><input className={inputClass} inputMode="decimal" value={ex} onChange={(e) => setEx(e.target.value)} /></Field>
          <Field label="Imports (billion USD)"><input className={inputClass} inputMode="decimal" value={im} onChange={(e) => setIm(e.target.value)} /></Field>
          <Field label="GDP (billion USD)"><input className={inputClass} inputMode="decimal" value={gdp} onChange={(e) => setGdp(e.target.value)} /></Field>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-500">Trade balance</span>
            <span className={`text-xl font-black ${a.balanceUsdBn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {a.balanceUsdBn >= 0 ? '+' : ''}{a.balanceUsdBn.toFixed(1)} billion USD
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px]">
            <span className="text-neutral-500">As a share of GDP</span>
            <span className="font-bold text-ink dark:text-ink">{a.balancePctGdp.toFixed(2)}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px]">
            <span className="text-neutral-500">Trade openness</span>
            <span className="font-bold text-ink dark:text-ink">{a.tradeOpennessPct.toFixed(1)}% of GDP</span>
          </div>
        </div>
        <div className="mt-2"><Badge tone={a.balanceUsdBn >= 0 ? 'normal' : 'high'}>{a.verdict}</Badge></div>
        <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Do not jump to conclusions</div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{a.caution}</p>
        </div>
      </Card>
    </>
  )
}

export default MacroLab
