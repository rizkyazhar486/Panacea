import type { VcfVariantRecord } from './sequenceEvidence'

export type StructuralVariantKind = 'DEL' | 'DUP' | 'CNV' | 'INV' | 'INS' | 'BND' | 'TRA' | 'OTHER'

export interface StructuralVariantEvidence {
  chrom: string
  pos: number
  end?: number
  id: string
  kind: StructuralVariantKind
  alt: string
  svLength?: number
  copyNumber?: number
  filter: string
  info: string
  source: 'VCF'
}

export interface StructuralVariantSummary {
  records: StructuralVariantEvidence[]
  byType: Array<{ type: StructuralVariantKind; count: number }>
  deletions: number
  duplications: number
  copyNumberEvents: number
  inversions: number
  insertions: number
  breakends: number
}

export interface PharmcatAlleleCall {
  name: string
  function?: string
  activityValue?: number
}

export interface PharmcatDiplotypeCall {
  label: string
  phenotypes: string[]
  activityScore?: number
  allele1?: PharmcatAlleleCall
  allele2?: PharmcatAlleleCall
  observed?: boolean
  combination?: boolean
}

export interface PharmcatGeneCall {
  gene: string
  callSource: string
  alleleDefinitionVersion: string
  phenotypeVersion: string
  phased: boolean
  effectivelyPhased: boolean
  diplotypes: PharmcatDiplotypeCall[]
  messages: string[]
  uncalledHaplotypes: string[]
}

export interface PharmcatPhenotypeReport {
  genes: PharmcatGeneCall[]
  calledGenes: number
  noResultGenes: number
  sourceKind: 'PharmCAT phenotype JSON'
}

function parseInfo(info: string) {
  const map = new Map<string, string>()
  for (const token of info.split(';')) {
    const trimmed = token.trim()
    if (!trimmed || trimmed === '.') continue
    const equals = trimmed.indexOf('=')
    if (equals < 0) map.set(trimmed.toUpperCase(), 'true')
    else map.set(trimmed.slice(0, equals).toUpperCase(), trimmed.slice(equals + 1))
  }
  return map
}

