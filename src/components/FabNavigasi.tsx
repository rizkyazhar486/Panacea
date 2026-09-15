import { NavLink, useLocation } from 'react-router-dom'
import '../styles/panacea-system.css'

/** Kept for Shell API compatibility while the visual navigation is simplified. */
export interface TujuanFab {
  to: string
  label: string
  ikon: React.ReactNode
  end?: boolean
}

type Props = {
  tujuan: TujuanFab[]
  onTambah?: () => void
  onCari?: () => void
}

const DOCK = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/body-explorer', label: 'Body', icon: '◎' },
  { to: '/chatbot', label: 'Ask', icon: '✦', primary: true },
  { to: '/latihan', label: 'Train', icon: '↗' },
  { to: '/semua-fitur', label: 'More', icon: '•••' },
] as const

/**
 * Five stable destinations replace the draggable radial command menu.
 * Search, the drawer, and All Features still expose the wider product; this
 * changes information architecture, not capability.
 *
 * Body Explorer is an immersive canvas with its own controls, so the dock
 * yields the screen there instead of covering anatomy.
 */
export function FabNavigasi(props: Props) {
  const location = useLocation()
  void props

  if (location.pathname.startsWith('/body-explorer')) return null

  return (
    <nav className="p-mobile-dock lg:hidden" aria-label="Primary navigation">
      {DOCK.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : undefined}
          aria-label={item.label}
          className={`p-dock-item ${'primary' in item && item.primary ? 'p-dock-primary' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
              {isActive ? <span className="sr-only">Current page</span> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
