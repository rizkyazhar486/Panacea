import { Link } from 'react-router-dom'

type QuickAction = {
  to: string
  eyebrow: string
  label: string
  description: string
  urgent?: boolean
}

const ACTIONS: QuickAction[] = [
  {
    to: '/learn?t=body',
    eyebrow: 'Explore',
    label: 'Body Exposure',
    description: 'Open the visual human-body workspace.',
  },
  {
    to: '/clinical-hub?t=assistant',
    eyebrow: 'Ask',
    label: 'Panacea Assistant',
    description: 'Start from a health question or concern.',
  },
  {
    to: '/learn?t=cases',
    eyebrow: 'Practice',
    label: 'Cases & OSCE',
    description: 'Jump directly into case-based learning.',
  },
  {
    to: '/clinical-hub?t=emergency',
    eyebrow: 'Urgent',
    label: 'Emergency',
    description: 'Open emergency guidance and care routes.',
    urgent: true,
  },
]

export function PanaceaQuickActions() {
  return (
    <section aria-label="Quick actions" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className={`group min-w-0 rounded-[18px] border p-3 transition duration-200 hover:-translate-y-0.5 sm:p-3.5 ${
            action.urgent
              ? 'border-rose-400/20 bg-rose-500/[.06] hover:border-rose-400/35 hover:bg-rose-500/[.09]'
              : 'border-white/[.08] bg-white/[.035] hover:border-brand/30 hover:bg-brand/[.06]'
          }`}
        >
          <div className={`text-[8px] font-black uppercase tracking-[.2em] ${action.urgent ? 'text-rose-300' : 'text-brand'}`}>{action.eyebrow}</div>
          <div className="mt-1 truncate text-xs font-black text-white sm:text-sm">{action.label}</div>
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-neutral-500 transition group-hover:text-neutral-300 sm:text-[11px]">{action.description}</p>
        </Link>
      ))}
    </section>
  )
}

export default PanaceaQuickActions
