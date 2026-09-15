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
    <nav
      className="flex items-center gap-1.5 rounded-[18px] border border-brand/15 bg-white/[.92] p-1.5 shadow-[0_10px_30px_rgba(15,23,42,.05)] backdrop-blur-xl dark:bg-black/[.72] dark:shadow-[0_12px_34px_rgba(0,0,0,.22)] sm:gap-2 sm:rounded-[22px] sm:p-2"
      aria-label="Panacea main zones"
    >
      <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto sm:gap-1.5">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            end={zone.end}
            className={({ isActive }) => `grid min-h-[40px] shrink-0 place-items-center rounded-[13px] border px-3 text-[11px] font-black transition active:scale-[.98] sm:min-h-[44px] sm:rounded-[15px] sm:px-4 sm:text-xs ${
              isActive
                ? 'border-brand bg-brand text-white shadow-[0_7px_20px_rgba(0,191,99,.22)]'
                : 'border-transparent bg-transparent text-neutral-700 hover:border-brand/15 hover:bg-brand/[.055] hover:text-brand dark:text-neutral-200 dark:hover:bg-brand/[.08]'
            }`}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>
      {account && (
        <NavLink
          to="/profile"
          className="grid h-[40px] w-[40px] shrink-0 place-items-center overflow-hidden rounded-full border border-brand/20 bg-brand/[.08] text-[10px] font-black text-brand shadow-sm transition hover:bg-brand/[.14] sm:h-11 sm:w-11 sm:text-xs"
          aria-label="Open profile"
          title={account.name}
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
