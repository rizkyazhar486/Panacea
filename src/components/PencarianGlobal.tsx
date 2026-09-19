import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_UNTUK_PENGATURAN } from './Shell'
import { ambilTersembunyi } from '../lib/fiturTersembunyi'
import { api, backendEnabled } from '../lib/api'
import type { Role } from '../lib/types'

interface HasilFeatures { to: string; label: string; grup: string; kw?: string }
interface HasilOrang { id: string; name: string; role: Role; picture?: string }

export function PencarianGlobal({ buka, tutup }: { buka: boolean; tutup: () => void }) {
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
        for (const g of w.GROUPS) tambah('Longevity', g.feats)
      } catch {
        // Canonical navigation remains available even if a richer hub catalogue fails.
      }
      if (!batal) setKatalog([...peta.values()])
    })()
    return () => { batal = true }
  }, [buka, katalog.length])

  useEffect(() => { if (buka) setTimeout(() => kotak.current?.focus(), 50) }, [buka])
  useEffect(() => { setSorot(0) }, [q])

  useEffect(() => {
    const t = q.trim()
    if (!buka || !backendEnabled || t.length < 2) { setOrang([]); return }
    const id = setTimeout(() => {
      void api.cariOrang(t).then(setOrang).catch(() => setOrang([]))
    }, 250)
    return () => clearTimeout(id)
  }, [q, buka])

  const hasil = useMemo(() => {
    const t = q.trim().toLocaleLowerCase('id')
    if (!t) return katalog.slice(0, 12)
    return katalog
      .filter(x => `${x.label} ${x.grup} ${x.kw ?? ''}`.toLocaleLowerCase('id').includes(t))
      .slice(0, 16)
  }, [q, katalog])

  if (!buka) return null

  const pilih = (to: string) => {
    tutup()
    setQ('')
    nav(to)
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/45 p-3 backdrop-blur-sm sm:p-8"
      onMouseDown={e => { if (e.target === e.currentTarget) tutup() }}
      role="dialog"
      aria-modal="true"
      aria-label="Search Panacea"
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 text-white shadow-2xl">
        <div className="border-b border-white/10 p-4">
          <input
            ref={kotak}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari fitur Panacea…"
            aria-label="Cari fitur Panacea"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400/60"
            onKeyDown={e => {
              if (e.key === 'Escape') tutup()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSorot(s => Math.min(s + 1, Math.max(hasil.length - 1, 0))) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSorot(s => Math.max(s - 1, 0)) }
              if (e.key === 'Enter' && hasil[sorot]) pilih(hasil[sorot].to)
            }}
          />
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {hasil.map((h, i) => (
            <button
              key={h.to}
              onClick={() => pilih(h.to)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${i === sorot ? 'bg-emerald-400/15' : 'hover:bg-white/5'}`}
            >
              <span>
                <span className="block font-medium">{h.label}</span>
                <span className="text-xs text-white/50">{h.grup}</span>
              </span>
              <span aria-hidden>→</span>
            </button>
          ))}
          {orang.length > 0 && (
            <div className="mt-2 border-t border-white/10 pt-2">
              {orang.slice(0, 6).map(o => (
                <button
                  key={o.id}
                  onClick={() => pilih(`/jelajah?orang=${encodeURIComponent(o.name)}`)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-white/5"
                >
                  {o.picture ? <img src={o.picture} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold">{o.name.slice(0, 1).toUpperCase()}</span>}
                  <span><span className="block font-medium">{o.name}</span><span className="text-xs text-white/50">{o.role}</span></span>
                </button>
              ))}
            </div>
          )}
          {!hasil.length && !orang.length && <div className="px-4 py-8 text-center text-sm text-white/50">Tidak ada hasil.</div>}
        </div>
      </div>
    </div>
  )
}

export default PencarianGlobal
