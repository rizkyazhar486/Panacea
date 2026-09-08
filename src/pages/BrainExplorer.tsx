import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AtlasViewer3D, { type PartMeta } from '../components/AtlasViewer3D'
import { Card, SectionTitle } from '../components/ui'
import { partsForModule, type AtlasPart } from '../lib/systemAtlas.gen'

type BrainRegion =
  | 'cortex'
  | 'deep-limbic'
  | 'brainstem'
  | 'cerebellum'
  | 'ventricles'
  | 'visual-pathway'
  | 'cranial-nerves'
  | 'circulation'
  | 'other'

const REGION_ORDER: Array<{ key: BrainRegion; label: string; note: string }> = [
  { key: 'cortex', label: 'Cortex', note: 'Gyri, cortical structures, insula and opercular anatomy.' },
  { key: 'deep-limbic', label: 'Deep & limbic', note: 'Thalamic, basal-ganglia and limbic structures present in the source atlas.' },
  { key: 'brainstem', label: 'Brainstem', note: 'Midbrain, pons, medulla and related named structures.' },
  { key: 'cerebellum', label: 'Cerebellum', note: 'Cerebellar structures present in the specialty mesh.' },
  { key: 'ventricles', label: 'Ventricles', note: 'Ventricular system and cerebral aqueduct when present.' },
  { key: 'visual-pathway', label: 'Visual pathway', note: 'Optic nerves, chiasm and tracts represented by the atlas.' },
  { key: 'cranial-nerves', label: 'Cranial nerves', note: 'Named cranial nerves available in this geometry.' },
  { key: 'circulation', label: 'Brain vessels', note: 'Cerebral arteries included in the neurology module.' },
  { key: 'other', label: 'Other verified', note: 'Remaining named neuroanatomy that does not fit the teaching groups above.' },
]

function classifyBrainRegion(name: string, kind: string): BrainRegion {
  const n = name.toLowerCase()
  const k = kind.toLowerCase()
  if (/ventricle|cerebral aqueduct/.test(n)) return 'ventricles'
  if (/optic nerve|optic chiasm|optic tract/.test(n)) return 'visual-pathway'
  if (/cerebell/.test(n)) return 'cerebellum'
  if (/pons|midbrain|medulla oblongata|peduncle of midbrain|colliculus/.test(n)) return 'brainstem'
  if (/thalam|caudate|putamen|globus pallidus|amygdal|hippocamp|claustr|hypothalam|fornix|commissure|corpus callosum/.test(n)) return 'deep-limbic'
  if (/gyrus|cortex|insula|operculum/.test(n)) return 'cortex'
  if (/internal carotid|basilar artery|cerebral artery|vertebral artery/.test(n) || /vessel|artery/.test(k)) return 'circulation'
  if (/oculomotor|trochlear|trigeminal|abducens|facial nerve|vestibulocochlear|glossopharyngeal|vagus nerve|hypoglossal|accessory nerve/.test(n) || k === 'nerve') return 'cranial-nerves'
  return 'other'
}

const SOURCE_PARTS: AtlasPart[] = partsForModule('neurologi')
const VIEW_PARTS: PartMeta[] = SOURCE_PARTS.map((part) => ({
  name: part.name,
  kind: part.kind,
  group: classifyBrainRegion(part.name, part.kind),
}))

const REGION_COUNTS = new Map<BrainRegion, number>()
for (const part of VIEW_PARTS) {
  const key = part.group as BrainRegion
  REGION_COUNTS.set(key, (REGION_COUNTS.get(key) ?? 0) + 1)
}

function sourceLabel(source: AtlasPart['source']): string {
  if (source === 'bodyparts3d') return 'BodyParts3D 4.0'
  if (source === 'z-anatomy') return 'Z-Anatomy'
  if (source === 'hra-female') return 'HuBMAP HRA female reference'
  return 'HuBMAP HRA male reference'
}

