import { Link, useLocation } from 'react-router-dom'
import { SlidableRail } from './SlidableRail'
import { IconDashboard, IconHeart, IconSparkle, IconStethoscope } from './icons'
import { KATALOG_AKSI } from '../lib/aksiFab'
import { registeredContextActionIds } from '../lib/interaction/assistive'

const PRIMARY = [
  { to: '/', label: 'Home', icon: IconDashboard, match: (path: string, search: string) => path === '/' && !search.includes('t=for-you') },
  { to: '/tubuh', label: 'Your Body', icon: IconHeart, match: (path: string) => /^\/(tubuh|fitness-hub|latihan|workout|recovery|nutrition|health-data)/.test(path) },
  { to: '/clinical-hub', label: 'Clinical', icon: IconStethoscope, match: (path: string) => /^\/(clinical-hub|med-study|clinical-calculators|drug-info|emr|evidence|radiology)/.test(path) },
  { to: '/?t=for-you', label: 'For You', icon: IconSparkle, match: (path: string, search: string) => search.includes('t=for-you') || /^\/(messages|community|profile|settings|scripture|keuangan)/.test(path) },
]

/**
 * Akselerator dua-langkah untuk empat permukaan utama dan tindakan yang relevan
 * dengan rute. Ini tidak mengganti sidebar/drawer; bila rail gagal dirender,
 * seluruh navigasi standar tetap tersedia.
 */
export function SuperPageActionRail() {
  const location = useLocation()
  if (location.pathname.startsWith('/body-explorer')) return null

  const routeIdentity = `${location.pathname}${location.search}`
  const contextual = registeredContextActionIds(routeIdentity)
    .map((id) => KATALOG_AKSI.find((action) => action.id === id))
    .filter((action): action is (typeof KATALOG_AKSI)[number] => Boolean(action?.ke && action.jenis === 'rute'))
    .filter((action) => !PRIMARY.some((item) => item.to === action.ke))
    .slice(0, 4)

  return (
    <nav className="kaca relative z-[9] border-x-0 border-t-0 px-3 py-2 lg:px-4" aria-label="Panacea super pages and contextual actions">
      <SlidableRail ariaLabel="Super pages and contextual actions" className="mx-auto max-w-6xl" itemClassName="w-auto">
        {PRIMARY.map((item) => {
          const active = item.match(location.pathname, location.search)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] min-w-[108px] items-center justify-center gap-2 rounded-2xl border px-3 text-[11px] font-black whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${active ? 'border-[var(--pmd-route-border,rgba(34,211,238,.35))] bg-[var(--pmd-route-soft,rgba(34,211,238,.10))] text-ink dark:text-white' : 'border-black/5 bg-white/55 text-neutral-500 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10'}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {contextual.map((action) => (
          <Link
            key={`context-${action.id}`}
            to={action.ke!}
            className="flex min-h-[48px] min-w-[96px] items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white/45 px-3 text-[11px] font-bold whitespace-nowrap text-neutral-500 transition hover:border-[var(--pmd-route-border,rgba(34,211,238,.30))] hover:bg-[var(--pmd-route-soft,rgba(34,211,238,.08))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
          >
            <span aria-hidden className="text-[15px] leading-none">{action.ikon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </SlidableRail>
    </nav>
  )
}

export default SuperPageActionRail
