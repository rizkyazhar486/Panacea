import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Organ Donor Pledge Card — an informational primer on organ/tissue donation
// plus a personal pledge record you can show family (donation decisions are
// only actually honored if your family/next-of-kin know your wishes — this
// is not a legal registry). Pure static content + localStorage, no external
// API, and explicitly framed as "talk to your family," not a legal document.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_organ_donor_v1'

interface Pledge { intend: 'yes' | 'no' | 'undecided'; organs: string[]; name: string; note: string; talkedToFamily: boolean }
function load(): Pledge {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return { intend: 'undecided', organs: [], name: '', note: '', talkedToFamily: false }
}
function persist(p: Pledge) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

const ORGANS = ['Heart', 'Lungs', 'Liver', 'Kidneys', 'Pancreas', 'Corneas / eyes', 'Skin', 'Bone & tissue']

const FAQS = [
  { q: 'Does organ donation affect the medical care I receive?', a: 'No — doctors treating you focus entirely on saving your life first. Donation is only considered after death has been declared by a separate medical team, following strict criteria unrelated to donor status.' },
  { q: 'Can I still have an open-casket funeral?', a: 'Yes. Organ and tissue recovery is done surgically and does not prevent a normal funeral, including an open casket.' },
  { q: 'Is there an age limit?', a: 'There is generally no strict age cutoff — medical suitability at the time of death, not age alone, determines what can be donated.' },
  { q: 'Does my religion allow it?', a: 'Most major world religions support organ donation as an act of charity, though views vary by individual and denomination — if it matters to you, it\'s worth discussing with your own religious leader.' },
  { q: 'Does saying "yes" here actually register me anywhere?', a: 'No. This is a personal record to clarify your own wishes and start the conversation with your family — it is not a legal donor registry. Check your country\'s official donor registration process (in Indonesia, this is coordinated through hospitals and the Ministry of Health) for the legally-recognized route.' },
]

export function OrganDonorCard() {
  const saved = load()
  const [intend, setIntend] = useState<Pledge['intend']>(saved.intend)
  const [organs, setOrgans] = useState<string[]>(saved.organs)
  const [name, setName] = useState(saved.name)
  const [note, setNote] = useState(saved.note)
  const [talkedToFamily, setTalkedToFamily] = useState(saved.talkedToFamily)

  const save = (patch: Partial<Pledge>) => {
    const next = { intend, organs, name, note, talkedToFamily, ...patch }
    persist(next)
  }

  const toggleOrgan = (o: string) => {
    const next = organs.includes(o) ? organs.filter((x) => x !== o) : [...organs, o]
    setOrgans(next)
    save({ organs: next })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Organ Donor Pledge" subtitle="Clarify your wishes, then talk to your family" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A single organ donor can save up to 8 lives, and tissue donation can help dozens more — but
          donation decisions are only actually honored if your family or next-of-kin know your wishes
          at the time. <b>This page is a personal record and conversation-starter, not a legal
          registry</b> — check your country's official donor registration process for the
          legally-recognized route.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Your intention</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {([['yes', 'Yes, I want to donate'], ['no', 'No, I don\'t want to donate'], ['undecided', 'Still deciding']] as [Pledge['intend'], string][]).map(([v, label]) => (
            <button key={v} onClick={() => { setIntend(v); save({ intend: v }) }} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${intend === v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{label}</button>
          ))}
        </div>

        {intend === 'yes' && (
          <>
            <div className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-400">What you're comfortable donating (optional detail)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ORGANS.map((o) => (
                <button key={o} onClick={() => toggleOrgan(o)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${organs.includes(o) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{o}</button>
              ))}
            </div>
          </>
        )}

        <Field label="Your name (for the card below)">
          <input className={`${inputClass} mt-1`} value={name} onChange={(e) => { setName(e.target.value); save({ name: e.target.value }) }} />
        </Field>
        <Field label="Note for your family (optional)">
          <textarea className={`${inputClass} mt-1 min-h-16`} placeholder="Anything you want them to know about your decision" value={note} onChange={(e) => { setNote(e.target.value); save({ note: e.target.value }) }} />
        </Field>
        <label className="mt-3 flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={talkedToFamily} onChange={(e) => { setTalkedToFamily(e.target.checked); save({ talkedToFamily: e.target.checked }) }} className="h-4 w-4 accent-brand" />
          I have actually told my family/next-of-kin about this decision
        </label>
      </Card>

      {intend !== 'undecided' && (
        <Card className="!p-0 overflow-hidden">
          <div
            className={intend === 'yes' ? 'p-5 text-white' : 'p-5'}
            style={intend === 'yes' ? { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' } : undefined}
          >
            <div className="text-xs font-black uppercase tracking-wide opacity-80">Organ Donor Card</div>
            <div className="mt-1 text-lg font-black">{name || 'Your name'}</div>
            <Badge tone={intend === 'yes' ? 'neutral' : 'critical'}>{intend === 'yes' ? '✓ Intends to donate' : 'Does not intend to donate'}</Badge>
            {intend === 'yes' && organs.length > 0 && <p className="mt-2 text-[12px] opacity-90">Comfortable donating: {organs.join(', ')}</p>}
            <p className="mt-2 text-[11px] opacity-80">{talkedToFamily ? 'Family has been informed.' : 'Family has not been told yet — this is the most important next step.'}</p>
          </div>
        </Card>
      )}

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Common questions</div>
        <div className="mt-2 space-y-3">
          {FAQS.map((f) => (
            <div key={f.q}>
              <div className="text-[13px] font-bold text-ink dark:text-white">{f.q}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{f.a}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        This is a personal, private record stored only on your device — it is not a legal donor
        registry and is not sent to any hospital or authority. Register through your country's
        official donor program for your decision to be legally recognized, and make sure your family
        actually knows your wishes.
      </div>
    </div>
  )
}

export default OrganDonorCard
