// Live journal retrieval via NCBI E-utilities — PubMed's free public API.
// No API key required (an optional NCBI_API_KEY only raises the rate limit).
// Two calls: esearch (query → PMIDs) then esummary (PMIDs → article metadata).
// This lets the Clinical Evidence page cite REAL, currently-indexed papers
// instead of relying on model recall. Upstream calls are deliberately bounded
// so malformed or slow searches cannot pin a server worker indefinitely.

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const API_KEY = process.env.NCBI_API_KEY || ''
const EUTILS_TIMEOUT_MS = 8_000
const MAX_QUERY_LENGTH = 240
const MAX_RESULTS = 20

export interface PubmedArticle {
  pmid: string
  title: string
  authors: string
  journal: string
  year: string
  url: string
}

interface EsearchResp { esearchresult?: { idlist?: string[] } }
interface EsummaryDoc {
  uid?: string
  title?: string
  fulljournalname?: string
  source?: string
  pubdate?: string
  authors?: { name?: string }[]
}
interface EsummaryResp { result?: Record<string, EsummaryDoc | string[]> & { uids?: string[] } }

function keyParam(): string { return API_KEY ? `&api_key=${encodeURIComponent(API_KEY)}` : '' }

function boundedLimit(value: number) {
  if (!Number.isFinite(value)) return 6
  return Math.min(MAX_RESULTS, Math.max(1, Math.trunc(value)))
}

// Retrieve the most relevant PubMed articles for a free-text query.
export async function searchPubmed(query: string, retmax = 6): Promise<PubmedArticle[]> {
  const q = query.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH)
  if (!q) return []
  const limit = boundedLimit(retmax)

  // 1) esearch → PMIDs, sorted by relevance.
  const searchUrl = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${limit}&term=${encodeURIComponent(q)}${keyParam()}`
  const sRes = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(EUTILS_TIMEOUT_MS),
  })
  if (!sRes.ok) throw new Error(`esearch_${sRes.status}`)
  const sJson = (await sRes.json()) as EsearchResp
  const ids = (sJson.esearchresult?.idlist ?? []).filter((id) => /^\d+$/.test(id)).slice(0, limit)
  if (!ids.length) return []

  // 2) esummary → metadata for those PMIDs.
  const sumUrl = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}${keyParam()}`
  const mRes = await fetch(sumUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(EUTILS_TIMEOUT_MS),
  })
  if (!mRes.ok) throw new Error(`esummary_${mRes.status}`)
  const mJson = (await mRes.json()) as EsummaryResp
  const result = mJson.result ?? {}

  return ids
    .map((id) => result[id])
    .filter((d): d is EsummaryDoc => !!d && typeof d === 'object' && !Array.isArray(d))
    .map((d) => {
      const authorList = (d.authors ?? []).map((a) => a?.name).filter(Boolean) as string[]
      const authors = authorList.length
        ? authorList.length > 3 ? `${authorList.slice(0, 3).join(', ')}, et al.` : authorList.join(', ')
        : 'Unknown authors'
      const year = (d.pubdate ?? '').split(' ')[0] || ''
      const pmid = d.uid ?? ''
      return {
        pmid,
        title: d.title ?? '(untitled)',
        authors,
        journal: d.fulljournalname ?? d.source ?? '',
        year,
        url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
      }
    })
    .filter((a) => /^\d+$/.test(a.pmid))
}
