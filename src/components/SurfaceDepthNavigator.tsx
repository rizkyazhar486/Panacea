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
      className="no-scrollbar flex gap-5 overflow-x-auto border-y border-white/10 py-1"
      data-pmd-surface-depth={surface}
    >
      {contract.stops.map((stop, index) => {
        const active = stop.id === activeStopId
        const className = `flex min-h-[46px] shrink-0 items-center gap-2 border-b text-[10px] font-black uppercase tracking-[.12em] transition ${
          active ? 'border-white text-white' : 'border-transparent text-white/38 hover:text-white/72'
        }`
        const content = (
          <>
            <span className="text-white/22">{String(index + 1).padStart(2, '0')}</span>
            <span>{stop.label}</span>
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
