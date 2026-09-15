import type { CompiledBodyExperience } from './bodyExperienceCompiler'

export type BodyRuntimePhase = 'idle' | 'booting' | 'loading' | 'ready' | 'interacting' | 'paused' | 'error' | 'disposed'

export interface BodyRuntimeCameraState {
  target: readonly [number, number, number]
  position: readonly [number, number, number]
  zoom: number
  mode: string
}

export interface BodyRuntimeState {
  phase: BodyRuntimePhase
  experience?: CompiledBodyExperience
  selectedNodeIds: readonly string[]
  hoveredNodeId?: string
  activeOverlay?: string
  activeTimeline: number
  camera: BodyRuntimeCameraState
  loadingProgress: number
  error?: string
  lastInteractionAt: number
  interactionCount: number
  reducedMotion: boolean
}

export type BodyRuntimeEvent =
  | { type: 'BOOT'; experience: CompiledBodyExperience; now?: number }
  | { type: 'LOAD_PROGRESS'; progress: number; now?: number }
  | { type: 'READY'; now?: number }
  | { type: 'SELECT'; ids: readonly string[]; now?: number }
  | { type: 'HOVER'; id?: string; now?: number }
  | { type: 'SET_OVERLAY'; overlay?: string; now?: number }
  | { type: 'SET_TIMELINE'; value: number; now?: number }
  | { type: 'SET_CAMERA'; camera: Partial<BodyRuntimeCameraState>; now?: number }
  | { type: 'PAUSE'; now?: number }
  | { type: 'RESUME'; now?: number }
  | { type: 'ERROR'; message: string; now?: number }
  | { type: 'RESET'; now?: number }
  | { type: 'DISPOSE'; now?: number }
  | { type: 'SET_REDUCED_MOTION'; value: boolean; now?: number }

export const BODY_RUNTIME_INITIAL_STATE: BodyRuntimeState = {
  phase: 'idle',
  selectedNodeIds: [],
  activeTimeline: 0,
  camera: {
    target: [0, 0, 0],
    position: [0, 0, 4],
    zoom: 1,
    mode: 'orbiting',
  },
  loadingProgress: 0,
  lastInteractionAt: 0,
  interactionCount: 0,
  reducedMotion: false,
}

function timestamp(event: BodyRuntimeEvent) {
  return event.now ?? Date.now()
}

function interacted(state: BodyRuntimeState, event: BodyRuntimeEvent, patch: Partial<BodyRuntimeState>): BodyRuntimeState {
  return {
    ...state,
    ...patch,
    phase: state.phase === 'ready' ? 'interacting' : state.phase,
    lastInteractionAt: timestamp(event),
    interactionCount: state.interactionCount + 1,
  }
}

export function bodyRuntimeReducer(state: BodyRuntimeState, event: BodyRuntimeEvent): BodyRuntimeState {
  if (state.phase === 'disposed' && event.type !== 'RESET') return state

  switch (event.type) {
    case 'BOOT':
      return {
        ...BODY_RUNTIME_INITIAL_STATE,
        phase: 'booting',
        experience: event.experience,
        camera: { ...BODY_RUNTIME_INITIAL_STATE.camera, mode: event.experience.feature.selection.camera },
        lastInteractionAt: timestamp(event),
        reducedMotion: state.reducedMotion,
      }
    case 'LOAD_PROGRESS':
      return {
        ...state,
        phase: state.phase === 'booting' ? 'loading' : state.phase,
        loadingProgress: Math.max(0, Math.min(1, event.progress)),
      }
    case 'READY':
      return { ...state, phase: 'ready', loadingProgress: 1, error: undefined }
    case 'SELECT':
      return interacted(state, event, { selectedNodeIds: [...new Set(event.ids)] })
    case 'HOVER':
      return { ...state, hoveredNodeId: event.id, lastInteractionAt: timestamp(event) }
    case 'SET_OVERLAY':
      return interacted(state, event, { activeOverlay: event.overlay })
    case 'SET_TIMELINE':
      return interacted(state, event, { activeTimeline: Math.max(0, Math.min(1, event.value)) })
    case 'SET_CAMERA':
      return interacted(state, event, { camera: { ...state.camera, ...event.camera } })
    case 'PAUSE':
      return { ...state, phase: 'paused', lastInteractionAt: timestamp(event) }
    case 'RESUME':
      return { ...state, phase: state.experience ? 'ready' : 'idle', lastInteractionAt: timestamp(event) }
    case 'ERROR':
      return { ...state, phase: 'error', error: event.message, lastInteractionAt: timestamp(event) }
    case 'RESET':
      return { ...BODY_RUNTIME_INITIAL_STATE, reducedMotion: state.reducedMotion, lastInteractionAt: timestamp(event) }
    case 'DISPOSE':
      return { ...state, phase: 'disposed', selectedNodeIds: [], hoveredNodeId: undefined, activeOverlay: undefined, lastInteractionAt: timestamp(event) }
    case 'SET_REDUCED_MOTION':
      return { ...state, reducedMotion: event.value, lastInteractionAt: timestamp(event) }
    default:
      return state
  }
}

export function runtimeCanRender(state: BodyRuntimeState) {
  return ['ready', 'interacting'].includes(state.phase)
}

export function runtimeCanInteract(state: BodyRuntimeState) {
  return ['ready', 'interacting'].includes(state.phase) && !state.error
}

export function runtimeShouldAnimate(state: BodyRuntimeState, documentVisible = true, inViewport = true) {
  return runtimeCanRender(state) && !state.reducedMotion && documentVisible && inViewport
}

export function runtimeIdleMs(state: BodyRuntimeState, now = Date.now()) {
  return Math.max(0, now - state.lastInteractionAt)
}

export function runtimeTelemetrySnapshot(state: BodyRuntimeState) {
  return {
    phase: state.phase,
    featureId: state.experience?.feature.id,
    selectedCount: state.selectedNodeIds.length,
    overlay: state.activeOverlay,
    timeline: state.activeTimeline,
    interactionCount: state.interactionCount,
    loadingProgress: state.loadingProgress,
    reducedMotion: state.reducedMotion,
    error: state.error,
  }
}

export class BodyExperienceRuntime {
  private state: BodyRuntimeState
  private listeners = new Set<(state: BodyRuntimeState, event: BodyRuntimeEvent) => void>()

  constructor(initial: BodyRuntimeState = BODY_RUNTIME_INITIAL_STATE) {
    this.state = initial
  }

  get snapshot() {
    return this.state
  }

  dispatch(event: BodyRuntimeEvent) {
    this.state = bodyRuntimeReducer(this.state, event)
    for (const listener of this.listeners) listener(this.state, event)
    return this.state
  }

  subscribe(listener: (state: BodyRuntimeState, event: BodyRuntimeEvent) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(now = Date.now()) {
    this.dispatch({ type: 'DISPOSE', now })
    this.listeners.clear()
  }
}
