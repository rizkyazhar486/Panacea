// What the atlas stage needs from a 3D viewer, stated by the domain.
//
// The stage does not import a viewer: the layer rules forbid a domain from reaching into src/components, and
// a stage that can be rendered with a stand-in viewer can be tested without WebGL. The composition root
// (src/app) hands in the shared Body3D viewer, which satisfies this contract.

import type { ComponentType } from 'react'
import type { RegionFrame } from './regionFraming.ts'
import type { AtlasLayerId } from './stageLayers.ts'

export type AtlasCameraCommand =
  | { action: 'reset' | 'zoomIn' | 'zoomOut' | 'front' | 'back' }
  | { action: 'frame'; frame: RegionFrame }

export interface AtlasViewerProps {
  /** Layers to mount; anything absent is neither drawn nor downloaded. */
  layers: ReadonlySet<AtlasLayerId>
  /** Dissection depth: layers shallower than this are faded to context. */
  dissect: number
  /** Exact atlas node names to highlight. */
  highlighted: readonly string[]
  /** Lower-case keywords to highlight and fly to; empty leaves the camera alone. */
  focusKeywords: readonly string[]
  /** The box "home" frames for this stage. */
  homeFrame: RegionFrame
  /** A structure was tapped. `layer` is the file it came from, or null when the viewer cannot tell. */
  onPick: (rawName: string, layer: AtlasLayerId | null) => void
}

export type AtlasViewerComponent = ComponentType<AtlasViewerProps>
