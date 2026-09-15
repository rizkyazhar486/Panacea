import { NavLink } from 'react-router-dom'
import { useStore } from '../lib/store'

const ZONES = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/fitness-hub', label: 'Your Body' },
  { to: '/clinical-hub', label: 'Help & Services' },
  { to: '/settings', label: 'Settings' },
]

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

  return (
    <nav className="pan-zone-nav" aria-label="Panacea main zones" data-pan-surface>
      <div className="pan-zone-nav__scroll">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            end={zone.end}
            className={({ isActive }) => `pan-zone-nav__link${isActive ? ' is-active' : ''}`}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>
      {account && (
        <NavLink
          to="/profile"
          className="pan-zone-nav__profile"
          aria-label="Open profile"
          title={account.name}
        >
          {avatar ? <img src={avatar} alt="" /> : initials}
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
