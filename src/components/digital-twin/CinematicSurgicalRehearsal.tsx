import { SurgicalRehearsalLab } from './SurgicalRehearsalLab'

export function CinematicSurgicalRehearsal() {
  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Surgical rehearsal · active recall</div>
        <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Practice the operation after reviewing the HRA source anatomy above.</h2>
        <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The rehearsal no longer opens a second generated body renderer. Anatomy orientation comes from the operation-specific HuBMAP HRA GLB workbench above; this section is reserved for recall, risk-map review, comparison and curriculum coverage.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Source anatomy above', 'Active recall', 'Risk map', 'Operation compare', 'Local progress'].map((item) => <span key={item} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[9px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">{item}</span>)}
        </div>
      </section>
      <SurgicalRehearsalLab />
    </div>
  )
}

export default CinematicSurgicalRehearsal
