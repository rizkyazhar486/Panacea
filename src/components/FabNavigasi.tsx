import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from './Logo'
import { KATALOG_AKSI, SLOT_PER_HALAMAN } from '../lib/aksiFab'
import { PemilihAksiFab } from './PemilihAksiFab'
import { SlidableRail, type SlidableRailHandle } from './SlidableRail'
import { toggleTheme } from '../lib/theme'
import { classifyReleasedGesture, DEFAULT_GESTURE_THRESHOLDS } from '../lib/interaction/gesture'
import {
  ASSISTIVE_PREFS_EVENT,
  clampAssistivePosition,
  loadAssistivePosition,
  loadAssistivePreferences,
  registeredContextActionIds,
  saveAssistivePosition,
  snapAssistivePosition,
  type AssistivePosition,
  type AssistivePreferences,
} from '../lib/interaction/assistive'

export interface TujuanFab {
  to: string
  label: string
  ikon: ReactNode
  end?: boolean
}

type PointerState = {
  id: number
  startX: number
  startY: number
  orbX: number
  orbY: number
  started: number
  dragging: boolean
}

const TATA = [
  'col-start-2 row-start-1',
  'col-start-1 row-start-2',
  'col-start-3 row-start-2',
  'col-start-2 row-start-3',
  'col-start-1 row-start-3',
  'col-start-3 row-start-3',
  'col-start-1 row-start-1',
  'col-start-3 row-start-1',
]

function viewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    topInset: 56,
    bottomInset: 8,
  }
}

