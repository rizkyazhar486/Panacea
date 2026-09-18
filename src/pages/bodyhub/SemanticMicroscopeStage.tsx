import { lazy, Suspense } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { BodySemanticScale } from '../../lib/bodySemanticZoom'

const CellLab = lazy(() => import('./CellLab').then((module) => ({ default: module.CellLab })))
const AlphaGenomeAtlas = lazy(() => import('./AlphaGenomeAtlas'))
const VertikalMolekulerPanel = lazy(() => import('./VertikalMolekulerPanel'))
const MolecularChemistryStage = lazy(() => import('./MolecularChemistryStage'))

interface SemanticMicroscopeStageProps {
  scale: BodySemanticScale
  selectedSystemId: BodySystemId
}

const SYSTEM_LABEL: Partial<Record<BodySystemId, string>> = {
  cardiovascular: 'Cardiovascular',
  nervous: 'Nervous',
  respiratory: 'Respiratory',
  digestive: 'Digestive',
  urinary: 'Urinary',
  endocrine: 'Endocrine',
  reproductive: 'Reproductive',
  'lymphatic-immune': 'Lymphatic / immune',
  musculoskeletal: 'Musculoskeletal',
  'sensory-ent': 'Sensory / ENT',
  'integumentary-surface': 'Integumentary',
}

function Loader({ label }: { label: string }) {
  return <div className="grid min-h-44 place-items-center rounded-2xl border border-white/[.08] bg-black/30 text-[10px] font-bold text-white/35" role="status">Loading {label}…</div>
}

function SourceGap({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.045] p-4">
      <div className="text-[9px] font-black uppercase tracking-[.16em] text-amber-200/70">Source resolution boundary</div>
      <div className="mt-1 text-sm font-black text-white/90">{title}</div>
      <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/45">{children}</p>
    </div>
  )
}

export default function SemanticMicroscopeStage({ scale, selectedSystemId }: SemanticMicroscopeStageProps) {
  const systemLabel = SYSTEM_LABEL[selectedSystemId] ?? selectedSystemId

  if (scale === 'tissue') {
    return (
      <SourceGap title={systemLabel + ' tissue microanatomy'}>
        Panacea has reached the resolution boundary of the gross atlas. A tissue view should load only when a source-backed histology or microanatomy asset is registered for this system; the engine must not manufacture a microscopic layer by enlarging the organ mesh.
      </SourceGap>
    )
  }

  if (scale === 'cell' || scale === 'organelle') {
    return (
      <section className="space-y-3">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-3 text-[10px] leading-relaxed text-white/48">
          <b className="text-cyan-100">Reference cellular scale · {systemLabel} context.</b> The current Cell Lab is a general reference cell and metabolic compartment model; it is not yet asserted to be the exact dominant cell type of the selected organ.
        </div>
        <Suspense fallback={<Loader label="cellular 3D reference" />}><CellLab /></Suspense>
      </section>
    )
  }

  if (scale === 'molecule') {
    return (
      <section className="space-y-3">
        <Suspense fallback={<Loader label="molecular chemistry reference" />}>
          <MolecularChemistryStage selectedSystemId={selectedSystemId} />
        </Suspense>
        {selectedSystemId === 'respiratory' ? (
          <Suspense fallback={<Loader label="respiratory molecular vertical" />}>
            <VertikalMolekulerPanel />
          </Suspense>
        ) : null}
      </section>
    )
  }

  if (scale === 'genome') {
    return (
      <section className="space-y-3">
        <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.04] p-3 text-[10px] leading-relaxed text-white/48">
          <b className="text-violet-100">Genome reference · {systemLabel} context.</b> Atlas position never implies a person's genotype, gene expression or disease state.
        </div>
        <Suspense fallback={<Loader label="genome 3D reference" />}><AlphaGenomeAtlas /></Suspense>
      </section>
    )
  }

  return null
}
