import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HopeDomainKey } from '../../lib/hopeStack'

function NumberField({ label, value, onChange, min, max, step = 1, suffix }: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <label className="block rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <span className="text-[9px] font-black uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-lg font-black text-ink outline-none dark:text-white"
        />
        {suffix && <span className="text-xs font-bold text-neutral-400">{suffix}</span>}
      </div>
    </label>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-neutral-950 p-3 text-white">
      <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-black text-brand">{value}</div>
      {note && <p className="mt-1 text-[9px] leading-relaxed text-neutral-400">{note}</p>}
    </div>
  )
}

function MentalWorkbench() {
  return (
    <div className="rounded-3xl border border-brand/20 bg-brand/[0.04] p-4">
      <div className="text-[10px] font-black uppercase tracking-[.16em] text-brand">Life-safety action</div>
      <h4 className="mt-1 text-base font-black text-ink dark:text-white">A plan prepared before a crisis is easier to use during one.</h4>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        The Jiwa hub contains a local-first seven-step safety plan. It is stored on this device, is not monitored,
        does not calculate suicide risk, and keeps emergency disposition with humans and local services.
      </p>
      <Link to="/jiwa?t=aman" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-xs font-black text-white">
        Open Jiwa → Safety plan
      </Link>
    </div>
  )
}

function EarlyDetectionWorkbench() {
  const [prevalence, setPrevalence] = useState(1)
  const [sensitivity, setSensitivity] = useState(80)
  const [specificity, setSpecificity] = useState(95)
  const cohort = 10_000
  const result = useMemo(() => {
    const p = Math.min(1, Math.max(0, prevalence / 100))
    const se = Math.min(1, Math.max(0, sensitivity / 100))
    const sp = Math.min(1, Math.max(0, specificity / 100))
    const tp = cohort * p * se
    const fn = cohort * p * (1 - se)
    const fp = cohort * (1 - p) * (1 - sp)
    const tn = cohort * (1 - p) * sp
    return {
      ppv: tp + fp > 0 ? tp / (tp + fp) : 0,
      npv: tn + fn > 0 ? tn / (tn + fn) : 0,
      fp,
      fn,
    }
  }, [prevalence, sensitivity, specificity])

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <NumberField label="Disease prevalence" value={prevalence} onChange={setPrevalence} min={0.01} max={100} step={0.1} suffix="%" />
        <NumberField label="Sensitivity" value={sensitivity} onChange={setSensitivity} min={0} max={100} step={0.1} suffix="%" />
        <NumberField label="Specificity" value={specificity} onChange={setSpecificity} min={0} max={100} step={0.1} suffix="%" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="PPV" value={`${(result.ppv * 100).toFixed(1)}%`} />
        <Metric label="NPV" value={`${(result.npv * 100).toFixed(1)}%`} />
        <Metric label="False positives / 10k" value={result.fp.toFixed(0)} />
        <Metric label="Missed cases / 10k" value={result.fn.toFixed(0)} />
      </div>
      <div className="rounded-2xl border border-neutral-200 p-3 font-mono text-[10px] text-neutral-500 dark:border-white/10">
        PPV = Se×Prev / [Se×Prev + (1−Sp)×(1−Prev)]
      </div>
      <p className="text-[10px] leading-relaxed text-neutral-400">
        Teaching calculator only. Real screening requires a validated assay, intended-use population, confirmatory pathway, clinical utility and harm/benefit assessment.
      </p>
    </div>
  )
}

function PredictionWorkbench() {
  const [probabilities, setProbabilities] = useState('0.10, 0.35, 0.70, 0.80, 0.95')
  const [outcomes, setOutcomes] = useState('0, 0, 1, 1, 1')
  const result = useMemo(() => {
    const p = probabilities.split(',').map((value) => Number(value.trim())).filter(Number.isFinite)
    const y = outcomes.split(',').map((value) => Number(value.trim())).filter((value) => value === 0 || value === 1)
    if (p.length === 0 || p.length !== y.length || p.some((value) => value < 0 || value > 1)) return null
    return p.reduce((sum, value, index) => sum + (value - y[index]) ** 2, 0) / p.length
  }, [probabilities, outcomes])

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <span className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Predicted probabilities (0–1)</span>
          <input value={probabilities} onChange={(event) => setProbabilities(event.target.value)} className="mt-1 w-full bg-transparent font-mono text-xs text-ink outline-none dark:text-white" />
        </label>
        <label className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <span className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Observed outcomes (0 or 1)</span>
          <input value={outcomes} onChange={(event) => setOutcomes(event.target.value)} className="mt-1 w-full bg-transparent font-mono text-xs text-ink outline-none dark:text-white" />
        </label>
      </div>
      {result === null
        ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">Use equal-length valid probability and outcome lists.</div>
        : <Metric label="Brier score" value={result.toFixed(4)} note="Lower is better only for the same outcome, horizon and evaluation population." />}
      <div className="rounded-2xl border border-neutral-200 p-3 font-mono text-[10px] text-neutral-500 dark:border-white/10">BS = (1/N) Σ(pᵢ − yᵢ)²</div>
      <p className="text-[10px] leading-relaxed text-neutral-400">Calibration, discrimination, fairness, drift and clinical decision impact remain separate requirements.</p>
    </div>
  )
}

