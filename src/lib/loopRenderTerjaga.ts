// Loop render kontinu yang BERHENTI saat kanvas di luar viewport, tab tersembunyi,
// konteks WebGL hilang, atau komponen dibuang. Satu implementasi bersama agar setiap
// viewer 3D tidak menulis ulang (dan lupa) logika penangguhan yang sama.

export interface DepLoop {
  requestFrame: (cb: () => void) => number
  cancelFrame: (id: number) => void
  tersembunyi: () => boolean
  onVisibilitas: (cb: () => void) => () => void
  amatiViewport: (el: Element, cb: (terlihat: boolean) => void) => () => void
}

export const depBrowser = (): DepLoop => ({
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
  tersembunyi: () => document.visibilityState === 'hidden',
  onVisibilitas: (cb) => { document.addEventListener('visibilitychange', cb); return () => document.removeEventListener('visibilitychange', cb) },
  amatiViewport: (el, cb) => {
    if (typeof IntersectionObserver === 'undefined') { cb(true); return () => {} }
    const io = new IntersectionObserver((e) => cb(e[0]?.isIntersecting ?? false), { rootMargin: '120px' })
    io.observe(el); return () => io.disconnect()
  },
})

export interface LoopTerjaga { berjalan: () => boolean; hentikan: () => void; kontekHilang: () => void }

export function mulaiLoopTerjaga(wadah: Element, frame: () => void, dep: DepLoop = depBrowser()): LoopTerjaga {
  let raf = 0, terlihat = true, dibuang = false, hilang = false
  const boleh = () => !dibuang && !hilang && terlihat && !dep.tersembunyi()
  const langkah = () => { raf = 0; if (!boleh()) return; frame(); raf = dep.requestFrame(langkah) }
  const mulai = () => { if (!raf && boleh()) raf = dep.requestFrame(langkah) }
  const henti = () => { if (raf) dep.cancelFrame(raf); raf = 0 }
  const lepasVis = dep.onVisibilitas(() => (dep.tersembunyi() ? henti() : mulai()))
  const lepasIo = dep.amatiViewport(wadah, (t) => { terlihat = t; if (t) mulai(); else henti() })
  mulai()
  return {
    berjalan: () => raf !== 0,
    kontekHilang: () => { hilang = true; henti() },
    hentikan: () => { if (dibuang) return; dibuang = true; henti(); lepasVis(); lepasIo() },
  }
}
