import { useMemo, useState } from 'react'
import AtlasViewer3D, { type PartMeta } from '../../components/AtlasViewer3D'
import CardioAtlas3D from '../../components/CardioAtlas3D'
import {
  cariTubuh, cakupanTubuh, pasangan, namaTampil, INDEKS_TUBUH,
  type StrukturTubuh, type SaringTubuh,
} from '../../lib/bodySearch'
import { cariStrukturAtlas, cakupanStrukturAtlas, type StrukturAtlasCari } from '../../lib/anatomyStructureSearch'
import { ATLAS_MODULE_INFO, partsForModule } from '../../lib/systemAtlas.gen'
import { WILAYAH } from '../../lib/dissection'

// ─────────────────────────────────────────────────────────────────────────────
// SATU PENCARI STRUKTUR, DUA KELUARGA GEOMETRI.
//
// Whole-body dan specialty atlas tetap memakai berkas geometri masing-masing.
// Yang disatukan hanya pintu pencariannya. Setiap hasil selalu berasal dari
// metadata mesh yang benar-benar ada; tidak ada fallback ke struktur "mirip".
// ─────────────────────────────────────────────────────────────────────────────

const LAPISAN: Array<{ k: StrukturTubuh['l']; label: string }> = [
  { k: 'skeletal', label: 'Bone' },
  { k: 'muscular', label: 'Muscle' },
  { k: 'cardiovascular', label: 'Vessel' },
  { k: 'nervous', label: 'Nerve' },
  { k: 'visceral', label: 'Organ' },
  { k: 'lymphoid', label: 'Lymphatic' },
  { k: 'surface', label: 'Surface' },
]

const MAX_COMPARE = 3

type CompareItem =
  | { key: string; family: 'whole-body'; label: string; whole: StrukturTubuh }
  | { key: string; family: 'specialty'; label: string; atlas: StrukturAtlasCari }

function wholeCompareKey(s: StrukturTubuh) {
  return `whole:${s.l}:${s.n}`
}

function atlasCompareKey(s: StrukturAtlasCari) {
  return `atlas:${s.module}:${s.name}`
}

export interface StructureFinderProps {
  /** Menyorot struktur pada model tubuh, memakai nama persis di dalam berkas. */
  onSorot: (nama: string[]) => void
  /** Menyalakan lapisan yang memuat struktur itu; tanpa ini sorotan tak terlihat. */
  onLapisan: (lapisan: StrukturTubuh['l']) => void
}

