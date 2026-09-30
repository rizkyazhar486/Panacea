import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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

// Satu halaman, satu tubuh. Your Body merender permukaan ini di kepalanya DAN
// memuat PusatTubuh (yang juga merendernya) sebagai isi tab — dua kanvas WebGL
// untuk orang yang sama. Halaman induk yang sudah menampilkannya membungkus
// isinya dengan penyedia ini, dan salinan bersarang tidak dirender lagi.
const SudahDitampilkan = createContext(false)

export function PersonalBodySurfaceShown({ children }: { children: ReactNode }) {
  return <SudahDitampilkan.Provider value>{children}</SudahDitampilkan.Provider>
}

// Di layar sempit dua kanvas 3D bertumpuk setinggi ~2.900 px dan mendorong isi
// halaman ke layar keempat. Di bawah lebar ini permukaannya menjadi satu kartu
// yang membuka tampilan layar penuh; di atasnya tetap tampil di tempat.
export const LEBAR_PERMUKAAN_DI_TEMPAT = '(min-width: 1024px)'

function useCukupLebar(): boolean {
  const cek = () => typeof window !== 'undefined' && !!window.matchMedia?.(LEBAR_PERMUKAAN_DI_TEMPAT).matches
  const [lebar, setLebar] = useState(cek)
  useEffect(() => {
    const mq = window.matchMedia?.(LEBAR_PERMUKAAN_DI_TEMPAT)
    if (!mq) return
    const ubah = () => setLebar(mq.matches)
    mq.addEventListener?.('change', ubah)
    return () => mq.removeEventListener?.('change', ubah)
  }, [])
  return lebar
}

const FOCUS: Array<{ id: PersonalBodyFocus; label: string }> = [
  { id: 'identity', label: 'You' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'clinical', label: 'Clinical' },
]

export function PersonalBodyUnifiedSurface(props: PersonalBodyUnifiedSurfaceProps) {
  const sudahAda = useContext(SudahDitampilkan)
  const lebar = useCukupLebar()
  const [layarPenuh, setLayarPenuh] = useState(false)
  const title = props.title ?? 'My Body'

  // Tombol kembali di ponsel menutup layar penuh, bukan meninggalkan halaman.
  useEffect(() => {
    if (!layarPenuh) return
    const akar = document.documentElement
    const semula = akar.style.overflow
    akar.style.overflow = 'hidden'
    window.history.pushState({ ...(window.history.state ?? {}), pmdBody3d: true }, '')
    const tutup = () => setLayarPenuh(false)
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') window.history.back() }
    window.addEventListener('popstate', tutup)
    window.addEventListener('keydown', esc)
    return () => {
      akar.style.overflow = semula
      window.removeEventListener('popstate', tutup)
      window.removeEventListener('keydown', esc)
    }
  }, [layarPenuh])

  if (sudahAda) return null
  if (lebar) return <PermukaanTubuh {...props} />

  if (!layarPenuh) {
    return (
      // Kartunya sengaja bukan <button>: lapisan global v46 mengecat ulang setiap
      // tombol berkelas rounded/bg/border sebagai pil grafit, dan tata letak
      // kartu ikut rusak. Hanya tombol "Open 3D" yang memakai materi itu.
      <div
        data-personal-body-launcher="v1"
        onClick={() => setLayarPenuh(true)}
        className="dark grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-white/10 bg-[#050708] p-3 text-left text-white"
      >
        <SiluetTubuh />
        <span className="min-w-0">
          <span className="block text-[15px] font-black tracking-[-.01em]">{title}</span>
          <span className="block text-[12px] font-semibold text-white/60">Your 3D body and anatomy.</span>
        </span>
        <button type="button" aria-haspopup="dialog" className="min-h-10 rounded-full px-4 text-[12px] font-black">Open 3D</button>
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="dark fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-[#030405] pb-[env(safe-area-inset-bottom)]">
      <PermukaanTubuh {...props} compact={false} onClose={() => window.history.back()} />
    </div>
  )
}

function SiluetTubuh() {
  return (
    <svg viewBox="0 0 56 84" className="h-[72px] w-[56px]" aria-hidden>
      <circle cx="28" cy="10" r="7" fill="none" stroke="#00BF63" strokeWidth="2" />
      <path
        d="M17 22h22l6 24-5 1-5-17v20l3 30h-6l-4-26-4 26h-6l3-30V30l-5 17-5-1z"
        fill="rgba(0,191,99,.12)"
        stroke="#00BF63"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PermukaanTubuh({
  compact = false,
  defaultFocus = 'identity',
  shareable = true,
  cameraCapture = true,
  title = 'My Body',
  onClose,
}: PersonalBodyUnifiedSurfaceProps & { onClose?: () => void }) {
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
      <header className="grid gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 text-base font-black tracking-[-.02em]">{title}</h2>

          {cameraCapture ? (
            <button
              type="button"
              onClick={() => setScanOpen((value) => !value)}
              className="min-h-9 shrink-0 rounded-full border border-white/12 px-3 text-[11px] font-black text-white/80 hover:bg-white/[.06]"
            >
              {scanOpen ? 'Close scan' : 'Scan'}
            </button>
          ) : null}

          {shareable ? (
            <button
              type="button"
              onClick={() => void share()}
              disabled={shareState === 'busy'}
              className="min-h-9 shrink-0 rounded-full border border-white/12 px-3 text-[11px] font-black text-white/80 hover:bg-white/[.06] disabled:opacity-50"
            >
              {shareState === 'busy' ? 'Preparing…' : shareState === 'done' ? 'Shared ✓' : shareState === 'error' ? 'Try again' : 'Share'}
            </button>
          ) : null}

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[15px] font-black text-black"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[.035] p-1" role="tablist" aria-label="Personal body view">
          {FOCUS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={focus === item.id}
              onClick={() => setFocus(item.id)}
              className={`min-h-9 rounded-full px-3 text-[11px] font-black transition ${focus === item.id ? 'bg-white text-black' : 'text-white/70 hover:bg-white/[.06] hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

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

      <footer className="border-t border-white/10 px-3 py-2 sm:px-4">
        <p className="text-[11px] leading-relaxed text-white/65">Your outer avatar is personal; internal anatomy is a source-backed reference.</p>
        <SurfaceGuide
          label="How to use"
          summary="rotate yourself → open anatomy → Clinical for sourced context"
          steps={[
            'Rotate your personal avatar to orient the body.',
            'Open the matching anatomy system instead of hunting through menus.',
            'Share only the personal render you intentionally choose; internal anatomy stays reference-only until real patient imaging is registered.',
          ]}
        />
      </footer>
    </section>
  )
}

export default PersonalBodyUnifiedSurface
