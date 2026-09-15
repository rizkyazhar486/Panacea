import { NavLink } from 'react-router-dom'
import { useStore } from '../lib/store'

const ZONES = [
  { to: '/', label: 'Home', compact: 'Home', end: true },
  { to: '/learn', label: 'Learn', compact: 'Learn' },
  { to: '/fitness-hub', label: 'Your Body', compact: 'Body' },
  { to: '/clinical-hub', label: 'Help & Services', compact: 'Care' },
  { to: '/settings', label: 'Settings', compact: 'Settings' },
]

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

  return (
    <nav
      className="sticky top-2 z-40 flex min-w-0 items-center gap-1.5 rounded-[22px] border border-white/10 bg-neutral-950/80 p-1.5 shadow-[0_16px_60px_rgba(0,0,0,.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-neutral-950/65 sm:gap-2 sm:p-2"
      aria-label="Panacea main zones"
    >
      <div className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain sm:gap-2">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            end={zone.end}
            className={({ isActive }) => `group min-h-[42px] shrink-0 snap-start rounded-[16px] border px-3 py-2.5 text-[11px] font-black transition duration-200 sm:min-h-[44px] sm:px-4 sm:text-xs ${isActive ? 'border-brand/70 bg-brand text-white shadow-[0_8px_24px_rgba(0,191,99,.22)]' : 'border-transparent bg-white/[.045] text-neutral-300 hover:border-white/10 hover:bg-white/[.08] hover:text-white'}`}
          >
            <span className="sm:hidden">{zone.compact}</span>
            <span className="hidden sm:inline">{zone.label}</span>
          </NavLink>
        ))}
      </div>

      <NavLink
        to="/clinical-hub?t=emergency"
        className="grid h-11 min-w-11 shrink-0 place-items-center rounded-[16px] border border-rose-400/20 bg-rose-500/[.08] px-2 text-[9px] font-black uppercase tracking-[.08em] text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/[.14] hover:text-white sm:px-3 sm:text-[10px]"
        aria-label="Open emergency information"
        title="Emergency"
      >
        SOS
      </NavLink>

      {account && (
        <NavLink
          to="/profile"
          className="group flex h-11 shrink-0 items-center gap-2 rounded-[16px] border border-white/10 bg-white/[.045] p-1 transition hover:border-brand/35 hover:bg-brand/10"
          aria-label="Open profile"
          title={account.name}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-brand/15 text-[11px] font-black text-brand ring-1 ring-inset ring-brand/20">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </span>
          <span className="hidden max-w-28 truncate pr-2 text-[11px] font-black text-neutral-300 lg:block">{account.name}</span>
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
