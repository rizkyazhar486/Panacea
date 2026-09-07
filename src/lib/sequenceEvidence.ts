export type SequenceEvidenceFormat = 'FASTQ' | 'FASTA' | 'VCF'
export type GenomeAssemblyHint = 'GRCh37' | 'GRCh38' | 'unknown'

export interface SequenceEvidencePreview {
  label: string
  value: string
}

export interface VcfVariantRecord {
  chrom: string
  pos: number
  id: string
  ref: string
  alt: string
  qual: string
  filter: string
  info: string
}

export interface SequenceEvidenceReport {
  format: SequenceEvidenceFormat
  recordCount: number
  totalBases?: number
  meanLength?: number
  n50?: number
  gcPct?: number
  ambiguousPct?: number
  meanPhred?: number
  q20Pct?: number
  q30Pct?: number
  variantSites?: number
  alternateAlleles?: number
  snpAlleles?: number
  indelAlleles?: number
  passSites?: number
  transitions?: number
  transversions?: number
  tiTv?: number
  sampleCount?: number
  assemblyHint?: GenomeAssemblyHint
  referenceHeader?: string
  variants?: VcfVariantRecord[]
  structuralVariants?: VcfVariantRecord[]
  preview: SequenceEvidencePreview[]
  warnings: string[]
}

function pct(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0
}

function n50(lengths: number[]) {
  if (!lengths.length) return 0
  const sorted = [...lengths].sort((a, b) => b - a)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  let cumulative = 0
  for (const length of sorted) {
    cumulative += length
    if (cumulative >= total / 2) return length
  }
  return sorted[sorted.length - 1] ?? 0
}

function baseComposition(sequence: string) {
  let a = 0
  let c = 0
  let g = 0
  let t = 0
  let ambiguous = 0
  for (const char of sequence.toUpperCase()) {
    if (char === 'A') a += 1
    else if (char === 'C') c += 1
    else if (char === 'G') g += 1
    else if (char === 'T' || char === 'U') t += 1
    else if (/[A-Z]/.test(char)) ambiguous += 1
  }
  const canonical = a + c + g + t
  const total = canonical + ambiguous
  return { canonical, total, gc: c + g, ambiguous }
}

function cleanLines(text: string) {
  return text.replace(/\r\n?/g, '\n').split('\n')
}

export function detectSequenceEvidenceFormat(text: string): SequenceEvidenceFormat {
  const lines = cleanLines(text)
  const nonEmpty = lines.filter((line) => line.trim().length > 0)
  const first = nonEmpty[0]?.trim() ?? ''

  if (first.startsWith('##fileformat=VCF') || nonEmpty.some((line) => line.startsWith('#CHROM\t'))) return 'VCF'
  if (first.startsWith('>')) return 'FASTA'
  if (first.startsWith('@')) {
    for (let index = 0; index + 3 < nonEmpty.length && index < 40; index += 4) {
      if (nonEmpty[index]?.startsWith('@') && nonEmpty[index + 2]?.startsWith('+')) return 'FASTQ'
    }
  }
  throw new Error('Unsupported or unrecognized sequence text. Use an uncompressed FASTA, FASTQ or VCF file.')
}

function parseFasta(text: string): SequenceEvidenceReport {
  const lines = cleanLines(text)
  const records: Array<{ header: string; sequence: string }> = []
  let header = ''
  let sequence = ''

  const flush = () => {
    if (!header && !sequence) return
    records.push({ header: header || `sequence_${records.length + 1}`, sequence })
    header = ''
    sequence = ''
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('>')) {
      flush()
      header = line.slice(1).trim()
    } else {
      sequence += line.replace(/\s+/g, '')
    }
  }
  flush()

  if (!records.length) throw new Error('No FASTA records were found.')
  const lengths = records.map((record) => record.sequence.length)
  const totalBases = lengths.reduce((sum, value) => sum + value, 0)
  const composition = records.reduce(
    (acc, record) => {
      const next = baseComposition(record.sequence)
      acc.canonical += next.canonical
      acc.total += next.total
      acc.gc += next.gc
      acc.ambiguous += next.ambiguous
      return acc
    },
    { canonical: 0, total: 0, gc: 0, ambiguous: 0 },
  )

  return {
    format: 'FASTA',
    recordCount: records.length,
    totalBases,
    meanLength: totalBases / records.length,
    n50: n50(lengths),
    gcPct: pct(composition.gc, composition.canonical),
    ambiguousPct: pct(composition.ambiguous, composition.total),
    preview: records.slice(0, 8).map((record) => ({
      label: record.header || 'Unnamed sequence',
      value: `${record.sequence.length.toLocaleString()} bases · ${record.sequence.slice(0, 48)}${record.sequence.length > 48 ? '…' : ''}`,
    })),
    warnings: [],
  }
}

