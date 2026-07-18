import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'
import { getDemo } from '../lib/profile'
import { framinghamCVD, cvdBand } from '../lib/riskModels'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// What-If Health Simulator — the honest, transparent foundation of a "digital
// twin": it composes VALIDATED, published risk equations the app already
// trusts (Framingham General CVD 10-year risk, D'Agostino 2008) and lets the
// user toggle modifiable choices — quit smoking, treat blood pressure, lower
// cholesterol, control diabetes — then shows how the risk changes side by side.
//
// This is NOT a black-box AI prediction: every number comes from a named,
// peer-reviewed model, and the app shows exactly which levers moved it. That
// transparency is the point — it turns an abstract number into "here is what
// changing this does for you." Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Baseline {
  age: number; sex: 'M' | 'F'; totChol: number; hdl: number; sbp: number
  treatedBP: boolean; smoker: boolean; diabetic: boolean
}

// Named, evidence-based interventions. Each transforms the baseline in the
// direction the modelled factor moves — the magnitude of the *risk* change
// then comes entirely from the Framingham equation, not from a made-up number.
interface Lever {
  id: string; label: string; detail: string
  apply: (b: Baseline) => Baseline
  applies: (b: Baseline) => boolean
}
const LEVERS: Lever[] = [
  {
    id: 'quitSmoking', label: 'Quit smoking today', detail: 'Removes smoking from the risk model — much of the excess CVD risk falls within 1-5 years of quitting.',
    applies: (b) => b.smoker, apply: (b) => ({ ...b, smoker: false }),
  },
  {
    id: 'treatBP', label: 'Lower systolic BP to 120', detail: 'Simulates effective blood-pressure control (e.g. lifestyle + medication) down to a systolic of 120 mmHg.',
    applies: (b) => b.sbp > 120, apply: (b) => ({ ...b, sbp: 120, treatedBP: true }),
  },
  {
    id: 'raiseHdl', label: 'Raise HDL by 10 mg/dL', detail: 'Simulates the HDL improvement achievable with sustained aerobic exercise and weight loss.',
    applies: (b) => true, apply: (b) => ({ ...b, hdl: b.hdl + 10 }),
  },
  {
    id: 'lowerChol', label: 'Lower total cholesterol by 40 mg/dL', detail: 'Approximates a moderate-intensity statin / strong dietary effect on total cholesterol.',
    applies: (b) => b.totChol > 160, apply: (b) => ({ ...b, totChol: Math.max(120, b.totChol - 40) }),
  },
  {
    id: 'controlDm', label: 'Reverse/control diabetes', detail: 'Simulates removing diabetes as an active risk factor (e.g. remission or tight control). Discuss feasibility with your clinician.',
    applies: (b) => b.diabetic, apply: (b) => ({ ...b, diabetic: false }),
  },
]

export function HealthSimulator() {
  const demo = getDemo()
  const [b, setB] = useState<Baseline>({
    age: demo.age || 45, sex: demo.sex || 'M', totChol: 200, hdl: 50, sbp: 140,
    treatedBP: false, smoker: false, diabetic: false,
  })
  const [active, setActive] = useState<Record<string, boolean>>({})

  const applicable = LEVERS.filter((l) => l.applies(b))
  const simulated = useMemo(() => {
    let s = { ...b }
    for (const l of LEVERS) if (active[l.id] && l.applies(b)) s = l.apply(s)
    return s
  }, [b, active])

  const baseRisk = framinghamCVD(b)
  const simRisk = framinghamCVD(simulated)
  const valid = baseRisk != null && simRisk != null
  const delta = valid ? simRisk! - baseRisk! : 0
  const relReduction = valid && baseRisk! > 0 ? (1 - simRisk! / baseRisk!) * 100 : 0

  const num = (label: string, key: keyof Baseline, step = 1) => (
    <Field label={label}>
      <input className={inputClass} type="number" step={step} value={(b[key] as number) || ''} onChange={(e) => setB((x) => ({ ...x, [key]: Number(e.target.value) || 0 }))} />
    </Field>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="What-If Health Simulator" subtitle="See how today's choices reshape your 10-year risk" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A transparent "digital twin" first step: enter your current numbers, then toggle real,
          evidence-based changes and watch your 10-year cardiovascular risk move. Every number comes
          from the published Framingham equation — nothing is a black-box guess.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {num('Age (years)', 'age')}
          <Field label="Sex">
            <select className={inputClass} value={b.sex} onChange={(e) => setB((x) => ({ ...x, sex: e.target.value as 'M' | 'F' }))}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          {num('Total cholesterol (mg/dL)', 'totChol')}
          {num('HDL (mg/dL)', 'hdl')}
          {num('Systolic BP (mmHg)', 'sbp')}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={b.smoker} onChange={(e) => setB((x) => ({ ...x, smoker: e.target.checked }))} /> Current smoker
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={b.diabetic} onChange={(e) => setB((x) => ({ ...x, diabetic: e.target.checked }))} /> Diabetes
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={b.treatedBP} onChange={(e) => setB((x) => ({ ...x, treatedBP: e.target.checked }))} /> On BP treatment
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Try changing your future</div>
        <div className="mt-3 space-y-2">
          {applicable.length === 0 && <p className="text-[12px] text-neutral-400">Your current profile has no modifiable levers in this model — great baseline.</p>}
          {applicable.map((l) => (
            <label key={l.id} className="flex items-start gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded" checked={!!active[l.id]} onChange={() => setActive((a) => ({ ...a, [l.id]: !a[l.id] }))} />
              <span>
                <span className="text-sm font-bold text-ink dark:text-white">{l.label}</span>
                <span className="block text-[12px] leading-snug text-neutral-500">{l.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">10-year cardiovascular risk</div>
        {valid ? (
          <>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Now</div>
                <div className="mt-1 text-3xl font-black text-ink dark:text-white">{baseRisk!.toFixed(1)}%</div>
                <Badge tone={cvdBand(baseRisk!).tone}>{cvdBand(baseRisk!).label}</Badge>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">If you make these changes</div>
                <div className="mt-1 text-3xl font-black text-brand-dark">{simRisk!.toFixed(1)}%</div>
                <Badge tone={cvdBand(simRisk!).tone}>{cvdBand(simRisk!).label}</Badge>
              </div>
            </div>
            {delta < 0 ? (
              <p className="mt-3 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-sm font-bold text-brand-dark">
                ↓ {Math.abs(delta).toFixed(1)} percentage points lower — a {relReduction.toFixed(0)}% relative reduction in 10-year risk.
              </p>
            ) : (
              <p className="mt-3 text-[12px] text-neutral-400">Toggle the levers above to see your risk change.</p>
            )}
            <CopyNote text={`Framingham 10-yr CVD risk ${baseRisk!.toFixed(1)}% → ${simRisk!.toFixed(1)}% with modifiable changes (${relReduction.toFixed(0)}% relative reduction) [D'Agostino 2008]`} />
          </>
        ) : (
          <p className="mt-2 text-[12px] text-neutral-400">Enter valid cholesterol, HDL, and blood-pressure values to simulate.</p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        D'Agostino, R.B., et al. (2008). General cardiovascular risk profile for use in primary care:
        the Framingham Heart Study. <i>Circulation</i>, 117(6), 743-753. This simulates the risk-model
        response to modifiable factors — it is decision support to motivate change, not a promise of
        any individual outcome. Discuss any plan with your clinician.
      </div>
    </div>
  )
}

export default HealthSimulator
