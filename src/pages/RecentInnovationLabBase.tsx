import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import {
  RECENT_HEALTH_INNOVATIONS,
  innovationReadinessPercent,
  type InnovationDomain,
  type InnovationStatus,
} from '../lib/recentHealthInnovations'

const DOMAIN_LABELS: Record<InnovationDomain, string> = {
  'personal-experiments': 'Personal experiments',
  'clinical-research': 'Clinical research',
  'precision-pharmacology': 'Precision pharmacology',
  genomics: 'Genomics',
  'real-world-evidence': 'Real-world evidence',
  'digital-biomarkers': 'Digital biomarkers',
  'ai-governance': 'AI governance',
  'patient-reported-data': 'Patient-reported data',
}

const STATUS_LABELS: Record<InnovationStatus, string> = {
  'integration-ready': 'Integration ready',
  'external-adapter': 'Needs external adapter',
  'research-only': 'Research only',
}

function statusClass(status: InnovationStatus): string {
  if (status === 'integration-ready') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (status === 'external-adapter') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
}

export function RecentInnovationLab() {
  const [domain, setDomain] = useState<InnovationDomain | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>('n-of-1-studio')

  const features = useMemo(
    () => RECENT_HEALTH_INNOVATIONS.filter((feature) => domain === 'all' || feature.domain === domain),
    [domain],
  )

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle
          title="2020–2026 Innovation Gap Lab"
          subtitle="Eight high-value capabilities prepared as execution contracts — not claims that external clinical services are already connected."
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setDomain('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${domain === 'all' ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}
          >
            All
          </button>
          {(Object.keys(DOMAIN_LABELS) as InnovationDomain[]).map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setDomain(key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${domain === key ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}
            >
              {DOMAIN_LABELS[key]}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((feature) => {
          const open = openId === feature.id
          const readiness = innovationReadinessPercent(feature)
          return (
            <Card key={feature.id} className="!p-4">
              <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : feature.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                      {DOMAIN_LABELS[feature.domain]} · {feature.period}
                    </div>
                    <div className="mt-1 text-base font-black text-ink dark:text-white">{feature.label}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(feature.status)}`}>
                    {STATUS_LABELS[feature.status]}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">{feature.whyUseful}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] font-bold text-neutral-400">
                    <span>Implementation readiness</span>
                    <span>{readiness}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${readiness}%` }} />
                  </div>
                </div>
              </button>

              {open && (
                <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 text-xs dark:border-white/10">
                  <div>
                    <div className="font-black uppercase tracking-wide text-neutral-400">Mission</div>
                    <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-300">{feature.mission}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="font-black uppercase tracking-wide text-neutral-400">Inputs</div>
                      <ul className="mt-1 space-y-1 text-neutral-600 dark:text-neutral-300">
                        {feature.inputs.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-black uppercase tracking-wide text-neutral-400">Outputs</div>
                      <ul className="mt-1 space-y-1 text-neutral-600 dark:text-neutral-300">
                        {feature.outputs.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <div className="font-black uppercase tracking-wide text-neutral-400">Panacea integrations</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {feature.integrations.map((item) => (
                        <span key={item} className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                    <div className="font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Visual target</div>
                    <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-300">{feature.visualTarget}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                    <div className="font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Human gate · {feature.humanGate}</div>
                    <p className="mt-1 leading-relaxed text-neutral-600 dark:text-neutral-300">{feature.safetyBoundary}</p>
                  </div>
                  <div>
                    <div className="font-black uppercase tracking-wide text-neutral-400">Evidence anchors</div>
                    <ul className="mt-1 space-y-1 text-neutral-500">
                      {feature.evidenceAnchors.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default RecentInnovationLab
