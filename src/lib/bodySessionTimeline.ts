import type { BodyInteractionEvent } from './bodyInteractionController'

export interface BodySessionMarker {
  id: string
  at: number
  label: string
  kind: 'visit' | 'selection' | 'interaction' | 'milestone' | 'note'
  featureId?: string
  nodeId?: string
}

export interface BodySessionFrame {
  at: number
  featureId?: string
  selectedNodeIds: readonly string[]
  cameraTarget?: readonly [number, number, number]
  cameraPosition?: readonly [number, number, number]
  overlay?: string
  timeline?: number
}

export interface BodySessionTimeline {
  startedAt: number
  updatedAt: number
  interactions: readonly BodyInteractionEvent[]
  markers: readonly BodySessionMarker[]
  frames: readonly BodySessionFrame[]
  maxInteractions: number
  maxFrames: number
}

export function createBodySessionTimeline(now = Date.now()): BodySessionTimeline {
  return {
    startedAt: now,
    updatedAt: now,
    interactions: [],
    markers: [],
    frames: [],
    maxInteractions: 1200,
    maxFrames: 400,
  }
}

export function appendBodyInteraction(timeline: BodySessionTimeline, interaction: BodyInteractionEvent): BodySessionTimeline {
  const interactions = [...timeline.interactions, interaction].slice(-timeline.maxInteractions)
  return { ...timeline, interactions, updatedAt: interaction.timestamp }
}

export function appendBodyMarker(timeline: BodySessionTimeline, marker: BodySessionMarker): BodySessionTimeline {
  const exists = timeline.markers.some((item) => item.id === marker.id)
  const markers = exists ? timeline.markers.map((item) => item.id === marker.id ? marker : item) : [...timeline.markers, marker]
  return { ...timeline, markers, updatedAt: Math.max(timeline.updatedAt, marker.at) }
}

export function appendBodyFrame(timeline: BodySessionTimeline, frame: BodySessionFrame): BodySessionTimeline {
  const frames = [...timeline.frames, frame].slice(-timeline.maxFrames)
  return { ...timeline, frames, updatedAt: Math.max(timeline.updatedAt, frame.at) }
}

export function bodySessionDuration(timeline: BodySessionTimeline) {
  return Math.max(0, timeline.updatedAt - timeline.startedAt)
}

export function bodySessionVisitedFeatures(timeline: BodySessionTimeline) {
  return [...new Set([
    ...timeline.frames.map((frame) => frame.featureId).filter(Boolean),
    ...timeline.markers.map((marker) => marker.featureId).filter(Boolean),
  ])] as string[]
}

export function bodySessionVisitedNodes(timeline: BodySessionTimeline) {
  return [...new Set([
    ...timeline.frames.flatMap((frame) => frame.selectedNodeIds),
    ...timeline.markers.map((marker) => marker.nodeId).filter(Boolean),
  ])] as string[]
}

export function bodySessionReplayFrames(timeline: BodySessionTimeline, maxFrames = 48) {
  if (timeline.frames.length <= maxFrames) return [...timeline.frames]
  const step = (timeline.frames.length - 1) / Math.max(1, maxFrames - 1)
  return Array.from({ length: maxFrames }, (_, index) => timeline.frames[Math.round(index * step)])
}

export function bodySessionRecap(timeline: BodySessionTimeline) {
  const commandCounts = new Map<string, number>()
  for (const interaction of timeline.interactions) commandCounts.set(interaction.command, (commandCounts.get(interaction.command) ?? 0) + 1)
  const topCommands = [...commandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  return {
    durationMs: bodySessionDuration(timeline),
    interactionCount: timeline.interactions.length,
    markerCount: timeline.markers.length,
    frameCount: timeline.frames.length,
    visitedFeatures: bodySessionVisitedFeatures(timeline),
    visitedNodes: bodySessionVisitedNodes(timeline),
    topCommands,
  }
}

export function bodySessionTimelineJson(timeline: BodySessionTimeline) {
  return JSON.stringify(timeline)
}

export function bodySessionTimelineFromJson(value: string): BodySessionTimeline | undefined {
  try {
    const parsed = JSON.parse(value) as BodySessionTimeline
    if (!parsed || typeof parsed.startedAt !== 'number' || !Array.isArray(parsed.interactions) || !Array.isArray(parsed.frames) || !Array.isArray(parsed.markers)) return undefined
    return {
      ...parsed,
      maxInteractions: Math.max(100, Math.min(5000, parsed.maxInteractions || 1200)),
      maxFrames: Math.max(50, Math.min(1500, parsed.maxFrames || 400)),
    }
  } catch {
    return undefined
  }
}

export const BODY_SESSION_TIMELINE_RULES = {
  defaultPersistence: 'memory-only',
  containsPatientDataByDesign: false,
  replayPurpose: 'learning recap and interaction debugging',
  frameSampling: 'bounded',
  autonomousRecordingOfSensitiveContent: false,
} as const
