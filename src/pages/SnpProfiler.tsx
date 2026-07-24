import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconStethoscope } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Local SNP Longevity Profiler — parses a raw consumer-genotyping export
// (23andMe/AncestryDNA-style tab-separated file: rsid, chromosome, position,
// genotype) entirely client-side and matches it against a small, curated set
// of well-documented longevity/health-associated SNPs. Nothing is uploaded —
// the file never leaves the browser. Plain, fast JS parsing is used rather
// than a WASM module: at the ~1-2M-row size of a real raw DNA file, a single
// pass with a Map lookup completes in well under a second, so WASM would add
// complexity without a measurable benefit here.
//
// IMPORTANT calibration: individual SNPs from consumer arrays typically have
// SMALL individual effect sizes, genotyping arrays (vs. sequencing) can have
// real error rates on specific SNPs, and this is not a clinical genetic test
// or polygenic risk score — it's an educational lookup against literature,
// framed accordingly.
// ─────────────────────────────────────────────────────────────────────────────

interface SnpDef { rsid: string; gene: string; trait: string; interpretation: Record<string, string>; citation: string }

const SNP_DB: SnpDef[] = [
  {
    rsid: 'rs2802292', gene: 'FOXO3', trait: 'Longevity-associated variant',
    interpretation: { GG: 'Carries the G allele associated with longevity in multiple population studies (e.g. Willcox et al. 2008).', GT: 'Carries one copy of the longevity-associated G allele.', TT: 'Does not carry the longevity-associated G allele in this SNP.' },
    citation: 'Willcox BJ et al., PNAS 2008 — FOXO3A genotype and human longevity',
  },
  {
    rsid: 'rs429358', gene: 'APOE', trait: "Alzheimer's / cardiovascular risk (part of the APOE ε2/ε3/ε4 haplotype)",
    interpretation: { TT: 'Does not carry the ε4-defining allele at this position (combine with rs7412 for full APOE genotype — a single SNP alone does not determine your APOE status).', CT: 'Carries one copy of the allele associated with ε4 at this position — combine with rs7412 for the actual APOE genotype.', CC: 'Carries two copies of the allele associated with ε4 at this position — combine with rs7412 for the actual APOE genotype.' },
    citation: 'Multiple GWAS; APOE genotype requires both rs429358 and rs7412 together',
  },
  {
    rsid: 'rs7412', gene: 'APOE', trait: "Alzheimer's / cardiovascular risk (part of the APOE ε2/ε3/ε4 haplotype)",
    interpretation: { CC: 'Common genotype at this position.', CT: 'Carries one copy of the ε2-associated allele at this position.', TT: 'Carries two copies of the ε2-associated allele at this position (rare).' },
    citation: 'Multiple GWAS; APOE genotype requires both rs429358 and rs7412 together',
  },
  {
    rsid: 'rs1801133', gene: 'MTHFR (C677T)', trait: 'Folate metabolism',
    interpretation: { GG: 'Typical MTHFR enzyme activity for this variant.', AG: 'Roughly intermediate enzyme activity — often no clinically significant effect alone.', AA: 'Reduced MTHFR enzyme activity reported in studies — sometimes associated with slightly elevated homocysteine; folate-rich diet is commonly discussed in this context.' },
    citation: 'Frosst P et al., Nat Genet 1995 — MTHFR C677T variant',
  },
  {
    rsid: 'rs4988235', gene: 'MCM6 (near LCT)', trait: 'Lactase persistence (adult milk digestion)',
    interpretation: { TT: 'Genotype associated with lactase persistence (better lactose digestion into adulthood) in populations of European descent.', CT: 'One copy of the persistence-associated allele.', CC: 'Genotype associated with reduced lactase persistence in adulthood in populations of European descent — note this marker\'s relevance varies significantly by ancestry.' },
    citation: 'Enattah NS et al., Nat Genet 2002 — lactase persistence variant',
  },
  {
    rsid: 'rs1042522', gene: 'TP53 (P72R)', trait: 'Cellular stress response / cancer research',
    interpretation: { CC: 'Proline/Proline variant — studied for differences in apoptosis efficiency vs. the Arg variant in various cancer-risk studies, with mixed and population-dependent findings.', CG: 'Heterozygous Pro/Arg.', GG: 'Arginine/Arginine variant.' },
    citation: 'Various TP53 codon 72 polymorphism studies — findings are population-dependent and not conclusive',
  },
  {
    rsid: 'rs1800795', gene: 'IL6', trait: 'Inflammatory response (IL-6 production)',
    interpretation: { GG: 'Associated with higher IL-6 production in some studies — IL-6 is a key inflammatory cytokine studied in "inflammaging."', GC: 'Intermediate.', CC: 'Associated with lower IL-6 production in some studies.' },
    citation: 'Fishman D et al., J Clin Invest 1998 — IL6 promoter polymorphism',
  },
  {
    rsid: 'rs662799', gene: 'APOA5', trait: 'Triglyceride metabolism',
    interpretation: { GG: 'Typical genotype for this variant.', AG: 'One copy of the allele associated with higher triglyceride levels in some studies.', AA: 'Two copies of the allele associated with higher triglyceride levels in some studies.' },
    citation: 'Pennacchio LA et al., Science 2001 — APOA5 and triglycerides',
  },
]

