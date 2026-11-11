// Small presentational pieces of the atlas stage. They hold no state and decide nothing: every label, list
// and handler is handed in.

import type { ReactNode } from 'react'
import type { AtlasRegion } from '../../engine/atlas-stage/regionFraming'
import type { AtlasLayerInfo } from '../../engine/atlas-stage/stageLayers'
import { TONE, TOUCH, eyebrow, glass, iconButton } from './stageTokens'

export function Tag({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 24, padding: '0 10px', borderRadius: 999, border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 800 }}>
      {children}
    </span>
  )
}

export function Note({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, borderLeft: `3px solid ${color}`, background: TONE.raised, fontSize: 12, lineHeight: 1.5, color: TONE.dim }}>
      {children}
    </div>
  )
}

export interface SegmentOption<T extends string> { id: T; label: string }

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly SegmentOption<T>[]; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 14, background: 'rgba(0, 0, 0, 0.4)', border: `1px solid ${TONE.line}` }}>
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className="as-focus as-fade"
            style={{ flex: 1, minHeight: TOUCH - 4, padding: '0 6px', border: 'none', borderRadius: 11, background: active ? TONE.active : 'transparent', color: active ? TONE.onActive : TONE.dim, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export interface StageTab<T extends string> { id: T; label: string; short: string }

/** The three-stage switcher. `compact` shows the short names; the full name stays the accessible name. */
export function StageTabs<T extends string>({ tabs, value, compact, onChange }: { tabs: readonly StageTab<T>[]; value: T; compact: boolean; onChange: (id: T) => void }) {
  return (
    <div role="tablist" aria-label="Atlas stage" style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 14, background: 'rgba(0, 0, 0, 0.4)', border: `1px solid ${TONE.line}`, width: compact ? '100%' : undefined }}>
      {tabs.map((item) => {
        const active = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            className="as-focus as-fade"
            style={{ flex: compact ? 1 : undefined, minHeight: compact ? TOUCH : 36, padding: compact ? '0 6px' : '0 14px', border: 'none', borderRadius: 11, background: active ? TONE.active : 'transparent', color: active ? TONE.onActive : TONE.dim, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {compact ? item.short : item.label}
          </button>
        )
      })}
    </div>
  )
}

export function RegionChips({ regions, active, onRegion }: { regions: readonly AtlasRegion[]; active: string; onRegion: (id: string) => void }) {
  return (
    <div role="group" aria-label="Frame a body region" className="as-scroll" style={{ ...glass, borderRadius: 22, padding: 4, display: 'flex', gap: 2, overflowX: 'auto', maxWidth: '100%' }}>
      {regions.map((region) => {
        const on = active === region.id
        return (
          <button
            key={region.id}
            type="button"
            aria-pressed={on}
            onClick={() => onRegion(region.id)}
            className="as-focus as-fade"
            style={{ minHeight: TOUCH - 8, padding: '0 12px', border: 'none', borderRadius: 18, background: on ? TONE.active : 'transparent', color: on ? TONE.onActive : TONE.dim, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
          >
            {region.label}
          </button>
        )
      })}
    </div>
  )
}

export function CameraButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onPress} className="as-focus as-hover as-fade" style={iconButton}>
      {children}
    </button>
  )
}

export function ResetGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  )
}

/** Always on the stage: what is shown is a reference atlas, not the person looking at it. */
export function ReferenceChip({ tight }: { tight: boolean }) {
  return (
    <span data-atlas-reference="true" style={{ ...eyebrow, display: 'inline-flex', alignItems: 'center', gap: 6, color: TONE.ref, letterSpacing: tight ? '0.04em' : '0.1em' }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: TONE.ref }} />
      Reference anatomy · not a scan of you
    </span>
  )
}

export function DepthBadge({ layer, count }: { layer: AtlasLayerInfo; count: number }) {
  return (
    <div aria-live="polite" style={{ ...glass, borderRadius: 14, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 8, color: TONE.text, fontSize: 13, fontWeight: 800 }}>
      <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: layer.color }} />
      {layer.short}
      <span style={{ color: TONE.faint, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{layer.peelRank + 1}/{count}</span>
    </div>
  )
}
