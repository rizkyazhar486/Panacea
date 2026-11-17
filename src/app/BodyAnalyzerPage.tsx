// Composition root for /tubuh ("Your Body"): ONE body, then the person's own data by system, then the signals.
//
// The stage is the same BodyExposureAtlasHome that /body-exposure renders, so there is a single 3D body on the
// page. Picking a row in "Your systems" points that same stage at the system (?system=<id>); nothing here
// decides anything about the body itself.
import { lazy, Suspense, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AtlasViewer, sendCamera } from './BodyExposureAtlasRoute'
import { BodyExposureAtlasHome } from '../domains/body-exposure/ui/BodyExposureAtlasHome.tsx'
import { YourSystemsBoard } from '../domains/body-exposure/ui/YourSystemsBoard.tsx'
import { parseSystemParam } from '../domains/body-exposure/engine/systemBoard.ts'
import type { BodySystemId } from '../domains/body-exposure/data/bodySystems'
import { PusatTubuh } from '../pages/PusatTubuh'
import { WhenOpened } from '../shared/ui/WhenOpened'

const BodyExposureLocalHub = lazy(() =>
  import('../domains/body-exposure/ui/BodyExposureLocalHub.tsx').then((m) => ({ default: m.BodyExposureLocalHub })),
)

export default function BodyAnalyzerPage() {
  const [params, setParams] = useSearchParams()
  const system = parseSystemParam(params.get('system'))
  const stageRef = useRef<HTMLDivElement | null>(null)

  const selectSystem = useCallback((id: BodySystemId) => {
    const next = new URLSearchParams(params)
    next.set('system', id)
    setParams(next, { replace: true })
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [params, setParams])

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4">
      <h1 className="sr-only">Your Body: body analyzer</h1>
      <div ref={stageRef} className="scroll-mt-16">
        <BodyExposureAtlasHome Viewer={AtlasViewer} sendCamera={sendCamera} focusSystem={system} />
        <div className="mt-1 text-right">
          <Link to="/body-exposure" className="inline-flex min-h-[44px] items-center px-2 text-[12px] font-bold text-emerald-700 hover:underline dark:text-emerald-300">Open full-screen atlas →</Link>
        </div>
      </div>
      <YourSystemsBoard selected={system} onSelect={selectSystem} />
      <PusatTubuh tanpaTubuh />
      <details id="body-exposure-local-hub-fold" className="rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/10">
        <summary className="min-h-[44px] cursor-pointer text-[13px] font-black text-ink dark:text-white">Device passes &amp; wearable hub</summary>
        <WhenOpened>
          <Suspense fallback={<p role="status" className="py-3 text-[12px] text-neutral-500">Loading…</p>}>
            <BodyExposureLocalHub />
          </Suspense>
        </WhenOpened>
      </details>
    </div>
  )
}
