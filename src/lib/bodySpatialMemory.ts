export interface BodySpatialView {
  key: string
  cameraPosition: readonly [number, number, number]
  cameraTarget: readonly [number, number, number]
  zoom: number
  selectedNodeIds: readonly string[]
  overlay?: string
  timeline: number
  updatedAt: number
}

export interface BodySpatialMemoryState {
  currentKey?: string
  views: ReadonlyMap<string, BodySpatialView>
  maxEntries: number
}

export const BODY_SPATIAL_MEMORY_INITIAL: BodySpatialMemoryState = {
  views: new Map(),
  maxEntries: 64,
}

export function bodySpatialKey(parts: {
  system?: string
  region?: string
  mode?: string
  scale?: string
  featureId?: string
}) {
  return [parts.system ?? 'body', parts.region ?? 'whole', parts.mode ?? 'atlas', parts.scale ?? 'organ', parts.featureId ?? 'default'].join('::')
}

export function saveBodySpatialView(state: BodySpatialMemoryState, view: BodySpatialView): BodySpatialMemoryState {
  const views = new Map(state.views)
  views.set(view.key, view)

  if (views.size > state.maxEntries) {
    const oldest = [...views.values()].sort((a, b) => a.updatedAt - b.updatedAt).slice(0, views.size - state.maxEntries)
    oldest.forEach((entry) => views.delete(entry.key))
  }

  return { ...state, currentKey: view.key, views }
}

export function restoreBodySpatialView(state: BodySpatialMemoryState, key: string) {
  return state.views.get(key)
}

export function removeBodySpatialView(state: BodySpatialMemoryState, key: string): BodySpatialMemoryState {
  const views = new Map(state.views)
  views.delete(key)
  return { ...state, views, currentKey: state.currentKey === key ? undefined : state.currentKey }
}

export function clearBodySpatialMemory(state: BodySpatialMemoryState): BodySpatialMemoryState {
  return { ...state, currentKey: undefined, views: new Map() }
}

export function bodySpatialMemoryJson(state: BodySpatialMemoryState) {
  return JSON.stringify({
    currentKey: state.currentKey,
    maxEntries: state.maxEntries,
    views: [...state.views.values()],
  })
}

export function bodySpatialMemoryFromJson(serialized: string): BodySpatialMemoryState {
  try {
    const parsed = JSON.parse(serialized) as { currentKey?: string; maxEntries?: number; views?: BodySpatialView[] }
    const views = new Map<string, BodySpatialView>()
    for (const view of parsed.views ?? []) {
      if (!view?.key || !Array.isArray(view.cameraPosition) || !Array.isArray(view.cameraTarget)) continue
      views.set(view.key, view)
    }
    return {
      currentKey: parsed.currentKey,
      maxEntries: Math.max(8, Math.min(256, parsed.maxEntries ?? 64)),
      views,
    }
  } catch {
    return BODY_SPATIAL_MEMORY_INITIAL
  }
}

export function saveBodySpatialMemoryToSession(state: BodySpatialMemoryState, storageKey = 'panaceamed:body-spatial-memory') {
  try {
    sessionStorage.setItem(storageKey, bodySpatialMemoryJson(state))
    return true
  } catch {
    return false
  }
}

export function loadBodySpatialMemoryFromSession(storageKey = 'panaceamed:body-spatial-memory') {
  try {
    const value = sessionStorage.getItem(storageKey)
    return value ? bodySpatialMemoryFromJson(value) : BODY_SPATIAL_MEMORY_INITIAL
  } catch {
    return BODY_SPATIAL_MEMORY_INITIAL
  }
}

export const BODY_SPATIAL_MEMORY_PRINCIPLES = [
  'Returning to a region should restore camera orientation and context when reasonable.',
  'Spatial memory is local UI state, not patient data.',
  'Memory entries are bounded and evict oldest views first.',
  'A user can always reset to canonical orientation.',
  'Selection restoration never overrides unavailable source geometry.',
] as const
