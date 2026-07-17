import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity, IconChartUp } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Lab Result Decoder ("Jargon Buster" / "Blood Test Decoder") — paste common
// lab values and get a plain-language reading against standard adult reference
// ranges, with low/normal/high flags. Pure client-side lookup — no data leaves
// the device. Educational only; reference ranges vary by lab and context, and a
// clinician interprets results in the light of the whole person.
// ─────────────────────────────────────────────────────────────────────────────

type Sex = 'M' | 'F'
interface LabDef {
  id: string; name: string; unit: string; group: string
  low: number; high: number         // normal range (sex-adjusted below where needed)
  range?: (sex: Sex) => [number, number]
  higherIsBad?: boolean; lowerIsBad?: boolean
  plain: (flag: Flag) => string
}
type Flag = 'low' | 'normal' | 'high'

const LABS: LabDef[] = [
  { id: 'glucose', name: 'Fasting glucose', unit: 'mg/dL', group: 'Metabolic', low: 70, high: 99, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Above the normal fasting range — 100–125 suggests prediabetes, ≥126 (repeated) suggests diabetes.' : f === 'low' ? 'Below normal — can cause shakiness/dizziness; discuss if recurrent.' : 'Normal fasting blood sugar.' },
  { id: 'hba1c', name: 'HbA1c', unit: '%', group: 'Metabolic', low: 4, high: 5.6, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Reflects average sugar over ~3 months. 5.7–6.4% = prediabetes, ≥6.5% = diabetes range.' : 'Normal average blood-sugar control.' },
  { id: 'tchol', name: 'Total cholesterol', unit: 'mg/dL', group: 'Lipids', low: 0, high: 199, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Above desirable (<200). Look at LDL & HDL breakdown and overall cardiovascular risk.' : 'Desirable total cholesterol.' },
  { id: 'ldl', name: 'LDL ("bad") cholesterol', unit: 'mg/dL', group: 'Lipids', low: 0, high: 99, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Above optimal (<100). Higher LDL raises cardiovascular risk; targets are lower if you already have risk factors.' : 'Optimal LDL.' },
  { id: 'hdl', name: 'HDL ("good") cholesterol', unit: 'mg/dL', group: 'Lipids', low: 40, high: 200, lowerIsBad: true, range: (s) => (s === 'M' ? [40, 200] : [50, 200]),
    plain: (f) => f === 'low' ? 'Lower than protective. Higher HDL is generally better — exercise and healthy fats help.' : 'Healthy protective HDL.' },
  { id: 'trig', name: 'Triglycerides', unit: 'mg/dL', group: 'Lipids', low: 0, high: 149, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Above normal (<150). Often responds to reduced sugar/alcohol, weight loss, and omega-3s.' : 'Normal triglycerides.' },
  { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', group: 'Kidney', low: 0.6, high: 1.3, higherIsBad: true, range: (s) => (s === 'M' ? [0.7, 1.3] : [0.6, 1.1]),
    plain: (f) => f === 'high' ? 'May indicate reduced kidney filtration (or high muscle mass/dehydration). eGFR gives the fuller picture.' : f === 'low' ? 'Low — often just low muscle mass; rarely a concern by itself.' : 'Normal kidney marker.' },
  { id: 'egfr', name: 'eGFR', unit: 'mL/min', group: 'Kidney', low: 90, high: 200, lowerIsBad: true,
    plain: (f) => f === 'low' ? 'Below 90 can indicate reduced kidney function; <60 for 3+ months defines chronic kidney disease. Confirm with a clinician.' : 'Normal kidney filtration.' },
  { id: 'alt', name: 'ALT', unit: 'U/L', group: 'Liver', low: 0, high: 40, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Raised liver enzyme — can reflect fatty liver, alcohol, medications, or viral hepatitis. Repeat & investigate if persistent.' : 'Normal liver enzyme.' },
  { id: 'ast', name: 'AST', unit: 'U/L', group: 'Liver', low: 0, high: 40, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Raised — like ALT, reflects liver (or sometimes muscle) stress. Interpreted alongside ALT.' : 'Normal.' },
  { id: 'hb', name: 'Hemoglobin', unit: 'g/dL', group: 'Blood', low: 12, high: 17.5, range: (s) => (s === 'M' ? [13.5, 17.5] : [12, 15.5]),
    plain: (f) => f === 'low' ? 'Below normal — suggests anemia (iron, B12/folate, blood loss, or chronic disease). Worth investigating the cause.' : f === 'high' ? 'Above normal — can reflect dehydration, smoking, or altitude; sometimes a blood condition.' : 'Normal hemoglobin.' },
  { id: 'wbc', name: 'White blood cells', unit: '×10³/µL', group: 'Blood', low: 4, high: 11, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Raised — commonly infection or inflammation; sometimes stress or steroids.' : f === 'low' ? 'Low — can follow viral illness or affect immunity; discuss if persistent.' : 'Normal white-cell count.' },
  { id: 'tsh', name: 'TSH (thyroid)', unit: 'mIU/L', group: 'Hormone', low: 0.4, high: 4.0,
    plain: (f) => f === 'high' ? 'High TSH usually means an underactive thyroid (hypothyroid) — fatigue, weight gain, cold intolerance.' : f === 'low' ? 'Low TSH can mean an overactive thyroid (hyperthyroid) — palpitations, weight loss, anxiety.' : 'Normal thyroid signal.' },
  { id: 'crp', name: 'hs-CRP (inflammation)', unit: 'mg/L', group: 'Inflammation', low: 0, high: 1, higherIsBad: true,
    plain: (f) => f === 'high' ? 'Higher inflammation. 1–3 = moderate, >3 = higher cardiovascular risk (rule out acute infection first).' : 'Low inflammation — good.' },
  { id: 'vitd', name: 'Vitamin D (25-OH)', unit: 'ng/mL', group: 'Vitamins', low: 30, high: 100, lowerIsBad: true,
    plain: (f) => f === 'low' ? 'Below sufficiency (30). Deficiency affects bone, immunity & mood — sun exposure and/or supplementation help.' : 'Sufficient vitamin D.' },
]

const GROUPS = ['Metabolic', 'Lipids', 'Kidney', 'Liver', 'Blood', 'Hormone', 'Inflammation', 'Vitamins']

function flagFor(def: LabDef, v: number, sex: Sex): Flag {
  const [lo, hi] = def.range ? def.range(sex) : [def.low, def.high]
  if (v < lo) return 'low'
  if (v > hi) return 'high'
  return 'normal'
}

export function LabDecoder() {
  const [sex, setSex] = useState<Sex>('M')
  const [vals, setVals] = useState<Record<string, number | ''>>({})

  const results = useMemo(() => {
    return LABS.map((def) => {
      const v = vals[def.id]
      if (v === '' || v === undefined || !(Number(v) > 0)) return null
      const flag = flagFor(def, Number(v), sex)
      const bad = (flag === 'high' && def.higherIsBad) || (flag === 'low' && def.lowerIsBad)
      const [lo, hi] = def.range ? def.range(sex) : [def.low, def.high]
      return { def, v: Number(v), flag, bad, lo, hi }
    }).filter(Boolean) as { def: LabDef; v: number; flag: Flag; bad: boolean; lo: number; hi: number }[]
  }, [vals, sex])

  const flagged = results.filter((r) => r.flag !== 'normal')

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Lab Result Decoder" subtitle="Enter your blood-test values → plain-language reading. Private, on-device." />
        <div className="mt-3 max-w-[160px]">
          <Field label="Sex (for reference ranges)">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Summary of anything flagged */}
      {flagged.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title={`${flagged.length} value${flagged.length > 1 ? 's' : ''} outside range`} subtitle="What each means in plain language" />
          <div className="mt-3 space-y-2">
            {flagged.map((r) => (
              <div key={r.def.id} className={'rounded-xl border p-3 ' + (r.bad ? 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10' : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink dark:text-white">{r.def.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-black">{r.v} {r.def.unit}</span>
                    <Badge tone={r.bad ? 'critical' : 'low'}>{r.flag === 'high' ? 'High' : 'Low'}</Badge>
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">{r.def.plain(r.flag)}</div>
                <div className="mt-0.5 text-[11px] text-neutral-400">Normal: {r.lo}–{r.hi} {r.def.unit}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Entry form grouped */}
      {GROUPS.map((g) => (
        <Card key={g} className="!p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{g}</div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LABS.filter((l) => l.group === g).map((def) => {
              const v = vals[def.id]
              const flag = v !== '' && v !== undefined && Number(v) > 0 ? flagFor(def, Number(v), sex) : null
              return (
                <Field key={def.id} label={<>{def.name} <span className="text-neutral-400">({def.unit})</span></>}>
                  <div className="flex items-center gap-2">
                    <input className={inputClass} type="number" step="any" value={v ?? ''} onChange={(e) => setVals((s) => ({ ...s, [def.id]: e.target.value === '' ? '' : +e.target.value }))} />
                    {flag && <Badge tone={flag === 'normal' ? 'brand' : (flag === 'high' && def.higherIsBad) || (flag === 'low' && def.lowerIsBad) ? 'critical' : 'low'}>{flag}</Badge>}
                  </div>
                </Field>
              )
            })}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational decoder using standard adult reference ranges — these vary by laboratory, age, pregnancy, and clinical context. A single out-of-range value is often not significant. Always review your results with the doctor who ordered them. Nothing is stored or sent.
      </div>
    </div>
  )
}

export default LabDecoder
