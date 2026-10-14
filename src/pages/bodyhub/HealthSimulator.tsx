import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../components/ui'
import { IconSparkle } from '../../components/icons'
import { getDemoTersimpan } from '../../lib/profile'
import { parseNumberField, validateFraminghamInput } from '../../domains/clinical-calculators'
import type { FraminghamField } from '../../domains/clinical-calculators'
import { framinghamCVD, cvdBand } from '../../lib/riskModels'
import { CopyNote } from '../../components/CopyNote'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

// ─────────────────────────────────────────────────────────────────────────────
// Simulator Bagaimana-Jika — the honest, transparent foundation of a "digital
// twin": it composes published risk equations the app already ships
// (Framingham General CVD 10-year risk, D'Agostino 2008) and lets the
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
  // Kolom angka mulai kosong; usia hanya diprefill dari profil yang benar-benar tersimpan (bukan getDemo()).
  const [txt, setTxt] = useState<Record<FraminghamField, string>>(() => {
    const saved = getDemoTersimpan().age
    return { age: typeof saved === 'number' && Number.isFinite(saved) ? String(saved) : '', totChol: '', hdl: '', sbp: '' }
  })
  const [flags, setFlags] = useState({ sex: (getDemoTersimpan().sex === 'F' ? 'F' : 'M') as 'M' | 'F', treatedBP: false, smoker: false, diabetic: false })
  const [active, setActive] = useState<Record<string, boolean>>({})

  const input = validateFraminghamInput({
    age: parseNumberField(txt.age), totChol: parseNumberField(txt.totChol), hdl: parseNumberField(txt.hdl), sbp: parseNumberField(txt.sbp),
  })
  const b: Baseline | null = input.ok ? { ...input.value, ...flags } : null

  const applicable = b ? LEVERS.filter((l) => l.applies(b)) : []
  const simulated = useMemo(() => {
    if (!b) return null
    let s = { ...b }
    for (const l of LEVERS) if (active[l.id] && l.applies(b)) s = l.apply(s)
    return s
  }, [b, active])

  const baseRisk = b ? framinghamCVD(b) : null
  const simRisk = simulated ? framinghamCVD(simulated) : null

  // Life Timeline — project the same published equation across future ages
  // (Framingham published age range is 30-74, so we cap the projection there).
  // Biomarkers are held constant: this isolates the effect of the interventions
  // themselves rather than guessing how labs drift, which keeps it honest.
  const timeline = useMemo(() => {
    if (!b || !simulated) return []
    const start = Math.max(30, Math.round(b.age))
    const pts: { age: number; current: number | null; withChanges: number | null }[] = []
    for (let a = start; a <= 74; a += Math.max(1, a === start ? 0 : 5)) {
      const age = a === start ? start : Math.min(a, 74)
      pts.push({
        age,
        current: framinghamCVD({ ...b, age }),
        withChanges: framinghamCVD({ ...simulated, age }),
      })
      if (age >= 74) break
    }
    return pts
  }, [b, simulated])
  const hasIntervention = !!b && Object.entries(active).some(([id, on]) => on && LEVERS.find((l) => l.id === id)?.applies(b))
  const valid = baseRisk != null && simRisk != null
  const delta = valid ? simRisk! - baseRisk! : 0
  const relReduction = valid && baseRisk! > 0 ? (1 - simRisk! / baseRisk!) * 100 : 0

  const problems = input.ok ? {} : input.problems
  const num = (label: string, key: FraminghamField) => (
    <Field label={label}>
      <input className={inputClass} type="number" inputMode="decimal" step={1} value={txt[key]} aria-invalid={!!problems[key]} onChange={(e) => setTxt((x) => ({ ...x, [key]: e.target.value }))} />
      {problems[key] && <p role="alert" className="mt-1 text-[11px] font-semibold text-red-600">{problems[key]}</p>}
    </Field>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="What-If Health Simulator" subtitle="Published Framingham 10-year CVD risk under toggled choices — not a clinically validated Panacea decision" />
        <BatasKlaimKesehatan permukaan="longevity.health-simulator" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Enter your current numbers, then toggle published-model levers and watch estimated 10-year cardiovascular risk move. Every number comes from Framingham (D'Agostino 2008) — a technical estimate to discuss with a clinician, not a personal prognosis.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {num('Age (years, 30–74)', 'age')}
          <Field label="Sex">
            <select className={inputClass} value={flags.sex} onChange={(e) => setFlags((x) => ({ ...x, sex: e.target.value as 'M' | 'F' }))}>
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
            <input type="checkbox" className="h-4 w-4 rounded" checked={flags.smoker} onChange={(e) => setFlags((x) => ({ ...x, smoker: e.target.checked }))} /> Current smoker
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={flags.diabetic} onChange={(e) => setFlags((x) => ({ ...x, diabetic: e.target.checked }))} /> Diabetes
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={flags.treatedBP} onChange={(e) => setFlags((x) => ({ ...x, treatedBP: e.target.checked }))} /> On BP treatment
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Try changing your future</div>
        <div className="mt-3 space-y-2">
          {b && applicable.length === 0 && <p className="text-[12px] text-neutral-500">Your current profile has no modifiable levers in this model — great baseline.</p>}
          {applicable.map((l) => (
            <label key={l.id} className="flex items-start gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded" checked={!!active[l.id]} onChange={() => setActive((a) => ({ ...a, [l.id]: !a[l.id] }))} />
              <span>
                <span className="text-sm font-bold text-ink dark:text-ink">{l.label}</span>
                <span className="block text-[12px] leading-snug text-neutral-500">{l.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">10-year cardiovascular risk</div>
        {valid ? (
          <>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Now</div>
                <div className="mt-1 text-3xl font-black text-ink dark:text-ink">{baseRisk!.toFixed(1)}%</div>
                <Badge tone={cvdBand(baseRisk!).tone}>{cvdBand(baseRisk!).label}</Badge>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">If you make these changes</div>
                <div className="mt-1 text-3xl font-black text-brand-dark">{simRisk!.toFixed(1)}%</div>
                <Badge tone={cvdBand(simRisk!).tone}>{cvdBand(simRisk!).label}</Badge>
              </div>
            </div>
            {delta < 0 ? (
              <p className="mt-3 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-sm font-bold text-brand-dark">
                ↓ {Math.abs(delta).toFixed(1)} percentage points lower — a {relReduction.toFixed(0)}% relative reduction in 10-year risk.
              </p>
            ) : (
              <p className="mt-3 text-[12px] text-neutral-500">Toggle the levers above to see your risk change.</p>
            )}
            <CopyNote text={`Framingham 10-yr CVD risk ${baseRisk!.toFixed(1)}% → ${simRisk!.toFixed(1)}% with modifiable changes (${relReduction.toFixed(0)}% relative reduction) [D'Agostino 2008]`} />
          </>
        ) : (
          <p className="mt-2 text-[12px] text-neutral-500">No estimate yet — fill in age, total cholesterol, HDL and systolic BP within the ranges shown.</p>
        )}
      </Card>

      {timeline.length >= 2 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Life Timeline — 10-year risk at each future age</div>
          <p className="mt-1 text-[12px] text-neutral-500">
            Your risk projected forward with today's numbers held constant. The gap between the two
            lines is the future you're buying with today's choices.
          </p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: 'age', position: 'insideBottomRight', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={(v) => `${typeof v === 'number' ? v.toFixed(1) : v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'high-risk', fontSize: 9, fill: '#ef4444' }} />
                <ReferenceLine y={7.5} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="current" name="Current path" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                {hasIntervention && <Line type="monotone" dataKey="withChanges" name="With your changes" stroke="#00BF63" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Prosa kelas="mt-2 text-[11px] text-neutral-500">Projection uses the published Framingham equation at each age with your current biomarkers held fixed (published age range 30–74). That isolates the levers alone — real labs and blood pressure also drift with age — so read this as direction, not certainty, and not a clinically validated Panacea forecast.</Prosa>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        D'Agostino, R.B., et al. (2008). General cardiovascular risk profile for use in primary care:
        the Framingham Heart Study. <i>Circulation</i>, 117(6), 743-753. This simulates the risk-model
        response to modifiable factors — it is decision support to motivate change, not a promise of
        any individual outcome. Discuss any plan with your clinician.
      </div>
    </div>
  )
}

export default HealthSimulator
