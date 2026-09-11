import { useMemo, useState, type KeyboardEvent } from 'react'

type RadiologyModality = 'mri' | 'mra' | 'ct' | 'pet' | 'mammography'

type ModalityDefinition = {
  id: RadiologyModality
  label: string
  shortLabel: string
  description: string
  learningFocus: readonly string[]
  sourceRule: string
  quantitativeRule: string
}

const MODALITIES: readonly ModalityDefinition[] = [
  {
    id: 'mri',
    label: 'MRI',
    shortLabel: 'MRI',
    description: 'Multiplanar magnetic-resonance study review with synchronized slice context and 3D voxel orientation when compatible source data are loaded.',
    learningFocus: ['Axial / coronal / sagittal', 'Sequence identity', '3D voxel context', 'Patient orientation'],
    sourceRule: 'Only decoded source pixels and metadata from the loaded MR study may drive the image workspace.',
    quantitativeRule: 'No diagnosis, lesion, measurement, segmentation, or patient anatomy is generated from the teaching view.',
  },
  {
    id: 'mra',
    label: 'MR Angiography',
    shortLabel: 'MRA',
    description: 'Vascular MR study workspace for learning arterial and venous anatomy when the loaded series is explicitly identified as an angiographic MR acquisition.',
    learningFocus: ['Arterial anatomy', 'Venous anatomy', 'Source-series identity', 'Multiplanar vessel context'],
    sourceRule: 'MRA mode requires an actual compatible angiographic MR series. An ordinary MRI series is never relabeled as MRA.',
    quantitativeRule: 'No stenosis, aneurysm, occlusion, flow value, or vessel measurement is inferred automatically.',
  },
  {
    id: 'ct',
    label: 'CT Scan',
    shortLabel: 'CT',
    description: 'Cross-sectional CT learning workspace designed for source-backed slice navigation, plane reconstruction, and anatomy correlation.',
    learningFocus: ['Cross-sectional anatomy', 'Multiplanar reconstruction', 'Acquisition metadata', 'Windowing when supported'],
    sourceRule: 'CT display must come from an actual compatible CT series with preserved study and series identity.',
    quantitativeRule: 'Hounsfield-unit or window claims are shown only when the required rescale/window metadata are present; no finding is invented.',
  },
  {
    id: 'pet',
    label: 'PET Scan',
    shortLabel: 'PET',
    description: 'Nuclear-medicine learning workspace for spatially reviewing an actual loaded PET study and, when available, its registered anatomic reference.',
    learningFocus: ['Tracer-image context', 'PET anatomy orientation', 'Registered reference context', 'Quantitation provenance'],
    sourceRule: 'PET mode requires an actual compatible PET series. Fusion is only described as registered when registration evidence exists in the source data.',
    quantitativeRule: 'No SUV, metabolic abnormality, uptake classification, staging, or diagnosis is produced without the required quantitative metadata and validated workflow.',
  },
  {
    id: 'mammography',
    label: 'Mammography',
    shortLabel: 'Mammo',
    description: 'Breast-imaging learning workspace for source mammographic views with explicit view identity and educational anatomy context.',
    learningFocus: ['Breast anatomy', 'View identity', 'Laterality', 'Acquisition context'],
    sourceRule: 'A view is labeled CC, MLO, or another projection only when the source metadata support that identity.',
    quantitativeRule: 'No mass, calcification, density category, BI-RADS assessment, malignancy probability, or diagnosis is generated automatically.',
  },
] as const

export default function RadiologyModalityHub() {
  const [modality, setModality] = useState<RadiologyModality>('mri')
  const selected = useMemo(
    () => MODALITIES.find((item) => item.id === modality) ?? MODALITIES[0],
    [modality],
  )

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % MODALITIES.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + MODALITIES.length) % MODALITIES.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = MODALITIES.length - 1
    if (nextIndex === null) return

    const next = MODALITIES[nextIndex]
    if (!next) return
    event.preventDefault()
    setModality(next.id)
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[nextIndex]?.focus()
  }

  return (
    <section className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-300/[.045]" aria-label="Radiology modality hub">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.17em] text-cyan-700 dark:text-cyan-300">Radiology · multimodality</div>
          <h4 className="mt-1 text-sm font-black text-neutral-950 dark:text-white">MRI · MRA · CT · PET · Mammography</h4>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">One imaging entry point for anatomy education. Every modality stays tied to the identity and metadata of the study that was actually loaded; unavailable data remain unavailable rather than being simulated.</p>
        </div>
        <span className="w-fit rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-black text-cyan-800 dark:border-cyan-300/20 dark:bg-white/5 dark:text-cyan-200">Educational workspace</span>
      </div>

      <div role="tablist" aria-label="Radiology modalities" className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {MODALITIES.map((item, index) => (
          <button
            key={item.id}
            id={`radiology-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={modality === item.id}
            aria-controls="radiology-modality-panel"
            tabIndex={modality === item.id ? 0 : -1}
            onClick={() => setModality(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={`min-h-11 shrink-0 rounded-xl border px-3 text-[10px] font-black transition ${modality === item.id ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300'}`}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div
        id="radiology-modality-panel"
        role="tabpanel"
        aria-labelledby={`radiology-tab-${selected.id}`}
        tabIndex={0}
        className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-[#080c10]"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{selected.label}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.description}</p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">Compatible study required</span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {selected.learningFocus.map((item) => (
            <div key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[9px] font-bold text-neutral-700 dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-200">{item}</div>
          ))}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/[.06]">
            <div className="text-[8px] font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Source rule</div>
            <p className="mt-1 text-[9px] leading-relaxed text-emerald-950 dark:text-emerald-100">{selected.sourceRule}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-300/20 dark:bg-rose-300/[.06]">
            <div className="text-[8px] font-black uppercase tracking-wide text-rose-800 dark:text-rose-200">Clinical boundary</div>
            <p className="mt-1 text-[9px] leading-relaxed text-rose-950 dark:text-rose-100">{selected.quantitativeRule}</p>
          </div>
        </div>

        {modality !== 'mri' && (
          <div role="status" className="mt-3 rounded-xl border border-dashed border-neutral-300 p-3 text-[10px] leading-relaxed text-neutral-500 dark:border-white/15 dark:text-neutral-400">
            No compatible {selected.label} study is loaded in this Body Exposure session. Panacea will not substitute an MRI image, stock image, or generated scan for this modality.
          </div>
        )}

        {modality === 'mri' && (
          <div role="status" className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[10px] leading-relaxed text-sky-900 dark:border-sky-300/20 dark:bg-sky-300/[.06] dark:text-sky-100">
            MRI is the first active imaging workspace: synchronized orthogonal planes, series-aware navigation, patient-orientation guards, and 3D voxel context are being matured before the same source-identity rules are extended to the other modalities.
          </div>
        )}
      </div>
    </section>
  )
}
