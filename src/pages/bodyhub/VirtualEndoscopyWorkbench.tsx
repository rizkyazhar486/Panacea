import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { segmentAt } from '../../lib/endoskopi/garisTengah'
import { EndoluminalScope3D, ScopeRouteMap3D, useScopeRoute } from './endoscopy/EndoluminalScope3D'
import { SCOPE_ROUTES, type ScopeRouteId } from './endoscopy/scopeRoutes'

interface VirtualEndoscopyWorkbenchProps {
  selectedSystemId: BodySystemId
  selectedSourceStructureName?: string | null
  onSystemChange: (systemId: BodySystemId) => void
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))

export default function VirtualEndoscopyWorkbench({
  selectedSystemId,
  selectedSourceStructureName,
  onSystemChange,
}: VirtualEndoscopyWorkbenchProps) {
  const reducedMotion = useReducedMotion()
  const [routeId, setRouteId] = useState<ScopeRouteId>(selectedSystemId === 'respiratory' ? 'bronchoscopy' : 'colonoscopy')
  const [progress, setProgress] = useState(0.02)
  const [playing, setPlaying] = useState(false)
  const route = useMemo(() => SCOPE_ROUTES.find((r) => r.id === routeId) ?? SCOPE_ROUTES[0]!, [routeId])
  const { loaded } = useScopeRoute(route)
  const segmentIndex = loaded ? segmentAt(loaded.centerline, progress) : 0
  const segment = route.segments[segmentIndex]!
  const landmarksRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Keep the current landmark chip visible on narrow screens; scroll the row only, never the page.
    const row = landmarksRef.current
    const chip = row?.querySelector<HTMLElement>('[aria-current="step"]')
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [segmentIndex, routeId, reducedMotion])

  useEffect(() => {
    onSystemChange(route.systemId)
  }, [onSystemChange, route.systemId])

  useEffect(() => {
    if (!playing || reducedMotion) return
    const id = window.setInterval(() => {
      setProgress((current) => {
        const next = clamp(current + 0.0016)
        if (next >= 1) setPlaying(false)
        return next
      })
    }, 50)
    return () => window.clearInterval(id)
  }, [playing, reducedMotion])

  function chooseRoute(next: ScopeRouteId) {
    setRouteId(next)
    setProgress(0.02)
    setPlaying(false)
  }

  return (
    <section
      data-virtual-endoscopy="v2"
      data-selected-source-structure={selectedSourceStructureName ?? undefined}
      data-structure-route-inference="not-inferred"
      data-patient-specific-scope-navigation="not-generated"
      className="dark overflow-hidden rounded-[24px] border border-white/[.08] bg-[#050203] text-white"
      aria-labelledby="virtual-endoscopy-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-3 pb-2 pt-3 sm:px-4">
        <h4 id="virtual-endoscopy-title" className="text-base font-black tracking-[-.02em] sm:text-lg">Virtual endoscopy</h4>
        <div className="flex gap-1.5" role="tablist" aria-label="Procedure">
          {SCOPE_ROUTES.map((item) => {
            const active = item.id === route.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseRoute(item.id)}
                className={`min-h-[40px] rounded-full px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 ${active ? 'bg-white text-black' : 'bg-white/[.06] text-white/60 hover:bg-white/[.1] hover:text-white'}`}
              >
                {item.short}
              </button>
            )
          })}
        </div>
      </header>

      <div className="relative mx-2 overflow-hidden rounded-[20px] bg-black sm:mx-3">
        <div className="relative aspect-[4/5] max-h-[72vh] w-full sm:aspect-[16/10]">
          <EndoluminalScope3D route={route} progress={progress} />

          {/* Picture-in-picture: where the scope tip is on the reference organ. */}
          <div className="absolute right-2 top-2 h-[34%] w-[30%] min-w-[104px] overflow-hidden rounded-[16px] border border-white/[.12] bg-black/55 backdrop-blur-md sm:right-3 sm:top-3 sm:h-[42%] sm:w-[24%]">
            <ScopeRouteMap3D route={route} progress={progress} />
            <span className="pointer-events-none absolute bottom-1 left-1.5 text-[8px] font-black text-white/45">R</span>
            <span className="pointer-events-none absolute bottom-1 right-1.5 text-[8px] font-black text-white/45">L</span>
          </div>

          <div className="pointer-events-none absolute left-3 top-3 max-w-[60%]">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-rose-200/70">{route.label}</div>
            <div className="mt-0.5 text-xl font-black tracking-[-.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.8)] sm:text-2xl">{segment.label}</div>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              aria-label={playing ? 'Pause scope advance' : 'Advance scope'}
              onClick={() => { if (progress >= 0.99) setProgress(0.02); setPlaying((value) => !value) }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-base font-black text-black shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70"
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(event) => { setProgress(Number(event.target.value) / 1000); setPlaying(false) }}
              aria-label="Scope position along the route"
              className="h-12 min-w-0 flex-1 cursor-pointer accent-rose-300"
            />
          </div>
        </div>
      </div>

      <nav ref={landmarksRef} className="no-scrollbar relative flex gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-4" aria-label={`${route.label} landmarks`}>
        {route.segments.map((item, index) => {
          const active = index === segmentIndex
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'step' : undefined}
              disabled={!loaded}
              onClick={() => { if (loaded) { setProgress(clamp((loaded.centerline.segmentStarts[index] ?? 0) + 0.01)); setPlaying(false) } }}
              className={`min-h-[38px] shrink-0 rounded-full border px-3 text-[11px] font-bold transition disabled:opacity-40 ${active ? 'border-rose-300/40 bg-rose-300/[.14] text-rose-50' : 'border-white/[.08] text-white/50 hover:bg-white/[.06] hover:text-white/85'}`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <p className="border-t border-white/[.06] px-3 py-2 text-[10px] leading-relaxed text-white/40 sm:px-4">
        Route and lumen calibre traced from the reference atlas ({route.source}). Fold relief and mucosal colour are illustrative. Not patient anatomy, lesion findings or procedural guidance. Drag the view to look around.
      </p>
    </section>
  )
}
