import { FITUR_DARI_HUB, type Fitur } from './katalogFitur'

export type CanonicalSuperPage = 'body' | 'clinical' | 'for-you'
export type CanonicalCapability = Fitur & {
  canonicalTo: string
  canonicalId: string
  aliases: string[]
  superPage: CanonicalSuperPage
}

const ROUTE_REDIRECTS: Record<string, string> = {
  '/feed': '/?t=social',
  '/community': '/?t=community',
  '/clubs': '/?t=clubs',
  '/keuangan': '/?t=finance',
  '/markets': '/?t=markets',
  '/sports-scores': '/?t=scores',
  '/scripture': '/?t=religion&faith=scripture',
  '/hadith': '/?t=religion&faith=hadith',
  '/prayer-times': '/?t=religion&faith=prayer',
  '/prophet-stories': '/?t=religion&faith=stories',
  '/education': '/?t=learn',

  '/body': '/fitness-hub?view=body',
  '/shape-forming': '/fitness-hub?view=character',
  '/latihan': '/fitness-hub?view=training',
  '/training-plan': '/fitness-hub?view=training&t=rencana',
  '/workout': '/fitness-hub?view=workout&t=sesi',
  '/recovery': '/fitness-hub?view=recovery',
  '/tubuh': '/fitness-hub?view=numbers',
  '/nutrition': '/fitness-hub?view=nutrition',
  '/health-data': '/fitness-hub?view=health-data',
  '/data-lab': '/fitness-hub?view=labs',
  '/longevity': '/fitness-hub?view=longevity',
  '/vitapulse': '/fitness-hub?view=vitapulse',

  '/body-explorer': '/clinical-hub?t=body',
  '/frontier-health': '/clinical-hub?t=discovery',
  '/radiology': '/clinical-hub?t=imaging',
  '/electrophysiology': '/clinical-hub?t=electrophysiology',
  '/genome-lab': '/clinical-hub?t=genome',
  '/knowledge-bridge': '/clinical-hub?t=knowledge',
  '/med-study': '/clinical-hub?t=library',
  '/osce-ukmppd': '/clinical-hub?t=curriculum',
  '/evidence': '/clinical-hub?t=evidence',
  '/drug-info': '/clinical-hub?t=drugs',
  '/clinical-calculators': '/clinical-hub?t=calculators',
  '/chatbot': '/clinical-hub?t=assistant',
  '/emr': '/clinical-hub?t=records',
  '/emergency': '/clinical-hub?t=emergency',
}

const CLINICAL_PATHS = new Set([
  '/body-explorer', '/radiology', '/frontier-health', '/knowledge-bridge', '/electrophysiology', '/genome-lab',
  '/med-study', '/osce-ukmppd', '/evidence', '/drug-info', '/clinical-calculators', '/clinical-scores', '/translator',
  '/chatbot', '/emr', '/emergency', '/second-opinion', '/consult', '/hospitals', '/pharmacy', '/orders', '/data-lab',
])

const FOR_YOU_PATHS = new Set([
  '/feed', '/community', '/clubs', '/keuangan', '/markets', '/sports-scores', '/messages', '/profile', '/settings',
  '/scripture', '/hadith', '/prayer-times', '/prophet-stories', '/education', '/billing', '/notifications',
])

function normalizeRoute(to: string) {
  return to.trim().replace(/\/$/, '') || '/'
}

export function canonicalCapabilityRoute(to: string) {
  const normalized = normalizeRoute(to)
  return ROUTE_REDIRECTS[normalized] ?? normalized
}

function searchable(feature: Fitur) {
  return `${feature.grup} ${feature.nama} ${feature.apa} ${feature.kw}`.toLowerCase()
}

export function capabilitySuperPage(feature: Fitur): CanonicalSuperPage {
  const text = searchable(feature)
  if (
    FOR_YOU_PATHS.has(feature.to) ||
    /social|community|club|message|faith|religion|prayer|hadith|scripture|prophet|finance|money|market|wallet|account|profile|setting|billing|theme/.test(text)
  ) return 'for-you'

  if (
    CLINICAL_PATHS.has(feature.to) ||
    /clinical|medical|disease|drug|pharma|anatom|physiol|radiolog|imaging|genom|gene|dna|evidence|research|trial|diagnos|score|calculator|lab|emr|care|hospital|consult|emergency/.test(text)
  ) return 'clinical'

  return 'body'
}

function preferredFeature(current: Fitur, candidate: Fitur) {
  const currentWeight = current.apa.length + current.kw.length
  const candidateWeight = candidate.apa.length + candidate.kw.length
  return candidateWeight > currentWeight ? candidate : current
}

export function buildCanonicalCapabilityRegistry(features: Fitur[] = FITUR_DARI_HUB): CanonicalCapability[] {
  const grouped = new Map<string, { feature: Fitur; aliases: Set<string>; superPage: CanonicalSuperPage }>()

  for (const feature of features) {
    const canonicalTo = canonicalCapabilityRoute(feature.to)
    const existing = grouped.get(canonicalTo)
    if (!existing) {
      grouped.set(canonicalTo, {
        feature,
        aliases: new Set(feature.to === canonicalTo ? [] : [feature.to]),
        superPage: capabilitySuperPage(feature),
      })
      continue
    }

    existing.aliases.add(feature.to)
    existing.feature = preferredFeature(existing.feature, feature)
    if (existing.superPage === 'body') existing.superPage = capabilitySuperPage(feature)
  }

  return [...grouped.entries()].map(([canonicalTo, entry]) => ({
    ...entry.feature,
    to: canonicalTo,
    canonicalTo,
    canonicalId: canonicalTo,
    aliases: [...entry.aliases].filter((alias) => alias !== canonicalTo).sort(),
    superPage: entry.superPage,
  }))
}

export const CANONICAL_CAPABILITIES = buildCanonicalCapabilityRegistry()

export const CAPABILITY_REGISTRY_STATS = (() => {
  const counts: Record<CanonicalSuperPage, number> = { body: 0, clinical: 0, 'for-you': 0 }
  let aliasCount = 0
  for (const capability of CANONICAL_CAPABILITIES) {
    counts[capability.superPage] += 1
    aliasCount += capability.aliases.length
  }
  return {
    rawEntries: FITUR_DARI_HUB.length,
    canonicalCapabilities: CANONICAL_CAPABILITIES.length,
    collapsedAliases: Math.max(0, FITUR_DARI_HUB.length - CANONICAL_CAPABILITIES.length),
    explicitAliases: aliasCount,
    bySuperPage: counts,
  }
})()

export function capabilitiesForSuperPage(superPage: CanonicalSuperPage) {
  return CANONICAL_CAPABILITIES.filter((capability) => capability.superPage === superPage)
}

export function searchCanonicalCapabilities(query: string, superPage?: CanonicalSuperPage) {
  const needle = query.trim().toLowerCase()
  return CANONICAL_CAPABILITIES.filter((capability) => {
    if (superPage && capability.superPage !== superPage) return false
    if (!needle) return true
    return `${capability.nama} ${capability.apa} ${capability.kw} ${capability.grup} ${capability.canonicalTo} ${capability.aliases.join(' ')}`.toLowerCase().includes(needle)
  })
}
