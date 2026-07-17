// Gene information via MyGene.info — the free, key-free gene-annotation API
// (Su Lab / Scripps Research; backed by NCBI Entrez, Ensembl & UniProt data).
// Powers a "look up a gene" feature for the longevity/precision-health
// audience: what a gene does, its aliases, and where it sits in the genome.
// Educational reference only — not a substitute for genetic counseling.

const QUERY_BASE = 'https://mygene.info/v3/query'
const GENE_BASE = 'https://mygene.info/v3/gene'

export interface GeneInfo {
  symbol: string
  name: string
  summary: string
  aliases: string[]
  type: string
  chromosome: string
  location: string
  entrezId: string
  ensemblId: string
}

interface QueryHit { _id: string; symbol?: string; name?: string; score?: number }
interface QueryResp { hits?: QueryHit[] }

interface GeneDoc {
  symbol?: string
  name?: string
  summary?: string
  alias?: string | string[]
  type_of_gene?: string
  genomic_pos?: { chr?: string; start?: number; end?: number } | { chr?: string; start?: number; end?: number }[]
  entrezgene?: number | string
  ensembl?: { gene?: string } | { gene?: string }[]
}

const clip = (s: string, n = 1400) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)
const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v])

export async function lookupGene(query: string): Promise<GeneInfo | null> {
  const q = query.trim()
  if (!q) return null

  // Step 1: resolve a human gene symbol/alias/name to a MyGene document ID.
  const searchUrl = `${QUERY_BASE}?q=${encodeURIComponent(`symbol:${q} OR alias:${q} OR name:${q}`)}&species=human&size=1`
  const sres = await fetch(searchUrl, { headers: { Accept: 'application/json' } })
  if (!sres.ok) throw new Error(`mygene_search_${sres.status}`)
  const sjson = (await sres.json()) as QueryResp
  const hit = sjson.hits?.[0]
  if (!hit) return null

  // Step 2: fetch the full annotation for that gene ID.
  const fields = 'symbol,name,summary,alias,type_of_gene,genomic_pos,entrezgene,ensembl.gene'
  const gres = await fetch(`${GENE_BASE}/${hit._id}?fields=${fields}`, { headers: { Accept: 'application/json' } })
  if (!gres.ok) throw new Error(`mygene_gene_${gres.status}`)
  const doc = (await gres.json()) as GeneDoc

  const pos = asArray(doc.genomic_pos)[0]
  const ensembl = asArray(doc.ensembl)[0]

  return {
    symbol: doc.symbol || q.toUpperCase(),
    name: doc.name || '',
    summary: clip(doc.summary || ''),
    aliases: asArray(doc.alias),
    type: (doc.type_of_gene || '').replace(/_/g, ' '),
    chromosome: pos?.chr ? `Chromosome ${pos.chr}` : '',
    location: pos?.start && pos?.end ? `${pos.start.toLocaleString()}–${pos.end.toLocaleString()}` : '',
    entrezId: doc.entrezgene != null ? String(doc.entrezgene) : '',
    ensemblId: ensembl?.gene || '',
  }
}