function parseFile(text: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const parts = line.trim().split(/\t|,/)
    if (parts.length < 4) continue
    const [rsid, , , genotype] = parts
    if (rsid && genotype) map.set(rsid.toLowerCase(), genotype.toUpperCase().replace(/[^ACGT]/g, ''))
  }
  return map
}

export function SnpProfiler() {
  const [genotypes, setGenotypes] = useState<Map<string, string> | null>(null)
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const [error, setError] = useState('')

  const onFile = (file: File) => {
    setParsing(true); setError(''); setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const rows = text.split('\n').length
        const map = parseFile(text)
        if (map.size === 0) throw new Error('empty')
        setRowCount(rows)
        setGenotypes(map)
      } catch {
        setError('Could not parse this file — expected a tab/comma-separated raw genotype export (rsid, chromosome, position, genotype).')
        setGenotypes(null)
      } finally {
        setParsing(false)
      }
    }
    reader.onerror = () => { setError('Could not read the file.'); setParsing(false) }
    reader.readAsText(file)
  }

  const matches = useMemo(() => {
    if (!genotypes) return []
    return SNP_DB.map((snp) => {
      const g = genotypes.get(snp.rsid.toLowerCase())
      const normalized = g ? [...g].sort().join('') : undefined
      const interp = normalized
        ? snp.interpretation[normalized] ?? snp.interpretation[g!] ?? Object.entries(snp.interpretation).find(([k]) => [...k].sort().join('') === normalized)?.[1]
        : undefined
      return { snp, genotype: g, interp }
    })
  }, [genotypes])

  const found = matches.filter((m) => m.genotype)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Local SNP Longevity Profiler" subtitle="Parses your raw DNA file entirely in your browser — nothing is uploaded" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Upload a raw genotype export (23andMe, AncestryDNA, or similar — usually a "Download Raw Data"
          option in your account settings). It's matched locally against {SNP_DB.length} well-documented
          research SNPs. <b>The file is processed entirely on your device and is never sent anywhere.</b>
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-amber-700 dark:text-amber-300">
          Individual SNPs from consumer arrays typically have small individual effect sizes, and
          consumer genotyping (unlike clinical sequencing) can have real error rates on specific
          positions. This is an educational literature lookup, not a clinical genetic test or a
          polygenic risk score.
        </p>
      </Card>

      <Card className="!p-5">
        <input
          type="file"
          accept=".txt,.csv,.tsv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
          className="block w-full text-[13px] text-neutral-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
        />
        {parsing && <p className="mt-2 text-[12px] text-neutral-400">Parsing…</p>}
        {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        {genotypes && !error && <p className="mt-2 text-[12px] text-neutral-400">Parsed {rowCount.toLocaleString()} rows from {fileName} — matched {found.length}/{SNP_DB.length} reference SNPs.</p>}
      </Card>

      {found.map(({ snp, genotype, interp }) => (
        <Card key={snp.rsid} className="!p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[15px] font-black text-ink dark:text-white">{snp.gene}</div>
            <Badge tone="brand">{snp.rsid} · {genotype}</Badge>
          </div>
          <div className="text-[12px] text-neutral-400">{snp.trait}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{interp || 'Genotype found but not in our interpretation table for this position.'}</p>
          <p className="mt-1 text-[11px] text-neutral-400">{snp.citation}</p>
        </Card>
      ))}

      {!genotypes && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">What's checked</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SNP_DB.map((s) => <Badge key={s.rsid} tone="neutral">{s.gene} ({s.rsid})</Badge>)}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational research lookup only, sourced from published GWAS literature — not a diagnosis, not
        medical advice, and not a substitute for genetic counseling. Discuss anything concerning
        (especially APOE results) with a genetic counselor, who can interpret it in full clinical context.
      </div>
    </div>
  )
}

export default SnpProfiler
