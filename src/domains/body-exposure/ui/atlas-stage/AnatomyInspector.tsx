// Stage 1 of the inspector: one tapped structure, or the list of layers when nothing is tapped.
// Presentation only. What a depth mounts comes in as a plan; what may be said about a structure comes in as
// a description; the truth-class wording is handed in by the home so it has one owner.

import type { ReactNode } from 'react'
import { formatLayerSize, plateShows, type AtlasLayerId, type AtlasLayerInfo, type AtlasLayerOverrides, type AtlasPlateMode, type StageLayerPlan } from '../../engine/atlas-stage/stageLayers'
import type { SelectedStructureInfo } from '../../engine/atlas-stage/structureInfo'
import { Note, Segmented, Tag } from './StagePieces'
import { TONE, TOUCH, eyebrow, paragraph, primaryButton, subtleButton } from './stageTokens'

export function StructureHeader({ structure, layer, showName, onClear }: { structure: SelectedStructureInfo; layer: AtlasLayerInfo | null; showName: boolean; onClear: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...eyebrow, color: layer?.color ?? TONE.liveText }}>
          {layer ? layer.label : 'Atlas structure'} <span style={{ color: TONE.faint }}>· Inspected structure</span>
        </div>
        {showName && (
          <h3 style={{ margin: '4px 0 0', fontSize: 20, lineHeight: 1.2, fontWeight: 800, color: TONE.text, overflowWrap: 'anywhere' }}>{structure.cleanName}</h3>
        )}
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {structure.side && <Tag color={TONE.liveText}>{structure.side === 'left' ? 'Left side' : 'Right side'}</Tag>}
          {structure.sideReview && <Tag color={TONE.sim}>Side label under review</Tag>}
        </div>
      </div>
      <button type="button" onClick={onClear} aria-label="Clear structure selection" className="as-focus as-hover as-fade" style={{ ...subtleButton, flex: 'none' }}>
        ✕ Whole body
      </button>
    </div>
  )
}

interface StructureCardProps {
  structure: SelectedStructureInfo
  layer: AtlasLayerInfo | null
  /** The truth-class statement for atlas geometry, owned by the home. */
  truthClass: ReactNode
  onFocus: () => void
  onPhysiology: () => void
  onClinical: () => void
}

export function StructureCard({ structure, layer, truthClass, onFocus, onPhysiology, onClinical }: StructureCardProps) {
  return (
    <>
      <p style={{ ...paragraph, fontSize: 14, color: TONE.text, margin: 0 }}>
        {structure.cleanName} is {structure.kind || 'an anatomical structure in the human body'}.
      </p>
      {structure.sideReview && (
        <Note color={TONE.sim}>
          {structure.sideReview === 'swapped'
            ? 'The source file names this mirrored pair on the opposite sides from where the meshes lie, so no side is stated here.'
            : 'In the source file this structure crosses the midline, so its side label could not be confirmed from its position. No side is stated here.'}
        </Note>
      )}
      <Note color={TONE.ref}>
        {truthClass}
        <span style={{ display: 'block', marginTop: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, color: TONE.dim, overflowWrap: 'anywhere' }}>
          Atlas node: {structure.meshName}{layer ? ` · ${layer.file}` : ''}
        </span>
      </Note>
      <button type="button" onClick={onFocus} className="as-focus as-fade" style={primaryButton}>Focus on this structure</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" onClick={onPhysiology} className="as-focus as-hover as-fade" style={subtleButton}>See Living Physiology →</button>
        <button type="button" onClick={onClinical} className="as-focus as-hover as-fade" style={subtleButton}>Clinical Relevance →</button>
      </div>
    </>
  )
}

interface LayerListProps {
  layers: readonly AtlasLayerInfo[]
  depth: number
  mode: AtlasPlateMode
  plan: StageLayerPlan
  overrides: AtlasLayerOverrides
  onMode: (mode: AtlasPlateMode) => void
  onToggle: (id: AtlasLayerId) => void
}

const MODES: readonly { id: AtlasPlateMode; label: string }[] = [{ id: 'focus', label: 'Focus' }, { id: 'peeled', label: 'Peeled body' }]

/** How one layer currently appears, in the words the list shows. */
export function layerState(plan: StageLayerPlan, id: AtlasLayerId): 'Shown' | 'Faint outline' | 'Behind the skin' | 'Hidden' | 'Unavailable' {
  if (!plan.ok) return 'Unavailable'
  if (plan.solid.includes(id)) return 'Shown'
  if (plan.ghost.includes(id)) return 'Faint outline'
  if (plan.occluded.includes(id)) return 'Behind the skin'
  return 'Hidden'
}

export function LayerList({ layers, depth, mode, plan, overrides, onMode, onToggle }: LayerListProps) {
  return (
    <>
      <div>
        <div style={{ ...eyebrow, color: TONE.faint, marginBottom: 6 }}>What a depth shows</div>
        <Segmented label="What a depth shows" value={mode} options={MODES} onChange={onMode} />
        <p style={{ ...paragraph, fontSize: 12 }}>
          {mode === 'focus'
            ? 'One system at a time, with the skeleton as a frame. Lighter to load.'
            : 'Everything at and below the chosen depth, as a body with the outer layers removed.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...eyebrow, color: TONE.faint }}>{layers.length} source layers · depth {depth + 1} of {layers.length}</div>
        {layers.map((layer) => {
          const wanted = overrides[layer.id] ?? plateShows(layer.id, depth, mode)
          const state = layerState(plan, layer.id)
          const shown = state === 'Shown'
          return (
            <label key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: TOUCH, padding: '4px 10px', borderRadius: 12, border: `1px solid ${shown ? TONE.line : 'transparent'}`, background: shown ? TONE.raised : 'transparent', cursor: 'pointer' }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: layer.color, opacity: state === 'Hidden' ? 0.4 : 1, flex: 'none' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: state === 'Hidden' ? TONE.dim : TONE.text }}>{layer.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: TONE.faint, fontVariantNumeric: 'tabular-nums' }}>{state} · {formatLayerSize(layer.sizeBytes)}</span>
              </span>
              <input type="checkbox" checked={wanted} onChange={() => onToggle(layer.id)} aria-label={`Show ${layer.label}`} className="as-focus" style={{ width: 24, height: 24, accentColor: TONE.live, cursor: 'pointer', flex: 'none' }} />
            </label>
          )
        })}
      </div>

      <Note color={TONE.ref}>A layer is downloaded the first time it is shown. While the skin is on, nothing behind it is drawn or downloaded.</Note>
    </>
  )
}
