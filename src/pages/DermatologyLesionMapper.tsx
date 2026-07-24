import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Dermatology Status & Lesion Predilection Mapper — a structured teaching
// tool that cross-references morphology + body-site predilection against a
// curated table of classic dermatology teaching associations, the same way
// a textbook differential table works. Deliberately NOT an image-based "AI
// diagnosis" — a photo cannot be reliably triaged for malignancy or a precise
// diagnosis by a hobby-grade model, and presenting one as if it could would
// be actively unsafe. This tool instead documents exam findings in a
// structured way and surfaces a differential to consider, always ending in
// "correlate clinically / biopsy if uncertain."
// ─────────────────────────────────────────────────────────────────────────────

const MORPHOLOGIES = ['Macule', 'Papule', 'Plaque', 'Vesicle/Bulla', 'Pustule', 'Nodule', 'Wheal', 'Scale/Crust', 'Ulcer'] as const
type Morphology = typeof MORPHOLOGIES[number]

const SITES = ['Face (central)', 'Face (periorbital)', 'Scalp', 'Trunk (central)', 'Trunk (peripheral)', 'Extensor surfaces (elbows/knees)', 'Flexor surfaces (antecubital/popliteal)', 'Palms/Soles', 'Intertriginous (groin/axilla)', 'Nails', 'Mucosa/Oral'] as const
type Site = typeof SITES[number]

interface Assoc { morphology: Morphology; site: Site; differential: string[] }

const TABLE: Assoc[] = [
  { morphology: 'Papule', site: 'Face (central)', differential: ['Acne vulgaris', 'Rosacea', 'Sebaceous hyperplasia', 'Molluscum contagiosum'] },
  { morphology: 'Plaque', site: 'Extensor surfaces (elbows/knees)', differential: ['Psoriasis vulgaris', 'Discoid lupus erythematosus'] },
  { morphology: 'Plaque', site: 'Flexor surfaces (antecubital/popliteal)', differential: ['Atopic dermatitis', 'Lichen simplex chronicus'] },
  { morphology: 'Vesicle/Bulla', site: 'Trunk (central)', differential: ['Varicella', 'Bullous pemphigoid', 'Herpes zoster (dermatomal)'] },
  { morphology: 'Vesicle/Bulla', site: 'Mucosa/Oral', differential: ['Pemphigus vulgaris', 'Herpes simplex', 'Erythema multiforme / Stevens-Johnson spectrum (urgent)'] },
  { morphology: 'Pustule', site: 'Face (central)', differential: ['Acne vulgaris', 'Rosacea', 'Folliculitis'] },
  { morphology: 'Pustule', site: 'Palms/Soles', differential: ['Palmoplantar pustulosis', 'Pustular psoriasis'] },
  { morphology: 'Wheal', site: 'Trunk (peripheral)', differential: ['Acute urticaria', 'Urticarial vasculitis if lesions persist >24h (biopsy)'] },
  { morphology: 'Scale/Crust', site: 'Scalp', differential: ['Seborrheic dermatitis', 'Tinea capitis', 'Psoriasis'] },
  { morphology: 'Macule', site: 'Trunk (central)', differential: ['Pityriasis rosea (herald patch + Christmas-tree pattern)', 'Tinea versicolor', 'Drug eruption'] },
  { morphology: 'Nodule', site: 'Face (central)', differential: ['Basal cell carcinoma (pearly, telangiectatic)', 'Epidermal inclusion cyst'] },
  { morphology: 'Ulcer', site: 'Extensor surfaces (elbows/knees)', differential: ['Pyoderma gangrenosum', 'Venous/arterial ulcer (if lower extremity)'] },
  { morphology: 'Papule', site: 'Intertriginous (groin/axilla)', differential: ['Candidal intertrigo', 'Hidradenitis suppurativa (if recurrent nodules/sinus tracts)'] },
  { morphology: 'Plaque', site: 'Scalp', differential: ['Psoriasis', 'Seborrheic dermatitis', 'Tinea capitis'] },
  { morphology: 'Macule', site: 'Face (periorbital)', differential: ['Melasma', 'Allergic contact dermatitis', 'Dermatomyositis (heliotrope, if violaceous)'] },
]

