import { Link } from 'react-router-dom'
import { matchingSourceExperiences } from '../lib/sourceExperienceShortcuts'

export function SourceExperienceShortcuts({ query }: { query: string }) {
  const visible = matchingSourceExperiences(query)
  if (visible.length === 0) return null

  return (
    <section className="mb-4" aria-labelledby="source-experiences-heading">
      <div id="source-experiences-heading" className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
        Tools and scientific experiences
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((item) => (
          <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[.04]">
            <div className="text-sm font-black text-neutral-900 dark:text-white">{item.title}</div>
            <div className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{item.status}</div>
            <div className="mt-1 text-[11px] text-neutral-500">{item.location}</div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item.boundary}</p>
            <Link to={item.route} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-neutral-950 px-4 text-xs font-black text-white dark:bg-white dark:text-neutral-950">
              Open
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SourceExperienceShortcuts
