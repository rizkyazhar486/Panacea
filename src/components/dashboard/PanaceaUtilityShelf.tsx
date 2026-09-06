import { UbinQuickCapture, UbinWeeklyWins } from './PanaceaGrowthWidgets'

export function PanaceaUtilityShelf() {
  return (
    <details className="group rounded-[26px] border border-neutral-200 bg-white/85 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">More life widgets</div>
          <div className="mt-1 truncate text-[14px] font-black text-neutral-950 dark:text-white">Weekly wins · Quick capture</div>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
      </summary>
      <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-2.5 overflow-x-auto border-t border-neutral-100 px-1 pt-3 dark:border-white/10">
        <div className="w-[286px] shrink-0 snap-start"><UbinWeeklyWins /></div>
        <div className="w-[286px] shrink-0 snap-start"><UbinQuickCapture /></div>
      </div>
    </details>
  )
}

export default PanaceaUtilityShelf
