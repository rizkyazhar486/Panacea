import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import { LogoMark } from './Logo'

const ZONES = [
  { id: 'body', to: '/fitness-hub', label: 'Your Body' },
  { id: 'clinical', to: '/clinical-hub', label: 'Clinical' },
  { id: 'for-you', to: '/?space=for-you', label: 'For You' },
] as const

export function PanaceaZoneNav() {
  const { account, state } = useStore()
  const location = useLocation()
  const avatar = account ? state.profiles[account.email]?.avatar : undefined
  const initials = account?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
  const params = new URLSearchParams(location.search)

  const isZoneActive = (id: (typeof ZONES)[number]['id']) => {
    if (id === 'body') return location.pathname === '/fitness-hub' || location.pathname === '/tubuh' || location.pathname === '/latihan' || location.pathname === '/gizi'
    if (id === 'clinical') return location.pathname === '/clinical-hub' || location.pathname === '/body-explorer' || location.pathname === '/learn'
    return location.pathname === '/' && params.get('space') === 'for-you'
  }

  return (
    <nav
      className="relative flex min-h-[58px] items-center gap-2 rounded-[20px] border border-white/[.085] bg-[#01040a]/88 px-2 py-1.5 shadow-[0_16px_46px_rgba(0,0,0,.25)] backdrop-blur-2xl sm:min-h-[64px] sm:gap-3 sm:rounded-[22px] sm:px-3"
      aria-label="Panacea main zones"
    >
      <Link
        to="/"
        className="flex h-11 shrink-0 items-center gap-2 rounded-[15px] px-1.5 text-white transition hover:bg-white/[.04] sm:px-2"
        aria-label="Panacea Home"
      >
        <LogoMark size={30} />
        <span className="hidden text-sm font-black tracking-[-.02em] sm:block" style={{ fontFamily: 'var(--font-wordmark)' }}>
          Panacea<span className="text-emerald-300">med</span><span className="text-cyan-300">.id</span>
        </span>
      </Link>

      <div className="h-7 w-px shrink-0 bg-white/[.08]" aria-hidden />

      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:justify-center sm:gap-2">
        {ZONES.map((zone) => {
          const active = isZoneActive(zone.id)
          return (
            <Link
              key={zone.id}
              to={zone.to}
              aria-current={active ? 'page' : undefined}
              className={`grid h-11 min-w-[88px] shrink-0 place-items-center rounded-[14px] border px-3 text-[11px] font-black transition duration-200 active:scale-[.98] sm:min-w-[100px] sm:px-4 sm:text-xs ${
                active
                  ? 'border-cyan-100/45 bg-gradient-to-r from-cyan-200 via-emerald-200 to-violet-200 text-[#01040a] shadow-[0_8px_26px_rgba(34,211,238,.12)]'
                  : 'border-transparent bg-transparent text-white/60 hover:border-white/[.09] hover:bg-white/[.045] hover:text-white'
              }`}
            >
              {zone.label}
            </Link>
          )
        })}
      </div>

      {account && (
        <Link
          to="/?space=for-you&panel=account"
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-cyan-300/[.12] to-violet-400/[.12] text-[10px] font-black text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition hover:border-cyan-200/30 sm:text-xs"
          aria-label="Open account in For You"
          title={account.name}
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </Link>
      )}
    </nav>
  )
}

export default PanaceaZoneNav
