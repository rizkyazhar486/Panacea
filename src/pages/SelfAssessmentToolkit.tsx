import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconGauge } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Self-Assessment Toolkit — four small real self-assessment tools in one
// page: a telomere-lifestyle education quiz, a self-reported inflammation
// score, a "what's aging you most" flowchart, and the waist-to-height ratio
// (a simple ratio several studies find outperforms BMI as a longevity/
// cardiometabolic-risk predictor). Pure client-side scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'telomere' | 'inflammation' | 'aging-factor' | 'waist-height'

const TELOMERE_QS = [
  { q: 'How would you rate your average daily stress?', opts: [['Low', 0], ['Moderate', 1], ['High, most days', 2]] as [string, number][] },
  { q: 'How many servings of vegetables/fruit do you eat most days?', opts: [['5+', 0], ['2-4', 1], ['0-1', 2]] as [string, number][] },
  { q: 'How many days a week do you get moderate-to-vigorous exercise?', opts: [['5+', 0], ['2-4', 1], ['0-1', 2]] as [string, number][] },
  { q: 'How would you describe your sleep quality?', opts: [['Good, consistent', 0], ['Inconsistent', 1], ['Poor most nights', 2]] as [string, number][] },
  { q: 'Do you smoke or use tobacco?', opts: [['Never', 0], ['Former/occasional', 1], ['Regularly', 2]] as [string, number][] },
]
function TelomereQuiz() {
  const [answers, setAnswers] = useState<number[]>(Array(TELOMERE_QS.length).fill(-1))
  const answered = answers.every((a) => a >= 0)
  const score = answers.reduce((a, b) => a + Math.max(b, 0), 0)
  const maxScore = TELOMERE_QS.length * 2
  const band = score <= maxScore * 0.3 ? 'Lifestyle pattern favorable for telomere health' : score <= maxScore * 0.6 ? 'Some room to improve a few habits' : 'Several habits worth addressing'
  return (
    <Card className="!p-5">
      <p className="text-[13px] leading-relaxed text-neutral-500">
        Telomeres (protective caps on your chromosomes) shorten with age, and observational studies
        link chronic stress, poor diet, inactivity, poor sleep, and smoking to faster shortening. This
        is an educational lifestyle-pattern quiz, not a telomere length test — only a lab (telomere
        length blood test) can measure that directly.
      </p>
      <div className="mt-3 space-y-3">
        {TELOMERE_QS.map((item, qi) => (
          <div key={item.q}>
            <div className="text-[13px] font-bold text-ink dark:text-white">{item.q}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {item.opts.map(([label, val]) => (
                <button key={label} onClick={() => setAnswers((a) => { const n = [...a]; n[qi] = val; return n })} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${answers[qi] === val ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {answered && (
        <div className="mt-4 rounded-xl bg-brand/10 p-4 text-center">
          <div className="text-2xl font-black text-brand-dark">{score}/{maxScore}</div>
          <div className="text-[12px] text-neutral-500">{band}</div>
        </div>
      )}
    </Card>
  )
}

const INFLAMMATION_QS = [
  'Joint pain or stiffness (not from a recent injury)',
  'Frequent fatigue not explained by poor sleep',
  'Skin issues (acne, eczema flares, unusual redness)',
  'Frequent bloating or digestive discomfort',
  'Getting sick often or slow to recover from minor illness',
  'Brain fog or difficulty concentrating',
]
function InflammationScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const count = Object.values(checked).filter(Boolean).length
  const band = count === 0 ? 'No self-reported signals right now' : count <= 2 ? 'A couple of signals worth watching' : 'Several signals — worth discussing with a clinician'
  return (
    <Card className="!p-5">
      <p className="text-[13px] leading-relaxed text-neutral-500">
        Check anything you've noticed regularly over the past 2 weeks. This is a self-reported symptom
        pattern, not a CRP/inflammatory-marker blood test — actual inflammation is only confirmed with
        lab work.
      </p>
      <div className="mt-3 space-y-1.5">
        {INFLAMMATION_QS.map((q) => (
          <label key={q} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
            <input type="checkbox" checked={!!checked[q]} onChange={(e) => setChecked((c) => ({ ...c, [q]: e.target.checked }))} className="h-4 w-4 accent-brand" />
            <span className="text-[13px] text-ink dark:text-white">{q}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{count}/{INFLAMMATION_QS.length}</div>
        <div className="text-[12px] text-neutral-500">{band}</div>
      </div>
    </Card>
  )
}

interface FlowNode { q: string; yes: string | FlowNode; no: string | FlowNode }
const AGING_FLOW: FlowNode = {
  q: 'Do you regularly feel stressed or overwhelmed?',
  yes: {
    q: 'Do you sleep less than 7 hours most nights?',
    yes: 'Your top aging factor right now is likely chronic stress + sleep debt compounding each other.',
    no: 'Your top aging factor right now is likely chronic stress — even with decent sleep, sustained cortisol elevation affects multiple aging pathways.',
  },
  no: {
    q: 'Do you eat mostly processed/high-sugar foods?',
    yes: {
      q: 'Do you get less than 150 minutes of exercise a week?',
      yes: 'Your top aging factor right now is likely the combination of diet quality and low activity — both drive metabolic aging.',
      no: 'Your top aging factor right now is likely diet quality (sugar/processed food), even with good activity levels.',
    },
    no: {
      q: 'Do you get less than 150 minutes of exercise a week?',
      yes: 'Your top aging factor right now is likely inactivity — everything else sounds reasonably on track.',
      no: "You're not showing the most common aging accelerators here — the marginal gains now come from consistency and specifics (grip strength, VO2max, sleep depth) rather than a single big fix.",
    },
  },
}
function AgingFlowchart() {
  const [node, setNode] = useState<FlowNode | null>(AGING_FLOW)
  const [result, setResult] = useState<string | null>(null)
  const answer = (yes: boolean) => {
    const next = yes ? node!.yes : node!.no
    if (typeof next === 'string') { setResult(next); setNode(null) }
    else setNode(next)
  }
  const restart = () => { setNode(AGING_FLOW); setResult(null) }
  return (
    <Card className="!p-6 text-center">
      {result ? (
        <>
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your answer</div>
          <p className="mt-2 text-[15px] font-bold leading-relaxed text-ink dark:text-white">{result}</p>
          <button onClick={restart} className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Start over</button>
        </>
      ) : (
        <>
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">What's aging you?</div>
          <p className="mt-2 text-[15px] font-bold text-ink dark:text-white">{node!.q}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => answer(true)} className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Yes</button>
            <button onClick={() => answer(false)} className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-bold text-neutral-600 dark:bg-white/10">No</button>
          </div>
        </>
      )}
    </Card>
  )
}

function WaistHeightRatio() {
  const [waist, setWaist] = useState(80)
  const [height, setHeight] = useState(() => getDemo().heightCm || 170)
  const ratio = waist / height
  const band: { label: string; tone: 'brand' | 'low' | 'critical' } =
    ratio < 0.5 ? { label: 'Lower risk', tone: 'brand' } : ratio < 0.6 ? { label: 'Increased risk', tone: 'low' } : { label: 'High risk', tone: 'critical' }
  return (
    <Card className="!p-5">
      <p className="text-[13px] leading-relaxed text-neutral-500">
        Waist-to-height ratio — several studies find "keep your waist to less than half your height" a
        simpler and better predictor of cardiometabolic risk than BMI alone, since it captures central
        (visceral) fat directly.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Waist circumference (cm)">
          <input className={inputClass} type="number" min={40} max={200} value={waist} onChange={(e) => setWaist(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Height (cm)">
          <input className={inputClass} type="number" min={100} max={230} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </Field>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{ratio.toFixed(2)}</div>
        <Badge tone={band.tone}>{band.label}</Badge>
        <div className="mt-1 text-[11px] text-neutral-500">Target: below 0.5</div>
      </div>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'telomere', label: 'Telomere Quiz' },
  { id: 'inflammation', label: 'Inflammation Score' },
  { id: 'aging-factor', label: "What's Aging You?" },
  { id: 'waist-height', label: 'Waist-to-Height' },
]

export function SelfAssessmentToolkit() {
  const [tab, setTab] = useState<Tab>('telomere')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconGauge size={20} />} title="Self-Assessment Toolkit" subtitle="Four quick self-assessments in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'telomere' && <TelomereQuiz />}
      {tab === 'inflammation' && <InflammationScore />}
      {tab === 'aging-factor' && <AgingFlowchart />}
      {tab === 'waist-height' && <WaistHeightRatio />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational self-assessments based on general research patterns — none of these are diagnostic
        lab tests. See a clinician for actual bloodwork, telomere testing, or inflammatory markers.
      </div>
    </div>
  )
}

export default SelfAssessmentToolkit
