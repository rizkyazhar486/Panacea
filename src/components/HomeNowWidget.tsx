import { Link } from 'react-router-dom'
import { HomeHealthInstruments } from './HomeHealthInstruments'
import { getVitals } from '../lib/healthVitals'

const ACTIONS = [
  { to: '/chatbot', title: 'Ask', glyph: '✦' },
  { to: '/body-explorer', title: 'Body 3D', glyph: '◎' },
  { to: '/harian', title: 'Log', glyph: '+' },
  { to: '/emergency', title: 'SOS', glyph: '!' },
] as const

export function HomeNowWidget() {
  const vitals = getVitals()
  return (
    <section data-ui="wearable-dashboard-v42" aria-label="Panacea live health workspace" className="space-y-3">
      <HomeHealthInstruments vitals={vitals} />

      <div className="grid grid-cols-4 gap-2" aria-label="Quick actions">
        {ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[16px] border border-brand bg-black px-2 text-center text-white transition hover:bg-brand hover:text-black active:scale-[.97] active:bg-brand active:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="text-[17px] font-black leading-none text-brand group-hover:text-black group-active:text-black" aria-hidden>{action.glyph}</span>
            <span className="text-[10px] font-black leading-none">{action.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeNowWidget
