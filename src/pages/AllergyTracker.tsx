import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconAlertTriangle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Allergy Tracker — a personal record of known allergies across food, drinks,
// medications, and contact/object triggers (e.g. latex, nickel, cosmetics —
// the kind of exposure that causes dermatitis kontak alergi/DKA). Pure
// client-side notes stored in this browser, not a diagnosis tool — bring this
// list to your clinician, especially before any new prescription or procedure.
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'food' | 'drink' | 'medication' | 'contact'
type Severity = 'mild' | 'moderate' | 'severe'

interface AllergyEntry {
  id: string
  category: Category
  name: string
  reaction: string
  severity: Severity
  notes: string
  dateAdded: string
}

const CATEGORY_LABEL: Record<Category, string> = {
  food: 'Food',
  drink: 'Drink',
  medication: 'Medication',
  contact: 'Object / Contact (DKA)',
}
const CATEGORY_HINT: Record<Category, string> = {
  food: 'e.g. peanuts, shellfish, eggs, cow\'s milk',
  drink: 'e.g. cow\'s milk, alcohol, certain juices',
  medication: 'e.g. penicillin, sulfa drugs, NSAIDs, contrast dye',
  contact: 'e.g. latex, nickel, cosmetics, fragrance — contact/skin allergens (dermatitis kontak alergi)',
}
const SEVERITY_LABEL: Record<Severity, string> = { mild: 'Mild', moderate: 'Moderate', severe: 'Severe / anaphylaxis risk' }
const SEVERITY_TONE: Record<Severity, 'low' | 'normal' | 'critical'> = { mild: 'low', moderate: 'normal', severe: 'critical' }

const LS_KEY = 'pmd_allergy_tracker_v1'
type Log = AllergyEntry[]

function load(): Log {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}
function save(log: Log) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(log)) } catch { /* ignore */ }
}

const emptyDraft = (): Omit<AllergyEntry, 'id' | 'dateAdded'> => ({
  category: 'food',
  name: '',
  reaction: '',
  severity: 'mild',
  notes: '',
})

export function AllergyTracker() {
  const [log, setLog] = useState<Log>(load)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)

  const addOrUpdate = () => {
    if (!draft.name.trim()) return
    setLog((s) => {
      let next: Log
      if (editingId) {
        next = s.map((e) => (e.id === editingId ? { ...e, ...draft } : e))
      } else {
        next = [...s, { id: crypto.randomUUID(), dateAdded: new Date().toISOString(), ...draft }]
      }
      save(next)
      return next
    })
    setDraft(emptyDraft())
    setEditingId(null)
  }

  const startEdit = (entry: AllergyEntry) => {
    setEditingId(entry.id)
    setDraft({ category: entry.category, name: entry.name, reaction: entry.reaction, severity: entry.severity, notes: entry.notes })
  }
  const cancelEdit = () => {
    setEditingId(null)
    setDraft(emptyDraft())
  }
  const remove = (id: string) => {
    setLog((s) => {
      const next = s.filter((e) => e.id !== id)
      save(next)
      return next
    })
    if (editingId === id) cancelEdit()
  }

  const severeCount = useMemo(() => log.filter((e) => e.severity === 'severe').length, [log])
  const byCategory = useMemo(() => {
    const groups: Record<Category, AllergyEntry[]> = { food: [], drink: [], medication: [], contact: [] }
    for (const e of log) groups[e.category].push(e)
    return groups
  }, [log])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconAlertTriangle size={20} />} title="Allergy Tracker" subtitle="Your personal record of food, drink, medication & contact allergies" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Keep a running list of things you're allergic to — food, drinks, medications, and
          contact/object triggers (latex, nickel, cosmetics, and other causes of dermatitis
          kontak alergi). This stays on your device as a personal note; show it to any clinician
          before a new prescription, procedure, or meal you're unsure about.
        </p>
      </Card>

      {severeCount > 0 && (
        <Card className="!p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-red-700 dark:text-red-300">
            <IconAlertTriangle size={16} />
            {severeCount} severe / anaphylaxis-risk {severeCount === 1 ? 'allergy' : 'allergies'} on record
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">Consider carrying an emergency card or medical ID that lists these.</p>
        </Card>
      )}

      <Card className="!p-4">
        <div className="text-[13px] font-black text-ink dark:text-white">{editingId ? 'Edit allergy' : 'Add an allergy'}</div>
        <div className="mt-3 space-y-3">
          <Field label="Category">
            <select className={inputClass} value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}>
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </Field>
          <p className="-mt-1.5 text-[11px] text-neutral-400">{CATEGORY_HINT[draft.category]}</p>

          <Field label="What are you allergic to?">
            <input className={inputClass} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Shrimp, Amoxicillin, Nickel" />
          </Field>

          <Field label="Reaction">
            <input className={inputClass} value={draft.reaction} onChange={(e) => setDraft((d) => ({ ...d, reaction: e.target.value }))} placeholder="e.g. Hives, swelling, itchy rash, difficulty breathing" />
          </Field>

          <Field label="Severity">
            <select className={inputClass} value={draft.severity} onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value as Severity }))}>
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)">
            <textarea className={`${inputClass} min-h-[70px] resize-y`} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Anything else worth remembering — when it started, what helped, cross-reactions, etc." />
          </Field>

          <div className="flex gap-2">
            <button onClick={addOrUpdate} disabled={!draft.name.trim()} className="min-h-[44px] flex-1 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-40">
              {editingId ? 'Save changes' : 'Add allergy'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="min-h-[44px] rounded-xl bg-neutral-100 px-4 text-sm font-bold text-neutral-500 dark:bg-white/10">Cancel</button>
            )}
          </div>
        </div>
      </Card>

      {log.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-[13px] text-neutral-400 dark:border-white/10">
          No allergies logged yet — add your first one above.
        </div>
      )}

      {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => {
        const entries = byCategory[cat]
        if (entries.length === 0) return null
        return (
          <div key={cat} className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{CATEGORY_LABEL[cat]}</div>
            {entries.map((e) => (
              <Card key={e.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-black text-ink dark:text-white">{e.name}</div>
                    {e.reaction && <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">Reaction: {e.reaction}</p>}
                    {e.notes && <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">{e.notes}</p>}
                  </div>
                  <Badge tone={SEVERITY_TONE[e.severity]}>{SEVERITY_LABEL[e.severity]}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => startEdit(e)} className="rounded-xl bg-neutral-100 px-3 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">Edit</button>
                  <button onClick={() => remove(e.id)} className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">Delete</button>
                </div>
              </Card>
            ))}
          </div>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        This is a personal note stored only on this device — it is not a medical diagnosis and
        doesn't sync to your care team automatically. For anything severe, also carry a physical
        medical alert card or bracelet.
      </div>
    </div>
  )
}

export default AllergyTracker
