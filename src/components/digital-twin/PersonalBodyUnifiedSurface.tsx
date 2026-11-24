import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { sharePersonalBodyCanvas } from '../../lib/sharePersonalBody'
import { PersonalBodyAvatar3D } from '../PersonalBodyAvatar3D'
import { SurfaceGuide } from '../SurfaceGuide'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

const PersonalBodyGlassTelemetry = lazy(() => import('./PersonalBodyGlassTelemetry').then(m => ({ default: m.PersonalBodyGlassTelemetry })))
const UnifiedHumanSimulationProjector = lazy(() => import('../../pages/bodyhub/UnifiedHumanSimulationProjector'))
const PersonalAvatarCameraCapture = lazy(() => import('../../pages/bodyhub/PersonalAvatarCameraCapture'))

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
        className="dark grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-white/15 bg-[#050708] p-3 text-left text-white"
      >
        <img
          src="/home/atlas-body-holo.webp"
          alt=""
          width={56}
          height={72}
          className="h-[72px] w-[56px] rounded-xl bg-[#040a14] object-contain p-1"
        />
        <span className="min-w-0">
          <span className="block text-[15px] font-black tracking-[-.01em] text-white">{title}</span>
          <span className="block text-[12px] font-semibold text-slate-300">Unified 4D whole-body projection &amp; twin.</span>
        </span>
        <button
          type="button"
          data-pmd-native="true"
          aria-haspopup="dialog"
          className="min-h-[44px] shrink-0 rounded-full bg-emerald-400 px-4 text-[12px] font-black text-neutral-950"
        >
          Open 4D
        </button>
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="dark fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-[#030405] pb-[env(safe-area-inset-bottom)]">
      <PermukaanTubuh
        {...props}
        compact={false}
        onClose={() => {
          setLayarPenuh(false)
          if (window.history.state?.pmdBody3d) window.history.back()
        }}
      />
    </div>
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
      className="@container dark pmd-product-surface overflow-hidden rounded-[26px] border border-white/10 bg-[#050708] text-white"
      aria-label="Unified personal body and anatomy surface"
    >
      <header className="grid gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 text-base font-black tracking-[-.02em]">{title}</h2>
          <BatasKlaimKesehatan permukaan="body.personal-surface" className="mt-2 text-[11px] leading-snug text-white/55" />

          {cameraCapture ? (
            <button
              type="button"
              data-pmd-native="true"
              onClick={() => setScanOpen((value) => !value)}
              className="min-h-[44px] shrink-0 rounded-full border border-white/15 bg-white/[.08] px-3.5 text-[11px] font-black text-white hover:bg-white/[.14]"
            >
              {scanOpen ? 'Close scan' : 'Scan'}
            </button>
          ) : null}

          {shareable ? (
            <button
              type="button"
              data-pmd-native="true"
              onClick={() => void share()}
              disabled={shareState === 'busy'}
              className="min-h-[44px] shrink-0 rounded-full border border-white/15 bg-white/[.08] px-3.5 text-[11px] font-black text-white hover:bg-white/[.14] disabled:opacity-50"
            >
              {shareState === 'busy' ? 'Preparing…' : shareState === 'done' ? 'Shared ✓' : shareState === 'error' ? 'Try again' : 'Share'}
            </button>
          ) : null}

          {onClose ? (
            <button
              type="button"
              data-pmd-native="true"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[15px] font-black text-black"
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
              data-pmd-native="true"
              aria-selected={focus === item.id}
              onClick={() => setFocus(item.id)}
              className={`min-h-[44px] rounded-full px-3 text-[11px] font-black transition ${focus === item.id ? 'bg-white text-black' : 'bg-transparent text-slate-200 hover:bg-white/[.08] hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* compact diletakkan di kolom sempit (mis. 340px di UnifiedBodyWorkspace): dua kolom dipilih dari LEBAR KOTAKNYA
          (container query), bukan lebar layar — breakpoint viewport menyisakan ~78px untuk kolom kedua di 1440px. */}
      <div className={`grid min-w-0 gap-0 ${compact ? '@[44rem]:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]' : 'lg:grid-cols-[minmax(320px,.78fr)_minmax(0,1.22fr)]'}`}>
        <div ref={avatarRef} className={`min-w-0 border-b border-white/10 ${compact ? '@[44rem]:border-b-0 @[44rem]:border-r' : 'lg:border-b-0 lg:border-r'}`}>
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

      <footer className="border-t border-white/10 px-3 py-4 sm:px-4 space-y-4">
        <Suspense fallback={null}><PersonalBodyGlassTelemetry /></Suspense>
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
export { PersonalBodyGlassTelemetry } from './PersonalBodyGlassTelemetry'
