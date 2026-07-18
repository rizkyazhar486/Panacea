import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Charlson Comorbidity Index (CCI) — Charlson, M.E., et al. (1987),
// J Chronic Dis, 40(5):373-383. The most widely used comorbidity burden
// index, weighting 19 conditions (1/2/3/6 points) with an age adjustment
// (+1 per decade from age 50, i.e. 50-59=1 … ≥80=4). The combined
// age-comorbidity score maps to an estimated 10-year survival via
//   10-yr survival = 0.983 ^ exp(0.9 × score)
// Pure checklist arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const CONDITIONS = [
  { key: 'mi', label: 'Myocardial infarction (history)', pts: 1 },
  { key: 'chf', label: 'Congestive heart failure', pts: 1 },
  { key: 'pvd', label: 'Peripheral vascular disease', pts: 1 },
  { key: 'cva', label: 'Cerebrovascular disease (CVA/TIA)', pts: 1 },
  { key: 'dementia', label: 'Dementia', pts: 1 },
  { key: 'copd', label: 'Chronic pulmonary disease', pts: 1 },
  { key: 'ctd', label: 'Connective tissue disease', pts: 1 },
  { key: 'pud', label: 'Peptic ulcer disease', pts: 1 },
  { key: 'liverMild', label: 'Mild liver disease', pts: 1 },
  { key: 'dm', label: 'Diabetes without end-organ damage', pts: 1 },
  { key: 'hemiplegia', label: 'Hemiplegia', pts: 2 },
  { key: 'ckd', label: 'Moderate-severe chronic kidney disease', pts: 2 },
  { key: 'dmOrgan', label: 'Diabetes with end-organ damage', pts: 2 },
  { key: 'tumor', label: 'Solid tumor (non-metastatic)', pts: 2 },
  { key: 'leukemia', label: 'Leukemia', pts: 2 },
  { key: 'lymphoma', label: 'Lymphoma', pts: 2 },
  { key: 'liverSevere', label: 'Moderate-severe liver disease', pts: 3 },
  { key: 'mets', label: 'Metastatic solid tumor', pts: 6 },
  { key: 'aids', label: 'AIDS', pts: 6 },
] as const

function agePts(age: number): number {
  if (age < 50) return 0
  if (age < 60) return 1
  if (age < 70) return 2
  if (age < 80) return 3
  return 4
}

export function CharlsonIndex() {
  const [age, setAge] = useState(() => getDemo().age || 45)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  // Mutually exclusive pairs: score the more severe form only, as in the original index
  const comorbidityPts = CONDITIONS.reduce((s, c) => {
    if (!checked[c.key]) return s
    if (c.key === 'dm' && checked.dmOrgan) return s
    if (c.key === 'liverMild' && checked.liverSevere) return s
    if (c.key === 'tumor' && checked.mets) return s
    return s + c.pts
  }, 0)
  const total = comorbidityPts + agePts(age)
  const survival10y = Math.pow(0.983, Math.exp(0.9 * total)) * 100

  const tone: 'brand' | 'low' | 'critical' = survival10y >= 90 ? 'brand' : survival10y >= 50 ? 'low' : 'critical'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Charlson Comorbidity Index" subtitle="Comorbidity burden & estimated 10-year survival (Charlson et al. 1987)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          The most widely used comorbidity index — 19 weighted conditions plus an age adjustment.
          Where a mild and severe form of the same condition are both checked, only the severe form
          is scored (as in the original index).
        </p>
        <div className="mt-3 max-w-[200px]">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} max={110} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              <span className="flex-1">{c.label}</span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{c.pts}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Comorbidity</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{comorbidityPts}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Age points</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{agePts(age)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Total CCI</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{total}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{survival10y.toFixed(0)}%</span>
          <Badge tone={tone}>Estimated 10-year survival</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">10-yr survival = 0.983 ^ exp(0.9 × score) — a population-level estimate from the original cohort, not an individual prognosis.</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Charlson, M.E., et al. (1987). A new method of classifying prognostic comorbidity in
        longitudinal studies. <i>J Chronic Dis</i>, 40(5), 373-383. Decision-support estimate —
        widely used in research and surgical risk discussion; individual prognosis depends on far
        more than the index.
      </div>
    </div>
  )
}

export default CharlsonIndex
