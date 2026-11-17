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

      <nav
        aria-label="Super-OS 3D & Personalization Studios"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          margin: '0 0 12px 0',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.78)',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
          ⚡ Super-OS 1:1 Studios & QR/Barcode Pass
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <a
            href="/personal-digital-self-1to1.html"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textDecoration: 'none'
            }}
          >
            🎮 1:1 Personal Self (Sims 4 · GTA 6 · QR/Barcode)
          </a>
          <a
            href="/medscihub-4d-anatomy-emr.html"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.18)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              textDecoration: 'none'
            }}
          >
            🧬 MedSciHub UHD 5K 4D Anatomy & AI-EMR
          </a>
          <a
            href="/digital-cellular-biosphere-os.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.22)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.5)", textDecoration: "none" }}
          >
            🌐 Digital Cellular Biosphere OS
          </a>
          <a
            href="/cellular-spacetime-debugger-os.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.22)", color: "#7dd3fc", border: "1px solid rgba(56, 189, 248, 0.5)", textDecoration: "none" }}
          >
            🔬 4D Cellular Spacetime & Bio-Debugger
          </a>
          <a
            href="/whole-body-exposure-os.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.22)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.5)", textDecoration: "none" }}
          >
            🖥️ Whole-Body OS Kernel (Network & Circadian)
          </a>
          <a
            href="/numerical-body-exposure-clinical.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(14, 165, 233, 0.18)", color: "#7dd3fc", border: "1px solid rgba(14, 165, 233, 0.45)", textDecoration: "none" }}
          >
            📊 Numerical Body Exposure & Biophysics
          </a>
          <a
            href="/hippocratic-clinical-os.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.18)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.45)", textDecoration: "none" }}
          >
            ⚕️ Hippocratic Clinical OS (Primum Non Nocere)
          </a>
          <a
            href="/omniscience-natural-laws-engine.html"
            style={{ fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.18)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)", textDecoration: "none" }}
          >
            ⚛️ Omniscience Natural Laws & Adaptive Tech
          </a>
          <a
            href="/deep-human-lab/medscihub-3d-multiscale-simulation.html"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.18)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              textDecoration: 'none'
            }}
          >
            🔬 Deep Human Lab 3D Multiscale
          </a>
        </div>
      </nav>
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
