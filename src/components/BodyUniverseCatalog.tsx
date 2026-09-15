import { useMemo, useState } from 'react'
import { BODY_FX_PRESETS } from '../lib/bodyVisualFxEngine'
import { BODY_IMAGING_UNIVERSE } from '../lib/bodyImagingUniverse'
import { BODY_MICRO_WORLDS } from '../lib/bodyMicroWorldUniverse'
import { BODY_MOTION_RECIPES } from '../lib/bodyMotionLanguage'
import { allSurgicalProcedureConcepts } from '../lib/bodySurgeryUniverse'

type CatalogKind = 'surgery' | 'micro' | 'imaging' | 'fx' | 'motion'

type CatalogItem = {
  id: string
  title: string
  kind: CatalogKind
  eyebrow: string
  description: string
  tags: string[]
  detail: string[]
}

const CATALOGS: readonly { id: CatalogKind; label: string; description: string }[] = [
  { id: 'surgery', label: 'Surgery', description: 'Multi-specialty spatial procedure concepts.' },
  { id: 'micro', label: 'Micro Worlds', description: 'Organ → tissue → cell → organelle → molecular → gene.' },
  { id: 'imaging', label: 'Imaging', description: 'Multimodal slice, beam, projection and endoscopic concepts.' },
  { id: 'fx', label: 'Visual FX', description: 'Reusable visual language for glass, spectral, clinical and cinematic states.' },
  { id: 'motion', label: 'Motion', description: 'Reusable physics recipes for navigation and interaction.' },
]

function catalogItems(kind: CatalogKind): CatalogItem[] {
  if (kind === 'surgery') {
    return allSurgicalProcedureConcepts().map((item) => ({
      id: `surgery:${item.specialty}:${item.id}`,
      title: item.title,
      kind,
      eyebrow: item.specialtyLabel,
      description: `${item.region} · ${item.approach.join(' / ')}`,
      tags: [...item.anatomy.slice(0, 5)],
      detail: [...item.learningTargets, ...item.simulatorModes.map((mode) => `Simulator · ${mode}`)],
    }))
  }

  if (kind === 'micro') {
    return BODY_MICRO_WORLDS.map((world) => ({
      id: `micro:${world.id}`,
      title: world.label,
      kind,
      eyebrow: 'Continuous micro world',
      description: `${world.layers.length} scales from organ to gene`,
      tags: world.layers.map((item) => item.scale),
      detail: world.layers.flatMap((item) => [
        `${item.label} · ${item.entities.slice(0, 4).join(', ')}`,
        `Interactions · ${item.interactions.slice(0, 4).join(', ')}`,
      ]),
    }))
  }

  if (kind === 'imaging') {
    return BODY_IMAGING_UNIVERSE.map((preset) => ({
      id: `imaging:${preset.id}`,
      title: preset.title,
      kind,
      eyebrow: `${preset.modality.toUpperCase()} · ${preset.plane}`,
      description: `${preset.region} teaching preset`,
      tags: [...preset.emphasis.slice(0, 5)],
      detail: [
        `3D sync · ${preset.synchronized3d.join(', ')}`,
        `Interactions · ${preset.interactions.join(', ')}`,
      ],
    }))
  }

  if (kind === 'fx') {
    return BODY_FX_PRESETS.map((preset) => ({
      id: `fx:${preset.id}`,
      title: preset.label,
      kind,
      eyebrow: preset.family,
      description: preset.notes,
      tags: [`blur ${preset.blur}`, `glow ${preset.glow}`, `depth ${preset.depth}`, `motion ${preset.motion}`],
      detail: [
        `Palette · ${preset.palette.join(' · ')}`,
        `Saturation · ${preset.saturation}`,
        `Contrast · ${preset.contrast}`,
        `Refraction · ${preset.refraction}`,
      ],
    }))
  }

  return BODY_MOTION_RECIPES.map((recipe) => ({
    id: `motion:${recipe.id}`,
    title: recipe.label,
    kind,
    eyebrow: `${recipe.intent} · ${recipe.physics}`,
    description: recipe.notes,
    tags: [`${recipe.durationMs} ms`, `distance ${recipe.distance}`, `scale ${recipe.scale}`, `blur ${recipe.blurFrom}`],
    detail: [
      `Spring · stiffness ${recipe.stiffness}, damping ${recipe.damping}, mass ${recipe.mass}`,
      `Opacity from · ${recipe.opacityFrom}`,
      `Reduced motion · ${recipe.reducedMotionFallback}`,
    ],
  }))
}

