import type { GenomeAssemblyHint, VcfVariantRecord } from './sequenceEvidence'

export type VariantImpact = 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER' | string

export interface VepTranscriptConsequence {
  gene_symbol?: string
  gene_id?: string
  transcript_id?: string
  consequence_terms?: string[]
  impact?: VariantImpact
  biotype?: string
  canonical?: number
  mane_select?: string
  hgvsc?: string
  hgvsp?: string
  amino_acids?: string
  codons?: string
  sift_prediction?: string
  sift_score?: number
  polyphen_prediction?: string
  polyphen_score?: number
}

export interface VepColocatedVariant {
  id?: string
  allele_string?: string
  clin_sig?: string[]
  phenotype_or_disease?: number
  somatic?: number
  frequencies?: Record<string, Record<string, number>>
}

export interface VepRawResult {
  input?: string
  assembly_name?: string
  seq_region_name?: string
  start?: number
  end?: number
  allele_string?: string
  most_severe_consequence?: string
  variant_class?: string
  transcript_consequences?: VepTranscriptConsequence[]
  colocated_variants?: VepColocatedVariant[]
}

export interface VariantEvidenceResult {
  sourceVariant: VcfVariantRecord
  input: string
  assembly: 'GRCh37' | 'GRCh38'
  locus: string
  mostSevereConsequence: string
  variantClass: string
  genes: string[]
  transcripts: VepTranscriptConsequence[]
  colocatedIds: string[]
  clinicalSignificance: string[]
  raw: VepRawResult
}

const CURRENT_VEP = 'https://rest.ensembl.org/vep/homo_sapiens/region'
const GRCH37_VEP = 'https://grch37.rest.ensembl.org/vep/homo_sapiens/region'

function normalizeChromosome(value: string) {
  return value.replace(/^chr/i, '')
}

function vcfInput(variant: VcfVariantRecord) {
  return `${normalizeChromosome(variant.chrom)} ${variant.pos} ${variant.id || '.'} ${variant.ref} ${variant.alt} ${variant.qual || '.'} ${variant.filter || '.'} ${variant.info || '.'}`
}

function supportedForVep(variant: VcfVariantRecord) {
  if (!variant.chrom || !variant.pos || !variant.ref || !variant.alt) return false
  if (/[\[\]]/.test(variant.alt)) return false
  if (variant.ref.length > 10000 || variant.alt.length > 10000) return false
  return true
}

function unique(values: Array<string | undefined | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean))]
}

function clinicalTerms(result: VepRawResult) {
  return unique((result.colocated_variants || []).flatMap((item) => item.clin_sig || []))
}

function prioritizedTranscripts(result: VepRawResult) {
  const transcripts = [...(result.transcript_consequences || [])]
  const rank = (item: VepTranscriptConsequence) => {
    const impact = item.impact === 'HIGH' ? 40 : item.impact === 'MODERATE' ? 30 : item.impact === 'LOW' ? 20 : 10
    return impact + (item.mane_select ? 8 : 0) + (item.canonical ? 4 : 0) + (item.gene_symbol ? 2 : 0)
  }
  return transcripts.sort((a, b) => rank(b) - rank(a)).slice(0, 6)
}

export function externalVepAssembly(hint: GenomeAssemblyHint): 'GRCh37' | 'GRCh38' | null {
  if (hint === 'GRCh37' || hint === 'GRCh38') return hint
  return null
}

export async function annotateVariantsWithVep(
  variants: VcfVariantRecord[],
  assembly: 'GRCh37' | 'GRCh38',
  limit = 20,
): Promise<{ results: VariantEvidenceResult[]; skipped: number }> {
  const selected = variants.slice(0, Math.max(1, Math.min(limit, 20)))
  const supported = selected.filter(supportedForVep)
  const skipped = selected.length - supported.length
  if (!supported.length) throw new Error('No selected VCF ALT alleles can be submitted to Ensembl VEP.')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 25000)
  try {
    const endpoint = assembly === 'GRCh37' ? GRCH37_VEP : CURRENT_VEP
    const response = await fetch(`${endpoint}?canonical=1&mane=1&hgvs=1&protein=1&variant_class=1&phenotypes=1`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ variants: supported.map(vcfInput) }),
    })
    if (!response.ok) throw new Error(`Ensembl VEP returned ${response.status} ${response.statusText}.`)
    const raw = await response.json() as VepRawResult[]

    const results = raw.map((result, index) => {
      const sourceVariant = supported[index] || supported.find((variant) => {
        const normalized = normalizeChromosome(variant.chrom)
        return result.input?.startsWith(`${normalized} ${variant.pos} `)
      }) || supported[0]
      const transcripts = prioritizedTranscripts(result)
      return {
        sourceVariant,
        input: result.input || vcfInput(sourceVariant),
        assembly,
        locus: `${result.seq_region_name || normalizeChromosome(sourceVariant.chrom)}:${result.start || sourceVariant.pos}${result.end && result.end !== result.start ? `-${result.end}` : ''}`,
        mostSevereConsequence: result.most_severe_consequence || 'not returned',
        variantClass: result.variant_class || 'not returned',
        genes: unique(transcripts.map((item) => item.gene_symbol || item.gene_id)),
        transcripts,
        colocatedIds: unique((result.colocated_variants || []).map((item) => item.id)),
        clinicalSignificance: clinicalTerms(result),
        raw: result,
      }
    })

    return { results, skipped }
  } finally {
    window.clearTimeout(timer)
  }
}

export function clinvarSearchUrl(idOrLocus: string) {
  return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(idOrLocus)}`
}

export function ensemblVariantUrl(id: string, assembly: 'GRCh37' | 'GRCh38') {
  const base = assembly === 'GRCh37' ? 'https://grch37.ensembl.org' : 'https://www.ensembl.org'
  return `${base}/Homo_sapiens/Variation/Explore?v=${encodeURIComponent(id)}`
}