const ABCDE = [
  { k: 'A — Asymmetry', v: 'One half unlike the other' },
  { k: 'B — Border', v: 'Irregular, notched, or poorly defined' },
  { k: 'C — Color', v: 'Varied within one lesion (black, brown, red, white, blue)' },
  { k: 'D — Diameter', v: 'Greater than 6mm (pencil-eraser size)' },
  { k: 'E — Evolving', v: 'Any change in size, shape, color, or symptoms' },
]

function findMatches(morphology: Morphology | null, site: Site | null): Assoc[] {
  if (!morphology && !site) return []
  return TABLE.filter((a) => (!morphology || a.morphology === morphology) && (!site || a.site === site))
}

export function DermatologyLesionMapper() {
  const [morphology, setMorphology] = useState<Morphology | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [distribution, setDistribution] = useState('')
  const [notes, setNotes] = useState('')

  const matches = useMemo(() => findMatches(morphology, site), [morphology, site])

  const summary = `Dermatologic exam: primary morphology ${morphology ?? '—'}, predilection site ${site ?? '—'}${distribution ? `, distribution: ${distribution}` : ''}${notes ? `. Notes: ${notes}` : ''}.${matches.length ? ` Differential to consider: ${matches.flatMap((m) => m.differential).slice(0, 6).join(', ')}.` : ''} Correlate clinically; biopsy if diagnosis uncertain or malignancy suspected.`

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Dermatologic Status & Lesion Predilection Mapper" subtitle="Structured exam documentation + a classic morphology/site differential — not photo-based diagnosis" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          This tool does not analyze photos or diagnose from images — a consumer-grade model cannot
          reliably rule out malignancy or give a precise diagnosis from a picture, and pretending
          otherwise would be unsafe. Instead it documents your exam findings in a structured way and
          surfaces the classic differential dermatology teaching associates with that morphology + site,
          the same way a textbook table works. Always correlate clinically and biopsy/refer if uncertain.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Primary morphology</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MORPHOLOGIES.map((m) => (
            <button key={m} onClick={() => setMorphology(morphology === m ? null : m)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${morphology === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{m}</button>
          ))}
        </div>

        <div className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-400">Predilection site</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SITES.map((s) => (
            <button key={s} onClick={() => setSite(site === s ? null : s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${site === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="text-[11px] font-bold text-neutral-500">Distribution pattern (free text)
            <input className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" value={distribution} onChange={(e) => setDistribution(e.target.value)} placeholder="e.g. symmetric, dermatomal, photodistributed" />
          </label>
          <label className="text-[11px] font-bold text-neutral-500">Additional notes
            <textarea className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="color, pruritus, duration, associated symptoms…" />
          </label>
        </div>
      </Card>

      {(morphology || site) && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Differential to consider</div>
          {matches.length > 0 ? (
            <div className="mt-3 space-y-3">
              {matches.map((m, i) => (
                <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-[12px]"><Badge tone="neutral">{m.morphology}</Badge><Badge tone="neutral">{m.site}</Badge></div>
                  <div className="mt-1.5 text-[13px] font-semibold text-ink dark:text-white">{m.differential.join(' · ')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-neutral-400">No curated teaching association for this exact combination — select just morphology or just site for broader matches, or use your standard differential-diagnosis approach.</p>
          )}
          <div className="mt-3"><CopyNote text={summary} /></div>
        </Card>
      )}

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">ABCDE — Pigmented Lesion Red Flags</div>
        <div className="mt-3 space-y-2">
          {ABCDE.map((r) => (
            <div key={r.k} className="flex justify-between text-[13px]"><span className="font-bold text-ink dark:text-white">{r.k}</span><span className="text-neutral-500 text-right">{r.v}</span></div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">Any pigmented lesion meeting ABCDE criteria, or the "ugly duckling" sign (looks different from the patient's other moles), warrants dermatology referral/biopsy — not something this tool, or any photo, should be used to rule out.</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        A structured exam-documentation and teaching-differential aid, not a diagnostic tool. Any
        concerning, changing, or non-healing lesion should be evaluated in person by a clinician —
        biopsy remains the gold standard for diagnosis.
      </div>
    </div>
  )
}

export default DermatologyLesionMapper
