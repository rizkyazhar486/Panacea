import { Link } from 'react-router-dom'

const ACTIONS = [
  {
    to: '/chatbot',
    eyebrow: 'AI',
    title: 'Ask Panacea',
    note: 'Open clinical intelligence',
    glyph: '✦',
  },
  {
    to: '/body-explorer',
    eyebrow: 'EXPLORE',
    title: 'Body 3D',
    note: 'Enter interactive anatomy',
    glyph: '◎',
  },
  {
    to: '/harian',
    eyebrow: 'LOG',
    title: 'Quick Log',
    note: 'Record today in one tap',
    glyph: '+',
  },
  {
    to: '/emergency',
    eyebrow: 'SOS',
    title: 'Emergency',
    note: 'Open emergency health card',
    glyph: '!',
  },
] as const

export function HomeNowWidget() {
  return (
    <section
      aria-labelledby="panacea-now-title"
      className="overflow-hidden rounded-[24px] border border-brand/20 bg-white shadow-[0_18px_55px_rgba(0,191,99,.10)] dark:bg-black"
    >
      <div className="flex items-center justify-between gap-3 border-b border-brand/15 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-brand">
            <span className="inline-block h-2 w-2 rounded-full bg-brand shadow-[0_0_0_4px_rgba(0,191,99,.12)]" aria-hidden />
            Live workspace
          </div>
          <h2 id="panacea-now-title" className="mt-1 text-[19px] font-black tracking-[-.03em] text-black dark:text-white sm:text-[22px]">
            Panacea Now
          </h2>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand/20 bg-brand/[.06] px-3.5 text-[11px] font-black text-black transition hover:bg-brand hover:text-white active:scale-[.98] dark:text-white"
          aria-label="Search Panacea"
        >
          <span className="text-base leading-none" aria-hidden>⌕</span>
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-brand/15 sm:grid-cols-4">
        {ACTIONS.map((action, index) => (
          <Link
            key={action.to}
            to={action.to}
            className="group min-h-[118px] bg-white p-4 outline-none transition hover:bg-brand/[.055] focus-visible:bg-brand/[.07] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:bg-black dark:hover:bg-brand/[.10]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[.17em] text-brand">{action.eyebrow}</span>
              <span
                aria-hidden
                className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black transition group-hover:scale-105 ${
                  index === 3
                    ? 'border-brand bg-brand text-white'
                    : 'border-brand/20 bg-brand/[.07] text-black dark:text-white'
                }`}
              >
                {action.glyph}
              </span>
            </div>
            <div className="mt-3 text-[15px] font-black tracking-[-.02em] text-black dark:text-white">{action.title}</div>
            <div className="mt-1 text-[10.5px] font-bold leading-snug text-black/70 dark:text-white/75">{action.note}</div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 bg-brand px-4 py-2.5 text-white sm:px-5">
        <span className="text-[10px] font-black uppercase tracking-[.14em]">Health OS · one-tap core actions</span>
        <Link to="/atur-fitur" className="shrink-0 text-[10px] font-black underline decoration-white/45 underline-offset-4 hover:decoration-white">
          Customize
        </Link>
      </div>
    </section>
  )
}

export default HomeNowWidget
