// Accordion generik untuk salindia informasi lebih dari satu baris/paragraf.
//
// Dipakai native <details>/<summary> dengan sengaja: tetap dapat dibuka/tutup
// tanpa JavaScript, tetap dapat diakses lewat keyboard dan pembaca layar tanpa
// atribut ARIA tambahan, dan tidak menambah state React untuk sesuatu yang
// platform sudah sediakan.
export function Accordion({
  title, children, defaultOpen = false, className = '',
}: { title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded-2xl border border-neutral-200/70 bg-neutral-50/70 dark:border-white/10 dark:bg-white/[.03] ${className}`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[11.5px] font-black text-neutral-600 dark:text-neutral-300 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180 dark:text-neutral-500" aria-hidden>⌄</span>
      </summary>
      <div className="space-y-1.5 px-3 pb-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {children}
      </div>
    </details>
  )
}
