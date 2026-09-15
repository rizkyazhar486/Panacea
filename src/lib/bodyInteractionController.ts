export type BodyInputModality = 'pointer' | 'touch' | 'pen' | 'keyboard' | 'wheel' | 'programmatic'

export type BodyInteractionCommand =
  | 'select'
  | 'focus'
  | 'orbit'
  | 'pan'
  | 'zoom'
  | 'scrub'
  | 'explode'
  | 'peel'
  | 'isolate'
  | 'restore'
  | 'open-details'
  | 'close-details'
  | 'next'
  | 'previous'
  | 'play-pause'
  | 'reset-view'
  | 'toggle-labels'
  | 'toggle-overlay'
  | 'escape'

export interface BodyInteractionVector {
  x: number
  y: number
  z?: number
}

export interface BodyInteractionEvent {
  command: BodyInteractionCommand
  modality: BodyInputModality
  targetId?: string
  vector?: BodyInteractionVector
  scalar?: number
  timestamp: number
  modifiers?: readonly ('shift' | 'alt' | 'ctrl' | 'meta')[]
}

export interface BodyPointerSample {
  id: number
  x: number
  y: number
  pressure: number
  type: 'mouse' | 'touch' | 'pen'
}

export interface BodyGestureState {
  pointers: ReadonlyMap<number, BodyPointerSample>
  startedAt: number
  lastAt: number
  centroid: readonly [number, number]
  distance: number
  dragging: boolean
  pinching: boolean
}

export const BODY_GESTURE_INITIAL: BodyGestureState = {
  pointers: new Map(),
  startedAt: 0,
  lastAt: 0,
  centroid: [0, 0],
  distance: 0,
  dragging: false,
  pinching: false,
}

function centroid(pointers: ReadonlyMap<number, BodyPointerSample>): readonly [number, number] {
  if (!pointers.size) return [0, 0]
  let x = 0
  let y = 0
  for (const pointer of pointers.values()) {
    x += pointer.x
    y += pointer.y
  }
  return [x / pointers.size, y / pointers.size]
}

function pointerDistance(pointers: ReadonlyMap<number, BodyPointerSample>) {
  const values = [...pointers.values()]
  if (values.length < 2) return 0
  const dx = values[1].x - values[0].x
  const dy = values[1].y - values[0].y
  return Math.hypot(dx, dy)
}

export function pointerDown(state: BodyGestureState, sample: BodyPointerSample, now = Date.now()): BodyGestureState {
  const pointers = new Map(state.pointers)
  pointers.set(sample.id, sample)
  return {
    pointers,
    startedAt: state.pointers.size ? state.startedAt : now,
    lastAt: now,
    centroid: centroid(pointers),
    distance: pointerDistance(pointers),
    dragging: false,
    pinching: pointers.size >= 2,
  }
}

export function pointerMove(state: BodyGestureState, sample: BodyPointerSample, now = Date.now()): BodyGestureState {
  if (!state.pointers.has(sample.id)) return state
  const pointers = new Map(state.pointers)
  pointers.set(sample.id, sample)
  const nextCentroid = centroid(pointers)
  const dx = nextCentroid[0] - state.centroid[0]
  const dy = nextCentroid[1] - state.centroid[1]
  return {
    ...state,
    pointers,
    lastAt: now,
    centroid: nextCentroid,
    distance: pointerDistance(pointers),
    dragging: state.dragging || Math.hypot(dx, dy) > 1.5,
    pinching: pointers.size >= 2,
  }
}

export function pointerUp(state: BodyGestureState, pointerId: number, now = Date.now()): BodyGestureState {
  const pointers = new Map(state.pointers)
  pointers.delete(pointerId)
  return {
    ...state,
    pointers,
    lastAt: now,
    centroid: centroid(pointers),
    distance: pointerDistance(pointers),
    dragging: pointers.size > 0 && state.dragging,
    pinching: pointers.size >= 2,
  }
}

export function interactionFromGesture(
  before: BodyGestureState,
  after: BodyGestureState,
  modality: BodyInputModality,
  targetId?: string,
): BodyInteractionEvent | undefined {
  const timestamp = after.lastAt || Date.now()
  if (before.pointers.size >= 2 && after.pointers.size >= 2) {
    const delta = after.distance - before.distance
    if (Math.abs(delta) > .5) return { command: 'zoom', modality, targetId, scalar: delta, timestamp }
  }

  if (after.dragging && after.pointers.size === 1) {
    return {
      command: 'orbit',
      modality,
      targetId,
      vector: { x: after.centroid[0] - before.centroid[0], y: after.centroid[1] - before.centroid[1] },
      timestamp,
    }
  }

  return undefined
}

export function interactionFromWheel(deltaX: number, deltaY: number, shiftKey = false, targetId?: string, now = Date.now()): BodyInteractionEvent {
  if (shiftKey || Math.abs(deltaX) > Math.abs(deltaY)) {
    return { command: 'scrub', modality: 'wheel', targetId, scalar: deltaX || deltaY, timestamp: now, modifiers: shiftKey ? ['shift'] : [] }
  }
  return { command: 'zoom', modality: 'wheel', targetId, scalar: -deltaY, timestamp: now }
}

const KEY_BINDINGS: Readonly<Record<string, BodyInteractionCommand>> = {
  Escape: 'escape',
  Enter: 'open-details',
  ' ': 'play-pause',
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  Home: 'reset-view',
  l: 'toggle-labels',
  L: 'toggle-labels',
  o: 'toggle-overlay',
  O: 'toggle-overlay',
  r: 'restore',
  R: 'restore',
}

export function interactionFromKey(key: string, modifiers: BodyInteractionEvent['modifiers'] = [], targetId?: string, now = Date.now()): BodyInteractionEvent | undefined {
  const command = KEY_BINDINGS[key]
  if (!command) return undefined
  return { command, modality: 'keyboard', targetId, timestamp: now, modifiers }
}

export function normalizeInteractionScalar(command: BodyInteractionCommand, value: number) {
  if (!Number.isFinite(value)) return 0
  if (command === 'zoom') return Math.max(-240, Math.min(240, value))
  if (command === 'scrub') return Math.max(-100, Math.min(100, value))
  return Math.max(-1, Math.min(1, value))
}

export const BODY_INTERACTION_PRINCIPLES = [
  'One-finger drag or primary-pointer drag orbits the selected spatial scene.',
  'Pinch and wheel zoom preserve the current focal target.',
  'Horizontal wheel/shift-wheel may scrub timelines only when a scrub context is active.',
  'Keyboard alternatives exist for core navigation and playback actions.',
  'Gesture thresholds remain small enough to feel direct but large enough to avoid accidental activation.',
  'Camera manipulation never requires a decorative animation to finish first.',
  'Touch targets remain at least approximately finger-sized even when visual glyphs are compact.',
] as const
