import { useMemo, useState } from 'react'
import {
  ANATOMY_LAYERS,
  Body3D,
  CT_WINDOWS,
  MOTION_REST,
  type AnatomyLayer,
  type RenderMode,
} from './Body3D'
import { ORGAN_FOCUS } from '../lib/organFocus'
import {
  CORE_WHOLE_BODY_LAYERS,
  EXPOSURE_DEPTHS,
  canonicalStructureId,
  depthDefinition,
  type ExposureDepth,
} from '../lib/bodyExposureModel'

const PRIORITY_ORGANS = [
  'heart',
  'lungs',
  'brain',
  'liver',
  'kidneys',
  'stomach',
  'small-intestine',
  'large-intestine',
  'pancreas',
  'thyroid',
  'eye',
  'spinal-cord',
]

const RENDER_OPTIONS: Array<{ key: RenderMode; label: string }> = [
  { key: 'anatomy', label: 'Anatomy' },
  { key: 'xray', label: 'X-ray' },
  { key: 'ct', label: 'CT' },
  { key: 'mriT1', label: 'MRI T1' },
  { key: 'mriT2', label: 'MRI T2' },
]

interface SelectedStructure {
  raw: string
  label: string
  id: string
}

function controlClass(active: boolean) {
  return active
    ? 'border-cyan-300/60 bg-cyan-300/15 text-white shadow-[0_0_22px_rgba(34,211,238,.12)]'
    : 'border-white/10 bg-white/[.035] text-neutral-400 hover:border-white/20 hover:text-white'
}

export function CanonicalBodyExposure() {
  const [depth, setDepth] = useState<ExposureDepth>('body')
  const [layers, setLayers] = useState<Set<AnatomyLayer['key']>>(
    () => new Set(CORE_WHOLE_BODY_LAYERS),
  )
  const [organKey, setOrganKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedStructure | null>(null)
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomy')

  const selectedOrgan = useMemo(
    () => ORGAN_FOCUS.find((organ) => organ.key === organKey) ?? null,
    [organKey],
  )
  const priorityOrgans = useMemo(
    () => PRIORITY_ORGANS.map((key) => ORGAN_FOCUS.find((organ) => organ.key === key)).filter(Boolean),
    [],
  )
  const depthInfo = depthDefinition(depth)

  function toggleLayer(key: AnatomyLayer['key']) {
    setOrganKey(null)
    setDepth('body')
    setLayers((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function focusOrgan(key: string) {
    const organ = ORGAN_FOCUS.find((item) => item.key === key)
    if (!organ) return
    setOrganKey(key)
    setDepth('organ')
    setSelected(null)
    setLayers((current) => {
      const next = new Set(current)
      next.add(organ.layer)
      return next
    })
  }

  function resetWholeBody() {
    setDepth('body')
    setOrganKey(null)
    setSelected(null)
    setLayers(new Set(CORE_WHOLE_BODY_LAYERS))
    setRenderMode('anatomy')
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 pb-10 pt-3 sm:px-5 lg:px-7">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300/80">Panaceamed · Body Exposure</div>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">One body. One atlas. One state.</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Start from the complete human body, then move inward without opening a second anatomy product.
          </p>
        </div>
        <button
          type="button"
          onClick={resetWholeBody}
          className="rounded-full border border-white/15 bg-white/[.045] px-3 py-2 text-[11px] font-black text-white transition hover:bg-white/[.08]"
        >
          Reset whole body
        </button>
      </header>

      <section className="mb-3 overflow-x-auto pb-1" aria-label="Anatomical depth">
        <div className="flex min-w-max items-center gap-1.5">
          {EXPOSURE_DEPTHS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDepth(item.key)}
              className={`rounded-full border px-3 py-2 text-[11px] font-black transition ${controlClass(depth === item.key)}`}
              title={item.hint}
            >
              <span className="mr-1 text-[9px] text-neutral-500">0{index + 1}</span>{item.label}
            </button>
          ))}
          <span className="ml-2 text-[10px] text-neutral-500">{depthInfo.hint}</span>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#05070b] shadow-[0_18px_80px_rgba(0,0,0,.32)]">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[.16em] text-neutral-500">View</span>
            {RENDER_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRenderMode(option.key)}
                className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition ${controlClass(renderMode === option.key)}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative h-[62vh] min-h-[500px] max-h-[820px] w-full sm:h-[68vh]">
            <Body3D
              layers={layers}
              highlighted={selected ? [selected.raw] : selectedOrgan?.keywords ?? []}
              focusKeywords={selectedOrgan?.keywords ?? null}
              renderMode={renderMode}
              ctWindow={CT_WINDOWS[0]}
              slicePlane="none"
              slicePos={0}
              motion={MOTION_REST}
              unfold={0}
              dissect={depthInfo.dissect}
              onPick={(raw, label) => {
                setSelected({ raw, label, id: canonicalStructureId(raw) })
                if (depth === 'body') setDepth('organ')
              }}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-bold text-neutral-300 backdrop-blur-xl">
              Drag to orbit · pinch/scroll to zoom · tap anatomy to inspect
            </div>
          </div>

          <div className="border-t border-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[.15em] text-neutral-500">Layers</span>
              {ANATOMY_LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => toggleLayer(layer.key)}
                  className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition ${controlClass(layers.has(layer.key))}`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="min-w-0 rounded-[24px] border border-white/10 bg-[#07090e] p-3.5 lg:sticky lg:top-3 lg:self-start">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300/80">Context</div>
          <div className="mt-2 border-b border-white/10 pb-3">
            <div className="text-[11px] font-bold text-neutral-500">Current scale</div>
            <div className="mt-0.5 text-lg font-black text-white">{depthInfo.label}</div>
          </div>

          <div className="border-b border-white/10 py-3">
            <div className="text-[11px] font-bold text-neutral-500">Selected structure</div>
            <div className="mt-1 text-sm font-black leading-snug text-white">
              {selected?.label ?? selectedOrgan?.label ?? 'Whole human body'}
            </div>
            {selected && <div className="mt-1 break-all font-mono text-[9px] text-cyan-300/70">{selected.id}</div>}
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
              {selectedOrgan
                ? `Focus remains anchored to ${selectedOrgan.label}; changing scale does not create a second viewer.`
                : 'Choose an organ or tap a named structure. The same model remains the source of spatial context.'}
            </p>
          </div>

          <div className="py-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[.15em] text-neutral-500">Priority organs</div>
            <div className="grid grid-cols-2 gap-1.5">
              {priorityOrgans.map((organ) => organ && (
                <button
                  key={organ.key}
                  type="button"
                  onClick={() => focusOrgan(organ.key)}
                  className={`rounded-xl border px-2.5 py-2 text-left text-[10px] font-bold transition ${controlClass(organKey === organ.key)}`}
                >
                  {organ.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 text-[10px] leading-relaxed text-neutral-500">
            Geometry source: repository anatomy assets derived from Z-Anatomy / BodyParts3D. Licensing and attribution remain in <span className="font-mono text-neutral-400">public/anatomy/CREDITS.txt</span>.
          </div>
        </aside>
      </section>

      {depth === 'molecular' && (
        <section className="mt-3 rounded-[22px] border border-amber-300/15 bg-amber-300/[.035] p-4">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-amber-200/80">Cross-scale guardrail</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-300">
            Molecular mode keeps the gross-anatomy selection as context, but it does not pretend that a molecule has a validated coordinate inside this mesh. Molecular bridges must be attached only where the repository has an explicit evidence-backed mapping.
          </p>
        </section>
      )}
    </main>
  )
}

export default CanonicalBodyExposure