function parseFastq(text: string): SequenceEvidenceReport {
  const lines = cleanLines(text)
  const records: Array<{ header: string; sequence: string; quality: string }> = []
  const warnings: string[] = []
  let index = 0

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1
    if (index >= lines.length) break
    const header = lines[index]?.trim() ?? ''
    const sequence = lines[index + 1]?.trim() ?? ''
    const plus = lines[index + 2]?.trim() ?? ''
    const quality = lines[index + 3]?.trim() ?? ''
    if (!header.startsWith('@') || !plus.startsWith('+')) {
      warnings.push(`Stopped at malformed FASTQ record near line ${index + 1}.`)
      break
    }
    if (sequence.length !== quality.length) warnings.push(`Read ${records.length + 1} has sequence/quality length mismatch.`)
    records.push({ header: header.slice(1), sequence, quality })
    index += 4
  }

  if (!records.length) throw new Error('No complete FASTQ records were found.')
  const lengths = records.map((record) => record.sequence.length)
  const totalBases = lengths.reduce((sum, value) => sum + value, 0)
  let qSum = 0
  let qCount = 0
  let q20 = 0
  let q30 = 0
  let gc = 0
  let canonical = 0
  let ambiguous = 0

  for (const record of records) {
    const composition = baseComposition(record.sequence)
    gc += composition.gc
    canonical += composition.canonical
    ambiguous += composition.ambiguous
    const usable = Math.min(record.sequence.length, record.quality.length)
    for (let i = 0; i < usable; i += 1) {
      const q = Math.max(0, record.quality.charCodeAt(i) - 33)
      qSum += q
      qCount += 1
      if (q >= 20) q20 += 1
      if (q >= 30) q30 += 1
    }
  }

  return {
    format: 'FASTQ',
    recordCount: records.length,
    totalBases,
    meanLength: totalBases / records.length,
    n50: n50(lengths),
    gcPct: pct(gc, canonical),
    ambiguousPct: pct(ambiguous, canonical + ambiguous),
    meanPhred: qCount ? qSum / qCount : undefined,
    q20Pct: pct(q20, qCount),
    q30Pct: pct(q30, qCount),
    preview: records.slice(0, 8).map((record) => ({
      label: record.header || 'Unnamed read',
      value: `${record.sequence.length.toLocaleString()} bases · ${record.sequence.slice(0, 48)}${record.sequence.length > 48 ? '…' : ''}`,
    })),
    warnings,
  }
}

const TRANSITIONS = new Set(['AG', 'GA', 'CT', 'TC'])
const SMALL_VARIANT_PREVIEW_LIMIT = 200
const STRUCTURAL_VARIANT_PREVIEW_LIMIT = 2000

function inferAssembly(lines: string[]) {
  const referenceHeader = lines.find((line) => line.startsWith('##reference='))?.slice('##reference='.length).trim() || ''
  const metadata = lines.filter((line) => line.startsWith('##')).slice(0, 200).join(' ').toLowerCase()
  const haystack = `${referenceHeader} ${metadata}`.toLowerCase()
  const assemblyHint: GenomeAssemblyHint = /grch37|hg19/.test(haystack) ? 'GRCh37' : /grch38|hg38/.test(haystack) ? 'GRCh38' : 'unknown'
  return { referenceHeader, assemblyHint }
}

function looksStructural(alt: string, info: string) {
  const normalized = alt.toUpperCase()
  if (normalized === '*' || normalized === '<*>' || normalized === '<NON_REF>') return false
  if (/^<[^>]+>$/.test(alt) || /[\[\]]/.test(alt)) return true
  // END alone is common in gVCF reference blocks and is not sufficient to
  // establish a structural event. Require an explicit SV/CN signal.
  return /(?:^|;)SVTYPE=|(?:^|;)SVLEN=|(?:^|;)CN=|(?:^|;)COPY_NUMBER=/i.test(info)
}

