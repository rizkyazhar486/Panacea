import { useMemo, useState } from 'react'
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

export function CardioAtlas3D(props: CardioProps) {
  const [mode, setMode] = useState<'atlas' | 'cycle'>('atlas')
  const bagian = useMemo<PartMeta[]>(
    () => CARDIO_PARTS.map((p) => ({ name: p.name, kind: p.kind, group: p.region })),
    [],
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5" role="group" aria-label="Cardiovascular 3D render mode">
        <button
          type="button"
          onClick={() => setMode('atlas')}
          aria-pressed={mode === 'atlas'}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
            mode === 'atlas' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
          }`}
        >
          Circulation atlas
        </button>
        <button
          type="button"
          onClick={() => setMode('cycle')}
          aria-pressed={mode === 'cycle'}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
            mode === 'cycle' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
          }`}
        >
          Cardiac cycle 3D
        </button>
      </div>

      {mode === 'atlas' ? (
        <AtlasViewer3D berkas="cardio/cardio.glb" bagian={bagian} {...props} />
      ) : (
        <CardiacCycle3D hr={props.hr ?? 72} />
      )}
    </div>
  )
}

export default CardioAtlas3D
