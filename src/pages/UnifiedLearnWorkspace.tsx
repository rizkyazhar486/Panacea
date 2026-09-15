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
  group: 'Visual' | 'Science' | 'Clinical' | 'Study'
  component?: ComponentType
  description: string
  bagian?: string
}

const TABS: TabDefinition[] = [
  { key: 'body', label: 'Body Exposure', short: 'Body', group: 'Visual', description: 'Persistent 3D anatomy, physiology, disease, drug, imaging and biomechanics visual core.' },
  { key: 'radiology', label: 'Radiology Viewer', short: 'Imaging', group: 'Visual', component: Radiology, description: 'Clinical imaging with standard medical orientation beside the anatomical core.' },
  { key: 'arrhythmia', label: 'Arrhythmia Lab', short: 'ECG', group: 'Visual', component: Electrophysiology, description: 'Electrical physiology and rhythm learning connected to heart and body context.' },
  { key: 'discovery', label: 'Discovery', short: 'Discover', group: 'Science', component: FrontierHealthOS, description: 'Evidence-grounded questions, hypotheses and research frontiers interpreted beside the body.' },
  { key: 'innovation', label: 'Innovation', short: 'Innovate', group: 'Science', component: RecentInnovationLab, description: 'Turn unmet problems and evidence into testable solution concepts.' },
  { key: 'invention', label: 'Invention', short: 'Invent', group: 'Science', component: AtomicSystemsLab, description: 'Explore candidate technologies across organism, organ, cell, molecular and atomic scales.' },
  { key: 'genome', label: 'Genome Lab', short: 'Genome', group: 'Science', component: GenomeLab, description: 'Genes, variants and molecular context interpreted back toward tissues and organs.' },
  { key: 'knowledge', label: 'Knowledge Bridge', short: 'Bridge', group: 'Clinical', component: KnowledgeBridge, description: 'Connect anatomy, disease, evidence and mechanisms inside one workspace.' },
  { key: 'ask', label: 'Ask Health Question', short: 'Evidence', group: 'Clinical', component: ClinicalEvidence, description: 'Turn a clinical question into transparent evidence lookup without leaving Learn.' },
  { key: 'drugs', label: 'Drugs & Herbal', short: 'Drugs', group: 'Clinical', component: DrugInfo, description: 'Drug, herbal, interaction and mechanism context beside the anatomy where effects occur.' },
  { key: 'calculators', label: 'Health Calculators', short: 'Calc', group: 'Clinical', component: ClinicalCalculators, description: 'Clinical and health calculations without breaking visual learning context.' },
  { key: 'library', label: 'Medical Library', short: 'Library', group: 'Study', component: MedStudyHub, description: 'Disease notes and skills beside the visual body instead of replacing it.', bagian: 'library' },
  { key: 'cases', label: 'Cases & Exam Practice', short: 'Cases', group: 'Study', component: OsceUkmppd, description: 'OSCE and case-bank practice beside anatomy, imaging, disease and drugs.' },
  { key: 'curriculum', label: 'Study Curriculum', short: 'Study', group: 'Study', component: MedStudyHub, description: 'Structured study tracks and exam-oriented learning inside the same environment.', bagian: 'usmle' },
]

const VALID = new Set(TABS.map((tab) => tab.key))

function WorkspaceLoader({ label = 'learning workspace' }: { label?: string }) {
  return (
    <div className="relative grid min-h-[38vh] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-neutral-950/60 text-sm font-bold text-neutral-400" role="status" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand shadow-[0_0_18px_rgba(0,191,99,.7)]" />
        Loading {label}…
      </div>
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
    <div className="mx-auto w-full max-w-[1520px] space-y-3 pb-8 sm:space-y-4 sm:pb-10">
      <PanaceaZoneNav />

      <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-neutral-950/70 p-3 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.24em] text-brand sm:text-[10px]">Panacea Learn · body-first biomedical intelligence</div>
            <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-.035em] text-white sm:text-3xl">See the body. Change the layer. Follow the mechanism.</h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
              Body Exposure remains the visual anchor while imaging, physiology, genome, evidence, cases, drugs, discovery, innovation and invention open around it as connected instruments.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-[16px] border border-brand/20 bg-brand/[.08] px-3 py-2 lg:self-auto">
            <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_14px_rgba(0,191,99,.75)]" />
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.18em] text-brand">{active.group}</div>
              <div className="text-xs font-black text-white">{active.label}</div>
            </div>
          </div>
        </div>

        <div className="no-scrollbar relative mt-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" role="tablist" aria-label="Learn workspace">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeKey === tab.key}
              aria-controls={`learn-panel-${tab.key}`}
              onClick={() => select(tab)}
              className={`min-h-[42px] shrink-0 snap-start rounded-[15px] border px-3.5 text-[11px] font-black transition duration-200 sm:min-h-[44px] sm:rounded-[16px] sm:px-4 sm:text-xs ${
                activeKey === tab.key
                  ? 'border-brand/70 bg-brand text-white shadow-[0_8px_26px_rgba(0,191,99,.22)]'
                  : 'border-white/[.08] bg-white/[.035] text-neutral-400 hover:border-white/15 hover:bg-white/[.07] hover:text-white'
              }`}
            >
              {tab.short}
            </button>
          ))}
        </div>

        <div className="relative mt-2.5 flex items-start gap-2 rounded-[16px] border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-400 sm:mt-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
          <span><b className="text-neutral-100">{active.label}.</b> {active.description}</span>
        </div>
      </section>

      <section aria-label="Persistent Body Exposure visual core" className="min-w-0 overflow-hidden rounded-[24px] border border-white/[.08] bg-black/[.16] p-1 sm:rounded-[28px] sm:p-2">
        <Suspense fallback={<WorkspaceLoader label="Body Exposure" />}>
          <BodyExplorer />
        </Suspense>
      </section>

      {ActiveComponent && (
        <section
          id={`learn-panel-${active.key}`}
          role="tabpanel"
          aria-label={active.label}
          className="min-w-0 overflow-hidden rounded-[24px] border border-white/[.08] bg-black/[.16] p-1 sm:rounded-[28px] sm:p-2"
        >
          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1 sm:px-3">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-brand sm:text-[10px]">Connected instrument · {active.label}</div>
            <div className="hidden text-[9px] font-bold text-neutral-600 sm:block">Body Exposure stays active above</div>
          </div>
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
