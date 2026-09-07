// Gene information via MyGene.info — the free, key-free gene-annotation API
// (Su Lab / Scripps Research; backed by NCBI Entrez, Ensembl & UniProt data).
// Powers a "look up a gene" feature for the longevity/precision-health
// audience: what a gene does, its aliases, and where it sits in the genome.
// Educational reference only — not a substitute for genetic counseling.

const QUERY_BASE = 'https://mygene.info/v3/query'
const GENE_BASE = 'https://mygene.info/v3/gene'
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 160
const MAX_ALIASES = 24

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

function cleanQuery(value: string): string {
  return value
    .replace(/[<>\\":(){}\[\]\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

function upstreamInit(): RequestInit {
  return {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }
}

function normalizedAliases(value: string | string[] | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of asArray(value)) {
    const alias = clip(raw.replace(/\s+/g, ' ').trim(), 120)
    if (!alias) continue
    const key = alias.toLocaleLowerCase('en-US')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(alias)
    if (out.length >= MAX_ALIASES) break
  }
  return out
}

function finiteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export async function lookupGene(query: string): Promise<GeneInfo | null> {
  const q = cleanQuery(query)
  if (!q) return null

  // Step 1: resolve a human gene symbol/alias/name to a MyGene document ID.
  // User input is quoted as a literal value so Lucene operators inside the
  // search box cannot alter the intended field-scoped query structure.
  const searchUrl = new URL(QUERY_BASE)
  searchUrl.searchParams.set('q', `symbol:"${q}" OR alias:"${q}" OR name:"${q}"`)
  searchUrl.searchParams.set('species', 'human')
  searchUrl.searchParams.set('size', '1')
  const sres = await fetch(searchUrl, upstreamInit())
  if (!sres.ok) throw new Error(`mygene_search_${sres.status}`)
  const sjson = (await sres.json()) as QueryResp
  const hit = sjson.hits?.[0]
  if (!hit) return null

  const hitId = hit._id?.trim() ?? ''
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(hitId)) return null

  // Step 2: fetch the full annotation for that gene ID.
  const fields = 'symbol,name,summary,alias,type_of_gene,genomic_pos,entrezgene,ensembl.gene'
  const geneUrl = new URL(`${GENE_BASE}/${encodeURIComponent(hitId)}`)
  geneUrl.searchParams.set('fields', fields)
  const gres = await fetch(geneUrl, upstreamInit())
  if (!gres.ok) throw new Error(`mygene_gene_${gres.status}`)
  const doc = (await gres.json()) as GeneDoc

  const pos = asArray(doc.genomic_pos)[0]
  const ensembl = asArray(doc.ensembl)[0]
  const start = pos?.start
  const end = pos?.end
  const hasCoordinates = finiteCoordinate(start) && finiteCoordinate(end)

  return {
    symbol: doc.symbol || q.toUpperCase(),
    name: doc.name || '',
    summary: clip(doc.summary || ''),
    aliases: normalizedAliases(doc.alias),
    type: (doc.type_of_gene || '').replace(/_/g, ' '),
    chromosome: pos?.chr ? `Chromosome ${pos.chr}` : '',
    location: hasCoordinates ? `${start.toLocaleString('en-US')}–${end.toLocaleString('en-US')}` : '',
    entrezId: doc.entrezgene != null ? String(doc.entrezgene) : '',
    ensemblId: ensembl?.gene || '',
  }
}
