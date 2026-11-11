// Find a structure by name. Only names that exist in the shipped atlas files can be returned (the index is
// generated from those files), so a result always leads to something the stage can show.
//
// The index is 2,586 names and loads on first use, not with the stage.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { readAtlasSide } from '../../engine/atlas-stage/sideLabel'
import type { AtlasLayerId, AtlasLayerInfo } from '../../engine/atlas-stage/stageLayers'
import { TONE, TOUCH, glass, iconButton } from './stageTokens'

export interface StageSearchHit {
  /** Exact node name in the atlas file. */
  name: string
  layer: AtlasLayerId
}

interface StageSearchProps {
  /** Phone: a button that opens the field. Wide stage: the field is always there. */
  compact: boolean
  /** Layer facts for the colour dot and the layer name of each result. */
  layers: readonly AtlasLayerInfo[]
  onSelect: (hit: StageSearchHit) => void
}

type Finder = (query: string) => StageSearchHit[]
type IndexState = { status: 'idle' } | { status: 'loading' } | { status: 'ready'; find: Finder } | { status: 'failed' }

const MAX_RESULTS = 8
const MIN_QUERY = 2

export function StageSearch({ compact, layers, onSelect }: StageSearchProps) {
  const [open, setOpen] = useState(!compact)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<IndexState>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const alive = useRef(true)
  const listId = useId()

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { setOpen(!compact) }, [compact])

  const loadIndex = () => {
    if (index.status !== 'idle' && index.status !== 'failed') return
    setIndex({ status: 'loading' })
    import('../../../../lib/bodySearch')
      .then((mod) => {
        if (!alive.current) return
        setIndex({
          status: 'ready',
          find: (text) => mod.cariTubuh(text, {}, MAX_RESULTS).map((hit) => ({ name: hit.struktur.n, layer: hit.struktur.l })),
        })
      })
      .catch(() => { if (alive.current) setIndex({ status: 'failed' }) })
  }

  const trimmed = query.trim()
  const results = index.status === 'ready' && trimmed.length >= MIN_QUERY ? index.find(trimmed) : []
  const showPanel = open && trimmed.length >= MIN_QUERY

  const choose = (hit: StageSearchHit) => {
    onSelect(hit)
    setQuery('')
    if (compact) setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search a structure"
        className="as-focus as-hover as-fade"
        style={iconButton}
        onClick={() => { setOpen(true); loadIndex(); requestAnimationFrame(() => inputRef.current?.focus()) }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    )
  }

  return (
    <div style={{ width: compact ? '100%' : 300, maxWidth: '100%', position: 'relative', zIndex: 5 }} data-atlas-search="v1">
      <div className="as-field as-fade" style={{ ...glass, display: 'flex', alignItems: 'center', gap: 8, height: TOUCH, padding: '0 6px 0 14px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TONE.dim} strokeWidth="2.2" strokeLinecap="round" aria-hidden style={{ flex: 'none' }}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          maxLength={80}
          placeholder="Search a structure — femur, aorta…"
          aria-label="Search a structure by name"
          aria-controls={showPanel ? listId : undefined}
          autoComplete="off"
          spellCheck={false}
          onFocus={loadIndex}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) { event.preventDefault(); choose(results[0]) }
            if (event.key === 'Escape') { setQuery(''); if (compact) setOpen(false) }
          }}
          style={{ flex: 1, minWidth: 0, height: 32, background: 'transparent', border: 'none', outline: 'none', color: TONE.text, fontSize: 14 }}
        />
        {compact && (
          <button
            type="button"
            aria-label="Close search"
            className="as-focus as-fade"
            onClick={() => { setQuery(''); setOpen(false) }}
            style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 12, background: 'transparent', color: TONE.dim, cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        )}
      </div>

      {showPanel && (
        <div id={listId} role="group" aria-label="Matching structures" style={{ ...glass, marginTop: 6, padding: 4, background: TONE.panelSolid, maxHeight: 288, overflowY: 'auto' }} className="as-panel-scroll">
          {index.status === 'loading' && <SearchNote>Loading the structure index…</SearchNote>}
          {index.status === 'failed' && (
            <SearchNote>
              The structure index could not be loaded.{' '}
              <button type="button" className="as-focus" onClick={loadIndex} style={{ background: 'none', border: 'none', color: TONE.ref, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Try again</button>
            </SearchNote>
          )}
          {index.status === 'ready' && results.length === 0 && <SearchNote>No structure with that name in this atlas.</SearchNote>}
          {results.map((hit) => {
            const side = readAtlasSide(hit.name)
            const layer = layers.find((item) => item.id === hit.layer)
            return (
              <button
                key={`${hit.layer}:${hit.name}`}
                type="button"
                className="as-focus as-hover as-fade"
                onClick={() => choose(hit)}
                style={{ width: '100%', minHeight: TOUCH, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', border: '1px solid transparent', borderRadius: 12, background: 'transparent', color: TONE.text, cursor: 'pointer', textAlign: 'left' }}
              >
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: layer?.color ?? TONE.faint, flex: 'none' }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {side.base}{side.side ? ` · ${side.side}` : ''}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: TONE.faint }}>
                    {layer?.short ?? hit.layer}{side.review ? ' · side label under review' : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SearchNote({ children }: { children: ReactNode }) {
  return <p role="status" style={{ margin: 0, padding: '10px 12px', fontSize: 12, lineHeight: 1.45, color: TONE.dim }}>{children}</p>
}
