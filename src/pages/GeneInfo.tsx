import { useState } from 'react'
import { Card, SectionTitle, inputClass, Button, Badge } from '../components/ui'
import { IconStethoscope, IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Gene Info — look up a human gene and see what it does, its aliases, and its
// genomic location, sourced from MyGene.info (free, key-free; backed by NCBI
// Entrez, Ensembl & UniProt). Educational reference for the longevity /
// precision-health audience — not a substitute for genetic counseling or
// clinical genetic testing interpretation.
// ─────────────────────────────────────────────────────────────────────────────

interface Gene { symbol: string; name: string; summary: string; aliases: string[]; type: string; chromosome: string; location: string; entrezId: string; ensemblId: string }
const EXAMPLES = ['APOE', 'FOXO3', 'BRCA1', 'MTHFR', 'TP53', 'SIRT1']

export function GeneInfo() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [gene, setGene] = useState<Gene | null | undefined>(undefined)

  async function search(name?: string) {
    const text = (name ?? q).trim()
    if (!text) return
    if (name) setQ(name)
    setLoading(true); setErr(''); setGene(undefined)
    try {
      const r = await api.lookupGene(text)
      setGene(r.gene)
      if (r.error) setErr('The gene database is temporarily unavailable — try again shortly.')
    } catch {
      setErr('Could not reach the gene database. Please try again later.')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Gene Info" subtitle="Look up a human gene — function, aliases & genomic location" />
        {!backendEnabled && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Live lookup needs the backend.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search() }} placeholder="Gene symbol or name — e.g. APOE" />
          <Button onClick={() => search()} disabled={loading || !q.trim()}>{loading ? '…' : 'Search'}</Button>
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}
        {gene === undefined && !loading && !err && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => <button key={ex} onClick={() => search(ex)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-brand-50 hover:text-brand-dark dark:bg-white/5 dark:text-neutral-300">{ex}</button>)}
          </div>
        )}
      </Card>

      {loading && <Card className="!p-8 text-center"><span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" /></Card>}

      {gene === null && !loading && (
        <Card className="!p-6 text-center text-sm text-neutral-400">No gene found for that name. Try the official HGNC symbol (e.g. APOE, not "apolipoprotein E").</Card>
      )}

      {gene && (
        <>
          <Card className="!p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black text-ink dark:text-white">{gene.symbol}</span>
              {gene.type && <Badge tone="neutral">{gene.type}</Badge>}
            </div>
            {gene.name && <div className="mt-0.5 text-sm text-neutral-500">{gene.name}</div>}
            {(gene.chromosome || gene.location) && (
              <div className="mt-2 text-[11px] text-neutral-400">
                {gene.chromosome}{gene.chromosome && gene.location ? ' · ' : ''}{gene.location && `bp ${gene.location}`}
              </div>
            )}
            {gene.aliases.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {gene.aliases.slice(0, 8).map((a) => (
                  <span key={a} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-white/5 dark:text-neutral-400">{a}</span>
                ))}
              </div>
            )}
          </Card>
          <Section title="What it does" body={gene.summary} />
          {(gene.entrezId || gene.ensemblId) && (
            <Card className="!p-5">
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">External references</div>
              <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
                {gene.entrezId && (
                  <a className="font-semibold text-brand-dark underline" href={`https://www.ncbi.nlm.nih.gov/gene/${gene.entrezId}`} target="_blank" rel="noreferrer">NCBI Gene {gene.entrezId} →</a>
                )}
                {gene.ensemblId && (
                  <a className="font-semibold text-brand-dark underline" href={`https://www.ensembl.org/id/${gene.ensemblId}`} target="_blank" rel="noreferrer">Ensembl {gene.ensemblId} →</a>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <IconShield size={12} className="mr-1 inline" /> Reference gene function via the free MyGene.info API (NCBI Entrez / Ensembl / UniProt data). This is educational information, not a genetic test result or medical interpretation — discuss any personal genetic testing with a clinician or genetic counselor.
      </div>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null
  return (
    <Card className="!p-5">
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{title}</div>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{body}</p>
    </Card>
  )
}

export default GeneInfo
