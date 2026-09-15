export const BODY_TRILLION_AXES = {
  system: [
    'cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'endocrine',
    'reproductive', 'lymphatic-immune', 'musculoskeletal', 'sensory-ent', 'integumentary-surface',
  ],
  region: [
    'whole-body', 'head', 'orbit', 'face', 'neck', 'thorax', 'heart-region', 'lung-region',
    'upper-abdomen', 'lower-abdomen', 'pelvis', 'spine', 'shoulder', 'upper-limb', 'hand',
    'hip', 'thigh', 'knee', 'lower-leg', 'foot',
  ],
  scale: [
    'body', 'system', 'organ', 'tissue', 'cell', 'organelle', 'molecular', 'gene',
  ],
  modality: [
    'anatomy', 'physiology', 'pathophysiology', 'histology', 'radiology', 'ultrasound',
    'surgery', 'pharmacology', 'biomechanics', 'embryology', 'clinical-reasoning', 'rehabilitation',
  ],
  interaction: [
    'orbit', 'explode', 'peel', 'slice', 'scrub', 'drag', 'pinch-zoom', 'trace',
    'paint', 'annotate', 'measure', 'simulate', 'quiz', 'assemble', 'navigate', 'compare',
  ],
  temporalState: [
    'static', 'heartbeat', 'respiratory-cycle', 'gait-cycle', 'acute-event', 'disease-progression',
    'healing', 'development',
  ],
  context: [
    'learn', 'explore', 'exam', 'rounds', 'emergency', 'operating-room', 'radiology-suite',
    'rehabilitation', 'sports-performance', 'research',
  ],
  visualStyle: [
    'source-realistic', 'glass-anatomy', 'spectral', 'holographic', 'dark-clinical', 'microscopic-glow',
    'cinematic', 'minimal-focus',
  ],
  learningMode: [
    'guided-tour', 'free-explore', 'challenge', 'memory-palace', 'case-mode', 'layer-by-layer',
    'compare-mode', 'story-mode',
  ],
  camera: [
    'anterior', 'posterior', 'lateral', 'oblique', 'top-down', 'first-person', 'endoscopic',
    'microscopic', 'orbiting', 'fly-through',
  ],
  overlay: [
    'none', 'labels', 'vascular', 'neural', 'lymphatic', 'force-vectors', 'flow-particles',
    'heatmap', 'timeline', 'clinical-markers',
  ],
  fidelity: [
    'draft', 'fast', 'balanced', 'high', 'ultra', 'cinematic', 'research', 'teaching',
    'mobile-optimized', 'desktop-max',
  ],
} as const

export type BodyTrillionAxisKey = keyof typeof BODY_TRILLION_AXES

export type BodyTrillionSelection = {
  [K in BodyTrillionAxisKey]: (typeof BODY_TRILLION_AXES)[K][number]
}

export interface BodyTrillionFeature {
  index: bigint
  id: string
  selection: BodyTrillionSelection
  title: string
  summary: string
  experimental: true
}

const AXIS_ENTRIES = Object.entries(BODY_TRILLION_AXES) as [BodyTrillionAxisKey, readonly string[]][]

export const BODY_TRILLION_COMBINATION_COUNT = AXIS_ENTRIES.reduce(
  (total, [, values]) => total * BigInt(values.length),
  1n,
)

function clampIndex(index: bigint) {
  if (BODY_TRILLION_COMBINATION_COUNT <= 0n) return 0n
  const normalized = index % BODY_TRILLION_COMBINATION_COUNT
  return normalized < 0n ? normalized + BODY_TRILLION_COMBINATION_COUNT : normalized
}

