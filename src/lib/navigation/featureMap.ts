import { SUPER_PAGES, superPageForRoute, type SuperPageDefinition, type SuperPageId } from '../superPages'
import { routePathOnly } from '../productSpaces'

/**
 * Feature map — the game-style "world map" over Panacea's seven canonical
 * category pages (src/lib/superPages.ts).
 *
 * Interaction law (owner directive, 2026-11-20):
 * - at most six primary choices on any one screen of the map;
 * - every mapped feature is at most two taps from Home (world -> feature);
 * - only routes that already exist in the router; no new top-level page;
 * - grouping never invents a category: each feature must resolve to the same
 *   category through the canonical `superPageForRoute` resolver.
 *
 * Pure module: no DOM, storage, clock, randomness or network.
 */

export const FEATURE_MAP_LIMIT = 6
export const FEATURE_MAP_LABEL_MAX_WORDS = 3
export const FEATURE_MAP_CUE_MAX_WORDS = 6

/**
 * Home is the For You entry surface, so the map's orbit on Home shows the six
 * other categories. For You stays one tap away through the Home zone rail and
 * the command bar; it is not removed.
 */
export const FEATURE_MAP_HOME_HUB: SuperPageId = 'for-you'

export type FeatureMapNode = {
  id: string
  label: string
  cue: string
  to: string
}

/**
 * Routes the map must never surface:
 * - encounter / signing / follow-up flows still NOT_CHECKED in the Alpha
 *   ledger (A4-A8, red light in DOCS/product/AUDIT_STATUS_REVAMP_UI.md);
 * - privileged surfaces whose access must come from server-verified roles.
 */
export const FEATURE_MAP_BLOCKED_ROUTES: ReadonlySet<string> = new Set([
  '/visit-os',
  '/poli',
  '/consult',
  '/second-opinion',
  '/orders',
  '/doctor-review',
  '/doctor-review/lab-results',
  '/doctor-review/body',
  '/review',
  '/owner',
  '/owner-analytics',
  '/admin',
])

export const FEATURE_MAP: Readonly<Record<SuperPageId, readonly FeatureMapNode[]>> = {
  human: [
    { id: 'body-explorer', label: 'Body', cue: '3D anatomy layers', to: '/body-explorer' },
    { id: 'organ-vitality', label: 'Organs', cue: 'Organ by organ', to: '/organ-vitality' },
    { id: 'radiology', label: 'Imaging', cue: 'Radiology planes', to: '/radiology' },
    { id: 'electrophysiology', label: 'Heart signals', cue: 'ECG and rhythm', to: '/electrophysiology' },
    { id: 'genome-lab', label: 'Genome', cue: 'Genes and variants', to: '/genome-lab' },
    { id: 'rppg-heart-rate', label: 'Camera pulse', cue: 'Pulse from camera', to: '/rppg-heart-rate' },
  ],
  health: [
    { id: 'fitness-hub', label: 'Your Body', cue: 'Daily body status', to: '/fitness-hub' },
    { id: 'training', label: 'Training', cue: 'Plan and log', to: '/latihan' },
    { id: 'recovery', label: 'Recovery', cue: 'Sleep and strain', to: '/recovery' },
    { id: 'readiness', label: 'Readiness', cue: 'Ready to train', to: '/readiness' },
    { id: 'longevity', label: 'Longevity', cue: 'Healthy aging', to: '/longevity' },
    { id: 'wellness', label: 'Wellness', cue: 'Mind and habits', to: '/wellness-hub' },
  ],
  clinical: [
    { id: 'clinical-hub', label: 'Care', cue: 'Your care hub', to: '/clinical-hub' },
    { id: 'ask', label: 'Ask', cue: 'AI draft answers', to: '/chatbot' },
    { id: 'emergency', label: 'Emergency', cue: 'Urgent help', to: '/emergency' },
    { id: 'hospitals', label: 'Hospitals', cue: 'Find a facility', to: '/hospitals' },
    { id: 'medicines', label: 'Medicines', cue: 'Reminders', to: '/med-reminders' },
    { id: 'pharmacy', label: 'Pharmacy', cue: 'Find medicines', to: '/pharmacy' },
  ],
  explore: [
    { id: 'med-study', label: 'Study', cue: 'Medical learning', to: '/med-study' },
    { id: 'clinical-scores', label: 'Scores', cue: 'Clinical scores', to: '/clinical-scores' },
    { id: 'calculators', label: 'Calculators', cue: 'Clinical math', to: '/clinical-calculators' },
    { id: 'osce', label: 'OSCE', cue: 'Exam stations', to: '/osce-ukmppd' },
    { id: 'knowledge', label: 'Knowledge', cue: 'Linked concepts', to: '/knowledge-bridge' },
    { id: 'lab-decoder', label: 'Lab decoder', cue: 'Read lab terms', to: '/lab-decoder' },
  ],
  simulate: [
    { id: 'body-exposure', label: 'Body Exposure', cue: '3D whole body', to: '/body-exposure' },
    { id: 'health-simulator', label: 'Simulator', cue: 'What-if models', to: '/health-simulator' },
    { id: 'bio-simulators', label: 'Bio models', cue: 'Physiology models', to: '/bio-simulators' },
    { id: 'data-lab', label: 'Data lab', cue: 'Explore your data', to: '/data-lab' },
    { id: 'scan', label: 'Scan', cue: 'Guided body scan', to: '/scan' },
    { id: 'frontier', label: 'Frontier', cue: 'Research models', to: '/frontier-health' },
  ],
  records: [
    { id: 'health-data', label: 'Health data', cue: 'Timeline and import', to: '/health-data' },
    { id: 'emr', label: 'Record', cue: 'Medical record', to: '/emr' },
    { id: 'logs', label: 'Logs', cue: 'Daily notes', to: '/logs' },
  ],
  'for-you': [
    { id: 'profile', label: 'Profile', cue: 'You and goals', to: '/profile' },
    { id: 'community', label: 'Community', cue: 'People and clubs', to: '/community' },
    { id: 'messages', label: 'Messages', cue: 'Conversations', to: '/messages' },
    { id: 'notifications', label: 'Alerts', cue: 'Notifications', to: '/notifikasi' },
    { id: 'clubs', label: 'Clubs', cue: 'Shared journeys', to: '/clubs' },
    { id: 'settings', label: 'Settings', cue: 'Account and privacy', to: '/settings' },
  ],
}

