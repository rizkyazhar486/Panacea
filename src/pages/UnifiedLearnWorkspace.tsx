import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'

const BodyExplorer = lazy(() => import('./BodyExplorer').then((m) => ({ default: m.BodyExplorer })))
const FrontierHealthOS = lazy(() => import('./FrontierHealthOS').then((m) => ({ default: m.FrontierHealthOS })))
const RecentInnovationLab = lazy(() => import('./RecentInnovationLab').then((m) => ({ default: m.RecentInnovationLab })))
const AtomicSystemsLab = lazy(() => import('./bodyhub/AtomicSystemsLab').then((m) => ({ default: m.AtomicSystemsLab })))
const Radiology = lazy(() => import('./Radiology').then((m) => ({ default: m.Radiology })))
const Electrophysiology = lazy(() => import('./Electrophysiology').then((m) => ({ default: m.Electrophysiology })))
const GenomeLab = lazy(() => import('./GenomeLab').then((m) => ({ default: m.GenomeLab })))
const KnowledgeBridge = lazy(() => import('./KnowledgeBridge').then((m) => ({ default: m.KnowledgeBridge })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const ClinicalEvidence = lazy(() => import('./ClinicalEvidence').then((m) => ({ default: m.ClinicalEvidence })))
const DrugInfo = lazy(() => import('./DrugInfo').then((m) => ({ default: m.DrugInfo })))
const ClinicalCalculators = lazy(() => import('./ClinicalCalculators').then((m) => ({ default: m.ClinicalCalculators })))

type LearnTab =
  | 'body'
  | 'discovery'
  | 'innovation'
  | 'invention'
  | 'radiology'
  | 'arrhythmia'
  | 'genome'
  | 'knowledge'
  | 'library'
  | 'curriculum'
  | 'ask'
  | 'drugs'
  | 'calculators'

type TabDefinition = {
  key: LearnTab
  label: string
  short: string
  component: ComponentType
  description: string
  bagian?: string
}

const TABS: TabDefinition[] = [
  { key: 'body', label: 'Body Exposure', short: 'Body', component: BodyExplorer, description: '3D anatomy, physiology, disease, drugs, imaging, biomechanics and simulation in one body context.' },
  { key: 'discovery', label: 'Discovery', short: 'Discover', component: FrontierHealthOS, description: 'Evidence-grounded questions, hypotheses and research frontiers.' },
  { key: 'innovation', label: 'Innovation', short: 'Innovate', component: RecentInnovationLab, description: 'Turn unmet problems and evidence into testable solution concepts.' },
  { key: 'invention', label: 'Invention', short: 'Invent', component: AtomicSystemsLab, description: 'Explore candidate technologies across organism, organ, cell, molecular and atomic scales.' },
  { key: 'radiology', label: 'Radiology Viewer', short: 'Imaging', component: Radiology, description: 'Clinical imaging learning with standard medical orientation and linked anatomy.' },
  { key: 'arrhythmia', label: 'Arrhythmia Lab', short: 'ECG', component: Electrophysiology, description: 'Electrical physiology and rhythm learning tied to cardiovascular anatomy.' },
  { key: 'genome', label: 'Genome Lab', short: 'Genome', component: GenomeLab, description: 'Genes, variants and molecular context linked back to tissues and organs.' },
  { key: 'knowledge', label: 'Knowledge Bridge', short: 'Bridge', component: KnowledgeBridge, description: 'Connect concepts across anatomy, disease, evidence and mechanisms.' },
  { key: 'library', label: 'Medical Library', short: 'Library', component: MedStudyHub, description: 'Disease notes, cases, skills and medical learning in one library.', bagian: 'library' },
  { key: 'curriculum', label: 'Study Curriculum', short: 'Study', component: MedStudyHub, description: 'Structured study tracks, OSCE and exam-oriented learning.', bagian: 'usmle' },
  { key: 'ask', label: 'Ask Health Question', short: 'Ask', component: ClinicalEvidence, description: 'Turn a clinical question into transparent evidence lookup.' },
  { key: 'drugs', label: 'Drugs & Herbal', short: 'Drugs', component: DrugInfo, description: 'Drug and herbal references, safety, interactions and mechanism context.' },
  { key: 'calculators', label: 'Health Calculators', short: 'Calc', component: ClinicalCalculators, description: 'Clinical and health calculations grouped inside the learning workspace.' },
]

const VALID = new Set(TABS.map((tab) => tab.key))

function WorkspaceLoader() {
  return (
    <div className="grid min-h-[38vh] place-items-center rounded-[28px] border border-white/10 bg-black/10 text-sm font-bold text-neutral-500" role="status">
      Loading learning workspace…
    </div>
  )
}

export function UnifiedLearnWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as LearnTab | null
  const activeKey: LearnTab = requested && VALID.has(requested) ? requested : 'body'
  const active = TABS.find((tab) => tab.key === activeKey) ?? TABS[0]
  const ActiveComponent = active.component

  function select(tab: TabDefinition) {
    const next = new URLSearchParams(params)
    next.set('t', tab.key)
    if (tab.bagian) next.set('bagian', tab.bagian)
    else next.delete('bagian')
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 pb-10">
      <PanaceaZoneNav />
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Panacea Learn · one workspace</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Learn by seeing, manipulating and simulating the human body</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-300">
              One continuous learning room. Anatomy is the visual anchor; disease, drugs, imaging, ECG, genome, evidence, discovery and study tools stay in the same page instead of sending you to separate destinations.
            </p>
          </div>
          <div className="rounded-2xl border border-brand/20 bg-brand/10 px-3 py-2 text-right">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-brand">Current context</div>
            <div className="text-sm font-black text-ink dark:text-white">{active.label}</div>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Learn workspace">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeKey === tab.key}
              onClick={() => select(tab)}
              className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-black transition ${
                activeKey === tab.key
                  ? 'border-brand bg-brand text-white shadow-[0_8px_24px_rgba(0,191,99,.18)]'
                  : 'border-white/10 bg-white/5 text-neutral-600 hover:border-brand/30 hover:bg-brand/5 dark:text-neutral-300'
              }`}
            >
              {tab.short}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          <b className="text-ink dark:text-white">{active.label}:</b> {active.description}
        </div>
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0">
        <Suspense fallback={<WorkspaceLoader />}>
          <ActiveComponent />
        </Suspense>
      </section>
    </div>
  )
}

export default UnifiedLearnWorkspace
