import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconShield } from '../components/icons'
import { useStore } from '../lib/store'
import {
  auditSeo, analyseAb, requiredSampleSize, segment, analyseSentiment,
  SEGMENT_LABEL, SEO_STATUS_LABEL, SENTIMENT_LABEL,
  type Customer,
} from '../lib/ownerAnalytics'

// Owner tools: SEO audit, A/B testing, RFM segmentation, sentiment triage.
// Owner-only — these expose aggregate business data.

type Tab = 'seo' | 'ab' | 'segmen' | 'sentimen'

export function OwnerAnalytics() {
  const { account } = useStore()
  const [tab, setTab] = useState<Tab>('seo')

  if (!account) return null
  if (account.role !== 'owner' && !account.isOwner) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Card className="!p-5">
          <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            This page is for the platform owner only.
          </p>
        </Card>
      </div>
    )
  }

  const TABS: { id: Tab; l: string }[] = [
    { id: 'seo', l: 'SEO' },
    { id: 'ab', l: 'A/B Test' },
    { id: 'segmen', l: 'Segmentation' },
    { id: 'sentimen', l: 'Sentiment' },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">📊</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Owner Analytics</h1>
          <p className="text-xs text-neutral-500">SEO, experiments, segmentation and sentiment</p>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'seo' && <SeoTab />}
      {tab === 'ab' && <AbTab />}
      {tab === 'segmen' && <SegmentTab />}
      {tab === 'sentimen' && <SentimentTab />}
    </div>
  )
}

