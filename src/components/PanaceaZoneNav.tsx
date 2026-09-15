import { NavLink } from 'react-router-dom'
import { useStore } from '../lib/store'

const ZONES = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/fitness-hub', label: 'Your Body' },
  { to: '/clinical-hub', label: 'Services' },
  { to: '/settings', label: 'Settings' },
]

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

  return (
    <nav className="flex items-center gap-1.5 rounded-[20px] border border-white/10 bg-black/15 p-1.5 backdrop-blur-xl sm:gap-2 sm:rounded-[24px] sm:p-2" aria-label="Panacea main zones">
      <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto sm:gap-2">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            end={zone.end}
            className={({ isActive }) => `grid min-h-[38px] shrink-0 place-items-center rounded-[14px] px-3 text-[11px] font-black transition active:scale-[.98] sm:min-h-[44px] sm:rounded-2xl sm:px-4 sm:text-xs ${isActive ? 'bg-brand text-white shadow-[0_7px_22px_rgba(0,191,99,.2)]' : 'bg-white/[.045] text-neutral-600 hover:bg-white/10 dark:text-neutral-300'}`}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>
      {account && (
        <NavLink to="/profile" className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-brand/15 text-[10px] font-black text-brand shadow-sm sm:h-11 sm:w-11 sm:text-xs" aria-label="Open profile" title={account.name}>
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
