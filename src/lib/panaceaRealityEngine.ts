export type RealityLayer = 'surface' | 'muscle' | 'vascular' | 'neural' | 'cardiac'
export type RealityPathology = 'none' | 'lad-occlusion' | 'c5-radiculopathy'
export type RealityView = 'whole-body' | 'thorax' | 'intracardiac'

export interface RealityState {
  layer: RealityLayer
  pathology: RealityPathology
  view: RealityView
  frozen: boolean
  exploded: boolean
  simulationRunning: true
  lastCommand: string
}

export const INITIAL_REALITY_STATE: RealityState = {
  layer: 'surface',
  pathology: 'none',
  view: 'whole-body',
  frozen: false,
  exploded: false,
  simulationRunning: true,
  lastCommand: 'Reality ready',
}

export const REALITY_COMMANDS = [
  'Remove my skin',
  'Show arteries',
  'Show nerves',
  'Freeze reality',
  'Explode heart',
  'Simulate LAD occlusion',
  'Take me inside the heart',
  'Reverse it',
] as const

export const REALITY_DEMO_SEQUENCE = [
  'Remove my skin',
  'Show arteries',
  'Freeze reality',
  'Explode heart',
  'Simulate LAD occlusion',
  'Take me inside the heart',
  'Reverse it',
  'Resume reality',
] as const

function normalized(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ')
}

export function interpretRealityCommand(input: string, current: RealityState = INITIAL_REALITY_STATE): RealityState {
  const command = normalized(input)
  const base = { ...current, lastCommand: input.trim() || current.lastCommand }

  if (!command) return current

  if (/reset|normal reality|start over/.test(command)) {
    return { ...INITIAL_REALITY_STATE, lastCommand: input.trim() }
  }

  if (/resume reality|unfreeze|continue reality/.test(command)) {
    return { ...base, frozen: false }
  }

  if (/freeze reality|freeze world|freeze frame/.test(command)) {
    return { ...base, frozen: true }
  }

  if (/remove (my )?skin|show muscle|muscles/.test(command)) {
    return { ...base, layer: 'muscle', view: 'whole-body' }
  }

  if (/show arteries|show vessels|vascular|blood vessels/.test(command)) {
    return { ...base, layer: 'vascular', view: 'whole-body' }
  }

  if (/show nerves|neural|nervous system/.test(command)) {
    return { ...base, layer: 'neural', view: 'whole-body' }
  }

  if (/c5 radiculopathy|simulate c5/.test(command)) {
    return { ...base, layer: 'neural', pathology: 'c5-radiculopathy', view: 'whole-body' }
  }

  if (/explode heart|open heart|heart exploded/.test(command)) {
    return { ...base, layer: 'cardiac', view: 'thorax', exploded: true }
  }

  if (/lad occlusion|simulate lad|block lad/.test(command)) {
    return { ...base, layer: 'cardiac', pathology: 'lad-occlusion', view: 'thorax' }
  }

  if (/inside (the )?(heart|ventricle)|intracardiac|enter (the )?heart/.test(command)) {
    return { ...base, layer: 'cardiac', view: 'intracardiac', exploded: false }
  }

  if (/show heart|cardiac|thorax/.test(command)) {
    return { ...base, layer: 'cardiac', view: 'thorax' }
  }

  if (/reverse it|undo pathology|clear pathology|restore normal/.test(command)) {
    return { ...base, pathology: 'none', exploded: false, view: base.layer === 'cardiac' ? 'thorax' : base.view }
  }

  return base
}

export function realityCausalPath(state: RealityState): string[] {
  if (state.pathology === 'lad-occlusion') {
    return ['Whole body', 'Heart', 'Coronary tree', 'LAD', 'Synthetic ischemia state', 'Teaching signal']
  }
  if (state.pathology === 'c5-radiculopathy') {
    return ['Whole body', 'Cervical spine', 'C5 root', 'Motor-sensory map', 'Synthetic deficit overlay']
  }
  if (state.view === 'intracardiac') {
    return ['Whole body', 'Thorax', 'Heart', 'Chamber', 'Intracardiac teaching view']
  }
  return ['Whole body', state.layer === 'surface' ? 'Surface' : state.layer]
}

export function realityLayerLabel(layer: RealityLayer) {
  const labels: Record<RealityLayer, string> = {
    surface: 'Visible body',
    muscle: 'Musculoskeletal layer',
    vascular: 'Vascular layer',
    neural: 'Neural layer',
    cardiac: 'Cardiac focus',
  }
  return labels[layer]
}
