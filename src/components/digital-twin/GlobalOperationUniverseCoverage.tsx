import { useMemo } from 'react'
import { ALL_SURGICAL_PROCEDURES } from '../../lib/surgicalAtlasCatalog'
import { getGlobalOperationUniverseStats } from '../../lib/globalOperationUniverse'

export function GlobalOperationUniverseCoverage() {
  const stats = useMemo(() => getGlobalOperationUniverseStats(ALL_SURGICAL_PROCEDURES), [])

  return (
    <section className="border-t border-white/8 bg-[#040a12] p-5 sm:p-6" aria-label="Global operation universe coverage">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f0d68a]">Global operation universe</div>
          <h3 className="mt-1 text-xl font-black tracking-[-.03em] text-white">Coverage ledger: detailed where mature, explicit where still missing.</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-white/38">The universe is organized by procedure families so Panacea can keep expanding without pretending every operation already has validated detailed anatomy. Each detailed procedure still uses the same simulation kernel.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            [stats.domains, 'domains'],
            [stats.representativeProcedures, 'procedure families'],
            [stats.detailedProcedures, 'detailed now'],
          ].map(([value, label]) => (
            <div key={String(label)} className="rounded-2xl border border-white/8 bg-white/[.025] px-3 py-2 text-center">
              <div className="text-lg font-black text-[#f0d68a]">{value}</div>
              <div className="text-[7px] font-black uppercase tracking-wide text-white/25">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.byDomain.map((domain) => (
          <details key={domain.id} className="rounded-2xl border border-white/8 bg-white/[.02] p-3">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black text-white/65">{domain.label}</div>
                <span className={`rounded-full px-2 py-1 text-[8px] font-black ${domain.detailedProcedures ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-200/10 text-amber-100'}`}>{domain.detailedProcedures} detailed</span>
              </div>
              <div className="mt-1 text-[8px] text-white/25">{domain.representativeProcedures.length} representative families</div>
            </summary>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {domain.representativeProcedures.map((name) => <span key={name} className="rounded-full border border-white/8 px-2 py-1 text-[8px] text-white/35">{name}</span>)}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4 text-[9px] leading-relaxed text-white/28">
        <strong className="text-white/45">Interoperability direction:</strong> detailed records can carry a validated WHO ICHI Target–Action–Means identity when sourced; the simulator never invents codes or claims universal catalog completeness from representative families alone.
      </div>
    </section>
  )
}
