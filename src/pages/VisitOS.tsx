import { Link } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { VisitCommandCenter } from '../components/VisitCommandCenter'

export function VisitOS() {
  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-20 text-white">
      <PanaceaZoneNav />
      <VisitCommandCenter />
      <nav aria-label="Visit OS related clinical tools" className="flex gap-5 overflow-x-auto border-y border-white/10 py-1 no-scrollbar">
        {[
          ['/emr', 'AI-EMR'],
          ['/body-explorer', 'Body Exposure'],
          ['/health-data', 'Device data'],
          ['/consult', 'Consultations'],
          ['/planning', 'Plan'],
        ].map(([to, label]) => (
          <Link key={to} to={to} className="flex min-h-12 shrink-0 items-center gap-2 text-xs font-black text-white/55 transition hover:text-white">
            {label}<span aria-hidden>→</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default VisitOS
