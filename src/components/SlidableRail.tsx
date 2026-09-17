import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { clampScrollTarget, edgeState, nextIndex, scrollBehavior } from '../lib/interaction/slidable'

export interface SlidableRailProps {
  ariaLabel: string
  children: ReactNode
  mandatorySnap?: boolean
  className?: string
  itemClassName?: string
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  startScrollLeft: number
  active: boolean
}

const INTERACTIVE = 'a[href],button,input,select,textarea,[role="button"],[contenteditable="true"]'
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function motionReduced(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem('pmd-reduced-motion') === 'true') return true
  } catch { /* presentation preference only */ }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function SlidableRail({ ariaLabel, children, mandatorySnap = false, className = '', itemClassName = '' }: SlidableRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(motionReduced)

  const refreshEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const next = edgeState(rail.scrollLeft, rail.clientWidth, rail.scrollWidth)
    setCanLeft(next.canLeft)
    setCanRight(next.canRight)
  }, [])

  useEffect(() => {
    refreshEdges()
    const rail = railRef.current
    if (!rail) return
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refreshEdges) : null
    observer?.observe(rail)
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onMotion = () => setReducedMotion(motionReduced())
    media?.addEventListener?.('change', onMotion)
    window.addEventListener('storage', onMotion)
    return () => {
      observer?.disconnect()
      media?.removeEventListener?.('change', onMotion)
      window.removeEventListener('storage', onMotion)
    }
  }, [refreshEdges])

  const items = useCallback(() => {
    const rail = railRef.current
    if (!rail) return [] as HTMLElement[]
    return Array.from(rail.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-slidable-item'))
  }, [])

  const revealItem = useCallback((item: HTMLElement) => {
    item.scrollIntoView({ behavior: scrollBehavior(reducedMotion), block: 'nearest', inline: 'nearest' })
  }, [reducedMotion])

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const target = event.target as HTMLElement
    if (target.matches('input,select,textarea,[contenteditable="true"]')) return
    const all = items()
    if (!all.length) return
    const currentItem = target.closest('[data-slidable-item]') as HTMLElement | null
    const current = Math.max(0, currentItem ? all.indexOf(currentItem) : 0)
    let index = current
    if (event.key === 'Home') index = 0
    else if (event.key === 'End') index = all.length - 1
    else index = nextIndex(current, all.length, event.key === 'ArrowRight' ? 'right' : 'left')
    if (index < 0) return
    const next = all[index]
    const focusTarget = next.querySelector<HTMLElement>(FOCUSABLE) ?? next
    event.preventDefault()
    focusTarget.focus({ preventScroll: true })
    revealItem(next)
  }, [items, revealItem])

  const resetDrag = useCallback((event?: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    const current = drag.current
    if (rail && current && event && rail.hasPointerCapture?.(event.pointerId)) {
      try { rail.releasePointerCapture(event.pointerId) } catch { /* capture may already be released */ }
    }
    drag.current = null
    setDragging(false)
    refreshEdges()
  }, [refreshEdges])

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest(INTERACTIVE)) return
    const rail = railRef.current
    if (!rail) return
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: rail.scrollLeft,
      active: false,
    }
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    const current = drag.current
    if (!rail || !current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.active) {
      if (Math.hypot(dx, dy) <= 10) return
      if (Math.abs(dx) <= Math.abs(dy)) {
        drag.current = null
        return
      }
      current.active = true
      setDragging(true)
      try { rail.setPointerCapture(event.pointerId) } catch { /* capture is a progressive enhancement */ }
    }
    event.preventDefault()
    rail.scrollLeft = clampScrollTarget(current.startScrollLeft - dx, rail.clientWidth, rail.scrollWidth)
    refreshEdges()
  }, [refreshEdges])

  const snapClass = mandatorySnap ? 'snap-x snap-mandatory' : 'snap-x snap-proximity'
  const style = { WebkitOverflowScrolling: 'touch' } as CSSProperties

  return (
    <div className={`relative min-w-0 ${className}`} data-can-left={canLeft} data-can-right={canRight} data-dragging={dragging}>
      <div
        ref={railRef}
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
        className={`pmd-slidable-rail flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain ${snapClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        style={style}
        onScroll={refreshEdges}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={resetDrag}
        onPointerCancel={resetDrag}
        data-reduced-motion={reducedMotion}
      >
        {Children.map(children, (child, index) => (
          <div data-slidable-item data-index={index} tabIndex={-1} className={`min-w-0 shrink-0 snap-start ${itemClassName}`}>
            {child}
          </div>
        ))}
      </div>
      <span aria-hidden className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/20 to-transparent transition-opacity ${canLeft ? 'opacity-100' : 'opacity-0'}`} />
      <span aria-hidden className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/20 to-transparent transition-opacity ${canRight ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

export default SlidableRail
