export type ProductSpaceId =
  | 'today'
  | 'body'
  | 'move'
  | 'learn'
  | 'care'
  | 'discover'
  | 'community'
  | 'system'

export type ProductSpace = {
  id: ProductSpaceId
  label: string
  shortLabel: string
  description: string
  to: string
  eyebrow: string
  accent: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate'
}

/**
 * Product-level information architecture.
 *
 * Panacea has many capabilities, but the product should feel like a small OS,
 * not a folder containing hundreds of mini-apps. These spaces are the stable
 * mental model shown to users. Individual feature routes remain alive and
 * searchable; they simply live inside one of these spaces instead of competing
 * for first-class navigation.
 */
export const PANACEA_SPACES: readonly ProductSpace[] = [
  {
    id: 'today',
    label: 'Today',
    shortLabel: 'Today',
    description: 'Your overview, health signals, profile and daily context.',
    to: '/',
    eyebrow: 'Start here',
    accent: 'cyan',
  },
  {
    id: 'body',
    label: 'Body',
    shortLabel: 'Body',
    description: 'Whole-body anatomy, physiology, imaging and personal body data.',
    to: '/body-explorer',
    eyebrow: 'See the human system',
    accent: 'emerald',
  },
  {
    id: 'move',
    label: 'Move & Recover',
    shortLabel: 'Move',
    description: 'Training, sleep, recovery, readiness and performance tools.',
    to: '/latihan',
    eyebrow: 'Act on your body',
    accent: 'blue',
  },
  {
    id: 'learn',
    label: 'Learn',
    shortLabel: 'Learn',
    description: 'Medical knowledge, evidence, calculators and structured study.',
    to: '/med-study',
    eyebrow: 'Understand',
    accent: 'violet',
  },
  {
    id: 'care',
    label: 'Care',
    shortLabel: 'Care',
    description: 'Clinical records, care planning, services and emergency access.',
    to: '/clinical-hub',
    eyebrow: 'Coordinate care',
    accent: 'rose',
  },
  {
    id: 'discover',
    label: 'Discovery',
    shortLabel: 'Discover',
    description: 'Advanced simulation, research, frontier models and data labs.',
    to: '/frontier-health',
    eyebrow: 'Explore the frontier',
    accent: 'amber',
  },
  {
    id: 'community',
    label: 'Community',
    shortLabel: 'Community',
    description: 'People, clubs, messages and shared health journeys.',
    to: '/community',
    eyebrow: 'Connect',
    accent: 'cyan',
  },
  {
    id: 'system',
    label: 'System',
    shortLabel: 'System',
    description: 'Settings, account, billing, permissions and product management.',
    to: '/settings',
    eyebrow: 'Configure',
    accent: 'slate',
  },
] as const

const EXACT_SPACE_ROUTES: Readonly<Record<ProductSpaceId, readonly string[]>> = {
  today: [
    '/', '/profile', '/health-data', '/ikhtisar', '/harian', '/tubuh', '/vitapulse',
    '/assessment', '/notifications', '/notifikasi', '/search', '/cari',
  ],
  body: [
    '/body-explorer', '/body', '/body-toolkit', '/organ-vitality', '/radiology',
    '/electrophysiology', '/genome-lab', '/gene-info', '/body-composition',
    '/rppg-heart-rate', '/vocal-biomarkers', '/snp-profiler', '/air-quality',
  ],
  move: [
    '/latihan', '/fitness-hub', '/workout', '/recovery', '/readiness', '/athlete',
    '/sports-scores', '/training-plan', '/fitness-test', '/sports-science',
    '/latihan-beban', '/movement-toolkit', '/dive-log', '/athlete-board',
  ],
  learn: [
    '/med-study', '/knowledge-bridge', '/evidence', '/clinical-calculators',
    '/calculator-hub', '/osce-ukmppd', '/drug-info', '/learn', '/tutorial',
    '/health-explained', '/lab-decoder', '/risk', '/clinical-scores',
  ],
  care: [
    '/clinical-hub', '/clinical', '/chatbot', '/emr', '/planning', '/care-episode',
    '/consult', '/hospitals', '/pharmacy', '/orders', '/second-opinion', '/emergency',
    '/med-reminders', '/family-health', '/organ-donor', '/visit-prep',
  ],
  discover: [
    '/frontier-health', '/data-lab', '/data-lab-advanced', '/health-simulator',
    '/bio-simulators', '/predictive-models-toolkit', '/reality-check', '/longevity',
    '/longevity-science', '/longevity-curriculum', '/longevity-game-center',
    '/wellness-hub', '/aesthetic', '/biological-age', '/architecture',
  ],
  community: ['/community', '/feed', '/messages', '/clubs', '/social'],
  system: [
    '/settings', '/atur-fitur', '/billing', '/pricing', '/verification', '/owner',
    '/owner-analytics', '/admin', '/editor', '/my-materials', '/marketplace',
    '/legal', '/dek-connect', '/verifikasi-connect', '/tinjau-connect',
  ],
}

const PATH_TO_SPACE = new Map<string, ProductSpaceId>()
for (const [space, routes] of Object.entries(EXACT_SPACE_ROUTES) as [ProductSpaceId, readonly string[]][]) {
  for (const route of routes) PATH_TO_SPACE.set(route, space)
}

export function routePathOnly(to: string): string {
  const clean = to.split('#', 1)[0]?.split('?', 1)[0] ?? '/'
  return clean || '/'
}

export function productSpaceForRoute(to: string, group = ''): ProductSpaceId {
  const path = routePathOnly(to)
  const exact = PATH_TO_SPACE.get(path)
  if (exact) return exact

  const g = group.toLowerCase()
  if (/fitness|move|training|sport/.test(g)) return 'move'
  if (/clinical|service|care/.test(g)) return 'care'
  if (/learn|content|calculator|lab/.test(g)) return 'learn'
  if (/health|body|longevity/.test(g)) return 'body'
  if (/community|social/.test(g)) return 'community'
  if (/manage|account|money|shop/.test(g)) return 'system'
  return 'discover'
}

export function getProductSpace(id: ProductSpaceId): ProductSpace {
  return PANACEA_SPACES.find((space) => space.id === id) ?? PANACEA_SPACES[0]
}

/**
 * Destinations kept searchable but intentionally removed from the everyday
 * menu. They are sub-tools, alternate views, or duplicated doors into a wider
 * workspace. No route is deleted by this list.
 */
export const SECONDARY_DAILY_DESTINATIONS: ReadonlySet<string> = new Set([
  '/tutorial',
  '/workout',
  '/radiology',
  '/electrophysiology',
  '/genome-lab',
  '/knowledge-bridge',
  '/frontier-health',
  '/med-study?bagian=usmle',
  '/osce-ukmppd',
  '/drug-info',
  '/clinical-hub',
  '/feed',
  '/messages',
  '/scripture',
  '/owner-analytics',
])

/** Shell's daily nav has these sentinels; feature directories do not. */
export function looksLikePrimaryShellNavigation<T extends { to: string }>(items: readonly T[]): boolean {
  const routes = new Set(items.map((item) => item.to))
  return routes.has('/') && routes.has('/semua-fitur') && routes.has('/settings')
}

export function compactPrimaryNavigation<T extends { to: string }>(items: readonly T[]): T[] {
  if (!looksLikePrimaryShellNavigation(items)) return [...items]
  return items.filter((item) => !SECONDARY_DAILY_DESTINATIONS.has(item.to))
}
