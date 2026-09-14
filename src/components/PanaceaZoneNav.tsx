import { NavLink } from 'react-router-dom'

const ZONES = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/fitness-hub', label: 'Your Body' },
  { to: '/clinical-hub', label: 'Help & Services' },
  { to: '/tutorial', label: 'Settings' },
]

export function PanaceaZoneNav() {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto rounded-[24px] border border-white/10 bg-black/20 p-2 backdrop-blur-xl" aria-label="Panacea main zones">
      {ZONES.map((zone) => (
        <NavLink
          key={zone.to}
          to={zone.to}
          end={zone.end}
          className={({ isActive }) => `min-h-[44px] shrink-0 rounded-2xl px-4 py-3 text-xs font-black transition ${isActive ? 'bg-brand text-white shadow-[0_8px_24px_rgba(0,191,99,.2)]' : 'bg-white/5 text-neutral-600 hover:bg-white/10 dark:text-neutral-300'}`}
        >
          {zone.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default PanaceaZoneNav
