import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconShield } from '../components/icons'
import { getDemo } from '../lib/profile'
import { framinghamCVD, cvdBand } from '../lib/riskModels'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Risk Calculators — validated, published scores implemented with
// their real coefficients (not black boxes):
//   • 10-year cardiovascular risk — Framingham General CVD (D'Agostino 2008)
//   • FIB-4 — liver fibrosis index (Sterling 2006)
//   • OST — Osteoporosis Self-assessment Tool index
// Demographics prefill from the shared profile; labs entered manually. These
// are decision-support estimates for discussion with a clinician, not a
// diagnosis, and each score has its own validated population & caveats.
// ─────────────────────────────────────────────────────────────────────────────

const demo = () => getDemo()

// Framingham CVD + band now live in ../lib/riskModels (shared with the What-If
// Health Simulator so both compute identical numbers).

// ── FIB-4 (Sterling 2006) = (age × AST) / (platelets × √ALT) ──────────────────
function fib4(age: number, ast: number, plt: number, alt: number): number | null {
  if (!(age > 0 && ast > 0 && plt > 0 && alt > 0)) return null
  return +((age * ast) / (plt * Math.sqrt(alt))).toFixed(2)
}
function fib4Band(v: number, age: number): { label: string; tone: 'brand' | 'low' | 'critical'; note: string } {
  const hi = age >= 65 ? 2.0 : 1.3
  if (v < hi) return { label: 'Low', tone: 'brand', note: 'Advanced fibrosis unlikely — high negative predictive value.' }
  if (v <= 2.67) return { label: 'Indeterminate', tone: 'low', note: 'Consider further assessment (e.g. elastography / specialist).' }
  return { label: 'High', tone: 'critical', note: 'Advanced fibrosis more likely — warrants specialist evaluation.' }
}

// ── OST index = 0.2 × (weight_kg − age), truncated ───────────────────────────
function ostIndex(weight: number, age: number): number | null {
  if (!(weight > 0 && age > 0)) return null
  return Math.trunc(0.2 * (weight - age))
}
function ostBand(v: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (v > -1) return { label: 'Lower risk', tone: 'brand' }
  if (v >= -4) return { label: 'Moderate risk', tone: 'low' }
  return { label: 'Higher risk', tone: 'critical' }
}

export function RiskCalculators() {
  const d0 = demo()
  const [age, setAge] = useState<number>(d0.age || 0)
  const [sex, setSex] = useState<'M' | 'F'>(d0.sex || 'M')
  const [weight, setWeight] = useState<number>(d0.weightKg || 0)
  // CVD
  const [totChol, setTotChol] = useState<number>(0)
  const [hdl, setHdl] = useState<number>(0)
  const [sbp, setSbp] = useState<number>(0)
  const [treatedBP, setTreatedBP] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [diabetic, setDiabetic] = useState(false)
  // FIB-4
  const [ast, setAst] = useState<number>(0)
  const [alt, setAlt] = useState<number>(0)
  const [plt, setPlt] = useState<number>(0)

  const cvd = useMemo(() => framinghamCVD({ age, sex, totChol, hdl, sbp, treatedBP, smoker, diabetic }), [age, sex, totChol, hdl, sbp, treatedBP, smoker, diabetic])
  const fib = useMemo(() => fib4(age, ast, plt, alt), [age, ast, plt, alt])
  const ost = useMemo(() => ostIndex(weight, age), [weight, age])

  const numField = (label: string, val: number, set: (n: number) => void, step = 1) => (
    <Field label={label}><input className={inputClass} type="number" step={step} value={val || ''} onChange={(e) => set(+e.target.value)} /></Field>
  )
  const toggle = (label: string, val: boolean, set: (b: boolean) => void) => (
    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
      <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Clinical Risk Calculators" subtitle="Validated scores with their real published formulas — for discussion with your doctor" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('Age', age, setAge)}
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {numField('Weight (kg)', weight, setWeight, 0.1)}
        </div>
      </Card>

      {/* Cardiovascular */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="10-Year Cardiovascular Risk" subtitle="Framingham General CVD (D'Agostino 2008)" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('Total chol (mg/dL)', totChol, setTotChol)}
          {numField('HDL (mg/dL)', hdl, setHdl)}
          {numField('Systolic BP', sbp, setSbp)}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {toggle('On BP treatment', treatedBP, setTreatedBP)}
          {toggle('Smoker', smoker, setSmoker)}
          {toggle('Diabetic', diabetic, setDiabetic)}
        </div>
        {cvd != null ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: cvd < 7.5 ? '#00BF63' : cvd < 20 ? '#f59e0b' : '#ef4444' }}>{cvd}%</div>
            <div>
              <Badge tone={cvdBand(cvd).tone}>{cvdBand(cvd).label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">Estimated risk of a cardiovascular event in the next 10 years. &lt;7.5% low · 7.5–20% intermediate · ≥20% high.</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-400">Enter total cholesterol, HDL, and systolic BP to calculate.</p>}
      </Card>

      {/* FIB-4 */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="FIB-4 Liver Fibrosis Index" subtitle="Sterling 2006 — screens for advanced liver fibrosis" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('AST (U/L)', ast, setAst)}
          {numField('ALT (U/L)', alt, setAlt)}
          {numField('Platelets (×10⁹/L)', plt, setPlt)}
        </div>
        {fib != null ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: fib4Band(fib, age).tone === 'brand' ? '#00BF63' : fib4Band(fib, age).tone === 'low' ? '#f59e0b' : '#ef4444' }}>{fib}</div>
            <div>
              <Badge tone={fib4Band(fib, age).tone}>{fib4Band(fib, age).label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{fib4Band(fib, age).note}</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-400">Enter AST, ALT, and platelet count to calculate.</p>}
      </Card>

      {/* OST */}
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Osteoporosis Risk (OST)" subtitle="Osteoporosis Self-assessment Tool index — from age & weight" />
        {ost != null ? (
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: ostBand(ost).tone === 'brand' ? '#00BF63' : ostBand(ost).tone === 'low' ? '#f59e0b' : '#ef4444' }}>{ost}</div>
            <div>
              <Badge tone={ostBand(ost).tone}>{ostBand(ost).label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">A simple screen (originally validated in postmenopausal women) — higher risk suggests discussing a bone-density (DEXA) scan.</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-400">Enter age and weight above to calculate.</p>}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Decision-support estimates using each score's published formula. Every tool has its own validated population, units, and caveats (e.g. Framingham is a US-cohort general estimate; region-specific tools may differ). Not a diagnosis — review results with the clinician who knows your full history.
      </div>
    </div>
  )
}

export default RiskCalculators
