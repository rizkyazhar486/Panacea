import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_UNTUK_PENGATURAN } from '../app/navItems'
import { ambilTersembunyi } from '../lib/navVisibility'
import { apiFetch, backendEnabled } from '../lib/api'
import { trackEvent } from '../lib/analytics'

interface HasilFeatures { to: string; label: string; grup: string; kw?: string }
interface HasilOrang { id: string; name: string; role?: string }

export default function PencarianGlobal({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [katalog, setKatalog] = useState<HasilFeatures[]>([])
  const [orang, setOrang] = useState<HasilOrang[]>([])
  const [sorot, setSorot] = useState(0)
  const kotak = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!buka || katalog.length) return
    let batal = false
    void (async () => {
      const tersembunyi = new Set(ambilTersembunyi())
      const peta = new Map<string, HasilFeatures>()
      for (const n of NAV_UNTUK_PENGATURAN) {
        if (tersembunyi.has(n.to)) continue
        peta.set(n.to, { to: n.to, label: n.label.replace(/^[^\p{L}\p{N}]+/u, '').trim(), grup: n.group })
      }
      try {
        const w = await import('../pages/WellnessHub')
        const tambah = (grup: string, arr: { to: string; name: string; kw?: string }[]) => {
          for (const t of arr) {
            if (tersembunyi.has(t.to)) continue
            peta.set(t.to, { to: t.to, label: t.name, grup, kw: t.kw })
          }
        }
        // FitnessHub and ClinicalHub are now workspace entry points rather than
        // static GROUPS catalogs. Their destinations already come from the
        // canonical navigation registry above; only Wellness still exposes a
        // richer searchable sub-feature catalog.
        for (const g of w.GROUPS) tambah('Longevity', g.feats)
      } catch { /* katalog hub gagal dimuat — nav saja sudah berguna */ }
      if (!batal) setKatalog([...peta.values()])
    })()
    return () => { batal = true }
  }, [buka, katalog])

  useEffect(() => { if (buka) setTimeout(() => kotak.current?.focus(), 50) }, [buka])
  useEffect(() => { setSorot(0) }, [q])

  useEffect(() => {
    const t = q.trim()
    if (!buka || !backendEnabled || t.length < 2) { setOrang([]); return }
    const id = setTimeout(() => {
      void apiFetch(`/api/search/users?q=${encodeURIComponent(t)}`)
        .then(async r => r.ok ? r.json() : [])
        .then(data => setOrang(Array.isArray(data) ? data : data?.users ?? []))
        .catch(() => setOrang([]))
    }, 250)
    return () => clearTimeout(id)
  }, [q, buka])

  const hasil = useMemo(() => {
    const t = q.trim().toLocaleLowerCase('id')
    if (!t) return katalog.slice(0, 12)
    return katalog.filter(x => `${x.label} ${x.grup} ${x.kw ?? ''}`.toLocaleLowerCase('id').includes(t)).slice(0, 16)
  }, [q, katalog])

  if (!buka) return null

  const pilih = (to: string, label: string) => {
    trackEvent('global_search_open', { label, to })
    tutup(); setQ(''); nav(to)
  }

  return <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm p-3 sm:p-8" onMouseDown={e => { if (e.target === e.currentTarget) tutup() }}>
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 text-white shadow-2xl">
      <div className="border-b border-white/10 p-4">
        <input ref={kotak} value={q} onChange={e => setQ(e.target.value)} placeholder="Cari fitur Panacea…" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400/60" onKeyDown={e => {
          if (e.key === 'Escape') tutup()
          if (e.key === 'ArrowDown') { e.preventDefault(); setSorot(s => Math.min(s + 1, hasil.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSorot(s => Math.max(s - 1, 0)) }
          if (e.key === 'Enter' && hasil[sorot]) pilih(hasil[sorot].to, hasil[sorot].label)
        }} />
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-2">
        {hasil.map((h, i) => <button key={h.to} onClick={() => pilih(h.to, h.label)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${i === sorot ? 'bg-emerald-400/15' : 'hover:bg-white/5'}`}>
          <span><span className="block font-medium">{h.label}</span><span className="text-xs text-white/50">{h.grup}</span></span><span aria-hidden>→</span>
        </button>)}
        {orang.length > 0 && <div className="mt-2 border-t border-white/10 pt-2">{orang.slice(0, 6).map(o => <div key={o.id} className="rounded-2xl px-4 py-3"><span className="block font-medium">{o.name}</span>{o.role && <span className="text-xs text-white/50">{o.role}</span>}</div>)}</div>}
        {!hasil.length && !orang.length && <div className="px-4 py-8 text-center text-sm text-white/50">Tidak ada hasil.</div>}
      </div>
    </div>
  </div>
}
