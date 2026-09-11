import type { VariantEvidenceResult } from './variantEvidence'

export type CivicEvidenceLevel = 'A' | 'B' | 'C' | 'D' | 'E' | string

export interface CivicEvidenceItem {
  id: string
  status: string
  molecularProfile: string
  molecularProfileLink: string
  evidenceType: string
  evidenceLevel: CivicEvidenceLevel
  evidenceRating?: number
  evidenceDirection: string
  description: string
  disease: string
  therapies: string[]
  sourceTitle: string
  citationId: string
  sourceType: string
  therapyInteractionType: string
}

export interface CivicVariantEvidence {
  gene: string
  queryVariant: string
  variants: Array<{
    id: string
    name: string
    link: string
    alleleRegistryId?: string
    evidence: CivicEvidenceItem[]
  }>
}

const CIVIC_GRAPHQL = 'https://civicdb.org/api/graphql'
export const CIVIC_GRAPHIQL = 'https://civicdb.org/api/graphiql'
export const CIVIC_EVIDENCE_DOCS = 'https://docs.civicdb.org/en/latest/model/evidence.html'

const AA3_TO_1: Record<string, string> = {
  Ala: 'A', Arg: 'R', Asn: 'N', Asp: 'D', Cys: 'C', Gln: 'Q', Glu: 'E', Gly: 'G', His: 'H', Ile: 'I',
  Leu: 'L', Lys: 'K', Met: 'M', Phe: 'F', Pro: 'P', Ser: 'S', Thr: 'T', Trp: 'W', Tyr: 'Y', Val: 'V',
  Ter: '*', Stop: '*', Sec: 'U', Pyl: 'O',
}

function timeoutSignal(milliseconds = 18000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), milliseconds)
  return { controller, clear: () => window.clearTimeout(timer) }
}

function compactProteinChange(hgvsp: string | undefined) {
  if (!hgvsp) return ''
  const raw = hgvsp.split(':').pop()?.replace(/^p\./, '').trim() || ''
  if (!raw) return ''

  const substitution = raw.match(/^([A-Z][a-z]{2})(\d+)([A-Z][a-z]{2}|Ter|Stop)$/)
  if (substitution) {
    const from = AA3_TO_1[substitution[1]]
    const to = AA3_TO_1[substitution[3]]
    if (from && to) return `${from}${substitution[2]}${to}`
  }

  const oneLetter = raw.match(/^([A-Z*])(\d+)([A-Z*])$/)
  if (oneLetter) return raw
  return ''
}

export function civicQueryCandidate(result: VariantEvidenceResult) {
  const transcript = result.transcripts.find((item) => item.gene_symbol && item.hgvsp)
    || result.transcripts.find((item) => item.gene_symbol)
  const gene = transcript?.gene_symbol || result.genes[0] || ''
  const variant = compactProteinChange(transcript?.hgvsp)
  return { gene, variant }
}

export async function fetchCivicEvidenceForVariant(result: VariantEvidenceResult): Promise<CivicVariantEvidence> {
  const candidate = civicQueryCandidate(result)
  if (!candidate.gene) throw new Error('CIViC lookup requires a gene symbol returned by VEP.')
  if (!candidate.variant) throw new Error('CIViC lookup currently requires a protein substitution such as BRAF V600E or EGFR L858R. Panacea will not guess a cancer variant name from coordinates alone.')

  const query = `
    query PanaceaCivicEvidence($gene: String!, $variant: String!) {
      gene(entrezSymbol: $gene) {
        variants(name: $variant) {
          nodes {
            id
            name
            link
            ... on GeneVariant {
              alleleRegistryId
            }
            molecularProfiles {
              nodes {
                id
                name
                evidenceItems {
                  nodes {
                    id
                    status
                    molecularProfile { id name link }
                    evidenceType
                    evidenceLevel
                    evidenceRating
                    evidenceDirection
                    description
                    disease { id name displayName }
                    therapies { id name }
                    source { citationId sourceType title }
                    therapyInteractionType
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const { controller, clear } = timeoutSignal()
  try {
    const response = await fetch(CIVIC_GRAPHQL, {
      method: 'POST',
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: candidate }),
    })
    if (!response.ok) throw new Error(`CIViC returned ${response.status} ${response.statusText}.`)
    const payload = await response.json() as {
      data?: {
        gene?: {
          variants?: {
            nodes?: Array<{
              id?: string | number
              name?: string
              link?: string
              alleleRegistryId?: string | null
              molecularProfiles?: {
                nodes?: Array<{
                  id?: string | number
                  name?: string
                  evidenceItems?: {
                    nodes?: Array<{
                      id?: string | number
                      status?: string
                      molecularProfile?: { name?: string; link?: string }
                      evidenceType?: string
                      evidenceLevel?: string
                      evidenceRating?: number | null
                      evidenceDirection?: string
                      description?: string
                      disease?: { name?: string; displayName?: string }
                      therapies?: Array<{ name?: string }>
                      source?: { citationId?: string | number; sourceType?: string; title?: string }
                      therapyInteractionType?: string
                    }>
                  }
                }>
              }
            }>
          }
        }
      }
      errors?: Array<{ message?: string }>
    }
    if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message || 'GraphQL error').join(' · '))

    const nodes = payload.data?.gene?.variants?.nodes || []
    return {
      gene: candidate.gene,
      queryVariant: candidate.variant,
      variants: nodes.map((variant) => {
        const evidence: CivicEvidenceItem[] = []
        for (const profile of variant.molecularProfiles?.nodes || []) {
          for (const item of profile.evidenceItems?.nodes || []) {
            evidence.push({
              id: String(item.id || ''),
              status: item.status || 'UNKNOWN',
              molecularProfile: item.molecularProfile?.name || profile.name || 'Molecular profile',
              molecularProfileLink: item.molecularProfile?.link || '',
              evidenceType: item.evidenceType || 'not returned',
              evidenceLevel: item.evidenceLevel || 'not returned',
              evidenceRating: typeof item.evidenceRating === 'number' ? item.evidenceRating : undefined,
              evidenceDirection: item.evidenceDirection || 'not returned',
              description: item.description || '',
              disease: item.disease?.displayName || item.disease?.name || 'Disease not returned',
              therapies: (item.therapies || []).map((therapy) => therapy.name || '').filter(Boolean),
              sourceTitle: item.source?.title || '',
              citationId: String(item.source?.citationId || ''),
              sourceType: item.source?.sourceType || '',
              therapyInteractionType: item.therapyInteractionType || '',
            })
          }
        }
        evidence.sort((a, b) => {
          const acceptedA = a.status.toUpperCase() === 'ACCEPTED' ? 1 : 0
          const acceptedB = b.status.toUpperCase() === 'ACCEPTED' ? 1 : 0
          if (acceptedA !== acceptedB) return acceptedB - acceptedA
          return String(a.evidenceLevel).localeCompare(String(b.evidenceLevel))
        })
        return {
          id: String(variant.id || ''),
          name: variant.name || candidate.variant,
          link: variant.link || '',
          alleleRegistryId: variant.alleleRegistryId || undefined,
          evidence,
        }
      }),
    }
  } finally {
    clear()
  }
}
