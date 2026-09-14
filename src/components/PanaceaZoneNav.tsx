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
    <nav className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-black/20 p-2 backdrop-blur-xl" aria-label="Panacea main zones">
      <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
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
      </div>
      {account && (
        <NavLink to="/profile" className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-brand/15 text-xs font-black text-brand shadow-sm" aria-label="Open profile" title={account.name}>
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
