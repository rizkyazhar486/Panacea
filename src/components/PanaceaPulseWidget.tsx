import { Link } from 'react-router-dom'

const actions = [
  { to: '/body-explorer', icon: '◉', label: 'Body Exposure', note: 'Explore anatomy', accent: 'from-emerald-400/25 to-cyan-400/10' },
  { to: '/chatbot', icon: '✦', label: 'Ask Panacea', note: 'Clinical intelligence', accent: 'from-cyan-400/20 to-blue-500/10' },
  { to: '/harian', icon: '+', label: 'Quick Log', note: 'Record today', accent: 'from-lime-400/20 to-emerald-500/10' },
  { to: '/emergency', icon: '!', label: 'Emergency', note: 'Open health card', accent: 'from-red-400/20 to-orange-500/10' },
] as const

export function PanaceaPulseWidget() {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-emerald-400/20 bg-[#04110c] p-3.5 shadow-[0_18px_55px_rgba(0,0,0,.3)] sm:p-4"
      aria-labelledby="panacea-pulse-title"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-300">Panacea Pulse · instant access</p>
          <h2 id="panacea-pulse-title" className="mt-1 text-[18px] font-black tracking-[-.02em] text-white sm:text-xl">What matters now.</h2>
          <p className="mt-1 max-w-xl text-[11px] font-semibold leading-relaxed text-emerald-50/70">Four high-value actions, one tap away.</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] border border-emerald-300/25 bg-emerald-300/10 text-base text-emerald-200" aria-hidden>✦</span>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`group min-h-[88px] rounded-[17px] border border-white/10 bg-gradient-to-br ${action.accent} p-3 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-emerald-300/10 active:scale-[.985]`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-white/10 bg-black/25 text-[14px] font-black text-emerald-200">{action.icon}</span>
              <span className="text-emerald-300/65 transition group-hover:translate-x-0.5" aria-hidden>→</span>
            </div>
            <div className="mt-2 text-[12px] font-black leading-tight text-white">{action.label}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-emerald-50/60">{action.note}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PanaceaPulseWidget
