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
 * not a folder containing hundreds of mini-apps. These spaces are conceptual
 * neighborhoods, not separate-page mandates. Similar capabilities deliberately
 * converge into the same canonical workspace and open as subviews there.
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
    to: '/fitness-hub?view=body-exposure',
    eyebrow: 'See the human system',
    accent: 'emerald',
  },
  {
    id: 'move',
    label: 'Move & Recover',
    shortLabel: 'Move',
    description: 'Training, sleep, recovery, readiness and performance tools.',
    to: '/fitness-hub?view=training',
    eyebrow: 'Act on your body',
    accent: 'blue',
  },
  {
    id: 'learn',
    label: 'Learn',
    shortLabel: 'Learn',
    description: 'Medical knowledge, evidence, calculators and structured study.',
    to: '/learn',
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
    to: '/learn?t=discovery',
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
 *
 * Rule: capability count may grow; first-class destinations should not grow at
 * the same rate. A new tool joins an existing workspace unless its user goal,
 * data model and interaction model are genuinely different.
 */
export const SECONDARY_DAILY_DESTINATIONS: ReadonlySet<string> = new Set([
  '/tutorial',
  '/latihan',
  '/workout',
  '/recovery',
  '/tubuh',
  '/nutrition',
  '/radiology',
  '/electrophysiology',
  '/genome-lab',
  '/knowledge-bridge',
  '/frontier-health',
  '/health-data',
  '/med-study?bagian=usmle',
  '/evidence',
  '/osce-ukmppd',
  '/clinical-calculators',
  '/drug-info',
  '/emr',
  '/feed',
  '/messages',
  '/scripture',
  '/owner-analytics',
])

/**
 * Shell representatives are rewritten to the canonical workspace URL. This is
 * the important distinction between hiding and merging: the menu does not just
 * become shorter; several formerly separate doors now enter the same workspace
 * and reveal their capability as a subview.
 */
const CANONICAL_PRIMARY_WORKSPACES: Readonly<Record<string, { to: string; label: string }>> = {
  '/': { to: '/', label: 'Home' },
  '/semua-fitur': { to: '/semua-fitur', label: 'All Features' },
  '/body-explorer': { to: '/fitness-hub', label: 'Your Body' },
  '/med-study': { to: '/learn', label: 'Learn' },
  '/clinical-hub': { to: '/clinical-hub', label: 'Services' },
  '/community': { to: '/community', label: 'Community' },
  '/emergency': { to: '/emergency', label: 'Emergency' },
  '/profile': { to: '/profile', label: 'Profile' },
}

function rewritePrimaryItem<T extends { to: string }>(item: T, target: { to: string; label: string }): T {
  const next: Record<string, unknown> = { ...item, to: target.to }
  if ('label' in item) next.label = target.label
  // Put the small set of everyday destinations in one flat section. Role-
  // specific management and account controls keep their original groups.
  if ('group' in item) next.group = 'Home'
  return next as T
}

/** Shell's daily nav has these sentinels; feature directories do not. */
export function looksLikePrimaryShellNavigation<T extends { to: string }>(items: readonly T[]): boolean {
  const routes = new Set(items.map((item) => item.to))
  return routes.has('/') && routes.has('/semua-fitur') && routes.has('/settings')
}

export function compactPrimaryNavigation<T extends { to: string }>(items: readonly T[]): T[] {
  if (!looksLikePrimaryShellNavigation(items)) return [...items]

  const compact: T[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (SECONDARY_DAILY_DESTINATIONS.has(item.to)) continue

    const target = CANONICAL_PRIMARY_WORKSPACES[item.to]
    const next = target ? rewritePrimaryItem(item, target) : item
    if (seen.has(next.to)) continue
    seen.add(next.to)
    compact.push(next)
  }

  return compact
}
