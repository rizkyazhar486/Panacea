import { api, type IcdEntry } from './api'
import { cariStrukturAtlas, type StrukturAtlasCari } from './anatomyStructureSearch'

// Feature Factory candidate ff-medical-education-search bridges exactly the four
// sources registered for the "medical-education" domain: pubmed-ncbi-eutils,
// who-icd11, and the already-ingested z-anatomy / nih-3d local atlas (searched
// through cariStrukturAtlas, never a live call — those two sources are
// build-time-only per their source-registry records). Each source fails
// independently: one source erroring never hides another source's results.

export interface PubmedBridgeArticle {
  pmid: string
  title: string
  authors: string
  journal: string
  year: string
  url: string
}

export interface MedicalEducationBridgeResult {
  query: string
  anatomy: { items: StrukturAtlasCari[]; source: 'z-anatomy' | 'nih-3d' }
  icd: { entries: IcdEntry[]; icd11: boolean; error: string | null }
  pubmed: { articles: PubmedBridgeArticle[]; error: string | null }
}

function emptyResult(query: string): MedicalEducationBridgeResult {
  return {
    query,
    anatomy: { items: [], source: 'z-anatomy' },
    icd: { entries: [], icd11: false, error: null },
    pubmed: { articles: [], error: null },
  }
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback
}

export async function searchMedicalEducationBridge(query: string): Promise<MedicalEducationBridgeResult> {
  const q = query.trim()
  if (!q) return emptyResult(q)

  const anatomyItems = cariStrukturAtlas(q, 12)

  const [icdSettled, pubmedSettled] = await Promise.allSettled([api.icdSearch(q), api.searchPubmed(q)])

  const icd = icdSettled.status === 'fulfilled'
    ? { entries: icdSettled.value.results, icd11: icdSettled.value.icd11, error: null }
    : { entries: [], icd11: false, error: errorMessage(icdSettled.reason, 'icd_unavailable') }

  const pubmed = pubmedSettled.status === 'fulfilled'
    ? { articles: pubmedSettled.value.articles, error: pubmedSettled.value.error ?? null }
    : { articles: [], error: errorMessage(pubmedSettled.reason, 'pubmed_unavailable') }

  return {
    query: q,
    anatomy: { items: anatomyItems, source: 'z-anatomy' },
    icd,
    pubmed,
  }
}
