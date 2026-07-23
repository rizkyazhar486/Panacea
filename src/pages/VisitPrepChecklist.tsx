import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconStethoscope } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Doctor-Visit Prep Checklist — turns a short description of why you're going
// (symptom, follow-up, new diagnosis) into a concrete list of what to bring
// and what to ask, plus a free-text symptom-diary box you fill in yourself.
// Pure client-side templating, no external API — the "smart" part is a set
// of curated question banks keyed by visit type, not a generated diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

type VisitType = 'new-symptom' | 'follow-up' | 'new-diagnosis' | 'medication-review' | 'annual-checkup'

const VISIT_TYPES: { id: VisitType; label: string }[] = [
  { id: 'new-symptom', label: 'New symptom I haven\'t discussed before' },
  { id: 'follow-up', label: 'Follow-up on an existing condition' },
  { id: 'new-diagnosis', label: 'Just diagnosed with something new' },
  { id: 'medication-review', label: 'Medication review / renewal' },
  { id: 'annual-checkup', label: 'Annual / routine checkup' },
]

const BRING_ALWAYS = [
  'A list of all current medications, supplements, and doses (or the bottles themselves)',
  'Your ID and insurance/BPJS card',
  'A list of known allergies',
]

const BRING_BY_TYPE: Record<VisitType, string[]> = {
  'new-symptom': ['A note of when the symptom started and what makes it better/worse', 'Any photos if it\'s a visible symptom (rash, swelling, wound)'],
  'follow-up': ['Any home readings you\'ve been tracking (blood pressure, blood sugar, weight)', 'Previous lab results or discharge summary if from a different provider'],
  'new-diagnosis': ['A family member or friend, if the news might be a lot to process alone', 'Your reading/questions from your own research, so you can ask about anything confusing'],
  'medication-review': ['The actual medication bottles, not just names (dosing errors are easy to catch this way)', 'A note of any side effects you\'ve noticed'],
  'annual-checkup': ['Your vaccination record if you have one', 'A list of any new symptoms, even minor ones, from the past year'],
}

const ASK_BY_TYPE: Record<VisitType, string[]> = {
  'new-symptom': [
    'What do you think is causing this, and what else could it be?',
    'What tests, if any, would help narrow it down?',
    'What symptoms would mean I should come back sooner or go to the ER?',
    'Is there anything I can do at home while we wait for more clarity?',
  ],
  'follow-up': [
    'Is my current treatment working as expected, based on today\'s numbers?',
    'Should anything about my treatment change?',
    'What should I be tracking at home before the next visit?',
    'When should I come back, and what would prompt an earlier visit?',
  ],
  'new-diagnosis': [
    'Can you explain this diagnosis in plain terms, and what caused it?',
    'What are my treatment options, and what are the trade-offs of each?',
    'How will this affect my daily life, work, and other health conditions?',
    'Where can I find reliable information to read more on my own?',
    'Should I get a second opinion, and would you support that?',
  ],
  'medication-review': [
    'Why am I still on this medication — is it still needed?',
    'Are there any interactions with my other medications or supplements?',
    'What side effects should I watch for?',
    'Is there a cheaper or simpler alternative (fewer daily doses, generic)?',
  ],
  'annual-checkup': [
    'Based on my age/history, what screenings are due or coming up?',
    'Is there anything in my results that\'s trending in the wrong direction, even if still "normal"?',
    'What\'s the one thing I could change this year that would matter most?',
  ],
}

export function VisitPrepChecklist() {
  const [type, setType] = useState<VisitType>('new-symptom')
  const [reason, setReason] = useState('')
  const [symptomNotes, setSymptomNotes] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (item: string) => setChecked((s) => ({ ...s, [item]: !s[item] }))

  const bring = useMemo(() => [...BRING_ALWAYS, ...BRING_BY_TYPE[type]], [type])
  const ask = ASK_BY_TYPE[type]

  const noteText = useMemo(() => {
    const lines = [
      `Visit prep — ${VISIT_TYPES.find((v) => v.id === type)?.label}`,
      reason ? `Reason: ${reason}` : '',
      symptomNotes ? `Notes: ${symptomNotes}` : '',
      '',
      'To bring: ' + bring.join('; '),
      '',
      'Questions to ask: ' + ask.join(' / '),
    ].filter(Boolean)
    return lines.join('\n')
  }, [type, reason, symptomNotes, bring, ask])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Doctor-Visit Prep Checklist" subtitle="What to bring and what to ask, before you walk in" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Consultations go better when you walk in prepared — this turns your reason for visiting into
          a concrete checklist and a set of questions worth asking, so you don't remember them in the
          car on the way home.
        </p>
        <Field label="What's this visit about?">
          <select className={`${inputClass} mt-1`} value={type} onChange={(e) => setType(e.target.value as VisitType)}>
            {VISIT_TYPES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Briefly, in your own words (optional)">
          <input className={`${inputClass} mt-1`} placeholder="e.g. Lower back pain for 2 weeks" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Field label="Symptom notes — when it started, what makes it better/worse (optional)">
          <textarea className={`${inputClass} mt-1 min-h-20`} value={symptomNotes} onChange={(e) => setSymptomNotes(e.target.value)} />
        </Field>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Bring with you</div>
        <div className="mt-2 space-y-1.5">
          {bring.map((item) => (
            <label key={item} className="flex items-start gap-2 text-[13px] text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={!!checked[item]} onChange={() => toggle(item)} className="mt-0.5 h-4 w-4 accent-brand" />
              <span className={checked[item] ? 'text-neutral-400 line-through' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Questions worth asking</div>
        <div className="mt-2 space-y-1.5">
          {ask.map((item) => (
            <label key={item} className="flex items-start gap-2 text-[13px] text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={!!checked[item]} onChange={() => toggle(item)} className="mt-0.5 h-4 w-4 accent-brand" />
              <span className={checked[item] ? 'text-neutral-400 line-through' : ''}>{item}</span>
            </label>
          ))}
        </div>
        <CopyNote text={noteText} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        A curated prompt list to help you prepare, not a substitute for the visit itself — every
        clinician will tailor their questions to your specific situation.
      </div>
    </div>
  )
}

export default VisitPrepChecklist
