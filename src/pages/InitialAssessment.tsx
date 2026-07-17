import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconActivity, IconHeart, IconCheck } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Initial Assessment — required before starting a demanding program: movement
// pattern screen, pain/injury flags, strength baseline, L/R asymmetry, and a
// quality-of-life screening. Runs once (or re-run any time), persists locally.
// The QoL section offers short ADAPTATIONS inspired by the domains of four
// validated instruments (Nottingham Health Profile, McGill Pain Questionnaire
// Short-Form, IQOLA/SF-36, Frenchay Activities Index) — these are simplified
// screening items, not the licensed official instruments, and are labeled as
// such throughout.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'pm_assessment_v1'

interface Assessment {
  done: boolean; at: string
  movement: Record<string, number>
  painRegions: string[]
  painSeverity: number
  strength: { pushups: number; squats60: number; plankSec: number }
  asym: { balanceR: number; balanceL: number; hopR: number; hopL: number }
  qolInstrument: string
  qolAnswers: number[]
}
const DEF: Assessment = {
  done: false, at: '',
  movement: {}, painRegions: [], painSeverity: 0,
  strength: { pushups: 0, squats60: 0, plankSec: 0 },
  asym: { balanceR: 0, balanceL: 0, hopR: 0, hopL: 0 },
  qolInstrument: 'Nottingham Health Profile (adapted)',
  qolAnswers: [],
}
function load(): Assessment { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEF } }
export function isAssessmentDone(): boolean { try { return JSON.parse(localStorage.getItem(KEY) || '{}').done === true } catch { return false } }

const MOVEMENTS = [
  { id: 'squat', label: 'Overhead Squat', desc: 'Full squat, arms straight overhead, heels stay flat on the floor.' },
  { id: 'balance', label: 'Single-Leg Balance', desc: 'Stand on one leg for 30 seconds without excessive wobbling.' },
  { id: 'toetouch', label: 'Toe Touch', desc: 'Bend forward to touch your toes, knees straight, no pain.' },
  { id: 'shoulder', label: 'Shoulder Reach (Scratch Test)', desc: 'One hand from above, one from below the back, try to meet.' },
  { id: 'hop', label: 'Single-Leg Hop', desc: 'Jump and land stably on one leg without wobbling.' },
]
const PAIN_REGIONS = ['Neck', 'Shoulder', 'Upper Back', 'Lower Back', 'Hip', 'Knee', 'Ankle', 'Other']

const QOL_INSTRUMENTS: Record<string, { note: string; items: string[] }> = {
  'Nottingham Health Profile (adapted)': {
    note: 'A brief adaptation of the Nottingham Health Profile domains (energy, pain, emotional reactions, sleep, social isolation, physical mobility) — not the official licensed instrument.',
    items: ['My energy is sufficient throughout the day', 'I rarely feel pain that interferes with activities', 'My mood has been stable lately', 'My sleep quality is good', 'I feel socially connected (not isolated)', 'I can move / be physically active freely'],
  },
  'McGill Pain Questionnaire - Short Form (adapted)': {
    note: 'A brief adaptation of the McGill Pain Questionnaire Short-Form domains (sensory & affective pain descriptors) — not the official licensed instrument.',
    items: ['My pain is not throbbing/stabbing', 'My pain is not sharp/cutting', 'My pain is not physically exhausting', 'My pain does not disturb me emotionally (not agonizing)', 'Overall, my pain intensity is low'],
  },
  'IQOLA / SF-36 (adapted)': {
    note: 'A brief adaptation of the International Quality of Life Assessment (SF-36) domains: physical functioning, physical role, bodily pain, general health, vitality, social functioning, emotional role, mental health — not the official licensed instrument.',
    items: ['I can do moderate physical activity without limitation', 'My daily work/activities are not disrupted by physical problems', 'Bodily pain does not limit my activities', 'Overall I rate my health as good', 'I have enough energy/vitality', 'My social activities are not disrupted', 'Emotional problems do not disrupt my activities', 'My mental health is good (calm, happy)'],
  },
  'Frenchay Activities Index (adapted)': {
    note: 'A brief adaptation of the Frenchay Activities Index domains (activities of daily living & social participation) — not the official licensed instrument.',
    items: ['I regularly prepare my own meals', 'I regularly shop for daily necessities', 'I do light/heavy housework', 'I regularly walk outdoors', 'I actively pursue hobbies', 'I travel (driving/public transport) independently', 'I do productive/useful work'],
  },
}

