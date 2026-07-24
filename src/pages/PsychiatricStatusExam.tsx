import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Psychiatric Status (Mental Status Exam) — a structured MSE documentation
// tool covering the standard domains (appearance, behavior, speech, mood,
// affect, thought process/content, perception, cognition, insight/judgment,
// risk assessment). Produces a clean EMR-ready summary line. Documentation
// aid only — not a diagnostic instrument.
// ─────────────────────────────────────────────────────────────────────────────

function Picker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-neutral-500">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${value === o ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

export function PsychiatricStatusExam() {
  const [appearance, setAppearance] = useState('Well-groomed')
  const [behavior, setBehavior] = useState('Cooperative')
  const [speech, setSpeech] = useState('Normal rate/rhythm/volume')
  const [mood, setMood] = useState('Euthymic')
  const [affect, setAffect] = useState('Congruent, full range')
  const [thoughtProcess, setThoughtProcess] = useState('Linear, goal-directed')
  const [thoughtContent, setThoughtContent] = useState('No SI/HI, no delusions')
  const [perception, setPerception] = useState('No hallucinations reported')
  const [cognition, setCognition] = useState('Alert & oriented x4')
  const [insight, setInsight] = useState('Good')
  const [judgment, setJudgment] = useState('Good')
  const [siRisk, setSiRisk] = useState('Denies SI/HI/plan/intent')
  const [freeNotes, setFreeNotes] = useState('')

  const summary = useMemo(() => {
    return `MSE — Appearance: ${appearance}. Behavior: ${behavior}. Speech: ${speech}. Mood: "${mood}" (patient-reported). Affect: ${affect}. Thought process: ${thoughtProcess}. Thought content: ${thoughtContent}. Perception: ${perception}. Cognition: ${cognition}. Insight: ${insight}. Judgment: ${judgment}. Risk: ${siRisk}.${freeNotes ? ` Additional: ${freeNotes}` : ''}`
  }, [appearance, behavior, speech, mood, affect, thoughtProcess, thoughtContent, perception, cognition, insight, judgment, siRisk, freeNotes])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Psychiatric Status Exam" subtitle="Structured Mental Status Exam (MSE) documentation" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Tap through the standard MSE domains to build a clean, EMR-ready summary line. A
          documentation aid only — not a diagnostic or risk-stratification instrument; always use
          your clinical judgment and a validated risk-assessment tool (e.g. C-SSRS) when suicide/self-harm
          risk is a concern.
        </p>
      </Card>

      <Card className="!p-5 space-y-4">
        <Picker label="Appearance" options={['Well-groomed', 'Disheveled', 'Poor hygiene', 'Age-appropriate', 'Appears older than stated age']} value={appearance} onChange={setAppearance} />
        <Picker label="Behavior" options={['Cooperative', 'Guarded', 'Agitated', 'Psychomotor retardation', 'Psychomotor agitation', 'Restless']} value={behavior} onChange={setBehavior} />
        <Picker label="Speech" options={['Normal rate/rhythm/volume', 'Pressured', 'Slowed', 'Soft/hypophonic', 'Loud', 'Poverty of speech']} value={speech} onChange={setSpeech} />
        <Picker label="Mood (patient-reported)" options={['Euthymic', 'Depressed', 'Anxious', 'Irritable', 'Elevated', 'Angry']} value={mood} onChange={setMood} />
        <Picker label="Affect" options={['Congruent, full range', 'Blunted', 'Flat', 'Labile', 'Incongruent with mood', 'Restricted']} value={affect} onChange={setAffect} />
        <Picker label="Thought process" options={['Linear, goal-directed', 'Tangential', 'Circumstantial', 'Flight of ideas', 'Loose associations', 'Thought blocking']} value={thoughtProcess} onChange={setThoughtProcess} />
        <Picker label="Thought content" options={['No SI/HI, no delusions', 'Passive SI without plan', 'Active SI', 'Delusions present', 'Obsessions/compulsions', 'Paranoid ideation']} value={thoughtContent} onChange={setThoughtContent} />
        <Picker label="Perception" options={['No hallucinations reported', 'Auditory hallucinations', 'Visual hallucinations', 'Other hallucinations', 'Depersonalization/derealization']} value={perception} onChange={setPerception} />
        <Picker label="Cognition" options={['Alert & oriented x4', 'Disoriented to time', 'Disoriented to place', 'Impaired attention/concentration', 'Impaired memory']} value={cognition} onChange={setCognition} />
        <Picker label="Insight" options={['Good', 'Fair', 'Poor', 'Absent']} value={insight} onChange={setInsight} />
        <Picker label="Judgment" options={['Good', 'Fair', 'Poor', 'Impaired by acute symptoms']} value={judgment} onChange={setJudgment} />
        <Picker label="Suicide/self-harm risk screen" options={['Denies SI/HI/plan/intent', 'Passive SI, denies plan/intent', 'Active SI with plan — urgent eval needed', 'History of attempt, currently denies SI']} value={siRisk} onChange={setSiRisk} />
        <label className="block text-[11px] font-bold text-neutral-500">Additional free-text notes
          <textarea className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" rows={2} value={freeNotes} onChange={(e) => setFreeNotes(e.target.value)} />
        </label>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Summary</div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{summary}</p>
        <div className="mt-3"><CopyNote text={summary} /></div>
      </Card>

      {siRisk.includes('Active SI') && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-center text-[13px] font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          Active suicidal ideation with a plan flagged — this requires an urgent, in-person safety
          evaluation. Do not rely on this tool to manage acute risk.
        </div>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        A documentation aid for the standard MSE format — not a diagnostic tool, not a substitute for a
        full psychiatric evaluation, and not a validated suicide-risk instrument.
      </div>
    </div>
  )
}

export default PsychiatricStatusExam