export function BrainExplorer() {
  const [region, setRegion] = useState<BrainRegion | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const selectedPart = useMemo(
    () => SOURCE_PARTS.find((part) => part.name === selected) ?? null,
    [selected],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOURCE_PARTS.filter((part) => {
      const group = classifyBrainRegion(part.name, part.kind)
      if (region !== 'all' && group !== region) return false
      if (!q) return true
      return part.name.toLowerCase().includes(q) || part.kind.toLowerCase().includes(q)
    }).slice(0, 80)
  }, [query, region])

  const totalTriangles = useMemo(
    () => SOURCE_PARTS.reduce((sum, part) => sum + (part.triangles || 0), 0),
    [],
  )

  function chooseRegion(next: BrainRegion | 'all') {
    setRegion(next)
    setSelected(null)
  }

  return (
    <div className="space-y-4" data-brain-explorer="true">
      <SectionTitle
        icon={<span aria-hidden="true" className="text-xl">🧠</span>}
        title="3D Brain Explorer"
        subtitle="High-detail named neuroanatomy from Panacea’s verified specialty atlas — isolate, rotate, search and focus real source meshes"
      />

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-black text-ink dark:text-white">Neuroanatomy workspace</div>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-neutral-500">
              “Complete” here means every named structure available in this source module — not every neuron,
              synapse, microscopic tract, or patient-specific feature. No Higgsfield/X model asset is copied;
              the interaction concept is implemented on Panacea’s own licensed anatomy pipeline.
            </p>
          </div>
          <div className="flex gap-1.5 text-[10px] font-bold text-neutral-500">
            <span className="rounded-full border border-neutral-200 px-2.5 py-1 dark:border-white/10">{SOURCE_PARTS.length} named meshes</span>
            <span className="rounded-full border border-neutral-200 px-2.5 py-1 dark:border-white/10">{totalTriangles.toLocaleString()} triangles</span>
          </div>
        </div>

        <AtlasViewer3D
          berkas="atlas/neurologi.glb"
          bagian={VIEW_PARTS}
          wilayah={region === 'all' ? null : region}
          dipilih={selected}
          onPilih={setSelected}
          tinggi={560}
        />

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Brain region isolation">
          <button
            type="button"
            data-brain-region="all"
            onClick={() => chooseRegion('all')}
            className={`min-h-[34px] shrink-0 rounded-full border px-3 text-xs font-bold ${region === 'all' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
          >
            Whole module · {SOURCE_PARTS.length}
          </button>
          {REGION_ORDER.filter((item) => (REGION_COUNTS.get(item.key) ?? 0) > 0).map((item) => (
            <button
              type="button"
              key={item.key}
              data-brain-region={item.key}
              onClick={() => chooseRegion(item.key)}
              title={item.note}
              className={`min-h-[34px] shrink-0 rounded-full border px-3 text-xs font-bold ${region === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
            >
              {item.label} · {REGION_COUNTS.get(item.key)}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-400">
          Region buttons isolate only meshes that actually exist in the loaded GLB. Tap a visible structure or use search below; exact selection is framed by the camera rather than replaced with a schematic stand-in.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
        <Card>
          <label className="block text-xs font-bold text-neutral-500" htmlFor="brain-structure-search">Find an exact structure</label>
          <input
            id="brain-structure-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. hippocampus, optic nerve, pons…"
            className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {results.map((part) => {
              const group = classifyBrainRegion(part.name, part.kind)
              return (
                <button
                  type="button"
                  key={part.name}
                  data-brain-structure={part.name}
                  onClick={() => {
                    setRegion(group)
                    setSelected(part.name)
                  }}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${selected === part.name ? 'border-brand bg-brand/5' : 'border-neutral-100 bg-neutral-50 dark:border-white/5 dark:bg-white/5'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-ink dark:text-white">{part.name}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase text-neutral-400 dark:bg-white/10">{part.kind}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-400">{REGION_ORDER.find((item) => item.key === group)?.label ?? 'Other verified anatomy'}</div>
                </button>
              )
            })}
            {!results.length && <p className="py-6 text-center text-xs text-neutral-400">No source mesh matches this search and region.</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-brand">Selected structure</div>
            {selectedPart ? (
              <div className="mt-2 space-y-2">
                <h2 className="text-lg font-black text-ink dark:text-white">{selectedPart.name}</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5"><span className="block text-neutral-400">Kind</span><strong>{selectedPart.kind}</strong></div>
                  <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5"><span className="block text-neutral-400">Triangles</span><strong>{selectedPart.triangles.toLocaleString()}</strong></div>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">Geometry source: {sourceLabel(selectedPart.source)}. Selection uses the exact mesh name generated from the source atlas.</p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">Tap the 3D model or choose a named structure to inspect its exact source metadata.</p>
            )}
          </Card>

          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Provenance & limits</div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              This neurology module is generated from BodyParts3D 4.0 geometry in Panacea’s specialty atlas pipeline (CC BY 4.0). It is an educational anatomical reference, not an MRI/CT of a patient and not a diagnostic model. Spatial absence in this module means “not represented here”, not “absent in a person”.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/body-explorer" className="rounded-full border border-brand px-3 py-1.5 text-xs font-bold text-brand">Whole Body Explorer</Link>
              <Link to="/jiwa" className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">Mental Health & Life Safety</Link>
            </div>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Brain ≠ mind</div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              A structural atlas cannot diagnose depression, anxiety, bipolar disorder, psychosis, dementia, suicidality, or other mental-health conditions. Mental illness is clinically assessed using symptoms, function, history, context and appropriate professional evaluation; Panacea keeps that pathway separate from this anatomy viewer.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BrainExplorer
