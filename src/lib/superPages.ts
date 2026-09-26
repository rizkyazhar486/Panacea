import { getProductSpace, productSpaceForRoute, routePathOnly, type ProductSpaceId } from './productSpaces'

export type SuperPageId = 'body' | 'clinical' | 'for-you'

export type SuperPageDefinition = {
  id: SuperPageId
  label: string
  shortLabel: string
  to: string
  cue: string
}

export const SUPER_PAGES: readonly SuperPageDefinition[] = [
  { id: 'body', label: 'Your Body', shortLabel: 'Body', to: '/fitness-hub', cue: 'Body · movement · recovery' },
  { id: 'clinical', label: 'Clinical', shortLabel: 'Clinical', to: '/clinical-hub', cue: 'Care · evidence · intelligence' },
  { id: 'for-you', label: 'For You', shortLabel: 'For You', to: '/?t=for-you', cue: 'Life · people · account' },
] as const

const SPACE_TO_SUPERPAGE: Readonly<Record<ProductSpaceId, SuperPageId>> = {
  today: 'for-you',
  body: 'body',
  move: 'body',
  learn: 'clinical',
  care: 'clinical',
  discover: 'clinical',
  community: 'for-you',
  system: 'for-you',
}

const BODY_DISCOVERY_ROUTES = new Set([
  '/health-simulator',
  '/wellness-hub',
  '/longevity',
  '/longevity-science',
  '/longevity-game-center',
  '/biological-age',
])

export function superPageForRoute(to: string, group = ''): SuperPageId {
  const path = routePathOnly(to)
  if (BODY_DISCOVERY_ROUTES.has(path)) return 'body'
  return SPACE_TO_SUPERPAGE[productSpaceForRoute(to, group)]
}

export function getSuperPage(id: SuperPageId): SuperPageDefinition {
  return SUPER_PAGES.find((space) => space.id === id) ?? SUPER_PAGES[0]
}

export function superPageEntryForRoute(to: string, group = ''): string {
  return getSuperPage(superPageForRoute(to, group)).to
}


/**
 * Satu baris lokasi yang memakai taksonomi yang SUDAH ada, bukan membuat
 * breadcrumb taxonomy baru. Contoh: Your Body › Move › Training.
 *
 * Label yang sama dibuang bila route-level title sudah identik dengan
 * super-page atau product space (mis. /fitness-hub = Your Body › Move),
 * sehingga bilah ponsel tetap padat.
 */
export function navigationHierarchyForRoute(
  to: string,
  group = '',
  pageTitle = '',
  options: { compactSuperPage?: boolean } = {},
): string[] {
  const superPage = getSuperPage(superPageForRoute(to, group))
  const productSpace = getProductSpace(productSpaceForRoute(to, group))
  const labels = [
    options.compactSuperPage ? superPage.shortLabel : superPage.label,
    productSpace.shortLabel,
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
