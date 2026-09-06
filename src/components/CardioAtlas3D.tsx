import { useMemo } from 'react'
import AtlasViewer3D, { type PartMeta } from './AtlasViewer3D'
import { CARDIO_PARTS } from '../lib/cardioAtlas.gen'
import type { FlowPath } from '../lib/cardioFlow'

// Ruang kardiovaskular memakai penampil atlas yang sama dengan modul
// spesialisasi lain — lihat AtlasViewer3D.tsx. Yang disediakan di sini hanya
// berkasnya dan daftar strukturnya, dengan WILAYAH tubuh sebagai pengelompokan
// (jantung, koroner, kepala, tungkai, dan seterusnya).

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
  const bagian = useMemo<PartMeta[]>(
    () => CARDIO_PARTS.map((p) => ({ name: p.name, kind: p.kind, group: p.region })),
    [],
  )
  return <AtlasViewer3D berkas="cardio/cardio.glb" bagian={bagian} {...props} />
}

export default CardioAtlas3D
