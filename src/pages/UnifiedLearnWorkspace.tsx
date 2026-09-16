import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'

const BodyExplorer = lazy(() => import('./BodyExplorer').then((m) => ({ default: m.BodyExplorer })))
const FrontierHealthOS = lazy(() => import('./FrontierHealthOS').then((m) => ({ default: m.FrontierHealthOS })))
const RecentInnovationLab = lazy(() => import('./RecentInnovationLab').then((m) => ({ default: m.RecentInnovationLab })))
const AtomicSystemsLab = lazy(() => import('./bodyhub/AtomicSystemsLab').then((m) => ({ default: m.AtomicSystemsLab })))
const Radiology = lazy(() => import('./Radiology').then((m) => ({ default: m.Radiology })))
const Electrophysiology = lazy(() => import('./Electrophysiology').then((m) => ({ default: m.Electrophysiology })))
const GenomeLab = lazy(() => import('./GenomeLab').then((m) => ({ default: m.GenomeLab })))
const KnowledgeBridge = lazy(() => import('./KnowledgeBridge').then((m) => ({ default: m.KnowledgeBridge })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const OsceUkmppd = lazy(() => import('./OsceUkmppd').then((m) => ({ default: m.OsceUkmppd })))
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
  | 'cases'
  | 'curriculum'
  | 'ask'
  | 'drugs'
  | 'calculators'

type TabDefinition = {
  key: LearnTab
  label: string
  short: string
  component?: ComponentType
  description: string
  bagian?: string
}

const TABS: TabDefinition[] = [
  { key: 'body', label: 'Body Exposure', short: 'Body', description: 'The persistent 3D anatomy, physiology, disease, drug, imaging and biomechanics visual core.' },
  { key: 'discovery', label: 'Discovery', short: 'Discover', component: FrontierHealthOS, description: 'Evidence-grounded questions, hypotheses and research frontiers interpreted beside the visual body.' },
  { key: 'innovation', label: 'Innovation', short: 'Innovate', component: RecentInnovationLab, description: 'Turn unmet problems and evidence into testable solution concepts without leaving the visual learning room.' },
  { key: 'invention', label: 'Invention', short: 'Invent', component: AtomicSystemsLab, description: 'Explore candidate technologies across organism, organ, cell, molecular and atomic scales.' },
  { key: 'radiology', label: 'Radiology Viewer', short: 'Imaging', component: Radiology, description: 'Clinical imaging learning with standard medical orientation while Body Exposure remains the anatomical anchor.' },
  { key: 'arrhythmia', label: 'Arrhythmia Lab', short: 'ECG', component: Electrophysiology, description: 'Electrical physiology and rhythm learning in the same heart/body context.' },
  { key: 'genome', label: 'Genome Lab', short: 'Genome', component: GenomeLab, description: 'Genes, variants and molecular context interpreted back toward tissues and organs.' },
  { key: 'knowledge', label: 'Knowledge Bridge', short: 'Bridge', component: KnowledgeBridge, description: 'Connect anatomy, disease, evidence and mechanisms inside the same workspace.' },
  { key: 'library', label: 'Medical Library', short: 'Library', component: MedStudyHub, description: 'Disease notes and skills used beside the visual body instead of replacing it.', bagian: 'library' },
  { key: 'cases', label: 'Cases & Exam Practice', short: 'Cases', component: OsceUkmppd, description: 'OSCE and case-bank practice remains inside the same visual learning environment so a case can be studied beside anatomy, imaging, disease and drugs.' },
  { key: 'curriculum', label: 'Study Curriculum', short: 'Study', component: MedStudyHub, description: 'Structured study tracks and exam-oriented learning inside the same learning environment.', bagian: 'usmle' },
  { key: 'ask', label: 'Ask Health Question', short: 'Ask', component: ClinicalEvidence, description: 'Turn a clinical question into transparent evidence lookup without leaving Learn.' },
  { key: 'drugs', label: 'Drugs & Herbal', short: 'Drugs', component: DrugInfo, description: 'Drug and herbal references, safety, interactions and mechanism context beside the body where effects occur.' },
  { key: 'calculators', label: 'Health Calculators', short: 'Calc', component: ClinicalCalculators, description: 'Clinical and health calculations used without breaking the visual learning context.' },
]

const VALID = new Set(TABS.map((tab) => tab.key))

function WorkspaceLoader({ label = 'learning workspace' }: { label?: string }) {
  return (
    <div className="grid min-h-[38vh] place-items-center rounded-[28px] border border-white/10 bg-black/10 text-sm font-bold text-neutral-500" role="status">
      Loading {label}…
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
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Panacea Learn · one visual simulation workspace</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Learn by seeing, manipulating and simulating the human body</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-300">
              Body Exposure no longer behaves like a link that disappears when another tool opens. The body stays as the visual core; imaging, ECG, genome, drugs, disease notes, cases, evidence, discovery, innovation and invention open as learning instruments in the same page.
            </p>
          </div>
          <div className="rounded-2xl border border-brand/20 bg-brand/10 px-3 py-2 text-right">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-brand">Active learning instrument</div>
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

      <section aria-label="Persistent Body Exposure visual core" className="min-w-0">
        <Suspense fallback={<WorkspaceLoader label="Body Exposure" />}>
          <BodyExplorer />
        </Suspense>
      </section>

      {ActiveComponent && (
        <section role="tabpanel" aria-label={active.label} className="min-w-0 rounded-[30px] border border-white/10 bg-white/[.02] p-2 sm:p-3">
          <div className="mb-2 px-2 pt-1 text-[10px] font-black uppercase tracking-[.18em] text-brand">Learning instrument · {active.label}</div>
          <Suspense fallback={<WorkspaceLoader label={active.label} />}>
            <ActiveComponent />
          </Suspense>
        </section>
      )}

      <FeatureBoulevard zone="learn" title="Learn feature boulevard" />
    </div>
  )
}

export default UnifiedLearnWorkspace