export function InitialAssessment() {
  const nav = useNavigate()
  const [a, setA] = useState<Assessment>(load)
  const [step, setStep] = useState(0)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(a)) } catch { /* ignore */ } }, [a])

  const movementScore = Object.values(a.movement).reduce((s, v) => s + v, 0)
  const movementMax = MOVEMENTS.length * 2
  const asymBalance = Math.max(a.asym.balanceR, a.asym.balanceL) > 0 ? (Math.abs(a.asym.balanceR - a.asym.balanceL) / Math.max(a.asym.balanceR, a.asym.balanceL)) * 100 : 0
  const asymHop = Math.max(a.asym.hopR, a.asym.hopL) > 0 ? (Math.abs(a.asym.hopR - a.asym.hopL) / Math.max(a.asym.hopR, a.asym.hopL)) * 100 : 0
  const qolItems = QOL_INSTRUMENTS[a.qolInstrument].items
  const qolScore = a.qolAnswers.reduce((s, v) => s + v, 0)
  const qolMax = qolItems.length * 4
  const qolPct = qolMax > 0 ? (qolScore / qolMax) * 100 : 0

  const painFlag = a.painRegions.length > 0 && a.painSeverity >= 4
  const movementFlag = movementScore < movementMax * 0.5
  const asymFlag = asymBalance > 15 || asymHop > 15

  function finish() {
    setA((x) => ({ ...x, done: true, at: new Date().toISOString() }))
    nav('/training-plan')
  }

  const STEPS = ['Movement Pattern', 'Pain & Injury', 'Baseline Strength', 'Asymmetry', 'Quality of Life', 'Summary']

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Initial Assessment" subtitle="Movement pattern, injury risk, pain, strength & asymmetry — before starting a demanding program" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (step === i ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{i + 1}. {s}</button>
          ))}
        </div>
      </Card>

      {step === 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Movement Pattern Screen" subtitle="Self-assess (use a mirror/record video) — 0 unable, 1 with compensation, 2 perfect" />
          <div className="mt-3 space-y-3">
            {MOVEMENTS.map((m) => (
              <div key={m.id} className="rounded-xl border border-neutral-100 p-3">
                <div className="text-sm font-bold">{m.label}</div>
                <p className="text-[11px] text-neutral-500">{m.desc}</p>
                <div className="mt-2 flex gap-1.5">
                  {[0, 1, 2].map((v) => (
                    <button key={v} onClick={() => setA((x) => ({ ...x, movement: { ...x.movement, [m.id]: v } }))}
                      className={'flex-1 rounded-lg py-1.5 text-xs font-bold ' + (a.movement[m.id] === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconHeart size={20} />} title="Pain & Injury History" subtitle="Mark areas that feel painful/have been injured" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PAIN_REGIONS.map((r) => (
              <button key={r} onClick={() => setA((x) => ({ ...x, painRegions: x.painRegions.includes(r) ? x.painRegions.filter((p) => p !== r) : [...x.painRegions, r] }))}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (a.painRegions.includes(r) ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-500')}>{r}</button>
            ))}
          </div>
          <div className="mt-4">
            <Field label={`Overall pain level (0-10): ${a.painSeverity}`}>
              <input type="range" min={0} max={10} value={a.painSeverity} onChange={(e) => setA((x) => ({ ...x, painSeverity: +e.target.value }))} className="w-full" />
            </Field>
          </div>
          {painFlag && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] text-rose-600">⚠️ Significant pain recorded. You should consult a doctor/physiotherapist before starting a demanding training program.</div>}
        </Card>
      )}

      {step === 2 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Baseline Strength" subtitle="Simple tests — a reference point for tracking your progress" />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Max push-ups"><input className={inputClass} type="number" value={a.strength.pushups || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, pushups: +e.target.value } }))} /></Field>
            <Field label="Squats/60 sec"><input className={inputClass} type="number" value={a.strength.squats60 || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, squats60: +e.target.value } }))} /></Field>
            <Field label="Plank (sec)"><input className={inputClass} type="number" value={a.strength.plankSec || ''} onChange={(e) => setA((x) => ({ ...x, strength: { ...x.strength, plankSec: +e.target.value } }))} /></Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Asymmetry & Imbalance" subtitle="Compare right vs left side" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Right Balance (sec)"><input className={inputClass} type="number" value={a.asym.balanceR || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, balanceR: +e.target.value } }))} /></Field>
            <Field label="Left Balance (sec)"><input className={inputClass} type="number" value={a.asym.balanceL || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, balanceL: +e.target.value } }))} /></Field>
            <Field label="Right Hop (cm)"><input className={inputClass} type="number" value={a.asym.hopR || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, hopR: +e.target.value } }))} /></Field>
            <Field label="Left Hop (cm)"><input className={inputClass} type="number" value={a.asym.hopL || ''} onChange={(e) => setA((x) => ({ ...x, asym: { ...x.asym, hopL: +e.target.value } }))} /></Field>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Balance Asymmetry</div><div className="text-base font-extrabold text-brand-dark">{asymBalance.toFixed(0)}%</div></div>
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Hop Asymmetry</div><div className="text-base font-extrabold text-brand-dark">{asymHop.toFixed(0)}%</div></div>
          </div>
          {asymFlag && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700">⚠️ Asymmetry &gt;15% detected — consider additional unilateral training for the weaker side.</div>}
        </Card>
      )}

      {step === 4 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconHeart size={20} />} title="Quality of Life Screening" subtitle="Choose a reference instrument (brief adaptation, not the official licensed version)" />
          <Field label="Instrument">
            <select className={inputClass} value={a.qolInstrument} onChange={(e) => setA((x) => ({ ...x, qolInstrument: e.target.value, qolAnswers: [] }))}>
              {Object.keys(QOL_INSTRUMENTS).map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{QOL_INSTRUMENTS[a.qolInstrument].note}</p>
          <div className="mt-3 space-y-3">
            {qolItems.map((q, i) => (
              <div key={q} className="rounded-xl border border-neutral-100 p-3">
                <div className="text-xs font-semibold">{q}</div>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3, 4].map((v) => (
                    <button key={v} onClick={() => setA((x) => { const next = [...x.qolAnswers]; next[i] = v; return { ...x, qolAnswers: next } })}
                      className={'flex-1 rounded-lg py-1.5 text-[11px] font-bold ' + ((a.qolAnswers[i] ?? -1) === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{v}</button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>Disagree</span><span>Strongly agree</span></div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-neutral-50 p-3">
            <div className="text-[9px] font-bold uppercase text-neutral-400">Score</div>
            <div className="text-lg font-extrabold text-brand-dark">{qolPct.toFixed(0)}%</div>
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconCheck size={20} />} title="Summary & Save" subtitle="Review before saving the assessment" />
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Movement Pattern</span>
              <Badge tone={movementFlag ? 'critical' : 'brand'}>{movementScore}/{movementMax} {movementFlag ? '— Needs attention' : '— Good'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Pain</span>
              <Badge tone={painFlag ? 'critical' : 'brand'}>{a.painRegions.length > 0 ? a.painRegions.join(', ') : 'None'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Asymmetry</span>
              <Badge tone={asymFlag ? 'low' : 'brand'}>{asymFlag ? 'Detected >15%' : 'Balanced'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <span className="text-xs font-bold">Quality of Life</span>
              <Badge tone={qolPct >= 70 ? 'brand' : qolPct >= 40 ? 'low' : 'critical'}>{qolPct.toFixed(0)}%</Badge>
            </div>
          </div>
          {(movementFlag || painFlag) && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-600">
              Signs of injury risk detected. Your program will still be created, but start at a light intensity and consider consulting a professional first.
            </div>
          )}
          <Button onClick={finish} className="mt-4 w-full">Save & Start Program →</Button>
        </Card>
      )}
    </div>
  )
}

export default InitialAssessment
