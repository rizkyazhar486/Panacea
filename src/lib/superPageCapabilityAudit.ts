import { FITUR_DARI_HUB, type Fitur } from './katalogFitur.ts'

export type CapabilityCategory = 'Daily' | 'Body' | 'Fitness' | 'Mind' | 'Clinical' | 'Learn' | 'Social' | 'Faith' | 'Finance' | 'Account' | 'Tools'
export type CapabilityDomain = 'Your Body' | 'Clinical' | 'For You'

const CANONICAL_REDIRECTS: Readonly<Record<string, string>> = {
  '/feed': '/?t=social',
  '/community': '/?t=community',
  '/clubs': '/?t=clubs',
  '/sports-scores': '/?t=scores',
  '/scripture': '/?t=religion&faith=scripture',
  '/hadith': '/?t=religion&faith=hadith',
  '/prayer-times': '/?t=religion&faith=prayer',
  '/prophet-stories': '/?t=religion&faith=stories',
  '/body-explorer': '/learn?t=body',
  '/radiology': '/learn?t=radiology',
  '/med-study': '/learn?t=library',
  '/clinical-calculators': '/learn?t=calculators',
  '/latihan': '/fitness-hub?view=training',
  '/workout': '/fitness-hub?view=workout&t=sesi',
  '/recovery': '/fitness-hub?view=recovery',
  '/nutrition': '/fitness-hub?view=nutrition',
  '/health-data': '/fitness-hub?view=health-data',
}

function textOf(feature: Fitur) {
  return `${feature.nama} ${feature.apa ?? ''} ${feature.kw ?? ''} ${feature.grup ?? ''}`
}

export function categoryForCapability(feature: Fitur): CapabilityCategory {
  const text = textOf(feature).toLowerCase()
  if (/prayer|adzan|hadith|scripture|quran|prophet|faith|relig/.test(text)) return 'Faith'
  if (/finance|money|market|wallet|asset|invest|budget|expense|income|crypto|stock/.test(text)) return 'Finance'
  if (/account|profile|setting|billing|subscription|notification|manage feature|theme/.test(text)) return 'Account'
  if (/social|community|feed|club|message|story/.test(text)) return 'Social'
  if (/clinical|score|risk|emergency|drug|hospital|diagnos|medical|emr/.test(text)) return 'Clinical'
  if (/learn|study|education|library|evidence|exam|osce|research/.test(text)) return 'Learn'
  if (/mind|mental|mood|gratitude|resilience|stress|breath/.test(text)) return 'Mind'
  if (/run|training|workout|fitness|sport|endurance|zone|strength|movement/.test(text)) return 'Fitness'
  if (/body|sleep|recovery|nutrition|heart|health|longevity|vital|lab|wearable/.test(text)) return 'Body'
  if (/calculator|tool|simulat|tracker|data|search/.test(text)) return 'Tools'
  return 'Daily'
}

export function domainForCategory(category: CapabilityCategory): CapabilityDomain {
  if (['Daily', 'Body', 'Fitness', 'Mind'].includes(category)) return 'Your Body'
  if (['Clinical', 'Learn', 'Tools'].includes(category)) return 'Clinical'
  return 'For You'
}

export function canonicalCapabilityRoute(to: string) {
  return CANONICAL_REDIRECTS[to] ?? to
}

function convergedSurface(route: string, domain: CapabilityDomain) {
  if (domain === 'Your Body') return route.startsWith('/fitness-hub')
  if (domain === 'Clinical') return route.startsWith('/learn') || route.startsWith('/clinical')
  return route.startsWith('/?t=') || route.startsWith('/for-you')
}

/**
 * Capability convergence is a product-architecture metric:
 * `Convergence = unique capabilities already routed through their domain's
 * super-page surface / total unique capabilities`.
 * It does not measure feature quality or completeness and never authorizes
 * deleting a legacy route.
 */
export function auditSuperPageCapabilityConvergence(features: readonly Fitur[] = FITUR_DARI_HUB) {
  const canonicalSeen = new Set<string>()
  const duplicateRoutes: string[] = []
  const capabilities = [] as Array<{
    name: string
    sourceRoute: string
    canonicalRoute: string
    category: CapabilityCategory
    domain: CapabilityDomain
    converged: boolean
    maxInteractionsFromHome: 2
  }>

  for (const feature of features) {
    if (!feature.nama.trim() || !feature.to.trim()) throw new Error('capability name and route must not be blank')
    const canonicalRoute = canonicalCapabilityRoute(feature.to.trim())
    if (!canonicalRoute.startsWith('/')) throw new Error(`capability route must be internal: ${canonicalRoute}`)
    if (canonicalSeen.has(canonicalRoute)) {
      duplicateRoutes.push(canonicalRoute)
      continue
    }
    canonicalSeen.add(canonicalRoute)
    const category = categoryForCapability(feature)
    const domain = domainForCategory(category)
    capabilities.push({
      name: feature.nama.trim(),
      sourceRoute: feature.to.trim(),
      canonicalRoute,
      category,
      domain,
      converged: convergedSurface(canonicalRoute, domain),
      maxInteractionsFromHome: 2,
    })
  }

  const convergedCount = capabilities.filter((capability) => capability.converged).length
  const legacy = capabilities.filter((capability) => !capability.converged)
  const domainCounts = capabilities.reduce<Record<CapabilityDomain, number>>((counts, capability) => {
    counts[capability.domain] += 1
    return counts
  }, { 'Your Body': 0, Clinical: 0, 'For You': 0 })

  return {
    totalRegistered: features.length,
    uniqueCapabilities: capabilities.length,
    convergedCount,
    legacyStandaloneCount: legacy.length,
    convergenceFraction: capabilities.length ? convergedCount / capabilities.length : 0,
    duplicateCanonicalRoutes: [...new Set(duplicateRoutes)].sort(),
    domainCounts,
    capabilities,
    migrationBacklog: legacy.map((capability) => ({
      name: capability.name,
      sourceRoute: capability.sourceRoute,
      canonicalRoute: capability.canonicalRoute,
      targetDomain: capability.domain,
      preserveFeature: true as const,
    })),
    boundary: {
      deleteLegacyRoutesAuthorized: false as const,
      featureDeletionAuthorized: false as const,
      maxInteractionsFromHome: 2 as const,
    },
  }
}