function firstFinite(value: string | undefined) {
  if (!value) return undefined
  for (const token of value.split(',')) {
    const parsed = Number(token)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeSvKind(raw: string): StructuralVariantKind {
  const value = raw.toUpperCase().replace(/[<>]/g, '')
  if (value === 'DEL') return 'DEL'
  if (value === 'DUP') return 'DUP'
  if (value === 'CNV') return 'CNV'
  if (value === 'INV') return 'INV'
  if (value === 'INS') return 'INS'
  if (value === 'BND') return 'BND'
  if (value === 'TRA' || value === 'TRANSLOCATION') return 'TRA'
  return 'OTHER'
}

function structuralKind(variant: VcfVariantRecord, info: Map<string, string>): StructuralVariantKind | null {
  const normalizedAlt = variant.alt.toUpperCase()
  if (normalizedAlt === '*' || normalizedAlt === '<*>' || normalizedAlt === '<NON_REF>') return null

  const explicit = info.get('SVTYPE')
  if (explicit) return normalizeSvKind(explicit)

  const symbolic = variant.alt.match(/^<([^>]+)>$/)?.[1]
  if (symbolic) return normalizeSvKind(symbolic)

  if (/[\[\]]/.test(variant.alt)) return 'BND'

  const svLen = firstFinite(info.get('SVLEN'))
  if (svLen != null && Math.abs(svLen) >= 50) {
    if (svLen < 0) return 'DEL'
    if (variant.alt.length > variant.ref.length) return 'INS'
    return 'OTHER'
  }

  const copyNumber = firstFinite(info.get('CN') || info.get('COPY_NUMBER'))
  if (copyNumber != null) return 'CNV'

  // END alone is not sufficient evidence of a structural variant because
  // gVCF reference blocks routinely use END without representing an SV.
  return null
}

export function parseStructuralVariantEvidence(variants: VcfVariantRecord[]): StructuralVariantSummary {
  const records: StructuralVariantEvidence[] = []
  const counts = new Map<StructuralVariantKind, number>()

  for (const variant of variants) {
    const info = parseInfo(variant.info)
    const kind = structuralKind(variant, info)
    if (!kind) continue

    const end = firstFinite(info.get('END'))
    const rawLength = firstFinite(info.get('SVLEN'))
    const inferredLength = end != null ? end - variant.pos + 1 : undefined
    const svLength = rawLength != null ? rawLength : inferredLength
    const copyNumber = firstFinite(info.get('CN') || info.get('COPY_NUMBER'))

    const record: StructuralVariantEvidence = {
      chrom: variant.chrom,
      pos: variant.pos,
      end,
      id: variant.id || '.',
      kind,
      alt: variant.alt,
      svLength,
      copyNumber,
      filter: variant.filter || '.',
      info: variant.info,
      source: 'VCF',
    }
    records.push(record)
    counts.set(kind, (counts.get(kind) || 0) + 1)
  }

  const byType = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))

  return {
    records,
    byType,
    deletions: counts.get('DEL') || 0,
    duplications: counts.get('DUP') || 0,
    copyNumberEvents: counts.get('CNV') || 0,
    inversions: counts.get('INV') || 0,
    insertions: counts.get('INS') || 0,
    breakends: (counts.get('BND') || 0) + (counts.get('TRA') || 0),
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function bool(value: unknown) {
  return value === true
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function allele(value: unknown): PharmcatAlleleCall | undefined {
  const raw = object(value)
  if (!raw) return undefined
  const name = text(raw.name)
  if (!name) return undefined
  return {
    name,
    function: text(raw.function) || undefined,
    activityValue: finiteNumber(raw.activityValue),
  }
}

function diplotype(value: unknown): PharmcatDiplotypeCall | null {
  const raw = object(value)
  if (!raw) return null
  const label = text(raw.label)
  if (!label) return null
  return {
    label,
    phenotypes: strings(raw.phenotypes),
    activityScore: finiteNumber(raw.activityScore),
    allele1: allele(raw.allele1),
    allele2: allele(raw.allele2),
    observed: typeof raw.observed === 'boolean' ? raw.observed : undefined,
    combination: typeof raw.combination === 'boolean' ? raw.combination : undefined,
  }
}

export function parsePharmcatPhenotypeJson(input: string): PharmcatPhenotypeReport {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  const root = object(parsed)
  const geneReports = object(root?.geneReports)
  if (!geneReports) throw new Error('PharmCAT phenotype JSON must contain a geneReports object.')

  const genes: PharmcatGeneCall[] = []
  for (const [geneKey, value] of Object.entries(geneReports)) {
    const raw = object(value)
    if (!raw) continue
    const recommendations = Array.isArray(raw.recommendationDiplotypes) ? raw.recommendationDiplotypes : []
    const calls = recommendations.map(diplotype).filter((item): item is PharmcatDiplotypeCall => Boolean(item))
    const gene = text(raw.geneSymbol) || geneKey
    genes.push({
      gene,
      callSource: text(raw.callSource) || 'unknown',
      alleleDefinitionVersion: text(raw.alleleDefinitionVersion),
      phenotypeVersion: text(raw.phenotypeVersion),
      phased: bool(raw.phased),
      effectivelyPhased: bool(raw.effectivelyPhased),
      diplotypes: calls,
      messages: strings(raw.messages),
      uncalledHaplotypes: strings(raw.uncalledHaplotypes),
    })
  }

  if (!genes.length) throw new Error('No gene reports were found in this PharmCAT phenotype JSON.')

  genes.sort((a, b) => a.gene.localeCompare(b.gene))
  const hasResult = (gene: PharmcatGeneCall) => gene.diplotypes.some((call) => call.label && !/^unknown/i.test(call.label) && !call.phenotypes.some((phenotype) => /^no result$/i.test(phenotype)))

  return {
    genes,
    calledGenes: genes.filter(hasResult).length,
    noResultGenes: genes.filter((gene) => !hasResult(gene)).length,
    sourceKind: 'PharmCAT phenotype JSON',
  }
}

export function pharmcatCommand(vcfName = 'sample.vcf') {
  const safeName = vcfName.replace(/[\r\n"']/g, '').trim() || 'sample.vcf'
  const stem = safeName.replace(/\.vcf(?:\.gz)?$/i, '').replace(/[^A-Za-z0-9._-]+/g, '_') || 'sample'
  return `java -jar pharmcat.jar -vcf "/data/${safeName}" -o "/data/pharmcat" -bf "${stem}" -reporterJson`
}

export const PHARMCAT_REPOSITORY = 'https://github.com/PharmGKB/PharmCAT'
export const PHARMCAT_RUNNING_DOCS = 'https://pharmcat.org/using/running-pharmcat/'
export const DORADO_REPOSITORY = 'https://github.com/nanoporetech/dorado'
export const ONT_BASECALLING_DOCS = 'https://nanoporetech.com/document/epi2me-workflows/wf-basecalling'
