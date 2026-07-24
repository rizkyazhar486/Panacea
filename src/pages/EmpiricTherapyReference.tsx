import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconPill } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Empiric Therapy Reference — a searchable, curated quick-reference of
// first-line drug CLASSES for common diagnoses, drawn from widely-published
// treatment guidelines (not a prescribing engine, not patient-specific, and
// deliberately does NOT give doses — always individualize for allergies,
// renal/hepatic function, pregnancy, local resistance patterns, and your
// institution's formulary/antibiogram before prescribing).
// ─────────────────────────────────────────────────────────────────────────────

interface Entry {
  diagnosis: string
  firstLine: string
  notes: string
  category: string
}

const ENTRIES: Entry[] = [
  { diagnosis: 'Community-acquired pneumonia (outpatient, healthy)', firstLine: 'Amoxicillin or a macrolide (or doxycycline)', notes: 'Respiratory fluoroquinolone or beta-lactam+macrolide if comorbidities present', category: 'Infectious — Respiratory' },
  { diagnosis: 'Community-acquired pneumonia (inpatient, non-ICU)', firstLine: 'Beta-lactam (e.g. ceftriaxone) + macrolide, or respiratory fluoroquinolone', notes: 'Escalate per local antibiogram and severity scoring (e.g. CURB-65)', category: 'Infectious — Respiratory' },
  { diagnosis: 'Acute uncomplicated cystitis', firstLine: 'Nitrofurantoin, TMP-SMX, or fosfomycin (per local resistance)', notes: 'Avoid fluoroquinolones as first-line for uncomplicated cystitis', category: 'Infectious — Urinary' },
  { diagnosis: 'Pyelonephritis (outpatient)', firstLine: 'Fluoroquinolone or TMP-SMX (per susceptibility)', notes: 'Consider one dose of a long-acting parenteral agent first in high resistance areas', category: 'Infectious — Urinary' },
  { diagnosis: 'Cellulitis (non-purulent)', firstLine: 'Beta-lactam (e.g. cephalexin) targeting Strep', notes: 'Add MRSA coverage if purulent/abscess or risk factors present', category: 'Infectious — Skin/Soft Tissue' },
  { diagnosis: 'Cellulitis with purulence / suspected MRSA', firstLine: 'TMP-SMX, doxycycline, or clindamycin', notes: 'Incision & drainage remains primary therapy for abscesses', category: 'Infectious — Skin/Soft Tissue' },
  { diagnosis: 'Acute otitis media (pediatric)', firstLine: 'Amoxicillin (high dose)', notes: 'Amoxicillin-clavulanate if recent beta-lactam exposure or treatment failure', category: 'Infectious — ENT' },
  { diagnosis: 'Acute bacterial sinusitis', firstLine: 'Amoxicillin-clavulanate', notes: 'Most sinusitis is viral — reserve antibiotics for persistent/severe/worsening symptoms', category: 'Infectious — ENT' },
  { diagnosis: 'Streptococcal pharyngitis (confirmed)', firstLine: 'Penicillin V or amoxicillin', notes: 'Cephalexin or azithromycin if penicillin-allergic', category: 'Infectious — ENT' },
  { diagnosis: 'H. pylori eradication', firstLine: 'PPI + amoxicillin + clarithromycin (if local clarithromycin resistance <15%)', notes: 'Bismuth quadruple therapy if resistance is high or prior macrolide exposure', category: 'Infectious — GI' },
  { diagnosis: 'Hypertension (no compelling comorbidity)', firstLine: 'Thiazide diuretic, ACE-I/ARB, or long-acting CCB', notes: 'Choice guided by comorbidities (e.g. ACE-I/ARB preferred in diabetes/CKD with proteinuria)', category: 'Cardiovascular' },
  { diagnosis: 'Type 2 diabetes (initial)', firstLine: 'Metformin + lifestyle modification', notes: 'Add GLP-1 RA/SGLT2i early if established ASCVD, CKD, or heart failure', category: 'Endocrine' },
  { diagnosis: 'Atrial fibrillation (rate control)', firstLine: 'Beta-blocker or non-dihydropyridine CCB', notes: 'Assess stroke risk (CHA2DS2-VASc) for anticoagulation separately', category: 'Cardiovascular' },
  { diagnosis: 'Major depressive disorder (initial)', firstLine: 'SSRI (e.g. sertraline, escitalopram)', notes: 'Consider psychotherapy in combination; reassess at 4-6 weeks', category: 'Psychiatric' },
  { diagnosis: 'Generalized anxiety disorder', firstLine: 'SSRI or SNRI', notes: 'Avoid long-term benzodiazepine monotherapy; CBT is an effective first-line alternative', category: 'Psychiatric' },
  { diagnosis: 'Acute gout flare', firstLine: 'NSAID, colchicine, or corticosteroid (per renal function/comorbidity)', notes: 'Do not start urate-lowering therapy during an acute flare', category: 'Rheumatologic' },
  { diagnosis: 'Migraine (acute, moderate-severe)', firstLine: 'Triptan ± NSAID', notes: 'Consider antiemetic for associated nausea; evaluate for preventive therapy if frequent', category: 'Neurologic' },
  { diagnosis: 'GERD', firstLine: 'PPI trial (4-8 weeks) + lifestyle modification', notes: 'Evaluate for alarm features before empiric long-term therapy', category: 'GI' },
  { diagnosis: 'Asthma (persistent, mild)', firstLine: 'Low-dose ICS-formoterol (as-needed or maintenance)', notes: 'Step up per GINA/NAEPP guidelines based on control', category: 'Respiratory' },
  { diagnosis: 'Allergic rhinitis', firstLine: 'Intranasal corticosteroid ± second-generation oral antihistamine', notes: 'Combination often more effective than either alone for moderate-severe symptoms', category: 'Allergy/Immunology' },
]

const CATEGORIES = Array.from(new Set(ENTRIES.map((e) => e.category)))

export function EmpiricTherapyReference() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return ENTRIES.filter((e) => {
      if (category && e.category !== category) return false
      if (!q) return true
      return `${e.diagnosis} ${e.firstLine} ${e.notes} ${e.category}`.toLowerCase().includes(q)
    })
  }, [query, category])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconPill size={20} />} title="Empiric Therapy Reference" subtitle="First-line drug classes by diagnosis — a curated quick reference" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          Educational reference of commonly-published first-line drug <b>classes</b> only — deliberately
          no doses. Always individualize for allergies, renal/hepatic function, pregnancy, local
          resistance/antibiogram, and drug interactions before prescribing.
        </p>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Search diagnosis (e.g. pneumonia, hypertension, UTI)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setCategory(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!category ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${category === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{c}</button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((e) => (
          <Card key={e.diagnosis} className="!p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[14px] font-bold text-ink dark:text-white">{e.diagnosis}</div>
              <Badge tone="neutral">{e.category}</Badge>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-brand-dark">{e.firstLine}</div>
            <div className="mt-1 text-[12px] text-neutral-500">{e.notes}</div>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-[13px] text-neutral-400">No matches — try a different search term.</p>}
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        A study/reference aid summarizing commonly-published guideline first-line choices — not a
        substitute for current full guideline text, an antibiogram, or clinical/pharmacist judgment.
        Not a prescription and contains no dosing.
      </div>
    </div>
  )
}

export default EmpiricTherapyReference
