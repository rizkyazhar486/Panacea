import { lazy, Suspense, useRef, useState } from 'react'
import type { BodySystemId } from '../lib/bodySystemSourceWave'
import { sharePersonalBodyCanvas } from '../lib/sharePersonalBody'
import { PersonalBodyAvatar3D } from './PersonalBodyAvatar3D'
import { SurfaceGuide } from './SurfaceGuide'

const UnifiedHumanSimulationProjector = lazy(() => import('../pages/bodyhub/UnifiedHumanSimulationProjector'))
const PersonalAvatarCameraCapture = lazy(() => import('../pages/bodyhub/PersonalAvatarCameraCapture'))

type PersonalBodyFocus = 'identity' | 'anatomy' | 'clinical'

interface PersonalBodyUnifiedSurfaceProps {
  compact?: boolean
  defaultFocus?: PersonalBodyFocus
  shareable?: boolean
  cameraCapture?: boolean
  title?: string
}

const FOCUS: Array<{ id: PersonalBodyFocus; label: string }> = [
  { id: 'identity', label: 'You' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'clinical', label: 'Clinical' },
]

export function PersonalBodyUnifiedSurface({
  compact = false,
  defaultFocus = 'identity',
  shareable = true,
  cameraCapture = true,
  title = 'My Body',
}: PersonalBodyUnifiedSurfaceProps) {
  const avatarRef = useRef<HTMLDivElement>(null)
  const [focus, setFocus] = useState<PersonalBodyFocus>(defaultFocus)
  const [systemId, setSystemId] = useState<BodySystemId>('cardiovascular')
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [scanOpen, setScanOpen] = useState(false)

  const domain = focus === 'clinical' ? 'pathophysiology' : 'anatomy'

  async function share() {
    const root = avatarRef.current
    if (!root || shareState === 'busy') return
    setShareState('busy')
    try {
      await sharePersonalBodyCanvas(root, { title: 'My Body · Panaceamed', fileName: 'panaceamed-my-body' })
      setShareState('done')
      window.setTimeout(() => setShareState('idle'), 1800)
    } catch {
      setShareState('error')
      window.setTimeout(() => setShareState('idle'), 2200)
    }
  }

  return (
    <section
      data-personal-body-unified-surface="v1"
      className="dark pmd-product-surface overflow-hidden rounded-[26px] border border-white/10 bg-[#050708] text-white"
      aria-label="Unified personal body and anatomy surface"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/80">Personal body + source anatomy</div>
          <h2 className="mt-0.5 truncate text-base font-black tracking-[-.02em]">{title}</h2>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[.035] p-1" role="tablist" aria-label="Personal body view">
          {FOCUS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={focus === item.id}
              onClick={() => setFocus(item.id)}
              className={`min-h-9 rounded-full px-3 text-[10px] font-black transition ${focus === item.id ? 'bg-white text-black' : 'text-white/70 hover:bg-white/[.06] hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {cameraCapture ? (
          <button
            type="button"
            onClick={() => setScanOpen((value) => !value)}
            className="min-h-9 rounded-full border border-white/12 px-3 text-[10px] font-black text-white/80 hover:bg-white/[.06]"
          >
            {scanOpen ? 'Close scan' : 'Scan'}
          </button>
        ) : null}

        {shareable ? (
          <button
            type="button"
            onClick={() => void share()}
            disabled={shareState === 'busy'}
            className="min-h-9 rounded-full border border-white/12 px-3 text-[10px] font-black text-white/80 hover:bg-white/[.06] disabled:opacity-50"
          >
            {shareState === 'busy' ? 'Preparing…' : shareState === 'done' ? 'Shared ✓' : shareState === 'error' ? 'Try again' : 'Share'}
          </button>
        ) : null}
      </header>

      <SurfaceGuide
        label="Start here"
        summary="rotate yourself → open anatomy → use Clinical only for sourced context"
        steps={[
          'Rotate your personal avatar to orient the body.',
          'Open the matching anatomy system instead of hunting through menus.',
          'Share only the personal render you intentionally choose.',
        ]}
      />

      <div className={`grid min-w-0 gap-0 ${compact ? 'xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]' : 'lg:grid-cols-[minmax(320px,.78fr)_minmax(0,1.22fr)]'}`}>
        <div ref={avatarRef} className="min-w-0 border-b border-white/10 lg:border-b-0 lg:border-r">
          <PersonalBodyAvatar3D compact={compact} />
        </div>

        <div className="min-w-0 bg-black/25">
          <Suspense fallback={<div className="grid min-h-[320px] place-items-center text-xs font-bold text-white/55">Opening anatomy…</div>}>
            <UnifiedHumanSimulationProjector
              selectedSystemId={systemId}
              onSystemChange={setSystemId}
              requestedDomain={domain}
              compact={compact}
            />
          </Suspense>
        </div>
      </div>

      {cameraCapture && scanOpen ? (
        <div className="border-t border-white/10 p-2 sm:p-3">
          <Suspense fallback={<div className="grid min-h-56 place-items-center text-xs font-bold text-white/55">Opening camera…</div>}>
            <PersonalAvatarCameraCapture />
          </Suspense>
        </div>
      ) : null}

      <footer className="border-t border-white/10 px-3 py-2 text-[10px] leading-relaxed text-white/65 sm:px-4">
        Your outer avatar is personal. Internal anatomy remains a source-backed reference until real patient imaging is registered.
      </footer>
    </section>
  )
}

export default PersonalBodyUnifiedSurface
