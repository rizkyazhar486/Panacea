import { CinematicCellGenomeExplorer } from './CinematicCellGenomeExplorer'
import { DigitalTwinEngine } from './DigitalTwinEngine'

export function BodyToCellCinematic() {
  return (
    <div className="space-y-4">
      <CinematicCellGenomeExplorer initialStage="cell" compact />

      <details className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#061019]" open>
        <summary className="cursor-pointer list-none p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600 dark:text-emerald-300">Multi-scale evidence engine</div>
              <div className="mt-1 text-sm font-black text-ink dark:text-white">Whole body → organ → tissue → cell → pathway</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">The cinematic cellular scene above is the structural visualization layer. The engine below keeps educational anatomy, patient-derived evidence and clinical inference separated.</p>
            </div>
            <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10">Evidence & controls ↓</span>
          </div>
        </summary>
        <div className="border-t border-neutral-200 p-3 dark:border-white/10">
          <DigitalTwinEngine />
        </div>
      </details>
    </div>
  )
}

export default BodyToCellCinematic
