import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { penjelasan } from '../lib/penjelasanFitur'
import { rupa } from '../lib/kategoriRupa'

const TOKO = new Set(['/pharmacy', '/orders', '/marketplace', '/billing', '/pricing', '/consult', '/hospitals'])

export default function SemuaFitur() {
  const { account } = useStore()
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState<string | null>(null)
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

  const daftarKategori = useMemo(() => {
    const hitung = new Map<string, number>()
    for (const n of tersedia) {
      const group = TOKO.has(n.to) ? 'Shop' : n.group
      hitung.set(group, (hitung.get(group) ?? 0) + 1)
    }
    return [...hitung.entries()].sort((a, b) => {
      if (a[0] === 'Shop') return 1
      if (b[0] === 'Shop') return -1
      return b[1] - a[1]
    })
  }, [tersedia])

  const hasil = useMemo(() => {
    const kata = q.toLowerCase().trim()
    return tersedia.filter((n) => {
      const group = TOKO.has(n.to) ? 'Shop' : n.group
      if (kategori && group !== kategori) return false
      if (!kata) return true
      const teks = `${n.label} ${group} ${n.to} ${n.kw} ${penjelasan(n.to, n.apa)}`.toLowerCase()
      return kata.split(/\s+/).every((word) => teks.includes(word))
    })
  }, [q, kategori, tersedia])

  const grup = useMemo(() => {
    const map = new Map<string, typeof hasil>()
    for (const n of hasil) {
      const group = TOKO.has(n.to) ? 'Shop' : n.group
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(n)
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === 'Shop') return 1
      if (b[0] === 'Shop') return -1
      return b[1].length - a[1].length
    })
  }, [hasil])

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07121b] p-5 text-white shadow-[0_28px_90px_rgba(5,18,28,.28)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Panacea product browser</div>
          <h1 className="mt-2 text-[clamp(2rem,5vw,4rem)] font-black leading-[.96] tracking-[-.045em]">Find what you need. Ignore the rest.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
            {tersedia.length} available tools across life, movement, body, learning, prevention, services and medicine. Search by what you want to do—not by technical feature name.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/[.10] px-4 backdrop-blur-xl">
            <span aria-hidden className="text-lg text-white/65">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try: sleep, running, money, focus, heart, cancer, prayer…"
              className="min-h-[52px] w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/55"
            />
            {q && <button onClick={() => setQ('')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white/80" aria-label="Clear search">×</button>}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Browse by area</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Swipe the categories</div>
          </div>
          {kategori && <button onClick={() => setKategori(null)} className="rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-[10px] font-black text-brand-dark shadow-sm dark:border-white/10 dark:bg-[#111315] dark:text-emerald-300">Show all</button>}
        </div>
        <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 pt-1">
          {daftarKategori.map(([nama, count]) => {
            const active = kategori === nama
            const visual = rupa(nama)
            return (
              <button
                key={nama}
                onClick={() => setKategori(active ? null : nama)}
                className={`shrink-0 snap-start rounded-full border px-4 py-2.5 text-[11px] font-black transition ${active ? `${visual.bg} ${visual.teks} border-transparent shadow-sm` : 'border-neutral-200 bg-white/95 text-neutral-800 shadow-sm dark:border-white/10 dark:bg-[#111315] dark:text-neutral-200'}`}
              >
                <span aria-hidden>{visual.emoji}</span> {visual.label} <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Results</div>
          <h2 className="mt-1 text-xl font-black tracking-[-.025em] text-ink dark:text-white">{hasil.length} useful destinations</h2>
        </div>
        {(q || kategori) && <div className="text-right text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">Filtered from {tersedia.length}</div>}
      </div>

      {grup.map(([nama, isi]) => {
        const visual = rupa(nama)
        return (
          <section key={nama} className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 px-1">
              <h3 className={`flex items-center gap-2 text-[13px] font-black ${visual.teks}`}>
                <span aria-hidden className={`h-5 w-1.5 rounded-full ${visual.garis}`} />
                <span aria-hidden>{visual.emoji}</span>
                {visual.label}
              </h3>
              <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">{isi.length}</span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {isi.map((n) => {
                const apa = penjelasan(n.to, n.apa)
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="panacea-readable-card group relative min-h-[132px] overflow-hidden rounded-[26px] border p-4 shadow-[0_12px_36px_rgba(20,35,45,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_52px_rgba(20,55,50,.12)]"
                  >
                    <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-25 blur-3xl ${visual.bg}`} aria-hidden />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg shadow-[inset_0_1px_rgba(255,255,255,.7)] ${visual.bg}`}>{visual.emoji}</span>
                        <span aria-hidden className="text-lg text-neutral-500 transition group-hover:translate-x-1 group-hover:text-brand dark:text-neutral-400">→</span>
                      </div>
                      <div className="mt-3 text-[14px] font-black leading-tight tracking-[-.015em] text-neutral-950 dark:text-white">{n.label}</div>
                      {apa && <p className="mt-1 line-clamp-3 text-[11px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">{apa}</p>}
                      <div className={`mt-auto pt-3 text-[9px] font-black uppercase tracking-[.12em] ${visual.teks}`}>Open</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {hasil.length === 0 && (
        <section className="panacea-readable-card rounded-[28px] border border-dashed p-8 text-center">
          <div className="text-3xl" aria-hidden>⌕</div>
          <div className="mt-3 text-base font-black text-neutral-950 dark:text-white">Nothing matches yet</div>
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">Try a shorter phrase, or clear the category filter.</p>
          <button onClick={() => { setQ(''); setKategori(null) }} className="mt-4 rounded-full bg-brand px-4 py-2.5 text-xs font-black text-white">Reset browser</button>
        </section>
      )}
    </div>
  )
}
