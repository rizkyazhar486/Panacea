import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Portal } from './Portal'
import { NAV_UNTUK_PENGATURAN } from './Shell'
import { ambilTersembunyi } from '../lib/fiturTersembunyi'
import { api, backendEnabled } from '../lib/api'
import type { Role } from '../lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pencarian global — satu kotak untuk fitur, orang dan tagar.
//
// Aplikasi ini sudah melewati 200 fitur. Menemukan sesuatu lewat menu menuntut
// pengguna menebak lebih dulu ada di grup mana — "Peregangan" itu Fitness atau
// Longevity? "Kalkulator Klinis" itu Calculators atau Clinical & AI? Tebakan
// yang salah berarti membuka dan menutup beberapa grup sebelum menyerah. Kotak
// pencarian menghapus seluruh tebakan itu.
//
// Tiga hal dicari sekaligus karena ketiganya adalah cara orang benar-benar
// mencari di aplikasi seperti ini: nama fitur, nama orang, dan tagar.
//
// Dua keputusan yang menentukan mutunya:
//
//   1. KATALOG FITUR DIMUAT SAAT DIBUKA, bukan saat aplikasi dimuat. Katalog
//      hub berisi ratusan entri; menariknya ke bundel awal akan memperlambat
//      pembukaan pertama demi fitur yang belum tentu dipakai.
//   2. FITUR YANG DISEMBUNYIKAN PENGGUNA TIDAK MUNCUL. Kalau tidak, "sembunyikan"
//      hanya berarti pindah tempat — dan hasil pencarian adalah tempat paling
//      mudah untuk membocorkannya kembali.
// ─────────────────────────────────────────────────────────────────────────────

interface HasilFitur { to: string; label: string; grup: string; kw?: string }
interface HasilOrang { id: string; name: string; role: Role; picture?: string }

/** Skor kecocokan: awalan kata lebih tinggi daripada sekadar mengandung. */
function skor(teks: string, q: string): number {
  const t = teks.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) return 60
  if (t.includes(q)) return 30
  return 0
}