function FinanceWorkbench() {
  const [retirementAge, setRetirementAge] = useState(65)
  const [financedThrough, setFinancedThrough] = useState(85)
  const [scenarioLifespan, setScenarioLifespan] = useState(95)
  const [annualNeed, setAnnualNeed] = useState(1)
  const [discountRate, setDiscountRate] = useState(3)
  const result = useMemo(() => {
    const retirementYears = Math.max(0, scenarioLifespan - retirementAge)
    const gapYears = Math.max(0, scenarioLifespan - financedThrough)
    const r = Math.max(0, discountRate) / 100
    const pv = gapYears <= 0 ? 0 : r === 0 ? annualNeed * gapYears : annualNeed * (1 - (1 + r) ** -gapYears) / r
    return { retirementYears, gapYears, pv }
  }, [retirementAge, financedThrough, scenarioLifespan, annualNeed, discountRate])

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <NumberField label="Retirement age" value={retirementAge} onChange={setRetirementAge} min={18} max={100} suffix="yr" />
        <NumberField label="Financed through" value={financedThrough} onChange={setFinancedThrough} min={18} max={125} suffix="yr" />
        <NumberField label="Scenario lifespan" value={scenarioLifespan} onChange={setScenarioLifespan} min={18} max={125} suffix="yr" />
        <NumberField label="Annual need" value={annualNeed} onChange={setAnnualNeed} min={0} step={0.1} suffix="units" />
        <NumberField label="Discount rate" value={discountRate} onChange={setDiscountRate} min={0} max={30} step={0.1} suffix="%" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Metric label="Retirement duration" value={`${result.retirementYears} yr`} />
        <Metric label="Longevity financing gap" value={`${result.gapYears} yr`} />
        <Metric label="PV uncovered needs" value={`${result.pv.toFixed(2)} units`} />
      </div>
      <div className="rounded-2xl border border-neutral-200 p-3 font-mono text-[10px] text-neutral-500 dark:border-white/10">gap = scenario lifespan − financed-through age · PV = Σ Cₜ/(1+r)ᵗ</div>
      <p className="text-[10px] leading-relaxed text-neutral-400">Scenario planning only. Lifespan here is an assumption, never an individual prediction.</p>
    </div>
  )
}

function InfrastructureWorkbench() {
  const [older, setOlder] = useState(33)
  const [working, setWorking] = useState(100)
  const ratio = working > 0 ? (older / working) * 100 : 0
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <NumberField label="Population age 65+" value={older} onChange={setOlder} min={0} />
        <NumberField label="Population age 20–64" value={working} onChange={setWorking} min={0.1} />
      </div>
      <Metric label="Old-age dependency ratio" value={`${ratio.toFixed(1)} per 100`} />
      <div className="rounded-2xl border border-neutral-200 p-3 font-mono text-[10px] text-neutral-500 dark:border-white/10">OADR = population 65+ / population 20–64 × 100</div>
      <p className="text-[10px] leading-relaxed text-neutral-400">OADR is a demographic ratio; it does not directly measure disability, productivity or care demand.</p>
    </div>
  )
}

const GEROSCIENCE_PIPELINE = [
  ['Target biology', 'Mechanism + target engagement', 'Research hypothesis'],
  ['Preclinical', 'Cell/animal efficacy + toxicity', 'Not human efficacy'],
  ['Phase 1', 'Human safety / PK / tolerability', 'Not proof of lifespan extension'],
  ['Phase 2', 'Defined clinical endpoints', 'Signal seeking'],
  ['Phase 3', 'Confirmatory benefit/risk', 'Indication specific'],
  ['Regulatory / post-market', 'Label + surveillance', 'Approved use only'],
]

function GeroscienceWorkbench() {
  return (
    <div className="space-y-2">
      {GEROSCIENCE_PIPELINE.map(([stage, question, boundary], index) => (
        <div key={stage} className="grid gap-2 rounded-2xl border border-neutral-200 p-3 dark:border-white/10 sm:grid-cols-[38px_.7fr_1.2fr_1fr] sm:items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-black text-white">{index + 1}</div>
          <div className="text-xs font-black text-ink dark:text-white">{stage}</div>
          <div className="text-[11px] text-neutral-500">{question}</div>
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{boundary}</div>
        </div>
      ))}
      <p className="text-[10px] leading-relaxed text-neutral-400">Research and education only: organize target, biomarker, trial and regulatory evidence; do not output synthesis recipes, dosing or self-experimentation protocols.</p>
    </div>
  )
}

