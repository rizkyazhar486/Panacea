// ClinicalTrials.gov live search — the free public v2 API (no key). Lets the app
// connect people to REAL registered trials (e.g. longevity, stem-cell, oncology
// studies) instead of faking a "stem cell marketplace". Not testable from the
// sandbox (outbound blocked) — verify the JSON shape on first deploy.

const CTG = 'https://clinicaltrials.gov/api/v2/studies'

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

export async function searchTrials(query: string, opts?: { recruitingOnly?: boolean; country?: string }): Promise<TrialResult[]> {
  const q = query.trim()
  if (!q) return []
  const params = new URLSearchParams()
  params.set('query.term', q)
  params.set('pageSize', '12')
  // Trim the payload to the fields we render.
  params.set('fields', 'NCTId,BriefTitle,OverallStatus,Condition,Phase,LocationCity,LocationCountry')
  if (opts?.recruitingOnly) params.set('filter.overallStatus', 'RECRUITING')
  if (opts?.country) params.set('query.locn', opts.country)

  const res = await fetch(`${CTG}?${params.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`ctg_${res.status}`)
  const json = (await res.json()) as CtgResp
  return (json.studies ?? []).map((s) => {
    const p = s.protocolSection ?? {}
    const nctId = p.identificationModule?.nctId ?? ''
    const locs = p.contactsLocationsModule?.locations ?? []
    const locSummary = locs.length
      ? Array.from(new Set(locs.map((l) => l.country).filter(Boolean))).slice(0, 3).join(', ') + (locs.length > 3 ? ' +' : '')
      : '—'
    return {
      nctId,
      title: p.identificationModule?.briefTitle ?? '(untitled study)',
      status: p.statusModule?.overallStatus ?? '',
      conditions: (p.conditionsModule?.conditions ?? []).slice(0, 3).join(', '),
      phase: (p.designModule?.phases ?? []).join('/') || 'N/A',
      locations: locSummary,
      url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : '',
    }
  }).filter((t) => t.nctId)
}
