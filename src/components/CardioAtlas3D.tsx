import { useMemo, useRef, useState } from 'react'
import AtlasViewer3D, { type PartMeta } from './AtlasViewer3D'
import CardiacCycle3D from './CardiacCycle3D'
import { CARDIO_PARTS } from '../lib/cardioAtlas.gen'
import type { FlowPath } from '../lib/cardioFlow'

// Ruang kardiovaskular punya dua render yang memakai sumber anatomi yang sama:
// atlas sirkulasi untuk memilih pembuluh/patologi, dan cardiac-cycle render yang
// mempertahankan geometri GLB sumber sambil menambahkan gerak aliran serta fase
// katup/ruang jantung. Keduanya adalah visualisasi WebGL, bukan pengganti review
// anatomi atau model haemodinamik pasien.

export interface CardioProps {
  lesi?: string[]
  hilir?: string[]
  jalur?: FlowPath | null
  hr?: number
  wilayah?: string | null
  onPilih?: (nama: string | null) => void
  dipilih?: string | null
}

type CardioMode = 'atlas' | 'cycle'

const MODES: CardioMode[] = ['atlas', 'cycle']

export function CardioAtlas3D(props: CardioProps) {
  const [mode, setMode] = useState<CardioMode>('atlas')
  const tabRefs = useRef<Record<CardioMode, HTMLButtonElement | null>>({ atlas: null, cycle: null })
  const bagian = useMemo<PartMeta[]>(
    () => CARDIO_PARTS.map((p) => ({ name: p.name, kind: p.kind, group: p.region })),
    [],
  )

  function pilihMode(next: CardioMode, focus = false) {
    setMode(next)
    if (focus) requestAnimationFrame(() => tabRefs.current[next]?.focus())
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = MODES.indexOf(mode)
    if (index < 0) return
    let next: CardioMode | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = MODES[(index + 1) % MODES.length]
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = MODES[(index - 1 + MODES.length) % MODES.length]
    if (event.key === 'Home') next = MODES[0]
    if (event.key === 'End') next = MODES[MODES.length - 1]
    if (!next) return
    event.preventDefault()
    pilihMode(next, true)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Cardiovascular 3D render mode">
        <button
          ref={(node) => { tabRefs.current.atlas = node }}
          id="cardio-tab-atlas"
          type="button"
          role="tab"
          aria-selected={mode === 'atlas'}
          aria-controls="cardio-panel-atlas"
          tabIndex={mode === 'atlas' ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => pilihMode('atlas')}
          className={`min-h-11 shrink-0 rounded-full border px-3 text-[11px] font-bold ${
            mode === 'atlas' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
          }`}
        >
          Circulation atlas
        </button>
        <button
          ref={(node) => { tabRefs.current.cycle = node }}
          id="cardio-tab-cycle"
          type="button"
          role="tab"
          aria-selected={mode === 'cycle'}
          aria-controls="cardio-panel-cycle"
          tabIndex={mode === 'cycle' ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => pilihMode('cycle')}
          className={`min-h-11 shrink-0 rounded-full border px-3 text-[11px] font-bold ${
            mode === 'cycle' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
          }`}
        >
          Cardiac cycle 3D
        </button>
      </div>

      <div
        id={mode === 'atlas' ? 'cardio-panel-atlas' : 'cardio-panel-cycle'}
        role="tabpanel"
        aria-labelledby={mode === 'atlas' ? 'cardio-tab-atlas' : 'cardio-tab-cycle'}
        tabIndex={0}
        className="outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
      >
        {mode === 'atlas' ? (
          <AtlasViewer3D berkas="cardio/cardio.glb" bagian={bagian} {...props} />
        ) : (
          <CardiacCycle3D hr={props.hr ?? 72} />
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {mode === 'atlas' ? 'Circulation atlas 3D active.' : 'Cardiac cycle 3D active.'}
      </p>
    </div>
  )
}

export default CardioAtlas3D
