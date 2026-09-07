import { useEffect, useRef, useState, type ReactNode } from 'react'
import '../styles/widget-system-v4.css'

export function Tumpukan({ judul, anak, aksi }: { judul?: string; anak: { kunci: string; isi: ReactNode }[]; aksi?: ReactNode }) {
  const wadah = useRef<HTMLDivElement>(null)
  const halaman = useRef<(HTMLDivElement | null)[]>([])
  const digeser = useRef(false)
  const [aktif, setAktif] = useState(0)
  const [tinggi, setTinggi] = useState<number | undefined>(undefined)
  const [kosong, setKosong] = useState<Record<number, boolean>>({})
  const [siap, setSiap] = useState(() => Math.min(anak.length, 3))

  useEffect(() => {
    setSiap((s) => Math.max(s, Math.min(anak.length, 3)))
  }, [anak.length])

  useEffect(() => {
    if (siap >= anak.length) return
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const lanjut = () => setSiap((s) => Math.min(anak.length, s + 3))
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(lanjut, { timeout: 400 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(lanjut, 120)
    return () => window.clearTimeout(id)
  }, [siap, anak.length])

  useEffect(() => {
    setSiap((s) => Math.max(s, Math.min(anak.length, aktif + 3)))
  }, [aktif, anak.length])

  useEffect(() => {
    const periksa = () => {
      setKosong((lama) => {
        const baru: Record<number, boolean> = {}
        let berubah = false
        anak.forEach((_, i) => {
          const nihil = i < siap && !halaman.current[i]?.firstElementChild
          baru[i] = nihil
          if (lama[i] !== nihil) berubah = true
        })
        return berubah ? baru : lama
      })
    }
    periksa()
    const mo = new MutationObserver(periksa)
    for (const el of halaman.current) if (el) mo.observe(el, { childList: true })
    return () => mo.disconnect()
  }, [anak, siap])

  const tampil = anak.map((a, i) => ({ ...a, i })).filter((a) => !kosong[a.i])
  const TINGGI_MIN = 168
  const TINGGI_MAKS = 320

  useEffect(() => {
    const ukur = () => {
      let maks = 0
      tampil.forEach((t) => {
        const el = halaman.current[t.i]
        if (!el) return
        const first = el.firstElementChild as HTMLElement | null
        const alami = first ? Math.max(first.scrollHeight, first.getBoundingClientRect().height) : el.scrollHeight
        maks = Math.max(maks, alami + 28)
      })
      if (maks) setTinggi(Math.min(TINGGI_MAKS, Math.max(TINGGI_MIN, maks)))
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    for (const t of tampil) {
      const el = halaman.current[t.i]
      if (el) ro.observe(el)
    }
    return () => ro.disconnect()
  }, [tampil.length, siap])

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    let frame = 0
    const gulir = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
        setAktif(Math.max(0, Math.min(i, Math.max(0, tampil.length - 1))))
        frame = 0
      })
    }
    const tandai = () => { digeser.current = true }
    el.addEventListener('scroll', gulir, { passive: true })
    el.addEventListener('pointerdown', tandai, { passive: true })
    el.addEventListener('wheel', tandai, { passive: true })
    return () => {
      el.removeEventListener('scroll', gulir)
      el.removeEventListener('pointerdown', tandai)
      el.removeEventListener('wheel', tandai)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [tampil.length])

  useEffect(() => {
    if (!tampil.length) return
    setAktif((v) => Math.min(v, tampil.length - 1))
    const el = wadah.current
    if (!el) return
    const id = window.setTimeout(() => {
      const w = el.clientWidth
      if (!w) return
      const target = digeser.current ? Math.round(el.scrollLeft / w) * w : 0
      if (Math.abs(el.scrollLeft - target) > 1) el.scrollTo({ left: target })
    }, 60)
    return () => window.clearTimeout(id)
  }, [tampil.length, tinggi])

  if (!anak.length) return null

  const ke = (i: number) => {
    const next = Math.max(0, Math.min(i, Math.max(0, tampil.length - 1)))
    digeser.current = true
    setAktif(next)
    const el = wadah.current
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  const progress = tampil.length ? ((aktif + 1) / tampil.length) * 100 : 0

  return (
    <section className="widget-stack-v4" aria-label={judul || 'Widgets'}>
      <div className="widget-stack-head-v4">
        <div className="widget-stack-title-v4">
          <span className="widget-stack-mark-v4" aria-hidden />
          <div className="widget-stack-title-copy-v4">
            <div className="widget-stack-eyebrow-v4">Live dashboard</div>
            <h2 className="widget-stack-name-v4">{judul || 'Summary'}</h2>
          </div>
        </div>
        <div className="widget-stack-tools-v4">
          <span className="widget-stack-page-v4" aria-label={`Widget ${aktif + 1} of ${Math.max(1, tampil.length)}`}>
            {Math.min(aktif + 1, Math.max(1, tampil.length))}/{Math.max(1, tampil.length)}
          </span>
          {aksi && <div className="widget-stack-edit-v4"><span aria-hidden>⚙</span><span>{aksi}</span></div>}
        </div>
      </div>

      <div className="widget-stage-v4">
        <div
          ref={wadah}
          className="widget-stage-scroll-v4"
          style={{ height: tinggi, minHeight: TINGGI_MIN }}
        >
          {anak.map((a, i) => (
            <div
              key={a.kunci}
              ref={(el) => { halaman.current[i] = el }}
              className={`${kosong[i] ? 'hidden' : ''} widget-slide-v4`}
            >
              {i < siap ? a.isi : null}
            </div>
          ))}
        </div>
      </div>

      {tampil.length > 1 && (
        <div className="widget-stack-nav-v4" aria-label="Widget navigation">
          <button
            type="button"
            className="widget-nav-btn-v4"
            onClick={() => ke(aktif - 1)}
            disabled={aktif <= 0}
            aria-label="Previous widget"
          >‹</button>
          <div className="widget-progress-v4" aria-hidden>
            <div className="widget-progress-fill-v4" style={{ width: `${progress}%` }} />
          </div>
          <button
            type="button"
            className="widget-nav-btn-v4"
            onClick={() => ke(aktif + 1)}
            disabled={aktif >= tampil.length - 1}
            aria-label="Next widget"
          >›</button>
        </div>
      )}
    </section>
  )
}

export default Tumpukan
