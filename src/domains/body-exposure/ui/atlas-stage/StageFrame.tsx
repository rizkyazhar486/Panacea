// The two projections of the atlas stage. Same state, same pieces, two arrangements:
//   wide  — the stage beside an inspector panel;
//   phone — the stage with the inspector as a bottom sheet that never covers the whole body.
// These shells arrange what they are given. They own only what is purely about layout: the sheet's drag
// gesture and the measured height it snaps within.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { nextSnap, sheetHeight, snapAfterDrag, type SheetSnap } from '../../engine/atlas-stage/sheetSnap'
import type { AtlasPlateMode } from '../../engine/atlas-stage/stageLayers'
import { STAGE_CSS, STAGE_ROOT_CLASS, TONE, eyebrow, glass, rootFrame, stageGlow, subtleButton } from './stageTokens'

/** Height of the phone sheet when only its header shows (px). */
export const SHEET_PEEK = 148
/** Height of the strip under the wide canvas that carries the region chips (px). */
const WIDE_STRIP = 66
/** A press that travels less than this is a tap on the handle, not a drag (px). */
const TAP_SLOP = 6

interface StageSlots {
  plate: AtlasPlateMode
  depth: number
  viewer: ReactNode
  search: ReactNode
  rail: ReactNode
  regionChips: ReactNode
  referenceChip: ReactNode
  tabs: ReactNode
  inspectorHeader: ReactNode
  inspectorBody: ReactNode
}

export interface WideStageProps extends StageSlots {
  title: string
  caption: string
  cameraButtons: ReactNode
  panelOpen: boolean
  onTogglePanel: () => void
}