export function bodyTrillionFeatureAt(inputIndex: bigint): BodyTrillionFeature {
  let index = clampIndex(inputIndex)
  const decoded: Partial<Record<BodyTrillionAxisKey, string>> = {}

  for (let axisIndex = AXIS_ENTRIES.length - 1; axisIndex >= 0; axisIndex -= 1) {
    const [key, values] = AXIS_ENTRIES[axisIndex]
    const radix = BigInt(values.length)
    const valueIndex = Number(index % radix)
    decoded[key] = values[valueIndex]
    index /= radix
  }

  const selection = decoded as BodyTrillionSelection
  const canonicalIndex = clampIndex(inputIndex)
  const id = `PX-${canonicalIndex.toString(36).toUpperCase().padStart(8, '0')}`
  const title = `${selection.system} · ${selection.modality} · ${selection.interaction}`
  const summary = [
    `${selection.visualStyle} ${selection.scale} experience`,
    `focused on ${selection.region}`,
    `in ${selection.context} context`,
    `using ${selection.learningMode}`,
    `${selection.camera} camera`,
    `${selection.overlay} overlay`,
    `${selection.temporalState} temporal state`,
    `${selection.fidelity} fidelity`,
  ].join(' · ')

  return {
    index: canonicalIndex,
    id,
    selection,
    title,
    summary,
    experimental: true,
  }
}

/** Deterministic 64-bit FNV-1a style hash mapped into the trillion-scale design space. */
export function bodyTrillionIndexFromSeed(seed: string) {
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n
  const mask = 0xffffffffffffffffn
  for (const character of seed) {
    hash ^= BigInt(character.codePointAt(0) ?? 0)
    hash = (hash * prime) & mask
  }
  return hash % BODY_TRILLION_COMBINATION_COUNT
}

export function bodyTrillionFeatureFromSeed(seed: string) {
  return bodyTrillionFeatureAt(bodyTrillionIndexFromSeed(seed))
}

function xorshift64(value: bigint) {
  const mask = 0xffffffffffffffffn
  let x = value & mask
  x ^= (x << 13n) & mask
  x ^= x >> 7n
  x ^= (x << 17n) & mask
  return x & mask
}

export function bodyTrillionSample(seed: string, count = 12) {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count)))
  let state = bodyTrillionIndexFromSeed(seed) || 1n
  const seen = new Set<string>()
  const features: BodyTrillionFeature[] = []

  while (features.length < safeCount) {
    state = xorshift64(state + BigInt(features.length + 1))
    const index = state % BODY_TRILLION_COMBINATION_COUNT
    const key = index.toString()
    if (seen.has(key)) continue
    seen.add(key)
    features.push(bodyTrillionFeatureAt(index))
  }

  return features
}

export function bodyTrillionPage(start: bigint, count = 24) {
  const safeCount = Math.max(1, Math.min(200, Math.floor(count)))
  return Array.from({ length: safeCount }, (_, offset) => bodyTrillionFeatureAt(start + BigInt(offset)))
}

export function bodyTrillionAxisStats() {
  return AXIS_ENTRIES.map(([key, values]) => ({ key, count: values.length }))
}

export function bodyTrillionFormatCount() {
  return new Intl.NumberFormat('en-US').format(BODY_TRILLION_COMBINATION_COUNT)
}

export function bodyTrillionHumanCount() {
  const trillion = Number(BODY_TRILLION_COMBINATION_COUNT) / 1_000_000_000_000
  return `${trillion.toFixed(2)} trillion deterministic combinations`
}

export function bodyTrillionSelectionKey(selection: BodyTrillionSelection) {
  return AXIS_ENTRIES.map(([key]) => selection[key]).join('::')
}

export function bodyTrillionFindAxisValue(axis: BodyTrillionAxisKey, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...BODY_TRILLION_AXES[axis]]
  return BODY_TRILLION_AXES[axis].filter((value) => value.toLowerCase().includes(normalized))
}

export const BODY_TRILLION_FACTORY_META = {
  axes: AXIS_ENTRIES.length,
  combinations: BODY_TRILLION_COMBINATION_COUNT,
  allocationStrategy: 'mixed-radix-address-space',
  safety: 'experimental-visual-prototype-not-clinical-output',
} as const
