import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconBook, IconPlus } from '../components/icons'
import { LIFE_DOMAINS, DOMAIN_LABEL, DOMAIN_EMOJI, groupIntoChapters, chapterForAge } from '../lib/lifeStory'
import { ageFromDob } from '../lib/anthro'
import type { LifeDomain, LifeEvent } from '../lib/types'

// Life Story: health reframed as one thread in a whole life. The user is
// the protagonist, not a patient — no vitals, no labs, no diagnoses here.
// Every entry is in their own words; the only computed thing is which
// chapter (real age bracket, from their real date of birth) a moment falls
// into. See lib/lifeStory.ts for why "impact" is self-rated, never inferred.

export function LifeStory() {
  const { state, activePatient, addLifeEvent, removeLifeEvent } = useStore()
  const events = state.lifeEvents[activePatient.id] ?? []
  const hasPatient = activePatient.id !== 'none'

  if (!hasPatient) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <IconBook size={40} className="mx-auto text-brand" />
        <h3 className="mt-3 text-lg font-bold">Your story hasn't started yet</h3>
        <p className="mt-1 text-sm text-neutral-500">Add your profile first so your story has a protagonist.</p>
      </Card>
    )
  }

  const chapters = groupIntoChapters(events, activePatient.dob)
  const currentChapter = chapterForAge(ageFromDob(activePatient.dob))

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<IconBook size={18} />}
        title="Your Story"
        subtitle="Not vitals and labs — the moments that actually shape a life. You're the protagonist."
      />

      <Card className="bg-brand-50/40 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Current chapter</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{currentChapter.name}</h2>
        <p className="text-sm text-neutral-500">Age {currentChapter.ageRange}</p>
      </Card>

      <NewEventForm onAdd={(e) => addLifeEvent(activePatient.id, e)} />

      {chapters.length === 0 && (
        <p className="text-center text-sm text-neutral-500">
          No chapters written yet — log your first moment above and your story begins.
        </p>
      )}

      <div className="space-y-6">
        {[...chapters].reverse().map((chapter) => (
          <div key={chapter.name}>
            <div className="mb-2 flex items-baseline gap-2">
              <h3 className="text-lg font-black tracking-tight text-ink">{chapter.name}</h3>
              <span className="text-xs font-semibold text-neutral-400">Age {chapter.ageRange}</span>
            </div>
            <div className="space-y-2">
              {[...chapter.events].reverse().map((ev) => (
                <EventCard key={ev.id} event={ev} onRemove={() => removeLifeEvent(activePatient.id, ev.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const IMPACT_TONE: Record<LifeEvent['impact'], 'normal' | 'neutral' | 'high'> = {
  positive: 'normal',
  neutral: 'neutral',
  negative: 'high',
}
const IMPACT_LABEL: Record<LifeEvent['impact'], string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Hard',
}

function EventCard({ event, onRemove }: { event: LifeEvent; onRemove: () => void }) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {event.domains.map((d) => (
              <span key={d} className="text-xs">
                {DOMAIN_EMOJI[d]} {DOMAIN_LABEL[d]}
              </span>
            ))}
          </div>
          <h4 className="font-bold text-ink">{event.title}</h4>
          {event.note && <p className="mt-1 text-sm text-neutral-600">{event.note}</p>}
          <p className="mt-1.5 text-xs text-neutral-400">{new Date(event.at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge tone={IMPACT_TONE[event.impact]}>{IMPACT_LABEL[event.impact]}</Badge>
          <button type="button" onClick={onRemove} className="text-xs text-neutral-400 hover:text-accent">
            Remove
          </button>
        </div>
      </div>
    </Card>
  )
}

function NewEventForm({ onAdd }: { onAdd: (e: Omit<LifeEvent, 'id'>) => void }) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [domains, setDomains] = useState<LifeDomain[]>([])
  const [impact, setImpact] = useState<LifeEvent['impact']>('positive')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  function toggleDomain(d: LifeDomain) {
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function submit() {
    if (!title.trim() || domains.length === 0) return
    onAdd({
      at: new Date(date).toISOString(),
      title: title.trim(),
      note: note.trim() || undefined,
      domains,
      impact,
    })
    setTitle('')
    setNote('')
    setDomains([])
    setImpact('positive')
  }

  return (
    <Card>
      <Field label="Write the next moment in your story">
        <input
          className={inputClass}
          placeholder="e.g. Started learning guitar, Reconnected with an old friend, Got promoted…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <div className="mt-3">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Which parts of life does this touch?
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LIFE_DOMAINS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDomain(d.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                domains.includes(d.key)
                  ? 'border-brand bg-brand-50 text-brand-dark'
                  : 'border-neutral-200 text-neutral-600'
              }`}
            >
              {d.emoji} {d.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Add detail (optional)">
        <textarea
          className={`${inputClass} min-h-[70px]`}
          placeholder="What happened, and why does it matter to you?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div className="mt-3 flex items-center gap-2">
        <Field label="Date">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="How did it feel?">
          <select className={inputClass} value={impact} onChange={(e) => setImpact(e.target.value as LifeEvent['impact'])}>
            <option value="positive">🌱 Positive</option>
            <option value="neutral">➖ Neutral</option>
            <option value="negative">⛈️ Hard</option>
          </select>
        </Field>
      </div>

      <Button onClick={submit} className="mt-3 w-full">
        <IconPlus size={16} /> Add to your story
      </Button>
    </Card>
  )
}
