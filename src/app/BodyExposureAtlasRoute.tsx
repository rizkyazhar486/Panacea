// Composition root for /body-exposure: joins the atlas stage (domain) to the shared 3D viewer (components).
//
// The stage states what it needs from a viewer (AtlasViewerProps) and does not import one — a domain may not
// reach into src/components. This file is the one place that knows both sides. It contains no decisions:
// only the mapping from the stage's contract to the viewer's props and camera channel.

import { useMemo } from 'react'
import { Body3D, CT_WINDOWS, MOTION_OFF, type AnatomyLayer } from '../components/bodyhub/Body3D'
import { BodyExposureAtlasHome, type AtlasCameraCommand, type AtlasViewerProps } from '../domains/body-exposure'

/** The stage fills the box the home gives it; these utilities already exist in the compiled CSS. */
const STAGE_CLASS = 'relative h-full w-full overflow-hidden'

function AtlasViewer({ layers, dissect, highlighted, focusKeywords, homeFrame, onPick }: AtlasViewerProps) {
  const mounted = useMemo(() => new Set<AnatomyLayer['key']>(layers), [layers])
  const exact = useMemo(() => [...highlighted], [highlighted])
  const keywords = useMemo(() => [...focusKeywords], [focusKeywords])
  return (
    <Body3D
      layers={mounted}
      highlighted={exact}
      focusKeywords={keywords}
      renderMode="anatomy"
      ctWindow={CT_WINDOWS[0]}
      slicePlane="none"
      slicePos={0.5}
      motion={MOTION_OFF}
      unfold={0}
      dissect={dissect}
      onPick={(rawName, _label, layer) => onPick(rawName, layer ?? null)}
      stageClassName={STAGE_CLASS}
      homeFrame={homeFrame}
    />
  )
}

/** The viewer listens on this window event; BodyExplorer uses the same channel for its own buttons. */
function sendCamera(command: AtlasCameraCommand) {
  window.dispatchEvent(new CustomEvent('panacea:body3d-camera', { detail: command }))
}

export default function BodyExposureAtlasRoute() {
  return <BodyExposureAtlasHome Viewer={AtlasViewer} sendCamera={sendCamera} />
}
