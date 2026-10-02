import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { jendelakanMpr, type IrisanMpr } from '../lib/dicomMpr'
import { ukurDenganSkala, type SkalaBidang, type TitikBidang } from '../lib/ukurMpr'

// Satu bidang MPR (aksial/koronal/sagital) dengan windowing, crosshair sinkron dan
// ukur mm. Dipakai /radiology dan Body Exposure > Imaging supaya tidak ada dua
// penampil MPR yang berbeda perilaku.
export interface PlaneProps {
  title: string
  subtitle: string
  plane: IrisanMpr
  pusat: number
  lebar: number
  terbalik: boolean
  crossX?: number
  crossY?: number
  showCrosshair: boolean
  primary?: boolean
  onPick: (x: number, y: number) => void
  /** Measure mode: two taps set A and B; distance in mm from this plane's own spacing. */
  ukur?: boolean
  skala?: SkalaBidang
}

export function PlaneViewer({
  title, subtitle, plane, pusat, lebar, terbalik,
  crossX, crossY, showCrosshair, primary, onPick, ukur = false, skala,
}: PlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [titik, setTitik] = useState<TitikBidang[]>([])
  useEffect(() => { setTitik([]) }, [ukur, plane.bidang, plane.kolom, plane.baris])
  const hasilUkur = titik.length === 2 && skala ? ukurDenganSkala(skala, titik[0], titik[1]) : null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = plane.kolom
    canvas.height = plane.baris
    const context = canvas.getContext('2d')
    if (!context) return

    const gray = jendelakanMpr(plane.nilai, pusat, lebar, terbalik)
    const image = context.createImageData(plane.kolom, plane.baris)
    for (let i = 0; i < gray.length; i++) {
      const offset = i * 4
      image.data[offset] = gray[i]
      image.data[offset + 1] = gray[i]
      image.data[offset + 2] = gray[i]
      image.data[offset + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }, [plane, pusat, lebar, terbalik])

  const pick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(plane.kolom - 1, Math.floor(((event.clientX - rect.left) / rect.width) * plane.kolom)))
    const y = Math.max(0, Math.min(plane.baris - 1, Math.floor(((event.clientY - rect.top) / rect.height) * plane.baris)))
    if (ukur) { setTitik((t) => (t.length >= 2 ? [{ kolom: x, baris: y }] : [...t, { kolom: x, baris: y }])); return }
    onPick(x, y)
  }

  const crossLeft = crossX == null || plane.kolom <= 1 ? 50 : (crossX / (plane.kolom - 1)) * 100
  const crossTop = crossY == null || plane.baris <= 1 ? 50 : (crossY / (plane.baris - 1)) * 100
  const safeAspect = Math.max(0.35, Math.min(3.2, plane.aspek || 1))

  return (
    <section className={`overflow-hidden rounded-2xl border border-white/10 bg-black/70 ${primary ? 'lg:row-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
        <div>
          <div className="text-xs font-black text-white">{title}</div>
          <div className="text-[10px] text-white/45">{subtitle}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/55">
          {plane.kolom}×{plane.baris}
        </div>
      </div>
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-black p-2 sm:min-h-[280px]">
        <div className="relative w-full max-w-full" style={{ aspectRatio: String(safeAspect) }}>
          <canvas
            ref={canvasRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              pick(event)
            }}
            onPointerMove={(event) => { if (event.buttons === 1 && !ukur) pick(event) }}
            className="block h-full max-h-[560px] w-full cursor-crosshair select-none object-contain"
            style={{ imageRendering: 'pixelated', touchAction: 'none', aspectRatio: String(safeAspect) }}
            aria-label={`${title} DICOM plane`}
          />
          {ukur && titik.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${plane.kolom} ${plane.baris}`} preserveAspectRatio="none" aria-hidden="true">
              {titik.length === 2 && <line x1={titik[0].kolom + 0.5} y1={titik[0].baris + 0.5} x2={titik[1].kolom + 0.5} y2={titik[1].baris + 0.5} stroke="#facc15" strokeWidth={Math.max(plane.kolom, plane.baris) / 220} />}
              {titik.map((t, i) => <circle key={i} cx={t.kolom + 0.5} cy={t.baris + 0.5} r={Math.max(plane.kolom, plane.baris) / 120} fill="#facc15" />)}
            </svg>
          )}
          {ukur && (
            <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[11px] font-black tabular-nums text-amber-200" data-mpr-measure={hasilUkur ? (hasilUkur.ok ? 'mm' : 'blocked') : 'pending'}>
              {!hasilUkur ? (titik.length ? 'Tap point B' : 'Tap point A')
                : hasilUkur.ok ? `${hasilUkur.mm.toFixed(1)} mm${hasilUkur.perkiraan ? ' (approx.: spacing from slice thickness)' : ''}`
                : hasilUkur.alasan}
            </div>
          )}
          {showCrosshair && crossX != null && crossY != null && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute bottom-0 top-0 w-px bg-cyan-300/70" style={{ left: `${crossLeft}%` }} />
              <div className="absolute left-0 right-0 h-px bg-amber-300/70" style={{ top: `${crossTop}%` }} />
              <div
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black/70"
                style={{ left: `${crossLeft}%`, top: `${crossTop}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