/** The six worlds shown in the orbit when the map is entered from `hub`. */
export function featureMapWorlds(hub: SuperPageId = FEATURE_MAP_HOME_HUB): SuperPageDefinition[] {
  return SUPER_PAGES.filter((page) => page.id !== hub)
}

export function featureMapNodes(category: SuperPageId, map = FEATURE_MAP): readonly FeatureMapNode[] {
  return map[category] ?? []
}

export type OrbitPoint = { x: number; y: number }

/**
 * Even radial layout in percent of a square stage, first node at 12 o'clock,
 * clockwise. Deterministic so screenshots and tests are stable.
 */
export function orbitLayout(count: number, radiusPct = 37): OrbitPoint[] {
  if (!Number.isInteger(count) || count <= 0) return []
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
    return {
      x: Math.round((50 + radiusPct * Math.cos(angle)) * 100) / 100,
      y: Math.round((50 + radiusPct * Math.sin(angle)) * 100) / 100,
    }
  })
}

/** Smallest centre-to-centre distance between orbit nodes, in px, for a stage width. */
export function minimumOrbitGapPx(count: number, stagePx: number, radiusPct = 37): number {
  const points = orbitLayout(count, radiusPct)
  if (points.length < 2) return Number.POSITIVE_INFINITY
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = ((points[i].x - points[j].x) / 100) * stagePx
      const dy = ((points[i].y - points[j].y) / 100) * stagePx
      min = Math.min(min, Math.hypot(dx, dy))
    }
  }
  return min
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const FORBIDDEN_COPY = /\b(lokal|local|compliant|compliance|certified|tersertifikasi|kepatuhan|hipaa|fda|approved|validated|terverifikasi)\b/i

export type FeatureMapAuditOptions = {
  routes: readonly string[]
  resolve?: (to: string) => SuperPageId
  limit?: number
}

/**
 * Named problems for a candidate map. Empty array means the map honours the
 * interaction law. Fail-closed: an empty router inventory is itself a problem.
 */
export function auditFeatureMap(
  map: Readonly<Record<string, readonly FeatureMapNode[]>>,
  { routes, resolve = superPageForRoute, limit = FEATURE_MAP_LIMIT }: FeatureMapAuditOptions,
): string[] {
  const problems: string[] = []
  const routeSet = new Set(routes)
  if (routeSet.size === 0) problems.push('router inventory is empty')
  const categoryIds = new Set<string>(SUPER_PAGES.map((page) => page.id))
  const seenRoutes = new Map<string, string>()

  for (const id of categoryIds) {
    if (!map[id]) problems.push(`${id}: category missing from map`)
  }

  for (const [category, nodes] of Object.entries(map)) {
    if (!categoryIds.has(category)) {
      problems.push(`${category}: not a canonical category`)
      continue
    }
    if (nodes.length === 0) problems.push(`${category}: no features mapped`)
    if (nodes.length > limit) problems.push(`${category}: ${nodes.length} choices > ${limit}`)
    const seenIds = new Set<string>()
    for (const node of nodes) {
      const path = routePathOnly(node.to)
      if (seenIds.has(node.id)) problems.push(`${category}/${node.id}: duplicate id`)
      seenIds.add(node.id)
      const owner = seenRoutes.get(path)
      if (owner) problems.push(`${category}/${node.id}: route ${path} already mapped by ${owner}`)
      seenRoutes.set(path, `${category}/${node.id}`)
      if (!routeSet.has(path)) problems.push(`${category}/${node.id}: route ${path} does not exist in the router`)
      if (FEATURE_MAP_BLOCKED_ROUTES.has(path)) problems.push(`${category}/${node.id}: route ${path} is blocked (red light or privileged)`)
      const resolved = resolve(node.to)
      if (resolved !== category) problems.push(`${category}/${node.id}: route ${path} resolves to ${resolved}`)
      if (!node.label.trim()) problems.push(`${category}/${node.id}: empty label`)
      if (wordCount(node.label) > FEATURE_MAP_LABEL_MAX_WORDS) problems.push(`${category}/${node.id}: label over ${FEATURE_MAP_LABEL_MAX_WORDS} words`)
      if (wordCount(node.cue) > FEATURE_MAP_CUE_MAX_WORDS) problems.push(`${category}/${node.id}: cue over ${FEATURE_MAP_CUE_MAX_WORDS} words`)
      if (FORBIDDEN_COPY.test(node.label) || FORBIDDEN_COPY.test(node.cue)) problems.push(`${category}/${node.id}: forbidden copy`)
    }
  }
  return problems
}

/** Router inventory parsed from src/main.tsx source text (pure: caller reads the file). */
export function routesFromRouterSource(source: string): string[] {
  return [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]).filter((path) => path !== '*')
}
