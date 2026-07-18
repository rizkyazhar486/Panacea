import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemo } from '../lib/profile'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// FINDRISC — Finnish Diabetes Risk Score. Lindström, J. & Tuomilehto, J.
// (2003), Diabetes Care, 26(3):725-731. Predicts 10-year risk of developing
// type 2 diabetes from 8 questions and NO blood tests — one of the most
// widely used, validated diabetes-prevention screening tools worldwide.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function agePts(a: number): number { return a < 45 ? 0 : a <= 54 ? 2 : a <= 64 ? 3 : 4 }
function bmiPts(bmi: number): number { return bmi < 25 ? 0 : bmi <= 30 ? 1 : 3 }
function waistPts(cm: number, sex: 'M' | 'F'): number {
  if (sex === 'M') return cm < 94 ? 0 : cm <= 102 ? 3 : 4
  return cm < 80 ? 0 : cm <= 88 ? 3 : 4
}

function band(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; risk: string } {
  if (score < 7) return { label: 'Low', tone: 'brand', risk: '~1% develop diabetes within 10 years' }
  if (score <= 11) return { label: 'Slightly elevated', tone: 'brand', risk: '~4% develop diabetes within 10 years' }
  if (score <= 14) return { label: 'Moderate', tone: 'low', risk: '~17% develop diabetes within 10 years' }
  if (score <= 20) return { label: 'High', tone: 'critical', risk: '~33% develop diabetes within 10 years' }
  return { label: 'Very high', tone: 'critical', risk: '~50% develop diabetes within 10 years' }
}

export function Findrisc() {
  const demo = getDemo()
  const [age, setAge] = useState(demo.age || 45)
  const [bmi, setBmi] = useState(() => {
    const w = demo.weightKg, h = demo.heightCm
    return w && h ? +(w / ((h / 100) ** 2)).toFixed(1) : 24
  })
  const [waist, setWaist] = useState(90)
  const [sex, setSex] = useState<'M' | 'F'>(demo.sex || 'M')
  const [active, setActive] = useState(true)
  const [veg, setVeg] = useState(true)
  const [bpMed, setBpMed] = useState(false)
  const [highGlucose, setHighGlucose] = useState(false)
  const [family, setFamily] = useState<0 | 3 | 5>(0)

  const score =
    agePts(age) + bmiPts(bmi) + waistPts(waist, sex) +
    (active ? 0 : 2) + (veg ? 0 : 1) + (bpMed ? 2 : 0) + (highGlucose ? 5 : 0) + family
  const result = band(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Diabetes Risk (FINDRISC)" subtitle="10-year type-2 diabetes risk — no blood test needed (Lindström & Tuomilehto 2003)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Eight quick questions estimate your risk of developing type 2 diabetes over the next 10
          years. It needs no lab work, which makes it a powerful early-prevention screen — most of the
          risk it flags is modifiable.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="BMI (kg/m²)">
            <input className={inputClass} type="number" step="0.1" value={bmi || ''} onChange={(e) => setBmi(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Waist circumference (cm)">
            <input className={inputClass} type="number" value={waist || ''} onChange={(e) => setWaist(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={active} onChange={(e) => setActive(e.target.checked)} /> I get ≥30 min of physical activity most days
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={veg} onChange={(e) => setVeg(e.target.checked)} /> I eat vegetables/fruit every day
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={bpMed} onChange={(e) => setBpMed(e.target.checked)} /> I take blood-pressure medication
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={highGlucose} onChange={(e) => setHighGlucose(e.target.checked)} /> I've had high blood glucose before (e.g. in pregnancy or a check-up)
          </label>
          <Field label="Family history of diabetes">
            <select className={inputClass} value={family} onChange={(e) => setFamily(Number(e.target.value) as 0 | 3 | 5)}>
              <option value={0}>None</option>
              <option value={3}>Grandparent, aunt/uncle, or cousin</option>
              <option value={5}>Parent, sibling, or own child</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">FINDRISC Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score} / 26</span>
          <Badge tone={result.tone}>{result.label} risk</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">{result.risk}.</p>
        {score >= 12 && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            A score ≥12 is worth acting on — ask your clinician about a fasting glucose or HbA1c, and
            the biggest levers are weight loss, daily movement, and cutting refined carbs (the Finnish
            &amp; DPP trials cut progression to diabetes by ~58% with lifestyle change).
          </p>
        )}
        <CopyNote text={`FINDRISC ${score}/26 — ${result.label.toLowerCase()} 10-year type-2 diabetes risk (${result.risk}) [Lindström & Tuomilehto 2003]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Lindström, J. &amp; Tuomilehto, J. (2003). The Diabetes Risk Score. <i>Diabetes Care</i>, 26(3),
        725-731. Decision-support screen — a raised score is a prompt for prevention and testing, not
        a diagnosis.
      </div>
    </div>
  )
}

export default Findrisc
