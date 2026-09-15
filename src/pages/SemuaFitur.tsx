import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { penjelasan } from '../lib/penjelasanFitur'
import {
  PANACEA_SPACES,
  getProductSpace,
  productSpaceForRoute,
  type ProductSpaceId,
} from '../lib/productSpaces'

const SPACE_STYLE: Record<ProductSpaceId, { halo: string; icon: string; text: string; border: string }> = {
  today: { halo: 'from-cyan-400/25 via-blue-500/10 to-transparent', icon: '◉', text: 'text-cyan-200', border: 'border-cyan-300/20' },
  body: { halo: 'from-emerald-400/25 via-cyan-500/10 to-transparent', icon: '◎', text: 'text-emerald-200', border: 'border-emerald-300/20' },
  move: { halo: 'from-blue-400/25 via-cyan-500/10 to-transparent', icon: '↗', text: 'text-blue-200', border: 'border-blue-300/20' },
  learn: { halo: 'from-violet-400/25 via-fuchsia-500/10 to-transparent', icon: '◇', text: 'text-violet-200', border: 'border-violet-300/20' },
  care: { halo: 'from-rose-400/25 via-violet-500/10 to-transparent', icon: '+', text: 'text-rose-200', border: 'border-rose-300/20' },
  discover: { halo: 'from-amber-300/25 via-violet-500/10 to-transparent', icon: '✦', text: 'text-amber-200', border: 'border-amber-300/20' },
  community: { halo: 'from-cyan-300/20 via-emerald-500/10 to-transparent', icon: '∞', text: 'text-cyan-200', border: 'border-cyan-300/20' },
  system: { halo: 'from-slate-300/15 via-cyan-500/5 to-transparent', icon: '⌘', text: 'text-slate-200', border: 'border-white/10' },
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

  const grup = useMemo(() => {
    const map = new Map<ProductSpaceId, typeof hasil>()
    for (const n of hasil) {
      const id = productSpaceForRoute(n.to, n.group)
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push(n)
    }
    return PANACEA_SPACES
      .map((space) => [space.id, map.get(space.id) ?? []] as const)
      .filter(([, items]) => items.length > 0)
  }, [hasil])

  const primarySpaces = useMemo(() => PANACEA_SPACES.filter((space) => PRIMARY_SPACE_IDS.includes(space.id)), [])
  const directoryOpen = showDirectory || !!q || !!kategori

  function targetForSpace(id: ProductSpaceId, fallback: string): string {
    if (id === 'care' && peran === 'pasien') return '/consult'
    if (id === 'discover' && !['dokter', 'owner'].includes(peran)) return '/health-simulator'
    return fallback
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#05080d] px-5 py-6 text-white shadow-[0_28px_90px_rgba(0,0,0,.32)] sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(circle_at_30%_50%,rgba(64,220,255,.20),transparent_38%),radial-gradient(circle_at_68%_35%,rgba(156,124,255,.18),transparent_34%),radial-gradient(circle_at_86%_50%,rgba(255,188,75,.10),transparent_30%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Panacea OS</div>
          <h1 className="mt-2 text-[clamp(2.2rem,7vw,5.2rem)] font-black leading-[.9] tracking-[-.055em]">One system. Six spaces.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
            The tools are still here. The clutter is not. Start with a space, then go deeper only when you need it.
          </p>

          <div className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-[22px] border border-white/12 bg-white/[.07] px-4 backdrop-blur-xl">
            <span aria-hidden className="text-lg text-white/55">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search anything in Panacea…"
              className="min-h-[52px] w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/40"
            />
            {q && <button onClick={() => setQ('')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/75" aria-label="Clear search">×</button>}
          </div>
        </div>
      </section>

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {primarySpaces.map((space) => {
          const style = SPACE_STYLE[space.id]
          return (
            <Link
              key={space.id}
              to={targetForSpace(space.id, space.to)}
              className={`group relative min-h-[178px] overflow-hidden rounded-[28px] border bg-[#080c12] p-5 text-white shadow-[0_16px_46px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 ${style.border}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.halo} opacity-70 transition group-hover:opacity-100`} />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`text-[9px] font-black uppercase tracking-[.18em] ${style.text}`}>{space.eyebrow}</div>
                    <h2 className="mt-1 text-2xl font-black tracking-[-.035em]">{space.label}</h2>
                  </div>
                  <span aria-hidden className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-xl ${style.text}`}>{style.icon}</span>
                </div>
                <p className="mt-3 max-w-sm text-[12px] font-medium leading-relaxed text-white/60">{space.description}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/35">{spaceCount.get(space.id) ?? 0} capabilities</span>
                  <span className="text-sm font-black text-white/75 transition group-hover:translate-x-1">Open →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="rounded-[26px] border border-black/5 bg-white/75 p-4 shadow-[0_12px_36px_rgba(20,35,45,.06)] backdrop-blur-xl dark:border-white/8 dark:bg-white/[.035] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Advanced directory</div>
            <h2 className="mt-1 text-lg font-black tracking-[-.02em] text-neutral-950 dark:text-white">Need a specific tool?</h2>
            <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">
              Browse every capability only when you need precision. Routes remain available; this directory no longer dominates the product.
            </p>
          </div>
          <button
            onClick={() => setShowDirectory((v) => !v)}
            className="min-h-[42px] rounded-full border border-neutral-200 bg-white px-4 text-[11px] font-black text-neutral-800 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[.06] dark:text-white"
          >
            {directoryOpen && !q && !kategori ? 'Hide directory' : 'Browse all tools'}
          </button>
        </div>
      </section>

      {directoryOpen && (
        <section className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Filter by space</div>
                <div className="mt-0.5 text-sm font-black text-ink dark:text-white">One taxonomy across the entire app</div>
              </div>
              {kategori && <button onClick={() => setKategori(null)} className="rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-[10px] font-black text-brand-dark shadow-sm dark:border-white/10 dark:bg-[#111315] dark:text-cyan-300">Show all</button>}
            </div>
            <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 pt-1">
              {PANACEA_SPACES.map((space) => {
                const active = kategori === space.id
                const style = SPACE_STYLE[space.id]
                return (
                  <button
                    key={space.id}
                    onClick={() => setKategori(active ? null : space.id)}
                    className={`shrink-0 snap-start rounded-full border px-4 py-2.5 text-[11px] font-black transition ${active ? 'border-transparent bg-neutral-950 text-white dark:bg-white dark:text-black' : 'border-neutral-200 bg-white/95 text-neutral-800 shadow-sm dark:border-white/10 dark:bg-[#111315] dark:text-neutral-200'}`}
                  >
                    <span className={active ? '' : style.text} aria-hidden>{style.icon}</span> {space.shortLabel} <span className="opacity-50">{spaceCount.get(space.id) ?? 0}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Directory</div>
              <h2 className="mt-1 text-xl font-black tracking-[-.025em] text-ink dark:text-white">{hasil.length} matching capabilities</h2>
            </div>
            {(q || kategori) && <div className="text-right text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">Filtered from {tersedia.length}</div>}
          </div>

          {grup.map(([id, isi]) => {
            const space = getProductSpace(id)
            const style = SPACE_STYLE[id]
            return (
              <section key={id} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className={`grid h-7 w-7 place-items-center rounded-xl border border-black/5 bg-white text-xs shadow-sm dark:border-white/10 dark:bg-white/[.05] ${style.text}`}>{style.icon}</span>
                    <div>
                      <h3 className="text-[13px] font-black text-neutral-900 dark:text-white">{space.label}</h3>
                      <p className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">{space.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{isi.length}</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {isi.map((n) => {
                    const apa = penjelasan(n.to, n.apa)
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className="panacea-readable-card group relative min-h-[112px] overflow-hidden rounded-[22px] border p-4 shadow-[0_10px_30px_rgba(20,35,45,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(20,55,50,.10)]"
                      >
                        <div className="flex h-full items-start gap-3">
                          <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/5 bg-white text-sm shadow-sm dark:border-white/10 dark:bg-white/[.05] ${style.text}`}>{style.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-[13px] font-black leading-tight tracking-[-.01em] text-neutral-950 dark:text-white">{n.label}</div>
                              <span aria-hidden className="shrink-0 text-sm text-neutral-400 transition group-hover:translate-x-0.5">→</span>
                            </div>
                            {apa && <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{apa}</p>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {hasil.length === 0 && (
            <section className="panacea-readable-card rounded-[26px] border border-dashed p-8 text-center">
              <div className="text-3xl" aria-hidden>⌕</div>
              <div className="mt-3 text-base font-black text-neutral-950 dark:text-white">Nothing matches yet</div>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">Try a shorter phrase, or clear the space filter.</p>
              <button onClick={() => { setQ(''); setKategori(null) }} className="mt-4 rounded-full bg-brand px-4 py-2.5 text-xs font-black text-white">Reset directory</button>
            </section>
          )}
        </section>
      )}
    </div>
  )
}
