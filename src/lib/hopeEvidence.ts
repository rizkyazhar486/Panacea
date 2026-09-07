import { apiBaseUrl } from './api'
import type { HopeDomainKey } from './hopeStack'

export type HopeEvidenceClass = 'documented' | 'derived' | 'modeled' | 'educational' | 'unknown'
export type HopeEvidenceSource = 'PubMed' | 'ClinicalTrials.gov'

export interface HopeEvidenceProvenance {
  source: HopeEvidenceSource
  evidenceClass: HopeEvidenceClass
  fetchedAt: string
  query: string
  endpoint: '/api/evidence/pubmed' | '/api/trials'
  provenanceId: string
}

export interface HopePubmedArticle {
  pmid: string
  title: string
  authors: string
  journal: string
  year: string
  url: string
}

export interface HopeTrial {
  nctId: string
  title: string
  status: string
  conditions: string
  phase: string
  locations: string
  url: string
}

export interface HopeEvidenceBundle {
  domain: HopeDomainKey
  query: string
  articles: HopePubmedArticle[]
  trials: HopeTrial[]
  provenance: HopeEvidenceProvenance[]
  trialSearchSupported: boolean
}

interface EvidenceApiResponse<T> {
  ok?: boolean
  fetchedAt?: string | number
  query?: string
  items?: T[]
  articles?: T[]
  trials?: T[]
  error?: string
}

export class HopeEvidenceRequestError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(code)
    this.name = 'HopeEvidenceRequestError'
    this.status = status
    this.code = code
  }
}

export const HOPE_EVIDENCE_QUERIES: Record<HopeDomainKey, { query: string; trials: boolean }> = {
  'mental-health': {
    query: 'mental health safety planning suicide prevention evidence',
    trials: false,
  },
  'geroscience-pharma': {
    query: 'geroscience cellular senescence senolytic aging clinical trial',
    trials: true,
  },
  'regenerative-medicine': {
    query: 'regenerative medicine stem cell tissue engineering organoid clinical trial',
    trials: true,
  },
  'early-detection': {
    query: 'multi cancer early detection biomarker screening liquid biopsy',
    trials: true,
  },
  'longevity-care': {
    query: 'healthy aging preventive care multimorbidity functional health',
    trials: false,
  },
  'predictive-ai': {
    query: 'machine learning biological age health prediction calibration aging',
    trials: false,
  },
  'longevity-finance': {
    query: 'longevity retirement health expenditure healthy aging economics',
    trials: false,
  },
  'aging-technology': {
    query: 'assistive technology older adults aging robotics telecare cognitive support',
    trials: true,
  },
  'longevity-infrastructure': {
    query: 'population aging healthy longevity health system workforce economics',
    trials: false,
  },
}

function authHeaders(): Headers {
  const headers = new Headers({ Accept: 'application/json' })
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('pmd-token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

function normalizeFetchedAt(value: string | number | undefined): string {
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'string' && value) return value
  return new Date().toISOString()
}

async function getEvidence<T>(
  endpoint: '/api/evidence/pubmed' | '/api/trials',
  query: string,
  signal: AbortSignal,
): Promise<{ items: T[]; fetchedAt: string }> {
  const params = new URLSearchParams({ q: query })
  const response = await fetch(`${apiBaseUrl}${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
    signal,
  })

  let body: EvidenceApiResponse<T> = {}
  try {
    body = (await response.json()) as EvidenceApiResponse<T>
  } catch {
    // HTTP status remains authoritative when an upstream/proxy response is not JSON.
  }

  if (!response.ok) {
    throw new HopeEvidenceRequestError(response.status, body.error || `http_${response.status}`)
  }

  const items = body.items ?? body.articles ?? body.trials ?? []
  return { items, fetchedAt: normalizeFetchedAt(body.fetchedAt) }
}

function provenance(
  source: HopeEvidenceSource,
  endpoint: HopeEvidenceProvenance['endpoint'],
  fetchedAt: string,
  query: string,
): HopeEvidenceProvenance {
  return {
    source,
    evidenceClass: 'documented',
    fetchedAt,
    query,
    endpoint,
    provenanceId: `${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${fetchedAt}:${query}`,
  }
}

/**
 * Loads literature and, when scientifically appropriate for the selected domain,
 * registered studies through Panacea's existing authenticated backend adapters.
 * It intentionally has no mock fallback: unavailable external evidence remains unavailable.
 */
export async function loadHopeEvidence(domain: HopeDomainKey, signal: AbortSignal): Promise<HopeEvidenceBundle> {
  const config = HOPE_EVIDENCE_QUERIES[domain]
  const literaturePromise = getEvidence<HopePubmedArticle>('/api/evidence/pubmed', config.query, signal)
  const trialPromise = config.trials
    ? getEvidence<HopeTrial>('/api/trials', config.query, signal)
    : Promise.resolve<{ items: HopeTrial[]; fetchedAt: string } | null>(null)

  const [literature, trials] = await Promise.all([literaturePromise, trialPromise])
  const provenanceRows: HopeEvidenceProvenance[] = [
    provenance('PubMed', '/api/evidence/pubmed', literature.fetchedAt, config.query),
  ]

  if (trials) {
    provenanceRows.push(provenance('ClinicalTrials.gov', '/api/trials', trials.fetchedAt, config.query))
  }

  return {
    domain,
    query: config.query,
    articles: literature.items,
    trials: trials?.items ?? [],
    provenance: provenanceRows,
    trialSearchSupported: config.trials,
  }
}
