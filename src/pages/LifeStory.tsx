import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconBook, IconPlus, IconDownload } from '../components/icons'
import {
  LIFE_DOMAINS,
  DOMAIN_LABEL,
  DOMAIN_EMOJI,
  groupIntoChapters,
  chapterForAge,
  lifeEventToStoryItem,
  careEpisodeToStoryItems,
  type StoryItem,
  type LifeChapter,
} from '../lib/lifeStory'
import { ageFromDob } from '../lib/anthro'
import type { LifeDomain, LifeEvent, Quest } from '../lib/types'

// Life Story: health reframed as one thread in a whole life. The user is
// the protagonist, not a patient — no vitals, no labs, no diagnoses here.
// Every entry is in their own words; the only computed thing is which
// chapter (real age bracket, from their real date of birth) a moment falls
// into. See lib/lifeStory.ts for why "impact" is self-rated, never inferred.

export function LifeStory() {
  const {
    state,
    activePatient,
    addLifeEvent,
    removeLifeEvent,
    addQuest,
    updateQuestProgress,
    setQuestStatus,
    removeQuest,
  } = useStore()
  const events = state.lifeEvents[activePatient.id] ?? []
  const quests = state.quests[activePatient.id] ?? []
  // One story, not two apps: real Care Episode timestamps (started/blocked/
  // completed) merge into the same timeline as self-logged life moments —
  // see lib/lifeStory.ts's careEpisodeToStoryItems for why only real,
  // already-dated events cross over, never a diagnosis or vital restated.
  const careEpisodes = state.records[activePatient.id]?.careEpisodes ?? []
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

  const storyItems: StoryItem[] = [
    ...events.map(lifeEventToStoryItem),
    ...careEpisodes.flatMap(careEpisodeToStoryItems),
  ]
  const chapters = groupIntoChapters(storyItems, activePatient.dob)
  const currentChapter = chapterForAge(ageFromDob(activePatient.dob))

  return (
    <>
      {/* Screen view — the working, editable app. Hidden entirely when
          printing/exporting, so the two never render on top of each other. */}
      <div className="story-screen-only space-y-5">
        <SectionTitle
          icon={<IconBook size={18} />}
          title="Your Story"
          subtitle="Not vitals and labs — the moments that actually shape a life. You're the protagonist."
          right={
            <Button variant="outline" onClick={() => window.print()} className="!min-h-0 !px-3 !py-1.5 text-xs">
              <IconDownload size={14} /> Export
            </Button>
          }
        />

        <Card className="bg-brand-50/40 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Current chapter</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{currentChapter.name}</h2>
          <p className="text-sm text-neutral-500">Age {currentChapter.ageRange}</p>
        </Card>

        <QuestBoard
          quests={quests}
          onAdd={(q) => addQuest(activePatient.id, q)}
          onProgress={(id, n) => updateQuestProgress(activePatient.id, id, n)}
          onStatus={(id, s) => setQuestStatus(activePatient.id, id, s)}
          onRemove={(id) => removeQuest(activePatient.id, id)}
        />

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
                {[...chapter.items].reverse().map((item) => (
                  <StoryItemCard
                    key={item.id}
                    item={item}
                    onRemove={item.kind === 'life' ? () => removeLifeEvent(activePatient.id, item.id) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print/export view — nothing computed here beyond the same chapter
          grouping already used above; reads oldest-first, like a book,
          rather than newest-first like the scanning-friendly screen view. */}
      <PrintableStory name={activePatient.name} chapters={chapters} />

      <style>{`
        .story-print-only { display: none; }
        @media print {
          .story-screen-only, header, nav, aside, footer { display: none !important; }
          .story-print-only { display: block !important; }
        }
      `}</style>
    </>
  )
}

function PrintableStory({ name, chapters }: { name: string; chapters: LifeChapter[] }) {
  return (
    <div className="story-print-only px-8 py-10 text-neutral-900" style={{ fontFamily: 'Georgia, serif' }}>
      <h1 className="text-3xl font-bold">{name}'s Story</h1>
      <p className="mb-8 text-sm text-neutral-500">Written in {name.split(' ')[0]}'s own words · generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      {chapters.length === 0 && <p>No chapters written yet.</p>}
      {chapters.map((chapter) => (
        <section key={chapter.name} className="mb-8 break-inside-avoid-page">
          <h2 className="mb-1 text-xl font-bold">
            {chapter.name} <span className="font-normal text-neutral-500">— Age {chapter.ageRange}</span>
          </h2>
          <hr className="mb-3 border-neutral-300" />
          {chapter.items.map((item) => (
            <article key={item.id} className="mb-4 break-inside-avoid-page">
              <p className="text-xs text-neutral-500">
                {new Date(item.at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {item.kind === 'health' ? ' · Health record' : ` · ${item.domains.map((d) => DOMAIN_LABEL[d]).join(', ')}`}
              </p>
              <h3 className="text-base font-bold">{item.title}</h3>
              {item.note && <p className="text-sm leading-relaxed">{item.note}</p>}
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}

// Quests: self-set goals, not algorithm-assigned tasks. Progress is a number
// the user updates themselves — never inferred from other data, for the
// same reason a LifeEvent's impact is self-rated: only the person living it
// can say how far along a relationship, a skill, or a habit really is.
function QuestBoard({
  quests,
  onAdd,
  onProgress,
  onStatus,
  onRemove,
}: {
  quests: Quest[]
  onAdd: (q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'progressCurrent'>) => void
  onProgress: (id: string, n: number) => void
  onStatus: (id: string, s: Quest['status']) => void
  onRemove: (id: string) => void
}) {
  const active = quests.filter((q) => q.status === 'active')
  const done = quests.filter((q) => q.status === 'done')
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <SectionTitle
        icon={<span className="text-lg">🗺️</span>}
        title="Quests"
        subtitle="Goals you set for yourself — progress you update, not a score anyone computes for you"
        right={
          <Button variant="ghost" onClick={() => setShowForm((s) => !s)} className="!min-h-0 !px-2 !py-1 text-xs">
            {showForm ? 'Cancel' : '+ New quest'}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-4">
          <NewQuestForm
            onAdd={(q) => {
              onAdd(q)
              setShowForm(false)
            }}
          />
        </div>
      )}

      {active.length === 0 && !showForm && (
        <p className="text-sm text-neutral-500">No active quests yet — set one for something that matters to you.</p>
      )}

      <div className="space-y-2">
        {active.map((q) => (
          <QuestRow key={q.id} quest={q} onProgress={(n) => onProgress(q.id, n)} onStatus={(s) => onStatus(q.id, s)} onRemove={() => onRemove(q.id)} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Completed</p>
          <div className="space-y-2">
            {done.map((q) => (
              <QuestRow key={q.id} quest={q} onProgress={(n) => onProgress(q.id, n)} onStatus={(s) => onStatus(q.id, s)} onRemove={() => onRemove(q.id)} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function QuestRow({
  quest,
  onProgress,
  onStatus,
  onRemove,
}: {
  quest: Quest
  onProgress: (n: number) => void
  onStatus: (s: Quest['status']) => void
  onRemove: () => void
}) {
  const pct = Math.min(100, Math.round((quest.progressCurrent / quest.progressTarget) * 100))
  const domainMeta = LIFE_DOMAINS.find((d) => d.key === quest.domain)

  return (
    <div className={`rounded-xl border p-3 ${quest.status === 'done' ? 'border-brand/30 bg-brand-50/30' : 'border-neutral-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs">
            {domainMeta?.emoji} {domainMeta?.label}
          </span>
          <h4 className="font-bold text-ink">{quest.title}</h4>
          <p className="text-xs text-neutral-500">{quest.targetNote}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {quest.status === 'done' && <Badge tone="normal">Done ✓</Badge>}
          <button type="button" onClick={onRemove} className="text-xs text-neutral-400 hover:text-accent">
            Remove
          </button>
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-500">
          {quest.progressCurrent} / {quest.progressTarget} {quest.unit}
        </span>
        {quest.status !== 'abandoned' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onProgress(quest.progressCurrent - 1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-neutral-200 text-sm font-bold text-neutral-600"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onProgress(quest.progressCurrent + 1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-neutral-200 text-sm font-bold text-neutral-600"
            >
              +
            </button>
            {quest.status === 'active' && (
              <button type="button" onClick={() => onStatus('abandoned')} className="ml-1 text-xs text-neutral-400 hover:text-accent">
                Let it go
              </button>
            )}
          </div>
        )}
        {quest.status === 'abandoned' && <span className="text-xs text-neutral-400">Let go</span>}
      </div>
    </div>
  )
}

function NewQuestForm({ onAdd }: { onAdd: (q: Omit<Quest, 'id' | 'createdAt' | 'status' | 'progressCurrent'>) => void }) {
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<LifeDomain>('purpose')
  const [targetNote, setTargetNote] = useState('')
  const [progressTarget, setProgressTarget] = useState('1')
  const [unit, setUnit] = useState('done')

  function submit() {
    const target = Number(progressTarget)
    if (!title.trim() || !targetNote.trim() || !(target > 0)) return
    onAdd({ title: title.trim(), domain, targetNote: targetNote.trim(), progressTarget: target, unit: unit.trim() || 'done' })
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 p-3">
      <Field label="What do you want to work toward?">
        <input
          className={inputClass}
          placeholder="e.g. Rebuild a friendship, Finish a certification, Run a 10k"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="What does 'done' look like, in your own words?">
        <input
          className={inputClass}
          placeholder="e.g. We talk again without it being awkward"
          value={targetNote}
          onChange={(e) => setTargetNote(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Field label="Which part of life?">
          <select className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value as LifeDomain)}>
            {LIFE_DOMAINS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.emoji} {d.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        <Field label="Target number">
          <input className={inputClass} type="number" min={1} value={progressTarget} onChange={(e) => setProgressTarget(e.target.value)} />
        </Field>
        <Field label="Unit">
          <input className={inputClass} placeholder="sessions, days, done…" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
      </div>
      <Button onClick={submit} className="w-full">
        <IconPlus size={16} /> Start this quest
      </Button>
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

const HEALTH_STATUS_TONE: Record<NonNullable<StoryItem['healthStatus']>, 'normal' | 'high' | 'brand'> = {
  started: 'brand',
  blocked: 'high',
  completed: 'normal',
}
const HEALTH_STATUS_LABEL: Record<NonNullable<StoryItem['healthStatus']>, string> = {
  started: 'Care started',
  blocked: 'Care blocked',
  completed: 'Care completed',
}

// Renders both threads of the same story: a self-logged life moment (its
// own words, self-rated impact) and a real Care Episode moment (real
// timestamp, real status) — visually distinct so it's always clear which
// is which, but on one shared timeline.
function StoryItemCard({ item, onRemove }: { item: StoryItem; onRemove?: () => void }) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {item.kind === 'health' ? (
              <span className="text-xs">🏥 Health record</span>
            ) : (
              item.domains.map((d) => (
                <span key={d} className="text-xs">
                  {DOMAIN_EMOJI[d]} {DOMAIN_LABEL[d]}
                </span>
              ))
            )}
          </div>
          <h4 className="font-bold text-ink">{item.title}</h4>
          {item.note && <p className="mt-1 text-sm text-neutral-600">{item.note}</p>}
          <p className="mt-1.5 text-xs text-neutral-400">{new Date(item.at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {item.kind === 'life' && item.impact && <Badge tone={IMPACT_TONE[item.impact]}>{IMPACT_LABEL[item.impact]}</Badge>}
          {item.kind === 'health' && item.healthStatus && (
            <Badge tone={HEALTH_STATUS_TONE[item.healthStatus]}>{HEALTH_STATUS_LABEL[item.healthStatus]}</Badge>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} className="text-xs text-neutral-400 hover:text-accent">
              Remove
            </button>
          )}
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
