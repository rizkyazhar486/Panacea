import { routePathOnly } from './productSpaces'

/**
 * Deep links that remain fully supported but should not look like independent
 * first-class products when somebody is simply browsing Panacea.
 *
 * Most of these routes already forward into a focused tab inside a broader
 * workspace (Training, Body, Nutrition, Notes, Mental Health, References or
 * Clinical Scores). Keeping them in search is useful; rendering every one as a
 * sibling card makes the product look duplicated and fragmented.
 */
export const SECONDARY_BROWSE_DOORS: ReadonlySet<string> = new Set([
  // Training workspace tabs
  '/alat-fitness',
  '/latihan-dasar',
  '/lari-sepeda-renang',
  '/sports-lab',
  '/fitness-test',
  '/sports-science',
  '/training-plan',
  '/lab',
  '/latihan-beban',
  '/riwayat-latihan',
  '/fisiologi-latihan',
  '/alat-endurance',
  '/calisthenics',
  '/recomposition',
  '/analisis-pro',
  '/movement-toolkit',
  '/crossfit',
  '/peregangan',
  '/teknik-lari',

  // Body / recovery workspace tabs
  '/body-battery',
  '/log-detak-jantung',
  '/pola-tidur',
  '/analisis-gerak',
  '/pelacak-klinis',
  '/sleep-toolkit',
  '/posture-breaks',
  '/chronotype',
  '/sleep-apnea-screen',
  '/fasting',

  // Nutrition workspace tabs
  '/macro-lab',
  '/supplements',
  '/nutrition-toolkit',
  '/carbon-diet',
  '/caffeine',
  '/hydration',
  '/alcohol',

  // Notes / longitudinal tracking tabs
  '/logs',
  '/biological-age',
  '/vaccine-tracker',
  '/allergy-tracker',
  '/blood-donation',
  '/visit-prep',
  '/pain-diary',
  '/toxin-checklist',
  '/child-growth',
  '/dermatology-lesion-mapper',

  // Reference / learning workspace tabs
  '/evidence',
  '/lab-decoder',
  '/first-aid',
  '/health-explained',
  '/drug-info',
  '/neonatal-resuscitation-guide',
  '/empiric-therapy-reference',

  // Mind workspace tabs
  '/ikigai',
  '/mind-toolkit',
  '/mental-health-screen',
  '/substance-use-screen',
  '/resilience-stories',
  '/life-compass',

  // Clinical-score deep links. Search should still resolve these by name.
  '/risk',
  '/epworth-sleepiness',
  '/stroke-risk',
  '/wells-score',
  '/qtc-calculator',
  '/creatinine-clearance',
  '/corrected-calcium',
  '/meld-score',
  '/child-pugh-score',
  '/fena-calculator',
  '/pediatric-dka-calculator',
  '/fluid-calculators',
  '/ranson-criteria',
  '/has-bled-score',
  '/bisap-score',
  '/glasgow-blatchford-score',
  '/timi-risk-score',
  '/perc-rule',
  '/sofa-score',
  '/lights-criteria',
  '/4ts-score',
  '/serum-osmolality',
  '/ldl-calculator',
  '/padua-score',
  '/rockall-score',
  '/charlson-index',
  '/caprini-score',
  '/duke-criteria',
  '/braden-scale',
  '/grace-score',
  '/findrisc',
  '/maddrey-score',
])

/**
 * Browse is intentionally quieter than search:
 *
 * BrowseSurface = AvailableCapabilities − SecondaryDoors
 * SearchSurface = AvailableCapabilities
 *
 * No route is disabled and no capability is removed from search.
 */
export function isSecondaryBrowseDoor(to: string): boolean {
  return SECONDARY_BROWSE_DOORS.has(routePathOnly(to))
}

export function compactBrowseResults<T extends { to: string }>(items: readonly T[], hasSearchQuery: boolean): T[] {
  if (hasSearchQuery) return [...items]
  return items.filter((item) => !isSecondaryBrowseDoor(item.to))
}
