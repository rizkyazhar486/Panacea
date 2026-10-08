import { useLayoutEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { OneShape } from './OneShape'
import { hitungScrollAgarTerlihat } from '../lib/railViewport'
import '../styles/superpage-cohesion-v1.css'

const ZONES = [
  { to: '/fitness-hub', label: 'Your Body', queryAware: false },
  { to: '/clinical-hub', label: 'Clinical', queryAware: false },
  { to: '/?t=for-you', label: 'For You', queryAware: true },
] as const

// Latar zona aktif adalah satu bentuk bersama (OneShape) yang meluncur antar zona.
const activeClass = 'border-transparent text-neutral-950 dark:text-neutral-950'
const idleClass = 'border-transparent bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-black/[.04] dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[.045]'

export function PanaceaZoneNav() {
  const location = useLocation()
  const forYouActive = location.pathname === '/' && new URLSearchParams(location.search).get('t') === 'for-you'
  const railRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const rail = railRef.current
    const active = rail?.querySelector<HTMLElement>('[data-panacea-zone-active="true"]')
    if (!rail || !active) return
    const railBox = rail.getBoundingClientRect()
    const itemBox = active.getBoundingClientRect()
    const next = hitungScrollAgarTerlihat({
      viewportWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      itemLeft: rail.scrollLeft + itemBox.left - railBox.left,
      itemWidth: itemBox.width,
      currentScrollLeft: rail.scrollLeft,
    })
    if (Math.abs(next - rail.scrollLeft) > 1) rail.scrollLeft = next
  }, [location.pathname, location.search])

  return (
    <nav
      className="relative mx-auto flex min-h-[52px] max-w-fit items-center justify-center rounded-[20px] border border-black/5 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/[.08] dark:bg-[#01040a]/90 dark:shadow-[0_12px_36px_rgba(0,0,0,.22)] sm:min-h-[56px]"
      aria-label="Panacea super pages"
    >
      <div
        ref={railRef}
        data-one-shape="explicit"
        data-panacea-zone-rail="v1"
        className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto sm:justify-center sm:gap-1.5"
      >
        <OneShape />
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            data-one-shape-active={String(zone.queryAware ? forYouActive : location.pathname === zone.to)}
            data-panacea-zone-active={String(zone.queryAware ? forYouActive : location.pathname === zone.to)}
            className={({ isActive }) => {
              const selected = zone.queryAware ? forYouActive : isActive
              return `grid h-11 min-w-[74px] shrink-0 place-items-center rounded-[14px] border px-3 text-[11px] font-bold transition duration-200 active:scale-[.98] sm:min-w-[92px] sm:px-3.5 sm:text-[12px] ${selected ? activeClass : idleClass}`
            }}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default PanaceaZoneNav