export function PencarianGlobal({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [katalog, setKatalog] = useState<HasilFitur[] | null>(null)
  const [orang, setOrang] = useState<HasilOrang[]>([])
  const [tagar, setTagar] = useState<{ tag: string; jumlah: number }[]>([])
  const [sorot, setSorot] = useState(0)
  const kotak = useRef<HTMLInputElement>(null)

  // Katalog dimuat sekali, saat pertama dibuka.
  useEffect(() => {
    if (!buka || katalog) return
    let batal = false
    void (async () => {
      const tersembunyi = new Set(ambilTersembunyi())
      const peta = new Map<string, HasilFitur>()
      for (const n of NAV_UNTUK_PENGATURAN) {
        if (tersembunyi.has(n.to)) continue
        peta.set(n.to, { to: n.to, label: n.label.replace(/^[^\p{L}\p{N}]+/u, '').trim(), grup: n.group })
      }
      try {
        const [f, w, c] = await Promise.all([
          import('../pages/FitnessHub'), import('../pages/WellnessHub'), import('../pages/ClinicalHub'),
        ])
        const tambah = (grup: string, arr: { to: string; name: string; kw?: string }[]) => {
          for (const t of arr) {
            if (tersembunyi.has(t.to)) continue
            // Label hub lebih deskriptif daripada label menu, jadi ia menang.
            peta.set(t.to, { to: t.to, label: t.name, grup, kw: t.kw })
          }
        }
        for (const g of f.GROUPS) tambah('Fitness', g.tools)
        for (const g of w.GROUPS) tambah('Longevity', g.feats)
        for (const g of c.GROUPS) tambah('Clinical & AI', g.tools)
      } catch { /* katalog hub gagal dimuat — nav saja sudah berguna */ }
      if (!batal) setKatalog([...peta.values()])
    })()
    return () => { batal = true }
  }, [buka, katalog])

  useEffect(() => { if (buka) setTimeout(() => kotak.current?.focus(), 50) }, [buka])
  useEffect(() => { setSorot(0) }, [q])

  // Orang: dari server, ditunda agar tiap ketukan tidak jadi satu permintaan.
  useEffect(() => {
    const t = q.trim()
    if (!buka || !backendEnabled || t.length < 2) { setOrang([]); return }
    const id = setTimeout(() => {
      void api.cariOrang(t).then((r) => setOrang(r)).catch(() => setOrang([]))
    }, 250)
    return () => clearTimeout(id)
  }, [q, buka])

  // Tagar: dihitung dari kiriman yang memang sudah boleh dilihat pengguna ini.
  useEffect(() => {
    const t = q.trim().replace(/^#/, '')
    if (!buka || !backendEnabled || t.length < 1) { setTagar([]); return }
    const id = setTimeout(() => {
      void api.posts().then((posts) => {
        const hitung = new Map<string, number>()
        for (const p of posts) {
          const teks = `${(p as { caption?: string }).caption ?? ''} ${(p as { activity?: string }).activity ?? ''}`
          for (const m of teks.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)) {
            const tag = m[1].toLowerCase()
            hitung.set(tag, (hitung.get(tag) ?? 0) + 1)
          }
        }
        setTagar([...hitung.entries()]
          .filter(([tag]) => tag.includes(t.toLowerCase()))
          .sort((a, b) => b[1] - a[1]).slice(0, 6)
          .map(([tag, jumlah]) => ({ tag, jumlah })))
      }).catch(() => setTagar([]))
    }, 300)
    return () => clearTimeout(id)
  }, [q, buka])

  const fitur = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t || !katalog) return []
    return katalog
      .map((f) => ({ f, s: Math.max(skor(f.label, t), skor(f.grup, t) * 0.4, f.kw ? skor(f.kw, t) * 0.7 : 0) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.f)
  }, [q, katalog])

  const semua = useMemo(() => [
    ...fitur.map((f) => ({ jenis: 'fitur' as const, kunci: f.to, ke: f.to, f })),
    ...orang.map((o) => ({ jenis: 'orang' as const, kunci: 'u' + o.id, ke: `/jelajah?orang=${encodeURIComponent(o.name)}`, o })),
    ...tagar.map((h) => ({ jenis: 'tagar' as const, kunci: 't' + h.tag, ke: `/jelajah?tag=${h.tag}`, h })),
  ], [fitur, orang, tagar])

  const pergi = useCallback((ke: string) => { tutup(); setQ(''); nav(ke) }, [nav, tutup])

  const padaTombol = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { tutup(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSorot((i) => Math.min(i + 1, semua.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSorot((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && semua[sorot]) { e.preventDefault(); pergi(semua[sorot].ke) }
  }

  if (!buka) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-0 pt-0 sm:pt-16"
        onClick={tutup} role="dialog" aria-modal="true" aria-label="Pencarian">
        <div className="max-h-full w-full max-w-lg overflow-hidden rounded-none bg-slate-900 sm:max-h-[70vh] sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="text-slate-400">🔍</span>
            <input
              ref={kotak}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
              placeholder="Search features, people, or #hashtags…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={padaTombol}
              aria-label="Search features, people, or hashtags"
            />
            <button onClick={tutup} aria-label="Close search"
              className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300">Tutup</button>
          </div>

          <div className="max-h-[calc(100vh-64px)] overflow-y-auto p-2 sm:max-h-[calc(70vh-64px)]">
            {!q.trim() && (
              <p className="px-3 py-6 text-center text-[12px] leading-relaxed text-slate-500">
                Ketik nama fitur — "peregangan", "kalkulator", "tidur" — atau nama orang, atau #tagar.
              </p>
            )}

            {q.trim() && semua.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-slate-500">
                Tidak ada yang cocok dengan "{q}".
              </p>
            )}

            {fitur.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Fitur</div>
                {fitur.map((f, i) => (
                  <button key={f.to} onClick={() => pergi(f.to)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${
                      semua[sorot]?.kunci === f.to ? 'bg-brand/25' : 'hover:bg-white/5'}`}>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">{f.label}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">{f.grup}</span>
                  </button>
                ))}
              </div>
            )}

            {orang.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Orang</div>
                {orang.map((o) => (
                  <button key={o.id} onClick={() => pergi(`/jelajah?orang=${encodeURIComponent(o.name)}`)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left ${
                      semua[sorot]?.kunci === 'u' + o.id ? 'bg-brand/25' : 'hover:bg-white/5'}`}>
                    {o.picture
                      ? <img src={o.picture} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-black text-white">
                          {o.name.slice(0, 1).toUpperCase()}
                        </span>}
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">{o.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">{o.role}</span>
                  </button>
                ))}
              </div>
            )}

            {tagar.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Tagar</div>
                {tagar.map((h) => (
                  <button key={h.tag} onClick={() => pergi(`/jelajah?tag=${h.tag}`)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${
                      semua[sorot]?.kunci === 't' + h.tag ? 'bg-brand/25' : 'hover:bg-white/5'}`}>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">#{h.tag}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">{h.jumlah} kiriman</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default PencarianGlobal
