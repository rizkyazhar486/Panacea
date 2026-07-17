import { useState } from 'react'
import { Card, SectionTitle, inputClass, Button } from '../components/ui'
import { IconPill, IconShield } from '../components/icons'
import { api } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Drug Info — look up a medicine and see, from its official FDA label, what it's
// for, its warnings, dosing, and adverse reactions (via free openFDA). The
// responsible core of the "pill identifier / interaction checker" idea:
// authoritative label text, not AI guesses. Always defer to the prescriber &
// pharmacist for interactions specific to a person's full medication list.
// ─────────────────────────────────────────────────────────────────────────────

interface Drug { brand: string; generic: string; purpose: string; usage: string; warnings: string; dosage: string; adverse: string; manufacturer: string }
interface RelatedDrug { name: string; tty: string }
const EXAMPLES = ['ibuprofen', 'metformin', 'amoxicillin', 'atorvastatin', 'omeprazole']
const TTY_LABEL: Record<string, string> = { SCD: 'Generic', SBD: 'Brand' }

export function DrugInfo() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [drug, setDrug] = useState<Drug | null | undefined>(undefined)
  const [related, setRelated] = useState<RelatedDrug[]>([])

  async function search(name?: string) {
    const text = (name ?? q).trim()
    if (!text) return
    if (name) setQ(name)
    setLoading(true); setErr(''); setDrug(undefined); setRelated([])
    try {
      const r = await api.lookupDrug(text)
      setDrug(r.drug)
      if (r.error) setErr('The drug database is temporarily unavailable — try again shortly.')
      api.findRelatedDrugs(text).then((rr) => setRelated(rr.drugs)).catch(() => {})
    } catch {
      setErr('Could not reach the drug database. Please try again later.')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconPill size={20} />} title="Drug Info" subtitle="Look up a medicine — purpose, warnings & side effects from official FDA labels" />
        <div className="mt-3 flex gap-2">
          <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search() }} placeholder="Brand or generic name — e.g. ibuprofen" />
          <Button onClick={() => search()} disabled={loading || !q.trim()}>{loading ? '…' : 'Search'}</Button>
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}
        {drug === undefined && !loading && !err && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => <button key={ex} onClick={() => search(ex)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-brand-50 hover:text-brand-dark dark:bg-white/5 dark:text-neutral-300">{ex}</button>)}
          </div>
        )}
      </Card>

      {loading && <Card className="!p-8 text-center"><span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></Card>}

      {drug === null && !loading && (
        <Card className="!p-6 text-center text-sm text-neutral-400">No FDA label found for that name. Try the generic name, or check the spelling.</Card>
      )}

      {drug && (
        <>
          <Card className="!p-5">
            <div className="text-xl font-black text-ink dark:text-white">{drug.brand}</div>
            {drug.generic && <div className="text-sm text-neutral-500">Generic: {drug.generic}</div>}
            {drug.manufacturer && <div className="mt-0.5 text-[11px] text-neutral-400">{drug.manufacturer}</div>}
          </Card>
          <Section title="What it's for" body={drug.purpose || drug.usage} />
          <Section title="Dosage & administration" body={drug.dosage} />
          <Section title="⚠️ Warnings" body={drug.warnings} danger />
          <Section title="Possible side effects" body={drug.adverse} />
          {related.length > 0 && (
            <Card className="!p-5">
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Related brand/generic products</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {related.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
                    {TTY_LABEL[d.tty] && <span className="text-[9px] font-bold uppercase text-brand-dark">{TTY_LABEL[d.tty]}</span>}
                    {d.name}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">Via RxNorm (NIH) — other formulations/brands of the same active ingredient, not a substitute check.</p>
            </Card>
          )}
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <IconShield size={12} className="mr-1 inline" /> Official label text via the free openFDA API (US labels — availability & wording vary by country/brand). This is reference information, not personal medical advice. For interactions with your other medicines and conditions, ask your pharmacist or doctor.
      </div>
    </div>
  )
}

function Section({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  if (!body) return null
  return (
    <Card className="!p-5">
      <div className={'text-xs font-black uppercase tracking-wide ' + (danger ? 'text-rose-600' : 'text-neutral-400')}>{title}</div>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{body}</p>
    </Card>
  )
}

export default DrugInfo
