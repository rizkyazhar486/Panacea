// ClinicalTrials.gov live search — the free public v2 API (no key). Lets the app
// connect people to REAL registered trials (e.g. longevity, stem-cell, oncology
// studies) instead of faking a "stem cell marketplace". The server keeps the
// upstream request bounded so a slow registry response cannot pin a worker.

const CTG = 'https://clinicaltrials.gov/api/v2/studies'
const CTG_TIMEOUT_MS = 8_000
const MAX_QUERY_LENGTH = 160
const MAX_COUNTRY_LENGTH = 80
const NCT_ID = /^NCT\d{8}$/i

export interface TrialResult {
  nctId: string
  title: string
  status: string
  conditions: string
  phase: string
  locations: string
  url: string
}

interface CtgStudy {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string }
    statusModule?: { overallStatus?: string }
    conditionsModule?: { conditions?: string[] }
    designModule?: { phases?: string[] }
    contactsLocationsModule?: { locations?: { city?: string; country?: string }[] }
  }
}
interface CtgResp { studies?: CtgStudy[] }

function normalizeNctId(value: string | undefined): string | undefined {
  const clean = value?.trim()
  if (!clean || !NCT_ID.test(clean)) return undefined
  return clean.toUpperCase()
}

export async function searchTrials(query: string, opts?: { recruitingOnly?: boolean; country?: string }): Promise<TrialResult[]> {
  const q = query.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH)
  if (!q) return []
  const params = new URLSearchParams()
  params.set('query.term', q)
  params.set('pageSize', '12')
  // Trim the payload to the fields we render.
  params.set('fields', 'NCTId,BriefTitle,OverallStatus,Condition,Phase,LocationCity,LocationCountry')
  if (opts?.recruitingOnly) params.set('filter.overallStatus', 'RECRUITING')
  const country = opts?.country?.trim().replace(/\s+/g, ' ').slice(0, MAX_COUNTRY_LENGTH)
  if (country) params.set('query.locn', country)

  const res = await fetch(`${CTG}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(CTG_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`ctg_${res.status}`)
  const json = (await res.json()) as CtgResp
  return (json.studies ?? []).flatMap((s) => {
    const p = s.protocolSection ?? {}
    const nctId = normalizeNctId(p.identificationModule?.nctId)
    if (!nctId) return []
    const locs = p.contactsLocationsModule?.locations ?? []
    const locSummary = locs.length
      ? Array.from(new Set(locs.map((l) => l.country).filter(Boolean))).slice(0, 3).join(', ') + (locs.length > 3 ? ' +' : '')
      : '—'
    return [{
      nctId,
      title: p.identificationModule?.briefTitle ?? '(untitled study)',
      status: p.statusModule?.overallStatus ?? '',
      conditions: (p.conditionsModule?.conditions ?? []).slice(0, 3).join(', '),
      phase: (p.designModule?.phases ?? []).join('/') || 'N/A',
      locations: locSummary,
      url: `https://clinicaltrials.gov/study/${nctId}`,
    }]
  })
}
