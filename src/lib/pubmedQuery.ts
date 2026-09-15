export type PubMedStudyDesign =
  | 'any'
  | 'systematic-review'
  | 'randomized-trial'
  | 'diagnostic'
  | 'observational'

export type PubMedConceptInput = {
  population: string
  intervention: string
  comparison: string
  outcome: string
  design: PubMedStudyDesign
  fromYear?: number
  toYear?: number
  humansOnly: boolean
  freeFullTextOnly: boolean
}

export type CompiledPubMedQuery = {
  query: string
  concepts: Array<{ label: string; alternatives: string[] }>
  warnings: string[]
}

const DESIGN_FILTERS: Record<Exclude<PubMedStudyDesign, 'any'>, string> = {
  'systematic-review': '(systematic review[Publication Type] OR meta-analysis[Publication Type])',
  'randomized-trial': 'randomized controlled trial[Publication Type]',
  diagnostic: '(diagnosis[Subheading] OR diagnostic accuracy[Title/Abstract])',
  observational: '(observational study[Publication Type] OR cohort[Title/Abstract] OR case-control[Title/Abstract])',
}

function alternatives(value: string): string[] {
  return value
    .split(/[;\n]+/)
    .map((term) => term.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .filter((term, index, all) => all.findIndex((other) => other.toLocaleLowerCase() === term.toLocaleLowerCase()) === index)
    .slice(0, 8)
}

function phrase(term: string): string {
  const safe = term.replace(/["\\]/g, ' ').trim()
  return `"${safe}"[Title/Abstract]`
}

function validYear(value: number | undefined): number | undefined {
  if (!Number.isInteger(value) || value! < 1900 || value! > new Date().getFullYear() + 1) return undefined
  return value
}

export function compilePubMedQuery(input: PubMedConceptInput): CompiledPubMedQuery {
  const concepts = [
    { label: 'Population', alternatives: alternatives(input.population) },
    { label: 'Intervention / exposure', alternatives: alternatives(input.intervention) },
    { label: 'Comparator', alternatives: alternatives(input.comparison) },
    { label: 'Outcome', alternatives: alternatives(input.outcome) },
  ].filter((concept) => concept.alternatives.length > 0)

  const warnings: string[] = []
  if (concepts.length === 0) warnings.push('Enter at least one concept before searching.')
  if (concepts.length === 1) warnings.push('One concept may return a broad result set; add another concept when useful.')

  const groups = concepts.map((concept) => {
    const terms = concept.alternatives.map(phrase)
    return terms.length === 1 ? terms[0] : `(${terms.join(' OR ')})`
  })

  if (input.design !== 'any') groups.push(DESIGN_FILTERS[input.design])
  if (input.humansOnly) groups.push('humans[MeSH Terms]')
  if (input.freeFullTextOnly) groups.push('free full text[sb]')

  let fromYear = validYear(input.fromYear)
  let toYear = validYear(input.toYear)
  if (fromYear && toYear && fromYear > toYear) {
    warnings.push('The start year was after the end year, so the range was corrected.')
    ;[fromYear, toYear] = [toYear, fromYear]
  }
  if (fromYear || toYear) {
    const from = fromYear ?? 1900
    const to = toYear ?? new Date().getFullYear() + 1
    groups.push(`("${from}/01/01"[Date - Publication] : "${to}/12/31"[Date - Publication])`)
  }

  return { query: groups.join(' AND '), concepts, warnings }
}
