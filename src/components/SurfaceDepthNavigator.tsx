import { Link } from 'react-router-dom'
import { getSurfaceDepthContract, type PanaceaSurface } from '../lib/surfaceSemanticDepth'

type RouteMap = Readonly<Partial<Record<string, string>>>

export function SurfaceDepthNavigator({
  surface,
  activeStopId,
  routes,
  onSelect,
}: {
  surface: PanaceaSurface
  activeStopId?: string
  routes?: RouteMap
  onSelect?: (stopId: string) => void
}) {
  const contract = getSurfaceDepthContract(surface)

  return (
    <nav
      aria-label={`${surface} depth`}
      className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto border-y border-white/[.08] py-1.5"
      data-pmd-surface-depth={surface}
    >
      {contract.stops.map((stop, index) => {
        const active = stop.id === activeStopId
        const className = `flex min-h-[42px] shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-[10px] font-black transition ${
          active
            ? 'border-white/[.16] bg-white/[.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)]'
            : 'border-transparent text-white/42 hover:border-white/[.07] hover:bg-white/[.035] hover:text-white/78'
        }`
        const content = (
          <>
            <span className="hidden tabular-nums text-white/22 sm:inline">{String(index + 1).padStart(2, '0')}</span>
            <span className="whitespace-nowrap">{stop.label}</span>
          </>
        )

        const route = routes?.[stop.id]
        if (route) {
          return (
            <Link key={stop.id} to={route} className={className} title={stop.purpose} aria-current={active ? 'step' : undefined}>
              {content}
            </Link>
          )
        }

        if (onSelect) {
          return (
            <button
              key={stop.id}
              type="button"
              className={className}
              title={stop.purpose}
              aria-current={active ? 'step' : undefined}
              onClick={() => onSelect(stop.id)}
            >
              {content}
            </button>
          )
        }

        return (
          <span key={stop.id} className={className} title={stop.purpose} aria-current={active ? 'step' : undefined}>
            {content}
          </span>
        )
      })}
    </nav>
  )
}

export default SurfaceDepthNavigator