/* ── SEO ───────────────────────────────────────────────────────────────────── */
function SeoTab() {
  const [i, setI] = useState({
    title: 'Panaceamed — The Practical AI Clinic for Your Access to Healthcare',
    metaDescription: '',
    h1Count: 1, wordCount: 450, imagesTotal: 8, imagesWithAlt: 5,
    hasCanonical: false, mobileFriendly: true, loadSeconds: 2.4,
    internalLinks: 6, httpsEnabled: true, hasStructuredData: false,
  })
  const r = useMemo(() => auditSeo(i), [i])
  const set = (p: Partial<typeof i>) => setI({ ...i, ...p })

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="SEO audit" subtitle="Enter the state of the page you want assessed" />
        <div className="mt-3 grid gap-2">
          <Field label="Title tag"><input className={inputClass} value={i.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Meta description"><input className={inputClass} value={i.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="H1 count"><input className={inputClass} inputMode="numeric" value={i.h1Count} onChange={(e) => set({ h1Count: Number(e.target.value) || 0 })} /></Field>
            <Field label="Word count"><input className={inputClass} inputMode="numeric" value={i.wordCount} onChange={(e) => set({ wordCount: Number(e.target.value) || 0 })} /></Field>
            <Field label="Total images"><input className={inputClass} inputMode="numeric" value={i.imagesTotal} onChange={(e) => set({ imagesTotal: Number(e.target.value) || 0 })} /></Field>
            <Field label="Images with alt"><input className={inputClass} inputMode="numeric" value={i.imagesWithAlt} onChange={(e) => set({ imagesWithAlt: Number(e.target.value) || 0 })} /></Field>
            <Field label="Load time (seconds)"><input className={inputClass} inputMode="decimal" value={i.loadSeconds} onChange={(e) => set({ loadSeconds: Number(e.target.value) || 0 })} /></Field>
            <Field label="Internal links"><input className={inputClass} inputMode="numeric" value={i.internalLinks} onChange={(e) => set({ internalLinks: Number(e.target.value) || 0 })} /></Field>
          </div>
          {([['mobileFriendly', 'Mobile friendly'], ['httpsEnabled', 'HTTPS enabled'], ['hasCanonical', 'Canonical present'], ['hasStructuredData', 'Structured data present']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
              <input type="checkbox" checked={i[k]} onChange={(e) => set({ [k]: e.target.checked } as never)} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">{l}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Audit score</span>
          <span className="text-2xl font-black text-ink dark:text-ink">{r.score}<span className="text-sm text-neutral-500">/100</span></span>
        </div>
        <Prosa kelas="mt-1 text-[10px] leading-relaxed text-neutral-500">This score measures only the technical items on this list. Real SEO is decided by content that genuinely answers what the reader needs — a score of 100 on a shallow page will not win in search results.</Prosa>
        <div className="mt-3 space-y-1.5">
          {r.findings.map((f) => (
            <div key={f.area} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-ink dark:text-ink">{f.area}</span>
                <Badge tone={f.status === 'baik' ? 'normal' : f.status === 'kritis' ? 'critical' : 'high'}>{SEO_STATUS_LABEL[f.status]}</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{f.detail}</p>
              {f.fix && <p className="mt-1 text-[11px] leading-relaxed text-brand-dark">{f.fix}</p>}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ── A/B ───────────────────────────────────────────────────────────────────── */
function AbTab() {
  const [cv, setCv] = useState('4000')
  const [cc, setCc] = useState('200')
  const [vv, setVv] = useState('4000')
  const [vc, setVc] = useState('232')
  const [planned, setPlanned] = useState('4000')
  const [baseline, setBaseline] = useState('5')
  const [mde, setMde] = useState('1')

  const r = useMemo(() => analyseAb({
    controlVisitors: Number(cv) || 0, controlConversions: Number(cc) || 0,
    variantVisitors: Number(vv) || 0, variantConversions: Number(vc) || 0,
    plannedPerArm: Number(planned) || 0,
  }), [cv, cc, vv, vc, planned])

  const need = useMemo(() => requiredSampleSize(Number(baseline) || 0, Number(mde) || 0), [baseline, mde])

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Work out the sample size first" subtitle="Decided BEFORE the test starts, not after" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Current conversion (%)"><input className={inputClass} inputMode="decimal" value={baseline} onChange={(e) => setBaseline(e.target.value)} /></Field>
          <Field label="Smallest meaningful difference (pp)"><input className={inputClass} inputMode="decimal" value={mde} onChange={(e) => setMde(e.target.value)} /></Field>
        </div>
        <div className="mt-2 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-500">Needed per group</span>
            <span className="text-xl font-black text-ink dark:text-ink">{need.toLocaleString('en-GB')}</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
            At 80% power and a 5% significance level. Fix this number first, then run until it is
            reached.
          </p>
        </div>
      </Card>

      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Test result" subtitle="Two-proportion z-test" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Control — visitors"><input className={inputClass} inputMode="numeric" value={cv} onChange={(e) => setCv(e.target.value)} /></Field>
          <Field label="Control — conversions"><input className={inputClass} inputMode="numeric" value={cc} onChange={(e) => setCc(e.target.value)} /></Field>
          <Field label="Variant — visitors"><input className={inputClass} inputMode="numeric" value={vv} onChange={(e) => setVv(e.target.value)} /></Field>
          <Field label="Variant — conversions"><input className={inputClass} inputMode="numeric" value={vc} onChange={(e) => setVc(e.target.value)} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Planned sample per group"><input className={inputClass} inputMode="numeric" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
            <span className="text-neutral-500">Control</span><span className="text-right font-bold text-ink dark:text-ink">{r.controlRate.toFixed(2)}%</span>
            <span className="text-neutral-500">Variant</span><span className="text-right font-bold text-ink dark:text-ink">{r.variantRate.toFixed(2)}%</span>
            <span className="text-neutral-500">Difference</span><span className="text-right font-bold text-ink dark:text-ink">{r.absoluteLiftPp >= 0 ? '+' : ''}{r.absoluteLiftPp.toFixed(2)} pp</span>
            <span className="text-neutral-500">p-value</span><span className="text-right font-bold text-ink dark:text-ink">{r.pValue < 0.0001 ? '<0,0001' : r.pValue.toFixed(4)}</span>
            <span className="text-neutral-500">95% confidence interval</span><span className="text-right font-bold text-ink dark:text-ink">{r.ciLowPp.toFixed(2)} … {r.ciHighPp.toFixed(2)} pp</span>
          </div>
          <div className="mt-2"><Badge tone={r.significant ? 'normal' : r.readyToCall ? 'neutral' : 'high'}>{r.verdict}</Badge></div>
        </div>

        {r.warning && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Methodology warning</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{r.warning}</p>
          </div>
        )}

        <Prosa kelas="mt-3 text-[10px] leading-relaxed text-neutral-500">A confidence interval is more useful than a p-value: it tells you how large the difference is, not merely whether there is one. An interval crossing zero means even the direction is unsettled.</Prosa>
      </Card>
    </>
  )
}

/* ── Segmentasi ────────────────────────────────────────────────────────────── */
const SEG_KEY = 'pmd_owner_customers_v1'

function SegmentTab() {
  const [rows, setRows] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem(SEG_KEY) || '[]') } catch { return [] }
  })
  const [name, setName] = useState('')
  const [days, setDays] = useState('')
  const [uses, setUses] = useState('')
  const [spend, setSpend] = useState('')

  const segs = useMemo(() => segment(rows), [rows])

  function add() {
    if (!name.trim()) return
    const next = [...rows, {
      id: Math.random().toString(36).slice(2), name: name.trim(),
      daysSinceLastUse: Number(days) || 0, usesLast90Days: Number(uses) || 0, totalSpend: Number(spend) || 0,
    }]
    setRows(next)
    try { localStorage.setItem(SEG_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setName(''); setDays(''); setUses(''); setSpend('')
  }

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="RFM segmentation" subtitle="Recency, Frequency, Monetary" />
        <div className="mt-3 grid gap-2">
          <Field label="User name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Days since last use"><input className={inputClass} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
            <Field label="Uses in 90 days"><input className={inputClass} inputMode="numeric" value={uses} onChange={(e) => setUses(e.target.value)} /></Field>
            <Field label="Total spend"><input className={inputClass} inputMode="numeric" value={spend} onChange={(e) => setSpend(e.target.value)} /></Field>
          </div>
          <Button onClick={add}>Add</Button>
        </div>
      </Card>

      {segs.length > 0 && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Segmentation result</div>
          <div className="mt-2 space-y-2">
            {segs.map((s) => (
              <div key={s.customer.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-ink dark:text-ink">{s.customer.name}</span>
                  <Badge tone={s.segment === 'Juara' ? 'normal' : s.segment === 'Hilang' ? 'critical' : s.segment === 'Berisiko pergi' ? 'high' : 'low'}>{SEGMENT_LABEL[s.segment]}</Badge>
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-500">
                  {s.customer.daysSinceLastUse} days ago · {s.customer.usesLast90Days}× in 90 days
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{s.action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

/* ── Sentimen ──────────────────────────────────────────────────────────────── */
function SentimentTab() {
  const [text, setText] = useState('The app is really helpful and easy to use, but it is sometimes slow and login is confusing.')
  const r = useMemo(() => analyseSentiment(text), [text])

  return (
    <Card className="!p-4">
      <SectionTitle icon={<IconShield size={18} />} title="Sentiment analysis" subtitle="A triage aid, not a substitute for reading" />
      <textarea
        className={inputClass + ' mt-3 min-h-24'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a review or user comment…"
      />
      <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Verdict</span>
          <Badge tone={r.label === 'positif' ? 'normal' : r.label === 'negatif' ? 'critical' : 'neutral'}>{SENTIMENT_LABEL[r.label]}</Badge>
        </div>
        {r.matchedPositive.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-700">Positive: {r.matchedPositive.join(', ')}</p>
        )}
        {r.matchedNegative.length > 0 && (
          <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-600">Negative: {r.matchedNegative.join(', ')}</p>
        )}
      </div>
      <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
        <p className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{r.caveat}</p>
      </div>
    </Card>
  )
}

export default OwnerAnalytics
