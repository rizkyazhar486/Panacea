import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconSearch, IconStethoscope } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Trials Finder — connects people to REAL registered studies from
// ClinicalTrials.gov (free public API). This is how the app responsibly
// "accommodates" the regulated frontier-medicine ideas (stem-cell, gene, and
// longevity therapies) from the vision lists: not a fake marketplace, but a
// real gateway to trials people may be eligible to join.
// ─────────────────────────────────────────────────────────────────────────────

interface Trial { nctId: string; title: string; status: string; conditions: string; phase: string; locations: string; url: string }

const EXAMPLES = ['longevity', 'senolytics aging', 'stem cell osteoarthritis', 'type 2 diabetes prevention', 'NAD+ supplementation']

function statusTone(s: string): 'brand' | 'low' | 'neutral' {
  const u = s.toUpperCase()
  if (u.includes('RECRUITING') && !u.includes('NOT')) return 'brand'
  if (u.includes('ACTIVE') || u.includes('ENROLL')) return 'low'
  return 'neutral'
}

export function ClinicalTrials() {
  const [q, setQ] = useState('')
  const [recruiting, setRecruiting] = useState(true)
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [trials, setTrials] = useState<Trial[] | null>(null)

  async function search(term?: string) {
    const text = (term ?? q).trim()
    if (!text) return
    if (term) setQ(term)
    setLoading(true); setErr(''); setTrials(null)
    try {
      const r = await api.searchTrials(text, recruiting, country)
      setTrials(r.trials)
      if (r.error) setErr('The trials service is temporarily unavailable — please try again shortly.')
    } catch {
      setErr('Could not reach the trials database. Please try again later.')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Clinical Trials Finder" subtitle="Search real registered studies worldwide — ClinicalTrials.gov" />
        {!backendEnabled && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Live trial search needs the backend — you can browse directly at clinicaltrials.gov meanwhile.
          </p>
        )}
        <div className="mt-3">
          <textarea value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); search() } }}
            placeholder="Condition, therapy or keyword — e.g. senolytics aging, stem cell knee…"
            className="min-h-[64px] w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <input type="checkbox" checked={recruiting} onChange={(e) => setRecruiting(e.target.checked)} /> Recruiting only
          </label>
          <div className="w-40"><Field label="Country (optional)"><input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Indonesia" /></Field></div>
        </div>
        <Button onClick={() => search()} disabled={loading || !q.trim()} className="mt-3">{loading ? 'Searching…' : '🔎 Search trials'}</Button>
        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}
      </Card>

      {!trials && !loading && (
        <Card className="!p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Try an example</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => search(ex)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 transition hover:bg-brand-50 hover:text-brand-dark dark:bg-white/5 dark:text-neutral-300">{ex}</button>
            ))}
          </div>
        </Card>
      )}

      {loading && <Card className="!p-8 text-center"><span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /><p className="mt-3 text-sm text-neutral-400">Searching ClinicalTrials.gov…</p></Card>}

      {trials && trials.length === 0 && !err && (
        <Card className="!p-6 text-center text-sm text-neutral-400">No matching studies found. Try broader keywords or turn off "recruiting only".</Card>
      )}

      {trials && trials.length > 0 && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{trials.length} studies</div>
          {trials.map((t) => (
            <Card key={t.nctId} className="!p-4">
              <a href={t.url} target="_blank" rel="noreferrer" className="block">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-snug text-ink dark:text-white">{t.title}</h3>
                  <Badge tone={statusTone(t.status)}>{t.status.replace(/_/g, ' ')}</Badge>
                </div>
                {t.conditions && <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{t.conditions}</div>}
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-neutral-400">
                  <span>Phase {t.phase}</span><span>📍 {t.locations}</span><span>{t.nctId}</span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-brand-dark">View on ClinicalTrials.gov ↗</div>
              </a>
            </Card>
          ))}
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <IconSearch size={12} className="mr-1 inline" /> Live results from the public ClinicalTrials.gov registry. Panaceamed doesn't run trials or recommend one — always discuss eligibility, risks, and legitimacy with your doctor before contacting any study, and be wary of clinics selling unproven "stem cell" or "anti-aging" therapies outside registered trials.
      </div>
    </div>
  )
}

export default ClinicalTrials