function reducedMotion() {
  try {
    if (localStorage.getItem('pmd-reduced-motion') === 'true') return true
  } catch { /* preferensi tampilan */ }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Tombol bantu global Panacea.
 *
 * Satu rangkaian pointer hanya boleh menghasilkan satu makna: pindah tombol,
 * long-press, swipe, double tap, atau single tap. Ambang gesture berasal dari
 * kernel murni di `lib/interaction/gesture`, bukan angka lokal yang berbeda.
 */
export function FabNavigasi({ onCari, tersembunyi = false }: {
  tujuan: TujuanFab[]
  onTambah?: () => void
  onCari?: () => void
  /**
   * Ikut menyingkir bersama bilah perintah.
   *
   * Yang diminta adalah layar yang benar-benar bersih saat sedang dibaca:
   * bilah atas DAN tombol melayang sama-sama pergi, lalu keduanya kembali
   * bersama saat digulir ke atas atau tepi atas diketuk. Menyembunyikan
   * bilahnya saja menyisakan satu benda mengambang di atas isi halaman, dan
   * itu justru yang paling menarik perhatian.
   */
  tersembunyi?: boolean
}) {
  const lokasi = useLocation()
  const navigasi = useNavigate()
  const sembunyikanDiBodyExplorer = lokasi.pathname.startsWith('/body-explorer')

  const [prefs, setPrefs] = useState<AssistivePreferences>(loadAssistivePreferences)
  const [pos, setPos] = useState<AssistivePosition>(() => {
    const saved = loadAssistivePosition()
    const defaultPos = { x: window.innerWidth - 72, y: window.innerHeight - 88 }
    return clampAssistivePosition(saved ?? defaultPos, viewport(), loadAssistivePreferences().size)
  })
  const [buka, setBuka] = useState(false)
  const [menggeser, setMenggeser] = useState(false)
  const [aturBuka, setAturBuka] = useState(false)
  const [redup, setRedup] = useState(false)
  const [halaman, setHalaman] = useState(0)
  const menyingkir = tersembunyi && !buka && !menggeser

  const orbRef = useRef<HTMLButtonElement>(null)
  const railRef = useRef<SlidableRailHandle>(null)
  const pointer = useRef<PointerState | null>(null)
  const jamRedup = useRef<number | null>(null)
  const longTimer = useRef<number | null>(null)
  const tapTimer = useRef<number | null>(null)
  const lastTapAt = useRef(0)
  const longFired = useRef(false)

  const bangunkan = useCallback(() => {
    setRedup(false)
    if (jamRedup.current) window.clearTimeout(jamRedup.current)
    jamRedup.current = window.setTimeout(() => setRedup(true), 2600)
  }, [])

  const vibrate = useCallback(() => {
    if (!prefs.haptics || !navigator.vibrate) return
    try { navigator.vibrate(9) } catch { /* dukungan perangkat bersifat opsional */ }
  }, [prefs.haptics])

  const jalankan = useCallback((id: string) => {
    const action = KATALOG_AKSI.find((item) => item.id === id)
    if (!action) return
    setBuka(false)
    vibrate()
    if (action.jenis === 'rute' && action.ke) navigasi(action.ke)
    else if (action.jenis === 'kembali') navigasi(-1)
    else if (action.jenis === 'atas') window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
    else if (action.jenis === 'tema') toggleTheme()
    else if (action.jenis === 'cari') {
      if (onCari) onCari()
      else window.dispatchEvent(new Event('panacea:cari'))
    }
  }, [navigasi, onCari, vibrate])

  const jalankanPemetaan = useCallback((id: string) => {
    if (id === 'menu') {
      vibrate()
      setBuka((value) => !value)
      return
    }
    if (id === 'customize') {
      vibrate()
      setBuka(false)
      setAturBuka(true)
      return
    }
    jalankan(id)
  }, [jalankan, vibrate])

  useEffect(() => {
    bangunkan()
    const onPrefs = () => setPrefs(loadAssistivePreferences())
    window.addEventListener(ASSISTIVE_PREFS_EVENT, onPrefs)
    return () => {
      if (jamRedup.current) window.clearTimeout(jamRedup.current)
      if (longTimer.current) window.clearTimeout(longTimer.current)
      if (tapTimer.current) window.clearTimeout(tapTimer.current)
      window.removeEventListener(ASSISTIVE_PREFS_EVENT, onPrefs)
    }
  }, [bangunkan])

  useEffect(() => {
    setPos((current) => clampAssistivePosition(current, viewport(), prefs.size))
  }, [prefs.size])

  useEffect(() => {
    setBuka(false)
    setHalaman(0)
  }, [lokasi.pathname, lokasi.search])

  useEffect(() => {
    if (buka) {
      setRedup(false)
      setHalaman(0)
      railRef.current?.scrollToIndex(0)
    } else bangunkan()
  }, [buka, bangunkan])

  useEffect(() => {
    const resize = () => setPos((current) => clampAssistivePosition(current, viewport(), prefs.size))
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
    }
  }, [prefs.size])

  useEffect(() => {
    if (!buka) return
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBuka(false)
        requestAnimationFrame(() => orbRef.current?.focus())
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [buka])

  const routeId = `${lokasi.pathname}${lokasi.search}`
  const suggestionIds = useMemo(() => registeredContextActionIds(routeId), [routeId])
  const commandIds = useMemo(() => {
    const merged = [...suggestionIds, ...prefs.menuActionIds]
    return merged.filter((id, index) => merged.indexOf(id) === index).slice(0, 12)
  }, [prefs.menuActionIds, suggestionIds])

  const actions = useMemo(() => [
    ...commandIds
      .map((id) => KATALOG_AKSI.find((action) => action.id === id))
      .filter((action): action is (typeof KATALOG_AKSI)[number] => Boolean(action))
      .map((action, index) => ({
        id: action.id,
        label: action.label,
        icon: action.ikon,
        primary: index === 0,
      })),
    { id: 'customize', label: 'Customize', icon: '⚙', primary: false },
  ], [commandIds])

  const pages = useMemo(() => {
    const result: typeof actions[] = []
    for (let index = 0; index < actions.length; index += SLOT_PER_HALAMAN) result.push(actions.slice(index, index + SLOT_PER_HALAMAN))
    return result
  }, [actions])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    bangunkan()
    longFired.current = false
    pointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      orbX: pos.x,
      orbY: pos.y,
      started: performance.now(),
      dragging: false,
    }
    try { orbRef.current?.setPointerCapture(event.pointerId) } catch { /* progresif */ }
    if (longTimer.current) window.clearTimeout(longTimer.current)
    longTimer.current = window.setTimeout(() => {
      const current = pointer.current
      if (!current || current.dragging) return
      longFired.current = true
      jalankanPemetaan(prefs.gestures.longPress)
    }, DEFAULT_GESTURE_THRESHOLDS.longPressMs)
  }, [bangunkan, jalankanPemetaan, pos.x, pos.y, prefs.gestures.longPress])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = pointer.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    const distance = Math.hypot(dx, dy)
    const elapsed = performance.now() - current.started
    if (distance > DEFAULT_GESTURE_THRESHOLDS.tapTolerancePx && longTimer.current) {
      window.clearTimeout(longTimer.current)
      longTimer.current = null
    }
    // Swipe cepat tetap menjadi aksi. Drag baru diambil setelah gerakan cukup
    // lama sehingga pengguna jelas sedang memindahkan orb, bukan menyapunya.
    if (!current.dragging && elapsed > 220 && distance > DEFAULT_GESTURE_THRESHOLDS.tapTolerancePx) {
      current.dragging = true
      setMenggeser(true)
      setBuka(false)
    }
    if (!current.dragging) return
    setPos(clampAssistivePosition({ x: current.orbX + dx, y: current.orbY + dy }, viewport(), prefs.size))
  }, [prefs.size])

  const finishDrag = useCallback(() => {
    setMenggeser(false)
    setPos((current) => {
      const next = prefs.snap ? snapAssistivePosition(current, viewport(), prefs.size) : clampAssistivePosition(current, viewport(), prefs.size)
      saveAssistivePosition(next)
      return next
    })
    bangunkan()
  }, [bangunkan, prefs.size, prefs.snap])

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (longTimer.current) {
      window.clearTimeout(longTimer.current)
      longTimer.current = null
    }
    const current = pointer.current
    pointer.current = null
    try { orbRef.current?.releasePointerCapture(event.pointerId) } catch { /* sudah lepas */ }
    if (!current) return
    if (current.dragging) {
      finishDrag()
      return
    }

    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    const decision = classifyReleasedGesture({
      dx,
      dy,
      elapsedMs: performance.now() - current.started,
      dragged: false,
      longPressed: longFired.current,
      cancelled: false,
    })
    if (decision === 'none') return
    if (decision.startsWith('swipe-')) {
      const map = {
        'swipe-up': prefs.gestures.swipeUp,
        'swipe-down': prefs.gestures.swipeDown,
        'swipe-left': prefs.gestures.swipeLeft,
        'swipe-right': prefs.gestures.swipeRight,
      } as const
      jalankanPemetaan(map[decision as keyof typeof map])
      return
    }

    const now = Date.now()
    if (now - lastTapAt.current <= DEFAULT_GESTURE_THRESHOLDS.doubleTapMs) {
      if (tapTimer.current) window.clearTimeout(tapTimer.current)
      tapTimer.current = null
      lastTapAt.current = 0
      jalankanPemetaan(prefs.gestures.doubleTap)
      return
    }
    lastTapAt.current = now
    if (tapTimer.current) window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      lastTapAt.current = 0
      jalankanPemetaan(prefs.gestures.singleTap)
    }, DEFAULT_GESTURE_THRESHOLDS.doubleTapMs)
  }, [finishDrag, jalankanPemetaan, prefs.gestures])

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (longTimer.current) window.clearTimeout(longTimer.current)
    longTimer.current = null
    pointer.current = null
    longFired.current = false
    setMenggeser(false)
    try { orbRef.current?.releasePointerCapture(event.pointerId) } catch { /* sudah lepas */ }
  }, [])

  const keAtas = pos.y > window.innerHeight / 2
  const keKiri = pos.x > window.innerWidth / 2

  if (sembunyikanDiBodyExplorer) return null

  return (
    <>
      {aturBuka && <PemilihAksiFab tutup={() => setAturBuka(false)} />}

      {buka && <div className="fixed inset-0 z-40 bg-black/20" onPointerDown={() => setBuka(false)} aria-hidden="true" />}

      <div className="fixed z-50" style={{ left: pos.x, top: pos.y }}>
        {buka && (
          <div
            role="menu"
            aria-label="Panacea Assistive Touch commands"
            data-panacea-assistive-orbit="true"
            className="absolute rounded-[28px] border border-white/10 bg-neutral-950/78 p-2 shadow-xl backdrop-blur-2xl backdrop-saturate-150"
            style={{ width: 224, [keAtas ? 'bottom' : 'top']: prefs.size + 8, [keKiri ? 'right' : 'left']: 0 } as React.CSSProperties}
          >
            <div className="mb-1 flex items-center justify-between gap-2 px-2 py-1">
              <span className="truncate text-[9px] font-black uppercase tracking-[.14em] text-neutral-400">Actions</span>
              <button type="button" onClick={() => { setBuka(false); setAturBuka(true) }} className="grid h-9 w-9 place-items-center rounded-full text-[14px] text-neutral-500 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:hover:bg-white/10" aria-label="Customize Assistive Touch">Edit</button>
            </div>

            <SlidableRail
              ref={railRef}
              ariaLabel="Assistive Touch command pages"
              mandatorySnap
              className="w-full"
              itemClassName="w-[208px]"
              onActiveIndexChange={setHalaman}
            >
              {pages.map((page, pageIndex) => (
                <div key={pageIndex} className="grid h-[192px] w-[208px] grid-cols-3 grid-rows-3 place-items-center">
                  {page.map((action, index) => (
                    <button
                      key={`${pageIndex}-${action.id}`}
                      type="button"
                      role="menuitem"
                      data-panacea-assistive-action={action.id}
                      onClick={() => action.id === 'customize' ? (setBuka(false), setAturBuka(true)) : jalankan(action.id)}
                      className={`flex h-[58px] w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${TATA[index]} ${action.primary ? 'bg-brand text-white' : 'text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10'}`}
                    >
                      <span aria-hidden className="text-[16px] leading-none">{action.icon}</span>
                      <span className="w-full truncate text-center text-[9.5px] font-bold leading-none">{action.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </SlidableRail>

            {pages.length > 1 && (
              <div className="mt-1 flex items-center justify-center gap-1.5">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Command page ${index + 1} of ${pages.length}`}
                    aria-current={index === halaman ? 'page' : undefined}
                    onClick={() => railRef.current?.scrollToIndex(index)}
                    className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${index === halaman ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-400/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button
          ref={orbRef}
          type="button"
          data-pmd-assistive="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(event) => event.preventDefault()}
          onFocus={bangunkan}
          aria-label="Panacea Assistive Touch"
          aria-haspopup="menu"
          aria-expanded={buka}
          className="kaca kaca-tekan grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2"
          style={{
            width: prefs.size,
            height: prefs.size,
            touchAction: 'none',
            cursor: menggeser ? 'grabbing' : 'grab',
            transition: menggeser || reducedMotion() ? 'none' : 'transform 0.2s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease',
            // Menyingkir hanya saat memang sedang tidak dipakai: menu yang
            // terbuka dan orb yang sedang digeser TIDAK boleh hilang di tengah
            // gerakan jari — itu membatalkan aksi yang sedang berlangsung.
            transform: buka ? 'scale(1.06)' : menyingkir ? 'scale(0.82)' : 'none',
            opacity: menyingkir ? 0 : redup && !buka && !menggeser ? prefs.idleOpacity : 1,
            pointerEvents: menyingkir ? 'none' : undefined,
          }}
        >
          <LogoMark size={Math.max(28, Math.round(prefs.size * 0.52))} />
        </button>
      </div>
    </>
  )
}

export default FabNavigasi