function RegenerativeWorkbench() {
  const rows = [
    ['Organoids', 'Research / disease models', 'Useful for modeling and screening; not a replacement organ'],
    ['Organ-on-chip', 'Research / translational', 'Models tissue function and exposure under controlled conditions'],
    ['Cell therapies', 'Indication-specific', 'Clinical maturity varies by product and disease'],
    ['Tissue engineering', 'Preclinical → clinical depending on tissue', 'Expose scaffold, vascularization, function and immune-compatibility evidence'],
    ['Lab-grown whole organs', 'Research frontier', 'Do not present as generally available transplantation alternatives'],
  ]
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-white/10">
      <table className="w-full min-w-[620px] text-left text-[11px]">
        <thead className="bg-neutral-50 text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:bg-white/5"><tr><th className="p-3">Platform</th><th className="p-3">Maturity</th><th className="p-3">Truth boundary</th></tr></thead>
        <tbody>{rows.map(([platform, maturity, boundary]) => <tr key={platform} className="border-t border-neutral-100 dark:border-white/5"><td className="p-3 font-black text-ink dark:text-white">{platform}</td><td className="p-3 text-brand">{maturity}</td><td className="p-3 text-neutral-500">{boundary}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function PreventiveWorkbench() {
  const items = [
    ['Function', 'Mobility, cognition, sensory function, independence and participation'],
    ['Prevention', 'Vaccination and evidence-based screening gaps'],
    ['Risk factors', 'Blood pressure, lipids, glycemia, smoking, activity and sleep context'],
    ['Medication safety', 'Indication, adherence, interactions, burden and deprescribing review where appropriate'],
    ['Mental health', 'Distress, substance use, connection, meaning and access to care'],
    ['Endocrine care', 'Evaluate symptoms and documented deficiency/disease; avoid blanket hormone “optimization”'],
  ]
  return <div className="grid gap-2 sm:grid-cols-2">{items.map(([label, text]) => <div key={label} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-xs font-black text-ink dark:text-white">{label}</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{text}</p></div>)}</div>
}

function AgingTechnologyWorkbench() {
  const rows = [
    ['Medication reminders', 'Support adherence', 'Missed reminder ≠ missed dose proof', 'User / caregiver'],
    ['Home sensors', 'Context and trends', 'Sensor failure / false alert', 'User consent'],
    ['Telecare', 'Human access at distance', 'Connectivity / availability', 'Clinician / service'],
    ['Rehab robotics', 'Task-specific assistance', 'Heterogeneous evidence, device-specific safety', 'Rehab professional'],
    ['Cognitive support', 'Prompts / routines / engagement', 'Must not diagnose dementia from interaction alone', 'User / clinician'],
  ]
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-white/10">
      <table className="w-full min-w-[720px] text-left text-[10px]">
        <thead className="bg-neutral-50 text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:bg-white/5"><tr><th className="p-3">Technology</th><th className="p-3">Role</th><th className="p-3">Failure boundary</th><th className="p-3">Human control</th></tr></thead>
        <tbody>{rows.map(([tech, role, failure, gate]) => <tr key={tech} className="border-t border-neutral-100 dark:border-white/5"><td className="p-3 font-black text-ink dark:text-white">{tech}</td><td className="p-3 text-neutral-500">{role}</td><td className="p-3 text-neutral-500">{failure}</td><td className="p-3 font-bold text-brand">{gate}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export function HopeWorkbench({ domain }: { domain: HopeDomainKey }) {
  const content = (() => {
    switch (domain) {
      case 'mental-health': return <MentalWorkbench />
      case 'early-detection': return <EarlyDetectionWorkbench />
      case 'predictive-ai': return <PredictionWorkbench />
      case 'longevity-finance': return <FinanceWorkbench />
      case 'longevity-infrastructure': return <InfrastructureWorkbench />
      case 'geroscience-pharma': return <GeroscienceWorkbench />
      case 'regenerative-medicine': return <RegenerativeWorkbench />
      case 'longevity-care': return <PreventiveWorkbench />
      case 'aging-technology': return <AgingTechnologyWorkbench />
    }
  })()

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="mb-3 text-[10px] font-black uppercase tracking-[.16em] text-brand">Interactive workbench</div>
      {content}
    </div>
  )
}

export default HopeWorkbench
