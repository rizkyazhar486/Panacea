import { useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconMoon } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// STOP-BANG — validated obstructive sleep apnea (OSA) risk screening tool
// (Chung et al., 2008, Anesthesiology 108(5):812-821), one of the most widely
// used pre-operative and primary-care OSA screens. 8 yes/no items, 1 point
// each, total 0-8. Standard risk bands: 0-2 low, 3-4 intermediate, 5-8 high.
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS: { key: string; letter: string; label: string }[] = [
  { key: 'snoring', letter: 'S', label: 'Do you Snore loudly (louder than talking or loud enough to be heard through closed doors)?' },
  { key: 'tired', letter: 'T', label: 'Do you often feel Tired, fatigued, or sleepy during daytime?' },
  { key: 'observed', letter: 'O', label: 'Has anyone Observed you stop breathing during your sleep?' },
  { key: 'pressure', letter: 'P', label: 'Do you have, or are you being treated for, high blood Pressure?' },
]

function bandFor(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; desc: string } {
  if (score <= 2) return { label: 'Low risk', tone: 'brand', desc: 'Low probability of moderate-to-severe OSA on this screen.' }
  if (score <= 4) return { label: 'Intermediate risk', tone: 'low', desc: 'Intermediate probability — discuss with a clinician; further testing (e.g. home sleep apnea test or polysomnography) may be warranted, especially if BMI/neck circumference/male gender criteria are also present.' }
  return { label: 'High risk', tone: 'critical', desc: 'High probability of moderate-to-severe OSA — referral for a sleep study (polysomnography or validated home sleep apnea test) is recommended.' }
}

export function SleepApneaScreen() {
  const demo = getDemo()
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [bmi, setBmi] = useState(() => demo.weightKg && demo.heightCm ? +(demo.weightKg / Math.pow(demo.heightCm / 100, 2)).toFixed(1) : 0)
  const [age, setAge] = useState(demo.age || 0)
  const [neckCm, setNeckCm] = useState(0)
  const [male, setMale] = useState(demo.sex === 'M')

  const stopScore = ITEMS.reduce((s, it) => s + (answers[it.key] ? 1 : 0), 0)
  const bangScore = (bmi > 35 ? 1 : 0) + (age > 50 ? 1 : 0) + (neckCm > 40 ? 1 : 0) + (male ? 1 : 0)
  const total = stopScore + bangScore
  const band = bandFor(total)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Apnea Screening (STOP-BANG)" subtitle="Validated obstructive sleep apnea risk screen (Chung et al., 2008)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          One of the most widely used OSA screening tools in pre-operative and primary-care settings.
          Answer each item honestly — this is a screening tool to guide whether a sleep study makes
          sense, not a diagnosis.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">STOP</div>
        <div className="mt-3 space-y-2">
          {ITEMS.map((it) => (
            <label key={it.key} className="flex items-start gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={!!answers[it.key]} onChange={(e) => setAnswers((a) => ({ ...a, [it.key]: e.target.checked }))} />
              <span className="text-sm text-neutral-700 dark:text-neutral-200"><b className="text-brand-dark">{it.letter}</b> — {it.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">BANG</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="B — BMI (kg/m²)">
            <input className={inputClass} type="number" step="0.1" value={bmi || ''} onChange={(e) => setBmi(Number(e.target.value) || 0)} placeholder="e.g. 24.5" />
          </Field>
          <Field label="A — Age (years)">
            <input className={inputClass} type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="N — Neck circumference (cm)">
            <input className={inputClass} type="number" value={neckCm || ''} onChange={(e) => setNeckCm(Number(e.target.value) || 0)} placeholder="measure around the neck" />
          </Field>
          <Field label="G — Gender">
            <select className={inputClass} value={male ? 'M' : 'F'} onChange={(e) => setMale(e.target.value === 'M')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Result</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{total}/8</span>
          <div>
            <Badge tone={band.tone}>{band.label}</Badge>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{band.desc}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-neutral-400">
          <span>STOP: {stopScore}/4</span>
          <span>BANG: {bangScore}/4</span>
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Chung, F., et al. (2008). STOP questionnaire: a tool to screen patients for obstructive sleep
        apnea. <i>Anesthesiology</i>, 108(5), 812-821. Screening tool only — a positive result warrants
        clinical evaluation and, if indicated, a sleep study; it does not diagnose OSA on its own.
      </div>
    </div>
  )
}

export default SleepApneaScreen