export function WideStage({ plate, depth, viewer, search, rail, regionChips, referenceChip, tabs, inspectorHeader, inspectorBody, title, caption, cameraButtons, panelOpen, onTogglePanel }: WideStageProps) {
  return (
    <section data-atlas-stage="v2" data-atlas-projection="wide" data-atlas-plate={plate} data-atlas-depth={depth} data-pmd-body-exposure="true" data-pmd-unclamped="true" data-pmd-liquid="off" aria-label="Body Exposure 3D atlas" style={{ color: TONE.text }}>
      <style>{STAGE_CSS}</style>
      <div className={STAGE_ROOT_CLASS} style={{ ...rootFrame, minHeight: 620, maxHeight: 940, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', borderBottom: `1px solid ${TONE.line}`, background: TONE.panelSolid }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...eyebrow, fontSize: 12, color: TONE.liveText }}>{title}</span>
              <span style={{ fontSize: 12, color: TONE.faint }}>{caption}</span>
            </div>
            <nav aria-label="Atlas modules" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <Link to="/body-exposure/canonical" style={{ color: TONE.dim, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, border: `1px solid ${TONE.line}`, background: 'rgba(255,255,255,0.02)' }}>
                Canonical 3D
              </Link>
              <Link to="/body-exposure/fetal-dataset" style={{ color: TONE.dim, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, border: `1px solid ${TONE.line}`, background: 'rgba(255,255,255,0.02)' }}>
                Fetal Dataset
              </Link>
              <Link to="/radiology" style={{ color: TONE.dim, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, border: `1px solid ${TONE.line}`, background: 'rgba(255,255,255,0.02)' }}>
                Radiology MPR
              </Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tabs}
            <button
              type="button"
              onClick={onTogglePanel}
              aria-expanded={panelOpen}
              aria-label={panelOpen ? 'Collapse side panel' : 'Open side panel'}
              className="as-focus as-hover as-fade"
              style={{ ...subtleButton, minHeight: 36, color: panelOpen ? TONE.ref : TONE.dim }}
            >
              {panelOpen ? 'Deck ⇥' : 'Deck ⇤'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: panelOpen ? 'minmax(0, 1fr) clamp(360px, 30vw, 460px)' : 'minmax(0, 1fr)', minHeight: 0 }}>
          <div style={{ position: 'relative', minWidth: 0, minHeight: 0, background: TONE.bg }}>
            {/* The canvas ends above the bottom strip, so the feet are never underneath a control. */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: WIDE_STRIP }}>{viewer}</div>
            <div aria-hidden style={stageGlow} />
            <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto', maxWidth: '60%' }}>{search}</div>
              <div style={{ pointerEvents: 'auto', display: 'flex', gap: 6 }}>{cameraButtons}</div>
            </div>
            <div style={{ position: 'absolute', left: 14, top: 72, bottom: WIDE_STRIP + 8, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>{rail}</div>
            </div>
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, pointerEvents: 'none' }}>
              <div style={{ ...glass, borderRadius: 12, padding: '6px 10px', pointerEvents: 'auto' }}>{referenceChip}</div>
              <div style={{ pointerEvents: 'auto', minWidth: 0 }}>{regionChips}</div>
            </div>
          </div>

          {panelOpen && (
            <aside aria-label="Atlas inspector" data-testid="atlas-side-panel" className="as-panel-scroll" style={{ minHeight: 0, overflowY: 'auto', padding: 18, borderLeft: `1px solid ${TONE.line}`, background: TONE.panelSolid, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ paddingBottom: 14, borderBottom: `1px solid ${TONE.line}` }}>{inspectorHeader}</div>
              {inspectorBody}
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}

export interface PhoneStageProps extends StageSlots {
  resetButton: ReactNode
  depthBadge: ReactNode
  /** One line naming what is selected (or the invitation to tap). */
  peekTitle: ReactNode
  /** The one action offered while the sheet is only peeking. */
  peekAction: ReactNode
  sheet: SheetSnap
  onSheet: (next: SheetSnap) => void
}

export function PhoneStage({ plate, depth, viewer, search, rail, regionChips, referenceChip, tabs, inspectorHeader, inspectorBody, resetButton, depthBadge, peekTitle, peekAction, sheet, onSheet }: PhoneStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageHeight, setStageHeight] = useState(640)
  const drag = useRef<{ startY: number; from: SheetSnap; moved: number } | null>(null)

  useEffect(() => {
    const node = stageRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const measure = () => { if (node.clientHeight > 0) setStageHeight(node.clientHeight) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const onHandleDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { startY: event.clientY, from: sheet, moved: 0 }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onHandleMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (drag.current) drag.current.moved = drag.current.startY - event.clientY
  }
  const onHandleUp = () => {
    const gesture = drag.current
    drag.current = null
    if (!gesture) return
    onSheet(Math.abs(gesture.moved) < TAP_SLOP ? nextSnap(gesture.from) : snapAfterDrag(gesture.from, gesture.moved, stageHeight, SHEET_PEEK))
  }

  const height = sheetHeight(sheet, stageHeight, SHEET_PEEK) ?? SHEET_PEEK
  // The canvas takes the room above the sheet (peek or half), in one step, so whatever was framed stays in
  // view when the inspector opens. At 'full' it keeps the half size: it is covered anyway.
  const canvasInset = sheet === 'peek' ? SHEET_PEEK : sheetHeight('half', stageHeight, SHEET_PEEK) ?? SHEET_PEEK

  return (
    <section data-atlas-stage="v2" data-atlas-projection="phone" data-atlas-plate={plate} data-atlas-depth={depth} data-pmd-body-exposure="true" data-pmd-unclamped="true" data-pmd-liquid="off" aria-label="Body Exposure 3D atlas" style={{ color: TONE.text }}>
      <style>{STAGE_CSS}</style>
      <div ref={stageRef} className={STAGE_ROOT_CLASS} style={{ ...rootFrame, minHeight: 560, position: 'relative', background: TONE.bg }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: canvasInset }}>{viewer}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: SHEET_PEEK }}>
          <div aria-hidden style={stageGlow} />
          <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'flex-start', gap: 8, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto', flex: 1, minWidth: 0, display: 'flex' }}>{search}</div>
            <div style={{ pointerEvents: 'auto' }}>{resetButton}</div>
          </div>
          <div style={{ position: 'absolute', left: 10, top: 64, bottom: 62, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>{rail}</div>
          </div>
          <div style={{ position: 'absolute', right: 10, top: 64, pointerEvents: 'none' }}>{depthBadge}</div>
          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, pointerEvents: 'auto' }}>{regionChips}</div>
        </div>

        <div
          role="region"
          aria-label="Atlas inspector"
          data-testid="atlas-side-panel"
          data-atlas-sheet={sheet}
          className="as-move"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height, display: 'flex', flexDirection: 'column', background: TONE.panelSolid, borderTop: `1px solid ${TONE.lineStrong}`, borderRadius: '20px 20px 0 0', boxShadow: '0 -18px 40px rgba(0, 0, 0, 0.5)' }}
        >
          <button
            type="button"
            aria-label={sheet === 'peek' ? 'Open the inspector' : sheet === 'half' ? 'Expand the inspector' : 'Collapse the inspector'}
            aria-expanded={sheet !== 'peek'}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={() => { drag.current = null }}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSheet(nextSnap(sheet)) } }}
            className="as-focus"
            style={{ flex: 'none', height: 28, width: '100%', display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', cursor: 'grab', touchAction: 'none' }}
          >
            <span aria-hidden style={{ width: 44, height: 5, borderRadius: 3, background: TONE.lineStrong }} />
          </button>
          <div style={{ flex: 'none', padding: '0 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 40 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: TONE.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peekTitle}</div>
                <div style={{ marginTop: 2 }}>{referenceChip}</div>
              </div>
              {peekAction}
            </div>
            <div style={{ marginTop: 8 }}>{tabs}</div>
          </div>
          {/* A peeking sheet is only its header; its content is not rendered, so nothing invisible is focusable. */}
          {sheet !== 'peek' && (
            <div className="as-panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: `1px solid ${TONE.line}` }}>
              <div style={{ paddingTop: 12 }}>{inspectorHeader}</div>
              {inspectorBody}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
