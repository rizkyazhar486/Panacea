import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { BodyLayerId } from '../../domains/navigation'
import { Body3D, CT_WINDOWS, MOTION_OFF, humanizeStructureName, type AnatomyLayer } from '../bodyhub/Body3D'
import { FeatureErrorBoundary } from './FeatureErrorBoundary'

export interface AstralLive3DBodyCoreProps {
  layers: readonly BodyLayerId[]
  onPickStructure: (label: string, layer: AnatomyLayer['key'] | null) => void
  onClose: () => void
}

function detectWebGlAvailable(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function AstralLive3DBodyCore({
  layers,
  onPickStructure,
  onClose,
}: AstralLive3DBodyCoreProps) {
  const webglReady = useMemo(() => detectWebGlAvailable(), [])
  const layerSet = useMemo(() => new Set<AnatomyLayer['key']>(layers), [layers])

  if (!webglReady) {
    return (
      <div
        role="status"
        className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-full bg-[#040e12]/95 p-4 text-center text-xs text-cyan-100"
      >
        <p className="font-semibold text-white">
          WebGL tidak aktif pada peramban ini — gunakan mode Hologram atau buka 3D Studio.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="pmd-astral-btn min-h-[44px] px-3.5 text-xs font-bold"
          >
            Kembali ke Hologram
          </button>
          <Link
            to="/body-exposure"
            className="pmd-astral-btn pmd-astral-btn--accent inline-flex min-h-[44px] items-center px-3.5 text-xs font-bold"
          >
            Open 3D ↗
          </Link>
        </div>
      </div>
    )
  }

  return (
    <FeatureErrorBoundary featureName="3D Body Core" onBack={onClose}>
      <Body3D
        layers={layerSet}
        highlighted={[]}
        focusKeywords={[]}
        renderMode="anatomy"
        ctWindow={CT_WINDOWS[0]}
        slicePlane="none"
        slicePos={0.5}
        motion={MOTION_OFF}
        unfold={0}
        dissect={0}
        stageClassName="relative h-full w-full overflow-hidden"
        onPick={(rawName, _label, layer) => {
          onPickStructure(humanizeStructureName(rawName), layer ?? null)
        }}
      />
    </FeatureErrorBoundary>
  )
}

export default AstralLive3DBodyCore