export function StructureFinder({ onSorot, onLapisan }: StructureFinderProps) {
  const [kueri, setKueri] = useState('')
  const [saring, setSaring] = useState<SaringTubuh>({})
  const [dipilih, setDipilih] = useState<StrukturTubuh | null>(null)
  const [atlasDipilih, setAtlasDipilih] = useState<StrukturAtlasCari | null>(null)
  const [dibandingkan, setDibandingkan] = useState<CompareItem[]>([])

  const cakupan = useMemo(() => cakupanTubuh(), [])
  const cakupanAtlas = useMemo(() => cakupanStrukturAtlas(), [])
  const hasil = useMemo(() => cariTubuh(kueri, saring, 40), [kueri, saring])
  const hasilAtlas = useMemo(() => cariStrukturAtlas(kueri, 30), [kueri])
  const atlasBagian = useMemo<PartMeta[]>(() => {
    if (!atlasDipilih || atlasDipilih.module === 'cardio') return []
    return partsForModule(atlasDipilih.module).map((p) => ({ name: p.name, kind: p.kind, group: p.kind }))
  }, [atlasDipilih?.module])

  function pilih(s: StrukturTubuh) {
    setAtlasDipilih(null)
    setDipilih(s)
    // Lapisannya dinyalakan lebih dulu: menyorot struktur di lapisan yang
    // sedang dimatikan menghasilkan sorotan yang tidak terlihat.
    onLapisan(s.l)
    onSorot(pasangan(s))
  }

  function pilihAtlas(s: StrukturAtlasCari) {
    setDipilih(null)
    setAtlasDipilih(s)
    // Jangan meninggalkan highlight whole-body yang tampak seolah berkaitan
    // dengan mesh specialty yang baru dipilih.
    onSorot([])
  }

  function toggleBandingWhole(s: StrukturTubuh) {
    const key = wholeCompareKey(s)
    setDibandingkan((prev) => {
      if (prev.some((item) => item.key === key)) return prev.filter((item) => item.key !== key)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, { key, family: 'whole-body', label: namaTampil(s), whole: s }]
    })
  }

  function toggleBandingAtlas(s: StrukturAtlasCari) {
    const key = atlasCompareKey(s)
    setDibandingkan((prev) => {
      if (prev.some((item) => item.key === key)) return prev.filter((item) => item.key !== key)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, { key, family: 'specialty', label: s.name, atlas: s }]
    })
  }

  function hapusBanding(key: string) {
    setDibandingkan((prev) => prev.filter((item) => item.key !== key))
  }

  function sorotPerbandinganWholeBody() {
    const wholeNodes: string[] = []
    for (const item of dibandingkan) {
      if (item.family !== 'whole-body') continue
      onLapisan(item.whole.l)
      wholeNodes.push(...pasangan(item.whole))
    }
    onSorot([...new Set(wholeNodes)])
  }

  const adaKueri = kueri.trim().length >= 2
  const totalHasil = hasil.length + hasilAtlas.length
  const wholeCompareCount = dibandingkan.filter((item) => item.family === 'whole-body').length
  const comparePenuh = dibandingkan.length >= MAX_COMPARE

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-neutral-500">
        Search {INDEKS_TUBUH.length.toLocaleString()} named whole-body structures plus{' '}
        {cakupanAtlas.struktur.toLocaleString()} named structures across {cakupanAtlas.modul} specialty atlases.
        Every result comes from geometry metadata; no substitute structure is invented when a mesh is absent.
      </p>

      <input
        value={kueri}
        onChange={(e) => setKueri(e.target.value)}
        placeholder="Search — e.g. tibial artery, left femur, vagus, cochlea"
        aria-label="Search structures"
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
      />

      <div className="flex flex-wrap gap-1.5">
        {LAPISAN.map((l) => (
          <button
            key={l.k}
            onClick={() => setSaring((s) => ({ ...s, lapisan: s.lapisan === l.k ? null : l.k }))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
              saring.lapisan === l.k ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {l.label} <span className="opacity-60">{cakupan[l.k] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WILAYAH.map((w) => (
          <button
            key={w.kunci}
            onClick={() => setSaring((s) => ({ ...s, wilayah: s.wilayah === w.kunci ? null : w.kunci }))}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold active:scale-95 ${
              saring.wilayah === w.kunci ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] leading-snug text-neutral-400">
        Layer and body-region filters apply only to the whole-body figure. Specialty results stay searchable because
        they live in separate atlas files with their own anatomy boundaries.
      </p>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-brand">Compare tray · {dibandingkan.length}/{MAX_COMPARE}</div>
            <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
              Compare up to three named meshes side by side. Whole-body entries can be highlighted together; specialty
              entries stay in their own atlas and are never redirected to a substitute body mesh.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={sorotPerbandinganWholeBody}
              disabled={wholeCompareCount === 0}
              className="rounded-full border border-brand px-2.5 py-1 text-[10px] font-bold text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              Highlight whole-body set
            </button>
            <button
              type="button"
              onClick={() => setDibandingkan([])}
              disabled={dibandingkan.length === 0}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-bold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"
            >
              Clear
            </button>
          </div>
        </div>

        {dibandingkan.length === 0 ? (
          <p className="mt-2 text-[10px] text-neutral-400">Add a result below to start a bounded anatomy comparison.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dibandingkan.map((item) => (
              <div key={item.key} className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-black text-ink dark:text-white">{item.label}</div>
                    {item.family === 'whole-body' ? (
                      <div className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                        Whole-body · {LAPISAN.find((l) => l.k === item.whole.l)?.label} ·{' '}
                        {WILAYAH.find((w) => w.kunci === item.whole.w)?.label ?? item.whole.w}<br />
                        {pasangan(item.whole).length} exact mesh name{pasangan(item.whole).length === 1 ? '' : 's'} · {item.whole.t.toLocaleString()} triangles
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                        Specialty atlas · {item.atlas.moduleLabel} · {item.atlas.kind}
                        {item.atlas.region ? ` · ${item.atlas.region}` : ''}<br />
                        Separate specialty geometry; no whole-body substitute.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => hapusBanding(item.key)}
                    aria-label={`Remove ${item.label} from compare tray`}
                    className="shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:border-white/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {comparePenuh && (
          <p className="mt-2 text-[10px] font-semibold text-neutral-500">
            Compare tray is capped at three structures to keep the anatomy workspace responsive.
          </p>
        )}
      </div>

      {dipilih && (
        <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
          <div className="text-sm font-black text-ink dark:text-ink">{namaTampil(dipilih)}</div>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Whole-body · {LAPISAN.find((l) => l.k === dipilih.l)?.label} ·{' '}
            {WILAYAH.find((w) => w.kunci === dipilih.w)?.label ?? dipilih.w} ·{' '}
            {Math.round(dipilih.y * 100)}% of body height · {dipilih.t.toLocaleString()} triangles
          </div>
          {pasangan(dipilih).length > 1 && (
            <div className="mt-1 text-[11px] text-neutral-500">
              Paired structure — both sides highlighted together.
            </div>
          )}
        </div>
      )}

      {atlasDipilih && (
        <div className="space-y-2 rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
          <div>
            <div className="text-sm font-black text-ink dark:text-ink">{atlasDipilih.name}</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              Specialty atlas · {atlasDipilih.moduleLabel} · {atlasDipilih.kind}
              {atlasDipilih.region ? ` · ${atlasDipilih.region}` : ''}
            </div>
          </div>
          {atlasDipilih.module === 'cardio' ? (
            <CardioAtlas3D dipilih={atlasDipilih.name} />
          ) : (
            <AtlasViewer3D
              berkas={`atlas/${atlasDipilih.module}.glb`}
              bagian={atlasBagian}
              dipilih={atlasDipilih.name}
            />
          )}
          <p className="text-[10px] leading-snug text-neutral-400">
            This viewer opened the exact named mesh from {ATLAS_MODULE_INFO[atlasDipilih.module]?.label ?? atlasDipilih.moduleLabel};
            it did not redirect the query to a whole-body substitute.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {hasil.length > 0 && (
          <div className="space-y-1">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Whole-body</div>
            {hasil.map(({ struktur }) => {
              const compareKey = wholeCompareKey(struktur)
              const inCompare = dibandingkan.some((item) => item.key === compareKey)
              return (
                <div key={`${struktur.l}-${struktur.n}`} className="flex items-stretch gap-1.5">
                  <button
                    onClick={() => pilih(struktur)}
                    className={`flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left active:scale-[0.99] ${
                      dipilih?.n === struktur.n && dipilih?.l === struktur.l
                        ? 'bg-brand text-white'
                        : 'bg-neutral-100/60 dark:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 truncate text-[12px] font-semibold">{namaTampil(struktur)}</span>
                    <span className={`shrink-0 text-[10px] font-bold ${dipilih?.n === struktur.n ? 'text-white/70' : 'text-neutral-500'}`}>
                      {LAPISAN.find((l) => l.k === struktur.l)?.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBandingWhole(struktur)}
                    aria-pressed={inCompare}
                    disabled={!inCompare && comparePenuh}
                    className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                      inCompare
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    {inCompare ? 'Added' : 'Compare'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {hasilAtlas.length > 0 && (
          <div className="space-y-1">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Specialty atlases</div>
            {hasilAtlas.map((struktur) => {
              const compareKey = atlasCompareKey(struktur)
              const inCompare = dibandingkan.some((item) => item.key === compareKey)
              return (
                <div key={`${struktur.module}-${struktur.name}`} className="flex items-stretch gap-1.5">
                  <button
                    onClick={() => pilihAtlas(struktur)}
                    className={`flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left active:scale-[0.99] ${
                      atlasDipilih?.module === struktur.module && atlasDipilih?.name === struktur.name
                        ? 'bg-brand text-white'
                        : 'bg-neutral-100/60 dark:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 truncate text-[12px] font-semibold">{struktur.name}</span>
                    <span className={`shrink-0 text-[10px] font-bold ${
                      atlasDipilih?.module === struktur.module && atlasDipilih?.name === struktur.name
                        ? 'text-white/70'
                        : 'text-neutral-500'
                    }`}>
                      {struktur.moduleLabel}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBandingAtlas(struktur)}
                    aria-pressed={inCompare}
                    disabled={!inCompare && comparePenuh}
                    className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                      inCompare
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    {inCompare ? 'Added' : 'Compare'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {adaKueri && totalHasil === 0 && (
          <p className="rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
            Nothing in the available geometry matches that name. The atlases are detailed but not complete, so the
            finder leaves the result empty instead of highlighting a different structure.
          </p>
        )}
      </div>
    </div>
  )
}

export default StructureFinder