// The depth rail: seven stops from skin to skeleton, in the order a dissection meets them.
//
// A vertical radio group rather than a range slider: each stop is a full-size touch target with a name, the
// arrow keys walk it, and a screen reader hears "Vessels, 3 of 7" instead of a bare number.

import { useRef, type KeyboardEvent } from 'react'
import type { AtlasLayerInfo } from '../../engine/atlas-stage/stageLayers'
import { TONE, TOUCH, eyebrow, glass } from './stageTokens'

interface DepthRailProps {
  layers: readonly AtlasLayerInfo[]
  depth: number
  /** Show every stop's name (wide stage) or only the active one (phone). */
  labelled: boolean
  onDepth: (depth: number) => void
}

export function DepthRail({ layers, depth, labelled, onDepth }: DepthRailProps) {
  const groupRef = useRef<HTMLDivElement | null>(null)

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = layers.length - 1
    const next = event.key === 'ArrowDown' ? Math.min(last, depth + 1)
      : event.key === 'ArrowUp' ? Math.max(0, depth - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    if (next !== depth) onDepth(next)
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-depth-stop="${next}"]`)?.focus()
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Depth: skin to skeleton"
      aria-orientation="vertical"
      onKeyDown={move}
      data-atlas-depth-rail="v1"
      style={{ ...glass, borderRadius: 22, padding: 4, display: 'flex', flexDirection: 'column', gap: 0, width: labelled ? 148 : TOUCH + 8 }}
    >
      {labelled && (
        <div style={{ ...eyebrow, color: TONE.faint, padding: '8px 10px 4px' }}>Depth</div>
      )}
      {layers.map((layer) => {
        const active = layer.peelRank === depth
        return (
          <button
            key={layer.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${layer.short}, depth ${layer.peelRank + 1} of ${layers.length}`}
            tabIndex={active ? 0 : -1}
            data-depth-stop={layer.peelRank}
            onClick={() => onDepth(layer.peelRank)}
            className="as-focus as-fade"
            style={{
              minHeight: TOUCH,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: labelled ? '0 10px' : 0,
              justifyContent: labelled ? 'flex-start' : 'center',
              border: 'none',
              borderRadius: 18,
              background: active ? 'rgba(0, 191, 99, 0.16)' : 'transparent',
              color: active ? TONE.text : TONE.dim,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              aria-hidden
              style={{
                width: active ? 14 : 9,
                height: active ? 14 : 9,
                borderRadius: '50%',
                background: layer.color,
                boxShadow: active ? `0 0 0 3px ${TONE.panelSolid}, 0 0 0 5px ${TONE.live}` : 'none',
                flex: 'none',
              }}
            />
            {labelled && <span style={{ fontSize: 13, fontWeight: active ? 800 : 600 }}>{layer.short}</span>}
          </button>
        )
      })}
    </div>
  )
}
