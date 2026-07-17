// Live journal retrieval via NCBI E-utilities — PubMed's free public API.
// No API key required (an optional NCBI_API_KEY only raises the rate limit).
// Two calls: esearch (query → PMIDs) then esummary (PMIDs → article metadata).
// This lets the Clinical Evidence page cite REAL, currently-indexed papers
// instead of relying on model recall. Not testable from the sandbox (outbound
// to eutils is blocked here) — verify the JSON shape on first deploy.

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const API_KEY = process.env.NCBI_API_KEY || ''

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

// Retrieve the most relevant recent PubMed articles for a free-text query.
export async function searchPubmed(query: string, retmax = 6): Promise<PubmedArticle[]> {
  const q = query.trim()
  if (!q) return []

  // 1) esearch → PMIDs, sorted by relevance.
  const searchUrl = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(q)}${keyParam()}`
  const sRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } })
  if (!sRes.ok) throw new Error(`esearch_${sRes.status}`)
  const sJson = (await sRes.json()) as EsearchResp
  const ids = sJson.esearchresult?.idlist ?? []
  if (!ids.length) return []

  // 2) esummary → metadata for those PMIDs.
  const sumUrl = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}${keyParam()}`
  const mRes = await fetch(sumUrl, { headers: { Accept: 'application/json' } })
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
    .filter((a) => a.pmid)
}
