// Pure 360° real-time orbital projection, inertia physics & full-catalog workflow
// routing domain for Home's Astral Bio-Constellation Launcher.
// Side-effect free: no DOM, window, storage, clock, randomness, or network.

import { rutaKanonik, saringPeran, type EntriKatalog } from '../../lib/katalogLengkap.ts'
import { SUPER_PAGES, superPageForRoute, type SuperPageDefinition, type SuperPageId } from '../../lib/superPages.ts'

export type WorkflowLensId = 'all' | 'healthcare' | 'sport-medicine' | 'education'

export type BodyLayerId =
  | 'surface'
  | 'skeletal'
  | 'muscular'
  | 'cardiovascular'
  | 'nervous'
  | 'visceral'
  | 'lymphoid'

export type AstralAccentToken = 'emerald' | 'cyan' | 'amber' | 'violet' | 'teal' | 'sky' | 'lime'

export interface WorkflowLensDefinition {
  id: WorkflowLensId
  label: string
  cue: string
  accent: AstralAccentToken
  bodyLayers: readonly BodyLayerId[]
}

export const WORKFLOW_LENSES: readonly WorkflowLensDefinition[] = [
  {
    id: 'all',
    label: 'All 360°',
    cue: 'Full Panacea bio-universe',
    accent: 'emerald',
    bodyLayers: ['skeletal', 'muscular', 'cardiovascular'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    cue: 'Clinical care, imaging & pharmacology',
    accent: 'cyan',
    bodyLayers: ['visceral', 'cardiovascular', 'nervous'],
  },
  {
    id: 'sport-medicine',
    label: 'Sport Medicine',
    cue: 'Performance, biomechanics & recovery',
    accent: 'lime',
    bodyLayers: ['muscular', 'skeletal', 'cardiovascular'],
  },
  {
    id: 'education',
    label: 'Education',
    cue: 'MedStudy, OSCE, anatomy & science',
    accent: 'violet',
    bodyLayers: ['skeletal', 'nervous', 'visceral'],
  },
] as const

export interface BodyMediatorPortal {
  id: 'your-body' | 'clinical' | 'for-you' | 'open-3d'
  label: string
  cue: string
  to: string
  accent: AstralAccentToken
}

export const BODY_MEDIATOR_PORTALS: readonly BodyMediatorPortal[] = [
  {
    id: 'your-body',
    label: 'Your Body',
    cue: 'Body status & sport',
    to: '/fitness-hub',
    accent: 'lime',
  },
  {
    id: 'clinical',
    label: 'Clinical',
    cue: 'Care & reasoning',
    to: '/clinical-hub',
    accent: 'cyan',
  },
  {
    id: 'for-you',
    label: 'For You',
    cue: 'Life, feed & habits',
    to: '/?t=for-you',
    accent: 'amber',
  },
  {
    id: 'open-3d',
    label: 'Open 3D',
    cue: '3D Body Exposure',
    to: '/body-exposure',
    accent: 'emerald',
  },
] as const

/**
 * Red-light encounter/signing/follow-up flows (`AUDIT_STATUS_REVAMP_UI.md` A4-A8)
 * and privileged admin/owner routes stay blocked fail-closed from the discovery hub.
 */
export const ASTRAL_BLOCKED_ROUTES: ReadonlySet<string> = new Set([
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

const REALM_ACCENTS: Readonly<Record<SuperPageId, AstralAccentToken>> = {
  human: 'emerald',
  health: 'lime',
  clinical: 'cyan',
  explore: 'violet',
  simulate: 'teal',
  records: 'sky',
  'for-you': 'amber',
}

export interface AstralFeatureEntry {
  to: string
  canonicalTo: string
  label: string
  summary: string
  group: string
  keywords: string
  realm: SuperPageId
  workflows: readonly Exclude<WorkflowLensId, 'all'>[]
}

export interface AstralRealmNode {
  space: SuperPageDefinition
  accent: AstralAccentToken
  features: readonly AstralFeatureEntry[]
  featureCount: number
}

export interface AstralCatalog {
  totalFeatures: number
  realms: readonly AstralRealmNode[]
  allFeatures: readonly AstralFeatureEntry[]
}

export interface ProjectedOrbitNode {
  index: number
  angleDeg: number
  depth: number
  xPct: number
  yPct: number
  scale: number
  opacity: number
  zIndex: number
  isFront: boolean
}

function stripLeadingSymbol(label: string): string {
  return label.replace(/^[^\p{L}\p{N}]+/u, '').trim() || label.trim()
}

export function classifyFeatureWorkflows(
  entry: EntriKatalog,
  realm: SuperPageId,
): readonly Exclude<WorkflowLensId, 'all'>[] {
  const haystack = `${entry.to} ${entry.label} ${entry.apa} ${entry.kw} ${entry.group}`.toLowerCase()
  const out = new Set<Exclude<WorkflowLensId, 'all'>>()

  if (
    realm === 'clinical' ||
    realm === 'records' ||
    /clinical|score|risk|emergency|drug|pharmacy|hospital|lab|calc|patient|triage|ecg|emr|disease|therapy|dka|sofa|meld|wells|grace|timi|qtc|stroke|bleed|allergy|vaccine|donor|pain/.test(
      haystack,
    )
  ) {
    out.add('healthcare')
  }

  if (
    realm === 'health' ||
    /sport|fitness|workout|training|athlete|running|lari|cycling|sepeda|swim|renang|recovery|readiness|sleep|tidur|hrv|vo2|gait|gerak|endurance|crossfit|hyrox|calisthenic|nutrition|gizi|macro|hydration|longevity|fasting|sauna|thermal|body-battery|vitals/.test(
      haystack,
    )
  ) {
    out.add('sport-medicine')
  }

  if (
    realm === 'explore' ||
    realm === 'human' ||
    realm === 'simulate' ||
    /study|osce|curriculum|knowledge|anatomy|anatomi|physiology|fisiologi|radiology|genome|gene|dna|evidence|trial|translator|primer|explain|tutorial|science|frontier|simulator|fetal|canonical|body-exposure|rppg|vocal|micro|cell/.test(
      haystack,
    )
  ) {
    out.add('education')
  }

  if (out.size === 0) {
    out.add('healthcare')
    out.add('education')
  }

  return [...out]
}

export function buildAstralCatalog(entries: readonly EntriKatalog[], role: string): AstralCatalog {
  const allowed = saringPeran(entries, role)
  const seen = new Set<string>()
  const buckets = new Map<SuperPageId, AstralFeatureEntry[]>()
  for (const space of SUPER_PAGES) buckets.set(space.id, [])

  for (const raw of allowed) {
    const baseRoute = raw.to.split('#')[0]?.split('?')[0] ?? '/'
    if (
      raw.to === '/' ||
      raw.to === '/semua-fitur' ||
      baseRoute === '/semua-fitur' ||
      ASTRAL_BLOCKED_ROUTES.has(raw.to) ||
      ASTRAL_BLOCKED_ROUTES.has(baseRoute)
    ) {
      continue
    }

    const canonicalTo = rutaKanonik(raw.to)
    if (ASTRAL_BLOCKED_ROUTES.has(canonicalTo) || seen.has(canonicalTo)) continue
    seen.add(canonicalTo)

    const realm = superPageForRoute(raw.to, raw.group)
    const label = stripLeadingSymbol(raw.label)
    const feature: AstralFeatureEntry = {
      to: raw.to,
      canonicalTo,
      label,
      summary: raw.apa.trim() || `${raw.group} workspace`,
      group: raw.group,
      keywords: `${label} ${raw.apa} ${raw.kw} ${raw.group} ${raw.to}`.toLowerCase(),
      realm,
      workflows: classifyFeatureWorkflows(raw, realm),
    }

    buckets.get(realm)?.push(feature)
  }

  const realms: AstralRealmNode[] = SUPER_PAGES.map((space) => {
    const list = buckets.get(space.id) ?? []
    return {
      space,
      accent: REALM_ACCENTS[space.id],
      features: list,
      featureCount: list.length,
    }
  })

  const allFeatures = realms.flatMap((r) => r.features)
  return {
    totalFeatures: allFeatures.length,
    realms,
    allFeatures,
  }
}

export function filterAstralCatalog(
  catalog: AstralCatalog,
  lens: WorkflowLensId,
  query: string,
): {
  matchingTotal: number
  realms: readonly AstralRealmNode[]
  matchingFeatures: readonly AstralFeatureEntry[]
} {
  const needle = query.trim().toLowerCase()
  const matchesEntry = (entry: AstralFeatureEntry) => {
    const lensOk = lens === 'all' || entry.workflows.includes(lens)
    if (!lensOk) return false
    if (!needle) return true
    return entry.keywords.includes(needle)
  }

  const realms: AstralRealmNode[] = catalog.realms.map((node) => {
    const features = node.features.filter(matchesEntry)
    return {
      space: node.space,
      accent: node.accent,
      features,
      featureCount: features.length,
    }
  })
  const matchingFeatures = realms.flatMap((r) => r.features)
  return {
    matchingTotal: matchingFeatures.length,
    realms,
    matchingFeatures,
  }
}

export function normalizeAngleDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  const mod = deg % 360
  return mod < 0 ? mod + 360 : mod === 0 ? 0 : mod
}

export function shortestAngularDeltaDeg(fromDeg: number, toDeg: number): number {
  if (!Number.isFinite(fromDeg) || !Number.isFinite(toDeg)) return 0
  const raw = normalizeAngleDeg(toDeg) - normalizeAngleDeg(fromDeg)
  let wrapped = ((raw + 180) % 360 + 360) % 360 - 180
  if (wrapped === -180) wrapped = 180
  return wrapped === 0 ? 0 : wrapped
}

export function targetYawForIndex(count: number, index: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0
  const safeIndex = ((Math.trunc(index) % count) + count) % count
  const step = 360 / count
  return normalizeAngleDeg(-safeIndex * step)
}

export function focusedIndexForYaw(count: number, yawDeg: number): number {
  if (!Number.isFinite(count) || count <= 1) return 0
  const safeYaw = normalizeAngleDeg(yawDeg)
  const step = 360 / count
  let bestIdx = 0
  let bestCos = -Infinity
  for (let i = 0; i < count; i++) {
    const angleRad = (normalizeAngleDeg(i * step + safeYaw) * Math.PI) / 180
    const c = Math.cos(angleRad)
    if (c > bestCos) {
      bestCos = c
      bestIdx = i
    }
  }
  return bestIdx
}

export function stepOrbitPhysics(
  state: { yawDeg: number; velocityDegPerSec: number; targetYawDeg: number | null },
  dtSec: number,
  opts?: { autoDriftDegPerSec?: number; damping?: number },
): { yawDeg: number; velocityDegPerSec: number; settled: boolean } {
  const safeDt = Number.isFinite(dtSec) ? Math.max(0, Math.min(0.05, dtSec)) : 0
  const safeYaw = normalizeAngleDeg(state.yawDeg)
  const safeVel = Number.isFinite(state.velocityDegPerSec) ? state.velocityDegPerSec : 0

  if (state.targetYawDeg !== null && Number.isFinite(state.targetYawDeg)) {
    const target = normalizeAngleDeg(state.targetYawDeg)
    const delta = shortestAngularDeltaDeg(safeYaw, target)
    if (Math.abs(delta) <= 0.25) {
      return { yawDeg: target, velocityDegPerSec: 0, settled: true }
    }
    const factor = 1 - Math.exp(-safeDt * 11)
    const nextYaw = normalizeAngleDeg(safeYaw + delta * factor)
    return { yawDeg: nextYaw, velocityDegPerSec: 0, settled: false }
  }

  const autoDrift = Number.isFinite(opts?.autoDriftDegPerSec) ? (opts?.autoDriftDegPerSec ?? 0) : 0
  const baseDamping = Number.isFinite(opts?.damping) ? Math.max(0.5, Math.min(0.995, opts?.damping ?? 0.92)) : 0.92
  const frameDamping = Math.pow(baseDamping, safeDt * 60)
  const nextVelRaw = safeVel * frameDamping
  const nextVel = Math.abs(nextVelRaw) < 0.25 ? 0 : nextVelRaw
  const nextYaw = normalizeAngleDeg(safeYaw + (nextVel + autoDrift) * safeDt)
  const settled = nextVel === 0 && Math.abs(autoDrift) < 0.001

  return { yawDeg: nextYaw, velocityDegPerSec: nextVel, settled }
}

export function projectOrbit360(
  count: number,
  yawDeg: number,
  pitchDeg = -18,
): ProjectedOrbitNode[] {
  if (!Number.isFinite(count) || count <= 0) return []
  const n = Math.floor(count)
  if (n <= 0) return []

  const safeYaw = normalizeAngleDeg(yawDeg)
  const clampedPitch = Number.isFinite(pitchDeg) ? Math.max(-35, Math.min(35, pitchDeg)) : -18
  const pitchRad = (clampedPitch * Math.PI) / 180
  const step = 360 / n
  const frontIdx = focusedIndexForYaw(n, safeYaw)

  const nodes: ProjectedOrbitNode[] = []
  for (let i = 0; i < n; i++) {
    const angleDeg = normalizeAngleDeg(i * step + safeYaw)
    const rad = (angleDeg * Math.PI) / 180
    const cosA = Math.cos(rad)
    const sinA = Math.sin(rad)
    const depth = (cosA + 1) / 2
    const xPct = 50 + sinA * 38
    const yPct = 50 - Math.sin(pitchRad) * cosA * 105
    const scale = 0.86 + 0.18 * depth
    const opacity = 0.5 + 0.5 * depth
    const zIndex = Math.round(10 + depth * 40)

    nodes.push({
      index: i,
      angleDeg,
      depth,
      xPct,
      yPct,
      scale,
      opacity,
      zIndex,
      isFront: i === frontIdx,
    })
  }
  return nodes
}
