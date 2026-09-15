import { NavLink } from 'react-router-dom'
import { useStore } from '../lib/store'
import { LogoMark } from './Logo'

const ZONES = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/fitness-hub', label: 'Body' },
  { to: '/clinical-hub', label: 'Care' },
  { to: '/settings', label: 'Settings' },
]

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

  return (
    <nav
      className="relative flex min-h-[58px] items-center gap-2 rounded-[20px] border border-white/[.085] bg-[#01040a]/88 px-2 py-1.5 shadow-[0_16px_46px_rgba(0,0,0,.25)] backdrop-blur-2xl sm:min-h-[64px] sm:gap-3 sm:rounded-[22px] sm:px-3"
      aria-label="Panacea main zones"
    >
      <NavLink
        to="/"
        className="flex h-11 shrink-0 items-center gap-2 rounded-[15px] px-1.5 text-white transition hover:bg-white/[.04] sm:px-2"
        aria-label="Panacea Home"
      >
        <LogoMark size={30} />
        <span className="hidden text-sm font-black tracking-[-.02em] sm:block" style={{ fontFamily: 'var(--font-wordmark)' }}>
          Panacea<span className="text-emerald-300">med</span><span className="text-cyan-300">.id</span>
        </span>
      </NavLink>

      <div className="h-7 w-px shrink-0 bg-white/[.08]" aria-hidden />

      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:justify-center sm:gap-2">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            end={zone.end}
            className={({ isActive }) => `grid h-11 min-w-[62px] shrink-0 place-items-center rounded-[14px] border px-3 text-[11px] font-black transition duration-200 active:scale-[.98] sm:min-w-[74px] sm:px-4 sm:text-xs ${
              isActive
                ? 'border-cyan-100/45 bg-gradient-to-r from-cyan-200 via-emerald-200 to-violet-200 text-[#01040a] shadow-[0_8px_26px_rgba(34,211,238,.12)]'
                : 'border-transparent bg-transparent text-white/60 hover:border-white/[.09] hover:bg-white/[.045] hover:text-white'
            }`}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>

      {account && (
        <NavLink
          to="/profile"
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-cyan-300/[.12] to-violet-400/[.12] text-[10px] font-black text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition hover:border-cyan-200/30 sm:text-xs"
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