export default function BodyUniverseCatalog() {
  const [kind, setKind] = useState<CatalogKind>('surgery')
  const [query, setQuery] = useState('')
  const allItems = useMemo(() => catalogItems(kind), [kind])
  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return allItems
    return allItems.filter((item) => [item.title, item.eyebrow, item.description, ...item.tags, ...item.detail].join(' ').toLowerCase().includes(normalized))
  }, [allItems, query])
  const [selectedId, setSelectedId] = useState('')
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  const currentCatalog = CATALOGS.find((item) => item.id === kind) ?? CATALOGS[0]

  function chooseKind(next: CatalogKind) {
    setKind(next)
    setQuery('')
    setSelectedId('')
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#030508]/95 shadow-[0_26px_90px_rgba(0,0,0,.44)]" aria-labelledby="universe-catalog-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-[-10%] top-[-35%] h-[480px] w-[480px] rounded-full bg-cyan-400/[.06] blur-[145px]" />
        <div className="absolute right-[-12%] top-[4%] h-[500px] w-[500px] rounded-full bg-violet-500/[.055] blur-[150px]" />
      </div>

      <header className="relative z-[2] border-b border-white/[.065] p-4 sm:p-5 lg:p-6">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Universe Catalog · Experimental foundations</div>
        <h3 id="universe-catalog-title" className="mt-2 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">One browser for surgery, micro worlds, imaging, visual FX and motion.</h3>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/45">The catalog exposes reusable primitives produced by the high-output Body Exposure branch so future modules can compose them instead of rebuilding isolated one-off experiences.</p>
      </header>

      <div className="relative z-[2] border-b border-white/[.06] p-3 sm:p-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {CATALOGS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseKind(item.id)}
              className={`min-h-[40px] shrink-0 rounded-full border px-4 text-[10px] font-black transition ${kind === item.id ? 'border-cyan-300/25 bg-cyan-300/[.08] text-cyan-100' : 'border-white/[.07] bg-white/[.02] text-white/38 hover:bg-white/[.045] hover:text-white/68'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-[2] grid xl:grid-cols-[minmax(0,.95fr)_minmax(380px,.65fr)]">
        <div className="min-w-0 border-b border-white/[.06] p-4 xl:border-b-0 xl:border-r sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/26">{currentCatalog.label}</div>
              <div className="mt-1 text-[10px] font-medium text-white/32">{currentCatalog.description}</div>
            </div>
            <label className="sm:w-[300px]">
              <span className="sr-only">Search catalog</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${currentCatalog.label.toLowerCase()}…`} className="min-h-[42px] w-full rounded-[14px] border border-white/[.08] bg-black/30 px-3 text-[10px] font-bold text-white/62 outline-none placeholder:text-white/22 focus:border-cyan-300/20" />
            </label>
          </div>

          <div className="mt-3 text-[8px] font-black uppercase tracking-[.14em] text-white/22">{items.length} visible items</div>
          <div className="mt-3 grid max-h-[680px] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((item) => {
              const active = selected?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-[18px] border p-3 text-left transition ${active ? 'border-cyan-300/25 bg-cyan-300/[.07]' : 'border-white/[.06] bg-white/[.022] hover:border-white/[.11] hover:bg-white/[.04]'}`}
                >
                  <div className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-100/50">{item.eyebrow}</div>
                  <div className="mt-1.5 text-[11px] font-black leading-tight text-white/74">{item.title}</div>
                  <div className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-relaxed text-white/30">{item.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-white/[.04] px-2 py-1 text-[7px] font-bold text-white/24">{tag}</span>)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="p-4 sm:p-5">
          {selected ? (
            <div className="sticky top-[74px]">
              <div className="rounded-[24px] border border-cyan-300/[.09] bg-[linear-gradient(145deg,rgba(34,211,238,.05),rgba(139,92,246,.035),rgba(236,72,153,.02))] p-4">
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-100/55">{selected.eyebrow}</div>
                <h4 className="mt-2 text-xl font-black tracking-[-.025em] text-white/84">{selected.title}</h4>
                <p className="mt-2 text-[10px] font-medium leading-relaxed text-white/36">{selected.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => <span key={tag} className="rounded-full border border-white/[.06] bg-black/25 px-2 py-1 text-[8px] font-bold text-white/30">{tag}</span>)}
                </div>
                <div className="mt-4 space-y-2 border-t border-white/[.06] pt-4">
                  {selected.detail.map((detail) => <div key={detail} className="rounded-[14px] border border-white/[.055] bg-black/22 px-3 py-2.5 text-[9px] font-medium leading-relaxed text-white/34">{detail}</div>)}
                </div>
              </div>
              <div className="mt-3 rounded-[18px] border border-white/[.06] bg-white/[.02] p-3 text-[8px] font-medium leading-relaxed text-white/24">Catalog entries are product and education primitives. Source-backed anatomy, validated imaging behavior, and clinical review remain separate quality gates.</div>
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-[22px] border border-white/[.06] bg-white/[.02] text-[10px] font-bold text-white/24">No matching catalog entries.</div>
          )}
        </aside>
      </div>
    </section>
  )
}
