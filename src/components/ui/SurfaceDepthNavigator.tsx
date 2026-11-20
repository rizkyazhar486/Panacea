import { Link } from 'react-router-dom'
import { getSurfaceDepthContract, type PanaceaSurface } from '../../lib/surfaceSemanticDepth'

type RouteMap = Readonly<Partial<Record<string, string>>>

function DepthStopLogo({ index }: { index: number }) {
  const kind = index % 5
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 0 && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </>
      )}
      {kind === 1 && <path d="M3 12h4l2.5-6 4 12 3-8 2 2h2.5" />}
      {kind === 2 && (
        <>
          <polygon points="12,3.5 20,8 12,12.5 4,8" />
          <path d="m4 13 8 4.5 8-4.5" />
        </>
      )}
      {kind === 3 && (
        <>
          <path d="M4 19h16" />
          <rect x="6" y="10" width="3" height="7" rx="1" />
          <rect x="11" y="6" width="3" height="11" rx="1" />
          <rect x="16" y="4" width="3" height="13" rx="1" />
        </>
      )}
      {kind === 4 && <path d="M12 3 19 6v5.4c0 4.5-3 8.2-7 9.6-4-1.4-7-5.1-7-9.6V6l7-3Z" />}
    </svg>
  )
}

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
            <DepthStopLogo index={index} />
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
