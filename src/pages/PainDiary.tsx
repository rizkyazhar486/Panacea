import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconActivity } from '../components/icons'
import { ScoreTrend } from '../components/ScoreTrend'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Pain / Symptom Diary — log a 0-10 severity rating with location/notes and
// see the trend over time. Reuses the same serial-tracking component (save +
// chart + delete) already validated across SOFA/NEWS2/MELD-Na/Maddrey, so
// the storage and charting logic is proven, not new. Pure client-side,
// localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function PainDiary() {
  const [level, setLevel] = useState(4)
  const [location, setLocation] = useState('')
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')

  const detail = [location && `Location: ${location}`, trigger && `Trigger: ${trigger}`, note && `Note: ${note}`].filter(Boolean).join(' · ') || 'No details recorded'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Pain / Symptom Diary" subtitle="Track severity over time — useful for you and your clinician" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A single reading is a snapshot; a trend is information. Rate your pain or symptom severity
          now, add where it is and what might have triggered it, and save — the chart below tracks
          every entry so you (or your doctor) can see the pattern, not just today.
        </p>
      </Card>

      <Card className="!p-5">
        <Field label={`Severity right now: ${level}/10`}>
          <input className="mt-2 w-full accent-brand" type="range" min={0} max={10} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          <div className="mt-1 flex justify-between text-[11px] text-neutral-400"><span>0 · None</span><span>5 · Moderate</span><span>10 · Worst possible</span></div>
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Location (optional)">
            <input className={inputClass} placeholder="e.g. Lower back, left knee" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Possible trigger (optional)">
            <input className={inputClass} placeholder="e.g. After sitting all day" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
          </Field>
        </div>
        <Field label="Note (optional)">
          <textarea className={`${inputClass} mt-1 min-h-16`} placeholder="Sharp, dull, burning; what helped; anything else" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <CopyNote text={`Pain/symptom: ${level}/10 — ${detail}`} />
      </Card>

      <ScoreTrend
        storageKey="pmd_pain_diary_v1"
        scoreName="Pain/Symptom Severity"
        total={level}
        maxScore={10}
        detail={detail}
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        A self-reported severity trend, not a diagnosis. Bring this history to your next visit —
        clinicians often ask exactly these questions (when, where, how severe, what helps).
      </div>
    </div>
  )
}

export default PainDiary