function parseVcf(text: string): SequenceEvidenceReport {
  const lines = cleanLines(text)
  const records = lines.filter((line) => line && !line.startsWith('#'))
  const header = lines.find((line) => line.startsWith('#CHROM\t'))
  if (!header) throw new Error('VCF header (#CHROM) was not found.')

  let alternateAlleles = 0
  let snpAlleles = 0
  let indelAlleles = 0
  let passSites = 0
  let transitions = 0
  let transversions = 0
  const preview: SequenceEvidencePreview[] = []
  const warnings: string[] = []
  const variants: VcfVariantRecord[] = []
  const structuralVariants: VcfVariantRecord[] = []
  let structuralOverflow = 0

  for (const line of records) {
    const fields = line.split('\t')
    if (fields.length < 8) {
      warnings.push('One or more VCF rows had fewer than 8 required columns and were ignored.')
      continue
    }
    const [chrom, posRaw, id, ref, altField, qual, filter, info] = fields
    const pos = Number(posRaw)
    if (!Number.isFinite(pos) || pos <= 0) {
      warnings.push('One or more VCF rows had an invalid POS value and were ignored for external annotation.')
      continue
    }
    const alts = altField.split(',').filter((alt) => alt && alt !== '.')
    alternateAlleles += alts.length
    if (filter === 'PASS' || filter === '.') passSites += 1

    for (const alt of alts) {
      if (ref.length === 1 && alt.length === 1 && /^[ACGT]$/i.test(ref) && /^[ACGT]$/i.test(alt)) {
        snpAlleles += 1
        const pair = `${ref}${alt}`.toUpperCase()
        if (TRANSITIONS.has(pair)) transitions += 1
        else transversions += 1
      } else if (ref.length !== alt.length && !looksStructural(alt, info) && !/^<(?:NON_REF|\*)>$/i.test(alt) && alt !== '*') {
        indelAlleles += 1
      }

      const variant: VcfVariantRecord = {
        chrom,
        pos,
        id: id || '.',
        ref,
        alt,
        qual: qual || '.',
        filter: filter || '.',
        info: info || '.',
      }

      if (variants.length < SMALL_VARIANT_PREVIEW_LIMIT) variants.push(variant)
      if (looksStructural(alt, info)) {
        if (structuralVariants.length < STRUCTURAL_VARIANT_PREVIEW_LIMIT) structuralVariants.push(variant)
        else structuralOverflow += 1
      }
    }

    if (preview.length < 10) {
      preview.push({
        label: `${chrom}:${pos}${id && id !== '.' ? ` · ${id}` : ''}`,
        value: `${ref} → ${altField} · FILTER ${filter || '—'}`,
      })
    }
  }

  const columns = header.split('\t')
  const sampleCount = Math.max(0, columns.length - 9)
  const { referenceHeader, assemblyHint } = inferAssembly(lines)
  if (alternateAlleles > variants.length) warnings.push(`Small-variant external-annotation preview is capped at the first ${variants.length.toLocaleString()} ALT alleles parsed from this file.`)
  if (structuralOverflow > 0) warnings.push(`Structural-event preview is capped at ${STRUCTURAL_VARIANT_PREVIEW_LIMIT.toLocaleString()} events; ${structuralOverflow.toLocaleString()} additional structural ALT records were not retained in memory.`)

  return {
    format: 'VCF',
    recordCount: records.length,
    variantSites: records.length,
    alternateAlleles,
    snpAlleles,
    indelAlleles,
    passSites,
    transitions,
    transversions,
    tiTv: transversions > 0 ? transitions / transversions : undefined,
    sampleCount,
    assemblyHint,
    referenceHeader,
    variants,
    structuralVariants,
    preview,
    warnings: [...new Set(warnings)],
  }
}

export function parseSequenceEvidence(text: string): SequenceEvidenceReport {
  const format = detectSequenceEvidenceFormat(text)
  if (format === 'FASTA') return parseFasta(text)
  if (format === 'FASTQ') return parseFastq(text)
  return parseVcf(text)
}
