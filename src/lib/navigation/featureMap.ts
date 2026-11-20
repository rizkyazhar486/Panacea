import { SUPER_PAGES, superPageForRoute, type SuperPageDefinition, type SuperPageId } from '../superPages'
import { routePathOnly } from '../productSpaces'
import { FITUR_DARI_HUB } from '../katalogFitur'

/**
 * Feature map & full-catalog visual widget engine over Panacea's seven
 * canonical category pages (src/lib/superPages.ts).
 *
 * Interaction law (owner directive, 2026-11-20):
 * - at most six primary choices on any one radial orbit slice;
 * - multi-page orbit cycling + visual widget matrix exposes 100% of safe
 *   catalogued features with custom SVG logos and dynamic mini-charts;
 * - every mapped feature is at most two taps from Home (world -> feature);
 * - only routes that already exist in the router; no new top-level page;
 * - grouping never invents a category: each feature resolves through the
 *   canonical `superPageForRoute` resolver.
 *
 * Pure module: no DOM, storage, clock, randomness or network.
 */

export const FEATURE_MAP_LIMIT = 6
export const FEATURE_MAP_LABEL_MAX_WORDS = 3
export const FEATURE_MAP_CUE_MAX_WORDS = 6

export const FEATURE_MAP_HOME_HUB: SuperPageId = 'for-you'

export type FeatureMapNode = {
  id: string
  label: string
  cue: string
  to: string
}

export type FeatureGlyphId =
  | 'heart'
  | 'brain'
  | 'lungs'
  | 'dna'
  | 'chart'
  | 'pill'
  | 'shield'
  | 'bolt'
  | 'compass'
  | 'users'
  | 'spark'
  | 'clock'
  | 'flame'
  | 'wave'
  | 'layers'
  | 'target'

export type FeatureChartKind =
  | 'sparkline'
  | 'ring'
  | 'bars'
  | 'ecg'
  | 'radar'
  | 'wave'

export type FeatureVisualWidget = {
  id: string
  label: string
  shortLabel: string
  cue: string
  to: string
  category: SuperPageId
  glyph: FeatureGlyphId
  chartKind: FeatureChartKind
  chartValues: readonly number[]
  gaugePct: number
}

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

const EXTRA_SOCIAL_AND_LIFE_ROUTES: ReadonlyArray<{ to: string; nama: string; apa: string; kw: string; grup: string }> = [
  { to: '/feed', nama: 'Social Feed', apa: 'Community updates and posts', kw: 'social feed community posts', grup: 'For You' },
  { to: '/social', nama: 'Social Hub', apa: 'Friends and circles', kw: 'social hub friends people', grup: 'For You' },
  { to: '/dek-connect', nama: 'Connect Deck', apa: 'Healthy lifestyle match deck', kw: 'connect match deck social', grup: 'For You' },
  { to: '/marketplace', nama: 'Marketplace', apa: 'Health programs and modules', kw: 'marketplace store modules', grup: 'For You' },
  { to: '/my-materials', nama: 'My Materials', apa: 'Saved study and care items', kw: 'materials saved library', grup: 'For You' },
  { to: '/atur-fitur', nama: 'Customize', apa: 'Pin and arrange widgets', kw: 'customize widgets layout', grup: 'For You' },
]

const FORBIDDEN_COPY = /\b(lokal|local|compliant|compliance|certified|tersertifikasi|kepatuhan|hipaa|fda|approved|validated|terverifikasi)\b/gi
const FORBIDDEN_COPY_TEST = /\b(lokal|local|compliant|compliance|certified|tersertifikasi|kepatuhan|hipaa|fda|approved|validated|terverifikasi)\b/i

const CHART_KINDS: readonly FeatureChartKind[] = ['sparkline', 'ring', 'bars', 'ecg', 'radar', 'wave']

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

