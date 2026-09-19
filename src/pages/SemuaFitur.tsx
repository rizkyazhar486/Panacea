import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { penjelasan } from '../lib/penjelasanFitur'
import { compactBrowseResults } from '../lib/featureEntryPoints'
import {
  PANACEA_SPACES,
  getProductSpace,
  productSpaceForRoute,
  type ProductSpaceId,
} from '../lib/productSpaces'

const SPACE_ICON: Record<ProductSpaceId, string> = {
  today: '○',
  body: '◎',
  move: '↗',
  learn: '◇',
  care: '+',
  discover: '✦',
  community: '∞',
  system: '⌘',
}

const PRIMARY_SPACE_IDS: ProductSpaceId[] = ['today', 'body', 'move', 'learn', 'care', 'discover']

export default function SemuaFitur() {
  const { account } = useStore()
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState<ProductSpaceId | null>(null)
  const [showDirectory, setShowDirectory] = useState(false)
  const peran = account?.role ?? 'pasien'

  const semua = useMemo(() => {
    const peta = new Map<string, { to: string; label: string; group: string; kw: string; apa: string; roles: string[] }>()
    for (const f of FITUR_DARI_HUB) {
      peta.set(f.to, { to: f.to, label: f.nama, group: f.grup, kw: `${f.apa} ${f.kw}`, apa: f.apa, roles: [] })
    }
    for (const n of NAV_UNTUK_PENGATURAN) {
      const ada = peta.get(n.to)
      peta.set(n.to, { to: n.to, label: n.label, group: n.group, kw: ada?.kw ?? '', apa: ada?.apa ?? '', roles: n.roles })
    }
    return [...peta.values()]
  }, [])

  const tersedia = useMemo(() => semua.filter((n) => {
    if (n.roles.length && !n.roles.includes(peran)) return false
    return n.to !== '/semua-fitur'
  }), [semua, peran])

  const spaceCount = useMemo(() => {
    const counts = new Map<ProductSpaceId, number>()
    for (const n of tersedia) {
      const space = productSpaceForRoute(n.to, n.group)
      counts.set(space, (counts.get(space) ?? 0) + 1)
    }
    return counts
  }, [tersedia])

  const hasil = useMemo(() => {
    const kata = q.toLowerCase().trim()
    return tersedia.filter((n) => {
      const space = productSpaceForRoute(n.to, n.group)
      if (kategori && space !== kategori) return false
      if (!kata) return true
      const ruang = getProductSpace(space)
      const teks = `${n.label} ${ruang.label} ${n.group} ${n.to} ${n.kw} ${penjelasan(n.to, n.apa)}`.toLowerCase()
      return kata.split(/\s+/).every((word) => teks.includes(word))
    })
  }, [q, kategori, tersedia])

  const visibleHasil = useMemo(
    () => compactBrowseResults(hasil, q.trim().length > 0),
    [hasil, q],
  )
  const deepToolsHidden = hasil.length - visibleHasil.length

  const grup = useMemo(() => {
    const map = new Map<ProductSpaceId, typeof visibleHasil>()
    for (const n of visibleHasil) {
      const id = productSpaceForRoute(n.to, n.group)
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push(n)
    }
    return PANACEA_SPACES
      .map((space) => [space.id, map.get(space.id) ?? []] as const)
      .filter(([, items]) => items.length > 0)
  }, [visibleHasil])

  const primarySpaces = useMemo(
    () => PANACEA_SPACES.filter((space) => PRIMARY_SPACE_IDS.includes(space.id)),
    [],
  )

  const directoryOpen = showDirectory || !!q || !!kategori

  function targetForSpace(id: ProductSpaceId, fallback: string): string {
    if (id === 'care' && peran === 'pasien') return '/consult'
    if (id === 'discover' && !['dokter', 'owner'].includes(peran)) return '/health-simulator'
    return fallback
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header className="space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">
          Panacea OS
        </div>
        <div>
          <h1 className="text-[clamp(2.2rem,7vw,4.8rem)] font-black leading-[.92] tracking-[-.055em] text-neutral-950 dark:text-white">
            One system. Six spaces.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            Everything stays available. Only the useful path stays visible.
          </p>
        </div>

        <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 dark:border-white/10 dark:bg-[#0c0f0d]">
          <span aria-hidden className="text-lg text-neutral-400">⌕</span>
          <span className="sr-only">Search Panacea</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Panacea"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-neutral-950 outline-none placeholder:text-neutral-400 dark:text-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>
      </header>

      {!q && !kategori && (
        <section aria-label="Primary Panacea spaces" className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-white/10 dark:border-white/10">
          {primarySpaces.map((space) => (
            <Link
              key={space.id}
              to={targetForSpace(space.id, space.to)}
              className="group flex min-h-[76px] items-center gap-4 py-4"
            >
              <span
                aria-hidden
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 text-lg text-neutral-700 dark:border-white/10 dark:text-neutral-200"
              >
                {SPACE_ICON[space.id]}
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-neutral-950 dark:text-white">
                  {space.label}
                </div>
                <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {space.description}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[10px] font-bold tabular-nums text-neutral-400">
                  {spaceCount.get(space.id) ?? 0}
                </span>
                <span aria-hidden className="text-lg text-neutral-400 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5 dark:border-white/10">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">
            Advanced directory
          </div>
          <div className="mt-1 text-sm font-bold text-neutral-900 dark:text-white">
            Need a specific tool?
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDirectory((v) => !v)}
          className="min-h-[42px] rounded-xl border border-neutral-200 px-4 text-xs font-bold text-neutral-800 dark:border-white/10 dark:text-white"
        >
          {directoryOpen && !q && !kategori ? 'Hide directory' : 'Browse main tools'}
        </button>
      </section>

      {directoryOpen && (
        <section className="space-y-7">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {PANACEA_SPACES.map((space) => {
              const active = kategori === space.id
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => setKategori(active ? null : space.id)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold ${active
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-200 text-neutral-700 dark:border-white/10 dark:text-neutral-300'
                  }`}
                >
                  <span aria-hidden>{SPACE_ICON[space.id]}</span> {space.shortLabel}
                </button>
              )
            })}
            {kategori && (
              <button
                type="button"
                onClick={() => setKategori(null)}
                className="shrink-0 rounded-xl border border-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-500 dark:border-white/10 dark:text-neutral-400"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">
                Directory
              </div>
              <h2 className="mt-1 text-xl font-black text-neutral-950 dark:text-white">
                {visibleHasil.length} destinations
              </h2>
              {deepToolsHidden > 0 && !q && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {deepToolsHidden} focused tools are intentionally search-first.
                </p>
              )}
            </div>
            {(q || kategori) && (
              <div className="text-right text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                {tersedia.length} total
              </div>
            )}
          </div>

          {grup.map(([id, isi]) => {
            const space = getProductSpace(id)
            return (
              <section key={id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2 dark:border-white/10">
                  <h3 className="text-sm font-black text-neutral-950 dark:text-white">
                    {SPACE_ICON[id]} {space.label}
                  </h3>
                  <span className="text-[10px] font-bold tabular-nums text-neutral-400">{isi.length}</span>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-white/10">
                  {isi.map((n) => {
                    const apa = penjelasan(n.to, n.apa)
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className="group flex min-h-[62px] items-center gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-neutral-950 dark:text-white">{n.label}</div>
                          {apa && (
                            <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">{apa}</p>
                          )}
                        </div>
                        <span aria-hidden className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {visibleHasil.length === 0 && (
            <section className="border-y border-dashed border-neutral-300 py-10 text-center dark:border-white/15">
              <div className="text-sm font-black text-neutral-950 dark:text-white">Nothing matches yet</div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Try a shorter search.</p>
              <button
                type="button"
                onClick={() => { setQ(''); setKategori(null) }}
                className="mt-4 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold dark:border-white/10"
              >
                Reset directory
              </button>
            </section>
          )}
        </section>
      )}
    </div>
  )
}
