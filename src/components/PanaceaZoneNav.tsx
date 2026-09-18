import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import { LogoMark } from './Logo'
import '../styles/superpage-cohesion-v1.css'

const ZONES = [
  { to: '/fitness-hub', label: 'Your Body', queryAware: false },
  { to: '/clinical-hub', label: 'Clinical', queryAware: false },
  { to: '/?t=for-you', label: 'For You', queryAware: true },
] as const

const activeClass = 'border-cyan-100/45 bg-gradient-to-r from-cyan-200 via-emerald-200 to-violet-200 text-[#01040a] shadow-[0_8px_26px_rgba(34,211,238,.12)]'
const idleClass = 'border-transparent bg-transparent text-white/58 hover:border-white/[.09] hover:bg-white/[.045] hover:text-white'

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const location = useLocation()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
  const forYouActive = location.pathname === '/' && new URLSearchParams(location.search).get('t') === 'for-you'

  return (
    <nav className="relative flex min-h-[52px] items-center gap-1.5 rounded-[18px] border border-white/[.08] bg-[#01040a]/90 px-1.5 py-1 shadow-[0_12px_36px_rgba(0,0,0,.22)] backdrop-blur-xl sm:min-h-[56px] sm:gap-2 sm:px-2" aria-label="Panacea super pages">
      <NavLink to="/" end className="flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] px-1 text-white transition hover:bg-white/[.04] active:scale-[.98] sm:px-1.5" aria-label="Panacea Home">
        <LogoMark size={27} />
        <span className="hidden text-[13px] font-black tracking-[-.02em] md:block" style={{ fontFamily: 'var(--font-wordmark)' }}>Panacea<span className="text-emerald-300">med</span><span className="text-cyan-300">.id</span></span>
      </NavLink>

      <div className="h-6 w-px shrink-0 bg-white/[.07]" aria-hidden />

      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:justify-center sm:gap-1.5">
        {ZONES.map((zone) => (
          <NavLink
            key={zone.to}
            to={zone.to}
            className={({ isActive }) => {
              const selected = zone.queryAware ? forYouActive : isActive
              return `grid h-11 min-w-[74px] shrink-0 place-items-center rounded-[13px] border px-2.5 text-[10px] font-black transition duration-200 active:scale-[.98] sm:min-w-[92px] sm:px-3 sm:text-[11px] ${selected ? activeClass : idleClass}`
            }}
          >
            {zone.label}
          </NavLink>
        ))}
      </div>

      {account && (
        <NavLink to="/profile" className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-white/[.08] bg-white/[.035] text-[10px] font-black text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] transition hover:border-cyan-200/25 active:scale-[.98] sm:text-[11px]" aria-label="Open profile" title={account.name}>
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </NavLink>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