function cleanCopy(raw: string, maxWords: number): string {
  const stripped = raw
    .replace(FORBIDDEN_COPY, '')
    .replace(/[()\[\]—–/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = stripped.split(' ').filter(Boolean).slice(0, maxWords)
  return words.join(' ') || 'Feature'
}

export function inferFeatureVisual(to: string, label: string, kw = ''): {
  glyph: FeatureGlyphId
  chartKind: FeatureChartKind
  chartValues: readonly number[]
  gaugePct: number
} {
  const hay = `${to} ${label} ${kw}`.toLowerCase()
  let glyph: FeatureGlyphId = 'chart'
  if (/heart|cardio|pulse|rppg|bpm|ecg|qtc|stroke|timi|grace|framingham|blood/.test(hay)) glyph = 'heart'
  else if (/brain|mind|mental|psych|neuro|cognitive|memory|epworth|chatbot|second/.test(hay)) glyph = 'brain'
  else if (/lung|breath|air|spo2|apnea|aa-gradient|lights-criteria|perc|wells/.test(hay)) glyph = 'lungs'
  else if (/gene|dna|snp|family|phenoage|biological-age|telomere/.test(hay)) glyph = 'dna'
  else if (/pill|drug|med|pharmacy|supplement|vaccine|empiric|therapy|alcohol|caffeine|substance/.test(hay)) glyph = 'pill'
  else if (/emergency|first-aid|allergy|shield|nrp|neonatal|resuscitation|toxin/.test(hay)) glyph = 'shield'
  else if (/connect|community|club|social|feed|message|resilience|story|donor|profile/.test(hay)) glyph = 'users'
  else if (/sleep|chronotype|fasting|clock|nap|alarm|posture-breaks/.test(hay)) glyph = 'clock'
  else if (/workout|training|athlete|lari|run|crossfit|gym|hyrox|endurance|thermal|flame|calorie|macro|nutrition/.test(hay)) glyph = 'flame'
  else if (/vocal|wave|electrophysiology|sound|binaural|fisiologi|battery|readiness/.test(hay)) glyph = 'wave'
  else if (/body|organ|anatomy|radiology|scan|fetal|dermatology|aesthetic|shape/.test(hay)) glyph = 'layers'
  else if (/compass|ikigai|harada|goal|planning|visit-prep|life/.test(hay)) glyph = 'compass'
  else if (/simulator|bio-simulator|frontier|predictive|what-if|ai|game/.test(hay)) glyph = 'spark'
  else if (/test|assessment|screen|check|target|ottawa|braden/.test(hay)) glyph = 'target'
  else if (/bolt|power|speed|energy|hydration|fluid|electrolyte/.test(hay)) glyph = 'bolt'

  const seed = hashSeed(`${to}:${label}`)
  const chartKind = CHART_KINDS[seed % CHART_KINDS.length]
  const chartValues = Array.from({ length: 6 }, (_, idx) => {
    const v = 24 + ((seed >> (idx * 3)) % 68)
    return Math.max(18, Math.min(96, v))
  })
  const gaugePct = 52 + (seed % 44)
  return { glyph, chartKind, chartValues, gaugePct }
}

function buildAllFeatureWidgets(): Readonly<Record<SuperPageId, readonly FeatureVisualWidget[]>> {
  const buckets: Record<SuperPageId, FeatureVisualWidget[]> = {
    human: [],
    health: [],
    clinical: [],
    explore: [],
    simulate: [],
    records: [],
    'for-you': [],
  }
  const seenRoutes = new Set<string>()

  // 1. Seed Page 0 of every category with the canonical top-6 FEATURE_MAP nodes.
  for (const page of SUPER_PAGES) {
    for (const node of FEATURE_MAP[page.id]) {
      const path = routePathOnly(node.to)
      if (FEATURE_MAP_BLOCKED_ROUTES.has(path) || seenRoutes.has(path)) continue
      seenRoutes.add(path)
      const vis = inferFeatureVisual(node.to, node.label, node.cue)
      buckets[page.id].push({
        id: node.id,
        label: node.label,
        shortLabel: cleanCopy(node.label, 2),
        cue: node.cue,
        to: node.to,
        category: page.id,
        ...vis,
      })
    }
  }

  // 2. Append all remaining safe capabilities from FITUR_DARI_HUB + extra social routes.
  for (const item of [...FITUR_DARI_HUB, ...EXTRA_SOCIAL_AND_LIFE_ROUTES]) {
    const path = routePathOnly(item.to)
    if (!path || path === '/' || FEATURE_MAP_BLOCKED_ROUTES.has(path) || seenRoutes.has(path)) continue
    seenRoutes.add(path)
    const category = superPageForRoute(item.to, item.grup)
    const label = cleanCopy(item.nama, FEATURE_MAP_LABEL_MAX_WORDS)
    const shortLabel = cleanCopy(item.nama, 2)
    const cue = cleanCopy(item.apa || item.grup, FEATURE_MAP_CUE_MAX_WORDS)
    const id = path.replace(/^\/+/, '').replace(/[^a-z0-9-]+/gi, '-') || 'feature'
    const vis = inferFeatureVisual(item.to, item.nama, `${item.kw} ${item.grup}`)
    buckets[category].push({
      id,
      label,
      shortLabel,
      cue,
      to: item.to,
      category,
      ...vis,
    })
  }

  return buckets
}

export const ALL_FEATURE_WIDGETS_BY_CATEGORY: Readonly<Record<SuperPageId, readonly FeatureVisualWidget[]>> =
  buildAllFeatureWidgets()

export const ALL_FEATURE_WIDGETS: readonly FeatureVisualWidget[] = SUPER_PAGES.flatMap(
  (page) => ALL_FEATURE_WIDGETS_BY_CATEGORY[page.id],
)

export function allFeatureWidgetsForCategory(category: SuperPageId): readonly FeatureVisualWidget[] {
  return ALL_FEATURE_WIDGETS_BY_CATEGORY[category] ?? []
}

export function featureOrbitPageCount(category: SuperPageId, pageSize = FEATURE_MAP_LIMIT): number {
  const list = allFeatureWidgetsForCategory(category)
  return Math.max(1, Math.ceil(list.length / Math.max(1, pageSize)))
}

export function featureOrbitPage(
  category: SuperPageId,
  pageIndex: number,
  pageSize = FEATURE_MAP_LIMIT,
): readonly FeatureVisualWidget[] {
  const list = allFeatureWidgetsForCategory(category)
  const size = Math.max(1, Math.min(FEATURE_MAP_LIMIT, pageSize))
  const totalPages = Math.max(1, Math.ceil(list.length / size))
  const safePage = ((pageIndex % totalPages) + totalPages) % totalPages
  return list.slice(safePage * size, (safePage + 1) * size)
}

/** The six worlds shown in the orbit when the map is entered from `hub`. */
export function featureMapWorlds(hub: SuperPageId = FEATURE_MAP_HOME_HUB): SuperPageDefinition[] {
  return SUPER_PAGES.filter((page) => page.id !== hub)
}

export function featureMapNodes(category: SuperPageId, map = FEATURE_MAP): readonly FeatureMapNode[] {
  return map[category] ?? []
}

export type OrbitPoint = { x: number; y: number }

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

export type FeatureMapAuditOptions = {
  routes: readonly string[]
  resolve?: (to: string) => SuperPageId
  limit?: number
}

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
      if (FORBIDDEN_COPY_TEST.test(node.label) || FORBIDDEN_COPY_TEST.test(node.cue)) problems.push(`${category}/${node.id}: forbidden copy`)
    }
  }
  return problems
}

export function routesFromRouterSource(source: string): string[] {
  return [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]).filter((path) => path !== '*')
}
