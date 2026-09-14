import { useMemo, useState } from 'react'
import { ANATOMY_LAYERS } from '../../components/Body3D'
import { TISSUE_SUBTYPES } from '../../lib/anatomyHierarchy'
import {
  currentSuperficialFasciaEvidenceTier,
  superficialFasciaEvidenceMayPromoteSystem,
} from '../../lib/anatomy/fascialSourceEvidenceLadder'
import { fascialLayerManifestNodeCount } from '../../lib/anatomy/fascialLayerManifestAudit'
import { CURRENT_ARTICULAR_CONVERSION_READINESS } from '../../lib/anatomy/articularConversionReceipt'

type LayerState = 'source-backed-3d' | 'reference-histology' | 'source-discovery' | 'blocked-source'

interface TissueLayerStep {
  id: string
  label: string
  state: LayerState
  examples: string
  meaning: string
}

const STATE_LABEL: Record<LayerState, string> = {
  'source-backed-3d': 'Source-backed gross 3D',
  'reference-histology': 'Reference / histology',
  'source-discovery': 'Source discovery only',
  'blocked-source': 'Blocked pending source proof',
}

const STATE_CLASS: Record<LayerState, string> = {
  'source-backed-3d': 'border-brand/30 bg-brand/10 text-brand',
  'reference-histology': 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'source-discovery': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'blocked-source': 'border-red-400/30 bg-red-400/10 text-red-300',
}

export function TissueLayerContinuumPanel() {
  const [selected, setSelected] = useState('surface')

  const steps = useMemo<TissueLayerStep[]>(() => {
    const hasGrossLayer = (key: string) => ANATOMY_LAYERS.some((layer) => layer.key === key)
    const histologyLabels = new Set(TISSUE_SUBTYPES.map((item) => item.label))

    return [
      {
        id: 'surface',
        label: 'Skin / body surface',
        state: hasGrossLayer('surface') ? 'source-backed-3d' : 'blocked-source',
        examples: 'External body surface; epidermal and dermal microstructure live below gross-atlas scale.',
        meaning: 'The whole-body surface has its own atlas layer. Microscopic epidermis and dermis remain histology-scale representations rather than fake gross meshes.',
      },
      {
        id: 'subcutaneous',
        label: 'Subcutaneous tissue',
        state: histologyLabels.has('Adipose tissue') && histologyLabels.has('Loose (areolar) connective tissue')
          ? 'reference-histology'
          : 'blocked-source',
        examples: 'Adipose tissue · loose areolar connective tissue',
        meaning: 'Panacea has tissue-level reference identities for fat and loose connective tissue, but not a verified whole-body subcutaneous 3D shell.',
      },
      {
        id: 'fascia',
        label: 'Fascia / septa / retinacula',
        state: 'source-discovery',
        examples: `${fascialLayerManifestNodeCount()} pinned fascial manifest names; current evidence tier: ${currentSuperficialFasciaEvidenceTier()}.`,
        meaning: 'Upstream fascial names and compatible bundle metadata are useful discovery evidence. They do not yet prove imported fascia geometry, reference-frame alignment, licence scope or academic review.',
      },
      {
        id: 'musculotendinous',
        label: 'Muscle → tendon interface',
        state: hasGrossLayer('muscular') ? 'source-backed-3d' : 'blocked-source',
        examples: 'Skeletal muscle gross geometry · dense regular connective-tissue histology for tendon/ligament.',
        meaning: 'Major muscles are represented in the shipped muscular atlas. Tendon identity must not be inferred from a neighbouring muscle mesh when the exact tendon is absent.',
      },
      {
        id: 'articular',
        label: 'Joint tissues',
        state: CURRENT_ARTICULAR_CONVERSION_READINESS.readyForQualifiedReview ? 'source-discovery' : 'blocked-source',
        examples: 'Hyaline cartilage · fibrocartilage · capsule / ligament context',
        meaning: `Histology/reference identities exist for cartilage and dense connective tissue. Whole-body articular promotion remains blocked; current conversion state is ${CURRENT_ARTICULAR_CONVERSION_READINESS.status}.`,
      },
      {
        id: 'neurovascular',
        label: 'Vessels + nerves',
        state: hasGrossLayer('cardiovascular') && hasGrossLayer('nervous') ? 'source-backed-3d' : 'blocked-source',
        examples: 'Cardiovascular layer · nervous layer',
        meaning: 'Named source geometry can provide gross neurovascular orientation. Microvasculature, endothelium and nerve microstructure belong to smaller-scale representations.',
      },
      {
        id: 'visceral',
        label: 'Organs / parenchyma',
        state: hasGrossLayer('visceral') ? 'source-backed-3d' : 'blocked-source',
        examples: 'Gross visceral anatomy → organ-specific tissue layers',
        meaning: 'Gross organ geometry is source-backed where present. Organ-specific capsules, mucosae, tunics and microscopic layers need their own source evidence rather than being implied by the organ shell.',
      },
      {
        id: 'microscopic',
        label: 'Histology → cell',
        state: TISSUE_SUBTYPES.length > 0 ? 'reference-histology' : 'blocked-source',
        examples: `${TISSUE_SUBTYPES.length} named microscopic tissue subtypes currently available in the Body hierarchy.`,
        meaning: 'At microscopic scale the correct representation becomes histology/cellular views. Panacea should not stretch a gross 3D mesh down to cellular resolution.',
      },
    ]
  }, [])

  const active = steps.find((step) => step.id === selected) ?? steps[0]

  return (
    <section data-tissue-layer-continuum="v1" className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-white">
      <div className="border-b border-white/10 bg-gradient-to-br from-brand/15 via-transparent to-blue-500/10 p-4">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Whole-body tissue continuum</div>
        <h3 className="mt-1 text-base font-black">Surface → fascia → muscle → joint → neurovascular → organ → histology</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
          One map of what Panacea can actually represent at each tissue depth. Green means shipped gross anatomy; amber/red means the source boundary is still being earned rather than filled with synthetic anatomy.
        </p>
      </div>

      <div className="p-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Tissue continuum levels">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              aria-pressed={active.id === step.id}
              onClick={() => setSelected(step.id)}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-bold transition ${active.id === step.id ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-400'}`}
            >
              {index + 1}. {step.label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3" role="region" aria-live="polite" aria-label={`${active.label} tissue representation`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-black">{active.label}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-neutral-400">{active.examples}</div>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wide ${STATE_CLASS[active.state]}`}>
              {STATE_LABEL[active.state]}
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-300">{active.meaning}</p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-brand">Fascia truth boundary</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
              Manifest and bundle metadata do not promote fascia to verified geometry. Promotion allowed: {superficialFasciaEvidenceMayPromoteSystem() ? 'yes' : 'no'}.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-brand">Joint truth boundary</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
              Conversion bookkeeping can only make an articular candidate ready for qualified review. It never by itself proves cartilage, capsule or ligament anatomy.
            </p>
          </div>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">
          This is a representation continuum, not a universal incision order. Real layer order changes by body region and surgical approach; use the Surgical layers workspace for region-specific sequences. No state here is a patient-specific finding or injury-risk estimate.
        </p>
      </div>
    </section>
  )
}

export default TissueLayerContinuumPanel
