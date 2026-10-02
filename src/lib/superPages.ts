import { getProductSpace, productSpaceForRoute, routePathOnly, type ProductSpaceId } from './productSpaces'

/**
 * Category pages are the product-level surfaces of Panacea.
 *
 * A page is a semantic category/lens over the same canonical human state,
 * never a feature-owned state store. Individual routes remain alive beneath
 * these categories and stay searchable.
 */
export type SuperPageId =
  | 'human'
  | 'health'
  | 'clinical'
  | 'explore'
  | 'simulate'
  | 'records'
  | 'for-you'

export type SuperPageDefinition = {
  id: SuperPageId
  label: string
  shortLabel: string
  to: string
  cue: string
  stateSource: 'canonical-human-state'
  lens: 'human' | 'health' | 'clinical' | 'knowledge' | 'simulation' | 'records' | 'personal'
}

export const SUPER_PAGES: readonly SuperPageDefinition[] = [
  {
    id: 'human',
    label: 'Human',
    shortLabel: 'Human',
    to: '/body-explorer',
    cue: 'Anatomy · physiology · imaging',
    stateSource: 'canonical-human-state',
    lens: 'human',
  },
  {
    id: 'health',
    label: 'Health',
    shortLabel: 'Health',
    to: '/fitness-hub',
    cue: 'Prevention · performance · recovery',
    stateSource: 'canonical-human-state',
    lens: 'health',
  },
  {
    id: 'clinical',
    label: 'Clinical',
    shortLabel: 'Clinical',
    to: '/clinical-hub',
    cue: 'Care · reasoning · treatment',
    stateSource: 'canonical-human-state',
    lens: 'clinical',
  },
  {
    id: 'explore',
    label: 'Explore',
    shortLabel: 'Explore',
    to: '/med-study',
    cue: 'Knowledge · evidence · education',
    stateSource: 'canonical-human-state',
    lens: 'knowledge',
  },
  {
    id: 'simulate',
    label: 'Simulate',
    shortLabel: 'Sim',
    to: '/health-simulator',
    cue: 'What-if · procedures · models',
    stateSource: 'canonical-human-state',
    lens: 'simulation',
  },
  {
    id: 'records',
    label: 'Records',
    shortLabel: 'Records',
    to: '/health-data',
    cue: 'Timeline · devices · medical record',
    stateSource: 'canonical-human-state',
    lens: 'records',
  },
  {
    id: 'for-you',
    label: 'For You',
    shortLabel: 'For You',
    to: '/?t=for-you',
    cue: 'Life · people · account',
    stateSource: 'canonical-human-state',
    lens: 'personal',
  },
] as const

const SPACE_TO_SUPERPAGE: Readonly<Record<ProductSpaceId, SuperPageId>> = {
  today: 'health',
  body: 'human',
  move: 'health',
  learn: 'explore',
  care: 'clinical',
  discover: 'simulate',
  community: 'for-you',
  system: 'for-you',
}

/**
 * Cross-cutting records are intentionally promoted out of their feature space.
 * They are the longitudinal evidence/timeline lens on the same human, not a
 * separate clinical reality.
 */
const RECORD_ROUTES = new Set([
  '/health-data',
  '/emr',
  '/logs',
])

/**
 * Longevity/wellness routes are health-state interpretation and prevention,
 * even though the legacy product-space taxonomy classified them as discovery.
 */
const HEALTH_DISCOVERY_ROUTES = new Set([
  '/wellness-hub',
  '/longevity',
  '/longevity-science',
  '/longevity-game-center',
  '/biological-age',
  '/aesthetic',
])

const PERSONAL_ROUTES = new Set([
  '/profile',
  '/notifications',
  '/notifikasi',
])

export function superPageForRoute(to: string, group = ''): SuperPageId {
  const path = routePathOnly(to)
  if (RECORD_ROUTES.has(path)) return 'records'
  if (HEALTH_DISCOVERY_ROUTES.has(path)) return 'health'
  if (PERSONAL_ROUTES.has(path)) return 'for-you'
  return SPACE_TO_SUPERPAGE[productSpaceForRoute(to, group)]
}

export function getSuperPage(id: SuperPageId): SuperPageDefinition {
  return SUPER_PAGES.find((space) => space.id === id) ?? SUPER_PAGES[0]
}

export function superPageEntryForRoute(to: string, group = ''): string {
  return getSuperPage(superPageForRoute(to, group)).to
}

export type CategoryPageContext = {
  category: SuperPageDefinition
  productSpace: ReturnType<typeof getProductSpace>
  canonicalStateSource: 'canonical-human-state'
  projectionModel: 'shared-state-category-lens'
  connectedCategories: readonly SuperPageId[]
}

/**
 * Integration contract for every category page.
 *
 * All category pages project the same canonical human state. Changing category
 * changes the lens and task context, not the person/state being represented.
 * The connected category IDs are deliberately explicit so future contextual
 * navigation can reuse this contract rather than inventing page-local bridges.
 */
export function categoryPageContextForRoute(to: string, group = ''): CategoryPageContext {
  const category = getSuperPage(superPageForRoute(to, group))
  return {
    category,
    productSpace: getProductSpace(productSpaceForRoute(to, group)),
    canonicalStateSource: 'canonical-human-state',
    projectionModel: 'shared-state-category-lens',
    connectedCategories: SUPER_PAGES
      .filter((candidate) => candidate.id !== category.id)
      .map((candidate) => candidate.id),
  }
}

/**
 * Category page that must be marked active in the command drawer.
 *
 * Home is an entry surface, not a category. Only explicit ?t=for-you makes
 * For You active on '/'. Every child route resolves to exactly one category.
 */
export function activeSuperPageForLocation(
  pathname: string,
  search = '',
  group = '',
): SuperPageId | null {
  const path = routePathOnly(pathname)
  if (path === '/') {
    return new URLSearchParams(search).get('t') === 'for-you' ? 'for-you' : null
  }
  return superPageForRoute(pathname, group)
}

/**
 * One compact location line: Category page -> product space -> feature view.
 *
 * This preserves deep feature routes without presenting each feature as a
 * first-class page. Example: Health -> Move -> Training.
 */
export function navigationHierarchyForRoute(
  to: string,
  group = '',
  pageTitle = '',
  options: { compactSuperPage?: boolean } = {},
): string[] {
  const context = categoryPageContextForRoute(to, group)
  const labels = [
    options.compactSuperPage ? context.category.shortLabel : context.category.label,
    context.productSpace.shortLabel,
    pageTitle.trim(),
  ]
  const seen = new Set<string>()

  return labels.filter((label) => {
    if (!label) return false
    const key = label.toLocaleLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
