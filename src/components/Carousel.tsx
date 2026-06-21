import { useRef, type ReactNode } from 'react'

// Horizontal content slider (Carousel) with scroll-snap + arrow controls.
// Used for browsing doctors / drugs / hospitals / pharmacies as cards.
export function Carousel({ children, itemClass = 'w-64' }: { children: ReactNode; itemClass?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (dx: number) => ref.current?.scrollBy({ left: dx, behavior: 'smooth' })
  return (
    <div className="relative">
      <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Each direct child becomes a snap item */}
        {Array.isArray(children)
          ? children.map((c, i) => <div key={i} className={`shrink-0 snap-start ${itemClass}`}>{c}</div>)
          : <div className={`shrink-0 snap-start ${itemClass}`}>{children}</div>}
      </div>
      <button onClick={() => scrollBy(-300)} className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white text-ink shadow-md hover:bg-neutral-50 sm:grid" aria-label="Sebelumnya">‹</button>
      <button onClick={() => scrollBy(300)} className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white text-ink shadow-md hover:bg-neutral-50 sm:grid" aria-label="Berikutnya">›</button>
    </div>
  )
}

// Segmented Button Group for sub-section filters (modern, compact).
export function ButtonGroup<T extends string>({ value, options, onChange }: {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${value === o.id ? 'bg-white text-brand-dark shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
